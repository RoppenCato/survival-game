// The hulls (2026-10-13: the vessels are designs chosen in the yard and fitted out, docs/boats.md): every hull's checks (seats
// between its min and max, the mast on its cell, the sail on the mast, the steering oar at the stern, one stem, one row of
// shields), the fit (seats, rowers, the mast amidships, where you stand), and the sailing: a wind behind is faster, a wind
// ahead costs nothing, rowers add speed by the hull's own share and only up to its seats, and the raft is as it was. Prints
// values; bad = 0 means all held.
const { createCanvas } = require('@napi-rs/canvas'); global.__mk = (w, h) => createCanvas(w, h);
const Yard = require('../src/yard.js');
let bad = 0;
function check(label, ok, v) { console.log((ok ? 'ok   ' : 'BAD  ') + label + (v !== undefined ? ': ' + v : '')); if (!ok) bad++; }
const KJ = Yard.KJ, why = (plan, cells) => Yard.check({ plan, cells }), KM = Yard.HULLS.karve.mast, KN = Yard.HULLS.karve.n, LM = Yard.HULLS.longship.mast, LN = Yard.HULLS.longship.n;   // (the cells by the hull's own numbers: the hulls are at true size since 2026-10-21)
const seat = i => ({ id: 'thwart', i, j: KJ });
// the karve: the rules one by one
let y = []; check('karve: no seats yet', /seats/.test(why('karve', y)), why('karve', y));
y.push(seat(2)); check('karve: one seat is too few', /two at least/.test(why('karve', y)), why('karve', y));
y.push(seat(9)); check('karve: no mast yet', /mast/.test(why('karve', y)), why('karve', y));
y.push({ id: 'mast', i: KM, j: KJ }); check('karve: no sail yet', /sail/.test(why('karve', y)), why('karve', y));
y.push({ id: 'sail', i: 2, j: KJ }); check('karve: a sail off the mast is refused', /on the mast/.test(why('karve', y)), why('karve', y));
y.pop(); y.push({ id: 'sail', i: KM, j: KJ }); check('karve: no steering oar yet', /steering oar/.test(why('karve', y)), why('karve', y));
y.push({ id: 'rudder', i: 1, j: KJ }); check('karve: the karve is sound', why('karve', y) === '', JSON.stringify(why('karve', y)));
y.push(seat(4), seat(5), seat(10), seat(12)); check('karve: six seats are the most', why('karve', y) === '', JSON.stringify(why('karve', y)));
y.push(seat(13)); check('karve: a seventh seat is refused', /No room/.test(why('karve', y)), why('karve', y)); y.pop();
y.push({ id: 'dragon', i: KN, j: KJ }, { id: 'dragon', i: KN, j: KJ - 1 }); check('karve: two stems are refused', /One stem/.test(why('karve', y)), why('karve', y)); y.pop();
y.push({ id: 'shields', i: 4, j: KJ }); check('karve: a stem and shields are fine', why('karve', y) === '');
// where the yard lets a part go (the scene's target, with a free host)
const host = { canAfford: () => true, costText: () => 'free' }, sc = Object.create(Yard.scene); sc.host = host; sc.yard = { plan: 'karve', cells: [] }; sc.setPlan('karve'); sc.pick = Yard.partsFor('karve').findIndex(p => p.id === 'mast');
const T = 32, mw = (i, j) => ({ x: sc.Y.X + (i + 0.5) * T, y: sc.Y.Y + (j + 0.5) * T });
check('the yard is as long as the karve and two', sc.Y.W === KN + 2, sc.Y.W);
check('a mast off its cell is refused', !sc.target(mw(3, KJ)).ok && /amidships/.test(sc.target(mw(3, KJ)).why), sc.target(mw(3, KJ)).why);
check('a mast on its cell is allowed', sc.target(mw(KM, KJ)).ok);
sc.pick = Yard.partsFor('karve').findIndex(p => p.id === 'thwart');
check('a seat on a strake cell is allowed (the hull is the design\'s)', sc.target(mw(4, KJ - 1)).ok, sc.target(mw(4, KJ - 1)).why);
check('a seat off the hull is refused', !sc.target(mw(4, 0)).ok, sc.target(mw(4, 0)).why);
check('a seat on the mast\'s cell is refused', !sc.target(mw(KM, KJ)).ok, sc.target(mw(KM, KJ)).why);
sc.pick = Yard.partsFor('karve').findIndex(p => p.id === 'rudder'); check('the steering oar at the bow is refused', /stern/.test(sc.target(mw(KN, KJ)).why), sc.target(mw(KN, KJ)).why);
sc.pick = Yard.partsFor('karve').findIndex(p => p.id === 'dragon'); check('the stem at the stern is refused', /bow/.test(sc.target(mw(1, KJ)).why), sc.target(mw(1, KJ)).why);
const poor = Object.create(sc); poor.host = { canAfford: () => false, costText: () => '24 wood, 10 copper, 12 fibre' }; poor.yard = { plan: 'karve', cells: y.slice() };
check('a hull you cannot pay for is not sound', /costs/.test(poor.check()), poor.check());
// the other hulls
check('faering: one seat is enough, no mast', why('faering', [seat(2)]) === '', why('faering', [seat(2)]));
check('faering: three seats are too many', /No room/.test(why('faering', [seat(1), seat(2), seat(3)])));
check('boat: a seat at least', /seat/.test(why('boat', [])), why('boat', []));
const ls = [seat(2), seat(3), seat(4), seat(5), { id: 'mast', i: LM, j: KJ }, { id: 'sail', i: LM, j: KJ }, { id: 'rudder', i: 1, j: KJ }];
check('longship: four seats, the rig: sound', why('longship', ls) === '', JSON.stringify(why('longship', ls)));
check('longship: three seats are too few', /four at least/.test(why('longship', ls.slice(1))), why('longship', ls.slice(1)));
check('the raft is as it was', /three logs/.test(why('raft', [])), why('raft', []));
check('the tiers: raft 1, faering and boat 2, karve and longship 3', Yard.PLAN_TIER.raft === 1 && Yard.PLAN_TIER.faering === 2 && Yard.PLAN_TIER.boat === 2 && Yard.PLAN_TIER.karve === 3 && Yard.PLAN_TIER.longship === 3);
check('the karve\'s parts cost no iron (the copper-age ship, 2026-10-20)', Yard.partsFor('karve').every(p => !p.cost.ironBar) && Yard.HULLS.karve.cost.copper === 10 && !Yard.HULLS.karve.cost.ironBar);
check('the boat\'s stem costs copper', Yard.partsFor('boat').filter(p => p.id === 'dragon')[0].cost.copper === 1);
// the fit
const v = { kind: 'karve', parts: y, x: 0, y: 0, h: 0, vx: 0, vy: 0 }; Yard.fit(v);
check('six seats, twelve rowers', v.seats.length === 6 && v.rowers === 12, v.seats.map(q => q.toFixed(0)).join(',') + ' / ' + v.rowers);
check('the mast is amidships (within half a cell)', Math.abs(v.mastX) <= Yard.CW / 2 + 0.01, v.mastX);
check('you stand at the stern', v.seat < -v.hw * 0.5, v.seat + ' of ' + v.hw);
check('the sail is set, the steering oar bound, the stem carved, the shields hung', v.sail === true && v.rudder === true && v.dragon === true && v.shields === true);
const lv = { kind: 'longship', parts: ls, x: 0, y: 0, h: 0, vx: 0, vy: 0 }; Yard.fit(lv);
check('a longship is about thirteen heroes long (23 m)', lv.hw * 2 > 500 && lv.hw * 2 < 545, (lv.hw * 2).toFixed(0) + ' units');
// the hulls at true size (docs/ships-plan.md, 2026-10-21): each within a tenth of its metres, its beam as dug up, the thwarts a metre and a bit apart, two men a thwart clear of each other
Yard.HULL_IDS.forEach(id => {
  const H = Yard.HULLS[id], pr = Yard.profileOf({ kind: id, parts: [] }), len = pr.L * 2 / Yard.U, beam = pr.Wmax * 2 / Yard.U;
  check(id + ': ' + len.toFixed(1) + ' m long (' + (pr.L * 2 / 39).toFixed(1) + ' heroes), ' + beam.toFixed(1) + ' m beam', Math.abs(len - H.m) < H.m * 0.12 && Math.abs(beam - H.beam) < 0.2);
  const parts = []; for (let i = 2; i <= H.n - 1 && parts.length < H.thwarts[1]; i++) if (i !== H.mast) parts.push(seat(i));
  const vv = { kind: id, parts, x: 0, y: 0, h: 0, vx: 0, vy: 0 }; Yard.fit(vv); let pitch = 1e9; for (let i = 1; i < vv.seats.length; i++) pitch = Math.min(pitch, vv.seats[i] - vv.seats[i - 1]);
  const wmin = Math.min(...vv.seats.map(x => Yard.profW ? Yard.profW(pr, x, 1) : pr.Wmax));
  check(id + ': ' + vv.seats.length + ' seats, ' + vv.rowers + ' rowers, the pitch ' + pitch.toFixed(0) + ' (at least 20)' + (H.per > 1 ? ', two abreast ' + (2 * Math.max(7, wmin - 13)).toFixed(0) + ' apart (at least 14)' : ''), pitch >= 20 && (H.per === 1 || 2 * Math.max(7, wmin - 13) >= 14));
});
const old = { kind: 'boat', parts: [{ id: 'keel', i: 0, j: 3 }, { id: 'keel', i: 1, j: 3 }, { id: 'strake', i: 1, j: 2 }, { id: 'thwart', i: 1, j: 3 }], x: 0, y: 0, h: 0, vx: 0, vy: 0 }; Yard.fit(old);
check('a boat saved with its strakes still fits (the design\'s hull, its seat kept)', old.seats.length === 1 && old.hw > 50, old.hw.toFixed(0));
// the sailing
function run(kind, wind, crew, secs, parts) {
  const b = { kind, parts: parts || y, x: 0, y: 0, h: 0, vx: 0, vy: 0, speed: 0, sail: Yard.rigged(kind), crew, rowers: kind === 'karve' ? 12 : kind === 'longship' ? 8 : 2 };
  for (let t = 0; t < secs; t += 1 / 60) Yard.sail(b, { ix: 0, iy: -1 }, 1 / 60, () => true, Yard.HANDLING[kind], wind);
  return Math.hypot(b.vx, b.vy);
}
const H = Yard.HANDLING.karve, calm = run('karve', { a: 0, k: 0 }, 0, 20), behind = run('karve', { a: 0, k: 0.5 }, 0, 20), ahead = run('karve', { a: Math.PI, k: 0.5 }, 0, 20), rowed = run('karve', { a: 0, k: 0 }, 12, 20), over = run('karve', { a: 0, k: 0 }, 20, 20);
check('calm: the top speed', Math.abs(calm - H.top) < 1, calm.toFixed(1));
check('wind behind: half again as fast', Math.abs(behind - H.top * 1.5) < 1.5, behind.toFixed(1));
check('wind ahead: no slower', Math.abs(ahead - H.top) < 1, ahead.toFixed(1));
check('twelve rowers: 60% faster (0.05 each)', Math.abs(rowed - H.top * 1.6) < 1.5, rowed.toFixed(1));
check('more rowers than seats add nothing', Math.abs(over - rowed) < 0.5, over.toFixed(1));
const lrow = run('longship', { a: 0, k: 0 }, 8, 20, ls), LH = Yard.HANDLING.longship; check('a longship\'s eight rowers: 24% faster (0.03 each)', Math.abs(lrow - LH.top * 1.24) < 1.5, lrow.toFixed(1));
const boat = run('boat', { a: 0, k: 0.5 }, 0, 20, [seat(2)]); check('the boat has no sail: the wind does nothing', Math.abs(boat - Yard.HANDLING.boat.top) < 1, boat.toFixed(1));
const cv = createCanvas(400, 300), c = cv.getContext('2d'); let threw = null;
try { Yard.HULL_IDS.forEach(id => { const vv = { kind: id, parts: id === 'longship' ? ls : y, x: 200, y: 200, h: 0.5, vx: 20, vy: 0, crew: 4, sailFill: 0.8, aboard: true }; Yard.fit(vv); Yard.drawVessel(c, vv, 1); Yard.drawVesselFront(c, vv, 1, 150); }); Yard.partsFor('longship').forEach((pt, k) => Yard.drawPart(c, pt, 10 + k * 40, 200, 1)); } catch (e) { threw = e; }
check('drawing every hull throws nothing', !threw, threw && threw.message);
console.log('bad = ' + bad);
