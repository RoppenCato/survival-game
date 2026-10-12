// The inside of the cave, looked at without the game (2026-10-12, the cave's rework):
//   node tools/visual/cave.js [seed] [what] [kind]      kind: troll (the cave), mine, sea: the files are then cave_mine_map.png and so on
// Prints the cave's numbers and whether every part can be walked to from the way in. Writes
//   cave_map.png    the whole cave evenly lit, the way through drawn on it, the holes in the roof ringed
//   cave_lit.png    six places close, evenly lit (the hall and the tunnel, the hollow under a hole, the pool, the chasm, the gallery, the lair)
//   cave_dark.png   the same six as the game shows them by day (Cave.dark laid over), then by torch and by night
// what: map, lit, dark or all. The views are the game's own frame (400 by 250 at zoom 0.65, three pixels a unit).
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
const S = require('../../src/stylelab.js'), Cave = require('../../src/cave.js'); const kit = S.kit; kit.setup(kit.STYLE);
const seed = +(process.argv[2] || 11), what = process.argv[3] || 'all', kind = process.argv[4] || 'troll', PRE = kind === 'troll' ? 'cave_' : 'cave_' + kind + '_', K = 0.75, T = 32;
(async () => {
  let t0 = Date.now(); const cave = Cave.make(seed, { x: 0, y: 0, kind }); const tMake = Date.now() - t0; t0 = Date.now(); Cave.prepare(cave); const tPrep = Date.now() - t0;
  console.log('made in', tMake, 'ms, sheets in', tPrep, 'ms;', cave.path.length, 'tiles of way through,', cave.shafts.length, 'holes in the roof,', cave.veins.length, 'veins,', cave.ores.length, 'ore rocks,', cave.props.length, 'stalagmites and columns,', cave.puddles.length, 'puddles');
  const W = 288, H = 160, seen = new Uint8Array(W * H), q = [[Math.floor(cave.entrance.x / 8), Math.floor(cave.entrance.y / 8)]]; seen[q[0][1] * W + q[0][0]] = 1;
  while (q.length) { const [i, j] = q.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i + a, y = j + b; if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x] || !Cave.floor(cave, (x + .5) * 8, (y + .5) * 8)) continue; seen[y * W + x] = 1; q.push([x, y]); } }
  const at = p => seen[Math.floor(p.y / 8) * W + Math.floor(p.x / 8)] ? 'yes' : 'NO';
  if (kind === 'troll') console.log('walked to from the way in: the lair', at(cave.lair), ' the dead man', at({ x: cave.body.x - 24, y: cave.body.y }), ' the pool', at(cave.poolC), ' the ledge', at(cave.ledge), ' the pockets', cave.pockets.map(at).join(' '), ' every ore rock', cave.ores.every(o => at(o) === 'yes') ? 'yes' : 'NO', ' the way out', at(cave.exitAt));
  else console.log('walked to from the way in:', (kind === 'mine' ? [['the first stope', cave.stopeA], ['the big stope', cave.stopeB], ['the dead end', cave.deadEnd], ['the deep stope', cave.deep]] : [['the hall', cave.hall], ['the beach', cave.beach], ['the pocket', cave.pocket]]).map(q2 => q2[0] + ' ' + at(q2[1])).join('  '), ' every find', cave.finds.map(f => f.id + ' ' + at(f)).join(' '), ' the way out', at(cave.exitAt), '; sets', cave.sets.length, 'posts', cave.posts.length, 'veins', cave.veins.map(v => v.left).join(''));
  let lens = 0; for (let i = 1; i < cave.path.length; i++) lens += Math.hypot(cave.path[i].x - cave.path[i - 1].x, cave.path[i].y - cave.path[i - 1].y);
  const gaps = []; const lights = [cave.exitAt].concat(cave.shafts.filter(s => cave.path.some(p => Math.hypot(p.x - s.x, p.y - s.y) < 130))).map(s => { let bi = 0, bd = 1e9; cave.path.forEach((p, i) => { const d = Math.hypot(p.x - s.x, p.y - s.y); if (d < bd) { bd = d; bi = i; } }); return bi; }).sort((a, b) => a - b);
  for (let i = 1; i < lights.length; i++) gaps.push((lights[i] - lights[i - 1]) * T); gaps.push((cave.path.length - 1 - lights[lights.length - 1]) * T);
  console.log('the way through is', Math.round(lens), 'units (' + Math.round(lens / 84) + ' s at a jog); from light to light along it:', gaps.map(Math.round).join(', '), '(the last is the dark before the lair; the screen is 616 wide)');
  let hero = null; try { const J = JSON.parse(fs.readFileSync('assets/sprites/hero2-mixamo/hero2-mixamo.json', 'utf8')); hero = { J, im: await loadImage(path.join('assets/sprites/hero2-mixamo', J.anims.idle.sheets.body)) }; } catch (e) {}
  const sprites = {}; const sprite = (n, v) => sprites[n + v] || (sprites[n + v] = kit.bakeProp(n, 3 + v * 7));
  function frame(P, o) {                                // the game's own frame at a place: the floor, what stands on it and the hero, then the dark
    o = o || {}; const SC = 3, z = 0.65, cv = createCanvas(400 * SC, 250 * SC), c = cv.getContext('2d'), hw = 200 / z, hh = 125 / z, cam = { x: P.x, y: P.y * K - 14, z };
    c.fillStyle = '#06060a'; c.fillRect(0, 0, cv.width, cv.height); c.save(); c.setTransform(SC, 0, 0, SC, 0, 0); c.translate(200, 125); c.scale(z, z); c.translate(-cam.x, -cam.y);
    for (let i = 0; i < 14; i++) Cave.drawFloor(c, cave, cam, hw, hh, 3.1);
    const items = []; cave.finds.filter(f => f.prop === 'drift').forEach(f => items.push({ y: f.y, f: () => Cave.drawDrift(c, f) }));
    cave.props.concat(cave.ores, cave.finds.filter(f => f.prop !== 'drift').map(f => ({ name: f.prop, v: f.v, x: f.x, y: f.y, s: f.s }))).forEach(p => { const s = sprite(p.name, p.v); items.push({ y: p.y, f: () => c.drawImage(s.cv, p.x + s.l * p.s, p.y * K + s.t * p.s, s.w * p.s, s.h * p.s) }); });
    cave.sets.forEach(st => items.push({ y: st.y, f: () => Cave.drawSet(c, st) }));
    if (hero) items.push({ y: P.y, f: () => { const J = hero.J; c.drawImage(hero.im, 0, 0, J.frame.w, J.frame.h, P.x - J.anchor.x / 3, P.y * K - J.anchor.y / 3, J.frame.w / 3, J.frame.h / 3); } });
    items.sort((a, b) => a.y - b.y).forEach(it => it.f()); c.restore();
    if (o.dark) { c.save(); c.setTransform(SC, 0, 0, SC, 0, 0); Cave.dark(c, cave, { cam, P, torch: !!o.torch, clock: 3.1, sun: o.sun == null ? 1 : o.sun, W: 400, H: 250 }); c.restore(); }
    c.globalAlpha = 0.1; c.fillStyle = kit.grain(c); c.fillRect(0, 0, cv.width, cv.height); c.globalAlpha = 1;
    if (o.label) { c.fillStyle = 'rgba(20,16,12,0.72)'; c.font = 'bold 20px sans-serif'; const tw = c.measureText(o.label).width; c.fillRect(8, 8, tw + 14, 30); c.fillStyle = '#f0e6cc'; c.fillText(o.label, 15, 30); }
    return cv;
  }
  const near = (p, dx, dy) => { for (let d = 0; d < 200; d += 8) for (let a = 0; a < 6.3; a += 0.5) { const x = p.x + dx + Math.cos(a) * d, y = p.y + dy + Math.sin(a) * d; if (Cave.floor(cave, x, y) && Cave.floor(cave, x + 8, y) && Cave.floor(cave, x - 8, y)) return { x, y }; } return p; };
  const places = kind === 'mine' ? [['The adit: timber sets, the daylight behind you', near(cave.entrance, 0, -150)], ['Where the adit meets the drift', near(cave.junction, 0, 10)], ['The first stope: water, a fire-set wall', near(cave.stopeA, 0, 20)], ['The big stope under a hole in the roof', near(cave.stopeB, 0, 20)], ['The fall of rock across the drift', near(cave.block, cave.flip ? 70 : -70, 0)], ['The deep stope: the best veins, and the miner', near(cave.deep, 0, 30)]]
    : kind === 'sea' ? [['The mouth: the sea comes in', near(cave.entrance, 0, -40)], ['The channel opens into the hall', near(cave.hall, cave.flip ? 150 : -150, 90)], ['The hall: water to the shingle', near(cave.hall, 0, 30)], ['The beach, the wreck under the hole in the roof', near(cave.beach, cave.flip ? -70 : 70, 40)], ['The passage up from the beach', near(cave.path[6], 0, 0)], ['The dry pocket and the chest', near(cave.pocket, 0, 20)]]
    : [['The hall, and the tunnel of daylight that is the way out', near(cave.hall, 0, 40)], ['The hollow under a hole in the roof', near(cave.fern, -50, 34)], ['The still pool', near(cave.poolC, -70, -10)], ['The chasm, the way through along its lip', near(cave.ledge, -30, 0)], ['The gallery of copper veins', near(cave.gallery, 20, 10)], ['The lair', near(cave.lair, -90, 30)]];
  const sheet = (list, file) => { const cols = 2, w = 1200, h = 750, cv = createCanvas(cols * w, Math.ceil(list.length / cols) * h), c = cv.getContext('2d'); list.forEach((f, i) => c.drawImage(f, (i % cols) * w, Math.floor(i / cols) * h)); fs.writeFileSync(file, cv.toBuffer('image/png')); console.log('wrote', file); };
  if (what === 'all' || what === 'map') {
    const sc = 1, cv = createCanvas(Cave.PW * sc, Cave.PH * sc), c = cv.getContext('2d'); c.fillStyle = '#06060a'; c.fillRect(0, 0, cv.width, cv.height);
    for (let cy = 0; cy * Cave.CS * K < Cave.PH; cy++) for (let cx = 0; cx * Cave.CS < Cave.PW; cx++) c.drawImage(Cave.chunk(cave, cx, cy), cx * Cave.CS * sc, cy * Cave.CS * K * sc, Cave.CS * sc, Cave.CS * K * sc);
    const all = cave.props.concat(cave.ores, cave.finds.filter(f => f.prop !== 'drift').map(f => ({ name: f.prop, v: f.v, x: f.x, y: f.y, s: f.s }))).map(p => ({ y: p.y, f: () => { const s = sprite(p.name, p.v); c.drawImage(s.cv, (p.x + s.l * p.s) * sc, (p.y * K + s.t * p.s) * sc, s.w * p.s * sc, s.h * p.s * sc); } })).concat(cave.sets.map(st => ({ y: st.y, f: () => Cave.drawSet(c, st) })), cave.finds.filter(f => f.prop === 'drift').map(f => ({ y: f.y, f: () => Cave.drawDrift(c, f) })));
    all.sort((a, b) => a.y - b.y).forEach(it => it.f());
    c.strokeStyle = 'rgba(255,211,77,0.75)'; c.lineWidth = 2; cave.shafts.forEach(s => { c.beginPath(); c.ellipse(s.x * sc, s.y * K * sc, s.rx * sc, s.ry * K * sc, 0, 0, 7); c.stroke(); });
    c.fillStyle = '#f0e6cc'; c.font = 'bold 18px sans-serif'; (kind === 'mine' ? [['the way out', cave.exitAt], ['the first stope', cave.stopeA], ['the big stope', cave.stopeB], ['the dead end', cave.deadEnd], ['the fall of rock', cave.block], ['the deep stope', cave.deep]] : kind === 'sea' ? [['the way out', cave.exitAt], ['the hall', cave.hall], ['the beach', cave.beach], ['the pocket', cave.pocket]] : [['the way out', cave.exitAt], ['the lair', cave.lair], ['the dead man', cave.body], ['the pool', cave.pool], ['the chasm', cave.pit]]).forEach(q2 => c.fillText(q2[0], q2[1].x * sc + 14, q2[1].y * K * sc - 30));
    fs.writeFileSync(PRE + 'map.png', cv.toBuffer('image/png')); console.log('wrote ' + PRE + 'map.png (the holes in the roof ringed)');
  }
  if (what === 'all' || what === 'lit') sheet(places.map(p => frame(p[1], { label: p[0] + ' (evenly lit)' })), PRE + 'lit.png');
  if (what === 'all' || what === 'dark') sheet(places.map(p => frame(p[1], { dark: true, label: p[0] })).concat([frame(places[3][1], { dark: true, torch: true, label: places[3][0] + ', by torch' }), frame(places[2][1], { dark: true, sun: 0.15, label: places[2][0] + ', at night' })]), PRE + 'dark.png');
})();
