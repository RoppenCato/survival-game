// Renders the hero's walk cycle (eight moments) in each direction to PNG, to compare settings.
// Rows: south, north with the old waddle (sway 1, stance 1), then south, north, west with the current default.
// Run from the project root:  node tools/visual/walkcycle.js
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js');
const def=G.lib.heroDef,old=Object.assign({},def,{sway:1,stance:1});
const rows=[[old,'down'],[old,'up'],[def,'down'],[def,'up'],[def,'left']];
const N=8,Z=4,cw=36*Z,ch=44*Z;
const cv=createCanvas(cw*N,ch*rows.length),c=cv.getContext('2d');
c.fillStyle='#d9c9a0';c.fillRect(0,0,cv.width,cv.height);c.lineJoin='round';c.lineCap='round';
rows.forEach(([spec,dir],r)=>{
  G.lib.setHero(Object.assign({},spec,{scale:1}));
  for(let i=0;i<N;i++){
    const an={phase:i/N*Math.PI*2,amt:1,t:0.7,lx:0,ly:0,blink:0,sq:0};
    c.save();c.translate(i*cw+cw/2,r*ch+ch-16);c.scale(Z,Z);G.lib.playerD(c,0,0,dir,an,null);c.restore();
  }
});
G.lib.setHero();
fs.writeFileSync('walk_cycle.png',cv.toBuffer('image/png'));
console.log('wrote walk_cycle.png');
