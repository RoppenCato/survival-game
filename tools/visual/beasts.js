// The Blender animals on the starter island beside the hero (2026-10-11): each packed animal (assets/sprites/<name>) at game scale in
// eight directions, then its clips at 2x, with the cast shadow the game lays. Writes beasts.png.   node tools/visual/beasts.js [boar deer wolf]
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h); const SPRT = require('../../src/sprites.js');
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), DI = require('./dayisland.js'); const kit = S.kit; kit.setup(kit.STYLE);
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['boar', 'deer', 'wolf'];
const W = 1700, ROW = 470, H = ROW * names.length + 20, Z = 3;
(async () => { await DI.load(World);   /* the studio's set pieces, as the game draws them (2026-10-21) */
  const w = DI.make(kit, World, 11), r = DI.paint(kit, World, W, H, Z, { world: w, at: { x: w.home.x - 420, y: w.home.y - 260 } });
  const cv = r.cv, c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const label = (t, x, y) => { c.fillStyle = 'rgba(20,16,12,0.62)'; c.font = 'bold 13px sans-serif'; const tw = c.measureText(t).width; c.fillRect(x - 4, y - 14, tw + 8, 19); c.fillStyle = '#f0e6cc'; c.fillText(t, x, y); };
  const sil = {};
  async function put(name, anim, d, f, x, y, s) {
    if (!fs.existsSync(path.join('assets', 'sprites', name))) return;   // (a set no longer there, as the old hero since 2026-10-26)
    const dir = path.join('assets', 'sprites', name), J = JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8')), A = J.anims[anim]; if (!A) return;
    const file = A.sheets.body, im = await loadImage(path.join(dir, file)), fw = (A.frame || J.frame).w, fh = (A.frame || J.frame).h, row = J.dirs.indexOf(d), k = s * Z / 3; f = Math.min(A.frames - 1, f);
    const q = SPRT.pieceOf({ meta: J, rc: {} }, A, anim, 'body', row, f); if (!q.w) return;   // (a packed set: the frame's own piece, tools/framepack.js)
    const key = dir + file; if (!sil[key]) { const c2 = createCanvas(im.width, im.height), g = c2.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'hsl(' + (kit.STYLE.shadowHue || 222) + ',40%,8%)'; g.fillRect(0, 0, im.width, im.height); sil[key] = c2; }
    c.save(); c.translate(x, y); c.globalAlpha = 0.3; c.beginPath(); c.rect(-900, -1200, 1800, 1200); c.clip(); c.transform(1, 0, -0.5, -0.14, 0, 0); c.drawImage(sil[key], q.sx, q.sy, q.w, q.h, (q.ox - (A.anchor || J.anchor).x) * k, (q.oy - (A.anchor || J.anchor).y) * k, q.w * k, q.h * k); c.restore();
    c.drawImage(im, q.sx, q.sy, q.w, q.h, x + (q.ox - (A.anchor || J.anchor).x) * k, y + (q.oy - (A.anchor || J.anchor).y) * k, q.w * k, q.h * k);
  }
  const DIRS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'];
  for (let i = 0; i < names.length; i++) {
    const nm = names[i], y0 = i * ROW, J = JSON.parse(fs.readFileSync(path.join('assets', 'sprites', nm, nm + '.json'), 'utf8'));
    label(nm + ': eight directions at game scale, the hero for size', 14, y0 + 22);
    await put('hero2-mixamo', 'idle', 's', 0, 70, y0 + 150, 1);
    for (let d = 0; d < 8; d++) await put(nm, 'walk', DIRS[d], 2, 190 + d * 150, y0 + 150, 1);
    const clips = Object.keys(J.anims); label('2x: ' + clips.join(', '), 14, y0 + 200);
    for (let k = 0; k < clips.length; k++) { const A = J.anims[clips[k]]; await put(nm, clips[k], k % 2 ? 'sw' : 'w', Math.floor(A.frames * (clips[k] === 'death' ? 0.95 : 0.4)), 150 + k * 230, y0 + 410, 2); }
  }
  c.globalAlpha = 0.12; c.fillStyle = kit.grain(c); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
  fs.writeFileSync('beasts.png', cv.toBuffer('image/png')); console.log('wrote beasts.png');
})();
