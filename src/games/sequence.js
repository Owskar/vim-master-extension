// ─────────────────────────────────────────────────────────────
//  GAME: Sequence Builder
//  Self-contained. To DISABLE: comment out its entry in
//  src/games/index.js  (one line, zero other changes needed)
// ─────────────────────────────────────────────────────────────

var SEQ_DATA = [
  { task:"Delete from cursor to <b>end of line</b>",           ans:"d$",   hint:"d + $ (end-of-line motion)" },
  { task:"Change (replace) the <b>word under cursor</b>",       ans:"cw",   hint:"c + w" },
  { task:"Copy the <b>entire current line</b>",                 ans:"yy",   hint:"double the yank operator" },
  { task:"Paste <b>BEFORE</b> the cursor",                      ans:"P",    hint:"uppercase P" },
  { task:"Go to <b>line 42</b>",                                ans:"42G",  hint:"number + G" },
  { task:"Jump <b>5 words forward</b>",                         ans:"5w",   hint:"count + word jump" },
  { task:"Delete <b>3 lines</b> at once",                       ans:"3dd",  hint:"count + dd" },
  { task:"Select <b>entire current line</b> visually",          ans:"V",    hint:"capital V = visual line" },
  { task:"Undo the last <b>3 changes</b>",                      ans:"3u",   hint:"count + u" },
  { task:'Delete text <b>inside double quotes</b>',             ans:'di"',  hint:'di" = delete inner quotes' },
  { task:"Search for <b>word under cursor</b> forward",         ans:"*",    hint:"the star key" },
  { task:"Jump to <b>end of current word</b>",                  ans:"e",    hint:"single key: e" },
  { task:"Open a <b>new line below</b> and enter INSERT",       ans:"o",    hint:"lowercase o" },
  { task:"<b>Replay</b> the last macro",                        ans:"@@",   hint:"double @" },
  { task:"<b>Save</b> the file and <b>quit</b>",                ans:":wq",  hint:"write + quit" },
  { task:"Go to <b>top of file</b>",                            ans:"gg",   hint:"double g" },
  { task:"Go to <b>bottom of file</b>",                         ans:"G",    hint:"capital G" },
  { task:"Jump to <b>column 0</b> (absolute line start)",       ans:"0",    hint:"the zero key" },
  { task:"Jump to <b>end of line</b>",                          ans:"$",    hint:"dollar sign" },
  { task:"Append text at <b>end of current line</b>",           ans:"A",    hint:"capital A" },
  { task:"Insert text at <b>start of current line</b>",         ans:"I",    hint:"capital I" },
  { task:"Delete <b>character under cursor</b>",                ans:"x",    hint:"x" },
  { task:"Indent current line <b>to the right</b>",             ans:">>",   hint:"two greater-than signs" },
  { task:"<b>Join</b> current line with the next",              ans:"J",    hint:"capital J" },
  { task:"Toggle <b>case</b> of character under cursor",        ans:"~",    hint:"tilde key" },
];

function seqHTML() {
  return '<div id="seq-root"></div>';
}

function seqScript() {
  return /* js */ `
(function() {
  var pool = [], idx = 0, correct = 0, attempted = 0;

  function start() {
    pool = shuffle(SEQ_DATA);
    idx = 0; correct = 0; attempted = 0;
    render();
  }

  function render() {
    if (idx >= pool.length) { done(); return; }
    var q   = pool[idx];
    var pct = Math.round(idx / pool.length * 100);
    setBox(
      hdr('🧩 Sequence Builder', '✅ '+correct+' / '+idx) +
      prog(pct) +
      '<div style="font-size:12px;opacity:.5;margin-bottom:4px">Type the Vim command for this task:</div>' +
      '<div class="task-box">'+q.task+'</div>' +
      '<div class="input-row">' +
        '<input class="cmd-input" id="seq-inp" type="text" autocomplete="off" spellcheck="false" placeholder="Type command…">' +
        '<button class="green-btn" onclick="SEQ.check()">Check →</button>' +
      '</div>' +
      '<div id="seq-fb" style="min-height:28px;font-size:13px;font-weight:600;padding:5px 0"></div>' +
      '<div style="display:flex;gap:14px">' +
        '<button class="link-btn" style="color:#06b6d4" onclick="SEQ.hint()">💡 Hint</button>' +
        '<button class="link-btn" onclick="SEQ.skip()">Skip →</button>' +
      '</div>' +
      '<div id="seq-hint" class="hint-box" style="display:none">Hint: '+esc(q.hint)+'</div>'
    );
    var inp = ge('seq-inp');
    if (inp) {
      inp.focus();
      inp.onkeydown = function(e) { if (e.key==='Enter') { e.preventDefault(); SEQ.check(); } };
    }
  }

  function check() {
    var inp = ge('seq-inp'), fb = ge('seq-fb');
    if (!inp || !fb) return;
    var val = inp.value.trim();
    var q   = pool[idx];
    if (val === q.ans) {
      correct++; attempted++;
      fb.innerHTML = '<span style="color:#22c55e">✅ Correct!</span>';
      setTimeout(function() { idx++; render(); }, 700);
    } else {
      fb.innerHTML = '<span style="color:#f87171">❌ Answer: <code style="font-family:monospace;background:rgba(0,0,0,.3);padding:1px 6px;border-radius:4px">'+esc(q.ans)+'</code></span>';
    }
  }

  function skip() { attempted++; idx++; render(); }

  function hint() {
    var h = ge('seq-hint');
    if (h) h.style.display = h.style.display==='none' ? 'block' : 'none';
  }

  function done() {
    var pct = attempted ? Math.round(correct/attempted*100) : 0;
    setBox(result('🧩','All '+pool.length+' done!',correct+'/'+attempted+' correct ('+pct+'%)','Review the ones you missed in the lessons.','SEQ.start()'));
    saveScore('seq', pct);
  }

  window.SEQ = { start:start, check:check, skip:skip, hint:hint };
})();
`;
}

module.exports = {
  data: SEQ_DATA,
  id:     'seq',
  label:  'Sequence',
  icon:   '🧩',
  isNew:  false,
  html:   seqHTML,
  script: seqScript,
};
