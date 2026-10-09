// The style test (2026-10-09, Robin): the second hero rendered in three styles (cel, painted, folk; art/build/toon.py) side by
// side in front of a Night Forest background at game scale (3 px a unit): each column a 2x idle facing south, the four
// idle directions at 1x, and the walk at 1x. Reads art/render/hero2_<style>/ (render.py's frames and meta.json).
// Writes herostyles.png.  node tools/visual/herostyles.js
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), kit = S.kit;
const STYLES = [['cel', 'A  Cel: two or three tones, a warm rim light, a line heavy on the shadow side'], ['painted', 'B  Painted: Bauer, soft shading, muted greens and browns, a wobbling line'], ['folk', 'C  Folk art: flat fills, a bold even line, knotwork and woven trim']];
const W = 1500, H = 620, COL = 500, Z = 3;
function hash(a, b, c) { const v = Math.sin(a * 12.9898 + b * 78.233 + (c || 0) * 37.719) * 43758.5453; return v - Math.floor(v); }
(async () => {
  const cv = createCanvas(W, H), c = cv.getContext('2d');
  // ---- the Night Forest: the kit's props in a deep teal-green key with blue-violet shadows, one amber fire ----
  kit.setup(Object.assign({}, kit.STYLE, { outsideHue: 152, shadowHue: 250, sat: 0.72, bright: -8 }));
  const M = kit.mats();
  c.fillStyle = '#2f4a3e'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { const x = hash(i, 1, 3) * W, y = hash(i, 2, 3) * H, r = 6 + hash(i, 3, 3) * 40; c.fillStyle = i % 3 ? 'rgba(40,78,60,0.35)' : 'rgba(70,110,80,0.25)'; c.beginPath(); c.ellipse(x, y, r, r * 0.45, 0, 0, 7); c.fill(); }
  const things = [];
  const back = ['pine', 'birch', 'pine', 'deadTree', 'pine', 'birch', 'pine', 'pine', 'birch', 'pine', 'deadTree', 'pine', 'birch', 'pine'];
  back.forEach((n, i) => things.push([n, 20 + i * 36 + hash(i, 5) * 14, 95 + hash(i, 6) * 40, 0.75 + hash(i, 7) * 0.35, i]));
  for (let i = 0; i < 9; i++) things.push([i % 3 === 0 ? 'rockFormation' : i % 3 === 1 ? 'bush' : 'rock', 10 + i * 56 + hash(i, 8) * 30, 150 + hash(i, 9) * 20, 0.8 + hash(i, 10) * 0.5, i + 20]);
  for (let i = 0; i < 14; i++) things.push([i % 2 ? 'fern' : i % 3 ? 'tallGrass' : 'mushrooms', hash(i, 11) * 500, 165 + hash(i, 12) * 40, 0.7 + hash(i, 13) * 0.4, i + 40]);
  things.push(['campfire', 250, 198, 0.9, 99]);
  c.save(); c.setTransform(Z, 0, 0, Z, 0, 0);
  things.sort((a, b) => a[2] - b[2]).forEach(t => { const sp = kit.bakeProp(t[0], t[4]); c.drawImage(sp.cv, t[1] + sp.l * t[3], t[2] + sp.t * t[3], sp.w * t[3], sp.h * t[3]); });
  c.restore();
  // the night: a deep blue-green multiply, the fire's amber glow cut into it, grain and a vignette
  const night = createCanvas(W, H), n = night.getContext('2d');
  n.fillStyle = 'rgb(96,132,138)'; n.fillRect(0, 0, W, H);
  const fx = 250 * Z, fy = 198 * Z, g = n.createRadialGradient(fx, fy - 20, 0, fx, fy - 20, 520); g.addColorStop(0, 'rgba(255,200,120,1)'); g.addColorStop(0.35, 'rgba(230,170,90,0.6)'); g.addColorStop(1, 'rgba(96,132,138,0)');
  n.fillStyle = g; n.beginPath(); n.arc(fx, fy - 20, 520, 0, 7); n.fill();
  c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(night, 0, 0); c.restore();
  c.globalAlpha = 0.14; c.fillStyle = kit.grain(c); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
  const vg = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.7); vg.addColorStop(0, 'rgba(10,16,20,0)'); vg.addColorStop(1, 'rgba(10,16,20,0.45)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
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
