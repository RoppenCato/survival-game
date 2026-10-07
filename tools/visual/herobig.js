// One hero large (the front and side views, standing and walking): node tools/visual/herobig.js [name]
const { createCanvas } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js');
const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
const nm = process.argv[2] || lib.heroes[0].name; lib.setHero(lib.heroSpec(nm));
const Z = 12, W = 260, H = 66, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#8fa266'; c.fillRect(0, 0, W, H);
[['down', 0], ['left', 0], ['down', 1], ['left', 1], ['up', 0]].forEach((v, i) => lib.playerD(c, 28 + i * 50, 60, v[0], { phase: 1.2, amt: v[1], t: 1, lx: 0, ly: 0, blink: 0, sq: 0 }, null));
fs.writeFileSync('herobig.png', cv.toBuffer('image/png')); console.log('wrote herobig.png');
