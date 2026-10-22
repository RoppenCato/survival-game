/* Cave: the inside of the troll's cave (2026-10-12, Robin: way more immersive, depth, the mountain technique, lights coming in
   from holes in the mountain, a better floor, a scary adventure you do not get lost in too much).

   Cave.make(seed, { x, y, rockHp }) lays the cave out and returns it: a hall at the foot of a tunnel of daylight (the way out,
   to the south: you came in northward through a cliff), then one way through that winds east (in half the worlds west: the
   whole cave is laid the other way round, by the seed) past a hollow under a hole in the roof, a chamber with a still pool, a cavern split by a chasm, a gallery of copper veins, to the troll's lair and the nook
   behind it; four pockets lead off it and end. Two smooth fields say what is where (D: how far inside the floor a point is,
   in tiles; P: the chasm), read between their cells, so every wall is a curve.

   The look is the mountains' turned inside out (src/world.js, "Mountains"): the rock is the high ground, so every edge of floor
   with rock north of it carries a WALL FACE WALLH pixels tall above its foot (panels of rock between fissures, beds and strata,
   water running down, rust), fading up into the dark of the roof; a wall on the east or west of the floor stands back as it
   rises (a side wall, lit where it faces west and dark where it faces east); the near wall, whose face is turned away, is a
   rim of rock and black beyond it. The chasm is the same thing downward: the floor is the high ground and the wall under its
   edge falls into black. Everything is worked out once on sheets a pixel a unit over the whole cave (prepare) and painted in
   pieces (chunk); a pen then draws what stands on the floor.

   LIGHT. The cave is dark: the page lays Cave.dark over it (deep blue-black with holes: the hero's own circle, the daylight
   at the tunnel, every hole in the roof, the copper's glow). The holes in the roof stand along the way through, so you walk
   from light to light, and under each grows moss and fern; by night they give only moonlight. The troll's own path is worn
   pale down the middle of the way through, his footprints in it, and bones lie thicker the nearer his lair. Cave.see marks
   what the hero's light has shown and Cave.drawChart draws it, for the chart in the corner. */
var Cave = (function () {
'use strict';
var T = 32, K = 0.75, GW = 104, GH = 60,   /* (the studio's prototype: a bigger cave, 2026-10-22) */ FS = 8, FW = GW * T / FS, FH = GH * T / FS;   // the fields: cells 8 units wide
var PW = GW * T, PH = Math.round(GH * T * K);                                          // the sheets: a pixel a unit across, the screen's rows down
var WALLH = 64, SIDE = 16, PITH = 240,   /* (the studio's prototype, 2026-10-22: the chasm twice as deep, an abyss) */ PSIDE = 24, CS = 256, PXS = 2, SEEN = 16, SW = PW / SEEN, SH = GH * T / SEEN;
function hash(x, y, s) { var h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y, s) { var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s) { return vnoise(x, y, s) * 0.65 + vnoise(x * 2.1, y * 2.1, s + 9) * 0.35; }
function rng(seed) { var a = (seed * 2654435761) >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function sm(a, b, v) { var t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }
var NS = null, WS = null;                               // a sheet of smooth noise (128 square, it repeats) and one of white noise (256)
function sheets() {
  if (NS) return; var x, y, i; NS = new Float32Array(128 * 128); WS = new Float32Array(256 * 256);
  function vn(px, py, cell, sd) { var n = 128 / cell, fx = px / cell, fy = py / cell, xi = Math.floor(fx), yi = Math.floor(fy), u = fx - xi, v = fy - yi; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); var a = hash(xi % n, yi % n, sd), b = hash((xi + 1) % n, yi % n, sd), c = hash(xi % n, (yi + 1) % n, sd), d = hash((xi + 1) % n, (yi + 1) % n, sd); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  for (y = 0; y < 128; y++) for (x = 0; x < 128; x++) NS[y * 128 + x] = vn(x, y, 32, 13) * 0.6 + vn(x, y, 16, 15) * 0.4;
  for (i = 0; i < 65536; i++) WS[i] = hash(i % 256, (i / 256) | 0, 177);
}
function nsm(x, y, sc) { var fx = x / sc, fy = y / sc, xi = Math.floor(fx), yi = Math.floor(fy), u = fx - xi, v = fy - yi, a = NS[((yi & 127) << 7) | (xi & 127)], b = NS[((yi & 127) << 7) | ((xi + 1) & 127)], c = NS[(((yi + 1) & 127) << 7) | (xi & 127)], d = NS[(((yi + 1) & 127) << 7) | ((xi + 1) & 127)]; return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function mkCanvas(w, h) { if (typeof document !== 'undefined') { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; } return global.__mk(w, h); }

function fieldAt(F, cave, x, y) {                        // a field read between its cells, at a point of the world
  var fx = (x - cave.ox) / FS - 0.5, fy = (y - cave.oy) / FS - 0.5, i = Math.floor(fx), j = Math.floor(fy);
  if (i < 0 || j < 0 || i >= FW - 1 || j >= FH - 1) return -9;
  var u = fx - i, v = fy - j, a = F[j * FW + i], b = F[j * FW + i + 1], c = F[(j + 1) * FW + i], d = F[(j + 1) * FW + i + 1];
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function dAt(cave, x, y) { return fieldAt(cave.D, cave, x, y); }                       // tiles inside the floor (below zero: rock)
function pAt(cave, x, y) { return fieldAt(cave.P, cave, x, y); }                       // tiles inside the chasm
function trailAt(cave, x, y) { var v = fieldAt(cave.TR, cave, x, y); return v < -8 ? 999 : v; }   // units from the middle of the way through
function onBridge(cave, x, y) { var bs = cave.bridges, i; if (!bs) return false; for (i = 0; i < bs.length; i++) { var b = bs[i]; if (x >= b.x0 && x <= b.x1 && Math.abs(y - b.y) < b.w / 2) return true; } return false; }   // (the studio's prototype: the rope bridge over the abyss)
function floor(cave, x, y) { return dAt(cave, x, y) >= 0 && (pAt(cave, x, y) < -0.2 || onBridge(cave, x, y)); } // where you can stand: floor, a step back from the chasm, and the bridge over it

/* THE OTHER CAVES (2026-10-12, Robin: there needs to be more to the mountains than troll caves; an old copper mine, a sea cave).
   The same sheets and the same painter, another lay-out. base() makes the fields from a list of shapes (ellipses, and boxes
   for what people dug: straight walls) and the cave with what every kind has; makeMine and makeSea fill it.
   THE MINE: an adit straight in from the daylight, a main drift east or west with crosscuts to worked-out stopes, timber
   sets in the adit and posts along the drift, soot on the walls where they set fires to crack the rock (charcoal still
   lies there), a fall of rock across the drift that the pick clears, and beyond it the deep stope with the best veins and
   the man who never came out. Nobody lives in it: it is quiet, and darker than the troll's (one hole in the roof).
   THE SEA CAVE: the sea comes in at the mouth (S, the water's depth in tiles, read like D: you wade it) and fills the south
   of a great hall; at its back a beach of shingle with a wreck on it under a hole in the roof, driftwood, and a passage up
   to a dry pocket where somebody hid a chest. The daylight carries far in over the water (glows). */
function base(seed, o, L) {
  var ox = o.x || 0, oy = o.y || 0, D = new Float32Array(FW * FH), P = new Float32Array(FW * FH).fill(-9), S = L.sea ? new Float32Array(FW * FH) : null, ns = seed * 7 + 3 + (L.salt || 0), i2, j2, ci, k, TX = L.TX, tw = L.tunW || 2.2;
  for (j2 = 0; j2 < FH; j2++) for (i2 = 0; i2 < FW; i2++) {
    var tx = (i2 + 0.5) * FS / T, ty = (j2 + 0.5) * FS / T, best = -9;
    for (ci = 0; ci < L.shapes.length; ci++) { var cc = L.shapes[ci], dd;
      if (cc.box) { var bx = cc.hw - Math.abs(tx - cc.x), by = cc.hh - Math.abs(ty - cc.y); if (bx < -2 || by < -2) continue; dd = Math.min(bx, by); }
      else { var ux = (tx - cc.x) / cc.rx, uy = (ty - cc.y) / cc.ry; if (ux > 2 || ux < -2 || uy > 2 || uy < -2) continue; dd = (1 - Math.sqrt(ux * ux + uy * uy)) * Math.min(cc.rx, cc.ry); }
      if (dd > best) best = dd; }
    best += (fbm(tx * 1.1, ty * 1.1, ns) - 0.5) * (L.rough != null ? L.rough : 1.3);
    if (L.holes) for (ci = 0; ci < L.holes.length; ci++) { var hc2 = L.holes[ci], hd = Math.min(hc2.hw - Math.abs(tx - hc2.x), hc2.hh - Math.abs(ty - hc2.y)); if (-hd < best) best = -hd; }   // rock left standing: a pillar (built, so its sides are straight)
    var inTunnel = Math.abs(tx - TX) < tw && ty > 33, edge = Math.min(tx - 1.5, GW - 1.5 - tx, ty - 3.2, inTunnel ? 9 : GH - 1.2 - ty); if (edge < best) best = edge;
    D[j2 * FW + i2] = best;
    if (S) S[j2 * FW + i2] = L.sea(tx, ty) + (fbm(tx * 0.8, ty * 0.8, ns + 11) - 0.5) * 0.4;
    if (L.pits) for (ci = 0; ci < L.pits.length; ci++) { var pt = L.pits[ci], pd = Math.min(pt.hw - Math.abs(tx - pt.x), pt.hh - Math.abs(ty - pt.y)) + (fbm(tx * 2.1, ty * 2.1, ns + 17) - 0.5) * 0.12; if (pd > P[j2 * FW + i2]) P[j2 * FW + i2] = pd; }   // a burial pit: a shaft with built sides falling away (the studio's prototype)
  }
  var cave = { kind: L.kind, ox: ox, oy: oy, seed: seed, D: D, P: P, S: S, TR: null, chunks: {}, chunkN: 0, noiseT: 0, px: null, ores: [], veins: [], props: [], shafts: [], puddles: [], pockets: [], sets: [], posts: [], soot: [], finds: [], glows: [], seen: new Uint8Array(SW * SH), seenDirty: true, pool: null, lair: null, hoard: null, body: null, pit: null, flip: L.flip, tintF: L.tintF || null, tintW: L.tintW || null, tunW: (tw + 0.3) * T };
  function W(p) { return { x: ox + p[0] * T, y: oy + p[1] * T }; }
  cave.path = L.path.map(W); cave.entrance = W([TX, 34.3]); cave.exitAt = W([TX, 36.9]); cave.tunnelY = oy + 35.2 * T;
  var TR = new Float32Array(FW * FH).fill(-9), cp = cave.path;
  if (L.trail) for (j2 = 0; j2 < FH; j2++) for (i2 = 0; i2 < FW; i2++) {
    if (D[j2 * FW + i2] < -1.2) continue; var wx = ox + (i2 + 0.5) * FS, wy = oy + (j2 + 0.5) * FS, bd = 1e9;
    for (k = 0; k < cp.length - 1; k++) { var pa = cp[k], pb = cp[k + 1], ax = pb.x - pa.x, ay = pb.y - pa.y, tt = Math.max(0, Math.min(1, ((wx - pa.x) * ax + (wy - pa.y) * ay) / (ax * ax + ay * ay))), ds = Math.hypot(wx - pa.x - ax * tt, wy - pa.y - ay * tt); if (ds < bd) bd = ds; }
    var dt2 = Math.abs(wx - cave.entrance.x) < 30 && wy > cave.entrance.y - 40 ? Math.abs(wx - cave.entrance.x) : 1e9; TR[j2 * FW + i2] = Math.min(bd, dt2);
  }
  cave.TR = TR;
  return cave;
}
function reachOf(cave) {                                 // the floor you can walk to from the way in (a flood over the fields' cells)
  var ox = cave.ox, oy = cave.oy, RC = new Uint8Array(FW * FH), st = [Math.floor((cave.entrance.y - oy) / FS) * FW + Math.floor((cave.entrance.x - ox) / FS)]; RC[st[0]] = 1;
  while (st.length) { var c0 = st.pop(), ci2 = c0 % FW, cj2 = (c0 - ci2) / FW, d4; for (d4 = 0; d4 < 4; d4++) { var na = ci2 + (d4 === 0 ? 1 : (d4 === 1 ? -1 : 0)), nb = cj2 + (d4 === 2 ? 1 : (d4 === 3 ? -1 : 0)); if (na < 0 || nb < 0 || na >= FW || nb >= FH || RC[nb * FW + na] || !floor(cave, ox + (na + 0.5) * FS, oy + (nb + 0.5) * FS)) continue; RC[nb * FW + na] = 1; st.push(nb * FW + na); } }
  return (cave.RC = RC);
}
function tools(cave, R, o) {                             // what the lay-outs share: is a spot clear, the foot of the wall north of a point, a vein, an ore rock, a thing that stands
  var ox = cave.ox, oy = cave.oy, hp0 = o.rockHp || 11, keep = [];
  function footN(x, y) { var k; for (k = 0; k < 90; k++) if (dAt(cave, x, y - k * 3) < 0) return y - k * 3 + 3; return null; }
  function clearAt(px, py, room, trail) {
    var a; if (!floor(cave, px, py) || trailAt(cave, px, py) < (trail == null ? 34 : trail) || !cave.RC[Math.floor((py - oy) / FS) * FW + Math.floor((px - ox) / FS)]) return false;
    for (a = 0; a < 6; a++) if (!floor(cave, px + Math.cos(a * 1.047) * room, py + Math.sin(a * 1.047) * room)) return false;
    if (Math.hypot(px - cave.entrance.x, py - cave.entrance.y) < 100 || keep.some(function (q) { return Math.hypot(q.x - px, q.y - py) < q.r; })) return false;
    return !cave.ores.concat(cave.props, cave.finds).some(function (q) { return Math.hypot(q.x - px, q.y - py) < 40; });
  }
  function vein(x, y0, left) {
    var k, fh = 0, WU = WALLH / K, found = footN(x, y0); if (found == null) return false;
    for (k = 2; k <= WU; k += 2) { if (dAt(cave, x, found - k) < 0) fh = k; else break; }
    if (fh < 30 || !floor(cave, x, found + 8) || cave.veins.some(function (q) { return Math.abs(q.x - x) < 40 && Math.abs(q.y - found) < 60; })) return false;
    cave.veins.push({ name: 'vein', kind: 'stone', vein: true, cave: true, x: x, y: found, h: Math.min(fh, 46), s: Math.floor(R() * 7), r: 0, left: left, hp: hp0 * 0.8, max: hp0 * 0.8 }); return true;
  }
  function ore(cx, cy, rx, ry) { var t2; for (t2 = 0; t2 < 40; t2++) { var ex = cx + (R() - 0.5) * 2 * rx, ey = cy + (R() - 0.5) * 2 * ry; if (!clearAt(ex, ey, 14)) continue; var s2 = 0.85 + R() * 0.3, hp = hp0 * (0.7 + 0.6 * s2); cave.ores.push({ name: 'rock', kind: 'stone', ore: true, cave: true, x: ex, y: ey, s: s2, r: 8, v: Math.floor(R() * 3), hp: hp, max: hp, leanDir: 1 }); return true; } return false; }
  function stand(cx, cy, rx, ry, n2, names) { var t3, got = 0; for (t3 = 0; t3 < n2 * 16 && got < n2; t3++) { var sx = cx + (R() - 0.5) * 2 * rx, sy = cy + (R() - 0.5) * 2 * ry; if (!clearAt(sx, sy, 9)) continue; var big = R() < 0.13, nm = names ? names[Math.floor(R() * names.length)] : (big ? 'caveColumn' : 'stalagmite'); cave.props.push({ name: nm, x: sx, y: sy, s: nm === 'caveColumn' ? 0.9 + R() * 0.25 : 0.7 + R() * 0.5, r: nm === 'caveColumn' ? 9 : 6, v: Math.floor(R() * 3), cave: true }); got++; } }
  function across(x, y) { var k, xl = x, xr = x; for (k = 0; k < 40 && dAt(cave, xl - 3, y) >= 0; k++) xl -= 3; for (k = 0; k < 40 && dAt(cave, xr + 3, y) >= 0; k++) xr += 3; return [xl, xr]; }
  return { footN: footN, clearAt: clearAt, vein: vein, ore: ore, stand: stand, across: across, keep: keep };
}
function makeMine(seed, o) {
  var R = rng(seed * 53 + 17), flip = hash(seed, 5, 9) < 0.5, sg = flip ? -1 : 1, TX = flip ? GW - 8 : 8, i, k;
  function jit(a) { return (R() - 0.5) * 2 * a; }
  var y0 = 25.4 + jit(0.6), xA = TX + sg * (8 + jit(0.8)), xB = TX + sg * (17.5 + jit(1)), xC = TX + sg * (12.5 + jit(0.8)), xBlock = TX + sg * 25.6, xDeep = TX + sg * 32.5, yA = y0 - 8.2 + jit(0.6), yB = y0 - 11.4 + jit(0.6), yC = y0 + 6.6, shapes = [];
  function box(x, y, hw, hh) { shapes.push({ box: 1, x: x, y: y, hw: hw, hh: hh }); } function oval(x, y, rx, ry) { shapes.push({ x: x, y: y, rx: rx, ry: ry || rx }); }
  box(TX, 34, 1.3, 8.6);                                                  // the adit, straight in from the daylight
  oval(TX, y0, 2.5, 2.2);                                                 // where it meets the drift
  var x1 = TX + sg * 9, x2 = TX + sg * 18, x3 = xBlock - sg * 1.2;         // the main drift, in three reaches that do not quite line up
  box((TX + x1) / 2, y0, Math.abs(x1 - TX) / 2 + 0.6, 1.3); box((x1 + x2) / 2, y0 - 0.7, Math.abs(x2 - x1) / 2 + 0.6, 1.3); box((x2 + x3) / 2, y0 + 0.2, Math.abs(x3 - x2) / 2 + 0.6, 1.3);
  box(xBlock, y0 + 0.2, 1.6, 0.92);                                       // it narrows where the roof came down
  box((xBlock + xDeep) / 2 + sg * 0.6, y0 + 0.1, Math.abs(xDeep - xBlock) / 2, 1.25); oval(xDeep, y0 - 1.6, 5.6, 4.3);   // and beyond: the deep stope
  box(xA, (y0 + yA) / 2, 1.2, Math.abs(y0 - yA) / 2 + 0.4); oval(xA - sg * 0.6, yA, 3.7, 2.8);    // the first crosscut and its stope
  box(xB, (y0 + yB) / 2 - 0.3, 1.2, Math.abs(y0 - yB) / 2 + 0.4); oval(xB + sg * 0.8, yB, 4.6, 3.3);   // the second, longer, to the big stope
  box(xC, (y0 + yC) / 2, 1.15, Math.abs(yC - y0) / 2 + 0.3); oval(xC, yC, 2.9, 2.3);              // and one that goes south to a dead end
  var path = [[TX, 33.4], [TX, 30], [TX, y0 + 0.2], [x1, y0 - 0.2], [x2, y0 - 0.5], [x3, y0 + 0.2]];
  var cave = base(seed, o, { kind: 'mine', shapes: shapes, rough: 0.42, TX: TX, tunW: 1.9, path: path, trail: true, flip: flip, salt: 40, tintF: [1.12, 0.99, 0.84], tintW: [1.14, 0.98, 0.8] });
  var ox = cave.ox, oy = cave.oy; function W(p) { return { x: ox + p[0] * T, y: oy + p[1] * T }; }
  cave.name = 'The old mine'; cave.junction = W([TX, y0]); cave.stopeA = W([xA - sg * 0.6, yA]); cave.stopeB = W([xB + sg * 0.8, yB]); cave.deadEnd = W([xC, yC]); cave.block = W([xBlock, y0 + 0.2]); cave.deep = W([xDeep, y0 - 1.6]);
  cave.pool = { x: cave.stopeA.x - sg * 30, y: cave.stopeA.y + 34, rx: 1.5 * T, ry: 0.85 * T };   // water has gathered in the first stope
  reachOf(cave); var U = tools(cave, R, o);
  // the fall of rock across the drift: two great stones, wall to wall; the pick takes either
  [-14, 15].forEach(function (dx, bi) { var hp = (o.rockHp || 11) * 3; cave.ores.push({ name: 'rockFormation', kind: 'stone', ore: false, block: true, cave: true, x: cave.block.x + sg * 4 * bi, y: cave.block.y + dx, s: 0.82, r: 17, v: bi, hp: hp, max: hp, leanDir: 1 }); });
  U.keep.push({ x: cave.block.x, y: cave.block.y, r: 70 });
  // the man who never came out, at the back of the deep stope: his pick, and what he had cut
  var mfy = U.footN(cave.deep.x + sg * 60, cave.deep.y) || (cave.deep.y - 60);
  cave.finds.push({ id: 'miner', prop: 'deadViking', x: cave.deep.x + sg * 60, y: mfy + 26, s: 1, v: 0, r: 0, say: 'Search', give: { copper: 3 }, thing: { kind: 'pick', mat: 'copper' }, note: 'A miner\'s pick, and the ore he had cut' });
  U.keep.push({ x: cave.finds[0].x, y: cave.finds[0].y, r: 46 });
  // where they set fires against the rock to crack it: soot up the wall, and charcoal still lying
  [[cave.stopeA.x + sg * 34, cave.stopeA.y], [cave.stopeB.x - sg * 44, cave.stopeB.y], [cave.deadEnd.x, cave.deadEnd.y - 20], [cave.deep.x - sg * 70, cave.deep.y - 20]].forEach(function (q, qi) {
    var fy = U.footN(q[0], q[1]); if (fy == null || !floor(cave, q[0], fy + 14)) return; cave.soot.push({ x: q[0], y: fy });
    cave.finds.push({ id: 'ash' + qi, prop: 'fireRing', x: q[0], y: fy + 15, s: 0.8, v: 0, r: 0, say: 'Take', give: { charcoal: qi === 3 ? 3 : 2 }, gone: true }); U.keep.push({ x: q[0], y: fy + 15, r: 34 });
  });
  // the veins: a few thin ones in the stopes and along the drift, the good ones past the fall
  [[cave.stopeA.x - sg * 46, cave.stopeA.y, 3], [cave.stopeB.x + sg * 30, cave.stopeB.y, 3], [cave.stopeB.x + sg * 96, cave.stopeB.y, 4], [ox + (x1 + sg * 4) * T, cave.junction.y, 2], [cave.deep.x - sg * 20, cave.deep.y, 5], [cave.deep.x + sg * 30, cave.deep.y, 6], [cave.deep.x + sg * 110, cave.deep.y, 5]].forEach(function (q) { var t; for (t = 0; t < 6; t++) if (U.vein(q[0] + (t ? jit(24) : 0), q[1], q[2])) break; });
  // timber: sets across the adit and the crosscuts, posts along the drift's far wall
  function setAt(x, y) { var a = U.across(x, y); if (a[1] - a[0] < 40 || a[1] - a[0] > 130) return; cave.sets.push({ x: (a[0] + a[1]) / 2, y: y, w: a[1] - a[0] - 5, s: Math.floor(R() * 99) }); }
  for (k = 0; k < 4; k++) setAt(cave.entrance.x, cave.entrance.y - 30 - k * 78);
  [[xA, y0, yA], [xB, y0, yB]].forEach(function (q) { var yy0 = oy + (q[1] - 2.4) * T, yy1 = oy + (q[2] + 3.6) * T, n = Math.max(1, Math.round((yy0 - yy1) / 84)), t; for (t = 0; t <= n; t++) setAt(ox + q[0] * T, yy0 + (yy1 - yy0) * t / n); });
  setAt(ox + xC * T, oy + (y0 + 3.2) * T);
  for (i = 2; i < 30; i++) { var px = cave.junction.x + sg * i * 86; if (sg * (px - cave.deep.x) > -150) break; if ([xA, xB, xC].some(function (xx) { return Math.abs(px - (ox + xx * T)) < 60; }) || Math.abs(px - cave.block.x) < 70) continue; var fy2 = U.footN(px, cave.junction.y + 6); if (fy2 != null && cave.junction.y - fy2 < 90) cave.posts.push({ x: px, y: fy2, s: Math.floor(R() * 99) }); }
  // loose ore where it was dropped, one hole in the roof over the big stope, a little water
  U.ore(cave.stopeA.x, cave.stopeA.y, 80, 50); U.ore(cave.deadEnd.x, cave.deadEnd.y, 60, 44); U.ore(cave.deep.x, cave.deep.y, 130, 90); U.ore(cave.deep.x, cave.deep.y, 130, 90);
  cave.shafts.push({ x: cave.stopeB.x, y: cave.stopeB.y + 10, rx: 50, ry: 34, k: 0.8 });
  cave.things = [{ kind: 'ladder', x: cave.stopeB.x - sg * 96, y: U.footN(cave.stopeB.x - sg * 96, cave.stopeB.y) }, { kind: 'bucket', x: cave.stopeA.x + sg * 70, y: cave.stopeA.y + 30 }, { kind: 'sledge', x: cave.junction.x + sg * 60, y: cave.junction.y + 22 }, { kind: 'bucket', x: cave.deep.x - sg * 40, y: cave.deep.y + 60 }].filter(function (q) { return q.y != null && floor(cave, q.x, q.y + 6); });
  for (i = 0; i < 80 && cave.puddles.length < 6; i++) { var ux2 = cave.pool.x + jit(150), uy2 = cave.pool.y + jit(90); if (!U.clearAt(ux2, uy2, 14, 0) || Math.hypot((ux2 - cave.pool.x) / (cave.pool.rx + 12), (uy2 - cave.pool.y) / (cave.pool.ry + 12)) < 1 || cave.puddles.some(function (q) { return Math.hypot(q.x - ux2, q.y - uy2) < 44; })) continue; cave.puddles.push({ x: ux2, y: uy2, rx: 6 + R() * 7, ry: 3.5 + R() * 3, a: jit(0.3) }); }
  return cave;
}
function makeCrypt(seed, o) {
  if (o.rank >= 1) return makeCatacomb(seed, o);
  return makeChapelCrypt(seed, o);
}
/* THE CATACOMBS (the village session's interiors plan, section 7; Robin, 2026-10-22: "Yes"): a crypt grows with its church. A
   chapel's is as it was (the stair, a passage, one vault). A town's church (rank 1: wealth 0.5 and up) has the stair down, then
   the OSSUARY, a long passage with the bones of the old dead in niches along its wall, side passages off it blocked by a fall of
   masonry that the pick clears (a chest behind one in three, at least one), two CHAMBERS round a PILLAR (the loop: you can go
   round it either way), the RELIC VAULT north of them behind an iron GATE (the priest's keys open it, or the axe breaks it), and
   a second way out: a ladder up to a slab in the churchyard, under a grave with no name. A great town's cathedral (rank 2) has
   two loops joined, five side passages, the bishop's vault behind TWO gates, and the well's shaft up into the market's well.
   The coffins open (bones, now and then a silver ring). One way in, the loops near the end. The game makes the gates, the keys
   and the ways out work; this lays them out (cave.gates, cave.exits, cave.niches). The numbers mine. */
function makeCatacomb(seed, o) {
  var rank = o.rank, R = rng(seed * 61 + 23 + rank * 7), flip = hash(seed, 7, 11) < 0.5, sg = flip ? -1 : 1, TX = flip ? GW - 8 : 8, shapes = [], holes = [], i, k;
  function jit(a) { return (R() - 0.5) * 2 * a; }
  function X(c) { return TX + sg * c; }                    // a column counted from the stair toward the far side
  function box(x, y, hw, hh) { shapes.push({ box: 1, x: x, y: y, hw: hw, hh: hh }); } function oval(x, y, rx, ry) { shapes.push({ x: x, y: y, rx: rx, ry: ry || rx }); }
  var yO = 25.0, yC = 20.6, yA = yC + 4.2, yB = yC - 4.2, loops = rank >= 2 ? [33 + Math.round(jit(1.5)), 51 + Math.round(jit(1.5))] : [30 + Math.round(jit(3))], xA = loops[0] - 5.1,   /* (the studio's prototype: the ossuary half as long again, by the seed) */ vc = loops[loops.length - 1];
  box(TX, 34, 1.2, 6.2);                                                  // the stair down, straight from the trapdoor
  box(TX, 27.0, 1.1, 2.2);                                                // its foot, north to the ossuary
  box(X(xA / 2), yO, xA / 2 + 0.6, 1.2);                                  // the ossuary
  loops.forEach(function (c) { box(X(c), yC, 4.6, 6.2); holes.push({ x: X(c), y: yC, hw: 2.1, hh: 1.9 }); oval(X(c), yA, 5.1, 2.5); oval(X(c), yB, 5.1, 2.5); });   // two chambers round a pillar, joined either side of it
  if (rank >= 2) box(X((loops[0] + loops[1]) / 2), yB, (loops[1] - loops[0]) / 2 - 4.0, 1.15);   // the first loop's north chamber to the second's
  // the side passages, blocked: north and south of the ossuary by turns, each to an alcove
  var nSide = rank >= 2 ? 5 : 3, side = [];
  for (i = 0; i < nSide; i++) { var col = 4.5 + (xA - 7) * (nSide > 1 ? i / (nSide - 1) : 0.5) + jit(0.4), dn = i % 2 ? 1 : -1; side.push({ c: col, dn: dn }); box(X(col), yO + dn * 2.6, 0.95, 1.6); oval(X(col), yO + dn * 5.0, 2.0, 1.4); }
  // THE NEW ROOMS (the studio's prototype, 2026-10-22; Robin: the caves' thinking for the catacombs): a bone hall north of the ossuary
  // with pillars of the old dead, a burial pit south of it falling away into the dark with planks across it, and a small chapel by the
  // stair's foot with its altar. Where along the ossuary each stands is the seed's, clear of the side passages.
  function clearCol(c0, dn) { return side.every(function (q) { return Math.abs(q.c - c0) > 3.4 || q.dn !== dn; }) && c0 > 4 && c0 < xA - 3; }
  var cB = null, cP = null, t9;
  for (t9 = 0; t9 < 40 && cB == null; t9++) { var c1 = 5 + R() * (xA - 9); if (clearCol(c1, -1)) cB = c1; }
  for (t9 = 0; t9 < 40 && cP == null; t9++) { var c2 = 10 + R() * (xA - 14);   /* (clear of the stair and its chapel) */ if (clearCol(c2, 1) && (cB == null || Math.abs(c2 - cB) > 3)) cP = c2; }
  var hallBn = cB != null ? { x: X(cB), y: yO - 10.2 } : null, pitRm = cP != null ? { x: X(cP), y: yO + 9.8 } : null,   /* (beyond the alcoves' reach: at 7.6 and 7.4 the hall and the pit met the alcoves and went round their falls of masonry, 2026-10-22) */ chapelRm = { x: TX + sg * 3.6, y: 30.2 };
  if (hallBn) { box(hallBn.x, yO - 4.6, 1.0, 4.1); oval(hallBn.x, hallBn.y, 5.6, 3.2); }
  if (pitRm) { box(pitRm.x, yO + 4.4, 1.0, 3.9); oval(pitRm.x, pitRm.y, 5.2, 3.0); }
  box((TX + chapelRm.x) / 2, chapelRm.y, Math.abs(chapelRm.x - TX) / 2, 0.9); oval(chapelRm.x, chapelRm.y - 0.3, 2.5, 1.9);
  var pits = pitRm ? [{ x: pitRm.x, y: pitRm.y, hw: 2.3, hh: 1.4 }] : [];
  // the vault (and the cathedral's antechamber), north of the last loop behind its gate or gates
  var gateY = [], yV;
  if (rank >= 2) { box(X(vc), yB - 3.8, 1.0, 1.7); oval(X(vc), yB - 6.8, 3.0, 1.4); box(X(vc), yB - 9.0, 0.95, 1.2); yV = yB - 11.3; oval(X(vc), yV, 4.8, 1.8); gateY = [yB - 3.85, yB - 8.85]; }
  else { box(X(vc), yB - 4.0, 1.0, 1.7); yV = yB - 8.0; oval(X(vc), yV, 4.4, 2.4); gateY = [yB - 4.1]; }
  // the second way out: a little room off the first loop's south chamber with a ladder up to the churchyard; the cathedral's well room off the last loop's
  var slabC = rank >= 2 ? loops[0] + 9.2 : loops[0] + 10.6, slabY = yA - 0.3, wellC = rank >= 2 ? loops[1] + 11 : null;
  box(X((loops[0] + 5 + slabC - 1.6) / 2), yA, (slabC - 1.6 - loops[0] - 5) / 2 + 0.8, 1.0); oval(X(slabC), slabY, rank >= 2 ? 1.9 : 2.1, 1.8);
  if (wellC != null) { box(X((loops[1] + 5 + wellC - 2) / 2), yA, (wellC - 2 - loops[1] - 5) / 2 + 0.8, 1.0); oval(X(wellC), yA - 0.4, 2.6, 2.2); }
  var path = [[TX, 33.4], [TX, 30], [TX, yO], [X(xA), yO], [X(loops[0] - 3.4), yC], [X(loops[0]), yB]].concat(rank >= 2 ? [[X(loops[1]), yB]] : []).concat([[X(vc), yV]]);
  var cave = base(seed, o, { kind: 'crypt', shapes: shapes, holes: holes, pits: pits, rough: 0.22, TX: TX, tunW: 1.3, path: path, trail: false, flip: flip, salt: 70 + rank, tintF: [0.92, 0.92, 0.98], tintW: [0.86, 0.86, 0.94] });
  var ox = cave.ox, oy = cave.oy; function W(p) { return { x: ox + p[0] * T, y: oy + p[1] * T }; }
  cave.name = rank >= 2 ? 'The catacombs' : 'The crypt'; cave.rank = rank; cave.vault = W([X(vc), yV]); cave.niche = cave.vault; cave.gates = []; cave.exits = []; cave.niches = [];
  cave.loops = loops.map(function (c) { return { a: W([X(c), yA]), b: W([X(c), yB]), pillar: W([X(c), yC]) }; }); cave.alcoves = side.map(function (q) { return W([X(q.c), yO + q.dn * 5.0]); });
  reachOf(cave); var U = tools(cave, R, o);
  function prop(name, x, y, r, v, extra) { var q = { name: name, x: x, y: y, s: 1, r: r || 0, v: v || 0, cave: true }; for (var kk in extra || {}) q[kk] = extra[kk]; cave.props.push(q); U.keep.push({ x: x, y: y, r: 34 }); return q; }
  var cn = 0;
  function coffin(x, y, stone) { cave.finds.push({ id: 'coffin' + (cn++), prop: stone ? 'coffinStone' : 'coffinWood', x: x, y: y, s: 1, v: cn, r: 12, say: 'Open the coffin', coffin: true, ring: R() < 0.22 ? 3 + Math.floor(R() * 4) : 0 }); U.keep.push({ x: x, y: y, r: 40 }); }
  prop('cryptStairs', cave.entrance.x, cave.entrance.y - 6, 0, 0, { flat: true });
  // the ossuary: niches with the bones of the old dead along its north wall (painted, penCrypt), long bones heaped along its south side
  var skip = side.map(function (q) { return X(q.c) * T + ox; });
  for (k = 1.6; k < xA - 0.6; k += 1.45) { var nx = ox + X(k) * T + jit(4); if (skip.some(function (sx) { return Math.abs(sx - nx) < 50; })) continue; var fy = U.footN(nx, oy + yO * T); if (fy == null) continue; var solid = true, h; for (h = 4; h <= 44; h += 4) if (dAt(cave, nx, fy - h) >= 0) solid = false; if (solid) cave.niches.push({ x: nx, y: fy, s: Math.floor(R() * 999) }); }
  for (k = 0; k < 3 + rank; k++) { var bx = ox + X(2 + (xA - 3) * (k + 0.5) / (3 + rank)) * T + jit(14), by = oy + (yO + 0.75) * T; if (U.clearAt(bx, by, 6, 0)) prop('bones', bx, by, 0, k % 2, { flat: true }); }
  // the falls of masonry across the side passages (the pick takes them, two stones each, as the mine's fall of rock), and what lies behind
  var withChest = side.map(function () { return R() < 1 / 3; }); if (!withChest.some(Boolean)) withChest[Math.floor(R() * side.length)] = true;
  side.forEach(function (q, si) { var px = ox + X(q.c) * T, py = oy + (yO + q.dn * 2.35) * T, hp = (o.rockHp || 11) * 2.2;
    [-15, 15].forEach(function (dx, bi) { cave.ores.push({ name: o.fallName || 'rockFormation', kind: 'stone', ore: false, block: true, masonry: true, cave: true, x: px + dx, y: py + (bi ? 4 : -3), s: 0.8, r: 17, v: (si + bi) % 3, hp: hp, max: hp, leanDir: 1 }); });
    U.keep.push({ x: px, y: py, r: 60 });
    var al = cave.alcoves[si], ay = al.y + (q.dn < 0 ? -8 : 10);
    if (withChest[si]) { cave.finds.push({ id: 'cache' + si, prop: 'chest', x: al.x + sg * 10, y: ay, s: 1, v: 0, r: 10, say: 'Open', give: { silver: 4 + rank * 3 + Math.floor(R() * 6) }, note: 'Hidden away down here' }); U.keep.push({ x: al.x, y: ay, r: 40 }); }
    else coffin(al.x, ay, R() < 0.4);
    prop('bones', al.x - sg * 30, al.y + 12, 0, si % 2, { flat: true });
  });
  // the chambers: coffins along their sides, niches on the pillar's south face
  cave.loops.forEach(function (L2, li) {
    coffin(L2.a.x - 1.6 * T, L2.a.y + 1.0 * T, true); coffin(L2.a.x + 1.6 * T, L2.a.y + 1.0 * T, R() < 0.5); coffin(L2.b.x - 1.6 * T, L2.b.y - 0.8 * T, R() < 0.5); coffin(L2.b.x + 1.6 * T, L2.b.y - 0.8 * T, true);
    [-1.2, 0, 1.2].forEach(function (dx) { var nx2 = L2.pillar.x + dx * T, fy2 = U.footN(nx2, L2.a.y); if (fy2 != null && fy2 > L2.pillar.y) cave.niches.push({ x: nx2, y: fy2, s: Math.floor(R() * 999) }); });
    prop('bones', L2.b.x + (li ? -1 : 1) * 0.8 * T, L2.b.y + 1.2 * T, 0, li % 2, { flat: true });
  });
  // the gates across the vault's passage: shut, opened with the priest's keys or broken by the axe (the game's)
  gateY.forEach(function (gy, gi) { var gx = ox + X(vc) * T, a = U.across(gx, oy + gy * T), wd = Math.max(40, Math.min(70, a[1] - a[0] - 2)); cave.gates.push({ id: gi, x: (a[0] + a[1]) / 2, y: oy + gy * T, w: wd, state: 'shut', hp: 14, max: 14 }); U.keep.push({ x: gx, y: oy + gy * T, r: 46 }); });
  // the vault: the reliquary over the chest with the silver, the coffins of the great
  cave.props.push({ name: 'reliquary', x: cave.vault.x, y: cave.vault.y - 0.8 * T, s: 1, r: 8, v: 0, cave: true });
  cave.chest = { name: 'heavyChest', x: cave.vault.x + sg * 0.3 * T, y: cave.vault.y + 0.35 * T, s: 1, r: 9, v: 0, cave: true }; cave.props.push(cave.chest);
  cave.hoard = { x: cave.chest.x, y: cave.chest.y, n: o.silver || 20, kind: 'silver', day: 0, relics: true };
  coffin(cave.vault.x - (rank >= 2 ? 3.4 : 3.0) * T, cave.vault.y + 0.2 * T, true); coffin(cave.vault.x + (rank >= 2 ? 3.4 : 3.0) * T, cave.vault.y + 0.2 * T, true);
  // the ways out: the ladder up to the churchyard's slab, and the cathedral's well
  function exit(id, c, y, say, light) { var x = ox + X(c) * T, fy = U.footN(x, oy + y * T) || (oy + (y - 1.5) * T); cave.props.push({ name: 'ladder', x: x, y: fy + 2, s: 1, r: 0, v: 0, cave: true }); cave.exits.push({ id: id, x: x, y: fy + 20, say: say }); cave.shafts.push({ x: x, y: fy + 18, rx: light[0], ry: light[1], k: light[2] }); U.keep.push({ x: x, y: fy + 20, r: 44 }); }
  exit('slab', slabC, slabY, 'Climb up', [22, 14, 0.3]);
  if (wellC != null) { exit('well', wellC, yA - 0.4, 'Climb the well', [34, 24, 0.75]); cave.props.push({ name: 'bucket', x: ox + X(wellC) * T + sg * 26, y: oy + (yA + 0.4) * T, s: 1, r: 0, v: 0, cave: true }); }
  cryptDress(cave, R, U, { ossuary: { x0: ox + Math.min(X(1), X(xA)) * T, x1: ox + Math.max(X(1), X(xA)) * T, y: oy + yO * T }, hall: hallBn && W([hallBn.x, hallBn.y]), pit: pitRm && W([pitRm.x, pitRm.y]), pitHW: 2.3 * T, chapel: W([chapelRm.x, chapelRm.y]), sg: sg });
  return cave;
}
/* THE CRYPTS' DRESSING AND LIGHT (the studio's prototype, 2026-10-22): what the catacombs had not, as set pieces from the crypt kit
   (assets/props/cryptkit): pilasters with vault ribs along the ossuary's north wall so it reads as a long vault, candles left burning
   at intervals (receding lights down the gallery), the chapel's altar, pillars of skulls in the bone hall, skulls heaped in corners,
   planks across the burial pit, and cold daylight through grates from the churchyard. cave.dress, cave.candles, cave.bridges. */
function cryptDress(cave, R, U, o) {
  cave.dress = cave.dress || []; cave.candles = []; cave.bridges = cave.bridges || [];
  function put(name, x, y, r, v) { cave.dress.push({ name: name, x: x, y: y, r: r || 0, v: v || 0, cave: true }); }
  var os = o.ossuary, x, k = 0;
  if (os) for (x = os.x0 + 40; x < os.x1 - 30; x += 96, k++) {                                       // the pilasters along the north wall, a candle now and then between them
    var fy = U.footN(x, os.y); if (fy != null && Math.abs(fy - (os.y - 40)) < 40) put('cryptArch', x, fy + 3, 0, 0);
    if (k % 2 === 1) { var cy = R() < 0.5 ? (fy != null ? fy + 10 : os.y - 20) : os.y + 26, cx = x + 48; if (Cave_floorish(cave, cx, cy)) { put('candles', cx, cy, 0, Math.floor(R() * 3)); cave.candles.push({ x: cx, y: cy, r: 52 + R() * 12, ph: R() * 9 }); } }
    if (k % 3 === 1) cave.shafts.push({ x: x + 20, y: os.y, rx: 26, ry: 18, k: 0.42, grate: true });              // a grate in the roof: a thin cold light from the churchyard
  }
  if (o.hall) {                                                                                         // the bone hall: four pillars of skulls, a heap in a corner, a candle on a skull
    [[-2.6, -1.0], [2.6, -1.0], [-2.6, 1.2], [2.6, 1.2]].forEach(function (q) { put('bonePillar', o.hall.x + q[0] * 32, o.hall.y + q[1] * 32, 16, 0); });
    put('skullPile', o.hall.x + o.sg * 4.4 * 32, o.hall.y - 0.6 * 32, 18, 0); put('candles', o.hall.x, o.hall.y + 0.2 * 32, 0, 2); cave.candles.push({ x: o.hall.x, y: o.hall.y + 6, r: 70, ph: 3 });
    cave.shafts.push({ x: o.hall.x, y: o.hall.y - 10, rx: 40, ry: 26, k: 0.5, grate: true });
  }
  if (o.pit) {                                                                                          // the burial pit: planks across it, a candle at its lip, skulls at the edge
    var hw = o.pitHW + 30; cave.bridges.push({ x0: o.pit.x - hw, x1: o.pit.x + hw, y: o.pit.y, w: 34 }); cave.deeps = [{ x: o.pit.x, y: o.pit.y, rx: o.pitHW, ry: 1.4 * 32 }];   // the pit has its own faint light from below
    for (x = o.pit.x - hw; x < o.pit.x + hw; x += 32) put('plankBridge', x + 16, o.pit.y, 0, 0);
    put('candles', o.pit.x - o.sg * (hw + 26), o.pit.y - 30, 0, 1); cave.candles.push({ x: o.pit.x - o.sg * (hw + 26), y: o.pit.y - 30, r: 60, ph: 5 });
    put('skullPile', o.pit.x + o.sg * (hw + 34), o.pit.y + 26, 18, 0);
  }
  if (o.chapel) { put('altar', o.chapel.x, o.chapel.y - 18, 20, 0); cave.candles.push({ x: o.chapel.x - 16, y: o.chapel.y - 20, r: 58, ph: 1 }, { x: o.chapel.x + 16, y: o.chapel.y - 20, r: 58, ph: 2 }); }
  if (cave.vault && !o.ossuary) { put('skullPile', cave.vault.x - o.sg * 70, cave.vault.y + 30, 16, 0); cave.shafts.push({ x: cave.vault.x, y: cave.vault.y - 6, rx: 30, ry: 20, k: 0.4, grate: true }); }   // the chapel crypt: a heap of the old dead, a grate over the vault
  if (cave.vault) { cave.candles.push({ x: cave.vault.x - 40, y: cave.vault.y - 10, r: 64, ph: 7 }, { x: cave.vault.x + 40, y: cave.vault.y - 10, r: 64, ph: 8 }); put('candles', cave.vault.x - 40, cave.vault.y - 10, 0, 0); put('candles', cave.vault.x + 40, cave.vault.y - 10, 0, 1); }
  (cave.alcoves || []).forEach(function (a, i) { if (i % 2 === 0) put('skullPile', a.x + (R() - 0.5) * 30, a.y + (R() < 0.5 ? -14 : 14), 16, 0); });
}
function Cave_floorish(cave, x, y) { return dAt(cave, x, y) >= 0 && pAt(cave, x, y) < -0.2; }
/* A HOUSE'S CELLAR (the studio's prototype, 2026-10-22; Robin: the caves' thinking for the cellars). Until now a cellar was only a
   hatch you looted; here it is a place under the floor. Dug, so its walls are straight: the stair down from the hatch, the stores room
   (shelves, casks, hams, roots, sacks, the household's chest), in a big house a second room through a low door; and in an old house
   one of two things: an old tunnel running off narrow and dark to a hidden way up (a way in or out the raid can use), or a crack in
   the floor where the earth gave way, falling into the dark, a cold breath coming up and now and then eyes down there.
   o: { old, big, loot }. The game makes the hatch lead here (the generator's cellarDoor). */
function makeCellar(seed, o) {
  var R = rng(seed * 43 + 5), flip = hash(seed, 5, 9) < 0.5, sg = flip ? -1 : 1, TX = flip ? GW - 8 : 8, shapes = [], pits = [];
  function jit(a) { return (R() - 0.5) * 2 * a; }
  function box(x, y, hw, hh) { shapes.push({ box: 1, x: x, y: y, hw: hw, hh: hh }); }
  var old = o.old != null ? o.old : R() < 0.5, big = o.big != null ? o.big : R() < 0.45;
  box(TX, 34, 1.0, 5.6); box(TX, 29.4, 0.9, 1.9);                                                       // the stair down from the hatch, its foot
  var r1 = { x: TX + sg * (2.4 + R()), y: 26.2 + jit(0.4), rx: 4.2 + R() * 1.2, ry: 2.7 + R() * 0.7 }; box(r1.x, r1.y, r1.rx, r1.ry);
  var r2 = null; if (big) { r2 = { x: r1.x + sg * (r1.rx + 4.0), y: r1.y - 0.6 + jit(0.8), rx: 3.2 + R() * 0.8, ry: 2.4 + R() * 0.4 }; box((r1.x + r2.x) / 2, r2.y, 2.4, 0.75); box(r2.x, r2.y, r2.rx, r2.ry); }
  var far = r2 || r1, tunnel = null, crack = null, path = [[TX, 33.4], [TX, 29], [r1.x, r1.y]].concat(r2 ? [[r2.x, r2.y]] : []);
  if (old && R() < 0.5) {                                                                                // the old tunnel: north out of the far room, then on, narrow, to a ladder up
    var tx0 = far.x + sg * far.rx * 0.5, ty0 = far.y - far.ry, ty1 = ty0 - 5 - R() * 3, tx1 = tx0 + sg * (6 + R() * 5);
    box(tx0, (ty0 + ty1) / 2, 0.7, (ty0 - ty1) / 2 + 0.4); box((tx0 + tx1) / 2, ty1, Math.abs(tx1 - tx0) / 2 + 0.4, 0.7); box(tx1, ty1 - 0.8, 1.2, 1.1);
    tunnel = { x: tx1, y: ty1 - 1.2 }; path.push([tx0, ty0], [tx0, ty1], [tx1, ty1]);
  } else if (old) {                                                                                      // the crack: where the floor gave way
    crack = { x: far.x + sg * Math.max(0, far.rx - 1.8), y: far.y + 0.3, hw: Math.min(1.2, far.rx * 0.28), hh: 0.42 }; pits.push(crack);   /* (at the far end of the far room: in the middle of a one-room cellar it lay between the stair and the stores' chest, 2026-10-22) */
  }
  var cave = base(seed, o, { kind: 'cellar', shapes: shapes, pits: pits, rough: 0.32, TX: TX, tunW: 1.0, path: path, trail: false, flip: flip, salt: 90, tintF: [1.08, 0.96, 0.84], tintW: [1.0, 0.93, 0.86] });
  var ox = cave.ox, oy = cave.oy; function W(p) { return { x: ox + p[0] * T, y: oy + p[1] * T }; }
  cave.name = 'The cellar'; cave.rooms = [W([r1.x, r1.y])].concat(r2 ? [W([r2.x, r2.y])] : []); cave.exits = []; cave.gates = []; cave.niches = [];
  reachOf(cave); var U = tools(cave, R, o);
  cave.dress = []; cave.candles = []; cave.eyes = [];
  function put(name, x, y, r, v) { cave.dress.push({ name: name, x: x, y: y, r: r || 0, v: v || 0, cave: true }); }
  function wall(x, y) { return U.footN(x, y); }
  cave.props.push({ name: 'cryptStairs', x: cave.entrance.x, y: cave.entrance.y - 6, s: 1, r: 0, v: 0, cave: true, flat: true });
  cave.shafts.push({ x: cave.entrance.x, y: cave.entrance.y + 10, rx: 30, ry: 20, k: 0.7, grate: true });   // the light down the stair from the open hatch
  // the stores: along the north wall of the first room shelves and casks, the hams on their beam, roots and sacks, the chest
  var R1 = cave.rooms[0], rw = r1.rx * T, x0 = R1.x - rw + 30, x1 = R1.x + rw - 30, order = ['shelf', 'caskRack', 'hangingHams', 'shelf', 'rootBin'].sort(function () { return R() - 0.5; }), k = 0, x;
  for (x = x0; x < x1 && k < order.length; x += 54, k++) { var fy = wall(x, R1.y); if (fy == null) continue; put(order[k], x, fy + (order[k] === 'hangingHams' ? 22 : 8), order[k] === 'hangingHams' ? 0 : 16, k); }
  put('barrel', R1.x - sg * (rw - 26), R1.y + r1.ry * T - 26, 12, 0); put('crate', R1.x - sg * (rw - 64), R1.y + r1.ry * T - 22, 12, 0); put('sackPile', R1.x + sg * (rw - 40), R1.y + r1.ry * T - 26, 14, 0);
  cave.finds.push({ id: 'store', prop: 'chest', x: R1.x + sg * 30, y: R1.y + 18, s: 1, v: 0, r: 10, say: 'Open', give: o.loot || { meat: 2, berries: 3 }, note: 'The household\'s stores' });
  var cl = R1.x + sg * (rw - 30), cy = (wall(cl, R1.y) || R1.y - 30) + 10; cave.candles.push({ x: cl, y: cy, r: 54, ph: 2 }); put('candles', cl, cy + 2, 0, 1);   // a tallow candle on a shelf's end
  var mx = R1.x - sg * rw * 0.25, my = (wall(mx, R1.y) || R1.y - 30) + 14; cave.candles.push({ x: mx, y: my, r: 70, ph: 4 }); put('candles', mx, my + 4, 0, 0);   // and one by the stores, so you see what is kept
  if (r2) { var c2x = cave.rooms[1].x, c2y = (wall(c2x, cave.rooms[1].y) || cave.rooms[1].y - 30) + 14; cave.candles.push({ x: c2x + sg * 30, y: c2y, r: 60, ph: 6 }); put('candles', c2x + sg * 30, c2y + 4, 0, 2); }
  if (r2) { var R2 = cave.rooms[1], fy2 = wall(R2.x, R2.y); if (fy2 != null) put('caskRack', R2.x - sg * 20, fy2 + 8, 16, 1); put('barrel', R2.x + sg * (r2.rx * T - 30), R2.y + r2.ry * T - 24, 12, 1); put('crate', R2.x + sg * (r2.rx * T - 64), R2.y - 8, 12, 1); }
  if (tunnel) { var tw2 = W([tunnel.x, tunnel.y]), fyt = wall(tw2.x, tw2.y + 20) || tw2.y; cave.props.push({ name: 'ladder', x: tw2.x, y: fyt + 2, s: 1, r: 0, v: 0, cave: true }); cave.exits.push({ id: 'tunnel', x: tw2.x, y: fyt + 20, say: 'Climb up' }); cave.shafts.push({ x: tw2.x, y: fyt + 18, rx: 18, ry: 12, k: 0.25, grate: true }); cave.secret = 'tunnel'; }
  if (crack) { var cw = W([crack.x, crack.y]); cave.deeps = [{ x: cw.x, y: cw.y, rx: crack.hw * T, ry: crack.hh * T * 2.4 }]; if (R() < 0.6) cave.eyes.push({ x: cw.x + (R() - 0.5) * 30, y: cw.y + 14, ph: R() * 9, deep: true }); cave.secret = 'crack'; }
  return cave;
}
function makeChapelCrypt(seed, o) {                      // a crypt under a church (raid step 8, 2026-10-21; Robin: "room for exploration, churches can have cellars, crypts"): the stair down from the trapdoor, a passage north, the vault with its coffins, and a niche where the reliquary stands over the silver
  var R = rng(seed * 61 + 23), flip = hash(seed, 7, 11) < 0.5, sg = flip ? -1 : 1, TX = flip ? GW - 8 : 8, shapes = [];
  function jit(a) { return (R() - 0.5) * 2 * a; }
  function box(x, y, hw, hh) { shapes.push({ box: 1, x: x, y: y, hw: hw, hh: hh }); } function oval(x, y, rx, ry) { shapes.push({ x: x, y: y, rx: rx, ry: ry || rx }); }
  var yV = 24 + jit(0.6), xN = TX + sg * (7.5 + jit(0.8));
  box(TX, 34, 1.2, 6.2);                                                  // the stair down, straight from the trapdoor
  box(TX, (yV + 28) / 2, 1.1, (28 - yV) / 2 + 0.6);                       // the passage north
  oval(TX + sg * 1.2, yV, 4.4, 2.6);                                      // the vault
  box((TX + xN) / 2, yV, Math.abs(xN - TX) / 2 + 0.5, 1.0); oval(xN, yV - 1.0, 2.4, 1.9);   // a passage to the niche
  var path = [[TX, 33.4], [TX, 30], [TX, yV + 0.5], [xN, yV]];
  var cave = base(seed, o, { kind: 'crypt', shapes: shapes, rough: 0.25, TX: TX, tunW: 1.3, path: path, trail: false, flip: flip, salt: 70, tintF: [0.92, 0.92, 0.98], tintW: [0.86, 0.86, 0.94] });
  var ox = cave.ox, oy = cave.oy; function W(p) { return { x: ox + p[0] * T, y: oy + p[1] * T }; }
  cave.name = 'The crypt'; cave.vault = W([TX + sg * 1.2, yV]); cave.niche = W([xN, yV - 1.0]);
  reachOf(cave);
  cave.props.push({ name: 'cryptStairs', x: cave.entrance.x, y: cave.entrance.y - 6, s: 1, r: 0, v: 0, cave: true, flat: true });
  var RC = rng(seed * 67 + 3); cave.gates = []; cave.exits = []; cave.niches = []; cave.rank = 0;
  [[-2.6, -1.2, 'coffinStone'], [2.6, -1.2, 'coffinStone'], [-2.4, 1.3, 'coffinWood'], [2.2, 1.3, 'coffinWood']].forEach(function (q, i) { cave.finds.push({ id: 'coffin' + i, prop: q[2], x: cave.vault.x + q[0] * T, y: cave.vault.y + q[1] * T, s: 1, r: 12, v: i, say: 'Open the coffin', coffin: true, ring: RC() < 0.22 ? 3 + Math.floor(RC() * 4) : 0 }); });   /* (the coffins open: the catacombs' rule, 2026-10-22) */
  cave.props.push({ name: 'bones', x: cave.vault.x + 0.5 * T, y: cave.vault.y + 2.0 * T, s: 1, r: 0, v: 0, cave: true, flat: true }); cave.props.push({ name: 'bones', x: cave.niche.x - sg * 1.3 * T, y: cave.niche.y + 1.1 * T, s: 1, r: 0, v: 1, cave: true, flat: true });
  cave.props.push({ name: 'reliquary', x: cave.niche.x, y: cave.niche.y - 0.6 * T, s: 1, r: 8, v: 0, cave: true });
  cave.chest = { name: 'heavyChest', x: cave.niche.x + sg * 0.2 * T, y: cave.niche.y + 0.5 * T, s: 1, r: 9, v: 0, cave: true }; cave.props.push(cave.chest);
  cave.hoard = { x: cave.chest.x, y: cave.chest.y, n: o.silver || 20, kind: 'silver', day: 0, relics: true };   // the silver in the chest: E takes it (the game's relicsTake)
  cryptDress(cave, RC, tools(cave, RC, o), { ossuary: null, chapel: null, sg: sg });
  return cave;
}
function makeSea(seed, o) {
  var R = rng(seed * 71 + 29), flip = hash(seed, 7, 11) < 0.5, sg = flip ? -1 : 1, TX = flip ? GW - 10 : 10, i;
  function jit(a) { return (R() - 0.5) * 2 * a; }
  var hall = [TX + sg * (10 + jit(0.8)), 20.6 + jit(0.5)], pk = [TX + sg * (27 + jit(1)), 10.6 + jit(0.6)], shapes = [];
  function oval(x, y, rx, ry) { shapes.push({ x: x, y: y, rx: rx, ry: ry || rx }); }
  for (i = 0; i <= 16; i++) oval(TX + Math.sin(i * 0.7) * 0.3, 41 - i * 0.9, 2.5 + 0.3 * Math.sin(i * 1.1), 2.2);      // the channel in from the sea
  oval(TX + sg * 2.6, 24.6, 4.8, 4.0); oval(hall[0], hall[1], 11.6, 7.4); oval(hall[0] + sg * 7, hall[1] + 3.6, 5.2, 3.8);  // the hall, and a lobe of it that is all water
  var p0 = [hall[0] + sg * 7.4, hall[1] - 5.4], n = 10; for (i = 0; i <= n; i++) { var t = i / n; oval(p0[0] + (pk[0] - p0[0]) * t + Math.sin(t * 5) * 0.8, p0[1] + (pk[1] - p0[1]) * t, 1.9, 1.8); }   // the passage up from the beach
  oval(pk[0], pk[1], 3.8, 2.9);                                                                                            // the dry pocket
  var shoreY = function (tx) { return hall[1] - 1.5 + 1.1 * Math.sin(tx * 0.42 + seed) + 0.5 * Math.sin(tx * 1.1); };
  var sea = function (tx, ty) { return Math.min(1.5, (ty - shoreY(tx)) * 0.34); };
  var path = [[TX, 33.4], [TX, 28.5], [TX + sg * 3, 24], [hall[0] - sg * 2, hall[1] - 3.4], [hall[0] + sg * 4, hall[1] - 4.6], p0, [(p0[0] + pk[0]) / 2, (p0[1] + pk[1]) / 2], pk];
  var cave = base(seed, o, { kind: 'sea', shapes: shapes, rough: 1.2, TX: TX, tunW: 3.1, path: path, trail: false, flip: flip, salt: 80, sea: sea, tintF: [0.9, 0.98, 1.04], tintW: [0.84, 0.98, 1.03] });
  var ox = cave.ox, oy = cave.oy; function W(p) { return { x: ox + p[0] * T, y: oy + p[1] * T }; }
  cave.name = 'The sea cave'; cave.hall = W(hall); cave.pocket = W(pk); cave.beach = W([hall[0] - sg * 1, hall[1] - 4.2]);
  reachOf(cave); var U = tools(cave, R, o);
  // the wreck on the shingle under the hole in the roof; what the sea brought in round it; the chest somebody carried up to the dry pocket
  cave.wreck = { name: 'wreckedBoat', x: cave.beach.x, y: cave.beach.y, s: 0.9, r: 20, v: 0, cave: true }; cave.props.push(cave.wreck); U.keep.push({ x: cave.wreck.x, y: cave.wreck.y, r: 80 });
  cave.shafts.push({ x: cave.beach.x + sg * 10, y: cave.beach.y + 16, rx: 78, ry: 50, k: 1 });
  cave.finds.push({ id: 'chest', prop: 'chest', x: cave.pocket.x + sg * 40, y: cave.pocket.y - 16, s: 1, v: 0, r: 12, say: 'Open', chest: true, note: 'Somebody hid this here, and never came back for it' }); U.keep.push({ x: cave.finds[0].x, y: cave.finds[0].y, r: 40 });
  for (i = 0; i < 60 && cave.finds.length < 5; i++) { var dx = cave.beach.x + jit(260), dy = cave.beach.y + jit(70) + 20; if (!U.clearAt(dx, dy, 16, 0) || sAt(cave, dx, dy) > -0.05) continue; cave.finds.push({ id: 'drift' + cave.finds.length, prop: 'drift', x: dx, y: dy, s: 0.9, v: Math.floor(R() * 3), r: 0, say: 'Take', give: { wood: 3 }, gone: true }); }
  U.stand(cave.beach.x, cave.beach.y - 20, 260, 60, 4); U.stand(cave.pocket.x, cave.pocket.y, 90, 60, 3);
  // the daylight over the water: it carries up the channel and into the hall
  [[TX, 31, 150, 0.5], [TX, 27, 130, 0.38], [TX + sg * 2.6, 24, 130, 0.3], [hall[0] - sg * 3, hall[1] + 1.5, 150, 0.2], [hall[0] + sg * 4, hall[1] + 2.5, 150, 0.13]].forEach(function (q) { var p = W(q); cave.glows.push({ x: p.x, y: p.y, r: q[2], a: q[3], sea: true }); });
  return cave;
}
function drawDrift(c, f) {                               // driftwood: a bleached bough the sea threw up, a stub of a branch on it
  var x = f.x, y = f.y * K, a = (hash(f.v, Math.round(f.x), 3) - 0.5) * 0.7, INK = 'rgba(22,16,14,0.95)';
  c.save(); c.translate(x, y); c.fillStyle = 'rgba(4,6,12,0.35)'; c.beginPath(); c.ellipse(2, 2, 19, 4, a * 0.4, 0, 7); c.fill(); c.rotate(a * 0.4); c.lineCap = 'round';
  [[INK, 7.2], ['#b9b2a2', 5.4]].forEach(function (q) { c.strokeStyle = q[0]; c.lineWidth = q[1]; c.beginPath(); c.moveTo(-17, 0); c.quadraticCurveTo(0, -3, 17, -1); c.stroke(); c.lineWidth = q[1] * 0.55; c.beginPath(); c.moveTo(4, -2); c.lineTo(10, -9); c.stroke(); });
  c.strokeStyle = '#dcd6c8'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-14, -1.6); c.quadraticCurveTo(0, -4.4, 14, -2.6); c.stroke(); c.strokeStyle = 'rgba(90,84,74,0.7)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-8, 0.6); c.lineTo(2, -0.4); c.moveTo(6, 0.4); c.lineTo(13, 0); c.stroke();
  c.restore();
}
function sAt(cave, x, y) { return cave.S ? fieldAt(cave.S, cave, x, y) : -9; }       // tiles of water over the floor (the sea cave): above zero you wade
function release(cave) { cave.px = null; cave.chunks = {}; cave.chunkN = 0; }          // the sheets are big: let them go when the cave is left
/* A timber set across a passage that runs north to south: two posts and a cap. It is drawn with the things that stand
   (the page sorts it by its line on the floor), so the cap passes over whoever has walked on through it. */
function drawSet(c, st) {
  var x = st.x, y = st.y * K, hw = st.w / 2, H = 44, INK = 'rgba(22,16,14,0.95)', k;
  function log(x0, y0, x1, y1, wd, col, lit) { c.lineCap = 'butt'; c.strokeStyle = INK; c.lineWidth = wd + 1.6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = wd; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = lit; c.lineWidth = wd * 0.28; var ox2 = x1 === x0 ? -wd * 0.22 : 0, oy2 = x1 === x0 ? 0 : -wd * 0.22; c.beginPath(); c.moveTo(x0 + ox2, y0 + oy2); c.lineTo(x1 + ox2, y1 + oy2); c.stroke(); }
  c.save();
  c.fillStyle = 'rgba(4,5,10,0.35)'; c.beginPath(); c.ellipse(x - hw + 2, y + 1, 6, 2.6, 0, 0, 7); c.ellipse(x + hw + 2, y + 1, 6, 2.6, 0, 0, 7); c.fill();
  log(x - hw, y, x - hw + 1.5, y - H, 6, '#6b4c33', '#93704c'); log(x + hw, y, x + hw - 1.5, y - H, 6, '#5d412c', '#7f5f41');
  var sag = 1.5 + hash(st.s, 1, 3) * 2; c.strokeStyle = INK; c.lineWidth = 8.6; c.lineCap = 'butt'; c.beginPath(); c.moveTo(x - hw - 6, y - H - 1); c.quadraticCurveTo(x, y - H - 1 + sag, x + hw + 6, y - H - 1); c.stroke();
  c.strokeStyle = '#5a3f2a'; c.lineWidth = 7; c.beginPath(); c.moveTo(x - hw - 5.2, y - H - 1); c.quadraticCurveTo(x, y - H - 1 + sag, x + hw + 5.2, y - H - 1); c.stroke();
  c.strokeStyle = '#8a6846'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - hw - 5, y - H - 3); c.quadraticCurveTo(x, y - H - 3 + sag, x + hw + 5, y - H - 3); c.stroke();
  c.strokeStyle = 'rgba(30,20,14,0.5)'; c.lineWidth = 0.6; for (k = 0; k < 3; k++) { var gx = x - hw + (k + 0.6) * st.w / 3.4 + hash(st.s, k, 5) * 6; c.beginPath(); c.moveTo(gx, y - H); c.lineTo(gx + 9 + hash(st.s, k, 6) * 8, y - H + 0.6); c.stroke(); }
  c.restore();
}

/* Each cave its own grid (2026-10-22, with Colin, AD's bigger troll's cave): the troll's cave 104 by 60 tiles, the mine, the sea
   cave, the crypts and the cellars 72 by 40 as they were laid out for. The module's grid numbers are set from the cave at every
   way in from the page (use), so everything inside works on the cave it was given. */
function setDims(gw, gh) { GW = gw; GH = gh; FW = GW * T / FS; FH = GH * T / FS; PW = GW * T; PH = Math.round(GH * T * K); SW = PW / SEEN; SH = GH * T / SEEN; }
function use(c) { if (c && c.GW && (c.GW !== GW || c.GH !== GH)) setDims(c.GW, c.GH); }
function inCave(f, i) { return function () { use(arguments[i || 0]); return f.apply(null, arguments); }; }   // (i: which argument is the cave)
function make(seed, o) { o = o || {}; var big = !o.kind || o.kind === 'troll'; setDims(big ? 104 : (o.kind === 'crypt' && o.rank >= 2 ? 80 : 72), big ? 60 : 40);   /* (a cathedral's catacombs 80 wide: the longer ossuary put its well room at the edge of 72) */ var c = make0(seed, o); c.GW = GW; c.GH = GH; return c; }
function make0(seed, o) {
  sheets();
  if (o.kind === 'mine') return makeMine(seed, o); if (o.kind === 'sea') return makeSea(seed, o); if (o.kind === 'crypt') return makeCrypt(seed, o); if (o.kind === 'cellar') return makeCellar(seed, o);
  var ox = o.x || 0, oy = o.y || 0, R = rng(seed * 31 + 9), i, k, x, y;
  function jit(a) { return (R() - 0.5) * 2 * a; }
  // the way through: the tunnel's head, the hall, then east to the lair
  /* THE LAYOUT (the studio's prototype, 2026-10-22; Robin: "larger and scarier ... look at the randomness and layouts ... depth, so
     that you feel like you're looking down an abyss"). Not one chain any more: the hall first and the lair last, and between them
     beats dealt from a deck, each its own size: a great cavern wider than the screen, an abyss crossed by a rope bridge, the pool,
     a grotto of glowing fungus, a hall of columns, a pit of bones before the lair. The way through snakes in two directions between
     them, tight squeezes between some. The names the rest of the cave uses (hall, fern, poolC, ledge, gal, lairC, pit, pockets)
     are given to the beats that play those parts. */
  var flip = hash(seed, 3, 7) < 0.5, sg = flip ? -1 : 1, TX = flip ? GW - 7 : 7, TY0 = GH - 6.6;
  var SIZE = { hall: [4.6, 3.6], cavern: [11.5, 8.0], abyss: [10.5, 7.4], pool: [5.6, 4.4], grotto: [5.0, 4.0], columns: [7.4, 5.6], bones: [4.6, 3.6], lair: [8.4, 6.8] };
  var middle = ['cavern', 'abyss', 'pool'].concat(['grotto', 'columns', 'hall'].sort(function () { return R() - 0.5; }).slice(0, 1 + Math.floor(R() * 2)));
  middle.sort(function () { return R() - 0.5; });
  if (middle[0] === 'abyss') { middle.push(middle.shift()); }                                         // (never the abyss straight after the hall)
  var kinds = ['hall'].concat(middle).concat(R() < 0.7 ? ['bones'] : []).concat(['lair']), beats = [], i, k, x, y;
  function fits(bx, by, rx, ry) { if (bx - rx < 2 || bx + rx > GW - 2 || by - ry < 3.4 || by + ry > TY0 - 0.6) return false; for (var b0 = 0; b0 < beats.length; b0++) { var o2 = beats[b0]; if (Math.hypot((bx - o2.x) / (rx + o2.rx + 2.2), (by - o2.y) / (ry + o2.ry + 2.2)) < 1) return false; } return true; }
  for (i = 0; i < kinds.length; i++) {
    var sz = SIZE[kinds[i]], rx = sz[0] * (0.88 + R() * 0.24), ry = sz[1] * (0.88 + R() * 0.24), placed = null;
    if (i === 0) placed = [TX + sg * (rx * 0.4), TY0 - ry - 0.4];
    else if (i === 1) { for (var t0 = 0; t0 < 60 && !placed; t0++) { var bx0 = beats[0].x + sg * (beats[0].rx + rx + 2 + R() * 3) * Math.cos(-0.9 + R() * 0.6), by0 = beats[0].y - (beats[0].ry + ry + 2 + R() * 3) * (0.6 + R() * 0.4); if (fits(bx0, by0, rx, ry)) placed = [bx0, by0]; } }   // the first beat climbs north from the hall, so the cave fills its height
    else {
      var prev = beats[i - 1];
      for (var tries = 0; tries < 80 && !placed; tries++) {                                             // heading east (west when flipped), swinging up or down
        var ang = (R() - 0.5) * (tries < 40 ? 2.6 : 3.8), gap = 2.6 + R() * 3.4 + (R() < 0.35 ? 3 : 0), dd = prev.rx + rx + gap;
        var bx = prev.x + sg * Math.cos(ang) * dd, by = prev.y + Math.sin(ang) * dd * 0.8; if (fits(bx, by, rx, ry)) placed = [bx, by];
      }
      if (!placed && i > 0) { rx *= 0.8; ry *= 0.8; for (var t2 = 0; t2 < 120 && !placed; t2++) { var bx2 = prev.x + sg * (prev.rx + rx + 2 + R() * 4), by2 = 4 + ry + R() * (TY0 - 5 - 2 * ry); if (fits(bx2, by2, rx, ry)) placed = [bx2, by2]; } }
      if (!placed) break;
    }
    beats.push({ kind: kinds[i], x: placed[0], y: placed[1], rx: rx, ry: ry, squeeze: i > 0 && R() < 0.4 });
  }
  if (beats[beats.length - 1].kind !== 'lair') beats[beats.length - 1].kind = 'lair';
  var circles = [], path = [], pts = [];
  function carve(cx, cy, rx, ry) { circles.push({ x: cx, y: cy, rx: rx, ry: ry || rx }); }
  function cr(a, b, c, d, t) { var t2 = t * t, t3 = t2 * t; return [0.5 * (2 * b[0] + (c[0] - a[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (3 * b[0] - a[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (c[1] - a[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (3 * b[1] - a[1] - 3 * c[1] + d[1]) * t3)]; }
  function beat(kind) { return beats.filter(function (b) { return b.kind === kind; })[0]; }
  var abyB = beat('abyss') || beats[Math.max(1, beats.length - 3)];
  var pit = { x: abyB.x + (R() - 0.5) * 1.6, y: abyB.y - abyB.ry * 0.7, rx: 4.6 + R() * 1.6, ry: 3.4, ext: abyB.ry * 1.6 };
  var bridge = { x0: pit.x - pit.rx - 1.1, x1: pit.x + pit.rx + 1.1, y: abyB.y, w: 1.15 };
  var WP = [[TX, TY0]], wide = [1.55];
  beats.forEach(function (b) {                                                                         // the way meets the abyss square on: through both ends of the bridge, from whichever side it comes
    if (b === abyB) { var bl = [bridge.x0 - 1.4, b.y], brr = [bridge.x1 + 1.4, b.y], pv = WP[WP.length - 1]; if (Math.abs(pv[0] - bl[0]) <= Math.abs(pv[0] - brr[0])) WP.push(bl, brr); else WP.push(brr, bl); wide.push(2.05, 2.05); }
    else { WP.push([b.x, b.y]); wide.push(b.squeeze ? 1.25 : 2.05); }
  });
  for (i = 0; i < WP.length - 1; i++) { var a = WP[Math.max(0, i - 1)], b = WP[i], c = WP[i + 1], d = WP[Math.min(WP.length - 1, i + 2)], n = Math.max(2, Math.round(Math.hypot(c[0] - b[0], c[1] - b[1]) * 2)), straight = (b[1] === c[1] && Math.abs(b[0] - c[0]) > 6); for (k = 0; k < n; k++) { var p = straight ? [b[0] + (c[0] - b[0]) * k / n, b[1]] : cr(a, b, c, d, k / n); p.w = wide[i + 1]; pts.push(p); } }   /* (over the bridge the way runs straight) */
  var lastP = WP[WP.length - 1].slice(); lastP.w = 2.05; pts.push(lastP);
  pts.forEach(function (p, j) { carve(p[0], p[1], p.w + 0.35 * Math.sin(j * 0.31 + seed), p.w + 0.3 * Math.sin(j * 0.23 + seed * 2)); if (j % 2 === 0) path.push({ x: p[0], y: p[1] }); });
  for (y = TY0; y <= GH + 1; y += 0.5) carve(TX + Math.sin(y * 0.9) * 0.2, y, 1.55, 1.55);              // the tunnel out, south to the daylight
  beats.forEach(function (b) {                                                                         // the chambers, a cluster of ovals so no wall is a plain ellipse
    carve(b.x, b.y, b.rx, b.ry); var nb = b.kind === 'cavern' ? 5 : 2;
    for (var q2 = 0; q2 < nb; q2++) { var aa = R() * Math.PI * 2; carve(b.x + Math.cos(aa) * b.rx * 0.55, b.y + Math.sin(aa) * b.ry * 0.5, b.rx * (0.45 + R() * 0.25), b.ry * (0.45 + R() * 0.25)); }
  });
  var hallB = beats[0], lairB = beats[beats.length - 1], poolB = beat('pool') || beats[Math.min(2, beats.length - 2)];
  var hall = [hallB.x, hallB.y], fern = [beats[1].x, beats[1].y], poolC = [poolB.x, poolB.y], lairC = [lairB.x, lairB.y], gal = [beats[beats.length - 2].x, beats[beats.length - 2].y];
  carve(lairC[0] + sg * (lairB.rx * 0.7), lairC[1] + 0.4, 2.3, 2.3);                                 // the nook behind the lair (the dead Viking)
  var pockets = [];
  function inTrench(x3, y3, m) { return Math.abs(x3 - pit.x) < pit.rx + m && y3 > pit.y - pit.ry - m && y3 < pit.y + pit.ext + pit.ry + m; }   // (near the abyss's trench, with a margin in tiles)
  function pocket(from, cx, cy, rx, ry) { cy = Math.max(cy, ry + 3.4); cy = Math.min(cy, TY0 - ry - 0.6); var q, nq = Math.ceil(Math.hypot(cx - from[0], cy - from[1]) / 1.2); for (q = 0; q <= nq; q++) carve(from[0] + (cx - from[0]) * q / nq, from[1] + (cy - from[1]) * q / nq, 1.85, 1.85); carve(cx, cy, rx, ry); pockets.push({ x: cx, y: cy, rx: rx, ry: ry }); }
  beats.slice(1, -1).forEach(function (b, bi) {                                                         // dead ends off some of them, away from the way through
    if (pockets.length >= 4 || b === abyB || (bi > 0 && R() < 0.4)) return; var up = b.y > GH / 2 ? -1 : 1, px0 = b.x + (R() - 0.5) * b.rx, py0 = b.y + up * (b.ry + 5.5 + R() * 2);
    if (py0 < 5 || py0 > TY0 - 4) return; var from0 = [b.x, b.y + up * b.ry * 0.6], crosses = false; for (var qq = 0; qq <= 10; qq++) if (inTrench(from0[0] + (px0 - from0[0]) * qq / 10, from0[1] + (py0 - from0[1]) * qq / 10, 4.2)) crosses = true;
    if (crosses) return; pocket([b.x, b.y + up * b.ry * 0.6], px0, py0, 3.2 + R() * 0.6, 2.6 + R() * 0.4);
  });
  while (pockets.length < 2) pocket(hall, hall[0] + sg * 3, Math.max(6, hall[1] - 9), 3.2, 2.7);
  // the abyss: a trench across its chamber from the north, falling away south; the way through crosses it on a rope bridge
  var ledge = [pit.x - sg * (pit.rx + 1.4), abyB.y - 1.2];                                             // where the way meets the lip, before the bridge
  // the fields
  var D = new Float32Array(FW * FH), P = new Float32Array(FW * FH), ns = seed * 7 + 3, j2, i2;
  var offB = pts.filter(function (p3) { return inTrench(p3[0], p3[1], 3) && !(Math.abs(p3[1] - bridge.y) < 1.3 && p3[0] > bridge.x0 - 1.6 && p3[0] < bridge.x1 + 1.6); });   // the way's points near the trench that are not the bridge's
  for (j2 = 0; j2 < FH; j2++) for (i2 = 0; i2 < FW; i2++) {
    var tx = (i2 + 0.5) * FS / T, ty = (j2 + 0.5) * FS / T, best = -9, ci;
    for (ci = 0; ci < circles.length; ci++) { var cc = circles[ci], ux = (tx - cc.x) / cc.rx, uy = (ty - cc.y) / cc.ry; if (ux > 2 || ux < -2 || uy > 2 || uy < -2) continue; var dd = (1 - Math.sqrt(ux * ux + uy * uy)) * Math.min(cc.rx, cc.ry); if (dd > best) best = dd; }
    best += (fbm(tx * 1.1, ty * 1.1, ns) - 0.5) * 1.3;
    var inTunnel = Math.abs(tx - TX) < 2.2 && ty > TY0 - 0.4, edge = Math.min(tx - 1.5, GW - 1.5 - tx, ty - 3.2, inTunnel ? 9 : GH - 1.2 - ty); if (edge < best) best = edge;
    D[j2 * FW + i2] = best;
    var px2 = (tx - pit.x) / pit.rx, py2 = ty > pit.y + pit.ext ? (ty - pit.y - pit.ext) / pit.ry : (ty > pit.y ? 0 : (ty - pit.y) / pit.ry); P[j2 * FW + i2] = (1 - Math.sqrt(px2 * px2 + py2 * py2)) * pit.ry + (fbm(tx * 0.9, ty * 0.9, ns + 5) - 0.5) * 1.0;
    if (P[j2 * FW + i2] > -1.5) for (var wq = 0; wq < offB.length; wq++) { var wp = offB[wq], dw = Math.hypot(tx - wp[0], ty - wp[1]) - wp.w - 0.9; if (dw < P[j2 * FW + i2]) P[j2 * FW + i2] = dw; }   /* (the way off the bridge keeps clear of the trench: seed 25's grazed its edge) */
  }
  var cave = { kind: 'troll', name: 'The cave', S: null, sets: [], posts: [], soot: [], finds: [], glows: [], tintF: null, tintW: null, tunW: 80, ox: ox, oy: oy, seed: seed, D: D, P: P, TR: null, chunks: {}, chunkN: 0, noiseT: 0, px: null, ores: [], veins: [], props: [], shafts: [], puddles: [], pockets: [], seen: new Uint8Array(SW * SH), seenDirty: true };
  function W(p) { return { x: ox + p[0] * T, y: oy + p[1] * T }; }
  cave.path = path.map(function (q) { return { x: ox + q.x * T, y: oy + q.y * T }; });     // the middle of the way through, a point a tile: the troll walks it home
  cave.entrance = W([TX, TY0 + 0.9]); cave.exitAt = W([TX, TY0 + 3.5]); cave.flip = flip; cave.tunnelY = oy + (TY0 + 1.8) * T;   // where you come in, where E takes you out, where the daylight begins
  cave.hall = W(hall); cave.fern = W(fern); cave.poolC = W(poolC); cave.ledge = W(ledge); cave.gallery = W(gal); cave.lair = W(lairC); cave.pit = { x: ox + pit.x * T, y: oy + pit.y * T, rx: pit.rx * T, ry: pit.ry * T, ext: pit.ext * T };
  cave.beats = beats.map(function (b) { return { kind: b.kind, x: ox + b.x * T, y: oy + b.y * T, rx: b.rx * T, ry: b.ry * T }; });
  cave.bridges = [{ x0: ox + bridge.x0 * T, x1: ox + bridge.x1 * T, y: oy + bridge.y * T, w: bridge.w * T }];   // the way over the abyss: walkable, the void under it
  cave.body = { name: 'deadViking', x: ox + (lairC[0] + sg * (lairB.rx * 0.7 + 0.6)) * T,   /* (in the nook wherever the lair's rolled size puts it: at a fixed 6.1 he lay in the rock of a small lair, seed 3) */ y: oy + (lairC[1] + 0.7) * T, s: 1, r: 0, v: 0, cave: true };   // the dead Viking with the bronze ring, in the nook behind the lair
  cave.hoard = { x: cave.lair.x + sg * 46, y: cave.lair.y + 30, n: 6, day: 1 };
  cave.pool = { x: ox + (poolC[0] + sg * 0.7) * T, y: oy + (poolC[1] + 2.5) * T, rx: 2.7 * T, ry: 1.7 * T };
  cave.pockets = pockets.map(function (q) { return { x: ox + q.x * T, y: oy + q.y * T, rx: q.rx * T, ry: q.ry * T }; });
  // how far every cell of floor is from the middle of the way through (the worn trail is painted from it)
  var TR = new Float32Array(FW * FH).fill(-9), cp = cave.path;
  for (j2 = 0; j2 < FH; j2++) for (i2 = 0; i2 < FW; i2++) {
    if (D[j2 * FW + i2] < -1.2) continue; var wx = ox + (i2 + 0.5) * FS, wy = oy + (j2 + 0.5) * FS, bd = 1e9;
    for (k = 0; k < cp.length - 1; k++) { var pa = cp[k], pb = cp[k + 1], ax = pb.x - pa.x, ay = pb.y - pa.y, tt = Math.max(0, Math.min(1, ((wx - pa.x) * ax + (wy - pa.y) * ay) / (ax * ax + ay * ay))), ds = Math.hypot(wx - pa.x - ax * tt, wy - pa.y - ay * tt); if (ds < bd) bd = ds; }
    var dt2 = Math.abs(wx - cave.entrance.x) < 30 && wy > cave.entrance.y - 40 ? Math.abs(wx - cave.entrance.x) : 1e9; TR[j2 * FW + i2] = Math.min(bd, dt2);   // and down the tunnel to the daylight
  }
  cave.TR = TR;
  // the holes in the roof: along the way through, a walk apart, so there is always a light ahead (none in the lair: he does not like it)
  function shaft(p, rx, ry, k2) { cave.shafts.push({ x: p.x, y: p.y, rx: rx, ry: ry, k: k2 }); }
  shaft(cave.fern, 66, 46, 1); shaft({ x: cave.pool.x - sg * 14, y: cave.pool.y - 10 }, 78, 52, 1); shaft({ x: cave.ledge.x + sg * 30, y: cave.ledge.y + 70 }, 74, 54, 1);
  var gq = cave.path[Math.floor(cave.path.length * 0.84)]; shaft({ x: gq.x, y: gq.y }, 46, 32, 0.75); shaft(cave.pockets[1], 40, 28, 0.65);
  var hq = cave.path[Math.floor(cave.path.length * 0.13)]; shaft({ x: hq.x, y: hq.y }, 42, 30, 0.7);
  // the copper veins: green streaks on the walls that look toward you, from the gallery on
  var WU = WALLH / K;
  for (i = 0; i < 200 && cave.veins.length < 9; i++) {
    var vt = (i < 90 || cave.veins.length >= 5 ? 0.6 : 0.3) + R() * (i < 90 || cave.veins.length >= 5 ? 0.34 : 0.64),   /* (then from a third of the way on: the great caverns' walls lie far from the way, seed 12 had three) */ vp = cave.path[Math.min(cave.path.length - 1, Math.floor(vt * cave.path.length))], vx = vp.x + (R() - 0.5) * 80, found = null, fh = 0;
    for (k = 0; k < 60; k++) { var yy = vp.y - k * 3; if (dAt(cave, vx, yy) < 0) { found = yy + 3; break; } }
    if (found == null) continue; for (k = 2; k <= WU; k += 2) { if (dAt(cave, vx, found - k) < 0) fh = k; else break; }
    if (fh < 34 || Math.hypot(vx - cave.lair.x, found - cave.lair.y) < 110) continue;
    if (cave.veins.some(function (q) { return Math.abs(q.x - vx) < 44; })) continue;
    cave.veins.push({ name: 'vein', kind: 'stone', vein: true, cave: true, x: vx, y: found, h: Math.min(fh, 46), s: Math.floor(R() * 7), r: 0, left: 5 + Math.floor(R() * 3), hp: (o.rockHp || 11) * 0.8, max: (o.rockHp || 11) * 0.8 });
  }
  // the floor you can walk to from the way in (a flood over the fields' cells): nothing is stood on a ledge the chasm cuts off
  var RC = new Uint8Array(FW * FH), st = [Math.floor((cave.entrance.y - oy) / FS) * FW + Math.floor((cave.entrance.x - ox) / FS)]; RC[st[0]] = 1;
  while (st.length) { var c0 = st.pop(), ci2 = c0 % FW, cj2 = (c0 - ci2) / FW, d4; for (d4 = 0; d4 < 4; d4++) { var na = ci2 + (d4 === 0 ? 1 : (d4 === 1 ? -1 : 0)), nb = cj2 + (d4 === 2 ? 1 : (d4 === 3 ? -1 : 0)); if (na < 0 || nb < 0 || na >= FW || nb >= FH || RC[nb * FW + na] || !floor(cave, ox + (na + 0.5) * FS, oy + (nb + 0.5) * FS)) continue; RC[nb * FW + na] = 1; st.push(nb * FW + na); } }
  cave.RC = RC;
  // what stands on the floor. Nothing on the trail, in the pool or the chasm, at the way in, on his bed or under the dead man
  function clearAt(px3, py3, room) {
    var a2; if (!floor(cave, px3, py3) || trailAt(cave, px3, py3) < 40 || !RC[Math.floor((py3 - oy) / FS) * FW + Math.floor((px3 - ox) / FS)]) return false;
    for (a2 = 0; a2 < 6; a2++) if (!floor(cave, px3 + Math.cos(a2 * 1.047) * room, py3 + Math.sin(a2 * 1.047) * room)) return false;
    if (Math.hypot((px3 - cave.pool.x) / (cave.pool.rx + 14), (py3 - cave.pool.y) / (cave.pool.ry + 14)) < 1) return false;
    if (Math.hypot(px3 - cave.entrance.x, py3 - cave.entrance.y) < 110 || Math.hypot(px3 - cave.hoard.x, py3 - cave.hoard.y) < 60 || Math.hypot(px3 - cave.body.x, py3 - cave.body.y) < 50 || Math.hypot(px3 - cave.lair.x, py3 - cave.lair.y) < 70) return false;
    return !cave.ores.concat(cave.props).some(function (q) { return Math.hypot(q.x - px3, q.y - py3) < 44; });
  }
  function ore(cx, cy, rx, ry) { var t2; for (t2 = 0; t2 < 30; t2++) { var ex = cx + (R() - 0.5) * 2 * rx, ey = cy + (R() - 0.5) * 2 * ry; if (!clearAt(ex, ey, 14)) continue; var s2 = 0.85 + R() * 0.3, hp = (o.rockHp || 11) * (0.7 + 0.6 * s2); cave.ores.push({ name: 'rock', kind: 'stone', ore: true, cave: true, x: ex, y: ey, s: s2, r: 8, v: Math.floor(R() * 3), hp: hp, max: hp, leanDir: 1 }); return; } }
  cave.pockets.forEach(function (q) { ore(q.x, q.y, q.rx * 0.7, q.ry * 0.7); ore(q.x, q.y, q.rx * 0.7, q.ry * 0.7); });
  ore(cave.hall.x + sg * 60, cave.hall.y - 20, 90, 70); ore(cave.fern.x, cave.fern.y, 110, 90);   // (two near the way in: the first thing the pick meets)
  for (var oq = 0; oq < 12 && cave.ores.length < 6; oq++) { var ob = beats[1 + Math.floor(R() * Math.max(1, beats.length - 2))]; ore(ox + ob.x * T, oy + ob.y * T, ob.rx * T * 0.6, ob.ry * T * 0.6); }   /* (at least six: the pockets are fewer in some layouts, seed 22 had five) */
  /* (the stand() cones of the troll's cave are gone: the studio's dressing below stands in their place, 2026-10-22) */
  // still water on the floor here and there, more of it where it is damp: round the pool and under the holes in the roof
  for (i = 0; i < 260 && cave.puddles.length < 22; i++) {
    var pq = cave.path[Math.floor(R() * cave.path.length)], ux2 = pq.x + (R() - 0.5) * 240, uy2 = pq.y + (R() - 0.5) * 200, damp = Math.hypot(ux2 - cave.pool.x, uy2 - cave.pool.y) < 260 || cave.shafts.some(function (s3) { return Math.hypot(ux2 - s3.x, uy2 - s3.y) < 130; });
    if (!damp && R() < 0.75) continue; if (!floor(cave, ux2, uy2) || !floor(cave, ux2 + 14, uy2) || !floor(cave, ux2 - 14, uy2) || !floor(cave, ux2, uy2 + 10) || trailAt(cave, ux2, uy2) < 22) continue;
    if (Math.hypot((ux2 - cave.pool.x) / (cave.pool.rx + 10), (uy2 - cave.pool.y) / (cave.pool.ry + 10)) < 1 || cave.puddles.some(function (q) { return Math.hypot(q.x - ux2, q.y - uy2) < 50; })) continue;
    cave.puddles.push({ x: ux2, y: uy2, rx: 7 + R() * 9, ry: 4 + R() * 4, a: (R() - 0.5) * 0.6 });
  }
  /* THE DRESSING (the studio's prototype, 2026-10-22): the things that give the cave its size and its fear, as set pieces from the
     studio's cave kit (assets/props/cavekit): columns that rise out of sight in the caverns, dripstone by the walls, the glowing fungus
     that shows the dark has an end, bones toward the lair and the troll's bed in it, the rope bridge over the abyss. cave.dress is
     what the page draws (name with its variant, x, y, r for the walk round it); cave.fungi are lights; cave.eyes are eyes in the dark.
     They replace the stand() cones (the drawn 'stalagmite' and 'caveColumn' props). */
  cave.dress = []; cave.fungi = []; cave.eyes = [];
  function free(x3, y3, r3, away) {
    if (!floor(cave, x3, y3) || !floor(cave, x3 + r3, y3) || !floor(cave, x3 - r3, y3) || !floor(cave, x3, y3 + r3 * 0.6) || !floor(cave, x3, y3 - r3 * 0.6)) return false;
    if (trailAt(cave, x3, y3) < (away || 30) || Math.hypot(x3 - cave.entrance.x, y3 - cave.entrance.y) < 130) return false;
    if (cave.bridges.some(function (b3) { return x3 > b3.x0 - 50 && x3 < b3.x1 + 50 && Math.abs(y3 - b3.y) < 60; })) return false;
    return !cave.dress.some(function (q3) { return Math.hypot(q3.x - x3, (q3.y - y3) * 1.3) < r3 + q3.r + 6; });
  }
  function put(name, x3, y3, r3, v3) { cave.dress.push({ name: name, x: x3, y: y3, r: r3, v: v3 || 0, cave: true }); }
  function scatter(b3, n3, name, r3, wallNear, away) {
    for (var t3 = 0; t3 < n3 * 40 && n3 > 0; t3++) {
      var a3 = R() * Math.PI * 2, d3 = Math.sqrt(R()), x3 = b3.x + Math.cos(a3) * b3.rx * d3, y3 = b3.y + Math.sin(a3) * b3.ry * d3, dw3 = dAt(cave, x3, y3);
      if (wallNear && dw3 > wallNear) continue; if (!free(x3, y3, r3, away)) continue; put(name, x3, y3, r3, Math.floor(R() * 3)); n3--;
    }
  }
  cave.beats.forEach(function (b3) {
    if (b3.kind === 'cavern') { scatter(b3, 6, 'column', 26, 0, 60); scatter(b3, 4, 'stalagmite', 20, 3.5, 40); scatter(b3, 3, 'fungus', 14, 2.4, 30); }
    else if (b3.kind === 'columns') { scatter(b3, 8, 'column', 24, 0, 44); scatter(b3, 2, 'stalagmite', 18, 3, 40); scatter(b3, 1, 'fungus', 14, 2.2, 30); }
    else if (b3.kind === 'grotto') scatter(b3, 9, 'fungus', 14, 3.2, 26);
    else if (b3.kind === 'bones') scatter(b3, 4, 'bonepile', 24, 0, 30);
    else if (b3.kind === 'lair') { var bx3 = b3.x + sg * b3.rx * 0.35, by3 = b3.y - b3.ry * 0.35; if (free(bx3, by3, 44, 30)) put('trollBed', bx3, by3, 44, 0); scatter(b3, 3, 'bonepile', 24, 0, 40); scatter(b3, 2, 'stalagmite', 18, 3, 40); }
    else if (b3.kind === 'abyss') scatter(b3, 2, 'stalagmite', 18, 3, 40);
    else { scatter(b3, 3, 'stalagmite', 18, 2.6, 40); scatter(b3, 1, 'fungus', 14, 2.2, 30); }
  });
  cave.pockets.forEach(function (q3) { if (R() < 0.6) scatter(q3, 2, 'fungus', 14, 0, 0); });
  cave.dress.filter(function (q3) { return q3.name === 'column'; }).forEach(function (q3, i3) {                 // fungus at the feet of some columns: they stand dark against its glow
    if (i3 % 2) return; var fx3 = q3.x + (R() < 0.5 ? -1 : 1) * (34 + R() * 10), fy3 = q3.y + 8 + R() * 10; if (free(fx3, fy3, 12, 20)) put('fungus', fx3, fy3, 12, Math.floor(R() * 3));
  });
  cave.beats.forEach(function (b3) { if (b3.kind === 'cavern' || b3.kind === 'columns') shaft({ x: b3.x + (R() - 0.5) * b3.rx * 0.6, y: b3.y + (R() - 0.5) * b3.ry * 0.4 }, 72, 50, 0.85); });   // daylight far down into the great rooms
  cave.fires = []; cave.beats.forEach(function (b3) { if (b3.kind !== 'lair') return; var bed = cave.dress.filter(function (q3) { return q3.name === 'trollBed'; })[0], fx4 = bed ? bed.x - sg * 70 : b3.x, fy4 = bed ? bed.y + 40 : b3.y; cave.fires.push({ x: fx4, y: fy4 }); });   // the troll's fire by his bed
  cave.bridges.forEach(function (b3) { for (var bx4 = b3.x0; bx4 < b3.x1; bx4 += 32) put('ropeBridge', bx4 + 16, b3.y, 0, 0); put('bridgePost', b3.x0 - 6, b3.y + 2, 0, 0); put('bridgePost', b3.x1 + 6, b3.y + 2, 0, 0); });
  cave.fungi = null; cave.fungi = cave.dress.filter(function (q3) { return q3.name === 'fungus'; }).map(function (q3, i3) { return { x: q3.x, y: q3.y, r: 64 + R() * 24, a: 0.5 + R() * 0.15, ph: i3 * 1.7 }; });
  cave.pockets.forEach(function (q3) { cave.eyes.push({ x: q3.x, y: q3.y - 6, ph: R() * 9 }); });                       // eyes in the dark: where you have not been
  cave.beats.forEach(function (b3) { if (b3.kind === 'cavern' || b3.kind === 'columns') cave.eyes.push({ x: b3.x - sg * b3.rx * 0.8, y: b3.y - b3.ry * 0.6, ph: R() * 9 }); });
  return cave;
}

/* The sheets (prepare): what every pixel of the cave is, and what stands over it. KD: 0 rock, 1 floor, 2 the chasm. For rock:
   A1 how far above a wall's foot it is, straight down (a wall that faces you), A2 and A3 the same down a lean (a wall that faces
   west, one that faces east). For the chasm: A1 how far below the floor's edge, A2 and A3 down a lean. BD how far the nearest
   change of kind is (half pixels) and BO what lies across it. Made the first time the cave is looked at. */
function prepare(cave) {
  if (cave.px) return cave.px; sheets();
  var N = PW * PH, KD = new Uint8Array(N), A1 = new Uint8Array(N), A2 = new Uint8Array(N), A3 = new Uint8Array(N), BD = new Uint8Array(N), BO = new Uint8Array(N), x, r, q, i, D = cave.D, P = cave.P;
  var IX = new Int32Array(PW), UU = new Float32Array(PW), cd = new Float32Array(FW), cp = new Float32Array(FW), cs = new Float32Array(FW), Sf = cave.S;
  for (x = 0; x < PW; x++) { var fx = (x + 0.5) / FS - 0.5, ix = Math.floor(fx); IX[x] = Math.max(0, Math.min(FW - 2, ix)); UU[x] = Math.max(0, Math.min(1, fx - IX[x])); }
  for (r = 0; r < PH; r++) {
    var fy = (r + 0.5) / K / FS - 0.5, j = Math.max(0, Math.min(FH - 2, Math.floor(fy))), v = Math.max(0, Math.min(1, fy - j)), nrow = (r & 127) << 7;
    for (i = 0; i < FW; i++) { cd[i] = D[j * FW + i] * (1 - v) + D[(j + 1) * FW + i] * v; cp[i] = P[j * FW + i] * (1 - v) + P[(j + 1) * FW + i] * v; if (Sf) cs[i] = Sf[j * FW + i] * (1 - v) + Sf[(j + 1) * FW + i] * v; }
    for (x = 0; x < PW; x++) { var a = IX[x], u = UU[x], dv = cd[a] * (1 - u) + cd[a + 1] * u + (NS[nrow | (x & 127)] - 0.5) * 0.07; if (dv < 0) continue; var pv = cp[a] * (1 - u) + cp[a + 1] * u + (NS[nrow | ((x + 40) & 127)] - 0.5) * 0.07; KD[r * PW + x] = pv > 0 ? 2 : (Sf && cs[a] * (1 - u) + cs[a + 1] * u + (NS[nrow | ((x + 77) & 127)] - 0.5) * 0.1 > 0 ? 3 : 1); }   // 3: the sea over the floor
  }
  for (x = 0; x < PW; x++) {                              // straight up from every foot: the walls that face you; straight down from every lip: the chasm's far wall
    var lastF = 1e9, lastN = -1e9;
    for (r = PH - 1; r >= 0; r--) { q = r * PW + x; if (KD[q]) lastF = r; else if (lastF - r <= WALLH) A1[q] = lastF - r; }
    for (r = 0; r < PH; r++) { q = r * PW + x; if (KD[q] !== 2) lastN = r; else if (r - lastN <= PITH) A1[q] = r - lastN; }
  }
  function lean(up, sgn, slope, reach, A) {                // the same along columns that lean
    var off = new Int32Array(PH), mx = 0, idl, last, rr, xx, qq;
    for (rr = 0; rr < PH; rr++) { off[rr] = Math.round(slope * (up ? PH - 1 - rr : rr)) * sgn; if (Math.abs(off[rr]) > mx) mx = Math.abs(off[rr]); }
    for (idl = -mx; idl < PW + mx; idl++) {
      if (up) { last = 1e9; for (rr = PH - 1; rr >= 0; rr--) { xx = idl + off[rr]; if (xx < 0 || xx >= PW) continue; qq = rr * PW + xx; if (KD[qq]) last = rr; else if (last - rr <= reach && !A1[qq]) A[qq] = last - rr; } }
      else { last = -1e9; for (rr = 0; rr < PH; rr++) { xx = idl + off[rr]; if (xx < 0 || xx >= PW) continue; qq = rr * PW + xx; if (KD[qq] !== 2) last = rr; else if (rr - last <= reach && !A1[qq]) A[qq] = rr - last; } }
    }
  }
  lean(true, 1, SIDE / WALLH, WALLH, A2); lean(true, -1, SIDE / WALLH, WALLH, A3);       // a wall east of the floor leans east as it rises: it faces west
  lean(false, -1, PSIDE / PITH, PITH, A2); lean(false, 1, PSIDE / PITH, PITH, A3);       // the chasm's side walls lean in as they fall
  BD.fill(250);
  for (r = 1; r < PH - 1; r++) for (x = 1; x < PW - 1; x++) { q = r * PW + x; var kc = KD[q], o1 = KD[q - 1], o2 = KD[q + 1], o3 = KD[q - PW], o4 = KD[q + PW], ot = o1 !== kc ? o1 : (o2 !== kc ? o2 : (o3 !== kc ? o3 : (o4 !== kc ? o4 : 255))); if (ot !== 255) { BD[q] = 1; BO[q] = ot | (kc << 2); } }
  var vv, nv;
  for (r = 1; r < PH; r++) for (x = 1; x < PW - 1; x++) { q = r * PW + x; vv = BD[q]; if (vv <= 2) continue; nv = BD[q - 1] + 2; if (nv < vv) { vv = nv; BO[q] = BO[q - 1]; } nv = BD[q - PW] + 2; if (nv < vv) { vv = nv; BO[q] = BO[q - PW]; } nv = BD[q - PW - 1] + 3; if (nv < vv) { vv = nv; BO[q] = BO[q - PW - 1]; } nv = BD[q - PW + 1] + 3; if (nv < vv) { vv = nv; BO[q] = BO[q - PW + 1]; } BD[q] = vv; }
  for (r = PH - 2; r >= 0; r--) for (x = PW - 2; x > 0; x--) { q = r * PW + x; vv = BD[q]; if (vv <= 2) continue; nv = BD[q + 1] + 2; if (nv < vv) { vv = nv; BO[q] = BO[q + 1]; } nv = BD[q + PW] + 2; if (nv < vv) { vv = nv; BO[q] = BO[q + PW]; } nv = BD[q + PW + 1] + 3; if (nv < vv) { vv = nv; BO[q] = BO[q + PW + 1]; } nv = BD[q + PW - 1] + 3; if (nv < vv) { vv = nv; BO[q] = BO[q + PW - 1]; } BD[q] = vv; }
  return (cave.px = { KD: KD, A1: A1, A2: A2, A3: A3, BD: BD, BO: BO });
}

/* One piece of the cave, painted: CS units square at PXS pixels a unit. The colour of every pixel first (a pixel a unit, laid
   on smoothly at twice the size), then the pen. The pieces are painted as if evenly lit; the dark is laid over them. */
var PANELS = {};
function panel(pk, sd) { var key = pk * 8 + sd, p = PANELS[key]; if (p) return p; var zn = vnoise(pk / 2.7, sd * 5.3, 44); return (PANELS[key] = { b: (pk + 0.15 + 0.7 * hash(pk, sd, 41)) * 42, hp: hash(pk, sd + 9, 43), style: zn < 0.45 ? 0 : (zn < 0.7 ? 1 : 2) }); }
function rockTone(gx, gy, h, sd) {                       // the rock of a wall at a pixel, h above its foot (or below its lip): panels between fissures, beds of blocks, great blocks or thin strata
  var X = gx + (NS[(((gy >> 1) & 127) << 7) | ((gx >> 3) & 127)] - 0.5) * 12, k0 = Math.floor(X / 42), pa = panel(k0, sd), pk = X < pa.b ? k0 - 1 : k0; if (pk !== k0) pa = panel(pk, sd);
  var dl = X - pa.b, dr = panel(pk + 1, sd).b - X, hp = pa.hp, tone = 1 + (hp - 0.5) * 0.2 + (0.5 - dl / (dl + dr)) * 0.12, fy, ch;
  if (pa.style === 0) { var yb = h + hp * 13 + dl * (hp - 0.5) * 0.3, row = Math.floor(yb / 12), rh = hash(row, pk + sd * 77, 31), bw = 15 + rh * 24, xb = (X + rh * 131) / bw, col = Math.floor(xb); fy = yb / 12 - row; ch = hash(col, row, 33); tone += (ch - 0.5) * 0.26; if (fy > 0.82) tone += 0.12; else if (fy < 0.16) tone -= 0.2; if ((xb - col) * bw < 1.5 && ch > 0.3) tone -= 0.3; }
  else if (pa.style === 2) { var yb2 = h + hp * 6 + dl * (hp - 0.5) * 0.5, row2 = Math.floor(yb2 / 6); fy = yb2 / 6 - row2; ch = hash(row2, pk + sd * 77, 34); tone += (ch - 0.5) * 0.2; if (fy < 0.26) tone -= 0.2; else if (fy > 0.8) tone += 0.07; }
  else { var yb3 = h + hp * 27 + (nsm(X, sd * 300, 5) - 0.5) * 14, row3 = Math.floor(yb3 / 27), rh3 = hash(row3, pk + sd * 77, 37), bw3 = 28 + rh3 * 30, f3 = yb3 / 27 - row3, xb3 = (X + rh3 * 131 + (f3 - 0.5) * (rh3 - 0.5) * 28) / bw3, col3 = Math.floor(xb3), fx3 = xb3 - col3; ch = hash(col3, row3 + pk * 13, 38); tone += (ch - 0.5) * 0.24; if (f3 > 0.9) tone += 0.14; else if (f3 < 0.1) tone -= 0.26; if (fx3 * bw3 < 1.8) tone -= 0.32; else if (fx3 * bw3 < 4) tone += 0.09; if (ch > 0.4) tone += (fx3 + f3 * 0.9 - 0.95 > 0 ? -0.07 : 0.06); }
  var wide = hp > 0.8 ? 3.2 : 1.6; if (dl < wide) tone -= 0.46; else if (dl < wide + 2.2) tone += 0.12; if (dr < 3) tone -= 0.12 * (1 - dr / 3);
  return tone < 0.25 ? 0.25 : tone;
}
function chunk(cave, cx, cy) {
  var key = cx + ',' + cy, ch = cave.chunks[key]; if (ch) return ch;
  var S = prepare(cave), KD = S.KD, A1 = S.A1, A2 = S.A2, A3 = S.A3, BD = S.BD, BO = S.BO, W2 = CS, H2 = Math.round(CS * K), X0 = cx * CS, Y0 = cy * H2;
  var small = mkCanvas(W2, H2), sg = small.getContext('2d'), img = sg.createImageData(W2, H2), d = img.data, pp = 0, px, py, k, pool = cave.pool, ox = cave.ox, oy = cave.oy;
  var shafts = cave.shafts.filter(function (s) { return s.x - ox + s.rx * 1.4 > X0 && s.x - ox - s.rx * 1.4 < X0 + W2 && (s.y - oy + s.ry * 1.4) * K > Y0 && (s.y - oy - s.ry * 1.4) * K < Y0 + H2; });
  var tunY = (cave.tunnelY - oy) * K, tunX = cave.entrance.x - ox, tunW = cave.tunW || 80, TF = cave.tintF, TW = cave.tintW, sea = cave.kind === 'sea';
  for (py = 0; py < H2; py++) for (px = 0; px < W2; px++, pp += 4) {
    var gx = X0 + px, gy = Y0 + py, rr = 6, gg = 6, bb = 10;
    if (gx >= 0 && gy >= 0 && gx < PW && gy < PH) {
      var q = gy * PW + gx, kd = KD[q], n1 = NS[((gy & 127) << 7) | (gx & 127)], n2 = NS[(((gy * 2) & 127) << 7) | ((gx * 2) & 127)], wh = WS[((gy & 255) << 8) | (gx & 255)], bd = BD[q] * 0.5, bo = BO[q], oth = (bo >> 2) === kd ? (bo & 3) : (bo >> 2), a1 = A1[q], wx = gx + 0.5, wy = (gy + 0.5) / K;
      if (kd === 1 || kd === 3) {                         // the floor (and under the water)
        var soft = nsm(gx, gy * 1.3, 3.1), warm = nsm(gx + 300, gy * 1.3 + 170, 4.3), tr = trailAt(cave, ox + wx, oy + wy);
        rr = 86 + (soft - 0.5) * 30 + (n2 - 0.5) * 12; gg = 86 + (soft - 0.5) * 28 + (n2 - 0.5) * 12; bb = 98 + (soft - 0.5) * 26 + (n2 - 0.5) * 12;   // cool grey rock
        if (warm > 0.46) { var wk = sm(0.46, 0.56, warm) * 0.8; rr += (112 - rr) * wk; gg += (97 - gg) * wk; bb += (80 - bb) * wk; if (wh > 0.9) { rr += 20; gg += 18; bb += 14; } else if (wh < 0.08) { rr -= 16; gg -= 15; bb -= 12; } }   // earth and gravel in it, a speck a pebble
        var tw = 14 + n1 * 10; if (tr < tw + 10) { var tk = sm(tw + 10, tw - 2, tr) * 0.9; rr += (142 - rr) * tk; gg += (122 - gg) * tk; bb += (92 - bb) * tk; if (tr < tw * 0.5) { rr += 7; gg += 6; bb += 4; } if (wh > 0.95) { rr += 16; gg += 14; bb += 10; } }   // his path: trodden pale and warm down the middle of the way through
        for (k = 0; k < shafts.length; k++) { var sh = shafts[k], dn = Math.hypot((ox + wx - sh.x) / sh.rx, (oy + wy - sh.y) / sh.ry) + (n1 - 0.5) * 0.3; if (dn < 1.15) { var mk2 = sm(1.15, 0.5, dn) * (0.35 + soft * 0.75) * (tr < tw ? 0.35 : 1); if (mk2 > 1) mk2 = 1; var lit = n2 > 0.52; if (sh.grate) { rr += ((lit ? 92 : 64) - rr) * mk2 * 0.6; gg += ((lit ? 96 : 68) - gg) * mk2 * 0.6; bb += ((lit ? 100 : 76) - bb) * mk2 * 0.6; } else { rr += ((lit ? 104 : 70) - rr) * mk2; gg += ((lit ? 132 : 100) - gg) * mk2; bb += ((lit ? 62 : 52) - bb) * mk2; } } }   // moss where the daylight falls (under a crypt's grate a damp stain, no moss: the studio's prototype)
        if (oth === 0 && bd < 22) { var ao = 1 - bd / 22; ao *= ao; rr *= 1 - 0.5 * ao; gg *= 1 - 0.47 * ao; bb *= 1 - 0.36 * ao; }   // the dark at a wall's foot
        if (oth === 2 && bd < 7) { if (bd < 1.3) { rr = 18; gg = 16; bb = 20; } else { var lp = 1 - bd / 7; rr += 30 * lp; gg += 28 * lp; bb += 26 * lp; } }   // the lip of the chasm: a pale edge, an ink line at the drop
        if (pool) { var pu = (ox + wx - pool.x) / pool.rx, pvv = (oy + wy - pool.y) / pool.ry, pd = Math.sqrt(pu * pu + pvv * pvv) + (n1 - 0.5) * 0.12; if (pd < 1.1) { if (pd > 1) { rr = rr * 0.72; gg = gg * 0.74; bb = bb * 0.8; } else { var dp = sm(1, 0.25, pd); rr = 70 - dp * 46 + (n2 - 0.5) * 6; gg = 104 - dp * 54 + (n2 - 0.5) * 6; bb = 112 - dp * 44 + (n2 - 0.5) * 6; if (pd > 0.93) { rr = 30; gg = 44; bb = 52; } else if (nsm(gx, gy * 2, 2) > 0.66) { rr += 14; gg += 18; bb += 20; } } } }   // the still pool: clear at its rim, dark in its middle
        if (TF) { rr *= TF[0]; gg *= TF[1]; bb *= TF[2]; }
        if (sea && kd === 1 && oth === 3 && bd < 12) { var wk3 = 1 - bd / 12; rr *= 1 - 0.34 * wk3; gg *= 1 - 0.28 * wk3; bb *= 1 - 0.2 * wk3; if (wh > 0.93 && bd > 3) { rr += 26; gg += 30; bb += 30; } }   // wet shingle at the water's edge, a pale pebble in it
        if (kd === 3) {                                   // the sea over the floor: clear at its edge, green then dark where it deepens; a pale line where it laps
          var dpt = sAt(cave, ox + wx, oy + wy), dk = sm(0, 1.1, dpt), band = nsm(gx * 0.7, gy * 2.6, 3.4);
          var wr = 58 - dk * 44 + (band - 0.5) * 14, wg = 132 - dk * 78 + (band - 0.5) * 16, wb = 138 - dk * 66 + (band - 0.5) * 14, mixw = 0.5 + dk * 0.5;
          rr += (wr - rr) * mixw; gg += (wg - gg) * mixw; bb += (wb - bb) * mixw;
          if (oth === 1 && bd < 2.4) { rr = 196; gg = 222; bb = 222; } else if (oth === 1 && bd < 5 && n2 > 0.5) { rr += 30; gg += 36; bb += 34; }
          else if (oth === 0 && bd < 3) { rr += 40; gg += 50; bb += 50; }
        }
        if (gy > tunY && Math.abs(gx - tunX) < tunW) { var dl2 = sm(tunY, tunY + 110, gy) * (sea ? 0.6 : 1); rr += (255 - rr) * dl2; gg += (246 - gg) * dl2; bb += (216 - bb) * dl2; }   // the daylight at the foot of the tunnel
      } else if (kd === 0) {
        if (a1) {                                         // a wall that faces you
          var f = a1 / WALLH, tone = rockTone(gx, gy, a1, 1) + (n2 - 0.5) * 0.1, lt = Math.pow(1 - f, 1.35) * 0.96 + 0.03;
          var wet = sm(0.6, 0.72, vnoise(gx / 120, 7.7, 51)) * sm(0.5, 0.7, vnoise(gx / 6, 3.1, 50)); if (wet > 0.05) { tone *= 1 - wet * 0.36; if (n2 > 0.8 && wet > 0.6) tone += 0.3; }   // water running down
          rr = 100 * tone * lt; gg = 94 * tone * lt; bb = 108 * tone * lt + 14 * f;
          var rust = sm(0.62, 0.74, vnoise(gx / 70, 2.2, 53)) * sm(0.45, 0.7, vnoise(gx / 5, 9.9, 54)) * (1 - f); if (rust > 0.05) { rr += (128 * lt - rr) * rust * 0.6; gg += (88 * lt - gg) * rust * 0.6; bb += (58 * lt - bb) * rust * 0.6; }   // rust bled out of the rock
          if (TW) { rr *= TW[0]; gg *= TW[1]; bb *= TW[2]; }
          if (a1 <= 1) { rr = 16; gg = 14; bb = 18; } else if (a1 <= 5 && KD[q + a1 * PW] === 1) { rr *= 1.16; gg *= 1.14; bb *= 1.1; }   // the line where it meets the floor, the floor's light on its foot
          if (sea && a1 < 18 && KD[q + a1 * PW] === 3) { var wt2 = 1 - a1 / 18; rr *= 1 - 0.42 * wt2; gg *= 1 - 0.3 * wt2; bb *= 1 - 0.26 * wt2; if (wh > 0.86 && a1 > 3) { rr += 8; gg += 34; bb += 10; } else if (wh < 0.07) { rr += 60; gg += 62; bb += 60; } if (a1 <= 2) { rr = 150; gg = 180; bb = 180; } }   // a wall that stands in the sea: wet and dark at its foot, weed and barnacles on it, a pale line where the water laps
          if (gy + a1 > tunY && Math.abs(gx - tunX) < tunW + 10) { var dl3 = sm(tunY, tunY + 110, gy + a1) * (1 - f * 0.6); rr += (255 - rr) * dl3 * 0.7; gg += (240 - gg) * dl3 * 0.7; bb += (200 - bb) * dl3 * 0.7; }
        } else if (A2[q] || A3[q]) {                      // a side wall: lit where it faces west, dark where it faces east
          var west = A2[q] !== 0 && (A3[q] === 0 || A2[q] <= A3[q]), sd = west ? A2[q] : A3[q], fs = sd / WALLH, ts = (west ? 1.12 : 0.72) * (0.86 + (hash(Math.floor((sd + 4) / 11), west ? 3 : 4, 36) - 0.5) * 0.2 + (n2 - 0.5) * 0.12), ls = Math.pow(1 - fs, 1.35) * 0.96 + 0.03;
          if ((sd + 4) % 11 < 1.4) ts *= 0.78;
          rr = 100 * ts * ls; gg = 94 * ts * ls; bb = 108 * ts * ls + 14 * fs; if (TW) { rr *= TW[0]; gg *= TW[1]; bb *= TW[2]; } if (sd <= 1) { rr = 16; gg = 14; bb = 18; }
        } else if (oth !== 0 && bd <= 7.5) {              // the near wall, its face turned away: a rim of rock, an ink line at the floor
          if (bd <= 1.4) { rr = 16; gg = 14; bb = 18; } else { var rim = (n1 > 0.5 ? 1.08 : 0.9) * (1 - (bd - 1.4) / 9); rr = 74 * rim; gg = 72 * rim; bb = 84 * rim; }
        } else { var fr = oth !== 0 ? Math.max(0, 1 - bd / 46) : 0, rk = 12 + fr * 22 + (n1 - 0.5) * (5 + fr * 8) + (n2 - 0.5) * fr * 6; rr = rk; gg = rk - 1; bb = rk + 6; }   // the rock itself, seen from above: dark stone by the floor, nothing further in (black is kept for the chasm)
      } else {                                            // the chasm: an abyss (the studio's prototype, 2026-10-22; Robin: "you feel like you're looking down an abyss")
        var pa1 = a1, side2 = 0; if (!pa1) { if (A2[q] || A3[q]) { side2 = A2[q] !== 0 && (A3[q] === 0 || A2[q] <= A3[q]) ? 1 : 2; pa1 = side2 === 1 ? A2[q] : A3[q]; } }
        var drift = nsm(gx * 0.6 + 50, gy * 2.4, 9);
        if (pa1) {
          var fp = pa1 / PITH, tp = (side2 ? (side2 === 1 ? 1.1 : 0.7) * (0.9 + (n2 - 0.5) * 0.14) : rockTone(gx, gy, pa1, 2) + (n2 - 0.5) * 0.1), lp2 = Math.pow(Math.max(0, 1 - fp * 1.02), 1.3) * 0.95;   // the wall fades over the whole fall, not black a third of the way down
          var sdep = pa1 + (NS[(((gx >> 2) & 127) << 7) | 7] - 0.5) * 18, sb = sdep % 30, ledge = fp < 0.1 ? 1 : (sb < 2.5 ? 1.5 : (sb < 8 ? 0.6 : 1));   // ledges going down: a lit lip every 30 px, its shadow under it
          var haze = Math.max(0, Math.min(1, (fp - 0.2) / 0.75)) * (0.45 + 0.55 * drift);                          // the depth's own air: haze thickening as it falls
          rr = 96 * tp * lp2 * ledge + 3 + haze * 26; gg = 92 * tp * lp2 * ledge + 4 + haze * 32; bb = 106 * tp * lp2 * ledge + 9 + haze * 52;
          if (pa1 <= 1) { rr = 16; gg = 14; bb = 18; } else if (pa1 <= 4 && !side2) { rr = 142; gg = 136; bb = 142; }   // the lip: lit stone over the ink
        } else {                                          // the deep below the far wall: mist drifting in bands, and far down now and then a light
          var wisp = Math.pow(drift, 2.4), mist = nsm(gx, gy * 2.2, 6);
          rr = 5 + mist * 6 + wisp * 22; gg = 7 + mist * 9 + wisp * 28; bb = 13 + mist * 20 + wisp * 44;
          if (wh > 0.9994) { rr += 30; gg += 80; bb += 70; } else if (wh > 0.9986) { rr += 10; gg += 30; bb += 28; }   // the cave fungus far below, as specks
        }
      }
    }
    d[pp] = rr; d[pp + 1] = gg; d[pp + 2] = bb; d[pp + 3] = 255;
  }
  sg.putImageData(img, 0, 0);
  var cv = mkCanvas(W2 * PXS, H2 * PXS), g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(small, 0, 0, W2 * PXS, H2 * PXS);
  g.save(); g.setTransform(PXS, 0, 0, PXS, -X0 * PXS, -Y0 * PXS); pen(g, cave, S, X0, Y0, W2, H2); g.restore();
  if (cave.chunkN > 60) { cave.chunks = {}; cave.chunkN = 0; }
  cave.chunks[key] = cv; cave.chunkN++; return cv;
}
/* The pen: what lies and grows on the floor, drawn over the painted rock in the sheet's own pixels (x a unit, y a screen row).
   Everything is placed from the cave's own position and looked for a little past the piece, so a thing a border cuts is drawn
   whole by both pieces. */
function pen(g, cave, S, X0, Y0, W2, H2) {
  var KD = S.KD, A1 = S.A1, BD = S.BD, ox = cave.ox, oy = cave.oy, INK = 'rgba(18,15,20,0.92)', x, y, q, k, M = 14;
  g.lineCap = 'round'; g.lineJoin = 'round';
  function stone(sx, sy, rx, ry, col, seed) {
    var a, pts = []; for (a = 0; a < 7; a++) { var an = a / 7 * 6.283 + 0.3, rq = 0.78 + hash(seed, a, 5) * 0.44; pts.push([sx + Math.cos(an) * rx * rq, sy + Math.sin(an) * ry * rq]); }
    g.fillStyle = 'rgba(6,8,16,0.4)'; g.beginPath(); g.ellipse(sx + rx * 0.35, sy + ry * 0.55, rx * 1.05, ry * 0.6, 0, 0, 7); g.fill();
    g.fillStyle = col; g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.ellipse(sx - rx * 0.15, sy - ry * 0.34, rx * 0.5, ry * 0.34, 0, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = 0.6; g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); g.stroke();
    g.lineWidth = 1.1; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.lineTo(pts[2][0], pts[2][1]); g.stroke();
  }
  function kd(px, py) { return (px < 0 || py < 0 || px >= PW || py >= PH) ? 0 : KD[(py | 0) * PW + (px | 0)]; }
  function bdAt(px, py) { return (px < 0 || py < 0 || px >= PW || py >= PH) ? 0 : BD[(py | 0) * PW + (px | 0)] * 0.5; }
  var ROCKS = ['#8a8794', '#6f6d7c', '#a09ca6'];
  // rubble where a wall meets the floor, stones on the rim of a near wall
  for (y = Math.max(1, Y0 - M); y < Math.min(PH - 1, Y0 + H2 + M); y++) for (x = Math.max(1, X0 - M); x < Math.min(PW - 1, X0 + W2 + M); x++) {
    q = y * PW + x; if (BD[q] > 1) continue; var wh = WS[(((y + 77) & 255) << 8) | ((x + 31) & 255)];
    if (KD[q] === 1 && KD[q - PW] === 0 && A1[q - PW] === 1) { if (wh < 0.09) { var ns2 = 1 + Math.floor(wh * 30), si; for (si = 0; si < ns2; si++) { var hs = hash(x, y + si, 63); stone(x + (hs - 0.5) * 12, y + 1.5 + hash(x + si, y, 64) * 6, 1.3 + hs * 3, 0.9 + hs * 1.9, ROCKS[si % 3], x + si * 7); } } }
    else if (KD[q] === 0 && !A1[q] && !S.A2[q] && !S.A3[q] && kd(x, y - 2) === 1 && wh < 0.05) stone(x, y + 2.5, 2.4 + wh * 50, 1.6 + wh * 26, wh < 0.025 ? '#787684' : '#5d5b69', x * 3 + y);
  }
  // on the floor: stones in clusters, cracks in the bare rock, bones thicker the nearer his lair
  var CL = 15, gx, gy, lx = cave.lair ? cave.lair.x - ox : -1e6, ly = cave.lair ? (cave.lair.y - oy) * K : -1e6, pl0 = cave.pool || { x: -1e6, y: -1e6, rx: 1, ry: 1 }, sea = cave.kind === 'sea';
  for (gy = Math.floor((Y0 - M) / CL); gy <= Math.floor((Y0 + H2 + M) / CL); gy++) for (gx = Math.floor((X0 - M) / CL); gx <= Math.floor((X0 + W2 + M) / CL); gx++) {
    var h0 = hash(gx, gy, 65), sx = (gx + hash(gx, gy, 66)) * CL, sy = (gy + hash(gx, gy, 67)) * CL; if (kd(sx, sy) !== 1 || bdAt(sx, sy) < 7) continue;
    var wxx = ox + sx, wyy = oy + sy / K, tr = trailAt(cave, wxx, wyy), hz = hash(gx, gy, 71); if (Math.hypot((wxx - pl0.x) / pl0.rx, (wyy - pl0.y) / pl0.ry) < 1.05) continue;
    if (sea) {                                            // the shingle: far more stones than a dry cave has, weed thrown up along the water's edge, a shell
      var sdp = sAt(cave, wxx, wyy);
      if (sdp > -0.5 && h0 > 0.62 && h0 < 0.8) { g.fillStyle = 'rgba(52,60,34,0.9)'; g.beginPath(); g.ellipse(sx, sy, 5 + hz * 5, 2.2 + hz * 1.6, hz * 3, 0, 7); g.fill(); g.strokeStyle = '#6f7a3a'; g.lineWidth = 0.8; for (k = 0; k < 4; k++) { g.beginPath(); g.moveTo(sx + (hash(gx + k, gy, 74) - 0.5) * 9, sy); g.quadraticCurveTo(sx + (hash(gx, gy + k, 75) - 0.5) * 14, sy - 2, sx + (hash(gx + k, gy + k, 76) - 0.5) * 16, sy + (hash(gx - k, gy, 77) - 0.5) * 5); g.stroke(); } continue; }
      if (h0 < 0.3) { stone(sx, sy, 1.4 + hz * 2.6, 1 + hz * 1.6, ['#9aa0a8', '#7c848e', '#b4b6b2', '#8d8478'][Math.floor(hz * 4)], gx * 31 + gy); continue; }
      if (h0 > 0.97) { g.fillStyle = '#e6dfd0'; g.strokeStyle = INK; g.lineWidth = 0.5; g.beginPath(); g.ellipse(sx, sy, 2.2, 1.5, hz * 3, 0, 7); g.fill(); g.stroke(); continue; }
    }
    var near = Math.max(0, 1 - Math.hypot(sx - lx, (sy - ly) / K) / (11 * T));
    if (near > 0 && h0 > 1 - near * (nsm(sx + 500, sy + 900, 1.9) > 0.52 ? 0.5 : 0.06) && tr > 12) {   // a bone, now and then a skull: in heaps, few between
      g.save(); g.translate(sx, sy); g.rotate(hz * 6.283);
      if (hz > 0.86) { g.fillStyle = '#b9b09a'; g.strokeStyle = INK; g.lineWidth = 0.6; g.beginPath(); g.ellipse(0, 0, 3.6, 3, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#2a242a'; g.beginPath(); g.arc(-1.2, -0.3, 0.9, 0, 7); g.arc(1.2, -0.3, 0.9, 0, 7); g.fill(); }
      else { var bl = 3.5 + hz * 5; g.strokeStyle = INK; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-bl, 0); g.lineTo(bl, 0); g.stroke(); g.strokeStyle = '#b4ab96'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-bl, 0); g.lineTo(bl, 0); g.stroke(); g.fillStyle = '#b4ab96'; [-bl, bl].forEach(function (e) { g.beginPath(); g.arc(e, -0.8, 1.1, 0, 7); g.arc(e, 0.8, 1.1, 0, 7); g.fill(); }); }
      g.restore(); continue;
    }
    if (tr < 22) continue;
    var clu = nsm(sx + 900, sy + 300, 2.6) > 0.55 ? 2.4 : 0.35;
    if (h0 < 0.085 * clu) stone(sx, sy, 1.6 + hz * 3.4, 1.2 + hz * 2.1, ROCKS[Math.floor(hz * 3)], gx * 31 + gy);
    else if (h0 > 0.93 && nsm(sx + 300, sy * 1.3 + 170, 4.3) < 0.44) { g.strokeStyle = 'rgba(20,18,26,0.55)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(sx, sy); var cxx = sx, cyy = sy; for (k = 0; k < 4; k++) { cxx += (hash(gx + k, gy, 72) - 0.3) * 9; cyy += (hash(gx, gy + k, 73) - 0.5) * 6; g.lineTo(cxx, cyy); } g.stroke(); }
  }
  // still water: dark, a pale edge on the far side
  cave.puddles.forEach(function (p) { var sx = p.x - ox, sy = (p.y - oy) * K; if (sx < X0 - 30 || sx > X0 + W2 + 30 || sy < Y0 - 20 || sy > Y0 + H2 + 20) return;
    g.save(); g.translate(sx, sy); g.rotate(p.a); g.fillStyle = 'rgba(26,36,52,0.78)'; g.beginPath(); g.ellipse(0, 0, p.rx, p.ry * K, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(170,196,214,0.5)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(0, 0, p.rx * 0.92, p.ry * K * 0.9, 0, Math.PI * 1.05, Math.PI * 1.8); g.stroke(); g.fillStyle = 'rgba(190,214,230,0.35)'; g.beginPath(); g.ellipse(-p.rx * 0.3, -p.ry * K * 0.25, p.rx * 0.28, p.ry * K * 0.2, 0, 0, 7); g.fill(); g.restore(); });
  // his footprints down the trail, a pair every few strides, going in
  cave.path.forEach(function (p, i) { if (i < 3 || i % 4 || i >= cave.path.length - 3) return; var nx2 = cave.path[i + 1], sx = p.x - ox, sy = (p.y - oy) * K; if (sx < X0 - 30 || sx > X0 + W2 + 30 || sy < Y0 - 30 || sy > Y0 + H2 + 30) return;
    var an = Math.atan2((nx2.y - p.y) * K, nx2.x - p.x), sd = i % 8 ? 1 : -1, fx = sx - Math.sin(an) * 8 * sd, fy = sy + Math.cos(an) * 8 * sd * K; if (kd(fx, fy) !== 1) return;
    g.save(); g.translate(fx, fy); g.rotate(an); g.fillStyle = 'rgba(46,38,32,0.24)'; g.beginPath(); g.moveTo(-9, 0); g.quadraticCurveTo(-8.5, -2.6, -3, -3.2); g.quadraticCurveTo(3, -4.8, 6.4, -4.2); g.quadraticCurveTo(8, 0, 6.4, 4.2); g.quadraticCurveTo(3, 4.8, -3, 3.2); g.quadraticCurveTo(-8.5, 2.6, -9, 0); g.fill(); for (k = 0; k < 5; k++) { g.beginPath(); g.ellipse(8.3 - Math.abs(k - 2) * 0.5, -3.8 + k * 1.9, 1.2, 0.85, 0, 0, 7); g.fill(); } g.restore(); });
  // moss and fern under the holes in the roof
  cave.shafts.forEach(function (s, si) { if (s.grate) return; var sx = s.x - ox, sy = (s.y - oy) * K; if (sx < X0 - 120 || sx > X0 + W2 + 120 || sy < Y0 - 90 || sy > Y0 + H2 + 90) return;
    var n = Math.round(s.rx * 0.5), i2;
    for (i2 = 0; i2 < n; i2++) { var a = hash(i2, si, 81) * 6.283, rd = Math.sqrt(hash(i2, si, 82)), bx = sx + Math.cos(a) * rd * s.rx * 0.95, by = sy + Math.sin(a) * rd * s.ry * K * 0.95, hb = hash(i2, si, 83); if (kd(bx, by) !== 1 || trailAt(cave, ox + bx, oy + by / K) < 16 || Math.hypot((ox + bx - pl0.x) / (pl0.rx + 4), (oy + by / K - pl0.y) / (pl0.ry + 4)) < 1) continue;
      if (hb > 0.8) { g.strokeStyle = '#4f7a36'; g.lineWidth = 0.9; var fr; for (fr = -2; fr <= 2; fr++) { var ex = bx + fr * 4.4, ey = by - 9 + Math.abs(fr) * 2.2; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + fr * 1.6, by - 7, ex, ey); g.stroke(); for (k = 1; k <= 3; k++) { var t = k / 4, mx = bx + (ex - bx) * t + fr * 0.5, my = by + (ey - by) * t - 2 * Math.sin(t * 3.14); g.beginPath(); g.moveTo(mx - 1.6, my + 0.6); g.lineTo(mx + 1.6, my - 0.6); g.stroke(); } } }   // a fern
      else { g.lineWidth = 0.9; for (k = 0; k < 3; k++) { g.strokeStyle = (k + i2) % 2 ? '#86b450' : '#5d8a3a'; g.beginPath(); g.moveTo(bx + (k - 1) * 1.4, by); g.quadraticCurveTo(bx + (k - 1) * 2, by - 3, bx + (k - 1) * 2.6 + (hb - 0.5) * 2, by - 4.5 - hb * 3); g.stroke(); } }
    } });
  if (cave.kind === 'mine') penMine(g, cave, X0, Y0, W2, H2);
  if (cave.niches && cave.niches.length) penNiches(g, cave, X0, Y0, W2, H2);
  // the copper veins: green streaks up the walls that face you
  cave.veins.forEach(function (v) { var vx = v.x - ox, vy = (v.y - oy) * K; if (vx < X0 - 30 || vx > X0 + W2 + 30 || vy < Y0 - 60 || vy > Y0 + H2 + 10) return;
    var seg = 3 + (v.s % 3), hh = v.h * K, spent = v.left <= 0; g.strokeStyle = spent ? '#4a4540' : '#2f8a62'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(vx - 6, vy - 2);
    for (k = 1; k <= seg; k++) g.lineTo(vx - 6 + (12 / seg) * k + (hash(k, v.s, 1) - 0.5) * 5, vy - 2 - (hh - 5) * k / seg + (hash(k, v.s, 2) - 0.5) * 4);
    g.stroke(); g.strokeStyle = spent ? '#6a645e' : '#6fd19a'; g.lineWidth = 0.9; g.stroke();
    for (k = 0; k < 4 && !spent; k++) { g.fillStyle = 'rgba(80,190,130,0.7)'; g.beginPath(); g.arc(vx + (hash(k, v.s, 3) - 0.5) * 16, vy - hash(k, v.s, 4) * (hh - 4), 0.9 + hash(k, v.s, 5), 0, 7); g.fill(); } });
}
function penNiches(g, cave, X0, Y0, W2, H2) {           // the catacombs' niches: an arched hollow cut in the wall face, a row of skulls on long bones stacked crosswise
  var ox = cave.ox, oy = cave.oy, INK = 'rgba(22,16,14,0.95)', k;
  cave.niches.forEach(function (n) { var x = n.x - ox, y = (n.y - oy) * K; if (x < X0 - 40 || x > X0 + W2 + 40 || y < Y0 - 10 || y > Y0 + H2 + 60) return;
    var w = 10.5, b = y - 7, t = y - 33, tall = hash(n.s, 1, 2) > 0.5;
    g.save(); g.beginPath(); g.moveTo(x - w, b); g.lineTo(x - w, t + 6); g.quadraticCurveTo(x - w, t - 2, x, t - 3); g.quadraticCurveTo(x + w, t - 2, x + w, t + 6); g.lineTo(x + w, b); g.closePath();
    g.fillStyle = 'rgba(14,11,14,0.94)'; g.fill(); g.clip();
    g.lineCap = 'round';
    for (k = 0; k < 4; k++) { var ly = b - 1.6 - k * 2.3; g.strokeStyle = INK; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x - w + 1, ly); g.lineTo(x + w - 1, ly + (hash(n.s, k, 3) - 0.5)); g.stroke(); g.strokeStyle = k % 2 ? '#a99f8a' : '#bdb39c'; g.lineWidth = 1.5; g.stroke(); }   // the long bones, ends out
    var row = b - 12.5, nk = 3, i;
    for (i = 0; i < nk; i++) { var sx = x - w + 3.6 + i * (2 * w - 7.2) / (nk - 1), sy = row + (hash(n.s, i, 5) - 0.5) * 1.2;
      g.fillStyle = INK; g.beginPath(); g.ellipse(sx, sy, 3.5, 3.1, 0, 0, 7); g.fill(); g.fillStyle = hash(n.s, i, 6) > 0.4 ? '#c9bfa6' : '#b3a98f'; g.beginPath(); g.ellipse(sx, sy, 2.9, 2.6, 0, 0, 7); g.fill();
      g.fillStyle = '#231c20'; g.beginPath(); g.arc(sx - 1.1, sy - 0.2, 0.85, 0, 7); g.arc(sx + 1.1, sy - 0.2, 0.85, 0, 7); g.fill(); g.fillRect(sx - 0.3, sy + 1.1, 0.6, 0.9); }
    if (tall) for (k = 0; k < 2; k++) { var ly2 = row - 5 - k * 2.3; g.strokeStyle = INK; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x - w + 2, ly2); g.lineTo(x + w - 2, ly2); g.stroke(); g.strokeStyle = '#b5ab94'; g.lineWidth = 1.4; g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(205,198,186,0.55)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x - w - 0.8, b); g.lineTo(x - w - 0.8, t + 6); g.quadraticCurveTo(x - w - 0.8, t - 3, x, t - 4.1); g.stroke();   // the cut edge lit from the upper left
    g.strokeStyle = 'rgba(10,8,10,0.6)'; g.beginPath(); g.moveTo(x, t - 4.1); g.quadraticCurveTo(x + w + 0.8, t - 3, x + w + 0.8, t + 6); g.lineTo(x + w + 0.8, b); g.stroke();
    g.fillStyle = 'rgba(190,184,172,0.45)'; g.fillRect(x - w - 1.5, b, 2 * w + 3, 1.6);   // the sill
  });
}
/* An iron gate across a passage that runs north to south (the catacombs' vaults): bars between two pins in the rock, a lock plate.
   Drawn with the things that stand, sorted by its foot. g: { x, y (its foot, world), w, state: shut, open (swung back against the
   west side) or broken (torn off its pins, lying bent on the floor). */
function drawGate(c, gt) {
  var x = gt.x, y = gt.y * K, hw = gt.w / 2, H = 46, INK = 'rgba(14,12,14,0.95)', IRON = '#3b3e45', LIT = '#7d828c', k;
  function bar(x0, y0, x1, y1, wd) { c.strokeStyle = INK; c.lineWidth = wd + 1.4; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = IRON; c.lineWidth = wd; c.stroke(); c.strokeStyle = LIT; c.lineWidth = wd * 0.35; c.beginPath(); c.moveTo(x0 - wd * 0.2, y0); c.lineTo(x1 - wd * 0.2, y1); c.stroke(); }
  c.save(); c.lineCap = 'round';
  [-1, 1].forEach(function (s) { c.fillStyle = INK; c.fillRect(x + s * (hw + 1) - 2, y - H * 0.85, 4, 3); c.fillRect(x + s * (hw + 1) - 2, y - H * 0.25, 4, 3); });   // the pins leaded into the rock
  if (gt.state === 'shut') {
    c.fillStyle = 'rgba(4,5,10,0.3)'; c.beginPath(); c.ellipse(x + 4, y + 1.5, hw + 4, 2.6, 0, 0, 7); c.fill();
    var n = Math.max(4, Math.round(gt.w / 8)); for (k = 0; k <= n; k++) { var bx = x - hw + k * gt.w / n; bar(bx, y, bx, y - H, 2.2); c.fillStyle = INK; c.beginPath(); c.moveTo(bx - 2, y - H); c.lineTo(bx, y - H - 5); c.lineTo(bx + 2, y - H); c.fill(); }
    [0.18, 0.55, 0.9].forEach(function (f) { bar(x - hw - 1, y - H * f, x + hw + 1, y - H * f, 2.6); });
    c.fillStyle = INK; c.fillRect(x + hw * 0.3 - 1, y - H * 0.62, 11, 12); c.fillStyle = '#4b4f57'; c.fillRect(x + hw * 0.3, y - H * 0.62 + 1, 9, 10); c.fillStyle = '#16141a'; c.beginPath(); c.arc(x + hw * 0.3 + 4.5, y - H * 0.62 + 5, 1.6, 0, 7); c.fill(); c.fillRect(x + hw * 0.3 + 4, y - H * 0.62 + 5, 1, 3.5);   // the lock
    c.fillStyle = 'rgba(150,80,40,0.35)'; for (k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x - hw + hash(k, gt.id, 9) * gt.w, y - H * hash(k, gt.id, 8), 1.6, 2.4, 0, 0, 7); c.fill(); }   // rust
  } else if (gt.state === 'open') {                        // swung back flat against the west side
    var ex = x - hw + 6, d = 9; for (k = 0; k <= 4; k++) { var t = k / 4; bar(x - hw + t * d, y - t * 2, x - hw + t * d, y - H - t * 2, 2); }
    [0.18, 0.55, 0.9].forEach(function (f) { bar(x - hw, y - H * f, ex + 3, y - H * f - 2, 2.4); });
  } else {                                                // broken: torn off, lying bent where it fell
    c.fillStyle = 'rgba(4,5,10,0.28)'; c.beginPath(); c.ellipse(x + 2, y - 10, hw, 6, 0.1, 0, 7); c.fill();
    for (k = 0; k <= 5; k++) { var lx = x - hw * 0.8 + k * hw * 0.32, bend = (hash(k, gt.id, 4) - 0.5) * 6; bar(lx, y - 2, lx + bend + 4, y - 18 - k % 2 * 2, 2); }
    bar(x - hw * 0.9, y - 6, x + hw * 0.9, y - 12, 2.4); bar(x - hw * 0.85, y - 14, x + hw * 0.7, y - 19, 2.4);
    bar(x - hw - 1, y - H * 0.85, x - hw + 4, y - H * 0.6, 2); bar(x + hw + 1, y - H * 0.25, x + hw - 5, y - H * 0.1, 2);   // what is left on the pins
  }
  c.restore();
}
function penMine(g, cave, X0, Y0, W2, H2) {                // what people left in the mine: soot where they set fires, posts along the drift, a ladder, a bucket, a sledge
  var ox = cave.ox, oy = cave.oy, INK = 'rgba(22,16,14,0.95)', k;
  function vis(x, y, m) { return x > X0 - m && x < X0 + W2 + m && y > Y0 - m && y < Y0 + H2 + m; }
  cave.soot.forEach(function (s) { var x = s.x - ox, y = (s.y - oy) * K; if (!vis(x, y, 70)) return;
    var gr = g.createRadialGradient(x, y - 14, 2, x, y - 14, 44); gr.addColorStop(0, 'rgba(8,6,8,0.8)'); gr.addColorStop(0.6, 'rgba(10,8,10,0.45)'); gr.addColorStop(1, 'rgba(10,8,10,0)');
    g.save(); g.beginPath(); g.rect(x - 50, y - 64, 100, 64); g.clip(); g.translate(x, y - 14); g.scale(0.62, 1.25); g.translate(-x, -(y - 14)); g.fillStyle = gr; g.beginPath(); g.arc(x, y - 14, 44, 0, 7); g.fill(); g.restore();
    g.fillStyle = 'rgba(190,186,180,0.5)'; g.beginPath(); g.ellipse(x, y + 9, 15, 5.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(24,20,22,0.8)'; g.beginPath(); g.ellipse(x, y + 9, 10, 3.6, 0, 0, 7); g.fill();
    g.fillStyle = '#16131a'; for (k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + (hash(k, s.x | 0, 3) - 0.5) * 18, y + 8 + (hash(k, s.x | 0, 4) - 0.5) * 6, 2 + hash(k, 2, 5) * 1.6, 1.3, hash(k, 6, 7) * 3, 0, 7); g.fill(); } });
  cave.posts.forEach(function (p) { var x = p.x - ox, y = (p.y - oy) * K; if (!vis(x, y, 60)) return;
    g.fillStyle = 'rgba(4,5,10,0.4)'; g.beginPath(); g.ellipse(x + 3, y + 1, 6, 2.4, 0, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = 7.4; g.lineCap = 'butt'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.8, y - 42); g.stroke(); g.strokeStyle = '#64462f'; g.lineWidth = 5.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.8, y - 42); g.stroke(); g.strokeStyle = '#8d6a48'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 1.6, y - 1); g.lineTo(x - 0.8, y - 41); g.stroke();
    g.fillStyle = INK; g.fillRect(x - 12, y - 49, 25, 8); g.fillStyle = '#5a3f2a'; g.fillRect(x - 11, y - 48, 23, 6); g.fillStyle = '#8a6846'; g.fillRect(x - 11, y - 48, 23, 1.5);   // the cap's end, the lagging over it
    g.fillStyle = INK; g.beginPath(); g.arc(x + 0.8, y - 45, 3.6, 0, 7); g.fill(); g.fillStyle = '#a3825c'; g.beginPath(); g.arc(x + 0.8, y - 45, 2.6, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,40,26,0.7)'; g.lineWidth = 0.5; g.beginPath(); g.arc(x + 0.8, y - 45, 1.3, 0, 7); g.stroke(); });
  (cave.things || []).forEach(function (t) { var x = t.x - ox, y = (t.y - oy) * K; if (!vis(x, y, 50)) return;
    if (t.kind === 'ladder') { g.strokeStyle = INK; g.lineWidth = 3.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 7, y + 3); g.lineTo(x - 3, y - 50); g.moveTo(x + 7, y + 3); g.lineTo(x + 5, y - 50); g.stroke(); g.strokeStyle = '#7a5a3c'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x - 7, y + 3); g.lineTo(x - 3, y - 50); g.moveTo(x + 7, y + 3); g.lineTo(x + 5, y - 50); g.stroke(); for (k = 0; k < 6; k++) { var ry = y - 3 - k * 8.4; if (k === 3) continue; g.strokeStyle = INK; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x - 6.6 + k * 0.6, ry); g.lineTo(x + 6.8 - k * 0.3, ry - 0.6); g.stroke(); g.strokeStyle = '#8f6c49'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 6.6 + k * 0.6, ry); g.lineTo(x + 6.8 - k * 0.3, ry - 0.6); g.stroke(); } }
    else if (t.kind === 'bucket') { g.fillStyle = 'rgba(4,5,10,0.4)'; g.beginPath(); g.ellipse(x + 2, y + 1, 7, 2.6, 0, 0, 7); g.fill(); g.fillStyle = '#6a4b32'; g.strokeStyle = INK; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x - 5, y - 9); g.lineTo(x + 5, y - 9); g.lineTo(x + 4, y); g.lineTo(x - 4, y); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#2a2018'; g.beginPath(); g.ellipse(x, y - 9, 5, 1.8, 0, 0, 7); g.fill(); g.stroke(); g.strokeStyle = '#3a3a40'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 4.8, y - 5); g.lineTo(x + 4.8, y - 5); g.stroke(); g.fillStyle = '#5fa585'; g.beginPath(); g.arc(x - 1, y - 9.6, 1.5, 0, 7); g.arc(x + 2, y - 9.2, 1.2, 0, 7); g.fill(); }
    else { g.fillStyle = 'rgba(4,5,10,0.4)'; g.beginPath(); g.ellipse(x + 2, y + 2, 17, 4, 0, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 16, y - 1); g.quadraticCurveTo(x - 20, y - 5, x - 17, y - 8); g.moveTo(x - 16, y - 1); g.lineTo(x + 15, y - 1); g.moveTo(x - 14, y + 3); g.lineTo(x + 17, y + 3); g.stroke(); g.strokeStyle = '#7a5a3c'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#5a3f2a'; g.strokeStyle = INK; g.lineWidth = 0.8; g.beginPath(); g.rect(x - 11, y - 8, 22, 7); g.fill(); g.stroke(); g.fillStyle = '#6c7078'; [-6, 0, 6].forEach(function (dx, di) { g.beginPath(); g.arc(x + dx, y - 9 - (di === 1 ? 1.5 : 0), 3, 0, 7); g.fill(); g.stroke(); }); } });
}
function dirty(cave) { cave.chunks = {}; cave.chunkN = 0; }

/* Drawing the floor: the pieces in view (cam.x, cam.y are the page's: world x, world y times K), at most a few new ones a call
   (the one under the middle of the view at once); then what moves on it: rings on the pool and on the puddles where a drop falls. */
function drawFloor(c, cave, cam, hw, hh, clock) {
  var H2 = CS * K, cx0 = Math.floor((cam.x - hw - cave.ox) / CS), cx1 = Math.floor((cam.x + hw - cave.ox) / CS), cy0 = Math.floor((cam.y - hh - cave.oy * K) / H2), cy1 = Math.floor((cam.y + hh - cave.oy * K) / H2), cx, cy, baked = 0;
  var mx = Math.floor((cam.x - cave.ox) / CS), my = Math.floor((cam.y - cave.oy * K) / H2);
  c.imageSmoothingEnabled = true;
  for (cy = Math.max(0, cy0); cy <= cy1 && cy * H2 < PH; cy++) for (cx = Math.max(0, cx0); cx <= cx1 && cx * CS < PW; cx++) {
    var key = cx + ',' + cy, pc = cave.chunks[key];
    if (!pc && (baked < 1 || (cx === mx && cy === my))) { pc = chunk(cave, cx, cy); baked++; }
    if (pc) c.drawImage(pc, cave.ox + cx * CS, cave.oy * K + cy * H2, CS + 0.5, H2 + 0.5); else { c.fillStyle = '#06060a'; c.fillRect(cave.ox + cx * CS, cave.oy * K + cy * H2, CS, H2); }
  }
  var pl = cave.pool, k;
  if (cave.S) {                                           // the sea in the cave: short pale lines that drift in from the mouth and fade
    var WG = 30, wx0 = Math.floor((cam.x - hw) / WG), wx1 = Math.floor((cam.x + hw) / WG), wy0 = Math.floor((cam.y - hh) / K / WG), wy1 = Math.floor((cam.y + hh) / K / WG), wxi, wyi; c.lineCap = 'round';
    for (wyi = wy0; wyi <= wy1; wyi++) for (wxi = wx0; wxi <= wx1; wxi++) { var hw0 = hash(wxi, wyi, 21); if (hw0 > 0.42) continue; var ph0 = (clock * (0.16 + hw0 * 0.2) + hash(wxi, wyi, 22)) % 1, wxp = (wxi + hash(wxi, wyi, 23)) * WG, wyp = (wyi + hash(wxi, wyi, 24)) * WG - ph0 * 22; if (sAt(cave, wxp, wyp) < 0.12 || sAt(cave, wxp, wyp + 8) < 0.1) continue; var wl = 5 + hw0 * 22; c.strokeStyle = 'rgba(200,236,236,' + (0.34 * Math.sin(ph0 * Math.PI)).toFixed(3) + ')'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(wxp - wl, wyp * K); c.quadraticCurveTo(wxp, wyp * K - 1.6, wxp + wl, wyp * K); c.stroke(); }
  }
  if (pl) for (k = 0; k < 3; k++) { var ph = (clock * 0.45 + k * 0.37) % 1, st = Math.floor(clock * 0.45 + k * 0.37), dx = (hash(k, st, 8) - 0.5) * pl.rx * 1.2, dy = (hash(k, st, 9) - 0.5) * pl.ry * 1.2; c.strokeStyle = 'rgba(190,220,230,' + (0.5 * (1 - ph)).toFixed(3) + ')'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(pl.x + dx, (pl.y + dy) * K, 2 + ph * 12, (2 + ph * 12) * K, 0, 0, 7); c.stroke(); }
  cave.puddles.forEach(function (p, i) { if (Math.abs(p.x - cam.x) > hw + 20 || Math.abs(p.y * K - cam.y) > hh + 20) return; var per = 2.6 + hash(i, 1, 90) * 3, ph2 = ((clock + hash(i, 2, 91) * 9) % per) / 1.1; if (ph2 > 1) return; c.strokeStyle = 'rgba(190,220,230,' + (0.45 * (1 - ph2)).toFixed(3) + ')'; c.lineWidth = 0.6; c.beginPath(); c.ellipse(p.x, p.y * K, 1 + ph2 * p.rx * 0.7, (1 + ph2 * p.rx * 0.7) * K * 0.8, 0, 0, 7); c.stroke(); });
}

/* The dark, and the light in it. Drawn over everything in the page's own screen (o.W by o.H, 400 by 250): deep blue-black with
   holes in it. o: { cam: { x, y, z }, P: the hero, torch, clock, sun: 1 by day down to about 0.15 at night, W, H }. The hero
   sees a small circle (a wide warm one with a torch); the tunnel's daylight, every hole in the roof (by the sun: at night only
   moonlight), the copper in the rocks and a glimpse of green at a vein. Then light is laid on: the beams down from the holes
   with dust turning in them, the torch's warmth, the copper's glow. */
var darkCv = null;
function dark(c, cave, o) {
  var W = o.W || 400, H = o.H || 250, cam = o.cam, z2 = cam.z / 2, P = o.P, sun = o.sun == null ? 1 : o.sun, clock = o.clock || 0, K2 = K;
  if (!darkCv) darkCv = mkCanvas(W / 2, H / 2);
  var n = darkCv.getContext('2d');
  function sx(x) { return ((x - cam.x) * cam.z + W / 2) / 2; } function sy(y) { return ((y * K2 - cam.y) * cam.z + H / 2) / 2; }
  n.globalCompositeOperation = 'source-over'; n.clearRect(0, 0, W / 2, H / 2); n.fillStyle = 'rgba(8,10,22,0.885)'; n.fillRect(0, 0, W / 2, H / 2);   /* (the palette, 2026-10-21: a deep blue-black the wall's grain shows through, never pure black) */
  n.globalCompositeOperation = 'destination-out';
  function hole(x, y, rx, ry, a) { var g = n.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(0.55, 'rgba(0,0,0,' + a * 0.6 + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); n.save(); n.translate(x, y); n.scale(1, ry / rx); n.translate(-x, -y); n.fillStyle = g; n.beginPath(); n.arc(x, y, rx, 0, 7); n.fill(); n.restore(); }   // (the gradient is made where it lies and the squash laid round it: one made at 0,0 under a translate drew a quarter of itself in the Node canvas)
  var tl = o.torch ? 1 + 0.04 * Math.sin(clock * 11) + 0.03 * Math.sin(clock * 17.3) : 0, hr = (o.torch ? 210 + tl * 12 : 92) * z2;   /* (the studio's prototype: a wider circle, a torch that breathes) */
  hole(sx(P.x), sy(P.y) - 6 * z2, hr, hr, o.torch ? 1 : 0.78);   /* without a torch his circle is cool and small (eyes in the dark); with one, warm and wide */
  hole(sx(cave.exitAt.x), sy(cave.exitAt.y + 30), 150 * z2, 190 * z2, 0.5 + 0.45 * sun);                 // the daylight up the tunnel
  cave.shafts.forEach(function (s) { var x = sx(s.x), y = sy(s.y); if (x < -80 || x > W / 2 + 80 || y < -80 || y > H / 2 + 80) return; var a = Math.min(0.93, s.k * (0.14 + 0.8 * sun)); hole(x, y, s.rx * 1.9 * z2, s.ry * 1.9 * K2 * z2, a * 0.55); hole(x, y, s.rx * 1.1 * z2, s.ry * 1.1 * K2 * z2, a); });
  (cave.glows || []).forEach(function (g2) { var x = sx(g2.x), y = sy(g2.y); if (x < -160 || x > W / 2 + 160 || y < -160 || y > H / 2 + 160) return; hole(x, y, g2.r * 1.5 * z2, g2.r * 1.1 * K2 * z2, g2.a * (0.3 + 0.7 * sun)); });   // daylight carried in over water
  (cave.deeps || []).forEach(function (dp) { hole(sx(dp.x), sy(dp.y + dp.ry * 0.6), dp.rx * 1.1 * z2, dp.ry * 1.6 * K2 * z2, 0.32); });   // a burial pit: the same faint light from below as the abyss
  if (cave.pit && cave.pit.ext) { var pc = cave.pit; hole(sx(pc.x), sy(pc.y + pc.ext * 0.4), pc.rx * 1.05 * z2, (pc.ry + pc.ext) * 0.62 * K2 * z2, 0.34); }   // the abyss's own faint light, rising from far below: its ledges and its haze show
  (cave.candles || []).forEach(function (cd) { var x = sx(cd.x), y = sy(cd.y) - 6 * z2; if (x < -100 || x > W / 2 + 100 || y < -100 || y > H / 2 + 100) return; var fl = 1 + 0.06 * Math.sin(clock * 7.3 + cd.ph) + 0.04 * Math.sin(clock * 13.1 + cd.ph * 2); hole(x, y, cd.r * fl * z2, cd.r * 0.8 * fl * K2 * z2, 0.82); });   // candles left burning: small warm lights down the galleries
  (cave.fires || []).forEach(function (fi) { var x = sx(fi.x), y = sy(fi.y) - 8 * z2; if (x < -150 || x > W / 2 + 150 || y < -150 || y > H / 2 + 150) return; var fl = 1 + 0.06 * Math.sin(clock * 9 + 1) + 0.04 * Math.sin(clock * 14.7); hole(x, y, 120 * fl * z2, 100 * fl * K2 * z2, 0.9); });   // the troll's fire: his own light, red and low
  (cave.fungi || []).forEach(function (fu) { var x = sx(fu.x), y = sy(fu.y) - 6 * z2; if (x < -120 || x > W / 2 + 120 || y < -120 || y > H / 2 + 120) return; hole(x, y, fu.r * z2, fu.r * 0.8 * K2 * z2, fu.a * (0.85 + 0.15 * Math.sin(clock * 0.8 + fu.ph))); });   // the fungus: far lights in the dark
  cave.ores.forEach(function (q) { if (q.dying == null && q.ore !== false) { var x = sx(q.x), y = sy(q.y) - 5 * z2; if (x > -30 && x < W / 2 + 30 && y > -30 && y < H / 2 + 30) hole(x, y, 34 * z2, 34 * z2, 0.62); } });
  cave.veins.forEach(function (v) { if (v.left > 0) { var x = sx(v.x), y = sy(v.y) - 10 * z2; if (x > -30 && x < W / 2 + 30 && y > -30 && y < H / 2 + 30) hole(x, y, 26 * z2, 26 * z2, 0.3); } });
  c.save(); c.imageSmoothingEnabled = true; c.drawImage(darkCv, 0, 0, W, H);
  c.globalCompositeOperation = 'lighter';
  function px(x) { return (x - cam.x) * cam.z + W / 2; } function py(y) { return (y * K2 - cam.y) * cam.z + H / 2; }
  cave.shafts.forEach(function (s, si) {                   // the beam: daylight slanting down from the upper left to its pool on the floor, dust turning in it
    var x = px(s.x), y = py(s.y), rx = s.rx * cam.z, ry = s.ry * K2 * cam.z; if (x < -160 || x > W + 160 || y < -40 || y > H + 220) return;
    var a = s.k * sun, cold = sun < 0.4, col = cold ? '170,196,255' : '236,240,222', top = y - 170 * cam.z, lx = -0.36, wI;
    var foot = y + ry * 0.6, g = c.createLinearGradient(0, top, 0, foot); g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(0.5, 'rgba(' + col + ',' + (0.05 * a + 0.01).toFixed(3) + ')'); g.addColorStop(0.84, 'rgba(' + col + ',' + (0.13 * a + 0.02).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');   // (it fades into its pool of light: it ended in a straight bright bar)
    c.fillStyle = g; var NB = 14;                          // the beam in narrow streaks side by side, strong in the middle and fading to nothing at its edges, each a little brighter or fainter than its neighbour: no hard edge
    for (wI = 0; wI < NB; wI++) { var u0 = wI / NB - 0.5, u1 = (wI + 1) / NB - 0.5, prof = Math.pow(Math.sin((wI + 0.5) / NB * Math.PI), 1.4) * (0.55 + 0.9 * hash(wI, si, 94)); c.globalAlpha = Math.min(1, prof); var yb0 = y + ry * 0.6 * Math.sqrt(Math.max(0, 1 - 4 * u0 * u0)), yb1 = y + ry * 0.6 * Math.sqrt(Math.max(0, 1 - 4 * u1 * u1)); c.beginPath(); c.moveTo(x + u0 * rx * 1.5, yb0); c.lineTo(x + u0 * rx * 0.75 + (top - y) * lx, top); c.lineTo(x + u1 * rx * 0.75 + 0.3 + (top - y) * lx, top); c.lineTo(x + u1 * rx * 1.5 + 0.3, yb1); c.closePath(); c.fill(); }
    c.globalAlpha = 1;
    var pg = c.createRadialGradient(x, y, 0, x, y, rx * 1.15); pg.addColorStop(0, 'rgba(' + col + ',' + (0.16 * a + 0.02).toFixed(3) + ')'); pg.addColorStop(1, 'rgba(' + col + ',0)'); c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y); c.fillStyle = pg; c.beginPath(); c.arc(x, y, rx * 1.15, 0, 7); c.fill(); c.restore();
    var m; for (m = 0; m < 12; m++) { var hm = hash(m, si, 95), tm = ((clock * (0.03 + hm * 0.04) + hash(m, si, 96)) % 1), my = y - tm * 110 * cam.z, mx2 = x + (hash(m, si, 97) - 0.5) * rx * 1.2 + (my - y) * lx + Math.sin(clock * 0.7 + m) * 3; c.fillStyle = 'rgba(' + col + ',' + ((0.3 + 0.3 * Math.sin(clock * 1.3 + m * 2)) * a * Math.sin(tm * Math.PI)).toFixed(3) + ')'; c.fillRect(mx2, my, 1.1, 1.1); }
  });
  (cave.glows || []).forEach(function (g2, gi) {           // the water's own light: a green-blue shimmer where the daylight comes in under it
    if (!g2.sea) return; var x = px(g2.x), y = py(g2.y), r = g2.r * cam.z; if (x < -r || x > W + r || y < -r || y > H + r) return;
    var a = g2.a * (0.3 + 0.7 * sun) * (0.2 + 0.05 * Math.sin(clock * 1.7 + gi * 2)), gg2 = c.createRadialGradient(x, y, 0, x, y, r); gg2.addColorStop(0, 'rgba(90,220,210,' + a.toFixed(3) + ')'); gg2.addColorStop(1, 'rgba(60,180,200,0)');
    c.save(); c.translate(x, y); c.scale(1, K2); c.translate(-x, -y); c.fillStyle = gg2; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore(); });
  if (!o.torch) { var cx0 = px(P.x), cy0 = py(P.y) - 10 * cam.z, cg = c.createRadialGradient(cx0, cy0, 0, cx0, cy0, 60 * cam.z); cg.addColorStop(0, 'rgba(40,48,70,0.55)'); cg.addColorStop(1, 'rgba(40,48,70,0)'); c.fillStyle = cg; c.beginPath(); c.arc(cx0, cy0, 60 * cam.z, 0, 7); c.fill(); }
  if (o.torch) { var tx = px(P.x), ty = py(P.y) - 10 * cam.z, tg = c.createRadialGradient(tx, ty, 0, tx, ty, 170 * cam.z); tg.addColorStop(0, 'rgba(210,150,70,' + (0.3 + 0.03 * Math.sin(clock * 13)).toFixed(3) + ')'); tg.addColorStop(0.5, 'rgba(160,110,60,0.12)'); tg.addColorStop(1, 'rgba(40,60,120,0)'); c.fillStyle = tg; c.beginPath(); c.arc(tx, ty, 150 * cam.z, 0, 7); c.fill(); }
  (cave.fungi || []).forEach(function (fu) {               // the fungus's own glow, a slow pulse of blue-green
    var x = px(fu.x), y = py(fu.y) - 8 * cam.z, r = fu.r * 0.9 * cam.z; if (x < -r || x > W + r || y < -r || y > H + r) return;
    var a = 0.16 + 0.05 * Math.sin(clock * 0.8 + fu.ph), gf = c.createRadialGradient(x, y, 0, x, y, r); gf.addColorStop(0, 'rgba(90,225,195,' + a.toFixed(3) + ')'); gf.addColorStop(1, 'rgba(60,170,170,0)'); c.save(); c.translate(x, y); c.scale(1, K2); c.translate(-x, -y); c.fillStyle = gf; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore();
  });
  (cave.candles || []).forEach(function (cd) { var x = px(cd.x), y = py(cd.y) - 8 * cam.z, fl = 1 + 0.07 * Math.sin(clock * 7.3 + cd.ph), r = cd.r * 0.85 * fl * cam.z; if (x < -r || x > W + r || y < -r || y > H + r) return; var gc = c.createRadialGradient(x, y, 0, x, y, r); gc.addColorStop(0, 'rgba(255,190,100,0.3)'); gc.addColorStop(0.5, 'rgba(220,130,60,0.1)'); gc.addColorStop(1, 'rgba(160,80,40,0)'); c.save(); c.translate(x, y); c.scale(1, K2); c.translate(-x, -y); c.fillStyle = gc; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore(); });
  (cave.fires || []).forEach(function (fi) { var x = px(fi.x), y = py(fi.y) - 10 * cam.z, fl = 1 + 0.07 * Math.sin(clock * 9 + 1) + 0.05 * Math.sin(clock * 14.7), r = 130 * fl * cam.z, gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(240,120,50,0.42)'); gr.addColorStop(0.45, 'rgba(200,70,30,0.16)'); gr.addColorStop(1, 'rgba(120,30,20,0)'); c.save(); c.translate(x, y); c.scale(1, K2); c.translate(-x, -y); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore(); });
  (cave.deeps || []).forEach(function (dp) { var dx = px(dp.x), dy = py(dp.y + dp.ry * 0.7), dr = dp.rx * 1.2 * cam.z, dg = c.createRadialGradient(dx, dy, 0, dx, dy, dr); dg.addColorStop(0, 'rgba(70,110,160,0.14)'); dg.addColorStop(1, 'rgba(40,70,120,0)'); c.fillStyle = dg; c.beginPath(); c.arc(dx, dy, dr, 0, 7); c.fill(); });
  if (cave.pit && cave.pit.ext) { var apx = px(cave.pit.x), apy = py(cave.pit.y + cave.pit.ext * 0.55), ar = cave.pit.rx * 1.1 * cam.z, ag = c.createRadialGradient(apx, apy, 0, apx, apy, ar); ag.addColorStop(0, 'rgba(70,120,170,0.12)'); ag.addColorStop(1, 'rgba(40,70,120,0)'); c.save(); c.translate(apx, apy); c.scale(1, 1.4); c.translate(-apx, -apy); c.fillStyle = ag; c.beginPath(); c.arc(apx, apy, ar, 0, 7); c.fill(); c.restore(); }   // a cold breath of light from the bottom of the abyss
  cave.ores.forEach(function (q) {                         // the glowing stones (the ore in the rock), a cold foxfire
    if (q.dying != null || q.ore === false) return; var x = px(q.x), y = py(q.y) - 6 * cam.z; if (x < -30 || x > W + 30 || y < -30 || y > H + 30) return;
    var g = c.createRadialGradient(x, y, 0, x, y, 15 * cam.z), a = 0.6 + 0.1 * Math.sin(clock * 2 + q.x); g.addColorStop(0, 'rgba(120,200,170,' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(120,200,170,0)');   /* the glowing stones cold foxfire, so warm belongs to fire and torch alone (the palette) */ c.fillStyle = g; c.beginPath(); c.arc(x, y, 15 * cam.z, 0, 7); c.fill();
  });
  (cave.eyes || []).forEach(function (e) {               // eyes in the dark: two embers low down, far from you; they blink and they are gone when you come near
    var dd = Math.hypot(e.x - P.x, e.y - P.y); if ((!e.deep && dd < 220) || dd > 760) return; var cyc = (clock * 0.31 + e.ph) % 7; if (cyc > 5.2 || (cyc > 2.4 && cyc < 2.55)) return;
    var ex = px(e.x), ey = py(e.y) - 16 * cam.z; if (ex < -10 || ex > W + 10 || ey < -10 || ey > H + 10) return; var fa = e.deep ? 0.7 : Math.min(1, (dd - 220) / 120);
    [-3.2, 3.2].forEach(function (o2) { var gx = c.createRadialGradient(ex + o2 * cam.z, ey, 0, ex + o2 * cam.z, ey, 3.4 * cam.z); gx.addColorStop(0, 'rgba(255,190,110,' + (0.9 * fa).toFixed(3) + ')'); gx.addColorStop(0.4, 'rgba(230,120,60,' + (0.5 * fa).toFixed(3) + ')'); gx.addColorStop(1, 'rgba(200,80,40,0)'); c.fillStyle = gx; c.beginPath(); c.arc(ex + o2 * cam.z, ey, 3.4 * cam.z, 0, 7); c.fill(); });
  });
  c.restore();
}

/* What the hero has seen, for the chart in the corner: cells SEEN units wide. see() marks the floor within r of a point;
   drawChart draws the cave as far as it is known (the floor pale on dark, the pool, the chasm, the daylight of the tunnel
   and of the holes in the roof once seen) with the hero on it. */
function see(cave, x, y, r) {
  var i0 = Math.max(0, Math.floor((x - r - cave.ox) / SEEN)), i1 = Math.min(SW - 1, Math.floor((x + r - cave.ox) / SEEN)), j0 = Math.max(0, Math.floor((y - r - cave.oy) / SEEN)), j1 = Math.min(SH - 1, Math.floor((y + r - cave.oy) / SEEN)), i, j;
  for (j = j0; j <= j1; j++) for (i = i0; i <= i1; i++) { if (cave.seen[j * SW + i]) continue; var cx = cave.ox + (i + 0.5) * SEEN, cy = cave.oy + (j + 0.5) * SEEN; if (Math.hypot(cx - x, cy - y) > r) continue; var dv = dAt(cave, cx, cy); if (dv < -0.5) continue; cave.seen[j * SW + i] = pAt(cave, cx, cy) > 0 ? 3 : (dv < 0 ? 2 : (cave.S && sAt(cave, cx, cy) > 0 ? 4 : 1)); cave.seenDirty = true; }
}
function drawChart(c, cave, x, y, w, h, P) {
  if (!cave.chartCv) cave.chartCv = mkCanvas(SW, SH);
  var i, sc = Math.min(w / SW, h / SH), dw = SW * sc, dh = SH * sc, x0 = x + (w - dw) / 2, y0 = y + (h - dh) / 2;
  if (cave.seenDirty) {
    var g = cave.chartCv.getContext('2d'), img = g.createImageData(SW, SH), d = img.data, pl = cave.pool;
    for (i = 0; i < SW * SH; i++) { var s = cave.seen[i], cx = cave.ox + (i % SW + 0.5) * SEEN, cy = cave.oy + (Math.floor(i / SW) + 0.5) * SEEN, r = 0, gg = 0, b = 0, a = 0;
      if (s === 4) { r = 86; gg = 150; b = 170; a = 255; if (cy > cave.tunnelY) { r = 190; gg = 226; b = 214; } }
      else if (s === 1) { r = 206; gg = 190; b = 150; a = 255; if (pl && Math.hypot((cx - pl.x) / pl.rx, (cy - pl.y) / pl.ry) < 1) { r = 96; gg = 156; b = 176; } else if (cave.shafts.some(function (sh) { return Math.hypot((cx - sh.x) / sh.rx, (cy - sh.y) / sh.ry) < 0.8; }) || cy > cave.tunnelY) { r = 255; gg = 244; b = 196; } }
      else if (s === 2) { r = 116; gg = 104; b = 86; a = 255; } else if (s === 3) { r = 20; gg = 22; b = 36; a = 255; }
      d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = a; }
    g.putImageData(img, 0, 0); cave.seenDirty = false;
  }
  c.save(); c.fillStyle = '#1c1714'; c.fillRect(x, y, w, h); c.imageSmoothingEnabled = true; c.drawImage(cave.chartCv, x0, y0, dw, dh);
  if (P) { var hx = x0 + (P.x - cave.ox) / SEEN * sc, hy = y0 + (P.y - cave.oy) / SEEN * sc; c.fillStyle = '#ffd34d'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1; c.beginPath(); c.arc(hx, hy, 2.2, 0, 7); c.fill(); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 0.6; c.beginPath(); c.arc(hx, hy, 3.6, 0, 7); c.stroke(); }
  c.restore();
}
function seenStr(cave) { var out = [], i = 0, n = cave.seen.length; while (i < n) { var v = cave.seen[i], j = i; while (j < n && cave.seen[j] === v && j - i < 4000) j++; out.push(v + ':' + (j - i)); i = j; } return out.join(','); }   // the seen cells as runs, for the save
function seenLoad(cave, str) { if (!str) return; var i = 0; String(str).split(',').forEach(function (run) { var q = run.split(':'), v = +q[0], n = +q[1]; while (n-- > 0 && i < cave.seen.length) cave.seen[i++] = v; }); cave.seenDirty = true; }

return { onBridge: inCave(onBridge), make: make, prepare: inCave(prepare), chunk: inCave(chunk), dirty: inCave(dirty), release: inCave(release), drawSet: drawSet, drawGate: drawGate, drawDrift: drawDrift, sAt: inCave(sAt), dAt: inCave(dAt), pAt: inCave(pAt), floor: inCave(floor), trailAt: inCave(trailAt), drawFloor: inCave(drawFloor, 1), dark: inCave(dark, 1), see: inCave(see), drawChart: inCave(drawChart, 1), seenStr: inCave(seenStr), seenLoad: inCave(seenLoad),
  T: T, K: K, GW: GW, GH: GH, FS: FS, PW: PW, PH: PH, CS: CS, WALLH: WALLH, PITH: PITH };
})();
if (typeof module !== 'undefined') module.exports = Cave;
