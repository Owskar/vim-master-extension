const LESSONS = [
  // ─── CHAPTER 1: BASICS ───────────────────────────────────────────────────
  {
    id: "l1",
    chapter: "🌱 Baby Steps",
    title: "What is Vim? Modes 101",
    xp: 50,
    commands: [],
    content: `# What is Vim? 🗡️

Vim is a **modal text editor** — meaning it has different *modes* for different tasks. This is what makes it feel alien at first, but incredibly fast once you understand it.

## The 4 Main Modes

| Mode | How to enter | What it does |
|------|-------------|--------------|
| **NORMAL** | \`Esc\` | Navigate & run commands |
| **INSERT** | \`i\` | Type text like a normal editor |
| **VISUAL** | \`v\` | Select text |
| **COMMAND** | \`:\` | Run editor commands |

## The Golden Rule

> Every time you open Vim, you start in **NORMAL mode**.
> Press \`i\` to write text. Press \`Esc\` to go back to NORMAL.

## Try it live (if you have the Vim extension installed)

1. Open any file in VS Code
2. The mode shows in the bottom-left corner
3. Press \`i\` — it should say **INSERT**
4. Type something
5. Press \`Esc\` — it should say **NORMAL**

🎉 You just used Vim!

---
*Next lesson → Moving around with h j k l*`
  },
  {
    id: "l2",
    chapter: "🌱 Baby Steps",
    title: "Move without arrow keys: h j k l",
    xp: 75,
    commands: ["h", "j", "k", "l"],
    content: `# The Vim Compass 🧭

Forget arrow keys. In Vim, your fingers never leave the home row.

## The 4 Navigation Keys

\`\`\`
        k
        ↑
   h ←     → l
        ↓
        j
\`\`\`

| Key | Direction | Memory trick |
|-----|-----------|-------------|
| \`h\` | ← Left | It's the leftmost of the four |
| \`j\` | ↓ Down | Like a hook that goes down |
| \`k\` | ↑ Up | K goes Up (K for kite?) |
| \`l\` | → Right | It's the rightmost of the four |

## Add a number to move faster!

- \`5j\` — move **5 lines down**
- \`10k\` — move **10 lines up**
- \`3l\` — move **3 characters right**

## Try it live

Open any text file in VS Code with the Vim extension. Make sure you're in **NORMAL mode** (press \`Esc\`), then:

1. Press \`j\` a few times — watch your cursor move down
2. Press \`k\` to come back up
3. Press \`5j\` — jump 5 lines at once!
4. Try \`h\` and \`l\` to move left/right

---
*Next lesson → Entering and leaving INSERT mode*`
  },
  {
    id: "l3",
    chapter: "🌱 Baby Steps",
    title: "Entering INSERT mode: i a o",
    xp: 75,
    commands: ["i", "a", "o", "O", "I", "A"],
    content: `# Entering INSERT Mode 📝

There are many ways to enter INSERT mode — each drops your cursor in a different spot.

## The Insert Commands

| Command | Where cursor lands |
|---------|-------------------|
| \`i\` | **i**nsert *before* the cursor |
| \`a\` | **a**ppend *after* the cursor |
| \`I\` | Insert at the *start* of the line |
| \`A\` | Append at the *end* of the line |
| \`o\` | Open a new line *below* |
| \`O\` | Open a new line *above* |

## The Escape Hatch

Always press \`Esc\` (or \`Ctrl+[\`) to return to NORMAL mode.

## Try it live

1. Open a file, make sure you're in NORMAL mode
2. Move to a word using \`h j k l\`
3. Press \`a\` — your cursor jumps after that character
4. Type something, then press \`Esc\`
5. Now press \`o\` — a new line appears below!
6. Type a sentence, then press \`Esc\`

## Pro tip: \`ea\`

Press \`e\` (move to end of word) then \`a\` (append after) to add text at the end of any word — super fast!

---
*Next lesson → Saving and quitting*`
  },
  {
    id: "l4",
    chapter: "🌱 Baby Steps",
    title: "Save & Quit: :w :q :wq",
    xp: 50,
    commands: [":w", ":q", ":wq", ":q!"],
    content: `# Save & Quit — The Classic Vim Struggle 😅

This is the first thing everyone Googles. Never again.

## The Commands

Enter these in COMMAND mode (press \`:\` from NORMAL mode):

| Command | What it does |
|---------|-------------|
| \`:w\` | **w**rite (save) the file |
| \`:q\` | **q**uit Vim |
| \`:wq\` | Save AND quit |
| \`:q!\` | Quit **without** saving (force quit) |
| \`:wq!\` | Save AND quit, forcing it |
| \`ZZ\` | Save and quit (shortcut, no colon!) |

## How to use them

1. Press \`Esc\` to make sure you're in NORMAL mode
2. Type \`:\` — you'll see a \`:\` appear at the bottom
3. Type \`w\` and press \`Enter\` — file saved!
4. Type \`:q\` and press \`Enter\` — Vim closes

## The famous "stuck in Vim" fix

If you ever feel trapped, just type:
\`\`\`
:q!
\`\`\`
and press Enter. This force-quits without saving anything.

---
*🎉 You've completed Baby Steps! Next chapter → Moving Like a Pro*`
  },
  {
    id: "l5",
    chapter: "⚡ Moving Like a Pro",
    title: "Word jumps: w b e",
    xp: 100,
    commands: ["w", "b", "e", "W", "B", "E"],
    content: `# Word Navigation ⚡

Stop moving one character at a time. Jump by **words**.

## The Word Jump Keys

| Key | Movement |
|-----|----------|
| \`w\` | Jump to start of **next word** |
| \`b\` | Jump **back** to start of previous word |
| \`e\` | Jump to **end** of current/next word |
| \`W\` | Same as \`w\` but ignores punctuation |
| \`B\` | Same as \`b\` but ignores punctuation |
| \`E\` | Same as \`e\` but ignores punctuation |

## What counts as a "word"?

- lowercase \`w/b/e\`: treats \`hello.world\` as **2 words** (splits at \`.\`)
- uppercase \`W/B/E\`: treats \`hello.world\` as **1 word** (only splits at spaces)

## Power move

\`3w\` — jump 3 words forward
\`2b\` — jump 2 words back

---
*Next lesson → Line jumping: 0 ^ $*`
  },
  {
    id: "l6",
    chapter: "⚡ Moving Like a Pro",
    title: "Line starts & ends: 0 ^ $",
    xp: 100,
    commands: ["0", "^", "$", "g_"],
    content: `# Line Navigation 🎯

Jump to the start or end of a line instantly.

## The Commands

| Key | Where it goes |
|-----|--------------|
| \`0\` | **Absolute** start of line (column 0) |
| \`^\` | First **non-blank** character of line |
| \`$\` | **End** of line (last character) |
| \`g_\` | Last **non-blank** character of line |

## Pro combos

- \`d$\` — delete from cursor to end of line
- \`d0\` — delete from cursor to start of line
- \`c^\` — change from cursor to first non-blank character

---
*Next lesson → File jumping: gg G*`
  },
  {
    id: "l7",
    chapter: "⚡ Moving Like a Pro",
    title: "File navigation: gg G {line}G",
    xp: 100,
    commands: ["gg", "G", "ctrl+f", "ctrl+b"],
    content: `# File Navigation 🗺️

Navigate your entire file in milliseconds.

## Top, Bottom, and Everywhere

| Key | Goes to |
|-----|---------|
| \`gg\` | **Top** of file (line 1) |
| \`G\` | **Bottom** of file |
| \`42G\` | Line **42** (any number + G) |
| \`Ctrl+f\` | Page **f**orward (scroll down) |
| \`Ctrl+b\` | Page **b**ackward (scroll up) |
| \`Ctrl+d\` | Half page **d**own |
| \`Ctrl+u\` | Half page **u**p |

## Line number jumping

Need to go to line 237? Type \`237G\` in NORMAL mode. Or use \`:237\` in COMMAND mode.

## Relative line numbers trick

Enable relative line numbers in your VS Code settings:
\`\`\`json
"editor.lineNumbers": "relative"
\`\`\`

Now \`5j\` jumps exactly 5 lines down!

---
*Next lesson → Find on line: f t F T*`
  },
  {
    id: "l8",
    chapter: "⚡ Moving Like a Pro",
    title: "Find on line: f t F T",
    xp: 125,
    commands: ["f", "F", "t", "T", ";", ","],
    content: `# Find on Line 🔍

Jump to any character on the current line instantly.

## The Find Commands

| Key | What it does |
|-----|-------------|
| \`f{char}\` | Jump **to** next occurrence of char |
| \`F{char}\` | Jump **to** previous occurrence of char |
| \`t{char}\` | Jump **until** (one before) next char |
| \`T{char}\` | Jump **until** previous char |
| \`;\` | Repeat last f/t/F/T forward |
| \`,\` | Repeat last f/t/F/T backward |

## Power combos

- \`df.\` — **d**elete **f**rom cursor to next period
- \`ct"\` — **c**hange un**t**il next quote
- \`vf;\` — **v**isually select to the next semicolon

---
*Next lesson → Delete, change, yank: d c y*`
  },
  {
    id: "l9",
    chapter: "🔥 Editing Powers",
    title: "Delete, change, yank: d c y",
    xp: 150,
    commands: ["d", "c", "y", "dd", "cc", "yy", "p", "P"],
    content: `# The Operator Trio: d c y 🔥

These three operators are the heart of Vim editing. Each one works with a **motion**.

## The Operators

| Operator | What it does |
|----------|-------------|
| \`d\` | **D**elete (also cuts to clipboard) |
| \`c\` | **C**hange (delete + enter INSERT mode) |
| \`y\` | **Y**ank (copy) |

## The Formula: Operator + Motion

\`d\` + \`w\` = \`dw\` = delete a word
\`c\` + \`e\` = \`ce\` = change to end of word
\`y\` + \`$\` = \`y$\` = yank to end of line

## Double operator = act on whole line

| Command | Does |
|---------|------|
| \`dd\` | Delete entire line |
| \`cc\` | Change entire line |
| \`yy\` | Yank entire line |

## Paste

| Key | Does |
|-----|------|
| \`p\` | Paste **after** cursor |
| \`P\` | Paste **before** cursor |

---
*Next lesson → Undo & Redo: u Ctrl+r*`
  },
  {
    id: "l10",
    chapter: "🔥 Editing Powers",
    title: "Undo & Redo: u Ctrl+r",
    xp: 75,
    commands: ["u", "ctrl+r", "U"],
    content: `# Undo & Redo ↩️

## The Basics

| Key | Action |
|-----|--------|
| \`u\` | Undo last change |
| \`Ctrl+r\` | Redo (undo the undo) |
| \`U\` | Undo all changes on current line |
| \`5u\` | Undo the last 5 changes |

## Vim's Undo Tree

Vim stores an **undo tree**, not just a linear history. Even if you undo and make new changes, old branches are preserved.

---
*Next lesson → Visual mode: v V Ctrl+v*`
  },
  {
    id: "l11",
    chapter: "🔥 Editing Powers",
    title: "Visual mode: v V Ctrl+v",
    xp: 150,
    commands: ["v", "V", "ctrl+v", "gv"],
    content: `# Visual Mode — Select Like a Pro 🎨

## Three Types of Visual Mode

| Key | Mode | Selects |
|-----|------|---------|
| \`v\` | Character visual | Any characters |
| \`V\` | Line visual | Whole lines |
| \`Ctrl+v\` | Block visual | Rectangular block |

## After selecting, use operators

- \`d\` — delete the selection
- \`y\` — yank (copy) the selection
- \`c\` — change the selection
- \`>\` — indent right
- \`~\` — toggle case

## Block visual is a superpower 🦸

Add \`//\` to 5 lines at once:
1. \`Ctrl+v\` → select 5 lines with \`5j\`
2. Press \`I\` (capital i)
3. Type \`//\`
4. Press \`Esc\` — all 5 lines get \`//\` prepended!

\`gv\` — reselects whatever you last had selected.

---
*Next lesson → Text objects: iw aw ip i" a(*`
  },
  {
    id: "l12",
    chapter: "🔥 Editing Powers",
    title: "Text objects: iw aw ip i\" a(",
    xp: 200,
    commands: ["iw", "aw", "ip", "i\"", "a(", "it"],
    content: `# Text Objects — Vim's Secret Weapon 🗝️

## The Formula

\`{operator}{i or a}{object}\`

- \`i\` = **i**nner (without surrounding delimiters)
- \`a\` = **a**round (includes surrounding delimiters)

## Common Text Objects

| Object | What it selects |
|--------|----------------|
| \`iw\` | inner word |
| \`aw\` | around word (word + space) |
| \`ip\` | inner paragraph |
| \`i"\` | inside double quotes |
| \`a"\` | around double quotes |
| \`i(\` | inside parentheses |
| \`a(\` | around parentheses |
| \`it\` | inside HTML tag |

## Mind-blowing examples

\`const x = "hello world"\` ← cursor anywhere in "hello world"

- \`di"\` — delete inside quotes → \`const x = ""\`
- \`ci"\` — change inside quotes → enter INSERT inside the quotes
- \`vi"\` — visually select the text inside quotes

---
*🎉 Editing Powers complete! Next → Intermediate*`
  },
  {
    id: "l13",
    chapter: "🚀 Intermediate",
    title: "Marks: m{a-z} '{a-z}",
    xp: 175,
    commands: ["m", "'", "`"],
    content: `# Marks — Bookmarks for Your Code 📌

## Setting and Using Marks

| Command | What it does |
|---------|-------------|
| \`m{a-z}\` | Set a mark at current position |
| \`'{a}\` | Jump to **line** of mark \`a\` |
| \`\`{a}\` | Jump to **exact position** of mark \`a\` |
| \`:marks\` | List all marks |

## Example workflow

1. At line 50: press \`ma\` — sets mark \`a\`
2. Navigate anywhere in the file
3. Press \`'a\` — jumps back to line 50!

## Auto marks (Vim sets these automatically)

| Mark | Meaning |
|------|---------|
| \`\`.\` | Last change position |
| \`\`^\` | Last insert position |

## Capital marks = global marks

\`mA\` sets a **global** mark you can jump to from *any* file with \`'A\`.

---
*Next lesson → Registers: "a y "a p*`
  },
  {
    id: "l14",
    chapter: "🚀 Intermediate",
    title: "Registers: yank to named registers",
    xp: 200,
    commands: ["\"", "\"a", "\"ay", "\"ap"],
    content: `# Registers — Multiple Clipboards 📋

## Using Registers

| Command | Does |
|---------|------|
| \`"ayy\` | Yank current line into register \`a\` |
| \`"ap\` | Paste from register \`a\` |
| \`"bdd\` | Delete line into register \`b\` |
| \`:reg\` | Show all registers and their contents |

## Special Registers

| Register | Contains |
|----------|---------|
| \`""\` | Default — last d/c/y |
| \`"0\` | Last **yank** only (not deletes!) |
| \`"+\` | **System clipboard** |
| \`"%\` | Current **filename** |
| \`":\` | Last **command** typed |

## Practical tip

When you delete something and it overwrites your clipboard:
Use \`"0p\` to paste what you **yanked** (before the delete).

\`"+yy\` — yank current line to system clipboard
\`"+p\` — paste from system clipboard

---
*Next lesson → Macros: record and replay*`
  },
  {
    id: "l15",
    chapter: "🚀 Intermediate",
    title: "Macros: record and replay",
    xp: 250,
    commands: ["q", "@", "@@"],
    content: `# Macros — Automation Superpowers 🤖

## Recording a Macro

1. \`q{register}\` — start recording (e.g. \`qa\`)
2. Do your editing commands
3. \`q\` — stop recording

## Playing Back a Macro

| Command | Does |
|---------|------|
| \`@a\` | Play macro in register \`a\` |
| \`@@\` | Replay the last macro |
| \`5@a\` | Play macro \`a\` five times |

## Real-world example

You have 10 lines like \`name: john\` and want \`const name = "john";\`:

1. Move to first line, press \`qa\`
2. \`0cw\` → type \`const\` → \`Esc\`
3. Navigate to "john", press \`i"\` then \`Esc\`, then \`A";\` then \`Esc\`
4. \`j\` to move to next line
5. \`q\` to stop recording
6. \`9@a\` to replay on 9 more lines!

---
*🎉 Intermediate complete! Next → Advanced Vim*`
  },
  {
    id: "l16",
    chapter: "🏆 Advanced",
    title: "Search & Replace: :s and :%s",
    xp: 300,
    commands: ["/", "?", "n", "N", ":s", ":%s"],
    content: `# Search & Replace 🔎

## Searching

| Command | Does |
|---------|------|
| \`/{pattern}\` | Search **forward** |
| \`?{pattern}\` | Search **backward** |
| \`n\` | Next match |
| \`N\` | Previous match |
| \`*\` | Search word under cursor (forward) |
| \`#\` | Search word under cursor (backward) |

## Substitution

\`:s/{old}/{new}/\` — Replace first match on current line
\`:s/{old}/{new}/g\` — Replace all on current line
\`:%s/{old}/{new}/g\` — Replace all in file
\`:%s/{old}/{new}/gc\` — Replace all, **confirm each** one
\`:%s/{old}/{new}/gi\` — Case-insensitive replace

## Practical examples

\`\`\`vim
:%s/const/let/g          " replace all const with let
:%s/foo/bar/gc           " replace foo with bar, confirm each
:5,20s/old/new/g         " only on lines 5-20
\`\`\`

---
*Next lesson → Splits & Tabs*`
  },
  {
    id: "l17",
    chapter: "🏆 Advanced",
    title: "Splits & Tabs: :sp :vsp :tabnew",
    xp: 275,
    commands: [":sp", ":vsp", "ctrl+w", ":tabnew"],
    content: `# Splits and Tabs 🪟

## Creating Splits

| Command | Does |
|---------|------|
| \`:sp {file}\` | Horizontal split |
| \`:vsp {file}\` | Vertical split |
| \`Ctrl+w s\` | Split current window horizontally |
| \`Ctrl+w v\` | Split current window vertically |

## Navigating Between Splits

\`Ctrl+w\` then \`h/j/k/l\` — move between splits (same as cursor keys!)
\`Ctrl+w w\` — cycle through splits

## Resizing

\`Ctrl+w =\` — make all splits equal size
\`Ctrl+w >\` / \`<\` — resize width
\`Ctrl+w +\` / \`-\` — resize height

## Tabs

| Command | Does |
|---------|------|
| \`:tabnew\` | Open a new tab |
| \`gt\` | Next tab |
| \`gT\` | Previous tab |
| \`:tabclose\` | Close current tab |

---
*Next lesson → The dot command*`
  },
  {
    id: "l18",
    chapter: "🏆 Advanced",
    title: "The dot command: repeat last change",
    xp: 300,
    commands: ["."],
    content: `# The Dot Command — Vim's Hidden Gem 💎

The \`.\` command repeats your **last change**. Deceptively simple, incredibly powerful.

## Examples

**Add semicolons to multiple lines:**
1. \`A;\` then \`Esc\` — add semicolon to end of line
2. \`j.\` — move down, repeat!
3. Keep pressing \`j.\` for each line

**Smart find-and-replace with confirmation:**
1. \`/old_function\` — search
2. \`cw\` then type \`new_function\` then \`Esc\`
3. \`n.\` \`n.\` \`n.\` — jump to each match and replace!

## The Dot Formula

Design your edits so \`.\` works perfectly on the next target.

Instead of: \`i# \` then Esc (inserts at cursor position only)
Use: \`I# \` then Esc (inserts at line start → \`.\` repeats perfectly on next line)

---
*🏆 You've mastered Vim! Check out the Games section to test your skills!*`
  }
];

module.exports = { LESSONS };
