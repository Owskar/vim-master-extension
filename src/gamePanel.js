const vscode = require("vscode");

const _gamePanels = new Map();

function getGamePanel(context, providers) {
  if (_gamePanels.has("game")) {
    try { _gamePanels.get("game").reveal(vscode.ViewColumn.One); return; } catch(_) {}
  }

  const panel = vscode.window.createWebviewPanel(
    "vimquestGame",
    "🎮 VimQuest — Command Dojo",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [] }
  );

  _gamePanels.set("game", panel);
  panel.onDidDispose(() => _gamePanels.delete("game"));
  panel.webview.html = buildGameHTML();

  panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg.command === "saveScore") {
      const key  = `vimquest.best.${msg.game}`;
      const best = context.globalState.get(key, 0);
      if (msg.score > best) {
        await context.globalState.update(key, msg.score);
        vscode.window.showInformationMessage(`🏆 New high score in ${msg.game}: ${msg.score}!`);
      }
    }
    if (msg.command === "goHome") {
      const { getWelcomePanel } = require("./welcomePanel");
      panel.dispose();
      getWelcomePanel(context, providers);
    }
  });

  return panel;
}

function buildGameHTML() {
  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<title>VimQuest Games</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:var(--vscode-editor-background,#1e1e2e);
  --fg:var(--vscode-editor-foreground,#cdd6f4);
  --card:var(--vscode-editorWidget-background,#181825);
  --border:var(--vscode-editorWidget-border,#313244);
  --code-bg:var(--vscode-textCodeBlock-background,#11111b);
  --accent:#7c3aed;--accent2:#06b6d4;--green:#10b981;--yellow:#f59e0b;--red:#f38ba8;
  --r:10px;--mono:'Cascadia Code','Fira Code',Consolas,monospace;
}
body{background:var(--bg);color:var(--fg);font-family:var(--vscode-font-family,-apple-system,sans-serif);font-size:14px;min-height:100vh}

/* NAV */
.nav{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--border);background:var(--card);sticky;top:0;z-index:20}
.logo{font-size:18px;font-weight:900;background:linear-gradient(135deg,#a855f7,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;cursor:pointer}
.nav-btn{background:none;border:1px solid var(--border);border-radius:7px;color:var(--fg);font-size:12px;padding:5px 12px;cursor:pointer}
.nav-btn:hover{border-color:var(--accent);color:var(--accent)}

/* LAYOUT */
.layout{max-width:780px;margin:0 auto;padding:28px 20px 60px}
.page-title{font-size:24px;font-weight:900;letter-spacing:-.5px;margin-bottom:6px}
.page-sub{font-size:13px;opacity:.6;margin-bottom:24px}

/* TABS */
.tabs{display:flex;gap:8px;margin-bottom:22px;flex-wrap:wrap}
.tab{padding:8px 18px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--fg);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
.tab:hover{border-color:var(--accent2)}
.tab.on{background:var(--accent);color:#fff;border-color:var(--accent)}

/* GAME AREA */
.game-area{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:26px;min-height:400px}

/* ── QUIZ ───────────────────────────────────────── */
.quiz-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.quiz-title{font-size:16px;font-weight:700}
.score-box{font-size:13px;font-weight:700;color:var(--yellow)}
.prog-row{margin-bottom:18px}
.prog-bar{height:5px;background:var(--code-bg);border-radius:3px;overflow:hidden;margin-top:4px}
.prog-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:3px;transition:width .3s}
.cmd-display{text-align:center;margin:20px 0}
.cmd-label{font-size:12px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.cmd-key{font-family:var(--mono);font-size:48px;font-weight:900;padding:16px 32px;background:var(--code-bg);border:2px solid var(--border);border-radius:12px;color:#e879f9;display:inline-block;letter-spacing:2px;transition:all .25s}
.cmd-key.ok{border-color:var(--green);color:var(--green)}
.cmd-key.no{border-color:var(--red);color:var(--red);animation:shk .3s}
@keyframes shk{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
.opt{padding:11px 14px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--fg);font-size:13px;cursor:pointer;text-align:left;transition:all .15s;font-family:inherit}
.opt:hover:not(:disabled){border-color:var(--accent);background:rgba(124,58,237,.08)}
.opt.ok{border-color:var(--green)!important;background:rgba(16,185,129,.1)!important;color:var(--green)}
.opt.no{border-color:var(--red)!important;background:rgba(243,139,168,.1)!important;color:var(--red)}
.opt:disabled{cursor:not-allowed}

/* ── SEQUENCE ──────────────────────────────────── */
.seq-prompt{padding:16px 18px;background:var(--code-bg);border:1px solid var(--border);border-radius:8px;font-size:14px;line-height:1.6;margin:16px 0}
.seq-prompt strong{color:var(--accent2)}
.seq-row{display:flex;gap:10px;align-items:center}
.seq-input{flex:1;font-family:var(--mono);font-size:16px;padding:10px 14px;background:var(--code-bg);border:2px solid var(--border);border-radius:8px;color:var(--fg);outline:none;transition:border-color .15s}
.seq-input:focus{border-color:var(--accent)}
.seq-btn{padding:10px 20px;border-radius:8px;background:var(--accent);color:#fff;border:none;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap}
.seq-btn:hover{background:#6d28d9}
.seq-feedback{min-height:32px;font-size:13px;font-weight:600;padding:6px 0;display:flex;align-items:center;gap:8px}
.seq-actions{display:flex;gap:12px;margin-top:4px}
.link-btn{background:none;border:none;font-size:12px;cursor:pointer;text-decoration:underline;padding:0;opacity:.7}
.link-btn:hover{opacity:1}
.hint-box{font-size:12px;opacity:.7;font-style:italic;margin-top:4px;padding:6px 10px;background:rgba(6,182,212,.06);border-radius:6px}

/* ── FLASHCARDS ────────────────────────────────── */
.fc-info{font-size:13px;opacity:.6;margin-bottom:14px}
.fc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-top:8px}
.fc{padding:14px;background:var(--code-bg);border:1px solid var(--border);border-radius:9px;cursor:pointer;transition:all .2s;text-align:center;user-select:none}
.fc:hover{border-color:var(--accent);transform:translateY(-2px)}
.fc.flipped{background:rgba(124,58,237,.08);border-color:var(--accent)}
.fc-key{font-family:var(--mono);font-size:20px;font-weight:900;color:#e879f9;margin-bottom:6px}
.fc-desc{font-size:11px;line-height:1.4;min-height:28px;transition:opacity .2s}
.fc-desc.hidden{opacity:0}
.fc-reveal-all{margin-top:12px;font-size:12px;cursor:pointer;color:var(--accent2);text-decoration:underline;background:none;border:none}

/* ── RESULT ────────────────────────────────────── */
.result{display:flex;flex-direction:column;align-items:center;gap:14px;padding:36px 0;text-align:center}
.r-emoji{font-size:52px}
.r-title{font-size:22px;font-weight:800}
.r-score{font-size:18px;color:var(--yellow);font-weight:700}
.r-msg{font-size:13px;opacity:.7;max-width:300px;line-height:1.6}
.r-btn{padding:11px 28px;border-radius:8px;background:var(--accent);color:#fff;border:none;font-weight:700;font-size:14px;cursor:pointer;margin-top:6px}
.r-btn:hover{background:#6d28d9}
</style>
</head>
<body>

<div class="nav">
  <span class="logo" onclick="goHome()">⚔️ VimQuest</span>
  <button class="nav-btn" onclick="goHome()">← Dashboard</button>
</div>

<div class="layout">
  <div class="page-title">🎮 Command Dojo</div>
  <div class="page-sub">Test your Vim muscle memory with three different games</div>

  <div class="tabs">
    <button class="tab on" id="tab-quiz"  onclick="switchTo('quiz')">⚡ Command Quiz</button>
    <button class="tab"    id="tab-seq"   onclick="switchTo('seq')">🧩 Sequence Builder</button>
    <button class="tab"    id="tab-flash" onclick="switchTo('flash')">📋 Flashcard Drill</button>
  </div>

  <div class="game-area" id="area"></div>
</div>

<script>
const vscode = acquireVsCodeApi();

// ── DATA ─────────────────────────────────────────────────────────────────────
const QUIZ = [
  {k:"h",       a:["Move cursor left","Move cursor right","Move cursor up","Move cursor down"],     c:0},
  {k:"j",       a:["Move cursor up","Move cursor left","Move cursor down","Move cursor right"],     c:2},
  {k:"k",       a:["Move cursor down","Move cursor up","Move cursor right","Move cursor left"],     c:1},
  {k:"l",       a:["Move cursor left","Move cursor down","Move cursor up","Move cursor right"],     c:3},
  {k:"w",       a:["Write file","Jump to next word start","Move line down","Select word"],          c:1},
  {k:"b",       a:["Jump back to previous word","Break line","Write buffer","Select block"],        c:0},
  {k:"e",       a:["Exit Vim","Jump to end of word","Expand selection","Edit file"],               c:1},
  {k:"dd",      a:["Duplicate line","Decrease indent","Delete current line","Debug code"],         c:2},
  {k:"yy",      a:["Undo last change","Yank (copy) current line","Redo change","Select line"],     c:1},
  {k:"p",       a:["Print file","Paste after cursor","Previous buffer","Pause editor"],            c:1},
  {k:"P",       a:["Print file","Previous file","Paste before cursor","Page up"],                  c:2},
  {k:"u",       a:["Undo last change","Go up one line","Update file","Uppercase word"],            c:0},
  {k:"Ctrl+r",  a:["Record macro","Redo (undo the undo)","Replace word","Run command"],            c:1},
  {k:"gg",      a:["Open files","Go to top of file","Go to last change","Group lines"],            c:1},
  {k:"G",       a:["Go to top of file","Group selection","Go to bottom of file","Go to mark"],    c:2},
  {k:"0",       a:["Jump to end of line","Go to line 0","Jump to start of line","Select all"],    c:2},
  {k:"$",       a:["Search pattern","Jump to end of line","Run shell","Go to last file"],          c:1},
  {k:"^",       a:["Start of file","First non-blank char of line","Search pattern","Top of screen"],c:1},
  {k:"i",       a:["Indent line","Insert before cursor","Info command","Increase number"],         c:1},
  {k:"a",       a:["Select all","Append after cursor","Add new line","Auto-complete"],             c:1},
  {k:"o",       a:["Open file","Options menu","Open new line below","Overwrite mode"],             c:2},
  {k:"O",       a:["Open file above","Open new line above","Overwrite all","Options"],             c:1},
  {k:"A",       a:["Select all","Append at end of line","Add indentation","Auto-save"],            c:1},
  {k:"I",       a:["Info","Insert at start of line","Increase indent","Italic mode"],              c:1},
  {k:"v",       a:["View mode","Visual character mode","Vim command","Vertical split"],             c:1},
  {k:"V",       a:["Visual block mode","Vertical split","Visual line mode","Vim info"],            c:2},
  {k:"Ctrl+v",  a:["Paste","Visual block mode","Version info","Vertical scroll"],                  c:1},
  {k:"dw",      a:["Duplicate word","Delete to end of word","Delete word","Do work"],              c:2},
  {k:"cw",      a:["Copy word","Change (replace) word","Count words","Close window"],              c:1},
  {k:"ci(",     a:["Copy inner parens","Close if parens","Change inside parentheses","Count items"],c:2},
  {k:'di"',     a:["Duplicate inside quotes","Delete inside double quotes","Dim text","Define item"],c:1},
  {k:".",       a:["Next search match","Repeat last change","Enter command mode","Tab complete"],   c:1},
  {k:"*",       a:["Multiply selection","Mark all","Search forward for word under cursor","Comment"],c:2},
  {k:"f{c}",    a:["Find file","Jump to next occurrence of char on line","Format code","Fold"],    c:1},
  {k:"ZZ",      a:["Zoom in","Zig-zag","Save and quit","Suspend Vim"],                             c:2},
  {k:":w",      a:["Write (save) file","Wipe buffer","Wrap text","Window command"],                c:0},
  {k:":q!",     a:["Quiet mode","Quit without saving","Quick format","Query replace"],              c:1},
  {k:":wq",     a:["Write quietly","Save and quit","Wrap and quit","Window query"],                c:1},
  {k:"qa",      a:["Quit all files","Quick action","Start recording macro into register a","Query all"],c:2},
  {k:"@a",      a:["Append to register a","Play macro in register a","Jump to mark a","Search a"],c:1},
  {k:'"+y',     a:["Yank to history","Yank to system clipboard","Yank to file","Yank as text"],    c:1},
  {k:"gv",      a:["Go to visual","Re-select last visual selection","Go to vim","View git"],       c:1},
  {k:"ma",      a:["Move and append","Set mark at position a","Make alias","Multiply all"],        c:1},
  {k:"'a",      a:["Append at mark a","Jump to line of mark a","All marks","Auto-indent a"],      c:1},
  {k:"%",       a:["Line percentage","Jump to matching bracket/paren","Macro percent","Modulo"],   c:1},
  {k:">>",      a:["Right shift bits","Indent line right","Go to end","Greater-than twice"],       c:1},
  {k:"<<",      a:["Left shift bits","Go to start","Unindent line left","Less-than twice"],        c:2},
  {k:"~",       a:["Shell command","Toggle case of character","Tilde search","Regex any char"],    c:1},
  {k:"xp",      a:["Delete and paste","Transpose (swap) two characters","Exit and print","X command"],c:1},
  {k:"J",       a:["Join two lines","Jump down","Java mode","Justify text"],                       c:0},
];

const SEQ = [
  {task:"Delete from cursor to <strong>end of line</strong>",          ans:"d$",     hint:"operator + motion to end of line"},
  {task:"Change (replace) the <strong>word under cursor</strong>",      ans:"cw",     hint:"change + word motion"},
  {task:"Copy the <strong>entire current line</strong>",                ans:"yy",     hint:"double the yank operator"},
  {task:"Paste <strong>BEFORE</strong> the cursor",                     ans:"P",      hint:"uppercase P"},
  {task:"Go to <strong>line 42</strong>",                               ans:"42G",    hint:"number + G"},
  {task:"Jump <strong>5 words forward</strong>",                        ans:"5w",     hint:"count + word jump"},
  {task:"Delete <strong>3 lines</strong> at once",                      ans:"3dd",    hint:"count + delete line"},
  {task:"Select the <strong>whole current line</strong> visually",      ans:"V",      hint:"capital V = line visual"},
  {task:"Undo the last <strong>3 changes</strong>",                     ans:"3u",     hint:"count + undo"},
  {task:'Delete text <strong>inside double quotes</strong>',            ans:'di"',    hint:"delete inner quotes text object"},
  {task:"Search for the <strong>word under cursor</strong> (forward)",  ans:"*",      hint:"the star key"},
  {task:"Jump to <strong>end of current word</strong>",                 ans:"e",      hint:"single letter motion"},
  {task:"Open a <strong>new line below</strong> and enter insert mode", ans:"o",      hint:"opens a line below"},
  {task:"<strong>Replay</strong> the last macro",                       ans:"@@",     hint:"double @ symbol"},
  {task:"<strong>Save</strong> the file and <strong>quit</strong>",     ans:":wq",    hint:"write + quit in command mode"},
  {task:"Go to <strong>top of file</strong>",                           ans:"gg",     hint:"double g"},
  {task:"Go to <strong>bottom of file</strong>",                        ans:"G",      hint:"capital G"},
  {task:"Jump to <strong>start of line</strong> (column 0)",            ans:"0",      hint:"the zero key"},
  {task:"Jump to <strong>end of line</strong>",                         ans:"$",      hint:"dollar sign"},
  {task:"Append text at <strong>end of current line</strong>",          ans:"A",      hint:"capital A"},
  {task:"Insert text at <strong>start of current line</strong>",        ans:"I",      hint:"capital I"},
  {task:"Delete the <strong>current character</strong> under cursor",   ans:"x",      hint:"x deletes char"},
  {task:"Enter <strong>visual block</strong> mode",                     ans:"\\u0003",hint:"Ctrl+V for column select"},
  {task:"Indent current line <strong>to the right</strong>",            ans:">>",     hint:"two greater-than signs"},
  {task:"Join the <strong>current line with the next</strong>",         ans:"J",      hint:"capital J joins lines"},
];

const FLASH = [
  {k:"h",      d:"Move cursor left"},
  {k:"j",      d:"Move cursor down"},
  {k:"k",      d:"Move cursor up"},
  {k:"l",      d:"Move cursor right"},
  {k:"w",      d:"Jump to next word start"},
  {k:"b",      d:"Jump to previous word start"},
  {k:"e",      d:"Jump to end of word"},
  {k:"0",      d:"Jump to start of line"},
  {k:"^",      d:"First non-blank char of line"},
  {k:"$",      d:"Jump to end of line"},
  {k:"gg",     d:"Go to top of file"},
  {k:"G",      d:"Go to bottom of file"},
  {k:"i",      d:"Insert before cursor"},
  {k:"a",      d:"Append after cursor"},
  {k:"o",      d:"Open new line below"},
  {k:"O",      d:"Open new line above"},
  {k:"I",      d:"Insert at start of line"},
  {k:"A",      d:"Append at end of line"},
  {k:"x",      d:"Delete character under cursor"},
  {k:"dd",     d:"Delete current line"},
  {k:"yy",     d:"Yank (copy) current line"},
  {k:"p",      d:"Paste after cursor"},
  {k:"P",      d:"Paste before cursor"},
  {k:"u",      d:"Undo last change"},
  {k:"Ctrl+r", d:"Redo (undo the undo)"},
  {k:"v",      d:"Visual character mode"},
  {k:"V",      d:"Visual line mode"},
  {k:".",      d:"Repeat last change"},
  {k:"*",      d:"Search word under cursor (forward)"},
  {k:"%",      d:"Jump to matching bracket"},
  {k:"ZZ",     d:"Save and quit"},
  {k:":q!",    d:"Quit without saving"},
  {k:">>",     d:"Indent line right"},
  {k:"J",      d:"Join line with next"},
  {k:"~",      d:"Toggle case of character"},
];

// ── STATE ────────────────────────────────────────────────────────────────────
let mode='quiz', qState=null, sState=null;

// ── SWITCH ───────────────────────────────────────────────────────────────────
function switchTo(m){
  mode=m;
  ['quiz','seq','flash'].forEach(t=>{
    document.getElementById('tab-'+t).className='tab'+(t===m?' on':'');
  });
  if(m==='quiz')  startQuiz();
  if(m==='seq')   startSeq();
  if(m==='flash') startFlash();
}

// ── QUIZ ─────────────────────────────────────────────────────────────────────
function startQuiz(){
  const pool=[...QUIZ].sort(()=>Math.random()-.5).slice(0,12);
  qState={pool,idx:0,score:0,locked:false};
  renderQuiz();
}

function renderQuiz(){
  const {pool,idx,score}=qState;
  const q=pool[idx];
  const pct=Math.round(idx/pool.length*100);
  get('area').innerHTML=\`
<div class="quiz-header">
  <span class="quiz-title">⚡ Command Quiz</span>
  <span class="score-box">Score: \${score}/\${pool.length}</span>
</div>
<div class="prog-row">
  <span style="font-size:12px;opacity:.6">Question \${idx+1} of \${pool.length}</span>
  <div class="prog-bar"><div class="prog-fill" id="qpf" style="width:\${pct}%"></div></div>
</div>
<div class="cmd-display">
  <div class="cmd-label">What does this Vim command do?</div>
  <div class="cmd-key" id="cmdkey">\${q.k}</div>
</div>
<div class="opts">
  \${q.a.map((ans,i)=>\`<button class="opt" id="opt\${i}" onclick="answer(\${i})">\${ans}</button>\`).join('')}
</div>\`;
}

function answer(idx){
  if(qState.locked) return;
  qState.locked=true;
  const q=qState.pool[qState.idx];
  const ok=idx===q.c;
  if(ok) qState.score++;
  q.a.forEach((_,i)=>{
    const el=get('opt'+i);
    el.disabled=true;
    if(i===q.c) el.classList.add('ok');
    else if(i===idx&&!ok) el.classList.add('no');
  });
  get('cmdkey').classList.add(ok?'ok':'no');
  setTimeout(()=>{
    qState.idx++;
    qState.locked=false;
    if(qState.idx<qState.pool.length) renderQuiz();
    else showQuizResult();
  },1100);
}

function showQuizResult(){
  const {score,pool}=qState;
  const pct=Math.round(score/pool.length*100);
  const [em,msg]=pct>=90?['🏆','Outstanding! Vim Master material!']:
                  pct>=70?['⚔️','Great work! Keep it up!']:
                  pct>=50?['📖','Getting there — review and retry!']:
                         ['🐣','Keep studying — you will get it!'];
  get('area').innerHTML=\`
<div class="result">
  <div class="r-emoji">\${em}</div>
  <div class="r-title">Quiz Complete!</div>
  <div class="r-score">\${score}/\${pool.length} correct (\${pct}%)</div>
  <div class="r-msg">\${msg}</div>
  <button class="r-btn" onclick="startQuiz()">🔄 Play Again</button>
</div>\`;
  vscode.postMessage({command:'saveScore',game:'quiz',score:pct});
}

// ── SEQUENCE ──────────────────────────────────────────────────────────────────
function startSeq(){
  const pool=[...SEQ].sort(()=>Math.random()-.5);
  sState={pool,idx:0,correct:0,total:0};
  renderSeq();
}

function renderSeq(){
  const {pool,idx,correct,total}=sState;
  if(idx>=pool.length){ showSeqResult(); return; }
  const q=pool[idx];
  get('area').innerHTML=\`
<div class="quiz-header">
  <span class="quiz-title">🧩 Sequence Builder</span>
  <span class="score-box">✅ \${correct}/\${total}</span>
</div>
<div style="font-size:13px;opacity:.6;margin-bottom:4px">Type the Vim command for this task:</div>
<div class="seq-prompt">\${q.task}</div>
<div class="seq-row">
  <input class="seq-input" id="si" type="text" placeholder="Type command…" autocomplete="off" spellcheck="false"
    onkeydown="if(event.key==='Enter'){event.preventDefault();checkSeq()}">
  <button class="seq-btn" onclick="checkSeq()">Check →</button>
</div>
<div class="seq-feedback" id="sf"></div>
<div class="seq-actions">
  <button class="link-btn" style="color:var(--accent2)" onclick="toggleHint()">💡 Hint</button>
  <button class="link-btn" onclick="skipSeq()">Skip →</button>
</div>
<div class="hint-box" id="hb" style="display:none">Hint: \${q.hint}</div>\`;
  get('si').focus();
}

function checkSeq(){
  const val=get('si').value.trim();
  const q=sState.pool[sState.idx];
  sState.total++;
  if(val===q.ans){
    sState.correct++;
    get('sf').innerHTML='<span style="color:var(--green)">✅ Correct!</span>';
    setTimeout(nextSeq,700);
  } else {
    get('sf').innerHTML=\`<span style="color:var(--red)">❌ Answer: <code style="font-family:monospace;background:var(--code-bg);padding:1px 6px;border-radius:4px">\${q.ans}</code></span>\`;
  }
}
function skipSeq(){ sState.total++; nextSeq(); }
function nextSeq(){ sState.idx++; renderSeq(); }
function toggleHint(){
  const b=get('hb'); b.style.display=b.style.display==='none'?'block':'none';
}
function showSeqResult(){
  const {correct,total,pool}=sState;
  const pct=total?Math.round(correct/total*100):0;
  get('area').innerHTML=\`
<div class="result">
  <div class="r-emoji">🧩</div>
  <div class="r-title">All \${pool.length} sequences done!</div>
  <div class="r-score">\${correct}/\${total} correct (\${pct}%)</div>
  <div class="r-msg">Practice the ones you missed in the lessons.</div>
  <button class="r-btn" onclick="startSeq()">🔄 Play Again</button>
</div>\`;
  vscode.postMessage({command:'saveScore',game:'seq',score:pct});
}

// ── FLASHCARDS ────────────────────────────────────────────────────────────────
function startFlash(){
  const cards=[...FLASH].sort(()=>Math.random()-.5);
  get('area').innerHTML=\`
<div class="quiz-header">
  <span class="quiz-title">📋 Flashcard Drill</span>
  <button class="r-btn" style="font-size:12px;padding:5px 14px" onclick="revealAll()">Reveal All</button>
</div>
<div class="fc-info">Click any card to flip it and see its meaning.</div>
<div class="fc-grid" id="fcgrid"></div>\`;
  const grid=get('fcgrid');
  cards.forEach((card,i)=>{
    const el=document.createElement('div');
    el.className='fc';
    el.innerHTML=\`<div class="fc-key">\${card.k}</div><div class="fc-desc hidden" id="fd\${i}">\${card.d}</div>\`;
    el.onclick=()=>{
      el.classList.toggle('flipped');
      const desc=get('fd'+i);
      desc.classList.toggle('hidden');
    };
    grid.appendChild(el);
  });
}
function revealAll(){
  document.querySelectorAll('.fc').forEach(el=>{
    el.classList.add('flipped');
    el.querySelectorAll('.fc-desc').forEach(d=>d.classList.remove('hidden'));
  });
}

// ── UTILS ────────────────────────────────────────────────────────────────────
function get(id){ return document.getElementById(id); }
function goHome(){ vscode.postMessage({command:'goHome'}); }

// ── INIT ─────────────────────────────────────────────────────────────────────
startQuiz();
</script>
</body>
</html>`;
}

module.exports = { getGamePanel };
