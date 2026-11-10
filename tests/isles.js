// Chapter 1, step 1 (docs/chapter-1-build-order.md): every island of home water for ten seeds, its role and what grows there.
// Prints values; a line marked !! is a fault. Run from the project root: node tests/isles.js [seed ...]
const { createCanvas } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../src/stylelab.js'), World = require('../src/world.js');
const kit = S.kit; kit.setup(kit.STYLE);
const seeds = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [11, 23, 28, 101, 138, 471, 7, 55, 902, 3141];
let bad = 0; const T = 32;
seeds.forEach(seed => {
  const spec = { isle: 160, isle0: 120, big: 400, sizes: [120, 400], biomes: [0, 0], noDock: true, count: 2, dir: 0.1, gap: 240, gapVar: 0.3, skerries: 1, rough: 1, beach: 4.5, hue: 0, waves: 0.75, foam: 1.05, seed, mountain: 1, mountainOpts: World.BIG_MOUNTAIN, waters: { rings: 0 } };
  const w = World.make(kit, spec); w.plant();
  const per = w.isles.map(() => ({})); let props = 0;
  w.eachProp(p => { props++; if (!p.is) return; let b = -1, bd = 1e9; w.isles.forEach((q, j) => { const d = Math.hypot(p.x / T - q.x, p.y / T - q.y) / q.r; if (d < bd) { bd = d; b = j; } }); per[b][p.is] = (per[b][p.is] || 0) + 1; });
  console.log('seed ' + seed + ': ' + w.isles.length + ' islands, ' + props + ' props, round ' + JSON.stringify(w.stats.round));
  const roles = {}; let flintless = 0, flax = 0, pines = 0, bear = 0;
  w.isles.forEach((q, j) => {
    roles[q.role] = (roles[q.role] || 0) + 1; const g = per[j];
    if (q.flint && !g.flint) flintless++; if (g.flax) flax++; if (g.oldPine && q.role !== 'big') pines++; if (q.bear) bear++;
    console.log('   ' + j + ' r' + Math.round(q.r) + ' ' + (q.role || '-') + (q.feat ? ' feat:' + q.feat : '') + (q.res ? ' more:' + q.res : '') + (q.bear ? ' BEAR' : '') + '  ' + JSON.stringify(g));
    if ((q.role === 'starter' || q.role === 'big' || q.role === 'hamlet') && g.flint) { bad++; console.log('!! flint on the ' + q.role + ' island'); }
  });
  const want = (ok, what) => { if (!ok) { bad++; console.log('!! seed ' + seed + ': ' + what); } };
  want(roles.hamlet === 1 && roles.elm === 1 && roles.fisher === 1, 'the three islands with a reason: ' + JSON.stringify(roles));
  want(flintless === 0, flintless + ' islands round without flint'); want(flax >= 2, 'flax on ' + flax + ' islands'); want(pines >= 2, 'old pines on ' + pines + ' islands round');
  want((per[1].oldPine || 0) >= 3, 'old pines at the mountain\'s foot: ' + (per[1].oldPine || 0)); want(bear === 1, 'the bear on ' + bear + ' islands');
  want(w.isles.some((q, j) => q.role === 'elm' && per[j].elm >= 10), 'elms on the elm island');
});
console.log('bad = ' + bad);
