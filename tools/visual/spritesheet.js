// Renders the sprite-look hero to PNG: the raw frame sheet (walk and attack, four
// directions) and in-game attack shots per direction. Run from the project root:
//   node tools/visual/spritesheet.js
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js');const C=require('../../src/combat.js');C.init(G.lib);
const dirs=['down','left','right','up'];

// 1 frame sheet, 4x zoom
const Z=4,cw=48*Z,ch=48*Z;
let cv=createCanvas(cw*9,ch*4),c=cv.getContext('2d');
c.fillStyle='#f4f4f4';c.fillRect(0,0,cv.width,cv.height);c.imageSmoothingEnabled=false;
dirs.forEach((d,r)=>{
  c.drawImage(G.lib.heroP(d,'idle',0,1),0,r*ch,48*Z,48*Z);
  for(let f=0;f<4;f++){
    c.drawImage(G.lib.heroP(d,'walk',f,1),(1+f)*cw,r*ch,48*Z,48*Z);
    c.drawImage(G.lib.heroP(d,'atk',f,1),(5+f)*cw,r*ch,48*Z,48*Z);
  }
});
fs.writeFileSync('sprite_sheet.png',cv.toBuffer('image/png'));

// 2 in-game: each direction, frames through one light swing and the heavy third hit
const faces={down:Math.PI/2,left:Math.PI,right:0,up:-Math.PI/2};
const steps=[2,5,8,11,15];
cv=createCanvas(200*steps.length,200*8);c=cv.getContext('2d');
const one=createCanvas(800,500),oc=one.getContext('2d');
function swing(row,face,combo){
  C.reset();C.clear();C.S.look='sprite';
  const P=C.dbg().P;P.x=200;P.y=160;P.face=face;P.faceVis=face;
  for(let k=0;k<combo;k++){C.key('KeyJ',true);C.update(1/60);C.key('KeyJ',false);for(let i=0;i<22;i++)C.update(1/60);}
  C.key('KeyJ',true);C.update(1/60);C.key('KeyJ',false);
  let done=1;
  steps.forEach((n,col)=>{
    while(done<n){C.update(1/60);done++;}
    C.render(oc);
    const Q=C.dbg().P;
    c.drawImage(one,Q.x*2-100,Q.y*2*0.75-120,200,200,col*200,row*200,200,200);
  });
}
dirs.forEach((d,r)=>{swing(r*2,faces[d],0);swing(r*2+1,faces[d],2);});
fs.writeFileSync('sprite_attack.png',cv.toBuffer('image/png'));
console.log('wrote sprite_sheet.png and sprite_attack.png');
