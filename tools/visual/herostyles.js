// The style test (2026-10-09, Robin): the second hero rendered in three styles (cel, painted, folk; art/build/toon.py) side by
// side in front of a Night Forest background at game scale (3 px a unit): each column a 2x idle facing south, the four
// idle directions at 1x, and the walk at 1x. Reads art/render/hero2_<style>/ (render.py's frames and meta.json).
// Writes herostyles.png.  node tools/visual/herostyles.js
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), kit = S.kit, NF = require('./nightforest.js');
const STYLES = [['cel', 'A  Cel: two or three tones, a warm rim light, a line heavy on the shadow side'], ['painted', 'B  Painted: Bauer, soft shading, muted greens and browns, a wobbling line'], ['folk', 'C  Folk art: flat fills, a bold even line, knotwork and woven trim']];
const W = 1500, H = 620, COL = 500, Z = 3;
(async () => {
  const cv = createCanvas(W, H), c = cv.getContext('2d');
  // ---- the Night Forest (tools/visual/nightforest.js) ----
  c.drawImage(NF.paint(kit, W, H, Z, { fire: [250, 198] }), 0, 0);
  // ---- the three heroes ----
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  for (let si = 0; si < STYLES.length; si++) {
    const [style, label] = STYLES[si], dir = path.join('art', 'render', 'hero2_' + style);
    if (!fs.existsSync(path.join(dir, 'meta.json'))) { console.log('no frames for', style); continue; }
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')), ax = meta.anchor.x, ay = meta.anchor.y, FS = meta.size * meta.px;
    const frame = async (anim, d, f) => loadImage(path.join(dir, `${anim}_body_${d}_${String(f).padStart(2, '0')}.png`));
    const x0 = si * COL;
    const foot = (x, y, r) => { c.fillStyle = 'rgba(8,14,18,0.45)'; c.beginPath(); c.ellipse(x, y, r, r * 0.4, 0, 0, 7); c.fill(); };
    const put = async (anim, d, f, x, y, s) => { const im = await frame(anim, d, f); foot(x, y, 22 * s); c.drawImage(im, x - ax * s, y - ay * s, FS * s, FS * s); };
    c.fillStyle = 'rgba(10,16,20,0.55)'; c.fillRect(x0 + 8, 8, COL - 16, 26);
    c.fillStyle = '#e8dcc0'; c.font = 'bold 13px sans-serif'; c.fillText(label, x0 + 16, 26);
    await put('idle', 's', 0, x0 + 110, 372, 0.85);                                        // 1.7x (the render is at 2x)
    const grid = [['s', x0 + 290, 205], ['w', x0 + 390, 205], ['n', x0 + 290, 375], ['e', x0 + 390, 375]];
    for (const [d, x, y] of grid) await put('idle', d, 0, x, y, 0.5);
    const NW = meta.anims.walk.frames;
    for (let f = 0; f < NW; f++) await put('walk', 'e', f, x0 + 60 + f * 72, 560, 0.5);
    c.fillStyle = '#cfc4a8'; c.font = '11px sans-serif'; c.fillText('idle 1.7x', x0 + 70, 400); c.fillText('idle s w / n e at 1x', x0 + 260, 400); c.fillText('walk, 1x', x0 + 30, 585);
  }
  fs.writeFileSync('herostyles.png', cv.toBuffer('image/png')); console.log('wrote herostyles.png');
})();
