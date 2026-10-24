// ─────────────────────────────────────────────────────────────
//  GAME: Speed Run
//  Self-contained. To DISABLE: comment out its entry in
//  src/games/index.js  (one line, zero other changes needed)
// ─────────────────────────────────────────────────────────────

var SPEED_DATA = [
  { k:"gg",  d:"go to top of file" },
  { k:"G",   d:"go to bottom of file" },
  { k:"dd",  d:"delete current line" },
  { k:"yy",  d:"yank (copy) current line" },
  { k:"p",   d:"paste after cursor" },
  { k:"P",   d:"paste before cursor" },
  { k:"u",   d:"undo last change" },
  { k:".",   d:"repeat last change" },
  { k:"w",   d:"jump to next word" },
  { k:"b",   d:"jump to previous word" },
  { k:"$",   d:"jump to end of line" },
  { k:"0",   d:"jump to start of line" },
  { k:"dw",  d:"delete a word" },
  { k:"cw",  d:"change a word" },
  { k:"v",   d:"visual character mode" },
  { k:"V",   d:"visual line mode" },
  { k:"x",   d:"delete char under cursor" },
  { k:"A",   d:"append at end of line" },
  { k:"I",   d:"insert at start of line" },
  { k:"ZZ",  d:"save and quit" },
];

function speedHTML() {
  return '<div id="speed-root"></div>';
}

function speedScript() {
  return /* js */ `
(function() {
  var pool=[], idx=0, correct=0, wrong=0, times=[];
  var startTime=0, qStart=0, waiting=false, timer=null;

  function start() {
    pool = shuffle(SPEED_DATA).slice(0,10);
    idx=0; correct=0; wrong=0; times=[]; waiting=false;
    if(timer){clearInterval(timer);timer=null;}
    setBox(
      hdr('💨 Speed Run','') +
      '<div style="text-align:center;padding:28px 0">' +
        '<div style="font-size:44px;margin-bottom:14px">🏎️</div>' +
        '<div style="font-size:17px;font-weight:700;margin-bottom:8px">Type each command as fast as you can!</div>' +
        '<div style="font-size:13px;opacity:.6;max-width:300px;margin:0 auto 22px;line-height:1.6">You will see a description — type the exact Vim command and press Enter.</div>' +
        '<button class="green-btn" onclick="SPEED.begin()">🚀 Start!</button>' +
      '</div>'
    );
  }

  function begin() {
    startTime = Date.now();
    idx=0; correct=0; wrong=0; times=[]; waiting=false;
    render();
  }

  function render() {
    if(idx>=pool.length){done();return;}
    if(timer){clearInterval(timer);timer=null;}
    var q = pool[idx];
    setBox(
      hdr('💨 Speed Run','✅'+correct+' ❌'+wrong+' | '+(pool.length-idx)+' left') +
      '<div style="text-align:center">' +
        '<div style="font-size:12px;opacity:.5;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Type the command to…</div>' +
        '<div style="font-size:24px;font-weight:800;color:#e879f9;margin:12px 0">'+esc(q.d)+'</div>' +
        '<input class="cmd-input" id="sp-inp" type="text" autocomplete="off" spellcheck="false" placeholder="command…" style="text-align:center;max-width:240px">' +
        '<div style="font-size:11px;opacity:.4;margin:6px 0">Press Enter to confirm</div>' +
        '<div style="display:flex;justify-content:center;gap:28px;margin-top:14px">' +
          '<div style="text-align:center"><div style="font-size:22px;font-weight:900;color:#f59e0b" id="sp-t">0.0s</div><div style="font-size:10px;opacity:.5">elapsed</div></div>' +
          '<div style="text-align:center"><div style="font-size:22px;font-weight:900;color:#22c55e">'+correct+'</div><div style="font-size:10px;opacity:.5">correct</div></div>' +
          '<div style="text-align:center"><div style="font-size:22px;font-weight:900;color:#f87171">'+wrong+'</div><div style="font-size:10px;opacity:.5">wrong</div></div>' +
        '</div>' +
      '</div>'
    );
    var inp = ge('sp-inp');
    if(inp){
      inp.focus();
      inp.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();SPEED.check();}};
    }
    qStart=Date.now();
    timer=setInterval(function(){
      var el=ge('sp-t');
      if(!el){clearInterval(timer);timer=null;return;}
      el.textContent=((Date.now()-startTime)/1000).toFixed(1)+'s';
    },100);
  }

  function check() {
    if(waiting)return;
    var inp=ge('sp-inp');
    if(!inp)return;
    var val=inp.value.trim();
    var q=pool[idx];
    var ok=(val===q.k);
    times.push((Date.now()-qStart)/1000);
    if(ok)correct++;else wrong++;
    inp.style.borderColor = ok?'#22c55e':'#f87171';
    inp.style.color       = ok?'#22c55e':'#f87171';
    inp.disabled=true;
    waiting=true;
    setTimeout(function(){waiting=false;idx++;render();}, ok?350:900);
  }

  function done() {
    if(timer){clearInterval(timer);timer=null;}
    var total=(Date.now()-startTime)/1000;
    var avg=times.length?times.reduce(function(a,b){return a+b;},0)/times.length:0;
    var pct=Math.round(correct/pool.length*100);
    var em=pct>=90&&total<30?'⚡':pct>=80?'💨':pct>=60?'🏃':'🐢';
    var msg=pct>=90&&total<30?"Lightning fast — you're a Vim speedster!":pct>=80?'Great speed and accuracy!':pct>=60?'Good run! Keep practicing.':'Accuracy first, speed follows!';
    setBox(
      result(em,'Speed Run Complete!',correct+'/'+pool.length+' correct',msg,'SPEED.start()')+
      '<div style="display:flex;gap:24px;justify-content:center;margin-top:-10px">' +
        '<div style="text-align:center"><div style="font-size:20px;font-weight:900;color:#06b6d4">'+total.toFixed(1)+'s</div><div style="font-size:10px;opacity:.5">total</div></div>' +
        '<div style="text-align:center"><div style="font-size:20px;font-weight:900;color:#f59e0b">'+avg.toFixed(1)+'s</div><div style="font-size:10px;opacity:.5">avg/cmd</div></div>' +
      '</div>'
    );
    saveScore('speed', pct);
  }

  window.SPEED = { start:start, begin:begin, check:check };
})();
`;
}

module.exports = {
  data: SPEED_DATA,
  id:     'speed',
  label:  'Speed Run',
  icon:   '💨',
  isNew:  false,
  html:   speedHTML,
  script: speedScript,
};
