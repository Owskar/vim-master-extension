const vscode = require('vscode');

class PlaygroundPanel {
  static currentPanel = undefined;
  static viewType = 'vimMasterPlayground';

  static createOrShow(extensionUri, storageManager) {
    const column = vscode.ViewColumn.Two;
    if (PlaygroundPanel.currentPanel) {
      PlaygroundPanel.currentPanel._panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      PlaygroundPanel.viewType, 'VimMaster — Playground', column,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    PlaygroundPanel.currentPanel = new PlaygroundPanel(panel, storageManager);
  }

  constructor(panel, storageManager) {
    this._panel = panel;
    this._storageManager = storageManager;
    this._disposables = [];
    this._panel.webview.html = this._buildHtml();
    this._panel.onDidDispose(() => {
      PlaygroundPanel.currentPanel = undefined;
      this.dispose();
    }, null, this._disposables);
    this._panel.webview.onDidReceiveMessage(msg => {
      if (msg.command === 'addXP') {
        this._storageManager.addXP(msg.amount, msg.reason || 'playground');
      }
    }, null, this._disposables);
  }

  dispose() {
    PlaygroundPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) { const d = this._disposables.pop(); if (d) d.dispose(); }
  }

  _buildHtml() {
    // Samples as Node.js strings, injected as JSON — no backtick nesting
    const samples = {
      code: [
        '// JavaScript — Practice Vim here!',
        'function fibonacci(n) {',
        '  if (n <= 1) return n;',
        '  return fibonacci(n - 1) + fibonacci(n - 2);',
        '}',
        '',
        'const result = fibonacci(10);',
        'console.log("Result:", result);',
        '',
        '// Vim tasks to try:',
        '// 1. dd  — delete this line',
        '// 2. yy + p — duplicate a line',
        '// 3. dw  — delete a word',
        '// 4. ci" — change inside quotes',
        '// 5. :%s/fibonacci/fib/g — rename function',
        '// 6. u   — undo   Ctrl+r — redo',
        '',
        'class Calculator {',
        '  constructor(value = 0) {',
        '    this.value = value;',
        '  }',
        '  add(n) { return new Calculator(this.value + n); }',
        '  sub(n) { return new Calculator(this.value - n); }',
        '  result() { return this.value; }',
        '}'
      ].join('\n'),

      prose: [
        'The Art of Vim',
        '',
        'Vim is more than a text editor. It is a language for',
        'manipulating text — composable, consistent, powerful.',
        '',
        'The modal design separates intent from action.',
        'In Normal mode you navigate and command.',
        'In Insert mode you type. This division is deliberate.',
        '',
        'Learn these first:',
        '  w  — forward a word',
        '  b  — backward a word',
        '  0  — start of line',
        '  $  — end of line',
        '  gg — top of file',
        '  G  — bottom of file',
        '',
        'Then master operators:',
        '  d  — delete',
        '  c  — change (delete + insert)',
        '  y  — yank (copy)',
        '',
        'Combined with motions: dw cw yiw ci" diw aw ip',
        'The dot command . repeats the last change.',
        'This is the vim philosophy: composable primitives.'
      ].join('\n'),

      blank: [
        '// Blank playground',
        '// Press i to enter INSERT mode',
        '// Press Esc to return to NORMAL mode',
        ''
      ].join('\n')
    };

    const samplesJSON = JSON.stringify(samples);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vim Playground</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
:root {
  --bg0:#0a0c0f;--bg1:#0f1117;--bg2:#161b22;--bg3:#1c2128;
  --border:#21262d;--border2:#30363d;
  --green:#3fb950;--green-dim:#238636;--blue:#58a6ff;
  --yellow:#e3b341;--red:#f85149;--purple:#bc8cff;--cyan:#39d353;
  --text:#e6edf3;--text2:#8b949e;--text3:#484f58;
  --mono:'IBM Plex Mono',monospace;--sans:'IBM Plex Sans',sans-serif;
  --r:6px;
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html,body{height:100%;font-family:var(--sans);background:var(--bg0);color:var(--text);overflow:hidden;display:flex;flex-direction:column;font-size:13px;}
::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}

/* HEADER */
.header{background:var(--bg1);border-bottom:1px solid var(--border);padding:0 16px;display:flex;align-items:center;gap:12px;height:46px;flex-shrink:0;}
.header-logo{font-family:var(--mono);font-size:12px;font-weight:700;color:var(--green);}
.header-logo span{color:var(--text3);}
.mode-pill{font-family:var(--mono);font-size:11px;font-weight:700;padding:3px 10px;border-radius:var(--r);border:1px solid;transition:all .2s;}
.mode-normal{background:rgba(63,185,80,.1);border-color:rgba(63,185,80,.3);color:var(--green);}
.mode-insert{background:rgba(88,166,255,.1);border-color:rgba(88,166,255,.3);color:var(--blue);}
.mode-visual{background:rgba(227,179,65,.1);border-color:rgba(227,179,65,.3);color:var(--yellow);}
.mode-command{background:rgba(248,81,73,.1);border-color:rgba(248,81,73,.3);color:var(--red);}
.pending-cmd{font-family:var(--mono);font-size:12px;color:var(--yellow);min-width:40px;}
.header-right{margin-left:auto;display:flex;gap:8px;}
.tb-btn{padding:4px 12px;border-radius:var(--r);border:1px solid var(--border2);background:var(--bg2);color:var(--text2);cursor:pointer;font-size:11px;font-family:var(--mono);transition:all .12s;}
.tb-btn:hover{color:var(--text);border-color:var(--text3);}

/* LAYOUT */
.layout{flex:1;display:grid;grid-template-columns:1fr 260px;overflow:hidden;}

/* EDITOR SIDE */
.editor-side{display:flex;flex-direction:column;border-right:1px solid var(--border);overflow:hidden;}
.editor-body{flex:1;display:flex;overflow:hidden;}
.line-nums{background:var(--bg1);padding:10px 0;min-width:42px;text-align:right;font-family:var(--mono);font-size:12px;color:var(--text3);user-select:none;line-height:1.65;border-right:1px solid var(--border);overflow:hidden;flex-shrink:0;}
.ln{display:block;padding:0 8px;}
.ln.active{color:var(--text2);}
.editor-scroll{flex:1;position:relative;overflow:auto;}
#ed-ta{position:absolute;inset:0;padding:10px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;color:transparent;caret-color:transparent;background:transparent;border:none;outline:none;resize:none;z-index:2;white-space:pre;}
#ed-display{position:absolute;inset:0;padding:10px 14px;font-family:var(--mono);font-size:12px;line-height:1.65;pointer-events:none;z-index:1;white-space:pre;overflow:auto;}
.cur{display:inline;background:var(--green);color:#000;border-radius:1px;animation:blink .9s step-end infinite;}
.cur-line{background:rgba(255,255,255,.03);}
.sel{background:rgba(88,166,255,.2);}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

/* STATUS BAR */
.statusbar{background:var(--green-dim);display:flex;align-items:center;height:22px;font-family:var(--mono);font-size:11px;flex-shrink:0;}
.sb-seg{padding:0 12px;height:100%;display:flex;align-items:center;color:#fff;gap:5px;border-right:1px solid rgba(0,0,0,.2);}
.sb-dark{background:rgba(0,0,0,.25);}
.sb-mid{background:rgba(0,0,0,.15);}
.sb-right{margin-left:auto;border-left:1px solid rgba(0,0,0,.2);border-right:none;}
.cmd-bar{background:var(--bg0);border-top:1px solid var(--border);padding:3px 14px;font-family:var(--mono);font-size:12px;color:var(--text);display:none;align-items:center;gap:4px;flex-shrink:0;}
.cmd-bar.show{display:flex;}

/* SIDEBAR */
.sidebar{display:flex;flex-direction:column;overflow:hidden;}
.stabs{display:flex;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0;}
.stab{flex:1;padding:8px 4px;text-align:center;font-size:10px;font-weight:700;cursor:pointer;color:var(--text3);border-bottom:2px solid transparent;font-family:var(--mono);text-transform:uppercase;letter-spacing:.06em;transition:all .15s;}
.stab:hover{color:var(--text2);}
.stab.active{color:var(--green);border-bottom-color:var(--green);}
.stab-panel{display:none;flex:1;overflow-y:auto;padding:10px;}
.stab-panel.active{display:block;}

/* REFERENCE */
.ref-sec{margin-bottom:14px;}
.ref-sec-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid var(--border);}
.ref-row{display:flex;gap:8px;align-items:center;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.03);font-size:11px;}
.ref-row:last-child{border:none;}
.ref-key{font-family:var(--mono);background:var(--bg3);border:1px solid var(--border2);border-radius:3px;padding:1px 6px;color:var(--green);font-size:10px;min-width:60px;flex-shrink:0;}
.ref-desc{color:var(--text2);font-size:11px;}

/* EXERCISES */
.ex-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:10px;margin-bottom:8px;cursor:pointer;transition:border-color .15s;}
.ex-card:hover{border-color:var(--border2);}
.ex-card.claimed{border-color:var(--green-dim);background:rgba(63,185,80,.05);}
.ex-title{font-size:11px;font-weight:600;margin-bottom:3px;font-family:var(--mono);}
.ex-desc{font-size:10px;color:var(--text2);}
.ex-xp{font-size:10px;color:var(--blue);margin-top:4px;font-family:var(--mono);}

/* LOG */
.log-item{font-family:var(--mono);font-size:10px;padding:3px 6px;border-radius:3px;margin-bottom:2px;display:flex;gap:6px;border-left:2px solid;}
.log-n{border-color:var(--green);color:var(--green);}
.log-i{border-color:var(--blue);color:var(--blue);}
.log-c{border-color:var(--red);color:var(--red);}
.log-time{color:var(--text3);flex-shrink:0;font-size:9px;}

/* FOOTER */
.pg-footer{background:var(--bg1);border-top:1px solid var(--border);padding:5px 14px;font-family:var(--mono);font-size:10px;color:var(--text3);display:flex;gap:10px;flex-shrink:0;}
.pg-footer a{color:var(--green);text-decoration:none;}
</style>
</head>
<body>

<div class="header">
  <div class="header-logo">⌨️ vim<span>master</span> // playground</div>
  <div class="mode-pill mode-normal" id="mode-pill">NORMAL</div>
  <div class="pending-cmd" id="pending-cmd"></div>
  <div class="header-right">
    <button class="tb-btn" onclick="loadSample('code')">code.js</button>
    <button class="tb-btn" onclick="loadSample('prose')">prose.txt</button>
    <button class="tb-btn" onclick="loadSample('blank')">blank</button>
    <button class="tb-btn" onclick="resetEditor()">reset</button>
  </div>
</div>

<div class="layout">
  <div class="editor-side">
    <div class="editor-body">
      <div class="line-nums" id="line-nums"></div>
      <div class="editor-scroll">
        <textarea id="ed-ta" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
        <div id="ed-display"></div>
      </div>
    </div>
    <div class="statusbar">
      <div class="sb-seg sb-dark" id="sb-mode">NORMAL</div>
      <div class="sb-seg">playground.vim</div>
      <div class="sb-seg sb-mid" id="sb-msg">ready</div>
      <div class="sb-seg sb-right sb-dark" id="sb-pos">1:1</div>
    </div>
    <div class="cmd-bar" id="cmd-bar">
      <span style="color:var(--red)">:</span>
      <span id="cmd-text" style="flex:1"></span>
      <span style="color:var(--text3);font-size:10px">Enter=run Esc=cancel</span>
    </div>
  </div>

  <div class="sidebar">
    <div class="stabs">
      <div class="stab active" onclick="sTab('ref',this)">Ref</div>
      <div class="stab" onclick="sTab('ex',this)">Tasks</div>
      <div class="stab" onclick="sTab('log',this)">Log</div>
    </div>
    <div class="stab-panel active" id="sp-ref">
      <div class="ref-sec">
        <div class="ref-sec-title">Modes</div>
        <div class="ref-row"><span class="ref-key">Esc</span><span class="ref-desc">Normal mode</span></div>
        <div class="ref-row"><span class="ref-key">i / a</span><span class="ref-desc">Insert before/after</span></div>
        <div class="ref-row"><span class="ref-key">I / A</span><span class="ref-desc">Insert line start/end</span></div>
        <div class="ref-row"><span class="ref-key">o / O</span><span class="ref-desc">New line below/above</span></div>
        <div class="ref-row"><span class="ref-key">v / V</span><span class="ref-desc">Visual char/line</span></div>
        <div class="ref-row"><span class="ref-key">:</span><span class="ref-desc">Command mode</span></div>
      </div>
      <div class="ref-sec">
        <div class="ref-sec-title">Navigation</div>
        <div class="ref-row"><span class="ref-key">h j k l</span><span class="ref-desc">←↓↑→</span></div>
        <div class="ref-row"><span class="ref-key">w / b</span><span class="ref-desc">Word forward/back</span></div>
        <div class="ref-row"><span class="ref-key">0 / $</span><span class="ref-desc">Line start/end</span></div>
        <div class="ref-row"><span class="ref-key">gg / G</span><span class="ref-desc">File start/end</span></div>
        <div class="ref-row"><span class="ref-key">f{c}</span><span class="ref-desc">Find char on line</span></div>
      </div>
      <div class="ref-sec">
        <div class="ref-sec-title">Editing</div>
        <div class="ref-row"><span class="ref-key">dd</span><span class="ref-desc">Delete line</span></div>
        <div class="ref-row"><span class="ref-key">dw</span><span class="ref-desc">Delete word</span></div>
        <div class="ref-row"><span class="ref-key">D</span><span class="ref-desc">Delete to line end</span></div>
        <div class="ref-row"><span class="ref-key">yy</span><span class="ref-desc">Yank line</span></div>
        <div class="ref-row"><span class="ref-key">p / P</span><span class="ref-desc">Paste after/before</span></div>
        <div class="ref-row"><span class="ref-key">u</span><span class="ref-desc">Undo</span></div>
        <div class="ref-row"><span class="ref-key">Ctrl+r</span><span class="ref-desc">Redo</span></div>
        <div class="ref-row"><span class="ref-key">.</span><span class="ref-desc">Repeat last change</span></div>
        <div class="ref-row"><span class="ref-key">x</span><span class="ref-desc">Delete char</span></div>
        <div class="ref-row"><span class="ref-key">cw</span><span class="ref-desc">Change word</span></div>
        <div class="ref-row"><span class="ref-key">ci"</span><span class="ref-desc">Change inside quotes</span></div>
      </div>
      <div class="ref-sec">
        <div class="ref-sec-title">Commands</div>
        <div class="ref-row"><span class="ref-key">:w</span><span class="ref-desc">Save</span></div>
        <div class="ref-row"><span class="ref-key">:q / :q!</span><span class="ref-desc">Quit / force quit</span></div>
        <div class="ref-row"><span class="ref-key">:%s/a/b/g</span><span class="ref-desc">Replace all</span></div>
        <div class="ref-row"><span class="ref-key">:set nu</span><span class="ref-desc">Line numbers on</span></div>
      </div>
    </div>

    <div class="stab-panel" id="sp-ex">
      <div id="ex-list"></div>
    </div>

    <div class="stab-panel" id="sp-log">
      <div style="font-size:9px;color:var(--text3);margin-bottom:6px;font-family:var(--mono)">// command history</div>
      <div id="cmd-log"></div>
    </div>
  </div>
</div>

<div class="pg-footer">
  <span>⌨️ VimMaster Playground</span>
  <span>·</span>
  <span>by <a href="https://github.com/Owskar" target="_blank">Owskar Ganbawale</a></span>
  <span>·</span>
  <span>Click editor + use Vim commands</span>
</div>

<script>
var vscode = acquireVsCodeApi();
var SAMPLES = ${samplesJSON};

// ── STATE ──
var st = {
  mode: 'normal',
  lines: [],
  cursor: { row:0, col:0 },
  clipboard: '',
  clipLine: false,
  pending: '',
  count: '',
  undoStack: [],
  redoStack: [],
  visStart: null
};

function cloneLines() { return st.lines.slice(); }
function cloneSt() { return { lines: st.lines.slice(), cursor: { row:st.cursor.row, col:st.cursor.col } }; }
function pushUndo() { st.undoStack.push(cloneSt()); st.redoStack = []; }

// ── INIT ──
function initEditor(text) {
  st.lines = text.split('\\n');
  st.cursor = { row:0, col:0 };
  st.mode = 'normal';
  st.undoStack = []; st.redoStack = [];
  st.pending = ''; st.count = '';
  render();
  document.getElementById('ed-ta').focus();
}

// ── RENDER ──
function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/ /g,'\\u00A0');
}

function render() {
  var rows = st.lines.length;
  var lnHtml = '', dispHtml = '';

  for (var r = 0; r < rows; r++) {
    var line = st.lines[r];
    var active = (r === st.cursor.row);
    lnHtml += '<span class="ln' + (active?' active':'') + '">' + (r+1) + '</span>';

    if (st.mode === 'visual' && st.visStart !== null) {
      var vs = Math.min(st.visStart.row, st.cursor.row);
      var ve = Math.max(st.visStart.row, st.cursor.row);
      if (r >= vs && r <= ve) {
        dispHtml += '<span class="cur-line"><span class="sel">' + esc(line || ' ') + '</span>\\n</span>';
        continue;
      }
    }

    if (active && st.mode !== 'visual') {
      var lineHtml = '';
      for (var c = 0; c <= line.length; c++) {
        var ch = c < line.length ? esc(line[c]) : (st.mode==='normal'?' ':'');
        if (c === st.cursor.col && ch !== '') {
          lineHtml += '<span class="cur">' + ch + '</span>';
        } else {
          lineHtml += ch;
        }
      }
      dispHtml += '<span class="cur-line">' + lineHtml + '\\n</span>';
    } else {
      dispHtml += esc(line) + '\\n';
    }
  }

  document.getElementById('line-nums').innerHTML = lnHtml;
  document.getElementById('ed-display').innerHTML = dispHtml;

  var modeNames = { normal:'NORMAL', insert:'-- INSERT --', visual:'-- VISUAL --', command:'COMMAND' };
  var modeDisplay = modeNames[st.mode] || 'NORMAL';
  var modeClass = 'mode-' + st.mode;

  document.getElementById('sb-mode').textContent = modeDisplay;
  document.getElementById('sb-pos').textContent = (st.cursor.row+1) + ':' + (st.cursor.col+1);

  var mp = document.getElementById('mode-pill');
  mp.textContent = modeDisplay;
  mp.className = 'mode-pill ' + modeClass;

  document.getElementById('pending-cmd').textContent = st.pending + st.count;

  if (st.mode === 'insert') {
    var ta = document.getElementById('ed-ta');
    var txt = st.lines.join('\\n');
    if (ta.value !== txt) ta.value = txt;
    var pos = 0;
    for (var i = 0; i < st.cursor.row; i++) pos += st.lines[i].length + 1;
    pos += st.cursor.col;
    try { ta.setSelectionRange(pos, pos); } catch(e) {}
  }
}

// ── CLAMP ──
function clamp() {
  st.cursor.row = Math.max(0, Math.min(st.lines.length-1, st.cursor.row));
  var maxCol = st.mode === 'insert' ? st.lines[st.cursor.row].length : Math.max(0, st.lines[st.cursor.row].length-1);
  st.cursor.col = Math.max(0, Math.min(maxCol, st.cursor.col));
}

// ── MOVEMENT ──
function mvLeft(n) { st.cursor.col = Math.max(0, st.cursor.col-(n||1)); }
function mvRight(n) {
  var max = st.mode==='insert' ? st.lines[st.cursor.row].length : Math.max(0,st.lines[st.cursor.row].length-1);
  st.cursor.col = Math.min(max, st.cursor.col+(n||1));
}
function mvUp(n) { st.cursor.row = Math.max(0, st.cursor.row-(n||1)); clamp(); }
function mvDown(n) { st.cursor.row = Math.min(st.lines.length-1, st.cursor.row+(n||1)); clamp(); }

function wdFwd() {
  var line = st.lines[st.cursor.row], c = st.cursor.col+1;
  while (c < line.length && /\\w/.test(line[c-1]) && /\\w/.test(line[c])) c++;
  while (c < line.length && !/\\w/.test(line[c])) c++;
  st.cursor.col = Math.min(c, Math.max(0,line.length-1));
}
function wdBack() {
  var line = st.lines[st.cursor.row], c = st.cursor.col-1;
  while (c > 0 && !/\\w/.test(line[c])) c--;
  while (c > 0 && /\\w/.test(line[c-1])) c--;
  st.cursor.col = Math.max(0, c);
}

function getCount() { var n = parseInt(st.count)||1; st.count=''; return n; }

// ── EDIT OPS ──
function enterInsert(offset) {
  st.mode = 'insert';
  if (offset) st.cursor.col = Math.min(st.cursor.col+offset, st.lines[st.cursor.row].length);
  document.getElementById('ed-ta').focus();
}

function deleteChar() {
  pushUndo();
  var line = st.lines[st.cursor.row];
  if (!line.length) return;
  st.lines[st.cursor.row] = line.slice(0,st.cursor.col) + line.slice(st.cursor.col+1);
  clamp();
}

function deleteLine(cnt) {
  pushUndo();
  cnt = cnt||1;
  var del = st.lines.splice(st.cursor.row, cnt);
  st.clipboard = del.join('\\n');
  st.clipLine = true;
  if (!st.lines.length) st.lines = [''];
  st.cursor.row = Math.min(st.cursor.row, st.lines.length-1);
  clamp();
}

function yankLine(cnt) {
  cnt = cnt||1;
  st.clipboard = st.lines.slice(st.cursor.row, st.cursor.row+cnt).join('\\n');
  st.clipLine = true;
  logCmd('yanked ' + cnt + ' line(s)', 'n');
}

function deleteWord() {
  pushUndo();
  var line = st.lines[st.cursor.row], c = st.cursor.col;
  var end = c;
  while (end < line.length && /\\w/.test(line[end])) end++;
  while (end < line.length && /\\s/.test(line[end])) end++;
  st.clipboard = line.slice(c, end);
  st.clipLine = false;
  st.lines[st.cursor.row] = line.slice(0,c) + line.slice(end);
  clamp();
}

function paste(before) {
  pushUndo();
  if (st.clipLine) {
    var row = before ? st.cursor.row : st.cursor.row+1;
    st.lines.splice(row, 0, st.clipboard);
    st.cursor.row = row; st.cursor.col = 0;
  } else {
    var line = st.lines[st.cursor.row];
    var pos = before ? st.cursor.col : Math.min(st.cursor.col+1, line.length);
    st.lines[st.cursor.row] = line.slice(0,pos) + st.clipboard + line.slice(pos);
    st.cursor.col = pos + st.clipboard.length - 1;
  }
  clamp();
}

function undo() {
  if (!st.undoStack.length) return;
  st.redoStack.push(cloneSt());
  var prev = st.undoStack.pop();
  st.lines = prev.lines; st.cursor = prev.cursor;
  clamp();
  logCmd('u (undo)', 'n');
}
function redo() {
  if (!st.redoStack.length) return;
  st.undoStack.push(cloneSt());
  var next = st.redoStack.pop();
  st.lines = next.lines; st.cursor = next.cursor;
  clamp();
  logCmd('Ctrl+r (redo)', 'n');
}

function insertLineBelow() {
  pushUndo();
  var indent = (st.lines[st.cursor.row].match(/^\\s*/)||[''])[0];
  st.lines.splice(st.cursor.row+1, 0, indent);
  st.cursor.row++; st.cursor.col = indent.length;
  enterInsert(0);
}
function insertLineAbove() {
  pushUndo();
  var indent = (st.lines[st.cursor.row].match(/^\\s*/)||[''])[0];
  st.lines.splice(st.cursor.row, 0, indent);
  st.cursor.col = indent.length;
  enterInsert(0);
}

// ── NORMAL MODE ──
function handleNormal(key, ctrl) {
  var cnt = st.count ? (getCount()) : 1;
  if (!st.pending && /^[1-9]$/.test(key)) { st.count += key; render(); return; }
  if (!st.pending && key==='0' && st.count) { st.count += '0'; render(); return; }

  if (st.pending) {
    var cmd = st.pending + key; st.pending = '';
    execPending(cmd, cnt);
    logCmd(cmd, 'n');
    render(); return;
  }

  st.count = '';
  switch(key) {
    case 'h': mvLeft(cnt); break;
    case 'l': mvRight(cnt); break;
    case 'j': mvDown(cnt); break;
    case 'k': mvUp(cnt); break;
    case 'w': for(var i=0;i<cnt;i++) wdFwd(); break;
    case 'b': for(var i=0;i<cnt;i++) wdBack(); break;
    case '0': st.cursor.col=0; break;
    case '$': st.cursor.col=Math.max(0,st.lines[st.cursor.row].length-1); break;
    case '^': var m=st.lines[st.cursor.row].search(/\\S/); st.cursor.col=m<0?0:m; break;
    case 'G': st.cursor.row = cnt===1?st.lines.length-1:Math.min(cnt-1,st.lines.length-1); clamp(); break;
    case 'g': st.pending='g'; render(); return;
    case 'i': enterInsert(0); break;
    case 'I': st.cursor.col=0; enterInsert(0); break;
    case 'a': enterInsert(1); break;
    case 'A': st.cursor.col=st.lines[st.cursor.row].length; enterInsert(0); break;
    case 'o': insertLineBelow(); break;
    case 'O': insertLineAbove(); break;
    case 'v': st.mode='visual'; st.visStart={row:st.cursor.row,col:st.cursor.col}; break;
    case 'V': st.mode='visual'; st.visStart={row:st.cursor.row,col:0}; st.cursor.col=st.lines[st.cursor.row].length; break;
    case ':': enterCommand(); break;
    case 'x': deleteChar(); break;
    case 'X': if(st.cursor.col>0){st.cursor.col--;deleteChar();} break;
    case 'd': st.pending='d'; render(); return;
    case 'c': st.pending='c'; render(); return;
    case 'y': st.pending='y'; render(); return;
    case 'r': st.pending='r'; render(); return;
    case 'D': pushUndo(); var ln=st.lines[st.cursor.row]; st.clipboard=ln.slice(st.cursor.col); st.clipLine=false; st.lines[st.cursor.row]=ln.slice(0,st.cursor.col); clamp(); break;
    case 'C': pushUndo(); var ln2=st.lines[st.cursor.row]; st.clipboard=ln2.slice(st.cursor.col); st.clipLine=false; st.lines[st.cursor.row]=ln2.slice(0,st.cursor.col); enterInsert(0); break;
    case 'Y': yankLine(cnt); break;
    case 'p': paste(false); break;
    case 'P': paste(true); break;
    case 'u': undo(); return;
    case '/': var q=prompt('Search:'); if(q){for(var ri=st.cursor.row+1;ri<st.lines.length;ri++){var ci=st.lines[ri].indexOf(q);if(ci>=0){st.cursor.row=ri;st.cursor.col=ci;break;}}} break;
    case '.': logCmd('. (repeat)', 'n'); break;
    case 's': deleteChar(); enterInsert(0); break;
    default: return;
  }
  logCmd(key, 'n');
  clamp(); render();
}

function execPending(cmd, cnt) {
  switch(cmd) {
    case 'gg': st.cursor.row=0; st.cursor.col=0; break;
    case 'dd': deleteLine(cnt); break;
    case 'yy': yankLine(cnt); break;
    case 'cc': pushUndo(); st.clipboard=st.lines[st.cursor.row]; st.clipLine=true; st.lines[st.cursor.row]=''; st.cursor.col=0; enterInsert(0); return;
    case 'dw': deleteWord(); break;
    case 'cw': deleteWord(); enterInsert(0); return;
    default:
      if (cmd.startsWith('r') && cmd.length===2) {
        pushUndo();
        var ln=st.lines[st.cursor.row];
        st.lines[st.cursor.row]=ln.slice(0,st.cursor.col)+cmd[1]+ln.slice(st.cursor.col+1);
      }
      break;
  }
  clamp(); render();
}

// ── COMMAND MODE ──
var cmdBuf = '';
function enterCommand() {
  st.mode='command'; cmdBuf='';
  document.getElementById('cmd-bar').classList.add('show');
  document.getElementById('cmd-text').textContent='';
  render();
}

function runCommand(cmd) {
  document.getElementById('cmd-bar').classList.remove('show');
  st.mode='normal';
  cmd = cmd.trim();
  logCmd(':'+cmd,'c');
  setMsg(':'+cmd);
  if (cmd==='w'||cmd==='write') { setMsg('written (simulated)'); vscode.postMessage({command:'addXP',amount:10,reason:'saved file'}); }
  else if (cmd==='q'||cmd==='quit') { setMsg(':q works in real Vim!'); }
  else if (cmd==='wq'||cmd==='x') { setMsg('saved and quit (simulated)'); }
  else if (cmd==='q!') { setMsg('force quit (simulated)'); }
  else if (/^\\d+$/.test(cmd)) { st.cursor.row=Math.min(parseInt(cmd)-1,st.lines.length-1); clamp(); }
  else if (cmd.startsWith('%s/')||cmd.startsWith('s/')) { doSubstitute(cmd); }
  else { setMsg('unknown: :'+cmd); }
  render();
}

function doSubstitute(cmd) {
  pushUndo();
  var isGlobal = cmd.startsWith('%');
  var stripped = cmd.replace(/^%/,'').replace(/^s\\//,'');
  var parts = stripped.split('/');
  var find=parts[0], rep=parts[1]||'', flags=parts[2]||'';
  if (!find) return;
  var gFlag = flags.indexOf('g')>=0;
  var re = new RegExp(find, gFlag?'g':'');
  var count=0, start=isGlobal?0:st.cursor.row, end=isGlobal?st.lines.length:st.cursor.row+1;
  for (var i=start;i<end;i++) { var orig=st.lines[i]; st.lines[i]=st.lines[i].replace(re,rep); if(st.lines[i]!==orig) count++; }
  setMsg('replaced in '+count+' line(s)');
}

function setMsg(m) { var el=document.getElementById('sb-msg'); if(el) el.textContent=m; }

// ── INSERT ──
function handleInsertChange() {
  var ta=document.getElementById('ed-ta');
  st.lines=ta.value.split('\\n');
  var pos=ta.selectionStart, rem=pos;
  for (var i=0;i<st.lines.length;i++) {
    if (rem<=st.lines[i].length) { st.cursor.row=i; st.cursor.col=rem; break; }
    rem-=st.lines[i].length+1;
  }
  render();
}

// ── VISUAL ──
function handleVisual(key) {
  if (key==='Escape') { st.mode='normal'; st.visStart=null; }
  else if (key==='h') mvLeft();
  else if (key==='l') mvRight();
  else if (key==='j') mvDown();
  else if (key==='k') mvUp();
  else if (key==='d'||key==='x') {
    var rs=Math.min(st.visStart.row,st.cursor.row), re2=Math.max(st.visStart.row,st.cursor.row);
    pushUndo();
    var del=st.lines.splice(rs,re2-rs+1);
    st.clipboard=del.join('\\n'); st.clipLine=true;
    if(!st.lines.length) st.lines=[''];
    st.cursor.row=Math.min(rs,st.lines.length-1);
    st.mode='normal'; st.visStart=null;
  }
  else if (key==='y') {
    var rs2=Math.min(st.visStart.row,st.cursor.row), re3=Math.max(st.visStart.row,st.cursor.row);
    st.clipboard=st.lines.slice(rs2,re3+1).join('\\n'); st.clipLine=true;
    st.mode='normal'; st.visStart=null;
    logCmd('visual yank','n');
  }
  clamp(); render();
}

// ── KEY LISTENER ──
document.addEventListener('keydown', function(e) {
  var key=e.key, ctrl=e.ctrlKey||e.metaKey;

  if (st.mode==='insert') {
    if (key==='Escape') {
      pushUndo();
      st.mode='normal';
      st.cursor.col=Math.max(0,st.cursor.col-1);
      clamp(); render();
      logCmd('Esc','i');
      e.preventDefault();
    }
    return;
  }

  if (st.mode==='command') {
    e.preventDefault();
    if (key==='Escape') { st.mode='normal'; cmdBuf=''; document.getElementById('cmd-bar').classList.remove('show'); render(); }
    else if (key==='Enter') { runCommand(cmdBuf); }
    else if (key==='Backspace') { cmdBuf=cmdBuf.slice(0,-1); document.getElementById('cmd-text').textContent=cmdBuf; }
    else if (key.length===1) { cmdBuf+=key; document.getElementById('cmd-text').textContent=cmdBuf; }
    return;
  }

  if (st.mode==='visual') {
    e.preventDefault();
    handleVisual(key);
    return;
  }

  if (ctrl && key==='r') { redo(); render(); e.preventDefault(); return; }

  if (key.length===1 || key==='Escape') {
    if (!['Tab','Shift','Control','Alt','Meta'].includes(key)) {
      e.preventDefault();
      handleNormal(key, ctrl);
    }
  }
});

document.getElementById('ed-ta').addEventListener('input', handleInsertChange);

// ── SIDEBAR TABS ──
function sTab(name, el) {
  document.querySelectorAll('.stab-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.stab').forEach(function(t){ t.classList.remove('active'); });
  document.getElementById('sp-'+name).classList.add('active');
  if(el) el.classList.add('active');
}

// ── EXERCISES ──
var EX = [
  {title:'1. Delete a Line',desc:'Put cursor on any line. Press dd to delete it.',xp:30},
  {title:'2. Copy & Paste',desc:'Press yy to yank a line, then j + p to paste below.',xp:30},
  {title:'3. Word Navigation',desc:'Navigate 5 words forward using only w.',xp:25},
  {title:'4. Go to Last Line',desc:'Press G to jump to the last line of the file.',xp:20},
  {title:'5. Search & Replace',desc:'Run :%s/const/let/g to replace all const with let.',xp:60},
  {title:'6. Undo Chain',desc:'Make 3 edits then undo with u u u.',xp:35},
  {title:'7. Append at End',desc:'Press A to insert at end of line without arrows.',xp:25},
  {title:'8. Visual Select',desc:'Press V to select a line, then d to delete it.',xp:40},
  {title:'9. Open Line Below',desc:'Press o to open a new line below and type.',xp:25},
  {title:'10. Change Word',desc:'Move cursor to a word and press cw to change it.',xp:35}
];

function renderExercises() {
  var html = '';
  EX.forEach(function(ex, i) {
    html += '<div class="ex-card" id="ex-'+i+'" onclick="claimEx('+i+')">' +
      '<div class="ex-title">' + ex.title + '</div>' +
      '<div class="ex-desc">' + ex.desc + '</div>' +
      '<div class="ex-xp">+' + ex.xp + ' XP</div>' +
    '</div>';
  });
  document.getElementById('ex-list').innerHTML = html;
}

function claimEx(i) {
  var el = document.getElementById('ex-'+i);
  if (!el || el.classList.contains('claimed')) return;
  el.classList.add('claimed');
  el.innerHTML += '<div style="font-size:10px;color:var(--green);margin-top:4px;font-family:var(--mono)">// claimed ✓</div>';
  vscode.postMessage({ command:'addXP', amount:EX[i].xp, reason:EX[i].title });
}

// ── LOG ──
function logCmd(cmd, type) {
  var el = document.getElementById('cmd-log');
  if (!el) return;
  var d = new Date();
  var t = d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0');
  var item = document.createElement('div');
  item.className = 'log-item log-' + (type||'n');
  item.innerHTML = '<span class="log-time">'+t+'</span><span>'+cmd+'</span>';
  el.insertBefore(item, el.firstChild);
  if (el.children.length > 60) el.lastChild.remove();
}

// ── SAMPLE LOAD ──
function loadSample(name) { initEditor(SAMPLES[name] || SAMPLES.code); setMsg('loaded '+name); }
function resetEditor() { initEditor(SAMPLES.code); setMsg('reset'); }

// ── BOOT ──
initEditor(SAMPLES.code);
renderExercises();
document.getElementById('ed-ta').focus();
</script>
</body>
</html>`;
  }
}

module.exports = { PlaygroundPanel };
