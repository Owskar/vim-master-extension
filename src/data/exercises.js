const EXERCISES = [
  { id: 'delete-line', title: '1. Delete a Line', desc: 'Put cursor on any line. Press dd to delete it.', xp: 30 },
  { id: 'copy-paste', title: '2. Copy & Paste', desc: 'Press yy to yank a line, then j + p to paste below.', xp: 30 },
  { id: 'word-navigation', title: '3. Word Navigation', desc: 'Navigate 5 words forward using only w.', xp: 25 },
  { id: 'last-line', title: '4. Go to Last Line', desc: 'Press G to jump to the last line of the file.', xp: 20 },
  { id: 'search-replace', title: '5. Search & Replace', desc: 'Run :%s/const/let/g to replace all const with let.', xp: 60 },
  { id: 'undo-chain', title: '6. Undo Chain', desc: 'Make 3 edits then undo with u u u.', xp: 35 },
  { id: 'append-line', title: '7. Append at End', desc: 'Press A to insert at end of line without arrows.', xp: 25 },
  { id: 'visual-select', title: '8. Visual Select', desc: 'Press V to select a line, then d to delete it.', xp: 40 },
  { id: 'open-line-below', title: '9. Open Line Below', desc: 'Press o to open a new line below and type.', xp: 25 },
  { id: 'change-word', title: '10. Change Word', desc: 'Move cursor to a word and press cw to change it.', xp: 35 }
];

module.exports = { EXERCISES };