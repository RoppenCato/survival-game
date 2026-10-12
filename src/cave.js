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
var T = 32, K = 0.75, GW = 72, GH = 40, FS = 8, FW = GW * T / FS, FH = GH * T / FS;   // the fields: cells 8 units wide
var PW = GW * T, PH = Math.round(GH * T * K);                                          // the sheets: a pixel a unit across, the screen's rows down
var WALLH = 64, SIDE = 16, PITH = 120, PSIDE = 24, CS = 256, PXS = 2, SEEN = 16, SW = PW / SEEN, SH = GH * T / SEEN;
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
function floor(cave, x, y) { return dAt(cave, x, y) >= 0 && pAt(cave, x, y) < -0.2; } // where you can stand: floor, and a step back from the chasm

function make(seed, o) {
  o = o || {}; sheets();
  var ox = o.x || 0, oy = o.y || 0, R = rng(seed * 31 + 9), i, k, x, y;
  function jit(a) { return (R() - 0.5) * 2 * a; }
  // the way through: the tunnel's head, the hall, then east to the lair
  var WP = [[7, 33.4], [7.2, 29.9], [12.6, 24.6], [19, 20.4], [25.2, 15.6], [31.2, 13.2], [37.4, 17.4], [43.4, 20.4], [49.6, 19.2], [54.8, 15.2], [59.6, 17.6], [63.4, 22.6]];
  for (i = 2; i < WP.length - 1; i++) { WP[i][0] += jit(1.0); WP[i][1] += jit(1.2); }
  var flip = hash(seed, 3, 7) < 0.5, sg = flip ? -1 : 1, TX = flip ? GW - 7 : 7;       // in half the worlds the cave is laid the other way round: the tunnel in its south-east corner, the lair in the west
  if (flip) WP.forEach(function (p) { p[0] = GW - p[0]; });
  var circles = [], path = [], pts = [];
  function carve(cx, cy, rx, ry) { circles.push({ x: cx, y: cy, rx: rx, ry: ry || rx }); }
  function cr(a, b, c, d, t) { var t2 = t * t, t3 = t2 * t; return [0.5 * (2 * b[0] + (c[0] - a[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (3 * b[0] - a[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (c[1] - a[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (3 * b[1] - a[1] - 3 * c[1] + d[1]) * t3)]; }
  for (i = 0; i < WP.length - 1; i++) { var a = WP[Math.max(0, i - 1)], b = WP[i], c = WP[i + 1], d = WP[Math.min(WP.length - 1, i + 2)], n = Math.max(2, Math.round(Math.hypot(c[0] - b[0], c[1] - b[1]) * 2)); for (k = 0; k < n; k++) pts.push(cr(a, b, c, d, k / n)); }
  pts.push(WP[WP.length - 1].slice());
  pts.forEach(function (p, j) { carve(p[0], p[1], 2.1 + 0.4 * Math.sin(j * 0.31 + seed) + (R() < 0.06 ? 0.8 : 0), 2.05 + 0.45 * Math.sin(j * 0.23 + seed * 2)); if (j % 2 === 0) path.push({ x: p[0], y: p[1] }); });
  for (y = 33.4; y <= 41; y += 0.5) carve(TX + Math.sin(y * 0.9) * 0.2, y, 1.55, 1.55);    // the tunnel out, south to the daylight
  var hall = WP[1], fern = WP[3], poolC = WP[5], ledge = WP[7], gal = WP[9], lairC = WP[11], cavern = [ledge[0] + sg * 0.4, ledge[1] + 3.0];
  carve(hall[0], hall[1], 4.6, 3.5); carve(fern[0], fern[1], 3.7, 3.2); carve(poolC[0], poolC[1] + 0.6, 5.4, 4.4);
  carve(cavern[0], cavern[1], 7.2, 6.4); carve(lairC[0], lairC[1], 8.0, 6.6); carve(lairC[0] + sg * 5.8, lairC[1] + 0.4, 2.3, 2.3);
  var pockets = [];
  function pocket(from, cx, cy, rx, ry) { cy = Math.max(cy, ry + 3.4); var q, nq = Math.ceil(Math.hypot(cx - from[0], cy - from[1]) / 1.2); for (q = 0; q <= nq; q++) carve(from[0] + (cx - from[0]) * q / nq, from[1] + (cy - from[1]) * q / nq, 1.95, 1.95); carve(cx, cy, rx, ry); pockets.push({ x: cx, y: cy, rx: rx, ry: ry }); }
  var mA = pts[Math.floor(pts.length * 0.2)];
  pocket(mA, mA[0] - sg * 2.4 + jit(1), mA[1] - 7.6 + jit(0.8), 3.4, 2.9);
  pocket([poolC[0] + sg * 2.4, poolC[1] - 2.6], poolC[0] + sg * 5.6 + jit(0.8), poolC[1] - 6.8, 3.6, 2.7);
  pocket([cavern[0] + sg * 6.0, cavern[1] + 0.6], cavern[0] + sg * 8.6 + jit(0.6), cavern[1] + 5.6 + jit(0.6), 3.2, 2.7);
  pocket(gal, gal[0] + sg * 2.4 + jit(0.8), gal[1] - 7.2, 3.4, 2.6);
  var pit = { x: ledge[0] + sg * 0.3, y: ledge[1] + 5.8, rx: 5.7, ry: 3.5 };                     // the chasm: the south of the cavern, the way through along its north lip
  // the fields
  var D = new Float32Array(FW * FH), P = new Float32Array(FW * FH), ns = seed * 7 + 3, j2, i2;
  for (j2 = 0; j2 < FH; j2++) for (i2 = 0; i2 < FW; i2++) {
    var tx = (i2 + 0.5) * FS / T, ty = (j2 + 0.5) * FS / T, best = -9, ci;
    for (ci = 0; ci < circles.length; ci++) { var cc = circles[ci], ux = (tx - cc.x) / cc.rx, uy = (ty - cc.y) / cc.ry; if (ux > 2 || ux < -2 || uy > 2 || uy < -2) continue; var dd = (1 - Math.sqrt(ux * ux + uy * uy)) * Math.min(cc.rx, cc.ry); if (dd > best) best = dd; }
    best += (fbm(tx * 1.1, ty * 1.1, ns) - 0.5) * 1.3;
    var inTunnel = Math.abs(tx - TX) < 2.2 && ty > 33, edge = Math.min(tx - 1.5, GW - 1.5 - tx, ty - 3.2, inTunnel ? 9 : GH - 1.2 - ty); if (edge < best) best = edge;
    D[j2 * FW + i2] = best;
    var px2 = (tx - pit.x) / pit.rx, py2 = ty > pit.y ? 0 : (ty - pit.y) / pit.ry; P[j2 * FW + i2] = (1 - Math.sqrt(px2 * px2 + py2 * py2)) * pit.ry + (fbm(tx * 0.9, ty * 0.9, ns + 5) - 0.5) * 1.0;
  }
  var cave = { ox: ox, oy: oy, seed: seed, D: D, P: P, TR: null, chunks: {}, chunkN: 0, noiseT: 0, px: null, ores: [], veins: [], props: [], shafts: [], puddles: [], pockets: [], seen: new Uint8Array(SW * SH), seenDirty: true };
  function W(p) { return { x: ox + p[0] * T, y: oy + p[1] * T }; }
  cave.path = path.map(function (q) { return { x: ox + q.x * T, y: oy + q.y * T }; });     // the middle of the way through, a point a tile: the troll walks it home
  cave.entrance = W([TX, 34.3]); cave.exitAt = W([TX, 36.9]); cave.flip = flip; cave.tunnelY = oy + 35.2 * T;   // where you come in, where E takes you out, where the daylight begins
  cave.hall = W(hall); cave.fern = W(fern); cave.poolC = W(poolC); cave.ledge = W(ledge); cave.gallery = W(gal); cave.lair = W(lairC); cave.pit = { x: ox + pit.x * T, y: oy + pit.y * T, rx: pit.rx * T, ry: pit.ry * T };
  cave.body = { name: 'deadViking', x: ox + (lairC[0] + sg * 6.1) * T, y: oy + (lairC[1] + 0.7) * T, s: 1, r: 0, v: 0, cave: true };   // the dead Viking with the bronze ring, in the nook behind the lair
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
  for (i = 0; i < 90 && cave.veins.length < 9; i++) {
    var vt = 0.6 + R() * 0.34, vp = cave.path[Math.min(cave.path.length - 1, Math.floor(vt * cave.path.length))], vx = vp.x + (R() - 0.5) * 80, found = null, fh = 0;
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
  function stand(cx, cy, rx, ry, n2) { var t3, got = 0; for (t3 = 0; t3 < n2 * 14 && got < n2; t3++) { var sx = cx + (R() - 0.5) * 2 * rx, sy = cy + (R() - 0.5) * 2 * ry; if (!clearAt(sx, sy, 9)) continue; var dw = dAt(cave, sx, sy); if (dw > 2.4 && R() < 0.7) continue; var big = R() < 0.13; cave.props.push({ name: big ? 'caveColumn' : 'stalagmite', x: sx, y: sy, s: big ? 0.9 + R() * 0.25 : 0.7 + R() * 0.5, r: big ? 9 : 6, v: Math.floor(R() * 3), cave: true }); got++; } }
  stand(cave.hall.x, cave.hall.y, 140, 100, 2); stand(cave.fern.x, cave.fern.y, 120, 100, 3); stand(cave.poolC.x, cave.poolC.y, 170, 140, 5); stand(cave.ledge.x, cave.ledge.y - 20, 220, 90, 5); stand(cave.lair.x, cave.lair.y, 250, 200, 6);
  cave.pockets.forEach(function (q) { stand(q.x, q.y, q.rx, q.ry, 2); });
  cave.path.forEach(function (q, qi) { if (qi % 5 === 2) stand(q.x, q.y, 70, 70, 1); });
  // still water on the floor here and there, more of it where it is damp: round the pool and under the holes in the roof
  for (i = 0; i < 260 && cave.puddles.length < 22; i++) {
    var pq = cave.path[Math.floor(R() * cave.path.length)], ux2 = pq.x + (R() - 0.5) * 240, uy2 = pq.y + (R() - 0.5) * 200, damp = Math.hypot(ux2 - cave.pool.x, uy2 - cave.pool.y) < 260 || cave.shafts.some(function (s3) { return Math.hypot(ux2 - s3.x, uy2 - s3.y) < 130; });
    if (!damp && R() < 0.75) continue; if (!floor(cave, ux2, uy2) || !floor(cave, ux2 + 14, uy2) || !floor(cave, ux2 - 14, uy2) || !floor(cave, ux2, uy2 + 10) || trailAt(cave, ux2, uy2) < 22) continue;
    if (Math.hypot((ux2 - cave.pool.x) / (cave.pool.rx + 10), (uy2 - cave.pool.y) / (cave.pool.ry + 10)) < 1 || cave.puddles.some(function (q) { return Math.hypot(q.x - ux2, q.y - uy2) < 50; })) continue;
    cave.puddles.push({ x: ux2, y: uy2, rx: 7 + R() * 9, ry: 4 + R() * 4, a: (R() - 0.5) * 0.6 });
  }
  return cave;
}

/* The sheets (prepare): what every pixel of the cave is, and what stands over it. KD: 0 rock, 1 floor, 2 the chasm. For rock:
   A1 how far above a wall's foot it is, straight down (a wall that faces you), A2 and A3 the same down a lean (a wall that faces
   west, one that faces east). For the chasm: A1 how far below the floor's edge, A2 and A3 down a lean. BD how far the nearest
   change of kind is (half pixels) and BO what lies across it. Made the first time the cave is looked at. */
function prepare(cave) {
  if (cave.px) return cave.px; sheets();
  var N = PW * PH, KD = new Uint8Array(N), A1 = new Uint8Array(N), A2 = new Uint8Array(N), A3 = new Uint8Array(N), BD = new Uint8Array(N), BO = new Uint8Array(N), x, r, q, i, D = cave.D, P = cave.P;
  var IX = new Int32Array(PW), UU = new Float32Array(PW), cd = new Float32Array(FW), cp = new Float32Array(FW);
  for (x = 0; x < PW; x++) { var fx = (x + 0.5) / FS - 0.5, ix = Math.floor(fx); IX[x] = Math.max(0, Math.min(FW - 2, ix)); UU[x] = Math.max(0, Math.min(1, fx - IX[x])); }
  for (r = 0; r < PH; r++) {
    var fy = (r + 0.5) / K / FS - 0.5, j = Math.max(0, Math.min(FH - 2, Math.floor(fy))), v = Math.max(0, Math.min(1, fy - j)), nrow = (r & 127) << 7;
    for (i = 0; i < FW; i++) { cd[i] = D[j * FW + i] * (1 - v) + D[(j + 1) * FW + i] * v; cp[i] = P[j * FW + i] * (1 - v) + P[(j + 1) * FW + i] * v; }
    for (x = 0; x < PW; x++) { var a = IX[x], u = UU[x], dv = cd[a] * (1 - u) + cd[a + 1] * u + (NS[nrow | (x & 127)] - 0.5) * 0.07; if (dv < 0) continue; var pv = cp[a] * (1 - u) + cp[a + 1] * u + (NS[nrow | ((x + 40) & 127)] - 0.5) * 0.07; KD[r * PW + x] = pv > 0 ? 2 : 1; }
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
  var lairX = cave.lair.x - ox, lairY = cave.lair.y - oy, tunY = (cave.tunnelY - oy) * K, tunX = cave.entrance.x - ox;
  for (py = 0; py < H2; py++) for (px = 0; px < W2; px++, pp += 4) {
    var gx = X0 + px, gy = Y0 + py, rr = 6, gg = 6, bb = 10;
    if (gx >= 0 && gy >= 0 && gx < PW && gy < PH) {
      var q = gy * PW + gx, kd = KD[q], n1 = NS[((gy & 127) << 7) | (gx & 127)], n2 = NS[(((gy * 2) & 127) << 7) | ((gx * 2) & 127)], wh = WS[((gy & 255) << 8) | (gx & 255)], bd = BD[q] * 0.5, bo = BO[q], oth = (bo >> 2) === kd ? (bo & 3) : (bo >> 2), a1 = A1[q], wx = gx + 0.5, wy = (gy + 0.5) / K;
      if (kd === 1) {                                     // the floor
        var soft = nsm(gx, gy * 1.3, 3.1), warm = nsm(gx + 300, gy * 1.3 + 170, 4.3), tr = trailAt(cave, ox + wx, oy + wy);
        rr = 86 + (soft - 0.5) * 30 + (n2 - 0.5) * 12; gg = 86 + (soft - 0.5) * 28 + (n2 - 0.5) * 12; bb = 98 + (soft - 0.5) * 26 + (n2 - 0.5) * 12;   // cool grey rock
        if (warm > 0.46) { var wk = sm(0.46, 0.56, warm) * 0.8; rr += (112 - rr) * wk; gg += (97 - gg) * wk; bb += (80 - bb) * wk; if (wh > 0.9) { rr += 20; gg += 18; bb += 14; } else if (wh < 0.08) { rr -= 16; gg -= 15; bb -= 12; } }   // earth and gravel in it, a speck a pebble
        var tw = 14 + n1 * 10; if (tr < tw + 10) { var tk = sm(tw + 10, tw - 2, tr) * 0.9; rr += (142 - rr) * tk; gg += (122 - gg) * tk; bb += (92 - bb) * tk; if (tr < tw * 0.5) { rr += 7; gg += 6; bb += 4; } if (wh > 0.95) { rr += 16; gg += 14; bb += 10; } }   // his path: trodden pale and warm down the middle of the way through
        for (k = 0; k < shafts.length; k++) { var sh = shafts[k], dn = Math.hypot((ox + wx - sh.x) / sh.rx, (oy + wy - sh.y) / sh.ry) + (n1 - 0.5) * 0.3; if (dn < 1.15) { var mk2 = sm(1.15, 0.5, dn) * (0.35 + soft * 0.75) * (tr < tw ? 0.35 : 1); if (mk2 > 1) mk2 = 1; var lit = n2 > 0.52; rr += ((lit ? 104 : 70) - rr) * mk2; gg += ((lit ? 132 : 100) - gg) * mk2; bb += ((lit ? 62 : 52) - bb) * mk2; } }   // moss where the daylight falls
        if (oth === 0 && bd < 22) { var ao = 1 - bd / 22; ao *= ao; rr *= 1 - 0.5 * ao; gg *= 1 - 0.47 * ao; bb *= 1 - 0.36 * ao; }   // the dark at a wall's foot
        if (oth === 2 && bd < 7) { if (bd < 1.3) { rr = 18; gg = 16; bb = 20; } else { var lp = 1 - bd / 7; rr += 30 * lp; gg += 28 * lp; bb += 26 * lp; } }   // the lip of the chasm: a pale edge, an ink line at the drop
        if (pool) { var pu = (ox + wx - pool.x) / pool.rx, pvv = (oy + wy - pool.y) / pool.ry, pd = Math.sqrt(pu * pu + pvv * pvv) + (n1 - 0.5) * 0.12; if (pd < 1.1) { if (pd > 1) { rr = rr * 0.72; gg = gg * 0.74; bb = bb * 0.8; } else { var dp = sm(1, 0.25, pd); rr = 70 - dp * 46 + (n2 - 0.5) * 6; gg = 104 - dp * 54 + (n2 - 0.5) * 6; bb = 112 - dp * 44 + (n2 - 0.5) * 6; if (pd > 0.93) { rr = 30; gg = 44; bb = 52; } else if (nsm(gx, gy * 2, 2) > 0.66) { rr += 14; gg += 18; bb += 20; } } } }   // the still pool: clear at its rim, dark in its middle
        if (gy > tunY && Math.abs(gx - tunX) < 80) { var dl2 = sm(tunY, tunY + 110, gy); rr += (255 - rr) * dl2; gg += (246 - gg) * dl2; bb += (216 - bb) * dl2; }   // the daylight at the foot of the tunnel
      } else if (kd === 0) {
        if (a1) {                                         // a wall that faces you
          var f = a1 / WALLH, tone = rockTone(gx, gy, a1, 1) + (n2 - 0.5) * 0.1, lt = Math.pow(1 - f, 1.35) * 0.96 + 0.03;
          var wet = sm(0.6, 0.72, vnoise(gx / 120, 7.7, 51)) * sm(0.5, 0.7, vnoise(gx / 6, 3.1, 50)); if (wet > 0.05) { tone *= 1 - wet * 0.36; if (n2 > 0.8 && wet > 0.6) tone += 0.3; }   // water running down
          rr = 100 * tone * lt; gg = 94 * tone * lt; bb = 108 * tone * lt + 14 * f;
          var rust = sm(0.62, 0.74, vnoise(gx / 70, 2.2, 53)) * sm(0.45, 0.7, vnoise(gx / 5, 9.9, 54)) * (1 - f); if (rust > 0.05) { rr += (128 * lt - rr) * rust * 0.6; gg += (88 * lt - gg) * rust * 0.6; bb += (58 * lt - bb) * rust * 0.6; }   // rust bled out of the rock
          if (a1 <= 1) { rr = 16; gg = 14; bb = 18; } else if (a1 <= 5 && KD[q + a1 * PW] === 1) { rr *= 1.16; gg *= 1.14; bb *= 1.1; }   // the line where it meets the floor, the floor's light on its foot
          if (gy + a1 > tunY && Math.abs(gx - tunX) < 90) { var dl3 = sm(tunY, tunY + 110, gy + a1) * (1 - f * 0.6); rr += (255 - rr) * dl3 * 0.7; gg += (240 - gg) * dl3 * 0.7; bb += (200 - bb) * dl3 * 0.7; }
        } else if (A2[q] || A3[q]) {                      // a side wall: lit where it faces west, dark where it faces east
          var west = A2[q] !== 0 && (A3[q] === 0 || A2[q] <= A3[q]), sd = west ? A2[q] : A3[q], fs = sd / WALLH, ts = (west ? 1.12 : 0.72) * (0.86 + (hash(Math.floor((sd + 4) / 11), west ? 3 : 4, 36) - 0.5) * 0.2 + (n2 - 0.5) * 0.12), ls = Math.pow(1 - fs, 1.35) * 0.96 + 0.03;
          if ((sd + 4) % 11 < 1.4) ts *= 0.78;
          rr = 100 * ts * ls; gg = 94 * ts * ls; bb = 108 * ts * ls + 14 * fs; if (sd <= 1) { rr = 16; gg = 14; bb = 18; }
        } else if (oth !== 0 && bd <= 7.5) {              // the near wall, its face turned away: a rim of rock, an ink line at the floor
          if (bd <= 1.4) { rr = 16; gg = 14; bb = 18; } else { var rim = (n1 > 0.5 ? 1.08 : 0.9) * (1 - (bd - 1.4) / 9); rr = 74 * rim; gg = 72 * rim; bb = 84 * rim; }
        } else { var fr = oth !== 0 ? Math.max(0, 1 - bd / 46) : 0, rk = 12 + fr * 22 + (n1 - 0.5) * (5 + fr * 8) + (n2 - 0.5) * fr * 6; rr = rk; gg = rk - 1; bb = rk + 6; }   // the rock itself, seen from above: dark stone by the floor, nothing further in (black is kept for the chasm)
      } else {                                            // the chasm
        var pa1 = a1, side2 = 0; if (!pa1) { if (A2[q] || A3[q]) { side2 = A2[q] !== 0 && (A3[q] === 0 || A2[q] <= A3[q]) ? 1 : 2; pa1 = side2 === 1 ? A2[q] : A3[q]; } }
        if (pa1) {
          var fp = pa1 / PITH, tp = (side2 ? (side2 === 1 ? 1.1 : 0.7) * (0.9 + (n2 - 0.5) * 0.14) : rockTone(gx, gy, pa1, 2) + (n2 - 0.5) * 0.1), lp2 = Math.pow(Math.max(0, 1 - fp * 1.45), 1.5) * 0.92;   // black by two thirds of the way down
          rr = 96 * tp * lp2 + 3; gg = 92 * tp * lp2 + 4; bb = 106 * tp * lp2 + 9 + 10 * Math.min(1, fp * 2) * lp2;
          if (pa1 <= 1) { rr = 16; gg = 14; bb = 18; } else if (pa1 <= 4 && !side2) { rr = 142; gg = 136; bb = 142; }   // the lip: lit stone over the ink
        } else { var mist = nsm(gx, gy * 2.2, 6); rr = 4 + mist * 5; gg = 5 + mist * 8; bb = 10 + mist * 18; }   // nothing: black, a breath of blue far down
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
  var CL = 15, gx, gy, lx = cave.lair.x - ox, ly = (cave.lair.y - oy) * K;
  for (gy = Math.floor((Y0 - M) / CL); gy <= Math.floor((Y0 + H2 + M) / CL); gy++) for (gx = Math.floor((X0 - M) / CL); gx <= Math.floor((X0 + W2 + M) / CL); gx++) {
    var h0 = hash(gx, gy, 65), sx = (gx + hash(gx, gy, 66)) * CL, sy = (gy + hash(gx, gy, 67)) * CL; if (kd(sx, sy) !== 1 || bdAt(sx, sy) < 7) continue;
    var wxx = ox + sx, wyy = oy + sy / K, tr = trailAt(cave, wxx, wyy), hz = hash(gx, gy, 71); if (Math.hypot((wxx - cave.pool.x) / cave.pool.rx, (wyy - cave.pool.y) / cave.pool.ry) < 1.05) continue;
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
  cave.shafts.forEach(function (s, si) { var sx = s.x - ox, sy = (s.y - oy) * K; if (sx < X0 - 120 || sx > X0 + W2 + 120 || sy < Y0 - 90 || sy > Y0 + H2 + 90) return;
    var n = Math.round(s.rx * 0.5), i2;
    for (i2 = 0; i2 < n; i2++) { var a = hash(i2, si, 81) * 6.283, rd = Math.sqrt(hash(i2, si, 82)), bx = sx + Math.cos(a) * rd * s.rx * 0.95, by = sy + Math.sin(a) * rd * s.ry * K * 0.95, hb = hash(i2, si, 83); if (kd(bx, by) !== 1 || trailAt(cave, ox + bx, oy + by / K) < 16 || Math.hypot((ox + bx - cave.pool.x) / (cave.pool.rx + 4), (oy + by / K - cave.pool.y) / (cave.pool.ry + 4)) < 1) continue;
      if (hb > 0.8) { g.strokeStyle = '#4f7a36'; g.lineWidth = 0.9; var fr; for (fr = -2; fr <= 2; fr++) { var ex = bx + fr * 4.4, ey = by - 9 + Math.abs(fr) * 2.2; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + fr * 1.6, by - 7, ex, ey); g.stroke(); for (k = 1; k <= 3; k++) { var t = k / 4, mx = bx + (ex - bx) * t + fr * 0.5, my = by + (ey - by) * t - 2 * Math.sin(t * 3.14); g.beginPath(); g.moveTo(mx - 1.6, my + 0.6); g.lineTo(mx + 1.6, my - 0.6); g.stroke(); } } }   // a fern
      else { g.lineWidth = 0.9; for (k = 0; k < 3; k++) { g.strokeStyle = (k + i2) % 2 ? '#86b450' : '#5d8a3a'; g.beginPath(); g.moveTo(bx + (k - 1) * 1.4, by); g.quadraticCurveTo(bx + (k - 1) * 2, by - 3, bx + (k - 1) * 2.6 + (hb - 0.5) * 2, by - 4.5 - hb * 3); g.stroke(); } }
    } });
  // the copper veins: green streaks up the walls that face you
  cave.veins.forEach(function (v) { var vx = v.x - ox, vy = (v.y - oy) * K; if (vx < X0 - 30 || vx > X0 + W2 + 30 || vy < Y0 - 60 || vy > Y0 + H2 + 10) return;
    var seg = 3 + (v.s % 3), hh = v.h * K, spent = v.left <= 0; g.strokeStyle = spent ? '#4a4540' : '#2f8a62'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(vx - 6, vy - 2);
    for (k = 1; k <= seg; k++) g.lineTo(vx - 6 + (12 / seg) * k + (hash(k, v.s, 1) - 0.5) * 5, vy - 2 - (hh - 5) * k / seg + (hash(k, v.s, 2) - 0.5) * 4);
    g.stroke(); g.strokeStyle = spent ? '#6a645e' : '#6fd19a'; g.lineWidth = 0.9; g.stroke();
    for (k = 0; k < 4 && !spent; k++) { g.fillStyle = 'rgba(80,190,130,0.7)'; g.beginPath(); g.arc(vx + (hash(k, v.s, 3) - 0.5) * 16, vy - hash(k, v.s, 4) * (hh - 4), 0.9 + hash(k, v.s, 5), 0, 7); g.fill(); } });
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
  for (k = 0; k < 3; k++) { var ph = (clock * 0.45 + k * 0.37) % 1, st = Math.floor(clock * 0.45 + k * 0.37), dx = (hash(k, st, 8) - 0.5) * pl.rx * 1.2, dy = (hash(k, st, 9) - 0.5) * pl.ry * 1.2; c.strokeStyle = 'rgba(190,220,230,' + (0.5 * (1 - ph)).toFixed(3) + ')'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(pl.x + dx, (pl.y + dy) * K, 2 + ph * 12, (2 + ph * 12) * K, 0, 0, 7); c.stroke(); }
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
  n.globalCompositeOperation = 'source-over'; n.clearRect(0, 0, W / 2, H / 2); n.fillStyle = 'rgba(3,4,10,0.972)'; n.fillRect(0, 0, W / 2, H / 2);
  n.globalCompositeOperation = 'destination-out';
  function hole(x, y, rx, ry, a) { var g = n.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(0.55, 'rgba(0,0,0,' + a * 0.6 + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); n.save(); n.translate(x, y); n.scale(1, ry / rx); n.translate(-x, -y); n.fillStyle = g; n.beginPath(); n.arc(x, y, rx, 0, 7); n.fill(); n.restore(); }   // (the gradient is made where it lies and the squash laid round it: one made at 0,0 under a translate drew a quarter of itself in the Node canvas)
  var tl = o.torch ? 1 + 0.03 * Math.sin(clock * 11) : 0, hr = (o.torch ? 190 + tl * 8 : 96) * z2;
  hole(sx(P.x), sy(P.y) - 6 * z2, hr, hr, 1);
  hole(sx(cave.exitAt.x), sy(cave.exitAt.y + 30), 150 * z2, 190 * z2, 0.5 + 0.45 * sun);                 // the daylight up the tunnel
  cave.shafts.forEach(function (s) { var x = sx(s.x), y = sy(s.y); if (x < -80 || x > W / 2 + 80 || y < -80 || y > H / 2 + 80) return; var a = Math.min(0.93, s.k * (0.14 + 0.8 * sun)); hole(x, y, s.rx * 1.9 * z2, s.ry * 1.9 * K2 * z2, a * 0.55); hole(x, y, s.rx * 1.1 * z2, s.ry * 1.1 * K2 * z2, a); });
  cave.ores.forEach(function (q) { if (q.dying == null) { var x = sx(q.x), y = sy(q.y) - 5 * z2; if (x > -30 && x < W / 2 + 30 && y > -30 && y < H / 2 + 30) hole(x, y, 34 * z2, 34 * z2, 0.62); } });
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
  if (o.torch) { var tx = px(P.x), ty = py(P.y) - 10 * cam.z, tg = c.createRadialGradient(tx, ty, 0, tx, ty, 150 * cam.z); tg.addColorStop(0, 'rgba(255,170,80,' + (0.22 + 0.03 * Math.sin(clock * 13)).toFixed(3) + ')'); tg.addColorStop(1, 'rgba(255,110,40,0)'); c.fillStyle = tg; c.beginPath(); c.arc(tx, ty, 150 * cam.z, 0, 7); c.fill(); }
  cave.ores.forEach(function (q) {                         // the copper in the rock shows warm
    if (q.dying != null) return; var x = px(q.x), y = py(q.y) - 6 * cam.z; if (x < -30 || x > W + 30 || y < -30 || y > H + 30) return;
    var g = c.createRadialGradient(x, y, 0, x, y, 15 * cam.z), a = 0.5 + 0.12 * Math.sin(clock * 2 + q.x); g.addColorStop(0, 'rgba(255,170,100,' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,110,50,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 15 * cam.z, 0, 7); c.fill();
  });
  c.restore();
}

/* What the hero has seen, for the chart in the corner: cells SEEN units wide. see() marks the floor within r of a point;
   drawChart draws the cave as far as it is known (the floor pale on dark, the pool, the chasm, the daylight of the tunnel
   and of the holes in the roof once seen) with the hero on it. */
function see(cave, x, y, r) {
  var i0 = Math.max(0, Math.floor((x - r - cave.ox) / SEEN)), i1 = Math.min(SW - 1, Math.floor((x + r - cave.ox) / SEEN)), j0 = Math.max(0, Math.floor((y - r - cave.oy) / SEEN)), j1 = Math.min(SH - 1, Math.floor((y + r - cave.oy) / SEEN)), i, j;
  for (j = j0; j <= j1; j++) for (i = i0; i <= i1; i++) { if (cave.seen[j * SW + i]) continue; var cx = cave.ox + (i + 0.5) * SEEN, cy = cave.oy + (j + 0.5) * SEEN; if (Math.hypot(cx - x, cy - y) > r) continue; var dv = dAt(cave, cx, cy); if (dv < -0.5) continue; cave.seen[j * SW + i] = pAt(cave, cx, cy) > 0 ? 3 : (dv < 0 ? 2 : 1); cave.seenDirty = true; }
}
function drawChart(c, cave, x, y, w, h, P) {
  if (!cave.chartCv) cave.chartCv = mkCanvas(SW, SH);
  var i, sc = Math.min(w / SW, h / SH), dw = SW * sc, dh = SH * sc, x0 = x + (w - dw) / 2, y0 = y + (h - dh) / 2;
  if (cave.seenDirty) {
    var g = cave.chartCv.getContext('2d'), img = g.createImageData(SW, SH), d = img.data, pl = cave.pool;
    for (i = 0; i < SW * SH; i++) { var s = cave.seen[i], cx = cave.ox + (i % SW + 0.5) * SEEN, cy = cave.oy + (Math.floor(i / SW) + 0.5) * SEEN, r = 0, gg = 0, b = 0, a = 0;
      if (s === 1) { r = 206; gg = 190; b = 150; a = 255; if (Math.hypot((cx - pl.x) / pl.rx, (cy - pl.y) / pl.ry) < 1) { r = 96; gg = 156; b = 176; } else if (cave.shafts.some(function (sh) { return Math.hypot((cx - sh.x) / sh.rx, (cy - sh.y) / sh.ry) < 0.8; }) || cy > cave.tunnelY) { r = 255; gg = 244; b = 196; } }
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

return { make: make, prepare: prepare, chunk: chunk, dirty: dirty, dAt: dAt, pAt: pAt, floor: floor, trailAt: trailAt, drawFloor: drawFloor, dark: dark, see: see, drawChart: drawChart, seenStr: seenStr, seenLoad: seenLoad,
  T: T, K: K, GW: GW, GH: GH, FS: FS, PW: PW, PH: PH, CS: CS, WALLH: WALLH, PITH: PITH };
})();
if (typeof module !== 'undefined') module.exports = Cave;
