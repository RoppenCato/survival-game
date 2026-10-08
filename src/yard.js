/* The yard and the vessels: the parts a hull is laid from, the plans that say when a hull is sound, and the drawing of
   the vessel that comes out of it. Shared by the game (the Shipyard behind the shipwright's bench) and the Sea Editor
   (where a vessel is laid for free and sailed). A yard is { plan, cells: [{ id, i, j }] }; a vessel is { kind, parts,
   x, y, h, hw, hh, seat } once fit() has measured it. Coordinates on the water: CW units a cell along the hull, CH across. */
var Yard = (function () {
var T = 32, TS = 24, K = 0.75;
  var ALL_PARTS = [
    { id: 'log', plan: 'raft', name: 'Log', cost: { wood: 2 }, w: 2, layer: 'hull', text: 'A log for the hull. Logs lie side by side, any shape, as long as they touch.' },
    { id: 'lash', plan: 'raft', name: 'Rope lashing', cost: { fiber: 2 }, w: 1, layer: 'bind', on: 'hull', text: 'Rope across a log. Every log needs one.' },
    { id: 'plank', plan: 'raft', name: 'Deck plank', cost: { wood: 1 }, w: 1, layer: 'deck', on: 'hull', text: 'A plank over the logs: a drier deck.' },
    { id: 'keel', plan: ['boat', 'karve'], name: 'Keel', cost: { wood: 2, copper: 1 }, costs: { karve: { wood: 2, ironBar: 1 } }, w: 1, layer: 'hull', text: 'The spine of the boat: a straight run of three to nine. The bow and the stern are shaped on its ends.' },
    { id: 'strake', plan: ['boat', 'karve'], name: 'Strake', cost: { wood: 1, copper: 1 }, costs: { karve: { wood: 1, ironBar: 1 } }, w: 1, layer: 'hull', text: 'A plank of the side, nailed on. Lay strakes beside the keel to make the boat wider.' },
    { id: 'thwart', plan: ['boat', 'karve'], name: 'Rowing seat', cost: { wood: 1 }, w: 1, layer: 'deck', on: 'hull', text: 'A seat with an oar each side. The first is yours; more need hirdmen to row.' },
    { id: 'mast', plan: 'karve', name: 'Mast', cost: { wood: 5, fiber: 4 }, w: 1, layer: 'deck', on: 'hull', text: 'A tall pine stepped on the keel amidships. The sail hangs from its yard.' },
    { id: 'sail', plan: 'karve', name: 'Sail', cost: { fiber: 18 }, w: 1, layer: 'fit', on: 'deck', text: 'A square sail of woven cloth, striped. It goes on the mast. A wind from behind is speed for nothing.' },
    { id: 'rudder', plan: 'karve', name: 'Steering oar', cost: { wood: 3, ironBar: 1 }, w: 1, layer: 'fit', on: 'hull', text: 'The side rudder, bound at the stern on the right-hand side. You stand by it and steer.' }
  ];
  function inPlan(p, plan) { return Array.isArray(p.plan) ? p.plan.indexOf(plan) >= 0 : p.plan === plan; }
  function costFor(pt, plan) { return pt.costs && pt.costs[plan] ? pt.costs[plan] : pt.cost; }       // a part shared by two plans can cost differently in each (the karve's nails are iron)
  function partsFor(plan) { return ALL_PARTS.filter(function (p) { return inPlan(p, plan); }).map(function (p) { var o = {}, k; for (k in p) o[k] = p[k]; o.cost = costFor(p, plan); return o; }); }
  var YARD_PLANS = [['raft', 'Raft'], ['boat', 'Boat'], ['karve', 'Karve']];
  var LAYERS = ['hull', 'bind', 'deck', 'fit'];
  var PLANS = {
    raft: { name: 'Raft', checks: [
      function (y) { if (yardParts(y, 'log').length < 3) return 'Lay at least three logs'; return ''; },
      function (y) { if (!yardConnected(y)) return 'Every log must touch another log'; return ''; },
      function (y) { if (yardParts(y, 'log').length > 8) return 'Eight logs is as much as rope will hold'; return ''; },
      function (y) { var lashes = yardParts(y, 'lash'), bad = yardParts(y, 'log').some(function (p) { return !lashes.some(function (l) { return l.j === p.j && l.i >= p.i && l.i < p.i + 2; }); }); if (bad) return 'A rope lashing on every log'; return ''; }
    ] },
    boat: { name: 'Boat', checks: [
      function (y) { if (yardParts(y, 'keel').length < 3) return 'Lay a keel: at least three keel pieces in a row'; return ''; },
      function (y) { var k = yardParts(y, 'keel'), js = {}; k.forEach(function (p) { js[p.j] = 1; }); if (Object.keys(js).length > 1) return 'The keel must lie in one straight row'; var is = k.map(function (p) { return p.i; }).sort(function (a, b) { return a - b; }); for (var q = 1; q < is.length; q++) if (is[q] !== is[q - 1] + 1) return 'The keel must be one unbroken run'; return ''; },
      function (y) { if (yardParts(y, 'keel').length > 9) return 'Nine keel pieces is a long boat already'; return ''; },
      function (y) { var k = yardParts(y, 'keel'), st = yardParts(y, 'strake'); if (!k.length) return ''; var j0 = k[0].j, i0 = Math.min.apply(null, k.map(function (p) { return p.i; })), i1 = Math.max.apply(null, k.map(function (p) { return p.i; }));
        for (var q = 0; q < st.length; q++) { var p = st[q]; if (p.i < i0 || p.i > i1) return 'A strake cannot reach past the ends of the keel'; if (Math.abs(p.j - j0) > 2) return 'The sides can be at most two strakes wide'; }
        var hull = k.concat(st), ok = st.every(function (p) { return hull.some(function (h) { return h !== p && Math.abs(h.i - p.i) + Math.abs(h.j - p.j) === 1 && Math.abs(h.j - j0) < Math.abs(p.j - j0) + (h.j === p.j ? 1 : 0); }); }); if (!ok) return 'A strake must lie against the keel or a strake nearer the keel'; return ''; },
      function (y) { if (!yardParts(y, 'thwart').length) return 'A rowing seat, at least one'; return ''; }
    ] },
    karve: { name: 'Karve', checks: [                     // the first ship: a longer keel, a mast on the keel amidships, a sail on the mast, a steering oar at the stern, seats for the rowers (2026-10-08)
      function (y) { if (yardParts(y, 'keel').length < 5) return 'Lay a keel: at least five keel pieces in a row'; return ''; },
      function (y) { var k = yardParts(y, 'keel'), js = {}; k.forEach(function (p) { js[p.j] = 1; }); if (Object.keys(js).length > 1) return 'The keel must lie in one straight row'; var is = k.map(function (p) { return p.i; }).sort(function (a, b) { return a - b; }); for (var q = 1; q < is.length; q++) if (is[q] !== is[q - 1] + 1) return 'The keel must be one unbroken run'; return ''; },
      function (y) { if (yardParts(y, 'keel').length > 9) return 'Nine keel pieces is as long as the yard'; return ''; },
      function (y) { var k = yardParts(y, 'keel'), st = yardParts(y, 'strake'); if (!k.length) return ''; var j0 = k[0].j, i0 = Math.min.apply(null, k.map(function (p) { return p.i; })), i1 = Math.max.apply(null, k.map(function (p) { return p.i; }));
        for (var q = 0; q < st.length; q++) { var p = st[q]; if (p.i < i0 || p.i > i1) return 'A strake cannot reach past the ends of the keel'; if (Math.abs(p.j - j0) > 2) return 'The sides can be at most two strakes wide'; }
        var hull = k.concat(st), ok = st.every(function (p) { return hull.some(function (h) { return h !== p && Math.abs(h.i - p.i) + Math.abs(h.j - p.j) === 1 && Math.abs(h.j - j0) < Math.abs(p.j - j0) + (h.j === p.j ? 1 : 0); }); }); if (!ok) return 'A strake must lie against the keel or a strake nearer the keel'; return ''; },
      function (y) { if (yardParts(y, 'thwart').length < 2) return 'Rowing seats, two at least'; return ''; },
      function (y) { var m = yardParts(y, 'mast'), k = keelSpan(y); if (m.length !== 1) return m.length ? 'One mast is enough' : 'Step a mast on the keel, amidships'; if (!k || m[0].j !== k.j || Math.abs(m[0].i - (k.i0 + k.i1) / 2) > 1) return 'The mast stands on the keel, amidships'; return ''; },
      function (y) { var sl = yardParts(y, 'sail'), m = yardParts(y, 'mast'); if (sl.length !== 1) return sl.length ? 'One sail' : 'A sail on the mast'; if (!m.length || sl[0].i !== m[0].i || sl[0].j !== m[0].j) return 'The sail goes on the mast'; return ''; },
      function (y) { var r = yardParts(y, 'rudder'), k = keelSpan(y); if (r.length !== 1) return r.length ? 'One steering oar' : 'A steering oar at the stern'; if (!k || r[0].j !== k.j || r[0].i !== k.i0) return 'The steering oar is bound at the stern: the left end of the keel'; return ''; }
    ] }
  };
  function keelSpan(y) { var k = yardParts(y, 'keel'); if (!k.length) return null; var is = k.map(function (p) { return p.i; }); return { j: k[0].j, i0: Math.min.apply(null, is), i1: Math.max.apply(null, is) }; }
  function yardConnected(y) {              // every log reaches every other through touching logs (free shapes, one hull)
    var logs = yardParts(y, 'log'); if (logs.length < 2) return true;
    function touch(a, b) { if (a.j === b.j) return Math.abs(a.i - b.i) <= 2; if (Math.abs(a.j - b.j) === 1) return a.i < b.i + 2 && b.i < a.i + 2; return false; }
    var seenL = [logs[0]], grew = true;
    while (grew) { grew = false; logs.forEach(function (l) { if (seenL.indexOf(l) >= 0) return; if (seenL.some(function (q) { return touch(l, q); })) { seenL.push(l); grew = true; } }); }
    return seenL.length === logs.length;
  }
  function yardParts(y, id) { return y.cells.filter(function (p) { return p.id === id; }); }
  function yardAt(y, i, j, layer) { for (var k = 0; k < y.cells.length; k++) { var p = y.cells[k], pt = partOf(p.id); if (pt.layer === layer && j === p.j && i >= p.i && i < p.i + pt.w) return k; } return -1; }
  function partOf(id) { for (var k = 0; k < ALL_PARTS.length; k++) if (ALL_PARTS[k].id === id) return ALL_PARTS[k]; return null; }
  function yardCheck(y) { var cs = PLANS[y.plan].checks; for (var k = 0; k < cs.length; k++) { var why = cs[k](y); if (why) return why; } return ''; }

  function drawYardPart(c, pt, x, y, s) {              // a part lying in its cell(s): x, y is the cell's top left on screen
    c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round'; var k;
    if (pt.id === 'log') { ink(c, [[3, 6], [2 * T - 6, 5.5], [2 * T - 6, TS - 5.5], [3, TS - 6]], '#7a5a40', { wob: 0.8, seed: 3, lw: 0.9, heavy: 1.8 }); for (k = 0; k < 3; k++) stroke(c, [[6 + k * 3, 8 + k * 3.2 + (k % 2) * 1.5], [2 * T - 12 - k * 5, 8.5 + k * 3.2 + (k % 2) * 1.5]], INK.faint, 0.6); stroke(c, [[5, 7.2], [2 * T - 9, 7]], INK.lit, 0.9); logEnd(c, 2 * T - 6, TS / 2, 2.6, (TS - 11) / 2, '#c9ab7a'); c.fillStyle = INK.faint; c.beginPath(); c.ellipse(14, TS / 2 + 2, 1.8, 1.1, 0, 0, 7); c.fill(); }
    else if (pt.id === 'lash') { for (k = 0; k < 5; k++) { var yy = 2 + k * (TS - 4) / 4.5; stroke(c, [[T / 2 - 2.2, yy], [T / 2 + 2.2, yy + 2.6]], INK.line, 2.6); stroke(c, [[T / 2 - 2.2, yy], [T / 2 + 2.2, yy + 2.6]], COL.rope, 1.6); } stroke(c, [[T / 2, 1], [T / 2, TS - 1]], INK.faint, 0.5); }
    else if (pt.id === 'plank') { ink(c, rect(3, TS / 2 - 3.5, T - 6, 7), COL.deck, { wob: 0.5, seed: 5, lw: 0.8, heavy: 1.4 }); stroke(c, [[6, TS / 2 + 0.3], [T - 6, TS / 2 - 0.2]], INK.faint, 0.5); c.fillStyle = INK.line; c.globalAlpha = 0.5; c.fillRect(5.5, TS / 2 - 0.5, 1, 1); c.fillRect(T - 6.5, TS / 2 - 0.5, 1, 1); c.globalAlpha = 1; }
    else if (pt.id === 'keel') { ink(c, [[1, TS / 2 - 4], [T - 1, TS / 2 - 4.4], [T - 1, TS / 2 + 4.4], [1, TS / 2 + 4]], mix(COL.hull, '#000000', 0.15), { wob: 0.5, seed: 7, lw: 0.9, heavy: 1.8 }); stroke(c, [[3, TS / 2 - 1.8], [T - 3, TS / 2 - 2]], INK.lit, 0.9); stroke(c, [[4, TS / 2 + 1.5], [T - 4, TS / 2 + 1.2]], INK.faint, 0.5); }
    else if (pt.id === 'strake') { ink(c, rect(1, TS / 2 - 3.6, T - 2, 7.2), COL.deck, { wob: 0.5, seed: 9, lw: 0.8, heavy: 1.5 }); stroke(c, [[3, TS / 2 - 1.6], [T - 3, TS / 2 - 1.8]], INK.lit, 0.8); [6, T - 6].forEach(function (nx) { c.fillStyle = COL.iron; c.beginPath(); c.arc(nx, TS / 2 + 0.6, 1.1, 0, 7); c.fill(); c.strokeStyle = INK.line; c.lineWidth = 0.5; c.stroke(); }); }
    else if (pt.id === 'thwart') { ink(c, rect(4, 3, T - 8, 5), COL.deck, { wob: 0.4, seed: 11, lw: 0.8, heavy: 1.3 }); stroke(c, [[6, 7], [2, TS - 3]], INK.line, 3.2); stroke(c, [[6, 7], [2, TS - 3]], mix(COL.deck, '#000000', 0.15), 1.8); stroke(c, [[T - 6, 7], [T - 2, TS - 3]], INK.line, 3.2); stroke(c, [[T - 6, 7], [T - 2, TS - 3]], mix(COL.deck, '#000000', 0.15), 1.8); }
    else if (pt.id === 'mast') { ink(c, [[2, TS / 2 - 2.6], [T - 6, TS / 2 - 2.2], [T - 6, TS / 2 + 2.2], [2, TS / 2 + 2.6]], mix(COL.hull, '#ffffff', 0.08), { wob: 0.4, seed: 13, lw: 0.8, heavy: 1.5 }); stroke(c, [[5, TS / 2 - 0.8], [T - 9, TS / 2 - 1]], INK.lit, 0.7); c.fillStyle = COL.iron; c.beginPath(); c.arc(T - 6, TS / 2, 2.6, 0, 7); c.fill(); c.strokeStyle = INK.line; c.lineWidth = 0.7; c.stroke(); }   // the mast lying ready, its iron-bound head
    else if (pt.id === 'sail') { ink(c, rect(3, 4, T - 6, TS - 8), COL.sail, { wob: 0.4, seed: 17, lw: 0.8, heavy: 1.3 }); c.fillStyle = COL.trim; c.globalAlpha = 0.85; [7, 15, 23].forEach(function (sx) { c.fillRect(sx, 5, 3.4, TS - 10); }); c.globalAlpha = 1; [10, T - 10].forEach(function (tx) { stroke(c, [[tx, 3], [tx, TS - 3]], INK.line, 2.2); stroke(c, [[tx, 3], [tx, TS - 3]], COL.rope, 1.2); }); }   // the sail folded, tied with two ropes
    else if (pt.id === 'rudder') { stroke(c, [[4, TS - 3], [T - 9, 4]], INK.line, 4); stroke(c, [[4, TS - 3], [T - 9, 4]], mix(COL.deck, '#000000', 0.1), 2.2); c.save(); c.translate(7, TS - 6); c.rotate(0.95); ink(c, [[-3.6, -8], [3.6, -8], [4.2, 7], [-4.2, 7]], mix(COL.deck, '#000000', 0.05), { wob: 0.4, seed: 19, lw: 0.8, heavy: 1.2 }); c.restore(); stroke(c, [[T - 9, 4], [T - 3, 8]], INK.line, 3); stroke(c, [[T - 9, 4], [T - 3, 8]], COL.deck, 1.6); }   // the steering oar: a broad blade and the tiller
    else if (pt.id === 'oar') { stroke(c, [[5, TS - 4], [T - 8, 5]], INK.line, 4); stroke(c, [[5, TS - 4], [T - 8, 5]], mix(COL.deck, '#000000', 0.1), 2.2); c.save(); c.translate(T - 7, 6); c.rotate(0.8); ink(c, [[-3.2, -5.5], [3.2, -5.5], [3.2, 5.5], [-3.2, 5.5]], mix(COL.deck, '#000000', 0.05), { wob: 0.6, seed: 13, lw: 0.7, heavy: 1.2 }); c.restore(); }
    c.restore();
  }

  var CW = 27, CH = 7.6;                   // a yard cell on the water: how long and how wide a log is
  function hullCells(parts) { return (parts || []).filter(function (p) { return partOf(p.id) && partOf(p.id).layer === 'hull'; }); }
  function fitVessel(raft) {                     // from its parts: how big the hull is (for the water test) and where you sit
    if (!raft) return; var parts = raft.parts && raft.parts.length ? raft.parts : RAFT_DEFAULT, hull = hullCells(parts), minI = 1e9, maxI = -1e9, minJ = 1e9, maxJ = -1e9;
    hull.forEach(function (p) { var w = partOf(p.id).w; minI = Math.min(minI, p.i); maxI = Math.max(maxI, p.i + w); minJ = Math.min(minJ, p.j); maxJ = Math.max(maxJ, p.j + 1); });
    if (raft.kind === 'boat' || raft.kind === 'karve') {
      var pr = boatProfile(parts); raft.hw = pr.L + 2; raft.hh = pr.Wmax + 2;
      raft.seats = parts.filter(function (p) { return p.id === 'thwart'; }).map(function (p) { return (p.i + 0.5 - pr.cx) * CW; }).sort(function (a, b) { return a - b; });   // the rowing seats along the keel (bow at +)
      raft.rowers = raft.seats.length * 2;                                                                   // two to a seat
      var mast = parts.filter(function (p) { return p.id === 'mast'; })[0]; raft.mastX = mast ? (mast.i + 0.5 - pr.cx) * CW : null;
      if (raft.kind === 'karve') { raft.sail = !!parts.some(function (p) { return p.id === 'sail'; }); raft.seat = -raft.hw * 0.62; }   // on the karve you stand at the stern by the steering oar
      else raft.seat = (raft.crew || 0) > 0 ? raft.hw * 0.5 : -raft.hw * 0.28;                                // alone you sit aft and paddle; with rowers you stand halfway to the bow
    }
    else { raft.hw = (maxI - minI) * CW / 2 + 4; raft.hh = (maxJ - minJ) * CH / 2 + 4; raft.seat = 0; }
  }

  var RAFT_DEFAULT = [{ id: 'log', i: 0, j: 0 }, { id: 'log', i: 0, j: 1 }, { id: 'log', i: 0, j: 2 }, { id: 'log', i: 0, j: 3 }, { id: 'log', i: 0, j: 4 }, { id: 'lash', i: 0, j: 0 }, { id: 'lash', i: 1, j: 0 }, { id: 'lash', i: 0, j: 4 }, { id: 'lash', i: 1, j: 4 }];
  function drawOar(c, x, y, ang) { c.save(); c.translate(x, y); c.rotate(ang); c.strokeStyle = '#2e1a10'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(-9, 0); c.lineTo(9, 0); c.stroke(); c.strokeStyle = '#8a5a3a'; c.lineWidth = 1.8; c.stroke(); c.fillStyle = '#c99a66'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1; c.beginPath(); c.ellipse(9, 0, 4, 2.4, 0, 0, 7); c.fill(); c.stroke(); c.restore(); }
  var LINE = '#231a16', COL = { hull: '#5e4430', deck: '#9a7c5c', trim: '#8a3a34', rope: '#c9b48a', iron: '#4a4a50', sail: '#e9dfc4' };   // the earth palette (docs/art-direction.md, 2026-10-07)
  /* the ink toolkit (as in build.js): a fill with grain and a cool shade toward the lower right, a lit edge, a thin hand-made line
     all round and the heavy line on the shadow side */
  var INK = { line: '#231a16', lit: 'rgba(255,238,200,0.4)', soft: 'rgba(35,26,22,0.55)', faint: 'rgba(35,26,22,0.32)', grain: 0.2 }, grainCv = null;
  function mkCv(w, h) { if (typeof document !== 'undefined') { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; } if (global.__mk) return global.__mk(w, h); return require('@napi-rs/canvas').createCanvas(w, h); }
  function grainPat(c) {
    if (!grainCv) { grainCv = mkCv(64, 64); var g = grainCv.getContext('2d'), i, Rn = 0.41; for (i = 0; i < 900; i++) { Rn = (Rn * 9301 + 49297) % 233280; var x = Rn / 233280 * 64; Rn = (Rn * 9301 + 49297) % 233280; var y = Rn / 233280 * 64; Rn = (Rn * 9301 + 49297) % 233280; var d = Rn / 233280; g.fillStyle = d < 0.55 ? 'rgba(20,14,10,' + (0.25 + d * 0.5).toFixed(2) + ')' : 'rgba(255,245,225,' + (0.2 + (1 - d) * 0.6).toFixed(2) + ')'; g.fillRect(x, y, 1 + (d < 0.2 ? 1 : 0), 1); } }
    if (!c.__inkPat) c.__inkPat = c.createPattern(grainCv, 'repeat'); return c.__inkPat;
  }
  function hs(i, j) { var v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); }
  function mix(a, b, t) { function hx(q) { return [parseInt(q.slice(1, 3), 16), parseInt(q.slice(3, 5), 16), parseInt(q.slice(5, 7), 16)]; } var p = hx(a), q = hx(b), o = '#', i; for (i = 0; i < 3; i++) { var v = Math.round(p[i] + (q[i] - p[i]) * t).toString(16); o += v.length < 2 ? '0' + v : v; } return o; }
  function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
  function wob(pts, amp, seed) { if (!amp) return pts; var out = [], n = pts.length, i; for (i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n], ex = q[0] - p[0], ey = q[1] - p[1], L = Math.hypot(ex, ey) || 1, k = (hs(seed, i) - 0.5) * amp; out.push(p); if (L > 6) out.push([p[0] + ex * 0.5 - ey / L * k, p[1] + ey * 0.5 + ex / L * k]); } return out; }
  function path(c, d) { var i; c.beginPath(); c.moveTo(d[0][0], d[0][1]); for (i = 1; i < d.length; i++) c.lineTo(d[i][0], d[i][1]); c.closePath(); }
  function heavy(c, d, w) {
    var n = d.length, area = 0, i; if (n < 3) return;
    for (i = 0; i < n; i++) { var p = d[i], q = d[(i + 1) % n]; area += p[0] * q[1] - q[0] * p[1]; }
    var sgn = area > 0 ? 1 : -1, lx = -0.6, ly = -0.8;
    c.save(); c.lineCap = 'round'; c.lineWidth = w; c.strokeStyle = INK.line;
    for (i = 0; i < n; i++) { var a = d[i], b = d[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey) || 1, nx = ey / L * sgn, ny = -ex / L * sgn, k = Math.max(0, Math.min(1, (-(nx * lx + ny * ly) + 0.15) / 0.9)); if (k < 0.04) continue; c.globalAlpha = k * k; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    c.restore();
  }
  function ink(c, pts, fill, o) {
    o = o || {}; var d = wob(pts, o.wob == null ? 0.8 : o.wob, o.seed || 1), i, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (i = 0; i < d.length; i++) { x0 = Math.min(x0, d[i][0]); y0 = Math.min(y0, d[i][1]); x1 = Math.max(x1, d[i][0]); y1 = Math.max(y1, d[i][1]); }
    c.save(); path(c, d); c.fillStyle = fill; c.fill(); path(c, d); c.clip();
    c.globalAlpha = INK.grain; c.fillStyle = grainPat(c); c.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (!o.flat) { c.globalAlpha = o.shade == null ? 0.16 : o.shade; var g = c.createLinearGradient(x0, y0, x0 + (x1 - x0) * 0.7, y1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'hsla(222,40%,15%,1)'); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0); }
    c.globalAlpha = 1;
    if (!o.flat && o.lit !== false) { c.translate(-0.6, -0.6); path(c, d); c.lineWidth = 1.1; c.strokeStyle = INK.lit; c.stroke(); }
    c.restore();
    if (!o.noLine) { path(c, d); c.lineJoin = 'round'; c.lineWidth = o.lw || 0.8; c.strokeStyle = INK.line; c.stroke(); heavy(c, d, o.heavy || 1.8); }
    return d;
  }
  function inkPath(c, fill, o, trace) {       // the same finish round a path drawn by trace(): the hull outlines
    o = o || {}; c.save(); c.beginPath(); trace(); c.fillStyle = fill; c.fill(); c.beginPath(); trace(); c.clip();
    var b = o.box || [-200, -200, 400, 400]; c.globalAlpha = INK.grain; c.fillStyle = grainPat(c); c.fillRect(b[0], b[1], b[2], b[3]);
    if (!o.flat) { c.globalAlpha = o.shade == null ? 0.18 : o.shade; var g = c.createLinearGradient(b[0], b[1], b[0] + b[2] * 0.7, b[1] + b[3]); g.addColorStop(0, 'rgba(255,240,200,0.5)'); g.addColorStop(0.45, 'rgba(0,0,0,0)'); g.addColorStop(1, 'hsla(222,40%,15%,1)'); c.fillStyle = g; c.fillRect(b[0], b[1], b[2], b[3]); }
    c.globalAlpha = 1; c.restore();
    if (!o.noLine) { c.beginPath(); trace(); c.lineJoin = 'round'; c.lineWidth = o.lw || 1.1; c.strokeStyle = INK.line; c.stroke(); c.save(); c.translate(0.9, 1.1); c.beginPath(); trace(); c.globalAlpha = 0.45; c.lineWidth = (o.lw || 1.1) * 1.6; c.stroke(); c.restore(); }   // the heavy side: the line laid again a little down and right
  }
  function stroke(c, pts, col, w, a) { var i; c.save(); c.globalAlpha = a == null ? 1 : a; c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); c.restore(); }
  function logEnd(c, x, y, rx, ry, col) {     // the cut end of a log: pale wood with rings
    c.fillStyle = '#c9ab7a'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); c.strokeStyle = INK.faint; c.lineWidth = 0.5; c.beginPath(); c.ellipse(x, y, rx * 0.6, ry * 0.6, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(x, y, rx * 0.25, ry * 0.25, 0, 0, 7); c.stroke(); c.strokeStyle = INK.line; c.lineWidth = 0.7; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.stroke();
  }
  function shadeHex(hex, d) { var n = parseInt(hex.substr(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + d)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + d)), b = Math.max(0, Math.min(255, (n & 255) + d)); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }
  function speedOf(v) { return Math.hypot(v.vx || 0, v.vy || 0); }
  // How a vessel handles: the Sea Editor's handling sliders, as numbers per kind. steer 0 is Direct (hold a direction
  // and the hull turns to face it and goes), 1 is Tiller (W drives, S backs, A and D turn). top and accel in units a
  // second, turn in radians a second, glide how long it keeps moving after you let go, grip how firmly it follows its bow.
  var HANDLING = { raft: { steer: 0, top: 54, accel: 40, turn: 1.6, glide: 1.4, grip: 0.5 }, boat: { steer: 1, top: 100, accel: 50, turn: 1.8, glide: 2.2, grip: 0.6 }, karve: { steer: 1, top: 115, accel: 42, turn: 1.3, glide: 3.2, grip: 0.72 } };
  // The wind is a buff only (reward, never punishment): a sail with the wind behind it goes up to (1 + k) times the top speed, and a wind
  // ahead costs nothing. Each rower aboard (v.crew, capped by the seats) adds rowK to the top speed and the acceleration.
  var WIND = { k: 0.5, rowK: 0.07 };
  function wrapA(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
  // One step of sailing: v = { x, y, h, speed, vx, vy }, inp = { ix, iy } (-1..1 each), free(x, y, h) says whether the
  // hull fits there, H the handling. The same physics in the game and the Sea Editor.
  function sail(v, inp, dt, free, H, wind) {
    var ix = inp.ix || 0, iy = inp.iy || 0, want = 0, stuck = !free(v.x, v.y, v.h);
    if (v.speed == null) v.speed = 0;
    var crew = Math.min(v.crew || 0, v.rowers != null ? v.rowers : 99), rowK = 1 + (WIND.rowK || 0) * crew, sailK = 1, fill = 0;
    if (v.sail && wind && wind.k > 0) { fill = Math.max(0, Math.cos(wind.a - v.h)); sailK = 1 + wind.k * fill; }      // the share of the wind that fills the sail
    v.sailFill += ((iy < 0 || (!H.steer && (ix || iy)) ? fill : 0) - (v.sailFill || 0)) * Math.min(1, dt * 2); if (!(v.sailFill > 0)) v.sailFill = 0;   // the sail fills as it is set and the wind comes behind
    v.rud = (v.rud || 0) + (ix - (v.rud || 0)) * Math.min(1, dt * 6);                                                                          // the steering oar follows the tiller
    H = { steer: H.steer, top: H.top * rowK * sailK, accel: H.accel * rowK * (1 + (sailK - 1) * 0.5), turn: H.turn, glide: H.glide, grip: H.grip };
    if (!H.steer) {
      if (ix || iy) {
        var target = Math.atan2(iy, ix), diff = wrapA(target - v.h), stepA = H.turn * dt;
        var nh = Math.abs(diff) <= stepA ? target : v.h + (diff > 0 ? stepA : -stepA);
        if (stuck || free(v.x, v.y, nh)) v.h = nh;
        want = H.top * Math.max(0.25, Math.cos(Math.min(1.4, Math.abs(diff))));   // ease off while the bow swings round
      }
    } else {
      want = iy < 0 ? H.top : (iy > 0 ? -H.top * 0.4 : 0);
      var nh2 = v.h + ix * H.turn * dt * Math.min(1, Math.abs(v.speed) / (H.top * 0.35)) * (v.speed < 0 ? -1 : 1);
      if (stuck || free(v.x, v.y, nh2)) v.h = nh2;
    }
    if (want !== 0) { var up = H.accel * dt; v.speed += Math.max(-up, Math.min(up, want - v.speed)); }
    else v.speed *= Math.exp(-dt / H.glide);
    var tvx = Math.cos(v.h) * v.speed, tvy = Math.sin(v.h) * v.speed, g = Math.min(1, dt * (1 + H.grip * 11));
    v.vx += (tvx - v.vx) * g; v.vy += (tvy - v.vy) * g;
    var nx = v.x + v.vx * dt, ny = v.y + v.vy * dt;
    if (stuck || free(nx, ny, v.h)) { v.x = nx; v.y = ny; }
    else if (free(nx, v.y, v.h)) { v.x = nx; v.vy *= 0.3; v.speed *= 0.9; }
    else if (free(v.x, ny, v.h)) { v.y = ny; v.vx *= 0.3; v.speed *= 0.9; }
    else { v.vx *= 0.2; v.vy *= 0.2; v.speed *= 0.5; }
    v.h = wrapA(v.h);
    return stuck;
  }
  // the water round a hull: a thin line of foam hugging it, and when it moves a wake of ripples trailing from the stern
  function drawWater(c, v, hl, hw, clock, pr) {
    var sp = speedOf(v), mv = Math.min(1, sp / 60), i;
    c.save(); c.translate(v.x, v.y * K);
    if (mv > 0.05) {                                        // the wake: ripples behind, spreading and fading
      var bx = -Math.cos(v.h) * hl, by = -Math.sin(v.h) * hl * K;
      for (i = 0; i < 5; i++) {
        var t = ((clock * 1.4 + i * 0.2) % 1), d = t * 70 * mv, a = (1 - t) * 0.45 * mv, w = hw * K * (0.6 + t * 1.6);
        var px = bx - Math.cos(v.h) * d, py = by - Math.sin(v.h) * d * K;
        c.strokeStyle = 'rgba(235,250,255,' + a.toFixed(2) + ')'; c.lineWidth = 1.2 + (1 - t);
        c.beginPath(); c.ellipse(px, py, 4 + t * 6, w, v.h, 0, 7); c.stroke();
      }
    }
    c.scale(1, K); c.rotate(v.h);
    c.strokeStyle = 'rgba(235,250,255,' + (0.3 + 0.25 * mv).toFixed(2) + ')'; c.lineWidth = 2.2; c.beginPath(); if (pr) shapedPath(c, pr, (hl + 5) / hl, (hw * 1.15 + 3) / hw); else { c.moveTo(-hl - 5, 0); c.quadraticCurveTo(0, -(hw * 1.15 + 3) * 1.9, hl + 5, 0); c.quadraticCurveTo(0, (hw * 1.15 + 3) * 1.9, -hl - 5, 0); } c.stroke();   // foam at the waterline
    c.restore();
  }
  function drawVessel(c, v, clock) {                        // the vessel as it was laid in the yard, on the water
    var bob = Math.sin(clock * 2 + v.x * 0.01) * 0.8, parts = v.parts && v.parts.length ? v.parts : RAFT_DEFAULT;
    if (v.kind === 'boat' || v.kind === 'karve') { drawBoat(c, v, parts, bob, clock); return; }
    var logs = parts.filter(function (p) { return p.id === 'log'; }), minI = 1e9, maxI = -1e9, minJ = 1e9, maxJ = -1e9;
    logs.forEach(function (p) { minI = Math.min(minI, p.i); maxI = Math.max(maxI, p.i + 2); minJ = Math.min(minJ, p.j); maxJ = Math.max(maxJ, p.j + 1); });
    var cx = (minI + maxI) / 2, cy = (minJ + maxJ) / 2, hw = (maxI - minI) / 2 * CW + 4, hh = (maxJ - minJ) / 2 * CH + 4;
    drawWater(c, v, hw, hh * 0.55, clock);
    c.save(); c.translate(v.x, v.y * K + bob);
    c.scale(1, K); c.rotate(v.h);
    c.fillStyle = 'rgba(10,30,50,0.28)'; c.beginPath(); c.ellipse(1, 3, hw + 2, hh + 6, 0, 0, 7); c.fill();
    c.lineJoin = 'round'; c.lineCap = 'round';
    logs.slice().sort(function (p, q) { return p.j - q.j; }).forEach(function (p) {
      var x0 = (p.i - cx) * CW, oy = (p.j + 0.5 - cy) * CH, len = 2 * CW - 2, tone = ((p.i * 7 + p.j * 13) % 5) / 5 - 0.5;
      ink(c, [[x0 + 1, oy - 3.4], [x0 + len - 1, oy - 3.6], [x0 + len - 1, oy + 3.6], [x0 + 1, oy + 3.4]], mix('#7a5a40', tone > 0 ? '#ffffff' : '#000000', Math.abs(tone) * 0.2), { wob: 0.7, seed: p.i * 3 + p.j, lw: 0.8, heavy: 1.6 });
      stroke(c, [[x0 + 4, oy - 1.8], [x0 + len - 6, oy - 2]], INK.lit, 0.8); stroke(c, [[x0 + 6, oy + 1.2], [x0 + len - 8, oy + 1.5]], INK.faint, 0.5);
      logEnd(c, x0 + len, oy, 1.8, 3.2, '#c9ab7a');
    });
    parts.forEach(function (p) {
      var x0 = (p.i + 0.5 - cx) * CW, oy = (p.j + 0.5 - cy) * CH, k;
      if (p.id === 'lash') { for (k = 0; k < 3; k++) { var ly = oy - 3.6 + k * 2.6; stroke(c, [[x0 - 1.6, ly], [x0 + 1.6, ly + 1.8]], INK.line, 2.2); stroke(c, [[x0 - 1.6, ly], [x0 + 1.6, ly + 1.8]], COL.rope, 1.3); } }
      else if (p.id === 'plank') { ink(c, rect(x0 - 10, oy - 2.6, 20, 5.2), COL.deck, { wob: 0.4, seed: p.i + p.j * 5, lw: 0.7, heavy: 1.2 }); stroke(c, [[x0 - 8, oy + 0.2], [x0 + 8, oy - 0.1]], INK.faint, 0.45); }
    });
    drawOar(c, hw - 16, hh - 4, 0.5);
    c.restore();
  }
  // the hull's shape follows the strakes: at every keel column the side is as wide as the strakes laid there, each side on
  // its own, smoothed a little so one strake makes a swell rather than a step; the keel's length sets the length
  var ROW = CH * 0.85 * 0.6;
  function boatProfile(parts) {
    var keel = parts.filter(function (p) { return p.id === 'keel'; }), st = parts.filter(function (p) { return p.id === 'strake'; });
    if (!keel.length) { var hull = hullCells(parts), mi = 1e9, ma = -1e9; hull.forEach(function (p) { mi = Math.min(mi, p.i); ma = Math.max(ma, p.i + 1); }); keel = hull.length ? [{ i: mi, j: hull[0].j }] : [{ i: 0, j: 0 }]; }
    var j0 = keel[0].j, i0 = Math.min.apply(null, keel.map(function (p) { return p.i; })), i1 = Math.max.apply(null, keel.map(function (p) { return p.i; })), n = i1 - i0 + 1, k;
    var top = [], bot = [];
    for (k = 0; k < n; k++) { var nt = 0, nb = 0; st.forEach(function (p) { if (p.i === i0 + k) { if (p.j < j0) nt++; else if (p.j > j0) nb++; } }); top.push(3 + (1 + nt) * ROW * 0.9); bot.push(3 + (1 + nb) * ROW * 0.9); }
    function smooth(w) { var o = []; for (k = 0; k < n; k++) { var a = w[Math.max(0, k - 1)], b2 = w[k], c2 = w[Math.min(n - 1, k + 1)]; o.push((a + 2 * b2 + c2) / 4); } return o; }
    top = smooth(top); bot = smooth(bot);
    var L = n * CW / 2 + 8, cx = (i0 + i1 + 1) / 2, Wmax = Math.max.apply(null, top.concat(bot));
    return { L: L, n: n, cx: cx, top: top, bot: bot, Wmax: Wmax, keelJ: j0 };
  }
  function profW(pr, x, side) {              // the half-width at x along the hull (bow at +L), on one side, 0 at the ends
    var u = (x + pr.L) / (2 * pr.L) * pr.n - 0.5, k = Math.max(0, Math.min(pr.n - 1, Math.floor(u))), t = Math.max(0, Math.min(1, u - k)), arr = side < 0 ? pr.top : pr.bot;
    var w = arr[k] + (arr[Math.min(pr.n - 1, k + 1)] - arr[k]) * t, taper = 1 - Math.pow(Math.abs(x) / pr.L, 3);   // the ends draw in to the stems
    return Math.max(0, w * Math.max(0, taper));
  }
  function shapedPath(c, pr, sx, sw) {       // the hull outline through the profile, scaled along (sx) and across (sw)
    var L = pr.L * sx, pts = [], k, m = pr.n * 2 + 1;
    pts.push([-L, 0]); for (k = 1; k < m; k++) { var x = -L + 2 * L * k / m; pts.push([x, -profW(pr, x / sx, -1) * sw]); } pts.push([L, 0]);
    for (k = m - 1; k >= 1; k--) { var x2 = -L + 2 * L * k / m; pts.push([x2, profW(pr, x2 / sx, 1) * sw]); }
    c.moveTo(pts[0][0], pts[0][1]);
    for (k = 1; k < pts.length - 1; k++) { var mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2; c.quadraticCurveTo(pts[k][0], pts[k][1], mx, my); }
    c.quadraticCurveTo(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1]); c.closePath();
  }
  // a clinker boat in the look of the Sea Editor's ships: the karve without its sail (a mast and sail come later)
  function drawBoat(c, v, parts, bob, clock) {
    var pr = boatProfile(parts), L = pr.L, W = pr.Wmax, sz = Math.max(0.7, Math.min(1.2, L / 60)), col = COL, h = v.h, i;
    var sx = v.x, sy = v.y * K + bob, roll = Math.sin(clock * 1.7 + 1) * 0.02, mv = Math.min(1, speedOf(v) / 60);
    var seats = parts.filter(function (p) { return p.id === 'thwart'; }).map(function (p) { return (p.i + 0.5 - pr.cx) * CW; });
    drawWater(c, v, L, W, clock, pr);
    function inFrame(dy, fn) { c.save(); c.translate(sx, sy + dy); c.scale(1, K); c.rotate(h + roll); fn(); c.restore(); }
    function fillStroke(fill, lw) { c.fillStyle = fill; c.fill(); c.lineWidth = lw || 1.6; c.strokeStyle = LINE; c.lineJoin = 'round'; c.stroke(); }
    var box = [-L - 12, -W - 12, 2 * L + 24, 2 * W + 24];
    c.fillStyle = 'rgba(8,12,40,0.28)'; c.beginPath(); c.ellipse(sx + 2, v.y * K + 5 * sz, L * 0.95, W * 1.05, 0, 0, 7); c.fill();
    inFrame(4 * sz, function () { inkPath(c, shadeHex(col.hull, -30), { box: box, flat: true, lw: 1.2 }, function () { shapedPath(c, pr, 1, 1); }); });   // the hull's depth below the rail
    inFrame(0, function () {
      inkPath(c, col.hull, { box: box, lw: 1.2 }, function () { shapedPath(c, pr, 1, 1); });
      [0.95, 0.9].forEach(function (k, n) { c.beginPath(); shapedPath(c, pr, k, 0.9 - n * 0.12); c.lineWidth = 0.7; c.strokeStyle = INK.faint; c.stroke(); });   // the strakes, overlapping toward the rail
      c.beginPath(); shapedPath(c, pr, 0.92, 0.95); c.lineWidth = 0.9; c.strokeStyle = INK.lit; c.stroke();
      inkPath(c, col.deck, { box: box, lw: 0.9, shade: 0.1 }, function () { shapedPath(c, pr, 0.84, 0.62); });   // the bottom boards
      for (var bi = -2; bi <= 2; bi++) { c.beginPath(); c.moveTo(-L * 0.8, bi * W * 0.12); c.lineTo(L * 0.8, bi * W * 0.12 + 0.3); c.lineWidth = 0.5; c.strokeStyle = INK.faint; c.save(); c.beginPath(); shapedPath(c, pr, 0.84, 0.62); c.clip(); c.beginPath(); c.moveTo(-L * 0.8, bi * W * 0.12); c.lineTo(L * 0.8, bi * W * 0.12 + 0.3); c.stroke(); c.restore(); }
      seats.forEach(function (x, si) { var wt = profW(pr, x, -1) * 0.6, wb = profW(pr, x, 1) * 0.6; ink(c, [[x - 1.4, -wt], [x + 1.4, -wt], [x + 1.4, wb], [x - 1.4, wb]], shadeHex(col.hull, 12), { wob: 0.3, seed: si, lw: 0.7, heavy: 1.1 }); });   // the rowing seats as laid
      if ((v.crew || 0) > 0) seats.forEach(function (x, n) { [-1, 1].forEach(function (sd) {          // an oar each side of every seat, pulling when under way (only with rowers)
        var a = sd * (Math.PI / 2) - Math.sin(clock * (2.6 + mv * 4.5) + n) * 0.55 * mv - 0.2;
        var ox = x, oy = sd * profW(pr, x, sd), len = W * 1.7 + 7 * sz, ex = ox + Math.cos(a) * len, ey = oy + Math.sin(a) * len;
        c.strokeStyle = LINE; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ex, ey); c.stroke();
        c.strokeStyle = shadeHex(col.deck, -10); c.lineWidth = 1.3; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ex, ey); c.stroke();
        c.beginPath(); c.ellipse(ex, ey, 3.2, 1.6, a, 0, 7); fillStroke(shadeHex(col.deck, -10), 0.9);
      }); });
    });
    var fx = Math.cos(h), fy = Math.sin(h) * K;                                                          // the upright stems, curling at bow and stern
    function at(lx, ly) { var cs = Math.cos(h), sn = Math.sin(h); return [sx + lx * cs - ly * sn, sy + (lx * sn + ly * cs) * K]; }
    function curve(p0, p1, p2, w, fill) { c.lineCap = 'round'; c.strokeStyle = LINE; c.lineWidth = w + 2; c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); c.stroke(); c.strokeStyle = fill; c.lineWidth = w; c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); c.stroke(); }
    function stem(lx, dir, hgt) {
      var p = at(lx, 0), tip = [p[0] + fx * dir * 7 * sz, p[1] + fy * dir * 7 * sz - hgt], w = 3.2 * sz, wood = shadeHex(col.hull, -8);
      curve(p, [p[0] - fx * dir * 1.5 * sz, p[1] - hgt * 0.6], tip, w, wood);
      curve(tip, [tip[0] + fx * dir * 3.5 * sz, tip[1] - 3 * sz], [tip[0] + fx * dir * 1.5 * sz, tip[1] + 2.4 * sz], w * 0.55, wood);
    }
    stem(-L * 0.96, -1, 10 * sz); stem(L * 0.96, 1, 11 * sz);
    if (v.kind === 'karve') drawRig(c, v, pr, sz, bob, clock, at, curve);
  }
  // The karve's rig (2026-10-08): the steering oar at the stern on the right-hand side, the mast amidships with its yard, and the
  // square striped sail hanging from the yard: full and bellied toward the bow when the wind is behind (v.sailFill), else furled on the yard.
  function drawRig(c, v, pr, sz, bob, clock, at, curve) {
    var h = v.h, L = pr.L, W = pr.Wmax, col = COL, fx = Math.cos(h), fy = Math.sin(h) * K, k;
    var rx = -L * 0.78, rw = profW(pr, rx, 1), rud = v.rud || 0;                                   // the steering oar: a broad blade in the water aft, the tiller inboard
    var piv = at(rx, rw * 0.95), blade = at(rx - 6 * sz - rud * 2, rw * 0.95 + 7 * sz + rud * 3), till = at(rx + 7 * sz, rw * 0.3);
    c.lineCap = 'round'; c.strokeStyle = LINE; c.lineWidth = 3.4; c.beginPath(); c.moveTo(till[0], till[1]); c.lineTo(piv[0], piv[1]); c.lineTo(blade[0], blade[1]); c.stroke();
    c.strokeStyle = shadeHex(col.deck, -12); c.lineWidth = 1.8; c.stroke();
    c.beginPath(); c.ellipse(blade[0], blade[1], 2.4 * sz, 4.6 * sz, Math.atan2(blade[1] - piv[1], blade[0] - piv[0]) + Math.PI / 2, 0, 7); c.fillStyle = shadeHex(col.deck, -12); c.fill(); c.lineWidth = 1; c.strokeStyle = LINE; c.stroke();
    if (v.mastX == null) return;
    var mx = v.mastX, m = at(mx, 0), mh = (24 + L * 0.14) * sz, yl = W * 1.25 + 7 * sz, fill = v.sailFill || 0, full = fill > 0.12;   // the mast's height, the yard's half length
    var a1 = at(mx, -yl), b1 = at(mx, yl), TA = [a1[0], a1[1] - mh], TB = [b1[0], b1[1] - mh], foot = mh * 0.28, bl = (3 + fill * 9) * sz;
    c.strokeStyle = LINE; c.lineWidth = 2.2 * sz + 1.8; c.beginPath(); c.moveTo(m[0], m[1]); c.lineTo(m[0], m[1] - mh); c.stroke();   // the mast, its foot on the keel
    c.strokeStyle = shadeHex(col.hull, -6); c.lineWidth = 2.2 * sz; c.stroke();
    if (full) {                                                                                         // the sail set: hanging from the yard to the foot, bellied toward the bow
      var TM = [m[0] + fx * bl * 0.35, m[1] - mh + fy * bl * 0.35], BA = [a1[0], a1[1] - foot], BB = [b1[0], b1[1] - foot], BM = [m[0] + fx * bl, m[1] - foot + fy * bl];
      function topAt(s) { return s < 0.5 ? [TA[0] + (TM[0] - TA[0]) * s * 2, TA[1] + (TM[1] - TA[1]) * s * 2] : [TM[0] + (TB[0] - TM[0]) * (s - 0.5) * 2, TM[1] + (TB[1] - TM[1]) * (s - 0.5) * 2]; }
      function botAt(s) { return s < 0.5 ? [BA[0] + (BM[0] - BA[0]) * s * 2, BA[1] + (BM[1] - BA[1]) * s * 2] : [BM[0] + (BB[0] - BM[0]) * (s - 0.5) * 2, BM[1] + (BB[1] - BM[1]) * (s - 0.5) * 2]; }
      function outline() { c.beginPath(); c.moveTo(TA[0], TA[1]); c.lineTo(TM[0], TM[1]); c.lineTo(TB[0], TB[1]); c.lineTo(BB[0], BB[1]); c.lineTo(BM[0], BM[1]); c.lineTo(BA[0], BA[1]); c.closePath(); }
      outline(); c.fillStyle = col.sail; c.fill();
      c.fillStyle = col.trim; for (k = 0; k < 7; k += 2) { var s0 = k / 7, s1 = (k + 1) / 7, mid = s0 < 0.5 && s1 > 0.5, q; c.beginPath(); q = topAt(s0); c.moveTo(q[0], q[1]); if (mid) c.lineTo(TM[0], TM[1]); q = topAt(s1); c.lineTo(q[0], q[1]); q = botAt(s1); c.lineTo(q[0], q[1]); if (mid) c.lineTo(BM[0], BM[1]); q = botAt(s0); c.lineTo(q[0], q[1]); c.closePath(); c.fill(); }   // the stripes
      c.save(); outline(); c.clip(); c.globalAlpha = INK.grain; c.fillStyle = grainPat(c); c.fillRect(Math.min(TA[0], TB[0]) - 20, TA[1] - 20, Math.abs(TB[0] - TA[0]) + 40, mh + 40); c.globalAlpha = 1;
      var sg = c.createLinearGradient(TA[0], 0, TB[0], 0); sg.addColorStop(0, 'rgba(255,250,230,0.18)'); sg.addColorStop(1, 'rgba(40,50,90,0.22)'); c.fillStyle = sg; c.fillRect(Math.min(TA[0], TB[0]) - 20, TA[1] - 20, Math.abs(TB[0] - TA[0]) + 40, mh + 40);   // lit from the left, cool toward the right
      c.strokeStyle = INK.faint; c.lineWidth = 0.6; for (k = 1; k < 4; k++) { var sy0 = k / 4; c.beginPath(); c.moveTo(TA[0] + (BA[0] - TA[0]) * sy0, TA[1] + (BA[1] - TA[1]) * sy0); c.quadraticCurveTo(TM[0] + (BM[0] - TM[0]) * sy0 + fx * 2, TM[1] + (BM[1] - TM[1]) * sy0 + fy * 2, TB[0] + (BB[0] - TB[0]) * sy0, TB[1] + (BB[1] - TB[1]) * sy0); c.stroke(); }   // the folds
      c.restore(); outline(); c.lineWidth = 1.1; c.strokeStyle = LINE; c.lineJoin = 'round'; c.stroke();
      c.strokeStyle = 'rgba(35,26,22,0.6)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(BA[0], BA[1]); c.lineTo(at(mx - 4 * sz, -profW(pr, mx - 4 * sz, -1))[0], at(mx - 4 * sz, -profW(pr, mx - 4 * sz, -1))[1]); c.moveTo(BB[0], BB[1]); c.lineTo(at(mx - 4 * sz, profW(pr, mx - 4 * sz, 1))[0], at(mx - 4 * sz, profW(pr, mx - 4 * sz, 1))[1]); c.stroke();   // the sheets down to the rails
      c.strokeStyle = LINE; c.lineWidth = 1.8 * sz + 1.6; c.beginPath(); c.moveTo(TA[0], TA[1]); c.lineTo(TM[0], TM[1]); c.lineTo(TB[0], TB[1]); c.stroke(); c.strokeStyle = shadeHex(col.hull, -6); c.lineWidth = 1.8 * sz; c.stroke();   // the yard
    } else {                                                                                            // furled: the cloth bundled along the yard and tied
      c.strokeStyle = LINE; c.lineWidth = 1.8 * sz + 1.6; c.beginPath(); c.moveTo(TA[0], TA[1]); c.lineTo(TB[0], TB[1]); c.stroke(); c.strokeStyle = shadeHex(col.hull, -6); c.lineWidth = 1.8 * sz; c.stroke();
      c.strokeStyle = LINE; c.lineWidth = 4.2 * sz + 1.6; c.beginPath(); c.moveTo(TA[0] + (TB[0] - TA[0]) * 0.06, TA[1] + 1.5 + (TB[1] - TA[1]) * 0.06); c.lineTo(TB[0] - (TB[0] - TA[0]) * 0.06, TB[1] + 1.5 - (TB[1] - TA[1]) * 0.06); c.stroke(); c.strokeStyle = col.sail; c.lineWidth = 4.2 * sz; c.stroke();
      c.strokeStyle = col.trim; c.lineWidth = 1.3; [0.25, 0.5, 0.75].forEach(function (t) { var px = TA[0] + (TB[0] - TA[0]) * t, py = TA[1] + 1.5 + (TB[1] - TA[1]) * t; c.beginPath(); c.moveTo(px, py - 2.6 * sz); c.lineTo(px, py + 2.6 * sz); c.stroke(); });   // the ties
    }
    c.fillStyle = col.trim; c.beginPath(); c.moveTo(m[0], m[1] - mh - 1); c.lineTo(m[0] + 6 * sz, m[1] - mh + 1.2); c.lineTo(m[0], m[1] - mh + 3.2); c.closePath(); c.fill(); c.strokeStyle = LINE; c.lineWidth = 0.7; c.stroke();   // a pennant at the masthead
  }
  // the near side of the hull, drawn again over the hero's legs so he sits in the boat instead of on it; and his paddle
  function drawVesselFront(c, v, clock, heroY) {
    if (v.kind !== 'boat' && v.kind !== 'karve') return;
    var parts = v.parts && v.parts.length ? v.parts : RAFT_DEFAULT, pr = boatProfile(parts), L = pr.L, sz = Math.max(0.7, Math.min(1.2, L / 60)), bob = Math.sin(clock * 2 + v.x * 0.01) * 0.8;
    var sx = v.x, sy = v.y * K + bob, roll = Math.sin(clock * 1.7 + 1) * 0.02;
    function sub(dy, k1, k2) { c.save(); c.translate(sx, sy + dy); c.scale(1, K); c.rotate(v.h + roll); shapedPath(c, pr, k1, k2); c.restore(); }
    var cy = heroY != null ? heroY * K - 2 : sy + 1.5, hx0 = v.x + Math.cos(v.h) * (v.seat || 0);
    c.save();
    c.beginPath(); if (heroY != null) c.rect(hx0 - 10, cy, 20, 40); else c.rect(sx - L * 2, cy, L * 4, L * 3); c.clip();   // only over his legs, whatever the heading
    c.lineJoin = 'round'; c.strokeStyle = LINE;
    c.beginPath(); sub(4 * sz, 1, 1); sub(0, 0.84, 0.62); c.fillStyle = shadeHex(COL.hull, -30); c.fill('evenodd'); c.lineWidth = 1.2; c.beginPath(); sub(4 * sz, 1, 1); c.stroke();
    c.beginPath(); sub(0, 1, 1); sub(0, 0.84, 0.62); c.fillStyle = COL.hull; c.fill('evenodd');
    c.save(); c.beginPath(); sub(0, 1, 1); sub(0, 0.84, 0.62); c.clip('evenodd'); c.globalAlpha = INK.grain; c.fillStyle = grainPat(c); c.fillRect(sx - L * 2, cy, L * 4, L * 3); c.globalAlpha = 1; c.beginPath(); sub(0, 0.95, 0.9); c.lineWidth = 0.7; c.strokeStyle = INK.faint; c.stroke(); c.restore();
    c.lineWidth = 1.2; c.beginPath(); sub(0, 1, 1); c.stroke(); c.lineWidth = 0.9; c.beginPath(); sub(0, 0.84, 0.62); c.stroke();
    c.restore();
    if (v.kind === 'boat' && !(v.crew || 0) && v.aboard && heroY != null) {        // alone: a straight paddle from the near rail down into the water, stroking as the boat moves
      var mv = Math.min(1, speedOf(v) / 60), st = mv > 0.05 ? Math.sin(clock * (3 + mv * 3)) : -1, side = Math.cos(v.h) >= 0 ? 1 : -1;
      var ch = Math.cos(v.h), sh = Math.sin(v.h), seat = v.seat || 0, W = profW(pr, seat, side);
      function toS(bx, by) { return [v.x + bx * ch - by * sh, v.y * K + (bx * sh + by * ch) * K]; }
      var rail = toS(seat + 2 + st * 3, side * (W * 0.9)), blade = toS(seat + 5 + st * 7, side * (W * 0.9 + 13));
      c.save(); c.lineCap = 'round';
      c.strokeStyle = LINE; c.lineWidth = 3.4; c.beginPath(); c.moveTo(rail[0], rail[1]); c.lineTo(blade[0], blade[1]); c.stroke(); c.strokeStyle = shadeHex(COL.deck, -10); c.lineWidth = 1.8; c.stroke();
      c.beginPath(); c.ellipse(blade[0], blade[1], 2.6, 4.4, Math.atan2(blade[1] - rail[1], blade[0] - rail[0]) + Math.PI / 2, 0, 7); c.fillStyle = shadeHex(COL.deck, -10); c.fill(); c.lineWidth = 1; c.strokeStyle = LINE; c.stroke();
      if (mv > 0.05 && st > 0.3) { c.strokeStyle = 'rgba(235,250,255,0.6)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(blade[0], blade[1] + 2, 5 + st * 3, 2 + st, 0, 0, 7); c.stroke(); }
      c.restore();
    }
  }

/* ---------- the Shipyard scene: a clear yard of grass in a wooden frame, the parts down the left, the hero in a corner,
   and the build cursor laying parts. The host (the game, the Sea Editor) gives it a hero, costs, sounds, a grass tile,
   saving and what happens on Finish; the scene keeps the yard, the pick, the cursor and the frame. ---------- */
function wood(c, x, y, w, h) {            // a wooden board: planks across with grain, the ink frame heavy below and to the right, iron nails
    c.save();
    c.fillStyle = '#5c4535'; c.beginPath(); c.roundRect(x, y, w, h, 4); c.fill();
    c.save(); c.beginPath(); c.roundRect(x + 1, y + 1, w - 2, h - 2, 3); c.clip();
    var py, i = 0; for (py = y; py < y + h; py += 9, i++) { c.fillStyle = ((i * 37) % 7) / 7 > 0.5 ? '#66503e' : '#59433a'; c.fillRect(x, py, w, 9); c.strokeStyle = 'rgba(35,26,22,0.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, py + 8.6); c.lineTo(x + w, py + 9); c.stroke(); c.strokeStyle = 'rgba(255,238,200,0.08)'; c.beginPath(); c.moveTo(x, py + 0.8); c.lineTo(x + w, py + 0.8); c.stroke(); }
    c.globalAlpha = 0.2; c.fillStyle = grainPat(c); c.fillRect(x, y, w, h); c.globalAlpha = 1;
    var sg = c.createLinearGradient(x, y, x + w * 0.7, y + h); sg.addColorStop(0, 'rgba(255,240,200,0.06)'); sg.addColorStop(1, 'hsla(222,40%,15%,0.22)'); c.fillStyle = sg; c.fillRect(x, y, w, h);
    c.restore();
    c.strokeStyle = INK.line; c.lineWidth = 1.1; c.beginPath(); c.roundRect(x, y, w, h, 4); c.stroke(); c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 4, y + h); c.lineTo(x + w - 4, y + h); c.moveTo(x + w, y + 4); c.lineTo(x + w, y + h - 4); c.stroke();
    c.strokeStyle = INK.lit; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 5, y + 1.2); c.lineTo(x + w - 5, y + 1.2); c.moveTo(x + 1.2, y + 5); c.lineTo(x + 1.2, y + h - 5); c.stroke();
    c.fillStyle = '#3a3a40'; [[x + 5, y + 5], [x + w - 5, y + 5], [x + 5, y + h - 5], [x + w - 5, y + h - 5]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 1.8, 0, 7); c.fill(); c.strokeStyle = INK.line; c.lineWidth = 0.7; c.stroke(); });
    c.restore();
  }
var scene = {
  Y: { X: 0, Y: 400, W: 9, H: 6 }, PAL: { x: 6, y: 34, cell: 30 }, ZOOM: 1.1,
  yard: null, pick: 0, active: false, host: null, label: null, fade: 0,
  enter: function (host, yardState) {
    this.host = host; this.yard = yardState && yardState.cells ? yardState : { plan: 'raft', cells: [] }; if (!this.yard.plan) this.yard.plan = 'raft';
    this.pick = 0; this.active = true; this.fade = 0.5; this.label = null; return this.yard;
  },
  leave: function () { this.active = false; this.fade = 0.5; },
  parts: function () { return partsFor(this.yard ? this.yard.plan : 'raft'); },
  cam: function () { var Y = this.Y; return { x: Y.X + Y.W * T / 2 - 4, y: (Y.Y + Y.H * T / 2) * K, z: this.ZOOM }; },
  heroSpot: function () { var Y = this.Y; return { x: Y.X + Y.W * T + 8, y: Y.Y + Y.H * T + 14 }; },
  walk: function (x, y) { var Y = this.Y; return x >= Y.X - 18 && x <= Y.X + Y.W * T + 18 && y >= Y.Y - 14 && y <= Y.Y + Y.H * T + 26; },
  tick: function (dt) { if (this.fade > 0) this.fade = Math.max(0, this.fade - dt); },
  cell: function (mw) { var Y = this.Y; if (!mw) return null; var i = Math.floor((mw.x - Y.X) / T), j = Math.floor((mw.y - Y.Y) / T); if (i < 0 || j < 0 || i >= Y.W || j >= Y.H) return null; return { i: i, j: j }; },
  top: function (i, j) {                  // what a right click takes: what lies on a log first, wherever on the log it sits; then the log
    var y = this.yard; for (var L = LAYERS.length - 1; L >= 0; L--) { var k = yardAt(y, i, j, LAYERS[L]); if (k >= 0) { if (LAYERS[L] === 'hull') { var p = y.cells[k], pt = partOf(p.id); for (var L2 = LAYERS.length - 1; L2 >= 1; L2--) for (var q = 0; q < pt.w; q++) { var k2 = yardAt(y, p.i + q, p.j, LAYERS[L2]); if (k2 >= 0) return k2; } } return k; } } return -1;
  },
  target: function (mw, wreck) {          // what the cursor would lay, or take away
    var c = this.cell(mw), h = this.host; if (!c) return null;
    if (wreck) { var top = this.top(c.i, c.j); return { kind: 'yard', wreck: true, i: c.i, j: c.j, idx: top, ok: top >= 0, why: '' }; }
    var PL = this.parts(), pt = PL[this.pick] || PL[0], i = c.i, j = c.j, why = '';
    if (i + pt.w > this.Y.W) i = this.Y.W - pt.w;
    for (var k = 0; k < pt.w && !why; k++) {
      if (yardAt(this.yard, i + k, j, pt.layer) >= 0) why = 'Something lies there already';
      else if (pt.on && yardAt(this.yard, i + k, j, pt.on) < 0) why = 'It must go on the hull';
    }
    if (!why && !h.canAfford(pt.cost)) why = 'Need ' + h.costText(pt.cost);
    return { kind: 'yard', i: i, j: j, part: pt, ok: !why, why: why };
  },
  act: function (mw, first, wreck) {
    var t = this.target(mw, wreck), h = this.host; if (!t || !t.ok) return false;
    if (t.wreck) { var p = this.yard.cells[t.idx]; h.pay(costFor(partOf(p.id), this.yard.plan), 1); this.yard.cells.splice(t.idx, 1); h.sfx('build'); h.save(); return true; }
    if (!first) return false;
    h.pay(t.part.cost); this.yard.cells.push({ id: t.part.id, i: t.i, j: t.j }); h.sfx('build'); h.save(); return true;
  },
  check: function () { return this.yard ? yardCheck(this.yard) : ''; },
  floor: function (c) {                   // the yard's ground, in world space, with the laid parts: trodden earth inside a frame of timbers
    var Y = this.Y, i, j;
    for (j = -2; j < Y.H + 2; j++) for (i = -2; i < Y.W + 2; i++) this.host.tile(c, i + 40, j + 40, Y.X + i * T, (Y.Y + j * T) * K, T + 0.4, TS + 0.4);
    ink(c, rect(Y.X, Y.Y * K, Y.W * T, Y.H * TS), '#8a7250', { wob: 2.5, seed: 21, lw: 0, noLine: true, shade: 0.12 });
    ink(c, rect(Y.X - 4, Y.Y * K - 3, Y.W * T + 8, 3), '#6e5540', { wob: 0.6, seed: 22, lw: 0.8, heavy: 1.6 }); ink(c, rect(Y.X - 4, Y.Y * K + Y.H * TS, Y.W * T + 8, 3), '#6e5540', { wob: 0.6, seed: 23, lw: 0.8, heavy: 1.6 });
    ink(c, rect(Y.X - 4, Y.Y * K - 3, 3, Y.H * TS + 6), '#6e5540', { wob: 0.6, seed: 24, lw: 0.8, heavy: 1.6 }); ink(c, rect(Y.X + Y.W * T + 1, Y.Y * K - 3, 3, Y.H * TS + 6), '#6e5540', { wob: 0.6, seed: 25, lw: 0.8, heavy: 1.6 });
    c.strokeStyle = 'rgba(35,26,22,0.16)'; c.lineWidth = 0.7; c.setLineDash([2, 4]); c.beginPath();
    for (i = 0; i <= Y.W; i++) { c.moveTo(Y.X + i * T, Y.Y * K); c.lineTo(Y.X + i * T, (Y.Y + Y.H * T) * K); }
    for (j = 0; j <= Y.H; j++) { c.moveTo(Y.X, (Y.Y + j * T) * K); c.lineTo(Y.X + Y.W * T, (Y.Y + j * T) * K); }
    c.stroke(); c.setLineDash([]);
    var y = this.yard; LAYERS.forEach(function (L) { y.cells.forEach(function (p) { var pt = partOf(p.id); if (pt.layer === L) drawYardPart(c, pt, Y.X + p.i * T, (Y.Y + p.j * T) * K, 1); }); });
  },
  ghost: function (c, mw, wreck) {        // the cursor: the part where it would lie, green or red; sets this.label
    var t = this.target(mw, wreck), Y = this.Y, h = this.host; this.label = null; if (!t) return;
    var yx = Y.X + t.i * T, yy = (Y.Y + t.j * T) * K, col = t.ok ? '120,255,160' : '255,80,60', yw = t.wreck ? T : t.part.w * T;
    c.save();
    if (!t.wreck) { c.globalAlpha = t.ok ? 0.7 : 0.35; drawYardPart(c, t.part, yx, yy, 1); c.globalAlpha = 1; }
    if (t.wreck && t.ok) { var wp = this.yard.cells[t.idx]; yx = Y.X + wp.i * T; yw = partOf(wp.id).w * T; col = '255,80,60'; }
    if (!t.wreck || t.ok) { c.shadowColor = 'rgba(' + col + ',0.95)'; c.shadowBlur = 10; c.strokeStyle = 'rgba(' + col + ',0.95)'; c.lineWidth = 2; c.strokeRect(yx + 1, yy + 1, yw - 2, TS - 2); c.strokeRect(yx + 1, yy + 1, yw - 2, TS - 2); }
    c.restore();
    this.label = t.wreck ? (t.ok ? { text: 'Take back: +' + h.costText(partOf(this.yard.cells[t.idx].id).cost), bad: false } : null) : (t.ok ? { text: t.part.name + '  ' + h.costText(t.part.cost), bad: false } : { text: t.why, bad: true });
  },
  palRect: function (k) { var P = this.PAL; return { x: P.x + 3, y: P.y + 10 + k * (P.cell + 4), w: P.cell, h: P.cell }; },
  palAt: function (ms) { if (!ms) return -1; for (var k = 0; k < this.parts().length; k++) { var r = this.palRect(k); if (ms.x >= r.x && ms.x <= r.x + r.w && ms.y >= r.y && ms.y <= r.y + r.h) return k; } return -1; },
  planRect: function (k) { return { x: 100 + k * 30, y: 6, w: 27, h: 10 }; },
  planAt: function (ms) { if (!ms) return -1; for (var k = 0; k < YARD_PLANS.length; k++) { var r = this.planRect(k); if (ms.x >= r.x && ms.x <= r.x + r.w && ms.y >= r.y && ms.y <= r.y + r.h) return k; } return -1; },
  finishRect: function () { return { x: 320, y: 234, w: 62, h: 12 }; },
  hud: function (c, ms, wreck) {          // the frame, the parts, the plan tabs, the guidance, Finish, the cursor's label
    var why = this.check(), hp = this.palAt(ms), PL = this.parts(), P = this.PAL, h = this.host, k, self = this;
    wood(c, -6, -6, 412, 28); wood(c, -6, 228, 412, 28); wood(c, 388, 0, 18, 250);
    wood(c, P.x - 4, P.y - 4, P.cell + 14, PL.length * (P.cell + 4) + 20);
    c.font = 'bold 6px system-ui, sans-serif'; c.fillStyle = '#f6e2b8'; c.textAlign = 'left'; c.fillText('Parts', P.x + 3, P.y + 5);
    for (k = 0; k < PL.length; k++) {
      var r = this.palRect(k), pt = PL[k], on = k === this.pick && !wreck, can = h.canAfford(pt.cost);
      c.fillStyle = hp === k ? '#4a3626' : '#33241a'; c.fillRect(r.x, r.y, r.w, r.h); c.save(); c.globalAlpha = 0.14; c.fillStyle = grainPat(c); c.fillRect(r.x, r.y, r.w, r.h); c.restore();
      c.strokeStyle = on ? '#d9a73a' : INK.line; c.lineWidth = on ? 1.3 : 0.9; c.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); c.strokeStyle = 'rgba(255,238,200,0.14)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(r.x + 1.5, r.y + r.h - 1.2); c.lineTo(r.x + r.w - 1.5, r.y + r.h - 1.2); c.lineTo(r.x + r.w - 1.2, r.y + 1.5); c.stroke();
      c.globalAlpha = can ? 1 : 0.4; drawYardPart(c, pt, r.x + (pt.w === 2 ? 1 : 7), r.y + 4, pt.w === 2 ? 0.44 : 0.7); c.globalAlpha = 1;
      c.font = '600 4.2px system-ui, sans-serif'; c.fillStyle = 'rgba(246,226,184,0.85)'; c.textAlign = 'center'; c.fillText(pt.name, r.x + r.w / 2, r.y + r.h - 2.5);
    }
    YARD_PLANS.forEach(function (pl, k) { var r = self.planRect(k), on = self.yard.plan === pl[0]; c.fillStyle = on ? '#a8702c' : '#33241a'; c.fillRect(r.x, r.y, r.w, r.h); c.strokeStyle = INK.line; c.lineWidth = 0.8; c.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); c.font = (on ? 'bold ' : '600 ') + '6px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = on ? '#f6e2b8' : 'rgba(246,226,184,0.7)'; c.fillText(pl[1], r.x + r.w / 2, r.y + 7.5); });
    var line = why || 'The hull is sound. Finish to launch it.';
    c.font = '600 7px system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 2.6; c.strokeStyle = '#2e1a10'; c.strokeText(line, 270, 14); c.fillStyle = why ? '#ffe9a8' : '#9be58b'; c.fillText(line, 270, 14);
    if (!why) { var fr = this.finishRect(), hv = ms && ms.x >= fr.x && ms.x <= fr.x + fr.w && ms.y >= fr.y && ms.y <= fr.y + fr.h; c.fillStyle = hv ? '#6a4e38' : '#5a4232'; c.beginPath(); c.roundRect(fr.x, fr.y, fr.w, fr.h, 3); c.fill(); c.save(); c.globalAlpha = 0.14; c.fillStyle = grainPat(c); c.fillRect(fr.x, fr.y, fr.w, fr.h); c.restore(); c.strokeStyle = '#c99a3a'; c.lineWidth = 1; c.beginPath(); c.roundRect(fr.x + 0.5, fr.y + 0.5, fr.w - 1, fr.h - 1, 3); c.stroke(); c.strokeStyle = INK.line; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fr.x + 3, fr.y + fr.h); c.lineTo(fr.x + fr.w - 3, fr.y + fr.h); c.moveTo(fr.x + fr.w, fr.y + 3); c.lineTo(fr.x + fr.w, fr.y + fr.h - 3); c.stroke(); c.font = 'bold 6.5px system-ui, sans-serif'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('Finish  (Enter)', fr.x + fr.w / 2, fr.y + 8.5); }
    if (hp >= 0) { var pp = PL[hp], tt = pp.name + '  ' + h.costText(pp.cost) + '.  ' + pp.text; c.font = '600 6px system-ui, sans-serif'; c.textAlign = 'left'; c.lineWidth = 2.4; c.strokeStyle = '#2e1a10'; c.strokeText(tt, P.x + P.cell + 16, this.palRect(hp).y + 8); c.fillStyle = '#fff'; c.fillText(tt, P.x + P.cell + 16, this.palRect(hp).y + 8); }
    if (this.label && ms && hp < 0) { c.font = '600 6.5px system-ui, sans-serif'; var gw = c.measureText(this.label.text).width + 10, gx = Math.max(2, Math.min(398 - gw, ms.x + 8)), gy = Math.max(12, ms.y - 6); c.fillStyle = 'rgba(20,16,30,0.82)'; c.fillRect(gx, gy - 8, gw, 12); c.fillStyle = this.label.bad ? '#ff9a8a' : '#fff'; c.textAlign = 'left'; c.fillText(this.label.text, gx + 5, gy + 1); }
    c.font = '600 5px system-ui, sans-serif'; c.lineWidth = 2; c.strokeStyle = '#2e1a10'; c.textAlign = 'left'; c.strokeText('Right click takes a part back.  E leaves the yard.', 52, 242); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText('Right click takes a part back.  E leaves the yard.', 52, 242);
    // a preview: the vessel as it will look afloat, in a small window of water at the bottom right
    if (hullCells(this.yard.cells).length) {
      var bx = 292, by = 158, bw = 92, bh = 62, pv = { kind: this.yard.plan, parts: this.yard.cells, x: 0, y: 0, h: -0.35, vx: 0, vy: 0, aboard: false };
      fitVessel(pv); var sc = Math.min(1, (bw - 14) / (pv.hw * 2 + 16), (bh - 10) / (pv.hh * 2 + 24));
      wood(c, bx - 4, by - 4, bw + 8, bh + 8);
      c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip(); c.fillStyle = '#3a6f8e'; c.fillRect(bx, by, bw, bh); c.globalAlpha = 0.16; c.fillStyle = grainPat(c); c.fillRect(bx, by, bw, bh); c.globalAlpha = 1;
      c.strokeStyle = 'rgba(235,250,255,0.35)'; c.lineWidth = 0.8; [[8, 12], [60, 20], [30, 50], [78, 46]].forEach(function (q) { c.beginPath(); c.moveTo(bx + q[0], by + q[1]); c.quadraticCurveTo(bx + q[0] + 3, by + q[1] - 2, bx + q[0] + 6, by + q[1]); c.quadraticCurveTo(bx + q[0] + 9, by + q[1] + 2, bx + q[0] + 12, by + q[1]); c.stroke(); });
      c.translate(bx + bw / 2, by + bh / 2 + 2); c.scale(sc, sc); drawVessel(c, pv, 0); c.restore();
      c.font = '600 5px system-ui, sans-serif'; c.textAlign = 'left'; c.fillStyle = 'rgba(246,226,184,0.85)'; c.fillText('Afloat it will look like this', bx, by - 6);
    }
    if (this.fade > 0) { c.fillStyle = 'rgba(0,0,0,' + Math.min(1, this.fade / 0.5) + ')'; c.fillRect(0, 0, 400, 250); }
  },
  mousedown: function (button, mw, ms) {  // the tabs, the parts, Finish, taking back, laying
    var h = this.host, ypl = this.planAt(ms);
    if (ypl >= 0) { if (button === 0 && this.yard.plan !== YARD_PLANS[ypl][0]) { if (this.yard.cells.length) h.toast('Take the parts back first'); else { this.yard.plan = YARD_PLANS[ypl][0]; this.pick = 0; h.save(); } } return true; }
    var ypk = this.palAt(ms); if (ypk >= 0) { if (button === 0) this.pick = ypk; return true; }
    var fr = this.finishRect(); if (button === 0 && !this.check() && ms && ms.x >= fr.x && ms.x <= fr.x + fr.w && ms.y >= fr.y && ms.y <= fr.y + fr.h) { h.finish(); return true; }
    if (button === 2) { this.act(mw, true, true); return true; }
    if (button === 0) { this.act(mw, true, false); return true; }
    return false;
  },
  wheel: function (d) { var n = this.parts().length; this.pick = (this.pick + d + n) % n; },
  key: function (code) { if (code === 'Enter') { if (!this.check()) this.host.finish(); return true; } return false; }
};

return { scene: scene, wood: wood, HANDLING: HANDLING, WIND: WIND, sail: sail, partsFor: partsFor, costFor: costFor, PARTS: ALL_PARTS, PLAN_LIST: YARD_PLANS, LAYERS: LAYERS, PLANS: PLANS, RAFT_DEFAULT: RAFT_DEFAULT, CW: CW, CH: CH,
  partsFor: partsFor, connected: yardConnected, parts: yardParts, at: yardAt, partOf: partOf, check: yardCheck, hullCells: hullCells,
  drawPart: drawYardPart, fit: fitVessel, drawVessel: drawVessel, drawVesselFront: drawVesselFront, drawOar: drawOar };
})();
if (typeof module !== 'undefined') module.exports = Yard;
