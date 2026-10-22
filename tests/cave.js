// The cave (src/cave.js): laid out for a run of seeds, and for each whether every part can be walked to from the way in
// (a flood over the floor from where you come in), what stands in it, and how far it is from light to light along the way
// through. No assertions, like the other tests: read the lines. A NO, or a count of 0 where there should be things, is a fault.
global.__mk = (w, h) => require('../node_modules/@napi-rs/canvas').createCanvas(w, h);
const Cave = require('../src/cave.js');
const seeds = process.argv[2] ? [+process.argv[2]] : [11, 1, 2, 3, 5, 7, 12, 25, 42, 77, 100, 2024];
let faults = 0;
// The crypts under churches (raid step 8, 2026-10-21): a small cave each; the niche with the silver must be walkable from the stair
seeds.slice(0, 6).forEach(seed => {
  const c = Cave.make(seed, { kind: 'crypt', x: 5000, y: 400, silver: 20 }), W = 288, H = 160, seen = new Uint8Array(W * H), cx = p => Math.floor((p.x - c.ox) / 8), cy = p => Math.floor((p.y - c.oy) / 8), q = [[cx(c.entrance), cy(c.entrance)]];
  seen[q[0][1] * W + q[0][0]] = 1;
  while (q.length) { const [i, j] = q.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i + a, y = j + b; if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x] || c.D[y * W + x] < 0) continue; seen[y * W + x] = 1; q.push([x, y]); } }
  const reach = p => seen[cy(p) * W + cx(p)] ? 'yes' : 'NO', ok = reach(c.vault) === 'yes' && reach(c.niche) === 'yes' && reach(c.hoard) === 'yes';
  if (!ok) faults++;
  console.log((ok ? '   ' : '!! ') + 'crypt ' + String(seed).padEnd(5) + ' the vault from the stair: ' + reach(c.vault) + ', the niche: ' + reach(c.niche) + ', the silver: ' + reach(c.hoard) + ' (' + c.hoard.n + '); ' + c.props.length + ' things (' + c.props.map(p => p.name).filter((n, i, a) => a.indexOf(n) === i).join(', ') + ')');
});
// The catacombs (2026-10-22): a town church's crypt (rank 1) and a cathedral's (rank 2). Open, all of it from the stair: both sides of
// every pillar (the loop), the alcoves, the vault, the ways out; and with the falls of masonry and the gates shut, the alcoves and the
// vault are closed off while the ways out stay open. The pillar is rock.
[1, 2].forEach(rank => seeds.slice(0, 6).forEach(seed => {
  const c = Cave.make(seed, { kind: 'crypt', rank, x: 5000, y: 400, silver: 30 }), W = 288, H = 160, cx = p => Math.floor((p.x - c.ox) / 8), cy = p => Math.floor((p.y - c.oy) / 8);
  const shut = (x, y) => c.ores.some(o => o.block && Math.hypot(x - o.x, y - o.y) < o.r * o.s + 7) || c.gates.some(g => Math.abs(y - g.y) < 9 && Math.abs(x - g.x) < g.w / 2 + 6);
  function flood(closed) { const seen = new Uint8Array(W * H), q = [[cx(c.entrance), cy(c.entrance)]]; seen[q[0][1] * W + q[0][0]] = 1;
    while (q.length) { const [i, j] = q.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i + a, y = j + b; if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x] || !Cave.floor(c, c.ox + (x + 0.5) * 8, c.oy + (y + 0.5) * 8) || (closed && shut(c.ox + (x + 0.5) * 8, c.oy + (y + 0.5) * 8))) continue; seen[y * W + x] = 1; q.push([x, y]); } }
    return p => !!seen[cy(p) * W + cx(p)]; }
  const open = flood(false), closed = flood(true), T = 32;
  const sides = c.loops.every(L => open({ x: L.pillar.x - 3.3 * T, y: L.pillar.y }) && open({ x: L.pillar.x + 3.3 * T, y: L.pillar.y }) && Cave.dAt(c, L.pillar.x, L.pillar.y) < 0);
  const ok = sides && c.alcoves.every(open) && open(c.vault) && c.exits.every(open) && c.alcoves.every(p => !closed(p)) && !closed(c.vault) && c.exits.every(closed);
  if (!ok) faults++;
  const coffins = c.finds.filter(f => f.coffin).length, chests = c.finds.filter(f => f.prop === 'chest').length;
  console.log((ok ? '   ' : '!! ') + (rank === 2 ? 'cathedral ' : 'town crypt ') + String(seed).padEnd(5) + ' loops round ' + (sides ? 'yes' : 'NO') + ', alcoves ' + c.alcoves.map(p => (open(p) ? 'o' : 'X') + (closed(p) ? '!' : '')).join('') + ', vault ' + (open(c.vault) ? 'yes' : 'NO') + (closed(c.vault) ? ' (NOT SHUT)' : '') + ', ways out ' + c.exits.map(e => e.id + (open(e) && closed(e) ? '' : ' NO')).join(' ') + '; ' + c.gates.length + ' gate' + (c.gates.length > 1 ? 's' : '') + ' (' + c.gates.map(g => Math.round(g.w)).join(', ') + ' wide), ' + c.niches.length + ' niches, ' + coffins + ' coffins (' + c.finds.filter(f => f.ring).length + ' with a ring), ' + chests + ' hidden chest' + (chests > 1 ? 's' : '') + ', ' + c.ores.length + ' stones of the falls');
}));
seeds.forEach(seed => {
  const cave = Cave.make(seed, { x: 5000, y: 400 }), W = 288, H = 160, seen = new Uint8Array(W * H), cx = p => Math.floor((p.x - cave.ox) / 8), cy = p => Math.floor((p.y - cave.oy) / 8), q = [[cx(cave.entrance), cy(cave.entrance)]];
  seen[q[0][1] * W + q[0][0]] = 1; let cells = 0;
  while (q.length) { const [i, j] = q.pop(); cells++; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i + a, y = j + b; if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x] || !Cave.floor(cave, cave.ox + (x + .5) * 8, cave.oy + (y + .5) * 8)) continue; seen[y * W + x] = 1; q.push([x, y]); } }
  const at = p => seen[cy(p) * W + cx(p)] ? 'yes' : 'NO', all = l => l.every(p => at(p) === 'yes') ? 'yes' : 'NO';
  let off = 0; for (let i = 1; i < cave.path.length; i++) for (let t = 0; t <= 1; t += 0.1) if (!Cave.floor(cave, cave.path[i - 1].x + (cave.path[i].x - cave.path[i - 1].x) * t, cave.path[i - 1].y + (cave.path[i].y - cave.path[i - 1].y) * t)) off++;
  const idx = s => { let bi = 0, bd = 1e9; cave.path.forEach((p, i) => { const d = Math.hypot(p.x - s.x, p.y - s.y); if (d < bd) { bd = d; bi = i; } }); return bi; };
  const lights = [0].concat(cave.shafts.filter(s => cave.path.some(p => Math.hypot(p.x - s.x, p.y - s.y) < 130)).map(idx)).sort((a, b) => a - b), gaps = []; for (let i = 1; i < lights.length; i++) gaps.push((lights[i] - lights[i - 1]) * 32);
  const line = ['seed ' + String(seed).padStart(4), 'lair ' + at(cave.lair), 'dead man ' + at({ x: cave.body.x - 24, y: cave.body.y }), 'pool ' + at(cave.poolC), 'ledge ' + at(cave.ledge), 'way out ' + at(cave.exitAt), 'pockets ' + all(cave.pockets), 'ores ' + cave.ores.length + ' ' + all(cave.ores), 'things ' + cave.props.length + ' ' + all(cave.props), 'veins ' + cave.veins.length, 'way through off the floor ' + off, 'light to light ' + gaps.join(' '), 'floor cells ' + cells];
  if (line.join(' ').includes('NO') || off || cave.ores.length < 6 || cave.veins.length < 4) faults++;
  console.log(line.join('  '));
});
console.log(faults ? faults + ' SEEDS WITH A FAULT' : 'every seed: all of the cave can be walked to');
// The other caves (the old mine, the sea cave): the same flood from the way in, over their own places and what lies in them.
// The mine's deep stope lies beyond a fall of rock (two stones the pick clears): the flood ignores it, the line says the stones are there.
['mine', 'sea'].forEach(kind => {
  let bad = 0;
  seeds.forEach(seed => {
    const cave = Cave.make(seed, { x: 5000, y: 1900, kind }), W = 288, H = 160, seen = new Uint8Array(W * H), cx = p => Math.floor((p.x - cave.ox) / 8), cy = p => Math.floor((p.y - cave.oy) / 8), q = [[cx(cave.entrance), cy(cave.entrance)]];
    seen[q[0][1] * W + q[0][0]] = 1; let cells = 0, wet = 0;
    while (q.length) { const [i, j] = q.pop(); cells++; if (Cave.sAt(cave, cave.ox + (i + .5) * 8, cave.oy + (j + .5) * 8) > 0) wet++; for (const [a, b2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i + a, y = j + b2; if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x] || !Cave.floor(cave, cave.ox + (x + .5) * 8, cave.oy + (y + .5) * 8)) continue; seen[y * W + x] = 1; q.push([x, y]); } }
    const at = p => seen[cy(p) * W + cx(p)] ? 'yes' : 'NO', all = l => l.every(p => at(p) === 'yes') ? 'yes' : 'NO';
    let off = 0; for (let i = 1; i < cave.path.length; i++) for (let t = 0; t <= 1; t += 0.1) if (!Cave.floor(cave, cave.path[i - 1].x + (cave.path[i].x - cave.path[i - 1].x) * t, cave.path[i - 1].y + (cave.path[i].y - cave.path[i - 1].y) * t)) off++;
    const places = kind === 'mine' ? [['first stope', cave.stopeA], ['big stope', cave.stopeB], ['dead end', cave.deadEnd], ['deep stope', cave.deep]] : [['hall', cave.hall], ['beach', cave.beach], ['pocket', cave.pocket]];
    const line = ['seed ' + String(seed).padStart(4), kind].concat(places.map(q2 => q2[0] + ' ' + at(q2[1])), ['way out ' + at(cave.exitAt), 'finds ' + cave.finds.length + ' ' + all(cave.finds.map(f => ({ x: f.x, y: f.y + 10 }))), 'ores ' + cave.ores.length + ' ' + all(cave.ores.filter(o => !o.block)), 'veins ' + cave.veins.map(v => v.left).join(''), 'way through off the floor ' + off, 'floor cells ' + cells]);
    if (kind === 'mine') { line.push('timber sets ' + cave.sets.length, 'posts ' + cave.posts.length, 'fire-settings ' + cave.soot.length, 'stones of the fall ' + cave.ores.filter(o => o.block).length); const b0 = cave.ores.filter(o => o.block); if (cave.veins.length < 5 || cave.sets.length < 5 || b0.length !== 2 || cave.finds.length < 4) bad++; }
    else { line.push('under water ' + Math.round(wet / cells * 100) + '%', 'stands ' + cave.props.length, 'the way in is water ' + (Cave.sAt(cave, cave.entrance.x, cave.entrance.y) > 0 ? 'yes' : 'NO'), 'the pocket is dry ' + (Cave.sAt(cave, cave.pocket.x, cave.pocket.y) < 0 ? 'yes' : 'NO'), 'the chest is dry ' + (Cave.sAt(cave, cave.finds[0].x, cave.finds[0].y) < 0 ? 'yes' : 'NO')); if (cave.finds.length < 3) bad++; }
    if (line.join(' ').includes('NO') || off) bad++;
    console.log(line.join('  '));
  });
  console.log(bad ? bad + ' SEEDS WITH A FAULT (' + kind + ')' : 'every seed: all of the ' + (kind === 'mine' ? 'mine' : 'sea cave') + ' can be walked to');
});
