// A look at the people's layers before they are packed (2026-10-12): node tools/visual/peoplecheck.js <render dir> <out.png> [anim] [frame]
// The first row is the body with its tunic and trousers coloured and laid together (what the game will do); under it one row
// a layer as it was rendered (a '+name' layer is that piece on the whole body, for judging its shape). A column a direction.
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
(async () => {
  const [dir, out, animA, frameA] = process.argv.slice(2);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')), FS = meta.size * meta.px, dirs = meta.dirs, anims = animA ? animA.split(',') : Object.keys(meta.anims), f = String(+frameA || 0).padStart(2, '0');
  const crop = 230, cx = meta.anchor.x - crop / 2, cy = meta.anchor.y - crop + 26, cell = Math.round(crop * 0.62), layers = meta.layers, cols = dirs.length * anims.length;
  const cv = createCanvas(cols * cell + 96, (layers.length + 1) * cell), c = cv.getContext('2d'); c.fillStyle = '#8fa870'; c.fillRect(0, 0, cv.width, cv.height); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const img = async (a, l, d) => { const p = path.join(dir, `${a}_${l}_${d}_${f}.png`); return fs.existsSync(p) ? loadImage(p) : null; };
  const tint = (im, col) => { const t = createCanvas(FS, FS), g = t.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, FS, FS); g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0); return t; };
  let col = 0;
  for (const a of anims) for (const d of dirs) {
    const b = await img(a, 'body', d), t = await img(a, 'tunic', d), l = await img(a, 'legs', d), x = 96 + col * cell;
    if (b) c.drawImage(b, cx, cy, crop, crop, x, 0, cell, cell);
    if (l) c.drawImage(tint(l, '#4a4038'), cx, cy, crop, crop, x, 0, cell, cell);
    if (t) c.drawImage(tint(t, col % 2 ? '#7d4a3a' : '#5b6b4a'), cx, cy, crop, crop, x, 0, cell, cell);
    for (let r = 0; r < layers.length; r++) { const im = await img(a, layers[r], d); if (im) c.drawImage(im, cx, cy, crop, crop, x, (r + 1) * cell, cell, cell); }
    c.fillStyle = '#1b1612'; c.font = 'bold 12px sans-serif'; c.fillText(a + ' ' + d, x + 4, 13); col++;
  }
  c.fillStyle = '#1b1612'; c.font = 'bold 13px sans-serif'; c.fillText('together', 6, cell / 2); layers.forEach((l, r) => c.fillText(l, 6, (r + 1.5) * cell));
  fs.writeFileSync(out, cv.toBuffer('image/png')); console.log(out, cv.width + 'x' + cv.height);
})();
