// Renders the classic hero's eyewear types, a few body shapes and the attack styles to PNG.
// Run from the project root:  node tools/visual/attackstyles.js
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js');const C=require('../../src/combat.js');C.init(G.lib);
const def=G.lib.heroDef;
const still={phase:0,amt:0,t:0.7,lx:0,ly:0,blink:0,sq:0};

// 1 eyewear (7 types) then three body shapes: front / side / back
const shapes=[{},{headW:0.9,headH:0.88,bodyH:1.1,legL:1.45,armL:1.2,eyeSize:0.8},{headW:1.2,headH:1.2,bodyH:0.85,legL:0.7,armL:0.9,eyeSize:1.3},{bodyW:1.4,bodyH:1.15,legL:0.8,legW:1.4,armL:1.2,armW:1.5}];
let cv=createCanvas(11*130,3*190),c=cv.getContext('2d');
c.fillStyle='#d9c9a0';c.fillRect(0,0,cv.width,cv.height);c.lineJoin='round';c.lineCap='round';
for(let t=0;t<11;t++){
  G.lib.setHero(t<7?Object.assign({},def,{eyewear:t}):Object.assign({},def,shapes[t-7]));
  ['down','left','up'].forEach((d,r)=>{c.save();c.translate(t*130+65,r*190+170);c.scale(3,3);G.lib.playerD(c,0,0,d,still,null);c.restore();});
}
fs.writeFileSync('eyewear.png',cv.toBuffer('image/png'));

// 2 attack styles: rows = style x (facing right, facing down), columns = time through one swing
const steps=[1,3,5,7,9,12,15];
cv=createCanvas(180*steps.length,150*8);c=cv.getContext('2d');
const one=createCanvas(800,500),oc=one.getContext('2d');
function swing(row,face,style){
  G.lib.setHero(Object.assign({},def,{atkStyle:style}));
  C.reset();C.clear();C.S.look='classic';
  const P=C.dbg().P;P.x=200;P.y=160;P.face=face;P.faceVis=face;
  C.key('KeyJ',true);C.update(1/60);C.key('KeyJ',false);
  let done=1;
  steps.forEach((n,col)=>{
    while(done<n){C.update(1/60);done++;}
    C.render(oc);
    c.drawImage(one,200*2-90,160*2*0.75-95,180,150,col*180,row*150,180,150);
  });
}
for(let s=0;s<4;s++){swing(s*2,0,s);swing(s*2+1,Math.PI/2,s);}
fs.writeFileSync('attack_styles.png',cv.toBuffer('image/png'));
G.lib.setHero();
console.log('wrote eyewear.png and attack_styles.png');
