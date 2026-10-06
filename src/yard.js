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
    if (raft.kind === 'boat') { var n = maxI - minI, rows = maxJ - minJ; raft.hw = n * CW / 2 + 10; raft.hh = (rows * CH * 0.85 + 4) * 0.6; raft.seat = (raft.crew || 0) > 0 ? raft.hw * 0.5 : -raft.hw * 0.45; }   // alone you sit aft and paddle; with rowers you stand halfway to the bow
    else { raft.hw = (maxI - minI) * CW / 2 + 4; raft.hh = (maxJ - minJ) * CH / 2 + 4; raft.seat = 0; }
  }

  var RAFT_DEFAULT = [{ id: 'log', i: 0, j: 0 }, { id: 'log', i: 0, j: 1 }, { id: 'log', i: 0, j: 2 }, { id: 'log', i: 0, j: 3 }, { id: 'log', i: 0, j: 4 }, { id: 'lash', i: 0, j: 0 }, { id: 'lash', i: 1, j: 0 }, { id: 'lash', i: 0, j: 4 }, { id: 'lash', i: 1, j: 4 }];
  function drawOar(c, x, y, ang) { c.save(); c.translate(x, y); c.rotate(ang); c.strokeStyle = '#2e1a10'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(-9, 0); c.lineTo(9, 0); c.stroke(); c.strokeStyle = '#8a5a3a'; c.lineWidth = 1.8; c.stroke(); c.fillStyle = '#c99a66'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1; c.beginPath(); c.ellipse(9, 0, 4, 2.4, 0, 0, 7); c.fill(); c.stroke(); c.restore(); }
  var LINE = '#1d1622', COL = { hull: '#5a3a26', deck: '#b98a5a', trim: '#b83a2e' };
  function shadeHex(hex, d) { var n = parseInt(hex.substr(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + d)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + d)), b = Math.max(0, Math.min(255, (n & 255) + d)); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }
  function hullPath(c, L, W) { c.moveTo(-L, 0); c.quadraticCurveTo(0, -W * 1.9, L, 0); c.quadraticCurveTo(0, W * 1.9, -L, 0); c.closePath(); }   // pointed at both ends
  function halfW(W, u) { return 0.95 * W * (1 - u * u); }
  function speedOf(v) { return Math.hypot(v.vx || 0, v.vy || 0); }
  // the water round a hull: a thin line of foam hugging it, and when it moves a wake of ripples trailing from the stern
  function drawWater(c, v, hl, hw, clock) {
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
    c.strokeStyle = 'rgba(235,250,255,' + (0.3 + 0.25 * mv).toFixed(2) + ')'; c.lineWidth = 2.2; c.beginPath(); hullPath(c, hl + 5, hw * 1.15 + 3); c.stroke();   // foam at the waterline
    c.restore();
  }
  function drawVessel(c, v, clock) {                        // the vessel as it was laid in the yard, on the water
    var bob = Math.sin(clock * 2 + v.x * 0.01) * 0.8, parts = v.parts && v.parts.length ? v.parts : RAFT_DEFAULT;
    if (v.kind === 'boat') { drawBoat(c, v, parts, bob, clock); return; }
    var logs = parts.filter(function (p) { return p.id === 'log'; }), minI = 1e9, maxI = -1e9, minJ = 1e9, maxJ = -1e9;
    logs.forEach(function (p) { minI = Math.min(minI, p.i); maxI = Math.max(maxI, p.i + 2); minJ = Math.min(minJ, p.j); maxJ = Math.max(maxJ, p.j + 1); });
    var cx = (minI + maxI) / 2, cy = (minJ + maxJ) / 2, hw = (maxI - minI) / 2 * CW + 4, hh = (maxJ - minJ) / 2 * CH + 4;
    drawWater(c, v, hw, hh * 0.55, clock);
    c.save(); c.translate(v.x, v.y * K + bob);
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
    drawOar(c, hw - 8, hh + 2, 0.5);
    c.restore();
  }
  function boatDims(parts) {                                 // the hull from the keel's length and the strakes' width: L and W as the ships use them
    var hull = hullCells(parts), minI = 1e9, maxI = -1e9, minJ = 1e9, maxJ = -1e9;
    hull.forEach(function (p) { minI = Math.min(minI, p.i); maxI = Math.max(maxI, p.i + 1); minJ = Math.min(minJ, p.j); maxJ = Math.max(maxJ, p.j + 1); });
    var keel = parts.filter(function (p) { return p.id === 'keel'; });
    return { L: (maxI - minI) * CW / 2 + 8, W: ((maxJ - minJ) * CH * 0.85 + 4) * 0.6, cx: (minI + maxI) / 2, keelJ: keel.length ? keel[0].j : (minJ + maxJ) / 2 };
  }
  // a clinker boat in the look of the Sea Editor's ships: the karve without its sail (a mast and sail come later)
  function drawBoat(c, v, parts, bob, clock) {
    var d = boatDims(parts), L = d.L, W = d.W, sz = Math.max(0.7, Math.min(1.2, L / 60)), col = COL, h = v.h, i;
    var sx = v.x, sy = v.y * K + bob, roll = Math.sin(clock * 1.7 + 1) * 0.02, mv = Math.min(1, speedOf(v) / 60);
    var seats = parts.filter(function (p) { return p.id === 'thwart'; }).map(function (p) { return (p.i + 0.5 - d.cx) * CW; });
    drawWater(c, v, L, W, clock);
    function inFrame(dy, fn) { c.save(); c.translate(sx, sy + dy); c.scale(1, K); c.rotate(h + roll); fn(); c.restore(); }
    function fillStroke(fill, lw) { c.fillStyle = fill; c.fill(); c.lineWidth = lw || 1.6; c.strokeStyle = LINE; c.lineJoin = 'round'; c.stroke(); }
    c.fillStyle = 'rgba(8,12,40,0.28)'; c.beginPath(); c.ellipse(sx + 2, v.y * K + 5 * sz, L * 0.95, W * 1.05, 0, 0, 7); c.fill();
    inFrame(4 * sz, function () { c.beginPath(); hullPath(c, L, W); fillStroke(shadeHex(col.hull, -30)); });
    inFrame(0, function () {
      c.beginPath(); hullPath(c, L, W); fillStroke(col.hull);
      c.save(); c.scale(0.9, 0.78); c.beginPath(); hullPath(c, L, W); c.lineWidth = 0.9; c.strokeStyle = 'rgba(20,12,20,0.45)'; c.stroke(); c.restore();   // a line of planking
      c.save(); c.scale(0.84, 0.62); c.beginPath(); hullPath(c, L, W); fillStroke(col.deck, 1.2); c.restore();
      seats.forEach(function (x) { var u = x / L, tw = halfW(W, u) * 0.6; c.beginPath(); c.rect(x - 1.3, -tw, 2.6, tw * 2); fillStroke(shadeHex(col.hull, 12), 0.9); });   // the rowing seats as laid
      if ((v.crew || 0) > 0) seats.forEach(function (x, n) { [-1, 1].forEach(function (sd) {          // an oar each side of every seat, pulling when under way (only with rowers)
        var u = x / L, a = sd * (Math.PI / 2) - Math.sin(clock * (2.6 + mv * 4.5) + n) * 0.55 * mv - 0.2;
        var ox = x, oy = sd * halfW(W, u), len = W * 1.7 + 7 * sz, ex = ox + Math.cos(a) * len, ey = oy + Math.sin(a) * len;
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
  }
  // the near side of the hull, drawn again over the hero's feet so he stands in the boat instead of on it
  function drawVesselFront(c, v, clock, heroY) {
    if (v.kind !== 'boat') return;
    var parts = v.parts && v.parts.length ? v.parts : RAFT_DEFAULT, d = boatDims(parts), L = d.L, W = d.W, sz = Math.max(0.7, Math.min(1.2, L / 60)), bob = Math.sin(clock * 2 + v.x * 0.01) * 0.8;
    var sx = v.x, sy = v.y * K + bob, roll = Math.sin(clock * 1.7 + 1) * 0.02;
    function sub(dy, k1, k2) { c.save(); c.translate(sx, sy + dy); c.scale(1, K); c.rotate(v.h + roll); c.scale(k1, k2); hullPath(c, L, W); c.restore(); }
    c.save();
    var cy = heroY != null ? heroY * K - 7 : sy + 1.5;
    c.beginPath(); c.rect(sx - L * 2, cy, L * 4, L * 3); c.clip();
    c.lineJoin = 'round'; c.strokeStyle = LINE;
    c.beginPath(); sub(4 * sz, 1, 1); sub(0, 0.84, 0.62); c.fillStyle = shadeHex(COL.hull, -30); c.fill('evenodd'); c.lineWidth = 1.6; c.beginPath(); sub(4 * sz, 1, 1); c.stroke();
    c.beginPath(); sub(0, 1, 1); sub(0, 0.84, 0.62); c.fillStyle = COL.hull; c.fill('evenodd');
    c.lineWidth = 1.6; c.beginPath(); sub(0, 1, 1); c.stroke(); c.lineWidth = 1.2; c.beginPath(); sub(0, 0.84, 0.62); c.stroke();
    c.restore();
    if (!(v.crew || 0) && v.aboard && heroY != null) {        // alone: the paddle in his hands, down the near side into the water, stroking as the boat moves
      var mv = Math.min(1, speedOf(v) / 60), st = mv > 0.05 ? Math.sin(clock * (3 + mv * 3)) : -1, fx = Math.cos(v.h), fy = Math.sin(v.h) * K;
      var hx = v.x + Math.cos(v.h) * (v.seat || 0), hy = heroY * K - 9, gx = hx + 3, gy = hy, ex = hx + 7 + fx * st * 9, ey = heroY * K + 13 + fy * st * 9 - (st > 0 ? 0 : 3 * (1 - mv));
      c.save(); c.lineCap = 'round'; c.strokeStyle = LINE; c.lineWidth = 3.4; c.beginPath(); c.moveTo(gx - 2, gy - 6); c.lineTo(ex, ey); c.stroke(); c.strokeStyle = shadeHex(COL.deck, -10); c.lineWidth = 1.8; c.stroke();
      c.beginPath(); c.ellipse(ex, ey, 2.6, 4.2, Math.atan2(ey - gy, ex - gx) + Math.PI / 2, 0, 7); c.fillStyle = shadeHex(COL.deck, -10); c.fill(); c.lineWidth = 1; c.strokeStyle = LINE; c.stroke();
      if (mv > 0.05 && st > 0.3) { c.strokeStyle = 'rgba(235,250,255,0.6)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(ex, ey + 2, 5 + st * 3, 2 + st, 0, 0, 7); c.stroke(); }   // the blade stirs the water
      c.restore();
    }
  }

/* ---------- the Shipyard scene: a clear yard of grass in a wooden frame, the parts down the left, the hero in a corner,
   and the build cursor laying parts. The host (the game, the Sea Editor) gives it a hero, costs, sounds, a grass tile,
   saving and what happens on Finish; the scene keeps the yard, the pick, the cursor and the frame. ---------- */
function wood(c, x, y, w, h) {            // a wooden board with planks, a dark rim and iron rivets at the corners
  c.save();
  c.fillStyle = '#4a2e1c'; c.beginPath(); c.roundRect(x, y, w, h, 4); c.fill();
  c.beginPath(); c.roundRect(x + 2.5, y + 2.5, w - 5, h - 5, 3); c.clip();
  c.fillStyle = '#7a5236'; c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(60,35,20,0.55)'; c.lineWidth = 1;
  for (var py = y + 2.5 + 9; py < y + h - 3; py += 9) { c.beginPath(); c.moveTo(x, py); c.lineTo(x + w, py); c.stroke(); }
  c.strokeStyle = 'rgba(255,225,170,0.08)'; for (var gx = x + 6; gx < x + w; gx += 11) { c.beginPath(); c.moveTo(gx, y); c.lineTo(gx + 3, y + h); c.stroke(); }
  c.restore();
  c.strokeStyle = '#2e1a10'; c.lineWidth = 1.4; c.beginPath(); c.roundRect(x, y, w, h, 4); c.stroke();
  c.fillStyle = '#7d8290'; c.strokeStyle = '#2e1a10'; c.lineWidth = 0.8;
  [[x + 5, y + 5], [x + w - 5, y + 5], [x + 5, y + h - 5], [x + w - 5, y + h - 5]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 1.7, 0, 7); c.fill(); c.stroke(); });
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
    if (t.wreck) { var p = this.yard.cells[t.idx]; h.pay(partOf(p.id).cost, 1); this.yard.cells.splice(t.idx, 1); h.sfx('build'); h.save(); return true; }
    if (!first) return false;
    h.pay(t.part.cost); this.yard.cells.push({ id: t.part.id, i: t.i, j: t.j }); h.sfx('build'); h.save(); return true;
  },
  check: function () { return this.yard ? yardCheck(this.yard) : ''; },
  floor: function (c) {                   // the yard's ground, in world space, with the laid parts
    var Y = this.Y, i, j;
    for (j = -2; j < Y.H + 2; j++) for (i = -2; i < Y.W + 2; i++) this.host.tile(c, i + 40, j + 40, Y.X + i * T, (Y.Y + j * T) * K, T + 0.4, TS + 0.4);
    c.fillStyle = 'rgba(70,50,30,0.16)'; c.fillRect(Y.X, Y.Y * K, Y.W * T, Y.H * TS);
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 0.8; c.setLineDash([2, 3]); c.beginPath();
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
      c.fillStyle = hp === k ? '#5c3e2a' : '#3e2718'; c.fillRect(r.x, r.y, r.w, r.h);
      c.strokeStyle = on ? '#ffd34d' : 'rgba(0,0,0,0.5)'; c.lineWidth = on ? 1.4 : 1; c.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      c.globalAlpha = can ? 1 : 0.4; drawYardPart(c, pt, r.x + (pt.w === 2 ? 1 : 7), r.y + 4, pt.w === 2 ? 0.44 : 0.7); c.globalAlpha = 1;
      c.font = '600 4.2px system-ui, sans-serif'; c.fillStyle = 'rgba(246,226,184,0.85)'; c.textAlign = 'center'; c.fillText(pt.name, r.x + r.w / 2, r.y + r.h - 2.5);
    }
    YARD_PLANS.forEach(function (pl, k) { var r = self.planRect(k), on = self.yard.plan === pl[0]; c.fillStyle = on ? 'rgba(255,230,180,0.26)' : 'rgba(0,0,0,0.28)'; c.fillRect(r.x, r.y, r.w, r.h); c.font = (on ? 'bold ' : '600 ') + '6px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = on ? '#f6e2b8' : 'rgba(246,226,184,0.7)'; c.fillText(pl[1], r.x + r.w / 2, r.y + 7.5); });
    var line = why || 'The hull is sound. Finish to launch it.';
    c.font = '600 7px system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 2.6; c.strokeStyle = '#2e1a10'; c.strokeText(line, 270, 14); c.fillStyle = why ? '#ffe9a8' : '#9be58b'; c.fillText(line, 270, 14);
    if (!why) { var fr = this.finishRect(), hv = ms && ms.x >= fr.x && ms.x <= fr.x + fr.w && ms.y >= fr.y && ms.y <= fr.y + fr.h; c.fillStyle = hv ? '#3f7d2e' : '#2f5f24'; c.beginPath(); c.roundRect(fr.x, fr.y, fr.w, fr.h, 2); c.fill(); c.strokeStyle = '#1d1622'; c.lineWidth = 1; c.stroke(); c.font = 'bold 6.5px system-ui, sans-serif'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('Finish  (Enter)', fr.x + fr.w / 2, fr.y + 8.5); }
    if (hp >= 0) { var pp = PL[hp], tt = pp.name + '  ' + h.costText(pp.cost) + '.  ' + pp.text; c.font = '600 6px system-ui, sans-serif'; c.textAlign = 'left'; c.lineWidth = 2.4; c.strokeStyle = '#2e1a10'; c.strokeText(tt, P.x + P.cell + 16, this.palRect(hp).y + 8); c.fillStyle = '#fff'; c.fillText(tt, P.x + P.cell + 16, this.palRect(hp).y + 8); }
    if (this.label && ms && hp < 0) { c.font = '600 6.5px system-ui, sans-serif'; var gw = c.measureText(this.label.text).width + 10, gx = Math.max(2, Math.min(398 - gw, ms.x + 8)), gy = Math.max(12, ms.y - 6); c.fillStyle = 'rgba(20,16,30,0.82)'; c.fillRect(gx, gy - 8, gw, 12); c.fillStyle = this.label.bad ? '#ff9a8a' : '#fff'; c.textAlign = 'left'; c.fillText(this.label.text, gx + 5, gy + 1); }
    c.font = '600 5px system-ui, sans-serif'; c.lineWidth = 2; c.strokeStyle = '#2e1a10'; c.textAlign = 'left'; c.strokeText('Right click takes a part back.  E leaves the yard.', 52, 242); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText('Right click takes a part back.  E leaves the yard.', 52, 242);
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

return { scene: scene, wood: wood, PARTS: ALL_PARTS, PLAN_LIST: YARD_PLANS, LAYERS: LAYERS, PLANS: PLANS, RAFT_DEFAULT: RAFT_DEFAULT, CW: CW, CH: CH,
  partsFor: partsFor, connected: yardConnected, parts: yardParts, at: yardAt, partOf: partOf, check: yardCheck, hullCells: hullCells,
  drawPart: drawYardPart, fit: fitVessel, drawVessel: drawVessel, drawVesselFront: drawVesselFront, drawOar: drawOar };
})();
if (typeof module !== 'undefined') module.exports = Yard;
