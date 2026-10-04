const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js');const C=require('../../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
function crop(px,py,w,h,sc){const cv=createCanvas(800,500),c=cv.getContext('2d');C.render(c);
  const o=createCanvas(w*sc,h*sc),co=o.getContext('2d');co.drawImage(cv,(px-w/2)*2,(py*0.75-h*0.85)*2,w*2,h*2,0,0,w*sc,h*sc);return o;}
function swing(face,combo){
  C.reset();C.clear();C.S.crit=0;const P=dd().P;P.x=200;P.y=230;P.face=face;P.faceVis=face;
  for(let k=0;k<=combo;k++){C.key('KeyJ',true);C.update(1/60);C.key('KeyJ',false);
    if(k<combo){for(let i=0;i<20;i++){C.update(1/60);if(dd().P.atk.ph==='recover'&&dd().P.atk.t>0.05)break;}}}
  const frames=[];
  for(let i=0;i<8;i++){frames.push(crop(P.x,P.y,56,60,4.6));C.update(1/60);}
  return frames;
}
const rows=[swing(-Math.PI/2,0),swing(-Math.PI/2,1),swing(Math.PI/2,0),swing(Math.PI/2,1)];
const cols=8,cw=258,ch=276,out=createCanvas(cols*cw,rows.length*ch),co=out.getContext('2d');co.fillStyle='#d6c49c';co.fillRect(0,0,out.width,out.height);
rows.forEach((fr,ri)=>fr.forEach((f,i)=>co.drawImage(f,i*cw,ri*ch)));
fs.writeFileSync('sweep6.png',out.toBuffer('image/png'));
