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
var HEROD_DEF = {
  scale: 0.78, headW: 0.55, headH: 0.55, bodyW: 0.84, bodyH: 1.15, legL: 2.2, legW: 0.82, armL: 1.4, armW: 0.78, eyewear: 0, eyewearSize: 1, eyeSize: 0.85, blush: 0.5, beard: 0,   // a clear step leaner (Robin, 2026-10-07): the head a quarter of the height
  hair: 0, hat: 0, clothes: 0, matte: 0.6, ring: 0,
  walkRate: 1.4, bob: 1, stride: 1, armSwing: 1, sway: 0.25, stance: 0.8, lean: 1, atkStyle: 0, atkPower: 1, bladeLen: 1, slashSize: 1, slashWidth: 0.66,
  hue: 0, sat: 1, lum: 1,
  col: { skin: '#ebc9a2', hair: '#a85a2a', coat: '#4f7a74', vest: '#6a4a32', pants: '#56505e', boot: '#3e2c24', trim: '#c99a3a',   // the earth palette (docs/art-direction.md)
    cloak: '#7a3b3b', dress: '#5b6b8a', fur: '#b89a74', iron: '#9aa0aa',
    lens: '#a9e6ff', eye: '#2a1c2a', line: '#231a16', blade: '#eef3fb', slash: '#ffffff' }
};
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
  curHero = { spec: sp, pal: heroPalette(sp), lift: (sp.legL - 1) * LEG_LEN };
  return sp;
}
function hero() { if (!curHero) setHero(); return curHero; }
// Other people are the same figure with their own spec. makeFigure(spec) gets one ready; figureD draws it like
// playerD (feet at x, y), at its own scale.
function makeFigure(spec) { var sp = fillSpec(HEROD_DEF, spec); return { spec: sp, pal: heroPalette(sp), lift: (sp.legL - 1) * LEG_LEN }; }
function figureD(c, x, y, dir, an, pose, F) {
  var keep = curHero; curHero = F;
  c.save(); c.translate(x, y); c.scale(F.spec.scale, F.spec.scale);
  try { playerD(c, 0, 0, dir, an, pose); } finally { c.restore(); curHero = keep; }
}
// People of the world, as changes on top of the hero's spec.
var FOLK = {
  dwarf: { name: 'Brokk', set: { scale: 0.8, headW: 0.8, headH: 0.74, bodyW: 1.28, bodyH: 0.9, legL: 1.0, legW: 1.3, armL: 1.0, armW: 1.25, eyeSize: 0.85, blush: 1, beard: 1, walkRate: 1.7, stance: 1, ring: 1 },
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
  { name: 'Child', note: 'Small, a big head, a plain tunic.', set: { clothes: 1, hair: 1, beard: 0, hat: 0, matte: 1, scale: 0.55, headW: 0.8, headH: 0.78, legL: 1.3, eyeSize: 1.1 }, col: { coat: '#9a8a6a', pants: '#5a4a3a', trim: '#5a3a26', hair: '#e8c070' } },
  { name: 'Elder', note: 'Grey long hair and a long beard, a grey cloak, a slower walk.', set: { clothes: 2, hair: 2, beard: 3, hat: 0, matte: 1, bodyH: 0.95, walkRate: 0.9, bob: 0.7 }, col: { coat: '#6a6a5a', cloak: '#5a5a5a', pants: '#4a4a44', hair: '#c8c2b8', trim: '#8a7a5a', skin: '#f0c49c' } }
];
function conceptSpec(name) {
  var a = null, i; for (i = 0; i < CONCEPTS.length; i++) if (CONCEPTS[i].name === name) a = CONCEPTS[i];
  var sp = fillSpec(HEROD_DEF, null), k; if (!a) return sp;
  for (k in a.set) sp[k] = a.set[k]; for (k in a.col) sp.col[k] = a.col[k];
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

function playerD(c, x, y, dir, an, pose) {
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
  troll: { name: 'Mountain troll', set: { plan: 7, size: 2.05, speed: 0.6, windup: 1.6, lunge: 0, hp: 80, aggro: 130, tell: 1, trollHair: 1.2, trollMoss: 0.7, trollAge: 0.75 },
    col: { body: '#7a7064', belly: '#9a9082', accent: '#5a4636', eye: '#ffd34d', glow: '#ff8a3a', line: '#2a2824', moss: '#8fa86a' } },
  trollStone: { name: 'Stone troll', set: { plan: 7, size: 2.05, speed: 0.6, windup: 1.6, lunge: 0, hp: 80, aggro: 130, tell: 1, trollHair: 1.2, trollAge: 0.75 },
    col: { body: '#8c8c92', belly: '#a6a6ac', accent: '#6e6e74', eye: '#8c8c92', glow: '#8c8c92', line: '#3a3a40', moss: '#8c8c92' } },
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
function animalAttack(key) { return ATTACKS[key] || null; }
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
function creatureD(c, x, y, s, H) {
  H = H || creature();
  if (Math.round(H.spec.plan) === 7) { trollD(c, x, y, s, H); return; }
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


return { lib: { INK_FIG: INK_FIG, playerD: playerD, heroDef: HEROD_DEF, setHero: setHero, hero: hero, makeFigure: makeFigure, figureD: figureD, concepts: CONCEPTS, conceptSpec: conceptSpec, folk: FOLK, folkSpec: folkSpec, creatureDef: CREATURE_DEF, setCreature: setCreature, creature: creature, makeCreature: makeCreature, animals: ANIMALS, useAnimal: useAnimal, animalSpec: animalSpec, animalAttack: animalAttack, attacks: ATTACKS, creatureD: creatureD, heroP: heroP, setSprite: setSprite, sprite: sprite, sprites: SPRITES, rr: rr, ell: ell, fs: fs, pathRR: pathRR, LN: LN, rng: rng, mk: mk } };
})();
if (typeof module !== 'undefined') module.exports = GameArt;
