/* Nav: finding a way round walls (2026-10-13, docs/battle-plan.md rung 5; Robin: fill a big town with hirdmen, then attack it).
   Movers in the engine walk straight at what they want and slide along circles, which is right in a field and hopeless in a
   town: nobody reaches anybody through a wall. A Nav grid is a stretch of the world in tiles: which tiles a man can stand
   on, and which edges between tiles are shut (a wall, a fence, a town wall; a locked door is shut to everyone without its
   key). From it: whether a straight step or a straight line crosses anything shut (blocked, clear), a way from one place to
   another (path: A-star over the tiles, eight ways, no cutting of corners), and the corner to make for next (next: the way
   is kept on the mover and followed, looking as far along it as he can walk straight).
     Nav.make({ x0, y0, w, h, T, open(tx, ty), edge(kind, tx, ty), cost(tx, ty) })
       x0, y0, w, h: the stretch, in tiles; T: a tile's width in the world
       open: can a man stand on this tile at all (land, not water, nothing great standing on it)
       edge: what shuts the edge: kind 'H' is the tile's north edge, 'V' its west edge (the building data's own way of
             keeping them); 0 open, 1 shut, 2 shut to all but those with keys (a locked door: its own people pass),
             3 open but narrow (a door, a gate: one at a time; g.narrowAhead says when a mover is about to go through one)
       cost: something on the tile that a man would rather walk round: added to the tile's price
       solids: the round things that stand there (trees, rocks, a hearth, a well: [{ x, y, r }] in the world's units). A
             straight line that runs into one is not clear, a tile whose middle a big one covers (a tree, a rock: r 9 and
             up) is not walked through and one a smaller covers (a hearth, a bed) is dear, so a way leads round them (a man
             walked straight at his foe into the pocket between a tree and a wall, and stood there)
   The edges are read once (make) and again when told (g.read()): after a door is broken or a wall built.
   Loads in the page and in Node. */
var Nav = (function () {
  function make(o) {
    var T = o.T, X0 = o.x0, Y0 = o.y0, GW = o.w, GH = o.h, N = GW * GH;
    var open = new Uint8Array(N), price = new Float32Array(N), eh = new Uint8Array(N + GW), ev = new Uint8Array(N + GH + GW);   // eh[y * GW + x]: the north edge of (x, y); ev[y * (GW + 1) + x]: its west edge
    var g = { x0: X0, y0: Y0, w: GW, h: GH, T: T, stamp: 0 }, SOL = [];
    function read() {
      var x, y;
      for (y = 0; y < GH; y++) for (x = 0; x < GW; x++) { open[y * GW + x] = o.open(X0 + x, Y0 + y) ? 1 : 0; price[y * GW + x] = o.cost ? (o.cost(X0 + x, Y0 + y) || 0) : 0; eh[y * GW + x] = o.edge('H', X0 + x, Y0 + y) || 0; ev[y * (GW + 1) + x] = o.edge('V', X0 + x, Y0 + y) || 0; }
      for (y = 0; y < GH; y++) ev[y * (GW + 1) + GW] = o.edge('V', X0 + GW, Y0 + y) || 0;
      for (x = 0; x < GW; x++) eh[GH * GW + x] = o.edge('H', X0 + x, Y0 + GH) || 0;
      SOL = (o.solids ? o.solids() : []).filter(function (q) { return q.r >= 6; });
      for (var si = 0; si < SOL.length; si++) { var q = SOL[si], rr = q.r + 6, tx0 = Math.floor((q.x - rr) / T - 0.5) - X0, tx1 = Math.ceil((q.x + rr) / T - 0.5) - X0, ty0 = Math.floor((q.y - rr) / T - 0.5) - Y0, ty1 = Math.ceil((q.y + rr) / T - 0.5) - Y0;
        for (y = Math.max(0, ty0); y <= Math.min(GH - 1, ty1); y++) for (x = Math.max(0, tx0); x <= Math.min(GW - 1, tx1); x++) if (Math.hypot((X0 + x + 0.5) * T - q.x, (Y0 + y + 0.5) * T - q.y) < rr) { if (q.r >= 9) open[y * GW + x] = 0; else price[y * GW + x] += 8; } }   // (a tree by a wall left a gap the grid thought a man could pass: he could not)
      g.stamp++;
    }
    function inside(tx, ty) { return tx >= 0 && ty >= 0 && tx < GW && ty < GH; }
    function shut(v, keys) { return v === 1 || (v === 2 && !keys); }
    // one step between neighbours (in the grid's own tile numbers): is anything shut between them
    function step(ax, ay, bx, by, keys) {
      if (!inside(bx, by) || !inside(ax, ay)) return true;                       // off the stretch: nothing is known there, so nothing is in the way
      if (!open[by * GW + bx]) return false;
      if (bx !== ax && by !== ay) return step(ax, ay, bx, ay, keys) && step(bx, ay, bx, by, keys) && step(ax, ay, ax, by, keys) && step(ax, by, bx, by, keys);   // a corner is not cut
      if (bx < ax) return !shut(ev[ay * (GW + 1) + ax], keys); if (bx > ax) return !shut(ev[by * (GW + 1) + bx], keys);
      if (by < ay) return !shut(eh[ay * GW + ax], keys); if (by > ay) return !shut(eh[by * GW + bx], keys);
      return true;
    }
    // a straight move in the world: does it cross anything shut (walked in pieces no longer than a third of a tile)
    function blocked(x0, y0, x1, y1, keys) {
      var d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / (T * 0.3))), i, ax = Math.floor(x0 / T) - X0, ay = Math.floor(y0 / T) - Y0, bx, by;
      for (i = 1; i <= n; i++) {
        bx = Math.floor((x0 + (x1 - x0) * i / n) / T) - X0; by = Math.floor((y0 + (y1 - y0) * i / n) / T) - Y0;
        if (bx !== ax || by !== ay) { if (!step(ax, ay, bx, by, keys)) return true; ax = bx; ay = by; }
      }
      return false;
    }
    // does a straight line run into something round: one whose nearest point to the line lies along it (not at its start: he is
    // already past or beside that one; not at its end: the place meant is beside it) and nearer than a man can pass
    function solidOn(x0, y0, x1, y1) {
      var dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy, i, q, rr, t, px, py; if (L2 < 1) return false;
      var lx = Math.min(x0, x1), hx = Math.max(x0, x1), ly = Math.min(y0, y1), hy = Math.max(y0, y1);
      for (i = 0; i < SOL.length; i++) {
        q = SOL[i]; rr = q.r + 5; if (q.x < lx - rr || q.x > hx + rr || q.y < ly - rr || q.y > hy + rr) continue;
        t = ((q.x - x0) * dx + (q.y - y0) * dy) / L2; if (t <= 0.02 || t >= 0.98) continue;
        px = x0 + dx * t - q.x; py = y0 + dy * t - q.y; if (px * px + py * py < rr * rr) return true;
      }
      return false;
    }
    // can he walk straight there: the line itself and one a little to each side of it (a man is not a point), and nothing round in it
    function clear(x0, y0, x1, y1, keys, wide) {
      if (blocked(x0, y0, x1, y1, keys)) return false; if (wide === 0) return true;
      var d = Math.hypot(x1 - x0, y1 - y0); if (d < 1) return true; var px = -(y1 - y0) / d * (wide || 6), py = (x1 - x0) / d * (wide || 6);
      // (a side line counts only if both its ends are on his side of any wall: a man pressed against a wall has one side line
      // that begins beyond it, and with that line counted he was never "clear" of the man he stood face to face with, so he
      // looked for a way round and never struck. 2026-10-13, found by the town test: a fight that never ended)
      if (!blocked(x0, y0, x0 + px, y0 + py, keys) && !blocked(x1, y1, x1 + px, y1 + py, keys) && blocked(x0 + px, y0 + py, x1 + px, y1 + py, keys)) return false;
      if (!blocked(x0, y0, x0 - px, y0 - py, keys) && !blocked(x1, y1, x1 - px, y1 - py, keys) && blocked(x0 - px, y0 - py, x1 - px, y1 - py, keys)) return false;
      return !solidOn(x0, y0, x1, y1);
    }
    var gS = new Float32Array(N), fS = new Float32Array(N), from = new Int32Array(N), mark = new Uint32Array(N), shutM = new Uint32Array(N), run = 0, heap = [];
    function push(i) { var k = heap.length, p; heap.push(i); while (k > 0) { p = (k - 1) >> 1; if (fS[heap[p]] <= fS[heap[k]]) break; var t = heap[p]; heap[p] = heap[k]; heap[k] = t; k = p; } }
    function pop() { var top = heap[0], last = heap.pop(), k = 0, n = heap.length, a, b, m; if (n) { heap[0] = last; for (;;) { a = k * 2 + 1; b = a + 1; m = k; if (a < n && fS[heap[a]] < fS[heap[m]]) m = a; if (b < n && fS[heap[b]] < fS[heap[m]]) m = b; if (m === k) break; var t = heap[m]; heap[m] = heap[k]; heap[k] = t; k = m; } } return top; }
    var DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
    // a way from one place to another, as points in the world (the middles of tiles; the last is the place itself), or null.
    // If the place cannot be reached (a locked hall), the way leads to the tile that comes nearest to it, and .short says so.
    function path(fx, fy, tx, ty, keys) {
      var sx = Math.max(0, Math.min(GW - 1, Math.floor(fx / T) - X0)), sy = Math.max(0, Math.min(GH - 1, Math.floor(fy / T) - Y0)), ex = Math.max(0, Math.min(GW - 1, Math.floor(tx / T) - X0)), ey = Math.max(0, Math.min(GH - 1, Math.floor(ty / T) - Y0));
      var s = sy * GW + sx, e = ey * GW + ex, i, k, best = s, bestH = 1e9, n = 0; run++; heap.length = 0;
      gS[s] = 0; fS[s] = 0; from[s] = -1; mark[s] = run; push(s);
      while (heap.length) {
        var c = pop(); if (shutM[c] === run) continue; shutM[c] = run; if (c === e) { best = e; bestH = 0; break; } if (++n > 6000) break;
        var cx = c % GW, cy = (c - cx) / GW, h0 = Math.abs(cx - ex) + Math.abs(cy - ey); if (h0 < bestH) { bestH = h0; best = c; }
        for (k = 0; k < 8; k++) {
          var nx = cx + DX[k], ny = cy + DY[k]; if (!inside(nx, ny)) continue; i = ny * GW + nx; if (shutM[i] === run || !step(cx, cy, nx, ny, keys)) continue;
          var cost = gS[c] + (k < 4 ? 1 : 1.4142) + price[i];
          if (mark[i] !== run || cost < gS[i]) { var dx = Math.abs(nx - ex), dy = Math.abs(ny - ey); gS[i] = cost; fS[i] = cost + Math.max(dx, dy) + 0.4142 * Math.min(dx, dy); from[i] = c; mark[i] = run; push(i); }
        }
      }
      var pts = []; for (i = best; i !== -1 && i !== s; i = from[i]) pts.push({ x: (X0 + i % GW + 0.5) * T, y: (Y0 + Math.floor(i / GW) + 0.5) * T });
      pts.reverse(); if (best === e) pts.push({ x: tx, y: ty }); else pts.short = true;
      return pts.length || best === e ? pts : null;
    }
    // Every tile that can be walked to from a place (a flood over the steps; a way's search gives up after 6000 tiles, which in a
    // big town is not the whole of it, so "can he get there at all" is asked here). Answers { has(x, y) } in the world's units.
    function flood(fx, fy, keys) {
      var sx = Math.max(0, Math.min(GW - 1, Math.floor(fx / T) - X0)), sy = Math.max(0, Math.min(GH - 1, Math.floor(fy / T) - Y0)), out = new Uint8Array(N), q = [sy * GW + sx], qi = 0, k, c, cx, cy, nx, ny, i;
      out[q[0]] = 1;
      while (qi < q.length) { c = q[qi++]; cx = c % GW; cy = (c - cx) / GW; for (k = 0; k < 4; k++) { nx = cx + DX[k]; ny = cy + DY[k]; if (!inside(nx, ny)) continue; i = ny * GW + nx; if (out[i] || !step(cx, cy, nx, ny, keys)) continue; out[i] = 1; q.push(i); } }
      return { has: function (x, y) { var tx = Math.floor(x / T) - X0, ty = Math.floor(y / T) - Y0; return inside(tx, ty) && !!out[ty * GW + tx]; } };
    }
    // The corner to make for now, or null when he can walk straight to the place. The way is kept on the mover (m.nav) until
    // the place has moved a tile, the grid has been read again, or two seconds have passed. With nowhere to go he is told to
    // stay where he is (the answer has .wait).
    function next(m, tx, ty, t, keys) {
      var here = inside(Math.floor(m.x / T) - X0, Math.floor(m.y / T) - Y0), there = inside(Math.floor(tx / T) - X0, Math.floor(ty / T) - Y0);
      if (!here && !there) { m.nav = null; return null; }
      if (clear(m.x, m.y, tx, ty, keys)) { m.nav = null; return null; }
      var gx = Math.floor(tx / T), gy = Math.floor(ty / T), nv = m.nav;
      if (!nv || nv.g !== g || nv.stamp !== g.stamp || nv.gx !== gx || nv.gy !== gy || t - nv.t > 2 || nv.keys !== !!keys) {
        var pts = path(m.x, m.y, tx, ty, keys); nv = m.nav = { g: g, stamp: g.stamp, gx: gx, gy: gy, t: t, keys: !!keys, pts: pts || [], i: 0, short: !pts || !!pts.short };
      }
      while (nv.i < nv.pts.length && Math.hypot(nv.pts[nv.i].x - m.x, nv.pts[nv.i].y - m.y) < T * 0.35) nv.i++;                      // reached
      while (nv.i + 1 < nv.pts.length && clear(m.x, m.y, nv.pts[nv.i + 1].x, nv.pts[nv.i + 1].y, keys)) nv.i++;                      // and as far along it as he can walk straight
      if (nv.i >= nv.pts.length) return nv.short && blocked(m.x, m.y, tx, ty, keys) ? { x: m.x, y: m.y, wait: true } : null;      // at the end of a way that fell short: he waits only if a wall is what is left between them
      // the last point of a whole way is the place itself: with no wall left between, that is "walk straight there" (2026-10-13:
      // two men face to face beside a corner were each given the other as a corner to make for, and a man who is being led
      // round something does not strike: found by the town test as fights that never ended)
      if (nv.i === nv.pts.length - 1 && !nv.short && !blocked(m.x, m.y, tx, ty, keys)) return null;
      return nv.pts[nv.i];
    }
    // a doorway or a gate on the straight line from a place toward another, within `reach` of the first: the middle of the tile
    // on this side of it (a page lets one or two through at a time and has the rest wait: a gate with fifteen men in it is a knot)
    function narrowTile(tx, ty) { return tx >= 0 && ty >= 0 && tx < GW && ty < GH && (eh[ty * GW + tx] >= 2 || eh[(ty + 1) * GW + tx] >= 2 || ev[ty * (GW + 1) + tx] >= 2 || ev[ty * (GW + 1) + tx + 1] >= 2); }
    function narrowAhead(x0, y0, x1, y1, reach) {
      var d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(Math.min(d, reach) / (T * 0.3))), i, ax = Math.floor(x0 / T) - X0, ay = Math.floor(y0 / T) - Y0, bx, by, k = Math.min(1, reach / (d || 1));
      for (i = 1; i <= n; i++) {
        bx = Math.floor((x0 + (x1 - x0) * k * i / n) / T) - X0; by = Math.floor((y0 + (y1 - y0) * k * i / n) / T) - Y0;
        if (bx !== ax || by !== ay) {
          if (inside(ax, ay) && inside(bx, by)) { var v = bx < ax ? ev[ay * (GW + 1) + ax] : bx > ax ? ev[by * (GW + 1) + bx] : by < ay ? eh[ay * GW + ax] : eh[by * GW + bx]; if (bx !== ax && by !== ay) v = 0; if (v >= 2) return { x: (X0 + ax + 0.5) * T, y: (Y0 + ay + 0.5) * T, bx: (X0 + bx + 0.5) * T, by: (Y0 + by + 0.5) * T, v: v, kind: bx !== ax ? 'V' : 'H', tx: X0 + (bx !== ax ? Math.max(ax, bx) : ax), ty: Y0 + (bx !== ax ? ay : Math.max(ay, by)) }; }
          ax = bx; ay = by;
        }
      }
      return null;
    }
    // a short step that crosses a locked door: which edge (the page unlocks it in the building data when one of its own goes through)
    function lockAt(x0, y0, x1, y1) {
      var ax = Math.floor(x0 / T) - X0, ay = Math.floor(y0 / T) - Y0, bx = Math.floor(x1 / T) - X0, by = Math.floor(y1 / T) - Y0;
      if ((ax === bx && ay === by) || (ax !== bx && ay !== by) || !inside(ax, ay) || !inside(bx, by)) return null;
      if (ax !== bx) { var vx = Math.max(ax, bx); return ev[ay * (GW + 1) + vx] === 2 ? { kind: 'V', tx: X0 + vx, ty: Y0 + ay } : null; }
      var hy = Math.max(ay, by); return eh[hy * GW + ax] === 2 ? { kind: 'H', tx: X0 + ax, ty: Y0 + hy } : null;
    }
    g.lockAt = lockAt;
    g.narrowAhead = narrowAhead; g.narrowTile = function (x, y) { return narrowTile(Math.floor(x / T) - X0, Math.floor(y / T) - Y0); };
    g.solidOn = solidOn; g.read = read; g.step = step; g.blocked = blocked; g.clear = clear; g.path = path; g.flood = flood; g.next = next; g.inside = function (x, y) { return inside(Math.floor(x / T) - X0, Math.floor(y / T) - Y0); };
    g.openAt = function (x, y) { var tx = Math.floor(x / T) - X0, ty = Math.floor(y / T) - Y0; return !inside(tx, ty) || !!open[ty * GW + tx]; };
    g.edgeAt = function (kind, tx, ty) { tx -= X0; ty -= Y0; if (kind === 'H') return tx >= 0 && tx < GW && ty >= 0 && ty <= GH ? eh[ty * GW + tx] : 0; return tx >= 0 && tx <= GW && ty >= 0 && ty < GH ? ev[ty * (GW + 1) + tx] : 0; };
    read(); return g;
  }
  // The edges of a building (the game's B, or what Village.make returns): H and V keyed "x,y", each { t, locked, broken }.
  // A wall, a window and every piece of a yard shuts its edge; a door and a gate are open; a locked door that is not broken
  // is shut to all but its own people.
  function edgeOf(B, yardOpen) {
    return function (kind, tx, ty) { var e = (kind === 'H' ? B.H : B.V)[tx + ',' + ty]; if (!e) return 0; if (e.breach) return 3; if (e.t === 'gate') return e.locked && !e.broken ? 2 : 3; if (e.t === 'door') return e.locked && !e.broken ? 2 : 3; return yardOpen && yardOpen[e.t] ? 0 : 1; };
  }
  // The engine's three questions (Combat.api.nav, .blocked, .wall) answered from the grids a page keeps. at(x, y): the grid at
  // a place, or null; clock(): the time. A place's own people have its keys: a soldier of the place's side whose e.vi is the
  // grid's vi, and a villager (e.folk). A doorway or a gate takes two at a time: a man about to go through one that two others
  // are in already waits his turn a little way back (a gate with fifteen men pushing into it was a knot); e.choked is when he
  // was last told to. One of a place's own who steps through its locked door leaves it noted on the grid (g.opened) for
  // unlock() below.
  function attach(Combat, at, clock) {
    function keysOf(e, g) { return !!e && (e.folk === true || (e.type === 'soldier' && e.side !== 1 && e.vi === g.vi)); }
    function inIt(o, q) { return Math.hypot(o.x - q.x, o.y - q.y) < 17 || Math.hypot(o.x - q.bx, o.y - q.by) < 17; }
    function chokeFull(g, e, q) {
      var n = 0, D = Combat.dbg(), E = D.W.enemies, i, o, P = D.P;
      if (Math.hypot(e.x - q.x, e.y - q.y) < 14 || Math.hypot(e.x - q.bx, e.y - q.by) < 14) return false;                   // he is in it himself
      // Who fills it: his own side, on their way through. Not a foe (a foe in a gate is somebody to fight there, not somebody to
      // wait for) and not a man who is himself waiting. (2026-10-13: with everybody counted, the town's men inside a gate and the
      // raiders outside it each waited for the others to clear it, in reach of one another, for minutes: the town test's long
      // waits "at a gate or door".)
      var side = e.side || 0, now = clock();
      for (i = 0; i < E.length; i++) { o = E[i]; if (o === e || o.dead || o.down || o.out || !o.human) continue; if ((o.side || 0) !== side) continue; if (o.choked != null && now - o.choked < 0.25) continue; if (inIt(o, q)) n++; }   // (a man on his knees in a doorway does not fill it)
      if (e !== P && side === 1 && !P.dead && !P.hidden && inIt(P, q)) n++;
      return n >= 2;
    }
    Combat.api.nav = function (e, x, y) {
      var g = at(e.x, e.y) || at(x, y); if (!g) return null; var keys = keysOf(e, g), wp = g.next(e, x, y, clock(), keys);
      if (wp && wp.wait) return wp;
      var q = g.narrowAhead(e.x, e.y, wp ? wp.x : x, wp ? wp.y : y, 64);                                                    // a door or a gate on his way
      if (q) {
        if (q.v === 2 && keys && Math.hypot(e.x - q.x, e.y - q.y) < 30) (g.opened = g.opened || []).push({ kind: q.kind, tx: q.tx, ty: q.ty });   // his own locked door, and he is at it: he opens it (unlock() below)
        if (chokeFull(g, e, q)) { e.choked = clock(); return { x: e.x, y: e.y, wait: true }; }
        e.choked = null;                                                                                                   // let through: from now he is one of those in it
      }
      return wp;
    };
    Combat.api.blocked = function (ox, oy, nx, ny, e) {
      var g = at(nx, ny) || at(ox, oy); if (!g) return false; var keys = keysOf(e, g);
      if (keys) { var L = g.lockAt(ox, oy, nx, ny); if (L) (g.opened = g.opened || []).push(L); }
      return g.blocked(ox, oy, nx, ny, keys);
    };
    Combat.api.wall = function (x0, y0, x1, y1) { var g = at(x0, y0) || at(x1, y1); return g ? g.blocked(x0, y0, x1, y1, false) : false; };
    Combat.api.walled = function (x, y) { return !!at(x, y); };   // are the walls at this place known to a grid (then a wall's own circles are not needed to stop a mover there, and must not push him: see moveCircle)
    return { keysOf: keysOf, chokeFull: chokeFull };
  }
  // The locked doors a place's own men went through since the last call: unlocked in the building data B (they stay open
  // behind them: wait for the hall's men to come out and the hall is open), fn(edge) for each. True when any was opened: the
  // grids must then be read again.
  function unlock(g, B, fn) {
    var L = g.opened, any = false, i, d; if (!L || !L.length) return false;
    for (i = 0; i < L.length; i++) { d = (L[i].kind === 'H' ? B.H : B.V)[L[i].tx + ',' + L[i].ty]; if (d && d.locked) { d.locked = 0; any = true; if (fn) fn(L[i]); } }
    L.length = 0; return any;
  }
  return { make: make, edgeOf: edgeOf, attach: attach, unlock: unlock };
})();
if (typeof module !== 'undefined') module.exports = Nav;
