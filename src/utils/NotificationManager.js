const vscode = require('vscode');

class NotificationManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  scheduleDailyReminder(context) {
    // Check once per session if user should be reminded
    const progress = this.storageManager.getProgress();
    if (!progress) return;

    const lastActive = progress.lastActive ? new Date(progress.lastActive) : null;
    const now = new Date();

    if (lastActive) {
      const hoursSince = (now - lastActive) / (1000 * 60 * 60);
      if (hoursSince > 20) {
        const messages = [
          `🔥 Your ${progress.streak}-day streak is at risk! Practice Vim today!`,
          `⚡ Level ${progress.level} Vim warrior — don't lose your momentum!`,
          `🎯 Daily Vim practice keeps the fingers nimble. Open VimMaster!`,
          `👾 Your Vim skills are waiting to level up. Continue the journey!`
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];

        vscode.window.showInformationMessage(msg, 'Practice Now', 'Later').then(sel => {
          if (sel === 'Practice Now') {
            vscode.commands.executeCommand('vimMaster.openDashboard');
          }
        });
      }
    }
  }

  showXPGain(amount, reason) {
    vscode.window.setStatusBarMessage(`⚡ +${amount} XP — ${reason}`, 3000);
  }

  showLevelUp(level) {
    vscode.window.showInformationMessage(
      `🎉 LEVEL UP! You've reached Level ${level}! Keep going, Vim Master!`,
      'View Progress'
    ).then(sel => {
      if (sel === 'View Progress') {
        vscode.commands.executeCommand('vimMaster.viewProgress');
      }
    });
  }

  showBadgeEarned(badge) {
    vscode.window.showInformationMessage(`🏅 Badge Earned: ${badge.name}!`);
  }
}

module.exports = { NotificationManager };
