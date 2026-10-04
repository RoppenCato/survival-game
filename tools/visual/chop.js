// Renders chop.png: the hero chopping with the axe and stabbing with the knife in four directions (windup, strike,
// recover), and the bow with an arrow in flight, through the arena engine. Run from the project root:  node tools/visual/chop.js
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../../src/art.js'),C=require('../../src/combat.js');
C.init(G.lib);C.S.sound=false;C.S.juice=true;C.api.scene={noHud:true,noHotbar:true,begin:function(c){c.fillStyle='#8fc46a';c.fillRect(0,0,400,250);},items:function(){},end:function(){}};
const D=C.dbg(),P=D.P,W=D.W;W.enemies.length=0;W.pillars=[];
const cw=90,ch=110,Z=3,dirs=[0,Math.PI/2,Math.PI,-Math.PI/2],names=['right','down','left','up'],phases=[['windup',0.04],['active',0.05],['recover',0.1]];
const rows=[['axe',0],['knife',2]];
const cv=createCanvas(cw*(dirs.length*phases.length)*Z/3+40,ch*(rows.length+1)*Z/3+40),c=cv.getContext('2d');
c.fillStyle='#8fc46a';c.fillRect(0,0,cv.width,cv.height);
function setMode(mode){while(P.mode!==mode){C.key('KeyQ',true);C.update(0.016);C.key('KeyQ',false);C.update(0.016);}}
function snap(x,y){const f=createCanvas(400*2,250*2);const fc=f.getContext('2d');C.api.pixelScale=2;C.render(fc);
  // the hero stands at P.x,P.y*K; crop round him
  const sx=(P.x-cw/2)*2,sy=(P.y*0.75-ch*0.7)*2;c.drawImage(f,sx,sy,cw*2,ch*2,x,y,cw,ch);}
let col=0;
rows.forEach((row,ri)=>{
  setMode('gather');P.tool=row[1];
  dirs.forEach((d,di)=>{
    phases.forEach((ph,pi)=>{
      P.atk.ph='none';P.atk.since=9;P.atkBuf=0;P.x=200;P.y=170;P.face=d;P.faceVis=d;P.inAng=null;P.st=100;
      C.key('KeyJ',true);C.update(0.016);C.key('KeyJ',false);
      let t=0;while(P.atk.ph!==ph[0]&&t<2){C.update(0.01);t+=0.01;}
      const steps=Math.round(ph[1]/0.01);for(let i=0;i<steps;i++)C.update(0.01);
      snap(20+(di*phases.length+pi)*cw,20+ri*ch);
      c.fillStyle='#1d1622';c.font='9px sans-serif';c.fillText(row[0]+' '+names[di]+' '+ph[0],22+(di*phases.length+pi)*cw,16+ri*ch+ch);
    });
  });
});
// the bow: an arrow in flight
setMode('fight');C.key('KeyF',true);C.update(0.016);C.key('KeyF',false);C.update(0.016);
C.S.ranged='auto';
dirs.forEach((d,di)=>{P.x=200;P.y=170;P.face=d;P.faceVis=d;P.fireCd=0;P.st=100;W.projs.length=0;C.key('KeyJ',true);C.update(0.016);C.key('KeyJ',false);for(let i=0;i<6;i++)C.update(0.016);snap(20+di*phases.length*cw,20+rows.length*ch);c.fillStyle='#1d1622';c.fillText('bow '+names[di]+' projs '+W.projs.length,22+di*phases.length*cw,16+rows.length*ch+ch);});
fs.writeFileSync('chop.png',cv.toBuffer('image/png'));
console.log('wrote chop.png');
