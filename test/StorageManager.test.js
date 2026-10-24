const assert = require('node:assert/strict');
const { test } = require('node:test');
const { StorageManager } = require('../src/utils/StorageManager');

function createStorageManager() {
  const state = new Map();
  const globalState = {
    get(key) {
      return state.get(key);
    },
    update(key, value) {
      state.set(key, value);
    }
  };
  const manager = new StorageManager(globalState);
  manager.initializeProgress();
  return manager;
}

function setXP(manager, xp) {
  const progress = manager.getProgress();
  progress.xp = xp;
  manager.saveProgress(progress);
}

function localDayKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

test('updateStreak does not change the streak during the same local calendar day', () => {
  const manager = createStorageManager();
  const progress = manager.getProgress();
  const lastActive = new Date(2026, 0, 2, 8, 0);
  progress.lastActive = lastActive.toISOString();
  progress.streak = 5;

  manager.updateStreak(progress, new Date(2026, 0, 2, 23, 59));

  assert.equal(progress.streak, 5);
});

test('updateStreak increments on the next local calendar day even when less than 24 hours passed', () => {
  const manager = createStorageManager();
  const progress = manager.getProgress();
  progress.lastActive = new Date(2026, 0, 2, 23, 59).toISOString();
  progress.streak = 5;

  manager.updateStreak(progress, new Date(2026, 0, 3, 0, 1));

  assert.equal(progress.streak, 6);
});

test('updateStreak resets after a skipped local calendar day', () => {
  const manager = createStorageManager();
  const progress = manager.getProgress();
  progress.lastActive = new Date(2026, 0, 2, 23, 59).toISOString();
  progress.streak = 5;

  manager.updateStreak(progress, new Date(2026, 0, 4, 0, 1));

  assert.equal(progress.streak, 1);
});

test('getLevelInfo reports XP boundaries across adjacent levels', () => {
  const manager = createStorageManager();

  setXP(manager, 99);
  assert.deepEqual(manager.getLevelInfo(1), {
    level: 1,
    currentXP: 99,
    xpForCurrentLevel: 0,
    xpForNextLevel: 100,
    progress: 99
  });

  setXP(manager, 100);
  assert.deepEqual(manager.getLevelInfo(2), {
    level: 2,
    currentXP: 100,
    xpForCurrentLevel: 100,
    xpForNextLevel: 400,
    progress: 0
  });

  setXP(manager, 399);
  assert.equal(manager.getLevelInfo(2).progress, 99);
  setXP(manager, 400);
  assert.equal(manager.getLevelInfo(3).progress, 0);
});

test('getLevelInfo clamps progress below zero and above 100 percent', () => {
  const manager = createStorageManager();

  setXP(manager, 0);
  assert.equal(manager.getLevelInfo(3).progress, 0);
  setXP(manager, 1000);
  assert.equal(manager.getLevelInfo(2).progress, 100);
});

test('completeLesson awards first completion and smaller revisit XP', () => {
  const manager = createStorageManager();

  const first = manager.completeLesson('l1-what-is-vim');
  assert.equal(first.success, true);
  assert.equal(first.firstCompletion, true);
  assert.equal(first.xpGained, 150);
  assert.deepEqual(manager.getProgress().completedLessons, ['l1-what-is-vim']);
  assert.equal(manager.getProgress().xp, 150);

  const revisit = manager.completeLesson('l1-what-is-vim');
  assert.equal(revisit.success, true);
  assert.equal(revisit.firstCompletion, false);
  assert.equal(revisit.xpGained, 25);
  assert.deepEqual(manager.getProgress().completedLessons, ['l1-what-is-vim']);
  assert.equal(manager.getProgress().xp, 175);
});

test('completeLesson rejects unknown lesson IDs without changing progress', () => {
  const manager = createStorageManager();

  const result = manager.completeLesson('not-a-lesson');

  assert.equal(result.success, false);
  assert.equal(result.reason, 'unknown_lesson');
  assert.deepEqual(manager.getProgress().completedLessons, []);
  assert.equal(manager.getProgress().xp, 0);
});

test('claimDailyChallenge rewards a known challenge once per local day', () => {
  const manager = createStorageManager();
  const firstDay = new Date(2026, 0, 2, 23, 59);

  const firstClaim = manager.claimDailyChallenge('dc-001', firstDay);
  assert.equal(firstClaim.success, true);
  assert.equal(firstClaim.claimed, true);
  assert.equal(firstClaim.xpGained, 200);
  assert.equal(firstClaim.claimDate, localDayKey(firstDay));
  assert.equal(manager.getProgress().xp, 200);
  assert.equal(manager.getProgress().dailyChallengeClaims['dc-001'], localDayKey(firstDay));

  const duplicateDate = new Date(2026, 0, 2, 8, 0);
  const duplicate = manager.claimDailyChallenge('dc-001', duplicateDate);
  assert.equal(duplicate.success, false);
  assert.equal(duplicate.reason, 'already_claimed_today');
  assert.equal(duplicate.claimDate, localDayKey(duplicateDate));
  assert.equal(manager.getProgress().xp, 200);

  const nextDay = new Date(2026, 0, 3, 0, 1);
  const rolloverClaim = manager.claimDailyChallenge('dc-001', nextDay);
  assert.equal(rolloverClaim.success, true);
  assert.equal(rolloverClaim.xpGained, 200);
  assert.equal(manager.getProgress().xp, 400);
  assert.equal(manager.getProgress().dailyChallengeClaims['dc-001'], localDayKey(nextDay));
});

test('claimPlaygroundExercise rewards a known exercise once and rejects unknown IDs', () => {
  const manager = createStorageManager();

  const claim = manager.claimPlaygroundExercise('delete-line');
  assert.equal(claim.success, true);
  assert.equal(claim.claimed, true);
  assert.equal(claim.xpGained, 30);
  assert.deepEqual(manager.getProgress().playgroundExerciseClaims, ['delete-line']);
  assert.equal(manager.getProgress().xp, 30);

  const duplicate = manager.claimPlaygroundExercise('delete-line');
  assert.equal(duplicate.success, false);
  assert.equal(duplicate.reason, 'already_claimed');
  assert.equal(manager.getProgress().xp, 30);

  const unknown = manager.claimPlaygroundExercise('not-an-exercise');
  assert.equal(unknown.success, false);
  assert.equal(unknown.reason, 'unknown_exercise');
  assert.deepEqual(manager.getProgress().playgroundExerciseClaims, ['delete-line']);
  assert.equal(manager.getProgress().xp, 30);
});

test('claimPlaygroundExercise normalizes legacy object claims without re-awarding XP', () => {
  const manager = createStorageManager();
  const progress = manager.getProgress();
  delete progress.playgroundExerciseClaims;
  progress.claimedExercises = [{ exerciseId: 'delete-line' }];
  progress.playgroundExercises = [{ id: 'copy-paste' }];
  progress.completedExercises = [{ exerciseId: 'word-navigation' }];

  for (const exerciseId of ['delete-line', 'copy-paste', 'word-navigation']) {
    const duplicate = manager.claimPlaygroundExercise(exerciseId);

    assert.equal(duplicate.success, false, exerciseId);
    assert.equal(duplicate.reason, 'already_claimed', exerciseId);
  }

  assert.deepEqual(manager.getProgress().playgroundExerciseClaims, [
    'delete-line',
    'copy-paste',
    'word-navigation'
  ]);
  assert.equal(manager.getProgress().xp, 0);
});

test('updateGameScore stores valid allowlisted high scores and rejects invalid scores or games', () => {
  const manager = createStorageManager();

  const result = manager.updateGameScore('vimRacer', 250);
  assert.equal(result.success, true);
  assert.equal(result.updated, true);
  assert.equal(result.xpGained, 25);
  assert.equal(manager.getProgress().gameHighScores.vimRacer, 250);
  assert.equal(manager.getProgress().xp, 25);

  const lowerScore = manager.updateGameScore('vimRacer', 200);
  assert.equal(lowerScore.success, true);
  assert.equal(lowerScore.updated, false);
  assert.equal(manager.getProgress().gameHighScores.vimRacer, 250);
  assert.equal(manager.getProgress().xp, 25);

  for (const invalidScore of [-1, 1.5, 1000001, Number.NaN]) {
    const invalidResult = manager.updateGameScore('vimRacer', invalidScore);
    assert.equal(invalidResult.success, false);
    assert.equal(invalidResult.reason, 'invalid_score');
  }

  const unknownGame = manager.updateGameScore('not-a-game', 100);
  assert.equal(unknownGame.success, false);
  assert.equal(unknownGame.reason, 'unknown_game');
  assert.deepEqual(manager.getProgress().gameHighScores, {
    vimRacer: 250,
    commandCombat: 0,
    motionMaster: 0,
    textSniper: 0
  });
  assert.equal(manager.getProgress().xp, 25);
});