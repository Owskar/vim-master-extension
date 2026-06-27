const vscode = require("vscode");
const { LESSONS } = require("./lessons");
const { getRank } = require("./sidebar");

function getWelcomePanel(context, providers) {
  const panel = vscode.window.createWebviewPanel(
    "vimquestWelcome",
    "VimQuest — Welcome",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  panel.webview.html = getWelcomeHTML(context);

  panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg.command === "startLesson") {
      panel.dispose();
      const { getLessonPanel } = require("./lessonPanel");
      getLessonPanel(context, msg.lessonId, providers);
    }
    if (msg.command === "openGame") {
      panel.dispose();
      const { getGamePanel } = require("./gamePanel");
      getGamePanel(context, providers);
    }
    if (msg.command === "resetProgress") {
      const pick = await vscode.window.showWarningMessage(
        "Reset all VimQuest progress? This cannot be undone.",
        "Yes, reset",
        "Cancel"
      );
      if (pick === "Yes, reset") {
        await context.globalState.update("vimquest.completed", []);
        await context.globalState.update("vimquest.streak", 0);
        await context.globalState.update("vimquest.lastDay", "");
        providers.lessons.refresh();
        providers.progress.refresh();
        panel.webview.html = getWelcomeHTML(context);
        vscode.window.showInformationMessage("Progress reset!");
      }
    }
  });

  return panel;
}

function getWelcomeHTML(context) {
  const completed = context.globalState.get("vimquest.completed", []);
  const streak = context.globalState.get("vimquest.streak", 0);
  const totalXP = LESSONS.filter((l) => completed.includes(l.id)).reduce(
    (sum, l) => sum + l.xp,
    0
  );
  const rank = getRank(totalXP);

  const chapters = [...new Set(LESSONS.map((l) => l.chapter))];
  const chapterProgress = chapters.map((ch) => {
    const chLessons = LESSONS.filter((l) => l.chapter === ch);
    const done = chLessons.filter((l) => completed.includes(l.id)).length;
    return { name: ch, done, total: chLessons.length };
  });

  // Find next lesson to do
  const nextLesson = LESSONS.find((l) => !completed.includes(l.id));

  const chapterCards = chapterProgress
    .map((ch) => {
      const pct = Math.round((ch.done / ch.total) * 100);
      return `
      <div class="chapter-card">
        <div class="chapter-name">${ch.name}</div>
        <div class="chapter-progress-row">
          <div class="chapter-bar-wrap">
            <div class="chapter-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="chapter-count">${ch.done}/${ch.total}</span>
        </div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VimQuest</title>
<style>
  :root {
    --bg: var(--vscode-editor-background);
    --fg: var(--vscode-editor-foreground);
    --accent: #7c3aed;
    --accent2: #06b6d4;
    --green: #10b981;
    --yellow: #f59e0b;
    --card: var(--vscode-editorWidget-background);
    --border: var(--vscode-editorWidget-border, #3f3f3f);
    --code-bg: var(--vscode-textCodeBlock-background, #1e1e2e);
    --radius: 12px;
    --font-mono: 'Cascadia Code', 'Fira Code', Consolas, monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--fg);
    font-family: var(--vscode-font-family, -apple-system, sans-serif);
    font-size: 14px;
    line-height: 1.6;
    min-height: 100vh;
  }

  /* HERO */
  .hero {
    padding: 60px 24px 48px;
    text-align: center;
    background: linear-gradient(180deg, rgba(124,58,237,0.06) 0%, transparent 100%);
    border-bottom: 1px solid var(--border);
  }
  .hero-logo {
    font-size: 56px;
    margin-bottom: 16px;
    display: block;
    filter: drop-shadow(0 0 20px rgba(124,58,237,0.4));
  }
  .hero-title {
    font-size: 40px;
    font-weight: 900;
    letter-spacing: -1px;
    margin-bottom: 12px;
    background: linear-gradient(135deg, #a855f7, #06b6d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-sub {
    font-size: 16px;
    opacity: 0.65;
    max-width: 480px;
    margin: 0 auto 32px;
    line-height: 1.65;
  }
  .hero-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  /* BUTTONS */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    letter-spacing: 0.2px;
  }
  .btn:hover { transform: translateY(-1px); }
  .btn:active { transform: translateY(0); }
  .btn-primary {
    background: linear-gradient(135deg, var(--accent), #9333ea);
    color: white;
    box-shadow: 0 4px 20px rgba(124,58,237,0.4);
  }
  .btn-primary:hover { box-shadow: 0 6px 24px rgba(124,58,237,0.5); }
  .btn-secondary {
    background: var(--card);
    color: var(--fg);
    border: 1px solid var(--border);
  }
  .btn-secondary:hover { border-color: var(--accent2); color: var(--accent2); }

  /* STATS ROW */
  .stats-row {
    display: flex;
    justify-content: center;
    gap: 24px;
    padding: 24px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
    background: var(--card);
  }
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .stat-value {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -0.5px;
  }
  .stat-label {
    font-size: 11px;
    opacity: 0.55;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 600;
  }
  .stat-xp { color: var(--yellow); }
  .stat-streak { color: var(--green); }
  .stat-rank { color: #a855f7; }

  /* CONTENT */
  .content {
    max-width: 760px;
    margin: 0 auto;
    padding: 36px 24px 60px;
  }

  .section-title {
    font-size: 17px;
    font-weight: 800;
    margin-bottom: 16px;
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* CHAPTER CARDS */
  .chapters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    margin-bottom: 36px;
  }
  .chapter-card {
    padding: 16px 18px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .chapter-name {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 10px;
  }
  .chapter-progress-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .chapter-bar-wrap {
    flex: 1;
    height: 6px;
    background: var(--code-bg);
    border-radius: 3px;
    overflow: hidden;
  }
  .chapter-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    border-radius: 3px;
    transition: width 0.4s;
  }
  .chapter-count {
    font-size: 11px;
    opacity: 0.6;
    font-weight: 700;
    white-space: nowrap;
  }

  /* TIPS */
  .tips-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 36px;
  }
  .tip-card {
    padding: 16px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .tip-card-icon { font-size: 20px; margin-bottom: 8px; }
  .tip-card-title { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
  .tip-card-desc { font-size: 12px; opacity: 0.7; line-height: 1.5; }

  /* RESET */
  .reset-btn {
    font-size: 12px;
    background: none;
    border: none;
    color: var(--fg);
    opacity: 0.35;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    margin-top: 8px;
  }
  .reset-btn:hover { opacity: 0.6; }
</style>
</head>
<body>

<div class="hero">
  <span class="hero-logo">⚔️</span>
  <div class="hero-title">VimQuest</div>
  <div class="hero-sub">Learn Vim from baby steps to mastery — with interactive lessons, live practice files, and games</div>
  <div class="hero-actions">
    ${
      nextLesson
        ? `<button class="btn btn-primary" onclick="startLesson('${nextLesson.id}')">
          ${completed.length === 0 ? "🚀 Start Learning" : "▶ Continue Learning"} — ${nextLesson.title}
        </button>`
        : `<button class="btn btn-primary" onclick="openGame()">🏆 All Done! Play Games</button>`
    }
    <button class="btn btn-secondary" onclick="openGame()">🎮 Play Games</button>
  </div>
</div>

<div class="stats-row">
  <div class="stat-item">
    <span class="stat-value stat-xp">⚡ ${totalXP}</span>
    <span class="stat-label">Total XP</span>
  </div>
  <div class="stat-item">
    <span class="stat-value">${completed.length} / ${LESSONS.length}</span>
    <span class="stat-label">Lessons Done</span>
  </div>
  <div class="stat-item">
    <span class="stat-value stat-streak">🔥 ${streak}</span>
    <span class="stat-label">Day Streak</span>
  </div>
  <div class="stat-item">
    <span class="stat-value stat-rank">${rank}</span>
    <span class="stat-label">Current Rank</span>
  </div>
</div>

<div class="content">

  <div class="section-title">📚 Your Progress</div>
  <div class="chapters-grid">
    ${chapterCards}
  </div>

  <div class="section-title">💡 Tips for Learning</div>
  <div class="tips-grid">
    <div class="tip-card">
      <div class="tip-card-icon">🖥️</div>
      <div class="tip-card-title">Get the Vim Extension</div>
      <div class="tip-card-desc">Install "Vim" by vscodevim in the Extensions marketplace to practice commands live in VS Code.</div>
    </div>
    <div class="tip-card">
      <div class="tip-card-icon">📝</div>
      <div class="tip-card-title">Use Practice Files</div>
      <div class="tip-card-desc">Each lesson has an "Open Practice File" button — use it to try commands on a real file!</div>
    </div>
    <div class="tip-card">
      <div class="tip-card-icon">🔁</div>
      <div class="tip-card-title">Repeat Daily</div>
      <div class="tip-card-desc">Even 10 minutes a day builds muscle memory. Aim for at least one lesson or game session daily.</div>
    </div>
    <div class="tip-card">
      <div class="tip-card-icon">🎮</div>
      <div class="tip-card-title">Play the Games</div>
      <div class="tip-card-desc">The Command Quiz and Sequence Builder reinforce what you've learned in a fun, low-pressure way.</div>
    </div>
  </div>

  <button class="reset-btn" onclick="resetProgress()">Reset all progress</button>

</div>

<script>
  const vscode = acquireVsCodeApi();
  function startLesson(id) { vscode.postMessage({ command: 'startLesson', lessonId: id }); }
  function openGame() { vscode.postMessage({ command: 'openGame' }); }
  function resetProgress() { vscode.postMessage({ command: 'resetProgress' }); }
</script>
</body>
</html>`;
}

module.exports = { getWelcomePanel };
