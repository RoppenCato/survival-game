// Renders facings.png: every animal turned through eight headings (walking), and the hero in eight directions.
// Run from the project root:  node tools/visual/facings.js
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js'),lib=G.lib;
const keys=['moose','deer','bear','boar','wolf','snake'],Z=3,cw=190,ch=250,N=8;
const cv=createCanvas(cw*(N+1),ch*(keys.length+1)),c=cv.getContext('2d');
c.fillStyle='#8fc46a';c.fillRect(0,0,cv.width,cv.height);c.lineJoin='round';c.lineCap='round';
keys.forEach((k,r)=>{
  const H=lib.makeCreature(lib.animalSpec(k));
  for(let i=0;i<=N;i++){
    c.save();c.translate(i*cw+cw/2,r*ch+ch-50);c.scale(Z,Z);
    const s={t:1.3,move:1,phase:1.1,dir:1,state:'chase',k:0.5};
    s.ang=i*Math.PI/4;
    lib.creatureD(c,0,0,s,H);
    c.restore();
  }
});
[['down',0],['down',1],['right',0],['up',1],['up',0],['up',-1],['left',0],['down',-1]].forEach((d,i)=>{
  c.save();c.translate(i*cw+cw/2,keys.length*ch+ch-50);c.scale(Z*1.3,Z*1.3);
  lib.playerD(c,0,0,d[0],{phase:1.1,amt:1,t:1,lx:0,ly:0,blink:0,sq:0,turn:d[1]},null);
  c.restore();
});
fs.writeFileSync('facings.png',cv.toBuffer('image/png'));
console.log('wrote facings.png');
