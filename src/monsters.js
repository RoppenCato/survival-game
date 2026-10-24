/* The world's monsters (2026-10-24, Robin: "a scene to showcase the Kraken ... a separate editor for World monsters"): the kraken as a
   field of arms over the open sea with the head that rises among them, from Colin, AD's set pieces (out/kraken, 2026-10-21: 22 pieces
   with their marks: origin, the water cuts, the eyes) and his recipe (tools/kraken_scene.js): the shadow under the water at the origin,
   foam boiled at the cuts, the eyes a cold glow, the sea darkened under the field, everything drawn back to front by its origin. The
   field, its clock and its numbers are mine; where it lives and what the meeting costs are the game's, not built. No browser globals
   at load; the page gives the pictures. */
var Monsters = (function () {
  var K = 0.75, M = 21.74, PX = 3;                           /* M: units a metre (a unit is 4.6 cm); PX: the pieces' pixels a unit at 65 px a metre */
  var DEF = { arms: 6, spacing: 28, cycle: 20, dark: 0.2, darkUp: 0.42, riseT: 12, roarT: 3, spread: 1.0 };   /* the field (mine): arms, their spacing in metres, the rise-and-sink cycle in seconds, the sea's dark under the field and with the head up, the head's rise in seconds, the rearing's time */
  var SHAPES = ['arm_rise_a', 'arm_rise_b', 'arm_rise_c', 'arm_lean', 'arm_tip', 'arm_rise_a', 'arm_rise_b', 'arm_arch', 'arm_coil'];
  function rng(seed) { var s = (seed | 0) % 2147483647 || 7; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function make(spec, cx, cy, seed) {                        /* the field round (cx, cy) on the open sea: arms on a loose ring, each its own shape, turn, clock and phase */
    var o = {}, k; for (k in DEF) o[k] = DEF[k]; for (k in spec || {}) if (spec[k] != null) o[k] = spec[k];
    var R = rng(seed || 7), arms = [], n = Math.max(1, Math.round(o.arms)), i;
    for (i = 0; i < n; i++) { var a = (i + 0.5) / n * 6.2832 + (R() - 0.5) * 0.9, r = o.spacing * M * o.spread * (0.55 + R() * 0.75) * (n > 3 ? 1 : 0.6); var shape = SHAPES[Math.floor(R() * SHAPES.length)];
      arms.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.75, shape: shape, flip: R() < 0.5, ph: R(), cycle: o.cycle * (0.75 + R() * 0.5), surface: shape === 'arm_arch' || shape === 'arm_coil', lvl: 0 }); }
    return { x: cx, y: cy, arms: arms, head: { x: cx, y: cy + 10, k: 0, want: 0, roar: 0, roarK: 0 }, spec: o, t: 0 };
  }
  function tick(F, dt) {
    F.t += dt; var o = F.spec, i;
    for (i = 0; i < F.arms.length; i++) { var A = F.arms[i]; A.ph += dt / A.cycle; A.lvl = 0.5 - 0.5 * Math.cos(A.ph * 6.2832); }
    var H = F.head, want = H.want ? 1 : 0; if (H.k !== want) { H.k += Math.max(-dt / o.riseT, Math.min(dt / o.riseT, want - H.k)); }
    if (H.roar > 0) { H.roar -= dt; H.roarK = Math.min(1, H.roarK + dt / (o.roarT * 0.45)); } else H.roarK = Math.max(0, H.roarK - dt / (o.roarT * 0.55));
  }
  function armPiece(A) {                                     /* the picture for the arm's level: sunk, half, whole; the surface pieces fade in and out instead */
    if (A.surface) return { name: A.shape, alpha: Math.max(0, Math.min(1, (A.lvl - 0.15) / 0.4)) };
    if (A.shape === 'arm_tip') return { name: A.lvl < 0.45 ? 'arm_tip_s4' : 'arm_tip', alpha: A.lvl < 0.1 ? A.lvl / 0.1 : 1 };
    return { name: A.shape + (A.lvl < 0.3 ? '_s8' : A.lvl < 0.62 ? '_s4' : ''), alpha: A.lvl < 0.08 ? A.lvl / 0.08 : 1 };
  }
  function headPiece(H) {
    if (H.roarK > 0.02 && H.k > 0.85) return { name: H.roarK < 0.35 ? 'head_roar1_0' : H.roarK < 0.7 ? 'head_roar2_0' : 'head_roar_0', alpha: 1 };
    if (H.k < 0.12) return null; var k = H.k;
    return { name: k < 0.3 ? 'head_9' : k < 0.5 ? 'head_6' : k < 0.68 ? 'head_4' : k < 0.86 ? 'head_2' : 'head_0', alpha: k < 0.2 ? (k - 0.12) / 0.08 : 1 };
  }
  var FOAM = {};
  function foamOf(name, P, mk) {                              /* the foam at the cuts baked once a piece, in its own pixels: a soft mound at each cut and a wash under it (Colin, AD's recipe) */
    if (FOAM[name]) return FOAM[name]; var J = P.J, im = P.img, w = im.naturalWidth || im.width, h = im.naturalHeight || im.height; if (!w) return null;
    var cv = mk(w, h + 40), c = cv.getContext('2d'), grid = {}, pts = [], i;
    for (i = 0; i < J.water.length; i++) { var q = J.water[i], key = Math.round(q[0] / 4) + ',' + Math.round(q[1] / 4); if (!grid[key]) { grid[key] = 1; pts.push(q); } }
    for (i = 0; i < pts.length; i++) { var x = pts[i][0], y = pts[i][1], m = 0.35 + 0.65 * Math.abs(Math.sin(x * 0.031 + 1.3)) * Math.pow(Math.abs(Math.sin(x * 0.011 + 0.4)), 0.5), hh = Math.max(1, (7 + 9 * Math.abs(Math.sin(x * 0.07)) + 6 * Math.abs(Math.sin(x * 0.23))) * m * 1.4);
      var g = c.createRadialGradient(x, y, 0, x, y, hh); g.addColorStop(0, 'rgba(238,244,240,' + (0.8 * m).toFixed(3) + ')'); g.addColorStop(0.5, 'rgba(230,240,238,' + (0.35 * m).toFixed(3) + ')'); g.addColorStop(1, 'rgba(230,240,238,0)'); c.fillStyle = g; c.fillRect(x - hh, y - hh, 2 * hh, 2 * hh);
      var wg = c.createLinearGradient(x, y, x, y + 3 * hh); wg.addColorStop(0, 'rgba(225,238,236,' + (0.22 * m).toFixed(3) + ')'); wg.addColorStop(1, 'rgba(225,238,236,0)'); c.fillStyle = wg; c.fillRect(x - 2, y, 4, 3 * hh); }
    return (FOAM[name] = cv);
  }
  function rings(c, x, y, r0, n, a, t) {                      /* swell spreading from a body: pale crests with a dark trough, a little out of round, breathing with t */
    c.save(); c.lineCap = 'round'; var k;
    for (k = 0; k < n; k++) { var r = r0 * (1.15 + k * 0.5 + 0.06 * Math.sin(t * 0.7 + k)), al = a * (1 - k / (n + 0.6));
      c.strokeStyle = 'rgba(8,20,40,' + (al * 0.4).toFixed(3) + ')'; c.lineWidth = 3.2; c.beginPath(); c.ellipse(x, y, r - 2.5, (r - 2.5) * 0.55, 0, 0, 6.2832); c.stroke();
      c.strokeStyle = 'rgba(238,245,243,' + (al * 0.45).toFixed(3) + ')'; c.lineWidth = 2.2; c.beginPath(); c.ellipse(x, y, r, r * 0.55, 0, 0, 6.2832); c.stroke(); }
    c.restore();
  }
  function piece(c, name, x, y, alpha, IMG, mk, t, opts) {   /* the piece with its origin (its root on the water) at (x, y) in screen-K space, at the game's scale */
    var P = IMG[name]; if (!P || !P.img || !(P.img.naturalWidth || P.img.width)) return false; var J = P.J, s = (65 / (J.ppm || 65)) / PX, ox = J.origin[0], oy = J.origin[1], X = x - ox * s, Y = y - oy * s, w = (P.img.naturalWidth || P.img.width) * s, h = (P.img.naturalHeight || P.img.height) * s;
    opts = opts || {}; var R0 = (opts.shadow || 9) * M * 0.9, RF = (opts.foot || 3) * M * 0.9;
    c.save(); c.globalAlpha = alpha; if (opts.flip) { c.translate(x, 0); c.scale(-1, 1); c.translate(-x, 0); }   /* (a mirrored arm: the picture turned about its origin) */
    var g = c.createRadialGradient(x, y, 0, x, y, R0); g.addColorStop(0, 'rgba(8,18,34,0.30)'); g.addColorStop(0.6, 'rgba(8,18,34,0.21)'); g.addColorStop(1, 'rgba(8,18,34,0)'); c.save(); c.translate(x, y); c.scale(1, 0.5); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - R0, y - R0, 2 * R0, 2 * R0); c.restore();
    if (opts.rings) rings(c, x, y, RF, opts.rings, 0.5, t);
    c.drawImage(P.img, X, Y, w, h);
    var fm = foamOf(name, P, mk); if (fm) { c.globalAlpha = alpha * (0.85 + 0.15 * Math.sin(t * 2.1 + x * 0.01)); c.drawImage(fm, X, Y, w, fm.height * s); c.globalAlpha = alpha; }
    if (J.eyes) for (var i = 0; i < J.eyes.length; i++) { var ex = X + J.eyes[i][0] * s, ey = Y + J.eyes[i][1] * s, gr = (opts.glow || 60) * s * PX; c.globalCompositeOperation = 'lighter'; var eg = c.createRadialGradient(ex, ey, 0, ex, ey, gr); eg.addColorStop(0, 'rgba(200,220,215,0.3)'); eg.addColorStop(1, 'rgba(200,220,215,0)'); c.fillStyle = eg; c.fillRect(ex - gr, ey - gr, 2 * gr, 2 * gr); var eg2 = c.createRadialGradient(ex, ey, 0, ex, ey, 12 * s * PX); eg2.addColorStop(0, 'rgba(240,248,245,0.5)'); eg2.addColorStop(1, 'rgba(240,248,245,0)'); c.fillStyle = eg2; c.fillRect(ex - 40, ey - 40, 80, 80); c.globalCompositeOperation = 'source-over'; }
    c.restore(); return true;
  }
  function items(F, IMG, mk, list) {                          /* what the field draws, as items sorted by their place on the water (the page adds the ship and sorts) */
    var i; for (i = 0; i < F.arms.length; i++) (function (A) { var p = armPiece(A); if (!p || p.alpha <= 0.01) return; list.push({ y: A.y, f: function (c) { piece(c, p.name, A.x, A.y * K, p.alpha, IMG, mk, F.t, { rings: A.surface ? 1 : 2, shadow: A.shape === 'arm_tip' ? 5 : A.shape === 'arm_arch' ? 12 : 9, flip: A.flip }); } }); })(F.arms[i]);
    var hp = headPiece(F.head); if (hp && hp.alpha > 0.01) list.push({ y: F.head.y, f: function (c) { piece(c, hp.name, F.head.x, F.head.y * K, hp.alpha, IMG, mk, F.t, { shadow: 16, foot: 12, rings: 3, glow: 90 }); } });
    return list;
  }
  function darken(c, F, cam, hw, hh) {                         /* the sea darkened under the field, more with the head up (a multiply over the water, in screen-K space) */
    var o = F.spec, a = o.dark + (o.darkUp - o.dark) * F.head.k; if (a <= 0.005) return; var R = o.spacing * M * o.spread * 1.9 + 120;
    c.save(); c.globalCompositeOperation = 'multiply'; var g = c.createRadialGradient(F.x, F.y * K, R * 0.3, F.x, F.y * K, R); g.addColorStop(0, 'rgba(58,74,96,' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(58,74,96,0)'); c.fillStyle = g; c.translate(F.x, F.y * K); c.scale(1, 0.7); c.translate(-F.x, -F.y * K); c.fillRect(F.x - R, F.y * K - R, 2 * R, 2 * R); c.restore();
  }
  function need(F) {                                           /* the pictures the field wants now (the page loads them lazily) */
    var out = {}, i; for (i = 0; i < F.arms.length; i++) { var p = armPiece(F.arms[i]); if (p) out[p.name] = 1; var b = F.arms[i].shape; out[b] = 1; if (!F.arms[i].surface) { out[b + '_s4'] = 1; if (b !== 'arm_tip') out[b + '_s8'] = 1; } }
    if (F.head.want || F.head.k > 0) ['head_9', 'head_6', 'head_4', 'head_2', 'head_0', 'head_roar1_0', 'head_roar2_0', 'head_roar_0'].forEach(function (n) { out[n] = 1; });
    return out;
  }
  return { DEF: DEF, SHAPES: SHAPES, make: make, tick: tick, items: items, darken: darken, need: need, armPiece: armPiece, headPiece: headPiece, M: M };
})();
if (typeof module !== 'undefined') module.exports = Monsters;
