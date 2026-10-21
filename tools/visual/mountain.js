// The mountain island (2026-10-12): the world the mountain test scene makes, checked and drawn.
//   node tools/visual/mountain.js [seed]
// Prints how much of the island each level takes, the slopes, the waterfall, the lookout and the bay, and whether every level
// can be reached on foot from the wreck (a flood over the walking cells). Writes mountain.png: the whole island's chart with the
// slopes ringed, and close-ups painted as the game paints them (the sea cliffs, the waterfall, the lookout, an edge that faces
// away, a wall, the peaks, a slope, the plateau's ground) with the hero for size. tools/visual/mountainlook.js writes the same
// places one picture each, larger.
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), DI = require('./dayisland.js'); const kit = S.kit; kit.setup(kit.STYLE);
const seed = +(process.argv[2] || 11), SPEC = World.MOUNTAIN_SPEC ? Object.assign({}, World.MOUNTAIN_SPEC, { seed }) : { isle: 220, isle0: 220, count: 1, noDock: true, skerries: 1, rough: 1, beach: 4.5, hue: 0, seed, mountain: true };
(async () => { await DI.load(World);   /* the studio's set pieces, as the game draws them (2026-10-21) */
  try { const PJ = JSON.parse(fs.readFileSync('assets/props/props.json', 'utf8')), map = {}; for (const k in PJ) map[k] = Object.assign({ img: await loadImage(path.join('assets/props', k + '.png')) }, PJ[k]); World.setImages(map); } catch (e) { console.log('no set pieces packed (assets/props): the peaks and the cave mouth are left out'); }
  const t0 = Date.now(), w = World.make(kit, SPEC); w.meadowLook = World.GRASS_INK; w.plant(); const nPeaks = w.peaks ? w.peaks() : 0; if (w.dress) w.dress();
  const caveAt = w.caveSite ? w.caveSite(kit.rng(seed * 31 + 9)) : null; if (caveAt && World.IMAGES.cave_mouth) w.addProp({ name: 'cave_mouth', x: caveAt.x, y: caveAt.y + 2, s: 1, r: 0, v: 0 }); w.sortBuckets();
  const m = w.mt, T = w.T, K = 0.75; if (!m) { console.log('no mountains in this world'); return; }
  console.log('world made in', Date.now() - t0, 'ms;', w.GW + 'x' + w.GH, 'tiles; island r', w.isles[0].r);
  // how much of what
  const n = { lvl: [0, 0, 0, 0], face: 0, side: 0, rim: 0, ramp: 0, water: 0, block: 0 }; let land = 0;
  for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) { const x = (m.x0 + i + 0.5) * m.MC, y = (m.y0 + j + 0.5) * m.MC; if (w.elevAt(x, y) <= 0.05) continue; land++; const c = m.CL[j * m.w + i]; if (c & w.M_FACE) n.face++; else if (c & w.M_SIDE) n.side++; else if (c & w.M_RIM) n.rim++; else if (c & w.M_RAMP) n.ramp++; else { n.lvl[c & 3]++; if (c & w.M_WATER) n.water++; } }
  const pc = v => (v / land * 100).toFixed(1) + '%';
  console.log('of the land: low ground', pc(n.lvl[0]), ' foothills', pc(n.lvl[1]), ' high plateau', pc(n.lvl[2]), ' peaks', pc(n.lvl[3]), ' south faces', pc(n.face), ' side walls', pc(n.side), ' rims', pc(n.rim), ' slopes', pc(n.ramp), ' stream and pool', pc(n.water));
  console.log('the waterfall:', m.falls.length ? m.falls.map(f => 'off level ' + f.n + ' at ' + Math.round(f.x / T) + ',' + Math.round(f.ye / T) + (f.snow ? ', its stream from the snow' : '') + ', the brook ' + Math.round(f.out[f.out.length - 1][1] - f.out[0][1]) + ' long').join('; ') : 'NONE', ' the lookout:', m.lookouts.length ? m.lookouts.map(l => 'level ' + l.lvl + ' at ' + Math.round(l.x / T) + ',' + Math.round(l.y / T)).join('; ') : 'NONE', ' ledges:', m.ledges.length, ' the bay:', m.bay ? Math.round(m.bay.x / T) + ',' + Math.round(m.bay.y / T) : 'none');
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
  label('The mountain island, seed ' + seed + ': slopes ringed yellow, the waterfall blue, the lookout a white square, the cave and the wreck red', 14, 26);
  let hero = null; try { const J = JSON.parse(fs.readFileSync('assets/sprites/hero2-mixamo/hero2-mixamo.json', 'utf8')); hero = { J, im: await loadImage(path.join('assets/sprites/hero2-mixamo', J.anims.idle.sheets.body)) }; } catch (e) {}
  function shot(title, at, x, y, ww, hh, Z, heroAt) {
    const r = DI.paint(kit, World, ww, hh, Z, { world: w, at }); c.drawImage(r.cv, x, y);
    if (hero && heroAt) { const p = r.toScreen(heroAt.x, heroAt.y), J = hero.J, k = Z / 3; c.drawImage(hero.im, 0, 0, J.frame.w, J.frame.h, x + p.x - J.anchor.x * k, y + p.y - J.anchor.y * k, J.frame.w * k, J.frame.h * k); }
    label(title, x + 8, y + 22);
  }
  const r2 = m.ramps.filter(r => r.n === 2 && !r.gap)[0];
  function find(test, st) { const out = []; for (let j = 6; j < m.h - 6; j += st || 3) for (let i = 6; i < m.w - 6; i += st || 3) if (test(i, j)) out.push({ x: (m.x0 + i + 0.5) * m.MC, y: (m.y0 + j + 0.5) * m.MC }); return out; }
  const cell = (i, j) => (i < 0 || j < 0 || i >= m.w || j >= m.h) ? 0 : m.CL[j * m.w + i], mid = l => l.length ? l[Math.floor(l.length / 2)] : null, dryc = (i, j) => w.elevAt((m.x0 + i + 0.5) * m.MC, (m.y0 + j + 0.5) * m.MC) > 0.6;
  const plat = mid(find((i, j) => { for (let b = -10; b <= 10; b += 5) for (let a = -14; a <= 14; a += 7) if (cell(i + a, j + b) !== 2) return false; return true; }));
  const north = mid(find((i, j) => (cell(i, j) & 3) === 0 && !(cell(i, j) & w.M_BLOCK) && dryc(i, j) && dryc(i, j - 12) && (cell(i, j + 4) & 3) >= 1 && !(cell(i, j + 2) & (w.M_FACE | w.M_SIDE)) && (cell(i - 14, j + 5) & 3) >= 1 && (cell(i + 14, j + 5) & 3) >= 1));
  const faces = find((i, j) => (cell(i, j) & w.M_FACE) && (cell(i, j - 8) & 3) === 2 && !(cell(i, j + 8) & w.M_BLOCK) && (cell(i, j + 8) & 3) === 1 && dryc(i, j + 8), 9), face = faces.length ? faces[Math.floor(faces.length * 0.7)] : null;
  const fl = m.falls[0], lo = m.lookouts[0], pk = m.peaks || [];
  if (m.bay) shot('The sea cliffs: the plateau comes down to the bay in one wall', { x: m.bay.x - m.seaSide * 150, y: m.bay.y - 640 }, 790, 40, 1560, 700, 0.62, null);
  if (fl) shot('The waterfall off the plateau, its pool and the brook', { x: fl.x, y: fl.foot - 20 }, 10, 760, 770, 700, 1.7, { x: fl.x + fl.pool.rx + 26, y: fl.pool.y + 30 });
  if (lo) shot('The lookout: the beacon cairn on the high point', { x: lo.x, y: lo.y + 60 }, 790, 760, 780, 700, 1.7, { x: lo.x + 34, y: lo.y + 14 });
  if (north) shot('An edge that faces away: rock along its crest, the dark under it', { x: north.x, y: north.y + 30 }, 1580, 760, 770, 700, 2, { x: north.x, y: north.y - 30 });
  if (face) shot('A wall: strata, great blocks and beds between fissures, a ledge', face, 10, 1480, 780, 700, 2.4, null);
  if (pk.length) { const p0 = pk[Math.floor(pk.length / 2)]; shot('The peaks (' + pk.length + ' stand)', { x: p0.x, y: p0.y + 60 }, 800, 1480, 770, 700, 1.1, w.nearFlat(p0.x, p0.y + 260, 2) || null); }
  if (plat) shot('The high plateau: heath, heather, stone', plat, 1580, 1480, 770, 700, 2, plat);
  if (caveAt) { c.strokeStyle = '#ff5a3a'; c.lineWidth = 3; c.beginPath(); c.arc(cx(caveAt.x), cyy(caveAt.y), 7, 0, 7); c.stroke(); }
  if (fl) { c.strokeStyle = '#7fe0ff'; c.lineWidth = 2; c.beginPath(); c.arc(cx(fl.x), cyy(fl.foot), 8, 0, 7); c.stroke(); } if (lo) { c.strokeStyle = '#ffffff'; c.strokeRect(cx(lo.x) - 5, cyy(lo.y) - 5, 10, 10); }
  fs.writeFileSync('mountain.png', cv.toBuffer('image/png')); console.log('wrote mountain.png in', Date.now() - t0, 'ms');
})();
