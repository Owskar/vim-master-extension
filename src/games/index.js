// ═══════════════════════════════════════════════════════════════
//  GAMES REGISTRY
//  To DISABLE a game: comment out its line below.
//  To ADD a game:     require it and add it to the array.
//  No other file needs to change.
// ═══════════════════════════════════════════════════════════════

const GAMES = [
  require('./quiz'),        // ⚡ Command Quiz      — comment to disable
  require('./sequence'),    // 🧩 Sequence Builder  — comment to disable
  require('./speedrun'),    // 💨 Speed Run         — comment to disable
  // require('./wordle'),   // 🧠 Vim Wordle        — DISABLED
  require('./flashcards'),  // 🃏 Flashcard Drill   — comment to disable
];

module.exports = GAMES;
