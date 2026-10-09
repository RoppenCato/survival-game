// The fit with the world (2026-10-09, Robin: the starter island by day is the reference): the cel hero with the painted face and
// the game's own palette on the starter island, drawn as the game draws it (tools/visual/dayisland.js). Writes herofit.png: at game
// scale, the game's drawn hero (Eirik, lib.playerD at 3 px a unit) beside the first cel render and the fitted hero; then the three
// eye styles and the four expressions at 2x; then 4x zooms of the fitted hero and the drawn hero. Reads art/render/day_<eyes>_<expr>/
// and assets/sprites/hero2-cel.   node tools/visual/herofit.js
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js'), World = require('../../src/world.js'), DI = require('./dayisland.js');
const lib = G.lib, kit = S.kit; kit.setup(kit.STYLE);
const W = 1500, H = 1300, Z = 3;
(async () => {
  const w = DI.make(kit, World, 11);
  const r = DI.paint(kit, World, W, H, Z, { world: w, at: { x: w.home.x - 330, y: w.home.y - 190 } });
  const cv = r.cv, c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const label = (t, x, y, big) => { c.fillStyle = 'rgba(20,16,12,0.62)'; c.font = (big ? 'bold 14px' : '11px') + ' sans-serif'; const tw = c.measureText(t).width; c.fillRect(x - 4, y - (big ? 15 : 12), tw + 8, big ? 20 : 16); c.fillStyle = '#f0e6cc'; c.fillText(t, x, y); };
  async function putRender(dir, anim, d, f, x, y, s) {
    if (!fs.existsSync(path.join(dir, 'meta.json'))) { label('no render ' + path.basename(dir), x - 30, y); return; }
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')), FS = meta.size * meta.px, im = await loadImage(path.join(dir, `${anim}_body_${d}_${String(f).padStart(2, '0')}.png`));
    DI.contactShadow(c, x, y + 1, 30 * s * 2, 12 * s * 2); c.drawImage(im, x - meta.anchor.x * s, y - meta.anchor.y * s, FS * s, FS * s);
  }
  async function putSheet(name, anim, d, f, x, y, s) {
    const dir = path.join('assets', 'sprites', name), J = JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8')), im = await loadImage(path.join(dir, J.anims[anim].sheets.body));
    const fw = J.frame.w, fh = J.frame.h, row = J.dirs.indexOf(d); DI.contactShadow(c, x, y + 1, 30 * s, 12 * s); c.drawImage(im, f * fw, row * fh, fw, fh, x - J.anchor.x * s, y - J.anchor.y * s, fw * s, fh * s);
  }
  function drawn(dir, x, y, s, walking) {
    lib.setHero(lib.heroSpec('Eirik')); DI.contactShadow(c, x, y + 1, 30 * s, 12 * s);
    c.save(); c.translate(x, y); c.scale(3 * s, 3 * s); lib.playerD(c, 0, 0, dir, { phase: walking ? 1.2 : 0, amt: walking ? 1 : 0, t: 1, lx: 0, ly: 0, blink: 0, sq: 0 }, null); c.restore();
  }
  const day = e => path.join('art', 'render', 'day_' + e);
  label('At game scale: the game’s drawn hero, the first cel render, and the fitted hero (the painted face, the game’s palette, daylight)', 16, 28, true);
  drawn('down', 90, 190, 1); label('drawn (the game)', 40, 212);
  await putSheet('hero2-cel', 'idle', 's', 0, 230, 190, 1); label('first cel', 200, 212);
  await putRender(day('dot_neutral'), 'idle', 's', 0, 370, 190, 0.5); label('fitted', 350, 212);
  drawn('right', 520, 190, 1, true); await putRender(day('dot_neutral'), 'walk', 'e', 2, 630, 190, 0.5); label('mid-step, drawn and fitted', 500, 212);
  drawn('left', 800, 190, 1); await putRender(day('dot_neutral'), 'idle', 'w', 0, 900, 190, 0.5); drawn('up', 1010, 190, 1); await putRender(day('dot_neutral'), 'idle', 'n', 0, 1110, 190, 0.5); label('side and back, drawn and fitted', 790, 212);
  label('The painted face at 2x: three eye styles, then the four expressions', 16, 270, true);
  const eyes = ['dot', 'oval', 'highlight'], exprs = ['neutral', 'blink', 'angry', 'hurt'];
  for (let i = 0; i < 3; i++) { await putRender(day(eyes[i] + '_neutral'), 'idle', 's', 0, 110 + i * 170, 560, 1.0); label(eyes[i], 70 + i * 170, 585); }
  for (let i = 0; i < 4; i++) { await putRender(day('dot_' + exprs[i]), 'idle', 's', 0, 680 + i * 170, 560, 1.0); label(exprs[i], 640 + i * 170, 585); }
  label('4x: the fitted hero and the drawn hero', 16, 640, true);
  await putRender(day('dot_neutral'), 'idle', 's', 0, 330, 1270, 2.0); label('fitted, 4x', 280, 1290);
  drawn('down', 900, 1270, 4); label('drawn, 4x', 850, 1290);
  c.globalAlpha = 0.12; c.fillStyle = kit.grain(c); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
  fs.writeFileSync('herofit.png', cv.toBuffer('image/png')); console.log('wrote herofit.png');
})();
