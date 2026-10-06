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
    { id: 'keel', plan: 'boat', name: 'Keel', cost: { wood: 2, copper: 1 }, w: 1, layer: 'hull', text: 'The spine of the boat: a straight run of three to nine. The bow and the stern are shaped on its ends.' },
    { id: 'strake', plan: 'boat', name: 'Strake', cost: { wood: 1, copper: 1 }, w: 1, layer: 'hull', text: 'A plank of the side, nailed on. Lay strakes beside the keel to make the boat wider.' },
    { id: 'thwart', plan: 'boat', name: 'Rowing seat', cost: { wood: 1 }, w: 1, layer: 'deck', on: 'hull', text: 'A seat with an oar each side. The first is yours; more need hirdmen to row.' }
  ];
  function partsFor(plan) { return ALL_PARTS.filter(function (p) { return p.plan === plan; }); }
  var YARD_PLANS = [['raft', 'Raft'], ['boat', 'Boat']];
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
    ] }
  };
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
    c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
    if (pt.id === 'log') { c.fillStyle = '#b98a5a'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(2, 5, 2 * T - 4, TS - 10, 6); c.fill(); c.stroke(); c.fillStyle = '#e3c58f'; c.beginPath(); c.ellipse(2 * T - 3, TS / 2, 2.2, (TS - 10) / 2 - 1, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(60,35,15,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(8, 9); c.lineTo(2 * T - 12, 9); c.moveTo(12, TS - 9); c.lineTo(2 * T - 16, TS - 9); c.stroke(); }
    else if (pt.id === 'lash') { c.strokeStyle = '#e8d8a8'; c.lineWidth = 3; c.beginPath(); c.moveTo(T / 2, 1); c.lineTo(T / 2, TS - 1); c.stroke(); c.strokeStyle = '#6a4a2a'; c.lineWidth = 0.9; for (var k = 3; k < TS - 2; k += 4) { c.beginPath(); c.moveTo(T / 2 - 1.8, k); c.lineTo(T / 2 + 1.8, k + 2.4); c.stroke(); } }
    else if (pt.id === 'plank') { c.fillStyle = '#d9b27a'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1.2; c.beginPath(); c.roundRect(3, TS / 2 - 3.5, T - 6, 7, 1.5); c.fill(); c.stroke(); }
    else if (pt.id === 'keel') { c.fillStyle = '#6a4a2a'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1.4; c.beginPath(); c.roundRect(1, TS / 2 - 4, T - 2, 8, 2); c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,220,170,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(3, TS / 2 - 1.5); c.lineTo(T - 3, TS / 2 - 1.5); c.stroke(); }
    else if (pt.id === 'strake') { c.fillStyle = '#b98a5a'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1.2; c.beginPath(); c.roundRect(1, TS / 2 - 3.5, T - 2, 7, 2); c.fill(); c.stroke(); c.fillStyle = '#d9b27a'; c.fillRect(3, TS / 2 - 2.5, T - 6, 2); c.fillStyle = '#8a8a8e'; [6, T - 6].forEach(function (nx) { c.beginPath(); c.arc(nx, TS / 2 + 1, 1, 0, 7); c.fill(); }); }
    else if (pt.id === 'thwart') { c.fillStyle = '#d9b27a'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1.2; c.beginPath(); c.roundRect(4, 3, T - 8, 5, 1.5); c.fill(); c.stroke(); c.strokeStyle = '#2e1a10'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(6, 7); c.lineTo(2, TS - 3); c.moveTo(T - 6, 7); c.lineTo(T - 2, TS - 3); c.stroke(); c.strokeStyle = '#8a5a3a'; c.lineWidth = 1.4; c.stroke(); }
    else if (pt.id === 'oar') { c.strokeStyle = '#2e1a10'; c.lineWidth = 4; c.beginPath(); c.moveTo(5, TS - 4); c.lineTo(T - 8, 5); c.stroke(); c.strokeStyle = '#8a5a3a'; c.lineWidth = 2.2; c.stroke(); c.fillStyle = '#c99a66'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(T - 7, 6, 3.2, 5.5, 0.8, 0, 7); c.fill(); c.stroke(); }
    c.restore();
  }

  var CW = 27, CH = 7.6;                   // a yard cell on the water: how long and how wide a log is
  function hullCells(parts) { return (parts || []).filter(function (p) { return partOf(p.id) && partOf(p.id).layer === 'hull'; }); }
  function fitVessel(raft) {                     // from its parts: how big the hull is (for the water test) and where you sit
    if (!raft) return; var parts = raft.parts && raft.parts.length ? raft.parts : RAFT_DEFAULT, hull = hullCells(parts), minI = 1e9, maxI = -1e9, minJ = 1e9, maxJ = -1e9;
    hull.forEach(function (p) { var w = partOf(p.id).w; minI = Math.min(minI, p.i); maxI = Math.max(maxI, p.i + w); minJ = Math.min(minJ, p.j); maxJ = Math.max(maxJ, p.j + 1); });
    if (raft.kind === 'boat') { var n = maxI - minI, rows = maxJ - minJ; raft.hw = n * CW / 2 + 10; raft.hh = rows * CH * 0.85 + 6; raft.seat = raft.hw - 18; }
    else { raft.hw = (maxI - minI) * CW / 2 + 4; raft.hh = (maxJ - minJ) * CH / 2 + 4; raft.seat = 0; }
  }

  var RAFT_DEFAULT = [{ id: 'log', i: 0, j: 0 }, { id: 'log', i: 0, j: 1 }, { id: 'log', i: 0, j: 2 }, { id: 'log', i: 0, j: 3 }, { id: 'log', i: 0, j: 4 }, { id: 'lash', i: 0, j: 0 }, { id: 'lash', i: 1, j: 0 }, { id: 'lash', i: 0, j: 4 }, { id: 'lash', i: 1, j: 4 }];
  function drawOar(c, x, y, ang) { c.save(); c.translate(x, y); c.rotate(ang); c.strokeStyle = '#2e1a10'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(-9, 0); c.lineTo(9, 0); c.stroke(); c.strokeStyle = '#8a5a3a'; c.lineWidth = 1.8; c.stroke(); c.fillStyle = '#c99a66'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1; c.beginPath(); c.ellipse(9, 0, 4, 2.4, 0, 0, 7); c.fill(); c.stroke(); c.restore(); }
  function drawVessel(c, v, clock) {                   // the vessel as it was laid in the yard
    var bob = Math.sin(clock * 2 + v.x * 0.01) * 0.8, parts = v.parts && v.parts.length ? v.parts : RAFT_DEFAULT;
    if (v.kind === 'boat') { drawBoat(c, v, parts, bob); return; }
    var logs = parts.filter(function (p) { return p.id === 'log'; }), minI = 1e9, maxI = -1e9, minJ = 1e9, maxJ = -1e9;
    logs.forEach(function (p) { minI = Math.min(minI, p.i); maxI = Math.max(maxI, p.i + 2); minJ = Math.min(minJ, p.j); maxJ = Math.max(maxJ, p.j + 1); });
    var cx = (minI + maxI) / 2, cy = (minJ + maxJ) / 2, hw = (maxI - minI) / 2 * CW + 4, hh = (maxJ - minJ) / 2 * CH + 4;
    c.save(); c.translate(v.x, v.y * K + bob);
    c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); c.ellipse(0, 3, hw + 8, hh + 10, 0, 0, 7); c.fill();          // a ring of foam
    c.scale(1, K); c.rotate(v.h);
    c.fillStyle = 'rgba(10,40,70,0.28)'; c.beginPath(); c.ellipse(1, 3, hw + 2, hh + 6, 0, 0, 7); c.fill();
    c.lineJoin = 'round'; c.lineCap = 'round';
    logs.slice().sort(function (p, q) { return p.j - q.j; }).forEach(function (p) {
      var x0 = (p.i - cx) * CW, oy = (p.j + 0.5 - cy) * CH, len = 2 * CW - 2;
      c.fillStyle = (p.i + p.j) % 2 ? '#a8794a' : '#b98a5a'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1.5;
      c.beginPath(); c.roundRect(x0 + 1, oy - 3.6, len, 7.2, 3.4); c.fill(); c.stroke();
      c.fillStyle = '#e3c58f'; c.beginPath(); c.ellipse(x0 + len + 1, oy, 1.8, 3.2, 0, 0, 7); c.fill();
    });
    parts.forEach(function (p) {
      var x0 = (p.i + 0.5 - cx) * CW, oy = (p.j + 0.5 - cy) * CH;
      if (p.id === 'lash') { c.strokeStyle = '#e8d8a8'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x0, oy - 4.6); c.lineTo(x0, oy + 4.6); c.stroke(); c.strokeStyle = '#6a4a2a'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x0 - 1.6, oy - 3); c.lineTo(x0 + 1.6, oy + 3); c.stroke(); }
      else if (p.id === 'plank') { c.fillStyle = '#d9b27a'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1; c.beginPath(); c.roundRect(x0 - 10, oy - 2.6, 20, 5.2, 1.5); c.fill(); c.stroke(); }
    });
    drawOar(c, hw - 8, hh + 2, 0.5);        // the oar lies ready at the edge
    c.restore();
  }
  function drawBoat(c, v, parts, bob) {        // a clinker boat from its keel (the length), strakes (the width) and rowing seats
    var keel = parts.filter(function (p) { return p.id === 'keel'; }), hull = hullCells(parts), minI = 1e9, maxI = -1e9, minJ = 1e9, maxJ = -1e9;
    hull.forEach(function (p) { minI = Math.min(minI, p.i); maxI = Math.max(maxI, p.i + 1); minJ = Math.min(minJ, p.j); maxJ = Math.max(maxJ, p.j + 1); });
    var j0 = keel.length ? keel[0].j : (minJ + maxJ) / 2, cx = (minI + maxI) / 2, L = (maxI - minI) * CW, Wd = (maxJ - minJ) * CH * 0.85 + 4, hl = L / 2 + 10;
    function wAt(x) { var u = Math.max(0, 1 - (x / hl) * (x / hl)); return Wd * Math.sqrt(u); }
    c.save(); c.translate(v.x, v.y * K + bob);
    c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); c.ellipse(0, 3, hl + 8, Wd + 10, 0, 0, 7); c.fill();
    c.scale(1, K); c.rotate(v.h);
    c.fillStyle = 'rgba(10,40,70,0.28)'; c.beginPath(); c.ellipse(1, 3, hl, Wd + 5, 0, 0, 7); c.fill();
    c.lineJoin = 'round'; c.lineCap = 'round';
    function lens(sc, yoff) { c.beginPath(); c.moveTo(-hl, yoff); c.quadraticCurveTo(-hl * 0.35, -Wd * sc + yoff, 0, -Wd * sc + yoff); c.quadraticCurveTo(hl * 0.35, -Wd * sc + yoff, hl, yoff); c.quadraticCurveTo(hl * 0.35, Wd * sc + yoff, 0, Wd * sc + yoff); c.quadraticCurveTo(-hl * 0.35, Wd * sc + yoff, -hl, yoff); c.closePath(); }
    lens(1, 0); c.fillStyle = '#b98a5a'; c.fill(); c.strokeStyle = '#2e1a10'; c.lineWidth = 1.6; c.stroke();     // the hull
    c.strokeStyle = 'rgba(60,35,15,0.45)'; c.lineWidth = 1; [0.78, 0.56].forEach(function (f) { lens(f, 0); c.stroke(); });   // the strakes
    lens(0.36, 0); c.fillStyle = '#8a6a44'; c.fill();                                                                    // the bottom boards
    c.strokeStyle = '#4a2e1c'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-hl + 4, 0); c.lineTo(hl - 4, 0); c.stroke();  // the keel line
    c.strokeStyle = '#2e1a10'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(hl - 2, 0); c.lineTo(hl + 5, -4); c.moveTo(-hl + 2, 0); c.lineTo(-hl - 4, -3); c.stroke();   // stem and stern posts
    c.strokeStyle = '#6a4a2a'; c.lineWidth = 1.8; c.stroke();
    parts.filter(function (p) { return p.id === 'thwart'; }).forEach(function (p) {
      var x = (p.i + 0.5 - cx) * CW, w = wAt(x) * 0.9;
      c.fillStyle = '#d9b27a'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1; c.beginPath(); c.roundRect(x - 3, -w, 6, w * 2, 1.5); c.fill(); c.stroke();
      drawOar(c, x, -w - 6, -1.25); drawOar(c, x, w + 6, 1.25);
    });
    c.restore();
  }

return { PARTS: ALL_PARTS, PLAN_LIST: YARD_PLANS, LAYERS: LAYERS, PLANS: PLANS, RAFT_DEFAULT: RAFT_DEFAULT, CW: CW, CH: CH,
  partsFor: partsFor, connected: yardConnected, parts: yardParts, at: yardAt, partOf: partOf, check: yardCheck, hullCells: hullCells,
  drawPart: drawYardPart, fit: fitVessel, drawVessel: drawVessel, drawOar: drawOar };
})();
if (typeof module !== 'undefined') module.exports = Yard;
