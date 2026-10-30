// Chapter 0 to the blót, played by script (2026-10-27, Robin: "Playtest from the beginning to the end of and including the Blot").
// Run in the page like tools/visual/startplay.js: open dist/game.html?mute=1 in the pane, load tools/visual/drive.js, wait a tenth of a
// second, H2.drop(), write the page again (fetch with cache 'reload'), then load this file and call the steps ONE A CALL (a tool call
// into the page must stay under about 45 real seconds). Each step returns a line to read; PL.snap() returns the canvas as a JPEG.
window.PL = (function () {
  function D() { return Combat.api.debug(); } function P() { return Combat.dbg().P; }
  var PL = { frames: 0, log: [] };
  function fast(n) { for (var i = 0; i < (n || 1); i++) { D().tick(1 / 60); PL.frames++; } }
  function draw(n) { for (var i = 0; i < (n || 1); i++) { if (!H2.step(1)) throw new Error('the game loop is dead: reload the page'); PL.frames++; } }
  function key(c, d) { Combat.key(c, d); } function clear() { ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'KeyJ', 'KeyK'].forEach(function (c) { key(c, false); }); }
  function tap(c) { key(c, true); fast(2); key(c, false); fast(2); }
  function pkey(code, k) { var o = { code: code, key: k || code, bubbles: true, cancelable: true }; document.dispatchEvent(new KeyboardEvent('keydown', o)); draw(2); document.dispatchEvent(new KeyboardEvent('keyup', o)); draw(2); }   // a key through the page's own handlers
  function inv() { var v = D().inv, o = {}; for (var k in v) if (v[k]) o[k] = v[k]; return o; }
  function clock() { var d = D().day(); return 'day ' + d.n + ' t' + Math.round(d.t); }
  function walkTo(x, y, r, max) {
    var best = 1e9, stall = 0, f = 0, side = 1; r = r || 12; max = max || 3000;
    for (; f < max; f++) { var p = P(), dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy); if (d < r || p.dead) break; if (d < best - 0.5) { best = d; stall = 0; } else stall++;
      var ax = dx, ay = dy, W = Combat.api.debug().world(), dl = Math.hypot(dx, dy) || 1; if (!W.isLand(p.x + dx / dl * 40, p.y + dy / dl * 40) && W.isLand(p.x, p.y)) { stall = Math.max(stall, 30); }   /* keep out of the sea: water ahead counts as a wall */
      if (stall > 25) { var k = stall > 90 ? 1.6 : 1; ax = dx - side * dy * k; ay = dy + side * dx * k; if (stall > 160) { side = -side; stall = 26; best = d + 30; } }
      key('KeyD', ax > 3); key('KeyA', ax < -3); key('KeyS', ay > 3); key('KeyW', ay < -3); fast(1); }
    clear(); return Math.hypot(x - P().x, y - P().y) < r + 2;
  }
  function face(x, y) { var p = P(); p.face = Math.atan2(y - p.y, x - p.x); p.faceVis = p.face; }
  function pick(radius) { var n = 0, g = 0; draw(30); for (;;) { var p = P(), ds = D().drops.filter(function (q) { return Math.hypot(q.x - p.x, q.y - p.y) < radius && !q.mine; }).sort(function (a, b) { return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y); }); if (!ds.length || g++ > 60) break; var b4 = D().drops.length; walkTo(ds[0].x, ds[0].y, 8, 900); fast(20); if (D().drops.length < b4) n++; } return n; }
  function nearest(test, from) { var b = null, bd = 1e9, p = from || P(); D().world().eachProp(function (o) { if (!test(o) || o.dying != null) return; var d = Math.hypot(o.x - p.x, o.y - p.y); if (d < bd) { bd = d; b = o; } }); return b; }
  function slotOf(kind, mat) { var sl = D().slots; for (var i = 0; i < 6; i++) if (sl[i] && sl[i].kind === 'item' && sl[i].item.kind === kind && (!mat || sl[i].item.mat === mat)) return i; return -1; }
  function take(kind, mat) { var i = slotOf(kind, mat); if (i < 0) return false; if (D().hand() !== i) pkey('Digit' + (i + 1), String(i + 1)); return D().hand() === i; }
  function make(id) { var r = D().recipes2.filter(function (q) { return q.id === id; })[0]; if (!r) return id + ': NO RECIPE'; var ok = D().craft(r); fast(150); return id + (ok === false ? ': refused' : ''); }
  function e(test) { var w = D().eWhat(); if (!w) return null; if (test && !test.test(w)) return 'E says "' + w + '"'; var say = D().eDo(); fast(10); return say; }
  function beasts(kind) { var G = Combat.dbg(), p = P(); return ((G.W && G.W.enemies) || []).filter(function (q) { return !q.dead && (!kind || q.kind === kind); }).sort(function (a, b) { return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y); }); }
  function snap(q) { draw(2); var cv = document.querySelector('canvas'); return cv.toDataURL('image/jpeg', q || 0.82); }
  function note(s) { PL.log.push(s); return s; }
  PL.fast = fast; PL.draw = draw; PL.key = key; PL.tap = tap; PL.pkey = pkey; PL.inv = inv; PL.clock = clock; PL.walkTo = walkTo; PL.face = face; PL.pick = pick; PL.nearest = nearest; PL.take = take; PL.make = make; PL.e = e; PL.beasts = beasts; PL.snap = snap; PL.note = note; PL.slotOf = slotOf; PL.clear = clear;
  return PL;
})();
// gathering: fell the nearest tree and take its trunk; mine the nearest rock
PL.fell = function () { var D = Combat.api.debug(), P = function () { return Combat.dbg().P; }; PL.take('axe'); var t = PL.nearest(function (o) { return o.kind === 'tree' && !o.fixed0; }); if (!t) return 'no tree'; var w0 = PL.inv().wood || 0; PL.walkTo(t.x - 22, t.y + 2, 6, 1800); PL.key('KeyD', true); PL.fast(6); PL.key('KeyD', false); PL.key('KeyJ', true); var i; for (i = 0; i < 2400 && t.dying == null && t.hp > 0; i++) PL.fast(1); PL.key('KeyJ', false); PL.draw(200); var tr = (typeof D.trunks === 'function' ? D.trunks() : D.trunks).filter(function (q) { return Math.hypot(q.x - P().x, q.y - P().y) < 260 && q.logs > 0; })[0]; if (tr) { PL.walkTo(tr.x - tr.len * 0.25, tr.y + 16, 6, 1200); PL.key('KeyW', true); PL.fast(6); PL.key('KeyW', false); PL.key('KeyJ', true); for (var j = 0; j < 1200 && tr.logs > 0; j++) PL.fast(1); PL.key('KeyJ', false); PL.draw(60); } PL.pick(260); return t.name + ' +' + ((PL.inv().wood || 0) - w0) + ' wood'; };
PL.mine = function () { PL.take('pick'); var r = PL.nearest(function (o) { return o.kind === 'stone'; }); if (!r) return 'no rock'; var s0 = PL.inv().stone || 0; PL.walkTo(r.x - 20, r.y + 2, 6, 1800); PL.key('KeyD', true); PL.fast(6); PL.key('KeyD', false); PL.key('KeyJ', true); for (var i = 0; i < 2400 && r.dying == null && r.hp > 0; i++) PL.fast(1); PL.key('KeyJ', false); PL.draw(80); PL.pick(160); return r.name + ' +' + ((PL.inv().stone || 0) - s0) + ' stone'; };
// a fight a little like a player's: guard (K) while the beast winds up or lunges, swing when it recovers or stands; switch to the cudgel when it is low
PL.fight = function (b, opt) {
  opt = opt || {}; var P = function () { return Combat.dbg().P; }, f = 0, hits = 0, hurt = 0, lb = b.hp, lh = P().hp, sw = false, parried = 0;
  for (; f < (opt.max || 4800) && !b.dead && b.state !== 'ko' && !P().dead; f++) {
    if (opt.cudgelAt != null && !sw && b.hp <= opt.cudgelAt) { PL.clear(); PL.take('cudgel'); sw = true; }
    var p = P(), dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy), danger = (b.state === 'windup' || b.state === 'lunge') && d < 90;
    var close = d < 44; PL.key('KeyD', !danger && !close && dx > 4); PL.key('KeyA', !danger && !close && dx < -4); PL.key('KeyS', !danger && !close && dy > 4); PL.key('KeyW', !danger && !close && dy < -4);
    PL.key('KeyK', danger); PL.key('KeyJ', !danger && d < 50 && f % 4 < 2); PL.fast(1);
    if (b.hp < lb) { hits++; lb = b.hp; } if (P().hp < lh) { hurt++; lh = P().hp; }
  }
  PL.clear(); PL.draw(10); return { ko: b.state === 'ko', dead: !!b.dead, t: Math.round(f / 60), hits: hits, hurt: hurt, hp: Math.round(P().hp), bhp: Math.round(b.hp * 10) / 10 };
};
// (2026-10-30, the two playthroughs after Arnor's quests moved into his talk) swings by taps (a held J is a charged swing), the bow aimed
// by the mouse point as the game aims it, Arnor's talk through the page's own E, and the arrows fetched before their minute is up
PL.hit = function (r, max) { var i = 0; for (; i < (max || 80) && r.dying == null && r.hp > 0; i++) { PL.key('KeyJ', true); PL.fast(6); PL.key('KeyJ', false); PL.fast(24); } PL.draw(40); return i; };
PL.punch = function (kind, n) { var got = []; for (var k = 0; k < n; k++) { var r = PL.nearest(function (o) { return o.kind === kind && !o.fixed0; }); if (!r) break; PL.walkTo(r.x - 18, r.y + 2, 6, 1800); PL.face(r.x, r.y); got.push(PL.hit(r)); PL.pick(40); } return got.join(',') + ' ' + JSON.stringify(PL.inv()); };
PL.trunk = function () { var D = Combat.api.debug(), P = Combat.dbg().P; var tr = D.trunks().filter(function (q) { return Math.hypot(q.x - P.x, q.y - P.y) < 300 && q.logs > 0; })[0]; if (!tr) return 'no trunk'; PL.walkTo(tr.x - tr.len * 0.25, tr.y + 16, 6, 1200); PL.key('KeyW', true); PL.fast(6); PL.key('KeyW', false); var j = 0; for (; j < 60 && tr.logs > 0; j++) { PL.key('KeyJ', true); PL.fast(6); PL.key('KeyJ', false); PL.fast(24); } PL.draw(60); PL.pick(260); return 'trunk ' + j; };
PL.chop = function (n) { var out = []; PL.take('axe'); for (var k = 0; k < n; k++) { var t = PL.nearest(function (o) { return o.kind === 'tree'; }); if (!t) break; PL.walkTo(t.x - 20, t.y + 2, 6, 1800); PL.face(t.x, t.y); var i = PL.hit(t, 60); PL.draw(150); out.push(i + ' ' + PL.trunk()); } return out.join(', ') + ' ' + JSON.stringify(PL.inv()); };
PL.grass = function (n) { var D = Combat.api.debug(); for (var k = 0; k < n; k++) { var g = PL.nearest(function (o) { return o.name === 'tallGrass' && !o.fixed0; }); if (!g) break; PL.walkTo(g.x, g.y + 6, 10, 1500); if (D.eWhat() === 'Pull grass') { D.eDo(); PL.draw(40); } g.fixed0 = 1; } return JSON.stringify(PL.inv()); };
PL.talkA = function (maxN) { var D = Combat.api.debug(), out = [], n = D.npc(); PL.walkTo(n.x - 20, n.y + 10, 12, 2500); PL.face(n.x, n.y); for (var k = 0; k < (maxN || 8); k++) { var ts = D.talkState(); if (!ts && D.eWhat() !== 'Talk') { out.push('[E:' + D.eWhat() + ']'); break; } PL.pkey('KeyE', 'e'); PL.draw(10); var t2 = D.talkState(); out.push((t2 ? t2.line : '(closed)') + (t2 && t2.more ? ' >' : '') + (D.npc().say && (!t2 || D.npc().say !== t2.line) ? ' {say:' + D.npc().say + '}' : '')); PL.fast(40); } return out.join(' / ') + ' || ' + JSON.stringify(Object.keys(D.seen.quests || {}).map(function (k) { var q = D.seen.quests[k]; return k.replace('quest.', '') + (q.done ? ':done' : ':open'); })); };
PL.shootAt = function (b, lead) { var aim = function () { Combat.mouse(b.x + (b.vx || 0) * (lead || 0), (b.y + (b.vy || 0) * (lead || 0)) * 0.75); }; aim(); PL.key('KeyK', true); for (var i = 0; i < 95; i++) { aim(); PL.fast(1); } aim(); PL.key('KeyJ', true); PL.fast(3); PL.key('KeyJ', false); PL.key('KeyK', false); PL.fast(40); };
PL.fetchArrows = function () { var G = Combat.dbg(), n = 0; (G.W.stuck || []).filter(function (a) { return !a.on && !a.host; }).slice(0, 12).forEach(function (a) { if (Math.hypot(a.x - G.P.x, a.y - G.P.y) < 700) { PL.walkTo(a.x, a.y, 8, 700); PL.draw(4); n++; } }); return n; };
PL.hunt = function (kind, shots) { var D = Combat.api.debug(), G = Combat.dbg(), p = G.P; PL.take('bow'); var b = PL.beasts(kind)[0]; if (!b) return 'no ' + kind; var log = []; PL.walkTo(b.x, b.y, 300, 5000); for (var s = 0; s < (shots || 8) && !b.dead && D.quiver().slots[0]; s++) { if (Math.hypot(b.x - p.x, b.y - p.y) > 180) PL.walkTo(b.x, b.y, 130, 2000); PL.shootAt(b, 0.15); log.push(Math.round(Math.hypot(b.x - p.x, b.y - p.y)) + ':' + Math.round(b.hp * 10) / 10); PL.draw(2); } PL.fetchArrows(); return log.join(' ') + (b.dead ? ' DEAD' : '') + ' arrows ' + JSON.stringify(D.quiver().slots[0]); };
PL.carryTo = function (kind) { var D = Combat.api.debug(), G = Combat.dbg(), p = G.P, out = []; var body = G.W.enemies.filter(function (e) { return e.dead && e.kind === kind; }).sort(function (a, b) { return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y); })[0]; if (!body) return 'no body'; PL.walkTo(body.x, body.y + 10, 14, 3000); out.push(D.eWhat()); D.eDo(); PL.draw(30); var tb = D.B.items.filter(function (it) { return it.name === 'butcherTable'; }).sort(function (a, b) { return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y); })[0]; PL.walkTo(tb.x, tb.y + 30, 16, 5000); for (var k = 0; k < 3; k++) { out.push(D.eWhat()); D.eDo(); PL.draw(k === 1 ? 420 : 30); } return out.join(' / ') + ' ' + JSON.stringify(PL.inv()); };
