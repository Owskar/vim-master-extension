# ⌨️ VimMaster — Learn Vim Interactively

> A VS Code extension that teaches Vim through gamified lessons, interactive quizzes, and mini-games. Built for developers who want to master the keyboard.

**Author:** [Owskar Ganbawale](https://github.com/Owskar)  
**Repository:** [github.com/Owskar/vim-master-extension](https://github.com/Owskar/vim-master-extension)  
**License:** MIT  

---

## GitHub Topics

When publishing to GitHub, add these topics to your repository:

```
vim  vi  vscode-extension  learn-vim  vim-tutorial  vim-keybindings
gamification  interactive-learning  education  developer-tools
vim-motions  vim-commands  vim-game  open-source  typescript-free
keyboard  productivity  text-editor  vscode  javascript
```

**How to add topics:**  
1. Go to your GitHub repo  
2. Click the ⚙️ gear icon next to "About"  
3. Add the topics above  

---

## Screenshots

| Dashboard | Games | Playground |
|-----------|-------|------------|
| Terminal-themed home | 4 interactive games | Vim-like editor |

---

## Features

### 📚 7 Learning Chapters · 18+ Lessons
Each lesson includes rich theory and an interactive quiz you must pass to earn XP.

| Chapter | Topics |
|---------|--------|
| 1 — The Vim Philosophy | What is Vim, modal editing, why Vim |
| 2 — Navigation Mastery | hjkl, word motion, search, jumps |
| 3 — Editing Superpowers | Insert modes, delete/change, yank/paste, undo |
| 4 — Advanced Motions | Marks, macros, registers |
| 5 — Files & Windows | Buffers, splits, tabs |
| 6 — Search & Replace | Regex, global substitution |
| 7 — Vim Configuration | .vimrc, mappings, plugins |

### 🎮 4 Vim Games

| Game | Description |
|------|-------------|
| 🏎️ Vim Racer | Type Vim command phrases as fast as you can — 60-second sprint |
| ⚔️ Command Combat | Multiple-choice quiz racing a 10-second timer. 3 lives. 18 questions |
| 🎯 Motion Master | Click motion buttons to navigate cursor to the target word |
| 🔫 Text Sniper | Type the exact Vim command to edit highlighted text |

### 🏆 Gamification System
- **XP & 20 Levels** — earn XP for every action, level up with titles
- **12 Badges** — streak badges, level milestones, skill achievements
- **Daily Challenges** — 7 rotating challenges with bonus XP
- **Game High Scores** — track your best scores per game

### 🧪 Interactive Playground
- Full modal Vim editor (Normal / Insert / Visual / Command modes)
- Real commands: `dd`, `yy`, `p`, `u`, `Ctrl+r`, `/`, `:%s`, macros
- 10 practice exercises with XP claim
- Command history log
- Live reference sidebar

### 📋 Cheat Sheet
100+ commands organized in 10 categories — always one click away.

---

## Installation

### Option A — Install VSIX (recommended)
```bash

code --install-extension vim-master-1.0.0.vsix
```
Restart VS Code → press `Ctrl+Shift+V` to open VimMaster.

### Option B — Development Mode
```bash
git clone https://github.com/Owskar/vim-master-extension
cd vim-master-extension
npm install
code .
# Press F5 → opens Extension Development Host window
```

### Build your own VSIX
```bash
npm install -g @vscode/vsce
vsce package --allow-missing-repository --skip-license
code --install-extension vim-master-1.0.0.vsix
```

> ⚠️ **Never run `node src/extension.js` directly.** The `vscode` module only exists inside VS Code's runtime. Always use F5 or install via VSIX.

---

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `VimMaster: Open Dashboard` | `Ctrl+Shift+V` | Main learning hub |
| `VimMaster: Play Vim Games` | — | Launch 4 Vim games |
| `VimMaster: Open Playground` | — | Interactive Vim editor |
| `VimMaster: Daily Challenge` | — | Daily XP challenges |
| `VimMaster: Cheat Sheet` | — | Command reference |
| `VimMaster: Reset Progress` | — | Start fresh |

All commands: `Ctrl+Shift+P` → type `VimMaster`

---

## XP & Level System

| Action | XP |
|--------|----|
| Complete lesson (first time) | +150 XP |
| Revisit lesson | +25 XP |
| Daily challenge | +150–300 XP |
| Playground exercise | +20–60 XP |
| Game score | XP ∝ score |

| Level | Title |
|-------|-------|
| 1–2 | Vim Newbie |
| 3–5 | Insert Mode Survivor |
| 6–9 | Normal Mode Ninja |
| 10–14 | Macro Maestro |
| 15–19 | Regex Warrior |
| 20+ | 🌟 Vim Grand Master |

---

## Project Structure

```
vim-master-extension/
├── src/
│   ├── extension.js              # Entry point, command registration
│   ├── panels/
│   │   ├── DashboardPanel.js     # Main learning UI (home, lessons, cheatsheet, daily, progress)
│   │   ├── GamesPanel.js         # 4 Vim games
│   │   └── PlaygroundPanel.js    # Interactive Vim-like editor
│   ├── providers/
│   │   └── ProgressProvider.js   # Activity bar sidebar widget
│   ├── data/
│   │   ├── lessons.js            # 7 chapters, 18+ lessons with quizzes
│   │   ├── cheatsheet.js         # 100+ commands in 10 categories
│   │   └── challenges.js         # 7 daily challenges
│   └── utils/
│       ├── StorageManager.js     # XP, levels, badges, persistence (globalState)
│       └── NotificationManager.js# Daily reminders, status bar messages
├── media/
│   ├── icon.png                  # Extension icon (128×128)
│   └── sidebar-icon.svg          # Activity bar icon
├── vim-master-1.0.0.vsix         # Pre-built, ready to install
├── package.json
├── LICENSE
└── README.md
```

---

## Contributing

Pull requests welcome! Open an issue first for major changes.

1. Fork the repo
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'add: my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a PR

---

## Author

**Owskar Ganbawale**  
GitHub: [@Owskar](https://github.com/Owskar)  
Repository: [vim-master-extension](https://github.com/Owskar/vim-master-extension)

---

## License

MIT License © 2024 Owskar Ganbawale

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so.

---

*"Learning Vim is like learning touch typing — painful for a week, transformative forever."*
