/* Build: the building pieces, shared by the Base Editor and the game.
   A building is B = { floors: { 'x,y': floorMat }, H: { 'x,y': { t, m } }, V: { 'x,y': { t, m } } } on a tile grid:
   floors fill tiles, H edges run along the top of tile (x, y), V edges along its left side. t is 'wall', 'door'
   or 'window'; m indexes WALLS. Build.rooms finds the closed rooms (which get a roof) and the collision circles;
   drawH, drawV and drawRoof draw the pieces in the world (y-sorted by the page). cfg: wallH, thick, overhang, roof. */
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
var FLOORS = [{ name: 'Planks', tile: 'plank' }, { name: 'Packed earth', tile: 'dirt' }, { name: 'Stone flags', tile: 'path' }];
var ROOFS = [{ name: 'Turf', col: '#6a9a50', line: '#48733a' }, { name: 'Thatch', col: '#c4a55c', line: '#93793c' }, { name: 'Wood shingles', col: '#7d5b40', line: '#573c2a' }, { name: 'No roof' }];
var CFG = { wallH: 26, thick: 5, overhang: 4, roof: 0, seeThrough: 0.12 };
function key(x, y) { return x + ',' + y; }
function cfg(c) { var o = {}, k; for (k in CFG) o[k] = CFG[k]; for (k in c || {}) if (c[k] != null) o[k] = c[k]; return o; }

// the edge of a tile nearest to a world point, with how far from it (in tiles)
function edgeAt(wx, wy) {
  var tx = Math.floor(wx / T), ty = Math.floor(wy / T), fx = wx / T - tx, fy = wy / T - ty, best = Math.min(fx, 1 - fx, fy, 1 - fy);
  if (best === fy) return { L: 'H', x: tx, y: ty, d: best }; if (best === 1 - fy) return { L: 'H', x: tx, y: ty + 1, d: best };
  if (best === fx) return { L: 'V', x: tx, y: ty, d: best }; return { L: 'V', x: tx + 1, y: ty, d: best };
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
  function pass(ax, ay, bx, by) {                       // can you step from tile a to its neighbour b?
    if (bx < ax) return !B.V[key(ax, ay)]; if (bx > ax) return !B.V[key(bx, by)];
    if (by < ay) return !B.H[key(ax, ay)]; return !B.H[key(bx, by)];
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
  for (k in B.H) { if (B.H[k].t === 'door') continue; p = k.split(','); for (i = 0; i < 3; i++) solids.push({ x: p[0] * T + 5.3 + i * 10.7, y: p[1] * T, r: 5.5, hide: true }); }
  for (k in B.V) { if (B.V[k].t === 'door') continue; p = k.split(','); for (i = 0; i < 3; i++) solids.push({ x: p[0] * T, y: p[1] * T + 5.3 + i * 10.7, r: 5.5, hide: true }); }
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
function drawH(c, x, y, e, low, open, C) {
  C = C || CFG;
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
function drawRoof(c, room, a, C) {
  C = C || CFG;
  var r = ROOFS[C.roof]; if (!r || !r.col || a <= 0.01) return;
  var ov = C.overhang, up = C.wallH + C.thick * K + 1, i, y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9;
  function rects(pad) { c.beginPath(); room.tiles.forEach(function (t) { c.rect(t[0] * T - ov - pad, t[1] * TS - up - ov * K - pad, T + (ov + pad) * 2, TS + (ov * K + pad) * 2); }); }
  room.tiles.forEach(function (t) { y0 = Math.min(y0, t[1]); y1 = Math.max(y1, t[1]); x0 = Math.min(x0, t[0]); x1 = Math.max(x1, t[0]); });
  c.save(); c.globalAlpha = a;
  rects(1.3); c.fillStyle = LINE; c.fill();
  rects(0); c.fillStyle = r.col; c.fill(); c.clip();
  var top = y0 * TS - up - ov * K, bot = (y1 + 1) * TS - up + ov * K, left = x0 * T - ov, right = (x1 + 1) * T + ov, mid = (top + bot) / 2;
  c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(left, mid, right - left, bot - mid);
  c.strokeStyle = r.line; c.lineWidth = 1; c.beginPath();
  for (i = top + 5; i < bot; i += 5) { c.moveTo(left, i); c.lineTo(right, i); }
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 2; c.beginPath(); c.moveTo(left, mid); c.lineTo(right, mid); c.stroke();
  c.restore();
}
// a small icon of a piece, for a hotbar slot (centred on 0, 0, about 14 wide)
function icon(c, id, m) {
  var w = WALLS[m || 0];
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  if (id === 'floor') { c.fillStyle = '#b98a5a'; c.fillRect(-6, -4, 12, 8); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-6, -4, 12, 8); c.beginPath(); c.moveTo(-2, -4); c.lineTo(-2, 4); c.moveTo(2, -4); c.lineTo(2, 4); c.stroke(); }
  else if (id === 'door') { c.fillStyle = w.dark; c.fillRect(-6, -7, 12, 14); c.fillStyle = '#6b4a35'; c.fillRect(-4, -5, 8, 12); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-6, -7, 12, 14); c.fillStyle = '#e0a93a'; c.beginPath(); c.arc(2, 1, 1, 0, 7); c.fill(); }
  else if (id === 'window') { c.fillStyle = w.face; c.fillRect(-6, -7, 12, 14); c.fillStyle = 'rgba(150,215,240,0.9)'; c.fillRect(-3.5, -4.5, 7, 9); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-6, -7, 12, 14); c.strokeRect(-3.5, -4.5, 7, 9); }
  else { c.fillStyle = w.face; c.fillRect(-6, -6, 12, 12); c.fillStyle = w.top; c.fillRect(-6, -8, 12, 2.5); texture(c, w, -6, -6, 12, 12); c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(-6, -8, 12, 14); }
  c.restore();
}
return { T: T, TS: TS, K: K, LINE: LINE, WALLS: WALLS, FLOORS: FLOORS, ROOFS: ROOFS, CFG: CFG, cfg: cfg, key: key, edgeAt: edgeAt, edgeOk: edgeOk, rooms: rooms, texture: texture, box: box, drawH: drawH, drawV: drawV, drawRoof: drawRoof, icon: icon };
})();
if (typeof module !== 'undefined') module.exports = Build;
