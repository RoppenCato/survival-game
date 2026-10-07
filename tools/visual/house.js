// Renders the building pieces to house.png: a house in each wall material under each roof, with a door, a window, a
// post, a chimney and stairs, then the yard pieces and the board icons. Run from the project root:  node tools/visual/house.js
const { createCanvas } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const Build = require('../../src/build.js');
const Z = 4, W = 760, H = 350, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#7f945c'; c.fillRect(0, 0, W, H);
const T = Build.T, TS = Build.TS;
function house(ox, oy, m, roof) {                      // a 3 by 2 tile house at tile (ox, oy): walls, a door and a window in the south wall, a roof
  const B = { floors: {}, H: {}, V: {}, posts: {}, stairs: {}, roofs: {}, items: {} };
  for (let y = oy; y < oy + 2; y++) for (let x = ox; x < ox + 3; x++) B.floors[Build.key(x, y)] = 0;
  for (let x = ox; x < ox + 3; x++) { B.H[Build.key(x, oy)] = { t: 'wall', m }; B.H[Build.key(x, oy + 2)] = { t: x === ox + 1 ? 'door' : (x === ox ? 'window' : 'wall'), m }; }
  for (let y = oy; y < oy + 2; y++) { B.V[Build.key(ox, y)] = { t: 'wall', m }; B.V[Build.key(ox + 3, y)] = { t: y === oy ? 'window' : 'wall', m }; }
  const ri = Build.rooms(B, 40, 40, { x0: 0, y0: 0, x1: 40, y1: 40 }), cfg = Build.cfg({ roof });
  for (const k in B.floors) { const q = k.split(','); c.fillStyle = '#8a6a48'; c.fillRect(q[0] * T, q[1] * TS, T, TS); }
  for (let x = ox; x < ox + 3; x++) Build.drawH(c, x, oy, B.H[Build.key(x, oy)], false, false, cfg);
  for (let y = oy; y < oy + 2; y++) { Build.drawV(c, ox, y, B.V[Build.key(ox, y)], false, B.V[Build.key(ox, y + 1)] || false, cfg); Build.drawV(c, ox + 3, y, B.V[Build.key(ox + 3, y)], false, B.V[Build.key(ox + 3, y + 1)] || false, cfg); }
  Build.drawPost(c, ox, oy + 2, { m }, cfg);
  for (let x = ox; x < ox + 3; x++) Build.drawH(c, x, oy + 2, B.H[Build.key(x, oy + 2)], false, false, cfg);   // the south wall first: the roof's eave hangs over its top, as the game sorts them
  if (ri.rooms[0]) Build.drawRoof(c, ri.rooms[0], 1, cfg, 0);
  Build.drawChimney(c, (ox + 2.5) * T, oy * TS - 10, 22, 1, 1.3);
}
[[0, 0], [1, 1], [2, 2], [3, 3], [4, 1]].forEach((v, i) => house(1 + i * 4, 2, v[0], v[1]));
house(1, 7, 0, 1); house(5, 7, 3, 0); house(9, 7, 1, 2);
const cfg = Build.cfg({});
[['fence', 2], ['rail', 0], ['drystone', 3], ['palisade', 0], ['gate', 2]].forEach((f, i) => { const e = { t: f[0], m: f[1] }; Build.drawH(c, 14 + i * 1.6, 7, e, false, false, cfg); Build.drawV(c, 14 + i * 1.6, 7, e, false, false, cfg); });
Build.drawH(c, 14, 9.5, { t: 'gate', m: 2 }, false, true, cfg);
Build.drawStairs(c, 16, 9.2, cfg); Build.drawPost(c, 18, 10.2, { m: 0 }, cfg); Build.drawPost(c, 19, 10.2, { m: 3 }, cfg); Build.drawBeam(c, 18, 10.2, true, { m: 0 }, cfg);
['wall', 'door', 'window', 'floor', 'roof', 'fence', 'gate', 'palisade', 'post', 'stairs', 'rail', 'drystone'].forEach((id, i) => { c.save(); c.translate(20 + i * 18, 300); c.scale(1.4, 1.4); Build.icon(c, id, id === 'roof' ? 1 : 0); c.restore(); });
fs.writeFileSync('house.png', cv.toBuffer('image/png')); console.log('wrote house.png');
