// Renders the six animals (boar, deer, bear, snake, moose, wolf) in every pose to creatures.png.
// Columns: standing, moving, warning, attacking, stunned, then facing left. One row per design.
// Run from the project root:  node tools/visual/creatures.js
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js');
const def=G.lib.creatureDef;
function mk(set,col){const s=JSON.parse(JSON.stringify(def));Object.assign(s,set);Object.assign(s.col,col||{});return s;}
const designs=[
  mk({plan:5,bodyH:1.15,head:1.15,legLen:0.75,legW:1.1,neck:0.6,neckUp:0.05,snout:1.25,ears:1,tusks:1,hump:0.8,mane:1,hoof:1,snoutFlat:1,brow:1,tail:2,pattern:0,eyeSize:0.8,tell:1},{body:'#5b4636',belly:'#7a6350',accent:'#efe6cf',eye:'#1e1418',glow:'#ff5a3a'}),
  mk({plan:5,size:1.05,bodyW:0.95,bodyH:0.9,head:0.85,legLen:1.45,legW:0.75,neck:1.3,neckUp:0.95,snout:1.05,snoutW:0.8,ears:3,antlers:2,hoof:1,tail:1,tailPale:1,pattern:1,eyeSize:0.9},{body:'#a8713f',belly:'#ead9bd',accent:'#d9c9a6',eye:'#1e1418',glow:'#ffd34d'}),
  mk({plan:5,size:1.5,bodyW:1.1,bodyH:1.3,head:1.2,legLen:0.8,legW:1.6,neck:0.6,neckUp:0.2,snout:0.9,snoutW:1.05,ears:2,hump:1,tail:1,pattern:0,paleMuzzle:1,fangs:1,eyeSize:0.75,tell:2},{body:'#5a3d28',belly:'#b8946a',accent:'#efe6cf',eye:'#1e1418',glow:'#ff5a3a'}),
  mk({plan:6,size:0.9,pattern:2,fangs:1},{body:'#8a8f78',belly:'#d9d5bd',eye:'#1e1418',glow:'#ff5a3a'}),
  mk({plan:5,size:1.6,bodyW:1.05,bodyH:1.1,head:1.1,legLen:1.7,legW:0.9,neck:1,neckUp:0.55,snout:1.5,snoutW:1.2,ears:3,antlers:3,antlerSize:1.15,hump:1.2,hoof:1,tail:1,pattern:0,eyeSize:0.75,tell:1},{body:'#4f3b2c',belly:'#8a7a6a',accent:'#cdbb98',eye:'#1e1418',glow:'#ff5a3a'}),
  mk({plan:5,size:1.05,bodyH:0.9,legLen:1.15,legW:0.85,neck:0.9,neckUp:0.45,snout:1.2,snoutW:0.8,ears:1,tail:3,pattern:1,paleMuzzle:1,fangs:1,brow:1,eyeSize:0.85,tell:0},{body:'#727982',belly:'#d3d7dc',accent:'#f1ead6',eye:'#3a2a10',glow:'#ffd34d'})
];
const poses=[['idle',0,0.5,1],['chase',1,0.5,1],['windup',0,0.8,1],['lunge',1,0.5,1],['stunned',0,0.5,1],['chase',1,0.5,-1]];
const Z=3,cw=230,ch=230;
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
