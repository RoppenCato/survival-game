// Mixamo against the hand-made cycles (2026-10-09): eight frames of the old idle and walk (assets/sprites/hero2-fit, the
// hand-keyed clips) over eight frames of the Mixamo idle, walk and run (art/render/mx_cmp), facing east, at game scale and 2x,
// on the starter island; then the four directions of each Mixamo clip's first frame. Writes mixamocompare.png.
//   node tools/visual/mixamocompare.js
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), DI = require('./dayisland.js'), kit = S.kit; kit.setup(kit.STYLE);
const W = 1500, H = 1060, Z = 3;
(async () => {
  const w = DI.make(kit, World, 11), r = DI.paint(kit, World, W, H, Z, { world: w, at: { x: w.home.x - 330, y: w.home.y - 190 } });
  const cv = r.cv, c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const label = (t, x, y, big) => { c.fillStyle = 'rgba(20,16,12,0.62)'; c.font = (big ? 'bold 14px' : '11px') + ' sans-serif'; const tw = c.measureText(t).width; c.fillRect(x - 4, y - (big ? 15 : 12), tw + 8, big ? 20 : 16); c.fillStyle = '#f0e6cc'; c.fillText(t, x, y); };
  const dir = path.join('art', 'render', 'mx_cmp'), meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')), FS = meta.size * meta.px;
  async function putRender(anim, d, f, x, y, s) { const im = await loadImage(path.join(dir, `${anim}_body_${d}_${String(f).padStart(2, '0')}.png`)); DI.contactShadow(c, x, y + 1, 60 * s, 24 * s); c.drawImage(im, x - meta.anchor.x * s, y - meta.anchor.y * s, FS * s, FS * s); }
  const sheetDir = path.join('assets', 'sprites', 'hero2-fit'), J = JSON.parse(fs.readFileSync(path.join(sheetDir, 'hero2-fit.json'), 'utf8'));
  async function putSheet(anim, d, f, x, y, s) { const im = await loadImage(path.join(sheetDir, J.anims[anim].sheets.body)); const fw = J.frame.w, fh = J.frame.h, row = J.dirs.indexOf(d); DI.contactShadow(c, x, y + 1, 30 * s, 12 * s); c.drawImage(im, f * fw, row * fh, fw, fh, x - J.anchor.x * s, y - J.anchor.y * s, fw * s, fh * s); }
  label('Old, hand-keyed: idle (4 frames) and walk (6 frames), facing east, game scale', 16, 28, true);
  for (let f = 0; f < J.anims.idle.frames; f++) await putSheet('idle', 'e', f, 60 + f * 70, 190, 1);
  for (let f = 0; f < J.anims.walk.frames; f++) await putSheet('walk', 'e', f, 420 + f * 70, 190, 1);
  label('Mixamo: idle, walk and run (8 of each), facing east, game scale', 16, 240, true);
  for (let f = 0; f < 8; f++) await putRender('idle', 'e', f, 60 + f * 70, 400, 0.5);
  for (let f = 0; f < 8; f++) await putRender('walk', 'e', f, 660 + f * 70, 400, 0.5);
  for (let f = 0; f < 8; f++) await putRender('run', 'e', f, 60 + f * 70, 590, 0.5);
  label('idle', 30, 420); label('walk', 630, 420); label('run', 30, 610);
  label('Mixamo at 2x: walk, then the four directions of idle, walk and run', 16, 650, true);
  for (let f = 0; f < 8; f++) await putRender('walk', 'e', f, 110 + f * 150, 1000, 1.0);
  const dirs = ['s', 'w', 'n', 'e'];
  for (let i = 0; i < 4; i++) { await putRender('idle', dirs[i], 2, 760 + i * 60, 590, 0.5); await putRender('walk', dirs[i], 2, 1010 + i * 60, 590, 0.5); await putRender('run', dirs[i], 2, 1260 + i * 60, 590, 0.5); }
  label('idle s w n e', 740, 610); label('walk s w n e', 990, 610); label('run s w n e', 1240, 610);
  c.globalAlpha = 0.12; c.fillStyle = kit.grain(c); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
  fs.writeFileSync('mixamocompare.png', cv.toBuffer('image/png')); console.log('wrote mixamocompare.png');
})();
