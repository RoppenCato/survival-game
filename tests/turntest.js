const {createCanvas}=require('@napi-rs/canvas');
global.__mk=(w,h)=>createCanvas(w,h);
const G=require('../src/art.js');const C=require('../src/combat.js');C.init(G.lib);
const dd=()=>C.dbg();
function step(n){for(let i=0;i<n;i++)C.update(1/60);}
C.S.crit=0;
function setup(face,ex,ey){C.reset();C.clear();const P=dd().P;P.x=200;P.y=200;P.face=face;P.faceVis=face;const e=C.spawn('beast');e.hp=e.maxHp=99;e.x=ex;e.y=ey;e.state='idle';e.cd=99;return e;}
// A: facing right, enemy directly behind (left) at 36
for(const mode of ['soft','facing']){
  C.S.aim=mode;
  let e=setup(0,164,200);C.key('KeyJ',true);step(1);C.key('KeyJ',false);step(25);
  console.log(mode,'enemy behind:',e.hp<99?'HIT':'miss');
  // enemy above (up), facing right
  e=setup(0,200,164);C.key('KeyJ',true);step(1);C.key('KeyJ',false);step(25);
  console.log(mode,'enemy above, facing right:',e.hp<99?'HIT':'miss');
}
C.S.aim='soft';
// B: enemy far behind (80) but holding A -> attack goes left
let e=setup(0,120,200);C.key('KeyA',true);C.key('KeyJ',true);step(1);C.key('KeyJ',false);
console.log('holding A: attack dir',(dd().P.atk.dir).toFixed(2),'(pi=3.14 means left)');step(30);C.key('KeyA',false);
// C: turn during recovery
e=setup(0,300,200);C.key('KeyJ',true);step(1);C.key('KeyJ',false);step(16);
const ph=dd().P.atk.ph;C.key('KeyW',true);step(6);
console.log('phase',ph,'-> face after holding W during swing/recovery',dd().P.face.toFixed(2),'(-1.57 = up)');C.key('KeyW',false);
// far enemy behind and no input: should NOT snap (outside 52)
e=setup(0,120,200);C.key('KeyJ',true);step(1);C.key('KeyJ',false);console.log('far enemy behind, no input: dir',dd().P.atk.dir.toFixed(2),'(0 = forward)');
