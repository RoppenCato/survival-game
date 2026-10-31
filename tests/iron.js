// Iron (2026-10-07): the lowlands' metal. Checks that iron tools and arms step up from copper, that the iron gear turns more aside
// than leather and the gambeson sits between, that the names are the Norse ones, and that a full iron set turns aside about 60% (armor as points since 2026-10-31).
// Prints values and exits 0 unless something throws; read the lines against their labels.
const Items = require('../src/items.js');
let bad = 0;
function check(label, ok, v) { console.log((ok ? 'ok   ' : 'BAD  ') + label + (v !== undefined ? ': ' + v : '')); if (!ok) bad++; }
const cu = Items.make('sword', 'copper'), fe = Items.make('sword', 'iron'), cuAxe = Items.make('axe', 'copper'), feAxe = Items.make('axe', 'iron');
check('iron sword hits harder than copper', Items.stats(fe).dmg > Items.stats(cu).dmg, Items.stats(cu).dmg + ' -> ' + Items.stats(fe).dmg);
check('iron axe chops better than copper', Items.stats(feAxe).power > Items.stats(cuAxe).power, Items.stats(cuAxe).power + ' -> ' + Items.stats(feAxe).power);
const lt = Items.make('tunic', 'leather'), gb = Items.make('tunic', 'wool'), ml = Items.make('tunic', 'iron'), lh = Items.make('helmet', 'leather'), ih = Items.make('helmet', 'iron'), ws = Items.make('shield', 'wood'), ps = Items.make('shield', 'iron');
check('gambeson turns more aside than leather', Items.stats(gb).armor > Items.stats(lt).armor, Items.stats(lt).armor + ' < ' + Items.stats(gb).armor);
check('mail turns more aside than the gambeson', Items.stats(ml).armor > Items.stats(gb).armor, Items.stats(gb).armor + ' < ' + Items.stats(ml).armor);
check('iron helm over leather helmet', Items.stats(ih).armor > Items.stats(lh).armor, Items.stats(lh).armor + ' < ' + Items.stats(ih).armor);
check('painted shield over wooden', Items.stats(ps).armor > Items.stats(ws).armor, Items.stats(ws).armor + ' < ' + Items.stats(ps).armor);
check('names', Items.name(ml) === 'Mail Shirt' && Items.name(gb) === 'Gambeson' && Items.name(ih) === 'Iron Helm' && Items.name(ps) === 'Painted Shield', [ml, gb, ih, ps].map(Items.name).join(', '));
check('tales differ', Items.desc(ml) !== Items.desc(fe) && Items.desc(gb).indexOf('quilted') >= 0);
const full = [ih, ml, Items.make('trousers', 'leather'), Items.make('boots', 'leather'), Items.make('cloak', 'leather'), ps].reduce((a, it) => a + Items.stats(it).armor, 0);
const ironSet = ['helmet', 'tunic', 'trousers', 'boots', 'cloak'].reduce((a, k) => a + Items.stats(Items.make(k, 'iron')).armor, 0), share = Items.armorShare(ironSet);
check('a full iron set turns aside over half, never all', share > 0.55 && share < 0.75, ironSet + ' points, ' + Math.round(share * 100) + '%');
check('each point is worth 10% of his health', Items.effectiveHealth(100, 10) === 200 && Items.armorShare(10) === 0.5);
const leatherSet = ['helmet', 'tunic', 'trousers', 'boots', 'cloak'].reduce((a, k) => a + Items.stats(Items.make(k, 'leather')).armor, 0) + Items.stats(ws).armor;
console.log('bad = ' + bad);
