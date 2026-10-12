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

// a sheet of white noise, 256 pixels square: a speck a pixel (pebbles, flecks) without a sine a pixel
var WSN = 256, whiteT = null;
function whiteSheet() { if (whiteT) return whiteT; var o = new Float32Array(WSN * WSN), i; for (i = 0; i < WSN * WSN; i++) o[i] = hash(i % WSN, (i / WSN) | 0, 77); return (whiteT = o); }

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
  var BASE = kit.STYLE, tiles = {}, sprites = {}, chunkCv = {}, chunkOrder = [], noise = noiseSheet(), white = whiteSheet(), MB = null, PKC = {}, PKS = null;

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
     units a level (HF pixels on the screen): rock you cannot walk on, painted as a wall. An edge that faces east or west stands
     on a battered foot: its SIDE wall leans SIDE units out a level and, like every wall, HFW down the screen, so a plateau has
     a lit west side and a dark east side. Where an edge faces away (north) there is only a RIM, a lip of rock a cell wide on
     each side. The peaks (level 3) cannot be walked. SLOPES are the ways up: a strip cut through a south face where the edge
     runs straight, found from the field and spread along the island. On one side of the island (o.mountainOpts.seaSide) the
     mountains come down to the water: SEA CLIFFS whose foot stands in the sea, and a bay cut in under them. A WATERFALL comes
     off the plateau into a pool (cells marked WATER: waded, never built on), and a LOOKOUT stands on a high point. Everything
     the game asks (walking, building, planting) reads a grid of cells 8 units wide (w.cellAt: the level in two bits, FACE 4,
     RIM 8, RAMP 16, BLOCK 32, SIDE 64, WATER 128), so w.isLand is false on a face, a side wall, a rim and a peak. */
  var MT = null, mtn = null, HF = 84, HFW = HF / K, MC = 8, SIDE = 24, M_FACE = 4, M_RIM = 8, M_RAMP = 16, M_BLOCK = 32, M_SIDE = 64, M_WATER = 128;
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
    var sea = mo.sea !== false, seaSide = mo.seaSide === -1 ? -1 : 1;
    // where the mountain is: across the island's north (how far north a tile lies on its own land), or, with mo.at = [x, y] in
    // island radii from its middle, round one place, mo.r island radii across: its height by how far out a tile lies is mo.prof
    // (pairs of [how far out 0..1, height]): by default a wide ring of foothills, a plateau inside it, a peak or two in the middle
    var atC = mo.at ? [mq.x + mo.at[0] * mq.r, mq.y + mo.at[1] * mq.r] : null, atR = (mo.r || 0.45) * mq.r, PROF = mo.prof || [[0, 3.5], [0.1, 3.0], [0.28, 2.45], [0.44, 2.0], [0.6, 1.5], [0.82, 1.0], [1, 0]];
    function profAt(dn) { var k; if (dn >= 1) return 0; for (k = 1; k < PROF.length; k++) if (dn <= PROF[k][0]) return PROF[k - 1][1] + (PROF[k][1] - PROF[k - 1][1]) * (dn - PROF[k - 1][0]) / (PROF[k][0] - PROF[k - 1][0]); return 0; }
    function northOf(ax, ay) { if (atC) return profAt(Math.hypot(ax - atC[0], ay - atC[1]) / atR * (0.88 + 0.24 * fbm(ax / 17, ay / 17, s + 145))) / high; return sstep(south, top, (yS - ay) / Math.max(1, yS - yN)); }
    // how far every tile is from the sea, in tiles (two sweeps), and the island's own northernmost and southernmost land
    var DS = new Float32Array(GW * GH), yN = 1e9, yS = -1e9, dv;
    function seaDist() {
      yN = 1e9; yS = -1e9;
      for (ty = ty0; ty <= ty1; ty++) for (tx = tx0; tx <= tx1; tx++) DS[ty * GW + tx] = E[ty * GW + tx] > 0 ? 1e6 : 0;
      for (ty = ty0 + 1; ty <= ty1; ty++) for (tx = tx0 + 1; tx < tx1; tx++) { i = ty * GW + tx; dv = Math.min(DS[i], DS[i - 1] + 1, DS[i - GW] + 1, DS[i - GW - 1] + 1.414, DS[i - GW + 1] + 1.414); DS[i] = dv; }
      for (ty = ty1 - 1; ty >= ty0; ty--) for (tx = tx1 - 1; tx > tx0; tx--) { i = ty * GW + tx; dv = Math.min(DS[i], DS[i + 1] + 1, DS[i + GW] + 1, DS[i + GW + 1] + 1.414, DS[i + GW - 1] + 1.414); DS[i] = dv; if (dv > 5) { if (ty < yN) yN = ty; if (ty > yS) yS = ty; } }
    }
    seaDist();
    // the bay under the sea cliffs: a bite out of the coast on the cliffs' side, so there is a wall that faces south over water
    var bay = null;
    if (sea && mo.bay !== false) {
      var yb = Math.round(yS - (mo.bayAt != null ? mo.bayAt : 0.62) * (yS - yN)), xe = -1, bx;
      for (bx = seaSide > 0 ? tx1 : tx0; bx >= tx0 && bx <= tx1; bx -= seaSide) if (DS[yb * GW + bx] > 2.5) { xe = bx; break; }
      if (xe >= 0) {
        var ba = mo.bayLen || Math.max(12, mq.r * 0.2), bb = mo.bayWide || Math.max(6, mq.r * 0.08);
        bay = { x: xe + seaSide * 4, y: yb, a: ba + 4, b: bb };
        for (ty = Math.max(ty0, Math.floor(yb - bb * 1.9)); ty <= Math.min(ty1, Math.ceil(yb + bb * 1.9)); ty++) for (tx = tx0; tx <= tx1; tx++) {
          var bk = 1 + (fbm(tx / 8, ty / 8, s + 160) - 0.5) * 0.5, sdb = (Math.hypot((tx - bay.x) / bay.a, (ty - bay.y) / bay.b) - bk) * bb; if (sdb > 3) continue;
          i = ty * GW + tx; var en = Math.max(-1000, Math.round(sdb * 90)); if (en < E[i]) E[i] = en;
        }
        seaDist();
      }
    }
    // straight south to the sea from every tile, read between the tiles: a sea cliff's top lies one face north of the waterline
    var DSo = null;
    if (sea) { DSo = new Float32Array(GW * GH); for (tx = tx0; tx <= tx1; tx++) { var run = 0; for (ty = ty1; ty >= ty0; ty--) { i = ty * GW + tx; if (E[i] <= 0) { run = 0; continue; } var eb = ty < ty1 ? E[i + GW] : -100; run = eb <= 0 ? E[i] / (E[i] - eb) : Math.min(40, run + 1); DSo[i] = run; } } }
    function capAt(ax, ay) { return high * northOf(ax, ay) * (atC ? 0.9 + 0.2 * fbm(ax / 30, ay / 30, s + 140) : 0.78 + 0.5 * fbm(ax / 30, ay / 30, s + 140)); }
    for (ty = ty0; ty <= ty1; ty++) for (tx = tx0; tx <= tx1; tx++) {
      var d0 = DS[ty * GW + tx]; if (d0 <= 0) continue;
      var north = northOf(tx, ty), inland = sstep(shore, shore + rise, d0), base = north * inland;   // how far north on the island's own land, and how far from the sea: the mountains leave a shore all round
      MT[ty * GW + tx] = high * base * (atC ? 0.9 + 0.2 * fbm(tx / 30, ty / 30, s + 140) : 0.78 + 0.5 * fbm(tx / 30, ty / 30, s + 140)) + (fbm(tx / 10, ty / 10, s + 150) - 0.5) * (atC ? 0.34 : 0.6) * Math.min(1, base * (atC ? 3 : 1));
    }
    for (pass = 0; pass < 2; pass++) {                       // smoothed twice, so no terrace is a speck
      var M2 = new Float32Array(MT.length);
      for (ty = ty0; ty <= ty1; ty++) for (tx = tx0; tx <= tx1; tx++) { var sm = 0, dy2, dx2; for (dy2 = -1; dy2 <= 1; dy2++) for (dx2 = -1; dx2 <= 1; dx2++) sm += MT[(ty + dy2) * GW + tx + dx2]; M2[ty * GW + tx] = sm / 9; }
      MT = M2;
    }
    // the sea cliffs (2026-10-12): on one side of the island, north of the bay's middle, the mountains keep no shore. The ground
    // rises a level for every 3.25 tiles of land straight south of it (a face is 3.5 tiles deep, so the wall's foot stands a
    // little way out in the water) and for every 0.8 tiles from any sea (a side wall's foot), as high as the mountain is there
    if (sea) for (ty = ty0; ty <= ty1; ty++) for (tx = tx0; tx <= tx1; tx++) {
      i = ty * GW + tx; var ds0 = DS[i]; if (ds0 <= 0) continue;
      var zone = sstep(0.1, 0.32, seaSide * (tx - mq.x) / mq.r) * (bay ? sstep(bay.y + 4, bay.y, ty) : 1); if (zone <= 0) continue;
      var seaT = Math.min(DSo[i] / 3.25, ds0 / 0.8, 2.55), ms = Math.min(capAt(tx, ty), Math.max(MT[i], seaT));
      if (ms > MT[i]) MT[i] += (ms - MT[i]) * zone;
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
    function dry(ci, cj) { return elevAt((cx0 + ci + 0.5) * MC, (cy0 + cj + 0.5) * MC) > 0.4; }
    for (j = 0; j < ch; j++) for (i = 0; i < cw; i++) CL[j * cw + i] = mLevel(mAt((cx0 + i + 0.5) * MC, (cy0 + j + 0.5) * MC));
    for (i = 0; i < cw; i++) {                               // the faces: down every column, the ground south of a higher edge
      var last = [-1e9, -1e9, -1e9, -1e9];
      for (j = 0; j < ch; j++) { var L = CL[j * cw + i] & 3; for (n = 1; n <= 3; n++) if (L >= n) last[n] = j; for (n = 3; n > L; n--) if ((j - last[n]) * MC <= HFW * (n - L)) { CL[j * cw + i] |= M_FACE | M_BLOCK; break; } }
    }
    var SC = SIDE / HFW, dirS, i0, mxs = Math.ceil(SC * ch) + 1;   // the side walls: the same sweep down columns that lean, east and west
    for (dirS = -1; dirS <= 1; dirS += 2) for (i0 = -mxs; i0 < cw + mxs; i0++) {
      var lastS = [-1e9, -1e9, -1e9, -1e9];
      for (j = 0; j < ch; j++) {
        var ii = i0 + dirS * Math.round(SC * j); if (ii < 0 || ii >= cw) continue;
        var qs = j * cw + ii, cs = CL[qs], Ls = cs & 3; for (n = 1; n <= 3; n++) if (Ls >= n) lastS[n] = j;
        if (cs & M_FACE) continue;
        for (n = 3; n > Ls; n--) if ((j - lastS[n]) * MC <= HFW * (n - Ls)) { CL[qs] |= M_SIDE | M_BLOCK; break; }
      }
    }
    var RIMS = [];
    for (j = 1; j < ch - 1; j++) for (i = 1; i < cw - 1; i++) {   // the rims: wherever the level changes next door; and the peaks
      var c0 = CL[j * cw + i], L0 = c0 & 3; if (L0 === 3) { CL[j * cw + i] |= M_BLOCK; continue; } if (c0 & (M_FACE | M_SIDE)) continue;
      var dif = false, di, dj; for (dj = -1; dj <= 1 && !dif; dj++) for (di = -1; di <= 1; di++) if ((CL[(j + dj) * cw + i + di] & 3) !== L0) { dif = true; break; }
      if (dif) RIMS.push(j * cw + i);
    }
    RIMS.forEach(function (q) { CL[q] |= M_RIM | M_BLOCK; });
    // the slopes: a straight stretch of south-facing edge, one level high, with level dry ground above it and below its foot
    var ramps = [], candAll = { 1: [], 2: [] };
    for (n = 1; n <= 2; n++) {
      var cands = candAll[n];
      for (j = 10; j < ch - FH - 10; j++) for (i = 8; i < cw - 8; i++) {
        if ((cv(i, j) & 3) !== n || (cv(i, j + 1) & 3) !== n - 1) continue;
        var ok = true, d2, k2;
        for (d2 = -4; ok && d2 <= 4; d2 += 2) {
          for (k2 = 1; ok && k2 <= 8; k2++) { var ca = cv(i + d2, j - k2); if ((ca & 3) !== n || (ca & (M_FACE | M_SIDE))) ok = false; }
          if (ok && (cv(i + d2, j + 3) & 3) !== n - 1) ok = false;
          for (k2 = 2; ok && k2 <= FH; k2 += 3) if ((cv(i + d2, j + k2) & 3) !== n - 1) ok = false;
          for (k2 = FH + 2; ok && k2 <= FH + 8; k2++) { var cb = cv(i + d2, j + k2); if ((cb & 3) !== n - 1 || (cb & (M_FACE | M_RIM | M_SIDE)) || !dry(i + d2, j + k2)) ok = false; }
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
      var i0r = Math.floor((Math.min(rm.x0, rm.x1) - rm.r) / MC - cx0), i1r = Math.ceil((Math.max(rm.x0, rm.x1) + rm.r) / MC - cx0), j0r = Math.floor((Math.min(rm.y0, rm.y1) - rm.r) / MC - cy0), j1r = Math.ceil((Math.max(rm.y0, rm.y1) + rm.r) / MC - cy0), a2, b2;
      for (b2 = j0r; b2 <= j1r; b2++) for (a2 = i0r; a2 <= i1r; a2++) { if (a2 < 0 || b2 < 0 || a2 >= cw || b2 >= ch) continue; if (rampD(rm, (cx0 + a2 + 0.5) * MC, (cy0 + b2 + 0.5) * MC)[0] < rm.r - 7) CL[b2 * cw + a2] = (CL[b2 * cw + a2] & 3) | M_RAMP; }
    }
    ramps.forEach(markRamp);
    /* Every sizeable piece of high ground gets a way up. A flood from the low ground over the walking cells; the largest piece
       of fell it did not reach is joined on, by a slope up a south face if one of the found places touches it, else by a gap
       in a rim or a side wall (a short slope across an edge that faces away or runs north to south); then the flood goes on. */
    var LANDC = new Uint8Array(cw * ch), reach = new Uint8Array(cw * ch), cm = new Int32Array(cw * ch), cid = 0, gave = {}, seeds = [], ix, tries;
    for (j = 0; j < ch; j++) for (i = 0; i < cw; i++) LANDC[j * cw + i] = elevAt((cx0 + i + 0.5) * MC, (cy0 + j + 0.5) * MC) > 0.05 ? 1 : 0;
    function flood(st) {
      while (st.length) { var q3 = st.pop(), qi = q3 % cw, qj = (q3 - qi) / cw, d4; for (d4 = 0; d4 < 4; d4++) { var a3 = qi + (d4 === 0 ? 1 : (d4 === 1 ? -1 : 0)), b3 = qj + (d4 === 2 ? 1 : (d4 === 3 ? -1 : 0)); if (a3 < 0 || b3 < 0 || a3 >= cw || b3 >= ch) continue; var i3 = b3 * cw + a3; if (reach[i3] || !LANDC[i3] || (CL[i3] & M_BLOCK)) continue; reach[i3] = 1; st.push(i3); } }
    }
    // the flood starts from the lowland itself: the largest piece of low ground. A hollow the fells close round (a tarn in its
    // bowl) is low ground too, but nobody has walked into it yet: it is joined on like any other piece (2026-10-12)
    (function lowland() {
      var lab = new Int32Array(cw * ch), qv = new Int32Array(cw * ch), nl2 = 0, bestN = 0, bestL = 0, h2, t2, a2;
      for (ix = 0; ix < cw * ch; ix++) {
        if (lab[ix] || !LANDC[ix] || (CL[ix] & (M_BLOCK | M_RAMP)) || (CL[ix] & 3) !== 0) continue;
        nl2++; h2 = 0; t2 = 0; qv[t2++] = ix; lab[ix] = nl2;
        while (h2 < t2) { var c8 = qv[h2++], x8 = c8 % cw; for (a2 = 0; a2 < 4; a2++) { var n8 = a2 === 0 ? (x8 < cw - 1 ? c8 + 1 : -1) : (a2 === 1 ? (x8 > 0 ? c8 - 1 : -1) : (a2 === 2 ? c8 + cw : c8 - cw)); if (n8 < 0 || n8 >= cw * ch || lab[n8] || !LANDC[n8] || (CL[n8] & (M_BLOCK | M_RAMP)) || (CL[n8] & 3) !== 0) continue; lab[n8] = nl2; qv[t2++] = n8; } }
        if (t2 > bestN) { bestN = t2; bestL = nl2; }
      }
      for (ix = 0; ix < cw * ch; ix++) if (lab[ix] === bestL && bestL) { reach[ix] = 1; seeds.push(ix); }
    })();
    flood(seeds);
    var MINC = mo.minReach || 1400, DIRS = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    for (tries = 0; tries < 16; tries++) {
      var bestComp = null, baseId = cid;
      for (ix = 0; ix < cw * ch; ix++) {
        if (reach[ix] || !LANDC[ix] || (CL[ix] & M_BLOCK) || cm[ix] > baseId) continue;
        var comp = [ix], qn; cid++; cm[ix] = cid;
        for (qn = 0; qn < comp.length; qn++) { var c5 = comp[qn], ci5 = c5 % cw, cj5 = (c5 - ci5) / cw, d5; for (d5 = 0; d5 < 4; d5++) { var a5 = ci5 + (d5 === 0 ? 1 : (d5 === 1 ? -1 : 0)), b5 = cj5 + (d5 === 2 ? 1 : (d5 === 3 ? -1 : 0)); if (a5 < 0 || b5 < 0 || a5 >= cw || b5 >= ch) continue; var i5 = b5 * cw + a5; if (cm[i5] > baseId || reach[i5] || !LANDC[i5] || (CL[i5] & M_BLOCK)) continue; cm[i5] = cid; comp.push(i5); } }
        if (comp.length >= MINC && !gave[comp[0]] && (!bestComp || comp.length > bestComp.length)) { bestComp = comp; bestComp.id = cid; }
      }
      if (!bestComp) break;
      var made = null, nn2, kq;
      for (nn2 = 1; nn2 <= 2 && !made; nn2++) for (kq = 0; kq < candAll[nn2].length; kq++) {     // a slope up a face
        var cq = candAll[nn2][kq], topI = (cq[1] - 2) * cw + cq[0], footI = (cq[1] + FH + 4) * cw + cq[0];
        if (((cm[topI] === bestComp.id && reach[footI]) || (cm[footI] === bestComp.id && reach[topI])) && !ramps.some(function (g) { return Math.abs(g.ex - (cx0 + cq[0] + 0.5) * MC) < 200 && Math.abs(g.ey - (cy0 + cq[1] + 1) * MC) < 200; })) { made = faceRamp(nn2, cq); break; }
      }
      for (kq = 0; kq < bestComp.length && !made; kq += 3) {                                    // a gap in a rim or a side wall
        var c6 = bestComp[kq], ci6 = c6 % cw, cj6 = (c6 - ci6) / cw, dq, ds;
        for (dq = 0; dq < 8 && !made; dq++) for (ds = 2; ds <= 8; ds++) {
          var a6 = ci6 + DIRS[dq][0] * ds, b6 = cj6 + DIRS[dq][1] * ds; if (a6 < 0 || b6 < 0 || a6 >= cw || b6 >= ch) break;
          var t6 = b6 * cw + a6; if (!reach[t6]) { if (!(CL[t6] & (M_RIM | M_SIDE)) || (CL[t6] & M_FACE)) break; continue; }
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
    /* What stands in the mountains (2026-10-12, Robin: a waterfall from the plateau into a pool, a lookout on a high point,
       ledges with a tree on them): found from the cells once the ways up are known. */
    var falls = [], lookouts = [], ledges = [];
    function lipY(wx, ys, n2) { var yy; for (yy = ys; yy < ys + 90; yy += 0.5) if (mLevel(mAt(wx, yy)) < n2) return yy; return ys; }   // the edge itself under a point: where the ground drops below level n2, to the half unit
    function footOk(i2, j2, wantL, half, front) {            // the foot of a south face one level high: a straight wall over it, level open ground before it
      var c0f = cv(i2, j2), df, kf; if ((c0f & (M_BLOCK | M_RAMP)) || (c0f & 3) !== wantL || !(cv(i2, j2 - 1) & M_FACE)) return false;
      for (df = -half; df <= half; df += 3) {
        var ct = cv(i2 + df, j2 - FH - 3); if (!(cv(i2 + df, j2 - 1) & M_FACE) || !(cv(i2 + df, j2 - FH + 2) & M_FACE) || (ct & 3) !== wantL + 1 || (ct & (M_FACE | M_SIDE))) return false;
        for (kf = 0; kf <= front; kf += 2) { var cg = cv(i2 + df, j2 + kf); if ((cg & (M_BLOCK | M_RAMP)) || (cg & 3) !== wantL || !dry(i2 + df, j2 + kf)) return false; }
      }
      return true;
    }
    function footLoose(i2, j2, wantL, half, front) {       // the same asked less strictly: a wall over the foot that may curve, open level ground before its middle
      var c0f = cv(i2, j2), df, kf; if ((c0f & (M_BLOCK | M_RAMP)) || (c0f & 3) !== wantL || !(cv(i2, j2 - 1) & M_FACE) || !(cv(i2, j2 - 5) & M_FACE)) return false;
      for (df = -half; df <= half; df += half) { if (!(cv(i2 + df, j2 - 2) & M_FACE)) return false; for (kf = 1; kf <= front; kf += 2) { var cg = cv(i2 + (df > 0 ? 2 : (df < 0 ? -2 : 0)), j2 + kf); if ((cg & (M_BLOCK | M_RAMP)) || (cg & 3) !== wantL || !dry(i2, j2 + kf)) return false; } }
      return true;
    }
    function farFromRamps(x, y, d) { return !ramps.some(function (rm) { return Math.hypot(rm.ex - x, rm.ey - y) < d || Math.hypot(rm.x1 - x, rm.y1 - y) < d || Math.hypot(rm.x0 - x, rm.y0 - y) < d; }); }
    function markWater(pts, hw) {
      var a, b2, kk; for (kk = 0; kk < pts.length - 1; kk++) {
        var p = pts[kk], q = pts[kk + 1], ia = Math.floor((Math.min(p[0], q[0]) - hw) / MC - cx0), ib = Math.ceil((Math.max(p[0], q[0]) + hw) / MC - cx0), ja = Math.floor((Math.min(p[1], q[1]) - hw) / MC - cy0), jb = Math.ceil((Math.max(p[1], q[1]) + hw) / MC - cy0);
        for (b2 = ja; b2 <= jb; b2++) for (a = ia; a <= ib; a++) { if (a < 0 || b2 < 0 || a >= cw || b2 >= ch || (CL[b2 * cw + a] & M_BLOCK)) continue; var wx = (cx0 + a + 0.5) * MC, wy = (cy0 + b2 + 0.5) * MC, ax = q[0] - p[0], ay = q[1] - p[1], t = Math.max(0, Math.min(1, ((wx - p[0]) * ax + (wy - p[1]) * ay) / (ax * ax + ay * ay || 1))); if (Math.hypot(wx - p[0] - ax * t, wy - p[1] - ay * t) < hw) CL[b2 * cw + a] |= M_WATER; }
      }
    }
    if (mo.falls !== false) (function waterfall() {
      var wantL, bestF = null, up, jj;
      for (wantL = 1; wantL >= 0 && !bestF; wantL--) for (j = FH + 6; j < ch - 44; j += 2) for (i = 24; i < cw - 24; i += 2) {
        if (!reach[j * cw + i] || !footOk(i, j, wantL, 9, 34)) continue;
        var fx0 = (cx0 + i + 0.5) * MC, fy0 = (cy0 + j) * MC; if (!farFromRamps(fx0, fy0, 240)) continue;
        var snow = false; jj = j - FH - 2;                 // upstream: north from the lip over open ground, to the snow if it is near
        for (up = 0; up < 46; up++) { var cu = cv(i, jj - up); if ((cu & 3) === 3) { snow = true; break; } if ((cu & 3) !== wantL + 1 || (cu & M_RAMP) || ((cu & M_BLOCK) && up > 1)) break; }
        if (up < 12) continue;
        var scf = (snow ? 60 : 0) + Math.min(up, 30) - Math.abs(i - cw / 2) * 0.03 + hash(i, j, s + 170) * 6;
        if (!bestF || scf > bestF.sc) bestF = { i: i, j: j, want: wantL, up: up, snow: snow, sc: scf };
      }
      if (!bestF) return;
      var fx = (cx0 + bestF.i + 0.5) * MC, n2 = bestF.want + 1, ye = lipY(fx, (cy0 + bestF.j - FH - 4) * MC, n2), len = Math.min(bestF.up, 42) * MC, pts = [], kq2, np = Math.max(3, Math.round(len / 34));
      for (kq2 = 0; kq2 <= np; kq2++) {                    // the stream on the plateau, from the lip upstream; it wanders more the further from the edge
        var tq = kq2 / np, wob = ((vnoise(kq2 * 0.9, 3, s + 173) - 0.5) * 90 + Math.sin(tq * 5 + s) * 16) * Math.min(1, tq * 2.6), sx = fx + wob, sy = ye - 2 - tq * len, cst = cellAt2(sx, sy);
        if (kq2 > 0 && ((cst & 3) !== n2 || (cst & (M_RAMP | M_BLOCK)))) sx = fx;
        pts.push([sx, sy]);
      }
      var yf = ye + HFW, pool = { x: fx, y: yf + 36, rx: 76, ry: 46 }, out = [[fx + 6, pool.y + pool.ry - 8]], ox = out[0][0], oy = out[0][1], drift = (hash(bestF.i, bestF.j, s + 174) - 0.5) * 1.3;
      for (kq2 = 1; kq2 <= 7; kq2++) { ox += drift * 24 + (vnoise(kq2 * 0.8, 9, s + 175) - 0.5) * 44; oy += 30; var co = cellAt2(ox, oy); if ((co & (M_BLOCK | M_RAMP)) || (co & 3) !== bestF.want || elevAt(ox, oy) < 0.5) break; out.push([ox, oy]); }
      var endp = out[out.length - 1], fall = { x: fx, ye: ye, n: n2, lvl: bestF.want, foot: yf, w: 22, pool: pool, stream: pts, out: out, bog: { x: endp[0], y: endp[1] + 8, r: 30 }, snow: bestF.snow };
      markWater(pts, 9); markWater(out, 8);
      var pa, pb; for (pb = Math.floor((pool.y - pool.ry) / MC - cy0); pb <= Math.ceil((pool.y + pool.ry) / MC - cy0); pb++) for (pa = Math.floor((pool.x - pool.rx) / MC - cx0); pa <= Math.ceil((pool.x + pool.rx) / MC - cx0); pa++) { if (pa < 0 || pb < 0 || pa >= cw || pb >= ch || (CL[pb * cw + pa] & M_BLOCK)) continue; if (Math.hypot(((cx0 + pa + 0.5) * MC - pool.x) / pool.rx, ((cy0 + pb + 0.5) * MC - pool.y) / pool.ry) < 0.97) CL[pb * cw + pa] |= M_WATER; }
      fall.box = [Math.min.apply(null, pts.concat(out).map(function (p) { return p[0]; })) - 80, ye - len - 30, Math.max.apply(null, pts.concat(out).map(function (p) { return p[0]; })) + 80, endp[1] + 60];
      falls.push(fall);
    })();
    function cellAt2(wx, wy) { return cv(Math.floor(wx / MC) - cx0, Math.floor(wy / MC) - cy0); }
    (function lookout() {                                    // the lookout: the southernmost level stand on the highest ground you can walk to, a cliff under it
      var wantL, bestL = null, k2;
      for (wantL = 2; wantL >= 1 && !bestL; wantL--) for (j = 12; j < ch - FH - 4; j++) for (i = 12; i < cw - 12; i += 2) {
        var q0 = j * cw + i; if (!reach[q0] || (CL[q0] & (M_BLOCK | M_RAMP | M_WATER)) || (CL[q0] & 3) !== wantL) continue;
        var lip = 0; for (k2 = 4; k2 <= 9; k2++) if (cv(i, j + k2) & M_FACE) { lip = k2; break; } if (!lip) continue;
        var flat = true, a2; for (a2 = 0; a2 < 8 && flat; a2++) { var cc = cv(i + Math.round(Math.cos(a2 * 0.785) * 3.4), j + Math.round(Math.sin(a2 * 0.785) * 3)); if ((cc & (M_BLOCK | M_RAMP | M_WATER)) || (cc & 3) !== wantL) flat = false; }
        if (!flat) continue;
        var lx = (cx0 + i + 0.5) * MC, ly = (cy0 + j + 0.5) * MC; if (!farFromRamps(lx, ly, 150) || falls.some(function (f) { return Math.abs(f.x - lx) < 240 && Math.abs(f.ye - ly) < 300; })) continue;
        var scl = j + hash(i, j, s + 180) * 3; if (!bestL || scl > bestL.sc) bestL = { x: lx, y: ly, lvl: wantL, sc: scl };
      }
      if (bestL) lookouts.push(bestL);
    })();
    var caveAt = null;
    (function cavePlace() {                                  // the cave's mouth: the foot of a straight wall you can walk to (the foothills by choice), clear of the slopes and the waterfall; strict first, then less so, so every island has a place
      var wantL, tol, cands, x, y;
      for (tol = 0; tol < 5 && !caveAt; tol++) for (wantL = 1; wantL >= 0 && !caveAt; wantL--) { if (tol < 3 && wantL === 0 && tol !== 2) continue;   // (the foothills by choice through three tries, then the low ground, then anything)
        var halfC = [12, 9, 6, 5, 4][tol], rd = [300, 190, 120, 100, 80][tol]; cands = [];
        for (j = FH + 4; j < ch - 20; j += 2) for (i = 16; i < cw - 16; i += 2) {
          if (!reach[j * cw + i] || !(tol < 4 ? footOk(i, j, wantL, halfC, 16) : footLoose(i, j, wantL, 7, 10))) continue;
          x = (cx0 + i + 0.5) * MC; y = (cy0 + j) * MC; if (!farFromRamps(x, y, rd) || falls.some(function (f) { return Math.abs(f.x - x) < rd + 40 && Math.abs(f.foot - y) < 300; }) || lookouts.some(function (lo) { return Math.abs(lo.x - x) < rd && Math.abs(lo.y - y) < 320; })) continue;   // (and not under the lookout)
          cands.push([x, y]);
        }
        if (cands.length) { var cq2 = cands[Math.floor(hash(cands.length, wantL, s + 181) * cands.length) % cands.length]; caveAt = { x: cq2[0], y: cq2[1] }; }
      }
    })();
    /* More than the troll's cave (2026-10-12, Robin: there needs to be more to the mountains than troll caves; an old copper
       mine, a rock shelter, a sea cave; and the first copper as veins in the open cliffs). Each is a place at the foot of a
       wall, found like the cave's and kept apart from the others: THE MINE's adit (the low ground by choice: the troll's is up
       on the foothills), THE ROCK SHELTER (a heller: an overhang with a floor you can stand on, cut into the face as a pocket of
       walking cells; by choice near the foot of a way up, where a traveller would look for one), THE SEA CAVE (in a wall that
       stands in the sea and faces south, where the water at its foot can be waded) and THE VEINS (green streaks of copper in
       south faces whose foot you can walk to, spread along the mountain). */
    var mineAt = null, seaAt = null, shelters = [], veins = [];
    function awayFrom(x, y, d) { return !(caveAt && Math.hypot(caveAt.x - x, caveAt.y - y) < d) && !(mineAt && Math.hypot(mineAt.x - x, mineAt.y - y) < d) && !(seaAt && Math.hypot(seaAt.x - x, seaAt.y - y) < d) && !shelters.some(function (sh) { return Math.hypot(sh.x - x, sh.y - y) < d; }) && !falls.some(function (f) { return Math.abs(f.x - x) < d * 0.6 && Math.abs(f.foot - y) < d; }); }
    if (mo.mine !== false) (function minePlace() {
      var wantL, tol, cands, x, y;
      for (tol = 0; tol < 4 && !mineAt; tol++) for (wantL = 0; wantL <= 1 && !mineAt; wantL++) {
        var halfC = [12, 9, 6, 4][tol], rd = [300, 190, 120, 90][tol]; cands = [];
        for (j = FH + 4; j < ch - 20; j += 2) for (i = 16; i < cw - 16; i += 2) {
          if (!reach[j * cw + i] || !footOk(i, j, wantL, halfC, 16)) continue;
          x = (cx0 + i + 0.5) * MC; y = (cy0 + j) * MC; if (!farFromRamps(x, y, rd) || !awayFrom(x, y, [620, 460, 320, 230][tol]) || lookouts.some(function (lo) { return Math.abs(lo.x - x) < rd && Math.abs(lo.y - y) < 320; })) continue;
          cands.push([x, y]);
        }
        if (cands.length) { var mq2 = cands[Math.floor(hash(cands.length, wantL, s + 183) * cands.length) % cands.length]; mineAt = { x: mq2[0], y: mq2[1], lvl: wantL }; }
      }
    })();
    if (mo.shelter !== false) (function shelterPlace() {
      var wantL, tol, best = null, x, y, HWS = 78, DS2 = 62;
      for (tol = 0; tol < 6 && !best; tol++) for (wantL = 0; wantL <= 1 && !best; wantL++) for (j = FH + 4; j < ch - 20; j += 2) for (i = 20; i < cw - 20; i += 2) {
        if (!reach[j * cw + i] || !(tol < 5 ? footOk(i, j, wantL, [11, 10, 10, 9, 5][tol], [18, 12, 8, 8, 6][tol]) : footLoose(i, j, wantL, 7, 8))) continue;
        x = (cx0 + i + 0.5) * MC; y = (cy0 + j) * MC; if (!farFromRamps(x, y, [150, 120, 100, 90, 80, 80][tol]) || !awayFrom(x, y, [330, 250, 190, 150, 140, 140][tol])) continue;
        var dr = 1e9; ramps.forEach(function (rm) { var dd = Math.hypot(rm.x1 - x, rm.y1 - y); if (dd < dr) dr = dd; });
        var sc = dr + hash(i, j, s + 184) * 90; if (!best || sc < best.sc) best = { x: x, y: y, sc: sc, lvl: wantL };
      }
      if (!best) return;
      var sh = { x: best.x, y: best.y, hw: HWS, d: DS2, lvl: best.lvl }, a, b2; shelters.push(sh);
      for (b2 = Math.floor((sh.y - sh.d) / MC - cy0) - 1; b2 <= Math.floor(sh.y / MC - cy0); b2++) for (a = Math.floor((sh.x - sh.hw) / MC - cx0) - 1; a <= Math.ceil((sh.x + sh.hw) / MC - cx0); a++) {
        if (a < 0 || b2 < 0 || a >= cw || b2 >= ch) continue; var wx = (cx0 + a + 0.5) * MC, wy = (cy0 + b2 + 0.5) * MC, dy3 = sh.y - wy; if (dy3 < 0 || dy3 > sh.d) continue;
        if ((CL[b2 * cw + a] & M_FACE) && (CL[b2 * cw + a] & 3) === sh.lvl && Math.pow(Math.abs(wx - sh.x) / sh.hw, 2.6) + Math.pow(dy3 / sh.d, 2.6) < 1) CL[b2 * cw + a] &= 3;   // the pocket: the face's cells become ground you can stand on (their level is the low ground's already)
      }
    })();
    if (sea && mo.seaCave !== false) (function seaCavePlace() {
      var best = null, bs = 1e9, d, k2, x, y, tol;
      for (tol = 0; tol < 4 && !best; tol++) for (j = FH + 2; j < ch - 14; j++) for (i = 14; i < cw - 14; i++) {   // (the last try takes a wall that runs at a slant: one jamb of the mouth then stands out in the water)
        if ((cv(i, j) & M_BLOCK) || !(cv(i, j - 1) & M_FACE)) continue;
        x = (cx0 + i + 0.5) * MC; y = (cy0 + j) * MC; var e0 = elevAt(x, y + 6); if (e0 > [-0.06, 0.12, 0.25, 0.25][tol] || e0 < [-2.4, -3.2, -4, -4][tol]) continue;
        var ok = true, hw3 = [6, 6, 3, 0][tol], up = [FH - 3, 6, 4, 5][tol], fr = [6, 4, 4, 4][tol];
        for (d = -hw3; ok && d <= hw3; d += 3) { if (!(cv(i + d, j - 1) & M_FACE) || !(cv(i + d, j - up) & M_FACE)) ok = false; for (k2 = 0; ok && k2 <= fr; k2 += 2) if ((cv(i + d, j + k2) & M_BLOCK) || elevAt((cx0 + i + d + 0.5) * MC, (cy0 + j + k2 + 0.5) * MC) > [0.1, 0.3, 0.45, 0.45][tol]) ok = false; }
        if (!ok) continue;
        var sc = (bay ? Math.hypot(x - (bay.x + 0.5) * T, (y - (bay.y + 0.5) * T) * 2) : 0) + hash(i, j, s + 185) * 60 + (e0 < -0.9 ? 500 : 0);   // by choice where its foot can be waded; else it is reached by boat alone
        if (sc < bs) { bs = sc; best = [x, y, e0]; }
      }
      if (best) seaAt = { x: best[0], y: best[1], wade: best[2] > -0.9 };
    })();
    if (mo.veins !== 0) (function cliffVeins() {
      var want = mo.veins != null ? mo.veins : Math.max(3, Math.min(9, Math.round(cw * MC / 800))), cands = [], x, y, k;
      for (j = FH + 2; j < ch - 6; j++) for (i = 8; i < cw - 8; i += 2) {
        var q = j * cw + i; if (!reach[q] || (CL[q] & (M_BLOCK | M_RAMP | M_WATER)) || !(cv(i, j - 1) & M_FACE) || !(cv(i - 3, j - 1) & M_FACE) || !(cv(i + 3, j - 1) & M_FACE) || !(cv(i, j - 6) & M_FACE) || !dry(i, j) || !dry(i, j + 3)) continue;
        x = (cx0 + i + 0.5) * MC; y = (cy0 + j) * MC; if (!farFromRamps(x, y, 80) || !awayFrom(x, y, 230)) continue;
        cands.push([x, y, hash(i, j, s + 186)]);
      }
      cands.sort(function (p, q2) { return p[2] - q2[2]; });
      for (k = 0; k < cands.length && veins.length < want; k++) { var cq = cands[k]; if (veins.some(function (v) { return Math.hypot(v.x - cq[0], v.y - cq[1]) < 240; })) continue;
        var hv = hash(Math.round(cq[0]), Math.round(cq[1]), s + 187), hp = HP.rock * 0.8; veins.push({ name: 'vein', kind: 'stone', vein: true, cliff: true, x: cq[0], y: cq[1], h: 40 + hv * 30, s: Math.floor(hv * 97), r: 0, left: 2 + (hv > 0.5 ? 1 : 0), hp: hp, max: hp }); }
    })();
    (function shelves() {                                    // ledges in the faces: a grassy shelf part-way down a one-level south wall, a small tree or a bush on it
      var k, n2, d3, k3;
      for (k = Math.floor(tx0 * T / 110); k * 110 < (tx1 + 1) * T; k++) for (n2 = 1; n2 <= 2; n2++) {
        var lx = (k + 0.2 + 0.6 * hash(k, n2, s + 176)) * 110, ci = Math.floor(lx / MC) - cx0; if (ci < 6 || ci >= cw - 6) continue;
        for (j = 4; j < ch - FH - 4; j++) {
          if ((cv(ci, j) & 3) < n2 || (cv(ci, j + 1) & 3) >= n2 || !(cv(ci, j + 1) & M_FACE)) continue;
          if (hash(k, n2 * 31 + j, s + 177) > 0.36) continue;
          var okL = !(cv(ci, j + FH + 2) & M_BLOCK) && dry(ci, j + FH + 2); for (d3 = -4; okL && d3 <= 4; d3 += 2) for (k3 = 1; okL && k3 <= FH - 1; k3 += 2) { var cl = cv(ci + d3, j + k3); if (!(cl & M_FACE) || (cl & 3) !== n2 - 1) okL = false; }
          if (!okL) continue;
          var ly = lipY(lx, (cy0 + j - 1) * MC, n2); if (!farFromRamps(lx, ly + 50, 100) || falls.some(function (f) { return Math.abs(f.x - lx) < 70 && Math.abs(f.ye - ly) < 60; }) || (caveAt && Math.abs(caveAt.x - lx) < 150 && Math.abs(caveAt.y - ly - HFW) < 70) || [mineAt, seaAt].concat(shelters).some(function (pl) { return pl && Math.abs(pl.x - lx) < 170 && Math.abs(pl.y - ly - HFW) < 70; }) || veins.some(function (v) { return Math.abs(v.x - lx) < 40 && Math.abs(v.y - ly - HFW) < 70; })) continue;
          var hl = hash(k, j, s + 178);
          ledges.push({ x: lx, ye: ly, n: n2, f: 30 + Math.floor(hl * 22), hw: 15 + hash(k, j, s + 179) * 11, kind: hl < 0.42 ? 'dwarfBirch' : (hl < 0.72 ? 'juniper' : 'heather') });
        }
      }
    })();
    mtn = { MC: MC, x0: cx0, y0: cy0, w: cw, h: ch, CL: CL, HF: HF, HFW: HFW, SIDE: SIDE, ramps: ramps, falls: falls, lookouts: lookouts, ledges: ledges, cave: caveAt, mine: mineAt, seaCave: seaAt, shelters: shelters, veins: veins, inlays: shelters.map(function (sh) { return { name: 'shelter_in', x: sh.x, y: sh.y, s: 1 }; }), peaks: [], bay: bay ? { x: (bay.x + 0.5) * T, y: (bay.y + 0.5) * T, a: bay.a * T, b: bay.b * T } : null, seaSide: sea ? seaSide : 0, isle: isles.indexOf(mq), rampD: rampD, bx0: tx0 * T, by0: ty0 * T, bx1: (tx1 + 1) * T, by1: (ty1 + 1) * T };
  })();
  w.mt = mtn; w.MT = MT; w.mAt = MT ? mAt : function () { return 0; };
  function cellAt(wx, wy) { if (!mtn) return 0; var ci = Math.floor(wx / MC) - mtn.x0, cj = Math.floor(wy / MC) - mtn.y0; return (ci < 0 || cj < 0 || ci >= mtn.w || cj >= mtn.h) ? 0 : mtn.CL[cj * mtn.w + ci]; }
  w.cellAt = cellAt; w.M_FACE = M_FACE; w.M_RIM = M_RIM; w.M_RAMP = M_RAMP; w.M_BLOCK = M_BLOCK; w.M_SIDE = M_SIDE; w.M_WATER = M_WATER;
  w.levelAt = function (wx, wy) { return cellAt(wx, wy) & 3; };          // 0 low ground, 1 the foothills, 2 the high plateau, 3 the peaks
  w.cliffAt = function (wx, wy) { return (cellAt(wx, wy) & M_BLOCK) !== 0; };   // a face, a side wall, a rim or a peak: nothing walks, stands or grows here
  w.rampAt = function (wx, wy) { return (cellAt(wx, wy) & M_RAMP) !== 0; };
  w.waterAt = function (wx, wy) { return (cellAt(wx, wy) & M_WATER) !== 0; };
  /* THE APPROACH (2026-10-12, Robin: the mountains must go seamlessly with the other biomes). The field is smooth, so on the low
     ground it already says how near the first rise is: w.fellNear is 0 out in the lowland and 1 at the foot of the first wall.
     Over that stretch the ground dries toward the foothills' turf, stones and sedge come up through it, the trees thin and
     turn to pine, birch and mountain birch, juniper and heather appear, and boulders lie about: whatever biome lies below. */
  w.siteCode = function (tx, ty) { var c5 = code(tx, ty); return c5 === 5 || (MT && mTile(tx, ty) > 0.06) ? 255 : c5; };   // the tile's code for whoever looks for a place to build a village: the mountains and the ground before them are no place for one
  w.fellNear = function (wx, wy) { if (!MT) return 0; var m0 = mAt(wx, wy); return m0 >= 1 ? 1 : sstep(0.03, 0.6, m0); };   // (the field is already down to a half at a wall's foot: its face covers the ground where it runs from 1 to there)
  w.shelterAt = function (wx, wy, pad) {                                   // under the rock shelter's overhang? (a roof over your head: the page counts it as one)
    if (!mtn) return null; var k8; pad = pad || 0;
    for (k8 = 0; k8 < mtn.shelters.length; k8++) { var sh = mtn.shelters[k8], dy8 = sh.y - wy; if (dy8 >= -pad && dy8 <= sh.d + 4 && Math.abs(wx - sh.x) <= sh.hw + pad) return sh; }
    return null;
  };
  function bySet(wx, wy) {                                                 // the ground kept open before the mine, the shelter and the veins
    if (!mtn) return false;
    if (mtn.mine && Math.abs(wx - mtn.mine.x) < 120 && wy > mtn.mine.y - 40 && wy < mtn.mine.y + 150) return true;
    if (mtn.shelters.some(function (sh) { return Math.abs(wx - sh.x) < sh.hw + 40 && wy > sh.y - sh.d - 10 && wy < sh.y + 120; })) return true;
    return mtn.veins.some(function (v) { return Math.abs(wx - v.x) < 34 && wy > v.y - 10 && wy < v.y + 46; });
  }
  function byFalls(wx, wy) {                                               // the ground kept open round the waterfall: before the pool, along the stream and the brook
    if (!mtn) return false; var k9, f, q9;
    for (k9 = 0; k9 < mtn.falls.length; k9++) { f = mtn.falls[k9]; if (wx < f.box[0] || wx > f.box[2] || wy < f.box[1] || wy > f.box[3]) continue;
      if (Math.hypot((wx - f.pool.x) / (f.pool.rx + 70), (wy - f.pool.y - 30) / (f.pool.ry + 80)) < 1) return true;
      for (q9 = 0; q9 < 2; q9++) { var pts = q9 ? f.out : f.stream, i9; for (i9 = 0; i9 < pts.length - 1; i9++) { var p = pts[i9], q = pts[i9 + 1], ax = q[0] - p[0], ay = q[1] - p[1], t = Math.max(0, Math.min(1, ((wx - p[0]) * ax + (wy - p[1]) * ay) / (ax * ax + ay * ay || 1))); if (Math.hypot(wx - p[0] - ax * t, wy - p[1] - ay * t) < 26) return true; } } }
    return false;
  }   // the waterfall's stream, its pool and the brook out of it: waded, never built on
  w.flatAt = function (wx, wy, r) {                                        // level ground with room round it: no cliff, no slope, no water within r, one level
    var c0 = cellAt(wx, wy), a; if (c0 & (M_BLOCK | M_RAMP | M_WATER)) return false; r = r || 0; if (!mtn || !r) return true;
    for (a = 0; a < 8; a++) { var c1 = cellAt(wx + Math.cos(a * 0.785) * r, wy + Math.sin(a * 0.785) * r); if ((c1 & (M_BLOCK | M_RAMP | M_WATER)) || (c1 & 3) !== (c0 & 3)) return false; }
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
    if (grid[y * GW + x] === 1 && (cellAt((x + 0.5) * T, (y + 0.5) * T) & 3)) grid[y * GW + x] = 2;   // the top of a sea cliff is turf, not sand
    if (grid[y * GW + x] < 2) continue; var anyc = false, c4x, c4y;
    for (c4y = 0; c4y < 4 && !anyc; c4y++) for (c4x = 0; c4x < 4; c4x++) if (cellAt(x * T + c4x * MC + 4, y * T + c4y * MC + 4) & (M_BLOCK | M_RAMP | M_WATER)) { anyc = true; break; }
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
  w.isWater = function (wx, wy) { return !onPlank(wx, wy) && elevAt(wx, wy) < -0.18 && wx > 40 && wy > 40 && wx < WX - 40 && wy < WY - 40 && !(mtn && (cellAt(wx, wy) & M_BLOCK)); };   // not where a sea cliff's foot stands in it

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
    var n1 = CT + 2, EE = new Float32Array(n1 * n1), BW = new Float32Array(n1 * n1), DK = new Float32Array(n1 * n1), BMv = new Float32Array(n1 * n1), SFt = mtn ? new Float32Array(n1 * n1) : null, HTt = mtn ? new Float32Array(n1 * n1) : null, SNt = mtn ? new Float32Array(n1 * n1) : null, sfv = 0, htv = 0, snv = 0;
    for (jj = 0; jj < n1; jj++) for (ii = 0; ii < n1; ii++) { var gx = cx * CT + ii - 1, gy = cy * CT + jj - 1; EE[jj * n1 + ii] = eTile(gx, gy); BW[jj * n1 + ii] = beachAt(gx, gy); DK[jj * n1 + ii] = fbm(gx / 9, gy / 9, s + 70); BMv[jj * n1 + ii] = w.biomeAt(gx, gy);
      if (mtn) { SFt[jj * n1 + ii] = fbm(gx / 3.1, gy / 3.1, s + 141); HTt[jj * n1 + ii] = fbm(gx / 3.7, gy / 2.7, s + 142); SNt[jj * n1 + ii] = fbm(gx / 3.3, gy / 1.5, s + 143); } }   // the fells' soft patches, the heather's drifts, the snow's fields: a value a tile, read between the tiles
    var ov = kit.mk(W2, H2), oc = ov.getContext('2d'), img = oc.createImageData(W2, H2), d = img.data, P = PAL, pp = 0, tP = pnow();
    /* The mountains in this piece. Everything is worked out on a sheet wider and taller than the piece (MG to each side, PADR
       above: three faces, PADB below), so what an edge outside the piece casts into it is found, and what is drawn across a
       piece's border is drawn the same from both sides. lev is the level of every pixel and mfr the field itself; then four
       sweeps down columns say what stands over a pixel: FN/FD the edge whose south face covers it and how far below that edge
       it is, EN/ED and WN/WD the same down columns that lean (a wall that faces east, one that faces west: a battered foot,
       SIDE pixels out a level), HN/HD along the sun's way (the shadow a cliff throws east); BD/BO how far the nearest change
       of level is and what lies across it (the crest of an edge, the dark under one that faces away). */
    var lev = null, mfr = null, mff = null, PKM = null, maxLAll = 0, MG = 96, PADR = HF * 3 + 20, PADB = 60, LW = W2 + MG * 2, HR = H2 + PADR + PADB, GX0 = cx * W2 - MG, GY0 = cy * H2 - PADR;
    var FN = null, FD = null, EN = null, ED = null, WN = null, WD = null, HN = null, HD = null, BD = null, BO = null, d2 = null, img2 = null, ov2 = null, rampsHere = null, fallsHere = null, ledgesHere = null, RK = null, OVS = null, OVY = null, WET = null, PAN = {};
    if (mtn && cx * W2 < mtn.bx1 + MG && (cx + 1) * W2 > mtn.bx0 - MG && cy * H2 / K < mtn.by1 + 60 && (cy + 1) * H2 / K > mtn.by0 - 8) {
      var NP = LW * HR, r0, px0, qq, minL = 9, maxL = 0, ixa = Math.floor(GX0 / T - 0.5);
      if (!MB) { MB = { lev: new Uint8Array(NP), mfr: new Uint8Array(NP), mff: new Float32Array(NP), FN: new Uint8Array(NP), FD: new Uint16Array(NP), EN: new Uint8Array(NP), ED: new Uint16Array(NP), WN: new Uint8Array(NP), WD: new Uint16Array(NP), HN: new Uint8Array(NP), HD: new Uint16Array(NP), BD: new Uint8Array(NP), BO: new Uint8Array(NP), colv: new Float32Array(Math.ceil(LW / T) + 4), IX: new Int32Array(LW), UU: new Float32Array(LW) }; }   // the sheets are kept between bakes
      lev = MB.lev; mfr = MB.mfr; mff = MB.mff; lev.fill(0); mfr.fill(0); mff.fill(0); var colv = MB.colv, IX = MB.IX, UU = MB.UU;
      for (px0 = 0; px0 < LW; px0++) { var fx0 = (GX0 + px0) / T - 0.5, ix0 = Math.floor(fx0); IX[px0] = ix0 - ixa; UU[px0] = fx0 - ix0; }
      for (r0 = 0; r0 < HR; r0++) {
        var sy0 = GY0 + r0, fy0 = sy0 / K / T - 0.5, iy0 = Math.floor(fy0), vv = fy0 - iy0, rowAny = false, nrow = (sy0 & 127) << 7, rb = r0 * LW;
        for (qq = 0; qq < colv.length; qq++) { colv[qq] = mTile(ixa + qq, iy0) * (1 - vv) + mTile(ixa + qq, iy0 + 1) * vv; if (colv[qq] > 0.004) rowAny = true; }
        if (!rowAny) { minL = 0; continue; }
        for (px0 = 0; px0 < LW; px0++) {
          var ci0 = IX[px0], uu = UU[px0], ca0 = colv[ci0], cb0 = colv[ci0 + 1], mm = ca0 * (1 - uu) + cb0 * uu;
          if (mm <= 0.004) { minL = 0; continue; }
          mff[rb + px0] = mm;
          var fl0 = mm | 0; if (mm - fl0 > 0.007 && mm - fl0 < 0.993) { if (fl0 > 3) fl0 = 3; lev[rb + px0] = fl0; if (fl0 > maxL) maxL = fl0; if (fl0 < minL) minL = fl0; mfr[rb + px0] = mm >= 3.98 ? 255 : mm * 64; continue; }   // well inside a level: no need of the grain that roughens an edge
          var lv0 = mm >= 3 ? 3 : (mm >= 2 ? 2 : (mm >= 1 ? 1 : 0)); lev[rb + px0] = lv0; if (lv0 > maxL) maxL = lv0; if (lv0 < minL) minL = lv0; mfr[rb + px0] = mm >= 3.98 ? 255 : mm * 64;
        }
      }
      maxLAll = maxL;
      if (!maxL) lev = null;
      else {
        FN = MB.FN; FD = MB.FD; EN = MB.EN; ED = MB.ED; WN = MB.WN; WD = MB.WD; HN = MB.HN; HD = MB.HD; BD = MB.BD; BO = MB.BO; FN.fill(0); EN.fill(0); WN.fill(0); HN.fill(0); BO.fill(0); BD.fill(250);
        w.prof.lev += pnow() - tP; tP = pnow();
        if (minL !== maxL) {                                 // (a piece and all round it on one level has no wall, no shadow, no edge)
          var rs = Math.max(0, PADR - Math.ceil(HF * 8 / 7 * (maxL - minL)) - 14);   // no wall here is taller than the levels there are
          sweepM(0, HF, FN, FD, rs, 1); sweepM(SIDE / HF, HF, EN, ED, rs, 0); sweepM(-SIDE / HF, HF, WN, WD, rs, 0); sweepM(0.4375, HF * 8 / 7, HN, HD, rs, 0);
          edgeDist();
        }
        w.prof.sweep += pnow() - tP; tP = pnow();
        img2 = oc.createImageData(W2, H2); d2 = img2.data; RK = rockPal();
        rampsHere = mtn.ramps.filter(function (rm) { return Math.max(rm.x0, rm.x1) + rm.r * 1.6 > cx * W2 && Math.min(rm.x0, rm.x1) - rm.r * 1.6 < (cx + 1) * W2 && (Math.max(rm.y0, rm.y1) + rm.r * 1.6) * K > cy * H2 && (Math.min(rm.y0, rm.y1) - rm.r * 1.6) * K < (cy + 1) * H2; });
        fallsHere = mtn.falls.filter(function (f) { return f.box[2] > cx * W2 - 20 && f.box[0] < (cx + 1) * W2 + 20 && f.box[3] * K > cy * H2 - 20 && f.box[1] * K < (cy + 1) * H2 + 20; });
        ledgesHere = mtn.ledges.filter(function (lg) { return lg.x + 40 > cx * W2 && lg.x - 40 < (cx + 1) * W2 && lg.ye * K + HF + 10 > cy * H2 && lg.ye * K - 20 < (cy + 1) * H2; });
        // what runs along a wall and depends only on where along it you are: an overhang, water running down it
        OVS = new Float32Array(W2 * 4); OVY = new Float32Array(W2 * 4); WET = new Float32Array(W2 * 4);
        for (qq = 1; qq <= 3; qq++) for (px0 = 0; px0 < W2; px0++) { var wxc = cx * W2 + px0; OVS[qq * W2 + px0] = sstep(0.66, 0.74, vnoise(wxc / 150, qq * 3.1, s + 48)); OVY[qq * W2 + px0] = (0.26 + 0.26 * vnoise(wxc / 330, qq * 1.7, s + 49)) * HF; WET[qq * W2 + px0] = sstep(0.6, 0.7, vnoise(wxc / 130, qq * 2.2, s + 51)) * sstep(0.5, 0.7, vnoise(wxc / 7, qq * 9.3, s + 50)); }
      }
    }
    function sweepM(sh, per, N, D, rs, ext) {                    // down every column (leaning sh pixels a row): the last row at or above each level, so what covers a pixel; only the columns that cross the piece, from the first row that can matter
      var shift = new Int32Array(HR), r, idl, mn = 1e9, mx = -1e9, px, nn, la, per2 = per * 2, per3 = per * 3;
      for (r = rs; r < HR; r++) { shift[r] = Math.round(sh * (GY0 + r)); if (r >= PADR - 12) { if (shift[r] < mn) mn = shift[r]; if (shift[r] > mx) mx = shift[r]; } }
      for (idl = MG - 12 - mx; idl < MG + W2 + 12 - mn; idl++) {
        var l1 = -1e9, l2 = -1e9, l3 = -1e9;
        for (r = rs; r < HR; r++) {
          px = idl + shift[r]; if (px < 0 || px >= LW) continue;
          var q = r * LW + px, Lq = lev[q];
          if (Lq === 0) { if (r - l1 > per3 + ext) continue; }
          else { l1 = r; if (Lq === 1) { if (r - l2 > per2 + ext) continue; } else { l2 = r; if (Lq === 3) { l3 = r; continue; } if (r - l3 > per + ext) continue; } }
          for (nn = 3; nn > Lq; nn--) { la = nn === 3 ? l3 : (nn === 2 ? l2 : l1); if (r - la <= per * (nn - Lq) + ext) { N[q] = nn; D[q] = r - la; break; } }
        }
      }
    }
    function edgeDist() {                                    // half pixels to the nearest change of level (chamfer 2, 3); BO: the level on its far side, and the near side's
      var r, px, q, v, nv, ra = PADR - 62, xa = MG - 62, xb = MG + W2 + 62;   // only the piece and 60 pixels round it: nothing further is asked for
      for (r = ra; r < HR - 1; r++) for (px = xa; px < xb; px++) { q = r * LW + px; var Lc = lev[q], o1 = lev[q - 1], o2e = lev[q + 1], o3 = lev[q - LW], o4 = lev[q + LW], ot = o1 !== Lc ? o1 : (o2e !== Lc ? o2e : (o3 !== Lc ? o3 : (o4 !== Lc ? o4 : 255))); if (ot !== 255) { BD[q] = 1; BO[q] = ot | (Lc << 2); } }
      for (r = ra; r < HR; r++) for (px = xa; px < xb; px++) { q = r * LW + px; v = BD[q]; if (v <= 2) continue; nv = BD[q - 1] + 2; if (nv < v) { v = nv; BO[q] = BO[q - 1]; } nv = BD[q - LW] + 2; if (nv < v) { v = nv; BO[q] = BO[q - LW]; } nv = BD[q - LW - 1] + 3; if (nv < v) { v = nv; BO[q] = BO[q - LW - 1]; } nv = BD[q - LW + 1] + 3; if (nv < v) { v = nv; BO[q] = BO[q - LW + 1]; } BD[q] = v; }
      for (r = HR - 2; r >= ra; r--) for (px = xb - 1; px >= xa; px--) { q = r * LW + px; v = BD[q]; if (v <= 2) continue; nv = BD[q + 1] + 2; if (nv < v) { v = nv; BO[q] = BO[q + 1]; } nv = BD[q + LW] + 2; if (nv < v) { v = nv; BO[q] = BO[q + LW]; } nv = BD[q + LW + 1] + 3; if (nv < v) { v = nv; BO[q] = BO[q + LW + 1]; } nv = BD[q + LW - 1] + 3; if (nv < v) { v = nv; BO[q] = BO[q + LW - 1]; } BD[q] = v; }
    }
    function nsm(x, y, sc) {                                 // the noise sheet read smoothly at a coarser scale (sc pixels to one of its own): soft shapes with no steps
      var fx = x / sc, fy = y / sc, xi = Math.floor(fx), yi = Math.floor(fy), u = fx - xi, v = fy - yi, a = noise[((yi & 127) << 7) | (xi & 127)], b = noise[((yi & 127) << 7) | ((xi + 1) & 127)], c2 = noise[(((yi + 1) & 127) << 7) | (xi & 127)], d3 = noise[(((yi + 1) & 127) << 7) | ((xi + 1) & 127)];
      return a + (b - a) * u + (c2 - a) * v + (a - b - c2 + d3) * u * v;
    }
    function panel(pk, fn) {                                 // a wall is split by fissures into panels of uneven width, each with its own kind of rock
      var key = pk * 4 + fn, p = PAN[key]; if (p) return p;
      var zn = vnoise(pk / 3.1, fn * 5.3, s + 44);
      return (PAN[key] = { b: (pk + 0.15 + 0.7 * hash(pk, fn, s + 41)) * 46, hp: hash(pk, fn + 9, s + 43), style: zn < 0.4 ? 0 : (zn < 0.68 ? 1 : 2), l0: (0.16 + (hash(pk, 0, s + 47) - 0.5) * 0.18) * HF, l1: (0.45 + (hash(pk, 1, s + 47) - 0.5) * 0.18) * HF, l2: (0.74 + (hash(pk, 2, s + 47) - 0.5) * 0.18) * HF });
    }
    /* Rock, as one smooth thing (2026-10-12, Robin: the wall texture did not look smooth and natural, it looked pasted on). The
       faces used to be beds of blocks, strata and joints, every one a hard step of tone on a sheet a pixel a unit, which the
       screen shows three times as large: masonry, in stairs. Now a face is light on a surface: buttresses that run down it and
       lean a little, smaller ribs on them, a few broken ledges, each lit from the upper left and turning into its own shade
       by soft steps, and a crack here and there where a gully runs. Nothing in it is a pixel wide. u runs along the wall, v
       down it. Returns what to add to the tone. */
    function rockTone(u, v, sd) {                            // (the noise sheet's own shapes are 16 to 32 of its pixels across: read at 2.2 they are buttresses, at 0.8 ribs)
      var wob = (nsm(u * 0.6 + sd * 13, v * 0.5 + 40, 4) - 0.5) * 30, x0 = u + wob + sd * 71, y0 = v * 0.3 + sd * 37;
      var a0 = nsm(x0, y0, 2.2), a1 = nsm(x0 + 3, y0, 2.2), a2 = nsm(x0, y0 + 1.2, 2.2);
      var c0 = nsm(u + 300 + sd * 11, v * 0.36 + 90, 0.8), c1 = nsm(u + 302.5 + sd * 11, v * 0.36 + 90, 0.8);
      var l0 = nsm(u * 0.3 + 500 + sd * 5, v + sd * 19, 0.5), l1 = nsm(u * 0.3 + 500 + sd * 5, v + 2.5 + sd * 19, 0.5);
      var sh = (a1 - a0) * 19 + (c1 - c0) * 3.4 + (l1 - l0) * 1.5 + (a2 - a0) * 8;
      var lit = sstep(0.14, 0.26, sh), dark = sstep(0.1, 0.22, -sh), deep = sstep(0.46, 0.6, -sh), hi = sstep(0.56, 0.7, sh);
      var t = 0.03 + 0.15 * lit + 0.09 * hi - 0.14 * dark - 0.13 * deep + (a0 - 0.5) * 0.22 + (nsm(u + 900, v + sd * 3, 5) - 0.5) * 0.1 + (nsm(u * 1.0 + sd * 3, v * 0.06, 0.4) - 0.5) * 0.07;
      var ck = Math.abs(nsm(x0 + 800, v * 0.15 + sd * 5, 1.6) - 0.5), pres = sstep(0.42, 0.52, nsm(u + 77, v * 0.5 + sd * 9, 3));
      return t - 0.34 * (1 - sstep(0.005, 0.019, ck)) * pres;
    }
    /* The peaks (2026-10-12, Robin: the rocky tops did not look smooth and natural, they looked pasted on. They were pictures
       from Blender, fifty to two hundred cones each in its own heavy outline with boulders at its foot, stamped on the
       ground). Now the range is painted here, in the same hand as the cliffs and out of the same rock: a height for every
       point of the peaks' ground, and the picture of it as the camera sees it.
       A peak is a summit with five or six flat faces falling away from it (peakAt: one to a cell of the ground, placed from
       the world's seed); the height anywhere is the highest of the peaks that reach there, so they run into one another along
       valleys and stand as one massif; the ground they are measured on is bent a little, so no ridge is a ruled line. The
       picture: down every column of the piece, from the nearest ground to the farthest, a point h high is drawn h up the
       screen, and only what rises above everything nearer is seen. A face is one plane, so it takes one tone from where
       it faces (the sun is upper left: west faces lit, east faces in cool shade), snow above a line that wanders, an ink line
       where one mountain stands in front of what is behind it, a thinner one down every ridge. A peak is never higher than
       the peaks' ground runs on behind it (nothing walks behind a mountain), and sinks to nothing at the ground's edges. */
    var PGX = 126, PGY = 94, PEAKMAX = 232;
    function peakAt(i, j) {
      var key = i + ',' + j, pq = PKC[key]; if (pq !== undefined) return pq;
      var px = (i + 0.12 + 0.76 * hash(i, j, s + 302)) * PGX, py = (j + 0.12 + 0.76 * hash(i, j, s + 303)) * PGY, m0 = w.mAt(px, py / K), en = sstep(3.02, 3.26, m0); pq = null;
      if (en > 0.05 && hash(i, j, s + 301) < 0.92) {
        var room = 0, st; for (st = 8; st <= 400; st += 8) { if (w.mAt(px, (py - st) / K) < 3.0) break; room = st; }
        var big2 = hash(i, j, s + 304), H = Math.min((64 + 168 * big2 * big2) * (0.4 + 0.6 * en), room * 0.78 + 8, PEAKMAX - 6);
        if (H > 30) {
          var nf = 6 + (hash(i, j, s + 305) > 0.55 ? 1 : 0), a0 = hash(i, j, s + 306) * 6.283, F = [], k, R = 0, smin = 9;
          for (k = 0; k < nf; k++) {
            var an = a0 + (k + (hash(i * 7 + k, j, s + 307) - 0.5) * 0.44) * 6.283 / nf, ux = Math.cos(an), uy = Math.sin(an), sl = (1.2 + hash(i, j * 5 + k, s + 308) * 0.75) * (uy < -0.3 ? 1.25 : 1);   // (a face that looks away is steeper: it is not seen over the top)
            var nl = Math.sqrt(sl * sl + 1), lam = Math.max(0, (-0.62 * sl * ux - 0.18 * sl * uy + 0.76) / nl);                      // how squarely it faces the sun (upper left, high)
            F.push(sl * ux, sl * uy, lam); if (sl < smin) smin = sl;
          }
          for (k = 0; k < nf; k++) { var ka = k * 3, kb = ((k + 1) % nf) * 3, det = F[ka] * F[kb + 1] - F[ka + 1] * F[kb], vx = H * (F[kb + 1] - F[ka + 1]) / det, vy = H * (F[ka] - F[kb]) / det, vr = Math.sqrt(vx * vx + vy * vy); if (vr > R) R = vr; }   // how far its foot reaches: the corners where two faces meet the ground
          pq = { x: px, y: py, H: H, F: F, R: R + 26, inv: 1 / (smin * 0.72),   // (R: with room for the bending of the ground; inv: no point d from the summit is higher than H - d / inv)
            id: (i * 73856093 ^ j * 19349663) & 0xffff, snow: H > 84 ? H * (0.46 + 0.16 * hash(i, j, s + 310)) : 1e9 };
        }
      }
      return (PKC[key] = pq);
    }
    function paintPeaks() {
      var X0 = cx * W2, Y0 = cy * H2, NORTH = 304, SOUTH = PEAKMAX + 164, rows = NORTH + H2 + SOUTH, r0y = Y0 - NORTH, x, r, i, k, any = false;
      if (!PKS || PKS.mm.length < rows * W2) PKS = { mm: new Float32Array(rows * W2), dN: new Float32Array(rows), dS: new Float32Array(rows), id: new Int32Array(W2 * H2) };
      var MM = PKS.mm, dN = PKS.dN, dS = PKS.dS, IDB = PKS.id, ixa = Math.floor(X0 / T - 0.5), nC = Math.ceil(W2 / T) + 3, colv = new Float32Array(nC), uT = new Float32Array(W2), iT = new Int32Array(W2);
      for (x = 0; x < W2; x++) { var fxx = (X0 + x) / T - 0.5, ixx = Math.floor(fxx); iT[x] = ixx - ixa; uT[x] = fxx - ixx; }
      for (r = 0; r < rows; r++) {                           // the field down every column of the piece, from far north of it to as far south as a peak could reach up from
        var fy = (r0y + r) / K / T - 0.5, iy = Math.floor(fy), vv = fy - iy, q, rowAny = false, rb = r * W2;
        for (q = 0; q < nC; q++) { colv[q] = mTile(ixa + q, iy) * (1 - vv) + mTile(ixa + q, iy + 1) * vv; if (colv[q] >= 2.9) rowAny = true; }
        if (!rowAny) { MM.fill(0, rb, rb + W2); continue; }
        for (x = 0; x < W2; x++) { var mm = colv[iT[x]] * (1 - uT[x]) + colv[iT[x] + 1] * uT[x]; MM[rb + x] = mm; if (mm >= 3.02 && r >= NORTH && r < NORTH + H2 + PEAKMAX) any = true; }
      }
      if (!any) return;
      var pk = [], i0 = Math.floor((X0 - 300) / PGX), i1 = Math.floor((X0 + W2 + 300) / PGX), j0 = Math.floor((Y0 - 300) / PGY), j1 = Math.floor((Y0 + H2 + PEAKMAX + 300) / PGY), j;   // (every peak whose flanks could reach the piece's ground, or reach up into it from south of it)
      for (j = j0; j <= j1; j++) for (i = i0; i <= i1; i++) { var pp2 = peakAt(i, j); if (pp2) pk.push(pp2); }
      if (!pk.length) return;
      PKM = new Uint8Array(W2 * H2); IDB.fill(0);
      var R0 = RK.base, SNL = [240, 244, 251], SNS = [186, 200, 230], near = [], run, bestP, bestK, h, o;
      for (x = 0; x < W2; x++) {
        var wxx = X0 + x, topH = 0; near.length = 0; for (i = 0; i < pk.length; i++) if (Math.abs(pk[i].x - wxx) < pk[i].R) { near.push(pk[i]); if (pk[i].H > topH) topH = pk[i].H; }
        if (!near.length) continue;
        near.sort(function (p1, p2) { return p2.H - p1.H; });
        run = 500; for (r = 0; r < rows; r++) { if (MM[r * W2 + x] >= 3.0) run++; else run = 0; dN[r] = run; }
        run = 500; for (r = rows - 1; r >= 0; r--) { if (MM[r * W2 + x] >= 3.0) run++; else run = 0; dS[r] = run; }
        var horizon = 1e9, lastR = -1, lastMt = false;
        for (r = NORTH + H2 + PEAKMAX; r >= NORTH; r--) {    // from the nearest ground to the farthest
          var gy = r0y + r, mv = MM[r * W2 + x]; h = 0; bestP = null; bestK = 0;
          if (mv >= 3.0) {
            var wpx = wxx + (nsm(wxx, gy, 2.6) - 0.5) * 32 + (nsm(wxx + 57, gy + 91, 0.8) - 0.5) * 13, wpy = gy + (nsm(wxx + 311, gy + 173, 2.6) - 0.5) * 24 + (nsm(wxx + 7, gy + 401, 0.8) - 0.5) * 10;
            for (i = 0; i < near.length; i++) {
              var P = near[i]; if (P.H <= h) break;                                             // (the highest first: none of the rest can top this)
              var dx = wpx - P.x, dy = wpy - P.y, tq2 = (P.H - h) * P.inv; if (dx * dx + dy * dy >= tq2 * tq2) continue;
              var F = P.F, mx = -1e9, mk = 0; for (k = 0; k < F.length; k += 3) { var fv = dx * F[k] + dy * F[k + 1]; if (fv > mx) { mx = fv; mk = k; } }
              if (P.H - mx > h) { h = P.H - mx; bestP = P; bestK = mk; }
            }
            if (h > 0) { var cap = Math.min(dN[r] * 0.8, dS[r] * 1.5); if (h > cap) h = cap; h *= sstep(3.0, 3.14, mv); }
          }
          var ys = gy - h - Y0; if (ys >= horizon) continue;
          var yA = Math.ceil(ys), yB = horizon > H2 ? H2 : Math.ceil(horizon), mt = h > 0.8 && bestP !== null;
          if (lastMt && lastR - r > 2) { var yi = Math.ceil(horizon); if (yi >= 0 && yi < H2) { o = (yi * W2 + x) * 4; d2[o] = 38; d2[o + 1] = 30; d2[o + 2] = 30; d2[o + 3] = 255; IDB[yi * W2 + x] = -1; if (yi + 1 < H2 && IDB[(yi + 1) * W2 + x] > 0) { o += W2 * 4; d2[o] = d2[o] * 0.62 + 14; d2[o + 1] = d2[o + 1] * 0.62 + 11; d2[o + 2] = d2[o + 2] * 0.62 + 11; } } }   // a mountain standing in front of what is behind it: ink along its skyline
          if (mt && yA < yB && yB > 0 && yA < H2) {
            var lam = bestP.F[bestK + 2], rel = h / bestP.H, tn = (0.7 + 0.5 * lam) * (0.9 + 0.17 * rel) + rockTone(wxx + bestP.id, (bestP.H - h) * 1.25, 11 + (bestK / 3)) * 0.75;   // the same rock as the walls: its buttresses run down the face
            var rr = R0[0] * tn, gg = R0[1] * tn, bb = R0[2] * (tn + 0.03), cs = (1 - lam) * 0.24; rr += (74 - rr) * cs; gg += (86 - gg) * cs; bb += (118 - bb) * cs;   // the faces the sun does not reach turn cool
            if (h > bestP.snow - 24) { var sn = sstep(-2, 2, h - bestP.snow - (nsm(wxx, gy, 0.6) - 0.5) * 16 - (nsm(wxx + 90, gy + 40, 1.7) - 0.5) * 34 + (1 - lam) * 10); if (sn > 0) { var sk = sstep(0.1, 0.5, lam); rr += (SNS[0] + (SNL[0] - SNS[0]) * sk - rr) * sn; gg += (SNS[1] + (SNL[1] - SNS[1]) * sk - gg) * sn; bb += (SNS[2] + (SNL[2] - SNS[2]) * sk - bb) * sn; } }
            var aa = sstep(0.8, 3, h), idv = ((bestP.id * 8 + bestK / 3) & 0xfffff) + 1, y;
            for (y = yA < 0 ? 0 : yA; y < yB; y++) { o = (y * W2 + x) * 4; if (aa < 1) { d2[o] += (rr - d2[o]) * aa; d2[o + 1] += (gg - d2[o + 1]) * aa; d2[o + 2] += (bb - d2[o + 2]) * aa; } else { d2[o] = rr; d2[o + 1] = gg; d2[o + 2] = bb; } d2[o + 3] = 255; PKM[y * W2 + x] = 1; IDB[y * W2 + x] = idv; }
          }
          horizon = ys; lastR = r; lastMt = mt;
        }
      }
      for (r = 1; r < H2; r++) for (x = 1; x < W2; x++) {    // a thin line down every ridge and along every valley: where one face meets another
        var ia = IDB[r * W2 + x]; if (ia <= 0) continue; var ib = IDB[r * W2 + x - 1], ic2 = IDB[(r - 1) * W2 + x];
        if ((ib > 0 && ib !== ia) || (ic2 > 0 && ic2 !== ia)) { var kd = ((ib > 0 && ib !== ia && (ib >> 3) !== (ia >> 3)) || (ic2 > 0 && ic2 !== ia && (ic2 >> 3) !== (ia >> 3))) ? 0.6 : 0.74; o = (r * W2 + x) * 4; d2[o] *= kd; d2[o + 1] *= kd; d2[o + 2] *= kd; }
      }
    }
    function lineD(pts, wx, wy) {                            // how far a point is from a line of points
      var best = 1e9, kk; for (kk = 0; kk < pts.length - 1; kk++) { var p = pts[kk], q = pts[kk + 1], ax = q[0] - p[0], ay = q[1] - p[1], t = Math.max(0, Math.min(1, ((wx - p[0]) * ax + (wy - p[1]) * ay) / (ax * ax + ay * ay || 1))), dd = Math.hypot(wx - p[0] - ax * t, wy - p[1] - ay * t); if (dd < best) best = dd; }
      return best;
    }
    tP = pnow();
    for (var py = 0; py < H2; py++) {
      var v = py / TS + 0.5, j0 = Math.floor(v), tv = v - j0, wy = cy * H2 + py;
      for (var px = 0; px < W2; px++, pp += 4) {
        var u = px / T + 0.5, i0 = Math.floor(u), tu = u - i0, q = j0 * n1 + i0, wx = cx * W2 + px;
        var w00 = (1 - tu) * (1 - tv), w10 = tu * (1 - tv), w01 = (1 - tu) * tv, w11 = tu * tv;
        var n1v = noise[((wy & 127) << 7) | (wx & 127)], n2v = noise[(((wy * 2) & 127) << 7) | ((wx * 2) & 127)];
        var e = EE[q] * w00 + EE[q + 1] * w10 + EE[q + n1] * w01 + EE[q + n1 + 1] * w11 + (n1v - 0.5) * 0.5;
        var qe = lev ? (py + PADR) * LW + px + MG : 0, Lp = lev ? lev[qe] : 0;
        var r, g, b, a = 255;
        if (e < 0 && !Lp) {                                 // sea: pale over the sand at the edge, turquoise shallows, deep blue beyond
          var t = Math.min(1, -e / 3.4); t = t * t * (3 - 2 * t);
          r = P.sh[0] + (P.dp[0] - P.sh[0]) * t; g = P.sh[1] + (P.dp[1] - P.sh[1]) * t; b = P.sh[2] + (P.dp[2] - P.sh[2]) * t;
          var st = Math.max(0, 1 + e / 0.95) * 0.62;
          r += (P.wet[0] - r) * st; g += (P.wet[1] - g) * st; b += (P.wet[2] - b) * st;
          var tx2 = (n2v - 0.5) * 12; r += tx2; g += tx2; b += tx2;
          if (e > -0.14) { var fo = (1 + e / 0.14) * 0.85; r += (255 - r) * fo; g += (255 - g) * fo; b += (252 - b) * fo; }   // the white lip at the waterline
        } else {
          var bw = BW[q] * w00 + BW[q + 1] * w10 + BW[q + n1] * w01 + BW[q + n1 + 1] * w11, eg = e + (n2v - 0.5) * 0.7;
          if (eg < bw && !Lp) {                             // beach: wet and dark by the water, pale and dry higher up, soft dunes (never on the fells: a sea cliff's top is turf)
            var dry = Math.min(1, e / 0.75); dry = dry * dry * (3 - 2 * dry);
            var dune = (n1v - 0.5) * 22 + Math.sin((wx * 0.33 + wy * 0.95) * 0.2 + n1v * 6) * 5;
            r = P.wet[0] + (P.sand[0] - P.wet[0]) * dry + dune; g = P.wet[1] + (P.sand[1] - P.wet[1]) * dry + dune; b = P.wet[2] + (P.sand[2] - P.wet[2]) * dry + dune * 0.8;
            a = Math.min(1, (bw - eg) / 0.32) * 255;        // the grass comes in raggedly at the top of the beach
          } else {                                          // grass: darker by the beach and in soft patches, never in squares
            var dk = DK[q] * w00 + DK[q + 1] * w10 + DK[q + n1] * w01 + DK[q + n1 + 1] * w11, rim = Lp ? 0 : Math.max(0, 1 - (eg - bw) / 0.4);
            r = 22; g = 84; b = 40; a = Math.min(120, Math.max(0, (dk - 0.54) * 5) * 62 + rim * 70);
            var bmv = BMv[q] * w00 + BMv[q + 1] * w10 + BMv[q + n1] * w01 + BMv[q + n1 + 1] * w11; if (bmv > 0.05) { var bt = bmv * 95, at = a + bt; r = (r * a + 196 * bt) / at; g = (g * a + 176 * bt) / at; b = (b * a + 62 * bt) / at; a = Math.min(255, at); }   // the lowlands: a warmer, yellower green
          }
        }
        if (mfr && !Lp && a < 200) { var ma0 = mfr[(py + PADR) * LW + px + MG]; if (ma0 > 2) { var apk = (ma0 - 2) / 36; if (apk > 1) apk = 1; apk = apk * apk * (3 - 2 * apk); var sf0 = SFt[q] * w00 + SFt[q + 1] * w10 + SFt[q + n1] * w01 + SFt[q + n1 + 1] * w11, ta0 = (58 + sf0 * 70) * apk * (0.55 + n1v * 0.9), at0 = a + ta0; r = (r * a + 168 * ta0) / at0; g = (g * a + 164 * ta0) / at0; b = (b * a + 96 * ta0) / at0; a = Math.min(255, at0); } }   // the approach: the low ground dries toward the foothills' turf as it nears them
        if (lev && (Lp || FN[qe] || EN[qe] || WN[qe] || HN[qe] || BD[qe] < 110 || rampsHere.length || fallsHere.length)) { if (Lp) { sfv = SFt[q] * w00 + SFt[q + 1] * w10 + SFt[q + n1] * w01 + SFt[q + n1 + 1] * w11; htv = HTt[q] * w00 + HTt[q + 1] * w10 + HTt[q + n1] * w01 + HTt[q + n1 + 1] * w11; snv = SNt[q] * w00 + SNt[q + 1] * w10 + SNt[q + n1] * w01 + SNt[q + n1 + 1] * w11; } mountainPixel(px, py, wx, wy, n1v, n2v, e, qe, Lp); }
        d[pp] = r; d[pp + 1] = g; d[pp + 2] = b; d[pp + 3] = a;
      }
    }
    if (d2 && mtn && maxLAll >= 3) { var tq = pnow(); paintPeaks(); w.prof.peaks += pnow() - tq; w.prof.pn++; }
    w.prof.paint += pnow() - tP; w.prof.n++;
    /* One pixel of mountain. The fells' ground is a tint laid into the grass overlay (r, g, b, a above): cropped, drier turf on
       the foothills, grey-green heath with heather in drifts on the high plateau, stonier toward the peaks. The rock goes into
       a second overlay (d2) laid over the meadow: a cliff's south face (panels of beds, buttresses or thin strata between
       fissures, an overhang, water running down, moss, a grassy ledge, lit where it turns west and dark where it turns east,
       wet and foaming where it stands in the sea), a side wall, the crest of every edge, the dark under an edge that faces
       away, the shadow a cliff throws east, the peaks' scree and snow, the slopes, and the waterfall's stream and pool. */
    function mountainPixel(px, py, wx, wy, n1v, n2v, e, qe, L) {
      var fn = FN[qe], o2 = pp, R0 = RK.base, R1 = RK.shade, R2 = RK.hl, big = noise[(((wy >> 2) & 127) << 7) | ((wx >> 2) & 127)], k, rr, gg, bb, INK0 = 38, INK1 = 30, INK2 = 30;
      if (L === 1 || L === 2) {                              // the fells: a tint over the grass
        var soft = sfv + (n1v - 0.5) * 0.08, tr, tg, tb, ta;
        if (L === 1) { tr = 168; tg = 164; tb = 96; ta = 84 + soft * 60; if (soft > 0.56) { var ok1 = Math.min(1, (soft - 0.56) / 0.05); tr += (186 - tr) * ok1; tg += (160 - tg) * ok1; tb += (98 - tb) * ok1; ta += 36 * ok1; } }   // the foothills: cropped, drier turf, ochre where it is thinnest
        else {
          tr = 150; tg = 146; tb = 108; ta = 150 + soft * 50;                                 // the plateau: grey-green heath
          var hth = htv + (n1v - 0.5) * 0.1; if (hth > 0.63) { var hk = Math.min(1, (hth - 0.63) / 0.035); tr += (132 - tr) * hk; tg += (106 - tg) * hk; tb += (114 - tb) * hk; ta += 30 * hk; var hfk = hk * sstep(0.62, 0.72, nsm(wx + 7, wy + 3, 0.19)); if (hfk > 0) { tr += (170 - tr) * hfk; tg += (124 - tg) * hfk; tb += (158 - tb) * hfk; ta += (220 - ta) * hfk; } }   // heather in drifts, flecked with its flowers
          var mf = mfr[qe] / 64, stn = mf > 2.62 ? (mf - 2.62) / 0.38 : 0;
          if (stn > 0) { var gvk = sstep(-0.04, 0.04, 0.26 + stn * 0.55 - (n1v * 0.6 + n2v * 0.4)); if (gvk > 0) { var gpm = (nsm(wx + 13, wy + 51, 0.3) - 0.5) * 34; tr += (156 + gpm - tr) * gvk; tg += (152 + gpm - tg) * gvk; tb += (138 + gpm * 0.9 - tb) * gvk; ta += (222 - ta) * gvk; } }   // gravel toward the peaks, a speck a stone
        }
        var at2 = a + ta; r = (r * a + tr * ta) / at2; g = (g * a + tg * ta) / at2; b = (b * a + tb * ta) / at2; a = Math.min(255, at2);
      }
      if (rampsHere.length) {                                // a slope: trodden earth climbing through the face between two banks of rock, a step of stone now and then
        for (k = 0; k < rampsHere.length; k++) {
          var rm = rampsHere[k], rd = mtn.rampD(rm, wx, wy / K), tt = rd[1], along = tt * rm.len;
          var wide = rm.r * (0.84 + 0.2 * noise[(((along | 0) >> 1) & 127) << 7 | (rm.x0 & 127)] + (tt < 0.1 ? (0.1 - tt) * 2.2 : 0) + (tt > 0.88 ? (tt - 0.88) * 2.4 : 0)), dd = rd[0] + (n1v - 0.5) * 4;
          if (dd < wide) {
            var inF = fn !== 0 || EN[qe] !== 0 || WN[qe] !== 0, edge = wide - dd, side = wx < rm.x0 + (rm.x1 - rm.x0) * tt, stp = (along + 6) % 23, lift = 1 - tt;
            rr = 150 + lift * 22 + (n2v - 0.5) * 26 + (big - 0.5) * 18; gg = 124 + lift * 20 + (n2v - 0.5) * 22 + (big - 0.5) * 14; bb = 86 + lift * 16 + (n2v - 0.5) * 18;
            if (dd < wide * 0.45) { rr += 10; gg += 9; bb += 6; }                                // trodden paler down the middle
            var pb = white[((wy & 255) << 8) | (wx & 255)]; if (pb > 0.965) { rr = 196; gg = 188; bb = 172; } else if (pb < 0.03) { rr -= 34; gg -= 30; bb -= 22; }   // pebbles (a speck each: the noise sheet is smooth and drew them as blots)
            if (!rm.gap && tt > 0.1 && tt < 0.9 && edge > 7) { if (stp < 2) { rr = R1[0] * 0.8; gg = R1[1] * 0.8; bb = R1[2] * 0.82; } else if (stp < 5) { rr = R2[0]; gg = R2[1]; bb = R2[2]; } }   // a step: a slab's lit top over its dark front
            if (inF && edge < 7) { var bk = side ? R2 : R1, bt2 = side ? 1 : 0.8; rr = bk[0] * bt2 + (n2v - 0.5) * 20; gg = bk[1] * bt2 + (n2v - 0.5) * 20; bb = bk[2] * bt2 + (n2v - 0.5) * 16; if (edge < 1.6) { rr = INK0; gg = INK1; bb = INK2; } }   // the banks: lit on the west, dark on the east
            d2[o2] = rr; d2[o2 + 1] = gg; d2[o2 + 2] = bb; d2[o2 + 3] = inF ? 255 : 255 * Math.min(1, edge / 6); return;
          }
        }
      }
      if (fn) {                                              // the south face of a cliff
        var fd = FD[qe], tot = HF * (fn - L), qa = qe - fd * LW, mA = mff[qa], mB = mff[qa + LW], fr = mA > mB ? (mA - fn) / (mA - mB) : 0; fr = fr < 0 ? 0 : (fr > 1 ? 1 : fr);   // where between two rows the edge really runs: the face begins and ends on a part of a pixel, so its lip and its foot are lines and not stairs
        var fdf = fd - fr, ey = wy - fd, fa = FN[qe - 4] === fn ? FD[qe - 4] : -1, fb2 = FN[qe + 4] === fn ? FD[qe + 4] : -1, sl = fa >= 0 && fb2 >= 0 ? (fa - fb2) / 8 : (fa >= 0 ? (fa - fd) / 4 : (fb2 >= 0 ? (fd - fb2) / 4 : 0));
        sl = Math.max(-1.1, Math.min(1.1, sl));              // how the edge runs over this pixel: falling to the right the wall turns west (lit), rising it turns east (dark)
        var kk = Math.min(1, fdf / (HF * 1.5)), fm = fdf % HF;
        var tone = 1.08 - 0.27 * kk + sl * 0.19 + rockTone(wx, fdf, fn * 7 + 1);
        var cvi = fn * W2 + px, ovs = OVS[cvi];
        if (ovs > 0) { var dfo = fm - OVY[cvi]; tone += 0.2 * ovs * sstep(-4.5, -2.5, dfo) * (1 - sstep(-1, 0.5, dfo)); if (dfo > -0.5 && dfo < 20) tone -= 0.42 * ovs * sstep(-0.5, 1.5, dfo) * (1 - dfo / 20) * (1 - dfo / 20); }   // an overhang: a jutting bed and the dark under it
        if (tone < 0.3) tone = 0.3;
        rr = R0[0] * tone; gg = R0[1] * tone; bb = R0[2] * (tone + 0.02);
        var wet = WET[cvi]; if (wet > 0.05) { var wk = wet * (1 - kk * 0.35) * 0.46, gln = wet > 0.6 ? sstep(0.66, 0.76, nsm(wx, fdf * 0.3 + fn * 60, 0.16)) : 0; rr = rr * (1 - wk) + 24 * gln; gg = gg * (1 - wk * 0.9) + 28 * gln; bb = bb * (1 - wk * 0.72) + 34 * gln; }   // water running down the rock: a dark streak that glints
        var mossN = nsm(wx + 91, wy + fn * 517, 3.2) + wet * 0.1 - kk * 0.08;
        if (mossN > 0.58) { var mk = sstep(0.58, 0.66, mossN) * 0.82, ml = sstep(0.42, 0.58, nsm(wx + 5, wy * 1.3 + 9, 0.4)); rr += (68 + 32 * ml - rr) * mk; gg += (100 + 32 * ml - gg) * mk; bb += (46 + 14 * ml - bb) * mk; }   // moss in big patches
        for (k = 0; k < ledgesHere.length; k++) {            // a grassy ledge: a shelf of turf, the dark under it
          var lg = ledgesHere[k], ldx = Math.abs(wx - lg.x); if (lg.n !== fn || ldx > lg.hw + 3 || Math.abs(ey - lg.ye * K) > 16) continue;
          var th = 6.5 * (1 - (ldx / lg.hw) * (ldx / lg.hw)), dq = fdf - lg.f;
          if (ldx <= lg.hw && dq > -th && dq <= 0) { var gl = dq < -th * 0.45 ? 1 : sstep(0.4, 0.6, nsm(wx * 1.5, wy + 30, 0.3)); rr = 86 + 36 * gl; gg = 120 + 34 * gl; bb = 52 + 16 * gl; if (dq > -1.3) { rr = 54; gg = 44; bb = 34; } }
          else if (dq > 0 && dq < 11) { var sh2 = 0.52 * (1 - dq / 11) * Math.min(1, (lg.hw + 3 - ldx) / 5); rr *= 1 - sh2; gg *= 1 - sh2; bb *= 1 - sh2 * 0.8; }
        }
        var footD = tot - fdf, inSea = e < 0.45, cont = false; if (footD < 34) { var blw = qe + Math.max(0, tot - fd + 1) * LW; if (EN[blw] !== 0 || WN[blw] !== 0) cont = true; }   // the wall goes on below this face (the foot of a wall that turns): no foot here
        var lipL = sstep(1.9, 2.9, fdf) * (1 - sstep(5.2, 7.8, fdf));                           // the lit lip, grass hanging over it here and there
        if (lipL > 0) { var gfr = sstep(0.5, 0.62, nsm(wx * 1.3, fn * 40 + 7, 0.5)) * (1 - sstep(2.6, 5, fdf)); rr += (R2[0] - rr) * lipL * 0.9; gg += (R2[1] - gg) * lipL * 0.9; bb += (R2[2] - bb) * lipL * 0.9; if (gfr > 0) { rr += (96 - rr) * gfr; gg += (140 - gg) * gfr; bb += (62 - bb) * gfr; } }
        if (inSea && footD < 30 && !cont) {                  // where the wall stands in the sea: wet and dark, weed on it, foam at its foot
          var wz = 1 - Math.max(0, footD) / 30; rr *= 1 - 0.46 * wz; gg *= 1 - 0.36 * wz; bb *= 1 - 0.26 * wz;
          if (footD < 13) { var wd = sstep(0.46, 0.58, nsm(wx * 1.4, wy, 0.4)) * 0.85; rr += (rr * 0.55 + 16 - rr) * wd; gg += (gg * 0.6 + 40 - gg) * wd; bb += (bb * 0.5 + 22 - bb) * wd; }
          var fo2 = 1 - sstep(1.5, 5, footD + (nsm(wx, 31, 0.5) - 0.5) * 6); rr += (238 - rr) * fo2; gg += (247 - gg) * fo2; bb += (250 - bb) * fo2;
        }
        else if (!cont) { var fk = 1 - sstep(0, 11, footD); rr *= 1 - 0.3 * fk; gg *= 1 - 0.3 * fk; bb *= 1 - 0.26 * fk; }   // darker toward its foot
        var lipI = 1 - sstep(1.5, 2.5, fdf); if (lipI > 0) { rr += (INK0 - rr) * lipI; gg += (INK1 - gg) * lipI; bb += (INK2 - bb) * lipI; }   // the ink line along the edge
        if (fallsHere.length) for (k = 0; k < fallsHere.length; k++) {                         // the falling water (still here; w.drawFalls moves over it)
          var fl = fallsHere[k]; if (fl.n !== fn || Math.abs(ey - fl.ye * K) > 14) continue; var fdx = Math.abs(wx - fl.x - Math.sin(fd * 0.07) * 1.2), fhw = fl.w * 0.5 + fd * 0.03;
          if (fdx < fhw) { var wv = 0.5 + 0.5 * Math.sin(wx * 1.9 + fd * 0.23); rr = 186 + wv * 56; gg = 214 + wv * 34; bb = 232 + wv * 20; if (fdx > fhw - 1.6) { rr = 104; gg = 138; bb = 160; } }
          else if (fdx < fhw + 9) { var sp = 1 - (fdx - fhw) / 9; rr *= 1 - 0.3 * sp; gg *= 1 - 0.24 * sp; bb *= 1 - 0.16 * sp; }                 // the rock wet with spray beside it
        }
        var aF = fdf < 1 ? fdf : 1; if (!cont) { var aB = footD + 1; if (aB < aF) aF = aB < 0 ? 0 : aB; }
        d2[o2] = rr; d2[o2 + 1] = gg; d2[o2 + 2] = bb; d2[o2 + 3] = 255 * aF; return;
      }
      var en = EN[qe], wn = WN[qe];
      if (en || wn) {                                        // a side wall: dark where it faces east, lit where it faces west; the same rock seen along the wall
        var east = en !== 0 && (wn === 0 || ED[qe] <= WD[qe]), sn = east ? en : wn, sd = east ? ED[qe] : WD[qe], stot = HF * (sn - L), al = wy - sd;
        var offS = Math.ceil(sd * SIDE / HF) + 2, proper = lev[east ? qe - offS : qe + offS] >= sn;   // a true side wall has the high ground beside it; without, this is the foot of a south wall that turns a little, and takes that wall's own tone
        var toneS = (proper ? (east ? 0.64 : 1.2) : 0.86) - 0.14 * Math.min(1, sd / (HF * 1.5)) + rockTone(al + (east ? 4000 : 9000), sd, sn * 5 + (east ? 2 : 3)) * (east && proper ? 0.75 : 1);
        rr = R0[0] * toneS; gg = R0[1] * toneS; bb = R0[2] * (toneS + (east && proper ? 0.05 : 0.01));
        var outer = east ? (EN[qe + 1] === 0 && FN[qe + 1] === 0) : (WN[qe - 1] === 0 && FN[qe - 1] === 0);
        if ((sd <= 1 && proper) || outer) { rr = INK0; gg = INK1; bb = INK2; }
        else if (sd <= 4 && proper) { rr += (R2[0] - rr) * 0.85; gg += (R2[1] - gg) * 0.85; bb += (R2[2] - bb) * 0.85; }
        else if (e < 0.45 && stot - sd < 16) { var wz2 = 1 - (stot - sd) / 16; rr *= 1 - 0.4 * wz2; gg *= 1 - 0.3 * wz2; bb *= 1 - 0.2 * wz2; var fo3 = 1 - sstep(1.5, 4.5, stot - sd + (nsm(wx, wy, 0.5) - 0.5) * 5); rr += (238 - rr) * fo3; gg += (247 - gg) * fo3; bb += (250 - bb) * fo3; }
        else if (stot - sd < 10 && !FN[qe + LW]) { var fk2 = 1 - (stot - sd) / 10; rr *= 1 - 0.22 * fk2; gg *= 1 - 0.22 * fk2; bb *= 1 - 0.18 * fk2; }
        d2[o2] = rr; d2[o2 + 1] = gg; d2[o2 + 2] = bb; d2[o2 + 3] = 255; return;
      }
      if (L === 3) {                                         // the peaks' ground: scree, and snow lying on it in long drifts, more of it further in (the peaks themselves are painted over it after: paintPeaks)
        var mf3 = mfr[qe] / 64, snb = snv + Math.min(0.3, (mf3 - 3) * 0.6) - 0.03, sn3 = snb + (nsm(wx, wy, 0.7) - 0.5) * 0.24, gr3 = 0.9 + (nsm(wx + 40, wy * 1.6, 2.2) - 0.5) * 0.2 + (nsm(wx + 11, wy * 1.5 + 7, 0.45) - 0.5) * 0.16;
        rr = R0[0] * gr3; gg = R0[1] * gr3; bb = R0[2] * (gr3 + 0.02);
        var skk = sstep(0.5, 0.55, sn3); if (skk > 0) { var shd = 1 - sstep(0.5, 0.56, snb + (nsm(wx - 3, wy - 4, 0.7) - 0.5) * 0.24), sv = (sfv - 0.5) * 34; rr += (228 + sv * 0.5 + (188 - 228) * shd - rr) * skk; gg += (235 + sv * 0.4 + (204 - 235) * shd - gg) * skk; bb += (246 + sv * 0.2 + (230 - 246) * shd - bb) * skk; }   // (the fields a little blue along their lower right edge)
        d2[o2] = rr; d2[o2 + 1] = gg; d2[o2 + 2] = bb; d2[o2 + 3] = 255; return;
      }
      if (fallsHere.length) for (k = 0; k < fallsHere.length; k++) {                           // the waterfall's water on the ground: the pool, the stream above, the brook out of it and the bog it sinks into
        var f = fallsHere[k], wyw = wy / K; if (wx < f.box[0] || wx > f.box[2] || wyw < f.box[1] || wyw > f.box[3]) continue;
        var pd = Math.hypot((wx - f.pool.x) / f.pool.rx, (wyw - f.pool.y) / f.pool.ry) + (n1v - 0.5) * 0.14 + (big - 0.5) * 0.1;
        if (pd < 1.14 && L === f.lvl) {
          if (pd > 1.0) { rr = 150 + (n2v - 0.5) * 36; gg = 142 + (n2v - 0.5) * 32; bb = 124 + (n2v - 0.5) * 26; d2[o2] = rr; d2[o2 + 1] = gg; d2[o2 + 2] = bb; d2[o2 + 3] = 255 * Math.min(1, (1.14 - pd) / 0.06); return; }   // wet gravel round it
          var dp = Math.min(1, (1 - pd / 0.95) * 1.5); if (dp < 0) dp = 0; dp = dp * dp * (3 - 2 * dp);
          rr = 124 + (30 - 124) * dp + (n2v - 0.5) * 10; gg = 184 + (86 - 184) * dp + (n2v - 0.5) * 10; bb = 176 + (106 - 176) * dp + (n2v - 0.5) * 10;
          if (pd > 0.95) { rr = 62; gg = 88; bb = 90; } else if (big > 0.66 && n2v > 0.6) { rr += 16; gg += 16; bb += 14; }
          d2[o2] = rr; d2[o2 + 1] = gg; d2[o2 + 2] = bb; d2[o2 + 3] = 255; return;
        }
        var onUp = L === f.n, sdw = onUp ? lineD(f.stream, wx, wyw) : (L === f.lvl ? lineD(f.out, wx, wyw) : 99), shw = (onUp ? 7.6 : 6.4) + (n1v - 0.5) * 2.6;
        if (sdw < shw + 3.2) {
          if (sdw < shw) { var ce = sdw / shw; rr = 92 + ce * 30 + (n2v - 0.5) * 14; gg = 156 + ce * 22 + (n2v - 0.5) * 12; bb = 166 + ce * 6 + (n2v - 0.5) * 10; if (ce > 0.8) { rr = 66; gg = 96; bb = 100; } else if (n2v > 0.84) { rr = 226; gg = 242; bb = 248; } d2[o2 + 3] = 255; }
          else { rr = 134 + (n2v - 0.5) * 30; gg = 122 + (n2v - 0.5) * 26; bb = 98 + (n2v - 0.5) * 22; d2[o2 + 3] = 220 * (1 - (sdw - shw) / 3.2); }                                              // the damp bank
          d2[o2] = rr; d2[o2 + 1] = gg; d2[o2 + 2] = bb; return;
        }
        if (L === f.lvl) { var bd0 = Math.hypot(wx - f.bog.x, (wyw - f.bog.y) * 1.25) / f.bog.r + (n1v - 0.5) * 0.5; if (bd0 < 1) { var gl2 = n2v > 0.8 ? 1 : 0; d2[o2] = 72 + (n2v - 0.5) * 20 + gl2 * 60; d2[o2 + 1] = 98 + (n2v - 0.5) * 24 + gl2 * 70; d2[o2 + 2] = 66 + (n2v - 0.5) * 20 + gl2 * 88; d2[o2 + 3] = 235 * Math.min(1, (1 - bd0) / 0.25); return; } }   // the bog: dark olive, glints of standing water
      }
      var bdist = BD[qe] * 0.5, bo = BO[qe], oth = (bo >> 2) === L ? (bo & 3) : (bo >> 2), al2 = 0;
      if (bdist <= 52 && oth !== L) {
        if (bdist < 7) { var nbv = oth > L ? L + 1 : L, gxm = (mff[qe + 1] - mff[qe - 1]) * 0.5, gym = (mff[qe + LW] - mff[qe - LW]) * 0.5, glm = Math.sqrt(gxm * gxm + gym * gym); if (glm > 0.0008) { var da = Math.abs(mff[qe] - nbv) / glm; if (da < bdist + 1.6 && da > bdist - 1.6) bdist = da; } }   // near an edge the field itself says how far off it is, to a part of a pixel: a line, not a stair
        if (oth < L) {                                       // the crest of an edge: an ink line at the drop, a rim of rock along it, its inner edge uneven
          var cw2 = 5 + nsm(wx, wy, 0.55) * 7, aR = 1 - sstep(cw2 - 1.8, cw2, bdist);
          if (aR > 0.02) { var st2 = (0.8 + 0.2 * sstep(2.4, 3.8, bdist)) * (0.98 + 0.14 * sstep(0.46, 0.6, nsm(wx + 60, wy + 20, 0.4))), ic = 1 - sstep(1.0, 2.0, bdist); d2[o2] = R2[0] * st2 + (INK0 - R2[0] * st2) * ic; d2[o2 + 1] = R2[1] * st2 + (INK1 - R2[1] * st2) * ic; d2[o2 + 2] = R2[2] * st2 + (INK2 - R2[2] * st2) * ic; d2[o2 + 3] = 245 * aR; return; }
          if (bdist <= 24) { d2[o2] = 232; d2[o2 + 1] = 226; d2[o2 + 2] = 168; d2[o2 + 3] = 62 * (1 - (bdist - cw2) / (24 - cw2)); return; }   // the turf paler toward the drop: wind-bitten
        } else {                                             // the low ground under an edge that faces away: an ink line, then the dark of the wall's foot, deepest at the wall
          var ao = 1 - bdist / 52, inkL = 1 - sstep(1.4, 2.6, bdist); al2 = 0.62 * ao * Math.sqrt(ao);
          if (inkL > al2) { d2[o2] = INK0; d2[o2 + 1] = INK1; d2[o2 + 2] = INK2; d2[o2 + 3] = 245 * inkL; return; }
        }
      }
      if (HN[qe]) { var hs = Math.min(1, (HF * 8 / 7 * (HN[qe] - L) - HD[qe]) / 10); if (hs > 0) al2 = 1 - (1 - al2) * (1 - 0.26 * hs); }   // the shadow a cliff throws east (and the strip at a south face's foot)
      if (al2 > 0.01) { d2[o2] = 14; d2[o2 + 1] = 20; d2[o2 + 2] = 36; d2[o2 + 3] = 255 * al2; }
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
      tP = pnow();
      ov2 = kit.mk(W2, H2); ov2.getContext('2d').putImageData(img2, 0, 0); c.drawImage(ov2, 0, 0, W2, H2);   // the rock, over the meadow
      /* What is drawn with a pen over the painted rock: tufts over a lip, stones proud of an edge, scree at a foot, the stones
         and sedge of the fells, heather, the rocks round the pool. Everything is placed from the world's own position (never
         the piece's) and looked for a little way past the piece's border, so a thing cut by a border is drawn whole by both. */
      var RKc = rockPal(), fxp, fyp, qf, INKS = 'rgba(38,30,30,0.9)', HL = 'rgb(' + RKc.hl.map(Math.round).join(',') + ')', BS = 'rgb(' + RKc.base.map(Math.round).join(',') + ')', X0p = cx * W2, Y0p = cy * H2, bi, si; c.lineCap = 'round'; c.lineJoin = 'round';
      var stoneAt = function (x, y, rx, ry, col, seed, cap) {  // a stone: an uneven outline in ink, heavier on the lower right, a lit top
        var a3, pts = []; for (a3 = 0; a3 < 7; a3++) { var an = a3 / 7 * 6.283 + 0.3, rq = 0.78 + hash(seed, a3, 5) * 0.44; pts.push([x + Math.cos(an) * rx * rq, y + Math.sin(an) * ry * rq]); }
        c.fillStyle = 'rgba(14,20,36,0.3)'; c.beginPath(); c.ellipse(x + rx * 0.35, y + ry * 0.55, rx * 1.05, ry * 0.6, 0, 0, 7); c.fill();
        c.fillStyle = col; c.beginPath(); pts.forEach(function (p, i4) { if (i4) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.fill();
        c.fillStyle = cap ? 'rgba(244,247,252,0.95)' : 'rgba(255,255,255,0.24)'; c.beginPath(); c.ellipse(x - rx * 0.15, y - ry * 0.34, rx * (cap ? 0.72 : 0.5), ry * (cap ? 0.42 : 0.34), 0, 0, 7); c.fill();
        c.strokeStyle = INKS; c.lineWidth = 0.6; c.beginPath(); pts.forEach(function (p, i4) { if (i4) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.stroke();
        c.lineWidth = 1.15; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[2][0], pts[2][1]); c.stroke();
      };
      var blades = function (x, y, n4, hgt, cols, seed, spread) { var b4; c.lineWidth = 0.9; for (b4 = 0; b4 < n4; b4++) { var hb4 = hash(seed + b4, seed, s + 62), ox = (b4 - (n4 - 1) / 2) * (spread || 1.5); c.strokeStyle = cols[hb4 > 0.55 ? 1 : 0]; c.beginPath(); c.moveTo(x + ox, y); c.quadraticCurveTo(x + ox * 1.4, y - hgt * 0.6, x + ox * 1.9 + (hb4 - 0.5) * 3, y - hgt * (0.7 + hb4 * 0.5)); c.stroke(); } };
      var GRN = ['#5d8a3a', '#86b450'], SEDGE = ['#8a8748', '#bfae62'];
      for (fyp = -10; fyp < H2 + 10; fyp++) for (fxp = -10; fxp < W2 + 10; fxp++) {
        qf = (fyp + PADR) * LW + fxp + MG; var fnq = FN[qf]; if (!fnq && BD[qf] > 1) continue;
        var wxf = X0p + fxp, wyf = Y0p + fyp, hf = white[(((wyf + 77) & 255) << 8) | ((wxf + 31) & 255)];
        if (fnq) {
          if (hf > 0.2 && hf < 0.86) continue;
          if (mtn.ramps.length && (cellAt(wxf, wyf / K) & M_RAMP)) continue;
          if (FD[qf] === 2 && hf < 0.2) {                     // a tuft over the lip
            var nb = 2 + Math.floor(hf * 20); c.lineWidth = 0.9;
            for (bi = 0; bi < nb; bi++) { var hb = hash(wxf + bi, wyf, s + 62), down = hb < 0.45; c.strokeStyle = hb > 0.6 ? '#86b450' : '#5d8a3a'; c.beginPath(); c.moveTo(fxp + (bi - nb / 2) * 1.3, fyp - 1.5); c.quadraticCurveTo(fxp + (bi - nb / 2) * 1.8, fyp - (down ? 0 : 5), fxp + (bi - nb / 2) * 2.4 + (hb - 0.5) * 3, fyp + (down ? 3.5 + hb * 4 : -5 - hb * 3)); c.stroke(); }
          } else if (FD[qf] === 2 && hf > 0.955) stoneAt(fxp, fyp - 1.5, 3 + hf * 2, 2.2, HL, wxf + wyf);   // a stone standing proud of the edge
          if (hf > 0.86 && !FN[qf + LW] && !EN[qf + LW] && !WN[qf + LW] && elevAt(wxf, (wyf + 4) / K) > 0.5) {   // scree at the foot (not where the foot is in the sea)
            var ns = 1 + Math.floor((hf - 0.86) * 28); for (si = 0; si < ns; si++) { var hs = hash(wxf, wyf + si, s + 63); stoneAt(fxp + (hs - 0.5) * 9, fyp + 1 + hash(wxf + si, wyf, s + 64) * 6, 1.2 + hs * 2.4, 0.9 + hs * 1.6, hs > 0.5 ? HL : BS, wxf + si * 7); }
            if (hf > 0.95) blades(fxp, fyp + 3, 3, 5, GRN, wxf);
          }
        } else if (!EN[qf] && !WN[qf] && lev[qf] < 3 && hf < 0.2) {   // the crest of an edge that faces away or runs north to south: stones standing on it, grass over it (what is on the high ground overlaps the low)
          var boq = BO[qf], Lq2 = lev[qf], othq = (boq >> 2) === Lq2 ? (boq & 3) : (boq >> 2); if (othq > Lq2 || FN[qf + LW] || FN[qf + 2 * LW] || FN[qf + 3 * LW]) continue;
          if (cellAt(wxf, wyf / K) & (M_RAMP | M_WATER)) continue;
          if (hf < 0.085) stoneAt(fxp, fyp - 1, 2.4 + hf * 34, 1.7 + hf * 18, hf < 0.04 ? HL : BS, wxf * 3 + wyf);
          else blades(fxp, fyp, 3 + Math.floor(hf * 12) % 3, 5.5, GRN, wxf + wyf);
        }
      }
      var CS = 15, gx, gy;                                    // the fells' own ground: stones and slabs, sedge, heather; boulders on the peaks' scree
      for (gy = Math.floor((Y0p - 10) / CS); gy <= Math.floor((Y0p + H2 + 10) / CS); gy++) for (gx = Math.floor((X0p - 10) / CS); gx <= Math.floor((X0p + W2 + 10) / CS); gx++) {
        var h0 = hash(gx, gy, s + 65); if (h0 > 0.5) continue;
        var dxp = (gx + hash(gx, gy, s + 66)) * CS - X0p, dyp = (gy + hash(gx, gy, s + 67)) * CS - Y0p; if (dxp < -9 || dyp < -9 || dxp >= W2 + 9 || dyp >= H2 + 9) continue;
        var qd = (Math.round(dyp) + PADR) * LW + Math.round(dxp) + MG, Ld = lev[qd]; if (FN[qd] || EN[qd] || WN[qd] || BD[qd] < (Ld === 3 ? 10 : 18)) continue;
        if (cellAt(X0p + dxp, (Y0p + dyp) / K) & (M_RAMP | M_WATER)) continue;
        var hz = hash(gx, gy, s + 71), clu = nsm(X0p + dxp + 900, Y0p + dyp + 300, 2.6) > 0.55 ? 2.4 : 0.3;
        if (!Ld) {                                            // the approach: a stone, a tuft of sedge, more of them the nearer the first rise
          var apd = (mfr[qd] - 2) / 36; if (apd <= 0.1 || elevAt(X0p + dxp, (Y0p + dyp) / K) < 0.6) continue; if (apd > 1) apd = 1;
          if (h0 < 0.05 * apd * clu) stoneAt(dxp, dyp, 1.8 + hz * 3.2, 1.3 + hz * 2, hz > 0.5 ? HL : BS, gx * 31 + gy);
          else if (h0 > 0.24 && h0 < 0.24 + 0.08 * apd) blades(dxp, dyp, 3 + Math.floor(hz * 3), 4 + hz * 2.5, SEDGE, gx * 17 + gy, 1.3);
          continue;
        }
        if (Ld === 3) { if (PKM) { var pmx = Math.round(dxp), pmy = Math.round(dyp); pmx = pmx < 0 ? 0 : (pmx >= W2 ? W2 - 1 : pmx); pmy = pmy < 0 ? 0 : (pmy >= H2 ? H2 - 1 : pmy); if (PKM[pmy * W2 + pmx] || PKM[Math.max(0, pmy - 4) * W2 + pmx]) continue; } if (h0 < 0.05 && (mfr[qd] < 215 || hz > 0.7)) stoneAt(dxp, dyp, 4 + hz * 6, 2.8 + hz * 3.6, hz > 0.5 ? BS : HL, gx * 31 + gy, mfr[qd] > 205 && hz > 0.3); continue; }
        if (h0 < (Ld === 2 ? 0.1 : 0.06) * clu) { if (hz > 0.72 && Ld === 2) { stoneAt(dxp, dyp, 6 + hz * 5, 2.6 + hz * 2, HL, gx * 31 + gy); c.fillStyle = 'rgba(150,160,84,0.7)'; for (si = 0; si < 4; si++) { c.beginPath(); c.arc(dxp + (hash(gx + si, gy, 73) - 0.5) * 8, dyp + (hash(gx, gy + si, 74) - 0.5) * 3, 0.9, 0, 7); c.fill(); } } else stoneAt(dxp, dyp, 1.8 + hz * 3.2, 1.3 + hz * 2, hz > 0.5 ? HL : BS, gx * 31 + gy); }   // a stone; on the plateau now and then a flat slab with lichen on it
        else if (h0 > 0.24 && h0 < (Ld === 2 ? 0.37 : 0.35)) blades(dxp, dyp, 3 + Math.floor(hz * 3), 4 + hz * 2.5, SEDGE, gx * 17 + gy, 1.3);   // a tuft of dry sedge
        else if (Ld === 2 && h0 > 0.4 && h0 < 0.47) {         // a cushion of heather
          c.fillStyle = 'rgba(74,84,52,0.85)'; c.beginPath(); c.ellipse(dxp, dyp, 5 + hz * 3, 2.6 + hz * 1.2, 0, 0, 7); c.fill();
          for (si = 0; si < 7; si++) { c.fillStyle = hash(gx + si, gy, 75) > 0.4 ? '#b07ca4' : '#8f6488'; c.beginPath(); c.arc(dxp + (hash(gx + si, gy, 76) - 0.5) * (9 + hz * 5), dyp - 0.6 + (hash(gx, gy + si, 77) - 0.5) * 3.6, 0.85, 0, 7); c.fill(); }
        }
      }
      ledgesHere.forEach(function (lg) {                      // grass on a ledge, a strand or two hanging off it
        var i5; for (i5 = 0; i5 < 6; i5++) { var lx = lg.x + (i5 / 5 - 0.5) * lg.hw * 1.6, th = 6.5 * (1 - Math.pow((lx - lg.x) / lg.hw, 2)); blades(lx - X0p, lg.ye * K + lg.f - th - Y0p, 2, 5, GRN, Math.round(lg.x) + i5 * 13); }
        c.strokeStyle = '#5d8a3a'; c.lineWidth = 0.9; for (i5 = 0; i5 < 3; i5++) { var hx5 = lg.x + (hash(i5, Math.round(lg.x), s + 78) - 0.5) * lg.hw * 1.5 - X0p, hy5 = lg.ye * K + lg.f - Y0p; c.beginPath(); c.moveTo(hx5, hy5 - 1); c.quadraticCurveTo(hx5 + 1.5, hy5 + 3, hx5 + 0.5, hy5 + 5 + i5 * 2); c.stroke(); }
      });
      mtn.veins.forEach(function (v) {                        // copper in the cliff: a green streak up the face from its foot, flecks beside it, green-stained spoil below
        var vx = v.x - X0p, vy = v.y * K - Y0p; if (vx < -30 || vx > W2 + 30 || vy < -10 || vy > H2 + 70) return;
        var seg = 3 + (v.s % 3), hh = v.h * K, spent = v.left <= 0, k7;
        if (!spent) { var gs = c.createRadialGradient(vx, vy - hh * 0.5, 2, vx, vy - hh * 0.5, hh * 0.75); gs.addColorStop(0, 'rgba(70,170,120,0.42)'); gs.addColorStop(1, 'rgba(70,170,120,0)'); c.save(); c.translate(vx, vy - hh * 0.5); c.scale(0.6, 1); c.translate(-vx, -(vy - hh * 0.5)); c.fillStyle = gs; c.beginPath(); c.arc(vx, vy - hh * 0.5, hh * 0.75, 0, 7); c.fill(); c.restore(); }   // the rock stained green round it
        c.strokeStyle = spent ? '#5a554e' : '#1f6a4a'; c.lineWidth = 4.2; c.beginPath(); c.moveTo(vx - 6, vy - 2);
        for (k7 = 1; k7 <= seg; k7++) c.lineTo(vx - 6 + (12 / seg) * k7 + (hash(k7, v.s, 1) - 0.5) * 6, vy - 2 - (hh - 5) * k7 / seg + (hash(k7, v.s, 2) - 0.5) * 4);
        c.stroke(); c.strokeStyle = spent ? '#7c766d' : '#62c792'; c.lineWidth = 2; c.stroke();
        if (!spent) { c.strokeStyle = '#1f6a4a'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(vx - 1, vy - hh * 0.45); c.lineTo(vx + 10 + (v.s % 5), vy - hh * 0.64); c.moveTo(vx - 3, vy - hh * 0.2); c.lineTo(vx - 11 - (v.s % 4), vy - hh * 0.36); c.stroke(); c.strokeStyle = '#62c792'; c.lineWidth = 1.1; c.stroke(); }
        for (k7 = 0; k7 < 9 && !spent; k7++) { c.fillStyle = k7 % 2 ? 'rgba(98,199,146,0.9)' : 'rgba(42,125,88,0.9)'; c.beginPath(); c.arc(vx + (hash(k7, v.s, 3) - 0.5) * 26, vy - 3 - hash(k7, v.s, 4) * (hh - 6), 1.1 + hash(k7, v.s, 5) * 1.1, 0, 7); c.fill(); }
        for (k7 = 0; k7 < 4; k7++) { var hq7 = hash(k7, v.s, 6); stoneAt(vx + (hq7 - 0.5) * 26, vy + 3 + hash(k7, v.s, 7) * 7, 1.6 + hq7 * 2.2, 1.2 + hq7 * 1.3, !spent && k7 < 2 ? '#5fa585' : BS, v.s * 9 + k7); }
      });
      fallsHere.forEach(function (f) {                        // rocks round the pool, stones on the banks, reeds in the bog
        var i6, pl = f.pool, o0 = f.out[0];
        for (i6 = 0; i6 < 24; i6++) {
          var an = i6 / 24 * 6.283 + hash(i6, 3, s + 68) * 0.2, hz6 = hash(i6, 5, s + 70); if (Math.sin(an) < -0.5 || hz6 < 0.32) continue;
          var rq6 = 1.01 + hash(i6, 4, s + 69) * 0.1, px6 = pl.x + Math.cos(an) * pl.rx * rq6, py6 = pl.y + Math.sin(an) * pl.ry * rq6; if (Math.hypot(px6 - o0[0], py6 - o0[1]) < 13) continue;
          stoneAt(px6 - X0p, py6 * K - Y0p, 2.6 + hz6 * 4.4, 1.9 + hz6 * 2.6, hz6 > 0.66 ? HL : BS, i6 + 300);
        }
        [f.stream, f.out].forEach(function (pts, wh) { var k6; for (k6 = 0; k6 < pts.length - 1; k6++) { var p = pts[k6], q6 = pts[k6 + 1], seg = Math.hypot(q6[0] - p[0], q6[1] - p[1]), m6, nx = -(q6[1] - p[1]) / seg, ny = (q6[0] - p[0]) / seg; for (m6 = wh ? 8 : 12; m6 < seg; m6 += 15) { var hh6 = hash(k6 * 9 + m6, wh, s + 79); if (hh6 < 0.4) continue; var sd6 = hh6 > 0.7 ? 1 : -1, bx6 = p[0] + (q6[0] - p[0]) * m6 / seg + nx * sd6 * 10.5, by6 = p[1] + (q6[1] - p[1]) * m6 / seg + ny * sd6 * 10.5; if (cellAt(bx6, by6) & M_BLOCK) continue; stoneAt(bx6 - X0p, by6 * K - Y0p, 1.8 + hh6 * 2.4, 1.3 + hh6 * 1.4, hh6 > 0.6 ? HL : BS, k6 * 40 + m6); } } });
        for (i6 = 0; i6 < 14; i6++) { var ra = hash(i6, 7, s + 80) * 6.283, rd6 = Math.sqrt(hash(i6, 8, s + 81)) * f.bog.r * 0.85; blades(f.bog.x + Math.cos(ra) * rd6 - X0p, (f.bog.y + Math.sin(ra) * rd6 * 0.8) * K - Y0p, 3, 7 + hash(i6, 9, s + 82) * 4, ['#6f8a3c', '#a4a85a'], i6 * 5 + 900, 1.2); }
      });
      w.prof.pen += pnow() - tP;
    }
    if (mtn && mtn.inlays.length) {                          // what is set into a face: the rock shelter's inside (a picture from Blender)
      var pki, ck0 = cy * CW + cx, pics = mtn.inlays;
      for (pki = 0; pki < pics.length; pki++) {
        var pkq = pics[pki], pim = IMAGES[pkq.name]; if (!pim) continue;
        var pl = pkq.x - pim.ax * pim.upp * pkq.s, pt = pkq.y * K - pim.ay * pim.upp * pkq.s, pw2 = pim.w * pim.upp * pkq.s, ph2 = pim.h * pim.upp * pkq.s;
        if (pl > (cx + 1) * W2 || pl + pw2 < cx * W2 || pt > (cy + 1) * H2 || pt + ph2 < cy * H2) continue;
        if (!imgReady(pim.img)) { if (!imgWait[ck0]) { imgWait[ck0] = 1; imgWaitN++; } continue; }   // not loaded yet: this piece is painted again when they are
        c.drawImage(pim.img, pl - cx * W2, pt - cy * H2, pw2, ph2);
      }
    }
    for (yy = 0; yy < CT; yy++) for (xx = 0; xx < CT; xx++) if (code(cx * CT + xx, cy * CT + yy) === 4) {       // the jetty
      c.drawImage(tile('plank', cx * CT + xx, cy * CT + yy), xx * T, yy * TS, T + 0.3, TS + 0.3);
      c.fillStyle = 'rgba(20,14,26,0.3)'; c.fillRect(xx * T, (yy + 1) * TS, T, 3);
    }
    if (w.debugSeams) { c.fillStyle = 'rgba(255,0,0,0.8)'; c.fillRect(0, 0, W2, 0.5); c.fillRect(0, 0, 0.5, H2); }
    return ccv;
  }
  w.bakeChunk = bakeChunk;
  w.prof = { n: 0, lev: 0, sweep: 0, paint: 0, pen: 0, peaks: 0, pn: 0 };   // where a bake's time went, in milliseconds (the mountains' parts)
  w.waterCv = bakeChunk(-64, -64);                      // far outside the map: nothing but deep sea
  // the pieces of the map in view; at most one new piece is painted per call, and the oldest are forgotten
  var stale = {}, lastBake = -1e9, imgWait = {}, imgWaitN = 0;
  w.bakes = 0; w.bakeMs = 0;                               // how many ground pieces were baked and how long it took (the frame log reads and clears them)
  function pnow() { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
  w.drawGround = function (c, cam, hw, hh) {
    var pw = CT * T, phh = CT * TS, baked = 0;
    if (imgWaitN && mtn && !mtn.peaks.concat(mtn.inlays).some(function (pq) { return IMAGES[pq.name] && !imgReady(IMAGES[pq.name].img); })) { for (var wk in imgWait) if (chunkCv[wk]) stale[wk] = 1; imgWait = {}; imgWaitN = 0; }   // the peaks' pictures have come: the pieces painted without them are painted again
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
  function meadowOk(x, y) { if (x < 0 || y < 0 || x >= WX || y / K >= WY) return false; if (mtn) { var mc0 = cellAt(x, y / K); if (mc0 & (M_BLOCK | M_RAMP | M_WATER)) return false; if (mtn.shelters.length && w.shelterAt(x, y / K, 4)) return false; if (mc0 & 3) return true; } var ex = elevAt(x, y / K); return ex >= 0.4 && ex >= beachAt(x / T, y / K / T) + 0.35; }
  function fellOf(x, y) { return mtn ? cellAt(x, y / K) & 3 : 0; }   // 0 the low ground, 1 the foothills, 2 the high plateau (a screen position)
  w.drawMeadow = function (c, cam, hw, hh, G) {
    var sp = G.patchSize || 70, gx0 = Math.floor((cam.x - hw) / sp) - 2, gx1 = Math.ceil((cam.x + hw) / sp) + 1, gy0 = Math.floor((cam.y - hh) / (sp * 0.75)) - 2, gy1 = Math.ceil((cam.y + hh) / (sp * 0.75)) + 1, gx, gy;
    if (G.patches > 0) for (gy = gy0; gy <= gy1; gy++) for (gx = gx0; gx <= gx1; gx++) {           // big soft blotches, lighter or darker
      var hp = hash(gx, gy, 41); if (hp > 0.8) continue;
      var x = (gx + hash(gx, gy, 42)) * sp, y = (gy + hash(gx, gy, 43)) * sp * 0.75; if (!meadowOk(x, y)) continue;
      var r = sp * (0.5 + hash(gx, gy, 44) * 0.7), light = hp < 0.45, fl0 = fellOf(x, y); if (fl0 === 2 && !light) continue;   // the fells: paler, drier blotches, no deep green ones up on the plateau
      var gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, fl0 ? (light ? '#c9bd7c' : '#5f6f44') : (light ? G.patchLight : G.patchDark)); gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.save(); c.translate(x, y); c.scale(1, 0.6 + hash(gx, gy, 45) * 0.2); c.rotate((hash(gx, gy, 46) - 0.5) * 0.8); c.translate(-x, -y);
      c.fillStyle = gr; c.globalAlpha = (light ? 0.5 : 0.4) * G.patches; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore();
    }
    c.globalAlpha = 1;
    var es = sp * 1.9; gx0 = Math.floor((cam.x - hw) / es) - 1; gx1 = Math.ceil((cam.x + hw) / es); gy0 = Math.floor((cam.y - hh) / (es * 0.75)) - 1; gy1 = Math.ceil((cam.y + hh) / (es * 0.75));
    if (G.earth > 0) for (gy = gy0; gy <= gy1; gy++) for (gx = gx0; gx <= gx1; gx++) {             // bare earth showing through, with a soft grassy edge
      if (hash(gx, gy, 51) > G.earth) continue;
      var ex0 = (gx + hash(gx, gy, 52)) * es, ey0 = (gy + hash(gx, gy, 53)) * es * 0.75; if (!meadowOk(ex0, ey0) || fellOf(ex0, ey0)) continue;   // no bare earth on the fells: stone shows through there instead
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
      var fl1 = fellOf(dx0, dy0); if (fl1 === 2 || (fl1 === 1 && hash(gx, gy, 68) > 0.35)) continue; if (fl1) { n = Math.ceil(n * 0.5); col = G.bloom[0]; }   // few flowers on the foothills (the pale ones), none on the plateau
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
    var cols = [G.dark, G.mid, G.light], sp0 = G.speed, FELLC = ['#5f6a3a', '#858a4c', '#aea766'];
    c.lineCap = 'round';
    for (var gy = gy0; gy <= gy1; gy++) for (var gx = gx0; gx <= gx1; gx++) {
      var h1 = hash(gx, gy, 31); if (h1 > G.density) continue;
      var x = (gx + hash(gx, gy, 32)) * sp, y = (gy + hash(gx, gy, 33)) * sp * 0.75;
      if (x < 0 || y < 0 || x >= WX || y / K >= WY) continue;
      if (!meadowOk(x, y)) continue;
      var fl2 = fellOf(x, y), fk = fl2 === 2 ? 0.5 : (fl2 === 1 ? 0.72 : 1); if (fl2 && h1 > G.density * (fl2 === 2 ? 0.5 : 0.75)) continue;   // the fells: shorter, thinner, drier grass
      var wave = Math.sin(x * 0.011 - clock * 0.9 * sp0 + y * 0.007), gust = Math.sin(clock * 0.35 * sp0 + x * 0.004 - y * 0.003);
      if (G.shimmer > 0 && wave > 0.2) { var gr = c.createRadialGradient(x, y, 0, x, y, sp * 1.1); gr.addColorStop(0, G.glow); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.save(); c.translate(x, y); c.scale(1, 0.5); c.translate(-x, -y); c.fillStyle = gr; c.globalAlpha = (wave - 0.2) * 0.34 * G.shimmer; c.beginPath(); c.arc(x, y, sp * 1.1, 0, 7); c.fill(); c.restore(); c.globalAlpha = 1; }
      var sway = (Math.sin(clock * 1.9 * sp0 + x * 0.05 + y * 0.03) * 0.5 + gust * 0.7 + wave * 0.25) * G.sway, n = 3 + Math.floor(hash(gx, gy, 34) * 3);
      if (G.shade > 0) { c.fillStyle = G.dark; c.globalAlpha = 0.28 * G.shade; c.beginPath(); c.ellipse(x, y + 0.6, 4.6, 1.8, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
      for (var k = 0; k < n; k++) {
        var hk = hash(gx * 7 + k, gy, 35), bx = (k - (n - 1) / 2) * 1.7 + (hk - 0.5) * 1.2, bh = G.height * fk * (0.65 + hk * 0.7), lean = (k - (n - 1) / 2) * 0.9 + sway * bh * 0.5;
        c.fillStyle = (fl2 ? FELLC : cols)[(k + gx + gy) % 3 === 0 ? 0 : (hk > 0.55 ? 2 : 1)];
        c.beginPath(); c.moveTo(x + bx - 0.9, y); c.quadraticCurveTo(x + bx + lean * 0.35, y - bh * 0.6, x + bx + lean, y - bh); c.quadraticCurveTo(x + bx + lean * 0.35 + 0.5, y - bh * 0.55, x + bx + 0.9, y); c.closePath(); c.fill();
      }
      if (G.flowers > 0 && fl2 < 2 && hash(gx, gy, 36) < G.flowers * (fl2 ? 0.4 : 1)) {
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
          if (mtn && ((cellAt(pts[0], pts[1] / K) | cellAt(pts[2], pts[3] / K)) & M_BLOCK)) continue;   // not over a sea cliff's foot
          c.moveTo(pts[0], pts[1]); c.lineTo(pts[2], pts[3]);
          if (pts.length === 8) { c.moveTo(pts[4], pts[5]); c.lineTo(pts[6], pts[7]); }
        }
        c.stroke();
      }
    }
  };

  /* The waterfall alive (2026-10-12): streaks running down the still water painted on the face, the water bending over the
     lip, foam and mist where it lands, rings going out over the pool, glints running down the stream and the brook. Drawn
     with the waves, under everything that stands. */
  w.drawFalls = function (c, cam, hw, hh, clock) {
    if (!mtn || !mtn.falls.length) return;
    mtn.falls.forEach(function (f) {
      var x = f.x, y0 = f.ye * K, H = HF * (f.n - f.lvl), y1 = y0 + H, i, wd = f.w;
      if (f.box[2] < cam.x - hw || f.box[0] > cam.x + hw || f.box[3] * K < cam.y - hh || f.box[1] * K > cam.y + hh) return;
      c.save(); c.lineCap = 'round';
      [f.stream, f.out].forEach(function (pts, wh) {         // glints running with the water: down the stream to the lip, out of the pool down the brook
        var tot = 0, segs = [], k; for (k = 0; k < pts.length - 1; k++) { var sl = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]); segs.push(sl); tot += sl; }
        var ng = Math.round(tot / 22); c.strokeStyle = 'rgba(240,252,255,0.75)'; c.lineWidth = 1;
        for (i = 0; i < ng; i++) {
          var ph = (clock * (wh ? 0.11 : 0.16) + hash(i, wh, s + 206)) % 1, dist = (wh ? ph : 1 - ph) * tot, acc = 0; if (wh === 0 && ph > 0.96) continue;
          for (k = 0; k < segs.length; k++) { if (dist <= acc + segs[k]) { var t = (dist - acc) / segs[k], gx = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t + (hash(i, 7 + wh, s + 207) - 0.5) * 6, gy = (pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t) * K, dxg = (pts[k + 1][0] - pts[k][0]) / segs[k] * (wh ? 1 : -1), dyg = (pts[k + 1][1] - pts[k][1]) / segs[k] * K * (wh ? 1 : -1); c.globalAlpha = Math.sin(ph * Math.PI) * 0.9; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + dxg * 3.5, gy + dyg * 3.5); c.stroke(); break; } acc += segs[k]; }
        }
      });
      c.globalAlpha = 1;
      c.fillStyle = 'rgba(236,248,252,0.9)'; c.beginPath(); c.ellipse(x, y0 + 1.5, wd * 0.5 + 1, 2.6 + Math.sin(clock * 7) * 0.5, 0, 0, 7); c.fill();   // the water bending over the lip
      for (i = 0; i < 30; i++) {                             // the fall: streaks of white running down, quicker as they go
        var hx = hash(i, 1, s + 201), fall = ((clock * (0.9 + hash(i, 2, s + 202) * 0.5) + hash(i, 3, s + 203)) % 1), ph2 = fall * fall * 0.55 + fall * 0.45, yy = y0 + 2 + ph2 * (H - 2), len = 7 + ph2 * 16 + hash(i, 4, s + 204) * 8, xx = x + (hx - 0.5) * (wd - 2 + ph2 * H * 0.055);
        c.strokeStyle = 'rgba(255,255,255,' + (0.3 + hx * 0.5).toFixed(2) + ')'; c.lineWidth = 0.9 + hash(i, 5, s + 205) * 1.3; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + (hx - 0.5) * 0.8, Math.min(y1 + 1, yy + len)); c.stroke();
      }
      for (i = 0; i < 4; i++) {                              // rings going out over the pool (the near half: the far half is under the wall)
        var pr = (clock * 0.3 + i / 4) % 1, rx = 9 + pr * f.pool.rx * 0.86; c.strokeStyle = 'rgba(235,250,255,' + (0.55 * (1 - pr) * (1 - pr)).toFixed(3) + ')'; c.lineWidth = 1.3 - pr * 0.6; c.beginPath(); c.ellipse(x, y1 + 3, rx, rx * 0.5, 0, 0.12, Math.PI - 0.12); c.stroke();
      }
      for (i = 0; i < 12; i++) {                             // foam boiling where it lands
        var pf = (clock * 1.5 + hash(i, 8, s + 208)) % 1, fxx = x + (hash(i, 6, s + 209) - 0.5) * (wd + 16), rr = 1.8 + pf * 4.5; c.fillStyle = 'rgba(255,255,255,' + (0.8 * (1 - pf)).toFixed(2) + ')'; c.beginPath(); c.ellipse(fxx, y1 + 1 + pf * 3.5 + hash(i, 9, s + 210) * 3, rr * 1.5, rr * 0.7, 0, 0, 7); c.fill();
      }
      for (i = 0; i < 5; i++) {                              // mist drifting up off it
        var pm = (clock * 0.22 + i / 5) % 1, mx = x + (hash(i, 10, s + 211) - 0.5) * 30 + Math.sin(clock * 0.6 + i) * 4, my = y1 - 4 - pm * 26, mr = 9 + pm * 12, gm = c.createRadialGradient(mx, my, 0, mx, my, mr);
        gm.addColorStop(0, 'rgba(255,255,255,' + (0.2 * Math.sin(pm * Math.PI)).toFixed(3) + ')'); gm.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gm; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill();
      }
      c.restore();
    });
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
      if (mcell & (M_BLOCK | M_RAMP | M_WATER)) continue;                    // a cliff, a peak, a slope or the stream: nothing grows there
      if (mtn && mtn.falls.length && byFalls(wx, wy)) continue;               // and the waterfall is kept in the open
      if (mtn && bySet(wx, wy)) continue;                                     // as are the mine's mouth, the shelter and the veins
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
        var bmp = w.biomeAt(x, y), apr = mtn ? w.fellNear(wx, wy) : 0, hasP = function (nm) { return !!kit.PROPS[nm]; };
        if (apr > 0.08 && roll > 0.9 && roll < 0.9 + 0.034 * apr) { p = { name: R() < 0.45 && hasP('boulder') ? 'boulder' : (R() < 0.6 ? 'rock' : 'rockFormation'), s: 0.8 + R() * 0.35, r: 11 }; w.stats.rocks++; }   // the approach to the mountains: boulders and rock in the grass
        else if (apr > 0.08 && roll > 0.86 && roll < 0.86 + 0.03 * apr) p = { name: ['juniper', 'heather', 'juniper', 'tallGrass'].filter(hasP)[Math.floor(R() * 4) % ['juniper', 'heather', 'juniper', 'tallGrass'].filter(hasP).length], s: 0.9, r: 0 };   // juniper and heather before the first rise
        else if (roll < 0.15 * (1 - 0.5 * apr) && vnoise(x / 7, y / 7, s + 20) > 0.62) { var tl = bmp > R() && LOW.length ? LOW : TREES, tn = tl[Math.floor(R() * tl.length) % tl.length]; if (apr > R() * 1.1) tn = R() < 0.3 * apr && hasP('dwarfBirch') ? 'dwarfBirch' : (R() < 0.6 ? 'pine' : 'birch'); if (R() < 0.02 && kit.PROPS.struckTree) tn = 'struckTree'; p = { name: tn, s: (tn === 'pine' ? 0.54 : (tn === 'struckTree' ? 0.6 : (tn === 'dwarfBirch' ? 0.85 : 0.49))) + R() * 0.1, r: tn === 'dwarfBirch' ? 7 : 11 }; w.stats.trees++; }   // now and then a tree struck by lightning: charcoal
        else if (roll > 0.955) p = { name: ['bush', 'tallGrass', 'berryBush', 'wildHerbs', 'flower'][Math.floor(R() * 5)], s: 0.9, r: 0 };
        else if (roll > 0.948) { p = { name: bmp > 0.5 && kit.PROPS.chalkRock && R() < 0.7 ? 'chalkRock' : (R() < 0.6 ? 'rock' : 'rockFormation'), s: 0.9, r: 10 }; w.stats.rocks++; }
        else if (roll > 0.9475) p = { name: ['fallenTree', 'birdNest', 'mushrooms', 'fallenTree', 'wildHerbs', 'fireRing'][Math.floor(R() * 6)], s: 1, r: 10 };   // things of nature, and an old fire ring someone left: no carved stones or posts lie about
      } else if (t3 === 1 && roll < 0.008) { p = { name: 'rock', s: 0.7 + R() * 0.35, r: 9 }; w.stats.rocks++; }
      if (!p || !kit.PROPS[p.name]) continue;
      p.x = wx; p.y = wy; p.v = Math.floor(R() * 3);
      p.kind = KIND[p.name] || null; if (p.kind) { p.max = p.hp = HP[p.name] * (0.7 + 0.6 * p.s); p.leanDir = R() < 0.5 ? -1 : 1; }
      w.addProp(p);
    }
    if (mtn) {
      mtn.ledges.forEach(function (lg) {                                      // a small tree or a bush on every ledge: it stands in the face, nobody reaches it (no kind: it is not gathered)
        if (!kit.PROPS[lg.kind]) return; var tree = lg.kind === 'dwarfBirch';
        w.addProp({ name: lg.kind, x: lg.x, y: lg.ye + (lg.f - 2) / K, s: tree ? 0.5 + R() * 0.14 : 0.62 + R() * 0.2, r: 0, v: Math.floor(R() * 3), ledge: true });
      });
      mtn.shelters.forEach(function (sh) {                                    // the rock shelter: its overhang stands before whoever is under it; an old fire ring on its floor
        if (IMAGES.shelter) w.addProp({ name: 'shelter', x: sh.x, y: sh.y + 1, s: 1, r: 0, v: 0, shelter: true });
        if (kit.PROPS.fireRing) w.addProp({ name: 'fireRing', x: sh.x - 22, y: sh.y - 20, s: 1, r: 10, v: 0 });
      });
      mtn.lookouts.forEach(function (lo) { if (kit.PROPS.varde) w.addProp({ name: 'varde', x: lo.x, y: lo.y, s: 1, r: 13, v: 0, lookout: true }); });   // the beacon cairn on the high point
      mtn.falls.forEach(function (f) {                                        // boulders by the pool, reeds where the brook sinks away
        [[-1.12, 0.2], [1.14, 0.3], [0.9, 0.9], [-0.84, 0.94]].forEach(function (q, qi) { var bx = f.pool.x + q[0] * f.pool.rx, by = f.pool.y + q[1] * f.pool.ry; if (qi % 2 === (Math.floor(R() * 2)) && kit.PROPS.boulder && w.flatAt(bx, by, 10)) { var pb = { name: R() < 0.6 ? 'boulder' : 'rock', x: bx, y: by, s: 0.7 + R() * 0.3, r: 10, v: Math.floor(R() * 3) }; pb.kind = KIND[pb.name]; pb.max = pb.hp = HP[pb.name] * (0.7 + 0.6 * pb.s); pb.leanDir = 1; w.addProp(pb); w.stats.rocks++; } });
        if (kit.PROPS.tallGrass) for (var ri = 0; ri < 4; ri++) { var rx = f.bog.x + (R() - 0.5) * f.bog.r * 1.5, ry = f.bog.y + (R() - 0.5) * f.bog.r; if (w.flatAt(rx, ry, 6)) { var pr = { name: 'tallGrass', x: rx, y: ry, s: 0.9, r: 0, v: Math.floor(R() * 3), kind: 'bush' }; pr.max = pr.hp = HP.tallGrass; pr.leanDir = 1; w.addProp(pr); } }
      });
    }
    if (mtn && kit.PROPS.cairn) mtn.ramps.forEach(function (rm) {            // a cairn at the foot and the head of every slope: the old way of marking a way up
      (rm.gap ? [[rm.x1 + 30, rm.y1 + 4]] : [[rm.x1 + 38, rm.y1 - 6], [rm.x0 - 38, rm.y0 + 10]]).forEach(function (q) { if (w.flatAt(q[0], q[1], 12)) w.addProp({ name: 'cairn', x: q[0], y: q[1], s: 0.9, r: 8, v: Math.floor(R() * 3) }); });
    });
    return w.stats;
  };
  // 5b. the peaks (2026-10-12): the Blender peaks stood on the ground nobody can walk. A peak goes only where everything under
  // it is peak ground or cliff, so it never covers a place you can stand; the biggest that fits, a smaller one where it does
  // not, close enough to overlap (a range, not single hills). Since nothing can ever stand behind one, they are PAINTED INTO
  // THE GROUND (bakeChunk, far to near) and cost nothing a frame: they are a list (w.mt.peaks), not props.
  // (The peaks were pictures from Blender set on the ground here; since 2026-10-12 they are painted with it: paintPeaks. What
  // is kept in w.mt.peaks now is places on the peaks' ground, north to south, for the pages that ask where the peaks are.)
  w.peaks = function () {
    if (!mtn) return 0; mtn.peaks.length = 0; var j, i, step = 2.5 * T;
    for (j = mtn.by0; j < mtn.by1; j += step) for (i = mtn.bx0; i < mtn.bx1; i += step) if ((cellAt(i, j) & 3) === 3 && (cellAt(i, j - 40) & 3) === 3 && (cellAt(i, j + 40) & 3) === 3 && (cellAt(i - 40, j) & 3) === 3 && (cellAt(i + 40, j) & 3) === 3) mtn.peaks.push({ x: i, y: j, peak: true });
    w.stats.peaks = mtn.peaks.length; return mtn.peaks.length;
  };
  // where the cave goes (2026-10-12): at the foot of a cliff one level high, where the face runs straight and the ground
  // before it is level, open and dry, away from the slopes and the waterfall. Found with the world (mountains(), cavePlace),
  // so the ledges in the faces keep clear of it. Returns { x, y } (the foot of the face) or null.
  w.caveSite = function () { return mtn && mtn.cave ? { x: mtn.cave.x, y: mtn.cave.y } : null; };
  w.veinSpent = function (v) { w.repaint(v.x - 30, v.y - v.h - 16, v.x + 30, v.y + 16); };   // a vein worked out: its face is painted again, grey
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
      if (mtn) { var mcc = cellAt((xx * step + 0.5) * T, (yy * step + 0.5) * T), mlc = mcc & 3, mk2 = (mcc & M_FACE) ? COL[5] : ((mcc & M_SIDE) ? [98, 94, 108] : ((mcc & M_RIM) ? [88, 84, 96] : ((mcc & M_WATER) ? [70, 150, 178] : (mlc ? MCOL[mlc] : null)))); if (mk2 && (grid[gi] >= 1 || (mcc & M_FACE))) { img.data[ip] = mk2[0]; img.data[ip + 1] = mk2[1]; img.data[ip + 2] = mk2[2]; } }   // the fells paler by the level, the faces grey, the peaks white
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
/* The first big island's own small mountain (2026-10-12, Robin: a small version of the biome there, to introduce mountains and
   give the first copper): in its north-west, the side you come to it from: foothills, a small plateau with a peak or two, the
   troll's cave in a wall, a rock shelter, a few veins of copper in the open cliffs. No sea cliffs, no mine, no sea cave: those
   are for a real mountain island. spec.mountain = 1 with these options. */
var BIG_MOUNTAIN = { at: [-0.3, -0.5], r: 0.56, high: 3.5, shore: 6, rise: 9, sea: false, mine: false, seaCave: false, veins: 4, minPatch: 60 };
return { make: make, setImages: setImages, IMAGES: IMAGES, BIG_MOUNTAIN: BIG_MOUNTAIN, MOUNTAIN_SPEC: { isle: 220, isle0: 220, count: 1, noDock: true, skerries: 1, rough: 1, beach: 4.5, hue: 0, seed: 11, mountain: true, mountainOpts: null, sizes: null, biomes: null, big: null }, DEF: DEF, GRASS: GRASS, GRASS_INK: GRASS_INK, KIND: KIND, HP: HP, CAMP: CAMP, hash: hash, vnoise: vnoise, fbm: fbm, T: T, TS: TS, K: K, CT: CT };
})();
if (typeof module !== 'undefined') module.exports = World;
