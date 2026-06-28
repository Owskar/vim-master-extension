// ─────────────────────────────────────────────────────────────
//  GAME: Command Quiz
//  Self-contained. To DISABLE: comment out its entry in
//  src/games/index.js  (one line, zero other changes needed)
// ─────────────────────────────────────────────────────────────

var QUIZ_DATA = [
  { k:"h",      opts:["Move cursor left","Move cursor right","Move cursor up","Move cursor down"],       ans:0 },
  { k:"j",      opts:["Move cursor up","Move cursor left","Move cursor down","Move cursor right"],       ans:2 },
  { k:"k",      opts:["Move cursor down","Move cursor up","Move cursor right","Move cursor left"],       ans:1 },
  { k:"l",      opts:["Move cursor left","Move cursor down","Move cursor up","Move cursor right"],       ans:3 },
  { k:"w",      opts:["Write file","Jump to next word","Move line down","Select word"],                  ans:1 },
  { k:"b",      opts:["Jump to previous word","Break line","Write buffer","Select block"],               ans:0 },
  { k:"e",      opts:["Exit Vim","Jump to end of word","Expand selection","Edit file"],                  ans:1 },
  { k:"dd",     opts:["Duplicate line","Decrease indent","Delete current line","Debug code"],            ans:2 },
  { k:"yy",     opts:["Undo","Yank (copy) current line","Redo","Select line"],                           ans:1 },
  { k:"p",      opts:["Print file","Paste after cursor","Previous buffer","Pause"],                      ans:1 },
  { k:"P",      opts:["Print file","Previous file","Paste before cursor","Page up"],                     ans:2 },
  { k:"u",      opts:["Undo last change","Move cursor up","Update file","Uppercase word"],               ans:0 },
  { k:"Ctrl+r", opts:["Record macro","Redo","Replace word","Run command"],                               ans:1 },
  { k:"gg",     opts:["Open files","Go to top of file","Go to last change","Group lines"],               ans:1 },
  { k:"G",      opts:["Go to top of file","Group selection","Go to bottom of file","Go to mark"],        ans:2 },
  { k:"0",      opts:["Jump to end of line","Line zero","Jump to start of line","Select all"],           ans:2 },
  { k:"$",      opts:["Search pattern","Jump to end of line","Run shell","Last file"],                   ans:1 },
  { k:"^",      opts:["Start of file","First non-blank char on line","Search pattern","Top of screen"],  ans:1 },
  { k:"i",      opts:["Indent line","Insert before cursor","Info","Increase number"],                    ans:1 },
  { k:"a",      opts:["Select all","Append after cursor","Add new line","Auto-complete"],                ans:1 },
  { k:"o",      opts:["Open file","Options menu","Open new line below","Overwrite mode"],                ans:2 },
  { k:"O",      opts:["Open file above","Open new line above","Overwrite all","Options"],                ans:1 },
  { k:"A",      opts:["Select all","Append at end of line","Add indent","Auto-save"],                    ans:1 },
  { k:"I",      opts:["Show info","Insert at start of line","Increase indent","Italic mode"],            ans:1 },
  { k:"v",      opts:["View mode","Visual character mode","Vim command","Vertical split"],               ans:1 },
  { k:"V",      opts:["Visual block mode","Vertical split","Visual line mode","Vim info"],               ans:2 },
  { k:"Ctrl+v", opts:["Paste from clipboard","Visual block mode","Version info","Vertical scroll"],      ans:1 },
  { k:"dw",     opts:["Duplicate word","Delete to end of line","Delete word","Debug work"],              ans:2 },
  { k:"cw",     opts:["Copy word","Change (replace) word","Count words","Close window"],                 ans:1 },
  { k:"ci(",    opts:["Copy inner parens","Close if block","Change inside parens","Count items"],        ans:2 },
  { k:'di"',    opts:["Duplicate inside quotes","Delete inside double quotes","Dim text","Define item"], ans:1 },
  { k:".",      opts:["Next search result","Repeat last change","Enter command mode","Tab complete"],     ans:1 },
  { k:"*",      opts:["Multiply selection","Mark all","Search word under cursor","Toggle comment"],      ans:2 },
  { k:"f{c}",   opts:["Find file named c","Jump to next char c on line","Format code","Fold block"],    ans:1 },
  { k:"ZZ",     opts:["Zoom in","Zig-zag","Save and quit","Suspend Vim"],                               ans:2 },
  { k:":w",     opts:["Write (save) file","Wipe buffer","Wrap text","Window command"],                   ans:0 },
  { k:":q!",    opts:["Quiet mode","Quit without saving","Quick format","Query replace"],                ans:1 },
  { k:":wq",    opts:["Write quietly","Save and quit","Wrap and quit","Window query"],                   ans:1 },
  { k:"qa",     opts:["Quit all files","Quick action","Record macro into register a","Query all"],       ans:2 },
  { k:"@a",     opts:["Append to register a","Play macro in register a","Jump to mark a","Search"],     ans:1 },
  { k:"gv",     opts:["Go to visual","Re-select last visual selection","Go to vim","View git"],          ans:1 },
  { k:"ma",     opts:["Move and append","Set mark a at cursor","Make alias","Multiply all"],             ans:1 },
  { k:"'a",     opts:["Append at mark a","Jump to line of mark a","List all marks","Auto-indent"],      ans:1 },
  { k:"%",      opts:["Line percentage","Jump to matching bracket","Macro percent","Modulo op"],         ans:1 },
  { k:">>",     opts:["Bit shift right","Indent line right","Go to end","Greater-than twice"],           ans:1 },
  { k:"<<",     opts:["Bit shift left","Go to start","Unindent line left","Less-than twice"],            ans:2 },
  { k:"~",      opts:["Run shell command","Toggle case of character","Tilde search","Regex wildcard"],   ans:1 },
  { k:"J",      opts:["Join two lines","Jump down","Enter Java mode","Justify text"],                    ans:0 },
  { k:"x",      opts:["Exit Vim","Delete character under cursor","Extra mode","X-mode"],                 ans:1 },
];

// ── HTML for this game (injected into the shared gamebox) ────
function quizHTML() {
  return '<div id="quiz-root"></div>';
}

// ── Runtime logic (runs inside the webview) ──────────────────
function quizScript() {
  return /* js */ `
(function() {
  var pool = [], idx = 0, score = 0, locked = false;

  function start() {
    pool = shuffle(QUIZ_DATA).slice(0, 12);
    idx = 0; score = 0; locked = false;
    render();
  }

  function render() {
    var q   = pool[idx];
    var pct = Math.round(idx / pool.length * 100);
    var opts = '';
    for (var i = 0; i < q.opts.length; i++) {
      opts += '<button class="opt-btn" id="qo'+i+'" onclick="QUIZ.pick('+i+')">' + esc(q.opts[i]) + '</button>';
    }
    setBox(
      hdr('⚡ Command Quiz', 'Score: '+score+'/'+pool.length) +
      '<div style="font-size:12px;opacity:.5">Question '+(idx+1)+' of '+pool.length+'</div>' +
      prog(pct) +
      '<div class="cmd-box">' +
        '<div class="cmd-lbl">What does this Vim command do?</div>' +
        '<div class="cmd-key" id="qcmd">'+esc(q.k)+'</div>' +
      '</div>' +
      '<div class="opts">'+opts+'</div>'
    );
  }

  function pick(chosen) {
    if (locked) return;
    locked = true;
    var q = pool[idx];
    var ok = chosen === q.ans;
    if (ok) score++;
    for (var i = 0; i < q.opts.length; i++) {
      var b = ge('qo'+i);
      if (!b) continue;
      b.disabled = true;
      if (i === q.ans) b.className = 'opt-btn opt-ok';
      else if (i === chosen && !ok) b.className = 'opt-btn opt-no';
    }
    var c = ge('qcmd');
    if (c) c.className = 'cmd-key ' + (ok ? 'key-ok' : 'key-no');
    setTimeout(function() {
      idx++; locked = false;
      if (idx < pool.length) render(); else done();
    }, 1100);
  }

  function done() {
    var pct = Math.round(score / pool.length * 100);
    var em  = pct>=90?'🏆':pct>=70?'⚔️':pct>=50?'📖':'🐣';
    var msg = pct>=90?'Outstanding! Vim Master material!':pct>=70?'Great work — keep going!':pct>=50?'Getting there — keep reviewing!':'Keep studying, you will get it!';
    setBox(result(em, 'Quiz Complete!', score+'/'+pool.length+' correct ('+pct+'%)', msg, 'QUIZ.start()'));
    saveScore('quiz', pct);
  }

  window.QUIZ = { start: start, pick: pick };
})();
`;
}

module.exports = {
  data: QUIZ_DATA,
  id:     'quiz',
  label:  'Quiz',
  icon:   '⚡',
  isNew:  false,
  html:   quizHTML,
  script: quizScript,
};
