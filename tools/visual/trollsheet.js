// The Blender trolls on the starter island beside the hero, at game scale (2026-10-12): a row per troll: standing in four
// directions, a step of the walk, the arm drawn back, the blow, the eyes shielded, fallen. Writes trolls3d.png.
//   node tools/visual/trollsheet.js [troll_boulder troll_forest troll_maw troll_three]
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h); const SPRT = require('../../src/sprites.js');
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), DI = require('./dayisland.js'); const kit = S.kit; kit.setup(kit.STYLE);
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['troll_boulder', 'troll_forest', 'troll_maw', 'troll_three'];
const TITLE = { troll_boulder: 'Mountain troll (after Bauer)', troll_forest: 'Forest troll (after Kittelsen)', troll_maw: 'The Gape (new)', troll_three: 'Three-headed troll (new)' };
const W = 2500, ROW = 430, H = ROW * names.length + 20, Z = 3;
(async () => { await DI.load(World);   /* the studio's set pieces, as the game draws them (2026-10-21) */
  const w = DI.make(kit, World, 11), r = DI.paint(kit, World, W, H, Z, { world: w, at: { x: w.home.x - 520, y: w.home.y - 300 }, bare: true });
  const cv = r.cv, c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.fillStyle = 'rgba(126,160,96,0.55)'; c.fillRect(0, 0, W, H);                       // the island knocked back so the figures read
  const label = (t, x, y) => { c.fillStyle = 'rgba(20,16,12,0.62)'; c.font = 'bold 14px sans-serif'; const tw = c.measureText(t).width; c.fillRect(x - 4, y - 15, tw + 8, 20); c.fillStyle = '#f0e6cc'; c.fillText(t, x, y); };
  const sil = {};
  async function put(name, anim, d, fr, x, y) {
    const dir = path.join('assets', 'sprites', name), J = JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8')), A = J.anims[anim]; if (!A) return;
    const file = A.sheets.body, im = await loadImage(path.join(dir, file)), fw = (A.frame || J.frame).w, fh = (A.frame || J.frame).h, row = J.dirs.indexOf(d), k = (J.scale || 1) * Z / 3, f = Math.min(A.frames - 1, Math.floor(A.frames * fr));
    const q = SPRT.pieceOf({ meta: J, rc: {} }, A, anim, 'body', row, f); if (!q.w) return;   // (a packed set: the frame's own piece, tools/framepack.js)
    const key = dir + file; if (!sil[key]) { const c2 = createCanvas(im.width, im.height), g = c2.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'hsl(222,40%,8%)'; g.fillRect(0, 0, im.width, im.height); sil[key] = c2; }
    c.save(); c.translate(x, y); c.globalAlpha = 0.3; c.beginPath(); c.rect(-900, -1200, 1800, 1200); c.clip(); c.transform(1, 0, -0.5, -0.14, 0, 0); c.drawImage(sil[key], q.sx, q.sy, q.w, q.h, (q.ox - (A.anchor || J.anchor).x) * k, (q.oy - (A.anchor || J.anchor).y) * k, q.w * k, q.h * k); c.restore();
    c.drawImage(im, q.sx, q.sy, q.w, q.h, x + (q.ox - (A.anchor || J.anchor).x) * k, y + (q.oy - (A.anchor || J.anchor).y) * k, q.w * k, q.h * k);
  }
  const SHOW = [['idle', 's', 0], ['idle', 'sw', 0.3], ['idle', 'w', 0.6], ['idle', 'n', 0], ['walk', 'se', 0.3], ['windup', 's', 0.95], ['attack', 'sw', 0.42], ['shield', 's', 0.95], ['death', 'sw', 0.95]];
  for (let i = 0; i < names.length; i++) {
    const nm = names[i], y0 = i * ROW, yb = y0 + ROW - 60;
    label((TITLE[nm] || nm) + ': standing in four directions, a step, the arm drawn back, the blow, the eyes shielded, fallen; the hero for size', 14, y0 + 24);
    await put('hero2-mixamo', 'idle', 's', 0, 90, yb);
    for (let k = 0; k < SHOW.length; k++) await put(nm, SHOW[k][0], SHOW[k][1], SHOW[k][2], 330 + k * 262, yb);
  }
  c.globalAlpha = 0.12; c.fillStyle = kit.grain(c); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
  fs.writeFileSync('trolls3d.png', cv.toBuffer('image/png')); console.log('wrote trolls3d.png');
})();
