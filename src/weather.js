// weather.js: a proposal for the weather of home's meadow (Colin, AD, 2026-10-23; docs/seasons.md step 5; Robin: "Yes"): spring
// showers; autumn rain, storms and morning mist; winter snowfall. The look and the numbers as code, as out/sea's recipe was; the
// game's own code draws the weather (Clive, GD's), this is its reference. Works in the browser and in Node.
//
// The weather changes nothing in the world: it is paint over the frame, after the world and the season's light, before the HUD and
// under the night palette. It never makes the day gloomy (the direction: by day lush and bright): the darkest storm keeps the light
// at about 89 per cent. Rain is pale silver streaks, never dark ones. A spell asks the wind for a strength and the sea follows by itself.
//
//   Weather.KINDS                   every kind's numbers, one row each (counts are for a 1920 x 1080 screen; scale by area)
//   Weather.day(season, n, seed)    the day's weather: [{ kind, at, len }], at in seconds of the game's day (day.t, 0..1800)
//   Weather.make(kind, seed)        a running spell; S.k is its strength 0..1, eased toward S.target by the kind's ramp
//   Weather.tick(S, dt, env)        env = { W, H, cam: {x, y}, zoom, wind: {a, s}, night: 0..1,
//                                           toScreen(x, y) -> [sx, sy], fromScreen(sx, sy) -> [x, y] (world points, for the mist),
//                                           low(x, y) -> 0..1 (1 on water and the shore), water(sx, sy) -> bool (screen points), mk(w, h) -> canvas }
//   Weather.draw(ctx, S, env)       the spell over the frame
//   Weather.wind(kind)              [min, max] of wind.s the spell asks for
//   Weather.ground.make/tick/step/breath/draw   what the weather leaves on the ground and what a walker leaves in it (below)
//   Weather.wetPicture(d, w, h)     a standing thing's picture graded wet: darker, richer, the sky along its upper edge, glints
(function (root) {
  var KINDS = {
    //            rain: streaks on screen (n, length px, width, alpha range, speed px/s, slant at full wind in rad)
    shower:    { rain: { n: 280, len: [16, 28], w: 1.1, a: [0.36, 0.56], v: 950, slant: 0.35 }, splash: 18, rings: 6,
                 veil: { mul: [198, 208, 224, 0.10], sat: 0.06 }, wind: [0.2, 0.45], ramp: [12, 18] },
    rain:      { rain: { n: 520, len: [20, 32], w: 1.1, a: [0.28, 0.48], v: 1100, slant: 0.5 }, splash: 55, rings: 20, leaves: 10,
                 veil: { mul: [174, 188, 210, 0.22], sat: 0.16 }, wind: [0.45, 0.7], ramp: [20, 30] },
    storm:     { rain: { n: 900, len: [30, 50], w: 1.3, a: [0.3, 0.52], v: 1400, slant: 0.85 }, splash: 110, rings: 40, leaves: 36,
                 veil: { mul: [148, 160, 186, 0.30], sat: 0.24 }, flash: [18, 45], wind: [0.85, 1.0], ramp: [25, 35] },
    //            mist: soft banks lying on the world (n, width px, alpha), thickest on water and the shore, burning off by mid-morning
    mist:      { mist: { n: 12, r: [320, 720], a: [0.42, 0.64], col: [240, 237, 230] }, veil: { haze: [236, 236, 236, 0.1, 0.03] }, wind: [0.03, 0.12], ramp: [40, 90] },
    //            snow: flakes in three depths (far, middle, near): share of n, radius px, alpha, fall px/s
    snow:      { snow: { n: 520 }, veil: { haze: [230, 235, 242, 0.08, 0.03] }, wind: [0.1, 0.35], ramp: [20, 30] },
    heavySnow: { snow: { n: 1150 }, veil: { haze: [228, 233, 241, 0.2, 0.08], mul: [204, 212, 226, 0.1] }, wind: [0.25, 0.5], ramp: [25, 30] },
    blizzard:  { snow: { n: 1700, streak: 1 }, veil: { haze: [226, 231, 239, 0.44, 0.24], mul: [190, 200, 218, 0.16] }, wind: [0.85, 1.0], ramp: [20, 30] },
    overcast:  { veil: { mul: [192, 200, 216, 0.14], sat: 0.12 }, wind: [0.3, 0.6], ramp: [40, 60] }
  };
  var LAYERS = [{ f: 0.5, r: [0.9, 1.3], a: 0.55, v: [24, 34], par: 0.55 }, { f: 0.32, r: [1.6, 2.2], a: 0.8, v: [44, 60], par: 0.8 }, { f: 0.18, r: [2.8, 3.8], a: 0.9, v: [72, 96], par: 1.0 }];
  var LEAF = ['#c4622c', '#d49a3c', '#94502c'], FLAKE = '#f4f7fb', STREAK = '226,236,246', RING = '226,238,246';
  // the year: the share of days each weather has, per season (the day's weather is rolled at dawn)
  var YEAR = { spring: [['clear', 0.5], ['shower', 0.38], ['mist', 0.12]], summer: [['clear', 0.85], ['shower', 0.1], ['mist', 0.05]],
               autumn: [['clear', 0.22], ['overcast', 0.13], ['rain', 0.3], ['storm', 0.1], ['mist', 0.25]],
               winter: [['clear', 0.45], ['snow', 0.35], ['heavySnow', 0.15], ['blizzard', 0.05]] };
  var DUSK_AT = 840;

  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function pick(R, rows) { var x = R(), acc = 0, i; for (i = 0; i < rows.length; i++) { acc += rows[i][1]; if (x < acc) return rows[i][0]; } return rows[rows.length - 1][0]; }
  function rollKind(season, n, seed) { return pick(rng(seed * 31 + n * 7919 + 17), YEAR[season] || YEAR.summer); }

  function day(season, n, seed) {
    var R = rng(seed * 131 + n * 104729 + 5), kind = rollKind(season, n, seed), out = [], k, at;
    var prev = n > 0 ? rollKind(season, n - 1, seed) : 'clear';
    if ((prev === 'rain' || prev === 'storm') && kind !== 'mist' && R() < 0.5) out.push({ kind: 'mist', at: 0, len: 260 });   // after a wet day, mist at dawn on half the mornings
    if (kind === 'shower') for (k = 0, at = 60 + R() * 200; k < 1 + Math.floor(R() * 3) && at < DUSK_AT - 100; k++) { var l = 50 + R() * 50; out.push({ kind: 'shower', at: at, len: l }); at += l + 120 + R() * 200; }
    if (kind === 'mist') out.push({ kind: 'mist', at: 0, len: 260 + R() * 80 });
    if (kind === 'overcast') out.push({ kind: 'overcast', at: 0, len: DUSK_AT });
    if (kind === 'rain') { at = 100 + R() * 500; var lr = 150 + R() * 150; out.push({ kind: 'overcast', at: at - 60, len: lr + 120 }, { kind: 'rain', at: at, len: lr }); }
    if (kind === 'storm') { at = 150 + R() * 400; var ls = 120 + R() * 120; out.push({ kind: 'overcast', at: at - 150, len: ls + 330 }, { kind: 'rain', at: at - 60, len: 60 }, { kind: 'storm', at: at, len: ls }, { kind: 'rain', at: at + ls, len: 90 }); }
    if (kind === 'snow') out.push({ kind: 'snow', at: 60 + R() * 400, len: 200 + R() * 200 });
    if (kind === 'heavySnow') { at = 80 + R() * 400; var lh = 180 + R() * 120; out.push({ kind: 'snow', at: at - 60, len: 60 }, { kind: 'heavySnow', at: at, len: lh }, { kind: 'snow', at: at + lh, len: 90 }); }
    if (kind === 'blizzard') { at = 120 + R() * 400; var lb = 60 + R() * 60; out.push({ kind: 'heavySnow', at: at - 60, len: 60 }, { kind: 'blizzard', at: at, len: lb }, { kind: 'heavySnow', at: at + lb, len: 120 }); }
    return out;
  }

  function make(kind, seed) { return { kind: kind, K: KINDS[kind], k: 0, target: 1, t: 0, R: rng(seed || 7), drops: [], flakes: [], splashes: [], rings: [], leaves: [], banks: [], flash: 0, nextFlash: 8, w: 0, h: 0 }; }
  function area(env) { return env.W * env.H / (1920 * 1080); }
  function slantOf(K, env) { var w = env.wind || { a: 0, s: 0 }, side = Math.cos(w.a) >= 0 ? 1 : -1; return side * (K.rain ? K.rain.slant : 0) * Math.min(1, 0.25 + w.s); }

  function fill(S, env) {                        // particles for the whole screen, so a spell does not begin as a wall
    var K = S.K, R = S.R, A = area(env), i, n;
    if (K.rain) for (n = Math.round(K.rain.n * A), i = S.drops.length; i < n; i++) { var far = R() < 0.6; S.drops.push({ x: R() * env.W, y: R() * env.H, far: far, len: lerp(K.rain.len[0], K.rain.len[1], R()) * (far ? 0.7 : 1), a: lerp(K.rain.a[0], K.rain.a[1], R()) * (far ? 0.6 : 1), v: K.rain.v * (far ? 0.7 : 1) * lerp(0.9, 1.1, R()) }); }
    if (K.snow) for (n = Math.round(K.snow.n * A), i = S.flakes.length; i < n; i++) { var x = R(), L = x < LAYERS[0].f ? 0 : (x < LAYERS[0].f + LAYERS[1].f ? 1 : 2), Ly = LAYERS[L]; S.flakes.push({ x: R() * env.W, y: R() * env.H, L: L, r: lerp(Ly.r[0], Ly.r[1], R()), v: lerp(Ly.v[0], Ly.v[1], R()), ph: R() * 6.28, sw: 6 + R() * 10 }); }
    if (K.leaves) for (n = Math.round(K.leaves * A * (K === KINDS.storm ? 1 : 1)), i = S.leaves.length; i < n; i++) S.leaves.push({ x: R() * env.W, y: R() * env.H, s: 3 + R() * 2.5, spin: R() * 6.28, vs: 4 + R() * 8, c: LEAF[i % 3], v: 0.6 + R() * 0.8 });
    if (K.mist && env.toScreen) for (n = Math.max(4, Math.round(K.mist.n * Math.max(0.5, A))), i = S.banks.length; i < n; i++) S.banks.push(bank(S, env, true));
  }
  function bank(S, env, anywhere) {               // a mist bank: a world point (it lies on the land and the water, and stays put as you walk)
    var R = S.R, K = S.K.mist, z = env.zoom || 1, best = null, tries;
    for (tries = 0; tries < 10; tries++) {
      var sx = anywhere ? R() * env.W : (Math.cos((env.wind || { a: 0 }).a) > 0 ? -K.r[1] * lerp(0.4, 1.4, R()) : env.W + K.r[1] * lerp(0.4, 1.4, R())), sy = R() * env.H * 1.2 - env.H * 0.1;
      var crowd = 0; for (var bi = 0; bi < S.banks.length; bi++) { var ob = S.banks[bi], oq = env.toScreen(ob.x, ob.y); if (Math.abs(oq[0] - sx) < ob.r * z * 1.3 && Math.abs(oq[1] - sy) < ob.r * z * 0.5) crowd++; }
      if (crowd && tries < 9) continue;                                         // not on top of another bank
      var wp = env.fromScreen ? env.fromScreen(sx, sy) : [env.cam.x + (sx - env.W / 2) / z, env.cam.y + (sy - env.H / 2) / z], wx = wp[0], wy = wp[1], lo = env.low ? env.low(wx, wy) : 0.6;
      if (!best || lo > best.lo) best = { wx: wx, wy: wy, lo: lo };
      if (lo > 0.7) break;
    }
    var lobes = [], nl = 4 + Math.floor(R() * 2); for (var li = 0; li < nl; li++) lobes.push([lerp(-0.9, 0.9, li / (nl - 1)) + (R() - 0.5) * 0.2, (R() - 0.5) * 0.12, lerp(0.45, 0.75, R())]);   // along the bank: offset (of r), height offset, size
    return { x: best.wx, y: best.wy, lo: best.lo, r: lerp(K.r[0], K.r[1], R()) / z, a: lerp(K.a[0], K.a[1], R()), ph: R() * 6.28, lobes: lobes };
  }

  function tick(S, dt, env) {
    var K = S.K, R = S.R, A = area(env), w = env.wind || { a: 0, s: 0 }, ramp = S.target > S.k ? K.ramp[0] : K.ramp[1], i, p;
    S.t += dt; S.k += Math.max(-dt / ramp, Math.min(dt / ramp, S.target - S.k));
    if (S.w !== env.W || S.h !== env.H) { S.w = env.W; S.h = env.H; fill(S, env); }
    var cdx = S.cam ? (env.cam.x - S.cam.x) * (env.zoom || 1) : 0, cdy = S.cam ? (env.cam.y - S.cam.y) * (env.zoom || 1) : 0; S.cam = { x: env.cam.x, y: env.cam.y };
    var wrap = function (q, m) { if (q.x < -m) q.x += env.W + 2 * m; else if (q.x > env.W + m) q.x -= env.W + 2 * m; if (q.y < -m) q.y += env.H + 2 * m; else if (q.y > env.H + m) q.y -= env.H + 2 * m; };
    if (K.rain) { var sl = slantOf(K, env), sx = Math.sin(sl), sy = Math.cos(sl);
      for (i = 0; i < S.drops.length; i++) { p = S.drops[i]; p.x += sx * p.v * dt - cdx * (p.far ? 0.7 : 1); p.y += sy * p.v * dt - cdy * (p.far ? 0.7 : 1); wrap(p, 60); } }
    if (K.snow) { var gust = Math.cos(w.a) * w.s * (K.snow.streak ? 520 : 120);
      for (i = 0; i < S.flakes.length; i++) { p = S.flakes[i]; var Ly = LAYERS[p.L]; p.ph += dt * 0.9;
        p.x += (gust * Ly.par + Math.sin(p.ph) * p.sw * 0.9) * dt - cdx * Ly.par; p.y += (p.v * (K.snow.streak ? 2.2 : 1) + Math.sin(w.a) * w.s * 40) * dt - cdy * Ly.par; wrap(p, 20); } }
    if (K.leaves) for (i = 0; i < S.leaves.length; i++) { p = S.leaves[i]; p.spin += p.vs * dt; p.x += Math.cos(w.a) * (150 + 380 * w.s) * p.v * dt - cdx; p.y += (Math.sin(w.a) * 120 * w.s + 30 + Math.sin(p.spin * 0.7) * 40) * dt - cdy; wrap(p, 30); }
    if (K.splash && env.water) { var ns = K.splash * A * S.k * dt; while (ns > 0) { if (R() < ns) { var x = R() * env.W, y = R() * env.H; if (!env.water(x, y)) S.splashes.push({ x: x, y: y, t: 0 }); } ns -= 1; } }
    for (i = S.splashes.length - 1; i >= 0; i--) { p = S.splashes[i]; p.t += dt; p.x -= cdx; p.y -= cdy; if (p.t > 0.14) S.splashes.splice(i, 1); }
    if (K.rings && env.water) { var nr = K.rings * A * S.k * dt; while (nr > 0) { if (R() < nr) for (var tr = 0; tr < 6; tr++) { var rx = R() * env.W, ry = R() * env.H; if (env.water(rx, ry)) { S.rings.push({ x: rx, y: ry, t: 0 }); break; } } nr -= 1; } }
    for (i = S.rings.length - 1; i >= 0; i--) { p = S.rings[i]; p.t += dt; p.x -= cdx; p.y -= cdy; if (p.t > 0.6) S.rings.splice(i, 1); }
    if (K.flash) { S.nextFlash -= dt; if (S.nextFlash <= 0 && S.k > 0.7) { S.flash = 1; S.flashT = 0; S.nextFlash = lerp(K.flash[0], K.flash[1], R()); } if (S.flash) { S.flashT += dt; if (S.flashT > 0.32) S.flash = 0; } }
    if (K.mist && env.toScreen) { var z = env.zoom || 1;
      for (i = 0; i < S.banks.length; i++) { p = S.banks[i]; p.ph += dt * 0.05; p.x += Math.cos(w.a) * (6 + 18 * w.s) * dt / z; p.y += Math.sin(w.a) * (4 + 10 * w.s) * dt / z;
        var q = env.toScreen(p.x, p.y), m = p.r * z; if (q[0] < -m * 1.2 || q[0] > env.W + m * 1.2 || q[1] < -m || q[1] > env.H + m) S.banks[i] = bank(S, env, false); } }
  }

  var blobCv = null;
  function blob(mk) {                             // a soft round patch, made once: the mist's brush
    if (blobCv) return blobCv; blobCv = mk(128, 128); var g = blobCv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.62)'); gr.addColorStop(0.8, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return blobCv;
  }
  function tinted(mk, col) {
    var key = col.join(','); tinted.c = tinted.c || {}; if (tinted.c[key]) return tinted.c[key];
    var b = blob(mk), cv = mk(128, 128), g = cv.getContext('2d'); g.drawImage(b, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(' + key + ')'; g.fillRect(0, 0, 128, 128);
    return (tinted.c[key] = cv);
  }

  function draw(ctx, S, env) {
    var K = S.K, k = S.k, W = env.W, H = env.H, nightK = 1 - 0.5 * (env.night || 0), i, p;
    if (k <= 0.001) return;
    var mk = env.mk || function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    var V = K.veil || {};
    if (V.mul) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(' + V.mul[0] + ',' + V.mul[1] + ',' + V.mul[2] + ',' + (V.mul[3] * k) + ')'; ctx.fillRect(0, 0, W, H); }
    if (V.sat) { ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,' + (V.sat * k) + ')'; ctx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = 'source-over';
    if (K.mist && env.toScreen) {                 // the banks, on the world; thickest where it is low and wet
      var tb = tinted(mk, K.mist.col), z = env.zoom || 1;
      for (i = 0; i < S.banks.length; i++) { p = S.banks[i]; var q = env.toScreen(p.x, p.y), rr = p.r * z * (1 + 0.06 * Math.sin(p.ph * 3));
        var al = p.a * k * (0.12 + 0.88 * Math.pow(p.lo, 1.6));               // a bank lies in the low and wet places and thins to nothing up the slopes
        ctx.globalAlpha = Math.min(0.6, al * 0.55);
        for (var lj = 0; lj < p.lobes.length; lj++) { var L2 = p.lobes[lj], lw = rr * L2[2] * 1.5, lh = rr * L2[2] * 0.34;   // a long flat drift of lobes, each wide and low
          ctx.drawImage(tb, q[0] + L2[0] * rr + rr * 0.05 * Math.sin(p.ph + lj) - lw, q[1] + L2[1] * rr - lh, lw * 2, lh * 2); } }
      ctx.globalAlpha = 1;
    }
    if (V.haze) { var g = ctx.createLinearGradient(0, 0, 0, H), c = V.haze[0] + ',' + V.haze[1] + ',' + V.haze[2];   // farther (up the screen) hazier
      g.addColorStop(0, 'rgba(' + c + ',' + (V.haze[3] * k) + ')'); g.addColorStop(1, 'rgba(' + c + ',' + (V.haze[4] * k) + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (K.rings) { ctx.lineWidth = 1; for (i = 0; i < S.rings.length; i++) { p = S.rings[i]; var tt = p.t / 0.6, r0 = 2 + 8 * tt;
      ctx.strokeStyle = 'rgba(' + RING + ',' + (0.45 * (1 - tt) * nightK) + ')'; ctx.beginPath(); ctx.ellipse(p.x, p.y, r0, r0 * 0.55, 0, 0, 6.283); ctx.stroke(); } }
    if (K.rain) { var sl = slantOf(K, env), sx = Math.sin(sl), sy = Math.cos(sl), n = Math.round(S.drops.length * k), b;   // three alpha buckets, one stroke each
      ctx.lineCap = 'round';
      for (b = 0; b < 3; b++) { var aB = 0, cnt = 0; ctx.beginPath();
        for (i = b; i < n; i += 3) { p = S.drops[i]; ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - sx * p.len, p.y - sy * p.len); aB += p.a; cnt++; }
        ctx.lineWidth = K.rain.w * (b === 2 ? 1.25 : 1); ctx.strokeStyle = 'rgba(' + STREAK + ',' + ((cnt ? aB / cnt : 0.3) * nightK) + ')'; ctx.stroke(); }
      ctx.lineWidth = 1.1; for (i = 0; i < S.splashes.length; i++) { p = S.splashes[i]; var tq = p.t / 0.14, e = 2 + tq * 4;   // a crown where a drop lands: a small bright cup, two drops thrown up and out
        ctx.strokeStyle = 'rgba(' + STREAK + ',' + (0.75 * (1 - tq) * nightK) + ')'; ctx.beginPath(); ctx.ellipse(p.x, p.y, e, e * 0.55, 0, Math.PI, 2 * Math.PI); ctx.stroke();
        ctx.fillStyle = 'rgba(' + STREAK + ',' + (0.8 * (1 - tq) * nightK) + ')'; ctx.fillRect(p.x - e * 1.3, p.y - e * 1.1 - tq * 3, 1.5, 1.5); ctx.fillRect(p.x + e * 1.2, p.y - e * 1.2 - tq * 3, 1.5, 1.5); } }
    if (K.leaves) for (i = 0; i < Math.round(S.leaves.length * k); i++) { p = S.leaves[i]; ctx.fillStyle = p.c; ctx.globalAlpha = 0.9 * nightK;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.s * Math.max(0.2, Math.abs(Math.cos(p.spin))), p.s * 0.55, p.spin * 0.5, 0, 6.283); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (K.snow) { var nf = Math.round(S.flakes.length * k), wd = env.wind || { a: 0, s: 0 }, gx = Math.cos(wd.a) * wd.s;
      for (var L = 0; L < 3; L++) { ctx.fillStyle = FLAKE; ctx.strokeStyle = FLAKE; ctx.globalAlpha = LAYERS[L].a * nightK; ctx.beginPath();
        for (i = 0; i < nf; i++) { p = S.flakes[i]; if (p.L !== L) continue;
          if (K.snow.streak) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - gx * p.r * 7, p.y - p.r * 2.5); }
          else { ctx.moveTo(p.x + p.r, p.y); ctx.arc(p.x, p.y, p.r, 0, 6.283); } }
        if (K.snow.streak) { ctx.lineWidth = 1.2 + L * 0.6; ctx.lineCap = 'round'; ctx.stroke(); } else ctx.fill(); }
      ctx.globalAlpha = 1; }
    if (S.flash) { var f = S.flashT < 0.07 ? 0.4 : (S.flashT < 0.13 ? 0 : (S.flashT < 0.22 ? 0.25 : 0));   // two flashes, far off; the thunder is Derek, SD's, 1.5 to 5 s later
      if (f) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(225,232,255,' + f + ')'; ctx.fillRect(0, 0, W, H); } }
    ctx.restore();
  }

  // ---- the ground (2026-10-23, Robin: "Are there any effects that can be done on the ground with the weather? And also like
  // footsteps in snow"): what the weather leaves on the ground and what a walker leaves in it. Under the figures: the wet, the
  // fresh snow, the frost, the puddles, the prints, the snow streaming and the leaves skittering; over them: breath, kicked snow
  // and splashes. env.kind(sx, sy) -> 'water' | 'sand' | 'snow' | 'grass' (the game knows its ground's kind; the page uses a mask);
  // env.landMask: a canvas the frame's size, opaque on land (the game would rather lay the wet and the frost on its ground pass,
  // under the standing things).
  var GROUND = {
    wet: { up: 40, down: 150, mul: [150, 160, 182, 0.24] },       // seconds to wet through under full rain, to dry; the darkening when wet through
    puddle: { n: 10, r: [14, 32], col: '92,112,136', sky: '214,226,238', ice: '208,224,236' },
    print: { snow: { a: 0.55, life: 45 }, sand: { a: 0.4, life: 20 }, mud: { a: 0.34, life: 40 }, max: 36 },   // a print's strength and its life in seconds (snowfall fills them faster); at most 36 a walker: a short trail behind him, never a map of where he has been (Robin, 2026-10-23: footprints where they make sense, not bloat)
    fresh: { up: 60, down: 240, col: '248,250,253', a: 0.2 },      // new snow whitening the ground while it falls
    frost: { col: '236,242,248', a: 0.4 },
    drift: { n: 28, len: [60, 170], a: 0.34, v: [170, 340] },      // snow streaming low along the ground in a wind over 0.4
    skitter: { n: 14 }                                             // autumn leaves blown along the ground in a wind over 0.35
  };
  function mkCanvas(env) { return env.mk || function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }; }
  function groundMake(seed) {   // (G.puddles may be set by the caller: the game's own low places and paths)
    return { R: rng(seed || 3), wet: 0, fresh: 0, frost: 0, frostGoal: 0, prints: [], puddles: null, drifts: [], skit: [], fx: [], t: 0 }; }
  function puddlesFor(G, env) {                  // hollows and low places that hold water: on land, low, apart from one another
    var R = G.R, out = [], tries, i, j;
    for (tries = 0; tries < 400 && out.length < GROUND.puddle.n; tries++) {
      var x = R() * env.W, y = R() * env.H, k = env.kind ? env.kind(x, y) : 'grass'; if (k === 'water' || k === 'sand') continue;
      var lo = env.low ? env.low(x, y) : 0.6; if (lo < 0.15 + R() * 0.35) continue;   // low ground first, but any flat place holds a puddle
      var far = true; for (i = 0; i < out.length; i++) if (Math.hypot(out[i].x - x, out[i].y - y) < 90) far = false; if (!far) continue;
      var r = lerp(GROUND.puddle.r[0], GROUND.puddle.r[1], R()), lobes = [];
      for (j = 0; j < 3; j++) lobes.push([(R() - 0.5) * r * 0.9, (R() - 0.5) * r * 0.35, r * lerp(0.55, 0.9, R())]);
      out.push({ x: x, y: y, r: r, lobes: lobes });
    }
    return out;
  }
  // w8: { rain: 0..1, snow: 0..1, season }
  function groundTick(G, dt, env, w8) {
    var R = G.R, wd = env.wind || { a: 0, s: 0 }, i, p, A = area(env); G.t += dt;
    var rain = w8.rain || 0, snow = w8.snow || 0, winter = w8.season === 'winter';
    G.wet += rain > G.wet ? (rain - G.wet) * Math.min(1, dt * 3 / GROUND.wet.up) : -Math.min(G.wet, dt / GROUND.wet.down);
    if (winter) G.wet = 0;
    G.fresh += snow > G.fresh ? (snow - G.fresh) * Math.min(1, dt * 3 / GROUND.fresh.up) : -Math.min(G.fresh, dt / GROUND.fresh.down);
    G.frost += (G.frostGoal - G.frost) * Math.min(1, dt * 0.5);
    if (!G.puddles) G.puddles = puddlesFor(G, env);
    for (i = G.prints.length - 1; i >= 0; i--) { p = G.prints[i]; p.t += dt * (p.kind === 'snow' ? 1 + 4 * snow : (p.kind === 'mud' ? 1 + 2 * rain : 1)); if (p.t > GROUND.print[p.kind].life) G.prints.splice(i, 1); }
    if (rain > 0.05) for (i = 0; i < G.puddles.length; i++) { p = G.puddles[i]; if (R() < rain * dt * 3 * Math.min(1, G.wet * 2)) G.fx.push({ kind: 'ring', x: p.x + (R() - 0.5) * p.r, y: p.y + (R() - 0.5) * p.r * 0.35, t: 0, life: 0.6 }); }   // rings in the puddles while it rains
    groundDrips(G, dt, env, rain);
    for (i = G.fx.length - 1; i >= 0; i--) { p = G.fx[i]; p.t += dt; if (p.vx != null) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; }
      if (p.t > p.life) { if (p.kind === 'drip') G.fx.push({ kind: 'ring', x: p.x, y: p.y1, t: 0, life: 0.45 }); G.fx.splice(i, 1); } }
    var dn = winter && wd.s > 0.4 ? Math.round(GROUND.drift.n * A * 2.3 * (wd.s - 0.4) / 0.6) : 0;   // snow streaming along the ground
    while (G.drifts.length < dn) G.drifts.push({ x: R() * env.W, y: R() * env.H, len: lerp(GROUND.drift.len[0], GROUND.drift.len[1], R()), v: lerp(GROUND.drift.v[0], GROUND.drift.v[1], R()), ph: R() * 6.28, life: 1.5 + R() * 2.5, t: 0 });
    if (G.drifts.length > dn) G.drifts.length = dn;
    for (i = 0; i < G.drifts.length; i++) { p = G.drifts[i]; p.t += dt; p.ph += dt * 3; var sp = p.v * (0.4 + wd.s); p.x += Math.cos(wd.a) * sp * dt; p.y += Math.sin(wd.a) * sp * dt * 0.75;
      if (p.t > p.life || p.x < -200 || p.x > env.W + 200 || p.y < -50 || p.y > env.H + 50) { p.x = R() * env.W; p.y = R() * env.H; p.t = 0; p.life = 1.5 + R() * 2.5; } }
    var sn = w8.season === 'autumn' && wd.s > 0.35 ? Math.round(GROUND.skitter.n * A * 2.3 * Math.min(1, (wd.s - 0.35) / 0.4)) : 0;   // autumn leaves skittering along the ground in gusts
    while (G.skit.length < sn) G.skit.push({ x: R() * env.W, y: R() * env.H, spin: R() * 6.28, s: 2.6 + R() * 2, c: LEAF[G.skit.length % 3], ph: R() * 6.28 });
    if (G.skit.length > sn) G.skit.length = sn;
    for (i = 0; i < G.skit.length; i++) { p = G.skit[i]; p.ph += dt * 1.3; var gs = Math.max(0, Math.sin(p.ph)), gust = gs * gs, v = (90 + 260 * wd.s) * gust;
      p.x += Math.cos(wd.a) * v * dt; p.y += Math.sin(wd.a) * v * dt * 0.6 + Math.sin(p.ph * 3) * 6 * dt * gust; p.spin += dt * 9 * gust;
      if (p.x < -20 || p.x > env.W + 20 || p.y < -20 || p.y > env.H + 20) { p.x = Math.cos(wd.a) > 0 ? -10 : env.W + 10; p.y = R() * env.H; } }
  }
  // a footfall: x, y the foot's ground point on the screen, a the heading (rad), side -1 or 1. Who steps is the game's: the hero always;
  // beasts in snow only (a wolf's or a deer's line of tracks tells you something passed); people never (their ground is trodden paths already)
  function groundStep(G, x, y, a, side, env, w8) {
    var k = env.kind ? env.kind(x, y) : 'grass', R = G.R, i, j;
    if (w8 && w8.season === 'winter' && k !== 'water') k = 'snow';             // prints only where the ground holds them: snow; wet sand at the waterline; a path gone to mud
    else if (k === 'sand') { if (env.shore && !env.shore(x, y)) return; }        // dry sand runs back in: nothing
    else if (k === 'path') { if (G.wet > 0.35) k = 'mud'; else return; }
    else return;                                                               // grass springs back, water takes no print
    G.prints.push({ x: x, y: y, a: a, side: side, kind: k, t: 0 }); if (G.prints.length > GROUND.print.max) G.prints.shift();
    if (k === 'snow') for (i = 0; i < 4; i++) G.fx.push({ kind: 'kick', x: x, y: y, vx: (R() - 0.5) * 30 + Math.cos(a) * 20, vy: -25 - R() * 25, g: 140, t: 0, life: 0.35 + R() * 0.2 });
    if (G.wet > 0.3 && G.puddles) for (i = 0; i < G.puddles.length; i++) { var p = G.puddles[i]; if (Math.hypot((x - p.x) / p.r, (y - p.y) / (p.r * 0.4)) < 1.1) {
      G.fx.push({ kind: 'ring', x: x, y: y, t: 0, life: 0.7, big: 1 }); for (j = 0; j < 6; j++) G.fx.push({ kind: 'drop', x: x, y: y, vx: (R() - 0.5) * 60, vy: -40 - R() * 40, g: 200, t: 0, life: 0.4 }); } }
  }
  // drips under the trees: G.drips = [{ x0, x1, top, foot }] (a crown's width on the screen, its lower edge, the ground under it), given by the
  // game from its trees. While the trees are wet they drop water, most in the minute after the rain stops (a drop from a leaf, a ring or a dark dot where it lands)
  function groundDrips(G, dt, env, rain) {
    if (!G.drips || G.wet < 0.15) return; var R = G.R, rate = (rain > 0.05 ? 0.25 : 0.9) * Math.min(1, G.wet * 1.5), i;
    for (i = 0; i < G.drips.length; i++) { var t = G.drips[i]; if (R() < rate * dt * (t.x1 - t.x0) / 40) { var x = t.x0 + R() * (t.x1 - t.x0), y0 = t.top + R() * 6, y1 = t.foot - R() * 10;
      G.fx.push({ kind: 'drip', x: x, y: y0, y0: y0, y1: y1, t: 0, life: Math.max(0.12, (y1 - y0) / 420) }); } }
  }
  function groundBreath(G, x, y, env) { var wd = env.wind || { a: 0, s: 0 }; G.fx.push({ kind: 'breath', x: x, y: y, vx: Math.cos(wd.a) * (8 + 30 * wd.s), vy: -6, t: 0, life: 1.4 }); }
  function masked(env, col, alpha, op, ctx) {     // a fill over the land only (the page's way; the game lays it on its ground pass)
    if (!env.landMask || alpha <= 0.003) return;
    var t = masked.cv && masked.cv.width === env.W ? masked.cv : (masked.cv = mkCanvas(env)(env.W, env.H));
    var g = t.getContext('2d'); g.globalCompositeOperation = 'copy'; g.drawImage(env.landMask, 0, 0, env.W, env.H); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgba(' + col + ',' + alpha + ')'; g.fillRect(0, 0, env.W, env.H);
    ctx.globalCompositeOperation = op; ctx.drawImage(t, 0, 0); ctx.globalCompositeOperation = 'source-over';
  }
  function frostDots(env) {                       // rime on the grass: a fine speckle, made once
    if (frostDots.cv) return frostDots.cv; var c = mkCanvas(env)(256, 256), g = c.getContext('2d'), R = rng(77), i;
    for (i = 0; i < 650; i++) { g.fillStyle = 'rgba(246,250,255,' + (0.35 + R() * 0.45) + ')'; g.fillRect(Math.floor(R() * 256), Math.floor(R() * 256), 1 + (R() < 0.3 ? 1 : 0), 1); }
    return (frostDots.cv = c);
  }
  function groundDraw(ctx, G, env, layer, w8) {
    var i, p, q, wd = env.wind || { a: 0, s: 0 }, winter = w8 && w8.season === 'winter', P = GROUND.puddle;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (layer === 'under') {
      var M = GROUND.wet.mul; if (!env.wetBoards) { masked(env, M[0] + ',' + M[1] + ',' + M[2], M[3] * G.wet, 'multiply', ctx); masked(env, GROUND.fresh.col, GROUND.fresh.a * G.fresh, 'source-over', ctx); }   // (env.wetBoards: the caller lays its own soaked and fresh-snowed pictures, as the game would with wetPicture and deepen)
      if (G.frost > 0.01 && env.landMask) { masked(env, GROUND.frost.col, GROUND.frost.a * G.frost, 'source-over', ctx);
        var t2 = masked.cv, g2 = t2.getContext('2d'); g2.globalCompositeOperation = 'copy'; g2.fillStyle = g2.createPattern(frostDots(env), 'repeat'); g2.fillRect(0, 0, env.W, env.H); g2.globalCompositeOperation = 'destination-in'; g2.drawImage(env.landMask, 0, 0, env.W, env.H); g2.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = G.frost * 0.85; ctx.drawImage(t2, 0, 0); ctx.globalAlpha = 1; }
      var ps = winter ? 0.8 : Math.min(1, Math.max(0, (G.wet - 0.2) / 0.6));   // puddles grow as the ground wets; frozen in winter
      if (ps > 0.01 && G.puddles) for (i = 0; i < G.puddles.length; i++) { p = G.puddles[i];
        ctx.fillStyle = 'rgba(' + (winter ? P.ice : P.col) + ',' + (winter ? 0.55 : 0.5 * ps) + ')'; ctx.beginPath();
        for (q = 0; q < p.lobes.length; q++) { var l = p.lobes[q]; ctx.moveTo(p.x + l[0] + l[2] * ps, p.y + l[1]); ctx.ellipse(p.x + l[0], p.y + l[1], l[2] * ps, l[2] * ps * 0.38, 0, 0, 6.283); } ctx.fill();
        ctx.strokeStyle = 'rgba(' + (winter ? '255,255,255' : P.sky) + ',' + (winter ? 0.7 : 0.6 * ps) + ')'; ctx.lineWidth = winter ? 1.2 : 1.5; ctx.beginPath();   // the sky in it, a pale streak along its far side (on ice, a glint)
        ctx.ellipse(p.x - p.r * 0.1, p.y - p.r * 0.06, p.r * 0.55 * ps, p.r * 0.12 * ps, -0.05, 3.5, 5.9); ctx.stroke(); }
      for (i = 0; i < G.prints.length; i++) { p = G.prints[i]; var S = GROUND.print[p.kind], f = 1 - p.t / S.life; f = f < 0.25 ? f / 0.25 : 1; var al = S.a * f;
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.75); ctx.rotate(p.a);
        if (p.kind === 'snow') { ctx.fillStyle = 'rgba(112,134,170,' + al + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 3.4, 0, 0, 6.283); ctx.fill();
          ctx.fillStyle = 'rgba(248,251,255,' + al * 0.7 + ')'; ctx.beginPath(); ctx.ellipse(0.8, 1.6, 5, 1.4, 0, 0, 6.283); ctx.fill(); }   // the dent's wall toward the light
        else { ctx.fillStyle = (p.kind === 'sand' ? 'rgba(124,96,60,' : 'rgba(66,50,34,') + al + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 2.8, 0, 0, 6.283); ctx.fill();
          ctx.fillStyle = (p.kind === 'sand' ? 'rgba(104,78,46,' : 'rgba(50,38,26,') + al + ')'; ctx.beginPath(); ctx.ellipse(3.4, 0, 2.2, 2.2, 0, 0, 6.283); ctx.fill(); }   // the toe pressed deeper
        ctx.restore(); }
      for (i = 0; i < G.drifts.length; i++) { p = G.drifts[i]; if (env.kind && env.kind(p.x, p.y) === 'water') continue; var fa = Math.sin(Math.PI * Math.min(1, p.t / p.life));   // snow streaming low along the ground
        var ca = Math.cos(wd.a), sa = Math.sin(wd.a) * 0.75; ctx.beginPath();
        for (q = 0; q <= 10; q++) { var u = q / 10, wob = Math.sin(p.ph + u * 5) * 3 * u; ctx.lineTo(p.x - ca * p.len * u - sa * wob, p.y - sa * p.len * u + ca * wob); }
        ctx.strokeStyle = 'rgba(250,252,255,' + GROUND.drift.a * fa * 0.5 + ')'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,' + GROUND.drift.a * fa + ')'; ctx.lineWidth = 1.2; ctx.stroke(); }
      for (i = 0; i < G.skit.length; i++) { p = G.skit[i]; if (env.kind && env.kind(p.x, p.y) === 'water') continue; ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.s * Math.max(0.25, Math.abs(Math.cos(p.spin))), p.s * 0.5, p.spin * 0.4, 0, 6.283); ctx.fill(); }
    } else {
      for (i = 0; i < G.fx.length; i++) { p = G.fx[i]; var tt = p.t / p.life;
        if (p.kind === 'ring') { var rr = (p.big ? 4 : 2) + (p.big ? 12 : 7) * tt; ctx.strokeStyle = 'rgba(' + RING + ',' + 0.5 * (1 - tt) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, rr, rr * 0.45, 0, 0, 6.283); ctx.stroke(); }
        else if (p.kind === 'drip') { var dy = p.y0 + (p.y1 - p.y0) * tt * tt; ctx.strokeStyle = 'rgba(' + STREAK + ',0.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, dy - 4); ctx.lineTo(p.x, dy); ctx.stroke(); }
        else if (p.kind === 'kick') { ctx.fillStyle = 'rgba(250,252,255,' + 0.85 * (1 - tt) + ')'; ctx.fillRect(p.x - 1, p.y - 1, 2, 2); }
        else if (p.kind === 'drop') { ctx.fillStyle = 'rgba(' + RING + ',' + 0.7 * (1 - tt) + ')'; ctx.fillRect(p.x - 0.8, p.y - 0.8, 1.6, 1.6); }
        else if (p.kind === 'breath') { var br = 3 + tt * 8; ctx.globalAlpha = 0.4 * (1 - tt); ctx.drawImage(tinted(mkCanvas(env), [244, 247, 250]), p.x - br, p.y - br * 0.8, br * 2, br * 1.6); ctx.globalAlpha = 1; } }
    }
    ctx.restore();
  }
  function hashW(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
  function wetPicture(d, w, h) {
    var x, y, i, j;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { i = (y * w + x) * 4; if (d[i + 3] < 10) continue;
      var r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 510;
      if (l < 0.14) continue;                                                   // the ink line stays as it is
      var m = (r + g + b) / 3; r = (m + (r - m) * 1.15) * 0.8; g = (m + (g - m) * 1.15) * 0.8; b = (m + (b - m) * 1.15) * 0.83;   // darker and a little richer, as wet wood and stone are
      var a1 = y >= 1 ? d[((y - 1) * w + x) * 4 + 3] : 0, a3 = y >= 3 ? d[((y - 3) * w + x) * 4 + 3] : 0, a5 = y >= 5 ? d[((y - 5) * w + x) * 4 + 3] : 0;
      var lineAbove = false; for (j = 1; j <= 3 && y - j >= 0; j++) { var q = ((y - j) * w + x) * 4; if (d[q + 3] > 150 && Math.max(d[q], d[q + 1], d[q + 2]) < 60) lineAbove = true; }
      if ((a5 < 40 || a3 < 40) && (lineAbove || a1 > 150) && l > 0.24) { r += (238 - r) * 0.45; g += (244 - g) * 0.45; b += (250 - b) * 0.45; }   // the sky caught along its upper edge
      else if (l > 0.42 && hashW(x, y) < 0.005) { r = 246; g = 249; b = 252; }   // a glint here and there on its lit side
      d[i] = r < 0 ? 0 : r > 255 ? 255 : r; d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g; d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b; }
    return true;
  }

  function mkOf(mk) { return mk || function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }; }
  // the picture's pixels that lie (dx0, dy0) inside its edge but not (dx1, dy1): an edge band, filled with col, kept inside the picture
  function band(src, w, h, dx0, dy0, dx1, dy1, col, mk) {
    var c = mkOf(mk)(w, h), g = c.getContext('2d'); g.drawImage(src, dx0, dy0); g.globalCompositeOperation = 'destination-out'; g.drawImage(src, dx1, dy1);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-in'; g.drawImage(src, 0, 0); return c;
  }
  function overFill(g, src, w, h, op, col, a) { g.globalCompositeOperation = op; g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, w, h); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-in'; g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-over'; }

  // wetPicture by composites: darker, the sky caught along the upper edge
  function wetCanvas(src, mk) {
    var w = src.width, h = src.height, c = mkOf(mk)(w, h), g = c.getContext('2d'), ink = Math.max(1, Math.round(w / 140));
    g.drawImage(src, 0, 0); overFill(g, src, w, h, 'multiply', 'rgb(204,204,214)', 1); overFill(g, src, w, h, 'saturation', 'hsl(0,60%,50%)', 0.12);
    g.globalAlpha = 0.45; g.drawImage(band(src, w, h, 0, ink, 0, ink + Math.max(2, Math.round(w / 90)), 'rgb(238,244,250)', mk), 0, 0); g.globalAlpha = 1; return c;
  }
  function wind(kind) { return (KINDS[kind] || {}).wind || [0.15, 0.75]; }
  var api = { KINDS: KINDS, LAYERS: LAYERS, YEAR: YEAR, GROUND: GROUND, day: day, make: make, tick: tick, draw: draw, wind: wind,
    ground: { make: groundMake, tick: groundTick, step: groundStep, breath: groundBreath, draw: groundDraw }, wetPicture: wetPicture, wetCanvas: wetCanvas };
  if (typeof module !== 'undefined') module.exports = api; else root.Weather = api;
})(this);
