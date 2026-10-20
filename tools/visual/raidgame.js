// The raid in the real game, driven in the browser pane (2026-10-20, docs/raid-build-plan.md): the checks of each step, run against the
// live game (not the Battle test) with the page driver. In the pane: open dist/game.html?mute=1, load tools/visual/drive.js, wait a
// tenth of a second, H2.drop(), write the page again, then load this file and call R.step1() and so on; each returns an object of
// what it measured (values, never asserts: read them against the labels, as the tests do). The town is found by its archetype.
(function () {
  function D() { return Combat.api.debug(); }
  function W() { return Combat.dbg().W; }
  function town() { var vs = D().villages(), L = Array.isArray(vs) ? vs : vs.list, i; for (i = 0; i < L.length; i++) if (L[i].arch === 'town' && L[i].ring >= 1) return { i: i, v: L[i] }; return null; }
  function men(vi) { return W().enemies.filter(function (e) { return e.type === 'soldier' && e.side === 0 && e.vi === vi && e.gi != null; }); }
  function sim(s) { H2.sim(Math.round(s * 60), D().tick); H2.step(1); }
  // Step 1: the settlement's men come as the hero comes near, stand on land at their posts with the same names each visit, a man
  // killed stays dead (by his number; survives a reload), and they leave when he has been far for MEN_HOLD seconds.
  function step1() {
    var t = town(), out = {}; if (!t) return { fault: 'no town outside home water' }; var vi = t.i, wd = D().world(), T = 32, v = t.v, box = { x0: v.tx * T, y0: v.ty * T, x1: (v.tx + v.w) * T, y1: (v.ty + v.h) * T };
    out.town = [vi, v.name]; out.before = men(vi).length;
    D().toVillage(vi); sim(3.5); var m = men(vi); out.n1 = m.length;
    out.onLand = m.filter(function (e) { return wd.isLand(e.x, e.y); }).length; out.inBox = m.filter(function (e) { return e.x > box.x0 && e.x < box.x1 && e.y > box.y0 && e.y < box.y1; }).length;
    out.kinds = m.reduce(function (a, e) { a[e.kindOf] = (a[e.kindOf] || 0) + 1; return a; }, {}); out.names = m.slice(0, 3).map(function (e) { return e.name; });
    var victim = m[2]; victim.dead = true; victim.deadT = 0; victim.deadFor = 90; victim.hp = 0; sim(3.5); out.deadKept = JSON.stringify(D().garrison().dead);
    var c = D().toVillage(vi); D().goto(c.x + 4200, c.y); sim(46); out.farLive = D().garrison().live; out.farMen = men(vi).filter(function (e) { return !e.dead; }).length;
    D().toVillage(vi); sim(3.5); m = men(vi).filter(function (e) { return !e.dead; }); out.n2 = m.length; out.victimBack = m.some(function (e) { return e.gi === victim.gi; }); out.names2 = m.slice(0, 2).map(function (e) { return e.name; });
    out.fault = out.n1 !== 20 || out.onLand !== out.n1 || out.inBox !== out.n1 || out.farMen !== 0 || out.n2 !== 19 || out.victimBack ? '!!' : '';
    out.errs = D().errlog().slice(-3).map(function (l) { return String(l).slice(0, 160); });
    return out;
  }
  window.R = { step1: step1, town: town, men: men, sim: sim };
})();
