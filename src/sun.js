// sun.js: the day for a game seen from above (Colin, AD, 2026-10-23). Robin: "Is there any good way we could have a beautiful
// sunrise/sunset? Its so magical in Valheim but im not sure how it would work in a 2D game", and "It feels like its saying 'oh now its
// night' and then nothing happens for a long time ... you dont really feel the sun going down or up".
// From above you never see the sky, so the sun is shown by what it does, and it does something all day long:
//   - the shadows swing and stretch with it: long to the west at sunrise, short at noon, long to the east at sunset
//   - the light runs across the frame from the sun's side: fresh in the morning, plain at noon, warm in the afternoon, gold, then rose
//     and violet at sunset, the blue hour, the night
//   - every standing thing takes a warm edge on its sun side while the sun is low
//   - the water holds the sky's colours, with a path of sun on it (of moon at night) and stars when the moon is down
//   - shafts of light slant through at the golden hour and the sunrise
//   - the night moves too: the moon rises in the east, crosses, and sets in the west, and its silver path walks over the water
// The reference for the game's own code, like weather.js; browser or Node. Times are the game's day.t, with the dawn proposed at three
// minutes (DAWN_AT 1620 instead of 1740) so the sunrise can be seen.
//   Sun.KEYS                  the day's keyframes (below)
//   Sun.state(t)              the mix at a time of day: every number of the keyframes, blended
//   Sun.rimPicture(d, w, h, side, col, k)   a standing picture with its sun-side edge lit (made once; laid over at state.rimK)
//   Sun.draw(ctx, st, L)      the whole frame: L = { ground, atlas, scene, water, mk, t } (the page's layers; the game has its own)
(function (root) {
  // t: seconds of the day. sx: where the sun is across the screen (+1 the right, the east; -1 the left, the west). near/far: the light on the
  // sun's side and the far side (multiply colours with their strength). glow: the low sun's bloom on its side. shade/sk/len: the cast
  // shadow's colour, strength and length (1 = the game's day shadow). rimK: the lit edge. sky/skyK: the water's colours across, sun side
  // to far side, and how much. path/pathK: the sun's path on the water. rays: the shafts. night: the dark (the game's light()). moon: 0..1.
  var N0 = [255, 255, 255, 0];
  var KEYS = [
    { t: 0,    warm: [255, 220, 180, 0.16], sx: 0.95, near: [255, 214, 172, 0.2],  far: [190, 205, 226, 0.12], glow: [255, 220, 170, 0.15], shade: [70, 70, 130], sk: 0.3, len: 2.1, rimK: 0.5,  sky: [[255, 214, 176], [226, 222, 220], [160, 186, 214]], skyK: 0.25, path: [255, 226, 196], pathK: 0.5, rays: 0.08, night: 0,    moon: 0 },
    { t: 240,  warm: [255, 236, 210, 0.06], sx: 0.6,  near: [255, 240, 214, 0.1],  far: [214, 224, 240, 0.06], glow: [255, 236, 200, 0.06], shade: [40, 50, 100], sk: 0.36, len: 1.6, rimK: 0.22, sky: [[255, 236, 210], [226, 230, 232], [190, 206, 226]], skyK: 0.08, path: [255, 240, 220], pathK: 0.2, rays: 0,    night: 0,    moon: 0 },
    { t: 420,  warm: [255, 255, 255, 0], sx: 0,    near: N0,                    far: N0,                    glow: [255, 255, 240, 0],    shade: [20, 40, 90],  sk: 0.34, len: 0.9, rimK: 0,    sky: [[255, 255, 255], [255, 255, 255], [255, 255, 255]], skyK: 0,    path: [255, 255, 240], pathK: 0,   rays: 0,    night: 0,    moon: 0 },
    { t: 600,  warm: [255, 230, 180, 0.12], sx: -0.55, near: [255, 236, 200, 0.12], far: [236, 226, 214, 0.05], glow: [255, 230, 190, 0.06], shade: [40, 46, 100], sk: 0.38, len: 1.5, rimK: 0.2,  sky: [[255, 230, 196], [232, 230, 226], [196, 210, 226]], skyK: 0.08, path: [255, 236, 200], pathK: 0.2, rays: 0,    night: 0,    moon: 0 },
    { t: 720,  warm: [255, 190, 90, 0.34], sx: -0.85, near: [255, 206, 130, 0.26], far: [255, 220, 180, 0.1],  glow: [255, 196, 120, 0.15], shade: [40, 52, 100], sk: 0.36, len: 1.8, rimK: 0.55, sky: [[255, 214, 140], [236, 222, 196], [160, 190, 214]], skyK: 0.35, path: [255, 226, 160], pathK: 0.6, rays: 0.1,  night: 0,    moon: 0 },
    { t: 840,  warm: [255, 166, 90, 0.34], sx: -1,   near: [255, 170, 98, 0.36],  far: [196, 166, 200, 0.24], glow: [255, 150, 80, 0.32],  shade: [44, 46, 104], sk: 0.4, len: 2.5, rimK: 0.75, sky: [[255, 156, 84], [240, 132, 150], [112, 104, 176]], skyK: 0.6,  path: [255, 196, 120], pathK: 1,   rays: 0.16, night: 0,    moon: 0 },
    { t: 960,  warm: [255, 140, 100, 0.22], sx: -1,   near: [255, 140, 110, 0.4],  far: [150, 132, 192, 0.34], glow: [255, 120, 90, 0.32],  shade: [40, 40, 100], sk: 0.32, len: 3,   rimK: 0.6,  sky: [[255, 130, 90], [210, 110, 150], [90, 90, 170]],    skyK: 0.65, path: [255, 170, 120], pathK: 0.7, rays: 0.08, night: 0.1,  moon: 0 },
    { t: 1080, warm: [220, 140, 160, 0.08], sx: -1,   near: [200, 150, 190, 0.3],  far: [100, 108, 186, 0.42], glow: [230, 130, 140, 0.12], shade: [40, 40, 110], sk: 0.16, len: 2.1, rimK: 0.12, sky: [[210, 120, 140], [110, 100, 180], [55, 65, 135]],    skyK: 0.55, path: [230, 160, 160], pathK: 0.15, rays: 0,   night: 0.45, moon: 0 },
    { t: 1200, warm: [255, 255, 255, 0], sx: -1,   near: N0,                    far: N0,                    glow: [200, 120, 140, 0],    shade: [20, 30, 70],  sk: 0,    len: 2,   rimK: 0,    sky: [[60, 70, 130], [50, 60, 120], [40, 50, 110]],       skyK: 0.35, path: null, pathK: 0, rays: 0, night: 1, moon: 0 },
    { t: 1260, warm: [255, 255, 255, 0], sx: -1,   near: N0,                    far: N0,                    glow: [200, 120, 140, 0],    shade: [20, 30, 70],  sk: 0,    len: 2,   rimK: 0,    sky: [[60, 70, 130], [50, 60, 120], [40, 50, 110]],       skyK: 0.35, path: null, pathK: 0, rays: 0, night: 1, moon: 0.35 },
    { t: 1410, warm: [255, 255, 255, 0], sx: -1,   near: N0,                    far: N0,                    glow: [200, 120, 140, 0],    shade: [20, 30, 70],  sk: 0,    len: 2,   rimK: 0,    sky: [[60, 70, 130], [50, 60, 120], [40, 50, 110]],       skyK: 0.35, path: null, pathK: 0, rays: 0, night: 1, moon: 1 },
    { t: 1560, warm: [255, 255, 255, 0], sx: -1,   near: N0,                    far: N0,                    glow: [200, 120, 140, 0],    shade: [20, 30, 70],  sk: 0,    len: 2,   rimK: 0,    sky: [[60, 70, 130], [50, 60, 120], [40, 50, 110]],       skyK: 0.35, path: null, pathK: 0, rays: 0, night: 1, moon: 0.35 },
    { t: 1620, warm: [255, 180, 180, 0.06], sx: 1,    near: [150, 140, 200, 0.2],  far: [70, 80, 150, 0.3],    glow: [255, 150, 150, 0.12], shade: [40, 40, 110], sk: 0,    len: 2.3,   rimK: 0,    sky: [[200, 140, 170], [100, 100, 170], [50, 60, 130]],    skyK: 0.45, path: [240, 170, 180], pathK: 0.15, rays: 0,   night: 1,    moon: 0 },
    { t: 1700, warm: [255, 176, 150, 0.26], sx: 1,    near: [255, 170, 160, 0.35], far: [120, 120, 190, 0.4],  glow: [255, 170, 150, 0.3],  shade: [56, 56, 120], sk: 0.24, len: 2.5, rimK: 0.5,  sky: [[255, 170, 160], [200, 160, 200], [90, 100, 170]],   skyK: 0.55, path: [255, 200, 180], pathK: 0.7, rays: 0.08, night: 0.4, moon: 0 },
    { t: 1760, warm: [255, 196, 150, 0.3], sx: 1,    near: [255, 196, 160, 0.32], far: [170, 180, 214, 0.26], glow: [255, 200, 150, 0.25], shade: [56, 60, 116], sk: 0.32, len: 2.4, rimK: 0.7,  sky: [[255, 206, 170], [226, 210, 214], [150, 176, 214]],  skyK: 0.45, path: [255, 220, 196], pathK: 0.9, rays: 0.14, night: 0.08,  moon: 0 }
  ];
  var DAY = 1800;
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mixA(a, b, t) { if (!a) return b; if (!b) return a; var o = []; for (var i = 0; i < a.length; i++) o.push(Array.isArray(a[i]) ? mixA(a[i], b[i], t) : lerp(a[i], b[i], t)); return o; }
  function state(t) {
    t = ((t % DAY) + DAY) % DAY; var i, a = KEYS[KEYS.length - 1], b = KEYS[0], ta = a.t - DAY, tb = b.t;
    for (i = 0; i < KEYS.length; i++) { if (KEYS[i].t <= t) { a = KEYS[i]; ta = a.t; b = KEYS[(i + 1) % KEYS.length]; tb = i + 1 < KEYS.length ? b.t : b.t + DAY; } }
    var u = (t - ta) / (tb - ta), s = { t: t }, k; u = u * u * (3 - 2 * u);
    for (k in a) if (k !== 't') s[k] = typeof a[k] === 'number' ? lerp(a[k], b[k], u) : mixA(a[k], b[k], u);
    s.moonX = t >= 1200 && t < 1620 ? 1 - 2 * (t - 1230) / 360 : 0;           // the moon's place across: rising on the right, setting on the left
    return s;
  }
  function rgba(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a + ')'; }
  function hash(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }

  // the sun-side edge of a standing thing lit warm: inside its ink line on the side toward the sun, fading in over four pixels
  function rimPicture(d, w, h, side, col, k) {
    var x, y, i, j, src = new Uint8ClampedArray(d);
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { i = (y * w + x) * 4; if (src[i + 3] < 30) continue;
      var lum = (src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11) / 255; if (lum < 0.16) continue;
      var edge = 0, inkSeen = 0;
      for (j = 1; j <= 60; j++) { if (j > 8 && !inkSeen && j > Math.max(5, Math.round(w / 26)) + 1) break; var xx = x + side * j; if (xx < 0 || xx >= w) { edge = j; break; } var q = (y * w + xx) * 4;
        if (src[q + 3] < 40) { edge = j; break; } var ql = (src[q] * 0.3 + src[q + 1] * 0.59 + src[q + 2] * 0.11) / 255; if (ql < 0.16) { inkSeen++; if (inkSeen > 4) break; continue; } if (inkSeen) break; }
      var dist = edge ? edge - inkSeen : 99, reach = Math.max(5, Math.round(w / 26));
      if (dist > reach) { d[i] = d[i] * (1 - 0.06 * k); d[i + 1] = d[i + 1] * (1 - 0.08 * k); d[i + 2] = Math.min(255, d[i + 2] * (1 - 0.02 * k) + 6 * k); continue; }   // the far side a touch cooler
      var a = k * Math.pow(1 - (dist - 1) / reach, 0.7) * (0.7 + 0.3 * lum);
      d[i] = d[i] + (col[0] - d[i]) * a; d[i + 1] = d[i + 1] + (col[1] - d[i + 1]) * a; d[i + 2] = d[i + 2] + (col[2] - d[i + 2]) * a; }
    return true;
  }

  var C = {};
  function disc(mk, col) { var key = col ? col.map(Math.round).join(',') : 'w'; if (C[key]) return C[key]; var cv = mk(128, 128), g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    if (col) { g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(' + key + ')'; g.fillRect(0, 0, 128, 128); } return (C[key] = cv); }
  function silhouette(L, key, mk) {             // a thing's shape in black at a quarter of its size: drawn up again it is soft at the edge
    var sc = C.sil || (C.sil = {}); if (sc[key]) return sc[key]; var r = L.scene.rects[key], w = Math.max(8, Math.round(r[2] / 4)), h = Math.max(8, Math.round(r[3] / 4)), cv = mk(w, h), g = cv.getContext('2d');
    g.drawImage(L.atlas, r[0], r[1], r[2], r[3], 0, 0, w, h); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, w, h); return (sc[key] = cv);
  }
  function shadowAngle(side) { return side >= 0 ? lerp(0.36, Math.PI - 0.12, Math.min(1, side)) : lerp(0.36, -0.12, Math.min(1, -side)); }   // away from the light: left in the morning, down at noon, right in the evening
  function waterLayer(L, col3, sunX, farX) {
    var W = L.scene.W, H = L.scene.H, cv = C.wl || (C.wl = L.mk(W, H)), g = cv.getContext('2d'); g.globalCompositeOperation = 'copy'; g.drawImage(L.water, 0, 0, W, H); g.globalCompositeOperation = 'source-in';
    var sg = g.createLinearGradient(sunX, 0, farX, 0); sg.addColorStop(0, rgba(col3[0], 1)); sg.addColorStop(0.5, rgba(col3[1], 1)); sg.addColorStop(1, rgba(col3[2], 1)); g.fillStyle = sg; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; return cv;
  }
  function glitter(L, x0, col, k, seed, n, band) {   // a path of light on the water toward x0 (the sun or the moon across the screen)
    var W = L.scene.W, H = L.scene.H, cv = C.gl || (C.gl = L.mk(W, H)), g = cv.getContext('2d'); g.globalCompositeOperation = 'copy'; g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    var t = L.t || 0, sunX = (x0 + 1) / 2 * W, i;
    for (i = 0; i < n; i++) { var u = hash(i, seed), dir = hash(i, seed + 9) < 0.5 ? -1 : 1, x = sunX + dir * Math.pow(u, 1.5) * W * 1.05, y = hash(i, seed + 2) * H;   // over all the water, thickest toward the sun's side
      var tw = 0.5 + 0.5 * Math.sin(t * (2 + 3 * hash(i, seed + 5)) + i), len = 3 + 10 * (1 - u) * hash(i, seed + 3);
      g.fillStyle = rgba(col, k * tw * (0.35 + 0.6 * hash(i, seed + 4)) * (1 - u * 0.75)); g.fillRect(x - len / 2, y, len, 1.4); }
    g.globalCompositeOperation = 'destination-in'; g.drawImage(L.water, 0, 0, W, H); g.globalCompositeOperation = 'source-over'; return cv;
  }
  function draw(ctx, st, L) {
    var W = L.scene.W, H = L.scene.H, mk = L.mk, i, it, r, side = st.sx, sunX = (side + 1) / 2 * W, farX = W - sunX, night = st.night, moon = st.moon;
    if (Math.abs(sunX - farX) < 2) farX = sunX + 1;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.drawImage(L.ground, 0, 0, W, H);
    // the shadows: each thing's own silhouette laid flat on the ground from its foot, away from the sun (by night, faint ones away from the
    // moon), all into one layer tinted once, so where two shadows cross they do not darken twice
    var sk = st.sk + 0.18 * moon * night, ang = shadowAngle(night > 0.6 ? st.moonX : side), len = night > 0.6 ? 2.6 : st.len, shadeCol = night > 0.6 ? [20, 30, 70] : st.shade;
    if (sk > 0.01) { var lay = C.sl || (C.sl = mk(W, H)), lg = lay.getContext('2d'); lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, W, H);
      var kk = 0.5 * len, ckx = kk * Math.cos(ang), cky = kk * Math.sin(ang), px = Math.sin(ang), py = -Math.cos(ang) * 0.75;   // a thing's height runs along the shadow, its width across it (the ground's depth squashed as the camera sees it)
      for (i = 0; i < L.scene.items.length; i++) { it = L.scene.items[i]; var sil = silhouette(L, it.key, mk), fx = it.fx, fy = it.fy;
        lg.setTransform(px, py, -ckx, -cky, fx - px * fx + ckx * fy, fy - py * fx + cky * fy); lg.drawImage(sil, it.x, it.y, it.w, it.h); }
      lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-in'; lg.fillStyle = rgba(shadeCol, 1); lg.fillRect(0, 0, W, H);
      ctx.globalAlpha = sk; ctx.drawImage(lay, 0, 0); ctx.globalAlpha = 1; }
    // the things, each with its lit edge on the sun's side while the sun is low
    var slot = side < 0 ? 1 : 2, rk = st.rimK * Math.min(1, Math.abs(side) * 1.4);
    for (i = 0; i < L.scene.items.length; i++) { it = L.scene.items[i]; r = L.scene.rects[it.key];
      ctx.globalAlpha = 1; ctx.drawImage(L.atlas, r[0], r[1], r[2], r[3], it.x, it.y, it.w, it.h);
      if (rk > 0.01) { ctx.globalAlpha = rk; ctx.drawImage(L.atlas, r[0] + r[2] * slot, r[1], r[2], r[3], it.x, it.y, it.w, it.h); } }
    ctx.globalAlpha = 1;
    // the light across the frame from the sun's side
    var a = Math.max(st.near[3], st.far[3]);
    if (a > 0.005) { var g = ctx.createLinearGradient(sunX, 0, farX, 0); g.addColorStop(0, rgba(st.near, 1)); g.addColorStop(1, rgba(st.far, 1));
      ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = st.near[3]; var g2 = ctx.createLinearGradient(sunX, 0, farX, 0); g2.addColorStop(0, rgba(st.near, 1)); g2.addColorStop(0.6, rgba(st.near, 0)); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); }
    if (st.warm && st.warm[3] > 0.005) { ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = st.warm[3]; ctx.fillStyle = rgba(st.warm, 1); ctx.fillRect(0, 0, W, H); }   // the low sun gilding everything
    if (st.glow[3] > 0.005) { ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 1; var g3 = ctx.createRadialGradient(sunX, H * 0.35, 0, sunX, H * 0.35, W * 0.7); g3.addColorStop(0, rgba(st.glow, st.glow[3])); g3.addColorStop(1, rgba(st.glow, 0)); ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H); }
    // the sky in the water and the sun's path
    if (L.water && st.skyK > 0.005) { var wl = waterLayer(L, st.sky, sunX, farX); ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = st.skyK; ctx.drawImage(wl, 0, 0); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = st.skyK * 0.8; ctx.drawImage(wl, 0, 0); }
    if (L.water && st.path && st.pathK > 0.01) { ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 1; ctx.drawImage(glitter(L, side, st.path, st.pathK, 1, 2200, 110), 0, 0); }
    // shafts of light
    if (st.rays > 0.005) { ctx.globalCompositeOperation = 'screen'; var ox = side < 0 ? -W * 0.1 : W * 1.1, ra = side < 0 ? 0.42 : Math.PI - 0.42, t = L.t || 0;
      for (i = 0; i < 5; i++) { var y = H * (0.05 + 0.2 * i) + Math.sin(t * 0.05 + i * 1.7) * 30, wdt = 50 + 70 * hash(i, 7);
        ctx.save(); ctx.translate(ox, y); ctx.rotate(ra); var gr = ctx.createLinearGradient(0, -wdt, 0, wdt); gr.addColorStop(0, rgba(st.near, 0)); gr.addColorStop(0.5, rgba(st.near, st.rays * (0.6 + 0.4 * Math.sin(t * 0.3 + i)))); gr.addColorStop(1, rgba(st.near, 0));
        ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fillRect(0, -wdt, W * 1.05, wdt * 2); ctx.restore(); } }
    // the night: the game's palette (a little lighter and bluer under the moon), then the moon's path and the stars in the water
    if (night > 0.005) { var mm = 1 - 0.12 * moon; ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 1; ctx.fillStyle = rgba([255 - 222 * night * mm, 255 - 212 * night * mm, 255 - 172 * night * mm], 1); ctx.fillRect(0, 0, W, H);
      if (L.water) { ctx.globalCompositeOperation = 'screen';
        if (moon > 0.02) ctx.drawImage(glitter(L, st.moonX, [205, 218, 244], moon * night, 31, 1800, 70), 0, 0);
        var sc = C.st || (C.st = (function () { var cv = mk(W, H), g = cv.getContext('2d'); for (var n = 0; n < 500; n++) { g.fillStyle = 'rgba(220,230,255,' + (0.3 + 0.6 * hash(n, 51)) + ')'; g.fillRect(hash(n, 52) * W, hash(n, 53) * H, 1.4, 1.4); } g.globalCompositeOperation = 'destination-in'; g.drawImage(L.water, 0, 0, W, H); return cv; })());
        ctx.globalAlpha = night * (1 - 0.6 * moon) * 0.7; ctx.drawImage(sc, 0, 0); } }
    ctx.restore();
  }
  var api = { KEYS: KEYS, state: state, rimPicture: rimPicture, draw: draw, shadowAngle: shadowAngle, silhouette: silhouette };
  if (typeof module !== 'undefined') module.exports = api; else root.Sun = api;
})(this);
