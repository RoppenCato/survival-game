// Packs the Blender set pieces (art/build/caves_build.py: the peaks, the cave mouth; it was rocks_build.py until 2026-10-20) for the game (2026-10-12):
//   node tools/props.js [render dir] [out dir]
// Each render is halved with a smooth filter (it was rendered at twice its size), cut down to its drawn pixels, and written to
// assets/props/<name>.png; props.json gives each piece's size in pixels, where its origin (the spot it stands on) lies in the
// image, and how many game units a pixel is (0.5: two pixels a unit, as the kit's props are baked). src/world.js draws them as
// props (World.setImages); tools/build.py hands the pages the numbers and the paths.
// A piece is then given the drawn world's own finish (2026-10-12, Robin: the peaks read as clean low-poly shapes beside the
// hand-drawn trees): the kit's grain over it, a cool shade toward the lower right, and the ink line the props have: thin all
// round the silhouette and heavy on the shadow side (the silhouette in ink laid under the piece at a ring of offsets).
const { createCanvas, loadImage } = require('../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const kit = require('../src/stylelab.js').kit; kit.setup(kit.STYLE);
const INK = '#261e1a', PAD = 5, GRAIN = 0.4, SHADE = 0.2;
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
    const tw = x1 - x0 + 1 + PAD * 2, th = y1 - y0 + 1 + PAD * 2, t = createCanvas(tw, th), tc = t.getContext('2d'); tc.drawImage(cv, x0, y0, tw - PAD * 2, th - PAD * 2, PAD, PAD, tw - PAD * 2, th - PAD * 2);
    // the finish, inside the piece's own shape: grain, then a cool shade toward the lower right
    const before = tc.getImageData(0, 0, tw, th);
    tc.globalCompositeOperation = 'source-atop'; tc.globalAlpha = GRAIN; tc.fillStyle = kit.grain(tc); tc.fillRect(0, 0, tw, th);
    { const after = tc.getImageData(0, 0, tw, th), a = after.data, b = before.data;         // less grain the darker the pixel: a pale speck in a deep shadow sits on the picture's surface and flattens it (the cave's inside)
      for (let i = 0; i < a.length; i += 4) { const lum = (b[i] * 0.3 + b[i + 1] * 0.59 + b[i + 2] * 0.11) / 255, k = Math.min(1, Math.max(0.12, lum * 2.6)); a[i] = b[i] + (a[i] - b[i]) * k; a[i + 1] = b[i + 1] + (a[i + 1] - b[i + 1]) * k; a[i + 2] = b[i + 2] + (a[i + 2] - b[i + 2]) * k; }
      tc.globalCompositeOperation = 'copy'; tc.globalAlpha = 1; tc.putImageData(after, 0, 0); tc.globalCompositeOperation = 'source-atop'; }
    const g = tc.createLinearGradient(tw * 0.25, th * 0.2, tw * 0.8, th * 0.95); g.addColorStop(0, 'rgba(24,34,70,0)'); g.addColorStop(1, 'rgba(24,34,70,' + SHADE + ')'); tc.globalAlpha = 1; tc.fillStyle = g; tc.fillRect(0, 0, tw, th);
    tc.globalCompositeOperation = 'source-over';
    // the ink: the silhouette in one colour, under the piece, a hair out all round and further out to the lower right
    const sil = createCanvas(tw, th), sc = sil.getContext('2d'); sc.drawImage(t, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = INK; sc.fillRect(0, 0, tw, th);
    const fin = createCanvas(tw, th), fc = fin.getContext('2d'), ax0 = m.anchor.x / m.px - x0 + PAD, ay0 = m.anchor.y / m.px - y0 + PAD;
    if (name.startsWith('peak')) {                      // the shadow a peak throws east over the snow at its foot: it stands on the ground, it does not float
      const sg = fc.createRadialGradient(0, 0, 0, 0, 0, 1); sg.addColorStop(0, 'rgba(22,32,64,0.5)'); sg.addColorStop(0.65, 'rgba(22,32,64,0.3)'); sg.addColorStop(1, 'rgba(22,32,64,0)');
      fc.save(); fc.translate(ax0 + tw * 0.07, ay0 + th * 0.015); fc.scale(tw * 0.45, th * 0.13); fc.fillStyle = sg; fc.beginPath(); fc.arc(0, 0, 1, 0, 7); fc.fill(); fc.restore();
    }
    [[-0.8, 0], [0.8, 0], [0, -0.8], [0, 0.8], [0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [1.3, 0.8], [0.8, 1.3], [1.7, 1.6], [2.3, 1.9], [1.9, 2.4]].forEach(o => fc.drawImage(sil, o[0], o[1]));
    fc.drawImage(t, 0, 0);
    fs.writeFileSync(path.join(outDir, name + '.png'), fin.toBuffer('image/png'));
    out[name] = { w: tw, h: th, ax: +(m.anchor.x / m.px - x0 + PAD).toFixed(1), ay: +(m.anchor.y / m.px - y0 + PAD).toFixed(1), upp: +(39 / 1.8 / m.ppm).toFixed(4) };
    console.log('packed', name, tw + 'x' + th, 'px, stands at', out[name].ax + ',' + out[name].ay, '=', Math.round(tw * out[name].upp) + 'x' + Math.round(th * out[name].upp), 'units');
  }
  fs.writeFileSync(path.join(outDir, 'props.json'), JSON.stringify(out, null, 1));
})();
