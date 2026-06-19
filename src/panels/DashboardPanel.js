const vscode = require('vscode');
const { LESSONS } = require('../data/lessons');
const { CHEAT_SHEET } = require('../data/cheatsheet');
const { DAILY_CHALLENGES } = require('../data/challenges');

class DashboardPanel {
  static currentPanel = undefined;
  static viewType = 'vimMasterDashboard';

  static createOrShow(extensionUri, storageManager, tab) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : vscode.ViewColumn.One;

    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel._panel.reveal(column);
      // Re-send data every time panel is shown (fixes "not responding after reopen")
      setTimeout(() => {
        DashboardPanel.currentPanel._sendData(tab);
      }, 100);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      DashboardPanel.viewType,
      'VimMaster',
      column,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, storageManager, tab || 'home');
  }

  constructor(panel, extensionUri, storageManager, initialTab) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._storageManager = storageManager;
    this._initialTab = initialTab || 'home';
    this._disposables = [];

    // Embed ALL data directly in HTML — no async postMessage needed for init
    this._panel.webview.html = this._buildHtml();

    this._panel.onDidDispose(() => {
      DashboardPanel.currentPanel = undefined;
      this.dispose();
    }, null, this._disposables);

    this._panel.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.command) {
        case 'completeLesson': {
          const r = this._storageManager.completeLesson(msg.lessonId);
          if (r && r.leveledUp) {
            vscode.window.showInformationMessage('🎉 LEVEL UP! You reached Level ' + r.newLevel + '!');
          }
          vscode.window.setStatusBarMessage('⚡ +' + (r ? r.xpGained : 150) + ' XP earned!', 3000);
          this._panel.webview.postMessage({ command: 'progress', data: this._storageManager.getProgress() });
          break;
        }
        case 'addXP': {
          this._storageManager.addXP(msg.amount, msg.reason || 'bonus');
          this._panel.webview.postMessage({ command: 'progress', data: this._storageManager.getProgress() });
          break;
        }
        case 'openGames':
          vscode.commands.executeCommand('vimMaster.openGames');
          break;
        case 'openPlayground':
          vscode.commands.executeCommand('vimMaster.openPlayground');
          break;
      }
    }, null, this._disposables);
    this._panel.onDidChangeViewState(() => {
  if (this._panel.visible) {
    this._sendData(this._initialTab);
  }
});
  }
  

  _sendData(tab) {
    try {
      this._panel.webview.postMessage({
        command: 'reload',
        progress: this._storageManager.getProgress(),
        tab: tab || 'home'
      });
    } catch (e) {}
  }

  dispose() {
    DashboardPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }

  _buildHtml() {
    const progress = this._storageManager.getProgress() || this._storageManager.initializeProgress();

    // Embed ALL data as JSON directly in the HTML — synchronous, no async race
    const PDATA = JSON.stringify(progress);
    const LDATA = JSON.stringify(LESSONS);
    const CDATA = JSON.stringify(CHEAT_SHEET);
    const DDATA = JSON.stringify(DAILY_CHALLENGES);
    const ITAB  = JSON.stringify(this._initialTab || 'home');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VimMaster</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
:root {
  --bg0:#0a0c0f; --bg1:#0f1117; --bg2:#161b22; --bg3:#1c2128;
  --border:#21262d; --border2:#30363d;
  --green:#3fb950; --gdim:#238636;
  --blue:#58a6ff;  --bdim:#1f6feb;
  --purple:#bc8cff; --yellow:#e3b341;
  --red:#f85149; --cyan:#39d353;
  --text:#e6edf3; --text2:#8b949e; --text3:#484f58;
  --mono:'IBM Plex Mono',monospace;
  --sans:'IBM Plex Sans',sans-serif;
  --r:6px; --rl:10px;
}
*,*::before,*::after { margin:0; padding:0; box-sizing:border-box; }
html, body { height:100%; font-family:var(--sans); background:var(--bg0); color:var(--text); font-size:13px; }
::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-thumb { background:var(--border2); border-radius:3px; }

/* ── TOP BAR ── */
.topbar {
  position:sticky; top:0; z-index:100;
  display:flex; align-items:center;
  background:var(--bg1); border-bottom:1px solid var(--border);
  height:46px; padding:0 0 0 14px;
  font-family:var(--mono); font-size:12px;
}
.logo { display:flex; align-items:center; gap:6px; font-weight:700; font-size:13px; color:var(--green); padding-right:16px; border-right:1px solid var(--border); margin-right:6px; white-space:nowrap; }
.logo-dim { color:var(--text3); }
.logo-name { color:var(--text); }

.ntabs { display:flex; align-items:center; height:100%; gap:2px; padding:0 6px; }
.ntab { display:flex; align-items:center; gap:5px; height:100%; padding:0 14px; color:var(--text2); cursor:pointer; font-size:12px; font-family:var(--mono); border:none; background:none; border-bottom:2px solid transparent; transition:color .15s, border-color .15s; white-space:nowrap; }
.ntab:hover { color:var(--text); }
.ntab.active { color:var(--green); border-bottom-color:var(--green); }
.ndot { width:6px; height:6px; border-radius:50%; background:var(--text3); }
.ntab.active .ndot { background:var(--green); }

.tbr { margin-left:auto; display:flex; align-items:center; gap:6px; padding:0 14px; border-left:1px solid var(--border); height:100%; }
.badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:var(--r); font-size:11px; font-family:var(--mono); font-weight:600; }
.bg { background:rgba(63,185,80,.1); color:var(--green); border:1px solid rgba(63,185,80,.2); }
.bb { background:rgba(88,166,255,.1); color:var(--blue); border:1px solid rgba(88,166,255,.2); }
.by { background:rgba(227,179,65,.1); color:var(--yellow); border:1px solid rgba(227,179,65,.2); }

/* ── PAGES ── */
.pages { height:calc(100vh - 46px); overflow:hidden; }
.page { display:none; height:100%; overflow-y:auto; }
.page.active { display:block; }
.pcontent { max-width:1060px; margin:0 auto; padding:24px 20px 60px; }

.sec-lbl { font-family:var(--mono); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--text3); margin-bottom:12px; display:flex; align-items:center; gap:8px; }
.sec-lbl::after { content:''; flex:1; height:1px; background:var(--border); }

/* ── HERO ── */
.hero { display:grid; grid-template-columns:1fr auto; gap:16px; background:var(--bg1); border:1px solid var(--border); border-radius:var(--rl); padding:22px; margin-bottom:22px; position:relative; overflow:hidden; }
.hero::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg, rgba(63,185,80,.04) 0%, transparent 60%); pointer-events:none; }
.hero-term { font-family:var(--mono); font-size:12px; }
.tl { display:flex; gap:7px; margin-bottom:3px; align-items:baseline; }
.tp { color:var(--green); } .tc { color:var(--blue); } .ta { color:var(--yellow); } .td { color:var(--text3); }
.to { color:var(--text2); padding-left:14px; }
.tcur { display:inline-block; width:7px; height:12px; background:var(--green); vertical-align:middle; animation:blink 1s step-end infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.xprow { display:flex; align-items:center; gap:10px; margin-top:14px; max-width:380px; }
.xpwrap { flex:1; height:4px; background:var(--bg3); border-radius:2px; overflow:hidden; }
.xpfill { height:100%; background:var(--green); border-radius:2px; transition:width .6s ease; }
.xplbl { font-size:10px; color:var(--text3); font-family:var(--mono); white-space:nowrap; }
.hstats { display:flex; flex-direction:column; gap:8px; align-items:flex-end; }
.hstat { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r); padding:9px 14px; text-align:right; min-width:100px; }
.hval { font-family:var(--mono); font-size:20px; font-weight:700; color:var(--green); line-height:1; margin-bottom:2px; }
.hlbl { font-size:9px; color:var(--text2); text-transform:uppercase; letter-spacing:.07em; }

/* ── ACTION CARDS ── */
.agrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; margin-bottom:26px; }
.acard { background:var(--bg1); border:1px solid var(--border); border-radius:var(--rl); padding:16px; cursor:pointer; transition:border-color .15s, background .15s, transform .1s; display:flex; flex-direction:column; gap:7px; }
.acard:hover { border-color:var(--border2); background:var(--bg2); transform:translateY(-1px); }
.acard:active { transform:none; }
.aicon { width:30px; height:30px; border-radius:var(--r); display:flex; align-items:center; justify-content:center; font-size:14px; }
.ig { background:rgba(63,185,80,.1); border:1px solid rgba(63,185,80,.2); }
.ib { background:rgba(88,166,255,.1); border:1px solid rgba(88,166,255,.2); }
.ip { background:rgba(188,140,255,.1); border:1px solid rgba(188,140,255,.2); }
.iy { background:rgba(227,179,65,.1); border:1px solid rgba(227,179,65,.2); }
.ir { background:rgba(248,81,73,.1); border:1px solid rgba(248,81,73,.2); }
.ic { background:rgba(57,211,83,.1); border:1px solid rgba(57,211,83,.2); }
.atitle { font-weight:600; font-size:13px; }
.adesc { font-size:11px; color:var(--text2); line-height:1.4; }

/* ── CHAPTERS ── */
.chblock { background:var(--bg1); border:1px solid var(--border); border-radius:var(--rl); margin-bottom:10px; overflow:hidden; }
.chhdr { display:flex; align-items:center; gap:10px; padding:13px 16px; cursor:pointer; user-select:none; transition:background .15s; }
.chhdr:hover { background:var(--bg2); }
.chico { width:32px; height:32px; border-radius:var(--r); display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
.chtitle { font-weight:600; font-size:13px; flex:1; }
.chmeta { font-size:11px; color:var(--text2); font-family:var(--mono); }
.chev { color:var(--text3); font-size:10px; margin-left:8px; transition:transform .2s; }
.chblock.open .chev { transform:rotate(90deg); }
.chbar { height:2px; background:var(--border); }
.chbar-fill { height:100%; background:var(--gdim); transition:width .4s; }
.llist { display:none; }
.chblock.open .llist { display:block; }
.lrow { display:flex; align-items:center; gap:12px; padding:10px 16px; border-top:1px solid var(--border); cursor:pointer; transition:background .12s; }
.lrow:hover { background:var(--bg2); }
.ldot { width:18px; height:18px; border-radius:50%; border:1.5px solid var(--border2); display:flex; align-items:center; justify-content:center; font-size:9px; color:var(--text3); flex-shrink:0; }
.ldot.done { background:rgba(63,185,80,.15); border-color:var(--green); color:var(--green); }
.ltxt { flex:1; font-size:13px; }
.ltags { display:flex; gap:5px; align-items:center; }
.tag { font-size:10px; font-family:var(--mono); padding:2px 6px; border-radius:3px; font-weight:500; }
.tbeg { background:rgba(63,185,80,.1); color:var(--green); border:1px solid rgba(63,185,80,.2); }
.tint { background:rgba(227,179,65,.1); color:var(--yellow); border:1px solid rgba(227,179,65,.2); }
.tadv { background:rgba(248,81,73,.1); color:var(--red); border:1px solid rgba(248,81,73,.2); }
.txp { background:rgba(88,166,255,.1); color:var(--blue); border:1px solid rgba(88,166,255,.2); }

/* ── LESSON DETAIL ── */
.ldetail { display:none; }
.ldetail.show { display:block; }
.backbtn { display:inline-flex; align-items:center; gap:6px; font-family:var(--mono); font-size:12px; color:var(--text2); cursor:pointer; background:none; border:none; margin-bottom:18px; transition:color .15s; padding:6px 0; }
.backbtn:hover { color:var(--green); }
.theory { background:var(--bg1); border:1px solid var(--border); border-radius:var(--rl); padding:26px; margin-bottom:14px; }
.theory h1 { font-size:20px; color:var(--green); margin-bottom:14px; font-family:var(--mono); }
.theory h2 { font-size:15px; color:var(--blue); margin:20px 0 10px; font-family:var(--mono); }
.theory h3 { font-size:13px; color:var(--yellow); margin:16px 0 8px; font-family:var(--mono); }
.theory p { color:var(--text2); margin-bottom:10px; line-height:1.65; }
.theory strong { color:var(--text); }
.theory code { font-family:var(--mono); background:var(--bg3); color:var(--green); padding:2px 6px; border-radius:3px; font-size:12px; border:1px solid var(--border2); }
.theory pre { background:var(--bg0); border:1px solid var(--border); border-radius:var(--r); padding:14px; font-family:var(--mono); font-size:12px; line-height:1.7; color:var(--cyan); overflow-x:auto; margin:12px 0; }
.theory blockquote { border-left:3px solid var(--bdim); padding:10px 14px; margin:12px 0; background:rgba(88,166,255,.05); color:var(--text2); font-style:italic; border-radius:0 var(--r) var(--r) 0; }
.theory table { width:100%; border-collapse:collapse; margin:12px 0; font-family:var(--mono); font-size:12px; }
.theory th { background:var(--bg3); padding:8px 12px; text-align:left; color:var(--text2); border-bottom:1px solid var(--border); }
.theory td { padding:8px 12px; border-bottom:1px solid var(--border); color:var(--text2); }
.theory td:first-child { color:var(--green); }
.theory tr:last-child td { border:none; }
.theory ul { padding-left:20px; margin-bottom:10px; }
.theory li { color:var(--text2); margin-bottom:4px; line-height:1.6; }

/* ── QUIZ ── */
.qcard { background:var(--bg1); border:1px solid var(--border); border-radius:var(--rl); padding:22px; margin-bottom:14px; }
.qhdr { font-family:var(--mono); font-size:11px; color:var(--yellow); margin-bottom:16px; }
.qhdr::before { content:'// '; color:var(--text3); }
.qqblock { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r); padding:16px; margin-bottom:12px; }
.qqnum { font-family:var(--mono); font-size:10px; color:var(--text3); margin-bottom:6px; }
.qqtxt { font-size:13px; font-weight:500; margin-bottom:12px; }
.qopt { display:flex; align-items:center; gap:9px; padding:9px 12px; border-radius:var(--r); border:1px solid var(--border); cursor:pointer; margin-bottom:6px; font-size:12px; transition:border-color .12s, background .12s; user-select:none; background:var(--bg3); }
.qopt:hover { border-color:var(--border2); background:var(--bg2); }
.qopt.correct { border-color:var(--green)!important; background:rgba(63,185,80,.1)!important; color:var(--green); }
.qopt.wrong { border-color:var(--red)!important; background:rgba(248,81,73,.1)!important; color:var(--red); }
.qkey { width:20px; height:20px; border-radius:3px; background:var(--bg2); border:1px solid var(--border2); display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-size:10px; font-weight:700; color:var(--text2); flex-shrink:0; }
.qopt.correct .qkey { background:rgba(63,185,80,.2); border-color:var(--green); color:var(--green); }
.qopt.wrong .qkey { background:rgba(248,81,73,.2); border-color:var(--red); color:var(--red); }
.qexp { display:none; margin-top:10px; padding:9px 12px; background:rgba(88,166,255,.07); border:1px solid rgba(88,166,255,.15); border-radius:var(--r); font-size:12px; color:var(--blue); font-family:var(--mono); }
.qexp.show { display:block; }
.donebtn { width:100%; padding:13px; background:var(--gdim); border:1px solid var(--green); border-radius:var(--r); color:#fff; font-size:13px; font-weight:700; font-family:var(--mono); cursor:pointer; transition:background .15s; margin-top:8px; letter-spacing:.02em; }
.donebtn:hover { background:var(--green); }
.donebtn:disabled { opacity:.3; cursor:not-allowed; }

/* ── CHEAT SHEET ── */
.csgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:10px; }
.cscard { background:var(--bg1); border:1px solid var(--border); border-radius:var(--rl); overflow:hidden; }
.cshdr { padding:9px 14px; font-family:var(--mono); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:7px; background:var(--bg2); }
.csrow { display:flex; align-items:center; gap:10px; padding:6px 14px; border-bottom:1px solid var(--border); transition:background .1s; }
.csrow:last-child { border:none; }
.csrow:hover { background:var(--bg2); }
.cskeys { font-family:var(--mono); font-size:10px; color:var(--green); min-width:100px; flex-shrink:0; }
.cskeys kbd { display:inline-block; background:var(--bg3); border:1px solid var(--border2); border-radius:3px; padding:1px 5px; font-size:10px; color:var(--green); font-family:var(--mono); margin:1px; }
.csdesc { font-size:11px; color:var(--text2); }

/* ── DAILY ── */
.dccard { background:var(--bg1); border:1px solid var(--border); border-radius:var(--rl); padding:18px; margin-bottom:10px; transition:border-color .15s; }
.dccard:hover { border-color:var(--border2); }
.dctitle { font-weight:600; font-size:14px; margin-bottom:5px; }
.dcdesc { font-size:12px; color:var(--text2); margin-bottom:12px; line-height:1.5; }
.dchint { display:none; background:var(--bg0); border:1px solid var(--border); border-radius:var(--r); padding:9px 12px; font-family:var(--mono); font-size:11px; color:var(--yellow); margin-bottom:12px; }
.dchint.show { display:block; }
.dcmeta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

/* ── PROGRESS ── */
.pgrid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:22px; }
.pgcard { background:var(--bg1); border:1px solid var(--border); border-radius:var(--rl); padding:18px; }
.pgctitle { font-family:var(--mono); font-size:10px; color:var(--text3); text-transform:uppercase; letter-spacing:.08em; margin-bottom:12px; }
.lv-big { font-family:var(--mono); font-size:52px; font-weight:700; color:var(--green); line-height:1; text-align:center; }
.lv-sub { font-size:12px; color:var(--text2); font-family:var(--mono); text-align:center; margin-top:5px; }
.statrow { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid var(--border); font-size:12px; }
.statrow:last-child { border:none; }
.stlbl { color:var(--text2); } .stval { font-family:var(--mono); color:var(--text); font-weight:600; }
.bgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:8px; }
.bcard { background:var(--bg1); border:1px solid var(--border); border-radius:var(--rl); padding:14px; text-align:center; transition:border-color .15s; }
.bcard.earned { border-color:rgba(227,179,65,.3); background:rgba(227,179,65,.04); }
.bcard.locked { opacity:.3; filter:grayscale(1); }
.bico { font-size:24px; margin-bottom:5px; }
.bname { font-size:11px; font-weight:600; }
.bdesc { font-size:10px; color:var(--text2); margin-top:2px; }
.bel { font-size:10px; color:var(--green); font-family:var(--mono); margin-top:5px; }

/* ── BTNS ── */
.btn { display:inline-flex; align-items:center; gap:5px; padding:6px 13px; border-radius:var(--r); border:1px solid; font-family:var(--mono); font-size:11px; font-weight:600; cursor:pointer; transition:all .12s; }
.btn-g { background:var(--gdim); border-color:var(--green); color:#fff; } .btn-g:hover { background:var(--green); }
.btn-gh { background:var(--bg2); border-color:var(--border2); color:var(--text2); } .btn-gh:hover { color:var(--text); border-color:var(--text3); }

/* ── TOAST ── */
.toasts { position:fixed; bottom:16px; right:16px; z-index:999; display:flex; flex-direction:column; gap:7px; }
.toast { background:var(--bg2); border:1px solid var(--border2); border-radius:var(--r); padding:9px 13px; font-size:11px; font-family:var(--mono); min-width:190px; animation:sin .25s ease; }
.toast-xp { border-left:3px solid var(--green); color:var(--green); }
.toast-info { border-left:3px solid var(--blue); color:var(--blue); }
@keyframes sin { from{transform:translateX(16px);opacity:0} to{transform:none;opacity:1} }

/* ── STATUSLINE ── */
.statusline { display:flex; align-items:center; background:var(--gdim); height:22px; font-family:var(--mono); font-size:11px; position:fixed; bottom:0; left:0; right:0; z-index:50; }
.slseg { padding:0 11px; height:100%; display:flex; align-items:center; color:#fff; gap:4px; border-right:1px solid rgba(0,0,0,.2); }
.sldark { background:rgba(0,0,0,.25); } .slmid { background:rgba(0,0,0,.15); }
.slr { margin-left:auto; border-left:1px solid rgba(0,0,0,.2); border-right:none; }
</style>
</head>
<body>

<!-- TOP BAR -->
<div class="topbar">
  <div class="logo">
    <span class="logo-dim">[</span>
    <span>vim</span><span class="logo-name">master</span>
    <span class="logo-dim">]</span>
  </div>
  <div class="ntabs">
    <button class="ntab active" onclick="goTab('home',this)"><span class="ndot"></span>~ home</button>
    <button class="ntab" onclick="goTab('lessons',this)"><span class="ndot"></span>lessons</button>
    <button class="ntab" onclick="goTab('cheatsheet',this)"><span class="ndot"></span>cheatsheet</button>
    <button class="ntab" onclick="goTab('daily',this)"><span class="ndot"></span>daily</button>
    <button class="ntab" onclick="goTab('progress',this)"><span class="ndot"></span>progress</button>
  </div>
  <div class="tbr">
    <span class="badge by" id="nb-streak">🔥 0</span>
    <span class="badge bb" id="nb-level">Lv.1</span>
    <span class="badge bg" id="nb-xp">0 XP</span>
  </div>
</div>

<!-- PAGES -->
<div class="pages">

  <!-- HOME -->
  <div class="page active" id="page-home">
    <div class="pcontent">
      <div class="hero">
        <div>
          <div class="hero-term">
            <div class="tl"><span class="tp">owskar@vimmaster</span><span class="td"> ~ $</span><span class="tc"> vim</span><span class="ta"> --start</span></div>
            <div class="tl" style="margin-top:6px"><span class="to">Level: <span id="ht-lv">1</span> &nbsp;·&nbsp; XP: <span id="ht-xp">0</span> &nbsp;·&nbsp; Lessons: <span id="ht-ls">0</span></span></div>
            <div class="tl" style="margin-top:2px"><span class="to">Streak: <span id="ht-st">0</span> days 🔥</span></div>
            <div class="tl" style="margin-top:6px"><span class="tp">$</span><span class="tcur"></span></div>
          </div>
          <div class="xprow">
            <div class="xpwrap"><div class="xpfill" id="hxp-bar" style="width:0%"></div></div>
            <span class="xplbl" id="hxp-lbl">0 / 200 XP</span>
          </div>
        </div>
        <div class="hstats">
          <div class="hstat"><div class="hval" id="hs-lv">1</div><div class="hlbl">Level</div></div>
          <div class="hstat"><div class="hval" id="hs-st" style="color:var(--yellow)">0</div><div class="hlbl">Streak</div></div>
          <div class="hstat"><div class="hval" id="hs-ls" style="color:var(--blue)">0</div><div class="hlbl">Done</div></div>
        </div>
      </div>
      <div class="sec-lbl">quick access</div>
      <div class="agrid">
        <div class="acard" onclick="goTab('lessons')">
          <div class="aicon ig">📚</div><div class="atitle">Continue Learning</div><div class="adesc">Pick up where you left off</div>
        </div>
        <div class="acard" onclick="goTab('daily')">
          <div class="aicon iy">🎯</div><div class="atitle">Daily Challenge</div><div class="adesc">Earn bonus XP every day</div>
        </div>
        <div class="acard" onclick="doOpenGames()">
          <div class="aicon ip">🎮</div><div class="atitle">Vim Games</div><div class="adesc">4 interactive games to play</div>
        </div>
        <div class="acard" onclick="doOpenPlayground()">
          <div class="aicon ib">🧪</div><div class="atitle">Playground</div><div class="adesc">Practice commands freely</div>
        </div>
        <div class="acard" onclick="goTab('cheatsheet')">
          <div class="aicon ic">📋</div><div class="atitle">Cheat Sheet</div><div class="adesc">100+ commands reference</div>
        </div>
        <div class="acard" onclick="goTab('progress')">
          <div class="aicon ir">🏆</div><div class="atitle">Progress</div><div class="adesc">Badges, stats, levels</div>
        </div>
      </div>
      <div class="sec-lbl">recent chapters</div>
      <div id="home-chs"></div>
    </div>
  </div>

  <!-- LESSONS -->
  <div class="page" id="page-lessons">
    <div class="pcontent">
      <div id="llist-view">
        <div class="sec-lbl">all chapters</div>
        <div id="all-chs"></div>
      </div>
      <div id="ldetail-view" class="ldetail">
        <button class="backbtn" onclick="backToList()">← back to lessons</button>
        <div id="dl-theory" class="theory"></div>
        <div id="dl-quiz" class="qcard"></div>
      </div>
    </div>
  </div>

  <!-- CHEATSHEET -->
  <div class="page" id="page-cheatsheet">
    <div class="pcontent">
      <div class="sec-lbl">vim command reference</div>
      <div class="csgrid" id="cs-grid"></div>
    </div>
  </div>

  <!-- DAILY -->
  <div class="page" id="page-daily">
    <div class="pcontent">
      <div class="sec-lbl">daily challenges</div>
      <div id="daily-list"></div>
    </div>
  </div>

  <!-- PROGRESS -->
  <div class="page" id="page-progress">
    <div class="pcontent">
      <div class="sec-lbl">level &amp; stats</div>
      <div class="pgrid2">
        <div class="pgcard">
          <div class="pgctitle">// current level</div>
          <div class="lv-big" id="pg-lv">1</div>
          <div class="lv-sub" id="pg-ltitle">Vim Newbie</div>
          <div style="margin-top:14px">
            <div class="xpwrap" style="height:5px"><div class="xpfill" id="pg-xpbar" style="width:0%"></div></div>
            <div style="font-size:10px;color:var(--text3);font-family:var(--mono);margin-top:5px" id="pg-xplbl"></div>
          </div>
        </div>
        <div class="pgcard">
          <div class="pgctitle">// statistics</div>
          <div id="pg-stats"></div>
        </div>
      </div>
      <div class="sec-lbl">badges</div>
      <div class="bgrid" id="pg-badges"></div>
    </div>
  </div>
</div>

<!-- STATUSLINE -->
<div class="statusline">
  <div class="slseg sldark" id="sl-mode">NORMAL</div>
  <div class="slseg">VimMaster</div>
  <div class="slseg slmid" id="sl-file">home.vim</div>
  <div class="slseg slr sldark" id="sl-pos">Lv.1 | 0 XP</div>
</div>

<div class="toasts" id="toasts"></div>

<script>
(function() {
  var vscode = acquireVsCodeApi();

  // ── DATA (embedded synchronously — no async race) ──
  var progress = ${PDATA};
  var LESSONS = ${LDATA};
  var CS = ${CDATA};
  var CHALLENGES = ${DDATA};
  var INITIAL_TAB = ${ITAB};

  var ALL_BADGES = [
    {id:'first_lesson', icon:'🎓', name:'First Steps', desc:'Complete 1 lesson'},
    {id:'five_lessons',  icon:'📚', name:'Quick Learner', desc:'Complete 5 lessons'},
    {id:'ten_lessons',   icon:'🏆', name:'Lesson Master', desc:'Complete 10 lessons'},
    {id:'streak_3',  icon:'🔥', name:'On Fire', desc:'3-day streak'},
    {id:'streak_7',  icon:'⚡', name:'Week Warrior', desc:'7-day streak'},
    {id:'streak_30', icon:'👑', name:'Vim Devotee', desc:'30-day streak'},
    {id:'level_5',  icon:'⭐', name:'Rising Star', desc:'Reach Level 5'},
    {id:'level_10', icon:'💫', name:'Vim Veteran', desc:'Reach Level 10'},
    {id:'level_20', icon:'🌟', name:'Vim Master', desc:'Reach Level 20'},
    {id:'xp_1000',  icon:'💰', name:'XP Hunter', desc:'Earn 1000 XP'},
    {id:'commands_100', icon:'⌨️', name:'Type-o-matic', desc:'100 commands typed'},
    {id:'game_win', icon:'🎮', name:'Gamer', desc:'Score in a game'},
  ];

  // ── XP HELPERS ── (fixed: level 1 starts at 0 XP)
  function xpStart(l) { return l <= 1 ? 0 : (l-1) * (l-1) * 200; }
  function xpEnd(l)   { return l * l * 200; }

  function levelTitle(l) {
    if (l < 3)  return 'Vim Newbie';
    if (l < 6)  return 'Insert Mode Survivor';
    if (l < 10) return 'Normal Mode Ninja';
    if (l < 15) return 'Macro Maestro';
    if (l < 20) return 'Regex Warrior';
    return 'Vim Grand Master';
  }

  function xpPct() {
    var l = progress.level || 1;
    var s = xpStart(l), e = xpEnd(l);
    var span = e - s; if (span <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((progress.xp - s) / span * 100)));
  }

  function xpLabel() {
    var l = progress.level || 1;
    var s = xpStart(l), e = xpEnd(l);
    return (progress.xp - s) + ' / ' + (e - s) + ' XP to Lv.' + (l + 1);
  }

  // ── NAV UPDATE ──
  function updateNav() {
    var l = progress.level || 1;
    setText('nb-xp', progress.xp + ' XP');
    setText('nb-level', 'Lv.' + l);
    setText('nb-streak', '🔥 ' + (progress.streak || 0));
    setText('sl-pos', 'Lv.' + l + ' | ' + progress.xp + ' XP');
    setText('sl-mode', 'NORMAL');
  }

  function setText(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }
  function setHtml(id, val) { var e = document.getElementById(id); if (e) e.innerHTML = val; }

  // ── TAB SWITCHING ──
  var currentTab = 'home';

  // function goTab(name, btn) {
  //   currentTab = name;
  //   document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  //   document.querySelectorAll('.ntab').forEach(function(t) { t.classList.remove('active'); });
  //   var pg = document.getElementById('page-' + name);
  //   if (pg) pg.classList.add('active');
  //   if (btn) {
  //     btn.classList.add('active');
  //   } else {
  //     var tabs = document.querySelectorAll('.ntab');
  //     var map = {home:0, lessons:1, cheatsheet:2, daily:3, progress:4};
  //     if (map[name] !== undefined && tabs[map[name]]) tabs[map[name]].classList.add('active');
  //   }
  //   setText('sl-file', name + '.vim');
  //   renderTab(name);
  // }

  function goTab(name, btn) {
  currentTab = name;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ntab').forEach(t => t.classList.remove('active'));

  var pg = document.getElementById('page-' + name);
  if (pg) pg.classList.add('active');

  var tabs = document.querySelectorAll('.ntab');
  var map = {home:0, lessons:1, cheatsheet:2, daily:3, progress:4};
  if (map[name] !== undefined && tabs[map[name]]) {
    tabs[map[name]].classList.add('active');
  }

  setText('sl-file', name + '.vim');

  renderTab(name);
}

  // make goTab global so onclick="goTab(...)" works
  window.goTab = goTab;

  function renderTab(name) {
    if (name === 'home') renderHome();
    else if (name === 'lessons') renderLessons();
    else if (name === 'cheatsheet') renderCS();
    else if (name === 'daily') renderDaily();
    else if (name === 'progress') renderProgress();
  }

  // ── HOME ──
  function renderHome() {
    var l = progress.level || 1;
    var done = (progress.completedLessons || []).length;
    setText('ht-lv', l); setText('ht-xp', progress.xp); setText('ht-ls', done); setText('ht-st', progress.streak || 0);
    setText('hs-lv', l); setText('hs-st', progress.streak || 0); setText('hs-ls', done);
    var bar = document.getElementById('hxp-bar'); if (bar) bar.style.width = xpPct() + '%';
    setText('hxp-lbl', xpLabel());
    setHtml('home-chs', LESSONS.chapters.slice(0,3).map(chapterHTML).join(''));
  }

  // ── LESSONS ──
  function renderLessons() {
    backToList();
    setHtml('all-chs', LESSONS.chapters.map(chapterHTML).join(''));
  }

  function chapterHTML(ch) {
    var total = ch.lessons.length;
    var done = ch.lessons.filter(function(l) { return (progress.completedLessons||[]).indexOf(l.id) >= 0; }).length;
    var pct = total ? Math.round(done/total*100) : 0;
    return '<div class="chblock" id="ch-' + ch.id + '">' +
      '<div class="chhdr" onclick="toggleCh(\'' + ch.id + '\')">' +
        '<div class="chico" style="background:' + ch.color + '22;border:1px solid ' + ch.color + '44">' + ch.icon + '</div>' +
        '<div class="chtitle">' + ch.title + '</div>' +
        '<span class="chmeta">' + done + '/' + total + '</span>' +
        '<span class="chev">▶</span>' +
      '</div>' +
      '<div class="chbar"><div class="chbar-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="llist">' + ch.lessons.map(lessonRowHTML).join('') + '</div>' +
    '</div>';
  }

  function lessonRowHTML(l) {
    var done = (progress.completedLessons||[]).indexOf(l.id) >= 0;
    var dc = l.difficulty === 'Beginner' ? 'tbeg' : l.difficulty === 'Intermediate' ? 'tint' : 'tadv';
    return '<div class="lrow" onclick="openLesson(\'' + l.id + '\')">' +
      '<div class="ldot' + (done?' done':'') + '">' + (done?'✓':'') + '</div>' +
      '<span class="ltxt">' + l.title + '</span>' +
      '<div class="ltags">' +
        '<span class="tag ' + dc + '">' + l.difficulty + '</span>' +
        '<span class="tag txp">+' + l.xp + ' XP</span>' +
      '</div>' +
    '</div>';
  }

  window.toggleCh = function(id) {
    var el = document.getElementById('ch-' + id);
    if (el) el.classList.toggle('open');
  };

  // ── LESSON DETAIL ──
  var curLesson = null;
  var qAnswered = [];

  window.openLesson = function(lid) {
    var found = null;
    for (var i = 0; i < LESSONS.chapters.length; i++) {
      for (var j = 0; j < LESSONS.chapters[i].lessons.length; j++) {
        if (LESSONS.chapters[i].lessons[j].id === lid) { found = LESSONS.chapters[i].lessons[j]; break; }
      }
      if (found) break;
    }
    if (!found) return;
    curLesson = found; qAnswered = [];

    document.getElementById('llist-view').style.display = 'none';
    document.getElementById('ldetail-view').classList.add('show');
    setHtml('dl-theory', '<h1>' + found.title + '</h1>' + md(found.theory));

    var qh = '<div class="qhdr">quiz — ' + found.quiz.length + ' questions</div>';
    found.quiz.forEach(function(q, i) {
      qh += '<div class="qqblock" id="qq-' + i + '">' +
        '<div class="qqnum">// question ' + (i+1) + ' of ' + found.quiz.length + '</div>' +
        '<div class="qqtxt">' + q.question + '</div>' +
        q.options.map(function(opt, oi) {
          return '<div class="qopt" onclick="ansQ(' + i + ',' + oi + ',' + q.answer + ')" id="qo-' + i + '-' + oi + '">' +
            '<span class="qkey">' + String.fromCharCode(65+oi) + '</span>' + opt + '</div>';
        }).join('') +
        '<div class="qexp" id="qe-' + i + '">' + q.explanation + '</div>' +
      '</div>';
    });
    qh += '<button class="donebtn" id="donebtn" disabled onclick="doComplete()">$ commit lesson — earn ' + found.xp + ' XP</button>';
    setHtml('dl-quiz', qh);
  };

  window.ansQ = function(qi, oi, correct) {
    if (qAnswered.indexOf(qi) >= 0) return;
    qAnswered.push(qi);
    document.querySelectorAll('[id^="qo-' + qi + '-"]').forEach(function(o, i) {
      if (i === correct) o.classList.add('correct');
      else if (i === oi && oi !== correct) o.classList.add('wrong');
      o.style.pointerEvents = 'none';
    });
    var exp = document.getElementById('qe-' + qi); if (exp) exp.classList.add('show');
    if (curLesson && qAnswered.length === curLesson.quiz.length) {
      var btn = document.getElementById('donebtn'); if (btn) btn.disabled = false;
    }
  };

  window.doComplete = function() {
    if (!curLesson) return;
    vscode.postMessage({ command: 'completeLesson', lessonId: curLesson.id });
    var btn = document.getElementById('donebtn');
    if (btn) { btn.textContent = '✓ committed'; btn.disabled = true; }
    showToast('+' + curLesson.xp + ' XP — lesson done!', 'xp');
    if ((progress.completedLessons||[]).indexOf(curLesson.id) < 0) {
      progress.completedLessons = progress.completedLessons || [];
      progress.completedLessons.push(curLesson.id);
      progress.xp += curLesson.xp;
      updateNav();
    }
  };

  window.backToList = function() {
    document.getElementById('llist-view').style.display = 'block';
    document.getElementById('ldetail-view').classList.remove('show');
    curLesson = null;
  };

  // ── CHEAT SHEET ──
  function renderCS() {
    setHtml('cs-grid', CS.categories.map(function(cat) {
      return '<div class="cscard">' +
        '<div class="cshdr" style="color:' + cat.color + '">' +
          '<span style="width:7px;height:7px;border-radius:50%;background:' + cat.color + ';display:inline-block"></span>' + cat.name +
        '</div>' +
        cat.commands.map(function(c) {
          var keys = c.keys.split(' / ').map(function(k){ return '<kbd>' + k + '</kbd>'; }).join(' ');
          return '<div class="csrow"><div class="cskeys">' + keys + '</div><div class="csdesc">' + c.desc + '</div></div>';
        }).join('') +
      '</div>';
    }).join(''));
  }

  // ── DAILY ──
  function renderDaily() {
    setHtml('daily-list', CHALLENGES.map(function(ch, i) {
      var dc = ch.difficulty === 'Beginner' ? 'tbeg' : ch.difficulty === 'Intermediate' ? 'tint' : 'tadv';
      return '<div class="dccard">' +
        '<div class="dctitle">' + ch.title + '</div>' +
        '<div class="dcdesc">' + ch.description + '</div>' +
        '<div class="dchint" id="dch-' + i + '">// ' + ch.hint + '</div>' +
        '<div class="dcmeta">' +
          '<span class="tag ' + dc + '">' + ch.difficulty + '</span>' +
          '<span class="tag txp">+' + ch.xp + ' XP</span>' +
          '<button class="btn btn-gh" onclick="toggleHint(' + i + ')">$ hint</button>' +
          '<button class="btn btn-g" style="margin-left:auto" onclick="claimXP(' + ch.xp + ',\'' + ch.title.replace(/'/g, "\\'") + '\')">claim XP ⚡</button>' +
        '</div>' +
      '</div>';
    }).join(''));
  }

  window.toggleHint = function(i) {
    var e = document.getElementById('dch-' + i); if (e) e.classList.toggle('show');
  };

  window.claimXP = function(amt, reason) {
    vscode.postMessage({ command: 'addXP', amount: amt, reason: reason });
  
    updateNav();
    showToast('+' + amt + ' XP — ' + reason, 'xp');
  };

  // ── PROGRESS ──
  function renderProgress() {
    var l = progress.level || 1;
    var pct = xpPct();
    var total = LESSONS.chapters.reduce(function(a,c){ return a+c.lessons.length; }, 0);
    var done = (progress.completedLessons||[]).length;

    setText('pg-lv', l);
    setText('pg-ltitle', levelTitle(l));
    var bar = document.getElementById('pg-xpbar'); if (bar) bar.style.width = pct + '%';
    setText('pg-xplbl', xpLabel());

    setHtml('pg-stats',
      srow('Total XP', progress.xp) +
      srow('Current Level', l) +
      srow('Day Streak', (progress.streak||0) + ' 🔥') +
      srow('Lessons Done', done + ' / ' + total) +
      srow('Badges', (progress.badges||[]).length + ' / ' + ALL_BADGES.length)
    );

    setHtml('pg-badges', ALL_BADGES.map(function(b) {
      var earned = (progress.badges||[]).indexOf(b.id) >= 0;
      return '<div class="bcard ' + (earned?'earned':'locked') + '">' +
        '<div class="bico">' + b.icon + '</div>' +
        '<div class="bname">' + b.name + '</div>' +
        '<div class="bdesc">' + b.desc + '</div>' +
        (earned ? '<div class="bel">// earned ✓</div>' : '') +
      '</div>';
    }).join(''));
  }

  function srow(l, v) {
    return '<div class="statrow"><span class="stlbl">' + l + '</span><span class="stval">' + v + '</span></div>';
  }

  // ── EXTERNAL PANEL OPENERS ──
  window.doOpenGames = function() { vscode.postMessage({ command: 'openGames' }); };
  window.doOpenPlayground = function() { vscode.postMessage({ command: 'openPlayground' }); };

  // ── TOAST ──
  function showToast(msg, type) {
    var c = document.getElementById('toasts');
    var t = document.createElement('div');
    t.className = 'toast toast-' + (type||'info');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function() {
      t.style.opacity = '0'; t.style.transition = 'opacity .3s';
      setTimeout(function(){ t.remove(); }, 300);
    }, 2800);
  }

  // ── MARKDOWN ──
  function md(s) {
    if (!s) return '';
    return s
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\`\`\`[\w]*\n([\s\S]*?)\`\`\`/g, '<pre>$1</pre>')
      .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/^\|(.+)\|$/gm, function(row) {
        var cells = row.split('|').slice(1,-1);
        if (cells.every(function(c){ return /^[-\s:]+$/.test(c.trim()); })) return '';
        return '<tr>' + cells.map(function(c){ return '<td>' + c.trim() + '</td>'; }).join('') + '</tr>';
      })
      .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, '<table>$&</table>')
      .replace(/\n\n/g, '<br>');
  }

  // ── MESSAGE HANDLER (for progress updates after actions) ──
  // window.addEventListener('message', function(e) {
  //   var msg = e.data;
  //   if (msg.command === 'progress' && msg.data) {
  //     progress = msg.data;
  //     updateNav();
  //     renderTab(currentTab);
  //   } else if (msg.command === 'reload') {
  //     if (msg.progress) progress = msg.progress;
  //     updateNav();
  //     goTab(msg.tab || 'home');
  //   }
  // });


  window.addEventListener('message', function(e) {
  var msg = e.data;

  // if (msg.command === 'progress' && msg.data) {
  //   progress = msg.data;
  //   updateNav();
  //   renderTab(currentTab);
  // }

  if (msg.command === 'progress' && msg.data) {
  progress = msg.data;

  updateNav();

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + currentTab)?.classList.add('active');

  renderTab(currentTab);
}
  else if (msg.command === 'reload') {
    progress = msg.progress || progress;

    currentTab = msg.tab || 'home';

    // 🔥 HARD RESET UI STATE
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.ntab').forEach(t => t.classList.remove('active'));

    goTab(currentTab);
  }
});
});

  // ── INIT ──
  updateNav();
  renderHome();

  // Switch to initial tab if not home
  if (INITIAL_TAB && INITIAL_TAB !== 'home') {
    goTab(INITIAL_TAB);
  }

})(); // IIFE — no global leaks
</script>
</body>
</html>`;
  }
}

module.exports = { DashboardPanel };
