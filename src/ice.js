/* The winter ice (Robin, 2026-11-10: "the sea freezes and carries you, with danger": thick and white near shore, thinner and darker
   further out; on thin ice it creaks and cracks spread, and standing or running on it puts you through; walking calmly and carrying
   nothing heavy keeps you safe longer. 2026-11-11: "work on the ice mechanic, with cracks etc."). This file is the rules and the ice's
   own pictures; the game says when it is winter and who walks. Every number is in DEF, mine, first settings.

   How thick: by how far the nearest land is (a distance kept by the tile, found once a world), 1 by the shore falling to DEF.farTh
   past DEF.far tiles; lifted along winding veins (pressure ridges: the white lines to follow across a strait); broken by open leads far
   out; nothing past home water's edge, where the swell keeps the sea open. A lake freezes thick with a thinner middle, a river thin.

   What breaks it: a strain that follows the walker (I.S, 0 to 1). On ice thinner than DEF.safe it grows by how thin the ice is and how
   he goes (still, creeping, walking, running, with a load, a leap's landing), and eases off by itself, fast on thick ice. At DEF.creak
   marks it creaks and cracks are drawn round him; at 1 it gives way: a hole, and he is in the water. Ice cracked before is weaker.
   From the water he climbs out onto ice of DEF.climb or more; thinner ice breaks before him. Holes and cracks last until morning.

   G, the world as the rules ask it: GW, GH (tiles), T, land(tx, ty), water(wx, wy), fresh(wx, wy) (0, 1 a lake, 2 a river),
   open(wx, wy) (0 inside home water to 1 past its edge). */
var Ice = (function () {
var DEF = {
  near: 5, far: 38, farTh: 0.18,          // tiles from land: thick to `near`, thinning to farTh of the whole at `far`
  vein: 14, veinW: 0.12, veinLift: 0.62,  // the veins: the noise's scale in tiles, half the band in noise, how much of the missing thickness a vein gives back
  patch: 30, patchK: 0.16,                // slow patches, thicker and thinner
  lead: 22, leadAt: 0.80, leadFrom: 0.5,  // open leads: where the far ice (base under leadFrom) meets the lead noise over leadAt
  lakeNear: 2, lakeFar: 8, lakeMid: 0.46, // a lake: thick at its rim, lakeMid in the middle of a big one
  river: 0.36,                            // a river: thin all over
  open: 0.1,                              // thinner than this there is no ice
  safe: 0.6,                              // from here up nothing strains it
  rate: 1.0, pow: 1.5,                    // strain a second on ice of no thickness, walking; the curve by thinness
  ease: 0.15, easeThick: 0.6,             // what eases off a second: on thin ice, on thick ice
  still: 1.3, stillAfter: 1.2,            // standing: its share, after so many seconds still
  creep: 0.5, creepV: 48,                 // creeping (the sneak's pace and under)
  runV: 100, run: 3,                      // running (a sprint)
  heavy: 2,                               // a beast or a log on the shoulder
  leapV: 210, leap: 0.28,                 // a dash or a leap: so much strain at once when it ends on thin ice
  weak: 1.5,                              // cracked ice: the strain grows (1 + weak * the crack) times as fast
  creak: [0.3, 0.55, 0.8],                // the strain at which it creaks and cracks are drawn
  hole: 20, edge: 13,                     // a hole's radius where he goes through, and where an edge is broken from the water
  climb: 0.3, climbS: 0.45,               // climbing out: the ice it takes, and the strain he stands with after
  cold: 8,                                // the health the cold water takes, once a fall
  cell: 32, CH: 256, PX: 4,               // the crack memory's cell; a baked piece of the sheet, and its units a pixel
  marks: 90                               // crack marks kept at once
};
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function sstep(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function h2(ix, iy, s) { var n = Math.sin(ix * 127.1 + iy * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); }
function noise(x, y, s) { var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), a = h2(ix, iy, s), b = h2(ix + 1, iy, s), c = h2(ix, iy + 1, s), d = h2(ix + 1, iy + 1, s); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; }
function make(G, seed) {
  var GW = G.GW, GH = G.GH, D = new Float32Array(GW * GH), x, y, i, BIG = 1e4, v;
  for (y = 0; y < GH; y++) for (x = 0; x < GW; x++) D[y * GW + x] = G.land(x, y) ? 0 : BIG;
  for (y = 0; y < GH; y++) for (x = 0; x < GW; x++) { i = y * GW + x; v = D[i]; if (v === 0) continue; if (x > 0) v = Math.min(v, D[i - 1] + 1); if (y > 0) { v = Math.min(v, D[i - GW] + 1); if (x > 0) v = Math.min(v, D[i - GW - 1] + 1.414); if (x < GW - 1) v = Math.min(v, D[i - GW + 1] + 1.414); } D[i] = v; }
  for (y = GH - 1; y >= 0; y--) for (x = GW - 1; x >= 0; x--) { i = y * GW + x; v = D[i]; if (v === 0) continue; if (x < GW - 1) v = Math.min(v, D[i + 1] + 1); if (y < GH - 1) { v = Math.min(v, D[i + GW] + 1); if (x < GW - 1) v = Math.min(v, D[i + GW + 1] + 1.414); if (x > 0) v = Math.min(v, D[i + GW - 1] + 1.414); } D[i] = v; }
  return { G: G, seed: seed || 1, D: D, ch: {}, chN: 0, S: 0, stillT: 0, lvl: 0, wasFast: false, cr: {}, holes: [], marks: [], shards: [], fell: 0 };
}
function distAt(I, wx, wy) {               // tiles to the nearest land, between the tiles' middles
  var G = I.G, fx = clamp(wx / G.T - 0.5, 0, G.GW - 1.001), fy = clamp(wy / G.T - 0.5, 0, G.GH - 1.001), ix = Math.floor(fx), iy = Math.floor(fy), ux = fx - ix, uy = fy - iy, i = iy * G.GW + ix, D = I.D;
  return (D[i] * (1 - ux) + D[i + 1] * ux) * (1 - uy) + (D[i + G.GW] * (1 - ux) + D[i + G.GW + 1] * ux) * uy;
}
function thickAt(I, wx, wy) { var v = I.G.water(wx, wy) ? thickRaw(I, wx, wy) : 0; return v < DEF.open ? 0 : v; }   // the rule's own answer at a point (the tests)
function thickRaw(I, wx, wy) {             // the ice's thickness at a point, 0 to 1, before the cut at DEF.open (the game asks thick(), from the baked pieces)
  /* What kind of water it is (the sea, a lake, a river) is known by the tile: the three answers are blended between the four tiles' middles round the point, so a river's thin ice runs smoothly into its banks and into the sea's (it met them in tile-sized steps, seen 2026-11-11). Asked on the shore's land too: the sheet's picture runs a little way up the beach and is faded there, see piece(). */
  var G = I.G, T = G.T, fx = wx / T - 0.5, fy = wy / T - 0.5, ix = Math.floor(fx), iy = Math.floor(fy), ux = fx - ix, uy = fy - iy, k, sum = 0, got = [null, null, null];
  for (k = 0; k < 4; k++) { var wgt = (k & 1 ? ux : 1 - ux) * (k & 2 ? uy : 1 - uy); if (wgt <= 0) continue; var fr = G.fresh((ix + (k & 1) + 0.5) * T, (iy + (k >> 1) + 0.5) * T) || 0; if (got[fr] == null) got[fr] = thickOf(I, wx, wy, fr); sum += wgt * got[fr]; }
  return clamp(sum, 0, 1);
}
function thickOf(I, wx, wy, fr) {          // the thickness there were the water of one kind: 0 the sea, 1 a lake, 2 a river
  var G = I.G, d = distAt(I, wx, wy), T = G.T, s = I.seed, base, th;
  if (fr === 1) return clamp(1 - (1 - DEF.lakeMid) * sstep(DEF.lakeNear, DEF.lakeFar, d) - DEF.patchK * (noise(wx / (T * 6), wy / (T * 6), s + 5) - 0.5), 0, 1);
  if (fr === 2) return clamp(DEF.river + 0.12 * (noise(wx / (T * 4), wy / (T * 4), s + 6) - 0.5), 0, 1);
  var op = G.open(wx, wy); if (op > 0.5) return 0;
  base = 1 - (1 - DEF.farTh) * sstep(DEF.near, DEF.far, d);
  var vn = noise(wx / (T * DEF.vein), wy / (T * DEF.vein), s + 1), ridge = clamp(1 - Math.abs(vn - 0.5) / DEF.veinW, 0, 1);
  th = base + DEF.veinLift * ridge * ridge * (3 - 2 * ridge) * (1 - base);
  if (d > DEF.near) th -= DEF.patchK * (noise(wx / (T * DEF.patch), wy / (T * DEF.patch), s + 2) - 0.5) * 2 * sstep(DEF.near, DEF.near + 6, d);
  if (base < DEF.leadFrom && ridge < 0.9) th *= 1 - sstep(DEF.leadAt - 0.05, DEF.leadAt, noise(wx / (T * DEF.lead), wy / (T * DEF.lead * 0.45), s + 3)) * (1 - sstep(0, 0.9, ridge));   /* a lead: long open water across the far ice, bridged where a vein crosses it */
  th *= 1 - sstep(0.1, 0.5, op);
  return clamp(th, 0, 1);   /* (under DEF.open it is no ice: thick() says 0 there; the picture fades out over the last of it) */
}
/* The sheet in baked pieces (CH units square, PX units a pixel): the thickness kept by the pixel, asked by everything at play. */
function piece(I, cx, cy) {
  var k = cx + ',' + cy, c = I.ch[k]; if (c) return c;
  var n = DEF.CH / DEF.PX, m = n + 2, th = new Float32Array(m * m), al = new Float32Array(m * m), any = false, x, y, G = I.G;   /* (a pixel more all round: the picture is smoothed across the pieces' joins) */
  /* th: what carries (0 on land); al: how much of the sheet shows (G.cover: 1 on the water, fading out over the waterline, so the shore's edge is soft and follows the coast) */
  for (y = 0; y < m; y++) for (x = 0; x < m; x++) { var wx = cx * DEF.CH + (x - 0.5) * DEF.PX, wy = cy * DEF.CH + (y - 0.5) * DEF.PX, wat = G.water(wx, wy), cov = G.cover ? G.cover(wx, wy) : (wat ? 1 : 0); if (!(cov > 0) && !wat) continue; var v = thickRaw(I, wx, wy), p = y * m + x; if (!wat && G.fresh(wx, wy) === 0 && G.open(wx, wy) <= 0.5) v = Math.max(v, DEF.safe);   /* (the lip on the beach is the shore's white) */
    th[p] = wat ? v : 0; al[p] = cov * sstep(DEF.open - 0.07, DEF.open, v); if (!wat) th[p] = -v;   /* (kept negative on land: the colour's thickness, never carrying) */ if (al[p] > 0) any = true; }
  c = I.ch[k] = { th: th, al: al, any: any, cv: null }; I.chN++; return c;
}
function thick(I, wx, wy) {
  var cx = Math.floor(wx / DEF.CH), cy = Math.floor(wy / DEF.CH), c; if (I.lc && I.lcx === cx && I.lcy === cy) c = I.lc; else { c = piece(I, cx, cy); I.lc = c; I.lcx = cx; I.lcy = cy; }   /* (the piece asked last is kept at hand: the night's water mask asks every pixel of the view) */ if (!c.any) return 0;
  var n = DEF.CH / DEF.PX, px = Math.min(n - 1, Math.floor((wx - cx * DEF.CH) / DEF.PX)), py = Math.min(n - 1, Math.floor((wy - cy * DEF.CH) / DEF.PX)), v = c.th[(py + 1) * (n + 2) + px + 1]; return v < DEF.open ? 0 : v;
}
function inHole(I, wx, wy) { for (var i = 0; i < I.holes.length; i++) { var h = I.holes[i], dx = wx - h.x, dy = wy - h.y; if (dx * dx + dy * dy < h.r * h.r) return true; } return false; }
function carries(I, wx, wy) { return thick(I, wx, wy) > 0 && !inHole(I, wx, wy); }
function crackAt(I, wx, wy) { return I.cr[Math.floor(wx / DEF.cell) + ',' + Math.floor(wy / DEF.cell)] || 0; }
function rnd(I) { I.rs = ((I.rs || 12345) * 1103515245 + 12345) & 0x7fffffff; return I.rs / 0x7fffffff; }
function mark(I, x, y, r, n) {             // a star of cracks: n rays of two or three kinked pieces, grown as the strain grows
  var rays = [], a0 = rnd(I) * 6.283, k, j;
  for (k = 0; k < n; k++) { var a = a0 + k * 6.283 / n + (rnd(I) - 0.5) * 1.2, px = 0, py = 0, pts = [0, 0], segs = 3 + Math.floor(rnd(I) * 3), len = r * (0.45 + rnd(I) * 0.9) / segs, fk = 1 + Math.floor(rnd(I) * (segs - 1));
    for (j = 0; j < segs; j++) { a += (rnd(I) - 0.5) * 1.5; px += Math.cos(a) * len; py += Math.sin(a) * len; pts.push(px, py);
      if (j === fk && rnd(I) < 0.7) { var fa = a + (rnd(I) < 0.5 ? -1 : 1) * (0.5 + rnd(I) * 0.7), fl = len * (0.7 + rnd(I) * 0.9), f1x = px + Math.cos(fa) * fl, f1y = py + Math.sin(fa) * fl, fa2 = fa + (rnd(I) - 0.5) * 1.2; rays.push([px, py, f1x, f1y, f1x + Math.cos(fa2) * fl * 0.7, f1y + Math.sin(fa2) * fl * 0.7]); } }   /* (a fork off the ray) */
    rays.push(pts); }
  I.marks.push({ x: x, y: y, rays: rays, t: 0 }); if (I.marks.length > DEF.marks) I.marks.shift();
}
function hole(I, x, y, r, ev) {
  I.holes.push({ x: x, y: y, r: r, t: 0 }); mark(I, x, y, r * 2.6, 5);
  for (var k = 0; k < 6; k++) { var a = rnd(I) * 6.283, d = r * (0.25 + rnd(I) * 0.6); I.shards.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, s: 2.5 + rnd(I) * 4, a: rnd(I) * 6.283, ph: rnd(I) * 6.283 }); }
  if (I.shards.length > 120) I.shards.splice(0, I.shards.length - 120);
  var c0 = Math.floor((x - r * 2) / DEF.cell), c1 = Math.floor((x + r * 2) / DEF.cell), r0 = Math.floor((y - r * 2) / DEF.cell), r1 = Math.floor((y + r * 2) / DEF.cell), cx, cy;
  for (cy = r0; cy <= r1; cy++) for (cx = c0; cx <= c1; cx++) { var kk = cx + ',' + cy; I.cr[kk] = Math.max(I.cr[kk] || 0, 0.5); }   /* the ice round a hole is weak */
  if (ev) ev.push({ k: 'break', x: x, y: y });
}
/* A step of the walker on the ice. H: { x, y, v (his speed, units a second), heavy, on (he stands on the ice now) }.
   Returns what happened: { k: 'creak', lvl } and { k: 'break', x, y }. */
function step(I, dt, H) {
  var ev = [], i; for (i = 0; i < I.marks.length; i++) I.marks[i].t += dt; for (i = 0; i < I.holes.length; i++) I.holes[i].t += dt;
  if (!H.on) { I.S = Math.max(0, I.S - DEF.easeThick * dt); I.lvl = 0; I.stillT = 0; I.wasFast = false; return ev; }
  var th = thick(I, H.x, H.y), thin = th < DEF.safe ? Math.pow((DEF.safe - th) / DEF.safe, DEF.pow) : 0, v = H.v || 0, k;
  if (v < 6) I.stillT += dt; else I.stillT = 0;
  k = v < 6 ? (I.stillT > DEF.stillAfter ? DEF.still : DEF.creep) : v <= DEF.creepV ? DEF.creep : v <= DEF.runV ? 1 : DEF.run;
  if (H.heavy) k *= DEF.heavy;
  var fast = v > DEF.leapV; if (I.wasFast && !fast && thin > 0) I.S += DEF.leap * (0.5 + thin);   /* a dash or a leap comes down */
  I.wasFast = fast;
  if (thin > 0) { var ck = Math.floor(H.x / DEF.cell) + ',' + Math.floor(H.y / DEF.cell), cr = I.cr[ck] || 0; I.S += (DEF.rate * thin * k * (1 + DEF.weak * cr) - DEF.ease) * dt; if (I.S > cr) I.cr[ck] = Math.min(1, I.S); }
  else I.S -= DEF.easeThick * dt;
  if (I.S < 0) I.S = 0;
  var lvl = 0; for (i = 0; i < DEF.creak.length; i++) if (I.S >= DEF.creak[i]) lvl = i + 1;
  if (lvl > I.lvl) { ev.push({ k: 'creak', lvl: lvl, x: H.x, y: H.y }); mark(I, H.x + (rnd(I) - 0.5) * 10, H.y + (rnd(I) - 0.5) * 8, 20 + lvl * 16, 2 + lvl); }
  if (lvl < I.lvl - 1 || I.S < 0.05) I.lvl = lvl; else I.lvl = Math.max(I.lvl, lvl);   /* (a mark creaks again only after the strain has well eased) */
  if (I.S >= 1) { I.S = 0; I.lvl = 0; I.stillT = 0; I.fell++; hole(I, H.x, H.y, DEF.hole, ev); }
  return ev;
}
/* From the water toward (x, y): 'water' (no ice there), 'ice' (it holds: he climbs out), 'break' (too thin: it breaks before him and is water now). */
function swimTo(I, x, y) {
  if (!carries(I, x, y)) return 'water'; var th = thick(I, x, y);
  if (th >= DEF.climb && crackAt(I, x, y) < 0.95) { I.S = Math.max(I.S, DEF.climbS); I.lvl = 2; return 'ice'; }
  hole(I, x, y, DEF.edge, null); return 'break';
}
function morning(I) { I.holes.length = 0; I.marks.length = 0; I.shards.length = 0; I.cr = {}; I.S = 0; I.lvl = 0; }   /* the night's frost: holes skinned over, cracks healed */
/* ---- the pictures ---- */
function colOf(th, out) {                  // the sheet's colour by its thickness: dark and clear where thin, white and snowed where thick
  var t;
  if (th < DEF.safe) { t = clamp((th - DEF.open) / (DEF.safe - DEF.open), 0, 1); out[0] = 78 + t * 78; out[1] = 106 + t * 78; out[2] = 134 + t * 70; out[3] = 255; }
  else { t = clamp((th - DEF.safe) / (1 - DEF.safe), 0, 1); t = Math.sqrt(t); out[0] = 156 + t * 80; out[1] = 184 + t * 60; out[2] = 204 + t * 44; out[3] = 255; }
}
function pieceCv(I, c, cx, cy, mk) {
  if (c.cv || !c.any) return c.cv; var n = DEF.CH / DEF.PX + 2, cv = mk(n, n), g = cv.getContext('2d'), im = g.createImageData(n, n), d = im.data, col = [0, 0, 0, 0], x, y, i = 0, p = 0;
  for (y = 0; y < n; y++) for (x = 0; x < n; x++, i += 4, p++) { var th = Math.abs(c.th[p]), fade = c.al[p]; if (fade <= 0) { d[i] = 236; d[i + 1] = 244; d[i + 2] = 250; d[i + 3] = 0; continue; } colOf(Math.max(th, DEF.open), col); var gr = (h2(cx * (n - 2) + x, cy * (n - 2) + y, 9) - 0.5) * (th < DEF.safe ? 7 : 5);
    var edge = 34 * (1 - sstep(DEF.open, DEF.open + 0.05, th));   /* a pale lip where the sheet thins out to open water */
    d[i] = clamp(col[0] + gr + edge, 0, 255); d[i + 1] = clamp(col[1] + gr + edge, 0, 255); d[i + 2] = clamp(col[2] + gr + edge * 0.7, 0, 255); d[i + 3] = col[3] * fade; }
  g.putImageData(im, 0, 0); c.cv = cv; return cv;
}
/* The sheet, drawn in world units with the view's flattening K (a screen y is the world's times K). bakeMax: pieces made this frame at most. */
function draw(c, I, cam, hw, hh, K, mk, bakeMax) {
  var sm0 = c.imageSmoothingEnabled; c.imageSmoothingEnabled = true;
  var x0 = Math.floor((cam.x - hw) / DEF.CH), x1 = Math.floor((cam.x + hw) / DEF.CH), y0 = Math.floor((cam.y - hh) / K / DEF.CH), y1 = Math.floor((cam.y + hh) / K / DEF.CH), cx, cy, made = 0;
  for (cy = y0; cy <= y1; cy++) for (cx = x0; cx <= x1; cx++) { var k = cx + ',' + cy, pc = I.ch[k]; if (!pc) { if (made >= (bakeMax || 2)) continue; pc = piece(I, cx, cy); made++; } if (!pc.any) continue; var cv = pc.cv || pieceCv(I, pc, cx, cy, mk); if (cv) c.drawImage(cv, 0.75, 0.75, cv.width - 1.5, cv.height - 1.5, cx * DEF.CH - DEF.PX * 0.25, (cy * DEF.CH - DEF.PX * 0.25) * K, DEF.CH + DEF.PX * 0.5, (DEF.CH + DEF.PX * 0.5) * K); }   /* (a quarter pixel over each join: the sheet is solid, so the overlap does not show, and no join is left thin) */
  c.imageSmoothingEnabled = sm0;
  if (I.chN > 400) { var keep = {}; I.chN = 0; for (cy = y0 - 3; cy <= y1 + 3; cy++) for (cx = x0 - 3; cx <= x1 + 3; cx++) if (I.ch[cx + ',' + cy]) { keep[cx + ',' + cy] = I.ch[cx + ',' + cy]; I.chN++; } I.ch = keep; I.lc = null; }   /* (the pieces far behind let go) */
}
function drawMarks(c, I, cam, hw, hh, K, water) {
  var i, j, k;
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (i = 0; i < I.marks.length; i++) { var m = I.marks[i]; if (Math.abs(m.x - cam.x) > hw + 90 || Math.abs(m.y * K - cam.y) > hh + 90) continue; var grow = Math.min(1, m.t / 0.18);
    for (k = 0; k < 2; k++) { c.strokeStyle = k ? 'rgba(246,251,255,0.92)' : 'rgba(24,46,70,0.5)'; c.lineWidth = k ? 0.8 : 2; c.beginPath();
      for (j = 0; j < m.rays.length; j++) { var p = m.rays[j], q, nP = p.length / 2, upto = 1 + (nP - 1) * grow; c.moveTo(m.x + p[0], (m.y + p[1]) * K); for (q = 1; q < nP; q++) { var f = Math.min(1, upto - q); if (f <= 0) break; var ax = p[q * 2 - 2], ay = p[q * 2 - 1], bx = p[q * 2], by = p[q * 2 + 1]; c.lineTo(m.x + ax + (bx - ax) * f, (m.y + ay + (by - ay) * f) * K); } }
      c.stroke(); } }
  for (i = 0; i < I.holes.length; i++) { var h = I.holes[i]; if (Math.abs(h.x - cam.x) > hw + 60 || Math.abs(h.y * K - cam.y) > hh + 60) continue; var g = Math.min(1, h.t / 0.25), r = h.r * (0.7 + 0.3 * g);
    c.fillStyle = water || '#2a4d68'; c.beginPath(); for (j = 0; j <= 14; j++) { var a = j / 14 * 6.283, rr = r * (0.86 + 0.2 * h2(j, i, 3)); if (j === 0) c.moveTo(h.x + Math.cos(a) * rr, h.y * K + Math.sin(a) * rr * K); else c.lineTo(h.x + Math.cos(a) * rr, h.y * K + Math.sin(a) * rr * K); } c.closePath(); c.fill();
    c.strokeStyle = 'rgba(236,246,252,0.9)'; c.lineWidth = 1.4; c.stroke(); c.strokeStyle = 'rgba(20,40,60,0.35)'; c.lineWidth = 0.6; c.stroke(); }
  for (i = 0; i < I.shards.length; i++) { var s = I.shards[i]; if (Math.abs(s.x - cam.x) > hw + 20 || Math.abs(s.y * K - cam.y) > hh + 20) continue; c.save(); c.translate(s.x, s.y * K + Math.sin((I.clock || 0) * 1.6 + s.ph) * 0.5); c.rotate(s.a); c.fillStyle = 'rgba(226,238,246,0.92)'; c.beginPath(); c.moveTo(-s.s, -s.s * 0.4); c.lineTo(s.s * 0.8, -s.s * 0.55); c.lineTo(s.s, s.s * 0.35); c.lineTo(-s.s * 0.5, s.s * 0.5); c.closePath(); c.fill(); c.restore(); }
}
var api = { DEF: DEF, make: make, thick: thick, thickRaw: thickRaw, thickAt: thickAt, distAt: distAt, carries: carries, inHole: inHole, crackAt: crackAt, step: step, swimTo: swimTo, morning: morning, draw: draw, drawMarks: drawMarks, noise: noise, hole: hole };
return api;
})();
if (typeof module !== 'undefined') module.exports = Ice;
