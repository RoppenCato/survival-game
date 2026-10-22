// The troll's cave mouth packed for the game (2026-10-22): node pack_cave.js [render dir] [out dir]
// From the render (twice size, 8 px a unit): cracks in the game wall's own ink drawn on the face beside the opening (the wall round it has
// them), halved to 4 px a unit, cut to its drawn pixels, the kit's grain laid on (less the darker the pixel, as the props'). No ink ring: the
// piece melts into the wall the game paints. Two pictures: caveMouth.png (the whole: drawn before the figures) and caveMouth_front.png (the
// face, the lip and what grows on them: drawn over a figure that has walked in past the threshold). caveMouth.json: their size, where the
// threshold's middle lies in them (ax, ay: the wall's foot under the middle of the opening), game units a pixel (upp), and the passage.
const { createCanvas, loadImage } = require('C:/dev/SG/Game Developer/node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const kit = require('C:/dev/SG/Game Developer/src/stylelab.js').kit; kit.setup(kit.STYLE);
const UNIT = 39 / 1.8, COS = Math.cos(35 * Math.PI / 180), SIN = Math.sin(35 * Math.PI / 180), PAD = 4, GRAIN = 0.16;   // less grain than the props: the wall round it is smooth
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
(async () => {
  const inDir = process.argv[2] || 'render', outDir = process.argv[3] || 'packed'; fs.mkdirSync(outDir, { recursive: true });
  const m = JSON.parse(fs.readFileSync(path.join(inDir, 'meta.json'), 'utf8')).caveMouth, S = m.ppm * m.px;   // render px a metre
  const full = await loadImage(path.join(inDir, 'caveMouth.png')), mask = await loadImage(path.join(inDir, 'caveMouth_frontmask.png'));
  const big = createCanvas(full.width, full.height), b = big.getContext('2d'); b.drawImage(full, 0, 0);
  // the cracks: a few joints in the face beside the opening, each a broken line with a pale lip above it, as the game's wall has them
  const P = (x, z, y = -0.3) => [m.anchor.x + x * S, m.anchor.y - (z * COS + y * SIN) * S];
  const cracks = [[[-3.5, 4.5], [-3.2, 3.7], [-3.35, 2.9], [-2.95, 2.1], [-3.15, 1.2], [-2.9, 0.3]], [[-3.2, 3.7], [-3.75, 3.2]], [[-2.95, 2.1], [-2.6, 1.7]],
                  [[3.1, 4.45], [2.85, 3.6], [3.2, 2.7], [2.95, 1.8], [3.3, 0.9], [3.15, 0.1]], [[3.2, 2.7], [3.7, 2.35]], [[2.6, 1.35], [2.8, 0.5]]];
  b.save(); b.globalCompositeOperation = 'source-atop'; b.lineJoin = 'round'; b.lineCap = 'round';
  for (const c of cracks) {
    const pts = []; for (let i = 0; i < c.length - 1; i++) for (let t = 0; t < 4; t++) { const u = t / 4, x = c[i][0] + (c[i + 1][0] - c[i][0]) * u, z = c[i][1] + (c[i + 1][1] - c[i][1]) * u; pts.push(P(x + (t ? (rnd() - 0.5) * 0.08 : 0), z)); }
    pts.push(P(...c[c.length - 1]));
    for (const [col, w, dx, dy] of [['rgba(128,142,152,0.45)', 5, -3, -3], ['rgba(40,34,38,0.72)', 7, 0, 0]]) {
      b.strokeStyle = col; b.lineWidth = w; b.beginPath(); pts.forEach((p, i) => i ? b.lineTo(p[0] + dx, p[1] + dy) : b.moveTo(p[0] + dx, p[1] + dy)); b.stroke();
    }
  }
  b.restore();
  const W = Math.round(full.width / m.px), H = Math.round(full.height / m.px);
  const half = (src) => { const cv = createCanvas(W, H), c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(src, 0, 0, W, H); return cv; };
  const whole = half(big), mk = half(mask), wd = whole.getContext('2d').getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (wd[(y * W + x) * 4 + 3] > 4) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const tw = x1 - x0 + 1 + PAD * 2, th = y1 - y0 + 1 + PAD * 2;
  const t = createCanvas(tw, th), tc = t.getContext('2d'); tc.drawImage(whole, x0, y0, tw - PAD * 2, th - PAD * 2, PAD, PAD, tw - PAD * 2, th - PAD * 2);
  const before = tc.getImageData(0, 0, tw, th);
  tc.globalCompositeOperation = 'source-atop'; tc.globalAlpha = GRAIN; tc.fillStyle = kit.grain(tc); tc.fillRect(0, 0, tw, th);
  { const after = tc.getImageData(0, 0, tw, th), a = after.data, q = before.data;
    for (let i = 0; i < a.length; i += 4) { const lum = (q[i] * 0.3 + q[i + 1] * 0.59 + q[i + 2] * 0.11) / 255, k = Math.min(1, Math.max(0.12, lum * 2.6)); for (let j = 0; j < 3; j++) a[i + j] = q[i + j] + (a[i + j] - q[i + j]) * k; a[i + 3] = q[i + 3]; }
    tc.globalCompositeOperation = 'copy'; tc.globalAlpha = 1; tc.putImageData(after, 0, 0); }
  const front = createCanvas(tw, th), fc = front.getContext('2d'); fc.drawImage(t, 0, 0); const fd = fc.getImageData(0, 0, tw, th);
  const mm = createCanvas(tw, th).getContext('2d'); mm.drawImage(mk, x0, y0, tw - PAD * 2, th - PAD * 2, PAD, PAD, tw - PAD * 2, th - PAD * 2); const md = mm.getImageData(0, 0, tw, th).data;
  for (let i = 3; i < fd.data.length; i += 4) fd.data[i] = Math.min(fd.data[i], md[i]); fc.putImageData(fd, 0, 0);
  fs.writeFileSync(path.join(outDir, 'caveMouth.png'), t.toBuffer('image/png')); fs.writeFileSync(path.join(outDir, 'caveMouth_front.png'), front.toBuffer('image/png'));
  const ax = +(m.anchor.x / m.px - x0 + PAD).toFixed(1), ay = +(m.anchor.y / m.px - y0 + PAD).toFixed(1), upp = +(UNIT / m.ppm).toFixed(4), u = v => Math.round(v * UNIT);
  const meta = { caveMouth: { w: tw, h: th, ax, ay, upp, front: 'caveMouth_front.png',
    opening: { width: u(4.3), height: u(3.6) }, threshold: 0, under_lip: u(0.6), dark_from: u(0.2), dark_full: u(3.4), walk_in: u(2.6), wall_on_screen: 84 } };
  fs.writeFileSync(path.join(outDir, 'caveMouth.json'), JSON.stringify(meta, null, 1));
  console.log('packed', tw + 'x' + th, 'stands at', ax + ',' + ay, '=', Math.round(tw * upp) + 'x' + Math.round(th * upp), 'units;', JSON.stringify(meta.caveMouth));
})();
