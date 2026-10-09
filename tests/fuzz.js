const {createCanvas}=require('@napi-rails/canvas'.replace('rails','rs'));
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../src/art.js');const C=require('../src/combat.js');C.init(G.lib);
const cv=createCanvas(800,500),c=cv.getContext('2d');
const keys=['KeyW','KeyA','KeyS','KeyD','Space','KeyF','KeyQ','KeyJ','KeyK'];
let seed=1;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
let bad=0,kills=0;
['facing','soft','lock'].forEach(mode=>{
  C.S.aim=mode;
  [true,false].forEach(j=>{
    C.S.juice=j;C.S.shield=j;C.reset();C.spawn('brute');
    for(let f=0;f<2400;f++){
      if(f%7===0){const k=keys[(rnd()*keys.length)|0];C.key(k,rnd()<0.5);}
      if(f%11===0){C.button(0,rnd()<0.4);C.button(2,rnd()<0.2);}
      C.mouse(rnd()*400,rnd()*250);
      if(f%600===599){C.spawn('beast');C.spawn('shooter');}
      if(C.dbg().P.dead&&f%300===0)C.key('KeyR',true);
      C.update(1/60);C.key('KeyR',false);
      if(f%60===0)C.render(c);
      const d=C.dbg();
      if(!isFinite(d.P.x)||!isFinite(d.P.y)||!isFinite(d.P.hp)){bad++;break;}
      d.W.enemies.forEach(e=>{if(!isFinite(e.x)||!isFinite(e.y))bad++;});
    }
  });
});
console.log('fuzz done, bad =',bad);
