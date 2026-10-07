/* Gather: chopping, mining and cutting as a small game of their own (Robin, 2026-10-07: satisfying and interesting, never
   bothersome). One spec of switches and numbers (DEF), tuned in the Gathering Editor and handed to the game as game.gather.
   What it adds on top of hit points:
   - the sweet spot: a glint on one side of a tree or a rock; a blow from that side bites spotBonus times deeper
   - rhythm: a blow landed as the last one's recoil settles (rhythmAfter .. +rhythmWindow seconds) is a clean hit
   - a felled tree is a thing: it falls away from you, fells the trees it lands on (fallFells), hurts you if you stand
     where it lands (fallHurts), and lies as a trunk to be chopped into logs (trunks), one log every chopsPerLog blows
   - now and then a felled tree drops what lived in it (nests): eggs, or honey with angry bees
   - stumps grow back (regrow) after regrowDays, as a sapling that grows up
   - rocks have a crack (cracks): a blow on the crack's side splits deeper, crackBonus times
   The page gives hit() and tick() what they need in ctx: the hero, the blow's direction, the sprite's size, the clock,
   and callbacks (chip, drop, sfx, hurt, spawn, decal, fell, note). Shared by the game and the editor; tests in tests/gather.js. */
var Gather = (function () {
'use strict';
var K = 0.75;
var DEF = {
  sweetSpot: 1, spotBonus: 2, spotWander: 1, spotLook: 1, crackLook: 1, pace: 2,
  rhythm: 1, rhythmAfter: 0.45, rhythmWindow: 0.3, rhythmBonus: 1.5,
  fallFells: 1, fallReach: 1, fallHurts: 1, fallDamage: 12,
  trunks: 1, logsPerTrunk: 2, chopsPerLog: 2,
  nests: 1, nestChance: 0.15,
  regrow: 1, regrowDays: 3,
  cracks: 1, crackBonus: 2.5,
  treeHp: 1, rockHp: 1, bushHp: 1, chips: 1
};
// how the sweet spot shows: on a tree TREE_LOOK (glint, a scar on the bark, the tree leaning toward it, the sunny side), on a
// rock ROCK_LOOK (the crack drawn, a pale vein, a patch of moss, the lit facet); 0 is no cue. The sunny side and the lit
// facet are fixed and never wander: the cue is the light itself. With cracks on, a rock's sweet spot is its crack.
var TREE_LOOK = ['none', 'glint', 'scar', 'lean', 'sun'], ROCK_LOOK = ['none', 'crack', 'vein', 'moss', 'lit'], SUN_SIDE = -1, LIT_ANG = -Math.PI * 0.75;
function cfg(o) { var out = {}, k; for (k in DEF) out[k] = DEF[k]; for (k in o || {}) if (o[k] != null && DEF[k] != null) out[k] = +o[k]; return out; }
function hash(a, b, c) { var v = Math.sin(a * 12.9898 + b * 78.233 + (c || 0) * 37.719) * 43758.5453; return v - Math.floor(v); }
// the sweet spot: for a tree the side of the trunk (-1 left, 1 right) the glint sits on, wandering every few seconds;
// for a rock the facet it sits on, as an angle round the rock (0 is east)
function spot(G, o, t) {
  if (!G.sweetSpot) return null;
  var seed = hash(Math.round(o.x), Math.round(o.y), 3), fixed = o.kind === 'tree' ? G.spotLook >= 3 : G.crackLook === 4, step = G.spotWander && !fixed ? Math.floor((t + seed * 9) / 7) : 0;
  if (o.kind === 'tree') return { side: G.spotLook === 4 ? SUN_SIDE : (hash(seed * 100, step, 5) < 0.5 ? -1 : 1) };
  if (o.kind === 'stone') { if (G.cracks) return null; return { ang: G.crackLook === 4 ? LIT_ANG : hash(seed * 100, step, 6) * 6.283 }; }
  return null;
}
function spotHit(G, o, t, hero) {              // does a blow from where the hero stands land on the sweet spot?
  var sp = spot(G, o, t); if (!sp) return false;
  if (o.kind === 'tree') return (hero.x < o.x ? -1 : 1) === sp.side;
  if (o.kind === 'stone') { var a = Math.atan2((hero.y - o.y) * K, hero.x - o.x), d = Math.atan2(Math.sin(a - sp.ang), Math.cos(a - sp.ang)); return Math.abs(d) < 0.9; }
  return false;
}
function crackAng(G, o) { return G && G.crackLook === 4 ? LIT_ANG : hash(Math.round(o.x) + 1, Math.round(o.y), 4) * 6.283; }
function crackHit(G, o, hero) { if (!G.cracks || o.kind !== 'stone') return false; var ca = crackAng(G, o), a = Math.atan2((hero.y - o.y) * K, hero.x - o.x), d = Math.atan2(Math.sin(a - ca), Math.cos(a - ca)); return Math.abs(d) < 0.75; }
function rhythmHit(G, o, t) { if (!G.rhythm || o.lastHit == null) return false; var dt = t - o.lastHit; return dt >= G.rhythmAfter && dt <= G.rhythmAfter + G.rhythmWindow; }
var TREE_WOOD = { oak: 14, pine: 11, birch: 9 }, ROCK_STONE = { rock: 3, rockFormation: 6 };
function treeLen(s, o) { return -s.t * o.s * 0.8; }   // how far along the ground the trunk reaches when it lies
// One blow. ctx: { power, right, hero, t, s (sprite bounds), ev }. Returns what happened: { mult, spot, rhythm, crack, felled }.
function hit(G, o, ctx) {
  var ev = ctx.ev, out = { mult: 1, spot: false, rhythm: false, crack: false, felled: false, broke: false }, hero = ctx.hero, t = ctx.t;
  if (o.kind === 'trunk') return chopTrunk(G, o, ctx);
  if (spotHit(G, o, t, hero)) { out.mult *= G.spotBonus; out.spot = true; }
  if (rhythmHit(G, o, t)) { out.mult *= G.rhythmBonus; out.rhythm = true; }
  if (crackHit(G, o, hero)) { out.mult *= G.crackBonus; out.crack = true; }
  o.lastHit = t;
  var dmg = ctx.power * out.mult; o.hp -= dmg; o.shake = 0.3; o.leanDir = o.x >= hero.x ? 1 : -1; out.dealt = dmg;
  if (ev && ev.chip && G.chips) {
    var n = Math.round((ctx.right ? 4 : 2) * (out.spot || out.crack ? 2 : 1) * G.chips), top = ctx.s ? o.y * K + ctx.s.t * o.s : o.y * K - 30;
    if (o.kind === 'tree') { ev.chip(o.x, o.y, (o.y * K - top) * 0.6, '#6fb84f', 4, 50); ev.chip(o.x, o.y, 8, '#d9b37a', n, 70); }
    else if (o.kind === 'stone') ev.chip(o.x, o.y, 6, '#b8b4b0', n + 1, 80);
    else ev.chip(o.x, o.y, 6, '#7fc26a', 4, 55);
  }
  if (o.hp <= 0) {
    o.dying = 0; out.felled = o.kind === 'tree'; out.broke = o.kind !== 'tree';
    if (o.kind === 'stone' && ev) { if (ev.chip) ev.chip(o.x, o.y, 8, '#9d9995', 14, 110); if (ev.drop) ev.drop('stone', o.x, o.y, ROCK_STONE[o.name] || 3); }
    else if (o.kind === 'bush' && ev && ev.drop) { if (o.name === 'berryBush') { ev.drop('berries', o.x, o.y, 3); ev.drop('fiber', o.x, o.y, 1); } else ev.drop('fiber', o.x, o.y, 2); }
  }
  return out;
}
// The fall, stepped each frame while o.dying runs: at 0.95 the trunk hits the ground. ctx: { hero, trees (the trees near, for
// the chain), ev }. Returns true when the prop is done and may go.
function tick(G, o, dt, ctx) {
  if (o.dying == null) return false;
  o.dying += dt; var ev = ctx.ev || {};
  var done = o.kind === 'tree' ? 1.3 : (o.kind === 'stone' ? 0.4 : 0.3);
  if (o.kind === 'tree' && o.dying >= 0.95 && !o.dropped) {
    o.dropped = true; var s = ctx.s, len = s ? treeLen(s, o) : 60, dir = o.leanDir || 1, wood = TREE_WOOD[o.name] || 4;
    if (ev.sfx) ev.sfx('fall'); if (ev.chip) ev.chip(o.x + dir * len * 0.5, o.y, 4, '#6fb84f', 10, 70);
    if (ev.decal) ev.decal({ x: o.x, y: o.y, r: 5 * o.s + 2, name: o.name, s: o.s });
    if (G.trunks && ev.spawn) ev.spawn({ name: 'trunk', kind: 'trunk', tree: o.name, x: o.x + dir * len * 0.5, y: o.y + 1, dir: dir, len: len * 0.9, logs: G.logsPerTrunk, woodEach: Math.max(1, Math.round(wood / G.logsPerTrunk)), chops: 0, hp: 9999, max: 9999, s: o.s, r: 0, v: 0, lastHit: null });
    else if (ev.drop) ev.drop('wood', o.x + dir * len * 0.6, o.y, wood);
    if (G.nests && ev.drop && hash(Math.round(o.x), Math.round(o.y), 8) < G.nestChance) { var honey = hash(Math.round(o.y), Math.round(o.x), 9) < 0.4; ev.drop(honey ? 'honey' : 'eggs', o.x + dir * len * 0.3, o.y, honey ? 1 : 2); if (honey && ev.bees) ev.bees(o.x + dir * len * 0.3, o.y); if (ev.note) ev.note(o.x + dir * len * 0.3, o.y - 20, honey ? 'a bees’ nest' : 'a nest', '#ffd34d'); }
    // what lies in the line it fell along: trees come down after it, the hero is struck
    var x0 = o.x + dir * 12, x1 = o.x + dir * len, lo = Math.min(x0, x1), hi = Math.max(x0, x1);
    if (G.fallFells && ctx.trees) ctx.trees.forEach(function (q) { if (q === o || q.kind !== 'tree' || q.dying != null) return; if (q.x >= lo - 4 && q.x <= hi + 4 && Math.abs(q.y - o.y) < 22 * G.fallReach) { q.hp = 0; q.dying = 0; q.leanDir = dir; q.chained = true; if (ev.fell) ev.fell(q); } });
    if (G.fallHurts && ctx.hero && ev.hurt) { var h = ctx.hero; if (h.x >= lo - 6 && h.x <= hi + 6 && Math.abs(h.y - o.y) < 16) ev.hurt(G.fallDamage, o.x, o.y, dir); }
  }
  return o.dying >= done;
}
// Chopping a trunk: every chopsPerLog blows a log rolls out at its far end and it shortens; the last log takes it away.
function chopTrunk(G, o, ctx) {
  var ev = ctx.ev || {}, out = { mult: 1, rhythm: rhythmHit(G, o, ctx.t), log: false, gone: false };
  o.lastHit = ctx.t; o.shake = 0.25; o.chops += out.rhythm ? 2 : 1;
  if (ev.chip) ev.chip(o.x, o.y, 6, '#d9b37a', 4, 70);
  if (o.chops >= G.chopsPerLog) { o.chops = 0; o.logs--; out.log = true; if (ev.drop) ev.drop('wood', o.x + o.dir * o.len * 0.5, o.y + 2, o.woodEach); if (ev.sfx) ev.sfx('fall'); o.len *= Math.max(0.35, (o.logs) / (o.logs + 1)); if (o.logs <= 0) { out.gone = true; o.dying = 0; } }
  return out;
}
// A stump grows back: after regrowDays it is a sapling, then a tree over as many days again. The page keeps the stumps
// (decals with the day they were made) and calls this each new day; it returns the ones that have become trees.
function regrowTick(G, stumps, dayN, plant) {
  var out = [];
  if (!G.regrow) return out;
  for (var i = stumps.length - 1; i >= 0; i--) { var st = stumps[i]; if (st.day == null || !st.name) continue; if (dayN - st.day >= G.regrowDays) { var p = plant(st); if (p) { p.grow = 0; out.push(p); stumps.splice(i, 1); } } }
  return out;
}
/* drawing */
function drawProp(c, o, s, px, py, w, h, P, G, t, dark) {
  var bx = o.x, byy = o.y * K, shk = o.shake > 0 ? Math.sin(o.shake * 70) * 1.8 * Math.min(1, o.shake * 4) : 0, dmg = o.kind ? 1 - o.hp / o.max : 0;
  var behind = o.kind === 'tree' && P && P.y < o.y && P.y * K > py + h * 0.25 && Math.abs(P.x - o.x) < w * 0.3;
  var grow = o.grow != null ? 0.3 + 0.7 * Math.min(1, o.grow) : 1;
  c.save();
  if (behind) c.globalAlpha = 0.45;
  if (o.kind === 'tree') {
    var u = o.dying != null ? Math.min(1, o.dying / 0.95) : 0, ang = (o.leanDir || 1) * (Math.max(0, dmg) * 0.1 + u * u * 1.5), spL = G && G.spotLook === 3 && o.dying == null ? spot(G, o, t) : null;
    if (spL) ang += spL.side * 0.07;
    if (o.dying != null && o.dying > 0.95) c.globalAlpha *= Math.max(0, 1 - (o.dying - 0.95) / 0.35);
    c.translate(bx + shk, byy); c.rotate(ang); if (grow < 1) c.scale(grow, grow); c.translate(-bx, -byy);
    c.drawImage(s.cv, px, py, w, h);
  } else if (o.kind === 'stone') {
    var sh = o.dying != null ? Math.max(0, 1 - o.dying / 0.4) : 1, sc = (1 - 0.18 * dmg) * sh;
    c.globalAlpha *= sh;
    c.translate(bx + shk, byy); c.scale(sc, sc); c.translate(-bx, -byy);
    c.drawImage(s.cv, px, py, w, h);
    if (G && G.cracks && G.crackLook && o.dying == null) {              // the sweet facet's cue, on the rock's body
      var ca = crackAng(G, o), fx = px + w / 2 + Math.cos(ca) * w * 0.19, fy = py + h * 0.5 + Math.sin(ca) * h * 0.12, fr = Math.max(2.5, w * 0.08);
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (G.crackLook === 1) { c.strokeStyle = 'rgba(30,24,30,0.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(fx - fr * 0.8, fy - fr); c.lineTo(fx + fr * 0.3, fy - fr * 0.3); c.lineTo(fx - fr * 0.3, fy + fr * 0.4); c.lineTo(fx + fr * 0.8, fy + fr * 1.1); c.stroke(); }
      else if (G.crackLook === 2) { c.strokeStyle = 'rgba(255,250,225,0.75)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(fx - fr, fy - fr * 0.6); c.quadraticCurveTo(fx, fy + fr * 0.2, fx + fr, fy - fr * 0.4); c.stroke(); c.strokeStyle = 'rgba(255,250,225,0.45)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(fx - fr * 0.7, fy + fr * 0.5); c.quadraticCurveTo(fx + fr * 0.1, fy + fr * 0.9, fx + fr * 0.9, fy + fr * 0.3); c.stroke(); }
      else if (G.crackLook === 3) { c.fillStyle = '#6fa848'; c.beginPath(); c.ellipse(fx, fy, fr * 1.2, fr * 0.8, 0.3, 0, 7); c.fill(); c.fillStyle = '#8fc45c'; [[-0.5, -0.3], [0.4, 0.1], [-0.1, 0.4]].forEach(function (q) { c.beginPath(); c.arc(fx + q[0] * fr, fy + q[1] * fr, fr * 0.3, 0, 7); c.fill(); }); }
      else if (G.crackLook === 4) { var pl = 0.5 + 0.5 * Math.sin(t * 2.5 + bx); c.fillStyle = 'rgba(255,255,240,' + (0.22 + 0.18 * pl) + ')'; c.beginPath(); c.ellipse(fx + fr * 0.2, fy + fr * 0.2, fr * 0.95, fr * 0.65, 0, 0, 7); c.fill(); }
    }
    if (dmg > 0.15) {                                 // cracks spread as it is mined
      var n = Math.floor(dmg * 6), cx = px + w / 2, cy = py + h * 0.55; c.strokeStyle = 'rgba(30,24,30,0.65)'; c.lineWidth = 1.1; c.lineCap = 'round';
      for (var k = 0; k < n; k++) { var a = hash(o.x, o.y, k) * 6.283, L = w * (0.18 + hash(o.y, o.x, k) * 0.2), mx = cx + Math.cos(a) * L * 0.5 + (hash(k, o.x, 2) - 0.5) * 4, my = cy + Math.sin(a) * L * 0.5 * 0.7; c.beginPath(); c.moveTo(cx, cy); c.lineTo(mx, my); c.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L * 0.7); c.stroke(); }
    }
  } else {
    if (o.dying != null) c.globalAlpha *= Math.max(0, 1 - o.dying / 0.3);
    c.drawImage(s.cv, px + shk, py, w, h);
  }
  c.restore();
  // the sweet spot's cue: on a tree the glint, a scar on the bark or the sunny side's warmth (the lean is in the drawing above);
  // on a rock without cracks the glint on its facet
  if (G && G.sweetSpot && o.kind && o.dying == null && !dark) {
    var sp = spot(G, o, t), gx = null, gy = null, tw = Math.max(3, w * 0.07);
    if (sp && o.kind === 'tree' && G.spotLook === 1) { gx = bx + sp.side * tw; gy = byy - 14; }
    else if (sp && o.kind === 'tree' && G.spotLook === 2) { var sx0 = bx + sp.side * tw * 0.9, sy0 = byy - 13; c.save(); c.fillStyle = '#3a2416'; c.beginPath(); c.ellipse(sx0, sy0, 2.6, 4.2, 0, 0, 7); c.fill(); c.fillStyle = '#e4c58e'; c.beginPath(); c.ellipse(sx0, sy0, 1.7, 3.2, 0, 0, 7); c.fill(); c.restore(); }
    else if (sp && o.kind === 'tree' && G.spotLook === 4) { c.save(); c.globalAlpha = 0.35; c.fillStyle = '#fff2c0'; c.beginPath(); c.ellipse(bx + sp.side * tw * 0.8, byy - 14, 1.6, 11, 0, 0, 7); c.fill(); c.restore(); }
    else if (sp && o.kind === 'stone') { gx = bx + Math.cos(sp.ang) * w * 0.19; gy = byy - h * 0.3 + Math.sin(sp.ang) * h * 0.12; }
    if (gx != null) { var pulse = 0.55 + 0.45 * Math.sin(t * 5 + bx); c.save(); c.globalAlpha = pulse; c.fillStyle = '#fff3b0'; c.beginPath(); c.moveTo(gx, gy - 3.2); c.lineTo(gx + 1.1, gy - 1.1); c.lineTo(gx + 3.2, gy); c.lineTo(gx + 1.1, gy + 1.1); c.lineTo(gx, gy + 3.2); c.lineTo(gx - 1.1, gy + 1.1); c.lineTo(gx - 3.2, gy); c.lineTo(gx - 1.1, gy - 1.1); c.closePath(); c.fill(); c.restore(); }
  }
  if (o.kind && o.kind !== 'trunk' && dmg > 0 && o.dying == null) {       // how much is left
    c.fillStyle = 'rgba(20,16,30,0.6)'; c.fillRect(bx - 9, py - 5, 18, 3);
    c.fillStyle = o.kind === 'stone' ? '#c5ccd6' : '#9be58b'; c.fillRect(bx - 9, py - 5, 18 * (1 - dmg), 3);
  }
}
var BARK = { oak: ['#7a5636', '#4a3220', '#c9a070'], pine: ['#6b4a3a', '#3f2a1c', '#c99a70'], birch: ['#e8e4dc', '#5a5650', '#d9c9a6'] };
// a felled trunk lying along the ground, its cut end toward where it fell from; shorter as the logs come off
function drawTrunk(c, o) {
  var col = BARK[o.tree] || BARK.oak, y = o.y * K, len = o.len, x0 = o.x - o.dir * len * 0.5, x1 = o.x + o.dir * len * 0.5, r = 5.5 * (o.s || 0.5) / 0.5, shk = o.shake > 0 ? Math.sin(o.shake * 70) * 1.5 : 0;
  if (o.dying != null) c.globalAlpha *= Math.max(0, 1 - o.dying / 0.3);
  c.save(); c.translate(0, shk); c.lineCap = 'round';
  c.fillStyle = 'rgba(20,40,20,0.22)'; c.beginPath(); c.ellipse(o.x, y + 2, len * 0.5 + 3, r * 0.7, 0, 0, 7); c.fill();
  c.strokeStyle = '#1d1622'; c.lineWidth = r * 2 + 2.4; c.beginPath(); c.moveTo(x0, y - r * 0.3); c.lineTo(x1, y - r * 0.3); c.stroke();
  c.strokeStyle = col[0]; c.lineWidth = r * 2; c.stroke();
  c.strokeStyle = col[1]; c.lineWidth = 1; for (var i = 0; i < 4; i++) { var bxx = x0 + (x1 - x0) * (0.15 + i * 0.22); c.beginPath(); c.moveTo(bxx, y - r * 1.1); c.lineTo(bxx + o.dir * 3, y + r * 0.5); c.stroke(); }
  c.fillStyle = col[2]; c.beginPath(); c.ellipse(x0, y - r * 0.3, r * 0.45, r, 0, 0, 7); c.fill(); c.strokeStyle = '#1d1622'; c.lineWidth = 1.1; c.stroke();   // the cut end
  c.strokeStyle = col[1]; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x0, y - r * 0.3, r * 0.22, r * 0.5, 0, 0, 7); c.stroke();
  c.restore();
  if (o.chops > 0) { c.fillStyle = 'rgba(20,16,30,0.6)'; c.fillRect(o.x - 9, y - r - 8, 18, 3); c.fillStyle = '#9be58b'; c.fillRect(o.x - 9, y - r - 8, 18 * Math.min(1, o.chops / Math.max(1, o.chopsPerLog || 2)), 3); }
}
return { DEF: DEF, cfg: cfg, hash: hash, TREE_LOOK: TREE_LOOK, ROCK_LOOK: ROCK_LOOK, spot: spot, spotHit: spotHit, crackAng: crackAng, crackHit: crackHit, rhythmHit: rhythmHit, hit: hit, tick: tick, chopTrunk: chopTrunk, regrowTick: regrowTick, drawProp: drawProp, drawTrunk: drawTrunk, TREE_WOOD: TREE_WOOD, ROCK_STONE: ROCK_STONE, treeLen: treeLen };
})();
if (typeof module !== 'undefined') module.exports = Gather;
