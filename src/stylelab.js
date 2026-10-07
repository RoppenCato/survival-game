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
// The chosen look of the world: bright, lush, green Scandinavian daylight. Every editor starts from this.
// fruit: 0 switches off the glowing lantern fruit the old night style hung in the trees.
// The look (2026-10-05): flat, clean shapes in two or three tones, thin olive outlines, no texture strokes, round
// forms. Look 0 is the flat renderer; shadowHue 100 makes shades and outlines olive instead of teal.
var STYLE_FLAT = { factoryHue: 215, outsideHue: 100, accentHue: 46, shadowHue: 100, sat: 0.92, bright: 14, contrast: 0.96, shade: 0.34,
  round: 1, spindly: 0.05, lush: 1, twist: 0.08, sparkle: 0, texture: 0, outlineW: 0.6, outlineDark: 0.6, rough: 0.03,
  light: 0.8, fog: 0, glow: 0.2, vignette: 0, look: 0, seed: 7, scaleRef: 0, fruit: 0 };
// The ink look (2026-10-07, docs/art-direction.md): Egerkrans's line, Bauer's light. look 3 in shape(): a cool shadow crescent,
// grain in every fill, a warm lit edge, a thin line all round and a heavy line fading in on the shadow side, warm brown-black ink.
var STYLE_INK = { look: 3, shadowHue: 222, outsideHue: 92, sat: 0.66, bright: -2, contrast: 1.04, shade: 0.52, outlineW: 1.6, outlineDark: 1, texture: 1.1, rough: 0.08, vignette: 0.2, round: 1, lush: 1, sparkle: 0, fog: 0, glow: 0.15 };   // Robin's numbers, 2026-10-07
// The heavy ink line: each edge segment is stroked as dark as its outward normal faces away from the light (upper left), so
// the line thickens on a shape's shadow side and thins toward the light whatever the shape, and always lies on its edge.
function inkEdge(c, d, w) {
  var n = d.length, area = 0, i; if (n < 3) return;
  for (i = 0; i < n; i++) { var p = d[i], q = d[(i + 1) % n]; area += p[0] * q[1] - q[0] * p[1]; }
  var sgn = area > 0 ? 1 : -1, lx = -0.6, ly = -0.8;                                  // the light from the upper left
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = w;
  for (i = 0; i < n; i++) {
    var a = d[i], b = d[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey) || 1, nx = ey / L * sgn, ny = -ex / L * sgn;
    var k = Math.max(0, Math.min(1, (-(nx * lx + ny * ly) + 0.15) / 0.9)); if (k < 0.03) continue;
    c.globalAlpha = k * k; c.strokeStyle = OLC; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  }
  c.restore();
}
var grainCv = null;
function grain(c) {                                  // paper and pencil: a small pattern of dark and light specks, tiled
  if (!grainCv) { grainCv = mk(96, 96); var g = grainCv.getContext('2d'), R = rng(77), i; for (i = 0; i < 1500; i++) { var x = R() * 96, y = R() * 96, d = R(); g.fillStyle = d < 0.55 ? 'rgba(20,14,10,' + (0.25 + R() * 0.45).toFixed(2) + ')' : 'rgba(255,245,225,' + (0.2 + R() * 0.4).toFixed(2) + ')'; g.fillRect(x, y, 1 + (R() < 0.3 ? 1 : 0), 1); } }
  return c.createPattern(grainCv, 'repeat');
}
var STYLE = {}; (function () { var k; for (k in STYLE_FLAT) STYLE[k] = STYLE_FLAT[k]; for (k in STYLE_INK) STYLE[k] = STYLE_INK[k]; })();   // the game's look is the ink look (Robin, 2026-10-07); STYLE_FLAT is the look before it
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
  OLC = P.look === 3 ? 'hsl(18,30%,' + (8 + (1 - P.outlineDark) * 20).toFixed(0) + '%)' : 'hsl(' + P.shadowHue.toFixed(0) + ',28%,' + (6 + (1 - P.outlineDark) * 30).toFixed(0) + '%)';   // ink: warm brown-black
}
function ow(size) { var f = size === 'S' ? 0.7 : size === 'L' ? 1.35 : size === 'XL' ? 1.7 : 1; return 1.9 * P.outlineW * f * (P.look === 2 ? 0.4 : (P.look === 1 ? 0.35 : (P.look === 3 ? 0.55 : 1))); }

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
  if (look === 3) {                                    // ink: base, a cool shadow crescent, grain, a warm lit edge, the two lines
    c.save(); path(c, d); c.fillStyle = m.base; c.fill();
    path(c, d); c.clip();
    if (!o.flat) { var sx3 = (o.sh || 3) * (0.5 + P.shade); crescent(c, d, -sx3, -sx3 * 0.9, m.shade, bb); c.globalAlpha = 0.7; var hx3 = (o.hl || 2) * (0.5 + P.shade * 0.5); crescent(c, d, hx3, hx3 * 0.9, m.hl, bb); c.globalAlpha = 1; }
    if (P.texture > 0) { c.globalAlpha = 0.16 * P.texture; c.fillStyle = grain(c); c.fillRect(bb.x, bb.y, bb.w, bb.h); c.globalAlpha = 0.14 * P.texture; var gs = c.createLinearGradient(bb.x, bb.y, bb.x + bb.w * 0.7, bb.y + bb.h); gs.addColorStop(0, 'rgba(0,0,0,0)'); gs.addColorStop(1, 'hsla(' + P.shadowHue.toFixed(0) + ',40%,15%,1)'); c.fillStyle = gs; c.fillRect(bb.x, bb.y, bb.w, bb.h); c.globalAlpha = 1; }
    if (!o.flat) { c.translate(-0.7, -0.7); path(c, d); c.lineWidth = 1.1; c.strokeStyle = m.hl; c.globalAlpha = 0.5; c.stroke(); c.globalAlpha = 1; }
    c.restore();
    path(c, d); c.lineJoin = 'round'; c.lineWidth = ow(o.size) * 0.8; c.strokeStyle = OLC; c.stroke();
    inkEdge(c, d, ow(o.size) * 2.1);                      // the heavy line on the shadow side, following the edge
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
function addLight(x, y, r, h, s, l, a) { lights.push({ x: x, y: y, r: r, h: h, s: s, l: l, a: a == null ? 1 : a }); }

/* ---------------- materials from the parameters ---------------- */
function mats() {
  var f = P.factoryHue, o = P.outsideHue, a = P.accentHue, K = {};
  K.floorA = M(f, 16, 24); K.floorB = M(f + 6, 15, 29); K.wall = M(f + 8, 20, 33); K.wallDark = M(f + 4, 22, 22);
  K.iron = M(f + 14, 14, 42); K.ironLight = M(f + 14, 13, 52); K.brass = M(mixHue(38, a, 0.2), 48, 48); K.rust = M(14, 52, 34);
  K.pipe = M(f - 28, 24, 38); K.crate = M(mixHue(30, f, 0.15), 28, 34); K.glass = M(a, 70, 62);
  K.grassA = M(o, 44, 42); K.grassB = M(o + 12, 46, 46); K.leaf = M(o - 4, 50, 46); K.leafD = M(o + 6, 46, 35);
  K.trunk = M(mixHue(26, o, 0.08), 34, 30); K.trunkL = M(mixHue(28, o, 0.08), 30, 40);   // plain brown bark
  K.rock = M(mixHue(o, 270, 0.6), 10, 42); K.moss = M(o - 10, 52, 36); K.path = M(mixHue(35, o, 0.15), 18, 44);
  K.water = M(204 + (o - STYLE.outsideHue), 62, 38); K.waterL = M(197 + (o - STYLE.outsideHue), 62, 48);   // clear blue sea; the hue follows any hue shift
  K.flowerA = M(a, 75, 56); K.flowerB = M(mixHue(a, 300, 0.5), 60, 58); K.flowerC = M(mixHue(a, 60, 0.4), 70, 66);
  K.cap = M(a, 72, 50); K.spot = M(mixHue(a, 60, 0.3), 25, 86); K.stem = M(60, 14, 78);
  K.gdark = M(o + 6, 40, 26); K.snowA = M(215, 22, 92); K.snowB = M(214, 28, 80); K.iceM = M(196, 52, 70); K.rockC = M(238, 10, 40); K.rockD = M(246, 12, 28); K.ashM = M(18, 8, 32); K.charM = M(14, 12, 20); K.basM = M(250, 10, 24); K.lavaM = M(14, 90, 46); K.deadW = M(16, 16, 18); K.bellM = M(44, 70, 56); K.keyM = M(48, 92, 60); K.snowPineD = M(o + 8, 30, 30); K.snowPineL = M(o + 4, 26, 40); K.charLeaf = M(8, 55, 28); K.birch = M(60, 6, 84); K.birchLeaf = M(o - 26, 52, 54); K.blossom = M(mixHue(a, 330, 0.45), 40, 70); K.pine = M(o + 14, 46, 30); K.pineL = M(o + 8, 48, 36); K.willow = M(o - 14, 42, 40);
  K.cap2 = M(mixHue(a, 340, 0.35), 62, 46); K.gill = M(mixHue(a, 330, 0.3), 30, 58);
  K.liquid = M(mixHue(o, a, 0.35), 75, 52); K.fire = M(24, 95, 56); K.wood = M(mixHue(28, o, 0.1), 34, 36);
  K.coat = M(mixHue(o, 190, 0.3), 36, 34); K.skin = M(30, 60, 80); K.hair = M(20, 55, 40);
  return K;
}

/* ---------------- Factory set ---------------- */
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

// a chest: a wooden box with a lid, two iron bands and a brass lock (storage the player builds)
function chestObj(c, K, x, y, s, seed) {
  var w = s, h = s * 0.62, dp = s * 0.26, rd = 2 + 2 * P.round;
  gshadow(c, x + 3, y + 1, w * 0.75, 4.5);
  shape(c, [[x + w / 2, y - h], [x + w / 2 + dp, y - h - dp * 0.7], [x + w / 2 + dp, y - dp * 0.7], [x + w / 2, y]], K.wallDark, { seed: seed + 4, size: 'M', flat: true, rough: 0.3 });
  shape(c, [[x - w / 2, y - h], [x - w / 2 + dp, y - h - dp * 0.7], [x + w / 2 + dp, y - h - dp * 0.7], [x + w / 2, y - h]], K.wood, { seed: seed + 2, size: 'M', sh: 1.5, rough: 0.3 });
  shape(c, rrPts(x - w / 2, y - h, w, h, rd), K.wood, { seed: seed, size: 'M', rough: 0.3 });
  line(c, [[x - w / 2 + 1, y - h * 0.6], [x + w / 2 - 1, y - h * 0.6]], 1.6, K.wood.shade, false);
  [-0.3, 0.3].forEach(function (t, i) { shape(c, rrPts(x + w * t - 2.5, y - h - 1, 5, h + 2, 1.5), K.iron, { seed: seed + 6 + i, size: 'S', flat: true }); });
  shape(c, rrPts(x - 3, y - h * 0.62 - 1, 6, 7, 1.5), K.brass, { seed: seed + 9, size: 'S', sh: 1, rough: 0.2 });
}

// a woven rug lying flat on the floor: a dark red field, a cream border, a pale band down the middle, fringe at the ends
function rugObj(c, K, x, y, seed) {
  var red = M(6, 52, 36), cream = M(44, 40, 76), blue = M(212, 40, 40), i;
  gshadow(c, x, y - 1, 20, 3, 0.18);
  shape(c, rrPts(x - 24, y - 20, 48, 20, 4), red, { seed: seed, size: 'M', sh: 1, hl: 0.8, rough: 0.2 });
  fillPath(c, rrPts(x - 20, y - 17, 40, 14, 3), cream.base, true, ow('S') * 0.7);
  fillPath(c, rrPts(x - 17, y - 15, 34, 10, 2), red.base, false);
  fillPath(c, [[x - 12, y - 10], [x - 5, y - 14], [x + 2, y - 10], [x - 5, y - 6]], blue.base, false);
  fillPath(c, [[x + 4, y - 10], [x + 11, y - 14], [x + 17, y - 10], [x + 11, y - 6]], blue.base, false);
  c.save(); c.strokeStyle = cream.base; c.lineWidth = 1; c.lineCap = 'round';
  for (i = 0; i < 6; i++) { var fy = y - 18 + i * 3.2; c.beginPath(); c.moveTo(x - 24, fy); c.lineTo(x - 27, fy + 0.5); c.moveTo(x + 24, fy); c.lineTo(x + 27, fy + 0.5); c.stroke(); }
  c.restore();
}

// the workbench: a low trestle bench of thick planks, with a hammer, a saw and a split log on it (about as wide as the hero is tall)
function workbenchObj(c, K, x, y, seed) {
  gshadow(c, x + 1, y, 18, 4, 0.35);
  [[-12, 1], [12, 1]].forEach(function (p, k) { shape(c, rrPts(x + p[0] - 2, y - 13, 4, 14, 1), K.wood, { seed: seed + k, size: 'S', flat: true, rough: 0.2 }); });
  shape(c, rrPts(x - 12, y - 7, 24, 3, 1), K.wood, { seed: seed + 3, size: 'S', flat: true, rough: 0.2 });
  shape(c, [[x - 17, y - 14], [x + 15, y - 14], [x + 19, y - 19], [x - 13, y - 19]], K.trunkL, { seed: seed + 4, size: 'S', sh: 1, rough: 0.2 });
  shape(c, rrPts(x - 17, y - 14, 32, 4.5, 1.2), K.wood, { seed: seed + 5, size: 'S', sh: 1.2, rough: 0.2 });
  line(c, [[x - 9, y - 18], [x - 4, y - 23]], 1.8, K.wood.base, true);                       // hammer: a haft and an iron head
  shape(c, rrPts(x - 6.5, y - 26, 6, 3.4, 1), K.iron, { seed: seed + 6, size: 'S', flat: true, rough: 0.1 });
  shape(c, [[x + 1, y - 18], [x + 11, y - 18.6], [x + 10, y - 21], [x + 2, y - 20.4]], K.ironLight, { seed: seed + 7, size: 'S', flat: true, rough: 0.1 });   // saw blade
  shape(c, ellPts(x + 12, y - 20, 3.2, 2.2, 10), K.trunkL, { seed: seed + 8, size: 'S', sh: 0.8, rough: 0.15 });   // a split log
}

// the shipwright's bench: two trestles carrying a keel timber with its upturned stem, and the first ribs standing on it
function shipwrightObj(c, K, x, y, seed) {
  gshadow(c, x + 2, y, 30, 5, 0.35);
  [-17, 17].forEach(function (dx) { line(c, [[x + dx - 7, y], [x + dx, y - 15]], 3, K.wood.base, true); line(c, [[x + dx + 7, y], [x + dx, y - 15]], 3, K.wood.base, true); line(c, [[x + dx - 4, y - 6], [x + dx + 4, y - 6]], 2, K.wood.base, true); });
  [-12, 0, 12].forEach(function (dx, k) {   // ribs rising from the keel, a V seen from the side
    line(c, curvePts([x + dx, y - 17], [x + dx - 5, y - 27], [x + dx - 8, y - 36], 5), 2.4, K.wood.base, true);
    line(c, curvePts([x + dx, y - 17], [x + dx + 5, y - 26], [x + dx + 9, y - 33], 5), 2.4, K.wood.shade, true);
  });
  shape(c, ribbon(curvePts([x - 32, y - 16], [x - 4, y - 13], [x + 30, y - 21], 10), 0, 0, function (t) { return 6 - 2.4 * t; }), K.trunkL, { seed: seed, size: 'M', sh: 1.2, rough: 0.2 });   // the keel
  line(c, curvePts([x + 30, y - 21], [x + 36, y - 26], [x + 35, y - 34], 5), 3.4, K.trunkL.base, true);                                                           // its stem, curled up
  shape(c, [[x - 20, y - 24], [x - 4, y - 25], [x - 3, y - 22], [x - 19, y - 21]], K.wood, { seed: seed + 3, size: 'S', flat: true, rough: 0.2 });                 // a first plank laid across
  line(c, [[x - 36, y - 2], [x - 30, y - 8]], 2, K.wood.base, true); shape(c, rrPts(x - 34, y - 11, 6, 3.4, 1), K.iron, { seed: seed + 4, size: 'S', flat: true, rough: 0.1 });   // a mallet on the ground
}

function barrel(c, K, x, y, s, seed) {
  var w = s * 0.62, h = s;
  gshadow(c, x + 2, y + 1, w * 0.7, 4);
  var body = [[x - w / 2, y - h * 0.9], [x - w * 0.58, y - h * 0.5], [x - w / 2, y], [x + w / 2, y], [x + w * 0.58, y - h * 0.5], [x + w / 2, y - h * 0.9]];
  var d = shape(c, body, K.rust, { seed: seed, size: 'M' });
  shape(c, ellPts(x, y - h * 0.9, w / 2, w * 0.2, 12), K.iron, { seed: seed + 1, size: 'S', sh: 1.2 });
  [0.3, 0.65].forEach(function (t, i) { var b = shape(c, rrPts(x - w * 0.6, y - h * t - 2, w * 1.2, 5, 2), K.iron, { seed: seed + 3 + i, size: 'S', flat: true }); if (P.stripes > 0.5) stripesIn(c, b, 0.7, 2, OLC, 0.3); });
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
  blobs.forEach(function (b) { var bb = bbox(b.d); crescent(c, b.d, -b.r * 0.26, -b.r * 0.3, mat.shade, bb); crescent(c, b.d, b.r * 0.22, b.r * 0.26, mat.hl, bb); });
  blobs.forEach(function (b, k) { if (k === 0) return; path(c, b.d); c.lineWidth = ow('S') * 0.7; c.strokeStyle = OLC; c.globalAlpha = 0.35; c.stroke(); c.globalAlpha = 1; });
  for (i = 0; i < count; i++) { var b3 = blobs[i % blobs.length], lx2 = b3.x + (R() - 0.7) * b3.r * 1.1, ly2 = b3.y + (R() - 0.6) * b3.r * 0.7; line(c, curvePts([lx2, ly2], [lx2 + 2.5, ly2 - 3], [lx2 + 5.5, ly2 - 1.5], 4), 1.3, mat.hl, false); }
}

// Roots that curve out of the trunk and down into the ground, thick at the trunk and thin at the tip.
function rootFlare(c, K, x, y, baseW, seed, reach) {
  var R = rng(seed * 7 + 3), i;
  for (i = 0; i < 4; i++) {
    var sd = i % 2 ? 1 : -1, k = Math.floor(i / 2), len = reach * (0.75 + R() * 0.5) * (k ? 0.6 : 1), sx = x + sd * baseW * (0.2 + k * 0.12);
    shape(c, ribbon(curvePts([sx, y - 14 + k * 4], [sx + sd * len * 0.4, y - 9 + k * 3], [sx + sd * len, y + 1 + k * 2], 7), baseW * 0.36, 1.6), K.trunk, { seed: seed + i, size: 'M', sh: 1.8, rough: 0.25 });
  }
}
// Grass growing over the foot of a tree, so it stands in the ground instead of on top of it.
function groundTufts(c, K, x, y, w, seed) {
  var R = rng(seed * 11 + 5), i, n = Math.max(5, Math.round(w / 4));
  c.save(); c.lineCap = 'round'; c.lineWidth = 1.4;
  for (i = 0; i < n; i++) {
    var gx = x - w + R() * w * 2, gy = y + 1 + R() * 4, hg = 4 + R() * 4.5;
    c.strokeStyle = R() < 0.5 ? K.grassB.base : K.grassB.hl;
    c.beginPath(); c.moveTo(gx - 1.6, gy); c.lineTo(gx - 2.6, gy - hg * 0.8); c.moveTo(gx, gy); c.lineTo(gx + 0.4, gy - hg); c.moveTo(gx + 1.6, gy); c.lineTo(gx + 3, gy - hg * 0.75); c.stroke();
  }
  c.restore();
}
function tree(c, K, x, y, h, seed, wid, mat) {
  var R = rng(seed), tw = P.twist, sp = P.spindly, i;
  var baseW = (wid || 28) * lerp(1.3, 0.6, sp), lean = (R() - 0.5) * tw * 40, ph = R() * 6;
  longShadow(c, x, y, baseW * 1.8, h * 0.5);
  gshadow(c, x, y + 1, baseW * 1.5, 6.5, 0.4);
  var n = 12, cl = [];
  for (i = 0; i <= n; i++) { var t = i / n; cl.push([x + lean * t * t + Math.sin(t * 3 + ph) * tw * 10 * t, y - h * 0.66 * t]); }
  rootFlare(c, K, x, y, baseW, seed, baseW * 0.8);
  shape(c, ribbon(cl, 0, 0, function (t) { return lerp(baseW, baseW * 0.62, t) + (t < 0.12 ? (0.12 - t) * baseW * 2.6 : 0); }), K.trunk, { seed: seed, size: 'XL', sh: 6, hl: 3, rough: 0.3 });
  groundTufts(c, K, x, y, baseW * 1.35, seed);
  var top = cl[n], cr = h * (0.24 + 0.18 * P.lush), cx = top[0], cy = top[1] - cr * 0.2;
  // two short branches into the canopy
  [-1, 1].forEach(function (sd, k) { var p0 = cl[8]; shape(c, ribbon(curvePts([p0[0], p0[1]], [p0[0] + sd * cr * 0.2, p0[1] - cr * 0.15], [p0[0] + sd * cr * 0.38, p0[1] - cr * 0.55], 6), baseW * 0.42, baseW * 0.24), K.trunk, { seed: seed + 20 + k, size: 'M', sh: 1.5, rough: 0.2 }); });
  var cnt = 4 + Math.round(P.lush * 4);
  leafBlobs(c, K, cx, cy, cr, seed * 3, cnt, mat);
  // glowing lantern fruit in the accent colour
  var bm = M(P.accentHue, 88, 64), nf = P.fruit ? 3 + Math.round(P.glow * 3) : 0;
  for (i = 0; i < nf; i++) {
    var a = R() * 6.28, bx = cx + Math.cos(a) * cr * (0.3 + R() * 0.7), by = cy + Math.sin(a) * cr * 0.55 + cr * 0.15;
    c.beginPath(); c.arc(bx, by, 4, 0, 7); c.fillStyle = bm.base; c.fill(); c.lineWidth = ow('S') * 0.85; c.strokeStyle = OLC; c.stroke();
    c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',100%,90%,0.95)'; c.beginPath(); c.arc(bx - 1.2, by - 1.2, 1.4, 0, 7); c.fill();
    addLight(bx, by, 30 + 26 * P.glow, P.accentHue, 92, 62, 0.8);
  }
}

/* ---------------- the reference set, redrawn after Robin's notes (2026-10-05) ----------------
   Foliage is layered silhouettes with lobed edges (a dark mass, a lit mass, a highlight), not circles on circles.
   Rocks sit flat on the ground with a lit top facet. Everything reads from the three-quarter camera. */
function fillPath(c, d, col, outline, lw) { path(c, d); c.fillStyle = col; c.fill(); if (outline) { c.lineWidth = lw || ow('M'); c.strokeStyle = OLC; c.lineJoin = 'round'; c.stroke(); } }
function lobed(cx, cy, rx, ry, seed, n, v) { return wob(dens(blobPts(cx, cy, rx, ry, seed, n || 40, v == null ? 0.16 : v), 5), P.rough * 0.8, seed); }
// a canopy or a bush: three stacked masses, dark below, lit in the middle, a highlight up and to the left
function foliage(c, K, cx, cy, rx, ry, seed, mat) {
  mat = mat || K.leaf;
  var base = lobed(cx, cy, rx, ry, seed, 44, 0.15);
  fillPath(c, base, mat.shade, true, ow('L') * 1.1);
  fillPath(c, lobed(cx - rx * 0.05, cy - ry * 0.2, rx * 0.76, ry * 0.66, seed + 1, 40, 0.17), mat.base, false);
  fillPath(c, lobed(cx - rx * 0.26, cy - ry * 0.46, rx * 0.34, ry * 0.26, seed + 2, 30, 0.2), mat.hl, false);
  // a few leaf notches along the lit edge
  var R = rng(seed + 9), i; c.save(); c.strokeStyle = mat.shade; c.lineWidth = 1.1; c.lineCap = 'round';
  for (i = 0; i < 5; i++) { var a = -2.6 + R() * 2.2, px = cx + Math.cos(a) * rx * 0.72, py = cy + Math.sin(a) * ry * 0.72; c.beginPath(); c.moveTo(px - 2, py + 1.5); c.lineTo(px, py - 1.5); c.lineTo(px + 2, py + 1.5); c.stroke(); }
  c.restore();
  return base;
}
// the oak: a short thick trunk that forks into three limbs under a broad crown
function oakTree(c, K, x, y, h, seed) {
  var R = rng(seed), bw = h * 0.16, lean = (R() - 0.5) * P.twist * 20, i;
  longShadow(c, x, y, bw * 2.2, h * 0.45); gshadow(c, x, y + 1, bw * 1.9, 7, 0.4);
  rootFlare(c, K, x, y, bw, seed, bw * 0.9);
  var top = y - h * 0.42;
  shape(c, ribbon(curvePts([x, y], [x + lean * 0.5, y - h * 0.2], [x + lean, top], 8), 0, 0, function (t) { return lerp(bw, bw * 0.7, t) + (t < 0.12 ? (0.12 - t) * bw * 2.4 : 0); }), K.trunk, { seed: seed, size: 'XL', sh: 5, hl: 3, rough: 0.3 });
  var cr = h * 0.34, cx = x + lean, cy = top - cr * 0.55;
  [[-1, 0.9], [1, 0.9], [0.1, 1.15]].forEach(function (q, k) { var p0 = [x + lean * 0.9, top + 4]; shape(c, ribbon(curvePts(p0, [p0[0] + q[0] * cr * 0.25, p0[1] - cr * 0.25], [p0[0] + q[0] * cr * 0.55 * q[1], p0[1] - cr * 0.7 * q[1]], 6), bw * 0.5, bw * 0.2), K.trunk, { seed: seed + 20 + k, size: 'M', sh: 1.5, rough: 0.2 }); });
  groundTufts(c, K, x, y, bw * 1.4, seed);
  foliage(c, K, cx - cr * 0.78, cy + cr * 0.5, cr * 0.55, cr * 0.42, seed * 3 + 7, K.leaf);
  foliage(c, K, cx + cr * 0.82, cy + cr * 0.45, cr * 0.5, cr * 0.4, seed * 3 + 11, K.leaf);
  foliage(c, K, cx, cy, cr * 1.2, cr * 1.0, seed * 3, K.leaf);
  var bm = M(P.accentHue, 88, 64), nf = P.fruit ? 3 : 0;
  for (i = 0; i < nf; i++) { var a = R() * 6.28, bx = cx + Math.cos(a) * cr * 0.6, by = cy + Math.sin(a) * cr * 0.5; c.beginPath(); c.arc(bx, by, 4, 0, 7); c.fillStyle = bm.base; c.fill(); }
}
// a boulder: flat on the ground, a lit top facet, a dark foot, one crack; three builds by seed
function rock(c, K, x, y, s, seed, mossy) {
  var R = rng(seed), kind = seed % 3, w = s * (1.4 + R() * 0.5), hh = s * (0.9 + R() * 0.5) * (kind === 1 ? 0.7 : 1), i;
  gshadow(c, x + 2, y + 1, w * 0.62, s * 0.26);
  var body = [[x - w * 0.5, y], [x - w * 0.56, y - hh * 0.45], [x - w * (0.3 + R() * 0.15), y - hh * (0.85 + R() * 0.15)], [x + w * (0.05 + R() * 0.2), y - hh], [x + w * 0.42, y - hh * (0.7 + R() * 0.2)], [x + w * 0.55, y - hh * 0.35], [x + w * 0.48, y]];
  if (kind === 2) body.splice(3, 0, [x - w * 0.05, y - hh * 0.78], [x + w * 0.05, y - hh * 1.08]);
  var d = shape(c, body, K.rock, { seed: seed, size: 'M', flat: true, rough: 0.45 });
  c.save(); path(c, d); c.clip();
  // the lit top: a facet that follows the upper edge; the foot: a dark band at the bottom
  var topF = [[x - w * 0.56, y - hh * 0.45], [x - w * 0.36, y - hh * 0.92], [x + w * 0.12, y - hh * 1.02], [x + w * 0.46, y - hh * 0.74], [x + w * 0.2, y - hh * 0.5], [x - w * 0.2, y - hh * 0.46]];
  path(c, wob(dens(topF, 5), P.rough * 0.8, seed + 2)); c.fillStyle = K.rock.hl; c.fill();
  c.fillStyle = K.rock.shade; c.globalAlpha = 0.9; c.fillRect(x - w, y - hh * 0.28, w * 2, hh * 0.3); c.globalAlpha = 1;
  c.fillStyle = K.rock.shade; c.beginPath(); c.moveTo(x + w * 0.2, y - hh * 0.5); c.lineTo(x + w * 0.5, y - hh * 0.6); c.lineTo(x + w * 0.6, y); c.lineTo(x + w * 0.2, y); c.closePath(); c.globalAlpha = 0.55; c.fill(); c.globalAlpha = 1;
  c.restore();
  line(c, [[x + w * 0.05, y - hh * 0.7], [x + w * 0.12, y - hh * 0.45], [x + w * 0.06, y - hh * 0.25]], 1.1, K.rock.shade, false);
  if (mossy) fillPath(c, lobed(x - w * 0.12, y - hh * 0.9, w * 0.26, hh * 0.14, seed + 3, 20, 0.3), K.moss.base, false);
  c.save(); c.lineCap = 'round'; c.strokeStyle = K.grassB.base; c.lineWidth = 1.3;   // grass at the foot, so it sits in the ground
  for (i = 0; i < 4; i++) { var gx = x - w * 0.45 + R() * w * 0.9, gy = y + 1; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx - 1 + R() * 2, gy - 4 - R() * 3); c.stroke(); }
  c.restore();
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

// a wildflower: a bending stem with a leaf each side, the head seen a little from the side, and a bud beside it
function flower(c, K, x, y, seed) {
  var R = rng(seed), h = 14 + R() * 12, bend = (R() - 0.5) * 10 - 2, m = [K.flowerA, K.flowerB, K.flowerC][seed % 3], i;
  var stem = curvePts([x, y], [x + bend * 0.3, y - h * 0.55], [x + bend, y - h], 8), tip = stem[8];
  line(c, stem, 1.9, K.leafD.base, true);
  // leaves: a drooping pair, one low and one higher
  [[-1, 0.28], [1, 0.5]].forEach(function (q, k) { var p = stem[Math.round(q[1] * 8)]; var lf = ribbon(curvePts(p, [p[0] + q[0] * 4, p[1] - 1], [p[0] + q[0] * 8, p[1] + 2.5], 5), 0.5, 0, function (t) { return Math.sin(t * Math.PI) * 4; }); fillPath(c, wob(dens(lf, 4), P.rough * 0.5, seed + k), K.leaf.base, true, ow('S') * 0.8); });
  // the bud: a small closed head on a short stem
  var bp = [x + 7, y - 2], bs = curvePts(bp, [bp[0] + 2, bp[1] - 6], [bp[0] + 1, bp[1] - h * 0.5], 5); line(c, bs, 1.4, K.leafD.base, true);
  fillPath(c, wob(dens(ellPts(bs[5][0], bs[5][1] - 1.5, 2.2, 3, 10), 3), P.rough * 0.4, seed + 5), m.shade, true, ow('S') * 0.8);
  // the head: petals as one lobed disc seen from a little above, a darker underside showing below, a centre
  var pr = 5 + R() * 2, hd = lobed(tip[0], tip[1], pr * 1.15, pr * 0.85, seed + 7, 24, 0.3);
  fillPath(c, hd.map(function (p) { return [p[0], p[1] + 1.6]; }), m.shade, true, ow('S') * 0.9);
  fillPath(c, hd, m.base, true, ow('S') * 0.9);
  c.save(); path(c, hd); c.clip(); c.strokeStyle = m.shade; c.lineWidth = 0.9; c.globalAlpha = 0.6;
  for (i = 0; i < 6; i++) { var a = i / 6 * 6.28 + 0.4; c.beginPath(); c.moveTo(tip[0] + Math.cos(a) * pr * 0.35, tip[1] + Math.sin(a) * pr * 0.25); c.lineTo(tip[0] + Math.cos(a) * pr * 1.1, tip[1] + Math.sin(a) * pr * 0.85); c.stroke(); }
  c.restore();
  c.beginPath(); c.ellipse(tip[0], tip[1] + 0.5, pr * 0.42, pr * 0.3, 0, 0, 7); c.fillStyle = K.spot.base; c.fill(); c.lineWidth = ow('S') * 0.7; c.strokeStyle = OLC; c.stroke();
}

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
  for (i = 0; i < (P.fruit ? 3 : 0); i++) { var bx = x + (R() - 0.5) * bw * 1.2, by2 = base - h * (0.2 + R() * 0.4); c.beginPath(); c.arc(bx, by2, 3.4, 0, 7); c.fillStyle = bm.base; c.fill(); c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',100%,90%,0.95)'; c.beginPath(); c.arc(bx - 1, by2 - 1, 1.2, 0, 7); c.fill(); addLight(bx, by2, 24 + 18 * P.glow, P.accentHue, 92, 62, 0.7); }
}
function willow(c, K, x, y, h, seed) {
  var R = rng(seed), tw = P.twist, i, n = 10, cl = [], lean = (R() - 0.5) * tw * 24;
  longShadow(c, x, y, 40, h * 0.5); gshadow(c, x, y + 1, 34, 6, 0.4);
  for (i = 0; i <= n; i++) { var t = i / n; cl.push([x + lean * t * t + Math.sin(t * 3 + seed) * tw * 6 * t, y - h * 0.6 * t]); }
  shape(c, ribbon(cl, 0, 0, function (t) { return lerp(26, 14, t) + (t < 0.12 ? (0.12 - t) * 60 : 0); }), K.trunk, { seed: seed, size: 'L', sh: 5, rough: 0.3 });
  groundTufts(c, K, x, y, 24, seed);
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
  for (i = 0; i < (P.fruit ? 3 : 0); i++) { var bx = cx + (R() - 0.5) * cr * 1.5, by = cy + cr * 0.2 + R() * h * 0.2; c.beginPath(); c.arc(bx, by, 3.4, 0, 7); c.fillStyle = bm.base; c.fill(); c.fillStyle = 'hsla(' + P.accentHue.toFixed(0) + ',100%,90%,0.95)'; c.beginPath(); c.arc(bx - 1, by - 1, 1.2, 0, 7); c.fill(); addLight(bx, by, 28 + 20 * P.glow, P.accentHue, 92, 62, 0.8); }
}
function bush(c, K, x, y, r, seed, berries) {
  var R = rng(seed), i;
  gshadow(c, x, y, r * 1.15, r * 0.38, 0.4);
  c.save(); c.lineCap = 'round'; c.strokeStyle = K.trunk.shade; c.lineWidth = 1.6;   // a few stems at the foot
  for (i = 0; i < 4; i++) { var sx = x + (i - 1.5) * r * 0.3; c.beginPath(); c.moveTo(sx, y); c.lineTo(sx + (R() - 0.5) * 4, y - r * 0.5); c.stroke(); }
  c.restore();
  foliage(c, K, x, y - r * 0.62, r * 1.45, r * 0.85, seed, K.leaf);
  if (berries) { var bm = M(352, 74, 50), i; for (i = 0; i < 5; i++) { var bx = x + (R() - 0.5) * r * 1.6, by = y - r * 0.5 + (R() - 0.3) * r * 0.8; c.beginPath(); c.arc(bx, by, 2.8, 0, 7); c.fillStyle = bm.base; c.fill(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(bx - 0.8, by - 0.8, 0.9, 0, 7); c.fill(); } }
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


/* ---------------- more tree species ---------------- */
function glowFruit(c, bx, by, r) {
  if (!P.fruit) return;
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
  rootFlare(c, K, x, y, 66, seed, 50); rootFlare(c, K, x, y, 50, seed + 9, 30);
  var trunk = shape(c, ribbon(cl, 0, 0, function (t) { return lerp(66, 36, Math.pow(t, 0.7)) + (t < 0.15 ? (0.15 - t) * 120 : 0); }), K.trunk, { seed: seed, size: 'XL', sh: 8, hl: 4, rough: 0.35 });
  groundTufts(c, K, x, y, 78, seed);
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
// a rock outcrop: a stepped mass of bedrock breaking through the grass, two tiers with flat lit tops and dark faces, grass on the ledges
function cliffObj(c, K, x, y, seed) {
  var R = rng(seed), i;
  gshadow(c, x + 2, y + 1, 40, 7, 0.4);
  function tier(x0, y0, w, h, sd) {           // a block: dark front face, lit top seen from above
    var face = [[x0 - w * 0.5, y0], [x0 - w * 0.56, y0 - h * 0.45], [x0 - w * 0.48, y0 - h * 0.78], [x0 - w * 0.3, y0 - h], [x0 - w * 0.05, y0 - h * 0.9], [x0 + w * 0.2, y0 - h * 1.02], [x0 + w * 0.42, y0 - h * 0.86], [x0 + w * 0.54, y0 - h * 0.5], [x0 + w * 0.46, y0 - h * 0.2], [x0 + w * 0.5, y0]];
    var d = shape(c, face, K.rockC, { seed: sd, size: 'L', flat: true, rough: 0.7 });
    c.save(); path(c, d); c.clip(); c.fillStyle = K.rockC.shade; c.globalAlpha = 0.85; c.fillRect(x0 - w, y0 - h * 0.32, w * 2, h * 0.35); c.globalAlpha = 1;
    c.fillStyle = K.rockD.base; c.globalAlpha = 0.5; c.beginPath(); c.moveTo(x0 + w * 0.1, y0 - h); c.lineTo(x0 + w * 0.52, y0 - h * 0.55); c.lineTo(x0 + w * 0.5, y0); c.lineTo(x0 + w * 0.12, y0); c.closePath(); c.fill(); c.globalAlpha = 1; c.restore();
    var top = [[x0 - w * 0.48, y0 - h * 0.78], [x0 - w * 0.3, y0 - h], [x0 - w * 0.05, y0 - h * 0.9], [x0 + w * 0.2, y0 - h * 1.02], [x0 + w * 0.42, y0 - h * 0.86], [x0 + w * 0.3, y0 - h * 0.66], [x0, y0 - h * 0.7], [x0 - w * 0.25, y0 - h * 0.62]];
    fillPath(c, wob(dens(top, 5), P.rough * 0.8, sd + 1), K.rockC.hl, false);
    line(c, [[x0 - w * 0.12, y0 - h * 0.6], [x0 - w * 0.06, y0 - h * 0.3], [x0 - w * 0.14, y0 - h * 0.08]], 1.1, K.rockC.shade, false);
  }
  tier(x + 4, y, 80, 28, seed);
  tier(x - 12, y - 22, 50, 26, seed + 3);
  tier(x + 26, y - 20, 22, 12, seed + 6);
  c.save(); c.lineCap = 'round'; c.lineWidth = 1.4;   // grass on the ledge and at the foot
  for (i = 0; i < 9; i++) { var gx = x - 34 + R() * 70, gy = i < 4 ? y - 24 - (R() * 3) : y + 1; c.strokeStyle = R() < 0.5 ? K.grassB.base : K.grassB.hl; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx - 1 + R() * 2, gy - 4 - R() * 3); c.moveTo(gx + 2, gy); c.lineTo(gx + 3.5, gy - 3 - R() * 3); c.stroke(); }
  c.restore();
  fillPath(c, lobed(x - 16, y - 50, 9, 3.5, seed + 5, 16, 0.3), K.moss.base, false);
}


/* ---------------- Factory rooms and Commons landmarks ---------------- */
function bedObj(c, K, x, y, seed) {
  gshadow(c, x, y, 26, 5, 0.35);
  [[-20, 0], [20, 0]].forEach(function (p, k) { shape(c, rrPts(x + p[0] - 2.5, y - 8, 5, 10, 1.5), K.iron, { seed: seed + k, size: 'S', rough: 0.2 }); });
  shape(c, rrPts(x - 24, y - 16, 48, 12, 3), K.iron, { seed: seed + 2, size: 'M', sh: 2, rough: 0.2 });
  shape(c, rrPts(x - 22, y - 22, 44, 9, 4), M(mixHue(P.factoryHue, 200, 0.4), 34, 52), { seed: seed + 3, size: 'S', sh: 1.5, rough: 0.2 });
  shape(c, rrPts(x - 22, y - 26, 14, 8, 4), M(48, 25, 80), { seed: seed + 4, size: 'S', sh: 1, rough: 0.2 });
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
// tall grass: a tuft of outlined blades, darker and yellower than the ground so it stands off it, lit tips, two seed heads
function tallGrassObj(c, K, x, y, seed) {
  var R = rng(seed), i, dk = M(P.outsideHue + 4, 50, 26), md = M(P.outsideHue + 10, 56, 36), lt = M(P.outsideHue + 18, 62, 50);
  gshadow(c, x, y + 1, 12, 3, 0.25);
  var blades = [];
  for (i = 0; i < 14; i++) { var bx = x + (R() - 0.5) * 22, h = 14 + R() * 18, sway = (R() - 0.5) * 14; blades.push({ pts: curvePts([bx, y + (R() - 0.5) * 3], [bx + sway * 0.3, y - h * 0.55], [bx + sway, y - h], 6), h: h, k: i }); }
  blades.sort(function (a, b) { return b.h - a.h; });
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  blades.forEach(function (b) { c.strokeStyle = OLC; c.lineWidth = 3.2; c.beginPath(); b.pts.forEach(function (p, j) { if (j) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke(); });
  blades.forEach(function (b) {
    var col = b.k % 3 === 0 ? dk : (b.k % 3 === 1 ? md : lt);
    c.strokeStyle = col.base; c.lineWidth = 1.8; c.beginPath(); b.pts.forEach(function (p, j) { if (j) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke();
    c.strokeStyle = col.hl; c.lineWidth = 1; c.beginPath(); c.moveTo(b.pts[3][0], b.pts[3][1]); c.lineTo(b.pts[6][0], b.pts[6][1]); c.stroke();
  });
  c.restore();
  for (i = 0; i < 2; i++) { var t = blades[i].pts[6]; c.fillStyle = M(44, 50, 70).base; c.beginPath(); c.ellipse(t[0], t[1] - 1, 1.5, 2.6, 0.3, 0, 7); c.fill(); c.lineWidth = 0.8; c.strokeStyle = OLC; c.stroke(); }
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


/* ---------------- floor decals ---------------- */


/* ---------------- industrial walls and lamps ---------------- */

/* ---------------- Factory kit: more pieces ---------------- */







/* ---------------- lighting, fog and finishing ---------------- */



/* ---------------- ground tiles and baked props (for the walk test) ---------------- */
var TW = 32, TH = 24;
var TILES = {
  water: { n: 3, pr: 0 }, shore: { n: 3, pr: 1 }, dirt: { n: 4, pr: 2 }, moss: { n: 3, pr: 3 }, grassDark: { n: 4, pr: 4 }, leaves: { n: 3, pr: 4 },
  grass: { n: 6, pr: 5 }, path: { n: 4, pr: 6 }, trail: { n: 4, pr: 6 }, plank: { n: 3, pr: 7 }, snow: { n: 5, pr: 5 }, snowDark: { n: 4, pr: 4 }, ice: { n: 3, pr: 0 }, rock: { n: 3, pr: 2 }, ash: { n: 5, pr: 5 }, char: { n: 4, pr: 4 }, basalt: { n: 3, pr: 2 }, lava: { n: 3, pr: 0 }, crack: { n: 3, pr: 3 }, plate: { n: 4, pr: 5 }, grate: { n: 2, pr: 5 }, puddle: { n: 2, pr: 5 }, voidT: { n: 1, pr: 9 }
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
    wrapDraw(c, function () { bl.forEach(function (b) { soft(c, b[0], b[1], b[2] * 1.4, b[3] ? m.hl : m.shade, type === 'grass' ? 0.035 : 0.1); }); });   // faint: the real mottling is painted over whole pieces of map, never per tile
    if (type === 'grass') {
      blades(c, R, 5, [K.leafD.base, K.grassA.shade, K.leaf.base], 2.5, 4.5, 0.3);
      var ex = v % 6;
      if (ex === 1) { list = []; for (i = 0; i < 3; i++) list.push([3 + R() * 26, 3 + R() * 18]); wrapDraw(c, function () { list.forEach(function (p) { [[0, 0], [2.4, 1], [-2, 1.2]].forEach(function (o) { c.fillStyle = K.leaf.hl; c.beginPath(); c.ellipse(p[0] + o[0], p[1] + o[1], 2, 1.5, 0, 0, 7); c.fill(); }); }); }); }
      if (ex === 2) { list = []; for (i = 0; i < 2; i++) list.push([4 + R() * 24, 6 + R() * 14, R()]); wrapDraw(c, function () { list.forEach(function (p) { c.strokeStyle = K.leafD.base; c.lineWidth = 1; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - 4); c.stroke(); c.fillStyle = p[2] < 0.5 ? K.flowerA.base : (p[2] < 0.8 ? K.flowerC.base : K.spot.base); c.beginPath(); c.arc(p[0], p[1] - 4.6, 1.9, 0, 7); c.fill(); c.fillStyle = K.spot.base; c.beginPath(); c.arc(p[0], p[1] - 4.6, 0.7, 0, 7); c.fill(); }); }); }
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
  if (type === 'trail') {            // a trodden earth path: pale packed soil and a few pebbles
    var tb = C(mixHue(34, P.outsideHue, 0.05), 38, 50), tl = C(mixHue(38, P.outsideHue, 0.05), 42, 60), td = C(mixHue(30, P.outsideHue, 0.05), 36, 40);
    c.fillStyle = tb; c.fillRect(0, 0, TW, TH);
    var bl5 = []; for (i = 0; i < 4; i++) bl5.push([R() * TW, R() * TH, 8 + R() * 9, R() < 0.5]);
    wrapDraw(c, function () { bl5.forEach(function (b) { soft(c, b[0], b[1], b[2], b[3] ? tl : td, 0.2); }); });
    list = []; for (i = 0; i < 12; i++) list.push([R() * TW, R() * TH, R()]);
    wrapDraw(c, function () {
      list.forEach(function (p) {
        if (p[2] < 0.75) { c.fillStyle = p[2] < 0.4 ? td : tl; c.globalAlpha = 0.6; c.fillRect(p[0], p[1], 1, 1); }
        else { c.globalAlpha = 0.85; c.fillStyle = K.rock.base; c.beginPath(); c.ellipse(p[0], p[1], 1.5, 1, 0, 0, 7); c.fill(); }
      });
      c.globalAlpha = 1;
    });
    return;
  }
  if (type === 'shore') {            // warm pale sand: soft dunes, a speckle of grains, the odd shell. Warm tones only.
    var sdB = C(43, 66, 67), sdL = C(47, 78, 78), sdD = C(36, 54, 54);
    c.fillStyle = sdB; c.fillRect(0, 0, TW, TH);
    list = []; for (i = 0; i < 14; i++) list.push([R() * TW, R() * TH, R()]);
    var shell = R() < 0.3 ? [R() * TW, R() * TH] : null;
    wrapDraw(c, function () {
      list.forEach(function (p) { c.fillStyle = p[2] < 0.5 ? sdD : sdL; c.globalAlpha = 0.55; c.fillRect(p[0], p[1], 1, 1); });
      c.globalAlpha = 1;
      if (shell) { c.fillStyle = '#fff4e6'; c.beginPath(); c.ellipse(shell[0], shell[1], 1.5, 1.1, 0.4, 0, 7); c.fill(); }
    });
    return;
  }
  if (type === 'water') {
    c.fillStyle = K.water.base; c.fillRect(0, 0, TW, TH);
    var bl4 = []; for (i = 0; i < 3; i++) bl4.push([R() * TW, R() * TH, 9 + R() * 9, R() < 0.5]);
    wrapDraw(c, function () { bl4.forEach(function (b) { soft(c, b[0], b[1], b[2], b[3] ? K.waterL.hl : K.water.shade, 0.05); }); });
    list = []; for (i = 0; i < 4; i++) list.push([R() * TW, R() * TH, 4 + R() * 5]);
    wrapDraw(c, function () { c.strokeStyle = K.waterL.hl; c.lineWidth = 0.9; c.globalAlpha = 0.3; list.forEach(function (p) { c.beginPath(); c.ellipse(p[0], p[1], p[2], p[2] * 0.35, 0, 3.4, 5.9); c.stroke(); }); c.globalAlpha = 1; });
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
  // carved, not painted: each groove is a dark cut with a lit edge below and to the right, and a trace of red left in the cut
  function strokes(dx, dy, col, lw) {
    c.save(); c.translate(dx, dy); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col; c.lineWidth = lw;
    c.beginPath(); c.moveTo(x - 8, y - 8); c.quadraticCurveTo(x - 11, y - h * 0.6, x - 5, y - h * 0.82); c.quadraticCurveTo(x, y - h * 0.95, x + 5, y - h * 0.82); c.quadraticCurveTo(x + 11, y - h * 0.6, x + 8, y - 8); c.stroke();
    c.lineWidth = lw * 0.55; var R2 = rng(seed + 1);
    for (i = 0; i < 9; i++) {
      var gx = x - 4 + (i % 3) * 4, gy = y - h * (0.3 + Math.floor(i / 3) * 0.15), k = Math.floor(R2() * 4);
      c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx, gy - 5);
      if (k === 0) { c.moveTo(gx, gy - 5); c.lineTo(gx + 2, gy - 3); } else if (k === 1) { c.moveTo(gx, gy - 4); c.lineTo(gx + 2, gy - 2.5); c.lineTo(gx, gy - 1); } else if (k === 2) { c.moveTo(gx - 1.5, gy - 4); c.lineTo(gx + 1.5, gy - 1.5); }
      c.stroke();
    }
    c.restore();
  }
  strokes(0.8, 0.8, K.rockC.hl, 2.6);
  strokes(0, 0, K.rockC.shade, 2.6);
  c.save(); c.globalAlpha = 0.55; strokes(0, 0, C(8, 70, 42), 1.3); c.restore();
  shape(c, blobPts(x - 3, y - 3, 12, 3.4, seed + 3, 8, 0.4), K.moss, { seed: seed + 4, size: 'S' });
}
// the longhouse, from the three-quarter camera: the long wall of standing planks faces you with the door in it, the
// gable end shows on the right, the roof is turf with a bowed ridge and crossed boards at the ends, and stones hold the foot
function longhouse(c, K, x, y, seed) {
  var R = rng(seed), i, turf = M(P.outsideHue + 4, 42, 38), plank = K.wood, gableEnd = x + 60, dp = 26, k = 0.5;
  longShadow(c, x, y, 130, 52); gshadow(c, x + 6, y, 78, 10, 0.45);
  // the long wall (front) and the gable end (right, receding)
  var wall = shape(c, [[x - 62, y], [x - 62, y - 34], [x + 60, y - 34], [x + 60, y]], plank, { seed: seed, size: 'L', flat: true, rough: 0.2 });
  c.save(); path(c, wall); c.clip(); c.strokeStyle = plank.shade; c.lineWidth = 1.1; c.globalAlpha = 0.7;
  for (i = -58; i < 60; i += 6) { c.beginPath(); c.moveTo(x + i, y - 34); c.lineTo(x + i, y); c.stroke(); }
  c.globalAlpha = 0.35; c.fillStyle = plank.shade; c.fillRect(x - 62, y - 34, 122, 5); c.restore();
  var gable = shape(c, [[gableEnd, y], [gableEnd, y - 34], [gableEnd + dp * 0.5, y - 60], [gableEnd + dp, y - 34 - dp * k], [gableEnd + dp, y - dp * k]], plank, { seed: seed + 1, size: 'L', flat: true, rough: 0.2 });
  c.save(); path(c, gable); c.clip(); c.fillStyle = plank.shade; c.globalAlpha = 0.45; c.fillRect(gableEnd, y - 80, dp + 2, 90); c.strokeStyle = plank.shade; c.globalAlpha = 0.6; c.lineWidth = 1;
  for (i = 4; i < dp; i += 5) { c.beginPath(); c.moveTo(gableEnd + i, y - 70); c.lineTo(gableEnd + i, y); c.stroke(); } c.restore();
  // the foot: a row of stones along the front
  for (i = 0; i < 14; i++) { var sx = x - 58 + i * 9 + (R() - 0.5) * 2; shape(c, ellPts(sx, y - 2, 4.5 + R() * 1.5, 3 + R(), 10), K.rockC, { seed: seed + 40 + i, size: 'S', sh: 1, rough: 0.3 }); }
  // the roof: a front slope that bows up to the ridge, a hipped end on the right, turf with a few streaks
  var ridgeY = y - 78, eaveY = y - 30;
  var roof = shape(c, [[x - 72, eaveY], [x - 64, ridgeY + 6], [x - 20, ridgeY], [x + 30, ridgeY], [x + 62, ridgeY + 5], [gableEnd + dp * 0.5, y - 60 + 2], [x + 70, eaveY]], turf, { seed: seed + 2, size: 'L', flat: true, rough: 0.35 });
  c.save(); path(c, roof); c.clip(); c.strokeStyle = turf.shade; c.globalAlpha = 0.45; c.lineWidth = 1.2;
  for (i = 0; i < 30; i++) { var tx = x - 66 + R() * 134, ty = y - 32 - R() * 42; c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + (R() - 0.5) * 3, ty - 6 - R() * 5); c.stroke(); }
  c.fillStyle = turf.hl; c.globalAlpha = 0.5; c.beginPath(); c.moveTo(x - 64, ridgeY + 8); c.lineTo(x - 20, ridgeY + 3); c.lineTo(x + 30, ridgeY + 3); c.lineTo(x + 62, ridgeY + 8); c.lineTo(x + 56, ridgeY + 22); c.lineTo(x - 56, ridgeY + 24); c.closePath(); c.fill();
  c.fillStyle = turf.shade; c.globalAlpha = 0.45; c.fillRect(x - 80, eaveY - 9, 170, 10); c.restore();
  var hip = shape(c, [[x + 62, ridgeY + 5], [gableEnd + dp, y - 34 - dp * k], [gableEnd + dp * 0.5, y - 60 + 2]], turf, { seed: seed + 3, size: 'M', flat: true, rough: 0.3 });
  c.save(); path(c, hip); c.clip(); c.fillStyle = turf.shade; c.globalAlpha = 0.5; c.fillRect(x, y - 100, 120, 100); c.restore();
  // the ridge beam, bowed, with crossed boards at both ends
  line(c, curvePts([x - 66, ridgeY + 6], [x + 5, ridgeY - 4], [x + 64, ridgeY + 5], 10), 3.4, plank.base, true);
  [[x - 66, ridgeY + 6, -1], [x + 64, ridgeY + 5, 1]].forEach(function (e) {
    line(c, [[e[0] - 6, e[1] + 10], [e[0] + 5, e[1] - 12]], 2.6, plank.base, true); line(c, [[e[0] + 6, e[1] + 10], [e[0] - 5, e[1] - 12]], 2.6, plank.base, true);
  });
  // the door in the long wall, with a lintel and a little light inside
  var door = shape(c, [[x - 16, y], [x - 16, y - 24], [x - 2, y - 24], [x - 2, y]], M(P.shadowHue, 40, 10), { seed: seed + 6, size: 'M', flat: true, rough: 0.15 });
  c.save(); path(c, door); c.clip(); c.fillStyle = 'hsla(28,95%,58%,0.45)'; c.fillRect(x - 16, y - 14, 14, 14); c.restore();
  shape(c, rrPts(x - 19, y - 27, 20, 4, 1), K.trunkL, { seed: seed + 7, size: 'S', flat: true, rough: 0.2 });
  [-19, 0].forEach(function (dx, j) { shape(c, rrPts(x + dx - 1, y - 27, 3, 27, 1), K.trunkL, { seed: seed + 8 + j, size: 'S', flat: true, rough: 0.2 }); });
  vShield(c, x + 20, y - 18, 7, 8, seed + 10); vShield(c, x + 36, y - 18, 7, 212, seed + 12);
  for (i = 0; i < 4; i++) { c.save(); c.globalAlpha = 0.16 - i * 0.03; c.fillStyle = '#e8ecf4'; c.beginPath(); c.arc(x + 4 + i * 3, ridgeY - 8 - i * 8, 5 + i * 2.2, 0, 7); c.fill(); c.restore(); }
  addLight(x - 9, y - 12, 70, 28, 95, 58, 0.6);
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
// a woodpile from the three-quarter camera: a block of logs, the cut ends facing you in three rows, a bark top and a bark
// side showing how long the logs are, held between two stakes
function woodpile(c, K, x, y, seed) {
  var r, i, bw = 40, bh = 27, dp = 11, R = rng(seed);
  gshadow(c, x + 4, y + 1, 30, 6, 0.4);
  shape(c, [[x + bw / 2, y - bh], [x + bw / 2 + dp, y - bh - dp * 0.6], [x + bw / 2 + dp, y - dp * 0.6], [x + bw / 2, y]], K.trunk, { seed: seed + 1, size: 'M', sh: 1.5, flat: true, rough: 0.2 });          // the side
  shape(c, [[x - bw / 2, y - bh], [x - bw / 2 + dp, y - bh - dp * 0.6], [x + bw / 2 + dp, y - bh - dp * 0.6], [x + bw / 2, y - bh]], K.trunkL, { seed: seed + 2, size: 'M', sh: 1.2, flat: true, rough: 0.2 });   // the top
  c.save(); c.strokeStyle = K.trunk.shade; c.globalAlpha = 0.5; c.lineWidth = 0.9; c.beginPath(); for (i = 1; i < 4; i++) { c.moveTo(x - bw / 2 + i * 10 + 2, y - bh - 0.5); c.lineTo(x - bw / 2 + i * 10 + dp + 2, y - bh - dp * 0.6 - 0.5); } c.stroke(); c.restore();
  shape(c, rrPts(x - bw / 2, y - bh, bw, bh, 2), K.wood, { seed: seed, size: 'M', flat: true, rough: 0.2 });                                                                                           // the dark face behind the ends
  for (r = 0; r < 3; r++) for (i = 0; i < 4 - (r === 2 ? 1 : 0); i++) {
    var cx = x - bw / 2 + 5.5 + i * 9.6 + (r === 2 ? 4.8 : 0), cy = y - 5.2 - r * 8.6;
    shape(c, ellPts(cx, cy, 4.7, 4.6, 12), K.trunkL, { seed: seed + 10 + r * 5 + i, size: 'S', sh: 0.8, rough: 0.15 });
    c.save(); c.strokeStyle = K.trunk.shade; c.globalAlpha = 0.5; c.lineWidth = 0.8; c.beginPath(); c.ellipse(cx, cy, 2.5, 2.4, 0, 0, 7); c.stroke(); c.beginPath(); c.arc(cx, cy, 0.8, 0, 7); c.stroke(); c.restore();
  }
  line(c, [[x - bw / 2 - 3, y + 1], [x - bw / 2 - 2, y - bh - 3]], 2.6, K.wood.base, true); line(c, [[x + bw / 2 + 3, y + 1], [x + bw / 2 + 4, y - bh - 3]], 2.6, K.wood.base, true);
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
// The furnace (2026-10-07): a clay dome on a stone foot, a dark mouth low in front, a vent on top, soot round the mouth.
// Ore and charcoal go in, a copper bar comes out. Smoke is drawn by the game while it works.
function furnaceObj(c, K, x, y, seed) {
  gshadow(c, x, y, 26, 7, 0.4);
  shape(c, ellPts(x, y - 2, 25, 8, 12), K.rockC, { seed: seed, size: 'M', sh: 2, rough: 0.4 });
  shape(c, [[x - 20, y - 5], [x - 19, y - 22], [x - 13, y - 36], [x, y - 43], [x + 13, y - 36], [x + 19, y - 22], [x + 20, y - 5]], M(22, 36, 44), { seed: seed + 1, size: 'M', sh: 4, rough: 0.35 });
  [[-11, -15], [7, -27], [13, -13], [-4, -33], [10, -20]].forEach(function (q, k) { shape(c, ellPts(x + q[0], y + q[1], 4, 2.8, 8), K.rockC, { seed: seed + 5 + k, size: 'S', sh: 1, rough: 0.3 }); });
  c.fillStyle = C(14, 20, 8); c.beginPath(); c.ellipse(x, y - 9, 7, 6, 0, Math.PI, 0); c.fill(); c.fillRect(x - 7, y - 9, 14, 6);
  c.fillStyle = 'rgba(20,14,12,0.45)'; c.beginPath(); c.ellipse(x, y - 15, 10, 4, 0, 0, 7); c.fill();
  c.fillStyle = C(14, 20, 8); c.beginPath(); c.ellipse(x, y - 42, 3.6, 1.6, 0, 0, 7); c.fill();
  addLight(x, y - 9, 60, 28, 100, 56, 0.5);
}
// A tree struck by lightning: the top gone, the trunk split and charred black, grey ash in the cracks, two burnt stubs.
// Felled with the axe it gives charcoal, not wood.
function struckTree(c, K, x, y, seed) {
  var ch = M(20, 12, 15), i;
  gshadow(c, x, y, 15, 5, 0.4);
  shape(c, [[x - 9, y], [x - 8, y - 30], [x - 11, y - 50], [x - 4, y - 44], [x - 1, y - 20], [x + 2, y - 60], [x + 9, y - 48], [x + 9, y - 28], [x + 8, y]], ch, { seed: seed, size: 'M', sh: 3, rough: 0.55 });
  line(c, [[x + 6, y - 34], [x + 19, y - 44]], 2.6, ch.base, true); line(c, [[x - 7, y - 26], [x - 17, y - 30]], 2.2, ch.base, true);
  line(c, [[x - 2, y - 6], [x - 1, y - 40]], 1.2, C(22, 8, 30), true);
  for (i = 0; i < 6; i++) { c.fillStyle = 'rgba(190,186,180,0.55)'; c.beginPath(); c.ellipse(x - 5 + (i * 7) % 11, y - 8 - i * 7, 1.3, 0.8, 0.4, 0, 7); c.fill(); }
}
// An old fire ring left by someone passing: a ring of stones round grey ash with black lumps of charcoal still in it.
function cellarDoor(c, K, x, y, seed) {                 // a trapdoor in the floor: planks with a batten and an iron ring, flat
  var i;
  shape(c, [[x - 14, y - 9], [x + 14, y - 9], [x + 14, y + 7], [x - 14, y + 7]], K.wood, { seed: seed, size: 'M', flat: true, rough: 0.2 });
  for (i = 1; i < 4; i++) line(c, [[x - 14 + i * 7, y - 8.5], [x - 14 + i * 7 + 0.3, y + 6.5]], 0.8, K.wood.shade, false);
  shape(c, [[x - 12, y - 2], [x + 12, y - 2], [x + 12, y + 1], [x - 12, y + 1]], K.wood, { seed: seed + 1, size: 'S', flat: true, rough: 0.2 });
  c.strokeStyle = '#3a3a40'; c.lineWidth = 1.6; c.beginPath(); c.arc(x + 6, y - 0.5, 2.6, 0, 7); c.stroke(); c.fillStyle = '#2a2a30'; c.beginPath(); c.arc(x + 6, y - 3, 0.9, 0, 7); c.fill();
}
function fireRing(c, K, x, y, seed) {
  var i;
  gshadow(c, x, y, 16, 5, 0.3);
  shape(c, ellPts(x, y - 3, 9, 4, 10), K.ashM, { seed: seed, size: 'S', flat: true, rough: 0.4 });
  for (i = 0; i < 8; i++) { var a = i / 8 * 6.28; shape(c, ellPts(x + Math.cos(a) * 12, y - 3 + Math.sin(a) * 5, 3.6, 2.6, 8), K.rockC, { seed: seed + 1 + i, size: 'S', sh: 1, rough: 0.3 }); }
  [[-3, -4], [2, -2], [-1, -1]].forEach(function (q, k) { shape(c, ellPts(x + q[0], y + q[1], 2.6, 1.6, 8), K.charM, { seed: seed + 12 + k, size: 'S', sh: 1, rough: 0.3 }); });
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
// the hero's boat after the storm: tilted on the sand, a hole in its side with the ribs showing, the mast snapped and the sail
// torn and hanging over the edge, a broken oar and a loose plank beside it
function wreckedBoat(c, K, x, y, seed) {
  gshadow(c, x, y, 44, 7, 0.42);
  c.save(); c.translate(x, y); c.rotate(-0.07);
  var d = shape(c, [[-20, 0], [-34, -8], [-40, -24], [-33, -28], [-24, -17], [2, -15], [10, -19], [24, -17], [35, -28], [41, -25], [35, -8], [22, 0]], K.wood, { seed: seed, size: 'L', sh: 4, rough: 0.5 });
  c.save(); path(c, d); c.clip(); c.strokeStyle = 'hsla(' + P.shadowHue.toFixed(0) + ',40%,9%,0.5)'; c.lineWidth = 1; [-12, -7].forEach(function (dy) { c.beginPath(); c.moveTo(-38, dy - 8); c.quadraticCurveTo(0, dy + 6, 38, dy - 8); c.stroke(); }); c.restore();
  shape(c, [[-9, -15], [2, -17], [9, -9], [1, -4], [-9, -8]], dark(6), { seed: seed + 2, size: 'M', flat: true, rough: 0.5 });                   // the hole
  [-6, 0, 6].forEach(function (rx, i) { line(c, [[rx - 1, -16], [rx + 1, -6]], 1.8, K.wood.shade, true); });                                            // ribs showing through it
  line(c, [[-3, -17], [-7, -33], [-4, -37], [-8, -35]], 3.4, K.wood.base, true);                                                                       // the snapped mast
  var sail = shape(c, [[-7, -32], [-22, -29], [-28, -17], [-21, -11], [-15, -19], [-8, -19]], M(42, 26, 80), { seed: seed + 3, size: 'M', sh: 1.4, rough: 0.6 });
  c.save(); path(c, sail); c.clip(); c.fillStyle = C(8, 62, 44); c.globalAlpha = 0.85; for (var i = -30; i < -6; i += 7) c.fillRect(i, -40, 3.4, 40); c.restore();
  c.restore();
  line(c, [[x + 32, y + 5], [x + 56, y + 11], [x + 60, y + 9]], 2.2, K.wood.base, true);                                                               // a broken oar
  shape(c, rrPts(x + 38, y + 14, 18, 3.4, 1.2), K.wood, { seed: seed + 5, size: 'S', flat: true, rough: 0.3 }); shape(c, rrPts(x - 52, y + 9, 12, 3, 1), K.wood, { seed: seed + 6, size: 'S', flat: true, rough: 0.3 });
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
// A fireplace: a hearth built into a stone back with an arched mouth and a fire in it. The chimney above it is drawn by
// the page (Build.drawChimney), since its height follows the storeys of the house.
function fireplace(c, K, x, y, seed) {
  var i;
  gshadow(c, x, y, 20, 5, 0.4);
  shape(c, rrPts(x - 16, y - 32, 32, 32, 2.5), K.rockC, { seed: seed, size: 'M', sh: 2, rough: 0.35 });
  for (i = 0; i < 10; i++) { var cx = x - 12 + (i % 5) * 6.2 + (i >= 5 ? 3 : 0), cy = y - 27 + Math.floor(i / 5) * 7; if (i >= 5 && i !== 5 && i !== 9) continue; shape(c, ellPts(cx, cy, 3.4, 2.4, 8), i % 3 ? K.rock : K.rockC, { seed: seed + i, size: 'S', sh: 1, rough: 0.3 }); }
  shape(c, [[x - 9, y - 1], [x - 9, y - 13], [x - 5, y - 18], [x + 5, y - 18], [x + 9, y - 13], [x + 9, y - 1]], M(20, 18, 9), { seed: seed + 20, size: 'S', flat: true });
  shape(c, ellPts(x, y - 1, 13, 3.6, 10), K.rock, { seed: seed + 21, size: 'S', sh: 1, rough: 0.3 });
  shape(c, [[x - 5, y - 3], [x - 6, y - 9], [x - 2, y - 15], [x, y - 9], [x + 3, y - 16], [x + 6, y - 8], [x + 5, y - 3]], M(24, 100, 52), { seed: seed + 22, size: 'S', flat: true, rough: 0.4 });
  shape(c, [[x - 2.5, y - 3], [x - 3, y - 8], [x, y - 12], [x + 2.5, y - 8], [x + 2.5, y - 3]], M(46, 100, 66), { seed: seed + 23, size: 'S', flat: true, rough: 0.3 });
  addLight(x, y - 8, 100 + 40 * P.glow, 28, 100, 58, 0.9);
}
// A water trough on two trestle feet, for the yard.
function trough(c, K, x, y, seed) {
  gshadow(c, x, y, 16, 4, 0.4);
  shape(c, rrPts(x - 12, y - 6, 4, 6, 1), K.wood, { seed: seed + 1, size: 'S', sh: 1, rough: 0.3 }); shape(c, rrPts(x + 8, y - 6, 4, 6, 1), K.wood, { seed: seed + 2, size: 'S', sh: 1, rough: 0.3 });
  shape(c, rrPts(x - 15, y - 16, 30, 11, 2), K.wood, { seed: seed, size: 'M', sh: 1.5, rough: 0.3 });
  shape(c, ellPts(x, y - 13, 12, 2.8, 12), K.waterL, { seed: seed + 3, size: 'S', flat: true });
  line(c, [[x - 15, y - 16], [x + 15, y - 16]], 1.6, K.wood.hl, false);
}
// The carver's bench (the arm ring's runes are cut and reddened here): a low bench with a graver, a file and a bowl.
function carverBench(c, K, x, y, seed) {
  gshadow(c, x + 1, y, 16, 4, 0.35);
  [[-10, 1], [10, 1]].forEach(function (p, k) { shape(c, rrPts(x + p[0] - 2, y - 11, 4, 12, 1), K.wood, { seed: seed + k, size: 'S', flat: true, rough: 0.2 }); });
  shape(c, [[x - 15, y - 12], [x + 13, y - 12], [x + 17, y - 17], [x - 11, y - 17]], K.trunkL, { seed: seed + 4, size: 'S', sh: 1, rough: 0.2 });
  shape(c, rrPts(x - 15, y - 12, 28, 4, 1.2), K.wood, { seed: seed + 5, size: 'S', sh: 1.2, rough: 0.2 });
  line(c, [[x - 9, y - 16], [x - 3, y - 21]], 1.6, K.wood.base, true); shape(c, [[x - 4, y - 21], [x - 1, y - 24], [x, y - 23], [x - 3, y - 20]], K.ironLight, { seed: seed + 6, size: 'S', flat: true, rough: 0.1 });   // the graver
  shape(c, rrPts(x + 1, y - 19.5, 9, 2.2, 0.8), K.iron, { seed: seed + 7, size: 'S', flat: true, rough: 0.1 }); line(c, [[x + 10, y - 18.4], [x + 13, y - 18.4]], 1.4, K.wood.base, false);   // the file
  shape(c, ellPts(x + 9, y - 23, 4.2, 2.4, 10), K.rockC, { seed: seed + 8, size: 'S', sh: 0.8, rough: 0.15 }); shape(c, ellPts(x + 9, y - 23.4, 2.8, 1.3, 8), M(0, 70, 32), { seed: seed + 9, size: 'S', flat: true });   // the bowl, with blood in it
  shape(c, ellPts(x - 12, y - 19, 2.6, 2.6, 10), M(28, 45, 42), { seed: seed + 10, size: 'S', sh: 0.6, rough: 0.1 });   // a ring, being worked
}
// A dead Viking of the old days, lying on the cave floor behind the troll's lair: bones in a rotted cloak, an arm ring still on.
function deadViking(c, K, x, y, seed) {
  gshadow(c, x, y + 1, 22, 5, 0.35);
  shape(c, [[x - 20, y - 2], [x - 16, y - 9], [x + 2, y - 11], [x + 16, y - 8], [x + 20, y - 1], [x + 12, y + 3], [x - 12, y + 3]], M(8, 30, 26), { seed: seed, size: 'M', sh: 1, rough: 0.5 });   // the cloak
  shape(c, ellPts(x + 15, y - 6, 4.6, 4, 10), M(45, 20, 84), { seed: seed + 1, size: 'S', sh: 1, rough: 0.2 });   // the skull
  line(c, [[x + 12.5, y - 5.5], [x + 13.5, y - 5.5]], 1.4, M(45, 10, 30).base, false); line(c, [[x + 16.5, y - 6], [x + 17.5, y - 6]], 1.4, M(45, 10, 30).base, false);
  for (var i = 0; i < 4; i++) line(c, [[x - 6 + i * 4, y - 9], [x - 7 + i * 4, y - 3]], 1.2, M(45, 20, 78).base, false);   // ribs through the cloak
  line(c, [[x - 10, y - 6], [x - 19, y - 3]], 2.2, M(45, 20, 80).base, true);                                            // the arm
  shape(c, ellPts(x - 15, y - 4.4, 2.2, 1.6, 8), M(28, 50, 48), { seed: seed + 2, size: 'S', sh: 0.5, rough: 0.1 });    // the ring, bronze
  shape(c, [[x + 3, y - 14], [x + 11, y - 15], [x + 12, y - 10], [x + 4, y - 9]], K.iron, { seed: seed + 3, size: 'S', sh: 1, rough: 0.3 });   // a helmet, fallen
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
  furnace: { b: [-28, -48, 28, 8], f: function (c, K, s) { furnaceObj(c, K, 0, 0, s); } },
  struckTree: { b: [-20, -64, 22, 6], f: function (c, K, s) { struckTree(c, K, 0, 0, s); } },
  fireRing: { b: [-17, -10, 17, 8], f: function (c, K, s) { fireRing(c, K, 0, 0, s); } },
  cellarDoor: { b: [-15, -10, 15, 8], f: function (c, K, s) { cellarDoor(c, K, 0, 0, s); } },
  beeSkeps: { b: [-29, -41, 29, 8], f: function (c, K, s) { c.save(); c.scale(0.85, 0.85); beeSkeps(c, K, 0, 0, s); c.restore(); } },
  woodenBridge: { b: [-52, -34, 52, 16], f: function (c, K, s) { woodenBridge(c, K, 0, 0, s); } },
  farmland: { b: [-58, -28, 58, 12], f: function (c, K, s) { farmland(c, K, 0, 0, s); } },
  wreckedBoat: { b: [-60, -48, 66, 22], f: function (c, K, s) { wreckedBoat(c, K, 0, 0, s); } },
  beachedBoat: { b: [-48, -40, 48, 8], f: function (c, K, s) { beachedBoat(c, K, 0, 0, s); } },
  storageHut: { b: [-36, -66, 60, 14], f: function (c, K, s) { storageHut(c, K, 0, 0, s); } },
  boathouse: { b: [-58, -66, 96, 16], f: function (c, K, s) { boathouse(c, K, 0, 0, s); } },
  watchtower: { b: [-30, -106, 60, 16], f: function (c, K, s) { watchtower(c, K, 0, 0, s); } },
  stoneHearth: { b: [-26, -44, 26, 10], f: function (c, K, s) { stoneHearth(c, K, 0, 0, s); } },
  fireplace: { b: [-18, -36, 18, 6], f: function (c, K, s) { fireplace(c, K, 0, 0, s); } },
  carverBench: { b: [-18, -28, 20, 4], f: function (c, K, s) { carverBench(c, K, 0, 0, s); } },
  deadViking: { b: [-22, -17, 22, 5], f: function (c, K, s) { deadViking(c, K, 0, 0, s); } },
  trough: { b: [-17, -19, 17, 4], f: function (c, K, s) { trough(c, K, 0, 0, s); } },
  woodenWell: { b: [-18, -51, 40, 9], f: function (c, K, s) { c.save(); c.scale(0.75, 0.75); woodenWell(c, K, 0, 0, s); c.restore(); } },
  runestone: { b: [-22, -72, 40, 12], f: function (c, K, s) { runestone(c, K, 0, 0, s); } },
  claimStone: { b: [-15, -50, 28, 9], f: function (c, K, s) { c.save(); c.scale(0.68, 0.68); runestone(c, K, 0, 0, s); c.restore(); } },   // a claim stone: a runestone a hirdman's height, raised to claim a place
  longhouse: { b: [-114, -136, 182, 33], f: function (c, K, s) { c.save(); c.scale(1.3, 1.3); longhouse(c, K, 0, 0, s); c.restore(); } },
  vikingTent: { b: [-38, -64, 38, 10], f: function (c, K, s) { vikingTent(c, K, 0, 0, s); } },
  palisade: { b: [-42, -56, 42, 8], f: function (c, K, s) { palisade(c, K, 0, 0, s); } },
  shieldRack: { b: [-30, -58, 30, 8], f: function (c, K, s) { c.save(); c.scale(0.85, 0.85); shieldRack(c, K, 0, 0, s); c.restore(); } },
  dragonPost: { b: [-18, -76, 28, 8], f: function (c, K, s) { dragonPost(c, K, 0, 0, s); } },
  burialMound: { b: [-62, -40, 62, 12], f: function (c, K, s) { burialMound(c, K, 0, 0, s); } },
  dryingRack: { b: [-34, -44, 34, 8], f: function (c, K, s) { c.save(); c.scale(0.85, 0.85); dryingRack(c, K, 0, 0, s); c.restore(); } },
  forge: { b: [-44, -46, 44, 10], f: function (c, K, s) { forgeObj(c, K, 0, 0, s); } },
  brazier: { b: [-18, -50, 18, 8], f: function (c, K, s) { brazierObj(c, K, 0, 0, s); } },
  cairn: { b: [-26, -44, 26, 8], f: function (c, K, s) { cairnObj(c, K, 0, 0, s); } },
  stoneShip: { b: [-52, -30, 52, 18], f: function (c, K, s) { stoneShip(c, K, 0, 0, s); } },
  woodpile: { b: [-30, -46, 42, 10], f: function (c, K, s) { woodpile(c, K, 0, 0, s); } },
  snowPine: { b: [-60, -170, 100, 18], f: function (c, K, s) { snowPine(c, K, 0, 0, 128, s); } },
  snowPineBig: { b: [-80, -230, 140, 20], f: function (c, K, s) { snowPine(c, K, 0, 0, 190, s); } },
  snowRock: { b: [-34, -50, 34, 10], f: function (c, K, s) { snowRock(c, K, 0, 0, 16, s); } },
  snowBush: { b: [-34, -60, 34, 10], f: function (c, K, s) { snowBush(c, K, 0, 0, 22, s); } },
  deadTree: { b: [-80, -200, 110, 14], f: function (c, K, s) { deadTree(c, K, 0, 0, 170, s); } },
  vent: { b: [-44, -80, 50, 10], f: function (c, K, s) { vent(c, K, 0, 0, 1, s); } },
  ventBig: { b: [-70, -120, 80, 12], f: function (c, K, s) { vent(c, K, 0, 0, 1.8, s); } },
  emberRock: { b: [-34, -50, 34, 10], f: function (c, K, s) { emberRock(c, K, 0, 0, 16, s); } },
  emberBush: { b: [-34, -60, 34, 10], f: function (c, K, s) { emberBush(c, K, 0, 0, 22, s); } },
  cliff: { b: [-48, -64, 52, 12], f: function (c, K, s) { cliffObj(c, K, 0, 0, s); } },
  bed: { b: [-25, -30, 25, 8], f: function (c, K, s) { c.save(); c.scale(0.8, 0.8); bedObj(c, K, 0, 0, s); c.restore(); } },
  rubble: { b: [-34, -34, 34, 10], f: function (c, K, s) { rubbleObj(c, K, 0, 0, s); } },
  bench: { b: [-30, -44, 30, 8], f: function (c, K, s) { benchObj(c, K, 0, 0, s); } },
  well: { b: [-24, -58, 24, 7], f: function (c, K, s) { c.save(); c.scale(0.75, 0.75); wellObj(c, K, 0, 0, s); c.restore(); } },
  haystack: { b: [-27, -35, 35, 8], f: function (c, K, s) { c.save(); c.scale(0.85, 0.85); haystackObj(c, K, 0, 0, s); c.restore(); } },
  cart: { b: [-30, -37, 45, 9], f: function (c, K, s) { c.save(); c.scale(0.72, 0.72); cartObj(c, K, 0, 0, s); c.restore(); } },
  scarecrow: { b: [-26, -76, 26, 8], f: function (c, K, s) { scarecrowObj(c, K, 0, 0, s); } },
  waterfall: { b: [-56, -116, 90, 14], f: function (c, K, s) { waterfallObj(c, K, 0, 0, s); } },
  campfire: { b: [-28, -40, 28, 8], f: function (c, K, s) { campfireObj(c, K, 0, 0, s); } },
  dock: { b: [-16, -26, 84, 26], f: function (c, K, s) { dockObj(c, K, 0, 0, s); } },
  flowerBed: { b: [-30, -50, 30, 14], f: function (c, K, s) { flowerBedObj(c, K, 0, 0, s); } },
  tallGrass: { b: [-24, -40, 24, 10], f: function (c, K, s) { tallGrassObj(c, K, 0, 0, s); } },
  mushRing: { b: [-44, -40, 44, 22], f: function (c, K, s) { mushRing(c, K, 0, 0, s); } },
  chair: { b: [-14, -36, 14, 6], f: function (c, K, s) { chairObj(c, K, 0, 0, s); } },
  table: { b: [-23, -29, 29, 6], f: function (c, K, s) { c.save(); c.scale(0.62, 0.62); tableObj(c, K, 0, 0, s); c.restore(); } },
  oak: { b: [-120, -230, 120, 26], f: function (c, K, s) { oakTree(c, K, 0, 0, 200, s); } },
  pine: { b: [-84, -224, 140, 25], f: function (c, K, s) { pine(c, K, 0, 0, 180, s); } },   // Robin: the pine at 1.4 (2026-10-05)
  pineBig: { b: [-80, -230, 140, 20], f: function (c, K, s) { pine(c, K, 0, 0, 190, s); } },
  willow: { b: [-120, -210, 150, 22], f: function (c, K, s) { willow(c, K, 0, 0, 190, s); } },
  birch: { b: [-92, -270, 118, 20], f: function (c, K, s) { birch(c, K, 0, 0, 205, s); } },
  cypress: { b: [-50, -230, 80, 14], f: function (c, K, s) { cypress(c, K, 0, 0, 170, s); } },
  ancient: { b: [-190, -330, 220, 36], f: function (c, K, s) { ancient(c, K, 0, 0, 260, s); } },
  blossom: { b: [-100, -200, 130, 18], f: function (c, K, s) { blossomTree(c, K, 0, 0, 150, s); } },
  bush: { b: [-34, -60, 34, 10], f: function (c, K, s) { bush(c, K, 0, 0, 22, s, false); } },
  berryBush: { b: [-34, -60, 34, 10], f: function (c, K, s) { bush(c, K, 0, 0, 22, s, true); } },
  fern: { b: [-34, -40, 34, 10], f: function (c, K, s) { fern(c, K, 0, 0, 22, s); } },
  log: { b: [-50, -50, 50, 14], f: function (c, K, s) { fallenLog(c, K, 0, 0, 64, s); } },
  reeds: { b: [-30, -60, 30, 10], f: function (c, K, s) { reeds(c, K, 0, 0, s); } },
  rock: { b: [-36, -40, 36, 10], f: function (c, K, s) { rock(c, K, 0, 0, 16, s, s % 2 === 0); } },
  mushrooms: { b: [-30, -46, 36, 10], f: function (c, K, s) { mushroom(c, K, 0, 0, 22, s); mushroom(c, K, 15, 5, 14, s + 1); } },
  flower: { b: [-20, -40, 24, 8], f: function (c, K, s) { flower(c, K, 0, 0, s); } },
  fence: { b: [-20, -50, 100, 10], f: function (c, K, s) { fence(c, K, 0, 0, 5, s); } },
  rug: { b: [-30, -24, 30, 4], f: function (c, K, s) { rugObj(c, K, 0, 0, s); } },
  crate: { b: [-30, -50, 40, 10], f: function (c, K, s) { crate(c, K, 0, 0, 28, s, 0); } },
  barrel: { b: [-24, -44, 26, 10], f: function (c, K, s) { barrel(c, K, 0, 0, 26, s); } },
  workbench: { b: [-22, -32, 24, 4], f: function (c, K, s) { workbenchObj(c, K, 0, 0, s); } },
  shipwright: { b: [-42, -44, 44, 4], f: function (c, K, s) { shipwrightObj(c, K, 0, 0, s); } },
  chest: { b: [-28, -42, 36, 10], f: function (c, K, s) { chestObj(c, K, 0, 0, 30, s); } },
};
// Furniture and household things sized to the hero (about 27 units tall). The factors are relative to how each was
// drawn: measured beside the hero they were all two to three times too big.
var SIZE = { cellarDoor: 0.7, furnace: 0.72, struckTree: 0.9, fireRing: 0.62, carverBench: 0.63, deadViking: 0.9, fireplace: 0.72, trough: 0.62, campfire: 0.7, scarecrow: 0.6, flowerBed: 0.7, cairn: 0.7, charcoalPit: 0.6, workbench: 0.63, table: 0.56, bed: 0.76, chair: 0.58, bench: 0.5, chest: 0.38, crate: 0.38, barrel: 0.55, woodpile: 0.43, dryingRack: 0.5, brazier: 0.6, stoneHearth: 0.65, woodenWell: 0.55, well: 0.55, haystack: 0.66, cart: 0.72, shieldRack: 0.55, beeSkeps: 0.6, dragonPost: 0.5, shipwright: 0.6, rug: 0.7 };
Object.keys(SIZE).forEach(function (n) {
  var p = PROPS[n]; if (!p) return; var k = SIZE[n], f0 = p.f;
  p.f = function (c, K, sd) { c.save(); c.scale(k, k); f0(c, K, sd); c.restore(); };
  p.b = [Math.floor(p.b[0] * k) - 3, Math.floor(p.b[1] * k) - 3, Math.ceil(p.b[2] * k) + 3, Math.ceil(p.b[3] * k) + 3];
});

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


var scratch = null;

var cacheF = null, cacheO = null, cacheM = null;
var pbuf = null;

// the look the Art Direction page handed over (game.look) merged into STYLE, from one place
function applyStored(st) { try { var lk = JSON.parse(st.getItem('game.look')); if (lk && typeof lk === 'object') { var k; for (k in lk) if (STYLE[k] != null) STYLE[k] = lk[k]; } return lk; } catch (e) { return null; } }
return { DEF: DEF, kit: { applyStored: applyStored, STYLE: STYLE, STYLE_INK: STYLE_INK, STYLE_FLAT: STYLE_FLAT, grain: grain, TW: TW, TH: TH, TILES: TILES, PROPS: PROPS, setup: kitSetup, bakeTile: bakeTile, blendTile: blendTile, bakeProp: bakeProp, mats: mats, rng: rng, clamp: clamp, lerp: lerp, mixHue: mixHue, mk: mk } };
})();
if (typeof module !== 'undefined') module.exports = StyleLab;
