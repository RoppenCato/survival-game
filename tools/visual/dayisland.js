// The starter island by day (2026-10-09, Robin: the game's own look is the reference): a World made as the game makes it (one island
// of 60 tiles, the wreck, no jetty), painted round the camp with the ground pieces, the waves, the living grass and the props from
// the buckets, exactly as the game draws them. paint(kit, World, W, H, Z, opts) returns { cv, home, w }: a canvas W by H pixels at
// Z px a unit with the camp at the middle (or opts.at), the home point in canvas pixels, and the world. Shared by herofit.js.
const { createCanvas } = require('../../node_modules/@napi-rs/canvas');
const K = 0.75;
function make(kit, World, seed) {
  const spec = { isle: 60, isle0: 60, count: 1, noDock: true, skerries: 1, rough: 1, beach: 4.5, hue: 0, seed: seed || 11 };
  const w = World.make(kit, spec); w.meadowLook = World.GRASS_INK; w.plant(); w.camp(); w.sortBuckets();
  return w;
}
function paint(kit, World, W, H, Z, opts) {
  opts = opts || {}; const w = opts.world || make(kit, World, opts.seed), cv = createCanvas(W, H), c = cv.getContext('2d');
  const at = opts.at || { x: w.home.x + 120, y: w.home.y - 40 }, hw = W / Z / 2, hh = H / Z / 2, cam = { x: at.x, y: at.y * K, z: 1 };
  c.fillStyle = '#0e1a2a'; c.fillRect(0, 0, W, H);
  c.save(); c.setTransform(Z, 0, 0, Z, 0, 0); c.translate(hw, hh); c.translate(-cam.x, -cam.y); c.lineJoin = 'round'; c.lineCap = 'round';
  for (let i = 0; i < 80; i++) w.drawGround(c, cam, hw, hh);          // the ground is baked one piece a call: call until every piece in view is ready
  w.drawWaves(c, cam, hw, hh, 1.3, 0.75, 1.05);
  w.drawGrass(c, cam, hw, hh, 1.3, World.GRASS_INK);
  const items = [], T = w.T, CT = w.CT, CW = w.CW, CH = w.CH, TS = T * K;
  const bx0 = Math.max(0, Math.floor((cam.x - hw) / T / CT) - 1), bx1 = Math.min(CW - 1, Math.floor((cam.x + hw) / T / CT) + 1);
  const by0 = Math.max(0, Math.floor((cam.y - hh) / TS / CT)), by1 = Math.min(CH - 1, Math.floor((cam.y + hh) / TS / CT) + 1);
  for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
    const list = w.buckets[by * CW + bx]; if (!list) continue;
    list.forEach(o => { const s = w.sprite(o.name, o.v), px = o.x + s.l * o.s, py = o.y * K + s.t * o.s, ww = s.w * o.s, h = s.h * o.s; if (px + ww < cam.x - hw || px > cam.x + hw || py + h < cam.y - hh || py > cam.y + hh) return; items.push({ y: o.y, f: () => c.drawImage(s.cv, px, py, ww, h) }); });
  }
  (opts.items || []).forEach(it => items.push(it));
  items.sort((a, b) => a.y - b.y).forEach(it => it.f());
  c.restore();
  // the game's grain and vignette over the world (templates/game.html lays the kit's grain at the look's texture)
  c.globalAlpha = 0.12; c.fillStyle = kit.grain(c); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
  return { cv, w, cam, toScreen: (x, y) => ({ x: (x - cam.x) * Z + W / 2, y: (y * K - cam.y) * Z + H / 2 }) };
}
function contactShadow(c, x, y, rx, ry) { const g = c.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, 'rgba(30,70,50,0.4)'); g.addColorStop(0.6, 'rgba(30,70,50,0.22)'); g.addColorStop(1, 'rgba(30,70,50,0)'); c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y); c.fillStyle = g; c.beginPath(); c.arc(x, y, rx, 0, 7); c.fill(); c.restore(); }
function sample(cv) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, d = c.getImageData(0, 0, W, H).data; let r = 0, g = 0, b = 0, n = 0;
  for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) { const i = (y * W + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  return '#' + [r / n, g / n, b / n].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}
module.exports = { make, paint, contactShadow, sample };
