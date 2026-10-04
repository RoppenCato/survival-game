const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../src/art.js');const C=require('../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
function step(n){for(let i=0;i<n;i++)C.update(1/60);}
function shot(name){const cv=createCanvas(800,500),c=cv.getContext('2d');C.render(c);fs.writeFileSync(name,cv.toBuffer('image/png'));}
// dash distance sideways
C.reset();C.clear();let P=dd().P;P.x=200;P.y=200;P.face=-Math.PI/2;P.faceVis=P.face;
C.key('KeyD',true);C.update(1/60);C.key('Space',true);C.update(1/60);C.key('Space',false);
let x0=P.x;step(14);C.key('KeyD',false);
console.log('dash sideways dist',(P.x-x0).toFixed(1));
// backstep with no input
C.reset();C.clear();P=dd().P;P.x=200;P.y=200;P.face=-Math.PI/2;P.faceVis=P.face;
C.key('Space',true);C.update(1/60);C.key('Space',false);step(14);
console.log('backstep moved y by',(P.y-200).toFixed(1),'(positive = backward/down)');
// i-frames vs bot lunge
C.reset();C.clear();let e=C.spawn('bot');e.x=200;e.y=225;e.state='windup';e.t=0;e.dur=0.5;e.dirLock=Math.PI/2;e.cd=0;P=dd().P;P.x=200;P.y=245;
step(24);C.key('KeyD',true);C.key('Space',true);C.update(1/60);C.key('Space',false);step(60);C.key('KeyD',false);
console.log('dash dodge hp',dd().P.hp);
// turn speed
C.reset();C.clear();P=dd().P;P.face=-Math.PI/2;P.faceVis=P.face;C.key('KeyS',true);let t=0;while(Math.abs(P.faceVis-Math.PI/2)>0.05&&t<60){C.update(1/60);t++;}C.key('KeyS',false);
console.log('180 turn in frames',t,'(',(t/60).toFixed(2),'s )');
// screenshot mid-dash
C.reset();C.clear();P=dd().P;P.x=150;P.y=200;P.face=0;P.faceVis=0;C.key('KeyD',true);step(10);C.key('Space',true);C.update(1/60);C.key('Space',false);step(6);shot('v3_dash.png');
console.log('done');
