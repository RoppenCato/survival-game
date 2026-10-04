const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../src/art.js');const C=require('../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
function step(n){for(let i=0;i<n;i++)C.update(1/60);}
// speed and stamina
C.reset();C.clear();let P=dd().P;P.x=30;P.y=200;
C.key('KeyD',true);step(30);const walkSpeed=Math.hypot(P.vx,P.vy);
C.key('ShiftLeft',true);step(30);const spr=Math.hypot(P.vx,P.vy);
console.log('walk speed',walkSpeed.toFixed(0),'sprint speed',spr.toFixed(0),'stamina after 0.5s sprint',P.st.toFixed(1));
let t=0;while(P.st>0.6&&t<600){step(1);t++;}
console.log('stamina empties after',(t/60+0.5).toFixed(1),'s of sprinting; sprintLock',P.sprintLock);
step(10);console.log('speed when empty and shift held',Math.hypot(P.vx,P.vy).toFixed(0));
C.key('ShiftLeft',false);C.key('KeyD',false);
// release and regen
step(120);console.log('stamina after 2s rest',P.st.toFixed(1));
// sprint again requires >=14
C.key('KeyD',true);C.key('ShiftLeft',true);step(30);console.log('sprint again speed',Math.hypot(P.vx,P.vy).toFixed(0),'lock',P.sprintLock);
C.key('KeyD',false);C.key('ShiftLeft',false);
// cannot sprint while attacking/guarding
C.reset();C.clear();P=dd().P;P.x=100;P.y=200;C.key('KeyD',true);C.key('ShiftLeft',true);C.key('KeyK',true);step(40);console.log('guard + shift speed',Math.hypot(P.vx,P.vy).toFixed(0),'(guard walk ~65)');
// frames for sprint look
C.key('KeyK',false);C.key('ShiftLeft',false);C.key('KeyD',false);
const out=createCanvas(6*224,2*248),co=out.getContext('2d');co.fillStyle='#d6c49c';co.fillRect(0,0,out.width,out.height);
function crop(px,py,w,h,sc){const cv=createCanvas(800,500),c=cv.getContext('2d');C.render(c);const o=createCanvas(w*sc,h*sc),c2=o.getContext('2d');c2.drawImage(cv,(px-w/2)*2,(py*0.75-h*0.75)*2,w*2,h*2,0,0,w*sc,h*sc);return o;}
let idx=0;
for(const [key,sprint] of [['KeyD',false],['KeyD',true],['KeyS',false],['KeyS',true]]){
  C.reset();C.clear();P=dd().P;P.x=60;P.y=120;C.key(key,true);if(sprint)C.key('ShiftLeft',true);
  const fr=[];
  for(let i=0;i<60;i++){C.update(1/60);if(i>=30&&i%4===0&&fr.length<3)fr.push(crop(P.x,P.y,56,62,4));}
  C.key(key,false);C.key('ShiftLeft',false);
  fr.forEach((f)=>{co.drawImage(f,(idx%6)*224,Math.floor(idx/6)*248);idx++;});
}
fs.writeFileSync('sprint.png',out.toBuffer('image/png'));
