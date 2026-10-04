var Walk = (function () {
'use strict';
var SL = StyleLab, kit = SL.kit, TW = kit.TW, TH = kit.TH;
var MW = 64, MH = 48, CT = 16, VW = 480, VH = 300, KY = 0.75, FACT_COLS = 16;
var clamp = kit.clamp, lerp = kit.lerp;
var STYLE = { factoryHue: 238, outsideHue: 152, accentHue: 42, shadowHue: 250, sat: 1.1, bright: -1, contrast: 1.12, shade: 0.55, round: 0.85, spindly: 0.12, lush: 0.95, twist: 0.12, sparkle: 0.8, texture: 0.6, outlineW: 1.1, outlineDark: 0.86, rough: 0.08, light: 0.5, fog: 0.3, glow: 0.9, vignette: 0.4, look: 1, seed: 7, scaleRef: 0 };

var world = null, tileCv = {}, chunks = [], sprites = {}, props = [], lightsList = [], hero = null, cam = { x: 0, y: 0 }, parts = [];
var keys = {}, time = 0, showGrid = false, showSheet = false, ambient = 0.4, ready = false;
var scratch = null, hbuf = null, lastDt = 0.016;
var ATK = { wu: 0.06, ac: 0.1, rc: 0.15, arc: 2.4, blade: 26, reach: 34 };
var FOLIAGE = { bush: 'leaf', berryBush: 'leaf', fern: 'leaf', reeds: 'leaf', flower: 'petal', bellFlower: 'glow', mushrooms: 'spore' };

/* ---------------- noise ---------------- */
function hash(x, y, s) { var h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y, s) { var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s) { return vnoise(x, y, s) * 0.6 + vnoise(x * 2.1, y * 2.1, s + 9) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 17) * 0.1; }
function distSeg(px, py, ax, ay, bx, by) { var dx = bx - ax, dy = by - ay, t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1); return Math.hypot(px - (ax + dx * t), py - (ay + dy * t)); }

/* ---------------- world generation ---------------- */
function genWorld(seed) {
  var grid = [], solid = [], x, y, i;
  var ponds = [{ x: 30, y: 34, r: 6.5 }, { x: 50, y: 9, r: 3.6 }, { x: 24, y: 41, r: 3 }];
  var pathPts = [[15, 9.5], [22, 9.5], [28, 12], [34, 14.5], [40, 19.5], [46, 24], [50, 17], [52, 9]];
  var branch = [[34, 14.5], [31, 22], [29, 28]];
  for (y = 0; y < MH; y++) {
    grid[y] = []; solid[y] = [];
    for (x = 0; x < MW; x++) {
      var t = 'grass';
      if (x < FACT_COLS) {
        if (y >= 5 && y <= 17) {
          t = 'plate';
          if (y === 9 && x >= 2 && x <= 10) t = 'grate';
          else if (hash(x, y, 5) < 0.06) t = 'puddle';
        } else t = 'voidT';
      } else {
        var m = fbm(x / 9, y / 9, 3), f = fbm(x / 7 + 30, y / 7, 5), d = fbm(x / 5, y / 5 + 50, 7);
        if (f > 0.56) t = 'grassDark';
        if (f > 0.63 && hash(x, y, 1) < 0.45) t = 'leaves';
        if (m > 0.66 && f > 0.4) t = 'moss';
        if (d > 0.7 && f < 0.56) t = 'dirt';
        for (i = 0; i < ponds.length; i++) {
          var p = ponds[i], dd = Math.hypot(x - p.x, y - p.y), thr = p.r * (0.75 + 0.5 * vnoise(x * 0.7, y * 0.7, 11 + i));
          if (dd < thr) t = 'water'; else if (dd < thr + 1.15 && t !== 'water') t = 'shore';
        }
        var onPath = false;
        for (i = 0; i < pathPts.length - 1; i++) if (distSeg(x + 0.5, y + 0.5, pathPts[i][0], pathPts[i][1], pathPts[i + 1][0], pathPts[i + 1][1]) < 0.8) onPath = true;
        for (i = 0; i < branch.length - 1; i++) if (distSeg(x + 0.5, y + 0.5, branch[i][0], branch[i][1], branch[i + 1][0], branch[i + 1][1]) < 0.65) onPath = true;
        if (Math.hypot(x + 0.5 - 46, y + 0.5 - 24) < 3.6) onPath = true;
        if (onPath && t !== 'water') t = 'path';
        if (x <= 17 && y >= 8 && y <= 11) t = 'path';
        if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) t = 'grassDark';
      }
      grid[y][x] = t; solid[y][x] = (t === 'water' || t === 'voidT') ? 1 : 0;
    }
  }
  // factory walls: east wall with a gate, south wall
  for (y = 5; y <= 17; y++) { if (!(y >= 8 && y <= 11)) { grid[y][15] = 'voidT'; solid[y][15] = 1; } }
  for (x = 0; x <= 15; x++) { grid[18][x] = 'voidT'; solid[18][x] = 1; grid[4][x] = 'voidT'; solid[4][x] = 1; }
  return { grid: grid, solid: solid };
}
function variantOf(x, y, type) {
  var r = hash(x, y, 41);
  if (type === 'plate') return r < 0.42 ? 0 : r < 0.68 ? 1 : r < 0.9 ? 2 : 3;
  return Math.floor(r * kit.TILES[type].n) % kit.TILES[type].n;
}

/* ---------------- props ---------------- */
function addProp(name, px, py, r, o) {
  o = o || {};
  props.push({ name: name, seed: o.seed != null ? o.seed : 1, x: px, y: py, r: r || 0, r2: o.r2 || null, alpha: 1, under: !!o.under, fixedSx: o.fixedSx });
}
function genProps(seed) {
  var R = kit.rng(seed * 31 + 7), x, y, i, g = world.grid;
  props.length = 0;
  // Factory
  addProp('backWall', 0, 0, 0, { under: true, seed: 3, fixedSx: 0 });
  [[48, 200], [48, 420], [48, 580], [440, 210], [300, 190]].forEach(function (p, k) { addProp('pillar', p[0], p[1], 12, { seed: 11 + k }); });
  addProp('shelf', 210, 186, 15, { seed: 5 }); addProp('furnace', 386, 190, 24, { seed: 6 }); addProp('valve', 100, 186, 10, { seed: 7 });
  addProp('vat', 150, 340, 22, { seed: 8 }); addProp('workbench', 252, 430, 20, { seed: 9, r2: [-18, 18] }); addProp('conveyor', 392, 490, 14, { seed: 10, r2: [-34, 34] });
  addProp('console', 318, 548, 15, { seed: 12 }); addProp('cable', 172, 540, 6, { seed: 13 }); addProp('scrap', 92, 566, 14, { seed: 14 });
  addProp('crate', 440, 400, 12, { seed: 15 }); addProp('crate', 462, 418, 12, { seed: 16 }); addProp('barrel', 430, 330, 8, { seed: 17 }); addProp('barrel', 448, 342, 8, { seed: 18 });
  addProp('lamp', 92, 450, 4, { seed: 19 }); addProp('lamp', 330, 400, 4, { seed: 20 });
  for (y = 5; y <= 17; y++) if (!(y >= 8 && y <= 11)) addProp('wallBlock', 15 * 32 + 16, (y + 1) * 32, 0, { seed: 20 + y });
  for (x = 0; x <= 15; x++) addProp('wallBlock', x * 32 + 16, 19 * 32, 0, { seed: 40 + x });
  addProp('pillar', 15 * 32 + 16, 8 * 32, 12, { seed: 61 }); addProp('pillar', 15 * 32 + 16, 12 * 32, 12, { seed: 62 });
  // Outside
  var treeKinds = ['oak', 'pine', 'pineBig', 'birch', 'cypress', 'oak', 'blossom', 'birch', 'pine', 'willow', 'cypress'];
  for (y = 3; y < MH - 3; y += 3) for (x = 18; x < MW - 3; x += 3) {
    var jx = x + (R() - 0.5) * 2.4, jy = y + (R() - 0.5) * 2.4, tx = Math.floor(jx), ty = Math.floor(jy), t = g[ty][tx];
    var f = fbm(jx / 7 + 30, jy / 7, 5);
    if (t === 'path' || t === 'water' || t === 'shore') continue;
    if (Math.hypot(jx - 16, jy - 9.5) < 5) continue;
    if (f > 0.56) {
      var kind = treeKinds[Math.floor(R() * treeKinds.length)];
      if (kind === 'willow') { var nearW = false; for (var wy = -3; wy <= 3; wy++) for (var wx = -3; wx <= 3; wx++) { var gg = g[clamp(ty + wy, 0, MH - 1)][clamp(tx + wx, 0, MW - 1)]; if (gg === 'water') nearW = true; } if (!nearW) kind = 'oak'; }
      addProp(kind, jx * 32, jy * 32 + 16, kind === 'pineBig' ? 10 : (kind === 'birch' || kind === 'cypress' ? 6 : 9), { seed: Math.floor(R() * 2) });
    } else if (R() < 0.35) {
      addProp(R() < 0.5 ? 'bush' : 'berryBush', jx * 32, jy * 32, 8, { seed: Math.floor(R() * 2) });
    }
  }
  // border pines
  for (i = 0; i < MW; i += 2) { addProp('pineBig', i * 32 + 16, 1.4 * 32, 10, { seed: i % 2 }); addProp('pineBig', i * 32 + 16, (MH - 0.6) * 32, 10, { seed: (i + 1) % 2 }); }
  for (i = 2; i < MH; i += 2) { addProp('pineBig', (MW - 0.6) * 32, i * 32, 10, { seed: i % 2 }); if (i > 19 || i < 4) addProp('pineBig', 17.2 * 32, i * 32 + 8, 10, { seed: (i + 1) % 2 }); }
  // landmarks
  addProp('signpost', 20.5 * 32, 10.4 * 32, 4, { seed: 1 });
  addProp('ancient', 46 * 32, 19.2 * 32, 22, { seed: 0 });
  [[22, 8.2], [30, 11.2], [37, 17], [43, 21], [50, 27], [46, 28.6], [42, 24]].forEach(function (p, k) { addProp('lamp', p[0] * 32, p[1] * 32, 4, { seed: 30 + k }); });
  addProp('stump', 33 * 32, 30.2 * 32, 7, { seed: 3 }); addProp('log', 26 * 32, 38.5 * 32, 12, { seed: 4, r2: [-16, 16] });
  for (i = 0; i < 5; i++) addProp('fence', (44 + i * 3.2) * 32, 29.4 * 32, 0, { seed: 50 + i });
  // scatter: flowers, ferns, mushrooms, bells, rocks, reeds
  for (y = 2; y < MH - 2; y++) for (x = 16; x < MW - 2; x++) {
    var t2 = g[y][x], r = R(), px = (x + R()) * 32, py = (y + R()) * 32;
    if (t2 === 'grass') { if (r < 0.05) addProp('flower', px, py, 0, { seed: Math.floor(R() * 4) }); else if (r < 0.065) addProp('fern', px, py, 0, { seed: Math.floor(R() * 3) }); else if (r < 0.072) addProp('rock', px, py, 8, { seed: Math.floor(R() * 3) }); else if (r < 0.078) addProp('bellFlower', px, py, 0, { seed: Math.floor(R() * 3) }); }
    else if (t2 === 'grassDark' || t2 === 'leaves') { if (r < 0.04) addProp('fern', px, py, 0, { seed: Math.floor(R() * 3) }); else if (r < 0.052) addProp('mushrooms', px, py, 0, { seed: Math.floor(R() * 3) }); else if (r < 0.06) addProp('bellFlower', px, py, 0, { seed: Math.floor(R() * 3) }); else if (r < 0.065) addProp('rock', px, py, 8, { seed: Math.floor(R() * 3) }); }
    else if (t2 === 'moss') { if (r < 0.06) addProp('mushrooms', px, py, 0, { seed: Math.floor(R() * 3) }); else if (r < 0.1) addProp('fern', px, py, 0, { seed: Math.floor(R() * 3) }); }
    else if (t2 === 'shore') { if (r < 0.2) addProp('reeds', px, py, 0, { seed: Math.floor(R() * 3) }); }
  }
  // drop props that sit on solid tiles or on the gate corridor, then collect lights
  props = props.filter(function (p) {
    if (p.name === 'wallBlock' || p.name === 'backWall' || p.name === 'pillar' || p.fixedSx != null) return true;
    var tx = Math.floor(p.x / 32), ty = Math.floor(p.y / 32);
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return false;
    if (world.solid[ty][tx]) return false;
    if (p.x > 14.2 * 32 && p.x < 18.5 * 32 && p.y > 7 * 32 && p.y < 13 * 32) return false;
    if (p.r > 0 && g[ty][tx] === 'path') return false;
    return true;
  });
  props.sort(function (a, b) { return a.y - b.y; });
}
function getSprite(name, seed) {
  var k = name + ':' + seed;
  if (!sprites[k]) sprites[k] = kit.bakeProp(name, 3 + seed * 7);
  return sprites[k];
}

/* ---------------- chunks ---------------- */
var SIDES = [['n', 0, -1], ['s', 0, 1], ['w', -1, 0], ['e', 1, 0]];
function isOutside(t) { return t !== 'plate' && t !== 'grate' && t !== 'puddle' && t !== 'voidT'; }
function bakeChunk(cx, cy) {
  var w = CT * TW, h = CT * TH, cv = kit.mk(w * 2, h * 2), c = cv.getContext('2d'), g = world.grid, x, y, i;
  c.setTransform(2, 0, 0, 2, 0, 0);
  for (y = 0; y < CT; y++) for (x = 0; x < CT; x++) {
    var gx = cx * CT + x, gy = cy * CT + y; if (gx >= MW || gy >= MH) continue;
    var t = g[gy][gx], v = variantOf(gx, gy, t);
    c.save(); c.translate(x * TW, y * TH); c.drawImage(tileCv[t][v], 0, 0, TW, TH); c.restore();
  }
  for (y = 0; y < CT; y++) for (x = 0; x < CT; x++) {
    var gx2 = cx * CT + x, gy2 = cy * CT + y; if (gx2 >= MW || gy2 >= MH) continue;
    var t2 = g[gy2][gx2];
    if (!isOutside(t2)) continue;
    for (i = 0; i < 4; i++) {
      var nx = gx2 + SIDES[i][1], ny = gy2 + SIDES[i][2]; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      var nt = g[ny][nx];
      if (nt === t2 || !isOutside(nt) || kit.TILES[nt].pr <= kit.TILES[t2].pr) continue;
      c.save(); c.translate(x * TW, y * TH); kit.blendTile(c, tileCv[nt][variantOf(nx, ny, nt)], SIDES[i][0], gx2 * 131 + gy2 * 17 + i); c.restore();
    }
  }
  // Factory floor: large panels with seams and rivets, so the floor reads as one surface
  for (y = 0; y < CT; y++) for (x = 0; x < CT; x++) {
    var fx = cx * CT + x, fy = cy * CT + y; if (fx >= MW || fy >= MH) continue;
    var ft = g[fy][fx]; if (ft !== 'plate' && ft !== 'grate' && ft !== 'puddle') continue;
    var lx = x * TW, ly = y * TH;
    if (fx % 2 === 0 && fx > 0 && hash(fx / 2, Math.floor(fy / 2), 91) > 0.15 && (g[fy][fx - 1] === 'plate' || g[fy][fx - 1] === 'grate' || g[fy][fx - 1] === 'puddle')) { c.fillStyle = 'rgba(8,6,20,0.5)'; c.fillRect(lx - 0.5, ly, 1.1, TH); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(lx + 0.6, ly, 0.9, TH); }
    if (fy % 2 === 0 && hash(Math.floor(fx / 2), fy / 2, 92) > 0.15 && fy > 5) { c.fillStyle = 'rgba(8,6,20,0.5)'; c.fillRect(lx, ly - 0.5, TW, 1.1); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(lx, ly + 0.6, TW, 0.9); }
    if (fx % 2 === 0 && fy % 2 === 0) {
      [[3, 3], [TW * 2 - 3, 3], [3, TH * 2 - 3], [TW * 2 - 3, TH * 2 - 3]].forEach(function (rp) { c.fillStyle = 'rgba(8,6,20,0.55)'; c.beginPath(); c.arc(lx + rp[0], ly + rp[1], 1.2, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.arc(lx + rp[0] - 0.4, ly + rp[1] - 0.4, 0.5, 0, 7); c.fill(); });
    }
  }
  // soft light and dark patches across chunk borders so tiling never shows
  var cell = 96, x0 = cx * w, y0 = cy * h, bx, by;
  for (by = Math.floor((y0 - cell) / cell); by * cell < y0 + h + cell; by++) for (bx = Math.floor((x0 - cell) / cell); bx * cell < x0 + w + cell; bx++) {
    var hv = hash(bx, by, 77), px = (bx + hash(bx, by, 78)) * cell - x0, py = (by + hash(bx, by, 79)) * cell - y0, r = 40 + hv * 50;
    var gt = (bx * cell < FACT_COLS * TW) ? 'f' : 'o';
    var g2 = c.createRadialGradient(px, py, 0, px, py, r), col = hv < 0.5 ? (gt === 'f' ? '255,255,255' : '255,245,200') : '10,8,30';
    g2.addColorStop(0, 'rgba(' + col + ',' + (hv < 0.5 ? 0.08 : 0.16) + ')'); g2.addColorStop(1, 'rgba(' + col + ',0)');
    c.fillStyle = g2; c.fillRect(px - r, py - r, r * 2, r * 2);
  }
  return { cv: cv, x: cx * w, y: cy * h, w: w, h: h, cx: cx, cy: cy };
}

/* ---------------- loading ---------------- */
var jobs = [], jobTotal = 0;
function planJobs() {
  jobs = [];
  var T = kit.TILES, n;
  Object.keys(T).forEach(function (t) { for (var v = 0; v < T[t].n; v++) jobs.push(['tile', t, v]); });
  var seen = {};
  props.forEach(function (p) { var k = p.name + ':' + p.seed; if (!seen[k]) { seen[k] = 1; jobs.push(['prop', p.name, p.seed]); } });
  for (var cy = 0; cy < MH / CT; cy++) for (var cx = 0; cx < MW / CT; cx++) jobs.push(['chunk', cx, cy]);
  jobTotal = jobs.length;
}
function runJob(j) {
  if (j[0] === 'tile') { if (!tileCv[j[1]]) tileCv[j[1]] = []; tileCv[j[1]][j[2]] = kit.bakeTile(j[1], j[2]); }
  else if (j[0] === 'prop') getSprite(j[1], j[2]);
  else chunks.push(bakeChunk(j[1], j[2]));
}
function step(n) { var k = 0; while (jobs.length && k < n) { runJob(jobs.shift()); k++; } if (!jobs.length) finishLoad(); return 1 - jobs.length / jobTotal; }
function finishLoad() {
  if (ready) return; ready = true;
  props.forEach(function (p) { var s = getSprite(p.name, p.seed); if (s.lights.length) s.lights.forEach(function (l) { lightsList.push({ x: p.x + (p.fixedSx != null ? 0 : l.x), y: p.y * KY + l.y, r: l.r, h: l.h, s: l.s, l: l.l, a: l.a }); }); });
}

/* ---------------- hero ---------------- */
function newHero() {
  return { x: 160, y: 400, vx: 0, vy: 0, face: Math.PI / 2, faceVis: Math.PI / 2, moving: false, sprint: false,
    anim: { run: 0, phase: 0, amt: 0, t: 0, lx: 0, ly: 0, bob: 0, lvx: 0, lvy: 0, blink: 0, blinkT: 2, blinkP: 0, sq: 0, sqv: 0 }, dustT: 0,
    atk: { ph: 'none', t: 0, dir: 0, sign: -1, queued: false, tr: null } };
}
function solidAt(px, py) {
  var tx = Math.floor(px / 32), ty = Math.floor(py / 32);
  if (tx < 1 || ty < 1 || tx >= MW - 1 || ty >= MH - 1) return true;
  return !!world.solid[ty][tx];
}
function blockedAt(px, py) {
  var r = 6;
  if (solidAt(px, py) || solidAt(px - r, py) || solidAt(px + r, py) || solidAt(px, py - 3) || solidAt(px, py + 3)) return true;
  for (var i = 0; i < props.length; i++) {
    var p = props[i]; if (!p.r) continue;
    if (Math.abs(p.x - px) > 70 || Math.abs(p.y - py) > 70) continue;
    if (Math.hypot(p.x - px, (p.y - py) * 1.3) < p.r + r * 0.7) return true;
    if (p.r2) { var d1 = Math.hypot(p.x + p.r2[0] - px, (p.y - py) * 1.3), d2 = Math.hypot(p.x + p.r2[1] - px, (p.y - py) * 1.3); if (d1 < p.r + r * 0.7 || d2 < p.r + r * 0.7) return true; }
  }
  return false;
}
function turnToward(a, b, step) { var d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; if (Math.abs(d) <= step) return b; return a + (d > 0 ? step : -step); }
function updateHero(dt) {
  var h = hero, an = h.anim;
  var ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), iy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  var il = Math.hypot(ix, iy); if (il > 0) { ix /= il; iy /= il; }
  h.moving = il > 0; h.sprint = !!(keys.ShiftLeft || keys.ShiftRight || keys.Sprint) && il > 0;
  var spd = h.sprint ? 183 : 118, k = Math.min(1, dt * 15);
  if (h.atk.ph === 'windup' || h.atk.ph === 'active') spd *= 0.45; else if (h.atk.ph === 'recover') spd *= 0.75;
  h.vx += (ix * spd - h.vx) * k; h.vy += (iy * spd - h.vy) * k;
  var nx = h.x + h.vx * dt, ny = h.y + h.vy * dt;
  if (!blockedAt(nx, h.y)) h.x = nx; else h.vx = 0;
  if (!blockedAt(h.x, ny)) h.y = ny; else h.vy = 0;
  if (il > 0 && h.atk.ph === 'none') h.face = turnToward(h.face, Math.atan2(iy, ix), dt * 30);
  h.faceVis = turnToward(h.faceVis, h.face, dt * 42);
  // animation (same springs as the combat test)
  var sp = Math.min(200, Math.hypot(h.vx, h.vy * KY)), target = Math.min(1, sp / 105);
  an.amt += (target - an.amt) * Math.min(1, dt * (target > an.amt ? 14 : 9));
  if (an.amt > 0.04) an.phase += Math.max(sp, 30) * dt * 0.115 * GameArt.lib.hero().spec.walkRate;
  an.t += dt; an.run += ((h.sprint ? 1 : 0) - an.run) * Math.min(1, dt * 8);
  an.bob = -Math.abs(Math.sin(an.phase)) * 1.0 * an.amt * (1 + 0.45 * an.run) + Math.sin(an.t * 2.2) * (1 - an.amt) * 0.4;
  var tx2 = (h.vx / 118) * 1.1, ty2 = (h.vy * KY / 118) * 0.8;
  an.lvx += ((tx2 - an.lx) * 220 - an.lvx * 27) * dt; an.lx += an.lvx * dt; an.lvy += ((ty2 - an.ly) * 220 - an.lvy * 27) * dt; an.ly += an.lvy * dt;
  an.blinkT -= dt; if (an.blinkT <= 0) { an.blinkT = 2.4 + Math.random() * 3.2; an.blinkP = 0.14; } an.blinkP -= dt; an.blink = an.blinkP > 0 ? Math.sin(Math.PI * (1 - an.blinkP / 0.14)) : 0;
  an.sqv += ((0 - an.sq) * 260 - an.sqv * 20) * dt; an.sq += an.sqv * dt;
  updateAtk(dt);
  // dust
  h.dustT -= dt;
  if (sp > 60 && h.dustT <= 0) { h.dustT = h.sprint ? 0.07 : 0.14; var t = world.grid[Math.floor(h.y / 32)][Math.floor(h.x / 32)]; parts.push({ x: h.x + (Math.random() - 0.5) * 6, y: h.y, life: 0.4, max: 0.4, r: 2 + Math.random() * 2, c: (t === 'plate' || t === 'grate' || t === 'puddle') ? '190,190,215' : (t === 'path' || t === 'dirt' || t === 'shore') ? '200,180,140' : '150,200,140' }); }
}

/* ---------------- attack ---------------- */
function atkAngle(u) { var a = hero.atk, half = ATK.arc / 2; return a.dir - half * a.sign + ATK.arc * a.sign * u; }
// The swing is drawn at its true angle in every direction (it used to be narrowed when facing up or down,
// which made it look like a stab).
function visAngle(ang, dir) { return ang; }
function beginAttack() {
  var a = hero.atk, h = hero;
  a.ph = 'windup'; a.t = 0; a.dir = h.face; a.sign = -a.sign; a.queued = false; a.tr = null; h.faceVis = h.face;
  h.vx += Math.cos(h.face) * 55; h.vy += Math.sin(h.face) * 55;
}
function attack() {
  if (!ready) return;
  var a = hero.atk;
  if (a.ph === 'none') beginAttack(); else if (!(a.ph === 'recover' && a.t < 0.04)) a.queued = true; else a.queued = true;
}
function doHit() {
  var a = hero.atk, i, n;
  props.forEach(function (p) {
    var kind = FOLIAGE[p.name]; if (!kind) return;
    var dx = p.x - hero.x, dy = p.y - hero.y, d = Math.hypot(dx, dy);
    if (d > ATK.reach + 8) return;
    var da = Math.abs(((Math.atan2(dy, dx) - a.dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (d > 12 && da > 1.35) return;
    p.shake = 0.38;
    var cols = kind === 'leaf' ? ['#4fbf68', '#2f9a5a', '#8be08a'] : kind === 'petal' ? ['#ff8fb0', '#ffb347', '#ffe08a'] : kind === 'glow' ? ['#ffd96a', '#fff2a8'] : ['#f6e9c8', '#ffd2a0'];
    for (n = 0; n < 4; n++) parts.push({ t: 'leaf', x: p.x + (Math.random() - 0.5) * 14, y: p.y, z: 6 + Math.random() * 14, vx: (Math.cos(a.dir) * 40 + (Math.random() - 0.5) * 60), vy: (Math.random() - 0.5) * 30, vz: 40 + Math.random() * 60, rot: Math.random() * 6, life: 0.9, max: 0.9, c: cols[n % cols.length], glow: kind === 'glow' });
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
  var a = hero.atk, o = {}, half = ATK.arc / 2, sign = a.sign, u;
  var pb = 0.45;
  if (a.ph === 'windup') u = -pb * (a.t / ATK.wu); else if (a.ph === 'active') u = Math.min(1, a.t / ATK.ac); else u = 1;
  var ang = visAngle(a.dir - half * sign + ATK.arc * sign * u, dir);
  var upv = Math.max(0, -Math.sin(ang)), sdn = Math.cos(a.dir) >= 0 ? 1 : -1;
  o.len = ATK.blade;
  if (dir === 'up' || dir === 'down') {
    // a wide side-to-side swing: the hand sweeps across in front of the body, or over the head when facing away
    var startAng = a.dir - half * sign, armSide = Math.cos(startAng) >= 0 ? 1 : -1;
    o.hx = armSide * 2.5 + Math.cos(ang) * 8; o.hy = -14 + Math.sin(ang) * 8 * KY - 4 * upv; o.armSide = armSide; o.lift = upv;
  } else { o.hx = Math.cos(ang) * 9 + sdn * 10 * upv * upv; o.hy = -13 + Math.sin(ang) * 9 * KY - 5 * upv; }
  o.ca = Math.cos(ang); o.sa = Math.sin(ang) * (KY + (1 - KY) * (o.lift || 0));
  if (o.tilt) { var nn = Math.hypot(o.ca, o.sa); o.ca /= nn; o.sa /= nn; }
  o.front = Math.sin(ang) >= -0.05; o.side = sdn;
  return o;
}
function bodyPose() {
  var a = hero.atk, an = hero.anim, lean = 0;
  if (a.ph === 'windup') lean = -2 * (a.t / ATK.wu); else if (a.ph === 'active') lean = 3; else if (a.ph === 'recover') lean = 3 * (1 - a.t / ATK.rc);
  return { lx: an.lx + Math.cos(hero.face) * lean, ly: an.ly + an.bob + Math.sin(hero.face) * lean * KY };
}
function heroPose(dir) {
  var a = hero.atk, bp = bodyPose(), drawn = a.ph !== 'none', pose = { lx: bp.lx, ly: bp.ly, sheath: !drawn };
  if (drawn) {
    var sp = swordPose(dir), hand = [sp.hx + bp.lx, sp.hy + bp.ly];
    if (dir === 'left' || dir === 'right') pose.near = hand; else pose[(sp.armSide || sp.side) < 0 ? 'armL' : 'armR'] = hand;
  }
  return pose;
}
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

function heroDir() {
  var vx = Math.cos(hero.faceVis), vy = Math.sin(hero.faceVis) * KY;
  if (Math.abs(vx) > Math.abs(vy)) return vx > 0 ? 'right' : 'left';
  return vy > 0 ? 'down' : 'up';
}

/* ---------------- rendering ---------------- */
function drawShadow(c, x, y, rx, ry, a) {
  c.save(); c.translate(x, y); c.scale(1, ry / rx); var g = c.createRadialGradient(0, 0, 0, 0, 0, rx * 1.2);
  g.addColorStop(0, 'rgba(6,4,18,' + (a * 1.5) + ')'); g.addColorStop(0.6, 'rgba(6,4,18,' + (a * 0.8) + ')'); g.addColorStop(1, 'rgba(6,4,18,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx * 1.2, 0, 7); c.fill(); c.restore();
}
function update(dt) {
  dt = Math.min(dt, 0.05); time += dt;
  if (!ready) return;
  updateHero(dt);
  var tx = hero.x - VW / 2, ty = hero.y * KY - 118 - VH / 2 + 118;
  tx = clamp(tx, 0, MW * TW - VW); ty = clamp(hero.y * KY - VH / 2, 0, MH * TH - VH);
  cam.x += (tx - cam.x) * Math.min(1, dt * 8); cam.y += (ty - cam.y) * Math.min(1, dt * 8);
  var amb = clamp((hero.x - 14 * 32) / (5 * 32), 0, 1); amb = amb * amb * (3 - 2 * amb);
  ambient = lerp(0.36, 0.66, amb);
  lastDt = dt;
  for (var i = parts.length - 1; i >= 0; i--) {
    var q = parts[i]; q.life -= dt;
    if (q.t === 'leaf') { q.vz -= 200 * dt; q.z = Math.max(0, q.z + q.vz * dt); q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.97; q.rot += dt * 6; if (q.z === 0) q.life -= dt * 2; }
    if (q.life <= 0) parts.splice(i, 1);
  }
  props.forEach(function (p) { if (p.shake > 0) p.shake = Math.max(0, p.shake - dt); });
}
function render(ctx) {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.fillStyle = '#0c0a14'; ctx.fillRect(0, 0, VW, VH);
  if (!ready) return;
  var camX = Math.round(cam.x * 2) / 2, camY = Math.round(cam.y * 2) / 2, i;
  chunks.forEach(function (ch) { if (ch.x + ch.w < camX || ch.x > camX + VW || ch.y + ch.h < camY || ch.y > camY + VH) return; ctx.drawImage(ch.cv, ch.x - camX, ch.y - camY, ch.w, ch.h); });
  // water shimmer
  var tx0 = Math.floor(camX / TW), tx1 = Math.ceil((camX + VW) / TW), ty0 = Math.floor(camY / TH), ty1 = Math.ceil((camY + VH) / TH);
  for (var y = Math.max(0, ty0); y < Math.min(MH, ty1); y++) for (var x = Math.max(0, tx0); x < Math.min(MW, tx1); x++) if (world.grid[y][x] === 'water') kit.shimmer(ctx, x * TW - camX, y * TH - camY, time, x * 31 + y * 7);
  if (showGrid) { ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.5; ctx.beginPath(); for (var gx = tx0; gx <= tx1; gx++) { ctx.moveTo(gx * TW - camX, 0); ctx.lineTo(gx * TW - camX, VH); } for (var gy = ty0; gy <= ty1; gy++) { ctx.moveTo(0, gy * TH - camY); ctx.lineTo(VW, gy * TH - camY); } ctx.stroke(); }
  // entities sorted by ground y
  var ents = [], hsx = hero.x - camX, hsy = hero.y * KY - camY;
  props.forEach(function (p) {
    var s = getSprite(p.name, p.seed), sx = (p.fixedSx != null ? 0 : p.x) - camX, sy = (p.fixedSx != null ? 0 : p.y * KY) - camY;
    if (sx + s.l + s.w < -10 || sx + s.l > VW + 10 || sy + s.t + s.h < -10 || sy + s.t > VH + 10) return;
    ents.push({ y: p.under ? -1e6 : p.y, kind: 'p', p: p, s: s, sx: sx, sy: sy });
  });
  ents.push({ y: hero.y, kind: 'h' });
  parts.forEach(function (q) { ents.push({ y: q.y - 1, kind: 'd', q: q }); });
  ents.sort(function (a, b) { return a.y - b.y; });
  ents.forEach(function (e) {
    if (e.kind === 'p') {
      var s = e.s, p = e.p, tall = s.h > 90 && !p.under;
      var behind = tall && hero.y < p.y && hsx > e.sx + s.l && hsx < e.sx + s.l + s.w && hsy > e.sy + s.t && hsy < e.sy + s.t + s.h * 0.85;
      p.alpha += ((behind ? 0.45 : 1) - p.alpha) * 0.2;
      if (!p.under && p.r) drawShadow(ctx, e.sx + 3, e.sy + 1, Math.max(8, p.r * 1.2), Math.max(3, p.r * 0.45), 0.3);
      ctx.globalAlpha = p.alpha;
      if (p.shake > 0) { ctx.save(); ctx.translate(e.sx, e.sy); ctx.transform(1, 0, Math.sin(time * 55) * p.shake * 0.4, 1, 0, 0); ctx.drawImage(s.cv, s.l, s.t, s.w, s.h); ctx.restore(); }
      else ctx.drawImage(s.cv, e.sx + s.l, e.sy + s.t, s.w, s.h);
      ctx.globalAlpha = 1;
    } else if (e.kind === 'd' && e.q.t === 'leaf') {
      var lq = e.q, la = clamp(lq.life / lq.max * 1.6, 0, 1);
      ctx.save(); ctx.translate(lq.x - camX, lq.y * KY - lq.z - camY); ctx.rotate(lq.rot); ctx.globalAlpha = la; ctx.fillStyle = lq.c; ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.4, 0, 0, 7); ctx.fill();
      if (lq.glow) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,220,120,0.5)'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill(); }
      ctx.restore();
    } else if (e.kind === 'd') {
      var q = e.q, a = q.life / q.max; ctx.fillStyle = 'rgba(' + q.c + ',' + (0.35 * a) + ')'; ctx.beginPath(); ctx.arc(q.x - camX, q.y * KY - camY, q.r * (1.6 - a * 0.6), 0, 7); ctx.fill();
    } else {
      drawShadow(ctx, hsx, hsy, 10, 3.4, 0.34);
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      var hd = heroDir(), hsc = GameArt.lib.hero().spec.scale;
      ctx.translate(hsx, hsy); ctx.scale(hsc, hsc); ctx.translate(-hsx, -hsy);
      drawWeapon(ctx, hsx, hsy, false);
      GameArt.lib.playerD(ctx, hsx, hsy, hd, hero.anim, heroPose(hd));
      drawWeapon(ctx, hsx, hsy, true);
      ctx.restore();
    }
  });
  // lighting
  if (!scratch) scratch = kit.mk(VW * 2, VH * 2);
  var d = scratch.getContext('2d'), dark = clamp(1 - ambient, 0, 1) * 0.72;
  d.setTransform(2, 0, 0, 2, 0, 0); d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, VW, VH);
  d.fillStyle = 'hsla(250,55%,14%,' + dark + ')'; d.fillRect(0, 0, VW, VH);
  d.globalCompositeOperation = 'destination-out';
  var vis = [];
  lightsList.forEach(function (l) { var lx = l.x - camX, ly = l.y - camY; if (lx < -l.r || lx > VW + l.r || ly < -l.r || ly > VH + l.r) return; vis.push([lx, ly, l]); });
  vis.push([hsx, hsy - 16, { r: 70, a: 0.75, h: 42, s: 80, l: 70 }]);
  vis.forEach(function (v) { var l = v[2], g = d.createRadialGradient(v[0], v[1], l.r * 0.05, v[0], v[1], l.r); g.addColorStop(0, 'rgba(0,0,0,' + clamp(0.95 * l.a, 0, 1) + ')'); g.addColorStop(0.5, 'rgba(0,0,0,' + clamp(0.55 * l.a, 0, 1) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = g; d.beginPath(); d.arc(v[0], v[1], l.r, 0, 7); d.fill(); });
  d.globalCompositeOperation = 'source-over';
  ctx.drawImage(scratch, 0, 0, VW, VH);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  vis.forEach(function (v) { var l = v[2]; if (l === vis[vis.length - 1][2]) return; var g = ctx.createRadialGradient(v[0], v[1], 0, v[0], v[1], l.r * 0.7); g.addColorStop(0, 'hsla(' + l.h.toFixed(0) + ',' + l.s + '%,' + l.l + '%,' + (0.3 * 0.9 * l.a) + ')'); g.addColorStop(1, 'hsla(' + l.h.toFixed(0) + ',' + l.s + '%,' + l.l + '%,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(v[0], v[1], l.r * 0.7, 0, 7); ctx.fill(); });
  ctx.restore();
  // soft vignette
  var vg = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VW * 0.62); vg.addColorStop(0, 'rgba(10,8,30,0)'); vg.addColorStop(1, 'rgba(10,8,30,0.4)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
  if (showSheet) drawSheet(ctx);
}
function drawSheet(c) {
  var T = kit.TILES, names = Object.keys(T), r;
  c.fillStyle = 'rgba(10,8,24,0.92)'; c.fillRect(0, 0, VW, VH);
  c.font = '600 8px system-ui, sans-serif'; c.textAlign = 'left';
  names.forEach(function (n, i) {
    var col = i % 2, row = Math.floor(i / 2), ox = 8 + col * 236, oy = 6 + row * 48;
    c.fillStyle = '#e8e6ff'; c.fillText(n + ' (' + T[n].n + ')', ox, oy + 8);
    for (var v = 0; v < T[n].n; v++) c.drawImage(tileCv[n][v], ox + v * 35, oy + 12, TW, TH);
  });
}

/* ---------------- public ---------------- */
function init() {
  kit.setup(STYLE);
  world = genWorld(STYLE.seed); genProps(STYLE.seed);
  hero = newHero(); chunks = []; sprites = {}; tileCv = {}; lightsList = []; ready = false;
  planJobs();
  cam.x = 0; cam.y = clamp(hero.y * KY - VH / 2, 0, MH * TH - VH);
}
function key(code, down) { keys[code] = down; if (down && (code === 'KeyJ' || code === 'Attack')) attack(); if (down && code === 'KeyG') showGrid = !showGrid; if (down && code === 'KeyT') showSheet = !showSheet; }
return { init: init, attack: attack, step: step, update: update, render: render, key: key, state: function () { return { hero: hero, world: world, props: props, ready: ready, cam: cam, jobs: jobs.length, total: jobTotal }; }, toggle: function (what) { if (what === 'grid') showGrid = !showGrid; else showSheet = !showSheet; }, teleport: function (x, y) { hero.x = x; hero.y = y; cam.x = clamp(hero.x - VW / 2, 0, MW * TW - VW); cam.y = clamp(hero.y * KY - VH / 2, 0, MH * TH - VH); }, setSheet: function (b) { showSheet = b; } };
})();
if (typeof module !== 'undefined') module.exports = Walk;
