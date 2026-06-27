const vscode = require("vscode");
const { LESSONS } = require("./lessons");
const { getRank } = require("./sidebar");

function getLessonPanel(context, lessonId, providers) {
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (!lesson) return;

  const panel = vscode.window.createWebviewPanel(
    "vimquestLesson",
    `VimQuest: ${lesson.title}`,
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  const completed = context.globalState.get("vimquest.completed", []);
  const totalXP = LESSONS.filter((l) => completed.includes(l.id)).reduce(
    (sum, l) => sum + l.xp,
    0
  );
  const lessonIndex = LESSONS.findIndex((l) => l.id === lessonId);
  const nextLesson = LESSONS[lessonIndex + 1] || null;
  const isCompleted = completed.includes(lessonId);

  panel.webview.html = getLessonHTML(lesson, isCompleted, totalXP, nextLesson);

  panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg.command === "complete") {
      const existing = context.globalState.get("vimquest.completed", []);
      if (!existing.includes(lessonId)) {
        await context.globalState.update("vimquest.completed", [
          ...existing,
          lessonId,
        ]);
        // Update streak
        const today = new Date().toDateString();
        const lastDay = context.globalState.get("vimquest.lastDay", "");
        const streak = context.globalState.get("vimquest.streak", 0);
        if (lastDay !== today) {
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          await context.globalState.update(
            "vimquest.streak",
            lastDay === yesterday ? streak + 1 : 1
          );
          await context.globalState.update("vimquest.lastDay", today);
        }
      }

      providers.lessons.refresh();
      providers.progress.refresh();

      vscode.window.showInformationMessage(
        `🎉 Lesson complete! +${lesson.xp} XP earned!`
      );

      if (nextLesson) {
        const pick = await vscode.window.showInformationMessage(
          `Ready for "${nextLesson.title}"?`,
          "Next Lesson →",
          "Stay Here"
        );
        if (pick === "Next Lesson →") {
          panel.dispose();
          getLessonPanel(context, nextLesson.id, providers);
        }
      }
    }

    if (msg.command === "openPractice") {
      openPracticeFile(lesson);
    }
  });

  return panel;
}

async function openPracticeFile(lesson) {
  // Create a temporary practice file with the lesson's content context
  const practiceText = generatePracticeText(lesson);
  const doc = await vscode.workspace.openTextDocument({
    content: practiceText,
    language: "markdown",
  });
  await vscode.window.showTextDocument(doc, vscode.ViewColumn.Two);
  vscode.window.showInformationMessage(
    "📝 Practice file opened! Use Vim commands on this file."
  );
}

function generatePracticeText(lesson) {
  const lines = [
    `# VimQuest Practice — ${lesson.title}`,
    `# ═══════════════════════════════════════`,
    `# This file is your practice ground!`,
    `# Open it alongside the lesson and try the commands.`,
    `# Press Esc to enter NORMAL mode, then practice away.`,
    ``,
    `# ─── PRACTICE AREA ──────────────────────────`,
    ``,
  ];

  // Add lesson-specific practice content
  const id = lesson.id;

  if (id === "l2") {
    lines.push(
      "# Use h j k l to move your cursor around this file",
      "# Try: 5j to jump 5 lines down, 3k to go 3 up",
      "",
      "line one",
      "line two",
      "line three",
      "line four",
      "line five",
      "line six",
      "line seven",
      "line eight",
      "line nine",
      "line ten"
    );
  } else if (id === "l3") {
    lines.push(
      "# Try i, a, o, O, I, A to insert text in different spots",
      "# Use Esc to return to NORMAL mode",
      "",
      "hello world",
      "practice vim here",
      "another line to edit"
    );
  } else if (id === "l5") {
    lines.push(
      "# Use w, b, e to jump between words",
      "# Try: 3w to jump 3 words, 2b to go back 2",
      "",
      "const greeting = 'hello world from vim';",
      "let counter = 0;",
      "function sayHello(name, age) { return name; }"
    );
  } else if (id === "l8") {
    lines.push(
      "# Use f, t, F, T to find characters on a line",
      "# Try: fw to jump to 'w', df; to delete until semicolon",
      "",
      "const x = foo(bar, baz);",
      "let name = 'John Doe';",
      "import { useState, useEffect } from 'react';"
    );
  } else if (id === "l9") {
    lines.push(
      "# Practice d (delete), c (change), y (yank/copy), p (paste)",
      "# Try: dw (delete word), cc (change line), yy then p (copy-paste)",
      "",
      "delete this word here",
      "change the word WORD to something else",
      "yank this line and paste it below",
      "the quick brown fox jumps over the lazy dog",
      "another line for practice"
    );
  } else if (id === "l11") {
    lines.push(
      "# Visual mode: v (character), V (line), Ctrl+v (block)",
      "# Select then: d delete, y yank, > indent, ~ toggle case",
      "",
      "  select me visually",
      "  and this line too",
      "  and this one",
      "  block select these",
      "  four lines at once"
    );
  } else if (id === "l12") {
    lines.push(
      "# Text objects: diw, caw, ci(, di\", dit etc.",
      "# Try: di\" to delete inside quotes, ci( to change inside parens",
      "",
      'const name = "John Doe";',
      "function greet(firstName, lastName) {",
      '  return `Hello ${firstName} ${lastName}`;',
      "}",
      'const arr = [1, 2, 3, "four", 5];',
      "<div class=\"container\">",
      "  <p>Edit this text object</p>",
      "</div>"
    );
  } else {
    lines.push(
      "# Practice the commands from the lesson here!",
      "",
      "const hello = 'world';",
      "let count = 0;",
      "",
      "function example(a, b, c) {",
      "  const result = a + b + c;",
      "  return result;",
      "}",
      "",
      "// More text to practice on",
      "const items = ['one', 'two', 'three'];",
      "items.forEach(item => console.log(item));"
    );
  }

  lines.push(
    "",
    "# ─── END OF PRACTICE AREA ──────────────────",
    "# When done, close this file or run :q!",
    "# Good luck, Vim warrior! 🗡️"
  );

  return lines.join("\n");
}

function getLessonHTML(lesson, isCompleted, totalXP, nextLesson) {
  const rank = getRank(totalXP);
  const contentHtml = markdownToHtml(lesson.content);

  const commandBadges = lesson.commands
    .map(
      (cmd) =>
        `<span class="cmd-badge">${escapeHtml(cmd)}</span>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VimQuest</title>
<style>
  :root {
    --bg: var(--vscode-editor-background);
    --fg: var(--vscode-editor-foreground);
    --accent: #7c3aed;
    --accent2: #06b6d4;
    --green: #10b981;
    --yellow: #f59e0b;
    --red: #ef4444;
    --card: var(--vscode-editorWidget-background);
    --border: var(--vscode-editorWidget-border, #3f3f3f);
    --code-bg: var(--vscode-textCodeBlock-background, #1e1e2e);
    --radius: 10px;
    --font-mono: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--fg);
    font-family: var(--vscode-font-family, -apple-system, sans-serif);
    font-size: 14px;
    line-height: 1.7;
    min-height: 100vh;
  }

  /* TOP BAR */
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--card);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .topbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .chapter-badge {
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 20px;
    background: var(--accent);
    color: white;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  .xp-pill {
    font-size: 12px;
    color: var(--yellow);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .rank-badge {
    font-size: 12px;
    color: var(--fg);
    opacity: 0.7;
  }

  /* MAIN LAYOUT */
  .layout {
    max-width: 820px;
    margin: 0 auto;
    padding: 32px 24px 60px;
  }

  /* HEADER */
  .lesson-header {
    margin-bottom: 28px;
  }
  .lesson-title {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }
  .lesson-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .xp-reward {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    border-radius: 20px;
    background: rgba(245,158,11,0.12);
    border: 1px solid rgba(245,158,11,0.3);
    color: var(--yellow);
    font-size: 12px;
    font-weight: 700;
  }
  .cmd-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 6px;
    background: var(--code-bg);
    border: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--accent2);
    font-weight: 600;
  }
  .completed-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: var(--radius);
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.3);
    color: var(--green);
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 20px;
  }

  /* CONTENT */
  .lesson-content {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px 32px;
    margin-bottom: 24px;
  }
  .lesson-content h1 {
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 18px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }
  .lesson-content h2 {
    font-size: 16px;
    font-weight: 700;
    margin: 24px 0 10px;
    color: var(--accent2);
  }
  .lesson-content h3 {
    font-size: 14px;
    font-weight: 700;
    margin: 18px 0 8px;
  }
  .lesson-content p {
    margin: 10px 0;
    line-height: 1.75;
  }
  .lesson-content strong { font-weight: 700; color: var(--accent2); }
  .lesson-content em { font-style: italic; opacity: 0.85; }
  .lesson-content code {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 2px 7px;
    border-radius: 5px;
    background: var(--code-bg);
    border: 1px solid var(--border);
    color: #e879f9;
  }
  .lesson-content pre {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 20px;
    margin: 14px 0;
    overflow-x: auto;
  }
  .lesson-content pre code {
    background: none;
    border: none;
    padding: 0;
    color: var(--accent2);
    font-size: 13px;
  }
  .lesson-content blockquote {
    border-left: 3px solid var(--accent);
    padding: 10px 16px;
    margin: 14px 0;
    background: rgba(124,58,237,0.07);
    border-radius: 0 8px 8px 0;
    font-style: italic;
  }
  .lesson-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13px;
  }
  .lesson-content th {
    text-align: left;
    padding: 8px 14px;
    background: rgba(124,58,237,0.12);
    border: 1px solid var(--border);
    font-weight: 700;
    color: var(--accent2);
  }
  .lesson-content td {
    padding: 7px 14px;
    border: 1px solid var(--border);
  }
  .lesson-content tr:nth-child(even) td {
    background: rgba(255,255,255,0.02);
  }
  .lesson-content ul, .lesson-content ol {
    padding-left: 20px;
    margin: 10px 0;
  }
  .lesson-content li {
    margin: 4px 0;
  }
  .lesson-content hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 24px 0;
  }

  /* ACTIONS */
  .actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 8px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    letter-spacing: 0.3px;
  }
  .btn:hover { transform: translateY(-1px); }
  .btn:active { transform: translateY(0); }
  .btn-primary {
    background: linear-gradient(135deg, var(--accent), #9333ea);
    color: white;
    box-shadow: 0 4px 14px rgba(124,58,237,0.35);
  }
  .btn-primary:hover { box-shadow: 0 6px 20px rgba(124,58,237,0.45); }
  .btn-secondary {
    background: var(--card);
    color: var(--fg);
    border: 1px solid var(--border);
  }
  .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }
  .btn-success {
    background: linear-gradient(135deg, var(--green), #059669);
    color: white;
    box-shadow: 0 4px 14px rgba(16,185,129,0.3);
  }
  .btn-success:hover { box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* TIP BOX */
  .tip-box {
    display: flex;
    gap: 12px;
    padding: 14px 18px;
    background: rgba(6,182,212,0.07);
    border: 1px solid rgba(6,182,212,0.25);
    border-radius: var(--radius);
    margin-bottom: 20px;
    font-size: 13px;
    line-height: 1.6;
  }
  .tip-icon { font-size: 18px; flex-shrink: 0; }
</style>
</head>
<body>

<div class="topbar">
  <div class="topbar-left">
    <span class="logo">⚔️ VimQuest</span>
    <span class="chapter-badge">${escapeHtml(lesson.chapter)}</span>
  </div>
  <div style="display:flex;align-items:center;gap:16px;">
    <span class="rank-badge">${rank}</span>
    <span class="xp-pill">⚡ ${totalXP} XP</span>
  </div>
</div>

<div class="layout">

  <div class="lesson-header">
    <div class="lesson-title">${escapeHtml(lesson.title)}</div>
    <div class="lesson-meta">
      <span class="xp-reward">⚡ +${lesson.xp} XP</span>
      ${commandBadges}
    </div>
  </div>

  ${
    isCompleted
      ? `<div class="completed-banner">✅ Lesson completed! You've already earned the XP for this one.</div>`
      : ""
  }

  <div class="tip-box">
    <span class="tip-icon">💡</span>
    <div>
      <strong>Practice live!</strong> Click <em>"Open Practice File"</em> to get a scratch file where you can try these commands directly in VS Code with the Vim extension.
    </div>
  </div>

  <div class="lesson-content">
    ${contentHtml}
  </div>

  <div class="actions">
    <button class="btn btn-secondary" onclick="openPractice()">📝 Open Practice File</button>
    ${
      !isCompleted
        ? `<button class="btn btn-success" onclick="markComplete()">✅ Mark as Complete (+${lesson.xp} XP)</button>`
        : nextLesson
        ? `<button class="btn btn-primary" onclick="nextLesson()">Next Lesson: ${escapeHtml(nextLesson.title)} →</button>`
        : `<button class="btn btn-primary" onclick="openGame()">🎮 Try a Game!</button>`
    }
  </div>

</div>

<script>
  const vscode = acquireVsCodeApi();

  function markComplete() {
    vscode.postMessage({ command: 'complete' });
  }

  function openPractice() {
    vscode.postMessage({ command: 'openPractice' });
  }

  function nextLesson() {
    vscode.postMessage({ command: 'complete' });
  }

  function openGame() {
    vscode.postMessage({ command: 'openGame' });
  }
</script>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Simple markdown-to-HTML converter (no external deps)
function markdownToHtml(md) {
  let html = md;

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);

  // Tables
  html = html.replace(/((?:\|.+\|\n)+)/g, (tableBlock) => {
    const rows = tableBlock.trim().split("\n");
    let out = "<table>";
    rows.forEach((row, i) => {
      if (row.match(/^\|[-\s|]+\|$/)) return; // separator row
      const cells = row.split("|").slice(1, -1);
      const tag = i === 0 ? "th" : "td";
      out += "<tr>" + cells.map((c) => `<${tag}>${renderInline(c.trim())}</${tag}>`).join("") + "</tr>";
    });
    out += "</table>";
    return out;
  });

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // HR
  html = html.replace(/^---$/gm, "<hr>");

  // Unordered lists
  html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block.trim().split("\n").map((l) => `<li>${renderInline(l.replace(/^- /, ""))}</li>`).join("");
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split("\n").map((l) => `<li>${renderInline(l.replace(/^\d+\. /, ""))}</li>`).join("");
    return `<ol>${items}</ol>`;
  });

  // Paragraphs
  html = html.replace(/\n\n([^<\n].*)/g, "\n\n<p>$1</p>");
  html = html.replace(/^([^<\n].*)/gm, (line) => {
    if (line.trim() === "") return line;
    if (line.match(/^<(h[1-6]|ul|ol|li|pre|table|blockquote|hr|p)/)) return line;
    return `<p>${renderInline(line)}</p>`;
  });

  return html;
}

function renderInline(text) {
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Inline code (already handled above but backup)
  text = text.replace(/`([^`]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`);
  return text;
}

module.exports = { getLessonPanel };
