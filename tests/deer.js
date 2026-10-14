// The wounded deer and the herd (2026-10-14): a shy beast shot once bleeds, slows, stops sooner, leaves blood on the ground and
// bleeds out; an unhurt one runs at full pace and lives; a herd runs together, and its watcher sees as far behind as before.
// Prints what happened; a line marked !! is a fault. Exits 0 unless something throws. Read the lines.
const {createCanvas}=require('@napi-rs/canvas');global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../src/art.js'),I=require('../src/items.js');global.Items=I;const C=require('../src/combat.js');
C.init(G.lib);C.S.sound=false;C.S.juice=false;C.S.crit=0;
C.api.scene={noHud:true,begin:function(){},items:function(){},end:function(){},walk:function(){return true;},bounds:{x0:-9000,y0:-9000,x1:9000,y1:9000}};
const D=C.dbg(),P=D.P,W=D.W;W.pillars=[];
C.api.items={held:function(){return null;},tool:function(){return null;},weapon:function(){return null;}};
let blood=[];C.api.onBlood=function(x,y,k,pool){blood.push({x:x,y:y,pool:!!pool});};
const SHY=C.api.shy;
function deer(x,y,herd,watch){const e=C.spawn('beast');e.x=x;e.y=y;e.r=8;e.cfg={speed:58*1.7,windup:0.4,lunge:0,dmg:0};e.hp=e.maxHp=5;e.aggro=230;e.flee=true;e.shy=true;e.face=-Math.PI/2;e.kind='deer';
  e.wander={x0:x,y0:y,r:140,wait:9};if(herd!=null)e.herd=herd;if(watch)e.watch=true;return e;}
function clear(){W.enemies.length=0;W.projs.length=0;blood=[];P.hp=P.maxHp=100;P.dead=false;}
function hero(x,y,face){P.x=x;P.y=y;P.face=face;P.faceVis=face;P.vx=P.vy=0;}
function step(n){for(let i=0;i<n;i++)C.update(1/60);}
let bad=0;function fault(m){console.log('  !! '+m);bad++;}
console.log('SHY',JSON.stringify(SHY));

// 1. the herd: three deer facing north, the hero coming up from the south (behind them); the watcher sees 230 back, the grazers 103
clear();const h1=deer(600,300,1,true),h2=deer(660,310,1,false),h3=deer(720,300,1,false);hero(600,900,-Math.PI/2);
let woke={},t=0;C.key('KeyW',true);
for(let i=0;i<60*20;i++){C.update(1/60);t+=1/60;[h1,h2,h3].forEach((e,j)=>{if(e.awake&&woke[j]==null)woke[j]={t:t.toFixed(2),d:Math.round(Math.hypot(P.x-e.x,P.y-e.y))};});if(h1.awake&&h2.awake&&h3.awake)break;}
C.key('KeyW',false);
console.log('herd: the watcher woke at',JSON.stringify(woke[0]),'its two grazers at',JSON.stringify(woke[1]),JSON.stringify(woke[2]));
if(!woke[0]||!woke[1]||!woke[2])fault('not all of the herd woke');
else{if(Math.abs(+woke[0].t-+woke[1].t)>0.05||Math.abs(+woke[0].t-+woke[2].t)>0.05)fault('the herd did not run together');if(woke[0].d<200)fault('the watcher saw the hero later than 200 units behind it');}
// a grazer alone, from behind: seen only at 103
clear();const g1=deer(600,300,null,false);hero(600,900,-Math.PI/2);t=0;let gd=null;C.key('KeyW',true);
for(let i=0;i<60*20;i++){C.update(1/60);if(g1.awake){gd=Math.round(Math.hypot(P.x-g1.x,P.y-g1.y));break;}}C.key('KeyW',false);
console.log('a grazer alone, come at from behind, noticed at',gd,'units (the watcher: '+(woke[0]?woke[0].d:'?')+')');
if(gd==null||gd>160)fault('a grazer should notice a walker behind it at about 103 units');

// 2. one arrow: the unhurt deer against the wounded one
function run(wound,secs){clear();const e=deer(300,300,null,false);hero(300,180,Math.PI/2);step(2);   // the hero before it, 120 off: it sees him and runs
  if(wound)W.projs.push({x:300,y:260,vx:0,vy:420,r:2.5,life:1,dmg:1.4,owner:'player',ang:Math.PI/2});
  let paces=[],lastX=e.x,lastY=e.y,died=null,stoppedAt=null,stops=0,far=0,tt=0,hpAt={};
  for(let i=0;i<60*secs;i++){C.update(1/60);tt+=1/60;const d=Math.hypot(P.x-e.x,P.y-e.y);far=Math.max(far,d);
    if(i%60===59){const sp=Math.hypot(e.x-lastX,e.y-lastY);lastX=e.x;lastY=e.y;if(e.awake&&!e.dead)paces.push({t:Math.round(tt),w:+(1-e.hp/e.maxHp).toFixed(2),pace:Math.round(sp)});}
    if(!e.dead&&e.awake===false&&stoppedAt==null){stoppedAt={t:tt.toFixed(1),d:Math.round(d)};}
    if(e.dead&&died==null){died={t:tt.toFixed(1),d:Math.round(d)};break;}}
  return{e:e,paces:paces,died:died,stoppedAt:stoppedAt,far:Math.round(far),drops:blood.filter(b=>!b.pool).length,pools:blood.filter(b=>b.pool).length,hp:+e.hp.toFixed(2)};}
const u=run(false,60),wn=run(true,90);
console.log('unhurt: pace a second',u.paces.slice(0,4).map(p=>p.pace).join(','),'| stops at',JSON.stringify(u.stoppedAt),'| alive with',u.hp,'| blood',u.drops+u.pools);
console.log('one wood arrow (1.4 of 5):');
console.log('  pace and wound by the second',wn.paces.filter((p,i)=>i<3||i%6===5).map(p=>p.t+'s w'+p.w+' '+p.pace).join(' | '));
console.log('  stops at',JSON.stringify(wn.stoppedAt),'| dead at',JSON.stringify(wn.died),'| furthest',wn.far,'| blood: '+wn.drops+' drops along the way, '+wn.pools+' pools where it stood');
if(u.died)fault('the unhurt deer died');if(u.drops+u.pools)fault('an unhurt deer bled');
if(!wn.died)fault('the shot deer never bled out in 90 s');else if(+wn.died.t<15)fault('it bled out too fast ('+wn.died.t+' s): one arrow should take a chase');
if(wn.drops<5)fault('too little blood along its run to follow');
if(wn.paces.length&&u.paces.length&&wn.paces[1]&&u.paces[1]&&wn.paces[1].pace>=u.paces[1].pace)fault('the wounded deer ran as fast as the unhurt one');
if(wn.stoppedAt&&u.stoppedAt&&wn.stoppedAt.d>=u.stoppedAt.d)fault('the wounded deer ran as far as the unhurt one before standing');
// 3. two arrows: the second on the standing deer
clear();{const e=deer(300,300,null,false);hero(300,180,Math.PI/2);step(2);W.projs.push({x:300,y:260,vx:0,vy:420,r:2.5,life:1,dmg:1.4,owner:'player',ang:Math.PI/2});
  let tt=0,died=null;for(let i=0;i<60*90;i++){C.update(1/60);tt+=1/60;if(i===60*12){hero(e.x,e.y-120,Math.PI/2);W.projs.push({x:e.x,y:e.y-40,vx:0,vy:420,r:2.5,life:1,dmg:1.4,owner:'player',ang:Math.PI/2});}if(e.dead){died=tt.toFixed(1);break;}}
  console.log('a second arrow after 12 s: dead at',died,'s (one arrow: '+(wn.died?wn.died.t:'never')+')');if(!died)fault('two arrows and it lived 90 s');}
console.log(bad?'\n'+bad+' fault(s) marked !!':'\nno faults');
