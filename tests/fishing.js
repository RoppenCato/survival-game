// Fishing (2026-10-08): the minigame played by bots. Checks what bites where (every fish shows up in its water, the chest about
// 3% of deep bites and never in the shallows), the round's phases (a press during the nibble scares the fish, a missed bite
// loses it, a press in the window hooks it), and the fight: a careful bot that rests the line during runs lands nearly all, a
// greedy bot that never lets go snaps on the strong fish, a bot that never reels lands nothing. Prints values; bad = 0 holds.
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
while (ev !== 'nibble' && t < 20) { ev = Fishing.tick(st, 1 / 60, false); t += 1 / 60; }
check('a nibble comes within 3 to 9 seconds', ev === 'nibble' && t > 2.9 && t < 9.2, t.toFixed(1) + 's');
check('a press during the nibble scares the fish', Fishing.press(st) === 'scared' && st.phase === 'wait');
st = Fishing.start(rng(12), 4, false); ev = null; t = 0;
while (ev !== 'bite' && t < 30) { ev = Fishing.tick(st, 1 / 60, false); t += 1 / 60; }
check('a bite follows the nibble', ev === 'bite');
let t2 = 0; while (st.phase === 'bite' && t2 < 3) { ev = Fishing.tick(st, 1 / 60, false); t2 += 1 / 60; }
check('an unanswered bite is missed within about a second', ev === 'missed' && t2 < 1.2 && st.phase === 'wait', t2.toFixed(2) + 's');
st = Fishing.start(rng(13), 4, false); ev = null; while (ev !== 'bite') ev = Fishing.tick(st, 1 / 60, false);
check('a press in the window hooks it', Fishing.press(st) === 'hooked' && st.phase === 'fight' && st.dist > 0);
// the fight, by bots
function play(fishId, bot, seed) {
  const R = rng(seed), st = Fishing.start(R, 4, true); st.fish = (function () { let f; do { f = Fishing.roll(R, 5, true); } while (f.id !== fishId); return f; })();
  let ev = null, time = 0; while (ev !== 'bite' && time < 40) { ev = Fishing.tick(st, 1 / 60, false); time += 1 / 60; }
  Fishing.press(st); let frames = 0;
  while (st.phase === 'fight' && frames < 60 * 120) { const held = bot(st); Fishing.tick(st, 1 / 60, held); frames++; }
  return { phase: st.phase, secs: frames / 60 };
}
const careful = st => st.run <= 0 && st.tension < 0.72, greedy = () => true, lazy = () => false, steady = st => st.tension < 0.6;
const ids = ['herring', 'perch', 'cod', 'pike', 'salmon', 'chest'];
ids.forEach(id => {
  let land = 0, lost = 0, secs = 0, gl = 0, sl = 0; for (let i = 0; i < 40; i++) { const r = play(id, careful, 200 + i); if (r.phase === 'landed') { land++; secs += r.secs; } else lost++; if (play(id, greedy, 300 + i).phase === 'landed') gl++; if (play(id, steady, 400 + i).phase === 'landed') sl++; }
  console.log(id + ': careful lands ' + land + '/40 in ' + (secs / Math.max(1, land)).toFixed(1) + 's, steady lands ' + sl + '/40, greedy lands ' + gl + '/40');
  check(id + ': the careful bot lands nearly all', land >= 36, land);
  if (id === 'pike' || id === 'salmon') check(id + ': the greedy bot loses most', gl <= 12, gl);
  if (id === 'herring') check('herring: even the greedy bot lands most', gl >= 30, gl);
  if (id === 'chest') check('the chest never runs', Fishing.FISH.chest.runs === 0);
});
check('the bot that never reels lands nothing', play('perch', lazy, 500).phase !== 'landed');
const sal = play('salmon', careful, 901), her = play('herring', careful, 902);
check('a salmon takes longer than a herring', sal.secs > her.secs, sal.secs.toFixed(1) + 's vs ' + her.secs.toFixed(1) + 's');
console.log('bad = ' + bad);
