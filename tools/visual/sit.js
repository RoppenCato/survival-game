// The hero seated (an.sit) beside standing, front and side: node tools/visual/sit.js
const { createCanvas } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js'); const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
const Z = 8, W = 200, H = 70, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d'); c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#8fa266'; c.fillRect(0, 0, W, H);
[['down', 0], ['down', 1], ['left', 0], ['left', 1]].forEach((v, i) => lib.playerD(c, 25 + i * 48, 62, v[0], { phase: 0, amt: 0, t: 1, lx: 0, ly: 0, blink: 0, sq: 0, sit: v[1] }, null));
fs.writeFileSync('sit.png', cv.toBuffer('image/png')); console.log('wrote sit.png');
