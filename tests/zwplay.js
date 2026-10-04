const {createCanvas}=require('@napi-rs/canvas');
global.__mk=(w,h)=>createCanvas(w,h);
global.GameArt=require('../src/art.js');
global.StyleLab=require('../src/stylelab.js');
const Zw=require('../src/zoneworld.js');
const seed=+process.argv[2]||37;
Zw.init(seed);while(!Zw.state().ready)Zw.step(10);
const st=Zw.state();
function frames(n){for(let i=0;i<n;i++)Zw.update(1/60);}
function hit(x,y,dx){ Zw.teleport(x+dx,y); Zw.key('KeyD',true);frames(3);Zw.key('KeyD',false);frames(10); if(dx>0){Zw.key('KeyA',true);frames(3);Zw.key('KeyA',false);frames(8);} Zw.key('KeyJ',true);Zw.key('KeyJ',false);frames(25); }
const log=[];
// the Factory only needs the key
const key=st.objs.filter(o=>o.type==='key')[0];
Zw.teleport(key.x-20,key.y);Zw.key('KeyD',true);frames(30);Zw.key('KeyD',false);
log.push('key got '+key.got);
const g0=st.gates[0];Zw.teleport(g0.cx*32+16-st.world.sgn*50,g0.cy*32+16);frames(40);
log.push('exit gate open='+g0.open+' Commons revealed='+st.zones[1].revealed);
frames(400);
const ext=st.gates.filter(g=>!g.internal);
ext.slice(1).forEach(g=>{const mine=st.objs.filter(o=>o.gate===g.id);
  if(g.mech.type==='levers')mine.forEach(o=>hit(o.x,o.y,-22));
  else if(g.mech.type==='strike'){for(let i=0;i<3;i++){hit(mine[0].x,mine[0].y-6,-22);frames(15);}}
  log.push('external gate '+g.id+' '+g.mech.type+' open='+g.open);});
console.log(log.join('\n'));
console.log('every gate open:',st.gates.every(g=>g.open));
