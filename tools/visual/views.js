// Renders views.png: every animal and troll on the view rig in the front and back views, standing and through a walk cycle, large,
// so the legs can be judged where they overlap. node tools/visual/views.js
const { createCanvas } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js'); const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
const trolls = process.argv[2] === 'trolls', keys = trolls ? ['troll', 'trollForest'] : ['boar', 'deer', 'wolf', 'bear', 'moose'], Z = trolls ? 3 : 7, CW = trolls ? 260 : 90, RH = trolls ? 300 : 110, cols = 12, W = CW * cols, H = RH * keys.length, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#8fa266'; c.fillRect(0, 0, W, H);
const views = [];
[Math.PI / 2, -Math.PI / 2, Math.PI * 0.3].forEach(ang => { views.push([ang, 0, 0]); [0, 1.6, 3.1, 4.7].forEach(ph => views.push([ang, 1, ph])); });
keys.forEach((k, r) => {
  const Hc = lib.makeCreature(lib.animalSpec(k));
  views.forEach((v, i) => lib.creatureD(c, CW / 2 + i * CW, RH * r + (trolls ? 270 : 95), { t: 1.3, move: v[1], phase: v[2], dir: Math.cos(v[0]) >= 0 ? 1 : -1, ang: v[0], state: 'idle', k: 0 }, Hc));
  c.fillStyle = '#231a16'; c.font = '9px sans-serif'; c.fillText(lib.animals[k].name + '  (front: stand + walk, back: stand + walk, diagonal)', 6, RH * r + 12);
});
const out = trolls ? 'views-trolls.png' : 'views.png'; fs.writeFileSync(out, cv.toBuffer('image/png')); console.log('wrote ' + out);
