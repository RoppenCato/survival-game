// Renders villages.png: one village of each archetype grown from the same seed, drawn as the Village Editor draws them.
// Run from the project root:  node tools/visual/villages.js [seed] [archetypes, comma separated] [zoom] [wealth]
//   node tools/visual/villages.js 20                 every archetype, a pixel a unit
//   node tools/visual/villages.js 20 town,village 2  two of them, twice the size
const { createCanvas } = require('@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js'), Build = require('../../src/build.js'), Village = require('../../src/village.js');
const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
const seed = +process.argv[2] || 4321, archs = process.argv[3] && process.argv[3] !== 'all' ? process.argv[3].split(',') : ['farmstead', 'small', 'village', 'fishing', 'trading', 'seat', 'ruin', 'town', 'church', 'great', 'bigtown'], T = 32, TS = 24;
const Z = +process.argv[4] || (archs.length > 3 ? 1 : 2), WEALTH = process.argv[5] != null ? +process.argv[5] : null;
const sites = archs.map(a => Village.siteFor(a)), mw = Math.max.apply(null, sites.map(s => s.w)) + 4, mh = Math.max.apply(null, sites.map(s => s.h)) + 5;   // a cell holds the largest site
const cellW = mw * T, cellH = mh * TS, cols = Math.min(archs.length > 9 ? 4 : 3, archs.length), rows = Math.ceil(archs.length / cols), cv = createCanvas(cellW * cols * Z, cellH * rows * Z), c = cv.getContext('2d');
const tiles = {}; function tileCv(n) { if (!tiles[n]) tiles[n] = kit.bakeTile(n, 0); return tiles[n]; }
archs.forEach((a, i) => {
  const site = sites[i], ox = (i % cols) * cellW, oy = Math.floor(i / cols) * cellH, A = Village.ARCH[a], shore = A.shore ? 's' : null, wealth = WEALTH != null ? WEALTH : 0.3 + (i % 4) * 0.2;
  c.setTransform(Z, 0, 0, Z, ox * Z, oy * Z); c.save(); c.beginPath(); c.rect(0, 0, cellW, cellH); c.clip();
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) c.drawImage(tileCv('grass'), x * T, y * TS, T + 0.4, TS + 0.4);
  const V = Village.make(seed, { tx: 2, ty: 2, w: site.w, h: site.h, shore }, { arch: a, wealth, biome: A.lowland ? 1 : 0 });
  if (shore) { c.fillStyle = '#4a7f9e'; c.fillRect(0, (site.h + 2) * TS, mw * T, mh * TS - (site.h + 2) * TS); }
  Village.draw(c, V, { kit, Build, lib, tile: (cc, tx, ty, x, y, w, h) => cc.drawImage(tileCv(V.floors[tx + ',' + ty] === 1 ? 'dirt' : 'plank'), x, y, w, h) }, 0);
  c.fillStyle = '#231a16'; c.font = 'bold 15px sans-serif'; c.fillText(A.name + '  (wealth ' + wealth.toFixed(1) + ', ' + V.folk.length + ' people, ' + V.lots.length + ' buildings: ' + V.lots.map(l => l.id + ' ' + l.w + 'x' + l.h).join(', ') + ')', 8, 18);
  const hx = (site.w + 1) * T, hy = (site.h + 2.4) * TS; c.fillStyle = '#231a16'; c.fillRect(hx - 6, hy - 39, 12, 39); c.font = '11px sans-serif'; c.fillText('the hero, 1.8 m', hx - 86, hy - 14);   // the hero's height, for scale
  c.restore();
});
fs.writeFileSync('villages.png', cv.toBuffer('image/png')); console.log('wrote villages.png', cv.width, cv.height);
