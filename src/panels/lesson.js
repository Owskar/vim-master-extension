const vscode = require("vscode");
const { LESSONS } = require('../lessons');
const { getRank }  = require('../sidebar');

// Active panels map — one panel per lesson, reuse if already open
const _panels = new Map();

function getLessonPanel(context, lessonId, providers) {
  // Reuse existing panel for this lesson if open
  if (_panels.has(lessonId)) {
    try { _panels.get(lessonId).reveal(vscode.ViewColumn.One); return; } catch (_) {}
  }

  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (!lesson) {
    vscode.window.showErrorMessage(`VimQuest: Lesson "${lessonId}" not found.`);
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    "vimquestLesson",
    `📖 ${lesson.title}`,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [],
    }
  );

  _panels.set(lessonId, panel);
  panel.onDidDispose(() => _panels.delete(lessonId));

  const completed  = context.globalState.get("vimquest.completed", []);
  const totalXP    = LESSONS.filter((l) => completed.includes(l.id)).reduce((s, l) => s + l.xp, 0);
  const lessonIdx  = LESSONS.findIndex((l) => l.id === lessonId);
  const nextLesson = LESSONS[lessonIdx + 1] || null;
  const isCompleted = completed.includes(lessonId);

  panel.webview.html = buildLessonHTML(lesson, isCompleted, totalXP, nextLesson);

  panel.webview.onDidReceiveMessage(async (msg) => {
    switch (msg.command) {
      case "complete": {
        const existing = context.globalState.get("vimquest.completed", []);
        if (!existing.includes(lessonId)) {
          await context.globalState.update("vimquest.completed", [...existing, lessonId]);
          // streak
          const today     = new Date().toDateString();
          const lastDay   = context.globalState.get("vimquest.lastDay", "");
          const streak    = context.globalState.get("vimquest.streak", 0);
          if (lastDay !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            await context.globalState.update("vimquest.streak", lastDay === yesterday ? streak + 1 : 1);
            await context.globalState.update("vimquest.lastDay", today);
          }
        }
        providers.lessons.refresh();
        providers.progress.refresh();
        vscode.window.showInformationMessage(`🎉 Lesson complete! +${lesson.xp} XP earned!`);

        if (nextLesson) {
          panel.dispose();
          getLessonPanel(context, nextLesson.id, providers);
        } else {
          vscode.window.showInformationMessage("🏆 You've finished all lessons! Try the games!");
        }
        break;
      }
      case "openPractice":
        openPracticeFile(lesson);
        break;
      case "openGame": {
        const { getGamePanel } = require('./game');
        panel.dispose();
        getGamePanel(context, providers);
        break;
      }
      case "openWelcome": {
        const { getWelcomePanel } = require('./welcome');
        panel.dispose();
        getWelcomePanel(context, providers);
        break;
      }
    }
  });
}

// ── Practice file ─────────────────────────────────────────────────────────────
async function openPracticeFile(lesson) {
  const lines = buildPracticeText(lesson);
  const doc   = await vscode.workspace.openTextDocument({ content: lines, language: "markdown" });
  await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
  vscode.window.showInformationMessage("📝 Practice file opened! Press Esc in it to enter NORMAL mode.");
}

function buildPracticeText(lesson) {
  const header = [
    `# VimQuest Practice — ${lesson.title}`,
    `# ═══════════════════════════════════════════════`,
    `# This scratch file is your practice ground!`,
    `# With the Vim extension: press Esc → NORMAL mode, then try the commands.`,
    ``,
    `# ──────────────────────────────────────────────────────────`,
    ``,
  ].join("\n");

  const bodies = {
    l2: [
      "# Goal: use h j k l to move around — don't touch the arrow keys!",
      "# Try: 5j (jump 5 lines down), 10k (10 up), 3l (3 right)",
      "",
      "The quick brown fox jumps over the lazy dog.",
      "Pack my box with five dozen liquor jugs.",
      "How vexingly quick daft zebras jump!",
      "The five boxing wizards jump quickly.",
      "Sphinx of black quartz, judge my vow.",
      "Two driven jocks help fax my big quiz.",
      "Five quacking zephyrs jolt my wax bed.",
      "The jay, pig, fox, zebra and my wolves quack!",
      "Blowzy red vixens fight for a quick jump.",
      "Joaquin Phoenix was gazed by MTV for luck.",
    ].join("\n"),

    l3: [
      "# Goal: enter INSERT mode in different ways",
      "# i = insert before cursor  |  a = append after  |  A = append end of line",
      "# o = new line below  |  O = new line above  |  I = insert at line start",
      "",
      "hello world",
      "practice vim here",
      "another line to edit",
      "one more to try",
    ].join("\n"),

    l5: [
      "# Goal: use w b e W B E to jump between words",
      "# Try: 3w (3 words forward), 2b (2 back), e (end of word)",
      "",
      "const greeting = 'hello world from vim';",
      "let counter = 0;",
      "function sayHello(name, age) { return name + age; }",
      "import { useState, useEffect, useCallback } from 'react';",
    ].join("\n"),

    l8: [
      "# Goal: use f{char} t{char} F T to jump on the line",
      "# Try: fw (jump to w), df; (delete to semicolon), ct' (change until quote)",
      "",
      "const x = foo(bar, baz);",
      "let name = 'John Doe';",
      "import { useState, useEffect } from 'react';",
      "const url = 'https://github.com/Owskar';",
    ].join("\n"),

    l9: [
      "# Goal: practice d (delete)  c (change)  y (yank/copy)  p (paste)",
      "# dw = delete word | dd = delete line | yy = copy line | p = paste",
      "",
      "delete this entire line with dd",
      "change the word REPLACE with something else using cw",
      "yank this line with yy, then paste it below with p",
      "the quick brown fox jumps over the lazy dog",
      "another line for more practice here",
      "and one more so you have plenty to work with",
    ].join("\n"),

    l11: [
      "# Goal: visual mode — v (char), V (line), Ctrl+v (block)",
      "# Select, then: d (delete), y (yank), > (indent), ~ (toggle case)",
      "",
      "  visually select this line",
      "  and this line too",
      "  and this third one",
      "  block-select these four",
      "  to add text in front",
    ].join("\n"),

    l12: [
      "# Goal: text objects — diw ci( da\" vit etc.",
      "# di\" = delete inside quotes | ci( = change inside parens | vit = visual inside tag",
      "",
      'const name = "John Doe";',
      'const greeting = "Hello, World!";',
      "function greet(firstName, lastName) {",
      '  return `Hello ${firstName} ${lastName}`;',
      "}",
      'const arr = [1, 2, 3, "four", 5];',
      '<div class="container">',
      "  <p>Edit this text object with vit or dit</p>",
      "</div>",
    ].join("\n"),
  };

  const body = bodies[lesson.id] || [
    "# Practice the commands from the lesson!",
    "",
    "const hello = 'world';",
    "let count = 0;",
    "",
    "function example(a, b, c) {",
    "  const result = a + b + c;",
    "  return result;",
    "}",
    "",
    "// More text below",
    "const items = ['one', 'two', 'three'];",
    "items.forEach(item => console.log(item));",
    "",
    "class VimLearner {",
    "  constructor(name) { this.name = name; }",
    "  practice() { return 'Keep going, ' + this.name + '!'; }",
    "}",
  ].join("\n");

  return header + body + "\n\n# ────────────────────────────────────────────\n# Done? Close with :q or Ctrl+W\n# Good luck, Vim warrior! ⚔️\n";
}

// ── HTML ──────────────────────────────────────────────────────────────────────
function buildLessonHTML(lesson, isCompleted, totalXP, nextLesson) {
  const rank       = getRank(totalXP);
  const lessonIdx  = LESSONS.findIndex((l) => l.id === lesson.id);
  const totalLessons = LESSONS.length;
  const progress   = Math.round((lessonIdx / totalLessons) * 100);

  const cmdBadges = lesson.commands
    .map((c) => `<kbd class="cmd">${esc(c)}</kbd>`)
    .join(" ");

  // Convert markdown content to safe HTML
  const contentHTML = mdToHTML(lesson.content);

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<title>${esc(lesson.title)}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:var(--vscode-editor-background,#1e1e2e);
  --fg:var(--vscode-editor-foreground,#cdd6f4);
  --card:var(--vscode-editorWidget-background,#181825);
  --border:var(--vscode-editorWidget-border,#313244);
  --code-bg:var(--vscode-textCodeBlock-background,#11111b);
  --accent:#7c3aed;
  --accent2:#06b6d4;
  --green:#10b981;
  --yellow:#f59e0b;
  --red:#f38ba8;
  --r:10px;
  --mono:'Cascadia Code','Fira Code','JetBrains Mono',Consolas,monospace;
}
body{background:var(--bg);color:var(--fg);font-family:var(--vscode-font-family,-apple-system,sans-serif);font-size:14px;line-height:1.65;min-height:100vh}

/* NAV */
.nav{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--border);background:var(--card);position:sticky;top:0;z-index:20;gap:12px;flex-wrap:wrap}
.nav-left{display:flex;align-items:center;gap:10px}
.logo-text{font-size:18px;font-weight:900;background:linear-gradient(135deg,#a855f7,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.5px;cursor:pointer}
.chapter-tag{font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(124,58,237,.18);color:#a78bfa;font-weight:700;letter-spacing:.3px}
.nav-right{display:flex;align-items:center;gap:14px}
.rank-text{font-size:12px;opacity:.6}
.xp-text{font-size:12px;font-weight:700;color:var(--yellow)}
.nav-btn{background:none;border:1px solid var(--border);border-radius:7px;color:var(--fg);font-size:12px;padding:5px 12px;cursor:pointer;transition:all .15s}
.nav-btn:hover{border-color:var(--accent);color:var(--accent)}

/* PROGRESS BAR */
.prog-wrap{height:3px;background:var(--code-bg)}
.prog-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));transition:width .4s}

/* LAYOUT */
.layout{max-width:780px;margin:0 auto;padding:32px 20px 80px}

/* HEADER */
.lesson-title{font-size:26px;font-weight:900;letter-spacing:-.5px;margin-bottom:12px;line-height:1.2}
.lesson-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:20px}
.xp-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);color:var(--yellow);font-size:12px;font-weight:700}
.cmd{display:inline-block;padding:3px 9px;border-radius:6px;background:var(--code-bg);border:1px solid var(--border);font-family:var(--mono);font-size:11px;color:#e879f9;font-weight:700}
.done-banner{display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);color:var(--green);font-size:13px;font-weight:600;margin-bottom:18px}

/* TIP */
.tip{display:flex;gap:10px;padding:12px 16px;background:rgba(6,182,212,.06);border:1px solid rgba(6,182,212,.2);border-radius:8px;font-size:13px;line-height:1.55;margin-bottom:22px}
.tip-icon{font-size:17px;flex-shrink:0;margin-top:1px}

/* CONTENT CARD */
.content-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:28px 30px;margin-bottom:22px;overflow-x:auto}
.content-card h1{font-size:20px;font-weight:800;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border)}
.content-card h2{font-size:15px;font-weight:700;color:var(--accent2);margin:22px 0 9px}
.content-card h3{font-size:13px;font-weight:700;margin:16px 0 7px;color:#a78bfa}
.content-card p{margin:9px 0;line-height:1.75}
.content-card strong{font-weight:700;color:var(--accent2)}
.content-card em{font-style:italic;opacity:.85}
.content-card code{font-family:var(--mono);font-size:12px;padding:2px 6px;border-radius:5px;background:var(--code-bg);border:1px solid var(--border);color:#e879f9}
.content-card pre{background:var(--code-bg);border:1px solid var(--border);border-radius:8px;padding:16px 18px;margin:14px 0;overflow-x:auto}
.content-card pre code{background:none;border:none;padding:0;color:var(--accent2);font-size:13px;line-height:1.6}
.content-card blockquote{border-left:3px solid var(--accent);padding:9px 16px;margin:14px 0;background:rgba(124,58,237,.06);border-radius:0 8px 8px 0;font-style:italic}
.content-card table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13px}
.content-card th{text-align:left;padding:8px 13px;background:rgba(124,58,237,.1);border:1px solid var(--border);font-weight:700;color:var(--accent2)}
.content-card td{padding:7px 13px;border:1px solid var(--border)}
.content-card tr:nth-child(even) td{background:rgba(255,255,255,.02)}
.content-card ul,.content-card ol{padding-left:20px;margin:10px 0}
.content-card li{margin:4px 0;line-height:1.65}
.content-card hr{border:none;border-top:1px solid var(--border);margin:22px 0}
.content-card a{color:var(--accent2);text-decoration:none}
.content-card a:hover{text-decoration:underline}

/* ACTIONS */
.actions{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:7px;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .15s;letter-spacing:.2px}
.btn:hover{transform:translateY(-1px)}
.btn:active{transform:translateY(0)}
.btn-primary{background:linear-gradient(135deg,var(--accent),#9333ea);color:#fff;box-shadow:0 3px 12px rgba(124,58,237,.35)}
.btn-primary:hover{box-shadow:0 5px 18px rgba(124,58,237,.45)}
.btn-success{background:linear-gradient(135deg,var(--green),#059669);color:#fff;box-shadow:0 3px 12px rgba(16,185,129,.3)}
.btn-success:hover{box-shadow:0 5px 18px rgba(16,185,129,.4)}
.btn-outline{background:transparent;color:var(--fg);border:1px solid var(--border)}
.btn-outline:hover{border-color:var(--accent2);color:var(--accent2)}
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-left">
    <span class="logo-text" onclick="goHome()">⚔️ VimQuest</span>
    <span class="chapter-tag">${esc(lesson.chapter)}</span>
  </div>
  <div class="nav-right">
    <span class="rank-text">${rank}</span>
    <span class="xp-text">⚡ ${totalXP} XP</span>
    <button class="nav-btn" onclick="openGame()">🎮 Games</button>
  </div>
</nav>

<div class="prog-wrap">
  <div class="prog-fill" style="width:${progress}%"></div>
</div>

<div class="layout">

  <div class="lesson-title">${esc(lesson.title)}</div>
  <div class="lesson-meta">
    <span class="xp-badge">⚡ +${lesson.xp} XP</span>
    ${cmdBadges}
  </div>

  ${isCompleted ? `<div class="done-banner">✅ Already completed — XP earned!</div>` : ""}

  <div class="tip">
    <span class="tip-icon">💡</span>
    <div>Click <strong>Open Practice File</strong> to open a scratch file alongside this lesson — try every command live with the Vim extension installed.</div>
  </div>

  <div class="content-card">${contentHTML}</div>

  <div class="actions">
    <button class="btn btn-outline" onclick="openPractice()">📝 Open Practice File</button>
    ${!isCompleted
      ? `<button class="btn btn-success" onclick="markDone()">✅ Mark Complete &nbsp;+${lesson.xp} XP</button>`
      : nextLesson
        ? `<button class="btn btn-primary" onclick="markDone()">Next: ${esc(nextLesson.title)} →</button>`
        : `<button class="btn btn-primary" onclick="openGame()">🎮 Play Games!</button>`
    }
  </div>

</div>

<script>
const vscode = acquireVsCodeApi();
function markDone()     { vscode.postMessage({ command: 'complete' }); }
function openPractice() { vscode.postMessage({ command: 'openPractice' }); }
function openGame()     { vscode.postMessage({ command: 'openGame' }); }
function goHome()       { vscode.postMessage({ command: 'openWelcome' }); }
</script>
</body>
</html>`;
}

// ── Safe HTML escape ──────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

// ── Minimal markdown→HTML (robust, no deps) ───────────────────────────────────
function mdToHTML(md) {
  // 1. Fenced code blocks
  md = md.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${esc(code.trimEnd())}</code></pre>`);

  // 2. Inline code
  md = md.replace(/`([^`\n]+)`/g, (_, c) => `<code>${esc(c)}</code>`);

  // 3. Tables
  md = md.replace(/(?:^\|.+\|\n)+/gm, (block) => {
    const rows = block.trim().split("\n");
    let out = "<table>";
    let headerDone = false;
    for (const row of rows) {
      if (/^\|[-:\s|]+\|$/.test(row.trim())) { headerDone = true; continue; }
      const cells = row.replace(/^\||\|$/g,"").split("|");
      const tag   = !headerDone ? "th" : "td";
      out += "<tr>" + cells.map(c => `<${tag}>${inl(c.trim())}</${tag}>`).join("") + "</tr>";
      if (!headerDone) headerDone = true; // mark header done after first real row
    }
    return out + "</table>";
  });

  // 4. Blockquotes
  md = md.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // 5. Headings
  md = md.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  md = md.replace(/^## (.+)$/gm,  "<h2>$1</h2>");
  md = md.replace(/^# (.+)$/gm,   "<h1>$1</h1>");

  // 6. HR
  md = md.replace(/^---$/gm, "<hr>");

  // 7. Unordered list (whole block)
  md = md.replace(/((?:^[-*] .+\n?)+)/gm, blk => {
    const items = blk.trim().split("\n")
      .map(l => `<li>${inl(l.replace(/^[-*] /,""))}</li>`).join("");
    return `<ul>${items}</ul>`;
  });

  // 8. Ordered list
  md = md.replace(/((?:^\d+\. .+\n?)+)/gm, blk => {
    const items = blk.trim().split("\n")
      .map(l => `<li>${inl(l.replace(/^\d+\. /,""))}</li>`).join("");
    return `<ol>${items}</ol>`;
  });

  // 9. Paragraphs — wrap plain lines that aren't already HTML tags
  const lines = md.split("\n");
  const out   = [];
  let inPre   = false;
  for (const line of lines) {
    if (line.startsWith("<pre")) inPre = true;
    if (line.startsWith("</pre")) { inPre = false; out.push(line); continue; }
    if (inPre) { out.push(line); continue; }
    if (line.trim() === "") { out.push(""); continue; }
    if (/^<(h[1-6]|ul|ol|li|pre|table|tr|th|td|blockquote|hr|p)/.test(line.trim())) {
      out.push(line); continue;
    }
    out.push(`<p>${inl(line)}</p>`);
  }

  return out.join("\n");
}

function inl(t) {
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*(.+?)\*/g,     "<em>$1</em>");
  t = t.replace(/`([^`]+)`/g, (_,c) => `<code>${esc(c)}</code>`);
  return t;
}

module.exports = { getLessonPanel };
