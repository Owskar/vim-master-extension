const CHEAT_SHEET = {
  categories: [
    {
      name: "Modes",
      color: "#6366f1",
      commands: [
        { keys: "Esc", desc: "Return to Normal Mode" },
        { keys: "i", desc: "Insert before cursor" },
        { keys: "I", desc: "Insert at line start" },
        { keys: "a", desc: "Append after cursor" },
        { keys: "A", desc: "Append at line end" },
        { keys: "o", desc: "Open line below" },
        { keys: "O", desc: "Open line above" },
        { keys: "v", desc: "Visual char mode" },
        { keys: "V", desc: "Visual line mode" },
        { keys: "Ctrl+v", desc: "Visual block mode" },
        { keys: ":", desc: "Command mode" }
      ]
    },
    {
      name: "Navigation",
      color: "#8b5cf6",
      commands: [
        { keys: "h j k l", desc: "Left, Down, Up, Right" },
        { keys: "w / b", desc: "Next / Prev word" },
        { keys: "e", desc: "End of word" },
        { keys: "0 / ^", desc: "Line start / first char" },
        { keys: "$", desc: "End of line" },
        { keys: "gg / G", desc: "File start / end" },
        { keys: ":{n}", desc: "Go to line n" },
        { keys: "Ctrl+d/u", desc: "Scroll down/up half" },
        { keys: "Ctrl+f/b", desc: "Scroll forward/back" },
        { keys: "H / M / L", desc: "Top/Mid/Bottom of screen" },
        { keys: "%", desc: "Jump to matching bracket" }
      ]
    },
    {
      name: "Editing",
      color: "#ec4899",
      commands: [
        { keys: "x", desc: "Delete character" },
        { keys: "X", desc: "Delete char before cursor" },
        { keys: "dd", desc: "Delete line" },
        { keys: "dw", desc: "Delete word" },
        { keys: "D", desc: "Delete to end of line" },
        { keys: "cc", desc: "Change line" },
        { keys: "cw", desc: "Change word" },
        { keys: "C", desc: "Change to end of line" },
        { keys: "r{c}", desc: "Replace char with c" },
        { keys: "R", desc: "Replace mode" },
        { keys: "u", desc: "Undo" },
        { keys: "Ctrl+r", desc: "Redo" },
        { keys: ".", desc: "Repeat last change" }
      ]
    },
    {
      name: "Copy & Paste",
      color: "#f59e0b",
      commands: [
        { keys: "yy", desc: "Yank (copy) line" },
        { keys: "yw", desc: "Yank word" },
        { keys: "y$", desc: "Yank to end of line" },
        { keys: "p", desc: "Paste after cursor" },
        { keys: "P", desc: "Paste before cursor" },
        { keys: "\"+y", desc: "Yank to clipboard" },
        { keys: "\"+p", desc: "Paste from clipboard" }
      ]
    },
    {
      name: "Search",
      color: "#10b981",
      commands: [
        { keys: "/{pattern}", desc: "Search forward" },
        { keys: "?{pattern}", desc: "Search backward" },
        { keys: "n / N", desc: "Next / prev match" },
        { keys: "*", desc: "Search word under cursor" },
        { keys: "f{c}", desc: "Find char on line" },
        { keys: "F{c}", desc: "Find char backward" },
        { keys: ";", desc: "Repeat char search" }
      ]
    },
    {
      name: "Replace",
      color: "#ef4444",
      commands: [
        { keys: ":s/old/new/", desc: "Replace on current line" },
        { keys: ":%s/old/new/g", desc: "Replace all in file" },
        { keys: ":%s/old/new/gc", desc: "Replace with confirm" },
        { keys: ":%s/old/new/gi", desc: "Case insensitive" }
      ]
    },
    {
      name: "Files & Buffers",
      color: "#64748b",
      commands: [
        { keys: ":w", desc: "Save file" },
        { keys: ":q", desc: "Quit" },
        { keys: ":wq / ZZ", desc: "Save and quit" },
        { keys: ":q!", desc: "Force quit" },
        { keys: ":e {file}", desc: "Open file" },
        { keys: ":ls", desc: "List buffers" },
        { keys: ":bn / :bp", desc: "Next / Prev buffer" },
        { keys: ":bd", desc: "Delete buffer" }
      ]
    },
    {
      name: "Splits & Tabs",
      color: "#06b6d4",
      commands: [
        { keys: ":sp", desc: "Horizontal split" },
        { keys: ":vs", desc: "Vertical split" },
        { keys: "Ctrl+w h/j/k/l", desc: "Navigate splits" },
        { keys: "Ctrl+w =", desc: "Equal split sizes" },
        { keys: "Ctrl+w q", desc: "Close split" },
        { keys: ":tabnew", desc: "New tab" },
        { keys: "gt / gT", desc: "Next / Prev tab" }
      ]
    },
    {
      name: "Marks & Macros",
      color: "#a855f7",
      commands: [
        { keys: "m{a}", desc: "Set mark a" },
        { keys: "'{a}", desc: "Jump to mark a (line)" },
        { keys: "`{a}", desc: "Jump to mark a (exact)" },
        { keys: "q{a}", desc: "Record macro to register a" },
        { keys: "q", desc: "Stop recording macro" },
        { keys: "@{a}", desc: "Play macro a" },
        { keys: "@@", desc: "Replay last macro" }
      ]
    },
    {
      name: "Text Objects",
      color: "#f97316",
      commands: [
        { keys: "iw / aw", desc: "inner/a word" },
        { keys: "is / as", desc: "inner/a sentence" },
        { keys: "ip / ap", desc: "inner/a paragraph" },
        { keys: "i\" / a\"", desc: "inner/around quotes" },
        { keys: "i( / a(", desc: "inner/around parens" },
        { keys: "i{ / a{", desc: "inner/around braces" },
        { keys: "it / at", desc: "inner/around HTML tag" }
      ]
    }
  ]
};

module.exports = { CHEAT_SHEET };
