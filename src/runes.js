/* Runes and the arm ring (docs/arm-ring.md, decided 2026-10-06). A rune is knowledge you unlock: never an item. It does
   nothing until it is cut into a coil of your arm ring and reddened with blood at the carver's bench. Each rune belongs to
   a side of the ring (hand: fight, foot: movement, eye: work, heart: endurance and the hird) and a coil holds one rune of
   its side. The ring's metal is its rank and says which coils it has. Shared by the game and the tests.
   A rune: { id, name, norse, side, text, source, glyph }. The ring: { metal, coils: [{ side, id }] }. */
var Runes = (function () {
'use strict';
var LIST = [
  { id: 'riposte', name: 'Riposte', norse: 'Tiwaz', side: 'hand', source: 'Brokk teaches it', text: 'A parry opens a free heavy blow for a moment.', glyph: [[[5, 14], [5, 0]], [[1, 3], [5, 0], [9, 3]]] },
  { id: 'boarcharge', name: 'Boar’s charge', norse: 'Uruz', side: 'hand', source: 'ten boars', text: 'Sprint into a beast to bowl it over: your run is a blow.', glyph: [[[1, 14], [1, 2], [9, 5], [9, 14]]] },
  { id: 'surefeet', name: 'Sure feet', norse: 'Raido', side: 'foot', source: 'a minute of sprinting', text: 'Sprinting costs half the stamina.', glyph: [[[2, 14], [2, 0], [8, 3], [2, 7], [8, 14]]] },
  { id: 'wolfsrun', name: 'Wolf’s run', norse: 'Ehwaz', side: 'foot', source: 'ten wolves', text: 'At night you run faster, and the wolves let you be unless you strike first.', glyph: [[[1, 14], [1, 0], [5, 4], [9, 0], [9, 14]]] },
  { id: 'roll', name: 'Roll', norse: 'Laguz', side: 'foot', source: 'a runestone', text: 'Your dash is a roll: longer, longer untouchable, slower to rise.', glyph: [[[3, 14], [3, 0], [8, 4]]] },
  { id: 'stonesense', name: 'Stone sense', norse: 'Hagalaz', side: 'eye', source: 'a runestone', text: 'Copper glints through rock from afar, and every third rock bursts to your feet.', glyph: [[[1, 0], [1, 14]], [[9, 0], [9, 14]], [[1, 4], [9, 9]]] },
  { id: 'snakeseye', name: 'Snake’s eye', norse: 'Isa', side: 'eye', source: 'ten adders', text: 'Beasts within earshot show on the chart.', glyph: [[[5, 0], [5, 14]]] },
  { id: 'heavyblow', name: 'Heavy blow', norse: 'Thurisaz', side: 'eye', source: 'fifteen trees', text: 'Hold the axe or pick back, then let go: one blow worth three.', glyph: [[[3, 0], [3, 14]], [[3, 3], [9, 7], [3, 11]]] },
  { id: 'hearty', name: 'Hearty', norse: 'Jera', side: 'heart', source: 'five meals', text: 'Meals last half again as long.', glyph: [[[3, 2], [7, 5], [3, 8]], [[7, 6], [3, 9], [7, 12]]] },
  { id: 'hearthwarmth', name: 'Hearth warmth', norse: 'Kenaz', side: 'heart', source: 'a runestone', text: 'You heal by any fire, and a night slept rough still rests you a little.', glyph: [[[8, 0], [2, 7], [8, 14]]] },
  { id: 'longbreath', name: 'Long breath', norse: 'Ansuz', side: 'heart', source: 'a runestone by the sea', text: 'Twice as long under water, and swimming costs no stamina.', glyph: [[[2, 0], [2, 14]], [[2, 0], [8, 4]], [[2, 5], [8, 9]]] }
];
var BY = {}; LIST.forEach(function (r) { BY[r.id] = r; });
var SIDES = ['hand', 'foot', 'eye', 'heart'];
var SIDE_NAMES = { hand: 'Hand', foot: 'Foot', eye: 'Eye', heart: 'Heart' };
// the metals, in rank: which coils each ring has, and how it looks
var METALS = {
  bronze: { name: 'Bronze', rank: 1, coils: ['hand', 'foot'], col: '#b07a3a', dark: '#6b4420', light: '#e2b06a' },
  silver: { name: 'Silver', rank: 2, coils: ['hand', 'foot', 'eye'], col: '#c9ced8', dark: '#6f7580', light: '#ffffff' },
  twisted: { name: 'Twisted silver', rank: 3, coils: ['hand', 'foot', 'eye', 'heart'], col: '#d6dbe4', dark: '#6f7580', light: '#ffffff' },
  gold: { name: 'Gold', rank: 4, coils: ['hand', 'hand', 'foot', 'foot', 'eye', 'eye', 'heart', 'heart'].slice(0, 6), col: '#e2b63a', dark: '#8a6a18', light: '#fff0a8' },
  dragon: { name: 'Dragon', rank: 5, coils: ['hand', 'hand', 'foot', 'foot', 'eye', 'eye', 'heart', 'heart'], col: '#c8402a', dark: '#6a1e12', light: '#ff9a7a' }
};
var METAL_ORDER = ['bronze', 'silver', 'twisted', 'gold', 'dragon'];
function newRing(metal) { var m = METALS[metal] || METALS.bronze; return { metal: METALS[metal] ? metal : 'bronze', coils: m.coils.map(function (s) { return { side: s, id: null }; }) }; }
function coilOf(ring, id) { if (!ring) return -1; for (var i = 0; i < ring.coils.length; i++) if (ring.coils[i].id === id) return i; return -1; }
function alive(ring, id) { return coilOf(ring, id) >= 0; }
// where a known rune could be cut: the first coil of its side (an empty one before a filled one); -1 if the ring has none
function coilFor(ring, id) {
  var r = BY[id]; if (!ring || !r) return -1; var filled = -1;
  for (var i = 0; i < ring.coils.length; i++) if (ring.coils[i].side === r.side) { if (!ring.coils[i].id) return i; if (filled < 0) filled = i; }
  return filled;
}
function canCut(ring, id, known) { return !!(ring && BY[id] && known && known[id] && !alive(ring, id) && coilFor(ring, id) >= 0); }
// cut a known rune into its coil (filing away what was there); returns the coil index or -1
function cut(ring, id, known) { if (!canCut(ring, id, known)) return -1; var i = coilFor(ring, id); ring.coils[i].id = id; return i; }
function file(ring, i) { if (!ring || !ring.coils[i]) return false; ring.coils[i].id = null; return true; }
// the glyph: a futhark letter as strokes in a 10 by 14 box, drawn s tall about (0, 0)
function glyph(c, r, s, col, w) {
  var k = s / 14; c.save(); c.translate(-5 * k, -7 * k); c.strokeStyle = col; c.lineWidth = w || Math.max(0.8, s * 0.11); c.lineCap = 'round'; c.lineJoin = 'round';
  r.glyph.forEach(function (st) { c.beginPath(); st.forEach(function (p, i) { if (i) c.lineTo(p[0] * k, p[1] * k); else c.moveTo(p[0] * k, p[1] * k); }); c.stroke(); });
  c.restore();
}
// a rune stone (a rounded grey pebble with the glyph cut in), for lists and the hotbar. state: 'dim', 'learnt', 'alive'
function stone(c, r, x, y, rad, state) {
  c.save(); c.translate(x, y);
  var dim = state === 'dim';
  c.fillStyle = dim ? '#4a3f36' : '#7a7d86'; c.beginPath(); c.ellipse(0, 0, rad, rad * 0.88, 0.2, 0, 7); c.fill();
  c.strokeStyle = state === 'alive' ? '#ffd34d' : 'rgba(20,12,8,0.7)'; c.lineWidth = state === 'alive' ? 1.4 : 1; c.stroke();
  if (!dim) { c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(-rad * 0.3, -rad * 0.35, rad * 0.4, rad * 0.25, 0.2, 0, 7); c.fill(); }
  glyph(c, r, rad * 1.15, dim ? 'rgba(200,180,150,0.35)' : (state === 'alive' ? '#7a1e12' : '#2a1c14'));
  c.restore();
}
// The ring drawn large: a twisted band, open at the top, its coils as beads along it; a rune cut in a coil shows its glyph
// reddened, an empty coil is plain, and hov marks one. Returns the coil positions for hit tests.
function ringD(c, x, y, ring, R, hov, glowIdx, glowT) {
  var m = METALS[ring ? ring.metal : 'bronze'] || METALS.bronze, n = ring ? ring.coils.length : 0, out = [], i;
  c.save(); c.translate(x, y); c.lineCap = 'round';
  var a0 = -Math.PI * 0.32, a1 = Math.PI * 1.32;                       // the band, open at the top
  c.strokeStyle = m.dark; c.lineWidth = R * 0.34; c.beginPath(); c.arc(0, 0, R, a0, a1); c.stroke();
  c.strokeStyle = m.col; c.lineWidth = R * 0.24; c.beginPath(); c.arc(0, 0, R, a0, a1); c.stroke();
  c.strokeStyle = m.dark; c.lineWidth = R * 0.05; c.setLineDash([R * 0.18, R * 0.14]); c.beginPath(); c.arc(0, 0, R * 1.03, a0, a1); c.stroke(); c.setLineDash([]);   // the twist
  c.strokeStyle = m.light; c.lineWidth = R * 0.04; c.beginPath(); c.arc(0, 0, R * 0.92, a0 + 0.3, a0 + 1.2); c.stroke();
  [a0, a1].forEach(function (a) { c.fillStyle = m.col; c.beginPath(); c.arc(Math.cos(a) * R, Math.sin(a) * R, R * 0.19, 0, 7); c.fill(); c.strokeStyle = m.dark; c.lineWidth = 1; c.stroke(); });   // the knobbed ends
  for (i = 0; i < n; i++) {
    var a = a0 + 0.45 + (a1 - a0 - 0.9) * (n === 1 ? 0.5 : i / (n - 1)), cx = Math.cos(a) * R, cy = Math.sin(a) * R, cr = R * 0.2, cl = ring.coils[i];
    out.push({ i: i, x: x + cx, y: y + cy, r: cr * 1.4 });
    if (glowIdx === i && glowT > 0) { c.fillStyle = 'rgba(255,214,90,' + Math.min(0.7, glowT * 0.7) + ')'; c.beginPath(); c.arc(cx, cy, cr * (1.8 + glowT * 0.6), 0, 7); c.fill(); }
    c.fillStyle = cl.id ? m.light : m.col; c.beginPath(); c.arc(cx, cy, cr, 0, 7); c.fill(); c.strokeStyle = hov === i ? '#ffd34d' : m.dark; c.lineWidth = hov === i ? 1.6 : 1; c.stroke();
    if (cl.id) { glyph(c, BY[cl.id], cr * 1.3, '#8a1e12', Math.max(0.9, cr * 0.22)); }
    else { c.font = '600 ' + Math.max(5, cr * 0.9) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = m.dark; c.fillText(SIDE_NAMES[cl.side][0], cx, cy + cr * 0.33); }
  }
  c.restore();
  return out;
}
return { LIST: LIST, BY: BY, SIDES: SIDES, SIDE_NAMES: SIDE_NAMES, METALS: METALS, METAL_ORDER: METAL_ORDER, newRing: newRing, coilOf: coilOf, alive: alive, coilFor: coilFor, canCut: canCut, cut: cut, file: file, glyph: glyph, stone: stone, ringD: ringD };
})();
if (typeof module !== 'undefined') module.exports = Runes;
