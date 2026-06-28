const vscode = require("vscode");
const { LESSONS } = require('../lessons');
const { getRank }  = require('../sidebar');

const _panels = new Map();

function getWelcomePanel(context, providers) {
  if (_panels.has("welcome")) {
    try { _panels.get("welcome").reveal(vscode.ViewColumn.One); return; } catch(_) {}
  }
  const panel = vscode.window.createWebviewPanel(
    "vimquestWelcome", "⚔️ VimQuest — Dashboard",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [] }
  );
  _panels.set("welcome", panel);
  panel.onDidDispose(() => _panels.delete("welcome"));
  panel.webview.html = buildHTML(context);

  panel.webview.onDidReceiveMessage(async (msg) => {
    switch (msg.command) {
      case "openLesson": {
        panel.dispose();
        const { getLessonPanel } = require('./lesson');
        getLessonPanel(context, msg.lessonId, providers);
        break;
      }
      case "openGame": {
        panel.dispose();
        const { getGamePanel } = require('./game');
        getGamePanel(context, providers);
        break;
      }
      case "openCheatsheet": {
        panel.dispose();
        const { getCheatsheetPanel } = require("./cheatsheetPanel");
        getCheatsheetPanel(context, providers);
        break;
      }
      case "openDaily": {
        panel.dispose();
        const { getDailyPanel } = require("./dailyPanel");
        getDailyPanel(context, providers);
        break;
      }
      case "resetProgress": {
        const pick = await vscode.window.showWarningMessage(
          "Reset all VimQuest progress?", "Yes, reset", "Cancel"
        );
        if (pick === "Yes, reset") {
          await context.globalState.update("vimquest.completed", []);
          await context.globalState.update("vimquest.streak", 0);
          await context.globalState.update("vimquest.lastDay", "");
          providers.lessons.refresh();
          providers.progress.refresh();
          panel.webview.html = buildHTML(context);
          vscode.window.showInformationMessage("VimQuest: Progress reset!");
        }
        break;
      }
    }
  });
}

function buildHTML(context) {
  const completed  = context.globalState.get("vimquest.completed", []);
  const streak     = context.globalState.get("vimquest.streak", 0);
  const totalXP    = LESSONS.filter(l => completed.includes(l.id)).reduce((s,l)=>s+l.xp,0);
  const rank       = getRank(totalXP);
  const nextLesson = LESSONS.find(l => !completed.includes(l.id));
  const allDone    = completed.length === LESSONS.length;
  const today      = new Date().toDateString();
  const lastDay    = context.globalState.get("vimquest.lastDay", "");
  const challengeDone = lastDay === today && completed.length > 0;

  const chapters = [...new Set(LESSONS.map(l=>l.chapter))];
  const chCards  = chapters.map(ch => {
    const chL  = LESSONS.filter(l=>l.chapter===ch);
    const done = chL.filter(l=>completed.includes(l.id)).length;
    const pct  = Math.round(done/chL.length*100);
    const full = done === chL.length;
    return `<div class="ch-card${full?' ch-full':''}">
      <div class="ch-name">${esc(ch)}</div>
      <div class="ch-row">
        <div class="ch-bar-wrap"><div class="ch-bar" style="width:${pct}%"></div></div>
        <span class="ch-count">${done}/${chL.length}</span>
      </div>
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:var(--vscode-editor-background,#0f0f1a);
  --fg:var(--vscode-editor-foreground,#e2e8f0);
  --card:var(--vscode-editorWidget-background,#1a1a2e);
  --border:var(--vscode-editorWidget-border,#2d2d4a);
  --code-bg:var(--vscode-textCodeBlock-background,#0d0d1a);
  --accent:#7c3aed;--accent2:#06b6d4;--green:#22c55e;--yellow:#f59e0b;--red:#f87171;
  --r:12px;
}
body{background:var(--bg);color:var(--fg);font-family:var(--vscode-font-family,-apple-system,sans-serif);font-size:14px;min-height:100vh}

/* HERO */
.hero{padding:48px 24px 36px;text-align:center;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(124,58,237,.18) 0%,transparent 70%);border-bottom:1px solid var(--border)}
.logo-wrap{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:16px}
.logo-img{width:64px;height:64px;border-radius:50%;box-shadow:0 0 32px rgba(34,197,94,.4)}
.hero-title{font-size:36px;font-weight:900;letter-spacing:-1px;background:linear-gradient(135deg,#86efac,#22c55e,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{font-size:14px;opacity:.6;max-width:420px;margin:10px auto 28px;line-height:1.65}
.hero-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:7px;padding:10px 22px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .15s;letter-spacing:.2px}
.btn:hover{transform:translateY(-1px)}
.btn-green{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;box-shadow:0 4px 16px rgba(34,197,94,.35)}
.btn-green:hover{box-shadow:0 6px 22px rgba(34,197,94,.45)}
.btn-purple{background:linear-gradient(135deg,var(--accent),#9333ea);color:#fff;box-shadow:0 4px 16px rgba(124,58,237,.35)}
.btn-purple:hover{box-shadow:0 6px 22px rgba(124,58,237,.45)}
.btn-cyan{background:linear-gradient(135deg,var(--accent2),#0891b2);color:#fff;box-shadow:0 4px 16px rgba(6,182,212,.3)}
.btn-outline{background:transparent;color:var(--fg);border:1px solid var(--border)}
.btn-outline:hover{border-color:var(--accent2);color:var(--accent2)}
.btn-yellow{background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;box-shadow:0 4px 16px rgba(245,158,11,.3)}

/* STATS */
.stats{display:flex;justify-content:center;border-bottom:1px solid var(--border);background:var(--card);flex-wrap:wrap}
.stat{flex:1;min-width:100px;max-width:160px;padding:18px 12px;text-align:center;border-right:1px solid var(--border)}
.stat:last-child{border-right:none}
.stat-val{font-size:20px;font-weight:900;margin-bottom:3px}
.stat-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.9px;opacity:.5;font-weight:600}
.xpv{color:var(--yellow)}.strv{color:var(--green)}.rnkv{color:#a855f7}

/* LAYOUT */
.layout{max-width:780px;margin:0 auto;padding:28px 20px 60px}
.sec{margin-bottom:30px}
.sec-title{font-size:15px;font-weight:800;margin-bottom:14px;letter-spacing:-.3px;display:flex;align-items:center;gap:8px}

/* FEATURE CARDS */
.feature-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
.feat-card{padding:18px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--r);cursor:pointer;transition:all .18s;text-align:center}
.feat-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 8px 24px rgba(124,58,237,.15)}
.feat-icon{font-size:28px;margin-bottom:10px}
.feat-title{font-size:13px;font-weight:700;margin-bottom:4px}
.feat-desc{font-size:11px;opacity:.6;line-height:1.5}
.feat-card.feat-daily{border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.05)}
.feat-card.feat-daily:hover{border-color:var(--yellow)}
.feat-card.feat-new::after{content:'NEW';position:absolute;top:8px;right:8px;font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;background:var(--green);color:#000;letter-spacing:.5px}
.feat-card{position:relative}

/* CHAPTER CARDS */
.ch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.ch-card{padding:14px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--r);transition:border-color .15s}
.ch-full{border-color:rgba(34,197,94,.35)!important}
.ch-name{font-size:13px;font-weight:700;margin-bottom:10px}
.ch-row{display:flex;align-items:center;gap:8px}
.ch-bar-wrap{flex:1;height:5px;background:var(--code-bg);border-radius:3px;overflow:hidden}
.ch-bar{height:100%;background:linear-gradient(90deg,#22c55e,#06b6d4);border-radius:3px;transition:width .5s}
.ch-count{font-size:11px;opacity:.6;font-weight:700;white-space:nowrap}

/* CONTINUE BANNER */
.continue-banner{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:linear-gradient(135deg,rgba(34,197,94,.1),rgba(6,182,212,.08));border:1px solid rgba(34,197,94,.25);border-radius:var(--r);margin-bottom:28px;gap:12px;flex-wrap:wrap}
.continue-text{font-size:14px;font-weight:700}
.continue-sub{font-size:12px;opacity:.6;margin-top:2px}

/* DAILY BADGE */
.daily-done{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:20px;font-size:11px;font-weight:700;color:var(--green)}

/* FOOTER */
.footer{text-align:center;padding-top:8px}
.reset-link{background:none;border:none;font-size:11px;opacity:.3;cursor:pointer;text-decoration:underline;color:var(--fg)}
.reset-link:hover{opacity:.6}
</style>
</head>
<body>

<div class="hero">
  <div class="logo-wrap">
    <span style="font-size:48px;filter:drop-shadow(0 0 20px rgba(34,197,94,.5))">📗</span>
    <div>
      <div class="hero-title">VimQuest</div>
    </div>
  </div>
  <div class="hero-sub">Master Vim from baby steps to advanced — lessons, games, daily challenges & more.</div>
  <div class="hero-btns">
    ${allDone
      ? `<button class="btn btn-purple" onclick="game()">🏆 All Done! Play Games</button>`
      : `<button class="btn btn-green" onclick="go('${nextLesson?.id}')">
           ${completed.length===0?'🚀 Start Learning':'▶ Continue'} — ${esc(nextLesson?.title||'')}
         </button>`}
    <button class="btn btn-yellow" onclick="daily()">⚡ Daily Challenge ${challengeDone?'✓':''}</button>
    <button class="btn btn-outline" onclick="cheatsheet()">📋 Cheat Sheet</button>
  </div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-val xpv">⚡ ${totalXP}</div><div class="stat-lbl">Total XP</div></div>
  <div class="stat"><div class="stat-val">${completed.length}/${LESSONS.length}</div><div class="stat-lbl">Lessons</div></div>
  <div class="stat"><div class="stat-val strv">🔥 ${streak}</div><div class="stat-lbl">Streak</div></div>
  <div class="stat"><div class="stat-val rnkv">${rank}</div><div class="stat-lbl">Rank</div></div>
</div>

<div class="layout">

  ${!allDone && nextLesson ? `
  <div class="continue-banner">
    <div>
      <div class="continue-text">📖 Next up: ${esc(nextLesson.title)}</div>
      <div class="continue-sub">${esc(nextLesson.chapter)} · +${nextLesson.xp} XP</div>
    </div>
    <button class="btn btn-green" onclick="go('${nextLesson.id}')">Continue →</button>
  </div>` : ''}

  <div class="sec">
    <div class="sec-title">🎮 Games &amp; Activities</div>
    <div class="feature-grid">
      <div class="feat-card" onclick="game()">
        <div class="feat-icon">⚡</div>
        <div class="feat-title">Command Quiz</div>
        <div class="feat-desc">50 commands, multiple choice — test your knowledge</div>
      </div>
      <div class="feat-card" onclick="game()">
        <div class="feat-icon">🧩</div>
        <div class="feat-title">Sequence Builder</div>
        <div class="feat-desc">Type the right command for each task</div>
      </div>
      <div class="feat-card" onclick="game()">
        <div class="feat-icon">💨</div>
        <div class="feat-title">Speed Run</div>
        <div class="feat-desc">Answer 10 commands as fast as possible — beat your time!</div>
      </div>
      <div class="feat-card feat-new" onclick="game()">
        <div class="feat-icon">🧠</div>
        <div class="feat-title">Vim Wordle</div>
        <div class="feat-desc">Guess the hidden Vim command in 6 tries</div>
      </div>
      <div class="feat-card feat-new" onclick="game()">
        <div class="feat-icon">🃏</div>
        <div class="feat-title">Flashcard Drill</div>
        <div class="feat-desc">Flip cards to drill command meanings</div>
      </div>
      <div class="feat-card feat-daily" onclick="daily()">
        <div class="feat-icon">📅</div>
        <div class="feat-title">Daily Challenge ${challengeDone?'<span class="daily-done">✓ Done</span>':''}  </div>
        <div class="feat-desc">A new Vim puzzle every day — build your streak</div>
      </div>
    </div>
  </div>

  <div class="sec">
    <div class="sec-title">📚 Chapter Progress</div>
    <div class="ch-grid">${chCards}</div>
  </div>

  <div class="footer">
    <button class="reset-link" onclick="reset()">Reset all progress</button>
  </div>
</div>

<script>
const vscode = acquireVsCodeApi();
function go(id)    { vscode.postMessage({command:'openLesson',lessonId:id}); }
function game()    { vscode.postMessage({command:'openGame'}); }
function cheatsheet(){ vscode.postMessage({command:'openCheatsheet'}); }
function daily()   { vscode.postMessage({command:'openDaily'}); }
function reset()   { vscode.postMessage({command:'resetProgress'}); }
</script>
</body>
</html>`;
}

function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
module.exports = { getWelcomePanel };
