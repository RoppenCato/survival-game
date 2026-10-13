// The hulls (2026-10-13: the vessels are designs chosen in the yard and fitted out, docs/boats.md): every hull's checks (seats
// between its min and max, the mast on its cell, the sail on the mast, the steering oar at the stern, one stem, one row of
// shields), the fit (seats, rowers, the mast amidships, where you stand), and the sailing: a wind behind is faster, a wind
// ahead costs nothing, rowers add speed by the hull's own share and only up to its seats, and the raft is as it was. Prints
// values; bad = 0 means all held.
const { createCanvas } = require('@napi-rs/canvas'); global.__mk = (w, h) => createCanvas(w, h);
const Yard = require('../src/yard.js');
let bad = 0;
function check(label, ok, v) { console.log((ok ? 'ok   ' : 'BAD  ') + label + (v !== undefined ? ': ' + v : '')); if (!ok) bad++; }
const KJ = Yard.KJ, why = (plan, cells) => Yard.check({ plan, cells });
const seat = i => ({ id: 'thwart', i, j: KJ });
// the karve: the rules one by one
let y = []; check('karve: no seats yet', /seats/.test(why('karve', y)), why('karve', y));
y.push(seat(2)); check('karve: one seat is too few', /two at least/.test(why('karve', y)), why('karve', y));
y.push(seat(7)); check('karve: no mast yet', /mast/.test(why('karve', y)), why('karve', y));
y.push({ id: 'mast', i: 5, j: KJ }); check('karve: no sail yet', /sail/.test(why('karve', y)), why('karve', y));
y.push({ id: 'sail', i: 2, j: KJ }); check('karve: a sail off the mast is refused', /on the mast/.test(why('karve', y)), why('karve', y));
y.pop(); y.push({ id: 'sail', i: 5, j: KJ }); check('karve: no steering oar yet', /steering oar/.test(why('karve', y)), why('karve', y));
y.push({ id: 'rudder', i: 1, j: KJ }); check('karve: the karve is sound', why('karve', y) === '', JSON.stringify(why('karve', y)));
y.push(seat(3), seat(4), seat(6), seat(8)); check('karve: six seats are the most', why('karve', y) === '', JSON.stringify(why('karve', y)));
y.push(seat(9)); check('karve: a seventh seat is refused', /No room/.test(why('karve', y)), why('karve', y)); y.pop();
y.push({ id: 'dragon', i: 9, j: KJ }, { id: 'dragon', i: 9, j: KJ - 1 }); check('karve: two stems are refused', /One stem/.test(why('karve', y)), why('karve', y)); y.pop();
y.push({ id: 'shields', i: 4, j: KJ }); check('karve: a stem and shields are fine', why('karve', y) === '');
// where the yard lets a part go (the scene's target, with a free host)
const host = { canAfford: () => true, costText: () => 'free' }, sc = Object.create(Yard.scene); sc.host = host; sc.yard = { plan: 'karve', cells: [] }; sc.setPlan('karve'); sc.pick = Yard.partsFor('karve').findIndex(p => p.id === 'mast');
const T = 32, mw = (i, j) => ({ x: sc.Y.X + (i + 0.5) * T, y: sc.Y.Y + (j + 0.5) * T });
check('the yard is as long as the karve and two', sc.Y.W === 11, sc.Y.W);
check('a mast off its cell is refused', !sc.target(mw(3, KJ)).ok && /amidships/.test(sc.target(mw(3, KJ)).why), sc.target(mw(3, KJ)).why);
check('a mast on its cell is allowed', sc.target(mw(5, KJ)).ok);
sc.pick = Yard.partsFor('karve').findIndex(p => p.id === 'thwart');
check('a seat on a strake cell is allowed (the hull is the design\'s)', sc.target(mw(4, KJ - 1)).ok, sc.target(mw(4, KJ - 1)).why);
check('a seat off the hull is refused', !sc.target(mw(4, 0)).ok, sc.target(mw(4, 0)).why);
check('a seat on the mast\'s cell is refused', !sc.target(mw(5, KJ)).ok, sc.target(mw(5, KJ)).why);
sc.pick = Yard.partsFor('karve').findIndex(p => p.id === 'rudder'); check('the steering oar at the bow is refused', /stern/.test(sc.target(mw(9, KJ)).why), sc.target(mw(9, KJ)).why);
sc.pick = Yard.partsFor('karve').findIndex(p => p.id === 'dragon'); check('the stem at the stern is refused', /bow/.test(sc.target(mw(1, KJ)).why), sc.target(mw(1, KJ)).why);
const poor = Object.create(sc); poor.host = { canAfford: () => false, costText: () => '24 wood, 8 iron bars' }; poor.yard = { plan: 'karve', cells: y.slice() };
check('a hull you cannot pay for is not sound', /costs/.test(poor.check()), poor.check());
// the other hulls
check('faering: one seat is enough, no mast', why('faering', [seat(2)]) === '', why('faering', [seat(2)]));
check('faering: three seats are too many', /No room/.test(why('faering', [seat(1), seat(2), seat(3)])));
check('boat: a seat at least', /seat/.test(why('boat', [])), why('boat', []));
const ls = [seat(2), seat(3), seat(4), seat(5), { id: 'mast', i: 8, j: KJ }, { id: 'sail', i: 8, j: KJ }, { id: 'rudder', i: 1, j: KJ }];
check('longship: four seats, the rig: sound', why('longship', ls) === '', JSON.stringify(why('longship', ls)));
check('longship: three seats are too few', /four at least/.test(why('longship', ls.slice(1))), why('longship', ls.slice(1)));
check('the raft is as it was', /three logs/.test(why('raft', [])), why('raft', []));
check('the tiers: raft 1, faering and boat 2, karve and longship 3', Yard.PLAN_TIER.raft === 1 && Yard.PLAN_TIER.faering === 2 && Yard.PLAN_TIER.boat === 2 && Yard.PLAN_TIER.karve === 3 && Yard.PLAN_TIER.longship === 3);
check('the karve\'s parts cost iron, not copper', Yard.partsFor('karve').every(p => !p.cost.copper));
check('the boat\'s stem costs copper', Yard.partsFor('boat').filter(p => p.id === 'dragon')[0].cost.copper === 1);
// the fit
const v = { kind: 'karve', parts: y, x: 0, y: 0, h: 0, vx: 0, vy: 0 }; Yard.fit(v);
check('six seats, twelve rowers', v.seats.length === 6 && v.rowers === 12, v.seats.map(q => q.toFixed(0)).join(',') + ' / ' + v.rowers);
check('the mast is amidships', Math.abs(v.mastX) < 1, v.mastX);
check('you stand at the stern', v.seat < -v.hw * 0.5, v.seat + ' of ' + v.hw);
check('the sail is set, the steering oar bound, the stem carved, the shields hung', v.sail === true && v.rudder === true && v.dragon === true && v.shields === true);
const lv = { kind: 'longship', parts: ls, x: 0, y: 0, h: 0, vx: 0, vy: 0 }; Yard.fit(lv);
check('a longship is about eleven heroes long', lv.hw * 2 > 400 && lv.hw * 2 < 480, (lv.hw * 2).toFixed(0) + ' units');
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
