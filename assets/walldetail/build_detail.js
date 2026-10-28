/* build_detail.js: variety on big houses' walls and floors (Colin, AD, 2026-10-28; Robin's playtest: big houses melt into one plain surface).
   Two calls the build code makes after it has painted a surface, each drawing small, sparse details picked by a hash of the place, so no two
   walls or floors read alike and nothing repeats across a long wall:
     BuildDetail.face(c, m, x, y, w, h, seed, vertical)   after Build's face(), inside its clip: m.tex 'planks' | 'logs' | 'wattle'
     BuildDetail.floor(c, tile, x, y, w, h, seed)          after a floor tile is painted: tile 'plank' | 'dirt'
   Planks: a weathered darker board, a knot, a batten nailed across a mend, a split. Logs: a darker log, a knot, a check along the grain,
   moss on the lowest course. Wattle: a patch of daub (the mud plaster over the weave), a broken withy. Plank floors: a knot, a darker
   board, a mended board, nail heads. Earth floors: pebbles, strewn straw, a damp patch, a trodden pale patch. All in the house's own ink. */
var BuildDetail = (function () {
'use strict';
function hs(a, b) { var h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
var INK = 'rgba(35,26,22,0.75)', FAINT = 'rgba(35,26,22,0.35)', LIT = 'rgba(255,240,210,0.28)';
function line(c, pts, col, lw) { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
function knot(c, x, y, r) { c.fillStyle = 'rgba(60,40,26,0.55)'; c.beginPath(); c.ellipse(x, y, r * 1.4, r, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.45; c.stroke(); c.fillStyle = 'rgba(30,20,14,0.7)'; c.beginPath(); c.ellipse(x, y, r * 0.55, r * 0.4, 0, 0, 7); c.fill(); }
function nail(c, x, y) { c.fillStyle = 'rgba(40,36,34,0.9)'; c.beginPath(); c.arc(x, y, 0.45, 0, 7); c.fill(); }
function face(c, m, x, y, w, h, seed, vertical) {
  var i, s;
  if (m.tex === 'planks') {
    var pw = 6.4, np = Math.ceil(w / pw);
    for (i = 0; i < np; i++) { var px = x + i * pw; s = hs(seed + 101, i);
      if (s < 0.18) { c.fillStyle = 'rgba(40,26,14,0.2)'; c.fillRect(px + 0.4, y, pw - 0.8, h); }                                           // a weathered darker board
      else if (s < 0.3) knot(c, px + pw / 2, y + h * (0.25 + 0.5 * hs(seed + 7, i)), 0.9);                                                // a knot
      else if (s < 0.38 && !vertical && i < np - 1) { var by = y + h * (0.3 + 0.4 * hs(seed + 9, i)); c.fillStyle = '#9c7e5c'; c.fillRect(px + 1, by, pw * 1.6, 2.2); c.strokeStyle = INK; c.lineWidth = 0.4; c.strokeRect(px + 1, by, pw * 1.6, 2.2); c.fillStyle = LIT; c.fillRect(px + 1.2, by + 0.2, pw * 1.6 - 0.4, 0.5); nail(c, px + 2.2, by + 1.1); nail(c, px + pw * 1.6, by + 1.1); }   // a batten nailed across a mend
      else if (s < 0.46) { var sy = y + h * hs(seed + 11, i) * 0.4; line(c, [[px + pw * 0.4, sy], [px + pw * 0.45, sy + h * 0.35], [px + pw * 0.38, sy + h * 0.5]], FAINT, 0.5); } }   // a split
  } else if (m.tex === 'logs') {
    var lh = 5.4, n = Math.ceil(h / lh);
    for (i = 0; i < n; i++) { var ly = y + h - (i + 1) * lh; s = hs(seed + 201, i);
      if (s < 0.16) { c.fillStyle = 'rgba(30,20,12,0.18)'; c.fillRect(x, ly + 0.4, w, lh - 0.8); }                                           // a darker log
      else if (s < 0.3) knot(c, x + w * (0.2 + 0.6 * hs(seed + 5, i)), ly + lh / 2, 0.85);                                                // a knot
      else if (s < 0.4) { var cx = x + w * hs(seed + 13, i) * 0.5; line(c, [[cx, ly + lh * 0.45], [cx + w * 0.35, ly + lh * 0.5]], FAINT, 0.45); }   // a check along the grain
      if (i === 0 && hs(seed + 17, 0) < 0.45) { c.fillStyle = 'rgba(104,132,66,0.85)'; for (var k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x + w * hs(seed + 19, k), ly + lh * 0.45, 1.8 + hs(seed + 21, k), 1.1, 0, 0, 7); c.fill(); } } }   // moss on the lowest course
  } else if (m.tex === 'wattle') {
    s = hs(seed + 301, 0);
    if (s < 0.4) { var dx = x + w * (0.15 + 0.5 * hs(seed + 23, 1)), dy = y + h * (0.25 + 0.45 * hs(seed + 25, 1)), rx = 4 + 4 * hs(seed + 27, 1), ry = 3 + 4 * hs(seed + 29, 1);   // daub over the weave
      c.fillStyle = '#ab9374'; c.beginPath(); for (var t = 0; t <= 14; t++) { var a = t / 14 * 6.283, r = 1 + 0.18 * Math.sin(a * 3 + seed); c.lineTo(dx + Math.cos(a) * rx * r, dy + Math.sin(a) * ry * r); } c.closePath(); c.fill(); c.strokeStyle = 'rgba(70,56,40,0.55)'; c.lineWidth = 0.45; c.stroke();
      c.fillStyle = 'rgba(255,240,215,0.25)'; c.beginPath(); c.ellipse(dx - rx * 0.25, dy - ry * 0.3, rx * 0.45, ry * 0.25, 0, 0, 7); c.fill(); }
    else if (s < 0.52) { var gx = x + w * hs(seed + 31, 2), gy = y + h * (0.3 + 0.3 * hs(seed + 33, 2)); c.fillStyle = 'rgba(28,20,14,0.6)'; c.fillRect(gx, gy, 3.5, 2.2); line(c, [[gx - 0.5, gy - 0.4], [gx + 2, gy - 1.6]], INK, 0.6); }   // a broken withy and the gap behind it
  }
}
function floor(c, tile, x, y, w, h, seed) {
  var s = hs(seed + 401, 0), i;
  if (tile === 'plank') {
    if (s < 0.14) knot(c, x + w * (0.2 + 0.6 * hs(seed, 1)), y + h * (0.2 + 0.6 * hs(seed, 2)), 0.9);
    else if (s < 0.26) { var bh = h / 4, by = y + Math.floor(hs(seed, 3) * 4) * bh; c.fillStyle = 'rgba(40,26,14,0.26)'; c.fillRect(x, by + 0.3, w, bh - 0.6); }   // a darker board
    else if (s < 0.34) { var mh = h / 4, my = y + Math.floor(hs(seed, 4) * 4) * mh, mx = x + w * hs(seed, 5) * 0.5; c.fillStyle = 'rgba(214,180,130,0.35)'; c.fillRect(mx, my + 0.3, w * 0.45, mh - 0.6); line(c, [[mx, my + 0.3], [mx, my + mh - 0.3]], INK, 0.45); nail(c, mx + 1.2, my + mh / 2); }   // a mended board
    else if (s < 0.5) for (i = 0; i < 4; i++) nail(c, x + w * (0.1 + 0.8 * hs(seed, 6 + i)), y + (Math.floor(hs(seed, 10 + i) * 4) + 0.5) * h / 4);   // nail heads
  } else if (tile === 'dirt') {
    if (s < 0.22) for (i = 0; i < 4; i++) { var px = x + w * hs(seed, 20 + i), py = y + h * hs(seed, 30 + i), pr = 0.8 + 0.7 * hs(seed, 40 + i); c.fillStyle = '#8c8478'; c.beginPath(); c.ellipse(px, py, pr * 1.3, pr, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,250,236,0.35)'; c.beginPath(); c.ellipse(px - pr * 0.3, py - pr * 0.3, pr * 0.5, pr * 0.3, 0, 0, 7); c.fill(); }   // pebbles
    else if (s < 0.4) for (i = 0; i < 6; i++) { var sx = x + w * hs(seed, 50 + i), sy = y + h * hs(seed, 60 + i), a = hs(seed, 70 + i) * 3.1; line(c, [[sx, sy], [sx + Math.cos(a) * 3, sy + Math.sin(a) * 1.6]], 'rgba(214,186,110,0.8)', 0.6); }   // strewn straw
    else if (s < 0.52) { c.fillStyle = 'rgba(50,34,20,0.07)'; for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(x + w * (0.3 + 0.4 * hs(seed, 81 + i)), y + h * (0.35 + 0.3 * hs(seed, 85 + i)), w * (0.12 + 0.1 * hs(seed, 89 + i)), h * (0.1 + 0.08 * hs(seed, 93 + i)), 0, 0, 7); c.fill(); } }   // a damp patch
    else if (s < 0.62) { c.fillStyle = 'rgba(255,240,210,0.12)'; c.beginPath(); c.ellipse(x + w * 0.5, y + h * 0.55, w * 0.4, h * 0.28, 0, 0, 7); c.fill(); }   // trodden pale
  }
}
return { face: face, floor: floor, hs: hs };
})();
if (typeof module !== 'undefined') module.exports = BuildDetail;
