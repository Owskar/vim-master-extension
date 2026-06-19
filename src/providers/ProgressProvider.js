const vscode = require('vscode');

class ProgressProvider {
  constructor(extensionUri, storageManager) {
    this._extensionUri = extensionUri;
    this._storageManager = storageManager;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._buildHtml();
    webviewView.webview.onDidReceiveMessage(msg => {
      if (msg.command === 'open') vscode.commands.executeCommand('vimMaster.' + msg.target);
    });
  }

  _buildHtml() {
    const p = this._storageManager.getProgress() || this._storageManager.initializeProgress();
    const xpForLevel = l => l * l * 100;
    const l = p.level;
    const xpThis = xpForLevel(l), xpNext = xpForLevel(l + 1);
    const pct = Math.min(100, Math.round((p.xp - xpThis) / (xpNext - xpThis) * 100));
    const done = (p.completedLessons || []).length;
    const totalLessons = 18;

    const tips = [
      'Use . to repeat your last change — the most powerful single key.',
      'ci" changes inside quotes in one motion.',
      '* searches for the word under cursor instantly.',
      'Prefix a motion with a number: 5j moves 5 lines down.',
      'Use % to jump between matching brackets.',
      'gg=G auto-indents your entire file.',
      'Ctrl+o jumps back to your previous location.',
      'qa records a macro. 100@a replays it 100 times.'
    ];
    const tip = tips[new Date().getDate() % tips.length];

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;600&display=swap');
:root {
  --bg:transparent;--bg1:rgba(255,255,255,.04);--bg2:rgba(255,255,255,.07);
  --border:rgba(255,255,255,.08);
  --green:#3fb950;--blue:#58a6ff;--yellow:#e3b341;--red:#f85149;
  --text:var(--vscode-sideBar-foreground,#e6edf3);--text2:#8b949e;--text3:#484f58;
  --mono:'IBM Plex Mono',monospace;--sans:'IBM Plex Sans',sans-serif;
  --r:5px;
}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:var(--sans);background:transparent;color:var(--text);padding:10px;font-size:12px;}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);}

.level-card{background:var(--bg1);border:1px solid rgba(63,185,80,.2);border-radius:var(--r);padding:14px;margin-bottom:10px;text-align:center;}
.lv-num{font-family:var(--mono);font-size:36px;font-weight:700;color:var(--green);line-height:1;}
.lv-title{font-size:11px;color:var(--text2);margin:4px 0 10px;font-family:var(--mono);}
.xp-bar{background:rgba(255,255,255,.07);border-radius:2px;height:4px;overflow:hidden;margin-bottom:4px;}
.xp-fill{height:100%;background:var(--green);border-radius:2px;}
.xp-lbl{font-size:10px;color:var(--text3);font-family:var(--mono);}

.stats{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;}
.stat{background:var(--bg1);border:1px solid var(--border);border-radius:var(--r);padding:8px;text-align:center;}
.sv{font-family:var(--mono);font-size:18px;font-weight:700;line-height:1;}
.sl{font-size:9px;color:var(--text2);margin-top:2px;text-transform:uppercase;letter-spacing:.06em;}

.btn{width:100%;padding:7px;border-radius:var(--r);border:1px solid;font-family:var(--mono);font-size:11px;font-weight:600;cursor:pointer;margin-bottom:6px;transition:all .12s;}
.btn-g{background:rgba(63,185,80,.1);border-color:rgba(63,185,80,.25);color:var(--green);}
.btn-g:hover{background:rgba(63,185,80,.2);}
.btn-p{background:rgba(188,140,255,.1);border-color:rgba(188,140,255,.25);color:#bc8cff;}
.btn-p:hover{background:rgba(188,140,255,.2);}
.btn-y{background:rgba(227,179,65,.1);border-color:rgba(227,179,65,.25);color:var(--yellow);}
.btn-y:hover{background:rgba(227,179,65,.2);}

.sec-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin:10px 0 6px;}

.ref-row{display:flex;gap:6px;align-items:center;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:10px;}
.ref-row:last-child{border:none;}
.rk{font-family:var(--mono);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:1px 5px;border-radius:2px;color:var(--green);font-size:9px;min-width:50px;}
.rd{color:var(--text2);}

.tip{background:rgba(227,179,65,.07);border:1px solid rgba(227,179,65,.15);border-radius:var(--r);padding:9px 10px;font-size:10px;color:var(--yellow);line-height:1.5;margin-top:8px;font-family:var(--mono);}

.prog-bar{background:rgba(255,255,255,.06);border-radius:2px;height:3px;overflow:hidden;margin-top:4px;}
.prog-fill{height:100%;background:var(--blue);border-radius:2px;}
</style>
</head>
<body>

<div class="level-card">
  <div class="lv-num">${l}</div>
  <div class="lv-title">${levelTitle(l)}</div>
  <div class="xp-bar"><div class="xp-fill" style="width:${pct}%"></div></div>
  <div class="xp-lbl">${p.xp - xpThis} / ${xpNext - xpThis} XP to Lv.${l + 1}</div>
</div>

<div class="stats">
  <div class="stat"><div class="sv" style="color:var(--yellow)">${p.xp}</div><div class="sl">Total XP</div></div>
  <div class="stat"><div class="sv" style="color:var(--red)">🔥${p.streak || 0}</div><div class="sl">Streak</div></div>
  <div class="stat"><div class="sv" style="color:var(--green)">${done}</div><div class="sl">Lessons</div></div>
  <div class="stat"><div class="sv" style="color:#bc8cff">${(p.badges || []).length}</div><div class="sl">Badges</div></div>
</div>

<div style="margin-bottom:4px">
  <div style="font-size:10px;color:var(--text2);margin-bottom:3px;display:flex;justify-content:space-between">
    <span>lessons progress</span><span style="color:var(--blue)">${Math.round(done/totalLessons*100)}%</span>
  </div>
  <div class="prog-bar"><div class="prog-fill" style="width:${Math.round(done/totalLessons*100)}%"></div></div>
</div>

<div style="margin-top:10px"></div>
<button class="btn btn-g" onclick="send('openDashboard')">📚 Open Dashboard</button>
<button class="btn btn-p" onclick="send('openGames')">🎮 Play Games</button>
<button class="btn btn-y" onclick="send('dailyChallenge')">🎯 Daily Challenge</button>

<div class="sec-title">quick reference</div>
<div class="ref-row"><span class="rk">i / Esc</span><span class="rd">Insert / Normal mode</span></div>
<div class="ref-row"><span class="rk">dd</span><span class="rd">Delete line</span></div>
<div class="ref-row"><span class="rk">yy / p</span><span class="rd">Yank / Paste</span></div>
<div class="ref-row"><span class="rk">u</span><span class="rd">Undo</span></div>
<div class="ref-row"><span class="rk">gg / G</span><span class="rd">File top / bottom</span></div>
<div class="ref-row"><span class="rk">w / b</span><span class="rd">Word fwd / back</span></div>
<div class="ref-row"><span class="rk">ci"</span><span class="rd">Change inside quotes</span></div>
<div class="ref-row"><span class="rk">.</span><span class="rd">Repeat last change</span></div>
<div class="ref-row"><span class="rk">:wq</span><span class="rd">Save and quit</span></div>

<div class="tip">💡 ${tip}</div>

<script>
function send(target) {
  acquireVsCodeApi().postMessage({ command: 'open', target: target });
}
</script>
</body>
</html>`;
  }
}

function levelTitle(l) {
  if (l < 3) return 'Vim Newbie';
  if (l < 6) return 'Insert Mode Survivor';
  if (l < 10) return 'Normal Mode Ninja';
  if (l < 15) return 'Macro Maestro';
  if (l < 20) return 'Regex Warrior';
  return 'Vim Grand Master';
}

module.exports = { ProgressProvider };
