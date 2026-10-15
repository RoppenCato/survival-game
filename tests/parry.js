// The parry chain, played by bots (2026-10-15, Robin: "parry more when fighting... when you hit them after they are dizzy they
// attack and you can parry again; to make combos. Can you try one on one a bit yourself and see what feels good?").
// Two bots with a person's limits (a reaction that wanders, a share of blows misjudged):
//   parrier: raises the guard so the blow lands in the parry's moment, hits while the foe reels, stops in time to parry the
//            answer, and hits a foe that has just swung and missed;
//   blocker: raises the guard as soon as a blow is seen and holds it, hits whenever the foe is not winding up.
// For each fight: won, how long, health left, parries, the longest chain, blows landed (and how many on a reeling foe), hits taken.
// Usage: node tests/parry.js [fights a line]   CHAIN='{"stun":0.3}' tries the chain's numbers.  Exits 0 unless something throws.
const {createCanvas}=require('@napi-rs/canvas');global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../src/art.js'),I=require('../src/items.js');global.Items=I;const C=require('../src/combat.js');
C.init(G.lib);C.S.sound=false;C.S.juice=true;C.S.crit=0.15;C.S.weight='snappy';C.S.aim='soft';
C.api.scene={noHud:true,begin(){},items(){},end(){},walk(){return true;},bounds:{x0:-4000,y0:-4000,x1:4000,y1:4000}};
const D=C.dbg(),P=D.P,W=D.W;W.pillars=[];
const N=+(process.argv[2]||40);
if(process.env.CHAIN)Object.assign(C.api.chain,JSON.parse(process.env.CHAIN));
let heroKind='sword',heroShield=true;
C.api.items={held:()=>P.mode==='fight'?I.make(heroKind,'iron'):null,tool:()=>null,weapon:k=>k==='bow'?null:I.make(heroKind,'iron')};
C.api.shield=()=>heroShield;C.api.armor=()=>0.3;
const BASE_R={wolf:7,boar:8,bear:9,moose:7};let want=null;
C.api.dress=function(e){if(e.type!=='beast'&&e.type!=='brute')return;const k=want||'boar',sp=G.lib.animalSpec(k);e.creature=true;e.kindA=k;e.r=BASE_R[k]*sp.size;e.cfg={speed:58*sp.speed,windup:sp.windup,lunge:175*sp.lunge,atk:e.type==='beast'?G.lib.animalAttack(k):null};e.hp=e.maxHp=sp.hp;C.tuneBeast(e,k);};
C.tune({});
const sd=()=>C.api.meleeStep();const KEYS={};function key(c,v){if(!!KEYS[c]===!!v)return;KEYS[c]=v;C.key(c,v);}
function gauss(){return (Math.random()+Math.random()+Math.random()-1.5)*0.67;}
function etaOf(e){if(e.dead||e.down||e.out)return 99;if(e.type==='soldier'){if((e.state==='windup'||e.state==='lunge')&&e.tgt===P&&!e.hitDone)return Math.max(0,e.hitT-W.t);return 99;}
  if(e.state==='windup')return Math.max(0,e.dur-e.t)+0.05;if(e.state==='lunge'&&!e.hitDone)return 0.02;return 99;}
function fight(foeMaker,bot){
  W.enemies.length=0;W.projs.length=0;C.reset&&0;P.x=0;P.y=0;P.hp=P.maxHp=100;P.st=100;P.dead=false;P.face=-Math.PI/2;P.faceVis=P.face;P.atk.ph='none';P.atk.since=9;P.chain=0;P.guard=false;P.invuln=0;P.hurtT=0;P.vx=P.vy=0;P.roll.t=0;
  for(const k in KEYS)key(k,false);
  const e=foeMaker();const T0=W.t;let t=0,plan=null,guardHeld=0,released=1,st={parries:0,chain:0,blows:0,reel:0,taken:0,hp0:P.hp};
  const hp0=e.hp;let lastHp=e.hp;C.api.onLog=ev=>{if(ev.k==='parry'){st.parries++;st.chain=Math.max(st.chain,ev.chain||1);}if(ev.k==='hit'){st.blows++;if(ev.e&&ev.e.state==='stunned')st.reel++;}if(ev.k==='hurt'||ev.k==='block')st.taken+=ev.through!=null?ev.through:ev.dmg;};
  while(t<90&&!P.dead&&!e.dead&&!e.out&&!e.fled){
    const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy),s=sd(),reach=s.reach+e.r+2,eta=etaOf(e);
    // the guard
    if(bot==='parrier'){
      if(eta<9&&!plan){const win=C.api.parryWindow();plan={at:W.t+eta-win*(0.25+Math.random()*0.55)+gauss()*0.045,until:W.t+eta+0.12};if(Math.random()<0.12)plan.at+=0.12+Math.random()*0.15;}   // (one blow in eight misjudged: late)
      if(plan&&W.t>=plan.at&&P.atk.ph!=='windup'&&P.atk.ph!=='active')key('KeyK',true);
      if(plan&&W.t>plan.until){plan=null;key('KeyK',false);}
    }else{
      if(eta<9&&eta<0.55+gauss()*0.06)key('KeyK',true);else if(eta>=9)key('KeyK',false);
    }
    // the blows
    const reeling=e.state==='stunned',left=reeling?e.dur-e.t:0,need=s.wu+s.ac*0.5+0.06;
    let hit=false;
    if(!KEYS.KeyK){
      if(bot==='parrier'){hit=d<=reach+4&&(reeling?left>need:(e.state==='recover'||(e.type!=='soldier'&&e.state==='chase'&&e.cd>0.6)));}
      else hit=d<=reach+4&&eta>0.7;
    }
    key('KeyJ',hit&&Math.floor(t*60)%4===0);
    // keep in reach, face him
    P.face=Math.atan2(dy,dx);const far=d>reach-2;key('KeyW',far&&dy<-6);key('KeyS',far&&dy>6);key('KeyA',far&&dx<-6);key('KeyD',far&&dx>6);
    C.update(1/60);t+=1/60;
  }
  for(const k in KEYS)key(k,false);C.api.onLog=null;
  return {won:e.dead||e.out||e.fled,t:t,hp:Math.max(0,P.hp),parries:st.parries,chain:st.chain,blows:st.blows,reel:st.reel,lost:!P.dead&&!(e.dead||e.out||e.fled)};
}
function man(kind,shield,armor,wits){return ()=>{const e=C.soldier({side:0,x:0,y:-80,wpn:{kind:kind,mat:'iron'},shield:shield,armor:armor,strength:4,wits:wits,loyal:true,nerve:1});return e;};}
function beast(k,type){return ()=>{want=k;const e=C.spawn(type||'beast');want=null;e.x=0;e.y=-90;return e;};}
function line(label,maker,bot){let won=0,t=0,hp=0,par=0,ch=0,bl=0,re=0,chMax=0,draw=0;for(let i=0;i<N;i++){const r=fight(maker,bot);if(r.won){won++;t+=r.t;hp+=r.hp;}if(r.lost)draw++;par+=r.parries;ch+=r.chain;chMax=Math.max(chMax,r.chain);bl+=r.blows;re+=r.reel;}
  const w=won||1;console.log((bot.padEnd(8)+' '+label).padEnd(46),'won',String(Math.round(won/N*100)).padStart(3)+'%','in',(t/w).toFixed(0).padStart(3)+'s','left',(hp/w).toFixed(0).padStart(3),'| parries',(par/N).toFixed(1).padStart(4),'chain',(ch/N).toFixed(1),'(longest',chMax+')','blows',(bl/N).toFixed(1).padStart(4),'of them on a reeling foe',Math.round(re/Math.max(1,bl)*100)+'%'+(draw?'  ('+draw+' not over in 90 s)':''));}
console.log('CHAIN',JSON.stringify(C.api.chain),'parry stun',C.api.men.parryStun,'| the hero: an iron',heroKind,'with a shield, leather');
for(const bot of ['parrier','blocker']){
  line('a man: sword, shield, leather',man('sword',true,0.2,4),bot);
  line('a man: axe, leather, no shield',man('axe',false,0.2,4),bot);
  line('a man: spear, shield, mail',man('spear',true,0.45,6),bot);
  line('a boar',beast('boar'),bot);
  line('a wolf',beast('wolf'),bot);
}
