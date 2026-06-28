const vscode = require("vscode");
const _panels = new Map();

function getCheatsheetPanel(context, providers) {
  if (_panels.has("cs")) {
    try { _panels.get("cs").reveal(vscode.ViewColumn.One); return; } catch(_) {}
  }
  const panel = vscode.window.createWebviewPanel(
    "vimquestCS", "📋 VimQuest — Cheat Sheet",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [] }
  );
  _panels.set("cs", panel);
  panel.onDidDispose(() => _panels.delete("cs"));
  panel.webview.html = buildHTML();
  panel.webview.onDidReceiveMessage(msg => {
    if (msg.command === "goHome") {
      const { getWelcomePanel } = require('./welcome');
      panel.dispose(); getWelcomePanel(context, providers);
    }
  });
}

function buildHTML() {
  const sections = [
    { title: "🧭 Navigation", color: "#06b6d4", items: [
      ["h j k l","Move left / down / up / right"],
      ["w / b / e","Next word / prev word / end of word"],
      ["W / B / E","Same but WORD (space-delimited)"],
      ["0 / ^ / $","Line start / first non-blank / line end"],
      ["gg / G","Top / bottom of file"],
      ["{n}G","Go to line n"],
      ["Ctrl+f / Ctrl+b","Page down / page up"],
      ["Ctrl+d / Ctrl+u","Half page down / up"],
      ["% ","Jump to matching bracket"],
      ["{ / }","Prev / next blank line (paragraph)"],
    ]},
    { title: "✏️ Insert Mode", color: "#a855f7", items: [
      ["i / a","Insert before / append after cursor"],
      ["I / A","Insert at line start / end"],
      ["o / O","New line below / above"],
      ["Esc / Ctrl+[","Return to Normal mode"],
      ["Ctrl+w","Delete word backwards (in insert)"],
    ]},
    { title: "✂️ Editing", color: "#f59e0b", items: [
      ["x / X","Delete char under / before cursor"],
      ["d{motion}","Delete — e.g. dw dd d$ d0"],
      ["c{motion}","Change — delete + enter insert"],
      ["y{motion}","Yank (copy) — e.g. yy y$ yw"],
      ["p / P","Paste after / before cursor"],
      ["dd / yy / cc","Delete / yank / change whole line"],
      ["D / C","Delete / change to end of line"],
      ["J","Join line with next"],
      ["~ ","Toggle case of character"],
      [">> / <<","Indent / unindent line"],
      ["u / Ctrl+r","Undo / redo"],
      [". ","Repeat last change (powerful!)"],
    ]},
    { title: "🎯 Text Objects", color: "#22c55e", items: [
      ["iw / aw","Inner word / around word"],
      ['i" / a"',"Inner / around double quotes"],
      ["i( / a(","Inner / around parentheses"],
      ["i[ / a[","Inner / around brackets"],
      ["i{ / a{","Inner / around braces"],
      ["ip / ap","Inner / around paragraph"],
      ["it / at","Inner / around HTML tag"],
    ]},
    { title: "👁️ Visual Mode", color: "#f87171", items: [
      ["v","Visual character mode"],
      ["V","Visual line mode"],
      ["Ctrl+v","Visual block mode"],
      ["gv","Re-select last selection"],
      ["o","Move to other end of selection"],
      ["After selecting:","d y c > < ~ ="],
    ]},
    { title: "🔍 Search & Replace", color: "#e879f9", items: [
      ["/{pattern}","Search forward"],
      ["?{pattern}","Search backward"],
      ["n / N","Next / previous match"],
      ["* / #","Search word under cursor fwd / bwd"],
      [":s/old/new/g","Replace on current line"],
      [":%s/old/new/g","Replace in whole file"],
      [":%s/old/new/gc","Replace with confirmation"],
    ]},
    { title: "📌 Marks & Jumps", color: "#06b6d4", items: [
      ["m{a-z}","Set local mark"],
      ["M{A-Z}","Set global mark (across files)"],
      ["'{a} / `{a}","Jump to mark line / exact pos"],
      ["''","Jump back to previous position"],
      ["Ctrl+o / Ctrl+i","Jump list back / forward"],
    ]},
    { title: "📋 Registers", color: "#a855f7", items: [
      ['""{y/p}','Default register (last d/y)'],
      ['"0{y/p}',"Yank register (yank only)"],
      ['"+{y/p}',"System clipboard"],
      ["\u0022a-z{y/p}","Named registers a through z"],
      [":reg","Show all registers"],
    ]},
    { title: "🤖 Macros", color: "#f59e0b", items: [
      ["q{a}","Start recording macro into a"],
      ["q","Stop recording"],
      ["@{a}","Play macro a"],
      ["@@","Replay last macro"],
      ["{n}@{a}","Play macro n times"],
    ]},
    { title: "🪟 Windows & Tabs", color: "#22c55e", items: [
      [":sp / :vsp","Horizontal / vertical split"],
      ["Ctrl+w h/j/k/l","Navigate splits"],
      ["Ctrl+w =","Equalize split sizes"],
      [":tabnew","New tab"],
      ["gt / gT","Next / previous tab"],
      [":tabclose","Close tab"],
    ]},
    { title: "💾 File Commands", color: "#f87171", items: [
      [":w","Write (save)"],
      [":q","Quit"],
      [":wq / ZZ","Save and quit"],
      [":q!","Quit without saving"],
      [":e {file}","Open file"],
      [":bn / :bp","Next / previous buffer"],
      [":ls","List buffers"],
    ]},
    { title: "⚙️ Useful Combos", color: "#e879f9", items: [
      ["ci\"","Change inside quotes"],
      ["da(","Delete around parentheses"],
      ["yip","Yank inner paragraph"],
      ["vit","Visual select inside HTML tag"],
      ["ggVG","Select entire file"],
      [":%y+","Copy entire file to clipboard"],
      ["ea","Append at end of word"],
      ["xp","Swap two characters"],
      [">G","Indent to end of file"],
    ]},
  ];

  const secHTML = sections.map(s => `
    <div class="cs-section">
      <div class="cs-sec-title" style="border-left-color:${s.color};color:${s.color}">${s.title}</div>
      <div class="cs-grid">
        ${s.items.map(([k,d]) => `
          <div class="cs-row">
            <kbd class="cs-key">${esc(k)}</kbd>
            <span class="cs-desc">${esc(d)}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');

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
  --code:var(--vscode-textCodeBlock-background,#0d0d1a);
  --mono:'Cascadia Code','Fira Code',Consolas,monospace;--r:10px;
}
body{background:var(--bg);color:var(--fg);font-family:var(--vscode-font-family,sans-serif);font-size:13px;min-height:100vh}
.nav{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--border);background:var(--card);position:sticky;top:0;z-index:20}
.logo{font-size:17px;font-weight:900;background:linear-gradient(135deg,#86efac,#22c55e,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;cursor:pointer}
.nav-right{display:flex;gap:10px;align-items:center}
.nav-btn{background:none;border:1px solid var(--border);border-radius:7px;color:var(--fg);font-size:12px;padding:5px 12px;cursor:pointer}
.nav-btn:hover{border-color:var(--a2,#06b6d4);color:var(--a2,#06b6d4)}
.search-wrap{position:relative}
.search{padding:6px 12px 6px 30px;background:var(--code);border:1px solid var(--border);border-radius:7px;color:var(--fg);font-size:12px;outline:none;width:180px}
.search:focus{border-color:#22c55e}
.search-icon{position:absolute;left:9px;top:50%;transform:translateY(-50%);opacity:.5;font-size:13px}

.layout{max-width:900px;margin:0 auto;padding:24px 20px 60px}
.page-title{font-size:22px;font-weight:900;letter-spacing:-.5px;margin-bottom:4px}
.page-sub{font-size:12px;opacity:.55;margin-bottom:22px}

.sections-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
.cs-section{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:16px}
.cs-sec-title{font-size:13px;font-weight:800;margin-bottom:12px;padding-left:10px;border-left:3px solid;letter-spacing:.2px}
.cs-grid{display:flex;flex-direction:column;gap:5px}
.cs-row{display:flex;align-items:center;gap:10px;padding:4px 6px;border-radius:6px;transition:background .12s}
.cs-row:hover{background:rgba(255,255,255,.04)}
.cs-row.hidden{display:none}
.cs-key{font-family:var(--mono);font-size:11px;padding:3px 8px;border-radius:5px;background:var(--code);border:1px solid var(--border);color:#e879f9;white-space:nowrap;font-weight:700;flex-shrink:0;min-width:90px;text-align:center}
.cs-desc{font-size:12px;opacity:.8;line-height:1.4}
</style>
</head>
<body>
<div class="nav">
  <span class="logo" onclick="goHome()">📗 VimQuest</span>
  <div class="nav-right">
    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input class="search" id="search" type="text" placeholder="Filter commands…" oninput="filterCS(this.value)">
    </div>
    <button class="nav-btn" onclick="goHome()">← Dashboard</button>
  </div>
</div>

<div class="layout">
  <div class="page-title">📋 Vim Cheat Sheet</div>
  <div class="page-sub">Every command you need — all in one place. Use the search to filter.</div>
  <div class="sections-grid" id="sg">${secHTML}</div>
</div>

<script>
const vscode = acquireVsCodeApi();
function goHome(){ vscode.postMessage({command:'goHome'}); }

function filterCS(q) {
  q = q.toLowerCase().trim();
  document.querySelectorAll('.cs-row').forEach(row => {
    if (!q) { row.classList.remove('hidden'); return; }
    const text = row.textContent.toLowerCase();
    row.classList.toggle('hidden', !text.includes(q));
  });
  // Hide empty sections
  document.querySelectorAll('.cs-section').forEach(sec => {
    const visible = [...sec.querySelectorAll('.cs-row')].some(r => !r.classList.contains('hidden'));
    sec.style.display = visible ? '' : 'none';
  });
}
</script>
</body>
</html>`;
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
module.exports = { getCheatsheetPanel };
