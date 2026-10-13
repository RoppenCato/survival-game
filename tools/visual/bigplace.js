// Renders one village large to bigplace.png (2026-10-13: the big places and the trial with bigger houses), drawn as the Village
// Editor draws them, and prints what it came to.   node tools/visual/bigplace.js [arch] [houseK] [seed] [wealth]
const { createCanvas } = require('@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js'), Build = require('../../src/build.js'), Village = require('../../src/village.js');
const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
const arch = process.argv[2] || 'bigtown', HK = +process.argv[3] || 1, seed = +process.argv[4] || 4321, wealth = process.argv[5] != null ? +process.argv[5] : 0.7, T = 32, TS = 24, Z = 1.5;
const site = Village.siteFor(arch, { houseK: HK }), W = (site.w + 4) * T, H = (site.h + 4) * TS, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
const tiles = {}; function tileCv(n) { if (!tiles[n]) tiles[n] = kit.bakeTile(n, 0); return tiles[n]; }
c.setTransform(Z, 0, 0, Z, 0, 0);
for (let y = 0; y < site.h + 4; y++) for (let x = 0; x < site.w + 4; x++) c.drawImage(tileCv('grass'), x * T, y * TS, T + 0.4, TS + 0.4);
const V = Village.make(seed, { tx: 2, ty: 2, w: site.w, h: site.h, shore: null }, { arch, wealth, G: { houseK: HK } });
Village.draw(c, V, { kit, Build, lib, tile: (cc, tx, ty, x, y, w, h) => cc.drawImage(tileCv(V.floors[tx + ',' + ty] === 1 ? 'dirt' : 'plank'), x, y, w, h) }, 0);
const by = {}; V.lots.forEach(l => { by[l.id] = (by[l.id] || 0) + 1; });
const houses = V.lots.filter(l => l.id === 'house'), F = V.fence;
console.log(Village.ARCH[arch].name + ', houses times ' + HK + ', seed ' + seed + ': site ' + site.w + ' by ' + site.h + ', ' + V.lots.length + ' buildings (' + Object.keys(by).map(k => by[k] + ' ' + k).join(', ') + '), ' + V.folk.length + ' people');
console.log('  houses: ' + houses.map(l => l.w + 'x' + l.h + (l.slot === 'outer' ? '*' : '')).join(' ') + '   (* the second ring)');
console.log('  the hall ' + V.lots[0].w + 'x' + V.lots[0].h + ', the wall ' + (F ? F.kind + (F.round ? ' (a ring of stakes)' : '') + ' ' + (F.x1 - F.x0) + ' by ' + (F.y1 - F.y0) + ' tiles' : 'none') + ', a garrison of 30: ' + Village.garrison(V, 30).length);
fs.writeFileSync('bigplace.png', cv.toBuffer('image/png')); console.log('wrote bigplace.png ' + cv.width + 'x' + cv.height);
