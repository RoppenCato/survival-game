// The trolls' faces large, facing the camera: calm and in the blow. node tools/visual/trollface.js
const { createCanvas } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js');
const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
const Z = 7, W = 560, H = 260, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#8fa266'; c.fillRect(0, 0, W, H);
[['troll', 70, 240], ['troll', 200, 240, 'lunge'], ['trollForest', 340, 250], ['trollForest', 470, 250, 'lunge']].forEach(v => {
  const Hc = lib.makeCreature(lib.animalSpec(v[0]));
  lib.creatureD(c, v[1], v[2], { t: 1.3, move: 0, phase: 0, dir: 1, ang: 1.57, state: v[3] || 'idle', k: 0.5 }, Hc);
});
fs.writeFileSync('trollface.png', cv.toBuffer('image/png')); console.log('wrote trollface.png');
