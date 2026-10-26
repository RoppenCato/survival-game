// Packs the trees (2026-10-20): work/trees/<render dir> (from trees_build.py) into pictures for the game, as the fires were packed.
//   node tools/trees_pack.js <render dir> <out dir>
// Each picture from its render at twice the size: halved with a smooth filter, cut to its own pixels with room for the ink ring,
// and given the set pieces' finish (tools/props.js in the game: the kit's grain, a cool shade toward the lower right, the silhouette
// in ink a hair out all round and heavier to the lower right). Writes <name>.png and trees.json:
//   { <name>: { w, h, ax, ay, upp, height_m, kind, variant | trunk | log } }
// ax, ay: where the tree's foot (its origin, the spot it stands on) lies in the picture; upp: game units a pixel. A trunk's ax, ay
// is the middle of its length on the ground, its chopped end toward -x (the game flips it for a fall the other way).
const GAME = 'C:/dev/SG/Game Developer';
const { createCanvas, loadImage } = require(GAME + '/node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const kit = require(GAME + '/src/stylelab.js').kit; kit.setup(kit.STYLE);
const INK = '#261e1a', PAD = 5, GRAIN = 0.4, SHADE = 0.2;
const [inDir, outDir] = process.argv.slice(2); fs.mkdirSync(outDir, { recursive: true });
const meta = JSON.parse(fs.readFileSync(path.join(inDir, 'meta.json'), 'utf8'));
function halve(im, px) { const W = Math.round(im.width / px), H = Math.round(im.height / px), cv = createCanvas(W, H), c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(im, 0, 0, W, H); return cv; }
function bounds(cv) { const W = cv.width, H = cv.height, d = cv.getContext('2d').getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 6) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return [x0, y0, x1, y1]; }
function cut(cv, b) { const tw = b[2] - b[0] + 1 + PAD * 2, th = b[3] - b[1] + 1 + PAD * 2, t = createCanvas(tw, th), c = t.getContext('2d'); c.drawImage(cv, b[0], b[1], tw - PAD * 2, th - PAD * 2, PAD, PAD, tw - PAD * 2, th - PAD * 2); return t; }
function finish(t) {                                     // the set pieces' finish (as tools/props.js and tools/fires_pack.js)
  const tw = t.width, th = t.height, tc = t.getContext('2d'), before = tc.getImageData(0, 0, tw, th);
  tc.globalCompositeOperation = 'source-atop'; tc.globalAlpha = GRAIN; tc.fillStyle = kit.grain(tc); tc.fillRect(0, 0, tw, th);
  const after = tc.getImageData(0, 0, tw, th), a = after.data, b = before.data;
  for (let i = 0; i < a.length; i += 4) { const lum = (b[i] * 0.3 + b[i + 1] * 0.59 + b[i + 2] * 0.11) / 255, k = Math.min(1, Math.max(0.12, lum * 2.6)); a[i] = b[i] + (a[i] - b[i]) * k; a[i + 1] = b[i + 1] + (a[i + 1] - b[i + 1]) * k; a[i + 2] = b[i + 2] + (a[i + 2] - b[i + 2]) * k; a[i + 3] = b[i + 3]; }
  tc.globalCompositeOperation = 'copy'; tc.globalAlpha = 1; tc.putImageData(after, 0, 0); tc.globalCompositeOperation = 'source-atop';
  const g = tc.createLinearGradient(tw * 0.25, th * 0.2, tw * 0.8, th * 0.95); g.addColorStop(0, 'rgba(24,34,70,0)'); g.addColorStop(1, 'rgba(24,34,70,' + SHADE + ')'); tc.fillStyle = g; tc.fillRect(0, 0, tw, th);
  tc.globalCompositeOperation = 'source-over';
  const sil = createCanvas(tw, th), sc = sil.getContext('2d'); sc.drawImage(t, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = INK; sc.fillRect(0, 0, tw, th);
  const fin = createCanvas(tw, th), fc = fin.getContext('2d');
  [[-0.8, 0], [0.8, 0], [0, -0.8], [0, 0.8], [0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [1.3, 0.8], [0.8, 1.3], [1.7, 1.6], [2.3, 1.9], [1.9, 2.4]].forEach(o => fc.drawImage(sil, o[0], o[1]));
  fc.drawImage(t, 0, 0); return fin;
}
(async () => {
  const out = {}; let bytes = 0, mb = 0;
  for (const name of Object.keys(meta)) {
    const m = meta[name], px = m.px, im = halve(await loadImage(path.join(inDir, name + '.png')), px), b = bounds(im);
    b[0] = Math.max(0, b[0] - 3); b[1] = Math.max(0, b[1] - 3); b[2] = Math.min(im.width - 1, b[2] + 3); b[3] = Math.min(im.height - 1, b[3] + 3);
    const T = finish(cut(im, b)), tw = T.width, th = T.height, buf = T.toBuffer('image/png'); fs.writeFileSync(path.join(outDir, name + '.png'), buf); bytes += buf.length; mb += tw * th * 4 / 1e6;
    const upp = +(39 / 1.8 / m.ppm).toFixed(4), mm = /^(\w+?)_(\d+|trunk|log)$/.exec(name);
    out[name] = { w: tw, h: th, ax: +(m.anchor.x / px - b[0] + PAD).toFixed(1), ay: +(m.anchor.y / px - b[1] + PAD).toFixed(1), upp, height_m: m.height_m, kind: mm ? mm[1] : name, part: mm && isNaN(+mm[2]) ? mm[2] : 'tree', variant: mm && !isNaN(+mm[2]) ? +mm[2] : undefined };
    console.log('packed', name, tw + 'x' + th, 'px, stands at', out[name].ax + ',' + out[name].ay, '=', (tw * upp).toFixed(1) + 'x' + (th * upp).toFixed(1), 'units');
  }
  fs.writeFileSync(path.join(outDir, 'trees.json'), JSON.stringify(out, null, 1));
  console.log('wrote', path.join(outDir, 'trees.json'), Object.keys(out).length, 'pictures,', (bytes / 1e6).toFixed(2), 'MB on disk,', mb.toFixed(1), 'MB decoded');
})();
