const vscode = require("vscode");
const _panels = new Map();

// Pool of daily challenges — deterministic per calendar date
const CHALLENGES = [
  { title:"The Dot Warrior", desc:"Use the <code>.</code> command to repeat an action 5 times in a row.", task:"Open a file, add a semicolon to the end of a line with <kbd>A;</kbd> then <kbd>Esc</kbd>. Now press <kbd>j.</kbd> five times to add it to 5 more lines.", bonus:"Do it in under 10 keystrokes total!", cmd:".", xp:50 },
  { title:"Word Jumper", desc:"Navigate an entire paragraph using only <code>w</code>, <code>b</code>, and <code>e</code> — no arrow keys!", task:"Open any file. Move from the start of a paragraph to the end using only word-jump keys. Count your keypresses!", bonus:"Can you do it in fewer than 20 keystrokes?", cmd:"w b e", xp:40 },
  { title:"Macro Magician", desc:"Record a macro and run it 10 times.", task:"Record a macro with <kbd>qa</kbd> that adds '// ' at the start of a line and moves to the next. Run it 10 times with <kbd>10@a</kbd>.", bonus:"Make it work perfectly on 10 consecutive lines!", cmd:"qa @a", xp:75 },
  { title:"Visual Block Master", desc:"Use <code>Ctrl+v</code> block visual to edit a column of text.", task:"Open a file with multiple lines. Use <kbd>Ctrl+v</kbd> to select the first character of 5 lines, then press <kbd>I</kbd>, type a character, and <kbd>Esc</kbd>.", bonus:"Add a tab indent to 10 lines at once!", cmd:"Ctrl+v I", xp:60 },
  { title:"Text Object Ninja", desc:"Use text objects to edit inside brackets, quotes, and tags.", task:"Practice: <kbd>ci\"</kbd> to change inside quotes, <kbd>di(</kbd> to delete inside parens, <kbd>vit</kbd> to select inside HTML tag.", bonus:"Do all three without touching arrow keys!", cmd:"ci\" di( vit", xp:65 },
  { title:"Search & Destroy", desc:"Use <code>*</code> and <code>.</code> to find and replace words fast.", task:"Find a repeated word in a file using <kbd>*</kbd>. Change it with <kbd>cw</kbd> + new word + <kbd>Esc</kbd>. Now use <kbd>n.</kbd> to replace each other occurrence.", bonus:"Replace 5 occurrences in under 15 keystrokes!", cmd:"* cw n .", xp:55 },
  { title:"Mark & Return", desc:"Set marks and teleport around a large file.", task:"In a long file, set mark <kbd>ma</kbd> at the top and <kbd>mb</kbd> at the bottom. Jump between them with <kbd>'a</kbd> and <kbd>'b</kbd>.", bonus:"Set 3 marks and navigate all three from memory!", cmd:"ma 'a mb 'b", xp:45 },
  { title:"Register Juggler", desc:"Use named registers to store and paste multiple things.", task:"Yank three different lines into registers a, b, c with <kbd>\"ayy</kbd> <kbd>\"byy</kbd> <kbd>\"cyy</kbd>. Paste them in reverse order.", bonus:"Paste them all at once in different locations!", cmd:"\"ay \"bp", xp:70 },
  { title:"Split Speedster", desc:"Work with two files side by side using splits.", task:"Open a file and create a vertical split with <kbd>:vsp</kbd>. Navigate between splits with <kbd>Ctrl+w l</kbd> and <kbd>Ctrl+w h</kbd>. Copy a line from one split and paste it in the other.", bonus:"Open 3 splits and navigate between all of them!", cmd:":vsp Ctrl+w", xp:55 },
  { title:"The Undo Tree Explorer", desc:"Make changes and navigate backwards with undo.", task:"Make 5 different changes to a file. Now undo them all with <kbd>5u</kbd>. Redo them with <kbd>Ctrl+r</kbd> five times. Notice how each state is preserved!", bonus:"Make a branch: undo 3, make a new change, notice the new state!", cmd:"u Ctrl+r", xp:40 },
  { title:"Line Operations Pro", desc:"Master line-level operations in NORMAL mode.", task:"Practice: <kbd>dd</kbd> (delete line), <kbd>yy</kbd> + <kbd>p</kbd> (duplicate line), <kbd>J</kbd> (join with next), <kbd>>>  </kbd> and <kbd><<</kbd> (indent). Do each 5 times.", bonus:"Use <kbd>3dd</kbd> and <kbd>5>></kbd> to do batch operations!", cmd:"dd yy J >> <<", xp:50 },
  { title:"Global Replace", desc:"Use <code>:%s</code> to do a global find-and-replace.", task:"Open a file with a repeated word. Use <kbd>:%s/word/replacement/g</kbd> to replace all instances. Then use <kbd>:%s/word/replacement/gc</kbd> to do it with confirmation.", bonus:"Use a regex: <kbd>:%s/\\bword\\b/replacement/g</kbd>", cmd:":%s", xp:60 },
  { title:"The g Command", desc:"Use <code>g</code> prefixed commands for advanced moves.", task:"Practice: <kbd>gd</kbd> (go to definition), <kbd>gf</kbd> (go to file under cursor), <kbd>g~</kbd> (toggle case), <kbd>gu</kbd> (lowercase), <kbd>gU</kbd> (uppercase).", bonus:"Use <kbd>gUiw</kbd> to uppercase a whole word!", cmd:"gd gf g~ gU", xp:65 },
  { title:"Surround Simulation", desc:"Manually add surrounding characters using Vim motions.", task:"Select a word with <kbd>viw</kbd>. Then practice adding quotes manually: move to start (<kbd>bi</kbd>, type <kbd>\"</kbd>), move to end (<kbd>ea</kbd>, type <kbd>\"</kbd>).", bonus:"Do it for parens and brackets too!", cmd:"viw bi ea", xp:55 },
];

function getDailyPanel(context, providers) {
  if (_panels.has("daily")) {
    try { _panels.get("daily").reveal(vscode.ViewColumn.One); return; } catch(_) {}
  }
  const panel = vscode.window.createWebviewPanel(
    "vimquestDaily", "📅 VimQuest — Daily Challenge",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [] }
  );
  _panels.set("daily", panel);
  panel.onDidDispose(() => _panels.delete("daily"));

  // Pick today's challenge deterministically
  const today = new Date();
  const dayNum = Math.floor(today.getTime() / 86400000);
  const challenge = CHALLENGES[dayNum % CHALLENGES.length];
  const dateStr = today.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
  const todayStr = today.toDateString();
  const lastCompleted = context.globalState.get("vimquest.dailyCompleted", "");
  const alreadyDone = lastCompleted === todayStr;
  const streak = context.globalState.get("vimquest.streak", 0);

  panel.webview.html = buildHTML(challenge, dateStr, alreadyDone, streak);

  panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg.command === "complete") {
      if (!alreadyDone) {
        // Award XP
        const completed = context.globalState.get("vimquest.completed", []);
        const totalXP = context.globalState.get("vimquest.dailyXP", 0);
        await context.globalState.update("vimquest.dailyXP", totalXP + challenge.xp);
        // Streak
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const curStreak = context.globalState.get("vimquest.streak", 0);
        await context.globalState.update("vimquest.streak", lastCompleted === yesterday ? curStreak + 1 : 1);
        await context.globalState.update("vimquest.lastDay", todayStr);
        await context.globalState.update("vimquest.dailyCompleted", todayStr);
        providers.progress.refresh();
        vscode.window.showInformationMessage(`🔥 Daily Challenge complete! +${challenge.xp} XP!`);
      }
      panel.webview.html = buildHTML(challenge, dateStr, true, streak + 1);
    }
    if (msg.command === "openPractice") {
      const doc = await vscode.workspace.openTextDocument({
        content: buildPracticeText(challenge),
        language: "markdown"
      });
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }
    if (msg.command === "goHome") {
      const { getWelcomePanel } = require('./welcome');
      panel.dispose(); getWelcomePanel(context, providers);
    }
  });
}

function buildPracticeText(ch) {
  return [
    `# Daily Challenge: ${ch.title}`,
    `# ══════════════════════════════════════`,
    `# ${ch.desc.replace(/<[^>]+>/g,'')}`,
    ``,
    `# Task: ${ch.task.replace(/<[^>]+>/g,'')}`,
    `# Bonus: ${ch.bonus}`,
    ``,
    `# ── PRACTICE AREA ─────────────────────`,
    ``,
    `const hello = "world";`,
    `const foo = "bar";`,
    `const vim = "awesome";`,
    ``,
    `function example(name, age, city) {`,
    `  const greeting = "Hello " + name;`,
    `  return greeting;`,
    `}`,
    ``,
    `const items = ["one", "two", "three"];`,
    `items.forEach(item => console.log(item));`,
    ``,
    `// More practice lines below:`,
    `const a = 1;`,
    `const b = 2;`,
    `const c = 3;`,
    `const d = 4;`,
    `const e = 5;`,
    ``,
    `# ── END ────────────────────────────────`,
    `# Good luck, Vim warrior! ⚔️`,
  ].join("\n");
}

function buildHTML(ch, dateStr, done, streak) {
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
  --mono:'Cascadia Code','Fira Code',Consolas,monospace;--r:12px;
  --green:#22c55e;--yellow:#f59e0b;--accent:#7c3aed;--a2:#06b6d4;
}
body{background:var(--bg);color:var(--fg);font-family:var(--vscode-font-family,sans-serif);font-size:14px;min-height:100vh}
.nav{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--border);background:var(--card)}
.logo{font-size:17px;font-weight:900;background:linear-gradient(135deg,#86efac,#22c55e,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;cursor:pointer}
.nav-btn{background:none;border:1px solid var(--border);border-radius:7px;color:var(--fg);font-size:12px;padding:5px 12px;cursor:pointer}
.nav-btn:hover{border-color:var(--a2);color:var(--a2)}
.layout{max-width:680px;margin:0 auto;padding:32px 20px 60px}

/* DATE HEADER */
.date-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:10px}
.date-label{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--yellow);opacity:.8}
.streak-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:20px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);font-size:13px;font-weight:700;color:var(--yellow)}

/* CHALLENGE CARD */
.ch-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:20px}
.ch-header{padding:20px 24px;background:linear-gradient(135deg,rgba(34,197,94,.1),rgba(6,182,212,.07));border-bottom:1px solid var(--border)}
.ch-badge{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:var(--green);margin-bottom:8px;display:flex;align-items:center;gap:8px}
.ch-title{font-size:22px;font-weight:900;letter-spacing:-.3px;margin-bottom:6px}
.ch-desc{font-size:14px;opacity:.7;line-height:1.6}
.ch-desc code{font-family:var(--mono);font-size:12px;padding:1px 6px;border-radius:4px;background:var(--code);color:#e879f9}
.ch-body{padding:20px 24px}
.ch-section{margin-bottom:20px}
.ch-sec-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;opacity:.5;margin-bottom:8px}
.ch-task{font-size:14px;line-height:1.75;padding:14px 16px;background:var(--code);border-radius:8px;border-left:3px solid var(--green)}
.ch-task kbd{display:inline-block;font-family:var(--mono);font-size:11px;padding:2px 7px;border-radius:5px;background:rgba(124,58,237,.25);border:1px solid rgba(124,58,237,.4);color:#c4b5fd;font-weight:700}
.ch-task code{font-family:var(--mono);color:#e879f9}
.bonus-box{padding:12px 16px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:8px;font-size:13px;line-height:1.6}
.bonus-box strong{color:var(--yellow)}
.xp-box{display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:8px}
.xp-num{font-size:24px;font-weight:900;color:var(--green)}
.xp-label{font-size:13px;opacity:.7}
.cmds-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:6px}
.cmd-pill{font-family:var(--mono);font-size:12px;padding:4px 10px;border-radius:6px;background:var(--code);border:1px solid var(--border);color:#e879f9;font-weight:700}

/* ACTIONS */
.actions{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:7px;padding:10px 22px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .15s}
.btn:hover{transform:translateY(-1px)}
.btn-green{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;box-shadow:0 4px 14px rgba(34,197,94,.3)}
.btn-green:hover{box-shadow:0 6px 20px rgba(34,197,94,.4)}
.btn-outline{background:transparent;color:var(--fg);border:1px solid var(--border)}
.btn-outline:hover{border-color:var(--a2);color:var(--a2)}
.done-banner{display:flex;align-items:center;gap:10px;padding:14px 18px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:10px;margin-bottom:18px}
.done-icon{font-size:24px}
.done-text{font-size:14px;font-weight:700;color:var(--green)}
.done-sub{font-size:12px;opacity:.6}
</style>
</head>
<body>
<div class="nav">
  <span class="logo" onclick="goHome()">📗 VimQuest</span>
  <button class="nav-btn" onclick="goHome()">← Dashboard</button>
</div>

<div class="layout">
  <div class="date-row">
    <div>
      <div class="date-label">📅 Daily Challenge</div>
      <div style="font-size:15px;font-weight:700;opacity:.8;margin-top:3px">${esc(dateStr)}</div>
    </div>
    <div class="streak-pill">🔥 ${streak} day streak</div>
  </div>

  ${done ? `<div class="done-banner"><div class="done-icon">✅</div><div><div class="done-text">Challenge Complete!</div><div class="done-sub">Come back tomorrow for a new challenge. Keep the streak alive!</div></div></div>` : ''}

  <div class="ch-card">
    <div class="ch-header">
      <div class="ch-badge">⚔️ Today's Challenge <span style="opacity:.5;font-weight:600">•</span> +${ch.xp} XP</div>
      <div class="ch-title">${esc(ch.title)}</div>
      <div class="ch-desc">${ch.desc}</div>
    </div>

    <div class="ch-body">
      <div class="ch-section">
        <div class="ch-sec-label">📋 Task</div>
        <div class="ch-task">${ch.task}</div>
      </div>

      <div class="ch-section">
        <div class="ch-sec-label">⭐ Bonus Goal</div>
        <div class="bonus-box"><strong>Bonus:</strong> ${esc(ch.bonus)}</div>
      </div>

      <div class="ch-section" style="display:flex;gap:14px;flex-wrap:wrap">
        <div style="flex:1;min-width:160px">
          <div class="ch-sec-label">🔑 Key Commands</div>
          <div class="cmds-row">${ch.cmd.split(' ').map(c=>`<span class="cmd-pill">${esc(c)}</span>`).join('')}</div>
        </div>
        <div class="xp-box" style="flex-shrink:0">
          <div class="xp-num">+${ch.xp}</div>
          <div class="xp-label">XP reward<br>for completion</div>
        </div>
      </div>
    </div>
  </div>

  <div class="actions">
    <button class="btn btn-outline" onclick="practice()">📝 Open Practice File</button>
    ${!done ? `<button class="btn btn-green" onclick="complete()">✅ Mark Complete +${ch.xp} XP</button>` : `<button class="btn btn-green" style="opacity:.6;cursor:default">✅ Already Done Today</button>`}
  </div>
</div>

<script>
const vscode = acquireVsCodeApi();
function complete()  { vscode.postMessage({command:'complete'}); }
function practice()  { vscode.postMessage({command:'openPractice'}); }
function goHome()    { vscode.postMessage({command:'goHome'}); }
</script>
</body>
</html>`;
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
module.exports = { getDailyPanel };
