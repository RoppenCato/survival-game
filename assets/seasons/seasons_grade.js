// seasons_grade.js: the seasons of home's meadow as Robin picked them (2026-10-23: spring A fresh green, autumn B fiery, winter A deep
// snow; docs/seasons.md). The grades of the board he picked from, as one module the game can call when it bakes, never a frame at a
// time. Works in the browser and in Node; every function works on ImageData (d = data array, w, h) or a 2d context.
//   Seasons.gradeSprite(d, w, h, kind, season, capped)  a standing thing's picture, once a season: false = do not draw it this season;
//                                                    capped: the piece has its own snow cap picture (the set 'snowcaps': <name>_snow), so
//                                                    winter leaves the outline snow off and the game draws the cap over it
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
  function bareTree(kind, v) { return (kind === 'oak' || kind === 'birch') ? kind + '_bare_' + ((((v || 0) % 3) + 3) % 3 + 1) : null; }
  function gradeGround(d, w, h, season, water) {
    if (season === 'summer') return;
    var x, y, p, i, c, iceD = null, R = 26;
    if (season === 'winter') {                 // how far each water pixel lies from land, for the ice at the shore
      iceD = new Float32Array(w * h); for (p = 0; p < w * h; p++) iceD[p] = 99;
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) { if (!water(x, y)) continue; var best = 99;
        for (var dy = -R; dy <= R; dy += 2) for (var dx = -R; dx <= R; dx += 2) { var xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; if (!water(xx, yy)) { var dd = Math.hypot(dx, dy * 1.3); if (dd < best) best = dd; } }
        iceD[y * w + x] = best; } }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      p = y * w + x; i = p * 4; c = rgb2hsl(d[i], d[i + 1], d[i + 2]); var hh = c[0], ss = c[1], ll = c[2];
      if (water(x, y)) {
        if (season === 'winter') { var jag = 12 + 8 * vn(x / 14, y / 10, 4); if (iceD[p] < jag) { var t = 0.85 * clamp(1 - iceD[p] / jag, 0.35, 1); d[i] = mix(d[i], 214, t); d[i + 1] = mix(d[i + 1], 230, t); d[i + 2] = mix(d[i + 2], 238, t); } else { d[i] *= 0.78; d[i + 1] *= 0.84; d[i + 2] *= 0.9; } }
        else if (season === 'autumn') { d[i] *= 0.92; d[i + 1] *= 0.94; d[i + 2] *= 0.96; }
        continue;
      }
      var grass = hh > 60 && hh < 205 && ss > 0.07, sand = hh >= 30 && hh <= 60 && ss > 0.3 && ll > 0.5;   // (the meadow's own shade is bluish: it takes the season too)
      if (season === 'winter') {
        var dirt = !grass && !sand && hh >= 12 && hh <= 55 && ss > 0.1 && ll < 0.55;
        if (dirt) { var sp = snowAt(0.55 + (vn(x / 30, y / 22, 5) - 0.5) * 0.1); d[i] = mix(d[i], sp[0] + 3, 0.92); d[i + 1] = mix(d[i + 1], sp[1], 0.92); d[i + 2] = mix(d[i + 2], sp[2] - 3, 0.92); }   // trodden earth, paths and yards: packed snow a shade greyer than the field, smooth (2026-10-23: their darker snow kept the patches' shapes; then a mottle of earth read as blocks at the game's enlargement)
        else if (grass || ll > 0.3) { var sn = snowAt(ll + 0.18 + (vn(x / 30, y / 22, 5) - 0.5) * 0.12), t2 = sand ? 0.7 : 0.95; d[i] = mix(d[i], sn[0], t2); d[i + 1] = mix(d[i + 1], sn[1], t2); d[i + 2] = mix(d[i + 2], sn[2], t2); }
        else { d[i] = mix(d[i], 150, 0.3); d[i + 1] = mix(d[i + 1], 158, 0.3); d[i + 2] = mix(d[i + 2], 175, 0.3); }   // rock: greyed, its snow from above
      } else if (grass) {
        var T = LEAF[season].grass, o = hsl2rgb(T[0] + (vn(x / 40, y / 30, 2) - 0.5) * (season === 'autumn' ? 22 : 8), clamp(ss * T[1], 0, 1), clamp(ll + T[2], 0, 0.95)); d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2];
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
  var api = { PICKS: { spring: 'A, fresh green', summer: 'as the game is', autumn: 'B, fiery', winter: 'A, deep snow' }, LEAF: LEAF, SNOW_DEPTH: SNOW_DEPTH,
    gradeSprite: gradeSprite, bareTree: bareTree, gradeGround: gradeGround, sprinkle: sprinkle, grassInk: grassInk, light: light, gradeHex: gradeHex };
  if (typeof module !== 'undefined') module.exports = api; else root.Seasons = api;
})(this);
