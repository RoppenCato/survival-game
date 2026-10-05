/* Runes: the skills. A rune is learnt (from a deed, a runestone, a beast, a person), never carried, and used by
   laying it in a hollow of its kind on the casting cloth. Shared by the game and, later, a rune editor.
   A rune: { id, name, norse, kind, text, active, cd, glyph }. kind: attack, guard, mobility, utility, hird.
   Actives (attack) are cast from the fight hotbar with a cooldown; the rest work while they lie on the cloth.
   A rune in use grows: its uses give it a tier (common, carved, legendary) and the tier a strength. */
var Runes = (function () {
'use strict';
var LIST = [
  { id: 'whirlwind', name: 'Whirlwind', norse: 'Thurisaz', kind: 'attack', active: true, cd: 8, text: 'A spinning blow that strikes everything around you.', glyph: [[[3, 0], [3, 14]], [[3, 3], [9, 7], [3, 11]]] },
  { id: 'pin', name: 'Pinning shot', norse: 'Isa', kind: 'attack', active: true, cd: 10, text: 'Your next arrow holds its target still for a moment.', glyph: [[[5, 0], [5, 14]]] },
  { id: 'bash', name: 'Shield bash', norse: 'Uruz', kind: 'attack', active: true, cd: 6, text: 'A short hard shove that staggers what stands before you.', glyph: [[[1, 14], [1, 2], [9, 5], [9, 14]]] },
  { id: 'shieldwall', name: 'Shield wall', norse: 'Algiz', kind: 'guard', text: 'Blocking costs half the stamina.', glyph: [[[5, 14], [5, 0]], [[1, 3], [5, 7], [9, 3]]] },
  { id: 'thickskin', name: 'Thick skin', norse: 'Berkano', kind: 'guard', text: 'A tenth of every blow is turned aside.', glyph: [[[2, 0], [2, 14]], [[2, 0], [8, 3], [2, 7], [8, 11], [2, 14]]] },
  { id: 'riposte', name: 'Riposte', norse: 'Tiwaz', kind: 'guard', text: 'A parry gives back stamina and a little health.', glyph: [[[5, 14], [5, 0]], [[1, 3], [5, 0], [9, 3]]] },
  { id: 'surefeet', name: 'Sure feet', norse: 'Raido', kind: 'mobility', text: 'You sprint a fifth faster.', glyph: [[[2, 14], [2, 0], [8, 3], [2, 7], [8, 14]]] },
  { id: 'longwind', name: 'Long wind', norse: 'Ansuz', kind: 'mobility', text: 'Stamina comes back half again as fast.', glyph: [[[2, 0], [2, 14]], [[2, 0], [8, 4]], [[2, 5], [8, 9]]] },
  { id: 'sprinter', name: 'Sprinter', norse: 'Ehwaz', kind: 'mobility', text: 'A dash costs half the stamina.', glyph: [[[1, 14], [1, 0], [5, 4], [9, 0], [9, 14]]] },
  { id: 'cleancut', name: 'Clean cut', norse: 'Gebo', kind: 'utility', text: 'The axe bites a third deeper into trees.', glyph: [[[1, 1], [9, 13]], [[9, 1], [1, 13]]] },
  { id: 'hardswing', name: 'Hard swing', norse: 'Hagalaz', kind: 'utility', text: 'The pick bites a third deeper into stone.', glyph: [[[1, 0], [1, 14]], [[9, 0], [9, 14]], [[1, 4], [9, 9]]] },
  { id: 'hearty', name: 'Hearty', norse: 'Jera', kind: 'utility', text: 'Meals last half again as long.', glyph: [[[3, 2], [7, 5], [3, 8]], [[7, 6], [3, 9], [7, 12]]] },
  { id: 'fletcher', name: 'Fletcher', norse: 'Kenaz', kind: 'utility', text: 'Every batch of arrows gives half again as many.', glyph: [[[8, 0], [2, 7], [8, 14]]] }
];
var BY = {}; LIST.forEach(function (r) { BY[r.id] = r; });
var KINDS = ['attack', 'guard', 'mobility', 'utility', 'hird'];
var KIND_NAMES = { attack: 'Attack', guard: 'Guard', mobility: 'Mobility', utility: 'Utility', hird: 'Hird' };
var TIERS = [{ at: 0, name: 'common', mul: 1 }, { at: 50, name: 'carved', mul: 1.25 }, { at: 200, name: 'legendary', mul: 1.5 }];
function tier(uses) { var t = TIERS[0]; TIERS.forEach(function (q) { if (uses >= q.at) t = q; }); return t; }
function next(uses) { for (var i = 0; i < TIERS.length; i++) if (uses < TIERS[i].at) return TIERS[i].at; return null; }
// the glyph: a futhark letter as strokes in a 10 by 14 box, drawn s tall about (0, 0)
function glyph(c, r, s, col, w) {
  var k = s / 14; c.save(); c.translate(-5 * k, -7 * k); c.strokeStyle = col; c.lineWidth = w || Math.max(0.8, s * 0.11); c.lineCap = 'round'; c.lineJoin = 'round';
  r.glyph.forEach(function (st) { c.beginPath(); st.forEach(function (p, i) { if (i) c.lineTo(p[0] * k, p[1] * k); else c.moveTo(p[0] * k, p[1] * k); }); c.stroke(); });
  c.restore();
}
// a rune stone: a rounded grey pebble with the glyph cut into it. state: 'dim' (heard of), 'learnt', 'slotted'
function stone(c, r, x, y, rad, state, tierName) {
  c.save(); c.translate(x, y);
  var dim = state === 'dim', gold = tierName === 'legendary', carved = tierName === 'carved';
  c.fillStyle = dim ? '#4a3f36' : (gold ? '#b89a4a' : (carved ? '#8d8f98' : '#7a7d86')); c.beginPath(); c.ellipse(0, 0, rad, rad * 0.88, 0.2, 0, 7); c.fill();
  c.strokeStyle = state === 'slotted' ? '#ffd34d' : 'rgba(20,12,8,0.7)'; c.lineWidth = state === 'slotted' ? 1.4 : 1; c.stroke();
  if (!dim) { c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(-rad * 0.3, -rad * 0.35, rad * 0.4, rad * 0.25, 0.2, 0, 7); c.fill(); }
  glyph(c, r, rad * 1.15, dim ? 'rgba(200,180,150,0.35)' : (gold ? '#3b2416' : '#2a1c14'));
  c.restore();
}
// a hollow on the cloth, shaped by its kind, with a stone laid in it or empty
function hollow(c, kind, x, y, rad, hov) {
  c.save(); c.translate(x, y);
  c.fillStyle = hov ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.38)'; c.strokeStyle = 'rgba(230,200,150,0.35)'; c.lineWidth = 0.9; c.setLineDash([2, 2]);
  c.beginPath();
  if (kind === 'attack') { c.moveTo(0, -rad); c.lineTo(rad * 0.9, 0); c.lineTo(0, rad); c.lineTo(-rad * 0.9, 0); c.closePath(); }
  else if (kind === 'guard') { c.moveTo(0, -rad); c.quadraticCurveTo(rad, -rad * 0.6, rad * 0.85, 0); c.quadraticCurveTo(rad * 0.7, rad * 0.7, 0, rad); c.quadraticCurveTo(-rad * 0.7, rad * 0.7, -rad * 0.85, 0); c.quadraticCurveTo(-rad, -rad * 0.6, 0, -rad); }
  else if (kind === 'mobility') { c.moveTo(-rad * 0.9, rad * 0.5); c.lineTo(rad * 0.9, rad * 0.5); c.lineTo(rad * 0.5, -rad); c.lineTo(-rad * 0.5, -rad); c.closePath(); }
  else if (kind === 'hird') { for (var i = 0; i < 6; i++) { var a = i / 6 * 6.283; if (i) c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); else c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); } c.closePath(); }
  else c.arc(0, 0, rad, 0, 7);
  c.fill(); c.stroke(); c.setLineDash([]);
  c.restore();
}
return { LIST: LIST, BY: BY, KINDS: KINDS, KIND_NAMES: KIND_NAMES, TIERS: TIERS, tier: tier, next: next, glyph: glyph, stone: stone, hollow: hollow };
})();
if (typeof module !== 'undefined') module.exports = Runes;
