const LESSONS = {
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1: The Vim Philosophy',
      icon: '🧠',
      color: '#6366f1',
      lessons: [
        {
          id: 'l1-what-is-vim',
          title: 'What is Vim?',
          xp: 50,
          duration: '5 min',
          difficulty: 'Beginner',
          theory: `
# What is Vim?

Vim is a **highly configurable text editor** built to enable efficient text editing. It is an improved version of the vi editor distributed with most UNIX systems.

## Why Learn Vim?

- **Speed**: Edit text at the speed of thought
- **Available everywhere**: On any Unix-like system
- **Keyboard-driven**: Never touch the mouse again
- **Composable**: Commands combine like words in a language
- **Modal**: Different modes for different tasks

## The Vim Philosophy

Vim operates on the idea that **most time is spent editing, not inserting new text**. It separates the act of:
- 🔍 **Navigation** — moving around code
- ✏️ **Editing** — changing text
- 📝 **Insertion** — typing new text

## Vim vs Other Editors

| Feature | Vim | VS Code | Nano |
|---------|-----|---------|------|
| Modal editing | ✅ | ❌ | ❌ |
| Available on all Unix | ✅ | ❌ | ✅ |
| Keyboard-only efficient | ✅ | Partial | ❌ |
| Composable commands | ✅ | ❌ | ❌ |
          `,
          quiz: [
            {
              question: "What is Vim?",
              options: ["A game engine", "A highly configurable text editor", "A programming language", "A web browser"],
              answer: 1,
              explanation: "Vim is a highly configurable text editor built for efficient text editing."
            },
            {
              question: "Vim is based on which older editor?",
              options: ["emacs", "nano", "vi", "ed"],
              answer: 2,
              explanation: "Vim stands for 'Vi IMproved' — it's an enhanced version of the vi editor."
            },
            {
              question: "Which of these best describes Vim's philosophy?",
              options: ["Mouse-first editing", "Keyboard-driven, modal editing", "Cloud-based collaboration", "GUI-first design"],
              answer: 1,
              explanation: "Vim's philosophy is keyboard-driven modal editing — different modes for different tasks."
            }
          ]
        },
        {
          id: 'l1-modes',
          title: 'Vim Modes Explained',
          xp: 75,
          duration: '8 min',
          difficulty: 'Beginner',
          theory: `
# Vim Modes

Vim is a **modal editor** — it has different modes, and each mode interprets keystrokes differently.

## The 4 Main Modes

### 📝 Normal Mode (default)
The starting mode. Used for navigation and commands.
- Press \`Esc\` to return here from any mode
- This is where you spend MOST of your time

### ✏️ Insert Mode
Type text like a regular editor.
- Enter with: \`i\`, \`I\`, \`a\`, \`A\`, \`o\`, \`O\`
- Exit with: \`Esc\`

### 👁️ Visual Mode
Select text visually.
- \`v\` — character-wise selection
- \`V\` — line-wise selection
- \`Ctrl+v\` — block selection

### : Command Mode (Ex Mode)
Run Vim commands.
- Enter with: \`:\`
- Example: \`:w\` to save, \`:q\` to quit

## Mode Transitions

\`\`\`
         i, a, o
Normal ──────────→ Insert
       ←────────── Esc
          
       :          v/V/Ctrl+v
Normal → Command  Normal → Visual
          `,
          quiz: [
            {
              question: "In which mode does Vim start?",
              options: ["Insert Mode", "Visual Mode", "Normal Mode", "Command Mode"],
              answer: 2,
              explanation: "Vim always starts in Normal Mode — the mode for navigation and commands."
            },
            {
              question: "How do you enter Insert Mode?",
              options: ["Press Esc", "Press i", "Press v", "Press :"],
              answer: 1,
              explanation: "Pressing 'i' enters Insert Mode at the current cursor position."
            },
            {
              question: "Which key exits any mode and returns to Normal Mode?",
              options: ["Enter", "Ctrl+C", "Esc", "q"],
              answer: 2,
              explanation: "The Escape key (Esc) always returns you to Normal Mode."
            },
            {
              question: "Which key starts Visual Line mode?",
              options: ["v", "V", "Ctrl+v", "Ctrl+V"],
              answer: 1,
              explanation: "Capital V (Shift+v) starts Visual Line mode, selecting entire lines."
            }
          ]
        }
      ]
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2: Navigation Mastery',
      icon: '🧭',
      color: '#8b5cf6',
      lessons: [
        {
          id: 'l2-basic-movement',
          title: 'Basic Movement (hjkl)',
          xp: 80,
          duration: '10 min',
          difficulty: 'Beginner',
          theory: `
# Basic Movement Keys

The most fundamental Vim skill is moving around without arrow keys!

## The HJKL Keys

\`\`\`
         k (up)
h (left)   l (right)
         j (down)
\`\`\`

| Key | Direction | Mnemonic |
|-----|-----------|----------|
| \`h\` | Left | h is on the left of hjkl |
| \`j\` | Down | j has a descending tail (goes down) |
| \`k\` | Up | k reaches up |
| \`l\` | Right | l is on the right of hjkl |

## Why Not Arrow Keys?

1. Your fingers stay on the **home row**
2. Works on any terminal
3. Combines with counts: \`5j\` moves 5 lines down
4. Encourages learning better motion commands

## Counting Moves

You can prefix any motion with a **count**:
- \`3h\` — move 3 characters left
- \`10j\` — move 10 lines down  
- \`5l\` — move 5 characters right

## Practice Challenge

Try to navigate a file using ONLY hjkl. No arrow keys allowed! 🎯
          `,
          quiz: [
            {
              question: "Which key moves the cursor DOWN in Normal Mode?",
              options: ["h", "k", "j", "l"],
              answer: 2,
              explanation: "j moves down. Think of the j key having a tail that points downward."
            },
            {
              question: "What does '5k' do?",
              options: ["Moves 5 characters right", "Moves up 5 lines", "Deletes 5 lines", "Inserts the number 5"],
              answer: 1,
              explanation: "Prefixing a motion with a number repeats it. 5k moves up 5 lines."
            }
          ]
        },
        {
          id: 'l2-word-movement',
          title: 'Word & Line Movement',
          xp: 100,
          duration: '12 min',
          difficulty: 'Beginner',
          theory: `
# Word and Line Navigation

Move faster than character by character!

## Word Motions

| Key | Motion |
|-----|--------|
| \`w\` | Forward to start of **next word** |
| \`b\` | **Back** to start of previous word |
| \`e\` | Forward to **end** of current/next word |
| \`W\` | Forward to start of next WORD (ignores punctuation) |
| \`B\` | Back to start of previous WORD |
| \`E\` | End of current/next WORD |

> **Word vs WORD**: A word is separated by non-word characters. A WORD is separated only by whitespace.

## Line Navigation

| Key | Motion |
|-----|--------|
| \`0\` | Beginning of line |
| \`^\` | First non-blank character of line |
| \`$\` | End of line |
| \`gg\` | Go to first line of file |
| \`G\` | Go to last line of file |
| \`50G\` or \`:50\` | Go to line 50 |
| \`%\` | Jump to matching bracket |

## Screen Navigation

| Key | Motion |
|-----|--------|
| \`Ctrl+d\` | Scroll **d**own half page |
| \`Ctrl+u\` | Scroll **u**p half page |
| \`Ctrl+f\` | Scroll **f**orward (full page) |
| \`Ctrl+b\` | Scroll **b**ackward (full page) |
| \`H\` | Move cursor to **H**igh (top) of screen |
| \`M\` | Move cursor to **M**iddle of screen |
| \`L\` | Move cursor to **L**ow (bottom) of screen |
          `,
          quiz: [
            {
              question: "Which key moves to the END of the current line?",
              options: ["0", "^", "$", "G"],
              answer: 2,
              explanation: "$ (dollar sign) moves to the end of the line."
            },
            {
              question: "Which key moves to the FIRST LINE of the file?",
              options: ["g", "gg", "G", "0"],
              answer: 1,
              explanation: "gg (lowercase g twice) moves to the first line. G moves to the LAST line."
            },
            {
              question: "What does 'w' do?",
              options: ["Write (save) file", "Move to next word", "Move back a word", "Delete word"],
              answer: 1,
              explanation: "In Normal mode, w moves forward to the start of the next word."
            }
          ]
        },
        {
          id: 'l2-search-navigation',
          title: 'Search & Jump Navigation',
          xp: 110,
          duration: '10 min',
          difficulty: 'Intermediate',
          theory: `
# Search and Character Navigation

## Character Search (Same Line)

| Key | Action |
|-----|--------|
| \`f{char}\` | **F**ind next char on current line |
| \`F{char}\` | Find previous char on current line |
| \`t{char}\` | Move un**t**il (before) next char |
| \`T{char}\` | Move until (before) previous char |
| \`;\` | Repeat last f/F/t/T search forward |
| \`,\` | Repeat last f/F/t/T search backward |

### Example: \`fa\` moves to next 'a' on the line

## File-wide Search

| Key | Action |
|-----|--------|
| \`/{pattern}\` | Search **forward** for pattern |
| \`?{pattern}\` | Search **backward** for pattern |
| \`n\` | **N**ext match |
| \`N\` | Previous match (opposite direction) |
| \`*\` | Search for word under cursor (forward) |
| \`#\` | Search for word under cursor (backward) |

## Jump Navigation

| Key | Action |
|-----|--------|
| \`Ctrl+o\` | Jump to **older** position in jump list |
| \`Ctrl+i\` | Jump to **newer** position |
| \`gd\` | **G**o to local **d**efinition |
| \`''\` (two apostrophes) | Jump to last jump position |
          `,
          quiz: [
            {
              question: "What does 'fa' do?",
              options: ["Find all occurrences", "Move to next 'a' on the current line", "Move forward and append", "Search backward for 'a'"],
              answer: 1,
              explanation: "f{char} moves the cursor to the next occurrence of that character on the current line."
            },
            {
              question: "How do you search forward for 'hello'?",
              options: ["?hello", "/hello", "fhello", "shello"],
              answer: 1,
              explanation: "/ starts a forward search. Type /hello and press Enter to search."
            },
            {
              question: "After searching, which key goes to the NEXT match?",
              options: ["N", "n", "Enter", "f"],
              answer: 1,
              explanation: "n moves to the next match in the search direction. N goes to the previous match."
            }
          ]
        }
      ]
    },
    {
      id: 'chapter-3',
      title: 'Chapter 3: Editing Superpowers',
      icon: '⚡',
      color: '#ec4899',
      lessons: [
        {
          id: 'l3-insert-modes',
          title: 'All Ways to Enter Insert Mode',
          xp: 90,
          duration: '10 min',
          difficulty: 'Beginner',
          theory: `
# Insert Mode Entry Points

There are MANY ways to enter Insert Mode, each with a different starting position!

## Insert Commands

| Key | Behavior |
|-----|----------|
| \`i\` | Insert **before** cursor |
| \`I\` | Insert at **beginning** of line |
| \`a\` | **Append** after cursor |
| \`A\` | Append at **end** of line |
| \`o\` | Open new line **below** and insert |
| \`O\` | Open new line **above** and insert |
| \`s\` | **S**ubstitute character (delete & insert) |
| \`S\` | Substitute entire line |
| \`C\` | Change from cursor to end of line |
| \`cc\` | Change entire current line |

## Choosing the Right Entry Point

**Scenario**: Cursor is in the middle of a word, you want to add at end of line
→ Use **A** (capital A)

**Scenario**: You want to add a new blank line below current and type
→ Use **o** (lowercase o)

**Scenario**: You want to replace the rest of the line from cursor
→ Use **C** (capital C)

## The Mnemonic

- Lowercase = near cursor
- Uppercase = bigger jump (line start/end, new line above)
          `,
          quiz: [
            {
              question: "Which key inserts at the BEGINNING of the current line?",
              options: ["i", "I", "a", "A"],
              answer: 1,
              explanation: "I (capital i) moves to the first non-blank character and enters Insert Mode."
            },
            {
              question: "Which key opens a new line BELOW the current line?",
              options: ["O", "o", "A", "a"],
              answer: 1,
              explanation: "o (lowercase) opens a new line below and enters Insert Mode. O opens above."
            }
          ]
        },
        {
          id: 'l3-delete-change',
          title: 'Delete & Change Commands',
          xp: 120,
          duration: '15 min',
          difficulty: 'Intermediate',
          theory: `
# Delete and Change Commands

## The Operator + Motion Pattern

Vim's editing power comes from combining **operators** with **motions**:

\`operator + motion = action\`

### Delete Operator: \`d\`

| Command | Action |
|---------|--------|
| \`dw\` | Delete word |
| \`d$\` or \`D\` | Delete to end of line |
| \`d0\` | Delete to beginning of line |
| \`dd\` | Delete entire line |
| \`3dd\` | Delete 3 lines |
| \`dG\` | Delete from cursor to end of file |
| \`dgg\` | Delete from cursor to start of file |
| \`diw\` | Delete **i**nner **w**ord (without spaces) |
| \`daw\` | Delete **a** word (with surrounding spaces) |

### Change Operator: \`c\`
Change = Delete + Enter Insert Mode

| Command | Action |
|---------|--------|
| \`cw\` | Change word |
| \`c$\` or \`C\` | Change to end of line |
| \`cc\` | Change entire line |
| \`ciw\` | Change inner word |
| \`ci"\` | Change inside quotes |
| \`ci(\` | Change inside parentheses |

### Text Objects (The Secret Weapon!)

\`i\` = inner (excludes delimiters)
\`a\` = a/around (includes delimiters)

| Object | Description |
|--------|-------------|
| \`iw\` | inner word |
| \`aw\` | a word |
| \`i"\` | inside double quotes |
| \`a"\` | around double quotes |
| \`i(\` | inside parentheses |
| \`a(\` | around parentheses |
| \`i{\` | inside curly braces |
| \`it\` | inside HTML tag |
          `,
          quiz: [
            {
              question: "What does 'dw' do?",
              options: ["Delete window", "Delete word", "Delete to end of line", "Duplicate word"],
              answer: 1,
              explanation: "dw deletes from the cursor to the start of the next word."
            },
            {
              question: "What does 'ci\"' do?",
              options: ["Change inside quotes", "Copy inside quotes", "Create inline quote", "Count instances of quotes"],
              answer: 0,
              explanation: "ci\" changes (deletes and enters insert mode) the text inside double quotes."
            },
            {
              question: "What is the difference between 'd' and 'c'?",
              options: ["No difference", "d deletes, c copies", "d deletes, c deletes and enters insert mode", "c is for commands only"],
              answer: 2,
              explanation: "d deletes text and stays in Normal mode. c deletes text and enters Insert mode."
            }
          ]
        },
        {
          id: 'l3-yank-paste',
          title: 'Copy (Yank) & Paste',
          xp: 100,
          duration: '10 min',
          difficulty: 'Intermediate',
          theory: `
# Yank (Copy) and Paste

In Vim, copying is called **yanking**.

## Yank Commands

| Command | Action |
|---------|--------|
| \`yy\` or \`Y\` | Yank (copy) entire line |
| \`yw\` | Yank word |
| \`y$\` | Yank to end of line |
| \`yiw\` | Yank inner word |
| \`y3j\` | Yank 3 lines down |
| \`yG\` | Yank to end of file |

## Paste Commands

| Command | Action |
|---------|--------|
| \`p\` | **P**aste after cursor |
| \`P\` | Paste before cursor |
| \`gp\` | Paste after, move cursor to end of paste |
| \`gP\` | Paste before, move cursor to end |

## Registers

Vim has multiple **registers** (clipboard slots)!

| Register | Use |
|----------|-----|
| \`""\` | Default register (unnamed) |
| \`"a\` to \`"z\` | Named registers |
| \`"0\` | Last yank |
| \`"+\` | System clipboard |
| \`"*\` | Primary selection (Linux) |
| \`"_\` | Black hole (discard) |

### Using Registers
\`"ayy\` — yank line into register a
\`"ap\` — paste from register a
\`"+y\` — yank to system clipboard
\`"+p\` — paste from system clipboard

## The Dot Command

\`.\` (dot) — repeats the last change!
This is incredibly powerful for repetitive edits.
          `,
          quiz: [
            {
              question: "In Vim, copying text is called?",
              options: ["Copying", "Yanking", "Pulling", "Grabbing"],
              answer: 1,
              explanation: "In Vim, copying is called 'yanking'. The command is y."
            },
            {
              question: "How do you paste BEFORE the cursor?",
              options: ["p", "P", "Ctrl+v", "pu"],
              answer: 1,
              explanation: "P (capital P) pastes before the cursor. p (lowercase) pastes after."
            },
            {
              question: "How do you copy to the system clipboard?",
              options: ["Ctrl+c", "\"+y", "\"sy", "sy"],
              answer: 1,
              explanation: "\"+y yanks to the system clipboard register (+). Then you can paste with \"+p or Ctrl+v."
            }
          ]
        },
        {
          id: 'l3-undo-redo',
          title: 'Undo, Redo & Repeat',
          xp: 70,
          duration: '7 min',
          difficulty: 'Beginner',
          theory: `
# Undo, Redo, and the Power of Dot

## Undo & Redo

| Command | Action |
|---------|--------|
| \`u\` | Undo last change |
| \`U\` | Undo all changes on current line |
| \`Ctrl+r\` | Redo |
| \`5u\` | Undo 5 times |

## Persistent Undo

Vim supports **persistent undo** — you can undo even after closing and reopening a file!
Add to your .vimrc:
\`\`\`vim
set undofile
set undodir=~/.vim/undodir
\`\`\`

## The Dot Command (Most Important!)

\`.\` (period) repeats the **last change** including:
- Last text typed in insert mode
- Last deletion
- Last complex change

### Dot Command Example
1. \`ciw\` + type "hello" → changes word to "hello"
2. Move to next word
3. Press \`.\` → changes that word to "hello" too!

This is the **fundamental VIM workflow**:
make a change → use motions to get to next place → press \`.\`
          `,
          quiz: [
            {
              question: "What does pressing 'u' do?",
              options: ["Opens a file", "Undoes the last change", "Enters unicode mode", "Moves up"],
              answer: 1,
              explanation: "u undoes the last change. You can press it multiple times to undo further."
            },
            {
              question: "How do you redo an undone change?",
              options: ["Ctrl+r", "Ctrl+y", "r", "R"],
              answer: 0,
              explanation: "Ctrl+r redoes the last undone change."
            },
            {
              question: "What does the '.' (dot) command do?",
              options: ["Enters command mode", "Repeats the last change", "Moves to end of sentence", "Inserts a period"],
              answer: 1,
              explanation: "The dot command is one of Vim's most powerful features — it repeats the last change."
            }
          ]
        }
      ]
    },
    {
      id: 'chapter-4',
      title: 'Chapter 4: Advanced Motions',
      icon: '🚀',
      color: '#f59e0b',
      lessons: [
        {
          id: 'l4-marks',
          title: 'Marks & Jumps',
          xp: 130,
          duration: '12 min',
          difficulty: 'Intermediate',
          theory: `
# Marks — Bookmarks in Vim

Marks allow you to **bookmark positions** in your file.

## Setting Marks

| Command | Action |
|---------|--------|
| \`ma\` | Set mark **a** at current position |
| \`mA\` | Set global mark A (works across files) |

## Jumping to Marks

| Command | Action |
|---------|--------|
| \`'a\` | Jump to line of mark **a** |
| \`\`a\` (backtick a) | Jump to exact position of mark **a** |
| \`'A\` | Jump to global mark A (in that file) |
| \`''\` | Jump to last jump position |
| \`'.\` | Jump to position of last change |
| \`'^\` | Jump to last insert mode position |

## Automatic Marks

Vim sets these automatically:

| Mark | Meaning |
|------|---------|
| \`''\` | Previous jump location |
| \`'.\` | Last edited position |
| \`'^\` | Last insert mode exit |
| \`'[\` | Start of last change or yank |
| \`']\` | End of last change or yank |

## Practical Use

1. Set mark before jumping to a definition: \`ma\`
2. Jump to definition: \`gd\`
3. Read the code
4. Return: \`'a\`
          `,
          quiz: [
            {
              question: "How do you set mark 'a' at the current cursor position?",
              options: ["'a", "\`a", "ma", ":mark a"],
              answer: 2,
              explanation: "ma sets mark a at the current position. Think 'm' for 'mark'."
            },
            {
              question: "What is the difference between 'a and `a?",
              options: ["No difference", "'a jumps to the line, `a jumps to exact position", "'a jumps to exact position, `a to line", "'a is global, `a is local"],
              answer: 1,
              explanation: "'a (apostrophe) jumps to the LINE of the mark. `a (backtick) jumps to the exact column."
            }
          ]
        },
        {
          id: 'l4-macros',
          title: 'Macros — Automate Repetition',
          xp: 160,
          duration: '15 min',
          difficulty: 'Advanced',
          theory: `
# Macros — Record & Replay

Macros let you **record a sequence of commands** and replay them.

## Recording a Macro

1. \`q{register}\` — Start recording into register (a-z)
2. ... do your editing ...
3. \`q\` — Stop recording

## Playing a Macro

| Command | Action |
|---------|--------|
| \`@a\` | Play macro from register **a** |
| \`@@\` | Replay last macro |
| \`10@a\` | Play macro 10 times |

## Practical Example

**Task**: Add a semicolon to the end of 100 lines

1. Go to first line
2. \`qa\` — start recording into register a
3. \`A;\` — append semicolon at end of line
4. \`j\` — move down one line
5. \`q\` — stop recording
6. \`99@a\` — replay 99 more times!

## Editing Macros

Macros are stored in registers, so you can:
1. \`"ap\` — paste macro a to edit it
2. Edit the text
3. \`"ayy\` — yank it back into register a

## Tips

- Always end macro with a navigation command (like \`j\`)
- Test macro on 1 line before running on 100
- Use \`Ctrl+c\` to stop a runaway macro
          `,
          quiz: [
            {
              question: "How do you start recording a macro into register 'a'?",
              options: ["ma", "ra", "qa", "@a"],
              answer: 2,
              explanation: "q starts recording, followed by the register letter. qa records into register a."
            },
            {
              question: "How do you replay the macro in register 'a'?",
              options: ["qa", "@a", "ra", "play a"],
              answer: 1,
              explanation: "@a plays the macro stored in register a. @@ replays the last macro."
            },
            {
              question: "How do you play a macro 50 times?",
              options: ["50 @a", "50@a", "@a 50", "@50a"],
              answer: 1,
              explanation: "Prefix the @a command with a count: 50@a plays the macro 50 times."
            }
          ]
        }
      ]
    },
    {
      id: 'chapter-5',
      title: 'Chapter 5: Files & Windows',
      icon: '🗂️',
      color: '#10b981',
      lessons: [
        {
          id: 'l5-file-ops',
          title: 'File Operations',
          xp: 100,
          duration: '12 min',
          difficulty: 'Beginner',
          theory: `
# File Operations in Vim

## Saving & Quitting

| Command | Action |
|---------|--------|
| \`:w\` | **W**rite (save) file |
| \`:w filename\` | Save as filename |
| \`:q\` | **Q**uit |
| \`:q!\` | Quit without saving (force) |
| \`:wq\` or \`:x\` or \`ZZ\` | Save and quit |
| \`:wq!\` | Force save and quit |
| \`ZQ\` | Quit without saving |

## Opening Files

| Command | Action |
|---------|--------|
| \`:e filename\` | **E**dit (open) file |
| \`:e .\` | Open file browser |
| \`:r filename\` | **R**ead file into current buffer |
| \`:r !command\` | Read output of shell command |

## Multiple Buffers

| Command | Action |
|---------|--------|
| \`:ls\` or \`:buffers\` | **L**i**s**t all open buffers |
| \`:bn\` | **N**ext buffer |
| \`:bp\` | **P**revious buffer |
| \`:b3\` | Switch to buffer 3 |
| \`:b filename\` | Switch to buffer by name |
| \`:bd\` | **D**elete (close) current buffer |
| \`:bda\` | Delete all buffers |

## File Navigation

| Command | Action |
|---------|--------|
| \`:cd path\` | Change directory |
| \`:pwd\` | Show current directory |
| \`gf\` | **G**o to **F**ile under cursor |
| \`Ctrl+^\` | Switch to alternate file |
          `,
          quiz: [
            {
              question: "How do you save a file in Vim?",
              options: ["Ctrl+s", ":s", ":w", ":save"],
              answer: 2,
              explanation: ":w writes (saves) the file. You can also use :wq to save and quit."
            },
            {
              question: "How do you quit Vim without saving?",
              options: [":q", ":q!", ":exit", "Ctrl+q"],
              answer: 1,
              explanation: ":q! forces quit without saving. :q will fail if there are unsaved changes."
            },
            {
              question: "How do you open a file called 'main.py'?",
              options: [":open main.py", ":e main.py", ":o main.py", ":file main.py"],
              answer: 1,
              explanation: ":e (edit) opens a file. :e main.py opens main.py for editing."
            }
          ]
        },
        {
          id: 'l5-splits',
          title: 'Splits & Windows',
          xp: 120,
          duration: '12 min',
          difficulty: 'Intermediate',
          theory: `
# Split Windows in Vim

Vim allows you to split the screen to edit multiple files simultaneously!

## Creating Splits

| Command | Action |
|---------|--------|
| \`:split\` or \`:sp\` | Split horizontally |
| \`:vsplit\` or \`:vs\` | Split vertically |
| \`:sp filename\` | Horizontal split with file |
| \`:vs filename\` | Vertical split with file |
| \`Ctrl+w s\` | Split horizontally |
| \`Ctrl+w v\` | Split vertically |

## Navigating Splits

| Command | Action |
|---------|--------|
| \`Ctrl+w h\` | Move to window on **left** |
| \`Ctrl+w j\` | Move to window **below** |
| \`Ctrl+w k\` | Move to window **above** |
| \`Ctrl+w l\` | Move to window on **right** |
| \`Ctrl+w w\` | Cycle through windows |
| \`Ctrl+w p\` | Switch to **p**revious window |

## Resizing Splits

| Command | Action |
|---------|--------|
| \`Ctrl+w +\` | Increase height |
| \`Ctrl+w -\` | Decrease height |
| \`Ctrl+w >\` | Increase width |
| \`Ctrl+w <\` | Decrease width |
| \`Ctrl+w =\` | Make all windows equal size |

## Closing Splits

| Command | Action |
|---------|--------|
| \`:q\` or \`Ctrl+w q\` | Close current window |
| \`Ctrl+w o\` | Close all other windows (keep only current) |

## Tabs (Different from Splits)

| Command | Action |
|---------|--------|
| \`:tabnew\` | Open new tab |
| \`gt\` | Go to next tab |
| \`gT\` | Go to previous tab |
| \`:tabc\` | Close current tab |
          `,
          quiz: [
            {
              question: "How do you create a vertical split?",
              options: [":split", ":vsplit", "Ctrl+w h", ":vert"],
              answer: 1,
              explanation: ":vsplit (or :vs) creates a vertical split. :split creates a horizontal one."
            },
            {
              question: "After splitting, how do you move to the window on the right?",
              options: ["Ctrl+w r", "Ctrl+w l", "Ctrl+w →", ":right"],
              answer: 1,
              explanation: "Ctrl+w l moves to the window on the right (mirroring the hjkl navigation)."
            }
          ]
        }
      ]
    },
    {
      id: 'chapter-6',
      title: 'Chapter 6: Search & Replace',
      icon: '🔍',
      color: '#ef4444',
      lessons: [
        {
          id: 'l6-search-replace',
          title: 'Search & Replace Mastery',
          xp: 140,
          duration: '15 min',
          difficulty: 'Intermediate',
          theory: `
# Search and Replace in Vim

## Basic Substitution

\`\`\`
:s/old/new/        - Replace first occurrence on current line
:s/old/new/g       - Replace ALL on current line
:%s/old/new/g      - Replace ALL in file
:%s/old/new/gc     - Replace all, ask confirmation each
:5,10s/old/new/g   - Replace in lines 5-10
:'<,'>s/old/new/g  - Replace in visual selection
\`\`\`

## Flags

| Flag | Meaning |
|------|---------|
| \`g\` | **G**lobal (all occurrences on line) |
| \`c\` | **C**onfirm each replacement |
| \`i\` | Case **i**nsensitive |
| \`I\` | Case sensitive (override ignorecase) |
| \`n\` | Show count without replacing |

## Regex in Vim

| Pattern | Matches |
|---------|---------|
| \`.\` | Any character |
| \`*\` | Zero or more of previous |
| \`\\+\` | One or more of previous |
| \`\\?\` | Zero or one of previous |
| \`^\` | Start of line |
| \`$\` | End of line |
| \`\\w\` | Word character |
| \`\\d\` | Digit |
| \`\\s\` | Whitespace |
| \`[abc]\` | Character class |
| \`\\(\\)\` | Capture group |
| \`\\1\` | Back reference to group 1 |

## Practical Examples

\`\`\`vim
" Remove trailing whitespace
:%s/\\s\\+$//e

" Replace word with confirmation
:%s/badword/goodword/gc

" Add semicolons at end of lines
:%s/$/;/

" Swap two words (using capture groups)
:%s/\\(foo\\)\\(bar\\)/\\2\\1/g

" Case insensitive replace
:%s/hello/world/gi
\`\`\`
          `,
          quiz: [
            {
              question: "How do you replace ALL occurrences of 'foo' with 'bar' in the entire file?",
              options: [":s/foo/bar/", ":%s/foo/bar/", ":%s/foo/bar/g", ":replace foo bar"],
              answer: 2,
              explanation: ":%s/foo/bar/g — % means whole file, g flag means all occurrences per line."
            },
            {
              question: "Which flag asks for confirmation before each replacement?",
              options: ["g", "i", "c", "n"],
              answer: 2,
              explanation: "The c flag (confirm) prompts you before each replacement with y/n/a/q options."
            }
          ]
        }
      ]
    },
    {
      id: 'chapter-7',
      title: 'Chapter 7: Vim Configuration',
      icon: '⚙️',
      color: '#64748b',
      lessons: [
        {
          id: 'l7-vimrc',
          title: 'Configuring Your .vimrc',
          xp: 150,
          duration: '20 min',
          difficulty: 'Intermediate',
          theory: `
# The .vimrc — Your Vim Configuration

The \`.vimrc\` file is Vim's configuration file, located at:
- Linux/Mac: \`~/.vimrc\`
- Windows: \`~/_vimrc\`

## Essential Settings

\`\`\`vim
" Basic Settings
set nocompatible          " Use Vim defaults, not Vi
set number                " Show line numbers
set relativenumber        " Relative line numbers
set cursorline            " Highlight current line
set showcmd               " Show command in status bar
set showmatch             " Highlight matching brackets
set ruler                 " Show cursor position
set laststatus=2          " Always show status line

" Indentation
set autoindent            " Auto-indent new lines
set smartindent           " Smart indentation
set tabstop=4             " Tab width = 4 spaces
set shiftwidth=4          " Indent width = 4 spaces
set expandtab             " Use spaces instead of tabs

" Search
set hlsearch              " Highlight search results
set incsearch             " Search as you type
set ignorecase            " Case insensitive search
set smartcase             " Case sensitive if uppercase used

" Performance & Safety
set noswapfile            " No swap files
set undofile              " Persistent undo
set hidden                " Allow hidden buffers

" Visual
set wrap                  " Wrap long lines
set linebreak             " Break at word boundaries
syntax enable             " Enable syntax highlighting
set background=dark       " Dark background

" Filetype
filetype plugin indent on " Enable filetype plugins
\`\`\`

## Useful Mappings

\`\`\`vim
" Map leader key
let mapleader = " "       " Space as leader

" Quick save
nnoremap <leader>w :w<CR>

" Quick quit
nnoremap <leader>q :q<CR>

" Clear search highlight
nnoremap <leader>/ :nohlsearch<CR>

" Move lines up/down
nnoremap <A-j> :m .+1<CR>==
nnoremap <A-k> :m .-2<CR>==

" Better split navigation
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l

" Insert blank line without entering insert mode
nnoremap <leader>o o<Esc>
nnoremap <leader>O O<Esc>
\`\`\`

## Plugin Managers

1. **vim-plug** — Most popular, simple
2. **Vundle** — Good for beginners
3. **Pathogen** — Simple, manual

### vim-plug Example
\`\`\`vim
call plug#begin()
  Plug 'tpope/vim-sensible'
  Plug 'preservim/nerdtree'
  Plug 'junegunn/fzf.vim'
  Plug 'tpope/vim-fugitive'
call plug#end()
\`\`\`
          `,
          quiz: [
            {
              question: "Where is the .vimrc file located on Linux/Mac?",
              options: ["/etc/vimrc", "~/.vimrc", "~/.config/vim/init.vim", "/usr/local/etc/vimrc"],
              answer: 1,
              explanation: "The .vimrc is in your home directory: ~/.vimrc on Linux/Mac."
            },
            {
              question: "Which setting enables relative line numbers?",
              options: ["set linenumbers", "set relativenumber", "set rnu", "Both B and C are correct"],
              answer: 3,
              explanation: "Both 'set relativenumber' and 'set rnu' (abbreviated form) enable relative line numbers."
            }
          ]
        }
      ]
    }
  ]
};

module.exports = { LESSONS };
