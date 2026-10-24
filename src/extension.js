// ─────────────────────────────────────────────────────────────
//  VimQuest — Main Extension Entry Point
//  src/extension.js
// ─────────────────────────────────────────────────────────────
const vscode = require('vscode');

const { LessonsProvider, ProgressProvider, resetProgress } = require('./sidebar');
const { getLessonPanel }    = require('./panels/lesson');
const { getGamePanel }      = require('./panels/game');
const { getWelcomePanel, refreshWelcomePanel } = require('./panels/welcome');
const { getCheatsheetPanel} = require('./panels/cheatsheet');
const { getDailyPanel } = require('./panels/daily');

function activate(context) {
  const lessonsProvider  = new LessonsProvider(context);
  const progressProvider = new ProgressProvider(context);
  const providers = { lessons: lessonsProvider, progress: progressProvider };

  // ── Tree Views ────────────────────────────────────────────────
  vscode.window.createTreeView('vimquest.lessonsView',  { treeDataProvider: lessonsProvider,  showCollapseAll: false });
  vscode.window.createTreeView('vimquest.progressView', { treeDataProvider: progressProvider, showCollapseAll: false });

  // ── Commands ──────────────────────────────────────────────────
  context.subscriptions.push(

    vscode.commands.registerCommand('vimquest.openLesson', function(arg) {
      var lessonId;
      if (typeof arg === 'string')      lessonId = arg;
      else if (arg && arg.lessonId)     lessonId = arg.lessonId;
      else if (arg && arg.id)           lessonId = arg.id;
      if (!lessonId) { vscode.window.showErrorMessage('VimQuest: Could not determine lesson.'); return; }
      getLessonPanel(context, lessonId, providers);
    }),

    vscode.commands.registerCommand('vimquest.openGame', function() {
      getGamePanel(context, providers);
    }),

    vscode.commands.registerCommand('vimquest.showWelcome', function() {
      getWelcomePanel(context, providers);
    }),

    vscode.commands.registerCommand('vimquest.openCheatsheet', function() {
      getCheatsheetPanel(context, providers);
    }),

    vscode.commands.registerCommand('vimquest.dailyChallenge', function() {
      getDailyPanel(context, providers);
    }),

    vscode.commands.registerCommand('vimquest.resetProgress', async function() {
      const pick = await vscode.window.showWarningMessage(
        'Reset all VimQuest progress? This cannot be undone.',
        'Yes, reset', 'Cancel'
      );
      if (pick === 'Yes, reset') {
        await resetProgress(context, providers, refreshWelcomePanel);
        vscode.window.showInformationMessage('VimQuest: Progress reset!');
      }
    })
  );

  // ── Daily challenge nudge ──────────────────────────────────────
  const lastDay   = context.globalState.get('vimquest.lastDay', '');
  const today     = new Date().toDateString();
  const completed = context.globalState.get('vimquest.completed', []);
  if (lastDay !== today && completed.length > 0) {
    setTimeout(function() {
      vscode.window.showInformationMessage(
        '⚔️ VimQuest: Your daily challenge is ready!',
        'Take Challenge', 'Later'
      ).then(function(pick) {
        if (pick === 'Take Challenge') getDailyPanel(context, providers);
      });
    }, 2500);
  }

  // ── First-launch welcome ──────────────────────────────────────
  const hasLaunched = context.globalState.get('vimquest.hasLaunched', false);
  if (!hasLaunched) {
    context.globalState.update('vimquest.hasLaunched', true);
    setTimeout(function() { getWelcomePanel(context, providers); }, 800);
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
