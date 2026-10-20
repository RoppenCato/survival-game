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
  // Step 2: the settlement remembers. A raid (the alarm), a broken church door, the church's silver taken, a villager and a man
  // killed; saved. After a reload (R.step2b, in the page reloaded without the driver): the door still broken, the chest gone, the
  // dead still dead, the raid counted, the places near wary, the folk's lines changed.
  function churchDoor(v) { var B = D().B, l = v.V.lots.filter(function (q) { return q.id === 'church'; })[0]; if (!l) return null; var k = l.door === 's' ? [l.dx, l.y + l.h] : l.door === 'n' ? [l.dx, l.y] : null; if (!k) return null; return { key: k[0] + ',' + k[1], ed: B.H[k[0] + ',' + k[1]], lot: l }; }
  function step2() {
    var t = town(), out = {}; if (!t) return { fault: 'no town outside home water' }; var vi = t.i, v = t.v, B = D().B;
    D().toVillage(vi); sim(3.5); var c = D().toVillage(vi);
    D().raid().alarm(vi, c.x, c.y); sim(1); var g = D().garrison(); out.raids = g.raids[vi]; out.wary = Object.keys(g.wary).map(function (k) { return [+k, g.wary[k].of]; });
    var dr = churchDoor(v); out.door0 = dr ? { locked: dr.ed && dr.ed.locked, broken: dr.ed && dr.ed.broken } : 'no church door'; if (dr && dr.ed) { dr.ed.broken = 1; delete dr.ed.locked; D().dirty(); }
    var chest = B.items.filter(function (it) { return it.heavy && it.heavy.silver && Math.abs(it.x / 32 - (dr ? dr.lot.x : -999)) < 12; })[0]; out.silver = chest ? chest.heavy.silver : null; if (chest) B.items.splice(B.items.indexOf(chest), 1);
    var fk = D().folk().filter(function (f) { return f.vi === vi && !f.dead && !f.child; }), f0 = fk[0], ix = D().folk().filter(function (f) { return f.vi === vi; }).indexOf(f0); out.folk = [f0 && f0.name, ix];
    if (f0) { f0.dead = true; f0.hidden = true; var s = D().seen; if (!s.dead) s.dead = {}; if (!s.dead[vi]) s.dead[vi] = []; s.dead[vi].push(ix); if (!s.slain) s.slain = {}; if (!s.slain[vi]) s.slain[vi] = []; s.slain[vi].push(f0.name); }
    var m = men(vi).filter(function (e) { return !e.dead; }), victim = m[5]; out.man = [victim.gi, victim.name]; victim.dead = true; victim.deadT = 0; victim.deadFor = 90; victim.hp = 0; sim(3.5);
    out.deadMen = JSON.stringify(D().garrison().dead); sim(40); out.raidOver = !D().raid().raid; D().saveNow(); out.errs = D().errlog().slice(-3).map(function (l) { return String(l).slice(0, 160); });
    return out;
  }
  function step2b(expect) {                // after the reload: expect = step2's result
    var t = town(), out = {}; if (!t) return { fault: 'no town' }; var vi = t.i, v = t.v, B = D().B, dr = churchDoor(v);
    out.door = dr && dr.ed ? { locked: dr.ed.locked, broken: dr.ed.broken } : 'no church door';
    out.silverLeft = B.items.filter(function (it) { return it.heavy && it.heavy.silver && Math.abs(it.x / 32 - (dr ? dr.lot.x : -999)) < 12; }).length;
    var fk = D().folk().filter(function (f) { return f.vi === vi; }); out.folkDead = fk.filter(function (f) { return f.dead; }).map(function (f) { return f.name; });
    out.men = men(vi).length; out.deadMen = JSON.stringify(D().garrison().dead); var g = D().garrison(); out.raids = g.raids[vi]; out.lastRaid = g.lastRaid[vi]; out.wary = Object.keys(g.wary).length;
    out.lines = fk.filter(function (f) { return !f.dead; }).slice(0, 2).map(function (f) { return f.lines && f.lines[0]; });
    out.fault = (out.door && out.door.broken !== 1) || out.silverLeft !== 0 || !out.folkDead.length || (expect && out.men !== 18) || !out.raids ? '!!' : '';
    return out;
  }
  // Step 3: the ship, the hird and the loot home. A karve off the town's shore with the hero and four men; they board, step ashore
  // on the raid as the engine's men, the church's silver is lifted and stowed, a man left ashore is lost when the ship sails,
  // the men board again as hirdmen; the ship teleported home, stepping ashore in territory puts them off as hirdmen; the silver
  // unloaded; saved and reloaded: the hird kept.
  function own() { return W().enemies.filter(function (e) { return e.type === 'soldier' && e.side === 1 && !e.dead; }); }
  function step3() {
    var t = town(), out = {}; if (!t) return { fault: 'no town outside home water' }; var vi = t.i, d = D(), P = Combat.dbg().P, T = 32;
    try {
    d.clearMen(); d.B.items = d.B.items.filter(function (it) { return !it.claim; }); d.toSteading(); sim(0.3); var wd0 = d.world(), st0 = { x: P.x, y: P.y }, sea0 = null, land0 = null;
    for (var dd0 = 20; dd0 < 900 && !sea0; dd0 += 10) for (var a0 = 0; a0 < 16 && !sea0; a0++) { var sx0 = st0.x + Math.cos(a0 * 0.3927) * dd0, sy0 = st0.y + Math.sin(a0 * 0.3927) * dd0; if (wd0.isWater(sx0, sy0)) sea0 = { x: sx0, y: sy0 }; }
    for (var dd1 = 16; dd1 < 160 && !land0; dd1 += 8) for (var a1 = 0; a1 < 12 && !land0; a1++) { var lx0 = sea0.x + Math.cos(a1 * 0.5236) * dd1, ly0 = sea0.y + Math.sin(a1 * 0.5236) * dd1; if (wd0.isLand(lx0, ly0)) land0 = { x: lx0, y: ly0 }; }
    d.goto(land0.x, land0.y); d.admin('arnor'); sim(0.5); out.stone = !!d.hird; out.hird0 = d.hirdList().length;           // the first claim stone at the steading's shore: territory there, and Arnor joins
    var home = { x: land0.x, y: land0.y }, homeSea = sea0;
    d.toVillage(vi); sim(0.5); var sh = d.raidShore(vi); if (!sh) return { fault: 'no shore near the town' };
    d.giveBoat('karve', { x: 200, y: 200 }); var r = d.raftObj(); r.x = sh.sea.x; r.y = sh.sea.y; r.h = sh.h; r.vx = r.vy = 0; r.aboard = false; r.cargo = [];
    d.goto(sh.land.x, sh.land.y); d.giveMen(4); out.hird1 = d.hirdList().length; sim(1);   // at the ship's side, the men at your back
    d.raftUse(); sim(0.5); out.aboard = d.hirdList().filter(function (m) { return m.aboard; }).length; out.raftAboard = r.aboard;   // E at the ship: aboard with the men at the oars
    d.raftUse(); sim(1); out.ashoreMen = own().length; out.asMan = d.hirdList().filter(function (m) { return m.asMan; }).length;   // E again: ashore on the raid as the engine's men
    var B = d.B, chest = B.items.filter(function (it) { return it.heavy && it.heavy.silver; })[0]; out.silver = chest ? chest.heavy.silver : null;
    if (chest) { delete chest.locked; d.goto(chest.x + 6, chest.y + 10); sim(0.3); d.raid().lift(chest); sim(0.3); out.carrying = !!d.raid().carrying; d.goto(sh.land.x, sh.land.y); sim(0.3); d.raid().stow(); sim(0.3); out.cargo = (r.cargo || []).length; }
    var ms = own(); var left = ms[ms.length - 1]; left.x = sh.dry.x + 900; left.y = sh.dry.y; left.order = 'hold'; left.holdAt = { x: left.x, y: left.y };   // one man far from the ship when it sails
    d.goto(sh.land.x, sh.land.y); ms.slice(0, 3).forEach(function (e, i) { e.x = sh.land.x + 10 + i * 12; e.y = sh.land.y + 8; }); sim(0.3);
    d.raftUse(); sim(0.5); out.aboard2 = d.hirdList().filter(function (m) { return m.aboard; }).length; out.stillAshore = own().length;
    r.x = sh.sea.x + 3000; r.y = sh.sea.y; P.x = r.x; P.y = r.y; sim(5); out.lost = d.hirdList().filter(function (m) { return m.lost; }).map(function (m) { return m.name; });   // the ship far off: he is lost
    r.aboard = true; r.x = homeSea.x; r.y = homeSea.y; P.x = r.x; P.y = r.y;                                                             // home: the karve at the steading's shore, within the first stone's reach
    d.raftUse(); sim(0.5); out.homeHird = d.hirdList().filter(function (m) { return !m.aboard && !m.asMan && !m.lost; }).length; out.homeMen = own().length;
    out.silverBefore = d.inv.silver || 0; d.raid().unload(); out.silverAfter = d.inv.silver || 0;
    d.saveNow(); out.errs = d.errlog().slice(-3).map(function (l) { return String(l).slice(0, 160); });
    out.fault = out.aboard !== 4 || out.ashoreMen !== 4 || (out.silver != null && out.cargo !== 1) || out.lost.length !== 1 || out.homeHird !== 4 || out.homeMen !== 0 || (out.silver != null && out.silverAfter <= out.silverBefore) ? '!!' : '';   // (Arnor stays at his bench: four given men board)
    } catch (e) { out.threw = String(e && e.stack).slice(0, 300); }
    return out;
  }
  // Step 5: ways in. By day a yard man walks the round; a man killed quietly and left in the open is found and the cry goes up;
  // a body dragged with you moves with you and is laid down again; taking from a chest of theirs before a villager's eyes is
  // seen (the cry, the alarm); nothing of it at a place at peace with nobody looking.
  function step5() {
    var t = town(), out = {}; if (!t) return { fault: 'no town outside home water' }; var vi = t.i, d = D(), P = Combat.dbg().P;
    try {
    d.B.items = d.B.items.filter(function (it) { return !it.claim; }); d.timeOf(400); var c = d.toVillage(vi); sim(4);
    var ms = men(vi); out.men = ms.length; out.dayWatch = ms.filter(function (e) { return e.dayWatch; }).map(function (e) { return e.name; });
    sim(8); out.onRound = ms.filter(function (e) { return e.dayWatch && e.errand && e.errand.round; }).length;
    // a man killed quietly in the open: who finds him
    var victim = ms.filter(function (e) { return e.kindOf === 'yard' && !e.dayWatch; })[0] || ms[3]; victim.dead = true; victim.deadT = 0; victim.deadFor = 90; victim.hp = 0; d.goto(c.x + 900, c.y);   // (the hero out of the yard but near: a place keeps its day, and finds its dead, only while he is near)
    var t0 = 0; for (var i = 0; i < 60 && !victim.found; i++) { sim(1); t0++; } out.found = { after: victim.found ? t0 : null, raid: d.raid().raid ? d.raid().raid.lvl : 0 };
    // the body dragged: it follows the hero and is laid down
    sim(45); d.toVillage(vi); sim(0.3); var body = ms.filter(function (e) { return e.dead && !e.held; })[0]; if (body) { d.goto(body.x + 10, body.y); out.prompt = d.eWhat() && d.eWhat().say; d.dragBody(body); d.goto(body.x + 300, body.y + 40); sim(0.5); out.dragged = Math.round(Math.hypot(body.x - P.x, body.y - P.y)); d.putDown(); sim(0.3); out.laid = [!body.held, Math.round(Math.hypot(body.x - P.x, body.y - P.y))]; }
    // theft in plain sight: a chest of theirs with a villager before it
    var chest = d.B.items.filter(function (it) { return it.store && !it.heavy && d.villages && true && Math.abs(it.x - c.x) < 1500 && Math.abs(it.y - c.y) < 1500; })[0];
    if (chest) { var fk = d.folk().filter(function (f) { return f.vi === vi && !f.dead && !f.hidden; })[0]; if (fk) { fk.x = chest.x + 40; fk.y = chest.y + 10; fk.face = Math.PI; fk.hidden = false; fk.fleeing = false; } var lv0 = d.raid().raid ? d.raid().raid.lvl : 0; d.goto(chest.x, chest.y + 12); sim(0.3); d.theft(chest); sim(0.5); out.theft = { before: lv0, after: d.raid().raid ? d.raid().raid.lvl : 0, cry: fk && fk.say }; }
    out.errs = d.errlog().slice(-3).map(function (l) { return String(l).slice(0, 160); });
    out.fault = !out.dayWatch.length || !out.onRound || !out.found.after || out.found.raid < 2 || (out.dragged != null && out.dragged > 30) || (out.theft && out.theft.after < 2) ? '!!' : '';
    } catch (e) { out.threw = String(e && e.stack).slice(0, 300); }
    return out;
  }
  window.R = { step1: step1, step2: step2, step2b: step2b, step3: step3, step5: step5, town: town, men: men, sim: sim, own: own };
})();
