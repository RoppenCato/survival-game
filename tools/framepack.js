// The per-frame packer (2026-10-21, Robin: "do the laggy idles and frame rate"; the art plan's foundation, item 8).
//   node tools/framepack.js <set> [<set> ...]      one or more sets in assets/sprites
//   node tools/framepack.js --all                  every set still in whole frames
//   node tools/framepack.js --dry --all            measure only, write nothing
// A set of whole-frame sheets (every frame in a box the size of the largest pose, a row a direction) keeps most of its pixels
// empty. This cuts each frame of each clip and layer to its own pixels (plus a pixel of margin) and lays the pieces left to
// right on shelves 1024 px wide, in the people's format: anims[clip].rects[layer] is base64 of four bytes a frame (w, h, and
// the piece's corner in the frame; eight bytes, two a number, when a clip's frame passes 255 px: anims[clip].rectBytes 2), row by
// row of directions, and where each piece lies in the sheet follows from the shelf rule (src/sprites.js rectsOf lays them out
// again: keep the two alike). A layer that was packed in a box of its own (anims[clip].boxes[layer]) has its corner folded into
// the pieces. The sheets keep their names; the frame, the anchor and the hands stay as they were. A set already in pieces
// (meta.boxed, or a clip with rects) is left alone. tools/sprites.js runs this after every pack.
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SPR = path.join(ROOT, 'assets', 'sprites'), MAXW = 1024;
const args = process.argv.slice(2), dry = args.includes('--dry');
let sets = args.filter(a => !a.startsWith('--'));
if (args.includes('--all')) sets = fs.readdirSync(SPR).filter(n => fs.existsSync(path.join(SPR, n, n + '.json')));

async function packSet(name) {
  const dir = path.join(SPR, name), jp = path.join(dir, name + '.json'), M = JSON.parse(fs.readFileSync(jp, 'utf8'));
  if (M.boxed || Object.values(M.anims).some(A => A.rects)) return { name, skipped: 'already in pieces' };
  const rows = M.dirs.length; let before = 0, after = 0; const out = {};
  for (const [clip, A] of Object.entries(M.anims)) {
    const F0 = A.frame || M.frame, n = A.frames, R = {}, img = {};
    for (const [layer, file] of Object.entries(A.sheets)) {
      const LB = A.boxes && A.boxes[layer], lw = LB ? LB[2] : F0.w, lh = LB ? LB[3] : F0.h, bx = LB ? LB[0] : 0, by = LB ? LB[1] : 0;
      const fp = path.join(dir, file); let im = null; try { im = fs.existsSync(fp) ? await loadImage(fs.readFileSync(fp)) : null; } catch (e) {} if (!im) { console.log('  ' + name + ': ' + file + ' is missing or unreadable; that set is left as it is'); return { name, skipped: 'a sheet missing: ' + file }; }
      const cv = createCanvas(im.width, im.height), g = cv.getContext('2d'); g.drawImage(im, 0, 0);
      const px = g.getImageData(0, 0, im.width, im.height).data; before += im.width * im.height; img[layer] = cv;
      const list = [];
      for (let d = 0; d < rows; d++) for (let f = 0; f < n; f++) {
        const cx = f * lw, cy = d * lh; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
        for (let y = cy; y < cy + lh && y < im.height; y++) { const rowI = y * im.width; for (let x = cx; x < cx + lw && x < im.width; x++) if (px[(rowI + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
        if (x1 < 0) { list.push([0, 0, 0, 0, 0, 0]); continue; }
        x0 = Math.max(cx, x0 - 1); y0 = Math.max(cy, y0 - 1); x1 = Math.min(cx + lw - 1, x1 + 1); y1 = Math.min(cy + lh - 1, y1 + 1);
        list.push([x1 - x0 + 1, y1 - y0 + 1, x0 - cx + bx, y0 - cy + by, x0, y0]);   // w, h, the corner in the frame; where it lies in the old sheet
      }
      R[layer] = list;
    }
    const big = Object.values(R).some(L => L.some(r => r[0] > 255 || r[1] > 255 || r[2] > 255 || r[3] > 255));
    const O = out[clip] = { rects: {}, sheets: {}, big };
    for (const [layer, list] of Object.entries(R)) {
      let x = 0, y = 0, sh = 0, W = 1; const at = [];
      for (const r of list) { if (r[0] && x + r[0] > MAXW && x > 0) { x = 0; y += sh; sh = 0; } at.push([x, y]); if (r[0]) { x += r[0]; if (r[1] > sh) sh = r[1]; if (x > W) W = x; } }
      const H = Math.max(1, y + sh); after += W * H;
      if (!dry) { const sheet = createCanvas(W, H), sc = sheet.getContext('2d'); list.forEach((r, i) => { if (r[0]) sc.drawImage(img[layer], r[4], r[5], r[0], r[1], at[i][0], at[i][1], r[0], r[1]); }); O.sheets[layer] = sheet; }
      const bytes = big ? list.flatMap(r => [r[0] & 255, r[0] >> 8, r[1] & 255, r[1] >> 8, r[2] & 255, r[2] >> 8, r[3] & 255, r[3] >> 8]) : list.flatMap(r => [r[0], r[1], r[2], r[3]]);
      O.rects[layer] = Buffer.from(Uint8Array.from(bytes)).toString('base64');
    }
  }
  if (!dry) {
    for (const [clip, O] of Object.entries(out)) { const A = M.anims[clip]; for (const [layer, sheet] of Object.entries(O.sheets)) fs.writeFileSync(path.join(dir, A.sheets[layer]), sheet.toBuffer('image/png')); A.rects = O.rects; if (O.big) A.rectBytes = 2; delete A.boxes; }
    M.shelf = MAXW; M.framepacked = '2026-10-21';
    fs.writeFileSync(jp, JSON.stringify(M));
  }
  return { name, before: before * 4 / 1048576, after: after * 4 / 1048576 };
}
(async () => {
  let b = 0, a = 0;
  for (const s of sets) { const r = await packSet(s); if (r.skipped) { console.log(s.padEnd(15), r.skipped); continue; } b += r.before; a += r.after; console.log(s.padEnd(15), r.before.toFixed(1).padStart(7), 'MB decoded ->', r.after.toFixed(1).padStart(6), 'MB', dry ? '(measured)' : '(packed)'); }
  if (sets.length > 1) console.log('all'.padEnd(15), b.toFixed(1).padStart(7), 'MB decoded ->', a.toFixed(1).padStart(6), 'MB');
})();
