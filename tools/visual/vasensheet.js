// The four people-shaped vasen on the starter island beside the hero, at game scale and at 2x (2026-10-12): the draugr, the huldra,
// Nacken and the bysen. Writes vasen.png.   node tools/visual/vasensheet.js
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), DI = require('./dayisland.js'); const kit = S.kit; kit.setup(kit.STYLE);
const ROWS = [
  ['draugr', 'The draugr: a drowned raider', [['idle', 's', 0], ['idle', 'sw', 0.3], ['walk', 'w', 0.3], ['idle', 'n', 0], ['windup', 's', 0.95], ['attack', 'sw', 0.45], ['shield', 's', 0.95], ['death', 'sw', 0.95]]],
  ['huldra', 'The huldra: red dress, fair hair, and her back', [['idle', 's', 0], ['idle', 'sw', 0.3], ['walk', 'w', 0.3], ['idle', 'n', 0], ['idle', 'ne', 0], ['call', 's', 0.5], ['call', 'se', 0.5], ['death', 'sw', 0.95]]],
  ['nacken', 'Nacken: a river-pale man with a lyre', [['idle', 's', 0], ['idle', 'sw', 0.3], ['walk', 'w', 0.3], ['idle', 'n', 0], ['play', 's', 0.2], ['play', 'sw', 0.6], ['play', 'e', 0.4], ['death', 'sw', 0.95]]],
  ['bysen', 'The bysen: chopping, and the stump he turns into', [['idle', 's', 0], ['walk', 'sw', 0.3], ['chop', 'w', 0.3], ['chop', 'w', 0.75], ['hide', 's', 0.4], ['hide', 's', 0.7], ['stump', 's', 0], ['stump', 'w', 0]]]];
const W = 2300, ROW = 420, H = ROW * ROWS.length + 20, Z = 3;
(async () => {
  const w = DI.make(kit, World, 11), r = DI.paint(kit, World, W, H, Z, { world: w, at: { x: w.home.x - 520, y: w.home.y - 300 } });
  const cv = r.cv, c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.fillStyle = 'rgba(126,160,96,0.6)'; c.fillRect(0, 0, W, H);
  const label = (t, x, y) => { c.fillStyle = 'rgba(20,16,12,0.62)'; c.font = 'bold 14px sans-serif'; const tw = c.measureText(t).width; c.fillRect(x - 4, y - 15, tw + 8, 20); c.fillStyle = '#f0e6cc'; c.fillText(t, x, y); };
  const sil = {};
  async function put(name, anim, d, fr, x, y, s) {
    const dir = path.join('assets', 'sprites', name), J = JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8')), A = J.anims[anim]; if (!A) return;
    const file = A.sheets.body, im = await loadImage(path.join(dir, file)), fw = (A.frame || J.frame).w, fh = (A.frame || J.frame).h, row = J.dirs.indexOf(d), k = s * (J.scale || 1) * Z / 3, f = Math.min(A.frames - 1, Math.floor(A.frames * fr));
    const key = dir + file; if (!sil[key]) { const c2 = createCanvas(im.width, im.height), g = c2.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'hsl(222,40%,8%)'; g.fillRect(0, 0, im.width, im.height); sil[key] = c2; }
    c.save(); c.translate(x, y); c.globalAlpha = 0.3; c.beginPath(); c.rect(-900, -1200, 1800, 1200); c.clip(); c.transform(1, 0, -0.5, -0.14, 0, 0); c.drawImage(sil[key], f * fw, row * fh, fw, fh, -(A.anchor || J.anchor).x * k, -(A.anchor || J.anchor).y * k, fw * k, fh * k); c.restore();
    c.drawImage(im, f * fw, row * fh, fw, fh, x - (A.anchor || J.anchor).x * k, y - (A.anchor || J.anchor).y * k, fw * k, fh * k);
  }
  for (let i = 0; i < ROWS.length; i++) {
    const [nm, title, show] = ROWS[i], y0 = i * ROW, yb = y0 + ROW - 50;
    label(title + '  (left: the hero and the creature at game scale; then at 2x)', 14, y0 + 24);
    await put('hero2-mixamo', 'idle', 's', 0, 70, yb, 1); await put(nm, show[0][0], 's', 0, 190, yb, 1);
    for (let k = 0; k < show.length; k++) await put(nm, show[k][0], show[k][1], show[k][2], 420 + k * 240, yb, 2);
  }
  c.globalAlpha = 0.12; c.fillStyle = kit.grain(c); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
  fs.writeFileSync('vasen.png', cv.toBuffer('image/png')); console.log('wrote vasen.png');
})();
