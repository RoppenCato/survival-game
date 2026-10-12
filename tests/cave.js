// The cave (src/cave.js): laid out for a run of seeds, and for each whether every part can be walked to from the way in
// (a flood over the floor from where you come in), what stands in it, and how far it is from light to light along the way
// through. No assertions, like the other tests: read the lines. A NO, or a count of 0 where there should be things, is a fault.
global.__mk = (w, h) => require('../node_modules/@napi-rs/canvas').createCanvas(w, h);
const Cave = require('../src/cave.js');
const seeds = process.argv[2] ? [+process.argv[2]] : [11, 1, 2, 3, 5, 7, 12, 25, 42, 77, 100, 2024];
let faults = 0;
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
