// Packs Blender renders into sprite sheets (2026-10-09): node tools/sprites.js hero [art/render/hero] [assets/sprites/hero]
// Reads the frames render.py wrote (anim_layer_dir_NN.png, double size, with meta.json), finds one crop box that holds every
// frame of every layer and animation (so the layers stack and the animations swap without a jump), keeps the foot anchor at a
// fixed pixel in that box, halves the frames with a smooth filter (the ink line stays soft, like the drawn figure; nothing is
// nearest-neighbour), and packs one sheet per animation and layer: a row per direction, a column per frame. Writes
// <out>/<anim>_<layer>.png and <out>/<name>.json (frame size, the anchor, the directions, the animations with their fps, the layers).
const { createCanvas, loadImage } = require('../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
(async () => {
  const name = process.argv[2] || 'hero', inDir = process.argv[3] || path.join('art', 'render', name), outDir = process.argv[4] || path.join('assets', 'sprites', name);
  const meta = JSON.parse(fs.readFileSync(path.join(inDir, 'meta.json'), 'utf8'));
  const PX = meta.px, S = meta.size * PX, anims = Object.keys(meta.anims), dirs = meta.dirs, layers = meta.layers, NF = meta.frames;
  const files = {}, imgs = {};
  for (const a of anims) for (const l of layers) for (const d of dirs) for (let f = 0; f < NF; f++) {
    const k = `${a}_${l}_${d}_${String(f).padStart(2, '0')}`; files[k] = path.join(inDir, k + '.png'); imgs[k] = await loadImage(files[k]);
  }
  // the union of the drawn pixels over every frame, at render size
  let x0 = S, y0 = S, x1 = 0, y1 = 0; const cv = createCanvas(S, S), c = cv.getContext('2d');
  for (const k in imgs) {
    c.clearRect(0, 0, S, S); c.drawImage(imgs[k], 0, 0); const px = c.getImageData(0, 0, S, S).data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (px[(y * S + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  // a box round the anchor: symmetric left and right of it (so a flipped sheet would still align), a little air all round
  const ax = meta.anchor.x, ay = meta.anchor.y, pad = 2 * PX;
  const half = Math.max(ax - x0, x1 - ax) + pad, top = ay - y0 + pad, bottom = Math.max(y1 - ay, 0) + pad;
  const bx = Math.floor(ax - half), by = Math.floor(ay - top), bw = Math.ceil(2 * half), bh = Math.ceil(top + bottom);
  const fw = Math.ceil(bw / PX), fh = Math.ceil(bh / PX);              // the frame at 1x
  const anchor = { x: (ax - bx) / PX, y: (ay - by) / PX };
  fs.mkdirSync(outDir, { recursive: true });
  const out = { name, frame: { w: fw, h: fh }, anchor, dirs, layers, anims: {}, figure_px: meta.figure_px / PX, elev: meta.elev, source: 'art/source/' + name + '.blend' };
  for (const a of anims) {
    out.anims[a] = { frames: NF, fps: Math.round(meta.anims[a].fps * 100) / 100, sheets: {} };
    for (const l of layers) {
      const sheet = createCanvas(fw * NF, fh * dirs.length), sc = sheet.getContext('2d'); sc.imageSmoothingEnabled = true; sc.imageSmoothingQuality = 'high';
      dirs.forEach((d, r) => { for (let f = 0; f < NF; f++) {
        const im = imgs[`${a}_${l}_${d}_${String(f).padStart(2, '0')}`];
        sc.drawImage(im, bx, by, bw, bh, f * fw, r * fh, fw, fh);
      } });
      const file = `${a}_${l}.png`; fs.writeFileSync(path.join(outDir, file), sheet.toBuffer('image/png')); out.anims[a].sheets[l] = file;
    }
  }
  fs.writeFileSync(path.join(outDir, name + '.json'), JSON.stringify(out, null, 1));
  console.log(`packed ${Object.keys(imgs).length} frames into ${outDir}: frame ${fw}x${fh}, anchor ${anchor.x.toFixed(1)},${anchor.y.toFixed(1)}, figure ${(meta.figure_px / PX).toFixed(0)} px`);
})();
