// Close looks at the mountain island, one picture a place (2026-10-12): the things the mountain pass set out to mend or add.
//   node tools/visual/mountainlook.js [seed] [shots] [zoom]
// shots: east,west,north,face,face2,fells1,fells2,sea,sea2,fall,look,peaks,cave (or all). Each is written to mt_<shot>.png,
// painted as the game paints it (tools/visual/dayisland.js), the hero standing in it for size.
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), DI = require('./dayisland.js'); const kit = S.kit; kit.setup(kit.STYLE);
const seed = +(process.argv[2] || 11), want = (process.argv[3] || 'all').split(','), Z = +(process.argv[4] || 2), SPEC = Object.assign({}, World.MOUNTAIN_SPEC, { seed });
(async () => {
  try { const PJ = JSON.parse(fs.readFileSync('assets/props/props.json', 'utf8')), map = {}; for (const k in PJ) map[k] = Object.assign({ img: await loadImage(path.join('assets/props', k + '.png')) }, PJ[k]); World.setImages(map); } catch (e) { console.log('no set pieces packed'); }
  const w = World.make(kit, SPEC); w.meadowLook = World.GRASS_INK; w.plant(); if (w.peaks) w.peaks(); if (w.dress) w.dress();
  const caveAt = w.caveSite ? w.caveSite(kit.rng(seed * 31 + 9)) : null; if (caveAt && World.IMAGES.cave_mouth) w.addProp({ name: 'cave_mouth', x: caveAt.x, y: caveAt.y + 2, s: 1, r: 0, v: 0 }); w.sortBuckets();
  const m = w.mt, T = w.T, K = 0.75, F = w.M_FACE, SD = w.M_SIDE, BL = w.M_BLOCK;
  const cell = (i, j) => (i < 0 || j < 0 || i >= m.w || j >= m.h) ? 0 : m.CL[j * m.w + i], at = (i, j) => ({ x: (m.x0 + i + 0.5) * m.MC, y: (m.y0 + j + 0.5) * m.MC });
  const dry = (i, j) => { const p = at(i, j); return w.elevAt(p.x, p.y) > 0.6; };
  function find(test, step) { const out = []; for (let j = 6; j < m.h - 6; j += step || 3) for (let i = 6; i < m.w - 6; i += step || 3) if (test(i, j)) out.push([i, j]); return out; }
  const pick = l => l.length ? at.apply(null, l[Math.floor(l.length / 2)]) : null;
  let hero = null; try { const J = JSON.parse(fs.readFileSync('assets/sprites/hero2-mixamo/hero2-mixamo.json', 'utf8')); hero = { J, im: await loadImage(path.join('assets/sprites/hero2-mixamo', J.anims.idle.sheets.body)) }; } catch (e) {}
  function shot(name, title, centre, heroAt, zz, ww, hh) {
    if (!centre) { console.log(name + ': no such place on this island'); return; }
    const W = ww || 1280, H = hh || 860, z = zz || Z, r = DI.paint(kit, World, W, H, z, { world: w, at: centre }), c = r.cv.getContext('2d');
    if (hero && heroAt) { const p = r.toScreen(heroAt.x, heroAt.y), J = hero.J, k = z / 3; c.drawImage(hero.im, 0, 0, J.frame.w, J.frame.h, p.x - J.anchor.x * k, p.y - J.anchor.y * k, J.frame.w * k, J.frame.h * k); }
    c.fillStyle = 'rgba(20,16,12,0.7)'; c.font = 'bold 15px sans-serif'; const tw = c.measureText(title).width; c.fillRect(6, 6, tw + 10, 22); c.fillStyle = '#f0e6cc'; c.fillText(title, 11, 22);
    fs.writeFileSync('mt_' + name + '.png', r.cv.toBuffer('image/png')); console.log('wrote mt_' + name + '.png');
  }
  const has = n => want.includes('all') || want.includes(n);
  // a wall that faces east: side-wall cells with dry low ground beyond them to the east, high ground to the west, inland
  // a wall that faces east: a run of side-wall cells down a column's lean (no south face near), the high ground west of it, dry low ground east
  const sideRun = (i, j, dir) => { for (let k = -3; k <= 3; k += 3) { if (!(cell(i, j + k) & SD) || (cell(i, j + k) & F)) return false; } return (cell(i - dir * 5, j) & 3) > (cell(i + dir * 5, j) & 3) && (cell(i - dir * 5, j) & 3) < 3 && !(cell(i + dir * 6, j) & BL) && dry(i + dir * 6, j) && dry(i + dir * 16, j); };
  const east = pick(find((i, j) => sideRun(i, j, 1), 2)), west = pick(find((i, j) => sideRun(i, j, -1), 2));
  const north = pick(find((i, j) => (cell(i, j) & 3) === 0 && !(cell(i, j) & BL) && dry(i, j) && dry(i, j - 12) && (cell(i, j + 4) & 3) >= 1 && !(cell(i, j + 2) & (F | SD)) && (cell(i - 14, j + 5) & 3) >= 1 && (cell(i + 14, j + 5) & 3) >= 1));
  const north2 = pick(find((i, j) => (cell(i, j) & 3) === 1 && !(cell(i, j) & BL) && (cell(i, j + 4) & 3) === 2 && !(cell(i, j + 2) & (F | SD)) && (cell(i - 14, j + 5) & 3) === 2 && (cell(i + 14, j + 5) & 3) === 2));
  const faces = find((i, j) => (cell(i, j) & F) && (cell(i, j - 8) & 3) === 2 && !(cell(i, j + 8) & BL) && (cell(i, j + 8) & 3) === 1 && dry(i, j + 8), 9);
  const faces1 = find((i, j) => (cell(i, j) & F) && (cell(i, j - 8) & 3) === 1 && !(cell(i, j + 8) & BL) && (cell(i, j + 8) & 3) === 0 && dry(i, j + 8), 9);
  const f1 = find((i, j) => { for (let b = -8; b <= 8; b += 4) for (let a = -12; a <= 12; a += 6) if (cell(i + a, j + b) !== 1) return false; return true; }), f2 = find((i, j) => { for (let b = -8; b <= 8; b += 4) for (let a = -12; a <= 12; a += 6) if (cell(i + a, j + b) !== 2) return false; return true; });
  if (has('east')) shot('east', 'A wall that faces east: its dark side, and the shadow it throws', east, east && w.nearFlat(east.x + 70, east.y + 30, null, 12));
  if (has('west')) shot('west', 'A wall that faces west: its lit side', west, west && w.nearFlat(west.x - 70, west.y + 30, null, 12));
  if (has('north')) shot('north', 'An edge that faces away: the low ground north of the fells', north, north && { x: north.x, y: north.y - 30 });
  if (has('north2')) shot('north2', 'An edge that faces away, between the foothills and the plateau', north2, north2);
  if (has('face')) shot('face', 'The plateau\'s south wall', faces.length ? at.apply(null, faces[Math.floor(faces.length * 0.3)]) : null, faces.length ? w.nearFlat(at.apply(null, faces[Math.floor(faces.length * 0.3)]).x, at.apply(null, faces[Math.floor(faces.length * 0.3)]).y + 120, 1) : null, 1.5, 1500, 760);
  if (has('face2')) shot('face2', 'The foothills\' south wall', faces1.length ? at.apply(null, faces1[Math.floor(faces1.length * 0.6)]) : null, faces1.length ? w.nearFlat(at.apply(null, faces1[Math.floor(faces1.length * 0.6)]).x, at.apply(null, faces1[Math.floor(faces1.length * 0.6)]).y + 120, 0) : null, 1.5, 1500, 760);
  if (has('face3')) shot('face3', 'A wall, close', faces.length ? at.apply(null, faces[Math.floor(faces.length * 0.7)]) : null, null, 3, 1400, 800);
  if (has('fells1')) shot('fells1', 'The foothills', pick(f1), pick(f1));
  if (has('fells2')) shot('fells2', 'The high plateau', pick(f2), pick(f2));
  if (has('low')) shot('low', 'The low ground, for comparison', { x: w.home.x - 500, y: w.home.y + 100 }, { x: w.home.x - 500, y: w.home.y + 100 });
  if (m.bay) { if (has('sea')) shot('sea', 'The sea cliffs over the bay', { x: m.bay.x - m.seaSide * m.bay.a * 0.35, y: m.bay.y - m.bay.b * 1.3 }, null, 1, 1500, 900); if (has('sea2')) shot('sea2', 'Under the wall, from the water', { x: m.bay.x - m.seaSide * m.bay.a * 0.5, y: m.bay.y - m.bay.b * 0.9 }, null, 2); if (has('sea3')) shot('sea3', 'The cliffs\' side of the island', { x: m.bay.x - m.seaSide * 150, y: m.bay.y - 700 }, null, 0.7, 1500, 1100); }
  const fl = m.falls[0]; if (fl) { if (has('fall')) shot('fall', 'The waterfall and its pool', { x: fl.x, y: fl.foot - 20 }, { x: fl.x + 76, y: fl.pool.y + 34 }); if (has('fall2')) shot('fall2', 'The stream on the plateau, the fall, the brook', { x: fl.x, y: fl.foot - 40 }, { x: fl.x - 70, y: fl.ye - 60 }, 1.2, 1100, 1000); if (has('fall3')) shot('fall3', 'The waterfall, close', { x: fl.x, y: fl.foot - 30 }, { x: fl.x + 30, y: fl.pool.y + 20 }, 3.4, 1100, 900); }
  const lo = m.lookouts[0]; if (lo && has('look')) shot('look', 'The lookout: the beacon cairn on the high point', { x: lo.x, y: lo.y + 30 }, { x: lo.x + 34, y: lo.y + 14 });
  const pk = m.peaks || []; if (pk.length && has('peaks')) { const p0 = pk[Math.floor(pk.length / 2)]; shot('peaks', 'The peaks', { x: p0.x, y: p0.y + 40 }, w.nearFlat(p0.x, p0.y + 260, 2), 1.3, 1500, 900); }
  if (pk.length && has('peaks2')) { const p0 = pk[Math.floor(pk.length * 0.25)]; shot('peaks2', 'Under the peaks', { x: p0.x, y: p0.y + 120 }, w.nearFlat(p0.x, p0.y + 260, 2), 2.2); }
  if (caveAt && has('cave')) shot('cave', 'The cave mouth', { x: caveAt.x, y: caveAt.y - 10 }, { x: caveAt.x + 70, y: caveAt.y + 40 }, 2.4);
  if (has('chart')) { const ch = w.chart(900), cs = 2, cv = createCanvas(ch.width * cs, ch.height * cs), c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(ch, 0, 0, cv.width, cv.height); const st = w.GW / ch.width; c.strokeStyle = '#ffd34d'; c.lineWidth = 2; m.ramps.forEach(r => { c.beginPath(); c.arc(r.ex / T / st * cs, r.ey / T / st * cs, 7, 0, 7); c.stroke(); }); c.fillStyle = '#ff5a3a'; [[w.home.x, w.home.y]].forEach(q => { c.beginPath(); c.arc(q[0] / T / st * cs, q[1] / T / st * cs, 5, 0, 7); c.fill(); }); c.strokeStyle = '#ffffff'; m.lookouts.forEach(l => { c.strokeRect(l.x / T / st * cs - 5, l.y / T / st * cs - 5, 10, 10); }); c.strokeStyle = '#7fe0ff'; m.falls.forEach(f => { c.beginPath(); c.arc(f.x / T / st * cs, f.foot / T / st * cs, 8, 0, 7); c.stroke(); }); if (caveAt) { c.strokeStyle = '#ff5a3a'; c.beginPath(); c.arc(caveAt.x / T / st * cs, caveAt.y / T / st * cs, 6, 0, 7); c.stroke(); } fs.writeFileSync('mt_chart.png', cv.toBuffer('image/png')); console.log('wrote mt_chart.png (slopes yellow, the lookout a white square, the fall blue, the cave red)'); }
})();
