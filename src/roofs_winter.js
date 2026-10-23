// roofs_winter.js: snow on a roof drawn in code (Colin, AD, 2026-10-23; Clive, GD offered the roofs' winter after Robin's notes; the
// blanket read as a blank white sheet). The reference for game.html's roofSnow: the same inputs, composites only (no pixel is read).
//   RoofWinter.draw(cv, info, mk)   cv: the roof's picture (drawn by Build.drawRoof, at twice the world scale); returns a new canvas with the
//                                   snow on, the roof's own picture showing where the snow has slid or the wind scoured the ridge.
//   info = { ns, rx, ry, eave, seed, gables }   ns: the ridge runs north-south (down the screen); rx, ry: the ridge's place in the canvas (Build.ridgeMid,
//                                   times two, less the sprite's corner); eave: the eaves' line at the front (y in the canvas); seed: the room's id; gables: the gable faces' triangles, [[x, y] x 3] each in the canvas (the roof code's 'ga': the eave corners and the ridge's front end), kept clear of snow
// What it does, in order:
//   1. the blanket: the roof's shape in snow, the slope toward the light (up and left, as the game's sun) lit, the other in a blue-grey
//      shade that is deepest under the ridge and lifts toward the eaves (light thrown up off the snow below)
//   2. soft wind streaks down the fall of each slope, white on the lit side, blue on the shaded
//   3. the ridge: a bright crest on the lit side, a cold ink line along it, a wind cornice curling over on the shaded side; the straw
//      showing in a few scoured places along it
//   4. one or two patches near the eaves where the snow has slid, the straw showing with a lumpy edge
//   5. the eaves: the snow's lip hanging a little past the edge with its blue shadow under it, and icicles
//   6. a cold ink edge round the whole blanket, so the roof keeps its line as everything else does
(function (root) {
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function mkOf(mk) { return mk || function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }; }
  var C = { lit: '#f6f8fb', base: '#e9eef5', shade: [176, 192, 218], ink: '#6e7d98', lip: '#f2f5fa', ice: '#d4e3f2' };
  var blobCv = null;
  function blob(mk) { if (blobCv) return blobCv; blobCv = mkOf(mk)(64, 64); var g = blobCv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return blobCv; }
  function tintBlob(mk, col) { var c = mkOf(mk)(64, 64), g = c.getContext('2d'); g.drawImage(blob(mk), 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 64, 64); return c; }
  function cornice(g, ns, at, len, R) {          // the snow the wind has curled over the ridge onto the shaded side: one ragged band, its shadow under it
    var pts = [], i, n = Math.ceil(len / 3); for (i = 0; i <= n; i++) pts.push(2 + 2.2 * Math.abs(Math.sin(i * 0.9 + R() * 0.6)) + R() * 1.2);
    [['rgba(120,138,170,0.5)', 1.4], ['rgba(246,249,252,0.97)', 0]].forEach(function (L) { g.fillStyle = L[0]; g.beginPath();
      if (ns) { g.moveTo(at, 0); for (i = 0; i <= n; i++) g.lineTo(at + pts[i] + L[1], i * 3); g.lineTo(at, len); } else { g.moveTo(0, at); for (i = 0; i <= n; i++) g.lineTo(i * 3, at + pts[i] + L[1]); g.lineTo(len, at); }
      g.closePath(); g.fill(); });
  }
  function draw(cv, info, mk) {
    mk = mkOf(mk); var W = cv.width, H = cv.height, R = rng((info.seed || 1) * 7 + 3), i, ns = !!info.ns, rx = info.rx, ry = info.ry, eave = info.eave || H * 0.86;
    // 1. the blanket, in its two slopes
    var sn = mk(W, H), g = sn.getContext('2d');
    g.drawImage(cv, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = C.base; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-atop';
    if (info.gables) { g.globalCompositeOperation = 'destination-out'; info.gables.forEach(function (t) { g.beginPath(); g.moveTo(t[0][0], t[0][1]); g.lineTo(t[1][0], t[1][1]); g.lineTo(t[2][0], t[2][1]); g.closePath(); g.fill(); }); g.globalCompositeOperation = 'source-atop'; }   // the gable's face stays as it is: snow lies on slopes, not on a wall
    var sh = C.shade, gr;
    if (ns) { gr = g.createLinearGradient(rx - 2, 0, W, 0); gr.addColorStop(0, 'rgba(' + sh + ',0.95)'); gr.addColorStop(0.5, 'rgba(' + sh + ',0.75)'); gr.addColorStop(1, 'rgba(' + sh + ',0.5)'); g.fillStyle = gr; g.fillRect(rx, 0, W - rx, H);
      gr = g.createLinearGradient(rx, 0, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0.35)'); g.fillStyle = gr; g.fillRect(0, 0, rx, H); }
    else { gr = g.createLinearGradient(0, ry - 2, 0, eave); gr.addColorStop(0, 'rgba(' + sh + ',0.85)'); gr.addColorStop(0.55, 'rgba(' + sh + ',0.58)'); gr.addColorStop(1, 'rgba(' + sh + ',0.34)');   // (lighter on the big front slope: by day bright) g.fillStyle = gr; g.fillRect(0, ry, W, H - ry);
      gr = g.createLinearGradient(0, ry, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0.4)'); g.fillStyle = gr; g.fillRect(0, 0, W, ry); }
    // 1b. the roof's courses showing faintly through the snow (it lies in ridges over the thatch): the roof's own picture greyed, lifted, multiplied in
    var tx = mk(W, H), tg = tx.getContext('2d'); tg.drawImage(cv, 0, 0); tg.globalCompositeOperation = 'saturation'; tg.fillStyle = '#808080'; tg.fillRect(0, 0, W, H);
    tg.globalCompositeOperation = 'screen'; tg.fillStyle = 'rgba(255,255,255,0.74)'; tg.fillRect(0, 0, W, H); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(sn, 0, 0);   // (kept to the snow: not on the gable)
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.32; g.drawImage(tx, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-atop';
    // 2. wind streaks down each slope
    var wb = tintBlob(mk, '#ffffff'), bb = tintBlob(mk, 'rgb(150,168,200)'), n = Math.round(W * H / 900);
    for (i = 0; i < n; i++) { var x = R() * W, y = R() * H, lit = ns ? x < rx : y < ry, L = 14 + R() * 30, T2 = 3 + R() * 3; g.globalAlpha = lit ? 0.35 : 0.22;
      if (ns) g.drawImage(lit ? wb : bb, x - L / 2, y - T2 / 2, L, T2); else g.drawImage(lit ? wb : bb, x - T2 / 2, y - L / 2, T2, L); }
    g.globalAlpha = 1;
    // 3. the ridge: crest, ink line, cornice
    g.globalCompositeOperation = 'source-atop';
    if (ns) { g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(rx - 3.5, 0, 3, H); g.fillStyle = C.ink; g.fillRect(rx - 0.6, 0, 1.4, H);
      cornice(g, true, rx, H, R); }
    else { g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(0, ry - 3.5, W, 3); g.fillStyle = C.ink; g.fillRect(0, ry - 0.6, W, 1.4);
      cornice(g, false, ry, W, R); }
    g.globalCompositeOperation = 'source-over';
    // 3b, 4. the straw showing: scoured along the ridge, slid near the eaves (cut out of the blanket; the roof shows through)
    g.globalCompositeOperation = 'destination-out';
    var k = 1 + Math.floor(R() * 2);
    for (i = 0; i < k; i++) { var t = 0.15 + R() * 0.7, lx = ns ? rx + (R() - 0.5) * 6 : W * t, ly = ns ? H * t : ry + (R() - 0.5) * 5, ll = 8 + R() * 14;
      g.globalAlpha = 0.85; if (ns) g.drawImage(blob(mk), lx - 3, ly - ll / 2, 6, ll); else g.drawImage(blob(mk), lx - ll / 2, ly - 3, ll, 6); }
    var s2 = 1 + Math.floor(R() * 2);
    for (i = 0; i < s2; i++) { var px = W * (0.18 + R() * 0.64), py = ns ? H * (0.3 + R() * 0.5) : eave - 10 - R() * 12, rr = 11 + R() * 7, j;
      if (ns && px < rx) px = rx + (W - rx) * (0.3 + R() * 0.5);   // on the shaded slope, where it slides first
      for (j = 0; j < 7; j++) { g.globalAlpha = 1; g.beginPath(); g.ellipse(px + (R() - 0.5) * rr * 1.4, py + (R() - 0.5) * rr * 0.6, rr * (0.45 + R() * 0.5), rr * (0.3 + R() * 0.3), 0, 0, 7); g.fill(); } }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // 5, 6. lay it: the cold ink edge, the lip's shadow and the lip, the blanket, the icicles
    var out = mk(W, H), o = out.getContext('2d');
    o.drawImage(cv, 0, 0);                                                   // the roof under it (it shows in the scoured and slid places)
    var inkC = mk(W, H), ig = inkC.getContext('2d'); ig.drawImage(sn, 0, 0); ig.globalCompositeOperation = 'source-in'; ig.fillStyle = C.ink; ig.fillRect(0, 0, W, H);
    // the lip, its shadow and the icicles hang from an eave only: an ew roof's front edge is an eave; an ns roof's front is its gable end,
    // with no eave over it, so none of them there (2026-10-23, Robin: "Some weird lines and boxes in the snow, look below the houses": the
    // shadow ran as one straight band right across the gable wall)
    var eaveFront = !ns;
    if (eaveFront) {                                                         // the shadow: soft, short, following the lip's own edge, only below the eave
      var shC = mk(W, H), sg = shC.getContext('2d');
      for (i = 1; i <= 5; i++) { sg.globalAlpha = 0.22; sg.drawImage(sn, (i - 3) * 0.5, i * 1.1); }
      sg.globalAlpha = 1; sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgb(70,84,118)'; sg.fillRect(0, 0, W, H);
      sg.globalCompositeOperation = 'destination-out'; sg.drawImage(sn, 0, 0); sg.fillRect(0, 0, W, eave - 2);   // not on the snow, not above the eave
      o.globalAlpha = 0.6; o.drawImage(shC, 0, 2); o.globalAlpha = 1;
    }
    [[-1.2, 0], [1.2, 0], [0, -1.2], [0, 1.2], [0.9, 0.9], [-0.9, 0.9], [0.9, -0.9], [-0.9, -0.9]].forEach(function (d) { if (eaveFront) o.drawImage(inkC, d[0], d[1] + 2.5); o.drawImage(inkC, d[0], d[1]); });   // the cold edge, round the lip and the blanket
    if (eaveFront) { var lipC = mk(W, H), lg = lipC.getContext('2d'); lg.drawImage(sn, 0, 0); lg.globalCompositeOperation = 'source-in'; lg.fillStyle = C.lip; lg.fillRect(0, 0, W, H);
      for (i = 0; i < 5; i++) o.drawImage(lipC, (i - 2) * 0.6, 1 + i * 0.4 + R() * 0.8); }   // the lip: the blanket hung a little past the eave
    o.drawImage(sn, 0, 0);
    // icicles along the front eave (an ew roof only)
    var ix0 = W * 0.08, ix1 = eaveFront ? W * 0.92 : 0, step = 10;
    for (var x2 = ix0; x2 < ix1; x2 += step * (0.6 + R() * 0.8)) { if (R() < 0.5) continue; var len = 4 + R() * 9 * (R() < 0.2 ? 1.7 : 1), ey = eave + 10;   // from the lip's edge (the thatch's cut ends hang below the eave line, and the snow over them)
      o.fillStyle = C.ice; o.beginPath(); o.moveTo(x2 - 1.4, ey); o.lineTo(x2 + 1.4, ey); o.lineTo(x2 + 0.2, ey + len); o.closePath(); o.fill();
      o.strokeStyle = 'rgba(110,125,152,0.8)'; o.lineWidth = 0.6; o.stroke(); o.fillStyle = 'rgba(255,255,255,0.9)'; o.fillRect(x2 - 0.6, ey + 0.5, 0.7, len * 0.5); }
    return out;
  }
  var api = { draw: draw, COLOURS: C };
  if (typeof module !== 'undefined') module.exports = api; else root.RoofWinter = api;
})(this);
