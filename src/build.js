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
  { name: 'Turf', face: '#5d7a48', top: '#72915a', dark: '#3b5230', tex: 'turf' },
  { name: 'Timber frame', face: '#d8cfb8', top: '#6a5238', dark: '#4a3626', tex: 'frame' },     // the lowlands (2026-10-07): plaster panels between dark timbers
  { name: 'Cut stone', face: '#a9a39a', top: '#c2bcb2', dark: '#6b655c', tex: 'ashlar' }        // dressed blocks in courses, the church's and the hall's
];
// Floors go on any land tile, so they make paths, yards and decks round a house as well as the floor in it. The dock
// (water: true) also goes on water beside land or another dock, and can be walked on.
var FLOORS = [{ name: 'Planks', tile: 'plank' }, { name: 'Packed earth', tile: 'dirt' }, { name: 'Stone flags', tile: 'path' },
  { name: 'Gravel trail', tile: 'trail', bare: true }, { name: 'Grass', tile: 'grass', bare: true }, { name: 'Dark grass', tile: 'grassDark', bare: true }, { name: 'Moss', tile: 'moss', bare: true }, { name: 'Bare rock', tile: 'rock', bare: true },
  { name: 'Dock', tile: 'plank', water: true },
  { name: 'Gravel path', tile: 'trail', path: true }, { name: 'Earth path', tile: 'dirt', path: true }, { name: 'Stone path', tile: 'path', path: true }];   // paths: rounded, joining their neighbours
var ROOFS = [{ name: 'Turf', col: '#607f49', line: '#3e5a33', ridge: '#5a4030' }, { name: 'Thatch', col: '#bda258', line: '#846a34', ridge: '#4a3426' }, { name: 'Wood shingles', col: '#6a5240', line: '#44332a', ridge: '#3a2a22' }, { name: 'Clay tiles', col: '#a85e44', line: '#6a3a2a', ridge: '#4a2a20' }, { name: 'Slate', col: '#5e6672', line: '#363c46', ridge: '#2c3038' }, { name: 'No roof' }];   // tiles and slate: the lowlands (2026-10-07)
var TURF_RIDGE = '#4e6a3a';   // the sod cap on a thatch ridge (the studio, 2026-10-20)
var CFG = { wallH: 32, thick: 5, overhang: 4, roof: 1, seeThrough: 0.12, gable: 'auto', wallM: 1, lean: 0 };   /* (lean: a trial on the Destruction Editor's board; on by default for an hour on 2026-10-14 and taken back, Robin: a wall at an angle might look odd; the build cursor marks the edge instead) */   // lean: how far the foot of a wall that runs north to south stands out from its top, so that its face shows (0: as before, a strip seen from above; tried at 9 in the Destruction Editor, 2026-10-13)   // thatch unless another roof is chosen (Robin, 2026-10-06); walls a storey and a half (2026-10-07); gable: 'auto' (a gable end facing south when the room is as deep as it is wide), 'ns', 'ew'; wallM the gable's material
// Edge types: wall, door and window close a room (and get a roof). fence, gate and palisade are yard pieces: they
// stop you (the gate opens as you come near) but never close a room, so a fenced yard stays open to the sky.
var YARD = { fence: 1, gate: 1, palisade: 1, rail: 1, drystone: 1, townwall: 1 }, OPEN = { door: 1, gate: 1 };
var UP = CFG.wallH + CFG.thick * K + 1;      // one storey: how far up the floor above (or the roof) sits, in screen units
var FENCE_H = 12, PALISADE_H = 30, TOWNWALL_H = 34;
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
  if (!(bounds && bounds.noSolids)) {
  for (k in B.H) { if (OPEN[B.H[k].t] || B.H[k].breach) continue; p = k.split(','); for (i = 0; i < 3; i++) solids.push({ x: p[0] * T + 5.3 + i * 10.7, y: p[1] * T, r: 5.5, hide: true, wall: true }); }   // (a wall that has given, breach, is a way through: src/ruin.js)
  for (k in B.V) { if (OPEN[B.V[k].t] || B.V[k].breach) continue; p = k.split(','); for (i = 0; i < 3; i++) solids.push({ x: p[0] * T, y: p[1] * T + 5.3 + i * 10.7, r: 5.5, hide: true, wall: true }); }
  for (k in B.posts || {}) { p = k.split(','); solids.push({ x: p[0] * T, y: p[1] * T, r: 3.5, hide: true }); }
  }
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
  } else if (m.tex === 'frame') {                        // plaster panels, the timbers dark: posts, a sill and a head beam, a brace in every other bay
    c.fillStyle = m.face; c.fillRect(x, y, w, h);
    for (j = 0; j < 14; j++) { var qx = x + hs(seed, j) * w, qy = y + hs(seed + 3, j) * h; c.fillStyle = hs(seed, j + 7) < 0.5 ? 'rgba(90,70,50,0.08)' : 'rgba(255,250,236,0.18)'; c.beginPath(); c.ellipse(qx, qy, 2 + hs(seed, j + 9) * 3, 1.2 + hs(seed, j + 11) * 2, 0, 0, 7); c.fill(); }
    var bay = vertical ? 7 : 10.5, nb = Math.max(1, Math.round(w / bay)), bw2 = w / nb, tw = 2.6;
    for (i = 0; i <= nb; i++) { var bx = x + i * bw2 - (i === nb ? tw : (i === 0 ? 0 : tw / 2)); c.fillStyle = m.top; c.fillRect(bx, y, tw, h); stroke(c, [[bx + 0.3, y + 1], [bx + 0.4, y + h - 1]], INK.faint, 0.5); }
    c.fillStyle = m.top; c.fillRect(x, y, w, tw); c.fillRect(x, y + h - tw, w, tw);
    for (i = 0; i < nb; i++) { if (hs(seed, i + 20) < 0.5) continue; var ax = x + i * bw2 + tw / 2, bx2 = x + (i + 1) * bw2 - tw / 2, up = hs(seed, i + 30) < 0.5; c.strokeStyle = m.top; c.lineWidth = tw * 0.85; c.beginPath(); c.moveTo(ax, up ? y + h - tw : y + tw); c.lineTo(bx2, up ? y + tw : y + h - tw); c.stroke(); }
    if (h > 14) { c.fillStyle = m.top; c.fillRect(x, y + h * 0.5 - 1, w, 2); }
  } else if (m.tex === 'ashlar') {                       // dressed stone in even courses, the joints fine, every block its own tone
    c.fillStyle = m.dark; c.fillRect(x, y, w, h);
    var crs = 6.4, ncr = Math.ceil(h / crs);
    for (j = 0; j < ncr; j++) { var cy2 = y + h - (j + 1) * crs, sx2 = x - (j % 2 ? 7 : 0) - hs(seed, j) * 2; while (sx2 < x + w) { var sw2 = 11 + hs(seed + j, sx2) * 6, tn = (hs(seed, j * 5 + sx2) - 0.5) * 0.14; c.fillStyle = mix(m.face, tn > 0 ? '#ffffff' : '#000000', Math.abs(tn)); c.fillRect(sx2 + 0.5, cy2 + 0.5, sw2 - 1, crs - 1); c.fillStyle = 'rgba(255,250,236,0.16)'; c.fillRect(sx2 + 0.5, cy2 + 0.5, sw2 - 1, 1); sx2 += sw2; } }
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
/* ---------- damage (2026-10-13, src/ruin.js): a wall that has been hacked at, one that has given, one that fire took, and
   what a fallen roof leaves on the floor. An edge carries st (1 hacked, 2 nearly through), breach, burnt, scorch.
   Everything here is drawn in "face space" (0..w along the wall, 0..h down it), so the same drawing serves a wall that faces
   you and, sheared, the leaning side face of a wall that runs away from you. ---------- */
var CHAR = '#1c1714', FRESH = { logs: '#d7bf93', planks: '#d9c39a', wattle: '#cdb98f', blocks: '#3c3d44', turf: '#5a4630', frame: '#9a8460', ashlar: '#55504a' }, matCache = {};
function wallMat(e) {                  // the wall's material as it now is: its own, blackened by a fire that passed, or charred through
  var m = WALLS[e.m] || WALLS[0], k = e.burnt ? 2 : e.scorch ? 1 : 0; if (!k) return m;
  var id = e.m + ':' + k, o = matCache[id];
  if (!o) o = matCache[id] = { name: m.name, tex: m.tex, burnt: k === 2, face: mix(m.face, CHAR, k === 2 ? 0.8 : 0.4), top: mix(m.top, CHAR, k === 2 ? 0.74 : 0.32), dark: mix(m.dark, CHAR, k === 2 ? 0.82 : 0.42) };
  return o;
}
// the marks of blows on a face: gashes in the material's own broken colour (pale new wood, the dark between stones, torn earth), the first of them a hole right through once it is nearly gone, and cracks
function scars(c, m, w, h, seed, st) {
  var n = st >= 2 ? 4 : 2, i, k, wood = m.tex === 'logs' || m.tex === 'planks', col = m.burnt ? '#0e0b0a' : (FRESH[m.tex] || '#3a3028');
  for (i = 0; i < n; i++) {
    var cx = 4 + hs(seed + 71, i) * (w - 8), cy = h * (0.3 + hs(seed + 73, i) * 0.5), r = (st >= 2 ? 3.6 : 2.5) * (0.7 + hs(seed + 75, i) * 0.7), pts = [], np = 6;
    for (k = 0; k < np; k++) { var a = k / np * 6.283 + hs(seed + i, k) * 0.7, rr = r * (0.55 + hs(seed + i * 3, k + 9) * 0.8); pts.push([cx + Math.cos(a) * rr * (m.tex === 'planks' ? 0.6 : 1), cy + Math.sin(a) * rr * (m.tex === 'planks' ? 1.9 : m.tex === 'logs' ? 0.7 : 1)]); }
    ink(c, pts, i === 0 && st >= 2 ? '#1a1310' : col, { wob: 0, flat: true, lw: 0.6, heavy: 1, seed: seed + i });
    if (wood) stroke(c, [[cx - r * 0.8, cy - r * 0.5], [cx + r * 0.3, cy + r * 0.4]], INK.soft, 0.5);
  }
  for (i = 0; i < (st >= 2 ? 3 : 1); i++) { var x1 = 3 + hs(seed + 81, i) * (w - 6), y1 = h * (0.1 + hs(seed + 83, i) * 0.3); stroke(c, [[x1, y1], [x1 + (hs(seed + 85, i) - 0.5) * 5, y1 + h * 0.2], [x1 + (hs(seed + 87, i) - 0.5) * 7, y1 + h * 0.42]], INK.soft, 0.65); }
}
// what is left of a wall that has given: a ragged stump at each end and a low ragged sill between, in its own material; a timber frame keeps its timbers. shade: a colour laid over what is left (a side face's light or dark)
function remains(c, m, w, h, seed, burnt, shade, hole) {   // hole: a window smashed in: the wall stands to its full height either side of the gap
  var frame = m.tex === 'frame', k = burnt ? 0.55 : frame ? 0.5 : 1, hl = hole && !burnt ? h : h * (0.5 + hs(seed + 91, 1) * 0.4) * k, hr = hole && !burnt ? h : h * (0.45 + hs(seed + 91, 2) * 0.45) * k, wl = hole ? w * 0.26 : Math.min(w * 0.3, 5 + hs(seed + 93, 1) * 4), wr = hole ? w * 0.26 : Math.min(w * 0.3, 5 + hs(seed + 93, 2) * 4);
  var sill = Math.min(h * 0.6, (m.tex === 'turf' || m.tex === 'blocks' ? 5 : 2.5) + hs(seed + 95, 1) * 3.5) * (burnt ? 0.7 : 1), pts = [[0, h], [0, h - hl]], top = [], i, n;
  n = 3; for (i = 1; i <= n; i++) top.push([wl * i / n, h - Math.max(sill, hl * (1 - i / n * 0.8)) + (hs(seed + 97, i) - 0.5) * Math.min(4, h * 0.2)]);
  n = 6; for (i = 0; i <= n; i++) top.push([wl + (w - wl - wr) * i / n, h - sill - hs(seed + 99, i) * Math.min(3.2, h * 0.25)]);
  n = 3; for (i = 1; i <= n; i++) top.push([w - wr + wr * i / n, h - Math.max(sill, hr * (0.2 + i / n * 0.8)) + (hs(seed + 101, i) - 0.5) * Math.min(4, h * 0.2)]);
  pts = pts.concat(top); pts.push([w, h - hr]); pts.push([w, h]);
  c.save(); path(c, pts); c.clip(); c.fillStyle = m.face; c.fillRect(0, 0, w, h); face(c, m, 0, 0, w, h, seed);
  if (shade) { c.fillStyle = shade; c.fillRect(0, 0, w, h); }
  c.restore();
  path(c, pts); c.lineJoin = 'round'; c.lineWidth = 0.8; c.strokeStyle = INK.line; c.stroke(); heavy(c, pts, 1.5);
  if (!burnt && (m.tex === 'logs' || m.tex === 'planks' || m.tex === 'wattle')) stroke(c, [[0.6, h - hl + 0.8]].concat(top.map(function (q) { return [q[0], q[1] + 0.9]; })), FRESH[m.tex], 0.9, 0.85);   // broken wood is pale
  if (frame && !burnt && !hole) {       // the timbers still stand: the two posts and the head beam, the panel between them gone
    var tw = 2.6; [[0, 0, tw, h], [w - tw, 0, tw, h], [0, 0, w, tw]].forEach(function (q, qi) { ink(c, rect(q[0], q[1], q[2], q[3]), m.top, { wob: 0.3, seed: seed + 110 + qi, flat: true, lw: 0.6, heavy: 1.1 }); });
    if (hs(seed + 113, 1) < 0.6) stroke(c, [[tw, tw + 1], [w * 0.42, h * 0.45]], m.top, tw * 0.8);          // a brace, snapped
  }
  if (frame && burnt) { ink(c, [[0, h], [0.2, h * 0.3], [2.6, h * 0.36], [2.6, h]], m.top, { wob: 0.4, seed: seed + 120, flat: true, lw: 0.6, heavy: 1.1 }); ink(c, [[w - 2.6, h], [w - 2.6, h * 0.5], [w, h * 0.42], [w, h]], m.top, { wob: 0.4, seed: seed + 121, flat: true, lw: 0.6, heavy: 1.1 }); }
}
// what lies on the ground where a wall gave: splintered boards, sticks, stones or clods in the wall's colours, ash where it burnt. Scattered in a box (x, y, w, h) on the ground
function rubble(c, m, x, y, w, h, seed, burnt) {
  var i, n = 9, stone = m.tex === 'blocks' || m.tex === 'ashlar', turf = m.tex === 'turf';
  if (burnt) { c.fillStyle = 'rgba(40,36,34,0.42)'; c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w * 0.55, h * 0.6, 0, 0, 7); c.fill(); for (i = 0; i < 5; i++) { c.fillStyle = 'rgba(190,186,178,' + (0.25 + hs(seed + 131, i) * 0.25) + ')'; c.beginPath(); c.ellipse(x + hs(seed + 133, i) * w, y + hs(seed + 135, i) * h, 1.5 + hs(seed + 137, i) * 2.5, 0.8 + hs(seed + 139, i) * 1.2, 0, 0, 7); c.fill(); } }
  for (i = 0; i < n; i++) {
    var px = x + hs(seed + 141, i) * w, py = y + hs(seed + 143, i) * h, a = (hs(seed + 145, i) - 0.5) * 2.4, tone = (hs(seed + 147, i) - 0.5) * 0.24, col = mix(i % 3 === 0 && !burnt && !stone && !turf ? (FRESH[m.tex] || m.face) : m.face, tone > 0 ? '#ffffff' : '#000000', Math.abs(tone));
    if (stone || turf) { var r = (turf ? 1.6 : 1.4) + hs(seed + 149, i) * (turf ? 2.2 : 2.6); ink(c, [[px - r, py + r * 0.3], [px - r * 0.5, py - r * 0.6], [px + r * 0.6, py - r * 0.5], [px + r, py + r * 0.2], [px + r * 0.3, py + r * 0.6]], col, { wob: 0.3, seed: seed + i, flat: true, lw: 0.55, heavy: 0.9 }); }
    else { var L = (m.tex === 'wattle' ? 3 : 4) + hs(seed + 151, i) * (m.tex === 'logs' ? 7 : 5), wd = m.tex === 'wattle' ? 0.8 : m.tex === 'logs' ? 2.2 : 1.5, ca = Math.cos(a), sa = Math.sin(a) * K; ink(c, [[px - ca * L / 2 - sa * wd / 2, py - sa * L / 2 + ca * wd / 2], [px + ca * L / 2 - sa * wd / 2, py + sa * L / 2 + ca * wd / 2], [px + ca * L / 2 + sa * wd / 2, py + sa * L / 2 - ca * wd / 2], [px - ca * L / 2 + sa * wd / 2, py - sa * L / 2 - ca * wd / 2]], col, { wob: 0, flat: true, lw: 0.5, heavy: 0.8 }); }
  }
}
// The leaning side face of a wall that runs north to south (C.lean; the mountains' side walls, 2026-10-13): its outer face shown as
// a sheared strip, the foot standing `lean` out from the top, lit where it looks west and in shade where it looks east. side: -1 the
// face looks west (the wall is a room's west wall, or stands free), +1 it looks east.
function sideFace(c, x, y, e, m, open, C, side, seed) {
  var h = C.wallH, th = C.thick, lean = C.lean, X = x * T + side * th / 2, y0 = y * TS - h, shade = side < 0 ? 'rgba(255,240,205,0.10)' : 'hsla(222,40%,12%,0.36)';
  c.save(); c.transform(0, 1, side * lean / h, 1, X, y0);
  if (e.breach) remains(c, m, TS, h, seed + 7, !!e.burnt, shade);
  else {
    c.fillStyle = m.face; c.fillRect(0, 0, TS, h); face(c, m, 0, 0, TS, h, seed + 7);
    if (e.t === 'door') { c.fillStyle = m.dark; c.fillRect(2, 2, TS - 4, h - 2); c.fillStyle = open ? '#1e1612' : '#5e4430'; c.fillRect(4, 5, TS - 8, h - 5); if (!open) { stroke(c, [[4, h * 0.36], [TS - 4, h * 0.36]], '#3a2a1c', 1.6); stroke(c, [[4, h * 0.72], [TS - 4, h * 0.72]], '#3a2a1c', 1.6); } c.strokeStyle = INK.line; c.lineWidth = 0.7; c.strokeRect(4, 5, TS - 8, h - 5); }
    if (e.t === 'window') { c.fillStyle = '#241a14'; c.fillRect(8, 7, TS - 16, h - 20); c.strokeStyle = INK.line; c.lineWidth = 0.7; c.strokeRect(8, 7, TS - 16, h - 20); }
    if (e.st) scars(c, m, TS, h, seed + 7, e.st);
    c.fillStyle = shade; c.fillRect(0, 0, TS, h);
    c.strokeStyle = INK.line; c.lineWidth = 0.9; c.lineJoin = 'round'; c.strokeRect(0, 0, TS, h);
    if (side > 0) stroke(c, [[0, h], [TS, h]], INK.line, 1.6);                                             // the heavy line at the foot of the shadow side
  }
  c.restore();
}
// what a fallen or a burnt roof leaves on one tile of the floor (ru = { k, m }): straw heaps, sods, shingles or shards and broken rafters; or ash and charred timber
var ASH_FLOOR = '#787168', ASH_DARK = '#5f5952', ASH_PALE = '#9a958c';   // a burnt room's floor and its patches (the Art Director's ch1_fixes, 2026-10-22)
function drawDebris(c, tx, ty, ru, C) {
  var x0 = tx * T, y0 = ty * TS, seed = tx * 53 + ty * 97, i, r = ROOFS[ru.m] || ROOFS[1], burnt = ru.k === 'burnt', beam = burnt ? '#1a1512' : '#4a3626';
  if (burnt) {                            // grey ash with paler and darker patches and earth showing through, no two tiles alike (2026-10-22, the Art Director's ch1_fixes: it was black ovals and a rafter or two a tile, "a black mess of thin sticks"; the wreckage is set pieces now)
    var na = 1 + Math.floor(hs(seed + 2, 1) * 3), ns = 2 + Math.floor(hs(seed + 4, 1) * 7);
    for (i = 0; i < 2; i++) { if (hs(seed + 39, i) > (i ? 0.3 : 0.36)) continue; var pr = T * (0.7 + hs(seed + 49, i) * 0.45), pxc = x0 + T / 2 + (hs(seed + 45, i) - 0.5) * T * 0.6, pyc = y0 + TS / 2 + (hs(seed + 47, i) - 0.5) * TS * 0.6, pg = c.createRadialGradient(pxc, pyc, 0, pxc, pyc, pr), pc = i ? ASH_PALE : ASH_DARK;   // on the opaque ash the page lays first: now and then a darker or a paler patch, big and soft
      pg.addColorStop(0, pc + 'b0'); pg.addColorStop(0.55, pc + '60'); pg.addColorStop(1, pc + '00'); c.fillStyle = pg; c.beginPath(); c.ellipse(pxc, pyc, pr, pr * 0.72, 0, 0, 7); c.fill(); }
    ns = hs(seed + 4, 1) < 0.5 ? 0 : 1 + Math.floor(hs(seed + 6, 1) * 2);   // a handful of pale specks in the room, not a scatter on every tile
    for (i = 0; i < ns; i++) { c.fillStyle = 'rgba(196,192,184,' + (0.16 + hs(seed, i) * 0.3).toFixed(2) + ')'; c.beginPath(); c.ellipse(x0 - 4 + hs(seed + 3, i) * (T + 8), y0 - 3 + hs(seed + 5, i) * (TS + 6), 1.5 + hs(seed + 7, i) * 6, 0.8 + hs(seed + 9, i) * 2.6, hs(seed + 11, i) * 3, 0, 7); c.fill(); }
  }
  else if (r.col) {
    for (i = 0; i < 3; i++) {
      var hx = x0 + 5 + hs(seed + 11, i) * (T - 10), hy = y0 + 5 + hs(seed + 13, i) * (TS - 9), hw = 5 + hs(seed + 15, i) * 6, hh = 2.5 + hs(seed + 17, i) * 3, tone = (hs(seed + 19, i) - 0.5) * 0.2, col = mix(r.col, tone > 0 ? '#ffffff' : '#000000', Math.abs(tone));
      if (ru.m === 1 || ru.m === 0) { ink(c, [[hx - hw, hy + hh * 0.4], [hx - hw * 0.6, hy - hh * 0.5], [hx - hw * 0.1, hy - hh], [hx + hw * 0.5, hy - hh * 0.7], [hx + hw, hy + hh * 0.3], [hx + hw * 0.3, hy + hh * 0.7], [hx - hw * 0.5, hy + hh * 0.7]], col, { wob: 0.5, seed: seed + i, lw: 0.6, heavy: 1.1 }); if (ru.m === 1) for (var k = 0; k < 4; k++) stroke(c, [[hx - hw * 0.6 + k * hw * 0.35, hy - hh * 0.4], [hx - hw * 0.5 + k * hw * 0.35 + 1.5, hy + hh * 0.5]], r.line, 0.5, 0.6); }
      else for (k = 0; k < 4; k++) { var sx = hx + (hs(seed + 21 + i, k) - 0.5) * hw * 2, sy = hy + (hs(seed + 23 + i, k) - 0.5) * hh * 2.4, a2 = hs(seed + 25 + i, k) * 3; ink(c, [[sx - 2.2 * Math.cos(a2), sy - 1.2 * Math.sin(a2)], [sx + 1.4, sy - 1.3], [sx + 2.2 * Math.cos(a2), sy + 1.1 * Math.sin(a2) + 0.6], [sx - 1.2, sy + 1.4]], mix(col, k % 2 ? '#000000' : '#ffffff', 0.1), { wob: 0, flat: true, lw: 0.5, heavy: 0.8 }); }
    }
  }
  for (i = 0; i < (burnt ? 0 : hs(seed + 31, 1) < 0.55 ? 2 : 1); i++) {      // a rafter or two, lying where they fell (they may reach onto the next tile; none in the ash of a burnt room: its wreckage is set pieces)
    var bx = x0 + hs(seed + 33, i) * T, by = y0 + 3 + hs(seed + 35, i) * (TS - 6), ba = (hs(seed + 37, i) - 0.5) * 2.2, bl = 14 + hs(seed + 39, i) * 18, ca = Math.cos(ba), sa = Math.sin(ba) * K, bw = 1.5;
    ink(c, [[bx - ca * bl / 2 - sa * bw, by - sa * bl / 2 + ca * bw], [bx + ca * bl / 2 - sa * bw, by + sa * bl / 2 + ca * bw], [bx + ca * bl / 2 + sa * bw, by + sa * bl / 2 - ca * bw], [bx - ca * bl / 2 + sa * bw, by - sa * bl / 2 - ca * bw]], beam, { wob: 0.3, seed: seed + 40 + i, flat: burnt, lw: 0.6, heavy: 1.2 });
    if (!burnt) stroke(c, [[bx - ca * bl / 2 + 1, by - sa * bl / 2], [bx + ca * bl / 2 - 1, by + sa * bl / 2]], INK.lit, 0.5);
  }
}
// a flame at a place, s its size, t the clock: three tongues, each swaying on its own
function drawFlame(c, x, y, s, t, seed) {
  var cols = ['#d9541e', '#f08a2a', '#fbc24a', '#fff0b8'], i;
  for (i = 0; i < 4; i++) {
    var k = 1 - i * 0.22, sw = Math.sin(t * (6.5 + i * 1.7) + (seed || 0) * 1.3 + i) * s * 0.16 * k, hh = s * (1 + 0.22 * Math.sin(t * (9 + i * 2.3) + (seed || 0) + i * 2)) * k, ww = s * 0.42 * k;
    c.fillStyle = cols[i]; c.beginPath(); c.moveTo(x - ww, y); c.quadraticCurveTo(x - ww * 1.15, y - hh * 0.45, x + sw, y - hh); c.quadraticCurveTo(x + ww * 1.15, y - hh * 0.45, x + ww, y); c.quadraticCurveTo(x, y + ww * 0.5, x - ww, y); c.fill();
  }
}
// a fence along the top of tile (x, y): posts with woven wattle between; a gate: a bar frame that swings open as you come near;
// a palisade: a row of pointed logs; a rail fence; a dry-stone wall
// A fence as nature leaves it (2026-10-20, the villages plan step 2; Robin: the perfect rings "can look weird"): stakes of
// uneven height that lean a little, one in ten mended with pale new wood, one in six with a rotted flat top, a rail lashed
// on with withies, brush and nettles at the foot. The shape of the ring is the generator's; this is the look of every tile.
var TUFT = ['#4f7a35', '#6a9a44', '#86b450'];
function tuft(c, x, y, seed, k) {                                   // a tuft of grass or nettles at the foot of a post: three or four blades leaning out
  var n = 3 + Math.floor(hs(seed, k) * 2), i; c.lineCap = 'round';
  for (i = 0; i < n; i++) { var a = -1.1 - (i / (n - 1) - 0.5) * 1.6 + (hs(seed + i, k) - 0.5) * 0.4, L = 3 + hs(seed + 3, k + i) * 3.5; c.strokeStyle = TUFT[(i + k) % 3]; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.7, x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke(); }
}
function stake(c, x, yb, w, h, m, seed, k, vertical) {              // one stake of a palisade: split timber, a lean, a pointed or a rotted top, its own tone; new wood when mended
  var lean = (hs(seed, k + 40) - 0.5) * 2.6, hh = h - 3 + hs(seed, k) * 6, newer = hs(seed, k + 50) < 0.1, rot = !newer && hs(seed, k + 60) < 0.16,
      col = newer ? (m.burnt ? m.face : FRESH.logs) : mix(m.face, hs(seed, k + 70) < 0.5 ? '#ffffff' : '#000000', 0.04 + hs(seed, k + 80) * 0.1), top = yb - hh;
  var pts = rot ? [[x + 0.3, yb], [x + lean - 0.3, top + 2.5], [x + lean + w * 0.45, top + 3.2], [x + lean + w, top + 2], [x + w - 0.3, yb]] : [[x + 0.3, yb], [x + lean, top + 4], [x + lean + w * 0.5, top], [x + lean + w, top + 4], [x + w - 0.3, yb]];
  ink(c, pts, col, { wob: 0.7, seed: seed + k, lw: 0.7, heavy: 1.3 });
  if (!newer && hs(seed, k + 90) < 0.5) stroke(c, [[x + w * 0.5 + lean * 0.3, top + 8], [x + w * 0.5 + lean * 0.7, yb - 4]], INK.faint, 0.6);   // the split's grain
  if (rot) stroke(c, [[x + lean + 0.5, top + 3], [x + lean + w - 0.5, top + 2.6]], '#2a2320', 1.1);                                                 // the rotted top, dark
}
function drawFenceH(c, x, y, e, open, C) {
  var m = e.burnt || e.scorch ? wallMat(e) : (WALLS[e.m] || WALLS[2]), x0 = x * T, yb = y * TS, i, seed = x * 31 + y * 7;
  if (e.breach) {                         // it has given: stumps of its posts, and the rest on the ground
    var bm = e.t === 'drystone' ? WALLS[3] : wallMat(e), bh = e.t === 'palisade' ? PALISADE_H : FENCE_H;
    if (e.t === 'palisade') { c.save(); c.translate(x0, yb - bh); remains(c, { name: bm.name, tex: 'logs', face: bm.face, top: bm.top, dark: bm.dark }, T, bh, seed, !!e.burnt); c.restore(); }
    else if (e.t !== 'drystone') { ink(c, [[x0, yb], [x0 + 0.4, yb - bh * 0.55], [x0 + 3, yb - bh * 0.4], [x0 + 3, yb]], bm.dark, { wob: 0.4, seed: seed, lw: 0.6, heavy: 1.1 }); ink(c, [[x0 + T - 3, yb], [x0 + T - 3, yb - bh * 0.35], [x0 + T - 0.4, yb - bh * 0.6], [x0 + T, yb]], bm.dark, { wob: 0.4, seed: seed + 1, lw: 0.6, heavy: 1.1 }); }
    rubble(c, e.t === 'fence' ? { tex: 'wattle', face: bm.face, dark: bm.dark } : e.t === 'drystone' ? bm : { tex: 'planks', face: bm.face, dark: bm.dark }, x0 + 2, yb - 2, T - 4, 8, seed, !!e.burnt);
    return;
  }
  if (e.t === 'palisade') {
    var gapAt = hs(seed, 99) < 0.06 ? 1 + Math.floor(hs(seed, 98) * 2) : -1;                                            // now and then a stake is gone: the rail shows through (the tile still stops you)
    ink(c, rect(x0, yb - 20.5, T, 2.6), m.dark, { wob: 0.5, seed: seed + 9, flat: true, lw: 0.6, heavy: 1 });                   // the rail, behind the stakes
    for (i = 0; i < 4; i++) { if (i === gapAt) continue; stake(c, x0 + i * 8, yb, 8, PALISADE_H, m, seed, i); }
    for (i = 0; i < 4; i++) { if (i === gapAt) continue; stroke(c, [[x0 + i * 8 + 1, yb - 22.5], [x0 + i * 8 + 7, yb - 18]], '#3a2a1c', 0.9); }   // the withy that lashes each stake to the rail
    stroke(c, [[x0, yb - 0.4], [x0 + T, yb + 0.2]], INK.soft, 0.8);                                                              // the earth at the foot
    if (hs(seed, 97) < 0.55) tuft(c, x0 + 3 + hs(seed, 96) * (T - 6), yb + 0.5, seed, 1); if (hs(seed, 95) < 0.3) tuft(c, x0 + 3 + hs(seed, 94) * (T - 6), yb + 1, seed, 2);
    return;
  }
  if (e.t === 'townwall') {               // the town's wall: cut stone a storey high with a coping of flat slabs and a shadow at its foot
    var am = WALLS[6], d = ink(c, rect(x0, yb - TOWNWALL_H, T, TOWNWALL_H), am.face, { wob: 0.5, seed: seed, noLine: true, flat: true }); face(c, am, x0, yb - TOWNWALL_H, T, TOWNWALL_H, seed);
    path(c, d); c.lineWidth = 0.9; c.strokeStyle = INK.line; c.stroke(); heavy(c, d, 1.8);
    for (i = 0; i < 3; i++) ink(c, rect(x0 + i * (T / 3) - 0.5, yb - TOWNWALL_H - 3, T / 3 + 1, 3.4), am.top, { wob: 0.4, seed: seed + 20 + i, lw: 0.7, heavy: 1.2 });
    stroke(c, [[x0 + 0.5, yb - TOWNWALL_H + 0.8], [x0 + T - 0.5, yb - TOWNWALL_H + 0.8]], INK.lit, 1.0);
    return;
  }
  var h = FENCE_H;
  if (e.t === 'rail') {                   // a split-rail fence: two rails between posts that lean a little, the rails bent by their own weight, one gone now and then
    var l1 = (hs(seed, 11) - 0.5) * 1.6, l2 = (hs(seed, 12) - 0.5) * 1.6, gone = hs(seed, 13) < 0.1 ? Math.floor(hs(seed, 14) * 2) : -1;
    ink(c, [[x0, yb], [x0 + l1 - 0.2, yb - h - 3], [x0 + l1 + 3.2, yb - h - 3.6], [x0 + 3, yb]], m.dark, { wob: 0.5, seed: seed, lw: 0.7, heavy: 1.3 }); ink(c, [[x0 + T - 3, yb], [x0 + T - 3 + l2 - 0.2, yb - h - 3], [x0 + T + l2 + 0.2, yb - h - 3.6], [x0 + T, yb]], m.dark, { wob: 0.5, seed: seed + 1, lw: 0.7, heavy: 1.3 });
    [yb - h + 1, yb - 5.5].forEach(function (ry, ri) { if (ri === gone) return; var sag = 0.8 + hs(seed, ri + 20) * 1.2; ink(c, [[x0, ry], [x0 + T / 2, ry + sag], [x0 + T, ry], [x0 + T, ry + 2.6], [x0 + T / 2, ry + 2.6 + sag], [x0, ry + 2.6]], mix(m.face, hs(seed, ri + 30) < 0.5 ? '#ffffff' : '#000000', 0.06), { wob: 0.3, seed: seed + ri, lw: 0.65, heavy: 1.2 }); if (hs(seed, ri) < 0.6) knot(c, x0 + 6 + hs(seed, ri + 2) * (T - 12), ry + 1.3, 0.9); });
    if (hs(seed, 15) < 0.5) tuft(c, x0 + 4 + hs(seed, 16) * (T - 8), yb + 0.5, seed, 3);
    return;
  }
  if (e.t === 'drystone') {               // a low wall of stacked stones with a row of capstones set on edge
    var sm = WALLS[3]; c.save(); c.beginPath(); c.rect(x0 - 0.5, yb - 14, T + 1, 14); c.clip(); face(c, sm, x0, yb - 11, T, 11, seed);
    var cx = x0 + 0.5; while (cx < x0 + T) { var cw = 3.2 + hs(seed, cx) * 2.5; ink(c, [[cx, yb - 10.5], [cx + cw * 0.3, yb - 14 + hs(seed, cx + 1) * 1.5], [cx + cw * 0.8, yb - 13.6], [cx + cw, yb - 10.5]], mix(sm.top, '#000000', hs(seed, cx + 2) * 0.12), { wob: 0.5, seed: seed + Math.round(cx), flat: true, lw: 0.55, heavy: 0.9 }); cx += cw; }
    c.restore(); stroke(c, [[x0, yb - 0.3], [x0 + T, yb - 0.3]], INK.line, 1.2); stroke(c, [[x0, yb - 11.5], [x0, yb - 0.3]], INK.line, 0.6);
    return;
  }
  if (e.t === 'gate') {                   // a yard gate between two heavy posts under a lintel: a leaf of upright planks with a brace, barred when shut; open, it stands edge on at the left post
    var gh = h + 10, pw = 5;
    ink(c, [[x0, yb], [x0 + 0.2, yb - gh], [x0 + pw, yb - gh - 0.6], [x0 + pw, yb]], m.dark, { wob: 0.5, seed: seed, lw: 0.7, heavy: 1.4 }); ink(c, [[x0 + T - pw, yb], [x0 + T - pw, yb - gh - 0.6], [x0 + T - 0.2, yb - gh], [x0 + T, yb]], m.dark, { wob: 0.5, seed: seed + 1, lw: 0.7, heavy: 1.4 });
    ink(c, rect(x0 - 1.5, yb - gh - 3, T + 3, 3.2), m.top, { wob: 0.4, seed: seed + 2, lw: 0.7, heavy: 1.3 });                       // the lintel
    if (open) { ink(c, rect(x0 + pw, yb - h - 2, 3.2, h + 2), m.top, { wob: 0.4, seed: seed + 3, lw: 0.6, heavy: 1.1 }); return; }
    var lx = x0 + pw + 0.5, lw = T - pw * 2 - 1, ly = yb - h - 2, lh = h + 1;
    ink(c, rect(lx, ly, lw, lh), m.face, { wob: 0.4, seed: seed + 4, lw: 0.6, heavy: 1.1 }); face(c, { face: m.face, dark: m.dark, tex: 'planks' }, lx, ly, lw, lh, seed + 4, true);
    ink(c, [[lx + 1, ly + lh - 2.4], [lx + lw - 1, ly + 1.2], [lx + lw - 1, ly + 3.6], [lx + 1, ly + lh]], m.top, { wob: 0.3, seed: seed + 5, flat: true, lw: 0.55, heavy: 0.9 });   // the brace
    ink(c, rect(x0 + 1, ly + lh * 0.45, T - 2, 2.8), m.dark, { wob: 0.3, seed: seed + 6, flat: true, lw: 0.6, heavy: 1.1 });        // the bar across, resting in the posts
    return;
  }
  var wt = h - 3 + (hs(seed, 5) - 0.5) * 2;                                                                                     // the wattle: its top ragged where the withies end, a post leaning, a tuft at its foot
  ink(c, [[x0, yb], [x0, yb - wt + 2], [x0 + T * 0.3, yb - wt + 2.6 - hs(seed, 6) * 1.4], [x0 + T * 0.6, yb - wt + 1.4], [x0 + T, yb - wt + 2 + hs(seed, 7) * 1.2], [x0 + T, yb]], m.face, { wob: 0.6, seed: seed, lw: 0.7, heavy: 1.3 }); face(c, { face: m.face, dark: m.dark, tex: 'wattle' }, x0, yb - wt + 2, T, wt - 3, seed);
  post(c, x0 + 1.5 + (hs(seed, 8) - 0.5) * 1.2, yb, 3, h + 2, m, seed); post(c, x0 + T / 2, yb, 3, h + 2 + hs(seed, 9) * 2, m, seed + 1); post(c, x0 + T - 1.5, yb, 3, h + 2, m, seed + 2);
  if (hs(seed, 10) < 0.5) tuft(c, x0 + 4 + hs(seed, 17) * (T - 8), yb + 0.5, seed, 4);
}
function drawFenceV(c, x, y, e, open, more, C) {
  var m = e.burnt || e.scorch ? wallMat(e) : (WALLS[e.m] || WALLS[2]), xl = x * T, yt = y * TS, i, seed = x * 17 + y * 29;
  if (e.breach) {
    var bm = e.t === 'drystone' ? WALLS[3] : wallMat(e), bh = e.t === 'palisade' ? PALISADE_H : FENCE_H;
    ink(c, [[xl - 1.5, yt + 2], [xl - 1.2, yt + 2 - bh * 0.5], [xl + 1.4, yt + 2 - bh * 0.4], [xl + 1.5, yt + 2]], bm.dark, { wob: 0.4, seed: seed, lw: 0.6, heavy: 1.1 });
    rubble(c, e.t === 'fence' ? { tex: 'wattle', face: bm.face, dark: bm.dark } : e.t === 'drystone' ? bm : { tex: e.t === 'palisade' ? 'logs' : 'planks', face: bm.face, dark: bm.dark }, xl - 6, yt + 3, 12, TS - 4, seed, !!e.burnt);
    return;
  }
  if (e.t === 'palisade') {
    for (i = 0; i < 3; i++) { stake(c, xl - 3, yt + i * 8 + 8, 6, PALISADE_H, m, seed, i, true); }
    stroke(c, [[xl - 1, yt + 2], [xl + 1.2, yt + TS - 1]], '#3a2a1c', 0.9);                                                        // the rail's edge, seen end on along the run
    if (hs(seed, 97) < 0.4) tuft(c, xl + 3.5, yt + 4 + hs(seed, 96) * (TS - 8), seed, 1);
    return;
  }
  if (e.t === 'townwall') { var am = WALLS[6]; cap(c, am, xl - 3.5, yt - TOWNWALL_H, 7, TS, seed, false); if (!more) { var d2 = ink(c, rect(xl - 3.5, yt + TS - TOWNWALL_H, 7, TOWNWALL_H), am.face, { wob: 0.4, seed: seed + 1, noLine: true, flat: true }); face(c, am, xl - 3.5, yt + TS - TOWNWALL_H, 7, TOWNWALL_H, seed + 1, true); path(c, d2); c.lineWidth = 0.8; c.strokeStyle = INK.line; c.stroke(); heavy(c, d2, 1.6); } return; }
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
// the church's and the hall's openings in cut stone: a round-arched door of planks with iron bands, a round-arched window with a lattice
function archDoor(c, x, y, w, h, open, seed) {
  var r = w / 2, cx = x + r;
  c.save(); c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + r); c.arc(cx, y + r, r, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); c.clip();
  if (open) { c.fillStyle = '#1e1612'; c.fillRect(x, y, w, h); ink(c, rect(x, y, 3.2, h), '#4e3826', { wob: 0.4, seed: seed, lw: 0.6, heavy: 1.2 }); }
  else { c.fillStyle = '#5e4430'; c.fillRect(x, y, w, h); face(c, { face: '#5e4430', dark: '#3a2a1c', tex: 'planks' }, x, y, w, h, seed, true); [0.3, 0.62].forEach(function (t, i) { ink(c, rect(x + 0.5, y + h * t, w - 1, 2.4), '#3a3a40', { wob: 0.2, seed: seed + i, flat: true, lw: 0.5, heavy: 0.8 }); }); c.strokeStyle = '#3a3a40'; c.lineWidth = 1.1; c.beginPath(); c.arc(x + w - 5, y + h * 0.48, 1.9, 0, 7); c.stroke(); }
  c.restore();
  c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + r); c.arc(cx, y + r, r, Math.PI, 0); c.lineTo(x + w, y + h); c.strokeStyle = INK.line; c.lineWidth = 0.9; c.stroke();
  c.beginPath(); c.moveTo(x - 2, y + r); c.arc(cx, y + r, r + 2, Math.PI, 0); c.strokeStyle = '#c2bcb2'; c.lineWidth = 2.2; c.stroke(); c.strokeStyle = INK.soft; c.lineWidth = 0.6; c.stroke();   // the voussoirs' ring
}
function archWindow(c, x, y, w, h, seed) {
  var r = w / 2, cx = x + r;
  c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + r); c.arc(cx, y + r, r, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); c.fillStyle = '#241a14'; c.fill(); c.strokeStyle = INK.line; c.lineWidth = 0.9; c.stroke();
  c.save(); c.clip(); c.fillStyle = 'rgba(255,220,150,0.14)'; c.fillRect(x + 1, y + 1, w - 2, h - 2); c.strokeStyle = 'rgba(120,110,96,0.9)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(cx, y); c.lineTo(cx, y + h); c.moveTo(x, y + h * 0.55); c.lineTo(x + w, y + h * 0.55); c.stroke(); c.restore();
  ink(c, rect(x - 1.5, y + h, w + 3, 1.8), '#c2bcb2', { wob: 0.3, seed: seed + 2, flat: true, lw: 0.5, heavy: 0.9 });
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
  var m = wallMat(e), h = low ? 7 : C.wallH, x0 = x * T, yb = y * TS, cp = C.thick * K, seed = x * 13 + y * 37;
  if (e.breach) { c.save(); c.translate(x0, yb - h); remains(c, m, T, h, seed, !!e.burnt, null, e.t === 'window'); c.restore(); rubble(c, e.t === 'window' && !e.burnt ? { tex: 'planks', face: '#8a6a4a', dark: '#5a4430' } : m, x0 + (e.t === 'window' ? 8 : 2), yb - 1, T - (e.t === 'window' ? 16 : 4), 8, seed, !!e.burnt); return; }   // it has given: what is left of it, and what lies before it
  if (e.t === 'door' && !low) {
    ink(c, rect(x0, yb - h, 4, h), m.dark, { wob: 0.4, seed: seed, lw: 0.7, heavy: 1.3 }); ink(c, rect(x0 + T - 4, yb - h, 4, h), m.dark, { wob: 0.4, seed: seed + 1, lw: 0.7, heavy: 1.3 });
    ink(c, rect(x0 - 0.5, yb - h - cp, T + 1, cp + 4), m.top, { wob: 0.4, seed: seed + 2, lw: 0.7, heavy: 1.3 });   // the lintel
    if (m.tex === 'ashlar') archDoor(c, x0 + 5, yb - h + 2, T - 10, h - 2, open, seed + 3); else door(c, x0 + 4, yb - h + 4, T - 8, h - 4, open, seed + 3);
    if (e.st && !open) { c.save(); c.translate(x0 + 4, yb - h + 4); scars(c, { tex: 'planks' }, T - 8, h - 4, seed + 3, e.st); c.restore(); }   // a locked door under the axe
    return;
  }
  if (e.t === 'door') { ink(c, rect(x0, yb - h, 4, h), m.dark, { wob: 0.4, seed: seed, lw: 0.6, heavy: 1.1 }); ink(c, rect(x0 + T - 4, yb - h, 4, h), m.dark, { wob: 0.4, seed: seed + 1, lw: 0.6, heavy: 1.1 }); return; }
  var d = ink(c, rect(x0, yb - h, T, h), m.face, { wob: 0.7, seed: seed, noLine: true, flat: true });
  face(c, m, x0, yb - h, T, h, seed);
  cap(c, m, x0, yb - h - cp, T, cp, seed, true);
  path(c, d); c.lineJoin = 'round'; c.lineWidth = 0.8; c.strokeStyle = INK.line; c.stroke(); heavy(c, d, 1.8);
  stroke(c, [[x0 + 0.5, yb - h + 0.6], [x0 + T - 0.5, yb - h + 0.6]], INK.lit, 1.0);                                // the lit top of the face
  if (e.t === 'window' && !low) { if (m.tex === 'ashlar') archWindow(c, x0 + 12, yb - h + 3, 8, 12, seed + 5); else shutterWindow(c, x0 + 7, yb - h + 5, (T - 14) * 0.62, h - 12, seed + 5); }
  if (e.st) { c.save(); c.translate(x0, yb - h); scars(c, m, T, h, seed, e.st); c.restore(); }
}
// an edge along the left side of tile (x, y). more: whether the V edge below continues it (no end face then)
function drawV(c, x, y, e, open, more, C, side) {
  C = C || CFG;
  if (YARD[e.t]) return drawFenceV(c, x, y, e, open, !!(more && more.t && YARD[more.t]), C);
  var m = wallMat(e), h = C.wallH, th = C.thick, xl = x * T - th / 2, yt = y * TS - h, seed = x * 41 + y * 11, lean = C.lean || 0, sd = side > 0 ? 1 : -1;
  if (lean) sideFace(c, x, y, e, m, open, C, sd, seed);
  function endFace(mm, hk) {              // the wall's south end, seen from the south: with a lean it widens to its foot on the side its face shows
    var top = yt + TS + h * (1 - hk), bot = yt + TS + h, pts = [[xl, top], [xl + th, top], [xl + th + (sd > 0 ? lean : 0), bot], [xl - (sd < 0 ? lean : 0), bot]];
    c.save(); path(c, pts); c.clip(); c.fillStyle = mm.face; c.fillRect(xl - lean, top, th + lean * 2, h); face(c, mm, xl - lean, yt + TS, th + lean * 2, h, seed, true); c.restore();
    path(c, pts); c.lineWidth = 0.8; c.strokeStyle = INK.line; c.stroke(); heavy(c, pts, 1.8);
  }
  if (e.breach) {                         // it has given: a stub of its top at each end, its south end broken short, and what lies at its foot
    if (!lean) { cap(c, m, xl, yt, th, 5, seed, false); cap(c, m, xl, yt + TS - 4, th, 4, seed + 1, false); }
    if (!more) endFace(m, e.burnt ? 0.3 : 0.5);
    rubble(c, m, x * T - 7 + (lean ? sd * lean * 0.6 : 0), y * TS + 2, 14, TS - 4, seed, !!e.burnt);
    return;
  }
  if (e.t === 'door') {
    ink(c, rect(xl, yt, th, 4), m.dark, { wob: 0.3, seed: seed, lw: 0.6, heavy: 1 }); ink(c, rect(xl, yt + TS - 4, th, 4), m.dark, { wob: 0.3, seed: seed + 1, lw: 0.6, heavy: 1 });
    if (!open) ink(c, rect(xl + 0.6, yt + 4, th - 1.2, TS - 8), '#5e4430', { wob: 0.3, seed: seed + 2, flat: true, lw: 0.5, heavy: 0.9 });
    if (!more) { if (lean) endFace({ tex: m.tex, face: m.dark, top: m.top, dark: m.dark }, 1); else ink(c, rect(xl, yt + TS, th, h), m.dark, { wob: 0.4, seed: seed + 3, lw: 0.7, heavy: 1.3 }); }
    return;
  }
  if (!more) { if (lean) endFace(m, 1); else { var d = ink(c, rect(xl, yt + TS, th, h), m.face, { wob: 0.5, seed: seed, noLine: true, flat: true }); face(c, m, xl, yt + TS, th, h, seed, true); path(c, d); c.lineWidth = 0.8; c.strokeStyle = INK.line; c.stroke(); heavy(c, d, 1.8); } }
  cap(c, m, xl, yt, th, TS, seed, false);
  if (e.t === 'window') { ink(c, rect(xl + 0.8, yt + 6, th - 1.6, TS - 12), '#241a14', { wob: 0, flat: true, lw: 0.5, heavy: 0.8 }); }
  if (e.st && !lean) { var gi; for (gi = 0; gi < (e.st >= 2 ? 3 : 1); gi++) ink(c, rect(xl + 0.4, yt + 4 + hs(seed + 61, gi) * (TS - 9), th - 0.8, 1.6 + hs(seed + 63, gi) * 1.8), m.burnt ? '#0e0b0a' : (FRESH[m.tex] || '#3a3028'), { wob: 0, flat: true, lw: 0.5, heavy: 0.8 }); }   // notches hacked into its top (with a lean the marks are on its face)
}
// The frame: a post at corner (x, y) (a timber a little taller than the wall, with a cap), and a beam between two
// posts a tile apart where no wall stands between them, so a frame reads as a frame before the walls fill it in.
function drawPost(c, x, y, p, C) {
  C = C || CFG; var m = WALLS[p.m] || WALLS[0], w = C.thick + 1.5, h = C.wallH + C.thick * K + 4, px = x * T, py = y * TS, seed = x * 7 + y * 19;
  if (p.burnt) {                          // charred (2026-10-16, the burnt steading): black, a split or two, its top burnt ragged; snapped short where p.snap says
    var hb = h * (p.snap || 1), j1 = hs(seed + 3, 1) * 3, j2 = hs(seed + 3, 2) * 4;
    ink(c, [[px - w / 2, py], [px - w / 2 + 0.3, py - hb + j1], [px - w * 0.1, py - hb - 1.5], [px + w * 0.2, py - hb + j2], [px + w / 2 - 0.3, py - hb + 1.2], [px + w / 2, py]], mix(m.dark, CHAR, 0.75), { wob: 0.5, seed: seed, lw: 0.8, heavy: 1.6 });
    stroke(c, [[px - 0.6, py - 3], [px - 0.8, py - hb + 5]], 'rgba(150,140,128,0.35)', 0.6); stroke(c, [[px + 1.4, py - hb * 0.3], [px + 1.6, py - hb * 0.62], [px + 0.9, py - hb * 0.7]], 'rgba(0,0,0,0.5)', 0.6);
    return;
  }
  ink(c, [[px - w / 2, py], [px - w / 2 + 0.3, py - h], [px + w / 2 - 0.3, py - h], [px + w / 2, py]], m.dark, { wob: 0.5, seed: seed, lw: 0.8, heavy: 1.6 });
  stroke(c, [[px - 0.6, py - 3], [px - 0.8, py - h + 4]], INK.faint, 0.6); stroke(c, [[px + 1.2, py - 6], [px + 1.4, py - h + 10]], INK.faint, 0.5);
  ink(c, rect(px - w / 2 - 1, py - h - 2.5, w + 2, 3), m.top, { wob: 0.4, seed: seed + 1, lw: 0.7, heavy: 1.2 });
}
function drawBeam(c, x, y, horiz, p, C) {
  if (p.burnt) return; C = C || CFG; var m = WALLS[p.m] || WALLS[0], top = y * TS - C.wallH - C.thick * K - 1, seed = x * 5 + y * 23;
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
// A smoke hole (the studio, 2026-10-20): a Viking house has no chimney; the hearth's smoke leaves by a louvre in the ridge,
// a small plank hood on four short posts with the dark under it, and the smoke drifts from it. In place of drawChimney for a
// room with a hearth; the fireplace, a built thing of its own, keeps its chimney. x, yBase: the ridge's spot; a: alpha; t: the clock.
function ridgeMid(room, C) {                     // where a room's ridge is at its middle, as drawRoof lays it (the smoke hole's place, 2026-10-20): the first roof rect's
  C = C || CFG; var rc = roofRects(room.tiles)[0]; if (!rc) return null;
  var ov = C.overhang + 1.5, up = C.wallH + C.thick * K + 1, top = rc.y0 * TS - up - ov * K, bot = (rc.y1 + 1) * TS - up + ov * K, left = rc.x0 * T - ov, right = (rc.x1 + 1) * T + ov, D = bot - top, Wd = right - left;
  var wT = rc.x1 - rc.x0 + 1, dT = rc.y1 - rc.y0 + 1, ns = C.gable === 'ns' || (C.gable !== 'ew' && dT >= wT), rh = ns ? Math.min(34, Wd * 0.46) : Math.min(26, D * 0.42);
  return { x: (left + right) / 2, y: (top + bot) / 2 - rh };
}
function drawSmokeHole(c, x, yBase, a, t) {
  var w = 10, h = 4, i, seed = Math.round(x); c.save(); c.globalAlpha = a;
  c.fillStyle = '#1e1714'; c.beginPath(); c.ellipse(x, yBase, w * 0.5, 1.6, 0, 0, 7); c.fill();                                   // the dark hole in the ridge
  for (i = 0; i < 2; i++) ink(c, rect(x - w / 2 + 1 + i * (w - 3.4), yBase - h - 3, 1.4, h + 3), '#4a3626', { wob: 0.3, seed: seed + i, lw: 0.5, heavy: 0.9 });   // the posts
  ink(c, [[x - w / 2 - 1.5, yBase - h - 2], [x + w / 2 + 1.5, yBase - h - 2.4], [x + w / 2 + 0.5, yBase - h - 4.4], [x - w / 2 - 0.5, yBase - h - 4]], '#5a4030', { wob: 0.5, seed: seed + 3, lw: 0.7, heavy: 1.3 });   // the plank hood
  for (i = 0; i < 5; i++) { var u = ((t * 0.25 + i * 0.2) % 1), px = x + Math.sin(t * 0.8 + i * 1.7) * 2.5 + u * 7, py = yBase - h - 6 - u * 22, r = 1.8 + u * 4; c.fillStyle = 'rgba(226,222,214,' + ((1 - u) * 0.32).toFixed(3) + ')'; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill(); }
  c.restore();
}
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
var THATCH_ENDS = '#8e7444', THATCH_COURSE = 11;   // the thatch's cut ends at the eave, and its courses about half a metre apart (the Art Director's target, 2026-10-22)
function roundCorners(pts, r) {            // a polygon with each corner eased into a curve r long (the thatch's soft outline)
  var out = [], n = pts.length, i, k;
  for (i = 0; i < n; i++) {
    var p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n], la = Math.hypot(a[0] - p[0], a[1] - p[1]) || 1, lb = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1, ra = Math.min(r, la / 2), rb = Math.min(r, lb / 2);
    var A = [p[0] + (a[0] - p[0]) / la * ra, p[1] + (a[1] - p[1]) / la * ra], Bp = [p[0] + (b[0] - p[0]) / lb * rb, p[1] + (b[1] - p[1]) / lb * rb];
    for (k = 0; k <= 4; k++) { var t = k / 4, u = 1 - t; out.push([u * u * A[0] + 2 * u * t * p[0] + t * t * Bp[0], u * u * A[1] + 2 * u * t * p[1] + t * t * Bp[1]]); }
  }
  return out;
}
function turfTufts(c, x0, y0, x1, y1, seed) {   // grass standing on a turf ridge's top
  var len = Math.hypot(x1 - x0, y1 - y0) || 1, k; c.lineWidth = 0.8; c.lineCap = 'round';
  for (k = 1; k < len; k += 1.6 + hs(k, seed) * 1.6) { var u = k / len, px = x0 + (x1 - x0) * u, py = y0 + (y1 - y0) * u, h2 = 1.4 + hs(k + 1, seed) * 2; c.strokeStyle = hs(k + 2, seed) < 0.5 ? '#86a85e' : '#4f7a3c'; c.beginPath(); c.moveTo(px, py + 0.6); c.lineTo(px + (hs(k + 3, seed) - 0.5) * 1.6, py - h2); c.stroke(); }
}
function thatchWeather(c, outline, eaves, moss, seed, a) {   // the lowest course greyer along every eave, and a little moss lower on the roof
  var i, k; c.save(); path(c, outline); c.clip();
  eaves.forEach(function (e) {                // [x0, y0, x1, y1, side]: side 0 a front eave (the band above it), 1 a west one, -1 an east one (the band inside it)
    var x0 = e[0], y0 = e[1], x1 = e[2], y1 = e[3], sd = e[4], len = Math.hypot(x1 - x0, y1 - y0) || 1, W2 = 10, pts = [], u;
    for (k = 0; k <= len; k += 5) { u = k / len; var j2 = W2 * (0.7 + hs(k, seed + sd) * 0.5), px = x0 + (x1 - x0) * u, py = y0 + (y1 - y0) * u; pts.push(sd === 0 ? [px, py - j2] : [px + sd * j2, py]); }
    pts.push(sd === 0 ? [x1, y1] : [x1, y1]); pts.push(sd === 0 ? [x0, y0] : [x0, y0]);
    c.globalAlpha = a * 0.5; c.fillStyle = '#857c68'; c.beginPath(); pts.forEach(function (q, qi) { if (qi) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); c.fill();
  });
  if (hs(seed, 3) < 0.85) moss.forEach(function (m, mi) {   // most roofs have a patch or two
    if (hs(seed + mi, 5) < 0.35) return; var rx = 4.5 + hs(seed + mi, 7) * 4, ry = rx * 0.72;
    c.globalAlpha = a * 0.8; c.fillStyle = '#5f8a46'; c.beginPath(); c.ellipse(m[0], m[1], rx, ry, 0, 0, 7); c.fill();
    c.globalAlpha = a * 0.45; c.fillStyle = '#3e6a32'; c.beginPath(); c.ellipse(m[0] + rx * 0.2, m[1] + ry * 0.3, rx * 0.7, ry * 0.55, 0, 0, 7); c.fill();
    c.globalAlpha = a * 0.6; c.fillStyle = '#9cbc6e'; for (i = 0; i < 4; i++) { c.beginPath(); c.arc(m[0] - rx * 0.5 + hs(seed + mi, i) * rx, m[1] - ry * 0.4 + hs(seed + mi + 9, i) * ry * 0.6, 0.6, 0, 7); c.fill(); }
  });
  c.globalAlpha = a; c.restore();
}
function drawRoof(c, room, a, C, dy) {
  C = C || CFG; dy = dy || 0;
  var r = ROOFS[C.roof]; if (!r || !r.col || a <= 0.01) return;
  var kind = C.roof, ov = C.overhang + 1.5 + (kind === 1 ? 2 : 0), up = C.wallH + C.thick * K + 1, wm = WALLS[C.wallM] || WALLS[1];   /* (thatch stands proud of the wall: 2026-10-22) */
  var lineCol = r.line, hl = mix(r.col, '#fff4d0', 0.25), dk = mix(r.col, '#1a1410', 0.3), edgeCol = mix(r.col, '#1a1410', 0.45);
  c.save(); a *= c.globalAlpha; c.globalAlpha = a; c.translate(0, dy); c.lineCap = 'round'; c.lineJoin = 'round';
  roofRects(room.tiles).forEach(function (rc) {
    var top = rc.y0 * TS - up - ov * K, bot = (rc.y1 + 1) * TS - up + ov * K, left = rc.x0 * T - ov, right = (rc.x1 + 1) * T + ov, D = bot - top, Wd = right - left;
    var wT = rc.x1 - rc.x0 + 1, dT = rc.y1 - rc.y0 + 1, ns = C.gable === 'ns' || (C.gable !== 'ew' && dT >= wT);   // the ridge along the long side: a gable facing south when the room is deep
    var seed = rc.x0 * 7 + rc.y0 * 3, i, j, cx = (left + right) / 2;
    // the shadow the eaves cast on the walls below, and down the right side
    var shL = kind === 1 ? 14 : 7, sh0 = kind === 1 ? bot + 7 : bot, sg = c.createLinearGradient(0, sh0, 0, sh0 + shL); sg.addColorStop(0, 'hsla(' + INK.shadowHue + ',40%,12%,' + (kind === 1 ? 0.58 : 0.42) + ')'); sg.addColorStop(1, 'hsla(' + INK.shadowHue + ',40%,12%,0)'); c.fillStyle = sg; c.fillRect(left, sh0, Wd, shL);   /* (under thatch: deeper, longer, and from under its band of cut ends) */   /* (deeper and longer under thatch) */
    var sg2 = c.createLinearGradient(right, 0, right + 5, 0); sg2.addColorStop(0, 'hsla(' + INK.shadowHue + ',40%,12%,0.3)'); sg2.addColorStop(1, 'hsla(' + INK.shadowHue + ',40%,12%,0)'); c.fillStyle = sg2; c.fillRect(right, top + 2, 5, D);
    function eaveEdge(x0, y0, x1, y1) {                       // the thickness of the roof at an eave or a bargeboard: sod, straw ends or shingle ends along the line
      var dx = x1 - x0, dy2 = y1 - y0, len = Math.hypot(dx, dy2) || 1, nx = -dy2 / len, ny = dx / len, k;   // (nx, ny): outward, below the line
      if (ny < 0) { nx = -nx; ny = -ny; }
      if (kind === 1) {                       // thatch: the straw rounds over and is cut square, a band of cut ends standing proud of the wall
        var bw = 9.5; ink(c, [[x0 - nx, y0 - ny], [x1 - nx, y1 - ny], [x1 + nx * bw, y1 + ny * bw], [x0 + nx * bw, y0 + ny * bw]], THATCH_ENDS, { wob: 0.6, seed: seed + 20 + Math.round(x0), flat: true, lw: 0.7, heavy: 1.2 });
        c.lineWidth = 0.8; c.strokeStyle = 'rgba(62,46,22,0.6)'; c.beginPath(); for (k = 1.2; k < len - 0.6; k += 1.4 + hs(k, x0 + y0) * 1.3) { var u = k / len, px = x0 + dx * u, py = y0 + dy2 * u; c.moveTo(px + nx * 0.7, py + ny * 0.7); c.lineTo(px + nx * (bw - 0.5), py + ny * (bw - 0.5)); } c.stroke();
        c.strokeStyle = 'rgba(255,238,190,0.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0 - nx * 0.3, y0 - ny * 0.3); c.lineTo(x1 - nx * 0.3, y1 - ny * 0.3); c.stroke();
      }
      else if (kind === 0) { ink(c, [[x0 - nx, y0 - ny], [x1 - nx, y1 - ny], [x1 + nx * 2.6, y1 + ny * 2.6], [x0 + nx * 2.6, y0 + ny * 2.6]], '#4e3a2a', { wob: 0.5, seed: seed + 20, flat: true, lw: 0.6, heavy: 1.2 }); stroke(c, [[x0 + nx * 1.2, y0 + ny * 1.2], [x1 + nx * 1.2, y1 + ny * 1.2]], '#d9cdb0', 1.0, 0.8); /* the birch-bark board that holds the sod at the eave */ for (k = 2; k < len; k += 3) { var u2 = k / len, qx = x0 + dx * u2, qy = y0 + dy2 * u2; if (hs(qx, qy + 4) > 0.55) continue; c.strokeStyle = hs(qx, qy + 5) < 0.5 ? dk : r.col; c.lineWidth = 0.9; c.beginPath(); c.moveTo(qx - nx, qy - ny); c.lineTo(qx + nx * (3 + hs(qx, qy + 7) * 2.5) + (hs(qx, qy + 6) - 0.5) * 2, qy + ny * (3 + hs(qx, qy + 7) * 2.5)); c.stroke(); } }
      else { ink(c, [[x0 - nx, y0 - ny], [x1 - nx, y1 - ny], [x1 + nx * 2.2, y1 + ny * 2.2], [x0 + nx * 2.2, y0 + ny * 2.2]], edgeCol, { wob: 0.4, seed: seed + 20, flat: true, lw: 0.6, heavy: 1.2 }); for (k = 4; k < len; k += (kind === 3 ? 6 : 8)) { var u3 = k / len; stroke(c, [[x0 + dx * u3, y0 + dy2 * u3], [x0 + dx * u3 + nx * 2, y0 + dy2 * u3 + ny * 2]], INK.soft, 0.6); } }
    }
    // a facet of the roof: fill, the material's rows following it, grain
    function facet(pts, tone, rows, eave) {   // eave: the side its eave is on ('s', 'n', 'w', 'e'), for the thatch's courses
      var d = ink(c, pts, mix(r.col, tone > 0 ? '#fff4d0' : '#1a1410', Math.abs(tone)), { wob: 0, flat: true, noLine: true });
      c.save(); path(c, d); c.clip();
      var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; d.forEach(function (p) { bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]); });
      if (kind === 1) {                                      // straw in rows along the eave: level on the slopes, down the hips; every other course a shade darker, so the roof reads as laid thatch and not a wash (the studio, 2026-10-20)
        c.strokeStyle = lineCol; c.globalAlpha = a * 0.24; c.lineWidth = 0.7;   // the straw's fine grain between the courses
        if (rows === 'h') { for (j = by0 + 2; j < by1; j += 3.4) { c.beginPath(); c.moveTo(bx0, j); for (i = bx0; i < bx1; i += 5) c.quadraticCurveTo(i + 2.5, j + 0.8 + hs(i, j) * 1.6, i + 5, j); c.stroke(); } }
        else { for (i = bx0 + 2; i < bx1; i += 3.4) { c.beginPath(); c.moveTo(i, by0); for (j = by0; j < by1; j += 5) c.quadraticCurveTo(i + 0.8 + hs(i, j) * 1.6, j + 2.5, i, j + 5); c.stroke(); } }
        var ev = eave || (rows === 'h' ? 's' : 'e'), hz = ev === 's' || ev === 'n', sgn = ev === 's' || ev === 'e' ? 1 : -1, CS = THATCH_COURSE, n0, cu;
        for (n0 = 1; n0 < 40; n0++) {             // the courses, from the eave in: each one's lower edge, notched where it was cut, lies over the next and shades it
          var line0 = hz ? (sgn > 0 ? by1 - CS * n0 : by0 + CS * n0) : (sgn > 0 ? bx1 - CS * n0 : bx0 + CS * n0); if (hz ? (line0 < by0 - 1 || line0 > by1 + 1) : (line0 < bx0 - 1 || line0 > bx1 + 1)) break;
          var U0 = hz ? bx0 : by0, U1 = hz ? bx1 : by1, us = [U0], vs = [(hs(line0, 1) - 0.5) * 0.8], uu = U0;
          while (uu < U1) { uu = Math.min(U1, uu + 6 + hs(uu, line0) * 7); us.push(uu); vs.push(vs[vs.length - 1]); us.push(uu); vs.push((hs(uu + 1, line0) - 0.5) * 1.6); }
          var cLine = function (off) { c.beginPath(); for (cu = 0; cu < us.length; cu++) { var vv = line0 + sgn * (vs[cu] + off), px2 = hz ? us[cu] : vv, py2 = hz ? vv : us[cu]; if (cu) c.lineTo(px2, py2); else c.moveTo(px2, py2); } c.stroke(); };
          c.globalAlpha = a * 0.64; c.strokeStyle = dk; c.lineWidth = 3.4; cLine(2);                 // its shadow on the course below
          c.globalAlpha = a * 0.85; c.strokeStyle = lineCol; c.lineWidth = 0.9; cLine(0);              // the cut edge
          c.globalAlpha = a * (tone > 0 ? 0.45 : 0.26); c.strokeStyle = 'rgb(255,245,210)'; c.lineWidth = 1.1; cLine(-1);   // the rounded straw above it catching the light
        }
        c.globalAlpha = a; c.strokeStyle = tone > 0 ? 'rgba(255,245,210,0.26)' : 'rgba(255,245,210,0.1)'; c.lineWidth = 1.1; c.beginPath();
        for (j = by0 + 2; j < by1; j += 5) for (i = bx0 + 2; i < bx1; i += 6.5) { var o = hs(i, j + 1); if (o < 0.5) { if (rows === 'h') { c.moveTo(i + o * 3, j + 3.5); c.lineTo(i + o * 3 + 0.6, j + 0.5); } else { c.moveTo(i + 0.5, j + o * 3); c.lineTo(i + 3.5, j + o * 3 + 0.6); } } }
        c.stroke(); c.globalAlpha = a;
      } else if (kind === 0) {                               // sod with grass blades in two greens, a few flowers
        for (j = by0 + 2; j < by1; j += 2.6) for (i = bx0 + 1; i < bx1; i += 3.2) { var q = hs(i, j); if (q > 0.6) continue; c.strokeStyle = q < 0.25 ? hl : (q < 0.45 ? dk : lineCol); c.lineWidth = 0.9; c.beginPath(); c.moveTo(i + q * 2, j + 1.5); c.lineTo(i + q * 2 + (hs(i, j + 2) - 0.5) * 2, j - 2 - hs(i, j + 3) * 2); c.stroke(); }
        for (j = by0 + 4; j < by1; j += 9) for (i = bx0 + 3; i < bx1; i += 11) if (hs(i, j) < 0.1) { c.fillStyle = hs(i, j + 1) < 0.5 ? '#d8c26a' : '#c9d2d8'; c.beginPath(); c.arc(i, j, 1.1, 0, 7); c.fill(); }
      } else if (kind === 3 || kind === 4) {                 // clay tiles (a curved lip on every tile) or slate (flat slabs) in offset rows, each its own tone
        var row2 = 0, tw2 = kind === 3 ? 6 : 9, th2 = kind === 3 ? 4.5 : 5.5, lip = kind === 3;
        if (rows === 'h') { for (j = by0 + th2; j < by1 + th2; j += th2, row2++) for (i = bx0 + (row2 % 2 ? tw2 / 2 : 0) - tw2; i < bx1; i += tw2) { var t4 = (hs(i, j) - 0.5) * (lip ? 0.2 : 0.14); c.fillStyle = mix(r.col, t4 > 0 ? '#ffffff' : '#000000', Math.abs(t4) + Math.max(0, -tone) * 0.5); c.fillRect(i, j - th2, tw2 - 0.6, th2 - 0.4); if (lip) { c.fillStyle = 'rgba(255,236,210,0.22)'; c.fillRect(i + 1, j - th2 + 0.6, tw2 - 2.4, 1.2); } c.fillStyle = 'rgba(30,20,16,0.28)'; c.fillRect(i, j - 1.3, tw2 - 0.6, 0.9); } }
        else { for (i = bx0 + tw2; i < bx1 + tw2; i += tw2, row2++) for (j = by0 + (row2 % 2 ? th2 / 2 : 0) - th2; j < by1; j += th2) { var t5 = (hs(i, j) - 0.5) * (lip ? 0.2 : 0.14); c.fillStyle = mix(r.col, t5 > 0 ? '#ffffff' : '#000000', Math.abs(t5) + Math.max(0, -tone) * 0.5); c.fillRect(i - tw2, j, tw2 - 0.4, th2 - 0.6); if (lip) { c.fillStyle = 'rgba(255,236,210,0.22)'; c.fillRect(i - tw2 + 0.6, j + 1, 1.2, th2 - 2.4); } c.fillStyle = 'rgba(30,20,16,0.28)'; c.fillRect(i - 1.3, j, 0.9, th2 - 0.6); } }
        c.strokeStyle = lineCol; c.lineWidth = 0.5; c.globalAlpha = a * 0.5; if (rows === 'h') { for (j = by0 + th2; j < by1; j += th2) { c.beginPath(); c.moveTo(bx0, j); c.lineTo(bx1, j); c.stroke(); } } else { for (i = bx0 + tw2; i < bx1; i += tw2) { c.beginPath(); c.moveTo(i, by0); c.lineTo(i, by1); c.stroke(); } } c.globalAlpha = a;
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
      var rh = kind === 1 ? Math.min(42, Wd * 0.58) : Math.min(34, Wd * 0.46), slopeL = [[left, top], [cx, top - rh], [cx, bot - rh], [left, bot]], slopeR = [[cx, top - rh], [right, top], [right, bot], [cx, bot - rh]];
      var ga = [[left, bot], [cx, bot - rh], [right, bot]], gw = [[left + ov, bot - ov * K], [cx, bot - rh + 1.2], [right - ov, bot - ov * K]];
      ink(c, ga, '#2b221c', { wob: 0, flat: true, noLine: true });                                                        // the dark underside of the eaves
      var gd = ink(c, gw, wm.face, { wob: 0.5, seed: seed + 9, noLine: true, flat: true });
      c.save(); path(c, gd); c.clip(); face(c, wm, left + ov, bot - rh, right - left - 2 * ov, rh, seed + 9); c.restore();
      var gl = mix(wm.top, '#1a1410', 0.1), tb = bot - ov * K, stoneG = wm.tex === 'ashlar' || wm.tex === 'blocks';
      if (stoneG) { var gwy = bot - rh * 0.55, gww = Math.min(9, rh * 0.22); archWindow(c, cx - gww / 2, gwy, gww, gww * 1.5, seed + 14); }   // a stone gable: no timbers, a small arched window high up
      else {
      ink(c, rect(left + ov, tb - 3.2, right - left - 2 * ov, 3.2), gl, { wob: 0.4, seed: seed + 10, lw: 0.7, heavy: 1.2 });                        // the tie beam
      ink(c, rect(cx - 1.6, bot - rh + 2, 3.2, rh - ov * K - 2), gl, { wob: 0.4, seed: seed + 11, lw: 0.7, heavy: 1.2 });                          // the king post
      ink(c, [[left + ov + 3, tb - 3.2], [left + ov + 6, tb - 3.2], [cx - 1, bot - rh * 0.52], [cx - 1, bot - rh * 0.52 + 3.4]], gl, { wob: 0.3, seed: seed + 12, lw: 0.6, heavy: 1.1 });   // the struts
      ink(c, [[right - ov - 3, tb - 3.2], [right - ov - 6, tb - 3.2], [cx + 1, bot - rh * 0.52], [cx + 1, bot - rh * 0.52 + 3.4]], gl, { wob: 0.3, seed: seed + 13, lw: 0.6, heavy: 1.1 });
      }
      var g2 = c.createLinearGradient(0, bot - rh, 0, bot - rh + 9); g2.addColorStop(0, 'hsla(' + INK.shadowHue + ',40%,12%,0.35)'); g2.addColorStop(1, 'hsla(' + INK.shadowHue + ',40%,12%,0)'); c.save(); path(c, gd); c.clip(); c.fillStyle = g2; c.fillRect(left, bot - rh, Wd, 10); c.restore();   // the shade under the ridge
      path(c, gd); c.lineWidth = 0.8; c.strokeStyle = INK.line; c.stroke();
      facet(slopeL, 0.14, 'v', 'w'); facet(slopeR, -0.26, 'v', 'e');
      if (kind === 1) thatchWeather(c, [[left, top], [cx, top - rh], [right, top], [right, bot], [cx, bot - rh], [left, bot]], [[left, top, left, bot, 1], [right, top, right, bot, -1]], [[left + Wd * 0.18, bot - D * 0.35], [right - Wd * 0.2, bot - D * 0.6]], seed, a);
      eaveEdge(left, bot, cx, bot - rh); eaveEdge(cx, bot - rh, right, bot);                                                // the bargeboards' edge over the gable
      stroke(c, [[left, bot], [cx, bot - rh], [right, bot]], r.ridge, 2.6); stroke(c, [[left, bot], [cx, bot - rh], [right, bot]], INK.line, 0.8);
      stroke(c, [[cx, top - rh], [cx, bot - rh]], INK.soft, 0.9);
      var sil = [[left, top], [cx, top - rh], [right, top], [right, bot], [cx, bot - rh], [left, bot]];
      path(c, sil); c.lineWidth = 0.9; c.strokeStyle = INK.line; c.stroke(); heavy(c, sil, 2.4);
      if (kind === 1) { ink(c, [[cx - 5.2, top - rh - 1.5], [cx + 5.2, top - rh - 1.5], [cx + 5, bot - rh + 1.5], [cx - 5, bot - rh + 1.5]], TURF_RIDGE, { wob: 0.9, seed: seed, lw: 0.7, heavy: 1.3 }); turfTufts(c, cx - 4, top - rh, cx - 4, bot - rh, seed); }   /* (fuller, 2026-10-22) */   // a thatch ridge is capped with turf, held by the crossed boards
      else ink(c, [[cx - 2.2, top - rh - 1], [cx + 2.2, top - rh - 1], [cx + 2, bot - rh + 1], [cx - 2, bot - rh + 1]], r.ridge, { wob: 0.5, seed: seed, lw: 0.7, heavy: 1.3 });   // the ridge pole
      if (kind !== 0 && kind !== 1) { ridgeBoards(cx, top - rh + 2, 1); ridgeBoards(cx, bot - rh - 1, -1); }   /* (no boards over a thatch's turf since 2026-10-22: the studio's target has none) */
    } else {
      // a hipped roof with the ridge east to west: the far slope lit, the near slope in shadow, the hips between, the ridge raised high
      var rise = kind === 1 ? Math.min(32, D * 0.48) : Math.min(26, D * 0.42), ridgeY = (top + bot) / 2 - rise, hip = Math.min(D * 0.5, Wd * 0.22);
      var far = [[left, top], [right, top], [right - hip, ridgeY], [left + hip, ridgeY]], near = [[left + hip, ridgeY], [right - hip, ridgeY], [right, bot], [left, bot]];
      var hipL = [[left, top], [left + hip, ridgeY], [left, bot]], hipR = [[right, top], [right, bot], [right - hip, ridgeY]], outline = [[left, top], [right, top], [right, bot], [left, bot]];
      eaveEdge(left, bot, right, bot);
      if (kind === 1) {                        // thatch: the facets inside a softened outline, the hips rounded (no ruled line down them), weathered
        var rOut = roundCorners(outline, 4.5); c.save(); path(c, rOut); c.clip();
        facet(far, 0.14, 'h', 'n'); facet(hipL, 0.04, 'v', 'w'); facet(hipR, -0.3, 'v', 'e'); facet(near, -0.12, 'h', 's');
        [[[left, bot], [left + hip, ridgeY]], [[right, bot], [right - hip, ridgeY]], [[left, top], [left + hip, ridgeY]], [[right, top], [right - hip, ridgeY]]].forEach(function (hl2, hi) { stroke(c, hl2, hi < 2 ? 'rgba(60,44,20,0.16)' : 'rgba(255,240,200,0.12)', 3.4); });
        thatchWeather(c, outline, [[left, bot, right, bot, 0], [left, top, left, bot, 1], [right, top, right, bot, -1]], [[left + hip + (right - left - 2 * hip) * 0.2, bot - (bot - ridgeY) * 0.3], [right - hip - (right - left - 2 * hip) * 0.15, bot - (bot - ridgeY) * 0.55], [left + Wd * 0.5, bot - (bot - ridgeY) * 0.15]], seed, a);
        c.restore(); path(c, rOut); c.lineWidth = 0.9; c.strokeStyle = INK.line; c.stroke(); heavy(c, rOut, 2.4);
      } else {
      facet(far, 0.14, 'h'); facet(hipL, 0.04, 'v'); facet(hipR, -0.3, 'v'); facet(near, -0.12, 'h');
      stroke(c, [[left, top], [left + hip, ridgeY]], INK.soft, 0.9); stroke(c, [[left, bot], [left + hip, ridgeY]], INK.line, 1.1);
      stroke(c, [[right, top], [right - hip, ridgeY]], INK.soft, 0.9); stroke(c, [[right, bot], [right - hip, ridgeY]], INK.line, 1.1);
      path(c, outline); c.lineWidth = 0.9; c.strokeStyle = INK.line; c.stroke(); heavy(c, outline, 2.4);
      }
      if (kind === 1) { ink(c, [[left + hip - 2.5, ridgeY - 5], [right - hip + 2.5, ridgeY - 5.4], [right - hip + 2.5, ridgeY + 4.4], [left + hip - 2.5, ridgeY + 4.8]], TURF_RIDGE, { wob: 0.9, seed: seed, lw: 0.7, heavy: 1.3 }); turfTufts(c, left + hip - 1, ridgeY - 4.6, right - hip + 1, ridgeY - 5, seed); }   // the turf cap of a thatch ridge, fuller (2026-10-22)
      else ink(c, [[left + hip - 1, ridgeY - 2], [right - hip + 1, ridgeY - 2.4], [right - hip + 1, ridgeY + 2], [left + hip - 1, ridgeY + 2.4]], r.ridge, { wob: 0.5, seed: seed, lw: 0.7, heavy: 1.3 });   // the ridge pole
      if (kind !== 0 && kind !== 1) [left + hip + 4, right - hip - 4].forEach(function (cx2, ci) { [[cx2 - 4, ridgeY + 3, cx2 + 4, ridgeY - 9], [cx2 + 4, ridgeY + 3, cx2 - 4, ridgeY - 9]].forEach(function (bd, bi) { ink(c, [[bd[0] - 1, bd[1]], [bd[2] - 1, bd[3]], [bd[2] + 1, bd[3]], [bd[0] + 1, bd[1]]], r.ridge, { wob: 0.3, seed: seed + ci * 2 + bi, flat: true, lw: 0.6, heavy: 1.1 }); }); });   // crossed ridge boards
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
  else if (id === 'townwall') { var am2 = WALLS[6]; c.fillStyle = am2.face; c.fillRect(-7, -6, 14, 13); c.strokeStyle = am2.dark; c.lineWidth = 0.7; c.beginPath(); for (var ti = -3; ti <= 5; ti += 4) { c.moveTo(-7, ti); c.lineTo(7, ti); } c.stroke(); c.fillStyle = am2.top; c.fillRect(-7.5, -8, 15, 2.5); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-7, -6, 14, 13); }
  else if (id === 'rail') { c.fillStyle = w.dark; c.fillRect(-7.5, -5, 2.5, 10); c.fillRect(5, -5, 2.5, 10); c.fillStyle = w.face; c.fillRect(-6, -3, 12, 2); c.fillRect(-6, 2, 12, 2); c.strokeStyle = LINE; c.lineWidth = 0.8; c.strokeRect(-6, -3, 12, 2); c.strokeRect(-6, 2, 12, 2); }
  else if (id === 'drystone') { var sm = WALLS[3]; c.fillStyle = sm.face; c.fillRect(-7, -3, 14, 8); c.strokeStyle = sm.dark; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-7, 0); c.lineTo(7, 0); c.moveTo(-7, 2.5); c.lineTo(7, 2.5); c.moveTo(-2, -3); c.lineTo(-2, 0); c.moveTo(3, 0); c.lineTo(3, 2.5); c.moveTo(-4, 2.5); c.lineTo(-4, 5); c.stroke(); c.fillStyle = sm.top; c.fillRect(-7, -5, 14, 2.5); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-7, -5, 14, 10); }
  else if (id === 'door') { c.fillStyle = w.dark; c.fillRect(-6, -7, 12, 14); c.fillStyle = '#6b4a35'; c.fillRect(-4, -5, 8, 12); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-6, -7, 12, 14); c.fillStyle = '#e0a93a'; c.beginPath(); c.arc(2, 1, 1, 0, 7); c.fill(); }
  else if (id === 'window') { c.fillStyle = w.face; c.fillRect(-6, -7, 12, 14); c.fillStyle = '#241a14'; c.fillRect(-4.5, -4.5, 5, 9); c.fillStyle = '#6a4e36'; c.fillRect(0.5, -5, 4, 10); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-6, -7, 12, 14); c.strokeRect(-4.5, -4.5, 5, 9); c.strokeRect(0.5, -5, 4, 10); }
  else { c.fillStyle = w.face; c.fillRect(-6, -6, 12, 12); face(c, w, -6, -6, 12, 12, 3); c.fillStyle = w.top; c.fillRect(-6, -8, 12, 2.5); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-6, -8, 12, 14); }
  c.restore();
}
return { ASH_FLOOR: ASH_FLOOR, T: T, TS: TS, K: K, LINE: LINE, UP: UP, WALLS: WALLS, FLOORS: FLOORS, ROOFS: ROOFS, YARD: YARD, OPEN: OPEN, CFG: CFG, cfg: cfg, key: key, edgeAt: edgeAt, edgeOk: edgeOk, roomWallM: roomWallM, rooms: rooms, postsOk: postsOk, postUsed: postUsed, ensurePosts: ensurePosts, ink: ink, INK: INK, face: face, stroke: stroke, drawH: drawH, drawV: drawV, drawRoof: drawRoof, drawSmokeHole: drawSmokeHole, ridgeMid: ridgeMid, drawPost: drawPost, drawBeam: drawBeam, drawStairs: drawStairs, drawChimney: drawChimney, icon: icon, wallMat: wallMat, scars: scars, remains: remains, rubble: rubble, drawDebris: drawDebris, drawFlame: drawFlame };
})();
if (typeof module !== 'undefined') module.exports = Build;
