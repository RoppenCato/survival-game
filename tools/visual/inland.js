// Inland water, mockups (Robin, 2026-11-10: "consider if we can have waterfalls/rivers/lakes in land. Create some mockups"): the
// big island made with the world's trial switch o.inland (lakes and a river carved as steep-sided hollows, src/world.js), drawn
// as the game draws it (tools/visual/dayisland.js) at Robin's size, 1200 by 750 at 3 px a unit, at a lake, along the river, at
// its mouth, and at the mountain's waterfall the game already has. Writes docs/pictures/inland-water/*.png.
//   node tools/visual/inland.js [seed]
const { createCanvas } = require('@napi-rs/canvas'); const fs = require('fs'), path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), DI = require('./dayisland.js');
const kit = S.kit; kit.setup(kit.STYLE);
(async () => {
  const seed = +process.argv[2] || 11, out = path.join(__dirname, '..', '..', 'docs', 'pictures', 'inland-water'); fs.mkdirSync(out, { recursive: true });
  await DI.load(World);
  const spec = { isle: 160, isle0: 120, big: 400, sizes: [120, 400], biomes: [0, 0], noDock: true, count: 2, dir: 0.1, gap: 240, gapVar: 0.3, skerries: 1, rough: 1, beach: 4.5, hue: 0, waves: 0.75, foam: 1.05, seed, mountain: 1, mountainOpts: World.BIG_MOUNTAIN, inland: { lakes: 2, river: 1, minR: 150 } };
  const w = World.make(kit, spec); w.meadowLook = World.GRASS_INK; w.plant();
  const lakes = w.inland.filter(q => q.kind === 'lake'), river = w.inland.filter(q => q.kind === 'river')[0];
  // what would stand by it, from pieces the game already has: reeds on the banks, boulders at the water's edge, a ford of stepping stones
  const hs = (a2, b2) => { const x = Math.sin(a2 * 127.1 + b2 * 311.7) * 43758.5453; return x - Math.floor(x); }, land = (x, y) => w.isLand(x, y);
  const put = (name, x, y, sc, v) => w.addProp({ name, x, y, s: sc || 1, r: 0, v: v || 0 });
  if (process.argv[3] !== 'bare') {
    lakes.forEach((L, li) => { for (let k = 0; k < 60; k++) { const a3 = k / 60 * 6.283, rr = L.r * (0.9 + hs(k, li) * 0.5), x = L.x + Math.cos(a3) * rr * 1.25, y = L.y + Math.sin(a3) * rr; if (!land(x, y) || land(x + Math.cos(a3) * -40, y + Math.sin(a3) * -32) ) continue; if (hs(k, li + 7) < 0.6) put('reeds', x, y, 1, k % 3); else if (hs(k, li + 9) < 0.25) put('boulder', x, y, 0.7, k % 3); } });
    if (river) { river.pts.forEach((p, k) => { for (let sgn = -1; sgn <= 1; sgn += 2) for (let d = 40; d < 130; d += 12) { const x = p[0] + sgn * d * 0.7, y = p[1] + sgn * d * 0.7; if (land(x, y)) { if (hs(k, d + sgn) < 0.5) put('reeds', x, y, 1, (k + d) % 3); break; } } });
      const m = river.pts[Math.floor(river.pts.length * 0.45)], n2 = river.pts[Math.floor(river.pts.length * 0.45) + 1], dx = n2[0] - m[0], dy = n2[1] - m[1], l = Math.hypot(dx, dy) || 1; for (let t = -110; t <= 110; t += 22) { const x = m[0] + 90 + (-dy / l) * t, y = m[1] + 20 + (dx / l) * t; if (!land(x, y)) put('rock', x, y, 0.42, Math.abs(t) % 6); } }
  }
  w.sortBuckets();
  const shots = []; if (lakes[0]) shots.push(['lake', lakes[0].x + 40, lakes[0].y + 30]); if (lakes[1]) shots.push(['lake2', lakes[1].x, lakes[1].y + 20]);
  if (river) { const p = river.pts; shots.push(['river', p[Math.floor(p.length * 0.45)][0], p[Math.floor(p.length * 0.45)][1]]); var pm = p.filter(function (z) { return w.isLand(z[0] + 60, z[1]) || w.isLand(z[0] - 60, z[1]); }).pop() || p[Math.floor(p.length * 0.8)]; shots.push(['river_mouth', pm[0], pm[1]]); shots.push(['river_source', p[1][0], p[1][1]]); }
  if (w.mt && w.mt.falls && w.mt.falls.length) { const f = w.mt.falls[0]; shots.push(['waterfall_today', f.pool.x, f.pool.y - 60]); }
  for (const [name, x, y] of shots) { const r = DI.paint(kit, World, 1200, 750, 3, { world: w, at: { x, y } }); fs.writeFileSync(path.join(out, name + '.png'), r.cv.toBuffer('image/png')); console.log(name, Math.round(x), Math.round(y)); }
  // the whole island small, to see where they lie
  const ch = w.chart(900); fs.writeFileSync(path.join(out, 'chart.png'), ch.toBuffer('image/png')); console.log('inland:', JSON.stringify(w.inland.map(q => q.kind + (q.r ? ' r' + Math.round(q.r / 32) : ' ' + q.pts.length + ' pts'))));
})();
