// The start, played by script (2026-10-12): from the wreck to the raft on the game as it is built, to find what broke or went out
// of balance. Run in the page, like tools/visual/mountainplay.js:
//   1. open dist/game.html (the real game; a fresh one: remove 'game.save' from this origin's storage first)
//   2. load tools/visual/drive.js, then document.open(); document.write(await (await fetch(location.href)).text()); document.close();
//   3. load this file, then call the steps in order, ONE A CALL (the browser tool cuts a script off after about half a minute, and
//      a script cut off in mid-frame leaves the game's loop dead: reload the page and go on from its save):
//        ST.land()  ST.tools()  ST.wood()  ST.stoneAndFiber()  ST.arms()  ST.boar()  ST.deer()  ST.home()  ST.brokk()
//        ST.bench()  ST.raft()  ST.cross()  ST.night();  and since 2026-10-14 ST.berries() (after tools) and ST.cook() (after home)
// Each returns a line or two to read. What is walked and waited is ticked without a picture (fast); what falls or dies is
// drawn (a felled tree only becomes a trunk in a drawn frame). The script walks by the keys and swings by the keys; where it
// jumps the hero to a place (ST.brokk, ST.bench) or adds to the bag (ST.raft), the line says so.
window.ST = (function () {
  function D() { return Combat.api.debug(); } function P() { return Combat.dbg().P; } function T() { return 32; }
  var ST = { frames: 0 };
  function fast(n) { for (var i = 0; i < (n || 1); i++) { D().tick(1 / 60); ST.frames++; } }
  function draw(n) { for (var i = 0; i < (n || 1); i++) { if (!H2.step(1)) throw new Error('the game loop is dead: reload the page'); ST.frames++; } }
  function key(c, d) { Combat.key(c, d); } function clear() { ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'KeyJ', 'KeyK'].forEach(function (c) { key(c, false); }); }
  function tap(c) { key(c, true); fast(2); key(c, false); fast(2); }
  function take(digit) { var h = D().hand ? D().hand()[P().mode] : -1; if (h !== digit - 1) tap('Digit' + digit); }   // (2026-10-14: the number of the thing already in hand puts it away, so the slot is pressed only when it is not in hand)
  function inv() { var v = D().inv, o = {}; for (var k in v) if (v[k]) o[k] = v[k]; return o; }
  function clock() { var d = D().day(); return 'day ' + d.n + ', ' + Math.floor(d.t / 60) + ':' + ('0' + Math.floor(d.t % 60)).slice(-2); }
  function walkTo(x, y, r, max) {
    var best = 1e9, stall = 0, f = 0, side = 1; r = r || 12; max = max || 3000;
    for (; f < max; f++) { var p = P(), dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy); if (d < r || p.dead) break; if (d < best - 0.5) { best = d; stall = 0; } else stall++;
      var ax = dx, ay = dy; if (stall > 25) { var k = stall > 90 ? 1.6 : 1; ax = dx - side * dy * k; ay = dy + side * dx * k; if (stall > 160) { side = -side; stall = 26; best = d + 30; } }
      key('KeyD', ax > 3); key('KeyA', ax < -3); key('KeyS', ay > 3); key('KeyW', ay < -3); fast(1); }
    clear(); return f;
  }
  function pick(radius) { var n = 0, g = 0; for (;;) { var p = P(), ds = D().drops.filter(function (q) { return Math.hypot(q.x - p.x, q.y - p.y) < radius; }).sort(function (a, b) { return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y); }); if (!ds.length || g++ > 50) break; var b4 = D().drops.length; walkTo(ds[0].x, ds[0].y, 8, 900); fast(20); if (D().drops.length < b4) n++; else if (g > 25) break; } return n; }
  function nearest(test) { var b = null, bd = 1e9, p = P(); D().world().eachProp(function (o) { if (!test(o) || o.dying != null) return; var d = Math.hypot(o.x - p.x, o.y - p.y); if (d < bd) { bd = d; b = o; } }); return b; }
  function mode(m) { if (P().mode !== m) tap('KeyQ'); if (P().mode !== m) P().mode = m; }
  function make(id) { var r = D().recipes2.filter(function (q) { return q.id === id; })[0]; D().craft(r); fast(200); }
  function work(o, digit, dx) { take(digit); walkTo(o.x + dx, o.y + 2, 6, 2400); key(dx < 0 ? 'KeyD' : 'KeyA', true); fast(6); key(dx < 0 ? 'KeyD' : 'KeyA', false); var f = 0; key('KeyJ', true); for (; f < 2400 && o.dying == null && o.hp > 0; f++) fast(1); key('KeyJ', false); draw(110); return f; }
  function trunks() { var t = D().trunks; return typeof t === 'function' ? t() : t; }
  function beasts(kind) { var G = Combat.dbg(), p = P(); return ((G.W && G.W.enemies) || []).filter(function (e) { return !e.dead && e.kind === kind; }).sort(function (a, b) { return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y); }); }

  ST.land = function () { draw(30); var k = {}; D().drops.forEach(function (q) { k[q.kind] = (k[q.kind] || 0) + 1; }); var f0 = ST.frames; pick(420); return 'woke at ' + Math.round(P().x) + ',' + Math.round(P().y) + '; lying about: ' + JSON.stringify(k) + '; picked up in ' + Math.round((ST.frames - f0) / 60) + ' s: ' + JSON.stringify(inv()); };
  ST.tools = function () { ['flintAxe', 'flintPick', 'flintKnife'].forEach(make); mode('gather'); return 'the first tools: ' + D().slots.filter(Boolean).filter(function (s) { return s.kind === 'item'; }).map(function (s) { return s.item.mat + ' ' + s.item.kind; }).join(', ') + '; left ' + JSON.stringify(inv()) + '; ' + clock(); };
  ST.wood = function () {                                 // a tree from one side, then its trunk; then one the woodcutter's way (the back cut)
    mode('gather'); var out = [];
    [false, true].forEach(function (smart) {
      var t = nearest(function (o) { return o.kind === 'tree'; }), w0 = inv().wood || 0, f0 = ST.frames; take(1); walkTo(t.x - 22, t.y + 2, 6, 2400); key('KeyD', true); fast(6); key('KeyD', false);
      var fa = ST.frames, sw = false, i; key('KeyJ', true); for (i = 0; i < 3600 && t.dying == null && t.hp > 0; i++) { fast(1); if (smart && !sw && t.notch != null) { key('KeyJ', false); walkTo(t.x + 22, t.y + 2, 6, 400); key('KeyA', true); fast(6); key('KeyA', false); key('KeyJ', true); sw = true; } } key('KeyJ', false);
      var chop = (ST.frames - fa) / 60; draw(200);
      var p = P(), tr = trunks().filter(function (q) { return Math.hypot(q.x - p.x, q.y - p.y) < 260 && q.logs > 0; })[0]; if (tr) { walkTo(tr.x - tr.len * 0.25, tr.y + 16, 6, 1200); key('KeyW', true); fast(6); key('KeyW', false); key('KeyJ', true); for (i = 0; i < 900 && tr.logs > 0; i++) fast(1); key('KeyJ', false); draw(60); }
      pick(260); out.push(t.name + (smart ? ', notch and back cut' : ', from one side') + ': felled in ' + chop.toFixed(1) + ' s, ' + ((inv().wood || 0) - w0) + ' wood in the bag after ' + ((ST.frames - f0) / 60).toFixed(0) + ' s');
    });
    return out.join('\n') + '\n' + JSON.stringify(inv()) + '; ' + clock();
  };
  ST.stoneAndFiber = function () { mode('gather'); var i0 = inv(), f0 = ST.frames, a = work(nearest(function (o) { return o.kind === 'stone'; }), 2, -20); pick(120); var b = 0, i; for (i = 0; i < 5; i++) { b += work(nearest(function (o) { return o.kind === 'bush'; }), 3, -16); pick(120); } var i1 = inv(); return 'a rock mined in ' + (a / 60).toFixed(1) + ' s: ' + ((i1.stone || 0) - (i0.stone || 0)) + ' stone; five bushes cut: ' + ((i1.fiber || 0) - (i0.fiber || 0)) + ' fiber, ' + ((i1.berries || 0) - (i0.berries || 0)) + ' berries; all in ' + Math.round((ST.frames - f0) / 60) + ' s; ' + JSON.stringify(i1) + '; ' + clock(); };
  ST.arms = function () { ['woodClub', 'woodBow'].forEach(make); draw(3); return 'a club and a bow made (the bow shoots without arrows since 2026-10-13); ' + JSON.stringify(inv()); };
  ST.berries = function () {                              // E at a berry bush: the berries drop and are picked up (2026-10-14)
    var b = nearest(function (o) { return o.kind === 'bush' && /berr/i.test(o.name); }); if (!b) return 'no berry bush near'; walkTo(b.x - 20, b.y + 4, 8, 2400); key('KeyD', true); fast(4); key('KeyD', false); var i0 = inv().berries || 0, d0 = D().drops.length;
    var w = D().eDo(); if (!w || !w.act) return 'E offers nothing at the bush (' + (w ? w.say : '') + ')'; w.act(); fast(5); var dropped = D().drops.length - d0; pick(120); return 'E said "' + w.say + '"; berries dropped: ' + dropped + '; in the bag after picking up: ' + ((inv().berries || 0) - i0) + ' more; ' + JSON.stringify(inv());
  };
  ST.cook = function () {                                 // at the hut's fire: a dish queued, cooked and waiting at the station (2026-10-14)
    var s = ST.site; if (!s) return 'no hut (ST.home first)'; var q = P(); q.x = (s.tx + 0.6) * 32 + 2; q.y = (s.ty + 0.6) * 32 + 26; q.face = -Math.PI / 2; fast(5); if (!(inv().meat > 0)) { D().addItem('meat', 1); } if (!(inv().berries >= 3)) D().addItem('berries', 3);
    var ok1 = D().cook('cookedMeat'), ok2 = D().cook('roastBerries'); fast(60 * 12); draw(2); var fires = D().cookFires ? D().cookFires() : null; var f = fires && fires[0];
    return 'queued: meat ' + ok1 + ', roast berries ' + ok2 + '; after 12 s the fire holds ' + (f ? JSON.stringify({ cooking: (f.cooking || []).length, ready: (f.out || []).map(function (o) { return o && (o.kind + ' x' + o.n); }) }) : 'no fire found') + '; ' + JSON.stringify(inv());
  };
  ST.boar = function () {                                 // a plain fighter: turns to face it and swings when it is in reach; never blocks, never steps aside
    mode('fight'); take(1); var b = beasts('boar')[0]; if (!b) return 'no boar on the island'; var hp0 = P().hp, bh = b.hp, bd = b.cfg.dmg; walkTo(b.x, b.y, 60, 3000);
    var f = 0, hits = 0, hurt = 0, lb = b.hp, lh = P().hp; for (; f < 3600 && !b.dead && !P().dead; f++) { var p = P(), dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy); key('KeyD', dx > 4); key('KeyA', dx < -4); key('KeyS', dy > 4); key('KeyW', dy < -4); key('KeyJ', d < 46); fast(1); if (b.hp < lb) { hits++; lb = b.hp; } if (P().hp < lh) { hurt++; lh = P().hp; } }
    clear(); draw(120); var dead = P().dead, res = 'a boar of ' + bh + ' health that does ' + bd + (b.young ? ' (a young one)' : '') + ', fought with the club by trading blows: ' + (b.dead ? 'the boar dead' : 'the boar alive') + ' after ' + Math.round(f / 60) + ' s and ' + hits + ' blows landed; the hero hit ' + hurt + ' times, ' + (dead ? 'DEAD' : Math.round(P().hp) + ' of ' + Math.round(hp0) + ' health left');
    if (dead) { tap('KeyR'); fast(40); } else pick(200); return res + '; ' + JSON.stringify(inv());
  };
  ST.deer = function () {                                 // (the bow aims by the mouse; the script has none, so it lets the bow aim where the hero faces)
    mode('fight'); take(2); var was = Combat.S.ranged; Combat.S.ranged = 'auto'; var d0 = beasts('deer')[0]; if (!d0) { Combat.S.ranged = was; return 'no deer'; } walkTo(d0.x, d0.y, 150, 3600);
    var G = Combat.dbg(), shots = 0, pn = G.W.projs.length, f = 0; for (; f < 1500 && !d0.dead; f++) { if (G.W.projs.length > pn) shots += G.W.projs.length - pn; pn = G.W.projs.length;   /* (no quiver since 2026-10-13: the shots are counted as they fly) */ var p = P(), dx = d0.x - p.x, dy = d0.y - p.y, d = Math.hypot(dx, dy); key('KeyD', dx > 4); key('KeyA', dx < -4); key('KeyS', dy > 4); key('KeyW', dy < -4); key('KeyJ', d < 170 && (f % 40) < 3); fast(1); }
    clear(); draw(100); Combat.S.ranged = was; var shot = shots; pick(700); return 'a deer: ' + (d0.dead ? 'brought down' : 'got away') + ' with ' + shot + ' arrows loosed in ' + Math.round(f / 60) + ' s; ' + JSON.stringify(inv());
  };
  ST.home = function () {                                 // a hut of four by three where the hero stands, a fire, a bench, a bed and a rug in it
    var W = D().world(), p = P(), tx0 = Math.floor(p.x / 32), ty0 = Math.floor(p.y / 32), site = null, r, dy, dx, a, b;
    for (r = 2; r < 16 && !site; r++) for (dy = -r; dy <= r && !site; dy++) for (dx = -r; dx <= r && !site; dx++) { var tx = tx0 + dx, ty = ty0 + dy, ok = true; for (b = -1; b <= 3 && ok; b++) for (a = -1; a <= 4 && ok; a++) { var x = (tx + a + 0.5) * 32, y = (ty + b + 0.5) * 32; if (!W.isLand(x, y) || W.elevAt(x, y) < 1.2) ok = false; } if (ok) { var blocked = false; W.eachProp(function (o) { if (o.kind && o.x > (tx - 1) * 32 && o.x < (tx + 5) * 32 && o.y > (ty - 1) * 32 && o.y < (ty + 4) * 32) blocked = true; }); if (!blocked) site = { tx: tx, ty: ty }; } }
    if (!site) return 'no room for a hut near here'; ST.site = site; var i0 = inv(), no = [];
    function put(id, m, x, y, sx, sy) { var q = P(); q.x = sx; q.y = sy; fast(1); var t = D().place(D().pieceIndex(id, m), x, y); if (!t || !t.ok) no.push(id + ': ' + ((t && t.why) || 'nothing to aim at')); }
    for (a = 0; a < 4; a++) { put('wall', 0, (site.tx + a + 0.5) * 32, site.ty * 32, (site.tx + a + 0.5) * 32, site.ty * 32 + 30); put(a === 1 ? 'door' : 'wall', 0, (site.tx + a + 0.5) * 32, (site.ty + 3) * 32, (site.tx + a + 0.5) * 32, (site.ty + 3) * 32 + 30); }
    for (b = 0; b < 3; b++) { put('wall', 0, site.tx * 32, (site.ty + b + 0.5) * 32, site.tx * 32, (site.ty + b + 0.5) * 32 + 30); put('wall', 0, (site.tx + 4) * 32, (site.ty + b + 0.5) * 32, (site.tx + 4) * 32, (site.ty + b + 0.5) * 32 + 30); }
    var mx = (site.tx + 2) * 32, my = (site.ty + 1.6) * 32; [['campfire', 0.6, 0.6], ['bench', 3.3, 0.6], ['bed', 3.2, 2.3], ['rug', 1.8, 1.6]].forEach(function (q) { put(q[0], null, (site.tx + q[1]) * 32, (site.ty + q[2]) * 32, mx, my); });
    fast(5); draw(3); P().mode = 'fight'; var i1 = inv(), spent = {}, k; for (k in i0) if ((i0[k] || 0) !== (i1[k] || 0)) spent[k] = (i0[k] || 0) - (i1[k] || 0);
    return 'a hut ' + Math.round(Math.hypot(mx - D().home.x, my - D().home.y)) + ' units from the wreck; it cost ' + JSON.stringify(spent) + (no.length ? '; REFUSED: ' + no.join(', ') : '') + '; your home\'s comfort: ' + JSON.stringify(D().comfort());
  };
  ST.brokk = function () {                                // (the hero is put beside him: finding the steading is not what is tested here)
    var n = D().npc(), v = D().village(); if (!n) return 'no Brokk'; var said = [], i; for (i = 0; i < 10 && !D().seen.raft; i++) { var st = D().brokk(); D().talk(); said.push(st + ': ' + n.say); fast(20); }
    return 'the steading lies ' + Math.round(Math.hypot((v.tx + v.w / 2) * 32 - D().home.x, (v.ty + v.h / 2) * 32 - D().home.y)) + ' units from the wreck\n' + said.join('\n') + '\nthe raft taught: ' + !!D().seen.raft;
  };
  ST.bench = function () {                                // (the hero is put on the wreck's beach)
    var q = P(); q.x = D().home.x + 44; q.y = D().home.y + 10; fast(5); var i = D().pieceIndex('ship1'), spot = null, why = {}, tx0 = Math.floor(q.x / 32), ty0 = Math.floor(q.y / 32), r, dy, dx;
    for (r = 0; r < 12 && !spot; r++) for (dy = -r; dy <= r && !spot; dy++) for (dx = -r; dx <= r && !spot; dx++) { var x = (tx0 + dx + 0.5) * 32, y = (ty0 + dy + 0.5) * 32; q = P(); q.x = x + 34; q.y = y + 20; var t = D().target(i, x, y); if (t && t.ok) spot = { x: x, y: y }; else if (t && t.why) why[t.why] = 1; }
    if (!spot) return 'the raft bench can go nowhere near the wreck: ' + Object.keys(why).join('; '); q = P(); q.x = spot.x + 34; q.y = spot.y + 20; fast(1); var pl = D().place(i, spot.x, spot.y); fast(5); P().mode = 'fight';
    return 'the raft bench: ' + (pl && pl.ok ? 'built on the sand' : 'REFUSED: ' + (pl && pl.why)) + '; ' + JSON.stringify(inv());
  };
  ST.raft = function () {                                 // three logs side by side, a lashing on each; the bag is topped up for them, and the line says by how much
    P().mode = 'fight'; H2.keyev('KeyE', true); draw(2); H2.keyev('KeyE', false); draw(40); if (!D().yard().inYard) return 'E at the bench did not open the Shipyard';
    var i0 = inv(), need = { wood: 6, fiber: 6 }, add = {}, k; for (k in need) if ((i0[k] || 0) < need[k]) { add[k] = need[k] - (i0[k] || 0); D().addItem(k, add[k]); }
    var S = Yard.scene, PL = S.parts(), at = function (i, j) { return { x: S.Y.X + (i + 0.5) * 32, y: S.Y.Y + (j + 0.5) * 32 }; }, ix = function (id) { for (var q = 0; q < PL.length; q++) if (PL[q].id === id) return q; return 0; }, j, says = [];
    S.pick = ix('log'); for (j = 1; j <= 3; j++) { S.act(at(2, j), true); says.push(S.check() || 'ready'); } S.pick = ix('lash'); for (j = 1; j <= 3; j++) { S.act(at(2, j), true); says.push(S.check() || 'ready'); }
    if (S.check()) return 'the hull is not ready: ' + S.check(); S.host.finish(); draw(60); var rf = D().raftObj();
    return 'the yard said, part by part: ' + says.join(' | ') + '\n' + (Object.keys(add).length ? '(added to the bag for it: ' + JSON.stringify(add) + ') ' : '') + (rf ? 'a raft lies in the water at ' + Math.round(rf.x) + ',' + Math.round(rf.y) : 'NO RAFT');
  };
  ST.cross = function () {
    var rf = D().raftObj(); if (!rf) return 'no raft'; var q = P(); q.x = rf.x + 10; q.y = rf.y + 30; fast(3); P().mode = 'fight'; D().raftUse(); fast(10); if (!D().raftObj().aboard) return 'could not board';
    var big = D().isles()[1], tx = big.x * 32, ty = big.y * 32, W = D().world(), f = 0, lastD = 1e9, stall = 0, side = 1;
    for (; f < 12000; f++) { var r = D().raftObj(), dx = tx - r.x, dy = ty - r.y, d = Math.hypot(dx, dy); if (f % 90 === 0) { if (d > lastD - 20) stall++; else stall = 0; lastD = d; if (stall > 4) break; }
      var go = stall >= 2 ? [dx * 0.3 - side * dy, dy * 0.3 + side * dx] : [dx, dy]; key('KeyD', go[0] > 20); key('KeyA', go[0] < -20); key('KeyS', go[1] > 20); key('KeyW', go[1] < -20); fast(1); }
    clear(); D().raftUse(); fast(20); draw(5); q = P(); return 'paddled for ' + Math.round(f / 60) + ' s; stepped ashore: ' + !D().raftObj().aboard + ', on land: ' + W.isLand(q.x, q.y) + ', "You have left the island": ' + !!D().left() + '; ' + clock();
  };
  ST.night = function () {                                // back in the hut by its fire as night falls: do the wolves keep off, and does the bed give a morning
    var s = ST.site; if (!s) return 'no hut (ST.home first)'; var rf = D().raftObj(); if (rf && rf.aboard) D().raftUse(); var q = P(); q.x = (s.tx + 2) * 32; q.y = (s.ty + 1.6) * 32; fast(5); D().day(1195); fast(60 * 12); draw(3);
    var G = Combat.dbg(), wolves = function () { return ((G.W && G.W.enemies) || []).filter(function (e) { return !e.dead && e.kind === 'wolf'; }); }, n0 = wolves().length, hp0 = P().hp; fast(60 * 40); draw(3); var lost = Math.round(hp0 - P().hp), n1 = wolves().length;
    q = P(); q.x = (s.tx + 2.6) * 32; q.y = (s.ty + 2.2) * 32; fast(5); var d0 = D().day().n; D().sleep(); fast(60 * 8); draw(5); var rs = D().rested; rs = typeof rs === 'function' ? rs() : rs;
    return 'night: ' + n0 + ' wolves came; forty seconds by the fire cost ' + lost + ' health and ' + n1 + ' wolves were left; slept from day ' + d0 + ' to day ' + D().day().n + ', rested for ' + Math.round((rs || 0) / 60) + ' minutes';
  };
  ST.inv = inv; ST.clock = clock; ST.pick = pick; ST.walkTo = walkTo;
  return ST;
})();
