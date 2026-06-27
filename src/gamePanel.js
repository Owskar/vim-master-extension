const vscode = require("vscode");

function getGamePanel(context, providers) {
  const panel = vscode.window.createWebviewPanel(
    "vimquestGame",
    "VimQuest: Command Dojo 🎮",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  panel.webview.html = getGameHTML();

  panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg.command === "saveScore") {
      const best = context.globalState.get(`vimquest.best.${msg.game}`, 0);
      if (msg.score > best) {
        await context.globalState.update(`vimquest.best.${msg.game}`, msg.score);
        vscode.window.showInformationMessage(
          `🏆 New high score: ${msg.score} in ${msg.game}!`
        );
      }
    }
  });

  return panel;
}

function getGameHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VimQuest Games</title>
<style>
  :root {
    --bg: var(--vscode-editor-background);
    --fg: var(--vscode-editor-foreground);
    --accent: #7c3aed;
    --accent2: #06b6d4;
    --green: #10b981;
    --yellow: #f59e0b;
    --red: #ef4444;
    --card: var(--vscode-editorWidget-background);
    --border: var(--vscode-editorWidget-border, #3f3f3f);
    --code-bg: var(--vscode-textCodeBlock-background, #1e1e2e);
    --radius: 10px;
    --font-mono: 'Cascadia Code', 'Fira Code', Consolas, monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--fg);
    font-family: var(--vscode-font-family, sans-serif);
    min-height: 100vh;
    font-size: 14px;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--card);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .logo {
    font-size: 22px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .layout { max-width: 820px; margin: 0 auto; padding: 32px 24px 60px; }

  .page-title {
    font-size: 26px;
    font-weight: 800;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }
  .page-sub {
    color: var(--fg);
    opacity: 0.6;
    font-size: 14px;
    margin-bottom: 32px;
  }

  /* GAME SELECTOR */
  .game-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .tab-btn {
    padding: 8px 18px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--fg);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .tab-btn:hover { border-color: var(--accent); color: var(--accent); }
  .tab-btn.active {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }

  /* GAME AREA */
  .game-area {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px;
    min-height: 420px;
  }

  /* COMMAND FLASH */
  .flash-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  .flash-title { font-size: 18px; font-weight: 700; }
  .score-display {
    font-size: 13px;
    font-weight: 700;
    color: var(--yellow);
  }
  .flash-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    gap: 20px;
  }
  .flash-question {
    font-size: 13px;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }
  .flash-command {
    font-family: var(--font-mono);
    font-size: 52px;
    font-weight: 900;
    padding: 20px 40px;
    background: var(--code-bg);
    border: 2px solid var(--border);
    border-radius: 12px;
    color: #e879f9;
    letter-spacing: 2px;
    text-shadow: 0 0 30px rgba(232,121,249,0.3);
    transition: all 0.2s;
  }
  .flash-command.correct {
    border-color: var(--green);
    color: var(--green);
    text-shadow: 0 0 30px rgba(16,185,129,0.3);
  }
  .flash-command.wrong {
    border-color: var(--red);
    color: var(--red);
    animation: shake 0.3s ease;
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-8px); }
    80% { transform: translateX(8px); }
  }
  .flash-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
    max-width: 500px;
  }
  .option-btn {
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--fg);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    font-family: var(--vscode-font-family, sans-serif);
  }
  .option-btn:hover { border-color: var(--accent); background: rgba(124,58,237,0.08); }
  .option-btn.correct { border-color: var(--green); background: rgba(16,185,129,0.12); color: var(--green); }
  .option-btn.wrong { border-color: var(--red); background: rgba(239,68,68,0.12); color: var(--red); }
  .option-btn:disabled { cursor: not-allowed; }
  .progress-bar-wrap {
    width: 100%;
    height: 6px;
    background: var(--code-bg);
    border-radius: 3px;
    margin-bottom: 20px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    border-radius: 3px;
    transition: width 0.3s;
  }

  /* SEQUENCE GAME */
  .sequence-area { display: flex; flex-direction: column; gap: 16px; }
  .seq-prompt {
    font-size: 15px;
    line-height: 1.6;
    padding: 16px 20px;
    background: var(--code-bg);
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  .seq-prompt strong { color: var(--accent2); }
  .seq-input-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .seq-input {
    font-family: var(--font-mono);
    font-size: 18px;
    padding: 10px 16px;
    background: var(--code-bg);
    border: 2px solid var(--border);
    border-radius: 8px;
    color: var(--fg);
    outline: none;
    flex: 1;
    transition: border-color 0.15s;
  }
  .seq-input:focus { border-color: var(--accent); }
  .seq-submit {
    padding: 10px 22px;
    border-radius: 8px;
    background: var(--accent);
    color: white;
    border: none;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .seq-submit:hover { background: #6d28d9; }
  .seq-feedback {
    min-height: 36px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .seq-score-row {
    display: flex;
    gap: 20px;
    font-size: 13px;
    font-weight: 700;
  }
  .seq-score-item { color: var(--yellow); }

  /* RESULT SCREEN */
  .result-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 32px 0;
  }
  .result-emoji { font-size: 56px; }
  .result-title { font-size: 22px; font-weight: 800; }
  .result-score { font-size: 18px; color: var(--yellow); font-weight: 700; }
  .result-message { font-size: 14px; opacity: 0.7; text-align: center; max-width: 320px; }
  .result-btn {
    padding: 12px 28px;
    border-radius: 8px;
    background: var(--accent);
    color: white;
    border: none;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    margin-top: 8px;
  }
  .result-btn:hover { background: #6d28d9; }

  /* CHEAT SHEET GAME */
  .cheatsheet-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
    margin-top: 16px;
  }
  .cs-card {
    padding: 14px 16px;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
  }
  .cs-card:hover { border-color: var(--accent); transform: translateY(-1px); }
  .cs-card.flipped { background: rgba(124,58,237,0.1); border-color: var(--accent); }
  .cs-key {
    font-family: var(--font-mono);
    font-size: 20px;
    font-weight: 900;
    color: #e879f9;
    margin-bottom: 6px;
  }
  .cs-desc {
    font-size: 11px;
    opacity: 0.85;
    line-height: 1.4;
  }
  .cs-hidden { opacity: 0; }
</style>
</head>
<body>

<div class="topbar">
  <span class="logo">⚔️ VimQuest</span>
  <span style="font-size:13px;opacity:0.6;">Command Dojo</span>
</div>

<div class="layout">
  <div class="page-title">🎮 Command Dojo</div>
  <div class="page-sub">Test your Vim knowledge with games and challenges</div>

  <div class="game-tabs">
    <button class="tab-btn active" onclick="switchGame('quiz')">⚡ Command Quiz</button>
    <button class="tab-btn" onclick="switchGame('sequence')">🧩 Sequence Builder</button>
    <button class="tab-btn" onclick="switchGame('cheatsheet')">📋 Flashcard Drill</button>
  </div>

  <div class="game-area" id="gameArea">
    <!-- Games rendered here by JS -->
  </div>
</div>

<script>
const vscode = acquireVsCodeApi();

// ─── DATA ────────────────────────────────────────────────────────────────
const quizData = [
  { cmd: "gg", answers: ["Go to top of file", "Go to bottom of file", "Go to last line of block", "Open a new file"], correct: 0 },
  { cmd: "G", answers: ["Go to first line", "Go to bottom of file", "Go to next function", "Close the file"], correct: 1 },
  { cmd: "dd", answers: ["Delete a word", "Duplicate line", "Delete current line", "Decrease indent"], correct: 2 },
  { cmd: "yy", answers: ["Redo last change", "Yank (copy) current line", "Undo last change", "Jump to next match"], correct: 1 },
  { cmd: "p", answers: ["Pause editor", "Paste after cursor", "Previous buffer", "Print file"], correct: 1 },
  { cmd: "u", answers: ["Undo last change", "Select until end", "Uppercase selection", "Update file"], correct: 0 },
  { cmd: "w", answers: ["Write file", "Jump to next word", "Move left", "Select word"], correct: 1 },
  { cmd: "b", answers: ["Back to previous file", "Jump back to previous word", "Select block", "Break line"], correct: 1 },
  { cmd: "ci(", answers: ["Copy inside parens", "Close inside parens", "Change inside parentheses", "Count inside parens"], correct: 2 },
  { cmd: "di\"", answers: ["Duplicate inside quotes", "Delete inside double quotes", "Define inside quotes", "Display inside quotes"], correct: 1 },
  { cmd: "V", answers: ["Visual character mode", "Visual line mode", "Visual block mode", "Verify mode"], correct: 1 },
  { cmd: "Ctrl+v", answers: ["Paste from clipboard", "Visual block mode", "Enter command mode", "Vert split"], correct: 1 },
  { cmd: "%", answers: ["Go to line percentage", "Jump to matching bracket", "Macro command", "Mark position"], correct: 1 },
  { cmd: ".", answers: ["Next search result", "Repeat last change", "Enter command mode", "Toggle comment"], correct: 1 },
  { cmd: ">G", answers: ["Go to indent level", "Indent from cursor to end of file", "Indent block", "Greater-than search"], correct: 1 },
  { cmd: "f{char}", answers: ["Find file named char", "Jump to next occurrence of char on line", "Filter by char", "Format char"], correct: 1 },
  { cmd: "*", answers: ["Multiply selection", "Search forward for word under cursor", "Visual star mode", "Mark all occurrences"], correct: 1 },
  { cmd: "ZZ", answers: ["Enter ZEN mode", "Save and quit", "Undo everything", "Zoom in"], correct: 1 },
  { cmd: "qa", answers: ["Quit all files", "Start recording macro into register a", "Query and replace", "Quick action menu"], correct: 1 },
  { cmd: "@a", answers: ["Run macro in register a", "Append to register a", "Jump to mark a", "Search in register a"], correct: 0 },
];

const sequenceData = [
  { task: "You want to delete from cursor to the end of the line", answer: "d$", hint: "operator + motion to end of line" },
  { task: "You want to change (replace) the word under your cursor", answer: "cw", hint: "change + word motion" },
  { task: "You want to copy the entire current line", answer: "yy", hint: "double the yank operator" },
  { task: "You want to paste BEFORE the cursor", answer: "P", hint: "uppercase P pastes before" },
  { task: "You want to go to line 42", answer: "42G", hint: "number + G" },
  { task: "You want to jump 5 words forward", answer: "5w", hint: "count + word jump" },
  { task: "You want to delete 3 lines at once", answer: "3dd", hint: "count + delete line" },
  { task: "You want to visually select the whole current line", answer: "V", hint: "capital V for line visual" },
  { task: "You want to undo the last 3 changes", answer: "3u", hint: "count + undo" },
  { task: "You want to delete inside the quotes on this line: name = \\\"John\\\"", answer: 'di"', hint: "delete inner quotes text object" },
  { task: "You want to search for the word under your cursor going forward", answer: "*", hint: "the star command" },
  { task: "You want to jump to the end of the current word", answer: "e", hint: "single letter motion" },
  { task: "You want to append text AFTER the current line (new line below)", answer: "o", hint: "opens a new line below" },
  { task: "You want to replay the last macro", answer: "@@", hint: "double @ symbol" },
  { task: "You want to save the file and quit", answer: ":wq", hint: "write + quit in command mode" },
];

const flashcardData = [
  { key: "h", desc: "Move cursor left" },
  { key: "j", desc: "Move cursor down" },
  { key: "k", desc: "Move cursor up" },
  { key: "l", desc: "Move cursor right" },
  { key: "w", desc: "Jump to next word start" },
  { key: "b", desc: "Jump to previous word start" },
  { key: "e", desc: "Jump to end of word" },
  { key: "0", desc: "Jump to line start (column 0)" },
  { key: "^", desc: "Jump to first non-blank char" },
  { key: "$", desc: "Jump to end of line" },
  { key: "gg", desc: "Go to top of file" },
  { key: "G", desc: "Go to bottom of file" },
  { key: "i", desc: "Insert before cursor" },
  { key: "a", desc: "Append after cursor" },
  { key: "o", desc: "Open new line below" },
  { key: "O", desc: "Open new line above" },
  { key: "I", desc: "Insert at start of line" },
  { key: "A", desc: "Append at end of line" },
  { key: "dd", desc: "Delete current line" },
  { key: "yy", desc: "Yank (copy) current line" },
  { key: "p", desc: "Paste after cursor" },
  { key: "P", desc: "Paste before cursor" },
  { key: "u", desc: "Undo last change" },
  { key: "Ctrl+r", desc: "Redo" },
  { key: "v", desc: "Visual character mode" },
  { key: "V", desc: "Visual line mode" },
  { key: "Ctrl+v", desc: "Visual block mode" },
  { key: ".", desc: "Repeat last change" },
  { key: "*", desc: "Search word under cursor" },
  { key: "%", desc: "Jump to matching bracket" },
  { key: "ZZ", desc: "Save and quit" },
  { key: ":q!", desc: "Quit without saving" },
];

// ─── STATE ───────────────────────────────────────────────────────────────
let currentGame = 'quiz';
let quizState = null;
let seqState = null;

// ─── GAME SWITCHER ────────────────────────────────────────────────────────
function switchGame(game) {
  currentGame = game;
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', ['quiz','sequence','cheatsheet'][i] === game);
  });
  if (game === 'quiz') startQuiz();
  else if (game === 'sequence') startSequence();
  else if (game === 'cheatsheet') startCheatsheet();
}

// ─── QUIZ GAME ───────────────────────────────────────────────────────────
function startQuiz() {
  const shuffled = [...quizData].sort(() => Math.random() - 0.5).slice(0, 10);
  quizState = { questions: shuffled, current: 0, score: 0, answered: false };
  renderQuiz();
}

function renderQuiz() {
  const q = quizState.questions[quizState.current];
  const progress = ((quizState.current) / quizState.questions.length) * 100;

  document.getElementById('gameArea').innerHTML = \`
    <div class="flash-header">
      <span class="flash-title">⚡ Command Quiz</span>
      <span class="score-display">Score: \${quizState.score} / \${quizState.questions.length}</span>
    </div>
    <div class="progress-bar-wrap">
      <div class="progress-bar-fill" style="width:\${progress}%"></div>
    </div>
    <div style="font-size:12px;opacity:0.6;margin-bottom:16px;">Question \${quizState.current + 1} of \${quizState.questions.length}</div>
    <div class="flash-card">
      <div class="flash-question">What does this command do?</div>
      <div class="flash-command" id="flashCmd">\${q.cmd}</div>
      <div class="flash-options">
        \${q.answers.map((ans, i) => \`
          <button class="option-btn" id="opt\${i}" onclick="answerQuiz(\${i})">
            \${ans}
          </button>
        \`).join('')}
      </div>
    </div>
  \`;
}

function answerQuiz(idx) {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = quizState.questions[quizState.current];
  const isCorrect = idx === q.correct;
  if (isCorrect) quizState.score++;

  document.querySelectorAll('.option-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('correct');
    else if (i === idx && !isCorrect) btn.classList.add('wrong');
  });

  const cmdEl = document.getElementById('flashCmd');
  cmdEl.classList.add(isCorrect ? 'correct' : 'wrong');

  setTimeout(() => {
    quizState.current++;
    quizState.answered = false;
    if (quizState.current < quizState.questions.length) {
      renderQuiz();
    } else {
      showQuizResult();
    }
  }, 1200);
}

function showQuizResult() {
  const { score, questions } = quizState;
  const pct = Math.round((score / questions.length) * 100);
  const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '⚔️' : pct >= 40 ? '📖' : '🐣';
  const msg = pct >= 80 ? "Outstanding! You're a Vim Warrior!" : pct >= 60 ? "Great work! Keep practicing!" : pct >= 40 ? "Not bad — review the lessons and try again!" : "Keep studying — you'll get there!";

  document.getElementById('gameArea').innerHTML = \`
    <div class="result-screen">
      <div class="result-emoji">\${emoji}</div>
      <div class="result-title">Quiz Complete!</div>
      <div class="result-score">\${score} / \${questions.length} correct (\${pct}%)</div>
      <div class="result-message">\${msg}</div>
      <button class="result-btn" onclick="startQuiz()">🔄 Play Again</button>
    </div>
  \`;

  vscode.postMessage({ command: 'saveScore', game: 'quiz', score: pct });
}

// ─── SEQUENCE GAME ────────────────────────────────────────────────────────
function startSequence() {
  const shuffled = [...sequenceData].sort(() => Math.random() - 0.5);
  seqState = { questions: shuffled, current: 0, correct: 0, total: 0, showHint: false };
  renderSequence();
}

function renderSequence() {
  const q = seqState.questions[seqState.current % seqState.questions.length];
  document.getElementById('gameArea').innerHTML = \`
    <div class="sequence-area">
      <div class="flash-header">
        <span class="flash-title">🧩 Sequence Builder</span>
        <span class="score-display">✅ \${seqState.correct} / \${seqState.total}</span>
      </div>
      <div style="font-size:13px;opacity:0.6;margin-bottom:4px;">Type the Vim command to accomplish this task:</div>
      <div class="seq-prompt">\${q.task}</div>
      <div class="seq-input-row">
        <input class="seq-input" id="seqInput" type="text" placeholder="Type the command..." autocomplete="off" spellcheck="false"
          onkeydown="if(event.key==='Enter') checkSeq()">
        <button class="seq-submit" onclick="checkSeq()">Check →</button>
      </div>
      <div class="seq-feedback" id="seqFeedback"></div>
      <div style="display:flex;gap:12px;">
        <button onclick="toggleHint()" style="font-size:12px;background:none;border:none;color:var(--accent2);cursor:pointer;text-decoration:underline;">
          💡 Show hint
        </button>
        <button onclick="nextSeq()" style="font-size:12px;background:none;border:none;color:var(--fg);opacity:0.6;cursor:pointer;text-decoration:underline;">
          Skip →
        </button>
      </div>
      <div id="hintBox" style="display:none;font-size:12px;opacity:0.7;font-style:italic;padding:8px 0;">Hint: \${q.hint}</div>
    </div>
  \`;
  document.getElementById('seqInput').focus();
}

function checkSeq() {
  const input = document.getElementById('seqInput').value.trim();
  const q = seqState.questions[seqState.current % seqState.questions.length];
  const fb = document.getElementById('seqFeedback');
  seqState.total++;

  if (input === q.answer) {
    seqState.correct++;
    fb.innerHTML = '<span style="color:var(--green)">✅ Correct!</span>';
    setTimeout(nextSeq, 800);
  } else {
    fb.innerHTML = \`<span style="color:var(--red)">❌ Not quite. Answer: <code style="font-family:monospace;background:var(--code-bg);padding:1px 6px;border-radius:4px;">\${q.answer}</code></span>\`;
  }
}

function nextSeq() {
  seqState.current++;
  if (seqState.current >= seqState.questions.length) {
    showSeqResult();
  } else {
    renderSequence();
  }
}

function showSeqResult() {
  const { correct, total } = seqState;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  document.getElementById('gameArea').innerHTML = \`
    <div class="result-screen">
      <div class="result-emoji">🧩</div>
      <div class="result-title">Sequence Complete!</div>
      <div class="result-score">\${correct} / \${total} correct (\${pct}%)</div>
      <div class="result-message">You worked through all \${seqState.questions.length} sequences!</div>
      <button class="result-btn" onclick="startSequence()">🔄 Play Again</button>
    </div>
  \`;
  vscode.postMessage({ command: 'saveScore', game: 'sequence', score: pct });
}

function toggleHint() {
  const box = document.getElementById('hintBox');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

// ─── FLASHCARD GAME ───────────────────────────────────────────────────────
function startCheatsheet() {
  const shuffled = [...flashcardData].sort(() => Math.random() - 0.5);
  const flipped = new Set();

  document.getElementById('gameArea').innerHTML = \`
    <div>
      <div class="flash-header" style="margin-bottom:16px;">
        <span class="flash-title">📋 Flashcard Drill</span>
        <span style="font-size:12px;opacity:0.6;">Click a card to reveal its meaning</span>
      </div>
      <div class="cheatsheet-grid" id="csGrid"></div>
    </div>
  \`;

  const grid = document.getElementById('csGrid');
  shuffled.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'cs-card';
    el.innerHTML = \`
      <div class="cs-key">\${card.key}</div>
      <div class="cs-desc cs-hidden" id="csd\${i}">\${card.desc}</div>
    \`;
    el.onclick = () => {
      el.classList.toggle('flipped');
      const desc = document.getElementById(\`csd\${i}\`);
      desc.classList.toggle('cs-hidden');
    };
    grid.appendChild(el);
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────
startQuiz();
</script>
</body>
</html>`;
}

module.exports = { getGamePanel };
