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
var KIND = { birch: 'tree', pine: 'tree', oak: 'tree', rock: 'stone', rockFormation: 'stone', bush: 'bush', berryBush: 'bush', wildHerbs: 'bush', tallGrass: 'bush' };
var HP = { birch: 14, pine: 18, oak: 22, rock: 11, rockFormation: 18, bush: 2, berryBush: 2, wildHerbs: 1, tallGrass: 1 };
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

function make(kit, opts) {
  var o = {}, k; for (k in DEF) o[k] = DEF[k]; for (k in opts || {}) if (opts[k] != null) o[k] = opts[k];
  var w = { T: T, TS: TS, K: K, CT: CT, o: o, hash: hash, vnoise: vnoise, fbm: fbm };
  var s = o.seed, R = kit.rng(s * 53 + 9), i, x, y, tries;
  function rnd(a, b) { return a + R() * (b - a); }
  var BASE = kit.STYLE, tiles = {}, sprites = {}, chunkCv = {}, chunkOrder = [], noise = noiseSheet();

  /* 1. place the islands: the home island first, then each new one beside an earlier one */
  function pickR() { var u = R(), f = u < 0.25 ? rnd(0.15, 0.45) : (u < 0.78 ? rnd(0.7, 1.3) : rnd(1.5, 2.2)); return Math.max(5, o.isle / 2 * (1 + (f - 1) * o.sizeVar)); }
  function pickGap() { var u = R(), f = u < 0.15 ? rnd(0.1, 0.3) : (u < 0.75 ? rnd(0.5, 1.5) : (u < 0.95 ? rnd(1.6, 3) : rnd(4, 8))); return Math.max(4, o.gap * (1 + (f - 1) * o.gapVar)); }
  var isles = [{ x: 0, y: 0, r: (o.isle0 || o.isle) / 2, gap: 0 }];   // o.isle0: the first island's width (the starter island is small)
  for (i = 1; i < o.count; i++) for (tries = 0; tries < 60; tries++) {
    var par = isles[Math.floor(R() * isles.length) % isles.length], a0 = R() * 6.283, a = (i === 1 && o.dir != null) ? o.dir : a0, r = pickR(), g = pickGap(); if (i === 1 && o.big) r = o.big / 2;   // o.big: the second island's width
    var d0 = 0, d = par.r + r + g;   // o.dir: the second island lies in that direction (0 is east, where the game's camp is)
    var cand = { x: par.x + Math.cos(a) * d, y: par.y + Math.sin(a) * d * 0.9, r: r, gap: g }, ok = true;
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
  function beachAt(tx, ty) { return o.beach * (0.55 + 0.9 * vnoise(tx / 8, ty / 8, s + 50)); }   // the beach is wider in some places than others
  /* 4. what each tile is for the game: 0 sea, 1 beach, 2 grass, 3 dark grass, 4 jetty. The jetty runs east from the home island. */
  var grid = new Uint8Array(GW * GH), landChunk = new Uint8Array(CW * CH), landTiles = 0;
  for (y = 1; y < GH - 1; y++) for (x = 1; x < GW - 1; x++) {
    var p = y * GW + x, h2 = E[p] / 100;
    if (h2 > -4.5) for (var dy = -2; dy <= 2; dy += 2) for (var dx = -2; dx <= 2; dx += 2) { var qx = Math.floor((x + dx) / CT), qy = Math.floor((y + dy) / CT); if (qx >= 0 && qy >= 0 && qx < CW && qy < CH) landChunk[qy * CW + qx] = 1; }
    if (h2 <= 0) continue;
    landTiles++;
    grid[p] = h2 < beachAt(x, y) ? 1 : (fbm(x / 9, y / 9, s + 70) > 0.6 ? 3 : 2);
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
  w.isLand = function (wx, wy) { return onPlank(wx, wy) || elevAt(wx, wy) > 0.05; };
  w.isWade = function (wx, wy) { return elevAt(wx, wy) > -1.1; };   // the turquoise shallows: you can walk through them
  w.isWater = function (wx, wy) { return !onPlank(wx, wy) && elevAt(wx, wy) < -0.18 && wx > 40 && wy > 40 && wx < WX - 40 && wy < WY - 40; };

  /* baking */
  w.sprite = function (name, v) { var kk = name + ':' + v; if (!sprites[kk]) { kit.setup(BASE); sprites[kk] = kit.bakeProp(name, 3 + v * 7); } return sprites[kk]; };
  function tile(t, gx, gy) {
    if (!tiles[t]) { kit.setup(BASE); tiles[t] = []; for (var m = 0; m < kit.TILES[t].n; m++) tiles[t].push(kit.bakeTile(t, m)); }
    return tiles[t][Math.floor(hash(gx, gy, 5) * tiles[t].length) % tiles[t].length];
  }
  w.tile = tile;
  function bakeChunk(cx, cy) {
    var W2 = CT * T, H2 = CT * TS, ccv = kit.mk(W2 * 2, H2 * 2), c = ccv.getContext('2d'), xx, yy, ii, jj;
    c.setTransform(2, 0, 0, 2, 0, 0);
    for (yy = 0; yy < CT; yy++) for (xx = 0; xx < CT; xx++) c.drawImage(tile('grass', cx * CT + xx, cy * CT + yy), xx * T, yy * TS, T + 0.3, TS + 0.3);
    var n1 = CT + 2, EE = new Float32Array(n1 * n1), BW = new Float32Array(n1 * n1), DK = new Float32Array(n1 * n1);
    for (jj = 0; jj < n1; jj++) for (ii = 0; ii < n1; ii++) { var gx = cx * CT + ii - 1, gy = cy * CT + jj - 1; EE[jj * n1 + ii] = eTile(gx, gy); BW[jj * n1 + ii] = beachAt(gx, gy); DK[jj * n1 + ii] = fbm(gx / 9, gy / 9, s + 70); }
    var ov = kit.mk(W2, H2), oc = ov.getContext('2d'), img = oc.createImageData(W2, H2), d = img.data, P = PAL, pp = 0;
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
          }
        }
        d[pp] = r; d[pp + 1] = g; d[pp + 2] = b; d[pp + 3] = a;
      }
    }
    oc.putImageData(img, 0, 0);
    c.imageSmoothingEnabled = true; c.drawImage(ov, 0, 0, W2, H2);
    var R2 = kit.rng(cx * 7919 + cy * 104729 + s);           // grains, pebbles and shells on the dry sand
    for (ii = 0; ii < 260; ii++) {
      var sx = R2() * W2, sy = R2() * H2, kind = R2(), wxx = cx * W2 + sx, wyy = (cy * H2 + sy) / K, e2 = elevAt(wxx, wyy);
      if (e2 < 0.5 || e2 > beachAt(wxx / T, wyy / T) - 0.6) continue;
      if (kind < 0.86) { c.fillStyle = kind < 0.5 ? 'rgba(150,104,52,0.5)' : 'rgba(255,246,214,0.75)'; c.fillRect(sx, sy, 1, 1); }
      else if (kind < 0.95) { c.fillStyle = 'rgba(150,140,140,0.9)'; c.beginPath(); c.ellipse(sx, sy, 1.6, 1.1, 0, 0, 7); c.fill(); }
      else { c.fillStyle = '#fff6ea'; c.strokeStyle = 'rgba(150,104,52,0.7)'; c.lineWidth = 0.6; c.beginPath(); c.ellipse(sx, sy, 2, 1.5, 0.5, 0, 7); c.fill(); c.stroke(); }
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
  w.drawGround = function (c, cam, hw, hh) {
    var pw = CT * T, phh = CT * TS, baked = 0;
    for (var qy = Math.max(0, Math.floor((cam.y - hh) / phh)); qy < CH && qy * phh < cam.y + hh; qy++) for (var qx = Math.max(0, Math.floor((cam.x - hw) / pw)); qx < CW && qx * pw < cam.x + hw; qx++) {
      var ck = qy * CW + qx, piece = w.waterCv;
      if (landChunk[ck]) {
        if (!chunkCv[ck] && baked < 1) { chunkCv[ck] = bakeChunk(qx, qy); chunkOrder.push(ck); baked++; if (chunkOrder.length > 60) delete chunkCv[chunkOrder.shift()]; }
        if (chunkCv[ck]) piece = chunkCv[ck];
      }
      c.drawImage(piece, qx * pw, qy * phh, pw + 0.5, phh + 0.5);
    }
  };
  // the meadow under the blades (painted first, still): soft lighter and darker patches of grass, bare earth, and drifts of
  // tiny flowers in several colours, the way a real meadow is blotchy and flecked rather than one green
  function meadowOk(x, y) { if (x < 0 || y < 0 || x >= WX || y / K >= WY) return false; var ex = elevAt(x, y / K); return ex >= 0.4 && ex >= beachAt(x / T, y / K / T) + 0.35; }
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
    G = G || GRASS; w.drawMeadow(c, cam, hw, hh, G); if (!(G.density > 0)) return;
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
    var TREES = ['birch', 'pine', 'birch', 'pine', 'oak'].filter(function (nm) { return !!kit.PROPS[nm]; }), home = w.home;
    for (y = 3; y < GH - 3; y++) for (x = 3; x < GW - 3; x++) {
      var t3 = grid[y * GW + x]; if (t3 === 0 || t3 === 4) continue;
      var roll = R(), wx = (x + 0.2 + R() * 0.6) * T, wy = (y + 0.3 + R() * 0.5) * T, p = null;
      if (Math.hypot(wx - home.x, wy - home.y) < 130) continue;
      if (t3 >= 2) {
        if (roll < 0.15 && vnoise(x / 7, y / 7, s + 20) > 0.62) { var tn = TREES[Math.floor(R() * TREES.length) % TREES.length]; p = { name: tn, s: (tn === 'pine' ? 0.54 : 0.49) + R() * 0.1, r: 11 }; w.stats.trees++; }
        else if (roll > 0.955) p = { name: ['bush', 'tallGrass', 'berryBush', 'wildHerbs', 'flower'][Math.floor(R() * 5)], s: 0.9, r: 0 };
        else if (roll > 0.948) { p = { name: R() < 0.6 ? 'rock' : 'rockFormation', s: 0.9, r: 10 }; w.stats.rocks++; }
        else if (roll > 0.9475) p = { name: ['runestone', 'cairn', 'fallenTree', 'birdNest'][Math.floor(R() * 4)], s: 1, r: 10 };
      } else if (roll < 0.008) { p = { name: 'rock', s: 0.7 + R() * 0.35, r: 9 }; w.stats.rocks++; }
      if (!p || !kit.PROPS[p.name]) continue;
      p.x = wx; p.y = wy; p.v = Math.floor(R() * 3);
      p.kind = KIND[p.name] || null; if (p.kind) { p.max = p.hp = HP[p.name] * (0.7 + 0.6 * p.s); p.leanDir = R() < 0.5 ? -1 : 1; }
      w.addProp(p);
    }
    return w.stats;
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
    var mc = cv.getContext('2d'), img = mc.createImageData(mw, mh), COL = [[33, 96, 122], [232, 204, 140], [96, 168, 84], [78, 146, 76], [140, 106, 72]];
    for (var yy = 0; yy < mh; yy++) for (var xx = 0; xx < mw; xx++) { var cc = COL[grid[yy * step * GW + xx * step]], ip = (yy * mw + xx) * 4; img.data[ip] = cc[0]; img.data[ip + 1] = cc[1]; img.data[ip + 2] = cc[2]; img.data[ip + 3] = 255; }
    mc.putImageData(img, 0, 0);
    return cv;
  };
  return w;
}
var GRASS = { density: 0.4, spacing: 19, height: 6, sway: 0.5, speed: 1, shimmer: 0.6, shade: 0.8, flowers: 0.05,
  patches: 1, patchSize: 70, patchLight: '#c8e07a', patchDark: '#4a8a3a', earth: 0.3, earthCol: '#b08a56', earthLight: '#d2b078', earthEdge: '#7a9a40', drifts: 0.55,
  dark: '#3f8a3c', mid: '#6cb84a', light: '#a6d85c', glow: '#f4ffb0', bloom: ['#ffffff', '#ffe36b', '#ff9fc2', '#ff8a4a'] };   // the default living-grass look (the Grass Editor tunes it)
return { make: make, DEF: DEF, GRASS: GRASS, KIND: KIND, HP: HP, CAMP: CAMP, hash: hash, vnoise: vnoise, fbm: fbm, T: T, TS: TS, K: K, CT: CT };
})();
if (typeof module !== 'undefined') module.exports = World;
