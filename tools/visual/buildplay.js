// Base building played by script (2026-10-24, Robin: "try building with it in different locations ... several floors ... decorating
// inside ... a little village with paths"). In the pane: open dist/game.html?mute=1 (a fresh game), load tools/visual/drive.js,
// H2.drop(), write the page again, then load this file. Every piece goes through the game's own placing (debug().place), so what
// the game refuses is refused here too and the reason is kept: BP.log lists every refusal.
//   BP.free()                     every piece known and free (Admin's free building, the sandbox's keys)
//   BP.at(x, y)                   the hero to a place (the camera follows)
//   BP.house(tx, ty, w, h, o)     walls round a room of w by h tiles from tile (tx, ty): o.wall (material 0..6), o.door ('s','n','e','w'
//                                 or a list), o.windows (how many), o.floor (material), o.roof (material), o.up (a storey above: stairs
//                                 inside, walls and a roof up there), o.items ([[name, dx, dy], ...] tiles from the room's corner)
//   BP.path(points, k)            a painted path through points (world units), k the brush (1 gravel, 2 earth, 3 moss)
//   BP.item(name, x, y, L)        one thing at a world point on floor L
//   BP.snap(name)                 the canvas as a PNG data URL (too big for the tool: decode it from the saved result)
(function () {
  function D() { return Combat.api.debug(); } function P() { return Combat.dbg().P; } var T = 32;
  var BP = { log: [], placed: 0 };
  function idx(id, m) { return D().pieceIndex(id, m); }
  function put(i, x, y, what) { var p = P(); var r = D().place(i, x, y - (p.lvl ? Build.UP / 0.75 : 0));   /* (upstairs the game reads the cursor a storey lower, so the point is raised by a storey, as a player's mouse would be) */ if (r && r.ok) BP.placed++; else BP.log.push(what + ': ' + ((r && r.why) || 'nothing to aim at')); return r && r.ok; }
  function near(x, y) { var p = P(), up = p.lvl ? 1 : 0; if (Math.hypot(p.x - x, p.y - y) > (up ? 30 : 110)) { p.x = x; p.y = y + (up ? 10 : 40); p.vx = p.vy = 0; } }   /* (upstairs the cursor points a storey lower: stand close) */
  BP.free = function () { var A = D(); try { A.admin('free'); } catch (e) {} var s = A.seenAll(); ['slept', 'leather', 'honey', 'copper', 'mason', 'charcoal', 'ironBar', 'bogIron', 'silver', 'snakeBlood', 'raft', 'trapper'].forEach(function (k) { s[k] = 1; }); return 'free building on'; };
  BP.at = function (x, y) { D().goto(x, y); H2.sim(20, D().tick); return [Math.round(P().x), Math.round(P().y)]; };
  BP.house = function (tx, ty, w, h, o) {
    o = o || {}; var wm = o.wall || 0, doors = [].concat(o.door || 's'), nwin = o.windows == null ? 2 : o.windows, L = o.L || 0, a, b, wins = 0;
    var p = P(); p.lvl = L;
    var doorAt = { s: tx + Math.floor(w / 2), n: tx + Math.floor(w / 2), e: ty + Math.floor(h / 2), w: ty + Math.floor(h / 2) };
    function edge(kind, m, x, y, what) { near(x, y); return put(idx(kind, m), x, y, what); }
    if (L && o.floor != null) for (a = 0; a < w; a++) for (b = 0; b < h; b++) { var ux = (tx + a + 0.5) * T, uy = (ty + b + 0.5) * T; near(ux, uy); put(idx('floor', o.floor), ux, uy, 'upper floor ' + a + ',' + b); }   /* upstairs the floor comes first: a wall there stands only beside floor */
    for (a = 0; a < w; a++) {
      var xs = (tx + a + 0.5) * T, top = doors.indexOf('n') >= 0 && tx + a === doorAt.n, bot = doors.indexOf('s') >= 0 && tx + a === doorAt.s;
      var winTop = !top && wins < nwin && a === Math.floor(w / 4) && w >= 4; if (winTop) wins++;
      edge(top ? 'door' : winTop ? 'window' : 'wall', top || winTop ? 0 : wm, xs, ty * T, 'north wall ' + a);
      var winBot = !bot && wins < nwin && a === w - 1 - Math.floor(w / 4) && w >= 4; if (winBot) wins++;
      edge(bot ? 'door' : winBot ? 'window' : 'wall', bot || winBot ? 0 : wm, xs, (ty + h) * T, 'south wall ' + a);
    }
    for (b = 0; b < h; b++) {
      var ys = (ty + b + 0.5) * T, lw = doors.indexOf('w') >= 0 && ty + b === doorAt.w, rw = doors.indexOf('e') >= 0 && ty + b === doorAt.e;
      edge(lw ? 'door' : 'wall', lw ? 0 : wm, tx * T, ys, 'west wall ' + b); edge(rw ? 'door' : 'wall', rw ? 0 : wm, (tx + w) * T, ys, 'east wall ' + b);
    }
    H2.step(2);
    if (o.floor != null && !L) for (a = 0; a < w; a++) for (b = 0; b < h; b++) { var fx = (tx + a + 0.5) * T, fy = (ty + b + 0.5) * T; near(fx, fy); put(idx('floor', o.floor), fx, fy, 'floor ' + a + ',' + b); }
    if (o.roof != null) { var rx = (tx + w / 2) * T, ry = (ty + h / 2) * T; near(rx, ry); put(idx('roof', o.roof), rx, ry, 'roof'); }
    if (o.up && !L) {
      var sx = (tx + w - 1 + 0.5) * T, sy = (ty + 1 + 0.5) * T; near(sx, sy + 40); put(idx('stairs'), sx, sy, 'stairs'); H2.step(2);
      p.lvl = 1; BP.house(tx, ty, w, h, Object.assign({}, o.up, { L: 1, up: null, door: o.up.door || [] })); p.lvl = 0;
    }
    (o.items || []).forEach(function (q) { BP.item(q[0], (tx + q[1]) * T, (ty + q[2]) * T, q[3] || L); });
    p.lvl = 0; H2.step(2); return BP.placed;
  };
  BP.item = function (name, x, y, L) { var p = P(); p.lvl = L || 0; near(x, y); var i = D().pieceIndex(name), ok = i >= 0 && put(i, x, y, name + ' at ' + Math.round(x / T) + ',' + Math.round(y / T) + (L ? ' upstairs' : '')); p.lvl = 0; return ok; };
  BP.brushIdx = function (k) { var b0 = D().pieceIndex('brush'); return b0 < 0 ? -1 : b0 + ({ 1: 0, 2: 1, 3: 2, 0: 3 })[k == null ? 1 : k]; };   /* the four brushes stand in a row: gravel, earth, moss, grass back */
  BP.path = function (pts, k) { var bk = BP.brushIdx(k), n = 0, i, s; if (bk < 0) { BP.log.push('no brush'); return 0; }
    for (i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), steps = Math.max(1, Math.ceil(len / 9)); for (s = 0; s <= steps; s++) { var x = a[0] + (b[0] - a[0]) * s / steps, y = a[1] + (b[1] - a[1]) * s / steps; near(x, y); if (put(bk, x, y, 'path')) n++; } }
    return n; };
  BP.snap = function () { var cv = document.getElementById('cv'); return cv.toDataURL('image/png'); };
  window.BP = BP;
})();
