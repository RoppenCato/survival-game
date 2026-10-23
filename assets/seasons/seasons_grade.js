// seasons_grade.js: the seasons of home's meadow as Robin picked them (2026-10-23: spring A fresh green, autumn B fiery, winter A deep
// snow; docs/seasons.md). The grades of the board he picked from, as one module the game can call when it bakes, never a frame at a
// time. Works in the browser and in Node; every function works on ImageData (d = data array, w, h) or a 2d context.
//   Seasons.gradeSprite(d, w, h, kind, season, capped)  a standing thing's picture, once a season: false = do not draw it this season;
//                                                    capped: the piece has its own snow cap picture (the set 'snowcaps': <name>_snow), so
//                                                    winter leaves the outline snow off and the game draws the cap over it
//   Seasons.deepen(d, w, h, kind)                  winter's copy with deeper snow, for while it snows (laid over the plain copy at the fresh snow's strength)
//   Seasons.winterPlant(kind, v)                   winter's picture name for a bush, heather, fern, tall grass, reeds or juniper (set 'plants_winter')
//   Seasons.bareTree(kind)                           winter's picture name for an oak or a birch (the bare trees, set 'trees_bare')
//   Seasons.gradeGround(d, w, h, season, water)      a baked ground chunk, once a season; water(x, y) true where the chunk's pixel is sea or
//                                                    shallows (the game's own heights: elevAt < 0), for the ice at the shore in winter
//   Seasons.sprinkle(ctx, season, w, h, land, ox, oy) the season's small marks drawn into a chunk: spring's anemones, autumn's fallen
//                                                    leaves; land(x, y) true on grass (not the beach, not the water); ox, oy the chunk's world origin (so the
//                                                    marks stay put across chunks and bakes)
//   Seasons.grassInk(base, season)                   the living grass's colours for the season (a copy of GRASS_INK with its colours graded)
//   Seasons.light(ctx, w, h, season)                 the season's light over the frame: two cheap fills, no pixel work
(function (root) {
  function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0;
    if (mx !== mn) { var d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
  function hsl2rgb(h, s, l) { h = ((h % 360) + 360) % 360 / 360; var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    function f(t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function mix(a, b, t) { return a + (b - a) * t; }
  function hash(x, y, s) { var n = Math.sin(x * 12.9898 + y * 78.233 + s * 37.7) * 43758.5453; return n - Math.floor(n); }
  function vn(x, y, s) { var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
    return mix(mix(hash(xi, yi, s), hash(xi + 1, yi, s), u), mix(hash(xi, yi + 1, s), hash(xi + 1, yi + 1, s), u), w); }
  var SNOW = [244, 247, 250], SNOWSH = [186, 199, 218];
  function snowAt(l) { var t = clamp((l - 0.25) / 0.6, 0, 1); return [mix(SNOWSH[0], SNOW[0], t), mix(SNOWSH[1], SNOW[1], t), mix(SNOWSH[2], SNOW[2], t)]; }
  // what each picked season does to a green: [target hue, saturation times, lightness plus], by kind
  var LEAF = {
    spring: { def: [86, 1.12, 0.06], birch: [82, 1.15, 0.1], oak: [90, 1.1, 0.06], pine: [128, 1.0, 0.03], grass: [84, 1.1, 0.05] },
    autumn: { def: [28, 1.05, 0.0], birch: [34, 1.3, 0.05], oak: [6, 1.2, -0.05], pine: [130, 0.8, -0.04], bush: [356, 1.1, -0.05], berryBush: [352, 1.0, -0.07], tallGrass: [38, 0.85, 0.06], wildHerbs: [22, 0.8, 0.0], grass: [42, 0.85, 0.02] }
  };
  var VARY = { autumn: { oak: 26, birch: 14, def: 18 }, spring: { def: 6 } };   // how much the hue wanders across a crown (autumn's are mottled)
  var SNOW_DEPTH = { pine: 10, rock: 6, rockFormation: 8, boulder: 7, bush: 5, berryBush: 5, tallGrass: 3, wildHerbs: 3, oak: 2, birch: 2, def: 5 };   // how deep the snow lies under a thing's upper edges, in picture pixels at 4 px a unit
  function isLeaf(h, s, l) { return h > 50 && h < 175 && s > 0.16 && l > 0.1; }
  function regreen(d, i, T, x, y, vary) {
    var c = rgb2hsl(d[i], d[i + 1], d[i + 2]); if (!isLeaf(c[0], c[1], c[2])) return false;
    var jit = vary ? (vn(x / 6, y / 6, 3) - 0.5) * vary : 0, o = hsl2rgb(T[0] + jit, clamp(c[1] * T[1], 0, 1), clamp(c[2] + T[2], 0, 0.95));
    d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; return true;
  }
  function snowOn(d, w, h, depth, litK) {     // snow under a thing's upper edges and on its sunlit tops; the rest a little colder
    for (var x = 0; x < w; x++) { var run = 99;
      for (var y = 0; y < h; y++) { var q = (y * w + x) * 4; if (d[q + 3] < 40) { run = 0; continue; } run++;
        var c = rgb2hsl(d[q], d[q + 1], d[q + 2]), ll = c[2], edge = run <= depth * (0.7 + 0.6 * vn(x / 5, 0, 9)), lit = litK && ll > litK && run < depth * 4;
        if ((edge || lit) && ll > 0.12) { var sn = snowAt(ll + 0.25), t = edge ? 0.92 : 0.75; d[q] = mix(d[q], sn[0], t); d[q + 1] = mix(d[q + 1], sn[1], t); d[q + 2] = mix(d[q + 2], sn[2], t); }
        else { var g = (d[q] + d[q + 1] + d[q + 2]) / 3; d[q] = mix(d[q], g, 0.25) * 0.94; d[q + 1] = mix(d[q + 1], g, 0.25) * 0.96; d[q + 2] = Math.min(255, mix(d[q + 2], g, 0.25) * 1.02); } } }
  }
  function gradeSprite(d, w, h, kind, season, capped) {
    var x, y, i, c;
    if (season === 'summer') return true;
    if (season === 'spring' || season === 'autumn') {
      var T = LEAF[season][kind] || LEAF[season].def, vary = (VARY[season][kind] != null ? VARY[season][kind] : VARY[season].def);
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) { i = (y * w + x) * 4; if (d[i + 3] < 10) continue;
        if (!regreen(d, i, T, x, y, vary) && season === 'spring' && kind === 'berryBush') { c = rgb2hsl(d[i], d[i + 1], d[i + 2]); if ((c[0] < 20 || c[0] > 330) && c[1] > 0.4) { d[i] = 246; d[i + 1] = 236; d[i + 2] = 236; } }   // blossom where the berries hang
        if (season === 'autumn' && kind === 'flower') d[i + 3] *= 0.45; }
      return true;
    }
    if (season === 'winter') {
      if (kind === 'flower' || kind === 'mushrooms') return false;        // no flowers and no toadstools in the snow (the season's own pieces carry their season in seasonal.json)
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) { i = (y * w + x) * 4; if (d[i + 3] < 10) continue; c = rgb2hsl(d[i], d[i + 1], d[i + 2]);
        if (kind === 'wildHerbs') { if (c[2] > 0.16) { var dh = hsl2rgb(34, 0.26, clamp(c[2] * 0.78 + 0.06, 0, 0.78)); d[i] = dh[0]; d[i + 1] = dh[1]; d[i + 2] = dh[2]; } continue; }   // the herbs dry where they stand: leaves brown, the white heads gone to pale seed (2026-10-23, Clive, GD saw them green and in bloom)
        if (isLeaf(c[0], c[1], c[2])) { var o = kind === 'pine' ? hsl2rgb(150, c[1] * 0.55, c[2] * 0.82) : hsl2rgb(35, 0.28, clamp(c[2] * 0.9 + 0.05, 0, 0.8)); d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; } }
      if (!capped) snowOn(d, w, h, SNOW_DEPTH[kind] || SNOW_DEPTH.def, kind === 'pine' ? 0.36 : 0);
      return true;
    }
    return true;
  }
  // winter's plants (2026-10-23, Robin: snowed over, a few sprigs, not lush brown bushes): the picture standing in for a plant in winter, in the
  // set 'plants_winter' (a berry bush is a plain bush in winter); drawn at the plant's place with its own ax, ay, upp, times the object's size
  var WINTER_PLANT = { bush: 'bush', berryBush: 'bush', heather: 'heather', fern: 'fern', tallGrass: 'tallGrass', reeds: 'reeds', juniper: 'juniper' };
  function winterPlant(kind, v) { var k = WINTER_PLANT[kind]; return k ? k + '_winter_' + ((((v || 0) % 3) + 3) % 3 + 1) : null; }
  function bareTree(kind, v) { return (kind === 'oak' || kind === 'birch') ? kind + '_bare_' + ((((v || 0) % 3) + 3) % 3 + 1) : null; }
  function gradeGround(d, w, h, season, water, ox, oy) {   // ox, oy: the chunk's origin in its own pixels (world units times the bake's scale): the noise is laid in world space, so chunks meet without a seam (2026-10-23)
    ox = ox || 0; oy = oy || 0;
    if (season === 'summer') return;
    var x, y, p, i, c, iceD = null, R = 26;
    if (season === 'winter') {                 // how far each water pixel lies from land, for the ice at the shore
      iceD = new Float32Array(w * h); for (p = 0; p < w * h; p++) iceD[p] = 99;
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) { if (!water(x, y)) continue; var best = 99;
        for (var dy = -R; dy <= R; dy += 2) for (var dx = -R; dx <= R; dx += 2) { var xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; if (!water(xx, yy)) { var dd = Math.hypot(dx, dy * 1.3); if (dd < best) best = dd; } }
        iceD[y * w + x] = best; } }
    var cls = null;
    if (season === 'winter') {                 // which pixels take snow (1) and which are dark rock (2), read before any is changed
      cls = new Uint8Array(w * h);
      for (p = 0; p < w * h; p++) { i = p * 4; var xq = p % w, yq = (p - xq) / w; if (water(xq, yq)) continue; c = rgb2hsl(d[i], d[i + 1], d[i + 2]);
        var gq = c[0] > 60 && c[0] < 205 && c[1] > 0.07, sq = c[0] >= 30 && c[0] <= 60 && c[1] > 0.3 && c[2] > 0.5, dq = !gq && !sq && c[0] >= 12 && c[0] <= 55 && c[1] > 0.1 && c[2] < 0.55;
        cls[p] = gq || sq || dq || c[2] > 0.3 ? 1 : 2; } }
    var sat = null;
    if (cls) { sat = new Int32Array((w + 1) * (h + 1)); for (var yq2 = 0; yq2 < h; yq2++) { var row = 0; for (var xq2 = 0; xq2 < w; xq2++) { row += cls[yq2 * w + xq2] === 1 ? 1 : 0; sat[(yq2 + 1) * (w + 1) + xq2 + 1] = sat[yq2 * (w + 1) + xq2 + 1] + row; } } }
    function snowShare(x0, y0, rr) { var xa = Math.max(0, x0 - rr), ya = Math.max(0, y0 - rr), xb = Math.min(w, x0 + rr + 1), yb = Math.min(h, y0 + rr + 1), n = (xb - xa) * (yb - ya);
      return (sat[yb * (w + 1) + xb] - sat[ya * (w + 1) + xb] - sat[yb * (w + 1) + xa] + sat[ya * (w + 1) + xa]) / n; }
    function speck(x0, y0) {                   // a dark pixel that is a speck in the snow (a pebble, a mark) or one of a speckled patch (a gravel path): snow lies round it close by
      return snowShare(x0, y0, 2) >= 0.6 || snowShare(x0, y0, 5) >= 0.4;   // or in the wider window: a rock face, solid and dark, has little snow inside it
    }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      p = y * w + x; i = p * 4; c = rgb2hsl(d[i], d[i + 1], d[i + 2]); var hh = c[0], ss = c[1], ll = c[2];
      if (water(x, y)) {
        if (season === 'winter') { var jag = 12 + 8 * vn((x + ox) / 14, (y + oy) / 10, 4); if (iceD[p] < jag) { var t = 0.85 * clamp(1 - iceD[p] / jag, 0.35, 1); d[i] = mix(d[i], 214, t); d[i + 1] = mix(d[i + 1], 230, t); d[i + 2] = mix(d[i + 2], 238, t); } else { d[i] *= 0.78; d[i + 1] *= 0.84; d[i + 2] *= 0.9; } }
        else if (season === 'autumn') { d[i] *= 0.92; d[i + 1] *= 0.94; d[i + 2] *= 0.96; }
        continue;
      }
      var grass = hh > 60 && hh < 205 && ss > 0.07, sand = hh >= 30 && hh <= 60 && ss > 0.3 && ll > 0.5;   // (the meadow's own shade is bluish: it takes the season too)
      if (season === 'winter') {
        var dirt = (!grass && !sand && hh >= 12 && hh <= 55 && ss > 0.1 && ll < 0.55) || (cls[p] === 2 && speck(x, y));   // (a speck in the snow takes the packed snow too)
        if (dirt) { var sp = snowAt(0.55 + (vn((x + ox) / 30, (y + oy) / 22, 5) - 0.5) * 0.1); d[i] = mix(d[i], sp[0] + 3, 0.92); d[i + 1] = mix(d[i + 1], sp[1], 0.92); d[i + 2] = mix(d[i + 2], sp[2] - 3, 0.92); }   // trodden earth, paths and yards: packed snow a shade greyer than the field, smooth (2026-10-23: their darker snow kept the patches' shapes; then a mottle of earth read as blocks at the game's enlargement)
        else if (grass || ll > 0.3) { var sn = snowAt(ll + 0.18 + (vn((x + ox) / 30, (y + oy) / 22, 5) - 0.5) * 0.12), t2 = sand ? 0.7 : 0.95; d[i] = mix(d[i], sn[0], t2); d[i + 1] = mix(d[i + 1], sn[1], t2); d[i + 2] = mix(d[i + 2], sn[2], t2); }
        else { d[i] = mix(d[i], 150, 0.3); d[i + 1] = mix(d[i + 1], 158, 0.3); d[i + 2] = mix(d[i + 2], 175, 0.3); }   // rock: greyed, its snow from above
      } else if (grass) {
        var T = LEAF[season].grass, o = hsl2rgb(T[0] + (vn((x + ox) / 40, (y + oy) / 30, 2) - 0.5) * (season === 'autumn' ? 22 : 8), clamp(ss * T[1], 0, 1), clamp(ll + T[2], 0, 0.95)); d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2];
      }
    }
  }
  function sprinkle(ctx, season, w, h, land, ox, oy) {
    if (season !== 'spring' && season !== 'autumn') return;
    var n = Math.round(w * h * (season === 'spring' ? 2600 : 4600) / (1200 * 750)), k;   // the board's density: so many to a screen
    for (k = 0; k < n; k++) {
      var gx = Math.floor(hash(k + ox * 0.37, 1 + oy * 0.11, 11) * w), gy = Math.floor(hash(k + ox * 0.37, 2 + oy * 0.11, 11) * h); if (!land(gx, gy)) continue;
      var cl = season === 'spring' ? (hash(k, 3 + ox, 2) < 0.75 ? '#faf8f0' : '#f4d65c') : ['#d6802a', '#c45228', '#e2b042', '#964624'][Math.floor(hash(k, 4 + oy, 2) * 4)];
      ctx.fillStyle = cl; ctx.beginPath(); ctx.ellipse(gx, gy, season === 'spring' ? 1.6 : 2.0, season === 'spring' ? 1.3 : 1.2, hash(k, 5, 1) * 3, 0, 7); ctx.fill();
    }
  }
  function hexOf(c) { return '#' + c.map(function (v) { var s = Math.round(clamp(v, 0, 255)).toString(16); return s.length < 2 ? '0' + s : s; }).join(''); }
  function rgbOf(hx) { return [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)]; }
  function gradeHex(hx, season) {
    var c = rgbOf(hx), d = [c[0], c[1], c[2], 255];
    if (season === 'winter') { var hs = rgb2hsl(c[0], c[1], c[2]); return hexOf(hsl2rgb(40, 0.3, clamp(hs[2] * 0.9 + 0.1, 0, 0.8))); }
    regreen(d, 0, LEAF[season].grass, 0, 0, 0); return hexOf(d);
  }
  function grassInk(base, season) {
    if (season === 'summer') return base;
    var o = {}, k; for (k in base) o[k] = base[k];
    ['patchLight', 'patchDark', 'earthEdge', 'dark', 'mid', 'light', 'glow'].forEach(function (k2) { if (typeof base[k2] === 'string') o[k2] = gradeHex(base[k2], season); });
    if (season === 'autumn') o.flowers = (base.flowers || 0) * 0.6;
    if (season === 'winter') { o.density = (base.density || 0) * 0.3; o.flowers = 0; o.patches = 0; o.shimmer = 0; o.shade = (base.shade || 0) * 0.3; o.earth = 0; o.drifts = 0; }   // a few dry tufts through the snow; their shadow faint (in the tuft's dark it greyed the snow into puddles), no bare earth, no flower drifts
    return o;
  }
  function light(ctx, w, h, season) {           // the season's light: a colour laid over the frame with two cheap fills (the board's grade, approximated)
    if (season === 'summer') return;
    ctx.save();
    if (season === 'spring') { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(214,240,200,0.18)'; ctx.fillRect(0, 0, w, h); }
    if (season === 'autumn') { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,200,120,0.12)'; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over'; var g = ctx.createLinearGradient(0, 0, w * 0.4, h); g.addColorStop(0, 'rgba(255,214,150,0.10)'); g.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
    if (season === 'winter') { ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,0.18)'; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(170,196,232,0.30)'; ctx.fillRect(0, 0, w, h); }
    ctx.restore();
  }
  function deepen(d, w, h, kind) { snowOn(d, w, h, Math.round((SNOW_DEPTH[kind] || SNOW_DEPTH.def) * 1.8) + 3, kind === 'pine' ? 0.6 : 0.3); return true; }   // snow building on a thing while it snows (2026-10-23): the winter copy with deeper snow, laid over it at the fresh snow's strength

  function mkOf(mk) { return mk || function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }; }
  // the picture's pixels that lie (dx0, dy0) inside its edge but not (dx1, dy1): an edge band, filled with col, kept inside the picture
  function band(src, w, h, dx0, dy0, dx1, dy1, col, mk) {
    var c = mkOf(mk)(w, h), g = c.getContext('2d'); g.drawImage(src, dx0, dy0); g.globalCompositeOperation = 'destination-out'; g.drawImage(src, dx1, dy1);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-in'; g.drawImage(src, 0, 0); return c;
  }
  function overFill(g, src, w, h, op, col, a) { g.globalCompositeOperation = op; g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, w, h); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-in'; g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-over'; }

  // gradeSprite by composites (2026-10-23): the season's colours laid on with blend modes (the hue of the season on the leaves; browns,
  // whites and the ink change little under a hue blend, having little colour), winter's snow as a band under the upper edges. null = not drawn.
  var PLANT = { oak: 1, birch: 1, pine: 1, bush: 1, berryBush: 1, tallGrass: 1, wildHerbs: 1, fern: 1, juniper: 1, heather: 1, reeds: 1, grass: 1 };   // what takes the season's colours (rocks, tents, carts keep theirs)
  var TRUNK = { oak: 0.74, birch: 0.5 };                          // where the crown ends and the bare trunk begins, as a share of the picture's height: the colour fades out down it
  function overFillDown(g, src, w, h, op, col, a, y1) { var gr = g.createLinearGradient(0, h * (y1 - 0.12), 0, h * y1); gr.addColorStop(0, col.replace('hsl(', 'hsla(').replace(')', ',' + a + ')')); gr.addColorStop(1, col.replace('hsl(', 'hsla(').replace(')', ',0)'));
    g.globalCompositeOperation = op; g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-in'; g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-over'; }
  // autumn's bushes turn less than the trees and not all alike (Robin, 2026-10-23: "feels strange that the bushes are just complete red in autumn"):
  // olive, yellow-brown, still greenish, rust, red; the share of each; the tint for a bush standing at x, y (the same bush keeps its tint)
  var BUSH_AUTUMN = [[62, 0.5, 0], [44, 0.7, 0], [76, 0.35, 0], [24, 0.75, -0.05], [356, 0.8, -0.06]], BUSH_SHARE = [0.32, 0.28, 0.18, 0.14, 0.08];
  function autumnTint(x, y) { var r = hash(Math.floor(x / 7), Math.floor(y / 7), 17), acc = 0, i; for (i = 0; i < BUSH_SHARE.length; i++) { acc += BUSH_SHARE[i]; if (r < acc) return i; } return 0; }
  function gradeCanvas(src, kind, season, capped, mk, tint) {
    if (season === 'summer') return src;
    if (season === 'winter' && (kind === 'flower' || kind === 'mushrooms')) return null;
    var w = src.width, h = src.height, c = mkOf(mk)(w, h), g = c.getContext('2d'); g.drawImage(src, 0, 0);
    if (season === 'autumn' && kind === 'flower') { var cf = mkOf(mk)(w, h), gf = cf.getContext('2d'); gf.globalAlpha = 0.45; gf.drawImage(src, 0, 0); return cf; }
    if (season === 'autumn' && kind === 'bush') { var B = BUSH_AUTUMN[tint || 0]; overFill(g, src, w, h, 'hue', 'hsl(' + B[0] + ',80%,50%)', B[1]); overFill(g, src, w, h, 'saturation', 'hsl(0,48%,50%)', 0.2); if (B[2] < 0) overFill(g, src, w, h, 'multiply', 'hsl(10,30%,62%)', -B[2] * 7); return c; }
    if (season === 'autumn' && kind === 'berryBush') { overFill(g, src, w, h, 'hue', 'hsl(72,70%,50%)', 0.3); return c; }   // it keeps its green; the red is in the berries
    if (season === 'autumn' || season === 'spring') { if (!PLANT[kind]) return c; var T = LEAF[season][kind] || LEAF[season].def, tk = TRUNK[kind] || 1.12;
      if (season === 'autumn') { overFill(g, src, w, h, 'hue', 'hsl(' + T[0] + ',90%,50%)', kind === 'pine' ? 0.15 : 1); overFillDown(g, src, w, h, 'saturation', 'hsl(0,' + Math.round(Math.min(100, 62 * T[1])) + '%,50%)', kind === 'pine' ? 0 : 0.45, tk);   // the hue over all of it (a trunk, brown and dull, barely moves under it; a fade left green bands)
        if (T[2] > 0) overFill(g, src, w, h, 'screen', 'rgb(255,236,200)', T[2] * 2.2); else if (T[2] < 0) overFillDown(g, src, w, h, 'multiply', 'hsl(10,35%,62%)', Math.min(0.6, -T[2] * 7), tk); }
      else overFillDown(g, src, w, h, 'soft-light', 'hsl(' + T[0] + ',85%,62%)', kind === 'pine' ? 0.15 : 0.4, tk);
      return c; }
    if (kind === 'pine') { overFill(g, src, w, h, 'hue', 'hsl(150,60%,50%)', 0.5); overFill(g, src, w, h, 'saturation', 'hsl(0,0%,50%)', 0.5); overFill(g, src, w, h, 'multiply', 'rgb(176,194,198)', 1); }
    else if (PLANT[kind] && kind !== 'oak' && kind !== 'birch') { var tw = TRUNK[kind] || 1.12; overFillDown(g, src, w, h, 'saturation', 'hsl(0,22%,50%)', 0.8, tw); overFillDown(g, src, w, h, 'hue', 'hsl(32,100%,50%)', 0.85, tw); }   // (an oak or a birch is its bare picture in winter: its twigs keep their colour)
    if (!capped) { var D = SNOW_DEPTH[kind] || SNOW_DEPTH.def, ink = Math.max(1, Math.round(w / 140));
      g.globalAlpha = 0.92; g.drawImage(band(src, w, h, 0, ink, 0, ink + D, 'rgb(244,247,250)', mk), 0, 0);
      g.globalAlpha = 0.35; g.drawImage(band(src, w, h, 0, ink, 0, ink + Math.round(D * 1.6), 'rgb(222,230,240)', mk), 0, 0); g.globalAlpha = 1; }
    return c;
  }
  function deepenCanvas(src, kind, mk) {            // deepen by composites: more snow on the winter copy while it snows
    var w = src.width, h = src.height, c = mkOf(mk)(w, h), g = c.getContext('2d'), D = Math.round((SNOW_DEPTH[kind] || SNOW_DEPTH.def) * 1.8) + 3, ink = Math.max(1, Math.round(w / 140));
    g.drawImage(src, 0, 0); g.globalAlpha = 0.95; g.drawImage(band(src, w, h, 0, ink, 0, ink + D, 'rgb(246,249,252)', mk), 0, 0); g.globalAlpha = 1; return c;
  }
  var api = { PICKS: { spring: 'A, fresh green', summer: 'as the game is', autumn: 'B, fiery', winter: 'A, deep snow' }, LEAF: LEAF, SNOW_DEPTH: SNOW_DEPTH,
    gradeSprite: gradeSprite, winterPlant: winterPlant, deepen: deepen, gradeCanvas: gradeCanvas, deepenCanvas: deepenCanvas, autumnTint: autumnTint, BUSH_AUTUMN: BUSH_AUTUMN, bareTree: bareTree, gradeGround: gradeGround, sprinkle: sprinkle, grassInk: grassInk, light: light, gradeHex: gradeHex };
  if (typeof module !== 'undefined') module.exports = api; else root.Seasons = api;
})(this);
