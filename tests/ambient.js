// The ambient sound (src/ambient.js) on a pretend AudioContext: nothing is heard here, but the logic is run for twenty minutes
// of game time in each of several places and counted. No assertions, like the other tests: read the lines. A fault is a
// throw, a sound that should not be there (birds in a cave, crickets at noon), a bed left loud where it should be silent, or
// single sounds piling up faster than they end.
const Ambient = require('../src/ambient.js');
function Param(v) { this.value = v; }
Object.defineProperty(Param.prototype, 'target', { get() { return this.value; } });
Param.prototype.setTargetAtTime = function (v) { this.value = v; }; Param.prototype.setValueAtTime = function (v) { this.value = v; };
Param.prototype.exponentialRampToValueAtTime = Param.prototype.linearRampToValueAtTime = function (v) { this.value = v; };
function Node(ac, kind) { this.kind = kind; this.gain = new Param(1); this.frequency = new Param(440); this.Q = new Param(1); this.pan = new Param(0); this.ac = ac; }
Node.prototype.connect = function (n) { return n; };
Node.prototype.start = function (t, o, d) { this.ac.started++; const end = (t || this.ac.currentTime) + (d || (this.loop ? 1e9 : 0)); if (!this.loop) this.ac.live.push(d ? end : null); this.endsAt = end; };
Node.prototype.stop = function (t) { const i = this.ac.live.lastIndexOf(null); if (i >= 0) this.ac.live[i] = t; };
function FakeAC() { this.currentTime = 0; this.sampleRate = 8000; this.started = 0; this.live = []; this.destination = new Node(this, 'dest'); }
['createGain', 'createBiquadFilter', 'createOscillator', 'createBufferSource', 'createStereoPanner'].forEach(k => { FakeAC.prototype[k] = function () { return new Node(this, k); }; });
FakeAC.prototype.createBuffer = function (ch, n) { const d = new Float32Array(n); return { duration: n / this.sampleRate, getChannelData: () => d }; };
const base = { trees: 0, shore: 0, aboard: false, sail: 0, fells: 0, night: 0, dusk: 0, dawn: 0, fire: 0, torch: false, brook: 0, wind: 0.5, cave: null };
const places = [['a wood by day', { trees: 0.9 }], ['a wood at dawn', { trees: 0.9, dawn: 1 }], ['open ground by day', { trees: 0.05 }], ['the shore by day', { shore: 1, trees: 0.1 }], ['aboard, under way', { aboard: true, sail: 0.7, shore: 1 }], ['the high plateau', { fells: 2 }], ['a meadow at dusk', { dusk: 1, night: 0.5, trees: 0.2 }], ['a wood at night', { night: 1, trees: 0.8 }], ['by a fire at night', { night: 1, fire: 1, trees: 0.3 }], ['the troll\'s cave', { cave: 'troll', trees: 0.9, shore: 1 }], ['the old mine', { cave: 'mine' }], ['the sea cave', { cave: 'sea' }]];
let faults = 0;
places.forEach(([name, e]) => {
  const ac = new FakeAC(), amb = Ambient.make(ac, ac.destination); amb.set(Object.assign({}, base, e)); amb.setVolume(0.7); let maxLive = 0;
  for (let i = 0; i < 20 * 60 * 30; i++) { ac.currentTime += 1 / 30; amb.tick(1 / 30); if (i % 12 === 0) amb.step(e.cave ? 'rock' : 'grass', 1); if (i % 30 === 0) { ac.live = ac.live.filter(t => t == null || t > ac.currentTime); if (ac.live.length > maxLive) maxLive = ac.live.length; } }
  const k = amb.stats.kinds, B = amb.beds, per = n => ((k[n] || 0) / 20).toFixed(1), birds = ['tit', 'warbler', 'blackbird', 'finch', 'sparrow', 'crow', 'raven', 'gull', 'woodpecker', 'cuckoo'].reduce((a, n) => a + (k[n] || 0), 0);
  const line = [name.padEnd(20), 'a minute: birds ' + (birds / 20).toFixed(1), 'owl ' + per('owl'), 'crickets ' + per('cricket'), 'waves ' + per('wave'), 'crackles ' + per('crackle'), 'drips ' + per('drip'), 'creaks ' + per('creak'), 'booms ' + per('boom'), 'steps ' + per('step'), '| beds: wind ' + B.wind.g.gain.target.toFixed(3), 'leaves ' + B.leaves.g.gain.target.toFixed(3), 'fire ' + B.fire.g.gain.target.toFixed(3), 'drone ' + B.drone.g.gain.target.toFixed(3), '| most sounding at once ' + maxLive];
  let bad = '';
  if (e.cave && (birds || k.wave || k.cricket || k.owl || B.wind.g.gain.target > 0.001)) bad += ' THE WORLD OUTSIDE IS HEARD IN THE CAVE';
  if (!e.cave && (k.drip || k.creak || k.boom || B.drone.g.gain.target > 0.001)) bad += ' CAVE SOUNDS OUTSIDE';
  if (!e.night && !e.dusk && k.cricket) bad += ' CRICKETS BY DAY'; if (e.night === 1 && birds) bad += ' BIRDS AT NIGHT'; if (!e.fire && k.crackle) bad += ' A FIRE WHERE THERE IS NONE';
  if (maxLive > 60) bad += ' SOUNDS PILE UP'; if (bad) faults++;
  console.log(line.join('  ') + bad);
});
console.log(faults ? faults + ' PLACES WITH A FAULT' : 'every place: only what belongs there is heard, and nothing piles up');
