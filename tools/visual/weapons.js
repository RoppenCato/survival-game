// Every melee weapon mid-swing in four directions (windup, the hit, the end of the hit), and the ranged ones at the throw,
// through the engine: node tools/visual/weapons.js  ->  weapons.png
const {createCanvas}=require('@napi-rs/canvas');const fs=require('fs');global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js'),I=require('../../src/items.js');global.Items=I;const C=require('../../src/combat.js');
C.init(G.lib);C.S.sound=false;C.S.juice=true;C.api.scene={noHud:true,noHotbar:true,begin:function(c){c.fillStyle='#8fc46a';c.fillRect(0,0,400,250);},items:function(){},end:function(){}};
const D=C.dbg(),P=D.P,W=D.W;W.enemies.length=0;W.pillars=[];
let arm={melee:'sword',ranged:'bow'};
C.api.items={held:function(){return P.mode==='fight'?(P.weapon==='ranged'?I.make(arm.ranged,'copper'):I.make(arm.melee,'copper')):null;},tool:function(){return null;},weapon:function(k){return I.make(k==='bow'?arm.ranged:arm.melee,'copper');}};
const cw=70,ch=84,dirs=[0,Math.PI/2,Math.PI,-Math.PI/2],names=['right','down','left','up'],phases=[['windup',1],['hit',0.45],['hit',1]];
const kinds=I.MELEE, cols=dirs.length*phases.length;
const cv=createCanvas(cw*cols*2+20,ch*(kinds.length+1)*2+20),c=cv.getContext('2d');c.fillStyle='#8fc46a';c.fillRect(0,0,cv.width,cv.height);
function snap(x,y){const f=createCanvas(800,500);const fc=f.getContext('2d');C.api.pixelScale=2;C.render(fc);c.drawImage(f,(P.x-cw/2)*2,(P.y*0.75-ch*0.7)*2,cw*2,ch*2,x,y,cw*2,ch*2);}
function label(t,x,y){c.fillStyle='#1d1622';c.font='11px sans-serif';c.fillText(t,x,y);}
P.mode='fight';P.weapon='melee';
kinds.forEach((k,ri)=>{arm.melee=k;const prof=C.api.profiles()[k];
  dirs.forEach((d,di)=>{phases.forEach((ph,pi)=>{
    P.x=200;P.y=170;P.face=d;P.faceVis=d;P.vx=P.vy=0;P.st=100;
    const a=P.atk;a.ph='none';a.since=0.1;a.combo=prof.chain-2;a.chg=0;   // the next press is the heavy last hit of the chain
    C.key('KeyJ',true);C.update(0.004);C.key('KeyJ',false);              // starts the attack (windup)
    // step time to the wanted moment, by the engine's own step data
    let guard=0;while(guard++<400){const sd=C.api.stepData();
      if(ph[0]==='windup'&&a.ph==='windup'&&a.t>=sd.wu*0.9)break;
      if(ph[0]==='hit'&&a.ph==='active'&&a.t>=sd.ac*ph[1]*0.95)break;
      if(a.ph==='recover'||a.ph==='none')break;C.update(0.004);}
    P.x=200;P.y=170;snap(10+(di*phases.length+pi)*cw*2,10+ri*ch*2);
    label(k+' '+names[di]+' '+ph[0]+(ph[0]==='hit'?' '+ph[1]:''),12+(di*phases.length+pi)*cw*2,ri*ch*2+ch*2+4);
  });});
});
// ranged: the throw, one per kind, facing right and down
P.weapon='ranged';
I.RANGED.forEach((k,ki)=>{arm.ranged=k;[0,Math.PI/2].forEach((d,di)=>{P.x=200;P.y=170;P.face=d;P.faceVis=d;P.fireCd=0;P.st=100;P.atk.ph='none';W.projs.length=0;
  C.mouse(200+Math.cos(d)*100,125+Math.sin(d)*60);C.key('KeyJ',true);C.update(0.016);C.key('KeyJ',false);C.update(0.06);
  P.x=200;P.y=170;snap(10+(ki*2+di)*cw*2,10+kinds.length*ch*2);label(k+' '+names[di===0?0:1],12+(ki*2+di)*cw*2,kinds.length*ch*2+ch*2+4);});});
fs.writeFileSync('weapons.png',cv.toBuffer('image/png'));console.log('wrote weapons.png');
