const { LESSONS } = require('../data/lessons');
const { DAILY_CHALLENGES } = require('../data/challenges');
const { EXERCISES } = require('../data/exercises');

const MAX_XP_PER_GRANT = 1000;
const MAX_GAME_SCORE = 1000000;
const MAX_LEVEL = Math.floor(Math.sqrt(Number.MAX_SAFE_INTEGER / 100));
const GAME_IDS = ['vimRacer', 'commandCombat', 'motionMaster', 'textSniper'];
const LESSON_IDS = new Set(LESSONS.chapters.flatMap(chapter => chapter.lessons.map(lesson => lesson.id)));

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
      dailyChallengeClaims: {},
      playgroundExerciseClaims: [],
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
    if (!progress) return { success: false, reason: 'progress_unavailable', xpGained: 0 };
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > MAX_XP_PER_GRANT) {
      return { success: false, reason: 'invalid_xp_amount', xpGained: 0 };
    }

    const currentXP = Number.isSafeInteger(progress.xp) && progress.xp >= 0 ? progress.xp : 0;
    if (currentXP > Number.MAX_SAFE_INTEGER - amount) {
      return { success: false, reason: 'xp_limit_reached', xpGained: 0 };
    }
    progress.xp = currentXP + amount;

    const newLevel = Math.min(MAX_LEVEL, Math.floor(Math.sqrt(progress.xp / 100)) + 1);
    const leveledUp = newLevel > progress.level;
    progress.level = newLevel;

    const now = new Date();
    this.updateStreak(progress, now);
    progress.lastActive = now.toISOString();
    this.checkBadges(progress);
    this.saveProgress(progress);

    return { success: true, leveledUp, newLevel, xpGained: amount, reason };
  }

  updateStreak(progress, now = new Date()) {
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return;

    const lastActive = progress.lastActive ? new Date(progress.lastActive) : null;
    if (!lastActive || !Number.isFinite(lastActive.getTime())) {
      progress.streak = 1;
      return;
    }

    const localDay = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const daysDiff = (localDay(now) - localDay(lastActive)) / 86400000;
    if (daysDiff === 1) {
      progress.streak = (Number.isSafeInteger(progress.streak) && progress.streak >= 0 ? progress.streak : 0) + 1;
    } else if (daysDiff !== 0) {
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
    if (!progress) return { success: false, reason: 'progress_unavailable', xpGained: 0 };
    if (typeof lessonId !== 'string' || !LESSON_IDS.has(lessonId)) {
      return { success: false, reason: 'unknown_lesson', lessonId, xpGained: 0 };
    }

    if (!Array.isArray(progress.completedLessons)) progress.completedLessons = [];
    const firstCompletion = !progress.completedLessons.includes(lessonId);
    if (firstCompletion) {
      progress.completedLessons.push(lessonId);
    }
    const result = this.addXP(firstCompletion ? 150 : 25, firstCompletion ? 'Completed lesson' : 'Revisited lesson');
    if (!result.success && firstCompletion) progress.completedLessons.pop();
    if (result.success) this.saveProgress(progress);
    return { ...result, lessonId, firstCompletion };
  }

  claimDailyChallenge(id, now = new Date()) {
    const progress = this.getProgress();
    if (!progress) return { success: false, reason: 'progress_unavailable', challengeId: id, xpGained: 0 };
    const challenge = DAILY_CHALLENGES.find(item => item.id === id);
    if (!challenge) return { success: false, reason: 'unknown_challenge', challengeId: id, xpGained: 0 };
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
      return { success: false, reason: 'invalid_date', challengeId: id, xpGained: 0 };
    }

    const localDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    if (!progress.dailyChallengeClaims || typeof progress.dailyChallengeClaims !== 'object') {
      progress.dailyChallengeClaims = {};
    }
    if (progress.dailyChallengeClaims[id] === localDate) {
      return { success: false, reason: 'already_claimed_today', challengeId: id, claimDate: localDate, xpGained: 0 };
    }

    progress.dailyChallengeClaims[id] = localDate;
    const result = this.addXP(challenge.xp, 'Daily challenge');
    if (!result.success) delete progress.dailyChallengeClaims[id];
    else this.saveProgress(progress);
    return { ...result, challengeId: id, claimDate: localDate, claimed: result.success };
  }

  claimPlaygroundExercise(id) {
    const progress = this.getProgress();
    if (!progress) return { success: false, reason: 'progress_unavailable', exerciseId: id, xpGained: 0 };
    const exercise = EXERCISES.find(item => item.id === id);
    if (!exercise) return { success: false, reason: 'unknown_exercise', exerciseId: id, xpGained: 0 };
    const previousClaims = progress.playgroundExerciseClaims;
    const claims = [...new Set([
      progress.playgroundExerciseClaims,
      progress.claimedExercises,
      progress.playgroundExercises,
      progress.completedExercises
    ].flatMap(storedClaims => Array.isArray(storedClaims) ? storedClaims : [])
      .map(claim => typeof claim === 'string'
        ? claim
        : claim && typeof claim === 'object'
          ? claim.exerciseId ?? claim.id
          : null)
      .filter(claim => typeof claim === 'string'))];
    const claimsChanged = !Array.isArray(previousClaims)
      || claims.length !== previousClaims.length
      || claims.some((claim, index) => claim !== previousClaims[index]);
    progress.playgroundExerciseClaims = claims;
    if (claimsChanged) this.saveProgress(progress);
    if (progress.playgroundExerciseClaims.includes(id)) {
      return { success: false, reason: 'already_claimed', exerciseId: id, xpGained: 0 };
    }

    progress.playgroundExerciseClaims.push(id);
    const result = this.addXP(exercise.xp, 'Playground exercise');
    if (!result.success) progress.playgroundExerciseClaims.pop();
    else this.saveProgress(progress);
    return { ...result, exerciseId: id, claimed: result.success };
  }

  updateGameScore(game, score) {
    const progress = this.getProgress();
    if (!progress) return { success: false, reason: 'progress_unavailable', game, score, xpGained: 0 };
    if (!GAME_IDS.includes(game)) return { success: false, reason: 'unknown_game', game, score, xpGained: 0 };
    if (!Number.isSafeInteger(score) || score < 0 || score > MAX_GAME_SCORE) {
      return { success: false, reason: 'invalid_score', game, score, xpGained: 0 };
    }

    if (!progress.gameHighScores) progress.gameHighScores = {};
    if (score > (progress.gameHighScores[game] || 0)) {
      progress.gameHighScores[game] = score;
      this.saveProgress(progress);
      const xpResult = this.addXP(Math.min(Math.floor(score / 10), MAX_XP_PER_GRANT), 'Game high score');
      return { ...xpResult, game, score, highScore: score, updated: true };
    }
    return { success: true, game, score, highScore: progress.gameHighScores[game] || 0, updated: false, xpGained: 0 };
  }

  getLevelInfo(level) {
    const progress = this.getProgress();
    const requestedLevel = Number.isFinite(level) ? Math.floor(level) : (progress?.level || 1);
    const clampedLevel = Math.min(MAX_LEVEL, Math.max(1, requestedLevel));
    const xpForLevel = (l) => 100 * l * l;
    const currentXP = Number.isFinite(progress?.xp) && progress.xp >= 0 ? progress.xp : 0;
    const xpForCurrentLevel = 100 * (clampedLevel - 1) * (clampedLevel - 1);
    const xpForNextLevel = xpForLevel(clampedLevel);
    const progressPercent = ((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    return {
      level: clampedLevel,
      currentXP,
      xpForCurrentLevel,
      xpForNextLevel,
      progress: Math.max(0, Math.min(100, Math.floor(progressPercent)))
    };
  }
}

module.exports = { StorageManager };
