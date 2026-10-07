// Gathering rules (src/gather.js): the sweet spot, the rhythm window, the crack, a felled tree felling its neighbours and
// hurting the hero, trunks into logs, stumps growing back. Prints what happened; exits 0 unless something throws.
const G0=require('../src/gather.js');let bad=0;
function check(name,ok){console.log((ok?'ok  ':'BAD ')+name);if(!ok)bad++;}
const G=G0.cfg(null);
function tree(x,y){return {name:'oak',kind:'tree',x:x,y:y,s:0.5,hp:20,max:20,leanDir:1,lastHit:null,shake:0};}
const s={t:-80,h:90,l:-20,w:40};
// the sweet spot: from its side a blow bites spotBonus times
let o=tree(300,300),sp=G0.spot(G,o,0);const hero={x:300+sp.side*30,y:300};
let r=G0.hit(G,o,{power:2,right:true,hero:hero,t:0,s:s,ev:{}});
check('sweet spot: from the glint side the blow is x'+G.spotBonus+' (dealt '+r.dealt+')',r.spot&&r.dealt===2*G.spotBonus);
o=tree(300,300);r=G0.hit(G,o,{power:2,right:true,hero:{x:300-sp.side*30,y:300},t:0,s:s,ev:{}});
check('from the other side it is plain (dealt '+r.dealt+')',!r.spot&&r.dealt===2);
// the rhythm: a blow in the window after the last one is clean
const Gr=G0.cfg({sweetSpot:0});o=tree(300,300);const hz={x:300-sp.side*30,y:300};G0.hit(Gr,o,{power:2,right:true,hero:hz,t:10,s:s,ev:{}});
r=G0.hit(Gr,o,{power:2,right:true,hero:hz,t:10+G.rhythmAfter+G.rhythmWindow/2,s:s,ev:{}});
check('rhythm: in the window the blow is x'+G.rhythmBonus,r.rhythm&&Math.abs(r.dealt-2*G.rhythmBonus)<1e-9);
r=G0.hit(Gr,o,{power:2,right:true,hero:hz,t:10+G.rhythmAfter+G.rhythmWindow/2+0.1,s:s,ev:{}});
check('too soon after the last: plain',!r.rhythm);
// the crack on a rock
const rock={name:'rock',kind:'stone',x:500,y:400,s:1,hp:10,max:10,lastHit:null};const ca=G0.crackAng(G,rock);
r=G0.hit(G,rock,{power:1,right:true,hero:{x:500+Math.cos(ca)*30,y:400+Math.sin(ca)*30/0.75},t:0,s:s,ev:{}});
check('crack: from the crack’s side the blow is deeper (dealt '+r.dealt+')',r.crack&&r.dealt>=G.crackBonus);
// the sunny side and the lit facet are fixed; with cracks on a rock has no second sweet spot
const Gs=G0.cfg({spotLook:4,crackLook:4});o=tree(300,300);
check('sunny side: the sweet side is the left, and never wanders',G0.spot(Gs,o,0).side===-1&&G0.spot(Gs,o,500).side===-1);
check('lit facet: the crack is up and left',Math.abs(G0.crackAng(Gs,rock)+Math.PI*0.75)<1e-9);
check('with cracks on a rock has no glint spot of its own',G0.spot(G,rock,0)===null);
check('Robin’s settings are the defaults (logsPerTrunk 2, pace 2)',G.logsPerTrunk===2&&G.pace===2);
// the fall: the trunk fells the tree in its line, hurts the hero there, and lies as a trunk
const spawned=[],felled=[],hurt=[],drops=[];const ev={spawn:function(t){spawned.push(t);},fell:function(q){felled.push(q);},hurt:function(d){hurt.push(d);},drop:function(k,x,y,n){drops.push([k,n]);},chip:function(){},sfx:function(){},decal:function(){}};
o=tree(300,300);o.hp=0;o.dying=0;o.leanDir=1;const len=G0.treeLen(s,o);const near=[o,tree(300+len*0.6,305),tree(300-40,300),tree(300+len*0.5,360)];
let done=false;for(let i=0;i<40;i++){done=G0.tick(G,o,0.05,{hero:{x:300+len*0.4,y:302},trees:near,s:s,ev:ev});if(done)break;}
check('the tree in the fall line is felled, the ones behind and far aside are not',felled.length===1&&felled[0]===near[1]);
check('the hero in the fall line is hurt for '+G.fallDamage,hurt.length===1&&hurt[0]===G.fallDamage);
check('a trunk lies where it fell',spawned.length===1&&spawned[0].kind==='trunk'&&spawned[0].logs===G.logsPerTrunk);
// chopping the trunk: a log every chopsPerLog blows, then it is gone
const tr=spawned[0];let logs=0,gone=false;for(let i=0;i<G.logsPerTrunk*G.chopsPerLog;i++){const q=G0.hit(G,tr,{power:2,right:true,hero:{x:tr.x,y:tr.y+20},t:i*2,s:null,ev:{drop:function(k,x,y,n){logs+=n;},chip:function(){},sfx:function(){}}});if(q.gone)gone=true;}
check('the trunk gives its logs ('+logs+' wood) and goes',logs===G.logsPerTrunk*tr.woodEach&&gone);
// without trunks the wood drops at once
const G2=G0.cfg({trunks:0});o=tree(300,300);o.hp=0;o.dying=0;const d2=[];for(let i=0;i<40;i++)if(G0.tick(G2,o,0.05,{hero:{x:0,y:0},trees:[],s:s,ev:{drop:function(k,x,y,n){d2.push([k,n]);},chip:function(){},sfx:function(){},decal:function(){}}}))break;
check('without trunks the wood drops at once ('+JSON.stringify(d2[0])+')',d2.some(d=>d[0]==='wood'&&d[1]===G0.TREE_WOOD.oak));
// stumps grow back
const stumps=[{x:1,y:1,r:5,name:'oak',s:0.5,day:1}];let grown=G0.regrowTick(G,stumps,1+G.regrowDays-1,function(st){return {name:st.name};});
check('a stump does not grow back before regrowDays',grown.length===0&&stumps.length===1);
grown=G0.regrowTick(G,stumps,1+G.regrowDays,function(st){return {name:st.name,x:st.x,y:st.y};});
check('after regrowDays it is a sapling (grow 0)',grown.length===1&&grown[0].grow===0&&stumps.length===0);
console.log('bad =',bad);
