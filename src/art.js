var GameArt = (function () {
'use strict';
var W = 320, H = 200;

function mk(w, h) {
  if (typeof document !== 'undefined') { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  return global.__mk(w, h);
}
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var hexCache = {};
function hex(c) {
  if (!hexCache[c]) hexCache[c] = [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)];
  return hexCache[c];
}

/* ---------- shared world ---------- */
var wall = { x0: 34, w: 96, base: 88 };
var lamp = { x: 176, base: 104 };
var tree = { x: 240, base: 118 };
var state = { x: 150, y: 150, dir: 'down', moving: false, t: 0, night: false, moss: 0.55, treeAlpha: 1 };


var R0 = rng(7);
var tufts = [], flowers = [], patches = [], stones = [];
(function () {
  var i;
  for (i = 0; i < 50; i++) tufts.push({ x: R0() * W, y: 24 + R0() * 172, v: R0() < 0.5 ? 0 : 1 });
  for (i = 0; i < 16; i++) flowers.push({ x: 8 + R0() * 304, y: 36 + R0() * 156, c: (R0() * 3) | 0 });
  for (i = 0; i < 16; i++) patches.push({ x: R0() * W, y: 30 + R0() * 170, rx: 14 + R0() * 22, ry: 7 + R0() * 10, l: R0() < 0.5 });
  for (var sx = -4; sx < W + 12; sx += 13) {
    for (var row = -1; row <= 1; row++) {
      var cx = sx + (row === 0 ? 6 : 0) + (R0() * 4 - 2);
      var cy = pathY(cx) + row * 9 + (R0() * 2 - 1);
      stones.push({ x: cx, y: cy, rx: 5.5 + R0() * 2, ry: 3.6 + R0() * 1.2, v: (R0() * 3) | 0 });
    }
  }
})();
function pathY(x) { return 160 + 7 * Math.sin(x / 38); }

/* =====================================================
   STYLE A - chunky pixel art
   ===================================================== */
function Spr(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
Spr.prototype.set = function (x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; };
Spr.prototype.get = function (x, y) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; return this.d[y * this.w + x]; };
Spr.prototype.rect = function (x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.set(x + i, y + j, c); };
Spr.prototype.ell = function (cx, cy, rx, ry, c) {
  for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      var a = (x + 0.5 - cx) / rx, b = (y + 0.5 - cy) / ry;
      if (a * a + b * b <= 1) this.set(x, y, c);
    }
};
Spr.prototype.outline = function (c) {
  var o = this.d.slice(), w = this.w, h = this.h;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    if (o[y * w + x] !== null) continue;
    var n = (x > 0 && o[y * w + x - 1] !== null) || (x < w - 1 && o[y * w + x + 1] !== null) ||
            (y > 0 && o[(y - 1) * w + x] !== null) || (y < h - 1 && o[(y + 1) * w + x] !== null);
    if (n) this.d[y * w + x] = c;
  }
  return this;
};
Spr.prototype.flip = function () {
  var s = new Spr(this.w, this.h);
  for (var y = 0; y < this.h; y++) for (var x = 0; x < this.w; x++) s.d[y * this.w + (this.w - 1 - x)] = this.d[y * this.w + x];
  return s;
};
Spr.prototype.canvas = function () {
  var cv = mk(this.w, this.h), cx = cv.getContext('2d'), id = cx.createImageData(this.w, this.h);
  for (var i = 0; i < this.d.length; i++) {
    var c = this.d[i];
    if (c) { var rgb = hex(c); id.data[i * 4] = rgb[0]; id.data[i * 4 + 1] = rgb[1]; id.data[i * 4 + 2] = rgb[2]; id.data[i * 4 + 3] = 255; }
  }
  cx.putImageData(id, 0, 0);
  return cv;
};

var PA = {
  line: '#2b1d2e', grass1: '#79c24d', grass2: '#6bb243', grass3: '#93d45e', tuft: '#4a9a36', tuftL: '#9bd96a',
  path1: '#c9b48e', path2: '#b19a72', path3: '#e0d0ab', pathLine: '#7d6a4a',
  brass: '#e0a93a', brassD: '#a8741f', brassL: '#f6d878', iron: '#7b7790', ironD: '#55516a', ironL: '#9c98b4', rust: '#b8643a',
  moss: '#62b43f', mossD: '#3d8a33', mossL: '#a2e460',
  leaf1: '#58bd4a', leaf2: '#3a9a43', leaf3: '#8be05f', trunk: '#8f603c', trunkD: '#6d4529',
  stone: '#8b7a68', stoneL: '#a6957f', stoneD: '#6b5b4d'
};
var CP = {
  skin: '#ffd8b0', skinD: '#eeb48a', hair: '#b4602d', hairD: '#8f4a22', hairL: '#e08a4d',
  coat: '#4fa8a4', coatD: '#3b8a87', vest: '#7a5236', pants: '#55466b', pantsD: '#41345a', boot: '#4a3329',
  eye: '#2a1c2a', blush: '#ff9aa2', mouth: '#a04a3a', lens: '#a9e6ff', strap: '#6b4a35'
};


var sprA = null, mossA = [];

var pcacheA = {};

/* ---------- sprite-sheet characters (four directions, four-frame walk and attack) ----------
   Each entry in SPRITES has a default spec (plain numbers and colours) and a build function
   that turns a spec into one 48 x 48 frame with the feet at (24, 46).
   pose: 'idle', 'walk' or 'atk'; f: frame 0..3.
   In 'atk' frames the sword arm is left out (armSide -1 / 1 picks which one in the
   front and back views) so the caller can draw the arm and blade at any angle.
   The Sprite test page edits the spec live; setSprite() swaps it in. */
var SPR_W = 48, SPR_H = 48, SPR_OX = 24, SPR_OY = 46;
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function toHsl(c) {
  var q = hex(c), r = q[0] / 255, g = q[1] / 255, b = q[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2, d = mx - mn;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, s, l];
}
function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp01(s); l = clamp01(l);
  var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r, g, b;
  if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; } else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; } else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
  function h2(v) { v = Math.round((v + m) * 255).toString(16); return v.length < 2 ? '0' + v : v; }
  return '#' + h2(r) + h2(g) + h2(b);
}
function shade(c, d) { var q = toHsl(c); return fromHsl(q[0], q[1], q[2] + d); }

var HERO_DEF = {
  scale: 1, headW: 7.5, headH: 6.5, bodyW: 10, bodyH: 9, legH: 8, legW: 3, armL: 7, armW: 2, eyewear: 0, eyewearSize: 2, eyeH: 2, blush: 1, outline: 1,
  walkRate: 1, bob: 1, stride: 3, armSwing: 1, lunge: 1, atkStyle: 1, atkPower: 1, bladeLen: 0.9, slashSize: 1.1, slashWidth: 0.2,
  hue: 0, sat: 1, lum: 1,
  col: { skin: '#f6cfa6', hair: '#8a4a22', coat: '#2f7f80', vest: '#5c4033', pants: '#27324a', boot: '#1c1a26', trim: '#d9a534',
    lens: '#7fe3f2', eye: '#2a1a22', line: '#1b1626', blade: '#5fd4f2', slash: '#8fefff' }
};
function spritePalette(sp) {
  function t(k) { var q = toHsl(sp.col[k]); return fromHsl(q[0] + sp.hue, q[1] * sp.sat, q[2] * sp.lum); }
  var C = { skin: t('skin'), hair: t('hair'), coat: t('coat'), vest: t('vest'), pants: t('pants'), boot: t('boot'), belt: t('trim'),
    lens: t('lens'), eye: t('eye'), line: sp.col.line, blade: t('blade'), slash: t('slash') };
  C.skinD = shade(C.skin, -0.12); C.hairD = shade(C.hair, -0.09); C.hairL = shade(C.hair, 0.1); C.strap = shade(C.hair, -0.17);
  C.coatD = shade(C.coat, -0.08); C.coatL = shade(C.coat, 0.08); C.pantsD = shade(C.pants, -0.06);
  C.beltL = shade(C.belt, 0.18); C.rim = shade(C.belt, -0.06); C.lensL = shade(C.lens, 0.2);
  C.bladeL = shade(C.blade, 0.3); C.slashL = shade(C.slash, 0.2); C.slashD = shade(C.slash, -0.2);
  var sk = toHsl(C.skin); C.blush = fromHsl(8, Math.min(1, sk[1] + 0.1), sk[2] - 0.08); C.mouth = fromHsl(12, 0.45, Math.max(0.2, sk[2] - 0.38));
  return C;
}
function buildHeroP(sp, C, dir, pose, f, armSide) {
  var s = new Spr(SPR_W, SPR_H), cx = SPR_OX, B = SPR_OY, x, y;
  var walk = pose === 'walk', atk = pose === 'atk';
  var rx = sp.headW, ry = sp.headH, bodyW = Math.round(sp.bodyW), bodyH = Math.round(sp.bodyH), legH = Math.round(sp.legH), legW = Math.round(sp.legW);
  var armL = Math.round(sp.armL), armW = Math.round(sp.armW), ew = Math.round(sp.eyewear), g = Math.round(sp.eyewearSize), eyeH = Math.round(sp.eyeH);
  var bob = walk ? ((f === 1 || f === 3) ? Math.round(sp.bob) : 0) : (atk && (f === 0 || f === 2) ? -1 : 0);
  var legTop = B - 2 - legH, bodyTop = legTop + 1 - bodyH - bob, hy = Math.round(legTop + 1 - bodyH - ry + 0.5) - bob;
  var gy = hy - Math.round(ry * 0.8), eyeX = Math.round(rx * 0.47), mouthY = hy + Math.min(eyeH + 2, Math.round(ry - 2));
  function headPx(hx, cb) {
    for (y = Math.floor(hy - ry); y <= Math.ceil(hy + ry); y++) for (x = Math.floor(hx - rx); x <= Math.ceil(hx + rx); x++) {
      var dx = x + 0.5 - hx, dy = y + 0.5 - hy;
      if ((dx / rx) * (dx / rx) + (dy / ry) * (dy / ry) <= 1) cb(x, y, dx, dy);
    }
  }
  // eyewear: 0 none, 1 goggles pushed up, 2 goggles worn, 3 round glasses, 4 square glasses, 5 shades, 6 monocle
  var ecy = hy + 1 + eyeH / 2, erow = Math.round(ecy - 0.5);
  function goggle(gx, gyy, r) { if (r < 1) return; s.ell(gx, gyy, r, r, C.rim); if (r >= 2) { s.ell(gx, gyy, r - 1, r - 1, C.lens); s.set(gx - 1, Math.round(gyy - 1), C.lensL); } }
  function ring(gx, gyy, r, col) {
    for (var yy = Math.floor(gyy - r); yy <= Math.ceil(gyy + r); yy++) for (var xx = Math.floor(gx - r); xx <= Math.ceil(gx + r); xx++) {
      var dd = Math.hypot(xx + 0.5 - gx, yy + 0.5 - gyy); if (dd <= r && dd > r - 1) s.set(xx, yy, col);
    }
  }
  function box(gx, gyy, r, col) {
    var x0 = gx - r, x1 = gx + r - 1, y0 = Math.round(gyy - r), y1 = Math.round(gyy + r) - 1;
    for (var yy = y0; yy <= y1; yy++) for (var xx = x0; xx <= x1; xx++) if (xx === x0 || xx === x1 || yy === y0 || yy === y1) s.set(xx, yy, col);
  }
  function band(xa, xb, row, col) { for (var xx = xa; xx <= xb; xx++) if (s.get(xx, row) !== null) s.set(xx, row, col); }
  function hairCol(dx, dy) { return (dx * 0.5 + dy * 0.6 > ry * 0.43) ? C.hairD : C.hair; }

  if (dir === 'left') {
    var S = Math.round(sp.stride), st = walk ? (f === 0 ? S : (f === 2 ? -S : 0)) : (atk && f === 2 ? S : 0);
    var sx = atk ? (f === 1 ? 1 : (f === 2 ? -Math.round(sp.lunge) : 0)) : 0, hx = cx - 1 + sx;
    var liftB = st > 0 ? 1 : 0, liftF = st < 0 ? 1 : 0, bw = Math.max(4, bodyW - 2), bx0 = cx - Math.floor(bw / 2) + sx;
    s.rect(cx - 1 + st, legTop, legW, legH - liftB, C.pantsD); s.rect(cx - 2 + st, B - 2 - liftB, legW + 1, 2, C.boot);
    s.rect(cx - 2 - st, legTop, legW, legH - liftF, C.pants); s.rect(cx - 3 - st, B - 2 - liftF, legW + 1, 2, C.boot);
    s.rect(bx0, bodyTop, bw, bodyH, C.coat); s.rect(bx0 + bw - 2, bodyTop, 2, bodyH, C.coatD);
    s.rect(bx0, bodyTop + bodyH - 2, bw, 1, C.belt); s.rect(bx0, bodyTop + bodyH - 1, bw, 1, C.coatD);
    if (!atk) { var ax = cx - 1 + (walk ? Math.round(st * sp.armSwing / Math.max(1, S)) * 1 : 0); s.rect(ax, bodyTop + 1, armW, armL, C.coatL); s.rect(ax, bodyTop + 1 + armL, armW, 2, C.skin); }
    headPx(hx, function (px, py, dx, dy) {
      var fringe = -ry * 0.27 + ((px % 3 === 0) ? 1 : 0);
      if (dy <= fringe || dx >= 0.5 || (dx >= -2 && dy <= 1)) s.set(px, py, hairCol(dx, dy));
      else s.set(px, py, dy > ry - 2.5 ? C.skinD : C.skin);
    });
    for (x = hx - 3; x <= hx - 1; x++) s.set(x, hy - Math.round(ry * 0.67), C.hairL);
    var sy = hy - Math.round(ry * 0.53);
    if (ew === 1) {
      for (x = hx + 1; x <= hx + Math.ceil(rx); x++) { var qs = s.get(x, sy); if (qs === C.hair || qs === C.hairD) s.set(x, sy, C.strap); }
      goggle(hx + Math.round(rx * 0.24), gy, g - 1); goggle(hx - eyeX, gy, g);
    }
    s.rect(hx - Math.round(rx * 0.6), hy + 1, 2, eyeH, C.eye); s.set(hx - Math.round(rx * 0.6), hy + 1, '#ffffff');
    if (sp.blush) s.rect(hx - Math.round(rx * 0.82), hy + 1 + eyeH, 2, 1, C.blush);
    s.set(hx - Math.round(rx * 0.7), mouthY, C.mouth);
    var exS = hx - Math.round(rx * 0.6) + 1;
    if (ew === 2) { band(exS, hx + Math.ceil(rx), erow, C.strap); goggle(exS, ecy, g); }
    if (ew === 3) { band(exS, hx + 2, erow, C.rim); ring(exS, ecy, g + 0.5, C.rim); }
    if (ew === 4) { band(exS, hx + 2, erow, C.line); box(exS, ecy, g, C.line); }
    if (ew === 5) { band(exS, hx + 2, hy + 1, C.line); s.rect(exS - 2, hy + 1, 4, Math.max(2, g), C.line); s.set(exS - 1, hy + 1, C.lens); }
    if (ew === 6) ring(exS, ecy, g + 0.5, C.rim);
    if (ew === 1 || ew === 2) { s.ell(hx + 2, hy + 2, 2, 2, C.rim); s.set(hx + 1, hy + 1, C.beltL); }
  } else {
    var back = dir === 'up', bx = cx - Math.floor(bodyW / 2);
    var lf = sp.stride > 0 ? 1 : 0, lL = walk && f === 0 ? lf : 0, lR = walk && f === 2 ? lf : 0, spd = atk && f === 2 ? 1 : 0;
    var lxL = bx + 1, lxR = bx + bodyW - 1 - legW;
    s.rect(lxL - spd, legTop, legW, legH - lL, C.pants); s.rect(lxL - spd, B - 2 - lL, legW, 2, C.boot);
    s.rect(lxR + spd, legTop, legW, legH - lR, C.pants); s.rect(lxR + spd, B - 2 - lR, legW, 2, C.boot);
    if (lxR > lxL + legW) s.rect(lxL + legW, legTop, lxR - lxL - legW, Math.min(2, legH), C.pantsD);
    s.rect(bx, bodyTop, bodyW, bodyH, C.coat); s.rect(bx + bodyW - 2, bodyTop, 2, bodyH, C.coatD);
    if (!back) {
      var vw = Math.max(2, Math.round(bodyW * 0.4)); vw += (bodyW - vw) % 2;
      s.rect(cx - vw / 2, bodyTop, vw, Math.max(1, bodyH - 2), C.vest);
      for (y = bodyTop + 2; y < bodyTop + bodyH - 2; y += 2) s.set(cx - 1, y, C.belt);
    }
    s.rect(bx, bodyTop + bodyH - 2, bodyW, 1, C.belt); if (!back) s.rect(cx - 1, bodyTop + bodyH - 2, 2, 1, C.beltL);
    s.rect(bx, bodyTop + bodyH - 1, bodyW, 1, C.coatD);
    var sw = Math.round(sp.armSwing), aL = walk ? (f === 0 ? -sw : (f === 2 ? sw : 0)) : 0, aR = -aL;
    if (!(atk && armSide < 0)) { s.rect(bx - armW, bodyTop + 1 + aL, armW, armL, C.coat); s.rect(bx - armW, bodyTop + 1 + armL + aL, armW, 2, C.skin); }
    if (!(atk && armSide > 0)) { s.rect(bx + bodyW, bodyTop + 1 + aR, armW, armL, C.coatD); s.rect(bx + bodyW, bodyTop + 1 + armL + aR, armW, 2, C.skin); }
    headPx(cx, function (px, py, dx, dy) {
      var fringe = -ry * 0.27 + ((px % 4 === 0) ? 2 : ((px % 3 === 0) ? 1 : 0));
      if (back || dy <= fringe || (Math.abs(dx) >= rx - 2 && dy <= ry * 0.4)) s.set(px, py, hairCol(dx, dy));
      else s.set(px, py, dy > ry - 2 ? C.skinD : C.skin);
    });
    var hlx = cx - Math.round(rx * 0.6);
    for (x = hlx; x <= hlx + 2; x++) s.set(x, hy - Math.round(ry * 0.67), C.hairL);
    var by = hy - Math.round(ry * 0.4);
    if (back && (ew === 1 || ew === 2)) for (x = cx - Math.ceil(rx); x <= cx + Math.ceil(rx); x++) { var qb = s.get(x, by); if (qb === C.hair || qb === C.hairD) s.set(x, by, C.strap); }
    if (ew === 1) { s.rect(cx - 1, gy - 1, 2, 1, C.strap); goggle(cx - eyeX, gy, g); goggle(cx + eyeX, gy, g); }
    if (!back) {
      s.rect(cx - eyeX, hy + 1, 2, eyeH, C.eye); s.rect(cx + eyeX - 2, hy + 1, 2, eyeH, C.eye);
      s.set(cx - eyeX, hy + 1, '#ffffff'); s.set(cx + eyeX - 2, hy + 1, '#ffffff');
      if (sp.blush) { s.rect(cx - eyeX - 2, hy + 1 + eyeH, 2, 1, C.blush); s.rect(cx + eyeX, hy + 1 + eyeH, 2, 1, C.blush); }
      s.set(cx - 1, mouthY, C.mouth); s.set(cx, mouthY, C.mouth);
      var exL = cx - eyeX + 1, exR = cx + eyeX - 1;
      if (ew === 2) { band(cx - Math.ceil(rx), cx + Math.ceil(rx), erow, C.strap); goggle(exL, ecy, g); goggle(exR, ecy, g); }
      if (ew === 3) { band(exL, exR, erow, C.rim); ring(exL, ecy, g + 0.5, C.rim); ring(exR, ecy, g + 0.5, C.rim); }
      if (ew === 4) { band(exL, exR, erow, C.line); box(exL, ecy, g, C.line); box(exR, ecy, g, C.line); }
      if (ew === 5) { s.rect(cx - eyeX - 1, hy + 1, 2 * eyeX + 2, Math.max(2, g), C.line); s.set(cx - eyeX, hy + 1, C.lens); s.set(cx + 1, hy + 1, C.lens); }
      if (ew === 6) { ring(exR, ecy, g + 0.5, C.rim); for (y = Math.round(ecy + g); y <= Math.round(ecy + g) + 3; y++) s.set(exR + g, y, C.rim); }
    }
  }
  return sp.outline ? s.outline(C.line) : s;
}

var SPRITES = { hero: { name: 'Hero', def: HERO_DEF, build: buildHeroP } };
var curSpr = null, pcacheP = {};
function fillSpec(def, spec) {
  var o = {}, k;
  for (k in def) if (k !== 'col') o[k] = (spec && typeof spec[k] === 'number' && isFinite(spec[k])) ? spec[k] : def[k];
  o.col = {};
  for (k in def.col) o.col[k] = (spec && spec.col && /^#[0-9a-fA-F]{6}$/.test(spec.col[k])) ? spec.col[k].toLowerCase() : def.col[k];
  return o;
}
function setSprite(id, spec) {
  var e = SPRITES[id] || SPRITES.hero, sp = fillSpec(e.def, spec);
  curSpr = { id: SPRITES[id] ? id : 'hero', build: e.build, spec: sp, pal: spritePalette(sp) };
  curSpr.m = { ox: SPR_OX, oy: SPR_OY, w: SPR_W, h: SPR_H, shX: Math.round(sp.bodyW) / 2, shY: Math.round(sp.legH) + Math.round(sp.bodyH) - 1 };
  pcacheP = {};
  return sp;
}
function sprite() { if (!curSpr) setSprite('hero'); return curSpr; }
function heroP(dir, pose, f, armSide) {
  var cur = sprite(), as = pose === 'atk' && dir !== 'left' && dir !== 'right' ? (armSide < 0 ? -1 : 1) : 0;
  var k = dir + pose + f + as;
  if (!pcacheP[k]) {
    var s = cur.build(cur.spec, cur.pal, dir === 'right' ? 'left' : dir, pose, f, as);
    pcacheP[k] = (dir === 'right' ? s.flip() : s).canvas();
  }
  return pcacheP[k];
}



var dkA = null, wmA = null;


/* =====================================================
   STYLE B - smooth cartoon
   ===================================================== */
var LN = '#3a2a36';
/* The ink figure (2026-10-07, docs/art-direction.md): a figure is drawn in depth layers (far limbs, the body with its legs and
   head, near limbs). Each layer goes to its own canvas, gets the finish (grain and a cool shadow side over its silhouette) and
   ONE outline round its whole silhouette, drawn by dilation: a tinted copy laid down at a ring of offsets, more and farther on
   the shadow side, so the line is thin toward the light and heavy away from it. Parts inside a layer therefore have no seams
   between them: an arm flows into a shoulder, a leg into the hip. Only real overlaps (a near arm over the coat) keep an edge.
   INK_FIG holds the numbers; the Character and Creature Editors may change them. */
var INK_FIG = { on: true, w: 0.62, line: '#231a16', grain: 0.22, shade: 0.41, soft: 0.5 }, inkCvs = [], grainFig = null;
function mkCv(w, h) { if (typeof document !== 'undefined') { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; } if (global.__mk) return global.__mk(w, h); return require('@napi-rs/canvas').createCanvas(w, h); }   // in Node the scripts set global.__mk, or the fake canvas is found by itself
function figGrain(c) {
  if (!grainFig) { grainFig = mkCv(96, 96); var g = grainFig.getContext('2d'), i, R = 0.37; for (i = 0; i < 1500; i++) { R = (R * 9301 + 49297) % 233280; var x = R / 233280 * 96; R = (R * 9301 + 49297) % 233280; var y = R / 233280 * 96; R = (R * 9301 + 49297) % 233280; var d = R / 233280; g.fillStyle = d < 0.55 ? 'rgba(20,14,10,' + (0.25 + d * 0.5).toFixed(2) + ')' : 'rgba(255,245,225,' + (0.2 + (1 - d) * 0.6).toFixed(2) + ')'; g.fillRect(x, y, 1 + (d < 0.2 ? 1 : 0), 1); } }
  return c.createPattern(grainFig, 'repeat');
}
// begin a layer: a canvas covering the figure rectangle (figure space) under the device transform M
function inkLayerBegin(i, M, bx, by, bw, bh) {
  var xs = [], ys = [], k, cs = [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]];
  for (k = 0; k < 4; k++) { xs.push(M.a * cs[k][0] + M.c * cs[k][1] + M.e); ys.push(M.b * cs[k][0] + M.d * cs[k][1] + M.f); }
  var sc = Math.sqrt(Math.abs(M.a * M.d - M.b * M.c)), pad = Math.ceil(INK_FIG.w * sc * 2.6 + 3), x0 = Math.floor(Math.min.apply(null, xs)) - pad, y0 = Math.floor(Math.min.apply(null, ys)) - pad, w = Math.ceil(Math.max.apply(null, xs)) + pad - x0, h = Math.ceil(Math.max.apply(null, ys)) + pad - y0;
  w = Math.max(4, Math.min(4096, w)); h = Math.max(4, Math.min(4096, h));
  var cv = inkCvs[i]; if (!cv) cv = inkCvs[i] = mkCv(w, h); else if (cv.width < w || cv.height < h) { cv.width = Math.max(cv.width, w); cv.height = Math.max(cv.height, h); }
  var g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.lineCap = 'round'; g.lineJoin = 'round';
  return { g: g, cv: cv, x0: x0, y0: y0, w: w, h: h, sc: sc, used: false };
}
// finish a layer and lay it on the target: the grain and the shadow side over its silhouette, the outline by dilation, then itself
function inkLayerEnd(cOut, L, i, lineCol, opts) {
  if (!L || !L.used) return; var g = L.g, w = L.w, h = L.h, k;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop';
  if (opts.grain > 0) { g.globalAlpha = opts.grain; g.fillStyle = figGrain(g); g.fillRect(0, 0, w, h); }
  if (opts.shade > 0) { var gs = g.createLinearGradient(w * 0.15, 0, w * 0.85, h); gs.addColorStop(0, 'rgba(255,240,200,' + (opts.shade * 0.3) + ')'); gs.addColorStop(0.45, 'rgba(0,0,0,0)'); gs.addColorStop(1, 'rgba(40,52,80,' + opts.shade + ')'); g.globalAlpha = 1; g.fillStyle = gs; g.fillRect(0, 0, w, h); }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  var tcv = inkCvs[i + 8]; if (!tcv) tcv = inkCvs[i + 8] = mkCv(L.cv.width, L.cv.height); else if (tcv.width < L.cv.width || tcv.height < L.cv.height) { tcv.width = L.cv.width; tcv.height = L.cv.height; }
  var t = tcv.getContext('2d'); t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, tcv.width, tcv.height); t.drawImage(L.cv, 0, 0); t.globalCompositeOperation = 'source-in'; t.fillStyle = lineCol; t.fillRect(0, 0, w, h); t.globalCompositeOperation = 'source-over';
  cOut.save(); cOut.setTransform(1, 0, 0, 1, 0, 0);
  var r = Math.max(0.8, opts.w * L.sc);
  for (k = 0; k < 12; k++) { var a = k / 12 * 6.283; cOut.drawImage(tcv, 0, 0, w, h, L.x0 + Math.cos(a) * r, L.y0 + Math.sin(a) * r, w, h); }                 // the thin line all round
  cOut.globalAlpha = 0.6; for (k = 0; k < 7; k++) { var a2 = -0.15 + k / 6 * 1.85; cOut.drawImage(tcv, 0, 0, w, h, L.x0 + Math.cos(a2) * r * 2.1, L.y0 + Math.sin(a2) * r * 2.1, w, h); } cOut.globalAlpha = 1;   // heavy toward the lower right, away from the light
  cOut.drawImage(L.cv, 0, 0, w, h, L.x0, L.y0, w, h);
  cOut.restore();
}
// switch drawing into layer i, keeping the device transform the drawing is at; returns the layer's context
function inkSwitch(c, layers, cur, i) {
  var M = c.getTransform(), L = layers[i], ex = M.e + (cur ? cur.x0 : 0), fy = M.f + (cur ? cur.y0 : 0);
  L.g.setTransform(M.a, M.b, M.c, M.d, ex - L.x0, fy - L.y0); L.used = true; return L;
}
function pathRR(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}
function fs(c, fill, lw, stroke) {
  c.fillStyle = fill; c.fill();
  if (lw !== 0) { c.lineWidth = lw || 2; c.strokeStyle = stroke || LN; c.lineJoin = 'round'; c.stroke(); }
}
function rr(c, x, y, w, h, r, fill, lw, stroke) { pathRR(c, x, y, w, h, r); fs(c, fill, lw, stroke); }
function ell(c, x, y, rx, ry, fill, lw, stroke) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); fs(c, fill, lw, stroke); }



var mossB = [];
(function () {
  var r = rng(21), wx = wall.x0, b = wall.base, x, q, m;
  for (x = wx + 3; x < wx + wall.w - 1; x += 3.6) {
    if (r() < 0.3) continue;
    var n = 0.5 + 0.5 * Math.sin(x * 0.31) * Math.cos(x * 0.11);
    var len = 4 + n * 13 * (0.45 + r() * 0.8);
    mossB.push({ k: 'drip', x: x, y: b - 47, len: len, thr: Math.min(0.95, (len / 18) * 0.6 + r() * 0.3) });
  }
  for (x = wx + 2; x < wx + wall.w; x += 5) mossB.push({ k: 'blob', x: x + r() * 3, y: b - 1.5 - r() * 2, r: 3 + r() * 3.6, thr: r() * 0.75 });
  for (q = 0; q < 7; q++) {
    var cx = wx + 8 + r() * 80, cy = b - 34 + r() * 22, th = 0.2 + r() * 0.7;
    for (m = 0; m < 5; m++) mossB.push({ k: 'blob', x: cx + (r() - 0.5) * 12, y: cy + (r() - 0.5) * 8, r: 2 + r() * 3, thr: th + m * 0.03 });
  }
})();



var canopyB = null;



/* ---------- animated hero (smooth walk cycle, lean, squash, follow-through) ----------
   Drawn from the current hero spec (setHero). Proportions are factors on the original figure,
   so a spec of all ones is the original hero. The Sprite test page edits the spec live.
   sway and stance only affect walking toward or away from the camera: sway is the side-to-side rock of the
   body (1 is the original, which read as a waddle), stance is how far apart the feet land. */
// Styles (2026-10-06, for the people of this world): hair 0 bowl, 1 cropped, 2 long, 3 braids, 4 knot, 5 bald, 6 shaved sides
// with a tail, 7 wavy (with volume), 8 a mane (volume and long); beard 0 none, 1 full, 2 short, 3 long and braided, 4 moustache; hat 0 none, 1 hood, 2 leather cap, 3 nasal
// helmet, 4 fur hat, 5 headband; clothes 0 the coat and vest, 1 belted tunic, 2 tunic and cloak, 3 apron dress, 4 fur vest.
// matte 0..1 dulls the highlights, softens the colours and browns the outline toward the world's, like the trees.
// The hero is Eirik on the ink figure (figure 1, inkHero) since 2026-10-07; HEROD_OLD is the rounded trial figure before it,
// kept for comparison (the "Old figure" concept).
var HEROD_DEF = {                                  // Robin's pick (2026-10-07): cropped hair, no beard, a belted tunic, matte, thin arms
  scale: 0.8, headW: 1, headH: 1, bodyW: 1, bodyH: 1, legL: 1, legW: 1, armL: 1, armW: 0.7, eyewear: 0, eyewearSize: 1, eyeSize: 1, blush: 0.4, beard: 0,
  hair: 1, hat: 0, clothes: 1, matte: 1, ring: 0, figure: 1,
  walkRate: 1.4, bob: 1, stride: 1, armSwing: 1, sway: 0.25, stance: 0.8, lean: 1, atkStyle: 0, atkPower: 1, bladeLen: 1, slashSize: 1, slashWidth: 0.66,
  hue: 0, sat: 1, lum: 1,
  col: { skin: '#f0c49c', hair: '#a86a3a', coat: '#8a7a5c', vest: '#6a4a32', pants: '#4f4336', boot: '#4a3329', trim: '#5a3a26',
    cloak: '#8a3a34', dress: '#5b6b8a', fur: '#b89a74', iron: '#9aa0aa',
    lens: '#a9e6ff', eye: '#2a1c2a', line: '#231a16', blade: '#eef3fb', slash: '#ffffff' }
};
var HEROD_OLD = { scale: 0.78, headW: 0.55, headH: 0.55, bodyW: 0.84, bodyH: 1.15, legL: 2.2, legW: 0.82, armL: 1.4, armW: 0.78, eyeSize: 0.85, blush: 0.5, beard: 0, hair: 0, hat: 0, clothes: 0, figure: 0,
  col: { skin: '#ebc9a2', hair: '#a85a2a', coat: '#4f7a74', vest: '#6a4a32', pants: '#56505e', cloak: '#7a3b3b' } };
var LEG_LEN = 7.3, curHero = null;
function heroPalette(sp) {
  var m = Math.max(0, Math.min(1, sp.matte || 0));
  function t(k) { var q = toHsl(sp.col[k]); return fromHsl(q[0] + sp.hue, q[1] * sp.sat * (1 - 0.22 * m), q[2] * sp.lum); }
  var C = { skin: t('skin'), hair: t('hair'), coat: t('coat'), vest: t('vest'), pants: t('pants'), boot: t('boot'), trim: t('trim'),
    cloak: t('cloak'), dress: t('dress'), fur: t('fur'), iron: t('iron'),
    lens: t('lens'), eye: t('eye'), line: m ? mixHex(sp.col.line, '#4a3f33', m) : sp.col.line, blade: t('blade'), slash: t('slash'), matte: m };
  var hl = 1 - 0.65 * m;                                       // matte: smaller highlights, softer shades
  C.skinD = shade(C.skin, -0.08 * (1 - 0.3 * m)); C.hairD = shade(C.hair, -0.09); C.hairL = shade(C.hair, 0.14 * hl); C.strap = shade(C.hair, -0.13);
  C.coatD = shade(C.coat, -0.07); C.pantsD = shade(C.pants, -0.07); C.rim = shade(C.trim, -0.15); C.trimL = shade(C.trim, 0.17 * hl);
  C.cloakD = shade(C.cloak, -0.08); C.dressD = shade(C.dress, -0.08); C.furD = shade(C.fur, -0.12); C.ironD = shade(C.iron, -0.12);
  return C;
}
function setHero(spec) {
  var sp = fillSpec(HEROD_DEF, spec);
  curHero = { spec: sp, pal: heroPalette(sp), lift: liftOf(sp) };
  return sp;
}
function hero() { if (!curHero) setHero(); return curHero; }
// Other people are the same figure with their own spec. makeFigure(spec) gets one ready; figureD draws it like
// playerD (feet at x, y), at its own scale.
function liftOf(sp) { return sp.figure >= 1 ? inkMetrics(sp).lift : (sp.legL - 1) * LEG_LEN; }
function makeFigure(spec) { var sp = fillSpec(HEROD_DEF, spec); return { spec: sp, pal: heroPalette(sp), lift: liftOf(sp) }; }
function figureD(c, x, y, dir, an, pose, F) {
  var keep = curHero; curHero = F;
  c.save(); c.translate(x, y); c.scale(F.spec.scale, F.spec.scale);
  try { playerD(c, 0, 0, dir, an, pose); } finally { c.restore(); curHero = keep; }
}
// People of the world, as changes on top of the hero's spec.
var FOLK = {
  dwarf: { name: 'Brokk', set: { scale: 0.8, headW: 1.15, headH: 1.05, bodyW: 1.3, bodyH: 0.85, legL: 0.55, legW: 1.35, armL: 0.95, armW: 1.3, eyeSize: 0.9, blush: 1, beard: 1, hair: 2, clothes: 1, hat: 0, walkRate: 1.7, stance: 1, ring: 1 },
    col: { skin: '#f0c49c', hair: '#c8743a', coat: '#7d4a3a', vest: '#4f3b2c', pants: '#4a4038', boot: '#3a2a22', trim: '#b9b2a6' } }
};
// Concepts for the people of this world (2026-10-06): whole looks, each a set of spec changes and colours on the hero's
// figure, matte like the world's trees. The Character Editor offers them as templates; later the game will draw its
// random people from them.
var CONCEPTS = [
  { name: 'Karl', note: 'A free farmer: undyed wool tunic, cropped hair, a short beard.', set: { clothes: 1, hair: 1, beard: 2, hat: 0, matte: 1 }, col: { coat: '#8a7a5c', pants: '#4f4336', trim: '#5a3a26', hair: '#a86a3a', skin: '#f0c49c', boot: '#4a3329' } },
  { name: 'Shieldmaiden', note: 'Braids, a nasal helmet, a red cloak over a blue tunic.', set: { clothes: 2, hair: 3, beard: 0, hat: 3, matte: 1, bodyW: 0.86 }, col: { coat: '#5b6b8a', cloak: '#7a3b3b', pants: '#4a4038', hair: '#d9a35a', trim: '#c9a04a' } },
  { name: 'Jarl', note: 'Long hair, a braided beard, a gold headband, a red cloak on blue.', set: { clothes: 2, hair: 2, beard: 3, hat: 5, matte: 1, bodyW: 1.02 }, col: { coat: '#3f5a7a', cloak: '#6b2f3a', pants: '#3a3a44', hair: '#5a3a28', trim: '#d9a73a' } },
  { name: 'Thrall', note: 'Bald, a short beard, faded wool; slight of build.', set: { clothes: 1, hair: 5, beard: 2, hat: 0, matte: 1, bodyW: 0.84, bodyH: 0.96 }, col: { coat: '#9a8d78', pants: '#6a5a48', trim: '#4a3a2a', hair: '#6a5a4a', skin: '#e8b88a' } },
  { name: 'Völva', note: 'A seeress: hood and dark cloak, an apron dress over linen.', set: { clothes: 3, hair: 2, beard: 0, hat: 1, matte: 1, bodyW: 0.86 }, col: { coat: '#b9ad94', cloak: '#3a3550', dress: '#4a5a78', pants: '#3a3a44', hair: '#3a2a22', trim: '#a9a9b0' } },
  { name: 'Hunter', note: 'Shaved sides and a tail, a fur hat and fur vest over green.', set: { clothes: 4, hair: 6, beard: 2, hat: 4, matte: 1 }, col: { coat: '#5b6b4a', fur: '#b89a74', pants: '#4a3a2a', hair: '#8a5a3a', trim: '#5a3a26' } },
  { name: 'Húsfreyja', note: 'The lady of the house: hair in a knot, a red apron dress over linen.', set: { clothes: 3, hair: 4, beard: 0, hat: 0, matte: 1, bodyW: 0.88 }, col: { coat: '#d9c9a6', dress: '#8a4a4a', pants: '#5a4a3a', hair: '#c8743a', trim: '#c9a04a' } },
  { name: 'Child', note: 'Small, a big head, a plain tunic.', set: { clothes: 1, hair: 1, beard: 0, hat: 0, matte: 1, scale: 0.55, headW: 1.25, headH: 1.2, legL: 0.8, bodyH: 0.85, eyeSize: 1.2 }, col: { coat: '#9a8a6a', pants: '#5a4a3a', trim: '#5a3a26', hair: '#e8c070' } },
  { name: 'Elder', note: 'Grey long hair and a long beard, a grey cloak, a slower walk.', set: { clothes: 2, hair: 2, beard: 3, hat: 0, matte: 1, bodyH: 0.95, walkRate: 0.9, bob: 0.7 }, col: { coat: '#6a6a5a', cloak: '#5a5a5a', pants: '#4a4a44', hair: '#c8c2b8', trim: '#8a7a5a', skin: '#f0c49c' } },
  { name: 'Old figure', note: 'The rounded trial figure from before the art direction, kept for comparison.', set: HEROD_OLD, col: HEROD_OLD.col }
];
// The new heroes (2026-10-07, Robin: a new hero from scratch, several to pick from): whole designs on the ink figure (figure 1).
var HEROES = [
  { name: 'Eirik', note: 'A young karl of the coast: red hair tied back, a short beard, a grey wool tunic, a red cloak pinned at the shoulder.',
    set: { figure: 1, headW: 1, headH: 1, bodyW: 1, bodyH: 1, legL: 1, legW: 1, armL: 1, armW: 1, eyeSize: 1, blush: 0.4, hair: 6, beard: 2, hat: 0, clothes: 2, matte: 0.6 },
    col: { skin: '#e9c4a0', hair: '#a8522a', coat: '#857a62', vest: '#6a4a32', pants: '#4e4a52', boot: '#3e2c24', trim: '#c99a3a', cloak: '#8a3a34' } },
  { name: 'Ásta', note: 'A shieldmaiden: a long fair braid, a blue-grey tunic, a green cloak and a leather cap.',
    set: { figure: 1, headW: 0.98, headH: 1, bodyW: 0.9, bodyH: 1, legL: 1.02, legW: 0.92, armL: 1, armW: 0.9, eyeSize: 1, blush: 0.6, hair: 3, beard: 0, hat: 2, clothes: 2, matte: 0.6 },
    col: { skin: '#eccfae', hair: '#d8b268', coat: '#5a6b80', vest: '#6a4a32', pants: '#4a4038', boot: '#4a3329', trim: '#b9b2a6', cloak: '#4f6a46' } },
  { name: 'Hallvard', note: 'A weathered hunter: dark hair in a knot, a long braided beard, a fur vest over an ochre tunic, a headband.',
    set: { figure: 1, headW: 1, headH: 1, bodyW: 1.08, bodyH: 1, legL: 0.98, legW: 1.05, armL: 1.02, armW: 1.08, eyeSize: 0.9, blush: 0.2, hair: 4, beard: 3, hat: 5, clothes: 4, matte: 0.6 },
    col: { skin: '#dcb48c', hair: '#3f2c22', coat: '#a88a4e', vest: '#5a4030', pants: '#3f3a36', boot: '#3a2a22', trim: '#8a6a3a', fur: '#b8a07a' } }
];
function heroSpec(name) {
  var a = null, i; for (i = 0; i < HEROES.length; i++) if (HEROES[i].name === name) a = HEROES[i];
  var sp = fillSpec(HEROD_DEF, null), k; if (!a) return sp;
  for (k in a.set) sp[k] = a.set[k]; for (k in a.col) sp.col[k] = a.col[k];
  return sp;
}
function conceptSpec(name) {
  var a = null, i; for (i = 0; i < CONCEPTS.length; i++) if (CONCEPTS[i].name === name) a = CONCEPTS[i];
  var sp = fillSpec(HEROD_DEF, null), k; if (!a) return sp;
  for (k in a.set) if (k !== 'col') sp[k] = a.set[k]; for (k in a.col) sp.col[k] = a.col[k];
  return sp;
}
function folkSpec(key, R) {
  if (key === 'villager') {            // one of the people of a village: the hero's own figure and look (matte, build, outline), with their own hair, beard, clothes and colours, from R
    R = R || Math.random; var base = hero().spec, sp2 = fillSpec(HEROD_DEF, base), k2;
    var hair = ['#b4602d', '#e8c070', '#5a3a28', '#c8743a', '#3a2a22', '#d9a35a', '#8a5a3a'], coat = ['#6b7d8a', '#7d4a3a', '#5b6b4a', '#8a7a5c', '#4f5f7a', '#9a7a5a', '#b9ad94'], pants = ['#4a4038', '#5a4a3a', '#3f4a5a', '#6a5a48'], cloak = ['#7a3b3b', '#3a3550', '#5a5a5a', '#6b4a2e'], dress = ['#8a4a4a', '#4a5a78', '#6b5a3a'];
    function pick(a) { return a[Math.floor(R() * a.length)]; }
    sp2.scale = base.scale * (0.96 + R() * 0.1); sp2.bodyW = base.bodyW * (0.95 + R() * 0.14); sp2.headW = base.headW * (0.95 + R() * 0.1); sp2.walkRate = 1.3;
    sp2.hair = pick([0, 1, 1, 2, 3, 4, 6, 7, 7, 8]); sp2.beard = R() < 0.45 ? pick([1, 2, 2, 3, 4]) : 0; sp2.hat = R() < 0.3 ? pick([1, 2, 4, 5]) : 0; sp2.clothes = pick([1, 1, 2, 3, 4]); sp2.eyewear = 0;
    sp2.col.hair = pick(hair); sp2.col.coat = pick(coat); sp2.col.pants = pick(pants); sp2.col.vest = pick(coat); sp2.col.cloak = pick(cloak); sp2.col.dress = pick(dress); sp2.col.skin = R() < 0.5 ? '#ffd8b0' : '#f0c49c';
    return sp2;
  }
  var a = FOLK[key], sp = fillSpec(HEROD_DEF, null), k;
  for (k in a.set) sp[k] = a.set[k];
  for (k in a.col) sp.col[k] = a.col[k];
  return sp;
}

/* ===== The ink hero (2026-10-07, Robin: a new hero from scratch for the art direction, not the rounded trial figure) =====
   A lean figure about five and a half heads tall (docs/art-direction.md: Egerkrans's line, people lean and long): a skeleton
   of joints with two-bone legs and arms (ik2 bends the knees forward and the elbows back), a belted tunic, a small head with
   a few ink marks for the face, hair and beard as jagged silhouettes, hats and a cloak, in the side view (facing left, flipped
   for right) and the front and back views turned by an.turn. Everything is drawn through the ink layers (far limbs, the body,
   near limbs), so limbs flow into the body and the silhouette gets one ink line. The same spec as playerD: the style keys
   (hair, beard, hat, clothes) mean the same things, the build keys are factors on INK_BASE, and `figure: 1` chooses it.
   The pose contract is playerD's: hand targets in figure space with the lift, pose.lx/ly the lean of the upper body. */
var INK_BASE = { head: 9.2, headW: 7.3, leg: 20.5, foot: 1.8, torso: 14, shoulder: 5.1, hip: 3.8, waist: 3.3, arm: 7.7, hand: 1.7 };
function inkMetrics(sp) {
  var B = INK_BASE, m = {};
  m.headH = B.head * sp.headH; m.headW = B.headW * sp.headW;
  m.leg = B.leg * sp.legL; m.ankle = -B.foot; m.hip = m.ankle - m.leg;
  m.torso = B.torso * sp.bodyH; m.sh = m.hip - m.torso; m.belt = m.sh + m.torso * 0.64;
  m.chin = m.sh - 1.4; m.cy = m.chin - m.headH / 2; m.top = m.chin - m.headH;
  m.shw = B.shoulder * sp.bodyW; m.hipw = B.hip * sp.bodyW; m.waist = B.waist * sp.bodyW;
  m.arm = B.arm * sp.armL; m.hand = B.hand;
  m.thighW = 3.0 * sp.legW; m.shinW = 2.2 * sp.legW; m.uarmW = 2.45 * sp.armW; m.farmW = 1.75 * sp.armW;
  m.thigh = m.leg * 0.52; m.shin = m.leg * 0.49;
  m.lift = -m.sh - 17;                       // the engine puts the shoulders 17 above the feet plus the lift
  return m;
}
// the middle joint of a two-bone limb from (hx,hy) to (ax,ay); bend +1 or -1 picks the side the joint goes to; also the end,
// pulled in when the target is out of reach
function ik2(hx, hy, ax, ay, l1, l2, bend) {
  var dx = ax - hx, dy = ay - hy, d = Math.hypot(dx, dy) || 0.001, dm = Math.min(d, (l1 + l2) * 0.985);
  dx *= dm / d; dy *= dm / d; d = dm;
  var a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  return [hx + dx * a / d - dy / d * h * bend, hy + dy * a / d + dx / d * h * bend, hx + dx, hy + dy];
}
function limbD(c, x0, y0, w0, x1, y1, w1, col) {                     // a tapered segment with round ends
  var dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, an = Math.atan2(ny, nx);
  c.fillStyle = col; c.beginPath();
  c.moveTo(x0 + nx * w0, y0 + ny * w0); c.lineTo(x1 + nx * w1, y1 + ny * w1); c.arc(x1, y1, w1, an, an - Math.PI, true);
  c.lineTo(x0 - nx * w0, y0 - ny * w0); c.arc(x0, y0, w0, an - Math.PI, an - Math.PI * 2, true); c.closePath(); c.fill();
}
function blobD(c, pts, col, sharp) {                                  // a closed shape: rounded through its points, or straight (sharp)
  var n = pts.length, i; c.beginPath();
  if (sharp) { c.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < n; i++) c.lineTo(pts[i][0], pts[i][1]); }
  else {
    c.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
    for (i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
  }
  c.closePath(); if (col) { c.fillStyle = col; c.fill(); }
}
function inkLine(c, pts, col, w, close) { var i; c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); if (close) c.closePath(); c.stroke(); }
function h01(a, b) { var v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); }
// a jagged version of a closed outline: every edge gets a point pushed out and one pulled in, away from the centre (cx, cy)
function jagged(pts, cx, cy, amp, seed) {
  var out = [], n = pts.length, i;
  for (i = 0; i < n; i++) {
    var p = pts[i], q = pts[(i + 1) % n], ex = q[0] - p[0], ey = q[1] - p[1];
    var mx = p[0] + ex * 0.4, my = p[1] + ey * 0.4, ox = mx - cx, oy = my - cy, ol = Math.hypot(ox, oy) || 1;
    out.push(p); out.push([mx + ox / ol * amp * (0.5 + h01(seed, i)), my + oy / ol * amp * (0.5 + h01(seed, i))]);
    var mx2 = p[0] + ex * 0.72, my2 = p[1] + ey * 0.72, ox2 = mx2 - cx, oy2 = my2 - cy, ol2 = Math.hypot(ox2, oy2) || 1;
    out.push([mx2 - ox2 / ol2 * amp * 0.35 * h01(seed, i + 50), my2 - oy2 / ol2 * amp * 0.35 * h01(seed, i + 50)]);
  }
  return out;
}
var RING_COLS = [null, ['#b07a3a', '#6b4420'], ['#c9ced8', '#6f7580'], ['#d6dbe4', '#6f7580'], ['#e2b63a', '#8a6a18'], ['#c8402a', '#6a1e12']];
function inkHero(c, x, y, dir, an, pose) {
  an = an || { phase: 0, amt: 0, t: 0, lx: 0, ly: 0, blink: 0, sq: 0 };
  var H = hero(), sp = H.spec, C = H.pal, M = inkMetrics(sp);
  var cOut = c, layers = null, curL = null, inkOn = INK_FIG.on && typeof c.getTransform === 'function';
  var LNc = 'rgba(35,26,22,' + (inkOn ? Math.min(1, INK_FIG.soft + 0.15) : 0.85) + ')', LNs = 'rgba(35,26,22,' + (inkOn ? INK_FIG.soft * 0.9 : 0.5) + ')', LIT = 'rgba(255,238,200,0.38)';
  function lay(i) { if (!layers) return; curL = inkSwitch(c, layers, curL, i); c = curL.g; }
  var ph = an.phase, amt = an.amt, t = an.t, run = an.run || 0;
  var side = dir === 'left' || dir === 'right', flip = dir === 'right', back = dir === 'up';
  var tq = side ? 0 : Math.max(-1, Math.min(1, (an.turn || 0) + (pose && pose.turn ? (flip ? -pose.turn : pose.turn) : 0)));
  var L = pose ? [pose.lx || 0, pose.ly || 0] : [an.lx || 0, an.ly || 0];
  var lx = (flip ? -L[0] : L[0]), ly = L[1];
  var HS = Math.round(sp.hair || 0), BS = Math.round(sp.beard || 0), HT = Math.round(sp.hat || 0), CL = Math.round(sp.clothes || 0), RG = Math.round(sp.ring || 0);
  var breathe = Math.sin(t * 2.2) * (1 - amt) * 0.35;
  var bob = (Math.abs(Math.sin(ph)) - 0.5) * 1.5 * amt * (1 + 0.4 * run) * sp.bob + breathe * 0.5;   // highest when the legs pass each other
  var sit = an.sit ? 1 : 0, sitDrop = sit * M.leg * 0.42;              // seated: the body drops onto the seat, the thighs go forward, the shins down
  var ux = lx, uy = (pose ? ly : ly + bob) + sitDrop;                  // the upper body's lean and bob (the engine's own bob rides in pose.ly)
  var hipY = M.hip + uy * 0.85, shY = M.sh + uy, beltY = M.belt + uy * 0.95;
  var dress = CL === 3, coatLong = CL === 0, hemY = hipY + (dress ? M.leg - 2.2 : (coatLong ? 10.5 : 6.5));
  var SKIN = C.skin, HAIR = C.hair, TUN = CL === 3 ? C.dress : C.coat, PANTS = C.pants, BOOT = C.boot, TRIM = C.trim, CLOAK = C.cloak, FUR = C.fur, IRON = C.iron;
  var hasCloak = CL === 2 || HT === 1, blink = an.blink > 0.5;
  var seed = Math.round((sp.hue || 0) * 0.1) + HS * 3;
  c.save(); c.translate(x, y); if (flip) c.scale(-1, 1);
  var sqK = an.sq || 0; c.scale(1 + 0.14 * sqK, 1 - 0.14 * sqK);
  if (inkOn) { var M0 = c.getTransform(), li; layers = []; for (li = 0; li < 3; li++) layers.push(inkLayerBegin(li, M0, -38, M.top - 18, 76, -M.top + 24)); lay(1); }
  function hand(h) { return h ? [(flip ? -h[0] : h[0]), h[1]] : null; }
  function ringBand(x0, y0, x1, y1, w) {                             // the arm ring on an upper arm
    var rc = RING_COLS[RG]; if (!rc) return; var dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, bx = x0 + dx * 0.5, by = y0 + dy * 0.5, px = -dy / d, py = dx / d, hw = w + 0.45;
    c.lineCap = 'butt'; c.strokeStyle = rc[1]; c.lineWidth = 2.2; c.beginPath(); c.moveTo(bx - px * hw, by - py * hw); c.lineTo(bx + px * hw, by + py * hw); c.stroke(); c.strokeStyle = rc[0]; c.lineWidth = 1.2; c.stroke(); c.lineCap = 'round';
  }
  function armD(sx, sy, tx, ty, bend, sleeve, ring) {               // an arm from the shoulder to a hand point: the elbow by ik2, the sleeve, the hand
    var k = ik2(sx, sy, tx, ty, M.arm, M.arm, bend), col = sleeve || TUN;
    limbD(c, sx, sy, M.uarmW, k[0], k[1], M.uarmW * 0.82, col); limbD(c, k[0], k[1], M.uarmW * 0.82, k[2], k[3], M.farmW * 0.95, col);
    var cfx = k[2] - (k[2] - k[0]) * 0.16, cfy = k[3] - (k[3] - k[1]) * 0.16, cdx = k[2] - k[0], cdy = k[3] - k[1], cdl = Math.hypot(cdx, cdy) || 1, cpx = -cdy / cdl * M.farmW * 0.9, cpy = cdx / cdl * M.farmW * 0.9;
    inkLine(c, [[cfx - cpx, cfy - cpy], [cfx + cpx, cfy + cpy]], LNs, 0.5);                                                        // the cuff
    c.fillStyle = SKIN; c.beginPath(); c.arc(k[2], k[3], M.hand, 0, 7); c.fill();
    if (ring) ringBand(sx, sy, k[0], k[1], M.uarmW * 0.82);
    return k;
  }
  function boot(ax, ay, fwd, tilt, col) {                             // a boot in the side view: toe forward, a heel, tilted when the foot is up
    c.save(); c.translate(ax, ay); c.rotate(fwd * tilt);
    blobD(c, [[-fwd * 2.0, -2.3], [fwd * 1.2, -2.5], [fwd * 4.3, -1.3], [fwd * 4.9, 0.3], [fwd * 3.6, 1.3], [-fwd * 2.2, 1.3], [-fwd * 2.7, -0.4]], col);
    inkLine(c, [[-fwd * 2.0, -2.2], [fwd * 1.3, -2.3]], LNs, 0.5); c.restore();
  }
  function bootF(ax, ay, lf, col) {                                  // a boot seen from the front or back
    blobD(c, [[ax - 1.9, ay - 2.0 - lf * 0.4], [ax + 1.9, ay - 2.0 - lf * 0.4], [ax + 2.2, ay + 0.6 + lf * 0.9], [ax, ay + 1.5 + lf * 1.2], [ax - 2.2, ay + 0.6 + lf * 0.9]], col);
    inkLine(c, [[ax - 1.8, ay - 1.8 - lf * 0.4], [ax + 1.8, ay - 1.8 - lf * 0.4]], LNs, 0.45);
  }
  function headShape(cx, cy, rx, ry, col) {                          // an egg: round above, a narrower jaw
    blobD(c, [[cx, cy - ry], [cx + rx * 0.98, cy - ry * 0.38], [cx + rx * 0.9, cy + ry * 0.28], [cx + rx * 0.5, cy + ry * 0.9], [cx, cy + ry], [cx - rx * 0.5, cy + ry * 0.9], [cx - rx * 0.9, cy + ry * 0.28], [cx - rx * 0.98, cy - ry * 0.38]], col);
  }
  function hairSide(cx, cy, rx, ry, fwd, nape) {                     // the hair in the side view, by style
    var bk = -fwd, amp = HS === 7 || HS === 8 ? 1.5 : 0.95, vol = HS === 7 || HS === 8 ? 1.45 : 1.15;
    if (HS === 5) return;
    if (HS === 6) {                                                  // shaved sides: a crest on top and a tail from the crown
      blobD(c, jagged([[cx + fwd * 2.6, cy - ry * 0.75], [cx + fwd * 1.0, cy - ry - 1.2], [cx - fwd * 1.2, cy - ry - 1.6], [cx + bk * 3.0, cy - ry * 0.6], [cx + bk * 2.2, cy - ry * 0.2], [cx, cy - ry * 0.6]], cx, cy, 0.7, seed), HAIR, true);
      tail(cx + bk * 2.6, cy - ry * 0.5, bk); return;
    }
    var pts = [[cx + fwd * (rx * 0.98), cy - ry * 0.55], [cx + fwd * rx * 0.6, cy - ry - 0.9 * vol], [cx, cy - ry - 1.3 * vol], [cx + bk * rx * 0.9, cy - ry * 0.7 - 0.8 * vol], [cx + bk * (rx * 1.15), cy + 0.2], [cx + bk * rx * 0.95, cy + ry * 0.55 + nape], [cx + bk * rx * 0.4, cy + ry * 0.35], [cx + fwd * rx * 0.3, cy - ry * 0.25]];
    if (HS === 1) pts[0] = [cx + fwd * rx * 0.9, cy - ry * 0.7];      // cropped: the hairline higher
    blobD(c, jagged(pts, cx, cy - 1, amp, seed), HAIR, true);
    if (HS === 2 || HS === 8) longSide(cx, cy, rx, ry, bk);
    if (HS === 3) braidSide(cx, cy, rx, ry, bk);
    if (HS === 4) { c.fillStyle = HAIR; c.beginPath(); c.ellipse(cx + bk * rx * 0.9, cy - ry * 0.75, 1.9, 1.7, 0, 0, 7); c.fill(); }
  }
  function longSide(cx, cy, rx, ry, bk) {                            // long hair falling down the back of the neck
    blobD(c, jagged([[cx + bk * rx * 0.5, cy - ry * 0.3], [cx + bk * rx * 1.15, cy + 0.5], [cx + bk * (rx * 1.3 + 0.8), cy + ry + 5.5], [cx + bk * rx * 0.3, cy + ry + 6.5], [cx + bk * rx * 0.2, cy + ry * 0.5]], cx + bk * 2, cy + 3, 0.9, seed + 3), HAIR, true);
  }
  function braidSide(cx, cy, rx, ry, bk) {
    var x0 = cx + bk * rx * 0.8, y0 = cy + ry * 0.3, x1 = x0 + bk * 1.2 + bk * Math.sin(ph) * 0.6 * amt, y1 = y0 + 9.5, i;
    limbD(c, x0, y0, 1.3, x1, y1, 0.8, HAIR); for (i = 1; i < 5; i++) inkLine(c, [[x0 + (x1 - x0) * i / 5 - 1, y0 + (y1 - y0) * i / 5], [x0 + (x1 - x0) * i / 5 + 1, y0 + (y1 - y0) * i / 5]], LNs, 0.5);
  }
  function tail(x0, y0, bk) { var sw = Math.sin(ph) * 0.9 * amt; limbD(c, x0, y0, 1.1, x0 + bk * (2.4 + sw), y0 + 7.5, 0.5, HAIR); }
  function beardSide(cx, cy, rx, ry, fwd) {
    var bk = -fwd; if (!BS) return;
    if (BS === 2) { c.globalAlpha = 0.55; blobD(c, [[cx + bk * rx * 0.75, cy + ry * 0.25], [cx + fwd * rx * 0.7, cy + ry * 0.45], [cx + fwd * rx * 0.55, cy + ry * 0.95], [cx - fwd * rx * 0.2, cy + ry * 1.02], [cx + bk * rx * 0.7, cy + ry * 0.6]], C.hairD); c.globalAlpha = 1; return; }
    if (BS === 4) { blobD(c, [[cx + fwd * rx * 0.95, cy + ry * 0.15], [cx + fwd * rx * 1.35, cy + ry * 0.4], [cx + fwd * rx * 0.9, cy + ry * 0.5], [cx + fwd * rx * 0.4, cy + ry * 0.38]], HAIR); return; }
    var lon = BS === 3, pts = [[cx + bk * rx * 0.7, cy + ry * 0.3], [cx + fwd * rx * 0.5, cy + ry * 0.4], [cx + fwd * rx * 1.15, cy + ry * 0.75], [cx + fwd * rx * (lon ? 0.9 : 0.95), cy + ry * (lon ? 1.9 : 1.45)], [cx + fwd * rx * (lon ? 0.3 : 0.2), cy + ry * (lon ? 2.6 : 1.55)], [cx + bk * rx * 0.3, cy + ry * (lon ? 1.6 : 1.15)], [cx + bk * rx * 0.75, cy + ry * 0.7]];
    blobD(c, jagged(pts, cx + fwd * 1, cy + ry, 0.7, seed + 7), HAIR, true);
    if (lon) { var i; for (i = 1; i < 4; i++) inkLine(c, [[cx + fwd * rx * 0.9 - fwd * 0.4 * i, cy + ry * (1.0 + 0.35 * i)], [cx + fwd * rx * 0.1, cy + ry * (1.05 + 0.35 * i)]], LNs, 0.5); }
  }
  function hatSide(cx, cy, rx, ry, fwd, shx, shy) {
    var bk = -fwd;
    if (HT === 1) blobD(c, [[cx + fwd * rx * 0.75, cy + ry * 0.85], [cx + fwd * rx * 1.05, cy - ry * 0.2], [cx + fwd * rx * 0.6, cy - ry - 1.4], [cx + bk * rx * 0.6, cy - ry - 1.1], [cx + bk * rx * 1.55, cy - ry * 0.1], [cx + bk * rx * 1.5, cy + ry * 0.9], [cx + bk * rx * 1.1, shy + 2.5], [cx + fwd * rx * 0.3, shy + 1.0]], CLOAK);
    else if (HT === 2) { blobD(c, [[cx + fwd * rx * 1.02, cy - ry * 0.35], [cx + fwd * rx * 0.7, cy - ry - 0.5], [cx, cy - ry - 0.9], [cx + bk * rx * 0.8, cy - ry - 0.3], [cx + bk * rx * 1.05, cy - ry * 0.25]], BOOT); inkLine(c, [[cx + fwd * rx * 1.02, cy - ry * 0.35], [cx + bk * rx * 1.05, cy - ry * 0.25]], LNs, 0.6); }
    else if (HT === 3) { blobD(c, [[cx + fwd * rx * 1.08, cy - ry * 0.25], [cx + fwd * rx * 0.75, cy - ry - 0.8], [cx, cy - ry - 1.4], [cx + bk * rx * 0.85, cy - ry - 0.6], [cx + bk * rx * 1.1, cy - ry * 0.2]], IRON); inkLine(c, [[cx + fwd * rx * 1.08, cy - ry * 0.25], [cx + bk * rx * 1.1, cy - ry * 0.2]], LNc, 0.7); c.fillStyle = IRON; c.fillRect(cx + fwd * rx * 1.0 - 0.5, cy - ry * 0.3, 1.0, ry * 0.9); }
    else if (HT === 4) { blobD(c, [[cx + fwd * rx * 0.95, cy - ry * 0.3], [cx + fwd * rx * 0.6, cy - ry - 1.6], [cx, cy - ry - 2.1], [cx + bk * rx * 0.75, cy - ry - 1.3], [cx + bk * rx * 1.0, cy - ry * 0.3]], C.vest); blobD(c, jagged([[cx + fwd * rx * 1.1, cy - ry * 0.55], [cx + fwd * rx * 1.05, cy - ry * 0.1], [cx + bk * rx * 1.12, cy], [cx + bk * rx * 1.1, cy - ry * 0.55]], cx, cy - ry * 0.3, 0.6, seed + 9), FUR, true); }
    else if (HT === 5) inkLine(c, [[cx + fwd * rx * 1.0, cy - ry * 0.5], [cx + bk * rx * 0.95, cy - ry * 0.45]], TRIM, 1.0);
  }
  function cloakSide(shx, shy, fwd) {
    var bk = -fwd, hem = M.hip + 15.5 + uy * 0.9, sw = amt * (2.2 + 1.5 * run);
    blobD(c, [[shx + fwd * 1.8, shy - 0.3], [shx + bk * 2.9, shy - 0.7], [shx + bk * 4.8, shy + 8], [shx + bk * (5.6 + sw), hem], [shx + bk * 1.2, hem + 0.4], [shx + bk * 1.6, beltY], [shx + fwd * 1.0, shy + 3]], CLOAK);
    inkLine(c, [[shx + bk * 3.4, shy + 6], [shx + bk * (3.6 + sw * 0.5), hem - 2]], LNs, 0.5);
  }
  function torsoSide(shx, shy, fwd) {
    var bk = -fwd, hx = 0, f = function (yy) { return (hipY - yy) / (hipY - shy); };
    var pts = [[shx + bk * 2.6, shy - 0.2], [shx + fwd * 3.0, shy], [shx * f(shy + 4.5) + fwd * 4.4, shy + 4.5], [shx * f(beltY) + fwd * 3.3, beltY], [fwd * (dress ? 4.4 : 4.2), hemY], [bk * (dress ? 4.6 : 3.6), hemY], [shx * f(beltY) + bk * 2.8, beltY], [shx * f(shy + 5) + bk * 3.6, shy + 5]];
    blobD(c, pts, TUN);
    inkLine(c, [[shx + fwd * 2.9, shy + 1.0], [shx * f(shy + 4.5) + fwd * 3.9, shy + 4.5], [shx * f(beltY) + fwd * 3.0, beltY - 1.5]], LIT, 0.8);     // the lit front
    inkLine(c, [[shx * f(beltY) + bk * 1.2, beltY + 2], [bk * 1.6, hemY - 0.8]], LNs, 0.45); inkLine(c, [[shx * f(beltY) + fwd * 0.6, beltY + 2.5], [fwd * 1.0, hemY - 0.8]], LNs, 0.45);   // folds
    if (dress) blobD(c, [[fwd * 4.1, hemY - 1.6], [bk * 4.3, hemY - 1.6], [bk * 4.4, hemY], [fwd * 4.2, hemY]], C.coat);
    if (CL === 4) blobD(c, jagged([[shx + bk * 2.4, shy + 0.3], [shx + fwd * 1.2, shy + 0.2], [shx * f(shy + 5) + fwd * 2.6, shy + 5], [shx * f(beltY) + fwd * 1.8, beltY + 0.5], [shx * f(beltY) + bk * 2.6, beltY + 0.5], [shx * f(shy + 5) + bk * 3.3, shy + 5]], shx, (shy + beltY) / 2, 0.7, seed + 11), FUR, true);
    if (coatLong) blobD(c, [[shx + fwd * 2.2, shy + 0.4], [shx * f(shy + 4.5) + fwd * 3.4, shy + 4.5], [shx * f(beltY) + fwd * 2.9, beltY], [shx * f(beltY) + fwd * 0.4, beltY], [shx * f(shy + 3) + fwd * 0.2, shy + 3]], C.vest);
    // the belt with its buckle, and the hem of the tunic over the legs
    if (!dress) { var bx = shx * f(beltY); blobD(c, [[bx + fwd * 3.2, beltY - 0.9], [bx + bk * 3.0, beltY - 0.9], [bx + bk * 3.0, beltY + 0.9], [bx + fwd * 3.2, beltY + 0.9]], BOOT, true); c.fillStyle = TRIM; c.fillRect(bx + fwd * 2.9 - 0.6, beltY - 0.7, 1.2, 1.4); }
    inkLine(c, [[fwd * 3.8, hemY - 0.2], [bk * 3.6, hemY - 0.2]], LNs, 0.5);
    if (hasCloak) { c.fillStyle = TRIM; c.beginPath(); c.arc(shx + fwd * 1.5, shy + 0.8, 0.9, 0, 7); c.fill(); }
  }
  function torsoFront(shx, shy) {
    var f = function (yy) { return (hipY - yy) / (hipY - shy); }, nw = 1 - 0.1 * Math.abs(tq), w0 = M.shw * nw, w1 = (M.shw + 0.2) * nw, wb = M.waist * nw, wh = (dress ? M.hipw + 1.8 : M.hipw + 0.6) * nw;
    var pts = [[shx - w0, shy], [shx + w0, shy], [shx * f(shy + 3.5) + w1, shy + 3.5], [shx * f(beltY) + wb, beltY], [wh, hemY], [-wh, hemY], [shx * f(beltY) - wb, beltY], [shx * f(shy + 3.5) - w1, shy + 3.5]];
    blobD(c, pts, TUN);
    inkLine(c, [[shx - w0 * 0.92, shy + 0.8], [shx * f(shy + 3.5) - w1 * 0.95, shy + 3.5], [shx * f(beltY) - wb * 0.95, beltY - 1.5]], LIT, 0.8);   // the lit side
    inkLine(c, [[shx * f(beltY) - wb * 0.55, beltY + 2.2], [-wh * 0.6, hemY - 0.8]], LNs, 0.45); inkLine(c, [[shx * f(beltY) + wb * 0.5, beltY + 2.5], [wh * 0.5, hemY - 0.8]], LNs, 0.45);   // folds
    inkLine(c, [[shx - w0 * 0.98, shy + 0.3], [shx * f(shy + 3.5) - w1 * 0.9, shy + 3.8]], LNs, 0.45); inkLine(c, [[shx + w0 * 0.98, shy + 0.3], [shx * f(shy + 3.5) + w1 * 0.9, shy + 3.8]], LNs, 0.45);   // the sleeve seams
    if (dress) { blobD(c, [[-wh + 0.1, hemY - 1.6], [wh - 0.1, hemY - 1.6], [wh, hemY], [-wh, hemY]], C.coat); if (!back) { c.fillStyle = C.coat; blobD(c, [[shx - w0 * 0.75, shy], [shx + w0 * 0.75, shy], [shx * f(shy + 4) + w1 * 0.55, shy + 4], [shx * f(shy + 4) - w1 * 0.55, shy + 4]], C.coat); inkLine(c, [[shx - w0 * 0.45, shy + 0.3], [shx * f(shy + 5) - w1 * 0.3, shy + 5]], LNs, 0.6); inkLine(c, [[shx + w0 * 0.45, shy + 0.3], [shx * f(shy + 5) + w1 * 0.3, shy + 5]], LNs, 0.6); c.fillStyle = TRIM; c.beginPath(); c.arc(shx * f(shy + 5) - w1 * 0.3, shy + 5, 0.9, 0, 7); c.arc(shx * f(shy + 5) + w1 * 0.3, shy + 5, 0.9, 0, 7); c.fill(); } }
    if (CL === 4) blobD(c, jagged([[shx - w0 * 0.95, shy + 0.2], [shx + w0 * 0.95, shy + 0.2], [shx * f(beltY) + wb * 1.05, beltY + 0.6], [shx * f(beltY) - wb * 1.05, beltY + 0.6]], shx, (shy + beltY) / 2, 0.7, seed + 11), FUR, true);
    if (CL === 4 && !back) blobD(c, [[shx - w0 * 0.3, shy + 0.3], [shx + w0 * 0.3, shy + 0.3], [shx * f(beltY) + wb * 0.25, beltY], [shx * f(beltY) - wb * 0.25, beltY]], TUN);
    if (coatLong && !back) { blobD(c, [[shx - w0 * 0.72, shy + 0.3], [shx + w0 * 0.72, shy + 0.3], [shx * f(beltY) + wb * 0.75, beltY], [shx * f(beltY) - wb * 0.75, beltY]], C.vest); inkLine(c, [[shx, shy + 2.2], [shx * f(beltY), beltY]], LNs, 0.5); }
    if (!back && !dress && CL !== 4 && !coatLong) { c.fillStyle = C.coatD; blobD(c, [[shx - 1.1, shy + 0.2], [shx + 1.1, shy + 0.2], [shx + 0.6, shy + 2.6], [shx - 0.6, shy + 2.6]], C.coatD); inkLine(c, [[shx, shy + 1.2], [shx * f(shy + 4.5), shy + 4.5]], LNs, 0.5); }
    if (hasCloak && back) { var hem = M.hip + 15.5 + uy * 0.9; blobD(c, [[shx - w0 - 0.8, shy - 0.6], [shx + w0 + 0.8, shy - 0.6], [wh + 2.4, hem - 3], [wh + 1.0, hem + 0.6], [wh * 0.3, hem - 0.5], [-wh * 0.5, hem + 0.7], [-wh - 1.2, hem - 0.2], [-wh - 2.4, hem - 3.5]], CLOAK); c.strokeStyle = LNs; c.lineWidth = 0.5; c.beginPath(); c.moveTo(shx - w0 * 0.35, shy + 3); c.quadraticCurveTo(-wh * 0.9, beltY + 4, -wh * 0.5, hem - 2); c.moveTo(shx + w0 * 0.45, shy + 2.5); c.quadraticCurveTo(wh * 0.9, beltY + 2, wh * 0.7, hem - 3); c.stroke(); inkLine(c, [[shx - w0 - 0.6, shy + 1], [-wh - 1.6, hem - 4]], LIT, 0.8); }
    if (!dress) { var bx = shx * f(beltY); blobD(c, [[bx - wb - 0.3, beltY - 0.9], [bx + wb + 0.3, beltY - 0.9], [bx + wb + 0.3, beltY + 0.9], [bx - wb - 0.3, beltY + 0.9]], BOOT, true); if (!back) { c.fillStyle = TRIM; c.fillRect(bx + tq * 1.2 - 0.7, beltY - 0.75, 1.4, 1.5); blobD(c, [[bx + wb * 0.45, beltY + 1.0], [bx + wb * 0.45 + 2.2, beltY + 1.0], [bx + wb * 0.45 + 2.0, beltY + 3.4], [bx + wb * 0.45 + 0.2, beltY + 3.4]], shade(BOOT, -0.05)); } }
    inkLine(c, [[-wh + 0.3, hemY - 0.2], [wh - 0.3, hemY - 0.2]], LNs, 0.5);
    if (hasCloak && !back) { c.fillStyle = TRIM; c.beginPath(); c.arc(shx + w0 * 0.62 + tq * 0.5, shy + 1.0, 0.95, 0, 7); c.fill(); }
  }
  function hairFront(cx, cy, rx, ry) {                               // the hair in the front and back views
    var amp = HS === 7 || HS === 8 ? 1.4 : 0.9, vol = HS === 7 || HS === 8 ? 1.5 : 1.15, i;
    if (HS === 5) return;
    if (HS === 2 || HS === 8) {                                      // long: masses beside the face (or over the back) to the shoulders
      blobD(c, jagged([[cx - rx * 0.95, cy - ry * 0.4], [cx + rx * 0.95, cy - ry * 0.4], [cx + rx * 1.25, cy + ry * 1.3], [cx + rx * 0.9, cy + ry * 1.75], [cx, cy + ry * (back ? 1.9 : 1.1)], [cx - rx * 0.9, cy + ry * 1.75], [cx - rx * 1.25, cy + ry * 1.3]], cx, cy + 2, amp, seed + 3), HAIR, true);
    }
    if (HS === 3) { var bl = [[cx - rx * 0.75 + tq * 1.5, cy + ry * 0.35], [cx + rx * 0.75 + tq * 1.5, cy + ry * 0.35]]; for (i = 0; i < 2; i++) { var sd = i ? 1 : -1, x0 = bl[i][0], y0 = bl[i][1], x1 = x0 + sd * 0.8, y1 = y0 + 9.5, k; limbD(c, x0, y0, 1.3, x1, y1, 0.8, HAIR); for (k = 1; k < 5; k++) inkLine(c, [[x0 + (x1 - x0) * k / 5 - 0.9, y0 + (y1 - y0) * k / 5], [x0 + (x1 - x0) * k / 5 + 0.9, y0 + (y1 - y0) * k / 5]], LNs, 0.5); } }
    if (HS === 6) { if (back) tail(cx, cy - ry * 0.4, 1); blobD(c, jagged([[cx - 1.6 + tq, cy - ry * 0.65], [cx - 1.2 + tq * 0.5, cy - ry - 1.4], [cx + 1.2 + tq * 0.5, cy - ry - 1.4], [cx + 1.6 + tq, cy - ry * 0.65]], cx, cy, 0.6, seed), HAIR, true); return; }
    if (back) blobD(c, jagged([[cx - rx * 1.02, cy - ry * 0.35], [cx - rx * 0.7, cy - ry - 0.9 * vol], [cx, cy - ry - 1.3 * vol], [cx + rx * 0.7, cy - ry - 0.9 * vol], [cx + rx * 1.02, cy - ry * 0.35], [cx + rx * 0.9, cy + ry * 0.45], [cx, cy + ry * 0.75], [cx - rx * 0.9, cy + ry * 0.45]], cx, cy, amp, seed), HAIR, true);
    else {
      var fr = HS === 1 ? -0.72 : -0.42;                             // the fringe: cropped sits higher
      blobD(c, jagged([[cx - rx * 1.05, cy - ry * 0.3], [cx - rx * 0.75, cy - ry - 0.9 * vol], [cx, cy - ry - 1.3 * vol], [cx + rx * 0.75, cy - ry - 0.9 * vol], [cx + rx * 1.05, cy - ry * 0.3], [cx + rx * 0.9 + tq * 0.8, cy + ry * fr], [cx + tq * 1.4, cy + ry * (fr + 0.08)], [cx - rx * 0.9 + tq * 0.8, cy + ry * fr]], cx, cy, amp, seed), HAIR, true);
    }
    if (HS === 4 && back) { c.fillStyle = HAIR; c.beginPath(); c.ellipse(cx, cy - ry * 0.55, 2.0, 1.8, 0, 0, 7); c.fill(); }
    if (HS === 4 && !back) { c.fillStyle = HAIR; c.beginPath(); c.ellipse(cx - tq * 2.5, cy - ry - 0.8, 1.6 * Math.max(0.3, Math.abs(tq)) + 0.6, 1.3, 0, 0, 7); c.fill(); }
  }
  function beardFront(cx, cy, rx, ry) {
    if (!BS || back) return;
    if (BS === 2) { c.globalAlpha = 0.5; blobD(c, [[cx - rx * 0.88, cy + ry * 0.2], [cx + rx * 0.88, cy + ry * 0.2], [cx + rx * 0.5, cy + ry * 0.95], [cx, cy + ry * 1.04], [cx - rx * 0.5, cy + ry * 0.95]], C.hairD); c.globalAlpha = 1; return; }
    if (BS === 4) { blobD(c, [[cx - rx * 0.55 + tq, cy + ry * 0.4], [cx + tq * 1.3, cy + ry * 0.3], [cx + rx * 0.55 + tq * 1.6, cy + ry * 0.4], [cx + rx * 0.35 + tq * 1.3, cy + ry * 0.55], [cx + tq * 1.3, cy + ry * 0.5], [cx - rx * 0.35 + tq, cy + ry * 0.55]], HAIR); return; }
    var lon = BS === 3, pts = [[cx - rx * 0.9, cy + ry * 0.15], [cx - rx * 0.45 + tq * 1.0, cy + ry * 0.45], [cx + tq * 1.3, cy + ry * 0.4], [cx + rx * 0.45 + tq * 1.0, cy + ry * 0.45], [cx + rx * 0.9, cy + ry * 0.15], [cx + rx * (lon ? 0.55 : 0.7), cy + ry * (lon ? 1.6 : 1.35)], [cx + tq * 0.6, cy + ry * (lon ? 2.7 : 1.6)], [cx - rx * (lon ? 0.55 : 0.7), cy + ry * (lon ? 1.6 : 1.35)]];
    blobD(c, jagged(pts, cx, cy + ry, 0.7, seed + 7), HAIR, true);
    if (lon) { var i; for (i = 1; i < 4; i++) inkLine(c, [[cx - rx * 0.35 + tq * 0.4, cy + ry * (1.0 + 0.4 * i)], [cx + rx * 0.35 + tq * 0.4, cy + ry * (1.0 + 0.4 * i)]], LNs, 0.5); }
  }
  function hatFront(cx, cy, rx, ry, shy) {
    if (HT === 1) { blobD(c, [[cx - rx * 1.5, shy + 1.5], [cx - rx * 1.45, cy - ry * 0.2], [cx - rx * 0.7, cy - ry - 1.6], [cx + rx * 0.7, cy - ry - 1.6], [cx + rx * 1.45, cy - ry * 0.2], [cx + rx * 1.5, shy + 1.5]], CLOAK); if (!back) { c.save(); c.beginPath(); c.ellipse(cx + tq * 0.6, cy + 0.3, rx * 1.0, ry * 1.02, 0, 0, 7); c.clip(); headAndFace(cx, cy, rx, ry); c.restore(); } }
    else if (HT === 2) { blobD(c, [[cx - rx * 1.03, cy - ry * 0.32], [cx - rx * 0.75, cy - ry - 0.5], [cx, cy - ry - 0.9], [cx + rx * 0.75, cy - ry - 0.5], [cx + rx * 1.03, cy - ry * 0.32]], BOOT); inkLine(c, [[cx - rx * 1.03, cy - ry * 0.32], [cx + rx * 1.03, cy - ry * 0.32]], LNs, 0.6); }
    else if (HT === 3) { blobD(c, [[cx - rx * 1.1, cy - ry * 0.25], [cx - rx * 0.8, cy - ry - 0.8], [cx, cy - ry - 1.4], [cx + rx * 0.8, cy - ry - 0.8], [cx + rx * 1.1, cy - ry * 0.25]], IRON); inkLine(c, [[cx - rx * 1.1, cy - ry * 0.25], [cx + rx * 1.1, cy - ry * 0.25]], LNc, 0.7); if (!back) { c.fillStyle = IRON; c.fillRect(cx + tq * 1.6 - 0.55, cy - ry * 0.3, 1.1, ry * 0.95); } }
    else if (HT === 4) { blobD(c, [[cx - rx * 0.95, cy - ry * 0.3], [cx - rx * 0.65, cy - ry - 1.6], [cx, cy - ry - 2.1], [cx + rx * 0.65, cy - ry - 1.6], [cx + rx * 0.95, cy - ry * 0.3]], C.vest); blobD(c, jagged([[cx - rx * 1.12, cy - ry * 0.55], [cx + rx * 1.12, cy - ry * 0.55], [cx + rx * 1.1, cy - ry * 0.05], [cx - rx * 1.1, cy - ry * 0.05]], cx, cy - ry * 0.3, 0.6, seed + 9), FUR, true); }
    else if (HT === 5) inkLine(c, [[cx - rx * 1.0, cy - ry * 0.45], [cx + rx * 1.0, cy - ry * 0.45]], TRIM, 1.0);
  }
  function headAndFace(cx, cy, rx, ry) {
    headShape(cx, cy, rx, ry, SKIN);
    inkLine(c, [[cx - rx * 0.8, cy - ry * 0.55], [cx - rx * 0.95, cy], [cx - rx * 0.7, cy + ry * 0.65]], LIT, 0.8);
    c.fillStyle = SKIN; c.beginPath(); c.ellipse(cx - rx * 0.98 - tq * 0.3, cy + 0.4, 0.8, 1.15, 0, 0, 7); c.ellipse(cx + rx * 0.98 - tq * 0.3, cy + 0.4, 0.8, 1.15, 0, 0, 7); c.fill();
    if (back) return;
    var ex = cx + tq * 1.4, es = 1.3 * sp.headW, er = 0.52 * sp.eyeSize, i;
    for (i = -1; i <= 1; i += 2) {
      var x0 = ex + i * es;
      if (blink) inkLine(c, [[x0 - 0.6, cy - 0.3], [x0 + 0.6, cy - 0.3]], C.eye, 0.5);
      else { c.fillStyle = C.eye; c.beginPath(); c.ellipse(x0, cy - 0.3, er * 0.8, er, 0, 0, 7); c.fill(); }
      inkLine(c, [[x0 - 0.9 - i * 0.2, cy - 1.5 + 0.15], [x0 + 0.9 - i * 0.2, cy - 1.5 - 0.15]], LNc, 0.55);   // a brow, the inner end a little lower
    }
    inkLine(c, [[ex + 0.1, cy - 0.2], [ex + 0.35 - tq * 0.4, cy + 1.1], [ex - 0.3, cy + 1.2]], LNs, 0.5);                   // the nose
    if (!BS || BS === 2 || BS === 4) inkLine(c, [[ex - 0.7 + tq * 0.2, cy + 2.2], [ex + 0.7 + tq * 0.2, cy + 2.2]], LNs, 0.45);
    if (sp.blush) { c.globalAlpha = 0.18 * sp.blush; c.fillStyle = '#c0503a'; c.beginPath(); c.ellipse(ex - es * 1.1, cy + 1.2, 0.9, 0.55, 0, 0, 7); c.ellipse(ex + es * 1.1, cy + 1.2, 0.9, 0.55, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
  }

  if (side) {
    var fwd = -1, bk = 1;
    var shx = ux + fwd * (0.5 + 3.2 * run * amt), shy = shY + 0.8 * run * amt;
    var headBob = -Math.abs(Math.sin(ph - 0.6)) * 0.5 * amt * sp.bob;
    var legS = function (phi, near) {
      var sw = Math.sin(phi), lf = Math.max(0, Math.cos(phi)) * amt;
      var ax = fwd * sw * 4.4 * amt * (1 + 0.35 * run) * sp.stride + (near ? 0.3 : -0.5), ay = M.ankle - lf * (3.2 + 1.3 * run) * Math.min(1.4, sp.stride);
      var hx = near ? 0.5 : -0.7, hy = hipY, k = ik2(hx, hy, ax, ay, M.thigh, M.shin, 1), col = near ? PANTS : C.pantsD, bcol = near ? BOOT : shade(BOOT, -0.07);
      if (sit) { k = [hx + fwd * M.thigh * 0.92, hy + 1.5, hx + fwd * (M.thigh * 0.92 + 1), M.ankle]; lf = 0; }
      limbD(c, hx, hy, M.thighW * 1.12, k[0], k[1], M.thighW * 0.8, col); limbD(c, k[0], k[1], M.thighW * 0.8, k[2], k[3], M.shinW * 0.82, col);
      inkLine(c, [[k[2] + fwd * 0.9, k[3] - 5.5], [k[2] - fwd * 1.3, k[3] - 4.0]], LNs, 0.45);                              // a leg wrap
      inkLine(c, [[k[2] + fwd * 1.1, k[3] - 3.6], [k[2] - fwd * 1.2, k[3] - 2.4]], LNs, 0.45);
      boot(k[2], k[3], fwd, lf * 0.45, bcol);
    };
    lay(0);
    if (hasCloak) cloakSide(shx, shy, fwd);
    legS(ph + Math.PI, false);
    // the far arm
    var farT = hand(pose && pose.far), aFar = Math.sin(ph + Math.PI) * 0.6 * amt * (1 + 0.35 * run) * sp.armSwing;
    var fsx = shx + bk * 2.0, fsy = shy + 1.4;
    if (!farT) farT = [fsx + fwd * Math.sin(aFar) * M.arm * 1.9 + bk * 0.4, fsy + Math.cos(aFar) * M.arm * 1.93];
    armD(fsx, fsy, farT[0], farT[1], -1, C.coatD === TUN ? TUN : (dress ? C.coat : shade(TUN, -0.06)), false);
    lay(1);
    legS(ph, true);
    torsoSide(shx, shy, fwd);
    limbD(c, shx + fwd * 0.2, shy + 0.6, 1.25, shx + fwd * 0.9, M.chin + uy + 0.6 + headBob, 1.1, SKIN);                   // the neck
    var cx = shx + fwd * 1.4, cy = M.cy + uy + headBob, rx = M.headW / 2 * 1.16, ry = M.headH / 2;
    c.save(); c.translate(cx, cy); c.rotate(fwd * (0.06 * run * amt)); c.translate(-cx, -cy);
    if (HS === 2 || HS === 8) { /* long hair behind the head goes first */ }
    headShape(cx, cy, rx, ry, SKIN);
    blobD(c, [[cx + fwd * rx * 0.8, cy - 1.2], [cx + fwd * (rx * 1.3), cy + 0.5], [cx + fwd * rx * 0.95, cy + 1.6], [cx + fwd * rx * 0.6, cy + 1.6]], SKIN, true);                    // the nose
    inkLine(c, [[cx + fwd * rx * 0.88, cy - 0.9], [cx + fwd * (rx * 1.28), cy + 0.5], [cx + fwd * rx * 0.95, cy + 1.5]], LNc, 0.5);
    inkLine(c, [[cx + fwd * rx * 0.75, cy + ry * 0.5], [cx + fwd * rx * 0.55, cy + ry * 0.88]], LNs, 0.45);                     // the chin
    inkLine(c, [[cx + fwd * rx * 0.55, cy - ry * 0.85], [cx + fwd * rx * 0.85, cy - ry * 0.3]], LIT, 0.8);
    c.fillStyle = SKIN; c.beginPath(); c.ellipse(cx + bk * rx * 0.72, cy + 0.4, 0.85, 1.2, 0, 0, 7); c.fill(); inkLine(c, [[cx + bk * rx * 0.72, cy - 0.6], [cx + bk * rx * 0.72 + 0.6, cy + 0.3], [cx + bk * rx * 0.72, cy + 1.3]], LNs, 0.4);   // the ear
    if (blink) inkLine(c, [[cx + fwd * rx * 0.3, cy - 0.3], [cx + fwd * rx * 0.75, cy - 0.3]], C.eye, 0.5);
    else { c.fillStyle = C.eye; c.beginPath(); c.ellipse(cx + fwd * rx * 0.55, cy - 0.3, 0.42 * sp.eyeSize, 0.52 * sp.eyeSize, 0, 0, 7); c.fill(); }
    inkLine(c, [[cx + fwd * rx * 0.25, cy - 1.4], [cx + fwd * rx * 0.9, cy - 1.7]], LNc, 0.55);                                                  // the brow
    if (sp.blush) { c.globalAlpha = 0.18 * sp.blush; c.fillStyle = '#c0503a'; c.beginPath(); c.ellipse(cx + fwd * rx * 0.45, cy + 1.3, 1.0, 0.55, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
    hairSide(cx, cy, rx, ry, fwd, 0);
    beardSide(cx, cy, rx, ry, fwd);
    hatSide(cx, cy, rx, ry, fwd, shx, shy);
    c.restore();
    lay(2);
    var nearT = hand(pose && pose.near), aNear = Math.sin(ph) * 0.6 * amt * (1 + 0.35 * run) * sp.armSwing;
    var nsx = shx + fwd * 0.4, nsy = shy + 1.4;
    if (!nearT) nearT = amt < 0.25 ? [shx * 0.4 + fwd * 3.0, beltY - 0.4] : [nsx + fwd * Math.sin(aNear) * M.arm * 1.9 + fwd * 0.8, nsy + Math.cos(aNear) * M.arm * 1.95];
    armD(nsx, nsy, nearT[0], nearT[1], -1, dress ? C.coat : TUN, RG > 0);
  } else {
    var dS = back ? -1 : 1, shx2 = ux, shy2 = shY + 1.2 * run * amt, restHand = amt < 0.25 && !back, restSide = 1;
    var headBob2 = -Math.abs(Math.sin(ph - 0.6)) * 0.5 * amt * sp.bob, sway = Math.sin(ph) * amt * sp.sway * 0.8;
    var legF = function (sd, phi) {
      var sw = Math.sin(phi) * dS, lf = Math.max(0, Math.cos(phi)) * amt;
      var hx = sd * M.hipw * 0.5 + ux * 0.1 + sway * 0.3, hy = hipY;
      var ax = sd * (2.3 * sp.stance + 0.5) * (1 - 0.08 * Math.abs(tq)) + tq * sw * 2.0 * amt - lf * sd * 0.5, ay = M.ankle + sw * (2.3 + 0.8 * run) * amt * sp.stride - lf * (2.4 + 0.9 * run);
      var kx = (hx + ax) / 2 + sd * 0.35, ky = (hy + ay) / 2 + lf * 1.4;
      if (sit) { ax = sd * (M.hipw * 0.5 + 2.2); ay = M.ankle; kx = sd * (M.hipw * 0.5 + 1.6); ky = hy + 6; lf = 0; }
      var col = PANTS, bcol = BOOT;
      limbD(c, hx, hy, M.thighW, kx, ky, M.thighW * 0.8, col); limbD(c, kx, ky, M.thighW * 0.8, ax, ay, M.shinW * 0.85, col);
      inkLine(c, [[ax - 1.5, ay - 5.2], [ax + 1.5, ay - 4.2]], LNs, 0.45); inkLine(c, [[ax - 1.5, ay - 3.4], [ax + 1.5, ay - 2.5]], LNs, 0.45);
      bootF(ax, ay, lf, bcol);
      return ay;
    };
    var armFn = function (sd, target, swing, ring) {
      var sx = shx2 + sd * (M.shw - 0.5) * (1 - 0.1 * Math.abs(tq)) + tq * 0.4, sy = shy2 + 1.2, tx, ty;
      if (target) { tx = target[0]; ty = target[1]; }
      else if (restHand && sd === restSide) { tx = shx2 * 0.4 + sd * (M.waist * 0.9 + 0.3) + tq * 0.3; ty = beltY - 0.6; }                      // at rest the hand rests on the belt
      else { var a = swing; tx = sx + sd * 1.2 + a * 1.6 * sd + ux * 0.25; ty = sy + M.arm * 1.95 - Math.abs(a) * 1.4 - 0.2; }   // a light sway with the step, not a pump (Robin)
      armD(sx, sy, tx, ty, -sd, dress ? C.coat : TUN, ring);
    };
    var aL = Math.sin(ph) * 0.6 * amt * (1 + 0.35 * run) * sp.armSwing * dS, aR = -aL;
    var backL = back ? tq > -0.35 : tq < -0.35, backR = back ? tq < 0.35 : tq > 0.35;
    var tL = hand(pose && pose.armL), tR = hand(pose && pose.armR);
    lay(0);
    if (hasCloak && !back) { var hem = M.hip + 15.5 + uy * 0.9, cw = M.shw + 1.0; blobD(c, [[shx2 - cw, shy2 - 0.8], [shx2 + cw, shy2 - 0.8], [M.hipw + 2.6 + sway * 0.6, hem - 3], [M.hipw + 1.2, hem + 0.5], [sway * 0.5, hem - 0.6], [-M.hipw - 1.4, hem + 0.5], [-M.hipw - 2.6 + sway * 0.6, hem - 3]], CLOAK); }
    if (backL && !tL) armFn(-1, null, aL, false);
    if (backR && !tR) armFn(1, null, aR, false);
    lay(1);
    var yl = legF(-1, ph), yr = legF(1, ph + Math.PI);
    if (yl > yr) legF(-1, ph); else legF(1, ph + Math.PI);                   // the nearer leg drawn last
    if (!dress) inkLine(c, [[sway * 0.3, hemY + 0.5], [sway * 0.3, hemY + 3.5]], LNs, 0.35);
    torsoFront(shx2, shy2);
    limbD(c, shx2 * 0.95, shy2 + 0.6, 1.3, shx2 + tq * 0.4, M.chin + uy + 0.6 + headBob2, 1.15, SKIN);                       // the neck
    var cx2 = shx2 + tq * 0.35, cy2 = M.cy + uy + headBob2, rx2 = M.headW / 2, ry2 = M.headH / 2;
    c.save(); c.translate(cx2, cy2); c.rotate(sway * 0.025); c.translate(-cx2, -cy2);
    if (!back && (HS === 2 || HS === 8)) hairFront(cx2, cy2, rx2, ry2);        // long hair behind the face first
    if (HT === 1) hatFront(cx2, cy2, rx2, ry2, shy2);                         // the hood frames the face, the face inside it
    else {
      headAndFace(cx2, cy2, rx2, ry2);
      if (back || !(HS === 2 || HS === 8)) hairFront(cx2, cy2, rx2, ry2); else blobD(c, jagged([[cx2 - rx2 * 1.05, cy2 - ry2 * 0.3], [cx2 - rx2 * 0.75, cy2 - ry2 - 0.9], [cx2, cy2 - ry2 - 1.3], [cx2 + rx2 * 0.75, cy2 - ry2 - 0.9], [cx2 + rx2 * 1.05, cy2 - ry2 * 0.3], [cx2 + rx2 * 0.9 + tq * 0.8, cy2 - ry2 * 0.42], [cx2 + tq * 1.4, cy2 - ry2 * 0.34], [cx2 - rx2 * 0.9 + tq * 0.8, cy2 - ry2 * 0.42]], cx2, cy2, 0.75, seed), HAIR, true);
      hatFront(cx2, cy2, rx2, ry2, shy2);
    }
    beardFront(cx2, cy2, rx2, ry2);
    c.restore();
    lay(2);
    if (!backL || tL) armFn(-1, tL, aL, false);
    if (!backR || tR) armFn(1, tR, aR, RG > 0 && !back);
  }
  if (layers) { var lj; for (lj = 0; lj < 3; lj++) inkLayerEnd(cOut, layers[lj], lj, INK_FIG.line, INK_FIG); c = cOut; }
  c.restore();
}

/* Idle poses and jobs for the people of the world (2026-10-07, Robin: every villager stood the same way with the same bent arm).
   A pose is the ink figure's pose contract: hand targets in the figure's own space (armL/armR for the front and back views,
   near/far for the side view), the lean (lx, ly) and a turn for the head and body. idlePose(F, id, t, dir) gives the pose of an
   idle at time t; jobPose(F, kind, t, dir) the pose of a job with the thing in hand (held: kind, x, y, ang in figure space),
   drawn by figureHeld after the figure. The page blends between poses itself. IDLES are the idles a person cycles through. */
var IDLES = ['rest', 'hips', 'crossed', 'scratch', 'look', 'stretch', 'lean'];
var JOBS = ['chop', 'carry', 'sweep', 'hang', 'fish', 'smith'];
function poseLerp(a, b, k) {                                          // a blend of two poses (every key present in both)
  if (!a) return b; if (!b) return a; var o = {}, q;
  for (q in b) { var va = a[q], vb = b[q]; if (vb == null) continue; if (typeof vb === 'number') o[q] = (va == null ? vb : va + (vb - va) * k); else if (vb.length === 2) o[q] = va ? [va[0] + (vb[0] - va[0]) * k, va[1] + (vb[1] - va[1]) * k] : vb; else o[q] = vb; }
  return o;
}
function idlePose(F, id, t, dir) {
  var M = inkMetrics(F.spec), side = dir === 'left' || dir === 'right', fwd = -1, bk = 1, rx = M.headW / 2 * 1.16, ry = M.headH / 2;
  var shy = M.sh + 1.2, hang = shy + M.arm * 1.95 - 0.2, shw = M.shw - 0.5, cx = fwd * 1.4, nsx = fwd * 0.4, fsx = bk * 2.0;
  var o = { lx: 0, ly: 0, turn: 0, armL: [-shw - 1.2, hang], armR: [M.waist * 0.9 + 0.3, M.belt - 0.6], near: [fwd * 3.0, M.belt - 0.4], far: [fsx + bk * 0.4, shy + M.arm * 1.93] };   // rest: one hand on the belt
  var k = Math.min(1, t / 0.6), w = Math.sin(t * 1.3);
  if (id === 'hips') { o.armL = [-(M.waist + 1.4), M.belt - 0.8]; o.armR = [M.waist + 1.4, M.belt - 0.8]; o.near = [bk * 0.6, M.belt - 0.6]; o.far = [bk * 2.8, M.belt - 0.4]; }
  else if (id === 'crossed') { o.armL = [2.4, M.sh + 6.0]; o.armR = [-2.4, M.sh + 6.8]; o.near = [fwd * 2.8, M.sh + 6.2]; o.far = [fwd * 1.0, M.sh + 6.9]; }
  else if (id === 'scratch') { var sc = Math.sin(t * 7) * 0.5; o.armR = [rx + 1.6, M.cy - 1.5 + sc]; o.armL = [-shw - 1.2, hang]; o.near = [cx + bk * rx * 0.95, M.cy - ry * 0.55 + sc]; o.far = [fsx + bk * 0.4, shy + M.arm * 1.93]; o.turn = 0.25; }
  else if (id === 'look') { o.armL = [-shw - 1.2, hang]; o.armR = [shw + 1.2, hang]; o.near = [nsx + fwd * 0.6, shy + M.arm * 1.93]; o.far = [fsx + bk * 0.4, shy + M.arm * 1.93]; o.turn = w * 0.85; o.lx = w * 0.5; }
  else if (id === 'stretch') { var up = M.sh - M.arm * 1.8 + 2 + (1 - k) * 12; o.armL = [-2.6, up]; o.armR = [2.6, up]; o.near = [fwd * 1.6, up]; o.far = [bk * 0.6, up + 0.6]; o.ly = -0.9 * k; o.lx = 0; }
  else if (id === 'lean') { o.armR = [shw + M.arm * 1.85, M.sh + 2.5]; o.armL = [-shw - 1.0, hang]; o.lx = 1.4; o.near = [fwd * (M.arm * 1.85 + 0.5), M.sh + 2.5]; o.far = [fsx + bk * 0.4, shy + M.arm * 1.93]; o.lx = side ? fwd * 1.4 : 1.4; }
  return o;
}
function jobPose(F, kind, t, dir) {
  var M = inkMetrics(F.spec), side = dir === 'left' || dir === 'right', fwd = -1, bk = 1, shy = M.sh + 1.2, shw = M.shw - 0.5, hang = shy + M.arm * 1.95 - 0.2;
  var o = { lx: 0, ly: 0, turn: 0, held: null };
  if (kind === 'chop') {                                               // a two-handed chop: up behind the head, fast down onto the block in front, a pause, up again
    var per = 1.5, u = (t % per) / per, k = u < 0.5 ? 1 - Math.pow(1 - u / 0.5, 2) * 1 : (u < 0.62 ? 1 - (u - 0.5) / 0.12 : 0);   // 1 = up, 0 = down
    var hi = M.sh - 9, lo = M.hip + 4;
    o.armL = [-1.5 + k * 1.0, lo + (hi - lo) * k]; o.armR = [1.5 + k * 1.0, lo + (hi - lo) * k + 1.2]; o.ly = (1 - k) * 2.2; o.lx = 0;
    o.near = [fwd * (7 - k * 10), lo + (hi - lo) * k]; o.far = [fwd * (5 - k * 9), lo + (hi - lo) * k + 1.5]; if (side) o.lx = fwd * ((1 - k) * 2.2);
    o.held = { kind: 'axe', x: side ? o.near[0] : o.armR[0], y: side ? o.near[1] : o.armR[1], ang: side ? (k > 0.5 ? -2.1 : 2.0) : (k > 0.5 ? -1.45 : 1.4) };
  } else if (kind === 'carry') {                                       // a bucket in the right hand, the arm straight down, the other free
    o.armR = [shw + 1.4, hang + 1.0]; o.near = [nsxOf(fwd) + 0.2, shy + M.arm * 1.93 + 0.8]; o.ly = 0.3;
    o.held = { kind: 'bucket', x: side ? o.near[0] : o.armR[0], y: side ? o.near[1] : o.armR[1], ang: 0 };
  } else if (kind === 'sweep') {                                       // both hands on a broom, bent forward, the head of it swishing over the ground
    var sw = Math.sin(t * 3.2) * 3.5;
    o.armL = [-2.2 + sw * 0.5, M.sh + 7.5]; o.armR = [2.0 + sw * 0.8, M.belt + 1.5]; o.ly = 1.5; o.lx = sw * 0.15;
    o.near = [fwd * 4.5 + sw * 0.3, M.belt + 1.2]; o.far = [fwd * 1.5, M.sh + 6.5]; if (side) o.lx = fwd * 1.6;
    o.held = { kind: 'broom', x: side ? o.near[0] : o.armR[0], y: side ? o.near[1] : o.armR[1], ang: side ? 2.2 : 1.95, sw: sw };
  } else if (kind === 'hang') {                                        // arms up to the rack, hanging something, a small lift now and then
    var lift = Math.max(0, Math.sin(t * 1.4)) * 2;
    o.armL = [-3.2, M.sh - M.arm * 1.5 - lift]; o.armR = [3.4, M.sh - M.arm * 1.55 - lift]; o.near = [fwd * 3.5, M.sh - M.arm * 1.5 - lift]; o.far = [fwd * 2.0, M.sh - M.arm * 1.4 - lift]; o.ly = -0.3;
  } else if (kind === 'fish') {                                        // a rod held out over the water in both hands
    var bob = Math.sin(t * 1.1) * 0.6;
    o.armL = [-1.8, M.sh + 5.5 + bob]; o.armR = [1.6, M.sh + 4.5 + bob]; o.near = [fwd * 5.5, M.sh + 5 + bob]; o.far = [fwd * 3.5, M.sh + 4 + bob];
    o.held = { kind: 'rod', x: side ? o.near[0] : o.armR[0], y: side ? o.near[1] : o.armR[1], ang: side ? -0.35 : 1.25 };
  } else if (kind === 'smith') {                                       // one-handed hammering: up by the shoulder, down onto the work
    var per2 = 0.9, u2 = (t % per2) / per2, k2 = u2 < 0.55 ? u2 / 0.55 : 1 - (u2 - 0.55) / 0.45;
    var hi2 = M.sh - 3, lo2 = M.belt + 2;
    o.armR = [3.0 + k2 * 1.5, lo2 + (hi2 - lo2) * k2]; o.armL = [-2.5, M.belt + 1]; o.near = [fwd * (6 - k2 * 6), lo2 + (hi2 - lo2) * k2]; o.far = [fwd * 3, M.belt + 1]; o.ly = (1 - k2) * 1.2;
    o.held = { kind: 'hammer', x: side ? o.near[0] : o.armR[0], y: side ? o.near[1] : o.armR[1], ang: side ? (k2 > 0.5 ? -1.9 : 1.6) : (k2 > 0.5 ? -1.2 : 1.3) };
  }
  function nsxOf(f) { return f * 0.4; }
  return o;
}
// the thing in a person's hand, drawn in the figure's own space after the figure (the page hands over the same x, y, dir, F)
function heldD(c, h) {
  var ca = Math.cos(h.ang), sa = Math.sin(h.ang), x = h.x, y = h.y;
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (h.kind === 'axe') {
    var L = 13; c.strokeStyle = '#6a4a30'; c.lineWidth = 1.7; c.beginPath(); c.moveTo(x - ca * 3, y - sa * 3); c.lineTo(x + ca * L, y + sa * L); c.stroke();
    c.strokeStyle = 'rgba(35,26,22,0.6)'; c.lineWidth = 0.5; c.stroke();
    var hx = x + ca * (L - 1), hy = y + sa * (L - 1), px = -sa, py = ca; c.fillStyle = '#6e7076'; c.beginPath(); c.moveTo(hx - ca * 2 + px * 0.5, hy - sa * 2 + py * 0.5); c.lineTo(hx + ca * 1.5 + px * 1, hy + sa * 1.5 + py * 1); c.lineTo(hx + ca * 1.2 + px * 5, hy + sa * 1.2 + py * 5); c.lineTo(hx - ca * 2.6 + px * 4.5, hy - sa * 2.6 + py * 4.5); c.closePath(); c.fill(); c.strokeStyle = 'rgba(35,26,22,0.75)'; c.lineWidth = 0.55; c.stroke();
  } else if (h.kind === 'bucket') {
    c.strokeStyle = 'rgba(60,50,40,0.9)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 2.2); c.stroke();
    c.fillStyle = '#8a6a44'; c.beginPath(); c.moveTo(x - 3, y + 2.2); c.lineTo(x + 3, y + 2.2); c.lineTo(x + 2.5, y + 7.5); c.lineTo(x - 2.5, y + 7.5); c.closePath(); c.fill(); c.strokeStyle = 'rgba(35,26,22,0.75)'; c.lineWidth = 0.55; c.stroke();
    c.strokeStyle = 'rgba(35,26,22,0.4)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x - 1, y + 2.4); c.lineTo(x - 0.8, y + 7.3); c.moveTo(x + 1, y + 2.4); c.lineTo(x + 0.8, y + 7.3); c.stroke();
    c.strokeStyle = '#5a5a60'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 3, y + 4); c.lineTo(x + 3, y + 4); c.stroke();
  } else if (h.kind === 'broom') {
    var L2 = 20; c.strokeStyle = '#8a6a44'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x - ca * 8, y - sa * 8); c.lineTo(x + ca * L2, y + sa * L2); c.stroke(); c.strokeStyle = 'rgba(35,26,22,0.5)'; c.lineWidth = 0.4; c.stroke();
    var bx = x + ca * L2, by = y + sa * L2, i; c.strokeStyle = '#c9a85c'; c.lineWidth = 0.9; c.beginPath(); for (i = -3; i <= 3; i++) { c.moveTo(bx - ca * 2, by - sa * 2); c.lineTo(bx + ca * 4 + (-sa) * i * 1.1 + (h.sw || 0) * 0.1, by + sa * 4 + ca * i * 1.1 + 0.5); } c.stroke();
    c.strokeStyle = 'rgba(35,26,22,0.5)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(bx - ca * 1.5 - sa * 2, by - sa * 1.5 + ca * 2); c.lineTo(bx - ca * 1.5 + sa * 2, by - sa * 1.5 - ca * 2); c.stroke();
  } else if (h.kind === 'rod') {
    var L3 = 26; c.strokeStyle = '#7a5a3a'; c.lineWidth = 1.0; c.beginPath(); c.moveTo(x - ca * 4, y - sa * 4); c.lineTo(x + ca * L3, y + sa * L3); c.stroke();
    var tx = x + ca * L3, ty = y + sa * L3; c.strokeStyle = 'rgba(240,236,220,0.7)'; c.lineWidth = 0.45; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + 1, ty + 6, tx + 0.5, ty + 12); c.stroke();
  } else if (h.kind === 'hammer') {
    var L4 = 9; c.strokeStyle = '#6a4a30'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - ca * 2, y - sa * 2); c.lineTo(x + ca * L4, y + sa * L4); c.stroke();
    var hx2 = x + ca * L4, hy2 = y + sa * L4, px2 = -sa, py2 = ca; c.fillStyle = '#5e6066'; c.beginPath(); c.moveTo(hx2 - ca * 1.6 - px2 * 2.4, hy2 - sa * 1.6 - py2 * 2.4); c.lineTo(hx2 + ca * 1.6 - px2 * 2.4, hy2 + sa * 1.6 - py2 * 2.4); c.lineTo(hx2 + ca * 1.6 + px2 * 2.4, hy2 + sa * 1.6 + py2 * 2.4); c.lineTo(hx2 - ca * 1.6 + px2 * 2.4, hy2 - sa * 1.6 + py2 * 2.4); c.closePath(); c.fill(); c.strokeStyle = 'rgba(35,26,22,0.75)'; c.lineWidth = 0.5; c.stroke();
  }
}
function figureHeld(c, x, y, dir, F, held) {                           // draw a person's held thing over the figure drawn at x, y
  if (!held) return; c.save(); c.translate(x, y); c.scale(F.spec.scale, F.spec.scale); if (dir === 'right') c.scale(-1, 1); heldD(c, held); c.restore();
}
function playerD(c, x, y, dir, an, pose) {
  if (hero().spec.figure >= 1) return inkHero(c, x, y, dir, an, pose);
  an = an || { phase: 0, amt: 0, t: 0, lx: 0, ly: 0, blink: 0, sq: 0 };
  var H = hero(), sp = H.spec, C = H.pal, lift = H.lift, LN0 = LN;
  var cOut = c, layers = null, curL = null, inkOn = INK_FIG.on && typeof c.getTransform === 'function';
  LN = inkOn ? 'rgba(35,26,22,' + INK_FIG.soft + ')' : C.line;                       // layered: inner lines are soft details, the silhouette gets the ink
  function lay(i) { if (!layers) return; curL = inkSwitch(c, layers, curL, i); c = curL.g; }
  var ph = an.phase, amt = an.amt, t = an.t;
  var SK = C.skin, SKS = C.skinD, HAIR = C.hair, COAT = C.coat, VEST = C.vest, PANTS = C.pants, PANTSD = C.pantsD, BOOT = C.boot, BR = C.trim;
  var HS = Math.round(sp.hair || 0), BS = Math.round(sp.beard || 0), HT = Math.round(sp.hat || 0), CL = Math.round(sp.clothes || 0), MT = C.matte || 0;
  var run = an.run || 0;
  var breathe = Math.sin(t * 2.2) * (1 - amt);
  var bob = -Math.abs(Math.sin(ph)) * 1.0 * amt * (1 + 0.45 * run) * sp.bob + breathe * 0.4;
  var headBob = -Math.abs(Math.sin(ph - 0.7)) * 0.7 * amt * (1 + 0.45 * run) * sp.bob + breathe * 0.5;
  var sway = Math.sin(ph) * amt;
  var side = dir === 'left' || dir === 'right', flip = dir === 'right';
  var tq = side ? 0 : Math.max(-1, Math.min(1, an.turn || 0));   // three-quarter turn: -1 toward the left, 1 toward the right
  var L = pose ? [pose.lx, pose.ly] : [an.lx || 0, an.ly || 0];
  var lxl = (flip ? -L[0] : L[0]), lyl = L[1];
  if (!side) lxl += Math.sin(ph) * amt * 0.6 * sp.sway;
  var bw = sp.bodyW * (1 - 0.1 * Math.abs(tq)), bh = sp.bodyH, ew = Math.round(sp.eyewear), es = sp.eyewearSize, hipY = -9 - lift;
  var legW = 4.4 * sp.legW, armW = 3.8 * sp.armW, armSeg = 5.2 * sp.armL, st = sp.stride;
  // hand targets arrive in figure space; undo the upper-body lift and stretch so the hand lands on them
  function loc(h) { return [((flip ? -h[0] : h[0]) - lxl) / bw, -9 + (h[1] - lyl + lift + 9) / bh]; }
  function capsule(x1, y1, x2, y2, col, w) {
    c.lineCap = 'round';
    if (!inkOn) { c.strokeStyle = LN; c.lineWidth = (w || 4.4) + 2.2; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
    c.strokeStyle = col; c.lineWidth = (w || 4.4); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  var RING_COL = [null, ['#b07a3a', '#6b4420'], ['#c9ced8', '#6f7580'], ['#d6dbe4', '#6f7580'], ['#e2b63a', '#8a6a18'], ['#c8402a', '#6a1e12']], RG = Math.round(sp.ring || 0);
  function armBand(shx, shy, ex, ey) {                     // the arm ring on the upper arm
    var rc = RING_COL[RG]; if (!rc) return; var ux = ex - shx, uy = ey - shy, ul = Math.hypot(ux, uy) || 1, bx = shx + ux * 0.52, by = shy + uy * 0.52, px = -uy / ul, py = ux / ul, hw = armW * 0.7 + 0.6;
    c.lineCap = 'butt'; c.strokeStyle = rc[1]; c.lineWidth = 2.8; c.beginPath(); c.moveTo(bx - px * hw, by - py * hw); c.lineTo(bx + px * hw, by + py * hw); c.stroke(); c.strokeStyle = rc[0]; c.lineWidth = 1.6; c.stroke(); c.lineCap = 'round';
  }
  function armTo(shx, shy, hx, hy2, px, py, ringArm) {
    var dx = hx - shx, dy = hy2 - shy, d = Math.max(0.01, Math.hypot(dx, dy)), Ls = armSeg, ex, ey;
    if (d >= 2 * Ls - 0.2) { ex = shx + dx / 2; ey = shy + dy / 2; }
    else {
      var hh = Math.sqrt(Ls * Ls - d * d / 4), nx = -dy / d, ny = dx / d;
      if (nx * px + ny * py < 0) { nx = -nx; ny = -ny; }
      ex = shx + dx / 2 + nx * hh; ey = shy + dy / 2 + ny * hh;
    }
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (!inkOn) { c.strokeStyle = LN; c.lineWidth = armW + 2.2; c.beginPath(); c.moveTo(shx, shy); c.lineTo(ex, ey); c.lineTo(hx, hy2); c.stroke(); }
    c.strokeStyle = COAT; c.lineWidth = armW; c.beginPath(); c.moveTo(shx, shy); c.lineTo(ex, ey); c.lineTo(hx, hy2); c.stroke();
    if (ringArm) armBand(shx, shy, ex, ey);
    ell(c, hx, hy2, 2.4, 2.4, SK, 1.4);
  }
  function armPose(shx, shy, h, px, py, ringArm) { var q = loc(h); armTo(shx, shy, q[0], q[1], px, py, ringArm); }

  c.save(); c.translate(x, y);
  if (flip) c.scale(-1, 1);
  var sqK = an.sq || 0; c.scale(1 + 0.14 * sqK, 1 - 0.14 * sqK);
  if (inkOn) { var M0 = c.getTransform(), fb = 26 + 10 * sp.armL; layers = [inkLayerBegin(0, M0, -fb, -62 - lift, fb * 2, 70 + lift), inkLayerBegin(1, M0, -fb, -62 - lift, fb * 2, 70 + lift), inkLayerBegin(2, M0, -fb, -62 - lift, fb * 2, 70 + lift)]; lay(1); }

  /* legs */
  if (side) {
    var legS = function (phi, col) {
      var sw = Math.sin(phi), lf = Math.max(0, Math.cos(phi)) * amt;
      var fx = -sw * 3.9 * amt * (1 + 0.3 * run) * st, fy = -1.7 - lf * 3.2 * (1 + 0.3 * run) * Math.min(1.4, st);
      capsule(0.6, hipY, fx, fy, col, legW);
      c.save(); c.translate(fx - 1.1, fy + 0.5); c.rotate(-lf * 0.35); ell(c, 0, 0, 3.5, 1.9, BOOT, 1.6); c.restore();
    };
    legS(ph + Math.PI, PANTSD); legS(ph, PANTS);
  } else {
    var dirS = dir === 'down' ? 1 : -1;
    var legF = function (sd, phi, col) {
      var sw = Math.sin(phi), lf = Math.max(0, Math.cos(phi)) * amt;
      // the lifted foot swings in toward the centre line, like a real step seen from the front
      var fx = sd * (3.3 * bw * sp.stance - lf * 0.9 * (1 - 0.5 * sp.sway)) + sw * tq * 1.8 * amt * st, fy = -1.7 + sw * dirS * (2.3 + 0.8 * run) * amt * st - lf * (2.6 + 0.8 * run) * Math.min(1.4, st);
      capsule(sd * 3.2 * bw * (0.5 + 0.5 * sp.stance), hipY, fx, fy, col, legW);
      ell(c, fx + sd * 0.4, fy + 0.5, 3.3, 1.9, BOOT, 1.6);
    };
    var swL = Math.sin(ph) * dirS, swR = Math.sin(ph + Math.PI) * dirS;
    if (swL <= swR) { legF(-1, ph, PANTS); legF(1, ph + Math.PI, PANTS); } else { legF(1, ph + Math.PI, PANTS); legF(-1, ph, PANTS); }
  }

  /* upper body: lifted by the leg length, stretched about the hips */
  c.save();
  c.translate(lxl, (pose ? lyl : lyl + bob) - lift);
  c.translate(0, -9);
  var rot = side ? sway * 0.025 : sway * 0.04 * sp.sway;
  c.rotate(rot);
  c.scale((1 - 0.012 * breathe) * bw, (1 + 0.03 * breathe) * bh);
  c.translate(0, 9);
  var hy = -26 + (headBob - bob);
  function head(hairFn, faceFn, view) {
    c.save();
    c.translate(0, hy + 9); c.scale(sp.headW / bw, sp.headH / bh); c.translate(0, -(hy + 9));
    c.translate(0, hy); c.rotate(-rot * 1.6 + (side ? 0 : sway * 0.02 * sp.sway)); c.translate(0, -hy);
    if (HS === 2 || HS === 3 || HS === 8) longHair(view);     // long hair, braids and the mane hang beside the head, under it
    if (HS === 7 || HS === 8) bigHair(view);                  // hair with volume stands out past the head
    c.beginPath(); c.ellipse(0, hy, 10, 9, 0, 0, Math.PI * 2); c.fillStyle = SK; c.fill();
    c.save(); c.clip();
    c.fillStyle = SKS; c.fillRect(-12, hy - 12, 24, 24);
    c.fillStyle = SK; c.beginPath(); c.ellipse(-1.6, hy - 1.6, 10, 9, 0, 0, Math.PI * 2); c.fill();
    if (HS !== 5 && HT !== 1) hairFn();
    if (HS === 5 && view !== 'back') { c.fillStyle = C.hairD; c.globalAlpha = 0.35; c.fillRect(-12, hy - 4, 24, 9); c.globalAlpha = 1; c.fillStyle = SK; c.beginPath(); c.ellipse(view === 'side' ? -4 : 0, hy + 1, 8.5, 8.5, 0, 0, 7); c.fill(); }   // bald: a shadow of stubble round the sides
    if (HT === 1) hood(view);
    c.restore();
    c.beginPath(); if (HS >= 7 && HT !== 1) c.ellipse(0, hy, 10, 9, 0, Math.PI * 0.08, Math.PI * 0.92); else c.ellipse(0, hy, 10, 9, 0, 0, Math.PI * 2); c.lineWidth = 2; c.strokeStyle = LN; c.stroke();   // under big hair only the chin's edge shows
    if (HT === 1) hoodEdge(view);
    faceFn();
    if (HS === 4) knot(view); if (HS === 6) tail(view);
    if (HT >= 2) hat(view);
    c.restore();
  }
  // long hair (2) or braids (3): locks beside the head down to the shoulders; from behind one broad mass
  function longHair(view) {
    var tqv = side ? 0 : tq, i, k;
    function lock(lx, braid) {
      if (!braid) { c.beginPath(); c.ellipse(lx, hy + 8, 3.2, 8, 0, 0, 7); fs(c, HAIR, 1.6); return; }
      c.strokeStyle = LN; c.lineWidth = 5.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(lx, hy + 1); c.lineTo(lx, hy + 15); c.stroke();
      c.strokeStyle = HAIR; c.lineWidth = 3.6; c.beginPath(); c.moveTo(lx, hy + 1); c.lineTo(lx, hy + 15); c.stroke();
      c.strokeStyle = C.hairD; c.lineWidth = 1; for (k = 0; k < 4; k++) { c.beginPath(); c.moveTo(lx - 1.8, hy + 3 + k * 3.2); c.lineTo(lx + 1.8, hy + 4.6 + k * 3.2); c.stroke(); }
      ell(c, lx, hy + 16.5, 1.6, 1.6, BR, 1);
    }
    if (view === 'back') { c.beginPath(); c.moveTo(-9, hy - 2); c.quadraticCurveTo(-11, hy + 10, -7, hy + 16); c.lineTo(7, hy + 16); c.quadraticCurveTo(11, hy + 10, 9, hy - 2); c.closePath(); fs(c, HAIR, 1.6); if (HS === 3) { lock(-4.5, true); lock(4.5, true); } return; }
    if (view === 'side') { lock(3.5, HS === 3); return; }
    lock(-9 - tqv * 2, HS === 3); lock(9 - tqv * 2, HS === 3);
  }
  function bigHair(view) {                                    // a lobed mass behind the head, wider and taller than it
    var ox = view === 'side' ? 1.5 : (view === 'back' ? 0 : tq * 1.5), i;
    c.beginPath(); c.ellipse(ox, hy - 2.5, 12.6, 11, 0, 0, 7); fs(c, HAIR, 1.8);
    for (i = 0; i < 5; i++) { var a = Math.PI * (1.08 + i * 0.21), bx = ox + Math.cos(a) * 10.5, by = hy - 2.5 + Math.sin(a) * 9; c.beginPath(); c.arc(bx, by, 4.2, 0, 7); fs(c, HAIR, 1.8); }
    c.beginPath(); c.ellipse(ox, hy - 2.5, 12.6, 11, 0, 0, 7); c.fillStyle = HAIR; c.fill();
    for (i = 0; i < 5; i++) { var a2 = Math.PI * (1.08 + i * 0.21); c.beginPath(); c.arc(ox + Math.cos(a2) * 10.5, hy - 2.5 + Math.sin(a2) * 9, 4.2, 0, 7); c.fill(); }
    c.strokeStyle = C.hairL; c.lineWidth = 1.4; c.beginPath(); c.arc(ox - 2, hy - 4, 9.5, Math.PI * 1.15, Math.PI * 1.5); c.stroke();
  }
  function knot(view) {                                       // a knot of hair on top, toward the back
    var kx = view === 'side' ? 3 : (view === 'back' ? 0 : tq * 2); ell(c, kx, hy - 10, 3.4, 2.8, HAIR, 1.6); c.strokeStyle = C.hairL; c.lineWidth = 1; c.beginPath(); c.arc(kx - 0.5, hy - 10.5, 1.8, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
  }
  function tail(view) {                                       // shaved sides: the tail of hair down the back
    if (view === 'front') return; var tx = view === 'side' ? 4 : 0;
    c.strokeStyle = LN; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, hy - 1); c.quadraticCurveTo(tx + (view === 'side' ? 4 : 0), hy + 4, tx + (view === 'side' ? 3.5 : 0), hy + 12); c.stroke();
    c.strokeStyle = HAIR; c.lineWidth = 3; c.stroke(); ell(c, tx + (view === 'side' ? 5 : 0), hy + 13, 1.4, 1.4, BR, 0.9);
  }
  function hood(view) {                                       // inside the head's clip: the hood covers the hair, with the face open
    c.fillStyle = C.cloak; c.fillRect(-12, hy - 12, 24, 24);
    c.fillStyle = C.cloakD; c.fillRect(-12, hy - 12, 24, 4);
    if (view === 'back') return;
    var ox = view === 'side' ? -3.5 : tq * 2.5; c.fillStyle = SK; c.beginPath(); c.ellipse(ox, hy + 2.2, view === 'side' ? 6.5 : 7.6, 7.4, 0, 0, 7); c.fill();
    c.fillStyle = SKS; c.globalAlpha = 0.5; c.beginPath(); c.ellipse(ox, hy + 2.2, view === 'side' ? 6.5 : 7.6, 7.4, 0, Math.PI * 1.1, Math.PI * 1.9); c.fill(); c.globalAlpha = 1;
  }
  function hoodEdge(view) { if (view === 'back') return; var ox = view === 'side' ? -3.5 : tq * 2.5; c.beginPath(); c.ellipse(ox, hy + 2.2, view === 'side' ? 6.5 : 7.6, 7.4, 0, 0, 7); c.lineWidth = 1.4; c.strokeStyle = LN; c.stroke(); }
  function hat(view) {                                        // over the hair: a leather cap, a nasal helmet, a fur hat or a headband
    var fx = view === 'side' ? -4 : tq * 3.3;
    if (HT === 2) { c.beginPath(); c.ellipse(0, hy - 5, 10.6, 6.6, 0, Math.PI, Math.PI * 2); c.closePath(); fs(c, BOOT, 1.6); rr(c, -11, hy - 6, 22, 2.6, 1, shade(BOOT, -0.08), 1.2); }
    else if (HT === 3) { c.beginPath(); c.ellipse(0, hy - 5, 10.8, 7.2, 0, Math.PI, Math.PI * 2); c.closePath(); fs(c, C.iron, 1.6); rr(c, -11.2, hy - 6.2, 22.4, 2.8, 1, C.ironD, 1.2); if (view !== 'back') rr(c, fx - 1.2, hy - 4.5, 2.4, 8.5, 0.8, C.ironD, 1.1); c.strokeStyle = 'rgba(255,255,255,' + (0.35 * (1 - 0.6 * MT)) + ')'; c.lineWidth = 1.2; c.beginPath(); c.arc(-2, hy - 5, 7, Math.PI * 1.15, Math.PI * 1.55); c.stroke(); }
    else if (HT === 4) { c.beginPath(); c.ellipse(0, hy - 7, 11.4, 7.6, 0, 0, 7); fs(c, C.fur, 1.6); c.fillStyle = C.furD; for (var i = -10; i <= 10; i += 3) { c.beginPath(); c.moveTo(i, hy - 1.5); c.lineTo(i + 1.5, hy + 1.8); c.lineTo(i + 3, hy - 1.5); c.closePath(); c.fill(); } rr(c, -11, hy - 3.5, 22, 2.6, 1, C.furD, 1.1); }
    else if (HT === 5) { rr(c, -10.6, hy - 6.5, 21.2, 2.4, 1, BR, 1.1); if (view !== 'back') ell(c, fx, hy - 5.3, 1.3, 1.3, C.trimL, 0.8); }
  }
  // the beard, in the face's own space: full (1), short (2), long and braided (3), a moustache (4)
  function beard(view, fo) {
    if (!BS) return; var hairD = C.hairD;
    if (view === 'back') { if (BS === 1 || BS === 3) for (var bs = -1; bs <= 1; bs += 2) { c.beginPath(); c.ellipse(bs * 8.2, hy + 8.4, 2.6, 3.6, bs * 0.3, 0, Math.PI * 2); fs(c, HAIR, 1.4); } return; }
    if (view === 'side') {
      if (BS === 4) { c.strokeStyle = hairD; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-8.5, hy + 6.4); c.quadraticCurveTo(-5, hy + 5.4, -2.5, hy + 7); c.stroke(); return; }
      if (BS === 2) { c.beginPath(); c.moveTo(-9.6, hy + 4.4); c.quadraticCurveTo(-10.5, hy + 11, -5.5, hy + 13); c.quadraticCurveTo(-0.5, hy + 11.5, 1.5, hy + 7); c.quadraticCurveTo(-3, hy + 8.5, -9.6, hy + 4.4); c.closePath(); fs(c, HAIR, 1.6); return; }
      c.beginPath(); c.moveTo(-9.6, hy + 3.4); c.quadraticCurveTo(-11.5, hy + 13, -5.5, hy + 17.5); c.quadraticCurveTo(0.5, hy + 14, 2.5, hy + 5); c.quadraticCurveTo(-3, hy + 7.5, -9.6, hy + 3.4); c.closePath(); fs(c, HAIR, 1.6); c.strokeStyle = hairD; c.lineWidth = 1; c.beginPath(); c.moveTo(-7, hy + 9); c.lineTo(-6, hy + 14); c.moveTo(-4, hy + 8); c.lineTo(-3, hy + 13); c.stroke();
      if (BS === 3) braidDown(-5, hy + 16);
      return;
    }
    if (BS === 4) { c.strokeStyle = hairD; c.lineWidth = 1.7; c.lineCap = 'round'; c.beginPath(); c.moveTo(fo - 5.5, hy + 6.6); c.quadraticCurveTo(fo - 2.5, hy + 4.8, fo, hy + 6.4); c.quadraticCurveTo(fo + 2.5, hy + 4.8, fo + 5.5, hy + 6.6); c.stroke(); return; }
    if (BS === 2) { c.beginPath(); c.moveTo(-9.2, hy + 4.6); c.quadraticCurveTo(-9.5, hy + 11.5, fo * 0.8, hy + 13.5); c.quadraticCurveTo(9.5, hy + 11.5, 9.2, hy + 4.6); c.quadraticCurveTo(5 + fo, hy + 8.4, fo, hy + 6.6); c.quadraticCurveTo(-5 + fo, hy + 8.4, -9.2, hy + 4.6); c.closePath(); fs(c, HAIR, 1.6); return; }
    c.beginPath(); c.moveTo(-9.2, hy + 3.6); c.quadraticCurveTo(-10, hy + 13, fo * 0.8, hy + 18.5); c.quadraticCurveTo(10, hy + 13, 9.2, hy + 3.6); c.quadraticCurveTo(5 + fo, hy + 7.6, fo, hy + 5.6); c.quadraticCurveTo(-5 + fo, hy + 7.6, -9.2, hy + 3.6); c.closePath(); fs(c, HAIR, 1.6);
    c.strokeStyle = hairD; c.lineWidth = 1; c.beginPath(); c.moveTo(fo - 4, hy + 9); c.lineTo(fo - 3.5, hy + 15); c.moveTo(fo + 4, hy + 9); c.lineTo(fo + 3.5, hy + 15); c.stroke();
    if (BS === 3) braidDown(fo * 0.8, hy + 17);
  }
  function braidDown(bx0, by0) {
    c.strokeStyle = LN; c.lineWidth = 4.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx0, by0 - 1); c.lineTo(bx0, by0 + 7); c.stroke();
    c.strokeStyle = HAIR; c.lineWidth = 2.8; c.beginPath(); c.moveTo(bx0, by0 - 1); c.lineTo(bx0, by0 + 7); c.stroke();
    c.strokeStyle = C.hairD; c.lineWidth = 0.9; for (var k = 0; k < 3; k++) { c.beginPath(); c.moveTo(bx0 - 1.4, by0 + k * 2.4); c.lineTo(bx0 + 1.4, by0 + 1.2 + k * 2.4); c.stroke(); }
    ell(c, bx0, by0 + 8.2, 1.4, 1.4, BR, 0.9);
  }
  // the clothes on the body, side view (sw1 is the walk's sway) and front or back view
  function torsoSide(sw1) {
    if (CL === 2) { c.beginPath(); c.moveTo(-2, -19); c.quadraticCurveTo(-10, -12, -9, -3); c.lineTo(1, -3); c.quadraticCurveTo(3, -10, 3, -18); c.closePath(); fs(c, C.cloak, 1.6); }
    if (CL === 0) { flap(2, 0.3 * sw1 - (an.lvx || 0) * 0.004, 6); rr(c, -5.5, -19, 11, 12, 4.5, COAT, 1.8); rr(c, -0.5, -17, 5, 8, 2, VEST, 0); rr(c, -5.5, -12, 11, 2.4, 1, BR, 1.2); return; }
    if (CL === 3) { c.beginPath(); c.moveTo(-5.5, -19); c.lineTo(-7.5, -2); c.lineTo(7.5, -2); c.lineTo(5.5, -19); c.closePath(); fs(c, C.dress, 1.8); rr(c, -5.5, -19, 11, 5, 2.5, COAT, 1.4); c.strokeStyle = C.dressD; c.lineWidth = 1; c.beginPath(); c.moveTo(-3, -15); c.lineTo(-4.5, -2); c.stroke(); ell(c, -2.5, -15.5, 1.7, 2.2, C.trimL, 1); return; }
    rr(c, -5.5, -19, 11, 14, 4, COAT, 1.8); c.strokeStyle = C.coatD; c.lineWidth = 1; c.beginPath(); c.moveTo(-5.5, -8); c.lineTo(5.5, -8); c.stroke();
    if (CL === 4) { c.beginPath(); c.moveTo(-5.5, -19); c.lineTo(-5.5, -9); c.lineTo(-3.5, -11); c.lineTo(-1.5, -8.5); c.lineTo(0.5, -11); c.lineTo(2.5, -8.5); c.lineTo(4.5, -11); c.lineTo(5.5, -9); c.lineTo(5.5, -19); c.closePath(); fs(c, C.fur, 1.5); }
    rr(c, -5.5, -11.5, 11, 2.4, 1, BR, 1.2); if (CL === 2) ell(c, -3, -17.5, 1.8, 1.8, C.trimL, 1);
  }
  function torsoFront(fsw, back) {
    if (CL === 2 && !back) { c.beginPath(); c.moveTo(-8, -19); c.quadraticCurveTo(-12, -10, -11, -3); c.lineTo(11, -3); c.quadraticCurveTo(12, -10, 8, -19); c.closePath(); fs(c, C.cloak, 1.6); }
    if (CL === 0) {
      flap(-5, -0.14 - fsw, 5.4); flap(5, 0.14 + fsw, 5.4);
      rr(c, -7.5, -19, 15, 12, 4.5, COAT, 1.8);
      if (!back) rr(c, -3 + tq * 2.4, -19, 6, 11, 2, VEST, 0); else { rr(c, -5 - tq * 1.6, -18, 10, 8, 2.5, VEST, 1.4); ell(c, -tq * 1.6, -14, 1.6, 1.6, BR, 1); }
      rr(c, -7.5, -12, 15, 2.5, 1, BR, 1.3);
      if (!back) rr(c, -1.6 + tq * 2.8, -12.4, 3.2, 3.2, 1, C.trimL, 1.1);
      return;
    }
    if (CL === 3) {
      c.beginPath(); c.moveTo(-7.5, -19); c.lineTo(-10, -2); c.lineTo(10, -2); c.lineTo(7.5, -19); c.closePath(); fs(c, C.dress, 1.8);
      rr(c, -7.5, -19, 15, 5, 2.5, COAT, 1.4);
      c.strokeStyle = C.dressD; c.lineWidth = 1; c.beginPath(); c.moveTo(-4 + tq, -15); c.lineTo(-5.5 + tq, -2); c.moveTo(4 + tq, -15); c.lineTo(5.5 + tq, -2); c.stroke();
      if (!back) { ell(c, -3.8 + tq * 2, -15.5, 1.8, 2.3, C.trimL, 1); ell(c, 3.8 + tq * 2, -15.5, 1.8, 2.3, C.trimL, 1); c.strokeStyle = BR; c.lineWidth = 1; c.beginPath(); c.moveTo(-2.2 + tq * 2, -14.6); c.quadraticCurveTo(tq * 2, -13.4, 2.2 + tq * 2, -14.6); c.stroke(); }
      return;
    }
    rr(c, -7.5, -19, 15, 14, 4, COAT, 1.8); c.strokeStyle = C.coatD; c.lineWidth = 1; c.beginPath(); c.moveTo(-7.5, -8); c.lineTo(7.5, -8); c.stroke();
    if (!back) { c.strokeStyle = C.coatD; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-2.5 + tq * 2.4, -19); c.lineTo(tq * 2.4, -15.5); c.lineTo(2.5 + tq * 2.4, -19); c.stroke(); }
    if (CL === 4) { c.beginPath(); c.moveTo(-7, -19); c.lineTo(-7, -9); c.lineTo(-5, -11); c.lineTo(-3, -8.5); c.lineTo(-1, -11); c.lineTo(1, -8.5); c.lineTo(3, -11); c.lineTo(5, -8.5); c.lineTo(7, -11); c.lineTo(7, -19); c.closePath(); fs(c, C.fur, 1.5); if (!back) { c.strokeStyle = C.furD; c.lineWidth = 1; c.beginPath(); c.moveTo(tq * 2, -18); c.lineTo(tq * 2, -10); c.stroke(); } }
    if (CL === 2 && back) { c.beginPath(); c.moveTo(-8, -19); c.quadraticCurveTo(-12, -10, -11, -3); c.lineTo(11, -3); c.quadraticCurveTo(12, -10, 8, -19); c.closePath(); fs(c, C.cloak, 1.6); c.strokeStyle = C.cloakD; c.lineWidth = 1; c.beginPath(); c.moveTo(-3, -16); c.lineTo(-5, -3); c.moveTo(3, -16); c.lineTo(5, -3); c.stroke(); return; }
    rr(c, -7.5, -11.5, 15, 2.5, 1, BR, 1.3); if (!back) rr(c, -1.6 + tq * 2.8, -11.9, 3.2, 3.2, 1, C.trimL, 1.1);
    if (CL === 2 && !back) ell(c, 5.5 + tq * 1.5, -17.5, 1.9, 1.9, C.trimL, 1);
  }
  var gOff = (headBob - bob) * -0.4 + Math.sin(ph - 1.6) * amt * 0.25;
  function lensAt(gx, gy, r) {
    ell(c, gx, gy, r, r, C.rim, 1.6);
    ell(c, gx, gy, r * 0.64, r * 0.64, C.lens, 0);
    ell(c, gx - r * 0.22, gy - r * 0.22, r * 0.22, r * 0.22, '#ffffff', 0);
  }
  function wire(x1, y1, x2, y2, col, w) { c.strokeStyle = col; c.lineWidth = w || 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  // eyewear: 0 none, 1 goggles pushed up, 2 goggles worn, 3 round glasses, 4 square glasses, 5 shades, 6 monocle
  // xs: eye positions; back: x where the arm or strap ends (null in the front view)
  function eyewear(xs, upXs, back) {
    var ey = hy + 2.6, i, r;
    if (ew === 1) { for (i = 0; i < upXs.length; i++) lensAt(upXs[i], hy - 8.2 + gOff, 3.6 * es); return; }
    if (ew === 2) {
      c.fillStyle = C.strap; if (back == null) c.fillRect(-9.3, ey - 1, 18.6, 2); else c.fillRect(xs[0], ey - 1, back - xs[0], 2);
      for (i = 0; i < xs.length; i++) lensAt(xs[i], ey, 3.5 * es);
    } else if (ew === 3 || ew === 4) {
      r = 3.2 * es;
      var col = ew === 3 ? C.rim : LN;
      if (back == null) wire(xs[0] + r, ey, xs[1] - r, ey, col); else wire(xs[0] + r, ey, back, ey - 0.6, col);
      for (i = 0; i < xs.length; i++) {
        c.beginPath(); if (ew === 3) c.arc(xs[i], ey, r, 0, Math.PI * 2); else pathRR(c, xs[i] - r, ey - r * 0.85, r * 2, r * 1.7, 1);
        c.fillStyle = 'rgba(255,255,255,0.22)'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = col; c.stroke();
      }
    } else if (ew === 5) {
      r = 2.6 * es;
      if (back == null) rr(c, -8, ey - r, 16, r * 2, 1.6, LN, 0); else { wire(xs[0], ey - r * 0.4, back, ey - r * 0.6, LN, 1.4); rr(c, xs[0] - 4, ey - r, 7, r * 2, 1.6, LN, 0); }
      c.fillStyle = C.lens; for (i = 0; i < xs.length; i++) c.fillRect(xs[i] - 2, ey - r * 0.55, 2.2, 1);
    } else if (ew === 6) {
      r = 3.2 * es; var mx = xs[xs.length - 1];
      c.beginPath(); c.arc(mx, ey, r, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,0.22)'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = C.rim; c.stroke();
      if (back == null) wire(mx + r * 0.7, ey + r * 0.7, mx + r * 0.9, ey + r + 5, C.rim, 0.9);
    }
  }
  var bl = 1 - (an.blink || 0) * 0.88;
  function eye(ex) {
    c.fillStyle = C.eye; c.beginPath(); c.ellipse(ex, hy + 2.6, 1.7 * sp.eyeSize, 2.4 * bl * sp.eyeSize, 0, 0, Math.PI * 2); c.fill();
    if (bl > 0.5) { c.fillStyle = 'rgba(255,255,255,' + (1 - 0.5 * MT) + ')'; c.beginPath(); c.arc(ex - 0.5 * sp.eyeSize, hy + 2.6 - sp.eyeSize, 0.7 * sp.eyeSize * (1 - 0.3 * MT), 0, Math.PI * 2); c.fill(); }
  }
  function blush(bx) { if (!sp.blush) return; c.fillStyle = 'rgba(255,120,135,' + (0.5 - 0.3 * MT) + ')'; c.beginPath(); c.ellipse(bx, hy + 6.2, 2, 1.2, 0, 0, Math.PI * 2); c.fill(); }
  function strap() { if (ew === 1) { c.fillStyle = C.strap; c.fillRect(-12, hy - 7, 24, 2.2); } else if (ew === 2 && dir === 'up') { c.fillStyle = C.strap; c.fillRect(-12, hy + 1.6, 24, 2); } }
  function drawSheath() {
    if (!pose || !pose.sheath) return;
    var T, Hh;
    if (side) { T = [-2, -8]; Hh = [8, -19]; } else if (dir === 'down') { T = [-7, -7]; Hh = [7, -23]; } else { T = [5, -8]; Hh = [-8, -19]; }
    var ux = Hh[0] - T[0], uy = Hh[1] - T[1], ul = Math.hypot(ux, uy); ux /= ul; uy /= ul;
    var px = -uy, py = ux;
    capsule(T[0], T[1], Hh[0], Hh[1], '#7a5236', 3.0);
    ell(c, T[0], T[1], 1.8, 1.8, BR, 1.2);
    c.lineCap = 'round';
    c.strokeStyle = LN; c.lineWidth = 4.8; c.beginPath(); c.moveTo(Hh[0] - px * 3.4, Hh[1] - py * 3.4); c.lineTo(Hh[0] + px * 3.4, Hh[1] + py * 3.4); c.stroke();
    c.strokeStyle = C.trimL; c.lineWidth = 2.6; c.beginPath(); c.moveTo(Hh[0] - px * 3.4, Hh[1] - py * 3.4); c.lineTo(Hh[0] + px * 3.4, Hh[1] + py * 3.4); c.stroke();
    capsule(Hh[0] + ux * 0.5, Hh[1] + uy * 0.5, Hh[0] + ux * 4.6, Hh[1] + uy * 4.6, '#8a5a3a', 2.8);
    ell(c, Hh[0] + ux * 5.7, Hh[1] + uy * 5.7, 1.7, 1.7, BR, 1.2);
  }
  function flap(fx, ang, w) { c.save(); c.translate(fx, -9); c.rotate(ang); rr(c, -w / 2, -0.5, w, 6.2, 2.2, COAT, 1.5); c.restore(); }

  if (side) {
    var sw1 = Math.sin(ph) * amt;
    lay(0); if (pose && pose.far) armPose(0.8, -17, pose.far, 1, 0.5);
    lay(1); drawSheath();
    torsoSide(sw1);
    lay(2);
    if (pose && pose.near) armPose(0, -17, pose.near, 0.6, 1, true);
    else {
      var aa = -Math.sin(ph) * 0.65 * amt * (1 + 0.35 * run) * sp.armSwing;
      var rr0 = (9.3 - Math.max(0, Math.sin(aa)) * 1.9) * sp.armL;
      var hx2 = -Math.sin(aa) * rr0, hy3 = -17 + Math.cos(aa) * rr0 - Math.max(0, Math.sin(aa)) * 1.2 - (1 - amt) * 0.4;
      armTo(0, -17, hx2, hy3, 1, 0.3, true);
    }
    lay(1);
    head(function () {
      c.fillStyle = HAIR;
      if (HS === 1) { c.fillRect(-12, hy - 12, 24, 8.5); c.beginPath(); c.ellipse(5 + sw1 * 0.6, hy - 1, 6.5, 5, 0, 0, Math.PI * 2); c.fill(); }
      else if (HS === 4) { c.fillRect(-12, hy - 12, 24, 9); c.beginPath(); c.ellipse(5 + sw1 * 0.6, hy, 6.5, 6, 0, 0, Math.PI * 2); c.fill(); }
      else if (HS === 6) { c.fillRect(-4, hy - 12, 10, 8); c.beginPath(); c.ellipse(3, hy - 6, 6, 5, 0, 0, 7); c.fill(); }
      else { c.fillRect(-12, hy - 12, 24, 11.5); c.beginPath(); c.ellipse(5 + sw1 * 0.6, hy + 1, 6.5, 8.5, 0, 0, Math.PI * 2); c.fill(); }
      if (HS >= 7) { c.fillRect(-12, hy - 12, 24, 13); c.beginPath(); c.ellipse(6 + sw1 * 0.6, hy + 2, 7, 9.5, 0, 0, 7); c.fill(); }
      if (HS !== 6) for (var i = 0; i < 3; i++) { c.beginPath(); c.arc(-8 + i * 3, hy - 1.5 - (HS === 1 ? 2 : 0), 2.3, 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = C.hairL; c.lineWidth = 1.3; c.beginPath(); c.arc(-2, hy - 1, 7.5, Math.PI * 1.15, Math.PI * 1.6); c.stroke();
      strap();
    }, function () {
      eye(-4.5); blush(-7);
      c.strokeStyle = '#9b4a3a'; c.lineWidth = 1.1; c.beginPath(); c.arc(-5.8, hy + 8.2, 1.4, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
      eyewear([-4.5], [3, -1.5], 4);
      beard('side', 0);
      if (false) { c.beginPath(); c.moveTo(-9.6, hy + 3.4); c.quadraticCurveTo(-11.5, hy + 13, -5.5, hy + 17.5); c.quadraticCurveTo(0.5, hy + 14, 2.5, hy + 5); c.quadraticCurveTo(-3, hy + 7.5, -9.6, hy + 3.4); c.closePath(); fs(c, HAIR, 1.6); c.strokeStyle = C.hairD; c.lineWidth = 1; c.beginPath(); c.moveTo(-6, hy + 9); c.lineTo(-5.4, hy + 14.5); c.moveTo(-2.4, hy + 9); c.lineTo(-3, hy + 13.5); c.stroke(); }
    }, 'side');
  } else {
    var sw2 = Math.sin(ph) * amt;
    // arms swing opposite to the legs (same-side arm and leg moving together reads as a waddle)
    var aL = -Math.sin(ph) * dirS_(dir) * amt * sp.armSwing, aR = -aL;
    var hx0 = (dir === 'up' ? 8.4 : 9.4) - (1 - Math.min(1, sp.sway)) * 0.9, handY = -17 + 9 * sp.armL;
    var ringL = dir === 'up', ringR = dir !== 'up';
    var armLf = function () { if (pose && pose.armL) armPose(-6.5, -17, pose.armL, -0.7, 1, ringL); else armTo(-6.5, -17, -hx0 + aL * 0.5 * sp.sway, handY + aL * 1.3 * (1 + 0.4 * run) - Math.max(0, aL) * 0.4, -1, 0.4, ringL); };
    var armRf = function () { if (pose && pose.armR) armPose(6.5, -17, pose.armR, 0.7, 1, ringR); else armTo(6.5, -17, hx0 - aR * 0.5 * sp.sway, handY + aR * 1.3 * (1 + 0.4 * run) - Math.max(0, aR) * 0.4, 1, 0.4, ringR); };
    // which arm is behind the body: both from the back, the far one when turned
    var backL = dir === 'up' ? tq > -0.35 : tq < -0.35, backR = dir === 'up' ? tq < 0.35 : tq > 0.35;
    lay(0);
    if (backL && !(pose && pose.armL)) armLf();
    if (backR && !(pose && pose.armR)) armRf();
    lay(1);
    if (dir === 'down') drawSheath();
    var fsw = sw2 * 0.28 * Math.min(1, 0.25 + sp.sway);
    torsoFront(fsw, dir === 'up');
    if (dir === 'up') drawSheath();
    lay(2);
    if (!backL || (pose && pose.armL)) armLf();
    if (!backR || (pose && pose.armR)) armRf();
    lay(1);
    if (dir === 'down') {
      head(function () {
        c.fillStyle = HAIR;
        var top = HS === 1 ? 8.5 : (HS === 4 ? 9 : 10.5);
        if (HS === 6) { c.fillRect(-4.5 + tq * 2, hy - 12, 9, 8); c.beginPath(); c.ellipse(tq * 2, hy - 5, 5, 3.5, 0, 0, 7); c.fill(); }
        else {
          c.fillRect(-12, hy - 12, 24, top);
          for (var i = -3; i <= 3; i++) { c.beginPath(); c.arc(i * 3.4, hy - 1.5 - (HS === 1 ? 2 : 0), 2.3, 0, Math.PI * 2); c.fill(); }
          if (HS >= 7) { c.fillRect(-12, hy - 12, 24, 12.5); }
          if (HS !== 1 && HS !== 4) { c.beginPath(); c.ellipse(-9 - sw2 * 0.4, hy + 1, (HS >= 7 ? 3.6 : 2.5) + Math.max(0, tq) * 3.4, (HS >= 7 ? 8 : 6) + Math.max(0, tq) * 2, 0, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.ellipse(9 - sw2 * 0.4, hy + 1, (HS >= 7 ? 3.6 : 2.5) + Math.max(0, -tq) * 3.4, (HS >= 7 ? 8 : 6) + Math.max(0, -tq) * 2, 0, 0, Math.PI * 2); c.fill(); }
        }
        c.strokeStyle = C.hairL; c.lineWidth = 1.3; c.beginPath(); c.arc(-1, hy - 1, 7.5, Math.PI * 1.1, Math.PI * 1.55); c.stroke();
        strap();
      }, function () {
        var fo = tq * 3.3;                       // the face slides toward the side he is turned to
        eye(-4 + fo); eye(4 + fo); if (tq < 0.3) blush(-6.6 + fo * (tq < 0 ? 0.4 : 1)); if (tq > -0.3) blush(6.6 + fo * (tq > 0 ? 0.4 : 1));
        c.strokeStyle = '#9b4a3a'; c.lineWidth = 1.1; c.beginPath(); c.arc(fo * 1.15, hy + 7.4, 1.8, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
        eyewear([-4 + fo, 4 + fo], [-5 + fo, 5 + fo], null);
        beard('front', fo);
        if (false) { c.beginPath(); c.moveTo(-9.2, hy + 3.6); c.quadraticCurveTo(-10, hy + 13, fo * 0.8, hy + 18.5); c.quadraticCurveTo(10, hy + 13, 9.2, hy + 3.6); c.quadraticCurveTo(5 + fo, hy + 7.6, fo, hy + 5.6); c.quadraticCurveTo(-5 + fo, hy + 7.6, -9.2, hy + 3.6); c.closePath(); fs(c, HAIR, 1.6); c.strokeStyle = C.hairD; c.lineWidth = 1; c.beginPath(); c.moveTo(-3 + fo * 0.8, hy + 10); c.lineTo(-2.2 + fo * 0.8, hy + 15.5); c.moveTo(3 + fo * 0.8, hy + 10); c.lineTo(2.2 + fo * 0.8, hy + 15.5); c.stroke(); }
      }, 'front');
    } else {
      head(function () {
        c.fillStyle = HAIR;
        if (HS === 1 || HS === 4) { c.fillRect(-12, hy - 12, 24, 17); c.fillStyle = SK; c.fillRect(-12, hy + 5, 24, 8); c.fillStyle = HAIR; }
        else if (HS === 6) { c.fillRect(-4, hy - 12, 8, 24); c.fillStyle = C.hairD; c.fillRect(-12, hy - 12, 24, 3); c.fillStyle = HAIR; }
        else c.fillRect(-12, hy - 12, 24, 24);
        if (HS !== 6) { c.fillStyle = C.hairD; c.globalAlpha = 0.55; c.beginPath(); c.ellipse(3 + sw2 * 0.5 - tq * 3, hy + (HS === 1 || HS === 4 ? 1 : 4), 9, HS === 1 || HS === 4 ? 5 : 7, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
        if (Math.abs(tq) > 0.05) { c.fillStyle = SK; c.beginPath(); c.ellipse((tq > 0 ? 1 : -1) * 10.6, hy + 3.6, 4.4 * Math.abs(tq), 5.2, 0, 0, Math.PI * 2); c.fill(); }   // a glimpse of cheek
        c.strokeStyle = C.hairL; c.lineWidth = 1.3; c.beginPath(); c.arc(-1, hy, 7.5, Math.PI * 1.1, Math.PI * 1.55); c.stroke();
        strap();
      }, function () { beard('back', 0); }, 'back');
    }
  }
  c.restore();
  if (layers) { var li; for (li = 0; li < 3; li++) inkLayerEnd(cOut, layers[li], li, INK_FIG.line, INK_FIG); c = cOut; }
  c.restore();
  LN = LN0;
}
function dirS_(dir) { return dir === 'down' ? 1 : -1; }

/* ---------- creatures (monsters, bosses, critters) in the same smooth outlined style as the hero ----------
   One spec drives five body plans. creatureD(c, x, y, s, H) draws creature H (from makeCreature; the current setCreature one if left out) with its feet at
   (x, y); s = { t, move 0..1, phase, dir 1 or -1, look [x, y], state, k } where state is an enemy state from
   src/combat.js ('idle', 'chase', 'windup', 'lunge', 'recover', 'stagger', 'stunned') and k is how far through it.
   plan: 0 blob, 1 critter (four legs), 2 brute (upright), 3 floater, 4 crawler (many legs), 5 animal and 6 snake (see animal3D)
   eyeStyle: 0 round, 1 glowing, 2 angry, 3 sleepy    mouth: 0 none, 1 line, 2 fangs, 3 maw
   top: 0 none, 1 nubs, 2 horns, 3 antennae, 4 spikes, 5 gear    tail: 0 none, 1 stub, 2 long, 3 spiked
   pattern: 0 none, 1 belly, 2 spots, 3 stripes    tell (how it warns before attacking): 0 swell, 1 shake, 2 rear up, 3 eye glow
   behave: 0 lunger, 1 brute, 2 shooter, 3 grazer that runs away (which enemy AI drives it in the arena)
   aggro: how close the hero must come before it reacts */
var CREATURE_DEF = {
  plan: 0, size: 1, bodyW: 1, bodyH: 1, head: 1, legLen: 1, legW: 1, legs: 6, armLen: 1,
  eyes: 2, eyeStyle: 0, eyeSize: 1, mouth: 1, top: 0, tail: 0, pattern: 1,
  bob: 1, stepRate: 1, wobble: 1, hover: 1, tell: 0, mark: 1,
  behave: 0, speed: 1, windup: 0.55, lunge: 1, hp: 4, aggro: 80,
  neck: 1, neckUp: 0.4, snout: 1, snoutW: 1, ears: 1, antlers: 0, antlerSize: 1, tusks: 0, hump: 0, mane: 0, hoof: 0, tailPale: 0, paleMuzzle: 0, snoutFlat: 0, fangs: 0, brow: 0,
  trollHair: 1, trollNose: 1, trollEars: 1, trollHunch: 1, trollArms: 1, trollMoss: 0.6, trollAge: 0.7, trollBelly: 1, trollBeads: 1, trollSack: 0, trollTail: 1,
  hue: 0, sat: 1, lum: 1,
  col: { body: '#7fb86a', belly: '#d9e8a8', accent: '#f1ead6', eye: '#2a1c2a', glow: '#ff6a3a', line: '#4a3326', moss: '#8fa86a' }
};
var curCreature = null;
function mixHex(a, b, t) {
  var p = hex(a), q = hex(b), o = '#', i;
  for (i = 0; i < 3; i++) { var v = Math.round(p[i] + (q[i] - p[i]) * t).toString(16); o += v.length < 2 ? '0' + v : v; }
  return o;
}
// The animals of the first biome. Each is a set of changes on top of CREATURE_DEF.
var ANIMALS = {
  boar: { name: 'Wild boar', set: { plan: 5, bodyH: 1.15, head: 1.15, legLen: 0.75, legW: 1.1, neck: 0.6, neckUp: 0.05, snout: 1.25, ears: 1, tusks: 1, hump: 0.8, mane: 1, hoof: 1, snoutFlat: 1, brow: 1, tail: 2, pattern: 0, eyeSize: 0.8, tell: 1, speed: 1.25, lunge: 1.6, windup: 0.6, hp: 12, aggro: 70 },
    col: { body: '#5b4636', belly: '#7a6350', accent: '#efe6cf', eye: '#1e1418', glow: '#ff5a3a' } },
  deer: { name: 'Deer', set: { plan: 5, size: 1.05, bodyW: 0.95, bodyH: 0.9, head: 0.85, legLen: 1.45, legW: 0.75, neck: 1.3, neckUp: 0.95, snout: 1.05, snoutW: 0.8, ears: 3, antlers: 2, hoof: 1, tail: 1, tailPale: 1, pattern: 1, eyeSize: 0.9, behave: 3, speed: 1.7, stepRate: 1.3, hp: 5, aggro: 95 },
    col: { body: '#a8713f', belly: '#ead9bd', accent: '#d9c9a6', eye: '#1e1418', glow: '#ffd34d' } },
  bear: { name: 'Bear', set: { plan: 5, size: 1.5, bodyW: 1.1, bodyH: 1.3, head: 1.2, legLen: 0.8, legW: 1.6, neck: 0.6, neckUp: 0.2, snout: 0.9, snoutW: 1.05, ears: 2, hump: 1, tail: 1, pattern: 0, paleMuzzle: 1, fangs: 1, eyeSize: 0.75, tell: 2, speed: 0.9, lunge: 1.2, windup: 0.75, hp: 30, aggro: 85 },
    col: { body: '#5a3d28', belly: '#b8946a', accent: '#efe6cf', eye: '#1e1418', glow: '#ff5a3a' } },
  snake: { name: 'Snake', set: { plan: 6, size: 0.9, pattern: 2, fangs: 1, wobble: 1, speed: 0.9, lunge: 1.5, windup: 0.5, hp: 3, aggro: 45 },
    col: { body: '#8a8f78', belly: '#d9d5bd', accent: '#efe6cf', eye: '#1e1418', glow: '#ff5a3a' } },
  moose: { name: 'Moose', set: { plan: 5, size: 1.6, bodyW: 1.05, bodyH: 1.1, head: 1.1, legLen: 1.7, legW: 0.9, neck: 1, neckUp: 0.55, snout: 1.5, snoutW: 1.2, ears: 3, antlers: 3, antlerSize: 1.15, hump: 1.2, hoof: 1, tail: 1, pattern: 0, eyeSize: 0.75, tell: 1, lunge: 1.3, windup: 0.7, hp: 26, aggro: 70 },
    col: { body: '#4f3b2c', belly: '#8a7a6a', accent: '#cdbb98', eye: '#1e1418', glow: '#ff5a3a' } },
  troll: { name: 'Mountain troll', set: { plan: 8, size: 2.2, speed: 0.6, windup: 1.6, lunge: 0, hp: 80, aggro: 130, tell: 1, trollHair: 1.1, trollMoss: 0.8, trollAge: 0.75 },   // the boulder troll after Bauer (2026-10-07)
    col: { body: '#776c60', belly: '#9a9082', accent: '#5a4a3a', eye: '#ffd34d', glow: '#ff8a3a', line: '#2a2824', moss: '#86a062' } },
  trollStone: { name: 'Stone troll', set: { plan: 8, size: 2.2, speed: 0.6, windup: 1.6, lunge: 0, hp: 80, aggro: 130, tell: 1, trollHair: 1.1, trollAge: 0.75 },
    col: { body: '#8c8c92', belly: '#a6a6ac', accent: '#6e6e74', eye: '#8c8c92', glow: '#8c8c92', line: '#3a3a40', moss: '#8c8c92' } },
  trollForest: { name: 'Forest troll', set: { plan: 9, size: 2.1, speed: 0.75, windup: 1.4, lunge: 0, hp: 60, aggro: 150, tell: 1, trollHair: 1.0, trollMoss: 0.7, trollAge: 0.25, trollHunch: 1 },   // after Kittelsen (2026-10-07)
    col: { body: '#5a5046', belly: '#6e6658', accent: '#3e3630', eye: '#e8e0a0', glow: '#ffb040', line: '#241e1a', moss: '#7a9a5a' } },
  trollOld: { name: 'Mountain troll (old)', set: { plan: 7, size: 2.05, speed: 0.6, windup: 1.6, lunge: 0, hp: 80, aggro: 130, tell: 1, trollHair: 1.2, trollMoss: 0.7, trollAge: 0.75 },   // the first troll, kept for comparison
    col: { body: '#7a7064', belly: '#9a9082', accent: '#5a4636', eye: '#ffd34d', glow: '#ff8a3a', line: '#2a2824', moss: '#8fa86a' } },
  wolf: { name: 'Wolf', set: { plan: 5, size: 1.05, bodyH: 0.9, legLen: 1.15, legW: 0.85, neck: 0.9, neckUp: 0.45, snout: 1.2, snoutW: 0.8, ears: 1, tail: 3, pattern: 1, paleMuzzle: 1, fangs: 1, brow: 1, eyeSize: 0.85, tell: 0, speed: 1.5, stepRate: 1.4, lunge: 1.4, windup: 0.35, hp: 22, aggro: 220 },
    col: { body: '#727982', belly: '#d3d7dc', accent: '#f1ead6', eye: '#3a2a10', glow: '#ffd34d' } }
};
// How each animal fights (read by botAI in combat.js through e.cfg.atk). The boar charges straight past you and turns
// slowly; wolves circle at a distance and bite in turns; the adder strikes short and its bite lingers; the bear rears,
// then a heavy swipe in front; the moose lowers its head and gores with a step, and turns slowly. The deer flees.
var ATTACKS = {
  boar: { kind: 'charge', windup: 0.6, dur: 0.55, speed: 330, from: 150, recover: 1.1, cd: 1.2, turn: 2.4 },
  snake: { kind: 'lunge', windup: 0.5, dur: 0.14, speed: 330, near: 34, recover: 1.2, cd: 1.5, venom: 4, venomDmg: 2 },
  troll: { kind: 'arc', windup: 1.6, dur: 0.6, reach: 62, arc: 3.8, hitAt: 0.45, step: 30, recover: 2.2, cd: 2.6, heavy: true, turn: 1.4 },   // a great slow sweep of the arm, wide as he is
  wolf: { kind: 'lunge', windup: 0.25, dur: 0.2, speed: 320, ring: 70, recover: 0.4, cd: 0.8, pack: true },
  moose: { kind: 'arc', windup: 0.7, dur: 0.35, reach: 30, arc: 1.7, hitAt: 0.4, step: 120, recover: 0.9, cd: 1.3, turn: 2.6 },
  bear: { kind: 'arc', windup: 0.9, dur: 0.3, reach: 26, arc: 2.1, hitAt: 0.35, step: 50, recover: 1.0, cd: 1.5, heavy: true }
};
function animalAttack(key) { return ATTACKS[key] || (key && key.slice(0, 5) === 'troll' ? ATTACKS.troll : null); }
// The Creature Editor's "Update in game": an animal's look and numbers replaced by a spec (the game's ANIMALS table keeps its
// own counts, damage and drops). Keys the drawing does not know are dropped.
function useAnimal(key, spec) {
  var a = ANIMALS[key]; if (!a || !spec) return false; var set = {}, k;
  for (k in spec) if (k !== 'col' && CREATURE_DEF[k] != null) set[k] = spec[k];
  a.set = set; a.col = {}; for (k in spec.col || {}) a.col[k] = spec.col[k]; return true;
}
function animalSpec(key) {
  var a = ANIMALS[key] || ANIMALS.wolf, sp = fillSpec(CREATURE_DEF, null), k;
  for (k in a.set) sp[k] = a.set[k];
  for (k in a.col) sp.col[k] = a.col[k];
  return sp;
}
// A creature ready to draw: its spec plus the colours worked out from it. creatureD takes one of these, so
// several different animals can be on screen at once; without one it draws the creature set by setCreature.
function makeCreature(spec) {
  var sp = fillSpec(CREATURE_DEF, spec), C = {}, k;
  for (k in sp.col) { var q = toHsl(sp.col[k]); C[k] = k === 'line' ? sp.col[k] : fromHsl(q[0] + sp.hue, q[1] * sp.sat, q[2] * sp.lum); }
  return { spec: sp, pal: C };
}
function setCreature(spec) { curCreature = makeCreature(spec); return curCreature.spec; }
function creature() { if (!curCreature) setCreature(); return curCreature; }

/* ---------- animals: four-legged beasts and snakes, with real proportions, at any heading ----------
   Used by creatureD for plan 5 (animal) and plan 6 (snake). Extra spec keys:
   neck (length), neckUp (0 carried low like a boar, 1 held high like a deer), snout (length), snoutW (thickness),
   ears: 0 none, 1 pointed, 2 round, 3 long    antlers: 0 none, 1 spikes, 2 deer, 3 moose
   tusks 0/1, hump (shoulder hump, 0..1.5), mane 0/1 (bristles along the back),
   tail: 0 none, 1 stub, 2 thin, 3 bushy    pattern: 0 plain, 1 pale belly, 2 spots, 3 stripes */
/* An animal at any heading (s.ang, radians: 0 faces right, a quarter turn faces the camera). The animal is laid out
   in its own space: f along its length (forward), sd across it, h up from the ground. pt() turns that to the
   heading and flattens depth, so one drawing covers every direction and it can turn smoothly, like the ships.
   Parts are drawn far to near: which legs, ears and antlers are behind the body depends on the heading. */
function animal3D(c, x, y, s, H) {
  var sp = H.spec, C = H.pal, LN0 = LN;
  LN = C.line;
  var ca = Math.cos(s.ang), sa = Math.sin(s.ang), KD = 0.62;
  var t = s.t || 0, mv = s.move || 0, ph = s.phase || 0, st = s.state || 'idle', k = Math.max(0, Math.min(1, s.k || 0));
  var bw = sp.bodyW, bh = sp.bodyH, hd = sp.head, ll = sp.legLen, lw = 3 * sp.legW, T = Math.round(sp.tell), i, sd;
  var tell = st === 'windup' ? k : 0, down = st === 'recover' || st === 'stunned', lunge = st === 'lunge';
  var body = down ? mixHex(C.body, '#b6a592', 0.5) : (tell ? mixHex(C.body, C.glow, tell * 0.25) : C.body), bodyD = shade(body, -0.09);
  function pt(f, d, h) { return [f * ca - d * sa, (f * sa + d * ca) * KD - h]; }
  function depth(f, d) { return f * sa + d * ca; }          // how far toward the camera
  function seg(p, q, col, w, bare) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (!bare) { c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1] + 0.01); c.stroke(); }
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1] + 0.01); c.stroke();
  }
  function bent(pts, col, w) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (var pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? col : LN; c.lineWidth = pass ? w : w + 2.2; c.beginPath(); for (var n = 0; n < pts.length; n++) { if (n) c.lineTo(pts[n][0], pts[n][1]); else c.moveTo(pts[n][0], pts[n][1]); } c.stroke(); }
  }
  function poly(pts, col, lwd) { c.beginPath(); for (var n = 0; n < pts.length; n++) { if (n) c.lineTo(pts[n][0], pts[n][1]); else c.moveTo(pts[n][0], pts[n][1]); } c.closePath(); fs(c, col, lwd == null ? 1.3 : lwd); }
  function eyeAt(ex, ey, r) {
    if (down) { c.strokeStyle = LN; c.lineWidth = 1.1; c.lineCap = 'round'; c.beginPath(); c.moveTo(ex - r, ey - r); c.lineTo(ex + r, ey + r); c.moveTo(ex + r, ey - r); c.lineTo(ex - r, ey + r); c.stroke(); return; }
    c.fillStyle = tell ? mixHex(C.eye, C.glow, tell) : C.eye; c.beginPath(); c.ellipse(ex, ey, r, r * 1.1, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(ex - r * 0.3, ey - r * 0.4, r * 0.32, 0, Math.PI * 2); c.fill();
  }
  H.eyes = [];                                                 // where the eyes were drawn, for the page (glowing eyes at night)
  c.save(); c.translate(x + (tell && T === 1 ? Math.sin(t * 70) * 1.3 * tell : 0), y); c.scale(sp.size, sp.size);

  if (Math.round(sp.plan) === 6) {
    /* snake: a winding body on the ground, head raised; it coils back and gapes before it strikes */
    var n = 16, pts = [], rear = tell * 5 + (lunge ? -2 : 0), reach = lunge ? 7 : -tell * 4, len = 2.5 * bw;
    for (i = 0; i <= n; i++) {
      var u = i / n, wv = Math.sin(i * 0.8 - ph * 1.3 - t * (mv ? 0 : 0.6)) * (2.6 + 1.4 * mv) * sp.wobble * (1 - u * 0.5), nk = Math.max(0, u - 0.72) / 0.28;
      pts.push(pt(-n * len * 0.5 + i * len + nk * reach, wv / KD * 0.8, 2.2 * bh + nk * nk * (7 * sp.neck + rear)));
    }
    for (var pass = 0; pass < 2; pass++) for (i = 0; i < n; i++) {
      var w2 = 4.6 * bh * (0.35 + 0.65 * Math.sin(Math.PI * Math.pow((i + 0.5) / n, 0.8)));
      c.lineCap = 'round'; c.strokeStyle = pass ? body : LN; c.lineWidth = pass ? w2 : w2 + 2.2;
      c.beginPath(); c.moveTo(pts[i][0], pts[i][1]); c.lineTo(pts[i + 1][0], pts[i + 1][1]); c.stroke();
    }
    var pat = Math.round(sp.pattern);
    if (pat) { c.fillStyle = pat === 1 ? C.belly : bodyD; for (i = 2; i < n - 2; i++) { var a0 = pts[i]; c.beginPath(); c.ellipse(a0[0], a0[1], 1.4 * bh, 1.1 * bh, 0, 0, Math.PI * 2); c.fill(); } }
    var hp = pts[n], gape = Math.max(tell, lunge ? 1 : 0);
    c.save(); c.translate(hp[0], hp[1]); c.rotate(Math.atan2(sa * KD, ca)); if (ca < 0) c.scale(1, -1);
    if (gape > 0.2) { poly([[1, 0], [6.5 * hd, 1 + 3.2 * gape], [2, 2.4]], '#7a2a34', 1.1); poly([[4.4 * hd, 0.4], [5 * hd, 2.6 * gape], [5.6 * hd, 0.4]], '#ffffff', 0.6); }
    c.beginPath(); c.ellipse(2.4 * hd, -0.6, 4.4 * hd * sp.snout * 0.8 + 1, 2.8 * hd, 0, 0, Math.PI * 2); fs(c, body, 1.5);
    if (Math.abs(sa) > 0.75) { eyeAt(3.2 * hd, -1.5, 0.85 * sp.eyeSize); eyeAt(3.2 * hd, 0.5, 0.85 * sp.eyeSize); } else eyeAt(3.2 * hd, -1.4, 0.95 * sp.eyeSize);
    if (!down && (t * 1.3 % 1 < 0.35 || gape > 0)) { var tx = 6.4 * hd * sp.snout * 0.8 + 2.4; c.strokeStyle = '#c23a3a'; c.lineWidth = 0.9; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx - 1.5, 0); c.lineTo(tx + 1.6, 0.2); c.lineTo(tx + 3.2, -1); c.moveTo(tx + 1.6, 0.2); c.lineTo(tx + 3.2, 1.3); c.stroke(); }
    c.restore();
    if (st === 'stunned') for (i = 0; i < 3; i++) { var sa2 = t * 5 + i * 2.09; ell(c, hp[0] + Math.cos(sa2) * 7, hp[1] - 9 + Math.sin(sa2) * 2.2, 1.4, 1.4, '#ffd34d', 0.9); }
    if (tell && sp.mark) { ell(c, hp[0], hp[1] - 13, 4.4, 4.4, '#ffd34d', 1.5); c.fillStyle = LN; c.font = 'bold 7px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('!', hp[0], hp[1] - 10.4); }
    c.restore(); LN = LN0; return;
  }

  /* four-legged animal */
  var L = 9 * ll, rx = 12.5 * bw, ry = 6 * bh, hl = Math.max(2, rx - ry * 0.8), step = Math.abs(Math.sin(ph)) * mv, hum = Math.max(0, sp.hump);
  var bodyH = L + ry * 0.82 + step * 1.1 * sp.bob - Math.sin(t * 2.2) * 0.25 * sp.wobble, lean = 0, rear = 0;
  if (tell) { if (T === 2) rear = tell; else if (T === 0) { bodyH -= 2.4 * tell; lean = -2.5 * tell; } else lean = -1.5 * tell; }
  if (lunge) lean = 4;
  if (st === 'stagger') bodyH -= 2;
  var chestH = bodyH + rear * hl * 0.66;                    // a bear rears up before it strikes
  function leg(front, side, phase) {
    var sw = Math.sin(ph + phase) * 0.55 * mv, lift = Math.max(0, Math.cos(ph + phase)) * 2.6 * mv, f0 = front ? rx * 0.62 : -rx * 0.66, d0 = side * ry * 0.5;
    var hipH = (front ? chestH : bodyH) - ry * 0.35, ff = f0 + Math.sin(sw) * L * 0.85 + (lunge ? (front ? 4 : -4) : 0), fh = lift, kf = (f0 + ff) / 2 + (front ? 1.4 : -2.2) * ll, kh = (hipH + fh) / 2 - 0.5;
    if (rear && front) { ff += 5 * rear; fh += 9 * rear; kf += 4 * rear; kh += 6 * rear; }
    var far = (Math.abs(ca) > 0.3 ? side * ca : f0 * sa) < 0, foot = pt(ff + 0.7, d0, fh + 0.9);
    bent([pt(f0, d0, hipH), pt(kf, d0, kh), pt(ff, d0, fh + 1.2)], far ? bodyD : body, lw * (far ? 0.92 : 1));
    ell(c, foot[0], foot[1], lw * 0.62 + 0.6, 1.5, sp.hoof ? shade(C.eye, 0.05) : bodyD, 1.2);
  }
  // a leg is behind the body when it is on the far side of it; seen end-on, when it is at the far end
  var legs = [[false, -1, Math.PI], [true, -1, 0], [false, 1, 0], [true, 1, Math.PI]].map(function (q) { var f0 = q[0] ? rx * 0.62 : -rx * 0.66; return { q: q, d: depth(f0, q[1] * ry * 0.5), behind: Math.abs(ca) > 0.3 ? q[1] * ca < 0 : f0 * sa < 0 }; });
  legs.sort(function (p, q) { return p.d - q.d; });
  function drawLegs(near) { legs.forEach(function (g) { if (g.behind !== near) leg(g.q[0], g.q[1], g.q[2]); }); }

  function tail() {
    var kind = Math.round(sp.tail), wag = Math.sin(t * 5) * (mv ? 1.2 : 0.6), tf = -hl - ry * 0.7 + lean, th = bodyH + ry * 0.25, p0 = pt(tf, 0, th);
    if (kind === 1) ell(c, p0[0], p0[1], 2.6, 2.4, sp.tailPale ? C.belly : shade(body, 0.05), 1.3);
    else if (kind === 2) { var p2 = pt(tf - 5, wag, th - 6); bent([p0, pt(tf - 3.5, wag * 0.5, th - 1), p2], bodyD, 1.5); ell(c, p2[0], p2[1] + 1, 1.5, 2, shade(C.eye, 0.05), 1); }
    else if (kind === 3) { var p3 = pt(tf - 9, wag * 1.5, th - 8); seg(pt(tf + 2, 0, th), p3, body, 4.2); ell(c, p3[0], p3[1], 1.6, 1.6, C.belly, 0); }
  }
  function trunk() {
    var r0 = pt(-hl + lean, 0, bodyH), c0 = pt(hl + lean, 0, chestH), hw = 2 * ry * (0.62 + 0.3 * hum), h0 = pt(hl * 0.05 + lean, 0, bodyH + ry * 0.42), h1 = pt(hl * 0.8 + lean, 0, chestH + ry * 0.42), pass, pat2 = Math.round(sp.pattern);
    for (pass = 0; pass < 2; pass++) {                       // outlines first, then the fills, so hump and body merge
      c.lineCap = 'round'; c.strokeStyle = pass ? body : LN;
      if (hum > 0.05) { c.lineWidth = hw + (pass ? 0 : 3.6); c.beginPath(); c.moveTo(h0[0], h0[1]); c.lineTo(h1[0], h1[1] + 0.01); c.stroke(); }
      c.lineWidth = 2 * ry + (pass ? 0 : 3.6); c.beginPath(); c.moveTo(r0[0], r0[1]); c.lineTo(c0[0], c0[1] + 0.01); c.stroke();
    }
    if (Math.abs(ca) > 0.5) seg(pt(-hl * 0.85 + lean, 0, bodyH - ry * 0.52), pt(hl * 0.85 + lean, 0, chestH - ry * 0.52), pat2 === 1 ? C.belly : bodyD, ry * 0.78 * Math.abs(ca), true);   // the underside, when seen from the side
    if (pat2 === 2) { c.fillStyle = C.belly; [[-0.7, 0.35], [-0.3, 0.1], [0.1, 0.4], [0.5, 0.12], [-0.9, -0.05], [0.0, -0.2], [0.8, 0.5]].forEach(function (q) { var p = pt(q[0] * hl + lean, 0, bodyH + q[1] * ry); c.beginPath(); c.ellipse(p[0], p[1], 1.5, 1.2, 0, 0, Math.PI * 2); c.fill(); }); }
    else if (pat2 === 3) { for (i = -2; i <= 2; i++) seg(pt(i * hl * 0.4 + lean, 0, bodyH + ry * 0.9), pt(i * hl * 0.4 + 1.5 + lean, 0, bodyH - ry * 0.1), bodyD, 1.8, true); }
    seg(pt(-hl * 0.6 + lean, 0, bodyH + ry * 0.55), pt(hl * 0.35 + lean, 0, chestH + ry * 0.55), 'rgba(255,255,255,0.16)', ry * 0.36, true);
    if (sp.mane) for (i = 0; i < 8; i++) { var mf = (-0.4 + i * 0.2) * hl + lean, mh = bodyH + ry + (i > 3 ? hum * ry * 0.3 : 0); seg(pt(mf, 0, mh - 1.2), pt(mf - 1.6, 0, mh + 2.6), bodyD, 1.5, true); }
  }
  /* neck and head */
  var up = Math.max(0, Math.min(1, sp.neckUp)), na = -0.12 - up * 1.0 + (tell && T !== 2 ? 0.35 * tell : 0) + (lunge ? 0.3 : 0), nl = 6.5 * sp.neck * (0.7 + 0.5 * up);
  var nf0 = rx * 0.72 + ry * 0.2 + lean, nh0 = chestH + ry * 0.25, hf = nf0 + Math.cos(na) * nl + 2.2 * hd, hh = nh0 - Math.sin(na) * nl + 1.2 * hd, nw = (6.2 + 2.2 * (1 - up)) * bh * 0.9;
  var ht = 0.16 + (1 - up) * 0.2 + (tell && T !== 2 ? 0.2 * tell : 0), hr = 4.5 * hd, sl = 5.4 * sp.snout * hd, sw2 = 2.9 * hd * sp.snoutW, ears = Math.round(sp.ears), ant = Math.round(sp.antlers), a2 = sp.antlerSize || 1;
  var HP = pt(hf, 0, hh), top = Math.min(HP[1] - hr, pt(hl, 0, chestH + ry)[1]) - (ant ? 13 * a2 : 5) - 4;
  var headFar = sa < -0.3;
  function out(side) { return [-sa * side, ca * KD * side]; }               // the way "sideways out from the head" points on screen
  function ear(side) {
    var b = pt(hf - hr * 0.45, side * hr * 0.6, hh + hr * 0.7), o = out(side), col = depth(0, side) < -0.01 ? bodyD : body;
    if (ears === 1) poly([[b[0] - 2.2, b[1] + 1.2], [b[0] + o[0] * 1.3, b[1] - 5.6 * hd + o[1]], [b[0] + 2.2, b[1] + 0.8]], col);
    else if (ears === 2) ell(c, b[0] + o[0] * 0.5, b[1] - 0.4 + o[1] * 0.5, 2.5 * hd, 2.5 * hd, col, 1.3);
    else if (ears === 3) { var dx = o[0] - ca * 0.75, dy = o[1] - sa * KD * 0.75 - 0.55, dl = Math.hypot(dx, dy) || 1; c.save(); c.translate(b[0] + dx / dl * 3.2 * hd, b[1] + dy / dl * 3.2 * hd); c.rotate(Math.atan2(dy, dx)); ell(c, 0, 0, 4.2 * hd, 1.8 * hd, col, 1.3); c.restore(); }
  }
  function antler(side) {
    if (!ant) return;
    var b = pt(hf - hr * 0.1, side * hr * 0.45, hh + hr * 0.85), o = out(side), bk = 0.3 + 0.6 * Math.abs(ca), ux = o[0] - ca * bk, uy = o[1] * 0.4 - sa * KD * bk * 0.6, col = depth(0, side) < -0.01 ? shade(C.accent, -0.12) : C.accent;
    if (Math.abs(ux) < 0.5) ux = (ux < 0 ? -0.5 : 0.5);      // never quite edge-on
    c.save(); c.translate(b[0], b[1]); c.transform(-ux, -uy, 0, 1, 0, 0);   // the antler is drawn growing to the left, then laid along its own direction
    if (ant === 1) bent([[0, 0], [-1.5, -6 * a2]], col, 1.4);
    else if (ant === 2) {
      bent([[0, 0], [-3 * a2, -6 * a2], [-2 * a2, -12 * a2], [2 * a2, -15 * a2]], col, 1.5);
      bent([[-2.2 * a2, -4.4 * a2], [2.4 * a2, -7 * a2]], col, 1.3);
      bent([[-2.8 * a2, -9 * a2], [-6.5 * a2, -12 * a2]], col, 1.3);
      bent([[-2.1 * a2, -12 * a2], [-4.4 * a2, -16 * a2]], col, 1.2);
    } else {
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4 * a2, -3 * a2, -7 * a2, -2 * a2);
      c.lineTo(-12 * a2, -5 * a2); c.lineTo(-9.5 * a2, -7 * a2); c.lineTo(-12 * a2, -10.5 * a2); c.lineTo(-8 * a2, -10.5 * a2); c.lineTo(-7.5 * a2, -14 * a2); c.lineTo(-4.6 * a2, -11 * a2); c.lineTo(-2.6 * a2, -13.5 * a2);
      c.quadraticCurveTo(-1 * a2, -7 * a2, 1.2, -1); c.closePath(); fs(c, col, 1.3);
    }
    c.restore();
  }
  var ct = Math.cos(ht), stn = Math.sin(ht), sl2 = Math.max(0.5, sl + 1.2 - sw2), mh = hh - hr * 0.22;
  function snoutBase() {            // the shape of the snout; the skull joins onto it
    if (ant === 3) { var bl = pt(hf + hr * 0.3, 0, hh - hr * 1.05); ell(c, bl[0], bl[1], hr * 0.36, hr * 0.6, bodyD, 1.2); }          // the bell under a moose's chin
    seg(pt(hf + hr * 0.4, 0, mh), pt(hf + hr * 0.3 + sl2 * ct, 0, mh - sl2 * stn), body, 2 * sw2);
  }
  function snoutFace() {            // what is painted on it: a pale end, nose, mouth, tusks or fangs
    var tip = pt(hf + hr * 0.3 + sl2 * ct, 0, mh - sl2 * stn);
    // a pale muzzle is the same shape with its front end coloured, not a separate part
    if (sp.paleMuzzle) seg(pt(hf + hr * 0.3 + sl2 * ct * 0.5, 0, mh - sl2 * stn * 0.5), tip, C.belly, 2 * sw2 - 0.4, true);
    var np = pt(hf + hr * 0.3 + (sl + 0.6) * ct, 0, mh + sw2 * 0.3 - (sl + 0.6) * stn);
    if (sp.snoutFlat) ell(c, np[0], np[1] + sw2 * 0.3, 1.3 * Math.abs(ca) + sw2 * 0.8 * Math.abs(sa), sw2 * 0.8, shade(C.belly, -0.12), 1.2); else ell(c, np[0], np[1], 1.5 * hd, 1.25 * hd, C.eye, 0);
    if (Math.abs(ca) > 0.45) { var m0 = pt(hf + hr * 0.9, 0, mh - sw2 * 0.55), m1 = pt(hf + hr * 0.3 + sl * 0.75, 0, mh - sw2 * 0.5 - sl * 0.75 * stn - ((tell || lunge) ? 0.8 : 0)); c.strokeStyle = LN; c.lineWidth = 1; c.lineCap = 'round'; c.beginPath(); c.moveTo(m0[0], m0[1]); c.lineTo(m1[0], m1[1]); c.stroke(); }
    for (sd = -1; sd <= 1; sd += 2) {
      if (depth(0, sd) < -0.3) continue;
      var tb = pt(hf + hr * 0.3 + sl * 0.68, sd * sw2 * 0.8, mh - sw2 * 0.45 - sl * 0.68 * stn);
      if (sp.tusks) poly([[tb[0] - 1.2, tb[1]], [tb[0] + 0.4, tb[1] - sw2 * 1.2], [tb[0] + 1.3, tb[1]]], C.accent, 1);
      else if ((tell || lunge) && sp.fangs) poly([[tb[0] - 0.9, tb[1]], [tb[0], tb[1] + 2.2], [tb[0] + 0.9, tb[1]]], '#ffffff', 0.7);
    }
  }
  // The neck is drawn before the body, so the body covers the outline at its base and the two join without a line
  // between them; head() then paints the neck once more without an outline, over the body's own outline.
  function neck() { seg(pt(nf0 - 2, 0, nh0 - 1), pt(hf - 1.5 * hd, 0, hh - 0.8 * hd), body, nw); }
  function head() {
    if (headFar) neck();
    for (sd = -1; sd <= 1; sd += 2) if (depth(-hr * 0.3, sd * hr * 0.6) <= hr * 0.1) { antler(sd); ear(sd); }
    if (sa < 0.5) snoutBase();
    if (sa <= -0.35) snoutFace();
    ell(c, HP[0], HP[1], hr * 1.04, hr * 0.94, body, 1.5);
    seg(pt(nf0 - 3, 0, nh0 - 1.5), pt(hf - 0.6 * hd, 0, hh - 0.3 * hd), body, nw - 2.4, true);     // hides the seams where neck meets body and skull
    if (sa >= 0.5) snoutBase();
    if (sa > -0.35) {                // skull and snout are one shape: paint over the outline between them, then the face
      seg(pt(hf + hr * 0.15, 0, mh + hr * 0.05), pt(hf + hr * 0.4 + sl2 * 0.4 * ct, 0, mh - sl2 * 0.4 * stn), body, Math.max(1, 2 * sw2 - 2.6), true);
      snoutFace();
    }
    for (sd = -1; sd <= 1; sd += 2) {
      if (depth(hr * 0.35, sd * hr * 0.62) <= -hr * 0.22) continue;
      var e = pt(hf + hr * 0.32, sd * hr * 0.62, hh + hr * 0.5);
      H.eyes.push([x + e[0] * sp.size, y + e[1] * sp.size]);
      eyeAt(e[0], e[1], 0.95 * hd * sp.eyeSize);
      if (sp.brow) { var b0 = pt(hf, sd * hr * 0.8, hh + hr * 1.0), b1 = pt(hf + hr * 0.55, sd * hr * 0.4, hh + hr * 0.68); c.strokeStyle = LN; c.lineWidth = 1.1; c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.stroke(); }
    }
    for (sd = -1; sd <= 1; sd += 2) if (depth(-hr * 0.3, sd * hr * 0.6) > hr * 0.1) { ear(sd); antler(sd); }
  }
  if (!headFar) tail();
  if (headFar) head(); else neck();
  drawLegs(false);
  trunk();
  if (headFar) tail();
  drawLegs(true);
  if (!headFar) head();

  if (st === 'stunned') for (i = 0; i < 3; i++) { var a = t * 5 + i * 2.09; ell(c, HP[0] + Math.cos(a) * 8, top + 6 + Math.sin(a) * 2.5, 1.5, 1.5, '#ffd34d', 0.9); }
  if (tell && sp.mark) { ell(c, HP[0] * 0.6, top, 4.4, 4.4, '#ffd34d', 1.5); c.fillStyle = LN; c.font = 'bold 7px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('!', HP[0] * 0.6, top + 2.6); }
  c.restore();
  LN = LN0;
}

// The mountain troll, after the old illustrations: hunched, hairy, heavy, with arms that hang to the knees and a small
// head sunk between the shoulders. Drawn facing right and turned by s.dir; s.state and s.k (progress) give the pose:
// arms swing as it walks, rise over its head in the windup, and come down in the slam. Plan 7 of the creature spec.
/* The mountain troll, after John Bauer (2026-10-07, Robin: scarier, hairier, old and ancient; and he turns like the animals):
   a boulder of a body hunched under its own hump, long shaggy hair down the back gone grey with age, lichen and moss growing
   on it, arms so long the knuckles rest on the ground, big flat feet, a long tufted tail, a small low head with a heavy brow,
   tiny eyes, a long drooping nose and great pointed ears, a beard of strands, and the trinkets trolls hoard hanging in the
   hair: beads and a ring. Every part is laid out in his own space (forward, sideways, up) and turned to the heading s.ang
   the way animal3D does, with the parts sorted far to near, so he faces any way and turns smoothly. His blow is a great slow
   sweep of the arm across the front. Spec keys (all troll-): hair, nose, ears, hunch, arms, moss, age, belly, beads, sack, tail.
   Colours: body (skin), belly, accent (hair), moss, eye, glow (the warning), line. A stone troll has glow equal to its body. */
function trollD(c, x, y, s, H) {
  var sp = H.spec, C = H.pal, sz = sp.size * 0.95, t = s.t || 0, mv = Math.min(1, s.move || 0), ph = s.phase || 0, st = s.state || 'idle', k = Math.max(0, Math.min(1, s.k || 0));
  var ang = s.ang == null ? (s.dir < 0 ? Math.PI : 0) : s.ang, ca = Math.cos(ang), sa = Math.sin(ang), KD = 0.62;
  var wind = st === 'windup' ? k : 0, slam = st === 'lunge', down = st === 'recover' || st === 'stunned' || st === 'stagger', sweep = slam ? Math.min(1, k * 1.15) : -1;
  var bob = Math.sin(ph * 2) * 1.1 * mv + Math.sin(t * 1.6) * 0.5, lean = slam ? 3 : (wind ? -2 * wind : (down ? 1 : 0)), lw = 1.4 / sz;
  var skin = C.body, belly = C.belly, line = C.line, stone = C.glow === C.body, skinDk = mixHex(skin, '#000000', 0.18);
  var HL = sp.trollHair, NS = sp.trollNose, ER = sp.trollEars, HU = sp.trollHunch, AR = sp.trollArms, MO = stone ? 0 : sp.trollMoss, BE = sp.trollBeads && !stone, SK = sp.trollSack, TL = sp.trollTail, BL = sp.trollBelly, AGE = sp.trollAge;
  var hairCol = stone ? mixHex(skin, '#ffffff', 0.12) : mixHex(C.accent, '#d9d4c8', AGE * 0.75), hairDk = mixHex(hairCol, '#000000', 0.32), hairLt = mixHex(hairCol, '#ffffff', 0.25), moss = C.moss || '#8fa86a', lich = mixHex(moss, skin, 0.3);
  function hs(i, j) { var v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); }
  function pt(f, d, h) { return [f * ca - d * sa, (f * sa + d * ca) * KD - h]; }     // body space to the screen
  function depth(f, d) { return f * sa + d * ca; }                                    // toward the camera
  var items = [], cOut = c, layers = null, curL = null, inkOn = INK_FIG.on && typeof c.getTransform === 'function';
  if (inkOn) line = 'rgba(35,26,22,' + INK_FIG.soft + ')';                              // layered: the parts' own lines are soft details; the silhouette gets the ink
  function at(dep, fn) { items.push({ dep: dep, fn: fn }); }
  function strandAt(p, len, lean2, w, col, i) {                                      // a hanging hair from a screen point, swaying
    var sw = Math.sin(t * 1.1 + i * 1.7) * 0.05, a = 1.57 + lean2 + sw, x1 = p[0] + Math.cos(a) * len, y1 = p[1] + Math.sin(a) * len, cx = (p[0] + x1) / 2 + Math.cos(a - 1.57) * len * (0.1 + 0.1 * hs(i, 3)), cy = (p[1] + y1) / 2 + Math.sin(a - 1.57) * len * 0.1;
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke();
  }
  function hairOf(i) { return i % 3 === 0 ? hairDk : (i % 3 === 1 ? hairCol : hairLt); }
  function limb(p, q, w, col) { c.lineCap = 'round'; c.strokeStyle = line; c.lineWidth = w + 2 * lw; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); }
  function hand(f, d, h, col, up, sg) {                                              // a great knobby hand: the palm and four long fingers
    var p = pt(f, d, h); c.beginPath(); c.ellipse(p[0], p[1] - (up ? 0 : 1), 4.6, 3.2, 0, 0, 7); c.fillStyle = col; c.fill(); c.lineWidth = lw; c.strokeStyle = line; c.stroke();
    for (var i = 0; i < 4; i++) {
      var dd = d + (i - 1.5) * 2.2 * (sg || 1), L = 7.5 - Math.abs(i - 1.5) * 0.9, p0 = pt(f + 1.5, dd, h), pk = up ? pt(f + 2, dd, h + L * 0.6) : pt(f + 1.5 + L * 0.5, dd, h + 2), p1 = up ? pt(f + 3, dd, h + L) : pt(f + 1.5 + L, dd, h);
      c.strokeStyle = line; c.lineWidth = 2 + 2 * lw; c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(pk[0], pk[1], p1[0], p1[1]); c.stroke(); c.strokeStyle = i < 2 ? mixHex(col, '#000000', 0.1) : col; c.lineWidth = 2; c.stroke();
      c.fillStyle = mixHex(col, '#000000', 0.45); c.beginPath(); c.arc(p1[0], p1[1], 0.8, 0, 7); c.fill();
    }
  }
  var hump = 46 + 6 * HU, headF = 12 + lean, headH = 34 + (wind ? 2 * wind : 0) - 1.5 * (1 - HU) + bob;
  c.save(); c.translate(x, y); c.scale(sz, sz); c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = 'rgba(20,30,20,0.28)'; c.beginPath(); c.ellipse(0, 1, 21, 6, 0, 0, 7); c.fill();
  if (inkOn) { var M0 = c.getTransform(); layers = [inkLayerBegin(0, M0, -62, -118, 124, 132), inkLayerBegin(1, M0, -62, -118, 124, 132), inkLayerBegin(2, M0, -62, -118, 124, 132)]; }
  function lay(i) { if (!layers) return; curL = inkSwitch(c, layers, curL, i); c = curL.g; }
  // the tail: from the back of the body, trailing behind
  if (TL) at(depth(-20, 2), function () { var p0 = pt(-12, 0, 12 + bob), p1 = pt(-24, 3, 3 + bob), p2 = pt(-29, 2, 7 + bob + Math.sin(t * 1.4) * 1.5); c.strokeStyle = line; c.lineWidth = 2.6 + 2 * lw; c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); c.stroke(); c.strokeStyle = skinDk; c.lineWidth = 2.6; c.stroke(); for (var i = 0; i < 6; i++) strandAt(p2, 4 + 3 * hs(i, 70), (hs(i, 71) - 0.5) * 2.2 + 0.4, 1.2, hairOf(i), 70 + i); });
  // the sack on the back
  if (SK) at(depth(-9, 0), function () { var p = pt(-9, 0, hump + 4 + bob); c.fillStyle = mixHex(skin, '#b8a484', 0.55); c.beginPath(); c.ellipse(p[0], p[1], 12, 10, -0.2 * ca, 0, 7); c.fill(); c.lineWidth = lw * 1.2; c.strokeStyle = line; c.stroke(); var q = pt(-6, 0, hump + 13 + bob); c.fillStyle = mixHex(skin, '#b8a484', 0.4); c.beginPath(); c.arc(q[0], q[1], 2.4, 0, 7); c.fill(); c.stroke(); });
  // the legs and the great flat feet
  [-1, 1].forEach(function (sg) {
    var sw = Math.sin(ph) * 3 * mv * sg;
    at(depth(2, sg * 6.5) - 2, function () {
      var col = depth(2, sg * 6.5) > 0 ? skin : skinDk, hip = pt(-2, sg * 6, 15 + bob), knee = pt(1 + sw * 0.4, sg * 6.5, 6), foot = pt(4 + sw, sg * 7, 0);
      limb(hip, knee, 7.5, col);
      c.fillStyle = col; c.beginPath(); c.ellipse(foot[0], foot[1] - 1.5, 7, 3.2, ang, 0, 7); c.fill(); c.lineWidth = lw; c.strokeStyle = line; c.stroke();
      for (var i = 0; i < 3; i++) { var tp = pt(10 + sw, sg * 7 + (i - 1) * 2.4, 0); c.beginPath(); c.arc(tp[0], tp[1] - 1, 1.3, 0, 7); c.fillStyle = col; c.fill(); c.stroke(); }
      for (i = 0; i < 3 * HL; i++) strandAt(pt(0, sg * 7 + (hs(i, 80 + sg) - 0.5) * 4, 10), 5, (hs(i, 81) - 0.5) * 1.2, 1.1, hairOf(i), 80 + i);
    });
  });
  // the arms: shoulders high on the hump, knuckles on the ground in front; the right arm swings the blow
  [1, -1].forEach(function (sg) {
    var swinging = sg === 1 && (wind > 0 || slam), sw = Math.sin(ph) * 3 * mv * sg, hf, hd, hh, up = false, ef, ed, eh;
    var sf = 3 + lean * 0.3, sd = sg * 11, sh = 36 + bob - 2 * HU;
    if (swinging && slam) { var u = sweep, phi = 1.35 - u * 2.7; hf = 4 + 20 * Math.cos(phi); hd = 20 * Math.sin(phi); hh = 42 - 36 * Math.sin(u * 3.14) * 0 - 34 * u + 8 * Math.sin(u * 3.14); up = u < 0.35; }
    else if (swinging) { hf = -2; hd = 12 + 2 * wind; hh = 48 + 12 * wind; up = true; }
    else { hf = 16 + 8 * AR + sw; hd = sg * 10; hh = (down ? -1 : 0) + 1; }
    ef = up ? (sf + hf) / 2 - 2 : (sf + hf) / 2 + 2; ed = (sd + hd) / 2 + sg * 3; eh = up ? (sh + hh) / 2 + 2 : (sh + hh) / 2 - 6;
    var dep = depth(ef, ed) + (up ? 2 : 0);
    at(dep, function () {
      var col = depth(sf, sd) >= 0 ? skin : skinDk, P0 = pt(sf, sd, sh), P1 = pt(ef, ed, eh), P2 = pt(hf, hd, hh);
      if (swinging && slam && !stone) { c.save(); c.globalAlpha = 0.3 * (1 - sweep); c.strokeStyle = '#f6e2b8'; c.lineWidth = 7; c.beginPath(); for (var j = 0; j <= 10; j++) { var uu = sweep * j / 10, ph2 = 1.35 - uu * 2.7, q = pt(4 + 20 * Math.cos(ph2), 20 * Math.sin(ph2), 42 - 34 * uu + 8 * Math.sin(uu * 3.14)); if (j) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); } c.stroke(); c.restore(); }
      limb(P0, P1, 7, col); limb(P1, P2, 6, col); hand(hf, hd, hh, col, up, sg);
      for (var i = 0; i < 4 * HL; i++) { var tt = 0.15 + i * 0.18; strandAt([P0[0] + (P1[0] - P0[0]) * tt, P0[1] + (P1[1] - P0[1]) * tt + 2], 5 + 4 * HL, (hs(i, 9) - 0.5) * 0.5, 1, i % 2 ? hairDk : hairCol, i + 40); }
    });
  });
  // the body: a mound, its outline the turned ellipsoid, the hump high at the back
  at(-0.5, function () {
    var rf = 15, rd = 14, ex = Math.sqrt(rf * rf * ca * ca + rd * rd * sa * sa), ey = KD * Math.sqrt(rf * rf * sa * sa + rd * rd * ca * ca), cb = pt(-1, 0, 0), ch = pt(-5, 0, hump + bob);
    c.beginPath(); c.moveTo(cb[0] - ex, cb[1] - 9 - ey * 0.3); c.quadraticCurveTo(cb[0] - ex - 2, ch[1] + 10, ch[0] - ex * 0.55, ch[1]); c.quadraticCurveTo(ch[0], ch[1] - 5, ch[0] + ex * 0.6, ch[1] + 1); c.quadraticCurveTo(cb[0] + ex + 2, ch[1] + 12, cb[0] + ex, cb[1] - 9 - ey * 0.3); c.quadraticCurveTo(cb[0], cb[1] - 6 + ey * 0.4, cb[0] - ex, cb[1] - 9 - ey * 0.3); c.closePath();
    c.fillStyle = skin; c.fill(); c.lineWidth = lw * 1.2; c.strokeStyle = line; c.stroke();
    var front = depth(14, 0) / 14; if (front > 0) { c.save(); c.globalAlpha = Math.min(1, front); var bp = pt(8, 0, 22 + bob); c.fillStyle = belly; c.beginPath(); c.ellipse(bp[0], bp[1], (5 * BL + 1) * (0.5 + 0.5 * Math.abs(sa)) + 1, 8, 0, 0, 7); c.fill(); c.restore(); }
    c.fillStyle = mixHex(skin, '#ffffff', 0.08); c.beginPath(); c.ellipse(ch[0], ch[1] + 3, ex * 0.45, 3, 0, 0, 7); c.fill();   // light on the top of the hump
  });
  // the mane: strands anchored round the body at four heights, longer on the back half and at the hem
  var ring, n, i;
  for (ring = 0; ring < 4; ring++) {
    var h0 = hump - 2 - ring * 8, rr = 0.86 + ring * 0.05; n = Math.round(9 + 4 * HL);
    for (i = 0; i < n; i++) (function (i, ring) {
      var th = (i + 0.5 * hs(i, ring)) / n * 6.283, f = -3 + 15 * rr * Math.cos(th), d = 14 * rr * Math.sin(th), back = Math.cos(th) < -0.2, len = (back ? 8 + 7 * HL : 5 + 4 * HL) * (0.7 + 0.5 * hs(i, ring + 7)), dep = depth(f, d);
      at(dep + (dep > 0 ? 0.4 : -0.4), function () { strandAt(pt(f, d, h0 + bob), len, (hs(i, ring + 11) - 0.5) * 0.5 + (pt(f, d, 0)[0]) * 0.012, 1.15, hairOf(i + ring), i + ring * 31); });
    })(i, ring);
  }
  [[-14, -5], [-14, 5], [-11, -10], [-11, 10]].forEach(function (a, ai) { var dep = depth(a[0], a[1]); for (i = 0; i < 2 + 2 * HL; i++) (function (i) { at(dep + (dep > 0 ? 0.4 : -0.4), function () { strandAt(pt(a[0], a[1], 18 + bob), (8 + 9 * HL) * (0.6 + 0.6 * hs(i, 100 + ai)), (hs(i, 101 + ai) - 0.5) * 0.5 + a[1] * 0.02, 1.2, hairOf(i + ai), 100 + ai * 7 + i); }); })(i); });   // the hem
  // lichen on the old hump
  if (MO > 0) [[-7, -4, 3], [-3, 5, 2.6], [-10, 4, 2.2], [-1, -7, 2], [-12, -2, 1.8]].forEach(function (m, mi) { if (hs(mi, 5) > MO) return; var dep = depth(m[0], m[1]); at(dep + 0.3, function () { var p = pt(m[0], m[1], hump - 2 + bob); c.save(); c.globalAlpha = 0.8; c.fillStyle = lich; for (var d2 = 0; d2 < 4; d2++) { c.beginPath(); c.ellipse(p[0] + (hs(d2, mi) - 0.5) * m[2] * 1.6, p[1] + (hs(d2, mi + 1) - 0.5) * m[2] * 0.9, m[2] * (0.45 + 0.35 * hs(d2, mi + 2)), m[2] * 0.4, hs(d2, mi + 3) * 3, 0, 7); c.fill(); } c.fillStyle = mixHex(lich, '#ffffff', 0.3); for (d2 = 0; d2 < 3; d2++) { c.beginPath(); c.arc(p[0] + (hs(d2, mi + 4) - 0.5) * m[2] * 1.2, p[1] + (hs(d2, mi + 5) - 0.5) * m[2] * 0.6, 0.45, 0, 7); c.fill(); } c.restore(); }); });
  // the head: low in front of the hump; the ears behind it, the hair over it, the face on its front
  var hdep = depth(headF, 0);
  [-1, 1].forEach(function (sg) { var ed = depth(headF - 4, sg * 9); at(ed < hdep ? hdep - 0.2 : hdep + 0.2, function () { var col = ed >= hdep ? skin : skinDk, a0 = pt(headF - 5, sg * 6, headH + 1), a1 = pt(headF - 6, sg * (9 + 4 * ER), headH + 7 + 5 * ER), a2 = pt(headF - 0.5, sg * 4, headH + 6); c.fillStyle = col; c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.lineTo(a2[0], a2[1]); c.closePath(); c.fill(); c.lineWidth = lw; c.strokeStyle = line; c.stroke(); if (ed >= hdep) { var b0 = pt(headF - 4.5, sg * 6, headH + 2), b1 = pt(headF - 5.5, sg * (8 + 3 * ER), headH + 6 + 3.6 * ER), b2 = pt(headF - 1.5, sg * 4.5, headH + 5); c.fillStyle = mixHex(skin, '#d09a8a', 0.3); c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.lineTo(b2[0], b2[1]); c.closePath(); c.fill(); } if (BE && sg === -1 && ed >= hdep - 2) { var rp = pt(headF - 4.5, -5.5, headH + 1); c.strokeStyle = '#b08040'; c.lineWidth = 1.1; c.beginPath(); c.arc(rp[0], rp[1], 1.7, 0, 7); c.stroke(); } }); });
  at(hdep, function () {
    var hp = pt(headF, 0, headH); c.fillStyle = skin; c.beginPath(); c.ellipse(hp[0], hp[1], 8, 7, 0, 0, 7); c.fill(); c.lineWidth = lw * 1.2; c.strokeStyle = line; c.stroke();
    c.fillStyle = skinDk; c.beginPath(); c.ellipse(hp[0], hp[1] + 4, 6, 2.2, 0, 0, 7); c.fill();
    var faceDep = depth(headF + 6, 0) - hdep;                                    // the face shows as the head turns toward you
    if (faceDep > -2) {
      c.save(); c.globalAlpha = Math.min(1, (faceDep + 2) / 3);
      var bl = pt(headF + 5, -5, headH + 3.4), br = pt(headF + 5, 5, headH + 3.4), bm = pt(headF + 7.5, 0, headH + 2.6); c.strokeStyle = line; c.lineWidth = 2.2; c.beginPath(); c.moveTo(bl[0], bl[1]); c.lineTo(bm[0], bm[1]); c.lineTo(br[0], br[1]); c.stroke();
      var eyeCol = stone ? skin : (wind || slam ? C.glow : C.eye), eyes = [pt(headF + 6.5, -3.2, headH + 0.8), pt(headF + 6.5, 3.2, headH + 0.8)];
      eyes.forEach(function (ep) { if (!stone && (wind || slam)) { c.fillStyle = 'rgba(255,170,60,0.35)'; c.beginPath(); c.arc(ep[0], ep[1], 3, 0, 7); c.fill(); } c.fillStyle = eyeCol; c.beginPath(); c.arc(ep[0], ep[1], 1.15, 0, 7); c.fill(); });
      H.eyes = eyes.map(function (ep) { return [ep[0] * sz, ep[1] * sz]; });
      var n0 = pt(headF + 7, 0, headH + 2.5), n1 = pt(headF + 10 + 5 * NS, 0, headH - 2 - 4 * NS), n2 = pt(headF + 7.5, 0, headH - 3.4), nl = pt(headF + 7, -1.6, headH + 2), nr = pt(headF + 7, 1.6, headH + 2);
      c.fillStyle = mixHex(skin, '#d09a8a', 0.25); c.beginPath(); c.moveTo(nl[0], nl[1]); c.quadraticCurveTo(n1[0] - 1, n1[1] - 2, n1[0], n1[1] + 1.5); c.quadraticCurveTo(n1[0] + 1, n1[1] - 2, nr[0], nr[1]); c.quadraticCurveTo(n0[0], n2[1], nl[0], nl[1]); c.closePath(); c.fill(); c.lineWidth = lw; c.strokeStyle = line; c.stroke();
      if (AGE > 0.3) { c.fillStyle = skinDk; c.beginPath(); c.arc(n1[0] - 1, n1[1] - 1.5 - NS, 0.8, 0, 7); c.fill(); }
      var m0 = pt(headF + 6.5, -4, headH - 4.8), m1 = pt(headF + 7.5, 0, headH - 6), m2 = pt(headF + 6.5, 4, headH - 4.8); c.strokeStyle = line; c.lineWidth = 1.1; c.beginPath(); c.moveTo(m0[0], m0[1]); c.quadraticCurveTo(m1[0], m1[1], m2[0], m2[1]); c.stroke();
      var tp = pt(headF + 7, 1.5, headH - 5.3); c.fillStyle = '#efe6cf'; c.beginPath(); c.moveTo(tp[0] - 0.8, tp[1]); c.lineTo(tp[0], tp[1] + 2.1); c.lineTo(tp[0] + 0.8, tp[1]); c.closePath(); c.fill();
      for (var i = 0; i < 6 + 6 * HL; i++) strandAt(pt(headF + 5.5, -4 + 8 * hs(i, 160), headH - 5), (7 + 8 * HL) * (0.6 + 0.6 * hs(i, 161)), (hs(i, 162) - 0.5) * 0.8, 1.2, hairOf(i), 160 + i);   // the beard
      if (BE) { var b0 = pt(headF + 4, -4.5, headH - 5), b1 = pt(headF + 4, 4.5, headH - 5); c.strokeStyle = '#5a4a3a'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(b0[0], b0[1]); c.quadraticCurveTo((b0[0] + b1[0]) / 2, b0[1] + 11, b1[0], b1[1]); c.stroke(); ['#c8403a', '#3a6ab8', '#e8e0c8', '#c8403a', '#d8a030'].forEach(function (bc, bi) { var u = (bi + 1) / 6, px = b0[0] + (b1[0] - b0[0]) * u, py = b0[1] + 8.8 * Math.sin(u * 3.14); c.fillStyle = bc; c.beginPath(); c.arc(px, py, 1.05, 0, 7); c.fill(); c.lineWidth = 0.4; c.strokeStyle = line; c.stroke(); }); }
      c.restore();
    }
    for (var j = 0; j < 7 + 5 * HL; j++) { var th = (j / (7 + 5 * HL)) * 6.283, f = headF - 2 + 6 * Math.cos(th), d = 6 * Math.sin(th); if (Math.cos(th) > 0.6) continue; strandAt(pt(f, d, headH + 6), (9 + 8 * HL) * (0.6 + 0.6 * hs(j, 130)), (hs(j, 131) - 0.5) * 0.5 + pt(f, d, 0)[0] * 0.02, 1.3, hairOf(j), 130 + j); }   // the hair over the head, falling behind
  });
  items.sort(function (a, b) { return a.dep - b.dep; }); for (i = 0; i < items.length; i++) { lay(items[i].dep < -1.5 ? 0 : (items[i].dep > 1.5 ? 2 : 1)); items[i].fn(); }
  if (layers) { var li; for (li = 0; li < 3; li++) inkLayerEnd(cOut, layers[li], li, INK_FIG.line, { w: INK_FIG.w * 0.75, grain: INK_FIG.grain, shade: INK_FIG.shade }); c = cOut; }
  c.restore();
}
/* ===== The trolls drawn from scratch (2026-10-07, Robin: better than the first troll; both kinds) =====
   Two turntable models like trollD (every part laid out in body space: f forward, d sideways, h up; projected with the heading
   and sorted far to near), drawn through the ink layers so each depth band is one silhouette with one ink line.
   boulderTrollD (plan 8) is Bauer's troll: a boulder of a body with the head sunk into it, a heavy brow, a great drooping nose,
   a beard to the ground, hair hanging over the whole back like a hillside, moss and lichen and birch saplings growing on it,
   arms to the ground with enormous knobbed hands. forestTrollD (plan 9) is Kittelsen's: tall, gaunt and tree-like, bark for
   skin, a long branch of a nose, twigs and a fir sapling in its hair, twig fingers trailing on the ground. Both keep the
   troll spec keys (trollHair, trollNose, trollEars, trollArms, trollMoss, trollAge, trollBeads) and the sweep attack. */
function trollParts(c, s, sp, C) {                                    // what both trolls share: the heading, the clock, colours, helpers
  var T = {};
  T.sz = sp.size * 0.95; T.t = s.t || 0; T.mv = Math.min(1, s.move || 0); T.ph = s.phase || 0; T.st = s.state || 'idle'; T.k = Math.max(0, Math.min(1, s.k || 0));
  T.ang = s.ang == null ? (s.dir < 0 ? Math.PI : 0) : s.ang; T.ca = Math.cos(T.ang); T.sa = Math.sin(T.ang); T.KD = 0.62;
  T.wind = T.st === 'windup' ? T.k : 0; T.slam = T.st === 'lunge'; T.down = T.st === 'recover' || T.st === 'stunned' || T.st === 'stagger'; T.sweep = T.slam ? Math.min(1, T.k * 1.15) : -1;
  T.stone = C.glow === C.body; T.skin = C.body; T.skinDk = mixHex(C.body, '#1a1410', 0.2); T.skinLt = mixHex(C.body, '#fff2d0', 0.1);
  T.hairCol = T.stone ? mixHex(C.body, '#ffffff', 0.1) : mixHex(C.accent, '#cfcabd', sp.trollAge * 0.6); T.hairDk = mixHex(T.hairCol, '#000000', 0.3); T.hairLt = mixHex(T.hairCol, '#ffffff', 0.18);
  T.moss = C.moss || '#8fa86a'; T.lich = mixHex(T.moss, C.body, 0.35); T.mossLt = mixHex(T.moss, '#fff8d0', 0.3);
  T.pt = function (f, d, h) { return [f * T.ca - d * T.sa, (f * T.sa + d * T.ca) * T.KD - h]; };
  T.depth = function (f, d) { return f * T.sa + d * T.ca; };
  T.hs = function (i, j) { var v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); };
  T.items = []; T.at = function (dep, fn) { T.items.push({ dep: dep, fn: fn }); };
  T.inkOn = INK_FIG.on && typeof c.getTransform === 'function';
  T.LN = 'rgba(35,26,22,' + (T.inkOn ? Math.min(1, INK_FIG.soft + 0.15) : 0.85) + ')'; T.LNs = 'rgba(35,26,22,' + (T.inkOn ? INK_FIG.soft * 0.8 : 0.5) + ')';
  return T;
}
function trollFinish(c, T, cOut, layers, wMul) {                     // sort the parts, draw them into the layers, lay the layers down
  var items = T.items, i, cur = null;
  items.sort(function (a, b) { return a.dep - b.dep; });
  for (i = 0; i < items.length; i++) {
    if (layers) { var li = items[i].dep < -1.5 ? 0 : (items[i].dep > 1.5 ? 2 : 1); cur = inkSwitch(T.c, layers, cur, li); T.c = cur.g; }
    items[i].fn(T.c);
  }
  if (layers) { var lj; for (lj = 0; lj < 3; lj++) inkLayerEnd(cOut, layers[lj], lj, INK_FIG.line, { w: INK_FIG.w * wMul, grain: INK_FIG.grain, shade: INK_FIG.shade }); }
}
// a hand with four fingers laid on the ground (or raised): the palm, the knuckles, the fingers as tapered limbs
function trollHand(c, T, f, d, h, col, up, sg, scale, twig) {
  var pt = T.pt, p = pt(f, d, h), i, S = scale || 1;
  if (!twig) { c.fillStyle = col; c.beginPath(); c.ellipse(p[0], p[1] - (up ? 0 : 1.2 * S), 5.2 * S, 3.6 * S, 0, 0, 7); c.fill(); }
  else { c.fillStyle = col; c.beginPath(); c.ellipse(p[0], p[1] - (up ? 0 : 0.8), 3.2 * S, 2.2 * S, 0, 0, 7); c.fill(); }
  for (i = 0; i < 4; i++) {
    var dd = d + (i - 1.5) * (twig ? 1.9 : 2.5) * S * (sg || 1), L = ((twig ? 10 : 8.5) - Math.abs(i - 1.5) * 1.1) * S, w0 = (twig ? 1.5 : 2.6) * S, w1 = (twig ? 0.8 : 1.9) * S;
    var p0 = pt(f + 1.5 * S, dd, h), pk = up ? pt(f + 2 * S, dd, h + L * 0.6) : pt(f + 1.5 * S + L * 0.55, dd, h + (twig ? 3 : 2.6) * S), p1 = up ? pt(f + 3 * S, dd, h + L) : pt(f + 1.5 * S + L, dd, h);
    limbD(c, p0[0], p0[1], w0, pk[0], pk[1], w0 * 0.85, i < 2 ? mixHex(col, '#000000', 0.08) : col); limbD(c, pk[0], pk[1], w0 * 0.85, p1[0], p1[1], w1, i < 2 ? mixHex(col, '#000000', 0.08) : col);
    if (!twig) { c.fillStyle = mixHex(col, '#000000', 0.12); c.beginPath(); c.arc(pk[0], pk[1], w0 * 0.75, 0, 7); c.fill(); }   // the knuckle
    inkLine(c, [[pk[0], pk[1]], [p1[0], p1[1]]], T.LNs, 0.5);
  }
}
// a hanging strand of hair from a screen point
function trollStrand(c, T, p, len, lean, w, col, i) {
  var sw = Math.sin(T.t * 1.1 + i * 1.7) * 0.05, a = 1.57 + lean + sw, x1 = p[0] + Math.cos(a) * len, y1 = p[1] + Math.sin(a) * len, cx = (p[0] + x1) / 2 + Math.cos(a - 1.57) * len * (0.1 + 0.1 * T.hs(i, 3)), cy = (p[1] + y1) / 2 + Math.sin(a - 1.57) * len * 0.1;
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke();
}
// a jagged cape of hair hanging from a ring of points on the body: segments round the back half, each sorted by its own depth
function trollCape(T, fC, rimF, rimD, hTop, hHem, hemVar, from, to, segs, lenMul, seedBase, hemMul) {
  var i, j, HM = hemMul || 1.08;
  for (i = 0; i < segs; i++) (function (i) {
    var w = (to - from) / segs, a0 = from + w * i - w * 0.18, a1 = from + w * (i + 1) + w * 0.18, am = (a0 + a1) / 2, n = 4, pts = [], k;
    for (k = 0; k <= n; k++) { var th = a0 + (a1 - a0) * k / n; pts.push(T.pt(fC + rimF * Math.cos(th), rimD * Math.sin(th), hTop)); }
    for (k = n; k >= 0; k--) { var th2 = a0 + (a1 - a0) * k / n, hv = hHem + hemVar * (0.3 + T.hs(i * 7 + k, seedBase)) * (k % 2 ? 1 : 0.2); pts.push(T.pt(fC + rimF * HM * Math.cos(th2), rimD * HM * Math.sin(th2), hv)); }
    var dep = T.depth(fC + rimF * Math.cos(am), rimD * Math.sin(am));
    T.at(dep + (dep > 0 ? 0.3 : -0.3), function (c) {
      blobD(c, pts, T.hairCol, true);
      for (j = 0; j < 3; j++) { var th3 = a0 + (a1 - a0) * (0.2 + 0.3 * j), p = T.pt(fC + rimF * 1.05 * Math.cos(th3), rimD * 1.05 * Math.sin(th3), hHem + hemVar * 0.5); trollStrand(c, T, p, (6 + 5 * T.hs(j, i + seedBase)) * lenMul, (T.hs(j, i + 2) - 0.5) * 0.6, 1.1, j % 2 ? T.hairLt : T.hairDk, i * 9 + j + seedBase); }
    });
  })(i);
}
function trollGrowth(T, spots, hTop, MO, seedBase) {                  // lichen patches and birch saplings growing on the hump
  if (MO <= 0) return;
  spots.forEach(function (m, mi) {
    if (T.hs(mi, seedBase) > MO) return;
    var dep = T.depth(m[0], m[1]);
    T.at(dep + 0.35, function (c) {
      var p = T.pt(m[0], m[1], hTop + (m[3] || 0)), d2;
      c.globalAlpha = 0.85; c.fillStyle = T.lich; for (d2 = 0; d2 < 4; d2++) { c.beginPath(); c.ellipse(p[0] + (T.hs(d2, mi) - 0.5) * m[2] * 1.6, p[1] + (T.hs(d2, mi + 1) - 0.5) * m[2] * 0.9, m[2] * (0.45 + 0.35 * T.hs(d2, mi + 2)), m[2] * 0.42, T.hs(d2, mi + 3) * 3, 0, 7); c.fill(); }
      c.fillStyle = T.mossLt; for (d2 = 0; d2 < 3; d2++) { c.beginPath(); c.arc(p[0] + (T.hs(d2, mi + 4) - 0.5) * m[2] * 1.2, p[1] + (T.hs(d2, mi + 5) - 0.5) * m[2] * 0.6, 0.5, 0, 7); c.fill(); }
      c.globalAlpha = 1;
      if (m[4]) {                                                     // a birch sapling: a thin trunk and a few leaves
        var hgt = m[4], q = T.pt(m[0], m[1], hTop + (m[3] || 0) + hgt), lx = Math.sin(T.t * 0.9 + mi) * 1.2;
        limbD(c, p[0], p[1], 0.8, q[0] + lx, q[1], 0.45, '#d9d2c0'); var li;
        for (li = 0; li < 5; li++) { var u = 0.4 + li * 0.15, sgn = li % 2 ? 1 : -1, lxp = p[0] + (q[0] + lx - p[0]) * u + sgn * 1.6, lyp = p[1] + (q[1] - p[1]) * u - 0.4; c.fillStyle = li % 2 ? T.moss : T.mossLt; c.beginPath(); c.ellipse(lxp, lyp, 1.25, 0.8, sgn * 0.6, 0, 7); c.fill(); }
      }
    });
  });
}
// The evil face (2026-10-07, Robin: the trolls looked too happy; evil and careless, the hero is nothing to them; references
// Egerkrans's Fenrir and the classic troll masks): brows as two heavy wedges slanting down to the root of the nose, the eyes
// small and deep in dark sockets under them, one squinting; furrows between the brows; a wide sneer that climbs to one side, a
// row of crooked teeth hanging from the lip, a tusk from the jaw. F holds the projected points: eyes [l, r], brow [outerL, innerL,
// innerR, outerR] (outer high, inner low), mouth [left, middle, right], S the scale, lidSide which eye squints (1 right).
function trollEvilFace(c, T, H, F, eyeCol, glow, skin, skinDk, hairDk, sz) {
  var S = F.S || 1, i, LN = T.LN;
  for (i = 0; i < 2; i++) { var e = F.eyes[i]; c.fillStyle = mixHex(skin, '#000000', 0.32); c.beginPath(); c.ellipse(e[0], e[1] + 0.3 * S, 2.9 * S, 2.1 * S, 0, 0, 7); c.fill(); }   // the sockets
  for (i = 0; i < 2; i++) {
    var ep = F.eyes[i], squint = i === (F.lidSide == null ? 1 : F.lidSide);
    if (glow) { c.fillStyle = 'rgba(255,170,60,0.35)'; c.beginPath(); c.arc(ep[0], ep[1], 3.2 * S, 0, 7); c.fill(); }
    c.fillStyle = eyeCol; c.beginPath(); c.ellipse(ep[0], ep[1], 1.25 * S, (squint ? 0.75 : 1.05) * S, 0, 0, 7); c.fill();
    c.fillStyle = '#1a1410'; c.beginPath(); c.arc(ep[0] + 0.3 * S, ep[1], 0.45 * S, 0, 7); c.fill();                       // the pupil, a pinpoint
    c.fillStyle = mixHex(skin, '#000000', 0.22); c.beginPath(); c.ellipse(ep[0], ep[1] - (squint ? 0.9 : 1.3) * S, 1.6 * S, 0.7 * S, 0, 0, 7); c.fill();   // the lid, heavy
  }
  H.eyes = F.eyes.map(function (ep) { return [ep[0] * sz, ep[1] * sz]; });
  // the brows: heavy wedges, thick at the outer end, slanting down to a point at the root of the nose; tufted
  var b = F.brow, th = 2.8 * S, browCol = mixHex(hairDk, '#000000', 0.3);
  [[b[0], b[1], -1], [b[3], b[2], 1]].forEach(function (w, wi) {
    var o = w[0], n = w[1], pts = [[o[0], o[1] - th * 0.9], [n[0], n[1] - th * 0.35], [n[0] + w[2] * 0.4 * S, n[1] + th * 0.55], [o[0], o[1] + th * 0.9]];
    blobD(c, jagged(pts, (o[0] + n[0]) / 2, (o[1] + n[1]) / 2 + 2, 0.9 * S, 71 + wi), browCol, true);
  });
  // the furrows between the brows, up from the root of the nose
  var rx = (b[1][0] + b[2][0]) / 2, ry = (b[1][1] + b[2][1]) / 2;
  inkLine(c, [[rx - 0.9 * S, ry - 0.5 * S], [rx - 1.4 * S, ry - 3.2 * S]], LN, 0.55 * S); inkLine(c, [[rx + 0.6 * S, ry - 0.6 * S], [rx + 1.1 * S, ry - 3.4 * S]], LN, 0.55 * S); inkLine(c, [[rx - 0.2 * S, ry - 1.5 * S], [rx - 0.1 * S, ry - 4.0 * S]], T.LNs, 0.5 * S);
}
function trollSneer(c, T, F, skin, boneCol) {                       // the mouth: a snarl, the corners pulled down, the upper lip lifted in an arch, fangs hanging from it
  var S = F.S || 1, m0 = F.mouth[0], m2 = F.mouth[2], i, n = F.teeth || 6, cx = (m0[0] + m2[0]) / 2, cy = (m0[1] + m2[1]) / 2, lift = 3.2 * S, drop = 1.6 * S;
  var upY = function (u) { return (1 - u) * (1 - u) * m0[1] + 2 * (1 - u) * u * (cy - lift * 2) + u * u * m2[1]; }, upX = function (u) { return (1 - u) * (1 - u) * m0[0] + 2 * (1 - u) * u * cx + u * u * m2[0]; };
  c.fillStyle = '#1e1410'; c.beginPath(); c.moveTo(m0[0], m0[1]); c.quadraticCurveTo(cx, cy - lift * 2, m2[0], m2[1]); c.quadraticCurveTo(cx, cy + drop * 2, m0[0], m0[1]); c.closePath(); c.fill();   // the dark of the mouth
  for (i = 0; i < n; i++) {                                           // fangs hanging from the lifted lip, the ones nearest the corners the longest
    var u = (i + 0.5) / n, x = upX(u), y = upY(u) + 0.3 * S, edge = Math.abs(u - 0.5) * 2, w = (0.8 + 0.4 * T.hs(i, 201) + 0.5 * edge) * S, h = (1.4 + 1.0 * T.hs(i, 202) + 2.6 * edge * edge) * S, tilt = (T.hs(i, 203) - 0.5) * 0.6 * S;
    c.fillStyle = boneCol; c.beginPath(); c.moveTo(x - w, y - 0.3 * S); c.lineTo(x + w, y - 0.3 * S); c.lineTo(x + tilt, y + h); c.closePath(); c.fill();
  }
  [0.22, 0.78].forEach(function (u) {                                 // two tusks up from the lower jaw
    var x = upX(u), y = cy + drop * 1.2 + 0.4 * S; c.fillStyle = boneCol; c.beginPath(); c.moveTo(x - 0.9 * S, y + 0.4 * S); c.lineTo(x + 0.1 * S, y - 2.6 * S); c.lineTo(x + 1.0 * S, y + 0.4 * S); c.closePath(); c.fill();
  });
  c.strokeStyle = T.LN; c.lineWidth = 1.1 * S; c.beginPath(); c.moveTo(m0[0], m0[1]); c.quadraticCurveTo(cx, cy - lift * 2, m2[0], m2[1]); c.stroke();     // the lifted lip
  c.lineWidth = 0.9 * S; c.beginPath(); c.moveTo(m0[0], m0[1]); c.quadraticCurveTo(cx, cy + drop * 2, m2[0], m2[1]); c.stroke();                            // the lower lip
  inkLine(c, [[m0[0], m0[1]], [m0[0] - 0.8 * S, m0[1] + 2.0 * S]], T.LNs, 0.6 * S); inkLine(c, [[m2[0], m2[1]], [m2[0] + 0.8 * S, m2[1] + 2.0 * S]], T.LNs, 0.6 * S);   // the corners dragged down
  inkLine(c, [[upX(0.35), upY(0.35) - 2.2 * S], [upX(0.5), upY(0.5) - 3.4 * S], [upX(0.65), upY(0.65) - 2.2 * S]], T.LNs, 0.6 * S);                      // the lip curled under the nose
}
function boulderTrollD(c, x, y, s, H) {
  var sp = H.spec, C = H.pal, T = trollParts(c, s, sp, C), pt = T.pt, depth = T.depth, hs = T.hs, at = T.at, sz = T.sz, t = T.t, mv = T.mv, ph = T.ph, wind = T.wind, slam = T.slam, down = T.down, sweep = T.sweep, stone = T.stone;
  var skin = T.skin, skinDk = T.skinDk, LN = T.LN, LNs = T.LNs, hairCol = T.hairCol, hairDk = T.hairDk;
  var HL = sp.trollHair, NS = sp.trollNose, ER = sp.trollEars, AR = sp.trollArms, MO = stone ? 0 : sp.trollMoss, AGE = sp.trollAge, BE = sp.trollBeads && !stone;
  var bob = Math.sin(ph * 2) * 1.2 * mv + Math.sin(t * 1.3) * 0.5, lean = slam ? 3 : (wind ? -2.5 * wind : (down ? 1 : 0));
  var RF = 21, RD = 19, RH = 24, BH = 23 + bob, headF = RF - 3 + lean, i;
  c.save(); c.translate(x, y); c.scale(sz, sz); c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = 'rgba(20,30,20,0.28)'; c.beginPath(); c.ellipse(0, 1, 27, 7, 0, 0, 7); c.fill();
  var cOut = c, layers = null; T.c = c;
  if (T.inkOn) { var M0 = c.getTransform(); layers = [inkLayerBegin(0, M0, -70, -110, 140, 124), inkLayerBegin(1, M0, -70, -110, 140, 124), inkLayerBegin(2, M0, -70, -110, 140, 124)]; }
  // the feet: great flat feet under the body, three toes
  [-1, 1].forEach(function (sg) {
    var sw = Math.sin(ph) * 3 * mv * sg, fd = sg * 10;
    at(depth(6, fd) - 1, function (c) {
      var col = depth(6, fd) > 0 ? skin : skinDk, a = pt(2 + sw, fd, 9), b = pt(5 + sw, fd, 2);
      limbD(c, a[0], a[1], 5.5, b[0], b[1], 5, col);
      var f0 = 1 + sw, p = [pt(f0 - 2, fd - 4, 0), pt(f0 + 7, fd - 4.5, 0), pt(f0 + 9, fd, 0), pt(f0 + 7, fd + 4.5, 0), pt(f0 - 2, fd + 4, 0)]; blobD(c, p, col);
      for (var i2 = 0; i2 < 3; i2++) { var tp = pt(f0 + 10.5, fd + (i2 - 1) * 3.0, 0); c.fillStyle = col; c.beginPath(); c.arc(tp[0], tp[1] - 0.8, 1.6, 0, 7); c.fill(); }
      inkLine(c, [[a[0] - 2, a[1] + 1], [b[0] - 1.5, b[1] - 1]], LNs, 0.5);
    });
  });
  // the arms: shoulders high on the boulder's sides, elbows out, knuckles on the ground in front; the right arm swings the blow
  [1, -1].forEach(function (sg) {
    var swinging = sg === 1 && (wind > 0 || slam), sw = Math.sin(ph) * 3 * mv * sg, hf, hd, hh, up = false, ef, ed, eh;
    var sf = -1 + lean * 0.3, sd = sg * (RD - 1), sh = BH + 11;
    if (swinging && slam) { var u = sweep, phi = 1.35 - u * 2.7; hf = 6 + 24 * Math.cos(phi); hd = 24 * Math.sin(phi); hh = 46 - 38 * u + 8 * Math.sin(u * 3.14); up = u < 0.35; }
    else if (swinging) { hf = -3; hd = 15 + 2 * wind; hh = 52 + 14 * wind; up = true; }
    else { hf = 17 + 8 * AR + sw; hd = sg * (RD - 2); hh = (down ? -1 : 0) + 1.2; }
    ef = up ? (sf + hf) / 2 - 2 : (sf + hf) / 2 + 3; ed = (sd + hd) / 2 + sg * 5; eh = up ? (sh + hh) / 2 + 3 : (sh + hh) / 2 - 5;
    var dep = depth(ef, ed) + (up ? 2 : 0);
    at(dep, function (c) {
      var col = depth(sf, sd) >= 0 ? skin : skinDk, P0 = pt(sf, sd, sh), P1 = pt(ef, ed, eh), P2 = pt(hf, hd, hh);
      if (swinging && slam && !stone) { c.save(); c.globalAlpha = 0.3 * (1 - sweep); c.strokeStyle = '#f6e2b8'; c.lineWidth = 8; c.beginPath(); for (var j = 0; j <= 10; j++) { var uu = sweep * j / 10, ph2 = 1.35 - uu * 2.7, q = pt(6 + 24 * Math.cos(ph2), 24 * Math.sin(ph2), 46 - 38 * uu + 8 * Math.sin(uu * 3.14)); if (j) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); } c.stroke(); c.restore(); }
      limbD(c, P0[0], P0[1], 8.5, P1[0], P1[1], 7, col); limbD(c, P1[0], P1[1], 7, P2[0], P2[1], 6, col);
      c.fillStyle = mixHex(col, '#000000', 0.1); c.beginPath(); c.arc(P1[0], P1[1], 6.2, 0, 7); c.fill();                      // the elbow knob
      inkLine(c, [[P1[0] + (P2[0] - P1[0]) * 0.2, P1[1] + (P2[1] - P1[1]) * 0.2 + 3], [P1[0] + (P2[0] - P1[0]) * 0.7, P1[1] + (P2[1] - P1[1]) * 0.7 + 2.5]], LNs, 0.5);
      trollHand(c, T, hf, hd, hh, col, up, sg, 1.15, false);
      for (var i3 = 0; i3 < 3 * HL; i3++) { var tt = 0.2 + i3 * 0.22; trollStrand(c, T, [P0[0] + (P1[0] - P0[0]) * tt, P0[1] + (P1[1] - P0[1]) * tt + 3], 6 + 4 * HL, (hs(i3, 9) - 0.5) * 0.5, 1.1, i3 % 2 ? hairDk : hairCol, i3 + 40); }
    });
  });
  // the body: a boulder, the turned ellipsoid's outline with a flat foot and a round back
  at(-0.5, function (c) {
    var ca = T.ca, sa = T.sa, ex = Math.sqrt(RF * RF * ca * ca + RD * RD * sa * sa), ep = Math.sqrt(RF * RF * sa * sa + RD * RD * ca * ca), ey = Math.sqrt(RH * RH + (T.KD * ep) * (T.KD * ep)), cb = pt(-2, 0, BH);
    var pts = [[cb[0], cb[1] - ey], [cb[0] + ex * 0.72, cb[1] - ey * 0.7], [cb[0] + ex * 1.0, cb[1] - ey * 0.05], [cb[0] + ex * 0.92, cb[1] + ey * 0.6], [cb[0] + ex * 0.55, cb[1] + ey * 0.92], [cb[0], cb[1] + ey * 0.98], [cb[0] - ex * 0.55, cb[1] + ey * 0.92], [cb[0] - ex * 0.92, cb[1] + ey * 0.6], [cb[0] - ex * 1.0, cb[1] - ey * 0.05], [cb[0] - ex * 0.72, cb[1] - ey * 0.7]];
    blobD(c, pts, skin);
    inkLine(c, [[cb[0] - ex * 0.72, cb[1] - ey * 0.55], [cb[0] - ex * 0.95, cb[1] - ey * 0.05], [cb[0] - ex * 0.85, cb[1] + ey * 0.55]], 'rgba(255,238,200,0.3)', 1.4);   // the lit side
    // embedded stones and a few cracks on the near side
    for (var si = 0; si < 4; si++) { var ux = (hs(si, 21) - 0.5) * 1.3, uy = (hs(si, 22) - 0.4) * 0.9; c.fillStyle = mixHex(skin, '#000000', 0.14); c.beginPath(); c.ellipse(cb[0] + ux * ex * 0.7, cb[1] + uy * ey * 0.6, 2.2 + 1.5 * hs(si, 23), 1.5 + hs(si, 24), hs(si, 25) * 3, 0, 7); c.fill(); }
    inkLine(c, [[cb[0] + ex * 0.3, cb[1] + ey * 0.1], [cb[0] + ex * 0.45, cb[1] + ey * 0.35], [cb[0] + ex * 0.4, cb[1] + ey * 0.55]], LNs, 0.6);
  });
  // the hair: a cape over the whole back, a cap on top, a hem of strands
  trollCape(T, -2, RF * 0.28, RD * 0.28, BH + RH * 0.96, 8, 9 + 6 * HL, 1.25, 5.03, 5, 1 + 0.4 * HL, 50, 3.7);   // a tent of hair from the crown down the whole back
  at(-0.3, function (c) {
    var ca = T.ca, sa = T.sa, ex = Math.sqrt(RF * RF * ca * ca + RD * RD * sa * sa) * 0.8, ct = pt(-4, 0, BH + RH * 0.86), i2, pts = [];
    for (i2 = 0; i2 < 12; i2++) { var th = i2 / 12 * 6.283; pts.push([ct[0] + Math.cos(th) * ex, ct[1] + Math.sin(th) * ex * 0.55 + (Math.sin(th) > 0 ? 3 : 0)]); }
    blobD(c, jagged(pts, ct[0], ct[1], 2.6 + 1.5 * HL, 61), hairCol, true);
    for (i2 = 0; i2 < 5; i2++) trollStrand(c, T, [ct[0] + (hs(i2, 62) - 0.5) * ex * 1.4, ct[1] + 2], 5 + 4 * HL, (hs(i2, 63) - 0.5) * 0.9, 1.1, i2 % 2 ? hairDk : T.hairLt, 62 + i2);
  });
  trollGrowth(T, [[-6, -6, 3.2, 0, 11], [-4, 7, 2.8, -1, 0], [-10, 2, 2.4, -2, 8], [-1, -9, 2.2, -2, 0], [-12, -3, 1.9, -3, 0], [3, 10, 2.0, -3, 0]], BH + RH * 0.78, MO, 5);
  // the ears, big and pointed, behind the face
  [-1, 1].forEach(function (sg) {
    var ed = depth(headF - 8, sg * (RD - 1)), hd0 = depth(headF, 0);
    at(ed < hd0 ? hd0 - 0.2 : hd0 + 0.2, function (c) {
      var col = ed >= hd0 ? skin : skinDk, a0 = pt(headF - 7, sg * (RD - 4), BH + 13), a1 = pt(headF - 9, sg * (RD + 3 + 3 * ER), BH + 15 + 3 * ER), a3 = pt(headF - 8, sg * (RD + 4 + 3 * ER), BH + 9), a2 = pt(headF - 3, sg * (RD - 3), BH + 6);
      blobD(c, [a0, a1, a3, a2], col);
      if (ed >= hd0) { var b1 = pt(headF - 8, sg * (RD + 1.5 + 2.5 * ER), BH + 13.5 + 2.5 * ER), b0 = pt(headF - 6.5, sg * (RD - 3), BH + 12), b3 = pt(headF - 7.5, sg * (RD + 2.5 + 2.5 * ER), BH + 9.5), b2 = pt(headF - 4, sg * (RD - 2.5), BH + 7.5); blobD(c, [b0, b1, b3, b2], mixHex(skin, '#c08a7a', 0.3)); }
      if (BE && sg === -1 && ed >= hd0 - 2) { var rp = pt(headF - 6, -(RD - 3), BH + 9); c.strokeStyle = '#b08040'; c.lineWidth = 1.2; c.beginPath(); c.arc(rp[0], rp[1], 1.9, 0, 7); c.stroke(); }
    });
  });
  // the face, sunk into the front of the boulder: the brow, the eyes, the nose, the mouth and the beard; shown as it turns to you
  var hdep = depth(headF, 0), faceDep = depth(headF + 8, 0) - hdep;
  at(hdep + 0.6, function (c) {
    if (faceDep < -3) return;
    c.save(); c.globalAlpha = Math.min(1, (faceDep + 3) / 4);
    var fy = BH + 5;
    c.fillStyle = mixHex(skin, '#000000', 0.09); c.beginPath(); var fp = pt(headF + 1, 0, fy - 1); c.ellipse(fp[0], fp[1], 15 * (0.55 + 0.45 * Math.abs(T.sa)) + 1, 13, 0, 0, 7); c.fill();   // the face a shade darker, under the brow
    var wr = pt(headF + 2, 0, fy + 13); c.strokeStyle = LNs; c.lineWidth = 0.7; c.beginPath(); c.moveTo(wr[0] - 9, wr[1] + 1.5); c.quadraticCurveTo(wr[0], wr[1] - 1.5, wr[0] + 9, wr[1] + 1.5); c.moveTo(wr[0] - 7, wr[1] + 4); c.quadraticCurveTo(wr[0], wr[1] + 1.5, wr[0] + 7, wr[1] + 4); c.stroke();   // the forehead's folds
    var eyeCol = stone ? skin : (wind || slam ? C.glow : C.eye);
    trollEvilFace(c, T, H, { S: 1.35, eyes: [pt(headF + 2.5, -6.2, fy + 3.5), pt(headF + 2.5, 6.2, fy + 3.5)], brow: [pt(headF - 1, -13, fy + 9.5), pt(headF + 3.5, -1.5, fy + 5.2), pt(headF + 3.5, 1.5, fy + 5.2), pt(headF - 1, 13, fy + 9.5)], lidSide: 1 }, eyeCol, !stone && (wind || slam), skin, skinDk, hairDk, sz);
    // the nose: long and drooping, bulbous at the end
    var n0 = pt(headF + 3, 0, fy + 5), n1 = pt(headF + 12 + 6 * NS, 0, fy - 2 - 4 * NS), nw = 3.6;
    limbD(c, n0[0], n0[1], nw, n1[0], n1[1], nw * 1.1, mixHex(skin, '#c08a7a', 0.25)); c.fillStyle = mixHex(skin, '#c08a7a', 0.3); c.beginPath(); c.arc(n1[0], n1[1] + 1, nw * 1.25, 0, 7); c.fill();
    inkLine(c, [[n0[0] - nw * 0.6, n0[1] + 1], [n1[0] - nw * 1.1, n1[1] + 1.5]], LN, 0.6); c.fillStyle = mixHex(skin, '#000000', 0.3); c.beginPath(); c.ellipse(n1[0] - 1.2, n1[1] + 2.6, 0.9, 0.6, 0, 0, 7); c.ellipse(n1[0] + 1.2, n1[1] + 2.6, 0.9, 0.6, 0, 0, 7); c.fill();
    if (AGE > 0.3) { c.fillStyle = skinDk; c.beginPath(); c.arc(n1[0] + 1.5, n1[1] - 1.5, 0.9, 0, 7); c.fill(); }
    // the mouth: a wide sneer with crooked teeth
    trollSneer(c, T, { S: 1.3, mouth: [pt(headF + 2, -10.5, fy - 9.5), pt(headF + 5, 0, fy - 9), pt(headF + 2, 10.5, fy - 9.5)], teeth: 8 }, skin, '#e6dcc0');
    // the beard: a jagged mass from the jaw to the ground, between the hands
    var bpts = [pt(headF - 1, -12, fy - 8), pt(headF + 1, -6, fy - 11.5), pt(headF + 2, 0, fy - 12.5), pt(headF + 1, 6, fy - 11.5), pt(headF - 1, 12, fy - 8), pt(headF + 3, 8 + 2 * HL, 6), pt(headF + 5, 2, 1.5), pt(headF + 5, -3, 2.5), pt(headF + 3, -8 - 2 * HL, 7)];
    blobD(c, jagged(bpts, pt(headF + 2, 0, fy - 14)[0], pt(headF + 2, 0, fy - 14)[1], 1.6 + HL, 73), hairCol, true);
    for (var bi = 0; bi < 4 + 3 * HL; bi++) trollStrand(c, T, pt(headF + 1, -7 + 14 * hs(bi, 160), fy - 13), (8 + 6 * HL) * (0.6 + 0.6 * hs(bi, 161)), (hs(bi, 162) - 0.5) * 0.7, 1.1, bi % 2 ? hairDk : T.hairLt, 160 + bi);
    if (BE) { var b0 = pt(headF + 1, -8, fy - 13), b1 = pt(headF + 1, 8, fy - 13); c.strokeStyle = '#5a4a3a'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(b0[0], b0[1]); c.quadraticCurveTo((b0[0] + b1[0]) / 2, b0[1] + 12, b1[0], b1[1]); c.stroke(); ['#c8403a', '#3a6ab8', '#e8e0c8', '#c8403a', '#d8a030'].forEach(function (bc, bi2) { var u = (bi2 + 1) / 6, px = b0[0] + (b1[0] - b0[0]) * u, py = b0[1] + 9.6 * Math.sin(u * 3.14); c.fillStyle = bc; c.beginPath(); c.arc(px, py, 1.15, 0, 7); c.fill(); }); }
    c.restore();
  });
  trollFinish(c, T, cOut, layers, 0.8);
  c.restore();
}
function forestTrollD(c, x, y, s, H) {
  var sp = H.spec, C = H.pal, T = trollParts(c, s, sp, C), pt = T.pt, depth = T.depth, hs = T.hs, at = T.at, sz = T.sz, t = T.t, mv = T.mv, ph = T.ph, wind = T.wind, slam = T.slam, down = T.down, sweep = T.sweep, stone = T.stone;
  var skin = T.skin, skinDk = T.skinDk, LN = T.LN, LNs = T.LNs, hairCol = T.hairCol, hairDk = T.hairDk;
  var HL = sp.trollHair, NS = sp.trollNose, ER = sp.trollEars, AR = sp.trollArms, MO = stone ? 0 : sp.trollMoss, AGE = sp.trollAge, HU = sp.trollHunch;
  var bob = Math.sin(ph * 2) * 1.5 * mv + Math.sin(t * 1.1) * 0.6, lean = slam ? 4 : (wind ? -3 * wind : (down ? 2 : 0));
  var HIP = 30, SH = 74 + bob, LEAN = 8 + 6 * HU + lean;                                      // the body leans forward from the hips to the shoulders
  function fAt(h) { return Math.max(0, (h - HIP) / (SH - HIP)) * LEAN; }
  var headF = fAt(SH) + 4, headH = SH + 10, i;
  c.save(); c.translate(x, y); c.scale(sz, sz); c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = 'rgba(20,30,20,0.28)'; c.beginPath(); c.ellipse(2, 1, 17, 5, 0, 0, 7); c.fill();
  var cOut = c, layers = null; T.c = c;
  if (T.inkOn) { var M0 = c.getTransform(); layers = [inkLayerBegin(0, M0, -60, -125, 120, 140), inkLayerBegin(1, M0, -60, -125, 120, 140), inkLayerBegin(2, M0, -60, -125, 120, 140)]; }
  // the legs: long and thin with knobby knees, long flat feet with long toes
  [-1, 1].forEach(function (sg) {
    var sw = Math.sin(ph) * 4 * mv * sg, lf = Math.max(0, Math.cos(ph) * sg) * 3 * mv, fd = sg * 6;
    at(depth(3, fd) - 1.2, function (c) {
      var col = depth(3, fd) > 0 ? skin : skinDk, hip = pt(0, sg * 4.5, HIP + 2), knee = pt(4 + sw * 0.5, fd, 15 + lf * 0.5), ank = pt(4 + sw, fd, 2 + lf);
      limbD(c, hip[0], hip[1], 4.6, knee[0], knee[1], 3.6, col); limbD(c, knee[0], knee[1], 3.6, ank[0], ank[1], 2.8, col);
      c.fillStyle = mixHex(col, '#000000', 0.1); c.beginPath(); c.arc(knee[0], knee[1], 3.9, 0, 7); c.fill();                   // the knee knob
      var f0 = 3 + sw, p = [pt(f0 - 3, fd - 2.6, lf), pt(f0 + 7, fd - 3, lf), pt(f0 + 9, fd, lf), pt(f0 + 7, fd + 3, lf), pt(f0 - 3, fd + 2.6, lf)]; blobD(c, p, col);
      for (var i2 = 0; i2 < 3; i2++) { var a = pt(f0 + 8.5, fd + (i2 - 1) * 2.4, lf), b = pt(f0 + 14 - Math.abs(i2 - 1) * 1.5, fd + (i2 - 1) * 3.2, lf); limbD(c, a[0], a[1], 1.3, b[0], b[1], 0.7, col); }
      inkLine(c, [[hip[0] + (knee[0] - hip[0]) * 0.3 - 1.5, hip[1] + (knee[1] - hip[1]) * 0.3], [hip[0] + (knee[0] - hip[0]) * 0.75 - 1.2, hip[1] + (knee[1] - hip[1]) * 0.75]], LNs, 0.5);   // bark
    });
  });
  // the arms: thin and long, from the shoulders down past the knees, twig fingers trailing on the ground; the right arm sweeps
  [1, -1].forEach(function (sg) {
    var swinging = sg === 1 && (wind > 0 || slam), sw = Math.sin(ph) * 4 * mv * sg, hf, hd, hh, up = false, ef, ed, eh;
    var sf = fAt(SH) - 1, sd = sg * 9.5, sh = SH;
    if (swinging && slam) { var u = sweep, phi = 1.35 - u * 2.7; hf = 8 + 30 * Math.cos(phi); hd = 30 * Math.sin(phi); hh = 70 - 60 * u + 10 * Math.sin(u * 3.14); up = u < 0.35; }
    else if (swinging) { hf = -4; hd = 14 + 2 * wind; hh = 84 + 14 * wind; up = true; }
    else { hf = 16 + 8 * AR + sw; hd = sg * 10; hh = (down ? -1 : 0) + 1; }
    ef = up ? (sf + hf) / 2 - 3 : (sf + hf) / 2 + 4; ed = (sd + hd) / 2 + sg * 5; eh = up ? (sh + hh) / 2 + 4 : (sh + hh) / 2 - 4;
    var dep = depth(ef, ed) + (up ? 2 : 0);
    at(dep, function (c) {
      var col = depth(sf, sd) >= 0 ? skin : skinDk, P0 = pt(sf, sd, sh), P1 = pt(ef, ed, eh), P2 = pt(hf, hd, hh);
      if (swinging && slam && !stone) { c.save(); c.globalAlpha = 0.3 * (1 - sweep); c.strokeStyle = '#f6e2b8'; c.lineWidth = 7; c.beginPath(); for (var j = 0; j <= 10; j++) { var uu = sweep * j / 10, ph2 = 1.35 - uu * 2.7, q = pt(8 + 30 * Math.cos(ph2), 30 * Math.sin(ph2), 70 - 60 * uu + 10 * Math.sin(uu * 3.14)); if (j) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); } c.stroke(); c.restore(); }
      limbD(c, P0[0], P0[1], 4.6, P1[0], P1[1], 3.6, col); limbD(c, P1[0], P1[1], 3.6, P2[0], P2[1], 2.6, col);
      c.fillStyle = mixHex(col, '#000000', 0.1); c.beginPath(); c.arc(P1[0], P1[1], 3.8, 0, 7); c.fill();
      inkLine(c, [[P0[0] + (P1[0] - P0[0]) * 0.25 + 1.2, P0[1] + (P1[1] - P0[1]) * 0.25], [P0[0] + (P1[0] - P0[0]) * 0.7 + 1.0, P0[1] + (P1[1] - P0[1]) * 0.7]], LNs, 0.5);
      trollHand(c, T, hf, hd, hh, col, up, sg, 1.1, true);
      for (var i3 = 0; i3 < 2 * HL; i3++) { var tt = 0.3 + i3 * 0.3; trollStrand(c, T, [P0[0] + (P1[0] - P0[0]) * tt, P0[1] + (P1[1] - P0[1]) * tt + 2], 5 + 3 * HL, (hs(i3, 9) - 0.5) * 0.5, 1, i3 % 2 ? hairDk : hairCol, i3 + 40); }
    });
  });
  // the body: a trunk, narrow at the hips, broader at the chest, leaning forward; bark lines
  at(-0.5, function (c) {
    var secs = [[HIP - 2, 7.5], [HIP + 10, 7.0], [SH - 18, 7.8], [SH - 6, 9.8], [SH + 1, 9.2]], L = [], R = [], k;
    for (k = 0; k < secs.length; k++) { var h = secs[k][0], r = secs[k][1], cpt = pt(fAt(h), 0, h); L.push([cpt[0] - r, cpt[1]]); R.push([cpt[0] + r, cpt[1]]); }
    var top = pt(fAt(SH + 1), 0, SH + 1), bot = pt(fAt(HIP - 2), 0, HIP - 2), pts = L.concat([[top[0], top[1] - 9.2 * T.KD * 0.9]], R.reverse(), [[bot[0], bot[1] + 7.5 * T.KD]]);
    blobD(c, pts, skin);
    inkLine(c, [[L[0][0] + 1.5, L[0][1] - 2], [L[2][0] + 1.2, L[2][1]], [L[3][0] + 1.5, L[3][1] + 2]], 'rgba(255,238,200,0.3)', 1.3);     // the lit side
    for (k = 0; k < 3; k++) { var u0 = 0.2 + k * 0.25, a = pt(fAt(HIP + (SH - HIP) * u0) + 2 + k, (k - 1) * 3, HIP + (SH - HIP) * u0), b = pt(fAt(HIP + (SH - HIP) * (u0 + 0.22)) + 2 + k, (k - 1) * 3 + 1, HIP + (SH - HIP) * (u0 + 0.22)); inkLine(c, [[a[0], a[1]], [b[0], b[1]]], LNs, 0.6); }   // bark
    var belly = pt(fAt(SH - 14) + 6, 0, SH - 14); if (depth(10, 0) > 0) { c.save(); c.globalAlpha = Math.min(1, depth(10, 0) / 10) * 0.8; c.fillStyle = C.belly; c.beginPath(); c.ellipse(belly[0], belly[1], 4.5, 9, 0, 0, 7); c.fill(); c.restore(); }
  });
  // the mane: a shorter cape of hair down the back from the shoulders
  trollCape(T, fAt(SH - 4), 7.5, 7.0, SH - 1, SH - 30, 8 + 6 * HL, 1.35, 4.93, 4, 0.8 + 0.4 * HL, 80, 1.45);
  trollGrowth(T, [[fAt(SH) - 4, -6, 2.4, 0, 0], [fAt(SH) - 3, 7, 2.2, -1, 0], [fAt(SH - 20) - 4, -2, 2.0, 0, 0]], SH, MO, 9);
  // the neck and the head: a long skull with a branch of a nose, pointed ears, a crown of twigs and a fir sapling
  var hdep = depth(headF, 0);
  [-1, 1].forEach(function (sg) {
    var ed = depth(headF - 4, sg * 7);
    at(ed < hdep ? hdep - 0.2 : hdep + 0.2, function (c) {
      var col = ed >= hdep ? skin : skinDk, a0 = pt(headF - 3, sg * 5, headH + 1), a1 = pt(headF - 5, sg * (8 + 4 * ER), headH + 8 + 5 * ER), a2 = pt(headF, sg * 3.5, headH + 5);
      blobD(c, [a0, a1, a2], col, true);
      if (ed >= hdep) blobD(c, [pt(headF - 2.5, sg * 5, headH + 2), pt(headF - 4.5, sg * (7 + 3 * ER), headH + 7 + 3.6 * ER), pt(headF - 0.5, sg * 4, headH + 4.5)], mixHex(skin, '#c08a7a', 0.3), true);
    });
  });
  at(hdep, function (c) {
    var n0 = pt(fAt(SH), 0, SH + 1), n1 = pt(headF - 1, 0, headH - 4); limbD(c, n0[0], n0[1], 3.6, n1[0], n1[1], 3.2, skin);           // the neck
    var hp = pt(headF, 0, headH); c.fillStyle = skin; c.beginPath(); c.ellipse(hp[0], hp[1], 6.5, 8.5, 0, 0, 7); c.fill();
    var jaw = pt(headF + 3, 0, headH - 6); c.fillStyle = skin; c.beginPath(); c.ellipse(jaw[0], jaw[1], 5, 3.5, 0, 0, 7); c.fill();
    inkLine(c, [[hp[0] - 5, hp[1] - 5], [hp[0] - 6.3, hp[1]], [hp[0] - 5, hp[1] + 5]], 'rgba(255,238,200,0.3)', 1.1);
    var faceDep = depth(headF + 6, 0) - hdep;
    if (faceDep > -2) {
      c.save(); c.globalAlpha = Math.min(1, (faceDep + 2) / 3);
      var eyeCol = stone ? skin : (wind || slam ? C.glow : C.eye);
      trollEvilFace(c, T, H, { S: 0.8, eyes: [pt(headF + 5.5, -3.3, headH + 1.5), pt(headF + 5.5, 3.3, headH + 1.5)], brow: [pt(headF + 3.5, -7, headH + 6), pt(headF + 6.2, -0.9, headH + 2.8), pt(headF + 6.2, 0.9, headH + 2.8), pt(headF + 3.5, 7, headH + 6)], lidSide: 0 }, eyeCol, !stone && (wind || slam), skin, skinDk, hairDk, sz);
      var q0 = pt(headF + 6, 0, headH + 1), q1 = pt(headF + 14 + 7 * NS, 0, headH - 4 - 5 * NS); limbD(c, q0[0], q0[1], 2.4, q1[0], q1[1], 1.5, mixHex(skin, '#c08a7a', 0.2));   // the nose, a branch
      c.fillStyle = mixHex(skin, '#c08a7a', 0.3); c.beginPath(); c.arc(q1[0], q1[1] + 0.5, 1.7, 0, 7); c.fill(); inkLine(c, [[q0[0], q0[1] + 1.5], [q1[0] - 1, q1[1] + 1.5]], LN, 0.55);
      if (AGE > 0.3) { c.fillStyle = skinDk; c.beginPath(); c.arc(q0[0] + (q1[0] - q0[0]) * 0.5, q0[1] + (q1[1] - q0[1]) * 0.5 - 1.6, 0.7, 0, 7); c.fill(); }
      trollSneer(c, T, { S: 0.72, mouth: [pt(headF + 4.5, -4.5, headH - 6), pt(headF + 6.5, 0, headH - 5.5), pt(headF + 4.5, 4.5, headH - 6)], teeth: 6 }, skin, '#d9cfae');
      for (var bi = 0; bi < 3 + 3 * HL; bi++) trollStrand(c, T, pt(headF + 4, -3.5 + 7 * hs(bi, 160), headH - 8.5), (6 + 5 * HL) * (0.5 + 0.6 * hs(bi, 161)), (hs(bi, 162) - 0.5) * 0.8, 1, bi % 2 ? hairDk : hairCol, 160 + bi);   // the beard
      c.restore();
    }
    // the crown: a jagged tangle of hair on the top and back of the skull, twigs standing up, and a fir sapling
    var ct = pt(headF - 2, 0, headH + 6), i2, pts = [];
    for (i2 = 0; i2 < 10; i2++) { var th = i2 / 10 * 6.283; pts.push([ct[0] + Math.cos(th) * 7.5, ct[1] + Math.sin(th) * 3.2]); }
    blobD(c, jagged(pts, ct[0], ct[1], 2.6 + 1.5 * HL, 91), hairCol, true);
    for (i2 = 0; i2 < 4 + 2 * HL; i2++) { var tx = ct[0] + (hs(i2, 92) - 0.5) * 12, ty = ct[1] + (hs(i2, 93) - 0.5) * 3, tl = 5 + 6 * hs(i2, 94), ta = -1.57 + (hs(i2, 95) - 0.5) * 1.4; inkLine(c, [[tx, ty], [tx + Math.cos(ta) * tl * 0.6, ty + Math.sin(ta) * tl * 0.6], [tx + Math.cos(ta) * tl * 0.6 + Math.cos(ta - 0.6) * tl * 0.4, ty + Math.sin(ta) * tl * 0.6 + Math.sin(ta - 0.6) * tl * 0.4]], hairDk, 1.1); }   // twigs
    if (MO > 0) { var sx0 = ct[0] - 3, sy0 = ct[1] - 1; limbD(c, sx0, sy0, 0.9, sx0 + 1, sy0 - 9, 0.5, '#6a5a44'); c.fillStyle = T.moss; blobD(c, [[sx0 + 1, sy0 - 12], [sx0 + 3.6, sy0 - 6], [sx0 + 2.4, sy0 - 6.5], [sx0 + 4.2, sy0 - 2.5], [sx0 - 2.2, sy0 - 2.5], [sx0 - 0.4, sy0 - 6.5], [sx0 - 1.6, sy0 - 6]], T.moss, true); }   // the fir sapling
    for (i2 = 0; i2 < 4 + 3 * HL; i2++) trollStrand(c, T, [ct[0] + (hs(i2, 96) - 0.5) * 12, ct[1] + 2], (7 + 5 * HL) * (0.6 + 0.5 * hs(i2, 97)), (hs(i2, 98) - 0.5) * 0.7, 1.1, i2 % 2 ? hairDk : T.hairLt, 96 + i2);
  });
  trollFinish(c, T, cOut, layers, 0.8);
  c.restore();
}
var RIG = { animals: 'views', trolls: 'views' };   // 'views' (quadD, trollViewD) or 'turntable' (animal3D, boulderTrollD, forestTrollD: the old rigs, kept for comparison)
/* ===== The view rig for trolls (2026-10-07): the boulder troll and the forest troll in three designed views =====
   Like quadD: a side view (facing left, flipped for right), a front view and a back view, each a 2D construction with its own
   layering (far arm and far leg, then the body with the head and hair, then the near arm and near leg), through the ink layers.
   The nose is part of the head's own shape, the beard hangs from the jaw in the same layer, the hands rest on the ground in
   front: nothing can cut through anything. The sweep: the near arm rises in the windup and swings across in the blow. The boulder
   troll (plan 8) is a hunched boulder with the head sunk into it; the forest troll (plan 9) is tall and gaunt with a trunk of a
   body leaning forward. lib.RIG.trolls = 'views' chooses it. */
function trollViewD(c, x, y, s, H) {
  var sp = H.spec, C = H.pal, forest = Math.round(sp.plan) === 9, sz = sp.size * 0.95, t = s.t || 0, mv = Math.min(1, s.move || 0), ph = s.phase || 0, st = s.state || 'idle', k = Math.max(0, Math.min(1, s.k || 0));
  var ang = s.ang == null ? (s.dir < 0 ? Math.PI : 0) : s.ang, sn = Math.sin(ang), cs = Math.cos(ang);
  var side = Math.abs(sn) < 0.42, flip = side && cs > 0, back = !side && sn < 0, tq = side ? 0 : Math.max(-1, Math.min(1, cs / 0.7));
  var wind = st === 'windup' ? k : 0, slam = st === 'lunge', down = st === 'recover' || st === 'stunned' || st === 'stagger', sweep = slam ? Math.min(1, k * 1.15) : -1;
  var stone = C.glow === C.body, skin = C.body, skinDk = mixHex(skin, '#1a1410', 0.2), hairCol = stone ? mixHex(skin, '#ffffff', 0.1) : mixHex(C.accent, '#cfcabd', sp.trollAge * 0.6), hairDk = mixHex(hairCol, '#000000', 0.3), hairLt = mixHex(hairCol, '#ffffff', 0.18), moss = C.moss || '#8fa86a', lich = mixHex(moss, skin, 0.35);
  var HL = sp.trollHair, NS = sp.trollNose, ER = sp.trollEars, AR = sp.trollArms, MO = stone ? 0 : sp.trollMoss, AGE = sp.trollAge, HU = sp.trollHunch, BE = sp.trollBeads && !stone;
  var cOut = c, layers = null, curL = null, inkOn = INK_FIG.on && typeof c.getTransform === 'function';
  var LNc = 'rgba(35,26,22,' + (inkOn ? Math.min(1, INK_FIG.soft + 0.15) : 0.85) + ')', LNs = 'rgba(35,26,22,' + (inkOn ? INK_FIG.soft * 0.8 : 0.5) + ')', LIT = 'rgba(255,238,200,0.34)';
  function lay(i) { if (!layers) return; curL = inkSwitch(c, layers, curL, i); c = curL.g; }
  function hs(i, j) { var v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); }
  H.eyes = [];
  // the measures: the boulder is wide and low, the forest troll tall and thin
  var BW = forest ? 10 : 24, BH = forest ? 40 : 36, LEG = forest ? 26 : 8, ARM = forest ? 62 : 38, HEAD = forest ? 8 : 12, bob = Math.sin(ph * 2) * 1.2 * mv + Math.sin(t * 1.3) * 0.5;
  var lean = slam ? 3 : (wind ? -2.5 * wind : (down ? 1.5 : 0)), eyeCol = stone ? skin : (wind || slam ? C.glow : C.eye), glow = !stone && (wind || slam);
  c.save(); c.translate(x, y); c.scale(sz, sz);
  c.fillStyle = 'rgba(20,30,20,0.26)'; c.beginPath(); c.ellipse(0, 1, BW + 6, (BW + 6) * 0.3, 0, 0, 7); c.fill();
  if (inkOn) { var M0 = c.getTransform(), li; layers = []; for (li = 0; li < 3; li++) layers.push(inkLayerBegin(li, M0, -70, -LEG - BH - HEAD * 2 - 40, 140, LEG + BH + HEAD * 2 + 50)); lay(1); }
  function strand(p, len, lean2, w, col, i) { var sw = Math.sin(t * 1.1 + i * 1.7) * 0.05, a = 1.57 + lean2 + sw, x1 = p[0] + Math.cos(a) * len, y1 = p[1] + Math.sin(a) * len; c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo((p[0] + x1) / 2 + Math.cos(a - 1.57) * len * 0.15, (p[1] + y1) / 2, x1, y1); c.stroke(); }
  function growth(px, py, seed) {                                           // lichen and a birch sapling on the hump
    if (MO <= 0) return; var i;
    c.globalAlpha = 0.85; c.fillStyle = lich; for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(px + (hs(i, seed) - 0.5) * 7, py + (hs(i, seed + 1) - 0.5) * 3, 1.8 + hs(i, seed + 2) * 1.6, 1.1, hs(i, seed + 3) * 3, 0, 7); c.fill(); } c.globalAlpha = 1;
    if (hs(seed, 9) < MO) { var qx = px + 2 + Math.sin(t * 0.9 + seed) * 1.2, qy = py - 9; limbD(c, px + 2, py, 0.8, qx, qy, 0.45, '#d9d2c0'); for (i = 0; i < 5; i++) { var u = 0.4 + i * 0.15, sg = i % 2 ? 1 : -1; c.fillStyle = i % 2 ? moss : mixHex(moss, '#fff8d0', 0.3); c.beginPath(); c.ellipse(px + 2 + (qx - px - 2) * u + sg * 1.6, py + (qy - py) * u, 1.25, 0.8, sg * 0.6, 0, 7); c.fill(); } }
  }
  function hand(hx, hy, fwd, col, S, up) {                                   // a great hand on the ground (or raised): the palm and four knobbed fingers forward
    var i, L = (forest ? 9 : 8) * S;
    c.fillStyle = col; c.beginPath(); c.ellipse(hx, hy - (up ? 0 : 1.2 * S), (forest ? 3 : 5) * S, (forest ? 2.2 : 3.4) * S, 0, 0, 7); c.fill();
    for (i = 0; i < 4; i++) { var dd = (i - 1.5) * (forest ? 1.8 : 2.4) * S, l = L - Math.abs(i - 1.5) * 1.1 * S, w0 = (forest ? 1.4 : 2.4) * S, w1 = (forest ? 0.8 : 1.8) * S; var x0 = hx + fwd * 1.5 * S + dd * 0.3, y0 = hy + dd * 0.5 * (up ? -0.4 : 1), kx = x0 + fwd * l * 0.55, ky = up ? y0 - l * 0.6 : y0 - 2 * S, x1 = x0 + fwd * l, y1 = up ? y0 - l : y0; limbD(c, x0, y0, w0, kx, ky, w0 * 0.85, i < 2 ? mixHex(col, '#000000', 0.08) : col); limbD(c, kx, ky, w0 * 0.85, x1, y1, w1, i < 2 ? mixHex(col, '#000000', 0.08) : col); if (!forest) { c.fillStyle = mixHex(col, '#000000', 0.12); c.beginPath(); c.arc(kx, ky, w0 * 0.72, 0, 7); c.fill(); } }
  }
  function faceSide(hx, hy, hr, fwd) {                                      // the profile: brow, a small deep eye, the nose as part of the head, the sneer, the beard
    var n0 = [hx + fwd * hr * 0.75, hy - hr * 0.1], tipx = hx + fwd * (hr * 0.9 + 5 + 4 * NS), tipy = hy + hr * 0.25 + 3 * NS;
    blobD(c, [[hx + fwd * hr * 0.55, hy - hr * 0.35], [tipx, tipy - 2.2], [tipx + fwd * 0.5, tipy + 1.2], [hx + fwd * hr * 0.5, hy + hr * 0.35]], mixHex(skin, '#c08a7a', 0.2));   // the nose, in the head's own layer
    c.fillStyle = mixHex(skin, '#c08a7a', 0.3); c.beginPath(); c.arc(tipx, tipy, 2.2 + NS, 0, 7); c.fill(); inkLine(c, [[n0[0], n0[1]], [tipx, tipy - 1.5]], LNs, 0.6);
    if (AGE > 0.3) { c.fillStyle = skinDk; c.beginPath(); c.arc(tipx - fwd * 2, tipy - 2.5, 0.8, 0, 7); c.fill(); }
    blobD(c, jagged([[hx - fwd * hr * 0.2, hy - hr * 0.6], [hx + fwd * hr * 0.9, hy - hr * 0.45], [hx + fwd * hr * 0.8, hy - hr * 0.2], [hx - fwd * hr * 0.1, hy - hr * 0.3]], hx, hy - hr * 0.4, 0.8, 71), mixHex(hairDk, '#000000', 0.3), true);   // the brow
    c.fillStyle = mixHex(skin, '#000000', 0.3); c.beginPath(); c.ellipse(hx + fwd * hr * 0.45, hy - hr * 0.1, 2.2, 1.6, 0, 0, 7); c.fill();
    if (glow) { c.fillStyle = 'rgba(255,170,60,0.35)'; c.beginPath(); c.arc(hx + fwd * hr * 0.45, hy - hr * 0.1, 3, 0, 7); c.fill(); }
    c.fillStyle = eyeCol; c.beginPath(); c.ellipse(hx + fwd * hr * 0.45, hy - hr * 0.1, 1.2, 0.9, 0, 0, 7); c.fill(); c.fillStyle = '#1a1410'; c.beginPath(); c.arc(hx + fwd * hr * 0.55, hy - hr * 0.1, 0.45, 0, 7); c.fill(); H.eyes.push([(hx + fwd * hr * 0.45) * sz * (flip ? -1 : 1), (hy - hr * 0.1) * sz]);
    var m0 = [hx + fwd * hr * 0.1, hy + hr * 0.5], m1 = [hx + fwd * hr * 0.85, hy + hr * 0.45]; c.fillStyle = '#1e1410'; c.beginPath(); c.moveTo(m0[0], m0[1]); c.quadraticCurveTo((m0[0] + m1[0]) / 2, m0[1] - 2.2, m1[0], m1[1]); c.quadraticCurveTo((m0[0] + m1[0]) / 2, m0[1] + 1.5, m0[0], m0[1]); c.fill();   // the snarl
    for (var i = 0; i < 4; i++) { var u = 0.15 + i * 0.23, tx = m0[0] + (m1[0] - m0[0]) * u, ty = m0[1] - 1.6; c.fillStyle = '#e6dcc0'; c.beginPath(); c.moveTo(tx - 0.8, ty); c.lineTo(tx + 0.8, ty); c.lineTo(tx + 0.1, ty + 1.6 + (i === 3 ? 1.5 : 0)); c.closePath(); c.fill(); }
    c.strokeStyle = LNc; c.lineWidth = 0.9; c.beginPath(); c.moveTo(m0[0], m0[1]); c.quadraticCurveTo((m0[0] + m1[0]) / 2, m0[1] - 2.2, m1[0], m1[1]); c.stroke();
    blobD(c, jagged([[hx - fwd * hr * 0.3, hy + hr * 0.45], [hx + fwd * hr * 0.75, hy + hr * 0.7], [hx + fwd * hr * (0.5 + 0.2 * HL), hy + hr * (1.4 + 0.6 * HL)], [hx - fwd * hr * 0.1, hy + hr * (1.6 + 0.8 * HL)], [hx - fwd * hr * 0.5, hy + hr * 0.9]], hx, hy + hr, 1.2 + HL * 0.6, 73), hairCol, true);   // the beard
    for (i = 0; i < 3 + 2 * HL; i++) strand([hx + fwd * hr * (0.1 + 0.5 * hs(i, 160)), hy + hr * 1.1], (5 + 4 * HL) * (0.6 + 0.6 * hs(i, 161)), (hs(i, 162) - 0.5) * 0.7, 1, i % 2 ? hairDk : hairLt, 160 + i);
    blobD(c, [[hx - fwd * hr * 0.55, hy - hr * 0.3], [hx - fwd * hr * (0.9 + 0.3 * ER), hy - hr * (0.9 + 0.3 * ER)], [hx - fwd * hr * (1.1 + 0.3 * ER), hy - hr * 0.2], [hx - fwd * hr * 0.7, hy + hr * 0.1]], skin);   // the ear
    if (BE) { c.strokeStyle = '#b08040'; c.lineWidth = 1; c.beginPath(); c.arc(hx - fwd * hr * 0.85, hy + hr * 0.05, 1.4, 0, 7); c.stroke(); }
  }
  function faceFront(hx, hy, hr) {                                           // the evil face straight on: sockets, eyes, the brows' V, the nose hanging down, the snarl with fangs, the beard
    var ex0 = hx - hr * 0.42 + tq * 0.8, ex1 = hx + hr * 0.42 + tq * 0.8, ey = hy - hr * 0.1, i;
    c.fillStyle = mixHex(skin, '#000000', 0.32); c.beginPath(); c.ellipse(ex0, ey + 0.3, 2.6, 1.9, 0, 0, 7); c.ellipse(ex1, ey + 0.3, 2.6, 1.9, 0, 0, 7); c.fill();
    [[ex0, 0], [ex1, 1]].forEach(function (e) { if (glow) { c.fillStyle = 'rgba(255,170,60,0.35)'; c.beginPath(); c.arc(e[0], ey, 3, 0, 7); c.fill(); } c.fillStyle = eyeCol; c.beginPath(); c.ellipse(e[0], ey, 1.2, e[1] ? 0.7 : 1.0, 0, 0, 7); c.fill(); c.fillStyle = '#1a1410'; c.beginPath(); c.arc(e[0] + 0.3, ey, 0.45, 0, 7); c.fill(); c.fillStyle = mixHex(skin, '#000000', 0.22); c.beginPath(); c.ellipse(e[0], ey - (e[1] ? 0.9 : 1.3), 1.6, 0.7, 0, 0, 7); c.fill(); H.eyes.push([e[0] * sz, ey * sz]); });
    var browCol = mixHex(hairDk, '#000000', 0.3);
    blobD(c, jagged([[hx - hr * 1.05, hy - hr * 0.75], [hx - hr * 0.1, hy - hr * 0.38], [hx - hr * 0.05, hy - hr * 0.2], [hx - hr * 1.05, hy - hr * 0.45]], hx - hr * 0.5, hy - hr * 0.5, 0.9, 71), browCol, true);
    blobD(c, jagged([[hx + hr * 1.05, hy - hr * 0.75], [hx + hr * 0.1, hy - hr * 0.38], [hx + hr * 0.05, hy - hr * 0.2], [hx + hr * 1.05, hy - hr * 0.45]], hx + hr * 0.5, hy - hr * 0.5, 0.9, 72), browCol, true);
    inkLine(c, [[hx - 0.9, hy - hr * 0.3], [hx - 1.4, hy - hr * 0.6]], LNc, 0.55); inkLine(c, [[hx + 0.6, hy - hr * 0.3], [hx + 1.1, hy - hr * 0.62]], LNc, 0.55);
    var nl = 5 + 4 * NS; blobD(c, [[hx - 2.2, hy - hr * 0.25], [hx + 2.2, hy - hr * 0.25], [hx + 2.8 + tq, hy + nl], [hx - 2.8 + tq, hy + nl]], mixHex(skin, '#c08a7a', 0.2)); c.fillStyle = mixHex(skin, '#c08a7a', 0.3); c.beginPath(); c.ellipse(hx + tq, hy + nl + 0.5, 3.2, 2.4, 0, 0, 7); c.fill();   // the nose
    inkLine(c, [[hx - 1.8, hy - hr * 0.2], [hx - 2.6 + tq, hy + nl - 1]], LNs, 0.55); c.fillStyle = mixHex(skin, '#000000', 0.3); c.beginPath(); c.ellipse(hx - 1.4 + tq, hy + nl + 1.6, 0.9, 0.6, 0, 0, 7); c.ellipse(hx + 1.4 + tq, hy + nl + 1.6, 0.9, 0.6, 0, 0, 7); c.fill();
    if (AGE > 0.3) { c.fillStyle = skinDk; c.beginPath(); c.arc(hx + 1.8 + tq, hy + nl - 2.5, 0.8, 0, 7); c.fill(); }
    var my = hy + nl + 4.5, m0 = [hx - hr * 0.7 + tq * 0.5, my + 1.5], m2 = [hx + hr * 0.7 + tq * 0.5, my + 1.5], cxm = (m0[0] + m2[0]) / 2;
    c.fillStyle = '#1e1410'; c.beginPath(); c.moveTo(m0[0], m0[1]); c.quadraticCurveTo(cxm, my - 4, m2[0], m2[1]); c.quadraticCurveTo(cxm, my + 4.5, m0[0], m0[1]); c.fill();
    for (i = 0; i < 7; i++) { var u = (i + 0.5) / 7, tx = (1 - u) * (1 - u) * m0[0] + 2 * (1 - u) * u * cxm + u * u * m2[0], ty = (1 - u) * (1 - u) * m0[1] + 2 * (1 - u) * u * (my - 4) + u * u * m2[1] + 0.3, edge = Math.abs(u - 0.5) * 2, h = 1.4 + 1.0 * hs(i, 202) + 2.4 * edge * edge; c.fillStyle = '#e6dcc0'; c.beginPath(); c.moveTo(tx - 0.9 - 0.4 * edge, ty); c.lineTo(tx + 0.9 + 0.4 * edge, ty); c.lineTo(tx + (hs(i, 203) - 0.5) * 0.6, ty + h); c.closePath(); c.fill(); }
    [0.22, 0.78].forEach(function (u) { var tx = (1 - u) * (1 - u) * m0[0] + 2 * (1 - u) * u * cxm + u * u * m2[0], ty = my + 3.2; c.fillStyle = '#e6dcc0'; c.beginPath(); c.moveTo(tx - 0.9, ty + 0.4); c.lineTo(tx + 0.1, ty - 2.6); c.lineTo(tx + 1, ty + 0.4); c.closePath(); c.fill(); });
    c.strokeStyle = LNc; c.lineWidth = 1.1; c.beginPath(); c.moveTo(m0[0], m0[1]); c.quadraticCurveTo(cxm, my - 4, m2[0], m2[1]); c.stroke(); c.lineWidth = 0.9; c.beginPath(); c.moveTo(m0[0], m0[1]); c.quadraticCurveTo(cxm, my + 4.5, m2[0], m2[1]); c.stroke();
    inkLine(c, [[m0[0], m0[1]], [m0[0] - 0.8, m0[1] + 2]], LNs, 0.6); inkLine(c, [[m2[0], m2[1]], [m2[0] + 0.8, m2[1] + 2]], LNs, 0.6);
    blobD(c, jagged([[hx - hr * 0.95, my], [hx - hr * 0.5, my + 4], [hx + hr * 0.5, my + 4], [hx + hr * 0.95, my], [hx + hr * (0.6 + 0.2 * HL), my + hr * (0.9 + 0.5 * HL)], [hx + tq, my + hr * (1.3 + 0.7 * HL)], [hx - hr * (0.6 + 0.2 * HL), my + hr * (0.9 + 0.5 * HL)]], hx, my + hr * 0.8, 1.3 + HL * 0.6, 73), hairCol, true);   // the beard
    for (i = 0; i < 4 + 3 * HL; i++) strand([hx - hr * 0.6 + hr * 1.2 * hs(i, 160), my + 4], (6 + 5 * HL) * (0.6 + 0.6 * hs(i, 161)), (hs(i, 162) - 0.5) * 0.7, 1, i % 2 ? hairDk : hairLt, 160 + i);
    if (BE) { var b0 = [hx - hr * 0.6, my + 6], b1 = [hx + hr * 0.6, my + 6]; c.strokeStyle = '#5a4a3a'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(b0[0], b0[1]); c.quadraticCurveTo(hx, my + 14, b1[0], b1[1]); c.stroke(); ['#c8403a', '#3a6ab8', '#e8e0c8', '#c8403a', '#d8a030'].forEach(function (bc, bi) { var u = (bi + 1) / 6, px = b0[0] + (b1[0] - b0[0]) * u, py = b0[1] + 6.5 * Math.sin(u * 3.14); c.fillStyle = bc; c.beginPath(); c.arc(px, py, 1.1, 0, 7); c.fill(); }); }
  }
  function earsFront(hx, hy, hr) { [-1, 1].forEach(function (sd) { blobD(c, [[hx + sd * hr * 0.8, hy - hr * 0.4], [hx + sd * hr * (1.4 + 0.4 * ER), hy - hr * (0.9 + 0.3 * ER)], [hx + sd * hr * (1.5 + 0.4 * ER), hy - hr * 0.1], [hx + sd * hr * 0.9, hy + hr * 0.2]], skin); if (BE && sd === -1) { c.strokeStyle = '#b08040'; c.lineWidth = 1; c.beginPath(); c.arc(hx - hr * 1.2, hy + hr * 0.05, 1.3, 0, 7); c.stroke(); } }); }
  function crown(hx, hy, hr, sd) {                                           // the forest troll's crown of twigs and hair, with a fir sapling
    var i, pts = []; for (i = 0; i < 10; i++) { var th = i / 10 * 6.283; pts.push([hx + Math.cos(th) * hr * 1.1, hy - hr * 0.75 + Math.sin(th) * hr * 0.45]); }
    blobD(c, jagged(pts, hx, hy - hr * 0.75, 2.4 + 1.5 * HL, 91), hairCol, true);
    for (i = 0; i < 4 + 2 * HL; i++) { var tx = hx + (hs(i, 92) - 0.5) * hr * 2, ty = hy - hr * 0.8, tl = 5 + 6 * hs(i, 94), ta = -1.57 + (hs(i, 95) - 0.5) * 1.4; inkLine(c, [[tx, ty], [tx + Math.cos(ta) * tl * 0.6, ty + Math.sin(ta) * tl * 0.6], [tx + Math.cos(ta) * tl * 0.6 + Math.cos(ta - 0.6) * tl * 0.4, ty + Math.sin(ta) * tl * 0.6 + Math.sin(ta - 0.6) * tl * 0.4]], hairDk, 1.1); }
    if (MO > 0) { var sx0 = hx - hr * 0.3, sy0 = hy - hr * 0.9; limbD(c, sx0, sy0, 0.9, sx0 + 1, sy0 - 9, 0.5, '#6a5a44'); blobD(c, [[sx0 + 1, sy0 - 12], [sx0 + 3.6, sy0 - 6], [sx0 + 2.4, sy0 - 6.5], [sx0 + 4.2, sy0 - 2.5], [sx0 - 2.2, sy0 - 2.5], [sx0 - 0.4, sy0 - 6.5], [sx0 - 1.6, sy0 - 6]], moss, true); }
  }
  function hairCap(hx, hy, hr) { var i, pts = []; for (i = 0; i < 12; i++) { var th = i / 12 * 6.283; pts.push([hx + Math.cos(th) * hr * 1.15, hy - hr * 0.7 + Math.sin(th) * hr * 0.5]); } blobD(c, jagged(pts, hx, hy - hr * 0.7, 2.4 + 1.5 * HL, 61), hairCol, true); for (i = 0; i < 5; i++) strand([hx + (hs(i, 62) - 0.5) * hr * 2, hy - hr * 0.5], 5 + 4 * HL, (hs(i, 63) - 0.5) * 0.9, 1.1, i % 2 ? hairDk : hairLt, 62 + i); }
  var S = forest ? 0.85 : 1.15;
  if (side) {
    var fwd = -1; if (flip) c.scale(-1, 1);
    // the measures of the side view: feet on the ground, the body a boulder (or a leaning trunk), the head at its front
    var hipY = -LEG + bob, topY = hipY - BH, frontX = fwd * (forest ? 6 : BW * 0.75), backX = -fwd * (forest ? 7 : BW * 0.85), hx = frontX + fwd * (forest ? 6 + HU * 4 : HEAD * 0.8 + 2) + fwd * lean, hy = forest ? topY - HEAD * 0.4 : topY + HEAD * 0.8, hr = HEAD;
    var shX = frontX - fwd * (forest ? 2 : 7), shY = forest ? topY + 4 : topY + 8, legF = fwd * (forest ? 3 : 6), legB = -fwd * (forest ? 3 : 6);
    function legSide(lx, phi, near, col) { var sw = Math.sin(phi) * (forest ? 5 : 2.5) * mv, lf = Math.max(0, Math.cos(phi)) * 3 * mv, kk = ik2(lx, hipY, lx + fwd * sw, -lf, LEG * 0.55, LEG * 0.55, -fwd); limbD(c, lx, hipY, forest ? 4.4 : 6.5, kk[0], kk[1], forest ? 3.4 : 5.5, col); limbD(c, kk[0], kk[1], forest ? 3.4 : 5.5, kk[2], kk[3], forest ? 2.8 : 4.8, col); if (forest) { c.fillStyle = mixHex(col, '#000000', 0.1); c.beginPath(); c.arc(kk[0], kk[1], 3.6, 0, 7); c.fill(); } blobD(c, [[kk[2] - fwd * 3, kk[3]], [kk[2] + fwd * (forest ? 9 : 8), kk[3] - 0.5], [kk[2] + fwd * (forest ? 11 : 9.5), kk[3] + 1.5], [kk[2] - fwd * 3, kk[3] + 1.5]], col); }
    function armSide(sx, sy, near, col) {
      var hxH, hyH, up = false;
      if (near && slam) { var u = sweep, a = -1.9 + u * 3.6; hxH = sx + fwd * Math.cos(a) * ARM * 0.9; hyH = sy + Math.sin(a) * ARM * 0.9 * 0.5 - (1 - Math.abs(u - 0.5) * 2) * 6; up = u < 0.4; }
      else if (near && wind) { hxH = sx - fwd * 6; hyH = sy - Math.min(ARM * 0.9, 34) * (0.7 + 0.3 * wind); up = true; }
      else { hxH = sx + fwd * (ARM * (forest ? 0.42 : 0.6) * (0.9 + 0.1 * AR) + Math.sin(ph) * 2 * mv * (near ? 1 : -1)); hyH = -1; }
      var kk = ik2(sx, sy, hxH, hyH, ARM * 0.52, ARM * 0.52, near ? -fwd : fwd);
      limbD(c, sx, sy, forest ? 4.6 : 8, kk[0], kk[1], forest ? 3.6 : 6.6, col); limbD(c, kk[0], kk[1], forest ? 3.6 : 6.6, kk[2], kk[3], forest ? 2.6 : 5.6, col); c.fillStyle = mixHex(col, '#000000', 0.1); c.beginPath(); c.arc(kk[0], kk[1], forest ? 3.8 : 6, 0, 7); c.fill();
      hand(kk[2], kk[3], fwd, col, S, up);
    }
    lay(0);
    legSide(legB - fwd * 2, ph + Math.PI, false, skinDk); armSide(shX - fwd * 3 + backX * 0.3, shY + 2, false, skinDk);
    lay(1);
    legSide(legF - fwd * 1, ph, true, skin);
    if (forest) { var tp = [[backX, hipY + 2], [frontX, hipY + 2], [frontX + fwd * (HU * 6 + 2), topY + 10], [frontX + fwd * (HU * 8 + 4), topY], [backX + fwd * (HU * 7), topY - 2], [backX - fwd * 2, topY + 12]]; blobD(c, tp, skin); inkLine(c, [[frontX + fwd * 2, hipY - 4], [frontX + fwd * (HU * 6), topY + 8]], LIT, 1.2); }
    else { var bp = [[frontX, hipY + 3], [frontX + fwd * 2, topY + 14], [frontX - fwd * 2, topY + 3], [frontX - fwd * BW * 0.5, topY - 2], [backX + fwd * 3, topY - 1], [backX, topY + 10], [backX + fwd * 1, hipY + 3]]; blobD(c, bp, skin); inkLine(c, [[frontX + fwd * 1, hipY - 6], [frontX - fwd * 1, topY + 6]], LIT, 1.3); for (var si = 0; si < 3; si++) { c.fillStyle = mixHex(skin, '#000000', 0.14); c.beginPath(); c.ellipse(frontX - fwd * (4 + si * 6), topY + 8 + si * 5, 2.2, 1.4, 0, 0, 7); c.fill(); } }
    // the hair down the back, the head with its face, the ear and the hair over the head
    blobD(c, jagged([[frontX - fwd * 4, topY - 3], [backX + fwd * 3, topY - 4], [backX - fwd * 4, topY + BH * 0.5], [backX - fwd * (3 + 2 * HL), hipY + 6 + 3 * HL], [backX + fwd * 4, hipY + 2], [backX + fwd * 2, topY + 8]], backX, topY + 10, 1.5 + HL, 50), hairCol, true);
    for (var hi = 0; hi < 4 + 3 * HL; hi++) strand([backX - fwd * 2 + fwd * hs(hi, 51) * 6, hipY + 2 + hs(hi, 52) * 3], (6 + 5 * HL) * (0.6 + 0.6 * hs(hi, 53)), (hs(hi, 54) - 0.5) * 0.5 + fwd * 0.3, 1.1, hi % 2 ? hairDk : hairLt, 50 + hi);
    if (!forest) growth(backX + fwd * 6, topY, 5);
    blobD(c, [[hx + fwd * hr * 0.9, hy - hr * 0.55], [hx + fwd * hr * 0.3, hy - hr * 0.95], [hx - fwd * hr * 0.8, hy - hr * 0.7], [hx - fwd * hr * 0.95, hy + hr * 0.2], [hx - fwd * hr * 0.5, hy + hr * 0.8], [hx + fwd * hr * 0.6, hy + hr * 0.75]], skin);
    if (forest) limbD(c, frontX + fwd * (HU * 7 + 2), topY + 2, 3.6, hx - fwd * 2, hy + hr * 0.6, 3.2, skin);
    faceSide(hx, hy, hr, fwd);
    if (forest) crown(hx, hy, hr, fwd); else hairCap(hx, hy, hr);
    lay(2);
    legSide(legF + fwd * 1, ph + Math.PI, true, skin); armSide(shX + fwd * 2, shY, true, skin);
  } else {
    var dS = back ? -1 : 1, hipY2 = -LEG + bob, topY2 = hipY2 - BH, cx = -tq * BW * 0.15, hx2 = cx + tq * BW * 0.35 + (forest ? tq * 6 : 0), hy2 = forest ? topY2 - HEAD * 0.4 + lean : topY2 + HEAD * 0.75 + lean, hr2 = HEAD, W = forest ? BW : BW * 1.1;
    function legFront(lx, phi, near, col) { var l = Math.max(0, Math.cos(phi)) * 2.5 * mv, d = Math.sin(phi) * 2 * mv * dS, kk = ik2(lx, hipY2, lx + (lx < cx ? -1 : 1) * 0.5, -l + d + (near ? 0 : -3), LEG * 0.55, LEG * 0.55, lx < cx ? -1 : 1); limbD(c, lx, hipY2, forest ? 4.4 : 6.5, kk[0], kk[1], forest ? 3.4 : 5.5, col); limbD(c, kk[0], kk[1], forest ? 3.4 : 5.5, kk[2], kk[3], forest ? 2.8 : 4.8, col); blobD(c, [[kk[2] - (forest ? 3.2 : 4.5), kk[3] - 1], [kk[2] + (forest ? 3.2 : 4.5), kk[3] - 1], [kk[2] + (forest ? 3.6 : 5), kk[3] + 2], [kk[2], kk[3] + 2.8], [kk[2] - (forest ? 3.6 : 5), kk[3] + 2]], col); }
    function armFront(sd, sx, sy, near, col) {
      var hxH, hyH, up = false, swinging = sd === 1 && !back && (wind > 0 || slam);
      if (swinging && slam) { var u = sweep, a = -0.63 + u * 4.4; hxH = cx + Math.cos(a) * ARM * 0.8; hyH = sy + 10 - Math.sin(a) * Math.min(ARM * 0.7, 30); up = u < 0.4; }
      else if (swinging) { hxH = sx + sd * 8; hyH = sy - Math.min(ARM * 0.9, 34) * (0.7 + 0.3 * wind); up = true; }
      else { hxH = sx + sd * (W * 0.5 + (forest ? 7 : 9)) + sd * Math.sin(ph) * 1.5 * mv; hyH = -1 + (near ? 0 : -2); }
      var kk = ik2(sx, sy, hxH, hyH, ARM * 0.52, ARM * 0.52, -sd);
      limbD(c, sx, sy, forest ? 4.6 : 8, kk[0], kk[1], forest ? 3.6 : 6.6, col); limbD(c, kk[0], kk[1], forest ? 3.6 : 6.6, kk[2], kk[3], forest ? 2.6 : 5.6, col); c.fillStyle = mixHex(col, '#000000', 0.1); c.beginPath(); c.arc(kk[0], kk[1], forest ? 3.8 : 6, 0, 7); c.fill();
      hand(kk[2], kk[3], 0, col, S, up);
    }
    var shY2 = forest ? topY2 + 4 : topY2 + 12, shL = cx - W * 0.5 + 3, shR = cx + W * 0.5 - 3;
    lay(0);
    legFront(cx - (forest ? 5 : 9), ph + Math.PI, false, skinDk); legFront(cx + (forest ? 5 : 9), ph, false, skinDk);
    if (back) { armFront(-1, shL, shY2, false, skinDk); armFront(1, shR, shY2, false, skinDk); }
    if (back) { blobD(c, [[hx2 - hr2 * 0.9, hy2 - hr2 * 0.6], [hx2 + hr2 * 0.9, hy2 - hr2 * 0.6], [hx2 + hr2 * 0.95, hy2 + hr2 * 0.5], [hx2 - hr2 * 0.95, hy2 + hr2 * 0.5]], skin); earsFront(hx2, hy2, hr2); }
    lay(1);
    if (forest) { blobD(c, [[cx - 6, hipY2 + 2], [cx + 6, hipY2 + 2], [cx + 8 + tq * 2, topY2 + 12], [cx + 10 + tq * 2, topY2], [cx - 10 + tq * 2, topY2], [cx - 8 + tq * 2, topY2 + 12]], skin); inkLine(c, [[cx - 7, hipY2 - 4], [cx - 9 + tq * 2, topY2 + 4]], LIT, 1.2); }
    else { blobD(c, [[cx - W * 0.5, hipY2 + 2], [cx - W * 0.55, topY2 + 14], [cx - W * 0.4 + tq * 3, topY2 + 2], [cx + tq * 3, topY2 - 2], [cx + W * 0.4 + tq * 3, topY2 + 2], [cx + W * 0.55, topY2 + 14], [cx + W * 0.5, hipY2 + 2], [cx, hipY2 + 4]], skin); inkLine(c, [[cx - W * 0.45, hipY2 - 5], [cx - W * 0.35 + tq * 2, topY2 + 5]], LIT, 1.3); }
    if (back) { blobD(c, jagged([[cx - W * 0.45, topY2 + 2], [cx + tq * 2, topY2 - 4], [cx + W * 0.45, topY2 + 2], [cx + W * (0.5 + 0.1 * HL), hipY2 + 2 + 3 * HL], [cx, hipY2 + 6 + 4 * HL], [cx - W * (0.5 + 0.1 * HL), hipY2 + 2 + 3 * HL]], cx, topY2 + BH * 0.5, 1.6 + HL, 50), hairCol, true); for (var hb = 0; hb < 5 + 3 * HL; hb++) strand([cx - W * 0.4 + W * 0.8 * hs(hb, 51), hipY2 + 2 * hs(hb, 52)], (6 + 5 * HL) * (0.6 + 0.6 * hs(hb, 53)), (hs(hb, 54) - 0.5) * 0.5, 1.1, hb % 2 ? hairDk : hairLt, 50 + hb); if (!forest) growth(cx - 4, topY2 + 2, 5); if (forest) crown(hx2, hy2, hr2, 1); else hairCap(hx2, hy2 - 2, hr2); }
    else {
      if (!forest) growth(cx - W * 0.2 + tq * 2, topY2 + 1, 5);
      if (forest) limbD(c, cx + tq * 2, topY2 + 2, 3.6, hx2, hy2 + hr2 * 0.6, 3.2, skin);
      earsFront(hx2, hy2, hr2);
      blobD(c, [[hx2 - hr2 * 0.95, hy2 - hr2 * 0.3], [hx2 - hr2 * 0.5, hy2 - hr2 * 0.95], [hx2 + hr2 * 0.5, hy2 - hr2 * 0.95], [hx2 + hr2 * 0.95, hy2 - hr2 * 0.3], [hx2 + hr2 * 0.75, hy2 + hr2 * 0.75], [hx2 - hr2 * 0.75, hy2 + hr2 * 0.75]], skin);
      faceFront(hx2, hy2, hr2);
      if (forest) crown(hx2, hy2, hr2, 1); else hairCap(hx2, hy2, hr2);
    }
    lay(2);
    legFront(cx - (forest ? 6 : 10), ph, true, skin); legFront(cx + (forest ? 6 : 10), ph + Math.PI, true, skin);
    if (!back) { armFront(-1, shL, shY2, true, skin); armFront(1, shR, shY2, true, skin); }
  }
  if (layers) { var lj; for (lj = 0; lj < 3; lj++) inkLayerEnd(cOut, layers[lj], lj, INK_FIG.line, { w: INK_FIG.w * 0.8, grain: INK_FIG.grain, shade: INK_FIG.shade }); c = cOut; }
  c.restore();
}
/* ===== The view rig for animals (2026-10-07, Robin: the turntable clipped everywhere; a new way to make creatures) =====
   The turntable (animal3D, trollD) laid parts out in 3D and sorted each by one depth, so an arm reaching from the back to the
   front, or a nose in front of a hand, clipped. quadD draws an animal the way the hero is drawn: three designed views (the side,
   facing left and flipped for right; the front; the back), each a 2D construction with its own layering (far legs, then the body
   with the neck and head, then the near legs), through the ink layers so every band is one silhouette with one ink line. Between
   the front and back views the heading turns the figure (tq, as the hero): the head slides to the side it looks toward and the
   flank comes into view. Legs are two-bone limbs placed by ik2 (the front knee bends forward, the hock back). The spec is the old
   animal spec (bodyW, bodyH, head, legLen, legW, neck, neckUp, snout, snoutW, ears, antlers, antlerSize, tusks, hump, mane, hoof,
   tail, tailPale, paleMuzzle, snoutFlat, fangs, brow, pattern, eyeSize, size, colours). lib.RIG = 'views' chooses it for plan 5. */
function quadD(c, x, y, s, H) {
  var sp = H.spec, C = H.pal, sz = sp.size, t = s.t || 0, mv = Math.min(1, s.move || 0), ph = s.phase || 0, st = s.state || 'idle', k = Math.max(0, Math.min(1, s.k || 0));
  var ang = s.ang == null ? (s.dir < 0 ? Math.PI : 0) : s.ang, sn = Math.sin(ang), cs = Math.cos(ang);
  var side = Math.abs(sn) < 0.42, flip = side && cs > 0, back = !side && sn < 0, tq = side ? 0 : Math.max(-1, Math.min(1, cs / 0.7));
  var tell = st === 'windup' ? k : 0, down = st === 'recover' || st === 'stunned', lunge = st === 'lunge', stag = st === 'stagger', T = Math.round(sp.tell);
  var bw = sp.bodyW, bh = sp.bodyH, hd = sp.head, ll = 10 * sp.legLen, lw = 2.6 * sp.legW, nk = 8 * sp.neck, up = sp.neckUp, sl = 6 * sp.snout, sw = 3.6 * sp.snoutW, EAR = Math.round(sp.ears), ANT = Math.round(sp.antlers), TL = Math.round(sp.tail), PAT = Math.round(sp.pattern);
  var body = down ? mixHex(C.body, '#b6a592', 0.4) : (tell ? mixHex(C.body, C.glow, tell * 0.18) : C.body), bodyD = shade(body, -0.09), belly = C.belly, acc = C.accent, eyeCol = tell ? mixHex(C.eye, C.glow, tell) : C.eye;
  var cOut = c, layers = null, curL = null, inkOn = INK_FIG.on && typeof c.getTransform === 'function';
  var LNc = 'rgba(35,26,22,' + (inkOn ? Math.min(1, INK_FIG.soft + 0.15) : 0.85) + ')', LNs = 'rgba(35,26,22,' + (inkOn ? INK_FIG.soft * 0.8 : 0.5) + ')', LIT = 'rgba(255,238,200,0.36)';
  function lay(i) { if (!layers) return; curL = inkSwitch(c, layers, curL, i); c = curL.g; }
  function hs(i, j) { var v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); }
  H.eyes = [];
  var L = 26 * bw, Hb = 13 * bh, bob = Math.abs(Math.sin(ph)) * 0.8 * mv + Math.sin(t * 2.2) * 0.3 * (1 - mv);
  var stretch = lunge ? 1.12 : (tell ? 1 - 0.08 * tell : 1), crouch = tell * 2.5 * (T === 2 ? -1 : 1) + (down ? 2 : 0);
  var jit = tell && T === 1 ? Math.sin(t * 70) * 1.2 * tell : 0;
  c.save(); c.translate(x + jit, y); c.scale(sz, sz);
  if (inkOn) { var M0 = c.getTransform(), li; layers = []; for (li = 0; li < 3; li++) layers.push(inkLayerBegin(li, M0, -L * 0.9 - 14, -ll - Hb - nk - 26, L * 1.8 + 28, ll + Hb + nk + 34)); lay(1); }
  function eye(ex, ey, r) {
    if (down) { inkLine(c, [[ex - r, ey - r], [ex + r, ey + r]], LNc, 0.8); inkLine(c, [[ex + r, ey - r], [ex - r, ey + r]], LNc, 0.8); return; }
    c.fillStyle = eyeCol; c.beginPath(); c.ellipse(ex, ey, r, r * 1.1, 0, 0, 7); c.fill(); c.fillStyle = '#1a1410'; c.beginPath(); c.arc(ex + r * 0.15, ey, r * 0.45, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(ex - r * 0.3, ey - r * 0.4, r * 0.28, 0, 7); c.fill();
    H.eyes.push([ex * sz, ey * sz]);
  }
  function hoofAt(fx, fy, dirx, col) {                                   // a hoof (dark wedge) or a paw (rounded, with toes)
    if (sp.hoof) blobD(c, [[fx - 2.2 * sp.legW, fy - 2.2], [fx + 2.2 * sp.legW, fy - 2.2], [fx + 2.0 * sp.legW + dirx * 0.6, fy], [fx - 2.0 * sp.legW + dirx * 0.6, fy]], '#2e2420', true);
    else { blobD(c, [[fx - 2.6 * sp.legW, fy - 1.8], [fx + 2.6 * sp.legW + dirx * 1.2, fy - 1.8], [fx + 2.8 * sp.legW + dirx * 1.6, fy], [fx - 2.6 * sp.legW, fy]], col); inkLine(c, [[fx - 0.8, fy - 1.2], [fx - 0.6, fy - 0.2]], LNs, 0.4); inkLine(c, [[fx + 0.9, fy - 1.2], [fx + 1.1, fy - 0.2]], LNs, 0.4); }
  }
  function legS(hx, hy, phi, front, near, fwd) {                           // a leg in the side view: hip or shoulder to the foot, bent by ik2
    var swg = Math.sin(phi) * 4.2 * mv, lift = Math.max(0, Math.cos(phi)) * 3.2 * mv, fx = hx + fwd * swg + (lunge ? fwd * (front ? 5 : -4) : 0), fy = -lift - (front && T === 2 && tell ? 9 * tell : 0);
    var l1 = ll * 0.55 + Hb * 0.25, l2 = ll * 0.52, kk = ik2(hx, hy, fx, fy, l1, l2, front ? fwd : -fwd), col = near ? body : bodyD;
    limbD(c, hx, hy, lw * 1.25, kk[0], kk[1], lw * 0.95, col); limbD(c, kk[0], kk[1], lw * 0.95, kk[2], kk[3], lw * 0.75, col);
    hoofAt(kk[2], kk[3], fwd, near ? bodyD : shade(bodyD, -0.06));
  }
  function antlers(ax, ay, fwd, both) {                                     // deer: branching tines; moose: a palm with points
    var A = sp.antlerSize, col = '#8a7a62', i, sides = both ? [-1, 1] : [fwd];
    sides.forEach(function (sd) {
      if (ANT === 3) { blobD(c, jagged([[ax + sd * 1.5, ay], [ax + sd * (5 + 4 * A), ay - 3 * A], [ax + sd * (8 + 6 * A), ay - 7 * A], [ax + sd * (6 + 4 * A), ay - 10 * A], [ax + sd * (2 + 2 * A), ay - 6 * A]], ax + sd * 5, ay - 5, 1.2, 31), col, true); }
      else { var beam = [[ax + sd * 1, ay], [ax + sd * (3 + 2 * A), ay - 4 * A], [ax + sd * (4 + 3 * A), ay - 9 * A]]; inkLine(c, beam, col, 1.6 * A); for (i = 1; i <= ANT; i++) { var u = i / (ANT + 1), bx = ax + sd * (1 + (3 + 2 * A) * u * 1.3), by = ay - 9 * A * u; inkLine(c, [[bx, by], [bx - sd * 2 * A, by - 4 * A]], col, 1.2 * A); } }
    });
  }
  function earS(ex, ey, fwd, col) {
    if (EAR === 2) { c.fillStyle = col; c.beginPath(); c.ellipse(ex, ey, 2.4 * hd, 2.2 * hd, 0, 0, 7); c.fill(); c.fillStyle = mixHex(col, '#000000', 0.2); c.beginPath(); c.ellipse(ex, ey + 0.3, 1.2 * hd, 1.1 * hd, 0, 0, 7); c.fill(); }
    else if (EAR === 3) { blobD(c, [[ex + fwd * 1.2, ey + 1], [ex - fwd * 3.5 * hd, ey - 2.5 * hd], [ex - fwd * 5.5 * hd, ey - 5 * hd], [ex - fwd * 2 * hd, ey - 4 * hd]], col); }
    else { blobD(c, [[ex + fwd * 1.5, ey + 1], [ex - fwd * 2.2 * hd, ey - 4.5 * hd], [ex - fwd * 3.2 * hd, ey - 1], [ex - fwd * 1, ey + 1.2]], col, true); c.fillStyle = mixHex(col, '#000000', 0.25); blobD(c, [[ex + fwd * 0.5, ey + 0.3], [ex - fwd * 2.0 * hd, ey - 3.2 * hd], [ex - fwd * 2.4 * hd, ey - 0.6]], mixHex(col, '#000000', 0.25), true); }
  }
  if (side) {
    var fwd = -1; if (flip) c.scale(-1, 1);
    var top = -ll - Hb + bob, bot = -ll + bob, mid = (top + bot) / 2, fr = -L / 2 * stretch, bk = L / 2 * stretch;
    var shx = fr + L * 0.18, hpx = bk - L * 0.2, shy = bot - Hb * 0.25 + crouch, hpy = bot - Hb * 0.25;
    lay(0);
    legS(shx - 1, shy, ph + Math.PI, true, false, fwd); legS(hpx + 1, hpy, ph, false, false, fwd);
    if (TL === 3) { var tx0 = bk - 2, ty0 = mid - 1, tsw = Math.sin(t * 2 + ph) * 1.5; blobD(c, jagged([[tx0, ty0 - 2], [tx0 + 6, ty0 - 4 + tsw], [tx0 + 12, ty0 - 2 + tsw * 2], [tx0 + 14, ty0 + 2 + tsw * 2], [tx0 + 8, ty0 + 4 + tsw], [tx0 + 1, ty0 + 2]], tx0 + 7, ty0, 1.1, 41), body, true); if (sp.tailPale) { c.fillStyle = belly; c.beginPath(); c.arc(tx0 + 12.5, ty0 + tsw * 2, 1.8, 0, 7); c.fill(); } }
    else if (TL === 2) { var tc = [[bk - 1, top + 3], [bk + 3, top + 1 + Math.sin(t * 3) * 0.8], [bk + 5, top + 4], [bk + 3, top + 6]]; inkLine(c, tc, bodyD, 1.1); }
    else if (TL === 1) { blobD(c, [[bk - 1.5, mid - 2], [bk + 2.5, mid - 1], [bk + 2, mid + 3], [bk - 1, mid + 2]], sp.tailPale ? belly : bodyD); }
    lay(1);
    // the body: chest, a hump at the shoulders, the back, the rump, the belly sagging a little; bristles along the back
    var hump = sp.hump * 3.5;
    var bp = [[fr, mid + crouch * 0.5], [fr + 2, top + 1.5 + crouch], [fr + L * 0.22, top - hump + crouch * 0.6], [fr + L * 0.5, top - hump * 0.3], [bk - L * 0.18, top + 0.5], [bk - 1, mid - 2], [bk, mid + 2], [bk - 3, bot - 1], [fr + L * 0.5, bot + 1.5], [fr + 3, bot - 0.5 + crouch * 0.5]];
    blobD(c, bp, body);
    if (PAT === 1 || sp.paleMuzzle === 2) blobD(c, [[fr + 4, bot - Hb * 0.3], [bk - 4, bot - Hb * 0.25], [bk - 3, bot - 0.5], [fr + L * 0.5, bot + 1.2], [fr + 3, bot - 0.2]], belly);
    inkLine(c, [[fr + 3, top + 2 - hump * 0.5 + crouch], [fr + L * 0.45, top - hump * 0.8]], LIT, 1.1);
    if (sp.mane) blobD(c, jagged([[fr + 2, top + 1 + crouch], [fr + L * 0.2, top - hump - 2.5 + crouch * 0.6], [fr + L * 0.55, top - hump * 0.3 - 1.5], [bk - L * 0.2, top - 0.5], [bk - L * 0.2, top + 2], [fr + L * 0.5, top + 1 - hump * 0.3], [fr + 3, top + 3 + crouch]], fr + L * 0.4, top + 3, 1.4, 43), bodyD, true);
    // the neck and the head: the neck from the shoulder, raised by neckUp; the head with the snout, the eye, the ear, horns and tusks
    var nx0 = fr + 3, ny0 = top + 3 + crouch, headDown = tell * (T === 1 ? 4 : 1.5) + (lunge ? 2 : 0), hx = nx0 + fwd * nk * (0.9 - 0.4 * up) * stretch, hy = ny0 - nk * (0.1 + 0.9 * up) + headDown;
    limbD(c, nx0, ny0 + 1, 3.6 * bh, hx, hy, 3.0 * hd, body);
    var hr = 4.2 * hd;
    blobD(c, [[hx + fwd * hr * 0.9, hy - hr * 0.6], [hx + fwd * hr * 0.2, hy - hr], [hx - fwd * hr * 0.9, hy - hr * 0.5], [hx - fwd * hr * 0.8, hy + hr * 0.5], [hx + fwd * hr * 0.5, hy + hr * 0.9]], body);
    var snx = hx + fwd * (hr * 0.7 + sl), sny = hy + 0.8 + (sp.snoutFlat ? 0 : 0.6);
    blobD(c, [[hx + fwd * hr * 0.6, hy - sw * 0.8], [snx, sny - sw * 0.55], [snx + fwd * 0.6, sny + sw * 0.45], [hx + fwd * hr * 0.5, hy + sw * 0.9]], sp.paleMuzzle ? mixHex(body, belly, 0.5) : body);
    c.fillStyle = '#2a211c'; c.beginPath(); c.ellipse(snx + fwd * 0.3, sny - sw * 0.1, sp.snoutFlat ? 1.6 : 1.1, sp.snoutFlat ? 1.4 : 0.9, 0, 0, 7); c.fill();
    inkLine(c, [[snx - fwd * 1, sny + sw * 0.35], [hx + fwd * hr * 0.4, hy + sw * 0.8]], LNs, 0.5);
    if (sp.tusks) { c.fillStyle = '#efe6cf'; blobD(c, [[snx - fwd * 2, sny + sw * 0.3], [snx - fwd * 1, sny - sw * 0.9], [snx - fwd * 0.2, sny + sw * 0.35]], '#efe6cf', true); }
    if (sp.fangs && (tell || lunge)) { blobD(c, [[snx - fwd * 1.5, sny + sw * 0.4], [snx - fwd * 1.0, sny + sw * 0.4 + 2.2], [snx - fwd * 0.5, sny + sw * 0.4]], '#efe6cf', true); }
    eye(hx + fwd * hr * 0.35, hy - hr * 0.2, 0.9 * sp.eyeSize * hd);
    if (sp.brow) inkLine(c, [[hx + fwd * hr * 0.75, hy - hr * 0.5], [hx - fwd * hr * 0.1, hy - hr * 0.62]], LNc, 0.9);
    if (ANT) antlers(hx - fwd * hr * 0.3, hy - hr * 0.8, fwd, false);
    earS(hx - fwd * hr * 0.5, hy - hr * 0.7, fwd, body);
    lay(2);
    legS(shx + 1, shy, ph, true, true, fwd); legS(hpx - 1, hpy, ph + Math.PI, false, true, fwd);
  } else {
    // the front and back views: the body seen end-on, the legs in two pairs, the head over the chest or beyond the rump
    var dS = back ? -1 : 1, W = 14 * bw * (1 + 0.45 * Math.abs(tq)), top2 = -ll - Hb + bob, bot2 = -ll + bob, cx = -tq * W * 0.2, shift = tq * W * 0.42;
    var legX = W * 0.3, lift = function (phi) { return Math.max(0, Math.cos(phi)) * 2.6 * mv; }, dep = function (phi) { return Math.sin(phi) * 2.0 * mv * dS; };
    function legF(x0, phi, near, col) { var l = lift(phi), d = dep(phi), hy2 = bot2 - Hb * 0.2 + crouch, fy = -l + d + (near ? 0 : -3), fx = x0 + (near ? 0 : -tq * 2); var kk = ik2(x0, hy2, fx, fy, ll * 0.6 + Hb * 0.2, ll * 0.5, x0 < cx ? -1 : 1); limbD(c, x0, hy2, lw * 1.2, kk[0], kk[1], lw * 0.9, col); limbD(c, kk[0], kk[1], lw * 0.9, kk[2], kk[3], lw * 0.72, col); hoofAt(kk[2], kk[3], 0, shade(col, -0.06)); }
    lay(0);
    if (!back) { legF(cx - legX * 1.1 - shift * 0.6, ph, false, bodyD); legF(cx + legX * 1.1 - shift * 0.6, ph + Math.PI, false, bodyD); }
    else { legF(cx - legX * 0.95 + shift * 0.6, ph + Math.PI, false, bodyD); legF(cx + legX * 0.95 + shift * 0.6, ph, false, bodyD); }
    if (back && TL === 3) blobD(c, jagged([[cx - 2, bot2 - Hb * 0.5], [cx + 2, bot2 - Hb * 0.5], [cx + 3 + Math.sin(t * 2) * 1.5, bot2 + 4], [cx - 3 + Math.sin(t * 2) * 1.5, bot2 + 4]], cx, bot2, 1.1, 41), body, true);
    // the head in the back view sits beyond the body, so it goes first
    var hr2 = 4.2 * hd, hx2 = cx + shift + (back ? -shift * 0.4 : 0), hy2 = top2 + (back ? 2 : Hb * 0.35) - nk * up * 0.7 + tell * (T === 1 ? 3 : 1) + (lunge ? 2 : 0);
    function headF() {
      blobD(c, [[hx2 - hr2 * 0.95, hy2 - hr2 * 0.3], [hx2 - hr2 * 0.5, hy2 - hr2 * 0.95], [hx2 + hr2 * 0.5, hy2 - hr2 * 0.95], [hx2 + hr2 * 0.95, hy2 - hr2 * 0.3], [hx2 + hr2 * 0.6, hy2 + hr2 * 0.8], [hx2 - hr2 * 0.6, hy2 + hr2 * 0.8]], body);
      [-1, 1].forEach(function (sd) { var ex = hx2 + sd * hr2 * 0.7 + tq * 0.6, ey = hy2 - hr2 * 0.75; if (EAR === 2) { c.fillStyle = body; c.beginPath(); c.ellipse(ex, ey, 2.2 * hd, 2 * hd, 0, 0, 7); c.fill(); } else if (EAR === 3) blobD(c, [[ex - sd * 1, ey + 1.5], [ex + sd * 4 * hd, ey - 2.5 * hd], [ex + sd * 5.5 * hd, ey - 1], [ex + sd * 1.5, ey + 2]], body); else blobD(c, [[ex - sd * 1.2, ey + 1.5], [ex + sd * 1.5 * hd, ey - 4.2 * hd], [ex + sd * 3 * hd, ey - 0.5], [ex + sd * 0.8, ey + 1.8]], body, true); });
      if (ANT) antlers(hx2, hy2 - hr2 * 0.9, 1, true);
      if (!back) {
        var sx = hx2 + tq * hr2 * 0.3, sy = hy2 + hr2 * 0.35, swf = sw * (0.9 + 0.3 * sp.snout);
        blobD(c, [[sx - swf, sy - 1], [sx + swf, sy - 1], [sx + swf * 0.9, sy + sl * 0.5 + 1.5], [sx - swf * 0.9, sy + sl * 0.5 + 1.5]], sp.paleMuzzle ? mixHex(body, belly, 0.5) : body);
        c.fillStyle = '#2a211c'; c.beginPath(); c.ellipse(sx, sy + sl * 0.5 - 0.2, sp.snoutFlat ? 2.2 : 1.6, sp.snoutFlat ? 1.4 : 1.1, 0, 0, 7); c.fill();
        if (sp.tusks) { blobD(c, [[sx - swf * 0.8, sy + sl * 0.5 + 1], [sx - swf * 1.1, sy + sl * 0.5 - 2.5], [sx - swf * 0.4, sy + sl * 0.5 + 0.5]], '#efe6cf', true); blobD(c, [[sx + swf * 0.8, sy + sl * 0.5 + 1], [sx + swf * 1.1, sy + sl * 0.5 - 2.5], [sx + swf * 0.4, sy + sl * 0.5 + 0.5]], '#efe6cf', true); }
        if (sp.fangs && (tell || lunge)) { blobD(c, [[sx - 1.6, sy + sl * 0.5 + 1], [sx - 1.1, sy + sl * 0.5 + 3.2], [sx - 0.6, sy + sl * 0.5 + 1]], '#efe6cf', true); blobD(c, [[sx + 0.6, sy + sl * 0.5 + 1], [sx + 1.1, sy + sl * 0.5 + 3.2], [sx + 1.6, sy + sl * 0.5 + 1]], '#efe6cf', true); }
        eye(hx2 - hr2 * 0.42 + tq * 0.8, hy2 - hr2 * 0.15, 0.85 * sp.eyeSize * hd); eye(hx2 + hr2 * 0.42 + tq * 0.8, hy2 - hr2 * 0.15, 0.85 * sp.eyeSize * hd);
        if (sp.brow) { inkLine(c, [[hx2 - hr2 * 0.8, hy2 - hr2 * 0.5], [hx2 - hr2 * 0.1, hy2 - hr2 * 0.38]], LNc, 0.9); inkLine(c, [[hx2 + hr2 * 0.8, hy2 - hr2 * 0.5], [hx2 + hr2 * 0.1, hy2 - hr2 * 0.38]], LNc, 0.9); }
      } else { inkLine(c, [[hx2 - hr2 * 0.5, hy2 - hr2 * 0.2], [hx2 + hr2 * 0.5, hy2 - hr2 * 0.2]], LIT, 0.9); }
    }
    if (back) headF();
    lay(1);
    var hump2 = sp.hump * 3;
    blobD(c, [[cx - W * 0.5, bot2 - Hb * 0.45], [cx - W * 0.45 + tq * 2, top2 + 1 - hump2 * (back ? 0.3 : 0.6)], [cx + tq * W * 0.1, top2 - hump2 * (back ? 0.4 : 1) + crouch * 0.5], [cx + W * 0.45 + tq * 2, top2 + 1 - hump2 * (back ? 0.3 : 0.6)], [cx + W * 0.5, bot2 - Hb * 0.45], [cx + W * 0.4, bot2 + 1], [cx, bot2 + 2], [cx - W * 0.4, bot2 + 1]], body);
    if (!back && (PAT === 1 || sp.paleMuzzle === 2)) blobD(c, [[cx - W * 0.3, bot2 - Hb * 0.4], [cx + W * 0.3, bot2 - Hb * 0.4], [cx + W * 0.35, bot2 + 1], [cx, bot2 + 2], [cx - W * 0.35, bot2 + 1]], belly);
    if (sp.mane) blobD(c, jagged([[cx - W * 0.2, top2 - hump2 + 1], [cx, top2 - hump2 - 2.5], [cx + W * 0.2, top2 - hump2 + 1], [cx, top2 - hump2 + 3]], cx, top2, 1.2, 43), bodyD, true);
    inkLine(c, [[cx - W * 0.4, bot2 - Hb * 0.5], [cx - W * 0.2, top2 + 1]], LIT, 1.1);
    if (!back) { limbD(c, cx + shift * 0.5, top2 + Hb * 0.3 + crouch * 0.5, 3.2 * bh, hx2, hy2 + 2, 2.6 * hd, body); }
    lay(2);
    if (!back) headF();
    if (!back) { legF(cx - legX + shift * 0.3, ph + Math.PI, true, body); legF(cx + legX + shift * 0.3, ph, true, body); }
    else { legF(cx - legX - shift * 0.3, ph, true, body); legF(cx + legX - shift * 0.3, ph + Math.PI, true, body); }
  }
  if (layers) { var lj; for (lj = 0; lj < 3; lj++) inkLayerEnd(cOut, layers[lj], lj, INK_FIG.line, INK_FIG); c = cOut; }
  c.restore();
}
function creatureD(c, x, y, s, H) {
  H = H || creature();
  if (Math.round(H.spec.plan) === 5 && RIG.animals === 'views') { if (s.ang == null) { var s5 = {}, k5; for (k5 in s) s5[k5] = s[k5]; s5.ang = s.dir < 0 ? Math.PI : 0; s = s5; } quadD(c, x, y, s, H); return; }
  if (Math.round(H.spec.plan) === 7) { trollD(c, x, y, s, H); return; }
  if ((Math.round(H.spec.plan) === 8 || Math.round(H.spec.plan) === 9) && RIG.trolls === 'views') { trollViewD(c, x, y, s, H); return; }
  if (Math.round(H.spec.plan) === 8) { boulderTrollD(c, x, y, s, H); return; }
  if (Math.round(H.spec.plan) === 9) { forestTrollD(c, x, y, s, H); return; }
  if (Math.round(H.spec.plan) >= 5) {          // animals: without a heading, face straight left or right
    if (s.ang == null) { var s3 = {}, k3; for (k3 in s) s3[k3] = s[k3]; s3.ang = s.dir < 0 ? Math.PI : 0; s = s3; }
    animal3D(c, x, y, s, H); return;
  }
  var sp = H.spec, C = H.pal, LN0 = LN;
  LN = C.line;
  var t = s.t || 0, mv = s.move || 0, ph = s.phase || 0, dir = s.dir < 0 ? -1 : 1, st = s.state || 'idle', k = Math.max(0, Math.min(1, s.k || 0));
  var look = s.look || [1, 0], lkx = look[0] * dir, lky = look[1];
  var plan = Math.round(sp.plan), bw = sp.bodyW, bh = sp.bodyH, hd = sp.head, ll = sp.legLen, lw = 3.4 * sp.legW, T = Math.round(sp.tell);
  var tell = st === 'windup' ? k : 0, down = st === 'recover' || st === 'stunned', lunge = st === 'lunge';
  var bodyCol = down ? mixHex(C.body, '#b6a592', 0.55) : (tell ? mixHex(C.body, C.glow, tell * (T === 3 ? 0.12 : 0.55)) : C.body);
  var bodyD = shade(bodyCol, -0.09), i;
  var sx = 1, sy = 1 + Math.sin(t * 2.4) * 0.03 * sp.wobble, jx = 0, lift = 0, rot = 0;
  if (tell) {
    if (T === 0) { sx *= 1 + 0.24 * tell; sy *= 1 - 0.22 * tell; }
    else if (T === 1) { jx = Math.sin(t * 70) * 1.5 * tell; sy *= 1 - 0.06 * tell; }
    else if (T === 2) { lift = 4 * tell; rot = -0.3 * tell; sy *= 1 + 0.1 * tell; }
    else { sx *= 1 + 0.05 * Math.sin(t * 30) * tell; }
  }
  if (lunge) { sx *= 0.84; sy *= 1.2; rot = 0.2; }
  if (st === 'stagger') { sx *= 1.2; sy *= 0.8; }
  function capsule(x1, y1, x2, y2, col, w) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  function bent(pts, col, w) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (var pass = 0; pass < 2; pass++) {
      c.strokeStyle = pass ? col : LN; c.lineWidth = pass ? w : w + 2.2; c.beginPath();
      for (var n = 0; n < pts.length; n++) { if (n) c.lineTo(pts[n][0], pts[n][1]); else c.moveTo(pts[n][0], pts[n][1]); }
      c.stroke();
    }
  }
  function tri(x1, y1, x2, y2, x3, y3, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); fs(c, col, 1.3); }

  c.save(); c.translate(x + jx, y); c.scale(dir * sp.size, sp.size);

  /* body plan: B is the body ellipse, F the face, TOP where horns sit, TL where a tail starts, HD a separate head */
  var B, F, TOP, TL = null, HD = null, step = Math.abs(Math.sin(ph)) * mv, bobY = step * 1.2 * sp.bob;
  if (plan === 1) {
    var hipY = -(5 * ll);
    B = { x: 0, y: hipY - 5 * bh - bobY, rx: 10 * bw, ry: 6 * bh };
    HD = { x: B.rx * 0.8 + 2.5 * hd, y: B.y - 2.5 * bh - 1.5 * hd, r: 5.4 * hd };
    F = { x: HD.x + 1.2, y: HD.y, w: HD.r * 1.1 }; TOP = { x: HD.x - 0.5, y: HD.y - HD.r, w: HD.r * 0.7 }; TL = { x: -B.rx + 1.5, y: B.y - 1 };
    [[-3.5, Math.PI, 1], [4, 0, 1], [-5.5, 0, 0], [6, Math.PI, 0]].forEach(function (q) {
      var p2 = ph + q[1], hx = q[0] * bw, fx = hx + Math.sin(p2) * 3.2 * mv, fy = -Math.max(0, Math.cos(p2)) * 2.4 * mv;
      capsule(hx, hipY + 1 - bobY, fx, fy - 1, q[2] ? bodyD : bodyCol, lw); ell(c, fx + 0.8, fy - 0.6, 2.6, 1.6, bodyD, 1.3);
    });
  } else if (plan === 2) {
    var hip = -(5 * ll);
    B = { x: 0, y: hip - 7.5 * bh - bobY, rx: 8.6 * bw, ry: 8.6 * bh };
    HD = { x: 0, y: B.y - B.ry - 3 * hd + 1.5, r: 5.4 * hd };
    F = { x: 0.8, y: HD.y + 0.4, w: HD.r * 1.15 }; TOP = { x: 0, y: HD.y - HD.r, w: HD.r * 0.75 };
    [-1, 1].forEach(function (sd) {
      var p2 = ph + (sd > 0 ? Math.PI : 0), fx = sd * 3.6 * bw + Math.sin(p2) * 1.2 * mv, fy = -Math.max(0, Math.cos(p2)) * 2.6 * mv;
      capsule(sd * 3.4 * bw, hip - bobY, fx, fy - 1.4, bodyD, lw + 0.8); ell(c, fx + 0.5, fy - 0.8, 3.2, 1.9, bodyD, 1.4);
    });
  } else if (plan === 3) {
    var hov = (10 + Math.sin(t * 2.2) * 3 * sp.bob) * sp.hover;
    B = { x: 0, y: -8.5 * bh - hov, rx: 8.6 * bw, ry: 8 * bh };
    F = { x: 1.5, y: B.y - 0.5, w: B.rx }; TOP = { x: 0, y: B.y - B.ry, w: B.rx * 0.55 };
    for (i = 0; i < 4; i++) {
      var tx = (i - 1.5) * B.rx * 0.42, pts = [], n;
      for (n = 0; n <= 4; n++) pts.push([tx + Math.sin(t * 3.4 + i * 1.7 + n * 0.9) * 1.6 * (n / 4) - mv * n * 0.9, B.y + B.ry - 2 + n * 2 * ll]);
      bent(pts, i % 2 ? bodyD : bodyCol, lw * 0.6);
    }
  } else if (plan === 4) {
    B = { x: 0, y: -(2.6 * ll + 4.6 * bh) - bobY * 0.4, rx: 10 * bw, ry: 5 * bh };
    F = { x: B.rx * 0.35, y: B.y - 0.6, w: B.rx * 0.7 }; TOP = { x: -1, y: B.y - B.ry, w: B.rx * 0.5 }; TL = { x: -B.rx + 1.5, y: B.y };
    var nl = Math.max(2, Math.min(4, Math.round(sp.legs / 2)));
    [-1, 1].forEach(function (sd) {
      for (var q = 0; q < nl; q++) {
        var u = nl === 1 ? 0 : q / (nl - 1) - 0.5, p2 = ph * 1.4 + q * Math.PI + (sd > 0 ? Math.PI : 0), up = Math.max(0, Math.sin(p2)) * 2.6 * mv;
        var bx0 = sd * B.rx * 0.55 + u * 3, kx = sd * (B.rx + 2.6 * ll) + u * 5, fx = sd * (B.rx + 5 * ll) + u * 9 + Math.cos(p2) * 1.6 * mv;
        bent([[bx0, B.y + 1], [kx, B.y - 3.4 * ll - up], [fx, u * 3.4 - up]], bodyD, lw * 0.62);
      }
    });
  } else {
    var hop = step * 4 * sp.bob, squ = 1 + Math.cos(ph * 2) * 0.09 * mv * sp.wobble;
    B = { x: 0, y: -6.6 * bh + 0.8 - hop, rx: 9.6 * bw * squ, ry: 7.2 * bh / squ };
    F = { x: 1.5, y: B.y - 0.6, w: B.rx }; TOP = { x: 0, y: B.y - B.ry, w: B.rx * 0.55 }; TL = { x: -B.rx + 1.5, y: B.y + B.ry * 0.45 };
  }

  /* everything above the legs leans, swells and stretches with the state */
  c.save(); c.translate(0, -lift); c.translate(B.x, B.y + B.ry); c.rotate(rot); c.scale(sx, sy); c.translate(-B.x, -(B.y + B.ry));
  var tail = Math.round(sp.tail);
  if (TL && tail) {
    if (tail === 1) ell(c, TL.x - 1.5, TL.y, 2.6, 2.4, bodyD, 1.4);
    else {
      var tp = [], n2;
      for (n2 = 0; n2 <= 5; n2++) tp.push([TL.x - n2 * 2.3, TL.y - n2 * 0.9 + Math.sin(t * 4 + n2 * 0.9) * 1.3 * (n2 / 5) - n2 * n2 * 0.12]);
      bent(tp, bodyD, 2.6);
      if (tail === 3) { var e5 = tp[5]; tri(e5[0] - 3.6, e5[1] - 1.2, e5[0] + 0.6, e5[1] - 3, e5[0] + 0.8, e5[1] + 2, C.accent); }
    }
  }
  var top = Math.round(sp.top);
  if (top === 4) for (i = 0; i < 4; i++) { var sxp = B.x - B.rx * 0.6 + i * B.rx * 0.4, syp = B.y - B.ry * Math.sqrt(Math.max(0.05, 1 - Math.pow((sxp - B.x) / B.rx, 2))) + 1; tri(sxp - 2, syp + 1, sxp + 0.4, syp - 4.6, sxp + 2.4, syp + 1, C.accent); }
  if (plan === 2) {
    var raise = Math.max(tell, lunge ? 1 : 0);
    [-1, 1].forEach(function (sd) {
      var sw = Math.sin(ph + (sd > 0 ? 0 : Math.PI)) * 1.6 * mv, shx = sd * (B.rx - 1.4), shy = B.y - 3 * bh;
      var hx = sd * (B.rx + 2.6 + raise * 2), hy = shy + 8 * sp.armLen * (1 - raise * 1.7) + sw;
      if (lunge) { hx = sd * (B.rx * 0.5) + 6; hy = B.y - 1; }
      capsule(shx, shy, hx, hy, bodyD, lw + 0.4); ell(c, hx, hy, 3, 3, bodyCol, 1.4);
    });
  }
  c.beginPath(); c.ellipse(B.x, B.y, B.rx, B.ry, 0, 0, Math.PI * 2); c.fillStyle = bodyCol; c.fill();
  c.save(); c.clip();
  c.fillStyle = bodyD; c.beginPath(); c.ellipse(B.x + B.rx * 0.25, B.y + B.ry * 0.9, B.rx * 1.2, B.ry * 0.7, 0, 0, Math.PI * 2); c.fill();
  var pat = Math.round(sp.pattern);
  if (pat === 1) { c.fillStyle = C.belly; c.beginPath(); c.ellipse(B.x + 1, B.y + B.ry * 0.55, B.rx * 0.68, B.ry * 0.6, 0, 0, Math.PI * 2); c.fill(); }
  else if (pat === 2) { c.fillStyle = C.belly; [[-0.55, -0.3, 0.2], [-0.15, 0.35, 0.16], [0.3, -0.45, 0.14], [0.6, 0.2, 0.18], [-0.7, 0.3, 0.12]].forEach(function (q) { c.beginPath(); c.ellipse(B.x + q[0] * B.rx, B.y + q[1] * B.ry, q[2] * B.rx, q[2] * B.rx * 0.8, 0, 0, Math.PI * 2); c.fill(); }); }
  else if (pat === 3) { c.strokeStyle = C.belly; c.lineWidth = B.rx * 0.16; c.lineCap = 'round'; for (i = -2; i <= 1; i++) { c.beginPath(); c.moveTo(B.x + i * B.rx * 0.42 - 2, B.y - B.ry); c.lineTo(B.x + i * B.rx * 0.42 + 1.5, B.y + B.ry * 0.1); c.stroke(); } }
  c.fillStyle = 'rgba(255,255,255,0.26)'; c.beginPath(); c.ellipse(B.x - B.rx * 0.35, B.y - B.ry * 0.5, B.rx * 0.4, B.ry * 0.22, -0.3, 0, Math.PI * 2); c.fill();
  c.restore();
  c.beginPath(); c.ellipse(B.x, B.y, B.rx, B.ry, 0, 0, Math.PI * 2); c.lineWidth = 1.8; c.strokeStyle = LN; c.stroke();
  if (HD) {
    ell(c, HD.x, HD.y, HD.r * 1.04, HD.r, bodyCol, 1.8);
    c.fillStyle = 'rgba(255,255,255,0.24)'; c.beginPath(); c.ellipse(HD.x - HD.r * 0.3, HD.y - HD.r * 0.5, HD.r * 0.4, HD.r * 0.22, -0.3, 0, Math.PI * 2); c.fill();
  }
  if (top === 1) { ell(c, TOP.x - TOP.w, TOP.y + 1, 2.2, 2.6, bodyD, 1.3); ell(c, TOP.x + TOP.w, TOP.y + 1, 2.2, 2.6, bodyD, 1.3); }
  else if (top === 2) [-1, 1].forEach(function (sd) { var hx2 = TOP.x + sd * TOP.w; c.beginPath(); c.moveTo(hx2 - sd * 1.8, TOP.y + 2); c.quadraticCurveTo(hx2 + sd * 4.5, TOP.y - 1, hx2 + sd * 3.4, TOP.y - 7); c.quadraticCurveTo(hx2 + sd * 0.6, TOP.y - 2.5, hx2 + sd * 1.8, TOP.y + 2.4); c.closePath(); fs(c, C.accent, 1.3); });
  else if (top === 3) [-1, 1].forEach(function (sd) { var ax = TOP.x + sd * TOP.w * 0.7, tipx = ax + sd * 2.5 + Math.sin(t * 3 + sd) * 0.8, tipy = TOP.y - 7.5; c.strokeStyle = LN; c.lineWidth = 1.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(ax, TOP.y + 1); c.quadraticCurveTo(ax + sd, TOP.y - 4, tipx, tipy); c.stroke(); ell(c, tipx, tipy, 1.9 + tell, 1.9 + tell, C.glow, 1.1); });
  else if (top === 5) {
    c.save(); c.translate(TOP.x, TOP.y - 2.2); c.rotate(t * 2);
    for (i = 0; i < 6; i++) { c.rotate(Math.PI / 3); rr(c, -1.1, -4.6, 2.2, 2.6, 0.5, C.accent, 1.1); }
    ell(c, 0, 0, 3.1, 3.1, C.accent, 1.3); ell(c, 0, 0, 1.1, 1.1, bodyD, 0.9); c.restore();
  }

  /* face */
  var ne = Math.max(1, Math.min(4, Math.round(sp.eyes))), es = Math.round(sp.eyeStyle), er = (ne === 1 ? 3.5 : 2.7 - (ne - 2) * 0.35) * sp.eyeSize * (T === 3 ? 1 + 0.3 * tell : 1);
  var ey = F.y - (plan === 0 || plan === 3 ? B.ry * 0.12 : 0), my = ey + er + 2.2, open = Math.max(tell, lunge ? 1 : 0);
  for (i = 0; i < ne; i++) {
    var ex = F.x + (ne === 1 ? 0 : -F.w * 0.45 + i * F.w * 0.9 / (ne - 1));
    if (down) { c.strokeStyle = LN; c.lineWidth = 1.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(ex - er * 0.7, ey - er * 0.7); c.lineTo(ex + er * 0.7, ey + er * 0.7); c.moveTo(ex + er * 0.7, ey - er * 0.7); c.lineTo(ex - er * 0.7, ey + er * 0.7); c.stroke(); continue; }
    if (es === 1) { ell(c, ex, ey, er * 0.85, er * 0.85, C.glow, 1.1); ell(c, ex - er * 0.2, ey - er * 0.2, er * 0.35, er * 0.35, '#ffffff', 0); continue; }
    ell(c, ex, ey, er, er * 1.08, tell && T === 3 ? mixHex('#fff7e8', C.glow, tell) : '#fff7e8', 1.3);
    ell(c, ex + lkx * er * 0.38, ey + lky * er * 0.34, er * 0.48, er * 0.54, tell ? mixHex(C.eye, C.glow, tell * 0.7) : C.eye, 0);
    ell(c, ex + lkx * er * 0.38 - er * 0.18, ey + lky * er * 0.34 - er * 0.22, er * 0.16, er * 0.16, '#ffffff', 0);
    if (es === 2) { var sl = ne === 1 ? 0 : (ex < F.x ? 1 : -1); c.strokeStyle = LN; c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(ex - er * 1.1, ey - er * (1.25 + sl * 0.45)); c.lineTo(ex + er * 1.1, ey - er * (1.25 - sl * 0.45)); c.stroke(); }
    if (es === 3) { c.beginPath(); c.ellipse(ex, ey, er + 0.7, er * 1.08 + 0.7, 0, Math.PI, Math.PI * 2); c.closePath(); c.fillStyle = bodyCol; c.fill(); c.strokeStyle = LN; c.lineWidth = 1.2; c.beginPath(); c.moveTo(ex - er - 0.4, ey); c.lineTo(ex + er + 0.4, ey); c.stroke(); }
  }
  var mouth = Math.round(sp.mouth), mw = Math.min(F.w * 0.5, 4.6);
  if (mouth === 1) { c.strokeStyle = LN; c.lineWidth = 1.2; c.lineCap = 'round'; c.beginPath(); c.arc(F.x, my - 1.2, mw * 0.6, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
  else if (mouth === 2) { c.strokeStyle = LN; c.lineWidth = 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(F.x - mw, my); c.lineTo(F.x + mw, my); c.stroke(); tri(F.x - mw * 0.7, my, F.x - mw * 0.25, my, F.x - mw * 0.5, my + 2.8 + open, C.accent); tri(F.x + mw * 0.25, my, F.x + mw * 0.7, my, F.x + mw * 0.5, my + 2.8 + open, C.accent); }
  else if (mouth === 3) {
    var mh = 1.6 + open * 2.2;
    ell(c, F.x, my + mh * 0.5, mw, mh, '#3a1c24', 1.3);
    c.fillStyle = C.accent; for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(F.x + i * mw * 0.55 - 1, my + mh * 0.5 - mh * 0.75); c.lineTo(F.x + i * mw * 0.55 + 1, my + mh * 0.5 - mh * 0.75); c.lineTo(F.x + i * mw * 0.55, my + mh * 0.5 - mh * 0.75 + 1.8); c.closePath(); c.fill(); }
  }
  if (tell && T === 3) { c.strokeStyle = C.glow; c.globalAlpha = 0.7 * (1 - (t * 3 % 1)); c.lineWidth = 1.4; c.beginPath(); c.arc(F.x, ey, er * 1.6 + (t * 3 % 1) * 8, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
  c.restore();

  /* markers stay upright and unflipped */
  c.scale(dir, 1);
  var headTop = (HD ? HD.y - HD.r : B.y - B.ry) - lift - 9;
  if (st === 'stunned') for (i = 0; i < 3; i++) { var a = t * 5 + i * 2.09; ell(c, Math.cos(a) * 8, headTop + 3 + Math.sin(a) * 2.5, 1.5, 1.5, '#ffd34d', 0.9); }
  if (tell && sp.mark) { ell(c, 0, headTop, 4.4, 4.4, '#ffd34d', 1.5); c.fillStyle = LN; c.font = 'bold 7px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('!', 0, headTop + 2.6); }
  c.restore();
  LN = LN0;
}


var dkB = null;


// Every page applies the game's stored choices from one place (2026-10-07, Robin: the editors should pull from the same
// source): the hero the Character Editor handed over (game.hero2), the creatures the Creature Editor handed over
// (game.creatures), the rig to draw them with (creature.rig).
function applyStored(st) {
  try { var gh = JSON.parse(st.getItem('game.hero2')); if (gh && typeof gh === 'object') setHero(gh); } catch (e) {}
  try { var gc = JSON.parse(st.getItem('game.creatures')); if (gc && typeof gc === 'object') { var k; for (k in gc) if (ANIMALS[k] && gc[k] && typeof gc[k] === 'object') useAnimal(k, gc[k]); } } catch (e) {}
  try { var rg = st.getItem('creature.rig'); if (rg === 'turntable' || rg === 'views') { RIG.animals = rg; RIG.trolls = rg; } } catch (e) {}
}
return { lib: { INK_FIG: INK_FIG, RIG: RIG, applyStored: applyStored, quadD: quadD, trollViewD: trollViewD, playerD: playerD, heroDef: HEROD_DEF, setHero: setHero, hero: hero, makeFigure: makeFigure, figureD: figureD, concepts: CONCEPTS, conceptSpec: conceptSpec, heroes: HEROES, heroSpec: heroSpec, inkMetrics: inkMetrics, IDLES: IDLES, JOBS: JOBS, idlePose: idlePose, jobPose: jobPose, poseLerp: poseLerp, heldD: heldD, figureHeld: figureHeld, folk: FOLK, folkSpec: folkSpec, creatureDef: CREATURE_DEF, setCreature: setCreature, creature: creature, makeCreature: makeCreature, animals: ANIMALS, useAnimal: useAnimal, animalSpec: animalSpec, animalAttack: animalAttack, attacks: ATTACKS, creatureD: creatureD, heroP: heroP, setSprite: setSprite, sprite: sprite, sprites: SPRITES, rr: rr, ell: ell, fs: fs, pathRR: pathRR, LN: LN, rng: rng, mk: mk } };
})();
if (typeof module !== 'undefined') module.exports = GameArt;
