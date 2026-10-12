// The people's layers put together from the raw renders, large, to judge the shapes before packing (2026-10-12):
//   node tools/visual/peoplelooks.js <out prefix> [clip] [frame]
// A row a look (which layers, in what colours), a column a direction; written as <prefix>1.png, <prefix>2.png ... of four rows each.
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
const DIR = process.env.PEOPLE_DIR || path.join('art', 'render', 'people');
const HAIR = '#b4602d', FAIR = '#e8c070', DARK = '#3a2a22', GREY = '#c8c2b8';
const LOOKS = [
  ['hair A', [['legs', '#4a4038'], ['tunic', '#6b7d8a'], ['hairA', HAIR]]],
  ['hair B', [['legs', '#5a4a3a'], ['tunic', '#7d4a3a'], ['hairB', FAIR]]],
  ['hair C', [['legs', '#3f4a5a'], ['tunic', '#5b6b4a'], ['hairC', DARK]]],
  ['bald, beard A', [['legs', '#4a4038'], ['tunic', '#8a7a5c'], ['beardA', HAIR]]],
  ['hair A, beard B', [['legs', '#4a4038'], ['tunic', '#4f5f7a'], ['beardB', GREY], ['hairA', GREY]]],
  ['hair B, beard A', [['legs', '#6a5a48'], ['tunic', '#9a7a5a'], ['beardA', DARK], ['hairB', DARK]]],
  ['hood', [['legs', '#4a4038'], ['tunic', '#b9ad94'], ['hood', '#3a3550']]],
  ['cap, hair B', [['legs', '#4a4038'], ['tunic', '#6b7d8a'], ['hairB', FAIR], ['cap', null]]],
  ['helm, mail, beard A', [['legs', '#4a4038'], ['tunic', '#8a9099'], ['mail', null], ['beardA', HAIR], ['hairA', HAIR], ['helm', null]]],
  ['cloak, hair C', [['legs', '#3a3a44'], ['tunic', '#3f5a7a'], ['cloak', '#6b2f3a'], ['hairC', DARK]]],
  ['dress, hair B', [['legs', '#5a4a3a'], ['tunic', '#d9c9a6'], ['dress', '#8a4a4a'], ['hairB', '#c8743a']]],
  ['shield, sword, helm', [['legs', '#4a4038'], ['tunic', '#7d4a3a'], ['beardB', DARK], ['hairA', DARK], ['helm', null], ['shieldRim', null], ['shieldFace', '#8a3a34'], ['swordWood', null], ['swordMetal', null]]]
];
(async () => {
  const [prefix, clipA, frameA] = process.argv.slice(2);
  const meta = JSON.parse(fs.readFileSync(path.join(DIR, 'meta.json'), 'utf8')), FS = meta.size * meta.px, dirs = meta.dirs, clip = clipA || 'idle', f = String(+frameA || 0).padStart(2, '0');
  const cw = 150, ch = 270, cx = meta.anchor.x - cw / 2, cy = meta.anchor.y - ch + 18, PER = 4;
  const img = async (l, d) => { const p = path.join(DIR, `${clip}_${l}_${d}_${f}.png`); return fs.existsSync(p) ? loadImage(p) : null; };
  const tint = (im, col) => { const t = createCanvas(FS, FS), g = t.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, FS, FS); g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0); return t; };
  for (let page = 0; page * PER < LOOKS.length; page++) {
    const rows = LOOKS.slice(page * PER, page * PER + PER), cv = createCanvas(dirs.length * cw + 4, rows.length * ch), c = cv.getContext('2d'); c.fillStyle = '#8fa870'; c.fillRect(0, 0, cv.width, cv.height);
    for (let r = 0; r < rows.length; r++) for (let d = 0; d < dirs.length; d++) {
      const x = d * cw, y = r * ch, b = await img('body', dirs[d]); if (b) c.drawImage(b, cx, cy, cw, ch, x, y, cw, ch);
      for (const [l, col] of rows[r][1]) { const im = await img(l, dirs[d]); if (im) c.drawImage(col ? tint(im, col) : im, cx, cy, cw, ch, x, y, cw, ch); }
      if (d === 0) { c.fillStyle = '#1b1612'; c.font = 'bold 13px sans-serif'; c.fillText(rows[r][0], 4, y + 14); } c.fillStyle = '#1b1612'; c.font = '11px sans-serif'; c.fillText(dirs[d], x + cw - 22, y + 14);
    }
    fs.writeFileSync(prefix + (page + 1) + '.png', cv.toBuffer('image/png')); console.log(prefix + (page + 1) + '.png', cv.width + 'x' + cv.height);
  }
})();
