// The winter ice (src/ice.js): how thick it lies on real worlds, which islands the ice joins, how long thin ice holds a walker.
// Prints values; a line marked !! is a fault. Run from the project root: node tests/ice.js [seed ...]
const { createCanvas } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../src/stylelab.js'), World = require('../src/world.js'), Ice = require('../src/ice.js');
const kit = S.kit; kit.setup(kit.STYLE); const T = 32, D = Ice.DEF;
const seeds = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [11, 28, 138];
let bad = 0; const want = (ok, what) => { if (!ok) { bad++; console.log('!! ' + what); } };
function holds(th, v, heavy, max) {   // seconds a walker lasts on ice of one thickness (a made-up sheet), or null if it never gives
  const I = { G: null, S: 0, stillT: 0, lvl: 0, cr: {}, holes: [], marks: [], shards: [], ch: {}, fell: 0 }; let t = 0, x = 0, creaks = 0;
  I.ch['0,0'] = { any: true, th: { length: 0 } }; const fake = new Proxy({}, { get: () => th });
  for (let k = -2; k < 400; k++) I.ch[k + ',0'] = { any: true, th: fake };
  while (t < (max || 120)) { const ev = Ice.step(I, 1 / 30, { x: 300 + x, y: 100, v: v, heavy: heavy, on: true }); t += 1 / 30; x += v / 30; ev.forEach(e => { if (e.k === 'creak') creaks++; }); if (ev.some(e => e.k === 'break')) return t.toFixed(1) + ' s (' + creaks + ' creaks)'; }
  return 'holds';
}
console.log('how long ice of one thickness holds (still / creeping 39 / walking 78 / running 130 / walking with a load):');
[0.7, 0.55, 0.45, 0.35, 0.25, 0.15].forEach(th => console.log('   thickness ' + th + ': ' + [0, 39, 78, 130].map(v => holds(th, v, false)).join(' / ') + ' / ' + holds(th, 78, true)));
want(holds(0.7, 130, true) === 'holds', 'thick ice gave way'); want(holds(0.15, 130, false) !== 'holds', 'running on the thinnest ice held'); want(holds(0.45, 78, false) === 'holds', 'walking on middling ice gave way');
seeds.forEach(seed => {
  const spec = { isle: 160, isle0: 120, big: 400, sizes: [120, 400], biomes: [0, 0], noDock: true, count: 2, dir: 0.1, gap: 240, gapVar: 0.3, skerries: 1, rough: 1, beach: 4.5, hue: 0, waves: 0.75, foam: 1.05, seed, mountain: 1, mountainOpts: World.BIG_MOUNTAIN, waters: { rings: 0 }, inland: { auto: 1 } };
  const w = World.make(kit, spec); let t0 = Date.now();
  const I = Ice.make({ GW: w.GW, GH: w.GH, T: T, land: (tx, ty) => w.isLand((tx + 0.5) * T, (ty + 0.5) * T), water: (x, y) => w.isWater(x, y), fresh: (x, y) => w.fresh(x, y), open: (x, y) => w.swellAt ? w.swellAt(x, y) : 0 }, seed);
  const tMake = Date.now() - t0;
  // the sea by the tile: its classes, and what the ice joins
  const GW = w.GW, GH = w.GH, th = new Float32Array(GW * GH); let n = { open: 0, thin: 0, mid: 0, thick: 0 }, sea = 0;
  for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) { const x = (tx + 0.5) * T, y = (ty + 0.5) * T; if (!w.isWater(x, y) || w.fresh(x, y)) { th[ty * GW + tx] = w.isLand(x, y) ? 2 : 0; continue; } if (w.swellAt(x, y) > 0.5) continue; const v = Ice.thickAt(I, x, y); th[ty * GW + tx] = v; sea++; if (v <= 0) n.open++; else if (v < D.climb) n.thin++; else if (v < D.safe) n.mid++; else n.thick++; }
  const pc = k => Math.round(n[k] / sea * 100) + '%';
  console.log('seed ' + seed + ': the world ' + GW + ' by ' + GH + ' tiles, the distance field in ' + tMake + ' ms; home water\'s sea: thick ' + pc('thick') + ', middling ' + pc('mid') + ', thin ' + pc('thin') + ', open ' + pc('open'));
  function reach(min) { const seen = new Uint8Array(GW * GH), q = []; const b = w.isles[1], s = Math.floor(b.y) * GW + Math.floor(b.x); seen[s] = 1; q.push(s); while (q.length) { const c = q.pop(), cx = c % GW, cy = (c - cx) / GW; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => { const x = cx + d[0], y = cy + d[1]; if (x < 0 || y < 0 || x >= GW || y >= GH) return; const i = y * GW + x; if (seen[i] || th[i] < min) return; seen[i] = 1; q.push(i); }); }
    return w.isles.map((q2, j) => seen[Math.floor(q2.y) * GW + Math.floor(q2.x)] ? j : -1).filter(j => j >= 0); }
  const safe = reach(D.safe), mid = reach(D.climb), any = reach(D.open + 0.001);
  console.log('   from the big island over ice that never strains (' + D.safe + ' up): islands ' + safe.join(',') + '; over ice a calm walker crosses (' + D.climb + ' up): ' + mid.join(',') + '; over any ice: ' + any.join(',') + ' of ' + w.isles.length);
  want(any.length > 1, 'seed ' + seed + ': no island can be reached over the ice'); want(safe.length < w.isles.length, 'seed ' + seed + ': every island is joined by thick ice (no danger)');
  const lakes = w.inland.filter(q => q.kind === 'lake'); lakes.forEach(q => { const c = Ice.thickAt(I, q.x, q.y); console.log('   a lake r' + Math.round(q.r) + ': its middle ' + c.toFixed(2) + (c > 0 ? '' : ' !!')); if (!(c > 0)) bad++; });
  // a line out from the big island's east shore
  const b = w.isles[1]; let line = []; for (let d = b.r * 0.4; d < b.r + 90; d += 1) { const x = (b.x + d) * T, y = b.y * T; if (!w.isWater(x, y) || w.fresh(x, y)) continue; line.push(Ice.thickAt(I, x, y).toFixed(1)); if (line.length > 60) break; }
  console.log('   east of the big island, a tile a step: ' + line.filter((v, i) => i % 3 === 0).join(' '));
  t0 = Date.now(); let cnt = 0; for (let k = 0; k < 20; k++) { Ice.thick(I, b.x * T + b.r * T + k * 300, b.y * T); cnt++; } console.log('   ' + cnt + ' pieces baked in ' + (Date.now() - t0) + ' ms');
  const hx = (b.x + b.r) * T + 2000, hy = b.y * T; I.holes.length = 0; Ice.hole(I, hx, hy, D.hole, null); want(!Ice.carries(I, hx, hy), 'a hole carries'); want(Ice.swimTo(I, hx, hy) === 'water', 'a hole is not water');
});
console.log('bad = ' + bad);
