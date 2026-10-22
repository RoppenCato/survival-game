// The settlements' audit (docs/settlements-plan.md section 7, 2026-10-22): every archetype grown at several seeds and wealths,
// and what the rules ask of each, printed one line a rule; a line that begins with !! is a rule broken (walkable from the way
// in, the loops, the ways in and their prices, a landmark, the denial on the way to the prize, the secrets against the budget,
// the loot and the carry, the men within hearing, the fire chain, the doorways clear, the units against the plan). The last
// lines are the tally. Run from the project root:  node tests/settlement.js [seeds] [archetypes, comma separated]
//   node tests/settlement.js 6 village,seat,town
const Village = require('../src/village.js');
const nSeeds = +process.argv[2] || 4, archs = process.argv[3] ? process.argv[3].split(',') : Object.keys(Village.ARCH);
let bad = 0, places = 0, threw = 0; const t0 = Date.now(), tally = {};
archs.forEach(arch => {
  const A = Village.ARCH[arch], site = Village.siteFor(arch);
  for (let i = 0; i < nSeeds; i++) {
    const seed = 101 + i * 977 + arch.length * 31, wealth = 0.2 + (i / Math.max(1, nSeeds - 1)) * 0.75, shore = A.shore ? 's' : (i % 3 === 2 && !A.chapel ? 's' : null);
    let V, au;
    try { V = Village.make(seed, { tx: 20, ty: 20, w: site.w, h: site.h, shore }, { arch, wealth, biome: A.lowland ? 1 : 0 }); au = Village.audit(V, Object.assign(Village.defence(arch, wealth, 1), { tactic: V.tactic })); }
    catch (e) { threw++; console.log('!! ' + arch + ' seed ' + seed + ' threw: ' + (e.stack || e).toString().split('\n').slice(0, 2).join(' | ')); continue; }
    places++; bad += au.bad;
    console.log('== ' + arch + ' seed ' + seed + ' wealth ' + wealth.toFixed(2) + (shore ? ' shore' : '') + ': ' + V.units.length + ' units, ' + V.lots.length + ' buildings, ' + V.folk.length + ' people, ' + V.items.length + ' things, ' + V.props.length + ' props, ' + V.paints.length + ' paints, fence ' + (V.fence ? V.fence.kind + (V.fence.round ? ' (a ring)' : '') : 'none') + ', tactic ' + V.tactic);
    au.lines.forEach(l => { console.log('   ' + l); if (l.indexOf('!!') === 0) { const k = l.replace(/^!! /, '').split(':')[0].replace(/[0-9]+ of [0-9]+ units.*/, 'units short'); tally[k] = (tally[k] || 0) + 1; } });
  }
});
console.log('\n' + places + ' places in ' + (Date.now() - t0) + ' ms; ' + bad + ' rules broken' + (threw ? ', ' + threw + ' threw' : '') + (bad ? ': ' + Object.keys(tally).map(k => tally[k] + ' x ' + k).join(', ') : ''));
if (threw) console.log('!! a place threw');
