// The time and memory of making the game's sea (2026-10-20, a baseline before the waters plan; docs/before-wednesday.md 4):
// World.make, plant, dress and plantBog for the game's own spec, headless, printed one line a step. Run from the project root:
//   node tools/worldtime.js [seed]          (WSPEC='{"gap":40}' lays another sea over the game's spec)
const { createCanvas } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../src/stylelab.js'), World = require('../src/world.js');
const kit = S.kit; kit.setup(kit.STYLE);
const seed = process.argv[2] ? +process.argv[2] : 11;
const spec = Object.assign({ isle: 160, isle0: 120, big: 400, sizes: [120, 400], biomes: [0, 0], noDock: true, count: 2, dir: 0.1, gap: 240, gapVar: 0.3, skerries: 1, rough: 1, beach: 4.5, hue: 0, waves: 0.75, foam: 1.05, seed: seed, mountain: 1, mountainOpts: World.BIG_MOUNTAIN }, process.env.WSPEC ? JSON.parse(process.env.WSPEC) : {});
function mem() { if (global.gc) global.gc(); return Math.round(process.memoryUsage().heapUsed / 1048576); }
let t = process.hrtime.bigint(), m0 = mem();
function step(name, fn) { const r = fn(); const t2 = process.hrtime.bigint(), ms = Number(t2 - t) / 1e6; t = t2; const m = mem(); console.log(name.padEnd(10) + String(Math.round(ms)).padStart(7) + ' ms' + String(m - m0).padStart(7) + ' MB heap' + (r != null ? '   ' + r : '')); m0 = m; return r; }
const w = step('make', () => { const w2 = World.make(kit, spec); return w2.GW + 'x' + w2.GH + ' tiles, ' + w2.isles.length + ' islands'; }) && World.make(kit, spec);
t = process.hrtime.bigint(); m0 = mem();
step('plant', () => { w.plant(); return w.stats.trees + ' trees, ' + w.stats.rocks + ' rocks'; });
step('dress', () => w.dress() + ' dabs, ' + Object.keys(w.ground).length + ' ground cells');
step('plantBog', () => (w.plantBog ? w.plantBog() : 0) + ' bog iron');
step('chart', () => { w.chart(700); return 'a 700 px chart'; });
console.log('seed ' + seed + ', node ' + process.version + (global.gc ? '' : ' (run with --expose-gc for steadier memory)'));
