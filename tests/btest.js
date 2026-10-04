const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../src/art.js');const C=require('../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
function step(n){for(let i=0;i<n;i++)C.update(1/60);}
function shot(name){const cv=createCanvas(800,500),c=cv.getContext('2d');C.render(c);fs.writeFileSync(name,cv.toBuffer('image/png'));}
function setup(type,hp){C.reset();C.clear();const P=dd().P;P.x=200;P.y=200;P.face=0;P.faceVis=0;const e=C.spawn(type);if(hp)e.hp=e.maxHp=hp;e.x=200+(type==='bossbot'?52:34);e.y=200;e.state='idle';e.cd=99;return e;}
C.S.crit=0;
// tap vs hold
let e=setup('bot',99);C.key('KeyJ',true);step(60);C.key('KeyJ',false);
let P=dd().P;console.log('after 1s hold + release: phase',P.atk.ph,'combo',P.atk.combo,'chg',P.atk.chg.toFixed(2),'enemy hp',e.hp);
step(40);
// short tap should not charge
e=setup('bot',99);C.key('KeyJ',true);step(6);C.key('KeyJ',false);step(30);P=dd().P;console.log('tap: phase',P.atk.ph,'hp',e.hp);
// charge levels and damage by hold time
for(const hold of [20,35,50,60,90]){e=setup('bot',99);C.key('KeyJ',true);step(hold);C.key('KeyJ',false);step(60);console.log('hold',hold,'frames dmg',(99-e.hp).toFixed(2));}
// charge cancelled by dash
e=setup('bot',99);C.key('KeyJ',true);step(40);console.log('charging phase',dd().P.atk.ph);C.key('Space',true);step(1);C.key('Space',false);console.log('after dash phase',dd().P.atk.ph);C.key('KeyJ',false);step(30);
// screenshot at full charge
e=setup('bot',99);C.key('KeyJ',true);step(75);shot('b_charge.png');C.key('KeyJ',false);step(8);shot('b_charge_hit.png');step(30);
// bossbot attacks: check telegraph + chain
C.S.crit=0.15;
let b=setup('bossbot');b.state='chase';b.cd=0;dd().P.x=200;dd().P.y=200;b.x=250;b.y=200;
let seen={};for(let i=0;i<600;i++){C.update(1/60);if(b.state==='windup')seen[b.attack]=(seen[b.attack]||0)+1;if(dd().P.dead)break;}
console.log('bossbot attacks seen',JSON.stringify(seen),'player hp',dd().P.hp);
b=setup('bossbot');b.state='windup';b.attack='spin';b.t=0.4;b.dur=0.65;b.dirLock=Math.PI;dd().P.x=200;dd().P.y=200;b.x=232;b.y=200;step(1);shot('b_bossbot_spin.png');
b=setup('bossbot');b.state='windup';b.attack='lunge';b.t=0.5;b.dur=0.7;b.dirLock=Math.PI;dd().P.x=190;dd().P.y=200;b.x=250;b.y=200;step(1);shot('b_bossbot_lunge.png');
console.log('done');
