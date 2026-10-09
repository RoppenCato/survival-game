// Renders the hero's attack styles to PNG, each as a sequence facing right and facing down.
// Run from the project root:  node tools/visual/attackstyles.js
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js');const C=require('../../src/combat.js');C.init(G.lib);
const def=G.lib.heroDef;
const still={phase:0,amt:0,t:0.7,lx:0,ly:0,blink:0,sq:0};

// attack styles: rows = style x (facing right, facing down), columns = time through one swing
const steps=[1,3,5,7,9,12,15];
cv=createCanvas(180*steps.length,150*8);c=cv.getContext('2d');
const one=createCanvas(800,500),oc=one.getContext('2d');
function swing(row,face,style){
  G.lib.setHero(Object.assign({},def,{atkStyle:style}));
  C.reset();C.clear();
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
console.log('wrote attack_styles.png');
