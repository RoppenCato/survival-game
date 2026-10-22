// The ships (docs/ships-plan.md, 2026-10-21): the hulls at true size, the crew's places (the helmsman forward at the steering
// oar, the rowers from the stern two a thwart facing aft, clear of each other), the hero's place (alone at the oars, with a
// crew in the bow), the stroke (a pull then a recovery, one phase for the ship), the gangway (the hull's point nearest the
// land) and the landing spots (spread along the shore, every one free). Prints values; bad = 0 means all held.
const { createCanvas } = require('@napi-rs/canvas'); global.__mk = (w, h) => createCanvas(w, h);
const Yard = require('../src/yard.js');
let bad = 0;
function check(label, ok, v) { console.log((ok ? 'ok   ' : 'BAD  ') + label + (v !== undefined ? ': ' + v : '')); if (!ok) bad++; }
const KJ = Yard.KJ, seat = i => ({ id: 'thwart', i, j: KJ });
function fitted(id) { const H = Yard.HULLS[id], parts = []; for (let i = 2; i <= H.n - 1 && parts.length < H.thwarts[1]; i++) if (i !== H.mast) parts.push(seat(i)); if (H.mast) parts.push({ id: 'mast', i: H.mast, j: KJ }, { id: 'sail', i: H.mast, j: KJ }, { id: 'rudder', i: 1, j: KJ }); const v = { kind: id, parts, x: 1000, y: 1000, h: 0, vx: 0, vy: 0, speed: 0 }; Yard.fit(v); return v; }
// the sizes
Yard.HULL_IDS.forEach(id => { const H = Yard.HULLS[id], v = fitted(id); console.log('     ' + H.name + ': ' + (v.hw * 2 / Yard.U).toFixed(1) + ' m by ' + (v.hh * 2 / Yard.U).toFixed(1) + ' m, ' + (v.hw * 2 / 39).toFixed(1) + ' heroes long, ' + v.seats.length + ' thwarts, ' + v.rowers + ' rowers' + (H.rudder ? ' and a helmsman' : '') + ', the yard at zoom ' + H.zoom + ', the sea at ' + H.sea); });
// the places
const kv = fitted('karve'), pl = Yard.crewPlaces(kv, 13);
check('a karve with thirteen aboard: a helmsman and twelve rowers', pl.length === 13 && pl[0].kind === 'helm' && pl.slice(1).every(q => q.kind === 'row'), pl.map(q => q.kind[0]).join(''));
check('the helmsman at the stern on the right-hand side, facing forward', pl[0].x < -kv.hw * 0.5 && pl[0].y > 0 && pl[0].face === 0, pl[0].x.toFixed(0) + ',' + pl[0].y.toFixed(0));
check('every rower faces aft', pl.slice(1).every(q => Math.abs(q.face - Math.PI) < 1e-9));
check('the rowers fill from the stern, the right-hand side first', pl[1].x === kv.seats[0] && pl[1].y > 0 && pl[2].x === kv.seats[0] && pl[2].y < 0 && pl[3].x === kv.seats[1]);
let minGap = 1e9; for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) minGap = Math.min(minGap, Math.hypot(pl[i].x - pl[j].x, pl[i].y - pl[j].y));
check('no two men within 14 units of each other', minGap >= 14, minGap.toFixed(1));
const pl2 = Yard.crewPlaces(kv, 15), fl = pl2.filter(q => q.kind === 'floor');
check('two more than the seats take sit on the floor, in the stern and the bow', fl.length === 2 && fl[0].x < 0 && fl[1].x > 0, fl.map(q => q.x.toFixed(0)).join(','));
const pl3 = Yard.crewPlaces(kv, 2, 1); check('a lying man gets a floor place after the seated', pl3.length === 3 && pl3[2].kind === 'floor');
const fa = fitted('faering'), pf = Yard.crewPlaces(fa, 2);
check('the faering: one man a thwart, in the middle, no helmsman', pf.length === 2 && pf.every(q => q.kind === 'row' && q.y === 0 && q.side === 0), JSON.stringify(pf.map(q => q.x.toFixed(0))));
const bo = fitted('boat'), pb = Yard.crewPlaces(bo, 6);
check('the boat: two a thwart, at least 14 apart', pb.length === 6 && Math.abs(pb[0].y - pb[1].y) >= 14, Math.abs(pb[0].y - pb[1].y).toFixed(1));
// the hero's place
check('alone in the boat: on the aft-most thwart', Yard.heroSeat(Object.assign({}, bo, { crew: 0 })) === bo.seats[0], Yard.heroSeat(Object.assign({}, bo, { crew: 0 })));
check('alone on the karve: at the steering oar', Yard.heroSeat(Object.assign({}, kv, { crew: 0 })) < -kv.hw * 0.5);
check('with a crew: in the bow', Yard.heroSeat(Object.assign({}, kv, { crew: 3 })) > kv.hw * 0.6 && Yard.heroSeat(Object.assign({}, bo, { crew: 1 })) > bo.hw * 0.6);
// the stroke
const sv = Object.assign({}, kv, { crew: 13, helm: true, rowers: 12, sail: true, sailFill: 0 });
let pulls = 0, lastWet = false, lean0 = null, leanMax = -9, leanMin = 9;
for (let t = 0; t < 6; t += 1 / 60) { Yard.sail(sv, { ix: 0, iy: -1 }, 1 / 60, () => true, Yard.HANDLING.karve, { a: Math.PI, k: 0.5 }); const L = Yard.strokeLean(sv); leanMax = Math.max(leanMax, L); leanMin = Math.min(leanMin, L); }
check('twelve rowers against the wind: the ship rows (v.rowing) and the stroke runs', sv.rowing === true && sv.stroke > 6, (sv.stroke || 0).toFixed(1));
check('the rowers lean fore and aft with the stroke', leanMax > 4 && leanMin < -3, leanMin.toFixed(1) + ' to ' + leanMax.toFixed(1));
const sv2 = Object.assign({}, kv, { crew: 13, helm: true, rowers: 12, sail: true, sailFill: 0 });
for (let t = 0; t < 8; t += 1 / 60) Yard.sail(sv2, { ix: 0, iy: -1 }, 1 / 60, () => true, Yard.HANDLING.karve, { a: 0, k: 0.5 });
check('with the wind behind and the sail full the oars are shipped', sv2.rowing === false && sv2.sailFill > 0.6, sv2.sailFill.toFixed(2));
const sv3 = Object.assign({}, kv, { crew: 13, helm: true, rowers: 12 }), sv4 = Object.assign({}, kv, { crew: 12, helm: false, rowers: 12 });
for (let t = 0; t < 20; t += 1 / 60) { Yard.sail(sv3, { ix: 0, iy: -1 }, 1 / 60, () => true, Yard.HANDLING.karve, null); Yard.sail(sv4, { ix: 0, iy: -1 }, 1 / 60, () => true, Yard.HANDLING.karve, null); }
check('the helmsman does not row: thirteen with a helmsman go as twelve without', Math.abs(Math.hypot(sv3.vx, sv3.vy) - Math.hypot(sv4.vx, sv4.vy)) < 0.5, Math.hypot(sv3.vx, sv3.vy).toFixed(1));
// the gangway: a straight shore south of the ship (land where y > 1000 + 70), the ship heading east
const land = (x, y) => y > 1070;
const g = Yard.gangway(kv, land);
check('the gangway is on the land side of the hull, within reach', !!g && g.y > kv.y && g.ny > 0.9 && g.d <= 30, g && (g.d + ' off, land point ' + g.lx.toFixed(0) + ',' + g.ly.toFixed(0)));
check('the land point is on the land', !!g && land(g.lx, g.ly));
const kv2 = Object.assign({}, kv, { h: Math.PI / 2, _gang: null }), g2 = Yard.gangway(kv2, (x, y) => y > 1000 + kv.hw + 20);   // heading south, the shore ahead: the bow is the gangway
check('a ship bows-on to the shore boards over the bow', !!g2 && g2.y > kv2.y + kv2.hw * 0.9, g2 && g2.d);
check('no land within reach: no gangway', Yard.gangway(Object.assign({}, kv, { _gang: null }), () => false) === null);
// the landing spots
const taken = [[1030, 1090]], free = (x, y) => y > 1080 && !taken.some(q => Math.hypot(q[0] - x, q[1] - y) < 12);
const sp = Yard.landingSpots(1000, 1080, 0, 1, 12, free);
let spMin = 1e9; for (let i = 0; i < sp.length; i++) for (let j = i + 1; j < sp.length; j++) spMin = Math.min(spMin, Math.hypot(sp[i].x - sp[j].x, sp[i].y - sp[j].y));
check('twelve landing spots, all free, none within 10 of another', sp.length === 12 && sp.every(q => free(q.x, q.y)) && spMin >= 10, spMin.toFixed(1));
check('the spots spread along the shore both ways', sp.some(q => q.x < 950) && sp.some(q => q.x > 1050), Math.min(...sp.map(q => q.x)).toFixed(0) + ' to ' + Math.max(...sp.map(q => q.x)).toFixed(0));
// the drawing
const cv = createCanvas(600, 400), c = cv.getContext('2d'); let threw = null;
try { const v = Object.assign({}, kv, { crew: 13, helm: true, aboard: true, rowing: true, stroke: 1 }); Yard.drawVessel(c, v, 1, { split: true }); Yard.drawRigOf(c, v, 1); Yard.drawVesselFront(c, v, 1, [{ x: v.x, y: v.y }]); Yard.drawOars(c, v, 1, Yard.crewPlaces(v, 13).filter(q => q.kind === 'row').concat([{ x: 0, y: 0, side: 0 }])); Yard.drawVessel(c, v, 1); } catch (e) { threw = e; }
check('the split drawing (hull, rig, near rail, oars) and the whole one throw nothing', !threw, threw && threw.message);
// the sailing (docs/ships-rework.md, 2026-10-22): the crossing to the big island (about 7700 to 9700 units shore to shore) in about
// 90 s in the rowboat, a karve with a crew about half that; the turn from a standstill and under way; the wind a clear bonus; the
// beach run up and backed off; a rock wall slid along, never stuck
function run(kind, crew, opts) {
  opts = opts || {}; const H = Object.assign({}, Yard.HANDLING[kind]), v = { x: 0, y: 0, h: opts.h || 0, speed: 0, vx: 0, vy: 0, kind, crew, sail: Yard.rigged(kind), fit: opts.fit || null }, dt = 1 / 60;
  const free = opts.free || (() => true), wind = opts.wind || null; let t = 0;
  while (t < (opts.T || 400)) { Yard.sail(v, opts.inp ? opts.inp(t, v) : { ix: 0, iy: -1 }, dt, free, H, wind, opts.beach); t += dt; if (opts.until && opts.until(v, t)) break; }
  return { v, t };
}
const D = 8700;   // the crossing, the middle of the two measures
[['rowboat', 0], ['karve', 0], ['karve', 4], ['karve', 8], ['karve', 12], ['longship', 16], ['longship', 26]].forEach(([k, n]) => {
  const r = run(k, n, { until: v => v.x >= D, T: 600 });
  console.log('     ' + (k + ' with ' + n + ' at the oars').padEnd(30) + Math.round(r.t) + ' s for ' + D + ' units, top ' + Math.round(r.v.speed));
});
const rb = run('rowboat', 0, { until: v => v.x >= D, T: 600 });
check('the rowboat crosses in about 90 s', rb.t > 75 && rb.t < 110, Math.round(rb.t) + ' s');
const kc = run('karve', 8, { until: v => v.x >= D, T: 600 });
check('a karve with eight at the oars about half that or less', kc.t < rb.t * 0.65, Math.round(kc.t) + ' s');
// the turn from a standstill: a little, and more with the way on
const still = run('rowboat', 0, { inp: () => ({ ix: 1, iy: 0 }), T: 2 }), under = run('rowboat', 0, { inp: t => ({ ix: t > 3 ? 1 : 0, iy: -1 }), T: 4 });
check('the rowboat turns a little from a standstill', still.v.h > 0.6, (still.v.h / 2).toFixed(2) + ' rad a second');
check('and more with the way on', under.v.h > still.v.h / 2 * 1.5, under.v.h.toFixed(2) + ' rad a second');
// the wind, from four sides: behind, abeam, close-hauled, ahead
const wk = { k: 0.5 };
const wind = [0, Math.PI / 2, Math.PI * 0.72, Math.PI].map(d => { const r = run('karve', 0, { wind: { a: d, k: 0.5 }, T: 30 }); return Math.round(r.v.speed); });
console.log('     the karve alone under sail, the wind behind, abeam, close-hauled, ahead: ' + wind.join(', '));
check('the wind behind best, abeam nearly as good, ahead nothing', wind[0] > wind[1] && wind[1] > wind[2] && wind[2] >= wind[3] && wind[1] > wind[3] * 1.2, wind.join(' > '));
// the beach: a shore of sand at x > 400 (the bow may run up onto it); rock beyond x > 460
const sand = (x, y, h) => { const bx = x + Math.cos(h) * 17; return bx < 400 && x < 400; }, beachFn = (x, y, h) => { const bx = x + Math.cos(h) * 17; return x < 400 && bx >= 400 && bx < 440; };
const br = run('rowboat', 0, { free: sand, beach: beachFn, T: 12 });
check('the rowboat runs up the beach and stops there', br.v.beached === 1 && Math.abs(br.v.speed) < 1 && br.v.x > 385, 'x ' + br.v.x.toFixed(0) + ', speed ' + br.v.speed.toFixed(1) + ', beached ' + br.v.beached);
const back = (() => { const v = br.v, H = Yard.HANDLING.rowboat; let t = 0; while (t < 4) { Yard.sail(v, { ix: 0, iy: 1 }, 1 / 60, sand, H, null, beachFn); t += 1 / 60; } return v; })();
check('and S backs her off into the water', !back.beached && back.x < 380, 'x ' + back.x.toFixed(0));
// a rock wall at an angle: she slides along it, never stuck
const wv = { x: 0, y: -80, h: 0.6, speed: 0, vx: 0, vy: 0, kind: 'rowboat', crew: 0 }, wf = (x, y) => y < x * 0.3 - 40, H2 = Yard.HANDLING.rowboat; let moved = 0, lastX = 0;
for (let t = 0; t < 20; t += 1 / 60) { Yard.sail(wv, { ix: 0, iy: -1 }, 1 / 60, wf, H2, null); }
check('against a slanting rock wall she slides along it', wv.x > 300 && wf(wv.x, wv.y), 'x ' + wv.x.toFixed(0) + ' y ' + wv.y.toFixed(0));
// the fittings (docs/ships-rework.md step 8, the numbers mine): a Raider faster under oars, a Cargo a little slower and holding twice,
// a Voyager more from the wind
const top = (fit, o) => Math.round(run('karve', 8, Object.assign({ fit, T: 40 }, o || {})).v.speed);
const fo = { none: top(null), raider: top('raider'), cargo: top('cargo'), voyager: top('voyager') };
console.log('     a karve with eight at the oars, top speed: none ' + fo.none + ', Raider ' + fo.raider + ', Cargo ' + fo.cargo + ', Voyager ' + fo.voyager);
check('a Raider is faster under oars, a Cargo a little slower', fo.raider > fo.none * 1.05 && fo.cargo < fo.none && fo.cargo > fo.none * 0.9, fo.raider + ' > ' + fo.none + ' > ' + fo.cargo);
const wb = { wind: { a: 0, k: 0.5 } }, fw = { none: top(null, wb), voyager: top('voyager', wb) };
check('a Voyager gets half again more from the wind behind', fw.voyager > fw.none * 1.08, 'none ' + fw.none + ', Voyager ' + fw.voyager);
const hold = k => Yard.holdOf({ kind: k }), holdC = k => Yard.holdOf({ kind: k, fit: 'cargo' });
console.log('     heavy things aboard (chests, sacks), plain and with a Cargo hold: ' + ['rowboat', 'karve4', 'karve8', 'karve', 'longship16', 'longship20', 'longship'].map(k => k + ' ' + hold(k) + '/' + holdC(k)).join(', '));
check('a Cargo hold takes twice the heavy things and its sea chest twice the places', holdC('karve') === 2 * hold('karve') && Yard.chestK({ kind: 'karve', fit: 'cargo' }) === 2 && Yard.chestK({ kind: 'karve' }) === 1);
check('a Raider has its men on and off in half the time, its shields stop arrows; a Voyager feeds its crew', Yard.FITTINGS.raider.boardK === 0.5 && Yard.FITTINGS.raider.shieldsStop && Yard.FITTINGS.voyager.fed);
console.log('bad = ' + bad);
