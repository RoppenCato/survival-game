// Renders worlds.png: the chart of several fresh worlds (the game's six-island spec) with every village the plan gives, named and
// coloured by kind, so the spread of islands and villages can be judged. Run from the project root:  node tools/visual/worlds.js [seed seed ...]
const { createCanvas } = require('@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), Village = require('../../src/village.js');
const kit = S.kit; kit.setup(kit.STYLE);
const seeds = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [11, 23, 47, 91];
const T = 32, CW = 520, CH = 400, cv = createCanvas(CW * 2, CH * Math.ceil(seeds.length / 2)), c = cv.getContext('2d');
c.fillStyle = '#2a3a4a'; c.fillRect(0, 0, cv.width, cv.height);
const COL = { seat: '#ffd34d', village: '#f0e2b0', small: '#d8c8a0', farmstead: '#b8d8a0', fishing: '#9ad0e8', trading: '#e8a060', ruin: '#9a8a7a' };
seeds.forEach((seed, i) => {
  const spec = { isle: 160, isle0: 60, big: 230, sizes: [60, 230, 150, 110, 170, 90], noDock: true, count: 6, dir: 0.1, gap: 26, gapVar: 0.5, skerries: 1, rough: 1, beach: 4.5, hue: 0, waves: 0.75, foam: 1.05, seed };
  const w = World.make(kit, spec), ch = w.chart(CW - 20), sc = (CW - 20) / Math.max(w.GW, w.GH * 0.75 / 0.75), ox = (i % 2) * CW + 10, oy = Math.floor(i / 2) * CH + 10;
  c.drawImage(ch, ox, oy);
  const kx = ch.width / w.GW, ky = ch.height / w.GH;
  const R = kit.rng(seed * 23 + 11), home = w.isles[0];
  const sites = Village.plan({ isles: w.isles, code: w.code, shallow: (tx, ty) => w.code(tx, ty) === 0 && w.elevAt((tx + 0.5) * T, (ty + 0.5) * T) > -7, R, home: [home.x, home.y], avoid: [] });
  sites.forEach((s) => {
    const x = ox + (s.tx + s.w / 2) * kx, y = oy + (s.ty + s.h / 2) * ky;
    c.fillStyle = COL[s.arch] || '#fff'; c.strokeStyle = '#1a1410'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); c.stroke();
    if (s.jetty) { const r = s.jetty.root; c.fillStyle = '#6a4a30'; c.fillRect(ox + r[0] * kx - 1.5, oy + r[1] * ky - 1.5, 3, 3); }
    c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = '#1a1410'; c.strokeText(s.name, x, y - 7); c.fillStyle = '#fff'; c.fillText(s.name, x, y - 7);
  });
  c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(ox, oy, 300, 16); c.fillStyle = '#f6e2b8'; c.font = 'bold 11px sans-serif'; c.textAlign = 'left';
  c.fillText('seed ' + seed + ': ' + w.isles.length + ' islands, ' + sites.length + ' villages (' + sites.filter(s => s.jetty).length + ' jetties), ' + w.GW + ' by ' + w.GH + ' tiles', ox + 4, oy + 12);
  console.log('seed', seed, sites.map(s => s.name + ' (' + s.arch + (s.shore ? ', shore' : '') + (s.jetty ? ', jetty' : '') + ', isle ' + s.isle + ')').join('; '));
});
fs.writeFileSync('worlds.png', cv.toBuffer('image/png')); console.log('wrote worlds.png');
