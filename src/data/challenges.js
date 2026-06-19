const DAILY_CHALLENGES = [
  {
    id: 'dc-001',
    title: 'The Semicolon Sprint',
    description: 'Add a semicolon to the end of each line without using Insert Mode directly on each line.',
    hint: 'Try: A;<Esc>j and repeat with .',
    xp: 200,
    difficulty: 'Beginner',
    targetCommands: ['A', 'j', '.']
  },
  {
    id: 'dc-002',
    title: 'Word Swap Challenge',
    description: 'Swap two adjacent words: "hello world" → "world hello"',
    hint: 'Use: dwwP or try a substitution with capture groups',
    xp: 250,
    difficulty: 'Intermediate',
    targetCommands: ['dw', 'w', 'P']
  },
  {
    id: 'dc-003',
    title: 'The Line Surgeon',
    description: 'Delete every other line in a file (lines 2, 4, 6...)',
    hint: 'Record a macro: dd and j, then replay it with count.',
    xp: 300,
    difficulty: 'Advanced',
    targetCommands: ['qa', 'dd', 'j', 'q', '@a']
  },
  {
    id: 'dc-004',
    title: 'Quote Hunter',
    description: 'Change all text inside double quotes on every line.',
    hint: 'Use ci" to change inner quotes, then . to repeat.',
    xp: 200,
    difficulty: 'Intermediate',
    targetCommands: ['ci"', '.']
  },
  {
    id: 'dc-005',
    title: 'Speed Navigator',
    description: 'Navigate to line 42, column 10 as fast as possible.',
    hint: 'Try 42G then 10| or use :42 then f-navigate.',
    xp: 150,
    difficulty: 'Beginner',
    targetCommands: ['42G', '10|']
  },
  {
    id: 'dc-006',
    title: 'Block Comment',
    description: 'Comment out 10 lines by adding // at the start of each.',
    hint: 'Use Ctrl+v for block visual, I to insert, type //, then Esc.',
    xp: 280,
    difficulty: 'Advanced',
    targetCommands: ['Ctrl+v', 'I', 'Esc']
  },
  {
    id: 'dc-007',
    title: 'The Replace Master',
    description: 'Replace all occurrences of "var" with "const" in the file.',
    hint: ':%s/var/const/g',
    xp: 150,
    difficulty: 'Beginner',
    targetCommands: [':%s/var/const/g']
  }
];

module.exports = { DAILY_CHALLENGES };
