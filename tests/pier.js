// The pier's rules (Robin, 2026-10-30; src/pier.js): built from the beach, standing in the shallows, 1 or 2 pieces inland, the yard at a run's end, no two piers touching, nets over water.
//   node tests/pier.js
const Pier = require('../src/pier.js');
// the world: land west of x = 640 (sand from 450), shallows to x = 760, deep beyond
const G = { land: x => x < 640, sand: x => x > 450 && x < 640, shallow: x => x >= 640 && x < 760, water: x => x >= 640, clear: () => true };
let bad = 0; const ok = (name, v) => { if (!v) bad++; console.log((v ? 'ok ' : '!! ') + ' ' + name); };
const put = (d, x, y) => { const r = Pier.canRun(d, x, y, G); if (r.ok) Pier.place(d, x, y, 'run', G); return r; };
let d = Pier.fresh();
ok('not in the deep water', !put(d, 14, 4).ok);
ok('not in the shallows without a start', !put(d, 10, 4).ok);
ok('not far inland', !put(d, 2, 4).ok);
ok('the first piece on the sand by the water', put(d, 9, 4).ok);
ok('it is a landing, its sand to the west', d.m['9,4'].k === 'landing' && d.m['9,4'].s === 'w');
ok('the next in the shallows', put(d, 10, 4).ok);
ok('the landing stays', d.m['9,4'].k === 'landing' && d.m['9,4'].s === 'w' && d.m['10,4'].k === 'run');
ok('the next, its near edge in the shallows', put(d, 11, 4).ok);
ok('past that, too deep', !put(d, 12, 4).ok);
ok('a second piece inland', put(d, 8, 4).ok && d.m['9,4'].k === 'run' && d.m['8,4'].k === 'landing');
ok('a third is refused', !put(d, 7, 4).ok);
ok('a piece touching two is refused', (() => { const q = Pier.fresh(); put(q, 9, 4); put(q, 10, 4); put(q, 10, 5); put(q, 10, 6); put(q, 9, 6); return !Pier.canRun(q, 9, 5, G).ok; })());
const h = Pier.canHead(d, 12, 4, G); ok('the yard at the run\'s end', h.ok && h.o === 'e'); Pier.place(d, 12, 4, 'head', G, h.o);
ok('nothing past the yard', !put(d, 13, 4).ok);
ok('the yard only at a pier', !Pier.canHead(d, 10, 8, G).ok);
ok('at: the deck, the head\'s overhang, and off it', Pier.at(d, 700, 290) === d.m['10,4'] && Pier.at(d, 800, 248) === d.m['12,4'] && !Pier.at(d, 700, 200));
const N = Pier.netAt(d, 704, 320, G); ok('a net on a deck\'s open side', N && N.ok && N.side === 's'); d.n[N.key] = 1;
ok('its foot found', !!Pier.netNear(d, 672, 342, 30));
ok('no net on the landing', !Pier.netAt(d, 544, 320, G).ok);
ok('no net over the rail', !Pier.netAt(d, 832, 288, G).ok);
ok('the way along', Pier.next(d, d.m['8,4'], d.m['12,4']) === d.m['9,4'] && Pier.landingOf(d, d.m['12,4']) === d.m['8,4']);
ok('a landing rises to the deck', Pier.liftAt(d.m['8,4'], 514, 290, 10.3) < 1.5 && Pier.liftAt(d.m['8,4'], 574, 290, 10.3) > 9 && Pier.liftAt(d.m['10,4'], 700, 290, 10.3) === 10.3);
ok('the deck\'s pieces', /wall_m deck_ew_\d kerb_n kerb_s/.test(Pier.drawList(d, d.m['10,4']).map(p => p.n).join(' ')));
const L = Pier.fresh(); put(L, 9, 4); put(L, 10, 4); put(L, 10, 5); ok('an L', !!L.m['10,5'] && /deck_ns/.test(Pier.drawList(L, L.m['10,5']).map(p => p.n).join(' ')));
console.log('bad = ' + bad);
