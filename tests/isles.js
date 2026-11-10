// Chapter 1, step 1 (docs/chapter-1-build-order.md): every island of home water for ten seeds, its role and what grows there.
// Prints values; a line marked !! is a fault. Run from the project root: node tests/isles.js [seed ...]
const { createCanvas } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../src/stylelab.js'), World = require('../src/world.js'), Village = require('../src/village.js');
const kit = S.kit; kit.setup(kit.STYLE);
const seeds = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [11, 23, 28, 101, 138, 471, 7, 55, 902, 3141];
let bad = 0; const T = 32;
seeds.forEach(seed => {
  const spec = { isle: 160, isle0: 120, big: 400, sizes: [120, 400], biomes: [0, 0], noDock: true, count: 2, dir: 0.1, gap: 240, gapVar: 0.3, skerries: 1, rough: 1, beach: 4.5, hue: 0, waves: 0.75, foam: 1.05, seed, mountain: 1, mountainOpts: World.BIG_MOUNTAIN, waters: { rings: 0 }, inland: { auto: 1 } };
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
  const sites = Village.plan({ isles: w.isles, code: w.siteCode, shallow: (tx, ty) => w.siteCode(tx, ty) === 0 && w.elevAt((tx + 0.5) * T, (ty + 0.5) * T) > -7, R: kit.rng(seed * 23 + 11), home: [w.home.x / T, w.home.y / T], avoid: [] }, {});
  console.log('   places: ' + sites.map(st => st.isle + ':' + st.arch + ' ' + st.name).join(', '));
  const at = (role) => sites.filter(st => role === 'hamlet' ? st.name === 'Saltvik' : role === 'ruin' ? st.name === 'Ulfarstad' : role === 'fisher' ? st.role === 'fisher' : w.isles[st.isle].role === role && st.name !== 'Saltvik' && st.name !== 'Ulfarstad' && st.role !== 'fisher');
  want(at('fisher').length === 1 && at('fisher')[0].arch === 'fisher', 'the fisherman on his island: ' + at('fisher').map(st => st.arch));
  want(at('hamlet').length === 1 && at('hamlet')[0].name === 'Saltvik' && at('hamlet')[0].arch !== 'ruin', 'Saltvik: ' + at('hamlet').map(st => st.arch + ' ' + st.name));
  want(at('ruin').length === 1 && at('ruin')[0].arch === 'ruin' && at('ruin')[0].name === 'Ulfarstad', 'Ulfarstad: ' + at('ruin').map(st => st.arch + ' ' + st.name));
  want(at('home').length === 0 && at('elm').length === 0, 'nobody on the homes or the elm island: ' + (at('home').length + at('elm').length));
  w.isles.forEach((q, j) => { if (q.feat === 'bay') { const bx = Math.floor(q.x + Math.cos(q.bay.a) * q.r * 0.92), by = Math.floor(q.y + Math.sin(q.bay.a) * q.r * 0.92 * 0.9); want(w.siteCode(bx, by) === 0, 'the bay of island ' + j + ' is water at its middle'); } if (q.feat === 'hill') want(!!q.hill, 'the hill of island ' + j + ' has its cairn'); });
  want(sites[0].isle === 1 && sites[0].arch !== 'ruin' && !sites.some(st => st.arch === 'seat'), 'the first village on the big island, no seat');
  want((per[1].roseroot || 0) >= 3, 'roseroot on the mountain: ' + (per[1].roseroot || 0));
  want((per[1].oldPine || 0) >= 2 && (per[1].oldPine || 0) <= 9, 'a few old pines at the mountain foot (2 to 9): ' + (per[1].oldPine || 0));
  want(w.isles.some((q, j) => q.role === 'elm' && per[j].elm >= 10), 'elms on the elm island');
  /* inland water (Robin, 2026-11-10): lakes and a river on the big island, a lake on some of the islands round, none on the starter island, every lake's middle water, nothing in a lake */
  const lk = w.inland.filter(q => q.kind === 'lake'), rv = w.inland.filter(q => q.kind === 'river'), isl = {}; lk.forEach(q => { isl[q.isle] = (isl[q.isle] || 0) + 1; });
  console.log('   inland: lakes ' + lk.map(q => q.isle + ':r' + Math.round(q.r / T)).join(' ') + '; rivers ' + rv.map(q => q.isle + (q.between ? ':between' : ':sea') + ':' + q.pts.length).join(' '));
  want((isl[1] || 0) >= 2, 'two lakes or more on the big island: ' + (isl[1] || 0)); want(!isl[0], 'no lake on the starter island'); want(rv.some(q => q.isle === 1), 'a river on the big island');
  want(lk.every(q => w.isWater(q.x, q.y) && !w.isLand(q.x, q.y)), 'every lake is water at its middle');
  let wet = 0; w.eachProp(p => { if (!w.isLand(p.x, p.y) && lk.some(q => Math.hypot(p.x - q.x, p.y - q.y) < q.r * 0.8)) wet++; }); want(wet === 0, 'nothing stands in a lake: ' + wet);
});
console.log('bad = ' + bad);
