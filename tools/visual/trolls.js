// Renders the trolls to trolls.png: each at four headings, then the sweep (windup and the blow), large.
// Run from the project root:  node tools/visual/trolls.js
const { createCanvas } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js');
const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
const keys = ['troll', 'trollForest', 'trollOld'], Z = 3, CW = 150, RH = 250, W = CW * 6, H = RH * keys.length, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#8fa266'; c.fillRect(0, 0, W, H);
keys.forEach((k, r) => {
  const Hc = lib.makeCreature(lib.animalSpec(k));
  [[1.57, 'idle', 0], [0, 'idle', 0], [-1.57, 'idle', 0], [3.14, 'idle', 0], [1.57, 'windup', 0.9], [1.57, 'lunge', 0.6]].forEach((v, i) => {
    lib.creatureD(c, CW / 2 + i * CW, RH * r + 225, { t: 1.3, move: 0, phase: 0, dir: 1, ang: v[0], state: v[1], k: v[2] }, Hc);
  });
  c.fillStyle = '#231a16'; c.font = '10px sans-serif'; c.fillText(lib.animals[k].name, 6, RH * r + 14);
});
fs.writeFileSync('trolls.png', cv.toBuffer('image/png')); console.log('wrote trolls.png');
