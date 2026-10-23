/* The runes, reworked (docs/runes-rework.md, Robin's decisions of 2026-10-23). A rune is a carved stone in your library at the
   altar; it does nothing until it is bound into a slot there with your blood. The slots are fixed: three actives, each an
   input (the guard-blow: the right button held and the left pressed; the dash: Space; the swing: the tool's blow), and four
   passives, one each of the body (hand, foot, eye, heart). An active charges on the blood you draw (so many landed blows) and
   is ready when its ring is full. A rune has three tiers: it grows by use, or at once by an animal's blood on the altar. Runes
   come from the sacrifice pool (the storm at the altar offers three, you take one) and from the world (met where they are met).
   Marks a foe can carry (struck, bleeding, afraid, chilled, burning) are how runes work together: one lays a mark, another
   reads it. This module is data and bookkeeping only, shared by the game, the editor and the tests; the powers themselves are
   in the engine and the page. The names and lines are LORE? until Alistair, LD's come. */
var Runes2 = (function () {
'use strict';
var SLOTS = [
  { id: 'guardBlow', name: 'Guard-blow', input: 'right held, left', active: true },
  { id: 'dash', name: 'Dash', input: 'Space', active: true },
  { id: 'swing', name: 'Swing', input: 'the tool', active: true },
  { id: 'hand', name: 'Hand', input: 'what you strike with' },
  { id: 'foot', name: 'Foot', input: 'how you move' },
  { id: 'eye', name: 'Eye', input: 'what you see and find' },
  { id: 'heart', name: 'Heart', input: 'what you endure' }
];
var SLOT = {}; SLOTS.forEach(function (s) { SLOT[s.id] = s; });
// the numbers a rune works with, by tier (index 0 is tier I); num(state, id, key) reads the bound tier's
var LIST = [
  { id: 'bash', name: 'The Bash', slot: 'guardBlow', pool: 'start', source: 'the first shield', text: ['Breaks a block: the man before you with his guard up has it broken and is thrown; one with his guard down takes a low blow.', 'The man he is thrown into goes down with him.', 'A broken man stays open twice as long.'],
    n: { need: [3, 3, 2], throwK: [1, 1.2, 1.4], breakCd: [1.4, 1.4, 2.8] } },
  { id: 'charge', name: 'The Charge', slot: 'guardBlow', pool: 'world', source: 'the first boar', text: ['A rush three strides long: the first man in your way goes down, the next is pushed back. Needs no shield.', 'Two men go down before the rush, not one.', 'The rush strikes with the weapon in hand.'],
    n: { need: [3, 3, 3], len: [3, 3, 3.5], down: [1, 2, 2], strike: [0, 0, 1] }, lays: 'struck' },
  { id: 'dash', name: 'The Dash', slot: 'dash', pool: 'start', source: 'the first day', text: ['A short dash, untouchable for a breath.', 'The dash comes again sooner.', 'A dash in the last moment before a blow turns it: the perfect dodge opens him wider.'],
    n: { cd: [0.08, 0.04, 0.04], perfect: [1, 1, 1.5] } },
  { id: 'roll', name: 'The Roll', slot: 'dash', pool: 'storm', text: ['A roll: longer, longer untouchable, slower to rise.', 'A blow that lands on the roll is a miss.', 'You rise swinging: the first blow after a roll is heavy.'],
    n: { len: [1.7, 1.7, 1.9], invuln: [0.42, 0.6, 0.6], cd: [0.35, 0.3, 0.25] } },
  { id: 'thorsFell', name: 'Thor’s fell', slot: 'swing', pool: 'storm', text: ['One tree in four comes down with such force that it flies into two more and fells them.', 'One in three, and the trunk never flies at you.', 'One in two, and the logs come off the fallen trees by themselves.'],
    n: { chance: [0.25, 0.34, 0.5], fells: [2, 2, 2], safe: [0, 1, 1], logs: [0, 0, 1] } },
  { id: 'thorsWrath', name: 'Thor’s wrath', slot: 'hand', pool: 'storm', text: ['One blow in four calls lightning down on the man: he is struck for ten seconds, open to the hammer.', 'One blow in three.', 'The lightning hurts him too.'],
    n: { chance: [0.25, 0.34, 0.34], mark: [10, 10, 12], dmg: [0, 0, 0.6] }, lays: 'struck' },
  { id: 'bloodlust', name: 'Bloodlust', slot: 'hand', pool: 'world', source: 'the first wolf', text: ['Every man or beast you fell gives you a little of its strength: eight health.', 'Twelve health.', 'Twelve health, and your next active is ready at once.'],
    n: { heal: [8, 12, 12], ready: [0, 0, 1] } },
  { id: 'rushStep', name: 'The Rush-step', slot: 'foot', pool: 'storm', text: ['A dash through a struck man knocks him down.', 'A dash through any staggered man knocks him down.', 'Those he falls against stagger.'],
    n: { any: [0, 1, 1], spread: [0, 0, 1] }, reads: 'struck' },
  { id: 'catFoot', name: 'Cat foot', slot: 'foot', pool: 'world', source: 'the graves read', text: ['Your steps make no noise: a man at his post hears you only from close by.', 'Beasts notice you from closer.', 'In the dark nobody hears you at all.'],
    n: { hear: [0.5, 0.5, 0.5], beast: [1, 0.6, 0.6], night: [0, 0, 1] } },
  { id: 'stormsEye', name: 'The Storm’s eye', slot: 'eye', pool: 'storm', text: ['Lightning that strikes a man leaps to a second within reach.', 'To a third.', 'The leap hurts.'],
    n: { leaps: [1, 2, 2], dmg: [0, 0, 0.4] }, reads: 'struck', lays: 'struck' },
  { id: 'keenEye', name: 'Keen eye', slot: 'eye', pool: 'world', source: 'the first night', text: ['In the dark you see twice as far without a torch.', 'Beasts within earshot show on the chart.', 'A man who has not seen you is marked.'],
    n: { night: [2, 2, 2], chart: [0, 1, 1], marks: [0, 0, 1] } },
  { id: 'hammer', name: 'The Hammer', slot: 'heart', pool: 'storm', text: ['A club’s blow on a struck man does double and staggers him.', 'Any blow on a struck man does half again.', 'A struck man cannot raise his guard.'],
    n: { club: [2, 2, 2], any: [1, 1.5, 1.5], noGuard: [0, 0, 1] }, reads: 'struck' },
  { id: 'thickHide', name: 'Thick hide', slot: 'heart', pool: 'world', source: 'the first blow taken', text: ['The first blow of every fight does half.', 'The first two.', 'And a tenth of every blow turns aside.'],
    n: { first: [1, 2, 2], half: [0.5, 0.5, 0.5], armor: [0, 0, 0.1] } }
];
var BY = {}; LIST.forEach(function (r) { BY[r.id] = r; });
var TIERS = 3, GROW = [0, 50, 150];                 // uses at which a rune reaches tier II and III by itself
var RANKS = [null,                                 // the ranks of blood (Robin, 2026-10-23): how many stones rise from it and at what tier; the fifth rank draws on the legendary pool when it has runes
  { id: 1, name: 'thin blood', n: 1, tier: 1 },      // a hen, a hare, a fish, an adder: one stone, take it or leave it
  { id: 2, name: 'red blood', n: 2, tier: 1 },       // a deer, a boar, the farm's beasts: two
  { id: 3, name: 'a man\u2019s blood', n: 3, tier: 2 },   // a man: three, the dark road
  { id: 4, name: 'strong blood', n: 4, tier: 3 },    // a bear, a moose, a wolf, a troll: four
  { id: 5, name: 'a great one\u2019s blood', n: 5, tier: 3, legend: true }];   // a jarl, a boss: five, and the legendary runes among them (none yet)
var ANIMAL_RANK = { hen: 1, hare: 1, fish: 1, snake: 1, sheep: 2, goat: 2, deer: 2, boar: 2, cow: 2, man: 3, bear: 4, moose: 4, wolf: 4, troll: 4, jarl: 5, boss: 5 };
var ANIMAL_TIER = {}; for (var ak in ANIMAL_RANK) ANIMAL_TIER[ak] = RANKS[ANIMAL_RANK[ak]].tier;   // (kept for readers of the tier alone)
function rankOf(kind) { return RANKS[ANIMAL_RANK[kind] || 1]; }
var MARKS = { struck: { t: 10, col: '#ffe9a0' }, bleeding: { t: 20, col: '#c8322a' }, afraid: { t: 6, col: '#c9a8ff' }, chilled: { t: 8, col: '#a8d8ff' }, burning: { t: 6, col: '#ff9a40' } };
function fresh() { return { lib: {}, bound: {}, uses: {}, blood: {} }; }
function start(st) { st = st || fresh(); learn(st, 'bash', 1); learn(st, 'dash', 1); if (!st.bound.guardBlow) bind(st, 'guardBlow', 'bash'); if (!st.bound.dash) bind(st, 'dash', 'dash'); return st; }   // what every hero has from the first day
function known(st, id) { return !!(st && st.lib && st.lib[id]); }
function tierOf(st, id) { if (!known(st, id)) return 0; var t = st.lib[id], u = st.uses[id] || 0, g = 1; while (g < TIERS && u >= GROW[g]) g++; return Math.max(t, g); }   // the tier given, or the one use has reached
function learn(st, id, tier) { if (!BY[id]) return false; var t = Math.max(1, Math.min(TIERS, tier || 1)); if (!st.lib[id] || st.lib[id] < t) st.lib[id] = t; return true; }
function fits(st, slot) { return LIST.filter(function (r) { return r.slot === slot && known(st, r.id); }); }
function bound(st, slot) { return st && st.bound ? st.bound[slot] || null : null; }
function bind(st, slot, id) { if (!SLOT[slot] || !BY[id] || BY[id].slot !== slot || !known(st, id)) return false; st.bound[slot] = id; st.blood[slot] = 0; return true; }
function unbind(st, slot) { delete st.bound[slot]; st.blood[slot] = 0; }
function num(st, id, key) { var r = BY[id]; if (!r || !r.n || !r.n[key]) return 0; var t = Math.max(1, tierOf(st, id)); return r.n[key][Math.min(r.n[key].length, t) - 1]; }
function has(st, id) { for (var s in st.bound) if (st.bound[s] === id) return true; return false; }   // bound somewhere
function use(st, id, n) { if (!known(st, id)) return 0; var was = tierOf(st, id); st.uses[id] = (st.uses[id] || 0) + (n || 1); var now = tierOf(st, id); return now > was ? now : 0; }   // the new tier when use has raised it
function need(st, slot) { var id = bound(st, slot); return id ? (num(st, id, 'need') || 0) : 0; }
function charge(st, slot) { var id = bound(st, slot); if (!id) return 0; var nd = need(st, slot); return nd ? Math.min(1, (st.blood[slot] || 0) / nd) : 1; }   // 0 to 1: how full the blood ring is
function drawBlood(st, n) { for (var s in st.bound) if (SLOT[s] && SLOT[s].active && need(st, s)) st.blood[s] = Math.min(need(st, s), (st.blood[s] || 0) + (n || 1)); }   // a landed blow feeds every active
function ready(st, slot) { return !!bound(st, slot) && charge(st, slot) >= 1; }
function spend(st, slot) { st.blood[slot] = 0; }
function readyAll(st) { for (var s in st.bound) if (SLOT[s] && SLOT[s].active) st.blood[s] = need(st, s); }
// the storm's offer: so many stones as the blood's rank brings, from the sacrifice pool, at the rank's tier; a rune known already is offered one tier up, never twice; the fifth rank's stones come from the legendary pool first
function offer(st, rank, R) {
  R = R || Math.random; var rk = typeof rank === 'object' ? rank : RANKS[Math.max(1, Math.min(RANKS.length - 1, rank || 1))], n = rk.n, tier = Math.max(1, Math.min(TIERS, rk.tier));
  var pool = LIST.filter(function (r) { return (r.pool === 'storm' || (rk.legend && r.pool === 'legend')) && (!known(st, r.id) || (tierOf(st, r.id) < TIERS)); });   /* a rune known already is offered one tier up, whatever the blood's tier */
  var out = [], guard = 60; if (rk.legend) { var leg = pool.filter(function (r) { return r.pool === 'legend'; }); while (out.length < n && leg.length && guard-- > 0) { var li = Math.floor(R() * leg.length), lr = leg.splice(li, 1)[0]; pool.splice(pool.indexOf(lr), 1); out.push({ id: lr.id, tier: tier }); } }
  while (out.length < n && pool.length && guard-- > 0) { var i = Math.floor(R() * pool.length), r = pool.splice(i, 1)[0]; out.push({ id: r.id, tier: known(st, r.id) ? Math.min(TIERS, Math.max(tier, tierOf(st, r.id) + 1)) : tier }); }
  if (out.length < n) LIST.filter(function (r) { return r.pool === 'world' && !known(st, r.id); }).slice(0, n - out.length).forEach(function (r) { out.push({ id: r.id, tier: tier }); });   // the pool run dry: the world's runes come through the storm too
  return out;
}
function take(st, pick) { learn(st, pick.id, pick.tier); return pick.id; }
// a rune's glyph: strokes on a 10 by 14 grid, drawn in the stone's colour, filled red where it is woken (fill 0 to 1 from the foot)
var GLYPHS = {
  bash: [[[5, 0], [5, 14]], [[5, 3], [9, 7]], [[1, 7], [5, 3]]], charge: [[[2, 14], [2, 0], [8, 4], [2, 8]], [[2, 8], [8, 14]]], dash: [[[1, 14], [9, 0]], [[1, 7], [9, 7]]],
  roll: [[[3, 14], [3, 0], [8, 4], [3, 8]]], thorsFell: [[[5, 0], [5, 14]], [[1, 4], [9, 4]], [[2, 1], [5, 4], [8, 1]]], thorsWrath: [[[7, 0], [3, 5], [7, 7], [3, 14]], [[3, 5], [7, 5]]],
  bloodlust: [[[2, 14], [2, 0]], [[2, 3], [8, 0]], [[2, 8], [8, 5]]], rushStep: [[[1, 14], [9, 0]], [[9, 14], [1, 0]]], catFoot: [[[5, 0], [5, 14]], [[2, 11], [5, 14], [8, 11]]],
  stormsEye: [[[1, 0], [9, 14]], [[1, 7], [9, 7]], [[5, 0], [5, 14]]], keenEye: [[[1, 7], [5, 2], [9, 7], [5, 12], [1, 7]], [[5, 5], [5, 9]]], hammer: [[[5, 14], [5, 4]], [[1, 4], [9, 4], [9, 0], [1, 0], [1, 4]]],
  thickHide: [[[1, 14], [1, 2], [9, 5], [9, 14]], [[1, 8], [9, 8]]]
};
function glyph(c, id, x, y, s, col, w, fill) {
  var g = GLYPHS[id] || GLYPHS.bash, k = s / 14; c.save(); c.translate(x - 5 * k, y - 7 * k); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = w || Math.max(0.8, s * 0.1);
  function strokeAll() { c.beginPath(); g.forEach(function (st) { st.forEach(function (p, i) { if (i) c.lineTo(p[0] * k, p[1] * k); else c.moveTo(p[0] * k, p[1] * k); }); }); c.stroke(); }
  c.strokeStyle = col || '#5a4a3a'; strokeAll();
  if (fill > 0) { c.save(); c.beginPath(); c.rect(-2 * k, 14 * k * (1 - fill) - 0.5, 14 * k, 14 * k * fill + 1); c.clip(); c.strokeStyle = '#b8352c'; c.lineWidth = (w || Math.max(0.8, s * 0.1)) * 1.15; strokeAll(); c.restore(); }
  c.restore();
}
// a standing stone, about a knee high, with the glyph on its face: state 'blank', 'carved', 'woken' (fill 1), 'broken'
function stone(c, x, y, h, id, state, fill) {
  var w = h * 0.7; c.save();
  if (state === 'broken') { c.fillStyle = '#6f6a62'; c.strokeStyle = '#2a241e'; c.lineWidth = Math.max(0.6, h * 0.05); [[-0.4, 0, 0.25, -0.25], [0.15, 0.05, 0.5, -0.2], [-0.1, -0.15, 0.2, -0.4]].forEach(function (f) { c.beginPath(); c.moveTo(x + f[0] * w, y + f[1] * h); c.lineTo(x + f[2] * w, y + f[1] * h); c.lineTo(x + (f[0] + f[2]) / 2 * w, y + f[3] * h); c.closePath(); c.fill(); c.stroke(); }); c.restore(); return; }
  c.fillStyle = '#7d786f'; c.strokeStyle = '#2a241e'; c.lineWidth = Math.max(0.7, h * 0.06); c.beginPath(); c.moveTo(x - w * 0.5, y); c.lineTo(x - w * 0.42, y - h * 0.85); c.quadraticCurveTo(x, y - h * 1.1, x + w * 0.4, y - h * 0.88); c.lineTo(x + w * 0.5, y); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.moveTo(x - w * 0.42, y - h * 0.85); c.quadraticCurveTo(x, y - h * 1.1, x + w * 0.4, y - h * 0.88); c.lineTo(x + w * 0.3, y - h * 0.8); c.quadraticCurveTo(x, y - h * 1.0, x - w * 0.34, y - h * 0.78); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.moveTo(x + w * 0.5, y); c.lineTo(x + w * 0.4, y - h * 0.88); c.lineTo(x + w * 0.3, y - h * 0.84); c.lineTo(x + w * 0.4, y); c.closePath(); c.fill();
  if (state !== 'blank' && id) glyph(c, id, x, y - h * 0.5, h * 0.5, state === 'woken' || fill > 0 ? '#3a2a24' : '#3f3730', Math.max(0.7, h * 0.055), state === 'woken' ? 1 : (fill || 0));
  c.restore();
}
return { SLOTS: SLOTS, SLOT: SLOT, LIST: LIST, BY: BY, TIERS: TIERS, GROW: GROW, ANIMAL_TIER: ANIMAL_TIER, RANKS: RANKS, ANIMAL_RANK: ANIMAL_RANK, rankOf: rankOf, MARKS: MARKS, GLYPHS: GLYPHS, fresh: fresh, start: start, known: known, tierOf: tierOf, learn: learn, fits: fits, bound: bound, bind: bind, unbind: unbind, num: num, has: has, use: use, need: need, charge: charge, drawBlood: drawBlood, ready: ready, spend: spend, readyAll: readyAll, offer: offer, take: take, glyph: glyph, stone: stone };
})();
if (typeof module !== 'undefined') module.exports = Runes2;
