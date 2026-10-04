const {createCanvas}=require('@napi-rs/canvas');
global.__mk=(w,h)=>createCanvas(w,h);
global.GameArt=require('../src/art.js');
global.StyleLab=require('../src/stylelab.js');
const Zw=require('../src/zoneworld.js');
const MW=360,MH=240;
let fails=0,tot=0,t0=Date.now(),retries=0,genMs=[];
const seeds=process.argv[2]?+process.argv[2]:12;
for(let s=1;s<=seeds;s++){
  const t1=Date.now();const used=Zw.init(s*37);genMs.push(Date.now()-t1);tot++;if(used!==s*37)retries++;
  const st=Zw.state(),W=st.world,rooms=Zw.roomList();
  function bfs(allowGate){ // allowGate(g)=true -> gate passable
    const gateAt={};st.gates.forEach(g=>g.tiles.forEach(t=>gateAt[t[1]*MW+t[0]]=g));
    const seen=new Uint8Array(MW*MH);const q=[[Math.floor(st.hero.x/32),Math.floor(st.hero.y/32)]];seen[q[0][1]*MW+q[0][0]]=1;let h=0;
    while(h<q.length){const c=q[h++];for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=c[0]+d[0],ny=c[1]+d[1];if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const i=ny*MW+nx;if(seen[i])continue;
      const b=W.bar[i];if(b===1||b===2||b===4)continue;
      if(b===3){const g=gateAt[i];if(!g||!allowGate(g))continue;} else {const tn=['voidT'];if(W.solid[i]&&b!==3)continue;}
      seen[i]=1;q.push([nx,ny]);}}
    return seen;}
  const closed=bfs(()=>false),open=bfs(()=>true);
  let leak=false;for(let i=0;i<MW*MH;i++)if(closed[i]&&W.zid[i]!==0)leak=true;
  const zs=new Set();for(let i=0;i<MW*MH;i++)if(open[i])zs.add(W.zid[i]);
  const allZones=[0,1,2,3,4,5].every(z=>zs.has(z));
  const objsOk=st.objs.every(o=>open[Math.floor(o.y/32)*MW+Math.floor(o.x/32)]);
  let mechOk=true;
  const keyOk=st.objs.filter(o=>o.type==='key').every(o=>{const i=Math.floor(o.y/32)*MW+Math.floor(o.x/32);return W.zid[i]===0;});
  // number of reachable rooms with everything closed
  const seenRooms=new Set();for(let i=0;i<MW*MH;i++)if(closed[i]&&W.rA[i]>=0&&W.bar[i]===0)seenRooms.add(W.rA[i]);
  const nProps=st.props.length;
  if(leak||!allZones||!objsOk||!mechOk||!keyOk){fails++;console.log('seed',s*37,'FAIL leak',leak,'zones',[...zs].join(','),'objsOk',objsOk,'mechOk',mechOk,'keyOk',keyOk);}
  else if(s<=3) console.log('seed',s*37,'ok; halls reachable with the exit closed:',seenRooms.size,'of',rooms.length,'; props',nProps,'; halls',rooms.length,'; openings',st.world.openings.length,'; sites',Zw.siteList().length);
}
console.log('worlds',tot,'failed checks',fails,'seed retries',retries,'avg init ms',Math.round(genMs.reduce((a,b)=>a+b,0)/genMs.length),'max',Math.max(...genMs));
