/* Build: the building pieces, shared by the Base Editor and the game.
   A building is B = { floors: { 'x,y': floorMat }, H: { 'x,y': { t, m } }, V: { 'x,y': { t, m } } } on a tile grid:
   floors fill tiles, H edges run along the top of tile (x, y), V edges along its left side. t is 'wall', 'door'
   or 'window'; m indexes WALLS. Build.rooms finds the closed rooms (which get a roof) and the collision circles;
   drawH, drawV and drawRoof draw the pieces in the world (y-sorted by the page). cfg: wallH, thick, overhang, roof.
   Since 2026-10-06: posts at tile corners (B.posts) make the frame a wall needs at both ends (postsOk, ensurePosts, drawPost,
   drawBeam); stairs (B.stairs, drawStairs) lead to a floor above; a fireplace's chimney (drawChimney); rail fences and
   dry-stone walls among the yard pieces; and the roofs are drawn as turf, thatch (fringe, straw rows, crossed ridge boards)
   or shingles. UP is the height of one storey. */
var Build = (function () {
'use strict';
var T = 32, TS = 24, K = 0.75, LINE = '#231a16';
var WALLS = [
  { name: 'Logs', face: '#6e5540', top: '#8c6e52', dark: '#3e2d20', tex: 'logs' },      // the earth palette of the art direction (2026-10-07)
  { name: 'Planks', face: '#7d634a', top: '#9a7c5c', dark: '#4a3626', tex: 'planks' },
  { name: 'Wattle', face: '#a89474', top: '#bfab88', dark: '#5e4e36', tex: 'wattle' },
  { name: 'Stone', face: '#7e7f84', top: '#9a9ba0', dark: '#4f5058', tex: 'blocks' },
  { name: 'Turf', face: '#5d7a48', top: '#72915a', dark: '#3b5230', tex: 'turf' }
];
// Floors go on any land tile, so they make paths, yards and decks round a house as well as the floor in it. The dock
// (water: true) also goes on water beside land or another dock, and can be walked on.
var FLOORS = [{ name: 'Planks', tile: 'plank' }, { name: 'Packed earth', tile: 'dirt' }, { name: 'Stone flags', tile: 'path' },
  { name: 'Gravel trail', tile: 'trail', bare: true }, { name: 'Grass', tile: 'grass', bare: true }, { name: 'Dark grass', tile: 'grassDark', bare: true }, { name: 'Moss', tile: 'moss', bare: true }, { name: 'Bare rock', tile: 'rock', bare: true },
  { name: 'Dock', tile: 'plank', water: true },
  { name: 'Gravel path', tile: 'trail', path: true }, { name: 'Earth path', tile: 'dirt', path: true }, { name: 'Stone path', tile: 'path', path: true }];   // paths: rounded, joining their neighbours
var ROOFS = [{ name: 'Turf', col: '#607f49', line: '#3e5a33', ridge: '#5a4030' }, { name: 'Thatch', col: '#bda258', line: '#846a34', ridge: '#4a3426' }, { name: 'Wood shingles', col: '#6a5240', line: '#44332a', ridge: '#3a2a22' }, { name: 'No roof' }];
var CFG = { wallH: 32, thick: 5, overhang: 4, roof: 1, seeThrough: 0.12, gable: 'auto', wallM: 1 };   // thatch unless another roof is chosen (Robin, 2026-10-06); walls a storey and a half (2026-10-07); gable: 'auto' (a gable end facing south when the room is as deep as it is wide), 'ns', 'ew'; wallM the gable's material
// Edge types: wall, door and window close a room (and get a roof). fence, gate and palisade are yard pieces: they
// stop you (the gate opens as you come near) but never close a room, so a fenced yard stays open to the sky.
var YARD = { fence: 1, gate: 1, palisade: 1, rail: 1, drystone: 1 }, OPEN = { door: 1, gate: 1 };
var UP = CFG.wallH + CFG.thick * K + 1;      // one storey: how far up the floor above (or the roof) sits, in screen units
var FENCE_H = 12, PALISADE_H = 30;
function key(x, y) { return x + ',' + y; }
function cfg(c) { var o = {}, k; for (k in CFG) o[k] = CFG[k]; for (k in c || {}) if (c[k] != null) o[k] = c[k]; return o; }

// the edge of a tile nearest to a world point, with how far from it (in tiles)
function edgeAt(wx, wy) {
  var tx = Math.floor(wx / T), ty = Math.floor(wy / T), fx = wx / T - tx, fy = wy / T - ty, best = Math.min(fx, 1 - fx, fy, 1 - fy);
  if (best === fy) return { L: 'H', x: tx, y: ty, d: best }; if (best === 1 - fy) return { L: 'H', x: tx, y: ty + 1, d: best };
  if (best === fx) return { L: 'V', x: tx, y: ty, d: best }; return { L: 'V', x: tx + 1, y: ty, d: best };
}
// The frame: posts stand at tile corners (B.posts keyed 'x,y' by corner). A wall, door or window needs a post at each
// end; fences do not. ensurePosts raises the posts a building's walls would have needed (old saves, the village).
function postsOk(B, ed) { var P = B.posts || {}; return ed.L === 'H' ? !!(P[key(ed.x, ed.y)] && P[key(ed.x + 1, ed.y)]) : !!(P[key(ed.x, ed.y)] && P[key(ed.x, ed.y + 1)]); }
function postUsed(B, x, y) {                      // does a wall, door or window stand on the post at corner (x, y)?
  function solid(e) { return e && !YARD[e.t]; }
  return solid(B.H[key(x, y)]) || solid(B.H[key(x - 1, y)]) || solid(B.V[key(x, y)]) || solid(B.V[key(x, y - 1)]);
}
function ensurePosts(B) {
  if (!B.posts) B.posts = {};
  var k, p, e;
  for (k in B.H) { e = B.H[k]; if (YARD[e.t]) continue; p = k.split(','); if (!B.posts[k]) B.posts[k] = { m: e.m }; var k2 = key(+p[0] + 1, +p[1]); if (!B.posts[k2]) B.posts[k2] = { m: e.m }; }
  for (k in B.V) { e = B.V[k]; if (YARD[e.t]) continue; p = k.split(','); if (!B.posts[k]) B.posts[k] = { m: e.m }; var k3 = key(+p[0], +p[1] + 1); if (!B.posts[k3]) B.posts[k3] = { m: e.m }; }
}
function edgeOk(ed, GW, GH) { return ed.L === 'H' ? (ed.x >= 0 && ed.x < GW && ed.y >= 0 && ed.y <= GH) : (ed.x >= 0 && ed.x <= GW && ed.y >= 0 && ed.y < GH); }

// Closed rooms by flood fill from the outside, and three small collision circles along every wall and window
// (doors are open ground). Returns { rooms: [{ id, tiles, maxY }], roomOf: Int32Array, solids: [] }.
// bounds (optional) limits the search to a rectangle of tiles, for big grids.
function rooms(B, GW, GH, bounds) {
  var bx0 = 0, by0 = 0, bx1 = GW - 1, by1 = GH - 1, x, y, i;
  if (bounds) { bx0 = Math.max(0, bounds.x0); by0 = Math.max(0, bounds.y0); bx1 = Math.min(GW - 1, bounds.x1); by1 = Math.min(GH - 1, bounds.y1); }
  var w = bx1 - bx0 + 1, h = by1 - by0 + 1;
  if (w <= 0 || h <= 0) return { rooms: [], roomOf: new Int32Array(0), solids: [], x0: bx0, y0: by0, w: 0, h: 0, at: function () { return -1; } };
  var seen = new Uint8Array(w * h), roomOf = new Int32Array(w * h).fill(-1), q;
  function idx(x, y) { return (y - by0) * w + (x - bx0); }
  function inside(x, y) { return x >= bx0 && y >= by0 && x <= bx1 && y <= by1; }
  function closes(e) { return e && !YARD[e.t]; }
  function pass(ax, ay, bx, by) {                       // can you step from tile a to its neighbour b (as far as rooms go)?
    if (bx < ax) return !closes(B.V[key(ax, ay)]); if (bx > ax) return !closes(B.V[key(bx, by)]);
    if (by < ay) return !closes(B.H[key(ax, ay)]); return !closes(B.H[key(bx, by)]);
  }
  function flood(start, id) {
    var tiles = []; q = start.slice();
    while (q.length) {
      var c = q.pop(), cx = c[0], cy = c[1];
      var nb = [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]];
      for (var n = 0; n < 4; n++) {
        var nx = nb[n][0], ny = nb[n][1];
        if (!inside(nx, ny) || seen[idx(nx, ny)] || !pass(cx, cy, nx, ny)) continue;
        seen[idx(nx, ny)] = 1; roomOf[idx(nx, ny)] = id; tiles.push(nb[n]); q.push(nb[n]);
      }
    }
    return tiles;
  }
  var border = [];
  for (x = bx0; x <= bx1; x++) { border.push([x, by0], [x, by1]); } for (y = by0; y <= by1; y++) { border.push([bx0, y], [bx1, y]); }
  border.forEach(function (b) { seen[idx(b[0], b[1])] = 1; });
  flood(border, -1);
  var out = [];
  for (y = by0; y <= by1; y++) for (x = bx0; x <= bx1; x++) {
    if (seen[idx(x, y)]) continue;
    seen[idx(x, y)] = 1; roomOf[idx(x, y)] = out.length;
    var tiles = [[x, y]].concat(flood([[x, y]], out.length)), maxY = 0;
    tiles.forEach(function (t) { maxY = Math.max(maxY, t[1]); });
    out.push({ id: 'r' + x + '_' + y, tiles: tiles, maxY: maxY });
  }
  var solids = [], k, p;
  for (k in B.H) { if (OPEN[B.H[k].t]) continue; p = k.split(','); for (i = 0; i < 3; i++) solids.push({ x: p[0] * T + 5.3 + i * 10.7, y: p[1] * T, r: 5.5, hide: true }); }
  for (k in B.V) { if (OPEN[B.V[k].t]) continue; p = k.split(','); for (i = 0; i < 3; i++) solids.push({ x: p[0] * T, y: p[1] * T + 5.3 + i * 10.7, r: 5.5, hide: true }); }
  for (k in B.posts || {}) { p = k.split(','); solids.push({ x: p[0] * T, y: p[1] * T, r: 3.5, hide: true }); }
  return { rooms: out, roomOf: roomOf, solids: solids, x0: bx0, y0: by0, w: w, h: h, at: function (tx, ty) { return inside(tx, ty) ? roomOf[idx(tx, ty)] : -1; } };
}

/* drawing (reworked 2026-10-07 for the art direction, docs/art-direction.md: every piece a real material drawn in ink and
   grain, a cool shadow side, a warm lit edge, a thin hand-made line all round and a heavy one on the shadow side) */
var INK = { line: '#231a16', lit: 'rgba(255,238,200,0.42)', shadowHue: 222, grain: 0.2, soft: 'rgba(35,26,22,0.55)', faint: 'rgba(35,26,22,0.32)' };
var grainCv = null;
function mkCv(w, h) { if (typeof document !== 'undefined') { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; } if (global.__mk) return global.__mk(w, h); return require('@napi-rs/canvas').createCanvas(w, h); }
function grainPat(c) {
  if (!grainCv) { grainCv = mkCv(64, 64); var g = grainCv.getContext('2d'), i, R = 0.41; for (i = 0; i < 900; i++) { R = (R * 9301 + 49297) % 233280; var x = R / 233280 * 64; R = (R * 9301 + 49297) % 233280; var y = R / 233280 * 64; R = (R * 9301 + 49297) % 233280; var d = R / 233280; g.fillStyle = d < 0.55 ? 'rgba(20,14,10,' + (0.25 + d * 0.5).toFixed(2) + ')' : 'rgba(255,245,225,' + (0.2 + (1 - d) * 0.6).toFixed(2) + ')'; g.fillRect(x, y, 1 + (d < 0.2 ? 1 : 0), 1); } }
  if (!c.__inkPat) c.__inkPat = c.createPattern(grainCv, 'repeat');
  return c.__inkPat;
}
function hs(i, j) { var v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); }
function mix(a, b, t) {                                               // mix two hex colours
  function hx(s) { return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]; }
  var p = hx(a), q = hx(b), o = '#', i; for (i = 0; i < 3; i++) { var v = Math.round(p[i] + (q[i] - p[i]) * t).toString(16); o += v.length < 2 ? '0' + v : v; } return o;
}
function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function wob(pts, amp, seed) {                                        // a hand-made edge: a point in the middle of every edge, pushed a little off it
  if (!amp) return pts; var out = [], n = pts.length, i;
  for (i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n], ex = q[0] - p[0], ey = q[1] - p[1], L = Math.hypot(ex, ey) || 1, k = (hs(seed, i) - 0.5) * amp; out.push(p); if (L > 6) out.push([p[0] + ex * 0.5 - ey / L * k, p[1] + ey * 0.5 + ex / L * k]); }
  return out;
}
function path(c, d) { var i; c.beginPath(); c.moveTo(d[0][0], d[0][1]); for (i = 1; i < d.length; i++) c.lineTo(d[i][0], d[i][1]); c.closePath(); }
function heavy(c, d, w) {                                             // the heavy line on the shadow side: each edge as dark as its outward normal faces away from the light
  var n = d.length, area = 0, i; if (n < 3) return;
  for (i = 0; i < n; i++) { var p = d[i], q = d[(i + 1) % n]; area += p[0] * q[1] - q[0] * p[1]; }
  var sgn = area > 0 ? 1 : -1, lx = -0.6, ly = -0.8;
  c.save(); c.lineCap = 'round'; c.lineWidth = w; c.strokeStyle = INK.line;
  for (i = 0; i < n; i++) { var a = d[i], b = d[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey) || 1, nx = ey / L * sgn, ny = -ex / L * sgn, k = Math.max(0, Math.min(1, (-(nx * lx + ny * ly) + 0.15) / 0.9)); if (k < 0.04) continue; c.globalAlpha = k * k; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  c.restore();
}
// an ink shape: the fill, the grain and a cool shade toward the lower right inside it, a warm lit edge up and left, the thin line
// all round and the heavy line on the shadow side. o: { wob, seed, flat (no shade or lit edge), noLine, lw, heavy, lit, shade }
function ink(c, pts, fill, o) {
  o = o || {}; var d = wob(pts, o.wob == null ? 1.1 : o.wob, o.seed || 1), i, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (i = 0; i < d.length; i++) { x0 = Math.min(x0, d[i][0]); y0 = Math.min(y0, d[i][1]); x1 = Math.max(x1, d[i][0]); y1 = Math.max(y1, d[i][1]); }
  c.save(); path(c, d); c.fillStyle = fill; c.fill(); path(c, d); c.clip();
  if (INK.grain > 0) { c.globalAlpha = INK.grain; c.fillStyle = grainPat(c); c.fillRect(x0, y0, x1 - x0, y1 - y0); }
  if (!o.flat) { c.globalAlpha = o.shade == null ? 0.16 : o.shade; var g = c.createLinearGradient(x0, y0, x0 + (x1 - x0) * 0.7, y1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'hsla(' + INK.shadowHue + ',40%,15%,1)'); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0); }
  c.globalAlpha = 1;
  if (!o.flat && o.lit !== false) { c.translate(-0.6, -0.6); path(c, d); c.lineWidth = 1.1; c.strokeStyle = INK.lit; c.stroke(); }
  c.restore();
  if (!o.noLine) { path(c, d); c.lineJoin = 'round'; c.lineWidth = o.lw || 0.8; c.strokeStyle = INK.line; c.stroke(); heavy(c, d, o.heavy || 1.8); }
  return d;
}
function stroke(c, pts, col, w, a, close) { var i; c.save(); c.globalAlpha = a == null ? 1 : a; c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); if (close) c.closePath(); c.stroke(); c.restore(); }
function knot(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r, r * 0.65, 0, 0, 7); c.fill(); c.strokeStyle = INK.faint; c.lineWidth = 0.5; c.beginPath(); c.ellipse(x, y, r * 1.6, r, 0, 0.3, 2.9); c.stroke(); }
// the material inside a face, clipped to it: logs, planks, wattle, stone or turf
function face(c, m, x, y, w, h, seed, vertical) {
  var i, j; c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  if (m.tex === 'logs') {
    var lh = 5.4, n = Math.ceil(h / lh);
    for (i = 0; i < n; i++) { var ly = y + h - (i + 1) * lh, tone = (hs(seed, i) - 0.5) * 0.16; ink(c, [[x - 1, ly + 0.3], [x + w + 1, ly + 0.3], [x + w + 1, ly + lh - 0.2], [x - 1, ly + lh - 0.2]], mix(m.face, tone > 0 ? '#ffffff' : '#000000', Math.abs(tone)), { wob: 0.6, seed: seed + i, flat: true, noLine: true }); stroke(c, [[x, ly + lh - 0.4], [x + w, ly + lh - 0.4]], INK.soft, 0.7); stroke(c, [[x + 1, ly + 1], [x + w - 1, ly + 1]], INK.lit, 0.7); if (hs(seed + 3, i) < 0.4) knot(c, x + 4 + hs(seed, i + 9) * (w - 8), ly + lh / 2, 1.1, m.dark); }
  } else if (m.tex === 'planks') {
    var pw = 6.4, np = Math.ceil(w / pw);
    for (i = 0; i < np; i++) { var px = x + i * pw, tone2 = (hs(seed, i) - 0.5) * 0.14; c.fillStyle = mix(m.face, tone2 > 0 ? '#ffffff' : '#000000', Math.abs(tone2)); c.fillRect(px, y, pw, h); stroke(c, [[px + pw - 0.3 + (hs(seed, i + 4) - 0.5) * 0.6, y], [px + pw - 0.3 - (hs(seed, i + 5) - 0.5) * 0.6, y + h]], INK.soft, 0.6); if (hs(seed + 1, i) < 0.35) knot(c, px + pw / 2, y + 3 + hs(seed, i + 2) * (h - 6), 0.9, m.dark); c.fillStyle = INK.line; c.globalAlpha = 0.5; c.fillRect(px + pw / 2 - 0.5, y + 2.2, 1, 1); c.fillRect(px + pw / 2 - 0.5, y + h - 3.2, 1, 1); c.globalAlpha = 1; }
    if (!vertical && h > 12) stroke(c, [[x, y + h * 0.5], [x + w, y + h * 0.5 + 0.4]], INK.faint, 0.8);
  } else if (m.tex === 'wattle') {
    var sx = 5.5, rows = 3.6; c.lineCap = 'round';
    for (j = 0; j * rows < h; j++) { var ry = y + h - j * rows - 1.6, odd = j % 2; for (i = -1; i * sx < w + sx; i++) { var cx = x + i * sx + (odd ? sx / 2 : 0); c.strokeStyle = odd ? mix(m.face, '#ffffff', 0.12) : mix(m.face, '#000000', 0.12); c.lineWidth = 2.1; c.beginPath(); c.moveTo(cx - sx / 2, ry + 0.4); c.quadraticCurveTo(cx, ry - 2.2, cx + sx / 2, ry + 0.4); c.stroke(); c.strokeStyle = INK.faint; c.lineWidth = 0.5; c.beginPath(); c.moveTo(cx - sx / 2, ry + 1.4); c.quadraticCurveTo(cx, ry - 1.2, cx + sx / 2, ry + 1.4); c.stroke(); } }
    for (i = 0; i * sx <= w; i++) stroke(c, [[x + i * sx + sx / 2, y], [x + i * sx + sx / 2 + (hs(seed, i) - 0.5) * 0.8, y + h]], m.dark, 1.3, 0.75);
  } else if (m.tex === 'blocks') {
    c.fillStyle = m.dark; c.fillRect(x, y, w, h);
    var rh = 5.2, nr = Math.ceil(h / rh);
    for (j = 0; j < nr; j++) { var by = y + h - (j + 1) * rh, cx2 = x - (j % 2 ? 4 : 0) - hs(seed, j) * 3; while (cx2 < x + w) { var bw = 5 + hs(seed + j, cx2) * 6, tone3 = (hs(seed, j * 7 + cx2) - 0.5) * 0.18; ink(c, [[cx2 + 0.5, by + 0.6], [cx2 + bw - 0.4, by + 0.4], [cx2 + bw - 0.6, by + rh - 0.5], [cx2 + 0.6, by + rh - 0.3]], mix(m.face, tone3 > 0 ? '#ffffff' : '#000000', Math.abs(tone3)), { wob: 0.8, seed: seed + j * 13 + Math.round(cx2), flat: true, lw: 0.55, heavy: 0.9 }); cx2 += bw; } }
  } else if (m.tex === 'turf') {
    var th2 = 4.6, nt = Math.ceil(h / th2);
    for (i = 0; i < nt; i++) { var ty = y + h - (i + 1) * th2, tone4 = (hs(seed, i) - 0.5) * 0.14, pts = [[x - 1, ty + th2]], k; for (k = 0; k <= 8; k++) pts.push([x - 1 + (w + 2) * k / 8, ty + 0.8 + (hs(seed + i, k) - 0.5) * 1.6]); pts.push([x + w + 1, ty + th2]); ink(c, pts, mix(i % 2 ? m.face : m.top, tone4 > 0 ? '#ffffff' : '#000000', Math.abs(tone4)), { wob: 0, flat: true, noLine: true }); stroke(c, [[x, ty + th2 - 0.3], [x + w, ty + th2 - 0.3]], INK.faint, 0.6); for (k = 0; k < 4; k++) { var gx = x + 2 + hs(seed + i + 3, k) * (w - 4); stroke(c, [[gx, ty + 2], [gx + (hs(seed, k + i) - 0.5) * 2, ty - 1.5]], m.dark, 0.7, 0.8); } }
  }
  c.restore();
}
// the cap: the top of a wall seen from above (plan), with the material's grain running along it
function cap(c, m, x, y, w, h, seed, along) {
  ink(c, rect(x, y, w, h), m.top, { wob: 0.5, seed: seed + 50, flat: true, lw: 0.7, heavy: 1.2 });
  if (m.tex === 'logs' || m.tex === 'planks') stroke(c, along ? [[x + 2, y + h / 2], [x + w - 2, y + h / 2]] : [[x + w / 2, y + 1], [x + w / 2, y + h - 1]], INK.faint, 0.6);
  else if (m.tex === 'blocks') { var i; for (i = 6; i < (along ? w : h); i += 7) stroke(c, along ? [[x + i, y + 0.5], [x + i + 0.6, y + h - 0.5]] : [[x + 0.5, y + i], [x + w - 0.5, y + i + 0.6]], INK.faint, 0.6); }
}
function post(c, x, y, w, h, m, seed) {                              // a short fence post: a split timber with a lit side and a cut top
  ink(c, [[x - w / 2, y], [x - w / 2 - 0.2, y - h], [x + w / 2 + 0.2, y - h - 0.6], [x + w / 2, y]], m.dark, { wob: 0.5, seed: seed || 7, lw: 0.7, heavy: 1.3 });
}
// a fence along the top of tile (x, y): posts with woven wattle between; a gate: a bar frame that swings open as you come near;
// a palisade: a row of pointed logs; a rail fence; a dry-stone wall
function drawFenceH(c, x, y, e, open, C) {
  var m = WALLS[e.m] || WALLS[2], x0 = x * T, yb = y * TS, i, seed = x * 31 + y * 7;
  if (e.t === 'palisade') {
    for (i = 0; i < 4; i++) { var px = x0 + i * 8, ph = PALISADE_H - 2 + hs(seed, i) * 4, col = mix(m.face, i % 2 ? '#ffffff' : '#000000', 0.08); ink(c, [[px + 0.3, yb], [px, yb - ph + 4], [px + 4, yb - ph], [px + 8, yb - ph + 4], [px + 7.7, yb]], col, { wob: 0.7, seed: seed + i, lw: 0.75, heavy: 1.5 }); stroke(c, [[px + 2.5, yb - 3], [px + 2.2, yb - ph + 6]], INK.faint, 0.6); stroke(c, [[px + 5.5, yb - 2], [px + 5.8, yb - ph + 7]], INK.faint, 0.5); }
    ink(c, rect(x0, yb - 11, T, 2.4), m.dark, { wob: 0.4, seed: seed + 9, flat: true, lw: 0.6, heavy: 1 }); ink(c, rect(x0, yb - 22, T, 2.4), m.dark, { wob: 0.4, seed: seed + 10, flat: true, lw: 0.6, heavy: 1 });
    return;
  }
  var h = FENCE_H;
  if (e.t === 'rail') {                   // a split-rail fence: two rails between posts, the rails a little bent
    post(c, x0 + 1.5, yb, 3, h + 3, m, seed); post(c, x0 + T - 1.5, yb, 3, h + 3, m, seed + 1);
    [yb - h + 1, yb - 5.5].forEach(function (ry, ri) { ink(c, [[x0, ry], [x0 + T / 2, ry - 0.5 + ri * 0.8], [x0 + T, ry], [x0 + T, ry + 2.6], [x0 + T / 2, ry + 2.2 + ri * 0.8], [x0, ry + 2.6]], m.face, { wob: 0, seed: seed + ri, lw: 0.65, heavy: 1.2 }); if (hs(seed, ri) < 0.6) knot(c, x0 + 8 + hs(seed, ri + 4) * 16, ry + 1.3, 0.8, m.dark); });
    return;
  }
  if (e.t === 'drystone') {               // a low wall of stacked stones with a row of capstones set on edge
    var sm = WALLS[3]; c.save(); c.beginPath(); c.rect(x0 - 0.5, yb - 14, T + 1, 14); c.clip(); face(c, sm, x0, yb - 11, T, 11, seed);
    var cx = x0 + 0.5; while (cx < x0 + T) { var cw = 3.2 + hs(seed, cx) * 2.5; ink(c, [[cx, yb - 10.5], [cx + cw * 0.3, yb - 14 + hs(seed, cx + 1) * 1.5], [cx + cw * 0.8, yb - 13.6], [cx + cw, yb - 10.5]], mix(sm.top, '#000000', hs(seed, cx + 2) * 0.12), { wob: 0.5, seed: seed + Math.round(cx), flat: true, lw: 0.55, heavy: 0.9 }); cx += cw; }
    c.restore(); stroke(c, [[x0, yb - 0.3], [x0 + T, yb - 0.3]], INK.line, 1.2); stroke(c, [[x0, yb - 11.5], [x0, yb - 0.3]], INK.line, 0.6);
    return;
  }
  if (e.t === 'gate') {
    post(c, x0 + 1.5, yb, 3, h + 3, m, seed); post(c, x0 + T - 1.5, yb, 3, h + 3, m, seed + 1);
    if (open) { ink(c, rect(x0 + 3, yb - h - 1, 3, h), m.top, { wob: 0.4, seed: seed + 2, lw: 0.6, heavy: 1 }); return; }
    ink(c, rect(x0 + 3, yb - h, T - 6, 2.4), m.top, { wob: 0.4, seed: seed + 3, lw: 0.6, heavy: 1 }); ink(c, rect(x0 + 3, yb - 4, T - 6, 2.4), m.top, { wob: 0.4, seed: seed + 4, lw: 0.6, heavy: 1 });
    ink(c, [[x0 + 3.5, yb - 2], [x0 + T - 3.5, yb - h + 0.5], [x0 + T - 3.5, yb - h + 2.8], [x0 + 3.5, yb + 0.3]], m.face, { wob: 0.3, seed: seed + 5, flat: true, lw: 0.55, heavy: 0.9 });
    return;
  }
  ink(c, rect(x0, yb - h + 2, T, h - 3), m.face, { wob: 0.6, seed: seed, lw: 0.7, heavy: 1.3 }); face(c, { face: m.face, dark: m.dark, tex: 'wattle' }, x0, yb - h + 2, T, h - 3, seed);
  post(c, x0 + 1.5, yb, 3, h + 2, m, seed); post(c, x0 + T / 2, yb, 3, h + 2, m, seed + 1); post(c, x0 + T - 1.5, yb, 3, h + 2, m, seed + 2);
}
function drawFenceV(c, x, y, e, open, more, C) {
  var m = WALLS[e.m] || WALLS[2], xl = x * T, yt = y * TS, i, seed = x * 17 + y * 29;
  if (e.t === 'palisade') {
    for (i = 0; i < 3; i++) { var py = yt + i * 8, ph = PALISADE_H - 2 + hs(seed, i) * 4; ink(c, [[xl - 3, py + 8], [xl - 3, py + 8 - ph + 3], [xl, py + 8 - ph], [xl + 3, py + 8 - ph + 3], [xl + 3, py + 8]], mix(m.face, i % 2 ? '#ffffff' : '#000000', 0.08), { wob: 0.6, seed: seed + i, lw: 0.75, heavy: 1.5 }); stroke(c, [[xl - 1, py + 6], [xl - 1.2, py + 8 - ph + 6]], INK.faint, 0.55); }
    return;
  }
  var h = FENCE_H;
  if (e.t === 'rail') { post(c, xl, yt, 3, h + 3, m, seed); if (!more) post(c, xl, yt + TS, 3, h + 3, m, seed + 1); ink(c, rect(xl - 1.3, yt - h + 1, 2.6, TS + 5), m.face, { wob: 0.4, seed: seed + 2, lw: 0.6, heavy: 1.1 }); return; }
  if (e.t === 'drystone') { var sm = WALLS[3]; c.save(); c.beginPath(); c.rect(xl - 3.5, yt - 14, 7, TS + 14); c.clip(); face(c, sm, xl - 3, yt - 11, 6, TS + 11, seed); var cy = yt - 12; while (cy < yt + TS) { var ch = 3 + hs(seed, cy) * 2.5; ink(c, [[xl - 2.8, cy], [xl + 2.8, cy + 0.3], [xl + 2.6, cy + ch], [xl - 2.6, cy + ch - 0.3]], mix(sm.top, '#000000', hs(seed, cy + 2) * 0.12), { wob: 0.4, seed: seed + Math.round(cy), flat: true, lw: 0.5, heavy: 0.8 }); cy += ch; } c.restore(); stroke(c, [[xl + 3, yt - 11], [xl + 3, yt + TS]], INK.line, 0.9); return; }
  if (e.t === 'gate') { post(c, xl, yt, 3, h + 3, m, seed); post(c, xl, yt + TS, 3, h + 3, m, seed + 1); if (!open) ink(c, rect(xl - 1.2, yt - h, 2.4, TS), m.top, { wob: 0.4, seed: seed + 2, lw: 0.6, heavy: 1 }); return; }
  ink(c, rect(xl - 1.5, yt - h + 2, 3, TS), m.face, { wob: 0.4, seed: seed, lw: 0.6, heavy: 1.1 });
  post(c, xl, yt, 3, h + 2, m, seed); post(c, xl, yt + TS / 2, 3, h + 2, m, seed + 1); if (!more) post(c, xl, yt + TS, 3, h + 2, m, seed + 2);
}
// a plank door with two battens and an iron ring; open, it stands edge-on at the jamb
function door(c, x, y, w, h, open, seed) {
  if (open) { ink(c, rect(x, y, 3.2, h), '#4e3826', { wob: 0.4, seed: seed, lw: 0.6, heavy: 1.2 }); return; }
  ink(c, rect(x, y, w, h), '#5e4430', { wob: 0.6, seed: seed, lw: 0.7, heavy: 1.4 }); face(c, { face: '#5e4430', dark: '#3a2a1c', tex: 'planks' }, x, y, w, h, seed, true);
  ink(c, rect(x + 1, y + h * 0.22, w - 2, 2.6), '#4a3424', { wob: 0.3, seed: seed + 1, flat: true, lw: 0.5, heavy: 0.9 }); ink(c, rect(x + 1, y + h * 0.68, w - 2, 2.6), '#4a3424', { wob: 0.3, seed: seed + 2, flat: true, lw: 0.5, heavy: 0.9 });
  c.strokeStyle = '#3a3a40'; c.lineWidth = 1.1; c.beginPath(); c.arc(x + w - 5, y + h * 0.48, 1.9, 0, 7); c.stroke(); c.fillStyle = '#2a2a30'; c.beginPath(); c.arc(x + w - 5, y + h * 0.4, 0.8, 0, 7); c.fill();
}
// a window: a hole in the wall with a shutter swung open beside it (no glass in this age), a sill below
function shutterWindow(c, x, y, w, h, seed) {
  ink(c, rect(x, y, w, h), '#241a14', { wob: 0.4, seed: seed, flat: true, lw: 0.7, heavy: 1.2 });
  c.fillStyle = 'rgba(255,220,150,0.12)'; c.fillRect(x + 1, y + 1, w - 2, h - 2);
  ink(c, rect(x + w - 1, y - 0.5, w * 0.55, h + 1), '#6a4e36', { wob: 0.5, seed: seed + 1, lw: 0.6, heavy: 1.2 }); stroke(c, [[x + w + 1.2, y + 2], [x + w + 1.2, y + h - 2]], INK.faint, 0.5); stroke(c, [[x + w - 0.5, y + h * 0.3], [x + w * 1.5 - 1.5, y + h * 0.3]], INK.faint, 0.5);
  ink(c, rect(x - 1, y + h, w + 2, 1.8), '#8a6a4a', { wob: 0.3, seed: seed + 2, flat: true, lw: 0.5, heavy: 0.9 });
}
function drawH(c, x, y, e, low, open, C) {
  C = C || CFG;
  if (YARD[e.t]) return drawFenceH(c, x, y, e, open, C);
  var m = WALLS[e.m] || WALLS[0], h = low ? 7 : C.wallH, x0 = x * T, yb = y * TS, cp = C.thick * K, seed = x * 13 + y * 37;
  if (e.t === 'door' && !low) {
    ink(c, rect(x0, yb - h, 4, h), m.dark, { wob: 0.4, seed: seed, lw: 0.7, heavy: 1.3 }); ink(c, rect(x0 + T - 4, yb - h, 4, h), m.dark, { wob: 0.4, seed: seed + 1, lw: 0.7, heavy: 1.3 });
    ink(c, rect(x0 - 0.5, yb - h - cp, T + 1, cp + 4), m.top, { wob: 0.4, seed: seed + 2, lw: 0.7, heavy: 1.3 });   // the lintel
    door(c, x0 + 4, yb - h + 4, T - 8, h - 4, open, seed + 3);
    return;
  }
  if (e.t === 'door') { ink(c, rect(x0, yb - h, 4, h), m.dark, { wob: 0.4, seed: seed, lw: 0.6, heavy: 1.1 }); ink(c, rect(x0 + T - 4, yb - h, 4, h), m.dark, { wob: 0.4, seed: seed + 1, lw: 0.6, heavy: 1.1 }); return; }
  var d = ink(c, rect(x0, yb - h, T, h), m.face, { wob: 0.7, seed: seed, noLine: true, flat: true });
  face(c, m, x0, yb - h, T, h, seed);
  cap(c, m, x0, yb - h - cp, T, cp, seed, true);
  path(c, d); c.lineJoin = 'round'; c.lineWidth = 0.8; c.strokeStyle = INK.line; c.stroke(); heavy(c, d, 1.8);
  stroke(c, [[x0 + 0.5, yb - h + 0.6], [x0 + T - 0.5, yb - h + 0.6]], INK.lit, 1.0);                                // the lit top of the face
  if (e.t === 'window' && !low) shutterWindow(c, x0 + 7, yb - h + 5, (T - 14) * 0.62, h - 12, seed + 5);
}
// an edge along the left side of tile (x, y). more: whether the V edge below continues it (no end face then)
function drawV(c, x, y, e, open, more, C) {
  C = C || CFG;
  if (YARD[e.t]) return drawFenceV(c, x, y, e, open, !!(more && more.t && YARD[more.t]), C);
  var m = WALLS[e.m] || WALLS[0], h = C.wallH, th = C.thick, xl = x * T - th / 2, yt = y * TS - h, seed = x * 41 + y * 11;
  if (e.t === 'door') {
    ink(c, rect(xl, yt, th, 4), m.dark, { wob: 0.3, seed: seed, lw: 0.6, heavy: 1 }); ink(c, rect(xl, yt + TS - 4, th, 4), m.dark, { wob: 0.3, seed: seed + 1, lw: 0.6, heavy: 1 });
    if (!open) ink(c, rect(xl + 0.6, yt + 4, th - 1.2, TS - 8), '#5e4430', { wob: 0.3, seed: seed + 2, flat: true, lw: 0.5, heavy: 0.9 });
    if (!more) ink(c, rect(xl, yt + TS, th, h), m.dark, { wob: 0.4, seed: seed + 3, lw: 0.7, heavy: 1.3 });
    return;
  }
  if (!more) { var d = ink(c, rect(xl, yt + TS, th, h), m.face, { wob: 0.5, seed: seed, noLine: true, flat: true }); face(c, m, xl, yt + TS, th, h, seed, true); path(c, d); c.lineWidth = 0.8; c.strokeStyle = INK.line; c.stroke(); heavy(c, d, 1.8); }
  cap(c, m, xl, yt, th, TS, seed, false);
  if (e.t === 'window') { ink(c, rect(xl + 0.8, yt + 6, th - 1.6, TS - 12), '#241a14', { wob: 0, flat: true, lw: 0.5, heavy: 0.8 }); }
}
// The frame: a post at corner (x, y) (a timber a little taller than the wall, with a cap), and a beam between two
// posts a tile apart where no wall stands between them, so a frame reads as a frame before the walls fill it in.
function drawPost(c, x, y, p, C) {
  C = C || CFG; var m = WALLS[p.m] || WALLS[0], w = C.thick + 1.5, h = C.wallH + C.thick * K + 4, px = x * T, py = y * TS, seed = x * 7 + y * 19;
  ink(c, [[px - w / 2, py], [px - w / 2 + 0.3, py - h], [px + w / 2 - 0.3, py - h], [px + w / 2, py]], m.dark, { wob: 0.5, seed: seed, lw: 0.8, heavy: 1.6 });
  stroke(c, [[px - 0.6, py - 3], [px - 0.8, py - h + 4]], INK.faint, 0.6); stroke(c, [[px + 1.2, py - 6], [px + 1.4, py - h + 10]], INK.faint, 0.5);
  ink(c, rect(px - w / 2 - 1, py - h - 2.5, w + 2, 3), m.top, { wob: 0.4, seed: seed + 1, lw: 0.7, heavy: 1.2 });
}
function drawBeam(c, x, y, horiz, p, C) {
  C = C || CFG; var m = WALLS[p.m] || WALLS[0], top = y * TS - C.wallH - C.thick * K - 1, seed = x * 5 + y * 23;
  if (horiz) { ink(c, rect(x * T + 2, top, T - 4, 3.2), m.top, { wob: 0.4, seed: seed, lw: 0.7, heavy: 1.2 }); stroke(c, [[x * T + 4, top + 1.6], [x * T + T - 4, top + 1.4]], INK.faint, 0.5); }
  else { ink(c, rect(x * T - 1.6, top, 3.2, TS), m.top, { wob: 0.4, seed: seed, lw: 0.7, heavy: 1.2 }); stroke(c, [[x * T, top + 2], [x * T + 0.2, top + TS - 2]], INK.faint, 0.5); }
}
// Stairs in tile (x, y), climbing to the north: two stringers and six treads, drawn from the top step down so each
// overlaps the one behind. The hero steps onto the lower half from the south and arrives on the floor above.
function drawStairs(c, x, y, C) {
  C = C || CFG; var px = x * T + 4, w = T - 8, n = 6, h = C.wallH + C.thick * K + 1, by = (y + 1) * TS, i, seed = x * 3 + y * 11;
  ink(c, rect(px - 2.5, by - h - TS, 3, h + TS), '#4a3424', { wob: 0.4, seed: seed, lw: 0.7, heavy: 1.3 }); ink(c, rect(px + w - 0.5, by - h - TS, 3, h + TS), '#4a3424', { wob: 0.4, seed: seed + 1, lw: 0.7, heavy: 1.3 });
  for (i = n - 1; i >= 0; i--) {
    var d = TS / n, rise = h / n, sy = by - (i + 1) * d - (i + 1) * rise;
    ink(c, rect(px, sy + d, w, rise), '#5e4430', { wob: 0.3, seed: seed + i * 2, flat: true, lw: 0.6, heavy: 1 });
    ink(c, rect(px, sy, w, d + 0.5), i % 2 ? '#a07a52' : '#a98258', { wob: 0.3, seed: seed + i * 2 + 1, lw: 0.6, heavy: 1 }); stroke(c, [[px + 6, sy + d * 0.5], [px + w - 6, sy + d * 0.5 + 0.3]], INK.faint, 0.5);
  }
}
// A stone chimney rising from x, yBase (screen units) to h above it, with smoke drifting from its top (t is a clock).
function drawChimney(c, x, yBase, h, a, t) {
  var w = 9, i, sm = WALLS[3], seed = Math.round(x); c.save(); c.globalAlpha = a;
  var d = ink(c, rect(x - w / 2, yBase - h, w, h), sm.face, { wob: 0.6, seed: seed, noLine: true, flat: true }); face(c, sm, x - w / 2, yBase - h, w, h, seed);
  path(c, d); c.lineWidth = 0.9; c.strokeStyle = INK.line; c.stroke(); heavy(c, d, 1.8);
  ink(c, rect(x - w / 2 - 1.5, yBase - h - 3, w + 3, 3.5), sm.top, { wob: 0.5, seed: seed + 1, lw: 0.8, heavy: 1.4 });
  c.fillStyle = '#2a2428'; c.beginPath(); c.ellipse(x, yBase - h - 3, 3, 1.1, 0, 0, 7); c.fill();
  for (i = 0; i < 5; i++) { var u = ((t * 0.3 + i * 0.2) % 1), px = x + Math.sin(t * 0.9 + i * 1.7) * 2 + u * 9, py = yBase - h - 5 - u * 24, r = 2 + u * 4.5; c.fillStyle = 'rgba(226,222,214,' + ((1 - u) * 0.42 * a).toFixed(2) + ')'; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill(); }
  c.restore();
}
// The roof of a closed room, up one storey over its tiles (dy lifts it a storey more for a room upstairs). A hipped roof
// with real form (Robin, 2026-10-07: more depth and volume, an overhang): the ridge raised above the eaves, four facets (the far
// slope lit, the near slope in shadow, the hips between), the eaves hanging past the walls with their thickness showing and a
// shadow cast on the wall below, the hip lines and the heavy line along the eaves. Turf is sod with grass and flowers; thatch is
// rows of straw with a ragged fringe hanging over the eaves and crossed boards at the ridge; shingles overlap in scalloped rows.
// A room that is not a rectangle gets a roof over each rectangle it is made of, far to near.
function roofRects(tiles) {
  var has = {}, left = [], i; tiles.forEach(function (t) { has[t[0] + ',' + t[1]] = 1; left.push([t[0], t[1]]); });
  var out = [];
  while (left.length) {
    left.sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });
    var t0 = left[0], x0 = t0[0], y0 = t0[1], x1 = x0, y1 = y0, x, y, ok;
    while (has[(x1 + 1) + ',' + y0]) x1++;
    for (;;) { ok = true; for (x = x0; x <= x1; x++) if (!has[x + ',' + (y1 + 1)]) { ok = false; break; } if (!ok) break; y1++; }
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) delete has[x + ',' + y];
    left = left.filter(function (t) { return has[t[0] + ',' + t[1]]; });
    out.push({ x0: x0, y0: y0, x1: x1, y1: y1 });
  }
  out.sort(function (a, b) { return a.y1 - b.y1; });
  return out;
}
function roomWallM(B, room) {                                            // the material of the room's walls (the first wall found round its tiles), for the gable
  var i, t, e; if (!room || !room.tiles) return 1;
  for (i = 0; i < room.tiles.length; i++) {
    t = room.tiles[i];
    e = B.H[key(t[0], t[1] + 1)] || B.H[key(t[0], t[1])] || B.V[key(t[0], t[1])] || B.V[key(t[0] + 1, t[1])];
    if (e && !YARD[e.t] && e.m != null) return e.m;
  }
  return 1;
}
function drawRoof(c, room, a, C, dy) {
  C = C || CFG; dy = dy || 0;
  var r = ROOFS[C.roof]; if (!r || !r.col || a <= 0.01) return;
  var ov = C.overhang + 1.5, up = C.wallH + C.thick * K + 1, kind = C.roof, wm = WALLS[C.wallM] || WALLS[1];
  var lineCol = r.line, hl = mix(r.col, '#fff4d0', 0.25), dk = mix(r.col, '#1a1410', 0.3), edgeCol = mix(r.col, '#1a1410', 0.45);
  c.save(); a *= c.globalAlpha; c.globalAlpha = a; c.translate(0, dy); c.lineCap = 'round'; c.lineJoin = 'round';
  roofRects(room.tiles).forEach(function (rc) {
    var top = rc.y0 * TS - up - ov * K, bot = (rc.y1 + 1) * TS - up + ov * K, left = rc.x0 * T - ov, right = (rc.x1 + 1) * T + ov, D = bot - top, Wd = right - left;
    var wT = rc.x1 - rc.x0 + 1, dT = rc.y1 - rc.y0 + 1, ns = C.gable === 'ns' || (C.gable !== 'ew' && dT >= wT);   // the ridge along the long side: a gable facing south when the room is deep
    var seed = rc.x0 * 7 + rc.y0 * 3, i, j, cx = (left + right) / 2;
    // the shadow the eaves cast on the walls below, and down the right side
    var sg = c.createLinearGradient(0, bot, 0, bot + 7); sg.addColorStop(0, 'hsla(' + INK.shadowHue + ',40%,12%,0.42)'); sg.addColorStop(1, 'hsla(' + INK.shadowHue + ',40%,12%,0)'); c.fillStyle = sg; c.fillRect(left, bot, Wd, 7);
    var sg2 = c.createLinearGradient(right, 0, right + 5, 0); sg2.addColorStop(0, 'hsla(' + INK.shadowHue + ',40%,12%,0.3)'); sg2.addColorStop(1, 'hsla(' + INK.shadowHue + ',40%,12%,0)'); c.fillStyle = sg2; c.fillRect(right, top + 2, 5, D);
    function eaveEdge(x0, y0, x1, y1) {                       // the thickness of the roof at an eave or a bargeboard: sod, straw ends or shingle ends along the line
      var dx = x1 - x0, dy2 = y1 - y0, len = Math.hypot(dx, dy2) || 1, nx = -dy2 / len, ny = dx / len, k;   // (nx, ny): outward, below the line
      if (ny < 0) { nx = -nx; ny = -ny; }
      if (kind === 1) { for (k = 1; k < len; k += 2.1) { var u = k / len, px = x0 + dx * u, py = y0 + dy2 * u, ln = 4 + hs(px, py) * 5, dark = hs(px + 1, py) < 0.35; c.strokeStyle = dark ? dk : r.col; c.lineWidth = dark ? 1.1 : 1.9; c.beginPath(); c.moveTo(px - nx * 3, py - ny * 3); c.lineTo(px + nx * ln + (hs(px, py + 3) - 0.5) * 1.5, py + ny * ln); c.stroke(); } c.strokeStyle = INK.soft; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0 + nx * 1.5, y0 + ny * 1.5); c.lineTo(x1 + nx * 1.5, y1 + ny * 1.5); c.stroke(); }
      else if (kind === 0) { ink(c, [[x0 - nx, y0 - ny], [x1 - nx, y1 - ny], [x1 + nx * 2.6, y1 + ny * 2.6], [x0 + nx * 2.6, y0 + ny * 2.6]], '#4e3a2a', { wob: 0.5, seed: seed + 20, flat: true, lw: 0.6, heavy: 1.2 }); for (k = 2; k < len; k += 3) { var u2 = k / len, qx = x0 + dx * u2, qy = y0 + dy2 * u2; if (hs(qx, qy + 4) > 0.55) continue; c.strokeStyle = hs(qx, qy + 5) < 0.5 ? dk : r.col; c.lineWidth = 0.9; c.beginPath(); c.moveTo(qx - nx, qy - ny); c.lineTo(qx + nx * (3 + hs(qx, qy + 7) * 2.5) + (hs(qx, qy + 6) - 0.5) * 2, qy + ny * (3 + hs(qx, qy + 7) * 2.5)); c.stroke(); } }
      else { ink(c, [[x0 - nx, y0 - ny], [x1 - nx, y1 - ny], [x1 + nx * 2.2, y1 + ny * 2.2], [x0 + nx * 2.2, y0 + ny * 2.2]], edgeCol, { wob: 0.4, seed: seed + 20, flat: true, lw: 0.6, heavy: 1.2 }); for (k = 4; k < len; k += 8) { var u3 = k / len; stroke(c, [[x0 + dx * u3, y0 + dy2 * u3], [x0 + dx * u3 + nx * 2, y0 + dy2 * u3 + ny * 2]], INK.soft, 0.6); } }
    }
    // a facet of the roof: fill, the material's rows following it, grain
    function facet(pts, tone, rows) {
      var d = ink(c, pts, mix(r.col, tone > 0 ? '#fff4d0' : '#1a1410', Math.abs(tone)), { wob: 0, flat: true, noLine: true });
      c.save(); path(c, d); c.clip();
      var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; d.forEach(function (p) { bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]); });
      if (kind === 1) {                                      // straw in rows along the eave: level on the slopes, down the hips
        c.strokeStyle = lineCol; c.globalAlpha = a * 0.55; c.lineWidth = 1;
        if (rows === 'h') { for (j = by0 + 3; j < by1; j += 5) { c.beginPath(); c.moveTo(bx0, j); for (i = bx0; i < bx1; i += 4) c.quadraticCurveTo(i + 2, j + 1.2 + hs(i, j) * 2.2, i + 4, j); c.stroke(); } }
        else { for (i = bx0 + 2; i < bx1; i += 4.5) { c.beginPath(); c.moveTo(i, by0); for (j = by0; j < by1; j += 4) c.quadraticCurveTo(i + 1.2 + hs(i, j) * 2, j + 2, i, j + 4); c.stroke(); } }
        c.strokeStyle = tone > 0 ? 'rgba(255,245,210,0.36)' : 'rgba(255,245,210,0.16)'; c.lineWidth = 1.1; c.beginPath();
        for (j = by0 + 2; j < by1; j += 5) for (i = bx0 + 2; i < bx1; i += 6.5) { var o = hs(i, j + 1); if (o < 0.5) { if (rows === 'h') { c.moveTo(i + o * 3, j + 3.5); c.lineTo(i + o * 3 + 0.6, j + 0.5); } else { c.moveTo(i + 0.5, j + o * 3); c.lineTo(i + 3.5, j + o * 3 + 0.6); } } }
        c.stroke(); c.globalAlpha = a;
      } else if (kind === 0) {                               // sod with grass blades in two greens, a few flowers
        for (j = by0 + 2; j < by1; j += 2.6) for (i = bx0 + 1; i < bx1; i += 3.2) { var q = hs(i, j); if (q > 0.6) continue; c.strokeStyle = q < 0.25 ? hl : (q < 0.45 ? dk : lineCol); c.lineWidth = 0.9; c.beginPath(); c.moveTo(i + q * 2, j + 1.5); c.lineTo(i + q * 2 + (hs(i, j + 2) - 0.5) * 2, j - 2 - hs(i, j + 3) * 2); c.stroke(); }
        for (j = by0 + 4; j < by1; j += 9) for (i = bx0 + 3; i < bx1; i += 11) if (hs(i, j) < 0.1) { c.fillStyle = hs(i, j + 1) < 0.5 ? '#d8c26a' : '#c9d2d8'; c.beginPath(); c.arc(i, j, 1.1, 0, 7); c.fill(); }
      } else {                                               // shingles in scalloped rows, offset, each a shade of its own; down the hips they turn
        var row = 0;
        if (rows === 'h') { for (j = by0 + 5; j < by1 + 5; j += 5, row++) for (i = bx0 + (row % 2 ? 4 : 0) - 8; i < bx1; i += 8) { var t2 = (hs(i, j) - 0.5) * 0.16; c.fillStyle = mix(r.col, t2 > 0 ? '#ffffff' : '#000000', Math.abs(t2) + Math.max(0, -tone) * 0.5); c.beginPath(); c.moveTo(i, j - 5); c.lineTo(i + 8, j - 5); c.lineTo(i + 8, j - 1.5); c.quadraticCurveTo(i + 4, j + 1.2, i, j - 1.5); c.closePath(); c.fill(); c.strokeStyle = lineCol; c.lineWidth = 0.7; c.globalAlpha = a * 0.75; c.stroke(); c.globalAlpha = a; } }
        else { for (i = bx0 + 5; i < bx1 + 5; i += 5, row++) for (j = by0 + (row % 2 ? 4 : 0) - 8; j < by1; j += 8) { var t3 = (hs(i, j) - 0.5) * 0.16; c.fillStyle = mix(r.col, t3 > 0 ? '#ffffff' : '#000000', Math.abs(t3) + Math.max(0, -tone) * 0.5); c.beginPath(); c.moveTo(i - 5, j); c.lineTo(i - 5, j + 8); c.lineTo(i - 1.5, j + 8); c.quadraticCurveTo(i + 1.2, j + 4, i - 1.5, j); c.closePath(); c.fill(); c.strokeStyle = lineCol; c.lineWidth = 0.7; c.globalAlpha = a * 0.75; c.stroke(); c.globalAlpha = a; } }
      }
      c.globalAlpha = a * INK.grain; c.fillStyle = grainPat(c); c.fillRect(bx0, by0, bx1 - bx0, by1 - by0); c.globalAlpha = a;
      c.restore();
    }
    function ridgeBoards(x0, y0, dirY) {                      // crossed boards at a north-south ridge's end
      [[-1, 1], [1, -1]].forEach(function (sgn, bi) { var ax = x0 + 4 * sgn[0], ay = y0 + 3 * dirY, bx = x0 + 4 * sgn[1], by = y0 - 9 * dirY; ink(c, [[ax - 1, ay], [bx - 1, by], [bx + 1, by], [ax + 1, ay]], r.ridge, { wob: 0.3, seed: seed + bi, flat: true, lw: 0.6, heavy: 1.1 }); });
    }
    if (ns) {
      // a gable roof with the ridge north to south: the west slope lit, the east in shadow, and the south gable end facing you:
      // the end wall in the walls' material with its timbers (a tie beam, a king post, two struts), the bargeboards over it
      var rh = Math.min(34, Wd * 0.46), slopeL = [[left, top], [cx, top - rh], [cx, bot - rh], [left, bot]], slopeR = [[cx, top - rh], [right, top], [right, bot], [cx, bot - rh]];
      var ga = [[left, bot], [cx, bot - rh], [right, bot]], gw = [[left + ov, bot - ov * K], [cx, bot - rh + 1.2], [right - ov, bot - ov * K]];
      ink(c, ga, '#2b221c', { wob: 0, flat: true, noLine: true });                                                        // the dark underside of the eaves
      var gd = ink(c, gw, wm.face, { wob: 0.5, seed: seed + 9, noLine: true, flat: true });
      c.save(); path(c, gd); c.clip(); face(c, wm, left + ov, bot - rh, right - left - 2 * ov, rh, seed + 9); c.restore();
      var gl = mix(wm.top, '#1a1410', 0.1), tb = bot - ov * K;
      ink(c, rect(left + ov, tb - 3.2, right - left - 2 * ov, 3.2), gl, { wob: 0.4, seed: seed + 10, lw: 0.7, heavy: 1.2 });                        // the tie beam
      ink(c, rect(cx - 1.6, bot - rh + 2, 3.2, rh - ov * K - 2), gl, { wob: 0.4, seed: seed + 11, lw: 0.7, heavy: 1.2 });                          // the king post
      ink(c, [[left + ov + 3, tb - 3.2], [left + ov + 6, tb - 3.2], [cx - 1, bot - rh * 0.52], [cx - 1, bot - rh * 0.52 + 3.4]], gl, { wob: 0.3, seed: seed + 12, lw: 0.6, heavy: 1.1 });   // the struts
      ink(c, [[right - ov - 3, tb - 3.2], [right - ov - 6, tb - 3.2], [cx + 1, bot - rh * 0.52], [cx + 1, bot - rh * 0.52 + 3.4]], gl, { wob: 0.3, seed: seed + 13, lw: 0.6, heavy: 1.1 });
      var g2 = c.createLinearGradient(0, bot - rh, 0, bot - rh + 9); g2.addColorStop(0, 'hsla(' + INK.shadowHue + ',40%,12%,0.35)'); g2.addColorStop(1, 'hsla(' + INK.shadowHue + ',40%,12%,0)'); c.save(); path(c, gd); c.clip(); c.fillStyle = g2; c.fillRect(left, bot - rh, Wd, 10); c.restore();   // the shade under the ridge
      path(c, gd); c.lineWidth = 0.8; c.strokeStyle = INK.line; c.stroke();
      facet(slopeL, 0.14, 'v'); facet(slopeR, -0.26, 'v');
      eaveEdge(left, bot, cx, bot - rh); eaveEdge(cx, bot - rh, right, bot);                                                // the bargeboards' edge over the gable
      stroke(c, [[left, bot], [cx, bot - rh], [right, bot]], r.ridge, 2.6); stroke(c, [[left, bot], [cx, bot - rh], [right, bot]], INK.line, 0.8);
      stroke(c, [[cx, top - rh], [cx, bot - rh]], INK.soft, 0.9);
      var sil = [[left, top], [cx, top - rh], [right, top], [right, bot], [cx, bot - rh], [left, bot]];
      path(c, sil); c.lineWidth = 0.9; c.strokeStyle = INK.line; c.stroke(); heavy(c, sil, 2.4);
      ink(c, [[cx - 2.2, top - rh - 1], [cx + 2.2, top - rh - 1], [cx + 2, bot - rh + 1], [cx - 2, bot - rh + 1]], r.ridge, { wob: 0.5, seed: seed, lw: 0.7, heavy: 1.3 });   // the ridge pole
      if (kind !== 0) { ridgeBoards(cx, top - rh + 2, 1); ridgeBoards(cx, bot - rh - 1, -1); }
    } else {
      // a hipped roof with the ridge east to west: the far slope lit, the near slope in shadow, the hips between, the ridge raised high
      var rise = Math.min(26, D * 0.42), ridgeY = (top + bot) / 2 - rise, hip = Math.min(D * 0.5, Wd * 0.22);
      var far = [[left, top], [right, top], [right - hip, ridgeY], [left + hip, ridgeY]], near = [[left + hip, ridgeY], [right - hip, ridgeY], [right, bot], [left, bot]];
      var hipL = [[left, top], [left + hip, ridgeY], [left, bot]], hipR = [[right, top], [right, bot], [right - hip, ridgeY]], outline = [[left, top], [right, top], [right, bot], [left, bot]];
      eaveEdge(left, bot, right, bot);
      if (kind === 1) { for (j = top + 3; j < bot; j += 2.4) { c.strokeStyle = hs(j, 2) < 0.4 ? dk : r.col; c.lineWidth = 1.3; c.beginPath(); c.moveTo(right - 2, j); c.lineTo(right + 2.5 + hs(j, 4) * 2, j + 1.5); c.moveTo(left + 2, j); c.lineTo(left - 2.5 - hs(j, 5) * 2, j + 1.5); c.stroke(); } }
      facet(far, 0.14, 'h'); facet(hipL, 0.04, 'v'); facet(hipR, -0.3, 'v'); facet(near, -0.12, 'h');
      stroke(c, [[left, top], [left + hip, ridgeY]], INK.soft, 0.9); stroke(c, [[left, bot], [left + hip, ridgeY]], INK.line, 1.1);
      stroke(c, [[right, top], [right - hip, ridgeY]], INK.soft, 0.9); stroke(c, [[right, bot], [right - hip, ridgeY]], INK.line, 1.1);
      path(c, outline); c.lineWidth = 0.9; c.strokeStyle = INK.line; c.stroke(); heavy(c, outline, 2.4);
      ink(c, [[left + hip - 1, ridgeY - 2], [right - hip + 1, ridgeY - 2.4], [right - hip + 1, ridgeY + 2], [left + hip - 1, ridgeY + 2.4]], r.ridge, { wob: 0.5, seed: seed, lw: 0.7, heavy: 1.3 });   // the ridge pole
      if (kind !== 0) [left + hip + 4, right - hip - 4].forEach(function (cx2, ci) { [[cx2 - 4, ridgeY + 3, cx2 + 4, ridgeY - 9], [cx2 + 4, ridgeY + 3, cx2 - 4, ridgeY - 9]].forEach(function (bd, bi) { ink(c, [[bd[0] - 1, bd[1]], [bd[2] - 1, bd[3]], [bd[2] + 1, bd[3]], [bd[0] + 1, bd[1]]], r.ridge, { wob: 0.3, seed: seed + ci * 2 + bi, flat: true, lw: 0.6, heavy: 1.1 }); }); });   // crossed ridge boards
    }
  });
  c.restore();
}
// a small icon of a piece, for a hotbar slot (centred on 0, 0, about 14 wide)
var FLOOR_COL = { plank: ['#a07a52', '#5e4430'], dirt: ['#9a7c58', '#6a5440'], path: ['#8a8c92', '#4f5058'], trail: ['#a8906c', '#7a6448'], grass: ['#6e9a52', '#4e7a3a'], grassDark: ['#577a46', '#3a5a30'], moss: ['#5f8a52', '#3e6a38'], rock: ['#7e7f84', '#4f5058'] };
function icon(c, id, m) {
  var w = WALLS[m || 0];
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  if (id === 'floor' && (FLOORS[m || 0] || {}).water) { c.fillStyle = '#4a86b8'; c.fillRect(-7, -5, 14, 10); c.fillStyle = '#b98a5a'; c.fillRect(-7, -3, 14, 5); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-7, -3, 14, 5); c.fillStyle = '#5a3f2a'; c.fillRect(-6, 2, 2, 4); c.fillRect(4, 2, 2, 4); }
  else if (id === 'floor' && (FLOORS[m || 0] || {}).path) { var pc = FLOOR_COL[(FLOORS[m || 0] || FLOORS[0]).tile] || FLOOR_COL.trail; c.fillStyle = pc[1]; c.beginPath(); c.ellipse(0, 0, 5.5, 4.2, 0, 0, 7); c.fill(); c.fillRect(-8, -2.6, 16, 5.2); c.fillStyle = pc[0]; c.beginPath(); c.ellipse(0, 0, 4.2, 3, 0, 0, 7); c.fill(); c.fillRect(-8, -1.6, 16, 3.2); }
  else if (id === 'floor') { var fc = FLOOR_COL[(FLOORS[m || 0] || FLOORS[0]).tile] || FLOOR_COL.plank; c.fillStyle = fc[0]; c.fillRect(-6, -4, 12, 8); c.strokeStyle = fc[1]; c.lineWidth = 1; c.beginPath(); if ((FLOORS[m || 0] || FLOORS[0]).tile === 'path') { c.moveTo(-6, 0); c.lineTo(6, 0); c.moveTo(-1, -4); c.lineTo(-1, 0); c.moveTo(2, 0); c.lineTo(2, 4); } else if ((FLOORS[m || 0] || FLOORS[0]).tile === 'plank') { c.moveTo(-2, -4); c.lineTo(-2, 4); c.moveTo(2, -4); c.lineTo(2, 4); } c.stroke(); c.strokeStyle = LINE; c.strokeRect(-6, -4, 12, 8); }
  else if (id === 'roof') { var r = ROOFS[m || 0]; c.fillStyle = r.col; c.beginPath(); c.moveTo(-7, 3); c.lineTo(0, -6); c.lineTo(7, 3); c.closePath(); c.fill(); c.strokeStyle = LINE; c.lineWidth = 1; c.stroke(); c.strokeStyle = r.line; c.beginPath(); c.moveTo(-3.5, -1.5); c.lineTo(3.5, -1.5); c.moveTo(-5.5, 1); c.lineTo(5.5, 1); c.stroke(); }
  else if (id === 'fence') { c.fillStyle = w.face; c.fillRect(-7, -2, 14, 5); c.strokeStyle = w.dark; c.lineWidth = 0.8; c.beginPath(); for (var fi = -5; fi <= 5; fi += 3) { c.moveTo(fi, -2); c.lineTo(fi, 3); } c.stroke(); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-7, -2, 14, 5); c.fillStyle = w.dark; c.fillRect(-7.5, -5, 2.5, 10); c.fillRect(-1.2, -5, 2.5, 10); c.fillRect(5, -5, 2.5, 10); }
  else if (id === 'gate') { c.fillStyle = w.dark; c.fillRect(-7.5, -5, 2.5, 10); c.fillRect(5, -5, 2.5, 10); c.fillStyle = w.top; c.fillRect(-5, -3, 10, 2); c.fillRect(-5, 2, 10, 2); c.strokeStyle = w.dark; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-5, 3); c.lineTo(5, -2); c.stroke(); }
  else if (id === 'palisade') { for (var pi = 0; pi < 3; pi++) { var px = -6 + pi * 4.5; c.fillStyle = pi % 2 ? w.face : w.top; c.beginPath(); c.moveTo(px, 7); c.lineTo(px, -5); c.lineTo(px + 2, -8); c.lineTo(px + 4, -5); c.lineTo(px + 4, 7); c.closePath(); c.fill(); c.strokeStyle = LINE; c.lineWidth = 0.9; c.stroke(); } }
  else if (id === 'post') { c.fillStyle = w.dark; c.fillRect(-2, -7, 4, 15); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-2, -7, 4, 15); c.fillStyle = w.top; c.fillRect(-3.5, -9, 7, 2.5); c.strokeRect(-3.5, -9, 7, 2.5); }
  else if (id === 'stairs') { for (var si = 0; si < 4; si++) { c.fillStyle = si % 2 ? '#b98a5a' : '#c4955f'; c.fillRect(-7, 5 - si * 3.5, 14, 2); c.fillStyle = '#6b4a35'; c.fillRect(-7, 7 - si * 3.5, 14, 1.6); } c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-7, -6, 14, 14); }
  else if (id === 'rail') { c.fillStyle = w.dark; c.fillRect(-7.5, -5, 2.5, 10); c.fillRect(5, -5, 2.5, 10); c.fillStyle = w.face; c.fillRect(-6, -3, 12, 2); c.fillRect(-6, 2, 12, 2); c.strokeStyle = LINE; c.lineWidth = 0.8; c.strokeRect(-6, -3, 12, 2); c.strokeRect(-6, 2, 12, 2); }
  else if (id === 'drystone') { var sm = WALLS[3]; c.fillStyle = sm.face; c.fillRect(-7, -3, 14, 8); c.strokeStyle = sm.dark; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-7, 0); c.lineTo(7, 0); c.moveTo(-7, 2.5); c.lineTo(7, 2.5); c.moveTo(-2, -3); c.lineTo(-2, 0); c.moveTo(3, 0); c.lineTo(3, 2.5); c.moveTo(-4, 2.5); c.lineTo(-4, 5); c.stroke(); c.fillStyle = sm.top; c.fillRect(-7, -5, 14, 2.5); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-7, -5, 14, 10); }
  else if (id === 'door') { c.fillStyle = w.dark; c.fillRect(-6, -7, 12, 14); c.fillStyle = '#6b4a35'; c.fillRect(-4, -5, 8, 12); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-6, -7, 12, 14); c.fillStyle = '#e0a93a'; c.beginPath(); c.arc(2, 1, 1, 0, 7); c.fill(); }
  else if (id === 'window') { c.fillStyle = w.face; c.fillRect(-6, -7, 12, 14); c.fillStyle = '#241a14'; c.fillRect(-4.5, -4.5, 5, 9); c.fillStyle = '#6a4e36'; c.fillRect(0.5, -5, 4, 10); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-6, -7, 12, 14); c.strokeRect(-4.5, -4.5, 5, 9); c.strokeRect(0.5, -5, 4, 10); }
  else { c.fillStyle = w.face; c.fillRect(-6, -6, 12, 12); face(c, w, -6, -6, 12, 12, 3); c.fillStyle = w.top; c.fillRect(-6, -8, 12, 2.5); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-6, -8, 12, 14); }
  c.restore();
}
return { T: T, TS: TS, K: K, LINE: LINE, UP: UP, WALLS: WALLS, FLOORS: FLOORS, ROOFS: ROOFS, YARD: YARD, OPEN: OPEN, CFG: CFG, cfg: cfg, key: key, edgeAt: edgeAt, edgeOk: edgeOk, roomWallM: roomWallM, rooms: rooms, postsOk: postsOk, postUsed: postUsed, ensurePosts: ensurePosts, ink: ink, INK: INK, face: face, stroke: stroke, drawH: drawH, drawV: drawV, drawRoof: drawRoof, drawPost: drawPost, drawBeam: drawBeam, drawStairs: drawStairs, drawChimney: drawChimney, icon: icon };
})();
if (typeof module !== 'undefined') module.exports = Build;
