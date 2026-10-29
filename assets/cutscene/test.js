// test.js: the player against a fake env (Colin, AD, 2026-10-29): a scene runs to its end, a skip lands where the end does, every step kind runs.
const CS = require('./src/cutscene.js'); const assert = require('assert');
function fakeEnv(log) {
  const A = {}, st = { cam: null, fade: 0, bars: 0, input: true, hud: true, flags: {}, released: 0, cards: [] };
  const mk = (n) => ({ x: 0, y: 0, face: 0, vis: true, clipN: null, said: '', set(x, y) { this.x = x; this.y = y; }, turn(r) { this.face = r; }, moving(m) { this.mv = m; }, clip(c) { this.clipN = c; }, say(t) { this.said = t; }, show(v) { this.vis = v; } });
  return { st, A, place: n => n === 'altar' ? { x: 1000, y: 800 } : n === 'hero' ? { x: A.hero ? A.hero.x : 900, y: A.hero ? A.hero.y : 900 } : null,
    actor: (w) => A[w] || (A[w] = mk(w)), release: () => st.released++, camNow: () => ({ x: 900, y: 900, z: 1 }), camera: c => st.cam = c, fade: k => st.fade = k, bars: k => st.bars = k,
    card: (t, s) => st.cards.push(t), talk: (h, L, done) => setTimeout(done, 0) && done(), lore: id => ['lore ' + id], fx: (n, a, done) => { log.push('fx ' + n); done(); }, music: n => log.push('music ' + n), sound: n => log.push('sound ' + n),
    flag: (k, v) => st.flags[k] = v, call: (fn, a, done) => { log.push('call ' + fn); done(); }, input: on => st.input = on, hud: on => st.hud = on };
}
const scene = { id: 't', anchor: 'altar', steps: [
  { do: 'fade', to: 1, s: 0.3 }, { do: 'place', who: 'lead', at: [0, -40], face: 's' }, { do: 'place', who: 'hero', at: [0, 60], face: 'n' }, { do: 'crowd', group: 'folk', around: [0, 0], r: 80, n: 6 },
  { do: 'camera', at: [0, 10], zoom: 1.3, s: 0.1 }, { do: 'fade', to: 0, s: 0.3 }, { do: 'bars', to: 1, s: 0.2 },
  { do: 'par', steps: [{ do: 'walk', who: 'hero', to: [[0, 40], [0, 30]], speed: 40 }, { do: 'say', who: 'lead', text: 'Come forward.', s: 0.5 }] },
  { do: 'play', who: 'lead', clip: 'war_cry', s: 0.4 }, { do: 'fx', name: 'dark', to: 1, s: 0.3 }, { do: 'fx', name: 'bolt', at: [0, 0] }, { do: 'talk', who: 'lead', lore: 'blot.first' },
  { do: 'call', fn: 'firstRunePick' }, { do: 'music', name: 'riteA' }, { do: 'card', title: 'THE BLOT' }, { do: 'wait', s: 0.2 }, { do: 'camera', release: true, s: 0.2 }],
  end: [{ do: 'place', who: 'hero', at: [0, 30], face: 'n' }, { do: 'flag', key: 'blotDone' }, { do: 'fx', name: 'dark', to: 0 }] };
assert.deepStrictEqual(CS.check(scene), []);
// played through
let log = [], env = fakeEnv(log), ended = null, r = CS.start(scene, env, { onEnd: w => ended = w });
assert.strictEqual(env.st.input, false); for (let i = 0; i < 2000 && !r.done; i++) r.tick(1 / 60);
assert.ok(r.done, 'the scene ends'); assert.strictEqual(ended, 'ended'); assert.strictEqual(env.st.cam, null); assert.strictEqual(env.st.input, true); assert.strictEqual(env.st.bars, 0); assert.strictEqual(env.st.fade, 0);
assert.ok(env.st.flags.blotDone); assert.strictEqual(env.A.hero.y, 830); assert.strictEqual(env.A['folk:5'].vis, true); assert.ok(log.includes('call firstRunePick') && log.includes('fx bolt'));
const watched = { x: env.A.hero.x, y: env.A.hero.y, flags: JSON.stringify(env.st.flags) };
// skipped at every step: the same end
for (let at = 1; at < 40; at++) { const l2 = [], e2 = fakeEnv(l2), r2 = CS.start(scene, e2, {}); for (let i = 0; i < at; i++) r2.tick(1 / 20); r2.skip(); assert.ok(r2.done); assert.strictEqual(e2.A.hero.x, watched.x); assert.strictEqual(e2.A.hero.y, watched.y); assert.strictEqual(JSON.stringify(e2.st.flags), watched.flags); assert.strictEqual(e2.st.cam, null); assert.strictEqual(e2.st.input, true); assert.strictEqual(e2.st.bars, 0); assert.ok(e2.st.released >= 1); }
// play from a step
const e3 = fakeEnv([]), r3 = CS.start(scene, e3, { from: 7 }); assert.strictEqual(e3.A.lead.y, 760); for (let i = 0; i < 2000 && !r3.done; i++) r3.tick(1 / 60); assert.ok(r3.done);
console.log('cutscene player: all tests pass; running time about', CS.length(scene).toFixed(1), 's');
