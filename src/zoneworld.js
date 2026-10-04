var Zw = (function () {
'use strict';
var SL = StyleLab, kit = SL.kit, TW = kit.TW, TH = kit.TH, KY = 0.75;
var MW = 360, MH = 240, CT = 16, VW = 480, VH = 300;
var clamp = kit.clamp, lerp = kit.lerp, rng = kit.rng;
var STYLE = { factoryHue: 238, outsideHue: 152, accentHue: 42, shadowHue: 250, sat: 1.1, bright: -1, contrast: 1.12, shade: 0.55, round: 0.85, spindly: 0.12, lush: 0.95, twist: 0.12, sparkle: 0.8, texture: 0.6, outlineW: 1.1, outlineDark: 0.86, rough: 0.08, light: 0.5, fog: 0.3, glow: 0.9, vignette: 0.4, look: 1, seed: 7, scaleRef: 0 };
var TN = Object.keys(kit.TILES), TI = {}; TN.forEach(function (n, i) { TI[n] = i; });
var ZCOL = [[108, 111, 184], [91, 179, 111], [127, 196, 232], [224, 144, 63], [123, 196, 123], [127, 179, 214]];
var ZINFO = [
  { name: 'Factory', layer: 'none', biome: 'factory', amb: 0.42 },
  { name: 'Commons', layer: 'none', biome: 'meadow', amb: 0.68 },
  { name: 'Frost', layer: 'cold', biome: 'frost', amb: 0.72 },
  { name: 'Ember', layer: 'heat', biome: 'ember', amb: 0.5 },
  { name: 'Grove', layer: 'none', biome: 'grove', amb: 0.52 },
  { name: 'Hollow', layer: 'cold', biome: 'hollow', amb: 0.6 }
];
var THEME_NAMES = { grand: 'Grand hall', machine: 'Machine hall', boiler: 'Boiler hall', storage: 'Storage hall', mess: 'Mess hall', atrium: 'Collapsed atrium', control: 'Control gallery', workshop: 'Workshop hall', vault: 'Vault', gatehall: 'Gate hall' };
var W = null, props = [], buckets = [], sprites = {}, tileCv = {}, chunks = {}, chunkCount = 0, objs = [], gates = [], zones = [], sites = [], rooms = [];
var hero = null, cam = { x: 0, y: 0 }, parts = [], keys = {}, time = 0, ready = false, showGrid = false, hintsOn = true;
var jobs = [], jobTotal = 0, lastDt = 0.016, msg = { t: 0, s: '' }, ambNow = 0.4, tintNow = [0, 0, 0, 0], ambParts = [], roomFade = [], tut = { step: 0, t: 0, moved: 0, attacked: false };
var scratch = null, maskCv = null, maskCtx = null, maskImg = null;
var ATK = { wu: 0.06, ac: 0.1, rc: 0.15, arc: 2.4, blade: 26, reach: 34 };
var FOLIAGE = { bush: 'leaf', berryBush: 'leaf', fern: 'leaf', reeds: 'leaf', flower: 'petal', flowerBed: 'petal', tallGrass: 'leaf', bellFlower: 'glow', mushrooms: 'spore', snowBush: 'snow', emberBush: 'ember' };

/* ---------------- noise ---------------- */
function hash(x, y, s) { var h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y, s) { var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s) { return vnoise(x, y, s) * 0.6 + vnoise(x * 2.1, y * 2.1, s + 9) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 17) * 0.1; }
function warp(x, y, s) { return [x + (vnoise(x * 0.09, y * 0.09, s) - 0.5) * 12, y + (vnoise(x * 0.09 + 40, y * 0.09, s + 3) - 0.5) * 12]; }
var N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function ix(x, y) { return y * MW + x; }
function inb(x, y) { return x >= 0 && y >= 0 && x < MW && y < MH; }

/* ---------------- generation ---------------- */
function generate(seed) {
  var R = rng(seed * 977 + 13), att, i, j, k, x, y;
  var mirror = R() < 0.5, sgn = mirror ? -1 : 1;
  var FP = planFactory(R), rad0 = Math.hypot(FP.FW / 2, FP.FH / 2);
  var radii = [rad0, 64, 30, 30, 24, 15], par = [-1, 0, 1, 2, 1, 2];
  var er = Math.floor(R() * 2), Z = null, fcx, fcy;
  for (att = 0; att < 6000 && !Z; att++) {
    var sc = att < 2000 ? 1 : att < 4000 ? 0.9 : 0.8, ok = true, zz = [];
    fcx = Math.round(FP.FW / 2 + 3 + R() * (MW - FP.FW - 6)); fcy = Math.round(FP.FH / 2 + 3 + R() * (MH - FP.FH - 6));
    var fx0t = fcx - Math.floor(FP.FW / 2), fy0t = fcy - Math.floor(FP.FH / 2);
    var gcol0 = sgn > 0 ? fx0t + FP.FW - 1 : fx0t, gy0 = fy0t + 5 + (er ? FP.rh[0] + 2 : 0) + Math.floor(FP.rh[er] / 2), r1 = radii[1] * sc;
    zz[0] = { x: fcx, y: fcy, r: radii[0] };
    zz[1] = { x: gcol0 + sgn * r1 * 0.8, y: gy0 + (R() - 0.5) * 14, r: r1 };
    var hd = sgn > 0 ? 0 : Math.PI;
    for (k = 2; k <= 3; k++) { hd += (R() - 0.5) * 2.6; var rk = radii[k] * sc, d = zz[k - 1].r * 0.95 + rk * 0.95 + 1 + R() * 4; zz[k] = { x: zz[k - 1].x + Math.cos(hd) * d, y: zz[k - 1].y + Math.sin(hd) * d, r: rk }; }
    for (k = 1; k <= 3; k++) if (zz[k].x < zz[k].r * 0.5 || zz[k].x > MW - zz[k].r * 0.5 || zz[k].y < zz[k].r * 0.5 || zz[k].y > MH - zz[k].r * 0.5) ok = false;
    if (!ok) continue;
    for (k = 4; k <= 5; k++) {
      var p = par[k], best = null, bs = -1e9, rk2 = radii[k] * sc;
      for (j = 0; j < 24; j++) {
        var a = R() * 6.283, dd = zz[p].r * 0.95 + rk2 * 0.9, sx = zz[p].x + Math.cos(a) * dd, sy = zz[p].y + Math.sin(a) * dd;
        if (sx < rk2 * 0.6 || sx > MW - rk2 * 0.6 || sy < rk2 * 0.6 || sy > MH - rk2 * 0.6) continue;
        var m = 1e9; for (i = 0; i < zz.length; i++) { if (i === p) continue; m = Math.min(m, Math.hypot(sx - zz[i].x, sy - zz[i].y) - zz[i].r - rk2 * 0.9); }
        if (m > bs) { bs = m; best = { x: sx, y: sy, r: rk2 }; }
      }
      if (!best || bs < 1) { ok = false; break; } zz[k] = best;
    }
    if (!ok) continue;
    for (i = 1; i < zz.length && ok; i++) for (j = i + 1; j < zz.length; j++) { var linked = par[j] === i || par[i] === j; if (!linked && Math.hypot(zz[i].x - zz[j].x, zz[i].y - zz[j].y) < (zz[i].r + zz[j].r) * 0.95) { ok = false; break; } }
    if (!ok) continue;
    for (i = 2; i < zz.length; i++) if (Math.hypot(zz[i].x - fcx, zz[i].y - fcy) < zz[i].r * 0.9 + rad0 + 10) ok = false;
    if (ok) Z = zz;
  }
  if (!Z) return null;
  var fx0 = fcx - Math.floor(FP.FW / 2), fy0 = fcy - Math.floor(FP.FH / 2);
  var zid = new Int8Array(MW * MH).fill(-1), bar = new Uint8Array(MW * MH), bz = new Int8Array(MW * MH).fill(-1), tile = new Uint8Array(MW * MH), solid = new Uint8Array(MW * MH), rA = new Int16Array(MW * MH).fill(-1), rB = new Int16Array(MW * MH).fill(-1);
  for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
    if (x >= fx0 && x < fx0 + FP.FW && y >= fy0 && y < fy0 + FP.FH) { zid[ix(x, y)] = 0; continue; }
    var w = warp(x, y, seed), bi = -1, bd = 1e9;
    for (k = 1; k < Z.length; k++) { var dist = Math.hypot(w[0] - Z[k].x, w[1] - Z[k].y) / Z[k].r; if (dist < bd) { bd = dist; bi = k; } }
    zid[ix(x, y)] = bd > 1.18 ? -1 : bi;
  }
  function isLinked(a, b) { return par[a] === b || par[b] === a; }
  for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
    var a2 = zid[ix(x, y)]; if (a2 < 1) continue;
    for (i = 0; i < 8; i++) {
      var nx = x + N8[i][0], ny = y + N8[i][1], b2 = !inb(nx, ny) ? -1 : zid[ix(nx, ny)];
      if (b2 === a2) continue;
      if (b2 === -1) { bar[ix(x, y)] = 2; bz[ix(x, y)] = -1; break; }
      if (b2 === 0) continue;
      if (a2 > b2) { bar[ix(x, y)] = isLinked(a2, b2) ? 1 : 2; bz[ix(x, y)] = b2; break; }
    }
  }
  var G = [];
  var gcol = sgn > 0 ? fx0 + FP.FW - 1 : fx0, grow = fy0 + 5 + (er ? FP.rh[0] + 2 : 0) + Math.floor(FP.rh[er] / 2);
  G.push({ id: 0, from: 0, to: 1, tiles: [[gcol, grow - 2], [gcol, grow - 1], [gcol, grow], [gcol, grow + 1], [gcol, grow + 2]], cx: gcol, cy: grow, dx: sgn, dy: 0 });
  for (k = 2; k < Z.length; k++) {
    var pp = par[k], cands = [], mx = (Z[k].x + Z[pp].x) / 2, my = (Z[k].y + Z[pp].y) / 2;
    for (y = 2; y < MH - 2; y++) for (x = 2; x < MW - 2; x++) {
      if (zid[ix(x, y)] !== k || bar[ix(x, y)] !== 1 || bz[ix(x, y)] !== pp) continue;
      for (i = 0; i < 4; i++) {
        var ox = x + N4[i][0], oy = y + N4[i][1], ix2 = x - N4[i][0], iy2 = y - N4[i][1];
        if (zid[ix(ox, oy)] === pp && bar[ix(ox, oy)] === 0 && zid[ix(ix2, iy2)] === k && bar[ix(ix2, iy2)] === 0) { cands.push({ x: x, y: y, dx: N4[i][0], dy: N4[i][1], s: Math.hypot(x - mx, y - my) + R() * 6 }); break; }
      }
    }
    cands.sort(function (u, v) { return u.s - v.s; });
    var gate = null;
    for (i = 0; i < cands.length && !gate; i++) {
      var c0 = cands[i], px = -c0.dy, py = c0.dx, tl = [[c0.x, c0.y]], good = true;
      for (j = -1; j <= 1; j += 2) {
        var tx = c0.x + px * j, ty = c0.y + py * j;
        if (zid[ix(tx, ty)] === k && bar[ix(tx, ty)] === 1 && bz[ix(tx, ty)] === pp && zid[ix(tx + c0.dx, ty + c0.dy)] === pp && bar[ix(tx + c0.dx, ty + c0.dy)] === 0) tl.push([tx, ty]); else good = false;
      }
      if (good) gate = { id: G.length, from: pp, to: k, tiles: tl, cx: c0.x, cy: c0.y, dx: c0.dx, dy: c0.dy };
    }
    if (!gate) return null;
    G.push(gate);
  }
  var base = { seed: seed, mirror: mirror, sgn: sgn, Z: Z, par: par, fx0: fx0, fy0: fy0, fcx: fcx, fcy: fcy, er: er, FP: FP, zid: zid, bar: bar, bz: bz, tile: tile, solid: solid, rA: rA, rB: rB, gates: G, R: R };
  if (!buildFactory(base)) return null;
  G.forEach(function (g) { g.tiles.forEach(function (t) { bar[ix(t[0], t[1])] = 3; }); });
  buildTerrain(base);
  for (i = 0; i < MW * MH; i++) { var tn = TN[tile[i]]; solid[i] = (tn === 'voidT' || tn === 'water' || tn === 'lava') ? 1 : 0; if (bar[i] === 3 || bar[i] === 1 || bar[i] === 4 || bar[i] === 2) solid[i] = 1; }
  return base;
}

/* ---------------- the Factory: a few huge halls ---------------- */
function planFactory(R) {
  var cw = [], rh = [], c, r, wo = [34, 40, 46], ho = [22, 26];
  for (c = 0; c < 3; c++) cw.push(wo[Math.floor(R() * wo.length)]);
  for (r = 0; r < 2; r++) rh.push(ho[Math.floor(R() * ho.length)]);
  return { cw: cw, rh: rh, FW: 1 + cw[0] + cw[1] + cw[2] + 4 + 1, FH: 5 + rh[0] + 2 + rh[1] + 1 };
}
function buildFactory(B) {
  var R = B.R, FP = B.FP, fx0 = B.fx0, fy0 = B.fy0, sgn = B.sgn, zid = B.zid, bar = B.bar, tile = B.tile, rA = B.rA, rB = B.rB, G = B.gates, i, j, x, y, c, r;
  var colX = [fx0 + 1], rowY = [fy0 + 5];
  colX[1] = colX[0] + FP.cw[0] + 2; colX[2] = colX[1] + FP.cw[1] + 2; rowY[1] = rowY[0] + FP.rh[0] + 2;
  var halls = [];
  for (r = 0; r < 2; r++) for (c = 0; c < 3; c++) halls.push({ id: r * 3 + c, c: c, r: r, x0: colX[c], y0: rowY[r], w: FP.cw[c], h: FP.rh[r], theme: '', doors: [], occ: [], links: [], lanes: [] });
  function hall(cc, rr) { return (cc < 0 || rr < 0 || cc > 2 || rr > 1) ? null : halls[rr * 3 + cc]; }
  for (y = fy0; y < fy0 + FP.FH; y++) for (x = fx0; x < fx0 + FP.FW; x++) {
    var id = ix(x, y); tile[id] = TI.voidT; bar[id] = 1; rA[id] = -1; rB[id] = -1;
    if (y - fy0 < 5 && x > fx0 && x < fx0 + FP.FW - 1) bar[id] = 4;
  }
  halls.forEach(function (h) { for (y = h.y0; y < h.y0 + h.h; y++) for (x = h.x0; x < h.x0 + h.w; x++) { var id2 = ix(x, y); bar[id2] = 0; tile[id2] = TI.plate; rA[id2] = h.id; } });
  function adj(h) { var o = []; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var n = hall(h.c + d[0], h.r + d[1]); if (n) o.push(n); }); return o; }
  var exitCol = sgn > 0 ? 2 : 0, exitHall = hall(exitCol, B.er), startHall = hall(sgn > 0 ? 0 : 2, Math.floor(R() * 2)), vault = null, tree = null, tries = 0;
  while (tries++ < 60 && !tree) {
    var seen = {}, edges = [], stack = [startHall], dist = {}; seen[startHall.id] = 1; dist[startHall.id] = 0;
    while (stack.length) {
      var cur = stack[stack.length - 1], nb = adj(cur).filter(function (n) { return !seen[n.id]; });
      if (!nb.length) { stack.pop(); continue; }
      var nx = nb[Math.floor(R() * nb.length)]; seen[nx.id] = 1; edges.push([cur.id, nx.id]); dist[nx.id] = dist[cur.id] + 1; stack.push(nx);
    }
    var order = halls.filter(function (h) { return h !== startHall && h !== exitHall; }).sort(function (a, b) { return dist[b.id] - dist[a.id] + (R() - 0.5) * 0.9; });
    if (order.length) { vault = order[0]; tree = edges; }
  }
  if (!tree) return false;
  var all = tree.map(function (e) { return [e[0], e[1]]; }), extra = 0;
  for (j = 0; j < 40 && extra < 2; j++) {
    var ha = halls[Math.floor(R() * halls.length)], nbs = adj(ha), hb = nbs[Math.floor(R() * nbs.length)], key = Math.min(ha.id, hb.id) + ',' + Math.max(ha.id, hb.id);
    if (all.some(function (e) { return Math.min(e[0], e[1]) + ',' + Math.max(e[0], e[1]) === key; })) continue;
    all.push([ha.id, hb.id]); extra++;
  }
  var openings = [];
  function openTile(xx, yy) { var id = ix(xx, yy); bar[id] = 0; tile[id] = TI.plate; }
  all.forEach(function (e) {
    var A = halls[e[0]], Bm = halls[e[1]], horiz = A.r === Bm.r, lo, hi, n = 1, k2, wd = 6;
    A.links.push(Bm.id); Bm.links.push(A.id);
    if (horiz) {
      lo = A.c < Bm.c ? A : Bm; hi = lo === A ? Bm : A;
      var dxs = lo.x0 + lo.w, span = lo.h - 6 - 4;
      if (lo.h >= 26 && R() < 0.5) n = 2;
      for (k2 = 0; k2 < n; k2++) {
        var oy = lo.y0 + 3 + Math.floor(R() * Math.max(1, span)); if (n === 2) oy = lo.y0 + 3 + (k2 ? Math.floor(span * 0.62) : 0) + Math.floor(R() * Math.floor(span * 0.34));
        for (j = 0; j < wd; j++) { openTile(dxs, oy + j); openTile(dxs + 1, oy + j); }
        var op = { x: (dxs + 1) * 32, y: (oy + wd / 2) * 32, horiz: true, a: lo.id, b: hi.id }; openings.push(op);
        lo.doors.push(op); hi.doors.push(op);
      }
    } else {
      lo = A.r < Bm.r ? A : Bm; hi = lo === A ? Bm : A;
      var dys = lo.y0 + lo.h, span2 = lo.w - 6 - 6;
      if (lo.w >= 40 && R() < 0.6) n = 2;
      for (k2 = 0; k2 < n; k2++) {
        var ox = lo.x0 + 3 + Math.floor(R() * Math.max(1, span2)); if (n === 2) ox = lo.x0 + 3 + (k2 ? Math.floor(span2 * 0.6) : 0) + Math.floor(R() * Math.floor(span2 * 0.34));
        for (j = 0; j < wd; j++) { openTile(ox + j, dys); openTile(ox + j, dys + 1); }
        var op2 = { x: (ox + wd / 2) * 32, y: (dys + 1) * 32, horiz: false, a: lo.id, b: hi.id }; openings.push(op2);
        lo.doors.push(op2); hi.doors.push(op2);
      }
    }
  });
  // wall tiles take the fog of the halls beside them
  function hallAt(xx, yy) { return inb(xx, yy) && zid[ix(xx, yy)] === 0 && bar[ix(xx, yy)] === 0 ? rA[ix(xx, yy)] : -1; }
  for (y = fy0; y < fy0 + FP.FH; y++) for (x = fx0; x < fx0 + FP.FW; x++) {
    var id3 = ix(x, y); if (bar[id3] === 0) continue;
    var found = [];
    N4.forEach(function (d) { for (var st = 1; st <= 6; st++) { var hh = hallAt(x + d[0] * st, y + d[1] * st); if (hh >= 0) { if (found.indexOf(hh) < 0) found.push(hh); break; } if (!inb(x + d[0] * st, y + d[1] * st) || zid[ix(x + d[0] * st, y + d[1] * st)] !== 0) break; } });
    rA[id3] = found.length ? found[0] : -1; rB[id3] = found.length > 1 ? found[1] : -1;
  }
  // the exit gate on the outer wall of the exit hall
  var gate0 = G[0];
  gate0.tiles.forEach(function (t) { openTile(t[0], t[1]); });
  exitHall.doors.push({ x: gate0.cx * 32 + 16, y: gate0.cy * 32 + 16, horiz: true, a: exitHall.id, b: -1 });
  startHall.theme = 'grand'; vault.theme = 'vault'; exitHall.theme = 'gatehall';
  var pool = ['machine', 'boiler', 'storage', 'mess', 'atrium', 'control', 'workshop'].sort(function () { return R() - 0.5; });
  halls.forEach(function (h) { if (!h.theme) h.theme = pool.shift() || 'storage'; h.name = THEME_NAMES[h.theme]; });
  halls.forEach(function (h) {
    for (y = 0; y < h.h; y++) for (x = 0; x < h.w; x++) {
      var id4 = ix(h.x0 + x, h.y0 + y), tt = 'plate', th = h.theme;
      if ((th === 'machine' || th === 'boiler') && (y === Math.floor(h.h / 2)) && x >= 4 && x <= h.w - 5) tt = 'grate';
      else if (th === 'grand' && (x === Math.floor(h.w / 2) || x === Math.floor(h.w / 2) + 1) && y >= 2 && y <= h.h - 3 && y % 3 !== 0) tt = 'grate';
      else if (th === 'vault' && Math.hypot(x - h.w / 2, (y - h.h / 2) * 1.3) > 4 && Math.hypot(x - h.w / 2, (y - h.h / 2) * 1.3) < 5.4) tt = 'grate';
      tile[id4] = TI[tt];
    }
  });
  B.emblems = [{ x: (startHall.x0 + startHall.w / 2) * 32, y: (startHall.y0 + startHall.h / 2) * 32, kind: 'gear', r: 110 }, { x: (vault.x0 + vault.w / 2) * 32, y: (vault.y0 + vault.h / 2) * 32, kind: 'ring', r: 150 }];
  B.rooms = halls; B.startRoom = startHall; B.vault = vault; B.exitRoom = exitHall; B.openings = openings;
  return true;
}

/* ---------------- terrain, sites, rivers, paths ---------------- */
function buildTerrain(B) {
  var R = B.R, seed = B.seed, Z = B.Z, zid = B.zid, bar = B.bar, tile = B.tile, G = B.gates, par = B.par, i, j, k, x, y;
  var ponds = [];
  for (k = 1; k < Z.length; k++) {
    var np = k === 1 ? 3 : (k >= 4 ? 1 : 2);
    for (i = 0; i < np; i++) { var pc = null; for (j = 0; j < 40 && !pc; j++) { var ang = R() * 6.283, rr = R() * Z[k].r * 0.6, qx = Math.round(Z[k].x + Math.cos(ang) * rr), qy = Math.round(Z[k].y + Math.sin(ang) * rr); if (qx > 3 && qy > 3 && qx < MW - 3 && qy < MH - 3 && zid[ix(qx, qy)] === k && bar[ix(qx, qy)] === 0) pc = { x: qx, y: qy, r: (k === 3 ? 2 + R() * 1.6 : (k === 1 ? 4 + R() * 4 : 3 + R() * 3.4)), z: k }; } if (pc) ponds.push(pc); }
  }
  var zoneBiome = ZINFO.map(function (z) { return z.biome; });
  for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
    var z = zid[ix(x, y)]; if (z < 1) { if (z < 0) tile[ix(x, y)] = TI.voidT; continue; }
    var t = 'voidT';
    if (bar[ix(x, y)] !== 0) { tile[ix(x, y)] = TI.voidT; continue; }
    var b = zoneBiome[z], m = fbm(x / 9, y / 9, seed + 3), f = fbm(x / 7 + 30, y / 7, seed + 5), d = fbm(x / 5, y / 5 + 50, seed + 7), h = hash(x, y, 1), op = fbm(x / 22 + 100, y / 22, seed + 11);
    if (b === 'meadow') { t = 'grass'; var ff = f - (op - 0.5) * 0.55; if (ff > 0.56) t = 'grassDark'; if (ff > 0.63 && h < 0.45) t = 'leaves'; if (m > 0.68 && ff > 0.4) t = 'moss'; if (d > 0.74 && ff < 0.5) t = 'dirt'; }
    else if (b === 'grove') { t = 'grassDark'; if (f > 0.5 && h < 0.5) t = 'leaves'; if (m > 0.52) t = 'moss'; if (f < 0.32) t = 'grass'; }
    else if (b === 'frost') { t = 'snow'; if (f > 0.56) t = 'snowDark'; if (d > 0.72 && f < 0.56) t = 'rock'; }
    else if (b === 'hollow') { t = 'snowDark'; if (f > 0.45) t = 'rock'; if (m > 0.55) t = 'snow'; }
    else if (b === 'ember') { t = 'ash'; if (f > 0.56) t = 'char'; if (d > 0.7) t = 'basalt'; if (m > 0.66) t = 'crack'; }
    for (i = 0; i < ponds.length; i++) {
      var pd = ponds[i]; if (pd.z !== z) continue;
      var dd2 = Math.hypot(x - pd.x, y - pd.y), thr = pd.r * (0.75 + 0.5 * vnoise(x * 0.7, y * 0.7, 11 + i));
      if (dd2 < thr) t = (b === 'meadow' || b === 'grove') ? 'water' : (b === 'ember' ? 'lava' : 'ice'); else if (dd2 < thr + 1.1 && t !== 'water' && t !== 'ice' && t !== 'lava') t = (b === 'meadow' || b === 'grove') ? 'shore' : (b === 'ember' ? 'basalt' : t);
    }
    tile[ix(x, y)] = TI[t];
  }
  // Commons: rivers and sites
  function setT(x2, y2, t2, force) { if (!inb(x2, y2)) return; var id = ix(x2, y2); if (zid[id] !== 1 || bar[id] !== 0) return; if (!force && TN[tile[id]] === 'water') return; tile[id] = TI[t2]; }
  function disc(cx, cy, r, fn) { for (var yy = Math.floor(cy - r - 2); yy <= cy + r + 2; yy++) for (var xx = Math.floor(cx - r - 2); xx <= cx + r + 2; xx++) { var dd = Math.hypot(xx - cx, (yy - cy) * 1.0) / (r * (0.88 + 0.24 * vnoise(xx * 0.5, yy * 0.5, seed + 31))); if (dd <= 1.3) fn(xx, yy, dd); } }
  function carveLine(ax, ay, bx, by, wid, type, shoreW, wob) {
    var steps = Math.ceil(Math.hypot(bx - ax, by - ay) * 2), s, ph = R() * 6, nxn = -(by - ay), nyn = (bx - ax), nl = Math.hypot(nxn, nyn) || 1;
    for (s = 0; s <= steps; s++) {
      var t3 = s / steps, px = ax + (bx - ax) * t3 + nxn / nl * Math.sin(t3 * 7 + ph) * wob * Math.sin(t3 * Math.PI), py = ay + (by - ay) * t3 + nyn / nl * Math.sin(t3 * 7 + ph) * wob * Math.sin(t3 * Math.PI);
      for (var oy = -Math.ceil(shoreW + 1); oy <= Math.ceil(shoreW + 1); oy++) for (var ox = -Math.ceil(shoreW + 1); ox <= Math.ceil(shoreW + 1); ox++) {
        var qx = Math.round(px) + ox, qy = Math.round(py) + oy, dd = Math.hypot(qx - px, qy - py);
        if (dd <= wid) setT(qx, qy, type, true); else if (dd <= shoreW && shoreW > wid) setT(qx, qy, 'shore');
      }
    }
  }
  var Zc = Z[1], rivers = [];
  function farFromGates(px, py, dmin) { for (var q = 0; q < G.length; q++) if (Math.hypot(px - G[q].cx, py - G[q].cy) < dmin) return false; return true; }
  for (i = 0; i < 2; i++) {
    for (j = 0; j < 40; j++) {
      var a1 = R() * 6.283, a2 = a1 + 2.2 + R() * 1.6, r1 = Zc.r * (0.65 + R() * 0.3), r2 = Zc.r * (0.65 + R() * 0.3);
      var ax = Zc.x + Math.cos(a1) * r1, ay = Zc.y + Math.sin(a1) * r1, bx = Zc.x + Math.cos(a2) * r2, by = Zc.y + Math.sin(a2) * r2;
      if (!farFromGates((ax + bx) / 2, (ay + by) / 2, 14)) continue;
      rivers.push([ax, ay, bx, by]); carveLine(ax, ay, bx, by, 1.4, 'water', 2.7, 7 + R() * 5); break;
    }
  }
  var sitesL = [], bag = ['lake', 'waterfall', 'grove', 'ruins', 'orchard', 'meadow', 'stones', 'farm', 'glade', 'bog', 'lookout', 'lake', 'meadow', 'glade'], types = [], nTry;
  while (bag.length) types.push(bag.splice(Math.floor(R() * bag.length), 1)[0]);
  for (nTry = 0; nTry < 2500 && sitesL.length < 13; nTry++) {
    var sa = R() * 6.283, sr = Math.sqrt(R()) * Zc.r * 0.92, sx = Math.round(Zc.x + Math.cos(sa) * sr), sy = Math.round(Zc.y + Math.sin(sa) * sr);
    if (!inb(sx, sy) || zid[ix(sx, sy)] !== 1 || bar[ix(sx, sy)] !== 0) continue;
    var ok = !farFromGates(sx, sy, 18) ? false : true; if (!ok) continue;
    for (k = 0; k < sitesL.length; k++) if (Math.hypot(sx - sitesL[k].x, sy - sitesL[k].y) < 24) { ok = false; break; }
    if (!ok) continue;
    var edge = false; for (k = 0; k < 16 && !edge; k++) { var ea = k / 16 * 6.283, ex = Math.round(sx + Math.cos(ea) * 11), ey = Math.round(sy + Math.sin(ea) * 11); if (!inb(ex, ey) || zid[ix(ex, ey)] !== 1 || bar[ix(ex, ey)] !== 0) edge = true; }
    if (edge) continue;
    sitesL.push({ x: sx, y: sy, r: 8 + Math.floor(R() * 4), type: types[sitesL.length % types.length] });
  }
  var SITEN = { lake: 'Lakeside meadow', waterfall: 'Waterfall pool', grove: 'Ancient grove', ruins: 'Old ruins', orchard: 'Blossom orchard', meadow: 'Flower meadow', stones: 'Standing stones', farm: 'Old farmstead', glade: 'Forest glade', bog: 'Misty bog', lookout: 'Lookout rise' };
  sitesL.forEach(function (s, n) {
    s.name = SITEN[s.type]; s.id = n;
    // clear open ground and base ground type
    var gt = s.type === 'grove' ? 'moss' : (s.type === 'bog' ? 'moss' : 'grass');
    disc(s.x, s.y, s.r * 1.05, function (x2, y2, d2) { if (d2 <= 1) { var id = ix(x2, y2); if (inb(x2, y2) && TN[tile[id]] !== 'water' && TN[tile[id]] !== 'shore' && TN[tile[id]] !== 'plank') setT(x2, y2, (s.type === 'grove' && hash(x2, y2, 8) < 0.4) ? 'leaves' : gt); } });
    var ty = s.type;
    if (ty === 'lake') { disc(s.x, s.y, s.r * 0.72, function (x2, y2, d2) { if (d2 <= 1) setT(x2, y2, 'water', true); else if (d2 <= 1.3) setT(x2, y2, 'shore'); }); }
    else if (ty === 'waterfall') {
      disc(s.x, s.y - s.r * 0.7, s.r * 0.5, function (x2, y2, d2) { if (d2 <= 1) setT(x2, y2, 'rock', true); });
      disc(s.x, s.y + 1, s.r * 0.32, function (x2, y2, d2) { if (d2 <= 1) setT(x2, y2, 'water', true); else if (d2 <= 1.35) setT(x2, y2, 'shore'); });
      carveLine(s.x, s.y + 3, s.x + (R() - 0.5) * 8, s.y + 22, 1.1, 'water', 2.2, 2);
    }
    else if (ty === 'stones') disc(s.x, s.y, s.r * 0.8, function (x2, y2, d2) { if (d2 <= 1) setT(x2, y2, 'moss'); });
    else if (ty === 'lookout') disc(s.x, s.y, s.r * 0.5, function (x2, y2, d2) { if (d2 <= 1) setT(x2, y2, 'rock', true); });
    else if (ty === 'farm') { for (var fy2 = -3; fy2 <= 3; fy2++) for (var fx2 = -7; fx2 <= 7; fx2++) if (fy2 % 2 === 0) setT(s.x + fx2, s.y + fy2 + 2, 'dirt'); }
    else if (ty === 'bog') {
      for (j = 0; j < 4; j++) { var ba = R() * 6.283, br = R() * s.r * 0.6; disc(s.x + Math.cos(ba) * br, s.y + Math.sin(ba) * br, 2 + R() * 1.6, function (x2, y2, d2) { if (d2 <= 1) setT(x2, y2, 'water', true); else if (d2 <= 1.3) setT(x2, y2, 'shore'); }); }
    }
  });
  // paths: minimum spanning tree between entry, sites and exits, planks over water
  var entry = {}, exits = {};
  G.forEach(function (g) { if (g.internal) return; var ex = g.cx + g.dx, ey = g.cy + g.dy; entry[g.to] = [ex, ey]; (exits[g.from] = exits[g.from] || []).push([g.cx - g.dx, g.cy - g.dy]); });
  function carvePath(ax, ay, bx, by, wid, sd) {
    var steps = Math.ceil(Math.hypot(bx - ax, by - ay) * 2), s, ph = R() * 6, nxn = -(by - ay), nyn = (bx - ax), nl = Math.hypot(nxn, nyn) || 1;
    for (s = 0; s <= steps; s++) {
      var t3 = s / steps, px = ax + (bx - ax) * t3 + nxn / nl * Math.sin(t3 * 6 + ph) * 3 * Math.sin(t3 * Math.PI), py = ay + (by - ay) * t3 + nyn / nl * Math.sin(t3 * 6 + ph) * 3 * Math.sin(t3 * Math.PI);
      for (var oy = -2; oy <= 2; oy++) for (var ox = -2; ox <= 2; ox++) {
        var qx = Math.round(px) + ox, qy = Math.round(py) + oy; if (!inb(qx, qy) || Math.hypot(qx - px, qy - py) > wid) continue;
        var qi = ix(qx, qy); if (zid[qi] !== sd || bar[qi] !== 0) continue;
        var tn2 = TN[tile[qi]]; tile[qi] = (tn2 === 'water' || tn2 === 'ice' || tn2 === 'lava') ? (tn2 === 'lava' ? tile[qi] : TI.plank) : TI.path;
      }
    }
  }
  function mst(nodes, sd, wide) {
    var inTree = [0], rest = [], e, bi, bj, bd;
    for (i = 1; i < nodes.length; i++) rest.push(i);
    while (rest.length) {
      bd = 1e9; bi = -1; bj = -1;
      inTree.forEach(function (a) { rest.forEach(function (b) { var d = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]); if (d < bd) { bd = d; bi = a; bj = b; } }); });
      carvePath(nodes[bi][0], nodes[bi][1], nodes[bj][0], nodes[bj][1], (nodes[bi][2] || nodes[bj][2]) ? wide : 0.7, sd); inTree.push(bj); rest.splice(rest.indexOf(bj), 1);
    }
  }
  for (k = 2; k < Z.length; k++) {
    var en = entry[k]; if (!en) continue;
    var nodes = [[en[0], en[1], true]]; nodes.push([Math.round(Z[k].x + (R() - 0.5) * 8), Math.round(Z[k].y + (R() - 0.5) * 8), false]);
    (exits[k] || []).forEach(function (e2) { nodes.push([e2[0], e2[1], true]); });
    mst(nodes, k, 1.15);
  }
  function dryNear(px, py) {
    for (var rr = 0; rr < 16; rr++) for (var oy = -rr; oy <= rr; oy++) for (var ox = -rr; ox <= rr; ox++) {
      if (Math.max(Math.abs(ox), Math.abs(oy)) !== rr) continue;
      var qx = Math.round(px) + ox, qy = Math.round(py) + oy; if (!inb(qx, qy)) continue;
      var qi = ix(qx, qy), tn3 = TN[tile[qi]];
      if (zid[qi] === 1 && bar[qi] === 0 && tn3 !== 'water' && tn3 !== 'shore' && tn3 !== 'plank' && tn3 !== 'rock') return [qx, qy];
    }
    return [Math.round(px), Math.round(py)];
  }
  var cn = [];
  if (entry[1]) cn.push([entry[1][0], entry[1][1], true]);
  sitesL.forEach(function (s) { var d = s.type === 'lake' ? dryNear(s.x - s.r * 0.72 - 3, s.y) : s.type === 'waterfall' ? dryNear(s.x - 4, s.y + 6) : dryNear(s.x, s.y); s.px = d[0]; s.py = d[1]; cn.push([d[0], d[1], false]); });
  (exits[1] || []).forEach(function (e2) { cn.push([e2[0], e2[1], true]); });
  if (cn.length > 1) mst(cn, 1, 1.0);
  carvePath(G[0].cx + B.sgn, G[0].cy, G[0].cx + B.sgn * 8, G[0].cy, 1.3, 1);
  B.sites = sitesL; B.rivers = rivers;
}


/* ---------------- props, objects, mechanisms ---------------- */
var BREAKABLE = { crate: 1, barrel: 1, chair: 1, table: 1 };
var VARIANTS = {}, TREES = {}, MACH = {}, ROCKS = { rock: 1, snowRock: 1, emberRock: 1 };
['oak', 'pine', 'pineBig', 'birch', 'cypress', 'blossom', 'willow', 'snowPine', 'snowPineBig', 'deadTree', 'ancient'].forEach(function (n) { VARIANTS[n] = 4; TREES[n] = 1; });
['engine', 'vat', 'tank', 'furnace', 'conveyor', 'console', 'workbench', 'shelf'].forEach(function (n) { VARIANTS[n] = 6; MACH[n] = 1; });
['flower', 'flowerBed', 'fern', 'tallGrass', 'bush', 'berryBush', 'snowBush', 'emberBush', 'mushrooms', 'bellFlower', 'rubble', 'scrap', 'reeds', 'iceCrystal', 'vent', 'lamp', 'lampDead', 'crate', 'barrel', 'chair', 'table', 'cable', 'brokenPillar', 'banner', 'bench', 'haystack', 'standingStone'].forEach(function (n) { VARIANTS[n] = 6; });
var FLIPOK = { flower: 1, flowerBed: 1, tallGrass: 1, fern: 1, reeds: 1, bellFlower: 1, mushRing: 1 };
['rock', 'snowRock', 'emberRock'].forEach(function (n) { VARIANTS[n] = 8; });
var STRUCT = { wallTop: 1, wallFace: 1, wallCol: 1, pendant: 1, wallLamp: 1, wallBlock: 1, cliff: 1, gateBar: 1, gateLock: 1, gatePost: 1, backWall: 1, backWallDoor: 1, pillar: 1, pillarMid: 1, pedestal: 1, dock: 1, waterWheel: 1, waterfall: 1, skylight: 1 };
var NOSHADOW = { wallTop: 1, wallFace: 1, wallCol: 1, pendant: 1, wallLamp: 1, flower: 1, flowerBed: 1, tallGrass: 1, reeds: 1, steamVent: 1, skylight: 1, banner: 1, backWall: 1, backWallDoor: 1, wallBlock: 1, cliff: 1, gateBar: 1, gateLock: 1, bellFlower: 1, cable: 1, mushRing: 1 };
var CR = { pillarMid: 12, chair: 6, table: 22, engine: 44, gearBig: 0, steamVent: 0, banner: 0, skylight: 0, lampDead: 4, bed: 14, locker: 9, shelf: 15, furnace: 24, valve: 10, tank: 24, vat: 22, workbench: 20, conveyor: 14, console: 15, cable: 6, scrap: 14, crate: 12, barrel: 8, lamp: 4, pillar: 12, rubble: 14, brokenPillar: 12, pedestal: 12, fern: 0, tallGrass: 0 };
function addProp(name, px, py, r, o) {
  o = o || {};
  var st = !!STRUCT[name], V = VARIANTS[name] || 3, h1 = hash(px * 0.071, py * 0.093, 7), h2 = hash(px * 0.057, py * 0.113, 9), h3 = hash(px * 0.101, py * 0.043, 11);
  var sd = st ? (o.exact ? (o.seed || 0) : (o.seed || 0) % 3) : Math.floor(hash(px * 0.131, py * 0.173, 5) * V);
  var sc = st ? 1 : (TREES[name] ? 0.82 + h1 * 0.4 : (MACH[name] ? 0.94 + h1 * 0.14 : (ROCKS[name] ? 0.9 + h1 * 0.25 : 0.88 + h1 * 0.26)));
  props.push({ name: name, seed: sd, sc: sc, flip: st ? false : (!!FLIPOK[name] && h2 < 0.5), lean: (TREES[name] || FLIPOK[name]) ? (h3 - 0.5) * (TREES[name] ? 0.06 : 0.04) : 0, x: px, y: py, r: r || 0, r2: o.r2 || null, alpha: 1, under: !!o.under, shake: 0, kind: o.kind || null, fixed: !!o.fixed, room: o.room != null ? o.room : null, keep: !!o.keep, breakable: o.breakable != null ? !!o.breakable : !!BREAKABLE[name], grp: o.grp != null ? o.grp : null, dead: false }); return props[props.length - 1]; }
function solidTile(i) { var tn = TN[W.tile[i]]; return tn === 'voidT' || tn === 'water' || tn === 'lava'; }
function bfsReach(sx, sy) {
  var seen = new Uint8Array(MW * MH), q = [[sx, sy]], h = 0; seen[ix(sx, sy)] = 1;
  while (h < q.length) { var c = q[h++]; for (var i = 0; i < 4; i++) { var nx = c[0] + N4[i][0], ny = c[1] + N4[i][1]; if (!inb(nx, ny)) continue; var ni = ix(nx, ny); if (seen[ni]) continue; var b = W.bar[ni]; if (b === 1 || b === 2 || b === 4) continue; if (b !== 3 && solidTile(ni)) continue; seen[ni] = 1; q.push([nx, ny]); } }
  return seen;
}
function genContent(seed) {
  var R = rng(seed * 313 + 7), i, j, k, x, y, Z = W.Z, zid = W.zid, bar = W.bar, tile = W.tile;
  props = []; objs = []; gates = W.gates; sites = W.sites; rooms = W.rooms;
  var fx0 = W.fx0, fy0 = W.fy0, sgn = W.sgn;
  // ---- Factory shell
  var FP = W.FP, totalW = FP.FW - 2, segs = Math.ceil(totalW / 15), si;
  W.beams = [];
  function hallForX(tx) { var best = rooms[0], bd = 1e9; rooms.forEach(function (h) { if (h.r !== 0) return; var d = tx < h.x0 ? h.x0 - tx : (tx > h.x0 + h.w ? tx - h.x0 - h.w : 0); if (d < bd) { bd = d; best = h; } }); return best.id; }
  for (si = 0; si < segs; si++) {
    var segTiles = Math.min(15, totalW - si * 15), sx = (fx0 + 1 + si * 15) * 32, hid = hallForX(fx0 + 1 + si * 15 + segTiles / 2);
    var bp = addProp('backWall', sx, fy0 * 32, 0, { under: true, fixed: true, seed: si, room: hid }); bp.cropW = segTiles * 32;
    for (k = 0; k < 6; k++) { var wxo = 44 + 80 * k; if (wxo > bp.cropW - 20) break; W.beams.push({ x: sx + wxo, y: (fy0 + 5) * 32, room: hid }); }
  }
  function isWall(tx, ty) { if (!inb(tx, ty)) return false; var b = bar[ix(tx, ty)]; return (b === 1 || b === 4) && zid[ix(tx, ty)] === 0; }
  for (y = fy0; y < fy0 + FP.FH; y++) for (x = fx0; x < fx0 + FP.FW; x++) if (bar[ix(x, y)] === 1) {
    var south = isWall(x, y + 1), eL = !isWall(x - 1, y), eR = !isWall(x + 1, y), eN = !isWall(x, y - 1);
    var run = Math.floor(hash(Math.floor(x / 7), Math.floor(y / 3), 21) * 3), v = run === 2 && x % 7 !== 3 ? 0 : run;
    var q = v + 3 * ((eL ? 1 : 0) | (eR ? 2 : 0) | (eN ? 4 : 0));
    addProp(south ? 'wallTop' : 'wallFace', x * 32 + 16, (y + 1) * 32, 0, { seed: 3 + q * 7 - 3 + 0, exact: true });
    props[props.length - 1].seed = q;
    if (!south && (eL || eR || (x - fx0) % 9 === 0)) { var coff = (eL && eR) ? 0 : eL ? -12 : eR ? 12 : 0; var cp = addProp('wallCol', x * 32 + 16 + coff, (y + 1) * 32 + 0.4, 0, { seed: 0, exact: true }); }
  }
  gates.forEach(function (g) {
    g.tiles.forEach(function (t, n) { var p = addProp(n === Math.floor(g.tiles.length / 2) ? 'gateLock' : 'gateBar', t[0] * 32 + 16, (t[1] + 1) * 32, 0, { seed: g.id, kind: 'gate' }); p.gate = g.id; });
    var px = -g.dy, py = g.dx, half = (g.tiles.length - 1) / 2 + 1.7;
    [-half, half].forEach(function (s2, n) { addProp('gatePost', (g.cx + px * s2) * 32 + 16, (g.cy + py * s2 + 1) * 32, 6, { seed: n + 1 }); });
  });
  // ---- Factory halls: sparse, readable, abandoned
  function laneDist(h, px, py) { var md = 1e9; h.lanes.forEach(function (l) { var dx = l[2] - l[0], dy = l[3] - l[1], t = clamp(((px - l[0]) * dx + (py - l[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1); md = Math.min(md, Math.hypot(px - (l[0] + dx * t), py - (l[1] + dy * t))); }); return md; }
  rooms.forEach(function (h) {
    var cen = [(h.x0 + h.w / 2) * 32, (h.y0 + h.h / 2) * 32], pts = h.doors.map(function (d) { return [d.x, d.y]; }), i2, j2;
    pts.forEach(function (p) { h.lanes.push([p[0], p[1], cen[0], cen[1]]); });
    for (i2 = 0; i2 < pts.length; i2++) for (j2 = i2 + 1; j2 < pts.length; j2++) h.lanes.push([pts[i2][0], pts[i2][1], pts[j2][0], pts[j2][1]]);
  });
  function okSpot(h, px, py, rad, collide, margin) {
    if (px < (h.x0 + margin) * 32 || px > (h.x0 + h.w - margin) * 32 || py < (h.y0 + margin) * 32 || py > (h.y0 + h.h - margin) * 32) return false;
    var q; for (q = 0; q < h.doors.length; q++) if (Math.hypot(px - h.doors[q].x, py - h.doors[q].y) < (collide ? 170 : 70) + rad) return false;
    if (collide) { if (laneDist(h, px, py) < 54 + rad) return false; for (q = 0; q < h.occ.length; q++) if (Math.hypot(px - h.occ[q][0], py - h.occ[q][1]) < h.occ[q][2] + rad + 44) return false; }
    else for (q = 0; q < h.occ.length; q++) if (Math.hypot(px - h.occ[q][0], py - h.occ[q][1]) < h.occ[q][2] * 0.7) return false;
    return true;
  }
  function pos(h, mode) {
    if (mode === 'north') return [(h.x0 + 2 + R() * (h.w - 4)) * 32, (h.y0 + 1.5) * 32, 1];
    if (mode === 'wall') { var side = Math.floor(R() * 4); if (side === 0) return [(h.x0 + 2 + R() * (h.w - 4)) * 32, (h.y0 + 1.6) * 32, 1]; if (side === 1) return [(h.x0 + 2 + R() * (h.w - 4)) * 32, (h.y0 + h.h - 1.4) * 32, 1]; if (side === 2) return [(h.x0 + 1.6) * 32, (h.y0 + 3 + R() * (h.h - 6)) * 32, 1]; return [(h.x0 + h.w - 1.6) * 32, (h.y0 + 3 + R() * (h.h - 6)) * 32, 1]; }
    return [(h.x0 + 3 + R() * (h.w - 6)) * 32, (h.y0 + 3 + R() * (h.h - 6)) * 32, 2.5];
  }
  function place(h, name, mode, o) {
    var rad = CR[name] != null ? CR[name] : 10, collide = rad > 0 && name !== 'lampDead';
    for (var t = 0; t < 90; t++) {
      var p = pos(h, mode || 'free'); if (!okSpot(h, p[0], p[1], rad, collide, p[2])) continue;
      if (collide) h.occ.push([p[0], p[1], rad]); else if (rad === 0) h.occ.push([p[0], p[1], 6]);
      o = o || {}; o.seed = o.seed != null ? o.seed : Math.floor(R() * 3); if (name === 'workbench') o.r2 = [-18, 18]; if (name === 'conveyor') o.r2 = [-34, 34]; if (name === 'engine') o.r2 = [-40, 40];
      return addProp(name, p[0], p[1], rad, o);
    }
    return null;
  }
  function many(h, name, n, mode) { for (var q = 0; q < n; q++) place(h, name, mode); }
  function tableSet(h, mode, nChairs) {
    for (var t = 0; t < 60; t++) {
      var p = pos(h, mode || 'free'); if (!okSpot(h, p[0], p[1], 40, true, p[2] + 1)) continue;
      h.occ.push([p[0], p[1], 40]); addProp('table', p[0], p[1], 22, { seed: Math.floor(R() * 3), r2: [-14, 14] });
      var offs = [[-34, 6], [34, 8], [-12, 30], [14, 28], [0, -22]];
      for (var q = 0; q < nChairs; q++) { var ch = offs[q], tilt = (R() - 0.5) * 8; addProp('chair', p[0] + ch[0] + tilt, p[1] + ch[1], 6, { seed: q }); }
      return true;
    }
    return false;
  }
  function cluster(h, mode) {
    for (var t = 0; t < 60; t++) {
      var p = pos(h, mode || 'wall'); if (!okSpot(h, p[0], p[1], 46, true, p[2])) continue;
      h.occ.push([p[0], p[1], 46]); var n = 2 + Math.floor(R() * 3);
      for (var q = 0; q < n; q++) addProp(R() < 0.55 ? 'crate' : 'barrel', p[0] + (R() - 0.5) * 56, p[1] + (R() - 0.5) * 22, 11, { seed: q });
      return;
    }
  }
  function decor(h, name, n) { for (var q = 0; q < n; q++) place(h, name, 'free'); }
  function lightHall(h) {
    if (h.theme === 'atrium' || h.theme === 'vault' || h.theme === 'gatehall') { } else {
      var spots = [], gx = 14, tx, ri;
      [0.3, 0.7].forEach(function (fy, r2) { for (tx = 7 + (r2 ? gx / 2 : 0); tx < h.w - 4; tx += gx) spots.push([(h.x0 + tx) * 32, (h.y0 + h.h * fy) * 32]); });
      var placed = [];
      spots.forEach(function (p) { for (var q = 0; q < h.doors.length; q++) if (Math.hypot(p[0] - h.doors[q].x, p[1] - h.doors[q].y) < 70) return; for (q = 0; q < placed.length; q++) if (Math.hypot(p[0] - placed[q][0], p[1] - placed[q][1]) < 300) return; placed.push(p); addProp('pendant', p[0], p[1], 0, { seed: 0, exact: true }); });
    }
    for (var wx = 6; wx < h.w - 3; wx += 13) { var wpx = (h.x0 + wx + hash(h.id, wx, 31) * 2) * 32; if (okSpot(h, wpx, (h.y0 + 0.2) * 32, 0, false, 0)) addProp('wallLamp', wpx, h.y0 * 32 + 10, 0, { seed: 0, exact: true }); }
  }
  rooms.forEach(function (h) {
    var th = h.theme, bx;
    if (h.r === 0 || h.theme === 'grand') for (bx = 3; bx < h.w - 3; bx += 10) { var nbx = (h.x0 + bx + R() * 3) * 32; if (okSpot(h, nbx, (h.y0 + 0.6) * 32, 0, false, 0)) addProp('banner', nbx, (h.y0 + 0.3) * 32, 0, { seed: Math.floor(R() * 3) }); }
    if (th === 'grand') {
      var sx0 = (h.x0 + h.w * 0.2) * 32, sy0 = (h.y0 + h.h / 2) * 32; h.occ.push([sx0, sy0, 90]);
      tableSet(h, 'wall', 4); tableSet(h, 'wall', 3); for (var q = 0; q < 2; q++) cluster(h, 'wall'); decor(h, 'scrap', 3); decor(h, 'cable', 3);
    }
    else if (th === 'machine') { many(h, 'engine', 2); many(h, 'conveyor', 2); many(h, 'console', 2, 'north'); decor(h, 'steamVent', 3); many(h, 'tank', 1); cluster(h, 'wall'); }
    else if (th === 'boiler') { many(h, 'furnace', 3, 'north'); many(h, 'valve', 4, 'north'); many(h, 'tank', 2); many(h, 'engine', 1); decor(h, 'steamVent', 4); cluster(h, 'wall'); }
    else if (th === 'storage') { for (var c2 = 0; c2 < 7; c2++) cluster(h, c2 < 5 ? 'wall' : 'free'); many(h, 'shelf', 3, 'north'); decor(h, 'scrap', 2); }
    else if (th === 'mess') { for (var t2 = 0; t2 < 5; t2++) tableSet(h, 'free', 3 + (t2 % 2)); decor(h, 'cable', 2); }
    else if (th === 'atrium') { addProp('skylight', (h.x0 + h.w / 2) * 32, (h.y0 + h.h / 2) * 32, 0, { seed: 0 }); many(h, 'rubble', 4); decor(h, 'rubble', 7); many(h, 'brokenPillar', 4); decor(h, 'fern', 14); decor(h, 'tallGrass', 10); decor(h, 'bellFlower', 4); }
    else if (th === 'control') { many(h, 'console', 4, 'north'); tableSet(h, 'free', 3); tableSet(h, 'wall', 2); many(h, 'shelf', 2, 'north'); many(h, 'workbench', 1); decor(h, 'cable', 4); }
    else if (th === 'workshop') { many(h, 'workbench', 3); many(h, 'shelf', 3, 'north'); many(h, 'vat', 2); cluster(h, 'wall'); decor(h, 'scrap', 2); }
    else if (th === 'vault') {
      var cxv = (h.x0 + h.w / 2) * 32, cyv = (h.y0 + h.h / 2) * 32;
      addProp('pedestal', cxv, cyv, 12, { seed: 0 }); h.occ.push([cxv, cyv, 50]);
      for (var li = 0; li < 3; li++) { var la = li / 3 * 6.283 + 0.5; addProp('pendant', cxv + Math.cos(la) * 5.5 * 32, cyv + Math.sin(la) * 3.6 * 32, 0, { seed: 0, exact: true }); }
      objs.push({ type: 'key', gate: 0, x: cxv, y: cyv - 14, got: false, seen: false });
    }
    else if (th === 'gatehall') {
      var gg = gates[0], gsx = gg.cx * 32 + 16, gsy = gg.cy * 32 + 16;
      [-3.4, 3.4].forEach(function (dy, n) { addProp('pendant', gsx - W.sgn * 110, gsy + dy * 32, 0, { seed: 0, exact: true }); });
      tableSet(h, 'wall', 3); for (var cq = 0; cq < 2; cq++) cluster(h, 'wall'); decor(h, 'scrap', 2);
    }
  });
  rooms.forEach(lightHall);
  gates[0].mech = { type: 'key', label: 'Find the key' };
  W.start = { x: (W.startRoom.x0 + W.startRoom.w * 0.2) * 32, y: (W.startRoom.y0 + W.startRoom.h / 2) * 32 };
  // ---- the Commons and other zones
  var zoneBiome = ZINFO.map(function (z) { return z.biome; });
  function nearGate(tx, ty, dd) { for (var q = 0; q < gates.length; q++) if (!gates[q].internal && Math.hypot(tx - gates[q].cx, ty - gates[q].cy) < dd) return true; return false; }
  function inSite(tx, ty, m) { for (var q = 0; q < sites.length; q++) if (Math.hypot(tx - sites[q].x, ty - sites[q].y) < sites[q].r * (m || 1.1)) return true; return false; }
  function tAt(tx, ty) { return TN[tile[ix(tx, ty)]]; }
  function T2P(name, tx, ty, rad, o) { return addProp(name, tx * 32 + 16, ty * 32 + 16, rad, o); }
  sites.forEach(function (s) {
    var R2 = rng(seed * 91 + s.id * 7 + 3), cx = s.x, cy = s.y, r = s.r, n, a;
    function ring(cnt, rad, fn) { for (var q = 0; q < cnt; q++) { var an = q / cnt * 6.283 + R2() * 0.25; fn(cx + Math.cos(an) * rad, cy + Math.sin(an) * rad, q, an); } }
    function scatter(name, cnt, rad, rr, o) { for (var q = 0; q < cnt; q++) { var an = R2() * 6.283, d = Math.sqrt(R2()) * rad; T2P(name, cx + Math.cos(an) * d, cy + Math.sin(an) * d, rr || 0, o ? JSON.parse(JSON.stringify(o)) : { seed: Math.floor(R2() * 3) }); } }
    var ty = s.type;
    if (ty === 'lake') { var wr = r * 0.72; T2P('dock', cx - wr - 0.2, cy + 1, 0, { keep: true }); T2P('bench', cx - wr - 3, cy - 2, 0, { seed: 1 }); T2P('lamp', cx - wr - 3.5, cy + 3, 4, {}); ring(2, wr + 2.5, function (px, py, q) { if (px > cx) T2P('willow', px, py, 12, { seed: q }); }); T2P('willow', cx + wr + 2, cy - 2, 12, { seed: 1 }); scatter('flowerBed', 6, r * 1.0, 0); scatter('bush', 3, r, 8); }
    else if (ty === 'waterfall') { T2P('waterfall', cx, cy - 2, 0, { seed: 0 }); T2P('waterWheel', cx + 4, cy + 10, 0, { keep: true }); scatter('rock', 4, r, 8); scatter('fern', 8, r, 0); T2P('mushRing', cx - 5, cy + 6, 0, {}); T2P('bench', cx - 6, cy + 2, 0, { seed: 1 }); scatter('flowerBed', 3, r, 0); }
    else if (ty === 'grove') { T2P('ancient', cx, cy, 22, { seed: 1 }); ring(6, r * 0.85, function (px, py, q) { T2P(['birch', 'blossom', 'oak'][q % 3], px, py, q % 3 === 2 ? 9 : 6, { seed: q }); }); ring(6, 4.5, function (px, py) { T2P('bellFlower', px, py, 0, { seed: Math.floor(R2() * 3) }); }); T2P('mushRing', cx - 7, cy + 4, 0, {}); T2P('mushRing', cx + 7, cy + 3, 0, {}); scatter('fern', 8, r, 0); }
    else if (ty === 'ruins') { T2P('ruinHouse', cx - 4, cy + 1, 28, { seed: 1, r2: [-26, 26] }); T2P('well', cx + 6, cy + 3, 14, {}); scatter('rubble', 5, r * 0.8, 0, { seed: 1 }); scatter('fern', 10, r, 0); scatter('tallGrass', 6, r, 0); scatter('bellFlower', 3, r, 0); T2P('mushrooms', cx + 3, cy - 3, 0, {}); }
    else if (ty === 'orchard') { for (var oy = 0; oy < 3; oy++) for (var ox = 0; ox < 4; ox++) T2P('blossom', cx - 8.5 + ox * 5.6, cy - 6 + oy * 5.2, 9, { seed: ox + oy }); scatter('flowerBed', 6, r, 0); T2P('lamp', cx - 10, cy, 4, {}); T2P('lamp', cx + 10, cy, 4, {}); T2P('bench', cx, cy + 9, 0, { seed: 2 }); T2P('haystack', cx + 11, cy + 6, 14, {}); T2P('scarecrow', cx - 11, cy + 6, 6, {}); }
    else if (ty === 'meadow') { scatter('flowerBed', 26, r * 1.05, 0); scatter('tallGrass', 14, r, 0); scatter('bellFlower', 8, r, 0); scatter('rock', 3, r, 8); T2P(R2() < 0.5 ? 'blossom' : 'willow', cx, cy, 10, { seed: 2 }); T2P('bench', cx + 4, cy + 2, 0, { seed: 0 }); T2P('mushRing', cx - 6, cy + 5, 0, {}); }
    else if (ty === 'stones') { ring(8, 5.6, function (px, py, q) { T2P('standingStone', px, py, 6, { seed: q }); }); T2P('mushRing', cx, cy, 0, {}); T2P('rock', cx + 1.5, cy + 1, 8, { seed: 0 }); ring(2, r * 1.1, function (px, py, q) { T2P('pine', px, py, 9, { seed: q }); }); scatter('fern', 6, r, 0); }
    else if (ty === 'farm') { for (var fi = -4; fi <= 4; fi++) { T2P('fence', cx + fi * 2.35 - 1, cy - 4.4, 0, { seed: fi + 5 }); T2P('fence', cx + fi * 2.35 - 1, cy + 6.8, 0, { seed: fi + 6 }); } T2P('haystack', cx - 9, cy + 1, 14, {}); T2P('haystack', cx + 9, cy - 1, 14, { seed: 1 }); T2P('haystack', cx + 10, cy + 3, 14, { seed: 2 }); T2P('cart', cx - 11, cy + 4, 20, { r2: [-20, 20] }); T2P('scarecrow', cx - 2, cy + 2, 6, {}); T2P('scarecrow', cx + 4, cy + 4, 6, { seed: 1 }); T2P('well', cx + 12, cy - 4, 14, {}); T2P('ruinHouse', cx - 14, cy - 5, 28, { seed: 2, r2: [-26, 26] }); scatter('flowerBed', 4, r, 0); }
    else if (ty === 'glade') { T2P('campfire', cx, cy, 8, {}); [[-3.5, 1.5], [3.5, 1.2], [0, 4]].forEach(function (p, q) { T2P('log', cx + p[0], cy + p[1], 10, { seed: q, r2: [-14, 14] }); }); T2P('lamp', cx - 6, cy - 3, 4, {}); T2P('lamp', cx + 6, cy - 3, 4, {}); T2P('bench', cx - 5, cy + 4, 0, { seed: 1 }); T2P('mushRing', cx + 6, cy + 5, 0, {}); scatter('flowerBed', 8, r, 0); scatter('fern', 4, r, 0); }
    else if (ty === 'bog') { scatter('reeds', 16, r * 0.9, 0); ring(3, r * 0.8, function (px, py, q) { T2P('willow', px, py, 12, { seed: q }); }); scatter('mushrooms', 6, r, 0); scatter('fern', 6, r, 0); for (var bx = -s.r; bx <= s.r; bx++) { var bi = ix(cx + bx, cy); if (inb(cx + bx, cy) && zid[bi] === 1 && bar[bi] === 0) { tile[bi] = TI.plank; W.solid[bi] = 0; } } }
    else if (ty === 'lookout') { T2P('signpost', cx - 3, cy + 3, 4, {}); T2P('bench', cx + 2, cy + 1, 0, { seed: 1 }); T2P('bench', cx - 2, cy - 1, 0, { seed: 2 }); T2P('lamp', cx + 4, cy - 2, 4, {}); scatter('rock', 4, r, 8); scatter('flowerBed', 8, r, 0); scatter('tallGrass', 6, r, 0); }
  });
  // trees and bushes
  var treeKinds = { meadow: ['oak', 'pine', 'pineBig', 'birch', 'cypress', 'oak', 'blossom', 'birch', 'pine', 'willow', 'cypress', 'blossom'], grove: ['oak', 'blossom', 'birch', 'oak', 'ancient', 'birch'], frost: ['snowPine', 'snowPineBig', 'snowPine', 'snowPine'], hollow: ['iceCrystalBig', 'snowRock', 'iceCrystal'], ember: ['deadTree', 'deadTree', 'deadTree', 'ventBig'] };
  for (y = 3; y < MH - 3; y += 3) for (x = 3; x < MW - 3; x += 3) {
    var jx = x + (R() - 0.5) * 2.4, jy = y + (R() - 0.5) * 2.4, tx = Math.floor(jx), ty2 = Math.floor(jy), z = zid[ix(tx, ty2)];
    if (z < 1 || bar[ix(tx, ty2)] !== 0 || nearGate(tx, ty2, 6)) continue;
    if (z === 1 && inSite(tx, ty2, 1.15)) continue;
    var tn = tAt(tx, ty2); if (tn === 'path' || tn === 'water' || tn === 'shore' || tn === 'ice' || tn === 'lava' || tn === 'plank') continue;
    var bi = zoneBiome[z], f = fbm(jx / 7 + 30, jy / 7, W.seed + 5), op = fbm(jx / 22 + 100, jy / 22, W.seed + 11);
    if (bi === 'meadow') f -= (op - 0.5) * 0.55;
    var treeLim = (bi === 'ember') ? 0.52 : (bi === 'hollow' ? 0.45 : 0.56);
    if (f > treeLim) {
      var list = treeKinds[bi], kind = list[Math.floor(R() * list.length)];
      if (kind === 'willow') { var nw = false; for (var wy = -3; wy <= 3; wy++) for (var wx = -3; wx <= 3; wx++) if (inb(tx + wx, ty2 + wy) && TN[tile[ix(tx + wx, ty2 + wy)]] === 'water') nw = true; if (!nw) kind = 'oak'; }
      var rad = kind === 'pineBig' || kind === 'snowPineBig' ? 10 : (kind === 'birch' || kind === 'cypress' ? 6 : (kind === 'ancient' ? 20 : (kind === 'iceCrystalBig' || kind === 'ventBig' ? 12 : (kind === 'snowRock' || kind === 'iceCrystal' ? 8 : 9))));
      addProp(kind, jx * 32, jy * 32 + 16, rad, { seed: Math.floor(R() * 3) });
    } else if (R() < 0.3) {
      var bk = bi === 'frost' || bi === 'hollow' ? 'snowBush' : bi === 'ember' ? 'emberBush' : (R() < 0.5 ? 'bush' : 'berryBush');
      addProp(bk, jx * 32, jy * 32, 8, { seed: Math.floor(R() * 3) });
    }
  }
  for (y = 2; y < MH - 2; y++) for (x = 2; x < MW - 2; x++) {
    var z2 = zid[ix(x, y)]; if (z2 < 1 || bar[ix(x, y)] !== 0 || nearGate(x, y, 4)) continue;
    if (z2 === 1 && inSite(x, y, 1.0)) continue;
    var t2 = tAt(x, y), r = R(), px = (x + R()) * 32, py = (y + R()) * 32, sd = Math.floor(R() * 3);
    if (t2 === 'grass') { if (r < 0.05) addProp('flower', px, py, 0, { seed: sd }); else if (r < 0.058) addProp('flowerBed', px, py, 0, { seed: sd }); else if (r < 0.068) addProp('tallGrass', px, py, 0, { seed: sd }); else if (r < 0.08) addProp('fern', px, py, 0, { seed: sd }); else if (r < 0.087) addProp('rock', px, py, 8, { seed: sd }); else if (r < 0.093) addProp('bellFlower', px, py, 0, { seed: sd }); }
    else if (t2 === 'grassDark' || t2 === 'leaves') { if (r < 0.04) addProp('fern', px, py, 0, { seed: sd }); else if (r < 0.052) addProp('mushrooms', px, py, 0, { seed: sd }); else if (r < 0.06) addProp('bellFlower', px, py, 0, { seed: sd }); else if (r < 0.065) addProp('rock', px, py, 8, { seed: sd }); else if (r < 0.07) addProp('tallGrass', px, py, 0, { seed: sd }); }
    else if (t2 === 'moss') { if (r < 0.06) addProp('mushrooms', px, py, 0, { seed: sd }); else if (r < 0.1) addProp('fern', px, py, 0, { seed: sd }); }
    else if (t2 === 'shore') { if (r < 0.2) addProp('reeds', px, py, 0, { seed: sd }); }
    else if (t2 === 'snow') { if (r < 0.025) addProp('snowRock', px, py, 8, { seed: sd }); else if (r < 0.04) addProp('snowBush', px, py, 8, { seed: sd }); else if (r < 0.046) addProp('iceCrystal', px, py, 8, { seed: sd }); }
    else if (t2 === 'snowDark' || t2 === 'rock') { if (r < 0.03) addProp('snowRock', px, py, 8, { seed: sd }); else if (r < 0.042) addProp('iceCrystal', px, py, 8, { seed: sd }); }
    else if (t2 === 'ash') { if (r < 0.025) addProp('emberRock', px, py, 8, { seed: sd }); else if (r < 0.04) addProp('emberBush', px, py, 8, { seed: sd }); }
    else if (t2 === 'char') { if (r < 0.04) addProp('emberBush', px, py, 8, { seed: sd }); else if (r < 0.052) addProp('vent', px, py, 8, { seed: sd }); }
    else if (t2 === 'basalt') { if (r < 0.05) addProp('emberRock', px, py, 8, { seed: sd }); else if (r < 0.06) addProp('vent', px, py, 8, { seed: sd }); }
  }
  for (k = 2; k < Z.length; k++) {
    var cx2 = Math.round(Z[k].x), cy2 = Math.round(Z[k].y), bi2 = zoneBiome[k];
    var lm = bi2 === 'grove' ? 'ancient' : bi2 === 'frost' || bi2 === 'hollow' ? 'iceCrystalBig' : 'ventBig', rr = lm === 'ancient' ? 20 : 12;
    for (j = 0; j < 40; j++) { var qx = cx2 + Math.round((R() - 0.5) * 8), qy = cy2 + Math.round((R() - 0.5) * 8), qi = ix(qx, qy); if (zid[qi] === k && bar[qi] === 0 && !solidTile(qi) && TN[tile[qi]] !== 'path') { addProp(lm, qx * 32 + 16, qy * 32 + 16, rr, { seed: k }); break; } }
  }
  for (y = 3; y < MH - 3; y += 2) for (x = 3; x < MW - 3; x += 2) {
    if (TN[tile[ix(x, y)]] !== 'path' || zid[ix(x, y)] < 1) continue;
    if (hash(x, y, 91) < 0.03 && (x + y) % 2 === 0) { var side = (hash(x, y, 92) < 0.5 ? -1 : 1), lx = x + side * 2, ly = y; if (TN[tile[ix(lx, ly)]] !== 'path' && !solidTile(ix(lx, ly)) && zid[ix(lx, ly)] === zid[ix(x, y)] && bar[ix(lx, ly)] === 0) addProp('lamp', lx * 32 + 16, ly * 32 + 16, 4, { seed: x + y }); }
  }
  props = props.filter(function (p) {
    if (p.fixed || p.keep || p.kind === 'gate' || p.name.indexOf('wall') === 0 || p.name === 'cliff' || p.name === 'pillar' || p.grp != null) return true;
    var tx = Math.floor(p.x / 32), ty3 = Math.floor(p.y / 32);
    if (!inb(tx, ty3)) return false;
    var i2 = ix(tx, ty3); if (W.solid[i2] || bar[i2] !== 0) return false;
    if (p.r > 0 && TN[tile[i2]] === 'path' && zid[i2] > 0) return false;
    if (zid[i2] === 0 && p.room == null && p.name !== 'wallBlock') { var rr2 = W.rA[i2]; if (rr2 < 0) return false; }
    return true;
  });
  props.sort(function (a, b) { return a.y - b.y; });
  buckets = [];
  var bw = Math.ceil(MW / CT), bh = Math.ceil(MH / CT);
  for (i = 0; i < bw * bh; i++) buckets.push([]);
  props.forEach(function (p) { var bx = clamp(Math.floor(p.x / 32 / CT), 0, bw - 1), by = clamp(Math.floor(p.y / 32 / CT), 0, bh - 1); buckets[by * bw + bx].push(p); p.bx = bx; p.by = by; });
  // ---- external gate mechanisms
  var reach = bfsReach(Math.floor(W.start.x / 32), Math.floor(W.start.y / 32));
  function propNear(px, py, rad) { var bx = Math.floor(px / 32 / CT), by = Math.floor(py / 32 / CT); for (var yy = by - 1; yy <= by + 1; yy++) for (var xx = bx - 1; xx <= bx + 1; xx++) { if (xx < 0 || yy < 0 || xx >= bw || yy >= bh) continue; var bk = buckets[yy * bw + xx]; for (var q = 0; q < bk.length; q++) { var p = bk[q]; if (p.r > 0 && Math.hypot(p.x - px, p.y - py) < p.r + rad) return true; } } return false; }
  function pickTile(zone, minD, maxD, fromG) {
    for (var t = 0; t < 1500; t++) {
      var xx = Math.floor(R() * MW), yy = Math.floor(R() * MH), qi = ix(xx, yy);
      if (!reach[qi] || zid[qi] !== zone || bar[qi] !== 0 || solidTile(qi) || TN[tile[qi]] === 'path' || TN[tile[qi]] === 'plank') continue;
      var dg = Math.hypot(xx - fromG.cx, yy - fromG.cy); if (dg < minD || dg > maxD) continue;
      if (nearGate(xx, yy, 6)) continue;
      var px = xx * 32 + 16, py = yy * 32 + 16; if (propNear(px, py, 22)) continue;
      return [px, py];
    }
    return null;
  }
  var ext = gates.filter(function (g) { return !g.internal; }), g1 = ext[1], g2 = ext[2], g3 = ext[3], g4 = ext[4];
  [0, 1].forEach(function (n) { var p = pickTile(g1.from, 12, 150, g1); if (p) objs.push({ type: 'lever', gate: g1.id, idx: n, x: p[0], y: p[1], on: false, seen: false }); });
  g1.mech = { type: 'levers', need: 2, label: 'Hit both levers with your sword' };
  var pb = pickTile(g2.from, 10, 60, g2); if (pb) objs.push({ type: 'bell', gate: g2.id, x: pb[0], y: pb[1], hits: 0, shake: 0, seen: false });
  g2.mech = { type: 'strike', need: 3, label: 'Ring the bell three times' };
  var pl = pickTile(g3.from, 12, 150, g3); if (pl) objs.push({ type: 'lever', gate: g3.id, idx: 0, x: pl[0], y: pl[1], on: false, seen: false });
  g3.mech = { type: 'levers', need: 1, label: 'Hit the lever' };
  var pl2 = pickTile(g4.from, 8, 60, g4); if (pl2) objs.push({ type: 'lever', gate: g4.id, idx: 0, x: pl2[0], y: pl2[1], on: false, seen: false });
  g4.mech = { type: 'levers', need: 1, label: 'Hit the lever' };
  var okm = true;
  gates.forEach(function (g) { var mine = objs.filter(function (o) { return o.gate === g.id; }); var need = g.mech && (g.mech.type === 'key' ? 1 : g.mech.type === 'fuses' ? 2 : g.mech.type === 'levers' ? g.mech.need : 1); if (!g.mech || mine.length < need) okm = false; });
  W.contentOk = okm;
}

var roomSeen = [];
/* ---------------- sprites, tiles, chunks ---------------- */
function getSprite(name, seed) { var k = name + ':' + seed; if (!sprites[k]) sprites[k] = kit.bakeProp(name, 3 + seed * 7, { vary: !STRUCT[name] && name !== 'keyItem' && name !== 'fuseItem' && name !== 'leverOn' && name !== 'leverOff' && name !== 'bell' }); return sprites[k]; }
var prefetchTick = 0;
function prefetchSprites() {
  var bw = Math.ceil(MW / CT), bx = Math.floor(hero.x / 32 / CT), by = Math.floor(hero.y / 32 / CT), yy, xx, i;
  for (yy = by - 2; yy <= by + 2; yy++) for (xx = bx - 2; xx <= bx + 2; xx++) { if (xx < 0 || yy < 0 || xx >= bw || yy >= Math.ceil(MH / CT)) continue; var bk = buckets[yy * bw + xx]; for (i = 0; i < bk.length; i++) { var p = bk[i]; if (!sprites[p.name + ':' + p.seed]) { getSprite(p.name, p.seed); return; } } }
}
function variantOf(x, y, type) { var r = hash(x, y, 41); if (type === 'plate') return r < 0.42 ? 0 : r < 0.68 ? 1 : r < 0.9 ? 2 : 3; return Math.floor(r * kit.TILES[type].n) % kit.TILES[type].n; }
var SIDES = [['n', 0, -1], ['s', 0, 1], ['w', -1, 0], ['e', 1, 0]];
function isOutside(t) { return t !== 'plate' && t !== 'grate' && t !== 'puddle' && t !== 'voidT'; }
function bakeChunk(cx, cy) {
  var w = CT * TW, h = CT * TH, cv = kit.mk(w * 2, h * 2), c = cv.getContext('2d'), x, y, i;
  c.setTransform(2, 0, 0, 2, 0, 0);
  function tn(gx, gy) { return TN[W.tile[ix(gx, gy)]]; }
  for (y = 0; y < CT; y++) for (x = 0; x < CT; x++) {
    var gx = cx * CT + x, gy = cy * CT + y; if (gx >= MW || gy >= MH) continue;
    var t = tn(gx, gy);
    c.save(); c.translate(x * TW, y * TH); c.drawImage(tileCv[t][variantOf(gx, gy, t)], 0, 0, TW, TH); c.restore();
  }
  for (y = 0; y < CT; y++) for (x = 0; x < CT; x++) {
    var gx2 = cx * CT + x, gy2 = cy * CT + y; if (gx2 >= MW || gy2 >= MH) continue;
    var t2 = tn(gx2, gy2); if (!isOutside(t2)) continue;
    for (i = 0; i < 4; i++) {
      var nx = gx2 + SIDES[i][1], ny = gy2 + SIDES[i][2]; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      var nt = tn(nx, ny);
      if (nt === t2 || !isOutside(nt) || kit.TILES[nt].pr <= kit.TILES[t2].pr) continue;
      c.save(); c.translate(x * TW, y * TH); kit.blendTile(c, tileCv[nt][variantOf(nx, ny, nt)], SIDES[i][0], gx2 * 131 + gy2 * 17 + i); c.restore();
    }
  }
  for (y = 0; y < CT; y++) for (x = 0; x < CT; x++) {
    var fx = cx * CT + x, fy = cy * CT + y; if (fx >= MW || fy >= MH) continue;
    var ft = tn(fx, fy); if (ft !== 'plate' && ft !== 'grate' && ft !== 'puddle') continue;
    var lx = x * TW, ly = y * TH, isF = function (a, b) { var q = tn(a, b); return q === 'plate' || q === 'grate' || q === 'puddle'; };
    if (fx % 2 === 0 && hash(fx / 2, Math.floor(fy / 2), 91) > 0.15 && isF(fx - 1, fy)) { c.fillStyle = 'rgba(8,6,20,0.5)'; c.fillRect(lx - 0.5, ly, 1.1, TH); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(lx + 0.6, ly, 0.9, TH); }
    if (fy % 2 === 0 && hash(Math.floor(fx / 2), fy / 2, 92) > 0.15 && isF(fx, fy - 1)) { c.fillStyle = 'rgba(8,6,20,0.5)'; c.fillRect(lx, ly - 0.5, TW, 1.1); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(lx, ly + 0.6, TW, 0.9); }
    if (fx % 2 === 0 && fy % 2 === 0) [[3, 3], [TW * 2 - 3, 3], [3, TH * 2 - 3], [TW * 2 - 3, TH * 2 - 3]].forEach(function (rp) { c.fillStyle = 'rgba(8,6,20,0.55)'; c.beginPath(); c.arc(lx + rp[0], ly + rp[1], 1.2, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.arc(lx + rp[0] - 0.4, ly + rp[1] - 0.4, 0.5, 0, 7); c.fill(); });
  }
  // floor art: engraved emblems and unique decals (oil, puddles, rust, scorch, cracks, dust, moss)
  var ox0 = cx * w, oy0 = cy * h, dy2, dx2;
  (W.emblems || []).forEach(function (em) { var ex = em.x - ox0, ey = em.y * KY - oy0; if (ex > -em.r - 10 && ex < w + em.r + 10 && ey > -em.r - 10 && ey < h + em.r + 10) kit.emblem(c, em.kind, ex, ey, em.r); });
  for (dy2 = cy * CT - 2; dy2 < cy * CT + CT + 2; dy2++) for (dx2 = cx * CT - 2; dx2 < cx * CT + CT + 2; dx2++) {
    if (!inb(dx2, dy2)) continue;
    var di = ix(dx2, dy2); if (W.zid[di] !== 0 || W.bar[di] !== 0) continue;
    var dt = TN[W.tile[di]]; if (dt !== 'plate' && dt !== 'grate') continue;
    var th = rooms[W.rA[di]] ? rooms[W.rA[di]].theme : '', dens = th === 'boiler' || th === 'machine' ? 0.2 : th === 'atrium' ? 0.18 : 0.13;
    if (hash(dx2, dy2, 201) > dens) continue;
    var rr = hash(dx2, dy2, 203), kind;
    if (th === 'atrium') kind = rr < 0.3 ? 'moss' : rr < 0.55 ? 'crack' : rr < 0.8 ? 'puddle' : 'dust';
    else if (th === 'boiler') kind = rr < 0.3 ? 'scorch' : rr < 0.55 ? 'oil' : rr < 0.8 ? 'rust' : 'crack';
    else if (th === 'machine') kind = rr < 0.4 ? 'oil' : rr < 0.6 ? 'rust' : rr < 0.8 ? 'scorch' : 'crack';
    else if (th === 'storage') kind = rr < 0.4 ? 'dust' : rr < 0.7 ? 'crack' : rr < 0.9 ? 'rust' : 'oil';
    else kind = rr < 0.22 ? 'oil' : rr < 0.38 ? 'puddle' : rr < 0.55 ? 'rust' : rr < 0.8 ? 'crack' : 'dust';
    kit.decal(c, kind, dx2 * TW + hash(dx2, dy2, 202) * TW - ox0, dy2 * TH + hash(dy2, dx2, 204) * TH - oy0, dx2 * 131 + dy2 * 17 + 5);
  }
  var cell = 96, x0 = cx * w, y0 = cy * h, bx, by;
  for (by = Math.floor((y0 - cell) / cell); by * cell < y0 + h + cell; by++) for (bx = Math.floor((x0 - cell) / cell); bx * cell < x0 + w + cell; bx++) {
    var hv = hash(bx, by, 77), px = (bx + hash(bx, by, 78)) * cell - x0, py = (by + hash(bx, by, 79)) * cell - y0, r = 40 + hv * 50;
    var gz = W.zid[ix(clamp(Math.floor((bx * cell + cell / 2) / TW), 0, MW - 1), clamp(Math.floor((by * cell + cell / 2) / TH), 0, MH - 1))];
    var warm = gz === 3 ? '255,150,80' : gz === 2 || gz === 5 ? '210,235,255' : '255,245,200';
    var col = hv < 0.5 ? (gz === 0 ? '255,255,255' : warm) : '10,8,30', g2 = c.createRadialGradient(px, py, 0, px, py, r);
    g2.addColorStop(0, 'rgba(' + col + ',' + (hv < 0.5 ? 0.08 : 0.16) + ')'); g2.addColorStop(1, 'rgba(' + col + ',0)');
    c.fillStyle = g2; c.fillRect(px - r, py - r, r * 2, r * 2);
  }
  return { cv: cv, x: cx * w, y: cy * h, w: w, h: h, cx: cx, cy: cy, last: time };
}
function getChunk(cx, cy, noBake) {
  var k = cx + ',' + cy, ch = chunks[k];
  if (ch) { ch.last = time; return ch; }
  if (noBake) return null;
  ch = bakeChunk(cx, cy); chunks[k] = ch; chunkCount++;
  if (chunkCount > 18) { var worst = null, wk = null; for (var kk in chunks) { if (!worst || chunks[kk].last < worst.last) { worst = chunks[kk]; wk = kk; } } if (wk && worst !== ch) { delete chunks[wk]; chunkCount--; } }
  return ch;
}

/* ---------------- loading ---------------- */
function planJobs() {
  jobs = []; var T = kit.TILES;
  Object.keys(T).forEach(function (t) { for (var v = 0; v < T[t].n; v++) jobs.push(['tile', t, v]); });
  var seen = {};
  function need(n, s2) { var k = n + ':' + s2; if (!seen[k]) { seen[k] = 1; jobs.push(['prop', n, s2]); } }
  var hx = Math.floor(hero.x / 32 / CT), hy = Math.floor(hero.y / 32 / CT);
  props.forEach(function (p) { if (Math.abs(p.bx - hx) <= 2 && Math.abs(p.by - hy) <= 2) need(p.name, p.seed); });
  need('keyItem', 0); need('leverOff', 0); need('leverOn', 0); need('bell', 0); need('fuseItem', 0);
  jobs.push(['chunks']);
  jobTotal = jobs.length;
}
function runJob(j) {
  if (j[0] === 'tile') { if (!tileCv[j[1]]) tileCv[j[1]] = []; tileCv[j[1]][j[2]] = kit.bakeTile(j[1], j[2]); }
  else if (j[0] === 'prop') getSprite(j[1], j[2]);
  else { var ccx = Math.floor(hero.x / 32 / CT), ccy = Math.floor(hero.y / 32 / CT); for (var yy = -1; yy <= 1; yy++) for (var xx = -1; xx <= 1; xx++) { var cx = ccx + xx, cy = ccy + yy; if (cx >= 0 && cy >= 0 && cx < Math.ceil(MW / CT) && cy < Math.ceil(MH / CT)) getChunk(cx, cy); } }
}
function step(n) { var k = 0; while (jobs.length && k < n) { runJob(jobs.shift()); k++; } if (!jobs.length) finishLoad(); return 1 - jobs.length / Math.max(1, jobTotal); }
function finishLoad() { if (ready) return; ready = true; }

/* ---------------- zones, gates, reveal ---------------- */
function initZones() {
  zones = [];
  for (var k = 0; k < W.Z.length; k++) zones.push({ id: k, revealed: k === 0, revT: k === 0 ? 99 : 0, ox: 0, oy: 0, name: ZINFO[k].name, layer: ZINFO[k].layer });
  gates.forEach(function (g) { g.open = false; g.t = 0; g.seen = false; });
  roomFade = rooms.map(function (r) { return r === W.startRoom ? 1 : 0; });
  roomSeen = rooms.map(function (r) { return r === W.startRoom; });
  sites.forEach(function (s) { s.found = false; });
}
function roomAlpha(r) { var f = roomFade[r]; return 1 - f * f * (3 - 2 * f); }

function hiddenAlpha(z, tx, ty) {
  if (z < 0) return 1;
  var Zo = zones[z]; if (!Zo.revealed) return 1;
  if (Zo.revT >= 99) return 0;
  var R = Zo.revT * 22; if (R > 260) { Zo.revT = 99; return 0; }
  return clamp((Math.hypot(tx - Zo.ox, ty - Zo.oy) - R) / 5, 0, 1);
}

function tileAlpha(tx, ty) {
  if (!inb(tx, ty)) return 1;
  var i = ix(tx, ty), z = W.zid[i];
  if (z === 0) { var ra = W.rA[i], rb = W.rB[i]; if (ra < 0 && rb < 0) return 0; var a0 = 1; if (ra >= 0) a0 = Math.min(a0, roomAlpha(ra)); if (rb >= 0) a0 = Math.min(a0, roomAlpha(rb)); return a0; }
  var a = hiddenAlpha(z, tx, ty), b = W.bar[i];
  if ((b === 1 || b === 2 || b === 3) && W.bz[i] >= 0) a = Math.min(a, hiddenAlpha(W.bz[i], tx, ty));
  return a;
}

function say(s) { msg.s = s; msg.t = 4; }
function openGate(g) {
  if (g.open) return; g.open = true; g.t = 0;
  g.tiles.forEach(function (t) { W.solid[ix(t[0], t[1])] = 0; });
  if (g.internal) { say('A door opens.'); return; }
  var Zo = zones[g.to]; if (!Zo.revealed) { Zo.revealed = true; Zo.revT = 0; Zo.ox = g.cx + g.dx * 2; Zo.oy = g.cy + g.dy * 2; }
  say(g.to === 1 ? 'The gate opens. Light pours in from outside.' : 'A gate opens: ' + zones[g.to].name + ' is revealed.');
}

function checkGates() {
  gates.forEach(function (g) {
    if (g.open || !g.mech) return;
    var m = g.mech, near = Math.hypot(hero.x - (g.cx * 32 + 16), hero.y - (g.cy * 32 + 16)) < 80;
    if (m.type === 'key') { var ko = objs.filter(function (o) { return o.type === 'key' && o.gate === g.id; })[0]; if (ko && ko.got && near) openGate(g); }
    else if (m.type === 'fuses') { var fs = objs.filter(function (o) { return o.type === 'fuse' && o.gate === g.id; }); if (fs.length >= 2 && fs.every(function (o) { return o.got; }) && near) { say('The fuses click into place.'); openGate(g); } }
    else if (m.type === 'levers') { var ls = objs.filter(function (o) { return o.type === 'lever' && o.gate === g.id; }); if (ls.length && ls.every(function (o) { return o.on; })) openGate(g); }
    else if (m.type === 'strike') { var bl = objs.filter(function (o) { return o.type === 'bell' && o.gate === g.id; })[0]; if (bl && bl.hits >= m.need) openGate(g); }
  });
}

/* ---------------- hero and attack ---------------- */
function newHero() { return { x: W.start.x, y: W.start.y, vx: 0, vy: 0, face: W.sgn > 0 ? 0 : Math.PI, faceVis: W.sgn > 0 ? 0 : Math.PI, moving: false, sprint: false, anim: { run: 0, phase: 0, amt: 0, t: 0, lx: 0, ly: 0, bob: 0, lvx: 0, lvy: 0, blink: 0, blinkT: 2, blinkP: 0, sq: 0, sqv: 0 }, dustT: 0, atk: { ph: 'none', t: 0, dir: 0, sign: -1, queued: false, tr: null }, zone: 0 }; }
function solidAt(px, py) { var tx = Math.floor(px / 32), ty = Math.floor(py / 32); if (tx < 1 || ty < 1 || tx >= MW - 1 || ty >= MH - 1) return true; return !!W.solid[ix(tx, ty)]; }
function blockedAt(px, py) {
  var r = 6;
  if (solidAt(px, py) || solidAt(px - r, py) || solidAt(px + r, py) || solidAt(px, py - 3) || solidAt(px, py + 3)) return true;
  var bw = Math.ceil(MW / CT), bx = Math.floor(px / 32 / CT), by = Math.floor(py / 32 / CT);
  for (var yy = by - 1; yy <= by + 1; yy++) for (var xx = bx - 1; xx <= bx + 1; xx++) {
    if (xx < 0 || yy < 0 || xx >= bw || yy >= Math.ceil(MH / CT)) continue;
    var bk = buckets[yy * bw + xx];
    for (var i = 0; i < bk.length; i++) {
      var p = bk[i]; if (!p.r || p.dead) continue; if (Math.abs(p.x - px) > 70 || Math.abs(p.y - py) > 70) continue;
      var ps = p.sc || 1, pr = p.r * ps;
      if (Math.hypot(p.x - px, (p.y - py) * 1.3) < pr + r * 0.7) return true;
      if (p.r2) { var d1 = Math.hypot(p.x + p.r2[0] * ps - px, (p.y - py) * 1.3), d2 = Math.hypot(p.x + p.r2[1] * ps - px, (p.y - py) * 1.3); if (d1 < pr + r * 0.7 || d2 < pr + r * 0.7) return true; }
    }
  }
  return false;
}
function turnToward(a, b, st) { var d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; if (Math.abs(d) <= st) return b; return a + (d > 0 ? st : -st); }
function updateHero(dt) {
  var h = hero, an = h.anim;
  var ixk = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), iyk = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  var il = Math.hypot(ixk, iyk); if (il > 0) { ixk /= il; iyk /= il; }
  h.moving = il > 0; h.sprint = !!(keys.ShiftLeft || keys.ShiftRight || keys.Sprint) && il > 0;
  var spd = h.sprint ? 183 : 118, k = Math.min(1, dt * 15);
  if (h.atk.ph === 'windup' || h.atk.ph === 'active') spd *= 0.45; else if (h.atk.ph === 'recover') spd *= 0.75;
  h.vx += (ixk * spd - h.vx) * k; h.vy += (iyk * spd - h.vy) * k;
  var nx = h.x + h.vx * dt, ny = h.y + h.vy * dt;
  if (!blockedAt(nx, h.y)) h.x = nx; else h.vx = 0;
  if (!blockedAt(h.x, ny)) h.y = ny; else h.vy = 0;
  if (il > 0 && h.atk.ph === 'none') h.face = turnToward(h.face, Math.atan2(iyk, ixk), dt * 30);
  h.faceVis = turnToward(h.faceVis, h.face, dt * 42);
  var sp = Math.min(200, Math.hypot(h.vx, h.vy * KY)), target = Math.min(1, sp / 105);
  an.amt += (target - an.amt) * Math.min(1, dt * (target > an.amt ? 14 : 9));
  if (an.amt > 0.04) an.phase += Math.max(sp, 30) * dt * 0.115;
  an.t += dt; an.run += ((h.sprint ? 1 : 0) - an.run) * Math.min(1, dt * 8);
  an.bob = -Math.abs(Math.sin(an.phase)) * 1.0 * an.amt * (1 + 0.45 * an.run) + Math.sin(an.t * 2.2) * (1 - an.amt) * 0.4;
  var tx2 = (h.vx / 118) * 1.1, ty2 = (h.vy * KY / 118) * 0.8;
  an.lvx += ((tx2 - an.lx) * 220 - an.lvx * 27) * dt; an.lx += an.lvx * dt; an.lvy += ((ty2 - an.ly) * 220 - an.lvy * 27) * dt; an.ly += an.lvy * dt;
  an.blinkT -= dt; if (an.blinkT <= 0) { an.blinkT = 2.4 + Math.random() * 3.2; an.blinkP = 0.14; } an.blinkP -= dt; an.blink = an.blinkP > 0 ? Math.sin(Math.PI * (1 - an.blinkP / 0.14)) : 0;
  an.sqv += ((0 - an.sq) * 260 - an.sqv * 20) * dt; an.sq += an.sqv * dt;
  updateAtk(dt);
  h.dustT -= dt;
  var ti = ix(clamp(Math.floor(h.x / 32), 0, MW - 1), clamp(Math.floor(h.y / 32), 0, MH - 1)), tnm = TN[W.tile[ti]];
  h.zone = Math.max(0, W.zid[ti]);
  if (sp > 60 && h.dustT <= 0) { h.dustT = h.sprint ? 0.07 : 0.14; parts.push({ x: h.x + (Math.random() - 0.5) * 6, y: h.y, life: 0.4, max: 0.4, r: 2 + Math.random() * 2, c: (tnm === 'plate' || tnm === 'grate' || tnm === 'puddle') ? '190,190,215' : (tnm === 'snow' || tnm === 'snowDark') ? '235,245,255' : (tnm === 'ash' || tnm === 'char' || tnm === 'crack' || tnm === 'basalt') ? '150,130,120' : (tnm === 'path' || tnm === 'dirt' || tnm === 'shore') ? '200,180,140' : '150,200,140' }); }
}
function atkAngle(u) { var a = hero.atk, half = ATK.arc / 2; return a.dir - half * a.sign + ATK.arc * a.sign * u; }
function visAngle(ang, dir) { if (dir !== 'up' && dir !== 'down') return ang; var half = ATK.arc / 2, f = Math.min(0.52, 0.7 / half); return hero.atk.dir + (ang - hero.atk.dir) * f; }
function beginAttack() { var a = hero.atk, h = hero; a.ph = 'windup'; a.t = 0; a.dir = h.face; a.sign = -a.sign; a.queued = false; a.tr = null; h.faceVis = h.face; h.vx += Math.cos(h.face) * 55; h.vy += Math.sin(h.face) * 55; }
function attack() { if (!ready) return; var a = hero.atk; if (a.ph === 'none') beginAttack(); else a.queued = true; }
function inReach(ox, oy, extra) { var a = hero.atk, dx = ox - hero.x, dy = oy - hero.y, d = Math.hypot(dx, dy); if (d > ATK.reach + (extra || 8)) return false; var da = Math.abs(((Math.atan2(dy, dx) - a.dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI); return d <= 14 || da <= 1.4; }
function doHit() {
  var a = hero.atk, n, bw = Math.ceil(MW / CT), bx = Math.floor(hero.x / 32 / CT), by = Math.floor(hero.y / 32 / CT);
  tut.attacked = true;
  for (var yy = by - 1; yy <= by + 1; yy++) for (var xx = bx - 1; xx <= bx + 1; xx++) {
    if (xx < 0 || yy < 0 || xx >= bw || yy >= Math.ceil(MH / CT)) continue;
    buckets[yy * bw + xx].forEach(function (p) {
      if (p.dead) return;
      if (p.breakable && inReach(p.x, p.y - 8, 10)) {
        p.dead = true;
        for (n = 0; n < 9; n++) parts.push({ t: 'leaf', x: p.x + (Math.random() - 0.5) * 18, y: p.y, z: 6 + Math.random() * 14, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 50, vz: 60 + Math.random() * 90, rot: Math.random() * 6, life: 0.8, max: 0.8, c: n % 2 ? '#a9763e' : '#d9a85c', glow: false });
        if (p.grp != null) { var bo = objs.filter(function (o) { return o.type === 'blockage' && o.grp === p.grp; })[0]; if (bo) { bo.left--; say(bo.left > 0 ? 'Crate smashed. ' + bo.left + ' more in the way.' : 'The way is clear.'); } }
        return;
      }
      var kind = FOLIAGE[p.name]; if (!kind || !inReach(p.x, p.y, 8)) return;
      p.shake = 0.38;
      var cols = kind === 'leaf' ? ['#4fbf68', '#2f9a5a', '#8be08a'] : kind === 'petal' ? ['#ff8fb0', '#ffb347', '#ffe08a'] : kind === 'glow' ? ['#ffd96a', '#fff2a8'] : kind === 'snow' ? ['#ffffff', '#cfe8ff'] : kind === 'ember' ? ['#ffb050', '#ff6a2a'] : ['#f6e9c8', '#ffd2a0'];
      for (n = 0; n < 4; n++) parts.push({ t: 'leaf', x: p.x + (Math.random() - 0.5) * 14, y: p.y, z: 6 + Math.random() * 14, vx: Math.cos(a.dir) * 40 + (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 30, vz: 40 + Math.random() * 60, rot: Math.random() * 6, life: 0.9, max: 0.9, c: cols[n % cols.length], glow: kind === 'glow' || kind === 'ember' });
    });
  }
  objs.forEach(function (o) {
    if (o.type === 'lever' && !o.on && inReach(o.x, o.y, 10)) { o.on = true; o.shake = 0.3; say('Click. A lever flips.'); checkGates(); }
    else if (o.type === 'bell' && inReach(o.x, o.y - 20, 14)) { o.hits++; o.shake = 0.6; say(o.hits >= 3 ? 'The bell rings out.' : 'The bell rings (' + o.hits + ' of 3).'); checkGates(); }
  });
}

function updateAtk(dt) {
  var a = hero.atk; if (a.ph === 'none') { if (a.tr) { a.tr.age += dt; if (a.tr.age > 0.18) a.tr = null; } return; }
  a.t += dt;
  if (a.ph === 'windup' && a.t >= ATK.wu) { a.ph = 'active'; a.t = 0; a.tr = { start: atkAngle(0), cur: atkAngle(0), age: 0 }; doHit(); }
  else if (a.ph === 'active') { a.tr.cur = atkAngle(Math.min(1, a.t / ATK.ac)); if (a.t >= ATK.ac) { a.ph = 'recover'; a.t = 0; } }
  else if (a.ph === 'recover') { a.tr.age += dt; if (a.t >= ATK.rc) { a.ph = 'none'; if (a.queued) beginAttack(); } }
}
function swordPose(dir) {
  var a = hero.atk, o = {}, half = ATK.arc / 2, sign = a.sign, u, pb = (dir === 'up' || dir === 'down') ? 0.12 : 0.45;
  if (a.ph === 'windup') u = -pb * (a.t / ATK.wu); else if (a.ph === 'active') u = Math.min(1, a.t / ATK.ac); else u = 1;
  var ang = visAngle(a.dir - half * sign + ATK.arc * sign * u, dir), upv = Math.max(0, -Math.sin(ang)), sdn = Math.cos(a.dir) >= 0 ? 1 : -1;
  o.len = ATK.blade;
  if (dir === 'up' || dir === 'down') {
    var startAng = a.dir - half * sign, armSide = Math.cos(startAng) >= 0 ? 1 : -1, AR = 8.6, gpx0 = armSide * 6.5 + AR * Math.cos(ang), gpy = AR * Math.sin(ang);
    var mm = armSide * gpx0, mixu = clamp((upv - 0.3) / 0.4, 0, 1); mixu = mixu * mixu * (3 - 2 * mixu);
    var gpx = armSide * (mm + (Math.max(mm, 10.5) - mm) * mixu), tt = clamp(u, -0.1, 1);
    o.hx = gpx; o.hy = -17 + gpy * KY + sign * (tt - 0.5) * 5 - 3 * upv; o.tilt = sign * (tt - 0.5) * 0.5;
    o.len = clamp(9 + ATK.blade - (gpx * Math.cos(ang) + gpy * Math.sin(ang)), ATK.blade * 0.8, ATK.blade * 1.45); o.armSide = armSide;
  } else { o.hx = Math.cos(ang) * 9 + sdn * 10 * upv * upv; o.hy = -13 + Math.sin(ang) * 9 * KY - 5 * upv; }
  o.ca = Math.cos(ang); o.sa = Math.sin(ang) * KY + (o.tilt || 0);
  if (o.tilt) { var nn = Math.hypot(o.ca, o.sa); o.ca /= nn; o.sa /= nn; }
  o.front = Math.sin(ang) >= -0.05; o.side = sdn;
  return o;
}
function bodyPose() { var a = hero.atk, an = hero.anim, lean = 0; if (a.ph === 'windup') lean = -2 * (a.t / ATK.wu); else if (a.ph === 'active') lean = 3; else if (a.ph === 'recover') lean = 3 * (1 - a.t / ATK.rc); return { lx: an.lx + Math.cos(hero.face) * lean, ly: an.ly + an.bob + Math.sin(hero.face) * lean * KY }; }
function heroDir() { var vx = Math.cos(hero.faceVis), vy = Math.sin(hero.faceVis) * KY; if (Math.abs(vx) > Math.abs(vy)) return vx > 0 ? 'right' : 'left'; return vy > 0 ? 'down' : 'up'; }
function heroPose(dir) { var a = hero.atk, bp = bodyPose(), drawn = a.ph !== 'none', pose = { lx: bp.lx, ly: bp.ly, sheath: !drawn }; if (drawn) { var sp = swordPose(dir), hand = [sp.hx + bp.lx, sp.hy + bp.ly]; if (dir === 'left' || dir === 'right') pose.near = hand; else pose[(sp.armSide || sp.side) < 0 ? 'armL' : 'armR'] = hand; } return pose; }
function drawWeapon(c, hsx, hsy, front) {
  var a = hero.atk, dir = heroDir(), bp = bodyPose();
  if (a.ph !== 'none') {
    var sp = swordPose(dir);
    if (sp.front === front) {
      var hx = hsx + sp.hx + bp.lx, hy = hsy + sp.hy + bp.ly, ca = sp.ca, sa = sp.sa, len = sp.len, ex = hx + ca * len, ey = hy + sa * len, px = -sa, py = ca;
      c.lineCap = 'round';
      c.strokeStyle = '#3a2a36'; c.lineWidth = 5.4; c.beginPath(); c.moveTo(hx + ca * 3, hy + sa * 3); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = '#eef3fb'; c.lineWidth = 3; c.beginPath(); c.moveTo(hx + ca * 3, hy + sa * 3); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = 'rgba(120,130,160,0.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(hx + ca * 4, hy + sa * 4 + 0.6); c.lineTo(ex - ca * 2, ey - sa * 2 + 0.6); c.stroke();
      c.strokeStyle = '#3a2a36'; c.lineWidth = 6.4; c.beginPath(); c.moveTo(hx - ca * 3, hy - sa * 3); c.lineTo(hx + ca * 2, hy + sa * 2); c.stroke();
      c.strokeStyle = '#e0a93a'; c.lineWidth = 4.2; c.beginPath(); c.moveTo(hx - ca * 3, hy - sa * 3); c.lineTo(hx + ca * 2, hy + sa * 2); c.stroke();
      var gx = hx + ca * 3, gy = hy + sa * 3;
      c.strokeStyle = '#3a2a36'; c.lineWidth = 5.4; c.beginPath(); c.moveTo(gx - px * 3.4, gy - py * 3.4); c.lineTo(gx + px * 3.4, gy + py * 3.4); c.stroke();
      c.strokeStyle = '#f6d878'; c.lineWidth = 3; c.beginPath(); c.moveTo(gx - px * 3.4, gy - py * 3.4); c.lineTo(gx + px * 3.4, gy + py * 3.4); c.stroke();
      if (front) { c.beginPath(); c.arc(hx, hy, 2.6, 0, 7); c.fillStyle = '#ffd8b0'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#3a2a36'; c.stroke(); }
    }
  }
  if (a.tr && front === (Math.sin(a.dir) >= -0.3)) {
    var tr = a.tr, fade = 1 - tr.age / 0.18, n, steps = 16, inner = 12, ox = hsx + bp.lx, oy = hsy - 13 + bp.ly;
    c.beginPath();
    for (n = 0; n <= steps; n++) { var aa = visAngle(tr.start + (tr.cur - tr.start) * n / steps, dir); c.lineTo(ox + Math.cos(aa) * ATK.reach, oy + Math.sin(aa) * ATK.reach * KY); }
    for (n = steps; n >= 0; n--) { var ab = visAngle(tr.start + (tr.cur - tr.start) * n / steps, dir); c.lineTo(ox + Math.cos(ab) * inner, oy + Math.sin(ab) * inner * KY); }
    c.closePath(); c.fillStyle = 'rgba(255,255,255,' + (0.5 * Math.max(0, fade)) + ')'; c.fill();
  }
}

/* ---------------- update ---------------- */
function update(dt) {
  dt = Math.min(dt, 0.05); time += dt; lastDt = dt;
  if (!ready || !W) return;
  var px0 = hero.x, py0 = hero.y;
  updateHero(dt);
  tut.moved += Math.hypot(hero.x - px0, hero.y - py0); tut.t += dt;
  if (tut.step === 0 && tut.t > 0.6) { say('Move with WASD or the pad. Hold sprint to run.'); tut.step = 1; }
  else if (tut.step === 1 && tut.moved > 260) { say('Swing your sword at crates, barrels, chairs and tables. They all break.'); tut.step = 2; }
  else if (tut.step === 2 && tut.attacked) { say('Find the key. It opens the great gate.'); tut.step = 3; }
  var htx = clamp(Math.floor(hero.x / 32), 0, MW - 1), hty = clamp(Math.floor(hero.y / 32), 0, MH - 1), hi = ix(htx, hty);
  if (W.zid[hi] === 0) {
    var ra = W.rA[hi]; if (ra >= 0 && W.bar[hi] === 0) roomSeen[ra] = true;
    W.openings.forEach(function (op) { if (Math.hypot(hero.x - op.x, hero.y - op.y) < 230) { roomSeen[op.a] = true; if (op.b >= 0) roomSeen[op.b] = true; } });
  }
  for (var rr = 0; rr < rooms.length; rr++) if (roomSeen[rr] && roomFade[rr] < 1) roomFade[rr] = Math.min(1, roomFade[rr] + dt / 0.9);
  objs.forEach(function (o) {
    if (o.shake > 0) o.shake = Math.max(0, o.shake - dt);
    if (!o.seen && Math.hypot(hero.x - o.x, hero.y - o.y) < 260 && tileAlpha(Math.floor(o.x / 32), Math.floor(o.y / 32)) < 0.5) o.seen = true;
    if (o.type === 'key' && !o.got && Math.hypot(hero.x - o.x, hero.y - o.y) < 18) { o.got = true; say('You found the key. Take it to the gate.'); checkGates(); }
    if (o.type === 'fuse' && !o.got && Math.hypot(hero.x - o.x, hero.y - o.y) < 18) { o.got = true; var have = objs.filter(function (q) { return q.type === 'fuse' && q.gate === o.gate && q.got; }).length; say('You picked up a fuse (' + have + ' of 2).'); checkGates(); }
  });
  gates.forEach(function (g) { if (!g.seen && Math.hypot(hero.x - (g.cx * 32 + 16), hero.y - (g.cy * 32 + 16)) < 280 && tileAlpha(g.cx, g.cy) < 0.5) g.seen = true; });
  sites.forEach(function (s) { if (!s.found && Math.hypot(hero.x / 32 - s.x, hero.y / 32 - s.y) < s.r * 1.4) s.found = true; });
  checkGates();
  gates.forEach(function (g) { if (g.open && g.t < 1) g.t = Math.min(1, g.t + dt / 0.9); });
  zones.forEach(function (z) { if (z.revealed && z.revT < 99) z.revT += dt; });
  if (msg.t > 0) msg.t -= dt;
  var tx = clamp(hero.x - VW / 2, 0, MW * TW - VW), ty = clamp(hero.y * KY - VH / 2, 0, MH * TH - VH);
  cam.x += (tx - cam.x) * Math.min(1, dt * 8); cam.y += (ty - cam.y) * Math.min(1, dt * 8);
  var info = ZINFO[hero.zone] || ZINFO[0], k = Math.min(1, dt * 1.6);
  ambNow += (info.amb - ambNow) * k;
  var tt = info.layer === 'cold' ? [170, 215, 255, 0.1] : info.layer === 'heat' ? [255, 110, 40, 0.09] : [0, 0, 0, 0];
  for (var i = 0; i < 4; i++) tintNow[i] += (tt[i] - tintNow[i]) * k;
  var i2;
  for (i2 = parts.length - 1; i2 >= 0; i2--) { var q = parts[i2]; q.life -= dt; if (q.t === 'leaf') { q.vz -= 200 * dt; q.z = Math.max(0, q.z + q.vz * dt); q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.97; q.rot += dt * 6; if (q.z === 0) q.life -= dt * 2; } if (q.life <= 0) parts.splice(i2, 1); }
  var bw = Math.ceil(MW / CT), bx = Math.floor(hero.x / 32 / CT), by = Math.floor(hero.y / 32 / CT), yy, xx;
  for (yy = by - 1; yy <= by + 1; yy++) for (xx = bx - 1; xx <= bx + 1; xx++) { if (xx < 0 || yy < 0 || xx >= bw || yy >= Math.ceil(MH / CT)) continue; buckets[yy * bw + xx].forEach(function (p) { if (p.shake > 0) p.shake = Math.max(0, p.shake - dt); }); }
  var lay = info.layer, flowery = false, st = siteAt(hero.x / 32, hero.y / 32);
  hero.site = st; if (st && (st.type === 'meadow' || st.type === 'orchard' || st.type === 'lookout' || st.type === 'glade')) flowery = true;
  var want = { dust: hero.zone === 0 ? 30 : 0, snow: lay === 'cold' ? 70 : 0, ember: lay === 'heat' ? 46 : 0, firefly: (info.biome === 'meadow' || info.biome === 'grove') ? 12 : 0, butterfly: flowery ? 9 : 0 }, kinds = ['snow', 'ember', 'firefly', 'butterfly', 'dust'];
  kinds.forEach(function (kd) {
    var have = ambParts.filter(function (a) { return a.kind === kd; }).length;
    while (have < want[kd]) { ambParts.push({ x: Math.random() * VW, y: Math.random() * VH, s: 0.5 + Math.random(), p: Math.random() * 6, kind: kd }); have++; }
    if (have > want[kd]) { var drop = Math.min(2, have - want[kd]); for (var ii = ambParts.length - 1; ii >= 0 && drop > 0; ii--) if (ambParts[ii].kind === kd) { ambParts.splice(ii, 1); drop--; } }
  });
  ambParts.forEach(function (a) {
    if (a.kind === 'dust') { a.y += Math.sin(time * 0.5 + a.p) * 3 * dt + 2.5 * dt; a.x += Math.cos(time * 0.4 + a.p * 2) * 5 * dt; }
    else if (a.kind === 'snow') { a.y += (20 + a.s * 22) * dt; a.x += Math.sin(time * 0.8 + a.p) * 8 * dt - 14 * dt; }
    else if (a.kind === 'ember') { a.y -= (14 + a.s * 22) * dt; a.x += Math.sin(time * 1.4 + a.p) * 10 * dt; }
    else if (a.kind === 'butterfly') { a.x += Math.cos(time * 0.9 + a.p) * 26 * dt; a.y += Math.sin(time * 1.3 + a.p * 2) * 18 * dt; }
    else { a.y += Math.sin(time * 0.7 + a.p) * 6 * dt; a.x += Math.cos(time * 0.5 + a.p) * 6 * dt; }
    if (a.y > VH + 4) a.y = -4; if (a.y < -4) a.y = VH + 4; if (a.x < -4) a.x = VW + 4; if (a.x > VW + 4) a.x = -4;
  });
  if ((prefetchTick++ & 1) === 0) prefetchSprites();
  var ccx = Math.floor(hero.x / 32 / CT), ccy = Math.floor(hero.y / 32 / CT), done = false;
  for (yy = -1; yy <= 1 && !done; yy++) for (xx = -1; xx <= 1 && !done; xx++) { var cx = ccx + xx, cy = ccy + yy; if (cx < 0 || cy < 0 || cx >= bw || cy >= Math.ceil(MH / CT)) continue; if (!getChunk(cx, cy, true)) { getChunk(cx, cy); done = true; } }
}
function siteAt(tx, ty) { for (var q = 0; q < sites.length; q++) if (Math.hypot(tx - sites[q].x, ty - sites[q].y) < sites[q].r * 1.05) return sites[q]; return null; }

/* ---------------- rendering ---------------- */
function drawShadow(c, x, y, rx, ry, a) {
  c.save(); c.translate(x, y); c.scale(1, ry / rx); var g = c.createRadialGradient(0, 0, 0, 0, 0, rx * 1.2);
  g.addColorStop(0, 'rgba(6,4,18,' + (a * 1.5) + ')'); g.addColorStop(0.6, 'rgba(6,4,18,' + (a * 0.8) + ')'); g.addColorStop(1, 'rgba(6,4,18,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx * 1.2, 0, 7); c.fill(); c.restore();
}
function render(ctx) {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.fillStyle = '#07060d'; ctx.fillRect(0, 0, VW, VH);
  if (!ready || !W) return;
  var camX = Math.round(cam.x * 2) / 2, camY = Math.round(cam.y * 2) / 2, i;
  var tx0 = Math.max(0, Math.floor(camX / TW)), tx1 = Math.min(MW - 1, Math.ceil((camX + VW) / TW)), ty0 = Math.max(0, Math.floor(camY / TH)), ty1 = Math.min(MH - 1, Math.ceil((camY + VH) / TH));
  var c0x = Math.floor(tx0 / CT), c1x = Math.floor(tx1 / CT), c0y = Math.floor(ty0 / CT), c1y = Math.floor(ty1 / CT), cx, cy;
  for (cy = c0y; cy <= c1y; cy++) for (cx = c0x; cx <= c1x; cx++) { var ch = getChunk(cx, cy); ctx.drawImage(ch.cv, ch.x - camX, ch.y - camY, ch.w, ch.h); }
  var x, y;
  for (y = ty0; y <= ty1; y++) for (x = tx0; x <= tx1; x++) {
    var tn = TN[W.tile[ix(x, y)]];
    if (tn === 'water' || tn === 'ice') { if (tn === 'water') kit.shimmer(ctx, x * TW - camX, y * TH - camY, time, x * 31 + y * 7); }
    else if (tn === 'lava') { var g = ctx.createRadialGradient(x * TW - camX + 16, y * TH - camY + 12, 0, x * TW - camX + 16, y * TH - camY + 12, 30); g.addColorStop(0, 'rgba(255,140,40,' + (0.22 + 0.08 * Math.sin(time * 2 + x * 3 + y)) + ')'); g.addColorStop(1, 'rgba(255,140,40,0)'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x * TW - camX - 14, y * TH - camY - 14, 60, 52); ctx.restore(); }
  }
  if (showGrid) { ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.5; ctx.beginPath(); for (var gx = tx0; gx <= tx1 + 1; gx++) { ctx.moveTo(gx * TW - camX, 0); ctx.lineTo(gx * TW - camX, VH); } for (var gy = ty0; gy <= ty1 + 1; gy++) { ctx.moveTo(0, gy * TH - camY); ctx.lineTo(VW, gy * TH - camY); } ctx.stroke(); }
  var ents = [], hsx = hero.x - camX, hsy = hero.y * KY - camY, lightsV = [], bw = Math.ceil(MW / CT);
  for (cy = Math.max(0, c0y - 1); cy <= Math.min(Math.ceil(MH / CT) - 1, c1y + 1); cy++) for (cx = Math.max(0, c0x - 1); cx <= Math.min(bw - 1, c1x + 1); cx++) {
    buckets[cy * bw + cx].forEach(function (p) {
      if (p.dead) return;
      if (p.kind === 'gate') { var g = gates[p.gate]; if (g.open && g.t >= 1) return; }
      var s = getSprite(p.name, p.seed), sx = (p.fixed ? p.x : p.x) - camX, sy = (p.fixed ? p.y * KY : p.y * KY) - camY;
      if (p.fixed) { sx = p.x - camX; sy = p.y * KY - camY; }
      var psc = p.sc || 1; if (sx + (s.l + s.w) * psc < -10 || sx + (s.l - s.w) * psc > VW + 10 || sy + (s.t + s.h) * psc < -10 || sy + s.t * psc > VH + 10) return;
      var tx = Math.floor(p.x / 32), ty = Math.floor((p.fixed ? p.y * KY / 0.75 : p.y) / 32);
      var al = p.room != null ? roomAlpha(p.room) : (p.fixed ? 0 : tileAlpha(tx, clamp(Math.floor(p.y / 32) - (p.name.indexOf('wall') === 0 || p.name === 'cliff' || p.kind === 'gate' ? 1 : 0), 0, MH - 1)));
      if (al >= 0.999) return;
      ents.push({ y: p.under ? -1e6 : p.y, kind: 'p', p: p, s: s, sx: sx, sy: sy });
    });
  }
  objs.forEach(function (o) {
    if ((o.type === 'key' || o.type === 'fuse') && o.got) return;
    if (o.type === 'blockage') return;
    var tl = tileAlpha(Math.floor(o.x / 32), Math.floor(o.y / 32)); if (tl >= 0.999) return;
    var name = o.type === 'key' ? 'keyItem' : o.type === 'fuse' ? 'fuseItem' : o.type === 'bell' ? 'bell' : (o.on ? 'leverOn' : 'leverOff');
    var s = getSprite(name, 0), sx = o.x - camX, sy = o.y * KY - camY;
    if (sx + s.l + s.w < -10 || sx + s.l > VW + 10 || sy + s.t + s.h < -10 || sy + s.t > VH + 10) return;
    ents.push({ y: o.y, kind: 'o', o: o, s: s, sx: sx, sy: sy });
  });
  ents.push({ y: hero.y, kind: 'h' });
  parts.forEach(function (q) { ents.push({ y: q.y - 1, kind: 'd', q: q }); });
  ents.sort(function (a, b) { return a.y - b.y; });
  ents.forEach(function (e) {
    if (e.kind === 'p') {
      var s = e.s, p = e.p, sc = p.sc || 1, fl = p.flip ? -1 : 1, tall = s.h * sc > 90 && !p.under;
      var behind = tall && hero.y < p.y && hsx > e.sx + s.l * sc && hsx < e.sx + (s.l + s.w) * sc && hsy > e.sy + s.t * sc && hsy < e.sy + (s.t + s.h * 0.85) * sc;
      p.alpha += ((behind ? 0.45 : 1) - p.alpha) * 0.2;
      if (!p.under && !NOSHADOW[p.name] && !p.fixed) {
        var tallH = -s.t * sc, base = p.r > 0 ? p.r * 1.25 * sc : Math.min(34, s.w * 0.2 * sc);
        drawShadow(ctx, e.sx + 2, e.sy + 1, Math.max(6, base), Math.max(2.4, base * 0.4), p.r > 0 ? 0.34 : 0.2);
        if (p.r > 0 && tallH > 70 && !STRUCT[p.name]) { var len = tallH * 0.42; ctx.fillStyle = 'rgba(6,4,18,0.16)'; ctx.beginPath(); ctx.moveTo(e.sx - base * 0.8, e.sy); ctx.lineTo(e.sx + base * 0.8, e.sy); ctx.lineTo(e.sx + base * 0.8 + len, e.sy + len * 0.26); ctx.lineTo(e.sx - base * 0.8 + len * 0.9, e.sy + len * 0.26 + 2); ctx.closePath(); ctx.fill(); }
      }
      var a = p.alpha, dy = 0, skew = p.shake > 0 ? Math.sin(time * 55) * p.shake * 0.4 : 0;
      if (p.kind === 'gate') { var g = gates[p.gate]; a *= 1 - g.t; dy = -g.t * 22; }
      ctx.globalAlpha = a;
      if (p.cropW) { ctx.drawImage(s.cv, 0, 0, p.cropW * 2, s.cv.height, e.sx, e.sy, p.cropW, s.h); }
      else { ctx.save(); ctx.translate(e.sx, e.sy + dy); ctx.scale(sc * fl, sc); if (p.lean || skew) ctx.transform(1, 0, p.lean + skew, 1, 0, 0); ctx.drawImage(s.cv, s.l, s.t, s.w, s.h); ctx.restore(); }
      ctx.globalAlpha = 1;
      s.lights.forEach(function (l) { lightsV.push([e.sx + sc * fl * (l.x + p.lean * l.y), e.sy + dy + sc * l.y, l]); });
    } else if (e.kind === 'o') {
      var o = e.o, s2 = e.s, sk = o.shake || 0;
      ctx.save(); ctx.translate(e.sx, e.sy); if (sk > 0) ctx.transform(1, 0, Math.sin(time * 40) * sk * 0.35, 1, 0, 0);
      if (o.type === 'key' || o.type === 'fuse') ctx.translate(0, Math.sin(time * 3 + o.x) * 1.5);
      ctx.drawImage(s2.cv, s2.l, s2.t, s2.w, s2.h); ctx.restore();
      s2.lights.forEach(function (l) { lightsV.push([e.sx + l.x, e.sy + l.y, l]); });
    } else if (e.kind === 'd' && e.q.t === 'leaf') {
      var lq = e.q, la = clamp(lq.life / lq.max * 1.6, 0, 1);
      ctx.save(); ctx.translate(lq.x - camX, lq.y * KY - lq.z - camY); ctx.rotate(lq.rot); ctx.globalAlpha = la; ctx.fillStyle = lq.c; ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.4, 0, 0, 7); ctx.fill();
      if (lq.glow) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,220,120,0.5)'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill(); }
      ctx.restore();
    } else if (e.kind === 'd') {
      var q = e.q, a2 = q.life / q.max; ctx.fillStyle = 'rgba(' + q.c + ',' + (0.35 * a2) + ')'; ctx.beginPath(); ctx.arc(q.x - camX, q.y * KY - camY, q.r * (1.6 - a2 * 0.6), 0, 7); ctx.fill();
    } else {
      drawShadow(ctx, hsx, hsy, 10, 3.4, 0.34);
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      var hd = heroDir();
      drawWeapon(ctx, hsx, hsy, false);
      GameArt.lib.playerD(ctx, hsx, hsy, hd, hero.anim, heroPose(hd));
      drawWeapon(ctx, hsx, hsy, true);
      ctx.restore();
    }
  });
  // hidden zones: a soft dark mask, one pixel per tile, scaled with smoothing
  var mw = tx1 - tx0 + 3, mh = ty1 - ty0 + 3;
  if (!maskCv || maskCv.width !== mw || maskCv.height !== mh) { maskCv = kit.mk(mw, mh); maskCtx = maskCv.getContext('2d'); maskImg = maskCtx.createImageData(mw, mh); }
  var dd = maskImg.data, mi = 0, any = false;
  for (y = ty0 - 1; y <= ty1 + 1; y++) for (x = tx0 - 1; x <= tx1 + 1; x++) { var al = tileAlpha(x, y); if (al > 0.001) any = true; dd[mi++] = 7; dd[mi++] = 6; dd[mi++] = 14; dd[mi++] = Math.round(al * 255); }
  if (any) { maskCtx.putImageData(maskImg, 0, 0); ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(maskCv, 0, 0, mw, mh, (tx0 - 1) * TW - camX, (ty0 - 1) * TH - camY, mw * TW, mh * TH); ctx.restore(); }
  // gate glow where a gate is open
  gates.forEach(function (g) { if (!g.open) return; var gxs = g.cx * 32 + 16 - camX, gys = (g.cy * 32 + 16) * KY - camY; if (gxs < -80 || gxs > VW + 80 || gys < -80 || gys > VH + 80) return; var k = 1 - Math.min(1, g.t) * 0.6; ctx.save(); ctx.globalCompositeOperation = 'lighter'; var gg = ctx.createRadialGradient(gxs, gys, 2, gxs, gys, 90); gg.addColorStop(0, 'rgba(170,255,190,' + 0.35 * k + ')'); gg.addColorStop(1, 'rgba(170,255,190,0)'); ctx.fillStyle = gg; ctx.fillRect(gxs - 90, gys - 90, 180, 180); ctx.restore(); });
  // lighting
  if (!scratch) scratch = kit.mk(VW * 2, VH * 2);
  var d = scratch.getContext('2d'), dark = clamp(1 - ambNow, 0, 1) * 0.72;
  d.setTransform(2, 0, 0, 2, 0, 0); d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, VW, VH);
  d.fillStyle = 'hsla(250,55%,14%,' + dark + ')'; d.fillRect(0, 0, VW, VH);
  d.globalCompositeOperation = 'destination-out';
  lightsV.push([hsx, hsy - 16, { r: 70, a: 0.75, h: 42, s: 80, l: 70, hero: true }]);
  lightsV.forEach(function (v) { var l = v[2]; if (v[0] < -l.r || v[0] > VW + l.r || v[1] < -l.r || v[1] > VH + l.r) return; var g = d.createRadialGradient(v[0], v[1], l.r * 0.05, v[0], v[1], l.r); g.addColorStop(0, 'rgba(0,0,0,' + clamp(0.95 * l.a, 0, 1) + ')'); g.addColorStop(0.5, 'rgba(0,0,0,' + clamp(0.55 * l.a, 0, 1) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = g; d.beginPath(); d.arc(v[0], v[1], l.r, 0, 7); d.fill(); });
  d.globalCompositeOperation = 'source-over';
  ctx.drawImage(scratch, 0, 0, VW, VH);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  lightsV.forEach(function (v) { var l = v[2]; if (l.hero) return; if (v[0] < -l.r || v[0] > VW + l.r || v[1] < -l.r || v[1] > VH + l.r) return; var g = ctx.createRadialGradient(v[0], v[1], 0, v[0], v[1], l.r * 0.7); g.addColorStop(0, 'hsla(' + l.h.toFixed(0) + ',' + l.s + '%,' + l.l + '%,' + (0.3 * 0.9 * l.a) + ')'); g.addColorStop(1, 'hsla(' + l.h.toFixed(0) + ',' + l.s + '%,' + l.l + '%,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(v[0], v[1], l.r * 0.7, 0, 7); ctx.fill(); });
  ctx.restore();
  // light shafts through the high windows of the Factory
  if (W.beams && hero.zone === 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    W.beams.forEach(function (bm) {
      var bxs = bm.x - camX, bys = bm.y * KY - camY; if (bxs < -120 || bxs > VW + 120 || bys < -200 || bys > VH + 60) return;
      var al = 1 - roomAlpha(bm.room); if (al < 0.02) return;
      var len = 150, g = ctx.createLinearGradient(bxs, bys - 10, bxs + len * 0.5, bys + len);
      g.addColorStop(0, 'rgba(190,215,255,' + (0.1 * al) + ')'); g.addColorStop(1, 'rgba(190,215,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bxs - 16, bys - 10); ctx.lineTo(bxs + 16, bys - 10); ctx.lineTo(bxs + 16 + len * 0.5 + 24, bys + len); ctx.lineTo(bxs - 16 + len * 0.5 - 8, bys + len); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }
  // layer tint and ambient particles
  if (tintNow[3] > 0.005) { ctx.fillStyle = 'rgba(' + Math.round(tintNow[0]) + ',' + Math.round(tintNow[1]) + ',' + Math.round(tintNow[2]) + ',' + tintNow[3] + ')'; ctx.fillRect(0, 0, VW, VH); }
  var info = ZINFO[hero.zone] || ZINFO[0];
  ambParts.forEach(function (a) {
    if (a.kind === 'dust') { ctx.fillStyle = 'rgba(255,238,200,' + (0.18 + 0.2 * Math.abs(Math.sin(time * 0.8 + a.p))) + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, 0.6 + a.s * 0.4, 0, 7); ctx.fill(); }
    else if (a.kind === 'snow') { ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.3 * a.s / 1.5) + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, 0.7 + a.s * 0.7, 0, 7); ctx.fill(); }
    else if (a.kind === 'ember') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,' + Math.round(120 + a.s * 50) + ',40,0.85)'; ctx.beginPath(); ctx.arc(a.x, a.y, 0.6 + a.s * 0.6, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,140,40,0.25)'; ctx.beginPath(); ctx.arc(a.x, a.y, 2.6 + a.s, 0, 7); ctx.fill(); ctx.restore(); }
    else if (a.kind === 'butterfly') { var fl = Math.abs(Math.sin(time * 14 + a.p * 3)), col = ['255,170,200', '255,225,120', '170,220,255'][Math.floor(a.p) % 3]; ctx.save(); ctx.translate(a.x, a.y); ctx.fillStyle = 'rgba(' + col + ',0.95)'; ctx.strokeStyle = 'rgba(40,20,50,0.6)'; ctx.lineWidth = 0.5; [-1, 1].forEach(function (sd) { ctx.beginPath(); ctx.ellipse(sd * 1.6 * fl, -0.4, 1.8 * fl + 0.3, 2.2, sd * 0.4, 0, 7); ctx.fill(); ctx.stroke(); }); ctx.restore(); }
    else { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,225,120,' + (0.5 + 0.4 * Math.sin(time * 2 + a.p)) + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, 1, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,225,120,0.18)'; ctx.beginPath(); ctx.arc(a.x, a.y, 4, 0, 7); ctx.fill(); ctx.restore(); }
  });
  var vg = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VW * 0.62); vg.addColorStop(0, 'rgba(10,8,30,0)'); vg.addColorStop(1, 'rgba(10,8,30,0.4)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
  if (hintsOn) drawHint(ctx, camX, camY);
}
function target() {
  var best = null, bd = 1e9;
  function consider(t, label) { if (!t) return; var d = Math.hypot(t[0] - hero.x, t[1] - hero.y); if (d < bd) { bd = d; best = { x: t[0], y: t[1], label: label }; } }
  gates.forEach(function (g) {
    if (g.open) return; var from = g.internal ? 0 : g.from; if (!zones[from].revealed) return;
    var m = g.mech; if (!m) return; var gp = [g.cx * 32 + 16, g.cy * 32 + 16];
    if (m.type === 'key') { var ko = objs.filter(function (o) { return o.type === 'key' && o.gate === g.id; })[0]; if (ko && !ko.got) { if (ko.seen) consider([ko.x, ko.y], 'Pick up the key'); } else if (g.seen) consider(gp, 'Take the key to the gate'); else best = best || null; }
    else if (m.type === 'levers') { var ls = objs.filter(function (o) { return o.type === 'lever' && o.gate === g.id && !o.on && o.seen; }); var done = objs.filter(function (o) { return o.type === 'lever' && o.gate === g.id && o.on; }).length; ls.forEach(function (l) { consider([l.x, l.y], 'Hit the lever with your sword' + (m.need > 1 ? ' (' + done + ' of ' + m.need + ')' : '')); }); }
    else if (m.type === 'fuses') { var fs = objs.filter(function (o) { return o.type === 'fuse' && o.gate === g.id; }), got = fs.filter(function (o) { return o.got; }).length; fs.filter(function (o) { return !o.got && o.seen; }).forEach(function (f) { consider([f.x, f.y], 'Find the fuses (' + got + ' of 2)'); }); if (got >= 2 && g.seen) consider(gp, 'Take the fuses to the door'); }
    else if (m.type === 'strike') { var bl = objs.filter(function (o) { return o.type === 'bell' && o.gate === g.id && o.seen; })[0]; if (bl) consider([bl.x, bl.y], 'Ring the bell three times (' + bl.hits + ' of 3)'); }
  });
  objs.forEach(function (o) { if (o.type === 'blockage' && o.left > 0 && o.seen) consider([o.x, o.y], 'Break the crates (' + o.left + ' left)'); });
  return best;
}

function drawHint(c, camX, camY) {
  var t = target(); if (!t) return;
  var sx = t.x - camX, sy = t.y * KY - camY - 20;
  if (sx > 14 && sx < VW - 14 && sy > 14 && sy < VH - 14) return;
  var hx = hero.x - camX, hy = hero.y * KY - camY - 14, ang = Math.atan2(sy - hy, sx - hx), r = 118;
  var ax = clamp(VW / 2 + Math.cos(ang) * r * 1.5, 18, VW - 18), ay = clamp(VH / 2 + Math.sin(ang) * r * 0.9, 18, VH - 18);
  c.save(); c.translate(ax, ay); c.rotate(ang); c.globalAlpha = 0.65 + 0.3 * Math.sin(time * 4);
  c.fillStyle = '#ffd96a'; c.strokeStyle = '#3a2a36'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(9, 0); c.lineTo(-5, -6); c.lineTo(-2, 0); c.lineTo(-5, 6); c.closePath(); c.fill(); c.stroke(); c.restore();
}

/* ---------------- hud and map ---------------- */
function hud() {
  if (!ready || !W) return { zone: '', obj: '', msg: '', seed: 0 };
  var info = ZINFO[hero.zone] || ZINFO[0], t = target(), place = info.name;
  if (hero.zone === 0) { var hi = ix(clamp(Math.floor(hero.x / 32), 0, MW - 1), clamp(Math.floor(hero.y / 32), 0, MH - 1)), ra = W.rA[hi]; if (ra >= 0 && W.bar[hi] === 0) place += ' · ' + rooms[ra].name; }
  else if (hero.site) place += ' · ' + hero.site.name + ' (good base site)';
  var obj = t ? t.label : (gates.every(function (g) { return g.open; }) ? 'Every gate is open. Explore.' : (hero.zone === 0 ? 'Explore the Factory to find a way forward' : 'Explore to find a way forward'));
  var tier = hero.zone === 0 ? 0 : (hero.zone === 4 ? 1 : hero.zone === 5 ? 2 : hero.zone);
  return { zone: place + (hero.zone && !hero.site ? ' · tier ' + tier : '') + (info.layer !== 'none' ? ' · ' + info.layer + ' layer' : ''), obj: obj, msg: msg.t > 0 ? msg.s : '', seed: W.seed };
}

function drawMap(c, showAll) {
  if (!W) return;
  var img = c.createImageData(MW, MH), d = img.data, x, y, i;
  for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
    i = ix(x, y); var z = W.zid[i], o = (y * MW + x) * 4, r = 14, g = 12, b = 22, b3 = W.bar[i];
    var vis = z >= 0 && (showAll || tileAlpha(x, y) < 0.5);
    if (z >= 0 && vis) { var col = ZCOL[z] || [120, 120, 120]; r = col[0] * 0.8; g = col[1] * 0.8; b = col[2] * 0.8; if (b3 === 1 || b3 === 4) { r = 40; g = 30; b = 50; } if (b3 === 2) { r = 120; g = 114; b = 130; } if (b3 === 3) { r = 244; g = 211; b = 94; } var tnm = TN[W.tile[i]]; if (tnm === 'water' || tnm === 'ice') { r = 60; g = 120; b = 190; } else if (tnm === 'lava') { r = 230; g = 90; b = 30; } else if (tnm === 'path' || tnm === 'plank') { r = 200; g = 175; b = 120; } }
    else if (z >= 0) { r = 30; g = 26; b = 44; if (b3 === 3) { r = 120; g = 105; b = 50; } }
    d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  sites.forEach(function (s) { if (showAll || s.found || tileAlpha(Math.round(s.x), Math.round(s.y)) < 0.5) { c.fillStyle = '#9fe8ff'; c.strokeStyle = '#08202c'; c.lineWidth = 0.8; c.fillRect(s.x - 2, s.y - 2, 5, 5); c.strokeRect(s.x - 2, s.y - 2, 5, 5); } });
  c.fillStyle = '#fff'; c.beginPath(); c.arc(hero.x / 32, hero.y / 32, 2.8, 0, 7); c.fill(); c.strokeStyle = '#000'; c.lineWidth = 0.8; c.stroke();
  objs.forEach(function (o) { if ((o.type === 'key' || o.type === 'fuse') && o.got) return; if (o.type === 'blockage') return; c.fillStyle = o.type === 'key' ? '#ffd96a' : o.type === 'fuse' ? '#7fe0ff' : o.type === 'bell' ? '#ffb050' : (o.on ? '#7bf09a' : '#ff7a6a'); if (showAll || o.seen) c.fillRect(o.x / 32 - 1, o.y / 32 - 1, 3, 3); });
}

/* ---------------- public ---------------- */
function init(seed) {
  seed = seed || (Math.floor(Math.random() * 9000) + 100);
  var tries = 0;
  kit.setup(STYLE);
  while (true) {
    W = generate(seed);
    if (W) { genContent(seed); if (W.contentOk) break; }
    seed++; if (++tries > 60) throw new Error('could not generate a world');
  }
  gates = W.gates; initZones();
  hero = newHero(); chunks = {}; chunkCount = 0; sprites = {}; tileCv = {}; ready = false; parts = []; ambParts = []; msg = { t: 0, s: '' }; tut = { step: 0, t: 0, moved: 0, attacked: false };
  ambNow = ZINFO[0].amb; tintNow = [0, 0, 0, 0]; time = 0;
  planJobs();
  cam.x = clamp(hero.x - VW / 2, 0, MW * TW - VW); cam.y = clamp(hero.y * KY - VH / 2, 0, MH * TH - VH);
  return seed;
}
function key(code, down) { keys[code] = down; if (down && (code === 'KeyJ' || code === 'Attack')) attack(); if (down && code === 'KeyG') showGrid = !showGrid; }
return { init: init, siteList: function () { return sites; }, roomList: function () { return rooms; }, step: step, update: update, render: render, key: key, attack: attack, hud: hud, drawMap: drawMap, state: function () { return { hero: hero, world: W, props: props, objs: objs, gates: gates, zones: zones, ready: ready, jobs: jobs.length, total: jobTotal, MW: MW, MH: MH }; }, setHints: function (b) { hintsOn = b; }, toggleGrid: function () { showGrid = !showGrid; }, teleport: function (x, y) { hero.x = x; hero.y = y; cam.x = clamp(hero.x - VW / 2, 0, MW * TW - VW); cam.y = clamp(hero.y * KY - VH / 2, 0, MH * TH - VH); }, openGate: function (i) { openGate(gates[i]); }, revealAll: function () { zones.forEach(function (z) { z.revealed = true; z.revT = 99; }); } };
})();
if (typeof module !== 'undefined') module.exports = Zw;
