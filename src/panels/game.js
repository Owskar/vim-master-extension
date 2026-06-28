// ─────────────────────────────────────────────────────────────
//  Game Panel — assembles registered games into one webview.
//  Games come from src/games/index.js — edit that to add/remove.
// ─────────────────────────────────────────────────────────────
const vscode = require('vscode');
const GAMES  = require('../games/index');

const _panels = new Map();

function getGamePanel(context, providers) {
  if (_panels.has('game')) {
    try { _panels.get('game').reveal(vscode.ViewColumn.One); return; } catch (_) {}
  }

  const panel = vscode.window.createWebviewPanel(
    'vimquestGame',
    '🎮 VimQuest — Command Dojo',
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [] }
  );

  _panels.set('game', panel);
  panel.onDidDispose(() => _panels.delete('game'));
  panel.webview.html = buildHTML();

  panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg.command === 'saveScore') {
      const key  = 'vimquest.best.' + msg.game;
      const best = context.globalState.get(key, 0);
      if (msg.score > best) {
        await context.globalState.update(key, msg.score);
        vscode.window.showInformationMessage('🏆 New best in ' + msg.game + ': ' + msg.score + '!');
      }
    }
    if (msg.command === 'goHome') {
      const { getWelcomePanel } = require('./welcome');
      panel.dispose();
      getWelcomePanel(context, providers);
    }
  });
}

// ── Build the full HTML by composing registered game modules ──
function buildHTML() {
  // Tab bar
  const tabsHTML = GAMES.map(g =>
    '<div class="tab-btn" id="tab-' + g.id + '" onclick="switchGame(\'' + g.id + '\')">' +
      '<span class="tab-icon">' + g.icon + '</span>' +
      '<span class="tab-label">' + g.label + '</span>' +
      (g.isNew ? '<span class="new-tag">NEW</span>' : '') +
    '</div>'
  ).join('');

  // Data is serialised via inlineGameData() below

  // Each game's runtime script
  const scriptBlocks = GAMES.map(g => g.script()).join('\n');

  // Switch-game dispatch — auto-built from registry
  const switchCases = GAMES.map(g =>
    'if (name === \'' + g.id + '\') { window.' + g.id.toUpperCase() + '.start(); }'
  ).join('\n  else ');

  // First game id for boot
  const firstGame = GAMES[0].id;
  const firstFn   = firstGame.toUpperCase();

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);font-family:var(--vscode-font-family,sans-serif);font-size:14px;min-height:100vh}

/* ── NAV ── */
.topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 18px;border-bottom:1px solid var(--vscode-widget-border,#333);background:var(--vscode-editorWidget-background)}
.topbar-logo{font-size:16px;font-weight:800;color:#22c55e}
.back-btn{padding:5px 14px;border-radius:6px;cursor:pointer;font-size:12px;background:none;border:1px solid var(--vscode-widget-border,#555);color:var(--vscode-editor-foreground)}
.back-btn:hover{border-color:#06b6d4;color:#06b6d4}

/* ── LAYOUT ── */
.wrap{max-width:800px;margin:0 auto;padding:22px 18px 50px}
.ptitle{font-size:22px;font-weight:900;margin-bottom:3px}
.psub{font-size:13px;opacity:.6;margin-bottom:20px}

/* ── TABS ── */
.tabs{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}
.tab-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 16px;border-radius:10px;cursor:pointer;border:2px solid var(--vscode-widget-border,#444);background:var(--vscode-editorWidget-background);min-width:100px;transition:border-color .15s;user-select:none}
.tab-btn:hover{border-color:#7c3aed}
.tab-btn.active{border-color:#22c55e;background:rgba(34,197,94,.08)}
.tab-icon{font-size:22px}
.tab-label{font-size:12px;font-weight:700}
.new-tag{font-size:9px;font-weight:800;padding:1px 5px;border-radius:3px;background:#22c55e;color:#000;letter-spacing:.4px}

/* ── GAMEBOX ── */
#gamebox{border:1px solid var(--vscode-widget-border,#444);border-radius:10px;padding:22px;background:var(--vscode-editorWidget-background);min-height:360px}

/* ── SHARED COMPONENTS ── */
.g-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.g-title{font-size:16px;font-weight:700}
.g-score{font-size:13px;font-weight:700;color:#f59e0b}
.prog-bar{height:5px;background:rgba(255,255,255,.08);border-radius:3px;margin-bottom:16px;overflow:hidden}
.prog-fill{height:100%;background:linear-gradient(90deg,#22c55e,#06b6d4);border-radius:3px;transition:width .3s}
.result-box{display:flex;flex-direction:column;align-items:center;gap:13px;padding:28px 0;text-align:center}
.r-emoji{font-size:50px}
.r-title{font-size:22px;font-weight:800}
.r-score{font-size:17px;color:#f59e0b;font-weight:700}
.r-msg{font-size:13px;opacity:.7;max-width:280px;line-height:1.6}
.green-btn{padding:10px 24px;border-radius:8px;background:#22c55e;color:#000;border:none;font-weight:800;font-size:13px;cursor:pointer}
.green-btn:hover{background:#16a34a}

/* ── QUIZ ── */
.cmd-box{text-align:center;margin:16px 0}
.cmd-lbl{font-size:11px;opacity:.5;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.cmd-key{font-family:'Cascadia Code','Fira Code',Consolas,monospace;font-size:40px;font-weight:900;padding:12px 26px;background:rgba(0,0,0,.3);border:2px solid #444;border-radius:12px;color:#e879f9;display:inline-block;letter-spacing:2px;transition:all .2s}
.cmd-key.key-ok{border-color:#22c55e;color:#22c55e}
.cmd-key.key-no{border-color:#f87171;color:#f87171;animation:shk .3s}
@keyframes shk{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.opt-btn{padding:11px 14px;border-radius:8px;border:1px solid #444;background:rgba(0,0,0,.2);color:var(--vscode-editor-foreground);font-size:13px;cursor:pointer;text-align:left;font-family:inherit;transition:all .15s}
.opt-btn:hover:not([disabled]){border-color:#7c3aed;background:rgba(124,58,237,.1)}
.opt-btn.opt-ok{border-color:#22c55e!important;background:rgba(34,197,94,.12)!important;color:#22c55e!important}
.opt-btn.opt-no{border-color:#f87171!important;background:rgba(248,113,113,.1)!important;color:#f87171!important}
.opt-btn[disabled]{cursor:default}

/* ── SEQUENCE / SPEED ── */
.task-box{padding:13px 16px;background:rgba(0,0,0,.25);border:1px solid #444;border-radius:8px;font-size:14px;line-height:1.65;margin:12px 0}
.input-row{display:flex;gap:10px;align-items:center}
.cmd-input{flex:1;font-family:'Cascadia Code',Consolas,monospace;font-size:16px;padding:9px 14px;background:rgba(0,0,0,.3);border:2px solid #444;border-radius:8px;color:var(--vscode-editor-foreground);outline:none}
.cmd-input:focus{border-color:#22c55e}
.link-btn{background:none;border:none;font-size:12px;cursor:pointer;text-decoration:underline;opacity:.6;color:var(--vscode-editor-foreground);padding:0}
.link-btn:hover{opacity:1}
.hint-box{font-size:12px;opacity:.75;font-style:italic;margin-top:6px;padding:7px 12px;background:rgba(6,182,212,.07);border-radius:6px;border-left:2px solid #06b6d4}

/* ── WORDLE ── */
.w-hint{font-size:13px;padding:10px 16px;background:rgba(6,182,212,.07);border:1px solid rgba(6,182,212,.2);border-radius:8px;text-align:center;line-height:1.6;max-width:340px}
.w-grid{display:flex;flex-direction:column;gap:6px}
.w-row{display:flex;gap:6px}
.w-cell{width:52px;height:52px;border:2px solid #444;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:20px;font-weight:900;background:rgba(0,0,0,.3);transition:all .2s}
.w-cell.w-cur{border-color:#06b6d4}
.w-cell.w-hit{background:#166534;border-color:#22c55e;color:#fff}
.w-cell.w-mis{background:#854d0e;border-color:#f59e0b;color:#fff}
.w-cell.w-out{background:#374151;border-color:#4b5563;color:#9ca3af}
.w-msg{font-size:14px;font-weight:700;min-height:22px;text-align:center}
.w-ok{color:#22c55e}.w-no{color:#f87171}
.w-kb{display:flex;flex-direction:column;gap:5px;align-items:center}
.w-kb-row{display:flex;gap:4px}
.w-key{min-width:34px;height:36px;padding:0 6px;border-radius:6px;background:rgba(255,255,255,.1);border:1px solid #555;color:var(--vscode-editor-foreground);font-family:monospace;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center}
.w-key:hover{border-color:#7c3aed}
.w-wide{min-width:52px;font-size:10px}
.w-k-hit{background:#166534;border-color:#22c55e;color:#fff}
.w-k-mis{background:#854d0e;border-color:#f59e0b;color:#fff}
.w-k-out{background:#374151;border-color:#4b5563;color:#9ca3af}

/* ── FLASHCARDS ── */
.fc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.fc{padding:14px 10px;background:rgba(0,0,0,.25);border:2px solid #444;border-radius:9px;cursor:pointer;text-align:center;min-height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;transition:all .18s;user-select:none}
.fc:hover{border-color:#22c55e;transform:translateY(-2px)}
.fc.fc-open{border-color:#22c55e;background:rgba(34,197,94,.06)}
.fc-key{font-family:monospace;font-size:17px;font-weight:900;color:#e879f9}
.fc-def{font-size:11px;line-height:1.4;visibility:hidden;max-width:120px}
.fc.fc-open .fc-def{visibility:visible}
</style>
</head>
<body>

<div class="topbar">
  <span class="topbar-logo">📗 VimQuest</span>
  <button class="back-btn" onclick="goHome()">← Dashboard</button>
</div>

<div class="wrap">
  <div class="ptitle">🎮 Command Dojo</div>
  <div class="psub">Games to sharpen your Vim muscle memory</div>
  <div class="tabs">${tabsHTML}</div>
  <div id="gamebox"></div>
</div>

<script>
/* ── VS Code API ── */
var vsc = acquireVsCodeApi();

/* ── Game data (each game module declares its own var) ── */
${inlineGameData()}

/* ── Shared helpers used by every game module ── */
var currentGame = '';

function ge(id) { return document.getElementById(id); }

function setBox(html) {
  var box = ge('gamebox');
  if (box) box.innerHTML = html;
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length-1; i > 0; i--) {
    var j = Math.floor(Math.random()*(i+1));
    var t = a[i]; a[i]=a[j]; a[j]=t;
  }
  return a;
}

function hdr(title, score) {
  return '<div class="g-hdr"><span class="g-title">'+title+'</span><span class="g-score">'+score+'</span></div>';
}

function prog(pct) {
  return '<div class="prog-bar"><div class="prog-fill" style="width:'+pct+'%"></div></div>';
}

function result(emoji, title, score, msg, restartCall) {
  return '<div class="result-box">' +
    '<div class="r-emoji">'+emoji+'</div>' +
    '<div class="r-title">'+title+'</div>' +
    '<div class="r-score">'+score+'</div>' +
    '<div class="r-msg">'+msg+'</div>' +
    '<button class="green-btn" onclick="'+restartCall+'">🔄 Play Again</button>' +
    '</div>';
}

function saveScore(game, score) {
  vsc.postMessage({ command: 'saveScore', game: game, score: score });
}

function goHome() { vsc.postMessage({ command: 'goHome' }); }

/* ── Each game's runtime logic ── */
${scriptBlocks}

/* ── Tab switcher ── */
function switchGame(name) {
  currentGame = name;
  var tabs = document.querySelectorAll('.tab-btn');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].className = 'tab-btn' + (tabs[i].id === 'tab-'+name ? ' active' : '');
  }
  ${switchCases}
}

/* ── Boot: start first registered game immediately ── */
switchGame('${firstGame}');
</script>
</body>
</html>`;
}

// Serialise game data arrays from Node into the HTML
function inlineGameData() {
  const quiz  = require('../games/quiz');
  const seq   = require('../games/sequence');
  const speed = require('../games/speedrun');
  const wdl   = require('../games/wordle');
  const flash = require('../games/flashcards');

  function ser(name, val) {
    return 'var ' + name + ' = ' + JSON.stringify(val) + ';';
  }

  const lines = [];
  if (GAMES.find(g => g.id === 'quiz'))   lines.push(ser('QUIZ_DATA',   quiz.data   || []));
  if (GAMES.find(g => g.id === 'seq'))    lines.push(ser('SEQ_DATA',    seq.data     || []));
  if (GAMES.find(g => g.id === 'speed'))  lines.push(ser('SPEED_DATA',  speed.data || []));
  if (GAMES.find(g => g.id === 'wordle')) lines.push(ser('WORDLE_DATA', wdl.data  || []));
  if (GAMES.find(g => g.id === 'flash'))  lines.push(ser('FLASH_DATA',  flash.data || []));
  return lines.join('\n');
}

module.exports = { getGamePanel };
