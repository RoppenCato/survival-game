// A contact sheet of a rendered animal for checking before it is packed (2026-10-11): a row per clip and direction, a column per
// frame, cropped round the animal.   node tools/visual/beastsheet.js <render dir> <out.png> [dirs, e.g. w,s] [crop px] [scale]
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
(async () => {
  const [dir, out, dirsA, cropA, scaleA] = process.argv.slice(2);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')), FS = meta.size * meta.px, dirs = (dirsA || 'w,s').split(','), anims = Object.keys(meta.anims);
  const crop = Math.min(FS, (+cropA || 200) * meta.px), sc = +scaleA || 1 / meta.px, cell = Math.round(crop * sc), maxF = Math.max(...anims.map(a => meta.anims[a].frames));
  const cx = meta.anchor.x, cy = meta.anchor.y - crop * 0.28;
  const cv = createCanvas(maxF * cell + 70, anims.length * dirs.length * cell), c = cv.getContext('2d'); c.fillStyle = '#8fa870'; c.fillRect(0, 0, cv.width, cv.height);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; let row = 0;
  for (const a of anims) for (const d of dirs) {
    for (let f = 0; f < meta.anims[a].frames; f++) {
      const p = path.join(dir, `${a}_body_${d}_${String(f).padStart(2, '0')}.png`); if (!fs.existsSync(p)) continue;
      const im = await loadImage(p); c.drawImage(im, cx - crop / 2, cy - crop / 2, crop, crop, 70 + f * cell, row * cell, cell, cell);
    }
    c.fillStyle = '#231a16'; c.font = 'bold 12px sans-serif'; c.fillText(a + ' ' + d, 4, row * cell + 16); row++;
  }
  fs.writeFileSync(out, cv.toBuffer('image/png')); console.log('wrote', out);
})();
