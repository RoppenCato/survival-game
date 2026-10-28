/* build_gate.js: a fence gate for any angle (Colin, AD, 2026-10-28; Clive, GD's playtest ask, picked by Robin). In place of drawRunGate:
   the gate drawn between two posts standing anywhere, in the world's units (x, y on the ground; the screen's y is y * K), so it follows a
   free fence's stretch at whatever angle it runs, and a village fence's gap the same way.
     BuildGate.draw(c, a, b, open, o)   a, b: the two posts' feet [x, y]; open: 0 shut .. 1 open (swung about a, toward the viewer); o:
       { K: 0.75, kind: 'rail' | 'stake', H: the leaf's height (default 16), seed }
   'rail': a leaf of upright slats between two rails, a brace rising from the hinge's foot to the latch's top (the way a gate's brace is set,
   so it holds the latch end up), two iron straps at the hinges, a wooden latch and its peg. 'stake': a hurdle of woven withies on three
   uprights, tied to its post with withy loops, for the stake fences.
   The leaf has a lit face and a shaded one by its turn to the sun (from the south-west, as the set pieces), and a soft shadow on the ground. */
var BuildGate = (function () {
'use strict';
var LINE = '#2a2018', IRON = '#3a3634';
var TONE = { rail: { lit: '#a8875e', mid: '#8a6c4a', dark: '#5e4834', rail: '#7d634a' }, stake: { lit: '#b39a6a', mid: '#94784e', dark: '#655034', rail: '#7a6040' } };
function hs(a, b) { var h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function draw(c, a, b, open, o) {
  o = o || {}; var K = o.K || 0.75, kind = o.kind === 'stake' ? 'stake' : 'rail', H = o.H || 16, seed = o.seed || 0, P = TONE[kind];
  var L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, gap = 2.2, gl = L - gap * 2;
  var nx = -uy, ny = ux; if (ny < 0) { nx = -nx; ny = -ny; }                       // the side toward the viewer (south)
  var t = Math.max(0, Math.min(1, +open || 0)) * 1.15, dx = ux * Math.cos(t) + nx * Math.sin(t), dy = uy * Math.cos(t) + ny * Math.sin(t);   // the leaf's way, swung up to about 66 degrees
  var hx = a[0] + ux * gap, hy = a[1] + uy * gap;                                   // the hinge
  var shear = (dx * dy > 0 ? 0.85 : -0.85) * dy * dy;                                                      // a leaf running toward the viewer shows a little of its west face, or it would close to a line
  function pt(s, h) { return [hx + dx * gl * s + shear * h, (hy + dy * gl * s) * K - h * (1 - 0.25 * dy * dy)]; }
  function quad(s0, h0, s1, h1, fill, lw) { var p = [pt(s0, h0), pt(s1, h0), pt(s1, h1), pt(s0, h1)]; c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (var i = 1; i < 4; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); c.fillStyle = fill; c.fill(); if (lw) { c.strokeStyle = LINE; c.lineWidth = lw; c.stroke(); } }
  function bar(s0, h0, s1, h1, w, fill) { var p0 = pt(s0, h0), p1 = pt(s1, h1); [[LINE, w + 1.2], [fill, w], ['rgba(255,238,200,0.35)', w * 0.3]].forEach(function (q, i) { c.strokeStyle = q[0]; c.lineWidth = q[1]; c.lineCap = 'round'; c.beginPath(); c.moveTo(p0[0], p0[1] - (i === 2 ? w * 0.25 : 0)); c.lineTo(p1[0], p1[1] - (i === 2 ? w * 0.25 : 0)); c.stroke(); }); }
  var face = -(dy * 0.8 - dx * 0.6), lit = face > 0.2 ? 1 : face > -0.3 ? 0.5 : 0;   // the leaf's face turned to the south-west sun, or from it
  var tone = lit === 1 ? P.lit : lit ? P.mid : P.dark;
  c.save();
  var g0 = pt(0, 0), g1 = pt(1, 0); c.strokeStyle = 'rgba(30,26,40,0.22)'; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(g0[0] + 2, g0[1] + 1.5); c.lineTo(g1[0] + 2, g1[1] + 1.5); c.stroke();   // its shadow on the ground
  if (kind === 'rail') {
    var n = Math.max(3, Math.round(gl / 4.2)), sw = 1 / n;
    for (var i = 0; i < n; i++) { var s0 = i * sw + sw * 0.1, s1 = (i + 1) * sw - sw * 0.1, top = H * (0.94 - 0.05 * hs(seed + 3, i));   // the slats, their tops a little uneven
      quad(s0, H * 0.06, s1, top, i % 3 === 1 ? P.mid : tone, 0.55); if (lit) { c.fillStyle = 'rgba(255,238,200,0.22)'; var q = pt(s0, top - 0.3), r = pt(s0, H * 0.1); c.fillRect(Math.min(q[0], r[0]), q[1], 0.7, r[1] - q[1]); } }
    bar(0, H * 0.22, 1, H * 0.22, 2.2, P.rail); bar(0, H * 0.78, 1, H * 0.78, 2.2, P.rail);   // the two rails
    bar(0.04, H * 0.24, 0.94, H * 0.76, 1.8, P.rail);                                             // the brace, rising from the hinge's foot to the latch's top
    [0.22, 0.78].forEach(function (k) { var p0 = pt(-0.02, H * k), p1 = pt(0.2, H * k); c.strokeStyle = IRON; c.lineWidth = 1.5; c.lineCap = 'butt'; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); c.fillStyle = '#6a625a'; [0.06, 0.16].forEach(function (s) { var p = pt(s, H * k); c.fillRect(p[0] - 0.4, p[1] - 0.4, 0.8, 0.8); }); });   // the iron straps and their nails
    var la = pt(0.97, H * 0.55), lb = pt(1.08, H * 0.55); c.strokeStyle = LINE; c.lineWidth = 2.4; c.beginPath(); c.moveTo(la[0], la[1]); c.lineTo(lb[0], lb[1]); c.stroke(); c.strokeStyle = '#9a7d5c'; c.lineWidth = 1.3; c.stroke();   // the latch
  } else {
    [0.02, 0.5, 0.98].forEach(function (s) { bar(s, 0, s, H * 0.95, 1.6, P.rail); });                 // the hurdle's uprights
    var rows = 6; for (var r2 = 0; r2 < rows; r2++) { var hh = H * (0.12 + 0.76 * r2 / (rows - 1)), ph = (r2 % 2) * 0.5, p, k2;
      c.strokeStyle = LINE; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); for (k2 = 0; k2 <= 12; k2++) { p = pt(k2 / 12, hh + Math.sin((k2 / 12 * 4 + ph) * Math.PI) * 0.7); if (k2) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); } c.stroke();
      c.strokeStyle = r2 % 2 ? P.mid : tone; c.lineWidth = 1.6; c.stroke(); }                          // the woven withies
    [0.25, 0.75].forEach(function (k) { var p = pt(-0.02, H * k); c.strokeStyle = '#6a5636'; c.lineWidth = 1; c.beginPath(); c.ellipse(p[0], p[1], 1.6, 2.2, 0, 0, 7); c.stroke(); });   // the withy loops that hang it
  }
  c.restore();
}
return { draw: draw };
})();
if (typeof module !== 'undefined') module.exports = BuildGate;
