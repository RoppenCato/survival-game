var StyleLab = (function () {
'use strict';
var W = 480, H = 300;
var P = null, OLC = '#100c18', lights = [];

function mk(w, h) {
  if (typeof document !== 'undefined') { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  return global.__mk(w, h);
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function rng(seed) {
  seed = (seed | 0) + 1;
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------------- parameters and presets ---------------- */
var DEF = {
  factoryHue: 238, outsideHue: 150, accentHue: 40, shadowHue: 252,
  sat: 1.08, bright: 0, contrast: 1.1, shade: 0.55,
  twist: 0.12, spindly: 0.12, rough: 0.08, lush: 0.92, round: 0.85, sparkle: 0.7, outlineW: 1.1, outlineDark: 0.86, stripes: 0, look: 1, texture: 0.6,
  light: 0.5, fog: 0.25, glow: 0.85, vignette: 0.38, seed: 7, scaleRef: 1
};
var PRESETS = [
  { name: 'Night Forest', note: 'Blue-violet Factory, deep teal-green outside, warm amber lanterns. Cozy and a little mysterious, like a MapleStory forest at night.',
    p: { factoryHue: 238, outsideHue: 152, accentHue: 42, shadowHue: 250, sat: 1.1, bright: -1, contrast: 1.12, shade: 0.55, twist: 0.12, spindly: 0.12, rough: 0.08, lush: 0.95, round: 0.85, sparkle: 0.8, outlineW: 1.1, outlineDark: 0.86, light: 0.5, fog: 0.3, glow: 0.9, vignette: 0.4 } },
  { name: 'Dusk Workshop', note: 'Purple Factory with orange lamps, fresh green outside. Warmer and friendlier, like early evening.',
    p: { factoryHue: 262, outsideHue: 128, accentHue: 24, shadowHue: 278, sat: 1.15, bright: 1, contrast: 1.1, shade: 0.5, twist: 0.15, spindly: 0.15, rough: 0.08, lush: 0.9, round: 0.85, sparkle: 0.6, outlineW: 1.1, outlineDark: 0.84, light: 0.6, fog: 0.22, glow: 0.8, vignette: 0.32 } },
  { name: 'Moonlit Cute', note: 'Cool blue Factory, mint outside and a soft pink glow. The sweetest direction, with lots of sparkle.',
    p: { factoryHue: 218, outsideHue: 168, accentHue: 328, shadowHue: 245, sat: 1.0, bright: 3, contrast: 1.05, shade: 0.5, twist: 0.1, spindly: 0.1, rough: 0.05, lush: 0.95, round: 1.0, sparkle: 1.0, outlineW: 1.05, outlineDark: 0.8, light: 0.6, fog: 0.3, glow: 1.0, vignette: 0.3 } },
  { name: 'Storybook Dark', note: 'The combat test colours, turned down for night. Bright greens and warm brass with a dark outline.',
    p: { factoryHue: 215, outsideHue: 112, accentHue: 46, shadowHue: 262, sat: 1.15, bright: 0, contrast: 1.02, shade: 0.45, twist: 0.1, spindly: 0.1, rough: 0.05, lush: 0.9, round: 0.9, sparkle: 0.5, outlineW: 1.15, outlineDark: 0.9, light: 0.66, fog: 0.15, glow: 0.65, vignette: 0.28 } },
  { name: 'Mossy Lantern', note: 'Brown-violet Factory, deep moss outside, golden light everywhere. Old, warm and overgrown.',
    p: { factoryHue: 292, outsideHue: 140, accentHue: 48, shadowHue: 290, sat: 1.0, bright: -2, contrast: 1.15, shade: 0.6, twist: 0.2, spindly: 0.2, rough: 0.1, lush: 1.0, round: 0.8, sparkle: 0.7, outlineW: 1.1, outlineDark: 0.88, light: 0.5, fog: 0.35, glow: 0.95, vignette: 0.42 } }
];

/* ---------------- colour helpers ---------------- */
function mixHue(a, b, t) { var d = ((b - a + 540) % 360) - 180; return (a + d * t + 360) % 360; }
function C(h, s, l, a) {
  s = clamp(s * P.sat, 0, 100); l = clamp(50 + (l - 50) * P.contrast + P.bright, 2, 96);
  return a == null ? 'hsl(' + h.toFixed(0) + ',' + s.toFixed(0) + '%,' + l.toFixed(0) + '%)' : 'hsla(' + h.toFixed(0) + ',' + s.toFixed(0) + '%,' + l.toFixed(0) + '%,' + a + ')';
}
function M(h, s, l) {
  var shH = mixHue(h, P.shadowHue, 0.55), d = 9 + 24 * P.shade;
  return { base: C(h, s, l), shade: C(shH, s * 0.95, l - d), hl: C(mixHue(h, 55, 0.18), s * 0.85, l + 7 + 8 * P.shade) };
}
function setup(params) {
  P = {}; var k;
  for (k in DEF) P[k] = DEF[k];
  for (k in params) P[k] = params[k];
  OLC = 'hsl(' + P.shadowHue.toFixed(0) + ',28%,' + (6 + (1 - P.outlineDark) * 30).toFixed(0) + '%)';
}
function ow(size) { var f = size === 'S' ? 0.7 : size === 'L' ? 1.35 : size === 'XL' ? 1.7 : 1; return 1.9 * P.outlineW * f * (P.look === 2 ? 0.4 : (P.look === 1 ? 0.35 : 1)); }

/* ---------------- geometry helpers ---------------- */
function wn(x, y, s) { return Math.sin(x * 0.23 + s) * 0.55 + Math.sin(y * 0.19 + s * 1.7) * 0.45 + Math.sin((x - y) * 0.37 + s * 2.3) * 0.3; }
function dens(pts, step) {
  var out = [], n = pts.length;
  for (var i = 0; i < n; i++) {
    var a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(d / step));
    for (var j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
  }
  return out;
}
function wob(pts, amp, seed) { return pts.map(function (p) { return [p[0] + wn(p[0], p[1], seed) * amp, p[1] + wn(p[1], p[0], seed + 3) * amp]; }); }
function path(c, d) { c.beginPath(); for (var i = 0; i < d.length; i++) { if (i === 0) c.moveTo(d[i][0], d[i][1]); else c.lineTo(d[i][0], d[i][1]); } c.closePath(); }
function bbox(d) { var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (var i = 0; i < d.length; i++) { x0 = Math.min(x0, d[i][0]); y0 = Math.min(y0, d[i][1]); x1 = Math.max(x1, d[i][0]); y1 = Math.max(y1, d[i][1]); } return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }
function ellPts(cx, cy, rx, ry, n) { var o = []; n = n || 18; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
function rectPts(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function rrPts(x, y, w, h, r) {
  var o = [], k = 4, i, a;
  function arc(cx, cy, a0) { for (i = 0; i <= k; i++) { a = a0 + i / k * Math.PI / 2; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }
  arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
  return o;
}
function blobPts(cx, cy, rx, ry, seed, n, v) {
  var R = rng(seed), o = [], i; n = Math.max(n || 14, 26); v = v == null ? 0.22 : v;
  var p1 = R() * 6.28, p2 = R() * 6.28, p3 = R() * 6.28;
  for (i = 0; i < n; i++) { var a = i / n * Math.PI * 2, k = 1 + (Math.sin(a * 3 + p1) * 0.5 + Math.sin(a * 5 + p2) * 0.3 + Math.sin(a * 2 + p3) * 0.35) * v; o.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return o;
}
function ribbon(center, w0, w1, wf) {
  var L = [], Rr = [], n = center.length, i;
  for (i = 0; i < n; i++) {
    var p = center[i], a = center[Math.max(0, i - 1)], b = center[Math.min(n - 1, i + 1)];
    var dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl;
    var t = i / (n - 1), w = (wf ? wf(t) : lerp(w0, w1, t)) / 2;
    L.push([p[0] + nx * w, p[1] + ny * w]); Rr.push([p[0] - nx * w, p[1] - ny * w]);
  }
  return L.concat(Rr.reverse());
}
function curvePts(p0, p1, p2, n) { var o = []; for (var i = 0; i <= n; i++) { var t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }

/* ---------------- drawing primitives ---------------- */
function crescent(c, d, dx, dy, col, bb) {
  c.save(); path(c, d); c.clip();
  c.beginPath(); c.rect(bb.x - 5, bb.y - 5, bb.w + 10, bb.h + 10);
  for (var i = 0; i < d.length; i++) { if (i === 0) c.moveTo(d[i][0] + dx, d[i][1] + dy); else c.lineTo(d[i][0] + dx, d[i][1] + dy); }
  c.closePath(); c.fillStyle = col; c.fill('evenodd'); c.restore();
}
function paintStrokes(c, bb, seed, col, alpha, n, ang) {
  var R = rng(seed * 13 + 5), i; c.save(); c.lineCap = 'round'; c.strokeStyle = col; c.globalAlpha = alpha;
  for (i = 0; i < n; i++) {
    var x = bb.x + R() * bb.w, y = bb.y + R() * bb.h, L = 3 + R() * 7, a = ang + (R() - 0.5) * 0.7;
    c.lineWidth = 0.8 + R() * 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke();
  }
  c.restore();
}
function shape(c, pts, m, o) {
  o = o || {};
  var look = P.look, amp = P.rough * 1.25 * (o.rough == null ? 1 : o.rough), seed = o.seed || 1;
  if (look !== 0) amp *= 0.8;
  var d = wob(dens(pts, 6), amp, seed), bb = bbox(d), i;
  if (look === 1) {
    var g = c.createLinearGradient(bb.x, bb.y, bb.x + bb.w * 0.85, bb.y + bb.h);
    g.addColorStop(0, m.hl); g.addColorStop(0.38, m.base); g.addColorStop(1, m.shade);
    path(c, d); c.fillStyle = g; c.fill();
    c.save(); path(c, d); c.clip();
    if (!o.flat) {
      var g2 = c.createLinearGradient(0, bb.y + bb.h * 0.55, 0, bb.y + bb.h);
      g2.addColorStop(0, 'hsla(' + P.shadowHue.toFixed(0) + ',45%,10%,0)'); g2.addColorStop(1, 'hsla(' + P.shadowHue.toFixed(0) + ',45%,10%,' + (0.18 + 0.3 * P.shade) + ')');
      c.fillStyle = g2; c.fillRect(bb.x, bb.y, bb.w, bb.h);
    }
    var n = Math.min(140, Math.round(bb.w * bb.h / 70 * P.texture));
    if (n > 2) { paintStrokes(c, bb, seed, m.hl, 0.22, Math.round(n * 0.5), o.grain == null ? -0.6 : o.grain); paintStrokes(c, bb, seed + 7, m.shade, 0.22, Math.round(n * 0.5), o.grain == null ? -0.6 : o.grain); }
    if (!o.flat) { c.translate(-0.9, -0.9); path(c, d); c.lineWidth = 1.5; c.strokeStyle = m.hl; c.globalAlpha = 0.55; c.stroke(); }
    c.restore();
    path(c, d); c.lineWidth = 0.9 + ow(o.size) * 0.5; c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',45%,9%,' + (0.35 + 0.45 * P.outlineDark) + ')'; c.lineJoin = 'round'; c.stroke();
    return d;
  }
  c.save(); path(c, d); c.fillStyle = m.base; c.fill();
  if (!o.flat) {
    var sx = (o.sh || 3) * (0.5 + P.shade);
    if (look === 2) c.globalAlpha = 0.62;
    crescent(c, d, -sx, -sx * 0.9, m.shade, bb);
    var hx = (o.hl || 2) * (0.6 + P.shade * 0.6); crescent(c, d, hx, hx * 0.9, m.hl, bb);
    c.globalAlpha = 1;
  }
  if (look === 2) { var n2 = Math.min(90, Math.round(bb.w * bb.h / 90 * P.texture)); c.save(); path(c, d); c.clip(); paintStrokes(c, bb, seed, m.shade, 0.14, n2, -0.7); c.restore(); }
  c.restore();
  path(c, d); c.lineWidth = ow(o.size); c.strokeStyle = look === 2 ? 'hsla(' + P.shadowHue.toFixed(0) + ',40%,12%,0.9)' : OLC; c.lineJoin = 'round'; c.stroke();
  return d;
}

function stripesIn(c, d, ang, wd, colA, alpha) {
  var bb = bbox(d), cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2, R = Math.hypot(bb.w, bb.h);
  c.save(); path(c, d); c.clip(); c.translate(cx, cy); c.rotate(ang); c.fillStyle = colA; c.globalAlpha = alpha;
  for (var x = -R; x < R; x += wd * 2) c.fillRect(x, -R, wd, R * 2);
  c.restore();
}
function line(c, pts, w, col, outline) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  if (outline && P.look !== 1) { c.strokeStyle = OLC; c.lineWidth = w + ow('S') * 1.6; c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke(); }
  c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke();
  c.restore();
}
function gshadow(c, x, y, rx, ry, a) {
  if (P.noShadow) return;
  var al = a == null ? 0.38 : a;
  c.save();
  if (P.look === 0) { c.fillStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,8%,' + al + ')'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
  else {
    c.translate(x, y); c.scale(1, ry / rx); var g = c.createRadialGradient(0, 0, 0, 0, 0, rx * 1.2);
    g.addColorStop(0, 'hsla(' + P.shadowHue.toFixed(0) + ',40%,6%,' + (al * 1.5) + ')'); g.addColorStop(0.6, 'hsla(' + P.shadowHue.toFixed(0) + ',40%,6%,' + (al * 0.8) + ')'); g.addColorStop(1, 'hsla(' + P.shadowHue.toFixed(0) + ',40%,6%,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx * 1.2, 0, 7); c.fill();
  }
  c.restore();
}

function longShadow(c, x, y, w, len) {
  if (P.noShadow) return;
  c.save(); c.fillStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,8%,0.3)';
  c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x + w / 2 + len, y + len * 0.28); c.lineTo(x - w / 2 + len * 0.9, y + len * 0.28 + 3); c.closePath(); c.fill(); c.restore();
}
function glowSpot(c, x, y, r, col, a) {
  var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('__A__', a)); g.addColorStop(1, col.replace('__A__', 0));
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.restore();
}
function addLight(x, y, r, h, s, l, a) { lights.push({ x: x, y: y, r: r, h: h, s: s, l: l, a: a == null ? 1 : a }); }

/* ---------------- materials from the parameters ---------------- */
function mats() {
  var f = P.factoryHue, o = P.outsideHue, a = P.accentHue, K = {};
  K.floorA = M(f, 16, 24); K.floorB = M(f + 6, 15, 29); K.wall = M(f + 8, 20, 33); K.wallDark = M(f + 4, 22, 22);
  K.iron = M(f + 14, 14, 42); K.ironLight = M(f + 14, 13, 52); K.brass = M(mixHue(38, a, 0.2), 48, 48); K.rust = M(14, 52, 34);
  K.pipe = M(f - 28, 24, 38); K.crate = M(mixHue(30, f, 0.15), 28, 34); K.glass = M(a, 70, 62);
  K.grassA = M(o, 40, 36); K.grassB = M(o + 14, 42, 41); K.leaf = M(o - 6, 50, 44); K.leafD = M(o + 6, 44, 32);
  K.trunk = M(mixHue(285, o, 0.1), 20, 36); K.trunkL = M(mixHue(285, o, 0.1), 18, 44);
  K.rock = M(mixHue(o, 270, 0.6), 10, 42); K.moss = M(o - 10, 52, 36); K.path = M(mixHue(35, o, 0.15), 18, 44);
  K.water = M(mixHue(o, 200, 0.5), 38, 30); K.waterL = M(mixHue(o, 200, 0.5), 38, 40);
  K.flowerA = M(a, 75, 56); K.flowerB = M(mixHue(a, 300, 0.5), 60, 58); K.flowerC = M(mixHue(a, 60, 0.4), 70, 66);
  K.cap = M(a, 72, 50); K.spot = M(mixHue(a, 60, 0.3), 25, 86); K.stem = M(60, 14, 78);
  K.gdark = M(o + 6, 40, 26); K.snowA = M(215, 22, 92); K.snowB = M(214, 28, 80); K.iceM = M(196, 52, 70); K.rockC = M(238, 10, 40); K.rockD = M(246, 12, 28); K.ashM = M(18, 8, 32); K.charM = M(14, 12, 20); K.basM = M(250, 10, 24); K.lavaM = M(14, 90, 46); K.deadW = M(16, 16, 18); K.bellM = M(44, 70, 56); K.keyM = M(48, 92, 60); K.snowPineD = M(o + 8, 30, 30); K.snowPineL = M(o + 4, 26, 40); K.charLeaf = M(8, 55, 28); K.birch = M(60, 6, 84); K.birchLeaf = M(o - 26, 52, 54); K.blossom = M(mixHue(a, 330, 0.45), 40, 70); K.pine = M(o + 14, 46, 30); K.pineL = M(o + 8, 48, 36); K.willow = M(o - 14, 42, 40);
  K.cap2 = M(mixHue(a, 340, 0.35), 62, 46); K.gill = M(mixHue(a, 330, 0.3), 30, 58);
  K.liquid = M(mixHue(o, a, 0.35), 75, 52); K.fire = M(24, 95, 56); K.wood = M(mixHue(28, o, 0.1), 34, 36);
  K.coat = M(mixHue(o, 190, 0.3), 36, 34); K.skin = M(30, 60, 80); K.hair = M(20, 55, 40);
  return K;
}

/* ---------------- Factory set ---------------- */
function pillar(c, K, x, y, h, seed, wid) {
  var R = rng(seed), w = (wid || 26) * lerp(1.15, 0.55, P.spindly), lean = (R() - 0.5) * P.twist * 8;
  longShadow(c, x, y, w * 0.9, 70);
  gshadow(c, x, y, w * 0.9, 5);
  var body = [[x - w / 2, y], [x - w * 0.42 + lean, y - h], [x + w * 0.42 + lean, y - h], [x + w / 2, y]];
  var d = shape(c, body, K.iron, { seed: seed, size: 'L', sh: 5 });
  if (P.stripes > 0.35) stripesIn(c, d, 0.9, 5, OLC, 0.1 + P.stripes * 0.1);
  var rings = [0.12, 0.38, 0.62];
  rings.forEach(function (t, i) {
    var yy = y - h * t, xx = x + lean * t, ww = w * lerp(1.05, 0.9, t) + 6;
    var rg = shape(c, rrPts(xx - ww / 2, yy - 6, ww, 10, 3), K.brass, { seed: seed + i, size: 'M', sh: 2 });
    if (P.stripes > 0.25) stripesIn(c, rg, -0.6, 3, OLC, 0.12 + P.stripes * 0.25);
    for (var k = 0; k < 3; k++) { c.beginPath(); c.arc(xx - ww / 2 + 7 + k * (ww - 14) / 2, yy - 1, 1.3, 0, 7); c.fillStyle = OLC; c.fill(); }
  });
  shape(c, rrPts(x - w * 0.7, y - 8, w * 1.4, 10, 3), K.ironLight, { seed: seed + 9, size: 'M' });
}
function crate(c, K, x, y, s, seed, rot) {
  var r = rot || 0, w = s, h = s * 0.88, dp = s * 0.3, rd = 2 + 3 * P.round;
  gshadow(c, x + 3, y + 1, w * 0.75, 4.5);
  c.save(); c.translate(x, y); c.rotate(r);
  shape(c, [[w / 2, -h], [w / 2 + dp, -h - dp * 0.7], [w / 2 + dp, -dp * 0.7], [w / 2, 0]], K.wallDark, { seed: seed + 4, size: 'M', flat: true, rough: 0.3 });
  shape(c, [[-w / 2, -h], [-w / 2 + dp, -h - dp * 0.7], [w / 2 + dp, -h - dp * 0.7], [w / 2, -h]], K.crate, { seed: seed + 2, size: 'M', sh: 1.5, rough: 0.3 });
  var front = shape(c, rrPts(-w / 2, -h, w, h, rd), K.crate, { seed: seed, size: 'M', rough: 0.3 });
  line(c, [[-w / 2 + 3, -h + 3], [w / 2 - 3, -3]], 2.4, K.crate.shade, false);
  line(c, [[-w / 2 + 3, -3], [w / 2 - 3, -h + 3]], 2.4, K.crate.shade, false);
  shape(c, rrPts(-w / 2 - 1, -h * 0.55, w + 2, 5, 2), K.brass, { seed: seed + 6, size: 'S', sh: 1, rough: 0.2 });
  c.restore();
}

function barrel(c, K, x, y, s, seed) {
  var w = s * 0.62, h = s;
  gshadow(c, x + 2, y + 1, w * 0.7, 4);
  var body = [[x - w / 2, y - h * 0.9], [x - w * 0.58, y - h * 0.5], [x - w / 2, y], [x + w / 2, y], [x + w * 0.58, y - h * 0.5], [x + w / 2, y - h * 0.9]];
  var d = shape(c, body, K.rust, { seed: seed, size: 'M' });
  shape(c, ellPts(x, y - h * 0.9, w / 2, w * 0.2, 12), K.iron, { seed: seed + 1, size: 'S', sh: 1.2 });
  [0.3, 0.65].forEach(function (t, i) { var b = shape(c, rrPts(x - w * 0.6, y - h * t - 2, w * 1.2, 5, 2), K.iron, { seed: seed + 3 + i, size: 'S', flat: true }); if (P.stripes > 0.5) stripesIn(c, b, 0.7, 2, OLC, 0.3); });
}
function gear(c, K, x, y, r, seed, teeth, mat) {
  var R = rng(seed), pts = [], n = teeth || 10, i;
  for (i = 0; i < n; i++) {
    var a = i / n * Math.PI * 2, da = Math.PI / n * 0.45;
    pts.push([x + Math.cos(a - da) * r, y + Math.sin(a - da) * r]);
    pts.push([x + Math.cos(a - da * 0.7) * r * 1.22, y + Math.sin(a - da * 0.7) * r * 1.22]);
    pts.push([x + Math.cos(a + da * 0.7) * r * 1.22, y + Math.sin(a + da * 0.7) * r * 1.22]);
    pts.push([x + Math.cos(a + da) * r, y + Math.sin(a + da) * r]);
  }
  shape(c, pts, mat || K.brass, { seed: seed, size: 'M', sh: r * 0.12 });
  shape(c, ellPts(x, y, r * 0.55, r * 0.55, 16), K.wallDark, { seed: seed + 1, size: 'S', flat: true });
  shape(c, ellPts(x, y, r * 0.22, r * 0.22, 10), mat || K.brass, { seed: seed + 2, size: 'S', flat: true });
}
function boiler(c, K, x, y, seed) {
  var R = rng(seed);
  longShadow(c, x, y, 60, 40);
  gshadow(c, x, y, 46, 6);
  var body = rrPts(x - 44, y - 56, 88, 52, 22);
  var d = shape(c, body, K.pipe, { seed: seed, size: 'L', sh: 5 });
  if (P.stripes > 0.3) stripesIn(c, d, 1.2, 6, OLC, 0.06 + P.stripes * 0.08);
  [-24, 0, 24].forEach(function (dx, i) { var b = shape(c, rrPts(x + dx - 3, y - 56, 7, 52, 3), K.brass, { seed: seed + i, size: 'S', sh: 1.5 }); });
  var ch = ribbon(curvePts([x + 26, y - 54], [x + 30 + P.twist * 10, y - 85], [x + 20 + P.twist * 14, y - 118], 8), 12, 8);
  shape(c, ch, K.iron, { seed: seed + 5, size: 'M' });
  shape(c, ellPts(x - 10, y - 30, 11, 11, 14), K.ironLight, { seed: seed + 6, size: 'M', sh: 2 });
  shape(c, ellPts(x - 10, y - 30, 8, 8, 14), K.floorA, { seed: seed + 7, size: 'S', flat: true });
  line(c, [[x - 10, y - 30], [x - 4, y - 36]], 1.6, C(P.accentHue, 80, 60), false);
  for (var i = 0; i < 4; i++) { c.save(); c.globalAlpha = 0.22 - i * 0.04; c.fillStyle = C(P.factoryHue, 10, 80); c.beginPath(); c.arc(x + 22 + i * 7 + P.twist * 10, y - 122 - i * 15, 8 + i * 5, 0, 7); c.fill(); c.restore(); }
}
function lampPost(c, K, x, y, h, seed, hue, dead) {
  var R = rng(seed), tw = P.twist;
  gshadow(c, x, y, 9, 3.5);
  var pts = [], n = 10, i, ph = R() * 6;
  for (i = 0; i <= n; i++) { var t = i / n; pts.push([x + Math.sin(t * 3 + ph) * tw * 6 * t, y - h * t]); }
  var top = pts[n];
  shape(c, rrPts(x - 8, y - 6, 16, 8, 3), K.iron, { seed: seed + 8, size: 'S', sh: 1.5, rough: 0.2 });
  shape(c, ribbon(pts, lerp(9, 5, P.spindly) + 1, 4.5), K.iron, { seed: seed, size: 'S', sh: 1.8, rough: 0.2 });
  var arm = curvePts([top[0], top[1]], [top[0] + 4, top[1] - 14], [top[0] + 16, top[1] - 12], 8);
  line(c, arm, 3.2, K.iron.base, true);
  var lx = top[0] + 16, ly = top[1] - 8, hh = hue == null ? P.accentHue : hue;
  var gl = dead ? M(P.factoryHue, 10, 22) : M(hh, 88, 68);
  shape(c, rrPts(lx - 7, ly - 11, 14, 4, 2), K.brass, { seed: seed + 2, size: 'S', sh: 1, rough: 0.2 });
  shape(c, ellPts(lx, ly + 1, 7.5, 9.5, 16), gl, { seed: seed + 3, size: 'S', sh: 1.8, hl: 1.6, rough: 0.2 });
  if (!dead) { c.fillStyle = 'hsla(' + hh.toFixed(0) + ',100%,90%,0.95)'; c.beginPath(); c.ellipse(lx - 1.5, ly - 1, 2.6, 3.6, 0, 0, 7); c.fill(); }
  shape(c, rrPts(lx - 6, ly + 8, 12, 4, 2), K.brass, { seed: seed + 4, size: 'S', sh: 1, rough: 0.2 });
  if (!dead) addLight(lx, ly + 2, 80 + 50 * P.glow, hh, 92, 62, 1);
  return [lx, ly + 2];
}

function leverMachine(c, K, x, y, seed) {
  gshadow(c, x, y, 28, 5);
  shape(c, rrPts(x - 26, y - 38, 52, 38, 5), K.wall, { seed: seed, size: 'M', sh: 3 });
  shape(c, rrPts(x - 20, y - 32, 22, 15, 3), K.wallDark, { seed: seed + 1, size: 'S', flat: true });
  c.fillStyle = C(P.accentHue, 90, 62, 0.55); c.fillRect(x - 18, y - 30, 18, 11);
  line(c, [[x + 14, y - 38], [x + 20 + P.twist * 6, y - 56]], 3, C(P.factoryHue, 10, 30), true);
  c.beginPath(); c.arc(x + 20 + P.twist * 6, y - 57, 4, 0, 7); c.fillStyle = C(P.accentHue, 80, 55); c.fill(); c.lineWidth = ow('S'); c.strokeStyle = OLC; c.stroke();
  gear(c, K, x + 12, y - 15, 6, seed + 3, 8, K.brass);
}
function scrap(c, K, x, y, seed) {
  var R = rng(seed);
  gshadow(c, x, y, 34, 6);
  for (var i = 0; i < 7; i++) {
    var px = x + (R() - 0.5) * 50, py = y - R() * 18, s = 6 + R() * 12, a = R() * 6;
    var pts = [], k, nn = 5; for (k = 0; k < nn; k++) { var aa = a + k / nn * 6.28, rr = s * (0.6 + R() * 0.6); pts.push([px + Math.cos(aa) * rr, py + Math.sin(aa) * rr * 0.7]); }
    shape(c, pts, [K.iron, K.rust, K.brass, K.pipe][i % 4], { seed: seed + i, size: 'S', sh: 1.5 });
  }
  gear(c, K, x + 12, y - 10, 8, seed + 9, 9, K.rust);
}
function steamPuffs(c, x, y, seed, n) {
  var R = rng(seed);
  for (var i = 0; i < n; i++) { c.save(); c.globalAlpha = 0.16 + R() * 0.1; c.fillStyle = C(P.factoryHue, 8, 82); c.beginPath(); c.ellipse(x + (R() - 0.5) * 24 + i * 3, y - i * 10, 8 + R() * 8, 6 + R() * 6, 0, 0, 7); c.fill(); c.restore(); }
}
function floorTiles(c, K, y0) {
  var R = rng(P.seed * 3 + 1), x, y, row = 0, rd = 3 + 4 * P.round;
  if (P.look === 1) {
    c.fillStyle = K.floorA.shade; c.fillRect(0, y0 - 2, W, H);
    for (y = y0; y < H + 30; y += 26, row++) {
      for (x = -((row % 2) * 24); x < W + 50; x += 48) {
        var m = ((x / 48 + row) & 1) ? K.floorA : K.floorB;
        var d = dens(rrPts(x + 1, y + 1, 46, 24, rd), 5), bb = bbox(d);
        var g = c.createLinearGradient(x, y, x + 44, y + 26); g.addColorStop(0, m.hl); g.addColorStop(0.4, m.base); g.addColorStop(1, m.shade);
        path(c, d); c.fillStyle = g; c.fill();
        c.save(); path(c, d); c.clip(); paintStrokes(c, bb, row * 37 + (x | 0), m.shade, 0.2, Math.round(26 * P.texture), 0.2); paintStrokes(c, bb, row * 41 + (x | 0), m.hl, 0.16, Math.round(16 * P.texture), 0.2);
        if (R() < 0.3) { c.fillStyle = K.rust.base; c.globalAlpha = 0.18; c.beginPath(); c.ellipse(x + R() * 40, y + R() * 20, 8 + R() * 8, 4 + R() * 4, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
        c.restore();
        path(c, d); c.lineWidth = 1.3; c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',45%,9%,0.55)'; c.stroke();
      }
    }
    return;
  }
  c.fillStyle = K.floorA.shade; c.fillRect(0, y0 - 2, W, H);
  for (y = y0; y < H + 30; y += 26, row++) {
    for (x = -((row % 2) * 24); x < W + 50; x += 48) {
      var m = ((x / 48 + row) & 1) ? K.floorA : K.floorB;
      var d = dens(rrPts(x + 1.5, y + 1.5, 45, 23, rd), 5), bb = bbox(d);
      path(c, d); c.fillStyle = m.base; c.fill();
      crescent(c, d, -2.2, -2.2, m.shade, bb); crescent(c, d, 1.8, 1.8, m.hl, bb);
      path(c, d); c.lineWidth = ow('S') * 0.8; c.strokeStyle = OLC; c.globalAlpha = 0.55; c.stroke(); c.globalAlpha = 1;
      if (R() < 0.35) { c.fillStyle = m.hl; c.globalAlpha = 0.7; c.beginPath(); c.arc(x + 7, y + 7, 1.5, 0, 7); c.arc(x + 41, y + 7, 1.5, 0, 7); c.fill(); c.globalAlpha = 1; }
      if (P.stripes > 0.05 && R() < 0.2) stripesIn(c, d, 0.8, 4, OLC, 0.14);
    }
  }
}

function factoryWall(c, K, seed) {
  var R = rng(seed), wallH = 128;
  c.fillStyle = K.wall.base; c.fillRect(0, 0, W, wallH);
  c.fillStyle = K.wallDark.base; c.globalAlpha = 0.55; c.fillRect(0, 0, W, 42); c.globalAlpha = 1;
  var x, i;
  for (x = 0; x < W; x += 80) { c.fillStyle = OLC; c.globalAlpha = 0.5; c.fillRect(x, 0, 2, wallH); c.globalAlpha = 1; c.fillStyle = K.wall.hl; c.globalAlpha = 0.4; c.fillRect(x + 2, 0, 2, wallH); c.globalAlpha = 1; }
  for (x = 20; x < W; x += 80) {
    var arch = [[x, wallH - 6], [x, 46], [x + 3, 36], [x + 12, 28], [x + 24, 24], [x + 36, 28], [x + 45, 36], [x + 48, 46], [x + 48, wallH - 6]];
    var d = shape(c, arch, K.wallDark, { seed: seed + x, size: 'L', flat: true, rough: 0.8 });
    c.save(); path(c, d); c.clip();
    var g = c.createLinearGradient(0, 24, 0, wallH); g.addColorStop(0, C(P.factoryHue, 30, 22, 1)); g.addColorStop(1, C(P.accentHue, 55, 30, 0.9)); c.fillStyle = g; c.fillRect(x, 24, 48, wallH);
    c.fillStyle = OLC; c.globalAlpha = 0.85; c.fillRect(x + 23, 24, 2, wallH); c.fillRect(x, 66, 48, 2); c.globalAlpha = 1;
    c.restore();
    path(c, d); c.lineWidth = ow('L'); c.strokeStyle = OLC; c.stroke();
  }
  var pipeY = [14, 30];
  pipeY.forEach(function (py, k) {
    var pts = [[-10, py], [90, py], [96 + P.twist * 6, py + 8 * P.twist], [130, py + 8 * P.twist], [W * 0.6, py], [W * 0.6 + 40, py - 6 * P.twist], [W + 10, py - 6 * P.twist]];
    var rb = ribbon(dens2(pts, 10), 11, 11);
    var dd = shape(c, rb, K.pipe, { seed: seed + k * 7, size: 'M', sh: 3 });
    if (P.stripes > 0.3) stripesIn(c, dd, 1.57, 6, OLC, 0.06 + P.stripes * 0.1);
    for (var fx = 40 + k * 30; fx < W; fx += 110) shape(c, rrPts(fx, py - 9, 7, 18, 2), K.brass, { seed: seed + fx, size: 'S', sh: 1.2 });
  });
  gear(c, K, 370, 50, 32, seed + 5, 12, K.brass);
  gear(c, K, 412, 76, 20, seed + 6, 10, K.rust);
  for (i = 0; i < 5; i++) { var cx = 40 + i * 62 + R() * 12, ln = 18 + R() * 34, pts2 = []; for (var k2 = 0; k2 <= ln; k2 += 6) pts2.push([cx + Math.sin(k2 * 0.3 + i) * P.twist * 2, 42 + k2]); line(c, pts2, 1.6, C(P.factoryHue, 10, 25), false); for (k2 = 0; k2 <= ln; k2 += 6) { c.beginPath(); c.ellipse(cx + Math.sin(k2 * 0.3 + i) * P.twist * 2, 42 + k2, 2.6, 3.4, 0, 0, 7); c.strokeStyle = OLC; c.lineWidth = 1.3; c.stroke(); } }
  c.fillStyle = OLC; c.globalAlpha = 0.5; c.fillRect(0, wallH - 4, W, 5); c.globalAlpha = 1;
}
function dens2(pts, step) { var out = []; for (var i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(d / step)); for (var j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]); } out.push(pts[pts.length - 1]); return out; }
function gateDoor(c, K, x, y, w, h, seed) {
  var half = w / 2;
  var open = [[x - half, y], [x - half, y - h * 0.62], [x - half + 5, y - h * 0.8], [x - half * 0.55, y - h * 0.95], [x, y - h], [x + half * 0.55, y - h * 0.95], [x + half - 5, y - h * 0.8], [x + half, y - h * 0.62], [x + half, y]];
  var d = shape(c, open, K.wallDark, { seed: seed, size: 'XL', flat: true, rough: 0.7 });
  c.save(); path(c, d); c.clip();
  var g = c.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, C(P.outsideHue, 55, 70)); g.addColorStop(1, C(P.outsideHue - 10, 60, 46));
  c.fillStyle = g; c.fillRect(x - half, y - h, w, h);
  for (var i = 0; i < 5; i++) { c.fillStyle = C(P.outsideHue + 20, 60, 30); c.beginPath(); c.arc(x - 12 + i * 6, y - h * 0.4 - (i % 2) * 14, 11, 0, 7); c.fill(); }
  c.restore();
  var leafL = shape(c, [[x - half, y], [x - half, y - h * 0.62], [x - half + 5, y - h * 0.8], [x - half * 0.55, y - h * 0.95], [x - half * 0.3, y - h * 0.9], [x - half * 0.1, y - h * 0.5], [x - half * 0.1, y]], K.iron, { seed: seed + 1, size: 'L', sh: 4 });
  var leafR = shape(c, [[x + half, y], [x + half, y - h * 0.62], [x + half - 5, y - h * 0.8], [x + half * 0.55, y - h * 0.95], [x + half * 0.3, y - h * 0.9], [x + half * 0.1, y - h * 0.5], [x + half * 0.1, y]], K.iron, { seed: seed + 2, size: 'L', sh: 4 });
  if (P.stripes > 0.3) { stripesIn(c, leafL, 0.9, 4, OLC, 0.1 + P.stripes * 0.12); stripesIn(c, leafR, -0.9, 4, OLC, 0.1 + P.stripes * 0.12); }
  gear(c, K, x - half * 0.55, y - h * 0.5, w * 0.16, seed + 3, 10, K.brass);
  gear(c, K, x + half * 0.55, y - h * 0.5, w * 0.16, seed + 4, 10, K.brass);
  addLight(x, y - h * 0.45, 120 + 60 * P.glow, P.outsideHue, 70, 60, 0.9);
}
function heroRef(c, K, x, y) {
  if (typeof GameArt !== 'undefined' && GameArt.lib && GameArt.lib.playerD) {
    gshadow(c, x, y, 10, 3.4);
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    GameArt.lib.playerD(c, x, y, 'down', { phase: 0, amt: 0, t: 0.6, lx: 0, ly: 0, blink: 0, sq: 0 }, { lx: 0, ly: 0, sheath: true });
    c.restore();
    return;
  }
  gshadow(c, x, y, 9, 3);
  line(c, [[x - 3, y - 8], [x - 3, y]], 4, C(260, 25, 28), true); line(c, [[x + 3, y - 8], [x + 3, y]], 4, C(260, 25, 28), true);
  shape(c, rrPts(x - 7.5, y - 20, 15, 13, 4), K.coat, { seed: 3, size: 'S', sh: 1.5 });
  shape(c, ellPts(x, y - 27, 9, 8.2, 14), K.skin, { seed: 4, size: 'S', sh: 1.4 });
  shape(c, [[x - 9.5, y - 28], [x - 8, y - 33], [x - 2, y - 36], [x + 5, y - 35], [x + 9.5, y - 29], [x + 6, y - 29], [x + 2, y - 31], [x - 4, y - 30], [x - 8, y - 27]], K.hair, { seed: 5, size: 'S', flat: true });
  c.beginPath(); c.arc(x - 3.5, y - 26, 1.3, 0, 7); c.arc(x + 3.5, y - 26, 1.3, 0, 7); c.fillStyle = OLC; c.fill();
  c.beginPath(); c.arc(x - 4.5, y - 34.5, 3, 0, 7); c.arc(x + 4.5, y - 34.5, 3, 0, 7); c.fillStyle = C(P.accentHue, 80, 62); c.fill(); c.lineWidth = 1.3; c.strokeStyle = OLC; c.stroke();
}

function drawFactory(c, withHero, skipDoor, heroPos) {
  var K = mats(), S = P.seed, R = rng(S * 11 + 5);
  lights.length = 0;
  floorTiles(c, K, 126);
  factoryWall(c, K, S);
  wallGauge(c, K, 120, 88, 11, S + 61); wallGauge(c, K, 236, 82, 9, S + 62); wallGauge(c, K, 430, 100, 10, S + 63);
  if (!skipDoor) {
    gateDoor(c, K, 300, 128, 62, 108, S + 40);
    c.save(); c.globalCompositeOperation = 'lighter'; var gg = c.createRadialGradient(300, 150, 4, 300, 160, 130); gg.addColorStop(0, C(P.outsideHue, 55, 52, 0.38 * P.glow)); gg.addColorStop(1, C(P.outsideHue, 55, 52, 0)); c.fillStyle = gg; c.fillRect(150, 126, 300, 174); c.restore();
  }
  var objs = [];
  objs.push({ y: 150, f: function () { pillar(c, K, 48 + (R() - 0.5) * 6, 150, 420, S + 1, 30); } });
  objs.push({ y: 162, f: function () { pillar(c, K, 440 + (R() - 0.5) * 6, 162, 420, S + 2, 30); } });
  objs.push({ y: 134, f: function () { pillar(c, K, 190, 134, 300, S + 3, 18); } });
  objs.push({ y: 140, f: function () { shelfUnit(c, K, 232, 140, 56, 78, S + 20); } });
  objs.push({ y: 142, f: function () { furnace(c, K, 384, 144, S + 21); } });
  objs.push({ y: 146, f: function () { valvePipe(c, K, 70, 146, 96, S + 22); } });
  objs.push({ y: 204, f: function () { vat(c, K, 124, 204, S + 23); } });
  objs.push({ y: 238, f: function () { workbench(c, K, 210, 238, 66, S + 24); } });
  objs.push({ y: 214, f: function () { conveyor(c, K, 382, 214, 98, S + 25); } });
  objs.push({ y: 250, f: function () { consolePanel(c, K, 318, 250, S + 26); } });
  objs.push({ y: 266, f: function () { cableCoil(c, K, 150, 270, S + 27); } });
  objs.push({ y: 268, f: function () { lampPost(c, K, 70, 268, 92, S + 11); } });
  objs.push({ y: 280, f: function () { lampPost(c, K, 408, 280, 100, S + 12); } });
  objs.push({ y: 286, f: function () { scrap(c, K, 100, 286, S + 13); barrel(c, K, 436, 252, 26, S + 8); barrel(c, K, 452, 262, 24, S + 9); } });
  if (withHero !== false && P.scaleRef) { var hp = heroPos || [270, 276]; objs.push({ y: hp[1], f: function () { heroRef(c, K, hp[0], hp[1]); } }); }
  objs.sort(function (a, b) { return a.y - b.y; });
  hangingLamp(c, K, 150, 0, 52, S + 31); hangingLamp(c, K, 340, 0, 36, S + 32);
  objs.forEach(function (o) { o.f(); });
  steamPuffs(c, 144 + P.twist * 10, 74, S + 20, 5);
}

function groundGrass(c, K) {
  var R = rng(P.seed * 5 + 2), i;
  if (P.look === 1) {
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, K.grassA.shade); g.addColorStop(0.45, K.grassA.base); g.addColorStop(1, K.grassB.base);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (i = 0; i < 22; i++) { var px = R() * W, py = R() * H, pr = 40 + R() * 70, gg = c.createRadialGradient(px, py, 0, px, py, pr); var lit = R() < 0.5; gg.addColorStop(0, (lit ? K.grassB.hl : K.grassA.shade).replace('hsl(', 'hsla(').replace(')', ',0.35)')); gg.addColorStop(1, 'hsla(0,0%,0%,0)'); c.fillStyle = gg; c.fillRect(px - pr, py - pr, pr * 2, pr * 2); }
    var cols = [K.leaf.base, K.leafD.base, K.grassB.hl, K.grassA.hl];
    for (i = 0; i < Math.round(900 * (0.4 + P.texture)); i++) {
      var x = R() * W, y = 20 + R() * (H - 20), h = 4 + R() * 7 * (0.5 + y / H), a2 = -1.57 + (R() - 0.5) * (0.8 + P.twist);
      c.strokeStyle = cols[i % 4]; c.globalAlpha = 0.45; c.lineWidth = 1 + R() * 0.8; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a2) * h * 0.5 + 1, y + Math.sin(a2) * h * 0.5, x + Math.cos(a2 + 0.3) * h, y + Math.sin(a2 + 0.3) * h); c.stroke();
    }
    c.globalAlpha = 1; return;
  }
  c.fillStyle = K.grassA.base; c.fillRect(0, 0, W, H);
  for (i = 0; i < 26; i++) { c.fillStyle = (i % 2 ? K.grassB : K.grassA).hl; c.globalAlpha = 0.18; c.beginPath(); c.ellipse(R() * W, R() * H, 30 + R() * 50, 12 + R() * 24, 0, 0, 7); c.fill(); }
  for (i = 0; i < 18; i++) { c.fillStyle = K.grassA.shade; c.globalAlpha = 0.3; c.beginPath(); c.ellipse(R() * W, R() * H, 26 + R() * 44, 10 + R() * 18, 0, 0, 7); c.fill(); }
  c.globalAlpha = 1;
  for (i = 0; i < 140; i++) {
    var x = R() * W, y = 30 + R() * (H - 30), h = 5 + R() * 6;
    line(c, curvePts([x, y], [x + (R() - 0.5) * 6 * P.twist - 2, y - h], [x + (R() - 0.5) * 12 * (0.4 + P.twist), y - h - 2], 4), 1.5, K.leafD.base, false);
  }
}
function leafBlobs(c, K, cx, cy, r, seed, count, tint, noBase) {
  var R = rng(seed), blobs = [], i, mat = tint || K.leaf;
  if (P.look === 1) {
    var g0 = c.createRadialGradient(cx, cy + r * 0.25, r * 0.1, cx, cy + r * 0.2, r * 1.2); g0.addColorStop(0, mat.shade); g0.addColorStop(1, 'hsla(0,0%,0%,0)');
    if (!noBase) { c.save(); c.fillStyle = mat.shade; c.beginPath(); c.ellipse(cx, cy + r * 0.1, r * 1.05, r * 0.8, 0, 0, 7); c.fill(); c.restore(); }
    var tot = count * 7, list = [];
    for (i = 0; i < tot; i++) { var a = R() * 6.28, d = Math.sqrt(R()) * r * 0.9; list.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.72, r: r * (0.16 + R() * 0.2) }); }
    list.sort(function (p, q) { return p.y - q.y; });
    list.forEach(function (b) {
      var lit = clamp(0.5 - (b.y - cy) / (r * 1.3) - (b.x - cx) / (r * 3), 0, 1);
      var g = c.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.05, b.x, b.y, b.r);
      g.addColorStop(0, lit > 0.45 ? mat.hl : mat.base); g.addColorStop(0.55, lit > 0.3 ? mat.base : mat.shade); g.addColorStop(1, mat.shade);
      c.fillStyle = g; c.beginPath(); c.ellipse(b.x, b.y, b.r, b.r * 0.82, 0, 0, 7); c.fill();
    });
    for (i = 0; i < tot * 1.5; i++) { var b2 = list[Math.floor(R() * list.length)]; var lx = b2.x - b2.r * 0.35 + (R() - 0.5) * b2.r, ly = b2.y - b2.r * 0.35 + (R() - 0.5) * b2.r * 0.6; c.fillStyle = mat.hl; c.globalAlpha = 0.35 + 0.35 * R(); c.beginPath(); c.ellipse(lx, ly, 1.4 + R() * 2.2, 1 + R() * 1.4, R() * 3, 0, 7); c.fill(); c.globalAlpha = 1; }
    return;
  }
  for (i = 0; i < count; i++) {
    var a2 = (i / count) * 6.28 + R() * 0.8, d2 = (i === 0 ? 0 : r * (0.45 + R() * 0.3)), rr = r * (i === 0 ? 0.62 : 0.4 + R() * 0.25), bx = cx + Math.cos(a2) * d2, by = cy + Math.sin(a2) * d2 * 0.68, s = seed * 7 + i;
    blobs.push({ x: bx, y: by, r: rr, d: wob(dens(blobPts(bx, by, rr, rr * 0.82, s, 36, 0.1 + 0.1 * (1 - P.round)), 5), P.rough * 0.6, s) });
  }
  blobs.forEach(function (b) { path(c, b.d); c.lineWidth = ow('L') * 2; c.strokeStyle = OLC; c.lineJoin = 'round'; c.stroke(); });
  blobs.forEach(function (b) { path(c, b.d); c.fillStyle = mat.base; c.fill(); });
  blobs.forEach(function (b) { var bb = bbox(b.d); crescent(c, b.d, -b.r * 0.12 * (0.5 + P.shade), -b.r * 0.12 * (0.5 + P.shade), mat.shade, bb); crescent(c, b.d, b.r * 0.16, b.r * 0.16, mat.hl, bb); });
  blobs.forEach(function (b, k) { if (k === 0) return; path(c, b.d); c.lineWidth = ow('S') * 0.7; c.strokeStyle = OLC; c.globalAlpha = 0.5; c.stroke(); c.globalAlpha = 1; });
  for (i = 0; i < count * 3; i++) { var b3 = blobs[i % blobs.length], lx2 = b3.x + (R() - 0.7) * b3.r * 1.1, ly2 = b3.y + (R() - 0.6) * b3.r * 0.7; line(c, curvePts([lx2, ly2], [lx2 + 2.5, ly2 - 3], [lx2 + 5.5, ly2 - 1.5], 4), 1.3, mat.hl, false); }
}

function tree(c, K, x, y, h, seed, wid, mat) {
  var R = rng(seed), tw = P.twist, sp = P.spindly, i;
  var baseW = (wid || 28) * lerp(1.3, 0.6, sp), lean = (R() - 0.5) * tw * 40, ph = R() * 6;
  longShadow(c, x, y, baseW * 1.8, h * 0.5);
  gshadow(c, x, y + 1, baseW * 1.5, 6.5, 0.4);
  var n = 12, cl = [];
  for (i = 0; i <= n; i++) { var t = i / n; cl.push([x + lean * t * t + Math.sin(t * 3 + ph) * tw * 10 * t, y - h * 0.66 * t]); }
  for (i = -1; i <= 1; i += 2) shape(c, ribbon(curvePts([x + i * 5, y - 8], [x + i * baseW * 0.8, y - 3], [x + i * baseW * 1.25, y + 3], 6), 11, 3), K.trunk, { seed: seed + i, size: 'M', sh: 1.8, rough: 0.2 });
  shape(c, ribbon(cl, 0, 0, function (t) { return lerp(baseW, baseW * 0.62, t) + (t < 0.12 ? (0.12 - t) * baseW * 2.6 : 0); }), K.trunk, { seed: seed, size: 'XL', sh: 6, hl: 3, rough: 0.3 });
  var top = cl[n], cr = h * (0.2 + 0.16 * P.lush), cx = top[0], cy = top[1] - cr * 0.42;
  // two short branches into the canopy
  [-1, 1].forEach(function (sd, k) { var p0 = cl[8]; shape(c, ribbon(curvePts([p0[0], p0[1]], [p0[0] + sd * cr * 0.2, p0[1] - cr * 0.15], [p0[0] + sd * cr * 0.38, p0[1] - cr * 0.55], 6), baseW * 0.42, baseW * 0.24), K.trunk, { seed: seed + 20 + k, size: 'M', sh: 1.5, rough: 0.2 }); });
  var cnt = 4 + Math.round(P.lush * 4);
  leafBlobs(c, K, cx, cy, cr, seed * 3, cnt, mat);
  // glowing lantern fruit in the accent colour
  var bm = M(P.accentHue, 88, 64), nf = 3 + Math.round(P.glow * 3);
  for (i = 0; i < nf; i++) {
    var a = R() * 6.28, bx = cx + Math.cos(a) * cr * (0.3 + R() * 0.7), by = cy + Math.sin(a) * cr * 0.55 + cr * 0.15;
    c.beginPath(); c.arc(bx, by, 4, 0, 7); c.fillStyle = bm.base; c.fill(); c.lineWidth = ow('S') * 0.85; c.strokeStyle = OLC; c.stroke();
    c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',100%,90%,0.95)'; c.beginPath(); c.arc(bx - 1.2, by - 1.2, 1.4, 0, 7); c.fill();
    addLight(bx, by, 30 + 26 * P.glow, P.accentHue, 92, 62, 0.8);
  }
}

function rock(c, K, x, y, s, seed, mossy) {
  var R = rng(seed), pts = [], n = 8, i;
  gshadow(c, x + 2, y + 1, s * 0.9, s * 0.28);
  for (i = 0; i < n; i++) { var a = i / n * Math.PI * 2, r = s * (0.7 + R() * 0.4); pts.push([x + Math.cos(a) * r, y - s * 0.55 + Math.sin(a) * r * 0.62]); }
  var d = shape(c, pts, K.rock, { seed: seed, size: 'M', sh: 4, rough: 0.6 });
  if (mossy) { shape(c, blobPts(x - s * 0.15, y - s * 0.95, s * 0.7, s * 0.28, seed + 3, 10, 0.35), K.moss, { seed: seed + 4, size: 'S', sh: 1.5 }); }
  line(c, [[x + s * 0.1, y - s * 0.8], [x + s * 0.25, y - s * 0.4]], 1.2, OLC, false);
}
function mushroom(c, K, x, y, s, seed) {
  var R = rng(seed), tw = P.twist;
  gshadow(c, x + 1, y, s * 0.55, 2.8);
  var stem = ribbon(curvePts([x, y], [x + (R() - 0.5) * 6 * tw, y - s * 0.5], [x + (R() - 0.5) * 4 * tw, y - s * 0.9], 6), s * lerp(0.5, 0.34, P.spindly), s * 0.32);
  shape(c, stem, K.stem, { seed: seed, size: 'S', sh: 1.4, rough: 0.2 });
  var cx = x, cy = y - s * 0.9, k, cap = [];
  for (k = 0; k <= 16; k++) { var a = Math.PI + k / 16 * Math.PI; cap.push([cx + Math.cos(a) * s * 0.82, cy + Math.sin(a) * s * 0.62]); }
  cap.push([cx + s * 0.8, cy + 3]); cap.push([cx + s * 0.4, cy + 5]); cap.push([cx, cy + 3.5]); cap.push([cx - s * 0.4, cy + 5]); cap.push([cx - s * 0.8, cy + 3]);
  var d = shape(c, cap, K.cap, { seed: seed + 1, size: 'S', sh: 2.4, hl: 1.8, rough: 0.2 });
  if (P.stripes > 0.3) stripesIn(c, d, 1.57, s * 0.1, OLC, 0.2);
  for (k = 0; k < 4; k++) { c.beginPath(); c.ellipse(cx + (k - 1.5) * s * 0.3 + (R() - 0.5) * 3, cy - s * 0.18 - (k % 2) * s * 0.18, s * 0.11, s * 0.09, 0, 0, 7); c.fillStyle = K.spot.base; c.fill(); }
  addLight(cx, cy, 26 + 18 * P.glow, P.accentHue, 85, 60, 0.5);
}

function flower(c, K, x, y, seed) {
  var R = rng(seed), h = 12 + R() * 14 * (0.6 + P.spindly), tw = P.twist;
  var tip = [x + (R() - 0.5) * 6 * tw, y - h];
  line(c, curvePts([x, y], [x + (R() - 0.5) * 6 * tw, y - h * 0.5], tip, 6), 2.4, K.leafD.base, true);
  shape(c, ellPts(x + 4, y - h * 0.35, 4.2, 2.2, 8), K.leaf, { seed: seed + 30, size: 'S', sh: 0.8, rough: 0.1 });
  var m = [K.flowerA, K.flowerB, K.flowerC][Math.floor(R() * 3)], np = 5, pr = 4.4 + R() * 2.2, i;
  for (i = 0; i < np; i++) { var a = i / np * Math.PI * 2 + 0.3; shape(c, ellPts(tip[0] + Math.cos(a) * pr, tip[1] + Math.sin(a) * pr * 0.85, pr * 0.95, pr * 0.78, 10), m, { seed: seed + i, size: 'S', sh: 0.9, hl: 0.8, rough: 0.1 }); }
  c.beginPath(); c.arc(tip[0], tip[1], pr * 0.55, 0, 7); c.fillStyle = K.spot.base; c.fill(); c.lineWidth = ow('S') * 0.8; c.strokeStyle = OLC; c.stroke();
}

function pond(c, K, cx, cy, rx, ry, seed) {
  var R = rng(seed);
  var d = shape(c, blobPts(cx, cy, rx, ry, seed, 16, 0.18), K.water, { seed: seed, size: 'L', sh: 4, rough: 0.5 });
  c.save(); path(c, d); c.clip();
  var g = c.createLinearGradient(cx, cy - ry, cx, cy + ry); g.addColorStop(0, K.waterL.base); g.addColorStop(1, K.water.shade); c.fillStyle = g; c.globalAlpha = 0.85; c.fillRect(cx - rx, cy - ry, rx * 2, ry * 2); c.globalAlpha = 1;
  for (var i = 0; i < 3; i++) { var sp = []; for (var k = 0; k < 40; k++) { var a = k * 0.45, r = 3 + k * (rx * 0.02) * (1 + i * 0.1); sp.push([cx - rx * 0.2 + i * 18 + Math.cos(a) * r * 1.3, cy + (i - 1) * 6 + Math.sin(a) * r * 0.45]); } line(c, sp, 1.1, K.waterL.hl, false); }
  c.restore();
  path(c, d); c.lineWidth = ow('L'); c.strokeStyle = OLC; c.stroke();
  for (i = 0; i < 4; i++) { var px = cx + (R() - 0.5) * rx * 1.2, py = cy + (R() - 0.5) * ry * 1.0; shape(c, ellPts(px, py, 8, 3.6, 10), K.leaf, { seed: seed + i, size: 'S', sh: 1 }); }
  glowSpot(c, cx + rx * 0.3, cy, rx * 0.8, 'hsla(' + P.accentHue.toFixed(0) + ',90%,60%,__A__)', 0.1 * P.glow);
}
function stonePath(c, K, seed) {
  var R = rng(seed), i;
  for (i = 0; i < 22; i++) { var t = i / 21, x = lerp(-10, 330, t), y = 262 - 150 * Math.pow(t, 0.9) + Math.sin(t * 5) * 14 * P.twist, w = 12 + R() * 6; shape(c, ellPts(x + (R() - 0.5) * 6, y + (R() - 0.5) * 6, w, w * 0.5, 10), K.path, { seed: seed + i, size: 'S', sh: 1.4, rough: 0.5 }); }
}
function lampPostOutside(c, K, x, y, seed) { return lampPost(c, K, x, y, 96, seed, P.accentHue); }
function fence(c, K, x0, y, n, seed) {
  var R = rng(seed), i;
  for (i = 0; i < n; i++) {
    var x = x0 + i * 15, lean = (R() - 0.5) * P.twist * 0.55, h = 30 + R() * 10;
    c.save(); c.translate(x, y); c.rotate(lean);
    gshadow(c, 2, 1, 6, 2);
    var d = shape(c, [[-4, 0], [-4, -h + 7], [0, -h], [4, -h + 7], [4, 0]], K.crate, { seed: seed + i, size: 'S', sh: 1.5 });
    if (P.stripes > 0.4) stripesIn(c, d, 1.57, 2.2, OLC, 0.2);
    c.restore();
  }
  line(c, [[x0 - 4, y - 20], [x0 + n * 15, y - 18 + P.twist * 3]], 3, K.crate.shade, true);
}
function ruinArch(c, K, x, y, seed) {
  var R = rng(seed);
  gshadow(c, x, y, 40, 5); longShadow(c, x, y, 40, 40);
  shape(c, ribbon([[x - 26, y], [x - 25 + P.twist * 3, y - 52], [x - 24, y - 70]], 12, 9), K.rock, { seed: seed, size: 'L', sh: 4 });
  shape(c, ribbon([[x + 26, y], [x + 27 - P.twist * 3, y - 36], [x + 24, y - 44]], 12, 9), K.rock, { seed: seed + 1, size: 'L', sh: 4 });
  var arc = []; var k; for (k = 0; k <= 8; k++) { var a = Math.PI + k / 8 * Math.PI * 0.55; arc.push([x - 0 + Math.cos(a) * 25, y - 66 + Math.sin(a) * 18]); }
  shape(c, ribbon(arc, 10, 8), K.rock, { seed: seed + 2, size: 'L', sh: 3 });
  shape(c, blobPts(x - 22, y - 70, 12, 6, seed + 3, 8, 0.3), K.moss, { seed: seed + 4, size: 'S' });
  for (k = 0; k < 4; k++) { var vx = x - 22 + k * 5, vl = 14 + R() * 20; line(c, curvePts([vx, y - 66], [vx + (R() - 0.5) * 6 * P.twist, y - 66 + vl / 2], [vx + (R() - 0.5) * 8 * P.twist, y - 66 + vl], 5), 1.8, K.leaf.base, true); }
}
function mossPipe(c, K, x, y, seed) {
  gshadow(c, x, y, 22, 4);
  var pts = curvePts([x, y], [x + 4, y - 40], [x + 28 + P.twist * 10, y - 40], 10);
  var d = shape(c, ribbon(pts, 13, 13), K.brass, { seed: seed, size: 'M', sh: 3 });
  if (P.stripes > 0.4) stripesIn(c, d, 1.2, 4, OLC, 0.1 + P.stripes * 0.1);
  shape(c, rrPts(x - 10, y - 22, 20, 7, 2), K.iron, { seed: seed + 1, size: 'S' });
  shape(c, blobPts(x + 16, y - 40, 14, 6, seed + 2, 10, 0.4), K.moss, { seed: seed + 3, size: 'S' });
  shape(c, blobPts(x - 3, y - 28, 9, 5, seed + 4, 9, 0.4), K.moss, { seed: seed + 5, size: 'S' });
}
function drawOutside(c, withHero) {
  var K = mats(), S = P.seed, R = rng(S * 13 + 9), i;
  lights.length = 0;
  groundGrass(c, K);
  stonePath(c, K, S + 50);
  var objs = [];
  objs.push({ y: 205, f: function () { tree(c, K, 70, 205, 250, S + 1, 34); } });
  objs.push({ y: 196, f: function () { ancient(c, K, 400, 200, 215, S + 2); } });
  objs.push({ y: 176, f: function () { birch(c, K, 300, 178, 120, S + 9); cypress(c, K, 322, 172, 120, S + 10); } });
  objs.push({ y: 146, f: function () { willow(c, K, 236, 146, 190, S + 3); } });
  objs.push({ y: 232, f: function () { pine(c, K, 336, 234, 128, S + 4); } });
  objs.push({ y: 160, f: function () { pine(c, K, 150, 160, 112, S + 5); } });
  objs.push({ y: 270, f: function () { pond(c, K, 112, 270, 64, 20, S + 6); reeds(c, K, 176, 268, S + 40); } });
  objs.push({ y: 224, f: function () { rock(c, K, 212, 226, 15, S + 7, true); rock(c, K, 228, 230, 9, S + 8, false); } });
  objs.push({ y: 268, f: function () { rock(c, K, 440, 270, 17, S + 9, true); } });
  objs.push({ y: 278, f: function () { mushroom(c, K, 316, 278, 22, S + 10); mushroom(c, K, 332, 284, 15, S + 11); mushroom(c, K, 304, 286, 12, S + 12); } });
  objs.push({ y: 206, f: function () { lampPostOutside(c, K, 196, 206, S + 13); } });
  objs.push({ y: 164, f: function () { fence(c, K, 330, 164, 6, S + 14); } });
  objs.push({ y: 296, f: function () { stumpLantern(c, K, 30, 292, S + 15); } });
  objs.push({ y: 262, f: function () { fallenLog(c, K, 380, 266, 64, S + 16); } });
  objs.push({ y: 238, f: function () { signpost(c, K, 258, 240, S + 17); } });
  objs.push({ y: 232, f: function () { bellFlower(c, K, 298, 236, S + 18); bellFlower(c, K, 312, 240, S + 19); } });
  objs.push({ y: 250, f: function () { bush(c, K, 36, 252, 24, S + 20, true); } });
  objs.push({ y: 224, f: function () { bush(c, K, 460, 226, 26, S + 21, false); } });
  objs.push({ y: 196, f: function () { bush(c, K, 126, 196, 20, S + 22, true); } });
  [[140, 236, 24], [20, 214, 22], [276, 252, 20], [356, 238, 20], [458, 270, 22], [210, 290, 18]].forEach(function (f, k) { objs.push({ y: f[1], f: function () { fern(c, K, f[0], f[1], f[2], S + 60 + k); } }); });
  for (i = 0; i < 16; i++) { (function (i) { var fx = 10 + R() * (W - 20), fy = 150 + R() * 146; objs.push({ y: fy, f: function () { flower(c, K, fx, fy, S + 100 + i); } }); })(i); }
  if (withHero !== false && P.scaleRef) objs.push({ y: 262, f: function () { heroRef(c, K, 262, 276); } });
  objs.sort(function (a, b) { return a.y - b.y; });
  objs.forEach(function (o) { o.f(); });
}

function tierPts(cx, by, w, th, n, seed) {
  var R = rng(seed), pts = [[cx, by - th], [cx + w * 0.55, by - th * 0.45], [cx + w, by - 2]], i, j;
  var step = (w * 2) / n;
  for (i = 0; i < n; i++) { var x0 = cx + w - i * step; for (j = 1; j <= 4; j++) { var t = j / 4; pts.push([x0 - step * t, by - 2 + Math.sin(t * Math.PI) * (4 + R() * 2)]); } }
  pts.push([cx - w, by - 2]); pts.push([cx - w * 0.55, by - th * 0.45]);
  return pts;
}
function pine(c, K, x, y, h, seed) {
  var R = rng(seed), i, tiers = 4 + Math.round(P.lush * 2), tw = P.twist;
  longShadow(c, x, y, 26, h * 0.5); gshadow(c, x, y + 1, 26, 6, 0.4);
  var trunkH = h * 0.3;
  shape(c, ribbon([[x, y], [x + tw * 4, y - trunkH]], lerp(18, 10, P.spindly), lerp(14, 8, P.spindly)), K.trunk, { seed: seed, size: 'M', sh: 3 });
  var base = y - trunkH * 0.35, bw = h * 0.3 * (0.9 + R() * 0.2);
  for (i = 0; i < tiers; i++) {
    var t = i / (tiers - 1), w = lerp(bw, bw * 0.28, t), th = (h * 0.7 / tiers) * 1.7, by = base - i * (h * 0.68 / tiers);
    shape(c, tierPts(x + tw * 3 * t, by, w, th, Math.max(3, Math.round(w / 9)), seed + i * 5), i % 2 ? K.pine : K.pineL, { seed: seed + i, size: 'L', sh: 4, hl: 3, rough: 0.5 });
  }
  var bm = M(P.accentHue, 88, 64);
  for (i = 0; i < 3; i++) { var bx = x + (R() - 0.5) * bw * 1.2, by2 = base - h * (0.2 + R() * 0.4); c.beginPath(); c.arc(bx, by2, 3.4, 0, 7); c.fillStyle = bm.base; c.fill(); c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',100%,90%,0.95)'; c.beginPath(); c.arc(bx - 1, by2 - 1, 1.2, 0, 7); c.fill(); addLight(bx, by2, 24 + 18 * P.glow, P.accentHue, 92, 62, 0.7); }
}
function willow(c, K, x, y, h, seed) {
  var R = rng(seed), tw = P.twist, i, n = 10, cl = [], lean = (R() - 0.5) * tw * 24;
  longShadow(c, x, y, 40, h * 0.5); gshadow(c, x, y + 1, 34, 6, 0.4);
  for (i = 0; i <= n; i++) { var t = i / n; cl.push([x + lean * t * t + Math.sin(t * 3 + seed) * tw * 6 * t, y - h * 0.6 * t]); }
  shape(c, ribbon(cl, 0, 0, function (t) { return lerp(26, 14, t) + (t < 0.12 ? (0.12 - t) * 60 : 0); }), K.trunk, { seed: seed, size: 'L', sh: 5, rough: 0.3 });
  var top = cl[n], cr = h * 0.3, cx = top[0], cy = top[1] - cr * 0.3;
  leafBlobs(c, K, cx, cy, cr, seed * 3, 5 + Math.round(P.lush * 3), K.willow);
  var ns = 12 + Math.round(P.lush * 6);
  for (i = 0; i < ns; i++) {
    var sx = cx - cr * 0.95 + (i / (ns - 1)) * cr * 1.9, sy = cy + cr * 0.32 + Math.sin(i * 1.7) * 4, len = h * (0.22 + R() * 0.28), pts = [], k, sway = R() * 6;
    for (k = 0; k <= 8; k++) { var tt = k / 8; pts.push([sx + Math.sin(tt * 3 + sway) * (2 + tw * 4) * tt, sy + len * tt]); }
    line(c, pts, 1.8, K.willow.shade, false);
    for (k = 1; k <= 8; k += 1) { var p = pts[k]; c.fillStyle = k % 2 ? K.willow.shade : K.willow.base; c.beginPath(); c.ellipse(p[0] + (k % 2 ? 2 : -2), p[1], 2.8, 1.6, 0.6, 0, 7); c.fill(); }
  }
  var bm = M(P.accentHue, 88, 64);
  for (i = 0; i < 3; i++) { var bx = cx + (R() - 0.5) * cr * 1.5, by = cy + cr * 0.2 + R() * h * 0.2; c.beginPath(); c.arc(bx, by, 3.4, 0, 7); c.fillStyle = bm.base; c.fill(); c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',100%,90%,0.95)'; c.beginPath(); c.arc(bx - 1, by - 1, 1.2, 0, 7); c.fill(); addLight(bx, by, 28 + 20 * P.glow, P.accentHue, 92, 62, 0.8); }
}
function mushTree(c, K, x, y, h, seed) {
  var R = rng(seed), tw = P.twist, i;
  longShadow(c, x, y, 40, h * 0.5); gshadow(c, x, y + 1, 36, 6, 0.4);
  var cl = curvePts([x, y], [x + tw * 10, y - h * 0.5], [x + tw * 6, y - h * 0.74], 10);
  shape(c, ribbon(cl, 0, 0, function (t) { return lerp(lerp(40, 26, P.spindly), lerp(26, 18, P.spindly), t) + (t < 0.1 ? (0.1 - t) * 90 : 0); }), K.stem, { seed: seed, size: 'L', sh: 5, hl: 3, rough: 0.3 });
  var top = cl[cl.length - 1], rx = h * (0.3 + 0.12 * P.lush), ry = h * 0.2, cx = top[0], cy = top[1] - 4;
  shape(c, ellPts(cx, cy + 4, rx * 0.92, ry * 0.4, 22), K.gill, { seed: seed + 1, size: 'M', sh: 3, rough: 0.3 });
  var cap = [], k, nb = 8;
  for (k = 0; k <= 26; k++) { var a = Math.PI + k / 26 * Math.PI; cap.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  for (k = 0; k < nb; k++) { var tt = k / nb; cap.push([cx + rx - tt * rx * 2 - rx * 0.12, cy + 4 + Math.sin(tt * Math.PI * nb) * 2]); }
  var d = shape(c, cap, K.cap2, { seed: seed + 2, size: 'XL', sh: 7, hl: 4, rough: 0.35 });
  for (k = 0; k < 9; k++) { var sa = Math.PI + 0.25 + (k / 8) * (Math.PI - 0.5), sr = 0.4 + R() * 0.5, sx = cx + Math.cos(sa) * rx * sr, sy = cy + Math.sin(sa) * ry * sr; c.beginPath(); c.ellipse(sx, sy, 3 + R() * 5, 2.4 + R() * 3, 0, 0, 7); c.fillStyle = k % 3 === 0 ? 'hsla(' + P.accentHue.toFixed(0) + ',95%,80%,0.95)' : K.spot.base; c.fill(); if (k % 3 === 0) addLight(sx, sy, 34 + 24 * P.glow, P.accentHue, 92, 66, 0.7); }
  addLight(cx, cy + 10, rx * 1.3, P.accentHue, 80, 60, 0.5);
}
function bush(c, K, x, y, r, seed, berries) {
  var R = rng(seed);
  gshadow(c, x, y, r * 1.15, r * 0.38, 0.4);
  leafBlobs(c, K, x, y - r * 0.55, r, seed, 3 + Math.round(P.lush * 3));
  if (berries) { var bm = M(P.accentHue, 88, 64), i; for (i = 0; i < 5; i++) { var bx = x + (R() - 0.5) * r * 1.6, by = y - r * 0.5 + (R() - 0.3) * r * 0.8; c.beginPath(); c.arc(bx, by, 2.8, 0, 7); c.fillStyle = bm.base; c.fill(); c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',100%,90%,0.95)'; c.beginPath(); c.arc(bx - 0.8, by - 0.8, 1, 0, 7); c.fill(); addLight(bx, by, 16 + 12 * P.glow, P.accentHue, 92, 62, 0.4); } }
}
function fern(c, K, x, y, s, seed) {
  var R = rng(seed), n = 5 + Math.floor(R() * 3), i, k;
  gshadow(c, x, y, s * 0.5, s * 0.14, 0.3);
  for (i = 0; i < n; i++) {
    var a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.4, L = s * (0.8 + R() * 0.5), pts = [];
    for (k = 0; k <= 8; k++) { var t = k / 8; pts.push([x + Math.cos(a) * L * t, y + Math.sin(a) * L * t + t * t * L * 0.5]); }
    line(c, pts, 2, K.leafD.base, false);
    for (k = 1; k <= 8; k++) {
      var p = pts[k], q = pts[k - 1], an = Math.atan2(p[1] - q[1], p[0] - q[0]), sz = (1 - k / 9) * s * 0.3 + 2.4;
      [-1, 1].forEach(function (sd) { c.save(); c.translate(p[0], p[1]); c.rotate(an + sd * 1.1); c.beginPath(); c.ellipse(sz * 0.5, 0, sz, sz * 0.36, 0, 0, 7); c.fillStyle = (k % 2 ? K.leaf : K.leafD).base; c.fill(); if (P.look !== 1) { c.lineWidth = ow('S') * 0.5; c.strokeStyle = OLC; c.stroke(); } c.restore(); });
    }
  }
}
function fallenLog(c, K, x, y, len, seed) {
  var R = rng(seed), h = lerp(24, 15, P.spindly);
  gshadow(c, x, y, len * 0.6, 6, 0.4);
  shape(c, rrPts(x - len / 2, y - h, len, h, h * 0.42), K.trunk, { seed: seed, size: 'M', sh: 4, grain: 0, rough: 0.4 });
  var e = shape(c, ellPts(x + len / 2 - 2, y - h / 2, h * 0.36, h * 0.52, 16), K.trunkL, { seed: seed + 1, size: 'S', sh: 1.5, flat: false });
  c.save(); c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,12%,0.5)'; c.lineWidth = 1; [0.7, 0.42, 0.18].forEach(function (f) { c.beginPath(); c.ellipse(x + len / 2 - 2, y - h / 2, h * 0.36 * f, h * 0.52 * f, 0, 0, 7); c.stroke(); }); c.restore();
  shape(c, blobPts(x - len * 0.12, y - h * 0.98, len * 0.3, h * 0.26, seed + 3, 14, 0.35), K.moss, { seed: seed + 4, size: 'S', sh: 1.5 });
  mushroom(c, K, x + len * 0.12, y - h * 0.9, 12, seed + 5); mushroom(c, K, x - len * 0.3, y - h * 0.7, 9, seed + 6);
}
function reeds(c, K, x, y, seed) {
  var R = rng(seed), tw = P.twist, i;
  for (i = 0; i < 8; i++) {
    var bx = x + (i - 4) * 5 + R() * 3, h = 16 + R() * 14, tip = [bx + (R() - 0.5) * 10 * (0.4 + tw), y - h];
    line(c, curvePts([bx, y], [bx + (R() - 0.5) * 6 * tw, y - h * 0.5], tip, 6), 2.2, i % 2 ? K.leaf.base : K.leafD.base, false);
    if (i % 3 === 0) shape(c, ellPts(tip[0], tip[1] - 2, 2.8, 7.5, 8), K.trunk, { seed: seed + i, size: 'S', sh: 1, rough: 0.2 });
  }
}
function signpost(c, K, x, y, seed) {
  gshadow(c, x, y, 10, 3, 0.35);
  shape(c, ribbon([[x, y], [x + P.twist * 3, y - 58]], 7, 5), K.wood, { seed: seed, size: 'S', sh: 1.5, rough: 0.3 });
  shape(c, [[x - 20, y - 52], [x + 16, y - 56], [x + 26, y - 49], [x + 16, y - 42], [x - 20, y - 40]], K.wood, { seed: seed + 1, size: 'S', sh: 1.5, rough: 0.4 });
  shape(c, [[x - 16, y - 36], [x + 20, y - 34], [x + 20, y - 24], [x - 16, y - 24], [x - 26, y - 30]], K.wood, { seed: seed + 2, size: 'S', sh: 1.5, rough: 0.4 });
  c.save(); c.strokeStyle = 'hsla(' + P.accentHue.toFixed(0) + ',95%,72%,0.95)'; c.lineWidth = 1.6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - 12, y - 49); c.lineTo(x + 6, y - 50); c.moveTo(x - 10, y - 44); c.lineTo(x + 2, y - 45); c.moveTo(x - 10, y - 31); c.lineTo(x + 12, y - 30); c.stroke(); c.restore();
  addLight(x, y - 42, 28 + 18 * P.glow, P.accentHue, 92, 62, 0.4);
}
function bellFlower(c, K, x, y, seed) {
  var R = rng(seed), tw = P.twist, h = 26 + R() * 18;
  var tip = [x + 10 + R() * 8, y - h * 0.8];
  var stem = curvePts([x, y], [x - 4, y - h], tip, 10);
  line(c, stem, 2.2, K.leafD.base, true);
  var m = M(P.accentHue, 85, 62), i;
  for (i = 0; i < 3; i++) {
    var p = stem[4 + i * 2 > 10 ? 10 : 4 + i * 2], bx = p[0] + 1, by = p[1] + 3;
    shape(c, [[bx - 2, by], [bx + 2, by], [bx + 5, by + 9], [bx + 2, by + 11], [bx, by + 9], [bx - 2, by + 11], [bx - 5, by + 9]], m, { seed: seed + i, size: 'S', sh: 1, hl: 1, rough: 0.2 });
    c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',100%,90%,0.9)'; c.beginPath(); c.arc(bx, by + 10, 1.6, 0, 7); c.fill();
    addLight(bx, by + 8, 22 + 18 * P.glow, P.accentHue, 92, 64, 0.55);
  }
}
function stumpLantern(c, K, x, y, seed) {
  gshadow(c, x, y, 16, 5, 0.4);
  shape(c, [[x - 15, y], [x - 12, y - 18], [x + 12, y - 18], [x + 15, y]], K.trunk, { seed: seed, size: 'M', sh: 3, rough: 0.4 });
  shape(c, ellPts(x, y - 18, 12, 5, 16), K.trunkL, { seed: seed + 1, size: 'S', sh: 1 });
  c.save(); c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,12%,0.45)'; c.lineWidth = 0.9; c.beginPath(); c.ellipse(x, y - 18, 7, 2.8, 0, 0, 7); c.stroke(); c.restore();
  var gl = M(P.accentHue, 88, 68);
  shape(c, ellPts(x, y - 28, 6.5, 8.5, 14), gl, { seed: seed + 2, size: 'S', sh: 1.5, hl: 1.4, rough: 0.2 });
  shape(c, rrPts(x - 5.5, y - 38, 11, 4, 2), K.brass, { seed: seed + 3, size: 'S', sh: 1, rough: 0.2 });
  c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',100%,92%,0.95)'; c.beginPath(); c.ellipse(x - 1.4, y - 29, 2.2, 3.2, 0, 0, 7); c.fill();
  addLight(x, y - 28, 70 + 40 * P.glow, P.accentHue, 92, 62, 0.9);
}


/* ---------------- more tree species ---------------- */
function glowFruit(c, bx, by, r) {
  var bm = M(P.accentHue, 88, 64);
  c.beginPath(); c.arc(bx, by, r, 0, 7); c.fillStyle = bm.base; c.fill();
  c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',100%,90%,0.95)'; c.beginPath(); c.arc(bx - r * 0.3, by - r * 0.3, r * 0.35, 0, 7); c.fill();
  addLight(bx, by, 22 + 18 * P.glow, P.accentHue, 92, 62, 0.6);
}
function birch(c, K, x, y, h, seed) {
  var R = rng(seed), tw = P.twist, i, n = 10, cl = [], lean = (R() - 0.5) * (tw * 20 + 8);
  longShadow(c, x, y, 18, h * 0.5); gshadow(c, x, y + 1, 15, 5, 0.4);
  for (i = 0; i <= n; i++) { var t = i / n; cl.push([x + lean * t * t + Math.sin(t * 4 + seed) * 2.2 * t, y - h * 0.72 * t]); }
  shape(c, ribbon(cl, 0, 0, function (t) { return lerp(13, 6, t) + (t < 0.1 ? (0.1 - t) * 34 : 0); }), K.birch, { seed: seed, size: 'M', sh: 2, rough: 0.3 });
  for (i = 0; i < 9; i++) { var p = cl[Math.min(n, 1 + Math.round(i * 1.0))]; c.fillStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,12%,0.7)'; c.beginPath(); c.ellipse(p[0] + (R() - 0.5) * 3, p[1] + (R() - 0.5) * 4, 2 + R() * 2, 0.9, 0, 0, 7); c.fill(); }
  var top = cl[n];
  [[-1, 0.7], [1, 0.8], [-1, 0.9]].forEach(function (b, k) { var p0 = cl[Math.round(b[1] * n)]; line(c, curvePts([p0[0], p0[1]], [p0[0] + b[0] * 8, p0[1] - 10], [p0[0] + b[0] * 16, p0[1] - 22], 5), 2.6, K.birch.base, true); });
  for (i = 0; i < 6; i++) leafBlobs(c, K, top[0] + (R() - 0.5) * h * 0.42, top[1] + (R() - 0.2) * h * 0.2, h * (0.09 + R() * 0.06), seed * 3 + i, 3, K.birchLeaf);
  for (i = 0; i < 2; i++) glowFruit(c, top[0] + (R() - 0.5) * h * 0.3, top[1] + R() * h * 0.15, 2.8);
}
function cypress(c, K, x, y, h, seed) {
  var R = rng(seed), i, n = 9, sw = (R() - 0.5) * P.twist * 10;
  longShadow(c, x, y, 20, h * 0.5); gshadow(c, x, y + 1, 16, 5, 0.4);
  shape(c, rrPts(x - 4.5, y - 16, 9, 18, 2), K.trunk, { seed: seed, size: 'S', sh: 1.5, rough: 0.3 });
  for (i = 0; i < n; i++) {
    var t = i / (n - 1), r = lerp(h * 0.16, h * 0.05, Math.pow(t, 0.8)), cy = y - 16 - (h * 0.78) * t, cx = x + sw * t;
    leafBlobs(c, K, cx, cy, r * 1.35, seed * 5 + i, 3, i % 2 ? K.pine : K.pineL, true);
  }
  for (i = 0; i < 3; i++) glowFruit(c, x + (R() - 0.5) * h * 0.14, y - h * (0.25 + R() * 0.5), 2.8);
}
function ancient(c, K, x, y, h, seed) {
  var R = rng(seed), tw = P.twist, i, n = 14, cl = [], lean = (R() - 0.5) * tw * 40, ph = R() * 6;
  longShadow(c, x, y, 90, h * 0.6); gshadow(c, x, y + 2, 64, 10, 0.45);
  for (i = 0; i <= n; i++) { var t = i / n; cl.push([x + lean * t * t + Math.sin(t * 3 + ph) * (6 + tw * 14) * t, y - h * 0.58 * t]); }
  for (i = -2; i <= 2; i++) { if (i === 0) continue; shape(c, ribbon(curvePts([x + i * 8, y - 14], [x + i * 30, y - 4], [x + i * 50, y + 6], 7), 20, 3), K.trunk, { seed: seed + i, size: 'M', sh: 3, rough: 0.35 }); }
  var trunk = shape(c, ribbon(cl, 0, 0, function (t) { return lerp(66, 36, Math.pow(t, 0.7)) + (t < 0.15 ? (0.15 - t) * 120 : 0); }), K.trunk, { seed: seed, size: 'XL', sh: 8, hl: 4, rough: 0.35 });
  var hp = cl[2], hw = 13, hh = 30;
  var door = [[hp[0] - hw, hp[1] + 4], [hp[0] - hw, hp[1] - hh * 0.55], [hp[0] - hw * 0.5, hp[1] - hh * 0.9], [hp[0], hp[1] - hh], [hp[0] + hw * 0.5, hp[1] - hh * 0.9], [hp[0] + hw, hp[1] - hh * 0.55], [hp[0] + hw, hp[1] + 4]];
  var dd = shape(c, door, M(P.shadowHue, 40, 10), { seed: seed + 9, size: 'M', flat: true, rough: 0.2 });
  c.save(); path(c, dd); c.clip(); var g = c.createRadialGradient(hp[0], hp[1] - 8, 2, hp[0], hp[1] - 8, 22); g.addColorStop(0, 'hsla(' + P.accentHue.toFixed(0) + ',100%,78%,0.95)'); g.addColorStop(1, 'hsla(' + P.accentHue.toFixed(0) + ',90%,40%,0.5)'); c.fillStyle = g; c.fillRect(hp[0] - hw, hp[1] - hh, hw * 2, hh + 6); c.restore();
  path(c, dd); c.lineWidth = ow('M'); c.strokeStyle = OLC; c.stroke();
  addLight(hp[0], hp[1] - 10, 110 + 60 * P.glow, P.accentHue, 95, 62, 1);
  shape(c, blobPts(cl[6][0] + 10, cl[6][1], 14, 6, seed + 3, 10, 0.4), K.moss, { seed: seed + 4, size: 'S', sh: 1.5 });
  var top = cl[n], cr = h * 0.36;
  [-1, 1].forEach(function (sd, k) { var p0 = cl[9]; shape(c, ribbon(curvePts([p0[0], p0[1]], [p0[0] + sd * cr * 0.5, p0[1] - cr * 0.1], [p0[0] + sd * cr * 0.95, p0[1] - cr * 0.5], 7), 26, 10), K.trunk, { seed: seed + 20 + k, size: 'M', sh: 3, rough: 0.35 }); });
  leafBlobs(c, K, top[0] - cr * 0.7, top[1] - cr * 0.15, cr * 0.78, seed * 3 + 1, 5);
  leafBlobs(c, K, top[0] + cr * 0.7, top[1] - cr * 0.1, cr * 0.8, seed * 3 + 2, 5);
  leafBlobs(c, K, top[0], top[1] - cr * 0.45, cr * 1.0, seed * 3 + 3, 6);
  for (i = 0; i < 5; i++) glowFruit(c, top[0] + (R() - 0.5) * cr * 2.2, top[1] - cr * 0.3 + R() * cr * 0.7, 3.6);
}
function blossomTree(c, K, x, y, h, seed) {
  tree(c, K, x, y, h, seed, 26, K.blossom);
}


/* ---------------- layer props: cold, heat, and gameplay objects ---------------- */
function snowPine(c, K, x, y, h, seed) {
  var R = rng(seed), i, tiers = 4 + Math.round(P.lush * 2), tw = P.twist;
  longShadow(c, x, y, 26, h * 0.5); gshadow(c, x, y + 1, 26, 6, 0.4);
  var trunkH = h * 0.3;
  shape(c, ribbon([[x, y], [x + tw * 4, y - trunkH]], lerp(18, 10, P.spindly), lerp(14, 8, P.spindly)), K.trunk, { seed: seed, size: 'M', sh: 3 });
  var base = y - trunkH * 0.35, bw = h * 0.3 * (0.9 + R() * 0.2);
  for (i = 0; i < tiers; i++) {
    var t = i / (tiers - 1), w = lerp(bw, bw * 0.28, t), th = (h * 0.7 / tiers) * 1.7, by = base - i * (h * 0.68 / tiers), n = Math.max(3, Math.round(w / 9));
    shape(c, tierPts(x + tw * 3 * t, by, w, th, n, seed + i * 5), i % 2 ? K.snowPineD : K.snowPineL, { seed: seed + i, size: 'L', sh: 4, hl: 3, rough: 0.5 });
    shape(c, tierPts(x + tw * 3 * t, by - th * 0.18, w * 0.82, th * 0.78, n, seed + i * 5 + 1), K.snowA, { seed: seed + i + 9, size: 'S', sh: 2, hl: 2, rough: 0.5 });
  }
}
function iceCrystal(c, K, x, y, s, seed) {
  var R = rng(seed), n = 3 + Math.floor(R() * 3), i, m = M(196, 68, 68);
  gshadow(c, x, y, 22 * s, 6 * s, 0.35);
  for (i = 0; i < n; i++) {
    var cx = x + (i - (n - 1) / 2) * 9 * s + (R() - 0.5) * 4, h = (16 + R() * 26) * s, w = (7 + R() * 4) * s;
    shape(c, [[cx - w / 2, y], [cx - w / 2 + 1, y - h * 0.78], [cx, y - h], [cx + w / 2 - 1, y - h * 0.78], [cx + w / 2, y]], m, { seed: seed + i, size: 'S', sh: 1.8, hl: 1.6, rough: 0.2 });
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(cx - w * 0.15, y - h * 0.15); c.lineTo(cx - w * 0.1, y - h * 0.75); c.stroke();
    addLight(cx, y - h * 0.5, 36 + 24 * P.glow, 196, 85, 70, 0.55);
  }
}
function snowRock(c, K, x, y, s, seed) {
  rock(c, K, x, y, s, seed, false);
  shape(c, blobPts(x - s * 0.1, y - s * 0.92, s * 0.8, s * 0.3, seed + 5, 12, 0.3), K.snowA, { seed: seed + 6, size: 'S', sh: 1.5, rough: 0.3 });
}
function snowBush(c, K, x, y, r, seed) {
  var K2 = Object.create(K); K2.leaf = K.snowB; K2.leafD = K.snowB;
  gshadow(c, x, y, r * 1.15, r * 0.38, 0.4);
  leafBlobs(c, K2, x, y - r * 0.55, r, seed, 3 + Math.round(P.lush * 2), K.snowPineL);
  shape(c, blobPts(x - r * 0.1, y - r * 1.15, r * 0.7, r * 0.3, seed + 3, 10, 0.3), K.snowA, { seed: seed + 4, size: 'S', sh: 1.2, rough: 0.3 });
}
function deadTree(c, K, x, y, h, seed) {
  var R = rng(seed), tw = P.twist, i, n = 10, cl = [], ph = R() * 6;
  longShadow(c, x, y, 24, h * 0.5); gshadow(c, x, y + 1, 22, 6, 0.4);
  for (i = 0; i <= n; i++) { var t = i / n; cl.push([x + Math.sin(t * 3.4 + ph) * (6 + tw * 14) * t, y - h * 0.62 * t]); }
  shape(c, ribbon(cl, 0, 0, function (t) { return lerp(24, 7, Math.pow(t, 0.7)) + (t < 0.1 ? (0.1 - t) * 60 : 0); }), K.deadW, { seed: seed, size: 'L', sh: 4, rough: 0.5 });
  for (i = 0; i < 4; i++) {
    var p0 = cl[4 + i], side = i % 2 ? 1 : -1, pts = [], cur = [p0[0], p0[1]], a = -Math.PI / 2 + side * (0.8 + R() * 0.5), k;
    for (k = 0; k <= 6; k++) { pts.push([cur[0], cur[1]]); a += side * 0.12 * (R() - 0.2); cur[0] += Math.cos(a) * h * 0.05; cur[1] += Math.sin(a) * h * 0.05; }
    shape(c, ribbon(pts, 8 - i, 2), K.deadW, { seed: seed + i * 3, size: 'S', sh: 1.5, rough: 0.5 });
  }
  c.strokeStyle = 'hsla(26,100%,58%,0.9)'; c.lineWidth = 1.1; c.lineCap = 'round';
  for (i = 0; i < 3; i++) { var q = cl[2 + i * 2]; c.beginPath(); c.moveTo(q[0] - 2, q[1]); c.lineTo(q[0] + 1, q[1] - 6); c.stroke(); }
  addLight(cl[4][0], cl[4][1], 44 + 26 * P.glow, 26, 100, 58, 0.55);
}
function vent(c, K, x, y, s, seed) {
  var R = rng(seed), i;
  gshadow(c, x, y, 26 * s, 8 * s, 0.4);
  shape(c, blobPts(x, y - 8 * s, 24 * s, 12 * s, seed, 16, 0.18), K.rockD, { seed: seed, size: 'M', sh: 4, rough: 0.5 });
  var d = shape(c, ellPts(x, y - 12 * s, 11 * s, 5 * s, 16), M(20, 90, 40), { seed: seed + 1, size: 'S', flat: true, rough: 0.2 });
  c.save(); path(c, d); c.clip(); var g = c.createRadialGradient(x, y - 12 * s, 1, x, y - 12 * s, 11 * s); g.addColorStop(0, 'hsla(50,100%,80%,1)'); g.addColorStop(0.5, 'hsla(28,100%,56%,0.95)'); g.addColorStop(1, 'hsla(10,90%,32%,0.9)'); c.fillStyle = g; c.fillRect(x - 12 * s, y - 20 * s, 24 * s, 16 * s); c.restore();
  for (i = 0; i < 4; i++) { c.save(); c.globalAlpha = 0.2 - i * 0.03; c.fillStyle = 'hsl(20,10%,80%)'; c.beginPath(); c.ellipse(x + Math.sin(i * 1.7 + seed) * 4, y - 22 * s - i * 11 * s, (7 + i * 3) * s, (5 + i * 2) * s, 0, 0, 7); c.fill(); c.restore(); }
  addLight(x, y - 12 * s, 90 + 50 * P.glow, 26, 100, 58, 0.9);
}
function emberRock(c, K, x, y, s, seed) {
  var K2 = Object.create(K); K2.rock = K.rockD;
  rock(c, K2, x, y, s, seed, false);
  c.strokeStyle = 'hsla(28,100%,60%,0.95)'; c.lineWidth = 1; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - s * 0.3, y - s * 0.9); c.lineTo(x - s * 0.1, y - s * 0.6); c.lineTo(x + s * 0.15, y - s * 0.55); c.stroke();
  addLight(x, y - s * 0.6, 26 + 14 * P.glow, 26, 100, 58, 0.45);
}
function emberBush(c, K, x, y, r, seed) {
  var K2 = Object.create(K); K2.leaf = K.charLeaf; K2.leafD = K.charLeaf;
  gshadow(c, x, y, r * 1.15, r * 0.38, 0.4);
  leafBlobs(c, K2, x, y - r * 0.55, r, seed, 3 + Math.round(P.lush * 2), K.charLeaf);
  var R = rng(seed), i; for (i = 0; i < 5; i++) { var bx = x + (R() - 0.5) * r * 1.6, by = y - r * 0.5 + (R() - 0.3) * r * 0.8; c.fillStyle = 'hsl(30,100%,62%)'; c.beginPath(); c.arc(bx, by, 1.5, 0, 7); c.fill(); }
  addLight(x, y - r * 0.5, 30 + 14 * P.glow, 26, 100, 58, 0.4);
}
function bellObj(c, K, x, y, seed) {
  gshadow(c, x, y, 26, 6, 0.4);
  [-1, 1].forEach(function (sd, k) { shape(c, ribbon([[x + sd * 22, y], [x + sd * 20, y - 62]], 9, 7), K.wood, { seed: seed + k, size: 'M', sh: 2, rough: 0.3 }); });
  shape(c, rrPts(x - 28, y - 70, 56, 9, 3), K.wood, { seed: seed + 3, size: 'M', sh: 2, rough: 0.3 });
  line(c, [[x, y - 62], [x, y - 52]], 2, K.iron.base, true);
  shape(c, [[x - 5, y - 52], [x + 5, y - 52], [x + 13, y - 24], [x + 17, y - 22], [x - 17, y - 22], [x - 13, y - 24]], K.bellM, { seed: seed + 4, size: 'M', sh: 3, hl: 2, rough: 0.2 });
  shape(c, ellPts(x, y - 21, 17, 4, 14), K.bellM, { seed: seed + 5, size: 'S', sh: 1.5, rough: 0.2 });
  c.beginPath(); c.arc(x, y - 17, 3, 0, 7); c.fillStyle = K.iron.base; c.fill(); c.lineWidth = ow('S'); c.strokeStyle = OLC; c.stroke();
  addLight(x, y - 36, 34 + 16 * P.glow, 44, 85, 60, 0.35);
}
function leverObj(c, K, x, y, seed, on) {
  gshadow(c, x, y, 16, 4, 0.4);
  shape(c, rrPts(x - 13, y - 14, 26, 14, 4), K.iron, { seed: seed, size: 'M', sh: 2, rough: 0.2 });
  shape(c, rrPts(x - 9, y - 18, 18, 6, 3), K.ironLight, { seed: seed + 1, size: 'S', sh: 1, rough: 0.2 });
  var hx = x + (on ? 11 : -11), hy = y - 36;
  line(c, [[x, y - 14], [hx, hy]], 4, K.brass.base, true);
  c.beginPath(); c.arc(hx, hy, 4.4, 0, 7); c.fillStyle = on ? 'hsl(130,80%,58%)' : 'hsl(8,80%,56%)'; c.fill(); c.lineWidth = ow('S'); c.strokeStyle = OLC; c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(hx - 1.2, hy - 1.2, 1.3, 0, 7); c.fill();
  addLight(hx, hy, 30 + 14 * P.glow, on ? 130 : 8, 90, 58, 0.55);
}
function keyObj(c, K, x, y, seed) {
  gshadow(c, x, y, 12, 3, 0.35);
  var m = K.keyM, y0 = y - 12;
  shape(c, ellPts(x - 7, y0, 5.5, 5.5, 14), m, { seed: seed, size: 'S', sh: 1.5, hl: 1.2, rough: 0.1 });
  shape(c, ellPts(x - 7, y0, 2.2, 2.2, 8), K.floorA, { seed: seed + 1, size: 'S', flat: true });
  shape(c, rrPts(x - 2, y0 - 1.8, 16, 3.6, 1.5), m, { seed: seed + 2, size: 'S', sh: 1, rough: 0.1 });
  shape(c, rrPts(x + 9, y0 + 1, 3, 5, 1), m, { seed: seed + 3, size: 'S', flat: true });
  shape(c, rrPts(x + 5, y0 + 1, 3, 4, 1), m, { seed: seed + 4, size: 'S', flat: true });
  addLight(x, y0, 54 + 30 * P.glow, 48, 100, 66, 0.9);
  c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(x + 8, y0 - 6, 1.1, 0, 7); c.arc(x - 12, y0 + 5, 0.9, 0, 7); c.fill();
}
function gateBarObj(c, K, x, y, seed, lock) {
  gshadow(c, x, y, 17, 4, 0.35);
  shape(c, rrPts(x - 16, y - 8, 32, 8, 2), K.iron, { seed: seed, size: 'S', sh: 1.5, rough: 0.2 });
  var i; for (i = 0; i < 5; i++) shape(c, rrPts(x - 14 + i * 7, y - 58, 4, 52, 1.5), K.iron, { seed: seed + i + 1, size: 'S', sh: 1.2, hl: 1, rough: 0.2 });
  shape(c, rrPts(x - 16, y - 50, 32, 5, 2), K.iron, { seed: seed + 8, size: 'S', sh: 1, rough: 0.2 });
  shape(c, rrPts(x - 16, y - 24, 32, 5, 2), K.iron, { seed: seed + 9, size: 'S', sh: 1, rough: 0.2 });
  if (lock) { shape(c, rrPts(x - 6, y - 40, 12, 12, 3), K.brass, { seed: seed + 10, size: 'S', sh: 1.5, rough: 0.1 }); c.beginPath(); c.arc(x, y - 36, 1.6, 0, 7); c.fillStyle = OLC; c.fill(); addLight(x, y - 34, 40, 8, 90, 58, 0.4); }
}
function cliffObj(c, K, x, y, seed) {
  var R = rng(seed);
  gshadow(c, x + 3, y, 24, 6, 0.4);
  shape(c, [[x - 18, y], [x - 20, y - 30], [x - 12, y - 52], [x - 2, y - 46], [x + 8, y - 60], [x + 18, y - 40], [x + 22, y - 12], [x + 18, y]], K.rockC, { seed: seed, size: 'L', sh: 5, hl: 3, rough: 0.6 });
  shape(c, [[x + 8, y - 60], [x + 18, y - 40], [x + 22, y - 12], [x + 18, y], [x + 10, y - 20]], K.rockD, { seed: seed + 1, size: 'M', flat: true, rough: 0.5 });
  c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,9%,0.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 8, y - 40); c.lineTo(x - 4, y - 22); c.lineTo(x - 9, y - 8); c.stroke();
  if (seed % 3 === 0) shape(c, blobPts(x - 8, y - 44, 9, 4, seed + 3, 8, 0.4), K.moss, { seed: seed + 4, size: 'S' });
}


/* ---------------- Factory rooms and Commons landmarks ---------------- */
function bedObj(c, K, x, y, seed) {
  gshadow(c, x, y, 26, 5, 0.35);
  [[-20, 0], [20, 0]].forEach(function (p, k) { shape(c, rrPts(x + p[0] - 2.5, y - 8, 5, 10, 1.5), K.iron, { seed: seed + k, size: 'S', rough: 0.2 }); });
  shape(c, rrPts(x - 24, y - 16, 48, 12, 3), K.iron, { seed: seed + 2, size: 'M', sh: 2, rough: 0.2 });
  shape(c, rrPts(x - 22, y - 22, 44, 9, 4), M(mixHue(P.factoryHue, 200, 0.4), 34, 52), { seed: seed + 3, size: 'S', sh: 1.5, rough: 0.2 });
  shape(c, rrPts(x - 22, y - 26, 14, 8, 4), M(48, 25, 80), { seed: seed + 4, size: 'S', sh: 1, rough: 0.2 });
}
function lockerObj(c, K, x, y, seed) {
  gshadow(c, x, y, 14, 4, 0.35);
  shape(c, rrPts(x - 11, y - 44, 22, 44, 3), K.pipe, { seed: seed, size: 'M', sh: 3, rough: 0.2 });
  [0, 1].forEach(function (k) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x - 8, y - 38 + k * 3, 16, 1); });
  shape(c, rrPts(x - 8, y - 30, 16, 1.6, 0.8), K.ironLight, { seed: seed + 1, size: 'S', flat: true });
  c.beginPath(); c.arc(x + 6, y - 20, 1.6, 0, 7); c.fillStyle = K.brass.base; c.fill();
}
function rubbleObj(c, K, x, y, seed) {
  var R = rng(seed), i;
  gshadow(c, x, y, 26, 6, 0.4);
  for (i = 0; i < 7; i++) {
    var px = x + (R() - 0.5) * 40, py = y - R() * 12, sz = 5 + R() * 9, pts = [], k;
    for (k = 0; k < 5; k++) { var a = k / 5 * 6.28 + R(), rr = sz * (0.6 + R() * 0.5); pts.push([px + Math.cos(a) * rr, py + Math.sin(a) * rr * 0.65]); }
    shape(c, pts, i % 3 === 0 ? K.rockC : K.wall, { seed: seed + i, size: 'S', sh: 1.8, rough: 0.5 });
  }
  shape(c, blobPts(x + 6, y - 10, 9, 3.5, seed + 9, 8, 0.4), K.moss, { seed: seed + 10, size: 'S' });
}
function brokenPillar(c, K, x, y, seed) {
  gshadow(c, x, y, 24, 6, 0.4);
  shape(c, [[x - 15, y], [x - 14, y - 44], [x - 6, y - 52], [x + 2, y - 40], [x + 10, y - 48], [x + 15, y - 40], [x + 15, y]], K.iron, { seed: seed, size: 'L', sh: 4, rough: 0.5 });
  shape(c, rrPts(x - 18, y - 8, 36, 9, 3), K.ironLight, { seed: seed + 1, size: 'M', sh: 1.5, rough: 0.2 });
  shape(c, rrPts(x - 16, y - 28, 32, 7, 2), K.brass, { seed: seed + 2, size: 'S', sh: 1.2, rough: 0.2 });
  shape(c, blobPts(x - 4, y - 50, 10, 4, seed + 3, 8, 0.4), K.moss, { seed: seed + 4, size: 'S' });
  line(c, curvePts([x + 8, y - 44], [x + 14, y - 28], [x + 10, y - 12], 6), 2, K.leaf.base, false);
}
function tankObj(c, K, x, y, seed) {
  var R = rng(seed), horiz = R() < 0.5, i, body = pickMat(R, K);
  if (horiz) {
    var w = 70 + Math.floor(R() * 3) * 14, h = 32 + R() * 16;
    longShadow(c, x, y, w * 0.7, 30); gshadow(c, x, y, w * 0.6, 6, 0.4);
    [-1, 1].forEach(function (sd, k) { shape(c, rrPts(x + sd * w * 0.3 - 5, y - 12, 10, 14, 2), K.iron, { seed: seed + k, size: 'S', rough: 0.2 }); });
    shape(c, rrPts(x - w / 2, y - h - 10, w, h, h / 2.1), body, { seed: seed + 2, size: 'L', sh: 5, rough: 0.2 });
    for (i = 0; i < 3; i++) shape(c, rrPts(x - w / 2 + 10 + i * (w - 28) / 2, y - h - 11, 6, h + 2, 2), K.brass, { seed: seed + 3 + i, size: 'S', sh: 1, rough: 0.2 });
    shape(c, ellPts(x - w * 0.12, y - h - 12, 8, 4, 12), K.ironLight, { seed: seed + 7, size: 'S', sh: 1, rough: 0.2 });
    shape(c, ribbon([[x + w * 0.2, y - h - 12], [x + w * 0.2, y - h - 28], [x + w * 0.2 + 20, y - h - 30]], 7, 7), K.pipe, { seed: seed + 8, size: 'S', sh: 2, rough: 0.2 });
  } else {
    var w2 = 50 + Math.floor(R() * 3) * 10, h2 = 60 + Math.floor(R() * 4) * 10;
    longShadow(c, x, y, w2 * 0.9, 30); gshadow(c, x, y, w2 * 0.7, 7, 0.4);
    shape(c, rrPts(x - w2 / 2, y - h2, w2, h2 - 2, 12), body, { seed: seed + 2, size: 'L', sh: 5, rough: 0.2 });
    for (i = 0; i < 2 + Math.floor(R() * 2); i++) shape(c, rrPts(x - w2 / 2 - 2, y - h2 * (0.2 + i * 0.27), w2 + 4, 6, 3), K.brass, { seed: seed + 1 + i, size: 'S', sh: 1.2, rough: 0.2 });
    shape(c, ellPts(x, y - h2 - 2, w2 * 0.46, 8, 18), K.ironLight, { seed: seed + 4, size: 'M', sh: 2, rough: 0.2 });
    if (R() < 0.6) shape(c, ribbon([[x - 8, y - h2 - 6], [x - 8, y - h2 - 26], [x + 14, y - h2 - 30]], 8, 8), K.pipe, { seed: seed + 5, size: 'S', sh: 2, rough: 0.2 });
    shape(c, ellPts(x + w2 * 0.18, y - h2 * 0.5, 7, 7, 14), K.ironLight, { seed: seed + 6, size: 'S', sh: 1.2, rough: 0.1 });
    line(c, [[x + w2 * 0.18, y - h2 * 0.5], [x + w2 * 0.18 + 3.4, y - h2 * 0.5 - 3.4]], 1.4, C(P.accentHue, 85, 58), false);
  }
}

function pedestalObj(c, K, x, y, seed) {
  longShadow(c, x, y, 26, 18); gshadow(c, x, y, 24, 6, 0.4);
  shape(c, rrPts(x - 18, y - 8, 36, 8, 3), K.ironLight, { seed: seed, size: 'M', sh: 1.5, rough: 0.2 });
  shape(c, [[x - 12, y - 8], [x - 9, y - 26], [x + 9, y - 26], [x + 12, y - 8]], K.wall, { seed: seed + 1, size: 'M', sh: 3, rough: 0.2 });
  shape(c, ellPts(x, y - 27, 13, 4, 14), K.brass, { seed: seed + 2, size: 'S', sh: 1.5, rough: 0.2 });
  addLight(x, y - 30, 70 + 30 * P.glow, 48, 100, 66, 0.6);
}
function fuseObj(c, K, x, y, seed) {
  gshadow(c, x, y, 10, 3, 0.35);
  shape(c, rrPts(x - 5, y - 16, 10, 16, 3), M(190, 70, 62), { seed: seed, size: 'S', sh: 1.5, hl: 1.2, rough: 0.1 });
  shape(c, rrPts(x - 6, y - 18, 12, 4, 2), K.brass, { seed: seed + 1, size: 'S', sh: 1, rough: 0.1 });
  shape(c, rrPts(x - 6, y - 3, 12, 4, 2), K.brass, { seed: seed + 2, size: 'S', sh: 1, rough: 0.1 });
  c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(x - 3, y - 13, 1.6, 8);
  addLight(x, y - 9, 44 + 24 * P.glow, 190, 90, 66, 0.8);
}
function benchObj(c, K, x, y, seed) {
  gshadow(c, x, y, 24, 5, 0.35);
  [-18, 18].forEach(function (dx, k) { shape(c, rrPts(x + dx - 2.5, y - 14, 5, 14, 1.5), K.wood, { seed: seed + k, size: 'S', sh: 1, rough: 0.3 }); });
  shape(c, rrPts(x - 24, y - 20, 48, 7, 2), K.wood, { seed: seed + 2, size: 'S', sh: 1.5, rough: 0.3 });
  shape(c, rrPts(x - 24, y - 32, 48, 5, 2), K.wood, { seed: seed + 3, size: 'S', sh: 1.2, rough: 0.3 });
  shape(c, rrPts(x - 22, y - 34, 4, 16, 1.5), K.wood, { seed: seed + 4, size: 'S', flat: true, rough: 0.2 });
  shape(c, rrPts(x + 18, y - 34, 4, 16, 1.5), K.wood, { seed: seed + 5, size: 'S', flat: true, rough: 0.2 });
}
function wellObj(c, K, x, y, seed) {
  longShadow(c, x, y, 30, 20); gshadow(c, x, y, 22, 6, 0.4);
  shape(c, rrPts(x - 18, y - 18, 36, 18, 8), K.rockC, { seed: seed, size: 'M', sh: 3, rough: 0.4 });
  shape(c, ellPts(x, y - 18, 18, 6, 18), K.rockC, { seed: seed + 1, size: 'S', sh: 1.5, rough: 0.2 });
  shape(c, ellPts(x, y - 18, 12, 3.6, 16), M(P.outsideHue, 40, 14), { seed: seed + 2, size: 'S', flat: true, rough: 0.1 });
  [-16, 16].forEach(function (dx, k) { shape(c, rrPts(x + dx - 2, y - 52, 4, 36, 1), K.wood, { seed: seed + 3 + k, size: 'S', sh: 1, rough: 0.2 }); });
  shape(c, [[x - 22, y - 52], [x, y - 66], [x + 22, y - 52]], K.rust, { seed: seed + 6, size: 'M', sh: 2, rough: 0.3 });
  line(c, [[x, y - 54], [x, y - 36]], 1.2, K.iron.base, false);
  shape(c, rrPts(x - 3, y - 36, 6, 5, 1.5), K.wood, { seed: seed + 7, size: 'S', flat: true });
}
function haystackObj(c, K, x, y, seed) {
  var R = rng(seed), hm = M(48, 60, 58);
  longShadow(c, x, y, 26, 18); gshadow(c, x, y, 24, 6, 0.4);
  var d = shape(c, [[x - 22, y], [x - 20, y - 14], [x - 11, y - 26], [x, y - 31], [x + 11, y - 26], [x + 20, y - 14], [x + 22, y]], hm, { seed: seed, size: 'M', sh: 4, hl: 3, rough: 0.5 });
  c.save(); path(c, d); c.clip(); c.strokeStyle = C(44, 55, 38); c.globalAlpha = 0.55; c.lineWidth = 0.9;
  for (var i = 0; i < 14; i++) { var sx = x - 18 + R() * 36, sy = y - R() * 24; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + (R() - 0.5) * 6, sy - 6 - R() * 4); c.stroke(); } c.restore();
}
function cartObj(c, K, x, y, seed) {
  gshadow(c, x, y, 34, 7, 0.4);
  shape(c, rrPts(x - 28, y - 26, 56, 18, 3), K.wood, { seed: seed, size: 'M', sh: 3, rough: 0.3 });
  [-22, -8, 8, 22].forEach(function (dx, k) { shape(c, rrPts(x + dx - 1.5, y - 38, 3, 14, 1), K.wood, { seed: seed + 1 + k, size: 'S', flat: true, rough: 0.2 }); });
  line(c, [[x - 28, y - 30], [x + 28, y - 30]], 3, K.wood.base, true);
  [[-18, 0], [18, 0]].forEach(function (p, k) { shape(c, ellPts(x + p[0], y - 8, 9, 9, 16), K.wood, { seed: seed + 6 + k, size: 'M', sh: 1.5, rough: 0.2 }); shape(c, ellPts(x + p[0], y - 8, 3, 3, 8), K.iron, { seed: seed + 8 + k, size: 'S', flat: true }); });
  line(c, [[x + 28, y - 20], [x + 46, y - 6]], 3, K.wood.base, true);
  shape(c, blobPts(x - 8, y - 32, 12, 5, seed + 3, 8, 0.4), M(48, 60, 58), { seed: seed + 12, size: 'S', sh: 1.5 });
}
function scarecrowObj(c, K, x, y, seed) {
  gshadow(c, x, y, 12, 4, 0.35);
  line(c, [[x, y], [x, y - 50]], 4, K.wood.base, true); line(c, [[x - 20, y - 36], [x + 20, y - 36]], 4, K.wood.base, true);
  shape(c, [[x - 9, y - 38], [x + 9, y - 38], [x + 11, y - 20], [x - 11, y - 20]], M(mixHue(P.accentHue, 20, 0.4), 40, 42), { seed: seed, size: 'S', sh: 2, rough: 0.5 });
  shape(c, ellPts(x, y - 46, 7, 7, 12), M(48, 55, 66), { seed: seed + 1, size: 'S', sh: 1.5, rough: 0.2 });
  shape(c, [[x - 11, y - 50], [x + 11, y - 50], [x + 6, y - 56], [x, y - 66], [x - 6, y - 56]], K.wood, { seed: seed + 2, size: 'S', sh: 1.5, rough: 0.3 });
  c.fillStyle = OLC; c.beginPath(); c.arc(x - 2.5, y - 46, 1, 0, 7); c.arc(x + 2.5, y - 46, 1, 0, 7); c.fill();
}
function ruinHouse(c, K, x, y, seed) {
  var R = rng(seed);
  longShadow(c, x, y, 90, 50); gshadow(c, x, y, 52, 9, 0.45);
  shape(c, [[x - 46, y], [x - 46, y - 52], [x - 38, y - 60], [x - 30, y - 50], [x - 22, y - 56], [x - 14, y - 44], [x - 6, y - 40], [x - 6, y]], K.rockC, { seed: seed, size: 'L', sh: 5, rough: 0.5 });
  shape(c, [[x - 6, y], [x - 6, y - 40], [x + 6, y - 38], [x + 14, y - 46], [x + 26, y - 42], [x + 38, y - 56], [x + 46, y - 50], [x + 46, y]], K.rockC, { seed: seed + 1, size: 'L', sh: 5, rough: 0.5 });
  var win = shape(c, [[x - 36, y - 18], [x - 36, y - 34], [x - 29, y - 40], [x - 22, y - 34], [x - 22, y - 18]], M(P.shadowHue, 40, 10), { seed: seed + 2, size: 'M', flat: true, rough: 0.2 });
  c.save(); path(c, win); c.clip(); c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',90%,60%,0.4)'; c.fillRect(x - 38, y - 40, 18, 24); c.restore();
  var door = shape(c, [[x + 16, y], [x + 16, y - 26], [x + 23, y - 33], [x + 30, y - 26], [x + 30, y]], M(P.shadowHue, 40, 8), { seed: seed + 3, size: 'M', flat: true, rough: 0.2 });
  [[-30, -58, 22], [6, -50, 30], [26, -54, 26]].forEach(function (b, k) { line(c, [[x + b[0], y + b[1]], [x + b[0] + b[2] * 0.8, y + b[1] - 8 - R() * 6]], 4, K.wood.base, true); });
  shape(c, blobPts(x - 30, y - 56, 14, 5, seed + 5, 10, 0.4), K.moss, { seed: seed + 6, size: 'S' });
  shape(c, blobPts(x + 36, y - 52, 10, 4, seed + 7, 10, 0.4), K.moss, { seed: seed + 8, size: 'S' });
  line(c, curvePts([x + 36, y - 52], [x + 44, y - 30], [x + 40, y - 8], 6), 2, K.leaf.base, false);
  addLight(x - 29, y - 28, 50, P.accentHue, 90, 60, 0.4);
}
function waterWheelObj(c, K, x, y, seed) {
  var i;
  longShadow(c, x, y, 50, 24); gshadow(c, x, y, 34, 8, 0.4);
  shape(c, rrPts(x - 34, y - 26, 68, 26, 4), K.rockC, { seed: seed, size: 'L', sh: 4, rough: 0.4 });
  shape(c, [[x - 28, y - 26], [x - 22, y - 56], [x + 22, y - 56], [x + 28, y - 26]], K.rockC, { seed: seed + 1, size: 'L', sh: 4, rough: 0.4 });
  shape(c, rrPts(x - 7, y - 20, 14, 20, 3), M(P.shadowHue, 40, 10), { seed: seed + 2, size: 'S', flat: true });
  var wx = x + 38, wy = y - 24;
  shape(c, ellPts(wx, wy, 22, 22, 24), K.wood, { seed: seed + 3, size: 'M', sh: 2, rough: 0.2 });
  shape(c, ellPts(wx, wy, 16, 16, 24), K.wallDark, { seed: seed + 4, size: 'S', flat: true, rough: 0.1 });
  c.save(); c.translate(wx, wy); c.strokeStyle = OLC; c.lineWidth = 3.4; c.lineCap = 'round'; for (i = 0; i < 4; i++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(-17, 0); c.lineTo(17, 0); c.stroke(); } c.strokeStyle = K.wood.base; c.lineWidth = 1.8; for (i = 0; i < 4; i++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(-17, 0); c.lineTo(17, 0); c.stroke(); } c.restore();
  for (i = 0; i < 8; i++) { var a = i / 8 * 6.28; shape(c, rrPts(wx + Math.cos(a) * 20 - 3, wy + Math.sin(a) * 20 - 2, 6, 4, 1), K.wood, { seed: seed + 8 + i, size: 'S', flat: true, rough: 0.1 }); }
  shape(c, ellPts(wx, wy, 4, 4, 8), K.brass, { seed: seed + 20, size: 'S', flat: true });
  addLight(x, y - 28, 44, P.accentHue, 90, 60, 0.35);
}
function waterfallObj(c, K, x, y, seed) {
  var R = rng(seed), i;
  longShadow(c, x, y, 60, 30); gshadow(c, x, y, 46, 8, 0.4);
  shape(c, [[x - 44, y], [x - 46, y - 60], [x - 36, y - 96], [x - 18, y - 104], [x, y - 98], [x + 18, y - 106], [x + 38, y - 94], [x + 46, y - 56], [x + 44, y]], K.rockC, { seed: seed, size: 'L', sh: 6, hl: 3, rough: 0.6 });
  shape(c, [[x + 18, y - 106], [x + 38, y - 94], [x + 46, y - 56], [x + 44, y], [x + 30, y - 30]], K.rockD, { seed: seed + 1, size: 'M', flat: true, rough: 0.5 });
  var wf = shape(c, [[x - 12, y - 98], [x + 12, y - 98], [x + 14, y - 6], [x - 14, y - 6]], M(196, 60, 70), { seed: seed + 2, size: 'S', sh: 1, hl: 1, flat: true, rough: 0.3 });
  c.save(); path(c, wf); c.clip();
  for (i = 0; i < 9; i++) { var sx = x - 11 + R() * 22; c.strokeStyle = 'rgba(255,255,255,' + (0.35 + R() * 0.4) + ')'; c.lineWidth = 1 + R() * 1.4; c.beginPath(); c.moveTo(sx, y - 98); c.lineTo(sx + (R() - 0.5) * 3, y - 6); c.stroke(); }
  c.restore();
  shape(c, blobPts(x - 30, y - 70, 12, 5, seed + 3, 8, 0.4), K.moss, { seed: seed + 4, size: 'S' }); shape(c, blobPts(x + 30, y - 84, 10, 4, seed + 5, 8, 0.4), K.moss, { seed: seed + 6, size: 'S' });
  for (i = 0; i < 5; i++) { c.save(); c.globalAlpha = 0.22; c.fillStyle = '#e8f4ff'; c.beginPath(); c.ellipse(x + (R() - 0.5) * 36, y - 6 - R() * 10, 12 + R() * 8, 6 + R() * 4, 0, 0, 7); c.fill(); c.restore(); }
  addLight(x, y - 10, 50, 196, 80, 70, 0.4);
}
function standingStone(c, K, x, y, seed) {
  var R = rng(seed);
  longShadow(c, x, y, 16, 20); gshadow(c, x, y, 14, 4, 0.4);
  var h = 44 + R() * 22;
  shape(c, [[x - 10, y], [x - 9, y - h * 0.7], [x - 4, y - h], [x + 5, y - h * 0.96], [x + 10, y - h * 0.6], [x + 11, y]], K.rockC, { seed: seed, size: 'M', sh: 4, hl: 2, rough: 0.4 });
  c.strokeStyle = 'hsla(' + P.accentHue.toFixed(0) + ',100%,72%,0.95)'; c.lineWidth = 1.3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - 2, y - h * 0.65); c.lineTo(x + 2, y - h * 0.5); c.lineTo(x - 1, y - h * 0.38); c.moveTo(x + 3, y - h * 0.7); c.lineTo(x + 3, y - h * 0.58); c.stroke();
  shape(c, blobPts(x - 3, y - 3, 10, 3, seed + 3, 8, 0.4), K.moss, { seed: seed + 4, size: 'S' });
  addLight(x, y - h * 0.55, 40 + 20 * P.glow, P.accentHue, 95, 66, 0.55);
}
function campfireObj(c, K, x, y, seed) {
  var i;
  gshadow(c, x, y, 20, 6, 0.4);
  for (i = 0; i < 8; i++) { var a = i / 8 * 6.28; shape(c, ellPts(x + Math.cos(a) * 12, y - 3 + Math.sin(a) * 5, 4, 3, 8), K.rockC, { seed: seed + i, size: 'S', sh: 1, rough: 0.3 }); }
  [[-8, -3, 0.5], [7, -4, -0.4]].forEach(function (l, k) { c.save(); c.translate(x + l[0], y + l[1]); c.rotate(l[2]); shape(c, rrPts(-10, -3, 20, 6, 3), K.wood, { seed: seed + 9 + k, size: 'S', sh: 1, rough: 0.3 }); c.restore(); });
  var fl = [[x - 6, y - 4], [x - 7, y - 14], [x - 2, y - 24], [x + 1, y - 14], [x + 3, y - 28], [x + 7, y - 12], [x + 7, y - 4]];
  shape(c, fl, M(24, 100, 52), { seed: seed + 20, size: 'S', flat: true, rough: 0.4 });
  shape(c, [[x - 3, y - 4], [x - 4, y - 11], [x, y - 17], [x + 3, y - 11], [x + 3, y - 4]], M(46, 100, 66), { seed: seed + 21, size: 'S', flat: true, rough: 0.3 });
  addLight(x, y - 12, 120 + 50 * P.glow, 28, 100, 58, 1);
}
function dockObj(c, K, x, y, seed) {
  var i;
  gshadow(c, x + 20, y - 4, 40, 6, 0.3);
  for (i = 0; i < 6; i++) shape(c, rrPts(x - 8 + i * 12, y - 12, 10, 24, 1.5), K.wood, { seed: seed + i, size: 'S', sh: 1, hl: 0.8, rough: 0.3 });
  [[-8, -12], [64, -12], [-8, 8], [64, 8]].forEach(function (p, k) { shape(c, rrPts(x + p[0] - 2, y + p[1] - 8, 5, 12, 1.5), K.wood, { seed: seed + 8 + k, size: 'S', sh: 1, rough: 0.2 }); });
}
function flowerBedObj(c, K, x, y, seed) {
  var R = rng(seed), i;
  for (i = 0; i < 9; i++) flower(c, K, x + (R() - 0.5) * 36, y + (R() - 0.5) * 12, seed * 3 + i);
}
function tallGrassObj(c, K, x, y, seed) {
  var R = rng(seed), i;
  for (i = 0; i < 16; i++) { var bx = x + (R() - 0.5) * 26, h = 12 + R() * 18, tip = [bx + (R() - 0.5) * 12, y - h]; line(c, curvePts([bx, y + (R() - 0.5) * 4], [bx + (R() - 0.5) * 6, y - h * 0.5], tip, 5), 1.7, (i % 3 ? K.leaf : K.leafD).base, false); if (i % 5 === 0) { c.fillStyle = K.spot.base; c.beginPath(); c.ellipse(tip[0], tip[1], 1.4, 2.2, 0, 0, 7); c.fill(); } }
}
function mushRing(c, K, x, y, seed) {
  var i;
  for (i = 0; i < 8; i++) { var a = i / 8 * 6.28; mushroom(c, K, x + Math.cos(a) * 26, y + Math.sin(a) * 10, 9 + (i % 3) * 3, seed + i); }
}


/* ---------------- abandoned factory props ---------------- */
function chairObj(c, K, x, y, seed) {
  gshadow(c, x, y, 11, 3.4, 0.35);
  [[-6, 0], [6, 0]].forEach(function (p, k) { shape(c, rrPts(x + p[0] - 1.6, y - 10, 3.2, 10, 1), K.wood, { seed: seed + k, size: 'S', flat: true, rough: 0.2 }); });
  shape(c, rrPts(x - 8, y - 14, 16, 5, 2), K.wood, { seed: seed + 2, size: 'S', sh: 1.2, rough: 0.3 });
  shape(c, rrPts(x - 8, y - 28, 16, 3.4, 1.5), K.wood, { seed: seed + 3, size: 'S', sh: 1, rough: 0.3 });
  [-6, 6].forEach(function (dx, k) { shape(c, rrPts(x + dx - 1.4, y - 28, 2.8, 15, 1), K.wood, { seed: seed + 4 + k, size: 'S', flat: true, rough: 0.2 }); });
}
function tableObj(c, K, x, y, seed) {
  gshadow(c, x, y, 28, 6, 0.4);
  [-20, 20].forEach(function (dx, k) { shape(c, rrPts(x + dx - 2.5, y - 18, 5, 18, 1.5), K.wood, { seed: seed + k, size: 'S', sh: 1, rough: 0.3 }); });
  shape(c, rrPts(x - 28, y - 26, 56, 10, 3), K.wood, { seed: seed + 2, size: 'M', sh: 2, rough: 0.3 });
  shape(c, [[x - 28, y - 26], [x - 20, y - 33], [x + 36, y - 33], [x + 28, y - 26]], K.wood, { seed: seed + 3, size: 'M', sh: 1.5, rough: 0.3 });
  shape(c, ellPts(x - 6, y - 30, 7, 2.4, 10), M(P.factoryHue, 8, 62), { seed: seed + 4, size: 'S', flat: true, rough: 0.1 });
}
function bannerObj(c, K, x, y, seed) {
  var torn = seed % 2 === 0, cl = M(mixHue(8, P.accentHue, 0.15), 50, 28);
  line(c, [[x - 18, y - 74], [x + 18, y - 74]], 3.4, K.brass.base, true);
  var pts = [[x - 16, y - 74], [x + 16, y - 74], [x + 16, y - 20], [x + 8, y - (torn ? 30 : 16)], [x, y - (torn ? 14 : 24)], [x - 8, y - (torn ? 24 : 16)], [x - 16, y - 20]];
  shape(c, pts, cl, { seed: seed, size: 'M', sh: 3, rough: 0.5 });
  c.strokeStyle = 'hsla(44,70%,58%,0.9)'; c.lineWidth = 1.4; c.beginPath(); c.arc(x, y - 52, 8, 0, 7); c.stroke();
  for (var i = 0; i < 8; i++) { var a = i / 8 * 6.28; c.beginPath(); c.moveTo(x + Math.cos(a) * 8, y - 52 + Math.sin(a) * 8); c.lineTo(x + Math.cos(a) * 11, y - 52 + Math.sin(a) * 11); c.stroke(); }
  c.fillStyle = 'hsla(44,70%,58%,0.9)'; c.beginPath(); c.arc(x, y - 52, 2.4, 0, 7); c.fill();
}
function gatePostObj(c, K, x, y, seed) {
  gshadow(c, x, y, 14, 4, 0.4);
  shape(c, rrPts(x - 9, y - 10, 18, 10, 3), K.ironLight, { seed: seed, size: 'S', sh: 1.5, rough: 0.2 });
  shape(c, rrPts(x - 6, y - 50, 12, 42, 3), K.wall, { seed: seed + 1, size: 'M', sh: 3, rough: 0.3 });
  shape(c, rrPts(x - 9, y - 56, 18, 8, 3), K.brass, { seed: seed + 2, size: 'S', sh: 1.5, rough: 0.2 });
  var gl = M(P.accentHue, 88, 68);
  shape(c, ellPts(x, y - 64, 6, 8, 14), gl, { seed: seed + 3, size: 'S', sh: 1.5, rough: 0.2 });
  c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',100%,90%,0.95)'; c.beginPath(); c.ellipse(x - 1.4, y - 65, 2, 3, 0, 0, 7); c.fill();
  addLight(x, y - 64, 90 + 40 * P.glow, P.accentHue, 92, 62, 0.9);
}
function gearBigObj(c, K, x, y, seed) {
  var pts = [], n = 14, i, r = 46;
  for (i = 0; i < n; i++) { var a = i / n * Math.PI * 2, da = Math.PI / n * 0.45; [[-da, 1], [-da * 0.7, 1.2], [da * 0.7, 1.2], [da, 1]].forEach(function (q) { pts.push([x + Math.cos(a + q[0]) * r * q[1], y - 12 + Math.sin(a + q[0]) * r * q[1] * 0.5]); }); }
  var d = shape(c, pts, K.rust, { seed: seed, size: 'M', sh: 4, rough: 0.5 });
  shape(c, ellPts(x, y - 12, 26, 13, 20), K.wallDark, { seed: seed + 1, size: 'S', flat: true, rough: 0.3 });
  shape(c, ellPts(x, y - 12, 9, 4.5, 12), K.rust, { seed: seed + 2, size: 'S', sh: 1, rough: 0.2 });
}
function steamVentObj(c, K, x, y, seed) {
  var i;
  shape(c, rrPts(x - 14, y - 6, 28, 8, 3), K.ironLight, { seed: seed, size: 'S', sh: 1.2, rough: 0.2 });
  for (i = 0; i < 5; i++) { c.fillStyle = K.floorA.shade; c.fillRect(x - 11 + i * 5, y - 4, 2, 4); }
  for (i = 0; i < 5; i++) { c.save(); c.globalAlpha = 0.24 - i * 0.04; c.fillStyle = 'hsl(' + P.factoryHue.toFixed(0) + ',12%,80%)'; c.beginPath(); c.ellipse(x + Math.sin(i * 1.4 + seed) * 5, y - 10 - i * 12, 7 + i * 3.4, 5 + i * 2.4, 0, 0, 7); c.fill(); c.restore(); }
}
function skylightObj(c, K, x, y, seed) {
  var g = c.createRadialGradient(x, y, 4, x, y, 120);
  g.addColorStop(0, 'hsla(' + (P.outsideHue - 20).toFixed(0) + ',60%,86%,0.55)'); g.addColorStop(0.6, 'hsla(' + P.outsideHue.toFixed(0) + ',50%,70%,0.2)'); g.addColorStop(1, 'hsla(' + P.outsideHue.toFixed(0) + ',50%,70%,0)');
  c.save(); c.translate(0, 0); c.scale(1, 0.55); c.fillStyle = g; c.beginPath(); c.arc(x, y / 0.55, 120, 0, 7); c.fill(); c.restore();
  addLight(x, y, 210, P.outsideHue - 10, 55, 80, 0.9);
}

function pickMat(R, K) { return [K.pipe, K.iron, K.wall, K.rust][Math.floor(R() * 4)]; }

function engineObj(c, K, x, y, seed) {
  var kind = seed % 6, R = rng(seed * 7 + 1), body = pickMat(R, K), i;
  if (kind === 0) { boiler(c, K, x, y, seed); return; }
  longShadow(c, x, y, 70, 40); gshadow(c, x, y, 52, 8, 0.4);
  if (kind === 1) {
    var w = 54 + R() * 16, h = 110 + R() * 30;
    shape(c, rrPts(x - w / 2, y - h, w, h - 2, 20), body, { seed: seed, size: 'L', sh: 6, rough: 0.2 });
    for (i = 0; i < 3; i++) shape(c, rrPts(x - w / 2 - 2, y - h * (0.2 + i * 0.28), w + 4, 7, 3), K.brass, { seed: seed + 1 + i, size: 'S', sh: 1.2, rough: 0.2 });
    shape(c, ribbon([[x - 6, y - h + 2], [x - 6, y - h - 28], [x + 18, y - h - 32]], 10, 10), K.pipe, { seed: seed + 5, size: 'S', sh: 2, rough: 0.2 });
    var hd = shape(c, [[x - 12, y - 4], [x - 12, y - 22], [x, y - 30], [x + 12, y - 22], [x + 12, y - 4]], K.wallDark, { seed: seed + 6, size: 'S', flat: true, rough: 0.2 });
    c.save(); path(c, hd); c.clip(); var g = c.createRadialGradient(x, y - 12, 2, x, y - 12, 18); g.addColorStop(0, 'hsla(48,100%,80%,1)'); g.addColorStop(1, 'hsla(14,90%,38%,0.9)'); c.fillStyle = g; c.fillRect(x - 14, y - 32, 28, 30); c.restore();
    shape(c, ellPts(x + w * 0.22, y - h * 0.62, 7, 7, 14), K.ironLight, { seed: seed + 7, size: 'S', sh: 1, rough: 0.1 });
    addLight(x, y - 14, 70 + 30 * P.glow, 26, 100, 58, 0.7);
  } else if (kind === 2) {
    shape(c, rrPts(x - 54, y - 12, 108, 12, 3), K.iron, { seed: seed, size: 'M', sh: 2, rough: 0.2 });
    shape(c, rrPts(x - 52, y - 46, 62, 32, 10), body, { seed: seed + 1, size: 'L', sh: 4, rough: 0.2 });
    shape(c, rrPts(x - 56, y - 52, 8, 44, 3), K.brass, { seed: seed + 2, size: 'S', sh: 1, rough: 0.2 });
    line(c, [[x + 10, y - 30], [x + 36, y - 34]], 4, K.ironLight.base, true);
    var fx = x + 40, fy = y - 34;
    shape(c, ellPts(fx, fy, 30, 30, 26), K.iron, { seed: seed + 3, size: 'M', sh: 3, rough: 0.2 });
    shape(c, ellPts(fx, fy, 22, 22, 24), K.wallDark, { seed: seed + 4, size: 'S', flat: true, rough: 0.1 });
    c.save(); c.translate(fx, fy); c.strokeStyle = OLC; c.lineWidth = 3.4; c.lineCap = 'round'; for (i = 0; i < 4; i++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(-24, 0); c.lineTo(24, 0); c.stroke(); } c.strokeStyle = K.iron.base; c.lineWidth = 1.8; for (i = 0; i < 4; i++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(-24, 0); c.lineTo(24, 0); c.stroke(); } c.restore();
    shape(c, ellPts(fx, fy, 5, 5, 8), K.brass, { seed: seed + 5, size: 'S', flat: true });
    shape(c, ribbon([[x - 30, y - 48], [x - 30, y - 74], [x - 10, y - 80]], 8, 8), K.pipe, { seed: seed + 6, size: 'S', sh: 2, rough: 0.2 });
  } else if (kind === 3) {
    var gw = 78 + R() * 20;
    shape(c, rrPts(x - gw / 2, y - 76, gw, 74, 8), body, { seed: seed, size: 'L', sh: 5, rough: 0.2 });
    for (i = 0; i < 5; i++) { c.fillStyle = K.floorA.shade; c.fillRect(x - gw / 2 + 8 + i * 4, y - 70, 2, 14); }
    var tubes = 3 + Math.floor(R() * 3), th = [P.accentHue, 190, 130][Math.floor(R() * 3)];
    for (i = 0; i < tubes; i++) { var tx = x - gw / 2 + 12 + i * (gw - 24) / (tubes - 1); shape(c, rrPts(tx - 4, y - 62, 8, 38, 4), M(th, 85, 60), { seed: seed + 2 + i, size: 'S', sh: 1.2, hl: 1, rough: 0.1 }); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(tx - 1.6, y - 58, 1.4, 22); }
    shape(c, rrPts(x - gw / 2 - 3, y - 22, gw + 6, 7, 3), K.brass, { seed: seed + 8, size: 'S', sh: 1.2, rough: 0.2 });
    line(c, curvePts([x + gw / 2, y - 12], [x + gw / 2 + 24, y - 6], [x + gw / 2 + 34, y - 18], 7), 4, K.wallDark.base, true);
    addLight(x, y - 44, 70 + 30 * P.glow, th, 90, 60, 0.7);
  } else if (kind === 4) {
    var cx = x, cy = y - 56, rr = 40 + R() * 8;
    shape(c, rrPts(x - 34, y - 14, 68, 14, 4), K.iron, { seed: seed, size: 'M', sh: 2, rough: 0.2 });
    shape(c, ellPts(cx, cy, rr, rr, 28), body, { seed: seed + 1, size: 'L', sh: 6, rough: 0.2 });
    shape(c, ellPts(cx, cy, rr * 0.78, rr * 0.78, 26), K.wallDark, { seed: seed + 2, size: 'S', flat: true, rough: 0.1 });
    c.save(); c.translate(cx, cy); c.lineJoin = 'round'; var nb = 8 + Math.floor(R() * 4); for (i = 0; i < nb; i++) { c.rotate(Math.PI * 2 / nb); c.beginPath(); c.moveTo(4, -2); c.lineTo(rr * 0.7, -6); c.lineTo(rr * 0.7, 3); c.closePath(); c.fillStyle = K.ironLight.base; c.fill(); c.lineWidth = 1; c.strokeStyle = OLC; c.stroke(); } c.restore();
    shape(c, ellPts(cx, cy, 8, 8, 12), K.brass, { seed: seed + 3, size: 'S', sh: 1.2, rough: 0.1 });
    shape(c, ribbon([[cx + rr * 0.6, cy - rr * 0.6], [cx + rr * 0.9, cy - rr - 10], [cx + rr * 0.5, cy - rr - 24]], 9, 9), K.pipe, { seed: seed + 4, size: 'S', sh: 2, rough: 0.2 });
  } else {
    shape(c, rrPts(x - 44, y - 14, 88, 14, 4), K.iron, { seed: seed, size: 'M', sh: 2, rough: 0.2 });
    [-1, 1].forEach(function (sd, k) { shape(c, rrPts(x + sd * 34 - 6, y - 100, 12, 90, 3), body, { seed: seed + 1 + k, size: 'M', sh: 3, rough: 0.2 }); });
    shape(c, rrPts(x - 46, y - 108, 92, 16, 4), K.iron, { seed: seed + 3, size: 'M', sh: 3, rough: 0.2 });
    var py = y - 40 - R() * 24;
    shape(c, rrPts(x - 6, y - 92, 12, py - (y - 92), 3), K.ironLight, { seed: seed + 4, size: 'S', sh: 1.5, rough: 0.2 });
    shape(c, rrPts(x - 30, py, 60, 12, 3), K.rust, { seed: seed + 5, size: 'M', sh: 2.5, rough: 0.2 });
    shape(c, rrPts(x - 28, y - 24, 56, 10, 3), K.wallDark, { seed: seed + 6, size: 'S', sh: 1.5, rough: 0.2 });
    shape(c, ellPts(x + 34, y - 70, 7, 7, 14), K.ironLight, { seed: seed + 7, size: 'S', sh: 1, rough: 0.1 });
    line(c, [[x + 34, y - 70], [x + 37, y - 74]], 1.4, C(P.accentHue, 85, 58), false);
  }
}
/* ---------------- floor decals ---------------- */
function decalPaint(c, kind, x, y, seed) {
  var R = rng(seed * 31 + 7), i, rx = 9 + R() * 16, ry = rx * (0.42 + R() * 0.2), rot = (R() - 0.5) * 1.1, sh = 'hsl(' + P.shadowHue.toFixed(0) + ',40%,7%)';
  c.save(); c.translate(x, y); c.rotate(rot);
  if (kind === 'oil' || kind === 'puddle') {
    var d = dens(blobPts(0, 0, rx, ry, seed, 22, 0.32), 3), g = c.createRadialGradient(0, 0, 1, 0, 0, rx);
    var tone = kind === 'oil' ? [10, 8, 18] : [14, 18, 36];
    g.addColorStop(0, 'rgba(' + tone[0] + ',' + tone[1] + ',' + tone[2] + ',' + (kind === 'oil' ? 0.62 : 0.5) + ')'); g.addColorStop(0.7, 'rgba(' + tone[0] + ',' + tone[1] + ',' + tone[2] + ',' + (kind === 'oil' ? 0.45 : 0.36) + ')'); g.addColorStop(1, 'rgba(' + tone[0] + ',' + tone[1] + ',' + tone[2] + ',0.0)');
    path(c, d); c.fillStyle = g; c.fill();
    c.globalAlpha = kind === 'oil' ? 0.22 : 0.3; c.strokeStyle = 'hsl(' + (200 + R() * 120).toFixed(0) + ',60%,70%)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(-rx * 0.15, -ry * 0.2, rx * 0.5, ry * 0.3, 0, 3.4, 5.6); c.stroke();
    if (kind === 'puddle') { c.strokeStyle = 'rgba(200,220,255,0.35)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(rx * 0.2, ry * 0.15, rx * 0.22, ry * 0.18, 0, 0, 7); c.stroke(); }
  } else if (kind === 'rust') {
    for (i = 0; i < 4; i++) { var sx = (R() - 0.5) * rx, len = ry * (1.4 + R() * 2.2); var g2 = c.createLinearGradient(sx, -ry, sx, len); g2.addColorStop(0, 'rgba(150,70,30,0.34)'); g2.addColorStop(1, 'rgba(150,70,30,0)'); c.fillStyle = g2; c.beginPath(); c.moveTo(sx - 2.6, -ry); c.lineTo(sx + 2.6, -ry); c.lineTo(sx + 1 + R() * 3, len); c.lineTo(sx - 1 - R() * 3, len); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(160,80,34,0.22)'; c.beginPath(); c.ellipse(0, -ry, rx * 0.5, ry * 0.5, 0, 0, 7); c.fill();
  } else if (kind === 'scorch') {
    var d2 = dens(blobPts(0, 0, rx, ry, seed + 4, 20, 0.4), 3), g3 = c.createRadialGradient(0, 0, 1, 0, 0, rx);
    g3.addColorStop(0, 'rgba(6,4,10,0.6)'); g3.addColorStop(0.65, 'rgba(6,4,10,0.38)'); g3.addColorStop(1, 'rgba(6,4,10,0)'); path(c, d2); c.fillStyle = g3; c.fill();
    c.strokeStyle = 'rgba(4,2,8,0.5)'; c.lineWidth = 0.9; for (i = 0; i < 3; i++) { var a = R() * 6.28; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * rx * 0.8, Math.sin(a) * ry * 0.8); c.stroke(); }
  } else if (kind === 'crack') {
    var px = -rx, py = (R() - 0.5) * ry; c.strokeStyle = 'rgba(4,3,10,0.55)'; c.lineWidth = 1; c.lineCap = 'round'; c.lineJoin = 'round';
    function branch(bx, by, ang, len, depth) { var cx = bx, cy = by, st = 4; c.beginPath(); c.moveTo(cx, cy); for (var s2 = 0; s2 < st; s2++) { ang += (R() - 0.5) * 0.9; cx += Math.cos(ang) * len / st; cy += Math.sin(ang) * len / st * 0.6; c.lineTo(cx, cy); if (depth < 2 && R() < 0.4) { c.stroke(); branch(cx, cy, ang + (R() < 0.5 ? 1 : -1) * 0.8, len * 0.5, depth + 1); c.beginPath(); c.moveTo(cx, cy); } } c.stroke(); }
    branch(px, py, 0.2 + (R() - 0.5), rx * 2, 0);
    c.strokeStyle = 'rgba(255,255,255,0.07)'; c.translate(0, 1.2); branch(px, py, 0.2, rx * 2, 2);
  } else if (kind === 'dust') {
    var g4 = c.createRadialGradient(0, 0, 1, 0, 0, rx * 1.2); g4.addColorStop(0, 'rgba(200,196,215,0.2)'); g4.addColorStop(1, 'rgba(200,196,215,0)'); c.fillStyle = g4; c.beginPath(); c.ellipse(0, 0, rx * 1.2, ry * 1.1, 0, 0, 7); c.fill();
  } else if (kind === 'moss') {
    for (i = 0; i < 5; i++) { var mx = (R() - 0.5) * rx * 1.4, my = (R() - 0.5) * ry * 1.2, mr = 3 + R() * 5, gm = c.createRadialGradient(mx, my, 0, mx, my, mr); gm.addColorStop(0, 'hsla(' + (P.outsideHue - 6) + ',45%,32%,0.55)'); gm.addColorStop(1, 'hsla(' + (P.outsideHue - 6) + ',45%,32%,0)'); c.fillStyle = gm; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill(); }
  }
  c.restore();
}
function emblemPaint(c, kind, x, y, r) {
  c.save(); c.translate(x, y); c.scale(1, 0.62); c.lineJoin = 'round';
  c.strokeStyle = 'rgba(0,0,0,0.34)'; c.lineWidth = 3; c.fillStyle = 'rgba(210,170,90,0.07)';
  if (kind === 'gear') { var n = 16, pts = [], i; for (i = 0; i < n; i++) { var a = i / n * Math.PI * 2, da = Math.PI / n * 0.45; [[-da, 1], [-da * 0.7, 1.16], [da * 0.7, 1.16], [da, 1]].forEach(function (q) { pts.push([Math.cos(a + q[0]) * r * q[1], Math.sin(a + q[0]) * r * q[1]]); }); } c.beginPath(); pts.forEach(function (p, k) { if (k) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.fill(); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r * 0.62, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.2, 0, 7); c.stroke(); for (i = 0; i < 6; i++) { var b = i / 6 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(b) * r * 0.22, Math.sin(b) * r * 0.22); c.lineTo(Math.cos(b) * r * 0.6, Math.sin(b) * r * 0.6); c.stroke(); } }
  else { c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r * 0.7, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.4, 0, 7); c.stroke(); }
  c.restore();
}


/* ---------------- industrial walls and lamps ---------------- */
function wallPiece(c, K, s, face) {
  var q = Math.round((s - 3) / 7), v = q % 3, f = Math.floor(q / 3), eL = !!(f & 1), eR = !!(f & 2), eN = !!(f & 4), H = 56, R = rng(q * 5 + 3), x0 = -16, x1 = 16, i, k;
  var ln = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,8%,0.85)', lw = ow('M') * 0.9, capTop = -H - 24;
  function vline(x, y0, y1) { c.strokeStyle = ln; c.lineWidth = lw; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); }
  function hline(y, xa, xb) { c.strokeStyle = ln; c.lineWidth = lw; c.beginPath(); c.moveTo(xa, y); c.lineTo(xb, y); c.stroke(); }
  function rivet(rx, ry) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.arc(rx, ry, 1.3, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.arc(rx - 0.4, ry - 0.4, 0.5, 0, 7); c.fill(); }
  if (face) {
    var g = c.createLinearGradient(0, -H, 0, 0); g.addColorStop(0, K.wall.hl); g.addColorStop(0.25, K.wall.base); g.addColorStop(1, K.wallDark.base);
    c.fillStyle = g; c.fillRect(x0, -H, 32, H);
    for (i = 0; i < 8; i++) { c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(x0 + i * 4 + 2.4, -H, 1.4, H - 9); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(x0 + i * 4, -H, 1.2, H - 9); }
    c.fillStyle = K.wallDark.shade; c.fillRect(x0, -9, 32, 9); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x0, -9, 32, 1.3);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x0, -H * 0.52, 32, 1.4); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x0, -H * 0.52 + 1.4, 32, 1);
    for (i = 0; i < 4; i++) { rivet(x0 + 4 + i * 8, -H + 7); rivet(x0 + 4 + i * 8, -13); }
    for (i = 0; i < 3; i++) { var sx = x0 + 3 + R() * 26, len = 14 + R() * 30, rg = c.createLinearGradient(0, -H, 0, -H + len); rg.addColorStop(0, 'rgba(150,70,30,0.3)'); rg.addColorStop(1, 'rgba(150,70,30,0)'); c.fillStyle = rg; c.fillRect(sx, -H, 2 + R() * 2.4, len); }
    if (v === 1) {
      [0.66, 0.82].forEach(function (fr, kk) {
        var py = -H * fr, pg = c.createLinearGradient(0, py - 3.5, 0, py + 3.5); pg.addColorStop(0, K.pipe.hl); pg.addColorStop(0.5, K.pipe.base); pg.addColorStop(1, K.pipe.shade);
        c.fillStyle = pg; c.fillRect(x0, py - 3.5, 32, 7); hline(py - 3.5, x0, x1); hline(py + 3.5, x0, x1);
        [-10, 10].forEach(function (bx) { c.fillStyle = K.iron.base; c.fillRect(bx - 2, py - 5, 4, 10); c.strokeStyle = ln; c.lineWidth = 0.8; c.strokeRect(bx - 2, py - 5, 4, 10); });
      });
    } else if (v === 2) {
      c.fillStyle = K.wallDark.shade; c.fillRect(-8, -H * 0.62, 16, 11); c.strokeStyle = ln; c.lineWidth = 1; c.strokeRect(-8, -H * 0.62, 16, 11);
      for (k = 0; k < 4; k++) { c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(-6, -H * 0.62 + 1.5 + k * 2.4, 12, 1.2); }
      rivet(-8, -H * 0.62 - 3); rivet(8, -H * 0.62 - 3);
    }
    var gg = c.createLinearGradient(0, -16, 0, 0); gg.addColorStop(0, 'rgba(5,3,12,0)'); gg.addColorStop(1, 'rgba(5,3,12,0.5)'); c.fillStyle = gg; c.fillRect(x0, -16, 32, 16);
    c.fillStyle = ln; c.fillRect(x0, -1.2, 32, 1.3);
    if (eL) vline(x0, -H, 0); if (eR) vline(x1, -H, 0);
  }
  var cg = c.createLinearGradient(0, capTop, 0, -H); cg.addColorStop(0, K.iron.hl); cg.addColorStop(1, K.iron.base);
  c.fillStyle = cg; c.fillRect(x0, capTop, 32, 24);
  c.fillStyle = 'rgba(0,0,0,0.14)'; c.fillRect(x0 + 8, capTop, 1.2, 24); c.fillRect(x1 - 9, capTop, 1.2, 24);
  if (v === 1) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x0, capTop + 11.5, 32, 1.1); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(x0, capTop + 12.6, 32, 0.9); }
  for (i = 0; i < 2; i++) { rivet(x0 + 3.4, capTop + 6 + i * 12); rivet(x1 - 3.4, capTop + 6 + i * 12); }
  for (i = 0; i < 2; i++) { var rx2 = x0 + 6 + R() * 20, ry2 = capTop + 3 + R() * 16; c.fillStyle = 'rgba(150,70,30,0.12)'; c.beginPath(); c.ellipse(rx2, ry2, 3 + R() * 5, 2 + R() * 3, 0, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(0,0,0,0.38)'; c.fillRect(x0, -H - 1.4, 32, 1.5);
  if (eL) vline(x0, capTop, -H); if (eR) vline(x1, capTop, -H); if (eN) hline(capTop + 0.5, x0, x1);
}
function wallColObj(c, K, x, y, seed) {
  var H = 62, w = 7, i;
  function fill(g, x0, y0, ww, hh) { c.fillStyle = g; c.fillRect(x0, y0, ww, hh); }
  var bg = c.createLinearGradient(x - w, 0, x + w, 0); bg.addColorStop(0, K.iron.hl); bg.addColorStop(0.5, K.iron.base); bg.addColorStop(1, K.iron.shade);
  fill(bg, x - w, y - H, w * 2, H); c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,8%,0.85)'; c.lineWidth = ow('M') * 0.9; c.strokeRect(x - w, y - H, w * 2, H);
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x - 1.5, y - H + 3, 3, H - 8);
  [[-H - 1, 5], [-9, 9]].forEach(function (fl) { fill(K.ironLight.base, x - w - 3, y + fl[0], w * 2 + 6, fl[1]); c.strokeRect(x - w - 3, y + fl[0], w * 2 + 6, fl[1]); });
  for (i = 0; i < 3; i++) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.arc(x - w - 1, y - 9 + 4, 1.1, 0, 7); c.arc(x + w + 1, y - 9 + 4, 1.1, 0, 7); c.fill(); }
  var rg = c.createLinearGradient(0, y - H, 0, y - H + 30); rg.addColorStop(0, 'rgba(150,70,30,0.32)'); rg.addColorStop(1, 'rgba(150,70,30,0)'); c.fillStyle = rg; c.fillRect(x - w + 1, y - H, w * 2 - 2, 30);
}
function pendantObj(c, K, x, y, seed) {
  var i, ly = -118, hh = P.accentHue, top = -208;
  for (i = top; i < ly - 14; i += 8) { c.beginPath(); c.ellipse(x + Math.sin(i * 0.3) * 0.4, y + i + 4, 2, 3.6, 0, 0, 7); c.lineWidth = 2; c.strokeStyle = OLC; c.stroke(); c.lineWidth = 1; c.strokeStyle = K.iron.base; c.stroke(); }
  shape(c, rrPts(x - 4, y + ly - 18, 8, 6, 2), K.iron, { seed: seed, size: 'S', sh: 1, rough: 0.1 });
  shape(c, [[x - 6, y + ly - 12], [x + 6, y + ly - 12], [x + 22, y + ly + 8], [x - 22, y + ly + 8]], M(P.factoryHue, 16, 24), { seed: seed + 1, size: 'M', sh: 3, hl: 2, rough: 0.1 });
  shape(c, ellPts(x, y + ly + 8, 22, 4.4, 20), K.ironLight, { seed: seed + 2, size: 'S', sh: 1, rough: 0.1 });
  c.save(); c.beginPath(); c.ellipse(x, y + ly + 8, 21, 4, 0, 0, 7); c.clip(); var gb = c.createRadialGradient(x, y + ly + 8, 1, x, y + ly + 8, 18); gb.addColorStop(0, 'hsla(' + (hh + 10).toFixed(0) + ',100%,92%,1)'); gb.addColorStop(1, 'hsla(' + hh.toFixed(0) + ',100%,66%,0.5)'); c.fillStyle = gb; c.fillRect(x - 22, y + ly + 3, 44, 10); c.restore();
  c.strokeStyle = K.iron.base; c.lineWidth = 0.9; for (i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * 6, y + ly + 8); c.lineTo(x + i * 4, y + ly + 14); c.stroke(); }
  c.beginPath(); c.ellipse(x, y + ly + 15, 8, 3.6, 0, 0, 7); c.fillStyle = 'hsla(' + hh.toFixed(0) + ',100%,88%,0.95)'; c.fill();
  addLight(x, y + ly + 14, 56, hh, 92, 64, 0.8);
  addLight(x, y - 2, 160 + 30 * P.glow, hh, 78, 62, 0.62);
}
function wallLampObj(c, K, x, y, seed) {
  var hh = P.accentHue;
  shape(c, rrPts(x - 6, y - 72, 12, 16, 3), K.iron, { seed: seed, size: 'S', sh: 1.5, rough: 0.2 });
  line(c, [[x, y - 64], [x, y - 58]], 3, K.iron.base, true);
  shape(c, [[x - 8, y - 58], [x + 8, y - 58], [x + 6, y - 48], [x - 6, y - 48]], M(hh, 80, 66), { seed: seed + 1, size: 'S', sh: 1, hl: 1.2, rough: 0.1 });
  c.strokeStyle = K.iron.base; c.lineWidth = 0.9; for (var i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * 3.2, y - 58); c.lineTo(x + i * 2.4, y - 48); c.stroke(); }
  c.beginPath(); c.ellipse(x, y - 53, 3.6, 4.4, 0, 0, 7); c.fillStyle = 'hsla(' + hh.toFixed(0) + ',100%,90%,0.95)'; c.fill();
  addLight(x, y - 52, 46, hh, 92, 64, 0.7);
  addLight(x, y + 24, 105 + 20 * P.glow, hh, 78, 62, 0.52);
}

/* ---------------- Factory kit: more pieces ---------------- */
function conveyor(c, K, x, y, len0, seed) {
  var R = rng(seed), len = 70 + Math.floor(R() * 4) * 20, i, legs = Math.max(2, Math.round(len / 38)), cargo = R();
  gshadow(c, x, y, len * 0.55, 5, 0.4);
  for (i = 0; i < legs; i++) shape(c, rrPts(x - len / 2 + 6 + i * (len - 12) / (legs - 1) - 4, y - 18, 8, 18, 2), K.iron, { seed: seed + i, size: 'S', sh: 1.5, rough: 0.2 });
  shape(c, rrPts(x - len / 2 - 4, y - 26, len + 8, 12, 5), K.iron, { seed: seed + 5, size: 'M', sh: 2, rough: 0.2 });
  var belt = shape(c, rrPts(x - len / 2, y - 30, len, 8, 4), K.wallDark, { seed: seed + 6, size: 'S', sh: 1, flat: false, rough: 0.2 });
  c.save(); path(c, belt); c.clip(); c.strokeStyle = R() < 0.5 ? 'hsla(' + P.accentHue.toFixed(0) + ',80%,62%,0.7)' : 'rgba(150,140,170,0.5)'; c.lineWidth = 1.6; for (i = 0; i < len; i += 12) { c.beginPath(); c.moveTo(x - len / 2 + i, y - 31); c.lineTo(x - len / 2 + i + 4, y - 26); c.lineTo(x - len / 2 + i, y - 22); c.stroke(); } c.restore();
  [-1, 1].forEach(function (sd, k) { shape(c, ellPts(x + sd * (len / 2), y - 26, 9, 9, 14), K.ironLight, { seed: seed + 7 + k, size: 'S', sh: 1.5, rough: 0.2 }); shape(c, ellPts(x + sd * (len / 2), y - 26, 3.5, 3.5, 8), K.brass, { seed: seed + 9 + k, size: 'S', flat: true }); });
  if (cargo < 0.45) { crate(c, K, x - len * 0.2, y - 30, 20, seed + 11, 0); if (R() < 0.6) crate(c, K, x + len * 0.18, y - 30, 16, seed + 12, 0.05 * P.twist); }
  else if (cargo < 0.75) { for (i = 0; i < 3; i++) shape(c, rrPts(x - len * 0.25 + i * 12, y - 40, 9, 11, 4), i % 2 ? K.pipe : K.rust, { seed: seed + 13 + i, size: 'S', sh: 1.5, rough: 0.2 }); }
}

function vat(c, K, x, y, seed) {
  var R = rng(seed), i, w = 46 + Math.floor(R() * 4) * 7, h = 66 + Math.floor(R() * 4) * 12, rd = 16 + R() * 10;
  var hues = [P.accentHue, P.outsideHue, 190, 285, 12], hue = hues[Math.floor(R() * hues.length)], empty = R() < 0.3, legs = R() < 0.6, dome = R() < 0.5, body = pickMat(R, K);
  longShadow(c, x, y, w * 0.8, h * 0.4); gshadow(c, x, y, w * 0.68, 6, 0.4);
  if (legs) [-1, 1].forEach(function (sd, k) { shape(c, rrPts(x + sd * (w / 2 - 6) - 4, y - 12, 8, 14, 2), K.iron, { seed: seed + k, size: 'S', rough: 0.2 }); });
  var top = y - (legs ? 10 : 2);
  shape(c, rrPts(x - w / 2, top - h, w, h, rd), body, { seed: seed + 2, size: 'L', sh: 5, rough: 0.2 });
  if (dome) shape(c, ellPts(x, top - h + 1, w * 0.42, 9, 18), K.ironLight, { seed: seed + 3, size: 'M', sh: 2, rough: 0.2 }); else shape(c, rrPts(x - w * 0.4, top - h - 6, w * 0.8, 8, 3), K.ironLight, { seed: seed + 3, size: 'M', sh: 2, rough: 0.2 });
  var wy = top - h * (0.45 + R() * 0.1), wr = Math.min(w * 0.34, 20);
  shape(c, ellPts(x, wy, wr, wr * 1.1, 20), K.ironLight, { seed: seed + 4, size: 'M', sh: 2, rough: 0.1 });
  c.save(); c.beginPath(); c.ellipse(x, wy, wr * 0.78, wr * 0.86, 0, 0, 7); c.clip();
  if (empty) { c.fillStyle = 'hsl(250,30%,8%)'; c.fillRect(x - wr, wy - wr, wr * 2, wr * 2); c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - wr * 0.5, wy - wr * 0.6); c.lineTo(x + wr * 0.1, wy); c.lineTo(x - wr * 0.2, wy + wr * 0.7); c.stroke(); }
  else { var g = c.createLinearGradient(x, wy - wr, x, wy + wr); g.addColorStop(0, 'hsla(' + hue.toFixed(0) + ',90%,72%,0.95)'); g.addColorStop(1, 'hsl(' + hue.toFixed(0) + ',70%,36%)'); c.fillStyle = g; c.fillRect(x - wr, wy - wr, wr * 2, wr * 2); for (i = 0; i < 6; i++) { c.fillStyle = 'rgba(255,255,255,0.65)'; c.beginPath(); c.arc(x - wr * 0.6 + R() * wr * 1.2, wy - wr * 0.7 + R() * wr * 1.4, 1 + R() * 1.8, 0, 7); c.fill(); } }
  c.restore(); c.beginPath(); c.ellipse(x, wy, wr * 0.78, wr * 0.86, 0, 0, 7); c.lineWidth = ow('S'); c.strokeStyle = OLC; c.stroke();
  var nb = 2 + Math.floor(R() * 2); for (i = 0; i < nb; i++) shape(c, rrPts(x - w / 2 - 2, top - h * (0.15 + i * 0.3) - 3, w + 4, 6, 3), K.brass, { seed: seed + 6 + i, size: 'S', sh: 1.2, rough: 0.2 });
  var side = R() < 0.5 ? -1 : 1; shape(c, ribbon([[x + side * w * 0.2, top - h - 8], [x + side * w * 0.2, top - h - 26 - R() * 14], [x + side * (w * 0.2 + 22), top - h - 30 - R() * 10]], 8, 8), K.pipe, { seed: seed + 9, size: 'S', sh: 2, rough: 0.2 });
  if (R() < 0.5) { line(c, [[x + w / 2 + 3, y - 6], [x + w / 2 + 3, top - h + 10]], 2.2, K.iron.base, true); for (i = 0; i < 6; i++) line(c, [[x + w / 2 + 1, top - 10 - i * (h - 16) / 6], [x + w / 2 + 6, top - 10 - i * (h - 16) / 6]], 1.4, K.iron.base, false); }
  if (!empty) addLight(x, wy, 60 + 36 * P.glow, hue, 90, 60, 0.7);
}

function workbench(c, K, x, y, w0, seed) {
  var R = rng(seed), w = 56 + Math.floor(R() * 3) * 10, tool = Math.floor(R() * 4), wood = R() < 0.5 ? K.wood : K.crate;
  gshadow(c, x, y, w * 0.6, 5, 0.4);
  [-1, 1].forEach(function (sd, k) { shape(c, rrPts(x + sd * (w / 2 - 6) - 3, y - 26, 7, 26, 2), wood, { seed: seed + k, size: 'S', sh: 1.5, rough: 0.3 }); });
  shape(c, rrPts(x - w / 2, y - 34, w, 12, 3), wood, { seed: seed + 2, size: 'M', sh: 2, rough: 0.3 });
  shape(c, [[x - w / 2, y - 34], [x - w / 2 + 10, y - 42], [x + w / 2 + 10, y - 42], [x + w / 2, y - 34]], wood, { seed: seed + 3, size: 'M', sh: 1.5, rough: 0.3 });
  if (R() < 0.7) shape(c, rrPts(x - 10, y - 31, 20, 6, 2), K.iron, { seed: seed + 4, size: 'S', flat: true });
  if (tool === 0) { line(c, [[x - w / 2 + 12, y - 42], [x - w / 2 + 24, y - 54]], 3, K.wood.base, true); shape(c, rrPts(x - w / 2 + 19, y - 59, 12, 6, 2), K.iron, { seed: seed + 5, size: 'S', sh: 1, rough: 0.2 }); }
  else if (tool === 1) { shape(c, rrPts(x - w / 2 + 8, y - 48, 12, 8, 2), K.iron, { seed: seed + 5, size: 'S', sh: 1, rough: 0.2 }); shape(c, rrPts(x - w / 2 + 11, y - 56, 6, 10, 2), K.ironLight, { seed: seed + 6, size: 'S', sh: 1, rough: 0.2 }); }
  else if (tool === 2) gear(c, K, x - w / 2 + 16, y - 46, 5, seed + 5, 8, K.brass);
  if (R() < 0.6) gear(c, K, x + 4, y - 46, 5, seed + 6, 8, K.brass);
  if (R() < 0.55) { var gl = M(P.accentHue, 88, 62); shape(c, [[x + w / 2 - 12, y - 42], [x + w / 2 - 6, y - 42], [x + w / 2 - 4, y - 52], [x + w / 2 - 10, y - 55], [x + w / 2 - 14, y - 52]], gl, { seed: seed + 7, size: 'S', sh: 1, rough: 0.2 }); addLight(x + w / 2 - 9, y - 50, 34 + 22 * P.glow, P.accentHue, 92, 62, 0.6); }
}

function shelfUnit(c, K, x, y, w0, h0, seed) {
  var R = rng(seed), i, k, w = 50 + Math.floor(R() * 3) * 8, h = 70 + Math.floor(R() * 3) * 10, rows = 3 + Math.floor(R() * 2), frame = R() < 0.5 ? K.iron : K.wood;
  gshadow(c, x, y, w * 0.55, 4, 0.35);
  [-1, 1].forEach(function (sd, j) { shape(c, rrPts(x + sd * (w / 2 - 3) - 3, y - h, 6, h, 2), frame, { seed: seed + j, size: 'S', sh: 1.5, rough: 0.2 }); });
  for (i = 0; i < rows; i++) {
    var sy = y - 6 - i * (h / (rows + 0.1));
    shape(c, rrPts(x - w / 2, sy, w, 5, 2), K.wood, { seed: seed + 5 + i, size: 'S', sh: 1, rough: 0.3 });
    var items = 2 + Math.floor(R() * 3);
    for (k = 0; k < items; k++) {
      var ix2 = x - w / 2 + 8 + k * (w - 16) / Math.max(1, items - 1), t = Math.floor(R() * 4);
      if (R() < 0.25) continue;
      if (t === 0) shape(c, rrPts(ix2 - 5, sy - 11, 10, 11, 2), K.crate, { seed: seed + 20 + i * 5 + k, size: 'S', sh: 1, rough: 0.2 });
      else if (t === 1) { var bm = M(mixHue(P.accentHue, R() * 120, 0.5), 70, 52); shape(c, [[ix2 - 4, sy], [ix2 + 4, sy], [ix2 + 5, sy - 8], [ix2 + 2, sy - 11], [ix2 + 2, sy - 15], [ix2 - 2, sy - 15], [ix2 - 2, sy - 11], [ix2 - 5, sy - 8]], bm, { seed: seed + 30 + i * 5 + k, size: 'S', sh: 1, hl: 0.8, rough: 0.1 }); }
      else if (t === 2) gear(c, K, ix2, sy - 6, 5.5, seed + 40 + i * 5 + k, 8, R() < 0.5 ? K.brass : K.rust);
      else shape(c, rrPts(ix2 - 6, sy - 7, 12, 7, 2), K.rust, { seed: seed + 50 + i * 5 + k, size: 'S', sh: 1, rough: 0.3 });
    }
  }
}

function furnace(c, K, x, y, seed) {
  var R = rng(seed), i, w = 66 + Math.floor(R() * 4) * 8, h = 54 + Math.floor(R() * 3) * 8, body = R() < 0.5 ? K.wall : K.rockC, glowH = [24, 30, 46, 14][Math.floor(R() * 4)], twin = R() < 0.3, side = R() < 0.5 ? -1 : 1;
  longShadow(c, x, y, w * 0.9, 40); gshadow(c, x, y, w * 0.55, 6, 0.4);
  shape(c, ribbon([[x + side * w * 0.3, y - h + 4], [x + side * (w * 0.32 + 2), y - h - 40 - R() * 30], [x + side * (w * 0.3 - 4), y - h - 80 - R() * 30]], 16, 11), K.iron, { seed: seed + 9, size: 'M', sh: 3, rough: 0.2 });
  shape(c, rrPts(x - w / 2, y - h, w, h, 10), body, { seed: seed, size: 'L', sh: 5, rough: 0.2 });
  var doors = twin ? [-w * 0.22, w * 0.22] : [0];
  doors.forEach(function (dx, k) {
    var dw = twin ? 12 : 18, mouth = [[x + dx - dw, y - 4], [x + dx - dw, y - 30], [x + dx - dw * 0.55, y - 42], [x + dx, y - 46], [x + dx + dw * 0.55, y - 42], [x + dx + dw, y - 30], [x + dx + dw, y - 4]];
    var d = shape(c, mouth, K.wallDark, { seed: seed + 1 + k, size: 'M', flat: true, rough: 0.2 });
    c.save(); path(c, d); c.clip();
    var g = c.createRadialGradient(x + dx, y - 14, 2, x + dx, y - 16, 34); g.addColorStop(0, 'hsla(' + (glowH + 22) + ',100%,82%,1)'); g.addColorStop(0.35, 'hsla(' + glowH + ',100%,58%,0.95)'); g.addColorStop(1, 'hsla(' + (glowH - 16) + ',90%,34%,0.9)'); c.fillStyle = g; c.fillRect(x + dx - dw - 2, y - 48, dw * 2 + 4, 46);
    c.restore(); path(c, d); c.lineWidth = ow('M'); c.strokeStyle = OLC; c.stroke();
    addLight(x + dx, y - 20, 90 + 40 * P.glow, glowH, 100, 58, 0.9);
  });
  for (i = 0; i < 4; i++) { c.fillStyle = 'hsla(' + (glowH + 14) + ',100%,75%,0.9)'; c.beginPath(); c.arc(x - w * 0.2 + R() * w * 0.4, y - 30 - R() * 40, 1 + R() * 1.2, 0, 7); c.fill(); }
  shape(c, rrPts(x - w / 2 - 2, y - h - 2, w + 4, 8, 3), K.brass, { seed: seed + 2, size: 'S', sh: 1.5, rough: 0.2 });
  shape(c, rrPts(x - 24, y - 3, 48, 6, 3), K.iron, { seed: seed + 3, size: 'S', rough: 0.2 });
}

function valvePipe(c, K, x, y, h, seed) {
  var i;
  gshadow(c, x, y, 14, 3.5, 0.3);
  var pts = [[x, y], [x, y - h * 0.5], [x + 4, y - h * 0.5 - 8], [x + 22, y - h * 0.5 - 8], [x + 26, y - h * 0.5 - 16], [x + 26, y - h]];
  shape(c, ribbon(dens2(pts, 8), 11, 11), K.pipe, { seed: seed, size: 'M', sh: 3, rough: 0.2 });
  [0.15, 0.85].forEach(function (f, k) { var p = pts[f < 0.5 ? 0 : 5]; shape(c, rrPts(p[0] - 9, (f < 0.5 ? y - 14 : y - h + 8), 18, 7, 3), K.brass, { seed: seed + 3 + k, size: 'S', sh: 1.2, rough: 0.2 }); });
  var vx = x + 13, vy = y - h * 0.5 - 8;
  shape(c, ellPts(vx, vy, 9, 9, 16), K.iron, { seed: seed + 6, size: 'S', sh: 1.5, rough: 0.1 });
  c.save(); c.translate(vx, vy); c.strokeStyle = OLC; c.lineWidth = 3.4; c.lineCap = 'round'; for (i = 0; i < 3; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-10, 0); c.lineTo(10, 0); c.stroke(); } c.strokeStyle = K.brass.base; c.lineWidth = 1.8; for (i = 0; i < 3; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-10, 0); c.lineTo(10, 0); c.stroke(); } c.restore();
  shape(c, ellPts(vx, vy, 3.4, 3.4, 8), K.brass, { seed: seed + 7, size: 'S', flat: true });
}
function stairs(c, K, x, y, seed) {
  var i, n = 6, sw = 16, sh = 9;
  gshadow(c, x + 26, y, 46, 5, 0.35);
  for (i = n - 1; i >= 0; i--) { shape(c, rrPts(x + i * sw, y - (i + 1) * sh, sw + 2, (i + 1) * sh, 2), K.iron, { seed: seed + i, size: 'S', sh: 1.5, rough: 0.2 }); shape(c, rrPts(x + i * sw - 2, y - (i + 1) * sh - 3, sw + 4, 4, 2), K.ironLight, { seed: seed + 10 + i, size: 'S', sh: 0.8, rough: 0.2 }); }
  for (i = 0; i <= n; i += 2) line(c, [[x + i * sw + 4, y - (i + 1) * sh - 3], [x + i * sw + 4, y - (i + 1) * sh - 24]], 3, K.brass.base, true);
  line(c, [[x + 4, y - sh - 24], [x + n * sw + 4, y - (n + 1) * sh - 24]], 3, K.brass.base, true);
}
function hangingLamp(c, K, x, yTop, len, seed) {
  var i, hh = P.accentHue;
  for (i = 0; i < len; i += 7) { c.beginPath(); c.ellipse(x + Math.sin(i * 0.2) * P.twist, yTop + i + 3, 2.2, 3.4, 0, 0, 7); c.lineWidth = 1.7; c.strokeStyle = OLC; c.stroke(); c.strokeStyle = K.iron.base; c.lineWidth = 0.9; c.stroke(); }
  var ly = yTop + len;
  shape(c, [[x - 4, ly], [x + 4, ly], [x + 16, ly + 14], [x - 16, ly + 14]], K.iron, { seed: seed, size: 'S', sh: 1.5, rough: 0.2 });
  shape(c, ellPts(x, ly + 15, 8, 6, 12), M(hh, 90, 74), { seed: seed + 1, size: 'S', flat: true });
  c.fillStyle = 'hsla(' + hh.toFixed(0) + ',100%,92%,0.95)'; c.beginPath(); c.ellipse(x, ly + 15, 4, 3, 0, 0, 7); c.fill();
  addLight(x, ly + 16, 100 + 50 * P.glow, hh, 92, 62, 1);
}
function consolePanel(c, K, x, y, seed) {
  var R = rng(seed), i, w = 52 + Math.floor(R() * 4) * 8, h = 38 + Math.floor(R() * 3) * 6, screens = 1 + Math.floor(R() * 3), lev = 2 + Math.floor(R() * 3), lamp = [P.accentHue, 130, 8, 200][Math.floor(R() * 4)], body = R() < 0.5 ? K.wall : K.pipe;
  gshadow(c, x, y, w * 0.55, 5, 0.4);
  shape(c, rrPts(x - w / 2, y - h, w, h, 6), body, { seed: seed, size: 'M', sh: 3, rough: 0.2 });
  for (i = 0; i < screens; i++) {
    var sw = Math.min(22, (w - 14) / screens - 3), sx = x - w / 2 + 6 + i * (sw + 4);
    shape(c, rrPts(sx, y - h + 5, sw, 14, 3), K.wallDark, { seed: seed + 1 + i, size: 'S', flat: true, rough: 0.1 });
    c.fillStyle = 'hsla(' + lamp.toFixed(0) + ',90%,62%,0.5)'; c.fillRect(sx + 2, y - h + 7, sw - 4, 10);
    c.strokeStyle = 'hsla(' + lamp.toFixed(0) + ',100%,85%,0.9)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(sx + 3, y - h + 14); c.lineTo(sx + sw * 0.4, y - h + 9); c.lineTo(sx + sw * 0.6, y - h + 15); c.lineTo(sx + sw - 3, y - h + 10); c.stroke();
  }
  for (i = 0; i < lev; i++) { var lx = x - w / 2 + 8 + i * (w - 16) / Math.max(1, lev - 1), tilt = (R() - 0.5) * 8; line(c, [[lx, y - 12], [lx + tilt, y - 24]], 3, K.iron.base, true); c.beginPath(); c.arc(lx + tilt, y - 25, 3, 0, 7); c.fillStyle = i % 2 ? K.brass.base : C(lamp, 85, 60); c.fill(); c.lineWidth = ow('S') * 0.7; c.strokeStyle = OLC; c.stroke(); }
  for (i = 0; i < 2; i++) { c.beginPath(); c.arc(x + w / 2 - 9 - i * 9, y - h + 28, 3.4, 0, 7); c.fillStyle = [K.brass.base, C(lamp, 85, 60)][i]; c.fill(); c.lineWidth = ow('S') * 0.8; c.strokeStyle = OLC; c.stroke(); }
  if (R() < 0.5) gear(c, K, x - w / 2 + 10, y - 7, 4.6, seed + 4, 8, K.brass);
  addLight(x, y - h + 12, 26 + 10 * P.glow, lamp, 85, 60, 0.3);
}

function cableCoil(c, K, x, y, seed) {
  gshadow(c, x, y, 22, 6, 0.35);
  [0, 1, 2].forEach(function (i) { var r = 18 - i * 4.5; c.beginPath(); c.ellipse(x, y - i * 2 - 6, r, r * 0.45, 0, 0, 7); c.lineWidth = 5.2; c.strokeStyle = OLC; c.stroke(); c.lineWidth = 3.2; c.strokeStyle = [K.wallDark.base, K.pipe.shade, K.wallDark.hl][i]; c.stroke(); });
  line(c, curvePts([x + 14, y - 6], [x + 34, y + 2], [x + 46, y - 2], 8), 3.4, K.wallDark.base, true);
  shape(c, rrPts(x + 44, y - 8, 9, 10, 2), K.brass, { seed: seed, size: 'S', sh: 1, rough: 0.2 });
}
function wallGauge(c, K, x, y, r, seed) {
  shape(c, ellPts(x, y, r + 3, r + 3, 20), K.brass, { seed: seed, size: 'M', sh: 2, rough: 0.1 });
  shape(c, ellPts(x, y, r, r, 20), K.ironLight, { seed: seed + 1, size: 'S', sh: 1, rough: 0.1 });
  c.save(); c.strokeStyle = OLC; c.lineWidth = 1.1; for (var i = 0; i < 9; i++) { var a = Math.PI * 0.8 + i * Math.PI * 1.4 / 8; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72); c.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); c.stroke(); }
  var na = Math.PI * 0.8 + (0.3 + (seed % 7) / 12) * Math.PI * 1.4; c.strokeStyle = C(P.accentHue, 85, 55); c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(na) * r * 0.8, y + Math.sin(na) * r * 0.8); c.stroke(); c.restore();
  c.beginPath(); c.arc(x, y, 1.8, 0, 7); c.fillStyle = OLC; c.fill();
}

/* ---------------- lighting, fog and finishing ---------------- */
function sparkles(c, kind) {
  var R = rng(P.seed * 29 + 11), n = Math.round((kind === 'factory' ? 10 : 20) * P.sparkle), i;
  for (i = 0; i < n; i++) {
    var x = R() * W, y = (kind === 'factory' ? 40 : 20) + R() * (H - 40), r = 1 + R() * 1.6;
    var hh = kind === 'factory' ? P.accentHue : (R() < 0.7 ? P.accentHue : mixHue(P.accentHue, P.outsideHue, 0.7));
    glowSpot(c, x, y, 7 + r * 3, 'hsla(' + hh.toFixed(0) + ',95%,70%,__A__)', 0.55 * P.glow);
    c.fillStyle = 'hsla(' + hh.toFixed(0) + ',100%,92%,0.95)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
}

function sheetBg(c, K, kind) {
  if (kind === 'factory') floorTiles(c, K, 0);
  else { var R = rng(P.seed * 5 + 2), i; c.fillStyle = K.grassA.base; c.fillRect(0, 0, W, H); if (P.look === 1) { var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, K.grassA.shade); g.addColorStop(1, K.grassB.base); c.fillStyle = g; c.fillRect(0, 0, W, H); } for (i = 0; i < 18; i++) { c.fillStyle = (i % 2 ? K.grassB : K.grassA).hl; c.globalAlpha = 0.16; c.beginPath(); c.ellipse(R() * W, R() * H, 40 + R() * 50, 16 + R() * 24, 0, 0, 7); c.fill(); } c.globalAlpha = 1; }
  c.fillStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',45%,10%,0.35)'; c.fillRect(0, 0, W, H);
}
function drawSheet(c, kind) {
  var K = mats(), S = P.seed, i;
  var out = [
    ['Oak tree', function () { tree(c, K, 0, 0, 250, S + 1, 34); }, 0.3, 0.9],
    ['Pine', function () { pine(c, K, 0, 0, 128, S + 4); }, 0.62, 1],
    ['Willow', function () { willow(c, K, 0, 0, 190, S + 3); }, 0.4, 1],
    ['Birch', function () { birch(c, K, 0, 0, 150, S + 9); }, 0.5, 1],
    ['Cypress', function () { cypress(c, K, 0, 0, 170, S + 10); }, 0.42, 1],
    ['Gnarled oak', function () { ancient(c, K, 0, 0, 260, S + 2); }, 0.26, 1],
    ['Blossom tree', function () { blossomTree(c, K, 0, 0, 150, S + 11); }, 0.46, 1],
    ['Bush', function () { bush(c, K, 0, 0, 24, S + 20, false); }, 1.05, 1],
    ['Berry bush', function () { bush(c, K, 0, 0, 24, S + 22, true); }, 1.05, 1],
    ['Fern', function () { fern(c, K, 0, 0, 24, S + 60); }, 1.25, 1],
    ['Fallen log', function () { fallenLog(c, K, 0, 0, 64, S + 16); }, 0.9, 1],
    ['Reeds', function () { reeds(c, K, 0, 0, S + 40); }, 1.1, 1],
    ['Signpost', function () { signpost(c, K, 0, 0, S + 17); }, 0.9, 1],
    ['Bell flowers', function () { bellFlower(c, K, -8, 0, S + 18); bellFlower(c, K, 6, 4, S + 19); }, 1.15, 1],
    ['Stump lantern', function () { stumpLantern(c, K, 0, 0, S + 15); }, 1, 1],
    ['Rock', function () { rock(c, K, 0, 0, 18, S + 7, true); }, 1.5, 1],
    ['Mushrooms', function () { mushroom(c, K, 0, 0, 24, S + 10); mushroom(c, K, 16, 5, 15, S + 11); }, 1.3, 1],
    ['Flower', function () { flower(c, K, -10, 0, S + 100); flower(c, K, 6, 3, S + 101); }, 1.7, 1]
  ];
  if (kind === 'factory') out = [
    ['Pillar', function () { pillar(c, K, 0, 0, 260, S + 1, 30); }, 0.3, 1],
    ['Crate', function () { crate(c, K, 0, 0, 30, S + 5, 0); }, 1.4, 1],
    ['Barrel', function () { barrel(c, K, -8, 0, 28, S + 8); barrel(c, K, 10, 4, 24, S + 9); }, 1.3, 1],
    ['Gears', function () { gear(c, K, -12, -16, 14, S + 5, 12, K.brass); gear(c, K, 12, -10, 9, S + 6, 10, K.rust); }, 1.5, 1],
    ['Lamp post', function () { lampPost(c, K, 0, 0, 92, S + 11); }, 0.72, 1],
    ['Scrap', function () { scrap(c, K, 0, 0, S + 13); }, 1.2, 1],
    ['Vat', function () { vat(c, K, 0, 0, S + 23); }, 0.6, 1],
    ['Conveyor', function () { conveyor(c, K, 0, 0, 98, S + 25); }, 0.72, 1],
    ['Workbench', function () { workbench(c, K, 0, 0, 66, S + 24); }, 1, 1],
    ['Shelf', function () { shelfUnit(c, K, 0, 0, 56, 78, S + 20); }, 0.85, 1],
    ['Furnace', function () { furnace(c, K, 0, 0, S + 21); }, 0.52, 1],
    ['Valve pipe', function () { valvePipe(c, K, -8, 0, 96, S + 22); }, 0.72, 1],
    ['Stairs', function () { stairs(c, K, -44, 0, S + 30); }, 0.68, 1],
    ['Console', function () { consolePanel(c, K, 0, 0, S + 26); }, 1.2, 1],
    ['Cable coil', function () { cableCoil(c, K, -14, 0, S + 27); }, 1.05, 1]
  ];
  lights.length = 0;
  sheetBg(c, K, kind);
  var cols = out.length > 15 ? 6 : 5, rowsN = Math.ceil(out.length / cols), cw = W / cols, ch = H / rowsN;
  out.forEach(function (it, idx) {
    var cx = (idx % cols) * cw + cw / 2, cyTop = Math.floor(idx / cols) * ch, by = cyTop + ch - 22;
    c.fillStyle = 'rgba(0,0,0,0.16)'; var px = (idx % cols) * cw + 4, py = cyTop + 4, pw = cw - 8, ph = ch - 8;
    c.beginPath(); c.moveTo(px + 8, py); c.arcTo(px + pw, py, px + pw, py + ph, 8); c.arcTo(px + pw, py + ph, px, py + ph, 8); c.arcTo(px, py + ph, px, py, 8); c.arcTo(px, py, px + pw, py, 8); c.closePath(); c.fill();
    lights.length = 0;
    c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
    c.translate(cx, by); c.scale(it[2], it[2]); it[1]();
    lights.forEach(function (l) { glowSpot(c, l.x, l.y, l.r * 0.7, 'hsla(' + l.h.toFixed(0) + ',' + l.s + '%,' + l.l + '%,__A__)', 0.34 * P.glow * l.a); });
    c.restore();
    c.font = '600 8.5px system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 2.6; c.strokeStyle = 'rgba(10,8,20,0.85)'; c.lineJoin = 'round';
    c.strokeText(it[0], cx, cyTop + ch - 9); c.fillStyle = '#f2f0ff'; c.fillText(it[0], cx, cyTop + ch - 9);
  });
  lights.length = 0;
}


/* ---------------- ground tiles and baked props (for the walk test) ---------------- */
var TW = 32, TH = 24;
var TILES = {
  water: { n: 3, pr: 0 }, shore: { n: 3, pr: 1 }, dirt: { n: 4, pr: 2 }, moss: { n: 3, pr: 3 }, grassDark: { n: 4, pr: 4 }, leaves: { n: 3, pr: 4 },
  grass: { n: 6, pr: 5 }, path: { n: 4, pr: 6 }, plank: { n: 3, pr: 7 }, snow: { n: 5, pr: 5 }, snowDark: { n: 4, pr: 4 }, ice: { n: 3, pr: 0 }, rock: { n: 3, pr: 2 }, ash: { n: 5, pr: 5 }, char: { n: 4, pr: 4 }, basalt: { n: 3, pr: 2 }, lava: { n: 3, pr: 0 }, crack: { n: 3, pr: 3 }, plate: { n: 4, pr: 5 }, grate: { n: 2, pr: 5 }, puddle: { n: 2, pr: 5 }, voidT: { n: 1, pr: 9 }
};
function wrapDraw(c, fn) { for (var dx = -TW; dx <= TW; dx += TW) for (var dy = -TH; dy <= TH; dy += TH) { c.save(); c.translate(dx, dy); fn(); c.restore(); } }
function soft(c, x, y, r, col, a) {
  var g = c.createRadialGradient(x, y, 0, x, y, r), b = col.replace('hsl(', 'hsla(');
  g.addColorStop(0, b.replace(')', ',' + a + ')')); g.addColorStop(1, b.replace(')', ',0)'));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
}
function blades(c, R, n, cols, lenMin, lenMax, alpha) {
  var list = [], i;
  for (i = 0; i < n; i++) list.push([R() * TW, R() * TH, lenMin + R() * (lenMax - lenMin), (R() - 0.5) * 0.9, i % cols.length, 0.9 + R() * 0.8]);
  wrapDraw(c, function () {
    c.lineCap = 'round'; c.globalAlpha = alpha;
    list.forEach(function (b) { c.strokeStyle = cols[b[4]]; c.lineWidth = b[5]; c.beginPath(); c.moveTo(b[0], b[1]); c.quadraticCurveTo(b[0] + b[3] * b[2] * 0.6, b[1] - b[2] * 0.5, b[0] + b[3] * b[2], b[1] - b[2]); c.stroke(); });
    c.globalAlpha = 1;
  });
}
function paintTile(c, K, type, v, R) {
  var i, list;
  if (type === 'grass' || type === 'grassDark' || type === 'leaves' || type === 'moss') {
    var m = type === 'moss' ? K.moss : K.grassA;
    c.fillStyle = type === 'grass' ? m.base : (type === 'moss' ? K.moss.base : K.gdark.base); c.fillRect(0, 0, TW, TH);
    var bl = []; for (i = 0; i < 3; i++) bl.push([R() * TW, R() * TH, 8 + R() * 9, R() < 0.5]);
    wrapDraw(c, function () { bl.forEach(function (b) { soft(c, b[0], b[1], b[2], b[3] ? m.hl : m.shade, type === 'grass' ? 0.07 : 0.14); }); });
    if (type === 'grass') {
      blades(c, R, 22, [K.leaf.base, K.leafD.base, K.grassB.hl, K.grassA.hl], 3, 6.5, 0.5);
      var ex = v % 6;
      if (ex === 1) { list = []; for (i = 0; i < 3; i++) list.push([3 + R() * 26, 3 + R() * 18]); wrapDraw(c, function () { list.forEach(function (p) { [[0, 0], [2.4, 1], [-2, 1.2]].forEach(function (o) { c.fillStyle = K.leaf.hl; c.beginPath(); c.ellipse(p[0] + o[0], p[1] + o[1], 2, 1.5, 0, 0, 7); c.fill(); }); }); }); }
      if (ex === 2 || ex === 5) { list = []; for (i = 0; i < 3; i++) list.push([4 + R() * 24, 6 + R() * 14, R()]); wrapDraw(c, function () { list.forEach(function (p) { c.strokeStyle = K.leafD.base; c.lineWidth = 1; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - 4); c.stroke(); c.fillStyle = p[2] < 0.5 ? K.flowerA.base : (p[2] < 0.8 ? K.flowerC.base : K.spot.base); c.beginPath(); c.arc(p[0], p[1] - 4.6, 1.9, 0, 7); c.fill(); c.fillStyle = K.spot.base; c.beginPath(); c.arc(p[0], p[1] - 4.6, 0.7, 0, 7); c.fill(); }); }); }
      if (ex === 3) { list = []; for (i = 0; i < 2; i++) list.push([4 + R() * 24, 4 + R() * 16, 1.6 + R() * 1.6]); wrapDraw(c, function () { list.forEach(function (p) { c.fillStyle = K.rock.base; c.beginPath(); c.ellipse(p[0], p[1], p[2], p[2] * 0.7, 0, 0, 7); c.fill(); c.fillStyle = K.rock.hl; c.beginPath(); c.ellipse(p[0] - 0.5, p[1] - 0.5, p[2] * 0.5, p[2] * 0.3, 0, 0, 7); c.fill(); }); }); }
    } else if (type === 'grassDark') {
      blades(c, R, 14, [K.leafD.base, K.grassA.base, K.grassA.hl], 3, 5.5, 0.45);
      list = []; for (i = 0; i < 5; i++) list.push([R() * TW, R() * TH, 1.6 + R() * 1.6, R() * 3, R()]);
      wrapDraw(c, function () { list.forEach(function (p) { c.save(); c.translate(p[0], p[1]); c.rotate(p[3]); c.fillStyle = 'hsla(' + (28 + p[4] * 20).toFixed(0) + ',45%,' + (32 + p[4] * 8).toFixed(0) + '%,0.45)'; c.beginPath(); c.ellipse(0, 0, p[2], p[2] * 0.5, 0, 0, 7); c.fill(); c.restore(); }); });
    } else if (type === 'leaves') {
      blades(c, R, 10, [K.leafD.base, K.grassA.base], 3, 5, 0.4);
      list = []; for (i = 0; i < 14; i++) list.push([R() * TW, R() * TH, 1.8 + R() * 1.8, R() * 3, R()]);
      wrapDraw(c, function () { list.forEach(function (p) { c.save(); c.translate(p[0], p[1]); c.rotate(p[3]); c.fillStyle = 'hsl(' + (mixHue(P.accentHue, 20, p[4])).toFixed(0) + ',' + Math.round(60 * P.sat) + '%,' + (44 + p[4] * 14).toFixed(0) + '%)'; c.beginPath(); c.ellipse(0, 0, p[2], p[2] * 0.52, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(-p[2], 0); c.lineTo(p[2], 0); c.stroke(); c.restore(); }); });
    } else {
      list = []; for (i = 0; i < 5; i++) list.push([R() * TW, R() * TH, 4 + R() * 5]);
      wrapDraw(c, function () { list.forEach(function (p) { var g = c.createRadialGradient(p[0] - p[2] * 0.3, p[1] - p[2] * 0.4, 0.5, p[0], p[1], p[2]); g.addColorStop(0, K.moss.hl); g.addColorStop(0.6, K.moss.base); g.addColorStop(1, K.moss.shade); c.fillStyle = g; c.beginPath(); c.ellipse(p[0], p[1], p[2], p[2] * 0.7, 0, 0, 7); c.fill(); }); });
      blades(c, R, 10, [K.moss.hl, K.leaf.base], 2.5, 4.5, 0.5);
    }
    return;
  }
  if (type === 'snow' || type === 'snowDark' || type === 'ice' || type === 'rock' || type === 'ash' || type === 'char' || type === 'basalt' || type === 'lava' || type === 'crack') {
    var bm = type === 'snow' ? K.snowA : type === 'snowDark' ? K.snowB : type === 'ice' ? K.iceM : type === 'rock' ? K.rockC : type === 'ash' ? K.ashM : type === 'char' ? K.charM : type === 'basalt' ? K.basM : type === 'lava' ? K.lavaM : K.ashM;
    c.fillStyle = bm.base; c.fillRect(0, 0, TW, TH);
    var bq = []; for (i = 0; i < 3; i++) bq.push([R() * TW, R() * TH, 8 + R() * 9, R() < 0.5]);
    wrapDraw(c, function () { bq.forEach(function (b) { soft(c, b[0], b[1], b[2], b[3] ? bm.hl : bm.shade, type === 'lava' ? 0.3 : 0.14); }); });
    if (type === 'snow' || type === 'snowDark') {
      list = []; for (i = 0; i < 12; i++) list.push([R() * TW, R() * TH, R()]);
      wrapDraw(c, function () { list.forEach(function (p) { c.fillStyle = p[2] < 0.5 ? '#ffffff' : 'hsl(205,60%,80%)'; c.globalAlpha = 0.65; c.fillRect(p[0], p[1], 1, 1); c.globalAlpha = 1; }); });
      blades(c, R, 6, ['hsl(210,45%,82%)', 'hsl(215,40%,70%)'], 4, 8, 0.22);
      if (type === 'snowDark') { list = []; for (i = 0; i < 7; i++) list.push([R() * TW, R() * TH, R() * 3]); wrapDraw(c, function () { list.forEach(function (p) { c.save(); c.translate(p[0], p[1]); c.rotate(p[2]); c.strokeStyle = p[2] > 1.5 ? 'hsl(150,30%,24%)' : 'hsl(25,25%,30%)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-2, 0); c.lineTo(2, 0); c.stroke(); c.restore(); }); }); }
      if (v === 1 && type === 'snow') soft(c, 8 + R() * 16, 6 + R() * 12, 9, 'hsl(195,70%,78%)', 0.35);
    } else if (type === 'ice') {
      list = []; for (i = 0; i < 4; i++) { var ax = R() * TW, ay = R() * TH; list.push([ax, ay, ax + (R() - 0.5) * 16, ay + (R() - 0.5) * 10, ax + (R() - 0.5) * 24, ay + (R() - 0.5) * 16]); }
      wrapDraw(c, function () { c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.7; list.forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.lineTo(q[4], q[5]); c.stroke(); }); });
      list = []; for (i = 0; i < 5; i++) list.push([R() * TW, R() * TH, 4 + R() * 6]);
      wrapDraw(c, function () { c.fillStyle = 'rgba(255,255,255,0.22)'; list.forEach(function (p) { c.beginPath(); c.ellipse(p[0], p[1], p[2], p[2] * 0.3, -0.4, 0, 7); c.fill(); }); });
    } else if (type === 'rock') {
      list = []; for (i = 0; i < 3; i++) { var rx = R() * TW, ry = R() * TH; list.push([rx, ry, rx + (R() - 0.5) * 18, ry + (R() - 0.5) * 12, rx + (R() - 0.5) * 26, ry + (R() - 0.5) * 16]); }
      wrapDraw(c, function () { c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,9%,0.55)'; c.lineWidth = 0.9; list.forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.lineTo(q[4], q[5]); c.stroke(); }); });
      blades(c, R, 5, [bm.hl, bm.shade], 2, 4, 0.3);
      if (v === 2) soft(c, R() * TW, R() * TH, 7, K.moss.base, 0.45);
    } else if (type === 'ash' || type === 'char') {
      list = []; for (i = 0; i < 12; i++) list.push([R() * TW, R() * TH, R()]);
      wrapDraw(c, function () { list.forEach(function (p) { c.fillStyle = p[2] < 0.7 ? bm.hl : bm.shade; c.globalAlpha = 0.5; c.fillRect(p[0], p[1], 1.2, 1.2); c.globalAlpha = 1; }); });
      blades(c, R, type === 'char' ? 9 : 5, ['hsl(15,12%,16%)', 'hsl(20,10%,26%)'], 2.5, 6, 0.55);
      list = []; for (i = 0; i < (type === 'char' ? 3 : 2); i++) list.push([R() * TW, R() * TH]);
      wrapDraw(c, function () { list.forEach(function (p) { c.fillStyle = 'hsla(28,100%,60%,0.9)'; c.beginPath(); c.arc(p[0], p[1], 0.7, 0, 7); c.fill(); soft(c, p[0], p[1], 3.2, 'hsl(26,100%,55%)', 0.35); }); });
    } else if (type === 'basalt') {
      list = []; for (i = 0; i < 3; i++) { var bx0 = R() * TW, by0 = R() * TH; list.push([bx0, by0, bx0 + 5 + R() * 6, by0 + (R() - 0.5) * 6, bx0 + 3 + R() * 8, by0 + 5 + R() * 5]); }
      wrapDraw(c, function () { c.strokeStyle = 'rgba(5,3,12,0.6)'; c.lineWidth = 0.9; list.forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.lineTo(q[4], q[5]); c.closePath(); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.05)'; c.fill(); }); });
    } else if (type === 'lava') {
      list = []; for (i = 0; i < 2; i++) { var lx = R() * TW, ly = R() * TH; list.push([lx, ly, 3 + R() * 3]); }
      wrapDraw(c, function () { list.forEach(function (p) { soft(c, p[0], p[1], p[2] * 2.2, 'hsl(46,100%,64%)', 0.4); c.fillStyle = 'hsl(16,60%,20%)'; c.globalAlpha = 0.55; c.beginPath(); c.ellipse(p[0] + 5, p[1] + 3, p[2] * 0.7, p[2] * 0.4, 0.4, 0, 7); c.fill(); c.globalAlpha = 1; }); });
    } else if (type === 'crack') {
      var zz = []; for (i = 0; i < 2; i++) { var x0 = R() * TW, y0 = R() * TH, pts2 = [[x0, y0]]; for (var k = 0; k < 3; k++) pts2.push([pts2[k][0] + (R() - 0.3) * 9, pts2[k][1] + (R() - 0.5) * 7]); zz.push(pts2); }
      wrapDraw(c, function () {
        zz.forEach(function (pts) { c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = 'hsla(22,100%,55%,0.35)'; c.lineWidth = 3.2; c.beginPath(); pts.forEach(function (p, k) { if (k) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke(); c.strokeStyle = 'hsl(40,100%,68%)'; c.lineWidth = 1; c.beginPath(); pts.forEach(function (p, k) { if (k) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke(); });
      });
      blades(c, R, 4, ['hsl(15,12%,16%)'], 2.5, 5, 0.5);
    }
    return;
  }
  if (type === 'plank') {
    var wm = K.wood;
    c.fillStyle = wm.shade; c.fillRect(0, 0, TW, TH);
    var pr = 4, py;
    for (py = 0; py < TH; py += TH / pr) {
      var ph = TH / pr - 0.8, tone = (R() - 0.5) * 6;
      c.fillStyle = C(mixHue(28, P.outsideHue, 0.1), 34, 38 + tone); c.fillRect(0, py + 0.4, TW, ph);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, py + 0.4, TW, 0.9);
      c.fillStyle = 'rgba(10,6,20,0.25)'; c.fillRect(0, py + ph - 0.6, TW, 1);
      if (R() < 0.6) { c.fillStyle = 'rgba(10,6,20,0.3)'; c.beginPath(); c.ellipse(4 + R() * 24, py + ph / 2, 1.4, 0.8, 0, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(20,12,30,0.55)'; c.fillRect(2, py + 1.4, 1, 1); c.fillRect(TW - 3, py + 1.4, 1, 1);
    }
    return;
  }
  if (type === 'dirt') {
    var db = M(mixHue(30, P.outsideHue, 0.12), 30, 31);
    c.fillStyle = db.base; c.fillRect(0, 0, TW, TH);
    var bl2 = []; for (i = 0; i < 3; i++) bl2.push([R() * TW, R() * TH, 8 + R() * 8, R() < 0.5]);
    wrapDraw(c, function () { bl2.forEach(function (b) { soft(c, b[0], b[1], b[2], b[3] ? db.hl : db.shade, 0.14); }); });
    list = []; for (i = 0; i < 9; i++) list.push([R() * TW, R() * TH, 0.8 + R() * 1.6]);
    var cr = []; for (i = 0; i < 2; i++) { var cx = R() * TW, cy = R() * TH; cr.push([cx, cy, cx + (R() - 0.5) * 12, cy + (R() - 0.5) * 8, cx + (R() - 0.5) * 18, cy + (R() - 0.5) * 12]); }
    wrapDraw(c, function () {
      list.forEach(function (p) { c.fillStyle = K.rock.base; c.globalAlpha = 0.8; c.beginPath(); c.ellipse(p[0], p[1], p[2], p[2] * 0.7, 0, 0, 7); c.fill(); c.fillStyle = K.rock.hl; c.beginPath(); c.ellipse(p[0] - 0.4, p[1] - 0.4, p[2] * 0.5, p[2] * 0.3, 0, 0, 7); c.fill(); c.globalAlpha = 1; });
      c.strokeStyle = db.shade; c.lineWidth = 0.8; cr.forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.lineTo(q[4], q[5]); c.stroke(); });
    });
    blades(c, R, 4, [K.leafD.base], 2.5, 4, 0.5);
    return;
  }
  if (type === 'path') {
    var ph = mixHue(32, P.outsideHue, 0.08);
    c.fillStyle = C(ph, 14, 20); c.fillRect(0, 0, TW, TH);
    var rows = 3, rh = TH / rows, r, j, stones = [];
    for (r = 0; r < rows; r++) {
      var ws = [0.26 + R() * 0.16, 0.26 + R() * 0.16, 0.26 + R() * 0.16], tot = ws[0] + ws[1] + ws[2], x0 = 0;
      for (j = 0; j < 3; j++) { var w = ws[j] / tot * TW; stones.push([x0, r * rh, w, rh, (R() - 0.5) * 9, R()]); x0 += w; }
    }
    stones.forEach(function (st) {
      var gx = st[0] + 0.7, gy = st[1] + 0.7, gw = st[2] - 1.4, gh = st[3] - 1.4, l0 = 41 + st[4];
      var d = dens(rrPts(gx, gy, gw, gh, 1.9), 3);
      path(c, d); c.fillStyle = C(ph, 15 + st[5] * 6, l0); c.fill();
      c.save(); path(c, d); c.clip();
      c.fillStyle = C(ph, 14, l0 + 7); c.globalAlpha = 0.5; c.fillRect(gx, gy, gw, 1.3);
      c.fillStyle = C(ph, 16, l0 - 11); c.globalAlpha = 0.5; c.fillRect(gx, gy + gh - 1.5, gw, 1.5);
      c.fillRect(gx + gw - 1.2, gy, 1.2, gh);
      c.globalAlpha = 0.18; c.fillStyle = C(ph, 12, l0 + 10); c.beginPath(); c.ellipse(gx + gw * 0.38, gy + gh * 0.4, gw * 0.3, gh * 0.18, 0, 0, 7); c.fill();
      if (st[5] < 0.35) { c.globalAlpha = 0.5; c.strokeStyle = C(ph, 14, l0 - 16); c.lineWidth = 0.6; c.beginPath(); c.moveTo(gx + gw * (0.3 + st[5]), gy + 0.5); c.lineTo(gx + gw * (0.4 + st[5]), gy + gh * 0.55); c.lineTo(gx + gw * (0.3 + st[5]), gy + gh); c.stroke(); }
      c.restore(); c.globalAlpha = 1;
    });
    var mo = []; for (r = 0; r < 4; r++) mo.push([R() * TW, (Math.floor(R() * 3) + 0) * rh, 1.4 + R() * 1.6]);
    wrapDraw(c, function () { mo.forEach(function (p) { c.fillStyle = K.moss.base; c.globalAlpha = 0.7; c.beginPath(); c.ellipse(p[0], p[1], p[2], p[2] * 0.6, 0, 0, 7); c.fill(); c.globalAlpha = 1; }); });
    return;
  }
  if (type === 'shore') {
    var sb = M(mixHue(42, P.outsideHue, 0.06), 30, 52);
    c.fillStyle = sb.base; c.fillRect(0, 0, TW, TH);
    var bl3 = []; for (i = 0; i < 3; i++) bl3.push([R() * TW, R() * TH, 8 + R() * 8, R() < 0.5]);
    wrapDraw(c, function () { bl3.forEach(function (b) { soft(c, b[0], b[1], b[2], b[3] ? sb.hl : sb.shade, 0.14); }); });
    list = []; for (i = 0; i < 7; i++) list.push([R() * TW, R() * TH, 0.7 + R() * 1.2]);
    wrapDraw(c, function () { list.forEach(function (p) { c.fillStyle = K.rock.base; c.beginPath(); c.ellipse(p[0], p[1], p[2], p[2] * 0.7, 0, 0, 7); c.fill(); }); });
    return;
  }
  if (type === 'water') {
    c.fillStyle = K.water.base; c.fillRect(0, 0, TW, TH);
    var bl4 = []; for (i = 0; i < 3; i++) bl4.push([R() * TW, R() * TH, 9 + R() * 9, R() < 0.5]);
    wrapDraw(c, function () { bl4.forEach(function (b) { soft(c, b[0], b[1], b[2], b[3] ? K.waterL.hl : K.water.shade, 0.05); }); });
    list = []; for (i = 0; i < 4; i++) list.push([R() * TW, R() * TH, 4 + R() * 5]);
    wrapDraw(c, function () { c.strokeStyle = K.waterL.hl; c.lineWidth = 0.9; c.globalAlpha = 0.2; list.forEach(function (p) { c.beginPath(); c.ellipse(p[0], p[1], p[2], p[2] * 0.35, 0, 3.4, 5.9); c.stroke(); }); c.globalAlpha = 1; });
    return;
  }
  if (type === 'plate' || type === 'grate' || type === 'puddle') {
    var fb = K.floorB, sp = [], sc = [];
    c.fillStyle = fb.base; c.fillRect(0, 0, TW, TH);
    var bl5 = []; for (i = 0; i < 3; i++) bl5.push([R() * TW, R() * TH, 8 + R() * 9, R() < 0.5]);
    wrapDraw(c, function () { bl5.forEach(function (b) { soft(c, b[0], b[1], b[2], b[3] ? fb.hl : fb.shade, 0.1); }); });
    for (i = 0; i < 30; i++) sp.push([R() * TW, R() * TH, R()]);
    for (i = 0; i < 4; i++) { var sx0 = R() * TW, sy0 = R() * TH; sc.push([sx0, sy0, sx0 + 3 + R() * 6, sy0 - 1 - R() * 2]); }
    wrapDraw(c, function () {
      sp.forEach(function (p) { c.fillStyle = p[2] < 0.5 ? fb.hl : fb.shade; c.globalAlpha = 0.28; c.fillRect(p[0], p[1], 1, 1); });
      c.globalAlpha = 0.22; c.lineWidth = 0.7; sc.forEach(function (q, k) { c.strokeStyle = k % 2 ? fb.hl : fb.shade; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.stroke(); }); c.globalAlpha = 1;
    });
    if (type === 'plate' && v === 1) {
      var dm = [], row, col; for (row = 0; row < 8; row++) for (col = 0; col < 8; col++) dm.push([col * 4 + (row % 2 ? 2 : 0) + 2, row * 3 + 1.5, (row + col) % 2]);
      wrapDraw(c, function () { dm.forEach(function (p) { c.beginPath(); c.moveTo(p[0], p[1] - 1.3); c.lineTo(p[0] + 1.9, p[1]); c.lineTo(p[0], p[1] + 1.3); c.lineTo(p[0] - 1.9, p[1]); c.closePath(); c.fillStyle = fb.hl; c.globalAlpha = 0.34; c.fill(); c.translate(0.5, 0.6); c.fillStyle = fb.shade; c.globalAlpha = 0.4; c.fill(); c.translate(-0.5, -0.6); c.globalAlpha = 1; }); });
    }
    if (type === 'plate' && v === 2) { var ox = 6 + R() * 18, oy = 5 + R() * 14; soft(c, ox, oy, 9, 'hsl(' + P.shadowHue.toFixed(0) + ',40%,8%)', 0.32); c.fillStyle = fb.shade; c.beginPath(); c.arc(4, 4, 1.3, 0, 7); c.fill(); c.fillStyle = fb.hl; c.globalAlpha = 0.5; c.beginPath(); c.arc(3.6, 3.6, 0.6, 0, 7); c.fill(); c.globalAlpha = 1; }
    if (type === 'plate' && v === 3) { soft(c, 8 + R() * 16, 6 + R() * 10, 8, K.rust.base, 0.3); c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,9%,0.5)'; c.lineWidth = 0.8; var cx0 = 6 + R() * 16; c.beginPath(); c.moveTo(cx0, 0); c.lineTo(cx0 + 3, 7); c.lineTo(cx0 - 2, 13); c.lineTo(cx0 + 3, 24); c.stroke(); }
    if (type === 'grate') {
      var gd = dens(rrPts(2.5, 3, TW - 5, TH - 6, 2), 3);
      path(c, gd); c.fillStyle = 'hsl(' + P.shadowHue.toFixed(0) + ',45%,7%)'; c.fill();
      c.save(); path(c, gd); c.clip();
      var gg = c.createLinearGradient(0, 3, 0, TH - 3); gg.addColorStop(0, 'hsla(' + P.accentHue.toFixed(0) + ',90%,60%,0.1)'); gg.addColorStop(1, 'hsla(' + P.accentHue.toFixed(0) + ',90%,60%,0.6)'); c.fillStyle = gg; c.fillRect(2, 3, TW - 4, TH - 6);
      for (i = 0; i < 7; i++) { c.fillStyle = fb.base; c.fillRect(4 + i * 4, 3, 2, TH - 6); c.fillStyle = fb.hl; c.fillRect(4 + i * 4, 3, 0.8, TH - 6); }
      c.restore(); path(c, gd); c.lineWidth = 1; c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',45%,9%,0.7)'; c.stroke();
    }
    if (type === 'puddle') {
      var pd = dens(blobPts(TW / 2, TH / 2, 11 + R() * 2, 6.5 + R(), v * 7 + 3, 18, 0.28), 3);
      path(c, pd); var pg = c.createLinearGradient(0, 4, 0, TH - 4); pg.addColorStop(0, K.water.hl); pg.addColorStop(1, K.water.shade); c.fillStyle = pg; c.fill();
      c.save(); path(c, pd); c.clip(); c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',90%,70%,0.4)'; c.beginPath(); c.ellipse(TW / 2 - 3, TH / 2 - 1, 5, 2, 0, 0, 7); c.fill(); c.restore();
      path(c, pd); c.lineWidth = 1; c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',45%,9%,0.55)'; c.stroke();
      c.strokeStyle = K.waterL.hl; c.globalAlpha = 0.6; c.lineWidth = 0.8; c.beginPath(); c.ellipse(TW / 2 + 2, TH / 2 + 1, 5, 2, 0, 0, 7); c.stroke(); c.globalAlpha = 1;
    }
    return;
  }
  c.fillStyle = 'hsl(' + P.shadowHue.toFixed(0) + ',40%,6%)'; c.fillRect(0, 0, TW, TH);
}
/* ---------------- Viking set: village, graves and camp ---------------- */
function vShield(c, cx, cy, r, hue, seed) {
  var d = shape(c, ellPts(cx, cy, r, r, 16), M(hue, 62, 44), { seed: seed, size: 'S', sh: 1.5, rough: 0.15 });
  c.save(); path(c, d); c.clip(); c.fillStyle = C(44, 38, 82); c.fillRect(cx - r, cy - r, r, r); c.fillRect(cx, cy, r, r); c.restore();
  path(c, d); c.lineWidth = 0.9 + ow('S') * 0.5; c.strokeStyle = OLC; c.stroke();
  shape(c, ellPts(cx, cy, r * 0.3, r * 0.3, 8), M(P.factoryHue + 14, 14, 52), { seed: seed + 1, size: 'S', flat: true, rough: 0.1 });
}
function runestone(c, K, x, y, seed) {
  var R = rng(seed), h = 50 + R() * 12, i;
  longShadow(c, x, y, 22, 24); gshadow(c, x, y, 17, 5, 0.4);
  shape(c, [[x - 13, y], [x - 14, y - h * 0.55], [x - 9, y - h * 0.92], [x - 1, y - h], [x + 8, y - h * 0.93], [x + 14, y - h * 0.6], [x + 13, y]], K.rockC, { seed: seed, size: 'M', sh: 4, hl: 2, rough: 0.4 });
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = C(8, 72, 46); c.lineWidth = 3;
  c.beginPath(); c.moveTo(x - 8, y - 8); c.quadraticCurveTo(x - 11, y - h * 0.6, x - 5, y - h * 0.82); c.quadraticCurveTo(x, y - h * 0.95, x + 5, y - h * 0.82); c.quadraticCurveTo(x + 11, y - h * 0.6, x + 8, y - 8); c.stroke();
  c.strokeStyle = C(8, 72, 46); c.lineWidth = 1.2;
  for (i = 0; i < 9; i++) {
    var gx = x - 4 + (i % 3) * 4, gy = y - h * (0.3 + Math.floor(i / 3) * 0.15), k = Math.floor(R() * 4);
    c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx, gy - 5);
    if (k === 0) { c.moveTo(gx, gy - 5); c.lineTo(gx + 2, gy - 3); } else if (k === 1) { c.moveTo(gx, gy - 4); c.lineTo(gx + 2, gy - 2.5); c.lineTo(gx, gy - 1); } else if (k === 2) { c.moveTo(gx - 1.5, gy - 4); c.lineTo(gx + 1.5, gy - 1.5); }
    c.stroke();
  }
  c.restore();
  shape(c, blobPts(x - 3, y - 3, 12, 3.4, seed + 3, 8, 0.4), K.moss, { seed: seed + 4, size: 'S' });
}
function longhouse(c, K, x, y, seed) {
  var R = rng(seed), i, thatch = M(46, 46, 44);
  longShadow(c, x, y, 124, 60); gshadow(c, x, y, 72, 10, 0.45);
  var wall = shape(c, rrPts(x - 60, y - 30, 120, 30, 2), K.wood, { seed: seed, size: 'L', sh: 4, rough: 0.3 });
  c.save(); path(c, wall); c.clip(); c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,9%,0.4)'; c.lineWidth = 1;
  for (i = -56; i < 60; i += 8) { c.beginPath(); c.moveTo(x + i, y - 30); c.lineTo(x + i, y); c.stroke(); } c.restore();
  var roof = shape(c, [[x - 68, y - 27], [x - 54, y - 70], [x + 54, y - 70], [x + 68, y - 27]], thatch, { seed: seed + 1, size: 'L', sh: 6, hl: 3, rough: 0.5 });
  c.save(); path(c, roof); c.clip(); c.strokeStyle = C(42, 50, 28); c.globalAlpha = 0.45; c.lineWidth = 1;
  for (i = 0; i < 46; i++) { var tx = x - 64 + R() * 128, ty = y - 30 - R() * 38; c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + (R() - 0.5) * 3, ty - 5 - R() * 4); c.stroke(); }
  c.restore();
  shape(c, blobPts(x - 30, y - 64, 16, 4, seed + 2, 10, 0.4), K.moss, { seed: seed + 3, size: 'S' });
  shape(c, blobPts(x + 34, y - 44, 13, 4, seed + 4, 10, 0.4), K.moss, { seed: seed + 5, size: 'S' });
  line(c, [[x - 56, y - 70], [x + 56, y - 70]], 4, K.wood.base, true);
  [-1, 1].forEach(function (sd) {            // crossed gable beams with curled dragon tips
    var ex = x + sd * 55;
    line(c, curvePts([ex - sd * 11, y - 56], [ex - sd * 2, y - 74], [ex + sd * 7, y - 88], 6), 3.2, K.wood.base, true);
    line(c, curvePts([ex + sd * 11, y - 56], [ex + sd * 2, y - 74], [ex - sd * 7, y - 88], 6), 3.2, K.wood.base, true);
    line(c, curvePts([ex + sd * 7, y - 88], [ex + sd * 12, y - 92], [ex + sd * 11, y - 86], 4), 2.4, K.wood.base, true);
    line(c, curvePts([ex - sd * 7, y - 88], [ex - sd * 12, y - 92], [ex - sd * 11, y - 86], 4), 2.4, K.wood.base, true);
  });
  var door = shape(c, [[x - 9, y], [x - 9, y - 19], [x - 5, y - 25], [x + 5, y - 25], [x + 9, y - 19], [x + 9, y]], M(P.shadowHue, 40, 10), { seed: seed + 6, size: 'M', flat: true, rough: 0.2 });
  c.save(); path(c, door); c.clip(); c.fillStyle = 'hsla(28,95%,58%,0.5)'; c.fillRect(x - 9, y - 16, 18, 16); c.restore();
  [-13, 10].forEach(function (dx, k) { shape(c, rrPts(x + dx, y - 28, 3, 28, 1), K.trunkL, { seed: seed + 7 + k, size: 'S', flat: true, rough: 0.2 }); });
  vShield(c, x - 36, y - 16, 7, 8, seed + 10); vShield(c, x - 22, y - 15, 6, 212, seed + 12); vShield(c, x + 26, y - 16, 7, 44, seed + 14); vShield(c, x + 42, y - 15, 6, 8, seed + 16);
  for (i = 0; i < 4; i++) { c.save(); c.globalAlpha = 0.16 - i * 0.03; c.fillStyle = '#e8ecf4'; c.beginPath(); c.arc(x + 10 + i * 3, y - 76 - i * 8, 5 + i * 2.2, 0, 7); c.fill(); c.restore(); }
  addLight(x, y - 12, 70, 28, 95, 58, 0.6);
}
function vikingTent(c, K, x, y, seed) {
  var i;
  gshadow(c, x, y, 32, 7, 0.4);
  var cloth = shape(c, [[x - 26, y], [x, y - 40], [x + 26, y]], M(42, 26, 78), { seed: seed, size: 'M', sh: 3, rough: 0.4 });
  c.save(); path(c, cloth); c.clip(); c.fillStyle = C(8, 68, 44); c.globalAlpha = 0.85;
  for (i = -24; i < 26; i += 10) c.fillRect(x + i, y - 42, 4.4, 44);
  c.restore();
  path(c, cloth); c.lineWidth = 0.9 + ow('M') * 0.5; c.strokeStyle = OLC; c.stroke();
  shape(c, [[x - 7, y], [x, y - 22], [x + 7, y]], M(P.shadowHue, 40, 10), { seed: seed + 1, size: 'S', flat: true, rough: 0.2 });
  line(c, [[x - 30, y + 1], [x + 7, y - 52]], 3, K.wood.base, true);
  line(c, [[x + 30, y + 1], [x - 7, y - 52]], 3, K.wood.base, true);
  line(c, curvePts([x + 7, y - 52], [x + 11, y - 57], [x + 8, y - 59], 4), 2.2, K.wood.base, true);
  line(c, curvePts([x - 7, y - 52], [x - 11, y - 57], [x - 8, y - 59], 4), 2.2, K.wood.base, true);
}
function palisade(c, K, x, y, seed) {
  var R = rng(seed), i;
  gshadow(c, x, y, 36, 5, 0.35);
  for (i = 0; i < 6; i++) { var px = x - 30 + i * 12, hh = 38 + R() * 9; shape(c, [[px - 5.5, y], [px - 5.5, y - hh + 8], [px, y - hh], [px + 5.5, y - hh + 8], [px + 5.5, y]], i % 2 ? K.wood : K.trunk, { seed: seed + i, size: 'S', sh: 1.5, rough: 0.3 }); }
  line(c, [[x - 35, y - 21], [x + 35, y - 21]], 2.4, C(40, 34, 58), true);
}
function shieldRack(c, K, x, y, seed) {
  gshadow(c, x, y, 28, 5, 0.35);
  [[-14, -18], [14, 18]].forEach(function (s, k) {
    line(c, [[x + s[0], y], [x + s[1], y - 52]], 2, K.wood.base, true);
    shape(c, [[x + s[1] - 2.4, y - 51], [x + s[1] + (k ? 1.6 : -1.6), y - 60], [x + s[1] + 2.4, y - 51]], K.ironLight, { seed: seed + k, size: 'S', flat: true, rough: 0.1 });
  });
  [-24, 20].forEach(function (dx, k) { shape(c, rrPts(x + dx, y - 34, 4, 34, 1), K.wood, { seed: seed + 2 + k, size: 'S', sh: 1, rough: 0.2 }); });
  shape(c, rrPts(x - 26, y - 31, 52, 4, 1.5), K.wood, { seed: seed + 4, size: 'S', sh: 1, rough: 0.2 });
  vShield(c, x - 15, y - 18, 9, 8, seed + 6); vShield(c, x, y - 17, 9, 212, seed + 8); vShield(c, x + 15, y - 18, 9, 44, seed + 10);
}
function dragonPost(c, K, x, y, seed) {
  var i;
  gshadow(c, x, y, 11, 4, 0.4);
  shape(c, ribbon(curvePts([x, y], [x - 2, y - 30], [x + 3, y - 52], 8), 9, 6.5), K.wood, { seed: seed, size: 'M', sh: 2, rough: 0.3 });
  c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,9%,0.55)'; c.lineWidth = 1.1;
  for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - 5, y - 12 - i * 11); c.lineTo(x + 4, y - 14 - i * 11); c.stroke(); }
  shape(c, [[x - 1, y - 49], [x - 2, y - 60], [x + 4, y - 68], [x + 13, y - 67], [x + 20, y - 61], [x + 14, y - 59], [x + 18, y - 55], [x + 9, y - 55], [x + 8, y - 49]], K.wood, { seed: seed + 1, size: 'S', sh: 1.5, rough: 0.2 });
  line(c, curvePts([x - 1, y - 62], [x - 8, y - 68], [x - 5, y - 60], 5), 2.2, K.wood.base, true);
  c.fillStyle = 'hsl(' + P.accentHue.toFixed(0) + ',95%,66%)'; c.beginPath(); c.arc(x + 8, y - 62.5, 1.5, 0, 7); c.fill();
  line(c, [[x + 14, y - 58], [x + 19, y - 57]], 1.2, C(6, 75, 50), false);
}
function burialMound(c, K, x, y, seed) {
  var R = rng(seed), i;
  gshadow(c, x, y, 54, 9, 0.35);
  var m = shape(c, [[x - 48, y], [x - 40, y - 14], [x - 22, y - 26], [x, y - 30], [x + 22, y - 26], [x + 40, y - 14], [x + 48, y]], K.grassB, { seed: seed, size: 'L', sh: 5, hl: 3, rough: 0.5 });
  c.save(); path(c, m); c.clip(); c.strokeStyle = K.leaf.base; c.globalAlpha = 0.6; c.lineWidth = 1;
  for (i = 0; i < 18; i++) { var gx = x - 40 + R() * 80, gy = y - 4 - R() * 20; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + (R() - 0.5) * 3, gy - 4 - R() * 3); c.stroke(); }
  c.restore();
  for (i = 0; i < 8; i++) { if (i === 3 || i === 4) continue; shape(c, blobPts(x - 42 + i * 12, y - 2, 5, 3.4, seed + 10 + i, 8, 0.25), i % 2 ? K.rockC : K.rock, { seed: seed + 20 + i, size: 'S', sh: 1.2, rough: 0.3 }); }
  shape(c, rectPts(x - 5, y - 15, 10, 15), M(P.shadowHue, 40, 8), { seed: seed + 2, size: 'S', flat: true, rough: 0.1 });
  shape(c, rrPts(x - 10, y - 16, 5, 16, 1.5), K.rockC, { seed: seed + 3, size: 'S', sh: 1.2, rough: 0.3 });
  shape(c, rrPts(x + 5, y - 16, 5, 16, 1.5), K.rockC, { seed: seed + 4, size: 'S', sh: 1.2, rough: 0.3 });
  shape(c, rrPts(x - 12, y - 21, 24, 5.5, 1.5), K.rockC, { seed: seed + 5, size: 'S', sh: 1.2, rough: 0.3 });
}
function dryingRack(c, K, x, y, seed) {
  var i;
  gshadow(c, x, y, 30, 5, 0.3);
  [-24, 24].forEach(function (dx) { line(c, [[x + dx - 7, y], [x + dx, y - 41]], 2.6, K.wood.base, true); line(c, [[x + dx + 7, y], [x + dx, y - 41]], 2.6, K.wood.base, true); });
  line(c, [[x - 28, y - 38], [x + 28, y - 38]], 2.6, K.wood.base, true);
  for (i = 0; i < 6; i++) { var fx = x - 20 + i * 8; shape(c, [[fx - 2, y - 36], [fx + 2, y - 36], [fx + 2.6, y - 26], [fx, y - 19], [fx - 2.6, y - 26]], M(205, 14, 68), { seed: seed + i, size: 'S', sh: 1, rough: 0.2 }); }
}
function forgeObj(c, K, x, y, seed) {
  gshadow(c, x, y, 36, 7, 0.4);
  shape(c, rrPts(x - 32, y - 22, 36, 22, 4), K.rockC, { seed: seed, size: 'M', sh: 3, rough: 0.4 });
  shape(c, ellPts(x - 14, y - 22, 13, 4.6, 14), M(18, 95, 48), { seed: seed + 1, size: 'S', flat: true, rough: 0.2 });
  shape(c, [[x - 20, y - 22], [x - 18, y - 30], [x - 14, y - 25], [x - 11, y - 33], [x - 8, y - 22]], M(40, 100, 62), { seed: seed + 2, size: 'S', flat: true, rough: 0.3 });
  shape(c, rrPts(x + 9, y - 12, 14, 12, 3), K.wood, { seed: seed + 3, size: 'S', sh: 1.5, rough: 0.3 });
  shape(c, [[x + 5, y - 12], [x + 26, y - 12], [x + 31, y - 17], [x + 26, y - 20], [x + 8, y - 20], [x + 3, y - 17]], K.iron, { seed: seed + 4, size: 'S', sh: 1.5, rough: 0.15 });
  line(c, [[x + 14, y - 20], [x + 22, y - 31]], 2, K.wood.base, true);
  shape(c, rrPts(x + 18, y - 35, 9, 5, 1), K.ironLight, { seed: seed + 5, size: 'S', flat: true, rough: 0.1 });
  addLight(x - 14, y - 24, 90, 24, 100, 58, 0.9);
}
function brazierObj(c, K, x, y, seed) {
  gshadow(c, x, y, 12, 4, 0.4);
  [[-8, 0], [8, 0], [0, 2]].forEach(function (p) { line(c, [[x + p[0], y + p[1]], [x + p[0] * 0.3, y - 17]], 2, K.iron.base, true); });
  shape(c, [[x - 7, y - 22], [x - 8, y - 30], [x - 3, y - 38], [x, y - 30], [x + 3, y - 42], [x + 8, y - 28], [x + 7, y - 22]], M(24, 100, 52), { seed: seed + 1, size: 'S', flat: true, rough: 0.4 });
  shape(c, [[x - 3, y - 22], [x - 4, y - 28], [x, y - 33], [x + 3, y - 27], [x + 3, y - 22]], M(46, 100, 66), { seed: seed + 2, size: 'S', flat: true, rough: 0.3 });
  shape(c, [[x - 11, y - 23], [x + 11, y - 23], [x + 7, y - 15], [x - 7, y - 15]], K.iron, { seed: seed, size: 'S', sh: 1.5, rough: 0.2 });
  addLight(x, y - 28, 110 + 40 * P.glow, 28, 100, 58, 1);
}
function cairnObj(c, K, x, y, seed) {
  gshadow(c, x, y, 20, 5, 0.4);
  [[0, -5, 14, 6], [-7, -12, 9, 5], [6, -13, 9, 5], [0, -20, 9, 5], [0, -27, 6.5, 4], [0, -33, 4, 3]].forEach(function (s, i) {
    shape(c, blobPts(x + s[0], y + s[1], s[2], s[3], seed + i, 8, 0.2), i % 2 ? K.rockC : K.rock, { seed: seed + 10 + i, size: 'S', sh: 2, rough: 0.4 });
  });
}
function stoneShip(c, K, x, y, seed) {
  var n = 16, i, list = [];
  for (i = 0; i < n; i++) { var a = i / n * Math.PI * 2, e = Math.abs(Math.cos(a)); list.push({ x: x + Math.cos(a) * 42, y: y + Math.sin(a) * 11 * (1 - e * e * 0.55), h: 8 + 11 * e * e * e, k: i }); }
  list.sort(function (p, q) { return p.y - q.y; });
  list.forEach(function (s) {
    gshadow(c, s.x, s.y, 5, 2, 0.3);
    shape(c, [[s.x - 3, s.y], [s.x - 3.6, s.y - s.h * 0.7], [s.x, s.y - s.h], [s.x + 3.6, s.y - s.h * 0.7], [s.x + 3, s.y]], s.k % 2 ? K.rockC : K.rock, { seed: seed + s.k, size: 'S', sh: 1.5, rough: 0.35 });
  });
}
function woodpile(c, K, x, y, seed) {
  var r, i;
  gshadow(c, x, y, 24, 5, 0.35);
  line(c, [[x - 22, y], [x - 20, y - 20]], 2.4, K.wood.base, true); line(c, [[x + 22, y], [x + 20, y - 20]], 2.4, K.wood.base, true);
  for (r = 0; r < 3; r++) for (i = 0; i < 4 - r; i++) {
    var cx = x - 15 + r * 5 + i * 10, cy = y - 5 - r * 8.6;
    shape(c, ellPts(cx, cy, 5, 5, 10), K.wood, { seed: seed + r * 5 + i, size: 'S', sh: 1, rough: 0.2 });
    shape(c, ellPts(cx, cy, 2.6, 2.6, 8), K.trunkL, { seed: seed + 30 + r * 5 + i, size: 'S', flat: true, rough: 0.1 });
  }
}

/* ---------------- Viking age Scandinavia: things found in nature ---------------- */
function dark(l) { return M(P.shadowHue, 40, l == null ? 7 : l); }
function caveObj(c, K, x, y, seed) {
  longShadow(c, x, y, 92, 40); gshadow(c, x, y, 58, 9, 0.45);
  shape(c, [[x - 52, y], [x - 56, y - 30], [x - 40, y - 58], [x - 14, y - 70], [x + 16, y - 66], [x + 40, y - 52], [x + 54, y - 24], [x + 50, y]], K.rockC, { seed: seed, size: 'L', sh: 6, hl: 3, rough: 0.6 });
  shape(c, [[x + 16, y - 66], [x + 40, y - 52], [x + 54, y - 24], [x + 50, y], [x + 30, y - 22]], K.rockD, { seed: seed + 1, size: 'M', flat: true, rough: 0.5 });
  shape(c, [[x - 22, y], [x - 24, y - 20], [x - 14, y - 36], [x + 2, y - 40], [x + 14, y - 30], [x + 18, y]], dark(5), { seed: seed + 2, size: 'M', flat: true, rough: 0.35 });
  shape(c, blobPts(x - 28, y - 2, 8, 5, seed + 3, 8, 0.25), K.rock, { seed: seed + 4, size: 'S', sh: 1.5, rough: 0.3 });
  shape(c, blobPts(x + 24, y - 1, 7, 4, seed + 5, 8, 0.25), K.rockC, { seed: seed + 6, size: 'S', sh: 1.5, rough: 0.3 });
  shape(c, blobPts(x - 22, y - 60, 20, 6, seed + 7, 10, 0.4), K.moss, { seed: seed + 8, size: 'S' });
  shape(c, blobPts(x + 22, y - 60, 14, 5, seed + 9, 10, 0.4), K.moss, { seed: seed + 10, size: 'S' });
  line(c, curvePts([x - 8, y - 38], [x - 10, y - 30], [x - 7, y - 24], 5), 1.4, K.leaf.base, false);
  line(c, curvePts([x + 6, y - 38], [x + 8, y - 30], [x + 5, y - 27], 5), 1.4, K.leaf.base, false);
}
function birdNest(c, K, x, y, seed) {
  var R = rng(seed), i;
  gshadow(c, x, y, 13, 4, 0.3);
  shape(c, ellPts(x, y - 4, 11, 5.5, 14), M(34, 38, 34), { seed: seed, size: 'S', sh: 1.5, rough: 0.7 });
  shape(c, ellPts(x, y - 5, 7.4, 3.2, 12), M(30, 35, 19), { seed: seed + 1, size: 'S', flat: true, rough: 0.3 });
  [[-3, -6], [1, -5.4], [3.8, -6.6]].forEach(function (e, k) { shape(c, ellPts(x + e[0], y + e[1], 2, 2.6, 8), M(190, 24, 84), { seed: seed + 2 + k, size: 'S', sh: 0.8, rough: 0.05 }); });
  c.strokeStyle = C(32, 34, 24); c.lineWidth = 0.9; c.lineCap = 'round';
  for (i = 0; i < 9; i++) { var a = R() * 6.28; c.beginPath(); c.moveTo(x + Math.cos(a) * 9, y - 4 + Math.sin(a) * 4.4); c.lineTo(x + Math.cos(a + 0.5) * 13, y - 4 + Math.sin(a + 0.5) * 6.4); c.stroke(); }
}
function animalDen(c, K, x, y, seed) {
  gshadow(c, x, y, 32, 6, 0.35);
  shape(c, [[x - 30, y], [x - 26, y - 12], [x - 12, y - 20], [x + 6, y - 22], [x + 22, y - 14], [x + 30, y]], K.grassB, { seed: seed, size: 'M', sh: 4, hl: 2, rough: 0.5 });
  shape(c, blobPts(x - 2, y + 1, 15, 4.4, seed + 1, 10, 0.3), M(28, 36, 30), { seed: seed + 2, size: 'S', sh: 1, rough: 0.4 });
  shape(c, ellPts(x - 2, y - 6, 9, 6.6, 12), dark(5), { seed: seed + 3, size: 'S', flat: true, rough: 0.3 });
  line(c, curvePts([x - 14, y - 16], [x - 10, y - 8], [x - 13, y - 1], 5), 2, K.trunk.base, true);
  line(c, curvePts([x + 9, y - 19], [x + 10, y - 10], [x + 8, y - 4], 5), 1.8, K.trunk.base, true);
  c.fillStyle = 'rgba(20,12,16,0.55)'; [[6, 3], [11, 5], [16, 3.4]].forEach(function (p) { c.beginPath(); c.ellipse(x + p[0], y + p[1], 1.5, 1, 0, 0, 7); c.fill(); });
}
function wildHive(c, K, x, y, seed) {
  var R = rng(seed), i;
  gshadow(c, x, y, 13, 4, 0.4);
  shape(c, rrPts(x - 9, y - 30, 18, 30, 5), K.trunk, { seed: seed, size: 'M', sh: 2, rough: 0.4 });
  shape(c, ellPts(x, y - 30, 9, 3.4, 12), K.trunkL, { seed: seed + 1, size: 'S', flat: true, rough: 0.2 });
  shape(c, ellPts(x + 1, y - 16, 5, 7, 10), dark(6), { seed: seed + 2, size: 'S', flat: true, rough: 0.2 });
  shape(c, ellPts(x + 1, y - 15, 3.2, 4.6, 8), M(42, 92, 56), { seed: seed + 3, size: 'S', flat: true, rough: 0.2 });
  line(c, [[x + 1, y - 10], [x + 1.4, y - 5]], 1.3, C(42, 95, 60), false);
  for (i = 0; i < 5; i++) { var bx = x - 14 + R() * 30, by = y - 12 - R() * 28; c.fillStyle = C(46, 95, 60); c.beginPath(); c.ellipse(bx, by, 1.5, 1.1, 0, 0, 7); c.fill(); c.fillStyle = OLC; c.fillRect(bx - 0.3, by - 1, 0.7, 2); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(bx, by - 1.3, 1.3, 0.7, 0, 0, 7); c.fill(); }
}
function rockFormation(c, K, x, y, seed) {
  longShadow(c, x, y, 44, 30); gshadow(c, x + 2, y, 32, 7, 0.4);
  shape(c, [[x + 4, y], [x + 6, y - 28], [x + 16, y - 38], [x + 26, y - 30], [x + 28, y]], K.rock, { seed: seed + 1, size: 'M', sh: 4, rough: 0.5 });
  shape(c, [[x - 20, y], [x - 24, y - 30], [x - 14, y - 52], [x - 2, y - 56], [x + 6, y - 40], [x + 8, y]], K.rockC, { seed: seed, size: 'L', sh: 5, hl: 2.5, rough: 0.5 });
  shape(c, [[x - 10, y + 2], [x - 12, y - 12], [x - 2, y - 18], [x + 8, y - 12], [x + 8, y + 2]], K.rockC, { seed: seed + 2, size: 'M', sh: 3, rough: 0.5 });
  shape(c, blobPts(x - 27, y - 3, 7, 5, seed + 3, 8, 0.25), K.rock, { seed: seed + 4, size: 'S', sh: 1.5, rough: 0.3 });
  shape(c, blobPts(x - 12, y - 50, 10, 4, seed + 5, 10, 0.4), K.moss, { seed: seed + 6, size: 'S' });
  line(c, [[x - 14, y - 40], [x - 8, y - 22]], 1.2, OLC, false);
}
function wildHerbs(c, K, x, y, seed) {
  var R = rng(seed), i, hue = [60, 48, 285, 330][Math.floor(R() * 4)];
  gshadow(c, x, y, 11, 3, 0.25);
  for (i = 0; i < 7; i++) {
    var bx = x - 9 + R() * 18, h = 12 + R() * 14, tx = bx + (R() - 0.5) * 8, ty = y - h;
    line(c, curvePts([bx, y], [bx + (R() - 0.5) * 5, y - h * 0.5], [tx, ty], 5), 1.3, K.leaf.base, false);
    c.fillStyle = K.leaf.hl; c.beginPath(); c.ellipse((bx + tx) / 2 + 2, y - h * 0.5, 2.6, 1.2, 0.5, 0, 7); c.fill(); c.beginPath(); c.ellipse((bx + tx) / 2 - 2, y - h * 0.4, 2.6, 1.2, -0.5, 0, 7); c.fill();
    c.fillStyle = C(hue, hue === 60 ? 20 : 70, 86); for (var k = 0; k < 4; k++) { c.beginPath(); c.arc(tx + (R() - 0.5) * 4, ty + (R() - 0.5) * 3, 1.1, 0, 7); c.fill(); }
  }
}
function springObj(c, K, x, y, seed) {
  var i;
  gshadow(c, x, y, 28, 6, 0.3);
  [[-16, -9, 7, 5], [-4, -12, 8, 6], [10, -10, 7, 5], [19, -5, 5, 4]].forEach(function (s, k) { shape(c, blobPts(x + s[0], y + s[1], s[2], s[3], seed + k, 8, 0.25), k % 2 ? K.rock : K.rockC, { seed: seed + 10 + k, size: 'S', sh: 1.5, rough: 0.35 }); });
  shape(c, ribbon(curvePts([x + 8, y - 1], [x + 22, y + 6], [x + 38, y + 5], 7), 7, 3), K.waterL, { seed: seed + 5, size: 'S', flat: true, rough: 0.3 });
  shape(c, blobPts(x, y - 3, 20, 7, seed + 6, 12, 0.18), K.waterL, { seed: seed + 7, size: 'S', flat: true, rough: 0.2 });
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1; for (i = 0; i < 3; i++) { c.beginPath(); c.ellipse(x - 4, y - 5, 3 + i * 3.4, 1.2 + i * 1.3, 0, 0, 7); c.stroke(); }
  [[-21, 0, 5, 3.4], [-12, 3, 4, 3]].forEach(function (s, k) { shape(c, blobPts(x + s[0], y + s[1], s[2], s[3], seed + 20 + k, 8, 0.25), K.rockC, { seed: seed + 30 + k, size: 'S', sh: 1.2, rough: 0.3 }); });
  addLight(x, y - 4, 34, 196, 70, 70, 0.25);
}
function fallenTree(c, K, x, y, seed) {
  var i;
  gshadow(c, x + 4, y, 50, 6, 0.35);
  [[-6, -30, 1], [16, -28, -1], [32, -22, 1]].forEach(function (b) { line(c, [[x + b[0], y - 12], [x + b[0] + b[2] * 5, y + b[1]]], 2.6, K.trunk.base, true); });
  shape(c, ribbon(curvePts([x - 34, y - 9], [x, y - 13], [x + 46, y - 6], 8), 13, 7), K.trunk, { seed: seed, size: 'M', sh: 3, rough: 0.4 });
  for (i = 0; i < 5; i++) { var a = -1.9 + i * 0.75; line(c, [[x - 37, y - 11], [x - 37 + Math.cos(a) * 13, y - 11 + Math.sin(a) * 15]], 2.4, K.trunk.base, true); }
  shape(c, blobPts(x - 37, y - 11, 8, 11, seed + 1, 10, 0.3), K.trunk, { seed: seed + 2, size: 'S', sh: 2, rough: 0.5 });
  shape(c, blobPts(x + 6, y - 17, 14, 3.6, seed + 3, 10, 0.4), K.moss, { seed: seed + 4, size: 'S' });
  [[20, -14], [24, -13]].forEach(function (m, k) { line(c, [[x + m[0], y + m[1]], [x + m[0], y + m[1] - 4]], 1.2, C(40, 30, 82), false); shape(c, ellPts(x + m[0], y + m[1] - 5, 3 - k * 0.6, 1.8, 8), M(18, 60, 46), { seed: seed + 6 + k, size: 'S', sh: 0.8, rough: 0.1 }); });
}

/* ---------------- things people left out in the wild ---------------- */
function animalTrap(c, K, x, y, seed) {
  gshadow(c, x, y, 22, 5, 0.35);
  line(c, [[x + 10, y], [x + 12, y - 18]], 2.2, K.wood.base, true);
  line(c, [[x - 6, y - 5], [x + 13, y - 11]], 1.8, K.wood.base, true);
  shape(c, [[x - 20, y - 1], [x - 15, y - 10], [x + 15, y - 25], [x + 21, y - 17], [x - 12, y + 1]], K.rockC, { seed: seed, size: 'M', sh: 3, rough: 0.4 });
  c.fillStyle = C(6, 70, 48); c.beginPath(); c.arc(x - 5, y - 4, 1.8, 0, 7); c.fill();
  [[-22, 2], [20, 3]].forEach(function (p, k) { shape(c, blobPts(x + p[0], y + p[1], 4, 2.6, seed + 2 + k, 8, 0.25), K.rock, { seed: seed + 4 + k, size: 'S', sh: 1, rough: 0.3 }); });
}
function huntingBlind(c, K, x, y, seed) {
  var R = rng(seed), i;
  gshadow(c, x, y, 32, 6, 0.35);
  [-24, 0, 24].forEach(function (dx) { line(c, [[x + dx, y], [x + dx * 0.9, y - 30]], 2.2, K.trunk.base, true); });
  var d = shape(c, [[x - 30, y], [x - 31, y - 20], [x - 16, y - 30], [x + 4, y - 32], [x + 22, y - 27], [x + 31, y - 13], [x + 29, y]], K.leaf, { seed: seed, size: 'M', sh: 4, rough: 0.8 });
  c.save(); path(c, d); c.clip(); c.lineCap = 'round';
  for (i = 0; i < 22; i++) { var bx = x - 30 + R() * 60, by = y - R() * 30; c.strokeStyle = i % 3 ? K.trunk.base : K.leaf.hl; c.globalAlpha = 0.7; c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 8 + R() * 8, by - 3 + R() * 6); c.stroke(); }
  c.restore();
  shape(c, rrPts(x - 7, y - 20, 14, 4, 1.5), dark(6), { seed: seed + 1, size: 'S', flat: true, rough: 0.2 });
}
function fishingNet(c, K, x, y, seed) {
  var i;
  gshadow(c, x, y, 30, 5, 0.3);
  line(c, [[x - 26, y], [x - 26, y - 44]], 2.6, K.wood.base, true); line(c, [[x + 26, y], [x + 26, y - 44]], 2.6, K.wood.base, true);
  var top = curvePts([x - 26, y - 42], [x, y - 34], [x + 26, y - 42], 10), bot = curvePts([x + 24, y - 8], [x, y - 3], [x - 24, y - 8], 10), net = top.concat(bot);
  c.save(); path(c, net); c.fillStyle = 'rgba(200,190,160,0.14)'; c.fill(); c.clip();
  c.strokeStyle = 'rgba(225,215,185,0.75)'; c.lineWidth = 0.8;
  for (i = -70; i < 70; i += 6) { c.beginPath(); c.moveTo(x + i, y - 46); c.lineTo(x + i + 30, y); c.stroke(); c.beginPath(); c.moveTo(x + i + 30, y - 46); c.lineTo(x + i, y); c.stroke(); }
  c.restore();
  line(c, top, 1.6, C(40, 30, 62), false);
  for (i = 1; i < 10; i += 2) shape(c, ellPts(top[i][0], top[i][1], 2.2, 1.6, 8), K.trunkL, { seed: seed + i, size: 'S', flat: true, rough: 0.1 });
}
function fishWeir(c, K, x, y, seed) {
  var i, pts = [];
  c.save(); c.fillStyle = 'hsla(196,60%,60%,0.2)'; c.beginPath(); c.ellipse(x, y - 2, 44, 12, 0, 0, 7); c.fill(); c.restore();
  for (i = 0; i <= 10; i++) { var u = i / 10, px = x - 38 + u * 76, py = y - 10 + (1 - Math.abs(u - 0.5) * 2) * 13; pts.push([px, py]); }
  line(c, pts.map(function (p) { return [p[0], p[1] - 5]; }), 1.3, C(34, 36, 40), false);
  line(c, pts.map(function (p) { return [p[0], p[1] - 10]; }), 1.3, C(34, 36, 40), false);
  pts.forEach(function (p, k) { shape(c, rrPts(p[0] - 1.6, p[1] - 15, 3.2, 15, 1), K.wood, { seed: seed + k, size: 'S', sh: 0.8, rough: 0.2 }); });
  c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 0.9; for (i = 0; i < 3; i++) { c.beginPath(); c.ellipse(x - 14 + i * 14, y + 6, 5, 1.4, 0, 0, 7); c.stroke(); }
}
function trailStone(c, K, x, y, seed) {
  gshadow(c, x, y, 11, 4, 0.4);
  shape(c, [[x - 7, y], [x - 8, y - 16], [x - 3, y - 26], [x + 4, y - 25], [x + 8, y - 14], [x + 7, y]], K.rockC, { seed: seed, size: 'S', sh: 2.5, hl: 1.5, rough: 0.35 });
  c.strokeStyle = C(8, 72, 46); c.lineWidth = 1.5; c.lineCap = 'round';
  c.beginPath(); c.arc(x, y - 17, 3, 0, 7); c.stroke(); c.beginPath(); c.moveTo(x - 4, y - 8); c.lineTo(x + 4, y - 8); c.lineTo(x + 1.5, y - 10.5); c.moveTo(x + 4, y - 8); c.lineTo(x + 1.5, y - 5.5); c.stroke();
  shape(c, blobPts(x + 9, y - 1, 4.4, 3, seed + 1, 8, 0.25), K.rock, { seed: seed + 2, size: 'S', sh: 1, rough: 0.3 });
  shape(c, blobPts(x - 9, y, 3.6, 2.6, seed + 3, 8, 0.25), K.rockC, { seed: seed + 4, size: 'S', sh: 1, rough: 0.3 });
}
function charcoalPit(c, K, x, y, seed) {
  var i;
  gshadow(c, x, y, 36, 7, 0.4);
  shape(c, [[x - 30, y], [x - 26, y - 16], [x - 12, y - 27], [x + 8, y - 28], [x + 24, y - 18], [x + 30, y]], M(28, 20, 17), { seed: seed, size: 'M', sh: 4, rough: 0.5 });
  shape(c, blobPts(x - 12, y - 22, 12, 4, seed + 1, 10, 0.4), K.moss, { seed: seed + 2, size: 'S' });
  shape(c, blobPts(x + 16, y - 12, 9, 3.4, seed + 3, 10, 0.4), K.moss, { seed: seed + 4, size: 'S' });
  [[-18, -8], [-2, -5], [14, -7]].forEach(function (p) { c.fillStyle = C(20, 100, 54); c.beginPath(); c.ellipse(x + p[0], y + p[1], 2.4, 1.5, 0, 0, 7); c.fill(); });
  for (i = 0; i < 5; i++) { c.save(); c.globalAlpha = 0.2 - i * 0.03; c.fillStyle = '#d9dde6'; c.beginPath(); c.arc(x + 2 + i * 2.4, y - 32 - i * 7, 5 + i * 2.2, 0, 7); c.fill(); c.restore(); }
  for (i = 0; i < 3; i++) { shape(c, ellPts(x + 36 + i * 0, y - 4 - i * 6, 4.4, 4.4, 10), K.wood, { seed: seed + 6 + i, size: 'S', sh: 1, rough: 0.2 }); }
  addLight(x - 2, y - 8, 46, 22, 100, 56, 0.45);
}
function beeSkeps(c, K, x, y, seed) {
  var R = rng(seed), i;
  gshadow(c, x, y, 26, 5, 0.35);
  [-22, 19].forEach(function (dx, k) { shape(c, rrPts(x + dx, y - 12, 3.4, 12, 1), K.wood, { seed: seed + k, size: 'S', sh: 1, rough: 0.2 }); });
  shape(c, rrPts(x - 25, y - 15, 50, 4, 1.5), K.wood, { seed: seed + 2, size: 'S', sh: 1, rough: 0.2 });
  [-15, 0, 15].forEach(function (dx, k) {
    var cx = x + dx, by = y - 15, d = shape(c, [[cx - 7, by], [cx - 7, by - 8], [cx - 4, by - 14], [cx, by - 16], [cx + 4, by - 14], [cx + 7, by - 8], [cx + 7, by]], M(44, 60, 56), { seed: seed + 3 + k, size: 'S', sh: 1.5, rough: 0.2 });
    c.save(); path(c, d); c.clip(); c.strokeStyle = C(40, 55, 36); c.globalAlpha = 0.6; c.lineWidth = 0.9; for (i = 3; i < 16; i += 3) { c.beginPath(); c.moveTo(cx - 8, by - i); c.lineTo(cx + 8, by - i); c.stroke(); } c.restore();
    c.fillStyle = OLC; c.beginPath(); c.ellipse(cx, by - 3, 1.6, 1.3, 0, 0, 7); c.fill();
  });
  for (i = 0; i < 5; i++) { var bx = x - 24 + R() * 48, by2 = y - 24 - R() * 16; c.fillStyle = C(46, 95, 60); c.beginPath(); c.ellipse(bx, by2, 1.4, 1, 0, 0, 7); c.fill(); c.fillStyle = OLC; c.fillRect(bx - 0.3, by2 - 0.9, 0.7, 1.8); }
}
function woodenBridge(c, K, x, y, seed) {
  var i;
  gshadow(c, x, y + 2, 46, 6, 0.3);
  function arch(u) { return -7 * (1 - u * u); }
  for (i = 0; i < 11; i++) { var u = (i - 5) / 5.5; shape(c, rrPts(x - 44 + i * 8, y - 8 + arch(u), 7.4, 17, 1.2), K.wood, { seed: seed + i, size: 'S', sh: 1, rough: 0.25 }); }
  [-8, 9].forEach(function (dy, k) {
    var rail = [], j; for (j = 0; j <= 10; j++) { var u2 = (j - 5) / 5; rail.push([x - 42 + j * 8.4, y + dy - 12 + arch(u2)]); }
    [0, 5, 10].forEach(function (j2) { line(c, [[rail[j2][0], rail[j2][1] + 12], [rail[j2][0], rail[j2][1] - 1]], 2.4, K.wood.base, true); });
    line(c, rail, 2.2, K.wood.base, true);
  });
}
function farmland(c, K, x, y, seed) {
  var R = rng(seed), i, soil = M(28, 38, 23);
  var d = shape(c, [[x - 52, y + 6], [x - 45, y - 22], [x + 45, y - 22], [x + 52, y + 6]], soil, { seed: seed, size: 'M', sh: 1.5, rough: 0.5, flat: true });
  c.save(); path(c, d); c.clip();
  c.strokeStyle = C(26, 40, 13); c.lineWidth = 1.6; c.globalAlpha = 0.7;
  for (i = 0; i < 7; i++) { var yy = y - 19 + i * 4; c.beginPath(); c.moveTo(x - 54, yy); c.lineTo(x + 54, yy); c.stroke(); }
  c.globalAlpha = 1; c.strokeStyle = K.leaf.hl; c.lineWidth = 1.1; c.lineCap = 'round';
  for (i = 0; i < 60; i++) { var sx = x - 46 + R() * 92, sy = y - 17 + Math.floor(R() * 6) * 4; c.beginPath(); c.moveTo(sx - 1.6, sy - 2.6); c.lineTo(sx, sy); c.lineTo(sx + 1.6, sy - 2.6); c.stroke(); }
  c.restore();
}

/* ---------------- things people built ---------------- */
function beachedBoat(c, K, x, y, seed) {
  gshadow(c, x, y, 42, 6, 0.4);
  line(c, [[x - 8, y - 2], [x + 30, y - 30]], 1.8, K.wood.hl, true);
  var d = shape(c, [[x - 20, y], [x - 34, y - 8], [x - 40, y - 26], [x - 35, y - 28], [x - 24, y - 17], [x + 24, y - 17], [x + 35, y - 28], [x + 40, y - 26], [x + 34, y - 8], [x + 20, y]], K.wood, { seed: seed, size: 'M', sh: 3, rough: 0.25 });
  c.save(); path(c, d); c.clip(); c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,9%,0.5)'; c.lineWidth = 1;
  [-12, -7].forEach(function (dy) { c.beginPath(); c.moveTo(x - 38, y + dy - 8); c.quadraticCurveTo(x, y + dy + 6, x + 38, y + dy - 8); c.stroke(); });
  c.restore();
  line(c, curvePts([x - 38, y - 27], [x - 41, y - 33], [x - 37, y - 35], 4), 2.2, K.wood.base, true);
  line(c, curvePts([x + 38, y - 27], [x + 41, y - 33], [x + 37, y - 35], 4), 2.2, K.wood.base, true);
  [[-24, 2], [22, 2]].forEach(function (p, k) { shape(c, blobPts(x + p[0], y + p[1], 5, 3, seed + 2 + k, 8, 0.25), K.rockC, { seed: seed + 4 + k, size: 'S', sh: 1, rough: 0.3 }); });
}
function plankLines(c, d, x0, x1, y0, y1, step) { c.save(); path(c, d); c.clip(); c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,9%,0.4)'; c.lineWidth = 1; for (var i = x0; i < x1; i += step) { c.beginPath(); c.moveTo(i, y0); c.lineTo(i, y1); c.stroke(); } c.restore(); }
function storageHut(c, K, x, y, seed) {
  var R = rng(seed), i;
  longShadow(c, x, y, 50, 30); gshadow(c, x, y, 28, 6, 0.4);
  [-18, 14].forEach(function (dx, k) { shape(c, blobPts(x + dx + 2, y - 1, 5, 3, seed + k, 8, 0.2), K.rockC, { seed: seed + 2 + k, size: 'S', sh: 1, rough: 0.3 }); shape(c, rrPts(x + dx, y - 12, 4, 11, 1), K.wood, { seed: seed + 4 + k, size: 'S', sh: 1, rough: 0.2 }); });
  var w = shape(c, rrPts(x - 23, y - 38, 46, 27, 2), K.wood, { seed: seed + 6, size: 'M', sh: 3, rough: 0.3 });
  plankLines(c, w, x - 20, x + 24, y - 38, y - 11, 7);
  shape(c, rrPts(x - 5, y - 30, 10, 19, 1.5), dark(9), { seed: seed + 7, size: 'S', flat: true, rough: 0.15 });
  var rf = shape(c, [[x - 29, y - 35], [x, y - 58], [x + 29, y - 35]], K.grassB, { seed: seed + 8, size: 'M', sh: 4, hl: 2, rough: 0.5 });
  c.save(); path(c, rf); c.clip(); c.strokeStyle = K.leaf.hl; c.globalAlpha = 0.6; c.lineWidth = 1; for (i = 0; i < 16; i++) { var gx = x - 24 + R() * 48, gy = y - 37 - R() * 16; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + (R() - 0.5) * 3, gy - 4); c.stroke(); } c.restore();
  line(c, [[x - 30, y - 35], [x + 30, y - 35]], 2.4, K.wood.base, true);
  shape(c, rrPts(x - 8, y - 6, 16, 5, 2), K.wood, { seed: seed + 9, size: 'S', sh: 1, rough: 0.2 });
}
function boathouse(c, K, x, y, seed) {
  var R = rng(seed), i;
  longShadow(c, x, y, 92, 44); gshadow(c, x, y, 52, 8, 0.45);
  var rf = shape(c, [[x - 46, y - 2], [x - 30, y - 48], [x + 30, y - 48], [x + 46, y - 2]], K.grassB, { seed: seed, size: 'L', sh: 5, hl: 3, rough: 0.5 });
  c.save(); path(c, rf); c.clip(); c.strokeStyle = K.leaf.hl; c.globalAlpha = 0.55; c.lineWidth = 1; for (i = 0; i < 30; i++) { var gx = x - 42 + R() * 84, gy = y - 6 - R() * 38; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + (R() - 0.5) * 3, gy - 4.4); c.stroke(); } c.restore();
  shape(c, [[x - 24, y], [x - 24, y - 20], [x, y - 38], [x + 24, y - 20], [x + 24, y]], dark(7), { seed: seed + 1, size: 'M', flat: true, rough: 0.2 });
  line(c, curvePts([x - 3, y], [x - 5, y - 16], [x + 2, y - 28], 6), 3.4, K.wood.base, true);
  line(c, curvePts([x + 2, y - 28], [x + 7, y - 33], [x + 4, y - 26], 4), 2.2, K.wood.base, true);
  shape(c, [[x - 14, y], [x - 9, y - 8], [x + 5, y - 8], [x + 10, y]], K.wood, { seed: seed + 2, size: 'S', sh: 1.5, rough: 0.2 });
  line(c, [[x - 26, y], [x - 1, y - 41]], 3, K.wood.base, true); line(c, [[x + 26, y], [x + 1, y - 41]], 3, K.wood.base, true);
  line(c, [[x - 1, y - 41], [x + 6, y - 53]], 2.6, K.wood.base, true); line(c, [[x + 1, y - 41], [x - 6, y - 53]], 2.6, K.wood.base, true);
  [[-44, 0], [44, 0]].forEach(function (p, k) { shape(c, blobPts(x + p[0], y + p[1] - 2, 6, 4, seed + 4 + k, 8, 0.25), K.rockC, { seed: seed + 6 + k, size: 'S', sh: 1.2, rough: 0.3 }); });
}
function watchtower(c, K, x, y, seed) {
  var i;
  longShadow(c, x, y, 34, 40); gshadow(c, x, y, 22, 5, 0.4);
  line(c, [[x - 12, y - 4], [x - 9, y - 58]], 2.6, K.wood.shade, true); line(c, [[x + 12, y - 4], [x + 9, y - 58]], 2.6, K.wood.shade, true);
  line(c, [[x - 15, y - 20], [x + 13, y - 44]], 1.8, K.wood.base, true); line(c, [[x + 15, y - 20], [x - 13, y - 44]], 1.8, K.wood.base, true);
  line(c, [[x - 17, y], [x - 11, y - 60]], 3, K.wood.base, true); line(c, [[x + 17, y], [x + 11, y - 60]], 3, K.wood.base, true);
  line(c, [[x + 22, y], [x + 16, y - 62]], 1.6, K.wood.hl, true); line(c, [[x + 28, y], [x + 22, y - 62]], 1.6, K.wood.hl, true);
  for (i = 0; i < 7; i++) line(c, [[x + 21.4 - i * 0.86, y - 6 - i * 8.6], [x + 27.4 - i * 0.86, y - 6 - i * 8.6]], 1.3, K.wood.hl, false);
  shape(c, rrPts(x - 18, y - 65, 36, 6, 1.5), K.wood, { seed: seed, size: 'S', sh: 1.5, rough: 0.2 });
  [-16, 0, 14].forEach(function (dx, k) { shape(c, rrPts(x + dx, y - 77, 2.6, 12, 1), K.wood, { seed: seed + 1 + k, size: 'S', flat: true, rough: 0.2 }); });
  line(c, [[x - 17, y - 76], [x + 17, y - 76]], 2, K.wood.base, true);
  shape(c, [[x - 21, y - 86], [x, y - 100], [x + 21, y - 86]], M(46, 46, 44), { seed: seed + 4, size: 'M', sh: 3, rough: 0.5 });
  [-15, 15].forEach(function (dx) { line(c, [[x + dx, y - 76], [x + dx, y - 87]], 2, K.wood.base, true); });
}
function stoneHearth(c, K, x, y, seed) {
  var i;
  gshadow(c, x, y, 24, 6, 0.4);
  for (i = 0; i < 10; i++) { var a = i / 10 * 6.28; shape(c, ellPts(x + Math.cos(a) * 16, y - 3 + Math.sin(a) * 6, 4.4, 3.2, 8), i % 2 ? K.rockC : K.rock, { seed: seed + i, size: 'S', sh: 1, rough: 0.3 }); }
  shape(c, ellPts(x, y - 3, 11, 4, 12), M(18, 95, 46), { seed: seed + 12, size: 'S', flat: true, rough: 0.3 });
  shape(c, [[x - 5, y - 4], [x - 6, y - 11], [x - 2, y - 16], [x, y - 10], [x + 3, y - 17], [x + 6, y - 9], [x + 5, y - 4]], M(34, 100, 58), { seed: seed + 13, size: 'S', flat: true, rough: 0.4 });
  line(c, [[x - 15, y + 2], [x, y - 38]], 2, K.iron.base, true); line(c, [[x + 15, y + 2], [x, y - 38]], 2, K.iron.base, true); line(c, [[x + 2, y - 6], [x, y - 38]], 1.6, K.iron.base, true);
  line(c, [[x, y - 36], [x, y - 25]], 1, K.iron.base, false);
  shape(c, [[x - 8, y - 25], [x + 8, y - 25], [x + 6, y - 15], [x, y - 13], [x - 6, y - 15]], K.iron, { seed: seed + 14, size: 'S', sh: 1.5, rough: 0.15 });
  addLight(x, y - 10, 100 + 40 * P.glow, 28, 100, 58, 0.9);
}
function woodenWell(c, K, x, y, seed) {
  longShadow(c, x, y, 26, 26); gshadow(c, x, y, 18, 5, 0.4);
  var w = shape(c, rrPts(x - 13, y - 15, 26, 15, 1.5), K.wood, { seed: seed, size: 'M', sh: 2, rough: 0.3 });
  plankLines(c, w, x - 9, x + 13, y - 15, y, 6);
  shape(c, ellPts(x, y - 15, 13, 4.4, 14), K.trunkL, { seed: seed + 1, size: 'S', sh: 1, rough: 0.2 });
  shape(c, ellPts(x, y - 15, 9, 2.8, 12), dark(10), { seed: seed + 2, size: 'S', flat: true, rough: 0.1 });
  line(c, [[x + 24, y], [x + 24, y - 44]], 3, K.wood.base, true);
  line(c, [[x + 42, y - 30], [x - 2, y - 60]], 2.4, K.wood.base, true);
  shape(c, blobPts(x + 42, y - 28, 5, 4, seed + 3, 8, 0.25), K.rockC, { seed: seed + 4, size: 'S', sh: 1, rough: 0.3 });
  line(c, [[x - 2, y - 60], [x - 1, y - 30]], 1, C(40, 30, 62), false);
  shape(c, [[x - 5, y - 30], [x + 3, y - 30], [x + 2, y - 23], [x - 4, y - 23]], K.wood, { seed: seed + 5, size: 'S', sh: 1, rough: 0.2 });
}

function kitSetup(params) { setup(params || {}); }
function bakeTile(type, v) {
  var cv = mk(TW * 2, TH * 2), c = cv.getContext('2d'), K = mats();
  c.setTransform(2, 0, 0, 2, 0, 0); c.lineJoin = 'round'; c.lineCap = 'round';
  var R = rng(v * 977 + type.length * 131 + type.charCodeAt(0) * 17);
  paintTile(c, K, type, v, R);
  return cv;
}
var maskCv = null, tmpCv = null;
function blendTile(dst, tileCv, side, seed) {
  if (!maskCv) { maskCv = mk(TW * 2, TH * 2); tmpCv = mk(TW * 2, TH * 2); }
  var m = maskCv.getContext('2d'), t = tmpCv.getContext('2d'), R = rng(seed), i;
  m.setTransform(2, 0, 0, 2, 0, 0); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, TW, TH);
  var n = (side === 'n' || side === 's') ? 8 : 6;
  for (i = 0; i < n; i++) {
    var along = (i + R() * 0.8) / n, r = 6 + R() * 5, px, py;
    if (side === 'n') { px = along * TW; py = R() * 2; } else if (side === 's') { px = along * TW; py = TH - R() * 2; } else if (side === 'w') { px = R() * 2; py = along * TH; } else { px = TW - R() * 2; py = along * TH; }
    var g = m.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = g; m.beginPath(); m.arc(px, py, r, 0, 7); m.fill();
  }
  t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, TW * 2, TH * 2); t.drawImage(tileCv, 0, 0);
  t.globalCompositeOperation = 'destination-in'; t.drawImage(maskCv, 0, 0); t.globalCompositeOperation = 'source-over';
  dst.drawImage(tmpCv, 0, 0, TW * 2, TH * 2, 0, 0, TW, TH);
}
var PROPS = {
  cave: { b: [-68, -82, 106, 16], f: function (c, K, s) { caveObj(c, K, 0, 0, s); } },
  birdNest: { b: [-16, -16, 18, 8], f: function (c, K, s) { birdNest(c, K, 0, 0, s); } },
  animalDen: { b: [-38, -30, 38, 10], f: function (c, K, s) { animalDen(c, K, 0, 0, s); } },
  wildHive: { b: [-20, -46, 20, 8], f: function (c, K, s) { wildHive(c, K, 0, 0, s); } },
  rockFormation: { b: [-38, -64, 62, 12], f: function (c, K, s) { rockFormation(c, K, 0, 0, s); } },
  wildHerbs: { b: [-16, -32, 16, 6], f: function (c, K, s) { wildHerbs(c, K, 0, 0, s); } },
  spring: { b: [-34, -24, 46, 16], f: function (c, K, s) { springObj(c, K, 0, 0, s); } },
  fallenTree: { b: [-56, -38, 62, 10], f: function (c, K, s) { fallenTree(c, K, 0, 0, s); } },
  animalTrap: { b: [-30, -32, 30, 8], f: function (c, K, s) { animalTrap(c, K, 0, 0, s); } },
  huntingBlind: { b: [-38, -40, 38, 8], f: function (c, K, s) { huntingBlind(c, K, 0, 0, s); } },
  fishingNet: { b: [-36, -52, 36, 8], f: function (c, K, s) { fishingNet(c, K, 0, 0, s); } },
  fishWeir: { b: [-48, -30, 48, 14], f: function (c, K, s) { fishWeir(c, K, 0, 0, s); } },
  trailStone: { b: [-16, -32, 18, 6], f: function (c, K, s) { trailStone(c, K, 0, 0, s); } },
  charcoalPit: { b: [-42, -72, 48, 10], f: function (c, K, s) { charcoalPit(c, K, 0, 0, s); } },
  beeSkeps: { b: [-32, -46, 32, 8], f: function (c, K, s) { beeSkeps(c, K, 0, 0, s); } },
  woodenBridge: { b: [-52, -34, 52, 16], f: function (c, K, s) { woodenBridge(c, K, 0, 0, s); } },
  farmland: { b: [-58, -28, 58, 12], f: function (c, K, s) { farmland(c, K, 0, 0, s); } },
  beachedBoat: { b: [-48, -40, 48, 8], f: function (c, K, s) { beachedBoat(c, K, 0, 0, s); } },
  storageHut: { b: [-36, -66, 60, 14], f: function (c, K, s) { storageHut(c, K, 0, 0, s); } },
  boathouse: { b: [-58, -66, 96, 16], f: function (c, K, s) { boathouse(c, K, 0, 0, s); } },
  watchtower: { b: [-30, -106, 60, 16], f: function (c, K, s) { watchtower(c, K, 0, 0, s); } },
  stoneHearth: { b: [-26, -44, 26, 10], f: function (c, K, s) { stoneHearth(c, K, 0, 0, s); } },
  woodenWell: { b: [-22, -66, 52, 10], f: function (c, K, s) { woodenWell(c, K, 0, 0, s); } },
  runestone: { b: [-22, -72, 40, 12], f: function (c, K, s) { runestone(c, K, 0, 0, s); } },
  longhouse: { b: [-114, -136, 182, 33], f: function (c, K, s) { c.save(); c.scale(1.35, 1.35); longhouse(c, K, 0, 0, s); c.restore(); } },
  vikingTent: { b: [-38, -64, 38, 10], f: function (c, K, s) { vikingTent(c, K, 0, 0, s); } },
  palisade: { b: [-42, -56, 42, 8], f: function (c, K, s) { palisade(c, K, 0, 0, s); } },
  shieldRack: { b: [-34, -66, 34, 8], f: function (c, K, s) { shieldRack(c, K, 0, 0, s); } },
  dragonPost: { b: [-18, -76, 28, 8], f: function (c, K, s) { dragonPost(c, K, 0, 0, s); } },
  burialMound: { b: [-62, -40, 62, 12], f: function (c, K, s) { burialMound(c, K, 0, 0, s); } },
  dryingRack: { b: [-38, -50, 38, 8], f: function (c, K, s) { dryingRack(c, K, 0, 0, s); } },
  forge: { b: [-44, -46, 44, 10], f: function (c, K, s) { forgeObj(c, K, 0, 0, s); } },
  brazier: { b: [-18, -50, 18, 8], f: function (c, K, s) { brazierObj(c, K, 0, 0, s); } },
  cairn: { b: [-26, -44, 26, 8], f: function (c, K, s) { cairnObj(c, K, 0, 0, s); } },
  stoneShip: { b: [-52, -30, 52, 18], f: function (c, K, s) { stoneShip(c, K, 0, 0, s); } },
  woodpile: { b: [-30, -34, 30, 8], f: function (c, K, s) { woodpile(c, K, 0, 0, s); } },
  snowPine: { b: [-60, -170, 100, 18], f: function (c, K, s) { snowPine(c, K, 0, 0, 128, s); } },
  snowPineBig: { b: [-80, -230, 140, 20], f: function (c, K, s) { snowPine(c, K, 0, 0, 190, s); } },
  iceCrystal: { b: [-40, -80, 50, 10], f: function (c, K, s) { iceCrystal(c, K, 0, 0, 1, s); } },
  iceCrystalBig: { b: [-60, -110, 80, 12], f: function (c, K, s) { iceCrystal(c, K, 0, 0, 1.7, s); } },
  snowRock: { b: [-34, -50, 34, 10], f: function (c, K, s) { snowRock(c, K, 0, 0, 16, s); } },
  snowBush: { b: [-34, -60, 34, 10], f: function (c, K, s) { snowBush(c, K, 0, 0, 22, s); } },
  deadTree: { b: [-80, -200, 110, 14], f: function (c, K, s) { deadTree(c, K, 0, 0, 170, s); } },
  vent: { b: [-44, -80, 50, 10], f: function (c, K, s) { vent(c, K, 0, 0, 1, s); } },
  ventBig: { b: [-70, -120, 80, 12], f: function (c, K, s) { vent(c, K, 0, 0, 1.8, s); } },
  emberRock: { b: [-34, -50, 34, 10], f: function (c, K, s) { emberRock(c, K, 0, 0, 16, s); } },
  emberBush: { b: [-34, -60, 34, 10], f: function (c, K, s) { emberBush(c, K, 0, 0, 22, s); } },
  bell: { b: [-34, -90, 40, 10], f: function (c, K, s) { bellObj(c, K, 0, 0, s); } },
  leverOff: { b: [-24, -56, 28, 8], f: function (c, K, s) { leverObj(c, K, 0, 0, s, false); } },
  leverOn: { b: [-24, -56, 28, 8], f: function (c, K, s) { leverObj(c, K, 0, 0, s, true); } },
  keyItem: { b: [-24, -36, 24, 8], f: function (c, K, s) { keyObj(c, K, 0, 0, s); } },
  gateBar: { b: [-20, -70, 20, 8], f: function (c, K, s) { gateBarObj(c, K, 0, 0, s, false); } },
  gateLock: { b: [-20, -70, 20, 8], f: function (c, K, s) { gateBarObj(c, K, 0, 0, s, true); } },
  cliff: { b: [-30, -74, 36, 10], f: function (c, K, s) { cliffObj(c, K, 0, 0, s); } },
  bed: { b: [-30, -36, 30, 8], f: function (c, K, s) { bedObj(c, K, 0, 0, s); } },
  locker: { b: [-18, -54, 18, 8], f: function (c, K, s) { lockerObj(c, K, 0, 0, s); } },
  rubble: { b: [-34, -34, 34, 10], f: function (c, K, s) { rubbleObj(c, K, 0, 0, s); } },
  brokenPillar: { b: [-26, -66, 26, 10], f: function (c, K, s) { brokenPillar(c, K, 0, 0, s); } },
  tank: { b: [-60, -140, 100, 12], f: function (c, K, s) { tankObj(c, K, 0, 0, s); } },
  pedestal: { b: [-30, -50, 34, 10], f: function (c, K, s) { pedestalObj(c, K, 0, 0, s); } },
  fuseItem: { b: [-18, -34, 18, 8], f: function (c, K, s) { fuseObj(c, K, 0, 0, s); } },
  bench: { b: [-30, -44, 30, 8], f: function (c, K, s) { benchObj(c, K, 0, 0, s); } },
  well: { b: [-30, -76, 30, 8], f: function (c, K, s) { wellObj(c, K, 0, 0, s); } },
  haystack: { b: [-30, -40, 40, 8], f: function (c, K, s) { haystackObj(c, K, 0, 0, s); } },
  cart: { b: [-40, -50, 60, 10], f: function (c, K, s) { cartObj(c, K, 0, 0, s); } },
  scarecrow: { b: [-26, -76, 26, 8], f: function (c, K, s) { scarecrowObj(c, K, 0, 0, s); } },
  ruinHouse: { b: [-56, -76, 110, 12], f: function (c, K, s) { ruinHouse(c, K, 0, 0, s); } },
  waterWheel: { b: [-50, -76, 90, 14], f: function (c, K, s) { waterWheelObj(c, K, 0, 0, s); } },
  waterfall: { b: [-56, -116, 90, 14], f: function (c, K, s) { waterfallObj(c, K, 0, 0, s); } },
  standingStone: { b: [-24, -80, 34, 8], f: function (c, K, s) { standingStone(c, K, 0, 0, s); } },
  campfire: { b: [-28, -40, 28, 8], f: function (c, K, s) { campfireObj(c, K, 0, 0, s); } },
  dock: { b: [-16, -26, 84, 26], f: function (c, K, s) { dockObj(c, K, 0, 0, s); } },
  flowerBed: { b: [-30, -50, 30, 14], f: function (c, K, s) { flowerBedObj(c, K, 0, 0, s); } },
  tallGrass: { b: [-26, -40, 26, 10], f: function (c, K, s) { tallGrassObj(c, K, 0, 0, s); } },
  mushRing: { b: [-44, -40, 44, 22], f: function (c, K, s) { mushRing(c, K, 0, 0, s); } },
  backWallDoor: { b: [0, 0, 480, 132], f: function (c, K, s) { factoryWall(c, K, s); wallGauge(c, K, 80, 88, 11, s + 61); wallGauge(c, K, 410, 82, 9, s + 62);
    var dx = 240, dw = 52, top = 34, bot = 128;
    var arch = [[dx - dw, bot], [dx - dw, top + 26], [dx - dw + 8, top + 10], [dx - dw * 0.5, top + 2], [dx, top], [dx + dw * 0.5, top + 2], [dx + dw - 8, top + 10], [dx + dw, top + 26], [dx + dw, bot]];
    var d = shape(c, arch, M(P.shadowHue, 40, 9), { seed: s, size: 'L', flat: true, rough: 0.3 });
    c.save(); path(c, d); c.clip(); var g = c.createLinearGradient(0, top, 0, bot); g.addColorStop(0, 'hsla(' + P.factoryHue.toFixed(0) + ',40%,8%,1)'); g.addColorStop(1, 'hsla(' + P.accentHue.toFixed(0) + ',70%,34%,0.9)'); c.fillStyle = g; c.fillRect(dx - dw, top, dw * 2, bot - top); c.restore();
    path(c, d); c.lineWidth = ow('L'); c.strokeStyle = OLC; c.stroke();
    shape(c, rrPts(dx - dw - 6, top + 20, 8, bot - top - 20, 2), K.iron, { seed: s + 3, size: 'M', sh: 2, rough: 0.2 }); shape(c, rrPts(dx + dw - 2, top + 20, 8, bot - top - 20, 2), K.iron, { seed: s + 4, size: 'M', sh: 2, rough: 0.2 }); } },
  chair: { b: [-14, -36, 14, 6], f: function (c, K, s) { chairObj(c, K, 0, 0, s); } },
  table: { b: [-34, -44, 44, 8], f: function (c, K, s) { tableObj(c, K, 0, 0, s); } },
  banner: { b: [-24, -84, 24, 6], f: function (c, K, s) { bannerObj(c, K, 0, 0, s); } },
  gatePost: { b: [-16, -84, 16, 8], f: function (c, K, s) { gatePostObj(c, K, 0, 0, s); } },
  lampDead: { b: [-24, -110, 70, 10], f: function (c, K, s) { lampPost(c, K, 0, 0, 92, s, 0, true); } },
  gearBig: { b: [-70, -50, 70, 20], f: function (c, K, s) { gearBigObj(c, K, 0, 0, s); } },
  steamVent: { b: [-30, -80, 30, 6], f: function (c, K, s) { steamVentObj(c, K, 0, 0, s); } },
  skylight: { b: [-130, -80, 130, 90], f: function (c, K, s) { skylightObj(c, K, 0, 0, s); } },
  engine: { b: [-96, -190, 120, 14], f: function (c, K, s) { engineObj(c, K, 0, 0, s); } },
  pillarMid: { b: [-30, -190, 90, 16], f: function (c, K, s) { pillar(c, K, 0, 0, 170, s, 26); } },
  wallTop: { b: [-20, -100, 20, 8], f: function (c, K, s) { wallPiece(c, K, s, false); } },
  wallFace: { b: [-20, -100, 20, 8], f: function (c, K, s) { wallPiece(c, K, s, true); } },
  wallCol: { b: [-14, -76, 14, 4], f: function (c, K, s) { wallColObj(c, K, 0, 0, s); } },
  pendant: { b: [-30, -214, 30, 8], f: function (c, K, s) { pendantObj(c, K, 0, 0, s); } },
  wallLamp: { b: [-24, -80, 24, 40], f: function (c, K, s) { wallLampObj(c, K, 0, 0, s); } },
  oak: { b: [-140, -280, 140, 26], f: function (c, K, s) { tree(c, K, 0, 0, 250, s, 34); } },
  pine: { b: [-60, -160, 100, 18], f: function (c, K, s) { pine(c, K, 0, 0, 128, s); } },
  pineBig: { b: [-80, -230, 140, 20], f: function (c, K, s) { pine(c, K, 0, 0, 190, s); } },
  willow: { b: [-120, -210, 150, 22], f: function (c, K, s) { willow(c, K, 0, 0, 190, s); } },
  birch: { b: [-70, -200, 90, 16], f: function (c, K, s) { birch(c, K, 0, 0, 150, s); } },
  cypress: { b: [-50, -230, 80, 14], f: function (c, K, s) { cypress(c, K, 0, 0, 170, s); } },
  ancient: { b: [-190, -330, 220, 36], f: function (c, K, s) { ancient(c, K, 0, 0, 260, s); } },
  blossom: { b: [-100, -200, 130, 18], f: function (c, K, s) { blossomTree(c, K, 0, 0, 150, s); } },
  bush: { b: [-34, -60, 34, 10], f: function (c, K, s) { bush(c, K, 0, 0, 22, s, false); } },
  berryBush: { b: [-34, -60, 34, 10], f: function (c, K, s) { bush(c, K, 0, 0, 22, s, true); } },
  fern: { b: [-34, -40, 34, 10], f: function (c, K, s) { fern(c, K, 0, 0, 22, s); } },
  log: { b: [-50, -50, 50, 14], f: function (c, K, s) { fallenLog(c, K, 0, 0, 64, s); } },
  reeds: { b: [-30, -60, 30, 10], f: function (c, K, s) { reeds(c, K, 0, 0, s); } },
  signpost: { b: [-34, -70, 34, 10], f: function (c, K, s) { signpost(c, K, 0, 0, s); } },
  bellFlower: { b: [-24, -50, 34, 10], f: function (c, K, s) { bellFlower(c, K, 0, 0, s); } },
  stump: { b: [-30, -60, 30, 10], f: function (c, K, s) { stumpLantern(c, K, 0, 0, s); } },
  rock: { b: [-34, -46, 34, 10], f: function (c, K, s) { rock(c, K, 0, 0, 16, s, s % 2 === 0); } },
  mushrooms: { b: [-30, -46, 36, 10], f: function (c, K, s) { mushroom(c, K, 0, 0, 22, s); mushroom(c, K, 15, 5, 14, s + 1); } },
  flower: { b: [-20, -44, 24, 8], f: function (c, K, s) { flower(c, K, 0, 0, s); } },
  lamp: { b: [-24, -110, 70, 10], f: function (c, K, s) { lampPost(c, K, 0, 0, 92, s); } },
  fence: { b: [-20, -50, 100, 10], f: function (c, K, s) { fence(c, K, 0, 0, 5, s); } },
  pillar: { b: [-34, -330, 110, 18], f: function (c, K, s) { pillar(c, K, 0, 0, 300, s, 30); } },
  crate: { b: [-30, -50, 40, 10], f: function (c, K, s) { crate(c, K, 0, 0, 28, s, 0); } },
  barrel: { b: [-24, -44, 26, 10], f: function (c, K, s) { barrel(c, K, 0, 0, 26, s); } },
  vat: { b: [-60, -190, 100, 14], f: function (c, K, s) { vat(c, K, 0, 0, s); } },
  conveyor: { b: [-96, -80, 96, 12], f: function (c, K, s) { conveyor(c, K, 0, 0, 98, s); } },
  workbench: { b: [-56, -80, 70, 12], f: function (c, K, s) { workbench(c, K, 0, 0, 66, s); } },
  shelf: { b: [-52, -112, 52, 10], f: function (c, K, s) { shelfUnit(c, K, 0, 0, 56, 78, s); } },
  furnace: { b: [-62, -190, 100, 14], f: function (c, K, s) { furnace(c, K, 0, 0, s); } },
  valve: { b: [-26, -120, 50, 8], f: function (c, K, s) { valvePipe(c, K, 0, 0, 96, s); } },
  console: { b: [-50, -70, 50, 10], f: function (c, K, s) { consolePanel(c, K, 0, 0, s); } },
  cable: { b: [-30, -34, 70, 10], f: function (c, K, s) { cableCoil(c, K, 0, 0, s); } },
  scrap: { b: [-50, -44, 50, 12], f: function (c, K, s) { scrap(c, K, 0, 0, s); } },
  wallBlock: { b: [-26, -80, 40, 10], f: function (c, K, s) {
    gshadow(c, 4, 4, 22, 5, 0.4);
    shape(c, [[-18, 0], [-18, -52], [18, -52], [18, 0]], K.wall, { seed: s, size: 'L', sh: 4, rough: 0.2 });
    shape(c, [[-18, -52], [-12, -60], [24, -60], [18, -52]], K.ironLight, { seed: s + 1, size: 'M', sh: 1.5, rough: 0.2 });
    shape(c, [[18, 0], [24, -8], [24, -60], [18, -52]], K.wallDark, { seed: s + 2, size: 'M', flat: true, rough: 0.2 });
    c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,9%,0.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-18, -26); c.lineTo(18, -26); c.stroke();
  } },
  backWall: { b: [0, 0, 480, 132], f: function (c, K, s) { factoryWall(c, K, s); wallGauge(c, K, 120, 88, 11, s + 61); wallGauge(c, K, 236, 82, 9, s + 62); } },
  hangLamp: { b: [-24, -4, 24, 90], f: function (c, K, s) { hangingLamp(c, K, 0, 0, 40, s); } }
};
function bakeProp(name, seed, opts) {
  opts = opts || {};
  var def = PROPS[name], b = def.b, w = b[2] - b[0], h = b[3] - b[1], sv = null;
  if (opts.vary) {
    sv = { b: P.bright, s: P.sat, ns: P.noShadow, oh: P.outsideHue, fh: P.factoryHue };
    var vr = rng(seed * 53 + 11); P.bright += (vr() - 0.5) * 5; P.sat *= 0.92 + vr() * 0.16; P.outsideHue += (vr() - 0.5) * 14; P.factoryHue += (vr() - 0.5) * 10; P.noShadow = true;
  }
  // opts.sx / opts.sy stretch the prop at bake time, so a resized prop stays sharp
  var sx = opts.sx || 1, sy = opts.sy || 1;
  var cv = mk(Math.ceil(w * 2 * sx), Math.ceil(h * 2 * sy)), c = cv.getContext('2d');
  c.setTransform(2 * sx, 0, 0, 2 * sy, -b[0] * 2 * sx, -b[1] * 2 * sy); c.lineJoin = 'round'; c.lineCap = 'round';
  lights.length = 0; def.f(c, mats(), seed);
  var L = lights.map(function (l) { return { x: l.x * sx, y: l.y * sy, r: l.r * Math.max(sx, sy), h: l.h, s: l.s, l: l.l, a: l.a }; });
  if (sv) { P.bright = sv.b; P.sat = sv.s; P.noShadow = sv.ns; P.outsideHue = sv.oh; P.factoryHue = sv.fh; }
  return { cv: cv, l: b[0] * sx, t: b[1] * sy, w: w * sx, h: h * sy, lights: L };
}

function waterShimmer(c, x, y, t, seed) {
  var R = rng(seed);
  c.save(); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.9; c.lineCap = 'round';
  for (var i = 0; i < 2; i++) { var px = x + 4 + R() * 24 + Math.sin(t * 1.3 + seed + i) * 3, py = y + 4 + R() * 16, ph = (t * 0.8 + R() * 6) % 1; c.globalAlpha = Math.sin(ph * Math.PI) * 0.6; c.beginPath(); c.ellipse(px, py, 2 + ph * 4, 0.8 + ph * 1.4, 0, 0, 7); c.stroke(); }
  c.restore();
}

var scratch = null;
function finish(c, kind) {
  var amb = clamp(P.light + (kind === 'factory' ? -0.1 : 0.16), 0.05, 1);
  if (!scratch) scratch = mk(W * 2, H * 2);
  var d = scratch.getContext('2d'), i;
  // fog
  var R = rng(P.seed * 17 + 3);
  if (P.fog > 0.02) {
    for (i = 0; i < 16; i++) {
      var fx = R() * W, fy = H * 0.35 + R() * H * 0.7, fr = 70 + R() * 90;
      var g = c.createRadialGradient(fx, fy, 0, fx, fy, fr);
      g.addColorStop(0, 'hsla(' + mixHue(P.shadowHue, P.outsideHue, kind === 'factory' ? 0 : 0.4).toFixed(0) + ',30%,' + (kind === 'factory' ? 52 : 70) + '%,' + ((kind === 'factory' ? 0.2 : 0.13) * P.fog) + ')'); g.addColorStop(1, 'hsla(0,0%,60%,0)');
      c.fillStyle = g; c.fillRect(fx - fr, fy - fr, fr * 2, fr * 2);
    }
  }
  // darkness with light holes
  var dark = clamp(1 - amb, 0, 1) * 0.7;
  if (dark > 0.01) {
    d.setTransform(2, 0, 0, 2, 0, 0); d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, W, H);
    d.fillStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',55%,14%,' + dark + ')'; d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = 'destination-out';
    lights.forEach(function (l) {
      var gg = d.createRadialGradient(l.x, l.y, l.r * 0.05, l.x, l.y, l.r);
      gg.addColorStop(0, 'rgba(0,0,0,' + clamp(0.95 * l.a, 0, 1) + ')'); gg.addColorStop(0.5, 'rgba(0,0,0,' + clamp(0.55 * l.a, 0, 1) + ')'); gg.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = gg; d.beginPath(); d.arc(l.x, l.y, l.r, 0, 7); d.fill();
    });
    c.drawImage(scratch, 0, 0, W, H);
  }
  // glow
  lights.forEach(function (l) { glowSpot(c, l.x, l.y, l.r * 0.7, 'hsla(' + l.h.toFixed(0) + ',' + l.s + '%,' + l.l + '%,__A__)', 0.34 * P.glow * l.a); });
  sparkles(c, kind);
  if (P.look !== 0) {
    var Rg = rng(P.seed * 41 + 9), gi, nsh = 3;
    if (P.look === 1) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (gi = 0; gi < nsh; gi++) {
        var sx0 = (kind === 'factory' ? 40 : 10) + gi * (W / nsh) + Rg() * 40, sw = 70 + Rg() * 60, sl = H * 0.95;
        var lg = c.createLinearGradient(sx0, 0, sx0 + sl * 0.45, sl); var sc = kind === 'factory' ? P.accentHue : mixHue(P.accentHue, 70, 0.4);
        lg.addColorStop(0, 'hsla(' + sc.toFixed(0) + ',70%,70%,' + (0.075 * P.glow) + ')'); lg.addColorStop(1, 'hsla(' + sc.toFixed(0) + ',70%,70%,0)');
        c.fillStyle = lg; c.beginPath(); c.moveTo(sx0, 0); c.lineTo(sx0 + sw, 0); c.lineTo(sx0 + sw + sl * 0.45, sl); c.lineTo(sx0 + sl * 0.45 - sw * 0.3, sl); c.closePath(); c.fill();
      }
      c.restore();
    }
    var ng = Math.round(2600 * P.texture);
    for (gi = 0; gi < ng; gi++) { c.fillStyle = Rg() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'; c.fillRect(Rg() * W, Rg() * H, 1 + Rg() * 1.4, 1 + Rg() * 1.4); }
  }
  // vignette
  if (P.vignette > 0.02) {
    var vg = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62);
    vg.addColorStop(0, 'hsla(' + P.shadowHue.toFixed(0) + ',40%,6%,0)'); vg.addColorStop(1, 'hsla(' + P.shadowHue.toFixed(0) + ',40%,6%,' + (0.75 * P.vignette) + ')');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
  }
}

var cacheF = null, cacheO = null, cacheM = null;
function archPoly(x, y, w, h) {
  var hw = w / 2, pts = [[x - hw, y], [x - hw, y - h * 0.55]], i, n = 22;
  for (i = 0; i <= n; i++) { var a = Math.PI + i / n * Math.PI; pts.push([x + Math.cos(a) * hw, (y - h * 0.55) + Math.sin(a) * h * 0.45]); }
  pts.push([x + hw, y - h * 0.55]); pts.push([x + hw, y]);
  return pts;
}
var pbuf = null;
function pixelate(src, dst) {
  var PW = 240, PH = 150, small = mk(PW, PH), sc = small.getContext('2d');
  sc.imageSmoothingEnabled = true; sc.clearRect(0, 0, PW, PH); sc.drawImage(src, 0, 0, PW, PH);
  var id = sc.getImageData(0, 0, PW, PH), d = id.data, x, y, ch, i, lv = 9;
  var B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  for (y = 0; y < PH; y++) for (x = 0; x < PW; x++) {
    i = (y * PW + x) * 4; var t = (B[y & 3][x & 3] - 7.5) / 16 * (255 / (lv - 1)) * 0.55;
    for (ch = 0; ch < 3; ch++) { var v = clamp(d[i + ch] + t, 0, 255); d[i + ch] = Math.round(v / 255 * (lv - 1)) / (lv - 1) * 255; }
    d[i + 3] = 255;
  }
  sc.putImageData(id, 0, 0);
  dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.imageSmoothingEnabled = false; dst.drawImage(small, 0, 0, PW, PH, 0, 0, W * 2, H * 2); dst.restore();
}
function render(ctx, view, params) {
  var want = params && params.look === 3;
  if (want) {
    if (!pbuf) pbuf = mk(W * 2, H * 2);
    var bp = {}; for (var k in params) bp[k] = params[k]; bp.look = 0;
    renderScene(pbuf.getContext('2d'), view, bp);
    pixelate(pbuf, ctx);
    return;
  }
  renderScene(ctx, view, params);
}
function renderScene(ctx, view, params) {
  setup(params || {});
  ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.clearRect(0, 0, W, H);
  if (view === 'factoryKit') { drawSheet(ctx, 'factory'); return; }
  if (view === 'outsideKit') { drawSheet(ctx, 'outside'); return; }
  if (view === 'factory') { drawFactory(ctx); finish(ctx, 'factory'); return; }
  if (view === 'outside') { drawOutside(ctx); finish(ctx, 'outside'); return; }
  // reveal: the Factory with a big gate open onto the lush outside
  if (!cacheO) { cacheO = mk(W * 2, H * 2); }
  var o = cacheO.getContext('2d');
  o.setTransform(2, 0, 0, 2, 0, 0); o.clearRect(0, 0, W, H); o.lineJoin = 'round'; o.lineCap = 'round';
  var savedHero = P.scaleRef, gx0 = W / 2 + 20; var sh0 = P.scaleRef; P.scaleRef = 0;
  drawOutside(o, false); finish(o, 'outside');
  P.scaleRef = sh0;
  drawFactory(ctx, true, true, [gx0 - 96, 258]); finish(ctx, 'factory');
  var K = mats(), gx = W / 2 + 20, gy = 156, gw = 124, gh = 196, op = archPoly(gx, gy, gw, gh), frame = archPoly(gx, gy + 5, gw + 26, gh + 14);
  var fd = shape(ctx, frame, K.wall, { seed: P.seed + 60, size: 'XL', sh: 6, rough: 0.2 });
  ctx.save(); path(ctx, op); ctx.clip();
  var s2 = 0.95; ctx.translate(gx - 240 * s2, (gy - gh * 0.35) - 200 * s2); ctx.scale(s2, s2); ctx.drawImage(cacheO, 0, 0, W * 2, H * 2, 0, 0, W, H);
  ctx.restore();
  ctx.save(); path(ctx, op); ctx.clip();
  var ig = ctx.createLinearGradient(gx - gw / 2, 0, gx + gw / 2, 0); ig.addColorStop(0, 'hsla(' + P.shadowHue.toFixed(0) + ',50%,10%,0.5)'); ig.addColorStop(0.18, 'hsla(0,0%,0%,0)'); ig.addColorStop(0.82, 'hsla(0,0%,0%,0)'); ig.addColorStop(1, 'hsla(' + P.shadowHue.toFixed(0) + ',50%,10%,0.5)');
  ctx.fillStyle = ig; ctx.fillRect(gx - gw / 2, gy - gh, gw, gh); ctx.restore();
  path(ctx, op); ctx.lineWidth = ow('L'); ctx.strokeStyle = OLC; ctx.stroke();
  var lh = gw / 2;
  shape(ctx, [[gx - lh, gy], [gx - lh, gy - gh * 0.6], [gx - lh + 14, gy - gh * 0.52], [gx - lh + 14, gy + 5]], K.iron, { seed: P.seed + 61, size: 'L', sh: 3, rough: 0.2 });
  shape(ctx, [[gx + lh, gy], [gx + lh, gy - gh * 0.6], [gx + lh - 14, gy - gh * 0.52], [gx + lh - 14, gy + 5]], K.iron, { seed: P.seed + 62, size: 'L', sh: 3, rough: 0.2 });
  gear(ctx, K, gx - lh + 7, gy - gh * 0.28, 5, P.seed + 63, 8, K.brass); gear(ctx, K, gx + lh - 7, gy - gh * 0.28, 5, P.seed + 64, 8, K.brass);
  shape(ctx, rrPts(gx - gw / 2 - 16, gy + 1, gw + 32, 9, 4), K.ironLight, { seed: P.seed + 65, size: 'M', sh: 1.5, rough: 0.2 });
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  var sg = ctx.createRadialGradient(gx, gy + 40, 6, gx, gy + 50, 190); sg.addColorStop(0, C(P.outsideHue, 60, 55, 0.5 * P.glow)); sg.addColorStop(1, C(P.outsideHue, 60, 55, 0)); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
  var rg = ctx.createRadialGradient(gx, gy - gh * 0.5, 10, gx, gy - gh * 0.5, 170); rg.addColorStop(0, C(P.outsideHue, 60, 60, 0.22 * P.glow)); rg.addColorStop(1, C(P.outsideHue, 60, 60, 0)); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  P.scaleRef = savedHero;
}
function drawHeroAt(c, K, x, y) { heroRef(c, K, x, y); }

return { W: W, H: H, DEF: DEF, PRESETS: PRESETS, render: render, kit: { decal: decalPaint, emblem: emblemPaint, TW: TW, TH: TH, TILES: TILES, PROPS: PROPS, setup: kitSetup, bakeTile: bakeTile, blendTile: blendTile, bakeProp: bakeProp, shimmer: waterShimmer, mats: mats, rng: rng, clamp: clamp, lerp: lerp, mixHue: mixHue, mk: mk, wnoise: wn } };
})();
if (typeof module !== 'undefined') module.exports = StyleLab;
