// Packs Blender renders into sprite sheets (2026-10-09): node tools/sprites.js hero [art/render/hero] [assets/sprites/hero]
// Reads the frames render.py wrote (anim_layer_dir_NN.png, double size, with meta.json), finds one crop box that holds every
// frame of every layer and animation (so the layers stack and the animations swap without a jump), keeps the foot anchor at a
// fixed pixel in that box, halves the frames with a smooth filter (the ink line stays soft, like the drawn figure; nothing is
// nearest-neighbour), and packs one sheet per animation and layer: a row per direction, a column per frame. Writes
// <out>/<anim>_<layer>.png and <out>/<name>.json (frame size, the anchor, the directions, the animations with their fps, the layers).
// A clip rendered in a frame of its own (2026-10-13: a man falling ends outside the frame every other clip fits in, so the
// death is rendered larger, lower and held in place: render.py --size 208 --aim 0.6 --inplace death) lies in <in>_own with
// its own meta.json. It is packed after the others with its own frame and anchor (anims[clip].frame, .anchor), which
// src/sprites.js draws by.   node tools/sprites.js <name> <in> <out> --own   packs only those clips into the sheets there are.
const { createCanvas, loadImage } = require('../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
async function packOwn(out, inDir, outDir) {
  const od = inDir + '_own', mf = path.join(od, 'meta.json'); if (!fs.existsSync(mf)) return 0;
  const m = JSON.parse(fs.readFileSync(mf, 'utf8')), PX = m.px, S = m.size * PX, cv = createCanvas(S, S), c = cv.getContext('2d'), p2 = f => String(f).padStart(2, '0'); let n = 0;
  for (const a of Object.keys(m.anims)) {
    const NA = m.anims[a].frames, lay = m.layers.filter(l => fs.existsSync(path.join(od, `${a}_${l}_${m.dirs[0]}_00.png`))), imgs = {}; let x0 = S, y0 = S, x1 = 0, y1 = 0;
    for (const l of lay) for (const d of m.dirs) for (let f = 0; f < NA; f++) {
      const k = `${a}_${l}_${d}_${p2(f)}`, im = imgs[k] = await loadImage(path.join(od, k + '.png')); c.clearRect(0, 0, S, S); c.drawImage(im, 0, 0); const px = c.getImageData(0, 0, S, S).data; n++;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (px[(y * S + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x0 <= 0 || y0 <= 0 || x1 >= S - 1 || y1 >= S - 1) console.log(`!! ${a}: its pixels reach the edge of its own frame (${x0},${y0} to ${x1},${y1} of ${S}): render it larger`);
    const ax = m.anchor.x, ay = m.anchor.y, pad = 2 * PX, half = Math.max(ax - x0, x1 - ax) + pad, top = ay - y0 + pad, bottom = Math.max(y1 - ay, 0) + pad;
    const bx = Math.floor(ax - half), by = Math.floor(ay - top), bw = Math.ceil(2 * half), bh = Math.ceil(top + bottom), fw = Math.ceil(bw / PX), fh = Math.ceil(bh / PX);
    const A = out.anims[a] = { frames: NA, fps: Math.round(m.anims[a].fps * 100) / 100, sheets: {}, frame: { w: fw, h: fh }, anchor: { x: (ax - bx) / PX, y: (ay - by) / PX } };
    if (m.anims[a].hands) { A.hands = {}; for (const d of m.dirs) A.hands[d] = (m.anims[a].hands[d] || []).map(row => row.map(h => [Math.round((h[0] - bx) / PX * 10) / 10, Math.round((h[1] - by) / PX * 10) / 10, h[2]])); }
    for (const l of lay) {
      const sheet = createCanvas(fw * NA, fh * m.dirs.length), sc = sheet.getContext('2d'); sc.imageSmoothingEnabled = true; sc.imageSmoothingQuality = 'high';
      m.dirs.forEach((d, r) => { for (let f = 0; f < NA; f++) sc.drawImage(imgs[`${a}_${l}_${d}_${p2(f)}`], bx, by, bw, bh, f * fw, r * fh, fw, fh); });
      const file = `${a}_${l}.png`; fs.writeFileSync(path.join(outDir, file), sheet.toBuffer('image/png')); A.sheets[l] = file;
    }
    console.log(`${a}: its own frame ${fw}x${fh}, anchor ${A.anchor.x.toFixed(1)},${A.anchor.y.toFixed(1)}`);
  }
  return n;
}
(async () => {
  if (process.argv.includes('--own')) {                                // only the clips with a frame of their own, into the sheets there are
    const nm = process.argv[2], inD = process.argv[3] || path.join('art', 'render', nm), outD = process.argv[4] && process.argv[4] !== '--own' ? process.argv[4] : path.join('assets', 'sprites', nm), jf = path.join(outD, nm + '.json');
    const o = JSON.parse(fs.readFileSync(jf, 'utf8')), k = await packOwn(o, inD, outD); fs.writeFileSync(jf, JSON.stringify(o, null, 1)); console.log(`packed ${k} frames of clips with their own frame into ${outD}`); return;
  }
  const name = process.argv[2] || 'hero', inDir = process.argv[3] || path.join('art', 'render', name), outDir = process.argv[4] || path.join('assets', 'sprites', name);
  const meta = JSON.parse(fs.readFileSync(path.join(inDir, 'meta.json'), 'utf8'));
  const PX = meta.px, S = meta.size * PX, anims = Object.keys(meta.anims), dirs = meta.dirs, layers = meta.layers, NF = meta.frames;
  const files = {}, imgs = {};
  const nf = a => meta.anims[a].frames;
  const has = {};                                                     // a layer rendered only for some animations (a thing in the hand) is packed only there (2026-10-09)
  for (const a of anims) for (const l of layers) { has[a + '|' + l] = fs.existsSync(path.join(inDir, `${a}_${l}_${dirs[0]}_00.png`)); if (!has[a + '|' + l]) continue;
    for (const d of dirs) for (let f = 0; f < nf(a); f++) { const k = `${a}_${l}_${d}_${String(f).padStart(2, '0')}`; files[k] = path.join(inDir, k + '.png'); imgs[k] = await loadImage(files[k]); } }
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
  if (parseFloat(process.argv[5]) > 0) out.scale = parseFloat(process.argv[5]);   // a sheet rendered at fewer pixels a metre is drawn this much larger (the trolls: 1.333)
  for (const a of anims) {
    const NA = nf(a); out.anims[a] = { frames: NA, fps: Math.round(meta.anims[a].fps * 100) / 100, sheets: {} };
    if (meta.anims[a].hands) { out.anims[a].hands = {}; for (const d of dirs) out.anims[a].hands[d] = (meta.anims[a].hands[d] || []).map(row => row.map(h => [Math.round((h[0] - bx) / PX * 10) / 10, Math.round((h[1] - by) / PX * 10) / 10, h[2]])); }   // the wrists in frame pixels at 1x (2026-10-09)
    for (const l of layers) {
      if (!has[a + '|' + l]) continue;
      const sheet = createCanvas(fw * NA, fh * dirs.length), sc = sheet.getContext('2d'); sc.imageSmoothingEnabled = true; sc.imageSmoothingQuality = 'high';
      dirs.forEach((d, r) => { for (let f = 0; f < NA; f++) {
        const im = imgs[`${a}_${l}_${d}_${String(f).padStart(2, '0')}`];
        sc.drawImage(im, bx, by, bw, bh, f * fw, r * fh, fw, fh);
      } });
      const file = `${a}_${l}.png`; fs.writeFileSync(path.join(outDir, file), sheet.toBuffer('image/png')); out.anims[a].sheets[l] = file;
    }
  }
  await packOwn(out, inDir, outDir);
  fs.writeFileSync(path.join(outDir, name + '.json'), JSON.stringify(out, null, 1));
  console.log(`packed ${Object.keys(imgs).length} frames into ${outDir}: frame ${fw}x${fh}, anchor ${anchor.x.toFixed(1)},${anchor.y.toFixed(1)}, figure ${(meta.figure_px / PX).toFixed(0)} px`);
})();
