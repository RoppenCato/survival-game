// The thirty runes (2026-10-08): the list is sound (thirty, unique ids, a side each, a glyph, a source, a line), every rune the
// game refers to exists, and every rune in the list is wired into the game somewhere (inUse, a deed, a beast, a stone, or a
// meeting), so no rune is a dead letter. Reads dist/game.html, so build first. Prints values; bad = 0 holds.
const fs = require('fs'); const Runes = require('../src/runes.js');
let bad = 0;
function check(label, ok, v) { console.log((ok ? 'ok   ' : 'BAD  ') + label + (v !== undefined ? ': ' + v : '')); if (!ok) bad++; }
const L = Runes.LIST, ids = L.map(r => r.id);
check('thirty runes', L.length === 30, L.length);
check('every id unique', new Set(ids).size === ids.length);
check('every rune has a side of the ring', L.every(r => Runes.SIDES.indexOf(r.side) >= 0));
check('every rune has a glyph, a source and a line', L.every(r => r.glyph && r.glyph.length && r.source && r.text && r.norse));
const bySide = {}; L.forEach(r => { bySide[r.side] = (bySide[r.side] || 0) + 1; }); console.log('by side', JSON.stringify(bySide));
check('each side has at least five', Object.keys(bySide).length === 4 && Object.values(bySide).every(n => n >= 5));
const html = fs.readFileSync('dist/game.html', 'utf8');
const used = new Set(), refs = new Set();
(html.match(/(?:inUse|runeMul)\('([a-z]+)'\)/g) || []).forEach(m => { const id = m.match(/'([a-z]+)'/)[1]; used.add(id); refs.add(id); });
(html.match(/earnRune\('([a-z]+)'/g) || []).forEach(m => { const id = m.match(/'([a-z]+)'/)[1]; refs.add(id); });
const deeds = html.match(/var DEEDS = \[[\s\S]*?\];/)[0]; (deeds.match(/'([a-z]+)', '[a-z -]+'\]/g) || []).forEach(m => refs.add(m.match(/'([a-z]+)'/)[1]));
const beasts = html.match(/var BEAST_RUNES = \{[^}]*\}/)[0]; (beasts.match(/: '([a-z]+)'/g) || []).forEach(m => refs.add(m.match(/'([a-z]+)'/)[1]));
const stones = html.match(/var STONE_POOL = \[[^\]]*\]/)[0]; (stones.match(/'([a-z]+)'/g) || []).forEach(m => refs.add(m.replace(/'/g, '')));
const unknown = [...refs].filter(id => ids.indexOf(id) < 0);
check('every rune the game names exists', unknown.length === 0, unknown.join(','));
const unused = ids.filter(id => !used.has(id));
check('every rune changes something (inUse)', unused.length === 0, unused.join(','));
const unearnable = ids.filter(id => !refs.has(id) || (!deeds.includes("'" + id + "'") && !beasts.includes("'" + id + "'") && !stones.includes("'" + id + "'") && !html.includes("earnRune('" + id + "'") && id !== 'riposte'));
check('every rune can be earned (a deed, a beast, a stone or a meeting; riposte is Brokk\'s)', unearnable.length === 0, unearnable.join(','));
const engine = fs.readFileSync('src/combat.js', 'utf8');
check('the engine reads the new mods (crit, stealth, arrow)', engine.includes("modZ('crit')") && engine.includes('mods().stealth') && engine.includes('mods().arrow'));
console.log('bad = ' + bad);
