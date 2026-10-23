// The big island, played by script (2026-10-23, Robin: "go to the bigger island and progress as much as you can there"): the
// first village, Old Aslak's story, the mountain's slope, a cliff vein of copper, the troll's cave to Hogni's ring and out,
// an adder for its blood, the furnace, a claim stone, the carver's bench. Run in the page after tools/visual/startplay.js
// (the same way: drive.js, document.write, then this file), ONE STEP A CALL, from a game that stands on the big island (BI.go()
// puts the hero on the shore by the first village with tools in the bag and the keys of chapter 1 set, for a run that skips
// the first island). What it found is docs/big-island-run.md.
//   BI.go()  BI.village()  BI.aslak()  BI.slope()  BI.vein()  BI.cave()  BI.ring()  BI.out()  BI.adder()  BI.furnace()  BI.stone()
window.BI = (function () {
  function D() { return Combat.api.debug(); } function P() { return Combat.dbg().P; } function W() { return D().world(); }
  function step(n) { for (var i = 0; i < (n || 1); i++) H2.step(1); }
  function key(code) { Combat.key(code, true); step(2); Combat.key(code, false); step(2); }
  function navWalk(x, y, r) {                 // along a village's own grid where there is one (the walls, the fences), else straight at it
    var navs = D().navs(), p = P(), g = null, k; for (k in navs) if (navs[k].inside(p.x, p.y) || navs[k].inside(x, y)) g = navs[k];
    var pth = g ? g.path(p.x, p.y, x, y, false) : null, pts = Array.isArray(pth) ? pth : [], used = 0;
    pts.forEach(function (q) { used += ST.walkTo(q.x, q.y, 14, 600); }); used += ST.walkTo(x, y, r || 24, 900);
    return { pts: pts.length, used: used, at: [Math.round(p.x), Math.round(p.y)], dist: Math.round(Math.hypot(x - p.x, y - p.y)) };
  }
  function village0() { return D().villages()[0]; }
  function aslakF() { return D().folk().filter(function (f) { return f.aslak; })[0]; }
  var BI = { navWalk: navWalk };
  BI.go = function () {                       // the hero on the big island, 1000 units west of the first village, with the first tools
    var d = D(), p = P(), w = W(), v = village0(), cy = (v.ty + v.h / 2) * 32, x = v.tx * 32 - 1000; while (!w.isLand(x, cy) && x < v.tx * 32) x += 32;
    d.addItem('wood', 24); d.addItem('stone', 12); d.addItem('fiber', 12); d.addItem('berries', 6);
    ['flintAxe', 'flintPick', 'woodClub', 'woodBow'].forEach(function (id) { var r = d.recipes2.filter(function (q) { return q.id === id; })[0]; if (r) d.craft(r); for (var i = 0; i < 200; i++) d.tick(1 / 60); });
    d.seen.build = 1; d.seen.raft = 1; d.seen.slept = 1; p.x = x; p.y = cy; step(30);
    return 'on the big island at ' + Math.round(p.x) + ',' + Math.round(p.y) + ', ' + v.name + ' (' + v.arch + ') 1000 units east; ' + JSON.stringify(ST.inv());
  };
  BI.village = function () {                  // in at the gate (the ways in say where) and to the green's fire
    var v = village0(), V = v.V, g = (V.ways || []).filter(function (q) { return q.kind === 'gate'; })[0], p = P();
    if (!g) return 'no gate in ' + v.name;
    var out = ST.walkTo(g.x, g.y + 120, 16, 3000), inn = ST.walkTo(g.x, g.y - 120, 16, 900);
    var fire = null; D().B.items.forEach(function (it) { if ((it.name === 'firePit' || it.hearth) && !it.lvl && it.x > v.tx * 32 && it.x < (v.tx + v.w) * 32 && it.y > v.ty * 32 && it.y < (v.ty + v.h) * 32 && (!fire || it.name === 'firePit')) fire = it; });
    var r = fire ? navWalk(fire.x, fire.y + 50, 30) : null;
    return v.name + ': to the gate in ' + out + ' frames, in ' + inn + ', ' + (r ? 'to the fire ' + JSON.stringify(r) : 'no fire') + '; wall ' + (V.fence && V.fence.kind) + '; at ' + Math.round(p.x) + ',' + Math.round(p.y);
  };
  BI.aslak = function () {                    // Old Aslak's story, a line a talk
    var d = D(), p = P(), al = aslakF(); if (!al) return 'no Old Aslak in ' + village0().name + ' (' + village0().arch + ')';
    var lines = [], t;
    for (t = 0; t < 8; t++) { if (Math.hypot(al.x - p.x, al.y - p.y) > 40) navWalk(al.x, al.y + 22, 28); var w = d.eDo(); if (!w || !/Talk/.test(w.say)) { ST.walkTo(al.x + 18, al.y + 10, 8, 120); continue; } var b = d.seen.aslakI; w.act(); step(30); lines.push((d.seen.aslakI !== b ? 'story: ' : 'remark: ') + al.say); if (d.seen.aslakI === b) break; }
    return lines.join('\n') + '\nhis story told: ' + (d.seen.aslakI || 0) + ' lines';
  };
  BI.slope = function () {                    // up the nearest slope to the foothills, then the next to the plateau
    var w = W(), m = w.mt, p = P(), out = [];
    function up(n) { var best = null, bd = 1e9; m.ramps.forEach(function (r) { if (r.n !== n || r.gap) return; var dd = Math.hypot(r.x1 - p.x, r.y1 - p.y); if (dd < bd) { bd = dd; best = r; } }); if (!best) return 'no slope to level ' + n; var f1 = ST.walkTo(best.x1, best.y1 + 60, 18, 3000), f2 = ST.walkTo(best.x0, best.y0 - 80, 18, 900); return 'slope to ' + n + ': ' + f1 + ' + ' + f2 + ' frames, level now ' + w.levelAt(p.x, p.y); }
    out.push(up(1)); out.push(up(2)); return out.join('\n');
  };
  BI.vein = function () {                     // the nearest cliff vein, mined from the ground below it
    var d = D(), w = W(), p = P(), v = null, bd = 1e9; w.mt.veins.forEach(function (q) { if (!(q.left > 0)) return; var dd = Math.hypot(q.x - p.x, q.y - p.y); if (dd < bd) { bd = dd; v = q; } }); if (!v) return 'no vein left';
    var c0 = ST.inv().copper || 0, f = ST.walkTo(v.x, v.y + 48, 6, 3000); p.mode = 'gather'; key('Digit2'); Combat.key('KeyW', true); step(3); Combat.key('KeyW', false);
    var k = 0; Combat.key('KeyJ', true); for (; k < 1500 && (v.left || 0) > 0; k++) step(1); Combat.key('KeyJ', false); step(60); ST.pick(160); p.mode = 'fight';
    return 'the vein at ' + Math.round(v.x) + ',' + Math.round(v.y) + ': reached in ' + f + ' frames (' + Math.round(Math.hypot(v.x - p.x, v.y - p.y)) + ' off), mined ' + k + ' frames: copper +' + ((ST.inv().copper || 0) - c0) + ', seen.copper ' + !!d.seen.copper;
  };
  BI.cave = function () {                     // to the mouth and in, then along the cave's own way to within sight of the lair
    var d = D(), w = W(), p = P(), cm = w.mt.cave, f = ST.walkTo(cm.x, cm.y + 30, 10, 3000), e = d.eWhat(), q = d.eDo(); if (q && /Enter/.test(q.say)) q.act(); step(40); if (!d.inCave()) return 'not in: E said ' + e + ' at ' + Math.round(p.x) + ',' + Math.round(p.y);
    var r = d.recipes2.filter(function (x) { return x.id === 'torch'; })[0]; if (r && !(ST.inv().torch > 0)) { d.craft(r); for (var i = 0; i < 120; i++) d.tick(1 / 60); } H2.keyev('KeyT', true); step(2); H2.keyev('KeyT', false);
    var cv = d.cave(), G = Combat.dbg(), tr = function () { return G.W.enemies.filter(function (x) { return !x.dead && x.kind === 'troll'; })[0]; }, used = 0, k = 0, stop = null;
    for (; k < cv.path.length; k++) { var pt = cv.path[k]; used += ST.walkTo(pt.x, pt.y, 16, 240); var t = tr(), td = t ? Math.hypot(t.x - p.x, t.y - p.y) : 9999; if (p.hp < 45 || td < 260 || p.dead) { stop = { k: k, hp: Math.round(p.hp), troll: Math.round(td) }; break; } }
    return 'in the cave (' + f + ' frames to the mouth), torch ' + d.torch().on + '; the way through: ' + k + ' of ' + cv.path.length + ' points in ' + used + ' frames' + (stop ? ', stopped: ' + JSON.stringify(stop) : '') + '; the body ' + Math.round(Math.hypot(cv.body.x - p.x, cv.body.y - p.y)) + ' off';
  };
  BI.ring = function () {                     // round the lair to Hogni and the arm ring
    var d = D(), p = P(), cv = d.cave(), b = cv.body, seen = null, leg;
    for (leg = 0; leg < 12 && Math.hypot(b.x - p.x, b.y - p.y) > 34 && !p.dead; leg++) { ST.walkTo(b.x, b.y + 10, 30, 90); if (!seen && d.trollSeesIn()) seen = leg; }
    step(10); var q = d.eDo(), took = q && /ring/i.test(q.say); if (took) { q.act(); step(60); }
    return (took ? 'the arm ring taken' : 'E said ' + (q && q.say)) + (seen != null ? '; the troll SAW you at leg ' + seen : '; the troll never saw you') + '; health ' + Math.round(p.hp) + '; ring ' + JSON.stringify(d.ring());
  };
  BI.out = function () {                      // back along the way and out
    var d = D(), p = P(), cv = d.cave(), pth = cv.path.slice().reverse(), used = 0, seen = null, k; for (k = 0; k < pth.length && !p.dead; k++) { used += ST.walkTo(pth[k].x, pth[k].y, 16, 240); if (seen == null && d.trollSeesIn()) seen = k; }
    ST.walkTo(cv.entrance.x, cv.entrance.y + 20, 8, 300); step(10); var q = d.eDo(); if (q && /Leave/.test(q.say)) { q.act(); step(40); }
    return 'out: ' + !d.inCave() + ' after ' + used + ' frames' + (seen != null ? ', the troll saw you at ' + seen : '') + '; health ' + Math.round(p.hp);
  };
  BI.adder = function () {                    // the nearest adder, put at 200 units if it is far (they live far from the mountain), fought with the club
    var d = D(), p = P(), w = W(), G = Combat.dbg(), s = null, bd = 1e9; G.W.enemies.forEach(function (e) { if (e.dead || e.kind !== 'snake') return; var dd = Math.hypot(e.x - p.x, e.y - p.y); if (dd < bd) { bd = dd; s = e; } }); if (!s) return 'no adder';
    var d0 = Math.round(bd), walked = bd < 1500 ? ST.walkTo(s.x, s.y, 120, 2400) : 0; if (Math.hypot(s.x - p.x, s.y - p.y) > 200) { var a = Math.atan2(p.y - s.y, p.x - s.x), tx = s.x + Math.cos(a) * 200, ty = s.y + Math.sin(a) * 200; p.x = w.isLand(tx, ty) ? tx : s.x + 180; p.y = w.isLand(tx, ty) ? ty : s.y; }
    p.mode = 'fight'; step(20); key('Digit3'); var hp0 = p.hp, fr = 0, hits = 0, lh = s.hp;
    for (; fr < 1800 && !s.dead && !p.dead; fr++) { var dx = s.x - p.x, dy = s.y - p.y, dd = Math.hypot(dx, dy); Combat.key('KeyD', dx > 6 && dd > 28); Combat.key('KeyA', dx < -6 && dd > 28); Combat.key('KeyS', dy > 6 && dd > 28); Combat.key('KeyW', dy < -6 && dd > 28); if (dd < 50 && fr % 18 === 0) { Combat.key('KeyJ', true); step(2); Combat.key('KeyJ', false); } step(1); if (s.hp < lh) { hits++; lh = s.hp; } }
    ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ'].forEach(function (c) { Combat.key(c, false); }); step(120); ST.pick(220);
    return 'the adder was ' + d0 + ' off' + (walked ? ', walked ' + walked + ' frames' : ', put down by it') + ': ' + (s.dead ? 'dead' : 'alive') + ' after ' + fr + ' frames and ' + hits + ' blows, cost ' + Math.round(hp0 - p.hp) + ' health; ' + JSON.stringify(ST.inv());
  };
  function placeNear(id, cx, cy) {
    var d = D(), pi = d.pieceIndex(id), spot = null, whys = {}, tx0 = Math.floor(cx / 32), ty0 = Math.floor(cy / 32), r, dy, dx; if (pi == null || pi < 0) return { no: 'no piece ' + id };
    for (r = 1; r < 10 && !spot; r++) for (dy = -r; dy <= r && !spot; dy++) for (dx = -r; dx <= r && !spot; dx++) { if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; var x = (tx0 + dx + 0.5) * 32, y = (ty0 + dy + 0.5) * 32, tg = d.target(pi, x, y); if (tg && tg.ok) spot = [x, y]; else if (tg) whys[tg.why || '?'] = (whys[tg.why || '?'] || 0) + 1; }
    if (!spot) return { no: whys }; ST.walkTo(spot[0] + 30, spot[1] + 24, 10, 900); P().mode = 'build'; var pl = d.place(pi, spot[0], spot[1]); step(5); P().mode = 'fight'; return { spot: spot, ok: pl && pl.ok, why: pl && pl.why };
  }
  BI.furnace = function () {                  // a furnace and a campfire where the hero stands, the night to dawn for the embers, a copper bar
    var d = D(), p = P(), fu = placeNear('furnace', p.x, p.y), cf = placeNear('campfire', p.x + 96, p.y + 64); d.day(1736); for (var i = 0; i < 4200 && d.day().n < 2; i++) d.tick(1 / 60); step(3); ST.pick(160);
    var fx = fu.spot ? fu.spot[0] : p.x, fy = fu.spot ? fu.spot[1] : p.y; ST.walkTo(fx + 30, fy + 26, 10, 600); var ok = d.work('copperBar', 1); step(700);
    return 'furnace ' + JSON.stringify(fu) + ', campfire ' + JSON.stringify(cf) + '; at dawn ' + (ST.inv().charcoal || 0) + ' charcoal picked; the bar started: ' + ok + '; ' + JSON.stringify(ST.inv());
  };
  BI.stone = function () {                    // a claim stone and a carver's bench by the hero, and the ring board at the bench
    var d = D(), p = P(), cs = placeNear('claim', p.x + 120, p.y + 60), cb = placeNear('carver', p.x - 120, p.y + 60), it = null; d.B.items.forEach(function (q) { if (q.carver) it = q; }); if (it) ST.walkTo(it.x + 10, it.y + 30, 10, 600); step(10);
    var e = d.eWhat(), q = d.eDo(); if (q && /Cut/.test(q.say)) q.act(); step(10); var open = d.ringOpen ? d.ringOpen() : null; H2.keyev('Escape', true); step(2); H2.keyev('Escape', false);
    return 'stone ' + JSON.stringify(cs) + ' (' + d.B.items.filter(function (x) { return x.claim; }).map(function (x) { return x.named; }).join(', ') + '); bench ' + JSON.stringify(cb) + '; E at it: ' + e + '; Arnor joined: ' + !!(d.npc() && d.npc().joined) + '; runes learnt: ' + Object.keys(d.runes().learnt).join(', ');
  };
  return BI;
})();
