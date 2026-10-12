// The mountain island (2026-10-12): the world the mountain test scene makes, checked and drawn.
//   node tools/visual/mountain.js [seed]
// Prints how much of the island each level takes, the slopes, and whether every level can be reached on foot from the wreck
// (a flood over the walking cells). Writes mountain.png: the whole island's chart with the slopes ringed, and close-ups painted
// as the game paints them (a slope up a face, the high plateau, a rim that faces away, the peaks) with the hero for size.
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), DI = require('./dayisland.js'); const kit = S.kit; kit.setup(kit.STYLE);
const seed = +(process.argv[2] || 11), SPEC = World.MOUNTAIN_SPEC ? Object.assign({}, World.MOUNTAIN_SPEC, { seed }) : { isle: 220, isle0: 220, count: 1, noDock: true, skerries: 1, rough: 1, beach: 4.5, hue: 0, seed, mountain: true };
(async () => {
  try { const PJ = JSON.parse(fs.readFileSync('assets/props/props.json', 'utf8')), map = {}; for (const k in PJ) map[k] = Object.assign({ img: await loadImage(path.join('assets/props', k + '.png')) }, PJ[k]); World.setImages(map); } catch (e) { console.log('no set pieces packed (assets/props): the peaks and the cave mouth are left out'); }
  const t0 = Date.now(), w = World.make(kit, SPEC); w.meadowLook = World.GRASS_INK; w.plant(); const nPeaks = w.peaks ? w.peaks() : 0; if (w.dress) w.dress();
  const caveAt = w.caveSite ? w.caveSite(kit.rng(seed * 31 + 9)) : null; if (caveAt && World.IMAGES.cave_mouth) w.addProp({ name: 'cave_mouth', x: caveAt.x, y: caveAt.y + 2, s: 1, r: 0, v: 0 }); w.sortBuckets();
  const m = w.mt, T = w.T, K = 0.75; if (!m) { console.log('no mountains in this world'); return; }
  console.log('world made in', Date.now() - t0, 'ms;', w.GW + 'x' + w.GH, 'tiles; island r', w.isles[0].r);
  // how much of what
  const n = { lvl: [0, 0, 0, 0], face: 0, rim: 0, ramp: 0, block: 0 }; let land = 0;
  for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) { const x = (m.x0 + i + 0.5) * m.MC, y = (m.y0 + j + 0.5) * m.MC; if (w.elevAt(x, y) <= 0.05) continue; land++; const c = m.CL[j * m.w + i]; if (c & w.M_FACE) n.face++; else if (c & w.M_RIM) n.rim++; else if (c & w.M_RAMP) n.ramp++; else n.lvl[c & 3]++; }
  const pc = v => (v / land * 100).toFixed(1) + '%';
  console.log('of the land: low ground', pc(n.lvl[0]), ' foothills', pc(n.lvl[1]), ' high plateau', pc(n.lvl[2]), ' peaks', pc(n.lvl[3]), ' faces', pc(n.face), ' rims', pc(n.rim), ' slopes', pc(n.ramp));
  console.log('peaks stood:', nPeaks, ' the cave:', caveAt ? Math.round(caveAt.x / w.T) + ',' + Math.round(caveAt.y / w.T) + ' on level ' + w.levelAt(caveAt.x, caveAt.y + 12) : 'NO PLACE FOUND');
  console.log('slopes:', m.ramps.map(r => 'to level ' + r.n + ' at ' + Math.round(r.ex / T) + ',' + Math.round(r.ey / T)).join('; ') || 'NONE');
  // can every level be walked to from the wreck? a flood over the walking cells
  const seen = new Uint8Array(m.w * m.h), reach = [0, 0, 0, 0], q = []; let start = null;
  start = [Math.floor(w.home.x / m.MC) - m.x0 - 6, Math.floor(w.home.y / m.MC) - m.y0];
  q.push(start); seen[start[1] * m.w + start[0]] = 1;
  while (q.length) { const [i, j] = q.pop(); const c = m.CL[j * m.w + i]; if (!(c & w.M_RAMP)) reach[c & 3]++; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= m.w || b >= m.h || seen[b * m.w + a]) continue; if (!w.isLand((m.x0 + a + 0.5) * m.MC, (m.y0 + b + 0.5) * m.MC)) continue; seen[b * m.w + a] = 1; q.push([a, b]); } }
  console.log('reached on foot from the south shore: low', reach[0], 'of', n.lvl[0], ' foothills', reach[1], 'of', n.lvl[1], ' plateau', reach[2], 'of', n.lvl[2], (reach[1] < n.lvl[1] * 0.9 || reach[2] < n.lvl[2] * 0.9) ? '  <-- SOME GROUND CANNOT BE REACHED' : '  (all of it)');
  if (process.argv.includes('--stats')) return;
  // the picture
  const CW2 = 760, chart = w.chart(CW2), W = 2360, H = 2200, cv = createCanvas(W, H), c = cv.getContext('2d'); c.fillStyle = '#1b2530'; c.fillRect(0, 0, W, H);
  const cs = 760 / chart.width; c.imageSmoothingEnabled = false; c.drawImage(chart, 10, 40, chart.width * cs, chart.height * cs); c.imageSmoothingEnabled = true;
  const step = w.GW / chart.width, cx = x => 10 + x / T / step * cs, cyy = y => 40 + y / T / step * cs;
  c.strokeStyle = '#ffd34d'; c.lineWidth = 2; m.ramps.forEach(r => { c.beginPath(); c.arc(cx(r.ex), cyy(r.ey), 9, 0, 7); c.stroke(); });
  c.fillStyle = '#ff5a3a'; c.beginPath(); c.arc(cx(w.home.x), cyy(w.home.y), 5, 0, 7); c.fill();
  const label = (t, x, y) => { c.fillStyle = 'rgba(20,16,12,0.7)'; c.font = 'bold 14px sans-serif'; const tw = c.measureText(t).width; c.fillRect(x - 4, y - 15, tw + 8, 20); c.fillStyle = '#f0e6cc'; c.fillText(t, x, y); };
  label('The mountain island, seed ' + seed + ': slopes ringed, the wreck red', 14, 26);
  let hero = null; try { const J = JSON.parse(fs.readFileSync('assets/sprites/hero2-mixamo/hero2-mixamo.json', 'utf8')); hero = { J, im: await loadImage(path.join('assets/sprites/hero2-mixamo', J.anims.idle.sheets.body)) }; } catch (e) {}
  function shot(title, at, x, y, ww, hh, Z, heroAt) {
    const r = DI.paint(kit, World, ww, hh, Z, { world: w, at }); c.drawImage(r.cv, x, y);
    if (hero && heroAt) { const p = r.toScreen(heroAt.x, heroAt.y), J = hero.J, k = Z / 3; c.drawImage(hero.im, 0, 0, J.frame.w, J.frame.h, x + p.x - J.anchor.x * k, y + p.y - J.anchor.y * k, J.frame.w * k, J.frame.h * k); }
    label(title, x + 8, y + 22);
  }
  const r1 = m.ramps.filter(r => r.n === 1)[0], r2 = m.ramps.filter(r => r.n === 2)[0];
  // a place on the plateau, a rim that faces north, and the peaks: found from the cells
  function find(test) { for (let j = 4; j < m.h - 4; j += 3) for (let i = 4; i < m.w - 4; i += 3) if (test(i, j)) return { x: (m.x0 + i + 0.5) * m.MC, y: (m.y0 + j + 0.5) * m.MC }; return null; }
  const cell = (i, j) => (i < 0 || j < 0 || i >= m.w || j >= m.h) ? 0 : m.CL[j * m.w + i];
  const plat = find((i, j) => { for (let b = -10; b <= 10; b += 5) for (let a = -14; a <= 14; a += 7) if (cell(i + a, j + b) !== 2) return false; return true; });
  const north = find((i, j) => (cell(i, j) & 3) === 0 && !(cell(i, j) & 60) && (cell(i, j + 3) & 3) >= 1 && (cell(i - 12, j + 3) & 3) >= 1 && (cell(i + 12, j + 3) & 3) >= 1);
  const peak = find((i, j) => (cell(i, j) & 3) === 3 && (cell(i, j + 16) & 3) === 2 && !(cell(i, j + 30) & 60) && (cell(i - 14, j) & 3) === 3 && (cell(i + 14, j) & 3) === 3);
  if (r1) shot('A slope up to the foothills', { x: r1.ex, y: r1.ey + 40 }, 790, 40, 780, 700, 2.4, { x: r1.x1, y: r1.y1 + 20 });
  if (r2) shot('A slope up to the high plateau', { x: r2.ex, y: r2.ey + 40 }, 1580, 40, 770, 700, 2.4, { x: r2.x1 + 60, y: r2.y1 + 10 });
  if (plat) shot('On the high plateau', plat, 10, 760, 770, 700, 2.4, plat);
  if (peak) shot('Under the peaks', { x: peak.x, y: peak.y + 150 }, 790, 760, 780, 700, 1.7, w.nearFlat(peak.x, peak.y + 290, 2));
  if (north) shot('A rim that faces away (north of the fells)', { x: north.x, y: north.y + 20 }, 1580, 760, 770, 700, 2.4, north);
  if (caveAt) { shot('The cave mouth in the face', { x: caveAt.x, y: caveAt.y - 10 }, 10, 1480, 1160, 700, 3, { x: caveAt.x + 70, y: caveAt.y + 40 }); c.strokeStyle = '#ff5a3a'; c.lineWidth = 3; c.beginPath(); c.arc(cx(caveAt.x), cyy(caveAt.y), 7, 0, 7); c.stroke(); }
  const pk = []; w.eachProp(o => { if (o.peak) pk.push(o); }); if (pk.length) { const p0 = pk[Math.floor(pk.length / 2)]; shot('The peaks from the plateau below them (' + pk.length + ' stood)', { x: p0.x, y: p0.y + 60 }, 1180, 1480, 1170, 700, 1.3, w.nearFlat(p0.x, p0.y + 200, 2) || null); }
  fs.writeFileSync('mountain.png', cv.toBuffer('image/png')); console.log('wrote mountain.png in', Date.now() - t0, 'ms');
})();
