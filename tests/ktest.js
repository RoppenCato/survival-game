const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../src/art.js');const C=require('../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
function step(n){for(let i=0;i<n;i++)C.update(1/60);}
function shot(name){const cv=createCanvas(800,500),c=cv.getContext('2d');C.render(c);fs.writeFileSync(name,cv.toBuffer('image/png'));}
function setup(hp){C.reset();C.clear();const P=dd().P;P.x=200;P.y=200;P.face=0;P.faceVis=0;const e=C.spawn('beast');e.hp=e.maxHp=hp;e.x=232;e.y=200;e.state='idle';e.cd=99;return e;}
// crit rate with 15%
C.S.crit=0.15;let crits=0,hits=0;
for(let n=0;n<300;n++){const e=setup(99);const before=e.hp;C.key('KeyJ',true);step(1);C.key('KeyJ',false);step(20);const dealt=before-e.hp;if(dealt>0){hits++;if(dealt>1.2&&dealt<1.6)crits++;}}
console.log('hits',hits,'crit-like first hits',crits,'(expect ~15%)');
// always crit: damage + rattle
C.S.crit=1;let e=setup(99);C.key('KeyJ',true);step(1);C.key('KeyJ',false);step(8);
console.log('crit dmg',(99-e.hp).toFixed(2),'rattle',e.rattle.toFixed(2),'flashRgb',e.flashRgb);
shot('k_crit.png');
// kill weight: count slowmo
C.S.crit=0;e=setup(1);C.key('KeyJ',true);step(1);C.key('KeyJ',false);
let maxSlow=0,slowT=0;for(let i=0;i<30;i++){C.update(1/60);const W=dd().W;if(W.slow.t>0){slowT+=1/60;maxSlow=Math.max(maxSlow,W.slow.t);}}
console.log('kill: dead',e.dead,'slowmo secs',slowT.toFixed(2),'(was 0.18+)');
// rattled slows the bot windup
C.S.crit=0;e=setup(99);e.state='windup';e.t=0;e.dur=0.55;e.dirLock=Math.PI;e.rattle=1.6;let t=0;while(e.state==='windup'&&t<200){C.update(1/60);t++;}
console.log('rattled windup frames',t,'(normal 33)');
C.S.crit=0.15;
