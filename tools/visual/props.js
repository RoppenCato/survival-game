// Bakes a list of world props side by side to props.png, with the hero for scale.
// Run from the project root:  node tools/visual/props.js [name name ...]   (default: the Viking set)
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
global.GameArt=require('../../src/art.js');
const SL=require('../../src/stylelab.js'),kit=SL.kit;
const BASE=kit.STYLE;
kit.setup(BASE);
const names=process.argv.length>2?process.argv.slice(2):['longhouse','vikingTent','palisade','shieldRack','dragonPost','runestone','burialMound','stoneShip','dryingRack','forge','brazier','woodpile','cairn'];
const sprites=names.map(n=>kit.bakeProp(n,10));
const cols=5,cw=300,ch=250,rows=Math.ceil(names.length/cols);
const cv=createCanvas(cols*cw,rows*ch),c=cv.getContext('2d');
const tile=kit.bakeTile('grass',0);
for(let y=0;y<rows*ch;y+=48)for(let x=0;x<cols*cw;x+=64)c.drawImage(tile,x,y);
c.lineJoin='round';c.lineCap='round';
sprites.forEach((s,i)=>{
  const x=(i%cols)*cw+cw/2+20,y=Math.floor(i/cols)*ch+ch-40;
  c.drawImage(s.cv,x+s.l*2,y+s.t*2);
  c.save();c.translate(x-110,y);c.scale(1.5,1.5);GameArt.lib.playerD(c,0,0,'down',{phase:0,amt:0,t:0.7,lx:0,ly:0,blink:0,sq:0},null);c.restore();
});
fs.writeFileSync('props.png',cv.toBuffer('image/png'));
console.log('wrote props.png');
