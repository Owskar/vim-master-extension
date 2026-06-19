const vscode = require('vscode');
const { DashboardPanel } = require('./panels/DashboardPanel');
const { GamesPanel } = require('./panels/GamesPanel');
const { PlaygroundPanel } = require('./panels/PlaygroundPanel');
const { ProgressProvider } = require('./providers/ProgressProvider');
const { StorageManager } = require('./utils/StorageManager');
const { NotificationManager } = require('./utils/NotificationManager');

let storageManager;

function activate(context) {
  console.log('VimMaster extension is now active!');

  storageManager = new StorageManager(context.globalState);
  const notificationManager = new NotificationManager(storageManager);

  // Initialize progress if first time
  if (!storageManager.getProgress()) {
    storageManager.initializeProgress();
    vscode.window.showInformationMessage(
      '🎮 Welcome to VimMaster! Ready to master Vim? Open the dashboard to begin your journey!',
      'Open Dashboard'
    ).then(selection => {
      if (selection === 'Open Dashboard') {
        DashboardPanel.createOrShow(context.extensionUri, storageManager);
      }
    });
  }

  // Register sidebar progress view
  const progressProvider = new ProgressProvider(context.extensionUri, storageManager);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('vimMasterProgress', progressProvider)
  );

  // Register all commands
  context.subscriptions.push(
    vscode.commands.registerCommand('vimMaster.openDashboard', () => {
      DashboardPanel.createOrShow(context.extensionUri, storageManager);
    }),

    vscode.commands.registerCommand('vimMaster.startLesson', () => {
      DashboardPanel.createOrShow(context.extensionUri, storageManager);
    }),

    vscode.commands.registerCommand('vimMaster.openPlayground', () => {
      PlaygroundPanel.createOrShow(context.extensionUri, storageManager);
    }),

    vscode.commands.registerCommand('vimMaster.openGames', () => {
      GamesPanel.createOrShow(context.extensionUri, storageManager);
    }),

    vscode.commands.registerCommand('vimMaster.viewProgress', () => {
      DashboardPanel.createOrShow(context.extensionUri, storageManager);
    }),

    vscode.commands.registerCommand('vimMaster.openCheatSheet', () => {
      DashboardPanel.createOrShow(context.extensionUri, storageManager, 'cheatsheet');
    }),

    vscode.commands.registerCommand('vimMaster.dailyChallenge', () => {
      DashboardPanel.createOrShow(context.extensionUri, storageManager, 'daily');
    }),

    vscode.commands.registerCommand('vimMaster.resetProgress', async () => {
      const confirm = await vscode.window.showWarningMessage(
        'Are you sure you want to reset all your VimMaster progress? This cannot be undone!',
        'Yes, Reset Everything',
        'Cancel'
      );
      if (confirm === 'Yes, Reset Everything') {
        storageManager.initializeProgress();
        vscode.window.showInformationMessage('Progress reset! Starting fresh 🎯');
        DashboardPanel.createOrShow(context.extensionUri, storageManager);
      }
    })
  );

  // Daily reminder
  notificationManager.scheduleDailyReminder(context);
}

function deactivate() {}

module.exports = { activate, deactivate };
