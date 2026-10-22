// The ship line (docs/ships-rework.md, 2026-10-22; it was the yard's hulls laid part by part until then): every size of the
// three models fitted by designParts (its seats, the rig on a ship with a mast, the stem's head by the look, the shields), the
// fit (seats, rowers, the mast amidships, where you stand), the hulls at true size, what opens each model (by material age),
// the costs (the karve from home's materials: no iron), the look and the fittings as data, and the sailing: a wind behind is
// faster, a wind ahead costs nothing, rowers add speed by the size's own share and only up to its seats. Prints values; bad = 0
// means all held. (The crossing times, the beach and the rocks are tests/ships.js.)
const { createCanvas } = require('@napi-rs/canvas'); global.__mk = (w, h) => createCanvas(w, h);
const Yard = require('../src/yard.js');
let bad = 0;
function check(label, ok, v) { console.log((ok ? 'ok   ' : 'BAD  ') + label + (v !== undefined ? ': ' + v : '')); if (!ok) bad++; }
const SIZES = []; Yard.MODELS.forEach(m => m.sizes.forEach(z => SIZES.push(z)));
function vessel(kind, look) { const v = { kind, parts: Yard.designParts(kind, look || { head: 'dragon' }), look: look || Yard.lookDefault(), x: 0, y: 0, h: 0, vx: 0, vy: 0 }; Yard.fit(v); return v; }
// the models and their sizes
check('three models: the rowboat, the karve, the longship', Yard.MODELS.map(m => m.id).join(',') === 'rowboat,karve,longship');
check('the rowboat one size, the karve and the longship three each', Yard.MODELS.map(m => m.sizes.length).join(',') === '1,3,3');
check('opened by Arnor\'s teaching, by copper, by iron bars (material age)', Yard.MODELS.map(m => m.key).join(',') === 'raft,copper,ironBar');
check('an older save\'s raft, faering and boat are rowboats', ['raft', 'faering', 'boat'].every(k => Yard.modelOf(k) === 'rowboat'));
// every size fitted out
SIZES.forEach(kind => {
  const H = Yard.HULLS[kind], v = vessel(kind), rig = Yard.rigged(kind);
  const ok = v.seats.length === H.thwarts[1] && v.rowers === H.thwarts[1] * (H.per || 2) && v.sail === rig && v.rudder === rig && v.shields === rig && v.dragon === rig;
  check(kind + ' (' + H.name + ' ' + H.size + '): ' + v.seats.length + ' seats, ' + v.rowers + ' rowers' + (rig ? ', the mast at ' + v.mastX.toFixed(0) + ', the sail, the steering oar, the dragon, the shields' : ', no rig'), ok);
  if (rig) check(kind + ': the mast amidships (within a fifth of the hull) and you at the stern alone', Math.abs(v.mastX) <= v.hw * 0.2 && v.seat < -v.hw * 0.5, v.mastX.toFixed(0) + ' of ' + v.hw.toFixed(0) + ', you at ' + v.seat.toFixed(0));
});
const curl = vessel('karve', Object.assign(Yard.lookDefault(), { head: 'curl' }));
check('a curl on the stem is no dragon part', !curl.dragon && curl.sail);
// the hulls at true size: each within an eighth of its metres, its beam as given, the seats a metre and a bit apart, two men a thwart clear of each other
SIZES.forEach(kind => {
  const H = Yard.HULLS[kind], pr = Yard.profileOf({ kind, parts: [] }), len = pr.L * 2 / Yard.U, beam = pr.Wmax * 2 / Yard.U, v = vessel(kind);
  let pitch = 1e9; for (let i = 1; i < v.seats.length; i++) pitch = Math.min(pitch, v.seats[i] - v.seats[i - 1]);
  const wmin = Math.min(...v.seats.map(x => Yard.profW(pr, x, 1)));
  check(kind + ': ' + len.toFixed(1) + ' m long (' + (pr.L * 2 / 39).toFixed(1) + ' heroes), ' + beam.toFixed(1) + ' m beam' + (v.seats.length > 1 ? ', the pitch ' + pitch.toFixed(0) + ' (at least 20)' : '') + (H.per > 1 ? ', two abreast ' + (2 * Math.max(7, wmin - 13)).toFixed(0) + ' apart (at least 14)' : ''),
    Math.abs(len - H.m) < H.m * 0.125 && Math.abs(beam - H.beam) < 0.2 && (v.seats.length < 2 || pitch >= 20) && (H.per === 1 || 2 * Math.max(7, wmin - 13) >= 14));
});
// what they cost: a longer size dearer; the karve from home's materials (the ship that leaves home: no iron); the longship iron
const cost = k => Object.values(Yard.HULLS[k].cost).reduce((a, b) => a + b, 0);
check('a longer size costs more', cost('karve4') < cost('karve8') && cost('karve8') < cost('karve') && cost('longship16') < cost('longship20') && cost('longship20') < cost('longship'), ['karve4', 'karve8', 'karve', 'longship16', 'longship20', 'longship'].map(cost).join(' < '));
check('no karve needs iron, every longship does', ['karve4', 'karve8', 'karve'].every(k => !Yard.HULLS[k].cost.ironBar) && ['longship16', 'longship20', 'longship'].every(k => Yard.HULLS[k].cost.ironBar > 0));
check('the rowboat is wood and fibre', Object.keys(Yard.HULLS.rowboat.cost).sort().join(',') === 'fiber,wood');
// the look and the fittings as data
const L = Yard.lookDefault();
check('the default look takes the first of each palette, a curl on the stem', L.sailA === Yard.LOOK.sail[0] && L.tar === Yard.LOOK.tar[0] && L.trim === Yard.LOOK.trim[0] && L.head === 'curl');
check('four patterns, four heads, three fittings', Yard.LOOK.pattern.length === 4 && Yard.LOOK.head.length === 4 && Object.keys(Yard.FITTINGS).join(',') === 'raider,cargo,voyager');
// the sailing
function run(kind, wind, crew, secs) {
  const b = { kind, x: 0, y: 0, h: 0, vx: 0, vy: 0, speed: 0, sail: Yard.rigged(kind), crew, rowers: Yard.HULLS[kind].thwarts[1] * (Yard.HULLS[kind].per || 2) };
  for (let t = 0; t < secs; t += 1 / 60) Yard.sail(b, { ix: 0, iy: -1 }, 1 / 60, () => true, Yard.HANDLING[kind], wind);
  return Math.hypot(b.vx, b.vy);
}
const H = Yard.HANDLING.karve, calm = run('karve', { a: 0, k: 0 }, 0, 20), behind = run('karve', { a: 0, k: 0.5 }, 0, 20), ahead = run('karve', { a: Math.PI, k: 0.5 }, 0, 20), rowed = run('karve', { a: 0, k: 0 }, 12, 20), over = run('karve', { a: 0, k: 0 }, 20, 20);
check('calm: the top speed', Math.abs(calm - H.top) < 1, calm.toFixed(1));
check('wind behind: half again as fast', Math.abs(behind - H.top * 1.5) < 1.5, behind.toFixed(1));
check('wind ahead: no slower', Math.abs(ahead - H.top) < 1, ahead.toFixed(1));
check('twelve rowers: 72% faster (0.06 each)', Math.abs(rowed - H.top * 1.72) < 1.5, rowed.toFixed(1));
check('more rowers than seats add nothing', Math.abs(over - rowed) < 0.5, over.toFixed(1));
const lrow = run('longship', { a: 0, k: 0 }, 26, 30), LH = Yard.HANDLING.longship; check('a longship\'s twenty-six rowers: 78% faster (0.03 each)', Math.abs(lrow - LH.top * 1.78) < 2, lrow.toFixed(1));
const rb = run('rowboat', { a: 0, k: 0.5 }, 0, 20); check('the rowboat has no sail: the wind does nothing', Math.abs(rb - Yard.HANDLING.rowboat.top) < 1, rb.toFixed(1));
// every size drawn, whole and split, with every look's head and pattern
const cv = createCanvas(400, 300), c = cv.getContext('2d'); let threw = null;
try { SIZES.forEach((kind, k) => { const look = Object.assign(Yard.lookDefault(), { head: Yard.LOOK.head[k % 4][0], pattern: Yard.LOOK.pattern[k % 4][0] }), v = vessel(kind, look); Object.assign(v, { x: 200, y: 200, h: 0.5, vx: 20, crew: 4, sailFill: 0.8, sailSet: 1, aboard: true }); Yard.drawVessel(c, v, 1); Yard.drawVessel(c, v, 1, { split: true }); Yard.drawRigOf(c, v, 1); Yard.drawVesselFront(c, v, 1, 150); }); } catch (e) { threw = e; }
check('drawing every size throws nothing', !threw, threw && threw.message);
console.log('bad = ' + bad);
