const vscode = require("vscode");
const { LESSONS } = require("./lessons");
const { getRank }  = require("./sidebar");

const _panels = new Map();

function getWelcomePanel(context, providers) {
  if (_panels.has("welcome")) {
    try { _panels.get("welcome").reveal(vscode.ViewColumn.One); return; } catch(_) {}
  }

  const panel = vscode.window.createWebviewPanel(
    "vimquestWelcome",
    "⚔️ VimQuest — Dashboard",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [] }
  );

  _panels.set("welcome", panel);
  panel.onDidDispose(() => _panels.delete("welcome"));
  panel.webview.html = buildWelcomeHTML(context);

  panel.webview.onDidReceiveMessage(async (msg) => {
    switch (msg.command) {
      case "openLesson": {
        panel.dispose();
        const { getLessonPanel } = require("./lessonPanel");
        getLessonPanel(context, msg.lessonId, providers);
        break;
      }
      case "openGame": {
        panel.dispose();
        const { getGamePanel } = require("./gamePanel");
        getGamePanel(context, providers);
        break;
      }
      case "resetProgress": {
        const pick = await vscode.window.showWarningMessage(
          "Reset all VimQuest progress? This cannot be undone.",
          "Yes, reset", "Cancel"
        );
        if (pick === "Yes, reset") {
          await context.globalState.update("vimquest.completed", []);
          await context.globalState.update("vimquest.streak", 0);
          await context.globalState.update("vimquest.lastDay", "");
          providers.lessons.refresh();
          providers.progress.refresh();
          panel.webview.html = buildWelcomeHTML(context);
          vscode.window.showInformationMessage("VimQuest: Progress reset!");
        }
        break;
      }
    }
  });
}

function buildWelcomeHTML(context) {
  const completed    = context.globalState.get("vimquest.completed", []);
  const streak       = context.globalState.get("vimquest.streak", 0);
  const totalXP      = LESSONS.filter(l => completed.includes(l.id)).reduce((s,l)=>s+l.xp,0);
  const rank         = getRank(totalXP);
  const nextLesson   = LESSONS.find(l => !completed.includes(l.id));
  const allDone      = completed.length === LESSONS.length;

  const chapters = [...new Set(LESSONS.map(l=>l.chapter))];
  const chCards  = chapters.map(ch => {
    const chL   = LESSONS.filter(l=>l.chapter===ch);
    const done  = chL.filter(l=>completed.includes(l.id)).length;
    const pct   = Math.round(done/chL.length*100);
    return `
    <div class="ch-card">
      <div class="ch-name">${esc(ch)}</div>
      <div class="ch-row">
        <div class="ch-bar-wrap"><div class="ch-bar" style="width:${pct}%"></div></div>
        <span class="ch-count">${done}/${chL.length}</span>
      </div>
    </div>`;
  }).join("");

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<title>VimQuest Dashboard</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:var(--vscode-editor-background,#1e1e2e);
  --fg:var(--vscode-editor-foreground,#cdd6f4);
  --card:var(--vscode-editorWidget-background,#181825);
  --border:var(--vscode-editorWidget-border,#313244);
  --code-bg:var(--vscode-textCodeBlock-background,#11111b);
  --accent:#7c3aed;--accent2:#06b6d4;--green:#10b981;--yellow:#f59e0b;
  --r:10px;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--fg);font-family:var(--vscode-font-family,-apple-system,sans-serif);font-size:14px;min-height:100vh}

/* HERO */
.hero{padding:56px 24px 44px;text-align:center;background:linear-gradient(180deg,rgba(124,58,237,.07) 0%,transparent 100%);border-bottom:1px solid var(--border)}
.hero-icon{font-size:52px;margin-bottom:14px;display:block;filter:drop-shadow(0 0 24px rgba(124,58,237,.5))}
.hero-title{font-size:38px;font-weight:900;letter-spacing:-1px;margin-bottom:10px;background:linear-gradient(135deg,#a855f7,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{font-size:15px;opacity:.6;max-width:440px;margin:0 auto 30px;line-height:1.65}
.hero-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:7px;padding:11px 26px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .15s}
.btn:hover{transform:translateY(-1px)}
.btn-primary{background:linear-gradient(135deg,var(--accent),#9333ea);color:#fff;box-shadow:0 4px 16px rgba(124,58,237,.38)}
.btn-primary:hover{box-shadow:0 6px 22px rgba(124,58,237,.48)}
.btn-outline{background:transparent;color:var(--fg);border:1px solid var(--border)}
.btn-outline:hover{border-color:var(--accent2);color:var(--accent2)}

/* STATS */
.stats{display:flex;justify-content:center;gap:0;border-bottom:1px solid var(--border);background:var(--card)}
.stat{flex:1;max-width:160px;padding:20px 16px;text-align:center;border-right:1px solid var(--border)}
.stat:last-child{border-right:none}
.stat-val{font-size:22px;font-weight:900;margin-bottom:3px}
.stat-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.9px;opacity:.5;font-weight:600}
.xpv{color:var(--yellow)}
.strv{color:var(--green)}
.rnkv{color:#a855f7}

/* LAYOUT */
.layout{max-width:740px;margin:0 auto;padding:32px 20px 60px}
.section-title{font-size:16px;font-weight:800;margin-bottom:14px;letter-spacing:-.3px}

/* CHAPTERS */
.ch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:32px}
.ch-card{padding:15px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--r)}
.ch-name{font-size:13px;font-weight:700;margin-bottom:10px}
.ch-row{display:flex;align-items:center;gap:8px}
.ch-bar-wrap{flex:1;height:5px;background:var(--code-bg);border-radius:3px;overflow:hidden}
.ch-bar{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:3px}
.ch-count{font-size:11px;opacity:.6;font-weight:700;white-space:nowrap}

/* TIPS */
.tips-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:28px}
.tip-card{padding:14px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--r)}
.tip-icon{font-size:18px;margin-bottom:6px}
.tip-title{font-size:12px;font-weight:700;margin-bottom:3px}
.tip-desc{font-size:11px;opacity:.7;line-height:1.5}

/* FOOTER */
.footer{text-align:center;padding-top:8px}
.reset-link{background:none;border:none;font-size:11px;opacity:.35;cursor:pointer;text-decoration:underline;color:var(--fg)}
.reset-link:hover{opacity:.6}
</style>
</head>
<body>

<div class="hero">
  <span class="hero-icon">⚔️</span>
  <div class="hero-title">VimQuest</div>
  <div class="hero-sub">Master Vim from baby steps to advanced — interactive lessons, live practice files, and games.</div>
  <div class="hero-actions">
    ${allDone
      ? `<button class="btn btn-primary" onclick="game()">🏆 All Done! Play Games</button>`
      : `<button class="btn btn-primary" onclick="go('${nextLesson?.id}')">
           ${completed.length === 0 ? "🚀 Start Learning" : "▶ Continue"} — ${esc(nextLesson?.title || "")}
         </button>`
    }
    <button class="btn btn-outline" onclick="game()">🎮 Play Games</button>
  </div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-val xpv">⚡ ${totalXP}</div><div class="stat-lbl">Total XP</div></div>
  <div class="stat"><div class="stat-val">${completed.length}/${LESSONS.length}</div><div class="stat-lbl">Lessons Done</div></div>
  <div class="stat"><div class="stat-val strv">🔥 ${streak}</div><div class="stat-lbl">Day Streak</div></div>
  <div class="stat"><div class="stat-val rnkv">${rank}</div><div class="stat-lbl">Rank</div></div>
</div>

<div class="layout">

  <div class="section-title">📚 Chapter Progress</div>
  <div class="ch-grid">${chCards}</div>

  <div class="section-title">💡 Tips for Success</div>
  <div class="tips-grid">
    <div class="tip-card">
      <div class="tip-icon">🖥️</div>
      <div class="tip-title">Install the Vim Extension</div>
      <div class="tip-desc">Search "Vim by vscodevim" in Extensions to practice commands live in VS Code.</div>
    </div>
    <div class="tip-card">
      <div class="tip-icon">📝</div>
      <div class="tip-title">Use Practice Files</div>
      <div class="tip-desc">Every lesson has an "Open Practice File" button — use it to try commands on real text.</div>
    </div>
    <div class="tip-card">
      <div class="tip-icon">🔁</div>
      <div class="tip-title">Practice Daily</div>
      <div class="tip-desc">10 minutes a day builds muscle memory far better than one long session a week.</div>
    </div>
    <div class="tip-card">
      <div class="tip-icon">🎮</div>
      <div class="tip-title">Reinforce with Games</div>
      <div class="tip-desc">The Quiz, Sequence Builder, and Flashcard Drill lock in what you've learned.</div>
    </div>
  </div>

  <div class="footer">
    <button class="reset-link" onclick="reset()">Reset all progress</button>
  </div>

</div>

<script>
const vscode = acquireVsCodeApi();
function go(id){ vscode.postMessage({command:'openLesson', lessonId:id}); }
function game(){ vscode.postMessage({command:'openGame'}); }
function reset(){ vscode.postMessage({command:'resetProgress'}); }
</script>
</body>
</html>`;
}

function esc(s){
  return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

module.exports = { getWelcomePanel };
