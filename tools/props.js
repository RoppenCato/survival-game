// Packs the Blender set pieces (art/build/rocks_build.py: the peaks, the cave mouth) for the game (2026-10-12):
//   node tools/props.js [render dir] [out dir]
// Each render is halved with a smooth filter (it was rendered at twice its size), cut down to its drawn pixels, and written to
// assets/props/<name>.png; props.json gives each piece's size in pixels, where its origin (the spot it stands on) lies in the
// image, and how many game units a pixel is (0.5: two pixels a unit, as the kit's props are baked). src/world.js draws them as
// props (World.setImages); tools/build.py hands the pages the numbers and the paths.
const { createCanvas, loadImage } = require('../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
(async () => {
  const inDir = process.argv[2] || path.join('art', 'render', 'rocks'), outDir = process.argv[3] || path.join('assets', 'props');
  const meta = JSON.parse(fs.readFileSync(path.join(inDir, 'meta.json'), 'utf8')), out = fs.existsSync(path.join(outDir, 'props.json')) ? JSON.parse(fs.readFileSync(path.join(outDir, 'props.json'), 'utf8')) : {};
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of Object.keys(meta)) {
    const m = meta[name], im = await loadImage(path.join(inDir, name + '.png')), W = Math.round(im.width / m.px), H = Math.round(im.height / m.px);
    const cv = createCanvas(W, H), c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(im, 0, 0, W, H);
    const d = c.getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 6) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(W - 1, x1 + 2); y1 = Math.min(H - 1, y1 + 2);
    const tw = x1 - x0 + 1, th = y1 - y0 + 1, t = createCanvas(tw, th); t.getContext('2d').drawImage(cv, x0, y0, tw, th, 0, 0, tw, th);
    fs.writeFileSync(path.join(outDir, name + '.png'), t.toBuffer('image/png'));
    out[name] = { w: tw, h: th, ax: +(m.anchor.x / m.px - x0).toFixed(1), ay: +(m.anchor.y / m.px - y0).toFixed(1), upp: +(39 / 1.8 / m.ppm).toFixed(4) };
    console.log('packed', name, tw + 'x' + th, 'px, stands at', out[name].ax + ',' + out[name].ay, '=', Math.round(tw * out[name].upp) + 'x' + Math.round(th * out[name].upp), 'units');
  }
  fs.writeFileSync(path.join(outDir, 'props.json'), JSON.stringify(out, null, 1));
})();
