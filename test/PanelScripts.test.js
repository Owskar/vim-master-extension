const assert = require('node:assert/strict');
const Module = require('node:module');
const vm = require('node:vm');
const { test } = require('node:test');
const { LESSONS } = require('../src/data/lessons');

function loadPanel(modulePath) {
  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === 'vscode') return {};
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return require(modulePath);
  } finally {
    Module._load = originalLoad;
  }
}

function extractScript(html, panelName) {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, `${panelName} should contain exactly one inline script`);
  assert.ok(scripts[0][1].trim(), `${panelName} inline script should not be empty`);
  return scripts[0][1];
}

function assertPanelScriptParses(panelName, html) {
  const script = extractScript(html, panelName);
  assert.doesNotThrow(() => new vm.Script(script, { filename: `${panelName}.webview.js` }));
}

function createElement(id) {
  const classes = new Set();
  return {
    id,
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      contains: value => classes.has(value),
      toggle: value => classes.has(value) ? classes.delete(value) : classes.add(value)
    },
    style: {},
    textContent: '',
    value: '',
    disabled: false,
    innerHTML: '',
    addEventListener() {},
    focus() {},
    remove() {}
  };
}

function createDashboardContext(lesson) {
  const elements = new Map();
  const questionOptions = lesson.quiz.map((question, questionIndex) => question.options.map((_, index) => {
    const option = createElement(`qo-${questionIndex}-${index}`);
    return option;
  }));
  const messages = [];
  const doneButton = createElement('donebtn');
  doneButton.disabled = true;

  const document = {
    getElementById(id) {
      if (id === 'donebtn') return doneButton;
      if (!elements.has(id)) elements.set(id, createElement(id));
      return elements.get(id);
    },
    querySelectorAll(selector) {
      const match = selector.match(/^\[id\^="qo-(\d+)-"\]$/);
      return match ? questionOptions[Number(match[1])] || [] : [];
    }
  };
  const window = { addEventListener() {} };
  const context = {
    document,
    window,
    acquireVsCodeApi: () => ({ postMessage: message => messages.push(message) }),
    setTimeout() {},
    clearTimeout() {}
  };
  return { context, doneButton, messages, questionOptions };
}

function createPanelHtml(PanelClass, setup) {
  const panel = Object.create(PanelClass.prototype);
  if (setup) setup(panel);
  return panel._buildHtml();
}

test('DashboardPanel generated inline script parses', () => {
  const { DashboardPanel } = loadPanel('../src/panels/DashboardPanel');
  const panel = Object.create(DashboardPanel.prototype);
  panel._storageManager = { getProgress: () => ({}) };
  panel._initialTab = 'home';

  assertPanelScriptParses('DashboardPanel', panel._buildHtml());
});

test('GamesPanel generated inline script parses', () => {
  const { GamesPanel } = loadPanel('../src/panels/GamesPanel');
  const panel = Object.create(GamesPanel.prototype);

  assertPanelScriptParses('GamesPanel', panel._buildHtml());
});

test('PlaygroundPanel generated inline script parses', () => {
  const { PlaygroundPanel } = loadPanel('../src/panels/PlaygroundPanel');
  const panel = Object.create(PlaygroundPanel.prototype);
  panel._storageManager = { getProgress: () => ({}) };

  assertPanelScriptParses('PlaygroundPanel', panel._buildHtml());
});

test('Dashboard quiz requires correct answers and keeps incorrect answers retryable', () => {
  const { DashboardPanel } = loadPanel('../src/panels/DashboardPanel');
  const lesson = LESSONS.chapters[0].lessons[0];
  const html = createPanelHtml(DashboardPanel, panel => {
    panel._storageManager = { getProgress: () => ({}) };
    panel._initialTab = 'home';
  });
  const { context, doneButton, messages, questionOptions } = createDashboardContext(lesson);
  vm.runInNewContext(extractScript(html, 'DashboardPanel'), context);

  context.window.openLesson(lesson.id);
  lesson.quiz.forEach((question, questionIndex) => {
    const incorrectIndex = (question.answer + 1) % question.options.length;
    context.window.ansQ(questionIndex, incorrectIndex, question.answer);

    assert.equal(doneButton.disabled, true, 'incorrect answers must not enable lesson completion');
    assert.equal(questionOptions[questionIndex][incorrectIndex].style.pointerEvents, undefined,
      'the learner must be able to retry the question after an incorrect answer');
    assert.equal(messages.some(message => message.command === 'completeLesson'), false);

    context.window.ansQ(questionIndex, question.answer, question.answer);
  });

  assert.equal(doneButton.disabled, false, 'all correctly answered questions should enable completion');
  context.window.doComplete();
  const completionMessages = messages.filter(message => message.command === 'completeLesson');
  assert.equal(completionMessages.length, 1);
  assert.equal(completionMessages[0].lessonId, lesson.id);
});

test('Text Sniper locks input at zero lives and leaves a retry action on game over', () => {
  const { GamesPanel } = loadPanel('../src/panels/GamesPanel');
  const html = createPanelHtml(GamesPanel);
  const elements = new Map();
  const messages = [];
  const timeouts = [];
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement(id));
      return elements.get(id);
    },
    querySelectorAll() { return []; }
  };
  const context = {
    document,
    window: { addEventListener() {} },
    acquireVsCodeApi: () => ({ postMessage: message => messages.push(message) }),
    setTimeout: callback => timeouts.push(callback),
    clearTimeout() {},
    Math
  };
  vm.runInNewContext(extractScript(html, 'GamesPanel'), context);

  context.sniperStart();
  const input = document.getElementById('sg-input');
  for (let attempt = 0; attempt < 3; attempt++) {
    input.value = 'not-a-valid-vim-command';
    context.sniperSubmit();
  }

  assert.equal(context.sniper.lives, 0);
  assert.equal(input.disabled, true, 'input should lock when the final life is lost');
  context.sniperSubmit();
  assert.equal(context.sniper.lives, 0, 'additional submissions must not consume lives below zero');
  assert.equal(messages.filter(message => message.command === 'saveScore').length, 1);

  assert.equal(timeouts.length, 1, 'game over should be scheduled once');
  timeouts[0]();
  assert.match(document.getElementById('sniper-game').innerHTML, /<button\b[^>]*>[^<]*try again/i);
});