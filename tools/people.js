// Packs the people's renders into sheets, every frame of every layer trimmed to its own pixels (2026-10-12, docs/battle-plan.md rung 0).
//   node tools/people.js [art/render/people] [assets/sprites/people] [name]
// tools/sprites.js packs every layer of a model at the one frame size, which is right for the hero (eleven layers) and far
// too much for the people, who are one body under some thirty layers: a helmet is thirty pixels, not a whole frame, and a
// sword swung is somewhere else in every frame. Measured on the first pack (a box a clip and layer): 1166 MB if every sheet
// were decoded; a box a frame: about a sixth of that. So here a sheet is an atlas: the frames of a clip and layer laid one
// after another on shelves (left to right, a new shelf when the next would pass 1024 px), each only as large as what is
// drawn in it. The numbers say, for every direction and frame, the size of its piece and where it lies in the frame at 1x:
// anims[clip].rects[layer] is base64 of four bytes a frame (w, h, x, y; row by row of directions), and the place of each
// piece in the sheet follows from the same shelf rule (src/sprites.js lays them out again: rectsOf; keep the two alike).
// Every piece is cut on the frame's own grid of whole 1x pixels, so the layers, halved separately, still fit each other.
// The sheets are WebP (quality 88): a third of the PNGs' weight, and no difference to be seen at the game's size.
// A layer rendered for only some clips is packed only for those (a thing in the hand). The frames are read one at a time.
const { createCanvas, loadImage } = require('../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
const MAXW = 1024, QUALITY = 88;
// A clip rendered in a frame of its own (2026-10-13: the death; see tools/sprites.js) lies in <in>_own with its own meta.json
// and is packed after the others: the same atlas, the pieces' places counted in its own frame (anims[clip].frame, .anchor).
//   node tools/people.js <in> <out> <name> --own   packs only those clips into the sheets there are.
async function packOwn(out, inDir, outDir) {
  const od = inDir + '_own', mf = path.join(od, 'meta.json'); if (!fs.existsSync(mf)) return 0;
  const m = JSON.parse(fs.readFileSync(mf, 'utf8')), PX = m.px, S = m.size * PX, cv = createCanvas(S, S), c = cv.getContext('2d'), p2 = f => String(f).padStart(2, '0'); let n = 0;
  const all = fs.readdirSync(od);
  for (const a of Object.keys(m.anims)) {
    const NA = m.anims[a].frames, set = new Set(); for (const fn of all) { const q = new RegExp('^' + a + '_([A-Za-z0-9]+)_(?:s|sw|w|nw|n|ne|e|se)_\\d\\d\\.png$').exec(fn); if (q) set.add(q[1]); }
    const order = ['body', 'legs', 'tunic'], lay = [...set].sort((x, y) => (order.indexOf(x) + 1 || 99) - (order.indexOf(y) + 1 || 99) || x.localeCompare(y)), file = (l, d, f) => path.join(od, `${a}_${l}_${d}_${p2(f)}.png`);
    const box = {}; let G = [S, S, 0, 0];
    for (const l of lay) { const list = [];
      for (const d of m.dirs) for (let f = 0; f < NA; f++) {
        const im = await loadImage(file(l, d, f)); c.clearRect(0, 0, S, S); c.drawImage(im, 0, 0); const px = c.getImageData(0, 0, S, S).data; n++; let x0 = S, y0 = S, x1 = -1, y1 = -1;
        for (let y = 0; y < S; y++) { const row = y * S * 4 + 3; for (let x = 0; x < S; x++) if (px[row + x * 4] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
        if (x1 < 0) list.push(null); else { list.push([x0, y0, x1, y1]); G = [Math.min(G[0], x0), Math.min(G[1], y0), Math.max(G[2], x1), Math.max(G[3], y1)]; }
      }
      box[l] = list; process.stdout.write(`\rscanned ${n} frames of ${a}`);
    }
    if (G[0] <= 0 || G[1] <= 0 || G[2] >= S - 1 || G[3] >= S - 1) console.log(`\n!! ${a}: its pixels reach the edge of its own frame (${G.join(',')} of ${S}): render it larger`);
    const ax = m.anchor.x, ay = m.anchor.y, pad = 2 * PX, half = Math.max(ax - G[0], G[2] - ax) + pad, top = ay - G[1] + pad, bottom = Math.max(G[3] - ay, 0) + pad;
    const gx = Math.floor(ax - half), gy = Math.floor(ay - top), gw = Math.ceil(2 * half), gh = Math.ceil(top + bottom), fw = Math.ceil(gw / PX), fh = Math.ceil(gh / PX);
    if (fw > 255 || fh > 255) throw new Error(a + ': its own frame is ' + fw + ' by ' + fh + ': a piece no longer fits a byte');
    for (const fn of fs.readdirSync(outDir)) if (fn.startsWith(a + '_') && /\.webp$/.test(fn) && out.anims[a] && Object.values(out.anims[a].sheets).indexOf(fn) >= 0) fs.unlinkSync(path.join(outDir, fn));
    const A = out.anims[a] = { frames: NA, fps: Math.round(m.anims[a].fps * 100) / 100, sheets: {}, rects: {}, frame: { w: fw, h: fh }, anchor: { x: (ax - gx) / PX, y: (ay - gy) / PX } };
    const H = m.anims[a].hands; if (H) { A.hands = {}; for (const d in H) A.hands[d] = H[d].map(row => row.map(h => [Math.round((h[0] - gx) / PX * 10) / 10, Math.round((h[1] - gy) / PX * 10) / 10, h[2]])); }
    for (const l of lay) {
      const R = box[l].map(b => b ? (() => { const x0 = Math.max(0, Math.floor((b[0] - gx) / PX) - 1), y0 = Math.max(0, Math.floor((b[1] - gy) / PX) - 1), x1 = Math.min(fw, Math.ceil((b[2] + 1 - gx) / PX) + 1), y1 = Math.min(fh, Math.ceil((b[3] + 1 - gy) / PX) + 1); return [x1 - x0, y1 - y0, x0, y0]; })() : [0, 0, 0, 0]);
      if (!R.some(r => r[0])) continue;
      let x = 0, y = 0, sh = 0, W = 1; const at = [];
      for (const r of R) { if (r[0] && x + r[0] > MAXW && x > 0) { x = 0; y += sh; sh = 0; } at.push([x, y]); if (r[0]) { x += r[0]; if (r[1] > sh) sh = r[1]; if (x > W) W = x; } }
      const sheet = createCanvas(W, Math.max(1, y + sh)), sc = sheet.getContext('2d'); sc.imageSmoothingEnabled = true; sc.imageSmoothingQuality = 'high';
      let i = 0;
      for (const d of m.dirs) for (let f = 0; f < NA; f++, i++) { const r = R[i]; if (!r[0]) continue; const im = await loadImage(file(l, d, f)); sc.drawImage(im, gx + r[2] * PX, gy + r[3] * PX, r[0] * PX, r[1] * PX, at[i][0], at[i][1], r[0], r[1]); }
      const fn = `${a}_${l}.webp`; fs.writeFileSync(path.join(outDir, fn), sheet.toBuffer('image/webp', QUALITY)); A.sheets[l] = fn; A.rects[l] = Buffer.from(Uint8Array.from(R.flat())).toString('base64');
    }
    console.log(`\n${a}: its own frame ${fw}x${fh}, anchor ${A.anchor.x.toFixed(1)},${A.anchor.y.toFixed(1)}, ${Object.keys(A.sheets).length} layers`);
  }
  return n;
}
(async () => {
  if (process.argv.includes('--own')) {                                // only the clips with a frame of their own, into the sheets there are
    const av = process.argv.slice(2).filter(x => x !== '--own'), inD = av[0] || path.join('art', 'render', 'people'), outD = av[1] || path.join('assets', 'sprites', 'people'), nm = av[2] || 'people', jf = path.join(outD, nm + '.json');
    const o = JSON.parse(fs.readFileSync(jf, 'utf8')), k = await packOwn(o, inD, outD); fs.writeFileSync(jf, JSON.stringify(o)); console.log(`packed ${k} frames of clips with their own frame into ${outD}`); return;
  }
  const inDir = process.argv[2] || path.join('art', 'render', 'people'), outDir = process.argv[3] || path.join('assets', 'sprites', 'people'), name = process.argv[4] || 'people';
  const meta = JSON.parse(fs.readFileSync(path.join(inDir, 'meta.json'), 'utf8')), PX = meta.px, S = meta.size * PX, dirs = meta.dirs, anims = Object.keys(meta.anims);
  const nf = a => meta.anims[a].frames, pad2 = f => String(f).padStart(2, '0');
  // the layers that are there: from the files' own names
  const layerSet = new Set(); for (const fn of fs.readdirSync(inDir)) { const m = /^(.+)_([A-Za-z0-9]+)_(?:s|sw|w|nw|n|ne|e|se)_\d\d\.png$/.exec(fn); if (m && anims.some(a => fn.startsWith(a + '_' + m[2] + '_'))) layerSet.add(m[2]); }
  const order = ['body', 'legs', 'tunic']; const layers = [...layerSet].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99) || a.localeCompare(b));
  const file = (a, l, d, f) => path.join(inDir, `${a}_${l}_${d}_${pad2(f)}.png`);
  const cv = createCanvas(S, S), c = cv.getContext('2d');
  // pass 1: where the pixels of every frame lie
  const box = {}; let G = [S, S, 0, 0], n = 0;
  for (const a of anims) for (const l of layers) {
    if (!fs.existsSync(file(a, l, dirs[0], 0))) continue;
    const list = []; let any = false;
    for (const d of dirs) for (let f = 0; f < nf(a); f++) {
      const im = await loadImage(file(a, l, d, f)); c.clearRect(0, 0, S, S); c.drawImage(im, 0, 0); const px = c.getImageData(0, 0, S, S).data; n++;
      let x0 = S, y0 = S, x1 = -1, y1 = -1;
      for (let y = 0; y < S; y++) { const row = y * S * 4 + 3; for (let x = 0; x < S; x++) if (px[row + x * 4] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      if (x1 < 0) list.push(null); else { list.push([x0, y0, x1, y1]); any = true; G = [Math.min(G[0], x0), Math.min(G[1], y0), Math.max(G[2], x1), Math.max(G[3], y1)]; }
    }
    if (any) box[a + '|' + l] = list;
    process.stdout.write(`\rscanned ${n} frames`);
  }
  // the frame: round the anchor, as tools/sprites.js makes it
  const ax = meta.anchor.x, ay = meta.anchor.y, pad = 2 * PX, half = Math.max(ax - G[0], G[2] - ax) + pad, top = ay - G[1] + pad, bottom = Math.max(G[3] - ay, 0) + pad;
  const gx = Math.floor(ax - half), gy = Math.floor(ay - top), gw = Math.ceil(2 * half), gh = Math.ceil(top + bottom), fw = Math.ceil(gw / PX), fh = Math.ceil(gh / PX);
  if (fw > 255 || fh > 255) throw new Error('the frame is ' + fw + ' by ' + fh + ': a piece no longer fits a byte');
  fs.mkdirSync(outDir, { recursive: true }); for (const fn of fs.readdirSync(outDir)) if (/\.png$|\.webp$|\.json$/.test(fn)) fs.unlinkSync(path.join(outDir, fn));
  const out = { name, frame: { w: fw, h: fh }, anchor: { x: (ax - gx) / PX, y: (ay - gy) / PX }, dirs, layers, anims: {}, figure_px: meta.figure_px / PX, elev: meta.elev, boxed: 2, shelf: MAXW, source: 'art/source/' + name + '.blend' };
  // pass 2: a sheet a clip and layer, the pieces on shelves
  let bytes = 0, mp = 0;
  for (const a of anims) {
    const NA = nf(a), A = out.anims[a] = { frames: NA, fps: Math.round(meta.anims[a].fps * 100) / 100, sheets: {}, rects: {} };
    const H = meta.anims[a].hands; if (H) { A.hands = {}; for (const d in H) A.hands[d] = H[d].map(row => row.map(h => [Math.round((h[0] - gx) / PX * 10) / 10, Math.round((h[1] - gy) / PX * 10) / 10, h[2]])); }
    for (const l of layers) {
      const list = box[a + '|' + l]; if (!list) continue;
      const R = list.map(b => b ? (() => { const x0 = Math.max(0, Math.floor((b[0] - gx) / PX) - 1), y0 = Math.max(0, Math.floor((b[1] - gy) / PX) - 1), x1 = Math.min(fw, Math.ceil((b[2] + 1 - gx) / PX) + 1), y1 = Math.min(fh, Math.ceil((b[3] + 1 - gy) / PX) + 1); return [x1 - x0, y1 - y0, x0, y0]; })() : [0, 0, 0, 0]);
      let x = 0, y = 0, sh = 0, W = 1; const at = [];
      for (const r of R) { if (r[0] && x + r[0] > MAXW && x > 0) { x = 0; y += sh; sh = 0; } at.push([x, y]); if (r[0]) { x += r[0]; if (r[1] > sh) sh = r[1]; if (x > W) W = x; } }
      const sheet = createCanvas(W, Math.max(1, y + sh)), sc = sheet.getContext('2d'); sc.imageSmoothingEnabled = true; sc.imageSmoothingQuality = 'high';
      let i = 0;
      for (const d of dirs) for (let f = 0; f < NA; f++, i++) { const r = R[i]; if (!r[0]) continue; const im = await loadImage(file(a, l, d, f)); sc.drawImage(im, gx + r[2] * PX, gy + r[3] * PX, r[0] * PX, r[1] * PX, at[i][0], at[i][1], r[0], r[1]); }
      const fn = `${a}_${l}.webp`, buf = sheet.toBuffer('image/webp', QUALITY); fs.writeFileSync(path.join(outDir, fn), buf); bytes += buf.length; mp += sheet.width * sheet.height;
      A.sheets[l] = fn; A.rects[l] = Buffer.from(Uint8Array.from(R.flat())).toString('base64');
    }
    process.stdout.write(`\rpacked ${a}            `);
  }
  await packOwn(out, inDir, outDir);
  const json = JSON.stringify(out); fs.writeFileSync(path.join(outDir, name + '.json'), json);
  console.log(`\n${name}: ${layers.length} layers, ${anims.length} clips, frame ${fw}x${fh}, ${(bytes / 1e6).toFixed(1)} MB on disk, ${(mp * 4 / 1e6).toFixed(0)} MB if every sheet is decoded, the numbers ${(json.length / 1e3).toFixed(0)} KB`);
})();
