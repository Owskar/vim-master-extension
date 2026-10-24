const assert = require('node:assert/strict');
const Module = require('node:module');
const { test } = require('node:test');
const GAMES = require('../src/games/index');
const { LESSONS } = require('../src/lessons');

function loadPanel(modulePath, vscodeStub) {
  const resolvedPath = require.resolve(modulePath);
  const originalLoad = Module._load;
  delete require.cache[resolvedPath];
  Module._load = function (request, parent, isMain) {
    if (request === 'vscode') return vscodeStub;
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return require(resolvedPath);
  } finally {
    Module._load = originalLoad;
    delete require.cache[resolvedPath];
  }
}

async function withVscodeStub(vscodeStub, callback) {
  const originalLoad = Module._load;
  const welcomePath = require.resolve('../src/panels/welcome');
  const cachedWelcome = require.cache[welcomePath];
  Module._load = function (request, parent, isMain) {
    if (request === 'vscode') return vscodeStub;
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return await callback();
  } finally {
    Module._load = originalLoad;
    if (cachedWelcome) require.cache[welcomePath] = cachedWelcome;
    else delete require.cache[welcomePath];
  }
}

function createPanelHarness() {
  const panels = [];
  function createPanel() {
    let messageHandler;
    let disposeHandler;
    return {
      webview: {
        html: '',
        onDidReceiveMessage(handler) {
          messageHandler = handler;
        }
      },
      onDidDispose(handler) {
        disposeHandler = handler;
      },
      reveal() {},
      dispose() {
        if (disposeHandler) disposeHandler();
      },
      sendMessage(message) {
        return messageHandler(message);
      }
    };
  }
  const informationMessages = [];
  const errorMessages = [];
  const vscode = {
    TreeItem: class {},
    ViewColumn: { One: 1 },
    window: {
      createWebviewPanel() {
        const panel = createPanel();
        panels.push(panel);
        return panel;
      },
      showInformationMessage(message) { informationMessages.push(message); },
      showErrorMessage(message) { errorMessages.push(message); }
    }
  };
  const state = new Map();
  const updates = [];
  const context = {
    globalState: {
      get(key, defaultValue) {
        return state.has(key) ? state.get(key) : defaultValue;
      },
      async update(key, value) {
        updates.push([key, value]);
        state.set(key, value);
      }
    }
  };

  return {
    context,
    informationMessages,
    errorMessages,
    state,
    updates,
    vscode,
    panels,
    get panel() { return panels.at(-1); },
    get messageHandler() { return panels.at(-1) && panels.at(-1).sendMessage; }
  };
}

const RESET_KEYS = [
  'vimquest.completed',
  'vimquest.streak',
  'vimquest.lastDay',
  'vimquest.dailyXP',
  'vimquest.dailyCompleted',
  ...GAMES.map(game => `vimquest.best.${game.id}`)
];

function seedProgressForReset(harness) {
  const values = new Map([
    ['vimquest.completed', [LESSONS[0].id]],
    ['vimquest.streak', 8],
    ['vimquest.lastDay', 'yesterday'],
    ['vimquest.dailyXP', 75],
    ['vimquest.dailyCompleted', new Date().toDateString()]
  ]);
  GAMES.forEach((game, index) => values.set(`vimquest.best.${game.id}`, 40 + index));
  for (const [key, value] of values) harness.state.set(key, value);
  return values;
}

function assertProgressWasReset(harness) {
  assert.deepEqual(harness.state.get('vimquest.completed'), []);
  assert.equal(harness.state.get('vimquest.streak'), 0);
  assert.equal(harness.state.get('vimquest.lastDay'), '');
  assert.equal(harness.state.get('vimquest.dailyXP'), 0);
  assert.equal(harness.state.get('vimquest.dailyCompleted'), '');
  for (const game of GAMES) {
    assert.equal(harness.state.get(`vimquest.best.${game.id}`), 0, `${game.id} best score should reset`);
  }
}

function assertGenericFailureFeedback(harness) {
  assert.equal(harness.errorMessages.length, 1, 'the user should see a failure message');
  assert.match(harness.errorMessages[0], /failed|unable|could not/i);
  assert.doesNotMatch(harness.errorMessages[0], /partial/i);
}

function assertPartialStateWarning(harness) {
  assert.equal(harness.errorMessages.length, 1, 'the user should see a failure message');
  assert.match(harness.errorMessages[0], /partial/i, 'the user should be warned about partial progress');
}

function createExtensionHarness() {
  const harness = createPanelHarness();
  const commands = new Map();
  const treeViews = [];
  harness.context.subscriptions = [];
  harness.vscode.TreeItemCollapsibleState = { None: 0, Expanded: 1 };
  harness.vscode.ThemeIcon = class {};
  harness.vscode.ThemeColor = class {};
  harness.vscode.EventEmitter = class {
    constructor() { this.event = () => {}; }
    fire() {}
  };
  harness.vscode.commands = {
    registerCommand(name, handler) {
      commands.set(name, handler);
      return { dispose() {} };
    }
  };
  harness.vscode.window.createTreeView = (id, options) => {
    treeViews.push({ id, provider: options.treeDataProvider });
    return {};
  };
  harness.vscode.window.showWarningMessage = async () => 'Yes, reset';
  harness.commands = commands;
  harness.treeViews = treeViews;
  return harness;
}

test('withProgressMutation serializes concurrent operations and recovers after rejection', async () => {
  const { withProgressMutation } = loadPanel('../src/sidebar', { TreeItem: class {} });
  assert.equal(typeof withProgressMutation, 'function');

  let releaseFirst;
  let markFirstStarted;
  const firstGate = new Promise(resolve => { releaseFirst = resolve; });
  const firstStarted = new Promise(resolve => { markFirstStarted = resolve; });
  const events = [];
  const first = withProgressMutation(async () => {
    events.push('first:start');
    markFirstStarted();
    await firstGate;
    events.push('first:reject');
    throw new Error('simulated mutation failure');
  });
  const second = withProgressMutation(async () => {
    events.push('second:start');
    return 'completed';
  });

  await firstStarted;
  assert.deepEqual(events, ['first:start']);
  releaseFirst();
  await assert.rejects(first, /simulated mutation failure/);
  assert.equal(await second, 'completed');
  assert.deepEqual(events, ['first:start', 'first:reject', 'second:start']);
});

test('daily completion and progress reset do not overlap state updates', async () => {
  const harness = createPanelHarness();
  const originalUpdate = harness.context.globalState.update.bind(harness.context.globalState);
  let activeUpdates = 0;
  let maxActiveUpdates = 0;
  const activeKeys = new Set();
  const overlappingUpdates = [];
  harness.context.globalState.update = async (key, value) => {
    if (activeUpdates > 0) overlappingUpdates.push([[...activeKeys], key]);
    activeUpdates++;
    maxActiveUpdates = Math.max(maxActiveUpdates, activeUpdates);
    activeKeys.add(key);
    try {
      await new Promise(resolve => setImmediate(resolve));
      await originalUpdate(key, value);
    } finally {
      activeUpdates--;
      activeKeys.delete(key);
    }
  };

  const { resetProgress } = loadPanel('../src/sidebar', { TreeItem: class {} });
  const { getDailyPanel } = loadPanel('../src/panels/daily', harness.vscode);
  getDailyPanel(harness.context, { progress: { refresh() {} } });

  await withVscodeStub(harness.vscode, async () => {
    await Promise.all([
      harness.messageHandler({ command: 'complete' }),
      resetProgress(harness.context)
    ]);
  });

  assert.equal(maxActiveUpdates, 1, `progress operations should serialize their state writes: ${JSON.stringify(overlappingUpdates)}`);
  assertProgressWasReset(harness);
});

test('daily completion remains idempotent after disposing and reopening the panel', async () => {
  const harness = createPanelHarness();
  const { getDailyPanel } = loadPanel('../src/panels/daily', harness.vscode);
  const progress = { refresh() {} };
  getDailyPanel(harness.context, { progress });

  const xpMatch = harness.panel.webview.html.match(/<div class="xp-num">\+(\d+)<\/div>/);
  assert.ok(xpMatch, 'daily challenge HTML should expose its XP reward');
  const reward = Number(xpMatch[1]);

  await withVscodeStub(harness.vscode, () => Promise.all([
    harness.messageHandler({ command: 'complete' }),
    harness.messageHandler({ command: 'complete' })
  ]));
  const firstPanel = harness.panel;
  firstPanel.dispose();

  getDailyPanel(harness.context, { progress });
  assert.notEqual(harness.panel, firstPanel, 'reopening should create a fresh panel');
  await withVscodeStub(harness.vscode, () => harness.messageHandler({ command: 'complete' }));

  assert.equal(harness.state.get('vimquest.dailyXP'), reward);
  assert.equal(harness.updates.filter(([key]) => key === 'vimquest.dailyXP').length, 1);
  assert.equal(harness.state.get('vimquest.dailyCompleted'), new Date().toDateString());
});

test('daily panel refreshes across midnight before awarding the new challenge', async () => {
  const RealDate = Date;
  let currentTime = new RealDate(2026, 0, 4, 23, 59).getTime();
  const nextDay = new RealDate(2026, 0, 5, 0, 1);
  global.Date = class extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [currentTime]));
    }

    static now() {
      return currentTime;
    }
  };

  try {
    const harness = createPanelHarness();
    const { getDailyPanel } = loadPanel('../src/panels/daily', harness.vscode);
    const initialXP = 13;
    harness.state.set('vimquest.dailyXP', initialXP);
    getDailyPanel(harness.context, { progress: { refresh() {} } });

    const initialHtml = harness.panel.webview.html;
    const initialTitle = initialHtml.match(/class="ch-title">([^<]+)<\/div>/)[1];
    const initialDate = new RealDate(currentTime).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
    assert.ok(initialHtml.includes(initialDate));

    currentTime = nextDay.getTime();
    await withVscodeStub(harness.vscode, () => harness.messageHandler({ command: 'complete' }));

    const refreshedHtml = harness.panel.webview.html;
    const currentTitle = refreshedHtml.match(/class="ch-title">([^<]+)<\/div>/)[1];
    const currentReward = Number(refreshedHtml.match(/<div class="xp-num">\+(\d+)<\/div>/)[1]);
    const currentDate = nextDay.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
    assert.notEqual(currentTitle, initialTitle, 'the next local date should show its challenge');
    assert.ok(refreshedHtml.includes(currentDate), 'the rendered date should advance');
    assert.equal(harness.state.get('vimquest.dailyXP'), initialXP);
    assert.equal(harness.updates.filter(([key]) => key === 'vimquest.dailyXP').length, 0);

    await withVscodeStub(harness.vscode, () => harness.messageHandler({ command: 'complete' }));

    assert.equal(harness.state.get('vimquest.dailyXP'), initialXP + currentReward);
    assert.equal(harness.updates.filter(([key]) => key === 'vimquest.dailyXP').length, 1);
    assert.equal(harness.state.get('vimquest.dailyCompleted'), nextDay.toDateString());
  } finally {
    global.Date = RealDate;
  }
});

test('daily completion rejects an unsafe XP total without mutating progress and shows failure feedback', async () => {
  const harness = createPanelHarness();
  const initialValues = new Map([
    ['vimquest.dailyXP', Number.MAX_SAFE_INTEGER],
    ['vimquest.streak', 2],
    ['vimquest.lastDay', 'yesterday'],
    ['vimquest.dailyCompleted', '']
  ]);
  for (const [key, value] of initialValues) harness.state.set(key, value);

  const { getDailyPanel } = loadPanel('../src/panels/daily', harness.vscode);
  getDailyPanel(harness.context, { progress: { refresh() {} } });

  await withVscodeStub(harness.vscode, () => assert.rejects(
    harness.messageHandler({ command: 'complete' }),
    /outside the supported range|safe|overflow|maximum/i
  ));

  assert.deepEqual(
    new Map([...initialValues.keys()].map(key => [key, harness.state.get(key)])),
    initialValues
  );
  assert.equal(harness.updates.length, 0, 'an unsafe reward must be rejected before persistence');
  assert.equal(harness.errorMessages.length, 1, 'the user should see failure feedback');
  assert.ok(harness.errorMessages[0].trim());
  assert.doesNotMatch(harness.errorMessages[0], /partial/i);
  assert.equal(harness.state.get('vimquest.dailyCompleted'), '');
});

test('daily completion rolls back partial persistence and can be retried once', async () => {
  const harness = createPanelHarness();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();
  harness.state.set('vimquest.dailyXP', 7);
  harness.state.set('vimquest.streak', 2);
  harness.state.set('vimquest.lastDay', yesterdayStr);
  harness.state.set('vimquest.dailyCompleted', yesterdayStr);

  const originalUpdate = harness.context.globalState.update.bind(harness.context.globalState);
  const attemptedUpdates = [];
  let failLastDayWrite = true;
  harness.context.globalState.update = async (key, value) => {
    attemptedUpdates.push([key, value]);
    if (failLastDayWrite && key === 'vimquest.lastDay' && value === todayStr) {
      failLastDayWrite = false;
      throw new Error('simulated lastDay persistence failure');
    }
    await originalUpdate(key, value);
  };

  const { getDailyPanel } = loadPanel('../src/panels/daily', harness.vscode);
  getDailyPanel(harness.context, { progress: { refresh() {} } });
  const reward = Number(harness.panel.webview.html.match(/<div class="xp-num">\+(\d+)<\/div>/)[1]);

  await withVscodeStub(harness.vscode, () => assert.rejects(
    harness.messageHandler({ command: 'complete' }),
    /simulated lastDay persistence failure/
  ));
  assert.deepEqual(attemptedUpdates.map(([key]) => key), [
    'vimquest.dailyXP',
    'vimquest.streak',
    'vimquest.lastDay',
    'vimquest.dailyXP',
    'vimquest.streak',
    'vimquest.lastDay',
    'vimquest.dailyCompleted'
  ]);
  assert.equal(harness.state.get('vimquest.dailyXP'), 7);
  assert.equal(harness.state.get('vimquest.streak'), 2);
  assert.equal(harness.state.get('vimquest.lastDay'), yesterdayStr);
  assert.equal(harness.state.get('vimquest.dailyCompleted'), yesterdayStr);
  assertGenericFailureFeedback(harness);

  await withVscodeStub(harness.vscode, async () => {
    await harness.messageHandler({ command: 'complete' });
    await harness.messageHandler({ command: 'complete' });
  });

  assert.equal(harness.state.get('vimquest.dailyXP'), 7 + reward);
  assert.equal(harness.state.get('vimquest.streak'), 3);
  assert.equal(harness.state.get('vimquest.lastDay'), todayStr);
  assert.equal(harness.state.get('vimquest.dailyCompleted'), todayStr);
  assert.equal(harness.updates.filter(([key]) => key === 'vimquest.dailyXP').length, 3);
  assert.equal(harness.informationMessages.length, 1);
  assert.equal(harness.errorMessages.length, 1, 'the earlier failed attempt should remain visible');
});

test('daily completion warns when rollback persistence fails and preserves the original error', async () => {
  const harness = createPanelHarness();
  const todayStr = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  harness.state.set('vimquest.dailyXP', 7);
  harness.state.set('vimquest.streak', 2);
  harness.state.set('vimquest.lastDay', yesterdayStr);
  harness.state.set('vimquest.dailyCompleted', yesterdayStr);

  const originalError = new Error('simulated daily persistence failure');
  const originalUpdate = harness.context.globalState.update.bind(harness.context.globalState);
  harness.context.globalState.update = async (key, value) => {
    if (key === 'vimquest.lastDay' && value === todayStr) throw originalError;
    if (key === 'vimquest.dailyXP' && value === 7) {
      throw new Error('simulated daily rollback persistence failure');
    }
    await originalUpdate(key, value);
  };

  const { getDailyPanel } = loadPanel('../src/panels/daily', harness.vscode);
  getDailyPanel(harness.context, { progress: { refresh() {} } });

  await withVscodeStub(harness.vscode, async () => {
    await assert.rejects(harness.messageHandler({ command: 'complete' }), error => error === originalError);
  });
  assertPartialStateWarning(harness);
});

test('reopening the active daily panel reflects a progress reset', () => {
  const harness = createPanelHarness();
  const today = new Date().toDateString();
  harness.state.set('vimquest.dailyXP', 75);
  harness.state.set('vimquest.dailyCompleted', today);
  const { getDailyPanel } = loadPanel('../src/panels/daily', harness.vscode);
  getDailyPanel(harness.context, { progress: { refresh() {} } });
  const panel = harness.panel;
  assert.match(panel.webview.html, /Challenge Complete!/);

  harness.state.set('vimquest.dailyXP', 0);
  harness.state.set('vimquest.dailyCompleted', '');
  getDailyPanel(harness.context, { progress: { refresh() {} } });

  assert.equal(harness.panel, panel, 'reopening should reuse the active panel');
  assert.doesNotMatch(panel.webview.html, /Challenge Complete!/);
  assert.match(panel.webview.html, /Mark Complete \+/);
});

test('getTotalXP adds completed lesson and daily XP, ignoring invalid daily XP', () => {
  const vscode = { TreeItem: class {} };
  const { getTotalXP } = loadPanel('../src/sidebar', vscode);
  const lesson = LESSONS[0];
  const harness = createPanelHarness();
  harness.state.set('vimquest.completed', [lesson.id]);
  harness.state.set('vimquest.dailyXP', 25);

  assert.equal(getTotalXP(harness.context), lesson.xp + 25);

  harness.state.set('vimquest.dailyXP', Number.MAX_SAFE_INTEGER - lesson.xp + 1);
  assert.equal(getTotalXP(harness.context), Number.MAX_SAFE_INTEGER);

  harness.state.set('vimquest.dailyXP', -1);
  assert.equal(getTotalXP(harness.context), lesson.xp);

  harness.state.set('vimquest.dailyXP', Number.MAX_SAFE_INTEGER + 1);
  assert.equal(getTotalXP(harness.context), lesson.xp);

  harness.state.set('vimquest.dailyXP', '25');
  assert.equal(getTotalXP(harness.context), lesson.xp);
});

test('welcome panel refreshes the daily status when an existing panel is reopened', () => {
  const harness = createPanelHarness();
  const { getWelcomePanel } = loadPanel('../src/panels/welcome', harness.vscode);
  getWelcomePanel(harness.context, {});
  const panel = harness.panel;
  const initialHtml = panel.webview.html;
  assert.equal((initialHtml.match(/class="daily-done"/g) || []).length, 0);

  harness.state.set('vimquest.dailyCompleted', new Date().toDateString());
  getWelcomePanel(harness.context, {});

  assert.equal(harness.panel, panel, 'reopening should reveal the existing panel');
  assert.notEqual(panel.webview.html, initialHtml, 'reopening should refresh the panel HTML');
  assert.equal((panel.webview.html.match(/class="daily-done"/g) || []).length, 1);
});

test('reopening an active welcome panel reflects daily XP earned in the daily panel', async () => {
  const harness = createPanelHarness();
  const initialXP = 10;
  harness.state.set('vimquest.dailyXP', initialXP);
  const { getWelcomePanel } = loadPanel('../src/panels/welcome', harness.vscode);
  getWelcomePanel(harness.context, {});
  const welcomePanel = harness.panel;

  const { getDailyPanel } = loadPanel('../src/panels/daily', harness.vscode);
  getDailyPanel(harness.context, { progress: { refresh() {} } });
  const dailyPanel = harness.panel;
  const reward = Number(dailyPanel.webview.html.match(/<div class="xp-num">\+(\d+)<\/div>/)[1]);
  await withVscodeStub(harness.vscode, () => dailyPanel.sendMessage({ command: 'complete' }));
  getWelcomePanel(harness.context, {});

  const displayedXP = welcomePanel.webview.html.match(/class="stat-val xpv">⚡ (\d+)<\/div>/);
  assert.ok(displayedXP, 'welcome panel should render its total XP stat');
  assert.equal(harness.panels.length, 2, 'reopening should reuse the existing welcome panel');
  assert.equal(Number(displayedXP[1]), initialXP + reward);
});

test('lesson completion restores persisted state when a state update fails', async () => {
  const harness = createPanelHarness();
  const lesson = LESSONS[0];
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  harness.state.set('vimquest.completed', []);
  harness.state.set('vimquest.streak', 4);
  harness.state.set('vimquest.lastDay', yesterday.toDateString());

  const originalUpdate = harness.context.globalState.update.bind(harness.context.globalState);
  harness.context.globalState.update = async (key, value) => {
    if (key === 'vimquest.streak' && value === 5) {
      throw new Error('simulated lesson persistence failure');
    }
    await originalUpdate(key, value);
  };

  const { getLessonPanel } = loadPanel('../src/panels/lesson', harness.vscode);
  getLessonPanel(harness.context, lesson.id, {
    lessons: { refresh() {} },
    progress: { refresh() {} }
  });

  await assert.rejects(harness.messageHandler({ command: 'complete' }), /simulated lesson persistence failure/);
  assert.deepEqual(harness.state.get('vimquest.completed'), []);
  assert.equal(harness.state.get('vimquest.streak'), 4);
  assert.equal(harness.state.get('vimquest.lastDay'), yesterday.toDateString());
  assert.notEqual(harness.state.get('vimquest.lastDay'), today);
  assertGenericFailureFeedback(harness);
});

test('lesson completion warns when rollback persistence fails and preserves the original error', async () => {
  const harness = createPanelHarness();
  const lesson = LESSONS[0];
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  harness.state.set('vimquest.completed', []);
  harness.state.set('vimquest.streak', 4);
  harness.state.set('vimquest.lastDay', yesterdayStr);

  const originalError = new Error('simulated lesson persistence failure');
  const originalUpdate = harness.context.globalState.update.bind(harness.context.globalState);
  harness.context.globalState.update = async (key, value) => {
    if (key === 'vimquest.lastDay' && value === today) throw originalError;
    if (key === 'vimquest.streak' && value === 4) {
      throw new Error('simulated lesson rollback persistence failure');
    }
    await originalUpdate(key, value);
  };

  const { getLessonPanel } = loadPanel('../src/panels/lesson', harness.vscode);
  getLessonPanel(harness.context, lesson.id, {
    lessons: { refresh() {} },
    progress: { refresh() {} }
  });

  await assert.rejects(harness.messageHandler({ command: 'complete' }), error => error === originalError);
  assertPartialStateWarning(harness);
});

test('accepted welcome reset clears all progress and refreshes the active welcome panel', async () => {
  const harness = createPanelHarness();
  seedProgressForReset(harness);
  harness.vscode.window.showWarningMessage = async () => 'Yes, reset';
  const { getWelcomePanel } = loadPanel('../src/panels/welcome', harness.vscode);
  const refreshes = { lessons: 0, progress: 0 };
  getWelcomePanel(harness.context, {
    lessons: { refresh() { refreshes.lessons++; } },
    progress: { refresh() { refreshes.progress++; } }
  });

  const beforeReset = harness.panel.webview.html;
  assert.match(beforeReset, /class="daily-done"/);
  await harness.messageHandler({ command: 'resetProgress' });

  assertProgressWasReset(harness);
  assert.doesNotMatch(harness.panel.webview.html, /class="daily-done"/);
  assert.equal(refreshes.lessons, 1);
  assert.equal(refreshes.progress, 1);
});

test('accepted command reset clears all progress and refreshes visible panels', async () => {
  const harness = createExtensionHarness();
  seedProgressForReset(harness);
  harness.state.set('vimquest.lastDay', new Date().toDateString());
  harness.state.set('vimquest.hasLaunched', true);
  for (const modulePath of [
    '../src/sidebar',
    '../src/panels/lesson',
    '../src/panels/game',
    '../src/panels/welcome',
    '../src/panels/cheatsheet',
    '../src/panels/daily'
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }
  const { activate } = loadPanel('../src/extension', harness.vscode);
  activate(harness.context);

  const refreshes = new Map();
  for (const { id, provider } of harness.treeViews) {
    const originalRefresh = provider.refresh.bind(provider);
    refreshes.set(id, 0);
    provider.refresh = () => {
      refreshes.set(id, refreshes.get(id) + 1);
      originalRefresh();
    };
  }

  const daily = require('../src/panels/daily');
  const welcome = require('../src/panels/welcome');
  daily.getDailyPanel(harness.context, { progress: { refresh() {} } });
  const dailyPanel = harness.panel;
  welcome.getWelcomePanel(harness.context, {});
  const welcomePanel = harness.panel;
  assert.match(dailyPanel.webview.html, /Already Done Today/);
  assert.match(welcomePanel.webview.html, /class="daily-done"/);

  await harness.commands.get('vimquest.resetProgress')();

  assertProgressWasReset(harness);
  assert.match(dailyPanel.webview.html, /Mark Complete \+/);
  assert.doesNotMatch(welcomePanel.webview.html, /class="daily-done"/);
  assert.equal(refreshes.get('vimquest.lessonsView'), 1);
  assert.equal(refreshes.get('vimquest.progressView'), 1);
});

test('reset restores all progress keys when a global state update fails', async () => {
  const harness = createPanelHarness();
  const initialValues = seedProgressForReset(harness);
  const originalUpdate = harness.context.globalState.update.bind(harness.context.globalState);
  let failDailyXPWrite = true;
  harness.context.globalState.update = async (key, value) => {
    if (failDailyXPWrite && key === 'vimquest.dailyXP' && value === 0) {
      failDailyXPWrite = false;
      throw new Error('simulated reset persistence failure');
    }
    await originalUpdate(key, value);
  };

  const { resetProgress } = loadPanel('../src/sidebar', harness.vscode);

  await assert.rejects(
    resetProgress(harness.context),
    /simulated reset persistence failure/
  );
  assert.deepEqual(
    new Map(RESET_KEYS.map(key => [key, harness.state.get(key)])),
    initialValues
  );
  assertGenericFailureFeedback(harness);
});

test('game score writes serialize with reset so a completed reset clears the score', async () => {
  const harness = createPanelHarness();
  const originalUpdate = harness.context.globalState.update.bind(harness.context.globalState);
  const gameId = GAMES[0].id;
  let releaseScoreUpdate;
  let markScoreUpdateStarted;
  const scoreUpdateGate = new Promise(resolve => { releaseScoreUpdate = resolve; });
  const scoreUpdateStarted = new Promise(resolve => { markScoreUpdateStarted = resolve; });
  const resetUpdates = [];
  harness.context.globalState.update = async (key, value) => {
    if (key === `vimquest.best.${gameId}` && value === 42) {
      markScoreUpdateStarted();
      await scoreUpdateGate;
    } else {
      resetUpdates.push(key);
    }
    await originalUpdate(key, value);
  };

  const { resetProgress } = loadPanel('../src/sidebar', { TreeItem: class {} });
  const { getGamePanel } = loadPanel('../src/panels/game', harness.vscode);
  getGamePanel(harness.context, {});

  const scoreSave = harness.messageHandler({ command: 'saveScore', game: gameId, score: 42 });
  await scoreUpdateStarted;
  const reset = resetProgress(harness.context);
  try {
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(resetUpdates, [], 'reset writes should wait for the in-flight score mutation');
  } finally {
    releaseScoreUpdate();
  }

  await Promise.all([scoreSave, reset]);

  assert.ok(resetUpdates.length > 0, 'reset should persist its cleared progress');
  assert.equal(harness.state.get(`vimquest.best.${gameId}`), 0);
});

test('reset reports rollback failure and rejects with the original update error', async () => {
  const harness = createPanelHarness();
  seedProgressForReset(harness);
  const resetError = new Error('simulated reset persistence failure');
  const rollbackError = new Error('simulated rollback persistence failure');
  const originalUpdate = harness.context.globalState.update.bind(harness.context.globalState);
  harness.context.globalState.update = async (key, value) => {
    if (key === 'vimquest.dailyXP' && value === 0) throw resetError;
    if (key === 'vimquest.dailyXP' && value === 75) throw rollbackError;
    await originalUpdate(key, value);
  };

  const { resetProgress } = loadPanel('../src/sidebar', harness.vscode);

  await assert.rejects(resetProgress(harness.context), error => error === resetError);
  assertPartialStateWarning(harness);
  assert.match(harness.errorMessages[0], /reset/i);
});

test('game score handler ignores unknown games and invalid scores, then accepts a known game score', async () => {
  const harness = createPanelHarness();
  const { getGamePanel } = loadPanel('../src/panels/game', harness.vscode);
  const gameId = GAMES[0].id;
  assert.ok(GAMES.some(game => game.id === gameId), 'accepted game ID should come from the registry');
  getGamePanel(harness.context, {});

  await harness.messageHandler({ command: 'saveScore', game: '__unknown_game__', score: 25 });
  for (const score of [-1, 1.5, 101, 1_000_001]) {
    await harness.messageHandler({ command: 'saveScore', game: gameId, score });
  }

  assert.equal(harness.state.has(`vimquest.best.${gameId}`), false);
  assert.equal(harness.updates.length, 0);
  assert.equal(harness.informationMessages.length, 0);

  await harness.messageHandler({ command: 'saveScore', game: gameId, score: 42 });

  assert.equal(harness.state.get(`vimquest.best.${gameId}`), 42);
  assert.equal(harness.updates.length, 1);
  assert.equal(harness.informationMessages.length, 1);
});

test('game score handler reports a generic error and does not throw when score storage fails', async () => {
  const harness = createPanelHarness();
  harness.context.globalState.update = async () => {
    throw new Error('sensitive storage failure details');
  };
  const { getGamePanel } = loadPanel('../src/panels/game', harness.vscode);
  const gameId = GAMES[0].id;
  getGamePanel(harness.context, {});

  await assert.doesNotReject(
    harness.messageHandler({ command: 'saveScore', game: gameId, score: 42 })
  );

  assertGenericFailureFeedback(harness);
  assert.doesNotMatch(harness.errorMessages[0], /sensitive storage failure details/);
  assert.equal(harness.informationMessages.length, 0);
});