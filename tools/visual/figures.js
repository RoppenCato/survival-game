// Renders the ink figures to figures.png: the hero standing and walking in four directions, the troll at four headings, a boar.
// Run from the project root:  node tools/visual/figures.js
const { createCanvas } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('C:/dev/survival-game/src/art.js'), S = require('C:/dev/survival-game/src/stylelab.js');
const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
const Z = 4, W = 700, H = 330, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#8fa266'; c.fillRect(0, 0, W, H);
const dirs = ['down', 'right', 'up', 'left'];
dirs.forEach((d, i) => {
  lib.playerD(c, 50 + i * 70, 90, d, { phase: 0, amt: 0, t: 1, lx: 0, ly: 0, blink: 0, sq: 0 }, null);
  lib.playerD(c, 50 + i * 70, 180, d, { phase: 1.2, amt: 1, t: 1, lx: 0, ly: 0, blink: 0, sq: 0, run: 0 }, null);
});
const trollH = lib.makeCreature(lib.animalSpec('troll'));
[0, 1.57, 3.14, 4.7].forEach((a, i) => lib.creatureD(c, 380 + i * 80, 230 - (i % 2) * 110, { t: 1.3, move: 0, phase: 0, dir: 1, ang: a, state: 'idle', k: 0 }, trollH));
const boarH = lib.makeCreature(lib.animalSpec('boar'));
lib.creatureD(c, 120, 290, { t: 1.3, move: 0, phase: 0, dir: 1, ang: 0, state: 'idle', k: 0 }, boarH);
fs.writeFileSync('figures.png', cv.toBuffer('image/png')); console.log('wrote figures.png');
