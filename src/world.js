/* World: the archipelago, shared by the Sea Editor and the game.
   World.make(kit, o) builds a sea with islands and returns an object that knows the ground (a height field read
   smoothly between tiles, painted per pixel), what stands on it (props in buckets per piece of map) and how to
   draw both. One tile is 32 world units (one unit of the scale brief; 100 tiles are a kilometre).

   Options (all optional): isle (normal island width in tiles, 220), isle0 (the first island's width), big (the second island's width), noDock, count (islands, 1), dir (angle of the second island), sizeVar, gap, gapVar,
   skerries, rough, beach (width of the sand in tiles, 4.5), hue (shift of the water colour), seed, maxTiles.
   Islands are placed one after another, each beside an earlier one at a random gap, so they cluster and chain.
   Each island writes a height into the field E (hundredths of a tile; above zero is land). Walking, sailing and
   drawing all read the same field. Pieces of the map are painted when first seen; open sea reuses one piece. */
var World = (function () {
'use strict';
var T = 32, TS = 24, K = 0.75, CT = 16;
var DEF = { isle: 160, count: 1, sizeVar: 0.8, gap: 40, gapVar: 0.8, skerries: 1, rough: 1, beach: 4.5, hue: 0, seed: 25, maxTiles: 9e6 };

// what can be gathered in the first biome, and how much it takes
var KIND = { dwarfBirch: 'tree', juniper: 'bush', heather: 'bush', boulder: 'stone', birch: 'tree', pine: 'tree', oak: 'tree', beech: 'tree', ash: 'tree', apple: 'tree', struckTree: 'tree', rock: 'stone', rockFormation: 'stone', chalkRock: 'stone', bogIron: 'stone', bush: 'bush', berryBush: 'bush', wildHerbs: 'bush', tallGrass: 'bush', hedge: 'bush' };
var HP = { dwarfBirch: 8, juniper: 4, heather: 3, boulder: 16, birch: 14, pine: 18, oak: 22, beech: 20, ash: 17, apple: 10, struckTree: 9, rock: 11, rockFormation: 18, chalkRock: 10, bogIron: 8, bush: 2, berryBush: 2, wildHerbs: 1, tallGrass: 1, hedge: 4 };
// the home camp: prop, offset from the jetty root, collision radius
var CAMP = [['dryingRack', -150, -70, 0], ['woodpile', -190, -30, 12], ['stoneHearth', -120, 40, 8], ['vikingTent', -200, 60, 16], ['dragonPost', 20, -34, 6], ['beachedBoat', -30, 78, 0]];

function hash(x, y, s) { var h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y, s) { var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s) { return vnoise(x, y, s) * 0.65 + vnoise(x * 2.1, y * 2.1, s + 9) * 0.35; }
function hslRgb(h, s, l) {
  h = ((h % 360) + 360) % 360; var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r, g, b;
  if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; } else if (h < 180) { r = 0; g = c; b = x; } else if (h < 240) { r = 0; g = x; b = c; } else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
// a small sheet of smooth noise that repeats every 128 pixels, for grain that lines up across pieces of the map
var NT = 128, noiseT = null;
function noiseSheet() {
  if (noiseT) return noiseT;
  var o = new Float32Array(NT * NT), x, y;
  function vn(px, py, cell, sd) { var n = NT / cell, fx = px / cell, fy = py / cell, xi = Math.floor(fx), yi = Math.floor(fy), u = fx - xi, v = fy - yi; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
    var a = hash(xi % n, yi % n, sd), b = hash((xi + 1) % n, yi % n, sd), c = hash(xi % n, (yi + 1) % n, sd), d = hash((xi + 1) % n, (yi + 1) % n, sd); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  for (y = 0; y < NT; y++) for (x = 0; x < NT; x++) o[y * NT + x] = vn(x, y, 32, 3) * 0.6 + vn(x, y, 16, 5) * 0.4;
  return (noiseT = o);
}

/* The Blender set pieces (2026-10-12: the peaks, the cave mouth; art/build/rocks_build.py, tools/props.js): a prop whose
   sprite is a rendered image and not a drawing of the kit's. setImages({ name: { img, w, h, ax, ay, upp } }) names them: the
   image, its size in pixels, the pixel it stands on, and the game units a pixel. A world's sprite(name) hands the image back
   as a kit sprite does (cv, l, t, w, h); until it has loaded, a blank. */
var IMAGES = {};
function setImages(map) { for (var k in map) IMAGES[k] = map[k]; }
function imgReady(im) { return !!im && (im.complete === undefined ? im.width > 0 : (im.complete && im.naturalWidth > 0)); }
function make(kit, opts) {
  var o = {}, k; for (k in DEF) o[k] = DEF[k]; for (k in opts || {}) if (opts[k] != null) o[k] = opts[k];
  var w = { T: T, TS: TS, K: K, CT: CT, o: o, hash: hash, vnoise: vnoise, fbm: fbm };
  var s = o.seed, R = kit.rng(s * 53 + 9), i, x, y, tries;
  function rnd(a, b) { return a + R() * (b - a); }
  var BASE = kit.STYLE, tiles = {}, sprites = {}, chunkCv = {}, chunkOrder = [], noise = noiseSheet();

  /* 1. place the islands: the home island first, then each new one beside an earlier one */
  function pickR() { var u = R(), f = u < 0.25 ? rnd(0.15, 0.45) : (u < 0.78 ? rnd(0.7, 1.3) : rnd(1.5, 2.2)); return Math.max(5, o.isle / 2 * (1 + (f - 1) * o.sizeVar)); }
  function pickGap() { var u = R(), f = u < 0.15 ? rnd(0.1, 0.3) : (u < 0.75 ? rnd(0.5, 1.5) : (u < 0.95 ? rnd(1.6, 3) : rnd(4, 8))); return Math.max(4, o.gap * (1 + (f - 1) * o.gapVar)); }
  var isles = [{ x: 0, y: 0, r: (o.isle0 || o.isle) / 2, gap: 0, biome: 0 }];   // o.isle0: the first island's width (the starter island is small)
  for (i = 1; i < o.count; i++) for (tries = 0; tries < 60; tries++) {
    var bm = o.biomes ? (o.biomes[i] || 0) : 0, par = isles[Math.floor(R() * isles.length) % isles.length], a0 = R() * 6.283, a = (i === 1 && o.dir != null) ? o.dir : a0, r = pickR(), g = pickGap(); if (i === 1 && o.big) r = o.big / 2; if (o.sizes && o.sizes[i]) r = o.sizes[i] / 2;   // o.big: the second island's width; o.sizes: every island's width
    if (bm) { var south = isles.slice().sort(function (p1, p2) { return p2.y - p1.y; }); par = south[Math.floor(R() * Math.min(2, south.length))]; a = 0.95 + R() * 1.25; g = g * 1.7 + 18; }   // o.biomes: the second biome's islands lie to the south, a bit further off (Robin)
    var d0 = 0, d = par.r + r + g;   // o.dir: the second island lies in that direction (0 is east, where the game's camp is)
    var cand = { x: par.x + Math.cos(a) * d, y: par.y + Math.sin(a) * d * 0.9, r: r, gap: g, biome: bm }, ok = true;
    for (k = 0; k < isles.length; k++) if (Math.hypot(isles[k].x - cand.x, isles[k].y - cand.y) < isles[k].r + r + 4) { ok = false; break; }
    if (ok) { isles.push(cand); break; }
  }
  /* 2. size the map to fit them; if it would be too big, leave out the last islands */
  var x0, y0, x1, y1, n = isles.length, GW, GH;
  for (;;) {
    x0 = y0 = 1e9; x1 = y1 = -1e9;
    for (i = 0; i < n; i++) { var q = isles[i], e = q.r * 1.45 + 30; x0 = Math.min(x0, q.x - e); y0 = Math.min(y0, q.y - e); x1 = Math.max(x1, q.x + e); y1 = Math.max(y1, q.y + e); }
    GW = Math.ceil((x1 - x0) / CT) * CT; GH = Math.ceil((y1 - y0) / CT) * CT;
    if (GW * GH <= o.maxTiles || n <= 2) break;
    n--;
  }
  isles.length = n;
  isles.forEach(function (q) { q.x -= x0; q.y -= y0; });
  var WX = GW * T, WY = GH * T, CW = GW / CT, CH = GH / CT;
  w.GW = GW; w.GH = GH; w.WX = WX; w.WY = WY; w.CW = CW; w.CH = CH; w.isles = isles; w.wanted = o.count;

  /* 3. the height field: each island is a rough dome, with skerries scattered round its coast */
  var E = new Int16Array(GW * GH).fill(-1000), skerries = 0;
  function blob(cx, cy, r, sd, rough) {
    var sc = Math.max(7, r * 0.42), e = r * 1.45 + 8, ya = Math.max(2, Math.floor(cy - e)), yb = Math.min(GH - 3, Math.ceil(cy + e)), xa = Math.max(2, Math.floor(cx - e)), xb = Math.min(GW - 3, Math.ceil(cx + e));
    for (var yy = ya; yy <= yb; yy++) for (var xx = xa; xx <= xb; xx++) {
      var dd = Math.hypot(xx + 0.5 - cx, (yy + 0.5 - cy) * 1.1); if (dd > e) continue;
      var rr = r * (1 + (fbm(xx / sc, yy / sc, sd) - 0.5) * 1.35 * rough + (vnoise(xx / 5, yy / 5, sd + 3) - 0.5) * 0.22 * rough * Math.min(1, 30 / r + 0.3));
      var h = Math.max(-1000, Math.min(3000, Math.round((rr - dd) * 100))), pp = yy * GW + xx;
      if (h > E[pp]) E[pp] = h;
    }
  }
  isles.forEach(function (q, idx) {
    blob(q.x, q.y, q.r, s + idx * 17, o.rough);
    var ns = Math.round(o.skerries * (2 + q.r * 0.07));
    for (var j = 0; j < ns; j++) { var sa = R() * 6.283, sdist = q.r * rnd(1.1, 1.42) + rnd(3, 12); blob(q.x + Math.cos(sa) * sdist, q.y + Math.sin(sa) * sdist * 0.9, rnd(1.8, 5.5), s + idx * 31 + j, 0.8); skerries++; }
  });
  w.E = E;
  /* 3b. the biome of every tile (2026-10-07, Robin: the second biome, the southern lowlands, mixing at the edges like Valheim's):
     the nearest island's biome, with noise on top so a lowland island keeps pine groves and the first biome gets a warm patch or two */
  var BM = new Uint8Array(GW * GH);
  for (y = 0; y < GH; y++) for (x = 0; x < GW; x++) {
    var bq = null, bd = 1e9, bi;
    for (bi = 0; bi < isles.length; bi++) { var dq = Math.hypot(x - isles[bi].x, (y - isles[bi].y) / 0.9) - isles[bi].r; if (dq < bd) { bd = dq; bq = isles[bi]; } }
    var base = bq && bq.biome ? 1 : 0, bv = base * 0.9 + (fbm(x / 22, y / 22, s + 90) - 0.5) * 1.1 + (base ? 0.12 : -0.32);
    BM[y * GW + x] = Math.round(Math.max(0, Math.min(1, bv)) * 255);
  }
  w.BM = BM; w.biomeAt = function (tx, ty) { return (tx < 0 || ty < 0 || tx >= GW || ty >= GH) ? 0 : BM[ty * GW + tx] / 255; }; w.biome = function (wx, wy) { return w.biomeAt(Math.floor(wx / T), Math.floor(wy / T)); };
  function beachAt(tx, ty) { return o.beach * (0.55 + 0.9 * vnoise(tx / 8, ty / 8, s + 50)); }   // the beach is wider in some places than others
  /* 3c. The mountains (2026-10-12, Robin: mountains in a good immersive way; plateaus with cliff faces, and painted peaks on top).
     o.mountain names an island (true is the first): its north rises in two terraces (the foothills, the high plateau) to peaks.
     Nothing is lifted on the screen: height is drawn the way the old top-down games draw it. MT is a smooth field per tile, read
     between the tiles like the coast's; its whole numbers are the levels (0 low ground, 1, 2, 3 the peaks). A level's edge is a
     contour of the field, so every cliff is a curve. South of an edge the lower ground is covered by the cliff's FACE for HFW
     units a level (HF pixels on the screen): rock you cannot walk on, painted as a wall. Where an edge faces away (north) or
     runs north to south there is only a RIM, a lip of rock a cell wide on each side. The peaks (level 3) cannot be walked.
     SLOPES are the ways up: a strip cut through a south face where the edge runs straight, found from the field and spread
     along the island. Everything the game asks (walking, building, planting) reads a grid of cells 8 units wide (w.cellAt:
     the level in two bits, FACE 4, RIM 8, RAMP 16, BLOCK 32), so w.isLand is false on a face, a rim and a peak. */
  var MT = null, mtn = null, HF = 84, HFW = HF / K, MC = 8, M_FACE = 4, M_RIM = 8, M_RAMP = 16, M_BLOCK = 32;
  function sstep(a, b, v) { var t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }
  function mTile(tx, ty) { return (tx < 0 || ty < 0 || tx >= GW || ty >= GH) ? 0 : MT[ty * GW + tx]; }
  function mAt(wx, wy) {
    var fx = wx / T - 0.5, fy = wy / T - 0.5, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy;
    var a = mTile(ix, iy), b = mTile(ix + 1, iy), c = mTile(ix, iy + 1), d = mTile(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function mLevel(m) { return m >= 3 ? 3 : (m >= 2 ? 2 : (m >= 1 ? 1 : 0)); }
  (function mountains() {
    if (o.mountain == null || o.mountain === false) return;
    var mq = isles[o.mountain === true ? 0 : o.mountain] || isles[0], mo = o.mountainOpts || {}, tx, ty, i, j, n, pass;
    MT = new Float32Array(GW * GH);
    var tx0 = Math.max(2, Math.floor(mq.x - mq.r * 1.5)), tx1 = Math.min(GW - 3, Math.ceil(mq.x + mq.r * 1.5)), ty0 = Math.max(2, Math.floor(mq.y - mq.r * 1.5)), ty1 = Math.min(GH - 3, Math.ceil(mq.y + mq.r * 1.5));
    var south = mo.south != null ? mo.south : 0.3, top = mo.top != null ? mo.top : 0.8, shore = mo.shore != null ? mo.shore : 7, rise = mo.rise != null ? mo.rise : 12, high = mo.high != null ? mo.high : 4.0;
    // how far every tile is from the sea, in tiles (two sweeps), and the island's own northernmost and southernmost land
    var DS = new Float32Array(GW * GH), yN = 1e9, yS = -1e9, dv;
    for (ty = ty0; ty <= ty1; ty++) for (tx = tx0; tx <= tx1; tx++) DS[ty * GW + tx] = E[ty * GW + tx] > 0 ? 1e6 : 0;
    for (ty = ty0 + 1; ty <= ty1; ty++) for (tx = tx0 + 1; tx < tx1; tx++) { i = ty * GW + tx; dv = Math.min(DS[i], DS[i - 1] + 1, DS[i - GW] + 1, DS[i - GW - 1] + 1.414, DS[i - GW + 1] + 1.414); DS[i] = dv; }
    for (ty = ty1 - 1; ty >= ty0; ty--) for (tx = tx1 - 1; tx > tx0; tx--) { i = ty * GW + tx; dv = Math.min(DS[i], DS[i + 1] + 1, DS[i + GW] + 1, DS[i + GW + 1] + 1.414, DS[i + GW - 1] + 1.414); DS[i] = dv; if (dv > 5) { if (ty < yN) yN = ty; if (ty > yS) yS = ty; } }
    for (ty = ty0; ty <= ty1; ty++) for (tx = tx0; tx <= tx1; tx++) {
      var d0 = DS[ty * GW + tx]; if (d0 <= 0) continue;
      var north = sstep(south, top, (yS - ty) / Math.max(1, yS - yN)), inland = sstep(shore, shore + rise, d0), base = north * inland;   // how far north on the island's own land, and how far from the sea: the mountains leave a shore all round
      MT[ty * GW + tx] = high * base * (0.78 + 0.5 * fbm(tx / 30, ty / 30, s + 140)) + (fbm(tx / 10, ty / 10, s + 150) - 0.5) * 0.6 * base;
    }
    for (pass = 0; pass < 2; pass++) {                       // smoothed twice, so no terrace is a speck
      var M2 = new Float32Array(MT.length);
      for (ty = ty0; ty <= ty1; ty++) for (tx = tx0; tx <= tx1; tx++) { var sm = 0, dy2, dx2; for (dy2 = -1; dy2 <= 1; dy2++) for (dx2 = -1; dx2 <= 1; dx2++) sm += MT[(ty + dy2) * GW + tx + dx2]; M2[ty * GW + tx] = sm / 9; }
      MT = M2;
    }
    // no specks: a patch of higher ground too small to stand a cliff round is taken down, a pit too small is filled (its
    // face would be a pillar or a slot); found as joined tiles at or above each level, and joined tiles below it
    (function despeckle() {
      var seenT = new Int32Array(GW * GH), stamp = 0, lvn, hi2, st, comp, q2, t2, k3, MIN = mo.minPatch || 70, NB = [1, -1, GW, -GW];
      for (lvn = 3; lvn >= 1; lvn--) for (hi2 = 1; hi2 >= 0; hi2--) {
        for (ty = ty0 + 1; ty < ty1; ty++) for (tx = tx0 + 1; tx < tx1; tx++) {
          st = ty * GW + tx; if (seenT[st] === stamp + 1 || ((MT[st] >= lvn) ? 1 : 0) !== hi2) continue;
          comp = [st]; seenT[st] = stamp + 1; var edge = false;
          for (q2 = 0; q2 < comp.length; q2++) { t2 = comp[q2]; var cxx = t2 % GW, cyy = (t2 - cxx) / GW; if (cxx <= tx0 + 1 || cxx >= tx1 - 1 || cyy <= ty0 + 1 || cyy >= ty1 - 1) { edge = true; continue; } for (k3 = 0; k3 < 4; k3++) { var nb = t2 + NB[k3]; if (seenT[nb] !== stamp + 1 && ((MT[nb] >= lvn) ? 1 : 0) === hi2) { seenT[nb] = stamp + 1; comp.push(nb); } } }
          if (comp.length < MIN && !edge) for (q2 = 0; q2 < comp.length; q2++) MT[comp[q2]] = hi2 ? Math.min(MT[comp[q2]], lvn - 0.03) : Math.max(MT[comp[q2]], lvn + 0.03);
        }
        stamp++;
      }
    })();
    var cx0 = tx0 * T / MC, cy0 = ty0 * T / MC, cw = (tx1 - tx0 + 1) * T / MC, ch = (ty1 - ty0 + 1) * T / MC, CL = new Uint8Array(cw * ch), FH = Math.round(HFW / MC);
    function cv(ci, cj) { return (ci < 0 || cj < 0 || ci >= cw || cj >= ch) ? 0 : CL[cj * cw + ci]; }
    for (j = 0; j < ch; j++) for (i = 0; i < cw; i++) CL[j * cw + i] = mLevel(mAt((cx0 + i + 0.5) * MC, (cy0 + j + 0.5) * MC));
    for (i = 0; i < cw; i++) {                               // the faces: down every column, the ground south of a higher edge
      var last = [-1e9, -1e9, -1e9, -1e9];
      for (j = 0; j < ch; j++) { var L = CL[j * cw + i] & 3; for (n = 1; n <= 3; n++) if (L >= n) last[n] = j; for (n = 3; n > L; n--) if ((j - last[n]) * MC <= HFW * (n - L)) { CL[j * cw + i] |= M_FACE | M_BLOCK; break; } }
    }
    var RIMS = [];
    for (j = 1; j < ch - 1; j++) for (i = 1; i < cw - 1; i++) {   // the rims: wherever the level changes next door; and the peaks
      var c0 = CL[j * cw + i], L0 = c0 & 3; if (L0 === 3) { CL[j * cw + i] |= M_BLOCK; continue; } if (c0 & M_FACE) continue;
      var dif = false, di, dj; for (dj = -1; dj <= 1 && !dif; dj++) for (di = -1; di <= 1; di++) if ((CL[(j + dj) * cw + i + di] & 3) !== L0) { dif = true; break; }
      if (dif) RIMS.push(j * cw + i);
    }
    RIMS.forEach(function (q) { CL[q] |= M_RIM | M_BLOCK; });
    // the slopes: a straight stretch of south-facing edge, one level high, with level ground above it and below its foot
    var ramps = [], candAll = { 1: [], 2: [] };
    for (n = 1; n <= 2; n++) {
      var cands = candAll[n];
      for (j = 10; j < ch - FH - 10; j++) for (i = 8; i < cw - 8; i++) {
        if ((cv(i, j) & 3) !== n || (cv(i, j + 1) & 3) !== n - 1) continue;
        var ok = true, d2, k2;
        for (d2 = -4; ok && d2 <= 4; d2 += 2) {
          for (k2 = 1; ok && k2 <= 8; k2++) { var ca = cv(i + d2, j - k2); if ((ca & 3) !== n || (ca & M_FACE)) ok = false; }
          if (ok && (cv(i + d2, j + 3) & 3) !== n - 1) ok = false;
          for (k2 = 2; ok && k2 <= FH; k2 += 3) if ((cv(i + d2, j + k2) & 3) !== n - 1) ok = false;
          for (k2 = FH + 2; ok && k2 <= FH + 8; k2++) { var cb = cv(i + d2, j + k2); if ((cb & 3) !== n - 1 || (cb & (M_FACE | M_RIM))) ok = false; }
        }
        if (ok) cands.push([i, j]);
      }
      if (!cands.length) continue;
      var imin = 1e9, imax = -1e9; cands.forEach(function (q) { imin = Math.min(imin, q[0]); imax = Math.max(imax, q[0]); });
      var want = Math.max(2, Math.min(n === 1 ? 4 : 3, Math.round((imax - imin) * MC / 900))), b, got = [];
      for (b = 0; b < want; b++) {
        var target = imin + (b + 0.5) * (imax - imin) / want, best = null, bs = 1e9;
        cands.forEach(function (q) { var sc = Math.abs(q[0] - target) - q[1] * 0.35; if (sc < bs && !got.some(function (g) { return Math.abs(g[0] - q[0]) < 30; })) { bs = sc; best = q; } });
        if (best) got.push(best);
      }
      got.forEach(function (q) {
        ramps.push(faceRamp(n, q));
      });
    }
    function faceRamp(n2, q) { var rx = (cx0 + q[0] + 0.5) * MC, ry = (cy0 + q[1] + 1) * MC, lean = (hash(q[0], q[1], s + 7) - 0.5) * 20; return { n: n2, x0: rx + lean, y0: ry - 52, x1: rx - lean, y1: ry + HFW + 44, r: 27, ex: rx, ey: ry }; }
    function rampD(rm, wx, wy) {                             // how far a point is from a slope's middle line, and how far along it (0 the top)
      var ax = rm.x1 - rm.x0, ay = rm.y1 - rm.y0, t = ((wx - rm.x0) * ax + (wy - rm.y0) * ay) / (ax * ax + ay * ay); t = Math.max(0, Math.min(1, t));
      return [Math.hypot(wx - rm.x0 - ax * t, wy - rm.y0 - ay * t), t];
    }
    function markRamp(rm) {
      rm.len = Math.hypot(rm.x1 - rm.x0, rm.y1 - rm.y0);
      var i0 = Math.floor((Math.min(rm.x0, rm.x1) - rm.r) / MC - cx0), i1 = Math.ceil((Math.max(rm.x0, rm.x1) + rm.r) / MC - cx0), j0 = Math.floor((Math.min(rm.y0, rm.y1) - rm.r) / MC - cy0), j1 = Math.ceil((Math.max(rm.y0, rm.y1) + rm.r) / MC - cy0), a2, b2;
      for (b2 = j0; b2 <= j1; b2++) for (a2 = i0; a2 <= i1; a2++) { if (a2 < 0 || b2 < 0 || a2 >= cw || b2 >= ch) continue; if (rampD(rm, (cx0 + a2 + 0.5) * MC, (cy0 + b2 + 0.5) * MC)[0] < rm.r - 7) CL[b2 * cw + a2] = (CL[b2 * cw + a2] & 3) | M_RAMP; }
    }
    ramps.forEach(markRamp);
    /* Every sizeable piece of high ground gets a way up. A flood from the low ground over the walking cells; the largest piece
       of fell it did not reach is joined on, by a slope up a south face if one of the found places touches it, else by a gap
       in a rim (a short slope across an edge that faces away or runs north to south); then the flood goes on. */
    var LANDC = new Uint8Array(cw * ch), reach = new Uint8Array(cw * ch), cm = new Int32Array(cw * ch), cid = 0, gave = {}, seeds = [], ix, tries;
    for (j = 0; j < ch; j++) for (i = 0; i < cw; i++) LANDC[j * cw + i] = elevAt((cx0 + i + 0.5) * MC, (cy0 + j + 0.5) * MC) > 0.05 ? 1 : 0;
    function flood(st) {
      while (st.length) { var q3 = st.pop(), qi = q3 % cw, qj = (q3 - qi) / cw, d4; for (d4 = 0; d4 < 4; d4++) { var a3 = qi + (d4 === 0 ? 1 : (d4 === 1 ? -1 : 0)), b3 = qj + (d4 === 2 ? 1 : (d4 === 3 ? -1 : 0)); if (a3 < 0 || b3 < 0 || a3 >= cw || b3 >= ch) continue; var i3 = b3 * cw + a3; if (reach[i3] || !LANDC[i3] || (CL[i3] & M_BLOCK)) continue; reach[i3] = 1; st.push(i3); } }
    }
    for (ix = 0; ix < cw * ch; ix++) if (LANDC[ix] && !(CL[ix] & (M_BLOCK | M_RAMP)) && (CL[ix] & 3) === 0) { reach[ix] = 1; seeds.push(ix); }
    flood(seeds);
    var MINC = mo.minReach || 1400, DIRS = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    for (tries = 0; tries < 16; tries++) {
      var bestComp = null, base = cid;
      for (ix = 0; ix < cw * ch; ix++) {
        if (reach[ix] || !LANDC[ix] || (CL[ix] & M_BLOCK) || (CL[ix] & 3) === 0 || cm[ix] > base) continue;
        var comp = [ix], qn; cid++; cm[ix] = cid;
        for (qn = 0; qn < comp.length; qn++) { var c5 = comp[qn], ci5 = c5 % cw, cj5 = (c5 - ci5) / cw, d5; for (d5 = 0; d5 < 4; d5++) { var a5 = ci5 + (d5 === 0 ? 1 : (d5 === 1 ? -1 : 0)), b5 = cj5 + (d5 === 2 ? 1 : (d5 === 3 ? -1 : 0)); if (a5 < 0 || b5 < 0 || a5 >= cw || b5 >= ch) continue; var i5 = b5 * cw + a5; if (cm[i5] > base || reach[i5] || !LANDC[i5] || (CL[i5] & M_BLOCK)) continue; cm[i5] = cid; comp.push(i5); } }
        if (comp.length >= MINC && !gave[comp[0]] && (!bestComp || comp.length > bestComp.length)) { bestComp = comp; bestComp.id = cid; }
      }
      if (!bestComp) break;
      var made = null, nn2, kq;
      for (nn2 = 1; nn2 <= 2 && !made; nn2++) for (kq = 0; kq < candAll[nn2].length; kq++) {     // a slope up a face
        var cq = candAll[nn2][kq], topI = (cq[1] - 2) * cw + cq[0], footI = (cq[1] + FH + 4) * cw + cq[0];
        if (cm[topI] === bestComp.id && reach[footI] && !ramps.some(function (g) { return Math.abs(g.ex - (cx0 + cq[0] + 0.5) * MC) < 200 && Math.abs(g.ey - (cy0 + cq[1] + 1) * MC) < 200; })) { made = faceRamp(nn2, cq); break; }
      }
      for (kq = 0; kq < bestComp.length && !made; kq += 3) {                                    // a gap in a rim
        var c6 = bestComp[kq], ci6 = c6 % cw, cj6 = (c6 - ci6) / cw, dq, ds;
        for (dq = 0; dq < 8 && !made; dq++) for (ds = 2; ds <= 6; ds++) {
          var a6 = ci6 + DIRS[dq][0] * ds, b6 = cj6 + DIRS[dq][1] * ds; if (a6 < 0 || b6 < 0 || a6 >= cw || b6 >= ch) break;
          var t6 = b6 * cw + a6; if (!reach[t6]) { if (!(CL[t6] & M_RIM) || (CL[t6] & M_FACE)) break; continue; }
          var ux = DIRS[dq][0], uy = DIRS[dq][1], ul = Math.hypot(ux, uy), hx2 = (cx0 + ci6 + 0.5) * MC, hy2 = (cy0 + cj6 + 0.5) * MC, lx2 = (cx0 + a6 + 0.5) * MC, ly2 = (cy0 + b6 + 0.5) * MC, upper = (CL[c6] & 3) >= (CL[t6] & 3);
          made = upper ? { n: CL[c6] & 3, x0: hx2 - ux / ul * 20, y0: hy2 - uy / ul * 20, x1: lx2 + ux / ul * 20, y1: ly2 + uy / ul * 20, r: 24, gap: true } : { n: CL[t6] & 3, x0: lx2 + ux / ul * 20, y0: ly2 + uy / ul * 20, x1: hx2 - ux / ul * 20, y1: hy2 - uy / ul * 20, r: 24, gap: true };
          made.ex = (hx2 + lx2) / 2; made.ey = (hy2 + ly2) / 2; break;
        }
      }
      for (kq = 0; kq < bestComp.length && !made; kq += 2) {                                    // or straight down whatever face lies south of it, however it runs
        var c7 = bestComp[kq], ci7 = c7 % cw, cj7 = (c7 - ci7) / cw, k7, st7 = 0, end7 = -1;
        for (k7 = 1; k7 <= FH * 2 + 6 && cj7 + k7 < ch; k7++) { var v7 = CL[(cj7 + k7) * cw + ci7], r7 = reach[(cj7 + k7) * cw + ci7]; if (r7) { end7 = k7; break; } if (st7 === 0 && (v7 & M_RIM)) continue; if (v7 & M_FACE) { st7 = 1; continue; } break; }
        if (end7 > 0 && st7 === 1) { var x7 = (cx0 + ci7 + 0.5) * MC, y7 = (cy0 + cj7 + 0.5) * MC; made = { n: CL[c7] & 3, x0: x7, y0: y7 - 30, x1: x7, y1: y7 + end7 * MC + 34, r: 27, ex: x7, ey: y7 + 8 }; }
      }
      if (!made) { gave[bestComp[0]] = 1; continue; }
      ramps.push(made); markRamp(made);
      var st2 = []; for (ix = 0; ix < cw * ch; ix++) if (reach[ix]) { var xi = ix % cw; if ((xi > 0 && !reach[ix - 1]) || (xi < cw - 1 && !reach[ix + 1]) || (ix >= cw && !reach[ix - cw]) || (ix < cw * (ch - 1) && !reach[ix + cw])) st2.push(ix); }
      flood(st2);
    }
    mtn = { MC: MC, x0: cx0, y0: cy0, w: cw, h: ch, CL: CL, HF: HF, HFW: HFW, ramps: ramps, isle: isles.indexOf(mq), rampD: rampD, bx0: tx0 * T, by0: ty0 * T, bx1: (tx1 + 1) * T, by1: (ty1 + 1) * T };
  })();
  w.mt = mtn; w.MT = MT; w.mAt = MT ? mAt : function () { return 0; };
  function cellAt(wx, wy) { if (!mtn) return 0; var ci = Math.floor(wx / MC) - mtn.x0, cj = Math.floor(wy / MC) - mtn.y0; return (ci < 0 || cj < 0 || ci >= mtn.w || cj >= mtn.h) ? 0 : mtn.CL[cj * mtn.w + ci]; }
  w.cellAt = cellAt; w.M_FACE = M_FACE; w.M_RIM = M_RIM; w.M_RAMP = M_RAMP; w.M_BLOCK = M_BLOCK;
  w.levelAt = function (wx, wy) { return cellAt(wx, wy) & 3; };          // 0 low ground, 1 the foothills, 2 the high plateau, 3 the peaks
  w.cliffAt = function (wx, wy) { return (cellAt(wx, wy) & M_BLOCK) !== 0; };   // a face, a rim or a peak: nothing walks, stands or grows here
  w.rampAt = function (wx, wy) { return (cellAt(wx, wy) & M_RAMP) !== 0; };
  w.flatAt = function (wx, wy, r) {                                        // level ground with room round it: no cliff, no slope within r, one level
    var c0 = cellAt(wx, wy), a; if (c0 & (M_BLOCK | M_RAMP)) return false; r = r || 0; if (!mtn || !r) return true;
    for (a = 0; a < 8; a++) { var c1 = cellAt(wx + Math.cos(a * 0.785) * r, wy + Math.sin(a * 0.785) * r); if ((c1 & (M_BLOCK | M_RAMP)) || (c1 & 3) !== (c0 & 3)) return false; }
    return true;
  };
  /* 4. what each tile is for the game: 0 sea, 1 beach, 2 grass, 3 dark grass, 4 jetty. The jetty runs east from the home island. */
  var grid = new Uint8Array(GW * GH), landChunk = new Uint8Array(CW * CH), landTiles = 0;
  for (y = 1; y < GH - 1; y++) for (x = 1; x < GW - 1; x++) {
    var p = y * GW + x, h2 = E[p] / 100;
    if (h2 > -4.5) for (var dy = -2; dy <= 2; dy += 2) for (var dx = -2; dx <= 2; dx += 2) { var qx = Math.floor((x + dx) / CT), qy = Math.floor((y + dy) / CT); if (qx >= 0 && qy >= 0 && qx < CW && qy < CH) landChunk[qy * CW + qx] = 1; }
    if (h2 <= 0) continue;
    landTiles++;
    grid[p] = h2 < beachAt(x, y) ? 1 : (fbm(x / 9, y / 9, s + 70) > 0.6 ? 3 : 2);
  }
  if (mtn) for (y = Math.floor(mtn.by0 / T); y < Math.floor(mtn.by1 / T); y++) for (x = Math.floor(mtn.bx0 / T); x < Math.floor(mtn.bx1 / T); x++) {
    if (grid[y * GW + x] < 2) continue; var anyc = false, c4x, c4y;
    for (c4y = 0; c4y < 4 && !anyc; c4y++) for (c4x = 0; c4x < 4; c4x++) if (cellAt(x * T + c4x * MC + 4, y * T + c4y * MC + 4) & (M_BLOCK | M_RAMP)) { anyc = true; break; }
    if (anyc) grid[y * GW + x] = 5;
  }
  var hx = Math.round(isles[0].x), hy = Math.round(isles[0].y);
  for (x = hx; x < GW - 16 && E[hy * GW + x] > 0; x++) {}
  if (!o.noDock) for (i = -1; i < 9; i++) grid[hy * GW + x + i] = 4;   // o.noDock: no jetty (the game's hero wakes in a wrecked boat)
  w.grid = grid; w.landChunk = landChunk;
  w.home = { x: (x - 3 + 0.5) * T, y: (hy + 0.5) * T }; w.dockEnd = { x: x + 1, y: hy };
  w.stats = { landTiles: landTiles, skerries: skerries, trees: 0, rocks: 0 };
  var PAL = { sand: [246, 210, 132], wet: [216, 166, 94], sh: hslRgb(170 + o.hue, 0.6, 0.62), dp: hslRgb(202 + o.hue, 0.7, 0.4) };

  /* reading the ground */
  function eTile(tx, ty) { return (tx < 0 || ty < 0 || tx >= GW || ty >= GH) ? -10 : E[ty * GW + tx] / 100; }
  function elevAt(wx, wy) {
    var fx = wx / T - 0.5, fy = wy / T - 0.5, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy;
    var a = eTile(ix, iy), b = eTile(ix + 1, iy), c = eTile(ix, iy + 1), d = eTile(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function code(tx, ty) { return (tx < 0 || ty < 0 || tx >= GW || ty >= GH) ? 255 : grid[ty * GW + tx]; }
  function onPlank(wx, wy) { return code(Math.floor(wx / T), Math.floor(wy / T)) === 4; }
  w.eTile = eTile; w.elevAt = elevAt; w.code = code; w.onPlank = onPlank; w.beachAt = beachAt;
  w.isLand = function (wx, wy) { return onPlank(wx, wy) || (elevAt(wx, wy) > 0.05 && !(mtn && (cellAt(wx, wy) & M_BLOCK))); };   // not a cliff face, its rim or a peak
  w.isWade = function (wx, wy) { return elevAt(wx, wy) > -1.1 && !(mtn && (cellAt(wx, wy) & M_BLOCK)); };   // the turquoise shallows: you can walk through them
  w.isWater = function (wx, wy) { return !onPlank(wx, wy) && elevAt(wx, wy) < -0.18 && wx > 40 && wy > 40 && wx < WX - 40 && wy < WY - 40; };

  /* baking */
  w.sprite = function (name, v) {
    var im = IMAGES[name];
    if (im) { if (!im.sp && imgReady(im.img)) im.sp = { cv: im.img, l: -im.ax * im.upp, t: -im.ay * im.upp, w: im.w * im.upp, h: im.h * im.upp, lights: [] }; return im.sp || im.blank || (im.blank = { cv: kit.mk(2, 2), l: 0, t: 0, w: 1, h: 1, lights: [] }); }
    var kk = name + ':' + v; if (!sprites[kk]) { kit.setup(BASE); sprites[kk] = kit.bakeProp(name, 3 + v * 7); } return sprites[kk]; };
  function tile(t, gx, gy) {
    if (!tiles[t]) { kit.setup(BASE); tiles[t] = []; for (var m = 0; m < kit.TILES[t].n; m++) tiles[t].push(kit.bakeTile(t, m)); }
    return tiles[t][Math.floor(hash(gx, gy, 5) * tiles[t].length) % tiles[t].length];
  }
  w.tile = tile;
  /* Painted ground (2026-10-07, Robin: the tile paths were too mechanical): gravel and earth painted with a brush into cells a
     quarter tile wide (GQ), read as a smooth field with noise on top, so every edge is ragged and no two strokes look alike. It is
     painted into the ground pieces at bake time; painting forgets the pieces it touches so they bake again. */
  var GQ = 8; w.ground = {};
  w.repaint = function (x0, y0, x1, y1) {
    var pw = CT * T, qx0 = Math.max(0, Math.floor(x0 / pw)), qx1 = Math.min(CW - 1, Math.floor(x1 / pw)), qy0 = Math.max(0, Math.floor(y0 / pw)), qy1 = Math.min(CH - 1, Math.floor(y1 / pw)), qx, qy;
    for (qy = qy0; qy <= qy1; qy++) for (qx = qx0; qx <= qx1; qx++) { var ck = qy * CW + qx; if (chunkCv[ck]) stale[ck] = 1; }   // the old piece stays on screen until drawGround has baked the new one (2026-10-08: baking every touched piece at once made painting stutter)   // baked again at once: a missing piece showed the sea for a frame (Robin, 2026-10-07)
  };
  w.paintGround = function (x, y, r, kind) {              // kind 1 gravel, 2 earth, 3 moss, 0 back to grass; true if anything changed
    var changed = false, qx0 = Math.floor((x - r) / GQ), qx1 = Math.floor((x + r) / GQ), qy0 = Math.floor((y - r) / GQ), qy1 = Math.floor((y + r) / GQ), qx, qy;
    for (qy = qy0; qy <= qy1; qy++) for (qx = qx0; qx <= qx1; qx++) {
      if (Math.hypot((qx + 0.5) * GQ - x, (qy + 0.5) * GQ - y) > r) continue; var kk = qx + ',' + qy;
      if (kind) { if (w.ground[kk] !== kind) { w.ground[kk] = kind; changed = true; } } else if (w.ground[kk] != null) { delete w.ground[kk]; changed = true; }
    }
    if (changed) w.repaint(x - r - GQ * 3, y - r - GQ * 3, x + r + GQ * 3, y + r + GQ * 3);
    return changed;
  };
  w.dabGround = function (x, y, r, kind) { var qx0 = Math.floor((x - r) / GQ), qx1 = Math.floor((x + r) / GQ), qy0 = Math.floor((y - r) / GQ), qy1 = Math.floor((y + r) / GQ), qx, qy; for (qy = qy0; qy <= qy1; qy++) for (qx = qx0; qx <= qx1; qx++) { var dx = (qx + 0.5) * GQ - x, dy = (qy + 0.5) * GQ - y; if (dx * dx + dy * dy * 1.6 > r * r) continue; if (!w.isLand((qx + 0.5) * GQ, (qy + 0.5) * GQ)) continue; if (kind) w.ground[qx + ',' + qy] = kind; else delete w.ground[qx + ',' + qy]; } };   // cells only, no repaint: call w.repaint over the area after many
  w.groundKind = function (x, y) { return w.ground[Math.floor(x / GQ) + ',' + Math.floor(y / GQ)] || 0; };
  function groundField(kind, wx, wy) {                     // 0..1, read between the cells
    var fx = wx / GQ - 0.5, fy = wy / GQ - 0.5, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
    function g(a, b) { return w.ground[a + ',' + b] === kind ? 1 : 0; }
    return g(i, j) * (1 - u) * (1 - v) + g(i + 1, j) * u * (1 - v) + g(i, j + 1) * (1 - u) * v + g(i + 1, j + 1) * u * v;
  }
  function groundInChunk(cx, cy) {                        // any painted cell in the chunk (with a margin): the chunk's own cells are looked up, never the whole world's (2026-10-08: the bake took 80 ms a piece)
    var qx0 = Math.floor((cx * CT * T - GQ * 2) / GQ), qx1 = Math.floor(((cx + 1) * CT * T + GQ * 2) / GQ), qy0 = Math.floor((cy * CT * T - GQ * 2) / GQ), qy1 = Math.floor(((cy + 1) * CT * T + GQ * 2) / GQ), qx, qy;
    for (qy = qy0; qy <= qy1; qy++) for (qx = qx0; qx <= qx1; qx++) if (w.ground[qx + ',' + qy]) return true;
    return false;
  }
  function paintGroundInto(c, cx, cy, W2, H2) {
    var gv = kit.mk(W2, H2), gc = gv.getContext('2d'), img = gc.createImageData(W2, H2), d = img.data, pp = 0, py, px;
    var ox = Math.floor((cx * W2) / GQ) - 3, oy = Math.floor((cy * H2 / K) / GQ) - 3, nx = Math.ceil(W2 / GQ) + 7, ny = Math.ceil(H2 / K / GQ) + 7, G = new Uint8Array(nx * ny), gi, gj, wk = new Float32Array(8);
    for (gj = 0; gj < ny; gj++) for (gi = 0; gi < nx; gi++) G[gj * nx + gi] = w.ground[(ox + gi) + ',' + (oy + gj)] || 0;   // the chunk's painted cells, once
    for (py = 0; py < H2; py++) for (px = 0; px < W2; px++, pp += 4) {
      var wx = cx * W2 + px, wys = cy * H2 + py, wy = wys / K, n1v = noise[((wys & 127) << 7) | (wx & 127)], n2v = noise[(((wys * 2) & 127) << 7) | ((wx * 2) & 127)];
      var fx = wx / GQ - 0.5, fy = wy / GQ - 0.5, ci = Math.floor(fx), cj = Math.floor(fy), u = fx - ci, v = fy - cj, li = ci - ox, lj = cj - oy, b0 = lj * nx + li;
      wk[0] = wk[1] = wk[2] = wk[3] = wk[4] = wk[5] = wk[6] = 0; wk[G[b0]] += (1 - u) * (1 - v); wk[G[b0 + 1]] += u * (1 - v); wk[G[b0 + nx]] += (1 - u) * v; wk[G[b0 + nx + 1]] += u * v;   // the field of each kind, read between the cells
      var fg = wk[1] + (n1v - 0.5) * 0.55, fe = wk[2] + (n1v - 0.5) * 0.55, fm = wk[3] + (n1v - 0.5) * 0.6, ff = wk[4] + (n1v - 0.5) * 0.4, fc = wk[5] + (n1v - 0.5) * 0.5, fw = wk[6] + (n1v - 0.5) * 0.6, r = 0, g = 0, b = 0, a = 0, f = 0;
      if (fg > 0.5) { f = fg; r = 150 + (n2v - 0.5) * 44; g = 138 + (n2v - 0.5) * 40; b = 118 + (n2v - 0.5) * 34; }
      else if (fe > 0.5) { f = fe; r = 126 + (n2v - 0.5) * 30; g = 98 + (n2v - 0.5) * 26; b = 62 + (n2v - 0.5) * 20; }
      else if (fm > 0.5) { f = fm; r = 92 + (n2v - 0.5) * 26; g = 128 + (n2v - 0.5) * 30; b = 70 + (n2v - 0.5) * 22; }   // moss: a deeper, bluer green
      else if (ff > 0.5) { f = ff; var fur = Math.sin(wy * 0.9) * 0.5 + 0.5; r = 118 + (n2v - 0.5) * 24 - fur * 26; g = 88 + (n2v - 0.5) * 20 - fur * 22; b = 56 + (n2v - 0.5) * 16 - fur * 14; }   // a ploughed field: dark furrows east to west
      else if (fc > 0.5) { f = fc; r = 214 + (n2v - 0.5) * 30; g = 210 + (n2v - 0.5) * 28; b = 196 + (n2v - 0.5) * 26; }   // chalk: pale, almost white
      else if (fw > 0.5) { f = fw; var gl = n2v > 0.82 ? 1 : 0; r = 70 + (n2v - 0.5) * 20 + gl * 60; g = 96 + (n2v - 0.5) * 24 + gl * 70; b = 64 + (n2v - 0.5) * 20 + gl * 90; }   // marsh: dark olive with glints of standing water
      if (f > 0.5) { var edge = Math.min(1, (f - 0.5) / 0.28); r -= (1 - edge) * 26; g -= (1 - edge) * 24; b -= (1 - edge) * 18; a = Math.min(1, (f - 0.5) / 0.1) * 255; }
      d[pp] = r; d[pp + 1] = g; d[pp + 2] = b; d[pp + 3] = a;
    }
    gc.putImageData(img, 0, 0); c.drawImage(gv, 0, 0, W2, H2);
    var R3 = kit.rng(cx * 311 + cy * 7907 + 5), i;                 // pebbles on the gravel, a crumb or two on the earth
    for (i = 0; i < 180; i++) { var sx = R3() * W2, sy = R3() * H2, gx = cx * W2 + sx, gy = (cy * H2 + sy) / K, kg = groundField(1, gx, gy), ke = groundField(2, gx, gy); if (kg > 0.62) { c.fillStyle = R3() < 0.5 ? 'rgba(90,84,76,0.55)' : 'rgba(205,198,184,0.7)'; c.beginPath(); c.ellipse(sx, sy, 1.2 + R3() * 1.2, 0.8 + R3() * 0.8, R3() * 3, 0, 7); c.fill(); } else if (ke > 0.7 && R3() < 0.3) { c.fillStyle = 'rgba(70,52,34,0.45)'; c.fillRect(sx, sy, 1.5, 1); } }
  }
  var rockP = null;
  function rockPal() {
    if (rockP) return rockP; kit.setup(BASE); var mk = kit.mats().rock, cvp = kit.mk(3, 1), cp = cvp.getContext('2d');
    [mk.base, mk.shade, mk.hl].forEach(function (col, i2) { cp.fillStyle = col || '#666'; cp.fillRect(i2, 0, 1, 1); });
    var dp = cp.getImageData(0, 0, 3, 1).data; rockP = { base: [dp[0], dp[1], dp[2]], shade: [dp[4], dp[5], dp[6]], hl: [dp[8], dp[9], dp[10]] }; return rockP;
  }
  w.rockPal = rockPal;
  function bakeChunk(cx, cy) {
    var W2 = CT * T, H2 = CT * TS, ccv = kit.mk(W2 * 2, H2 * 2), c = ccv.getContext('2d'), xx, yy, ii, jj;
    c.setTransform(2, 0, 0, 2, 0, 0);
    for (yy = 0; yy < CT; yy++) for (xx = 0; xx < CT; xx++) c.drawImage(tile('grass', cx * CT + xx, cy * CT + yy), xx * T, yy * TS, T + 0.3, TS + 0.3);
    var n1 = CT + 2, EE = new Float32Array(n1 * n1), BW = new Float32Array(n1 * n1), DK = new Float32Array(n1 * n1), BMv = new Float32Array(n1 * n1);
    for (jj = 0; jj < n1; jj++) for (ii = 0; ii < n1; ii++) { var gx = cx * CT + ii - 1, gy = cy * CT + jj - 1; EE[jj * n1 + ii] = eTile(gx, gy); BW[jj * n1 + ii] = beachAt(gx, gy); DK[jj * n1 + ii] = fbm(gx / 9, gy / 9, s + 70); BMv[jj * n1 + ii] = w.biomeAt(gx, gy); }
    var ov = kit.mk(W2, H2), oc = ov.getContext('2d'), img = oc.createImageData(W2, H2), d = img.data, P = PAL, pp = 0;
    // the mountains in this piece: the level of every pixel (and of a strip above it, as tall as two faces), then down every
    // column what stands over each pixel: FN the level of the edge whose face covers it, FD how far below that edge it is
    var lev = null, FN = null, FD = null, SH = null, LW = W2 + 16, PADR = HF * 2 + 8, d2 = null, img2 = null, ov2 = null, rampsHere = null, RK = null;
    if (mtn && cx * W2 < mtn.bx1 && (cx + 1) * W2 > mtn.bx0 && cy * H2 / K < mtn.by1 + 8 && (cy + 1) * H2 / K > mtn.by0 - 8) {
      var HR = H2 + PADR + 8, any = false, r0, px0; lev = new Uint8Array(LW * HR);   // a margin of 8 all round, so an edge's rim is found across the piece's own border
      for (r0 = 0; r0 < HR; r0++) { var sy0 = cy * H2 + r0 - PADR, wy0 = sy0 / K; for (px0 = 0; px0 < LW; px0++) { var wx0 = cx * W2 + px0 - 8, lv0 = mLevel(mAt(wx0, wy0) + (noise[((sy0 & 127) << 7) | (wx0 & 127)] - 0.5) * 0.012); if (lv0) { lev[r0 * LW + px0] = lv0; any = true; } } }
      if (!any) lev = null;
      else {
        FN = new Uint8Array(W2 * H2); FD = new Uint16Array(W2 * H2); SH = new Uint8Array(W2 * H2);
        for (px0 = 0; px0 < W2; px0++) {
          var l1 = -1e9, l2 = -1e9, l3 = -1e9;
          for (r0 = 0; r0 < H2 + PADR; r0++) {
            var Lq = lev[r0 * LW + px0 + 8]; if (Lq >= 1) l1 = r0; if (Lq >= 2) l2 = r0; if (Lq >= 3) l3 = r0;
            if (r0 < PADR || Lq === 3) continue; var qi = (r0 - PADR) * W2 + px0, nn, la;
            for (nn = 3; nn > Lq; nn--) { la = nn === 3 ? l3 : (nn === 2 ? l2 : l1); if (r0 - la <= HF * (nn - Lq)) { FN[qi] = nn; FD[qi] = r0 - la; break; } }
            if (!FN[qi]) for (nn = 3; nn > Lq; nn--) { la = nn === 3 ? l3 : (nn === 2 ? l2 : l1); var over = r0 - la - HF * (nn - Lq); if (over > 0 && over <= 16) { SH[qi] = 17 - over; break; } }   // the shadow at a face's foot
          }
        }
        img2 = oc.createImageData(W2, H2); d2 = img2.data; RK = rockPal();
        rampsHere = mtn.ramps.filter(function (rm) { return Math.max(rm.x0, rm.x1) + rm.r * 1.6 > cx * W2 && Math.min(rm.x0, rm.x1) - rm.r * 1.6 < (cx + 1) * W2 && (Math.max(rm.y0, rm.y1) + rm.r * 1.6) * K > cy * H2 && (Math.min(rm.y0, rm.y1) - rm.r * 1.6) * K < (cy + 1) * H2; });
      }
    }
    for (var py = 0; py < H2; py++) {
      var v = py / TS + 0.5, j0 = Math.floor(v), tv = v - j0, wy = cy * H2 + py;
      for (var px = 0; px < W2; px++, pp += 4) {
        var u = px / T + 0.5, i0 = Math.floor(u), tu = u - i0, q = j0 * n1 + i0, wx = cx * W2 + px;
        var w00 = (1 - tu) * (1 - tv), w10 = tu * (1 - tv), w01 = (1 - tu) * tv, w11 = tu * tv;
        var n1v = noise[((wy & 127) << 7) | (wx & 127)], n2v = noise[(((wy * 2) & 127) << 7) | ((wx * 2) & 127)];
        var e = EE[q] * w00 + EE[q + 1] * w10 + EE[q + n1] * w01 + EE[q + n1 + 1] * w11 + (n1v - 0.5) * 0.5;
        var r, g, b, a = 255;
        if (e < 0) {                                        // sea: pale over the sand at the edge, turquoise shallows, deep blue beyond
          var t = Math.min(1, -e / 3.4); t = t * t * (3 - 2 * t);
          r = P.sh[0] + (P.dp[0] - P.sh[0]) * t; g = P.sh[1] + (P.dp[1] - P.sh[1]) * t; b = P.sh[2] + (P.dp[2] - P.sh[2]) * t;
          var st = Math.max(0, 1 + e / 0.95) * 0.62;
          r += (P.wet[0] - r) * st; g += (P.wet[1] - g) * st; b += (P.wet[2] - b) * st;
          var tx2 = (n2v - 0.5) * 12; r += tx2; g += tx2; b += tx2;
          if (e > -0.14) { var fo = (1 + e / 0.14) * 0.85; r += (255 - r) * fo; g += (255 - g) * fo; b += (252 - b) * fo; }   // the white lip at the waterline
        } else {
          var bw = BW[q] * w00 + BW[q + 1] * w10 + BW[q + n1] * w01 + BW[q + n1 + 1] * w11, eg = e + (n2v - 0.5) * 0.7;
          if (eg < bw) {                                    // beach: wet and dark by the water, pale and dry higher up, soft dunes
            var dry = Math.min(1, e / 0.75); dry = dry * dry * (3 - 2 * dry);
            var dune = (n1v - 0.5) * 22 + Math.sin((wx * 0.33 + wy * 0.95) * 0.2 + n1v * 6) * 5;
            r = P.wet[0] + (P.sand[0] - P.wet[0]) * dry + dune; g = P.wet[1] + (P.sand[1] - P.wet[1]) * dry + dune; b = P.wet[2] + (P.sand[2] - P.wet[2]) * dry + dune * 0.8;
            a = Math.min(1, (bw - eg) / 0.32) * 255;        // the grass comes in raggedly at the top of the beach
          } else {                                          // grass: darker by the beach and in soft patches, never in squares
            var dk = DK[q] * w00 + DK[q + 1] * w10 + DK[q + n1] * w01 + DK[q + n1 + 1] * w11, rim = Math.max(0, 1 - (eg - bw) / 0.4);
            r = 22; g = 84; b = 40; a = Math.min(120, Math.max(0, (dk - 0.54) * 5) * 62 + rim * 70);
            var bmv = BMv[q] * w00 + BMv[q + 1] * w10 + BMv[q + n1] * w01 + BMv[q + n1 + 1] * w11; if (bmv > 0.05) { var bt = bmv * 95, at = a + bt; r = (r * a + 196 * bt) / at; g = (g * a + 176 * bt) / at; b = (b * a + 62 * bt) / at; a = Math.min(255, at); }   // the lowlands: a warmer, yellower green
          }
          if (lev) mountainPixel(px, py, wx, wy, n1v, n2v);
        }
        d[pp] = r; d[pp + 1] = g; d[pp + 2] = b; d[pp + 3] = a;
      }
    }
    /* One pixel of mountain. The fells' ground is a tint laid into the grass overlay (r, g, b, a above): shorter, greyer grass
       on the foothills, stonier with heather on the high plateau. The rock goes into a second overlay (d2) laid over the meadow:
       the face of a cliff (strata, cracks, a lit lip under an ink line at the top, darker toward a dark foot, moss in patches),
       the rim where an edge faces away, the peaks' scree and snow, the shadow at a face's foot, and the slopes. */
    function mountainPixel(px, py, wx, wy, n1v, n2v) {
      var qi = py * W2 + px, lb = (py + PADR) * LW + px + 8, L = lev[lb], fn = FN[qi], o2 = pp, R0 = RK.base, R1 = RK.shade, R2 = RK.hl, big = noise[(((wy >> 2) & 127) << 7) | ((wx >> 2) & 127)], k, rr, gg, bb;
      if (L === 1 || L === 2) {                              // the fells: a tint over the grass
        var tr = L === 1 ? 150 : 152, tg = L === 1 ? 158 : 146, tb = L === 1 ? 92 : 112, ta = L === 1 ? 46 + big * 30 : 78 + big * 40;
        if (L === 2 && big > 0.62) { tr = 134; tg = 100; tb = 128; ta = 96; }                 // heather in drifts
        if (L === 2 && n2v > 0.8 && big < 0.5) { tr = R0[0] + 20; tg = R0[1] + 20; tb = R0[2] + 14; ta = 200; }   // bare rock showing through
        var at2 = a + ta; r = (r * a + tr * ta) / at2; g = (g * a + tg * ta) / at2; b = (b * a + tb * ta) / at2; a = Math.min(255, at2);
      }
      if (rampsHere.length) {                                // a slope: trodden earth climbing through the face between two banks of rock, a step of stone now and then
        for (k = 0; k < rampsHere.length; k++) {
          var rm = rampsHere[k], rd = mtn.rampD(rm, wx, wy / K), tt = rd[1], along = tt * rm.len;
          var wide = rm.r * (0.84 + 0.2 * noise[(((along | 0) >> 1) & 127) << 7 | (rm.x0 & 127)] + (tt < 0.1 ? (0.1 - tt) * 2.2 : 0) + (tt > 0.88 ? (tt - 0.88) * 2.4 : 0)), dd = rd[0] + (n1v - 0.5) * 4;
          if (dd < wide) {
            var inF = fn !== 0, edge = wide - dd, side = wx < rm.x0 + (rm.x1 - rm.x0) * tt, stp = (along + 6) % 23, lift = 1 - tt;
            rr = 150 + lift * 22 + (n2v - 0.5) * 26 + (big - 0.5) * 18; gg = 124 + lift * 20 + (n2v - 0.5) * 22 + (big - 0.5) * 14; bb = 86 + lift * 16 + (n2v - 0.5) * 18;
            if (dd < wide * 0.45) { rr += 10; gg += 9; bb += 6; }                                // trodden paler down the middle
            var pb = hash(wx, wy, s + 91); if (pb > 0.965) { rr = 196; gg = 188; bb = 172; } else if (pb < 0.03) { rr -= 34; gg -= 30; bb -= 22; }   // pebbles (a speck each: the noise sheet is smooth and drew them as blots)
            if (!rm.gap && tt > 0.1 && tt < 0.9 && edge > 7) { if (stp < 2) { rr = R1[0] * 0.8; gg = R1[1] * 0.8; bb = R1[2] * 0.82; } else if (stp < 5) { rr = R2[0]; gg = R2[1]; bb = R2[2]; } }   // a step: a slab's lit top over its dark front
            if (inF && edge < 7) { var bk = side ? R2 : R1, bt2 = side ? 1 : 0.8; rr = bk[0] * bt2 + (n2v - 0.5) * 20; gg = bk[1] * bt2 + (n2v - 0.5) * 20; bb = bk[2] * bt2 + (n2v - 0.5) * 16; if (edge < 1.6) { rr = 38; gg = 30; bb = 30; } }   // the banks: lit on the west, dark on the east
            d2[o2] = rr; d2[o2 + 1] = gg; d2[o2 + 2] = bb; d2[o2 + 3] = inF ? 255 : 255 * Math.min(1, edge / 6); return;
          }
        }
      }
      if (fn) {                                              // the face of a cliff: beds of blocks that follow the edge, each with a lit ledge and a dark underside, joints between them
        var fd = FD[qi], tot = HF * (fn - L), kk = fd / tot, yb = fd + (big - 0.5) * 24 + 6, row = Math.floor(yb / 13), fy = yb / 13 - row, rh = hash(row, fn, s + 31), bw = 18 + rh * 30;
        var xb = (wx + rh * 131 + (noise[(((wy >> 1) & 127) << 7) | ((wx >> 3) & 127)] - 0.5) * 10) / bw, col = Math.floor(xb), fx = xb - col, ch2 = hash(col, row, s + 33);
        var tone = 1.12 - 0.34 * kk + (ch2 - 0.5) * 0.3 + (n2v - 0.5) * 0.1;
        if (fy < 0.22) tone += 0.16; else if (fy > 0.8) tone -= 0.18;
        if (fx * bw < 1.8 && ch2 > 0.28) tone -= 0.34;                                          // a joint down between two blocks
        if (fy > 0.9 && hash(col, row, s + 35) > 0.25) tone -= 0.36;                            // the bed under a block
        if (ch2 > 0.9) tone += 0.12;                                                            // a block that catches the light
        rr = R0[0] * tone; gg = R0[1] * tone; bb = R0[2] * (tone + 0.02);
        if (big > 0.64 && kk < 0.75 && n2v > 0.3 && fy < 0.5) { rr = rr * 0.45 + 50; gg = gg * 0.45 + 74; bb = bb * 0.45 + 32; }   // moss on the ledges
        if (fd <= 1) { rr = 38; gg = 30; bb = 30; }                                            // the ink line along the edge
        else if (fd <= 6) { var gt = n2v > 0.45 && fd <= 4; rr = gt ? 96 : R2[0]; gg = gt ? 140 : R2[1]; bb = gt ? 62 : R2[2]; }   // the lit lip, grass hanging over it
        else if (fd >= tot - 3) { rr = R1[0] * 0.62; gg = R1[1] * 0.62; bb = R1[2] * 0.66; }   // the dark foot
        if (px > 0 && px < W2 - 1 && (!FN[qi - 1] || !FN[qi + 1]) && lev[lb - 1] === L && lev[lb + 1] === L) { rr = 38; gg = 30; bb = 30; }   // the line down a face's end
        d2[o2] = rr; d2[o2 + 1] = gg; d2[o2 + 2] = bb; d2[o2 + 3] = 255; return;
      }
      if (L === 3) {                                         // the peaks' ground: scree, and snow lying on it
        var snow = fbm(wx / 46, wy / 46, s + 77) + (n1v - 0.5) * 0.12; rr = R0[0] * (0.92 + (n2v - 0.5) * 0.3); gg = R0[1] * (0.92 + (n2v - 0.5) * 0.3); bb = R0[2] * (0.94 + (n2v - 0.5) * 0.3);
        if (snow > 0.5) { var sk = Math.min(1, (snow - 0.5) / 0.06); rr += (238 - rr) * sk; gg += (243 - gg) * sk; bb += (250 - bb) * sk; if (sk < 1) { rr -= 30; gg -= 22; bb -= 8; } }
        d2[o2] = rr; d2[o2 + 1] = gg; d2[o2 + 2] = bb; d2[o2 + 3] = 255; return;
      }
      var up = lev[lb - 6 * LW], dn = lev[lb + 6 * LW], lf = lev[lb - 7], rt = lev[lb + 7];
      var lo = Math.min(up, dn, lf, rt), hi = Math.max(up, dn, lf, rt);
      if (lo < L) {                                          // the lip of an edge that faces away: pale stones along the drop, an ink line at it
        var near = Math.min(lev[lb - 2 * LW], lev[lb + 2 * LW], lev[lb - 2], lev[lb + 2]) < L, stone = noise[(((wy >> 1) & 127) << 7) | ((wx >> 1) & 127)];
        if (near) { d2[o2] = 38; d2[o2 + 1] = 30; d2[o2 + 2] = 30; d2[o2 + 3] = 230; return; }
        if (stone > 0.34) { var st2 = stone > 0.66 ? 1.1 : 0.96; d2[o2] = R2[0] * st2 + (n2v - 0.5) * 18; d2[o2 + 1] = R2[1] * st2 + (n2v - 0.5) * 18; d2[o2 + 2] = R2[2] * st2 + (n2v - 0.5) * 14; d2[o2 + 3] = 235; }
        return;
      }
      if (hi > L) {                                          // under such an edge, on the low side: the foot of its far face, a thin dark band
        var nearHi = Math.max(lev[lb - 2 * LW], lev[lb + 2 * LW], lev[lb - 2], lev[lb + 2]) > L;
        if (nearHi) { d2[o2] = R1[0] * 0.7; d2[o2 + 1] = R1[1] * 0.7; d2[o2 + 2] = R1[2] * 0.76; d2[o2 + 3] = 215; }
        else { d2[o2] = 20; d2[o2 + 1] = 30; d2[o2 + 2] = 40; d2[o2 + 3] = 46; }
        return;
      }
      if (SH[qi]) { d2[o2] = 14; d2[o2 + 1] = 18; d2[o2 + 2] = 34; d2[o2 + 3] = SH[qi] * 6.5; }
    }
    oc.putImageData(img, 0, 0);
    c.imageSmoothingEnabled = true; c.drawImage(ov, 0, 0, W2, H2);
    if (groundInChunk(cx, cy)) paintGroundInto(c, cx, cy, W2, H2);
    if (w.meadowLook) { c.save(); c.setTransform(2, 0, 0, 2, -cx * W2 * 2, -cy * H2 * 2); w.drawMeadow(c, { x: cx * W2 + W2 / 2, y: cy * H2 + H2 / 2 }, W2 / 2 + 4, H2 / 2 + 4, w.meadowLook); c.restore(); }   // the meadow is still, so it is baked here, not drawn every frame (2026-10-08, the lag)
    var R2 = kit.rng(cx * 7919 + cy * 104729 + s);           // grains, pebbles and shells on the dry sand
    for (ii = 0; ii < 260; ii++) {
      var sx = R2() * W2, sy = R2() * H2, kind = R2(), wxx = cx * W2 + sx, wyy = (cy * H2 + sy) / K, e2 = elevAt(wxx, wyy);
      if (e2 < 0.5 || e2 > beachAt(wxx / T, wyy / T) - 0.6) continue;
      if (kind < 0.86) { c.fillStyle = kind < 0.5 ? 'rgba(150,104,52,0.5)' : 'rgba(255,246,214,0.75)'; c.fillRect(sx, sy, 1, 1); }
      else if (kind < 0.95) { c.fillStyle = 'rgba(150,140,140,0.9)'; c.beginPath(); c.ellipse(sx, sy, 1.6, 1.1, 0, 0, 7); c.fill(); }
      else { c.fillStyle = '#fff6ea'; c.strokeStyle = 'rgba(150,104,52,0.7)'; c.lineWidth = 0.6; c.beginPath(); c.ellipse(sx, sy, 2, 1.5, 0.5, 0, 7); c.fill(); c.stroke(); }
    }
    if (d2) {
      ov2 = kit.mk(W2, H2); ov2.getContext('2d').putImageData(img2, 0, 0); c.drawImage(ov2, 0, 0, W2, H2);   // the rock, over the meadow
      var RKc = rockPal(), fxp, fyp, qf; c.lineCap = 'round';
      for (fyp = 1; fyp < H2 - 1; fyp++) for (fxp = 1; fxp < W2 - 1; fxp++) {
        qf = fyp * W2 + fxp; if (!FN[qf]) continue; var wxf = cx * W2 + fxp, wyf = cy * H2 + fyp, hf = hash(wxf, wyf, s + 61);
        if (mtn.ramps.length && (cellAt(wxf, wyf / K) & M_RAMP)) continue;
        if (FD[qf] === 2 && hf < 0.2) {                       // a tuft over the lip
          var nb = 2 + Math.floor(hf * 20), bi; c.lineWidth = 0.9;
          for (bi = 0; bi < nb; bi++) { var hb = hash(wxf + bi, wyf, s + 62), down = hb < 0.45; c.strokeStyle = hb > 0.6 ? '#86b450' : '#5d8a3a'; c.beginPath(); c.moveTo(fxp + (bi - nb / 2) * 1.3, fyp - 1.5); c.quadraticCurveTo(fxp + (bi - nb / 2) * 1.8, fyp - (down ? 0 : 5), fxp + (bi - nb / 2) * 2.4 + (hb - 0.5) * 3, fyp + (down ? 3.5 + hb * 4 : -5 - hb * 3)); c.stroke(); }
        } else if (FD[qf] === 2 && hf > 0.955) {              // a stone standing proud of the edge
          c.fillStyle = 'rgb(' + RKc.hl.join(',') + ')'; c.strokeStyle = 'rgba(38,30,30,0.9)'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(fxp, fyp - 1.5, 3 + hf * 2, 2.2, 0, 0, 7); c.fill(); c.stroke();
        }
        if (!FN[qf + W2] && hf > 0.86) {                      // scree at the foot
          var ns = 1 + Math.floor((hf - 0.86) * 28), si; for (si = 0; si < ns; si++) { var hs = hash(wxf, wyf + si, s + 63), sxp = fxp + (hs - 0.5) * 9, syp = fyp + 1 + hash(wxf + si, wyf, s + 64) * 6, sr = 1.2 + hs * 2.4; c.fillStyle = 'rgb(' + (hs > 0.5 ? RKc.hl : RKc.base).join(',') + ')'; c.strokeStyle = 'rgba(38,30,30,0.85)'; c.lineWidth = 0.6; c.beginPath(); c.ellipse(sxp, syp, sr, sr * 0.7, 0, 0, 7); c.fill(); c.stroke(); }
          if (hf > 0.95) { c.strokeStyle = '#5d8a3a'; c.lineWidth = 0.9; for (si = 0; si < 3; si++) { c.beginPath(); c.moveTo(fxp + si * 1.4 - 2, fyp + 3); c.lineTo(fxp + si * 2 - 3, fyp - 2 - si); c.stroke(); } }
        }
      }
    }
    for (yy = 0; yy < CT; yy++) for (xx = 0; xx < CT; xx++) if (code(cx * CT + xx, cy * CT + yy) === 4) {       // the jetty
      c.drawImage(tile('plank', cx * CT + xx, cy * CT + yy), xx * T, yy * TS, T + 0.3, TS + 0.3);
      c.fillStyle = 'rgba(20,14,26,0.3)'; c.fillRect(xx * T, (yy + 1) * TS, T, 3);
    }
    return ccv;
  }
  w.bakeChunk = bakeChunk;
  w.waterCv = bakeChunk(-64, -64);                      // far outside the map: nothing but deep sea
  // the pieces of the map in view; at most one new piece is painted per call, and the oldest are forgotten
  var stale = {}, lastBake = -1e9;
  w.bakes = 0; w.bakeMs = 0;                               // how many ground pieces were baked and how long it took (the frame log reads and clears them)
  function pnow() { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
  w.drawGround = function (c, cam, hw, hh) {
    var pw = CT * T, phh = CT * TS, baked = 0;
    for (var qy = Math.max(0, Math.floor((cam.y - hh) / phh)); qy < CH && qy * phh < cam.y + hh; qy++) for (var qx = Math.max(0, Math.floor((cam.x - hw) / pw)); qx < CW && qx * pw < cam.x + hw; qx++) {
      var ck = qy * CW + qx, piece = w.waterCv;
      if (landChunk[ck]) {
        if ((!chunkCv[ck] || (stale[ck] && pnow() - lastBake > 60)) && baked < 1) {   // one bake a call; a repainted piece waits a few frames between bakes so painting keeps up
          var tb0 = pnow(); if (stale[ck]) { delete stale[ck]; var ci = chunkOrder.indexOf(ck); if (ci >= 0) chunkOrder.splice(ci, 1); }
          chunkCv[ck] = bakeChunk(qx, qy); w.bakes++; w.bakeMs += pnow() - tb0; lastBake = pnow(); chunkOrder.push(ck); baked++; if (chunkOrder.length > 60) { var old = chunkOrder.shift(); delete chunkCv[old]; delete stale[old]; }
        }
        if (chunkCv[ck]) piece = chunkCv[ck];
      }
      c.drawImage(piece, qx * pw, qy * phh, pw + 0.5, phh + 0.5);
    }
  };
  // the meadow under the blades (painted first, still): soft lighter and darker patches of grass, bare earth, and drifts of
  // tiny flowers in several colours, the way a real meadow is blotchy and flecked rather than one green
  function meadowOk(x, y) { if (x < 0 || y < 0 || x >= WX || y / K >= WY) return false; if (mtn && (cellAt(x, y / K) & (M_BLOCK | M_RAMP))) return false; var ex = elevAt(x, y / K); return ex >= 0.4 && ex >= beachAt(x / T, y / K / T) + 0.35; }
  w.drawMeadow = function (c, cam, hw, hh, G) {
    var sp = G.patchSize || 70, gx0 = Math.floor((cam.x - hw) / sp) - 2, gx1 = Math.ceil((cam.x + hw) / sp) + 1, gy0 = Math.floor((cam.y - hh) / (sp * 0.75)) - 2, gy1 = Math.ceil((cam.y + hh) / (sp * 0.75)) + 1, gx, gy;
    if (G.patches > 0) for (gy = gy0; gy <= gy1; gy++) for (gx = gx0; gx <= gx1; gx++) {           // big soft blotches, lighter or darker
      var hp = hash(gx, gy, 41); if (hp > 0.8) continue;
      var x = (gx + hash(gx, gy, 42)) * sp, y = (gy + hash(gx, gy, 43)) * sp * 0.75; if (!meadowOk(x, y)) continue;
      var r = sp * (0.5 + hash(gx, gy, 44) * 0.7), light = hp < 0.45;
      var gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, light ? G.patchLight : G.patchDark); gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.save(); c.translate(x, y); c.scale(1, 0.6 + hash(gx, gy, 45) * 0.2); c.rotate((hash(gx, gy, 46) - 0.5) * 0.8); c.translate(-x, -y);
      c.fillStyle = gr; c.globalAlpha = (light ? 0.5 : 0.4) * G.patches; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore();
    }
    c.globalAlpha = 1;
    var es = sp * 1.9; gx0 = Math.floor((cam.x - hw) / es) - 1; gx1 = Math.ceil((cam.x + hw) / es); gy0 = Math.floor((cam.y - hh) / (es * 0.75)) - 1; gy1 = Math.ceil((cam.y + hh) / (es * 0.75));
    if (G.earth > 0) for (gy = gy0; gy <= gy1; gy++) for (gx = gx0; gx <= gx1; gx++) {             // bare earth showing through, with a soft grassy edge
      if (hash(gx, gy, 51) > G.earth) continue;
      var ex0 = (gx + hash(gx, gy, 52)) * es, ey0 = (gy + hash(gx, gy, 53)) * es * 0.75; if (!meadowOk(ex0, ey0)) continue;
      var er = 9 + hash(gx, gy, 54) * 14, k;
      c.save(); c.translate(ex0, ey0); c.rotate((hash(gx, gy, 55) - 0.5) * 1.2); c.scale(1, 0.55);
      c.fillStyle = G.earthEdge; c.globalAlpha = 0.55; c.beginPath(); for (k = 0; k < 8; k++) { var aa = k / 8 * 6.283, rr = er * (1.15 + (hash(gx * 3 + k, gy, 56) - 0.5) * 0.5); c.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } c.closePath(); c.fill();
      c.fillStyle = G.earthCol; c.globalAlpha = 0.9; c.beginPath(); for (k = 0; k < 8; k++) { var ab = k / 8 * 6.283, rb = er * (0.85 + (hash(gx * 3 + k, gy, 56) - 0.5) * 0.5); c.lineTo(Math.cos(ab) * rb, Math.sin(ab) * rb); } c.closePath(); c.fill();
      c.fillStyle = G.earthLight; c.globalAlpha = 0.5; c.beginPath(); c.ellipse(-er * 0.2, -er * 0.25, er * 0.4, er * 0.3, 0, 0, 7); c.fill();
      c.restore();
    }
    c.globalAlpha = 1;
    var ds = sp * 1.3; gx0 = Math.floor((cam.x - hw) / ds) - 1; gx1 = Math.ceil((cam.x + hw) / ds); gy0 = Math.floor((cam.y - hh) / (ds * 0.75)) - 1; gy1 = Math.ceil((cam.y + hh) / (ds * 0.75));
    if (G.drifts > 0) for (gy = gy0; gy <= gy1; gy++) for (gx = gx0; gx <= gx1; gx++) {            // drifts of tiny flowers, one colour to a drift
      if (hash(gx, gy, 61) > G.drifts) continue;
      var dx0 = (gx + hash(gx, gy, 62)) * ds, dy0 = (gy + hash(gx, gy, 63)) * ds * 0.75, n = 8 + Math.floor(hash(gx, gy, 64) * 16), col = G.bloom[Math.floor(hash(gx, gy, 65) * G.bloom.length) % G.bloom.length];
      var ang = hash(gx, gy, 66) * 3.14, lenD = ds * (0.5 + hash(gx, gy, 67) * 0.6), wid = ds * 0.18;
      c.fillStyle = col;
      for (var q = 0; q < n; q++) {
        var u = (hash(gx, gy + 100, 70 + q) - 0.5) * lenD, v = (hash(gx + 100, gy, 70 + q) - 0.5) * wid, fx = dx0 + Math.cos(ang) * u - Math.sin(ang) * v, fy = dy0 + (Math.sin(ang) * u + Math.cos(ang) * v) * 0.75;
        if (!meadowOk(fx, fy)) continue;
        var fr = 0.7 + hash(gx + q, gy, 71) * 0.7; c.globalAlpha = 0.85; c.beginPath(); c.arc(fx, fy, fr, 0, 7); c.fill();
      }
    }
    c.globalAlpha = 1;
  };
  // living grass: tufts of blades on the open ground that sway in a wind, with slow bands of light rolling over the meadow
  // like the glints on the water. G is a World.GRASS-style spec (palette, density, sway); nothing is drawn on sand or water.
  w.drawGrass = function (c, cam, hw, hh, clock, G) {
    G = G || GRASS; if (!w.meadowLook) w.drawMeadow(c, cam, hw, hh, G); if (!(G.density > 0)) return;   // a page that sets w.meadowLook has the meadow baked into the ground
    var sp = G.spacing, gx0 = Math.floor((cam.x - hw) / sp) - 1, gx1 = Math.ceil((cam.x + hw) / sp), gy0 = Math.floor((cam.y - hh) / (sp * 0.75)) - 1, gy1 = Math.ceil((cam.y + hh) / (sp * 0.75)) + 1;
    var cols = [G.dark, G.mid, G.light], sp0 = G.speed;
    c.lineCap = 'round';
    for (var gy = gy0; gy <= gy1; gy++) for (var gx = gx0; gx <= gx1; gx++) {
      var h1 = hash(gx, gy, 31); if (h1 > G.density) continue;
      var x = (gx + hash(gx, gy, 32)) * sp, y = (gy + hash(gx, gy, 33)) * sp * 0.75;
      if (x < 0 || y < 0 || x >= WX || y / K >= WY) continue;
      if (!meadowOk(x, y)) continue;
      var wave = Math.sin(x * 0.011 - clock * 0.9 * sp0 + y * 0.007), gust = Math.sin(clock * 0.35 * sp0 + x * 0.004 - y * 0.003);
      if (G.shimmer > 0 && wave > 0.2) { var gr = c.createRadialGradient(x, y, 0, x, y, sp * 1.1); gr.addColorStop(0, G.glow); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.save(); c.translate(x, y); c.scale(1, 0.5); c.translate(-x, -y); c.fillStyle = gr; c.globalAlpha = (wave - 0.2) * 0.34 * G.shimmer; c.beginPath(); c.arc(x, y, sp * 1.1, 0, 7); c.fill(); c.restore(); c.globalAlpha = 1; }
      var sway = (Math.sin(clock * 1.9 * sp0 + x * 0.05 + y * 0.03) * 0.5 + gust * 0.7 + wave * 0.25) * G.sway, n = 3 + Math.floor(hash(gx, gy, 34) * 3);
      if (G.shade > 0) { c.fillStyle = G.dark; c.globalAlpha = 0.28 * G.shade; c.beginPath(); c.ellipse(x, y + 0.6, 4.6, 1.8, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
      for (var k = 0; k < n; k++) {
        var hk = hash(gx * 7 + k, gy, 35), bx = (k - (n - 1) / 2) * 1.7 + (hk - 0.5) * 1.2, bh = G.height * (0.65 + hk * 0.7), lean = (k - (n - 1) / 2) * 0.9 + sway * bh * 0.5;
        c.fillStyle = cols[(k + gx + gy) % 3 === 0 ? 0 : (hk > 0.55 ? 2 : 1)];
        c.beginPath(); c.moveTo(x + bx - 0.9, y); c.quadraticCurveTo(x + bx + lean * 0.35, y - bh * 0.6, x + bx + lean, y - bh); c.quadraticCurveTo(x + bx + lean * 0.35 + 0.5, y - bh * 0.55, x + bx + 0.9, y); c.closePath(); c.fill();
      }
      if (G.flowers > 0 && hash(gx, gy, 36) < G.flowers) {
        var fc = G.bloom[Math.floor(hash(gx, gy, 37) * G.bloom.length) % G.bloom.length], fh = G.height * 0.9;
        c.strokeStyle = G.mid; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x + 2.2, y); c.lineTo(x + 2.2 + sway * fh * 0.5, y - fh); c.stroke();
        c.fillStyle = fc; c.beginPath(); c.arc(x + 2.2 + sway * fh * 0.5, y - fh, 1.4, 0, 7); c.fill();
      }
    }
  };
  // wave glints drifting across open water, and small waves rolling in against the shore: lines of equal depth
  // traced along the height field, so they follow the curve of the coast
  w.drawWaves = function (c, cam, hw, hh, clock, waves, foam) {
    if (waves > 0) {
      c.lineCap = 'round'; c.lineWidth = 1.1;
      var gx0 = Math.floor((cam.x - hw) / 44), gx1 = Math.ceil((cam.x + hw) / 44), gy0 = Math.floor((cam.y - hh) / 30), gy1 = Math.ceil((cam.y + hh) / 30);
      for (var gy = gy0; gy <= gy1; gy++) for (var gx = gx0; gx <= gx1; gx++) {
        var hsh = hash(gx, gy, 3), wx = gx * 44 + hsh * 30 + ((clock * 7 + hsh * 60) % 44), wy = gy * 30 + hash(gx, gy, 4) * 22;
        if (!w.isWater(wx, wy / K)) continue;
        var al = (0.5 + 0.5 * Math.sin(clock * 1.3 + hsh * 20)) * 0.32 * waves; if (al < 0.03) continue;
        c.strokeStyle = 'rgba(220,250,255,' + al.toFixed(3) + ')'; c.beginPath(); c.moveTo(wx - 5, wy); c.quadraticCurveTo(wx - 2.5, wy - 2.2, wx, wy); c.quadraticCurveTo(wx + 2.5, wy + 2.2, wx + 5, wy); c.stroke();
      }
    }
    if (foam > 0) {
      var lx0 = Math.max(0, Math.floor((cam.x - hw) / T) - 1), lx1 = Math.min(GW - 2, Math.ceil((cam.x + hw) / T)), ly0 = Math.max(0, Math.floor((cam.y - hh) / TS) - 1), ly1 = Math.min(GH - 2, Math.ceil((cam.y + hh) / TS));
      var lw = lx1 - lx0 + 2, lh = ly1 - ly0 + 2, F = new Float32Array(lw * lh), any = false, yy, xx;
      for (yy = 0; yy < lh; yy++) for (xx = 0; xx < lw; xx++) {
        var ev = E[(ly0 + yy) * GW + lx0 + xx] / 100; if (ev > -3 && ev < 1) any = true;
        F[yy * lw + xx] = ev + Math.sin((lx0 + xx) * 0.9 + clock * 0.7) * Math.cos((ly0 + yy) * 0.8 - clock * 0.5) * 0.14;
      }
      if (any) for (var wv = 0; wv < 2; wv++) {
        var pr = (clock * 0.3 + wv * 0.5) % 1, lv = -1.25 + pr * 1.15, al2 = Math.pow(Math.sin(pr * Math.PI), 0.8) * (0.25 + 0.6 * pr) * foam;
        if (al2 < 0.03) continue;
        c.strokeStyle = 'rgba(255,255,255,' + Math.min(0.9, al2).toFixed(3) + ')'; c.lineWidth = 1 + pr * 1.5; c.lineCap = 'round'; c.beginPath();
        for (yy = 0; yy < lh - 1; yy++) for (xx = 0; xx < lw - 1; xx++) {
          var q0 = yy * lw + xx, a0 = F[q0] - lv, b0 = F[q0 + 1] - lv, d0 = F[q0 + lw] - lv, c0 = F[q0 + lw + 1] - lv;
          if ((a0 > 0) === (b0 > 0) && (a0 > 0) === (c0 > 0) && (a0 > 0) === (d0 > 0)) continue;
          var X = (lx0 + xx + 0.5) * T, Y = (ly0 + yy + 0.5) * TS, pts = [];
          if ((a0 > 0) !== (b0 > 0)) pts.push(X + a0 / (a0 - b0) * T, Y);
          if ((b0 > 0) !== (c0 > 0)) pts.push(X + T, Y + b0 / (b0 - c0) * TS);
          if ((d0 > 0) !== (c0 > 0)) pts.push(X + d0 / (d0 - c0) * T, Y + TS);
          if ((a0 > 0) !== (d0 > 0)) pts.push(X, Y + a0 / (a0 - d0) * TS);
          c.moveTo(pts[0], pts[1]); c.lineTo(pts[2], pts[3]);
          if (pts.length === 8) { c.moveTo(pts[4], pts[5]); c.lineTo(pts[6], pts[7]); }
        }
        c.stroke();
      }
    }
  };

  /* what stands on the land: props in buckets, one bucket per piece of map; solids beside them for collision */
  var buckets = [], solidB = [];
  w.buckets = buckets; w.solidB = solidB;
  w.bucketOf = function (x, y) { return Math.floor(x / T / CT) + Math.floor(y / T / CT) * CW; };
  w.addProp = function (p) {
    var b = w.bucketOf(p.x, p.y); p.b = b;
    (buckets[b] || (buckets[b] = [])).push(p);
    if (p.r) { p.sol = { x: p.x, y: p.y, r: p.r * p.s, hide: true }; (solidB[b] || (solidB[b] = [])).push(p.sol); }
  };
  w.removeProp = function (p) {
    var l = buckets[p.b], kk = l ? l.indexOf(p) : -1; if (kk >= 0) l.splice(kk, 1);
    if (p.sol) { l = solidB[p.b]; kk = l ? l.indexOf(p.sol) : -1; if (kk >= 0) l.splice(kk, 1); }
  };
  w.around = function (x, y, fn) {               // every prop in the pieces of map round a point
    var bx = Math.floor(x / T / CT), by = Math.floor(y / T / CT), dx, dy;
    for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) { var qx = bx + dx, qy = by + dy; if (qx < 0 || qy < 0 || qx >= CW || qy >= CH) continue; var l = buckets[qy * CW + qx]; if (l) for (var ii = 0; ii < l.length; ii++) fn(l[ii]); }
  };
  w.nearSolids = function (P) {                 // only what stands near the hero can block him
    var bx = Math.floor(P.x / T / CT), by = Math.floor(P.y / T / CT), out = [], dx, dy;
    for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) { var qx = bx + dx, qy = by + dy; if (qx < 0 || qy < 0 || qx >= CW || qy >= CH) continue; var l = solidB[qy * CW + qx]; if (l) for (var ii = 0; ii < l.length; ii++) out.push(l[ii]); }
    return out;
  };
  w.sortBuckets = function () { buckets.forEach(function (b) { if (b) b.sort(function (p, q) { return p.y - q.y; }); }); };
  w.eachProp = function (fn) { buckets.forEach(function (b) { if (b) b.slice().forEach(fn); }); };
  // 5. what grows there: the first biome only. Trees stand in groves with open ground between them; the beach stays bare.
  w.plant = function () {
    var TREES = ['birch', 'pine', 'birch', 'pine', 'oak'].filter(function (nm) { return !!kit.PROPS[nm]; }), LOW = ['oak', 'beech', 'ash', 'beech', 'oak', 'apple'].filter(function (nm) { return !!kit.PROPS[nm]; }), home = w.home;   // the lowlands: oak, beech, ash, an apple tree now and then
    for (y = 3; y < GH - 3; y++) for (x = 3; x < GW - 3; x++) {
      var t3 = grid[y * GW + x]; if (t3 === 0 || t3 === 4) continue;
      var roll = R(), wx = (x + 0.2 + R() * 0.6) * T, wy = (y + 0.3 + R() * 0.5) * T, p = null;
      if (Math.hypot(wx - home.x, wy - home.y) < 130) continue;
      var mcell = mtn ? cellAt(wx, wy) : 0, mlv = mcell & 3;
      if (mcell & (M_BLOCK | M_RAMP)) continue;                              // a cliff, a peak or a slope: nothing grows there
      if (mlv && t3 >= 2) {                                                  // the fells: sparse pine and dwarf birch on the foothills, juniper, heather and boulders; the high plateau all but bare of trees
        var grove = vnoise(x / 7, y / 7, s + 20), has = function (nm) { return !!kit.PROPS[nm]; };
        if (mlv === 1) {
          if (roll < 0.1 && grove > 0.64) { var tm = R() < 0.4 && has('dwarfBirch') ? 'dwarfBirch' : (R() < 0.7 ? 'pine' : 'birch'); p = { name: tm, s: tm === 'dwarfBirch' ? 0.8 + R() * 0.25 : (tm === 'pine' ? 0.5 : 0.45) + R() * 0.1, r: tm === 'dwarfBirch' ? 7 : 11 }; w.stats.trees++; }
          else if (roll > 0.95) p = { name: ['juniper', 'heather', 'bush', 'heather', 'tallGrass', 'berryBush'].filter(has)[Math.floor(R() * 6) % ['juniper', 'heather', 'bush', 'heather', 'tallGrass', 'berryBush'].filter(has).length], s: 0.9, r: 0 };
          else if (roll > 0.936) { p = { name: R() < 0.5 && has('boulder') ? 'boulder' : (R() < 0.6 ? 'rock' : 'rockFormation'), s: 0.85 + R() * 0.3, r: 11 }; w.stats.rocks++; }
        } else {
          if (roll < 0.035 && grove > 0.6 && has('dwarfBirch')) { p = { name: 'dwarfBirch', s: 0.75 + R() * 0.25, r: 7 }; w.stats.trees++; }
          else if (roll > 0.93) p = { name: ['heather', 'heather', 'juniper', 'heather', 'wildHerbs'].filter(has)[Math.floor(R() * 5) % ['heather', 'heather', 'juniper', 'heather', 'wildHerbs'].filter(has).length], s: 0.9, r: 0 };
          else if (roll > 0.9) { p = { name: R() < 0.6 && has('boulder') ? 'boulder' : (R() < 0.5 ? 'rock' : 'rockFormation'), s: 0.85 + R() * 0.45, r: 12 }; w.stats.rocks++; }
        }
      } else if (t3 >= 2 && t3 !== 5) {
        var bmp = w.biomeAt(x, y);
        if (roll < 0.15 && vnoise(x / 7, y / 7, s + 20) > 0.62) { var tl = bmp > R() && LOW.length ? LOW : TREES, tn = tl[Math.floor(R() * tl.length) % tl.length]; if (R() < 0.02 && kit.PROPS.struckTree) tn = 'struckTree'; p = { name: tn, s: (tn === 'pine' ? 0.54 : (tn === 'struckTree' ? 0.6 : 0.49)) + R() * 0.1, r: 11 }; w.stats.trees++; }   // now and then a tree struck by lightning: charcoal
        else if (roll > 0.955) p = { name: ['bush', 'tallGrass', 'berryBush', 'wildHerbs', 'flower'][Math.floor(R() * 5)], s: 0.9, r: 0 };
        else if (roll > 0.948) { p = { name: bmp > 0.5 && kit.PROPS.chalkRock && R() < 0.7 ? 'chalkRock' : (R() < 0.6 ? 'rock' : 'rockFormation'), s: 0.9, r: 10 }; w.stats.rocks++; }
        else if (roll > 0.9475) p = { name: ['fallenTree', 'birdNest', 'mushrooms', 'fallenTree', 'wildHerbs', 'fireRing'][Math.floor(R() * 6)], s: 1, r: 10 };   // things of nature, and an old fire ring someone left: no carved stones or posts lie about
      } else if (t3 === 1 && roll < 0.008) { p = { name: 'rock', s: 0.7 + R() * 0.35, r: 9 }; w.stats.rocks++; }
      if (!p || !kit.PROPS[p.name]) continue;
      p.x = wx; p.y = wy; p.v = Math.floor(R() * 3);
      p.kind = KIND[p.name] || null; if (p.kind) { p.max = p.hp = HP[p.name] * (0.7 + 0.6 * p.s); p.leanDir = R() < 0.5 ? -1 : 1; }
      w.addProp(p);
    }
    if (mtn && kit.PROPS.cairn) mtn.ramps.forEach(function (rm) {            // a cairn at the foot and the head of every slope: the old way of marking a way up
      (rm.gap ? [[rm.x1 + 30, rm.y1 + 4]] : [[rm.x1 + 38, rm.y1 - 6], [rm.x0 - 38, rm.y0 + 10]]).forEach(function (q) { if (w.flatAt(q[0], q[1], 12)) w.addProp({ name: 'cairn', x: q[0], y: q[1], s: 0.9, r: 8, v: Math.floor(R() * 3) }); });
    });
    return w.stats;
  };
  // 5b. the peaks (2026-10-12): the Blender peaks stood on the ground nobody can walk. A peak goes only where everything under
  // its foot is peak ground or cliff, so it never covers a place you can stand; the biggest that fits, a smaller one where it
  // does not, set back to front so the near ones stand before the far.
  w.peaks = function () {
    if (!mtn) return 0; var n = 0, placed = [], kinds = ['peak_a', 'peak_b', 'peak_c'].filter(function (nm) { return !!IMAGES[nm]; }); if (!kinds.length) return 0;
    function fits(im, sc, x, y) {
      var hw = im.w * im.upp * sc * 0.44, up = im.ay * im.upp * sc, dn = (im.h - im.ay) * im.upp * sc, a, b;
      if ((cellAt(x, y) & 3) !== 3) return false;
      for (b = -0.8; b <= 1.001; b += 0.2) for (a = -1; a <= 1.001; a += 0.25) { var py = b < 0 ? y + b * up / K : y + b * dn / K, c1 = cellAt(x + a * hw * (b < 0 ? 1 + b * 1.4 : 1), py); if (!(c1 & M_BLOCK)) return false; }
      return true;
    }
    var j, i, step = 3 * T;
    for (j = mtn.by1; j > mtn.by0; j -= step) for (i = mtn.bx0; i < mtn.bx1; i += step) {
      var x = i + (hash(i, j, s + 81) - 0.5) * step * 0.8, y = j + (hash(i, j, s + 82) - 0.5) * step * 0.8, done = false, ki, si;
      if ((cellAt(x, y) & 3) !== 3) continue;
      for (ki = 0; ki < kinds.length && !done; ki++) for (si = 0; si < 3 && !done; si++) {
        var kn = kinds[(ki + Math.floor(hash(i, j, s + 83) * kinds.length)) % kinds.length], im = IMAGES[kn], sc = [1, 0.78, 0.6][si], ww = im.w * im.upp * sc;
        if (placed.some(function (q) { return Math.abs(q.x - x) < (q.w + ww) * 0.46 && Math.abs(q.y - y) < 260; })) continue;
        if (fits(im, sc, x, y)) { w.addProp({ name: kn, x: x, y: y, s: sc, r: 0, v: 0, peak: true }); placed.push({ x: x, y: y, w: ww }); n++; done = true; }
      }
    }
    w.stats.peaks = n; return n;
  };
  // where the cave goes (2026-10-12): at the foot of a cliff one level high, where the face runs straight and the ground
  // before it is level and open, away from any slope. Returns { x, y } (the foot of the face) or null. lvl: the ground it opens on.
  w.caveSite = function (Rr, lvl) {
    if (!mtn) return null; var cands = [], i, j, FH = Math.round(HFW / MC), want = lvl == null ? 1 : lvl;
    function cv(a, b) { return (a < 0 || b < 0 || a >= mtn.w || b >= mtn.h) ? 0 : mtn.CL[b * mtn.w + a]; }
    for (j = FH + 4; j < mtn.h - 20; j += 2) for (i = 16; i < mtn.w - 16; i += 2) {
      var c0 = cv(i, j); if ((c0 & (M_BLOCK | M_RAMP)) || (c0 & 3) !== want || !(cv(i, j - 1) & M_FACE)) continue;
      var ok = true, d, k;
      for (d = -12; ok && d <= 12; d += 3) {
        if (!(cv(i + d, j - 1) & M_FACE) || !(cv(i + d, j - FH + 2) & M_FACE) || (cv(i + d, j - FH - 3) & 3) !== want + 1 || (cv(i + d, j - FH - 3) & M_FACE)) ok = false;   // one level of face over it, level ground above that
        for (k = 0; ok && k <= 16; k += 2) { var cg = cv(i + d, j + k); if ((cg & (M_BLOCK | M_RAMP)) || (cg & 3) !== want) ok = false; }   // open level ground in front
      }
      var x = (mtn.x0 + i + 0.5) * MC, y = (mtn.y0 + j) * MC;
      if (ok && mtn.ramps.some(function (rm) { return Math.hypot(rm.ex - x, rm.ey - y) < 300; })) ok = false;
      if (ok) cands.push({ x: x, y: y });
    }
    if (!cands.length) return want > 0 ? w.caveSite(Rr, want - 1) : null;
    return cands[Math.floor((Rr ? Rr() : 0.5) * cands.length) % cands.length];
  };
  // the nearest level ground to a point, on a given level, with room round it (for placing things and for the test scene)
  w.nearFlat = function (x, y, lvl, room) {
    var d, a; room = room || 26;
    for (d = 0; d < 1600; d += 16) for (a = 0; a < (d ? 16 : 1); a++) { var px = x + Math.cos(a * 0.3927) * d, py = y + Math.sin(a * 0.3927) * d; if (w.isLand(px, py) && (lvl == null || (cellAt(px, py) & 3) === lvl) && w.flatAt(px, py, room)) return { x: px, y: py }; }
    return null;
  };
  // 6. the ground dresses itself with the brush (2026-10-07, Robin: use the brush to make the ground more natural): bare earth
  // in the heart of the thickest groves, moss round the pines, gravel at the feet of the rock outcrops; cells only, no repaint
  w.dress = function () {
    function dab(x, y, r, kind) { var qx0 = Math.floor((x - r) / GQ), qx1 = Math.floor((x + r) / GQ), qy0 = Math.floor((y - r) / GQ), qy1 = Math.floor((y + r) / GQ), qx, qy; for (qy = qy0; qy <= qy1; qy++) for (qx = qx0; qx <= qx1; qx++) { var dx = (qx + 0.5) * GQ - x, dy = (qy + 0.5) * GQ - y; if (dx * dx + dy * dy * 1.6 > r * r) continue; if (!w.isLand((qx + 0.5) * GQ, (qy + 0.5) * GQ)) continue; w.ground[qx + ',' + qy] = kind; } }
    var n = 0;
    for (y = 4; y < GH - 4; y++) for (x = 4; x < GW - 4; x++) {
      if (grid[y * GW + x] < 2) continue;
      var gv = vnoise(x / 7, y / 7, s + 20);
      var bmd = w.biomeAt(x, y);
      if (bmd > 0.55 && eTile(x, y) < beachAt(x, y) + 2.2 && gv < 0.55 && R() < 0.14) { dab((x + 0.5) * T, (y + 0.5) * T, 16 + R() * 18, 6); n++; continue; }   // the lowlands: marsh on the low ground by the water
      if (bmd > 0.6 && gv < 0.42 && eTile(x, y) > 2 && R() < 0.012) { for (var fi = -2; fi <= 2; fi++) dab((x + 0.5 + fi * 0.9) * T, (y + 0.5) * T, 13 + R() * 4, 4); n++; continue; }   // a strip of ploughed field in the open
      if (gv > 0.76 && R() < 0.22) { dab((x + 0.5) * T, (y + 0.5) * T, 18 + R() * 16, 2); n++; }            // earth under the thickest canopy
      else if (gv > 0.62 && gv < 0.7 && R() < 0.1) { dab((x + 0.5) * T, (y + 0.5) * T, 12 + R() * 12, 3); n++; }   // moss at a grove's edge
    }
    var k; for (k in w.buckets) { var bk = w.buckets[k]; if (!bk || !bk.length) continue; for (var i = 0; i < bk.length; i++) { var p = bk[i]; if (p.name === 'rockFormation' || p.name === 'chalkRock') { dab(p.x, p.y + 4, 14 + R() * 6, p.name === 'chalkRock' || w.biome(p.x, p.y) > 0.5 ? 5 : 1); n++; } else if (p.name === 'pine' && R() < 0.35) { dab(p.x, p.y + 6, 10 + R() * 8, 3); n++; } } }
    return n;
  };
  // bog iron (2026-10-07, the lowlands' metal): rusty lumps in the marsh, a few to a bog, planted on the marsh cells after dressing
  w.plantBog = function () {
    var k, n = 0, placed = [];
    for (k in w.ground) {
      if (w.ground[k] !== 6 || R() > 0.035) continue;
      var q = k.split(','), x = (+q[0] + 0.5) * GQ + (R() - 0.5) * 6, y = (+q[1] + 0.5) * GQ + (R() - 0.5) * 6, i, ok = w.isLand(x, y);
      for (i = 0; ok && i < placed.length; i++) if (Math.hypot(placed[i][0] - x, placed[i][1] - y) < 44) ok = false;
      if (!ok || !kit.PROPS.bogIron) continue;
      var p = { name: 'bogIron', x: x, y: y, s: 0.85 + R() * 0.2, r: 7, v: Math.floor(R() * 3), kind: 'stone', bog: true }; p.max = p.hp = HP.bogIron * (0.7 + 0.6 * p.s); p.leanDir = 1;
      w.addProp(p); placed.push([x, y]); n++;
    }
    return n;
  };
  w.camp = function (list) {
    (list || CAMP).forEach(function (q) {
      var px = w.home.x + q[1], py = w.home.y + q[2];
      if (kit.PROPS[q[0]] && w.isLand(px, py)) w.addProp({ name: q[0], x: px, y: py, s: 1, r: q[3], v: 0 });
    });
  };
  // the chart: one pixel per tile (or per few tiles), at most maxPx wide
  w.chart = function (maxPx) {
    var step = Math.max(1, Math.ceil(GW / maxPx)), mw = Math.floor(GW / step), mh = Math.floor(GH / step), cv = kit.mk(mw, mh);
    var mc = cv.getContext('2d'), img = mc.createImageData(mw, mh), COL = [[33, 96, 122], [232, 204, 140], [96, 168, 84], [78, 146, 76], [140, 106, 72], [120, 116, 128]], MCOL = [null, [128, 170, 96], [150, 162, 122], [236, 240, 246]];
    for (var yy = 0; yy < mh; yy++) for (var xx = 0; xx < mw; xx++) { var gi = yy * step * GW + xx * step, cc = COL[grid[gi]], ip = (yy * mw + xx) * 4, bmc = grid[gi] >= 2 && grid[gi] !== 4 ? BM[gi] / 255 : 0; img.data[ip] = cc[0] + (150 - cc[0]) * bmc; img.data[ip + 1] = cc[1] + (176 - cc[1]) * bmc; img.data[ip + 2] = cc[2] + (70 - cc[2]) * bmc; img.data[ip + 3] = 255;
      if (mtn) { var mcc = cellAt((xx * step + 0.5) * T, (yy * step + 0.5) * T), mlc = mcc & 3, mk2 = (mcc & M_FACE) ? COL[5] : ((mcc & M_RIM) ? [88, 84, 96] : (mlc ? MCOL[mlc] : null)); if (mk2 && grid[gi] >= 1) { img.data[ip] = mk2[0]; img.data[ip + 1] = mk2[1]; img.data[ip + 2] = mk2[2]; } }   // the fells paler by the level, the faces grey, the peaks white
    }   // the lowlands warmer on the chart
    mc.putImageData(img, 0, 0);
    return cv;
  };
  return w;
}
var GRASS = { density: 0.4, spacing: 19, height: 6, sway: 0.5, speed: 1, shimmer: 0.6, shade: 0.8, flowers: 0.05,
  patches: 1, patchSize: 70, patchLight: '#c8e07a', patchDark: '#4a8a3a', earth: 0.3, earthCol: '#b08a56', earthLight: '#d2b078', earthEdge: '#7a9a40', drifts: 0.55,
  dark: '#3f8a3c', mid: '#6cb84a', light: '#a6d85c', glow: '#f4ffb0', bloom: ['#ffffff', '#ffe36b', '#ff9fc2', '#ff8a4a'] };   // the default living-grass look (the Grass Editor tunes it)
// the living grass in the ink look (docs/art-direction.md): moss and ochre, muted blooms, the same drawing
var GRASS_INK = { density: 0.4, spacing: 19, height: 6, sway: 0.5, speed: 1, shimmer: 0.35, shade: 0.9, flowers: 0.04,
  patches: 1, patchSize: 70, patchLight: '#a9b96a', patchDark: '#4b6b3a', earth: 0.3, earthCol: '#9a7f55', earthLight: '#b89a68', earthEdge: '#6e7f40', drifts: 0.45,
  dark: '#3d6a33', mid: '#5f8a44', light: '#8aa65a', glow: '#d6d690', bloom: ['#efe6cf', '#dfc45e', '#d99aa8', '#d88a5a'] };
return { make: make, setImages: setImages, IMAGES: IMAGES, MOUNTAIN_SPEC: { isle: 220, isle0: 220, count: 1, noDock: true, skerries: 1, rough: 1, beach: 4.5, hue: 0, seed: 11, mountain: true, sizes: null, biomes: null, big: null }, DEF: DEF, GRASS: GRASS, GRASS_INK: GRASS_INK, KIND: KIND, HP: HP, CAMP: CAMP, hash: hash, vnoise: vnoise, fbm: fbm, T: T, TS: TS, K: K, CT: CT };
})();
if (typeof module !== 'undefined') module.exports = World;
