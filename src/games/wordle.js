// ─────────────────────────────────────────────────────────────
//  GAME: Vim Wordle
//  Self-contained. To DISABLE: comment out its entry in
//  src/games/index.js  (one line, zero other changes needed)
// ─────────────────────────────────────────────────────────────

var WORDLE_DATA = [
  { word:"dd", hint:"Delete entire line (double operator)" },
  { word:"yy", hint:"Yank (copy) entire line" },
  { word:"gg", hint:"Go to the top of the file" },
  { word:"dw", hint:"Delete a word (d + motion)" },
  { word:"cw", hint:"Change (replace) a word" },
  { word:"gv", hint:"Re-select last visual selection" },
  { word:"ea", hint:"Append text at end of a word" },
  { word:"xp", hint:"Swap (transpose) two characters" },
  { word:"zz", hint:"Centre the screen on the cursor" },
  { word:"cc", hint:"Change (replace) entire line" },
  { word:"gU", hint:"Uppercase — e.g. gUiw uppercases a word" },
  { word:"gu", hint:"Lowercase — e.g. guiw lowercases a word" },
  { word:"g~", hint:"Toggle case of selection" },
];

function wordleHTML() {
  return '<div id="wordle-root"></div>';
}

function wordleScript() {
  return /* js */ `
(function() {
  var target='', hint='', guesses=[], typed='', kb={}, done_=false;
  var MAX=6;

  function start() {
    var pick=WORDLE_DATA[Math.floor(Math.random()*WORDLE_DATA.length)];
    target=pick.word; hint=pick.hint;
    guesses=[]; typed=''; kb={}; done_=false;
    render();
  }

  function render() {
    var L=target.length;
    var won=guesses.length>0&&guesses[guesses.length-1].every(function(c){return c.st==='hit';});
    var lost=!won&&guesses.length>=MAX;

    var grid='<div class="w-grid">';
    for(var r=0;r<MAX;r++){
      grid+='<div class="w-row">';
      var g=guesses[r];
      var isActive=(r===guesses.length&&!done_);
      for(var c=0;c<L;c++){
        var cls='w-cell';var ch='';
        if(g){cls+=' w-'+g[c].st;ch=g[c].ch;}
        else if(isActive){cls+=' w-cur';ch=typed[c]||'';}
        grid+='<div class="'+cls+'">'+esc(ch)+'</div>';
      }
      grid+='</div>';
    }
    grid+='</div>';

    var rows=[
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l'],
      ['ENT','z','x','c','v','b','n','m','⌫']
    ];
    var kb_='<div class="w-kb">';
    for(var ri=0;ri<rows.length;ri++){
      kb_+='<div class="w-kb-row">';
      for(var ki=0;ki<rows[ri].length;ki++){
        var key=rows[ri][ki];
        var kst=kb[key]||'';
        var kcls='w-key'+(key==='ENT'||key==='⌫'?' w-wide':'')+(kst?' w-k-'+kst:'');
        kb_+='<button class="'+kcls+'" onclick="WORDLE.key(\''+key+'\')">'+key+'</button>';
      }
      kb_+='</div>';
    }
    kb_+='</div>';

    var msg=won?'🎉 Correct!':lost?'Answer: <b>'+esc(target)+'</b>':'&nbsp;';
    var msgCls='w-msg'+(won?' w-ok':lost?' w-no':'');

    setBox(
      hdr('🧠 Vim Wordle','Guess '+(guesses.length+1)+'/'+MAX) +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:12px">' +
        '<div class="w-hint">Guess the <b>'+L+'-character</b> Vim command!<br><span style="font-size:12px;opacity:.7">'+esc(hint)+'</span></div>' +
        grid +
        '<div class="'+msgCls+'">'+msg+'</div>' +
        (won||lost?'<button class="green-btn" onclick="WORDLE.start()">🔄 New Word</button>':kb_) +
      '</div>'
    );
  }

  function key(k) {
    if(done_)return;
    if(k==='⌫'){typed=typed.slice(0,-1);}
    else if(k==='ENT'){submit();return;}
    else if(typed.length<target.length){typed+=k;}
    render();
  }

  function submit() {
    if(typed.length<target.length){
      render();
      var m=document.querySelector('.w-msg');
      if(m){m.textContent='Too short!';m.className='w-msg w-no';}
      return;
    }
    var result=[];
    var used=[];
    for(var i=0;i<target.length;i++){used.push(false);}
    // pass 1: exact
    for(var i=0;i<target.length;i++){
      if(typed[i]===target[i]){result.push({ch:typed[i],st:'hit'});used[i]=true;}
      else result.push({ch:typed[i],st:'out'});
    }
    // pass 2: present
    for(var i=0;i<target.length;i++){
      if(result[i].st==='hit')continue;
      for(var j=0;j<target.length;j++){
        if(!used[j]&&typed[i]===target[j]){result[i].st='mis';used[j]=true;break;}
      }
    }
    guesses.push(result);
    // update kb
    for(var i=0;i<result.length;i++){
      var ch=result[i].ch,st=result[i].st,prev=kb[ch];
      if(!prev||prev==='out'||(prev==='mis'&&st==='hit')) kb[ch]=st;
    }
    typed='';
    var won=result.every(function(c){return c.st==='hit';});
    if(won||guesses.length>=MAX)done_=true;
    render();
  }

  // physical keyboard
  document.addEventListener('keydown',function(e){
    if(currentGame!=='wordle'||done_)return;
    if(e.key==='Enter'){e.preventDefault();WORDLE.key('ENT');}
    else if(e.key==='Backspace'){e.preventDefault();WORDLE.key('⌫');}
    else if(e.key.length===1&&/[a-z>~]/.test(e.key)){WORDLE.key(e.key);}
  });

  window.WORDLE = { start:start, key:key };
})();
`;
}

module.exports = {
  data: WORDLE_DATA,
  id:     'wordle',
  label:  'Wordle',
  icon:   '🧠',
  isNew:  true,
  html:   wordleHTML,
  script: wordleScript,
};
