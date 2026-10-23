// The runes reworked (2026-10-23, src/runes2.js): the library, the slots, binding, the blood charge, growth by use, the storm's offer by
// the animal's tier.   node tests/runes2.js
const R = require('../src/runes2.js');
function ok(c, s) { console.log((c ? '  ' : '  !! ') + s); }
let st = R.start();
ok(R.known(st, 'bash') && R.bound(st, 'guardBlow') === 'bash' && R.bound(st, 'dash') === 'dash', 'the start: the Bash and the Dash known and bound');
ok(!R.bind(st, 'guardBlow', 'charge'), 'an unknown rune cannot be bound');
ok(!R.bind(st, 'hand', 'bash'), 'a rune binds only to its own slot');
R.learn(st, 'charge', 1); ok(R.bind(st, 'guardBlow', 'charge') && R.bound(st, 'guardBlow') === 'charge', 'the Charge learnt and bound in the Bash’s place');
ok(R.fits(st, 'guardBlow').map(r => r.id).join(',') === 'bash,charge', 'what fits the guard-blow: ' + R.fits(st, 'guardBlow').map(r => r.id).join(','));
ok(R.charge(st, 'guardBlow') === 0 && !R.ready(st, 'guardBlow'), 'a bound active starts empty');
R.drawBlood(st); R.drawBlood(st); ok(Math.abs(R.charge(st, 'guardBlow') - 2 / 3) < 0.01, 'two blows landed: two thirds');
R.drawBlood(st); ok(R.ready(st, 'guardBlow'), 'three: ready'); R.spend(st, 'guardBlow'); ok(!R.ready(st, 'guardBlow'), 'spent: empty again');
ok(R.num(st, 'charge', 'down') === 1, 'the Charge at tier I knocks one man down');
let grew = 0; for (let i = 0; i < 50; i++) { const g = R.use(st, 'charge'); if (g) grew = g; }
ok(grew === 2 && R.tierOf(st, 'charge') === 2 && R.num(st, 'charge', 'down') === 2, 'fifty uses: tier II, two men down');
const seeds = [0.1, 0.7, 0.3, 0.9, 0.5, 0.2, 0.8, 0.4, 0.6]; let k = 0; const rng = () => seeds[k++ % seeds.length];
const o1 = R.offer(st, R.rankOf('boar'), rng); ok(o1.length === 2 && o1.every(p => p.tier === 1 && R.BY[p.id].pool === 'storm'), 'a boar’s blood (red, rank 2): two storm runes at tier I: ' + o1.map(p => p.id).join(', '));
const oh = R.offer(st, R.rankOf('hen'), rng), om = R.offer(st, R.rankOf('man'), rng), ob = R.offer(st, R.rankOf('bear'), rng);
ok(oh.length === 1 && om.length === 3 && om.every(p => p.tier >= 2) && ob.length === 4 && ob.every(p => p.tier >= 3), 'a hen one stone, a man three at tier II, a bear four at tier III: ' + [oh.length, om.length, ob.length].join('/'));
R.take(st, om[0]); ok(R.tierOf(st, om[0].id) === 2, 'the one taken from a man’s blood is known at tier II');
const o2 = R.offer(st, 3, rng); ok(o2.every(p => p.id !== om[0].id || p.tier > 2), 'a known rune is offered only one tier up');
R.LIST.filter(r => r.pool === 'storm').forEach(r => R.learn(st, r.id, 3)); const o3 = R.offer(st, 4, rng);
ok(o3.every(p => R.BY[p.id].pool === 'world'), 'the storm pool run dry at tier III: the world’s unmet runes come through: ' + o3.map(p => p.id).join(', '));
ok(R.ANIMAL_RANK.hen === 1 && R.ANIMAL_RANK.boar === 2 && R.ANIMAL_RANK.man === 3 && R.ANIMAL_RANK.bear === 4 && R.RANKS[5].legend, 'the ranks of blood: hen 1, boar 2, man 3, bear 4, the fifth legendary');
const oAll = []; for (let i = 0; i < 30; i++) R.offer(R.start(), 4, Math.random).forEach(q => oAll.push(q.id)); ok(oAll.every(id => R.BY[id].status === 'built'), 'the storm offers only runes that are built (status) unless OPTS.includeData: ' + [...new Set(oAll)].join(', '));
R.OPTS.includeData = true; const oD = R.offer(R.start(), 4, Math.random); R.OPTS.includeData = false; ok(oD.length === 4, 'with includeData the unbuilt runes are offered too: ' + oD.map(q => q.id).join(', '));
console.log('  kinds:', R.KINDS.map(k => k + ' ' + R.LIST.filter(r => r.kind === k).length).join(', '), '| built:', R.LIST.filter(r => r.status === 'built').length, 'data:', R.LIST.filter(r => r.status === 'data').length);
console.log('  runes:', R.LIST.length, 'slots:', R.SLOTS.length, 'storm pool:', R.LIST.filter(r => r.pool === 'storm').length, 'world:', R.LIST.filter(r => r.pool === 'world').length);
