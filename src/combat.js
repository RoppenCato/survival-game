var Combat = (function () {
'use strict';
var AW = 400, AH = 333, K = 0.75, SW = 400, SH = 250;
var lib = null;
var S = { aim: 'soft', ranged: 'mouse', shield: true, juice: true, sound: true, crit: 0.15, weight: 'snappy', guardFace: true };
var WPRE = {
  snappy: { fz: 0.75, pf: 0.65, kb: 1.0, hs: 0.6, hd: 0.06, kd: 0.5 },   // (fz 0.75: Robin's tuning in the Combat Arena, 2026-10-15)
  normal: { fz: 1, pf: 1, kb: 1, hs: 0.3, hd: 0.12, kd: 1 },
  heavy: { fz: 1.35, pf: 1.1, kb: 1.15, hs: 0.25, hd: 0.15, kd: 1.2 }
};
var DASH_T = 0.18, LEAP = { crouch: 0.14, v: 420, t: 0.26, land: 0.18, h: 20 };   /* the Long leap as its own move (Robin, 2026-10-24: the dash runes felt the same, "that one should just be a leap and that it jumps further"): a crouch of crouch s standing, then the flight at v for t s (times the rune's length over 2.2: about 110 units at tier I, half of the first try's 218: Robin, "about half the distance"), the body h screen units up at the top of its arc, the landing held land s; the numbers mine */
var api = { onBlood: null, sfx: function () {}, facings8: true, heroSprite: null, enemySprite: null, harvest: null, onDeath: null, buildSlots: null, beltSlots: null, canShoot: null, onShoot: null, onArrowLand: null, quiver: null, items: null, armor: null,
  mods: null, skills: null, trigger: null, powerMul: null, onDeed: null };
// mods(): { sprint, sprintCost, stam, dash, block, riposte, charge, roll, heavyblow } from the arm ring's runes; skills: [{ id, name, draw(c), cd }] on the fight bar;
// trigger: a skill id to cast this frame; powerMul(kind): tool power multiplier; onDeed(kind): 'block', 'parry', 'dash'
/* The hero's speeds in units a second (Robin, 2026-10-21: "walking with 60 speed looks more natural. Lets use that. But save the
   jog in case we change our minds later"): he walks at 60 on the kit's walk_fast and sprints at 130 on the run; the guard walk keeps
   46.2. The jog he had is kept whole: walk 84 with the kit's walk clip (a page's switch: Combat.HERO_GAIT, Sprites.pick's walkClip). */
var HERO_GAIT = { walk: 78, sprint: 130, guard: 46.2, stroll: 60, jog: 84, sprintSt: 18 };   /* walk 78 on the kit's jog since 2026-10-22 (Robin: "id prefer a better jogging. I think the normal pace needs to be around 75-80 as now its actually too slow"; the studio's jog is made for 78); stroll: yesterday's 60 on walk_fast, a page's switch; jog: the first jog's 84, kept as a number */   // sprintSt: stamina a second at a sprint (22 until 2026-10-21; Robin: "lower the stamina cost slightly for sprint to compensate, as you will sprint more"; 18 is mine)
function mod(k) { var m = api.mods ? api.mods() : null; return m && m[k] != null ? m[k] : 1; }
function modZ(k) { var m = api.mods ? api.mods() : null; return m && m[k] ? m[k] : 0; }   // a rune's switch: 0 unless the page says so
/* The runes (src/runes2.js, Robin's rework of 2026-10-23): a page hands the engine its rune state (api.runeState: the library, what is
   bound where, the blood on each active); without one the engine keeps a starting state of its own (the Bash and the Dash), and
   without the module at all it plays as before. rune(slot): what is bound; runeHas(id): bound anywhere; runeN(id, key): the bound
   tier's number; runeReady, runeSpend: the blood ring on an active (filled by the blows the hero lands, runeBlood); a spend counts a
   use, and a use that raises the tier tells the page (api.onRuneGrow). Marks a foe carries (e.marks: struck, bleeding, afraid, chilled,
   burning) are how runes work together: one lays, another reads. */
var R2DEF = null, KO_T = 60;
function RS2() { if (api.runeState) return api.runeState; if (!R2DEF && typeof Runes2 !== 'undefined') R2DEF = Runes2.start(); return R2DEF; }
function rune(slot) { var st = RS2(); return st && typeof Runes2 !== 'undefined' ? Runes2.bound(st, slot) : (slot === 'guardBlow' ? 'bash' : slot === 'dash' ? 'dash' : null); }
function runeHas(id) { var st = RS2(); return !!(st && typeof Runes2 !== 'undefined' && Runes2.has(st, id)); }
function runeN(id, key) { var st = RS2(); return st && typeof Runes2 !== 'undefined' ? Runes2.num(st, id, key) : 0; }
function swingRune() { return rune('swing'); }
function chainKeep() { return runeHas('ringOfSteel') && hitKind() === 'sword' ? runeN('ringOfSteel', 'chainT') : CHAIN.keep; }   /* the Ring of steel: a sword's parry chain lasts longer and goes higher (Runes2) */
function chainMax() { return runeHas('ringOfSteel') && hitKind() === 'sword' ? runeN('ringOfSteel', 'chainMax') : CHAIN.max; }
function hitKind() { var it = itemOf('weapon', 'sword'); return it ? it.kind : null; }
function stK() { return runeHas('berserk') && runeN('berserk', 'freeAt') > 0 && P.hp < P.maxHp * runeN('berserk', 'freeAt') ? 0 : 1; }   /* Berserk at tier III: stamina costs nothing under a quarter */
function berserkOn() { return runeHas('berserk') && P.hp < P.maxHp * runeN('berserk', 'at'); }
function bowFull() { return runeHas('quickDraw') ? runeN('quickDraw', 'full') : BOW.full; }
function bowSnap() { return runeHas('quickDraw') ? runeN('quickDraw', 'snapK') : BOW.dmgMin; }
function runeReady(slot) { var st = RS2(); return !st || typeof Runes2 === 'undefined' ? true : Runes2.ready(st, slot); }
function runeSpend(slot, id) { var st = RS2(); if (!st || typeof Runes2 === 'undefined' || !id) return; Runes2.spend(st, slot); var g = Runes2.use(st, id); if (g && api.onRuneGrow) api.onRuneGrow(id, g); }
function runeBlood(n) { var st = RS2(); if (st && typeof Runes2 !== 'undefined') Runes2.drawBlood(st, n); }
function markOn(e, mark, t) { if (!e) return; e.marks = e.marks || {}; e.marks[mark] = Math.max(e.marks[mark] || 0, t || 1); }
function marked(e, mark) { return !!(e && e.marks && e.marks[mark] > 0); }
function lightning(e, leaps, dmg, depth) {   // Thor's wrath: a bolt on a man, who is struck for a while (the Hammer reads it); the Storm's eye leaps it to others within reach
  if (!e || e.dead) return; depth = depth || 0; markOn(e, 'struck', runeN('thorsWrath', 'mark') || 10);
  var i; for (i = 0; i < 7; i++) spark(e.x + (Math.random() - 0.5) * 10, e.y - 14 - i * 9, 2, i % 2 ? '#ffffff' : '#ffe9a0', 40);
  ring(e.x, e.y, 0, 26, 0.25, '255,240,180', false, 2); num(e.x, headY(e) - 6, 'STRUCK', '#ffe9a0'); sfx('lightning_small', 0, e); logEv({ k: 'lightning', e: e, leap: depth });
  if (dmg > 0 && !e.dead) { var was = hitFlags.wkind; hitFlags.wkind = 'lightning'; damageEnemy(e, dmg, e.face + Math.PI, 20, 10, 'melee'); hitFlags.wkind = was; }
  if (leaps > 0 && depth < 3) { var best = null, bd = 1e9; for (i = 0; i < W.enemies.length; i++) { var q = W.enemies[i]; if (q === e || q.type !== 'soldier' || q.dead || q.down || q.side === 1 || marked(q, 'struck')) continue; var d = Math.hypot(q.x - e.x, q.y - e.y); if (d < 70 && d < bd) { bd = d; best = q; } }
    if (best) lightning(best, leaps - 1, runeN('stormsEye', 'dmg') * dmgMul('sword'), depth + 1); }
}
function knockOut(e) {                     // the cudgel on a weakened beast: out cold for a while, to be carried
  e.ko = KO_T; e.state = 'ko'; e.t = 0; e.sw = null; e.swung = false; e.guard = 0; e.aggro = 0; e.awake = true; e.vx = 0; e.vy = 0; e.chargeT = 0; num(e.x, headY(e), 'OUT COLD', '#dfe8ff'); ring(e.x, e.y, 0, 22, 0.25, '220,230,255', false, 2); sfx('cudgel_thud', 0, e); logEv({ k: 'ko', e: e });
}
function knockDown(e, ang, k) {            // a man thrown off his feet: a long stagger and a shove (the Charge, the Rush-step)
  e.state = 'stagger'; e.t = 0; e.dur = 1.2; e.sw = null; e.swung = false; e.guard = 0; e.guardAge = 0; e.guardCd = 1.0; e.poiseT = 0.9; e.showBar = 2; e.kx += Math.cos(ang) * CROWD.shoveD * 0.8 * (k || 1); e.ky += Math.sin(ang) * CROWD.shoveD * 0.8 * (k || 1); num(e.x, headY(e), 'DOWN', '#dfe8ff'); ring(e.x, e.y, 0, 30, 0.3, '255,255,255', false, 2.5);
}
function maxSt() { var m = api.mods ? api.mods() : null; return m && m.stMax ? m.stMax : 100; }   // food can raise top stamina (mods().stMax)   // armor(): share of a blow the hero's gear turns aside
// api.items = { held(), tool(i), weapon(kind) } gives the item specs (src/items.js) in the hand, in tool slot i and for 'sword' or 'bow'
function itemOf(fn, a) { if (!api.items || typeof Items === 'undefined' || !api.items[fn]) return null; return api.items[fn](a) || null; }
function bareHanded() { return !!api.items && P.mode === 'fight' && P.weapon === 'melee' && !itemOf('weapon', 'sword'); }   // a page that holds items and has no sword equipped: punch
function dmgMul(kind) { var it = itemOf('weapon', kind); return it ? Items.stats(it).dmg : (api.items ? 0.4 : 1); }   // canShoot()/onShoot(): ammunition; onArrowLand(x, y): a player's arrow that hit nothing; quiver: the count shown by the bow   // beltSlots: [{ n, draw(c) }] shown in free hotbar slots   // buildSlots: [{ name, draw(c) }] for the build-mode hotbar   // onDeath(e): a page hears when an enemy is killed (drops)   // harvest: a page that has trees, rocks and bushes sets { list(x, y, radius), hit(obj, power, rightTool, toolId) -> { dealt, crit, clean } or nothing }; gatherPace(): slows the tool swing   // facings8: the hero turns on the diagonals and animals turn freely
var sfxAt = {};
function sfx(n, v, src, x) { if (!S.sound) return; if (src && src.type === 'soldier') { var t0 = W ? W.t : 0; if (t0 - (sfxAt[n] == null ? -9 : sfxAt[n]) < 0.07 && t0 >= (sfxAt[n] || 0)) return; sfxAt[n] = t0; } api.sfx(n, v, src, x); }   // x (2026-10-13): { kind, wt, heavy } of the hero's weapon for a hit or a swing, so a page can give each weapon its voice   // ten men's blows must not be ten sounds on one beat: the same sound from a man not twice within 0.07 s   // src: the enemy making the sound, so a page can keep far-off ones quiet

function wrap(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
function turnToward(a, b, step) { var d = wrap(b - a); if (Math.abs(d) <= step) return b; return a + (d > 0 ? step : -step); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

var P, W;
var IN = { keys: {}, pressed: {}, mx: 200, my: 125, lmb: false, rmb: false };
function key(code, down) { if (down && !IN.keys[code]) IN.pressed[code] = true; IN.keys[code] = down; }
function button(b, down) {
  if (b === 0) { if (down && !IN.lmb) IN.pressed.lmb = true; IN.lmb = down; }
  if (b === 2) { if (down && !IN.rmb) IN.pressed.rmb = true; IN.rmb = down; }
}
function mouse(x, y) { IN.mx = x; IN.my = y; }

// Gather mode: the tools on keys 1 to 3. The right tool does full damage, any other does half.
var TOOLS = [
  { id: 'axe', name: 'Axe', good: 'tree', dmg: 2 },
  { id: 'pick', name: 'Pickaxe', good: 'stone', dmg: 2 },
  { id: 'knife', name: 'Knife', good: 'bush', dmg: 2 }
];
api.tools = TOOLS;
api.profiles = function () { return PROFILES; }; api.parryWindow = function () { return parryWindow(); }; api.meleeStep = function () { return stepData(P.atk); }; api.num = num; api.rangedKinds = function () { return RANGED; }; api.stepData = function () { return stepData(P.atk); };
// The pace of a blow (2026-10-13, Robin: "the hero is hitting comically fast and crazy, it looks spasmic"): a sword blow is
// now about 0.55 s from the press to the carry (it was 0.26), an axe 0.68, a club 0.78, the Dane axe 1.2; the windup is what
// grew most, so a blow is seen coming. The men's own windup is set apart (MEN.wu, wuK) so they did not slow with it.
var STEPS = [
  { wu: 0.13, ac: 0.11, rec: 0.28, arc: 2.4, reach: 34, blade: 26, dmg: 1, kb: 110, lunge: 85, stag: 10 },
  { wu: 0.13, ac: 0.11, rec: 0.28, arc: 2.4, reach: 34, blade: 26, dmg: 1, kb: 110, lunge: 85, stag: 10 },
  { wu: 0.2, ac: 0.14, rec: 0.44, arc: 3.2, reach: 41, blade: 30, dmg: 2, kb: 220, lunge: 140, stag: 24 }
];
// How each melee weapon fights (2026-10-06, docs/weapons.md): the arc and reach of a hit, its pace (windup, active,
// recover), damage as a share of the thing's own, knockback, stagger, the step into it, how many hits chain (the last is
// the heavy one), the motion (a swing, a thrust straight out, or a smash down from over the shoulder), the stamina a
// swing costs, and what sets it apart: pierce (a thrust hits everything in its line), guardBreak, crit (extra chance),
// heavy (every hit counts as heavy). The old sword numbers in STEPS are the sword's profile.
var PROFILES = {
  // wt (2026-10-13, hit weight per weapon): what a hit of it feels like: the pause on both, the ring, the number's size and the
  // sound follow it; 1 is the sword. The knockback (kb) and the stagger (stag) were already each weapon's own.
  sword:    { arc: 2.4, reach: 34, blade: 26, wu: 0.13, ac: 0.11, rec: 0.28, dmg: 1, kb: 110, stag: 10, lunge: 85, chain: 3, motion: 'swing', st: 7, parry: 1.5, wt: 1 },
  axe:      { arc: 2.6, reach: 32, blade: 22, wu: 0.17, ac: 0.12, rec: 0.36, dmg: 1, kb: 150, stag: 16, lunge: 80, chain: 3, motion: 'swing', st: 8, guardBreak: true, wt: 1.25 },
  club:     { arc: 1.7, reach: 30, blade: 20, wu: 0.2, ac: 0.11, rec: 0.4, dmg: 1, kb: 230, stag: 42, lunge: 60, chain: 2, motion: 'smash', st: 9, wt: 1.5 },
  cudgel:   { arc: 1.6, reach: 28, blade: 18, wu: 0.2, ac: 0.11, rec: 0.4, dmg: 1, kb: 160, stag: 40, lunge: 55, chain: 2, motion: 'smash', st: 8, wt: 1.3, ko: 1 },   /* the cudgel (Robin, 2026-10-23): a blunt tool that knocks a weakened animal out so it can be carried to the altar; it never kills a beast */
  seax:     { arc: 1.1, reach: 25, blade: 16, wu: 0.08, ac: 0.08, rec: 0.18, dmg: 1, kb: 50, stag: 4, lunge: 70, chain: 3, motion: 'thrust', st: 4, crit: 0.2, wt: 0.6 },
  knife:    { arc: 1.0, reach: 21, blade: 11, wu: 0.07, ac: 0.07, rec: 0.16, dmg: 1, kb: 40, stag: 3, lunge: 60, chain: 3, motion: 'thrust', st: 3, crit: 0.15, wt: 0.5 },   // (2026-10-16: the knife is a weapon now, a smaller seax)
  spear:    { arc: 0.55, reach: 52, blade: 40, wu: 0.15, ac: 0.12, rec: 0.32, dmg: 1, kb: 130, stag: 12, lunge: 70, chain: 2, motion: 'thrust', st: 7, pierce: true, wt: 0.9 },   // (lunge 70, was 40: a thrust is a step in, and so the spear reaches furthest)
  greataxe: { arc: 3.6, reach: 44, blade: 34, wu: 0.42, ac: 0.18, rec: 0.6, dmg: 1, kb: 280, stag: 36, lunge: 60, chain: 2, motion: 'swing', st: 13, heavy: true, guardBreak: true, wt: 1.8 }   // (wu 0.5 and lunge 60, were 0.4 and 90: half a second to land, and the swing does not carry him 16 units forward)
};
// the ranged ones: what flies, how fast, the time between shots, what it costs, and whether the thing itself is thrown
var RANGED = {
  bow:      { proj: 'arrow', speed: 420, r: 2.5, cd: 0.45, st: 6, stag: 8, life: 0.75 },   // (2026-10-14, Robin: thinner and a lot faster; it looked as if it was transporting itself)
  sling:    { proj: 'stone', speed: 210, r: 3, cd: 0.6, st: 5, stag: 26, life: 0.8, kb: 120 },
  javelin:  { proj: 'javelin', speed: 250, r: 4, cd: 0.5, st: 8, stag: 14, life: 0.9, thrown: true },
  throwaxe: { proj: 'throwaxe', speed: 200, r: 4, cd: 0.5, st: 7, stag: 22, life: 0.6, thrown: true, kb: 160 }
};
for (var pk in PROFILES) PROFILES[pk].kind = pk;
/* The men's weapons (2026-10-15): a man's blow is timed and reached from his weapon's profile (blowOf: wu, ac, rec times MEN's
   factors, reach, arc). When Robin tuned the hero's sword (a blow of 0.4 s, reach 50, a long step), the men's swords took it too
   and swung in slow motion. MAN_PF is the profiles as they were before any of the hero's tuning, and a man is armed from it;
   the men's own levers are MEN's (their windup, blow and recovery factors). */
var MAN_PF = JSON.parse(JSON.stringify(PROFILES));
Object.assign(PROFILES.sword, { wu: 0.11, ac: 0.4, rec: 0.2, reach: 50, lunge: 123 });   // Robin's sword (the Combat Arena, 2026-10-15: "this feels good")
Object.keys(PROFILES).forEach(function (k) { PROFILES[k].wu = k === 'greataxe' ? 0.15 : 0.03; });   // the player's blows start on the press (Robin, 2026-10-20): a frame or two before the blow lands, so the swing's sound and smear still begin; the Dane axe keeps a short windup, its weight (Robin); a charged blow keeps the hold as its windup; the men keep theirs (MAN_PF above), the player's warning
function meleeProfile() { var it = itemOf('weapon', 'sword'); return (it && PROFILES[it.kind]) || PROFILES.sword; }
function chainLen() { return bareHanded() ? 3 : meleeProfile().chain; }
function heavyHit(a) { return a.combo === 3 || a.combo === chainLen() - 1 || (!bareHanded() && !!meleeProfile().heavy); }
var BOW = { full: 1.5, dmgMin: 0.4, speedMin: 0.8 }; api.bowSpec = BOW;   /* the bow drawn and held (Robin, 2026-10-23: "mouse2 should ready and charge the bow, doing more damage the more its charged (up to 1,5 sec). Then you release with mouse1. You cant block or bash with bow"): full after BOW.full seconds; a shot let go early does dmgMin of the damage and flies at speedMin of the speed, rising to the whole; the numbers mine */
function rangedOf() { var it = itemOf('weapon', 'bow'); return { it: it, kind: it ? it.kind : 'bow', R: (it && RANGED[it.kind]) || RANGED.bow }; }
var critBonus = 0;

function newWorld() {
  W = { glints: [], ghosts: [], rings: [], slow: { t: 0, s: 1 }, t: 0, enemies: [], projs: [], parts: [], nums: [], lock: null, kills: 0, dustT: 0,
    pillars: [{ x: 100, y: 90, r: 7 }, { x: 300, y: 90, r: 7 }, { x: 100, y: 243, r: 7 }, { x: 300, y: 243, r: 7 }] };
}
function newPlayer() {
  P = { x: 200, y: 255, vx: 0, vy: 0, kx: 0, ky: 0, face: -Math.PI / 2, faceVis: -Math.PI / 2, hp: 100, maxHp: 100, st: 100, stDelay: 0, r: 6,
    atk: { ph: 'none', t: 0, combo: 0, since: 9, dir: 0, hit: [], tr: null, chg: 0, lvl: 0 }, atkBuf: 0,
    roll: { t: 0, cd: 0, dx: 0, dy: 1 }, guard: false, guardT: 0, lastRaise: -9, invuln: 0, flash: 0, hurtT: 0, dead: false,
    sprintLock: false, sprinting: false, anim: { run: 0, phase: 0, amt: 0, t: 0, lx: 0, ly: 0, bob: 0, lvx: 0, lvy: 0, blink: 0, blinkT: 2, blinkP: 0, sq: 0, sqv: 0 }, inAng: null, fireCd: 0, fireT: 0, fireAng: 0, freezeT: 0, dashBuf: 0, holdT: 0, animT: 0, moving: false, parryFx: 0, mode: 'fight', weapon: 'melee', tool: 0, piece: 0, wreck: false, lastMode: 'fight', sel: 0 };
}
function reset() {
  newWorld(); newPlayer();
  (api.roster || ['beast', 'beast', 'shooter']).forEach(function (t) { spawn(t); });   // a page can choose who starts in the arena
  if (api.afterReset) api.afterReset();   // and set the field itself after every reset (the Combat Arena's one man across the ring, 2026-10-22)
}

/* ---------- helpers ---------- */
function pillarHit(x, y, r) {
  for (var i = 0; i < W.pillars.length; i++) { var p = W.pillars[i]; if (Math.hypot(x - p.x, y - p.y) < r + p.r) return true; }
  return false;
}
function moveCircle(e, dx, dy) {
  var ox = e.x, oy = e.y;
  e.x += dx; e.y += dy;
  var B = api.scene && api.scene.bounds;  // a tool page can swap the arena for a bigger world
  if (B) { e.x = clamp(e.x, B.x0, B.x1); e.y = clamp(e.y, B.y0, B.y1); }
  else { e.x = clamp(e.x, 24, AW - 24); e.y = clamp(e.y, 40, AH - 20); }
  // a tool page can mark ground as not walkable (the Sea Editor keeps walkers out of the water); slide along it
  var wk = api.scene && api.scene.walk;
  if (wk && !wk(e.x, e.y, e)) { if (wk(e.x, oy, e)) e.y = oy; else if (wk(ox, e.y, e)) e.x = ox; else { e.x = ox; e.y = oy; } }
  var bl = e !== P && api.blocked ? api.blocked : null;      // a page that knows the walls (Nav): a man does not step across one, wherever he is
  if (bl) {                                                  // (MEN.wallGap: he stops that far short of a wall he walks into, so that he does not stand in it; along it and away from it he walks as he likes)
    var wg = MEN.wallGap || 0, gx = wg && e.x !== ox ? (e.x > ox ? wg : -wg) : 0, gy = wg && e.y !== oy ? (e.y > oy ? wg : -wg) : 0;
    if (bl(ox, oy, e.x + gx, e.y + gy, e)) { if (!bl(ox, oy, e.x + gx, oy, e)) e.y = oy; else if (!bl(ox, oy, ox, e.y + gy, e)) e.x = ox; else { e.x = ox; e.y = oy; } }
  }
  var wx0 = e.x, wy0 = e.y, sx0 = ox, sy0 = oy, hitP = null;
  // A wall's circles are there for the hero. Where a grid knows the walls, nobody else steps across one anyway (bl, above), and
  // the circles exist only near the hero: a man who walked past a chest along a wall, far from him, was caged between the chest
  // and the wall's circles the moment the hero came near (2026-10-13, found by the town test: a man of the hall stood 21 s in the
  // corner of a house). So where the grid keeps him, a wall's circles leave him alone, near the hero and far from him alike.
  var noWalls = bl && api.walled && api.walled(e.x, e.y);
  for (var i = 0; i < W.pillars.length; i++) {
    var p = W.pillars[i]; if (noWalls && p.wall) continue; var ox = e.x - p.x, oy = e.y - p.y, d = Math.hypot(ox, oy), min = e.r + p.r;
    if (d < min && d > 0.001) { e.x = p.x + ox / d * min; e.y = p.y + oy / d * min; hitP = p; }
  }
  if (hitP && e !== P) {       // dead on against something round there is nothing to slide along, so he steps round it (2026-10-13: a man stood for a minute with his nose against the hearth of his own house)
    var il = Math.hypot(dx, dy), got = il > 0 ? ((e.x - sx0) * dx + (e.y - sy0) * dy) / il : 0;
    if (il > 0 && got < il * 0.3) { var nx = e.x - hitP.x, ny = e.y - hitP.y, nl = Math.hypot(nx, ny) || 1, cr = nx * dy - ny * dx, sgn = Math.abs(cr) < il * nl * 0.08 ? (((e.seed || 0) * 1000 | 0) & 1 ? 1 : -1) : (cr >= 0 ? 1 : -1); e.x += -ny / nl * sgn * il; e.y += nx / nl * sgn * il; }
  }
  // a solid may not push a mover onto ground that cannot be walked (2026-10-12: a tree by a cliff's foot pushed the hero into the
  // rock, and one by the shore into the sea): back to where the walk test left it, or to where it started
  if (wk && (e.x !== wx0 || e.y !== wy0) && !wk(e.x, e.y, e)) { if (wk(wx0, wy0, e)) { e.x = wx0; e.y = wy0; } else { e.x = sx0; e.y = sy0; } }
  if (bl && (e.x !== wx0 || e.y !== wy0) && bl(sx0, sy0, e.x, e.y, e)) { e.x = wx0; e.y = wy0; }      // nor may a solid push him across one
}
function alive(e) { return e && !e.dead; }
function spawn(type) {
  var x, y, tries = 0;
  do { x = 40 + Math.random() * (AW - 80); y = 70 + Math.random() * (AH - 120); tries++; }
  while ((Math.hypot(x - P.x, y - P.y) < 110 || pillarHit(x, y, 20)) && tries < 50);
  var e = { type: type, x: x, y: y, kx: 0, ky: 0, state: 'idle', t: 0, dur: 0, cd: 0.8 + Math.random(), flash: 0, face: Math.PI / 2, aim: Math.PI / 2,
    seed: Math.random() * 10, size: 1, chain: 0, showBar: 0, freezeT: 0, pkx: 0, pky: 0, sq: 0, sqAng: 0, rattle: 0, flashRgb: '255,255,255', dead: false, deadT: 0, dirLock: 0, hitDone: false, stagMeter: 0, sinceHit: 9, attack: '' };
  if (type === 'shooter') { e.hp = e.maxHp = 5; e.r = 8; }
  else if (type === 'brute') { e.hp = e.maxHp = 32; e.r = 13; e.size = 1.8; }
  else if (type === 'soldier') { e.hp = e.maxHp = 30; e.r = 7; armMan(e, null); }
  else { e.type = 'beast'; e.hp = e.maxHp = 4; e.r = 7; }
  if (api.dress) api.dress(e);   // a page can give each enemy its own look and numbers (see templates/combat.html)
  W.enemies.push(e);
  return e;
}
function spark(x, y, n, color, speed) {
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, s = (0.4 + Math.random()) * speed;
    W.parts.push({ k: 'spark', x: x, y: y, z: 12, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 20 + Math.random() * 50, life: 0.3 + Math.random() * 0.25, max: 0.5, c: color, s: 1 + Math.random() * 1.2 });
  }
}
function dust(x, y, n) {
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2;
    W.parts.push({ k: 'dust', x: x, y: y, z: 2, vx: Math.cos(a) * 14, vy: Math.sin(a) * 8, vz: 8, life: 0.35, max: 0.35, c: '#e8dcc0', s: 2 + Math.random() * 2 });
  }
}
function bits(x, y, n) {
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 60;
    W.parts.push({ k: 'bit', x: x, y: y, z: 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 60, life: 0.8, max: 0.8, c: Math.random() < 0.5 ? '#e0a93a' : '#8f8ba6', s: 1.6 });
  }
}
// What a blow of the hero's shows as (2026-10-13, Robin: about 10 at least, and no decimals): the engine's damage times SHOW,
// rounded. A page shows a weapon's number the same way (api.SHOW). The health behind it is unchanged.
var SHOW = 10; api.SHOW = SHOW;
var TOOL_DMG = 0.8;                          // a tool's blow on a beast or a man, as a share of what the same thing would do as a weapon (0.8 since 2026-10-14, one bar and no modes: the axe in hand is what you swing at a boar; it was 0.5)
function num(x, y, txt, c, big, weak) { W.nums.push({ x: x, y: y, t: 0, txt: txt, c: c || '#ffffff', big: !!big, weak: !!weak }); }
var wrongToolAt = -1e9;                   // when the 'wrong tool' note was last shown (W.t); it comes back after five minutes
function slowmo(scale, dur) { if (S.juice && dur > W.slow.t) { W.slow.t = dur; W.slow.s = scale; } }
function ring(x, y, z, r1, life, col, air, w) { if (S.juice) W.rings.push({ x: x, y: y, z: z || 0, r1: r1, life: life, max: life, c: col || '255,255,255', air: !!air, w: w || 2 }); }
function streaks(x, y, ang, n, speed, rgb) {
  if (!S.juice) return;
  for (var i = 0; i < n; i++) {
    var a = ang + (Math.random() - 0.5) * 1.0, sp = speed * (0.6 + Math.random() * 0.7);
    W.parts.push({ k: 'streak', x: x, y: y, z: 12, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, vz: 0, life: 0.16, max: 0.16, c: '#fff6c8', rgb: rgb || '255,246,200', s: 1.4 });
  }
}
function lockFor(ent, t) { if (S.juice && ent) ent.freezeT = Math.max(ent.freezeT || 0, t); }

/* ---------- aiming ---------- */
function nearest(range, face, cone) {
  var best = null, bs = 1e9;
  for (var i = 0; i < W.enemies.length; i++) {
    var e = W.enemies[i]; if (e.dead || e.side === 1 || e.down || e.out) continue;
    var d = Math.hypot(e.x - P.x, e.y - P.y);
    if (d > range + e.r) continue;
    var df = Math.abs(wrap(Math.atan2(e.y - P.y, e.x - P.x) - face));
    if (df > cone) continue;
    var sc = d + df * 25;
    if (sc < bs) { bs = sc; best = e; }
  }
  return best;
}
function lockValid() { return alive(W.lock); }
function aimAngle() {
  if (lockValid()) return Math.atan2(W.lock.y - P.y, W.lock.x - P.x);
  var base = P.inAng !== null ? P.inAng : P.face;
  if (S.aim === 'facing') return base;
  var e = nearest(85, base, 1.3);
  if (!e) e = nearest(52, base, 3.3);
  if (e) return Math.atan2(e.y - P.y, e.x - P.x);
  return base;
}
function rangedAngle() {
  if (S.ranged === 'mouse') return Math.atan2(IN.my / K - P.y, IN.mx - P.x);
  if (lockValid()) return Math.atan2(W.lock.y - P.y, W.lock.x - P.x);
  var e = nearest(280, P.face, 1.6);
  if (e) return Math.atan2(e.y - P.y, e.x - P.x);
  return P.face;
}
function cycleLock() {         // Ctrl: nearest enemy, then the next nearest, then no target
  var list = W.enemies.filter(function (e) { return alive(e) && e.side !== 1 && !e.down && Math.hypot(e.x - P.x, e.y - P.y) < 300; });
  list.sort(function (a, b) { return Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y); });
  var i = list.indexOf(W.lock);
  W.lock = !list.length ? null : (i < 0 ? list[0] : (i + 1 < list.length ? list[i + 1] : null));
  if (W.lock) sfx('tele');
}
function switchMode() {
  var p = P, a = p.atk;
  p.mode = p.mode === 'fight' ? 'gather' : 'fight';
  a.ph = 'none'; a.t = 0; a.since = 9; a.tr = null; p.atkBuf = 0; p.guard = false; p.holdT = 0;
  W.lock = null; sfx('tele');
}

/* ---------- damage ---------- */
// Is there a shield on his arm? (2026-10-13: the strong guard was everybody's, shield or none.) A page says (api.shield); the
// arena's own switch otherwise. With one the guard is wide, most of a blow is stopped and an arrow is; without, K still fends
// with what he holds: a narrow guard that lets more than half of a light blow through, costs more breath, and stops no arrow.
function shielded() { return api.shield ? !!api.shield() : S.shield; }
/* Turning to the threat with the shield up (2026-10-15, Robin: "when you press shield, right click, you should automatically turn to the
   nearest creature. That way you can prepare parrying"). While the guard is up and no target is locked (Ctrl, which still wins) he
   faces, at GUARD_FACE.turn radians a second: the foe whose blow at him lands soonest (a man winding up or a beast's windup or lunge
   within GUARD_FACE.reach; a bowman drawing on him within GUARD_FACE.bow), else the nearest foe within GUARD_FACE.near; not a
   man of his own, one on his knees, asleep or fled, nor a shy beast. Walking does not turn him while it holds. S.guardFace switches it. */
var GUARD_FACE = { turn: 12, reach: 260, bow: 340, near: 150 };
function guardThreat() {
  var best = null, bestT = 99, near = null, nearD = GUARD_FACE.near, i, e, d, t;
  for (i = 0; i < W.enemies.length; i++) {
    e = W.enemies[i]; if (!e || e.dead || e.down || e.out || e.fled || e.away || e.asleep || e.side === 1 || e.shy || e.flee) continue;
    d = Math.hypot(e.x - P.x, e.y - P.y); t = 99;
    if (e.type === 'soldier') { if ((e.state === 'windup' || e.state === 'lunge') && e.tgt === P && !e.hitDone && d < GUARD_FACE.reach) t = Math.max(0, (e.hitT || W.t) - W.t); else if (e.state === 'aim' && e.tgt === P && d < GUARD_FACE.bow) t = 1 + (e.dur ? Math.max(0, e.dur - e.t) : 0); }
    else if ((e.state === 'windup' || e.state === 'lunge') && d < GUARD_FACE.reach) t = e.state === 'lunge' ? 0.02 : Math.max(0, (e.dur || 0) - e.t);
    if (t < bestT) { bestT = t; best = e; }
    if (d < nearD) { nearD = d; near = e; }
  }
  return best || near;
}
var PARRY = { shield: 0.22, bare: 0.12 };   // the parry's moment, with a shield on the arm and with a weapon (tuned in the Combat Arena: see tune)
/* What the guard is made of (Robin, 2026-10-16): a shield, a weapon, a tool or the bare arm. A parry stops all of a blow whatever
   it is made with, but stuns the foe for less with a weapon (half) and a tool; a block lets through: with a shield a fifth (Robin:
   it stops 80%, more with a better one: the page's api.shieldThrough), with a weapon half, with a tool or the bare arm most. Only a
   shield stops an arrow. arc: how far round the guard covers; st: what a block costs in breath; win: the parry's moment. */
var GUARD = { shield: { arc: 1.9, light: 0.2, heavy: 0.4, st: 10, stun: 1 }, weapon: { arc: 1.5, light: 0.5, heavy: 0.75, st: 14, stun: 0.5 }, tool: { arc: 1.2, light: 0.75, heavy: 0.9, st: 20, stun: 0.3, win: 0.08 }, bare: { arc: 1.2, light: 0.8, heavy: 0.95, st: 22, stun: 0.3, win: 0.08 } };
function guardKind() { if (shielded()) return 'shield'; if (P.mode === 'gather') return 'tool'; if (P.mode === 'fight' && P.weapon === 'melee' && itemOf('weapon', 'sword')) return 'weapon'; if (P.mode === 'fight' && P.weapon === 'melee' && !api.items) return 'weapon'; return P.mode === 'fight' && P.weapon === 'ranged' ? 'tool' : 'bare'; }   /* (a page that gives the engine no items: the tests' and editors' plain sword is a weapon) */
function guardOf() { var k = guardKind(), g = GUARD[k]; if (k === 'shield' && api.shieldThrough) { var t = api.shieldThrough(); if (t != null) return { kind: k, arc: g.arc, light: t, heavy: Math.min(0.9, t * 2), st: g.st, stun: g.stun }; } return { kind: k, arc: g.arc, light: g.light, heavy: g.heavy, st: g.st, stun: g.stun, win: g.win }; }
function parryWindow() { var k = guardKind(); return k === 'shield' ? PARRY.shield : k === 'weapon' ? PARRY.bare : GUARD[k].win; }
/* The parry chain (2026-10-15, Robin: parry more in a fight, "when you hit them after they are dizzy they attack and you can parry
   again; to make combos"). A parry stuns (stun). While he is stunned your blows do not end it (he reels on, pushed only a
   little so he stays in reach) and they bite harder; when it ends he comes out of it swinging at once, a blow you can parry
   again. Each parry within CHAIN.keep seconds of the last is one more in the chain (P.chain, up to CHAIN.max): the stun grows by
   CHAIN.stun of the first for each, and your blows on a stunned foe do 1 + CHAIN.dmg times the chain. A blow that gets through
   to you ends the chain. The numbers are on the Combat Arena's Tuning panel (the feel of a hit). */
var CHAIN = { max: 4, keep: 4.5, stun: 0.15, dmg: 0.1, kb: 0.25, answer: 0.9 };   // (set by the bots of tests/parry.js, 2026-10-15: a good parrier needs about four parries for a man in leather, six for one in mail, and lands four in five of his blows on a reeling man; a mere blocker two or three, and two in five)
function chainUp() { var p = P; if (W.t - (p.chainAt == null ? -99 : p.chainAt) > chainKeep()) p.chain = 0; p.chain = Math.min(chainMax(), (p.chain || 0) + 1); p.chainAt = W.t; return p.chain; }
function parryStun() { return MEN.parryStun * (P.parryK == null ? 1 : P.parryK) * (1 + CHAIN.stun * Math.max(0, (P.chain || 1) - 1)); }   /* (P.parryK: what the parry was made with, GUARD[].stun) */
/* Four more for the fight (2026-10-15, Robin's picks from the research in docs/idea-bank.md, "Combat: what would make it more
   engaging"). POSTURE: a foe's balance (e.posture 0..1, shown under his health) fills with every parry, every blow he stops on his
   shield and a little with every blow that lands; it drains after a while unpressed; full, he is BROKEN: stunned a long while,
   and the hero's next blow on him is a FINISHING BLOW (e.finish). A parry chain of CHAIN.max makes the next blow a finishing
   blow too (Robin: "when you have reached parry x4, next attack is a finishing move"). The finishing blow is the chain's heavy
   last swing; it kills a man or a beast of 40 health or less, takes a third of a bigger one, and the hero is untouchable through
   it. RALLY (Bloodborne's): part of a blow you take stays on the bar as a fading stretch, and every blow you land within its time
   wins some of it back. PERFECT: a dash begun in the last moment before a blow lands slows time, gives the dash's stamina back
   and leaves the foe exposed for a moment (your blows on him do more). The unparryable tell: a heavy blow (it cannot be parried)
   flashes a red glint as it is wound up, and sounds deeper; any other a white one. */
var BEAST_POISE = 1.1;   // after a beast is staggered, no blow staggers it again for this long, so it gets its attack off (2026-10-15: every blow of a club counts as heavy, stag 42, and a careless tapper with the first weapon of the game felled a bear losing nothing; tests/balance.js)
var POSTURE = { parry: 0.25, dodge: 0.25, block: 0.04, hit: 0.02, hold: 1.6, decay: 0.15, breakT: 2.0 };   // (block and hit kept small: at 0.15 a bot that only blocked and hit into the shield broke men sooner than one that parried; a perfect dodge counts as a parry, so a foe whose blows are all red can be broken too)
var RALLY = { share: 0.5, hold: 0.4, time: 1.8, perHit: 2 };   // (at 0.6 of a hit, 6 a blow over 3 s the battle test's careless tapper beat a man in mail with a shield every time (4% before it); at these, 42%)
var PERFECT = { win: 0.18, slow: 0.3, slowT: 0.28, exposed: 1.2, bonus: 1.5 };
/* Fighting two or three at once (2026-10-23, Robin: "being able to fight 2 or 3 at a time in a reasonable way ... maybe theres
   something we could do/add"; the numbers mine, first settings): the parry's shock (a parry staggers every other man within
   shockR in front of you for shockT: the one beside the man you parried flinches, so his blow comes later), the finishing
   blow's fear (the men within fearR of a man who takes the finishing blow stand frozen fearT), and the shield shove (J with the
   guard up: the man before you within shoveReach is thrown back shoveD and staggers shoveT, and a man he is thrown into
   staggers too; it costs shoveSt stamina, once in shoveCd; with no shield the weapon's haft does it for half the throw). Each
   is a switch: 0 turns it off. */
var CROWD = { shockR: 80, shockArc: 2.2, shockT: 0.45, fearR: 130, fearT: 0.8, shove: 1, shoveReach: 36, shoveD: 380, shoveT: 0.55, shoveSt: 14, shoveCd: 1.1, bump: 36, shoulderK: 0.7, breakCd: 1.4, bashT: 0.3, bashDmg: 0.35, bashKb: 90 };   /* (the bash comes always, Robin 2026-10-23: on a blocking man it breaks his block and throws him; on a man with his guard down it does low damage, bashDmg of the held weapon's blow with a small push; without a shield the shoulder does it at shoulderK of the throw, mine; the broken man cannot raise his guard for breakCd; bashT the move's own time, for the clip) */
function headY(e) { return e.y * K - (e.human ? 50 : e.r * 2.6 + 14); }
function postureAdd(e, v) {
  if (!e || e.dead || e.down || e.out || e.type === 'brute' || e.side === 1) return;
  e.posture = Math.min(1, (e.posture || 0) + v); e.postureT = 0; e.showBar = Math.max(e.showBar, 2.2);
  if (e.posture >= 1 && !e.finish) { e.posture = 0; stun(e, POSTURE.breakT); e.finish = true; num(e.x, headY(e), 'BROKEN', '#ff9a4a', true); slowmo(0.35, 0.18); ring(e.x, e.y, 0, 40, 0.35, '255,170,90', false, 3); sfx('broken', 0, e); logEv({ k: 'broken', e: e }); }
}
function parried(e) {                    // a parry on a foe: the stun, his balance, and at the chain's top the finishing blow
  if ((P.chain || 0) >= chainMax()) { stun(e, Math.max(parryStun(), POSTURE.breakT)); e.posture = 0; e.finish = true; num(e.x, headY(e), 'FINISH HIM', '#ff9a4a', true); slowmo(0.35, 0.16); ring(e.x, e.y, 0, 40, 0.35, '255,170,90', false, 3); logEv({ k: 'broken', e: e, chain: true }); return; }   // the chain at its top: the next blow finishes (Robin)
  stun(e, parryStun()); postureAdd(e, POSTURE.parry); crowdShock(e);
}
function crowdShock(hit) {                // the parry's shock: the other men within reach in front of the hero flinch (CROWD)
  if (!(CROWD.shockT > 0)) return; var face = Math.atan2(hit.y - P.y, hit.x - P.x), i, n = 0;
  for (i = 0; i < W.enemies.length; i++) { var o = W.enemies[i]; if (o === hit || o.type !== 'soldier' || o.dead || o.down || o.out || o.side === 1 || o.state === 'stunned') continue;
    var d = Math.hypot(o.x - P.x, o.y - P.y); if (d > CROWD.shockR + o.r) continue; if (Math.abs(wrap(Math.atan2(o.y - P.y, o.x - P.x) - face)) > CROWD.shockArc / 2) continue;
    o.state = 'stagger'; o.t = 0; o.dur = Math.max(o.state === 'stagger' ? o.dur - o.t : 0, CROWD.shockT); o.sw = null; o.swung = false; o.poiseT = 0.9; o.showBar = 2; n++; }
  if (n) { ring(P.x, P.y, 0, CROWD.shockR, 0.3, '220,230,255', false, 2); logEv({ k: 'shock', n: n }); }
}
function crowdFear(e) {                   // the finishing blow's fear: the men near him stand frozen (CROWD)
  if (!(CROWD.fearT > 0)) return; var i, n = 0;
  for (i = 0; i < W.enemies.length; i++) { var o = W.enemies[i]; if (o === e || o.type !== 'soldier' || o.dead || o.down || o.out || o.side === 1) continue;
    if (Math.hypot(o.x - e.x, o.y - e.y) > CROWD.fearR) continue; o.state = 'stagger'; o.t = 0; o.dur = CROWD.fearT; o.sw = null; o.swung = false; o.poiseT = 0.9; o.showBar = 2; o.guard = 0; n++; }
  if (n) { ring(e.x, e.y, 0, CROWD.fearR, 0.5, '255,200,140', false, 2); logEv({ k: 'fear', n: n }); }
}
function crowdShove(p) {                  // the shield bash (Robin, 2026-10-23: "you should be able to bash all the time, but if it doesnt hit a block, it just does low damage"): the man before you with his guard up has it broken, is thrown back and staggers, and the one he lands on staggers with him; one with his guard down takes a low blow and a push; without a shield the shoulder does it (CROWD)
  var best = null, bd = 1e9, i, face = P.inAng !== null ? P.inAng : P.face, hasShield = !!(S.shield && api.shield && api.shield());
  for (i = 0; i < W.enemies.length; i++) { var o = W.enemies[i]; if (o.type !== 'soldier' || o.dead || o.down || o.out || o.side === 1) continue;
    var d = Math.hypot(o.x - p.x, o.y - p.y) - o.r - p.r; if (d > CROWD.shoveReach) continue; if (Math.abs(wrap(Math.atan2(o.y - p.y, o.x - p.x) - face)) > 1.0) continue; if (d < bd) { bd = d; best = o; } }
  p.st -= CROWD.shoveSt; p.stDelay = 0.6; p.shoveCd = CROWD.shoveCd; p.anim.sq = -0.2; p.anim.sqv = 0; p.bashT = CROWD.bashT; sfx('block', 0.6);
  if (!best) { ring(p.x + Math.cos(face) * 20, p.y + Math.sin(face) * 20, 0, 14, 0.2, '200,200,200', false, 1.5); logEv({ k: 'shove', hit: false }); return false; }   /* (a bash at the air) */
  var ang = Math.atan2(best.y - p.y, best.x - p.x), k = hasShield ? 1 : CROWD.shoulderK;
  if (!(best.guard > 0)) { var it = api.items && api.items.held ? api.items.held() : null, wd = 1; if (it) { try { var sd2 = Items.stats(it).dmg; if (isFinite(sd2) && sd2 > 0) wd = sd2; } catch (eI) {} } damageEnemy(best, CROWD.bashDmg * wd * dmgMul('sword') * k, ang, CROWD.bashKb * k, 0, 'melee'); logEv({ k: 'shove', hit: true, e: best, low: true }); return true; }   /* (no block to break: a low blow and a push) */
  best.pkx = 0; best.pky = 0; best.kx += Math.cos(ang) * CROWD.shoveD * k; best.ky += Math.sin(ang) * CROWD.shoveD * k;
  best.state = 'stagger'; best.t = 0; best.dur = CROWD.shoveT; best.sw = null; best.swung = false; best.poiseT = 0.9; best.guard = 0; best.guardAge = 0; best.guardCd = CROWD.breakCd; best.brokeT = 1; best.showBar = 2; postureAdd(best, POSTURE.block);   /* (his block is broken: as the axe breaks it, and no guard again for breakCd) */
  for (i = 0; i < W.enemies.length; i++) { var q = W.enemies[i]; if (q === best || q.type !== 'soldier' || q.dead || q.down || q.out || q.side === 1) continue;
    var dq = Math.hypot(q.x - best.x, q.y - best.y), ahead = Math.cos(Math.atan2(q.y - best.y, q.x - best.x) - ang) > 0.3; if (dq > CROWD.bump + q.r + best.r || !ahead) continue;
    q.kx += Math.cos(ang) * CROWD.shoveD * 0.4 * k; q.ky += Math.sin(ang) * CROWD.shoveD * 0.4 * k; q.state = 'stagger'; q.t = 0; q.dur = CROWD.shoveT * 0.8; q.sw = null; q.swung = false; q.poiseT = 0.9; q.showBar = 2; }
  ring(best.x, best.y, 0, 30, 0.3, '255,255,255', false, 2.5); num(best.x, headY(best), 'BLOCK BROKEN', '#dfe8ff'); logEv({ k: 'shove', hit: true, e: best }); return true;
}
var CRY_T = 1.1, CRY_AT = 4 / 10.91;        /* Colin, AD's war_cry clip (2026-10-24): 12 frames at 10.91, the cry at frame 4 */
function crowdWarCry(p) {                 // the War-cry: the clip plays (p.cryT); at its cry (warCryOut) every foe within hearing hesitates, the frightened run at tier II, your men's next blows are heavy at tier III
  p.st -= CROWD.shoveSt; p.stDelay = 0.6; p.shoveCd = CROWD.shoveCd; p.bashT = 0; p.cryT = CRY_T; p.cryDue = true; p.freezeT = Math.max(p.freezeT || 0, CRY_T * 0.9); p.guard = false; return true;
}
function warCryOut(p) {
  var n = 0, i, hes = runeN('warCry', 'hesitate') || 1;
  for (i = 0; i < W.enemies.length; i++) { var e = W.enemies[i]; if (e.dead || e.down || e.out) continue; var d = Math.hypot(e.x - p.x, e.y - p.y); if (d > 240) continue;
    if (e.side === 1) { if (runeN('warCry', 'heavy')) e.cryHeavy = 1; continue; }
    if (e.type === 'soldier') { e.freezeT = Math.max(e.freezeT || 0, hes); e.pkx = e.pky = 0; if (runeN('warCry', 'run') && (e.nerve || 0.55) < 0.6 && !e.loyal) breakMan(e, 'flee'); n++; } else if (e.type === 'beast') { e.state = 'flee'; e.t = 0; e.cd = hes; n++; } }
  ring(p.x, p.y, 0, 240, 0.5, '255,220,150', false, 2.5); num(p.x, p.y - 32, 'WAR-CRY', '#ffd34d', true); sfx('war_cry'); logEv({ k: 'warcry', n: n });
}
function crowdRiposte(p) {                 // the Riposte: in the moment after a parry the guard-blow is an instant strike that cannot be blocked
  if (!(p.riposteT > 0)) return false; p.riposteT = 0; p.guard = false; p.atkBuf = 0; startAttack(); P.atk.riposte = true; P.atk.ripRune = true; P.atk.combo = chainLen() - 1; var rk = bareHanded() ? null : meleeProfile().kind; P.atk.clipRune = rk && rk !== 'greataxe' && rk !== 'spear' ? 'riposte' : null; sfx('riposte'); return true;   /* (Colin, AD's riposte clip, one-handed) */
}
function crowdCharge(p) {                 // the Charge (a rune of the guard-blow): a rush so many strides long; the first man in the way goes down, the next is pushed, at tier III the rush strikes with the weapon
  var face = P.inAng !== null ? P.inAng : P.face, len = runeN('charge', 'len') || 3;
  p.st -= CROWD.shoveSt; p.stDelay = 0.6; p.shoveCd = CROWD.shoveCd; p.bashT = CROWD.bashT; p.guard = false; p.anim.sq = -0.4; p.anim.sqv = 0;
  p.roll.t = DASH_T * len * 0.55; p.roll.len = p.roll.t; p.roll.dx = Math.cos(face); p.roll.dy = Math.sin(face); p.roll.cd = 0.3; p.invuln = Math.max(p.invuln, 0.2); p.ghostT = 0;
  p.charge = { down: runeN('charge', 'down') || 1, strike: runeN('charge', 'strike') || 0, hit: [], ang: face }; dust(p.x, p.y, 7); sfx('dash'); logEv({ k: 'shove', hit: true, charge: true }); return true;
}
function wallPillarCross(x0, y0, x1, y1, r) {   // does the segment cross a wall's pillar (the page marks the walls' solids wall: true): a leap or a blink stops before a shut edge
  var dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, i; for (i = 0; i < W.pillars.length; i++) { var q = W.pillars[i]; if (!q.wall) continue; var t = Math.max(0, Math.min(1, ((q.x - x0) * dx + (q.y - y0) * dy) / L2)), cx = x0 + dx * t, cy = y0 + dy * t; if (Math.hypot(q.x - cx, q.y - cy) < q.r + r) return true; } return false;
}
function blinkStep(p, rx, ry) {            // the Blink-step: the man before you within reach is passed, you stand behind him, he is open for a breath (tier II); through two at tier III
  var best = null, bd = 1e9, n = runeN('blinkStep', 'through') || 1, i, ang = Math.atan2(ry, rx);
  for (i = 0; i < W.enemies.length; i++) { var e = W.enemies[i]; if (e.dead || e.side === 1 || e.down || e.out) continue; var d = Math.hypot(e.x - p.x, e.y - p.y); if (d > 60 || Math.abs(wrap(Math.atan2(e.y - p.y, e.x - p.x) - ang)) > 0.7 || wallBetween(p.x, p.y, e.x, e.y)) continue; if (d < bd) { bd = d; best = e; } }
  if (!best) return false; var tx = best.x + Math.cos(ang) * (best.r + p.r + 8), ty = best.y + Math.sin(ang) * (best.r + p.r + 8), hops = [best];
  if (n > 1) for (i = 0; i < W.enemies.length; i++) { var e2 = W.enemies[i]; if (e2 === best || e2.dead || e2.side === 1 || e2.down) continue; var d2 = Math.hypot(e2.x - tx, e2.y - ty); if (d2 < 44 && Math.abs(wrap(Math.atan2(e2.y - ty, e2.x - tx) - ang)) < 0.8) { tx = e2.x + Math.cos(ang) * (e2.r + p.r + 8); ty = e2.y + Math.sin(ang) * (e2.r + p.r + 8); hops.push(e2); break; } }
  if (pillarHit(tx, ty, p.r) || wallBetween(p.x, p.y, tx, ty) || wallPillarCross(p.x, p.y, tx, ty, p.r) || (api.scene && api.scene.walk && !api.scene.walk(tx, ty, p))) return false;   /* (never through a wall) */
  W.ghosts.push({ x: p.x, y: p.y, dir: heroDir(), t: p.animT, ph: p.anim.phase, life: 0.3, max: 0.3 }); p.x = tx; p.y = ty; p.invuln = Math.max(p.invuln, 0.3); p.vx = 0; p.vy = 0;
  hops.forEach(function (h) { if (runeN('blinkStep', 'open') > 0) h.exposedT = Math.max(h.exposedT || 0, runeN('blinkStep', 'open')); }); logEv({ k: 'blink', n: hops.length }); return true;
}
function shadeTick(dt) {                   // the Ghost-step's shade: the men within sight go for it while it lasts
  var sh = W.shade; if (!sh) return; sh.t -= dt; if (sh.t <= 0) { W.shade = null; return; }
  for (var i = 0; i < W.enemies.length; i++) { var e = W.enemies[i]; if (e.type !== 'soldier' || e.dead || e.down || e.out || e.side === 1) continue; if (Math.hypot(e.x - sh.x, e.y - sh.y) < 160) e.lure = sh; }
}
function markTick(e, dt) {                 // the marks that hurt: bleeding (the Serpent's tongue, the Bleeding point) and burning (the Fire-arrow)
  if (!e.marks || e.dead) return;
  if (e.marks.bleeding > 0 && e.type === 'soldier') { e.hp -= (e.bleedDmg || 3) * dt; e.showBar = 1; if (Math.random() < dt * 6 && api.onBlood) api.onBlood(e.x, e.y, 1, 0); if (e.out && e.state === 'flee' && runeHas('serpentTongue') && runeN('serpentTongue', 'fall') && !e.fellBleeding) { e.fellBleeding = true; knockDown(e, e.face, 0.5); } if (e.hp <= 0) { e.hp = 0; killEnemy(e, null); } }
  if (e.marks.burning > 0 && e.type === 'soldier') { e.hp -= (e.burnDmg || 1) * dt; e.showBar = 1; if (Math.random() < dt * 8) spark(e.x + (Math.random() - 0.5) * 10, e.y - 10 - Math.random() * 16, 2, '#ff9a40', 60); if (runeHas('torchHand') && runeN('torchHand', 'fear') && !e.out && e.type === 'soldier') breakMan(e, 'flee'); if (e.burnSpread && Math.random() < dt * 0.8) for (var j = 0; j < W.enemies.length; j++) { var o = W.enemies[j]; if (o !== e && o.type === 'soldier' && !o.dead && !marked(o, 'burning') && Math.hypot(o.x - e.x, o.y - e.y) < 30) { markOn(o, 'burning', 4); o.burnDmg = e.burnDmg; } } if (e.hp <= 0) { e.hp = 0; killEnemy(e, null); } }
}
function rushHits(p) {                     // during a rush or a dash: the men the hero runs into
  var ch = p.charge, i, ang = ch ? ch.ang : Math.atan2(p.roll.dy, p.roll.dx);
  for (i = 0; i < W.enemies.length; i++) { var e = W.enemies[i]; if (e.type !== 'soldier' || e.dead || e.down || e.out || e.side === 1) continue; if (Math.hypot(e.x - p.x, e.y - p.y) > e.r + p.r + 6) continue;
    if (ch) { if (ch.hit.indexOf(e) >= 0) continue; ch.hit.push(e); if (ch.hit.length <= ch.down) knockDown(e, ang, 1); else { e.kx += Math.cos(ang) * 220; e.ky += Math.sin(ang) * 220; }
      if (ch.strike) { var sd = meleeProfile(); hitFlags.wkind = sd.kind || 'sword'; damageEnemy(e, sd.dmg * dmgMul('sword'), ang, 0, 10, 'melee'); hitFlags.wkind = null; } }
    else if (runeHas('rushStep') && !e.rushed && (marked(e, 'struck') || (runeN('rushStep', 'any') && e.state === 'stagger'))) { e.rushed = 0.8; knockDown(e, ang, 0.8); if (runeN('rushStep', 'spread')) crowdBump(e, ang); } }
}
function crowdBump(best, ang) {            // the men a thrown man falls against stagger with him
  for (var i = 0; i < W.enemies.length; i++) { var q = W.enemies[i]; if (q === best || q.type !== 'soldier' || q.dead || q.down || q.out || q.side === 1) continue;
    var dq = Math.hypot(q.x - best.x, q.y - best.y), ahead = Math.cos(Math.atan2(q.y - best.y, q.x - best.x) - ang) > 0.3; if (dq > CROWD.bump + q.r + best.r || !ahead) continue;
    q.kx += Math.cos(ang) * CROWD.shoveD * 0.4; q.ky += Math.sin(ang) * CROWD.shoveD * 0.4; q.state = 'stagger'; q.t = 0; q.dur = CROWD.shoveT * 0.8; q.sw = null; q.swung = false; q.poiseT = 0.9; q.showBar = 2; }
}
function heavyBlow(e) { return e.type === 'soldier' ? !!(e.sw && e.sw.heavy) : (e.type === 'brute' || !!(e.cfg && e.cfg.atk && e.cfg.atk.heavy)); }
function glint(x, y, hv) { if (S.juice) W.glints.push({ x: x, y: y, t: 0, life: hv ? 0.5 : 0.35, hv: !!hv }); }
function perfectCheck() {                // a dash begun in the last moment before a blow would land
  var p = P, best = null, i;
  for (i = 0; i < W.enemies.length; i++) { var e = W.enemies[i]; if (e.dead || e.down || e.out || e.side === 1) continue;
    var eta = 9, reach = e.type === 'soldier' ? (e.sw ? e.sw.reach : 30) : ((e.cfg && e.cfg.atk && e.cfg.atk.reach) || 24);
    if (e.type === 'soldier') { if ((e.state === 'windup' || e.state === 'lunge') && e.tgt === p && !e.hitDone) eta = e.hitT - W.t; }
    else if (e.state === 'windup') eta = e.dur - e.t + 0.05; else if ((e.state === 'lunge' || e.state === 'active') && !e.hitDone) eta = 0.03;
    if (eta <= PERFECT.win && eta >= -0.02 && Math.hypot(e.x - p.x, e.y - p.y) <= reach + e.r + p.r + 26) { best = e; break; } }
  if (!best) return;
  slowmo(PERFECT.slow, PERFECT.slowT); p.st = Math.min(maxSt(), p.st + 18 * mod('dash')); best.exposedT = PERFECT.exposed; postureAdd(best, POSTURE.dodge);
  num(p.x, p.y - 32, 'DODGE!', '#9fd8ff', true); ring(p.x, p.y, 0, 26, 0.3, '170,220,255', false, 2.2); sfx('perfect'); logEv({ k: 'perfect', src: best });
}
// The log of the blows (2026-10-13, the Combat Arena's tools): a page may listen with api.onLog(ev), ev = { k, dmg, src, kind, ... }:
// 'dodged' (a blow came while a dash made him untouchable), 'parry', 'block' (what got through, and whether the guard broke),
// 'hurt', 'hit' (the hero's blow on a foe: dealt, crit, blocked by his shield, his guard broken), 'kill'.
function logEv(ev) { if (api.onLog) api.onLog(ev); }
function hurtPlayer(dmg, sx, sy, kind, src) {
  var p = P; if (p.dead) return false; if (p.invuln > 0) { if (p.roll.t > 0) logEv({ k: 'dodged', dmg: dmg, kind: kind, src: src }); return false; }
  var toSrc = Math.atan2(sy - p.y, sx - p.x);
  var gd = guardOf(), front = Math.abs(wrap(toSrc - p.face)) <= gd.arc || (p.guard && runeHas('midgardsWall'));   /* Midgard's wall: the guard stops everything from every side (Runes2, legendary) */
  if (p.guard && front && !(kind === 'proj' && src && src.type === 'soldier' && gd.kind !== 'shield')) {   /* (a bowman's arrow is stopped by a shield, not by a raised arm) */
    if (kind !== 'heavy' && p.guardT < parryWindow()) {
      p.parryFx = 0.35; p.parryK = gd.stun; p.st = Math.min(maxSt(), p.st + 12);
      spark(p.x + Math.cos(p.face) * 10, p.y + Math.sin(p.face) * 10, 14, '#fff6c8', 140);
      lockFor(p, 0.09); lockFor(src, 0.09); slowmo(0.25, 0.14); ring(p.x + Math.cos(p.face) * 10, p.y, 13, 24, 0.2, '255,243,196', true, 2.4); sfx('parry');
      var chN = chainUp(); num(p.x, p.y - 26, chN > 1 ? 'PARRY x' + chN : 'PARRY!', chN >= chainMax() ? '#ff9a4a' : chN > 1 ? '#ffc94a' : '#ffe27a', chN > 1); if (chN > 1) tone2(chN); logEv({ k: 'parry', dmg: dmg, kind: kind, src: src, chain: chN }); if (api.onDeed) api.onDeed('parry'); if (modZ('riposte') > 0) p.riposteT = 1.2; if (rune('guardBlow') === 'riposte') p.riposteT = runeN('riposte', 'window') || 0.6;   // the riposte rune: a free heavy blow follows
      return 'parry';
    }
    var gbH = hitFlags.guardBreak, red = (kind === 'heavy' || gbH) ? gd.heavy : gd.light;
    var d2 = dmg * red * (api.armor ? 1 - api.armor() : 1);
    if (runeHas('ironSkin')) d2 *= 1 - runeN('ironSkin', 'armor');
    if (runeHas('midgardsWall') && runeN('midgardsWall', 'back') && src && src.type === 'soldier' && !src.dead) damageEnemy(src, dmg * 0.5, toSrc + Math.PI, 60, 10, 'melee');   /* Midgard's wall II: a blow it stops is given back */
    p.hp -= d2; p.st -= gd.st * (gbH ? 1.8 : 1) * mod('block') * (runeHas('stoneGuard') ? runeN('stoneGuard', 'stK') : 1); p.stDelay = 0.8; if (api.onDeed) api.onDeed('block');   /* the Stone guard: a block costs less, or nothing */
    var kbs = kind === 'heavy' ? 110 : 55; if (hitFlags.stagger && !(runeHas('sureFoot') && runeN('sureFoot', 'noDown'))) { kbs = 150; p.hurtT = Math.max(p.hurtT, 0.24); p.guard = false; p.invuln = Math.max(p.invuln, 0.3); }   // (while he cannot act he cannot be struck: with more than one man on him he must always be able to get out)
    p.kx = -Math.cos(toSrc) * kbs; p.ky = -Math.sin(toSrc) * kbs;
    spark(p.x + Math.cos(p.face) * 9, p.y + Math.sin(p.face) * 9, 6, '#cfd6e6', 90);
    lockFor(p, 0.035); sfx('block');
    if (d2 > 0.5) num(p.x, p.y - 26, String(Math.round(d2)), '#cfd6e6');
    if (p.st <= 0 && runeHas('stoneGuard') && runeN('stoneGuard', 'noBreak')) p.st = 1;   /* the Stone guard III: no heavy blow breaks it */
    if (p.st <= 0) { p.st = 0; p.guard = false; p.hurtT = 0.35; p.invuln = Math.max(p.invuln, 0.42); num(p.x, p.y - 34, 'GUARD BREAK', '#ff9a7a'); }
    logEv({ k: 'block', dmg: dmg, through: d2, kind: kind, src: src, broke: p.st <= 0, stagger: !!hitFlags.stagger, guardBreak: !!gbH });
    if (p.hp <= 0) die();
    return 'block';
  }
  if (runeHas('thickHide')) { if (W.t - (p.lastHurtT || -99) > 6) p.fightHits = 0; p.fightHits = (p.fightHits || 0) + 1; p.lastHurtT = W.t; if (p.fightHits <= runeN('thickHide', 'first')) dmg *= runeN('thickHide', 'half') || 0.5; }   /* Thick hide: the first blows of a fight do half (Runes2) */
  var hit = dmg * (api.armor ? 1 - api.armor() : 1) * (runeHas('thickHide') ? 1 - runeN('thickHide', 'armor') : 1) * (runeHas('ironSkin') ? 1 - runeN('ironSkin', 'armor') : 1);     // armour turns a share of every blow aside, not only blocked ones
  if (runeHas('ironSkin') && kind === 'proj') hit *= 1 - runeN('ironSkin', 'arrow');   /* Iron skin III: arrows a third */
  if (berserkOn()) hit *= runeN('berserk', 'taken');   /* Berserk: you take more */
  if (runeHas('lastStand') && hit >= p.hp) { if (W.t - (p.lastHurtT || -99) > 6) p.stands = 0; if ((p.stands || 0) < runeN('lastStand', 'times')) { p.stands = (p.stands || 0) + 1; hit = Math.max(0, p.hp - 1); p.invuln = Math.max(p.invuln, runeN('lastStand', 'invuln') || 0.2); num(p.x, p.y - 34, 'LAST STAND', '#ff9a4a', true); ring(p.x, p.y, 0, 30, 0.4, '255,170,90', false, 3); sfx('last_stand'); } }   /* the Last stand: a killing blow leaves one health, once a fight */
  logEv({ k: 'hurt', dmg: dmg, through: hit, kind: kind, src: src, guard: p.guard, front: front });
  p.hp -= hit; p.chain = 0; p.rally = Math.min(p.maxHp, (p.rally || 0) + hit * RALLY.share); p.rally0 = p.rally; p.rallyT = 0;   // (the win-back: RALLY)
  p.invuln = 0.7; p.flash = 1; p.hurtT = 0.18; p.guard = false;   // (a blow that gets through ends the parry chain) p.anim.sq = 1; p.anim.sqv = 0;
  p.atk.ph = 'none'; p.atkBuf = 0;
  var kb = kind === 'heavy' ? 170 : 110;
  p.kx = -Math.cos(toSrc) * kb * (S.juice ? 1 : 0.4); p.ky = -Math.sin(toSrc) * kb * (S.juice ? 1 : 0.4);
  spark(p.x, p.y, 8, '#ff8a6a', 100);
  num(p.x, p.y - 28, String(Math.round(hit)), '#ff7a6a');
  lockFor(p, kind === 'heavy' ? 0.09 : 0.055); if (kind === 'heavy') slowmo(0.3, 0.12); sfx('hurt');
  if (p.hp <= 0) die();
  return 'hit';
}
function die() { P.dead = true; P.hp = 0; P.guard = false; sfx('die'); }

function damageEnemy(e, dmg, ang, kb, stag, kind, src) {   // src: the man whose blow this is; none is the hero
  var quiet = !src && e.type === 'soldier' && e.awake === false && !e.dead && !e.down && kind !== 'proj' && (e.asleep || Math.abs(wrap(ang - e.face)) < 1.25);   // the hero's blade in the back of a man at his post who has noticed nothing
  if (e.aggro || e.awake === false) e.awake = true;   // hitting a calm creature rouses it
  e.struck = true;
  if (e.shy && !e.dead) { e.bleedT = SHY.bleedT; e.bx = e.x; e.by = e.y; e.bloodD = SHY.trail; herdWake(e); }   // a shy beast bleeds from the hit (the first drop at once), and its herd runs
  if (e.dead || e.down) return;
  var mult = 1, weak = false, man = e.type === 'soldier', blocked = false, broke = false;
  var bigE = e.type === 'brute';
  if (man && e.shield && e.guard > 0 && Math.abs(wrap(ang + Math.PI - e.face)) <= (e.inLine ? MEN.frontLine : MEN.front)) {   // on his shield: a share gets through; an axe breaks the guard, a club staggers through it
    blocked = true; broke = (!!hitFlags.guardBreak || stag >= 40) && !(e.inLine && kind !== 'heavy'); if (e.side === 1 && runeHas('shieldWall')) { if (e.inLine && runeN('shieldWall', 'unbroken')) broke = false; if (Math.hypot(e.x - P.x, e.y - P.y) < 48) dmg *= 0.5; }   /* the Shield-wall: a man of yours beside you stops more; a held line of yours cannot be broken (III) */   /* (a shield wall: only a heavy blow breaks a shield in it: raid step 5, 2026-10-20) */
    dmg *= kind === 'proj' ? 0 : broke ? MEN.blockBroken : (kind === 'heavy' ? MEN.blockHeavy : MEN.blockLight) * (e.wpn.kind === 'sword' ? 0.6 : 1); if (e.inLine) dmg *= MEN.wallK;   // (an arrow on a raised shield is stopped)   // the sword is the surest guard; a blow that breaks the guard mostly gets through
    if (broke) { e.guard = 0; e.guardAge = 0; e.guardCd = 1.1; e.brokeT = 1; if (!src && hitFlags.wkind === 'axe' && runeHas('axeBreaker')) { stag = Math.max(stag, 42); e.guardCd *= runeN('axeBreaker', 'downK') || 1; e.axeOpen = runeN('axeBreaker', 'open') || 1; sfx('guard_break', 0, e); } else if (!src && hitFlags.guardBreak && kind !== 'proj' && swingRune() === 'overhead') sfx('guard_break', 0, e); }   /* the Axe-breaker: a broken guard staggers, stays down longer, opens him */ else { e.blocked = (e.blocked || 0) + 1; e.guard = Math.max(e.guard, 0.35); e.cd = Math.min(e.cd, 0.2 + (1 - e.w01) * 0.4); }
  }
  if (man) dmg *= 1 - (e.armor || 0);
  if (quiet) { dmg = Math.max(dmg * 3, e.hp + 1); e.quietKill = true; }   // one blow, and no cry
  if (!src && e.shy && e.awake === false && runeHas('hunterStride') && runeN('hunterStride', 'kill')) dmg = Math.max(dmg, e.hp + 1);   /* the Hunter's stride III: a beast reached unseen falls to the first blow */
  if (!src && kind === 'proj' && e.shy && runeHas('bleedingPoint')) { e.bleedT = SHY.bleedT * (runeN('bleedingPoint', 'bleedK') || 1); if (runeN('bleedingPoint', 'trail') > 1) e.bloodD = SHY.trail / 2; }   /* the Bleeding point: a shot beast bleeds out faster, its trail thicker */
  if (e.state === 'recover') mult = bigE ? 1.3 : (src ? 1.2 : 1.5);   // caught recovering: half again from the hero, a fifth more from a man
  var reeling = !src && !bigE && e.state === 'stunned'; if (reeling) { mult *= e.ripK || 1.3; kb *= CHAIN.kb; }   // parried and reeling: your blows bite harder and push him only a little, so he stays in reach (the parry chain)
  var fin = !src && e.finish && e.state === 'stunned' && P.atk.finisher;   // the finishing blow (POSTURE)
  if (!src && man && !fin && kind !== 'proj' && runeHas('fenrirsJaw') && !blocked) { P.jaw = (P.jaw || 0) + 1; if (P.jaw >= (runeN('fenrirsJaw', 'every') || 3)) { P.jaw = 0; fin = true; e.finish = true; } }   /* Fenrir's jaw: every so many blows that land is a finishing blow (legendary) */
  if (!src && kind === 'proj' && man && runeHas('hawkEye') && runeN('hawkEye', 'finish') > 0 && Math.random() < runeN('hawkEye', 'finish')) { fin = true; e.finish = true; }   /* the Hawk's eye III: the arrow finds the eye */
  if (!src && e.exposedT > 0) mult *= PERFECT.bonus;                       // after a perfect dodge
  if (bigE && e.state === 'stunned') mult = 2;
  var cb2 = !src && hitFlags.wkind === 'seax' && runeHas('serpentTongue') ? runeN('serpentTongue', 'crit') : 0;
  var crit = !src && !blocked && (S.crit > 0 || critBonus > 0 || cb2 > 0) && Math.random() < S.crit + critBonus + cb2;
  if (crit) mult *= 1.5;
  if (crit && cb2 > 0 && man) { markOn(e, 'bleeding', 5); e.bleedDmg = runeN('serpentTongue', 'bleed') || 3; }   /* the Serpent's tongue: a crit bleeds */
  if (!src && man && e.axeOpen > 1) { mult *= e.axeOpen; e.axeOpen = 0; }
  if (berserkOn()) mult *= runeN('berserk', 'dmg') || 1;
  if (!src && kind === 'proj' && man && e.awake === false && runeHas('hawkEye')) mult *= runeN('hawkEye', 'unseen') || 1;   /* the Hawk's eye: a man who has not seen you takes double */
  if (!src && hitFlags.still > 1) mult *= hitFlags.still;   /* the Still hand: the arrow after two seconds standing still */
  if (!src && (hitFlags.wkind === 'club' || hitFlags.wkind === 'cudgel') && runeHas('oakArm')) { kb += runeN('oakArm', 'kb') || 0; if (runeN('oakArm', 'drop') && e.errand) e.errand.hold = false; if (runeN('oakArm', 'wallStun')) stag = Math.max(stag, 40); }   /* the Oak-arm: a club blow throws the man back */
  if (quiet) crit = true;                                     // (shown as a critical blow)
  if (!src && man && marked(e, 'struck') && runeHas('hammer')) { var hk = (hitFlags.wkind === 'club' || hitFlags.wkind === 'cudgel') ? runeN('hammer', 'club') : runeN('hammer', 'any'); if (hk > 1) { mult *= hk; if (hk >= 2) stag = Math.max(stag, 42); } }   /* the Hammer: a blow on a struck man (Runes2) */
  var dealt = dmg * mult * (src ? 1 : mod('dmg'));          // mods().dmg: a page's damage multiplier (the admin one-shot cheat)
  if (fin) crowdFear(e);
  if (fin && runeHas('ringOfSteel') && runeN('ringOfSteel', 'finish') && (P.chain || 0) >= chainMax()) e.maxHp = Math.min(e.maxHp, 40);   /* the Ring of steel III: a chain of five finishes any man */
  if (fin) { crit = true; dealt = e.maxHp > 40 ? Math.max(dealt * 3, e.maxHp * 0.34) : Math.max(dealt, e.hp + 0.01); e.finish = false; P.chain = 0; P.invuln = Math.max(P.invuln, 0.55); slowmo(0.22, 0.34); ring(e.x, e.y, 0, 54, 0.4, '255,150,80', false, 3.4); ring(e.x, e.y, 10, 30, 0.3, '255,236,200', true, 2.2); num(e.x, headY(e) - 10, 'FINISHED', '#ff8a3a', true); sfx('finish'); logEv({ k: 'finish', e: e, dmg: dealt }); }
  e.hp -= dealt; e.showBar = 2.2; e.sinceHit = 0;
  if (!src) logEv({ k: 'hit', e: e, dmg: dealt, crit: crit, kind: kind, blocked: blocked, broke: broke, weak: weak, quiet: quiet, killing: e.hp <= 0 });
  if (!src) { W.heroHit = e; W.heroHitT = W.t; if (man) noise(e.x, e.y, quiet ? MEN.quiet : MEN.noise.blow * din(), false, quiet ? e : null); }
  else if (man && src.type === 'soldier' && !src.dead) { e.hitBy = src; e.hitByT = W.t; }   // (2026-10-14: a man remembers who struck him last, and turns to him: see pickTarget)   // (the man the quiet blow falls on is not one who heard it)
  if (e.errand) { var er0 = e.errand; if (er0.hold && e.hp > e.maxHp * (e.side === 1 && runeHas('heavyBack') && runeN('heavyBack', 'hold') ? 0 : MEN.dropAt)) { /* a carrier holds on until badly hurt (raid step 3, 2026-10-20; decided 2026-10-13) */ } else { e.errand = null; if (er0.drop) er0.drop(e); } }   // struck on an errand: that is the end of it (he drops what he carries, and fights), unless he was told to hold on
  if (e.side === 1 && e.hp <= 0 && !e.mortal) {            // one of the hero's own: down, not dead
    e.flash = 1; e.flashRgb = '255,255,255'; spark(e.x, e.y, 6, '#ff8a6a', 90); goDown(e); return;
  }
  var killing = e.hp <= 0;
  if (killing && !src && hitFlags.wkind === 'cudgel' && e.type === 'beast' && !e.human) { e.hp = 1; killing = false; knockOut(e); }
  if (fin && !src && e.type === 'beast' && !e.human && runeHas('fenrirsJaw') && runeN('fenrirsJaw', 'tame')) { e.hp = 1; killing = false; knockOut(e); e.tame = true; e.side = 1; num(e.x, headY(e), 'YOURS', '#ffd34d'); }   /* Fenrir's jaw III: a finishing blow on a beast makes it yours */
  if (!src && hitFlags.wkind === 'greataxe' && runeHas('twinBlow') && (killing || runeN('twinBlow', 'onAny'))) P.recFast = 1;   /* the Twin blow */   /* the cudgel never kills a beast: out cold instead (Robin, 2026-10-23) */
  if (!src && dealt > 0 && !(blocked && !broke) && hitFlags.wkind !== 'lightning') runeBlood(1);   /* a blow landed feeds the blood rings of the actives (Runes2) */
  if (!src && man && !killing && hitFlags.wkind !== 'lightning' && runeHas('thorsWrath') && Math.random() < runeN('thorsWrath', 'chance')) lightning(e, runeHas('stormsEye') ? runeN('stormsEye', 'leaps') : 0, runeN('thorsWrath', 'dmg') * dmgMul('sword'), 0);
  if (!src && !killing && !fin) postureAdd(e, blocked && !broke ? POSTURE.block : broke ? POSTURE.block * 1.5 : reeling ? 0 : POSTURE.hit);   // his balance: what he stops on his shield, and a little of what lands
  if (!src && (!blocked || broke) && P.rally > 0 && !P.dead) { var rg = Math.min(P.rally, RALLY.perHit * (hitFlags.wt || 1), P.maxHp - P.hp); if (rg > 0.05) { P.hp += rg; P.rally -= rg; num(P.x - 8, P.y - 30, '+' + Math.max(1, Math.round(rg)), '#9be58b'); logEv({ k: 'rally', dmg: rg }); } }   // the win-back (RALLY)
  if (src) {                                               // a blow between men: no pause for the hero, no number, a quieter mark
    e.flash = blocked ? 0.5 : 1; e.flashRgb = '255,255,255';
    var push = blocked ? (hitFlags.thrust ? 1.1 : 0.4) : (hitFlags.thrust ? 1.2 : 0.8); e.pkx = 0; e.pky = 0; e.kx += Math.cos(ang) * kb * push; e.ky += Math.sin(ang) * kb * push;   // a spear keeps its man at the point, stopped or not
    spark(e.x - Math.cos(ang) * e.r * 0.8, e.y - Math.sin(ang) * e.r * 0.8, blocked ? 3 : 5, blocked ? '#cfd6e6' : '#fff3b0', 90); sfx(blocked ? 'block' : 'hit', 0, e);
    if (broke) bits(e.x, e.y, 3);
    if (killing) { killEnemy(e, src); return; }
    if (blocked && !broke) return;
    if (man && e.state === 'lunge') return;
    if (man && e.state === 'windup' && kind !== 'heavy' && !broke) return;
    if (e.type === 'beast' && (e.state === 'lunge' || e.state === 'windup')) return;
    if (man && e.poiseT > 0 && kind !== 'heavy' && !broke) { heartOf(e); return; }
    if (e.state !== 'recover' || man) { e.state = 'stagger'; e.t = 0; e.dur = kind === 'heavy' || broke ? 0.34 : 0.16; e.sw = null; e.swung = false; e.poiseT = 0.9; }
    if (man) heartOf(e);
    return;
  }
  if (S.juice) { e.flash = 1; e.flashRgb = crit ? '255,208,70' : '255,255,255'; }
  var heavy = kind === 'heavy' || weak || stag >= 20, melee = kind === 'melee' || kind === 'heavy';
  var kbm = e.type === 'brute' ? 0.3 : (e.type === 'shooter' ? 0.15 : 1);
  var hx = e.x - Math.cos(ang) * e.r * 0.8, hy = e.y - Math.sin(ang) * e.r * 0.8;
  var hot = crit ? '255,208,70' : (weak ? '143,227,255' : '255,255,255');
  var WT = !src && melee ? (hitFlags.wt || 1) : 1, WK = !src && melee ? hitFlags.wkind : null;   // the weight of the hero's weapon (rung 8, 2026-10-13): a seax's hit is light and quick, a club's lands like a stone
  if (S.juice) {
    var WM = WPRE[S.weight] || WPRE.normal;
    var fz = melee ? ((heavy && !killing) ? 0.09 : 0.055) * (0.6 + 0.4 * WT) : 0.025;
    if (crit) fz += 0.015;
    fz *= WM.fz;
    e.freezeT = Math.max(e.freezeT, fz); if (melee) P.freezeT = Math.max(P.freezeT, fz * 0.9 * WM.pf);
    e.pkx = Math.cos(ang) * kb * kbm * WM.kb; e.pky = Math.sin(ang) * kb * kbm * WM.kb;
    e.sq = 1; e.sqAng = ang;
    streaks(hx, hy, ang, (heavy && !killing ? 8 : 5) + (crit ? 4 : 0), heavy ? 260 : 200, crit ? '255,214,90' : null);
    ring(hx, hy, 12, ((heavy && !killing) ? 22 : 14) * (0.7 + 0.3 * WT), heavy ? 0.16 : 0.12, hot, true, (heavy ? 3 : 2) * (WT > 1.3 ? 1.3 : 1));
    if (crit) ring(hx, hy, 12, 28, 0.2, '255,208,70', true, 2.4);
    if (heavy && !killing) slowmo(WM.hs, WM.hd * (WT > 1.3 ? 1.4 : 1));
    if (WT >= 1.4 && !blocked) dust(e.x, e.y, 3);                                   // a club or a Dane axe lands with dust
  }
  spark(hx, hy, Math.round(((heavy && !killing ? 12 : 7) + (crit ? 5 : 0)) * (0.7 + 0.3 * WT)), crit ? '#ffd34d' : (weak ? '#8fe3ff' : '#fff3b0'), heavy ? 150 : 110);
  num(e.x, e.y - e.r * 2.2 - 10, String(Math.max(1, Math.round(dealt * SHOW))), blocked && !broke ? '#cfd6e6' : crit ? '#ffd34d' : (weak ? '#8fe3ff' : '#ffffff'), !blocked && (heavy || crit || WT >= 1.4));   // (the number is the blow times SHOW, whole; a heavy weapon's is big)
  sfx(blocked && !broke ? 'block' : ((heavy && !killing) || WT >= 1.4) ? 'heavyhit' : 'hit', melee ? Math.min(2, P.atk.combo) : 0, null, WK ? { kind: WK, wt: WT, heavy: heavy && !killing } : null);
  if (!blocked && !killing && e.type === 'beast' && e.bkind) sfx('pain', (heavy || WT >= 1.4) ? 1 : 0, e, { beast: e.bkind });   // the beast's own cry, after the hit (the page plays it if one is picked: 2026-10-20)
  if (broke) { bits(e.x, e.y, 4); sfx('slam', 0, e); }
  if (crit) { sfx('crit'); e.rattle = 1.6; }
  if (bigE) {
    if (e.state !== 'stunned') {
      e.stagMeter += stag * (weak ? 2 : 1) * (crit ? 1.25 : 1);
      if (e.stagMeter >= 100) { e.state = 'stunned'; e.t = 0; e.dur = 2.6; e.stagMeter = 100; num(e.x, e.y - 50, 'STAGGERED!', '#ffd34d'); slowmo(0.3, 0.2); ring(e.x, e.y, 0, 60, 0.35, '255,230,140', false, 3); sfx('stagger'); }
    }
  } else if (e.type === 'beast' && (e.state === 'lunge' || (e.state === 'windup' && !heavy))) {
    // an animal that has begun its attack finishes it: a light hit does not stop it (only a heavy hit or a parry does)
  } else if (man) {                                        // a man: a blow he has begun he finishes unless it was a heavy one; a blow on his shield he holds; on his knees he stays there
    if (e.state === 'yield' || e.state === 'flee') { /* stays as he is */ }
    else if (e.state === 'stunned') { e.flash = Math.max(e.flash, 0.6); }   // reeling from a parry: the stun holds through your blows (it ended at the first, 2026-10-15)
    else if (blocked && !broke) { /* holds */ }
    else if (e.state === 'lunge' || (e.state === 'windup' && !heavy && !broke)) { /* finishes it */ }
    else if (e.poiseT > 0 && !heavy && !broke) { /* he has just flinched: this one he takes on his feet */ }
    else { e.state = 'stagger'; e.t = 0; e.dur = heavy || broke ? 0.36 : 0.16; e.sw = null; e.swung = false; e.poiseT = 0.9; }
    if (!killing) heartOf(e);
  } else if (heavy && e.state !== 'recover' && e.state !== 'stunned' && !(W.t - (e.stagAt == null ? -99 : e.stagAt) < BEAST_POISE)) { e.state = 'stagger'; e.t = 0; e.dur = 0.34; e.stagAt = W.t; }   // a heavy blow staggers a beast; a light one does not stop it at all (2026-10-14, Robin: they staggered too easily; before, a light hit was a 0.14 s flinch): the flash, the squash and the push are its whole answer
  else if (!heavy && (e.state === 'idle' || e.state === 'wander')) { e.state = 'chase'; e.t = 0; }
  if (killing) killEnemy(e);
}
function killEnemy(e, src) {
  var bigK = e.type === 'brute';
  e.dead = true; e.deadT = 0; e.guard = 0; e.sw = null; e.killer = src || null; logEv({ k: 'kill', e: e, src: src }); if (e.type === 'soldier') noise(e.x, e.y, e.quietKill ? MEN.quiet * (runeHas('quietBlade') ? (runeN('quietBlade', 'fellow') ? 0 : 0.5) : 1) : MEN.noise.cry);
  if (src) { spark(e.x, e.y, 5, '#ffd98a', 90); sfx('die', 0, e); }
  else { W.kills++; if (e.type !== 'soldier') bits(e.x, e.y, bigK ? 22 : 8); spark(e.x, e.y, 9, '#ffd98a', 120);
    slowmo(bigK ? 0.4 : 0.55, (bigK ? 0.16 : 0.08) * (WPRE[S.weight] || WPRE.normal).kd); ring(e.x, e.y, 12, bigK ? 36 : 18, 0.2, '255,226,150', true, 2); sfx('die'); }
  if (W.lock === e) W.lock = null;
  if (!src && runeHas('bloodlust') && !P.dead) { var bl = runeN('bloodlust', 'heal'); P.hp = Math.min(P.maxHp, P.hp + bl); num(P.x - 8, P.y - 30, '+' + bl, '#c8322a'); if (runeN('bloodlust', 'ready') && RS2() && typeof Runes2 !== 'undefined') Runes2.readyAll(RS2()); }   /* Bloodlust (Runes2) */
  if (api.onDeath) api.onDeath(e);
  if (e.type === 'brute') num(e.x, e.y - 50, (e.name || 'Brute') + ' DOWN', '#ffe27a');
}
function daze(e, dur) { e.state = 'recover'; e.t = 0; e.dur = dur; }
function stunStars(c, e) {             // three small stars going round over a stunned head (2026-10-15)
  var h = e.type === 'soldier' ? 46 : e.r * 2.4 + 12, t = W.t || 0, i; c.save();
  for (i = 0; i < 3; i++) { var a2 = t * 5 + i * 2.09, sx = e.x + Math.cos(a2) * 8, sy = e.y * K - h + Math.sin(a2) * 2.5; c.fillStyle = '#ffd34d'; c.strokeStyle = 'rgba(60,40,10,0.8)'; c.lineWidth = 0.6; c.beginPath(); for (var j = 0; j < 10; j++) { var rr = j % 2 ? 1.1 : 2.6, aa = j * Math.PI / 5 - Math.PI / 2; c.lineTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr); } c.closePath(); c.fill(); c.stroke(); }
  c.restore();
}
function tell(e) {                     // the start of a windup, shown in the world (2026-10-14, the red line gone): dust under the feet and a glint before the attacker; red for a blow that cannot be parried (2026-10-15)
  if (!S.juice) return; var hv = heavyBlow(e); dust(e.x, e.y, 3); var dl = e.dirLock != null ? e.dirLock : e.face; spark(e.x + Math.cos(dl) * (e.r + 6), e.y + Math.sin(dl) * (e.r + 6) - e.r * 1.2, 3, hv ? '#ff6a4a' : '#fff3b0', 55);
  glint(e.x + Math.cos(dl) * (e.r + 5), e.y * K + Math.sin(dl) * (e.r + 5) * K - (e.human ? 30 : e.r * 1.6 + 6), hv); if (hv) sfx('heavytell', 0, e);
}
function tone2(n) { sfx('chain', n); }   // the chain heard: the charge's rising tone, a step higher each parry
function stun(e, dur) {                     // a parry's stun (2026-10-14, Robin: it should stun the mob for about a second): he stands dazed, open to anything, stars over his head
  e.state = 'stunned'; e.t = 0; e.dur = dur; e.sw = null; e.swung = false; e.hitDone = true; e.stunT = dur; e.ripK = 1 + CHAIN.dmg * (P.chain || 1);   // (your blows on him while he reels: see CHAIN)
  if (S.juice) { ring(e.x, e.y, 0, 22, 0.25, '255,230,140', false, 2.4); spark(e.x, e.y - e.r * 2, 6, '#ffe27a', 90); }
  sfx('stagger', 0, e);
}

/* ---------- player ---------- */
function startAttack() {
  var p = P, a = p.atk;
  if (a.ph === 'recover' || a.since < 0.45) a.combo = (a.combo + 1) % chainLen(); else a.combo = 0;
  a.riposte = false; a.ripRune = false; if (p.riposteT > 0 && p.mode === 'fight' && rune('guardBlow') !== 'riposte') { a.combo = chainLen() - 1; a.riposte = true; p.riposteT = 0; }
  a.dir = aimAngle(); p.face = a.dir; if (!S.juice) p.faceVis = a.dir;
  a.finisher = false; if (p.mode === 'fight') for (var fi = 0; fi < W.enemies.length; fi++) { var fe = W.enemies[fi]; if (fe.finish && !fe.dead && fe.state === 'stunned' && Math.hypot(fe.x - p.x, fe.y - p.y) < meleeProfile().reach + fe.r + 30) { a.finisher = true; a.combo = chainLen() - 1; a.dir = Math.atan2(fe.y - p.y, fe.x - p.x); p.face = a.dir; break; } }   // a foe ready for it: the finishing blow is the chain's heavy last swing, at him
  a.ph = 'windup'; a.t = 0; a.hit = []; a.tr = null; if (!a.whirl) a.spin = false; a.bash = false; a.smashed = false; a.recK = p.recFast ? (runeN('twinBlow', 'recK') || 0.5) : 1; p.recFast = 0;   /* the Twin blow: the Dane axe recovers in half the time after a kill (or any landed blow at tier II) */
  a.feint = false; if (p.mode === 'fight' && swingRune() === 'feint' && a.since > 1.2 && !a.finisher && !a.riposte) { a.feint = true; }   /* the Feint: the first swing after a pause opens the man's guard instead of striking (Runes2) */
  if (p.mode === 'fight') { p.st -= (bareHanded() ? 4 : meleeProfile().st) * stK() * (a.feint && runeN('feint', 'free') ? 0 : 1); p.stDelay = 0.5; }
  if (p.mode === 'fight' && swingRune() === 'whirl' && !bareHanded() && (meleeProfile().kind === 'greataxe' || meleeProfile().kind === 'spear')) { a.spin = true; a.whirl = runeN('whirl', 'turns') || 1; sfx('whirl', 0, p); }   /* the Whirl: a two-handed swing goes full round */
  a.clipRune = null; if (p.mode === 'fight' && !bareHanded() && !a.finisher) { var swr0 = swingRune(), wk0 = meleeProfile().kind, oneH = wk0 !== 'greataxe' && wk0 !== 'spear'; if (a.spin && a.whirl) a.clipRune = 'whirl'; else if (a.feint) { if (oneH) a.clipRune = 'feint'; } else if (swr0 === 'lunge') { sfx('lunge', 0, p); a.clipRune = wk0 === 'spear' ? 'thrust_long' : wk0 === 'greataxe' ? null : 'lunge'; } else if (swr0 === 'sweep' && wk0 === 'spear') { sfx('sweep', 0, p); a.clipRune = 'sweep'; } }   /* a.clipRune: Colin, AD's lunge and overhead clips, one-handed, picked by Sprites.pick (2026-10-24); the Overhead's is set in releaseCharge, the held blow's own path */   /* the swing runes' own sounds (Derek, SD's, 2026-10-24) */
  if (p.feintHeavy) { a.combo = chainLen() - 1; p.feintHeavy = 0; }
  p.guard = false; p.anim.sq = -0.25; p.anim.sqv = 0;
  swingSound(a);
}
/* The swing is heard from the windup's start (2026-10-15, Robin: the sword's swing sounded really bad): the blow lands about
   SWING_LAG after the windup ends, so a whoosh that began there played after the hit. x.lead says how long until it lands; a page
   with a recording starts it so its loudest moment comes then (and cuts it when the blow lands), a synthesized one waits that long. */
var SWING_LAG = 0.015;
function swingReachBonus(wk) {             // how much further a swing reaches under its rune (the Lunge a stride a tier, the Spear-wall and the Sweep at tier III); wk: the weapon's kind
  var r = swingRune(), b = 0; if (r === 'lunge') b += 24 * (runeN('lunge', 'stride') || 1); if (r === 'sweep' && wk === 'spear') b += runeN('sweep', 'reach') || 0; if (runeHas('spearWall') && wk === 'spear') b += runeN('spearWall', 'reach') || 0; return b;
}
function swingSound(a) { if (P.mode !== 'fight' || P.weapon === 'ranged') return; var sd = stepData(a); sfx('swing', 0, null, { kind: bareHanded() ? null : meleeProfile().kind, wt: sd.wt || 1, heavy: heavyHit(a), lead: sd.wu + SWING_LAG }); }
function releaseCharge() {
  var p = P, a = p.atk, c = clamp((a.t - 0.3) / 0.7, 0, 1);
  a.combo = 3; a.chg = c; a.dir = aimAngle(); p.face = a.dir; if (!S.juice) p.faceVis = a.dir;
  a.ph = 'windup'; a.t = 0; a.hit = []; a.tr = null; p.st -= 10; p.stDelay = 0.6;
  a.clipRune = null; if (p.mode === 'fight' && !bareHanded() && swingRune() === 'overhead' && c > 0.6) { sfx('overhead', 0, p); if (meleeProfile().kind !== 'greataxe') a.clipRune = 'overhead'; }   /* the Overhead: a held blow brought down (Colin, AD's clip and Derek, SD's sound, 2026-10-24) */
  swingSound(a);
}
function stepData(a) {
  var s0 = stepData0(a);
  if (P.mode === 'gather') { var gp = api.gatherPace ? api.gatherPace() : 1; return { wu: s0.wu * gp, ac: s0.ac, rec: s0.rec * gp, arc: s0.arc, reach: s0.reach, blade: s0.blade, dmg: s0.dmg, kb: s0.kb, lunge: 0, stag: s0.stag }; }   // chopping and mining at the page's pace (api.gatherPace; holding the button keeps swinging)
  if (bareHanded() && !a.bash && !a.spin) return { wu: s0.wu, ac: s0.ac, rec: s0.rec, arc: s0.arc * 0.6, reach: s0.reach * 0.66, blade: 7, dmg: s0.dmg, kb: s0.kb * 0.5, lunge: s0.lunge * 0.7, stag: s0.stag * 0.5 };   // a punch: short, quick, light
  return s0;
}
function stepData0(a) {
  var s;
  if (a.bash) return { wu: 0.06, ac: 0.1, rec: 0.3, arc: 1.6, reach: 30, blade: 20, dmg: 0.6, kb: 260, lunge: 160, stag: 45 };
  var pf = (P.mode === 'fight' && !bareHanded()) ? meleeProfile() : null;
  if (pf && pf !== PROFILES.sword) {                     // from the weapon's profile: light hits, then the heavy last one; charged is heavier still
    var last = a.combo === 3 || a.combo === pf.chain - 1, cc = a.combo === 3 ? (a.chg || 0) : 0, hv = last ? (pf.heavy ? 0.5 : 1) : 0;   // (a kind that is heavy already grows less on its last blow: a Dane axe's second swing is not 2.4 s)
    s = { wu: pf.wu * (1 + hv) * (1 + cc * 0.3), ac: pf.ac * (1 + hv * 0.3), rec: pf.rec * (1 + hv * 1.2), arc: pf.arc * (1 + hv * 0.3) + cc * (pf.motion === 'thrust' ? 0.2 : 1), reach: pf.reach * (1 + hv * 0.2) + cc * 8, blade: pf.blade * (1 + hv * 0.15) + cc * 4,
      dmg: pf.dmg * (1 + hv) + 1.5 * cc, kb: pf.kb * (1 + hv) + 150 * cc, lunge: pf.lunge * (1 + hv * 0.6) + 60 * cc, stag: pf.stag * (1 + hv * 1.4) + 16 * cc, motion: pf.motion, pierce: !!pf.pierce, guardBreak: !!pf.guardBreak, wt: pf.wt || 1 };
  }
  else if (a.combo === 3) { var c = a.chg || 0; s = { wu: 0.07, ac: 0.14, rec: 0.38, arc: 3.4 + c, reach: 42 + c * 8, blade: 31 + c * 4, dmg: 2 + 1.5 * c, kb: 200 + 150 * c, lunge: 120 + 60 * c, stag: 24 + 16 * c }; }
  else { s = STEPS[a.combo]; if (P.mode === 'fight') s = Object.assign({}, s, { wu: a.combo === 2 ? 0.06 : 0.03 }); }   /* the sword and the fists take their blows from STEPS, not PROFILES.sword: they start on the press too (Robin, 2026-10-20) */
  if (S.juice) return s;
  return { wu: s.wu * 2.6, ac: s.ac, rec: s.rec * 2.2, arc: s.arc, reach: s.reach, blade: s.blade, dmg: s.dmg, kb: s.kb, lunge: 0, stag: s.stag, motion: s.motion, pierce: s.pierce, guardBreak: s.guardBreak };
}
function gapAhead(dir) {
  var g = 999;
  for (var i = 0; i < W.enemies.length; i++) {
    var e = W.enemies[i]; if (e.dead || e.side === 1 || e.down) continue;
    var dx = e.x - P.x, dy = e.y - P.y;
    if (Math.abs(wrap(Math.atan2(dy, dx) - dir)) < 1.0) g = Math.min(g, Math.hypot(dx, dy) - e.r - P.r);
  }
  return g;
}
function collideBodies() {
  var p = P; if (p.dead || p.roll.t > 0) return;
  for (var i = 0; i < W.enemies.length; i++) {
    var e = W.enemies[i]; if (e.dead || e.down) continue;
    var dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), mn = p.r + e.r;
    if (d < mn && d > 0.01) {
      var ov = mn - d, share = e.side === 1 ? 0.08 : e.type === 'shooter' ? 1 : (e.type === 'brute' ? 0.7 : 0.45), nx = dx / d, ny = dy / d;
      moveCircle(p, nx * ov * share, ny * ov * share);
      if (e.type !== 'shooter') moveCircle(e, -nx * ov * (1 - share), -ny * ov * (1 - share));
    }
  }
}
function updateAnim(dt, dashing) {
  var p = P, an = p.anim;
  var sp = Math.min(200, Math.hypot(p.vx, p.vy * K));
  var target = dashing ? 1 : Math.min(1, sp / 105);
  an.amt += (target - an.amt) * Math.min(1, dt * (target > an.amt ? 14 : 9));
  var hs = lib.hero().spec;
  if (an.amt > 0.04) an.phase += Math.max(sp, 30) * dt * 0.115 * (hs ? hs.walkRate : 1);
  an.t += dt;
  an.run += ((p.sprinting ? 1 : 0) - an.run) * Math.min(1, dt * 8);
  an.bob = -Math.abs(Math.sin(an.phase)) * 1.0 * an.amt * (1 + 0.45 * an.run) * (hs ? hs.bob : 1) + Math.sin(an.t * 2.2) * (1 - an.amt) * 0.4;
  var tx = (p.vx / 118) * 1.1, ty = (p.vy * K / 118) * 0.8;
  an.lvx += ((tx - an.lx) * 220 - an.lvx * 27) * dt; an.lx += an.lvx * dt;
  an.lvy += ((ty - an.ly) * 220 - an.lvy * 27) * dt; an.ly += an.lvy * dt;
  an.blinkT -= dt;
  if (an.blinkT <= 0) { an.blinkT = 2.4 + Math.random() * 3.2; an.blinkP = 0.14; }
  an.blinkP -= dt; an.blink = an.blinkP > 0 ? Math.sin(Math.PI * (1 - an.blinkP / 0.14)) : 0;
  an.sqv += ((0 - an.sq) * 260 - an.sqv * 20) * dt; an.sq += an.sqv * dt;
}
function updatePlayer(dt) {
  var p = P, a = p.atk, i;
  if (p.dead) return;
  packT -= dt;
  if (p.venom) {                           // a lingering bite: a little damage each second, then it passes
    p.venom.t -= dt; p.venom.tick = (p.venom.tick || 0) - dt;
    if (p.venom.tick <= 0) { p.venom.tick = 1; p.hp -= p.venom.dmg; num(p.x, p.y - 24, String(p.venom.dmg), '#9be58b'); if (p.hp <= 0) die(); }
    if (p.venom.t <= 0) p.venom = null;
  }
  var bowOut = p.mode === 'fight' && p.weapon === 'ranged';
  var hb = p.mode === 'gather' && modZ('heavyblow') > 0;
  if (hb) {                                     // the heavy blow rune: hold to wind up, let go to land one blow worth three
    if (IN.lmb || IN.keys.KeyJ) { p.holdG = (p.holdG || 0) + dt; }
    else if (p.holdG > 0) { p.heavyG = p.holdG >= 0.45 ? 1 : 0; p.holdG = 0; p.atkBuf = S.juice ? 0.2 : 0.02; }
  }
  p.shoveCd = Math.max(0, (p.shoveCd || 0) - dt); p.bashT = Math.max(0, (p.bashT || 0) - dt); if (p.cryT > 0) { p.cryT = Math.max(0, p.cryT - dt); if (p.cryDue && p.cryT <= CRY_T - CRY_AT) { p.cryDue = false; warCryOut(p); } }
  var gbRune = rune('guardBlow'), shoving = CROWD.shove > 0 && !!gbRune && (IN.pressed.lmb || IN.pressed.KeyJ) && p.guard && p.mode === 'fight' && !bowOut && p.roll.t <= 0 && p.hurtT <= 0 && p.freezeT <= 0;   /* the guard-blow: the blow with the guard held, what the bound rune makes of it (the Bash, the Charge: CROWD, Runes2, 2026-10-23) */
  if (shoving) { IN.pressed.lmb = false; IN.pressed.KeyJ = false; if (p.shoveCd <= 0 && p.st >= CROWD.shoveSt) { if (!runeReady('guardBlow')) { ring(p.x, p.y, 0, 10, 0.15, '184,53,44', false, 1.2); logEv({ k: 'shove', hit: false, cold: true }); } else { var did = gbRune === 'charge' ? crowdCharge(p) : gbRune === 'warCry' ? crowdWarCry(p) : gbRune === 'riposte' ? crowdRiposte(p) : crowdShove(p); if (did) runeSpend('guardBlow', gbRune); } } }   /* (the ring not yet full of blood: nothing, and a red flicker) */
  if (!shoving && (IN.pressed.lmb || IN.pressed.KeyJ || (p.mode === 'gather' && !hb && (IN.lmb || IN.keys.KeyJ))) && !bowOut && p.mode !== 'build' && !hb) p.atkBuf = S.juice ? 0.2 : 0.02;   // buffered during a hit pause, so the swing still comes
  if (IN.pressed.Space) p.dashBuf = 0.18;
  if (p.freezeT > 0) {
    p.freezeT -= dt; p.atkBuf = Math.max(0, p.atkBuf - dt); p.dashBuf = Math.max(0, p.dashBuf - dt);
    return;
  }
  p.animT += dt;
  p.invuln = Math.max(0, p.invuln - dt); p.flash = Math.max(0, p.flash - dt * 4); p.hurtT = Math.max(0, p.hurtT - dt); p.riposteT = Math.max(0, (p.riposteT || 0) - dt);
  for (i = 0; i < W.enemies.length; i++) if (W.enemies[i].chargeT > 0) W.enemies[i].chargeT -= dt;
  p.fireCd = Math.max(0, p.fireCd - dt); p.fireT = Math.max(0, p.fireT - dt); p.roll.cd = Math.max(0, p.roll.cd - dt); p.parryFx = Math.max(0, p.parryFx - dt);
  p.stDelay -= dt; if (p.stDelay <= 0) p.st = Math.min(maxSt(), p.st + 34 * dt * mod('stam')); if (p.st > maxSt()) p.st = maxSt();
  var ix = (IN.keys.KeyD ? 1 : 0) - (IN.keys.KeyA ? 1 : 0), iy = (IN.keys.KeyS ? 1 : 0) - (IN.keys.KeyW ? 1 : 0);
  if (api.scene && api.scene.still && api.scene.still()) { ix = 0; iy = 0; }   /* the page holds him still (aboard a ship the keys sail it: he stood running in place, Robin 2026-10-21) */
  var il = Math.hypot(ix, iy); if (il > 0) { ix /= il; iy /= il; }
  p.inAng = il > 0 ? Math.atan2(iy, ix) : null;
  p.moving = il > 0 && p.hurtT <= 0;

  p.atkBuf = Math.max(0, p.atkBuf - dt); p.dashBuf = Math.max(0, p.dashBuf - dt);
  var bow = p.mode === 'fight' && p.weapon === 'ranged';
  if ((IN.pressed.lmb || IN.pressed.KeyJ) && !bow && p.mode !== 'build' && !(p.mode === 'gather' && modZ('heavyblow') > 0)) p.atkBuf = S.juice ? 0.2 : 0.02;
  if (IN.pressed.Space) p.dashBuf = 0.18;
  // B enters and leaves build mode; Q swaps fight and gather (and leaves build mode for fight)
  if (IN.pressed.KeyB) { if (p.mode === 'build') p.mode = p.lastMode || 'fight'; else { p.lastMode = p.mode; p.mode = 'build'; } p.wreck = false; a.ph = 'none'; a.since = 9; a.tr = null; p.atkBuf = 0; p.holdT = 0; p.guard = false; W.lock = null; sfx('tele'); }
  if (IN.pressed.KeyQ) { if (p.mode === 'build') { p.mode = 'fight'; p.wreck = false; sfx('tele'); } else switchMode(); }
  bow = p.mode === 'fight' && p.weapon === 'ranged';
  if (IN.pressed.KeyF) {
    if (p.mode === 'fight' && !api.barSlots) { p.weapon = p.weapon === 'melee' ? 'ranged' : 'melee'; a.ph = 'none'; a.since = 9; p.atkBuf = 0; p.holdT = 0; bow = p.weapon === 'ranged'; sfx('tele'); }
    else if (p.mode === 'build') p.wreck = !p.wreck;      // F in build mode: the red crossed box that takes pieces down
  }
  for (i = 1; i <= 6; i++) if (IN.pressed['Digit' + i]) { if (api.barSelect && (p.mode === 'fight' || p.mode === 'gather')) { api.barSelect(i - 1); continue; } if (p.mode === 'gather' && i <= TOOLS.length) p.tool = i - 1; else if (p.mode === 'fight') p.sel = i - 1; if (api.beltUse && api.beltSlots && api.beltSlots[i - 1] && (p.mode !== 'gather' || i > TOOLS.length)) api.beltUse(i - 1); }   // a belt thing on a free slot is used in any mode
  if (IN.pressed.ControlLeft || IN.pressed.ControlRight) cycleLock();

  var held = (IN.lmb || IN.keys.KeyJ) && p.mode === 'fight' && !bow;
  p.holdT = held ? p.holdT + dt : 0;
  if (a.ph === 'charge' && (IN.rmb || IN.keys.KeyK)) { a.ph = 'none'; a.since = 9; }
  // guard
  var want = (IN.rmb || IN.keys.KeyK) && !bow && (p.mode === 'fight' || p.mode === 'gather');   /* (a tool can block too, badly: GUARD.tool, 2026-10-16; no guard with the bow: the right button draws it, BOW) */
  if (bow) { var drawing = (IN.rmb || IN.keys.KeyK) && p.roll.t <= 0 && p.hurtT <= 0 && a.ph === 'none'; p.bowDraw = drawing ? Math.min(bowFull(), (p.bowDraw || 0) + dt) : 0; if (p.guard) p.guard = false; } else p.bowDraw = 0;
  if (want && !p.guard && a.ph === 'recover' && a.t >= stepData(a).rec * 0.5) { a.ph = 'none'; a.t = 0; a.since = 0; }   // the guard from the second half of a recovery (2026-10-15: to parry the blow that answers yours)
  if (want && !p.guard && a.ph === 'none' && p.roll.t <= 0 && p.hurtT <= 0 && p.st > 0 && p.atkBuf <= 0) {
    p.guard = true; p.guardT = (W.t - p.lastRaise > 0.5) ? 0 : 99; p.lastRaise = W.t; sfx('raise');
  }
  if (!want && p.guard) p.guard = false;
  if (p.guard) p.guardT += dt;
  if (p.rally > 0) { p.rallyT = (p.rallyT || 0) + dt; if (p.rallyT > RALLY.hold) p.rally = Math.max(0, p.rally - (p.rally0 || p.rally) / RALLY.time * dt); if (p.rally > p.maxHp - p.hp) p.rally = Math.max(0, p.maxHp - p.hp); }

  // roll
  if (p.dashBuf > 0 && p.roll.cd <= 0 && p.roll.t <= 0 && p.hurtT <= 0 && p.st >= 18) {
    p.dashBuf = 0;
    p.st -= 18 * mod('dash') * stK(); p.stDelay = 0.5; p.guard = false; a.ph = 'none'; a.since = 0; p.atkBuf = 0; if (api.onDeed) api.onDeed('dash');
    var rx = il > 0 ? ix : -Math.cos(p.face), ry = il > 0 ? iy : -Math.sin(p.face);
    var dRune = rune('dash'), rl = dRune === 'roll' || modZ('roll') > 0 ? 1 : 0;                           // the dash slot (Runes2): the Roll is longer, longer untouchable, slower to rise
    if (dRune === 'blinkStep' && blinkStep(p, il > 0 ? ix : Math.cos(p.face), il > 0 ? iy : Math.sin(p.face))) { dust(p.x, p.y, 7); sfx('blink_step'); runeSpend('dash', dRune); p.roll.cd = runeN('blinkStep', 'cd') || 0.5; return; }   /* the Blink-step: through the man before you */
    if (dRune === 'ghostStep') { W.shade = { x: p.x, y: p.y, t: runeN('ghostStep', 'shadeT') || 1, max: runeN('ghostStep', 'shadeT') || 1, dir: heroDir(), ph: p.anim.phase, open: runeN('ghostStep', 'open') }; }   /* the Ghost-step: a shade left where you stood */
    p.leap = dRune === 'longLeap' ? (runeN('longLeap', 'over') || 1) : 0;
    if (p.leap) { p.leapCrouch = LEAP.crouch; p.leapDir = { x: rx, y: ry }; p.leapLen = (runeN('longLeap', 'len') || 2.2) / 2.2; p.roll.cd = runeN('dash', 'cd') || 0.3; p.charge = null; p.anim.sq = -0.5; p.anim.sqv = 0; runeSpend('dash', dRune); return; }   /* the leap: the crouch first, the flight when it ends (below) */
    p.roll.t = DASH_T * (rl ? (runeN('roll', 'len') || 1.7) : dRune === 'longLeap' ? (runeN('longLeap', 'len') || 2.2) : 1); p.roll.len = p.roll.t; p.roll.dx = rx; p.roll.dy = ry; p.roll.cd = rl ? (runeN('roll', 'cd') || 0.35) : (runeN('dash', 'cd') || 0.08); p.invuln = Math.max(p.invuln, rl ? (runeN('roll', 'invuln') || 0.42) : 0.16); p.ghostT = 0; p.anim.sq = -0.6; p.anim.sqv = 0; p.charge = null; if (dRune) runeSpend('dash', dRune);
    dust(p.x, p.y, 7); sfx('dash'); perfectCheck();
  }

  if (a.ph === 'none' && held && p.holdT > 0.25 && p.st >= 10 && !p.guard && p.roll.t <= 0 && p.hurtT <= 0 && p.atkBuf <= 0) { a.ph = 'charge'; a.t = 0; a.lvl = 0; }
  if (a.ph === 'charge') {
    if (!held) { if (a.t >= 0.3) releaseCharge(); else { a.ph = 'none'; a.since = 9; } }
    else {
      a.t = Math.min(1.0, a.t + dt);
      var lv = a.t >= 1.0 ? 3 : (a.t >= 0.66 ? 2 : (a.t >= 0.33 ? 1 : 0));
      if (lv > a.lvl) { a.lvl = lv; sfx('charge', lv); if (lv === 3) ring(p.x, p.y, 14, 24, 0.22, '255,214,90', true, 2.4); }
    }
  }
  // a skill cast from the fight bar
  if (api.trigger) {
    var sk = api.trigger; api.trigger = null;
    if (p.mode === 'fight' && a.ph === 'none' && p.roll.t <= 0 && p.hurtT <= 0 && p.st >= 20) {
      if (sk === 'whirlwind') { p.atkBuf = 0; startAttack(); a.combo = 3; a.chg = 1; a.spin = true; p.st -= 13; sfx('swing'); }
      else if (sk === 'bash') { p.atkBuf = 0; startAttack(); a.combo = 0; a.bash = true; p.st -= 13; }
      else if (sk === 'pin') { p.pinNext = true; p.st -= 6; sfx('tele'); }
    }
  }
  // attack
  if (p.atkBuf > 0 && p.roll.t <= 0 && p.hurtT <= 0 && (p.mode === 'gather' || p.st >= 7)) {
    var can = a.ph === 'none' || (S.juice && a.ph === 'recover' && a.t >= stepData(a).rec * 0.5);
    if (can) { if (p.mode === 'gather') { p.st = Math.max(0, p.st - 4); p.stDelay = Math.max(p.stDelay, 0.5); } startAttack(); if (p.mode === 'gather' && p.heavyG) { a.heavyG = true; p.heavyG = 0; } else a.heavyG = false; p.atkBuf = 0; }   // chopping and mining cost a little stamina (forgiving: never stops you)
  }
  if (a.ph === 'none') a.since += dt;
  else if (a.ph !== 'charge') {
    var sd = stepData(a);
    a.t += dt;
    if (a.ph === 'windup' && a.t >= sd.wu) { a.ph = 'active'; a.t = 0; if (p.mode !== 'fight') sfx('swing');   /* a fight's swing was heard from the windup's start (swingSound) */ if (S.juice && lookSpec().atkStyle >= 2) dust(p.x, p.y, 3); }
    else if (a.ph === 'active') {
      var u = Math.min(1, a.t / sd.ac);
      var arc = a.spin ? 6.283 : sd.arc, half = arc / 2, sign = (a.combo % 2 === 0) ? 1 : -1;
      var ang = a.dir - half * sign + arc * sign * u;
      a.tr = { start: a.dir - half * sign, cur: ang, age: 0, reach: 9 + sd.blade, sign: sign, hot: a.combo === 3 && a.chg > 0.6, motion: sd.motion || 'swing', u: u };
      if (sd.motion === 'smash' && S.juice && u > 0.85 && !a.smashed) { a.smashed = true; dust(p.x + Math.cos(a.dir) * 18, p.y + Math.sin(a.dir) * 18, 5); sfx('slam'); }
      if (p.mode === 'gather') {                      // tools hit trees, rocks and bushes, never enemies
        var hv = api.harvest, tl = TOOLS[p.tool], ti = itemOf('tool', p.tool), tpow = (ti ? Items.stats(ti).power : tl.dmg) * (api.powerMul ? api.powerMul(tl.good) : 1);
        var objs = hv && !(api.items && !ti) ? hv.list(p.x, p.y, 90) : [];   // no tool in the slot, nothing to swing
        for (i = 0; i < objs.length; i++) {
          var o = objs[i];
          if (a.hit.indexOf(o) >= 0) continue;
          var ox = o.x - p.x, oy = o.y - p.y, od = Math.hypot(ox, oy);
          if (od <= sd.reach + (o.r || 8) + 2 && Math.abs(wrap(Math.atan2(oy, ox) - a.dir)) <= half + 0.12) {
            a.hit.push(o);
            var right = o.kind === tl.good || (o.kind === 'trunk' && tl.good === 'tree'), pw = tpow * (right ? 1 : 0.5) * (heavyHit(a) ? 1.5 : 1) * (a.heavyG ? 3 : 1);
            if (a.heavyG && S.juice) { dust(o.x, o.y, 5); }
            var hr = hv.hit(o, pw, right, tl.id) || {}, shown = hr.dealt != null ? hr.dealt : pw;   // the page may answer { dealt, crit, clean }: a sweet spot is a crit, gold
            var sayWrong = !right && W.t - wrongToolAt > 300; if (sayWrong) wrongToolAt = W.t;
            num(o.x, o.y, (sayWrong ? 'wrong tool  ' : '') + Math.max(1, Math.round(shown)), hr.crit ? '#ffd34d' : (right ? '#ffffff' : '#d9d0c0'), heavyHit(a) || !!hr.crit || !!hr.clean, !right);
            sfx(o.kind === 'stone' ? 'clink' : 'chop', right ? 1 : 0);
          }
        }
        for (i = 0; i < W.enemies.length; i++) {              // and a tool bites a beast or a man a little (2026-10-13, Robin): TOOL_DMG of a blow of the sword's weight, a flinch and no more
          var te = W.enemies[i]; if (te.dead || te.side === 1 || te.down || a.hit.indexOf(te) >= 0) continue;
          var tx2 = te.x - p.x, ty2 = te.y - p.y, td = Math.hypot(tx2, ty2);
          if (td <= sd.reach + te.r + 2 && Math.abs(wrap(Math.atan2(ty2, tx2) - a.dir)) <= half + 0.12 && !wallBetween(p.x, p.y, te.x, te.y)) { a.hit.push(te); damageEnemy(te, (ti ? Items.stats(ti).dmg : 0.5) * (runeHas('quickHands') ? Math.max(TOOL_DMG, runeN('quickHands', 'toolDmg')) : TOOL_DMG) * dmgMul('sword'), Math.atan2(ty2, tx2), 40, 6, 'melee'); }   /* (the Quick hands III: a tool bites as a weapon) */
        }
      } else for (i = 0; i < W.enemies.length; i++) {
        var e = W.enemies[i];
        if (e.dead || e.side === 1 || e.down || a.hit.indexOf(e) >= 0) continue;
        var dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy), wk = bareHanded() ? null : meleeProfile().kind, rbn = swingReachBonus(wk), halfR = swingRune() === 'sweep' && wk === 'spear' ? Math.max(half, (runeN('sweep', 'arc') || 2.4) / 2) : half;
        if (e.type === 'soldier' && e.awake === false && runeHas('quietBlade')) rbn += 24 * (runeN('quietBlade', 'reach') || 1);   /* the Quiet blade: the blow from behind from a stride further */
        if (d <= sd.reach + rbn + e.r + 2 && (a.spin || Math.abs(wrap(Math.atan2(dy, dx) - a.dir)) <= halfR + 0.12) && !wallBetween(p.x, p.y, e.x, e.y)) {
          a.hit.push(e);
          if (a.feint) { if (e.type === 'soldier' && !e.dead) { e.guard = 0; e.guardAge = 0; e.guardCd = runeN('feint', 'openT') || 0.8; e.exposedT = Math.max(e.exposedT || 0, runeN('feint', 'openT') || 0.8); num(e.x, headY(e), 'FEINTED', '#ffe27a'); logEv({ k: 'feint', e: e }); if (runeN('feint', 'heavy')) p.feintHeavy = 1; } continue; }   /* the Feint lands no blow: it opens him */
          critBonus = ((!bareHanded() && meleeProfile().crit) || 0) + modZ('crit');   // the keen edge adds to the chance
          hitFlags.guardBreak = !!sd.guardBreak; hitFlags.wt = bareHanded() ? 0.5 : (sd.wt || 1); hitFlags.wkind = bareHanded() ? 'fist' : (P.mode === 'fight' ? meleeProfile().kind || null : 'tool');
          var swr = swingRune(), sdmg = sd.dmg * dmgMul('sword') * (a.riposte ? (a.ripRune ? (runeN('riposte', 'dmg') || 1) : 1.5) : 1), skb = sd.kb, sstag = sd.stag, skind = heavyHit(a) ? 'heavy' : 'melee';
          if (a.ripRune) { hitFlags.guardBreak = true; if (runeN('riposte', 'stag')) sstag = Math.max(sstag, 42); }   /* the Riposte: cannot be blocked */
          if (swr === 'overhead' && a.chg > 0.6) { hitFlags.guardBreak = true; sstag = Math.max(sstag, 42); sdmg *= runeN('overhead', 'dmg') || 1; if (runeN('overhead', 'down')) sstag = Math.max(sstag, 60); }   /* the Overhead: a held swing breaks a guard and staggers, double at II, down at III */
          if (swr === 'sweep' && wk === 'spear') { sstag = Math.max(sstag, 40); if (runeN('sweep', 'trip')) sstag = Math.max(sstag, 60); }   /* the Sweep: every man in its arc staggers, trips at II */
          if (swr === 'lunge' && runeN('lunge', 'kb')) skb += runeN('lunge', 'kb');
          if (swr === 'whirl' && runeN('whirl', 'noParry')) skind = 'heavy';
          if (runeHas('spearWall') && wk === 'spear' && runeN('spearWall', 'pierce') && W.t - (p.backAt || -99) < 1.2) hitFlags.guardBreak = true;   /* the Spear-wall II: a step back then a thrust is a pierce */
          if (sstag >= 60 && e.type === 'soldier') { damageEnemy(e, sdmg, Math.atan2(dy, dx), skb, 40, skind); if (!e.dead && !e.down) knockDown(e, Math.atan2(dy, dx), 0.7); }
          else damageEnemy(e, sdmg, Math.atan2(dy, dx), skb, sstag, skind);
          critBonus = 0; hitFlags.guardBreak = false; hitFlags.wt = 1; hitFlags.wkind = null;
          if (runeHas('spearWall') && wk === 'spear' && e.type === 'soldier') { var tb = null, tbd = 1e9; for (var sj = 0; sj < W.enemies.length; sj++) { var se = W.enemies[sj]; if (se === e || se.dead || se.side === 1 || se.down || a.hit.indexOf(se) >= 0) continue; var sdx = se.x - p.x, sdy = se.y - p.y, sdd = Math.hypot(sdx, sdy); if (sdd < d || sdd > sd.reach * 1.7 + rbn + se.r || Math.abs(wrap(Math.atan2(sdy, sdx) - a.dir)) > 0.28) continue; if (sdd < tbd) { tbd = sdd; tb = se; } } if (tb) { a.hit.push(tb); hitFlags.wkind = 'spear'; damageEnemy(tb, sdmg * 0.8, Math.atan2(tb.y - p.y, tb.x - p.x), skb, sstag, skind); hitFlags.wkind = null; } }   /* the Spear-wall: the thrust runs through to the man behind */
          if (!sd.pierce && sd.motion === 'thrust') break;      // a thrust (not a spear) stops in the first thing it meets
        }
      }
      if (p.mode !== 'gather' && api.struck) {                  // people the page keeps who are no fighters (a village's own): the same blow lands on them. api.struck = { list(at) -> [{ x, y, r }], hit(o, dmg, ang, kind) }
        var OT = api.struck.list(p), oi2;
        for (oi2 = 0; oi2 < OT.length; oi2++) { var o2 = OT[oi2]; if (a.hit.indexOf(o2) >= 0) continue; var ox2 = o2.x - p.x, oy2 = o2.y - p.y, od2 = Math.hypot(ox2, oy2);
          if (od2 <= sd.reach + (o2.r || 6) + 2 && (a.spin || Math.abs(wrap(Math.atan2(oy2, ox2) - a.dir)) <= half + 0.12) && !wallBetween(p.x, p.y, o2.x, o2.y)) { a.hit.push(o2); api.struck.hit(o2, sd.dmg * dmgMul('sword') * (a.riposte ? 1.5 : 1), Math.atan2(oy2, ox2), heavyHit(a) ? 'heavy' : 'melee'); if (!sd.pierce && sd.motion === 'thrust') break; } }
      }
      if (a.t >= sd.ac) { a.ph = 'recover'; a.t = 0; if (a.whirl > 1 && !a.whirled) { a.whirled = true; a.ph = 'active'; a.hit = []; a.t = 0; } else a.whirl = 0; }   /* the Whirl at tier II: twice round */
    } else if (a.ph === 'recover' && a.t >= sd.rec * (a.recK || 1)) { a.ph = 'none'; a.t = 0; a.since = 0; }
  }
  if (a.tr) { if (a.ph === 'recover' || a.ph === 'none') a.tr.age += dt; if (a.tr.age > 0.18) a.tr = null; }

  // ranged
  var rg = bow ? rangedOf() : null;
  if (bow && (IN.pressed.lmb || IN.pressed.KeyJ) && p.bowDraw > 0 && p.fireCd <= 0 && p.st >= rg.R.st && p.roll.t <= 0 && p.hurtT <= 0 && a.ph === 'none' && (!api.canShoot || api.canShoot())) {   /* (the shot is the release: the draw must be on, the left button lets it go; a thrown thing the same) */
    var RR = rg.R, thrownIt = RR.thrown ? rg.it : null, bk = Math.min(1, p.bowDraw / bowFull()), bdm = bowSnap() + (1 - bowSnap()) * bk, bsp = BOW.speedMin + (1 - BOW.speedMin) * bk; p.bowDraw = 0; p.lastDraw = bk;
    var shotRune = bk >= 0.999 && rune('shot') && runeReady('shot') ? rune('shot') : null, stillK = runeHas('stillHand') && (p.stillT || 0) >= runeN('stillHand', 'stillT') ? runeN('stillHand', 'dmg') : 1, noShield = stillK > 1 && runeN('stillHand', 'noShield') ? 1 : 0; p.stillT = 0;   /* the shot slot's rune at a full draw with the ring full; the Still hand's heavy arrow */
    p.fireCd = RR.cd; p.fireT = 0.2; p.st -= RR.st; p.stDelay = 0.4;
    var fa = rangedAngle();
    p.face = fa; p.fireAng = fa; if (!S.juice) p.faceVis = fa;
    var nArr = shotRune === 'twinShot' ? (runeN('twinShot', 'arrows') || 2) : 1, eachK = shotRune === 'twinShot' ? (runeN('twinShot', 'each') || 0.7) : 1, lifeK = runeHas('hawkEye') ? (runeN('hawkEye', 'range') || 1) : 1, firing = shotRune === 'fireArrow' && (!runeN('fireArrow', 'torch') || (api.torchLit && api.torchLit())), pinning = shotRune === 'pinningShot'; if (shotRune && (nArr > 1 || firing || pinning)) runeSpend('shot', shotRune);
    for (var ai = 0; ai < nArr; ai++) { var fa2 = fa + (nArr > 1 ? (ai - (nArr - 1) / 2) * 0.12 : 0);
    W.projs.push({ x: p.x + Math.cos(fa2) * 8, y: p.y + Math.sin(fa2) * 8, vx: Math.cos(fa2) * RR.speed * bsp, vy: Math.sin(fa2) * RR.speed * bsp, r: RR.r, dmg: dmgMul('bow') * bdm * eachK * stillK * (api.mods && api.mods().arrow ? api.mods().arrow : 1), owner: 'player', life: RR.life * lifeK, ang: fa2, pin: !!p.pinNext || pinning, pinT: pinning ? runeN('pinningShot', 'pinT') : 0, pinNoGuard: pinning && runeN('pinningShot', 'noGuard'), fire: firing, noShield: noShield, still: stillK, kind: RR.proj, stag: RR.stag, kb: RR.kb || 40, thing: thrownIt, spin: 0 }); p.pinNext = false; }
    if (api.onShoot) api.onShoot(thrownIt);                     // the page takes an arrow, a stone, or the thrown thing itself from the hand
    spark(p.x + Math.cos(fa) * 10, p.y + Math.sin(fa) * 10, 3, '#ffe9a0', 60);
    if (S.juice) { p.kx -= Math.cos(fa) * 30; p.ky -= Math.sin(fa) * 30; }
    sfx(shotRune === 'twinShot' ? 'twin_shot' : (shotRune === 'fireArrow' && firing) ? 'fire_arrow' : (shotRune === 'pinningShot' && (p.pinNext || pinning)) ? 'pin_shot' : 'shoot');   /* a rune's shot has its own sound (Derek, SD's, 2026-10-24) */
  }

  // facing
  var target = p.face, gT = null;
  if (bow && p.bowDraw > 0) target = rangedAngle();   /* (the bow drawn: he faces where he aims) */
  else if (a.ph !== 'none' && a.ph !== 'charge' && !(a.ph === 'recover' && il > 0)) target = a.dir;
  else if (lockValid()) target = Math.atan2(W.lock.y - p.y, W.lock.x - p.x);
  else if (p.guard && S.guardFace && (gT = guardThreat())) target = Math.atan2(gT.y - p.y, gT.x - p.x);   /* the shield up: he turns to the threat and keeps it, walking or backing off (GUARD_FACE) */
  else if (il > 0) target = Math.atan2(iy, ix);
  p.face = turnToward(p.face, target, gT ? dt * GUARD_FACE.turn : (S.juice && !(runeHas('windFoot') && runeN('windFoot', 'turn')) ? dt * 30 : 99));   /* the Wind-foot III: you turn on the spot */
  p.faceVis = turnToward(p.faceVis, p.face, S.juice ? dt * 42 : 99);

  // movement
  var sprint = (IN.keys.ShiftLeft || IN.keys.ShiftRight) && il > 0 && a.ph === 'none' && !p.guard && p.roll.t <= 0 && p.hurtT <= 0 && !p.sprintLock && p.st > 0;
  if (p.st <= 0.5) p.sprintLock = true; else if (p.st >= 14) p.sprintLock = false;
  p.sprinting = !!sprint;
  p.anim.run = Math.max(0, Math.min(1, (p.anim.run || 0) + (sprint ? dt / 0.7 : -dt / 0.35)));   // the lean into a run builds up over 0.7 s (Robin, 2026-10-07)
  var spd = HERO_GAIT.walk * mod('speed');   // mods().speed for a page's runes and cheats
  p.stillT = il > 0 || a.ph !== 'none' || p.roll.t > 0 ? 0 : (p.stillT || 0) + dt; if (il > 0 && Math.cos(Math.atan2(iy, ix) - p.face) < -0.5) p.backAt = W.t;   /* (the Still hand's stillness; a step back for the Spear-wall's pierce) */
  if (sprint) { spd *= (HERO_GAIT.sprint / HERO_GAIT.walk) * mod('sprint'); p.st = Math.max(0, p.st - HERO_GAIT.sprintSt * dt * mod('sprintCost') * stK()); p.stDelay = Math.max(p.stDelay, 0.55); }
  if (sprint && il > 0 && modZ('charge') > 0 && p.mode === 'fight') for (i = 0; i < W.enemies.length; i++) {   // the boar's charge: your run is a blow
    var ce = W.enemies[i]; if (ce.dead || ce.side === 1 || ce.down || (ce.chargeT || 0) > 0) continue;
    if (Math.hypot(ce.x - p.x, ce.y - p.y) < ce.r + p.r + 6) { ce.chargeT = 1.2; var cang = Math.atan2(ce.y - p.y, ce.x - p.x); damageEnemy(ce, 1.2 * dmgMul('sword'), cang, 260, 40, 'heavy'); ring(ce.x, ce.y, 0, 14, 0.25, '255,243,196', false, 2); sfx('slam'); }
  }
  if (p.guard) spd *= sprint ? 0.55 : (runeHas('sureFoot') && runeN('sureFoot', 'guardWalk') ? 1 : HERO_GAIT.guard / HERO_GAIT.walk);   /* the Sure-foot II: the guard walk at a walk's pace */   // the guard walk at its own pace (46.2, the clip's), whatever the walk; with a sprint as before
  /* (2026-10-15, Robin: attacking on and moving at once, the legs did not move and he glided: the sheets' slash is the whole body, so a
     walk under it cannot be shown. Now the blow is a commitment: a shuffle in the windup, no walking in the blow itself (its step is
     the lunge), little in the first half of the recovery, and moving in the second half ends the recovery (the walk shows at once);
     that is where a next blow of the chain could begin anyway, so the pace is the same. It was 0.55 of a walk through the windup
     and the blow and 0.9 through the recovery.) */
  if (a.ph === 'recover' && il > 0 && a.t >= stepData(a).rec * 0.5) { a.ph = 'none'; a.t = 0; a.since = 0; }
  if (a.ph === 'windup') spd *= 0.1; else if (a.ph === 'active') spd *= 0; else if (a.ph === 'recover') spd *= 0.2; else if (a.ph === 'charge') spd *= 0.6;
  if (p.leapCrouch > 0) { p.leapCrouch -= dt; spd = 0; if (p.leapCrouch <= 0) { p.roll.t = LEAP.t * (p.leapLen || 1); p.roll.len = p.roll.t; p.roll.dx = p.leapDir.x; p.roll.dy = p.leapDir.y; p.invuln = Math.max(p.invuln, 0.2); p.ghostT = 0; dust(p.x, p.y, 6); sfx('dash'); } }   /* the leap's crouch, then the push-off */
  if (p.leapLand > 0) { p.leapLand -= dt; spd *= 0.15; }   /* the landing taken in the knees */
  var tvx = ix * spd, tvy = iy * spd;
  if (p.roll.t > 0) {
    p.roll.t -= dt; rushHits(p);
    if (p.roll.t <= 0) { p.anim.sq = 0.9; p.anim.sqv = 0; p.charge = null; if (p.leap) { dust(p.x, p.y, 8); sfx('leap_land', 0, p); if (runeN('longLeap', 'heavy')) p.feintHeavy = 1; p.leap = 0; p.leapLand = LEAP.land; } }   /* the leap's landing (Derek, SD's leap_land there, not at the push-off): the first blow heavy at tier III */
    var rs = p.leap ? LEAP.v : (p.roll.len > DASH_T * 1.2 ? 330 : 460) * (0.25 + 0.75 * Math.max(0, p.roll.t) / (p.roll.len || DASH_T));   /* (the leap flies at one speed) */
    p.ghostT -= dt; if (p.ghostT <= 0 && S.juice) { p.ghostT = 0.035; W.ghosts.push({ x: p.x, y: p.y, dir: heroDir(), t: p.animT, ph: p.anim.phase, life: 0.22, max: 0.22 }); }
    p.vx = p.roll.dx * rs; p.vy = p.roll.dy * rs;
  } else if (p.hurtT > 0) { p.vx *= Math.exp(-dt * 8); p.vy *= Math.exp(-dt * 8); }
  else if (S.juice) { var k = Math.min(1, dt * 15); p.vx += (tvx - p.vx) * k; p.vy += (tvy - p.vy) * k; }
  else { p.vx = tvx; p.vy = tvy; }
  var lvx = 0, lvy = 0;
  if (a.ph === 'active' && P.mode !== 'gather') { var sd2 = stepData(a), gA = gapAhead(a.dir), lf = clamp((gA - 3) / 14, 0, 1) * (gA < sd2.reach + 60 ? 1 : 0.15); var lgK = swingRune() === 'lunge' ? 1 + 0.6 * (runeN('lunge', 'stride') || 1) : 1; lvx = Math.cos(a.dir) * sd2.lunge * lf * lgK; lvy = Math.sin(a.dir) * sd2.lunge * lf * lgK; }   /* (the step into a blow is taken toward a foe in front, within the reach and 60 units; at nothing, a small step: 2026-10-15, with Robin's long lunge a blow at the air slid him 35 units, which read as gliding) */
  p.kx *= Math.exp(-dt * 10); p.ky *= Math.exp(-dt * 10);
  if (p.leap && p.roll.t > 0) { var lnx = p.x + (p.vx + p.kx) * dt, lny = p.y + (p.vy + p.ky) * dt, lrs = Math.hypot(p.vx, p.vy), lex = p.x + p.roll.dx * lrs * p.roll.t * 0.7, ley = p.y + p.roll.dy * lrs * p.roll.t * 0.7, canW = !api.scene || !api.scene.walk, okNow = canW || api.scene.walk(lnx, lny, p), okEnd = canW || api.scene.walk(lex, ley, p), wallNow = wallBetween(p.x, p.y, lnx, lny) || wallPillarCross(p.x, p.y, lnx, lny, p.r); if ((okNow || okEnd) && !wallNow) { p.x = lnx; p.y = lny; } else { p.roll.t = 0; p.vx = p.vy = 0; } }   /* (no leap through a shut edge, a house wall or a palisade: the walls' pillars still stop him; over every other thing) */   /* the Long leap: over what stands in the way, a stream or a fence, as long as he can land beyond it; else it stops at the edge */
  else moveCircle(p, (p.vx + lvx + p.kx) * dt, (p.vy + lvy + p.ky) * dt);
  shadeTick(dt);
  updateAnim(dt, p.roll.t > 0);
  if (S.juice && p.moving && p.roll.t <= 0) { W.dustT -= dt; if (W.dustT <= 0) { W.dustT = p.sprinting ? 0.07 : 0.14; dust(p.x, p.y, p.sprinting ? 2 : 1); } }
}

/* ---------- enemies ---------- */
// A creature from the Creature Editor can carry its own numbers in e.cfg; plain bots use these.
var BOT_CFG = { speed: 58, windup: 0.55, lunge: 175 };
// A page gives each animal its own attack in e.cfg.atk (all optional; the plain lunge without it):
//   kind: 'lunge' (a short jump at the hero), 'charge' (a long run straight ahead that goes past you; the boar),
//         'arc' (a swipe or gore in front, no run; the bear and the moose)
//   windup, dur, speed (run speed for lunge and charge), reach and arc (for 'arc', in radians), hitAt (when in dur
//   the arc lands), recover, cd, heavy (a heavy blow: bigger knockback, blocks cost more), ring (the distance it
//   keeps while circling; the wolf), turn (how fast it can turn while chasing, radians a second; the boar and moose
//   are slow), pack (only one of the pack bites at a time), venom (seconds of a lingering bite; the adder).
var packT = 0;
function beastAI(e, dt, d, ang) {
  if (e.ko > 0) { e.ko -= dt; e.vx = 0; e.vy = 0; if (e.carried) e.ko = Math.max(e.ko, 1); if (e.ko <= 0) { e.state = 'flee'; e.t = 0; e.cd = 0.5; } return; }   /* out cold (the cudgel): lies until it wakes, then runs */
  var cf = e.cfg || BOT_CFG, sk = cf.speed / 58, A = cf.atk || {}, kind = A.kind || 'lunge';
  var near = kind === 'arc' ? e.r + (A.reach || 20) * 0.8 : (A.near || 56), ring = A.ring || Math.min(52, near);
  e.cd -= dt;
  switch (e.state) {
    case 'idle': if ((d < 130 * (e.shy && runeHas('hunterStride') && (!P.sprinting || runeN('hunterStride', 'run')) ? runeN('hunterStride', 'nearK') || 0.5 : 1) || e.heard > 0) && !P.dead) { e.state = 'chase'; e.t = 0; } break;   /* the Hunter's stride: a shy beast notices you from half as near */
    case 'chase':
      e.face = A.turn ? turnToward(e.face, ang, A.turn * dt) : ang;
      var fa = e.face, aligned = Math.abs(wrap(ang - e.face)) < 0.5;
      if (d > ring) moveCircle(e, Math.cos(fa) * cf.speed * dt, Math.sin(fa) * cf.speed * dt);
      else if (d < ring * 0.6) moveCircle(e, -Math.cos(ang) * 45 * sk * dt, -Math.sin(ang) * 45 * sk * dt);
      else { var sd = e.seed > 5 ? 1 : -1; moveCircle(e, Math.cos(ang + sd * 1.57) * (A.ring ? 60 : 30) * sk * dt, Math.sin(ang + sd * 1.57) * (A.ring ? 60 : 30) * sk * dt); }
      var canGo = e.cd <= 0 && !P.dead && aligned && (!A.pack || packT <= 0);
      if (canGo && (d < near || (kind === 'charge' && d < (A.from || 150)) || (A.ring && d < ring + 14))) {
        e.state = 'windup'; e.t = 0; e.dur = A.windup || cf.windup; e.dirLock = ang; e.hitDone = false; sfx('tele', 0, e); tell(e);
        if (A.pack) packT = (A.windup || cf.windup) + (A.dur || 0.22) + 1.0;   // the next of the pack waits its turn
      }
      break;
    case 'windup':
      e.face = kind === 'arc' ? turnToward(e.face, ang, 1.5 * dt) : e.dirLock;   // a swipe follows you a little; a charge is committed
      if (e.t >= e.dur) { e.state = 'lunge'; e.t = 0; e.dur = A.dur || 0.22; e.hitDone = false; if (kind === 'arc') e.dirLock = e.face; }
      break;
    case 'lunge':
      if (kind === 'arc') {
        if (A.step) moveCircle(e, Math.cos(e.dirLock) * A.step * dt, Math.sin(e.dirLock) * A.step * dt);
        if (!e.hitDone && e.t >= e.dur * (A.hitAt || 0.4)) {
          e.hitDone = true;
          var dd = Math.hypot(P.x - e.x, P.y - e.y), da = Math.abs(wrap(Math.atan2(P.y - e.y, P.x - e.x) - e.dirLock));
          if (dd < e.r + (A.reach || 20) + P.r && da < (A.arc || 1.6) / 2) { var r2 = hurtPlayer(cf.dmg || 12, e.x, e.y, A.heavy ? 'heavy' : 'melee', e); if (r2 === 'parry') parried(e); }
          else dust(e.x + Math.cos(e.dirLock) * e.r, e.y + Math.sin(e.dirLock) * e.r, 3);
        }
      } else {
        var sp = A.speed || cf.lunge, ox = e.x, oy = e.y;
        moveCircle(e, Math.cos(e.dirLock) * sp * dt, Math.sin(e.dirLock) * sp * dt);
        if (kind === 'charge' && Math.hypot(e.x - ox, e.y - oy) < sp * dt * 0.3) { e.t = e.dur; }   // ran into something: the charge ends
        if (!e.hitDone && Math.hypot(P.x - e.x, P.y - e.y) < e.r + P.r + 3) {
          e.hitDone = true;
          var r = hurtPlayer(cf.dmg || 12, e.x, e.y, A.heavy ? 'heavy' : 'melee', e);
          if (r === 'parry') parried(e);
          else if (r === 'hit' && A.venom) P.venom = { t: A.venom, dmg: A.venomDmg || 2 };
          if (kind === 'charge' && r !== 'parry') { P.kx += Math.cos(e.dirLock) * 80; P.ky += Math.sin(e.dirLock) * 80; }   // bowled along
        }
      }
      if (e.state === 'lunge' && e.t >= e.dur) { e.state = 'recover'; e.t = 0; e.dur = A.recover || 0.8; }
      break;
    case 'recover': if (e.t >= e.dur) { e.state = 'chase'; e.t = 0; e.cd = A.cd || 1.1; } break;
    case 'stagger': if (e.t >= e.dur) { e.state = 'chase'; e.t = 0; e.cd = Math.min(e.cd, 0.6); } break;   // a flinch does not reset the wait before its next attack
    case 'stunned': if (e.t >= e.dur) { e.finish = false; e.state = 'chase'; e.t = 0; e.cd = 0.1; } break;   // a parry's stun (beasts that are not brutes); it comes again at once (the parry chain; it waited 0.5 s)
  }
}
function shooterAI(e, dt, d, ang) {
  e.cd -= dt;
  switch (e.state) {
    case 'idle':
      e.aim = turnToward(e.aim, ang, dt * 2.2);
      if (e.cd <= 0 && d < 320 && !P.dead) { e.state = 'windup'; e.t = 0; e.dur = 0.8; e.dirLock = e.aim; sfx('tele', 0, e); tell(e); }
      break;
    case 'windup':
      e.aim = e.dirLock;
      if (e.t >= e.dur) {
        W.projs.push({ x: e.x + Math.cos(e.aim) * 10, y: e.y + Math.sin(e.aim) * 10, vx: Math.cos(e.aim) * 105, vy: Math.sin(e.aim) * 105, r: 4, dmg: 10, owner: 'enemy', life: 4, ang: e.aim });
        spark(e.x + Math.cos(e.aim) * 12, e.y + Math.sin(e.aim) * 12, 5, '#ffffff', 50);
        sfx('shoot'); e.state = 'recover'; e.t = 0; e.dur = 0.55; e.cd = 2.2;
      }
      break;
    case 'recover': if (e.t >= e.dur) { e.state = 'idle'; e.t = 0; } break;
    case 'stagger': if (e.t >= e.dur) { e.state = 'idle'; e.t = 0; e.cd = 1.2; } break;
  }
}
function stunBig(e) { e.state = 'stunned'; e.t = 0; e.dur = 2.2; e.stagMeter = 100; num(e.x, e.y - e.r * 2 - 14, 'STAGGERED!', '#ffd34d'); sfx('stagger'); }
function bruteAI(e, dt, d, ang) {
  e.cd -= dt; e.sinceHit += dt;
  if (e.state !== 'stunned' && e.sinceHit > 1.5) e.stagMeter = Math.max(0, e.stagMeter - 8 * dt);
  switch (e.state) {
    case 'idle': if (d < 220 && !P.dead) { e.state = 'chase'; e.t = 0; } break;
    case 'chase':
      e.face = turnToward(e.face, ang, dt * 3);
      if (d > 72) moveCircle(e, Math.cos(ang) * 54 * dt, Math.sin(ang) * 54 * dt);
      else if (d < 40) moveCircle(e, -Math.cos(ang) * 38 * dt, -Math.sin(ang) * 38 * dt);
      else { var sdr = e.seed > 5 ? 1 : -1; moveCircle(e, Math.cos(ang + sdr * 1.57) * 26 * dt, Math.sin(ang + sdr * 1.57) * 26 * dt); }
      if (e.cd <= 0 && d < 96 && !P.dead) {
        var r = Math.random();
        e.attack = r < 0.4 ? 'lunge' : (r < 0.75 ? 'chain' : 'spin'); e.chain = e.attack === 'chain' ? 3 : 1;
        e.state = 'windup'; e.t = 0; e.dur = e.attack === 'lunge' ? 0.7 : (e.attack === 'chain' ? 0.45 : 0.65); e.dirLock = ang; e.hitDone = false; sfx('tele', 0, e); tell(e);
      }
      break;
    case 'windup':
      e.face = e.dirLock;
      if (e.t >= e.dur) {
        e.t = 0; e.hitDone = false;
        if (e.attack === 'spin') { e.state = 'active'; e.dur = 0.22; ring(e.x, e.y, 0, 50, 0.3, '255,226,160', false, 3); sfx('slam'); dust(e.x, e.y, 8); }
        else { e.state = 'lunge'; e.dur = e.attack === 'chain' ? 0.2 : 0.3; }
      }
      break;
    case 'lunge':
      var sp = e.attack === 'chain' ? 190 : 215;
      moveCircle(e, Math.cos(e.dirLock) * sp * dt, Math.sin(e.dirLock) * sp * dt);
      if (!e.hitDone && Math.hypot(P.x - e.x, P.y - e.y) < e.r + P.r + 3) {
        e.hitDone = true;
        var rs = hurtPlayer(e.attack === 'chain' ? 12 : 18, e.x, e.y, 'melee', e);
        if (rs === 'parry') { e.stagMeter += 40; if (e.stagMeter >= 100 || (P.chain || 0) >= CHAIN.max) stunBig(e); else daze(e, 1.2); }   // (a chain at its top fells a brute: 2026-10-15)
      }
      if (e.state === 'lunge' && e.t >= e.dur) {
        e.chain--;
        if (e.chain > 0) { e.dirLock = ang; e.state = 'windup'; e.t = 0; e.dur = 0.36; e.hitDone = false; sfx('tele', 0, e); tell(e); }
        else { e.state = 'recover'; e.t = 0; e.dur = 1.0; }
      }
      break;
    case 'active':
      if (!e.hitDone && Math.hypot(P.x - e.x, P.y - e.y) <= 46 + P.r) { e.hitDone = true; hurtPlayer(14, e.x, e.y, 'heavy', e); }
      if (e.state === 'active' && e.t >= e.dur) { e.state = 'recover'; e.t = 0; e.dur = 1.1; }
      break;
    case 'recover': if (e.t >= e.dur) { e.state = 'chase'; e.t = 0; e.cd = 0.9; } break;
    case 'stunned': if (e.t >= e.dur) { e.state = 'chase'; e.t = 0; e.cd = 0.9; e.stagMeter = 0; } break;
  }
}
/* ---------- men: sides, and the soldier (2026-10-12, docs/battle-plan.md; Robin: fight a hirdman, two, two with one beside
   you, five against five, a town, the raid) ----------
   SIDES. Every fighter has a side: 0 is against the hero (every beast, a town's men), 1 is with him (his own men). The
   hero's blows pass through his friends; a soldier's blow lands on whoever of the other side stands in it (strike).
   Beasts are as they were: they know only the hero.
   THE SOLDIER is the fourth kind of enemy, a man with a weapon and perhaps a shield. He closes to his weapon's reach and
   keeps it, circles, shows his blow coming (a windup much longer than the hero's own), strikes by his weapon's numbers
   (PROFILES: the arc, the reach, the one thing each kind has), raises his shield against a blow he sees coming if he is
   quick enough (his wits), answers a blow he has stopped, steps back when hurt, and when badly hurt yields or runs unless
   he is loyal. More than one on a target take places round it and strike in turn (slots). A friend (side 1) follows the
   hero, takes what the hero strikes, keeps to a leash, goes down instead of dying and gets up when the fight is over.
   Everything he is comes from a few numbers on him (armMan) and from MEN. */
var MEN = {
  speed: 60, run: 94, back: 50, strafe: 24, turn: 8,
  wu: 0.12, wuK: 2.0,                 // a blow's windup: wu + the weapon's own times wuK (retuned 2026-10-13 when the hero's blows slowed, to the same seconds as before: a sword 0.44, a Dane axe 0.92)
  ac: 0.07, acK: 1.4, rec: 0.3, recK: 2.0, hitAt: 0.45,
  hp: 30, hpK: 0.8,                   // a man's health unless the page says (hp), and a scale on the whole of the men's world (hpK: every man's health, their blows on each other, a bowman's arrow on a man, what a roof does to him), so that only the hero's blows gain on them: the lever of rung 3 (2026-10-13)
  dmg: 18,                            // a blow at strength 1 from a weapon whose kind says 1 (the hero's scale: he has 100). 18 since 2026-10-20 (was 12): the men retuned to the hero's blows on the press, by the ladder (tools/sweepmen.js): the tapping bot now wins half against one axe-man in leather (was all), the careful bot three in four against two (was nine in ten), five against five a coin; mine, for Robin to feel
  toMen: 0.15,                        // the same blow landing on a man (their health is on the beasts' scale)
  wdmg: { sword: 1, axe: 1, club: 0.9, cudgel: 0.5, seax: 0.7, spear: 1.1, greataxe: 1.6 },
  cd: [1.0, 0.45],                    // the wait between his attacks: dull to sharp
  react: [0.36, 0.07],                // how long after a blow begins he has his shield up: dull to sharp
  guard: 0.75, guardMax: 1.7, guardCd: [1.5, 0.7],
  blockLight: 0.3, blockHeavy: 0.55, blockBroken: 0.45, front: 1.7, frontLine: 2.7,
  slots: 2, gapT: 0.35, gapHero: 0.75, // how many may be striking one target at once, and the least time between two blows LANDING on it (on the hero: as long as he is untouchable after a blow, so no two land together and none is wasted)
  backAt: 0.6, yieldAt: 0.25, dropAt: 0.45, wallK: 0.5,   // wallK: in a held line a shield lets through this much of what it would alone, and only a heavy blow breaks it (the shield wall, raid step 5, mine)   // dropAt: a carrier told to hold on drops what he carries only under this share of his health (raid step 3, mine)
  // Man to man (2026-10-13, Robin: "everything just gathers up like ants around a target... more like lots of individual
  // battles where things can go either way"). onOne: how many of a side may be AT one man at first (0: the old way, everybody
  // on the nearest); onHero: at the hero; joinAfter: a man who has been fought this long without an end gets one more on him
  // (a town's men; joinYours: the hero's own men, who help a fellow sooner); onMax: never more than this on a man.
  // hang: a man with no place hangs back this far from the nearest fight (nearest and farthest, by the man) and waits for
  // one; apart, drift: the middle of a fight keeps this far from the men of other fights, moving at this pace to get there; homeR: a
  // householder (o.homeR on the man) fights nobody further than this from his own door.
  onOne: 1, onHero: 2, onMax: 2, joinAfter: 6, joinYours: 3, odds: 0, way: 'duel', hang: [105, 165], apart: 72, drift: 26, homeR: 190,
  flankAfter: 3, flankFor: 25, flankRetry: 8,   // a man hanging back from a fight with a doorway between (the men behind a full gate): after flankAfter seconds he asks the grid for a way round (api.wayRound: the other gate), goes that way for up to flankFor seconds, and tries again flankRetry seconds after a way was not found (raid step 5, the second half, 2026-10-21)
  turnT: 2.5, turnK: 120,            // a man struck by a man who is not his foe turns on him for turnT seconds (turnK: how strongly, against distance in units): the relief of a beset man (2026-10-14)
  parryStun: 1.0,                    // a parried man or beast stands stunned this long (2026-10-14, Robin: a parry should stun for about a second)   // (the first five and hang are a WAY: see WAYS)
  sight: 340, aggro: 150, leash: 250, lie: 90,
  noise: { blow: 240, shout: 420, cry: 360, din: 0.24, far: 1000 }, wake: [0.5, 1.6],   // how far a blow, a man's shout and a death cry are heard by a town's men, and how long a man at his post takes to be on his way
  // A man with a bow (2026-10-13, rung 5): he stands off and shoots at whoever he has a clear line to, never with one of his own
  // in it, never through a wall; with someone on him he drops the bow for his seax. range: how far he shoots; near: a foe
  // this close and it is the seax; keep: he keeps this far from a fight that is not about him; draw: seconds to draw and aim (by his aim, worst to best); cd: between arrows; speed and life
  // of the arrow; dmg to the hero (before armour) and the share of it a man takes (toMen); err: how far off he may be, radians;
  // lead: how much of a moving man's way he allows for; lane: how wide a line must be free of his own
  bow: { range: 300, keep: 125, near: 60, draw: [1.3, 0.75], cd: [2.6, 1.3], speed: 270, life: 1.25, dmg: 9, toMen: 0.5, err: [0.13, 0.03], lead: [0.2, 0.8], lane: 12 },
  wallGap: 4,                               // how far short of a wall anybody but the hero stops when he walks into it (see moveCircle), so that he does not stand in it; 0 and 4 came out alike over 246 scripted attacks on towns (2026-10-13)
  pursueOut: 450,                           // ...or, when his post knows his town's bounds (post.box: x0, y0, x1, y1), nobody further than this outside them: a town is wider than 700 units since its houses grew (2026-10-13), and the hall's men stood idle beside a fight at their own gate
  pursue: 700,                              // a town's man goes for nobody further than this from his own post: they do not leave their town to run a raider down across the country (my choice, 2026-10-13: without it nothing could be carried out of a woken town, however far the ship)
  quiet: 70,                                // a man at his post who has noticed nothing, struck from behind by the hero, falls to that one blow, and it is heard only this far (rung 6: the quiet way in)
  // A man asleep (e.asleep, set by the page at night; 2026-10-13: the night raid). He lies where he is, sees nothing, and any
  // blow of the hero's is the one blow, from whichever side. A quiet noise (no further than hush) wakes him only if he is a
  // light sleeper (e.light); a loud one wakes him as it wakes anybody, and he is slow to his feet (getUp more seconds).
  hush: 80, getUp: 2.2,
  followGap: 12, riseAfter: 4, riseClear: 480   // a man who is down gets up after this long with no foe within this far: when the fight is over, not when it has only moved off
};
api.men = MEN; api.guardFace = GUARD_FACE; api.chain = CHAIN; api.posture = POSTURE; api.rally = RALLY; api.perfect = PERFECT; api.crowd = CROWD;
var hitFlags = { guardBreak: false, stagger: false, thrust: false, wt: 1, wkind: null };
api.runeState = null; api.onRuneGrow = null; api.runeOf = rune; api.runeHas = runeHas; api.runeN = runeN; api.knockOut = knockOut; api.markOn = markOn; api.marked = marked;   /* the runes (Runes2): a page hands its state in and reads what is bound */       // what the blow now landing can do (set round the hero's own blows); wt, wkind: its weight and the weapon's kind (for the pause, the ring and the sound)
function lerp(a, b, k) { return a + (b - a) * k; }
function armMan(e, o) {                     // make a spawned enemy a soldier: o = { side, wpn: { kind, mat, tint }, shield, armor, hp, strength (1..8), wits (1..8), loyal, nerve (0..1), bow }
  o = o || {}; e.type = 'soldier'; e.human = true; e.side = o.side ? 1 : 0; e.r = 7;
  var bow = !!(o.wpn && o.wpn.kind === 'bow'), kind = bow ? 'seax' : (o.wpn && PROFILES[o.wpn.kind] ? o.wpn.kind : 'sword'); e.wpn = bow ? { kind: 'bow', mat: 'wood', tint: null } : { kind: kind, mat: (o.wpn && o.wpn.mat) || 'iron', tint: (o.wpn && o.wpn.tint) || '#9ca3ad' };
  e.bow = bow; e.a01 = clamp(((o.aim != null ? o.aim : 4) - 1) / 6, 0, 1); e.close = false;   // a bowman: no shield; his aim (1..8); with a man on him he drops the bow for his seax (e.close)
  if (bow) { e.bowW = e.wpn; e.side2 = { kind: 'seax', mat: 'iron', tint: '#9ca3ad' }; }
  e.pf = MAN_PF[kind]; e.pow = o.pow != null ? o.pow : 1.3;   // (the men's own profiles: see MAN_PF)                         // the metal (iron's 1.3)
  e.shield = !!o.shield && kind !== 'greataxe' && !bow; e.armor = o.armor || 0;
  e.hp = e.maxHp = (o.hp || MEN.hp) * MEN.hpK; e.str = 0.7 + (o.strength != null ? o.strength : 4) * 0.075;
  e.w01 = clamp(((o.wits != null ? o.wits : 4) - 1) / 6, 0, 1); e.react = lerp(MEN.react[0], MEN.react[1], e.w01);
  e.loyal = !!o.loyal; e.nerve = o.nerve != null ? o.nerve : 0.5; e.name = o.name || '';
  e.guard = 0; e.guardCd = 0; e.guardAge = 0; e.seeT = 0; e.blocked = 0; e.poiseT = 0; e.hopCd = 0; e.wary = Math.random() < 0.2 + 0.65 * e.w01; e.swingN = 0; e.chainLeft = 0; e.tgt = null; e.retT = 0; e.strafe = e.seed > 5 ? 1 : -1; e.strafeT = 1 + Math.random() * 2;
  e.awake = true; e.sight = o.sight || MEN.sight; e.leash = o.leash || MEN.leash; e.order = 'follow'; e.deadFor = MEN.lie; e.cd = 0.4 + Math.random() * 0.8;
  if (o.x != null) { e.x = o.x; e.y = o.y; }
  if (o.post) { e.post = o.post; e.awake = false; if (o.aggro != null) e.aggro = o.aggro; if (o.wakeDelay != null) e.wakeDelay = o.wakeDelay; }
  if (o.vi != null) e.vi = o.vi;
  if (o.homeR) e.homeR = o.homeR;          // a householder: he defends his own door and goes to nobody else's fight
  return e;
}
function soldier(o) { var keep = api.dress; api.dress = null; var e = spawn('soldier'); api.dress = keep; armMan(e, o); if (api.dressMan) api.dressMan(e, o); return e; }
function eachFoe(e, fn) {
  var i, o;
  if ((e.side || 0) === 0) { if (!P.dead && !P.hidden) fn(P); for (i = 0; i < W.enemies.length; i++) { o = W.enemies[i]; if (o.side === 1 && !o.dead && !o.down) fn(o); } }
  else for (i = 0; i < W.enemies.length; i++) { o = W.enemies[i]; if (o.side === 1 || o.dead || o.fled || o.out) continue; if (o.type === 'soldier' ? o.awake !== false : (!o.flee && (!(o.aggro || o.strolls) || o.awake))) fn(o); }
}
// Man to man. A man is AT his target when he is within his reach of it and a few steps (inContact); a bowman at his distance
// and a man on an errand take nobody's place. Every frame: how many are at each fighter (onN), and for how long somebody has
// been (onT: it runs while anybody is, and is forgotten a moment after nobody is).
function takesPlace(o) { return o.type === 'soldier' && !o.dead && !o.down && !o.out && !o.fled && !o.errand && !(o.bow && !o.close); }
function inContact(o, F) { return Math.hypot(o.x - F.x, o.y - F.y) < (o.pf ? o.pf.reach : 30) + (F.r || 6) + 40; }
function tallyOn(dt) {
  var L = W.enemies, i, o;
  function tick(F) { if (F.onN > 0) { F.onT = (F.onT || 0) + dt; F.offT = 0; } else if (F.onT) { F.offT = (F.offT || 0) + dt; if (F.offT > 1.5) F.onT = 0; } }
  P.onN = 0; for (i = 0; i < L.length; i++) L[i].onN = 0;
  var od = W.odds || (W.odds = [0, 0]); od[0] = 0; od[1] = P.dead || P.hidden ? 0 : 1;                 // who stands in the fight where the hero is: theirs, yours (he is one of yours)
  for (i = 0; i < L.length; i++) { o = L[i]; if (o.type !== 'soldier' || o.dead || o.down || o.out || o.fled || o.awake === false || o.errand) continue; if (o.tgt || Math.hypot(o.x - P.x, o.y - P.y) < 600) od[o.side === 1 ? 1 : 0]++; }
  for (i = 0; i < L.length; i++) { o = L[i]; if (o.tgt && takesPlace(o) && inContact(o, o.tgt)) { o.tgt.onN++; if (!o.engAt) o.engAt = W.t; } else o.engAt = 0; }
  tick(P); for (i = 0; i < L.length; i++) tick(L[i]);
}
// How many of e's side may be at F. It begins at onOne (onHero for the hero) and grows by one for every joinAfter seconds
// somebody has been at him (joinYours for the hero's own men), to onMax at most. With MEN.odds it is instead the odds of the
// fight: as many to a man as there are of e's side for each of F's (W.odds, counted every frame), one at least, onMax at most.
function capOn(F, e) {
  var mine = e.side === 1 ? 1 : 0, top = Math.max(MEN.onMax, F === P ? MEN.onHero : 1);
  if (MEN.odds && W.odds) { var k = W.odds[mine] / Math.max(1, W.odds[1 - mine]); return Math.max(F === P ? Math.min(top, MEN.onHero) : 1, Math.min(top, Math.round(k))); }
  return Math.min(top, (F === P ? MEN.onHero : MEN.onOne) + Math.floor((F.onT || 0) / (mine ? MEN.joinYours : MEN.joinAfter)));
}
// The ways (2026-10-13, Robin on one at a time being too kind: "Yeah maybe. Try different versions"). Each is a set of the
// numbers above; Combat.way(id) lays one over MEN. `tests/battle.js ways` measures them side by side; the battle board has
// a row that steps through them.
var WAYS = {
  duel: { name: 'one at a time', onOne: 1, onHero: 2, onMax: 2, joinAfter: 6, joinYours: 3, odds: 0, hang: [105, 165] },          // one each; a second after six seconds; never a third
  pack: { name: 'one, then more', onOne: 1, onHero: 2, onMax: 3, joinAfter: 2.5, joinYours: 2, odds: 0, hang: [80, 130] },         // one each; a second after 2.5 s, a third after 5; those who wait stand nearer
  press: { name: 'two at a time', onOne: 2, onHero: 3, onMax: 3, joinAfter: 5, joinYours: 3, odds: 0, hang: [95, 150] },           // two each from the first moment, three on the hero; a third after 5 s
  odds: { name: 'by the odds', onOne: 1, onHero: 2, onMax: 3, joinAfter: 6, joinYours: 3, odds: 1, hang: [95, 150] },             // as many to a man as the sides stand: even numbers are duels, two to one is two on each
  swarm: { name: 'all at once', onOne: 0, onHero: 2, onMax: 2, joinAfter: 6, joinYours: 3, odds: 0, hang: [105, 165] }             // as it was before any of this: everybody on the nearest
};
function way(id) { var w = WAYS[id], k; if (!w) return null; for (k in w) if (k !== 'name') MEN[k] = w[k]; MEN.way = id; return w; }
// Is F taken, for e: as many of e's side at him as may be, counting those who are there already and those who will be there
// first. A man who is already after F gives way only to one who is nearer (or was at him first); a newcomer takes another
// man's place only by being a good deal nearer. Never taken: the man who is fighting e, and the hero when he has struck e or
// comes at him.
function fullFor(e, F, d) {
  if (!MEN.onOne || (e.bow && !e.close)) return false;
  if (F.tgt === e && d < 95) return false;
  if (e.order === 'hold' && e.holdAt && d < e.pf.reach + (F.r || 6) + 14) return false;      /* (a man told to hold strikes whoever is in his reach: the man beside him is helped) */
  if (F === P && ((W.heroHit === e && W.t - (W.heroHitT || -9) < 3) || (d < 78 && Math.abs(wrap(Math.atan2(e.y - P.y, e.x - P.x) - P.face)) < 0.9 && P.mode === 'fight'))) return false;
  var cap = capOn(F, e), mine = e.tgt === F, meAt = mine && e.engAt > 0, n = 0, i, o, od;
  for (i = 0; i < W.enemies.length; i++) {
    o = W.enemies[i]; if (o === e || o.tgt !== F || (o.side || 0) !== (e.side || 0) || !takesPlace(o)) continue;
    if (o.engAt > 0) { if (!meAt || o.engAt < e.engAt || (o.engAt === e.engAt && o.seed < e.seed)) n++; continue; }
    if (meAt) continue;
    od = Math.hypot(o.x - F.x, o.y - F.y);
    if (mine ? (od < d || (od === d && o.seed < e.seed)) : od < d + 40) n++;
  }
  return n >= cap;
}
// Room for his own fight: the two of them move, together, away from the men of other fights. Both work it out from the
// middle of the pair, so both get the same push and the distance between them is left alone (a push on each man by himself
// held them a pace out of each other's reach, and against men holding a line it took the attackers round its ends: the
// line won 7 fights in 100 where it had won 42). Not from men who only stand by, never from the hero, and not when either
// is the hero or a man told to hold: the hero goes where he likes, and a line is one fight.
var apX = 0, apY = 0;
function apartFrom(e, T) {
  apX = apY = 0; if (T === P || T.order === 'hold' || e.order === 'hold' || T.type !== 'soldier') return false;
  var i, o, q, R = MEN.apart, m, mx = (e.x + T.x) / 2, my = (e.y + T.y) / 2;
  for (i = 0; i < W.enemies.length; i++) {
    o = W.enemies[i]; if (o === e || o === T || o.type !== 'soldier' || o.dead || o.down || o.out || o.tgt === e || o.tgt === T || o === T.tgt || !(o.engAt > 0 || o.onN > 0)) continue;
    q = Math.hypot(mx - o.x, my - o.y); if (q < R && q > 0.01) { apX += (mx - o.x) / q * (1 - q / R); apY += (my - o.y) / q * (1 - q / R); }
  }
  m = Math.hypot(apX, apY); if (m > 1.4) { apX *= 1.4 / m; apY *= 1.4 / m; }
  return m > 0.02;
}
// Every one of them has his man: he hangs back from the nearest of them, at his own distance, apart from the others who
// wait, his face to the fight, and steps in when a place opens (pickTarget is asked every frame he has nobody).
function hangStep(e, dt, F) {
  var dx = e.x - F.x, dy = e.y - F.y, d = Math.hypot(dx, dy) || 1, ring = MEN.hang[0] + (MEN.hang[1] - MEN.hang[0]) * ((e.seed * 0.37) % 1), i, o, q, sx = 0, sy = 0, vx = 0, vy = 0;
  e.noT = 0; e.heardAt = null; e.guard = 0;
  // hanging back near the fight with a doorway between him and it, or pressing at it through a wall (the men behind a full gate):
  // after a while he looks for the way round and takes you in the back (api.wayRound: the grid's other gate)
  if (d <= ring + 80) { e.hangT = (e.hangT || 0) + dt; if (e.hangT > MEN.flankAfter && api.wayRound) { var px = F.x - dx / d * 60, py = F.y - dy / d * 60; if (api.wayRound(e, px, py)) { e.flank = { t: MEN.flankFor, F: F, x: px, y: py }; e.hangT = 0; return; } e.hangT = -MEN.flankRetry; } }   // (the place to reach: just beyond him on the far side, so the way must go round)
  if (d > ring + 80 || wallBetween(e.x, e.y, F.x, F.y)) { e.state = 'chase'; stepTo(e, F.x, F.y, d > ring + 200 ? MEN.run : MEN.speed, dt); e.face = turnToward(e.face, e.wayA != null ? e.wayA : Math.atan2(-dy, -dx), MEN.turn * dt); return; }
  for (i = 0; i < W.enemies.length; i++) { o = W.enemies[i]; if (o === e || o.type !== 'soldier' || o.dead || o.down || o.out || (o.side || 0) !== (e.side || 0)) continue; q = Math.hypot(e.x - o.x, e.y - o.y); if (q < 46 && q > 0.01) { sx += (e.x - o.x) / q * (1 - q / 46); sy += (e.y - o.y) / q * (1 - q / 46); } }
  if (d > ring + 10) { vx = -dx / d * MEN.speed * 0.8; vy = -dy / d * MEN.speed * 0.8; }
  else if (d < ring - 40) { vx = dx / d * MEN.back; vy = dy / d * MEN.back; }
  vx += sx * 34; vy += sy * 34;
  if (Math.abs(vx) + Math.abs(vy) > 4) { moveCircle(e, vx * dt, vy * dt); e.state = 'chase'; } else e.state = 'idle';
  e.face = turnToward(e.face, Math.atan2(-dy, -dx), MEN.turn * 0.6 * dt);
}
function flankStep(e, dt) {                 // on his way round: to the fight by the other way, until he is near it with nothing between, or the time is up
  var fl = e.flank, F = fl.F; fl.t -= dt; e.noT = 0; e.heardAt = null; e.guard = 0;
  if (!F || F.dead || (F !== P && (F.down || F.out || F.fled)) || (F === P && P.hidden)) { e.flank = null; return; }
  var d = Math.hypot(F.x - e.x, F.y - e.y); if (Math.hypot(fl.x - e.x, fl.y - e.y) < 30 || (d < 50 && !wallBetween(e.x, e.y, F.x, F.y))) { e.flank = null; return; }
  e.state = 'chase'; stepTo(e, fl.x, fl.y, MEN.run, dt); e.face = turnToward(e.face, e.wayA != null ? e.wayA : Math.atan2(fl.y - e.y, fl.x - e.x), MEN.turn * dt);
}
function tooFar(e, F) { var p = e.post, b = p.box, k = e.pursueK || 1; if (!b) return Math.hypot(F.x - p.x, F.y - p.y) > MEN.pursue * k; return Math.hypot(Math.max(b.x0 - F.x, 0, F.x - b.x1), Math.max(b.y0 - F.y, 0, F.y - b.y1)) > MEN.pursueOut * k; }   // (pursueK: a place whose plan is to hunt goes further)
function alarmFor(e) { return e.alarm && !(e.homeR && e.post && Math.hypot(e.alarm.x - e.post.x, e.alarm.y - e.post.y) > e.homeR) ? e.alarm : null; }
function heardTo(e) { var a = alarmFor(e); if (!a) return null; if (e.rally && !e.rallied) return { x: e.rally.x, y: e.rally.y, face: e.rally.face, rally: true }; return a; }   // where he goes on an alarm: his rally point first, when his place's plan has one (the defence's tactics, raid step 6, 2026-10-20), else the noise   // where he goes to look: a householder nowhere beyond his own door
function onTarget(F, me) { var n = 0, i, o; for (i = 0; i < W.enemies.length; i++) { o = W.enemies[i]; if (o !== me && o.type === 'soldier' && !o.dead && !o.down && !o.out && o.tgt === F && (o.side || 0) === (me.side || 0)) n++; } return n; }
function lureAt(e) { var sh = W.shade; if (e.lure && (!sh || sh.t <= 0)) e.lure = null; return e.lure && sh ? sh : null; }   /* the Ghost-step's shade: where a lured man goes */
function pickTarget(e) {
  var best = null, bs = 1e9, cur = e.tgt, wait = null, wd = 1e9;
  eachFoe(e, function (F) {
    var d = Math.hypot(F.x - e.x, F.y - e.y); if (d > e.sight) return;
    if (e.homeR && e.post && e.side !== 1 && Math.hypot(F.x - e.post.x, F.y - e.post.y) > e.homeR) return;   // a householder: only what comes to his own door
    if (e.side === 1 && e.order !== 'storm' && Math.hypot(F.x - P.x, F.y - P.y) > e.leash) return;   // a friend does not go past his leash from the hero (storming, he has none)
    if (e.post && e.side !== 1 && tooFar(e, F)) return;   // a man with a post: nobody beyond his reach from it (or from his town)
    if (e.order === 'hold' && e.holdAt && Math.hypot(F.x - e.holdAt.x, F.y - e.holdAt.y) > 90) return;   // told to hold: only what comes to him
    if (fullFor(e, F, d)) { if (d < wd) { wd = d; wait = F; } return; }                     // he has his man (or men) already: not for e
    var on = onTarget(F, e), sc = d + on * 44;                                              // one nobody has, then the least beset
    if (F === cur) sc -= 34;
    if (F === e.hitBy && W.t - (e.hitByT || -9) < MEN.turnT && d < 110 && !F.dead) sc -= MEN.turnK;   // a man struck by somebody other than his foe turns on him (2026-10-14): two of yours on the man who is on the hero draw him off the hero; the same for a town's man joining on one of yours
    if (e.side === 1 && F === W.heroHit && W.t - (W.heroHitT || -9) < 4 && !(cur && cur !== F && cur.tgt === e && !cur.dead)) sc -= Math.max(0, 140 - on * 70) + (F === cur ? 0 : 34);   // what the hero struck last: the first of his men who is free turns to it, a second may; a man with a foe on him keeps that foe
    if (sc < bs) { bs = sc; best = F; }
  });
  e.waitOn = best ? null : wait;                                                            // every one in sight is taken: the nearest of them, to hang back from
  return best;
}
function strikersOn(F, me) { var n = 0, i, o; for (i = 0; i < W.enemies.length; i++) { o = W.enemies[i]; if (o !== me && o.type === 'soldier' && !o.dead && o.tgt === F && (o.state === 'windup' || o.state === 'lunge')) n++; } return n; }
function blowTime(e, k) { return (MEN.wu + e.pf.wu * MEN.wuK) * (k || 1) + (MEN.ac + e.pf.ac * MEN.acK) * MEN.hitAt; }   // from the beginning of his blow to its landing (k: a quicker windup, as blowOf gives an answer or a second blow)
function slotFree(F, e, k) {                // may he begin a blow at F now: not more than MEN.slots at once, and never two landing together
  var n = 0, i, o, gap = F === P ? MEN.gapHero : MEN.gapT, mine = W.t + blowTime(e, k);
  for (i = 0; i < W.enemies.length; i++) { o = W.enemies[i]; if (o === e || o.type !== 'soldier' || o.dead || o.tgt !== F || !(o.state === 'windup' || (o.state === 'lunge' && !o.hitDone))) continue; n++; if (Math.abs((o.hitT || 0) - mine) < gap) return false; }
  return n < MEN.slots;
}
var ARCS = [0, 0, 1.6, 2.5, 3.2, 3.6];
function slotAngle(e, T) {                  // more than one on a target: places round the side of it that faces their middle, in the order they stand
  var L = [], i, o, sx = 0, sy = 0;
  for (i = 0; i < W.enemies.length; i++) { o = W.enemies[i]; if (o.type !== 'soldier' || o.dead || o.down || o.out || o.tgt !== T || (o.side || 0) !== (e.side || 0)) continue; var a = Math.atan2(o.y - T.y, o.x - T.x); L.push({ o: o, a: a }); sx += Math.cos(a); sy += Math.sin(a); }
  if (L.length < 2) return null;
  var mean = Math.atan2(sy, sx), n = L.length, arc = n < ARCS.length ? ARCS[n] : 3.8;
  L.forEach(function (q) { q.d = wrap(q.a - mean); }); L.sort(function (m1, m2) { return m1.d - m2.d; });
  for (i = 0; i < n; i++) if (L[i].o === e) return mean + (i - (n - 1) / 2) * (arc / (n - 1));
  return null;
}
function threatTo(e) {                      // whose blow is coming at him, if he can see one
  var a = P.atk, i, o, dx, dy, d;
  if ((e.side || 0) === 0 && !P.dead && P.mode === 'fight' && P.weapon !== 'ranged' && (a.ph === 'windup' || a.ph === 'active' || a.ph === 'charge')) {
    var sd = stepData(a); dx = e.x - P.x; dy = e.y - P.y; d = Math.hypot(dx, dy);
    if (d <= sd.reach + e.r + 30 && (a.spin || Math.abs(wrap(Math.atan2(dy, dx) - (a.ph === 'charge' ? P.face : a.dir))) <= sd.arc / 2 + 0.35)) return P;
  }
  for (i = 0; i < W.enemies.length; i++) {
    o = W.enemies[i]; if (o.type !== 'soldier' || o.dead || o.down || !o.sw || (o.side || 0) === (e.side || 0)) continue;
    if (o.state !== 'windup' && !(o.state === 'lunge' && !o.hitDone)) continue;
    dx = e.x - o.x; dy = e.y - o.y; d = Math.hypot(dx, dy);
    if (d <= o.sw.reach + e.r + 16 && Math.abs(wrap(Math.atan2(dy, dx) - o.dirLock)) <= o.sw.arc / 2 + 0.3 && !wallBetween(o.x, o.y, e.x, e.y)) return o;
  }
  return null;
}
// Making no way toward a place that is still far (another man in a narrow place, a corner, two round things side by side): he
// steps to one side for a moment, the other side next time, and further round each time it has not helped, until he is all
// but backing out of whatever holds him. (2026-10-13: a turn of 72 degrees either way, which is all this was, only pressed a
// man against one log seat or the other when he stood in the notch between two; the town test found men standing 5 to 21 s.)
// d: how far the place still is; far: far enough to bother; waiting: he is waiting his turn at a door. Answers the turn.
function sideStep(e, dt, d, far, waiting) {
  e.progT = (e.progT || 0) + dt; if (e.sideT > 0) e.sideT -= dt;
  if (e.sideN && (d < e.sideD - 28 || d > e.sideD + 160)) e.sideN = 0;      // past it (or the place has moved away): begin again
  if (e.progT >= 0.5) {
    var made = Math.hypot(e.x - (e.progX || 0), e.y - (e.progY || 0)); e.progT = 0; e.progX = e.x; e.progY = e.y;
    if (made < 3 && far && !waiting && !(e.sideT > 0)) { if (!e.sideN) e.sideD = d; e.sideN = Math.min(4, (e.sideN || 0) + 1); e.sideT = 0.45 + e.sideN * 0.15; e.sideS = -(e.sideS || (e.seed > 5 ? 1 : -1)); }
  }
  return e.sideT > 0 ? e.sideS * (0.7 + e.sideN * 0.55) : 0;
}
function stepTo(e, x, y, sp, dt) {          // toward a place; a page that knows the walls may give the next corner to make for (api.nav)
  if (e.fixed) return 0;                     // (a man who stays where he is put: the bowman on the tower, raid step 6)
  var far = Math.hypot(x - e.x, y - e.y);
  e.waiting = false; if (api.nav) { var wpt = api.nav(e, x, y); if (wpt) { if (wpt.wait) { e.progT = 0; e.waiting = true; return 0; } x = wpt.x; y = wpt.y; e.wayA = Math.atan2(y - e.y, x - e.x); } else e.wayA = null; }   /* (e.waiting: his turn at a full doorway has not come: an errand is not given up for that) */
  var dx = x - e.x, dy = y - e.y, d = Math.hypot(dx, dy); if (d < 0.5) return 0;
  var tb = e.type === 'soldier' ? sideStep(e, dt, far, far > 30, false) : 0; if (tb) { var ta = Math.atan2(dy, dx) + tb; dx = Math.cos(ta) * d; dy = Math.sin(ta) * d; }   // (a man who makes no way on an errand, to his post, to a noise or after the hero steps round what holds him)
  var ox = e.x, oy = e.y, st = Math.min(d, sp * dt); moveCircle(e, dx / d * st, dy / d * st); return Math.hypot(e.x - ox, e.y - oy);
}
function blowOf(e, second, quick) {
  var pf = e.pf, hv = second ? 1 : 0, clip = pf.motion === 'smash' ? 'mine' : (pf.heavy ? 'chop' : (e.swingN % 2 ? 'attack2' : 'attack1'));
  return { wu: (MEN.wu + pf.wu * MEN.wuK) * (second ? 0.7 : quick ? (e.wpn.kind === 'sword' ? 0.5 : 0.62) : 1), ac: MEN.ac + pf.ac * MEN.acK, rec: (MEN.rec + pf.rec * MEN.recK) * (1 + hv * 0.3), arc: Math.max(0.7, pf.arc * (pf.motion === 'thrust' ? 1.2 : 0.85)), reach: pf.reach,
    dmg: MEN.dmg * (MEN.wdmg[e.wpn.kind] || 1) * e.pow * e.str * (1 + hv * 0.35), kb: pf.kb, stag: pf.stag * (1 + hv * 0.6), heavy: !!pf.heavy, motion: pf.motion, pierce: !!pf.pierce, guardBreak: !!pf.guardBreak, clip: clip };
}
function beginBlow(e, T, ang, second, quick) {
  e.sw = blowOf(e, second, quick); if (cryHeavy(e)) e.sw.heavy = true; e.swingN++; e.state = 'windup'; e.t = 0; e.dur = e.sw.wu; e.dirLock = ang; e.face = ang; e.hitDone = false; e.swung = false; e.guard = 0; e.blocked = 0;
  e.hitT = W.t + e.sw.wu + e.sw.ac * MEN.hitAt; if (!heavyBlow(e)) sfx('tell', 0, e); tell(e);   // a blow that can be parried has its own sound (the studio's iron glint, 2026-10-15); a heavy one only the red tell's
}
function din() { return Math.min(MEN.noise.far / MEN.noise.blow, 1 + MEN.noise.din * Math.max(0, (W.fighting || 0) - 2)); }   // two men at it are heard a blow's distance off; a battle of twenty across a town (the town's answer builds as the fight does)
function noise(x, y, r, soft, except) {                   // something loud at a place: every man of the other side within r hears it. One at his post is on his way after a moment (longer if it was far, or if he must arm: e.wakeDelay); one already up with nobody to fight goes to look
  var heardN = 0;
  for (var i = 0; i < W.enemies.length; i++) {
    var o = W.enemies[i]; if (o.type !== 'soldier' || o.side === 1 || o.dead || o.out || o.down || o.deaf || o === except) continue; var d = Math.hypot(o.x - x, o.y - y); if (d > r) continue;
    o.alarm = { x: x, y: y }; heardN++;
    if (o.asleep && r <= MEN.hush && !o.light) { heardN--; continue; }                         // a quiet noise and a sound sleeper: he sleeps on
    if (o.awake === false) { if (!(o.wakeT > 0)) o.wakeT = o.asleep && r <= MEN.hush ? lerp(MEN.wake[0], MEN.wake[1], Math.random()) : (o.wakeDelay != null ? o.wakeDelay : lerp(MEN.wake[0], MEN.wake[1], Math.random())) * (0.6 + 0.8 * d / r) + (o.asleep ? MEN.getUp : 0); }   // (a light sleeper started out of his sleep by something beside him is up at once, with whatever lay by the bed; a man woken by a far noise arms first)
    else if (!o.tgt && alarmFor(o)) { o.heardAt = heardTo(o); o.lookT = 0; }
  }
  if (api.onNoise) api.onNoise(x, y, r, heardN, !!soft);   // heardN: how many men heard it; soft: a noise that is nothing unless somebody did (a blow on a wall)
  return heardN;
}
/* Something to look at that is nobody's blow (a house on fire). The men of the other side within r who are at their day
   leave it and go to stand before it, for o.hold seconds (call again to keep them there); a man the page says must stay
   (o.stays(e): a gate's guards, the hall's own) stays where he is. They have noticed nothing else: a real noise wakes them
   as at their posts, and a stranger who walks past is still a stranger. One already up with nobody to fight goes to look,
   as at any noise. Answers how many went or stand. (2026-10-13: a fire lit as a diversion drew nobody: it was a noise like
   any other, and every man who heard it was simply up and after the hero wherever he stood.) */
function gawk(x, y, r, o) {
  o = o || {}; var n = 0, i, m, d, a, q;
  for (i = 0; i < W.enemies.length; i++) {
    m = W.enemies[i]; if (m.type !== 'soldier' || m.side === 1 || m.dead || m.out || m.down || m.deaf) continue; d = Math.hypot(m.x - x, m.y - y); if (d > r) continue;
    if (m.errand && m.errand.gawk) { m.errand.hold = o.hold || 5; n++; continue; }
    if (m.errand) continue;
    if (m.awake === false) { if (o.stays && o.stays(m)) continue; a = Math.atan2(m.y - y, m.x - x) + (Math.random() - 0.5) * 1.1; q = (o.near || 64) + Math.random() * 44; var sp = o.spot ? o.spot(m, x + Math.cos(a) * q, y + Math.sin(a) * q) : { x: x + Math.cos(a) * q, y: y + Math.sin(a) * q }; if (!sp) continue; m.errand = { x: sp.x, y: sp.y, near: 24, run: true, gawk: true, hold: o.hold || 5, fx: x, fy: y }; n++; }   // (o.spot: the page says where a man may stand to look: not in the house that burns)
    else if (!m.tgt && !m.heardAt) { m.heardAt = { x: x + (Math.random() - 0.5) * 60, y: y + (Math.random() - 0.5) * 60 }; m.lookT = 0; }
  }
  return n;
}
function wallBetween(x0, y0, x1, y1) { return !!api.wall && api.wall(x0, y0, x1, y1); }   // a page that knows the walls: no blow, no arrow and no seeing through one
function strike(e) {
  var sw = e.sw, L = [];
  eachFoe(e, function (F) { var dx = F.x - e.x, dy = F.y - e.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); if (d <= sw.reach + F.r + 2 && Math.abs(wrap(a - e.dirLock)) <= sw.arc / 2 + 0.1 && !wallBetween(e.x, e.y, F.x, F.y)) L.push({ F: F, d: d, a: a }); });
  L.sort(function (m1, m2) { return m1.d - m2.d; }); if (!sw.pierce && sw.motion === 'thrust' && L.length > 1) L.length = 1;
  if (!L.length) { dust(e.x + Math.cos(e.dirLock) * (e.r + 10), e.y + Math.sin(e.dirLock) * (e.r + 10), 2); return; }
  noise(e.x, e.y, MEN.noise.blow * din());
  L.forEach(function (h) {
    if (h.F === P) {
      hitFlags.guardBreak = sw.guardBreak; hitFlags.stagger = sw.stag >= 40; var r = hurtPlayer(sw.dmg, e.x, e.y, sw.heavy ? 'heavy' : 'melee', e); hitFlags.guardBreak = false; hitFlags.stagger = false;
      if (r === 'parry') { parried(e); e.guard = 0; e.guardCd = 1.3; e.chainLeft = 0; }
    } else { hitFlags.guardBreak = sw.guardBreak; hitFlags.thrust = sw.pierce; damageEnemy(h.F, sw.dmg * MEN.toMen * MEN.hpK, h.a, sw.kb * 0.6, sw.stag, sw.heavy ? 'heavy' : 'melee', e); hitFlags.guardBreak = false; hitFlags.thrust = false; }
  });
}
function dodges(e, th) { if (e.thr !== th || e.thrN !== th.swingN) { e.thr = th; e.thrN = th.swingN; e.willDodge = Math.random() < 0.3 + 0.5 * e.w01; } return e.willDodge; }   // decided once a blow
function lowerGuard(e, tired) { e.guard = 0; e.guardAge = 0; e.guardCd = e.inLine ? 0.2 : lerp(MEN.guardCd[0], MEN.guardCd[1], e.w01) * (tired ? 1 : 0.45); e.wary = Math.random() < 0.2 + 0.65 * e.w01; }
function raiseGuard(e, t) { if (marked(e, 'struck') && runeN('hammer', 'noGuard')) return; e.guard = t || MEN.guard; e.guardAge = 0; e.seeT = 0; sfx('raise', 0, e); }
function heartOf(e) {                       // hurt badly: on his knees, away, or on with it (a loyal man and a friend do neither)
  if (e.side === 1 || e.loyal || e.nerved || e.hp > e.maxHp * MEN.yieldAt) return; e.nerved = true;
  if (Math.random() < e.nerve) return;
  if (Math.random() < 0.55) { e.state = 'yield'; e.t = 0; e.out = true; e.guard = 0; e.sw = null; if (W.lock === e) W.lock = null; if (api.onYield) api.onYield(e); }
  else { e.state = 'flee'; e.t = 0; e.out = true; e.guard = 0; e.sw = null; if (W.lock === e) W.lock = null; }
}
function bandOf(e) {                        // how his own band stands, as far as he can see: how many are still up beside him, how many have fallen or given up, how many foes are close
  var up = 0, gone = 0, foes = 0, i, o;
  for (i = 0; i < W.enemies.length; i++) { o = W.enemies[i]; if (o === e || o.type !== 'soldier' || (o.side || 0) !== (e.side || 0) || Math.hypot(o.x - e.x, o.y - e.y) > 420) continue; if (o.dead || o.out || o.down) gone++; else up++; }
  eachFoe(e, function (F) { if (Math.hypot(F.x - e.x, F.y - e.y) < 300) foes++; });
  return { up: up, gone: gone, foes: foes };
}
function bandHeart(e) {                     // looked at twice a second: the rout (a town's men, and raiders; never the hero's own)
  if (e.side === 1 || e.loyal || e.out) return; var b = bandOf(e), hurt = e.hp < e.maxHp * 0.6;
  if (!e.lastOne && b.up === 0 && b.gone >= 1 && b.foes >= 2) { e.lastOne = true; if (Math.random() > e.nerve) { breakMan(e, b.foes >= 3 || hurt ? 'yield' : 'flee'); return; } }   // the last of his band among several
  if (!e.halfGone && b.gone > b.up && b.gone >= 2 && hurt) { e.halfGone = true; if (Math.random() > e.nerve) breakMan(e, 'flee'); }                                     // more of them down than standing, and he is hurt
}
function cryHeavy(e) { if (e.cryHeavy) { e.cryHeavy = 0; return true; } return false; }   /* (the War-cry III: a man of yours strikes heavy once) */
function breakMan(e, how) {
  if (e.state === 'windup' || e.state === 'lunge') return;
  e.state = how; e.t = 0; e.out = true; e.guard = 0; e.sw = null; e.swung = false; if (W.lock === e) W.lock = null; if (how === 'yield' && api.onYield) api.onYield(e); if (how === 'flee' && api.onFlee) api.onFlee(e);
}
function goDown(e) {                        // a friend does not die of a blow: he is down, and up again when the fight is won
  if (e.errand) { var er1 = e.errand; e.errand = null; if (er1.drop) er1.drop(e); }
  e.down = true; e.hp = 0; e.deadT = 0; e.state = 'down'; e.guard = 0; e.sw = null; e.tgt = null; e.quietT = 0; e.aloneT = 0; sfx('die', 0, e); if (api.onDown) api.onDown(e);
}
function downTick(e, dt) {
  if (e.held) { e.quietT = 0; e.aloneT = 0; return; }           // carried, or laid aboard: he neither gets up nor dies of being left
  e.deadT += dt; var near = false, i, o;
  for (i = 0; i < W.enemies.length; i++) { o = W.enemies[i]; if (o.side !== 1 && !o.dead && !o.out && !o.fled && (o.type === 'soldier' ? o.awake !== false : !!o.awake || (!(o.aggro || o.strolls) && !o.flee)) && Math.hypot(o.x - e.x, o.y - e.y) < MEN.riseClear) { near = true; break; } }
  e.quietT = near ? 0 : (e.quietT || 0) + dt;
  var far = P.dead || Math.hypot(P.x - e.x, P.y - e.y) > 700; e.aloneT = far ? (e.aloneT || 0) + dt : 0;
  if (e.aloneT > 20) { e.down = false; e.dead = true; e.deadT = 2; if (api.onDeath) api.onDeath(e); return; }      // left behind, or the fight was lost
  if (e.quietT > MEN.riseAfter && !P.dead) { e.down = false; e.riseT = 0.8; e.hp = Math.max(1, e.maxHp * 0.35); e.state = 'chase'; e.t = 0; e.cd = 1; if (api.onRise) api.onRise(e); }
}
var FOLLOW = [[-20, 15], [20, 15], [-38, 30], [38, 30], [0, 34], [-56, 46], [56, 46], [-18, 52], [18, 52]];
function followStep(e, dt) {                // a friend with nobody to fight: his place beside and a little behind the hero
  if (P.hidden || P.dead) return;             // nobody to follow
  var n = 0, i, o; for (i = 0; i < W.enemies.length; i++) { o = W.enemies[i]; if (o === e) break; if (o.side === 1 && o.type === 'soldier' && !o.dead && !o.down && o.order !== 'hold') n++; }
  if (e.order === 'hold' && e.holdAt) {
    if (Math.hypot(e.holdAt.x - e.x, e.holdAt.y - e.y) > 5) { stepTo(e, e.holdAt.x, e.holdAt.y, MEN.speed * 1.2, dt); e.face = turnToward(e.face, Math.atan2(e.holdAt.y - e.y, e.holdAt.x - e.x), MEN.turn * dt); }
    else { if (e.holdAt.face != null) e.face = turnToward(e.face, e.holdAt.face, 4 * dt); if (e.shield) { var nf = 1e9; eachFoe(e, function (F) { nf = Math.min(nf, Math.hypot(F.x - e.x, F.y - e.y)); }); if (nf < 190) { if (!(e.guard > 0)) e.guardAge = 0; e.guard = 0.4; } } }   // in the line: the shield up while anyone is coming
    return;
  }
  var hd = W.heading == null ? P.face : W.heading, f = FOLLOW[n % FOLLOW.length], k = 1 + Math.floor(n / FOLLOW.length) * 0.6, bx = -Math.cos(hd), by = -Math.sin(hd), lx = -by, ly = bx;
  var tx = P.x + (lx * f[0] + bx * f[1]) * k, ty = P.y + (ly * f[0] + by * f[1]) * k, d = Math.hypot(tx - e.x, ty - e.y);
  if (d > MEN.followGap || e.moving) { e.moving = d > 4; var sp = d > 70 ? MEN.run * 1.15 : (d > 26 ? P.sprinting ? MEN.run * 1.1 : Math.max(MEN.speed, HERO_GAIT.walk) : MEN.speed); stepTo(e, tx, ty, sp, dt); e.face = turnToward(e.face, Math.atan2(ty - e.y, tx - e.x), MEN.turn * dt); }
  else e.face = turnToward(e.face, hd, 3 * dt);
}
function order(kind) {                      // the hero's word to his own men within call: 'follow' (break off and come) or 'hold' (a line abreast where he stands, facing where he faces)
  var L = W.enemies.filter(function (e) { return e.side === 1 && e.type === 'soldier' && !e.dead && !e.down && Math.hypot(e.x - P.x, e.y - P.y) < (kind === 'storm' ? 700 : e.order === 'storm' ? 1400 : 420); }), f = W.heading == null ? P.face : W.heading, i;   // (a man who storms hears the call back from much further)
  if (kind === 'hold') {
    var px = -Math.sin(f), py = Math.cos(f), fx = Math.cos(f), fy = Math.sin(f);
    L.sort(function (m1, m2) { return ((m1.x - P.x) * px + (m1.y - P.y) * py) - ((m2.x - P.x) * px + (m2.y - P.y) * py); });       // each takes the place nearest to where he stands along the line
    for (i = 0; i < L.length; i++) { var k = i - (L.length - 1) / 2, row = Math.floor(Math.abs(k) / 6); L[i].order = 'hold'; L[i].holdAt = { x: P.x + px * k * 17 + fx * (24 - row * 18), y: P.y + py * k * 17 + fy * (24 - row * 18), face: f }; L[i].calledT = 0; }
  } else if (kind === 'storm') { for (i = 0; i < L.length; i++) { L[i].order = 'storm'; L[i].holdAt = null; L[i].calledT = 0; L[i].stormAt = null; } }   // storm: no leash; each runs to the place the page gives him (e.stormAt) and fights whoever he meets
  else for (i = 0; i < L.length; i++) { L[i].order = 'follow'; L[i].holdAt = null; L[i].calledT = 1.6; L[i].stormAt = null; }
  return L;
}
// Storming (2026-10-13): a man of the hero's with nobody to fight runs to the place he was given; there the page gives him
// the next (api.onStormAt(e): a place, or nothing: then he is the hero's follower again). Making no way for three seconds
// (a barred gate, a locked door) the page is told (api.onStormBlocked(e)): it may have him break it.
function stormStep(e, dt) {
  var g = e.stormAt, d = Math.hypot(g.x - e.x, g.y - e.y);
  if (d < 34) { e.stormAt = api.onStormAt ? api.onStormAt(e) : null; if (!e.stormAt) e.order = 'follow'; e.state = 'idle'; e.stormT = 0; return; }
  e.state = 'chase'; var x0 = e.x, y0 = e.y; stepTo(e, g.x, g.y, MEN.run, dt); e.face = turnToward(e.face, e.wayA != null ? e.wayA : Math.atan2(g.y - e.y, g.x - e.x), MEN.turn * dt);
  e.stormT = Math.hypot(e.x - x0, e.y - y0) < MEN.run * dt * 0.25 ? (e.stormT || 0) + dt : Math.max(0, (e.stormT || 0) - dt * 2);
  if (e.stormT > 1.2) { e.stormT = 0; if (api.onStormBlocked) api.onStormBlocked(e); }
}
function postStep(e, dt) {                  // one of a town's men with nothing to fight: at his post
  var p = e.post; if (!p) return;
  var pd = Math.hypot(p.x - e.x, p.y - e.y);
  // (pushed a step from his place, he steps back to it as he stands: he does not turn his back on what he was watching to walk
  // two paces. 2026-10-13: the hero's own men, following him to a gate, nudged its guards, who turned about; nobody could then
  // come up behind them.)
  if (pd > 5) { stepTo(e, p.x, p.y, MEN.speed * 0.8, dt); e.face = turnToward(e.face, pd > 26 || p.face == null ? Math.atan2(p.y - e.y, p.x - e.x) : p.face, (pd > 26 ? MEN.turn : 3) * dt); e.atPost = pd <= 26 && p.face != null && Math.abs(wrap(e.face - p.face)) < 0.2; }
  else { if (p.face != null) e.face = turnToward(e.face, p.face, 3 * dt); e.atPost = true; }
}
function laneClear(e, F) {                  // may he shoot at this man: no wall between them and nobody of his own in the line (never into his friends)
  if (wallBetween(e.x, e.y, F.x, F.y)) return false;
  var dx = F.x - e.x, dy = F.y - e.y, L2 = dx * dx + dy * dy || 1, i, o, lane = MEN.bow.lane;
  function inWay(o) { if (o === e) return false; var t = ((o.x - e.x) * dx + (o.y - e.y) * dy) / L2; if (t < 0.04 || t > 1.02) return false; var px = e.x + dx * t - o.x, py = e.y + dy * t - o.y; return px * px + py * py < (lane + o.r) * (lane + o.r); }
  for (i = 0; i < W.enemies.length; i++) { o = W.enemies[i]; if (o.type !== 'soldier' || o.dead || o.down || (o.side || 0) !== (e.side || 0)) continue; if (inWay(o)) return false; }
  if (e.side === 1 && !P.dead && !P.hidden && inWay(P)) return false;
  return true;
}
function nearFoe(e) { var nd = 1e9, na = 0, nF = null; eachFoe(e, function (F) { var q = Math.hypot(F.x - e.x, F.y - e.y); if (q < nd && !wallBetween(e.x, e.y, F.x, F.y)) { nd = q; na = Math.atan2(F.y - e.y, F.x - e.x); nF = F; } }); return { d: nd, a: na, F: nF }; }
function sidearm(e, on) { if (!!e.close === !!on) return; e.close = !!on; e.wpn = on ? e.side2 : e.bowW; e.sw = null; e.farT = 0; }   // the bow for the seax, or back
function archerStep(e, dt, T, d, ang) {      // a bowman with a man to shoot: where he goes, and when he draws
  var B = MEN.bow; e.guard = 0;
  var way = api.nav ? api.nav(e, T.x, T.y) : null, wa = way && !way.wait ? Math.atan2(way.y - e.y, way.x - e.x) : ang;
  e.face = turnToward(e.face, wa, MEN.turn * dt);
  var nf = nearFoe(e);
  if (e.order === 'hold' && e.holdAt) { if (Math.hypot(e.holdAt.x - e.x, e.holdAt.y - e.y) > 10) stepTo(e, e.holdAt.x, e.holdAt.y, MEN.speed, dt); }
  else if (nf.d < B.keep && nf.F && nf.F.tgt !== e) moveCircle(e, -Math.cos(nf.a) * MEN.back * dt, -Math.sin(nf.a) * MEN.back * dt);   // the press coming his way: he keeps out of it, backward (a man who comes for him is another matter: he shoots, and then it is the seax)
  else if (way) { if (!way.wait) moveCircle(e, Math.cos(wa) * MEN.run * dt, Math.sin(wa) * MEN.run * dt); }
  else if (d > B.range - 30) moveCircle(e, Math.cos(ang) * (d > B.range + 60 ? MEN.run : MEN.speed) * dt, Math.sin(ang) * (d > B.range + 60 ? MEN.run : MEN.speed) * dt);
  else if (e.noLine > 0.8) { var bx0 = e.x, by0 = e.y; moveCircle(e, -Math.sin(ang) * e.strafe * MEN.speed * dt + Math.cos(ang) * (d > 170 ? 20 : 0) * dt, Math.cos(ang) * e.strafe * MEN.speed * dt + Math.sin(ang) * (d > 170 ? 20 : 0) * dt); if (Math.hypot(e.x - bx0, e.y - by0) < MEN.speed * dt * 0.4) { e.balkT = (e.balkT || 0) + dt; if (e.balkT > 0.4) { e.strafe = -e.strafe; e.balkT = 0; } } else e.balkT = 0; }   // no line to anybody (his own are in it): he walks round the fight until he has one
  if (e.cd > 0) return;
  var S2 = null, sd = 1e9;                   // the man he means to fight if the line to him is clear, else the nearest he has a line to
  if (d <= B.range && laneClear(e, T)) S2 = T;
  else eachFoe(e, function (F) { var q = Math.hypot(F.x - e.x, F.y - e.y); if (q <= B.range && q < sd && laneClear(e, F)) { sd = q; S2 = F; } });
  if (!S2) { e.cd = 0.3; e.noLine = (e.noLine || 0) + 0.3; if (e.noLine > 9) { e.noLine = 0.9; e.strafe = -e.strafe; } return; }   // (the other way round after a while, and at once when something stops him)
  e.noLine = 0; e.state = 'aim'; e.t = 0; e.dur = lerp(B.draw[0], B.draw[1], e.a01); e.aimAt = S2; e.aim0 = { x: S2.x, y: S2.y }; e.dirLock = Math.atan2(S2.y - e.y, S2.x - e.x);
}
function loose(e, F) {                      // the arrow: at where the man will be by as much as the bowman allows for, off by as much as his aim lets it be
  var B = MEN.bow, d = Math.hypot(F.x - e.x, F.y - e.y), ft = d / B.speed, k = lerp(B.lead[0], B.lead[1], e.a01), at = Math.max(0.3, e.t);
  var tx = F.x + (e.aim0 ? (F.x - e.aim0.x) / at : 0) * ft * k, ty = F.y + (e.aim0 ? (F.y - e.aim0.y) / at : 0) * ft * k;
  var a = Math.atan2(ty - e.y, tx - e.x) + (Math.random() * 2 - 1) * lerp(B.err[0], B.err[1], e.a01);
  if (!laneClear(e, { x: e.x + Math.cos(a) * (d + 30), y: e.y + Math.sin(a) * (d + 30), r: 0 })) { a = Math.atan2(F.y - e.y, F.x - e.x); if (!laneClear(e, { x: e.x + Math.cos(a) * (d + 30), y: e.y + Math.sin(a) * (d + 30), r: 0 })) return false; }   // where the arrow will really go (off by his aim, ahead of a moving man): not with one of his own there
  W.projs.push({ x: e.x + Math.cos(a) * 9, y: e.y + Math.sin(a) * 9, vx: Math.cos(a) * B.speed, vy: Math.sin(a) * B.speed, r: 3.5, dmg: B.dmg * e.str, owner: 'man', side: e.side || 0, src: e, life: B.life, ang: a });
  e.shots = (e.shots || 0) + 1; sfx('shoot', 0, e); return true;
}
function makingOff(T, e) {                  // is this man making off: going away from me with his back to me (a carrier, a man who runs, the hero walking away; a man who steps back with his face to me is not). Such a man is run down and struck on the run: a pursuer who stopped to draw back his arm never landed a blow on anyone who kept walking (2026-10-13)
  if (T === P) { var dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1, away = ((P.vx || 0) * dx + (P.vy || 0) * dy) / d; return away > 35 && Math.abs(wrap(P.face - Math.atan2(-dy, -dx))) > 1.9; }
  return !!T.errand || T.state === 'flee';
}
function soldierAI(e, dt) {
  var shL = lureAt(e); if (shL && !e.dead && !e.down && !e.out && e.state !== 'stagger' && e.state !== 'stunned' && e.freezeT <= 0) { var dxs = shL.x - e.x, dys = shL.y - e.y, ds = Math.hypot(dxs, dys); if (ds > 16) { stepTo(e, shL.x, shL.y, MEN.run, dt); e.face = turnToward(e.face, Math.atan2(dys, dxs), MEN.turn * dt); return; } if (shL.open) e.exposedT = Math.max(e.exposedT || 0, shL.open); e.lure = null; W.shade = null; num(e.x, headY(e), 'a shade', '#9fd8ff'); logEv({ k: 'shade', e: e }); return; }   /* the Ghost-step's shade: he runs at it and strikes air, open at tier III */
  var i, T, dx, dy, d, ang;
  e.cd -= dt; e.guardCd -= dt; e.poiseT -= dt; e.hopCd -= dt; if (e.rushed > 0) e.rushed -= dt; if (e.riseT > 0) { e.riseT -= dt; return; }
  if (e.marks) { for (var mk in e.marks) { e.marks[mk] -= dt; if (e.marks[mk] <= 0) delete e.marks[mk]; } if (e.marks.struck > 0 && Math.random() < dt * 5) spark(e.x + (Math.random() - 0.5) * 12, e.y - 18 - Math.random() * 14, 1, '#ffe9a0', 30); }   /* the marks a rune laid, fading (Runes2) */
  if (e.guard > 0) { e.guard -= dt; e.guardAge += dt; if (e.guard <= 0) lowerGuard(e, false); }
  if (e.heard > 0) { e.heard -= dt; e.awake = true; }
  e.heartT = (e.heartT || Math.random() * 0.5) - dt; if (e.heartT <= 0) { e.heartT = 0.5; bandHeart(e); }
  if (e.state === 'yield') {                // on his knees, out of it; left alone a while he gets up and goes
    e.guard = 0; var near = 1e9; eachFoe(e, function (F) { near = Math.min(near, Math.hypot(F.x - e.x, F.y - e.y)); });
    if (e.t > 14 || (e.t > 5 && near > 110)) { e.state = 'flee'; e.t = 0; }
    return;
  }
  if (e.state === 'flee') {                 // away from whoever is nearest, and fled when far enough
    var nx = 0, ny = 0, nd = 1e9; eachFoe(e, function (F) { var q = Math.hypot(F.x - e.x, F.y - e.y); if (q < nd) { nd = q; nx = F.x; ny = F.y; } });
    if (nd > 620 || nd === 1e9) { e.fled = true; return; }
    var fa = Math.atan2(e.y - ny, e.x - nx); e.face = turnToward(e.face, fa, MEN.turn * dt); moveCircle(e, Math.cos(e.face) * MEN.run * dt, Math.sin(e.face) * MEN.run * dt); return;
  }
  if (e.errand) {                           // sent somewhere with something to do there (a chest to the ship): he goes by the grid and fights nobody on the way. { x, y, near, run, slow, done(e), drop(e), fail(e) }
    var er = e.errand, ed = Math.hypot(er.x - e.x, er.y - e.y); e.tgt = null; e.guard = 0; e.sw = null;
    if (er.gawk && e.wakeT > 0) { e.wakeT -= dt; if (e.wakeT <= 0) { e.errand = null; e.awake = true; e.heardAt = heardTo(e); e.lookT = 0; if (api.onWake) api.onWake(e); return; } }   // (a man gone to look at a fire has noticed nothing else: a noise wakes him as it would at his post)
    if (ed < (er.near || 16)) { if (er.hold > 0) { er.hold -= dt; e.state = 'idle'; if (er.fx != null) e.face = turnToward(e.face, Math.atan2(er.fy - e.y, er.fx - e.x), 3 * dt); return; } e.errand = null; e.state = 'idle'; if (er.done) er.done(e); return; }   // (hold: he stands there that long, looking at fx, fy)
    e.state = 'chase'; var em = stepTo(e, er.x, er.y, (er.run ? MEN.run : MEN.speed) * (er.slow || 1), dt);
    e.face = turnToward(e.face, e.wayA != null ? e.wayA : Math.atan2(er.y - e.y, er.x - e.x), MEN.turn * dt);
    er.t = (er.t || 0) + dt; er.px = er.px == null ? e.x : er.px; er.py = er.py == null ? e.y : er.py;
    if (er.t >= 6) { if (Math.hypot(e.x - er.px, e.y - er.py) < 6 && !e.waiting) { e.errand = null; if (er.fail) er.fail(e); else if (er.drop) er.drop(e); } er.t = 0; er.px = e.x; er.py = e.y; }   // six seconds and no way made: he gives it up (not while he waits his turn at a doorway, 2026-10-21)
    return;
  }
  if (e.awake === false) {                  // at his post, and has seen nothing
    var seen = false, st = api.mods && api.mods().stealth ? api.mods().stealth : 1;
    if (e.wakeT > 0) { e.wakeT -= dt; if (e.wakeT <= 0) { e.awake = true; e.heardAt = heardTo(e); e.lookT = 0; if (e.asleep) { e.asleep = false; e.riseT = 0.8; } if (api.onWake) api.onWake(e); } }
    if (e.asleep) { e.state = 'idle'; e.guard = 0; return; }                                 // asleep: he sees nobody and does not stir
    if (e.awake === false) eachFoe(e, function (F) { var q = Math.hypot(F.x - e.x, F.y - e.y), behind = Math.abs(wrap(Math.atan2(F.y - e.y, F.x - e.x) - e.face)) > 1.9; if (q < (e.aggro != null ? e.aggro : MEN.aggro) * (behind ? 0.45 : 1) * (F === P ? st : 1) && !wallBetween(e.x, e.y, F.x, F.y)) seen = true; });
    if (seen) { e.awake = true; if (api.onWake) api.onWake(e); } else if (e.awake === false) { postStep(e, dt); e.state = 'idle'; return; }
  }
  e.retT -= dt; T = e.tgt;
  if (e.calledT > 0) { e.calledT -= dt; if (e.state !== 'windup' && e.state !== 'lunge') { T = e.tgt = null; e.retT = e.calledT; } }
  if (!(e.calledT > 0) && (!T || T.dead || T.down || T.fled || (T !== P && T.out) || (T === P && P.hidden) || e.retT <= 0)) { T = e.tgt = pickTarget(e); e.retT = 0.4 + Math.random() * 0.3; }
  if (T && (e.side || 0) === 0 && e.post && W.t - (e.shoutAt == null ? -99 : e.shoutAt) > 25) { e.shoutAt = W.t; noise(e.x, e.y, MEN.noise.shout); sfx('tele', 0, e); tell(e); if (api.onShout) api.onShout(e); }   // a town's man who sees you: his shout carries
  if (!T) {                                 // nobody to fight
    if (e.state === 'windup' || e.state === 'lunge' || e.state === 'recover' || e.state === 'stagger' || e.state === 'stunned' || e.state === 'back' || e.state === 'aim' || e.state === 'loose') { if (e.t >= e.dur) { e.state = 'chase'; e.sw = null; e.swung = false; } return; }
    e.state = 'idle'; e.guard = 0; e.sw = null; if (e.close) sidearm(e, false);
    if (e.side === 1) { if (e.order === 'storm' && e.stormAt) stormStep(e, dt); else followStep(e, dt); }
    else if (e.flank && e.flank.t > 0) flankStep(e, dt);
    else if (e.waitOn && !e.waitOn.dead && !(e.waitOn !== P && (e.waitOn.down || e.waitOn.out || e.waitOn.fled))) hangStep(e, dt, e.waitOn);
    else if (e.heardAt) {
      var hd = Math.hypot(e.heardAt.x - e.x, e.heardAt.y - e.y);
      if (hd > 36 && !(e.lookT > 0)) { e.state = 'chase'; var mv = stepTo(e, e.heardAt.x, e.heardAt.y, MEN.run, dt); e.face = turnToward(e.face, e.wayA != null ? e.wayA : Math.atan2(e.heardAt.y - e.y, e.heardAt.x - e.x), MEN.turn * dt); e.stuckT = mv < MEN.run * dt * 0.2 || e.sideN >= 3 ? (e.stuckT || 0) + dt : 0; if (e.stuckT > 2.5) { e.lookT = 0.01; e.stuckT = 0; e.sideN = 0; } }   // (he cannot get there: he looks about where he is)
      else if (e.heardAt.rally) { e.lookT = (e.lookT || 0) + dt; if (e.heardAt.face != null) e.face = turnToward(e.face, e.heardAt.face, 3 * dt); else e.face += Math.sin(e.lookT * 1.3 + e.seed) * dt * 1.4; if (e.lookT > (e.rallyHold != null ? e.rallyHold : 10)) { e.rallied = true; e.lookT = 0; e.heardAt = e.rallyThen === 'alarm' ? alarmFor(e) : null; } }   // at his rally point: he holds it as long as his plan says, then goes on to the noise (a muster) or stays by his post there (the gate)
      else { e.lookT = (e.lookT || 0) + dt; e.face += Math.sin(e.lookT * 1.3 + e.seed) * dt * 1.4; if (e.lookT > 7) { e.heardAt = null; e.lookT = 0; e.noT = 0; } }
    }
    else { e.noT = (e.noT || 0) + dt; if (e.homeR && e.post && e.noT <= 22) postStep(e, dt); if (e.post && e.noT > (e.homeR ? 22 : 6)) { postStep(e, dt); if (e.atPost) { e.awake = false; e.noT = 0; e.wakeT = 0; } } }
    return;
  }
  e.noT = 0; e.moving = false;
  dx = T.x - e.x; dy = T.y - e.y; d = Math.hypot(dx, dy); ang = Math.atan2(dy, dx);
  var keep = e.pf.reach + T.r - 5;
  e.inLine = false;                         // in a line: told to hold, at his place, another of his own at his shoulder. His shield stays up until he strikes and covers his neighbour's side as well as his own
  if (e.order === 'hold' && e.holdAt && e.shield && Math.hypot(e.holdAt.x - e.x, e.holdAt.y - e.y) < 30) for (i = 0; i < W.enemies.length; i++) { var nb = W.enemies[i]; if (nb !== e && nb.side === e.side && nb.type === 'soldier' && !nb.dead && !nb.down && nb.order === 'hold' && Math.hypot(nb.x - e.x, nb.y - e.y) < 26) { e.inLine = true; break; } }
  if (e.bow) {                              // a bowman with a man on him draws his seax and fights with that (a poor fighter: no shield, a short blade); left alone a moment he takes up the bow again
    var nfd = nearFoe(e).d;
    if (!e.close && nfd < MEN.bow.near && e.state !== 'loose') { sidearm(e, true); if (e.state === 'aim') { e.state = 'chase'; e.t = 0; } e.cd = Math.max(e.cd, 0.35); }
    else if (e.close && nfd > MEN.bow.near + 60 && e.state === 'chase') { e.farT = (e.farT || 0) + dt; if (e.farT > 0.8) { sidearm(e, false); e.cd = 0.4; } }
    else e.farT = 0;
  }
  switch (e.state) {
    case 'idle': e.state = 'chase'; e.t = 0; break;
    case 'chase':
      if (e.bow && !e.close) { archerStep(e, dt, T, d, ang); break; }
      var th = threatTo(e), fa2 = th ? Math.atan2(th.y - e.y, th.x - e.x) : ang;
      e.face = turnToward(e.face, fa2, MEN.turn * dt);
      if (e.guard > 0) { if (th || e.inLine || (e.wary && d <= keep + 16 && e.cd > 0.2)) e.guard = Math.max(e.guard, 0.3); if (!e.inLine && e.guardAge > MEN.guardMax) lowerGuard(e, true); }
      else if (th && th !== P && th.sw && (th.sw.guardBreak || th.sw.stag >= 40) && e.hopCd <= 0 && !e.inLine && dodges(e, th)) {       // a blow that would break his guard: a man who sees it in time steps out of it (not every time: by his wits), and comes back in while the other recovers
        e.seeT += dt; if (e.seeT >= e.react) { e.state = 'back'; e.t = 0; e.dur = 0.3; e.hop = true; e.seeT = 0; e.hopCd = 2.4; e.cd = Math.min(e.cd, 0.15); break; }
      }
      else if (e.shield && e.guardCd <= 0 && th) { e.seeT += dt; if (e.seeT >= e.react) raiseGuard(e); }                 // a blow he sees coming, if he is quick enough
      else if (e.shield && e.guardCd <= 0 && (e.inLine || (e.wary && d <= keep + 16)) && e.cd > 0.2) raiseGuard(e);     // a wary man: behind his shield while you are in reach and he is not striking; a man in a line: always
      else e.seeT = Math.max(0, e.seeT - dt * 2);
      // his place: at his reach from the target, at his own angle round it when others are on it too
      var sa = slotAngle(e, T), waiting = e.cd > 0.5 || !slotFree(T, e), want = keep + (sa != null && waiting && strikersOn(T, e) >= MEN.slots ? 14 : 0), slow = e.guard > 0 ? 0.5 : 1;
      if (e.order === 'hold' && e.holdAt && Math.hypot(e.holdAt.x - e.x, e.holdAt.y - e.y) > 46 && d > keep) { stepTo(e, e.holdAt.x, e.holdAt.y, MEN.speed, dt); break; }   // told to hold: he does not follow a man who backs away
      var way = api.nav ? api.nav(e, T.x, T.y) : null;                                                                 // a wall between them: the way round it
      // making no way toward a man who is still far (another man in a narrow place, a corner): he steps to one side for a moment, the other side next time
      var turnBy = sideStep(e, dt, d, d > want + 24, way && way.wait);
      if (way) { if (!way.wait) { var wa = Math.atan2(way.y - e.y, way.x - e.x) + turnBy, wsp = (d > want + 70 ? MEN.run : MEN.speed) * slow; moveCircle(e, Math.cos(wa) * wsp * dt, Math.sin(wa) * wsp * dt); if (!th) e.face = turnToward(e.face, wa, MEN.turn * dt); } }
      else if (d > want + 70 || turnBy || (T.bow && !T.close && d > want + 8) || (d > keep - 2 && makingOff(T, e))) moveCircle(e, Math.cos(ang + turnBy) * MEN.run * dt, Math.sin(ang + turnBy) * MEN.run * dt);   // (a bowman is run down, not walked up to)
      else {
        var vr = clamp((d - want) * 3.2, -MEN.back * 0.5, MEN.speed), vt = 0, here = Math.atan2(-dy, -dx);
        if (sa != null) vt = clamp(wrap(sa - here) * 70, -MEN.strafe * 2, MEN.strafe * 2);
        else { e.strafeT -= dt; if (e.strafeT <= 0) { e.strafeT = 0.8 + Math.random() * 2.2; e.strafe = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? 1 : -1); } vt = e.strafe * MEN.strafe * (d < want + 20 ? 1 : 0); }
        moveCircle(e, (Math.cos(ang) * vr - Math.sin(here) * vt) * slow * dt, (Math.sin(ang) * vr + Math.cos(here) * vt) * slow * dt);
        if (MEN.onOne && !e.inLine && e.order !== 'hold' && apartFrom(e, T)) moveCircle(e, apX * MEN.drift * dt, apY * MEN.drift * dt);   // room for his own fight
      }
      if ((e.guard <= 0 || (e.blocked > 0 && !th)) && !(th && e.shield && e.guardCd <= 0)) {   // a man with a shield does not begin a blow into one he sees coming: he stops it first, and answers
        if (e.answerT > 0) e.answerT -= dt;
        var aligned = Math.abs(wrap(ang - e.face)) < (e.answerT > 0 ? 1.1 : 0.45);
        var answer = e.blocked > 0;   // (below: a foe in reach with no wall between is struck, whatever the grid makes of the way to him: being led round a corner, or waiting his turn at a gate, he stood face to face with his man and did nothing)
        if (e.cd <= 0 && d <= keep + 7 && aligned && (!way || !wallBetween(e.x, e.y, T.x, T.y)) && (e.answerT > 0 || slotFree(T, e, answer ? (e.wpn.kind === 'sword' ? 0.5 : 0.62) : 1)) && !(T === P && (P.roll.t > 0))) { e.answerT = 0; e.chainLeft = e.pf.chain > 1 && Math.random() < 0.2 + e.w01 * 0.4 ? 1 : 0; beginBlow(e, T, ang, false, answer); }
      }
      break;
    case 'windup':
      e.dirLock = turnToward(e.dirLock, ang, (e.pf.motion === 'thrust' ? 1.0 : 1.6) * dt); e.face = e.dirLock;
      if (d > keep - 6 && makingOff(T, e)) moveCircle(e, Math.cos(ang) * MEN.run * dt, Math.sin(ang) * MEN.run * dt);   // after a man who is making off: the arm goes back on the run
      if (e.t >= e.dur) { e.state = 'lunge'; e.t = 0; e.dur = e.sw.ac; e.hitDone = false; sfx('swing', 0, e); }
      break;
    case 'lunge':
      if (d > T.r + e.r + 5) { var lsp = makingOff(T, e) ? Math.max(e.pf.lunge * 0.5, MEN.run) : e.pf.lunge * 0.5; moveCircle(e, Math.cos(e.dirLock) * lsp * dt, Math.sin(e.dirLock) * lsp * dt); }
      if (!e.hitDone && e.t >= e.dur * MEN.hitAt) { e.hitDone = true; strike(e); }
      if (e.state === 'lunge' && e.t >= e.dur) { e.state = 'recover'; e.t = 0; e.dur = e.sw.rec; e.swung = true; }
      break;
    case 'recover':
      if (e.swung && e.chainLeft > 0 && e.t >= e.dur * 0.45 && d <= keep + 14 && slotFree(T, e, 0.7)) { e.chainLeft--; beginBlow(e, T, ang, true); break; }
      if (e.shield && e.guardCd <= 0 && e.t >= e.dur * 0.5) {                                                       // the second half of his recovery: a man who sees the answer coming gets his shield back in time, if he is quick
        var th3 = threatTo(e);
        if (th3) { e.seeT += dt; if (e.seeT >= e.react) { raiseGuard(e); e.state = 'chase'; e.t = 0; e.sw = null; e.swung = false; e.cd = lerp(MEN.cd[0], MEN.cd[1], e.w01) * (0.8 + Math.random() * 0.5) * (0.5 + 0.5 * e.pf.st / 7); break; } }
      }
      if (e.t >= e.dur) { e.state = 'chase'; e.t = 0; e.sw = null; e.swung = false; e.cd = lerp(MEN.cd[0], MEN.cd[1], e.w01) * (0.8 + Math.random() * 0.5) * (0.5 + 0.5 * e.pf.st / 7); }   // a light weapon is ready again sooner, a heavy one later
      break;
    case 'stunned':                       // parried (2026-10-15: there was no case, and the default sent him straight back to the chase: Robin parried a man and he struck again at once)
      e.guard = 0; e.kx *= 0.9; e.ky *= 0.9;
      if (e.t >= e.dur) { e.finish = false; e.state = 'chase'; e.t = 0; e.sw = null; e.swung = false; e.cd = 0; e.answerT = CHAIN.answer; e.guardCd = Math.max(e.guardCd, CHAIN.answer); }   // he comes out of it swinging: a blow at once, which can be parried again (the parry chain)
      break;
    case 'stagger':
      if (e.t >= e.dur) {
        e.sw = null; e.swung = false; e.cd = Math.max(e.cd, 0.3); e.seeT = e.react * 0.6;                            // hit: he is quicker to cover now
        var cover = e.shield && e.guardCd <= 0.3 && Math.random() < 0.4 + 0.5 * e.w01, was = e.brokeT > 0; e.brokeT = 0;                                  // a man with a shield gets it up after the first blow of a chain
        if (cover) raiseGuard(e, MEN.guard + 0.3);
        if ((e.hp < e.maxHp * MEN.backAt && Math.random() < 0.45) || (!cover && Math.random() < (was ? 0.75 : 0.3 + 0.45 * e.w01))) { e.state = 'back'; e.t = 0; e.dur = cover ? 0.5 + Math.random() * 0.4 : 0.32 + Math.random() * 0.2; e.hop = !cover; }   // or steps out of the next one
        else { e.state = 'chase'; e.t = 0; }
      }
      break;
    case 'back':
      e.face = turnToward(e.face, ang, MEN.turn * dt); moveCircle(e, -Math.cos(ang) * MEN.back * (e.hop ? 1.9 : 1) * dt, -Math.sin(ang) * MEN.back * (e.hop ? 1.9 : 1) * dt);
      if (e.t >= e.dur) { e.state = 'chase'; e.t = 0; e.hop = false; }
      break;
    case 'aim':                             // the bow drawn: he follows his man with it; someone on him and he lets it down; the line fouled and he holds a moment
      var F2 = e.aimAt, BW = MEN.bow;
      if (!F2 || F2.dead || F2.down || F2.out || F2.fled || (F2 === P && (P.hidden || P.dead))) { e.state = 'chase'; e.t = 0; e.cd = 0.3; break; }
      e.dirLock = turnToward(e.dirLock, Math.atan2(F2.y - e.y, F2.x - e.x), 2.4 * dt); e.face = e.dirLock;
      if (e.t >= e.dur) {
        if (Math.hypot(F2.x - e.x, F2.y - e.y) > BW.range + 40 || !laneClear(e, F2)) { if (e.t > e.dur + 0.8) { e.state = 'chase'; e.t = 0; e.cd = 0.4; } break; }
        if (!loose(e, F2)) { if (e.t > e.dur + 0.8) { e.state = 'chase'; e.t = 0; e.cd = 0.4; } break; }
        e.state = 'loose'; e.t = 0; e.dur = 0.36;
      }
      break;
    case 'loose':
      if (e.t >= e.dur) { e.state = 'chase'; e.t = 0; e.cd = lerp(MEN.bow.cd[0], MEN.bow.cd[1], e.a01) * (0.8 + Math.random() * 0.4); }
      break;
    default: e.state = 'chase'; e.t = 0;
  }
}
// A calm animal with e.wander = { x0, y0, r } ambles between points near its home ground, pausing between walks.
/* A shy beast (the deer, 2026-10-13; e.shy, set by the page): it notices you by sight, so e.aggro is its reach before it and
   less than half of that behind it, more when you sprint (a hunter walks up slowly, from behind); and it runs the open way,
   not straight away from you into the sea: fleeStep tries nine headings fanned round "away" and takes the one with the
   longest clear run (api.scene.walk), so a deer on the beach runs along the shore instead of standing in the surf to be
   cut down. It runs until you are far (3.2 of its reach), then stands and watches you a while before it grazes again. */
/* The wounded shy beast and the herd (2026-10-14, Robin: the deer "runs when you come close, and runs when hit by an arrow, so
   you chase it for ever: feels impossible to kill"). A hit on a shy beast makes it BLEED (e.bleedT seconds, the loss fastest at
   first and fading as it clots; a second hit opens it again), and its wounds SLOW it (its run by SHY.slow of its share of health
   lost) and SHORTEN its runs (it stops and stands sooner, by SHY.run of the same). Bleeding, it leaves BLOOD ON THE GROUND
   (api.onBlood(x, y, k, pool): a drop every SHY.trail units of its run, a pool when it stands), so a hunter follows the trail
   to where it stands or lies; bled out it dies as a beast dies (killEnemy, nobody's blow but the hero's kill). THE HERD: a
   shy beast with e.herd runs when any of its herd within SHY.herdR runs or is struck (herdWake), and one of them, e.watch,
   keeps its head up: it sees as far behind it as before it (shyK), so a herd is stalked from the side its watcher is not on.
   Every number is mine, a first setting. */
var SHY = { bleedT: 40, bleed: 0.14, slow: 0.7, run: 0.6, herdR: 260, trail: 16, pool: 2.5 }; api.shy = SHY;
function shyK(e, ga) { var behind = !e.watch && Math.abs(wrap(ga - e.face)) > 1.6, k = behind ? 0.45 : 1; if (P.sprinting) k *= 1.6; return k; }
function woundOf(e) { return e.maxHp > 0 ? Math.max(0, Math.min(1, 1 - e.hp / e.maxHp)) : 0; }
function herdLead(e) {                 // the watcher of a beast's herd, while it lives: the one the rest run with and graze by
  if (e.herd == null || e.watch) return null; if (e.lead && !e.lead.dead && e.lead.herd === e.herd) return e.lead;
  for (var i = 0; i < W.enemies.length; i++) { var o = W.enemies[i]; if (o.herd === e.herd && o.watch && !o.dead) return (e.lead = o); }
  return null;
}
function herdWake(e) {
  if (e.herd == null) return;
  for (var i = 0; i < W.enemies.length; i++) { var o = W.enemies[i]; if (o === e || o.herd !== e.herd || o.dead || !o.shy || o.awake) continue; if (Math.hypot(o.x - e.x, o.y - e.y) < SHY.herdR) { o.awake = true; o.fleeT = 0; o.watchT = 0; } }
}
function bleedTick(e, dt) {
  var k = Math.max(0, e.bleedT / SHY.bleedT); e.bleedT -= dt; e.hp -= SHY.bleed * (0.35 + 0.65 * k) * dt;
  var mv = e.bx == null ? 0 : Math.hypot(e.x - e.bx, e.y - e.by); e.bx = e.x; e.by = e.y; e.bloodD = (e.bloodD || 0) + mv; e.poolT = (e.poolT || 0) + dt;
  if (e.bloodD >= SHY.trail) { e.bloodD = 0; e.poolT = 0; if (api.onBlood) api.onBlood(e.x, e.y, 0.6 + k * 0.6, false); }
  else if (mv < dt * 4 && e.poolT > SHY.pool) { e.poolT = 0; if (api.onBlood) api.onBlood(e.x, e.y, 1 + k, true); }
  if (e.hp <= 0) { e.hp = 0; e.bledOut = true; killEnemy(e); }
}
function fleeStep(e, dt, ga, gd) {
  var fs2 = (e.cfg ? e.cfg.speed : 58) * (e.shy ? 1.7 * (1 - SHY.slow * woundOf(e)) : 1.5), away = ga + Math.PI, wkw = api.scene && api.scene.walk;   // (a wounded shy beast runs slower, by its wounds)
  e.state = 'chase'; e.t += dt; e.fleeT = (e.fleeT || 0) + dt;
  if (e.shy && wkw && (e.fleeT > (e.fleeRe || 0))) {               // a heading, chosen again every half second: the open way nearest to straight away
    var best = null, bestR = -1, k;
    for (k = 0; k < 9; k++) { var ang = away + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.42, run = 0, st; for (st = 1; st <= 6; st++) { if (!wkw(e.x + Math.cos(ang) * st * 24, e.y + Math.sin(ang) * st * 24, e)) break; run = st; } var score = run * 10 - Math.ceil(k / 2) * 3; if (score > bestR) { bestR = score; best = ang; } }
    e.fleeAng = best == null ? away : best; e.fleeRe = e.fleeT + 0.5;
  }
  var fa = e.shy ? (e.fleeAng == null ? away : e.fleeAng) : away, L = e.shy ? herdLead(e) : null;
  if (L && L.awake && L.fleeAng != null && Math.hypot(L.x - e.x, L.y - e.y) < SHY.herdR) fa = L.fleeAng + (e.herdOff || (e.herdOff = (Math.random() - 0.5) * 0.5));   // a herd runs the way its watcher runs, so it stays a herd
  e.face = e.shy ? turnToward(e.face, fa, dt * 6) : fa;
  moveCircle(e, Math.cos(e.face) * fs2 * dt, Math.sin(e.face) * fs2 * dt);
}
function wanderStep(e, dt) {
  var w = e.wander;
  if (w.wait > 0) { w.wait -= dt; e.state = 'idle'; return; }
  if (w.tx == null) { var wkw = api.scene && api.scene.walk, tr; for (tr = 0; tr < 8; tr++) { var a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * w.r; w.tx = w.x0 + Math.cos(a) * r; w.ty = w.y0 + Math.sin(a) * r; if (!wkw || wkw(w.tx, w.ty, e)) break; } w.tt = 7; }   // a place it can stand (2026-10-12: half a troll's ground by the cave is cliff)
  w.tt -= dt;
  if (w.tt <= 0 || Math.hypot(w.tx - e.x, w.ty - e.y) < 6) { w.tx = null; w.wait = 1.5 + Math.random() * 4; e.state = 'idle'; return; }
  var ang = Math.atan2(w.ty - e.y, w.tx - e.x), sp = (e.cfg ? e.cfg.speed : 58) * 0.38, ox = e.x, oy = e.y;
  e.face = turnToward(e.face, ang, dt * 3);
  moveCircle(e, Math.cos(e.face) * sp * dt, Math.sin(e.face) * sp * dt);
  if (Math.hypot(e.x - ox, e.y - oy) < sp * dt * 0.25) { w.tx = null; w.wait = 1; }   // something is in the way: try elsewhere
  e.state = 'chase';
}
function updateEnemies(dt) {
  var NN = W.enemies.length, ORD = W.ord || (W.ord = []), oi, oj, ot; ORD.length = NN; for (oi = 0; oi < NN; oi++) ORD[oi] = oi;
  var nf = 0; for (oi = 0; oi < NN; oi++) { ot = W.enemies[oi]; if (ot.type === 'soldier' && !ot.dead && !ot.down && !ot.out && ot.tgt) nf++; } W.fighting = nf + (nf && !P.dead && !P.hidden ? 1 : 0);   // how many are in a fight (the din: noise carries further the more there are)
  tallyOn(dt);
  for (oi = NN - 1; oi > 0; oi--) { oj = Math.floor(Math.random() * (oi + 1)); ot = ORD[oi]; ORD[oi] = ORD[oj]; ORD[oj] = ot; }   // in a new order every frame: whoever is thought of first has an edge, and it must not always be the same men
  for (var i = 0; i < NN; i++) {
    var e = W.enemies[ORD[i]]; if (!e || e.away) continue;     // (away: taken out of the world by the page, aboard a ship: dropped from the list when this pass is over, never in the middle of it)
    if (e.dead) { e.deadT += dt; continue; }
    markTick(e, dt);
    e.flash = Math.max(0, e.flash - dt * 6); e.showBar = Math.max(0, e.showBar - dt);
    if (e.posture > 0 && e.state !== 'stunned') { e.postureT = (e.postureT || 0) + dt; if (e.postureT > POSTURE.hold) e.posture = Math.max(0, e.posture - POSTURE.decay * dt); }
    if (e.exposedT > 0) e.exposedT -= dt;
    if (e.down) { downTick(e, dt); continue; }
    if (e.hold) { e.state = 'idle'; e.kx = e.ky = 0; continue; }
    if ((e.aggro || e.strolls) && e.type !== 'soldier') {          // set by the Creature Editor: calm until the hero is within e.aggro, calm again once he is far away; e.strolls: calm with no ring of its own (the page wakes it: the troll outside at night, which notices you by its own rule and stood still with aggro 0, found 2026-10-12)
      var gd = Math.hypot(P.x - e.x, P.y - e.y), ga = Math.atan2(P.y - e.y, P.x - e.x);
      if (!e.aggro) { /* the page decides when it wakes */ }
      else if (!e.awake && gd < e.aggro * (api.mods && api.mods().stealth ? api.mods().stealth : 1) * (e.shy ? shyK(e, ga) : 1) && !P.dead) { e.awake = true; if (e.shy) { e.fleeT = 0; e.fled = 0; herdWake(e); } }   // the light step shortens the noticing; a shy beast's own sight (shyK)
      else if (e.awake && gd > (e.human ? 900 : e.shy ? e.aggro * 3.2 * (1 - SHY.run * woundOf(e)) : e.aggro * 2.6) && (e.state === 'chase' || e.state === 'idle')) { /* (a wounded shy beast stops sooner) */ e.awake = false; if (e.shy) { e.watchT = 6 + Math.random() * 4; if (e.wander) { e.wander.x0 = e.x; e.wander.y0 = e.y; e.wander.tx = null; e.wander.wait = e.watchT; } } }   // a guard gives up only when you are far gone; a shy beast grazes again where it stopped (watchT: it was kept in e.fled until 2026-10-14, and e.fled is what the list drops a man for who has run off, so a deer that stopped running vanished from the world)
      if (e.heard > 0) { e.heard -= dt; if (!P.dead) e.awake = true; }   // it heard something (mining): it comes
      if (e.shy && e.bleedT > 0) { bleedTick(e, dt); if (e.dead) continue; }
      if (e.shy && e.herd != null && !e.watch) { var LD = herdLead(e); if (LD) { if (e.awake && !LD.awake && Math.hypot(LD.x - e.x, LD.y - e.y) < SHY.herdR * 0.7) { e.awake = false; e.watchT = LD.watchT || 4; if (e.wander) { e.wander.x0 = e.x; e.wander.y0 = e.y; e.wander.tx = null; e.wander.wait = e.watchT; } } if (!e.awake && e.wander && (e.herdT = (e.herdT || 0) - dt) <= 0) { e.herdT = 2 + Math.random() * 2; e.wander.x0 = LD.wander ? LD.wander.x0 : LD.x; e.wander.y0 = LD.wander ? LD.wander.y0 : LD.y; } } }   /* the herd stops when its watcher stops, and grazes round where he grazes */
      if (e.flee) {                      // a grazer bolts instead of fighting
        if (e.awake && !P.dead) fleeStep(e, dt, ga, gd);
        else { e.state = 'idle'; if (e.shy && e.watchT > 0) { e.watchT -= dt; e.face = turnToward(e.face, ga, dt * 2); } }   /* (a shy one that has just run stands and watches you a while) */
        continue;
      }
      if (!e.awake) { if (e.wander && !P.dead) wanderStep(e, dt); else e.state = 'idle'; e.t += dt; continue; }
    }
    if (e.freezeT > 0) { e.freezeT -= dt; if (e.freezeT <= 0) { e.kx += e.pkx; e.ky += e.pky; e.pkx = e.pky = 0; } continue; }
    e.sq = Math.max(0, e.sq - dt * 4.5);
    var adt = e.rattle > 0 ? dt * 0.7 : dt;
    if (e.rattle > 0) { e.rattle = Math.max(0, e.rattle - dt); if (Math.random() < dt * 16) spark(e.x + (Math.random() - 0.5) * e.r * 2, e.y, 1, '#ffe27a', 36); }
    e.t += adt;
    var dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    e.kx *= Math.exp(-dt * 9); e.ky *= Math.exp(-dt * 9);
    if (e.type !== 'shooter' && Math.abs(e.kx) + Math.abs(e.ky) > 1) {
      moveCircle(e, e.kx * dt, e.ky * dt);
      if (S.juice && Math.abs(e.kx) + Math.abs(e.ky) > 70 && Math.random() < dt * 22) dust(e.x, e.y, 1);
    }
    if (e.type === 'soldier') { soldierAI(e, adt); continue; }
    if (P.dead) { if (e.state !== 'idle' && e.state !== 'recover') { e.state = 'idle'; } if (e.state === 'idle') continue; }
    if (e.type === 'brute') bruteAI(e, adt, d, ang); else if (e.type === 'shooter') shooterAI(e, adt, d, ang); else beastAI(e, adt, d, ang);
  }
  W.enemies = W.enemies.filter(function (e) { return !e.fled && !e.away && !(e.dead && e.deadT > (e.deadFor || 0.5)); });   // a sprite beast lies a moment longer (its death clip)
  // soft separation
  for (var a = 0; a < W.enemies.length; a++) for (var b = a + 1; b < W.enemies.length; b++) {
    var A = W.enemies[a], B = W.enemies[b]; if (A.dead || B.dead || A.down || B.down || A.out || B.out || A.type === 'shooter' || B.type === 'shooter') continue;   // (a man on his knees is in nobody's way: one knelt in a passage a man wide and nobody passed)
    var ox = B.x - A.x, oy = B.y - A.y, dd = Math.hypot(ox, oy), mn = A.r + B.r;
    if (dd < mn && dd > 0.01 && !wallBetween(A.x, A.y, B.x, B.y)) { var push = (mn - dd) * 0.5; moveCircle(A, -ox / dd * push, -oy / dd * push); moveCircle(B, ox / dd * push, oy / dd * push); }   // (not through a wall: a man hard against one side of it stopped a man walking along the other)
  }
}
function updateProjs(dt) {
  for (var i = W.projs.length - 1; i >= 0; i--) {
    var pr = W.projs[i];
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
    var SB = api.scene && api.scene.bounds, hit = false;   // a page with a big world has its own edges
    var gone = pr.life <= 0 || (SB ? (pr.x < SB.x0 || pr.x > SB.x1 || pr.y < SB.y0 || pr.y > SB.y1) : (pr.x < 8 || pr.x > AW - 8 || pr.y < 30 || pr.y > AH - 6));
    if (!gone && (pillarHit(pr.x, pr.y, pr.r) || wallBetween(pr.x - pr.vx * dt, pr.y - pr.vy * dt, pr.x, pr.y))) { gone = true; spark(pr.x, pr.y, 4, '#ffe9a0', 60); }
    if (!gone) {
      if (pr.owner === 'man') {              // a bowman's arrow: the other side only (his own it passes), the hero's shield stops it
        if (pr.side === 0 && !P.dead && !P.hidden && Math.hypot(pr.x - P.x, pr.y - P.y) < pr.r + P.r) { if (api.arrowStop && api.arrowStop(pr, P)) { gone = true; spark(pr.x, pr.y, 5, '#ffe9a0', 70); if (api.sfx) api.sfx('block', 0.6); } else if (hurtPlayer(pr.dmg, pr.x - pr.vx * 0.05, pr.y - pr.vy * 0.05, 'proj', pr.src)) { gone = true; hit = true; } }   /* (arrowStop: the page says something stops it first, a Raider's shields on the rail) */
        if (!gone) for (var jm = 0; jm < W.enemies.length; jm++) {
          var em = W.enemies[jm]; if (em.type !== 'soldier' || em.dead || em.down || em.out || (em.side || 0) === pr.side) continue;
          if (Math.hypot(pr.x - em.x, pr.y - em.y) < pr.r + em.r) { damageEnemy(em, pr.dmg * MEN.bow.toMen * MEN.hpK, Math.atan2(pr.vy, pr.vx), 30, 8, 'proj', pr.src); gone = true; hit = true; break; }
        }
      } else if (pr.owner === 'enemy') {
        if (Math.hypot(pr.x - P.x, pr.y - P.y) < pr.r + P.r && api.arrowStop && api.arrowStop(pr, P)) { gone = true; spark(pr.x, pr.y, 5, '#ffe9a0', 70); }
        else if (Math.hypot(pr.x - P.x, pr.y - P.y) < pr.r + P.r) {
          var res = hurtPlayer(pr.dmg, pr.x - pr.vx * 0.05, pr.y - pr.vy * 0.05, 'proj', pr);
          if (res === 'parry') { pr.owner = 'player'; pr.vx *= -1.4; pr.vy *= -1.4; pr.dmg = 3; pr.life = 3; pr.ang += Math.PI; pr.reflected = true; }
          else if (res) gone = true;
        }
      } else {
        for (var j = 0; j < W.enemies.length; j++) {
          var e = W.enemies[j];
          if (e.dead || e.side === 1 || e.down) continue;
          if (Math.hypot(pr.x - e.x, pr.y - e.y) < pr.r + e.r) { hitFlags.still = pr.still || 1; if (pr.noShield) hitFlags.guardBreak = true; damageEnemy(e, pr.dmg, Math.atan2(pr.vy, pr.vx), pr.kb || 40, pr.stag || 8, (pr.stag || 8) >= 20 ? 'heavy' : 'proj'); hitFlags.still = 1; hitFlags.guardBreak = false; if (pr.pin && !e.dead) { e.freezeT = Math.max(e.freezeT, pr.pinT || 1.6); e.pkx = e.pky = 0; if (pr.pinNoGuard) { e.guard = 0; e.guardCd = pr.pinT || 1.6; } num(e.x, e.y - 12, 'PINNED', '#9fd8ff'); } if (pr.fire && !e.dead && e.type === 'soldier') { markOn(e, 'burning', runeN('fireArrow', 'burnT') || 5); e.burnDmg = 1.2 * dmgMul('bow'); e.burnSpread = runeN('fireArrow', 'spread'); } gone = true; hit = true; break; }
        }
        if (!gone && api.struck) { var OT2 = api.struck.list(pr), oj2; for (oj2 = 0; oj2 < OT2.length; oj2++) { var o3 = OT2[oj2]; if (Math.hypot(pr.x - o3.x, pr.y - o3.y) < pr.r + (o3.r || 6)) { api.struck.hit(o3, pr.dmg, Math.atan2(pr.vy, pr.vx), 'proj'); gone = true; hit = true; break; } } }   // (an arrow, too)
      }
    }
    if (gone) { W.projs.splice(i, 1); if (pr.thing && api.onThrowLand) api.onThrowLand(pr.x, pr.y, pr.thing); else if (!hit && pr.owner === 'player' && !pr.reflected && pr.kind !== 'stone' && api.onArrowLand) api.onArrowLand(pr.x, pr.y, !!pr.fire); if (pr.fire && api.onFireArrow) api.onFireArrow(pr.x, pr.y, pr.ang, hit); }
    else if (pr.kind === 'throwaxe') pr.spin += dt * 22;
  }
}
function updateFx(dt) {
  var i;
  for (i = W.parts.length - 1; i >= 0; i--) {
    var q = W.parts[i];
    q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
    if (q.k === 'streak') { q.vx *= 0.9; q.vy *= 0.9; } else if (q.k !== 'dust') q.vz -= 260 * dt; else q.vz *= 0.9;
    if (q.z < 0) { q.z = 0; q.vz *= -0.3; q.vx *= 0.6; q.vy *= 0.6; }
    if (q.life <= 0) W.parts.splice(i, 1);
  }
  for (i = W.ghosts.length - 1; i >= 0; i--) { W.ghosts[i].life -= dt; if (W.ghosts[i].life <= 0) W.ghosts.splice(i, 1); }
  for (i = W.nums.length - 1; i >= 0; i--) { W.nums[i].t += dt; if (W.nums[i].t > 0.9) W.nums.splice(i, 1); }
  for (i = W.rings.length - 1; i >= 0; i--) { W.rings[i].life -= dt; if (W.rings[i].life <= 0) W.rings.splice(i, 1); }
}

function update(dt) {
  dt = Math.min(dt, 0.05);
  if (W.heading == null) W.heading = P.face; if (Math.hypot(P.vx, P.vy) > 30 && P.atk.ph === 'none') W.heading = turnToward(W.heading, Math.atan2(P.vy, P.vx), dt * 2.5);
  if (IN.pressed.KeyR && P.dead) { reset(); }
  if (IN.pressed.KeyH && !P.dead && W.enemies.length < 14) spawn('beast');
  if (W.slow.t > 0) { W.slow.t -= dt; dt *= W.slow.s; }
  W.t += dt;
  updatePlayer(dt); updateEnemies(dt); collideBodies(); updateProjs(dt); updateFx(dt);
  IN.pressed = {};
}

/* =====================================================
   RENDER
   ===================================================== */
var groundCv = null, scratch = null;
function R(c) { return lib; }
function buildGround() {
  var cv = lib.mk(SW * 2, SH * 2), c = cv.getContext('2d'), i;
  c.setTransform(2, 0, 0, 2, 0, 0);
  c.fillStyle = '#8fd66d'; c.fillRect(0, 0, SW, SH);
  var r = lib.rng(12);
  for (i = 0; i < 26; i++) {
    c.fillStyle = r() < 0.5 ? 'rgba(200,245,140,0.25)' : 'rgba(60,150,70,0.18)';
    c.beginPath(); c.ellipse(r() * SW, r() * SH, 16 + r() * 28, 8 + r() * 12, 0, 0, Math.PI * 2); c.fill();
  }
  // cobble arena
  var cx = 200, cy = 128, rx = 158, ry = 118;
  c.beginPath(); c.ellipse(cx, cy + 3, rx + 4, ry + 4, 0, 0, Math.PI * 2); c.fillStyle = 'rgba(40,70,50,0.25)'; c.fill();
  c.beginPath(); c.ellipse(cx, cy, rx + 3, ry + 3, 0, 0, Math.PI * 2); c.fillStyle = '#9c8662'; c.fill();
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = '#d6c49c'; c.fill();
  for (i = 0; i < 260; i++) {
    var a = r() * Math.PI * 2, d = Math.sqrt(r()), sx = cx + Math.cos(a) * (rx - 6) * d, sy = cy + Math.sin(a) * (ry - 5) * d;
    lib.ell(c, sx, sy, 5 + r() * 3, 3.2 + r() * 1.4, r() < 0.5 ? '#cdb98f' : '#dccaa4', 1, '#a08a64');
  }
  c.strokeStyle = 'rgba(90,70,50,0.5)'; c.lineWidth = 1;
  c.beginPath(); c.ellipse(cx, cy, rx - 1, ry - 1, 0, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = '#4f9d3c'; c.lineWidth = 1.3; c.lineCap = 'round';
  for (i = 0; i < 90; i++) {
    var tx = r() * SW, ty = r() * SH;
    var ex = (tx - cx) / (rx + 6), ey = (ty - cy) / (ry + 6);
    if (ex * ex + ey * ey < 1) continue;
    c.beginPath(); c.moveTo(tx - 2.5, ty); c.quadraticCurveTo(tx - 3, ty - 3, tx - 4, ty - 4.5);
    c.moveTo(tx, ty); c.quadraticCurveTo(tx, ty - 4, tx, ty - 6);
    c.moveTo(tx + 2.5, ty); c.quadraticCurveTo(tx + 3, ty - 3, tx + 4, ty - 4.2); c.stroke();
  }
  groundCv = cv;
}
function sxy(x, y, z) { return [x, y * K - (z || 0)]; }
function gEll(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y * K, rx, ry * K, 0, 0, Math.PI * 2); }

function flashDraw(c, x, y, drawFn, amt, rgb) {
  if (amt <= 0.03) { c.save(); c.translate(x, y); drawFn(c); c.restore(); return; }
  if (!scratch) scratch = lib.mk(300, 300);
  var s = scratch.getContext('2d');
  s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, 300, 300);
  s.setTransform(2, 0, 0, 2, 0, 0); s.translate(75, 120); s.lineJoin = 'round'; s.lineCap = 'round';
  drawFn(s);
  s.globalCompositeOperation = 'source-atop'; s.setTransform(1, 0, 0, 1, 0, 0);
  s.fillStyle = 'rgba(' + (rgb || '255,255,255') + ',' + Math.min(1, amt * 0.9) + ')'; s.fillRect(0, 0, 300, 300);
  s.globalCompositeOperation = 'source-over';
  c.drawImage(scratch, x - 75, y - 120, 150, 150);
}

// The undressed enemy (the tests, and a page without api.dress): a plain beast in ink, a body on four legs with its head
// toward the hero; a brute bigger and darker, a shooter squat and grey with its aim shown. Pages dress enemies as animals.
function drawPlain(c, e) {
  var t = W.t, sz = e.size || 1, brute = e.type === 'brute', sh = e.type === 'shooter', k = e.state === 'windup' ? e.t / e.dur : 0, sqx = 1, sqy = 1, jx = 0, i;
  if (e.state === 'windup') { sqx = 1 + 0.18 * k; sqy = 1 - 0.18 * k; jx = Math.sin(e.t * 70) * 0.8; }
  else if (e.state === 'lunge') { sqx = 0.85; sqy = 1.2; }
  else if (e.state === 'stagger') { sqx = 1.15; sqy = 0.85; }
  var ang = sh ? e.aim : e.face, fwd = Math.cos(ang) >= 0 ? 1 : -1, moving = e.state === 'chase' || e.state === 'lunge', step = moving ? Math.sin(t * 9 + e.seed) : 0;
  var down = e.state === 'recover' || e.state === 'stunned', body = down ? '#a89a86' : (brute ? '#6e5a48' : (sh ? '#7a7466' : '#8a6a4e')), line = '#231a16';
  var rx = (brute ? 11 : 8) * (sh ? 1.1 : 1), ry = (brute ? 7 : 5) * (sh ? 0.8 : 1), by = -ry - 4;
  c.save(); c.translate(jx, 0); c.scale(sqx * sz * fwd, sqy * sz);
  c.strokeStyle = line; c.lineWidth = 2.4; c.lineCap = 'round';
  for (i = 0; i < 4; i++) { var lx = -rx * 0.6 + (i % 2) * rx * 1.2, ly = step * (i < 2 ? 2 : -2); c.beginPath(); c.moveTo(lx, by + ry * 0.6); c.lineTo(lx + ly, 0); c.stroke(); }
  lib.ell(c, 0, by, rx, ry, body, 1.6);
  lib.ell(c, rx * 0.95, by - ry * 0.5, ry * 0.75, ry * 0.7, body, 1.6);
  lib.ell(c, rx * 1.25, by - ry * 0.6, 1.1, 1.1, k > 0 ? '#e8603a' : line, 0);
  if (sh && e.state === 'windup') { c.strokeStyle = 'rgba(255,120,80,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(rx, by - ry * 0.5); c.lineTo(rx + 10 + k * 6, by - ry * 0.5); c.stroke(); }
  c.restore();
  if (e.state === 'stunned') for (i = 0; i < 3; i++) { var a2 = t * 5 + i * 2.09; lib.ell(c, Math.cos(a2) * 8, by * sz - 10 + Math.sin(a2) * 2.5, 1.5, 1.5, '#ffd34d', 0.9); }
  if (e.state === 'windup' && !sh) { lib.ell(c, 0, by * sz - 14, 4.4, 4.4, '#ffd34d', 1.5); c.fillStyle = line; c.font = 'bold 7px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('!', 0, by * sz - 11.4); }
}

function drawTelegraphs(c) {
  var i, e;
  for (i = 0; i < W.enemies.length; i++) {
    e = W.enemies[i]; if (e.dead) continue;
    if (e.type === 'brute' && e.state === 'windup') {
      var kk = e.t / e.dur;
      if (e.attack === 'spin') {
        gEll(c, e.x, e.y, 46, 46); c.fillStyle = 'rgba(255,70,60,0.14)'; c.fill(); c.strokeStyle = 'rgba(255,70,60,0.6)'; c.lineWidth = 1.5; c.stroke();
        gEll(c, e.x, e.y, 46 * kk, 46 * kk); c.fillStyle = 'rgba(255,70,60,0.3)'; c.fill();
      } else {
        c.strokeStyle = 'rgba(255,70,60,' + (0.22 + 0.4 * kk) + ')'; c.lineWidth = 7; c.lineCap = 'round';
        c.beginPath(); c.moveTo(e.x, e.y * K); c.lineTo(e.x + Math.cos(e.dirLock) * 78, (e.y + Math.sin(e.dirLock) * 78) * K); c.stroke();
      }
    }
    /* (2026-10-14, Robin: the red line that marked a coming blow was not natural; gone, for beasts and men. The tell is the
       body now: the drawn-back clip, a glint of the weapon and dust at the feet as the windup begins (in beastAI and soldierAI),
       and the Combat Arena's "Show the blows" overlay keeps the geometry for tuning.) */
    if (e.type === 'shooter' && e.state === 'windup') {
      c.strokeStyle = 'rgba(255,70,60,0.55)'; c.lineWidth = 1.6; c.setLineDash([4, 3]); c.lineDashOffset = -e.t * 30;
      c.beginPath(); c.moveTo(e.x, e.y * K); c.lineTo(e.x + Math.cos(e.dirLock) * 300, (e.y + Math.sin(e.dirLock) * 300) * K); c.stroke(); c.setLineDash([]);
    }
  }
  if (lockValid()) {
    var L = W.lock;
    c.strokeStyle = '#ffd34d'; c.lineWidth = 1.8; c.setLineDash([4, 3]); c.lineDashOffset = -W.t * 14;
    gEll(c, L.x, L.y, L.r + 5, L.r + 5); c.stroke(); c.setLineDash([]);
  }
}
// The swing is drawn at its true angle in every direction (it used to be narrowed when facing up or down,
// which made it look like a stab).
function visAngle(ang, dir) { return ang; }
// The hero's settings, and how far long legs raise his body.
function lookSpec() { return lib.hero().spec; }
function heroLift() { return lib.hero().lift; }
function guardSide() { return Math.cos(P.face) >= 0 ? 1 : -1; }
function bodyPose() {
  var p = P, a = p.atk, lx = 0, ly = 0, cr = 0;
  if (a.ph === 'charge') {
    var amt0 = -3.4 * Math.min(1, a.t / 0.3), jit = a.t >= 1 ? Math.sin(W.t * 70) * 0.5 : 0;
    lx = Math.cos(p.face) * amt0 + jit; ly = Math.sin(p.face) * K * amt0 * 0.7; cr = 1.2 * Math.min(1, a.t / 0.3);
  } else if (a.ph !== 'none') {
    var sd = stepData(a), amt, big = a.combo === 3 ? 1.7 : (heavyHit(a) ? 1.4 : 1);
    if (a.ph === 'windup') amt = -2.6 * big * Math.min(1, a.t / sd.wu);
    else if (a.ph === 'active') amt = (-2.6 + 6.2 * Math.min(1, a.t / sd.ac)) * big;
    else amt = 3.6 * big * Math.max(0, 1 - a.t / sd.rec);
    amt *= lib.hero().spec.lean;
    lx = Math.cos(a.dir) * amt; ly = Math.sin(a.dir) * K * amt * 0.7;
  }
  if (p.guard) { lx += Math.cos(p.face) * 1.6; cr = 1.4; }
  lx += p.anim.lx; ly += p.anim.ly + p.anim.bob;
  if (p.fireT > 0) { var f = p.fireT / 0.2; lx -= Math.cos(p.fireAng) * 1.8 * f; ly -= Math.sin(p.fireAng) * K * 1.4 * f; }
  return { lx: lx, ly: ly + cr - heroLift() };
}
function swordPose(dir) {
  var p = P, a = p.atk, o = {};
  if (a.ph === 'charge') {
    var ang2 = p.face + 2.3;
    o.hx = Math.cos(ang2) * 9; o.hy = -13 + Math.sin(ang2) * 9 * K; o.ca = Math.cos(ang2); o.sa = Math.sin(ang2) * K;
    o.len = 26; o.front = Math.sin(ang2) >= -0.05; o.side = Math.cos(ang2) >= 0 ? 1 : -1; o.armSide = o.side; o.atk = true;
  } else if (a.ph !== 'none') {
    if (p.mode === 'gather') return chopPose(dir, a);
    var sd = stepData(a), half = sd.arc / 2, sign = (a.combo % 2 === 0) ? 1 : -1, u;
    if (sd.motion === 'thrust') return thrustPose(dir, a, sd);
    if (sd.motion === 'smash') return chopPose(dir, a, sd);
    var pb = 0.45;
    if (a.ph === 'windup') u = -pb * (a.t / sd.wu); else if (a.ph === 'active') u = Math.min(1, a.t / sd.ac); else u = 1;
    var ang = visAngle(a.dir - half * sign + sd.arc * sign * u, dir);
    var upv = Math.max(0, -Math.sin(ang)), sdn = Math.cos(a.dir) >= 0 ? 1 : -1, sb = Math.cos(ang) >= 0 ? 1 : -1;
    o.len = sd.blade;
    if (dir === 'left' || dir === 'right') {                            // seen from the side a swing reads as an overhead cut (2026-10-07)
      var us; if (a.ph === 'windup') us = -(a.t / sd.wu); else if (a.ph === 'active') us = Math.min(1, a.t / sd.ac); else us = 1 + Math.min(1, a.t / sd.rec);
      arcSwing(o, us, dir, a, sdn, sd.blade, sd.hands === 2, false); o.len *= lib.hero().spec.bladeLen; return o;
    }
    if (dir === 'up' || dir === 'down') {
    // a wide side-to-side swing: the hand sweeps across in front of the body, or over the head when facing away
    var startAng = a.dir - half * sign, armSide = Math.cos(startAng) >= 0 ? 1 : -1;
    o.hx = armSide * 2.5 + Math.cos(ang) * 8; o.hy = -14 + Math.sin(ang) * 8 * K - 4 * upv; o.armSide = armSide; o.lift = upv;
  } else {
      o.hx = Math.cos(ang) * 10.5 + sdn * 8 * upv * upv; o.hy = -16 + Math.sin(ang) * 10.5 * K - 5 * upv;
    }
    o.ca = Math.cos(ang); o.sa = Math.sin(ang) * (K + (1 - K) * (o.lift || 0));
    if (o.tilt) { var nn = Math.hypot(o.ca, o.sa); o.ca /= nn; o.sa /= nn; }
    o.front = Math.sin(ang) >= -0.05; o.side = sdn; o.atk = true;
  } else {
    var side = (p.guard && shielded()) ? -guardSide() : 1;
    // at rest the thing hangs down at the side from a straight arm, the way you carry an axe when you walk
    // carried: the hand at the hip and the thing pointing up past the shoulder, resting on it, so it stays short and clear
    // at the side with the arm hanging, the thing pointing forward and down, the way a sword or an axe is carried (Robin, 2026-10-07)
    if (dir === 'left') { o.hx = -1.6; o.hy = -3; o.ca = -0.72; o.sa = 0.69; }
    else if (dir === 'right') { o.hx = 1.6; o.hy = -3; o.ca = 0.72; o.sa = 0.69; }
    else { o.hx = side * 7.2; o.hy = -3; o.ca = side * 0.42; o.sa = 0.9; }
    o.len = 13; o.front = dir !== 'up'; o.side = side; o.atk = false;
  }
  if (o.atk) o.len *= lib.hero().spec.bladeLen;
  return o;
}
// Gathering: the axe and pickaxe go up over the shoulder in the windup and come down onto the target; the knife
// is a short stab forward. Returns the same shape as swordPose.
// A thrust: the hand pulls back to the chest in the windup and drives straight out along the aim, the thing pointing the way
function thrustPose(dir, a, sd) {
  var o = {}, u, dx = Math.cos(a.dir), dy = Math.sin(a.dir) * K;
  if (a.ph === 'windup') u = -(a.t / sd.wu); else if (a.ph === 'active') u = Math.min(1, a.t / sd.ac); else u = 1 - Math.min(1, a.t / sd.rec) * 0.6;
  var reach = u < 0 ? -3 * -u : 3 + 11 * Math.sin(Math.min(1, u) * Math.PI * 0.5);
  o.hx = dx * (5 + reach); o.hy = -13 + dy * (5 + reach) * 0.7; o.ca = dx; o.sa = dy; o.len = sd.blade;
  o.front = Math.sin(a.dir) >= -0.05; o.side = dx >= 0 ? 1 : -1; o.armSide = o.side; o.atk = true;
  return o;
}
function chopPose(dir, a, smash) {
  // The chop (reworked 2026-10-07, Robin: it clipped and looked unnatural): the hand rides a circle round the shoulder, from
  // up behind the head in the windup, over the top and down in front to the target, and the haft continues the arm, lagging
  // back in the windup so the axe head hangs behind the shoulder. Both hands are on the haft (hand2). The knife is a short stab.
  var p = P, sd = stepData(a), o = {}, u, sdn = Math.cos(a.dir) >= 0 ? 1 : -1, knife = !smash && TOOLS[p.tool].id === 'knife', side = dir === 'left' || dir === 'right';
  if (a.ph === 'windup') u = -(a.t / sd.wu); else if (a.ph === 'active') u = Math.min(1, a.t / sd.ac); else u = 1 + Math.min(1, a.t / sd.rec);   // -1..0 the windup, 0..1 the stroke, 1..2 the recovery
  var dx = Math.cos(a.dir), dy = Math.sin(a.dir) * K;
  if (knife) {
    var raise = u < 0 ? -u : 1, reach = u < 0 ? -2 * raise : (u <= 1 ? 9 * Math.sin(u * Math.PI) : 0);
    o.hx = dx * (6 + reach); o.hy = -13 + dy * (6 + reach) * 0.6; o.ca = dx; o.sa = dy; o.len = 10;
    o.front = u < 0 || u < 0.3 || Math.sin(a.dir) >= -0.05; o.side = sdn; o.armSide = sdn; o.atk = true;
    return o;
  }
  arcSwing(o, u, dir, a, sdn, smash ? smash.blade : 15, true, false);
  return o;
}
// The overhead arc: the hand rides a circle round the shoulder, up behind the head in the windup, over the top and down in
// front to the target; the haft continues the arm, lagging back in the windup; then back to the carry. rising: the arc the
// other way (a rising cut). twoHanded: the other hand further up the haft (hand2).
function arcSwing(o, u, dir, a, sdn, len, twoHanded, rising) {
  var side = dir === 'left' || dir === 'right', A0 = 1.35, AUP = -2.1, AEND = 1.0, ang, lag, e, R = 10.5;
  if (rising) { var tmp = AUP; AUP = AEND + 0.25; AEND = tmp + 0.3; }
  if (u < 0) { e = 1 - (1 + u) * (1 + u); ang = A0 + (AUP - A0) * e; lag = -1.1 * e * (rising ? -0.5 : 1); }                       // the windup eases up and back
  else if (u <= 1) { e = u * u * (3 - 2 * u); ang = AUP + (AEND - AUP) * Math.min(1, u * 1.25); lag = -1.1 * (1 - e) * (1 - e) * (rising ? -0.5 : 1); }   // the stroke, fast
  else { e = u - 1; var ee = e * e * (3 - 2 * e); ang = AEND + (A0 - AEND) * ee; lag = 0.25 * (1 - ee); }                  // back to the carry
  var ta = ang + lag;
  if (side) { o.hx = sdn * Math.cos(ang) * R; o.hy = -17 + Math.sin(ang) * R; o.ca = sdn * Math.cos(ta); o.sa = Math.sin(ta); }
  else {                                                                // facing the camera or away: the arc shows as over the head and down in front
    var up = Math.sin(a.dir) < -0.05;
    o.hx = sdn * (4 + 3 * Math.max(0, Math.cos(ang))); o.hy = -17 + Math.sin(ang) * R * 1.25;
    o.ca = sdn * 0.3 * Math.cos(ta); o.sa = (up ? -1 : 1) * Math.sin(ta);
  }
  o.len = len; if (twoHanded) o.hand2 = [o.hx + o.ca * len * 0.38, o.hy + o.sa * len * 0.38];
  o.front = Math.sin(a.dir) >= -0.05 || u < 0; o.side = sdn; o.armSide = sdn; o.atk = true;
}
function shieldBehind() { return Math.sin(P.face) < -0.05; }
function shieldPose() {
  if (shieldBehind()) { var bx = Math.cos(P.face) * 9; if (Math.abs(bx) < 2.5) bx = guardSide() * 2.5; return [bx, -16]; }
  return [Math.cos(P.face) * 9, -15 + Math.sin(P.face) * 3];
}
function heroPose(dir) {
  var p = P, a = p.atk, bp = bodyPose(), sp = swordPose(dir), pose = { lx: bp.lx, ly: bp.ly + heroLift() };
  var side = (dir === 'left' || dir === 'right');
  var drawn = a.ph !== 'none';
  var carried = !drawn && !!itemOf('held');          // a thing carried at rest: the arm hangs to its grip
  pose.sheath = !drawn && !api.items;
  var swordHand = [sp.hx + bp.lx, sp.hy + bp.ly];
  if (p.fireT > 0) swordHand = [Math.cos(p.fireAng) * 10 + bp.lx, -13 + Math.sin(p.fireAng) * 10 * K + bp.ly];
  if (p.guard && !shielded()) {
    if (side) { pose.near = [Math.cos(p.face) * 5 + bp.lx, -13 + bp.ly]; pose.far = [Math.cos(p.face) * 6 + bp.lx, -14 + bp.ly]; }
    else { pose.armL = [-2.5 + bp.lx, -13 + bp.ly]; pose.armR = [2.5 + bp.lx, -13 + bp.ly]; }
  } else {
    var sh = shieldPose(), shieldHand = [sh[0] + bp.lx, sh[1] + bp.ly];
    if (shieldBehind() && !side) shieldHand = [guardSide() * 9 + bp.lx, -16 + bp.ly];
    var useSword = drawn || p.fireT > 0 || carried, hand2 = sp.hand2 ? [sp.hand2[0] + bp.lx, sp.hand2[1] + bp.ly] : null;   // the other hand on the haft of a two-handed thing
    if (side) {
      if (useSword) pose.near = swordHand; if (hand2 && !p.guard) pose.far = hand2;
      if (p.guard) { if (useSword) pose.far = shieldHand; else pose.near = shieldHand; }
    } else {
      var ss = useSword ? (((dir === 'up' || dir === 'down') && drawn && sp.armSide) ? sp.armSide : sp.side) : -guardSide();
      if (useSword) pose[ss < 0 ? 'armL' : 'armR'] = swordHand; if (hand2 && !p.guard) pose[ss < 0 ? 'armR' : 'armL'] = hand2;
      if (p.guard) pose[guardSide() < 0 ? 'armL' : 'armR'] = shieldHand;
    }
  }
  return pose;
}
// Attack styles (spec key atkStyle). All of it is visual: the hitbox and timing do not change.
// pull: step back in the wind-up (px), lunge: step into the swing (px), sq: squash and stretch amount,
// hop: jump height (px), spin: the body and blade turn a full circle.
var ATK_STYLES = [
  { pull: 0, lunge: 0, sq: 0, hop: 0, spin: 0 },
  { pull: 2, lunge: 5, sq: 0.1, hop: 0, spin: 0 },
  { pull: 4, lunge: 10, sq: 0.18, hop: 0, spin: 0 },
  { pull: 1, lunge: 3, sq: 0.22, hop: 6, spin: 0 },
  { pull: 2, lunge: 4, sq: 0.1, hop: 2, spin: 1 }
];
function atkBody() {
  var o = { x: 0, y: 0, hop: 0, sx: 1, sy: 1, spin: -1 }, a = P.atk;
  if (a.ph === 'none') return o;
  var sp = lookSpec(), st = ATK_STYLES[Math.round(sp.atkStyle)] || ATK_STYLES[0];
  if (st.spin) st = { pull: st.pull, lunge: st.lunge, sq: st.sq, hop: st.hop, spin: 0 };   // the spin was the pixel sprite's; gone
  if (P.mode === 'gather') st = { pull: 1, lunge: 1.5, sq: 0.12, hop: 0, spin: 0 };   // a chop: a small lean, no lunge or spin
  var pw = sp.atkPower * (heavyHit(a) ? 1.5 : 1), off = 0, sq = 0, hop = 0, dir = a.ph === 'charge' ? P.face : a.dir, u;
  if (a.ph === 'charge') { u = Math.min(1, a.t / 0.3); off = -st.pull * u; sq = -st.sq * 0.8 * u; }
  else {
    var sd = stepData(a);
    if (a.ph === 'windup') { u = Math.min(1, a.t / sd.wu); off = -st.pull * u; sq = -st.sq * u; hop = st.hop * u; if (st.spin) o.spin = 0; }
    else if (a.ph === 'active') { u = Math.min(1, a.t / sd.ac); var e = 1 - (1 - u) * (1 - u); off = -st.pull + (st.pull + st.lunge) * e; sq = st.sq * (1 - u * 0.5); hop = st.hop * (1 - e); if (st.spin) o.spin = u * 0.75; }
    else { u = Math.min(1, a.t / sd.rec); var v = u < 0.4 ? 0 : (u - 0.4) / 0.6; off = st.lunge * (1 - v * v); sq = -st.sq * 0.9 * Math.max(0, 1 - u / 0.5); if (st.spin) o.spin = Math.min(1, 0.75 + 0.25 * u / 0.4); }
  }
  o.x = Math.cos(dir) * off * pw * sp.scale; o.y = Math.sin(dir) * K * off * pw * sp.scale; o.hop = hop * pw * sp.scale;
  sq *= Math.min(1.6, pw);
  if (sq < 0 || Math.abs(Math.sin(dir)) * K > Math.abs(Math.cos(dir))) { o.sy = 1 + sq; o.sx = 1 - sq * 0.5; }
  else { o.sx = 1 + sq; o.sy = 1 - sq * 0.5; }
  return o;
}
function drawHeroWeapon(c, front) {
  var p = P, a = p.atk, dir = heroDir(), bp = bodyPose(), sp = swordPose(dir);
  var hideSword = (p.guard && !shielded()) || (a.ph === 'none' && !itemOf('held')), HH = lib.hero(), HC = HH.pal;
  var hx = p.x + sp.hx + bp.lx, hy = p.y * K + sp.hy + bp.ly;
  if (a.ph === 'charge' && !front) {
    var c01 = Math.min(1, a.t), full = a.t >= 1, pulse = full ? 0.5 + 0.5 * Math.sin(W.t * 24) : 0;
    c.strokeStyle = full ? 'rgba(255,214,90,' + (0.6 + 0.4 * pulse) + ')' : 'rgba(255,255,255,' + (0.25 + 0.4 * c01) + ')'; c.lineWidth = 1.6 + c01;
    c.beginPath(); c.ellipse(p.x, p.y * K, 8 + c01 * 14 + pulse * 2, (8 + c01 * 14 + pulse * 2) * K, 0, 0, Math.PI * 2); c.stroke();
    bar(c, p.x - 12, p.y * K + 7, 24, 3, c01, full ? '#ffd34d' : '#ffffff', '#5b4a58');
  }
  if (!hideSword && sp.front === front) {
    var ca = sp.ca, sa = sp.sa, len = sp.len, ex = hx + ca * len, ey = hy + sa * len, px = -sa, py = ca;
    c.lineCap = 'round';
    var heldIt = itemOf('held');
    var rest = a.ph === 'none', restLen = heldIt && rest ? Math.min(Items.KINDS[heldIt.kind].len * heldIt.size, heldIt.kind === 'axe' || heldIt.kind === 'pick' ? 12 : 15) : null;   // carried, a thing hangs short beside the leg
    if (heldIt) { if (rest) { c.save(); c.translate(hx, hy); c.scale(0.85, 0.85); c.translate(-hx, -hy); } Items.draw(c, heldIt, hx, hy, ca, sa, rest ? restLen : ((Items.KINDS[heldIt.kind].melee && p.mode === 'fight') ? len * heldIt.size : null), p.mode === 'gather' && a.ph !== 'none'); if (rest) c.restore(); if (front) lib.ell(c, hx, hy, 2.6, 2.6, HC.skin, 1.5); }
    else if (p.mode === 'gather') { if (!api.items) drawToolShape(c, hx, hy, ca, sa, len, TOOLS[p.tool].id); if (front) lib.ell(c, hx, hy, 2.6, 2.6, HC.skin, 1.5); }
    else if (api.items) { if (!rest) { var fx2 = hx + ca * 4, fy2 = hy + sa * 4; c.strokeStyle = '#3a2a36'; c.lineWidth = 6; c.beginPath(); c.moveTo(hx, hy); c.lineTo(fx2, fy2); c.stroke(); c.strokeStyle = HC.coat; c.lineWidth = 3.6; c.stroke(); lib.ell(c, fx2, fy2, 3.4, 3.2, HC.skin, 1.5); } }   // no sword: a fist (at rest the figure's own hands hang)
    else {
    c.strokeStyle = '#3a2a36'; c.lineWidth = 5.4; c.beginPath(); c.moveTo(hx + ca * 3, hy + sa * 3); c.lineTo(ex, ey); c.stroke();
    c.strokeStyle = HC.blade; c.lineWidth = 3; c.beginPath(); c.moveTo(hx + ca * 3, hy + sa * 3); c.lineTo(ex, ey); c.stroke();
    c.strokeStyle = 'rgba(120,130,160,0.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(hx + ca * 4, hy + sa * 4 + 0.6); c.lineTo(ex - ca * 2, ey - sa * 2 + 0.6); c.stroke();
    c.strokeStyle = '#3a2a36'; c.lineWidth = 6.4; c.beginPath(); c.moveTo(hx - ca * 3, hy - sa * 3); c.lineTo(hx + ca * 2, hy + sa * 2); c.stroke();
    c.strokeStyle = HC.trim; c.lineWidth = 4.2; c.beginPath(); c.moveTo(hx - ca * 3, hy - sa * 3); c.lineTo(hx + ca * 2, hy + sa * 2); c.stroke();
    var gx = hx + ca * 3, gy = hy + sa * 3;
    c.strokeStyle = '#3a2a36'; c.lineWidth = 5.4; c.beginPath(); c.moveTo(gx - px * 3.4, gy - py * 3.4); c.lineTo(gx + px * 3.4, gy + py * 3.4); c.stroke();
    c.strokeStyle = HC.trimL; c.lineWidth = 3; c.beginPath(); c.moveTo(gx - px * 3.4, gy - py * 3.4); c.lineTo(gx + px * 3.4, gy + py * 3.4); c.stroke();
    if (a.ph === 'charge' && a.t >= 0.33) { c.fillStyle = 'rgba(255,224,110,' + (0.35 + 0.25 * Math.sin(W.t * 20)) + ')'; c.beginPath(); c.arc(ex, ey, 4 + a.t * 3, 0, Math.PI * 2); c.fill(); }
    if (front) lib.ell(c, hx, hy, 2.6, 2.6, HC.skin, 1.5);
    }
  }
  if (p.fireT > 0) {
    var fa = p.fireAng, fca = Math.cos(fa), fsa = Math.sin(fa) * K;
    if ((Math.sin(fa) >= -0.05) === front) {
      var fx = p.x + fca * 10 + bp.lx, fy = p.y * K - 13 + fsa * 10 + bp.ly;
      var bowIt = itemOf('weapon', 'bow');
      if (bowIt) Items.draw(c, bowIt, fx + fca * 3, fy + fsa * 3, fca, fsa, null); else drawBowShape(c, fx + fca * 3, fy + fsa * 3, fca, fsa);
      if (front) lib.ell(c, fx, fy, 2.6, 2.6, HC.skin, 1.5);
    }
  }
  if (S.juice && a.tr && a.tr.motion === 'thrust' && p.mode === 'fight' && front === (Math.sin(a.dir) >= -0.3)) {
    var tr2 = a.tr, fade2 = 1 - tr2.age / 0.18, ox2 = p.x + bp.lx, oy2 = p.y * K - 13 + bp.ly, ca2 = Math.cos(a.dir), sa2 = Math.sin(a.dir) * K, px2 = -sa2, py2 = ca2, r0 = tr2.reach * 0.35, r1 = tr2.reach * (0.5 + 0.5 * tr2.u) * HH.spec.slashSize, ww = 2.2 * HH.spec.slashWidth + 0.8;
    c.beginPath(); c.moveTo(ox2 + ca2 * r0 + px2 * ww, oy2 + sa2 * r0 + py2 * ww); c.lineTo(ox2 + ca2 * r1, oy2 + sa2 * r1); c.lineTo(ox2 + ca2 * r0 - px2 * ww, oy2 + sa2 * r0 - py2 * ww); c.closePath();
    var sh2 = HC.slash; c.fillStyle = 'rgba(' + parseInt(sh2.substr(1, 2), 16) + ',' + parseInt(sh2.substr(3, 2), 16) + ',' + parseInt(sh2.substr(5, 2), 16) + ',' + (0.5 * fade2) + ')'; c.fill();
  }
  else if (S.juice && a.tr && p.mode === 'fight' && front === (Math.sin(a.dir) >= -0.3)) {
    var tr = a.tr, fade = 1 - tr.age / 0.18, n, steps = 16, reach = tr.reach * HH.spec.slashSize, inner = reach * (1 - HH.spec.slashWidth), ox = p.x + bp.lx, oy = p.y * K - 13 + bp.ly;
    c.beginPath();
    for (n = 0; n <= steps; n++) { var aa = visAngle(tr.start + (tr.cur - tr.start) * n / steps, dir); c.lineTo(ox + Math.cos(aa) * reach, oy + Math.sin(aa) * reach * K); }
    for (n = steps; n >= 0; n--) { var ab = visAngle(tr.start + (tr.cur - tr.start) * n / steps, dir); c.lineTo(ox + Math.cos(ab) * inner, oy + Math.sin(ab) * inner * K); }
    c.closePath(); var sh = HC.slash; c.fillStyle = (tr.hot ? 'rgba(255,224,110,' : 'rgba(' + parseInt(sh.substr(1, 2), 16) + ',' + parseInt(sh.substr(3, 2), 16) + ',' + parseInt(sh.substr(5, 2), 16) + ',') + (0.5 * fade) + ')'; c.fill();
  }
}
function drawToolShape(c, hx, hy, ca, sa, len, id) {     // a tool in the hand, pointing along (ca, sa)
  var px = -sa, py = ca, ex = hx + ca * len, ey = hy + sa * len, wood = '#8a5a3a', steel = '#c5ccd6', dark = '#3a2a36';
  function ln(x1, y1, x2, y2, col, w) { c.strokeStyle = dark; c.lineWidth = w + 2; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (id === 'knife') {
    var kx = hx + ca * 5, ky = hy + sa * 5;
    ln(hx - ca * 2, hy - sa * 2, kx, ky, wood, 3);
    ln(kx, ky, hx + ca * len * 0.62, hy + sa * len * 0.62, '#eef3fb', 2.4);
    return;
  }
  ln(hx - ca * 3, hy - sa * 3, ex, ey, wood, 2.8);
  if (id === 'axe') {
    var q = [[ex - ca * 7, ey - sa * 7], [ex + ca * 1.5, ey + sa * 1.5], [ex + ca * 3 + px * 8, ey + sa * 3 + py * 8], [ex - ca * 7 + px * 6, ey - sa * 7 + py * 6]];
    c.beginPath(); c.moveTo(q[0][0], q[0][1]); for (var i = 1; i < 4; i++) c.lineTo(q[i][0], q[i][1]); c.closePath();
    c.fillStyle = steel; c.fill(); c.lineWidth = 1.5; c.strokeStyle = dark; c.stroke();
  } else {
    c.beginPath(); c.moveTo(ex + px * 9 - ca * 2, ey + py * 9 - sa * 2); c.quadraticCurveTo(ex + ca * 5, ey + sa * 5, ex - px * 9 - ca * 2, ey - py * 9 - sa * 2);
    c.strokeStyle = dark; c.lineWidth = 4.6; c.stroke(); c.strokeStyle = steel; c.lineWidth = 2.6; c.stroke();
  }
}
function drawBowShape(c, bx, by, ca, sa) {                // a bow held out along (ca, sa)
  var px = -sa, py = ca, r = 8;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(bx + px * r, by + py * r); c.quadraticCurveTo(bx + ca * 6, by + sa * 6, bx - px * r, by - py * r);
  c.strokeStyle = '#3a2a36'; c.lineWidth = 4.2; c.stroke(); c.strokeStyle = '#8a5a3a'; c.lineWidth = 2.4; c.stroke();
  c.strokeStyle = '#efe6cf'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(bx + px * r, by + py * r); c.lineTo(bx - px * r, by - py * r); c.stroke();
}
function drawShield(c, front) {
  var p = P; if (!p.guard) return;
  var inFront = Math.sin(p.face) >= -0.05;
  if (inFront !== front) return;
  var bp = bodyPose(), sh = shieldPose();
  var x = p.x + sh[0] + bp.lx, y = p.y * K + sh[1] + bp.ly;
  var parry = p.guardT < parryWindow();
  if (shielded()) {
    var bh = shieldBehind(), srx = bh ? 10.5 : 7.5, sry = bh ? 11 : 9;
    lib.ell(c, x, y, srx, sry, parry ? '#fff3c4' : '#8f8ba6', 1.8);
    lib.ell(c, x, y, srx * 0.53, sry * 0.55, '#e0a93a', 1.2); lib.ell(c, x, y, srx * 0.19, sry * 0.2, '#f6d878', 0);
  }
  if (parry) { c.strokeStyle = 'rgba(255,240,170,' + (0.8 - p.guardT / parryWindow() * 0.6) + ')'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(shielded() ? x : p.x + Math.cos(p.face) * 8, shielded() ? y : p.y * K - 12 + Math.sin(p.face) * 5, 12, 13, 0, 0, Math.PI * 2); c.stroke(); }
}
// With api.facings8 the side view is used only when he faces nearly straight left or right; on the diagonals he is
// drawn from the front or back, turned (heroTurn) toward the side.
function heroTurn() {
  if (!api.facings8) return 0;
  var d = heroDir(); if (d === 'left' || d === 'right') return 0;
  return Math.max(-1, Math.min(1, Math.cos(P.faceVis) / 0.7));
}
function heroDir() {
  var vx = Math.cos(P.faceVis), vy = Math.sin(P.faceVis) * K;
  if (api.facings8) { if (Math.abs(Math.sin(P.faceVis)) < 0.4) return vx > 0 ? 'right' : 'left'; return vy > 0 ? 'down' : 'up'; }
  if (Math.abs(vx) > Math.abs(vy)) return vx > 0 ? 'right' : 'left';
  return vy > 0 ? 'down' : 'up';
}
function heroFn(dashing, dir, an, pose) {
  var p = P;
  return function (s) {
    if (dashing) {
      var ax = Math.abs(p.roll.dx), ay = Math.abs(p.roll.dy);
      s.rotate(p.roll.dx * 0.16);
      s.scale(1 + 0.2 * ax, 1 - 0.1 * ax + 0.08 * ay);
    }
    lib.playerD(s, 0, 0, dir, an, pose);
  };
}
function drawHero(c) {
  var p = P;
  var amt = p.flash;
  if (p.invuln > 0 && p.flash <= 0 && p.roll.t <= 0) amt = (Math.floor(W.t * 20) % 2) ? 0.5 : 0;
  var dashing = p.roll.t > 0;
  for (var gi = 0; gi < W.ghosts.length; gi++) {
    var g = W.ghosts[gi];
    c.globalAlpha = 0.45 * g.life / g.max;
    flashDraw(c, g.x, g.y * K, heroFn(false, g.dir, { phase: g.ph, amt: 1, t: g.t, lx: 0, ly: 0, blink: 0, sq: 0 }, null), 0.75, '110,200,255');
    c.globalAlpha = 1;
  }
  if (api.heroSprite) {                                           // a page draws the hero from a sprite sheet (the Blender trial, 2026-10-09)
    var liftS = api.scene && api.scene.heroLift ? api.scene.heroLift() : 0;
    c.save(); c.globalAlpha = amt > 0 ? 1 - amt * 0.5 : 1; api.heroSprite(c, p.x, p.y * K - liftS, p.faceVis, p.anim, dashing); c.restore(); return;
  }
  {
    var ab0 = atkBody(), hsc = lib.hero().spec.scale;
    var lift0 = api.scene && api.scene.heroLift ? api.scene.heroLift() : 0;   // e.g. standing on a bobbing deck
    c.save(); c.translate(p.x + ab0.x, p.y * K + ab0.y - ab0.hop - lift0); c.scale(hsc * ab0.sx, hsc * ab0.sy); c.translate(-p.x, -p.y * K);
  }
  drawHeroWeapon(c, false); drawShield(c, false);
  { p.anim.turn = heroTurn(); flashDraw(c, p.x, p.y * K, heroFn(dashing, heroDir(), p.anim, heroPose(heroDir())), amt); }
  drawHeroWeapon(c, true); drawShield(c, true);
  c.restore();
}
// the heading an animal is drawn at: it follows the true facing, but turns over a few frames instead of snapping
function creatureTurn(e, a) {
  if (e.faceVis == null) e.faceVis = a;
  var d = Math.atan2(Math.sin(a - e.faceVis), Math.cos(a - e.faceVis)), stepMax = 0.22;
  e.faceVis += Math.max(-stepMax, Math.min(stepMax, d));
  return e.faceVis;
}
function drawCreature(c, e) {
  var sp = (e.skin || lib.creature()).spec, a = e.type === 'shooter' ? e.aim : e.face, dx = P.x - e.x, dy = (P.y - e.y) * K, dl = Math.hypot(dx, dy) || 1;
  lib.creatureD(c, 0, 0, { t: W.t + e.seed, move: (e.state === 'chase' || e.state === 'lunge') ? 1 : 0, phase: (W.t + e.seed) * 9 * sp.stepRate,
    dir: Math.cos(a) >= 0 ? 1 : -1, ang: api.facings8 ? creatureTurn(e, a) : null, look: [dx / dl, dy / dl], state: e.state, k: e.dur ? e.t / e.dur : 0 }, e.skin);
  if (e.skin && e.skin.eyes) e.eyes = e.skin.eyes;                 // where its eyes were just drawn, about (e.x, e.y * K)
}
// A human enemy (2026-10-07, the raid's guards): a figure from the page (e.fig, lib.makeFigure) drawn like the villagers, with a sword in
// the right hand that hangs at rest, rises behind the shoulder in the windup and comes round in the blow. The page gives the figure,
// the numbers and e.human; the engine's chase-and-lunge does the rest.
function drawHuman(c, e) {
  var a = e.face, vx = Math.cos(a), vy = Math.sin(a), side = Math.abs(vy) < 0.4, dir = side ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
  var moving = e.state === 'chase' || e.state === 'lunge', t = W.t + e.seed, k = e.dur ? Math.min(1, e.t / e.dur) : 0, M = lib.inkMetrics(e.fig.spec), fwd = -1, bk = 1, pose = null;
  var hang = M.sh + 1.2 + M.arm * 1.95 - 0.2;
  if (e.state === 'windup') pose = { armR: [M.shw + 3, M.sh - 8 - k * 3], near: [bk * 3.5, M.sh - 8 - k * 3], lx: side ? bk * 1.5 : 0, ly: -0.6 };
  else if (e.state === 'lunge') pose = { armR: [M.shw + 5 - k * 2, M.sh + 2 + k * 4], near: [fwd * (M.arm * 1.9), M.sh + 2 + k * 3], lx: side ? fwd * 2.2 : 0, ly: 1.2 };
  else if (!moving) pose = { armR: [M.shw + 1.6, hang], near: [fwd * 0.6, hang] };
  var an = { phase: t * 8, amt: moving ? 1 : 0, t: t, lx: 0, ly: 0, blink: (t % 3.1) < 0.1 ? 1 : 0, sq: 0, turn: side ? 0 : Math.max(-1, Math.min(1, vx / 0.7)) };
  c.fillStyle = 'rgba(20,30,20,0.22)'; c.beginPath(); c.ellipse(0, 0, 9, 4, 0, 0, 7); c.fill();
  lib.figureD(c, 0, 0, dir, an, pose, e.fig);
  var hp = pose ? (side ? pose.near : pose.armR) : [side ? fwd * 1.2 : M.shw + 1.6, hang - 1.5];
  var ang = e.state === 'windup' ? (side ? bk * 1.3 - 2.9 : -1.9) : (e.state === 'lunge' ? (side ? -0.15 : 0.9) : (side ? -1.25 : 1.15));
  if (lib.figureHeld) lib.figureHeld(c, 0, 0, dir, e.fig, { kind: 'sword', x: hp[0], y: hp[1], ang: ang });
}
function drawEnemy(c, e) {
  if (api.enemySprite && api.enemySprite(c, e)) { if (e.state === 'stunned' && !e.dead) stunStars(c, e); return; }        // a page draws this one from a sprite sheet (the Blender animals, 2026-10-11); a stunned one gets its stars
  var fn = e.fig ? drawHuman : e.creature ? drawCreature : drawPlain;
  if (e.dead) { c.save(); c.globalAlpha = Math.max(0, 1 - e.deadT * 2); c.translate(e.x, e.y * K - e.deadT * 14); c.scale(1 + e.deadT, 1 - e.deadT * 0.6); fn(c, e); c.restore(); return; }
  var jx = e.freezeT > 0 ? Math.sin(W.t * 90 + e.seed) * 1.1 : 0, A = e.cfg && e.cfg.atk;
  if (false && A && A.kind === 'arc' && (e.state === 'windup' || (e.state === 'lunge' && !e.hitDone))) {   // (the red wedge of an arc attack: off since 2026-10-14, Robin; the clip is the tell)
    var k2 = e.state === 'windup' ? e.t / e.dur : 1, R2 = e.r + (A.reach || 20) + 6, a0 = e.dirLock - (A.arc || 1.6) / 2, a1 = e.dirLock + (A.arc || 1.6) / 2;
    c.save(); c.translate(e.x, e.y * K); c.scale(1, K);
    c.fillStyle = 'rgba(220,40,30,' + (0.08 + 0.16 * k2) + ')'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R2, a0, a1); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,70,50,' + (0.35 + 0.4 * k2) + ')'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R2, a0, a1); c.closePath(); c.stroke();
    if (e.state === 'lunge') { var u = Math.min(1, e.t / (e.dur * (A.hitAt || 0.4))), sa2 = a0 + (a1 - a0) * u; c.strokeStyle = 'rgba(255,120,80,0.9)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(sa2) * R2, Math.sin(sa2) * R2); c.stroke(); c.fillStyle = 'rgba(255,90,60,0.25)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R2, a0, sa2); c.closePath(); c.fill(); }
    c.restore();
  }
  flashDraw(c, e.x + jx, e.y * K, function (s) {
    if (e.sq > 0.01) {
      var k = e.sq, f = 0.3 * k * Math.cos((1 - k) * 7), ax = Math.abs(Math.cos(e.sqAng)), ay = Math.abs(Math.sin(e.sqAng)) * K;
      s.scale(1 - f * ax + f * 0.5 * ay, 1 + f * ax * 0.6 - f * ay);
    }
    fn(s, e);
  }, e.flash, e.flashRgb);
}
function drawProj(c, pr) {
  if (pr.fire && api.drawFireArrow && api.drawFireArrow(c, pr)) return;   /* the burning arrow in flight: the page's picture (Colin, AD's, 2026-10-24) */
  var x = pr.x, y = pr.y * K - 10;
  if (pr.owner === 'enemy') {
    lib.ell(c, x, y, 4.4, 4.4, '#ffe9d0', 1.5, '#8a3a2a'); lib.ell(c, x, y, 2.2, 2.2, '#ff8a5a', 0);
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(x - pr.vx * 0.03, y - pr.vy * 0.03 * K, 2.6, 0, Math.PI * 2); c.fill();
  } else if (pr.kind === 'stone') {
    lib.ell(c, x, y, 2.8, 2.4, '#8a8c94', 1.2); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(x - 0.8, y - 0.8, 1, 0, 7); c.fill();
  } else if (pr.thing && typeof Items !== 'undefined') {
    var ta = pr.kind === 'throwaxe' ? pr.ang + pr.spin : pr.ang, tca = Math.cos(ta), tsa = Math.sin(ta) * K, tl = Items.KINDS[pr.thing.kind].len * pr.thing.size;
    Items.draw(c, pr.thing, x - tca * tl * 0.5, y - tsa * tl * 0.5, tca, tsa, null);
  } else {
    // an arrow: shaft, iron head, two feathers
    var ca = Math.cos(pr.ang), sa = Math.sin(pr.ang) * K, px = -sa, py = ca, tx = x + ca * 8, ty = y + sa * 8, bx = x - ca * 8, by = y - sa * 8;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#3a2a36'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();   /* (2026-10-14, Robin: a lot thinner) */
    c.strokeStyle = pr.reflected ? '#ffd34d' : '#b98a5a'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
    c.fillStyle = '#c5ccd6'; c.strokeStyle = '#3a2a36'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(tx + ca * 3.2, ty + sa * 3.2); c.lineTo(tx + px * 1.2, ty + py * 1.2); c.lineTo(tx - px * 1.2, ty - py * 1.2); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#eef3fb'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - ca * 3 + px * 2.4, by - sa * 3 + py * 2.4); c.moveTo(bx, by); c.lineTo(bx - ca * 3 - px * 2.4, by - sa * 3 - py * 2.4); c.moveTo(bx + ca * 2.5, by + sa * 2.5); c.lineTo(bx - ca * 0.5 + px * 2.4, by - sa * 0.5 + py * 2.4); c.moveTo(bx + ca * 2.5, by + sa * 2.5); c.lineTo(bx - ca * 0.5 - px * 2.4, by - sa * 0.5 - py * 2.4); c.stroke();
  }
}
function drawPart(c, q) {
  var a = Math.max(0, q.life / q.max), x = q.x, y = q.y * K - q.z;
  if (q.k === 'streak') { c.strokeStyle = 'rgba(' + (q.rgb || '255,246,200') + ',' + a + ')'; c.lineWidth = 1.6 * (0.4 + a * 0.6); c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - q.vx * 0.045, y - q.vy * 0.045 * K); c.stroke(); }
  else if (q.k === 'dust') { c.fillStyle = 'rgba(232,220,192,' + (0.55 * a) + ')'; c.beginPath(); c.arc(x, y, q.s * (1.6 - a * 0.6), 0, Math.PI * 2); c.fill(); }
  else if (q.k === 'bit') { c.fillStyle = q.c; c.strokeStyle = '#3a2a36'; c.lineWidth = 0.9; c.beginPath(); c.arc(x, y, q.s, 0, Math.PI * 2); c.fill(); c.stroke(); }
  else { c.fillStyle = q.c; c.globalAlpha = a; c.beginPath(); c.arc(x, y, q.s, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
}
// a bar in the art direction (2026-10-07): a dark recess with an ink line, heavier below, the fill with a lit top edge
function bar(c, x, y, w, h, v, fill, back) {
  var r = Math.min(2.5, h / 2);
  c.fillStyle = '#231a16'; c.beginPath(); c.roundRect(x - 1.6, y - 1.6, w + 3.2, h + 3.2, r + 1); c.fill();
  c.fillStyle = back || '#3b2d26'; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  var fw = Math.max(0, w * clamp(v, 0, 1));
  if (fw > 0.5) { c.save(); c.beginPath(); c.roundRect(x, y, w, h, r); c.clip(); c.fillStyle = fill; c.fillRect(x, y, fw, h); c.fillStyle = 'rgba(255,240,200,0.28)'; c.fillRect(x, y, fw, Math.max(1, h * 0.3)); c.fillStyle = 'rgba(35,26,22,0.25)'; c.fillRect(x, y + h - Math.max(1, h * 0.22), fw, Math.max(1, h * 0.22)); c.restore(); }
  c.strokeStyle = '#231a16'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 1, y + h + 1); c.lineTo(x + w + 1, y + h + 1); c.stroke();
}
// damage numbers and pickups float up from where they happened; a page with a camera draws them inside it
function drawNums(c) {
  for (var i = 0; i < W.nums.length; i++) {
    var n = W.nums[i], a = 1 - n.t / 0.9;
    c.globalAlpha = Math.max(0, Math.min(1, a * 1.6)); c.textAlign = 'center';
    var pop = 1 + (n.big ? 0.9 : 0.5) * Math.max(0, 1 - n.t / 0.14);
    c.font = 'bold ' + (9 * pop).toFixed(1) + 'px system-ui, sans-serif';
    c.lineWidth = 2.6; c.strokeStyle = '#3a2a36'; var ny = n.y * K - n.t * 24;
    if (n.weak) c.globalAlpha *= 0.7;
    c.strokeText(n.txt, n.x, ny); c.fillStyle = n.c; c.fillText(n.txt, n.x, ny);
    if (n.weak) {                                            // a crack through a weak blow's number
      var tw = c.measureText(n.txt).width, cx0 = n.x - tw * 0.1, cy0 = ny - 9 * pop * 0.75;
      c.strokeStyle = '#3a2a36'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(cx0 - 1.5, cy0); c.lineTo(cx0 + 0.6, cy0 + 2.6); c.lineTo(cx0 - 0.4, cy0 + 4.4); c.lineTo(cx0 + 1.6, cy0 + 7.2); c.stroke();
    }
    c.globalAlpha = 1;
  }
}
function drawHud(c) {
  var i, bigRow = 0;
  var mst = maxSt(), bw = 60, stw = bw * mst / 100;       // small bars with the numbers beside them
  if (!(api.hudBars && api.hudBars(c, P, mst))) {           // (a page may draw them itself: the game's oak plaque, 2026-10-22)
  bar(c, 10, 8, bw, 7, P.hp / P.maxHp, '#b8432f');
  if (P.rally > 0.2) { c.fillStyle = 'rgba(236,160,96,0.75)'; c.fillRect(10 + bw * Math.max(0, P.hp) / P.maxHp, 8, bw * Math.min(P.rally, P.maxHp - P.hp) / P.maxHp, 7); }   // what a blow of yours can win back (RALLY)
  bar(c, 10, 18, stw, 6, P.st / mst, P.st < 22 ? '#c9a63a' : '#6f9a4a');
  c.font = 'bold 5px system-ui, sans-serif'; c.textAlign = 'left'; c.lineWidth = 1.6; c.strokeStyle = '#3a2a36'; c.fillStyle = '#fff';   // the number sits inside its bar
  var hpTxt = String(Math.ceil(Math.max(0, P.hp))), stTxt = String(Math.round(Math.max(0, P.st)));
  c.strokeText(hpTxt, 13, 13.2); c.fillText(hpTxt, 13, 13.2); c.strokeText(stTxt, 13, 22.8); c.fillText(stTxt, 13, 22.8);
  }
  c.font = 'bold 8px system-ui, sans-serif'; c.lineWidth = 2.4;
  if (!(api.scene && api.scene.noKills)) { var txt = 'Kills ' + W.kills; c.strokeText(txt, 10, 38); c.fillStyle = '#fff'; c.fillText(txt, 10, 38); }
  for (i = 0; i < W.enemies.length; i++) {
    var e = W.enemies[i];
    if (e.dead) continue;
    if (e.type === 'brute') {
      var by = 10 + bigRow * 30; bigRow++;
      bar(c, 124, by, 152, 8, e.hp / e.maxHp, '#e0a93a');
      bar(c, 124, by + 12, 152, 4, e.stagMeter / 100, e.state === 'stunned' ? '#ffd34d' : '#8fe3ff');
      var nm = e.name || 'Brute';
      c.textAlign = 'center'; c.strokeText(nm, 200, by + 27); c.fillStyle = '#fff'; c.fillText(nm, 200, by + 27);
    } else if (e.showBar > 0 && !api.scene) {
      var byA = e.y * K - (e.human ? 46 : e.r * 2.6 + 10); bar(c, e.x - 10, byA, 20, 3, e.hp / e.maxHp, e.side === 1 ? '#7fbf6a' : '#e8584a');
      if (e.side !== 1 && (e.posture > 0.01 || e.finish)) bar(c, e.x - 10, byA + 5, 20, 1.6, e.finish ? 1 : e.posture, e.finish ? (Math.floor(W.t * 8) % 2 ? '#ffb05a' : '#ff7a2a') : '#e8b04a');   // his balance (POSTURE), as in a page's scene
    }
  }
  if (!api.scene) drawNums(c);
  if (P.dead && !(api.scene && api.scene.ownFallen)) {      // (a page with boards of its own draws this one too: scene.ownFallen)
    c.fillStyle = 'rgba(20,20,40,0.55)'; c.fillRect(0, 0, SW, SH);
    c.font = 'bold 16px system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 3.4; c.strokeStyle = '#3a2a36';
    c.strokeText('You have fallen', 200, 118); c.fillStyle = '#fff'; c.fillText('You have fallen', 200, 118);
    c.font = '10px system-ui, sans-serif'; c.lineWidth = 2.4; c.strokeText('Press R to rise again', 200, 136); c.fillText('Press R to rise again', 200, 136);
  }
}

/* ---------- hotbar: weapons left of six slots, bottom middle ---------- */
function slotIcon(c, id, x, y) {
  c.save(); c.translate(x, y); c.lineCap = 'round'; c.lineJoin = 'round';
  function ln(x1, y1, x2, y2, col, w) { c.strokeStyle = '#3a2a36'; c.lineWidth = w + 1.6; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  if (id === 'sword') { ln(-4, 4, 5, -5, '#eef3fb', 2.4); ln(-4.2, -0.2, 0.2, 4.2, '#e0a93a', 2); ln(-4, 4, -6, 6, '#8a5a3a', 2.4); }
  else if (id === 'bow') {
    c.beginPath(); c.arc(-3, 0, 8, -1.1, 1.1); c.strokeStyle = '#3a2a36'; c.lineWidth = 3.8; c.stroke(); c.strokeStyle = '#8a5a3a'; c.lineWidth = 2.2; c.stroke();
    ln(-3 + 8 * Math.cos(1.1), -8 * Math.sin(1.1), -3 + 8 * Math.cos(1.1), 8 * Math.sin(1.1), '#efe6cf', 0.9); ln(-4, 0, 6, 0, '#efe6cf', 1.1);
  }
  else if (id === 'axe') { ln(-4, 5, 3, -3, '#8a5a3a', 2.2); c.beginPath(); c.moveTo(0, -5.5); c.lineTo(5, -5); c.lineTo(6, -0.5); c.lineTo(2.5, -2); c.closePath(); c.fillStyle = '#c5ccd6'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = '#3a2a36'; c.stroke(); }
  else if (id === 'pick') { ln(-4, 5, 3, -3, '#8a5a3a', 2.2); c.beginPath(); c.moveTo(-3, -6); c.quadraticCurveTo(2, -7.5, 7, -1); c.strokeStyle = '#3a2a36'; c.lineWidth = 3.6; c.stroke(); c.strokeStyle = '#c5ccd6'; c.lineWidth = 2; c.stroke(); }
  else if (id === 'knife') { ln(-5, 5, -2, 2, '#8a5a3a', 2.6); ln(-2, 2, 5, -5, '#eef3fb', 2.2); }
  c.restore();
}
function neutralIcon(c, id) {            // what is in your hand when nothing is: a plain fist, and the faint outline of a bow
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (id === 'sword') {
    c.fillStyle = '#e9c39a'; c.strokeStyle = '#3a2a36'; c.lineWidth = 1.2;
    c.beginPath(); c.roundRect(-5, -3, 10, 8, 2.2); c.fill(); c.stroke();
    for (var k = 0; k < 4; k++) { c.beginPath(); c.ellipse(-3.6 + k * 2.4, -3.2, 1.3, 1.6, 0, 0, 7); c.fill(); c.stroke(); }
    c.beginPath(); c.ellipse(-4.6, 2, 1.5, 2.2, 0.4, 0, 7); c.fill(); c.stroke();
  } else {
    c.strokeStyle = 'rgba(200,205,215,0.55)'; c.lineWidth = 1.5; c.beginPath(); c.arc(-3, 0, 8, -1.1, 1.1); c.stroke();
    c.lineWidth = 0.9; c.beginPath(); c.moveTo(-3 + 8 * Math.cos(1.1), -8 * Math.sin(1.1)); c.lineTo(-3 + 8 * Math.cos(1.1), 8 * Math.sin(1.1)); c.stroke();
  }
}
function slotBox(c, x, y, on, sz) {     // a hotbar slot: a dark wooden recess with an ink line, gold when it is the one in hand
  c.fillStyle = 'rgba(45,32,24,0.9)'; c.fillRect(x, y, sz, sz);
  c.strokeStyle = on ? '#d9a73a' : '#231a16'; c.lineWidth = on ? 1.2 : 0.9; c.strokeRect(x + 0.5, y + 0.5, sz - 1, sz - 1);
  c.strokeStyle = 'rgba(255,238,200,0.14)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x + 1.2, y + sz - 1); c.lineTo(x + sz - 1, y + sz - 1); c.lineTo(x + sz - 1, y + 1.2); c.stroke();
  if (on) { c.strokeStyle = 'rgba(217,167,58,0.35)'; c.lineWidth = 2; c.strokeRect(x - 0.5, y - 0.5, sz + 1, sz + 1); }
}
function roundIcon(c, id, x, y, r, on, dim) {
  c.globalAlpha = dim ? 0.45 : 1;
  c.fillStyle = 'rgba(45,32,24,0.9)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.strokeStyle = on ? '#d9a73a' : '#231a16'; c.lineWidth = on ? 1.3 : 0.9; c.stroke();
  var wi = itemOf('weapon', id);
  c.save(); c.translate(x, y); if (wi) Items.icon(c, wi, r * 1.6); else if (api.items) { c.scale(r / 10, r / 10); neutralIcon(c, id); } else { c.scale(r / 10, r / 10); slotIcon(c, id, 0, 0); } c.restore();
  c.globalAlpha = 1;
}
function drawHotbar(c) {
  if (api.hideBar && api.hideBar()) return;   // (a page that has not shown its bar yet: the game's beginning, 2026-10-14)
  var sz = 11, gap = 2, x0 = Math.round((SW - (6 * sz + 5 * gap)) / 2), y0 = SH - sz - 5, mode = P.mode, gather = mode === 'gather', build = mode === 'build', i, k = 0.55;
  var slots = build ? (api.buildSlots || []) : [];
  var bar = api.barSlots && (mode === 'fight' || gather) ? api.barSlots(mode) : null;   // a page's own bar: six things, one in hand
  var paged = !!api.barSlots;                // such a page has no fixed sword and bow: the round icons, the F and the loose arrow count are the editors'
  c.save();
  if (!bar && !paged) {
  // sword above left, bow below right, like the two rings of a % sign
  roundIcon(c, 'sword', x0 - 23, y0 - 1, 6.5, mode === 'fight' && P.weapon === 'melee', mode !== 'fight');
  roundIcon(c, 'bow', x0 - 10, y0 + 9, 6.5, mode === 'fight' && P.weapon === 'ranged', mode !== 'fight');
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0 - 11, y0 - 2); c.lineTo(x0 - 22, y0 + 10); c.stroke();
  c.font = 'bold 4.5px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,0.65)'; c.fillText('F', x0 - 16.5, y0 + 14.5);
  }
  if (api.quiver != null && !paged) { c.font = 'bold 5px system-ui, sans-serif'; c.textAlign = 'left'; c.lineWidth = 1.8; c.strokeStyle = '#3a2a36'; c.strokeText(String(api.quiver), x0 - 3, y0 + 13); c.fillStyle = api.quiver > 0 ? '#fff' : '#ff8a7a'; c.fillText(String(api.quiver), x0 - 3, y0 + 13); }
  for (i = 0; i < 6 && !(paged && build); i++) {      // (build mode on such a page: the pieces are on its board, not in six slots)
    var x = x0 + i * (sz + gap), tool = gather && i < TOOLS.length ? TOOLS[i] : null, cx = x + sz / 2, cy = y0 + sz / 2;
    slotBox(c, x, y0, bar ? i === bar.hand : ((gather && i === P.tool) || (mode === 'fight' && i === (P.sel || 0))), sz);
    if (bar && bar.sel != null && bar.sel === i && bar.sel !== bar.hand) { c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 0.7; c.strokeRect(x + 0.6, y0 + 0.6, sz - 1.2, sz - 1.2); }   // the wheel's pick (2026-10-13): Enter takes it in hand
    c.save(); c.translate(cx, cy); c.scale(k, k);
    var skl = mode === 'fight' && api.skills ? api.skills[i] : null;
    if (bar) { var bq = bar.slots[i]; if (bq) { bq.draw(c); if (bq.ammo != null) { c.font = 'bold 8px system-ui, sans-serif'; c.textAlign = 'right'; c.lineWidth = 2.4; c.strokeStyle = '#3a2a36'; c.strokeText(String(bq.ammo), 9.5, 9.5); c.fillStyle = bq.ammo > 0 ? '#fff' : '#ff8a7a'; c.fillText(String(bq.ammo), 9.5, 9.5); } else if (bq.n > 1) { c.font = 'bold 8px system-ui, sans-serif'; c.textAlign = 'right'; c.lineWidth = 2.4; c.strokeStyle = '#3a2a36'; c.strokeText(String(bq.n), 9.5, 9.5); c.fillStyle = '#fff'; c.fillText(String(bq.n), 9.5, 9.5); } } }
    else if (tool) { var ti2 = itemOf('tool', i); if (ti2) Items.icon(c, ti2, 16); else { if (api.items) c.globalAlpha = 0.3; slotIcon(c, tool.id, 0, 0); c.globalAlpha = 1; } }
    else if (skl) { skl.draw(c); if (skl.cd > 0) { c.fillStyle = 'rgba(20,16,30,0.7)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 14, -Math.PI / 2, -Math.PI / 2 + skl.cd * 6.283); c.closePath(); c.fill(); } }
    else if (api.beltSlots && api.beltSlots[i] && (mode !== 'gather' || i >= TOOLS.length)) {
      var bs = api.beltSlots[i]; bs.draw(c);
      if (bs.n > 1) { c.font = 'bold 8px system-ui, sans-serif'; c.textAlign = 'right'; c.lineWidth = 2.4; c.strokeStyle = '#3a2a36'; c.strokeText(String(bs.n), 9.5, 9.5); c.fillStyle = '#fff'; c.fillText(String(bs.n), 9.5, 9.5); }
    }
    c.restore();
    c.font = 'bold 3.8px system-ui, sans-serif'; c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,0.65)'; c.fillText(String(i + 1), x + 1.3, y0 + 4.5);
  }
  c.font = 'bold 5px system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 1.8; c.strokeStyle = '#3a2a36';
  var pc = slots[P.piece], label = build ? (P.wreck ? 'WRECK  (F to build, B to leave)' : 'BUILD: ' + (pc ? pc.name + (pc.cost ? ' (' + pc.cost + ')' : '') : '') + '   (right click: pieces, F: wreck, B: leave)') : '';   /* (no word over the bar but in build mode on any page since 2026-10-22, Robin: "remove the FIGHT and GATHER text"; the arena too) */
  var col = build ? (P.wreck ? '#e08a7a' : '#a9c8d8') : (gather ? '#a9cf8a' : '#e6c46a');
  if (label) { c.strokeStyle = '#231a16'; c.strokeText(label, SW / 2, y0 - 3); c.fillStyle = col; c.fillText(label, SW / 2, y0 - 3); }
  c.restore();
}

function render(c) {
  if (!groundCv) buildGround();
  var PS = api.pixelScale || 2;   // canvas pixels per world unit; editor pages raise it so a large canvas stays sharp
  c.setTransform(PS, 0, 0, PS, 0, 0); c.lineJoin = 'round'; c.lineCap = 'round';
  c.save();
  // api.scene lets a tool page swap in its own camera, ground and extra y-sorted items
  var sc = api.scene;
  if (sc) sc.begin(c, P); else c.drawImage(groundCv, 0, 0, SW, SH);
  drawTelegraphs(c);
  var i, items = [];
  // shadows
  c.fillStyle = 'rgba(30,70,50,0.28)';
  function sh2(x, y, rx, ry) { c.beginPath(); c.ellipse(x, y * K, rx, ry * K, 0, 0, Math.PI * 2); c.fill(); }
  for (i = 0; i < W.pillars.length; i++) if (!W.pillars[i].hide) sh2(W.pillars[i].x + 2, W.pillars[i].y, 9, 5);
  for (i = 0; i < W.enemies.length; i++) { var en = W.enemies[i]; if (!en.dead && !en.down && !en.human) sh2(en.x, en.y, en.r * 1.3, en.r * 0.8); }
  if (!P.dead && !(sc && sc.noHeroShadow)) sh2(P.x, P.y, 9, 4);
  for (i = 0; i < W.projs.length; i++) sh2(W.projs[i].x, W.projs[i].y, 3, 2);
  // pillars
  W.pillars.forEach(function (pl) {
    if (pl.hide) return;
    items.push({ y: pl.y, f: function () {
      lib.rr(c, pl.x - 8, pl.y * K - 3, 16, 5, 2, '#8f8ba6', 1.8);
      lib.rr(c, pl.x - 5.5, pl.y * K - 26, 11, 24, 2, '#7a7690', 1.8);
      c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(pl.x - 3.5, pl.y * K - 24, 2, 20);
      lib.rr(c, pl.x - 8, pl.y * K - 30, 16, 6, 2.5, '#a9a5bb', 1.8);
    } });
  });
  W.enemies.forEach(function (e) { if (api.scene && api.scene.visible && !api.scene.visible(e.x, e.y, e.r)) return; items.push({ y: e.y, f: function () { drawEnemy(c, e); } }); });   // a page can say what is in view (2026-10-08: every beast in the world was drawn each frame)
  W.projs.forEach(function (pr) { items.push({ y: pr.y + 1, f: function () { drawProj(c, pr); } }); });
  W.parts.forEach(function (q) { if (q.k === 'dust') items.push({ y: q.y, f: function () { drawPart(c, q); } }); });
  if (!P.dead) { var hsy = api.scene && api.scene.heroSortY ? api.scene.heroSortY() : null; items.push({ y: hsy != null ? hsy : P.y, f: function () { drawHero(c); } }); }   /* heroSortY: a page sorts the hero elsewhere than at his feet (over the altar's slab as he lays and stabs, 2026-10-24) */
  if (sc) sc.items(items);
  items.sort(function (a, b) { return a.y - b.y; });
  for (i = 0; i < items.length; i++) items[i].f();
  for (i = 0; i < W.parts.length; i++) if (W.parts[i].k !== 'dust') drawPart(c, W.parts[i]);
  if (api.overlay) api.overlay(c, P, W);                   // a page draws over the world, under the HUD (the arena's reach arcs and timers, 2026-10-13)
  for (i = W.glints.length - 1; i >= 0; i--) {   // the tells' glints: a four-pointed star that opens and fades, white or red (2026-10-15)
    var gl = W.glints[i]; gl.t += 1 / 60; if (gl.t >= gl.life) { W.glints.splice(i, 1); continue; }
    var gk = gl.t / gl.life, gr = (gl.hv ? 9 : 6.5) * Math.sin(Math.min(1, gk * 2.2) * Math.PI / 2) * (1 - Math.max(0, gk - 0.6) / 0.4), ga = gl.t * 2.5;
    c.save(); c.globalAlpha = 1 - Math.max(0, gk - 0.55) / 0.45; c.translate(gl.x, gl.y); c.rotate(ga * 0.3); c.beginPath(); for (var gj = 0; gj < 8; gj++) { var rr2 = gj % 2 ? gr * 0.22 : gr, aa2 = gj * Math.PI / 4; c.lineTo(Math.cos(aa2) * rr2, Math.sin(aa2) * rr2); } c.closePath();
    c.fillStyle = gl.hv ? '#ff4a2a' : '#fffbe6'; c.strokeStyle = gl.hv ? 'rgba(80,10,0,0.85)' : 'rgba(80,60,20,0.7)'; c.lineWidth = 0.8; c.fill(); c.stroke(); c.restore();
  }
  for (i = 0; i < W.rings.length; i++) {
    var rg = W.rings[i], u = Math.min(1, 1 - rg.life / rg.max), rr0 = Math.max(0, rg.r1 * (0.25 + 0.75 * Math.sin(u * Math.PI / 2)));   /* (a ring outlived by a long frame drew a negative radius and threw, 2026-10-23) */
    c.strokeStyle = 'rgba(' + rg.c + ',' + (0.85 * (1 - u)) + ')'; c.lineWidth = rg.w * (1 - u * 0.6);
    c.beginPath();
    if (rg.air) c.arc(rg.x, rg.y * K - rg.z, rr0, 0, Math.PI * 2); else c.ellipse(rg.x, rg.y * K, rr0, rr0 * K, 0, 0, Math.PI * 2);
    c.stroke();
  }
  if (sc) { drawNums(c); for (i = 0; i < W.enemies.length; i++) { var eb = W.enemies[i]; if (!eb.dead && !eb.down && eb.showBar > 0 && eb.type !== 'brute') { var by0 = eb.y * K - (eb.human ? 46 : eb.r * 2.6 + 10); bar(c, eb.x - 10, by0, 20, 3, eb.hp / eb.maxHp, eb.side === 1 ? '#7fbf6a' : '#e8584a'); if (eb.side !== 1 && (eb.posture > 0.01 || eb.finish)) bar(c, eb.x - 10, by0 + 5, 20, 1.6, eb.finish ? 1 : eb.posture, eb.finish ? (Math.floor(W.t * 8) % 2 ? '#ffb05a' : '#ff7a2a') : '#e8b04a'); } } }   /* (his balance under his health: POSTURE; flashing when the finishing blow is ready) */
  if (sc && sc.end) sc.end(c, P);
  c.restore();
  if (!(sc && sc.noHud)) drawHud(c);
  if (!(sc && sc.noHotbar)) drawHotbar(c);
  if (sc && sc.boards) sc.boards(c, P);   // a page's boards (bag, menus, the map): over the bars and the hotbar, never under them
}

/* Tuning (2026-10-15, Robin: work through and tune combat against animals, men and many at once). The numbers that decide how a
   fight feels, in one spec with four groups: feel (the hit pause and push of the Snappy preset, the parry's moment and stun, a
   tool's bite), hero (each melee weapon's PROFILES: windup, blow, recovery, reach, arc, damage, push, stagger, step, stamina), men
   (MEN: their health scale, blow, windup, how many strike one man and how far apart, help after how long) and beasts (each kind's
   health, bite, speed, windup and how far it notices you). tuneDefaults() is the spec as the code has it; tune(over) lays a page's
   differences over it and puts every number in place; beastNum(kind) and tuneBeast(e, kind, opts) are how a page dresses a beast
   from it. The Combat Arena edits it live and hands it to the game as 'game.combat'; the game lays that over its own on load.
   BEAST_GAME holds what the game's ANIMALS said a bite does and how far a beast notices you (the arena's beasts did 12 a bite
   whatever they were, until this); health, speed and windup come from the art library's specs and attacks. */
var BEAST_GAME = { boar: { dmg: 14, aggro: 75, speed: 1.1 }, boarYoung: { dmg: 7, aggro: 75, hp: 6, of: 'boar' }, deer: { dmg: 0, aggro: 230 }, snake: { dmg: 6, aggro: 40 }, wolf: { dmg: 22, aggro: 220 }, moose: { dmg: 22, aggro: 60 }, bear: { dmg: 30, aggro: 85 }, troll: { dmg: 40, aggro: 100 }, unge: { dmg: 6, aggro: 0 }, hen: { dmg: 0, aggro: 70, hp: 2, speed: 0.9 }, goat: { dmg: 0, aggro: 36, hp: 8, speed: 1.0 }, sheep: { dmg: 0, aggro: 60, hp: 8, speed: 0.75 }, cow: { dmg: 0, aggro: 45, hp: 20, speed: 0.6 } };   // (the villages' animals, 2026-10-21: a hen or a sheep or a cow never bites, a goat butts for 3)
var HERO_KEYS = ['wu', 'ac', 'rec', 'reach', 'arc', 'dmg', 'kb', 'stag', 'lunge', 'st'], MEN_KEYS = ['hpK', 'dmg', 'wu', 'wuK', 'slots', 'gapHero', 'onHero', 'joinAfter', 'toMen'];
var TUNE0 = null, TUNED = null;
function tuneDefaults() {
  if (TUNE0) return JSON.parse(JSON.stringify(TUNE0));
  var T = { feel: { fz: WPRE.snappy.fz, pf: WPRE.snappy.pf, kb: WPRE.snappy.kb, parryShield: PARRY.shield, parryBare: PARRY.bare, parryStun: MEN.parryStun, chainStun: CHAIN.stun, chainDmg: CHAIN.dmg, chainMax: CHAIN.max, chainAnswer: CHAIN.answer, postureParry: POSTURE.parry, postureDodge: POSTURE.dodge, postureBlock: POSTURE.block, postureHit: POSTURE.hit, rallyShare: RALLY.share, rallyHit: RALLY.perHit, rallyTime: RALLY.time, perfectWin: PERFECT.win, perfectBonus: PERFECT.bonus, toolDmg: TOOL_DMG, shockR: CROWD.shockR, shockT: CROWD.shockT, fearR: CROWD.fearR, fearT: CROWD.fearT, shove: CROWD.shove, shoveD: CROWD.shoveD, shoveT: CROWD.shoveT, shoveSt: CROWD.shoveSt, shoveCd: CROWD.shoveCd }, hero: {}, men: {}, beasts: {} }, k, i;
  for (k in PROFILES) { T.hero[k] = {}; for (i = 0; i < HERO_KEYS.length; i++) T.hero[k][HERO_KEYS[i]] = PROFILES[k][HERO_KEYS[i]]; }
  for (i = 0; i < MEN_KEYS.length; i++) T.men[MEN_KEYS[i]] = MEN[MEN_KEYS[i]];
  for (k in BEAST_GAME) { var g = BEAST_GAME[k], sp = lib && lib.animalSpec ? lib.animalSpec(g.of || k) : null, at = lib && lib.animalAttack ? lib.animalAttack(g.of || k) : null;
    T.beasts[k] = { hp: g.hp != null ? g.hp : (sp ? sp.hp : 10), dmg: g.dmg, speed: g.speed != null ? g.speed : (sp ? sp.speed : 1), windup: +((at && at.windup) || (sp && sp.windup) || 0.4).toFixed(2), aggro: g.aggro }; }
  TUNE0 = T; return JSON.parse(JSON.stringify(T));
}
function tune(over) {
  var T = tuneDefaults(), g, k, q; over = over || {};
  for (g in over) { if (!T[g] || typeof over[g] !== 'object') continue; for (k in over[g]) { q = over[g][k]; if (q && typeof q === 'object') { if (!T[g][k]) continue; for (var kk in q) if (typeof q[kk] === 'number' && T[g][k][kk] != null) T[g][k][kk] = q[kk]; } else if (typeof q === 'number' && T[g][k] != null) T[g][k] = q; } }
  WPRE.snappy.fz = T.feel.fz; WPRE.snappy.pf = T.feel.pf; WPRE.snappy.kb = T.feel.kb; PARRY.shield = T.feel.parryShield; PARRY.bare = T.feel.parryBare; MEN.parryStun = T.feel.parryStun; CHAIN.stun = T.feel.chainStun; CHAIN.dmg = T.feel.chainDmg; CHAIN.max = T.feel.chainMax; CHAIN.answer = T.feel.chainAnswer; POSTURE.parry = T.feel.postureParry; POSTURE.dodge = T.feel.postureDodge; POSTURE.block = T.feel.postureBlock; POSTURE.hit = T.feel.postureHit; RALLY.share = T.feel.rallyShare; RALLY.perHit = T.feel.rallyHit; RALLY.time = T.feel.rallyTime; CROWD.shockR = T.feel.shockR; CROWD.shockT = T.feel.shockT; CROWD.fearR = T.feel.fearR; CROWD.fearT = T.feel.fearT; CROWD.shove = T.feel.shove; CROWD.shoveD = T.feel.shoveD; CROWD.shoveT = T.feel.shoveT; CROWD.shoveSt = T.feel.shoveSt; CROWD.shoveCd = T.feel.shoveCd; PERFECT.win = T.feel.perfectWin; PERFECT.bonus = T.feel.perfectBonus; TOOL_DMG = T.feel.toolDmg;
  for (k in T.hero) if (PROFILES[k]) for (var hk in T.hero[k]) PROFILES[k][hk] = T.hero[k][hk];
  for (k in T.men) MEN[k] = T.men[k];
  TUNED = T; return T;
}
function tuneDiff(T) { var D0 = tuneDefaults(), out = {}, g, k, kk; for (g in T) { for (k in T[g]) { if (typeof T[g][k] === 'object') { for (kk in T[g][k]) if (D0[g] && D0[g][k] && Math.abs(T[g][k][kk] - D0[g][k][kk]) > 1e-9) { out[g] = out[g] || {}; out[g][k] = out[g][k] || {}; out[g][k][kk] = T[g][k][kk]; } } else if (D0[g] && Math.abs(T[g][k] - D0[g][k]) > 1e-9) { out[g] = out[g] || {}; out[g][k] = T[g][k]; } } } return out; }   // what differs from the code's own numbers
function beastNum(k) { if (!TUNED) tune({}); return TUNED.beasts[k] || null; }
function tuneBeast(e, k, o) {         // a beast dressed from the tuned numbers: its health, bite, speed and windup (and how far it notices you, when the page asks)
  var b = beastNum(k); if (!b || !e) return e; o = o || {}; e.bkind = k;   // which beast it is (its cry when struck: 2026-10-20)
  e.hp = e.maxHp = b.hp; e.cfg = e.cfg || {}; e.cfg.dmg = b.dmg; e.cfg.speed = 58 * b.speed;
  if (e.cfg.atk) { e.cfg.atk = Object.assign({}, e.cfg.atk); e.cfg.atk.windup = b.windup; } else e.cfg.windup = b.windup;
  if (o.aggro) e.aggro = b.aggro;
  return e;
}
function init(l) { lib = l; reset(); buildGround(); }
return { HERO_GAIT: HERO_GAIT, LEAP: LEAP, tune: tune, tuneDefaults: tuneDefaults, tuneDiff: tuneDiff, beastNum: beastNum, tuneBeast: tuneBeast, init: init, update: update, render: render, key: key, button: button, mouse: mouse, spawn: spawn, soldier: soldier, armMan: armMan, order: order, way: way, WAYS: WAYS, noise: noise, gawk: gawk, reset: reset, S: S, api: api,
  clear: function () { W.enemies.length = 0; W.projs.length = 0; W.lock = null; },
  hurt: function (e, dmg, ang) { damageEnemy(e, dmg * (e.type === 'soldier' ? MEN.hpK : 1), ang == null ? e.face + Math.PI : ang, 40, 30, 'heavy', { x: e.x, y: e.y, world: true }); },   // something of the world hurts him (a roof coming down, a fire): nobody's blow

  dbg: function () { return { P: P, W: W, IN: IN, S: S }; } };
})();
if (typeof module !== 'undefined') module.exports = Combat;
