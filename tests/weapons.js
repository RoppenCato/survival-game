// The weapons through the engine: each melee kind swung at two beasts in a line (the spear should hit both, a seax only
// the first), the club's stagger, the chains, and the ranged kinds (the sling takes a stone, a javelin is thrown and
// lands). Prints what happened; exits 0 unless something throws. Read the lines.
const {createCanvas}=require('@napi-rs/canvas');global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../src/art.js'),I=require('../src/items.js');global.Items=I;const C=require('../src/combat.js');
C.init(G.lib);C.S.sound=false;C.S.juice=true;C.S.crit=0;C.api.scene={noHud:true,begin:function(){},items:function(){},end:function(){}};
const D=C.dbg(),P=D.P,W=D.W;W.pillars=[];
let arm={melee:'sword',ranged:'bow'},shot=[],landed=[];
C.api.items={held:function(){return P.mode==='fight'?(P.weapon==='ranged'?I.make(arm.ranged,'copper'):I.make(arm.melee,'copper')):null;},tool:function(){return null;},weapon:function(k){return I.make(k==='bow'?arm.ranged:arm.melee,'copper');}};
C.api.onShoot=function(thing){shot.push(thing?thing.kind:'ammo');};C.api.onThrowLand=function(x,y,thing){landed.push(thing.kind);};
function beast(x,y){const e=C.spawn('beast');e.x=x;e.y=y;e.hp=e.maxHp=100;e.hold=true;e.state='idle';e.r=8;return e;}
function clear(){W.enemies.length=0;W.projs.length=0;}
let bad=0;
P.mode='fight';P.weapon='melee';
I.MELEE.forEach(k=>{arm.melee=k;clear();const prof=C.api.profiles()[k];const e1=beast(230,170),e2=beast(262,170);
  P.x=200;P.y=170;P.face=0;P.faceVis=0;P.st=100;P.atk.ph='none';P.atk.since=9;P.atk.combo=prof.chain-2;
  C.key('KeyJ',true);C.update(0.016);C.key('KeyJ',false);for(let i=0;i<60;i++)C.update(0.016);
  const d1=100-e1.hp,d2=100-e2.hp;
  console.log(k.padEnd(9),'hits near',d1.toFixed(2),'far',d2.toFixed(2),'stagger',e1.stagT?e1.stagT.toFixed(2):(e1.state),'motion',prof.motion);
  if(d1<=0){console.log('  BAD: no hit on the near beast');bad++;}
  if(k==='spear'&&d2<=0){console.log('  BAD: the spear should pierce to the second');bad++;}
  if(k==='seax'&&d2>0){console.log('  BAD: a seax should stop at the first');bad++;}
});
// the chain lengths
I.MELEE.forEach(k=>{arm.melee=k;const prof=C.api.profiles()[k];P.atk.ph='none';P.atk.since=0.1;P.atk.combo=0;let seen=[];
  for(let n=0;n<prof.chain+1;n++){P.st=100;C.key('KeyJ',true);C.update(0.016);C.key('KeyJ',false);seen.push(P.atk.combo);for(let i=0;i<80;i++){C.update(0.016);if(P.atk.ph==='none')break;}P.atk.since=0.1;}
  console.log(k.padEnd(9),'chain',prof.chain,'combos',seen.join(','));});
// ranged
P.weapon='ranged';
I.RANGED.forEach(k=>{arm.ranged=k;clear();shot=[];landed=[];const e=beast(300,170);P.x=200;P.y=170;P.face=0;P.fireCd=0;P.st=100;P.atk.ph='none';
  C.mouse(300,125);C.key('KeyJ',true);C.update(0.016);C.key('KeyJ',false);for(let i=0;i<90;i++)C.update(0.016);
  console.log(k.padEnd(9),'shot',shot.join(','),'hit for',(100-e.hp).toFixed(2),'landed',landed.join(',')||'-');
  if(100-e.hp<=0){console.log('  BAD: no hit');bad++;}
  if(I.KINDS[k].thrown&&!landed.length){console.log('  BAD: a thrown thing should land');bad++;}
});
console.log('bad =',bad);
