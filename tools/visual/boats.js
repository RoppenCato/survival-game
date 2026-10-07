// Renders boats.png: the raft and boats laid in the yard, afloat at a few headings, and the parts in the yard. node tools/visual/boats.js
const { createCanvas } = require('@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const Yard = require('../../src/yard.js');
const Z = 4, W = 640, H = 300, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#3a6f8e'; c.fillRect(0, 0, W, H);
function vessel(kind, parts, x, y, h) { const v = { kind, parts, x, y: y / 0.75, h, vx: 0, vy: 0, aboard: false }; Yard.fit(v); Yard.drawVessel(c, v, 1.2); return v; }
const raft = [{ id: 'log', i: 0, j: 0 }, { id: 'log', i: 0, j: 1 }, { id: 'log', i: 0, j: 2 }, { id: 'log', i: 1, j: 3 }, { id: 'lash', i: 0, j: 0 }, { id: 'lash', i: 1, j: 1 }, { id: 'lash', i: 0, j: 2 }, { id: 'lash', i: 2, j: 3 }, { id: 'plank', i: 1, j: 1 }];
const small = [{ id: 'keel', i: 1, j: 2 }, { id: 'keel', i: 2, j: 2 }, { id: 'keel', i: 3, j: 2 }, { id: 'strake', i: 2, j: 1 }, { id: 'strake', i: 2, j: 3 }, { id: 'thwart', i: 2, j: 2 }];
const long = []; for (let i = 0; i < 9; i++) { long.push({ id: 'keel', i, j: 2 }); if (i > 0 && i < 8) { long.push({ id: 'strake', i, j: 1 }); long.push({ id: 'strake', i, j: 3 }); } if (i > 1 && i < 7) { long.push({ id: 'strake', i, j: 0 }); long.push({ id: 'strake', i, j: 4 }); } if (i === 2 || i === 4 || i === 6) long.push({ id: 'thwart', i, j: 2 }); }
[[raft, 'raft'], [small, 'boat'], [long, 'boat']].forEach((v, r) => { [0, 0.5, 1.2, 2.2].forEach((h, k) => vessel(v[1], v[0], 80 + k * 150, 50 + r * 80, h)); });
c.fillStyle = '#8a7250'; c.fillRect(10, 250, 300, 40);
Yard.PARTS.forEach((pt, k) => Yard.drawPart(c, pt, 16 + k * 48, 256, 1));
fs.writeFileSync('boats.png', cv.toBuffer('image/png')); console.log('wrote boats.png');
