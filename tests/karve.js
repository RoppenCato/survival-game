// The karve (2026-10-08): the first ship, laid in the yard. Checks the plan's rules (keel of five to nine, a mast amidships, a sail on it,
// a steering oar at the stern, two seats), the fit (seats, mast, the stern seat), and the sailing: the wind behind is faster, the wind
// ahead costs nothing, rowers add speed up to the seats, and the boat's physics are unchanged. Prints values; bad = 0 means all held.
const { createCanvas } = require('@napi-rs/canvas'); global.__mk = (w, h) => createCanvas(w, h);
const Yard = require('../src/yard.js');
let bad = 0;
function check(label, ok, v) { console.log((ok ? 'ok   ' : 'BAD  ') + label + (v !== undefined ? ': ' + v : '')); if (!ok) bad++; }
function why(cells) { return Yard.scene.check.call({ yard: { plan: 'karve', cells } }); }
const keel = n => Array.from({ length: n }, (_, i) => ({ id: 'keel', i, j: 2 }));
let y = keel(4); check('four keel pieces is too short', /five/.test(why(y)), why(y));
y = keel(7); check('no seats yet', /seats/.test(why(y)), why(y));
y.push({ id: 'thwart', i: 1, j: 2 }, { id: 'thwart', i: 5, j: 2 }); check('no mast yet', /mast/.test(why(y)), why(y));
y.push({ id: 'mast', i: 0, j: 2 }); check('a mast at the end is refused', /amidships/.test(why(y)), why(y));
y.pop(); y.push({ id: 'mast', i: 3, j: 2 }); check('no sail yet', /sail/.test(why(y)), why(y));
y.push({ id: 'sail', i: 1, j: 2 }); check('a sail off the mast is refused', /on the mast/.test(why(y)), why(y));
y.pop(); y.push({ id: 'sail', i: 3, j: 2 }); check('no steering oar yet', /steering oar/.test(why(y)), why(y));
y.push({ id: 'rudder', i: 6, j: 2 }); check('a steering oar at the bow is refused', /stern/.test(why(y)), why(y));
y.pop(); y.push({ id: 'rudder', i: 0, j: 2 }); check('the karve is sound', why(y) === '', JSON.stringify(why(y)));
check('the karve parts cost iron, not copper', Yard.partsFor('karve').every(p => !p.cost.copper) && Yard.partsFor('karve')[0].cost.ironBar === 1, JSON.stringify(Yard.partsFor('karve').map(p => p.cost)));
check('the boat parts still cost copper', Yard.partsFor('boat')[0].cost.copper === 1);
const v = { kind: 'karve', parts: y, x: 0, y: 0, h: 0, vx: 0, vy: 0 }; Yard.fit(v);
check('two seats, four rowers', v.seats.length === 2 && v.rowers === 4, v.seats.join(',') + ' / ' + v.rowers);
check('the mast is amidships', Math.abs(v.mastX) < 1, v.mastX);
check('you stand at the stern', v.seat < -v.hw * 0.5, v.seat + ' of ' + v.hw);
check('the sail is set', v.sail === true);
function run(kind, wind, crew, secs) {
  const b = { kind, parts: y, x: 0, y: 0, h: 0, vx: 0, vy: 0, speed: 0, sail: kind === 'karve', crew, rowers: 4 };
  for (let t = 0; t < secs; t += 1 / 60) Yard.sail(b, { ix: 0, iy: -1 }, 1 / 60, () => true, Yard.HANDLING[kind], wind);
  return Math.hypot(b.vx, b.vy);
}
const H = Yard.HANDLING.karve, calm = run('karve', { a: 0, k: 0 }, 0, 20), behind = run('karve', { a: 0, k: 0.5 }, 0, 20), ahead = run('karve', { a: Math.PI, k: 0.5 }, 0, 20), rowed = run('karve', { a: 0, k: 0 }, 4, 20), over = run('karve', { a: 0, k: 0 }, 9, 20);
check('calm: the top speed', Math.abs(calm - H.top) < 1, calm.toFixed(1));
check('wind behind: faster', Math.abs(behind - H.top * 1.5) < 1.5, behind.toFixed(1));
check('wind ahead: no slower', Math.abs(ahead - H.top) < 1, ahead.toFixed(1));
check('four rowers: 28% faster', Math.abs(rowed - H.top * 1.28) < 1.5, rowed.toFixed(1));
check('more rowers than seats add nothing', Math.abs(over - rowed) < 0.5, over.toFixed(1));
const boat = run('boat', { a: 0, k: 0.5 }, 0, 20); check('the boat has no sail: the wind does nothing', Math.abs(boat - Yard.HANDLING.boat.top) < 1, boat.toFixed(1));
const cv = createCanvas(400, 300), c = cv.getContext('2d'); let threw = null;
try { v.sailFill = 0.8; v.crew = 4; Yard.drawVessel(c, v, 1); Yard.drawVesselFront(c, v, 1, 0); v.sailFill = 0; Yard.drawVessel(c, v, 2); Yard.partsFor('karve').forEach((pt, k) => Yard.drawPart(c, pt, 10 + k * 40, 200, 1)); } catch (e) { threw = e; }
check('drawing throws nothing', !threw, threw && threw.message);
console.log('bad = ' + bad);
