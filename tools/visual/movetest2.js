const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js');const C=require('../../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
function crop(px,py,w,h,sc){const cv=createCanvas(800,500),c=cv.getContext('2d');C.render(c);
  const o=createCanvas(w*sc,h*sc),co=o.getContext('2d');co.drawImage(cv,(px-w/2)*2,(py*0.75-h*0.75)*2,w*2,h*2,0,0,w*sc,h*sc);return o;}
const frames=[];
for(const [key,label] of [['KeyS','down'],['KeyW','up'],['KeyA','left']]){
  C.reset();C.clear();const P=dd().P;P.x=200;P.y=200;C.S.aim='soft';
  C.key(key,true);
  for(let i=0;i<50;i++){C.update(1/60);if(i>=20&&i%4===0&&frames.length<12)frames.push(crop(P.x,P.y,56,62,4));}
  C.key(key,false);
}
const out=createCanvas(6*224,2*248),co=out.getContext('2d');co.fillStyle='#d6c49c';co.fillRect(0,0,out.width,out.height);
frames.slice(0,12).forEach((f,i)=>co.drawImage(f,(i%6)*224,Math.floor(i/6)*248));
fs.writeFileSync('move_dirs.png',out.toBuffer('image/png'));
