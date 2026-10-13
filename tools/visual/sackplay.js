// The big trials (2026-10-13; Robin: build a big village or town and raid it, destroying houses and breaking in; then again
// with bigger houses; fix what is found). A place of the Destruction Editor raided by script, in the page, with a watch on
// every step for the things that should never happen. Load tools/visual/drive.js, write the page again
// (game.html?scene=ruin&big=1, with &roomy=1.5 for the bigger houses), then battleplay.js, raidplay.js, ruinplay.js and this.
// Everything is the game's own (the keys, the tools, E, G): the script only presses them, and sets the hero down at a place
// where it says so ("set down").
//   SK.setup(place, men)          'town' | 'village': the board's place, its men (0, 12, 20, 30, 40), "A raid on it" (the karve and five of yours)
//   SK.place()                    what was grown: its buildings by kind and size, wall, roofs, people, men, the ship's distance
//   SK.go(x, y, o)                the hero walks there by the grid (o.run, o.near, o.secs); SK.jump(x, y) sets him down
//   SK.breach(q)                  q = { L, tx, ty } a piece of wall: to its outer side, the right tool, blows until it gives
//   SK.fell(lot, o)               pieces of a building's wall one after another until its roof is down (o.max pieces, o.secs)
//   SK.torch(q)                   a torch, E at that piece (the wall, or the eaves over it), and the moment it takes to catch
//   SK.burnWait(secs)             the clock runs while anything burns; what burnt
//   SK.hallBack()                 the jarl's hall by its back wall: through it, the lock, the chest on the shoulder, out by the hole
//   SK.sack(o)                    every building of the place in turn: burnt if it burns, else felled (o.god keeps the hero alive)
//   SK.watch()                    what the watch saw since SK.watchReset(): walls walked through, men who stood, men in a fire,
//                                 people hidden in a house that is gone, the cost of a step; SK.check() the grid against the walls
//   SK.log                        a line for every step
window.SK = (function () {
  var T = 32, DT = 1 / 60, log = [], god = false, WT = null;
  function dbg() { return Combat.api.debug(); }
  function D() { return Combat.dbg(); }
  function P() { return D().P; }
  function Bd() { return dbg().ruinB(); }
  function info() { return dbg().ruinInfo(); }
  function R() { return info().RUIN; }
  function tick() { dbg().tick(DT); }
  function vi() { return dbg().battle().town; }
  function vil() { return dbg().villages()[vi()]; }
  function grid() { var n = dbg().navs(); return n[vi()] || null; }
  function rooms() { return info().rooms; }
  function men(side) { return D().W.enemies.filter(function (e) { return e.type === 'soldier' && (e.side || 0) === side; }); }
  function folk() { var v = vi(); return dbg().folk().filter(function (f) { return f.vi === v; }); }
  function note(s) { log.push(('     ' + (D().W.t - (WT ? WT.t0 : 0)).toFixed(0)).slice(-5) + ' s  ' + s); }
  function keys(ang, go) { Combat.key('KeyD', go && Math.cos(ang) > 0.38); Combat.key('KeyA', go && Math.cos(ang) < -0.38); Combat.key('KeyS', go && Math.sin(ang) > 0.38); Combat.key('KeyW', go && Math.sin(ang) < -0.38); }
  function still() { keys(0, false); Combat.button(0, false); Combat.key('KeyK', false); Combat.key('ShiftLeft', false); }
  // ---- the watch
  function watchReset() { WT = { t0: D().W.t, n: 0, ms: 0, worst: 0, crossed: [], crossN: 0, stuck: [], fire: {}, fireMax: 0, fireIdle: {}, fireIdleMax: 0, hid: 0, hidWho: {}, folkStill: [], nan: 0, pos: new Map(), win: new Map(), q: 0, heroCross: 0, heroWas: null, deaths: { fire: 0 }, hp0: new Map() }; }
  function throughWall(g, x0, y0, x1, y1, keys) {   // did a step cross a piece of wall that is shut (to him): the edges between the two tiles, read from the grid
    var ax = Math.floor(x0 / T), ay = Math.floor(y0 / T), bx = Math.floor(x1 / T), by = Math.floor(y1 / T), shut = function (v) { return v === 1 || (v === 2 && !keys); };
    if (ax === bx && ay === by) return false;
    if (ay === by) return shut(g.edgeAt('V', Math.max(ax, bx), ay));
    if (ax === bx) return shut(g.edgeAt('H', ax, Math.max(ay, by)));
    return (shut(g.edgeAt('V', Math.max(ax, bx), ay)) || shut(g.edgeAt('H', bx, Math.max(ay, by)))) && (shut(g.edgeAt('H', ax, Math.max(ay, by))) || shut(g.edgeAt('V', Math.max(ax, bx), by)));   // across a corner: both ways round it shut
  }
  function burningAt(x, y) { var ri = rooms(), B = Bd(), i = ri.at(Math.floor(x / T), Math.floor(y / T)); if (i < 0) return false; var r = ri.rooms[i]; return !!(B.fire && B.fire['R:' + r.id]) && Ruin.roofFlame(R(), B, r, Math.floor(x / T), Math.floor(y / T), 0) > 0; }
  function watchStep() {
    var g = grid(), E = D().W.enemies, i, e, pp, p = P(), v = vi();
    if (!WT) watchReset();
    if (g) {
      for (i = 0; i < E.length; i++) {
        e = E[i]; if (e.dead || e.away || e.down) { WT.pos.delete(e); continue; }
        if (!(e.x === e.x) || !(e.y === e.y)) { WT.nan++; continue; }
        pp = WT.pos.get(e); if (pp && (pp[0] !== e.x || pp[1] !== e.y) && Math.hypot(e.x - pp[0], e.y - pp[1]) < 30 && g.inside(e.x, e.y) && throughWall(g, pp[0], pp[1], e.x, e.y, e.type === 'soldier' && e.side !== 1 && e.vi === v)) { WT.crossN++; if (WT.crossed.length < 8) WT.crossed.push((e.name || e.kind || e.type) + ' (' + (e.type === 'soldier' ? (e.side ? 'yours' : 'theirs') + ', ' + e.state : 'a beast') + ') at ' + (e.x / T).toFixed(1) + ',' + (e.y / T).toFixed(1)); }
        WT.pos.set(e, [e.x, e.y]);
      }
      var F = folk(); for (i = 0; i < F.length; i++) { var f = F[i]; if (f.hidden) { WT.pos.delete(f); continue; } pp = WT.pos.get(f); if (pp && (pp[0] !== f.x || pp[1] !== f.y) && Math.hypot(f.x - pp[0], f.y - pp[1]) < 30 && g.inside(f.x, f.y) && throughWall(g, pp[0], pp[1], f.x, f.y, true)) { WT.crossN++; if (WT.crossed.length < 8) WT.crossed.push(f.name + ' (a villager' + (f.fleeing ? ', fleeing' : '') + ') at ' + (f.x / T).toFixed(1) + ',' + (f.y / T).toFixed(1)); } WT.pos.set(f, [f.x, f.y]); }
      if (WT.heroWas && Math.hypot(p.x - WT.heroWas[0], p.y - WT.heroWas[1]) < 30 && g.inside(p.x, p.y) && throughWall(g, WT.heroWas[0], WT.heroWas[1], p.x, p.y, false)) { WT.heroCross++; if (WT.crossed.length < 8) WT.crossed.push('THE HERO at ' + (p.x / T).toFixed(1) + ',' + (p.y / T).toFixed(1)); }
    }
    WT.heroWas = [p.x, p.y];
    if (++WT.q % 30) return;                 // twice a second: who stands, who is in a fire, who hides in a house that is gone
    var now = D().W.t;
    for (i = 0; i < E.length; i++) {
      e = E[i]; if (e.type !== 'soldier' || e.dead || e.away || e.down || e.out) { WT.win.delete(e); continue; }
      var w0 = WT.win.get(e); if (!w0) { WT.win.set(e, { x: e.x, y: e.y, t: now, told: 0, ch: e.choked }); continue; }
      if (e.choked !== w0.ch) { w0.ch = e.choked; w0.t = now; }                 // told to wait his turn at a door or a hole since last looked: he stands, and should
      var far = e.tgt && !e.tgt.dead ? Math.hypot((e.tgt.x || 0) - e.x, (e.tgt.y || 0) - e.y) : 0, wants = (e.state === 'chase' && far > 110) || (!!e.errand && !(e.errand.gawk && e.state === 'idle'));   // (within 110 of his foe he may be waiting for a place at him: two strike at a time)      // (a man waiting his turn at a door or a hole in a wall stands, and should)
      if (!wants || Math.hypot(e.x - w0.x, e.y - w0.y) > 8) { w0.x = e.x; w0.y = e.y; w0.t = now; }
      else if (now - w0.t > 6 && now - w0.told > 20) { w0.told = now; if (WT.stuck.length < 12) WT.stuck.push((e.name || 'a man') + ' (' + (e.side ? 'yours' : 'theirs, ' + (e.kindOf || '')) + ', ' + e.state + (e.errand ? ', an errand' : '') + (e.tgt ? ', a foe ' + Math.round(Math.hypot((e.tgt.x || 0) - e.x, (e.tgt.y || 0) - e.y)) + ' off' : '') + ') at ' + (e.x / T).toFixed(1) + ',' + (e.y / T).toFixed(1) + ' for ' + Math.round(now - w0.t) + ' s'); }
      if (burningAt(e.x, e.y)) { var ft = (WT.fire[e.name] || 0) + 0.5; WT.fire[e.name] = ft; if (ft > WT.fireMax) WT.fireMax = ft; if (!e.tgt) { var fi = (WT.fireIdle[e.name] || 0) + 0.5; WT.fireIdle[e.name] = fi; if (fi > WT.fireIdleMax) WT.fireIdleMax = fi; } }
    }
    var F2 = folk(); for (i = 0; i < F2.length; i++) {
      var f2 = F2[i], hr = dbg().homeOf(f2), gone = hr && (Ruin.ruined(Bd(), hr) || (Bd().fire && Bd().fire['R:' + hr.id]));
      if (f2.hidden && gone) { WT.hid++; WT.hidWho[f2.name] = 1; }
      if (f2.hidden || !f2.fleeing || !f2.moving) WT.win.delete(f2);
      else { var w1 = WT.win.get(f2); if (!w1) WT.win.set(f2, { x: f2.x, y: f2.y, t: now, told: 0 }); else if (Math.hypot(f2.x - w1.x, f2.y - w1.y) > 6) { w1.x = f2.x; w1.y = f2.y; w1.t = now; } else if (now - w1.t > 6 && now - w1.told > 30) { w1.told = now; if (WT.folkStill.length < 10) WT.folkStill.push(f2.name + ' at ' + (f2.x / T).toFixed(1) + ',' + (f2.y / T).toFixed(1) + (f2.refuge ? ' (for ' + (f2.refuge.x / T).toFixed(0) + ',' + (f2.refuge.y / T).toFixed(0) + ')' : ' (for home)')); } }
    }
  }
  function run(secs, each) {
    var n = Math.round(secs * 60), i, t0, t1 = Date.now(), n0 = WT ? WT.n : 0;        // (the page's own clock is the script's: real time is the wall clock's, to a millisecond)
    for (i = 0; i < n; i++) { if (god) P().hp = P().maxHp; if (each && each(i * DT) === false) break; t0 = Date.now(); H2.sim(1, tick); t0 = Date.now() - t0; if (WT) { WT.n++; if (t0 > WT.worst) WT.worst = t0; } watchStep(); if (P().dead) break; }
    if (WT) WT.ms += Date.now() - t1;
    return i * DT;
  }
  function watch() {
    if (!WT) return 'no watch'; var M = men(0), Y = men(1), F = folk();
    return { secs: Math.round(D().W.t - WT.t0), step: (WT.ms / Math.max(1, WT.n)).toFixed(2) + ' ms a step with the watch, ' + WT.worst + ' at worst', walkedThroughWalls: WT.crossN, heroThroughWalls: WT.heroCross, where: WT.crossed, stoodStill: WT.stuck, longestInAFire: WT.fireMax + ' s (with nobody to fight: ' + WT.fireIdleMax + ' s)', hiddenInAGoneHouse: Object.keys(WT.hidWho).length, peopleFleeingButStill: WT.folkStill, nan: WT.nan,
      town: M.length + ' men: ' + M.filter(function (e) { return e.dead; }).length + ' dead, ' + M.filter(function (e) { return e.out || e.fled; }).length + ' gave up or ran, ' + M.filter(function (e) { return !e.dead && e.awake !== false; }).length + ' up', yours: Y.filter(function (e) { return !e.dead && !e.down; }).length + ' of ' + Y.length + ' standing', people: F.length + ': ' + F.filter(function (f) { return f.hidden; }).length + ' hidden, ' + F.filter(function (f) { return f.refuge; }).length + ' outside the place', hero: Math.round(P().hp) + (P().dead ? ' DEAD' : '') };
  }
  // ---- the place
  function lots() { return vil().V.lots; }
  function lot(id, n) { return lots().filter(function (l) { return l.id === id; })[n || 0] || null; }
  function roomOfLot(l) { var ri = rooms(), i = ri.at(l.x, l.y); return i >= 0 ? ri.rooms[i] : null; }
  function setup(place, nMen) {
    var ru = info().RU; ru.place = place === 'village' ? 'village' : 'town'; ru.men = nMen == null ? 30 : nMen; if (P().dead) { Combat.key('KeyR', true); H2.sim(3, tick); Combat.key('KeyR', false); H2.sim(5, tick); }
    dbg().ruinDo('whole'); dbg().ruinDo('raid'); H2.sim(10, tick); log = []; watchReset(); god = false; return placeInfo();
  }
  function placeInfo() {
    var v = vil(), V = v.V, by = {}, B = Bd(), roofs = {}, walls = {}; V.lots.forEach(function (l) { by[l.id] = (by[l.id] || 0) + 1; var r = roomOfLot(l); if (r) { var rn = Ruin.ROOFN[Ruin.roofOf(B, r, 0)]; roofs[rn] = (roofs[rn] || 0) + 1; var m = Ruin.matOf(Ruin.edgesOf(B, r).filter(function (q) { return q.e.t === 'wall'; })[0].e); walls[m] = (walls[m] || 0) + 1; } });
    var hs = V.lots.filter(function (l) { return l.id === 'house'; }), ri = dbg().raidInfo(), G0 = RP.gate();
    return v.name + ', ' + Village.ARCH[v.arch].name + ': ' + V.lots.length + ' buildings (' + Object.keys(by).map(function (k) { return by[k] + ' ' + k; }).join(', ') + '); houses ' + hs.map(function (l) { return l.w + 'x' + l.h; }).join(' ') + '; the hall ' + V.lots[0].w + 'x' + V.lots[0].h + '; walls ' + JSON.stringify(walls) + ', roofs ' + JSON.stringify(roofs) + '; the wall round it: ' + (V.fence ? V.fence.kind + (V.fence.round ? ', a ring of stakes' : '') : 'none') + '; ' + folk().length + ' people, ' + men(0).length + ' men, ' + men(1).length + ' of yours; the ship ' + (ri.raft ? Math.round(Math.hypot(ri.raft.x - G0.x, ri.raft.y - G0.y) / T) : '?') + ' tiles from the gate';
  }
  function jump(x, y) { var p = P(); p.x = x; p.y = y; p.vx = p.vy = 0; p.lvl = 0; if (WT) WT.heroWas = null; H2.sim(2, tick); }
  function party(x, y) {                    // the hero and his own set down at a place (the long walk from the ship is not what is tried here)
    var Y = men(1).filter(function (e) { return !e.dead; }), i; jump(x, y); Y.forEach(function (e, k) { e.x = x + (k - (Y.length - 1) / 2) * 26; e.y = y + 34 + (k % 2) * 14; e.vx = e.vy = 0; e.way = null; if (WT) { WT.pos.delete(e); WT.win.delete(e); } }); H2.sim(4, tick); note('set down with ' + Y.length + ' of his own at ' + (x / T).toFixed(0) + ',' + (y / T).toFixed(0));
  }
  function go(x, y, o) {
    o = o || {}; var near = o.near || 14, st = { pt: 0, px: P().x, py: P().y, side: 1, sideT: 0 }, ok = false;
    var took = run(o.secs || 90, function () {
      var p = P(), d = Math.hypot(x - p.x, y - p.y); if (d < near) { ok = true; return false; }
      var g = grid(), wp = g && g.inside(p.x, p.y) ? g.next(p, x, y, D().W.t, false) : null, ax = wp && !wp.wait ? wp.x : x, ay = wp && !wp.wait ? wp.y : y;
      st.pt += DT; if (st.sideT > 0) st.sideT -= DT; if (st.pt >= 0.5) { if (Math.hypot(p.x - st.px, p.y - st.py) < 3 && !(st.sideT > 0)) { st.sideT = 0.5; st.side = -st.side; } st.pt = 0; st.px = p.x; st.py = p.y; }
      keys(Math.atan2(ay - p.y, ax - p.x) + (st.sideT > 0 ? st.side * 1.4 : 0), true); Combat.key('ShiftLeft', !!o.run); Combat.button(0, false);
    });
    still(); return ok ? took : -1;
  }
  // the outer side of a piece of wall: where to stand to strike it, and which way to face
  function outside(q) {
    var ri = rooms(), a, b, d = 17;
    if (q.L === 'H') { a = ri.at(q.tx, q.ty - 1); b = ri.at(q.tx, q.ty); var north = a < 0 || (b >= 0 && q.side === 'n'); return { x: (q.tx + 0.5) * T, y: q.ty * T + (north ? -d : d), face: north ? Math.PI / 2 : -Math.PI / 2, mx: (q.tx + 0.5) * T, my: q.ty * T }; }
    a = ri.at(q.tx - 1, q.ty); b = ri.at(q.tx, q.ty); var west = a < 0 || (b >= 0 && q.side === 'w'); return { x: q.tx * T + (west ? -d : d), y: (q.ty + 0.5) * T, face: west ? 0 : Math.PI, mx: q.tx * T, my: (q.ty + 0.5) * T };
  }
  function edgeOf(q) { return (q.L === 'H' ? Bd().H : Bd().V)[q.tx + ',' + q.ty]; }
  function breach(q, o) {
    o = o || {}; var e = edgeOf(q), sp = outside(q); if (!e) return { why: 'no piece there' }; if (e.breach || e.broken) return { gave: true, was: true };
    var took = go(sp.x, sp.y, { near: 5, secs: o.walk || 40, run: o.run }); if (took < 0) { if (o.set) jump(sp.x, sp.y); else return { why: 'could not get to it', at: [(P().x / T).toFixed(1), (P().y / T).toFixed(1)], want: [(sp.x / T).toFixed(1), (sp.y / T).toFixed(1)] }; }
    var kind = Ruin.rightTool(e), n = 0; while (P().mode !== 'gather' && n++ < 3) { Combat.key('KeyQ', true); H2.sim(2, tick); Combat.key('KeyQ', false); H2.sim(2, tick); }
    Combat.key(kind === 'stone' ? 'Digit2' : 'Digit1', true); H2.sim(2, tick); Combat.key(kind === 'stone' ? 'Digit2' : 'Digit1', false); H2.sim(2, tick);
    P().face = sp.face; var wf = dbg().wallFaced(); if (!wf || wf.e !== e) { run(0.2, function () { keys(sp.face, true); }); still(); P().face = sp.face; wf = dbg().wallFaced(); }
    if (!wf || wf.e !== e) return { why: 'not the piece faced', faced: wf ? wf.L + wf.k : null };
    var blows = 0, last = e.dmg || 0, t = run(o.secs || 45, function () { P().face = sp.face; Combat.button(0, true); if ((e.dmg || 0) !== last) { blows++; last = e.dmg || 0; } if (e.breach || e.broken) return false; });
    still(); run(0.3);
    return { gave: !!(e.breach || e.broken), blows: blows, secs: +t.toFixed(1), mat: Ruin.matOf(e), dmg: +(e.dmg || 0).toFixed(0) };
  }
  // a building brought down by its walls: the pieces a tool in the hand takes, nearest first, until the roof is down
  function fell(l, o) {
    o = o || {}; var r = roomOfLot(l), B = Bd(), n = 0, secs = 0, blows = 0, why = null, t0 = D().W.t; if (!r) return { why: 'no room' };
    if (Ruin.ruined(B, r)) return { down: true, was: true };
    var E = Ruin.edgesOf(B, r).filter(function (q) { var m = Ruin.matOf(q.e); return Ruin.standing(q.e) && ((R().bite.axe[m] || 0) > 0.2 || (R().bite.pick[m] || 0) > 0.2) && R().hp[m] > 0; });
    while (!Ruin.ruined(Bd(), r) && E.length && n < (o.max || 40) && D().W.t - t0 < (o.secs || 240)) {
      var p = P(); E.sort(function (a, b) { var sa = outside({ L: a.L, tx: a.x, ty: a.y }), sb = outside({ L: b.L, tx: b.x, ty: b.y }); return Math.hypot(sa.x - p.x, sa.y - p.y) - Math.hypot(sb.x - p.x, sb.y - p.y); });
      var q = E.shift(), res = breach({ L: q.L, tx: q.x, ty: q.y }, { set: o.set, run: true, walk: 25 }); if (res.gave && !res.was) { n++; blows += res.blows; secs += res.secs; } else if (!res.gave) why = res.why || 'held';
      if (P().dead) break; r = roomOfLot(l) || r;
    }
    run(R().warn + 0.6); r = roomOfLot(l) || r;
    return { down: Ruin.ruined(Bd(), r), pieces: n, blows: blows, secs: +(D().W.t - t0).toFixed(0), striking: +secs.toFixed(0), why: why };
  }
  function torchOn() { if (!dbg().torch || !dbg().fireAtHand) return; if (!info().RU) return; }
  function torch(q) {
    var sp = outside(q), took = go(sp.x, sp.y, { near: 5, secs: 40, run: true }); if (took < 0) return { why: 'could not get to it' };
    P().face = sp.face; var w = dbg().fireAtHand(); if (!w) { dbg().ruinDo('torch'); H2.sim(4, tick); P().face = sp.face; w = dbg().fireAtHand(); }
    if (!w) return { why: 'nothing here to set alight' };
    var ed = dbg().eDo(); if (!ed || !ed.act || !/alight/.test(ed.say || '')) return { why: 'E would: ' + (ed ? ed.say : 'nothing') };
    var n0 = Ruin.alight(Bd()); ed.act(); run(R().fire.catchT + 0.4, function () { P().face = sp.face; });
    return { lit: Ruin.alight(Bd()) > n0, what: w.what, say: ed.say };
  }
  function burnWait(secs, until) { var peak = 0, t = run(secs || 120, function () { var n = Ruin.alight(Bd()); if (n > peak) peak = n; if (!n) return false; if (until && until()) return false; }); return { secs: +t.toFixed(0), peak: peak, left: Ruin.alight(Bd()) }; }
  function state() { var B = Bd(), ri = rooms(), ls = lots(), down = 0, burnt = 0, pieces = 0, given = 0; ls.forEach(function (l) { var r = roomOfLot(l); if (!r) return; var s = Ruin.strain(R(), B, r), t0 = r.tiles[0], ru = B.ruin && B.ruin[t0[0] + ',' + t0[1]]; pieces += s.n; given += Ruin.edgesOf(B, r).filter(function (q) { return q.e.breach; }).length; if (ru) { down++; if (ru.k === 'burnt') burnt++; } }); return { buildings: ls.length, down: down, burnt: burnt, pieces: pieces, given: given, alight: Ruin.alight(B) }; }
  // the grid the people walk by against the walls as they now stand: every edge the grid has, read again from the building
  function check() {
    var g = grid(), B = Bd(), v = vil(), bad = 0, n = 0, x, y, ed = Nav.edgeOf(B), first = null; if (!g) return 'no grid';
    for (y = g.y0; y < g.y0 + g.h; y++) for (x = g.x0; x < g.x0 + g.w; x++) { ['H', 'V'].forEach(function (L) { var a = g.edgeAt(L, x, y) || 0, b = ed(L, x, y) || 0; n++; if (a !== b) { bad++; if (!first) first = L + x + ',' + y + ' grid ' + a + ' wall ' + b; } }); }
    var ri = rooms(), noRoom = lots().filter(function (l) { return ri.at(l.x, l.y) < 0; }).length, F = folk(), inWall = 0;
    return { edges: n, stale: bad, first: first, buildingsThatAreNoLongerRooms: noRoom, cache: info().cache, due: Object.keys(info().due).length };
  }
  // the jarl's hall by its back wall: through it, the lock, the chest on the shoulder, out by the hole. (The place needs a hall with a heavy chest: the town.)
  function hallBack() {
    var l = lot('hall'), out = {}; if (!l) return { why: 'no hall' };
    var chest = RP.chestOf('hall'), tx = chest ? Math.floor(chest.x / T) : l.x + Math.floor(l.w / 2), q = { L: 'H', tx: tx, ty: l.y, side: 'n' }, t0 = D().W.t;
    out.wall = breach(q, { run: false }); note('the hall’s back wall: ' + JSON.stringify(out.wall) + '  ' + townLine()); if (!out.wall.gave) return out;
    var hr = roomOfLot(l); run(6, function () { var p = P(); if (rooms().rooms[rooms().at(Math.floor(p.x / T), Math.floor(p.y / T))] === hr && p.y > l.y * T + 12) return false; keys(Math.PI / 2, true); }); still();
    out.in = rooms().rooms[rooms().at(Math.floor(P().x / T), Math.floor(P().y / T))] === hr; note(out.in ? 'in through the hole' : 'COULD NOT GET IN through the hole');
    if (chest) { var ok = go(chest.x, chest.y + 16, { near: 24, secs: 12 }); out.lock = RP.hack('lock', 'hall', 20); var ed = dbg().eDo(); out.lift = ed ? ed.say : null; if (ed && ed.act && /Lift/.test(ed.say || '')) { ed.act(); H2.sim(2, tick); } out.carrying = !!dbg().raidInfo().carrying; note('the lock: ' + out.lock + ', E: ' + out.lift + ', on the shoulder: ' + out.carrying + '  ' + townLine()); }
    out.out = go((tx + 0.5) * T, (l.y - 1.2) * T, { near: 10, secs: 10 }) >= 0; note(out.out ? 'out by the hole with it' : 'COULD NOT GET OUT by the hole'); out.secs = Math.round(D().W.t - t0); return out;
  }
  // Two whole raids, for comparing one size of house with another. Each from the gate with five of his own, the hero never fighting:
  // 'hall': in at peace, the hall by its back wall, the lock, the chest, out by the hole, out of the gate and 26 tiles on.
  // 'fire': a torch to the back of the house furthest from the church, unseen if it can be; then the church's door, its lock, its
  //         chest, and out the same way. What is told: how many were up when the chest was lifted, whether he got away with it.
  function raid(kind, nMen) {
    setup('town', nMen == null ? 30 : nMen); var g = RP.gate(), o = { kind: kind }, t0 = D().W.t, dbgR = dbg();
    party(g.x, g.y + 5 * T); go(g.x, g.y - 60, { near: 16, secs: 20 });
    function up() { return men(0).filter(function (e) { return !e.dead && !e.out && !e.fled && e.awake !== false; }).length; }
    if (kind === 'hall') { var hb = hallBack(); o.wall = hb.wall ? hb.wall.secs : null; o.lifted = !!hb.carrying; }
    else {
      var ch = lot('church'), far = lots().filter(function (l) { return l.id === 'house'; }).sort(function (a, b) { return Math.hypot(b.x - ch.x, b.y - ch.y) - Math.hypot(a.x - ch.x, a.y - ch.y); })[0];
      var tr = torch({ L: 'V', tx: far.x, ty: far.y + 1 }); o.lit = !!tr.lit; var dc = RP.doorOf('church'); go(dc.x, dc.y + 30, { near: 16, secs: 80 }); o.atFire = men(0).filter(function (e) { return e.errand && e.errand.gawk; }).length; o.upAtDoor = up();
      RP.hack('door', 'church', 30); RP.toChest('church'); RP.hack('lock', 'church', 30); var ed = dbgR.eDo(); if (ed && ed.act && /Lift/.test(ed.say || '')) { ed.act(); H2.sim(2, tick); } o.lifted = !!dbgR.raidInfo().carrying;
    }
    o.upAtLift = up(); o.liftAt = Math.round(D().W.t - t0); o.hpAtLift = Math.round(P().hp);
    if (o.lifted && !P().dead) { Combat.order('follow'); var a = go(g.x, g.y + 60, { near: 24, secs: 70 }); o.outOfGate = a >= 0; if (a >= 0) o.away = go(g.x, g.y + 26 * T, { near: 30, secs: 50 }) >= 0; }
    o.carrying = !!dbgR.raidInfo().carrying; o.hero = P().dead ? 'dead' : Math.round(P().hp); o.yours = men(1).filter(function (e) { return !e.dead && !e.down; }).length; o.secs = Math.round(D().W.t - t0); o.up = up();
    return o;
  }
  function townLine() { var M = men(0), Y = men(1); return '[theirs: ' + M.filter(function (e) { return !e.dead && !e.out && !e.fled && e.awake !== false; }).length + ' up, ' + M.filter(function (e) { return !e.dead && e.tgt; }).length + ' fighting, ' + M.filter(function (e) { return e.dead || e.out || e.fled; }).length + '/' + M.length + ' out | yours ' + Y.filter(function (e) { return !e.dead && !e.down; }).length + '/' + Y.length + ' | hero ' + Math.round(P().hp) + (P().dead ? ' DEAD' : '') + ']'; }
  // every building in turn: burnt if a torch takes on it, else felled by its walls. o.from, o.n: which of the place's buildings (the calls are kept short)
  function sack(o) {
    o = o || {}; god = o.god !== false; var ls = lots(), i, out = [];
    for (i = o.from || 0; i < Math.min(ls.length, (o.from || 0) + (o.n || 3)); i++) {
      var l = ls[i], r = roomOfLot(l), B = Bd(), res; if (!r) { out.push(l.id + ': no room'); continue; }
      if (Ruin.ruined(B, r)) { out.push(l.id + ': down already'); continue; }
      var E = Ruin.edgesOf(B, r), burnE = E.filter(function (q) { return Ruin.burnsWall(R(), q.e) && !Ruin.onFire(B, q.L, q.k); })[0], roofB = Ruin.burnsRoof(R(), B, r, 0) && Ruin.roofSpec(R(), B, r, 0).catch > 0.4;
      if (o.fire !== false && (roofB || burnE)) { var q0 = burnE || E[0]; res = torch({ L: q0.L, tx: q0.x, ty: q0.y }); out.push(l.id + ' ' + l.w + 'x' + l.h + ': torch ' + JSON.stringify(res)); if (res.lit) continue; }
      res = fell(l, { set: true, secs: 150 }); out.push(l.id + ' ' + l.w + 'x' + l.h + ': felled ' + JSON.stringify(res));
    }
    return out;
  }
  return { raid: raid, setup: setup, place: placeInfo, go: go, jump: jump, party: party, breach: breach, fell: fell, torch: torch, burnWait: burnWait, hallBack: hallBack, sack: sack, state: state, check: check, watch: watch, watchReset: watchReset, run: run, still: still, note: note, lots: lots, lot: lot, roomOfLot: roomOfLot, men: men, folk: folk, outside: outside, townLine: townLine, grid: grid, set god(v) { god = !!v; }, get god() { return god; }, get log() { return log; } };
})();
