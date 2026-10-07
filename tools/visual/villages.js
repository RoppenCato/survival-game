// Renders villages.png: one village of each archetype grown from the same seed, drawn as the Village Editor draws them.
// Run from the project root:  node tools/visual/villages.js [seed]
const { createCanvas } = require('@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js'), Build = require('../../src/build.js'), Village = require('../../src/village.js');
const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
const seed = +process.argv[2] || 4321, archs = ['farmstead', 'small', 'village', 'fishing', 'trading', 'seat', 'ruin'], T = 32, TS = 24, Z = 2;
const cellW = 36 * T, cellH = 30 * TS, cols = 3, rows = Math.ceil(archs.length / cols), cv = createCanvas(cellW * cols * Z, cellH * rows * Z), c = cv.getContext('2d');
const tiles = {}; function tileCv(n) { if (!tiles[n]) tiles[n] = kit.bakeTile(n, 0); return tiles[n]; }
archs.forEach((a, i) => {
  const site = Village.siteFor(a), ox = (i % cols) * cellW, oy = Math.floor(i / cols) * cellH, shore = Village.ARCH[a].shore ? 's' : null;
  c.setTransform(Z, 0, 0, Z, ox * Z, oy * Z);
  for (let y = 0; y < 30; y++) for (let x = 0; x < 36; x++) c.drawImage(tileCv('grass'), x * T, y * TS, T + 0.4, TS + 0.4);
  const V = Village.make(seed, { tx: 2, ty: 2, w: site.w, h: site.h, shore }, { arch: a, wealth: 0.3 + (i % 4) * 0.2 });
  if (shore) { c.fillStyle = '#4a7f9e'; c.fillRect(0, (site.h + 2) * TS, 36 * T, 30 * TS - (site.h + 2) * TS); }
  Village.draw(c, V, { kit, Build, lib, tile: (cc, tx, ty, x, y, w, h) => cc.drawImage(tileCv(V.floors[tx + ',' + ty] === 1 ? 'dirt' : 'plank'), x, y, w, h) }, 0);
  c.fillStyle = '#231a16'; c.font = 'bold 14px sans-serif'; c.fillText(Village.ARCH[a].name + '  (wealth ' + (0.3 + (i % 4) * 0.2).toFixed(1) + ', ' + V.folk.length + ' people, ' + V.lots.length + ' buildings)', 8, 18);
});
fs.writeFileSync('villages.png', cv.toBuffer('image/png')); console.log('wrote villages.png');
