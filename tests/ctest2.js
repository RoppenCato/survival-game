const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../src/art.js');const C=require('../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
function step(n){for(let i=0;i<n;i++)C.update(1/60);}
function shot(name){const cv=createCanvas(800,500),c=cv.getContext('2d');C.render(c);fs.writeFileSync(name,cv.toBuffer('image/png'));}
function setup(bx,by,px,py,face){C.reset();C.clear();const e=C.spawn('bot');e.x=bx;e.y=by;e.state='idle';e.cd=99;const P=dd().P;P.x=px;P.y=py;P.face=face;P.faceVis=face;return e;}

// 1 range: enemy centre 42 away ahead
let e=setup(200,213,200,255,-Math.PI/2);
C.key('KeyJ',true);step(1);C.key('KeyJ',false);step(30);
console.log('reach 42 hit:',e.hp<4,'hp',e.hp);
e=setup(200,195,200,255,-Math.PI/2); // 60 away: past reach + body radius + the lunge step
C.key('KeyJ',true);step(1);C.key('KeyJ',false);step(30);
console.log('reach 60 hit (should be false):',e.hp<4);

// 2 stuck test: bot adjacent, mash attack 3x, measure min distance and final distance
e=setup(200,238,200,255,-Math.PI/2); e.state='idle';
let minD=99;
for(let i=0;i<150;i++){ if(i%12===0){C.key('KeyJ',true);} else C.key('KeyJ',false); C.update(1/60); const P=dd().P; minD=Math.min(minD,Math.hypot(P.x-e.x,P.y-e.y)); }
console.log('mash min distance',minD.toFixed(1),'(body radii sum 13) bot hp',e.hp);
C.key('KeyJ',false);

// 3 speed: time to cross
C.reset();C.clear();dd().P.x=40;dd().P.y=200;C.key('KeyD',true);let t=0;while(dd().P.x<360&&t<600){C.update(1/60);t++;}C.key('KeyD',false);
console.log('cross arena in',(t/60).toFixed(2),'s');

// 4 move while attacking
e=setup(300,255,200,255,0);
C.key('KeyJ',true);step(1);C.key('KeyJ',false);
const x0=dd().P.x;C.key('KeyW',true);step(12);C.key('KeyW',false);
console.log('moved up during attack by',(255-dd().P.y).toFixed(1));

// 5 parry still
C.reset();C.clear();e=C.spawn('bot');e.x=200;e.y=225;e.state='windup';e.t=0;e.dur=0.3;e.dirLock=Math.PI/2;e.cd=0;
let P=dd().P;P.x=200;P.y=250;P.face=-Math.PI/2;P.faceVis=P.face;
step(14);C.key('KeyK',true);let par=false;for(let i=0;i<120;i++){C.update(1/60);if(e.state==='recover'&&e.dur===1.5){par=true;break;}}
console.log('parry works:',par,'hp',dd().P.hp);C.key('KeyK',false);

// 6 bot spacing: does bot hug the player while on cooldown?
C.reset();C.clear();e=C.spawn('bot');e.x=200;e.y=200;e.state='chase';e.cd=3;P=dd().P;P.x=200;P.y=230;
let hug=0;for(let i=0;i<180;i++){C.update(1/60);const d=Math.hypot(P.x-e.x,P.y-e.y);if(d<20)hug++;}
console.log('frames bot spent hugging (<20):',hug,'of 180');

// 7 ranged auto
C.reset();C.clear();C.S.ranged='auto';e=C.spawn('bot');e.x=300;e.y=255;e.state='idle';e.cd=99;P=dd().P;P.x=150;P.y=255;P.face=0;P.faceVis=0;
C.key('KeyF',true);step(1);C.key('KeyF',false);step(40);console.log('auto ranged hit:',e.hp<4);C.S.ranged='mouse';

// screenshots
e=setup(236,255,200,255,0);e.state='idle';
C.key('KeyJ',true);step(1);C.key('KeyJ',false);step(5);shot('v2_swing_a.png');
step(6);shot('v2_swing_b.png');
C.reset();step(2);shot('v2_default.png');
console.log('done');
