// The runes on a raid in the real game, mashed (2026-10-24, Robin: "try raiding with the new runes, different combinations. Try
// to find bugs and break things"). In the pane: open dist/game.html?mute=1, load tools/visual/drive.js, H2.drop(), write the page
// again, then load this file and call RR.round(n) a few times, ONE A CALL (each is about 20 s of game time, under the tool's 45 s).
// Each round binds a random built rune in every slot at a random tier (the page's own Runes2 state), gives four men, puts the hero
// at the far seat (or a village) with a random weapon from the bar, and mashes every key: walk, sprint, blow, guard, guard-blow,
// dash, bow, traps, the throw, the sneak, the target, the wheel. It returns what went wrong: errors the page logged today, the
// hero's numbers gone bad, a throw or a trap stuck, the bag's traps going negative.
(function () {
  function D() { return Combat.api.debug(); }
  var KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'KeyJ', 'KeyK', 'Space'];
  function place() { var vs = D().villages(), L = Array.isArray(vs) ? vs : vs.list, k, i, ORDER = ['town', 'seat', 'village']; for (k = 0; k < ORDER.length; k++) for (i = 0; i < L.length; i++) if (L[i].arch === ORDER[k] && L[i].ring >= 1) return i; return -1; }
  function errsToday() { return D().errlog().filter(function (l) { return l.indexOf(new Date().toISOString().slice(0, 10)) === 0; }); }
  var e0 = null;
  function round(seed) {
    var out = { seed: seed }, R = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(seed * 7919 + 3);
    if (e0 == null) e0 = errsToday().length;
    var st = Combat.api.runeState, SL = Object.keys(Runes2.SLOT), bound = [];
    SL.forEach(function (sl) { var L = Runes2.LIST.filter(function (r) { return r.status === 'built' && r.slot === sl; }); if (!L.length || R() < 0.15) return; var r = L[Math.floor(R() * L.length)], tier = 1 + Math.floor(R() * 3); Runes2.learn(st, r.id, tier); Runes2.bind(st, sl, r.id); bound.push(r.id + tier); });
    if (R() < 0.6) Runes2.readyAll(st);
    out.runes = bound.join(',');
    var vi = place(); if (vi < 0) return { fault: 'no far place' }; D().clearMen(); D().toVillage(vi); H2.sim(60, D().tick); D().giveMen(4); D().addItem('trapTripper', 3); D().addItem('trapPoison', 3);
    var bar = D().slots.slice(0, 6), weapons = []; bar.forEach(function (s, i) { if (s && s.kind === 'item') weapons.push(i); });
    var P = Combat.dbg().P, held = {}, melee = weapons.filter(function (i) { var it = bar[i].item; return it && (it.kind === 'sword' || it.kind === 'bow' || it.kind === 'axe' || it.kind === 'knife'); }), pick = seed % 2 === 0 && melee.length ? melee[Math.floor(R() * melee.length)] : weapons.length ? weapons[Math.floor(R() * weapons.length)] : -1;
    if (pick >= 0) { window.dispatchEvent(new KeyboardEvent('keydown', { key: String(pick + 1), code: 'Digit' + (pick + 1), bubbles: true })); H2.step(1); window.dispatchEvent(new KeyboardEvent('keyup', { key: String(pick + 1), code: 'Digit' + (pick + 1), bubbles: true })); }
    out.hand = P.mode + '/' + P.weapon;
    var throwT = 0, bad = [];
    for (var f = 0; f < 1200; f++) {
      if (seed % 2 === 0 && f % 3 === 0) {   /* the fighting half: at the nearest of the place's men, striking, the guard at his windup, the dash now and then */
        var EF = Combat.dbg().W.enemies.filter(function (e) { return !e.dead && !e.down && e.side === 0 && e.type === 'soldier'; }).sort(function (a, b) { return Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y); }), tf = EF[0];
        if (tf) { var dx = tf.x - P.x, dy = tf.y - P.y, dd = Math.hypot(dx, dy), near = dd < (P.weapon === 'ranged' ? 120 : 36); [['KeyD', dx > 6 && !near], ['KeyA', dx < -6 && !near], ['KeyS', dy > 6 && !near], ['KeyW', dy < -6 && !near]].forEach(function (q) { if (q[1] !== !!held[q[0]]) { held[q[0]] = q[1]; Combat.key(q[0], q[1]); } }); Combat.mouse(tf.x, tf.y * 0.75);
          var ph = f % 90, gu = tf.state === 'windup' && R() < 0.6, dr = P.weapon === 'ranged' && ph < 75, jj = P.weapon === 'ranged' ? ph >= 75 && ph < 78 : near && R() < 0.5; if ((gu || dr) !== !!held.KeyK) { held.KeyK = gu || dr; Combat.key('KeyK', held.KeyK); } if (jj !== !!held.KeyJ) { held.KeyJ = jj; Combat.key('KeyJ', jj); } if (R() < 0.03) { Combat.key('Space', true); Combat.key('Space', false); } }
      } else if (f % 6 === 0) { KEYS.forEach(function (k) { var want = R() < (k === 'Space' || k === 'ShiftLeft' ? 0.12 : 0.32); if (want !== !!held[k]) { held[k] = want; Combat.key(k, want); } });
        var lm = R() < 0.3; if (lm !== !!held.lmb) { held.lmb = lm; Combat.button(0, lm); } var rm = R() < 0.25; if (rm !== !!held.rmb) { held.rmb = rm; Combat.button(2, rm); }
        if (R() < 0.04) { Combat.key('KeyC', true); Combat.key('KeyC', false); } if (R() < 0.04) { Combat.key('ControlLeft', true); Combat.key('ControlLeft', false); } if (R() < 0.06) Combat.wheel(R() < 0.5 ? 1 : -1);
        var E = Combat.dbg().W.enemies.filter(function (e) { return !e.dead && e.side !== 1; }), tg = E[Math.floor(R() * E.length)]; if (tg) Combat.mouse(tg.x, tg.y * 0.75); }
      if (f % 2 === 0) H2.step(1); else D().tick(1 / 60);
      if (P.dead) { P.dead = false; P.hp = P.maxHp; }
      if (!(isFinite(P.x) && isFinite(P.y) && isFinite(P.hp) && isFinite(P.st))) { bad.push('the hero not a number'); break; }
      throwT = P.throwQ ? throwT + 1 / 60 : 0; if (throwT > 1.5) { bad.push('a throw stuck'); break; }
      if ((D().inv.trapTripper || 0) < 0 || (D().inv.trapPoison || 0) < 0) { bad.push('traps below none'); break; }
    }
    KEYS.concat(['KeyC']).forEach(function (k) { Combat.key(k, false); }); Combat.button(0, false); Combat.button(2, false);
    var E2 = errsToday(); out.newErrors = E2.slice(e0).map(function (l) { return l.slice(0, 220); }).slice(0, 4); e0 = E2.length;
    out.bad = bad; out.foesDown = Combat.dbg().W.enemies.filter(function (e) { return e.dead && e.side !== 1; }).length; out.hp = Math.round(P.hp);
    return out;
  }
  window.RR = { round: round, place: place };
})();
