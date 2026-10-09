const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js');const C=require('../../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
function step(n){for(let i=0;i<n;i++)C.update(1/60);}
function crop(px,py,w,h,sc){const cv=createCanvas(800,500),c=cv.getContext('2d');C.render(c);
  const o=createCanvas(w*sc,h*sc),co=o.getContext('2d');co.drawImage(cv,(px-w/2)*2,(py*0.75-h*0.75)*2,w*2,h*2,0,0,w*sc,h*sc);return o;}
const frames=[];
function setup(face){C.reset();C.clear();const P=dd().P;P.x=200;P.y=220;P.face=face;P.faceVis=face;return P;}
let P=setup(-Math.PI/2);step(10);frames.push(crop(P.x,P.y,56,62,5));            // idle north
C.key('KeyW',true);for(let i=0;i<40;i++){C.update(1/60);if(i>=22&&i%4===0&&frames.length<5)frames.push(crop(dd().P.x,dd().P.y,56,62,5));}C.key('KeyW',false);
// attack north
P=setup(-Math.PI/2);const e=C.spawn('beast');e.hp=e.maxHp=99;e.x=200;e.y=185;e.state='idle';e.cd=99;
C.key('KeyJ',true);step(1);C.key('KeyJ',false);step(3);frames.push(crop(P.x,P.y,56,62,5));step(3);frames.push(crop(P.x,P.y,56,62,5));
const out=createCanvas(frames.length*280,310),co=out.getContext('2d');co.fillStyle='#d6c49c';co.fillRect(0,0,out.width,out.height);
frames.forEach((f,i)=>co.drawImage(f,i*280,0));
fs.writeFileSync('north.png',out.toBuffer('image/png'));
