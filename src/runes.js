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
  { id: 'longbreath', name: 'Long breath', norse: 'Ansuz', side: 'heart', source: 'a runestone by the sea', text: 'You wade where others must swim: water twice as deep still carries you.', glyph: [[[2, 0], [2, 14]], [[2, 0], [8, 4]], [[2, 5], [8, 9]]] },
  // nineteen more (2026-10-08, Robin: thirty runes), each from a deed, a beast, a stone or a meeting, each changing what you do
  { id: 'keenedge', name: 'Keen edge', norse: 'Sowilo', side: 'hand', source: 'twenty-five slain', text: 'One blow in four lands a critical hit, not one in seven.', glyph: [[[7, 0], [3, 4], [7, 7], [3, 11], [7, 14]]] },
  { id: 'wolfshunger', name: 'Wolf’s hunger', norse: 'Fehu', side: 'hand', source: 'ten deer', text: 'Every beast you fell gives a little of its strength: eight health.', glyph: [[[2, 14], [2, 0]], [[2, 2], [8, 0]], [[2, 6], [8, 4]]] },
  { id: 'bowmanseye', name: 'Bowman’s eye', norse: 'Eihwaz', side: 'hand', source: 'twenty-five arrows loosed', text: 'Arrows bite a third harder, and every batch you fletch is half again as many.', glyph: [[[3, 0], [3, 14]], [[3, 0], [7, 3]], [[3, 14], [7, 11]]] },
  { id: 'lightstep', name: 'Light step', norse: 'Perthro', side: 'foot', source: 'a runestone', text: 'Beasts notice you from closer, and the troll barely at all.', glyph: [[[2, 0], [2, 14]], [[2, 0], [7, 3], [2, 6]], [[2, 8], [7, 11], [2, 14]]] },
  { id: 'longstride', name: 'Long stride', norse: 'Raido', side: 'foot', source: 'a long road walked', text: 'You walk a tenth faster, always.', glyph: [[[2, 14], [2, 0], [8, 3], [2, 7]], [[2, 7], [8, 14]], [[5, 10], [9, 10]]] },
  { id: 'sealegs', name: 'Sea legs', norse: 'Laguz', side: 'foot', source: 'the second island reached', text: 'Every vessel you steer goes a fifth faster.', glyph: [[[3, 14], [3, 0], [8, 4]], [[3, 7], [7, 10]]] },
  { id: 'nighteyes', name: 'Night eyes', norse: 'Dagaz', side: 'foot', source: 'ten days lived', text: 'In the dark you see twice as far without a torch.', glyph: [[[1, 0], [9, 14], [9, 0], [1, 14], [1, 0]]] },
  { id: 'woodsman', name: 'Woodsman', norse: 'Berkano', side: 'eye', source: 'fifty trees felled', text: 'The axe bites a quarter deeper.', glyph: [[[2, 0], [2, 14]], [[2, 0], [8, 3], [2, 7], [8, 11], [2, 14]]] },
  { id: 'quarryman', name: 'Quarryman', norse: 'Hagalaz', side: 'eye', source: 'thirty rocks broken', text: 'The pick bites a quarter deeper and every rock gives one stone more.', glyph: [[[1, 0], [1, 14]], [[9, 0], [9, 14]], [[1, 5], [9, 9]], [[1, 9], [9, 5]]] },
  { id: 'quickhands', name: 'Quick hands', norse: 'Kenaz', side: 'eye', source: 'thirty things made', text: 'Making and cooking take half the time.', glyph: [[[8, 0], [2, 7], [8, 14]], [[2, 7], [6, 7]]] },
  { id: 'deeppockets', name: 'Deep pockets', norse: 'Fehu', side: 'eye', source: 'a full bag', text: 'A stack in the bag holds forty, not twenty-five.', glyph: [[[2, 14], [2, 0]], [[2, 3], [8, 1]], [[2, 7], [8, 5]], [[2, 11], [8, 9]]] },
  { id: 'fisherspatience', name: 'Fisher’s patience', norse: 'Laguz', side: 'eye', source: 'ten fish landed', text: 'Fish bite twice as soon and the line bears more.', glyph: [[[3, 14], [3, 0], [8, 4]], [[1, 11], [5, 13], [9, 11]]] },
  { id: 'emberkeeper', name: 'Ember keeper', norse: 'Kenaz', side: 'eye', source: 'twenty lumps of charcoal', text: 'A torch burns twice as long, and every fire leaves twice the morning embers.', glyph: [[[8, 0], [2, 7], [8, 14]], [[4, 7], [8, 7]], [[6, 4], [8, 7], [6, 10]]] },
  { id: 'beefriend', name: 'Bee friend', norse: 'Jera', side: 'eye', source: 'honey from five nests', text: 'The bees let you take their honey and never chase you.', glyph: [[[3, 2], [7, 5], [3, 8]], [[7, 6], [3, 9], [7, 12]], [[5, 0], [5, 14]]] },
  { id: 'buildershand', name: 'Builder’s hand', norse: 'Othala', side: 'eye', source: 'fifty pieces built', text: 'Every building piece costs one wood or stone less.', glyph: [[[5, 0], [1, 5], [5, 10], [9, 5], [5, 0]], [[1, 5], [1, 14]], [[9, 5], [9, 14]]] },
  { id: 'thickskin', name: 'Thick skin', norse: 'Uruz', side: 'heart', source: 'a runestone', text: 'A tenth of every blow turns aside, over whatever you wear.', glyph: [[[1, 14], [1, 2], [9, 5], [9, 14]], [[1, 8], [9, 8]]] },
  { id: 'deepsleep', name: 'Deep sleep', norse: 'Dagaz', side: 'heart', source: 'ten nights in a bed', text: 'A night under a roof rests you twice as long.', glyph: [[[1, 0], [9, 14], [9, 0], [1, 14], [1, 0]], [[1, 7], [9, 7]]] },
  { id: 'ironstomach', name: 'Iron stomach', norse: 'Ingwaz', side: 'heart', source: 'twenty berries and eggs eaten', text: 'Berries, eggs and anything raw heal twice as much.', glyph: [[[5, 2], [1, 7], [5, 12], [9, 7], [5, 2]]] },
  { id: 'fellowship', name: 'Fellowship', norse: 'Mannaz', side: 'heart', source: 'the first hirdman', text: 'Hirdmen work a third faster at their jobs.', glyph: [[[1, 14], [1, 0], [9, 8]], [[9, 14], [9, 0], [1, 8]]] }
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
// The ring drawn large: a flat cuff seen a little from above, open at the right, with knotwork cut along the band and
// round hollows for the runes. A rune cut in a hollow fills it, reddened, with its glyph in the metal; an empty hollow is
// a dark recess with the first letter of its side. hov marks a hollow, glowIdx/glowT make one glow, fill (0..1) shows
// blood filling one. Returns the hollow positions for hit tests.
var RING_A0 = Math.PI * 0.22, RING_A1 = Math.PI * 1.78, RING_SQ = 0.72;
function ringHollowAngle(n, i) { var lo = RING_A0 + 0.42, hi = RING_A1 - 0.42; return n === 1 ? Math.PI * 1.5 : lo + (hi - lo) * i / (n - 1); }
function ringD(c, x, y, ring, R, hov, glowIdx, glowT, fill) {
  var m = METALS[ring ? ring.metal : 'bronze'] || METALS.bronze, n = ring ? ring.coils.length : 0, out = [], i, W = R * 0.42, a0 = RING_A0, a1 = RING_A1, SQ = RING_SQ;
  c.save(); c.translate(x, y);
  c.save(); c.scale(1, SQ); c.lineCap = 'butt';
  c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = W + R * 0.1; c.beginPath(); c.arc(0, R * 0.06, R, a0, a1); c.stroke();   // the shadow under it
  c.strokeStyle = m.dark; c.lineWidth = W + R * 0.07; c.beginPath(); c.arc(0, 0, R, a0, a1); c.stroke();                  // the dark edge
  c.strokeStyle = m.col; c.lineWidth = W; c.beginPath(); c.arc(0, 0, R, a0, a1); c.stroke();                               // the band
  c.strokeStyle = m.light; c.lineWidth = R * 0.035; c.beginPath(); c.arc(0, 0, R + W * 0.42, a0 + 0.1, a1 - 0.1); c.stroke();   // the lit outer rim
  c.strokeStyle = m.dark; c.lineWidth = R * 0.03; c.beginPath(); c.arc(0, 0, R - W * 0.42, a0 + 0.1, a1 - 0.1); c.stroke();     // the inner edge
  // the knotwork: two waves crossing along the band, cut dark with a lit edge below
  var k, a, steps = 64; c.lineCap = 'round'; c.lineJoin = 'round';
  [0, Math.PI].forEach(function (ph) {
    [[m.light, R * 0.05, 0.9], [m.dark, R * 0.035, 0]].forEach(function (st) {
      c.strokeStyle = st[0]; c.lineWidth = st[1]; c.beginPath();
      for (k = 0; k <= steps; k++) { a = a0 + 0.18 + (a1 - a0 - 0.36) * k / steps; var rr = R + Math.sin(a * 7 + ph) * W * 0.24 + st[2] * 0.5; var px = Math.cos(a) * rr, py = Math.sin(a) * rr + st[2]; if (k) c.lineTo(px, py); else c.moveTo(px, py); }
      c.stroke();
    });
  });
  // the cut ends: the band's thickness shows as a lighter face
  [a0, a1].forEach(function (ea) { c.save(); c.translate(Math.cos(ea) * R, Math.sin(ea) * R); c.rotate(ea); c.fillStyle = m.light; c.fillRect(-R * 0.03, -W / 2, R * 0.06, W); c.strokeStyle = m.dark; c.lineWidth = 0.8; c.strokeRect(-R * 0.03, -W / 2, R * 0.06, W); c.restore(); });
  c.restore();
  // the hollows, round, on the band
  for (i = 0; i < n; i++) {
    a = ringHollowAngle(n, i); var cx = Math.cos(a) * R, cy = Math.sin(a) * R * SQ, cr = W * 0.38, cl = ring.coils[i], on = !!cl.id && !!BY[cl.id];
    out.push({ i: i, x: x + cx, y: y + cy, r: cr * 1.5 });
    if (glowIdx === i && glowT > 0) { c.fillStyle = 'rgba(255,214,90,' + Math.min(0.7, glowT * 0.7) + ')'; c.beginPath(); c.arc(cx, cy, cr * (1.9 + glowT * 0.6), 0, 7); c.fill(); }
    c.fillStyle = m.dark; c.beginPath(); c.arc(cx, cy + 0.4, cr * 1.18, 0, 7); c.fill();                                     // the rim
    c.fillStyle = on ? '#7a1e12' : '#241610'; c.beginPath(); c.arc(cx, cy, cr, 0, 7); c.fill();                            // the hollow
    if (!on && glowIdx === i && fill > 0) { c.save(); c.beginPath(); c.arc(cx, cy, cr, 0, 7); c.clip(); c.fillStyle = '#9a2416'; c.fillRect(cx - cr, cy + cr - fill * cr * 2, cr * 2, cr * 2); c.restore(); }
    c.strokeStyle = hov === i ? '#ffd34d' : m.light; c.lineWidth = hov === i ? 1.4 : Math.max(0.5, cr * 0.1); c.beginPath(); c.arc(cx, cy, cr, 0, 7); c.stroke();
    if (on) glyph(c, BY[cl.id], cr * 1.35, m.light, Math.max(0.9, cr * 0.2));
    else { c.font = '600 ' + Math.max(5, cr * 0.95) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,220,170,0.28)'; c.fillText(SIDE_NAMES[cl.side][0], cx, cy + cr * 0.35); }
  }
  c.restore();
  return out;
}
// the points of the path blood takes to a hollow: along the top of the band from the mouth (the ring's top) to the hollow
function ringBloodPath(x, y, ring, R, idx) {
  var n = ring ? ring.coils.length : 0, pts = [], top = Math.PI * 1.5, h = ringHollowAngle(n, idx), k, steps = 24;
  for (k = 0; k <= steps; k++) { var a = top + (h - top) * k / steps; pts.push([x + Math.cos(a) * R, y + Math.sin(a) * R * RING_SQ]); }
  return pts;
}
return { LIST: LIST, BY: BY, SIDES: SIDES, SIDE_NAMES: SIDE_NAMES, METALS: METALS, METAL_ORDER: METAL_ORDER, newRing: newRing, coilOf: coilOf, alive: alive, coilFor: coilFor, canCut: canCut, cut: cut, file: file, glyph: glyph, stone: stone, ringD: ringD, ringBloodPath: ringBloodPath, hollowAngle: ringHollowAngle };
})();
if (typeof module !== 'undefined') module.exports = Runes;
