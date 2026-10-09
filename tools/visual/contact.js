// Tiles PNG frames into one contact sheet: node tools/visual/contact.js <dir> <glob-prefix> <out.png> [cols] [scale] [bg]
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
(async () => {
  const [dir, prefix, out, colsA, scaleA, bg] = process.argv.slice(2);
  const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.png')).sort();
  if (!files.length) { console.log('no frames'); return; }
  const imgs = await Promise.all(files.map(f => loadImage(path.join(dir, f))));
  const cols = +colsA || Math.min(8, files.length), sc = +scaleA || 1, w = imgs[0].width * sc, h = imgs[0].height * sc, rows = Math.ceil(files.length / cols);
  const cv = createCanvas(cols * w, rows * h), c = cv.getContext('2d');
  c.fillStyle = bg || '#8fa266'; c.fillRect(0, 0, cv.width, cv.height); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  imgs.forEach((im, i) => { c.drawImage(im, (i % cols) * w, Math.floor(i / cols) * h, w, h); c.fillStyle = '#231a16'; c.font = '10px sans-serif'; c.fillText(files[i].replace('.png', ''), (i % cols) * w + 3, Math.floor(i / cols) * h + 11); });
  fs.writeFileSync(out, cv.toBuffer('image/png')); console.log('wrote', out, files.length, 'frames');
})();
