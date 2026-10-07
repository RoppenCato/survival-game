// Renders the Art Direction page's scene twice to look.png: the flat look above, the ink look (StyleLab.kit.STYLE_INK) below.
// Run from the project root:  node tools/visual/look.js [grain] [shade] [outlineW]
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), S = require('../../src/stylelab.js');
const lib = G.lib, kit = S.kit, K = 0.75, Z = 3, W = 800, H = 300;
const ink = Object.assign({}, kit.STYLE, kit.STYLE_INK);
if (process.argv[2]) ink.texture = +process.argv[2]; if (process.argv[3]) ink.shade = +process.argv[3]; if (process.argv[4]) ink.outlineW = +process.argv[4];
const things = [
  ['longhouse', 150, 150, 0.9], ['woodenWell', 60, 235, 0.55], ['campfire', 230, 250, 0.7], ['woodpile', 270, 190, 0.43], ['dryingRack', 320, 262, 0.5],
  ['oak', 380, 125, 0.55], ['pine', 470, 110, 0.6], ['birch', 530, 150, 0.52], ['bush', 420, 225, 0.9], ['berryBush', 610, 265, 0.9], ['wildHerbs', 340, 230, 0.9],
  ['rock', 600, 215, 1], ['rockFormation', 690, 150, 0.9], ['runestone', 760, 230, 0.7], ['oak', 740, 95, 0.5], ['tallGrass', 500, 275, 0.9], ['flower', 455, 258, 0.9]
];
function hash(a, b, c) { const v = Math.sin(a * 12.9898 + b * 78.233 + (c || 0) * 37.719) * 43758.5453; return v - Math.floor(v); }
const boarH = lib.makeCreature(lib.animalSpec('boar')), trollH = lib.makeCreature(lib.animalSpec('troll'));
function scene(c, style, isInk, fig) {
  kit.setup(style); const M = kit.mats(), g = M.grassA, g2 = M.grassB;
  c.fillStyle = g.base; c.fillRect(0, 0, W, H);
  if (isInk) { c.fillStyle = 'rgba(150,130,60,0.16)'; c.fillRect(0, 0, W, H); }
  for (let i = 0; i < (isInk ? 520 : 70); i++) { const x = hash(i, 1, 7) * W, y = hash(i, 2, 7) * H, r = isInk ? 3 + hash(i, 3, 7) * 11 : 18 + hash(i, 3, 7) * 40; c.fillStyle = i % 3 === 0 ? g2.base : (i % 3 === 1 ? g.shade : g.hl); c.globalAlpha = isInk ? 0.13 : 0.3; c.beginPath(); c.ellipse(x, y, r, r * (isInk ? 0.4 : 0.5), (hash(i, 4, 7) - 0.5) * 0.6, 0, 7); c.fill(); }
  c.globalAlpha = 1; c.fillStyle = M.path.base; c.globalAlpha = 0.85; c.beginPath(); c.moveTo(0, 262); c.quadraticCurveTo(200, 230, 330, 268); c.quadraticCurveTo(480, 300, 560, 286); c.lineTo(560, 300); c.lineTo(0, 300); c.closePath(); c.fill(); c.globalAlpha = 1;
  if (isInk) { c.globalAlpha = 0.2 * style.texture; c.fillStyle = kit.grain(c); c.fillRect(0, 0, W, H); c.globalAlpha = 1; const sun = c.createLinearGradient(0, 0, W * 0.8, H); sun.addColorStop(0, 'rgba(255,236,190,0.18)'); sun.addColorStop(0.5, 'rgba(255,236,190,0)'); sun.addColorStop(1, `hsla(${style.shadowHue},45%,20%,0.16)`); c.fillStyle = sun; c.fillRect(0, 0, W, H); }
  const items = [];
  things.forEach(t => { kit.setup(style); const sp = kit.bakeProp(t[0], 3); items.push({ y: t[2], f: () => c.drawImage(sp.cv, t[1] + sp.l * t[3], t[2] * K + sp.t * t[3], sp.w * t[3], sp.h * t[3]) }); });
  function figure(x, y, draw, wide) {
    if (!isInk) { draw(c, x, y); return; }
    const fw = wide, fh = 160, cv = createCanvas(fw * Z, fh * Z), f = cv.getContext('2d'); f.setTransform(Z, 0, 0, Z, fw / 2 * Z, (fh - 12) * Z); draw(f, 0, 0);
    f.globalCompositeOperation = 'source-atop'; f.globalAlpha = fig.grain; f.fillStyle = kit.grain(f); f.fillRect(-fw / 2, -(fh - 12), fw, fh);
    const gs = f.createLinearGradient(-fw * 0.3, -fh * 0.9, fw * 0.3, 0); gs.addColorStop(0, `rgba(255,240,200,${fig.shade * 0.35})`); gs.addColorStop(0.45, 'rgba(0,0,0,0)'); gs.addColorStop(1, `hsla(${style.shadowHue},45%,18%,${fig.shade})`); f.globalAlpha = 1; f.fillStyle = gs; f.fillRect(-fw / 2, -(fh - 12), fw, fh);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(cv, (x - fw / 2) * Z, (y - (fh - 12)) * Z + c.__oy); c.restore();
  }
  function foot(x, y, rx) { c.fillStyle = isInk ? `hsla(${style.shadowHue},40%,12%,0.3)` : 'rgba(20,30,20,0.25)'; c.beginPath(); c.ellipse(x, y, rx, rx * 0.35, 0, 0, 7); c.fill(); }
  items.push({ y: 300, f: () => { foot(450, 226, 9); figure(450, 225, (cc, x, y) => lib.playerD(cc, x, y, 'down', { phase: 0, amt: 0, t: 1, lx: 0, ly: 0, blink: 0, sq: 0 }, null), 120); } });
  items.push({ y: 330, f: () => { foot(660, 248, 24); figure(660, 247, (cc, x, y) => lib.creatureD(cc, x, y, { t: 1.3, move: 0, phase: 0, dir: 1, ang: 1.57, state: 'idle', k: 0 }, trollH), 200); } });
  items.push({ y: 345, f: () => { foot(560, 259, 12); figure(560, 258, (cc, x, y) => lib.creatureD(cc, x, y, { t: 1.3, move: 0, phase: 0, dir: 1, ang: 0, state: 'idle', k: 0 }, boarH), 140); } });
  items.sort((a, b) => a.y - b.y).forEach(it => it.f());
  if (isInk && style.vignette > 0) { const vg = c.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, W * 0.75); vg.addColorStop(0, 'rgba(20,16,12,0)'); vg.addColorStop(1, `rgba(20,16,12,${style.vignette})`); c.fillStyle = vg; c.fillRect(0, 0, W, H); }
}
const cv = createCanvas(W * Z, H * Z * 2), c = cv.getContext('2d');
c.setTransform(Z, 0, 0, Z, 0, 0); c.__oy = 0; scene(c, kit.STYLE, false, { grain: 0, shade: 0 });
c.setTransform(Z, 0, 0, Z, 0, H * Z); c.__oy = H * Z; scene(c, ink, true, { grain: 0.22, shade: 0.41 });
fs.writeFileSync('look.png', cv.toBuffer('image/png'));
console.log('wrote look.png');
