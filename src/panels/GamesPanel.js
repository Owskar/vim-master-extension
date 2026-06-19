const vscode = require('vscode');

class GamesPanel {
  static currentPanel = undefined;
  static viewType = 'vimMasterGames';

  static createOrShow(extensionUri, storageManager) {
    const column = vscode.ViewColumn.Two;
    if (GamesPanel.currentPanel) {
      GamesPanel.currentPanel._panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      GamesPanel.viewType, 'VimMaster — Games', column,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    GamesPanel.currentPanel = new GamesPanel(panel, storageManager);
  }

  constructor(panel, storageManager) {
    this._panel = panel;
    this._storageManager = storageManager;
    this._disposables = [];
    this._panel.webview.html = this._buildHtml();
    this._panel.onDidDispose(() => {
      GamesPanel.currentPanel = undefined;
      this.dispose();
    }, null, this._disposables);
    this._panel.webview.onDidReceiveMessage(msg => {
      if (msg.command === 'saveScore') {
        this._storageManager.updateGameScore(msg.game, msg.score);
        const p = this._storageManager.getProgress();
        this._panel.webview.postMessage({ command: 'scores', data: p ? p.gameHighScores : {} });
      }
    }, null, this._disposables);
    // Send scores on load
    setTimeout(() => {
      const p = this._storageManager.getProgress();
      if (p) this._panel.webview.postMessage({ command: 'scores', data: p.gameHighScores || {} });
    }, 500);
  }

  dispose() {
    GamesPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) { const d = this._disposables.pop(); if (d) d.dispose(); }
  }

  _buildHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VimMaster Games</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
:root {
  --bg0:#0a0c0f;--bg1:#0f1117;--bg2:#161b22;--bg3:#1c2128;
  --border:#21262d;--border2:#30363d;
  --green:#3fb950;--green-dim:#238636;--blue:#58a6ff;--blue-dim:#1f6feb;
  --purple:#bc8cff;--yellow:#e3b341;--red:#f85149;--orange:#f0883e;
  --text:#e6edf3;--text2:#8b949e;--text3:#484f58;
  --mono:'IBM Plex Mono',monospace;--sans:'IBM Plex Sans',sans-serif;
  --r:6px;--rl:10px;
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html,body{height:100%;font-family:var(--sans);background:var(--bg0);color:var(--text);font-size:13px;overflow:hidden;display:flex;flex-direction:column;}
::-webkit-scrollbar{width:5px;background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}

.topbar{display:flex;align-items:center;gap:0;background:var(--bg1);border-bottom:1px solid var(--border);height:46px;padding:0 0 0 16px;flex-shrink:0;}
.logo{font-family:var(--mono);font-size:12px;font-weight:700;color:var(--green);padding-right:16px;border-right:1px solid var(--border);margin-right:8px;}
.logo span{color:var(--text3);}

.game-tabs{display:flex;height:100%;gap:2px;padding:0 8px;}
.gtab{display:flex;align-items:center;gap:7px;height:100%;padding:0 16px;color:var(--text2);cursor:pointer;font-size:12px;font-family:var(--mono);border:none;background:none;border-bottom:2px solid transparent;transition:color .15s,border-color .15s;white-space:nowrap;}
.gtab:hover{color:var(--text);}
.gtab.active{color:var(--green);border-bottom-color:var(--green);}
.gtab-icon{font-size:14px;}

.scores-bar{margin-left:auto;display:flex;gap:6px;padding:0 16px;border-left:1px solid var(--border);}
.sc-pill{font-family:var(--mono);font-size:10px;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);padding:3px 8px;color:var(--text2);}
.sc-pill b{color:var(--yellow);}

.game-area{flex:1;overflow:hidden;position:relative;}
.game-screen{display:none;width:100%;height:100%;overflow-y:auto;padding:24px;flex-direction:column;align-items:center;justify-content:flex-start;}
.game-screen.active{display:flex;}

/* SHARED */
.game-container{width:100%;max-width:680px;}
.g-title{font-family:var(--mono);font-size:20px;font-weight:700;margin-bottom:6px;}
.g-subtitle{color:var(--text2);font-size:12px;margin-bottom:24px;line-height:1.5;}
.g-score-row{display:flex;justify-content:space-between;align-items:center;background:var(--bg1);border:1px solid var(--border);border-radius:var(--r);padding:10px 16px;margin-bottom:16px;font-family:var(--mono);font-size:13px;}
.g-score-val{color:var(--yellow);font-size:20px;font-weight:700;}
.g-score-lbl{color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:.07em;}

.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:var(--r);border:1px solid;font-family:var(--mono);font-size:12px;font-weight:600;cursor:pointer;transition:all .12s;}
.btn-green{background:var(--green-dim);border-color:var(--green);color:#fff;}
.btn-green:hover{background:var(--green);}
.btn-ghost{background:var(--bg2);border-color:var(--border2);color:var(--text2);}
.btn-ghost:hover{color:var(--text);border-color:var(--text3);}
.btn-blue{background:rgba(88,166,255,.1);border-color:rgba(88,166,255,.3);color:var(--blue);}
.btn-blue:hover{background:rgba(88,166,255,.2);}

/* start screens */
.start-screen{text-align:center;padding:40px 20px;max-width:520px;margin:0 auto;}
.start-icon{font-size:52px;margin-bottom:16px;}
.start-h{font-size:22px;font-weight:700;font-family:var(--mono);margin-bottom:8px;}
.start-p{color:var(--text2);font-size:13px;line-height:1.6;margin-bottom:24px;}
.start-rules{background:var(--bg2);border:1px solid var(--border);border-radius:var(--rl);padding:16px;text-align:left;margin-bottom:24px;font-size:12px;color:var(--text2);}
.start-rules li{margin-bottom:6px;padding-left:4px;}

/* game over */
.gameover{text-align:center;padding:32px 20px;}
.go-title{font-size:22px;font-weight:700;font-family:var(--mono);margin-bottom:6px;}
.go-score{font-size:52px;font-weight:700;font-family:var(--mono);color:var(--yellow);line-height:1;margin:16px 0;}
.go-sub{color:var(--text2);font-size:12px;margin-bottom:24px;}

/* ────────────────────────────────
   GAME 1 — VIM RACER
──────────────────────────────── */
.racer-track{background:var(--bg1);border:1px solid var(--border);border-radius:var(--rl);padding:24px;margin-bottom:16px;}
.racer-phrase{font-family:var(--mono);font-size:16px;line-height:2;letter-spacing:.04em;min-height:56px;word-break:break-all;}
.rc{display:inline;}
.rc-done{color:var(--green);}
.rc-cur{background:var(--green);color:#000;border-radius:2px;animation:blink .9s step-end infinite;}
.rc-wrong{background:var(--red);color:#fff;border-radius:2px;}
.rc-pend{color:var(--text3);}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

.racer-input{width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);padding:10px 14px;font-family:var(--mono);font-size:14px;color:transparent;caret-color:var(--green);outline:none;transition:border-color .15s;}
.racer-input:focus{border-color:var(--green);}
.racer-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px;}
.rstat{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:10px;text-align:center;}
.rstat-val{font-family:var(--mono);font-size:22px;font-weight:700;color:var(--blue);}
.rstat-lbl{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-top:3px;}

/* ────────────────────────────────
   GAME 2 — COMMAND COMBAT
──────────────────────────────── */
.combat-lives{font-size:22px;letter-spacing:3px;}
.combat-q-card{background:var(--bg1);border:1px solid var(--border);border-radius:var(--rl);padding:28px;text-align:center;margin-bottom:20px;position:relative;}
.combat-q-label{font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;}
.combat-q-text{font-size:17px;font-weight:600;margin-bottom:12px;}
.combat-mode-tag{display:inline-block;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--r);padding:3px 10px;font-family:var(--mono);font-size:11px;color:var(--text2);}
.combat-timer{font-family:var(--mono);font-size:36px;font-weight:700;color:var(--yellow);margin-top:14px;transition:color .3s;}
.combat-timer.urgent{color:var(--red);animation:pulse .5s ease infinite;}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}

.combat-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.copt{background:var(--bg2);border:1px solid var(--border2);border-radius:var(--rl);padding:16px;cursor:pointer;font-family:var(--mono);font-size:15px;font-weight:700;text-align:center;color:var(--blue);transition:all .12s;}
.copt:hover{border-color:var(--blue-dim);background:rgba(88,166,255,.08);}
.copt.correct{border-color:var(--green)!important;background:rgba(63,185,80,.12)!important;color:var(--green)!important;}
.copt.wrong{border-color:var(--red)!important;background:rgba(248,81,73,.12)!important;color:var(--red)!important;}

.combat-feedback{text-align:center;font-size:12px;color:var(--text2);font-family:var(--mono);margin-top:10px;min-height:20px;}

/* ────────────────────────────────
   GAME 3 — MOTION MASTER
──────────────────────────────── */
.motion-display{background:var(--bg1);border:1px solid var(--border);border-radius:var(--rl);padding:24px;font-family:var(--mono);font-size:15px;line-height:2.2;min-height:120px;margin-bottom:16px;word-spacing:8px;}
.mot-word{display:inline-block;margin-right:10px;padding:2px 4px;border-radius:3px;transition:all .12s;}
.mot-cursor{background:var(--green);color:#000!important;font-weight:700;}
.mot-target{background:rgba(227,179,65,.2);border:1px solid var(--yellow);color:var(--yellow);}

.motion-task{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:12px 16px;margin-bottom:14px;font-size:13px;font-family:var(--mono);color:var(--text2);}
.motion-task b{color:var(--green);}

.motion-btns{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}
.mbtn{padding:8px 14px;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);cursor:pointer;font-family:var(--mono);font-size:12px;font-weight:700;color:var(--blue);transition:all .12s;}
.mbtn:hover{border-color:var(--blue);background:rgba(88,166,255,.1);}
.mbtn:active{transform:scale(.96);}

/* ────────────────────────────────
   GAME 4 — TEXT SNIPER
──────────────────────────────── */
.sniper-editor{background:var(--bg0);border:1px solid var(--border);border-radius:var(--rl);padding:22px;font-family:var(--mono);font-size:14px;line-height:2;min-height:120px;margin-bottom:14px;}
.snip-hl{background:rgba(248,81,73,.2);border:1px solid var(--red);border-radius:2px;padding:0 3px;color:var(--red);}
.sniper-task{background:rgba(248,81,73,.07);border:1px solid rgba(248,81,73,.2);border-radius:var(--r);padding:12px 16px;margin-bottom:14px;font-size:12px;font-family:var(--mono);color:var(--text2);}
.sniper-task b{color:var(--red);}
.sniper-input-label{font-family:var(--mono);font-size:11px;color:var(--text3);margin-bottom:6px;}
.sniper-input{width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);padding:10px 14px;font-family:var(--mono);font-size:14px;color:var(--text);outline:none;transition:border-color .15s;}
.sniper-input:focus{border-color:var(--red);}
.sniper-fb{min-height:20px;font-family:var(--mono);font-size:12px;margin-top:8px;color:var(--text2);}
</style>
</head>
<body>

<div class="topbar">
  <div class="logo">⌨️ vim<span>master</span> // games</div>
  <div class="game-tabs">
    <button class="gtab active" onclick="showGame('racer',this)"><span class="gtab-icon">🏎️</span>racer</button>
    <button class="gtab" onclick="showGame('combat',this)"><span class="gtab-icon">⚔️</span>combat</button>
    <button class="gtab" onclick="showGame('motion',this)"><span class="gtab-icon">🎯</span>motion</button>
    <button class="gtab" onclick="showGame('sniper',this)"><span class="gtab-icon">🔫</span>sniper</button>
  </div>
  <div class="scores-bar">
    <div class="sc-pill" id="sc-racer">🏎️ <b id="sval-racer">0</b></div>
    <div class="sc-pill" id="sc-combat">⚔️ <b id="sval-combat">0</b></div>
    <div class="sc-pill" id="sc-motion">🎯 <b id="sval-motion">0</b></div>
    <div class="sc-pill" id="sc-sniper">🔫 <b id="sval-sniper">0</b></div>
  </div>
</div>

<div class="game-area">

<!-- ══ GAME 1: VIM RACER ══ -->
<div class="game-screen active" id="gs-racer">
  <div class="game-container" id="racer-wrap">
    <div class="start-screen">
      <div class="start-icon">🏎️</div>
      <div class="start-h">Vim Racer</div>
      <div class="start-p">Type Vim commands as fast and accurately as you can. Beat the clock, build your score!</div>
      <div class="start-rules">
        <li>Type each phrase displayed exactly</li>
        <li>Score = characters typed × remaining time factor</li>
        <li>You have 60 seconds per round</li>
        <li>Wrong characters show in red</li>
      </div>
      <button class="btn btn-green" onclick="racerStart()">▶ start game</button>
    </div>
  </div>
</div>

<!-- ══ GAME 2: COMMAND COMBAT ══ -->
<div class="game-screen" id="gs-combat">
  <div class="game-container">
    <div class="start-screen" id="combat-start">
      <div class="start-icon">⚔️</div>
      <div class="start-h">Command Combat</div>
      <div class="start-p">Answer: which Vim command does the description? Race the timer, keep your lives.</div>
      <div class="start-rules">
        <li>10 seconds per question</li>
        <li>3 lives — wrong answer or timeout costs 1 life</li>
        <li>Score = 100 pts + 10 × remaining seconds</li>
        <li>18 questions total</li>
      </div>
      <button class="btn btn-green" onclick="combatStart()">⚔️ start combat</button>
    </div>
    <div id="combat-game" style="display:none">
      <div class="g-score-row">
        <div><div class="g-score-lbl">lives</div><div class="combat-lives" id="cl-lives">❤️❤️❤️</div></div>
        <div style="text-align:center"><div class="g-score-lbl">question</div><div style="font-family:var(--mono);font-size:16px" id="cl-qnum">1/18</div></div>
        <div style="text-align:right"><div class="g-score-lbl">score</div><div class="g-score-val" id="cl-score">0</div></div>
      </div>
      <div class="combat-q-card">
        <div class="combat-q-label">// what command...</div>
        <div class="combat-q-text" id="cl-q">Loading...</div>
        <div><span class="combat-mode-tag" id="cl-mode">Normal Mode</span></div>
        <div class="combat-timer" id="cl-timer">10</div>
      </div>
      <div class="combat-opts" id="cl-opts"></div>
      <div class="combat-feedback" id="cl-fb"></div>
    </div>
  </div>
</div>

<!-- ══ GAME 3: MOTION MASTER ══ -->
<div class="game-screen" id="gs-motion">
  <div class="game-container">
    <div class="start-screen" id="motion-start">
      <div class="start-icon">🎯</div>
      <div class="start-h">Motion Master</div>
      <div class="start-p">Click motion buttons to move the cursor to the highlighted target word. Score as many as you can in 60 seconds.</div>
      <div class="start-rules">
        <li>Use motion buttons (h j k l w b 0 $) to navigate</li>
        <li>Reach the 🎯 target word to score</li>
        <li>+50 XP per target reached</li>
        <li>60 second countdown</li>
      </div>
      <button class="btn btn-green" onclick="motionStart()">🎯 start game</button>
    </div>
    <div id="motion-game" style="display:none">
      <div class="g-score-row">
        <div><div class="g-score-lbl">score</div><div class="g-score-val" id="mg-score">0</div></div>
        <div><div class="g-score-lbl">time</div><div style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--blue)" id="mg-time">60</div></div>
        <div><div class="g-score-lbl">targets</div><div style="font-family:var(--mono);font-size:16px" id="mg-targets">0</div></div>
      </div>
      <div class="motion-task" id="mg-task">Navigate to the target!</div>
      <div class="motion-display" id="mg-display"></div>
      <div class="motion-btns">
        <button class="mbtn" onclick="doMotion('h')">h ←</button>
        <button class="mbtn" onclick="doMotion('j')">j ↓</button>
        <button class="mbtn" onclick="doMotion('k')">k ↑</button>
        <button class="mbtn" onclick="doMotion('l')">l →</button>
        <button class="mbtn" onclick="doMotion('w')">w word→</button>
        <button class="mbtn" onclick="doMotion('b')">b ←word</button>
        <button class="mbtn" onclick="doMotion('0')">0 start</button>
        <button class="mbtn" onclick="doMotion('$')">$ end</button>
        <button class="mbtn" onclick="doMotion('gg')">gg top</button>
        <button class="mbtn" onclick="doMotion('G')">G bottom</button>
      </div>
    </div>
  </div>
</div>

<!-- ══ GAME 4: TEXT SNIPER ══ -->
<div class="game-screen" id="gs-sniper">
  <div class="game-container">
    <div class="start-screen" id="sniper-start">
      <div class="start-icon">🔫</div>
      <div class="start-h">Text Sniper</div>
      <div class="start-p">Type the correct Vim command to edit the highlighted text. Precision over speed.</div>
      <div class="start-rules">
        <li>Read the task carefully</li>
        <li>Type the Vim command and press Enter</li>
        <li>3 lives — wrong command loses 1 life</li>
        <li>+100 pts per correct answer</li>
      </div>
      <button class="btn btn-green" onclick="sniperStart()">🔫 start sniping</button>
    </div>
    <div id="sniper-game" style="display:none">
      <div class="g-score-row">
        <div><div class="g-score-lbl">score</div><div class="g-score-val" id="sg-score">0</div></div>
        <div><div class="g-score-lbl">lives</div><div class="combat-lives" id="sg-lives">❤️❤️❤️</div></div>
        <div><div class="g-score-lbl">round</div><div style="font-family:var(--mono);font-size:16px" id="sg-round">1</div></div>
      </div>
      <div class="sniper-task" id="sg-task"></div>
      <div class="sniper-editor" id="sg-editor"></div>
      <div class="sniper-input-label">&gt; enter vim command:</div>
      <input class="sniper-input" id="sg-input" placeholder="type command and press Enter..." autocomplete="off" spellcheck="false">
      <div class="sniper-fb" id="sg-fb"></div>
    </div>
  </div>
</div>

</div><!-- game-area -->

<script>
const vscode = acquireVsCodeApi();

// ── GAME SWITCHING ──
function showGame(name, btn) {
  document.querySelectorAll('.game-screen').forEach(function(g){ g.classList.remove('active'); });
  document.querySelectorAll('.gtab').forEach(function(t){ t.classList.remove('active'); });
  document.getElementById('gs-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
}

// ═══════════════════════════════════════════════════════
// GAME 1: VIM RACER
// ═══════════════════════════════════════════════════════
var PHRASES = [
  'dd yy p G gg w b e 0 $ dw cw x',
  ':wq :q! :%s/foo/bar/g :sp :vs',
  'ci" ca( diw daw yiw yaw viw vaw',
  'Ctrl+w h j k l :bn :bp :bd :ls',
  'fx Fx ; , /pattern n N * #',
  'qa @a @@ 10@a q recording macros',
  'gg=G =ip =ap format indent block',
  'viw yip vip dip cip paragraph ops'
];

var racer = { phrase:'', typed:'', start:null, timer:null, timeLeft:60, score:0, round:0, active:false };

function racerStart() {
  racer.score = 0; racer.round = 0; racer.timeLeft = 60; racer.active = true;
  document.getElementById('racer-wrap').innerHTML =
    '<div class="g-score-row"><div><div class="g-score-lbl">score</div><div class="g-score-val" id="r-score">0</div></div>' +
    '<div><div class="g-score-lbl">wpm</div><div class="g-score-val" id="r-wpm" style="color:var(--blue)">0</div></div>' +
    '<div><div class="g-score-lbl">time</div><div class="g-score-val" id="r-time" style="color:var(--yellow)">60</div></div></div>' +
    '<div class="racer-track"><div class="racer-phrase" id="r-phrase"></div>' +
    '<input class="racer-input" id="r-input" autocomplete="off" spellcheck="false" placeholder="start typing..."></div>' +
    '<div class="racer-stats"><div class="rstat"><div class="rstat-val" id="r-acc">100%</div><div class="rstat-lbl">Accuracy</div></div>' +
    '<div class="rstat"><div class="rstat-val" id="r-chars" style="color:var(--purple)">0</div><div class="rstat-lbl">Chars</div></div>' +
    '<div class="rstat"><div class="rstat-val" id="r-rounds" style="color:var(--green)">0</div><div class="rstat-lbl">Rounds</div></div></div>';

  document.getElementById('r-input').addEventListener('input', racerInput);
  document.getElementById('r-input').focus();
  racerNextPhrase();
  racer.start = Date.now();
  racer.timer = setInterval(function() {
    racer.timeLeft--;
    var el = document.getElementById('r-time');
    if (el) el.textContent = racer.timeLeft;
    if (racer.timeLeft <= 0) { clearInterval(racer.timer); racerEnd(); }
  }, 1000);
}

function racerNextPhrase() {
  racer.phrase = PHRASES[racer.round % PHRASES.length];
  racer.round++;
  racer.typed = '';
  racerRender();
}

function racerRender() {
  var ph = racer.phrase, ty = racer.typed;
  var html = '';
  for (var i = 0; i < ph.length; i++) {
    var ch = ph[i] === ' ' ? '\u00A0' : ph[i];
    if (i < ty.length) html += '<span class="rc ' + (ty[i]===ph[i]?'rc-done':'rc-wrong') + '">' + ch + '</span>';
    else if (i === ty.length) html += '<span class="rc rc-cur">' + ch + '</span>';
    else html += '<span class="rc rc-pend">' + ch + '</span>';
  }
  var el = document.getElementById('r-phrase');
  if (el) el.innerHTML = html;
}

var racerTotalChars = 0;
function racerInput(e) {
  if (!racer.active || racer.timeLeft <= 0) return;
  var val = e.target.value;
  racer.typed = val;
  racerRender();
  racerTotalChars++;
  var chars = document.getElementById('r-chars');
  if (chars) chars.textContent = racerTotalChars;
  if (val === racer.phrase) {
    racer.score += Math.max(10, Math.ceil(racer.phrase.length * (racer.timeLeft / 60) * 3));
    var sc = document.getElementById('r-score'); if (sc) sc.textContent = racer.score;
    var rr = document.getElementById('r-rounds'); if (rr) rr.textContent = racer.round;
    e.target.value = '';
    racerNextPhrase();
  }
  if (racer.start) {
    var mins = (Date.now() - racer.start) / 60000;
    var wpm = mins > 0 ? Math.round((racerTotalChars / 5) / mins) : 0;
    var wpmEl = document.getElementById('r-wpm'); if (wpmEl) wpmEl.textContent = wpm;
  }
}

function racerEnd() {
  racer.active = false;
  vscode.postMessage({ command: 'saveScore', game: 'vimRacer', score: racer.score });
  document.getElementById('racer-wrap').innerHTML =
    '<div class="gameover">' +
    '<div class="go-title">time\'s up!</div>' +
    '<div class="go-score">' + racer.score + '</div>' +
    '<div class="go-sub">Rounds completed: ' + racer.round + ' &nbsp;|&nbsp; WPM: ' + (document.getElementById && document.getElementById("r-wpm") ? document.getElementById("r-wpm").textContent : 0) + '</div>' +
    '<button class="btn btn-green" onclick="location.reload()">↺ play again</button>' +
    '</div>';
}

// ═══════════════════════════════════════════════════════
// GAME 2: COMMAND COMBAT
// ═══════════════════════════════════════════════════════
var QS = [
  {q:'Deletes the current line',a:'dd',opts:['dd','dl','dc','D'],mode:'Normal Mode',exp:'dd deletes current line into register'},
  {q:'Saves the file',a:':w',opts:[':w',':s',':save','ZZ'],mode:'Command Mode',exp:':w writes (saves) the file'},
  {q:'Moves cursor to end of line',a:'$',opts:['$','G','0','e'],mode:'Normal Mode',exp:'$ moves to last char of line'},
  {q:'Enters Insert mode AFTER cursor',a:'a',opts:['a','i','I','A'],mode:'Normal Mode',exp:'a (append) inserts after cursor'},
  {q:'Copies (yanks) current line',a:'yy',opts:['yy','cc','dd','pp'],mode:'Normal Mode',exp:'yy yanks entire current line'},
  {q:'Moves to first line of file',a:'gg',opts:['gg','G','1G','gG'],mode:'Normal Mode',exp:'gg goes to first line; G goes to last'},
  {q:'Undoes the last change',a:'u',opts:['u','Ctrl+z','U','r'],mode:'Normal Mode',exp:'u undoes last change'},
  {q:'Replace all foo with bar in whole file',a:':%s/foo/bar/g',opts:[':%s/foo/bar/g',':s/foo/bar/',':gsub/foo/bar/',':%r/foo/bar/'],mode:'Command Mode',exp:'% = whole file, g = all occurrences'},
  {q:'Opens new line BELOW current',a:'o',opts:['o','O','a','i'],mode:'Normal Mode',exp:'o opens line below and enters insert'},
  {q:'Changes text inside double quotes',a:'ci"',opts:['ci"','di"','yi"','vi"'],mode:'Normal Mode',exp:'ci" changes inner quote content'},
  {q:'Repeats the last change',a:'.',opts:['.',',,',';','n'],mode:'Normal Mode',exp:'dot command repeats last change'},
  {q:'Pastes text BEFORE the cursor',a:'P',opts:['P','p','Ctrl+v','pu'],mode:'Normal Mode',exp:'P (capital) pastes before cursor'},
  {q:'Searches forward for pattern',a:'/',opts:['/','?','f','s'],mode:'Normal Mode',exp:'/ starts forward search'},
  {q:'Starts recording macro into register a',a:'qa',opts:['qa','ma','ra','@a'],mode:'Normal Mode',exp:'q starts recording, a is register'},
  {q:'Creates a vertical split window',a:':vs',opts:[':vs',':sp',':vsp',':vert'],mode:'Command Mode',exp:':vs (vsplit) creates vertical split'},
  {q:'Moves to start of next word',a:'w',opts:['w','b','e','W'],mode:'Normal Mode',exp:'w moves forward to next word start'},
  {q:'Deletes character under cursor',a:'x',opts:['x','d','X','dc'],mode:'Normal Mode',exp:'x deletes char under cursor'},
  {q:'Quits without saving (force)',a:':q!',opts:[':q!',':q',':wq','ZQ'],mode:'Command Mode',exp:':q! forces quit even with unsaved changes'}
];

var combat = { qs:[], cur:0, lives:3, score:0, timer:null, tLeft:10, answered:false };

function combatStart() {
  combat.qs = QS.slice().sort(function(){ return Math.random()-.5; });
  combat.cur = 0; combat.lives = 3; combat.score = 0; combat.answered = false;
  document.getElementById('combat-start').style.display = 'none';
  document.getElementById('combat-game').style.display = 'block';
  combatNext();
}

function combatNext() {
  if (combat.cur >= combat.qs.length) { combatEnd(true); return; }
  combat.answered = false;
  var q = combat.qs[combat.cur];
  document.getElementById('cl-qnum').textContent = (combat.cur+1) + '/' + combat.qs.length;
  document.getElementById('cl-q').textContent = q.q;
  document.getElementById('cl-mode').textContent = q.mode;
  document.getElementById('cl-fb').textContent = '';
  document.getElementById('cl-lives').textContent = '❤️'.repeat(combat.lives) + (3-combat.lives > 0 ? '🖤'.repeat(3-combat.lives) : '');
  document.getElementById('cl-score').textContent = combat.score;

  var shuffled = q.opts.slice().sort(function(){ return Math.random()-.5; });
  var html = '';
  shuffled.forEach(function(opt) {
    html += '<div class="copt" onclick="combatAnswer(this,\'' + opt.replace(/'/g,"\\'") + '\',\'' + q.a.replace(/'/g,"\\'") + '\',\'' + (q.exp||'').replace(/'/g,"\\'") + '\')">' + opt + '</div>';
  });
  document.getElementById('cl-opts').innerHTML = html;

  combatTick();
}

function combatTick() {
  if (combat.timer) clearInterval(combat.timer);
  combat.tLeft = 10;
  document.getElementById('cl-timer').textContent = combat.tLeft;
  document.getElementById('cl-timer').className = 'combat-timer';
  combat.timer = setInterval(function() {
    combat.tLeft--;
    var tel = document.getElementById('cl-timer');
    if (tel) { tel.textContent = combat.tLeft; if (combat.tLeft <= 3) tel.className = 'combat-timer urgent'; }
    if (combat.tLeft <= 0) {
      clearInterval(combat.timer);
      if (!combat.answered) {
        combat.lives--;
        document.getElementById('cl-fb').textContent = 'time out! answer: ' + combat.qs[combat.cur].a;
        document.getElementById('cl-lives').textContent = '❤️'.repeat(Math.max(0,combat.lives));
        combat.cur++;
        if (combat.lives <= 0) setTimeout(function(){ combatEnd(false); }, 1500);
        else setTimeout(combatNext, 1800);
      }
    }
  }, 1000);
}

function combatAnswer(el, sel, correct, exp) {
  if (combat.answered) return;
  combat.answered = true;
  clearInterval(combat.timer);
  var opts = document.querySelectorAll('.copt');
  opts.forEach(function(o) {
    if (o.textContent.trim() === correct) o.classList.add('correct');
    else if (o === el && sel !== correct) o.classList.add('wrong');
    o.style.pointerEvents = 'none';
  });
  if (sel === correct) {
    combat.score += 100 + combat.tLeft * 10;
    document.getElementById('cl-fb').textContent = 'correct! +' + (100 + combat.tLeft*10) + ' pts — ' + exp;
  } else {
    combat.lives--;
    document.getElementById('cl-fb').textContent = 'wrong. ' + exp;
    document.getElementById('cl-lives').textContent = '❤️'.repeat(Math.max(0,combat.lives)) + '🖤'.repeat(3-Math.max(0,combat.lives));
    if (combat.lives <= 0) { setTimeout(function(){ combatEnd(false); }, 1800); return; }
  }
  combat.cur++;
  setTimeout(combatNext, 2000);
}

function combatEnd(won) {
  clearInterval(combat.timer);
  vscode.postMessage({ command: 'saveScore', game: 'commandCombat', score: combat.score });
  document.getElementById('combat-game').innerHTML =
    '<div class="gameover">' +
    '<div class="go-title">' + (won ? 'victory!' : 'game over') + '</div>' +
    '<div class="go-score">' + combat.score + '</div>' +
    '<div class="go-sub">Questions answered: ' + combat.cur + ' / ' + combat.qs.length + '</div>' +
    '<button class="btn btn-green" onclick="location.reload()">↺ play again</button>' +
    '</div>';
}

// ═══════════════════════════════════════════════════════
// GAME 3: MOTION MASTER
// ═══════════════════════════════════════════════════════
var WORDS = [
  ['const','hello','world','function','return','if','else','for','while','var'],
  ['vim','edit','normal','insert','visual','command','motion','yank','paste','undo'],
  ['buffer','window','split','tab','file','search','replace','macro','mark','jump']
];

var motion = { words:[], cur:0, target:0, score:0, time:60, timer:null, hits:0 };

function motionStart() {
  document.getElementById('motion-start').style.display = 'none';
  document.getElementById('motion-game').style.display = 'block';
  motion.words = WORDS[Math.floor(Math.random()*WORDS.length)];
  motion.cur = 0; motion.score = 0; motion.time = 60; motion.hits = 0;
  motionSetTarget();
  motionRender();
  motion.timer = setInterval(function() {
    motion.time--;
    var tel = document.getElementById('mg-time'); if (tel) tel.textContent = motion.time;
    if (motion.time <= 0) { clearInterval(motion.timer); motionEnd(); }
  }, 1000);
}

function motionSetTarget() {
  var t;
  do { t = Math.floor(Math.random()*motion.words.length); } while (t === motion.cur);
  motion.target = t;
  var tgt = document.getElementById('mg-task');
  if (tgt) tgt.innerHTML = 'Navigate to: <b>' + motion.words[motion.target] + '</b> (word ' + (motion.target+1) + ')';
}

function motionRender() {
  var html = '';
  motion.words.forEach(function(w, i) {
    var cls = 'mot-word';
    if (i === motion.cur) cls += ' mot-cursor';
    else if (i === motion.target) cls += ' mot-target';
    html += '<span class="' + cls + '">' + w + '</span>';
  });
  var el = document.getElementById('mg-display'); if (el) el.innerHTML = html;
}

function doMotion(cmd) {
  var len = motion.words.length;
  if (cmd === 'h' || cmd === 'b') motion.cur = Math.max(0, motion.cur-1);
  else if (cmd === 'l' || cmd === 'w') motion.cur = Math.min(len-1, motion.cur+1);
  else if (cmd === '0' || cmd === 'gg') motion.cur = 0;
  else if (cmd === '$' || cmd === 'G') motion.cur = len-1;
  else if (cmd === 'j') motion.cur = Math.min(len-1, motion.cur+2);
  else if (cmd === 'k') motion.cur = Math.max(0, motion.cur-2);
  motionRender();
  if (motion.cur === motion.target) {
    motion.score += 50; motion.hits++;
    var sc = document.getElementById('mg-score'); if (sc) sc.textContent = motion.score;
    var ht = document.getElementById('mg-targets'); if (ht) ht.textContent = motion.hits;
    motionSetTarget();
    motionRender();
  }
}

function motionEnd() {
  vscode.postMessage({ command: 'saveScore', game: 'motionMaster', score: motion.score });
  document.getElementById('motion-game').innerHTML =
    '<div class="gameover">' +
    '<div class="go-title">time\'s up!</div>' +
    '<div class="go-score">' + motion.score + '</div>' +
    '<div class="go-sub">Targets hit: ' + motion.hits + '</div>' +
    '<button class="btn btn-green" onclick="location.reload()">↺ play again</button>' +
    '</div>';
}

// ═══════════════════════════════════════════════════════
// GAME 4: TEXT SNIPER
// ═══════════════════════════════════════════════════════
var SNIPER_Q = [
  {text:'const name = "John Doe";', hl:'"John Doe"', task:'Delete text inside the quotes', answers:['di"']},
  {text:'function hello() { return 42; }', hl:'{ return 42; }', task:'Delete everything inside the curly braces', answers:['di{']},
  {text:'let items = [1, 2, 3, 4, 5];', hl:'[1, 2, 3, 4, 5]', task:'Delete the entire current line', answers:['dd']},
  {text:'console.log("error message");', hl:'"error message"', task:'Change text inside the double quotes', answers:['ci"']},
  {text:'if (condition) { doSomething(); }', hl:'(condition)', task:'Delete contents inside parentheses', answers:['di(','di)']},
  {text:'deleteThisWord andKeepThis = true;', hl:'deleteThisWord', task:'Delete the first word', answers:['dw','diw','daw']},
  {text:'var x = oldValue + 1;', hl:'oldValue', task:'Change the word under cursor', answers:['cw','ciw']},
  {text:'// This is a comment line', hl:'// This is a comment line', task:'Yank (copy) the entire line', answers:['yy','Y']},
];

var sniper = { qs:[], cur:0, lives:3, score:0 };

function sniperStart() {
  sniper.qs = SNIPER_Q.slice().sort(function(){ return Math.random()-.5; });
  sniper.cur = 0; sniper.lives = 3; sniper.score = 0;
  document.getElementById('sniper-start').style.display = 'none';
  document.getElementById('sniper-game').style.display = 'block';
  sniperRender();
  var inp = document.getElementById('sg-input');
  inp.addEventListener('keydown', function(e){ if (e.key==='Enter') sniperSubmit(); });
  inp.focus();
}

function sniperRender() {
  var q = sniper.qs[sniper.cur % sniper.qs.length];
  var hl = q.text.replace(q.hl, '<span class="snip-hl">' + q.hl + '</span>');
  document.getElementById('sg-editor').innerHTML = hl;
  document.getElementById('sg-task').innerHTML = '🎯 Task: <b>' + q.task + '</b>';
  document.getElementById('sg-score').textContent = sniper.score;
  document.getElementById('sg-lives').textContent = '❤️'.repeat(sniper.lives) + (3-sniper.lives > 0 ? '🖤'.repeat(3-sniper.lives) : '');
  document.getElementById('sg-round').textContent = sniper.cur + 1;
  document.getElementById('sg-fb').textContent = '';
  var inp = document.getElementById('sg-input'); if (inp) { inp.value = ''; inp.focus(); }
}

function sniperSubmit() {
  var inp = document.getElementById('sg-input');
  var val = inp.value.trim();
  if (!val) return;
  var q = sniper.qs[sniper.cur % sniper.qs.length];
  var correct = q.answers.some(function(a){ return val.toLowerCase() === a.toLowerCase(); });
  var fb = document.getElementById('sg-fb');
  if (correct) {
    sniper.score += 100; sniper.cur++;
    if (fb) fb.textContent = '✓ correct! +100 pts';
    if (fb) fb.style.color = 'var(--green)';
    setTimeout(function() {
      if (sniper.lives > 0) sniperRender();
    }, 700);
  } else {
    sniper.lives--;
    if (fb) { fb.textContent = '✗ wrong. valid: ' + q.answers.join(' or '); fb.style.color = 'var(--red)'; }
    document.getElementById('sg-lives').textContent = '❤️'.repeat(Math.max(0,sniper.lives)) + '🖤'.repeat(3-Math.max(0,sniper.lives));
    inp.value = '';
    if (sniper.lives <= 0) {
      vscode.postMessage({ command: 'saveScore', game: 'textSniper', score: sniper.score });
      setTimeout(function() {
        document.getElementById('sniper-game').innerHTML =
          '<div class="gameover">' +
          '<div class="go-title">mission failed</div>' +
          '<div class="go-score">' + sniper.score + '</div>' +
          '<div class="go-sub">Challenges cleared: ' + sniper.cur + '</div>' +
          '<button class="btn btn-green" onclick="location.reload()">↺ try again</button>' +
          '</div>';
      }, 1200);
    }
  }
}

// ── HIGH SCORE DISPLAY ──
window.addEventListener('message', function(e) {
  if (e.data.command === 'scores') {
    var s = e.data.data || {};
    if (s.vimRacer) document.getElementById('sval-racer').textContent = s.vimRacer;
    if (s.commandCombat) document.getElementById('sval-combat').textContent = s.commandCombat;
    if (s.motionMaster) document.getElementById('sval-motion').textContent = s.motionMaster;
    if (s.textSniper) document.getElementById('sval-sniper').textContent = s.textSniper;
  }
});
</script>
</body>
</html>`;
  }
}

module.exports = { GamesPanel };
