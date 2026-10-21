// The living sea (src/sea.js, the Art Director's recipe, 2026-10-21): ticked headless on a fake sea with a shore to the north,
// it keeps the water's patches on the water only, counts them by the wind, hides the glitter at night, flies gulls round the
// ship, brings a whale far out and a seal by the shore, and draws it all without throwing. Prints values; bad = 0 means all held.
const { createCanvas } = require('@napi-rs/canvas');
const Sea = require('../src/sea.js');
let bad = 0;
function check(label, ok, v) { console.log((ok ? 'ok   ' : 'BAD  ') + label + (v !== undefined ? ': ' + v : '')); if (!ok) bad++; }
const water = (x, y) => y > -120, env = { x: 0, y: 300, hw: 300, hh: 200, z: 0.55, wind: { a: 0.6, s: 0.6 }, water, night: 0, ship: { x: 0, y: 300 }, shore: null };
const S = Sea.make(); for (let i = 0; i < 900; i++) Sea.tick(S, 1 / 30, env);
check('the sea is in view', S.on === true);
check('cat\'s-paws by the wind (14 at full, here 0.6)', S.paws.length >= 6 && S.paws.length <= 9, S.paws.length);
check('whitecaps by the wind squared, more pulled out', S.caps.length >= 6 && S.caps.length <= 11, S.caps.length);
check('the glitter in its band by day', S.glints.length > 150, S.glints.length);
check('six swells, two cloud shadows', S.swells.length === 6 && S.clouds.length === 2, S.swells.length + ', ' + S.clouds.length);
check('every patch lies on the water', S.paws.concat(S.caps, S.swells, S.clouds, S.glints).every(p => water(p.x, p.y)));
check('gulls circle the ship: two to five', S.gulls.length >= 2 && S.gulls.length <= 5, S.gulls.length);
check('a gull keeps its ring round the ship', S.gulls.every(g => Math.abs(Math.hypot(g.x - g.cx, g.y - g.cy) - g.R) < 1));
for (let i = 0; i < 3000 && !S.shoals.length; i++) Sea.tick(S, 1 / 30, env); check('a shoal has formed (within two minutes)', S.shoals.length >= 1, S.shoals.length);
S.nextWhale = 0; Sea.tick(S, 1 / 30, env);
check('the whale comes far out, surfacing first', !!S.whale && S.whale.state === 'back1' && Math.hypot(S.whale.x - env.x, S.whale.y - env.y) >= 500, S.whale && Math.round(Math.hypot(S.whale.x - env.x, S.whale.y - env.y)));
for (let i = 0; i < 30 * 3.6; i++) Sea.tick(S, 1 / 30, env); check('after 3.6 s it is under', !!S.whale && S.whale.state === 'under', S.whale && S.whale.state);
for (let i = 0; i < 30 * 21; i++) Sea.tick(S, 1 / 30, env); check('twenty seconds on, the second rise', !!S.whale && S.whale.n === 2 && S.whale.state !== 'under', S.whale && S.whale.state + ' ' + S.whale.n);
const near = Object.assign({}, env, { y: 0 }); S.nextSeal = 0; for (let i = 0; i < 30 && !S.seal; i++) { S.nextSeal = 0; Sea.tick(S, 1 / 30, near); } check('a seal by the shore (the camera at the beach)', !!S.seal && !water(S.seal.x, S.seal.y - 70), S.seal && Math.round(S.seal.y));
if (!S.shoals.length) S.shoals.push({ x: 0, y: 300, h: 0, t: 0, life: 60, seed: 7, flash: 0 }); S.fish.length = 0; S.nextFish = 0; Sea.tick(S, 1 / 30, env); check('a fish leaps from the shoal', S.fish.length === 1, S.fish.length);
const night = Object.assign({}, env, { night: 1, ship: null, shore: null }); for (let i = 0; i < 90; i++) Sea.tick(S, 1 / 30, night);
check('no glitter at night', S.glints.length === 0, S.glints.length);
check('no gulls far out at night (they leave)', S.gulls.length <= 2, S.gulls.length);
const calm = Sea.make(), cenv = Object.assign({}, env, { wind: { a: 0.6, s: 0 } }); for (let i = 0; i < 300; i++) Sea.tick(calm, 1 / 30, cenv);
check('a calm day: swell and glitter only, no cat\'s-paws, no whitecaps', calm.paws.length === 0 && calm.caps.length === 0 && calm.swells.length === 6 && calm.glints.length > 100, calm.paws.length + ', ' + calm.caps.length);
let threw = null; try { const c = createCanvas(600, 400).getContext('2d'); c.translate(300, -100); Sea.drawWater(c, S, env); Sea.lifeItems(S, env, {}).forEach(it => it.f(c)); Sea.drawGulls(c, S, env, {}); Sea.pennant(c, 0, 0, 0.6, 0.6); Sea.bowSpray(c, 0, 0, 0.5, 0.6, 1); Sea.spout(c, 0, 0, 0.6, 0.8); } catch (e) { threw = e; }
check('the water, the life, the gulls, the pennant, the spray and the spout draw without throwing', !threw, threw && threw.message);
console.log('bad = ' + bad);
