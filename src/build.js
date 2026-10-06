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
var T = 32, TS = 24, K = 0.75, LINE = '#1d1622';
var WALLS = [
  { name: 'Logs', face: '#7a5636', top: '#9a744c', dark: '#3f2a18', tex: 'logs' },
  { name: 'Planks', face: '#8a6440', top: '#aa8358', dark: '#5a3f2a', tex: 'planks' },
  { name: 'Wattle', face: '#b89d6c', top: '#ceb686', dark: '#7a6540', tex: 'wattle' },
  { name: 'Stone', face: '#868a94', top: '#a9adb8', dark: '#5c606c', tex: 'blocks' },
  { name: 'Turf', face: '#5c7f48', top: '#79a25e', dark: '#3c5a30', tex: 'turf' }
];
// Floors go on any land tile, so they make paths, yards and decks round a house as well as the floor in it. The dock
// (water: true) also goes on water beside land or another dock, and can be walked on.
var FLOORS = [{ name: 'Planks', tile: 'plank' }, { name: 'Packed earth', tile: 'dirt' }, { name: 'Stone flags', tile: 'path' },
  { name: 'Gravel trail', tile: 'trail', bare: true }, { name: 'Grass', tile: 'grass', bare: true }, { name: 'Dark grass', tile: 'grassDark', bare: true }, { name: 'Moss', tile: 'moss', bare: true }, { name: 'Bare rock', tile: 'rock', bare: true },
  { name: 'Dock', tile: 'plank', water: true },
  { name: 'Gravel path', tile: 'trail', path: true }, { name: 'Earth path', tile: 'dirt', path: true }, { name: 'Stone path', tile: 'path', path: true }];   // paths: rounded, joining their neighbours
var ROOFS = [{ name: 'Turf', col: '#6a9a50', line: '#48733a', ridge: '#7a5636' }, { name: 'Thatch', col: '#d9b866', line: '#a3823f', ridge: '#6b4a2e' }, { name: 'Wood shingles', col: '#7d5b40', line: '#573c2a', ridge: '#4a3222' }, { name: 'No roof' }];
var CFG = { wallH: 26, thick: 5, overhang: 4, roof: 0, seeThrough: 0.12 };
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

/* drawing */
function texture(c, m, x, y, w, h) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.strokeStyle = m.dark; c.globalAlpha = 0.55; c.lineWidth = 0.9; c.beginPath();
  var i, r;
  if (m.tex === 'planks') for (i = 8; i < w; i += 8) { c.moveTo(x + i, y); c.lineTo(x + i, y + h); }
  else if (m.tex === 'blocks') { c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.moveTo(x + 16, y); c.lineTo(x + 16, y + h / 2); c.moveTo(x + 8, y + h / 2); c.lineTo(x + 8, y + h); c.moveTo(x + 24, y + h / 2); c.lineTo(x + 24, y + h); }
  else if (m.tex === 'turf') for (r = 4; r < h; r += 4) { c.moveTo(x, y + r); c.lineTo(x + w, y + r); }
  else if (m.tex === 'logs') for (r = 5; r < h; r += 5) { c.moveTo(x, y + r); c.lineTo(x + w, y + r); }
  else if (m.tex === 'wattle') { for (i = 4; i < w; i += 6) { c.moveTo(x + i, y); c.lineTo(x + i, y + h); } for (r = 4; r < h; r += 4) { c.moveTo(x, y + r); c.lineTo(x + w, y + r); } }
  else { c.moveTo(x + 16, y); c.lineTo(x + 16, y + h); }
  c.stroke(); c.restore();
}
function box(c, x, y, w, h, fill) { c.fillStyle = fill; c.fillRect(x, y, w, h); c.strokeStyle = LINE; c.lineWidth = 1.2; c.strokeRect(x, y, w, h); }
// an edge along the top of tile (x, y): low while you are inside and it is in front of you; open for a door you stand near
function post(c, x, y, w, h, m) { box(c, x - w / 2, y - h, w, h, m.dark); }
// a fence along the top of tile (x, y): posts with woven wattle between; a gate: a bar frame that swings open as you come near;
// a palisade: a row of pointed logs
function drawFenceH(c, x, y, e, open, C) {
  var m = WALLS[e.m] || WALLS[2], x0 = x * T, yb = y * TS, i;
  if (e.t === 'palisade') {
    for (i = 0; i < 4; i++) { var px = x0 + i * 8; c.fillStyle = i % 2 ? m.face : m.top; c.beginPath(); c.moveTo(px, yb); c.lineTo(px, yb - PALISADE_H + 4); c.lineTo(px + 4, yb - PALISADE_H); c.lineTo(px + 8, yb - PALISADE_H + 4); c.lineTo(px + 8, yb); c.closePath(); c.fill(); c.strokeStyle = LINE; c.lineWidth = 1.1; c.stroke(); }
    c.fillStyle = m.dark; c.fillRect(x0, yb - 11, T, 2.2); c.fillRect(x0, yb - 22, T, 2.2);
    return;
  }
  var h = FENCE_H;
  if (e.t === 'rail') {                   // a split-rail fence: two rails between posts
    post(c, x0 + 1.5, yb, 3, h + 3, m); post(c, x0 + T - 1.5, yb, 3, h + 3, m);
    c.fillStyle = m.face; c.strokeStyle = LINE; c.lineWidth = 0.9; c.fillRect(x0, yb - h + 1, T, 2.6); c.strokeRect(x0, yb - h + 1, T, 2.6); c.fillRect(x0, yb - 5.5, T, 2.6); c.strokeRect(x0, yb - 5.5, T, 2.6);
    return;
  }
  if (e.t === 'drystone') {               // a low wall of stacked stones with a row of capstones
    var sm = WALLS[3], r2, q; c.fillStyle = sm.face; c.fillRect(x0, yb - 10, T, 10);
    c.strokeStyle = sm.dark; c.lineWidth = 0.9; c.beginPath(); for (r2 = 0; r2 < 3; r2++) { var yy = yb - 10 + r2 * 3.4; c.moveTo(x0, yy + 3.4); c.lineTo(x0 + T, yy + 3.4); for (q = (r2 % 2 ? 3 : 7); q < T; q += 8) { c.moveTo(x0 + q, yy); c.lineTo(x0 + q, yy + 3.4); } } c.stroke();
    c.fillStyle = sm.top; c.fillRect(x0, yb - 12.5, T, 2.8); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(x0, yb - 12.5, T, 12.5);
    return;
  }
  if (e.t === 'gate') {
    post(c, x0 + 1.5, yb, 3, h + 3, m); post(c, x0 + T - 1.5, yb, 3, h + 3, m);
    if (open) { box(c, x0 + 3, yb - h - 1, 3, h, m.top); return; }
    c.fillStyle = m.top; c.fillRect(x0 + 3, yb - h, T - 6, 2.4); c.fillRect(x0 + 3, yb - 4, T - 6, 2.4);
    c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(x0 + 3, yb - h, T - 6, 2.4); c.strokeRect(x0 + 3, yb - 4, T - 6, 2.4);
    c.strokeStyle = m.dark; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0 + 4, yb - 2); c.lineTo(x0 + T - 4, yb - h + 1); c.stroke();
    return;
  }
  c.fillStyle = m.face; c.fillRect(x0, yb - h + 2, T, h - 3); texture(c, { dark: m.dark, tex: 'wattle' }, x0, yb - h + 2, T, h - 3);
  c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(x0, yb - h + 2, T, h - 3);
  post(c, x0 + 1.5, yb, 3, h + 2, m); post(c, x0 + T / 2, yb, 3, h + 2, m); post(c, x0 + T - 1.5, yb, 3, h + 2, m);
}
function drawFenceV(c, x, y, e, open, more, C) {
  var m = WALLS[e.m] || WALLS[2], xl = x * T, yt = y * TS, i;
  if (e.t === 'palisade') {
    for (i = 0; i < 3; i++) { var py = yt + i * 8; c.fillStyle = i % 2 ? m.face : m.top; c.beginPath(); c.moveTo(xl - 3, py + 8); c.lineTo(xl - 3, py + 8 - PALISADE_H + 3); c.lineTo(xl, py + 8 - PALISADE_H); c.lineTo(xl + 3, py + 8 - PALISADE_H + 3); c.lineTo(xl + 3, py + 8); c.closePath(); c.fill(); c.strokeStyle = LINE; c.lineWidth = 1.1; c.stroke(); }
    return;
  }
  var h = FENCE_H;
  if (e.t === 'rail') { post(c, xl, yt, 3, h + 3, m); if (!more) post(c, xl, yt + TS, 3, h + 3, m); c.fillStyle = m.face; c.fillRect(xl - 1.3, yt - h + 1, 2.6, TS + 5); c.strokeStyle = LINE; c.lineWidth = 0.9; c.strokeRect(xl - 1.3, yt - h + 1, 2.6, TS + 5); return; }
  if (e.t === 'drystone') { var sm = WALLS[3]; c.fillStyle = sm.face; c.fillRect(xl - 3, yt - 10, 6, TS + 10); c.strokeStyle = sm.dark; c.lineWidth = 0.9; c.beginPath(); for (var q = yt - 7; q < yt + TS + 10; q += 3.4) { c.moveTo(xl - 3, q); c.lineTo(xl + 3, q); } c.stroke(); c.fillStyle = sm.top; c.fillRect(xl - 3, yt - 12.5, 6, 2.8); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(xl - 3, yt - 12.5, 6, TS + 12.5); return; }
  if (e.t === 'gate') { post(c, xl, yt, 3, h + 3, m); post(c, xl, yt + TS, 3, h + 3, m); if (!open) { c.fillStyle = m.top; c.fillRect(xl - 1.2, yt - h, 2.4, TS); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(xl - 1.2, yt - h, 2.4, TS); } return; }
  c.fillStyle = m.face; c.fillRect(xl - 1.5, yt - h + 2, 3, TS); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(xl - 1.5, yt - h + 2, 3, TS);
  post(c, xl, yt, 3, h + 2, m); post(c, xl, yt + TS / 2, 3, h + 2, m); if (!more) post(c, xl, yt + TS, 3, h + 2, m);
}
function drawH(c, x, y, e, low, open, C) {
  C = C || CFG;
  if (YARD[e.t]) return drawFenceH(c, x, y, e, open, C);
  var m = WALLS[e.m] || WALLS[0], h = low ? 7 : C.wallH, x0 = x * T, yb = y * TS, cap = C.thick * K;
  if (e.t === 'door' && !low) {
    box(c, x0, yb - h, 4, h, m.dark); box(c, x0 + T - 4, yb - h, 4, h, m.dark); box(c, x0, yb - h - cap, T, cap + 4, m.top);
    if (open) box(c, x0 + 4, yb - h + 4, 4, h - 4, '#6b4a35');
    else { box(c, x0 + 4, yb - h + 4, T - 8, h - 4, '#6b4a35'); c.fillStyle = '#e0a93a'; c.beginPath(); c.arc(x0 + T - 9, yb - h * 0.45, 1.4, 0, 7); c.fill(); }
    return;
  }
  if (e.t === 'door') { box(c, x0, yb - h, 4, h, m.dark); box(c, x0 + T - 4, yb - h, 4, h, m.dark); return; }
  c.fillStyle = m.face; c.fillRect(x0, yb - h, T, h); texture(c, m, x0, yb - h, T, h);
  c.fillStyle = m.top; c.fillRect(x0, yb - h - cap, T, cap);
  c.strokeStyle = LINE; c.lineWidth = 1.2; c.strokeRect(x0, yb - h - cap, T, h + cap); c.beginPath(); c.moveTo(x0, yb - h); c.lineTo(x0 + T, yb - h); c.stroke();
  if (e.t === 'window' && !low) { c.fillStyle = 'rgba(150,215,240,0.8)'; c.fillRect(x0 + 7, yb - h + 5, T - 14, h - 12); c.strokeRect(x0 + 7, yb - h + 5, T - 14, h - 12); c.beginPath(); c.moveTo(x0 + T / 2, yb - h + 5); c.lineTo(x0 + T / 2, yb - 7); c.stroke(); }
}
// an edge along the left side of tile (x, y). more: whether the V edge below continues it (no end face then)
function drawV(c, x, y, e, open, more, C) {
  C = C || CFG;
  if (YARD[e.t]) return drawFenceV(c, x, y, e, open, !!(more && more.t && YARD[more.t]), C);   // more: the edge below (object) or whether there is one
  var m = WALLS[e.m] || WALLS[0], h = C.wallH, th = C.thick, xl = x * T - th / 2, yt = y * TS - h;
  if (e.t === 'door') {
    box(c, xl, yt, th, 4, m.dark); box(c, xl, yt + TS - 4, th, 4, m.dark);
    if (!open) box(c, xl + 0.6, yt + 4, th - 1.2, TS - 8, '#6b4a35');
    if (!more) box(c, xl, yt + TS, th, h, m.dark);
    return;
  }
  if (!more) { c.fillStyle = m.face; c.fillRect(xl, yt + TS, th, h); c.strokeStyle = LINE; c.lineWidth = 1.2; c.strokeRect(xl, yt + TS, th, h); }
  box(c, xl, yt, th, TS, m.top);
  if (e.t === 'window') { c.fillStyle = 'rgba(150,215,240,0.9)'; c.fillRect(xl + 0.8, yt + 6, th - 1.6, TS - 12); }
}
// The frame: a post at corner (x, y) (a timber a little taller than the wall, with a cap), and a beam between two
// posts a tile apart where no wall stands between them, so a frame reads as a frame before the walls fill it in.
function drawPost(c, x, y, p, C) {
  C = C || CFG; var m = WALLS[p.m] || WALLS[0], w = C.thick + 1.5, h = C.wallH + C.thick * K + 4, px = x * T, py = y * TS;
  c.fillStyle = m.dark; c.fillRect(px - w / 2, py - h, w, h); c.strokeStyle = LINE; c.lineWidth = 1.1; c.strokeRect(px - w / 2, py - h, w, h);
  c.fillStyle = m.top; c.fillRect(px - w / 2 - 1, py - h - 2.5, w + 2, 3); c.strokeRect(px - w / 2 - 1, py - h - 2.5, w + 2, 3);
}
function drawBeam(c, x, y, horiz, p, C) {
  C = C || CFG; var m = WALLS[p.m] || WALLS[0], top = y * TS - C.wallH - C.thick * K - 1;
  if (horiz) box(c, x * T + 2, top, T - 4, 3.2, m.top); else box(c, x * T - 1.6, top, 3.2, TS, m.top);
}
// Stairs in tile (x, y), climbing to the north: two stringers and six treads, drawn from the top step down so each
// overlaps the one behind. The hero steps onto the lower half from the south and arrives on the floor above.
function drawStairs(c, x, y, C) {
  C = C || CFG; var px = x * T + 4, w = T - 8, n = 6, h = C.wallH + C.thick * K + 1, by = (y + 1) * TS, i;
  c.fillStyle = '#4a3222'; c.fillRect(px - 2.5, by - h - TS, 3, h + TS); c.fillRect(px + w - 0.5, by - h - TS, 3, h + TS);
  for (i = n - 1; i >= 0; i--) {
    var d = TS / n, rise = h / n, sy = by - (i + 1) * d - (i + 1) * rise;
    c.fillStyle = '#6b4a35'; c.fillRect(px, sy + d, w, rise); c.strokeStyle = LINE; c.lineWidth = 0.9; c.strokeRect(px, sy + d, w, rise);
    c.fillStyle = i % 2 ? '#b98a5a' : '#c4955f'; c.fillRect(px, sy, w, d + 0.5); c.strokeRect(px, sy, w, d + 0.5);
  }
}
// A stone chimney rising from x, yBase (screen units) to h above it, with smoke drifting from its top (t is a clock).
function drawChimney(c, x, yBase, h, a, t) {
  var w = 9, j, i; c.save(); c.globalAlpha = a;
  c.fillStyle = WALLS[3].face; c.fillRect(x - w / 2, yBase - h, w, h);
  c.strokeStyle = WALLS[3].dark; c.lineWidth = 0.8; c.globalAlpha = a * 0.6; c.beginPath();
  for (j = yBase - h + 4; j < yBase; j += 4) { c.moveTo(x - w / 2, j); c.lineTo(x + w / 2, j); var ox = Math.floor(j / 4) % 2 ? -1.6 : 1.6; c.moveTo(x + ox, j); c.lineTo(x + ox, j + 4); }
  c.stroke(); c.globalAlpha = a;
  c.strokeStyle = LINE; c.lineWidth = 1.1; c.strokeRect(x - w / 2, yBase - h, w, h);
  c.fillStyle = WALLS[3].top; c.fillRect(x - w / 2 - 1.5, yBase - h - 3, w + 3, 3.5); c.strokeRect(x - w / 2 - 1.5, yBase - h - 3, w + 3, 3.5);
  c.fillStyle = '#2a2428'; c.beginPath(); c.ellipse(x, yBase - h - 3, 3, 1.1, 0, 0, 7); c.fill();
  for (i = 0; i < 5; i++) { var u = ((t * 0.3 + i * 0.2) % 1), px = x + Math.sin(t * 0.9 + i * 1.7) * 2 + u * 9, py = yBase - h - 5 - u * 24, r = 2 + u * 4.5; c.fillStyle = 'rgba(232,232,238,' + ((1 - u) * 0.42 * a).toFixed(2) + ')'; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill(); }
  c.restore();
}
// The roof of a closed room, up one storey over its tiles (dy lifts it a storey more for a room upstairs). Turf is a
// living green with tufts; thatch is rows of straw with a ragged fringe hanging over the eaves and crossed boards at
// the ridge; shingles overlap in offset rows. The near slope lies in shadow and a pole runs along the ridge.
function drawRoof(c, room, a, C, dy) {
  C = C || CFG; dy = dy || 0;
  var r = ROOFS[C.roof]; if (!r || !r.col || a <= 0.01) return;
  var ov = C.overhang, up = C.wallH + C.thick * K + 1, i, j, y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9, kind = C.roof;
  room.tiles.forEach(function (t) { y0 = Math.min(y0, t[1]); y1 = Math.max(y1, t[1]); x0 = Math.min(x0, t[0]); x1 = Math.max(x1, t[0]); });
  function rects(pad) { c.beginPath(); room.tiles.forEach(function (t) { c.rect(t[0] * T - ov - pad, t[1] * TS - up - ov * K - pad, T + (ov + pad) * 2, TS + (ov * K + pad) * 2); }); }
  function h2(a1, b1) { var v = Math.sin(a1 * 12.9898 + b1 * 78.233) * 43758.5453; return v - Math.floor(v); }
  var top = y0 * TS - up - ov * K, bot = (y1 + 1) * TS - up + ov * K, left = x0 * T - ov, right = (x1 + 1) * T + ov, mid = (top + bot) / 2;
  c.save(); a *= c.globalAlpha; c.globalAlpha = a; c.translate(0, dy); c.lineCap = 'round';   // under a faded storey the roof fades with it
  if (kind === 1) {                                        // the fringe hangs below the eaves, so it goes under the roof
    for (i = left + 1; i < right; i += 2.3) { var len = 4 + h2(i, 1) * 5, dark = h2(i, 2) < 0.3; c.strokeStyle = dark ? r.line : r.col; c.lineWidth = dark ? 1.2 : 2; c.beginPath(); c.moveTo(i, bot - 3); c.lineTo(i + (h2(i, 3) - 0.5) * 1.5, bot + len); c.stroke(); }
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(left, bot + 2); c.lineTo(right, bot + 2); c.stroke();
  }
  rects(1.3); c.fillStyle = LINE; c.fill();
  rects(0); c.fillStyle = r.col; c.fill(); c.save(); c.clip();
  c.fillStyle = 'rgba(0,0,0,0.14)'; c.fillRect(left, mid, right - left, bot - mid);
  if (kind === 1) {
    for (j = top + 4; j < bot; j += 5.5) {
      c.strokeStyle = r.line; c.globalAlpha = a * 0.55; c.lineWidth = 1; c.beginPath(); c.moveTo(left, j);
      for (i = left; i < right; i += 4) c.quadraticCurveTo(i + 2, j + 1.2 + h2(i, j) * 2.2, i + 4, j);
      c.stroke();
      c.strokeStyle = 'rgba(255,245,200,' + (j > mid ? 0.18 : 0.35) + ')'; c.lineWidth = 1.2; c.beginPath();
      for (i = left + 2; i < right; i += 7) { var o = h2(i, j + 1); if (o < 0.6) { c.moveTo(i + o * 3, j - 3.5); c.lineTo(i + o * 3 + 0.6, j - 0.5); } }
      c.stroke(); c.globalAlpha = a;
    }
  } else if (kind === 0) {
    for (j = top + 3; j < bot; j += 4) for (i = left + 2; i < right; i += 6) { var q = h2(i, j); if (q > 0.55) continue; c.strokeStyle = q < 0.2 ? 'rgba(255,255,255,0.22)' : r.line; c.lineWidth = 1; c.beginPath(); c.arc(i + q * 4, j + 1, 2, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    c.fillStyle = '#f0e08a'; for (j = top + 4; j < bot; j += 9) for (i = left + 3; i < right; i += 11) if (h2(i, j) < 0.12) { c.beginPath(); c.arc(i, j, 1.1, 0, 7); c.fill(); }
  } else {
    c.strokeStyle = r.line; c.lineWidth = 0.9; c.globalAlpha = a * 0.7;
    var row = 0; for (j = top + 5; j < bot + 5; j += 5, row++) { c.beginPath(); c.moveTo(left, j); c.lineTo(right, j); c.stroke(); c.beginPath(); for (i = left + (row % 2 ? 4 : 0); i < right; i += 8) { c.moveTo(i, j - 5); c.lineTo(i, j); } c.stroke(); }
    c.globalAlpha = a;
  }
  c.restore();
  c.fillStyle = r.ridge; c.strokeStyle = LINE; c.lineWidth = 1; c.beginPath(); c.roundRect(left + 1, mid - 2, right - left - 2, 4, 2); c.fill(); c.stroke();
  if (kind !== 0) [left + 7, right - 7].forEach(function (cx) { for (var pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? r.ridge : LINE; c.lineWidth = pass ? 2 : 3.6; c.beginPath(); c.moveTo(cx - 4, mid + 3); c.lineTo(cx + 4, mid - 9); c.moveTo(cx + 4, mid + 3); c.lineTo(cx - 4, mid - 9); c.stroke(); } });
  c.restore();
}
// a small icon of a piece, for a hotbar slot (centred on 0, 0, about 14 wide)
var FLOOR_COL = { plank: ['#b98a5a', '#7a5636'], dirt: ['#a8865a', '#7a6040'], path: ['#9a9ca6', '#5c606c'], trail: ['#b9a07a', '#8a7050'], grass: ['#7fc45a', '#5a9a3a'], grassDark: ['#5f9a46', '#3f6a30'], moss: ['#6a9a58', '#4a7a3a'], rock: ['#8a8c94', '#5c606c'] };
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
  else if (id === 'window') { c.fillStyle = w.face; c.fillRect(-6, -7, 12, 14); c.fillStyle = 'rgba(150,215,240,0.9)'; c.fillRect(-3.5, -4.5, 7, 9); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-6, -7, 12, 14); c.strokeRect(-3.5, -4.5, 7, 9); }
  else { c.fillStyle = w.face; c.fillRect(-6, -6, 12, 12); c.fillStyle = w.top; c.fillRect(-6, -8, 12, 2.5); texture(c, w, -6, -6, 12, 12); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-6, -8, 12, 14); }
  c.restore();
}
return { T: T, TS: TS, K: K, LINE: LINE, UP: UP, WALLS: WALLS, FLOORS: FLOORS, ROOFS: ROOFS, YARD: YARD, OPEN: OPEN, CFG: CFG, cfg: cfg, key: key, edgeAt: edgeAt, edgeOk: edgeOk, rooms: rooms, postsOk: postsOk, postUsed: postUsed, ensurePosts: ensurePosts, texture: texture, box: box, drawH: drawH, drawV: drawV, drawRoof: drawRoof, drawPost: drawPost, drawBeam: drawBeam, drawStairs: drawStairs, drawChimney: drawChimney, icon: icon };
})();
if (typeof module !== 'undefined') module.exports = Build;
