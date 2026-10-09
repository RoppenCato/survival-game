// Renders one sword swing in each direction (south, north, east, west), for both swing directions
// of the combo, to swing_dirs.png. Columns are moments through the swing.
// Run from the project root:  node tools/visual/swingdirs.js
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js');const C=require('../../src/combat.js');C.init(G.lib);
G.lib.setHero(Object.assign({},G.lib.heroDef,{scale:1}));
const faces=[Math.PI/2,-Math.PI/2,0,Math.PI];
const steps=[1,2,4,6,8,10,13,16];
const cv=createCanvas(170*steps.length,170*8),c=cv.getContext('2d');
const one=createCanvas(800,500),oc=one.getContext('2d');
function swing(row,face,second){
  C.reset();C.clear();C.S.aim='facing';
  const P=C.dbg().P;P.x=200;P.y=170;P.face=face;P.faceVis=face;
  if(second){C.key('KeyJ',true);C.update(1/60);C.key('KeyJ',false);for(let i=0;i<17;i++)C.update(1/60);}
  C.key('KeyJ',true);C.update(1/60);C.key('KeyJ',false);
  let done=1;
  steps.forEach((n,col)=>{
    while(done<n){C.update(1/60);done++;}
    C.render(oc);
    const Q=C.dbg().P;
    c.drawImage(one,Q.x*2-85,Q.y*2*0.75-110,170,170,col*170,row*170,170,170);
  });
}
faces.forEach((f,i)=>{swing(i*2,f,false);swing(i*2+1,f,true);});
fs.writeFileSync('swing_dirs.png',cv.toBuffer('image/png'));
G.lib.setHero();
console.log('wrote swing_dirs.png');
