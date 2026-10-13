// Renders damage to ruin.png (src/ruin.js, the drawings in src/build.js): every wall material whole, hacked, nearly through,
// given and burnt, as a wall that faces you and as one that runs away from you; the yard pieces; a house whole, broken into,
// its roof fallen, and burnt out; and the same house with side walls that lean so their faces show (CFG.lean), before and after.
// Run from the project root:  node tools/visual/ruin.js [lean]
const { createCanvas } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const Build = require('../../src/build.js'), Ruin = require('../../src/ruin.js');
const LEAN = +(process.argv[2] || 9);
const Z = 4, W = 900, H = 840, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#7f945c'; c.fillRect(0, 0, W, H);
const T = Build.T, TS = Build.TS, key = Build.key;
function label(s, x, y) { c.fillStyle = '#20281a'; c.font = '7px sans-serif'; c.fillText(s, x, y); }
const STATES = [{}, { st: 1 }, { st: 2 }, { breach: 1 }, { scorch: 1 }, { breach: 1, burnt: 1 }];
const NAMES = ['whole', 'hacked', 'nearly through', 'given', 'scorched', 'burnt down'];
// the walls, one material a row
Build.WALLS.forEach((m, mi) => {
  const y = 2 + mi * 1.9;
  label(m.name, 4, y * TS - 8);
  STATES.forEach((s, si) => {
    const e = Object.assign({ t: 'wall', m: mi }, s), x = 2.3 + si * 1.9, cfg = Build.cfg({});
    Build.drawH(c, x, y, e, false, false, cfg);
    if (mi === 0) label(NAMES[si], x * T, 14);
  });
  STATES.forEach((s, si) => {
    const e = Object.assign({ t: 'wall', m: mi }, s), x = 14.4 + si * 1.2, cfg = Build.cfg({});
    Build.drawV(c, x, y - 1, e, false, false, cfg, -1);
  });
  STATES.forEach((s, si) => {
    const e = Object.assign({ t: 'wall', m: mi }, s), x = 22 + si * 1.2, cfg = Build.cfg({ lean: LEAN });
    Build.drawV(c, x, y - 1, e, false, false, cfg, si % 2 ? 1 : -1);
  });
});
label('walls that run away from you, as now', 14 * T, 14); label('the same with a lean of ' + LEAN + ' (faces west, east in turn)', 21.6 * T, 14);
// the yard pieces and doors
const yy = 16.2;
[['fence', 2], ['rail', 0], ['drystone', 3], ['palisade', 0], ['gate', 2], ['townwall', 6]].forEach((f, i) => {
  [{}, { breach: 1 }, { breach: 1, burnt: 1 }].forEach((s, si) => { const e = Object.assign({ t: f[0], m: f[1] }, s), cfg = Build.cfg({}); Build.drawH(c, 1 + i * 4.4 + si * 1.3, yy, e, false, false, cfg); Build.drawV(c, 1 + i * 4.4 + si * 1.3, yy + 0.5, e, false, false, cfg); });
  label(f[0], (1 + i * 4.4) * T, yy * TS - 36);
});
[[0, {}], [0, { st: 1, locked: 1 }], [0, { st: 2, locked: 1 }], [0, { breach: 1 }], [6, {}], [6, { st: 2, locked: 1 }], [6, { breach: 1 }]].forEach((d, i) => { Build.drawH(c, 1 + i * 1.5, yy + 3.2, Object.assign({ t: 'door', m: d[0] }, d[1]), false, false, Build.cfg({})); });
label('doors: whole, under the axe, given', T, (yy + 3.2) * TS - 36);
[[1, {}], [1, { st: 2 }], [1, { breach: 1 }], [6, {}], [6, { breach: 1 }]].forEach((d, i) => { Build.drawH(c, 13 + i * 1.5, yy + 3.2, Object.assign({ t: 'window', m: d[0] }, d[1]), false, false, Build.cfg({})); });
// houses
function house(ox, oy, m, roof, Wd, Hh, o) {
  o = o || {};
  const B = { floors: {}, H: {}, V: {}, posts: {}, stairs: {}, roofs: {}, items: {} };
  for (let y = oy; y < oy + Hh; y++) for (let x = ox; x < ox + Wd; x++) B.floors[key(x, y)] = 0;
  for (let x = ox; x < ox + Wd; x++) { B.H[key(x, oy)] = { t: 'wall', m }; B.H[key(x, oy + Hh)] = { t: x === ox + 1 ? 'door' : (x === ox + Wd - 1 ? 'window' : 'wall'), m }; }
  for (let y = oy; y < oy + Hh; y++) { B.V[key(ox, y)] = { t: 'wall', m }; B.V[key(ox + Wd, y)] = { t: y === oy ? 'window' : 'wall', m }; }
  if (o.edit) o.edit(B);
  const ri = Build.rooms(B, 60, 60, { x0: 0, y0: 0, x1: 60, y1: 60 }), room = ri.rooms[0], cfg = Build.cfg({ roof, wallM: m, lean: o.lean || 0 });
  if (o.fall && room) Ruin.collapse(Ruin.cfg(), B, room, o.fall, roof);
  for (const k in B.floors) { const q = k.split(','); c.fillStyle = '#8a6a48'; c.fillRect(q[0] * T, q[1] * TS, T, TS); }
  if (B.ruin) for (const k in B.ruin) { const q = k.split(','); Build.drawDebris(c, +q[0], +q[1], B.ruin[k], cfg); }
  for (let x = ox; x < ox + Wd; x++) Build.drawH(c, x, oy, B.H[key(x, oy)], false, false, cfg);
  for (let y = oy; y < oy + Hh; y++) { Build.drawV(c, ox, y, B.V[key(ox, y)], false, B.V[key(ox, y + 1)] || false, cfg, -1); Build.drawV(c, ox + Wd, y, B.V[key(ox + Wd, y)], false, B.V[key(ox + Wd, y + 1)] || false, cfg, 1); }
  for (let x = ox; x < ox + Wd; x++) Build.drawH(c, x, oy + Hh, B.H[key(x, oy + Hh)], false, false, cfg);
  if (room && !o.noRoof && !(B.roofs[room.id] === 5)) Build.drawRoof(c, room, o.alpha == null ? 1 : o.alpha, cfg, 0);
  if (o.flames) o.flames.forEach((f, i) => Build.drawFlame(c, f[0] * T, f[1] * TS, f[2], 0.4 + i, i));
}
const hy = 24;
label('whole', 1 * T, (hy - 1.6) * TS); house(1, hy, 1, 1, 4, 3);
label('broken into (two walls given)', 6 * T, (hy - 1.6) * TS); house(6, hy, 1, 1, 4, 3, { edit: B => { B.V[key(6, hy + 1)].breach = 1; B.H[key(8, hy + 3)].st = 2; B.H[key(7, hy + 3)].breach = 1; }, alpha: 0.3 });
label('the roof has fallen', 11.5 * T, (hy - 1.6) * TS); house(12, hy, 1, 1, 4, 3, { edit: B => { B.V[key(12, hy + 1)].breach = 1; B.V[key(12, hy + 2)].breach = 1; B.H[key(13, hy + 3)].breach = 1; B.H[key(14, hy + 3)].breach = 1; B.H[key(13, hy)].breach = 1; B.V[key(16, hy + 1)].st = 2; }, fall: 'fallen' });
label('burning', 17.5 * T, (hy - 1.6) * TS); house(18, hy, 2, 1, 4, 3, { edit: B => { B.H[key(19, hy + 3)].scorch = 1; B.H[key(20, hy + 3)].scorch = 1; }, flames: [[18.7, hy - 0.6, 14], [20.1, hy - 1.1, 18], [21.1, hy - 0.4, 12], [19.5, hy + 3, 9]] });
label('burnt out', 23.5 * T, (hy - 1.6) * TS); house(24, hy, 2, 1, 4, 3, { edit: B => { for (const k in B.H) { B.H[k].burnt = 1; B.H[k].scorch = 1; if (Math.abs(Math.sin((+k.split(',')[0]) * 3.1 + (+k.split(',')[1]))) < 0.75) B.H[k].breach = 1; } for (const k in B.V) { B.V[k].burnt = 1; if ((+k.split(',')[1]) % 2) B.V[k].breach = 1; } }, fall: 'burnt' });
// the lean, before and after: under a roof, and with the roof faded as when you stand inside
const ly = 30;
label('side walls as now', 1 * T, (ly - 1.6) * TS); house(1, ly, 0, 1, 3, 3); house(5, ly, 0, 1, 3, 3, { alpha: 0.12 }); house(9, ly, 3, 0, 3, 2, { alpha: 0.12 }); 
label('side walls leaning ' + LEAN + ', their faces showing', 15 * T, (ly - 1.6) * TS); house(15, ly, 0, 1, 3, 3, { lean: LEAN }); house(19, ly, 0, 1, 3, 3, { lean: LEAN, alpha: 0.12 }); house(23, ly, 3, 0, 3, 2, { lean: LEAN, alpha: 0.12 });
fs.writeFileSync('ruin.png', cv.toBuffer('image/png')); console.log('wrote ruin.png');
