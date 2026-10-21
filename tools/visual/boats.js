// Renders boats.png: the raft and every hull design fitted out, afloat at a few headings, the karve and the longship under
// sail with rowers, and the parts in the yard. node tools/visual/boats.js
const { createCanvas, loadImage } = require('@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const Yard = require('../../src/yard.js');
async function surfaces() { const d = 'assets/ship/', SF = { plank: await loadImage(d + 'plank_strip.png'), plankLit: await loadImage(d + 'plank_strip_lit.png'), rail: await loadImage(d + 'rail_strip.png'), shields: [] }; for (let i = 1; i <= 8; i++) SF.shields.push(await loadImage(d + 'shield_0' + i + '.png')); Yard.setSurfaces(SF); }   // the studio's surfaces (2026-10-21)
surfaces().then(() => {
const Z = 2, W = 1800, H = 1240, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#3a6f8e'; c.fillRect(0, 0, W, H);
const KJ = Yard.KJ, seat = i => ({ id: 'thwart', i, j: KJ }), HK = Yard.HULLS.karve, HL = Yard.HULLS.longship;
function vessel(kind, parts, x, y, h, extra) { const v = Object.assign({ kind, parts, x, y: y / 0.75, h, vx: 0, vy: 0, aboard: false }, extra || {}); Yard.fit(v); Yard.drawVessel(c, v, 1.2); return v; }
const raft = [{ id: 'log', i: 0, j: 0 }, { id: 'log', i: 0, j: 1 }, { id: 'log', i: 0, j: 2 }, { id: 'log', i: 1, j: 3 }, { id: 'lash', i: 0, j: 0 }, { id: 'lash', i: 1, j: 1 }, { id: 'lash', i: 0, j: 2 }, { id: 'lash', i: 2, j: 3 }, { id: 'plank', i: 1, j: 1 }];
const faering = [seat(2), seat(3)], boat = [seat(2), seat(4), { id: 'dragon', i: 6, j: KJ }];
const karve = [seat(3), seat(4), seat(5), seat(9), seat(10), seat(11), { id: 'mast', i: HK.mast, j: KJ }, { id: 'sail', i: HK.mast, j: KJ }, { id: 'rudder', i: 1, j: KJ }, { id: 'dragon', i: HK.n, j: KJ }, { id: 'shields', i: 4, j: KJ }];
const longship = []; for (let i = 3; i <= HL.n - 1 && longship.length < 13; i++) if (i !== HL.mast) longship.push(seat(i)); longship.push({ id: 'mast', i: HL.mast, j: KJ }, { id: 'sail', i: HL.mast, j: KJ }, { id: 'rudder', i: 1, j: KJ }, { id: 'dragon', i: HL.n, j: KJ }, { id: 'shields', i: 4, j: KJ });
[[raft, 'raft'], [faering, 'faering'], [boat, 'boat'], [karve, 'karve']].forEach((v, r) => { [0, 0.5, 1.2, 2.2].forEach((h, k) => { vessel(v[1], v[0], 230 + k * 440, 90 + r * 170, h); }); });
[0, 0.6, 1.4].forEach((h, k) => vessel('karve', karve, 260 + k * 560, 840, h, { vx: Math.cos(h) * 50, vy: Math.sin(h) * 50, crew: 10, sailFill: 0.9 }));   // under sail, with rowers
vessel('longship', longship, 800, 1090, 0.25, { vx: 50, vy: 12, crew: 26, sailFill: 0.9 });
c.fillStyle = '#8a7250'; c.fillRect(1250, 1180, 520, 44);
Yard.partsFor('longship').forEach((pt, k) => Yard.drawPart(c, pt, 1256 + k * 46, 1188, 1));
c.font = '600 12px sans-serif'; c.fillStyle = '#f6e2b8'; ['Raft', 'Faering', 'Boat (a dragon stem)', 'Karve (stem, shields)'].forEach((t, r) => c.fillText(t, 12, 30 + r * 170)); c.fillText('Under sail, rowed', 12, 740); c.fillText('The longship: 13 seats, 26 oars', 12, 600);
fs.writeFileSync('boats.png', cv.toBuffer('image/png')); console.log('wrote boats.png');
});
