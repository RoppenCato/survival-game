// The starter island by day (2026-10-09, Robin: the game's own look is the reference): a World made as the game makes it (one island
// of 60 tiles, the wreck, no jetty), painted round the camp with the ground pieces, the waves, the living grass and the props from
// the buckets, exactly as the game draws them. paint(kit, World, W, H, Z, opts) returns { cv, home, w }: a canvas W by H pixels at
// Z px a unit with the camp at the middle (or opts.at), the home point in canvas pixels, and the world. Shared by herofit.js.
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas');
const fs = require('fs'), path = require('path');
const K = 0.75;
/* The studio's set pieces, as the game draws them (2026-10-21, the Art Director: the round drawn bushes in this scene were the most
   out-of-style thing on screen, and the game no longer draws them): await load(World) before make() and paint(), and every
   picture of assets/props (props.json and each folder's own json, as tools/build.py gathers them) goes to World.setImages, so
   w.sprite gives the pictures, drawn at their own size with the game's cast shadow and, on grass, the halo and the meadow's blades
   at the foot (the sticker cure). Node decodes a picture only once its event loop has run, hence the await. A script that does
   not call load() gets the drawn props as before. */
let PIECES = null;
async function load(World) {
  if (PIECES) return PIECES;
  const root = path.join(__dirname, '..', '..', 'assets', 'props'), map = {}, jobs = [];
  const add = (dir, j) => { for (const n in j) { const fp = path.join(dir, n + '.png'); if (!fs.existsSync(fp)) continue; jobs.push(loadImage(fs.readFileSync(fp)).then(im => { map[n] = { img: im, w: j[n].w, h: j[n].h, ax: j[n].ax, ay: j[n].ay, upp: j[n].upp }; })); } };
  const top = path.join(root, 'props.json'); if (fs.existsSync(top)) add(root, JSON.parse(fs.readFileSync(top, 'utf8')));
  for (const sub of fs.readdirSync(root)) { const jp = path.join(root, sub, sub + '.json'); if (fs.existsSync(jp)) add(path.join(root, sub), JSON.parse(fs.readFileSync(jp, 'utf8'))); }
  await Promise.all(jobs); World.setImages(map); PIECES = map; return map;
}
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
  if (w.drawFalls) w.drawFalls(c, cam, hw, hh, 1.3);
  w.drawGrass(c, cam, hw, hh, 1.3, World.GRASS_INK);
  const items = [], T = w.T, CT = w.CT, CW = w.CW, CH = w.CH, TS = T * K;
  const bx0 = Math.max(0, Math.floor((cam.x - hw) / T / CT) - 1), bx1 = Math.min(CW - 1, Math.floor((cam.x + hw) / T / CT) + 1);
  const by0 = Math.max(0, Math.floor((cam.y - hh) / TS / CT)), by1 = Math.min(CH - 1, Math.floor((cam.y + hh) / TS / CT) + 1);
  for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
    const list = w.buckets[by * CW + bx]; if (!list) continue;
    list.forEach(o => { if (o.painted) return; const s = w.sprite(o.name, o.v), sS = s.fixed ? 1 : o.s, px = o.x + s.l * sS, py = o.y * K + s.t * sS, ww = s.w * sS, h = s.h * sS; if (px + ww < cam.x - hw - h || px > cam.x + hw || py + h < cam.y - hh || py > cam.y + hh + h) return;
      if (w.castShadow && h >= 10) w.castShadow(c, o.x, o.y * K, ww, h, { k: 1, len: 1, dusk: 0 });   // the game's shadow, under everything that stands
      const gr = w.onGrass && h > 6 && !o.peak && !o.inFace ? w.onGrass(o.x, o.y) : 0;
      items.push({ y: o.y, f: () => { if (gr) w.footHalo(c, o.x, o.y * K, ww); c.drawImage(s.cv, px, py, ww, h); if (gr) w.footGrass(c, s, o.x, o.y * K + 0.7, ww, gr === 2, World.GRASS_INK); } }); });
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
module.exports = { load, make, paint, contactShadow, sample };
