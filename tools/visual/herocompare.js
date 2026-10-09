// Old hero against the new (2026-10-09): the drawn ink figure (lib.playerD at the game's 3 px a unit) beside the Blender sprite
// from assets/sprites/hero, standing and mid-walk, in the four cardinal directions, and the new one with its helmet and mail,
// plus a row of all eight directions. Writes herocompare.png.  node tools/visual/herocompare.js
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js');
const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
(async () => {
  const dir = path.join('assets', 'sprites', 'hero'), J = JSON.parse(fs.readFileSync(path.join(dir, 'hero.json'), 'utf8'));
  const sheets = {}; for (const a in J.anims) for (const l in J.anims[a].sheets) sheets[a + '_' + l] = await loadImage(path.join(dir, J.anims[a].sheets[l]));
  const Z = 2, PS = 3, CW = 100, RH = 190, W = CW * 8 + 40, H = RH * 3 + 30;
  const cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d'); c.setTransform(Z, 0, 0, Z, 0, 0);
  c.fillStyle = '#8fa266'; c.fillRect(0, 0, W, H); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const label = (t, x, y) => { c.fillStyle = '#231a16'; c.font = '9px sans-serif'; c.fillText(t, x, y); };
  function sprite(anim, layer, d, f, x, y, flip) {
    const im = sheets[anim + '_' + layer]; if (!im) return; const fw = J.frame.w, fh = J.frame.h, r = J.dirs.indexOf(d);
    c.save(); c.translate(x, y); if (flip) c.scale(-1, 1);
    c.drawImage(im, f * fw, r * fh, fw, fh, -J.anchor.x, -J.anchor.y, fw, fh); c.restore();
  }
  // row 1: the drawn hero (Eirik), standing and walking, four directions; the figure stands 47 units tall at 3 px a unit
  lib.setHero(lib.heroSpec('Eirik'));
  const old = ['down', 'right', 'up', 'left'], neu = ['s', 'e', 'n', 'w'];
  label('Old: the drawn ink figure (Eirik), standing and mid-step, at the game\'s 3 px a unit', 10, 14);
  old.forEach((d, i) => {
    const x = 20 + CW / 2 + i * CW, y = 20 + 150;
    c.save(); c.translate(x, y); c.scale(PS, PS); lib.playerD(c, 0, 0, d, { phase: 0, amt: 0, t: 1, lx: 0, ly: 0, blink: 0, sq: 0 }, null); c.restore();
    c.save(); c.translate(x + 4 * CW, y); c.scale(PS, PS); lib.playerD(c, 0, 0, d, { phase: 1.2, amt: 1, t: 1, lx: 0, ly: 0, blink: 0, sq: 0 }, null); c.restore();
  });
  // row 2: the new hero from Blender, idle and mid-walk
  label('New: the Blender figure, idle and mid-step, body only', 10, RH + 14);
  neu.forEach((d, i) => { const x = 20 + CW / 2 + i * CW, y = RH + 20 + 150; sprite('idle', 'body', d, 0, x, y); sprite('walk', 'body', d, 2, x + 4 * CW, y); });
  // row 3: with the helmet and the mail stacked, idle, then all eight directions of the walk
  label('New with the helmet and the mail stacked; then every direction of the walk', 10, 2 * RH + 14);
  neu.forEach((d, i) => { const x = 20 + CW / 2 + i * CW, y = 2 * RH + 20 + 150; ['body', 'mail', 'helm'].forEach(l => sprite('idle', l, d, 0, x, y)); });
  J.dirs.forEach((d, i) => { const x = 20 + 4 * CW + 25 + i * 48, y = 2 * RH + 20 + 150; sprite('walk', 'body', d, 3, x, y); });
  fs.writeFileSync('herocompare.png', cv.toBuffer('image/png')); console.log('wrote herocompare.png');
})();
