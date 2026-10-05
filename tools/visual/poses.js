// hero carrying things at rest and walking, in four directions, through the engine
const {createCanvas}=require('@napi-rs/canvas');const fs=require('fs');global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js'),I=require('../../src/items.js');global.Items=I;const C=require('../../src/combat.js');
C.init(G.lib);C.S.sound=false;C.S.juice=true;C.api.scene={noHud:true,noHotbar:true,begin:function(c){c.fillStyle='#8fc46a';c.fillRect(0,0,400,250);},items:function(){},end:function(){}};
const D=C.dbg(),P=D.P,W=D.W;W.enemies.length=0;W.pillars=[];
const eq={weapon:I.make('sword','iron'),bow:I.make('bow','wood'),axe:I.make('axe','flint'),pick:I.make('pick','flint'),knife:I.make('knife','flint')};
let held='sword';
C.api.items={held:function(){return eq[held]||null;},tool:function(i){return eq[['axe','pick','knife'][i]]||null;},weapon:function(k){return eq[k==='sword'?'weapon':'bow']||null;}};
const cw=60,ch=80,dirs=[0,Math.PI/2,Math.PI,-Math.PI/2],names=['right','down','left','up'];
const rows=[['sword','fight',0,false],['none','fight',0,false],['axe','gather',0,false],['pick','gather',1,false],['knife','gather',2,false],['axe walk','gather',0,true],['sword walk','fight',0,true]];
const cv=createCanvas(cw*dirs.length*3+20,ch*rows.length*3+20),c=cv.getContext('2d');c.fillStyle='#8fc46a';c.fillRect(0,0,cv.width,cv.height);
function setMode(m){let g=0;while(P.mode!==m&&g++<4){C.key('KeyQ',true);C.update(0.016);C.key('KeyQ',false);C.update(0.016);}}
function snap(x,y){const f=createCanvas(800,500);const fc=f.getContext('2d');C.api.pixelScale=2;C.render(fc);c.drawImage(f,(P.x-cw/2)*2,(P.y*0.75-ch*0.7)*2,cw*2,ch*2,x,y,cw*3,ch*3);}
rows.forEach((row,ri)=>{
  const nm=row[0].split(' ')[0];setMode(row[1]);P.tool=row[2];
  held=nm==='none'?'x':(nm==='sword'?'weapon':nm);
  if(nm==='none')eq.weapon=null;else eq.weapon=I.make('sword','iron');
  dirs.forEach((d,di)=>{P.x=200;P.y=170;P.face=d;P.faceVis=d;P.atk.ph='none';P.vx=P.vy=0;
    if(row[3]){const k=['KeyD','KeyS','KeyA','KeyW'][di];C.key(k,true);for(let i=0;i<14;i++)C.update(0.03);P.x=200;P.y=170;snap(10+di*cw*3,10+ri*ch*3);C.key(k,false);C.update(0.3);}
    else{C.update(0.05);snap(10+di*cw*3,10+ri*ch*3);}
    c.fillStyle='#1d1622';c.font='12px sans-serif';c.fillText(row[0]+' '+names[di],12+di*cw*3,ri*ch*3+ch*3+4);
  });
});
fs.writeFileSync('poses.png',cv.toBuffer('image/png'));console.log('wrote poses.png');
