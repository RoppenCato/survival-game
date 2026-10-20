// Renders waters.png: the chart of the sea as waters (docs/build-plan-waters.md step 1) for a few seeds, each water's disc, the
// crossings between, home's edge, every island numbered (its radius in tiles, a star for a slot island), coloured by climate.
// Run from the project root:  node tools/visual/waters.js [seed seed ...]      (WSPEC='{"crossing":300}' lays numbers over World.WATERS)
const { createCanvas } = require('@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), Village = require('../../src/village.js');
const kit = S.kit; kit.setup(kit.STYLE);
const seeds = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [11, 23];
const WSP = process.env.WSPEC ? JSON.parse(process.env.WSPEC) : true;
const T = 32, CW = 900, CH = 900, cv = createCanvas(CW * seeds.length, CH), c = cv.getContext('2d');
c.fillStyle = '#1f2e3c'; c.fillRect(0, 0, cv.width, cv.height);
seeds.forEach((seed, i) => {
  const spec = { isle: 160, isle0: 120, big: 400, sizes: [120, 400], biomes: [0, 0], noDock: true, count: 2, dir: 0.1, gap: 240, gapVar: 0.3, skerries: 1, rough: 1, beach: 4.5, hue: 0, waves: 0.75, foam: 1.05, seed, mountain: 1, mountainOpts: World.BIG_MOUNTAIN, waters: WSP };
  const t0 = Date.now(), w = World.make(kit, spec), tMake = Date.now() - t0, ch = w.chart(CW - 20), sc = (CW - 20) / Math.max(w.GW, w.GH), ox = i * CW + 10, oy = 10;
  c.drawImage(ch, ox, oy, w.GW * sc, w.GH * sc);
  (w.waters || []).forEach(wt => { c.strokeStyle = wt.ring ? 'rgba(255,220,120,0.5)' : 'rgba(120,230,255,0.7)'; c.lineWidth = 1.5; c.setLineDash([6, 4]); c.beginPath(); c.arc(ox + wt.cx * sc, oy + wt.cy * sc, wt.r * sc, 0, 7); c.stroke();
    if (!wt.ring) { c.setLineDash([2, 3]); c.beginPath(); c.arc(ox + wt.cx * sc, oy + wt.cy * sc, (wt.r + w.WD.edge) * sc, 0, 7); c.stroke(); } c.setLineDash([]);
    c.fillStyle = '#fff'; c.font = 'bold 13px sans-serif'; c.fillText(wt.id + ' r' + Math.round(wt.r), ox + (wt.cx - wt.r) * sc + 4, oy + (wt.cy - wt.r) * sc + 14); });
  w.isles.forEach((q, j) => { const cl = w.climate((q.x + 0.5) * T, (q.y + 0.5) * T); c.fillStyle = q.slot ? '#ffd34d' : '#fff'; c.font = '11px sans-serif'; c.fillText((q.slot ? '*' : '') + j + ':' + Math.round(q.r) + ' ' + cl.warm.toFixed(2) + '/' + cl.wet.toFixed(2), ox + q.x * sc - 10, oy + q.y * sc + 4); });
  c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.fillText('seed ' + seed + ': ' + w.GW + 'x' + w.GH + ' tiles, ' + w.isles.length + ' islands, make ' + tMake + ' ms', ox, CH - 6);
  console.log('seed ' + seed + ': ' + w.isles.length + ' islands, ' + w.GW + 'x' + w.GH + ', make ' + tMake + ' ms; ' + (w.waters || []).map(wt => wt.id + ' ' + wt.isles.length).join(', '));
});
fs.writeFileSync(process.env.WOUT || 'waters.png', cv.toBuffer('image/png')); console.log('wrote waters.png');
