// The battle scene played by script in the page (2026-10-13, docs/battle-plan.md: what Node cannot see: that the clips match
// the blows, that the shield is where the blow was stopped, that nobody slides). Load tools/visual/drive.js, write the page
// again (game.html?scene=battle), then load this file.
//   BP.set('one' | 'two' | 'friend' | 'five')   the board's own rows (BP.act(id) presses any row: 'wpn', 'gear', 'wits', 'again' ...)
//   BP.run({ bot: 'careful', secs: 20 })         the hero played by a bot (tests/battle.js has the same three); returns what happened:
//                                               who fell, how long, what the hero has left, and a line for every change of a man's state
//   BP.strip({ bot, n: 16, every: 4, when })     a film strip: n pictures every `every` frames round the hero, begun when `when(D)` is true
//                                               (BP.when.windup: a man has begun a blow at the hero); returns a JPEG data URL
//   BP.look(scale)                               the whole view as it is now
window.BP = (function () {
  var DT = 1 / 60, wrapA = function (a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  function D() { return Combat.dbg(); }
  function men(side) { return D().W.enemies.filter(function (e) { return e.type === 'soldier' && !e.dead && !e.down && !e.fled && !e.out && (side == null || (e.side || 0) === side); }); }
  function keys(ang, go) { Combat.key('KeyD', go && Math.cos(ang) > 0.38); Combat.key('KeyA', go && Math.cos(ang) < -0.38); Combat.key('KeyS', go && Math.sin(ang) > 0.38); Combat.key('KeyW', go && Math.sin(ang) < -0.38); }
  function threat() {
    var P = D().P, best = null;
    D().W.enemies.forEach(function (e) { if (e.dead || e.side === 1 || e.type !== 'soldier' || !e.sw || e.tgt !== P) return; if (e.state !== 'windup' && !(e.state === 'lunge' && !e.hitDone)) return;
      var d = Math.hypot(e.x - P.x, e.y - P.y); if (d > e.sw.reach + 34) return; var hit = e.sw.ac * Combat.api.men.hitAt, tti = e.state === 'windup' ? e.dur - e.t + hit : hit - e.t; if (!best || tti < best.tti) best = { e: e, tti: tti, heavy: e.sw.heavy }; });
    return best;
  }
  var HUMAN = { careful: { react: 0.2, miss: 0.12, jitter: 0 }, skilled: { react: 0.12, miss: 0.06, jitter: 0.18 } };
  function meets(st, th, who) { var H = HUMAN[who]; if (st.thr !== th.e || st.thrN !== th.e.swingN) { st.thr = th.e; st.thrN = th.e.swingN; st.seen = 0; st.blind = Math.random() < H.miss; st.jit = (Math.random() - 0.5) * H.jitter; } st.seen += DT; return !st.blind && st.seen >= H.react; }
  function reachOf() { var it = Combat.api.items && Combat.api.items.weapon('sword'), pf = Combat.api.profiles()[it ? it.kind : 'sword'] || Combat.api.profiles().sword; return { reach: pf.reach, breaks: !!pf.guardBreak || pf.stag >= 30 }; }
  var BOTS = {
    none: function () { keys(0, false); Combat.key('KeyK', false); Combat.button(0, false); },
    tapper: function (st, F) { var P = D().P, t = F[0], d = Math.hypot(t.x - P.x, t.y - P.y), ang = Math.atan2(t.y - P.y, t.x - P.x); keys(ang, d > 34); Combat.key('KeyK', false); Combat.button(0, d < 60 && st.frame % 14 < 3); },
    careful: function (st, F) {
      var P = D().P, t = F[0], d = Math.hypot(t.x - P.x, t.y - P.y), ang = Math.atan2(t.y - P.y, t.x - P.x), th = threat(), R = reachOf(), reach = R.reach + t.r; D().W.lock = t;
      if (th && th.tti < 0.6 && meets(st, th, 'careful')) { keys(ang, false); Combat.button(0, false); Combat.key('KeyK', true); return; }
      Combat.key('KeyK', false); var open = t.state === 'recover' || t.state === 'stagger' || !(t.guard > 0) || R.breaks;
      keys(ang, d > reach - 2); Combat.button(0, open && d < reach + 8 && P.st > 20 && st.frame % 12 < 3);
    },
    skilled: function (st, F) {
      var P = D().P, t = F[0], d = Math.hypot(t.x - P.x, t.y - P.y), ang = Math.atan2(t.y - P.y, t.x - P.x), th = threat(), R = reachOf(), reach = R.reach + t.r; D().W.lock = t; Combat.key('Space', false);
      if (th && meets(st, th, 'skilled')) { if (th.heavy) { if (th.tti < 0.22 && P.roll.cd <= 0 && P.st >= 18) { keys(ang + Math.PI, true); Combat.key('Space', true); } else keys(ang + Math.PI, th.tti < 0.5); Combat.key('KeyK', false); Combat.button(0, false); return; } keys(ang, false); Combat.button(0, false); Combat.key('KeyK', th.tti <= 0.15 + st.jit); return; }
      Combat.key('KeyK', false); var open = t.state === 'recover' || t.state === 'stagger' || !(t.guard > 0) || R.breaks;
      keys(ang, d > reach - 2); Combat.button(0, open && d < reach + 8 && P.st > 12 && st.frame % 10 < 3);
    }
  };
  function release() { ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyK', 'Space'].forEach(function (k) { Combat.key(k, false); }); Combat.button(0, false); }
  function tickBot(st, bot) { var P = D().P, F = men(0); st.frame++; if (P.dead || !F.length) { release(); return false; } F.sort(function (a, b) { return Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y); }); BOTS[bot || 'none'](st, F); return true; }
  function run(o) {
    o = o || {}; var st = { frame: 0 }, P = D().P, all = D().W.enemies.filter(function (e) { return e.type === 'soldier'; }), last = all.map(function (e) { return ''; }), log = [], t = 0, hp0 = P.hp, slide = 0, hits = 0, blocks = 0, lastHp = P.hp, pos = all.map(function (e) { return [e.x, e.y]; });
    while (t < (o.secs || 20)) {
      var go = tickBot(st, o.bot); H2.step(1); t += DT;
      all.forEach(function (e, i) { var s = (e.dead ? 'dead' : e.down ? 'down' : e.state) + (e.guard > 0 ? '+shield' : ''); if (s !== last[i]) { if (log.length < 200) log.push(t.toFixed(2) + ' ' + (e.side ? 'friend ' : 'man ') + i + ' ' + s + ' hp ' + Math.max(0, e.hp).toFixed(0)); last[i] = s; }
        var mv = Math.hypot(e.x - pos[i][0], e.y - pos[i][1]) / DT; pos[i] = [e.x, e.y]; if (!e.dead && !e.down && mv > 20 && e._bs && e._bs.spd < 4 && e.state === 'chase') slide++; });   // moving on the ground while his picture stands still
      if (P.hp < lastHp - 0.01) { hits++; if (log.length < 200) log.push(t.toFixed(2) + ' HERO hit, ' + P.hp.toFixed(0) + ' left'); } lastHp = P.hp;
      if (!go && !o.stay) break;
    }
    release(); var F = men(0), A = men(1);
    return { secs: +t.toFixed(1), heroDead: P.dead, heroLeft: Math.round(P.hp), heroLost: Math.round(hp0 - P.hp), blowsOnHero: hits, foesStanding: F.length, friendsStanding: A.length, slid: slide, log: log };
  }
  var when = { windup: function () { return D().W.enemies.some(function (e) { return e.type === 'soldier' && e.state === 'windup' && e.tgt === D().P; }); }, now: function () { return true; },
    heroSwing: function () { return D().P.atk.ph === 'windup'; }, shield: function () { return D().W.enemies.some(function (e) { return e.type === 'soldier' && e.guard > 0; }); } };
  function strip(o) {
    o = o || {}; var st = { frame: 0 }, n = o.n || 16, every = o.every || 4, cols = o.cols || 8, w = o.when || when.windup, wait = 0, cv = document.querySelector('canvas'), PS = Combat.api.pixelScale || 3, i;
    while (!w() && wait < 1800) { tickBot(st, o.bot); H2.step(1); wait++; }
    H2.begin(cols, Math.ceil(n / cols));
    for (i = 0; i < n; i++) { var P = D().P, m = men(0)[0] || P, lab = (i * every) + 'f ' + (m !== P ? m.state + (m.guard > 0 ? '+sh' : '') : '') + ' hp' + Math.round(P.hp); H2.snap(cv, cv.width / 2, cv.height / 2 - 8 * PS, lab, i % cols, Math.floor(i / cols)); for (var k = 0; k < every; k++) { tickBot(st, o.bot); H2.step(1); } }
    release(); return H2.part(0, Math.ceil(n / cols));
  }
  function act(id) { Combat.api.debug().battleAct(id); H2.step(2); } function set(id) { act(id); }
  function look(q) { var cv = document.querySelector('canvas'); return cv.toDataURL('image/jpeg', q || 0.85); }
  return { run: run, strip: strip, set: set, act: act, look: look, when: when, men: men, release: release };
})();
