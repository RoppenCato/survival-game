// The rewards against the risk (raid step 7, 2026-10-21, docs/raid-build-plan.md): every archetype at two wealths, three places
// each, what it holds for the taking (Village.lootOf: silver, food, goods, and a value: silver 1, a bar 3, leather 1, food 0.3)
// against the men that defend it (Village.defence). A line a cell: the value, its parts, the men, and the value a man. The
// curve should rise with the men (a richer place pays more for the risk) and two places of one size should not give the same
// (the place's own rolls, stockK and hoardK). `!!` when a cell's value falls below the cell before it with more men, or when
// three places of one cell give the same value.
const Village = require('../src/village.js');
const ARCHES = ['church', 'farmstead', 'small', 'fishing', 'village', 'trading', 'seat', 'town'], W = [0.3, 0.8], N = +process.argv[2] || 3;
console.log('--- the rewards against the risk (raid step 7). ' + N + ' places a cell; value: silver 1, a bar 3, leather or hide 1, food 0.3, arrows 0.2');
console.log('    ' + 'place'.padEnd(24) + ' | value | silver | food | goods | men | a man | the three places');
let lastV = 0, lastMen = 0;
ARCHES.forEach(arch => W.forEach(wealth => {
  const vals = [], rows = [];
  for (let i = 0; i < N; i++) {
    const seed = 11 + i * 29, site = Village.siteFor(arch), shore = arch === 'fishing' || arch === 'trading' ? 's' : null;
    const V = Village.make(seed, { tx: 20, ty: 20, w: site.w, h: site.h, shore }, { arch, wealth, biome: arch === 'town' || arch === 'church' ? 1 : 0 });
    const L = Village.lootOf(V), D = Village.defence(arch, wealth, 1); vals.push(L.value); rows.push({ L, D });
  }
  const mean = k => rows.reduce((a, r) => a + r.L[k], 0) / rows.length, men = rows[0].D.n, value = mean('value');
  const same = vals.every(x => Math.abs(x - vals[0]) < 0.5), fell = value < lastV * 0.8 && men > lastMen;
  console.log((same || fell ? '!! ' : '   ') + (arch + ' at wealth ' + wealth).padEnd(24) + ' | ' + value.toFixed(0).padStart(5) + ' | ' + mean('silver').toFixed(0).padStart(6) + ' | ' + mean('food').toFixed(0).padStart(4) + ' | ' + mean('goods').toFixed(0).padStart(5) + ' | ' + String(men).padStart(3) + ' | ' + (men ? (value / men).toFixed(1) : '-').padStart(5) + ' | ' + vals.map(x => x.toFixed(0)).join(', ') + (same ? '  THE SAME' : '') + (fell ? '  FELL with more men' : ''));
  lastV = value; lastMen = men;
}));
