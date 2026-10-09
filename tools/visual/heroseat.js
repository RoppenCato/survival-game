// Before and after the second fit (2026-10-09, Robin: does he look out of place?): the Mixamo hero on the starter island at game
// scale and at 2x, as he was (the sheet before, no cast shadow, scaled 0.85) beside as he is (the line at the props' weight, a hard
// shadow step and rim, the world's grain, the height baked in, and the cast shadow the props throw). Writes heroseat.png.
//   node tools/visual/heroseat.js <before sheet dir>     (a copy of assets/sprites/hero2-mixamo from before)
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), DI = require('./dayisland.js'); const kit = S.kit; kit.setup(kit.STYLE);
const W = 1200, H = 900, Z = 3, beforeDir = process.argv[2];
(async () => {
  const w = DI.make(kit, World, 11), r = DI.paint(kit, World, W, H, Z, { world: w, at: { x: w.home.x - 330, y: w.home.y - 190 } });
  const cv = r.cv, c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const label = (t, x, y) => { c.fillStyle = 'rgba(20,16,12,0.62)'; c.font = 'bold 14px sans-serif'; const tw = c.measureText(t).width; c.fillRect(x - 4, y - 15, tw + 8, 20); c.fillStyle = '#f0e6cc'; c.fillText(t, x, y); };
  const sil = {};
  async function put(dir, name, anim, d, f, x, y, s, cast) {
    const J = JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8')), file = J.anims[anim].sheets.body, im = await loadImage(path.join(dir, file));
    const fw = J.frame.w, fh = J.frame.h, row = J.dirs.indexOf(d), k = s * Z / 3;
    DI.contactShadow(c, x, y + 1, 30 * s, 12 * s);
    if (cast) {
      const key = dir + file; if (!sil[key]) { const cv2 = createCanvas(im.width, im.height), g = cv2.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'hsl(' + (kit.STYLE.shadowHue || 222) + ',40%,8%)'; g.fillRect(0, 0, im.width, im.height); sil[key] = cv2; }
      c.save(); c.translate(x, y); c.globalAlpha = 0.3; c.beginPath(); c.rect(-600, -1200, 1200, 1200); c.clip(); c.transform(1, 0, -0.5, -0.14, 0, 0);
      c.drawImage(sil[key], f * fw, row * fh, fw, fh, -J.anchor.x * k, -J.anchor.y * k, fw * k, fh * k); c.restore();
    }
    c.drawImage(im, f * fw, row * fh, fw, fh, x - J.anchor.x * k, y - J.anchor.y * k, fw * k, fh * k);
  }
  const after = path.join('assets', 'sprites', 'hero2-mixamo');
  label('Before (the first fit, scaled 0.85, no cast shadow) and after (the props’ line weight, hard shadow, grain, cast shadow), game scale', 16, 28);
  const dirs = ['s', 'sw', 'w', 'n', 'e'];
  for (let i = 0; i < dirs.length; i++) { await put(beforeDir, 'hero2-mixamo', 'idle', dirs[i], 0, 80 + i * 110, 230, 0.85, false); await put(after, 'hero2-mixamo', 'idle', dirs[i], 0, 660 + i * 110, 230, 1, true); }
  label('before', 70, 260); label('after', 650, 260);
  label('At 2x: before, after; the walk after', 16, 330);
  await put(beforeDir, 'hero2-mixamo', 'idle', 's', 0, 150, 620, 1.7, false); await put(after, 'hero2-mixamo', 'idle', 's', 0, 420, 620, 2, true);
  await put(after, 'hero2-mixamo', 'walk', 'sw', 3, 700, 620, 2, true); await put(after, 'hero2-mixamo', 'attack1', 'e', 5, 980, 620, 2, true);
  label('before', 110, 650); label('after', 380, 650); label('walk', 670, 650); label('slash', 950, 650);
  c.globalAlpha = 0.12; c.fillStyle = kit.grain(c); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
  fs.writeFileSync('heroseat.png', cv.toBuffer('image/png')); console.log('wrote heroseat.png');
})();
