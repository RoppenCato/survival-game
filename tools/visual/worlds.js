// Renders worlds.png: the chart of several fresh worlds (the game's six-island spec) with every village the plan gives, named and
// coloured by kind, so the spread of islands and villages can be judged. Run from the project root:  node tools/visual/worlds.js [seed seed ...]
const { createCanvas } = require('@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), Village = require('../../src/village.js');
const kit = S.kit; kit.setup(kit.STYLE);
const seeds = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [11, 23, 47, 91];
const EXTRA = process.env.WSPEC ? JSON.parse(process.env.WSPEC) : {}, OUT = process.env.WOUT || 'worlds.png';   // WSPEC='{"gap":40}' tries another sea; WOUT names the file
const T = 32, CW = 560, CH = 440, cv = createCanvas(CW * 2, CH * Math.ceil(seeds.length / 2)), c = cv.getContext('2d');
c.fillStyle = '#2a3a4a'; c.fillRect(0, 0, cv.width, cv.height);
const COL = { seat: '#ffd34d', village: '#f0e2b0', small: '#d8c8a0', farmstead: '#b8d8a0', fishing: '#9ad0e8', trading: '#e8a060', ruin: '#9a8a7a' };
seeds.forEach((seed, i) => {
  const spec = Object.assign({ isle: 160, isle0: 120, big: 400, sizes: [120, 400], biomes: [0, 0], noDock: true, count: 2, dir: 0.1, gap: 150, gapVar: 0.3, skerries: 1, rough: 1, beach: 4.5, hue: 0, waves: 0.75, foam: 1.05, seed, mountain: 1, mountainOpts: World.BIG_MOUNTAIN }, EXTRA);
  const w = World.make(kit, spec), ch = w.chart(CW - 20), sc = (CW - 20) / Math.max(w.GW, w.GH * 0.75 / 0.75), ox = (i % 2) * CW + 10, oy = Math.floor(i / 2) * CH + 10;
  c.drawImage(ch, ox, oy);
  const kx = ch.width / w.GW, ky = ch.height / w.GH;
  const R = kit.rng(seed * 23 + 11), home = w.isles[0];
  const sites = Village.plan({ isles: w.isles, code: w.siteCode, shallow: (tx, ty) => w.code(tx, ty) === 0 && w.elevAt((tx + 0.5) * T, (ty + 0.5) * T) > -7, R, home: [home.x, home.y], avoid: [] });
  sites.forEach((s) => {
    const x = ox + (s.tx + s.w / 2) * kx, y = oy + (s.ty + s.h / 2) * ky;
    c.fillStyle = COL[s.arch] || '#fff'; c.strokeStyle = '#1a1410'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); c.stroke();
    if (s.jetty) { const r = s.jetty.root; c.fillStyle = '#6a4a30'; c.fillRect(ox + r[0] * kx - 1.5, oy + r[1] * ky - 1.5, 3, 3); }
    c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = '#1a1410'; c.strokeText(s.name, x, y - 7); c.fillStyle = '#fff'; c.fillText(s.name, x, y - 7);
  });
  c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(ox, oy, 300, 16); c.fillStyle = '#f6e2b8'; c.font = 'bold 11px sans-serif'; c.textAlign = 'left';
  c.fillText('seed ' + seed + ': ' + w.isles.length + ' islands, ' + sites.length + ' villages (' + sites.filter(s => s.jetty).length + ' jetties), ' + w.GW + ' by ' + w.GH + ' tiles', ox + 4, oy + 12);
  if (w.mt) { const m = w.mt, n = [0, 0, 0, 0]; let land = 0, isle = 0; for (let j = 0; j < m.h; j++) for (let i2 = 0; i2 < m.w; i2++) { const x = (m.x0 + i2 + 0.5) * m.MC, y = (m.y0 + j + 0.5) * m.MC; if (w.elevAt(x, y) <= 0.05) continue; land++; const cc = m.CL[j * m.w + i2]; if (cc & w.M_BLOCK) n[3]++; else n[cc & 3]++; }
    const pc = v => (v / land * 100).toFixed(1) + '%', at = p => p ? Math.round(p.x / T) + ',' + Math.round(p.y / T) : 'NONE';
    console.log('seed', seed, 'the mountain: foothills', pc(n[1]), 'plateau', pc(n[2]), 'cliffs and peaks', pc(n[3]), '(of the big island’s box); ways up', m.ramps.length, '(to the plateau ' + m.ramps.filter(r => r.n === 2).length + '); cave', at(m.cave), 'shelter', at(m.shelters[0]), 'veins', m.veins.length, 'waterfall', m.falls.length, 'lookout', m.lookouts.length, 'peaks', w.peaks ? w.peaks() : '?');
    c.strokeStyle = '#ffd34d'; c.lineWidth = 1.5; m.ramps.forEach(r => { c.beginPath(); c.arc(ox + r.ex / T * kx, oy + r.ey / T * ky, 4, 0, 7); c.stroke(); }); if (m.cave) { c.fillStyle = '#ff5a3a'; c.beginPath(); c.arc(ox + m.cave.x / T * kx, oy + m.cave.y / T * ky, 3.5, 0, 7); c.fill(); } m.veins.forEach(v => { c.fillStyle = '#4fe0a0'; c.fillRect(ox + v.x / T * kx - 1.5, oy + v.y / T * ky - 1.5, 3, 3); }); }
  console.log('seed', seed, sites.map(s => s.name + ' (' + s.arch + (s.shore ? ', shore' : '') + (s.jetty ? ', jetty' : '') + ', isle ' + s.isle + ')').join('; '));
});
fs.writeFileSync(OUT, cv.toBuffer('image/png')); console.log('wrote ' + OUT);
