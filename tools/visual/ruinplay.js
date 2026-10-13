// The Destruction Editor played by script in the page (2026-10-13; src/ruin.js). Load tools/visual/drive.js, write the page
// again (game.html?scene=ruin), then this. Everything is the game's own (the keys, the tools, E, the Building board's Mend):
// the script only presses them, and steps the page's own tick with no pictures (H2.sim).
//   RU2.houses()                 the sampler's houses: [{ n, name, x, y, w, h }]
//   RU2.at(n, side, i)           the hero beside house n's 's' | 'n' | 'w' | 'e' wall, at its i-th piece, facing it (set there: not walked)
//   RU2.tool(k)                  the Gather bar's slot k (1 iron axe, 2 iron pick, 3 knife, 4 flint axe, 5 copper pick)
//   RU2.hack(secs)               blows on the wall faced until it gives: { blows, secs, gave, mat, dmg }
//   RU2.fire(secs)               a torch lit, E at the wall faced, and the clock run: what burnt
//   RU2.wait(secs, until)        the clock runs
//   RU2.walk(x, y, secs)         by the keys, straight (to try a breach: does he get through)
//   RU2.mend(n)                  the place made yours, and every damaged piece of house n mended with the Mend piece, then its roof: what it cost
//   RU2.state(n)                 house n: pieces given, the share, its roof, what burns
//   RU2.opt.god = true           the hero is healed every step (to watch what a town does without dying of it)
//   RU2.table()                  every wall of the sampler under the iron axe and the iron pick: blows and seconds (the balance table, played)
window.RU2 = (function () {
  var T = 32, DT = 1 / 60;
  function dbg() { return Combat.api.debug(); }
  function P() { return Combat.dbg().P; }
  function B() { return dbg().ruinB(); }
  function info() { return dbg().ruinInfo(); }
  function tick() { dbg().tick(DT); }
  function keys(ang, go) { Combat.key('KeyD', go && Math.cos(ang) > 0.38); Combat.key('KeyA', go && Math.cos(ang) < -0.38); Combat.key('KeyS', go && Math.sin(ang) > 0.38); Combat.key('KeyW', go && Math.sin(ang) < -0.38); }
  function still() { keys(0, false); Combat.button(0, false); Combat.key('KeyK', false); }
  var opt = { god: false };                // god: the hero is healed every step (to watch what the town does without dying of it)
  function run(secs, each) { var n = Math.round(secs * 60), i; for (i = 0; i < n; i++) { if (opt.god) P().hp = P().maxHp; if (each && each(i * DT) === false) break; H2.sim(1, tick); if (P().dead) break; } return i * DT; }
  function houses() { return info().RU.houses.map(function (h, n) { return { n: n, name: h.name, x: h.x, y: h.y, w: h.w, h: h.h }; }); }
  function edgeOf(n, side, i) { var h = info().RU.houses[n]; i = i || 0; return side === 's' ? ['H', h.x + i, h.y + h.h] : side === 'n' ? ['H', h.x + i, h.y] : side === 'w' ? ['V', h.x, h.y + i] : ['V', h.x + h.w, h.y + i]; }
  function at(n, side, i) {
    var q = edgeOf(n, side, i), p = P(), mx = q[0] === 'H' ? (q[1] + 0.5) * T : q[1] * T, my = q[0] === 'H' ? q[2] * T : (q[2] + 0.5) * T, d = 17;
    p.x = mx + (side === 'w' ? -d : side === 'e' ? d : 0); p.y = my + (side === 'n' ? -d : side === 's' ? d : 0); p.vx = p.vy = 0; p.face = Math.atan2(my - p.y, mx - p.x); p.lvl = 0; H2.sim(2, tick);
    return { L: q[0], k: q[1] + ',' + q[2], e: B()[q[0]][q[1] + ',' + q[2]], x: mx, y: my };
  }
  function mode(m) { var n = 0; while (P().mode !== m && n++ < 4) { Combat.key(m === 'build' ? 'KeyB' : 'KeyQ', true); H2.sim(2, tick); Combat.key(m === 'build' ? 'KeyB' : 'KeyQ', false); H2.sim(2, tick); } return P().mode === m; }
  function tool(k) { mode('gather'); Combat.key('Digit' + k, true); H2.sim(2, tick); Combat.key('Digit' + k, false); H2.sim(2, tick); }
  function hack(secs) {
    var w = dbg().wallFaced(); if (!w) return { none: true }; var e = w.e, d0 = e.dmg || 0, f = P().face, blows = 0, lastD = d0;
    mode('gather');
    var took = run(secs || 30, function () { P().face = f; Combat.button(0, true); if ((e.dmg || 0) !== lastD) { blows++; lastD = e.dmg || 0; } if (e.breach || e.broken) return false; });
    still(); H2.sim(20, tick);
    return { blows: blows + (e.breach || e.broken ? 0 : 0), secs: +took.toFixed(1), gave: !!(e.breach || e.broken), dmg: +(e.dmg || 0).toFixed(1), st: e.st || 0 };
  }
  function wait(secs, until) { return run(secs, function () { if (until && until()) return false; }); }
  function walk(x, y, secs) { var took = run(secs || 6, function () { var p = P(), a = Math.atan2(y - p.y, x - p.x); if (Math.hypot(x - p.x, y - p.y) < 6) return false; keys(a, true); }); still(); return { secs: +took.toFixed(1), there: Math.hypot(x - P().x, y - P().y) < 8, x: Math.round(P().x), y: Math.round(P().y) }; }
  function roomOf(n) { var h = info().RU.houses[n], ri = info().rooms; return ri.rooms[ri.at(h.x, h.y)] || null; }
  function state(n) {
    var r = roomOf(n), b = B(), s = r ? Ruin.strain(info().RUIN, b, r) : null, F = b.fire || {}, burn = 0, k; for (k in F) burn++;
    return { room: r ? r.id : null, pieces: s ? s.n : 0, given: s ? s.broken : 0, share: s ? +s.share.toFixed(2) : 0, down: r ? Ruin.ruined(b, r) : false, roof: r ? b.roofs[r.id] : null, burning: burn, hp: Math.round(P().hp) };
  }
  function fire(secs) {
    var w = dbg().fireAtHand(), out = { lit: false };
    if (!w) { dbg().ruinDo('torch'); H2.sim(4, tick); w = dbg().fireAtHand(); }      // (the board's "Light a torch": T is the page's own key)
    if (!w) return { lit: false, why: 'nothing here to set alight' };
    out.what = w.what; var ed = dbg().eDo(); out.say = ed && ed.say; if (ed && ed.act) ed.act(); run(info().RUIN.fire.catchT + 0.3);
    out.lit = Ruin.alight(B()) > 0; var t0 = Combat.dbg().W.t, peak = 0; run(secs || 60, function () { var n = Ruin.alight(B()); if (n > peak) peak = n; if (!n) return false; });
    out.secs = +(Combat.dbg().W.t - t0).toFixed(1); out.peak = peak; out.left = Ruin.alight(B()); return out;
  }
  function mend(n) {
    var ri = info(), b = B(), r = roomOf(n), E = Ruin.edgesOf(b, r), done = 0, bag0 = dbg().ruinBag(), why = {};
    if (!ri.RU.held) dbg().ruinDo('held');
    var idx = dbg().pieceIndex('mend'); if (idx < 0) return { why: 'no Mend piece' }; P().wreck = false;
    E.forEach(function (q) { if (!Ruin.damaged(q.e)) return; var mx = q.L === 'H' ? (q.x + 0.5) * T : q.x * T, my = q.L === 'H' ? q.y * T : (q.y + 0.5) * T; P().x = mx + (q.L === 'V' ? 20 : 0); P().y = my + (q.L === 'H' ? 20 : 0); var t = dbg().place(idx, mx, my); if (!Ruin.damaged(q.e)) done++; else why[t ? t.why : 'no target'] = 1; });
    var c = Ruin.centre(r); P().x = c[0]; P().y = c[1] + 40; var tr = dbg().place(idx, c[0], c[1]);
    mode('gather'); var bag1 = dbg().ruinBag(), cost = {}; for (var k in bag0) if (bag0[k] !== bag1[k]) cost[k] = bag0[k] - bag1[k];
    return { mended: done, roofUp: !Ruin.ruined(b, r), roofWhy: tr && !tr.ok ? tr.why : '', cost: cost, why: Object.keys(why), state: state(n) };
  }
  function table() {
    var out = [], hs = houses();
    [[1, 'iron axe'], [2, 'iron pick']].forEach(function (tl) {
      dbg().ruinDo('again'); H2.sim(5, tick); tool(tl[0]);
      hs.forEach(function (h) { at(h.n, 'n', 0); var r = hack(40); out.push(tl[1] + ' on ' + h.name.split(',')[0].toLowerCase() + ': ' + (r.gave ? r.blows + ' blows, ' + r.secs + ' s' : r.dmg > 0 ? 'not in 40 s (' + r.dmg + ' done)' : 'nothing')); });
    });
    return out;
  }
  return { opt: opt, houses: houses, at: at, tool: tool, hack: hack, fire: fire, wait: wait, walk: walk, mend: mend, state: state, table: table, mode: mode, tick: tick, run: run };
})();
