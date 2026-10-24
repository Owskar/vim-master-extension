// ─────────────────────────────────────────────────────────────
//  GAME: Flashcard Drill
//  Self-contained. To DISABLE: comment out its entry in
//  src/games/index.js  (one line, zero other changes needed)
// ─────────────────────────────────────────────────────────────

var FLASH_DATA = [
  { k:"h",      d:"Move cursor left" },
  { k:"j",      d:"Move cursor down" },
  { k:"k",      d:"Move cursor up" },
  { k:"l",      d:"Move cursor right" },
  { k:"w",      d:"Jump to next word start" },
  { k:"b",      d:"Jump to previous word start" },
  { k:"e",      d:"Jump to end of word" },
  { k:"0",      d:"Start of line (column 0)" },
  { k:"^",      d:"First non-blank character" },
  { k:"$",      d:"End of line" },
  { k:"gg",     d:"Go to top of file" },
  { k:"G",      d:"Go to bottom of file" },
  { k:"i",      d:"Insert before cursor" },
  { k:"a",      d:"Append after cursor" },
  { k:"o",      d:"Open new line below" },
  { k:"O",      d:"Open new line above" },
  { k:"I",      d:"Insert at start of line" },
  { k:"A",      d:"Append at end of line" },
  { k:"x",      d:"Delete character under cursor" },
  { k:"dd",     d:"Delete current line" },
  { k:"yy",     d:"Yank (copy) current line" },
  { k:"p",      d:"Paste after cursor" },
  { k:"P",      d:"Paste before cursor" },
  { k:"u",      d:"Undo" },
  { k:"Ctrl+r", d:"Redo" },
  { k:"v",      d:"Visual character mode" },
  { k:"V",      d:"Visual line mode" },
  { k:"Ctrl+v", d:"Visual block mode" },
  { k:".",      d:"Repeat last change" },
  { k:"*",      d:"Search word under cursor" },
  { k:"%",      d:"Jump to matching bracket" },
  { k:"ZZ",     d:"Save and quit" },
  { k:":q!",    d:"Quit without saving" },
  { k:">>",     d:"Indent line right" },
  { k:"J",      d:"Join line with next" },
  { k:"~",      d:"Toggle case of character" },
  { k:"dw",     d:"Delete a word" },
  { k:"cw",     d:"Change (replace) a word" },
  { k:'di"',    d:"Delete inside double quotes" },
];

function flashHTML() {
  return '<div id="flash-root"></div>';
}

function flashScript() {
  return /* js */ `
(function() {
  function start() {
    var cards = shuffle(FLASH_DATA);
    var rows  = '';
    for (var i = 0; i < cards.length; i++) {
      rows +=
        '<div class="fc" id="fc'+i+'" onclick="FLASH.flip('+i+')">' +
          '<div class="fc-key">'+esc(cards[i].k)+'</div>' +
          '<div class="fc-def" id="fd'+i+'">'+esc(cards[i].d)+'</div>' +
        '</div>';
    }
    setBox(
      hdr('🃏 Flashcard Drill','') +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
        '<span style="font-size:13px;opacity:.55">Click any card to reveal its meaning.</span>' +
        '<button class="green-btn" style="padding:5px 14px;font-size:12px" onclick="FLASH.revealAll()">Reveal All</button>' +
      '</div>' +
      '<div class="fc-grid">'+rows+'</div>'
    );
  }

  function flip(i) {
    var card = ge('fc'+i);
    var def  = ge('fd'+i);
    if (!card || !def) return;
    card.classList.toggle('fc-open');
  }

  function revealAll() {
    var all = document.querySelectorAll('.fc');
    for (var i = 0; i < all.length; i++) all[i].classList.add('fc-open');
  }

  window.FLASH = { start:start, flip:flip, revealAll:revealAll };
})();
`;
}

module.exports = {
  data: FLASH_DATA,
  id:     'flash',
  label:  'Flashcards',
  icon:   '🃏',
  isNew:  false,
  html:   flashHTML,
  script: flashScript,
};
