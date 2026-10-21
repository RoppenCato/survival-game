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
  var CFG = { paws: 14, ruffle: 18, caps: 18, glints: 700, clouds: 2, shoalN: 90, gulls: [2, 5], whaleEvery: [150, 360], fishEvery: [5, 15], sealEvery: [70, 160], sun: [-0.6, -0.8] };
  function rnd() { return Math.random(); }
  function hs(i, j) { var v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); }
  function make() { return { t: 0, paws: [], caps: [], glints: [], clouds: [], swells: [], shoals: [], fish: [], gulls: [], whale: null, seal: null, nextWhale: 40 + rnd() * 120, nextSeal: 30 + rnd() * 90, nextFish: 6, chk: 0, on: false, keep: [] }; }
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
    // the gulls: a ring round the ship at sea, else round a point of the shore near the hero; none far out at night
    var want = env.night > 0.5 && !env.shore ? 0 : (env.ship || env.shore ? Math.round(CFG.gulls[0] + rnd() * 0.001 + (CFG.gulls[1] - CFG.gulls[0]) * (S.gullK || (S.gullK = rnd()))) : 0);
    var cx = env.ship ? env.ship.x : (env.shore ? env.shore.x : env.x), cy = env.ship ? env.ship.y : (env.shore ? env.shore.y : env.y);
    for (i = S.gulls.length - 1; i >= 0; i--) { p = S.gulls[i]; p.a += p.spin * dt; p.cx += (cx - p.cx) * Math.min(1, dt * 0.4); p.cy += (cy - p.cy) * Math.min(1, dt * 0.4); p.x = p.cx + Math.cos(p.a) * p.R; p.y = p.cy + Math.sin(p.a) * p.R; p.h = p.a + (p.spin > 0 ? Math.PI / 2 : -Math.PI / 2);
      p.ft += dt; if (p.glide > 0) { p.glide -= dt; p.f = 4; } else { p.f = Math.floor(p.ft * 6) % 4; if (rnd() < dt * 0.25) p.glide = 1 + rnd() * 1.5; }
      p.life -= dt; if (p.life < 0 || (want === 0 && rnd() < dt)) S.gulls.splice(i, 1); }
    if (S.gulls.length < want && rnd() < dt * 0.5) S.gulls.push({ cx: cx, cy: cy, a: rnd() * 6.283, R: 60 + rnd() * 90, spin: (rnd() < 0.5 ? 1 : -1) * (0.35 + rnd() * 0.35), hgt: 18 + rnd() * 30, f: 0, ft: rnd() * 3, glide: 0, life: 40 + rnd() * 60, x: cx, y: cy, h: 0 });
    if ((S.gullT = (S.gullT || 0) + dt) > 30) { S.gullT = 0; S.gullK = rnd(); }
  }
  function lin(c, x0, y0, x1, y1) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  function drawWater(c, S, env) {         // in the world's frame (x, y * K); the swell, the clouds, the cat's-paws and their ruffle, the whitecaps, the glitter, the shoals
    if (!S.on) return; var w = env.wind, i, j, p, g;
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
  return { CFG: CFG, make: make, tick: tick, drawWater: drawWater, lifeItems: lifeItems, drawGulls: drawGulls, piece: piece, pennant: pennant, bowSpray: bowSpray, spout: spout };
})();
if (typeof module !== 'undefined') module.exports = Sea;
