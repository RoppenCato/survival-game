// Renders the new heroes (lib.heroes, the ink figure) to heroes.png: each standing and walking in four directions, large.
// Run from the project root:  node tools/visual/heroes.js [name]
const { createCanvas } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js');
const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
const names = process.argv[2] ? [process.argv[2]] : lib.heroes.map(h => h.name);
const Z = 5, CW = 62, RH = 70, W = CW * 8, H = RH * names.length, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#8fa266'; c.fillRect(0, 0, W, H);
const dirs = ['down', 'right', 'up', 'left'];
names.forEach((nm, r) => {
  lib.setHero(lib.heroSpec(nm));
  dirs.forEach((d, i) => {
    lib.playerD(c, CW / 2 + i * CW, RH * r + 62, d, { phase: 0, amt: 0, t: 1, lx: 0, ly: 0, blink: 0, sq: 0 }, null);
    lib.playerD(c, CW / 2 + (i + 4) * CW, RH * r + 62, d, { phase: 1.2, amt: 1, t: 1, lx: 0, ly: 0, blink: 0, sq: 0 }, null);
  });
  c.fillStyle = '#231a16'; c.font = '6px sans-serif'; c.fillText(nm, 4, RH * r + 8);
});
fs.writeFileSync('heroes.png', cv.toBuffer('image/png')); console.log('wrote heroes.png');
