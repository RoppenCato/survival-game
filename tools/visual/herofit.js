// The fit with the world (2026-10-09, Robin): the cel hero with the painted face and the Night Forest palette. Writes herofit.png:
// above, the three eye styles (dot, oval, highlight) and the four expressions, each standing in the Night Forest at 2x and 1x;
// below, before (the hero2-cel sheet as it was) and after at game scale in the scene, with a 4x zoom of each. The heroes get the
// scene's contact shadow and the same grain over them. Reads art/render/fit_<eyes>_<expr>/ and assets/sprites/hero2-cel.
//   node tools/visual/herofit.js
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), kit = S.kit, NF = require('./nightforest.js');
const W = 1500, H = 1000;
(async () => {
  const cv = createCanvas(W, H), c = cv.getContext('2d');
  c.drawImage(NF.paint(kit, W, H, 3, { fire: [250, 320], noGrain: true }), 0, 0);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const label = (t, x, y, big) => { c.fillStyle = 'rgba(10,16,20,0.6)'; c.font = (big ? 'bold 14px' : '11px') + ' sans-serif'; const w = c.measureText(t).width; c.fillRect(x - 4, y - (big ? 15 : 12), w + 8, big ? 20 : 16); c.fillStyle = '#e8dcc0'; c.fillText(t, x, y); };
  async function renderFrame(dir, anim, d, f) { return loadImage(path.join(dir, `${anim}_body_${d}_${String(f).padStart(2, '0')}.png`)); }
  // a rendered frame (2x) placed with its feet at (x, y) at scale s (0.5 = game scale)
  async function putRender(dir, anim, d, f, x, y, s) {
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')), FS = meta.size * meta.px, im = await renderFrame(dir, anim, d, f);
    NF.contactShadow(c, x, y + 1, 30 * s * 2, 12 * s * 2);
    c.drawImage(im, x - meta.anchor.x * s, y - meta.anchor.y * s, FS * s, FS * s);
    return meta;
  }
  // a packed sheet's frame (1x) placed with its feet at (x, y) at scale s (1 = game scale)
  async function putSheet(name, anim, d, f, x, y, s) {
    const dir = path.join('assets', 'sprites', name), J = JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8')), im = await loadImage(path.join(dir, J.anims[anim].sheets.body));
    const fw = J.frame.w, fh = J.frame.h, r = J.dirs.indexOf(d);
    NF.contactShadow(c, x, y + 1, 30 * s, 12 * s);
    c.drawImage(im, f * fw, r * fh, fw, fh, x - J.anchor.x * s, y - J.anchor.y * s, fw * s, fh * s);
  }
  label('The painted face: three eye styles (idle, 2x then 1x), and the four expressions at 2x', 16, 28, true);
  const eyes = ['dot', 'oval', 'highlight'];
  for (let i = 0; i < eyes.length; i++) {
    const dir = path.join('art', 'render', 'fit_' + eyes[i] + '_neutral'); if (!fs.existsSync(dir)) { label('no render for ' + eyes[i], 30 + i * 230, 60); continue; }
    await putRender(dir, 'idle', 's', 0, 80 + i * 230, 330, 1.0); await putRender(dir, 'idle', 's', 0, 200 + i * 230, 330, 0.5);
    label(eyes[i], 30 + i * 230, 350);
  }
  const exprs = ['neutral', 'blink', 'angry', 'hurt'];
  for (let i = 0; i < exprs.length; i++) {
    const dir = path.join('art', 'render', 'fit_dot_' + exprs[i]); if (!fs.existsSync(dir)) continue;
    await putRender(dir, 'idle', 's', 0, 800 + i * 170, 330, 1.0); label(exprs[i], 760 + i * 170, 350);
  }
  // side and back views of the new face
  const fitDir = path.join('art', 'render', 'fit_dot_neutral');
  if (fs.existsSync(fitDir)) { await putRender(fitDir, 'idle', 'w', 0, 1300, 330, 1.0); await putRender(fitDir, 'idle', 'n', 0, 1430, 330, 1.0); label('side, back', 1260, 350); }
  // before and after at game scale, and 4x
  label('Before (the first cel render) and after (the painted face, the Night Forest palette, the cool ambient, the grain and the contact shadow), at game scale; then 4x', 16, 420, true);
  await putSheet('hero2-cel', 'idle', 's', 0, 120, 600, 1); label('before, 1x', 90, 620);
  if (fs.existsSync(fitDir)) { await putRender(fitDir, 'idle', 's', 0, 260, 600, 0.5); label('after, 1x', 230, 620); }
  await putSheet('hero2-cel', 'walk', 'e', 2, 400, 600, 1); if (fs.existsSync(fitDir)) await putRender(fitDir, 'walk', 'e', 2, 520, 600, 0.5); label('before and after, mid-step', 380, 620);
  await putSheet('hero2-cel', 'idle', 's', 0, 820, 960, 4); label('before, 4x', 760, 980);
  if (fs.existsSync(fitDir)) { await putRender(fitDir, 'idle', 's', 0, 1200, 960, 2.0); label('after, 4x', 1140, 980); }
  NF.grainOver(kit, c, 0, 0, W, H);
  fs.writeFileSync('herofit.png', cv.toBuffer('image/png')); console.log('wrote herofit.png');
})();
