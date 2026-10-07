/* Items: weapons and tools as things. An item is a plain spec:
     { kind, mat, name, desc, size, width, sharp, glow, twist, curl, hue }
   kind: sword, axe, pick, knife, bow    mat: wood, flint, copper, bronze, iron, silver, gold
   size and width are factors (1 is the plain item); sharp 0..1 brightens and tapers the edge; glow 0..1 makes it
   shine; twist bends the blade or haft; curl hooks the tip (a sword's point, an axe's beard, a bow's horns).
   Items.make builds one with the kind's and material's defaults, Items.name and Items.desc write a plain name and
   description ("Silver Axe"), Items.stats gives the numbers the game uses, Items.draw draws it in the hand and
   Items.icon draws it small for a slot. Shared by the engine (src/combat.js), the game and the Item Editor. */
var Items = (function () {
'use strict';
var LN = '#3a2a36';
var KINDS = {
  // melee: how each fights is in Combat's PROFILES (arc, reach, pace, motion); dmg here is the kind's share of the material's power
  sword: { name: 'Sword', len: 26, w: 3, dmg: 1, tool: null, melee: true, desc: 'A straight blade for the shield wall. Quick chains of three, and the surest parry.' },
  axe: { name: 'Axe', len: 15, w: 2.8, dmg: 1.2, tool: 'tree', melee: true, desc: 'For felling trees, and anything else that stands in the way. Hits harder than a sword, recovers slower, and breaks through a guard.' },
  club: { name: 'Club', len: 20, w: 3.4, dmg: 0.85, tool: null, melee: true, desc: 'A knotted length of hardwood. Slow, and it staggers and throws back whatever it lands on.' },
  seax: { name: 'Seax', len: 16, w: 2.6, dmg: 0.6, tool: null, melee: true, desc: 'The long knife every Norseman carries. Fast stabs, little reach, and it finds the gaps.' },
  spear: { name: 'Spear', len: 40, w: 2.2, dmg: 1.1, tool: null, melee: true, desc: 'The commonest weapon of the north. Long reach in a narrow line; it runs through one beast into the next.' },
  greataxe: { name: 'Dane axe', len: 34, w: 2.6, dmg: 2, tool: null, melee: true, desc: 'A great axe swung with both hands. Slow to lift, and nothing stands where it comes down.' },
  pick: { name: 'Pickaxe', len: 15, w: 2.8, dmg: 0.6, tool: 'stone', desc: 'Breaks stone from the rock.' },
  knife: { name: 'Knife', len: 10, w: 2.4, dmg: 0.5, tool: 'bush', desc: 'Cuts fiber, berries and rope.' },
  // ranged: the bow shoots the quiver, the sling throws stones from the bag, a javelin or throwing axe is thrown itself and lies where it falls
  bow: { name: 'Bow', len: 8, w: 2.4, dmg: 2, tool: null, ranged: true, desc: 'Bent wood and a string. Arrows come from the quiver.' },
  sling: { name: 'Sling', len: 7, w: 2, dmg: 0.9, tool: null, ranged: true, ammo: 'stone', desc: 'A cord and a pouch. It throws a stone from the bag hard enough to stun, and never runs out while there are stones.' },
  javelin: { name: 'Javelin', len: 30, w: 1.9, dmg: 1.8, tool: null, ranged: true, thrown: true, desc: 'A light spear made to be thrown. It flies true and hits hard, then has to be fetched.' },
  throwaxe: { name: 'Throwing axe', len: 12, w: 2.4, dmg: 1.6, tool: null, ranged: true, thrown: true, desc: 'A small axe balanced for the throw. Short range, a heavy blow, and it lies where it falls.' },
  // gear: worn, not held. armor is the share of a blow it turns aside
  helmet: { name: 'Helmet', len: 10, w: 2, dmg: 0, tool: null, gear: 'head', armor: 0.08, desc: 'Keeps the rain and the blows off your head.' },
  tunic: { name: 'Tunic', len: 10, w: 2, dmg: 0, tool: null, gear: 'chest', armor: 0.14, desc: 'Worn over the shirt.' },
  trousers: { name: 'Trousers', len: 10, w: 2, dmg: 0, tool: null, gear: 'legs', armor: 0.08, desc: 'For the legs.' },
  boots: { name: 'Boots', len: 10, w: 2, dmg: 0, tool: null, gear: 'feet', armor: 0.05, desc: 'Good on rock and in snow.' },
  cloak: { name: 'Cloak', len: 10, w: 2, dmg: 0, tool: null, gear: 'cloak', armor: 0.05, desc: 'Against the wind at sea.' },
  shield: { name: 'Shield', len: 10, w: 2, dmg: 0, tool: null, gear: 'shield', armor: 0.1, desc: 'A round shield with an iron boss, painted the way you like.' }
};
var MATS = {
  wood: { name: 'Wooden', face: '#b98a5a', dark: '#8a5a3a', edge: '#e9cfa0', glow: '255,230,170', power: 0.7, grain: true },
  flint: { name: 'Flint', face: '#6e6a6a', dark: '#3f3b3c', edge: '#b9b4b0', glow: '220,220,230', power: 0.85 },
  copper: { name: 'Copper', face: '#c8784a', dark: '#8a4a2a', edge: '#f0b48a', glow: '255,170,110', power: 1 },
  bronze: { name: 'Bronze', face: '#b8903f', dark: '#7a5a22', edge: '#efd27a', glow: '255,210,120', power: 1.15 },
  iron: { name: 'Iron', face: '#9ca3ad', dark: '#5c636c', edge: '#e6ebf2', glow: '200,220,255', power: 1.3, armor: 2.2 },   // armor: how much more a worn piece of it turns aside than leather (2026-10-07)
  silver: { name: 'Silver', face: '#d6dbe4', dark: '#8d94a0', edge: '#ffffff', glow: '220,235,255', power: 1.45 },
  gold: { name: 'Golden', face: '#e2b63a', dark: '#9a7418', edge: '#fff0a8', glow: '255,220,100', power: 1.6 },
  leather: { name: 'Leather', face: '#9a6a44', dark: '#5e3d26', edge: '#c9a07a', glow: '255,220,170', power: 0.9, grain: true, armor: 1 },
  wool: { name: 'Padded', face: '#c9bfa8', dark: '#8c8270', edge: '#ece6d6', glow: '255,240,220', power: 0.9, grain: true, armor: 1.35 },   // the gambeson: quilted wool and linen
  fur: { name: 'Fur', face: '#7a5a42', dark: '#46321f', edge: '#b59a80', glow: '255,230,200', power: 1 }
};
var DEF = { size: 1, width: 1, sharp: 0.5, glow: 0, twist: 0, curl: 0, hue: 0 };
var ORDER = ['sword', 'axe', 'club', 'seax', 'spear', 'greataxe', 'bow', 'sling', 'javelin', 'throwaxe', 'pick', 'knife', 'shield', 'helmet', 'tunic', 'trousers', 'boots', 'cloak'], MELEE = ['sword', 'axe', 'club', 'seax', 'spear', 'greataxe'], RANGED = ['bow', 'sling', 'javelin', 'throwaxe'], MORDER = ['wood', 'flint', 'copper', 'bronze', 'iron', 'silver', 'gold', 'leather', 'fur'];
function make(kind, mat, o) {
  var it = { kind: KINDS[kind] ? kind : 'sword', mat: MATS[mat] ? mat : 'iron' }, k;
  for (k in DEF) it[k] = DEF[k];
  for (k in o || {}) if (o[k] != null) it[k] = o[k];
  if (!it.name) it.name = name(it);
  if (!it.desc) it.desc = desc(it);
  return it;
}
function name(it) {
  if (it.mat === 'wood' && it.kind === 'sword') return 'Stick Sword';     // the first weapon: a sharpened branch
  if (it.mat === 'wood' && it.kind === 'bow') return 'Stick Bow';
  if (it.mat === 'wood' && it.kind === 'club') return 'Wooden Club';
  if (it.mat === 'iron' && it.kind === 'tunic') return 'Mail Shirt';           // the iron gear of the lowlands (2026-10-07)
  if (it.mat === 'iron' && it.kind === 'helmet') return 'Iron Helm';
  if (it.mat === 'iron' && it.kind === 'shield') return 'Painted Shield';
  if (it.mat === 'wool' && it.kind === 'tunic') return 'Gambeson';
  return MATS[it.mat].name + ' ' + KINDS[it.kind].name;
}
function desc(it) {
  var K = KINDS[it.kind], M = MATS[it.mat], s = K.desc, bits = [];
  if (it.mat === 'wood' && it.kind === 'sword') bits.push('A branch cut to a point and hardened in the fire. Good enough for a boar.');
  else if (it.mat === 'wood' && it.kind === 'bow') bits.push('A bent stick and a twist of fiber. It will do until something better is found.');
  else if (it.mat === 'wood' && it.kind === 'club') bits.push('A branch with a knot at the end, hardened in the fire. Good enough for a boar.');
  else if (it.mat === 'wood') bits.push('Wood where there should be metal: it will do until something better is found.');
  else if (it.mat === 'flint') bits.push('Knapped flint bound to a haft, the way the first people made them.');
  else if (it.mat === 'copper') bits.push('Soft red copper, the first metal. It bends before it breaks.');
  else if (it.mat === 'bronze') bits.push('Bronze, the metal of the old heroes. Heavy and sure.');
  else if (it.mat === 'iron' && it.kind === 'tunic') bits.push('Thousands of iron rings, each riveted to four others, over a padded shirt. A spear point slides off it; a blow still bruises.');
  else if (it.mat === 'iron' && it.kind === 'helmet') bits.push('A spangenhelm of four iron plates on a frame, with a bar down over the nose.');
  else if (it.mat === 'iron' && it.kind === 'shield') bits.push('Limewood boards behind an iron rim and boss, painted in your colours so the shield wall knows you.');
  else if (it.mat === 'wool' && it.kind === 'tunic') bits.push('Layers of wool and linen quilted thick. Warm, and it takes the sting out of a blow.');
  else if (it.mat === 'iron') bits.push('Honest iron from a bloomery: bog ore and charcoal, hammered into a bar and then into this.');
  else if (it.mat === 'silver') bits.push('Silver-bright. Made for a chieftain, or taken from one.');
  else bits.push('Gold does not hold an edge, but no one who sees it forgets it.');
  if (it.size >= 1.3) bits.push('Larger than most.'); else if (it.size <= 0.75) bits.push('Small enough to hide.');
  if (it.glow >= 0.5) bits.push('It shines with a light of its own.');
  if (Math.abs(it.twist) >= 0.5) bits.push('The ' + (it.kind === 'bow' ? 'limbs' : 'blade') + ' bend' + (it.kind === 'bow' ? '' : 's') + ' in a way no smith intended.');
  return s + ' ' + bits.join(' ');
}
// the numbers: damage and gathering power scale with material and size; sharpness helps the blade kinds
function stats(it) {
  var K = KINDS[it.kind], M = MATS[it.mat], sh = (K.ranged || it.kind === 'club') ? 1 : 0.8 + it.sharp * 0.4;
  var dmg = Math.round(K.dmg * M.power * (0.7 + it.size * 0.3) * sh * 100) / 100;
  return { dmg: dmg, power: Math.round(2 * M.power * (0.7 + it.size * 0.3) * sh * 10) / 10, tool: K.tool, reach: K.len * it.size, gear: K.gear || null, armor: K.gear ? Math.round(K.armor * (M.armor || M.power) * 100) / 100 : 0 };
}
function hsl(hex, dh) {                 // shift a colour's hue a little (hue is a small personal tint)
  if (!dh) return hex;
  var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
  if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  h = (h + dh + 360) % 360;
  function f(n) { var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l), v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); v = Math.round(v * 255).toString(16); return v.length < 2 ? '0' + v : v; }
  return '#' + f(0) + f(8) + f(4);
}
function pal(it) { var M = MATS[it.mat]; return { face: hsl(M.face, it.hue), dark: hsl(M.dark, it.hue), edge: hsl(M.edge, it.hue), glow: M.glow, grain: M.grain }; }
function strokeLn(c, x1, y1, x2, y2, col, w) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
function outlined(c, path, fill, lw) { path(); c.fillStyle = fill; c.fill(); c.strokeStyle = LN; c.lineWidth = lw || 1.2; c.stroke(); }

/* draw(c, it, hx, hy, ca, sa, len): the item in a hand at (hx, hy), pointing along (ca, sa), len long on screen.
   Drawn in the hand's frame: +x is along the item. */
function draw(c, it, hx, hy, ca, sa, len, mirror) {
  var P = pal(it), K = KINDS[it.kind], w = K.w * it.width, L = len == null ? K.len * it.size : len, i;
  c.save(); c.translate(hx, hy); c.transform(ca, sa, -sa, ca, 0, 0); if (mirror) c.scale(1, -1); c.lineCap = 'round'; c.lineJoin = 'round';
  if (it.glow > 0) { c.shadowColor = 'rgba(' + P.glow + ',' + (0.5 + it.glow * 0.5) + ')'; c.shadowBlur = 4 + it.glow * 10; }
  var tw = it.twist * L * 0.25, cu = it.curl;
  if (K.gear) { gear(c, it, P, K); c.restore(); return; }
  if (it.kind === 'sword') {
    // grip behind the hand, guard, then the blade: a tapered shape bent by twist, its point curled by curl
    strokeLn(c, -6, 0, 1, 0, LN, w + 2.4); strokeLn(c, -6, 0, 1, 0, '#8a5a3a', w);
    strokeLn(c, -7, 0, -7, 0, LN, w + 3); c.fillStyle = P.dark; c.beginPath(); c.arc(-7, 0, w * 0.75 + 0.6, 0, 7); c.fill(); c.strokeStyle = LN; c.lineWidth = 1; c.stroke();
    var g = w * 1.6 + 1.5; outlined(c, function () { c.beginPath(); c.rect(1.2, -g, 2.6, g * 2); }, P.dark, 1.2);
    var tipY = tw, hw = w * 0.9;
    outlined(c, function () { c.beginPath(); c.moveTo(3.8, -hw); c.quadraticCurveTo(L * 0.55, -hw + tw * 0.5, L - 3 * it.sharp - 1, tipY - hw * (0.4 - cu * 0.3)); c.quadraticCurveTo(L + cu * 3, tipY - cu * hw * 2, L, tipY); c.quadraticCurveTo(L - 2, tipY + hw * 0.5, L - 4, tipY + hw * 0.6); c.quadraticCurveTo(L * 0.55, hw + tw * 0.5, 3.8, hw); c.closePath(); }, P.face, 1.3);
    c.globalAlpha = 0.35 + it.sharp * 0.6; strokeLn(c, 5, -hw * 0.45, L - 4, tipY - hw * 0.3, P.edge, 0.9); c.globalAlpha = 1;
    strokeLn(c, 5, 0, L * 0.7, tw * 0.6, P.dark, 0.7);
  } else if (it.kind === 'axe' || it.kind === 'pick') {
    // haft from behind the hand to the head; twist bends it
    var hL = L, hx2 = hL, hy2 = tw;
    c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(-4, 0); c.quadraticCurveTo(hL * 0.5, tw * 0.9, hx2, hy2); c.stroke();
    c.strokeStyle = '#8a5a3a'; c.lineWidth = w; c.stroke();
    if (P.grain) { c.strokeStyle = 'rgba(60,35,20,0.35)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-3, 0.6); c.quadraticCurveTo(hL * 0.5, tw * 0.9 + 0.6, hx2 - 1, hy2 + 0.6); c.stroke(); }
    c.save(); c.translate(hx2, hy2);
    var s = 0.75 + it.size * 0.35, ww = 0.8 + it.width * 0.3;
    if (it.kind === 'axe') {
      // the head sits across the haft: bit on the near side, a beard that curls down with curl
      outlined(c, function () { c.beginPath(); c.moveTo(-5 * s, 0); c.lineTo(-2 * s, -8 * s * ww); c.quadraticCurveTo(4 * s, -9 * s * ww, 7 * s + cu * 2, -4 * s * ww); c.quadraticCurveTo(8 * s + cu * 4, 3 * s * ww + cu * 5 * s, 2 * s, 6 * s * ww + cu * 6 * s); c.lineTo(1.5 * s, 2 * s); c.lineTo(-5 * s, 2 * s); c.closePath(); }, P.face, 1.3);
      c.globalAlpha = 0.35 + it.sharp * 0.6; c.strokeStyle = P.edge; c.lineWidth = 1; c.beginPath(); c.moveTo(6 * s + cu * 2, -4.5 * s * ww); c.quadraticCurveTo(7.5 * s + cu * 4, 2 * s * ww + cu * 5 * s, 2.5 * s, 5.5 * s * ww + cu * 6 * s); c.stroke(); c.globalAlpha = 1;
      c.fillStyle = P.dark; c.fillRect(-5 * s, -1.5, 3.5 * s, 3.5);
    } else {
      // the head sits across the haft: a long point on the near side, a short flat bit on the far side; curl hooks the point down
      outlined(c, function () { c.beginPath(); c.moveTo(-2.2 * ww, -2.5 * s); c.lineTo(2.2 * ww, -2.5 * s); c.quadraticCurveTo(3.5 * ww + cu * 2, 3 * s, 1.2 * ww + cu * 3, 10 * s + cu * 2 * s); c.quadraticCurveTo(0.2, 4 * s, -1.6 * ww, 1.5 * s); c.quadraticCurveTo(-2.2 * ww, -1, -2.6 * ww, -5.5 * s); c.lineTo(0.4 * ww, -5.5 * s); c.lineTo(-0.4 * ww, -2.5 * s); c.closePath(); }, P.face, 1.3);
      c.globalAlpha = 0.35 + it.sharp * 0.6; c.strokeStyle = P.edge; c.lineWidth = 0.9; c.beginPath(); c.moveTo(1.8 * ww, -2 * s); c.quadraticCurveTo(2.8 * ww + cu * 2, 3 * s, 1 * ww + cu * 3, 9.3 * s + cu * 2 * s); c.stroke(); c.globalAlpha = 1;
      c.fillStyle = P.dark; c.fillRect(-1.6, -3 * s, 3.2, 3.5 * s);
    }
    c.restore();
  } else if (it.kind === 'club') {
    // a knotted stick: thicker toward the end, a knob at the tip, bands of bark
    outlined(c, function () { c.beginPath(); c.moveTo(-6, -w * 0.45); c.quadraticCurveTo(L * 0.5, -w * 0.7 + tw * 0.4, L - 4, -w * 1.1 + tw); c.quadraticCurveTo(L + 1, -w * 0.9 + tw, L + 1, tw); c.quadraticCurveTo(L + 1, w * 0.9 + tw, L - 4, w * 1.1 + tw); c.quadraticCurveTo(L * 0.5, w * 0.7 + tw * 0.4, -6, w * 0.45); c.closePath(); }, it.mat === 'wood' ? '#8a5a3a' : P.face, 1.2);
    c.strokeStyle = 'rgba(40,25,15,0.45)'; c.lineWidth = 0.8; for (i = 0; i < 3; i++) { var bx = L * (0.35 + i * 0.2); c.beginPath(); c.moveTo(bx, -w * 0.7); c.lineTo(bx + 1, w * 0.7); c.stroke(); }
    if (it.mat !== 'wood') { c.fillStyle = P.dark; for (i = 0; i < 4; i++) { c.beginPath(); c.arc(L - 3 - i * 2.2, tw + (i % 2 ? 1.2 : -1.2), 0.9, 0, 7); c.fill(); } }   // iron studs on a metal-shod club
  } else if (it.kind === 'seax') {
    strokeLn(c, -5, 0, 1, 0, LN, w + 2.2); strokeLn(c, -5, 0, 1, 0, '#8a5a3a', w);
    var sw = w * 0.8;                        // the broken-back blade: a straight edge, the back angling down to the point
    outlined(c, function () { c.beginPath(); c.moveTo(0.5, -sw); c.lineTo(L * 0.62, -sw + tw * 0.5); c.lineTo(L, tw + sw * 0.4 - cu * sw); c.lineTo(0.5, sw); c.closePath(); }, P.face, 1.1);
    c.globalAlpha = 0.35 + it.sharp * 0.6; strokeLn(c, 1.5, sw * 0.55, L - 1.5, tw + sw * 0.3, P.edge, 0.8); c.globalAlpha = 1;
  } else if (it.kind === 'spear' || it.kind === 'javelin') {
    // a long shaft with a leaf-shaped head; the javelin is thinner with a small point
    var jav = it.kind === 'javelin', hl2 = jav ? 6 : 9, hw2 = (jav ? 1.6 : 2.6) * (0.8 + it.width * 0.2);
    c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(-8, 0); c.quadraticCurveTo(L * 0.5, tw * 0.9, L - hl2, tw); c.stroke(); c.strokeStyle = '#8a5a3a'; c.lineWidth = w; c.stroke();
    c.save(); c.translate(L - hl2, tw);
    outlined(c, function () { c.beginPath(); c.moveTo(-1, 0); c.quadraticCurveTo(hl2 * 0.35, -hw2 - cu, hl2, -cu * hw2 * 0.5); c.quadraticCurveTo(hl2 * 0.35, hw2 - cu * 0.5, -1, 0); c.closePath(); }, P.face, 1.1);
    c.globalAlpha = 0.35 + it.sharp * 0.6; strokeLn(c, 0, 0, hl2 - 1, -cu * hw2 * 0.4, P.edge, 0.7); c.globalAlpha = 1;
    c.fillStyle = P.dark; c.fillRect(-2.5, -w * 0.9, 2.2, w * 1.8);
    c.restore();
  } else if (it.kind === 'greataxe' || it.kind === 'throwaxe') {
    // the axe head drawn big on a long haft (the Dane axe), or small on a short one (the throwing axe)
    var ga = it.kind === 'greataxe', hs = (ga ? 1.35 : 0.8) * (0.75 + it.size * 0.35), ww2 = 0.8 + it.width * 0.3, hx3 = L, hy3 = tw;
    c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(L * 0.5, tw * 0.9, hx3, hy3); c.stroke(); c.strokeStyle = '#8a5a3a'; c.lineWidth = w; c.stroke();
    c.save(); c.translate(hx3 - (ga ? 4 : 2), hy3);
    outlined(c, function () { c.beginPath(); c.moveTo(-5 * hs, 0); c.lineTo(-2 * hs, -8 * hs * ww2); c.quadraticCurveTo(4 * hs, -9 * hs * ww2, 7 * hs + cu * 2, -4 * hs * ww2); c.quadraticCurveTo(8 * hs + cu * 4, 4 * hs * ww2 + cu * 5 * hs, 2 * hs, 7 * hs * ww2 + cu * 6 * hs); c.lineTo(1.5 * hs, 2 * hs); c.lineTo(-5 * hs, 2 * hs); c.closePath(); }, P.face, 1.2);
    c.globalAlpha = 0.35 + it.sharp * 0.6; c.strokeStyle = P.edge; c.lineWidth = 1; c.beginPath(); c.moveTo(6 * hs + cu * 2, -4.5 * hs * ww2); c.quadraticCurveTo(7.5 * hs + cu * 4, 3 * hs * ww2 + cu * 5 * hs, 2.5 * hs, 6.5 * hs * ww2 + cu * 6 * hs); c.stroke(); c.globalAlpha = 1;
    c.fillStyle = P.dark; c.fillRect(-5 * hs, -1.5, 3.5 * hs, 3.5);
    c.restore();
  } else if (it.kind === 'sling') {
    // a cord looped over the hand with a leather pouch hanging at its end
    c.strokeStyle = LN; c.lineWidth = 2.6; c.beginPath(); c.moveTo(-3, -2); c.quadraticCurveTo(L * 0.5, -4 + tw, L, tw); c.moveTo(-3, 2); c.quadraticCurveTo(L * 0.5, 4 + tw, L, tw); c.stroke();
    c.strokeStyle = '#d9c9a6'; c.lineWidth = 1; c.stroke();
    outlined(c, function () { c.beginPath(); c.ellipse(L + 1, tw, 3.2, 2.2, 0.2, 0, 7); }, '#9a6a44', 1);
  } else if (it.kind === 'knife') {
    strokeLn(c, -4.5, 0, 1, 0, LN, w + 2.2); strokeLn(c, -4.5, 0, 1, 0, '#8a5a3a', w);
    var kw = w * 0.75;
    outlined(c, function () { c.beginPath(); c.moveTo(0.5, -kw); c.quadraticCurveTo(L * 0.6, -kw + tw, L, tw - cu * kw); c.quadraticCurveTo(L * 0.6, kw * 0.8 + tw * 0.5, 0.5, kw * 0.9); c.closePath(); }, P.face, 1.1);
    c.globalAlpha = 0.35 + it.sharp * 0.6; strokeLn(c, 1.5, -kw * 0.4, L - 1.5, tw - kw * 0.3, P.edge, 0.8); c.globalAlpha = 1;
  } else {
    // the bow stands across the hand: two limbs curving forward, horns curling with curl, a string between the tips
    var r = L * it.size * (0.9 + it.width * 0.1), bend = 5 + tw;
    c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(bend, -r * 0.5, bend, 0); c.quadraticCurveTo(bend, r * 0.5, 0, r);
    c.strokeStyle = LN; c.lineWidth = w + 2; c.stroke(); c.strokeStyle = P.face; c.lineWidth = w; c.stroke();
    if (cu > 0) { c.strokeStyle = LN; c.lineWidth = w + 1.6; c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(-cu * 3, -r - cu * 2, -cu * 4, -r + cu * 2); c.moveTo(0, r); c.quadraticCurveTo(-cu * 3, r + cu * 2, -cu * 4, r - cu * 2); c.stroke(); c.strokeStyle = P.face; c.lineWidth = w - 0.4; c.stroke(); }
    strokeLn(c, 0.5, -r, 0.5, r, '#efe6cf', 0.8);
    c.fillStyle = P.dark; c.fillRect(bend - 1.6, -3, 3.2, 6);
    c.globalAlpha = 0.3 + it.sharp * 0.4; strokeLn(c, bend - 0.6, -r * 0.4, bend - 0.6, r * 0.4, P.edge, 0.7); c.globalAlpha = 1;
  }
  c.restore();
}
// worn things, drawn upright about (0, 0), about 14 tall
function gear(c, it, P, K) {
  var s = 0.8 + it.size * 0.2;
  c.save(); c.scale(s, s); c.lineJoin = 'round';
  if (it.kind === 'helmet') { outlined(c, function () { c.beginPath(); c.moveTo(-6, 2); c.quadraticCurveTo(-6, -7, 0, -7); c.quadraticCurveTo(6, -7, 6, 2); c.closePath(); }, P.face, 1.2); c.fillStyle = P.dark; c.fillRect(-6.5, 1.5, 13, 2.2); c.fillRect(-1, -7, 2, 9); }
  else if (it.kind === 'tunic') { outlined(c, function () { c.beginPath(); c.moveTo(-6, -6); c.lineTo(-2.5, -7); c.quadraticCurveTo(0, -5, 2.5, -7); c.lineTo(6, -6); c.lineTo(7.5, -2); c.lineTo(5, -1); c.lineTo(5, 7); c.lineTo(-5, 7); c.lineTo(-5, -1); c.lineTo(-7.5, -2); c.closePath(); }, P.face, 1.2); c.fillStyle = P.dark; c.fillRect(-5, 3.5, 10, 1.6); }
  else if (it.kind === 'trousers') { outlined(c, function () { c.beginPath(); c.moveTo(-5, -7); c.lineTo(5, -7); c.lineTo(5.5, 7); c.lineTo(1.5, 7); c.lineTo(0, -1); c.lineTo(-1.5, 7); c.lineTo(-5.5, 7); c.closePath(); }, P.face, 1.2); c.fillStyle = P.dark; c.fillRect(-5, -7, 10, 1.8); }
  else if (it.kind === 'boots') { [-4.5, 3].forEach(function (x) { outlined(c, function () { c.beginPath(); c.moveTo(x - 2.5, -6); c.lineTo(x + 1.5, -6); c.lineTo(x + 1.5, 1); c.lineTo(x + 5, 3.5); c.lineTo(x + 5, 6); c.lineTo(x - 2.5, 6); c.closePath(); }, P.face, 1.1); c.fillStyle = P.dark; c.fillRect(x - 2.5, 4.3, 7.5, 1.7); }); }
  else if (it.kind === 'cloak') { outlined(c, function () { c.beginPath(); c.moveTo(-3, -7); c.lineTo(3, -7); c.quadraticCurveTo(5, -2, 7, 7); c.lineTo(-7, 7); c.quadraticCurveTo(-5, -2, -3, -7); c.closePath(); }, P.face, 1.2); c.fillStyle = P.edge; c.beginPath(); c.arc(0, -6, 1.6, 0, 7); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-2, -4); c.lineTo(-3.5, 6); c.moveTo(2, -4); c.lineTo(3.5, 6); c.stroke(); }
  else if (it.kind === 'shield') { outlined(c, function () { c.beginPath(); c.arc(0, 0, 7.5, 0, 7); }, P.face, 1.3); c.fillStyle = P.dark; c.beginPath(); c.arc(0, 0, 7.5, -0.3, 1.27); c.lineTo(0, 0); c.fill(); c.beginPath(); c.arc(0, 0, 7.5, 2.84, 4.41); c.lineTo(0, 0); c.fill(); c.fillStyle = '#9ca3ad'; c.beginPath(); c.arc(0, 0, 2.2, 0, 7); c.fill(); c.strokeStyle = LN; c.lineWidth = 0.9; c.stroke(); }
  c.restore();
}
// icon(c, it, s): the item in a slot, handle at lower left and tip at upper right, about s wide
function icon(c, it, s) {
  var K = KINDS[it.kind], L = K.len * (it.kind === 'bow' ? 1 : it.size), span = it.kind === 'bow' ? L * it.size * 2.2 : L + 7 + (it.kind === 'greataxe' ? 8 : 0), k = (s || 14) / span;
  c.save(); c.scale(k, k);
  if (K.gear) draw(c, it, 0, 0, 1, 0, null);
  else if (it.kind === 'bow') draw(c, it, 1, 0, 1, 0, L); else draw(c, it, -(L - 7) / 2 * 0.7, (L - 7) / 2 * 0.7, 0.7071, -0.7071, L);
  c.restore();
}
return { KINDS: KINDS, MATS: MATS, DEF: DEF, ORDER: ORDER, MELEE: MELEE, RANGED: RANGED, MORDER: MORDER, make: make, name: name, desc: desc, stats: stats, pal: pal, draw: draw, icon: icon };
})();
if (typeof module !== 'undefined') module.exports = Items;
