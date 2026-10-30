/* Piers (Robin, 2026-10-30; Colin, AD's pieces, assets/pier): a pier is modules of 2 by 2 tiles on the grid, drawn as an autotile, with
   the small shipyard (the head) at a run's end. This file is the rules, with no drawing: where a piece may go, what stands where, the way
   along a pier. G, the world as the rules ask it: land(x, y), sand(x, y), shallow(x, y), water(x, y), clear(x, y). Robin's rules: a pier is
   built from the beach and stands in the shallows, 1 or 2 pieces may reach inland, nets where you climb up. Mine: a module in the water
   joins the pier and has its near edge in the shallows or on land (so one module may stand past the wading line); a new module touches
   only the module it joins (Colin, AD's board: no bend or head touching another pier, a tile between piers). */
var Pier = (function () {
var M = 64, DIRS = { e: [1, 0], w: [-1, 0], s: [0, 1], n: [0, -1] }, OPP = { e: 'w', w: 'e', n: 's', s: 'n' }, VAR = [1, 2, 1, 3, 2, 4, 1, 5];
function key(mx, my) { return mx + ',' + my; }
function fresh() { return { m: {}, n: {} }; }
function mid(m) { return { x: (m.x + 0.5) * M, y: (m.y + 0.5) * M }; }
function box(m) { var c = mid(m), wide = m.k === 'head' ? (m.o === 'e' || m.o === 'w' ? [32, 48] : [48, 32]) : [32, 32]; return [c.x - wide[0], c.y - wide[1], c.x + wide[0], c.y + wide[1]]; }
function near(d, m, side) { var v = DIRS[side]; return d.m[key(m.x + v[0], m.y + v[1])] || null; }
function any(d) { for (var k in d.m) return true; return false; }
function at(d, x, y) {                     // the module (or head, with its overhang) that stands at a point
  var mx = Math.floor(x / M), my = Math.floor(y / M), m = d.m[key(mx, my)], i, b; if (m) { b = box(m); if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) return m; }
  var side = [[1, 0], [-1, 0], [0, 1], [0, -1]]; for (i = 0; i < 4; i++) { m = d.m[key(mx + side[i][0], my + side[i][1])]; if (m && m.k === 'head') { b = box(m); if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) return m; } }
  return null;
}
function neighbours(d, mx, my) { var out = [], s; for (s in DIRS) { var o = d.m[key(mx + DIRS[s][0], my + DIRS[s][1])]; if (o) out.push({ m: o, side: s }); } return out; }
function touching(d, mx, my, join) {       // another module within one step, other than the one it joins and what stands next to that
  for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) { if (!a && !b) continue; var o = d.m[key(mx + a, my + b)]; if (!o || (join && o === join)) continue; if (join && a && b && Math.abs(o.x - join.x) + Math.abs(o.y - join.y) === 1) continue; return true; }
  return false;
}
function component(d, m) { var seen = {}, list = [m], out = []; seen[key(m.x, m.y)] = 1; while (list.length) { var q = list.pop(); out.push(q); neighbours(d, q.x, q.y).forEach(function (n) { var k = key(n.m.x, n.m.y); if (!seen[k]) { seen[k] = 1; list.push(n.m); } }); } return out; }
function canRun(d, mx, my, G) {            // a plain piece here? { ok, why }
  if (d.m[key(mx, my)]) return { ok: false, why: 'A pier stands here' };
  var c = { x: (mx + 0.5) * M, y: (my + 0.5) * M }, N = neighbours(d, mx, my), onLand = G.land(c.x, c.y);
  if (N.length > 1) return { ok: false, why: 'It would touch another pier' };
  var J = N[0] ? N[0].m : null; if (J && J.k === 'head') return { ok: false, why: 'The yard is the end of its pier' };
  if (touching(d, mx, my, J)) return { ok: false, why: 'Too close to another pier' };
  if (!J) {
    if (!onLand || !G.sand(c.x, c.y)) return { ok: false, why: 'Start a pier on the beach' };
    var byWater = false, s, i; for (s in DIRS) for (i = 1; i <= 2; i++) { var wx = c.x + DIRS[s][0] * M * i, wy = c.y + DIRS[s][1] * M * i; if (G.shallow(wx, wy) || G.water(wx, wy)) byWater = true; }
    if (!byWater) return { ok: false, why: 'Start a pier at the water’s edge' };
    if (!G.clear(c.x, c.y)) return { ok: false, why: 'Something stands in the way' };
    return { ok: true };
  }
  if (onLand) { var landN = component(d, J).filter(function (q) { return q.land; }).length; if (landN >= 2) return { ok: false, why: 'A pier reaches only two pieces inland' }; if (!G.clear(c.x, c.y)) return { ok: false, why: 'Something stands in the way' }; return { ok: true }; }
  var v = DIRS[N[0].side], ex = c.x + v[0] * M / 2, ey = c.y + v[1] * M / 2;
  if (!G.shallow(c.x, c.y) && !G.shallow(ex, ey) && !G.land(ex, ey)) return { ok: false, why: 'Too deep for a pier' };
  if (!G.clear(c.x, c.y)) return { ok: false, why: 'Something stands in the way' };
  return { ok: true };
}
function canHead(d, mx, my, G) {           // the yard: at a run's end, its far edge over water
  if (d.m[key(mx, my)]) return { ok: false, why: 'A pier stands here' };
  var N = neighbours(d, mx, my); if (N.length !== 1 || N[0].m.k === 'head') return { ok: false, why: N.length ? 'It would touch another pier' : 'Build it at the end of a pier' };
  if (touching(d, mx, my, N[0].m)) return { ok: false, why: 'Too close to another pier' };
  var side = N[0].side, out = OPP[side], v = DIRS[out], c = { x: (mx + 0.5) * M, y: (my + 0.5) * M }, ex = c.x + v[0] * M / 2, ey = c.y + v[1] * M / 2;
  if (G.land(ex, ey) || !G.water(ex, ey)) return { ok: false, why: 'Its far edge must stand over water' };
  var la = v[0] ? [0, 1] : [1, 0]; if (d.m[key(mx + la[0], my + la[1])] || d.m[key(mx - la[0], my - la[1])]) return { ok: false, why: 'It would touch another pier' };
  if (!G.clear(c.x, c.y)) return { ok: false, why: 'Something stands in the way' };
  return { ok: true, o: out };
}
function refresh(d) {                      // what each module is, from what stands round it: a module on land at the pier's end is the landing
  for (var k in d.m) { var m = d.m[k]; if (m.k === 'head') continue; var N = neighbours(d, m.x, m.y); if (m.land && N.length <= 1) { m.k = 'landing'; if (N[0]) m.s = OPP[N[0].side]; } else m.k = 'run'; }
}
function hash(x, y) { var h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); }
function boxOf(mx, my, kind, o) { return box({ x: mx, y: my, k: kind, o: o }); }
function place(d, mx, my, kind, G, o) {    // write it in; the deck's way from the module it joins; a first piece's landing faces away from the water
  var c = { x: (mx + 0.5) * M, y: (my + 0.5) * M }, N = neighbours(d, mx, my), m = { x: mx, y: my, k: kind === 'head' ? 'head' : 'run', land: !!G.land(c.x, c.y), v: VAR[Math.floor(hash(mx, my) * VAR.length)] };
  if (kind === 'head') m.o = o; if (N[0]) m.a = N[0].side === 'e' || N[0].side === 'w' ? 'ew' : 'ns';
  if (!N.length) { var best = 'n', bs = -1, s; for (s in DIRS) { var n0 = 0, i; for (i = 1; i <= 2; i++) if (G.land(c.x + DIRS[s][0] * M * i, c.y + DIRS[s][1] * M * i)) n0++; if (n0 > bs) { bs = n0; best = s; } } m.s = best; m.a = best === 'e' || best === 'w' ? 'ew' : 'ns'; }
  d.m[key(mx, my)] = m; refresh(d); return m;
}
function canRemove(d, m) {                 // a pier comes down from its far ends, its beach last, so what is left is always one pier joined to the land: '' or why not
  if (neighbours(d, m.x, m.y).length > 1) return 'Take it down from its end';
  if (m.land) { var c = component(d, m), lands = c.filter(function (q) { return q.land; }).length; if (c.length > 1 && lands <= 1) return 'Take it down from the sea end first'; }
  return '';
}
function remove(d, m) { var nets = 0; delete d.m[key(m.x, m.y)]; for (var nk in d.n) if (nk.indexOf(key(m.x, m.y) + '|') === 0) { delete d.n[nk]; nets++; } refresh(d); return nets; }   /* (how many nets went with it) */
function netsCovered(d, mx, my) {            // the nets a new module would stand on: those hung on the side it comes to
  var out = []; for (var s in DIRS) { var o = d.m[key(mx + DIRS[s][0], my + DIRS[s][1])]; if (o && d.n[key(o.x, o.y) + '|' + OPP[s]]) out.push(key(o.x, o.y) + '|' + OPP[s]); } return out; }
function edge(m, side) { var b = box(m), c = mid(m); return side === 'n' ? { x: c.x, y: b[1] } : side === 's' ? { x: c.x, y: b[3] } : side === 'e' ? { x: b[2], y: c.y } : { x: b[0], y: c.y }; }
function footOf(m, side) { var e = edge(m, side), v = DIRS[side]; return { x: e.x + v[0] * 22, y: e.y + v[1] * 22 }; }
function netAt(d, x, y, G) {               // the side a net would hang on, pointed at from the deck or the water: { m, side, ok, why } or null
  var best = null, bd = 40; for (var k in d.m) { var m = d.m[k]; for (var s in DIRS) { if (near(d, m, s)) continue; var e = edge(m, s), q = Math.hypot(e.x - x, e.y - y); if (q < bd) { bd = q; best = { m: m, side: s }; } } }
  if (!best) return null; var M0 = best.m, S = best.side, ft = footOf(M0, S), nk = key(M0.x, M0.y) + '|' + S; best.key = nk; best.ok = false;
  if (M0.k === 'landing') { best.why = 'Not on a landing'; return best; }
  if (M0.k === 'head' && S === M0.o) { best.why = 'Not over the yard’s rail'; return best; }
  if (d.n[nk]) { best.why = 'A net hangs here'; return best; }
  if (G.land(ft.x, ft.y) || !(G.water(ft.x, ft.y) || G.shallow(ft.x, ft.y))) { best.why = 'A net hangs over water'; return best; }
  best.ok = true; return best;
}
function netNear(d, x, y, r) {             // a net whose foot is within r of a swimmer or wader
  var best = null, bd = r; for (var nk in d.n) { var p = nk.split('|'), m = d.m[p[0]]; if (!m) continue; var f = footOf(m, p[1]), q = Math.hypot(f.x - x, f.y - y); if (q < bd) { bd = q; best = { m: m, side: p[1], key: nk }; } } return best;
}
function climbTo(n) { var e = edge(n.m, n.side), v = DIRS[n.side]; return { x: e.x - v[0] * 14, y: e.y - v[1] * 14 }; }
function next(d, a, b) {                   // the next module on the way along a pier from a to b, or null (the same one, or not joined)
  if (a === b) return null; var from = {}, list = [b], ka = key(a.x, a.y), kb = key(b.x, b.y), i = 0; from[kb] = kb;
  while (i < list.length) { var q = list[i++], kq = key(q.x, q.y); if (kq === ka) return d.m[from[ka]]; neighbours(d, q.x, q.y).forEach(function (n) { var k = key(n.m.x, n.m.y); if (from[k] == null) { from[k] = kq; list.push(n.m); } }); }
  return null;
}
function landingOf(d, m) { var c = component(d, m), i, best = null, bd = 1e9; for (i = 0; i < c.length; i++) if (c[i].k === 'landing') { var q = Math.abs(c[i].x - m.x) + Math.abs(c[i].y - m.y); if (q < bd) { bd = q; best = c[i]; } } return best; }
function liftAt(m, x, y, deckLift) {       // a landing rises from the sand to the deck, the rest is the deck
  if (m.k !== 'landing') return deckLift; var c = mid(m), v = DIRS[m.s || 'n'], t = 0.5 - ((x - c.x) * v[0] + (y - c.y) * v[1]) / M; return Math.max(0, Math.min(1, t)) * deckLift;
}
function drawList(d, m) {                  // the pieces of a module, in order, with where they anchor: [{ n, x, y }]
  var c = mid(m), out = [], open = function (s) { return !near(d, m, s); };
  if (m.k === 'landing') { out.push({ n: 'landing_' + (m.s || 'n'), x: c.x, y: c.y }); return out; }
  if (m.k === 'head') { var b = box(m); out.push({ n: m.o === 'e' || m.o === 'w' ? 'wall_h2' : 'wall_h3', x: c.x, y: b[3] }); out.push({ n: 'head_' + m.o, x: c.x, y: c.y }); return out; }
  if (open('s')) out.push({ n: 'wall_m', x: c.x, y: c.y + 32 });
  var way = m.a || 'ew', v = m.v || 1; if (v === 5 && !(way === 'ew' ? open('s') : open('e'))) v = 1;
  out.push({ n: 'deck_' + way + '_' + v, x: c.x, y: c.y });
  ['n', 'e', 's', 'w'].forEach(function (s) { if (open(s)) out.push({ n: 'kerb_' + s, x: c.x, y: c.y }); });
  return out;
}
return { M: M, DIRS: DIRS, OPP: OPP, key: key, fresh: fresh, mid: mid, box: box, at: at, any: any, near: near, neighbours: neighbours, canRun: canRun, canHead: canHead, place: place, refresh: refresh, canRemove: canRemove, remove: remove, netsCovered: netsCovered, boxOf: boxOf, edge: edge, footOf: footOf, netAt: netAt, netNear: netNear, climbTo: climbTo, next: next, landingOf: landingOf, liftAt: liftAt, drawList: drawList, component: component };
})();
if (typeof module !== 'undefined') module.exports = Pier;
