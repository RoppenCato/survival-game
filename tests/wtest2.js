const {createCanvas}=require('@napi-rs/canvas');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../src/art.js');const C=require('../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
function setup(){C.reset();C.clear();const P=dd().P;P.x=200;P.y=200;P.face=0;P.faceVis=0;const e=C.spawn('bot');e.hp=e.maxHp=99;e.x=232;e.y=200;e.state='idle';e.cd=99;return e;}
C.S.crit=0;
for(const w of ['snappy','normal','heavy']){
  C.S.weight=w;
  // normal hit
  let e=setup();C.key('KeyJ',true);C.update(1/60);C.key('KeyJ',false);
  let ef=0,pf=0,moved0=e.x,slow=0;
  for(let i=0;i<60;i++){C.update(1/60);if(e.freezeT>0)ef++;if(dd().P.freezeT>0)pf++;if(dd().W.slow.t>0)slow++;}
  console.log(w,'normal hit: enemy pause frames',ef,'player pause frames',pf,'knockback dist',(e.x-232).toFixed(1));
  // 3rd combo hit (heavy)
  e=setup();ef=0;pf=0;slow=0;
  for(let k=0;k<3;k++){C.key('KeyJ',true);C.update(1/60);C.key('KeyJ',false);for(let i=0;i<14;i++){C.update(1/60);if(k===2){if(e.freezeT>0)ef++;if(dd().P.freezeT>0)pf++;if(dd().W.slow.t>0)slow++;}}}
  for(let i=0;i<20;i++){C.update(1/60);if(e.freezeT>0)ef++;if(dd().P.freezeT>0)pf++;if(dd().W.slow.t>0)slow++;}
  console.log(w,'3rd hit: enemy pause',ef,'player pause',pf,'slowmo frames',slow);
}
