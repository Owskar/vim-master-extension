class StorageManager {
  constructor(globalState) {
    this.globalState = globalState;
    this.KEY = 'vimMasterProgress';
  }

  initializeProgress() {
    const initial = {
      xp: 0,
      level: 1,
      streak: 0,
      lastActive: null,
      completedLessons: [],
      completedChallenges: [],
      badges: [],
      gameHighScores: {
        vimRacer: 0,
        commandCombat: 0,
        motionMaster: 0,
        textSniper: 0
      },
      totalCommandsTyped: 0,
      totalTimeSpent: 0,
      settings: {
        theme: 'dark',
        soundEnabled: true,
        showHints: true
      }
    };
    this.globalState.update(this.KEY, initial);
    return initial;
  }

  getProgress() {
    return this.globalState.get(this.KEY);
  }

  saveProgress(progress) {
    this.globalState.update(this.KEY, progress);
  }

  addXP(amount, reason) {
    const progress = this.getProgress();
    if (!progress) return null;

    progress.xp += amount;

    // Level up calculation (each level needs level * 200 XP)
    const newLevel = Math.floor(1 + Math.sqrt(progress.xp / 100));
    const leveledUp = newLevel > progress.level;
    progress.level = newLevel;

    progress.lastActive = new Date().toISOString();
    this.updateStreak(progress);
    this.checkBadges(progress);
    this.saveProgress(progress);

    return { leveledUp, newLevel, xpGained: amount, reason };
  }

  updateStreak(progress) {
    const now = new Date();
    const lastActive = progress.lastActive ? new Date(progress.lastActive) : null;

    if (lastActive) {
      const daysDiff = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        progress.streak += 1;
      } else if (daysDiff > 1) {
        progress.streak = 1;
      }
    } else {
      progress.streak = 1;
    }
  }

  checkBadges(progress) {
    const badges = progress.badges || [];
    const newBadges = [];

    const badgeConditions = [
      { id: 'first_lesson', name: '🎓 First Steps', condition: progress.completedLessons?.length >= 1 },
      { id: 'five_lessons', name: '📚 Quick Learner', condition: progress.completedLessons?.length >= 5 },
      { id: 'ten_lessons', name: '🏆 Lesson Master', condition: progress.completedLessons?.length >= 10 },
      { id: 'streak_3', name: '🔥 On Fire', condition: progress.streak >= 3 },
      { id: 'streak_7', name: '⚡ Week Warrior', condition: progress.streak >= 7 },
      { id: 'streak_30', name: '👑 Vim Devotee', condition: progress.streak >= 30 },
      { id: 'level_5', name: '⭐ Rising Star', condition: progress.level >= 5 },
      { id: 'level_10', name: '💫 Vim Veteran', condition: progress.level >= 10 },
      { id: 'level_20', name: '🌟 Vim Master', condition: progress.level >= 20 },
      { id: 'xp_1000', name: '💰 XP Hunter', condition: progress.xp >= 1000 },
      { id: 'commands_100', name: '⌨️ Type-o-matic', condition: progress.totalCommandsTyped >= 100 },
      { id: 'game_win', name: '🎮 Gamer', condition: Object.values(progress.gameHighScores || {}).some(s => s > 0) },
    ];

    for (const badge of badgeConditions) {
      if (badge.condition && !badges.includes(badge.id)) {
        badges.push(badge.id);
        newBadges.push(badge);
      }
    }

    progress.badges = badges;
    return newBadges;
  }

  completeLesson(lessonId) {
    const progress = this.getProgress();
    if (!progress) return null;

    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      this.saveProgress(progress);
      return this.addXP(150, `Completed lesson: ${lessonId}`);
    }
    return this.addXP(25, `Revisited lesson: ${lessonId}`);
  }

  updateGameScore(game, score) {
    const progress = this.getProgress();
    if (!progress) return;

    if (!progress.gameHighScores) progress.gameHighScores = {};
    if (score > (progress.gameHighScores[game] || 0)) {
      progress.gameHighScores[game] = score;
      this.saveProgress(progress);
      this.addXP(Math.floor(score / 10), `High score in ${game}`);
    }
  }

  getLevelInfo(level) {
    const xpForLevel = (l) => l * l * 100;
    return {
      currentXP: this.getProgress()?.xp || 0,
      xpForCurrentLevel: xpForLevel(level),
      xpForNextLevel: xpForLevel(level + 1),
      progress: Math.floor((this.getProgress()?.xp - xpForLevel(level)) / (xpForLevel(level + 1) - xpForLevel(level)) * 100)
    };
  }
}

module.exports = { StorageManager };
