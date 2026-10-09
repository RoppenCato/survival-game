const {createCanvas}=require('@napi-rs/canvas');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../src/art.js');const C=require('../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
C.reset();C.clear();const P=dd().P;P.x=200;P.y=200;P.face=0;P.faceVis=0;
const b=C.spawn('brute');b.x=262;b.y=200;b.state='windup';b.attack='lunge';b.chain=1;b.t=0;b.dur=0.3;b.dirLock=Math.PI;b.cd=0;
for(let i=0;i<26;i++)C.update(1/60);
C.key('KeyK',true);let par=false;for(let i=0;i<90;i++){C.update(1/60);if(b.state==='recover'&&b.dur===1.2){par=true;break;}}
console.log('brute lunge parried with good timing:',par,'stagMeter',b.stagMeter,'hp',dd().P.hp);
C.key('KeyK',false);
// spin is unparryable but blockable; dash dodges
C.reset();C.clear();const Q=dd().P;Q.x=200;Q.y=200;
const s=C.spawn('brute');s.x=230;s.y=200;s.state='windup';s.attack='spin';s.chain=1;s.t=0;s.dur=0.65;s.dirLock=Math.PI;s.cd=0;
for(let i=0;i<30;i++)C.update(1/60);
C.key('KeyD',false);C.key('KeyA',true);C.key('Space',true);C.update(1/60);C.key('Space',false);
for(let i=0;i<40;i++)C.update(1/60);C.key('KeyA',false);
console.log('spin dodged with dash, hp',dd().P.hp);
