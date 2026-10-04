const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js');const C=require('../../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
function step(n){for(let i=0;i<n;i++)C.update(1/60);}
function crop(px,py,w,h,sc){const cv=createCanvas(800,500),c=cv.getContext('2d');C.render(c);
  const o=createCanvas(w*sc,h*sc),co=o.getContext('2d');co.drawImage(cv,(px-w/2)*2,(py*0.75-h*0.7)*2,w*2,h*2,0,0,w*sc,h*sc);return o;}
function setup(face){C.reset();C.clear();const P=dd().P;P.x=200;P.y=200;P.face=face;P.faceVis=face;return P;}
const frames=[];
for(const f of [Math.PI/2,0,Math.PI,-Math.PI/2]){const P=setup(f);C.key('KeyK',true);step(10);frames.push(crop(P.x,P.y,60,56,8));C.key('KeyK',false);step(5);}
const out=createCanvas(4*480,448),co=out.getContext('2d');co.fillStyle='#d6c49c';co.fillRect(0,0,out.width,out.height);
frames.forEach((f,i)=>co.drawImage(f,i*480,0));
fs.writeFileSync('guard.png',out.toBuffer('image/png'));
