const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js');const C=require('../../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
function crop(px,py,w,h,sc){const cv=createCanvas(800,500),c=cv.getContext('2d');C.render(c);
  const o=createCanvas(w*sc,h*sc),co=o.getContext('2d');co.drawImage(cv,(px-w/2)*2,(py*0.75-h*0.8)*2,w*2,h*2,0,0,w*sc,h*sc);return o;}
function swing(face,skip){
  C.reset();C.clear();C.S.crit=0;const P=dd().P;P.x=200;P.y=220;P.face=face;P.faceVis=face;
  const frames=[];
  C.key('KeyJ',true);C.update(1/60);C.key('KeyJ',false);
  for(let i=0;i<10;i++){frames.push(crop(P.x,P.y,50,52,6));C.update(1/60);}
  return frames;
}
const rows=[swing(Math.PI/2),swing(-Math.PI/2)];
const cols=5,cw=300,ch=312,out=createCanvas(cols*cw,4*ch),co=out.getContext('2d');co.fillStyle='#d6c49c';co.fillRect(0,0,out.width,out.height);
rows.forEach((fr,ri)=>fr.forEach((f,i)=>co.drawImage(f,(i%cols)*cw,(ri*2+Math.floor(i/cols))*ch)));
fs.writeFileSync('sweep3.png',out.toBuffer('image/png'));
