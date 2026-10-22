// Renders boats.png: the ship line of the rework (docs/ships-rework.md, 2026-10-22): the rowboat, the karve for 4, 8 and 12 and the
// longship for 16, 20 and 26, fully fitted, afloat at four headings; then four looks under sail with rowers (the sail's colours and
// patterns, the shields' paint, the hull's tar and trim, the four heads on the stem). node tools/visual/boats.js
const { createCanvas, loadImage } = require('@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const Yard = require('../../src/yard.js');
async function surfaces() { const d = 'assets/ship/', SF = { plank: await loadImage(d + 'plank_strip.png'), plankLit: await loadImage(d + 'plank_strip_lit.png'), rail: await loadImage(d + 'rail_strip.png'), shields: [] }; for (let i = 1; i <= 8; i++) SF.shields.push(await loadImage(d + 'shield_0' + i + '.png')); Yard.setSurfaces(SF);
  for (const kind of fs.existsSync('assets/ships') ? fs.readdirSync('assets/ships') : []) { const jp = 'assets/ships/' + kind + '/' + kind + '.json'; if (!fs.existsSync(jp)) continue; const J = JSON.parse(fs.readFileSync(jp, 'utf8')), I = {}; for (const L in J.layers) I[L] = await loadImage('assets/ships/' + kind + '/' + J.layers[L]); Yard.setModel(kind, J, I); } }   // and the ship models (Colin, AD's, assets/ships)   // the studio's surfaces (2026-10-21)
surfaces().then(() => {
  const Z = 2, W = 2000, H = 2500, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d');
  c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#3a6f8e'; c.fillRect(0, 0, W, H);
  function vessel(kind, x, y, h, look, extra) { const v = Object.assign({ kind, parts: Yard.designParts(kind, look || {}), x, y: y / 0.75, h, vx: 0, vy: 0, aboard: false, look: look || Yard.lookDefault() }, extra || {}); Yard.fit(v); Yard.drawVessel(c, v, 1.2); return v; }
  c.font = '600 13px sans-serif'; c.fillStyle = '#f6e2b8';
  const rows = ['rowboat', 'karve4', 'karve8', 'karve', 'longship16', 'longship20', 'longship'], dragon = Object.assign(Yard.lookDefault(), { head: 'dragon' });
  rows.forEach((kind, r) => { const Hh = Yard.HULLS[kind]; c.fillText(Hh.name + ' ' + Hh.size + ' (' + Hh.m + ' m)', 12, 40 + r * 235); [0, 0.5, 1.2, 2.2].forEach((h, k) => vessel(kind, 300 + k * 430, 170 + r * 235, h, kind === 'rowboat' ? null : dragon)); });
  const looks = [
    { name: 'stripes, red and cream; dragon; tarred dark', look: Object.assign(Yard.lookDefault(), { head: 'dragon' }) },
    { name: 'checks, blue and cream; snake; pale oak, red trim', look: { sailA: '#e8dcc0', sailB: '#2f4f7a', pattern: 'checks', shield: '#2f4f7a', shield2: '#e8dcc0', tar: '#a07a4e', trim: '#b23a2e', head: 'snake' } },
    { name: 'border, ochre on red; bear; black, gold trim', look: { sailA: '#b23a2e', sailB: '#d8a440', pattern: 'border', shield: '#d8a440', shield2: '#1f1d22', tar: '#1c1a1c', trim: '#d8a440', head: 'bear' } },
    { name: 'plain green; a curl; red ochre', look: { sailA: '#3e6b3a', sailB: '#e8dcc0', pattern: 'plain', shield: '#3e6b3a', shield2: '#3e6b3a', tar: '#6a2a1e', trim: '#8a6a44', head: 'curl' } }
  ];
  looks.forEach((q, k) => { const x = 260 + (k % 2) * 900, y = 1980 + Math.floor(k / 2) * 330; c.fillStyle = '#f6e2b8'; c.fillText(q.name, x - 220, y - 150); [0.35, 2.6].forEach((h, j) => vessel(k < 2 ? 'karve' : 'longship20', x + j * 420, y, h, q.look, { vx: Math.cos(h) * 50, vy: Math.sin(h) * 50, crew: 12, sailFill: 0.9, sailSet: 1 })); });
  fs.writeFileSync('boats.png', cv.toBuffer('image/png')); console.log('wrote boats.png');
});
