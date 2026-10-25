// Fishing (2026-10-08): the minigame played by bots. Checks what bites where (every fish shows up in its water, the chest about
// 3% of deep bites and never in the shallows), the round's phases (a press during the nibble does nothing, a missed bite
// brings the same fish back, a press in the window hooks it), and the fight since 2026-10-25 (Robin: easy and relaxing, guided
// with W and S): a bot that keeps the band on the fish lands nearly all, a bot that does nothing loses most, a sloppy one lands
// more with the iron-hooked rod's wider band. Prints values; bad = 0 holds.
const Fishing = require('../src/fishing.js');
let bad = 0;
function check(label, ok, v) { console.log((ok ? 'ok   ' : 'BAD  ') + label + (v !== undefined ? ': ' + v : '')); if (!ok) bad++; }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function counts(depth, lowland, n, seed) { const R = rng(seed), c = {}; for (let i = 0; i < n; i++) { const f = Fishing.roll(R, depth, lowland); c[f.id] = (c[f.id] || 0) + 1; } return c; }
const shallow = counts(0.6, false, 3000, 3), deep = counts(6, false, 3000, 5), low = counts(0.8, true, 3000, 7);
console.log('shallow sea', JSON.stringify(shallow)); console.log('deep sea', JSON.stringify(deep)); console.log('lowland shallows', JSON.stringify(low));
check('no chest in the shallows', !shallow.chest);
check('a chest about 3% of deep bites', deep.chest > 40 && deep.chest < 140, deep.chest + ' of 3000');
check('perch is a shallow fish', shallow.perch > deep.perch * 2, shallow.perch + ' vs ' + deep.perch);
check('cod and salmon are deep fish', deep.cod > shallow.cod * 2 && deep.salmon > shallow.salmon * 2, deep.cod + '/' + shallow.cod + ', ' + deep.salmon + '/' + shallow.salmon);
check('pike lives in the lowland shallows', low.pike > 300 && (shallow.pike || 0) < 100, low.pike + ' vs ' + (shallow.pike || 0));
check('herring is everywhere', shallow.herring > 500 && deep.herring > 500 && low.herring > 300);
check('salmon is rare', deep.salmon < deep.cod && deep.salmon > 50, deep.salmon);
// weights
let wok = true; for (let i = 0; i < 500; i++) { const f = Fishing.roll(rng(100 + i), 3, true); const r = Fishing.FISH[f.id].kg; if (f.kg < r[0] - 0.05 || f.kg > r[1] + 0.05) wok = false; }
check('every weight within its fish\'s range', wok);
// the phases
let st = Fishing.start(rng(11), 4, false), ev = null, t = 0;
while (ev !== 'nibble' && t < 20) { ev = Fishing.tick(st, 1 / 60, null); t += 1 / 60; }
check('a nibble comes within 3 to 9 seconds', ev === 'nibble' && t > 2.9 && t < 9.2, t.toFixed(1) + 's');
check('a press during the nibble does nothing (it scared the fish: too hard, 2026-10-25)', Fishing.press(st) === null && st.phase === 'nibble');
let taps = 0; while (st.phase === 'nibble') { if (Fishing.tick(st, 1 / 60, null) === 'tap') taps++; }
check('the nibble taps the float a few times', taps >= 2, taps);
st = Fishing.start(rng(12), 4, false); ev = null; t = 0;
while (ev !== 'bite' && t < 30) { ev = Fishing.tick(st, 1 / 60, null); t += 1 / 60; }
check('a bite follows the nibble', ev === 'bite');
const fishBefore = st.fish.id; let t2 = 0; while (st.phase === 'bite' && t2 < 3) { ev = Fishing.tick(st, 1 / 60, null); t2 += 1 / 60; }
check('an unanswered bite is missed after a window of 1.3 to 1.5 s, and the same fish comes back', ev === 'missed' && t2 > 1.25 && t2 < 1.55 && st.phase === 'wait' && st.fish.id === fishBefore && st.until <= 5, t2.toFixed(2) + 's');
st = Fishing.start(rng(13), 4, false); ev = null; while (ev !== 'bite') ev = Fishing.tick(st, 1 / 60, null);
check('a press in the window hooks it', Fishing.press(st) === 'hooked' && st.phase === 'fight' && st.prog > 0);
// the fight, by bots that move the band with W and S
function play(fishId, bot, seed, zone) {
  const R = rng(seed), st = Fishing.start(R, 4, true, { zone: zone }); st.fish = (function () { let f; do { f = Fishing.roll(R, 5, true); } while (f.id !== fishId); return f; })();
  let ev = null, time = 0; while (ev !== 'bite' && time < 40) { ev = Fishing.tick(st, 1 / 60, null); time += 1 / 60; }
  Fishing.press(st); let frames = 0, mem = [];
  while (st.phase === 'fight' && frames < 60 * 120) { Fishing.tick(st, 1 / 60, bot(st, mem)); frames++; }
  return { phase: st.phase, secs: frames / 60 };
}
const keeper = st => { const g = st.fy - st.zy; return { up: g > 0.03, down: g < -0.03 }; };
const lazy = () => ({ up: false, down: false });
const sloppy = (st, mem) => { mem.push(st.fy); const seen = mem.length > 24 ? mem[mem.length - 24] : 0.5, g = seen - st.zy; return { up: g > st.zoneH / 2, down: g < -st.zoneH / 2 }; };   /* (sees the fish 0.4 s late and moves only once it is out of the band) */
const ids = ['herring', 'perch', 'cod', 'pike', 'salmon', 'chest'], times = {};
ids.forEach(id => {
  let land = 0, secs = 0, ll = 0; for (let i = 0; i < 40; i++) { const r = play(id, keeper, 200 + i); if (r.phase === 'landed') { land++; secs += r.secs; } if (play(id, lazy, 300 + i).phase === 'landed') ll++; }
  times[id] = secs / Math.max(1, land);
  console.log(id + ': the keeper lands ' + land + '/40 in ' + times[id].toFixed(1) + 's, doing nothing lands ' + ll + '/40');
  check(id + ': keeping the band on it lands nearly all', land >= 38, land);
  if (id === 'herring') check('herring, the easiest: doing nothing lands it about half the time at most (relaxing, 2026-10-25)', ll <= 24, ll); else check(id + ': doing nothing loses most', ll <= 16, ll);
  if (id === 'chest') check('the chest never runs', Fishing.FISH.chest.runs === 0);
});
check('a salmon takes longer than a herring, both short (2 to 10 s)', times.salmon > times.herring && times.herring > 2 && times.salmon < 10, times.herring.toFixed(1) + 's vs ' + times.salmon.toFixed(1) + 's');
{ let h = 0, w = 0; for (let i = 0; i < 60; i++) { if (play('pike', sloppy, 700 + i, 0.34).phase === 'landed') h++; if (play('pike', sloppy, 700 + i, 0.4).phase === 'landed') w++; }
  check('the iron-hooked rod\'s wider band lands more pike for a sloppy hand than the hazel rod\'s', w > h, w + ' vs ' + h + ' of 60'); }
// a lake (2026-10-24): its own fish, no herring or cod, no sunken chest
{ const R = rng(77), got = {}; for (let i = 0; i < 400; i++) { const f = Fishing.roll(R, 4, false, true); got[f.id] = (got[f.id] || 0) + 1; }
  check('a lake gives perch, pike and now and then a salmon, never herring, cod or a chest', !got.herring && !got.cod && !got.chest && got.perch > got.pike && got.salmon > 0, JSON.stringify(got)); }
console.log('bad = ' + bad);
