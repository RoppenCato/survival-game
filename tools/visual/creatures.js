// Renders a few creature designs in every pose to creatures.png.
// Columns: standing, moving, warning, attacking, stunned, then facing left. One row per design.
// Run from the project root:  node tools/visual/creatures.js
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js');
const def=G.lib.creatureDef;
function mk(set,col){const s=JSON.parse(JSON.stringify(def));Object.assign(s,set);Object.assign(s.col,col||{});return s;}
const designs=[
  mk({}),
  mk({size:1.2,bodyW:1.35,bodyH:0.8,eyeStyle:3,top:1,pattern:2},{body:'#5f8f4a',belly:'#cfd98a',glow:'#ffd34d'}),
  mk({plan:1,eyes:1,eyeStyle:2,mouth:2,top:1,tail:2,tell:2},{body:'#b5652f',belly:'#e8c79a',glow:'#ff5a3a'}),
  mk({plan:1,size:1.3,legLen:1.5,eyes:1,mouth:0,top:2,tail:1,tell:2},{body:'#9fb7c9',belly:'#eef3fb',accent:'#dfe9f2',glow:'#7fd8ff'}),
  mk({plan:2,size:1.5,bodyW:1.2,eyeStyle:2,mouth:3,top:5,pattern:0},{body:'#8a7f76',belly:'#b9aea0',accent:'#e0a93a',glow:'#ff6a3a'}),
  mk({plan:2,size:0.8,head:1.3,bodyW:0.85,eyeStyle:1,mouth:2,top:2,tell:1},{body:'#b8402f',belly:'#e8873a',accent:'#2a1c2a',glow:'#ffd34d'}),
  mk({plan:3,eyeStyle:1,mouth:0,top:3,pattern:0,tell:3,hover:1.2},{body:'#3f7f86',belly:'#9fe0d8',accent:'#f6d878',glow:'#ffd96a'}),
  mk({plan:4,legs:6,eyes:4,eyeStyle:1,mouth:2,top:4,pattern:3,tell:1},{body:'#4a3f55',belly:'#7a6a86',accent:'#d9d0c0',glow:'#b8f27f'})
];
const poses=[['idle',0,0.5,1],['chase',1,0.5,1],['windup',0,0.8,1],['lunge',1,0.5,1],['stunned',0,0.5,1],['chase',1,0.5,-1]];
const Z=3,cw=170,ch=170;
const cv=createCanvas(cw*poses.length,ch*designs.length),c=cv.getContext('2d');
c.fillStyle='#d9c9a0';c.fillRect(0,0,cv.width,cv.height);c.lineJoin='round';c.lineCap='round';
designs.forEach((d,r)=>{
  G.lib.setCreature(d);
  poses.forEach((p,i)=>{
    c.save();c.translate(i*cw+cw/2,r*ch+ch-22);
    c.fillStyle='rgba(60,40,20,0.16)';c.beginPath();c.ellipse(0,0,30,8,0,0,7);c.fill();
    c.scale(Z,Z);
    G.lib.creatureD(c,0,0,{t:1.3,move:p[1],phase:1.1,dir:p[3],look:[p[3],0.2],state:p[0],k:p[2]});
    c.restore();
  });
});
G.lib.setCreature();
fs.writeFileSync('creatures.png',cv.toBuffer('image/png'));
console.log('wrote creatures.png');
