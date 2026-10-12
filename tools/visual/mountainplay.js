// The mountain scene's playtest, run in the page (2026-10-12). The browser pane stops animating when hidden, so:
//   1. open dist/game.html?scene=mountain            2. load tools/visual/drive.js in it (a script tag)
//   3. document.open(); document.write(await (await fetch(location.href)).text()); document.close();   (the page's frames are now ours)
//   4. load this file, then call MT.all() (or one test). Each returns lines of text to read against what it says.
// The tests: MT.slopes (up and down every kind of slope), MT.T2 (try to get through the cliffs: from ground beside every edge, walk,
// sprint and dash in every direction; no frame may be inside rock and no level may change without a slope), MT.hut (a hut on a
// level), MT.refusals (what the build cursor says on a face, a rim and a slope), MT.cave, MT.troll, MT.arrows.
window.MT = (function () {
  function D() { return Combat.api.debug(); } function P() { return Combat.dbg().P; } function W() { return D().world(); }
  function step(n) { for (var i = 0; i < n; i++) { var p = P(); p.hp = p.maxHp || 100; H2.step(1); } }
  function walk(codes, n, each) { codes.forEach(function (c) { Combat.key(c, true); }); for (var i = 0; i < n; i++) { step(1); if (each) each(i); } codes.forEach(function (c) { Combat.key(c, false); }); step(4); }
  function tp(x, y) { var p = P(); p.x = x; p.y = y; p.vx = p.vy = 0; step(2); }
  function lv() { var p = P(); return W().levelAt(p.x, p.y); }
  var MT = { D: D, P: P, W: W, step: step, walk: walk, tp: tp, lv: lv };
  MT.slopes = function () {
    var w = W(), m = w.mt, out = [];
    [1, 2].forEach(function (n) { var r = m.ramps.filter(function (q) { return q.n === n && !q.gap; })[0]; if (!r) return; tp(r.x1, r.y1 + 40); var l0 = lv(); walk(['KeyW'], 330); out.push('slope to level ' + n + ': up from ' + l0 + ' to ' + lv()); walk(['KeyS'], 330); out.push('and down again to ' + lv()); });
    return out.join('\n');
  };
  MT.T2 = function (N, seed) {
    var w = W(), m = w.mt, s = seed || 7, R = function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }, starts = [], i, j;
    for (j = 4; j < m.h - 4; j += 3) for (i = 4; i < m.w - 4; i += 3) { var c = m.CL[j * m.w + i]; if (c & 48) continue; var x = (m.x0 + i + 0.5) * m.MC, y = (m.y0 + j + 0.5) * m.MC; if (!w.isLand(x, y)) continue; var near = false; for (var a = 0; a < 8 && !near; a++) if (w.cliffAt(x + Math.cos(a * 0.785) * 26, y + Math.sin(a * 0.785) * 26)) near = true; if (near) starts.push([x, y]); }
    var KEYS = [['KeyW'], ['KeyS'], ['KeyA'], ['KeyD'], ['KeyW', 'KeyA'], ['KeyW', 'KeyD'], ['KeyS', 'KeyA'], ['KeyS', 'KeyD']], inRock = 0, jumps = [], t;
    for (t = 0; t < N; t++) {
      var st = starts[Math.floor(R() * starts.length)], p = P(); p.x = st[0]; p.y = st[1]; p.vx = p.vy = 0; D().tick(1 / 60);
      var l0 = w.levelAt(p.x, p.y), keys = KEYS[Math.floor(R() * 8)].slice(), ramp = false, f; if (R() < 0.35) keys.push('ShiftLeft'); var dashAt = R() < 0.4 ? 8 + Math.floor(R() * 30) : -1;
      keys.forEach(function (k) { Combat.key(k, true); });
      for (f = 0; f < 80; f++) { if (f === dashAt) Combat.key('Space', true); if (f === dashAt + 2) Combat.key('Space', false); p = P(); p.hp = p.maxHp || 100; D().tick(1 / 60); p = P(); if (w.cliffAt(p.x, p.y)) inRock++; if (w.rampAt(p.x, p.y)) ramp = true; }
      keys.forEach(function (k) { Combat.key(k, false); }); Combat.key('Space', false); D().tick(1 / 60); p = P();
      var l1 = w.levelAt(p.x, p.y); if (l1 !== l0 && !ramp) jumps.push([Math.round(st[0]), Math.round(st[1]), keys.join('+'), l0, l1]);
    }
    return 'cliffs: ' + N + ' tries from ' + starts.length + ' places; frames inside rock ' + inRock + ', levels changed without a slope ' + jumps.length + (jumps.length ? ' ' + JSON.stringify(jumps.slice(0, 4)) : '');
  };
  MT.hut = function (lvl) {
    var w = W(), T = 32, m = w.mt, r2 = m.ramps.filter(function (q) { return q.n === lvl && !q.gap; })[0], sp = null, dx, dy, a, b; if (!r2) return 'no slope to level ' + lvl;
    for (dy = -140; dy > -900 && !sp; dy -= 32) for (dx = -260; dx <= 260 && !sp; dx += 32) {
      var tx = Math.floor((r2.x0 + dx) / T), ty = Math.floor((r2.y0 + dy) / T), ok = true;
      for (b = -1; b <= 4 && ok; b++) for (a = -1; a <= 5; a++) if (w.code(tx + a, ty + b) === 5 || w.code(tx + a, ty + b) < 2 || w.levelAt((tx + a + 0.5) * T, (ty + b + 0.5) * T) !== lvl) { ok = false; break; }
      if (ok) { var blocked = false; w.around((tx + 2) * T, (ty + 1.5) * T, function (o) { if (o.r && Math.abs(o.x - (tx + 2) * T) < 110 && Math.abs(o.y - (ty + 1.5) * T) < 90) blocked = true; }); if (!blocked) sp = { tx: tx, ty: ty }; }
    }
    if (!sp) return 'no room found for a hut on level ' + lvl;
    var pi = function (id, mm) { return D().pieceIndex(id, mm); }, res = { ok: 0, bad: [] }, x, y;
    function put(i, px, py) { var p = P(); p.x = px + 12; p.y = py + 40; p.vx = p.vy = 0; var r = D().place(i, px, py); if (r && r.ok) res.ok++; else res.bad.push((r ? r.why : 'null') + '@' + Math.round(px) + ',' + Math.round(py)); }
    for (x = sp.tx; x < sp.tx + 4; x++) { put(pi('wall', 0), (x + 0.5) * T, sp.ty * T); put(x === sp.tx + 1 ? pi('door', 0) : pi('wall', 0), (x + 0.5) * T, (sp.ty + 3) * T); }
    for (y = sp.ty; y < sp.ty + 3; y++) { put(pi('wall', 0), sp.tx * T, (y + 0.5) * T); put(y === sp.ty + 1 ? pi('window', 0) : pi('wall', 0), (sp.tx + 4) * T, (y + 0.5) * T); }
    for (y = sp.ty; y < sp.ty + 3; y++) for (x = sp.tx; x < sp.tx + 4; x++) put(pi('floor', 0), (x + 0.5) * T, (y + 0.5) * T);
    P().mode = 'fight'; var ri = D().roomsNow(), rid = ri && ri.at ? ri.at(sp.tx + 1, sp.ty + 1) : -9; MT.hutAt = sp; var p = P(); p.x = (sp.tx + 2) * T; p.y = (sp.ty + 1.6) * T; step(20);
    return 'a hut on level ' + lvl + ': placed ' + res.ok + ' of 26 pieces, refused ' + JSON.stringify(res.bad.slice(0, 4)) + ', it is room ' + rid + ' (a room when 0 or more)';
  };
  MT.refusals = function () {
    var w = W(), T = 32, m = w.mt, out = [], pi = function (id, mm) { return D().pieceIndex(id, mm); }, camp = -1; D().pieces().forEach(function (p, i) { if (p.prop === 'campfire' && camp < 0) camp = i; });
    function ask(label, i, x, y) { var p = P(); p.x = x + 20; p.y = y + 50; var t = D().target(i, x, y); out.push(label + ': ' + (t ? (t.ok ? 'ALLOWED' : 'refused (' + t.why + ')') : 'no target')); }
    function find(test) { for (var j = 6; j < m.h - 6; j += 2) for (var i = 6; i < m.w - 6; i += 2) if (test(m.CL[j * m.w + i], i, j)) return { x: (m.x0 + i + 0.5) * m.MC, y: (m.y0 + j + 0.5) * m.MC }; return null; }
    var face = find(function (c, i, j) { return (c & 4) && (m.CL[(j + 3) * m.w + i] & 4) && (m.CL[(j - 3) * m.w + i] & 4); }), rim = find(function (c) { return (c & 8) !== 0; }), rm = m.ramps.filter(function (q) { return !q.gap; })[0], slope = { x: (rm.x0 + rm.x1) / 2, y: (rm.y0 + rm.y1) / 2 };
    [['a cliff face', face], ['a rim', rim], ['a slope', slope]].forEach(function (q) { var tx = Math.floor(q[1].x / T), ty = Math.floor(q[1].y / T); ask('floor on ' + q[0], pi('floor', 0), (tx + 0.5) * T, (ty + 0.5) * T); ask('wall on ' + q[0], pi('wall', 0), (tx + 0.5) * T, ty * T); ask('post on ' + q[0], pi('post', 0), tx * T, ty * T); ask('campfire on ' + q[0], camp, q[1].x, q[1].y); });
    var ff = w.nearFlat(rm.x1 + 120, rm.y1 + 20, rm.n - 1, 40); if (ff) { ask('floor on level ground by the foot of the face (should be allowed)', pi('floor', 0), (Math.floor(ff.x / T) + 0.5) * T, (Math.floor(ff.y / T) + 0.5) * T); ask('campfire there (should be allowed)', camp, ff.x, ff.y); }
    P().mode = 'fight'; return out.join('\n');
  };
  MT.cave = function () {
    var w = W(), cm = D().caveMouth(), out = []; if (!cm) return 'no cave';
    tp(cm.x, cm.y + 30); out.push('the mouth (' + cm.name + ') opens on level ' + w.levelAt(cm.x, cm.y + 30) + '; E works before it: ' + D().caveUsable()); tp(cm.x + 90, cm.y + 30); out.push('90 to the side: ' + D().caveUsable());
    tp(cm.x, cm.y + 30); D().caveSwap(true); step(20); out.push('inside: ' + D().inCave()); D().caveSwap(false); step(10); var p = P(); out.push('out again: on land ' + w.isLand(p.x, p.y) + ', level ' + w.levelAt(p.x, p.y));
    return out.join('\n');
  };
  MT.troll = function () {
    var w = W(), cm = D().caveMouth(), q = w.nearFlat(cm.x + 500, cm.y + 300, null); tp(q.x, q.y); D().act('trollout'); var t = D().troll(); if (!t) return 'no troll'; var inRock = 0, far = 0, f;
    for (f = 0; f < 1500; f++) { var p = P(); p.hp = p.maxHp || 100; D().tick(1 / 60); t = D().troll(); if (!t) break; if (w.cliffAt(t.x, t.y)) inRock++; far = Math.max(far, Math.hypot(t.x - cm.x, t.y - cm.y)); }
    D().act('trollhome'); D().day(300); return 'the troll outside for 25 s: frames in rock ' + inRock + ', strolled ' + Math.round(far) + ' from the mouth (more than 50 means he walks)';
  };
  MT.arrows = function () {
    var w = W(), m = w.mt, rm = m.ramps.filter(function (q) { return q.n === 1 && !q.gap; })[0], x = rm.ex + 160, foot = w.nearFlat(x, rm.ey + m.HFW + 30, 0, 14), up = w.nearFlat(x, rm.ey - 40, 1, 14); if (!foot || !up) return 'no place';
    var e = Combat.dbg().W.enemies.filter(function (q) { return q.kind === 'boar' && !q.dead; })[0]; e.x = up.x; e.y = up.y; e.hold = true; e.hp = e.maxHp = 50; D().day(300); tp(foot.x, foot.y);
    var hp0 = e.hp, i; Combat.key('Digit2', true); step(2); Combat.key('Digit2', false); step(4);
    for (i = 0; i < 6; i++) { Combat.mouse(e.x, e.y * 0.75); Combat.key('KeyJ', true); step(3); Combat.key('KeyJ', false); step(40); }
    Combat.key('Digit1', true); step(2); Combat.key('Digit1', false); e.hold = false; return 'six arrows from the foot of a cliff at a boar on its top, ' + Math.round(Math.hypot(e.x - foot.x, e.y - foot.y)) + ' away: it lost ' + (hp0 - e.hp).toFixed(1) + ' health (arrows fly over a cliff)';
  };
  MT.all = function () { return [MT.slopes(), MT.T2(120, 3), MT.hut(2), MT.hut(1), MT.refusals(), MT.cave(), MT.arrows(), MT.troll()].join('\n'); };
  return MT;
})();
