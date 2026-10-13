// A raid played by script in the page, with no pictures until asked (2026-10-13, rung 6 of docs/battle-plan.md: "a scripted raid
// end to end for timing"). Load tools/visual/drive.js, write the page again (game.html?scene=battle), then battleplay.js and this.
//   RP.begin()                    the board's "A raid on it": the town at its day, the karve on the shore, the hero and five beside it
//   RP.go(x, y, { near, secs })   the hero walks there (by the town's grid where there is one); true when he is there
//   RP.toDoor('church' | 'hall')  to the tile outside that building's door;   RP.toChest('church' | 'hall'): to its heavy chest
//   RP.hack(what, secs)           gather mode, the axe, and blows until the door ('door') or the lock ('lock') at hand gives
//   RP.behind(man)                round behind a man at his post, and one blow
//   RP.G() / RP.E()               the word to a man of yours, or E, if either has anything to do here (says what it did)
//   RP.wait(secs, until)          the clock runs with the hero standing
//   RP.leave(secs)                to the ship, aboard, and rowed straight out
//   RP.raid('loud' | 'church' | 'hold' | 'quiet')   a whole raid from the shore and back to sea; returns the log
//   RP.log                        a line for every step: the time on the raid's clock, what was done, and how the town stands
//   RP.state()                    the town now: up, fighting, gone; yours standing; silver aboard
// Everything is the game's own (the keys, E and G, the axe): the script only presses them.
window.RP = (function () {
  var T = 32, DT = 1 / 60, log = [], t0 = 0;
  function dbg() { return Combat.api.debug(); }
  function D() { return Combat.dbg(); }
  function P() { return D().P; }
  function town() { var V = dbg().villages(), bt = dbg().battle(), i; if (bt && bt.town != null && V[bt.town] && V[bt.town].V) return V[bt.town]; for (i = 0; i < V.length; i++) if ((V[i].arch === 'town' || V[i].arch === 'bigtown') && V[i].V) return V[i]; return null; }   // the place the test is on (the board sets it), else the town
  function grid() { var n = dbg().navs(), k; for (k in n) if (n[k].inside(P().x, P().y)) return n[k]; return null; }
  function men(side) { return D().W.enemies.filter(function (e) { return e.type === 'soldier' && (e.side || 0) === side; }); }
  function state() {
    var M = men(0), Y = men(1), ri = dbg().raidInfo(), sv = 0; (ri.cargo || []).forEach(function (c) { sv += c.silver || 0; });
    return { t: +(D().W.t - t0).toFixed(1), up: M.filter(function (e) { return !e.dead && !e.out && !e.fled && e.awake !== false; }).length, fighting: M.filter(function (e) { return !e.dead && !e.out && e.tgt; }).length, gone: M.filter(function (e) { return e.dead || e.out || e.fled; }).length, of: M.length,
      yours: Y.filter(function (e) { return !e.dead && !e.down; }).length, down: Y.filter(function (e) { return e.down && !e.dead; }).length, carrying: Y.filter(function (e) { return e.load; }).length, aboard: ri.aboard, silver: sv, hp: Math.round(P().hp), dead: !!P().dead };
  }
  function note(what) { var s = state(); log.push(String(s.t).padStart(6) + ' s  ' + what + '   [town: ' + s.up + ' up, ' + s.fighting + ' fighting, ' + s.gone + '/' + s.of + ' out | yours: ' + s.yours + ' standing' + (s.down ? ', ' + s.down + ' down' : '') + (s.carrying ? ', ' + s.carrying + ' carrying' : '') + (s.aboard ? ', ' + s.aboard + ' aboard' : '') + ' | hero ' + s.hp + (s.dead ? ' DEAD' : '') + ' | silver aboard ' + s.silver + ']'); return s; }
  function keys(ang, go) { Combat.key('KeyD', go && Math.cos(ang) > 0.38); Combat.key('KeyA', go && Math.cos(ang) < -0.38); Combat.key('KeyS', go && Math.sin(ang) > 0.38); Combat.key('KeyW', go && Math.sin(ang) < -0.38); }
  function still() { keys(0, false); Combat.button(0, false); Combat.key('KeyK', false); Combat.key('ShiftLeft', false); }
  function tick() { dbg().tick(DT); }
  function run(secs, each) { var n = Math.round(secs * 60), i; for (i = 0; i < n; i++) { if (each && each(i * DT) === false) break; H2.sim(1, tick); if (P().dead) break; } return i * DT; }
  function begin() { log = []; if (P().dead) { Combat.key('KeyR', true); H2.sim(3, tick); Combat.key('KeyR', false); H2.sim(5, tick); }   // (the hero of the last raid fell: R, as a player would)
    BP.act('raid'); t0 = D().W.t; H2.sim(10, tick); note('ashore: the ship ' + Math.round(Math.hypot(P().x - gate().x, P().y - gate().y) / T) + ' tiles from the gate'); return state(); }
  function gate() { var F = town().V.fence; if (F.round) return { x: (F.gateAt || [F.cx, F.cy + F.ry])[0], y: (F.gateAt || [F.cx, F.cy + F.ry])[1] }; return { x: (F.gate + (F.gateW || 1) / 2) * T, y: F.y1 * T }; }
  function backGate() { var V = town().V, F = V.fence, i; for (i = F.x0; i < F.x1; i++) if (V.H[i + ',' + F.y0] && V.H[i + ',' + F.y0].t === 'gate') return { x: (i + 0.5) * T, y: F.y0 * T }; return null; }
  function lot(id) { return town().V.lots.filter(function (l) { return l.id === id; })[0]; }
  function doorOf(id) { var l = lot(id); if (!l) return null; return l.door === 's' ? { x: (l.dx + 0.5) * T, y: (l.y + l.h) * T + 20, fx: (l.dx + 0.5) * T, fy: (l.y + l.h) * T } : l.door === 'n' ? { x: (l.dx + 0.5) * T, y: l.y * T - 20, fx: (l.dx + 0.5) * T, fy: l.y * T } : l.door === 'e' ? { x: (l.x + l.w) * T + 20, y: (l.dy + 0.5) * T, fx: (l.x + l.w) * T, fy: (l.dy + 0.5) * T } : { x: l.x * T - 20, y: (l.dy + 0.5) * T, fx: l.x * T, fy: (l.dy + 0.5) * T }; }
  function chestOf(id) { var l = lot(id); if (!l) return null; return dbg().raidItems().filter(function (it) { return it.heavy && it.x > l.x * T && it.x < (l.x + l.w) * T && it.y > l.y * T && it.y < (l.y + l.h) * T; })[0] || null; }
  // the hero walks to a place: by the grid where there is one, round what he sticks on, running if told
  function go(x, y, o) {
    o = o || {}; var near = o.near || 14, st = { pt: 0, px: P().x, py: P().y, side: 1, sideT: 0 }, ok = false;
    var took = run(o.secs || 90, function () {
      var p = P(), d = Math.hypot(x - p.x, y - p.y); if (d < near) { ok = true; return false; }
      var g = grid(), wp = g ? g.next(p, x, y, D().W.t, false) : null, ax = wp && !wp.wait ? wp.x : x, ay = wp && !wp.wait ? wp.y : y;
      st.pt += DT; if (st.sideT > 0) st.sideT -= DT; if (st.pt >= 0.5) { if (Math.hypot(p.x - st.px, p.y - st.py) < 3 && !(st.sideT > 0)) { st.sideT = 0.5; st.side = -st.side; } st.pt = 0; st.px = p.x; st.py = p.y; }
      keys(Math.atan2(ay - p.y, ax - p.x) + (st.sideT > 0 ? st.side * 1.4 : 0), true); Combat.key('ShiftLeft', !!o.run); Combat.button(0, false);
    });
    still(); return ok;
  }
  function toDoor(id) { var d = doorOf(id); if (!d) return false; var ok = go(d.x, d.y, { near: 10 }); note((ok ? 'at' : 'NOT at') + ' the ' + id + ' door'); return ok; }
  function toChest(id) { var c = chestOf(id); if (!c) { note('no chest in the ' + id); return false; } var ok = go(c.x, c.y + 16, { near: 22 }); note((ok ? 'at' : 'NOT at') + ' the ' + id + ' chest (' + c.heavy.silver + ' silver' + (c.locked ? ', locked' : '') + ')'); return ok; }
  // the axe: gather mode, turned to the thing, and blows until it gives
  function hack(what, id, secs) {
    var p = P(), tgt = what === 'door' ? doorOf(id) : chestOf(id); if (!tgt) return false; var tx = what === 'door' ? tgt.fx : tgt.x, ty = what === 'door' ? tgt.fy : tgt.y, done = function () { if (what === 'door') { var l = lot(id), B = dbg().raidB(), k = l.door === 's' ? l.dx + ',' + (l.y + l.h) : l.door === 'n' ? l.dx + ',' + l.y : l.door === 'e' ? (l.x + l.w) + ',' + l.dy : l.x + ',' + l.dy, e = (l.door === 's' || l.door === 'n' ? B.H : B.V)[k]; return !e || !e.locked; } return !tgt.locked; };
    if (done()) { note('the ' + id + ' ' + what + ' is open already'); return true; }
    if (p.mode !== 'gather') { Combat.key('KeyQ', true); H2.sim(2, tick); Combat.key('KeyQ', false); H2.sim(2, tick); }
    var blows = 0, was = false, took = run(secs || 30, function (t) { var q = P(), a = Math.atan2(ty - q.y, tx - q.x); q.face = a; keys(a, Math.hypot(tx - q.x, ty - q.y) > 26); var down = Math.floor(t * 60) % 30 < 4; if (down && !was) blows++; was = down; Combat.button(0, down); if (done()) return false; });
    still(); var ok = done(); if (P().mode !== 'fight') { Combat.key('KeyQ', true); H2.sim(2, tick); Combat.key('KeyQ', false); H2.sim(2, tick); }
    note((ok ? 'the ' + id + ' ' + what + ' gave' : 'the ' + id + ' ' + what + ' HELD') + ' after ' + took.toFixed(1) + ' s'); return ok;
  }
  function E() { var w = dbg().eDo(); if (!w || !w.act) { note('E: nothing to do here'); return false; } w.act(); H2.sim(2, tick); note('E: ' + (w.say || '(done)')); return true; }
  function G() { var w = dbg().gDo(); if (!w) { note('G: nobody to send or nothing to carry'); return false; } w.act(); H2.sim(2, tick); note('G: ' + w.say); return true; }
  function wait(secs, until, what) { var took = run(secs, function () { still(); if (until && until()) return false; }); note((what || 'waited') + ' ' + took.toFixed(1) + ' s'); return took; }
  function behind(e) {                      // round behind a man at his post, and one blow. (Walking past a man jostles him and he turns to step back to his place: the script waits until he stands as he stood, as anyone would by eye)
    var tries = 0, was = e.awake;
    while (tries++ < 3 && !e.dead && e.awake === false) {
      run(3, function () { still(); if (e.atPost && e.post && Math.abs(Math.atan2(Math.sin(e.face - e.post.face), Math.cos(e.face - e.post.face))) < 0.1) return false; });
      var bx = e.x - Math.cos(e.face) * 24, by = e.y - Math.sin(e.face) * 24; if (!go(bx, by, { near: 7, secs: 40 })) { note('could not get behind him'); return false; }
      var p = P(), off = Math.abs(Math.atan2(Math.sin(Math.atan2(e.y - p.y, e.x - p.x) - e.face), Math.cos(Math.atan2(e.y - p.y, e.x - p.x) - e.face))); if (off > 0.9) continue;      // he has turned: round again
      run(0.1, function () { var q = P(); keys(Math.atan2(e.y - q.y, e.x - q.x), true); }); still();   // a step toward him: the blade goes where the hero faces
      D().W.lock = e; run(1.2, function (t) { Combat.button(0, Math.floor(t * 60) % 20 < 3); if (e.dead || e.awake !== false) return false; }); still(); D().W.lock = null;
    }
    note((e.dead ? 'a man taken from behind' : 'the man from behind is NOT down') + (was === false ? '' : ' (he had seen something)')); return !!e.dead;
  }
  function leave(secs, o) {
    var ri = dbg().raidInfo(), L = ri.raid.land, ok = go(L.x, L.y, { near: 10, secs: 120, run: true }); note((ok ? 'at the ship' : 'NOT at the ship') + ' (' + Math.round(Math.hypot(P().x - ri.raft.x, P().y - ri.raft.y)) + ' from its middle)');
    if (dbg().raidInfo().carrying) E();
    // the word to his own: with me. He waits a little for those who can come (a man down must be carried or left)
    var up = function () { return men(1).filter(function (e) { return !e.dead && !e.down; }); }, r0 = dbg().raidInfo().raft;
    if (o !== 'at once' && up().length) { Combat.order('follow'); var took = run(9, function () { still(); var L2 = up(); if (!L2.length || L2.every(function (e) { return Math.hypot(e.x - r0.x, e.y - r0.y) < 170; })) return false; }); note('called his men and waited ' + took.toFixed(1) + ' s: ' + up().filter(function (e) { return Math.hypot(e.x - r0.x, e.y - r0.y) < 190; }).length + ' of ' + up().length + ' standing are at the ship'); }
    var w = dbg().eDo(); if (w && w.act) { w.act(); H2.sim(2, tick); }
    var r = dbg().raidInfo().raft; if (!r || !r.aboard) { note('NOT aboard (E would: ' + (w ? w.say : 'nothing') + ')'); return false; }
    note('aboard'); run(secs || 8, function () { Combat.key('KeyW', true); }); still(); note('rowed out'); return true;
  }
  // with the man who carries, until nobody carries: 'stowed' (the silver aboard grew), or 'dropped'
  function escort(secs) {
    var s0 = state().silver, out = 'still carrying';
    run(secs || 60, function () { var c = men(1).filter(function (e) { return e.load || e.loadMan; })[0]; if (!c) { out = state().silver > s0 ? 'stowed' : 'dropped'; return false; } var p = P(), d = Math.hypot(c.x - p.x, c.y - p.y), g = grid(), wp = g && d > 40 ? g.next(p, c.x, c.y, D().W.t, false) : null; keys(Math.atan2((wp && !wp.wait ? wp.y : c.y) - p.y, (wp && !wp.wait ? wp.x : c.x) - p.x), d > 40); Combat.button(0, false); });
    still(); note('walked with the carrier: ' + out); return out;
  }
  // Whole raids ('hold': see below). 'loud': in at the back gate, the two there from behind, the church (a man of yours carries its chest), the hall
  // (the hero carries that one himself), and away. 'church': the church only, the hero walking with the carrier; if the chest is
  // dropped he lifts it himself. 'quiet': the two at the back gate from behind, a look round, and away with nothing but that.
  function raid(kind) {
    begin(); var bg = backGate() || gate(); go(bg.x, bg.y - 60, { near: 20, secs: 90 }); note('outside the back gate');
    var gs = men(0).filter(function (e) { return e.kindOf === 'gate' && Math.abs(e.y - bg.y) < 80; }); if (gs[0]) behind(gs[0]); if (gs[1]) behind(gs[1]);
    if (kind === 'quiet') { wait(6, null, 'stood in the town'); return leave(8), log; }
    if (kind === 'hold') {                  // his five in a line before the church door, facing the town, while he breaks in and carries the chest out himself; called when he is clear
      toDoor('church'); var dc = doorOf('church'), yc = town().V.yard, ya = Math.atan2((yc.y + yc.h / 2) * T - dc.y, (yc.x + yc.w / 2) * T - dc.x);
      go(dc.x + Math.cos(ya) * 40, dc.y + Math.sin(ya) * 40, { near: 8, secs: 10 }); run(0.15, function () { keys(ya, true); }); still(); Combat.order('hold'); note('his five told to hold a line before the church, facing the yard');
      toDoor('church'); hack('door', 'church', 30); toChest('church'); hack('lock', 'church', 30); E();
      var ok2 = go(bg.x, bg.y - 500, { near: 30, secs: 90 }); note((ok2 ? '500 units' : 'NOT 500 units') + ' out of the back gate with the chest'); Combat.order('follow'); note('called his men');
      return leave(8), log;
    }
    toDoor('church'); hack('door', 'church', 30); toChest('church'); hack('lock', 'church', 30); G();
    if (kind === 'church') {
      wait(3, function () { return men(1).some(function (e) { return e.load; }); }, 'he went for it'); var r = escort(90);
      if (r === 'dropped') { var c = dbg().raidItems().filter(function (it) { return it.heavy && !it.locked; }).sort(function (a2, b2) { return Math.hypot(a2.x - P().x, a2.y - P().y) - Math.hypot(b2.x - P().x, b2.y - P().y); })[0]; if (c && go(c.x, c.y + 14, { near: 24, secs: 30, run: true })) E(); }
      return leave(8), log;
    }
    wait(3, null, 'watched him lift it'); toDoor('hall'); hack('door', 'hall', 30); toChest('hall'); hack('lock', 'hall', 30); E();
    return leave(8), log;
  }
  return { begin: begin, raid: raid, escort: escort, go: go, toDoor: toDoor, toChest: toChest, hack: hack, E: E, G: G, wait: wait, behind: behind, leave: leave, state: state, note: note, gate: gate, backGate: backGate, doorOf: doorOf, chestOf: chestOf, lot: lot, men: men, run: run, still: still, get log() { return log; } };
})();
