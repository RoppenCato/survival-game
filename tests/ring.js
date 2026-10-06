// The arm ring's rules (docs/arm-ring.md): coils bound to their side, a rune cut only when known, filing, the metals'
// coils; and the engine's rune mods: sprint cost, the riposte window, the boar's charge, the roll, the heavy blow.
// Prints what happened; exits 0 unless something throws. Read the lines.
const {createCanvas}=require('@napi-rs/canvas');global.__mk=(w,h)=>createCanvas(w,h);
const R=require('../src/runes.js');let bad=0;
function check(name,ok){console.log((ok?'ok  ':'BAD ')+name);if(!ok)bad++;}
// the ring
const ring=R.newRing('bronze'),known={};
check('bronze has hand and foot',ring.coils.map(c=>c.side).join(',')==='hand,foot');
check('nothing cut when unknown',R.cut(ring,'riposte',known)<0);
known.riposte=1;known.surefeet=1;known.stonesense=1;known.roll=1;
check('riposte cut into the hand coil',R.cut(ring,'riposte',known)===0&&ring.coils[0].id==='riposte');
check('an eye rune has no coil on bronze',R.cut(ring,'stonesense',known)<0);
check('surefeet into the foot coil',R.cut(ring,'surefeet',known)===1);
check('roll files surefeet away',R.cut(ring,'roll',known)===1&&ring.coils[1].id==='roll'&&!R.alive(ring,'surefeet'));
check('cutting an alive rune again is refused',!R.canCut(ring,'roll',known));
check('file empties the coil',R.file(ring,1)&&ring.coils[1].id===null);
check('silver opens the eye',R.newRing('silver').coils.map(c=>c.side).join(',')==='hand,foot,eye');
check('gold has six, two per side',R.newRing('gold').coils.length===6);
check('dragon has eight',R.newRing('dragon').coils.length===8);
// the engine's mods
const G=require('../src/art.js'),I=require('../src/items.js');global.Items=I;const C=require('../src/combat.js');
C.init(G.lib);C.S.sound=false;C.S.juice=true;C.S.crit=0;C.api.scene={noHud:true,begin:function(){},items:function(){},end:function(){}};
const D=C.dbg(),P=D.P,W=D.W;W.pillars=[];
let mods={};C.api.mods=function(){return mods;};
C.api.items={held:function(){return P.mode==='gather'?I.make('axe','copper'):I.make('sword','copper');},tool:function(){return I.make('axe','copper');},weapon:function(k){return k==='bow'?I.make('bow','wood'):I.make('sword','copper');}};
function beast(x,y){const e=C.spawn('bot');e.x=x;e.y=y;e.hp=e.maxHp=100;e.hold=true;e.state='idle';e.r=8;return e;}
function run(n,dt){for(let i=0;i<n;i++)C.update(dt||0.016);}
// sprint cost
P.mode='fight';P.x=200;P.y=170;P.st=100;mods={};C.key('KeyD',true);C.key('ShiftLeft',true);run(30);const st1=P.st;P.st=100;mods={sprintCost:0.5};run(30);const st2=P.st;C.key('KeyD',false);C.key('ShiftLeft',false);run(5);
check('sure feet halves the sprint cost ('+(100-st1).toFixed(1)+' vs '+(100-st2).toFixed(1)+')',Math.abs((100-st2)*2-(100-st1))<1.5);
// the riposte: a parry opens a heavy blow
C.mouse(300,128);W.enemies.length=0;mods={riposte:1};P.x=200;P.y=170;P.face=0;P.st=100;P.riposteT=1;P.atk.ph='none';P.atk.since=9;P.atk.combo=0;const e1=beast(230,170);
C.key('KeyJ',true);C.update(0.016);C.key('KeyJ',false);run(60);
check('riposte: the swing after a parry is the heavy one (dealt '+(100-e1.hp).toFixed(2)+')',100-e1.hp>=2.5);
// the boar's charge: sprinting into a beast
W.enemies.length=0;mods={charge:1};P.x=100;P.y=170;P.face=0;P.st=100;P.atk.ph='none';const e2=beast(150,170);C.key('KeyD',true);C.key('ShiftLeft',true);run(45);C.key('KeyD',false);C.key('ShiftLeft',false);run(5);
check('boar’s charge bowls a beast over (dealt '+(100-e2.hp).toFixed(2)+', moved '+Math.round(e2.x-150)+')',100-e2.hp>0&&e2.x>152);
W.enemies.length=0;mods={};P.x=100;P.y=170;P.st=100;const e3=beast(150,170);C.key('KeyD',true);C.key('ShiftLeft',true);run(45);C.key('KeyD',false);C.key('ShiftLeft',false);run(5);
check('without it, sprinting into a beast does nothing',100-e3.hp===0);
// the roll: longer and longer untouchable
mods={};P.x=200;P.y=170;P.st=100;P.roll.t=0;P.roll.cd=0;C.key('Space',true);C.update(0.016);C.key('Space',false);const inv1=P.invuln,t1=P.roll.t;run(40);
mods={roll:1};P.st=100;P.roll.cd=0;C.key('Space',true);C.update(0.016);C.key('Space',false);const inv2=P.invuln,t2=P.roll.t;run(60);
check('roll: longer ('+t1.toFixed(2)+' to '+t2.toFixed(2)+') and longer untouchable ('+inv1.toFixed(2)+' to '+inv2.toFixed(2)+')',t2>t1&&inv2>inv1);
// the heavy blow: hold in gather mode, let go
let hits=[],lists=0;C.api.harvest={list:function(){lists++;return [{x:230,y:170,r:8,kind:'tree',hp:50,max:50}];},hit:function(o,pw){hits.push(pw);}};
function setMode(m){let g=0;while(P.mode!==m&&g++<4){C.key('KeyQ',true);C.update(0.016);C.key('KeyQ',false);C.update(0.016);}}
W.enemies.length=0;setMode('gather');C.mouse(300,128);P.x=200;P.y=170;P.face=0;P.faceVis=0;P.inAng=null;P.vx=P.vy=0;P.tool=0;P.st=100;mods={};P.atk.ph='none';C.key('KeyJ',true);run(50);C.key('KeyJ',false);run(40);const plain=hits.slice();hits=[];
mods={heavyblow:1};P.atk.ph='none';P.st=100;P.face=0;P.faceVis=0;C.key('KeyJ',true);run(50);C.key('KeyJ',false);run(40);const heavy=hits.slice();
console.log('plain chops while held:',plain.map(v=>v.toFixed(1)).join(','),' heavy blow:',heavy.map(v=>v.toFixed(1)).join(','));
check('heavy blow: holding does not keep chopping, letting go lands about three blows',heavy.length>=1&&heavy.length<plain.length&&heavy[0]>=plain[0]*2.5);
console.log('bad =',bad);
