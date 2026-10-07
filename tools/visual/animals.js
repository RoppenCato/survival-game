// Renders the animals on the view rig (quadD) to animals.png: each at five headings standing, then walking, the windup and the
// blow. Run from the project root:  node tools/visual/animals.js [turntable]
const { createCanvas } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js'); const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
if (process.argv[2] === 'turntable') lib.RIG.animals = 'turntable';
const keys = ['boar', 'deer', 'wolf', 'bear', 'moose'], Z = 3, CW = 110, RH = 120, W = CW * 9, H = RH * keys.length, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#8fa266'; c.fillRect(0, 0, W, H);
const views = [[Math.PI, 'idle', 0, 0], [Math.PI * 0.75, 'idle', 0, 0], [Math.PI / 2, 'idle', 0, 0], [-Math.PI / 2, 'idle', 0, 0], [0, 'idle', 0, 0], [Math.PI, 'idle', 1, 1.2], [Math.PI / 2, 'idle', 1, 2.4], [Math.PI, 'windup', 0, 0.9], [Math.PI, 'lunge', 0, 0.5]];
keys.forEach((k, r) => {
  const Hc = lib.makeCreature(lib.animalSpec(k));
  views.forEach((v, i) => lib.creatureD(c, CW / 2 + i * CW, RH * r + 95, { t: 1.3, move: v[2], phase: v[3], dir: Math.cos(v[0]) >= 0 ? 1 : -1, ang: v[0], state: v[1], k: v[3] > 0 && v[1] !== 'idle' ? v[3] : 0 }, Hc));
  c.fillStyle = '#231a16'; c.font = '9px sans-serif'; c.fillText(lib.animals[k].name, 6, RH * r + 12);
});
fs.writeFileSync('animals.png', cv.toBuffer('image/png')); console.log('wrote animals.png');
