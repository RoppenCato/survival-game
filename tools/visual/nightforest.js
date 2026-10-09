// The Night Forest reference scene (2026-10-09): the kit's props in the Night Forest key (hue 152, blue-violet shadows), pines,
// birches, dead trees, mossy hummocks, ferns and one campfire, under a deep blue-green multiply with the fire's amber cut into it,
// the kit's grain at 0.14 and a vignette. Shared by herostyles.js, herofit.js and the Blender Editor's night scene (which has its
// own copy in the page). paint(kit, W, H, Z) returns a canvas of W by H pixels painted at Z px a unit; sample(cv) returns the
// scene's mean colours (for the palette notes).
const { createCanvas } = require('../../node_modules/@napi-rs/canvas');
function hash(a, b, c) { const v = Math.sin(a * 12.9898 + b * 78.233 + (c || 0) * 37.719) * 43758.5453; return v - Math.floor(v); }
const KEY = { outsideHue: 152, shadowHue: 250, sat: 0.72, bright: -8 }, NIGHT = 'rgb(96,132,138)', GRAIN = 0.14;
function paint(kit, W, H, Z, opts) {
  opts = opts || {}; const cv = createCanvas(W, H), c = cv.getContext('2d'), uw = W / Z, uh = H / Z;
  kit.setup(Object.assign({}, kit.STYLE, KEY));
  c.fillStyle = '#2f4a3e'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < uw * uh / 280; i++) { const x = hash(i, 1, 3) * W, y = hash(i, 2, 3) * H, r = 6 + hash(i, 3, 3) * 40; c.fillStyle = i % 3 ? 'rgba(40,78,60,0.35)' : 'rgba(70,110,80,0.25)'; c.beginPath(); c.ellipse(x, y, r, r * 0.45, 0, 0, 7); c.fill(); }
  const things = [], back = ['pine', 'birch', 'pine', 'deadTree', 'pine', 'birch', 'pine', 'pine', 'birch', 'pine', 'deadTree', 'pine', 'birch', 'pine', 'pine', 'birch'];
  const nb = Math.max(4, Math.round(uw / 36));
  for (let i = 0; i < nb; i++) things.push([back[i % back.length], 20 + i * 36 + hash(i, 5) * 14, uh * 0.47 + hash(i, 6) * uh * 0.2, 0.75 + hash(i, 7) * 0.35, i]);
  for (let i = 0; i < Math.round(uw / 56); i++) things.push([i % 3 === 0 ? 'rockFormation' : i % 3 === 1 ? 'bush' : 'rock', 10 + i * 56 + hash(i, 8) * 30, uh * 0.74 + hash(i, 9) * 20, 0.8 + hash(i, 10) * 0.5, i + 20]);
  for (let i = 0; i < Math.round(uw / 36); i++) things.push([i % 2 ? 'fern' : i % 3 ? 'tallGrass' : 'mushrooms', hash(i, 11) * uw, uh * 0.8 + hash(i, 12) * uh * 0.2, 0.7 + hash(i, 13) * 0.4, i + 40]);
  const fire = opts.fire || [uw / 2, uh * 0.97]; things.push(['campfire', fire[0], fire[1], 0.9, 99]);
  c.save(); c.setTransform(Z, 0, 0, Z, 0, 0);
  things.sort((a, b) => a[2] - b[2]).forEach(t => { const sp = kit.bakeProp(t[0], t[4]); c.drawImage(sp.cv, t[1] + sp.l * t[3], t[2] + sp.t * t[3], sp.w * t[3], sp.h * t[3]); });
  c.restore();
  const night = createCanvas(W, H), n = night.getContext('2d');
  n.fillStyle = NIGHT; n.fillRect(0, 0, W, H);
  const fx = fire[0] * Z, fy = (fire[1] - 7) * Z, R = 520 * Z / 3, g = n.createRadialGradient(fx, fy, 0, fx, fy, R); g.addColorStop(0, 'rgba(255,200,120,1)'); g.addColorStop(0.35, 'rgba(230,170,90,0.6)'); g.addColorStop(1, 'rgba(96,132,138,0)');
  n.fillStyle = g; n.beginPath(); n.arc(fx, fy, R, 0, 7); n.fill();
  c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(night, 0, 0); c.restore();
  if (!opts.noGrain) { c.globalAlpha = GRAIN; c.fillStyle = kit.grain(c); c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  if (!opts.noVignette) { const vg = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.7); vg.addColorStop(0, 'rgba(10,16,20,0)'); vg.addColorStop(1, 'rgba(10,16,20,0.45)'); c.fillStyle = vg; c.fillRect(0, 0, W, H); }
  kit.setup(kit.STYLE);
  return cv;
}
// the finishing grain: the same pattern at the same strength, for drawing over things laid on the scene
function grainOver(kit, c, x, y, w, h) { c.save(); c.globalAlpha = GRAIN; c.fillStyle = kit.grain(c); c.fillRect(x, y, w, h); c.restore(); }
// a soft contact shadow, as the kit's props sit on the ground: a cool dark ellipse fading out
function contactShadow(c, x, y, rx, ry) { const g = c.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, 'rgba(8,14,18,0.55)'); g.addColorStop(0.6, 'rgba(8,14,18,0.3)'); g.addColorStop(1, 'rgba(8,14,18,0)'); c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y); c.fillStyle = g; c.beginPath(); c.arc(x, y, rx, 0, 7); c.fill(); c.restore(); }
function sample(cv) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, d = c.getImageData(0, 0, W, H).data, acc = {};
  const zones = { canopy: [0, 0, 1, 0.3], trunks: [0, 0.3, 1, 0.55], ground: [0, 0.75, 1, 1], all: [0, 0, 1, 1] };
  for (const z in zones) { const [x0, y0, x1, y1] = zones[z]; let r = 0, g = 0, b = 0, n = 0; for (let y = Math.floor(y0 * H); y < y1 * H; y += 3) for (let x = Math.floor(x0 * W); x < x1 * W; x += 3) { const i = (y * W + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } acc[z] = '#' + [r / n, g / n, b / n].map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); }
  return acc;
}
module.exports = { paint, grainOver, contactShadow, sample, KEY, GRAIN };
