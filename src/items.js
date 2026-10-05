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
  sword: { name: 'Sword', len: 26, w: 3, dmg: 1, tool: null, desc: 'A straight blade for the shield wall.' },
  axe: { name: 'Axe', len: 15, w: 2.8, dmg: 0.9, tool: 'tree', desc: 'For felling trees, and anything else that stands in the way.' },
  pick: { name: 'Pickaxe', len: 15, w: 2.8, dmg: 0.6, tool: 'stone', desc: 'Breaks stone from the rock.' },
  knife: { name: 'Knife', len: 10, w: 2.4, dmg: 0.5, tool: 'bush', desc: 'Cuts fiber, berries and rope.' },
  bow: { name: 'Bow', len: 8, w: 2.4, dmg: 1, tool: null, desc: 'Bent wood and a string. Arrows come from the quiver.' }
};
var MATS = {
  wood: { name: 'Wooden', face: '#b98a5a', dark: '#8a5a3a', edge: '#e9cfa0', glow: '255,230,170', power: 0.7, grain: true },
  flint: { name: 'Flint', face: '#6e6a6a', dark: '#3f3b3c', edge: '#b9b4b0', glow: '220,220,230', power: 0.85 },
  copper: { name: 'Copper', face: '#c8784a', dark: '#8a4a2a', edge: '#f0b48a', glow: '255,170,110', power: 1 },
  bronze: { name: 'Bronze', face: '#b8903f', dark: '#7a5a22', edge: '#efd27a', glow: '255,210,120', power: 1.15 },
  iron: { name: 'Iron', face: '#9ca3ad', dark: '#5c636c', edge: '#e6ebf2', glow: '200,220,255', power: 1.3 },
  silver: { name: 'Silver', face: '#d6dbe4', dark: '#8d94a0', edge: '#ffffff', glow: '220,235,255', power: 1.45 },
  gold: { name: 'Golden', face: '#e2b63a', dark: '#9a7418', edge: '#fff0a8', glow: '255,220,100', power: 1.6 }
};
var DEF = { size: 1, width: 1, sharp: 0.5, glow: 0, twist: 0, curl: 0, hue: 0 };
var ORDER = ['sword', 'axe', 'pick', 'knife', 'bow'], MORDER = ['wood', 'flint', 'copper', 'bronze', 'iron', 'silver', 'gold'];
function make(kind, mat, o) {
  var it = { kind: KINDS[kind] ? kind : 'sword', mat: MATS[mat] ? mat : 'iron' }, k;
  for (k in DEF) it[k] = DEF[k];
  for (k in o || {}) if (o[k] != null) it[k] = o[k];
  if (!it.name) it.name = name(it);
  if (!it.desc) it.desc = desc(it);
  return it;
}
function name(it) { return MATS[it.mat].name + ' ' + KINDS[it.kind].name; }
function desc(it) {
  var K = KINDS[it.kind], M = MATS[it.mat], s = K.desc, bits = [];
  if (it.mat === 'wood') bits.push('Wood where there should be metal: it will do until something better is found.');
  else if (it.mat === 'flint') bits.push('Knapped flint bound to a haft, the way the first people made them.');
  else if (it.mat === 'copper') bits.push('Soft red copper, the first metal. It bends before it breaks.');
  else if (it.mat === 'bronze') bits.push('Bronze, the metal of the old heroes. Heavy and sure.');
  else if (it.mat === 'iron') bits.push('Honest iron from a Norse forge.');
  else if (it.mat === 'silver') bits.push('Silver-bright. Made for a chieftain, or taken from one.');
  else bits.push('Gold does not hold an edge, but no one who sees it forgets it.');
  if (it.size >= 1.3) bits.push('Larger than most.'); else if (it.size <= 0.75) bits.push('Small enough to hide.');
  if (it.glow >= 0.5) bits.push('It shines with a light of its own.');
  if (Math.abs(it.twist) >= 0.5) bits.push('The ' + (it.kind === 'bow' ? 'limbs' : 'blade') + ' bend' + (it.kind === 'bow' ? '' : 's') + ' in a way no smith intended.');
  return s + ' ' + bits.join(' ');
}
// the numbers: damage and gathering power scale with material and size; sharpness helps the blade kinds
function stats(it) {
  var K = KINDS[it.kind], M = MATS[it.mat], sh = it.kind === 'bow' ? 1 : 0.8 + it.sharp * 0.4;
  var dmg = Math.round(K.dmg * M.power * (0.7 + it.size * 0.3) * sh * 100) / 100;
  return { dmg: dmg, power: Math.round(2 * M.power * (0.7 + it.size * 0.3) * sh * 10) / 10, tool: K.tool, reach: K.len * it.size };
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
// icon(c, it, s): the item in a slot, handle at lower left and tip at upper right, about s wide
function icon(c, it, s) {
  var K = KINDS[it.kind], L = K.len * (it.kind === 'bow' ? 1 : it.size), span = it.kind === 'bow' ? L * it.size * 2.2 : L + 7, k = (s || 14) / span;
  c.save(); c.scale(k, k);
  if (it.kind === 'bow') draw(c, it, 1, 0, 1, 0, L); else draw(c, it, -(L - 7) / 2 * 0.7, (L - 7) / 2 * 0.7, 0.7071, -0.7071, L);
  c.restore();
}
return { KINDS: KINDS, MATS: MATS, DEF: DEF, ORDER: ORDER, MORDER: MORDER, make: make, name: name, desc: desc, stats: stats, pal: pal, draw: draw, icon: icon };
})();
if (typeof module !== 'undefined') module.exports = Items;
