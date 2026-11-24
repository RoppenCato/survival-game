/* The living sea (the Art Director's recipe, out/sea, 2026-10-21; Robin: "ambiance creatures, whales swimming by, gulls
   circling, some fish, not too much; wind effects and motion in the water; the water more beautiful and living"). Two parts:
   the WATER, drawn over the painted sea in the world's frame (soft swell bands, cat's-paws with ruffle, whitecaps, the sun's
   glitter in a band on the upper-left side, cloud shadows, a shoal's shimmer), every patch kept at a world point that drifts
   downwind and dies, and never laid over land; and the LIFE (the studio's pieces: gulls circling on a ring, a minke surfacing
   and sounding far out, fish leaping from a shoal, a seal's head by the shore), drawn by the page where its depth falls. The
   wind is { a, s }: a direction and a strength 0 to 1; everything scales with s, so a calm day shows the swell and the glitter
   only. No browser globals: the page passes what it has (the water and land tests, the camera, the ship, the night). */
var Sea = (function () {
  var K = 0.75, UPM = 1 / 0.046, DIRS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'];
  var CFG = { paws: 14, ruffle: 18, caps: 18, glints: 700, clouds: 2, shoalN: 90, gulls: [2, 5], gullOut: 230, gullR: [110, 230], whaleEvery: [150, 360], fishEvery: [5, 15], sealEvery: [70, 160], sun: [-0.6, -0.8],
    deepFirst: [60, 200], deepEvery: [150, 420], deep: { fish: { w: 46, L: 64, W: 17, v: 58, a: 0.3, clear: 70, miss: [16, 110] }, whale: { w: 30, L: 250, W: 64, v: 36, a: 0.34, clear: 170, miss: [10, 120] }, great: { w: 16, L: 580, W: 136, v: 27, a: 0.4, clear: 260, miss: [0, 70] }, serpent: { w: 8, L: 2500, W: 88, v: 62, a: 0.5, clear: 320, miss: [0, 24] } } };   /* the deep (Robin, 2026-11-24: "huge sea creature shadow swimming past the boat at rare times, also under ice. It should be different sizes. One should be really huge, causing fright and terror on the player"): w the share of the passes, L and W the body in units (a unit is 4.6 cm: 3 m, 11 m, 27 m, 115 m), v its pace, a its darkness, clear the open water it needs round the boat, miss how far to the side it passes. The numbers mine */
  function rnd() { return Math.random(); }
  function hs(i, j) { var v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); }
  function make() { return { t: 0, paws: [], caps: [], glints: [], clouds: [], swells: [], shoals: [], fish: [], gulls: [], whale: null, seal: null, deep: null, nextDeep: CFG.deepFirst[0] + rnd() * (CFG.deepFirst[1] - CFG.deepFirst[0]), nextWhale: 40 + rnd() * 120, nextSeal: 30 + rnd() * 90, nextFish: 6, chk: 0, on: false, keep: [] }; }
  function clear(x, y, env, r) {           // water here and all round within r (a patch never lies over land)
    if (!env.water(x, y)) return false; if (!r) return true;
    for (var a = 0; a < 6.283; a += 1.571) if (!env.water(x + Math.cos(a) * r, y + Math.sin(a) * r)) return false; return true;
  }
  function spot(env, r, tries) {           // a clear water point in view
    for (var i = 0; i < (tries || 8); i++) { var x = env.x + (rnd() - 0.5) * 2 * env.hw * 1.2, y = env.y + (rnd() - 0.5) * 2 * env.hh * 1.2; if (clear(x, y, env, r)) return { x: x, y: y }; } return null;
  }
  function inView(p, env, m) { return Math.abs(p.x - env.x) < env.hw + (m || 60) && Math.abs(p.y - env.y) < env.hh + (m || 60); }
  function tick(S, dt, env) {
    S.t += dt; var w = env.wind, s = w.s, dx = Math.cos(w.a) * dt, dy = Math.sin(w.a) * dt, i, p;
    if ((S.chk -= dt) <= 0) { S.chk = 0.5; var n = 0; for (i = 0; i < 9; i++) if (env.water(env.x + ((i % 3) - 1) * env.hw * 0.9, env.y + (Math.floor(i / 3) - 1) * env.hh * 0.9)) n++; S.on = n > 0; }   // the sea in view at all
    if (!S.on) { S.paws.length = S.caps.length = S.glints.length = S.clouds.length = S.swells.length = 0; return; }
    function keep(list, want, mk, life, speed) {
      for (i = list.length - 1; i >= 0; i--) { p = list[i]; p.t += dt; p.x += dx * speed; p.y += dy * speed; if (p.t > p.life || !inView(p, env, 140) || !clear(p.x, p.y, env, p.r)) list.splice(i, 1); }
      var tries = 0; while (list.length < want && tries++ < 6) { var q = spot(env, 0, 4); if (!q) break; var o = mk(q); o.t = rnd() * o.life * 0.5; if (clear(o.x, o.y, env, o.r)) list.push(o); }
    }
    keep(S.swells, 6, function (q) { return { x: q.x, y: q.y, L: 160 + rnd() * 220, W: 40 + rnd() * 50, r: 60, life: 12 + rnd() * 8, light: rnd() < 0.5 }; }, 0, 4);
    keep(S.clouds, CFG.clouds, function (q) { return { x: q.x, y: q.y, R: 60 + rnd() * 75, r: 50, life: 25 + rnd() * 20 }; }, 0, 9);
    keep(S.paws, Math.round(CFG.paws * s), function (q) { return { x: q.x, y: q.y, L: 40 + rnd() * 90, W: 9 + rnd() * 14, a: 0.3 + rnd() * 0.2, r: 30, life: 6 + rnd() * 6, seed: rnd() * 99 }; }, 0, 14);
    keep(S.caps, Math.round(CFG.caps * s * s * (env.z < 0.6 ? 1.6 : 1)), function (q) { return { x: q.x, y: q.y, L: 3.5 + rnd() * 6, a: 0.55 + rnd() * 0.35, r: 6, life: 1.6 + rnd() * 0.8, tilt: (rnd() - 0.5) * 0.5 }; }, 0, 10);
    var gn = env.night > 0.3 ? 0 : Math.round(CFG.glints * Math.max(0.4, env.z));
    for (i = S.glints.length - 1; i >= 0; i--) { p = S.glints[i]; p.t += dt; if (p.t > p.life || !inView(p, env, 10)) S.glints.splice(i, 1); }
    for (i = 0; i < 40 && S.glints.length < gn; i++) { var gx = env.x + (rnd() - 0.5) * 2 * env.hw, gy = env.y + (rnd() - 0.5) * 2 * env.hh, band = Math.exp(-Math.pow(((gx - env.x + env.hw * 0.3) * CFG.sun[0] + (gy - env.y + env.hh * 0.2) * K * CFG.sun[1]) / (env.hw * 0.6), 2)); if (rnd() > band || !env.water(gx, gy)) continue; S.glints.push({ x: gx, y: gy, L: 0.7 + rnd() * 1.6, a: (0.25 + rnd() * 0.5) * (0.5 + 0.5 * band), t: 0, life: 0.6 + rnd() * 0.9 }); }
    // the shoals: one or two drifting patches near the camera, fish leaping from them now and then
    for (i = S.shoals.length - 1; i >= 0; i--) { p = S.shoals[i]; p.t += dt; p.x += Math.cos(p.h) * 4 * dt; p.y += Math.sin(p.h) * 4 * dt; if (p.t > p.life || !clear(p.x, p.y, env, 60) || Math.hypot(p.x - env.x, p.y - env.y) > 900) S.shoals.splice(i, 1); }
    if (S.shoals.length < 1 && rnd() < dt * 0.1) { var sq = spot(env, 70, 6); if (sq) S.shoals.push({ x: sq.x, y: sq.y, h: rnd() * 6.283, t: 0, life: 60 + rnd() * 60, seed: Math.floor(rnd() * 999), flash: 0 }); }
    for (i = S.fish.length - 1; i >= 0; i--) { p = S.fish[i]; p.t += dt; if (p.t > 0.5) S.fish.splice(i, 1); }
    if ((S.nextFish -= dt) <= 0 && S.shoals.length) { S.nextFish = CFG.fishEvery[0] + rnd() * (CFG.fishEvery[1] - CFG.fishEvery[0]); var sh = S.shoals[Math.floor(rnd() * S.shoals.length)]; S.fish.push({ x: sh.x + (rnd() - 0.5) * 80, y: sh.y + (rnd() - 0.5) * 40, t: 0, flip: rnd() < 0.5 }); }
    // the whale: far out, along x, surfacing three or four times twenty seconds apart, then the fluke and gone
    var wh = S.whale;
    if (wh) { wh.t += dt; wh.x += wh.dir * 33 * dt; var st = wh.state; wh.st += dt;
      if (st === 'under' && wh.st >= 20) { if (wh.n >= wh.rises) { wh.state = 'fluke1'; } else { wh.state = 'back1'; wh.n++; } wh.st = 0; }
      else if (st === 'back1' && wh.st >= 0.8) { wh.state = 'back2'; wh.st = 0; } else if (st === 'back2' && wh.st >= 1.5) { wh.state = 'back3'; wh.st = 0; } else if (st === 'back3' && wh.st >= 1.2) { wh.state = 'under'; wh.st = 0; }
      else if (st === 'fluke1' && wh.st >= 1) { wh.state = 'fluke2'; wh.st = 0; } else if (st === 'fluke2' && wh.st >= 2) { S.whale = null; }
      if (S.whale && !clear(wh.x, wh.y, env, 120)) S.whale = null; }
    else if ((S.nextWhale -= dt) <= 0) { S.nextWhale = CFG.whaleEvery[0] + rnd() * (CFG.whaleEvery[1] - CFG.whaleEvery[0]); var far = null; for (i = 0; i < 12 && !far; i++) { var a = rnd() * 6.283, d = 500 + rnd() * 600, fx = env.x + Math.cos(a) * d, fy = env.y + Math.sin(a) * d; if (clear(fx, fy, env, 180) && clear(fx + 400, fy, env, 120) && clear(fx - 400, fy, env, 120)) far = { x: fx, y: fy }; }
      if (far) S.whale = { x: far.x, y: far.y, dir: rnd() < 0.5 ? 1 : -1, state: 'back1', st: 0, t: 0, n: 1, rises: 3 + Math.floor(rnd() * 2) }; }
    // the seal: a head by the shore, looking, dipping, gone
    var se = S.seal;
    if (se) { se.t += dt; if (se.t > se.life || !inView(se, env, 300)) S.seal = null; }
    else if ((S.nextSeal -= dt) <= 0) { S.nextSeal = CFG.sealEvery[0] + rnd() * (CFG.sealEvery[1] - CFG.sealEvery[0]); for (i = 0; i < 10; i++) { var sa = rnd() * 6.283, sd = 120 + rnd() * 260, sx = env.x + Math.cos(sa) * sd, sy = env.y + Math.sin(sa) * sd; if (env.water(sx, sy) && !clear(sx, sy, env, 70)) { S.seal = { x: sx, y: sy, t: 0, life: 5 + rnd() * 6 }; break; } } }
    // the deep: a shadow that passes under the boat (or under the ice he stands on), by the clock of the time spent out there
    var dp = S.deep;
    if (dp) { dp.t += dt; dp.s += dp.v * dt; if (dp.s > dp.run) S.deep = null; }
    else if (env.over && (S.nextDeep -= dt) <= 0) { var tw = 0, kk, pk = null, rr; for (kk in CFG.deep) tw += CFG.deep[kk].w; rr = rnd() * tw; for (kk in CFG.deep) { if ((rr -= CFG.deep[kk].w) <= 0) { pk = kk; break; } } S.deep = deepMake(env, pk || 'fish'); S.nextDeep = S.deep ? CFG.deepEvery[0] + rnd() * (CFG.deepEvery[1] - CFG.deepEvery[0]) : 15; }
    // the gulls: a ring round the ship at sea, else round a point of the shore near the hero; none far out at night
    var want = (env.night > 0.5 && !env.shore) || dread(S) > 0.05 ? 0 : (env.ship || env.shore ? Math.round(CFG.gulls[0] + rnd() * 0.001 + (CFG.gulls[1] - CFG.gulls[0]) * (S.gullK || (S.gullK = rnd()))) : 0);
    var cx = env.ship ? env.ship.x : (env.shore ? env.shore.x : env.x), cy = env.ship ? env.ship.y : (env.shore ? env.shore.y : env.y);
    if (!env.ship && env.shore) { var gux = env.shore.x - env.x, guy = env.shore.y - env.y, gul = Math.hypot(gux, guy) || 1, gox = env.shore.x + gux / gul * CFG.gullOut, goy = env.shore.y + guy / gul * CFG.gullOut; if (env.water(gox, goy)) { cx = gox; cy = goy; } if (want > 2) want = 2 + (want > 3 ? 1 : 0); }   /* ashore, the ring lies out over the water and there are fewer (2026-10-22, Robin: "Sea gulls are a bit too attached, they start circeling my hero a lot") */
    for (i = S.gulls.length - 1; i >= 0; i--) { p = S.gulls[i]; p.a += p.spin * dt; p.cx += (cx - p.cx) * Math.min(1, dt * 0.4); p.cy += (cy - p.cy) * Math.min(1, dt * 0.4); p.x = p.cx + Math.cos(p.a) * p.R; p.y = p.cy + Math.sin(p.a) * p.R; p.h = p.a + (p.spin > 0 ? Math.PI / 2 : -Math.PI / 2);
      p.ft += dt; if (p.glide > 0) { p.glide -= dt; p.f = 4; } else { p.f = Math.floor(p.ft * 6) % 4; if (rnd() < dt * 0.25) p.glide = 1 + rnd() * 1.5; }
      p.life -= dt; if (p.life < 0 || (want === 0 && rnd() < dt)) S.gulls.splice(i, 1); }
    if (S.gulls.length < want && rnd() < dt * 0.5) S.gulls.push({ cx: cx, cy: cy, a: rnd() * 6.283, R: env.ship ? 60 + rnd() * 90 : CFG.gullR[0] + rnd() * (CFG.gullR[1] - CFG.gullR[0]), spin: (rnd() < 0.5 ? 1 : -1) * (0.35 + rnd() * 0.35), hgt: 18 + rnd() * 30, f: 0, ft: rnd() * 3, glide: 0, life: 40 + rnd() * 60, x: cx, y: cy, h: 0 });
    if ((S.gullT = (S.gullT || 0) + dt) > 30) { S.gullT = 0; S.gullK = rnd(); }
  }
  function deepMake(env, kind, force) {    // a pass laid through the water under the boat: from out of sight ahead to out of sight astern
    var D = CFG.deep[kind], o = env.over || { x: env.x, y: env.y }; if (!D) return null; if (!force && !clear(o.x, o.y, env, D.clear)) return null;
    var h = rnd() * 6.283, far = Math.hypot(env.hw, env.hh) * 1.15 + 90, miss = (D.miss[0] + rnd() * (D.miss[1] - D.miss[0])) * (rnd() < 0.5 ? -1 : 1), k = 0.85 + rnd() * 0.3;
    return { kind: kind, h: h, x0: o.x - Math.cos(h) * far - Math.sin(h) * miss, y0: o.y - Math.sin(h) * far + Math.cos(h) * miss, s: 0, t: 0, v: D.v * (0.9 + rnd() * 0.2), L: D.L * k, W: D.W * k, a: D.a, run: far * 2 + D.L * k + 60, seed: Math.floor(rnd() * 999), ox: o.x, oy: o.y };
  }
  function deepCall(S, env, kind) { S.deep = deepMake(env, kind, true); return S.deep; }   /* Admin's and the tests' way to see one */
  function dread(S) { var dp = S.deep; if (!dp || dp.kind !== 'serpent') return 0; var k = dp.s / dp.run; return Math.max(0, Math.min(1, k * 5, (1 - k) * 5)); }   /* 0 to 1 while the great one is under you: the page's cue (the gulls go, the music sinks, the camera draws back) */
  function deepHalf(kind, u) {            // half the body's breadth at u (0 the snout, 1 the tail's end), as a share of W / 2
    if (kind === 'serpent') return u < 0.012 ? Math.sqrt(u / 0.012) * 1.3 : u < 0.035 ? 1.3 - (u - 0.012) / 0.023 * 0.55 : u < 0.1 ? 0.75 + (u - 0.035) / 0.065 * 0.25 : u < 0.7 ? 1 : Math.max(0, 1 - (u - 0.7) / 0.3);
    var body = u < 0.1 ? Math.sqrt(u / 0.1) * 0.78 : u < 0.3 ? 0.78 + (u - 0.1) / 0.2 * 0.22 : u < 0.88 ? 1 - (u - 0.3) / 0.58 * 0.9 : 0.1;
    if (u > 0.9) body = kind === 'fish' ? 0.1 + (u - 0.9) / 0.1 * 0.32 : u < 0.97 ? 0.1 + (u - 0.9) / 0.07 * 0.5 : 0.6 - (u - 0.97) / 0.03 * 0.22;   /* the tail: a fish's fin, a whale's flukes */
    return body;
  }
  function drawDeep(c, S, env, aK) {       // the shadow, in the world's frame (x, y * K): one flat dark shape and a darker core, no blur
    var dp = S.deep; if (!dp) return; var n = dp.kind === 'serpent' ? 180 : dp.kind === 'fish' ? 20 : 40, ch = Math.cos(dp.h), sh = Math.sin(dp.h), hx = dp.x0 + ch * dp.s, hy = dp.y0 + sh * dp.s, i, u, P = [], amp, ph;
    for (i = 0; i <= n; i++) { u = Math.pow(i / n, dp.kind === 'serpent' ? 1.35 : 1.6); var d = u * dp.L, off = 0;   /* (more points at the snout, where the outline turns fastest) */ if (dp.kind === 'serpent') { amp = 62 * Math.min(1, u * 9); off = amp * Math.sin(d / 96 - dp.t * 0.85); } else if (dp.kind === 'fish') off = dp.L * 0.07 * u * Math.sin(u * 5 - dp.t * 6); else off = dp.L * 0.012 * Math.sin(dp.s / 130 + u * 2);
      P.push({ x: hx - ch * d - sh * off, y: hy - sh * d + ch * off, w: deepHalf(dp.kind, u) * dp.W / 2 }); }
    var seen = false; for (i = 0; i <= n; i += 3) if (inView(P[i], env, dp.W + 40)) { seen = true; break; } if (!seen) return;
    var fade = Math.min(1, dp.s / 160, (dp.run - dp.s) / 160), A = dp.a * (aK == null ? 1 : aK) * Math.max(0, fade) * (1 - 0.35 * (env.night || 0));
    function shape(k) { var j, q, a, b, tx, ty, tl; c.beginPath(); for (j = 0; j <= n; j++) { q = P[j]; a = P[Math.max(0, j - 1)]; b = P[Math.min(n, j + 1)]; tx = b.x - a.x; ty = b.y - a.y; tl = Math.hypot(tx, ty) || 1; q.nx = -ty / tl; q.ny = tx / tl; if (j === 0) c.moveTo(q.x + q.nx * q.w * k, (q.y + q.ny * q.w * k) * K); else c.lineTo(q.x + q.nx * q.w * k, (q.y + q.ny * q.w * k) * K); } for (j = n; j >= 0; j--) { q = P[j]; c.lineTo(q.x - q.nx * q.w * k, (q.y - q.ny * q.w * k) * K); } c.closePath();
      if (k === 1 && (dp.kind === 'whale' || dp.kind === 'great')) { var fi = Math.round(n * 0.44), f = P[fi], g2 = P[fi + Math.round(n * 0.17)], fl = dp.W * (dp.kind === 'great' ? 0.85 : 0.62), sd; for (sd = -1; sd <= 1; sd += 2) { c.moveTo(f.x + f.nx * f.w * 0.7 * sd, (f.y + f.ny * f.w * 0.7 * sd) * K); c.lineTo(g2.x + g2.nx * (g2.w + fl) * sd, (g2.y + g2.ny * (g2.w + fl) * sd) * K); c.lineTo(g2.x + g2.nx * g2.w * 0.6 * sd, (g2.y + g2.ny * g2.w * 0.6 * sd) * K); c.closePath(); } } }   /* (the flippers, in the same fill so nothing doubles) */
    c.save(); c.fillStyle = 'rgb(6,18,38)'; c.globalAlpha = A * 0.62; shape(1); c.fill(); c.globalAlpha = A * 0.5; shape(0.55); c.fill();
    if (dp.kind === 'serpent' || dp.kind === 'great') { c.fillStyle = 'rgb(226,240,244)'; var nb = dp.kind === 'serpent' ? 26 : 8; for (i = 0; i < nb; i++) { var slot = Math.floor(dp.t * 1.6 + i * 0.37), hv = hs(dp.seed + i, slot); if (hv > 0.55) continue; var q2 = P[Math.floor(hs(dp.seed + i * 3, slot + 5) * n)], bt = (dp.t * 1.6 + i * 0.37) % 1; if (!inView(q2, env, 20)) continue; c.globalAlpha = 0.5 * (1 - bt) * fade * (aK == null ? 1 : aK); c.beginPath(); c.arc(q2.x + (hs(i, slot) - 0.5) * q2.w * 1.6, (q2.y + (hs(i + 9, slot) - 0.5) * q2.w * 1.6) * K, 0.5 + bt * 1.6, 0, 6.283); c.fill(); } }   /* air rising off its back */
    c.restore();
  }
  function lin(c, x0, y0, x1, y1) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  function drawWater(c, S, env) {         // in the world's frame (x, y * K); the swell, the clouds, the cat's-paws and their ruffle, the whitecaps, the glitter, the shoals
    if (!S.on) return; var w = env.wind, i, j, p, g;
    if (!env.iced) drawDeep(c, S, env);   /* under everything else on the water; under ice the page draws it over the sheet */
    c.save(); c.lineCap = 'round';
    S.swells.forEach(function (q) { g = c.createRadialGradient(0, 0, 0, 0, 0, 1); var col = q.light ? '255,255,255' : '0,10,40', a = (q.light ? 0.09 : 0.07) * Math.sin(Math.PI * Math.min(1, q.t / q.life)); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); c.save(); c.translate(q.x, q.y * K); c.rotate(w.a + 0.9); c.scale(q.L, q.W * K); c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore(); });
    S.clouds.forEach(function (q) { g = c.createRadialGradient(0, 0, 0, 0, 0, 1); var a = 0.22 * Math.sin(Math.PI * Math.min(1, q.t / q.life)); g.addColorStop(0, 'rgba(60,80,120,' + a + ')'); g.addColorStop(0.6, 'rgba(60,80,120,' + a * 0.55 + ')'); g.addColorStop(1, 'rgba(60,80,120,0)'); c.save(); c.translate(q.x, q.y * K); c.rotate(w.a); c.scale(q.R * 1.5, q.R * 0.55); c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore(); });
    S.paws.forEach(function (q) { var a = q.a * Math.sin(Math.PI * Math.min(1, q.t / q.life)) * (0.5 + w.s); g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, 'rgba(30,70,120,' + a + ')'); g.addColorStop(0.7, 'rgba(30,70,120,' + a * 0.3 + ')'); g.addColorStop(1, 'rgba(30,70,120,0)'); c.save(); c.translate(q.x, q.y * K); c.rotate(w.a); c.scale(q.L, q.W * K); c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
      c.save(); c.translate(q.x, q.y * K); c.strokeStyle = 'rgba(20,50,95,' + (0.3 * a / 0.4).toFixed(3) + ')'; c.lineWidth = 0.5; for (j = 0; j < CFG.ruffle; j++) { var u = hs(q.seed, j) - 0.5, v = hs(q.seed + 1, j) - 0.5, L = 2 + hs(q.seed + 2, j) * 3, rx = u * 2 * q.L * 0.8, ry = v * 2 * q.W * 0.8; c.save(); c.translate(Math.cos(w.a) * rx - Math.sin(w.a) * ry, (Math.sin(w.a) * rx + Math.cos(w.a) * ry) * K); c.rotate(w.a + Math.PI / 2 + (hs(q.seed + 3, j) - 0.5) * 0.4); c.beginPath(); c.moveTo(-L / 2, 0); c.quadraticCurveTo(0, -L * 0.25, L / 2, 0); c.stroke(); c.restore(); } c.restore(); });
    S.caps.forEach(function (q) { var k = Math.min(1, q.t / q.life), a = q.a * Math.sin(Math.PI * k); c.save(); c.translate(q.x, q.y * K); c.rotate(w.a + Math.PI / 2 + q.tilt); c.strokeStyle = 'rgba(240,248,250,' + a.toFixed(3) + ')'; c.lineWidth = 0.75; c.beginPath(); c.moveTo(-q.L / 2, 0); c.quadraticCurveTo(0, -q.L * 0.3, q.L / 2, 0); c.stroke();
      c.rotate(-Math.PI / 2); g = c.createLinearGradient(0, 0, q.L * 1.6, 0); g.addColorStop(0, 'rgba(240,248,250,' + (a * 0.5).toFixed(3) + ')'); g.addColorStop(1, 'rgba(240,248,250,0)'); c.strokeStyle = g; c.lineWidth = Math.max(0.5, q.L * 0.35); lin(c, 0, 0, q.L * 1.6 * (0.4 + k * 0.6), 0); c.restore(); });
    c.globalCompositeOperation = 'lighter'; c.lineWidth = 0.4;
    S.glints.forEach(function (q) { var a = q.a * Math.sin(Math.PI * Math.min(1, q.t / q.life)); c.strokeStyle = 'rgba(255,250,225,' + a.toFixed(3) + ')'; lin(c, q.x - q.L / 2, q.y * K, q.x + q.L / 2, q.y * K); });
    S.shoals.forEach(function (q) { var fade = Math.min(1, q.t / 4, (q.life - q.t) / 4); c.save(); c.translate(q.x, q.y * K); c.rotate(w.a + 0.4); c.lineWidth = 0.45;
      for (j = 0; j < CFG.shoalN; j++) { var u = hs(q.seed, j) * 2 - 1, v = hs(q.seed + 7, j) * 2 - 1; if (u * u + v * v > 1) continue; var px = u * 50 + Math.sin(S.t * 1.3 + j) * 1.5, py = v * 23 * K, L = 1 + hs(q.seed + 3, j) * 1.4; c.strokeStyle = 'rgba(190,225,215,' + ((0.12 + hs(q.seed + 5, j) * 0.2) * fade).toFixed(3) + ')'; lin(c, px - L / 2, py, px + L / 2, py - L * 0.2); }
      for (j = 0; j < 5; j++) { if (hs(q.seed + 11, j + Math.floor(S.t * 2)) > 0.3) continue; c.fillStyle = 'rgba(240,250,245,' + (0.7 * fade).toFixed(2) + ')'; c.beginPath(); c.ellipse((hs(q.seed + 13, j) - 0.5) * 73, (hs(q.seed + 17, j) - 0.5) * 33 * K, 0.8, 0.4, 0.3, 0, 7); c.fill(); } c.restore(); });
    c.restore();
  }
  function piece(c, IM, name, x, y, o) {   // a piece with its origin at the world point x, y (drawn at x, y * K), scaled from 65 px a metre to units
    var P = IM && IM[name]; if (!P || !P.img || !(P.img.complete === undefined ? P.img.width : (P.img.complete && P.img.naturalWidth))) return false; o = o || {};
    var s = UPM / (P.ppm || 65), X = x - P.origin[0] * s, Y = y * K - P.origin[1] * s, iw = P.img.naturalWidth || P.img.width, ih = P.img.naturalHeight || P.img.height;
    if (o.shadow) { var g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, 'rgba(8,24,50,0.35)'); g.addColorStop(1, 'rgba(8,24,50,0)'); c.save(); c.translate(x, y * K); c.scale(o.shadow * UPM, o.shadow * UPM * 0.5); c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore(); }
    if (o.flip) { c.save(); c.translate(x, 0); c.scale(-1, 1); c.drawImage(P.img, -(x - X), Y, iw * s, ih * s); c.restore(); } else c.drawImage(P.img, X, Y, iw * s, ih * s);
    if (P.water && P.water.length && o.foam !== false) { c.save(); c.globalCompositeOperation = 'lighter'; P.water.forEach(function (q, i) { var fx = o.flip ? 2 * x - (X + q[0] * s) : X + q[0] * s, fy = Y + q[1] * s, r = (3 + hs(i, 3) * 3) * s * 3; var g2 = c.createRadialGradient(fx, fy, 0, fx, fy, r); g2.addColorStop(0, 'rgba(238,246,246,0.22)'); g2.addColorStop(1, 'rgba(238,246,246,0)'); c.fillStyle = g2; c.fillRect(fx - r, fy - r, 2 * r, 2 * r); }); c.restore(); }
    if (o.rings) { c.save(); c.strokeStyle = 'rgba(236,246,246,0.45)'; c.lineWidth = 0.5; for (var k = 1; k <= o.rings; k++) { c.beginPath(); c.ellipse(x, y * K, o.ringR * k, o.ringR * k * 0.5, 0, 0, 7); c.stroke(); } c.restore(); }
    return true;
  }
  function spout(c, x, y, wa, a) {         // the whale's blow: a soft pale plume leaning downwind, with drops
    c.save(); c.translate(x, y * K); c.rotate(wa * 0.5 - Math.PI / 2 + 0.25); var g = c.createLinearGradient(0, 0, 30, 0); g.addColorStop(0, 'rgba(236,246,246,' + a + ')'); g.addColorStop(0.5, 'rgba(236,246,246,' + a * 0.55 + ')'); g.addColorStop(1, 'rgba(236,246,246,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, -1); c.quadraticCurveTo(15, -9, 30, -7); c.lineTo(30, 7); c.quadraticCurveTo(15, 7, 0, 1); c.closePath(); c.fill();
    c.fillStyle = 'rgba(236,246,246,' + a * 0.8 + ')'; for (var i = 0; i < 7; i++) { c.beginPath(); c.arc(10 + hs(i, 1) * 20, (hs(i, 2) - 0.5) * 17, 0.3 + hs(i, 3) * 0.7, 0, 7); c.fill(); } c.restore();
  }
  function lifeItems(S, env, IM) {         // what swims, as items for the page's depth sort: { y, f }
    var out = [], w = env.wind;
    if (S.whale && S.whale.state !== 'under') { var wh = S.whale; out.push({ y: wh.y, f: function (c) { piece(c, IM, 'whale_' + wh.state, wh.x, wh.y, { shadow: 6, flip: wh.dir < 0 }); if (wh.state === 'back1' || wh.state === 'back2') spout(c, wh.x + wh.dir * 20, wh.y - 36 / K, w.a, wh.state === 'back1' ? 0.8 : 0.5); } }); }
    if (S.seal) { var se = S.seal; out.push({ y: se.y, f: function (c) { piece(c, IM, 'seal_' + (Math.floor(se.t * 0.7) % 2), se.x, se.y, { rings: 2, ringR: 11 }); } }); }
    S.fish.forEach(function (f) { out.push({ y: f.y, f: function (c) { var fr = Math.min(2, Math.floor(f.t / 0.17)); piece(c, IM, 'fish_' + fr, f.x, f.y - (fr === 1 ? 6 : 0), { flip: f.flip, rings: fr === 2 ? 1 : 0, ringR: 9 }); } }); });
    S.gulls.forEach(function (g) { out.push({ y: g.y - 1, f: function (c) { c.save(); c.globalAlpha = 0.14; c.fillStyle = '#102040'; c.beginPath(); c.ellipse(g.x + 2, g.y * K + 3, 3, 1, 0, 0, 7); c.fill(); c.restore(); } }); });   // the gulls' shadows on the water
    return out;
  }
  function drawGulls(c, S, env, IM) {      // after everything on the ground: the gulls in the air
    S.gulls.forEach(function (g) { var d = DIRS[((Math.round(((g.h + Math.PI / 2) / (Math.PI * 2)) * 8) % 8) + 8) % 8]; piece(c, IM, 'gull_' + d + '_' + g.f, g.x, g.y - g.hgt / K, { foam: false }); });
  }
  function pennant(c, x, y, wa, s) {       // a streamer from the masthead, the ship's red, blown out with the wind and rippling
    var L = 15 * (0.5 + s), t; c.save(); c.translate(x, y); c.rotate(wa); c.fillStyle = '#8a4a3a'; c.strokeStyle = '#231a16'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(0, 0);
    for (t = 0; t <= 1.001; t += 0.1) c.lineTo(t * L, Math.sin(t * 7 - (c.__t || 0)) * 0.7 * t - 0.7 * (1 - t * 0.6)); c.lineTo(L, 0); for (t = 1; t >= -0.001; t -= 0.1) c.lineTo(t * L, Math.sin(t * 7 - (c.__t || 0)) * 0.7 * t + 0.7 * (1 - t * 0.6)); c.closePath(); c.fill(); c.stroke(); c.restore();
  }
  function bowSpray(c, x, y, h, k, t) {    // spray at the bow when the ship has way on and the wind is up
    c.save(); c.translate(x, y); c.rotate(h); c.fillStyle = 'rgba(240,248,250,0.8)'; var n = Math.round(14 * k), i;
    for (i = 0; i < n; i++) { var d = hs(i, Math.floor(t * 9)) * 8, s = (hs(i + 1, Math.floor(t * 9)) - 0.5) * 2; c.globalAlpha = 0.3 + hs(i + 2, Math.floor(t * 9)) * 0.5; c.beginPath(); c.arc(d, s * (2 + d * 0.5) * K, 0.3 + hs(i + 3, Math.floor(t * 9)) * 0.5, 0, 7); c.fill(); } c.restore();
  }
  return { CFG: CFG, make: make, tick: tick, drawWater: drawWater, lifeItems: lifeItems, drawGulls: drawGulls, piece: piece, pennant: pennant, bowSpray: bowSpray, spout: spout, drawDeep: drawDeep, deepCall: deepCall, dread: dread };
})();
if (typeof module !== 'undefined') module.exports = Sea;
