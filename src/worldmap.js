/* WorldMap: the world map on M (Colin, AD's, settled by Robin on 2026-10-25: "Remove those lil peaks that show everywhere and we are
   done"; his out/world_map, the picker's source lifted here). A watercolour chart on golden vellum in the game's oak panel: a blue sea
   with shallows and two ripple lines, inked coasts, sponged land, darker woods with tree marks, the fells as a pooled ochre wash, the
   villages drawn from memory as little house clusters, winding tracks between them, names that never overlap, the island's name in a
   cartouche close in. What you know: the islands you have sailed to (with the sea round them), the water you have sailed over, your own
   zone; islands you are told of as faint pencil marks; an island reached fades in the next time the map opens.

   WorldMap.create(env) -> map. env: { chart() a canvas a tile a pixel (w.chart(GW)), TW, TH, isles [{ x, y, r }], waters [{ cx, cy, r, dir,
   ring }], villages [{ tx, ty, w, h, arch, name, ends [[x, y]], jetty { tiles, root } }], caves [{ kind, x, y }], home { x, y }, steading { x, y },
   shelters [[x, y]], seasonText() }, all in tiles. The map paints its tiles on timers (a page in the background gets few frames), so it is
   ready a moment after it is first opened; map.view is its 1200 by 750 canvas. No browser globals at load. */
var WorldMap = (function () {
  'use strict';
  var SETTINGS = { paper: '#e7d39d', mottle: 0.37, burn: 0.8, sea: '#51a2c2', wash: 0.62, streak: 0.29, shallows: 0.38, shallowCol: '#c4e4da', ripples: 2, rippleStr: 0.45, rippleCol: '#346270',
    landDark: '#46703a', landMid: '#789e46', landLight: '#c0c460', sponge: 1, warm: 0.67, pool: 1, inkCol: '#30281c', inkW: 0.222, inkStr: 0.85, iconSize: 0.8, labelSize: 13, regionA: 0.45, bigName: 0.63, compass: 1, trees: 0.61,
    areas: 0.66, beachCol: '#dcc792', woodDark: 0.6, areaNames: 0.6, fogReach: 70, toldIcons: 0.25, toldLine: 0.38, zoneAuto: 1, iconGrow: 1, nameCull: 1, treeGap: 10, roads: 1, tracks: 1, roofs: 1, zoneTitle: 1, roadCol: '#dcc898', sailReach: 45, fadeSecs: 2.2 };
  var RANK = { seat: 6, village: 5, church: 4, small: 3, fishing: 2, farmstead: 1, ruin: 0 };
  var FONT = 'Alegreya, Georgia, serif';
  var ICONS = ['flag', 'cross', 'star', 'skull', 'anchor', 'house', 'tent', 'fish', 'chest', 'eye'];
  // ---- helpers
  function hash(x, y) { var h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function vnoise(x, y) { var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); var a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, y, o) { var s = 0, a = 0.5, f = 1, n = 0; for (var i = 0; i < o; i++) { s += vnoise(x * f + i * 17.3, y * f - i * 9.1) * a; n += a; a *= 0.5; f *= 2; } return s / n; }
  function sm(a, b, x) { var t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function blur(src, w, h, r, it) { r = Math.max(1, Math.round(r)); var a = Float32Array.from(src), b = new Float32Array(src.length), d = 2 * r + 1, x, y, s, o;
    for (var k = 0; k < it; k++) {
      for (y = 0; y < h; y++) { o = y * w; s = 0; for (x = -r; x <= r; x++) s += a[o + (x < 0 ? 0 : x >= w ? w - 1 : x)]; for (x = 0; x < w; x++) { b[o + x] = s / d; var xa = x + r + 1, xs = x - r; s += a[o + (xa >= w ? w - 1 : xa)] - a[o + (xs < 0 ? 0 : xs)]; } }
      for (x = 0; x < w; x++) { s = 0; for (y = -r; y <= r; y++) s += b[(y < 0 ? 0 : y >= h ? h - 1 : y) * w + x]; for (y = 0; y < h; y++) { a[y * w + x] = s / d; var ya = y + r + 1, ys = y - r; s += b[(ya >= h ? h - 1 : ya) * w + x] - b[(ys < 0 ? 0 : ys) * w + x]; } }
    }
    return a;
  }
  function stem(n) { var m = /^(.*?)(stun|tun|sey|ey|sgard|gard|slund|lund|sborg|borg|sstad|stad|smark|mark|sdal|dal|sheim|heim|shavn|havn|ssund|sund)$/.exec(n); return m ? m[1] : n; }
  function spline(pts, per) { var out = []; for (var i = 0; i < pts.length - 1; i++) { var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var k = 0; k < per; k++) { var t = k / per, t2 = t * t, t3 = t2 * t; out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
    out.push(pts[pts.length - 1]); return out; }
  function simplify(pts, tol) { if (pts.length < 3) return pts; var a = pts[0], b = pts[pts.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, md = 0, mi = 0;
    for (var i = 1; i < pts.length - 1; i++) { var d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L; if (d > md) { md = d; mi = i; } }
    return md > tol ? simplify(pts.slice(0, mi + 1), tol).slice(0, -1).concat(simplify(pts.slice(mi), tol)) : [a, b]; }

  function create(env) {
    var S = Object.assign({}, SETTINGS, env.settings || {}), TW = env.TW, TH = env.TH, ISLES = env.isles.map(function (q, i) { return { i: i, x: q.x, y: q.y, r: q.r, water: q.water, name: null }; });
    var VP = { x: 58, y: 37, w: 1084, h: 676 }, LEVELS = [0.25, 0.5, 1, 2, 4], TILE = 256, ZMAX = 3;
    var SY0 = -200, SY1 = TH + 284, SW = (SY1 - SY0) * VP.w / VP.h, SX0 = TW / 2 - SW / 2, SX1 = TW / 2 + SW / 2;
    var KNOW = new Int8Array(ISLES.length), HERE = -1, hero = { x: env.home.x, y: env.home.y, face: -Math.PI / 2 }, ship = null, OWN = [], GOAL = null;
    var K, WARM, ISLE, G, HG, TARN, FEATS = [], RENAMED = {}, MARKS = [], LABELS = [], HOVER = null, MARKER = null, HEARD = {}, AREAS = [], ROADS = [], CURV = null, PL = null, ready = false, preparing = false, err = null;
    var view = null, vg = null, bloomCv = null, BLOOM = null, TILES = new Map(), paintedKey = null, gen = 0, queue = [], working = false, dirty = true, trailPts = [];
    var cx = (SX0 + SX1) / 2, cy = (SY0 + SY1) / 2 + 40, z = 0;
    function zFit() { return Math.min(VP.w / (SX1 - SX0), VP.h / (SY1 - SY0)); }
    function clampView() { z = clamp(z, zFit(), ZMAX); var hw = VP.w / 2 / z, hh = VP.h / 2 / z; cx = clamp(cx, SX0 + hw, Math.max(SX0 + hw, SX1 - hw)); cy = clamp(cy, SY0 + hh, Math.max(SY0 + hh, SY1 - hh)); }
    function toS(X, Y) { return [VP.x + VP.w / 2 + (X - cx) * z, VP.y + VP.h / 2 + (Y - cy) * z]; }
    function toW(sx, sy) { return [cx + (sx - VP.x - VP.w / 2) / z, cy + (sy - VP.y - VP.h / 2) / z]; }

    // ---- the chart read once: each tile's kind (0 sea, 1 beach, 2 meadow, 3 wood, 4 fell, 5 snow), its warmth, its island
    function readChart() {
      var c = env.chart(), g = c.getContext('2d'), d = g.getImageData(0, 0, TW, TH).data, i, x, y, q;   /* (the chart is a canvas the game makes: safe to read from file://) */
      K = new Uint8Array(TW * TH); WARM = new Uint8Array(TW * TH); ISLE = new Int8Array(TW * TH).fill(-1); HG = new Uint8Array(TW * TH); TARN = new Uint8Array(TW * TH);
      for (i = 0; i < TW * TH; i++) {
        var r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2], k;
        if (Math.abs(r - 36) + Math.abs(gg - 100) + Math.abs(b - 124) < 30) continue;
        if (r > 225 && gg > 195 && b < 160) k = 1; else if (r > 220 && gg > 230) k = 5; else if (b > gg + 12 && b > r + 40) { TARN[i] = 1; continue; }   /* a tarn stays water: only a truly blue tile (the cliffs' bluish greys are not water) */
        else if ((Math.abs(r - gg) < 24 && Math.abs(gg - b) < 28) || (r > 120 && gg > 150 && b > 90 && Math.abs(r - 132) < 20 && b > 92)) k = 4;
        else { var tg = Math.max(0, (r - 96) / 54), tf = Math.max(0, (r - 78) / 72); k = Math.abs(gg - (146 + 4 * tf)) < Math.abs(gg - (168 - 18 * tg)) ? 3 : 2; WARM[i] = clamp(Math.round(Math.max(tg, tf) * 255), 0, 255); }
        K[i] = k;
        if (k === 5) HG[i] = 240; else if (k === 4) { var near = function (a, bb, cc) { return Math.abs(r - a) + Math.abs(gg - bb) + Math.abs(b - cc) < 26; }; HG[i] = near(128, 170, 96) ? 80 : near(150, 162, 122) ? 160 : near(88, 84, 96) ? 150 : 110; }
      }
      for (y = 0; y < TH; y++) for (x = 0; x < TW; x++) { i = y * TW + x; if (!K[i]) continue; var best = 1e9, bi = -1; for (q = 0; q < ISLES.length; q++) { var s = ISLES[q], dd = Math.hypot(x - s.x, y - s.y) - s.r; if (dd < best) { best = dd; bi = q; } } ISLE[i] = bi; }
      var gw = Math.ceil(TW / 4), gh = Math.ceil(TH / 4), L = new Float32Array(gw * gh), GI = new Int8Array(gw * gh).fill(-1), FC = new Float32Array(gw * gh), xx, yy, X, Y;
      for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) { var n = 0, nf = 0, isle = -1; for (yy = 0; yy < 4; yy++) for (xx = 0; xx < 4; xx++) { X = x * 4 + xx; Y = y * 4 + yy; if (X < TW && Y < TH) { var kk = K[Y * TW + X]; if (kk) { n++; isle = ISLE[Y * TW + X]; } if (kk === 4 || kk === 5) nf++; } } L[y * gw + x] = n / 16; GI[y * gw + x] = isle; FC[y * gw + x] = nf / 16; }
      G = { w: gw, h: gh, L: L, GI: GI, FM: blur(FC, gw, gh, 5, 3), FC: blur(FC, gw, gh, 1, 1), H8: blur(L, gw, gh, 6, 2), H16: blur(L, gw, gh, 12, 2), fogKey: null, SB: null, TR: new Float32Array(gw * gh), TB: new Float32Array(gw * gh) };
    }
    // ---- the places, the islands' and the areas' names (Colin, AD's areas.js: placeholders for Alistair, LD, LORE?), the tracks (his roads.js)
    function isleOf(x, y) { var best = 1e9, bi = -1; ISLES.forEach(function (q) { var dd = Math.hypot(x - q.x, y - q.y) - q.r; if (dd < best) { best = dd; bi = q.i; } }); return bi; }
    function makePlaces() {
      PL = { villages: env.villages, caves: env.caves, home: env.home, steading: env.steading, shelters: env.shelters || [] };
      var vill = PL.villages.map(function (v) { var o = { name: v.name, arch: v.arch, x: v.tx + v.w / 2, y: v.ty + v.h / 2 }; o.isle = isleOf(o.x, o.y); return o; });
      ISLES.forEach(function (q) { var vs = vill.filter(function (v) { return v.isle === q.i; }).sort(function (a, b) { return RANK[b.arch] - RANK[a.arch]; }); q.name = vs.length ? (stem(vs[0].name) + 'sey').replace(/ssey$/, 'sey') : null; });
      var S4 = 4, GW = Math.ceil(TW / S4), GH = Math.ceil(TH / S4), GG = new Uint8Array(GW * GH), x, y, xx, yy;
      for (y = 0; y < GH; y++) for (x = 0; x < GW; x++) { var cnt = [0, 0, 0, 0, 0, 0]; for (yy = 0; yy < S4; yy++) for (xx = 0; xx < S4; xx++) { var X = x * S4 + xx, Y = y * S4 + yy; if (X < TW && Y < TH) cnt[K[Y * TW + X]]++; } var bk = 0; for (var k = 1; k < 6; k++) if (cnt[k] > cnt[bk] * (k === 1 ? 0.6 : 1)) bk = k; GG[y * GW + x] = bk === 5 ? 4 : bk; }
      var seen = new Int32Array(GW * GH).fill(-1), areas = [];
      for (var i0 = 0; i0 < GW * GH; i0++) {
        var kd = GG[i0]; if (!kd || seen[i0] >= 0) continue; var st = [i0]; seen[i0] = i0; var n = 0, sx = 0, sy = 0, cells = [];
        while (st.length) { var ii = st.pop(); n++; var px = ii % GW, py = (ii / GW) | 0; sx += px; sy += py; cells.push(ii); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) { var X2 = px + dd[0], Y2 = py + dd[1]; if (X2 < 0 || Y2 < 0 || X2 >= GW || Y2 >= GH) return; var j = Y2 * GW + X2; if (seen[j] < 0 && GG[j] === kd) { seen[j] = i0; st.push(j); } }); }
        var tiles = n * S4 * S4, min = { 1: 260, 2: 2500, 3: 1100, 4: 600 }[kd]; if (tiles < min) continue;
        var mx = sx / n, my = sy / n, bc = cells[0], bd = 1e9; cells.forEach(function (c) { var dd = Math.hypot(c % GW - mx, ((c / GW) | 0) - my); if (dd < bd) { bd = dd; bc = c; } });
        var AX = (bc % GW) * S4 + S4 / 2, AY = ((bc / GW) | 0) * S4 + S4 / 2, ai = isleOf(AX, AY), near = vill.filter(function (v) { return v.isle === ai; }).sort(function (a, b) { return Math.hypot(a.x - AX, a.y - AY) - Math.hypot(b.x - AX, b.y - AY); })[0];
        var who = near ? stem(near.name).replace(/s$/, '') + "'s " : 'The ', word = { 1: 'Strand', 2: near ? 'Fields' : 'Meadows', 3: 'Wood', 4: 'Fell' }[kd];
        areas.push({ kind: ['sea', 'beach', 'meadow', 'wood', 'fell'][kd], name: kd === 2 && near ? near.name + ' ' + word : (kd === 4 && !near ? 'The Fell' : who + word), x: Math.round(AX), y: Math.round(AY), tiles: tiles, isle: ai });   /* LORE? the areas' names */
      }
      var by = {}; AREAS = []; areas.sort(function (a, b) { return b.tiles - a.tiles; }).forEach(function (a) { var key = a.isle + a.kind; by[key] = (by[key] || 0) + 1; if (by[key] <= (a.kind === 'wood' ? 2 : 1)) AREAS.push(a); });
    }
    function makeFeatures() {   /* Colin, AD's features.js: the land's own places found on the chart and named, seeded by place (Robin, 2026-10-25: "names of places are generated in the world, like strands and other places. To create some world to it"; the words Alistair, LD's place-names.json, modern Norwegian without ø or å; it belongs in the world's making, one pass after the islands: mine to move there) */
      var WD = env.words || { firsts: {}, kinds: {} }, W = WD.firsts, KIND = WD.kinds, S4 = 4, GW = G.w, GH = G.h, LF = G.L, used = {}, F = [], x, y;
      function discFrac(cx2, cy2, Rr) { var s2 = 0, n = 0; for (var yy = cy2 - Rr; yy <= cy2 + Rr; yy++) for (var xx = cx2 - Rr; xx <= cx2 + Rr; xx++) { if ((xx - cx2) * (xx - cx2) + (yy - cy2) * (yy - cy2) > Rr * Rr) continue; n++; if (xx >= 0 && yy >= 0 && xx < GW && yy < GH) s2 += LF[yy * GW + xx]; } return s2 / n; }
      function coastal(x2, y2, land) { var v = LF[y2 * GW + x2]; if (land ? v < 0.6 : v > 0.2) return false; var D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]]; for (var q = 0; q < 4; q++) { var X = x2 + D4[q][0], Y = y2 + D4[q][1]; if (X < 0 || Y < 0 || X >= GW || Y >= GH) continue; var w2 = LF[Y * GW + X]; if (land ? w2 < 0.3 : w2 > 0.6) return true; } return false; }
      function nms(c, Rr, better) { c.sort(better); var keep = []; c.forEach(function (a) { if (!keep.some(function (k) { return Math.hypot(k.x - a.x, k.y - a.y) < Rr; })) keep.push(a); }); return keep; }
      function nameFor(kind, x2, y2) { var kd = KIND[kind]; if (!kd) return { name: '', gloss: '' }; var suf = kd[0], what = kd[1], pool = kd[2].filter(function (f) { return W[f]; }), all = Object.keys(W); if (!all.length) return { name: '', gloss: '' };
        for (var t = 0; t < 80; t++) { var P = t < 30 && pool.length ? pool : all, first = P[Math.floor(hash(x2 * 7 + t * 131, y2 * 13 + kind.length) * P.length)], mean = W[first][0], gen = W[first][1];
          var head = first + (gen && !/s$/.test(first) ? 's' : ''); if (/[aeiouy]$/i.test(head) && /^[aeiouy]/.test(suf)) head = head.slice(0, -1);
          var nm = head + suf; if (/(.)\1\1/.test(nm)) nm = nm.replace(/(.)\1\1/, '$1$1'); nm = nm.charAt(0).toUpperCase() + nm.slice(1);
          if (used[nm]) continue; used[nm] = 1; return { name: nm, gloss: gen ? (/^[A-Z]/.test(mean) ? mean + "'s " + what : 'the ' + mean + "'s " + what) : 'the ' + mean + ' ' + what }; }
        return { name: '', gloss: '' }; }
      var hc = []; for (y = 2; y < GH - 2; y++) for (x = 2; x < GW - 2; x++) { if (!coastal(x, y, true)) continue; var fr = discFrac(x, y, 7); if (fr < 0.3) hc.push({ x: x * S4 + 2, y: y * S4 + 2, s: fr }); }
      nms(hc, 170, function (a, b) { return a.s - b.s; }).forEach(function (h) { var is = isleOf(h.x, h.y); if (is < 0 || ISLES[is].r < 70) return; F.push({ kind: 'headland', x: h.x, y: h.y, isle: is, size: 1 - h.s }); });
      var bc = []; for (y = 2; y < GH - 2; y++) for (x = 2; x < GW - 2; x++) { if (LF[y * GW + x] > 0.05) continue; var near = false; for (var dy = -2; dy <= 2 && !near; dy++) for (var dx = -2; dx <= 2; dx++) { var X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < GW && Y < GH && LF[Y * GW + X] > 0.6) { near = true; break; } } if (!near) continue; var fr2 = discFrac(x, y, 9); if (fr2 > 0.56) bc.push({ x: x * S4 + 2, y: y * S4 + 2, s: fr2 }); }
      nms(bc, 180, function (a, b) { return b.s - a.s; }).forEach(function (h) { var is = isleOf(h.x, h.y); if (is < 0 || ISLES[is].r < 70) return; F.push({ kind: 'bay', x: h.x, y: h.y, isle: is, size: h.s }); });
      AREAS.forEach(function (a) { if (a.kind === 'meadow' && a.tiles < 9000) return; F.push({ kind: a.kind, x: a.x, y: a.y, isle: a.isle, size: a.tiles }); });
      var seen = new Uint8Array(TW * TH); for (var i0 = 0; i0 < TW * TH; i0++) { if (!TARN[i0] || seen[i0]) continue; var st = [i0]; seen[i0] = 1; var n = 0, sx = 0, sy = 0; while (st.length) { var ii = st.pop(); n++; sx += ii % TW; sy += (ii / TW) | 0; var nb = [ii + 1, ii - 1, ii + TW, ii - TW]; for (var q2 = 0; q2 < 4; q2++) { var j = nb[q2]; if (j >= 0 && j < TW * TH && TARN[j] && !seen[j]) { seen[j] = 1; st.push(j); } } } if (n >= 40) F.push({ kind: 'tarn', x: Math.round(sx / n), y: Math.round(sy / n), isle: isleOf(sx / n, sy / n), size: n }); }
      ISLES.forEach(function (q) { F.push({ kind: q.r < 28 ? 'skerry' : 'island', x: q.x, y: q.y, isle: q.i, size: q.r, isleId: q.i }); });
      var sc = []; for (var a = 0; a < ISLES.length; a++) for (var b = a + 1; b < ISLES.length; b++) { var A = ISLES[a], B = ISLES[b]; if (A.r < 20 || B.r < 20) continue; var dd = Math.hypot(A.x - B.x, A.y - B.y), gap = dd - A.r - B.r; if (gap < 15 || gap > 110) continue; var tt = (A.r + gap / 2) / dd, mx = A.x + (B.x - A.x) * tt, my = A.y + (B.y - A.y) * tt, cxx = Math.round(mx / S4), cyy = Math.round(my / S4); if (cxx < 0 || cyy < 0 || cxx >= GW || cyy >= GH || LF[cyy * GW + cxx] > 0.05) continue; sc.push({ x: Math.round(mx), y: Math.round(my), s: gap, isle: a }); }
      nms(sc, 150, function (a2, b2) { return a2.s - b2.s; }).forEach(function (h) { F.push({ kind: 'sound', x: h.x, y: h.y, isle: h.isle, size: h.s }); });
      F.forEach(function (f, k) { f.id = f.kind[0] + k; var nn = nameFor(f.kind, Math.round(f.x), Math.round(f.y)); f.name = nn.name; f.gloss = nn.gloss; });
      F.forEach(function (f) { if ((f.kind === 'island' || f.kind === 'skerry') && f.isleId != null && ISLES[f.isleId] && f.name) { ISLES[f.isleId].name = f.name; ISLES[f.isleId].gloss = f.gloss; } });   /* the islands take the world's names, the starter island and the big island too (Robin, 2026-10-25, through Alistair, LD) */
      var FX = (env.fixed || {}), wi = (env.waters || []).findIndex(function (wt) { return wt.dir === 'west'; }), west = ISLES.filter(function (q) { return q.water === wi; }).sort(function (a, b) { return b.r - a.r; })[0];
      if (west && FX['place.kvennaey']) { ISLES[west.i].name = FX['place.kvennaey']; ISLES[west.i].gloss = "the women's isle"; F.forEach(function (f) { if (f.kind === 'island' && f.isleId === west.i) { f.name = FX['place.kvennaey']; f.gloss = "the women's isle"; } }); }
      FEATS = F;
    }
    function nameOf(id, dflt) { return RENAMED[id] || dflt; }
    function makeRoads() {   /* tracks between the villages of each island (a proposal: the world has none yet): the shortest tree of links, each walked over open ground on a 4-tile grid, never the fell or the sea */
      var S4 = 4, GW = Math.ceil(TW / S4), GH = Math.ceil(TH / S4), COST = new Float32Array(GW * GH).fill(Infinity), x, y, xx, yy;
      for (y = 0; y < GH; y++) for (x = 0; x < GW; x++) { var sea = 0, wood = 0, fell = 0, beach = 0, n = 0; for (yy = 0; yy < S4; yy++) for (xx = 0; xx < S4; xx++) { var X = x * S4 + xx, Y = y * S4 + yy; if (X >= TW || Y >= TH) continue; n++; var k = K[Y * TW + X]; if (!k) sea++; else if (k === 1) beach++; else if (k === 3) wood++; else if (k >= 4) fell++; }
        if (sea > n * 0.35) continue; COST[y * GW + x] = 1 + 1.6 * wood / n + 0.6 * beach / n + 9 * fell / n + 3 * sea / n; }
      function astar(a, b) {
        var N = GW * GH, gS = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1);
        function near(px, py) { for (var r = 0; r < 6; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) { var X = px + dx, Y = py + dy; if (X >= 0 && Y >= 0 && X < GW && Y < GH && COST[Y * GW + X] < Infinity) return [X, Y]; } return [px, py]; }
        var s = near(Math.round(a[0] / S4), Math.round(a[1] / S4)), t = near(Math.round(b[0] / S4), Math.round(b[1] / S4)), s0 = s[1] * GW + s[0], t0 = t[1] * GW + t[0], open = [[0, s0]]; gS[s0] = 0;
        function push(f, i) { open.push([f, i]); var k = open.length - 1; while (k > 0) { var p = (k - 1) >> 1; if (open[p][0] <= open[k][0]) break; var tmp = open[p]; open[p] = open[k]; open[k] = tmp; k = p; } }
        function pop() { var top = open[0], last = open.pop(); if (open.length) { open[0] = last; var k = 0; for (;;) { var l = 2 * k + 1, r = l + 1, m = k; if (l < open.length && open[l][0] < open[m][0]) m = l; if (r < open.length && open[r][0] < open[m][0]) m = r; if (m === k) break; var tmp = open[m]; open[m] = open[k]; open[k] = tmp; k = m; } } return top; }
        var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], steps = 0;
        while (open.length && steps++ < 400000) { var i = pop()[1]; if (i === t0) break; var px = i % GW, py = (i / GW) | 0;
          for (var q = 0; q < 8; q++) { var dx = DIRS[q][0], dy = DIRS[q][1], X = px + dx, Y = py + dy; if (X < 0 || Y < 0 || X >= GW || Y >= GH) continue; var j = Y * GW + X, cc = COST[j]; if (cc === Infinity) continue; var ng = gS[i] + cc * (dx && dy ? 1.414 : 1); if (ng < gS[j]) { gS[j] = ng; from[j] = i; push(ng + Math.hypot(X - t[0], Y - t[1]), j); } } }
        if (from[t0] < 0 && t0 !== s0) return null; var pts = []; for (var k = t0; k >= 0; k = from[k]) { pts.push([(k % GW) * S4 + S4 / 2, ((k / GW) | 0) * S4 + S4 / 2]); if (k === s0) break; } pts.reverse(); return [a].concat(pts, [b]);
      }
      function smooth(p, it) { for (var k = 0; k < it; k++) { var q = [p[0]]; for (var i = 0; i < p.length - 1; i++) { var a = p[i], b = p[i + 1]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } q.push(p[p.length - 1]); p = q; } return p; }
      function thin(p) { return p.filter(function (q, i) { return i === 0 || i === p.length - 1 || i % 2 === 0; }); }
      var V = PL.villages.map(function (v) { var vx = v.tx + v.w / 2, vy = v.ty + v.h / 2, ends = (v.ends || []).slice(); if (!ends.length) ends.push([vx, vy]); return { ends: ends, isle: isleOf(vx, vy), jetty: v.jetty }; }), by = {};
      V.forEach(function (v) { (by[v.isle] = by[v.isle] || []).push(v); }); ROADS = [];
      Object.keys(by).forEach(function (isle) { var vs = by[isle], inT = [vs[0]], rest = vs.slice(1);
        while (rest.length) { var best = null; inT.forEach(function (a) { rest.forEach(function (b) { a.ends.forEach(function (ea) { b.ends.forEach(function (eb) { var dd = Math.hypot(ea[0] - eb[0], ea[1] - eb[1]); if (!best || dd < best.d) best = { d: dd, a: ea, b: eb, v: b }; }); }); }); });
          inT.push(best.v); rest.splice(rest.indexOf(best.v), 1); if (best.d < 12) continue; var p = astar(best.a, best.b); if (p) ROADS.push({ pts: smooth(thin(p), 3) }); } });
      V.forEach(function (v) { if (!v.jetty || !v.jetty.root) return; var r = v.jetty.root, best = null; v.ends.forEach(function (e) { var dd = Math.hypot(e[0] - r[0], e[1] - r[1]); if (!best || dd < best.d) best = { d: dd, e: e }; }); if (best && best.d > 8) { var p = astar(best.e, r); if (p) ROADS.push({ pts: smooth(thin(p), 3) }); } });
      CURV = ROADS.map(function (r) { var sp = simplify(r.pts, 7); return spline(sp.length > 2 ? sp : r.pts.filter(function (q, i) { return i % 6 === 0 || i === r.pts.length - 1; }), 10); });
    }
    function prepare(done) {   /* the chart read, the names, the tracks: once, in steps on timers so the game breathes between them */
      if (ready || preparing) return; preparing = true; dirty = true;
      var steps = [function () { readChart(); }, function () { makePlaces(); }, function () { makeFeatures(); }, function () { makeRoads(); }, function () { replayTrail(); ready = true; preparing = false; clampView(); dirty = true; if (done) done(); }];
      (function next() { var f = steps.shift(); if (!f) return; try { f(); } catch (e) { err = e; preparing = false; if (typeof console !== 'undefined') console.error('WorldMap', e); return; } setTimeout(next, 30); })();
    }

    // ---- the fog
    function sampleG(F, X, Y) { var gx = X / 4 - 0.5, gy = Y / 4 - 0.5, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0, w = G.w, h = G.h;
      function at(x, y) { return (x < 0 || y < 0 || x >= w || y >= h) ? 0 : F[y * w + x]; } return lerp(lerp(at(x0, y0), at(x0 + 1, y0), fx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), fx), fy); }
    function knowOf(i) { return KNOW[i] === 2 || (S.zoneAuto > 0.5 && i === HERE) ? 2 : KNOW[i]; }
    function fogField() { var key = Array.from(ISLES, function (q, i) { return knowOf(i) === 2 ? 1 : 0; }).join('') + '|' + S.fogReach; if (G.fogKey === key) return G.SB; G.fogKey = key;
      var E = new Float32Array(G.w * G.h); for (var i = 0; i < E.length; i++) if (G.GI[i] >= 0 && knowOf(G.GI[i]) === 2) E[i] = G.L[i];
      G.SB = blur(E, G.w, G.h, S.fogReach / 4 / 1.7, 3); return G.SB; }
    function fogVis(X, Y) { return Math.max(sm(0.002, 0.045, sampleG(fogField(), X, Y)), sm(0.25, 0.6, sampleG(G.TB, X, Y))); }
    function dirtyAround(X, Y, Rw) { TILES.forEach(function (T) { var w = TILE / T.ppt, x0 = T.tx * w, y0 = T.ty * w; if (x0 < X + Rw && x0 + w > X - Rw && y0 < Y + Rw && y0 + w > Y - Rw) T.painted = null; }); dirty = true; }
    function stampAt(X, Y) { var r = S.sailReach / 4, gx = X / 4, gy = Y / 4; for (var y = Math.floor(gy - r - 1); y <= gy + r + 1; y++) for (var x = Math.floor(gx - r - 1); x <= gx + r + 1; x++) { if (x < 0 || y < 0 || x >= G.w || y >= G.h) continue; var v = 1 - sm(r * 0.55, r, Math.hypot(x - gx, y - gy)), k = y * G.w + x; if (v > G.TR[k]) G.TR[k] = v; } }
    function replayTrail() { for (var i = 0; i + 1 < trailPts.length; i += 2) stampAt(trailPts[i], trailPts[i + 1]); G.TB = blur(G.TR, G.w, G.h, 2, 1); G.fogKey = null; }

    // ---- the tiles: per level and index, the fields once, the paint whenever the fog changes near them
    function tileKey(li, tx, ty) { return li + ':' + tx + ':' + ty; }
    function buildTile(li, tx, ty) {
      var ppt = LEVELS[li], M = 22, N = TILE + 2 * M, n = N * N, X0 = (tx * TILE - M) / ppt, Y0 = (ty * TILE - M) / ppt, step = 1 / ppt, u, v, i, X, Y, xx, yy, q;
      var hgt = new Float32Array(n), land = new Float32Array(n), wood = new Float32Array(n), beach = new Float32Array(n), fell = new Float32Array(n), snow = new Float32Array(n), warm = new Float32Array(n), isle = new Int8Array(n).fill(-1);
      for (v = 0; v < N; v++) for (u = 0; u < N; u++) {
        i = v * N + u; X = X0 + u * step; Y = Y0 + v * step;
        if (ppt < 1) { var c0 = 0, cw = 0, cb = 0, cf = 0, cs = 0, wa = 0, nn = 0, is = -1, xa = Math.floor(X), ya = Math.floor(Y), k = Math.round(step);
          for (yy = ya; yy < ya + k; yy++) for (xx = xa; xx < xa + k; xx++) { nn++; if (xx < 0 || yy < 0 || xx >= TW || yy >= TH) continue; var j = yy * TW + xx, kk = K[j]; if (!kk) continue; c0++; if (kk === 3) cw++; else if (kk === 1) cb++; else if (kk === 4) cf++; else if (kk === 5) { cs++; cf++; } wa += WARM[j]; is = ISLE[j]; hgt[i] += HG[j]; }
          hgt[i] /= nn; land[i] = c0 / nn; wood[i] = cw / nn; beach[i] = cb / nn; fell[i] = cf / nn; snow[i] = cs / nn; warm[i] = c0 ? wa / c0 / 255 : 0; isle[i] = is;
        } else { var gx = X - 0.5, gy = Y - 0.5, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0, is2 = -1, bw = 0;
          for (q = 0; q < 4; q++) { xx = x0 + (q & 1); yy = y0 + (q >> 1); var w4 = ((q & 1) ? fx : 1 - fx) * ((q >> 1) ? fy : 1 - fy); if (xx < 0 || yy < 0 || xx >= TW || yy >= TH) continue; var j2 = yy * TW + xx, k2 = K[j2]; if (!k2) continue;
            land[i] += w4; if (k2 === 3) wood[i] += w4; else if (k2 === 1) beach[i] += w4; else if (k2 === 4) fell[i] += w4; else if (k2 === 5) { snow[i] += w4; fell[i] += w4; } warm[i] += w4 * WARM[j2] / 255; hgt[i] += w4 * HG[j2]; if (w4 > bw) { bw = w4; is2 = ISLE[j2]; } }
          if (land[i] > 0) warm[i] /= land[i]; isle[i] = is2; }
      }
      var T = { li: li, tx: tx, ty: ty, ppt: ppt, N: N, M: M, land: land, isle: isle, B2: blur(land, N, N, 2, 2), B3: blur(land, N, N, 3, 2), wood: blur(wood, N, N, 1, 1), beach: blur(beach, N, N, 1, 1), fell: blur(fell, N, N, 1, 1), snow: blur(snow, N, N, 1, 1), warm: blur(warm, N, N, 2, 1), HB: blur(hgt, N, N, Math.max(1, 2.5 * ppt), 2) };
      var m = TILE * TILE; T.H8 = new Float32Array(m); T.H16 = new Float32Array(m); T.MOT = new Float32Array(m); T.FIB = new Float32Array(m); T.EDG = new Float32Array(m); T.ST = new Float32Array(m); T.SP = new Float32Array(m); T.CAN = new Float32Array(m);
      var oct = 2 + li;
      for (v = 0; v < TILE; v++) for (u = 0; u < TILE; u++) {
        i = v * TILE + u; X = (tx * TILE + u + 0.5) / ppt; Y = (ty * TILE + v + 0.5) / ppt;
        T.H8[i] = sampleG(G.H8, X, Y); T.H16[i] = sampleG(G.H16, X, Y);
        T.MOT[i] = fbm(X / 330, Y / 330, Math.min(6, oct + 1)); T.FIB[i] = hash(tx * TILE + u, (ty * TILE + v) >> 1) - 0.5;
        T.EDG[i] = Math.min(X - SX0, Y - SY0, SX1 - X, SY1 - Y) / 3 + 30 * (fbm(X / 150, Y / 150, 2) - 0.5);
        T.ST[i] = fbm(X / 510, Y / 21, 3); T.SP[i] = fbm(X / 78, Y / 78, 3) * 0.6 + fbm(X / 21, Y / 21, Math.min(4, oct)) * 0.4; T.CAN[i] = li >= 2 ? fbm(X / 4, Y / 4, 2) : fbm(X / 9, Y / 9, 2);
      }
      T.cv = document.createElement('canvas'); T.cv.width = TILE + 2; T.cv.height = TILE + 2; T.raw = document.createElement('canvas'); T.raw.width = TILE; T.raw.height = TILE; T.img = T.raw.getContext('2d').createImageData(TILE, TILE); T.painted = null;
      return T;
    }
    function paintTile(T) {
      var SB = fogField(), D = T.img.data, N = T.N, M = T.M, ppt = T.ppt, u, v, t;
      var PA = hex(S.paper), PD = [PA[0] * 0.87, PA[1] * 0.83, PA[2] * 0.75], SEA = hex(S.sea), SH = hex(S.shallowCol), RC = hex(S.rippleCol), LD = hex(S.landDark), LM = hex(S.landMid), LL = hex(S.landLight), INK = hex(S.inkCol), BC = hex(S.beachCol);
      var OC1 = [176, 150, 74], OC2 = [206, 182, 98], LV = [0.16, 0.055, 0.025].slice(0, Math.round(S.ripples)), kn = Array.from(ISLES, function (q, i) { return knowOf(i); });
      for (v = 0; v < TILE; v++) for (u = 0; u < TILE; u++) {
        var i = v * TILE + u, j = (v + M) * N + u + M, p = i * 4, X = (T.tx * TILE + u + 0.5) / ppt, Y = (T.ty * TILE + v + 0.5) / ppt, fib = T.FIB[i] * 6, edge = T.EDG[i];
        t = sm(0.5, 0.85, T.MOT[i]) * S.mottle; var pr = PA[0] + (PD[0] - PA[0]) * t + fib, pg = PA[1] + (PD[1] - PA[1]) * t + fib, pb = PA[2] + (PD[2] - PA[2]) * t + fib;
        t = sm(70, 4, edge) * S.burn; pr += (128 - pr) * t; pg += (84 - pg) * t; pb += (44 - pb) * t;
        var sb = sampleG(SB, X, Y), ns = Math.max(sm(0.002, 0.045, sb), sm(0.25, 0.6, sampleG(G.TB, X, Y))), be = sm(0.002, 0.012, sb) * (1 - sm(0.012, 0.03, sb));
        var k = (S.wash + S.streak * (T.ST[i] - 0.5)) * ns; if (k < 0) k = 0;
        var r = pr + (pr * SEA[0] / 255 - pr) * k, g = pg + (pg * SEA[1] / 255 - pg) * k, b = pb + (pb * SEA[2] / 255 - pb) * k;
        t = sm(0.02, 0.32, T.H8[i]) * S.shallows * ns; r += (pr + (SH[0] - pr) * 0.6 - r) * t; g += (pg + (SH[1] - pg) * 0.6 - g) * t; b += (pb + (SH[2] - pb) * 0.6 - b) * t;
        if (LV.length) { var gx = (u < TILE - 1 ? T.H16[i + 1] - T.H16[i] : T.H16[i] - T.H16[i - 1]), gy = (v < TILE - 1 ? T.H16[i + TILE] - T.H16[i] : T.H16[i] - T.H16[i - TILE]), gr = Math.max(1e-5, Math.hypot(gx, gy));
          for (var q = 0; q < LV.length; q++) { t = (1 - sm(0.3, 1.1, Math.abs(T.H16[i] - LV[q]) / gr)) * S.rippleStr * ns; r += (RC[0] - r) * t; g += (RC[1] - g) * t; b += (RC[2] - b) * t; } }
        if (be > 0) { var f0 = 1 - 0.1 * be; r *= f0; g *= f0; b *= f0; }
        var la = sm(0.4, 0.6, T.B2[j]), is = T.isle[j], vis = ns;
        if (la > 0) {
          var lr, lg, lb, sp = 0.5 + (T.SP[i] - 0.5) * (0.15 + 0.85 * S.sponge);
          if (sp < 0.5) { t = sm(0.2, 0.5, sp); lr = LD[0] + (LM[0] - LD[0]) * t; lg = LD[1] + (LM[1] - LD[1]) * t; lb = LD[2] + (LM[2] - LD[2]) * t; }
          else { t = sm(0.5, 0.8, sp); lr = LM[0] + (LL[0] - LM[0]) * t; lg = LM[1] + (LL[1] - LM[1]) * t; lb = LM[2] + (LL[2] - LM[2]) * t; }
          t = sm(0.25, 0.75, T.warm[j]) * S.warm; lr += (OC1[0] + (OC2[0] - OC1[0]) * sp - lr) * t; lg += (OC1[1] + (OC2[1] - OC1[1]) * sp - lg) * t; lb += (OC1[2] + (OC2[2] - OC1[2]) * sp - lb) * t;
          var A = S.areas, wd = T.wood[j] / Math.max(0.05, T.land[j]);
          t = clamp(wd, 0, 1) * A * S.woodDark * (0.75 + 0.5 * sm(0.45, 0.7, T.CAN[i])); lr *= 1 - t * 0.55; lg *= 1 - t * 0.4; lb *= 1 - t * 0.5;
          t = clamp(T.beach[j] / Math.max(0.05, T.land[j]), 0, 1) * A; lr += (BC[0] - lr) * t; lg += (BC[1] - lg) * t; lb += (BC[2] - lb) * t;
          var ff = clamp(T.fell[j] / Math.max(0.05, T.land[j]), 0, 1);
          if (ff > 0.01) {   /* the watercolour fell (Robin's pick): a warm ochre-grey wash, darker where it pooled at each step, cool below a step, snow on the tops, a dried umber line at its edge */
            var h = T.HB[j] / 80, ex = (T.HB[j + 1] - T.HB[j - 1]) / 160, ey = (T.HB[j + N] - T.HB[j - N]) / 160, gp = Math.max(1e-4, Math.hypot(ex, ey)), gran = 0.92 + 0.16 * hash(T.tx * TILE + u, T.ty * TILE + v) * 0.5 + 0.08 * T.CAN[i], mr = 196 * gran, mg = 176 * gran, mb = 138 * gran;
            [0.4, 1.3, 2.3].forEach(function (lv) { var dd = (h - lv) / gp / ppt, pool = dd > -0.4 ? Math.exp(-Math.max(0, dd) / 4) * 0.5 : 0, cool = dd < 0 ? Math.exp(dd / 9) * 0.4 * clamp((ex * 0.6 + ey * 0.8) / gp + 0.5, 0, 1) : 0; mr *= 1 - pool * 0.42 - cool * 0.3; mg *= 1 - pool * 0.48 - cool * 0.32; mb *= 1 - pool * 0.56 - cool * 0.3; });
            var sn = sm(2.3, 2.6, h); mr += (238 - mr) * sn; mg += (234 - mg) * sn; mb += (226 - mb) * sn;
            var fa6 = sm(0.3, 0.62, ff); lr += (mr - lr) * fa6; lg += (mg - lg) * fa6; lb += (mb - lb) * fa6; var we = (1 - sm(0, 0.2, Math.abs(ff - 0.5))) * 0.42; lr += (118 - lr) * we; lg += (92 - lg) * we; lb += (62 - lb) * we;
          }
          t = 1 - 0.22 * sm(0.95, 0.55, T.B3[j]) * S.pool; lr *= t; lg *= t; lb *= t;
          lr *= 0.86 + 0.14 * pr / PA[0]; lg *= 0.86 + 0.14 * pg / PA[1]; lb *= 0.86 + 0.14 * pb / PA[2];
          lr = pr + (lr - pr) * vis; lg = pg + (lg - pg) * vis; lb = pb + (lb - pb) * vis;
          r += (lr - r) * la; g += (lg - g) * la; b += (lb - b) * la;
        }
        var ink = 1 - sm(0, S.inkW, Math.abs(T.B2[j] - 0.5));
        if (ink > 0.001 && is >= 0) {
          if (vis > 0.01) { t = ink * S.inkStr * vis; r += (INK[0] - r) * t; g += (INK[1] - g) * t; b += (INK[2] - b) * t; }
          if (vis < 0.5 && kn[is] === 1 && S.toldLine > 0 && ((Math.floor(X * 0.7) + Math.floor(Y * 0.7)) % 3 === 0)) { t = ink * 0.45 * S.toldLine; r += (96 - r) * t; g += (88 - g) * t; b += (80 - b) * t; }   /* told of: a broken pencil line */
        }
        D[p] = r; D[p + 1] = g; D[p + 2] = b; D[p + 3] = edge < 1 ? 0 : 255;
      }
      T.raw.getContext('2d').putImageData(T.img, 0, 0); var qc = T.cv.getContext('2d'); qc.clearRect(0, 0, TILE + 2, TILE + 2); qc.drawImage(T.raw, 1, 1);
      qc.drawImage(T.raw, 0, 0, 1, TILE, 0, 1, 1, TILE); qc.drawImage(T.raw, TILE - 1, 0, 1, TILE, TILE + 1, 1, 1, TILE); qc.drawImage(T.cv, 0, 1, TILE + 2, 1, 0, 0, TILE + 2, 1); qc.drawImage(T.cv, 0, TILE, TILE + 2, 1, 0, TILE + 1, TILE + 2, 1);   /* (each edge pixel copied outward, or the seams show) */
      T.painted = paintedKey;
    }

    // ---- the view
    function levelFor(zz) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i] >= zz * 0.95) return i; return LEVELS.length - 1; }
    function visibleTiles(li) { var ppt = LEVELS[li], a = toW(VP.x, VP.y), b = toW(VP.x + VP.w, VP.y + VP.h), out = []; for (var ty = Math.floor(a[1] * ppt / TILE); ty <= Math.floor(b[1] * ppt / TILE); ty++) for (var tx = Math.floor(a[0] * ppt / TILE); tx <= Math.floor(b[0] * ppt / TILE); tx++) out.push([tx, ty]); return out; }
    function ensureView() { if (view) return; view = document.createElement('canvas'); view.width = 1200; view.height = 750; vg = view.getContext('2d'); bloomCv = document.createElement('canvas'); bloomCv.width = 1200; bloomCv.height = 750; }
    function draw(force) {   /* the whole panel into map.view; painting the missing tiles goes on on timers */
      ensureView(); if (!force && !dirty && !BLOOM) return false; dirty = false;
      vg.setTransform(1, 0, 0, 1, 0, 0); vg.fillStyle = '#120d0a'; vg.fillRect(0, 0, 1200, 750);
      oak(vg, 42, 21, 1116, 708); vg.fillStyle = '#2a1e14'; vg.fillRect(VP.x, VP.y, VP.w, VP.h);
      if (!ready) { vg.font = '600 20px ' + FONT; vg.fillStyle = '#e8d8b0'; vg.textAlign = 'center'; vg.fillText(err ? 'The chart could not be drawn' : 'Painting the chart…', 600, 380); vg.textAlign = 'left'; return true; }
      vg.save(); vg.beginPath(); vg.rect(VP.x, VP.y, VP.w, VP.h); vg.clip(); vg.imageSmoothingEnabled = true; vg.imageSmoothingQuality = 'high';
      fogField(); if (!paintedKey) paintedKey = 'p' + (++gen);
      var li = levelFor(z), missing = 0;
      for (var lj = 0; lj <= li; lj++) {
        if (lj < li && lj !== 0 && lj !== li - 1) continue;
        var ppt = LEVELS[lj];
        visibleTiles(lj).forEach(function (tt) { var tx = tt[0], ty = tt[1], key = tileKey(lj, tx, ty), T = TILES.get(key);
          if (!T || T.painted !== paintedKey) { if (lj === li || lj === 0) { missing++; queue.push([lj, tx, ty]); } if (!T || !T.painted) return; }
          var s = toS(tx * TILE / ppt, ty * TILE / ppt), sz = TILE / ppt * z, e = sz / TILE; vg.drawImage(T.cv, s[0] - e, s[1] - e, sz + 2 * e, sz + 2 * e); });
      }
      marks();
      if (BLOOM) bloomOver();
      vg.restore();
      var zoneName = null; if (S.zoneTitle > 0.5 && z >= 0.8) { var best = 1e9; ISLES.forEach(function (q) { var dd = Math.hypot(cx - q.x, cy - q.y) - q.r; if (dd < best && q.name) { best = dd; zoneName = q; } }); if (zoneName && (best > 40 || fogVis(zoneName.x, zoneName.y) < 0.6)) zoneName = null; }
      var zoneText = zoneName ? nameOf('isle' + zoneName.i, zoneName.name) : null;
      var season = env.seasonText ? env.seasonText() : '';
      if (zoneName) { vg.save(); vg.globalAlpha = sm(0.8, 1.0, z); vg.textAlign = 'center'; vg.font = '700 28px ' + FONT; var tt2 = zoneText.toUpperCase().split('').join(' '), tw = vg.measureText(tt2).width;
        vg.fillStyle = 'rgba(234,220,184,0.82)'; vg.fillRect(600 - tw / 2 - 30, VP.y + 6, tw + 60, 58); vg.strokeStyle = 'rgba(58,40,24,0.6)'; vg.lineWidth = 1; vg.beginPath(); vg.moveTo(600 - tw / 2 - 20, VP.y + 44); vg.lineTo(600 + tw / 2 + 20, VP.y + 44); vg.stroke();
        vg.fillStyle = '#3a2614'; vg.fillText(tt2, 600, VP.y + 36); vg.font = 'italic 14px ' + FONT; vg.fillStyle = 'rgba(58,40,24,0.85)'; vg.fillText(season, 600, VP.y + 58); vg.restore(); vg.textAlign = 'left'; }
      else { vg.font = '600 15px ' + FONT; vg.fillStyle = 'rgba(58,40,24,0.85)'; vg.textAlign = 'center'; vg.fillText(season, 600, VP.y + 26); vg.textAlign = 'left'; }
      if (S.compass > 0.5) rose(vg, VP.x + VP.w - 74, VP.y + 70);
      vg.font = '600 13px ' + FONT; vg.fillStyle = 'rgba(232,216,176,0.75)'; vg.textAlign = 'right'; vg.fillText('M or Esc closes', 1150, 16); vg.textAlign = 'left';
      drawPalette();
      if (missing && !working) work();
      return true;
    }
    function work() {
      working = true;
      (function step() {
        var t0 = Date.now();
        while (queue.length && Date.now() - t0 < 30) { var qq = queue.shift(), key = tileKey(qq[0], qq[1], qq[2]), T = TILES.get(key); if (T && T.painted === paintedKey) continue; if (!T) { T = buildTile(qq[0], qq[1], qq[2]); TILES.set(key, T); } paintTile(T); }
        dirty = true;
        if (queue.length) { setTimeout(step, 0); return; }
        working = false;
        if (TILES.size > 260) { var want = new Set(); for (var li = 0; li < LEVELS.length; li++) visibleTiles(li).forEach(function (tt) { want.add(tileKey(li, tt[0], tt[1])); }); TILES.forEach(function (T, k) { if (!want.has(k) && k.indexOf('0:') !== 0) TILES.delete(k); }); }
      })();
    }

    // ---- the marks: pictures and names by zoom, never covering one another
    var SK = {};
    function SKETCH(vi) {   /* a village from memory: its place and size from the game, the houses a loose cluster of the hand's own */
      if (SK[vi]) return SK[vi]; var v = PL.villages[vi], vx = v.tx + v.w / 2, vy = v.ty + v.h / 2, seed = (v.name.length * 131 + v.tx * 7 + v.ty) | 0;
      var n = { seat: 7, village: 6, church: 3, small: 4, fishing: 4, farmstead: 2, ruin: 4 }[v.arch] || 3, rx = v.w * 0.32, ry = v.h * 0.3, houses = [];
      for (var k = 0, tries = 0; k < n && tries < 200; tries++) {
        var a = hash(seed + tries, 11) * Math.PI * 2, rr = k === 0 ? 0.15 * hash(seed, tries) : 0.35 + 0.65 * Math.sqrt(hash(tries, seed)), x = vx + Math.cos(a) * rx * rr, y = vy + Math.sin(a) * ry * rr;
        if (houses.some(function (h) { return Math.hypot((h.x - x) / rx, (h.y - y) / ry) < 0.42; })) continue;
        var kind = v.arch === 'ruin' ? 'ruin' : (k === 0 && v.arch === 'church' ? 'church' : k === 0 && (v.arch === 'seat' || v.arch === 'village') ? 'hall' : 'house');
        houses.push({ x: x, y: y, s: kind === 'hall' ? 1.35 : 0.8 + 0.3 * hash(tries, 3), kind: kind, flip: hash(seed, tries + 5) > 0.5 }); k++;
      }
      houses.sort(function (p, q) { return p.y - q.y; });
      var ends = v.ends || [], road = [];
      if (ends.length) { var e0 = ends[ends.length - 1], e1 = ends[0], mm = [vx + (hash(seed, 1) - 0.5) * rx * 0.5, vy + (hash(seed, 2) - 0.5) * ry * 0.5]; var pts = ends.length > 1 ? [e0, [(e0[0] + mm[0]) / 2 + (hash(seed, 3) - 0.5) * 6, (e0[1] + mm[1]) / 2], mm, [(e1[0] + mm[0]) / 2, (e1[1] + mm[1]) / 2 + (hash(seed, 4) - 0.5) * 6], e1] : [mm, [(e0[0] + mm[0]) / 2 + (hash(seed, 3) - 0.5) * 6, (e0[1] + mm[1]) / 2], e0]; road = spline(pts, 8); }
      var pier = null; if (v.jetty && v.jetty.tiles && v.jetty.tiles.length) { var tl = v.jetty.tiles, q0 = tl[0], q1 = tl[tl.length - 1]; pier = [[q0[0] + 0.5, q0[1] + 0.5], [q1[0] + 0.5 + (q1[0] - q0[0]) * 0.4, q1[1] + 0.5 + (q1[1] - q0[1]) * 0.4]]; }
      return (SK[vi] = { cx: vx, cy: vy, houses: houses, road: road, pier: pier, wall: v.arch === 'seat' ? [rx * 1.25, ry * 1.25] : null, smoke: v.arch !== 'ruin' && houses.length && hash(seed, 9) > 0.3 });
    }
    function marks() {
      var t = sm(0.2, 2.0, z), ks = S.iconSize * lerp(0.75, 1 + 0.9 * S.iconGrow, t), ls = S.labelSize * lerp(0.82, 1.18, t), put = [];
      LABELS = [];
      function pennant(r) { var x = r.x - 4, y = r.y + r.h * 0.5; vg.save(); vg.strokeStyle = '#3a2614'; vg.lineWidth = 1; vg.beginPath(); vg.moveTo(x, y + 6); vg.lineTo(x, y - 7); vg.stroke(); vg.fillStyle = '#b8402c'; vg.beginPath(); vg.moveTo(x, y - 7); vg.lineTo(x - 7, y - 4.5); vg.lineTo(x, y - 2); vg.closePath(); vg.fill(); vg.restore(); }   /* a name you have given */
      function note(r, id, name, gloss) { if (!r) return; LABELS.push({ r: r, id: id, name: name, gloss: gloss }); if (RENAMED[id]) pennant(r); }
      function isleAt(X, Y) { var xx = Math.round(X), yy = Math.round(Y); return xx >= 0 && yy >= 0 && xx < TW && yy < TH ? ISLE[yy * TW + xx] : -1; }
      function free(r) { return !put.some(function (o) { return r.x < o.x + o.w && o.x < r.x + r.w && r.y < o.y + o.h && o.y < r.y + r.h; }); }
      function take(r) { put.push(r); }
      function inView(sx, sy, m) { if (m == null) m = 30; return sx > VP.x - m && sy > VP.y - m && sx < VP.x + VP.w + m && sy < VP.y + VP.h + m; }
      var roadZ = sm(0.35, 0.5, z), RC = S.roadCol;
      function wobbly(pts, wpx, edgeA, dash, seed) { if (pts.length < 2) return; var sp = pts.map(function (q) { return toS(q[0], q[1]); }); vg.save(); vg.lineJoin = 'round'; vg.lineCap = 'round'; if (dash) vg.setLineDash(dash);
        function path() { vg.beginPath(); sp.forEach(function (pp, i) { var n = i && i < sp.length - 1 ? (vnoise(i * 0.37 + seed, seed * 0.13) - 0.5) * 1.6 : 0; vg[i ? 'lineTo' : 'moveTo'](pp[0] + n, pp[1] - n); }); }
        path(); vg.strokeStyle = 'rgba(96,72,44,' + edgeA + ')'; vg.lineWidth = wpx + 1.6; vg.stroke(); path(); vg.strokeStyle = RC; vg.lineWidth = wpx; vg.stroke(); vg.restore(); }
      function seenRun(pts) { var out = [], cur = []; pts.forEach(function (q) { if (fogVis(q[0], q[1]) > 0.5) cur.push(q); else { if (cur.length > 1) out.push(cur); cur = []; } }); if (cur.length > 1) out.push(cur); return out; }
      if (roadZ > 0.01 && S.tracks > 0.5 && CURV) CURV.forEach(function (r, ri) { seenRun(r).forEach(function (run) { wobbly(run, clamp(0.9 * z + 0.7, 1.2, 2.8), 0.45 * roadZ, z < 1.1 ? [Math.max(3, 6 * z), Math.max(2, 3.5 * z)] : null, ri * 7.1); }); });
      if (S.roofs > 0.5 && z >= 0.85) PL.villages.forEach(function (v, vi) { var K0 = SKETCH(vi); if (fogVis(K0.cx, K0.cy) < 0.5) return;
        vg.save(); vg.globalAlpha = sm(0.85, 1.05, z);
        if (S.roads > 0.5 && K0.road.length > 1) wobbly(K0.road, clamp(1.4 * z + 0.8, 1.6, 4.2), 0.5, null, vi * 3.3);
        if (K0.pier) { var a0 = toS(K0.pier[0][0], K0.pier[0][1]), a1 = toS(K0.pier[1][0], K0.pier[1][1]); vg.strokeStyle = 'rgba(46,34,22,0.9)'; vg.lineWidth = Math.max(2.4, 1.4 * z); vg.lineCap = 'round'; vg.beginPath(); vg.moveTo(a0[0], a0[1]); vg.lineTo(a1[0], a1[1]); vg.stroke(); vg.strokeStyle = '#8a6040'; vg.lineWidth = Math.max(1.2, 0.8 * z); vg.stroke(); boatMark(vg, a1[0] + 6, a1[1] + 4, clamp(0.5 + 0.35 * z, 0.6, 1.3)); }
        if (K0.wall) { var c0 = toS(K0.cx, K0.cy); vg.save(); vg.strokeStyle = 'rgba(70,52,34,0.8)'; vg.lineWidth = 1.2; vg.setLineDash([2, 2.5]); vg.beginPath(); for (var k = 0; k <= 40; k++) { var a = k / 40 * Math.PI * 2, rr = 1 + (vnoise(k * 0.5, vi) - 0.5) * 0.12; vg[k ? 'lineTo' : 'moveTo'](c0[0] + Math.cos(a) * K0.wall[0] * z * rr, c0[1] + Math.sin(a) * K0.wall[1] * z * rr); } vg.stroke(); vg.restore(); }
        var hs = clamp(7.5 * z + 6, 10, 30) / 18;
        K0.houses.forEach(function (hh) { var s = toS(hh.x, hh.y); sketchHouse(vg, s[0], s[1], hs * hh.s, hh.kind, hh.flip); });
        if (K0.smoke) { var hh = K0.houses.filter(function (q) { return q.kind === 'hall'; })[0] || K0.houses[K0.houses.length >> 1], s2 = toS(hh.x, hh.y); vg.strokeStyle = 'rgba(80,74,70,0.55)'; vg.lineWidth = 1.1; vg.beginPath(); vg.moveTo(s2[0] + 3 * hs, s2[1] - 11 * hs); vg.bezierCurveTo(s2[0] + 7 * hs, s2[1] - 17 * hs, s2[0] - 1 * hs, s2[1] - 21 * hs, s2[0] + 4 * hs, s2[1] - 27 * hs); vg.stroke(); }
        vg.restore(); });
      OWN.forEach(function (o, oi) { if (fogVis(o.x, o.y) < 0.4) return; var c0 = toS(o.x, o.y), rr = o.r * z; vg.save(); vg.strokeStyle = 'rgba(138,46,30,0.7)'; vg.lineWidth = 1.4; vg.setLineDash([3, 3]); vg.beginPath(); for (var k = 0; k <= 48; k++) { var a = k / 48 * Math.PI * 2, wob = 1 + (vnoise(k * 0.6, oi * 3.1) - 0.5) * 0.06; vg[k ? 'lineTo' : 'moveTo'](c0[0] + Math.cos(a) * rr * wob, c0[1] + Math.sin(a) * rr * wob); } vg.stroke(); vg.restore(); });   /* your own ground: the claim stones' reach in the hand's red-brown (mine) */
      function inVillage(X, Y) { return PL.villages.some(function (v) { return X > v.tx - 3 && X < v.tx + v.w + 3 && Y > v.ty - 3 && Y < v.ty + v.h + 3; }); }
      if (S.trees > 0.02 && z > 0.3) { var w0 = toW(VP.x, VP.y), w1 = toW(VP.x + VP.w, VP.y + VP.h), tsp = Math.max(2, S.treeGap / z), zt = clamp(z / 0.7, 0.5, 1.7);
        for (var Y = Math.floor(Math.max(0, w0[1]) / tsp) * tsp; Y < Math.min(TH, w1[1]); Y += tsp) for (var X = Math.floor(Math.max(0, w0[0]) / tsp) * tsp + ((Y / tsp) % 2 ? tsp / 2 : 0); X < Math.min(TW, w1[0]); X += tsp) {
          var xx = Math.round(X), yy = Math.round(Y), j = yy * TW + xx; if (K[j] !== 3 || hash(xx * 3, yy * 7) > 0.65 * S.trees || inVillage(xx, yy) || fogVis(xx, yy) < 0.6) continue;
          var sx = toS(xx + (hash(yy, xx) - 0.5) * tsp * 0.5, yy); tree(vg, sx[0], sx[1], zt * sm(0.3, 0.6, z)); } }
      var zi = sm(0.22, 0.32, z) * (1 - sm(0.72, 0.92, z));
      if (zi > 0.01) { var ICR = []; PL.villages.concat(PL.caves.map(function (c) { return { tx: c.x - 1, ty: c.y - 1, w: 2, h: 2 }; })).forEach(function (v) { var X2 = v.tx + v.w / 2, Y2 = v.ty + v.h / 2; if (fogVis(X2, Y2) < 0.5) return; var s = toS(X2, Y2); ICR.push({ x: s[0] - 13 * ks, y: s[1] - 14 * ks, w: 26 * ks, h: 18 * ks }); });
          [[PL.home.x, PL.home.y]].concat(PL.steading ? [[PL.steading.x, PL.steading.y]] : [], PL.shelters, OWN.map(function (o) { return [o.x, o.y]; }), ship ? [[ship.x, ship.y]] : []).forEach(function (q) { if (fogVis(q[0], q[1]) < 0.4) return; var s = toS(q[0], q[1]); ICR.push({ x: s[0] - 13 * ks, y: s[1] - 14 * ks, w: 26 * ks, h: 18 * ks }); });   /* every place's picture keeps the island's name off it (Colin, AD's note: the name ran over the wreck and the steading) */
        var clear = function (r) { return free(r) && !ICR.some(function (o) { return r.x < o.x + o.w && o.x < r.x + r.w && r.y < o.y + o.h && o.y < r.y + r.h; }); };
        ISLES.forEach(function (q) { if (!q.name || q.r < 28 || fogVis(q.x, q.y) < 0.6) return; var nm = nameOf('isle' + q.i, q.name), fs = [0.15, 0.55, -0.35, 0.8, -0.65]; for (var fi = 0; fi < fs.length; fi++) { var s = toS(q.x, q.y + q.r * fs[fi]); if (!inView(s[0], s[1], 0)) continue; var rr = spacedFit(vg, nm.toUpperCase(), s[0], s[1], 15 + 6 * t, 3, 0.62 * zi, clear, take, true); if (rr) { note(rr, 'isle' + q.i, nm, q.gloss); break; } } }); }
      var P = [];
      PL.villages.forEach(function (v, vi) { var X2 = v.tx + v.w / 2, Y2 = v.ty + v.h / 2; P.push({ kind: v.arch === 'ruin' ? 'ruin' : v.arch === 'church' ? 'church' : 'house', big: RANK[v.arch] >= 5, name: v.name, X: X2, Y: Y2, rank: RANK[v.arch] || 0, is: isleAt(X2, Y2), vi: vi }); });
      PL.caves.forEach(function (c) { P.push({ kind: c.kind === 'troll' ? 'cave' : 'crypt', name: c.kind === 'troll' ? 'The troll’s cave' : 'The crypt', X: c.x, Y: c.y, rank: 1.5, is: isleAt(c.x, c.y), minZ: 0.45 }); });
      P.push({ kind: 'wreck', name: 'The wreck', X: PL.home.x, Y: PL.home.y, rank: 7, is: isleAt(PL.home.x, PL.home.y) });
      if (PL.steading) P.push({ kind: 'burnt', name: 'The burnt steading', X: PL.steading.x, Y: PL.steading.y, rank: 2.5, is: isleAt(PL.steading.x, PL.steading.y), minZ: 0.3 });
      PL.shelters.forEach(function (s) { P.push({ kind: 'shelter', name: 'The rock shelter', X: s[0], Y: s[1], rank: 0.5, is: isleAt(s[0], s[1]), minZ: 0.9 }); });
      var shown = [];
      P.sort(function (a, b) { return b.rank - a.rank; }).forEach(function (p) {
        var seenHere = fogVis(p.X, p.Y) > 0.5, know = seenHere ? 2 : (p.is >= 0 && KNOW[p.is] === 1 ? 1 : 0), s = toS(p.X, p.Y), sx = s[0], sy = s[1]; if (!inView(sx, sy) || know === 0) return; if (p.minZ && z < p.minZ) return;
        if (know === 1) { if (S.toldIcons > 0.01) pencil(vg, p.kind, sx, sy, ks * 0.95, S.toldIcons); return; }   /* told of: the shape alone, faint pencil, no name */
        if (p.vi != null && S.roofs > 0.5 && z >= 0.85) { var K0 = SKETCH(p.vi), hs = clamp(7.5 * z + 6, 10, 30), x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; K0.houses.forEach(function (hh) { var q = toS(hh.x, hh.y); x0 = Math.min(x0, q[0] - hs * 0.6); y0 = Math.min(y0, q[1] - hs * 0.8); x1 = Math.max(x1, q[0] + hs * 0.6); y1 = Math.max(y1, q[1] + hs * 0.3); }); var r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; take(r); shown.push({ p: p, sx: (x0 + x1) / 2, sy: (y0 + y1) / 2, r: r }); return; }
        var far = z < 0.32 && S.nameCull > 0.5, small = far && !p.big && p.kind !== 'wreck', r2 = picture(vg, p.kind, sx, sy, ks * (small ? 0.55 : 1), small); take(r2); shown.push({ p: p, sx: sx, sy: sy, r: r2 });
      });
      var minRank = S.nameCull > 0.5 ? (z < 0.3 ? 5 : z < 0.5 ? 2 : -1) : -1;
      shown.forEach(function (o) { if (o.p.rank < minRank && o.p.kind !== 'wreck') return; var id = o.p.vi != null ? 'v' + o.p.vi : o.p.kind, nm = nameOf(id, o.p.name); note(label(vg, nm, o.sx, o.sy, o.r, ls * (o.p.big ? 1.05 : 0.95), false, free, take), id, nm, null); });
      if (S.areaNames > 0.01) {   /* the world's names: the sounds from the middle zoom, the bays a little closer, the rest close in; the water's in the sea's ink */
        var ZK = { sound: 0.4, bay: 0.62, fell: 0.7, wood: 0.78, beach: 0.85, headland: 0.85, meadow: 0.95, tarn: 0.95, skerry: 0.9 }, WET = { sound: 1, bay: 1, tarn: 1 };
        FEATS.slice().sort(function (a, b) { return (ZK[a.kind] || 9) - (ZK[b.kind] || 9) || b.size - a.size; }).forEach(function (f) { var zk = ZK[f.kind]; if (zk == null || z < zk || !f.name) return; if (fogVis(f.x, f.y) < 0.6) return; var s = toS(f.x, f.y); if (!inView(s[0], s[1], 0)) return;
          var a = Math.min(1, S.areaNames * 1.3) * sm(zk, zk + 0.25, z), sz = clamp(10 + 2.2 * z + (f.kind === 'sound' ? 2 : 0), 11, 17), nm = nameOf(f.id, f.name);
          note(italicFit(vg, nm, s[0], s[1], sz, a, free, take, WET[f.kind] ? 'rgba(36,74,92,' + a + ')' : null), f.id, nm, f.gloss); }); }
      var zw = 1 - sm(0.35, 0.6, z);
      if (S.regionA > 0.01 && zw > 0.01) (env.waters || []).forEach(function (wt) { var WN = env.waterNames || {}, key = wt.ring === 0 ? 'home' : wt.dir, nm = WN[key]; if (!nm || (key !== 'home' && !HEARD[key])) return; var s = toS(wt.cx, wt.cy + (key === 'home' ? -wt.r * 0.92 : 0)); spacedFit(vg, nm.toUpperCase(), s[0], s[1], key === 'east' || key === 'west' ? 15 : 17, 5, S.regionA * zw, free, take, false); });
      if (S.bigName > 0.01) { var zb = 1 - sm(0.22, 0.32, z), hw = (env.waters || []).filter(function (wt) { return wt.ring === 0; })[0]; if (zb > 0.01 && hw) { var sb = toS(hw.cx - 200, hw.cy + hw.r * 1.23); spacedFit(vg, 'SKARGARD', sb[0], sb[1], 40, 14, S.bigName * zb, null, take, false); } }
      if (ship && fogVis(ship.x, ship.y) > 0.3) { var ss = toS(ship.x, ship.y); boatMark(vg, ss[0], ss[1], clamp(ks * 1.1, 0.7, 1.6)); }
      OWN.forEach(function (o) { if (fogVis(o.x, o.y) < 0.4) return; var q = toS(o.x, o.y); if (!inView(q[0], q[1])) return; vg.save(); vg.translate(q[0], q[1]); vg.fillStyle = '#9a948a'; vg.strokeStyle = '#2e2216'; vg.lineWidth = 1.2; vg.beginPath(); vg.moveTo(-3, 3); vg.lineTo(-3.5, -6); vg.quadraticCurveTo(0, -10, 3.5, -6); vg.lineTo(3, 3); vg.closePath(); vg.fill(); vg.stroke(); vg.restore(); if (o.name) { var r0 = { x: q[0] - 5, y: q[1] - 10, w: 10, h: 13 }; take(r0); note(label(vg, nameOf('own' + o.key, o.name), q[0], q[1], r0, ls, false, free, take), 'own' + o.key, nameOf('own' + o.key, o.name), null); } });
      if (GOAL) { var gq = toS(GOAL.x, GOAL.y); vg.save(); vg.strokeStyle = 'rgba(238,226,194,0.9)'; vg.lineWidth = 4; vg.beginPath(); vg.arc(gq[0], gq[1], 7, 0, 7); vg.stroke(); vg.strokeStyle = '#b8402c'; vg.lineWidth = 1.8; vg.stroke(); vg.beginPath(); vg.moveTo(gq[0] - 3, gq[1]); vg.lineTo(gq[0] + 3, gq[1]); vg.moveTo(gq[0], gq[1] - 3); vg.lineTo(gq[0], gq[1] + 3); vg.stroke(); vg.restore(); }   /* the Star-road's mark (the right button) */
      MARKS.forEach(function (m) { var q = toS(m.x, m.y); if (inView(q[0], q[1])) markIcon(vg, m.icon, q[0], q[1], 1); });
      var hp = toS(hero.x, hero.y); heroMark(vg, hp[0], hp[1], clamp(ks / 0.744, 0.7, 1.6), hero.face);
      if (HOVER && !MARKER && !renaming) { var L = labelAt(HOVER[0], HOVER[1]); if (L) { vg.save(); vg.strokeStyle = 'rgba(184,64,44,0.7)'; vg.lineWidth = 1; vg.strokeRect(L.r.x - 1, L.r.y - 1, L.r.w + 2, L.r.h + 2);
        var t2 = L.gloss ? L.gloss + '  \u00b7  click to rename' : 'click to rename'; vg.font = 'italic 14px ' + FONT; var tw = Math.max(vg.measureText(t2).width, 40) + 18, bx = clamp(L.r.x, VP.x + 4, VP.x + VP.w - tw - 4), by = L.r.y + L.r.h + 4; vg.fillStyle = 'rgba(40,30,22,0.88)'; vg.fillRect(bx, by, tw, 24); vg.fillStyle = '#f1e6cc'; vg.fillText(t2, bx + 9, by + 16); vg.restore(); } }
      if (renaming) drawRenamer();
    }
    function label(g, t, sx, sy, r, sz, italic, free, take, alpha) {
      g.font = (italic ? 'italic ' : '600 ') + sz.toFixed(1) + 'px ' + FONT; var tw = g.measureText(t).width, h = sz * 0.95, tries = [[sx - tw / 2, r.y - 3 - h], [sx - tw / 2, r.y + r.h + 2], [r.x + r.w + 3, sy - h / 2], [r.x - tw - 3, sy - h / 2]];
      for (var i = 0; i < tries.length; i++) { var x = tries[i][0], y = tries[i][1], rr = { x: x - 2, y: y - 1, w: tw + 4, h: h + 3 }; if (free(rr)) { take(rr); g.save(); g.globalAlpha = alpha == null ? 1 : alpha; g.textAlign = 'left'; g.lineJoin = 'round'; g.lineWidth = 3.4; g.strokeStyle = 'rgba(238,226,194,0.88)'; g.strokeText(t, x, y + h * 0.82); g.fillStyle = italic ? '#4a3a2a' : '#3a2614'; g.fillText(t, x, y + h * 0.82); g.restore(); return rr; } }
    }
    function spacedFit(g, t, x, y, sz, sp, a, free, take, isle) {
      g.save(); g.font = '600 ' + sz + 'px ' + FONT; var L = t.split(''), ws = L.map(function (ch) { return g.measureText(ch).width + sp; }), tw = ws.reduce(function (s, v) { return s + v; }, 0), r = { x: x - tw / 2, y: y - sz, w: tw, h: sz * 1.2 };
      if (free && !free(r)) { g.restore(); return; } take(r);
      g.textAlign = 'center'; if (isle) { g.lineJoin = 'round'; g.lineWidth = 3; g.strokeStyle = 'rgba(238,226,194,' + (0.7 * a) + ')'; }
      g.fillStyle = 'rgba(70,48,28,' + a + ')'; var xx = x - tw / 2; L.forEach(function (ch, i) { if (isle) g.strokeText(ch, xx + ws[i] / 2, y); g.fillText(ch, xx + ws[i] / 2, y); xx += ws[i]; }); g.restore(); return r;
    }
    function italicFit(g, t, x, y, sz, a, free, take, col) {
      g.save(); g.font = 'italic 600 ' + sz.toFixed(1) + 'px ' + FONT; var tw = g.measureText(t).width, r = { x: x - tw / 2 - 2, y: y - sz, w: tw + 4, h: sz * 1.25 }; if (!free(r)) { g.restore(); return; } take(r);
      g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 3.6; g.strokeStyle = 'rgba(238,226,194,' + (0.8 * a) + ')'; g.strokeText(t, x, y); g.fillStyle = col || ('rgba(58,40,24,' + a + ')'); g.fillText(t, x, y); g.restore(); return r;
    }
    function picture(g, kind, x, y, zz, dot) {
      g.save(); g.translate(x, y); g.lineJoin = 'round'; g.lineCap = 'round';
      if (dot) { g.fillStyle = '#7a5434'; g.strokeStyle = '#2e2216'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 2.6, 0, 7); g.fill(); g.stroke(); g.restore(); return { x: x - 4, y: y - 4, w: 8, h: 8 }; }
      g.scale(zz, zz); var W = 10;
      if (kind === 'house' || kind === 'church' || kind === 'ruin' || kind === 'burnt') {
        var burnt = kind === 'burnt' || kind === 'ruin';
        g.fillStyle = burnt ? '#5a4a40' : '#9a6a3c'; g.strokeStyle = '#2e2216'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-9, 0); g.quadraticCurveTo(0, -3, 9, 0); g.lineTo(7, -6); g.quadraticCurveTo(0, -9, -7, -6); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = burnt ? '#2a2420' : '#6e4a2c'; g.beginPath(); g.rect(-8, 0, 16, 4); g.fill(); g.stroke();
        if (kind === 'church') { g.beginPath(); g.moveTo(0, -8); g.lineTo(0, -15); g.moveTo(-3, -12); g.lineTo(3, -12); g.stroke(); }
        if (burnt) { g.strokeStyle = 'rgba(60,56,52,0.7)'; g.beginPath(); g.moveTo(2, -7); g.quadraticCurveTo(5, -13, 1, -18); g.stroke(); }
      } else if (kind === 'wreck') {
        g.strokeStyle = '#2e2216'; g.lineWidth = 1.3; g.fillStyle = '#8a6040'; g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(-2, 5, 10, -1); g.quadraticCurveTo(12, -6, 9, -9); g.quadraticCurveTo(8, -4, 4, -3); g.quadraticCurveTo(-4, -3, -10, 0); g.closePath(); g.fill(); g.stroke();
        [-5, -1, 3].forEach(function (rx) { g.beginPath(); g.moveTo(rx, -3.2); g.quadraticCurveTo(rx + 1, -8, rx + 3, -9); g.stroke(); }); g.beginPath(); g.moveTo(1, -2); g.lineTo(-9, -8); g.stroke();
      } else if (kind === 'cave') {
        g.fillStyle = '#8a8478'; g.strokeStyle = '#2e2216'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-10, 2); g.quadraticCurveTo(-9, -10, 0, -11); g.quadraticCurveTo(9, -10, 10, 2); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#2a2420'; g.beginPath(); g.moveTo(-4.5, 2); g.quadraticCurveTo(-4, -5, 0, -5.5); g.quadraticCurveTo(4, -5, 4.5, 2); g.closePath(); g.fill();
      } else if (kind === 'crypt') {
        g.fillStyle = '#9a948a'; g.strokeStyle = '#2e2216'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-5, 2); g.lineTo(-5, -7); g.quadraticCurveTo(0, -12, 5, -7); g.lineTo(5, 2); g.closePath(); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(0, -6); g.lineTo(0, -1); g.moveTo(-2.2, -4); g.lineTo(2.2, -4); g.stroke();
      } else if (kind === 'shelter') {
        g.fillStyle = '#8a8478'; g.strokeStyle = '#2e2216'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-9, 2); g.lineTo(-6, -7); g.lineTo(6, -9); g.lineTo(9, 2); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#3a3430'; g.fillRect(-3, -3, 6, 5);
      }
      g.restore(); return { x: x - W * zz, y: y - 12 * zz, w: 2 * W * zz, h: 16 * zz };
    }
    function pencil(g, kind, x, y, zz, a) {
      g.save(); g.translate(x, y); g.scale(zz, zz); g.globalAlpha = a; g.strokeStyle = '#5a5248'; g.lineWidth = 1.1; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
      if (kind === 'cave') { g.moveTo(-10, 2); g.quadraticCurveTo(-9, -10, 0, -11); g.quadraticCurveTo(9, -10, 10, 2); g.moveTo(-4.5, 2); g.quadraticCurveTo(-4, -5, 0, -5.5); g.quadraticCurveTo(4, -5, 4.5, 2); }
      else if (kind === 'crypt') { g.moveTo(-5, 2); g.lineTo(-5, -7); g.quadraticCurveTo(0, -12, 5, -7); g.lineTo(5, 2); g.moveTo(0, -6); g.lineTo(0, -1); g.moveTo(-2.2, -4); g.lineTo(2.2, -4); }
      else { g.moveTo(-9, 0); g.quadraticCurveTo(0, -3, 9, 0); g.lineTo(7, -6); g.quadraticCurveTo(0, -9, -7, -6); g.closePath(); g.moveTo(-8, 0); g.lineTo(-8, 4); g.lineTo(8, 4); g.lineTo(8, 0); if (kind === 'church') { g.moveTo(0, -8); g.lineTo(0, -15); g.moveTo(-3, -12); g.lineTo(3, -12); } }
      g.stroke(); g.restore();
    }
    function sketchHouse(g, x, y, k, kind, flip) {
      g.save(); g.translate(x, y); g.scale(flip ? -k : k, k); g.lineJoin = 'round'; g.lineCap = 'round';
      var big = kind === 'hall', w = big ? 13 : 9, ruin = kind === 'ruin';
      g.fillStyle = ruin ? '#6a5a4e' : big ? '#8a6438' : '#a07a4c'; g.strokeStyle = '#2e2216'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(-w, 0); g.quadraticCurveTo(0, -2.5, w, 0); g.lineTo(w - 2, -7); g.quadraticCurveTo(0, -10.5, -w + 2, -7); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = ruin ? '#3a3430' : '#c8a878'; g.beginPath(); g.rect(-w + 1, 0, 2 * w - 2, 4); g.fill(); g.stroke();
      if (!ruin) { g.fillStyle = '#3a2a1c'; g.fillRect(-1.6, 0.6, 3.2, 3.4); }
      if (kind === 'church') { g.beginPath(); g.moveTo(0, -9); g.lineTo(0, -16); g.moveTo(-3, -13); g.lineTo(3, -13); g.stroke(); }
      if (big) { g.beginPath(); g.moveTo(-w + 2, -7); g.lineTo(-w + 0.5, -10); g.moveTo(w - 2, -7); g.lineTo(w - 0.5, -10); g.stroke(); }
      if (ruin) { g.strokeStyle = 'rgba(46,34,22,0.8)'; g.beginPath(); g.moveTo(-3, -8); g.lineTo(-1, -3); g.moveTo(3, -8.5); g.lineTo(2, -4); g.stroke(); }
      g.restore();
    }
    function markIcon(g, icon, x, y, k) {   /* your own marks: simple icons in red-brown ink with a paper glow, the same size at any zoom (Colin, AD's) */
      g.save(); g.translate(x, y); g.scale(k, k); g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
      if (icon === 'flag') { g.moveTo(-4, 9); g.lineTo(-4, -9); g.moveTo(-4, -9); g.lineTo(7, -6); g.lineTo(-4, -2); }
      else if (icon === 'cross') { g.moveTo(-6, -6); g.lineTo(6, 6); g.moveTo(6, -6); g.lineTo(-6, 6); }
      else if (icon === 'star') { for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.4 : 8; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); }
      else if (icon === 'skull') { g.arc(0, -2, 6.5, Math.PI * 0.85, Math.PI * 0.15); g.lineTo(3.5, 7); g.lineTo(-3.5, 7); g.closePath(); g.moveTo(-1.2, -2); g.arc(-2.6, -2, 1.4, 0, 7); g.moveTo(4, -2); g.arc(2.6, -2, 1.4, 0, 7); }
      else if (icon === 'anchor') { g.moveTo(0, -8); g.lineTo(0, 8); g.moveTo(-5, -4); g.lineTo(5, -4); g.moveTo(-7, 3); g.quadraticCurveTo(-6, 8, 0, 8); g.quadraticCurveTo(6, 8, 7, 3); g.moveTo(1.8, -8); g.arc(0, -8, 1.8, 0, 7); }
      else if (icon === 'house') { g.moveTo(-7, 7); g.lineTo(-7, -1); g.lineTo(0, -8); g.lineTo(7, -1); g.lineTo(7, 7); g.closePath(); g.moveTo(-2, 7); g.lineTo(-2, 2); g.lineTo(2, 2); g.lineTo(2, 7); }
      else if (icon === 'tent') { g.moveTo(-8, 7); g.lineTo(0, -8); g.lineTo(8, 7); g.closePath(); g.moveTo(0, -8); g.lineTo(0, 7); }
      else if (icon === 'fish') { g.moveTo(-8, 0); g.quadraticCurveTo(-2, -6, 5, 0); g.quadraticCurveTo(-2, 6, -8, 0); g.moveTo(5, 0); g.lineTo(9, -4); g.lineTo(9, 4); g.closePath(); }
      else if (icon === 'chest') { g.rect(-7, -3, 14, 9); g.moveTo(-7, -3); g.quadraticCurveTo(0, -9, 7, -3); g.moveTo(0, 0); g.lineTo(0, 3); }
      else if (icon === 'eye') { g.moveTo(-8, 0); g.quadraticCurveTo(0, -7, 8, 0); g.quadraticCurveTo(0, 7, -8, 0); g.moveTo(2.6, 0); g.arc(0, 0, 2.6, 0, 7); }
      g.strokeStyle = 'rgba(238,226,194,0.9)'; g.lineWidth = 5; g.stroke(); g.fillStyle = 'rgba(184,64,44,0.2)'; if (icon === 'star' || icon === 'house' || icon === 'tent' || icon === 'chest' || icon === 'fish') g.fill(); g.strokeStyle = '#8a2e1e'; g.lineWidth = 2; g.stroke();
      g.restore();
    }
    var PAL = { x: 600 - ICONS.length * 17, y: 716, w: 34, h: 26 };   /* the markers' row on the oak under the chart (mine: the picker's toolbar in the game's clothes) */
    function palAt(sx, sy) { if (sy < PAL.y - 2 || sy > PAL.y + PAL.h + 2) return -1; var k = Math.floor((sx - PAL.x) / PAL.w); return k >= 0 && k < ICONS.length ? k : -1; }
    function drawPalette() {
      vg.save(); vg.font = 'italic 13px ' + FONT; vg.fillStyle = 'rgba(232,216,176,0.8)'; vg.textAlign = 'right'; vg.fillText(MARKER ? 'Click the chart to set a mark, a mark to take it away' : 'Your marks', PAL.x - 12, PAL.y + 17); vg.textAlign = 'left';
      ICONS.forEach(function (ic, k) { var x = PAL.x + k * PAL.w, on = MARKER === ic, hv = HOVER && palAt(HOVER[0], HOVER[1]) === k; vg.fillStyle = on ? 'rgba(234,208,138,0.95)' : hv ? 'rgba(234,220,184,0.75)' : 'rgba(234,220,184,0.5)'; vg.fillRect(x + 2, PAL.y, PAL.w - 4, PAL.h); vg.strokeStyle = on ? '#ead08a' : 'rgba(30,18,10,0.8)'; vg.lineWidth = on ? 2 : 1; vg.strokeRect(x + 2.5, PAL.y + 0.5, PAL.w - 5, PAL.h - 1); markIcon(vg, ic, x + PAL.w / 2, PAL.y + PAL.h / 2, 0.85); });
      vg.restore();
    }
    var renaming = null;   /* a name being given: typed on the map itself, Enter keeps it, Esc lets it go, an empty name gives back the world's */
    function drawRenamer() { var L = renaming, sz = 16; vg.save(); vg.font = '600 ' + sz + 'px ' + FONT; var tw = Math.max(120, vg.measureText(L.text).width + 26), x = clamp(L.r.x - 6, VP.x + 4, VP.x + VP.w - tw - 4), y = L.r.y - 4;
      vg.fillStyle = 'rgba(244,234,206,0.97)'; vg.fillRect(x, y, tw, 28); vg.strokeStyle = '#b8402c'; vg.lineWidth = 1.5; vg.strokeRect(x + 0.5, y + 0.5, tw - 1, 27); vg.fillStyle = '#3a2614'; vg.fillText(L.text, x + 10, y + 20);
      if ((Date.now() / 530 | 0) % 2 === 0) { var cxp = x + 10 + vg.measureText(L.text).width + 1; vg.fillRect(cxp, y + 6, 1.5, 17); }
      vg.font = 'italic 12px ' + FONT; vg.lineJoin = 'round'; vg.lineWidth = 3; vg.strokeStyle = 'rgba(40,30,22,0.8)'; vg.strokeText('Enter to keep it, Esc to leave it', x, y + 42); vg.fillStyle = 'rgba(244,234,206,0.95)'; vg.fillText('Enter to keep it, Esc to leave it', x, y + 42); vg.restore(); dirty = true; }
    function labelAt(sx, sy) { for (var i = LABELS.length - 1; i >= 0; i--) { var l = LABELS[i]; if (sx > l.r.x && sx < l.r.x + l.r.w && sy > l.r.y && sy < l.r.y + l.r.h) return l; } return null; }
    function markAt(sx, sy) { for (var k = 0; k < MARKS.length; k++) { var q = toS(MARKS[k].x, MARKS[k].y); if (Math.hypot(q[0] - sx, q[1] - sy) < 11) return k; } return -1; }
    function boatMark(g, x, y, k) { g.save(); g.translate(x, y); g.scale(k, k); g.fillStyle = '#7a5434'; g.strokeStyle = '#2a2016'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-7, -1); g.quadraticCurveTo(0, 3, 7, -1); g.lineTo(6, -3); g.quadraticCurveTo(0, -0.5, -6, -3); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    function tree(g, x, y, zz) { if (zz < 0.05) return; var s = 2.4 * zz; g.globalAlpha = Math.min(1, zz * 1.4); g.fillStyle = '#4e6e3c'; g.strokeStyle = '#2c3020'; g.lineWidth = 0.7 * zz; g.beginPath(); g.moveTo(x, y - s * 2.2); g.lineTo(x + s, y); g.lineTo(x - s, y); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + s * 0.6); g.stroke(); g.globalAlpha = 1; }
    function heroMark(g, x, y, k, face) { g.save(); g.translate(x, y); g.rotate((face == null ? -Math.PI / 2 : face) + Math.PI / 2); g.scale(k, k); g.fillStyle = '#b8402c'; g.strokeStyle = '#2a1a10'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 6); g.lineTo(0, 2.5); g.lineTo(-6, 6); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    function oak(g, x, y, w, h) {
      var gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#5a3a24'); gr.addColorStop(1, '#3e281a'); g.fillStyle = gr; g.fillRect(x, y, w, h);
      g.strokeStyle = 'rgba(30,18,10,0.5)'; g.lineWidth = 1; for (var k = 0; k < 40; k++) { var yy = y + 3 + k * (h - 6) / 40; g.beginPath(); g.moveTo(x + 2, yy + Math.sin(k) * 1.5); g.bezierCurveTo(x + w * 0.3, yy - 2, x + w * 0.7, yy + 2, x + w - 2, yy); g.stroke(); }
      g.strokeStyle = '#1e140c'; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(function (c) { var c2x = c[0], c2y = c[1], sx = c[2], sy = c[3]; g.fillStyle = '#4a4c52'; g.strokeStyle = '#1a1a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(c2x, c2y); g.lineTo(c2x + sx * 46, c2y); g.lineTo(c2x + sx * 38, c2y + sy * 10); g.lineTo(c2x + sx * 10, c2y + sy * 10); g.lineTo(c2x + sx * 10, c2y + sy * 38); g.lineTo(c2x, c2y + sy * 46); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#8a8c92'; [[22, 5], [5, 22]].forEach(function (ab) { g.beginPath(); g.arc(c2x + sx * ab[0], c2y + sy * ab[1], 2.6, 0, 7); g.fill(); }); });
    }
    function rose(g, x, y) {
      g.save(); g.translate(x, y); g.lineJoin = 'round'; g.strokeStyle = 'rgba(58,40,24,0.75)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 26, 0, 7); g.stroke();
      for (var k = 0; k < 8; k++) { var L = k % 2 ? 22 : 36, w = k % 2 ? 4 : 6; g.save(); g.rotate(k * Math.PI / 4); g.fillStyle = k === 0 ? '#b8402c' : '#e9dcbc'; g.beginPath(); g.moveTo(0, -L); g.lineTo(w, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.fillStyle = k === 0 ? '#7a2a1a' : '#5a4630'; g.beginPath(); g.moveTo(0, -L); g.lineTo(-w, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.strokeStyle = '#3a2614'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-w, 0); g.lineTo(0, -L); g.lineTo(w, 0); g.stroke(); g.restore(); }
      g.font = 'bold 15px ' + FONT; g.textAlign = 'center'; g.fillStyle = '#3a2614'; g.fillText('N', 0, -40); g.restore();
    }
    // ---- the fade-in of islands reached
    function reveal(list) {   /* the map as it was laid over the map as it is now, wiped away from the first island outward (Robin: "fades in the next time the map opens") */
      if (!list.length) return; ensureView(); draw(true); bloomCv.getContext('2d').clearRect(0, 0, 1200, 750); bloomCv.getContext('2d').drawImage(view, 0, 0);
      list.forEach(function (k) { KNOW[k] = 2; var q = ISLES[k]; dirtyAround(q.x, q.y, q.r + S.fogReach * 2.2 + 40); }); G.fogKey = null;
      var q0 = ISLES[list[0]], far = q0.r; list.forEach(function (k) { var q = ISLES[k]; far = Math.max(far, Math.hypot(q.x - q0.x, q.y - q0.y) + q.r); });
      BLOOM = { i: list[0], far: far, t0: Date.now() };
    }
    var bloomTmp = null;
    function bloomOver() {
      var q = ISLES[BLOOM.i], t = (Date.now() - BLOOM.t0) / (S.fadeSecs * 1000); if (t >= 1) { BLOOM = null; dirty = true; return; }
      var e = 1 - Math.pow(1 - t, 2.2), s = toS(q.x, q.y), R = ((BLOOM.far + S.fogReach * 1.6) * z + 120) * e; if (!bloomTmp) { bloomTmp = document.createElement('canvas'); bloomTmp.width = 1200; bloomTmp.height = 750; } var g = bloomTmp.getContext('2d');
      g.globalCompositeOperation = 'copy'; g.globalAlpha = 1; g.drawImage(bloomCv, 0, 0); g.globalCompositeOperation = 'destination-out'; var gr = g.createRadialGradient(s[0], s[1], 0, s[0], s[1], Math.max(1, R)); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.62, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 1200, 750);
      g.globalAlpha = sm(0.55, 1, t); g.fillRect(0, 0, 1200, 750); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      vg.drawImage(bloomTmp, 0, 0);
    }
    // ---- what the game tells the map
    function zoomAt(f, sx, sy) { if (!ready || BLOOM) return; var a = toW(sx, sy); z *= f; clampView(); var b = toW(sx, sy); cx += a[0] - b[0]; cy += a[1] - b[1]; clampView(); dirty = true; }
    var drag = null;
    function click(sx, sy) {
      if (renaming) { renaming = null; dirty = true; return; }
      var k = palAt(sx, sy); if (k >= 0) { MARKER = MARKER === ICONS[k] ? null : ICONS[k]; dirty = true; return; }
      if (sx < VP.x || sy < VP.y || sx > VP.x + VP.w || sy > VP.y + VP.h) return;
      var mk = markAt(sx, sy); if (mk >= 0) { MARKS.splice(mk, 1); dirty = true; return; }
      if (MARKER) { var q = toW(sx, sy); MARKS.push({ x: Math.round(q[0]), y: Math.round(q[1]), icon: MARKER }); dirty = true; return; }
      var L = labelAt(sx, sy); if (L) { var f = FEATS.filter(function (ff) { return ff.id === L.id; })[0], base = L.id.indexOf('isle') === 0 ? ISLES[+L.id.slice(4)].name : /^v\d+$/.test(L.id) ? PL.villages[+L.id.slice(1)].name : f ? f.name : L.name; renaming = { id: L.id, r: L.r, text: L.name, base: base }; dirty = true; }
    }
    var api = {
      view: function () { ensureView(); return view; }, ready: function () { return ready; }, busy: function () { return preparing || working; }, prepare: prepare, draw: draw, settings: S,
      setHero: function (x, y, face) { if (Math.abs(x - hero.x) + Math.abs(y - hero.y) > 0.4 || Math.abs((face || 0) - (hero.face || 0)) > 0.05) dirty = true; hero.x = x; hero.y = y; hero.face = face;
        var best = 1e9, bi = -1; ISLES.forEach(function (q) { var dd = Math.hypot(x - q.x, y - q.y) - q.r; if (dd < best) { best = dd; bi = q.i; } }); if (best > S.fogReach) bi = -1; if (bi !== HERE) { HERE = bi; if (G) { G.fogKey = null; paintedKey = null; } dirty = true; } },
      setShip: function (s) { ship = s ? { x: s.x, y: s.y } : null; },
      know: function (i) { return KNOW[i]; }, knowAll: function () { return Array.from(KNOW); },
      setKnow: function (i, k) { if (KNOW[i] === k) return; KNOW[i] = k; if (G) { G.fogKey = null; paintedKey = null; } dirty = true; },
      loadKnow: function (a) { (a || []).forEach(function (k, i) { if (i < KNOW.length) KNOW[i] = k; }); if (G) { G.fogKey = null; paintedKey = null; } dirty = true; },
      stamp: function (X, Y) { var n = trailPts.length; if (n >= 2 && Math.hypot(trailPts[n - 2] - X, trailPts[n - 1] - Y) < S.sailReach * 0.35) return false; trailPts.push(Math.round(X), Math.round(Y)); if (G) { stampAt(X, Y); G.TB = blur(G.TR, G.w, G.h, 2, 1); dirtyAround(X, Y, S.sailReach + 30); } return true; },
      trail: function () { return trailPts.slice(); }, loadTrail: function (a) { trailPts = (a || []).slice(); if (G) replayTrail(); },
      reveal: function (list) { if (ready) reveal(list); else list.forEach(function (k) { KNOW[k] = 2; }); },
      isleOf: isleOf, isles: ISLES,
      centerOn: function (x, y, zz) { cx = x; cy = y; z = zz == null ? z : zz; clampView(); dirty = true; },
      wheel: function (dy, sx, sy) { zoomAt(Math.exp(-dy * 0.0015), sx, sy); },
      zoomBy: function (f) { zoomAt(f, 600, 375); },
      down: function (sx, sy) { if (!ready || BLOOM) return; drag = { sx: sx, sy: sy, cx: cx, cy: cy, moved: false }; },
      move: function (sx, sy) { if (!drag) return; if (Math.hypot(sx - drag.sx, sy - drag.sy) > 4) drag.moved = true; if (drag.moved) { cx = drag.cx - (sx - drag.sx) / z; cy = drag.cy - (sy - drag.sy) / z; clampView(); dirty = true; } },
      up: function (sx, sy) { var d = drag; drag = null; if (!d || d.moved || sx == null) return; click(sx, sy); }, dragging: function () { return !!drag; },
      hover: function (sx, sy) { var h = sx == null ? null : [sx, sy]; if ((h && HOVER && h[0] === HOVER[0] && h[1] === HOVER[1]) || (!h && !HOVER)) return; HOVER = h; dirty = true; },
      key: function (e) {   /* while a name is typed every key is the map's; returns true when it took the key */
        if (!renaming) { if (e.key === 'Escape' && MARKER) { MARKER = null; dirty = true; return true; } return false; }
        if (e.key === 'Enter') { var v = renaming.text.trim(); if (v && v !== renaming.base) RENAMED[renaming.id] = v; else delete RENAMED[renaming.id]; renaming = null; }
        else if (e.key === 'Escape') renaming = null;
        else if (e.key === 'Backspace') renaming.text = renaming.text.slice(0, -1);
        else if (e.key && e.key.length === 1 && renaming.text.length < 28) renaming.text += e.key;
        dirty = true; return true; },
      renaming: function () { return !!renaming; }, marker: function () { return MARKER; },
      renamed: function () { return Object.assign({}, RENAMED); }, loadRenamed: function (o) { RENAMED = Object.assign({}, o || {}); dirty = true; },
      marks: function () { return MARKS.map(function (m) { return { x: m.x, y: m.y, icon: m.icon }; }); }, loadMarks: function (a) { MARKS = (a || []).filter(function (m) { return m && ICONS.indexOf(m.icon) >= 0; }).map(function (m) { return { x: m.x, y: m.y, icon: m.icon }; }); dirty = true; },
      heard: function (key) { if (!HEARD[key]) { HEARD[key] = 1; dirty = true; } }, heardAll: function () { return Object.keys(HEARD); }, loadHeard: function (a) { HEARD = {}; (a || []).forEach(function (k) { HEARD[k] = 1; }); dirty = true; },
      setOwn: function (list) { var k = JSON.stringify(list || []); if (k !== api._own) { api._own = k; OWN = list || []; dirty = true; } },
      setGoal: function (g) { var k = g ? Math.round(g.x) + ',' + Math.round(g.y) : ''; if (k !== api._goal) { api._goal = k; GOAL = g; dirty = true; } },
      worldAt: function (sx, sy) { return sx < VP.x || sy < VP.y || sx > VP.x + VP.w || sy > VP.y + VP.h ? null : toW(sx, sy); }, inPanel: function (sx, sy) { return sx >= 42 && sy >= 21 && sx <= 1158 && sy <= 729 || palAt(sx, sy) >= 0; },
      features: function () { return FEATS; }, nameOf: function (id, d) { return nameOf(id, d); },
      blooming: function () { return !!BLOOM; }, touch: function () { dirty = true; }
    };
    return api;
  }
  return { create: create, SETTINGS: SETTINGS };
})();
if (typeof module !== 'undefined') module.exports = WorldMap;
