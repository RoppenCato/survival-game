// Breaking in, bringing down, burning and mending (src/ruin.js), with no page. No assertions, like the other tests: read the
// lines. A line that begins "!!" is a fault.
//   the table    every kind of piece under an iron axe and an iron pick: blows until it gives (2.6 a blow, the tool's own power)
//   a house      a 3 by 2 house: how many of its walls must give before the roof comes down; what is left; mending and raising it
//   doors        a locked door gives and stands open; an open one is nothing to strike
//   ways         a way through a wall there was none through before, once it has given (src/nav.js on the same building)
//   fire         what catches and what does not; how long a house takes; sparks downwind and upwind (300 fires each)
global.__mk = (w, h) => require('../node_modules/@napi-rs/canvas').createCanvas(w, h);
const Ruin = require('../src/ruin.js'), Build = require('../src/build.js'), Nav = require('../src/nav.js');
const R = Ruin.cfg({}), key = Build.key, POW = 2.6;
let faults = 0; const bad = s => { faults++; console.log('!! ' + s); };
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---- the table
console.log('What breaks what (an iron tool, ' + POW + ' a blow; about two blows a second in play, every third a heavy one):');
const PIECES = [['wattle fence', { t: 'fence', m: 2 }], ['rail fence', { t: 'rail', m: 1 }], ['wattle wall', { t: 'wall', m: 2 }], ['window in planks', { t: 'window', m: 1 }], ['locked door', { t: 'door', m: 1, locked: 1 }], ['church door', { t: 'door', m: 6, locked: 1 }], ['barred gate', { t: 'gate', m: 0, locked: 1 }],
  ['timber frame', { t: 'wall', m: 5 }], ['plank wall', { t: 'wall', m: 1 }], ['turf wall', { t: 'wall', m: 4 }], ['dry-stone wall', { t: 'drystone', m: 3 }], ['palisade', { t: 'palisade', m: 0 }], ['log wall', { t: 'wall', m: 0 }], ['stone wall', { t: 'wall', m: 3 }], ['cut stone', { t: 'wall', m: 6 }], ['town wall', { t: 'townwall', m: 6 }]];
function blows(e0, tool) { const e = JSON.parse(JSON.stringify(e0)); let n = 0, r; while (n < 2000) { r = Ruin.hit(R, e, POW, tool); if (!r) return null; n++; if (r.none) return r.never ? 'never' : 'nothing'; if (r.gave) return n; } return 'not in 2000'; }
const tab = {};
function ramBlows(e0) { const e = JSON.parse(JSON.stringify(e0)); let n = 0, r; while (n < 2000) { r = Ruin.hit(R, e, 3.2, 'ram'); if (!r) return null; n++; if (r.none) return 'nothing'; if (r.gave) return n; } return 'never'; }   // (the hird's ram at the game's RAM.power 3.2 a swing)
PIECES.forEach(([name, e]) => { const a = blows(e, 'axe'), p = blows(e, 'pick'), rm = ramBlows(e); tab[name] = [a, p, rm]; console.log('  ' + name.padEnd(18) + 'axe ' + String(a).padStart(8) + '   pick ' + String(p).padStart(8) + '   ram ' + String(rm).padStart(6) + '   heard ' + String(R.noise[Ruin.matOf(e)]).padStart(4) + ' units off'); });
if (tab['stone wall'][0] !== 'nothing') bad('an axe takes a stone wall');
if (typeof tab['stone wall'][1] !== 'number') bad('a pick does not take a stone wall');
if (tab['cut stone'][0] !== 'never' || tab['cut stone'][1] !== 'never' || tab['town wall'][1] !== 'never') bad('a hand tool takes dressed stone');
if (!(typeof tab['cut stone'][2] === 'number' && tab['cut stone'][2] <= 60) || !(typeof tab['town wall'][2] === 'number' && tab['town wall'][2] <= 120) || !(tab['gate'] ? tab['gate'][2] <= 8 : true)) bad('the ram does not take dressed stone in its time (cut stone within 60 swings, the town wall within 120)');
if (!(tab['wattle wall'][0] < tab['plank wall'][0] && tab['plank wall'][0] < tab['log wall'][0])) bad('wood is not in order: wattle, planks, logs');
if (!(tab['plank wall'][0] < tab['plank wall'][1])) bad('the pick is as good as the axe on planks');
if (!(tab['turf wall'][1] < tab['turf wall'][0])) bad('the axe is as good as the pick on turf');

// ---- a house
function house(ox, oy, m, roof, w, h, lock) {
  const B = { floors: {}, H: {}, V: {}, posts: {}, stairs: {}, roofs: {}, items: [] };
  for (let y = oy; y < oy + h; y++) for (let x = ox; x < ox + w; x++) B.floors[key(x, y)] = 0;
  for (let x = ox; x < ox + w; x++) { B.H[key(x, oy)] = { t: 'wall', m }; B.H[key(x, oy + h)] = x === ox + 1 ? { t: 'door', m, locked: lock ? 1 : 0 } : { t: 'wall', m }; }
  for (let y = oy; y < oy + h; y++) { B.V[key(ox, y)] = { t: 'wall', m }; B.V[key(ox + w, y)] = { t: 'wall', m }; }
  const ri = Build.rooms(B, 80, 80, { x0: 0, y0: 0, x1: 80, y1: 80 }); if (ri.rooms[0]) B.roofs[ri.rooms[0].id] = roof;
  return { B, ri, room: ri.rooms[0] };
}
(function () {
  const H = house(5, 5, 1, 1, 3, 2), B = H.B, E = Ruin.edgesOf(B, H.room).filter(q => q.e.t === 'wall'); let n = 0, fell = 0;
  console.log('A plank house, 3 by 2 under thatch: ' + Ruin.strain(R, B, H.room).n + ' pieces of wall round it; its roof falls when ' + Math.round(R.collapse * 100) + '% have given');
  for (const q of E) { Ruin.give(q.e); n++; if (Ruin.due(R, B, H.room, 1)) { fell = n; break; } }
  console.log('  it is due after ' + fell + ' have given (' + Ruin.strain(R, B, H.room).share.toFixed(2) + ')');
  if (fell < 3 || fell > 5) bad('the roof of a ten-piece house falls after ' + fell + ' pieces');
  const solids0 = H.ri.solids.length, ri2 = Build.rooms(B, 80, 80, { x0: 0, y0: 0, x1: 80, y1: 80 });
  console.log('  still a room: ' + (ri2.rooms.length === 1 ? 'yes' : 'NO') + '; its wall solids ' + solids0 + ' before, ' + ri2.solids.length + ' with ' + fell + ' given (three a piece)');
  if (ri2.rooms.length !== 1) bad('a breached house is no longer a room'); if (solids0 - ri2.solids.length !== fell * 3) bad('a breach left its solids standing');
  Ruin.collapse(R, B, H.room, 'fallen', 1); const tiles = Object.keys(B.ruin).length;
  console.log('  down: ' + tiles + ' tiles of debris, the roof it had: ' + Ruin.ROOFN[B.ruin[key(5, 5)].m] + ', its roof now: ' + Ruin.ROOFN[B.roofs[H.room.id]] + '; can it be raised at once: ' + (Ruin.canRaise(R, B, H.room) ? 'YES' : 'no, its walls first'));
  if (tiles !== 6 || B.roofs[H.room.id] !== 5 || Ruin.canRaise(R, B, H.room)) bad('the fall is not as it should be');
  let cost = 0; E.forEach(q => { if (Ruin.damaged(q.e)) { cost += Ruin.mendShare(R, q.e) * R.mend; Ruin.mend(q.e); } });
  const ok = Ruin.canRaise(R, B, H.room) && Ruin.raise(B, H.room);
  console.log('  mended: ' + fell + ' pieces for ' + cost.toFixed(1) + ' times the price of one; raised again: ' + (ok ? 'yes' : 'NO') + ', under ' + Ruin.ROOFN[B.roofs[H.room.id]] + ', debris left: ' + Object.keys(B.ruin).length);
  if (!ok || B.roofs[H.room.id] !== 1 || Object.keys(B.ruin).length) bad('raising the roof again');
  const e = { t: 'wall', m: 1 }; for (let i = 0; i < 8; i++) Ruin.hit(R, e, POW, 'axe');
  console.log('  a plank wall struck eight times: stage ' + e.st + ' (1 hacked, 2 nearly through), mending it is ' + (Ruin.mendShare(R, e) * R.mend).toFixed(2) + ' of its price');
  // a timber frame: its panels count half
  const F = house(5, 5, 5, 3, 3, 2), EF = Ruin.edgesOf(F.B, F.room).filter(q => q.e.t === 'wall'); let nf = 0; for (const q of EF) { Ruin.give(q.e); nf++; if (Ruin.due(R, F.B, F.room, 3)) break; }
  console.log('A timber-frame house of the same size: due after ' + nf + ' panels (a broken panel counts ' + R.frameCounts + ': the frame still carries)');
  if (nf <= fell) bad('a timber frame falls as soon as planks');
})();

// ---- doors
(function () {
  const d = { t: 'door', m: 1, locked: 1 }, open = { t: 'door', m: 1 }; let n = 0, r;
  while ((r = Ruin.hit(R, d, POW, 'axe')) && !r.gave && n < 99) n++;
  console.log('Doors: a locked door gives after ' + (n + 1) + ' blows and then is ' + (d.broken && !d.locked && !d.breach ? 'open for good' : 'WRONG ' + JSON.stringify(d)) + '; an open door struck: ' + (Ruin.hit(R, open, POW, 'axe') === null ? 'nothing there to strike' : 'TAKES BLOWS') + '; way through a locked one: ' + Ruin.passable({ t: 'door', m: 1, locked: 1 }) + ', a broken one: ' + Ruin.passable(d));
  if (!d.broken || d.locked || Ruin.hit(R, open, POW, 'axe') !== null || Ruin.passable({ t: 'door', m: 1, locked: 1 }) || !Ruin.passable(d)) bad('doors');
})();

// ---- ways: a closed store, a man outside, a place inside
(function () {
  const H = house(10, 10, 1, 1, 3, 2, true), B = H.B, T = 32;
  const g = Nav.make({ x0: 4, y0: 4, w: 16, h: 14, T, open: () => true, edge: Nav.edgeOf(B) });
  const from = [8.5 * T, 10.5 * T], to = [11.5 * T, 10.5 * T], p0 = g.path(from[0], from[1], to[0], to[1], false);
  B.V[key(10, 10)].breach = 1; g.read(); const p1 = g.path(from[0], from[1], to[0], to[1], false);
  console.log('Ways: into a locked store from outside, before: ' + (p0 && !p0.short ? 'A WAY' : 'none') + '; with its west wall given: ' + (p1 && !p1.short ? 'a way of ' + p1.length + ' steps' : 'NONE') + '; the gap is ' + (g.edgeAt('V', 10, 10) === 3 ? 'narrow (one at a time)' : 'kind ' + g.edgeAt('V', 10, 10)) + '; a straight line through it is ' + (g.blocked(from[0], from[1], to[0], to[1], false) ? 'BLOCKED' : 'clear'));
  if ((p0 && !p0.short) || !p1 || p1.short || g.blocked(from[0], from[1], to[0], to[1], false)) bad('the way through a breach');
})();

// ---- fire
(function () {
  const names = ['logs', 'planks', 'wattle', 'stone', 'turf', 'timber frame', 'cut stone'];
  console.log('Fire: walls that burn: ' + names.filter((n, m) => Ruin.burnsWall(R, { t: 'wall', m })).join(', ') + '; that do not: ' + names.filter((n, m) => !Ruin.burnsWall(R, { t: 'wall', m })).join(', '));
  console.log('      roofs that burn: ' + Ruin.ROOFN.filter(n => R.fire.roof[n].burn > 0).map(n => n + ' (' + R.fire.roof[n].burn + ' s' + (R.fire.roof[n].catch < 1 ? ', catches ' + R.fire.roof[n].catch : '') + ')').join(', ') + '; that do not: ' + Ruin.ROOFN.filter(n => !(R.fire.roof[n].burn > 0)).join(', '));
  if (Ruin.burnsWall(R, { t: 'wall', m: 3 }) || Ruin.burnsWall(R, { t: 'wall', m: 6 }) || R.fire.roof.tiles.burn || R.fire.roof.slate.burn) bad('stone or tiles burn');
  // one house, lit at its door: when the roof catches, when it falls, how many walls go
  function burnOne(m, roof, seed) {
    const H = house(10, 10, m, roof, 3, 2), B = H.B, rand = rng(seed), env = { rooms: H.ri.rooms, at: H.ri.at, wind: null, rand, roofDefault: 1 };
    Ruin.ignite(R, B, 'H', key(11, 12)); let t = 0, roofAt = null, fellAt = null;
    while (t < 400 && Ruin.alight(B)) { const ev = Ruin.fireTick(R, B, 0.25, env); t += 0.25; if (roofAt == null && B.fire['R:' + H.room.id]) roofAt = t; if (ev.fell.length) fellAt = t; }
    const E = Ruin.edgesOf(B, H.room); return { roofAt, fellAt, out: t, gone: E.filter(q => q.e.breach).length, of: E.length, down: Ruin.ruined(B, H.room) || Ruin.due(R, B, H.room, 1) };
  }
  function avg(m, roof) { const a = { roofAt: 0, fellAt: 0, out: 0, gone: 0, down: 0, n: 0, lit: 0, of: 0 }; for (let s = 1; s <= 60; s++) { const r = burnOne(m, roof, s * 7919); a.n++; if (r.roofAt != null) { a.lit++; a.roofAt += r.roofAt; } if (r.fellAt != null) a.fellAt += r.fellAt; a.out += r.out; a.gone += r.gone; a.of = r.of; if (r.down) a.down++; } return a; }
  [[2, 1, 'wattle under thatch'], [1, 2, 'planks under shingles'], [0, 0, 'logs under turf'], [5, 3, 'timber frame under tiles'], [3, 1, 'stone under thatch']].forEach(([m, roof, name]) => {
    const a = avg(m, roof);
    console.log('      ' + name.padEnd(26) + 'roof alight ' + (a.lit ? 'after ' + (a.roofAt / a.lit).toFixed(0) + ' s (' + a.lit + '/60)' : 'never') + ', the house down in ' + a.down + '/60, out after ' + (a.out / a.n).toFixed(0) + ' s, ' + (a.gone / a.n).toFixed(1) + ' of ' + a.of + ' pieces burnt through');
    if (name.indexOf('wattle') === 0 && a.down < 55) bad('a thatched wattle house mostly survives a fire'); if (name.indexOf('timber') === 0 && a.lit) bad('a tile roof caught');
  });
  // the bucket brigade (raid step 5, 2026-10-21): the same thatched wattle house lit at its door, and from 8 s on a bucket poured every 2, 4 or 8 s
  // (three villagers' rounds from the well, one's, a slow one's: Ruin.douse) on the roof first, then the wall nearest to burning through.
  // Against the unfought house above, the house with three on it should mostly stand.
  function fought(seed, every) {
    const H = house(10, 10, 2, 1, 3, 2), B = H.B, rand = rng(seed), env = { rooms: H.ri.rooms, at: H.ri.at, wind: null, rand, roofDefault: 1 };
    Ruin.ignite(R, B, 'H', key(11, 12)); let t = 0, next = 8, buckets = 0;
    while (t < 400 && Ruin.alight(B)) { Ruin.fireTick(R, B, 0.25, env); t += 0.25; if (t >= next) { next += every; const fs = Ruin.fires(B, env).sort((p, q) => (q.roof ? 1 : 0) - (p.roof ? 1 : 0) || (p.roof ? B.fire[p.key].t - B.fire[q.key].t : B.fire[q.key].t - B.fire[p.key].t)); if (fs.length) { Ruin.douse(R, B, fs[0].key); buckets++; } } }   // (the roof first, then the wall nearest to burning through)
    const E = Ruin.edgesOf(B, H.room); return { out: t, buckets, gone: E.filter(q => q.e.breach).length, down: Ruin.ruined(B, H.room) || Ruin.due(R, B, H.room, 1) };
  }
  [2, 4, 8].forEach(every => { const a = { out: 0, buckets: 0, gone: 0, down: 0, n: 0 }; for (let s = 1; s <= 60; s++) { const r = fought(s * 7919, every); a.n++; a.out += r.out; a.buckets += r.buckets; a.gone += r.gone; if (r.down) a.down++; }
    console.log('      the wattle house fought with a bucket every ' + every + ' s from 8 s: out after ' + (a.out / a.n).toFixed(0) + ' s with ' + (a.buckets / a.n).toFixed(1) + ' buckets, the house down in ' + a.down + '/60, ' + (a.gone / a.n).toFixed(1) + ' pieces burnt through');
    if (every === 2 && a.down > 12) bad('a thatched wattle house fought with a bucket every 4 s mostly burns down anyway'); });
  // sparks: two thatched houses of stone, the second downwind, upwind, across, and with no wind; a tile's gap between them, and three
  function spread(gap, windA, k, seed) {
    const B = { floors: {}, H: {}, V: {}, posts: {}, stairs: {}, roofs: {}, items: [] };
    [[10, 10], [13 + gap, 10]].forEach(([ox, oy]) => { for (let x = ox; x < ox + 3; x++) { B.H[key(x, oy)] = { t: 'wall', m: 3 }; B.H[key(x, oy + 2)] = { t: 'wall', m: 3 }; } for (let y = oy; y < oy + 2; y++) { B.V[key(ox, y)] = { t: 'wall', m: 3 }; B.V[key(ox + 3, y)] = { t: 'wall', m: 3 }; } });
    const ri = Build.rooms(B, 80, 80, { x0: 0, y0: 0, x1: 80, y1: 80 }); ri.rooms.forEach(r => { B.roofs[r.id] = 1; });
    const a = ri.rooms[ri.at(10, 10)], b = ri.rooms[ri.at(13 + gap, 10)], env = { rooms: ri.rooms, at: ri.at, wind: k ? { a: windA, k } : null, rand: rng(seed), roofDefault: 1 };
    Ruin.ignite(R, B, 'R', null, a, null, 1); let t = 0; while (t < 200 && Ruin.alight(B)) { Ruin.fireTick(R, B, 0.25, env); t += 0.25; }
    return Ruin.ruined(B, b);
  }
  const N = 300, sh = (gap, wa, k) => { let n = 0; for (let s = 1; s <= N; s++) if (spread(gap, wa, k, s * 104729)) n++; return Math.round(n / N * 100); };
  [1, 2, 3, 5].forEach(gap => {
    const down = sh(gap, 0, 0.5), up = sh(gap, Math.PI, 0.5), calm = sh(gap, 0, 0), across = sh(gap, Math.PI / 2, 0.5);
    console.log('      sparks from one thatched roof to another ' + gap + ' tile' + (gap > 1 ? 's' : '') + ' off (' + N + ' fires each): downwind ' + down + '%, no wind ' + calm + '%, across the wind ' + across + '%, upwind ' + up + '%');
    if (!(down >= calm && calm >= up)) bad('the wind does not carry the fire'); if (gap === 1 && down < 50) bad('a thatched roof a tile downwind mostly does not catch'); if (gap === 5 && calm > 0) bad('a fire jumps five tiles with no wind');
  });
  console.log('      a fire of 1, 6 and 20 pieces is noticed ' + [1, 6, 20].map(n => Math.min(R.fire.loudMax, R.fire.loud + R.fire.louder * n)).join(', ') + ' units off');
})();
console.log(faults ? '!! ' + faults + ' FAULTS' : 'ruin: no faults');
