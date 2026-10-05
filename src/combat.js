var Combat = (function () {
'use strict';
var AW = 400, AH = 333, K = 0.75, SW = 400, SH = 250;
var lib = null;
var S = { aim: 'soft', ranged: 'mouse', shield: true, juice: true, sound: true, crit: 0.15, weight: 'snappy', look: 'classic' };
var WPRE = {
  snappy: { fz: 0.55, pf: 0.6, kb: 0.9, hs: 0.6, hd: 0.06, kd: 0.5 },
  normal: { fz: 1, pf: 1, kb: 1, hs: 0.3, hd: 0.12, kd: 1 },
  heavy: { fz: 1.35, pf: 1.1, kb: 1.15, hs: 0.25, hd: 0.15, kd: 1.2 }
};
var DASH_T = 0.18;
var api = { sfx: function () {}, facings8: true, harvest: null, onDeath: null, buildSlots: null, beltSlots: null, canShoot: null, onShoot: null, onArrowLand: null, quiver: null, items: null };
// api.items = { held(), tool(i), weapon(kind) } gives the item specs (src/items.js) in the hand, in tool slot i and for 'sword' or 'bow'
function itemOf(fn, a) { if (!api.items || typeof Items === 'undefined' || !api.items[fn]) return null; return api.items[fn](a) || null; }
function dmgMul(kind) { var it = itemOf('weapon', kind); return it ? Items.stats(it).dmg : 1; }   // canShoot()/onShoot(): ammunition; onArrowLand(x, y): a player's arrow that hit nothing; quiver: the count shown by the bow   // beltSlots: [{ n, draw(c) }] shown in free hotbar slots   // buildSlots: [{ name, draw(c) }] for the build-mode hotbar   // onDeath(e): a page hears when an enemy is killed (drops)   // harvest: a page that has trees, rocks and bushes sets { list(x, y, radius), hit(obj, power, rightTool, toolId) }   // facings8: the hero turns on the diagonals and animals turn freely
function sfx(n, v) { if (S.sound) api.sfx(n, v); }

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
var STEPS = [
  { wu: 0.05, ac: 0.09, rec: 0.12, arc: 2.4, reach: 34, blade: 26, dmg: 1, kb: 110, lunge: 85, stag: 10 },
  { wu: 0.05, ac: 0.09, rec: 0.12, arc: 2.4, reach: 34, blade: 26, dmg: 1, kb: 110, lunge: 85, stag: 10 },
  { wu: 0.10, ac: 0.12, rec: 0.26, arc: 3.2, reach: 41, blade: 30, dmg: 2, kb: 220, lunge: 140, stag: 24 }
];

function newWorld() {
  W = { ghosts: [], rings: [], slow: { t: 0, s: 1 }, t: 0, enemies: [], projs: [], parts: [], nums: [], lock: null, kills: 0, dustT: 0,
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
  (api.roster || ['bot', 'bot', 'turret']).forEach(function (t) { spawn(t); });   // a page can choose who starts in the arena
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
  if (wk && !wk(e.x, e.y)) { if (wk(e.x, oy)) e.y = oy; else if (wk(ox, e.y)) e.x = ox; else { e.x = ox; e.y = oy; } }
  for (var i = 0; i < W.pillars.length; i++) {
    var p = W.pillars[i], ox = e.x - p.x, oy = e.y - p.y, d = Math.hypot(ox, oy), min = e.r + p.r;
    if (d < min && d > 0.001) { e.x = p.x + ox / d * min; e.y = p.y + oy / d * min; }
  }
}
function alive(e) { return e && !e.dead; }
function spawn(type) {
  var x, y, tries = 0;
  do { x = 40 + Math.random() * (AW - 80); y = 70 + Math.random() * (AH - 120); tries++; }
  while ((Math.hypot(x - P.x, y - P.y) < 110 || pillarHit(x, y, 20)) && tries < 50);
  var e = { type: type, x: x, y: y, kx: 0, ky: 0, state: 'idle', t: 0, dur: 0, cd: 0.8 + Math.random(), flash: 0, face: Math.PI / 2, aim: Math.PI / 2,
    seed: Math.random() * 10, size: 1, chain: 0, showBar: 0, freezeT: 0, pkx: 0, pky: 0, sq: 0, sqAng: 0, rattle: 0, flashRgb: '255,255,255', dead: false, deadT: 0, dirLock: 0, hitDone: false, stagMeter: 0, sinceHit: 9, attack: '' };
  if (type === 'bot') { e.hp = e.maxHp = 4; e.r = 7; }
  else if (type === 'turret') { e.hp = e.maxHp = 5; e.r = 8; }
  else if (type === 'bossbot') { e.hp = e.maxHp = 32; e.r = 13; e.size = 1.8; }
  else { e.hp = e.maxHp = 26; e.r = 16; }
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
function num(x, y, txt, c, big) { W.nums.push({ x: x, y: y, t: 0, txt: txt, c: c || '#ffffff', big: !!big }); }
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
    var e = W.enemies[i]; if (e.dead) continue;
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
  var list = W.enemies.filter(function (e) { return alive(e) && Math.hypot(e.x - P.x, e.y - P.y) < 300; });
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
function parryWindow() { return S.shield ? 0.22 : 0.12; }
function hurtPlayer(dmg, sx, sy, kind, src) {
  var p = P; if (p.dead || p.invuln > 0) return false;
  var toSrc = Math.atan2(sy - p.y, sx - p.x);
  var front = Math.abs(wrap(toSrc - p.face)) <= (S.shield ? 1.9 : 1.4);
  if (p.guard && front) {
    if (kind !== 'heavy' && p.guardT < parryWindow()) {
      p.parryFx = 0.35; p.st = Math.min(100, p.st + 12);
      spark(p.x + Math.cos(p.face) * 10, p.y + Math.sin(p.face) * 10, 14, '#fff6c8', 140);
      lockFor(p, 0.09); lockFor(src, 0.09); slowmo(0.25, 0.14); ring(p.x + Math.cos(p.face) * 10, p.y, 13, 24, 0.2, '255,243,196', true, 2.4); sfx('parry');
      num(p.x, p.y - 26, 'PARRY!', '#ffe27a');
      return 'parry';
    }
    var red = kind === 'heavy' ? (S.shield ? 0.4 : 0.8) : (S.shield ? 0.12 : 0.55);
    var d2 = dmg * red;
    p.hp -= d2; p.st -= S.shield ? 10 : 18; p.stDelay = 0.8;
    var kbs = kind === 'heavy' ? 110 : 55;
    p.kx = -Math.cos(toSrc) * kbs; p.ky = -Math.sin(toSrc) * kbs;
    spark(p.x + Math.cos(p.face) * 9, p.y + Math.sin(p.face) * 9, 6, '#cfd6e6', 90);
    lockFor(p, 0.035); sfx('block');
    if (d2 > 0.5) num(p.x, p.y - 26, String(Math.round(d2)), '#cfd6e6');
    if (p.st <= 0) { p.st = 0; p.guard = false; p.hurtT = 0.35; num(p.x, p.y - 34, 'GUARD BREAK', '#ff9a7a'); }
    if (p.hp <= 0) die();
    return 'block';
  }
  p.hp -= dmg; p.invuln = 0.7; p.flash = 1; p.hurtT = 0.18; p.guard = false; p.anim.sq = 1; p.anim.sqv = 0;
  p.atk.ph = 'none'; p.atkBuf = 0;
  var kb = kind === 'heavy' ? 170 : 110;
  p.kx = -Math.cos(toSrc) * kb * (S.juice ? 1 : 0.4); p.ky = -Math.sin(toSrc) * kb * (S.juice ? 1 : 0.4);
  spark(p.x, p.y, 8, '#ff8a6a', 100);
  num(p.x, p.y - 28, String(Math.round(dmg)), '#ff7a6a');
  lockFor(p, kind === 'heavy' ? 0.09 : 0.055); if (kind === 'heavy') slowmo(0.3, 0.12); sfx('hurt');
  if (p.hp <= 0) die();
  return 'hit';
}
function die() { P.dead = true; P.hp = 0; P.guard = false; sfx('die'); }

function damageEnemy(e, dmg, ang, kb, stag, kind) {
  if (e.aggro) e.awake = true;   // hitting a calm creature rouses it
  if (e.dead) return;
  var mult = 1, weak = false;
  var bigE = e.type === 'boss' || e.type === 'bossbot';
  if (e.state === 'recover') mult = bigE ? 1.3 : 1.5;
  if (bigE && e.state === 'stunned') mult = 2;
  if (e.type === 'boss') {
    var toP = Math.atan2(P.y - e.y, P.x - e.x);
    if ((kind === 'melee' || kind === 'heavy') && Math.abs(wrap(toP - e.face)) > 2.3) { mult *= 1.8; weak = true; }
  }
  var crit = S.crit > 0 && Math.random() < S.crit;
  if (crit) mult *= 1.5;
  var dealt = dmg * mult;
  e.hp -= dealt; e.showBar = 2.2; e.sinceHit = 0;
  var killing = e.hp <= 0;
  if (S.juice) { e.flash = 1; e.flashRgb = crit ? '255,208,70' : '255,255,255'; }
  var heavy = kind === 'heavy' || weak || stag >= 20, melee = kind === 'melee' || kind === 'heavy';
  var kbm = e.type === 'boss' ? 0.12 : (e.type === 'bossbot' ? 0.3 : (e.type === 'turret' ? 0.15 : 1));
  var hx = e.x - Math.cos(ang) * e.r * 0.8, hy = e.y - Math.sin(ang) * e.r * 0.8;
  var hot = crit ? '255,208,70' : (weak ? '143,227,255' : '255,255,255');
  if (S.juice) {
    var WM = WPRE[S.weight] || WPRE.normal;
    var fz = melee ? ((heavy && !killing) ? 0.09 : 0.055) : 0.025;
    if (crit) fz += 0.015;
    fz *= WM.fz;
    e.freezeT = Math.max(e.freezeT, fz); if (melee) P.freezeT = Math.max(P.freezeT, fz * 0.9 * WM.pf);
    e.pkx = Math.cos(ang) * kb * kbm * WM.kb; e.pky = Math.sin(ang) * kb * kbm * WM.kb;
    e.sq = 1; e.sqAng = ang;
    streaks(hx, hy, ang, (heavy && !killing ? 8 : 5) + (crit ? 4 : 0), heavy ? 260 : 200, crit ? '255,214,90' : null);
    ring(hx, hy, 12, (heavy && !killing) ? 22 : 14, heavy ? 0.16 : 0.12, hot, true, heavy ? 3 : 2);
    if (crit) ring(hx, hy, 12, 28, 0.2, '255,208,70', true, 2.4);
    if (heavy && !killing) slowmo(WM.hs, WM.hd);
  }
  spark(hx, hy, (heavy && !killing ? 12 : 7) + (crit ? 5 : 0), crit ? '#ffd34d' : (weak ? '#8fe3ff' : '#fff3b0'), heavy ? 150 : 110);
  num(e.x, e.y - e.r * 2.2 - 10, String(Math.round(dealt * 5)), crit ? '#ffd34d' : (weak ? '#8fe3ff' : '#ffffff'), heavy || crit);
  sfx((heavy && !killing) ? 'heavyhit' : 'hit', melee ? Math.min(2, P.atk.combo) : 0);
  if (crit) { sfx('crit'); e.rattle = 1.6; }
  if (bigE) {
    if (e.state !== 'stunned') {
      e.stagMeter += stag * (weak ? 2 : 1) * (crit ? 1.25 : 1);
      if (e.stagMeter >= 100) { e.state = 'stunned'; e.t = 0; e.dur = 2.6; e.stagMeter = 100; num(e.x, e.y - 50, 'STAGGERED!', '#ffd34d'); slowmo(0.3, 0.2); ring(e.x, e.y, 0, 60, 0.35, '255,230,140', false, 3); sfx('stagger'); }
    }
  } else if (e.state !== 'lunge' || e.type !== 'bot') {
    if (e.state !== 'recover') { e.state = 'stagger'; e.t = 0; e.dur = 0.34; }
  }
  if (killing) killEnemy(e);
}
function killEnemy(e) {
  var bigK = e.type === 'boss' || e.type === 'bossbot';
  e.dead = true; e.deadT = 0; W.kills++;
  bits(e.x, e.y, bigK ? 22 : 8); spark(e.x, e.y, 9, '#ffd98a', 120);
  slowmo(bigK ? 0.4 : 0.55, (bigK ? 0.16 : 0.08) * (WPRE[S.weight] || WPRE.normal).kd); ring(e.x, e.y, 12, bigK ? 36 : 18, 0.2, '255,226,150', true, 2); sfx('die');
  if (W.lock === e) W.lock = null;
  if (api.onDeath) api.onDeath(e);
  if (e.type === 'boss') num(e.x, e.y - 60, (e.name || 'GUARDIAN') + ' DOWN', '#ffe27a');
  if (e.type === 'bossbot') num(e.x, e.y - 50, (e.name || 'BOSSBOT') + ' DOWN', '#ffe27a');
}
function daze(e, dur) { e.state = 'recover'; e.t = 0; e.dur = dur; }

/* ---------- player ---------- */
function startAttack() {
  var p = P, a = p.atk;
  if (a.ph === 'recover' || a.since < 0.45) a.combo = (a.combo + 1) % 3; else a.combo = 0;
  a.dir = aimAngle(); p.face = a.dir; if (!S.juice) p.faceVis = a.dir;
  a.ph = 'windup'; a.t = 0; a.hit = []; a.tr = null;
  if (p.mode === 'fight') { p.st -= 7; p.stDelay = 0.5; }
  p.guard = false; p.anim.sq = -0.25; p.anim.sqv = 0;
}
function releaseCharge() {
  var p = P, a = p.atk, c = clamp((a.t - 0.3) / 0.7, 0, 1);
  a.combo = 3; a.chg = c; a.dir = aimAngle(); p.face = a.dir; if (!S.juice) p.faceVis = a.dir;
  a.ph = 'windup'; a.t = 0; a.hit = []; a.tr = null; p.st -= 10; p.stDelay = 0.6;
}
function stepData(a) {
  var s;
  if (a.combo === 3) { var c = a.chg || 0; s = { wu: 0.07, ac: 0.14, rec: 0.38, arc: 3.4 + c, reach: 42 + c * 8, blade: 31 + c * 4, dmg: 2 + 1.5 * c, kb: 200 + 150 * c, lunge: 120 + 60 * c, stag: 24 + 16 * c }; }
  else s = STEPS[a.combo];
  if (S.juice) return s;
  return { wu: s.wu * 2.6, ac: s.ac, rec: s.rec * 2.2, arc: s.arc, reach: s.reach, blade: s.blade, dmg: s.dmg, kb: s.kb, lunge: 0, stag: s.stag };
}
function gapAhead(dir) {
  var g = 999;
  for (var i = 0; i < W.enemies.length; i++) {
    var e = W.enemies[i]; if (e.dead) continue;
    var dx = e.x - P.x, dy = e.y - P.y;
    if (Math.abs(wrap(Math.atan2(dy, dx) - dir)) < 1.0) g = Math.min(g, Math.hypot(dx, dy) - e.r - P.r);
  }
  return g;
}
function collideBodies() {
  var p = P; if (p.dead || p.roll.t > 0) return;
  for (var i = 0; i < W.enemies.length; i++) {
    var e = W.enemies[i]; if (e.dead) continue;
    var dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), mn = p.r + e.r;
    if (d < mn && d > 0.01) {
      var ov = mn - d, share = e.type === 'turret' ? 1 : (e.type === 'boss' ? 0.85 : (e.type === 'bossbot' ? 0.7 : 0.45)), nx = dx / d, ny = dy / d;
      moveCircle(p, nx * ov * share, ny * ov * share);
      if (e.type !== 'turret') moveCircle(e, -nx * ov * (1 - share), -ny * ov * (1 - share));
    }
  }
}
function updateAnim(dt, dashing) {
  var p = P, an = p.anim;
  var sp = Math.min(200, Math.hypot(p.vx, p.vy * K));
  var target = dashing ? 1 : Math.min(1, sp / 105);
  an.amt += (target - an.amt) * Math.min(1, dt * (target > an.amt ? 14 : 9));
  var hs = S.look === 'classic' ? lib.hero().spec : null;
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
  var bowOut = p.mode === 'fight' && p.weapon === 'ranged';
  if ((IN.pressed.lmb || IN.pressed.KeyJ) && !bowOut && p.mode !== 'build') p.atkBuf = S.juice ? 0.2 : 0.02;   // buffered during a hit pause, so the swing still comes
  if (IN.pressed.Space) p.dashBuf = 0.18;
  if (p.freezeT > 0) {
    p.freezeT -= dt; p.atkBuf = Math.max(0, p.atkBuf - dt); p.dashBuf = Math.max(0, p.dashBuf - dt);
    return;
  }
  p.animT += dt;
  p.invuln = Math.max(0, p.invuln - dt); p.flash = Math.max(0, p.flash - dt * 4); p.hurtT = Math.max(0, p.hurtT - dt);
  p.fireCd = Math.max(0, p.fireCd - dt); p.fireT = Math.max(0, p.fireT - dt); p.roll.cd = Math.max(0, p.roll.cd - dt); p.parryFx = Math.max(0, p.parryFx - dt);
  p.stDelay -= dt; if (p.stDelay <= 0) p.st = Math.min(100, p.st + 34 * dt);
  var ix = (IN.keys.KeyD ? 1 : 0) - (IN.keys.KeyA ? 1 : 0), iy = (IN.keys.KeyS ? 1 : 0) - (IN.keys.KeyW ? 1 : 0);
  var il = Math.hypot(ix, iy); if (il > 0) { ix /= il; iy /= il; }
  p.inAng = il > 0 ? Math.atan2(iy, ix) : null;
  p.moving = il > 0 && p.hurtT <= 0;

  p.atkBuf = Math.max(0, p.atkBuf - dt); p.dashBuf = Math.max(0, p.dashBuf - dt);
  var bow = p.mode === 'fight' && p.weapon === 'ranged';
  if ((IN.pressed.lmb || IN.pressed.KeyJ) && !bow && p.mode !== 'build') p.atkBuf = S.juice ? 0.2 : 0.02;
  if (IN.pressed.Space) p.dashBuf = 0.18;
  // B enters and leaves build mode; Q swaps fight and gather (and leaves build mode for fight)
  if (IN.pressed.KeyB) { if (p.mode === 'build') p.mode = p.lastMode || 'fight'; else { p.lastMode = p.mode; p.mode = 'build'; } p.wreck = false; a.ph = 'none'; a.since = 9; a.tr = null; p.atkBuf = 0; p.holdT = 0; p.guard = false; W.lock = null; sfx('tele'); }
  if (IN.pressed.KeyQ) { if (p.mode === 'build') { p.mode = 'fight'; p.wreck = false; sfx('tele'); } else switchMode(); }
  bow = p.mode === 'fight' && p.weapon === 'ranged';
  if (IN.pressed.KeyF) {
    if (p.mode === 'fight') { p.weapon = p.weapon === 'melee' ? 'ranged' : 'melee'; a.ph = 'none'; a.since = 9; p.atkBuf = 0; p.holdT = 0; bow = p.weapon === 'ranged'; sfx('tele'); }
    else if (p.mode === 'build') p.wreck = !p.wreck;      // F in build mode: the red crossed box that takes pieces down
  }
  for (i = 1; i <= 6; i++) if (IN.pressed['Digit' + i]) { if (p.mode === 'gather' && i <= TOOLS.length) p.tool = i - 1; else if (p.mode === 'fight') p.sel = i - 1; }
  if (IN.pressed.ControlLeft || IN.pressed.ControlRight) cycleLock();

  var held = (IN.lmb || IN.keys.KeyJ) && p.mode === 'fight' && !bow;
  p.holdT = held ? p.holdT + dt : 0;
  if (a.ph === 'charge' && (IN.rmb || IN.keys.KeyK)) { a.ph = 'none'; a.since = 9; }
  // guard
  var want = (IN.rmb || IN.keys.KeyK) && p.mode === 'fight';
  if (want && !p.guard && a.ph === 'none' && p.roll.t <= 0 && p.hurtT <= 0 && p.st > 0 && p.atkBuf <= 0) {
    p.guard = true; p.guardT = (W.t - p.lastRaise > 0.5) ? 0 : 99; p.lastRaise = W.t; sfx('raise');
  }
  if (!want && p.guard) p.guard = false;
  if (p.guard) p.guardT += dt;

  // roll
  if (p.dashBuf > 0 && p.roll.cd <= 0 && p.roll.t <= 0 && p.hurtT <= 0 && p.st >= 18) {
    p.dashBuf = 0;
    p.st -= 18; p.stDelay = 0.5; p.guard = false; a.ph = 'none'; a.since = 0; p.atkBuf = 0;
    var rx = il > 0 ? ix : -Math.cos(p.face), ry = il > 0 ? iy : -Math.sin(p.face);
    p.roll.t = DASH_T; p.roll.dx = rx; p.roll.dy = ry; p.roll.cd = 0.08; p.invuln = Math.max(p.invuln, 0.16); p.ghostT = 0; p.anim.sq = -0.6; p.anim.sqv = 0;
    dust(p.x, p.y, 7); sfx('dash');
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
  // attack
  if (p.atkBuf > 0 && p.roll.t <= 0 && p.hurtT <= 0 && (p.mode === 'gather' || p.st >= 7)) {
    var can = a.ph === 'none' || (S.juice && a.ph === 'recover' && a.t >= stepData(a).rec * 0.5);
    if (can) { startAttack(); p.atkBuf = 0; }
  }
  if (a.ph === 'none') a.since += dt;
  else if (a.ph !== 'charge') {
    var sd = stepData(a);
    a.t += dt;
    if (a.ph === 'windup' && a.t >= sd.wu) { a.ph = 'active'; a.t = 0; sfx('swing'); if (S.juice && lookSpec().atkStyle >= 2) dust(p.x, p.y, 3); }
    else if (a.ph === 'active') {
      var u = Math.min(1, a.t / sd.ac);
      var half = sd.arc / 2, sign = (a.combo % 2 === 0) ? 1 : -1;
      var ang = a.dir - half * sign + sd.arc * sign * u;
      a.tr = { start: a.dir - half * sign, cur: ang, age: 0, reach: 9 + sd.blade, sign: sign, hot: a.combo === 3 && a.chg > 0.6 };
      if (p.mode === 'gather') {                      // tools hit trees, rocks and bushes, never enemies
        var hv = api.harvest, tl = TOOLS[p.tool], ti = itemOf('tool', p.tool), tpow = ti ? Items.stats(ti).power : tl.dmg;
        var objs = hv && !(api.items && !ti) ? hv.list(p.x, p.y, 90) : [];   // no tool in the slot, nothing to swing
        for (i = 0; i < objs.length; i++) {
          var o = objs[i];
          if (a.hit.indexOf(o) >= 0) continue;
          var ox = o.x - p.x, oy = o.y - p.y, od = Math.hypot(ox, oy);
          if (od <= sd.reach + (o.r || 8) + 2 && Math.abs(wrap(Math.atan2(oy, ox) - a.dir)) <= half + 0.12) {
            a.hit.push(o);
            var right = o.kind === tl.good, pw = tpow * (right ? 1 : 0.5) * (a.combo >= 2 ? 1.5 : 1);
            hv.hit(o, pw, right, tl.id);
            num(o.x, o.y, (right ? '' : 'wrong tool  ') + (Math.round(pw * 10) / 10), right ? '#ffffff' : '#ffd34d', a.combo >= 2);
          }
        }
      } else for (i = 0; i < W.enemies.length; i++) {
        var e = W.enemies[i];
        if (e.dead || a.hit.indexOf(e) >= 0) continue;
        var dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
        if (d <= sd.reach + e.r + 2 && Math.abs(wrap(Math.atan2(dy, dx) - a.dir)) <= half + 0.12) {
          a.hit.push(e);
          damageEnemy(e, sd.dmg * dmgMul('sword'), Math.atan2(dy, dx), sd.kb, sd.stag, a.combo >= 2 ? 'heavy' : 'melee');
        }
      }
      if (a.t >= sd.ac) { a.ph = 'recover'; a.t = 0; }
    } else if (a.ph === 'recover' && a.t >= sd.rec) { a.ph = 'none'; a.t = 0; a.since = 0; }
  }
  if (a.tr) { if (a.ph === 'recover' || a.ph === 'none') a.tr.age += dt; if (a.tr.age > 0.18) a.tr = null; }

  // ranged
  if (bow && (IN.lmb || IN.keys.KeyJ) && p.fireCd <= 0 && p.st >= 6 && p.roll.t <= 0 && p.hurtT <= 0 && a.ph === 'none' && (!api.canShoot || api.canShoot())) {
    p.fireCd = 0.45; if (api.onShoot) api.onShoot(); p.fireT = 0.2; p.st -= 6; p.stDelay = 0.4;
    var fa = rangedAngle();
    p.face = fa; p.fireAng = fa; if (!S.juice) p.faceVis = fa;
    W.projs.push({ x: p.x + Math.cos(fa) * 8, y: p.y + Math.sin(fa) * 8, vx: Math.cos(fa) * 240, vy: Math.sin(fa) * 240, r: 3.5, dmg: dmgMul('bow'), owner: 'player', life: 1.0, ang: fa });
    spark(p.x + Math.cos(fa) * 10, p.y + Math.sin(fa) * 10, 3, '#ffe9a0', 60);
    if (S.juice) { p.kx -= Math.cos(fa) * 30; p.ky -= Math.sin(fa) * 30; }
    sfx('shoot');
  }

  // facing
  var target = p.face;
  if (a.ph !== 'none' && a.ph !== 'charge' && !(a.ph === 'recover' && il > 0)) target = a.dir;
  else if (lockValid()) target = Math.atan2(W.lock.y - p.y, W.lock.x - p.x);
  else if (il > 0) target = Math.atan2(iy, ix);
  p.face = turnToward(p.face, target, S.juice ? dt * 30 : 99);
  p.faceVis = turnToward(p.faceVis, p.face, S.juice ? dt * 42 : 99);

  // movement
  var sprint = (IN.keys.ShiftLeft || IN.keys.ShiftRight) && il > 0 && a.ph === 'none' && !p.guard && p.roll.t <= 0 && p.hurtT <= 0 && !p.sprintLock && p.st > 0;
  if (p.st <= 0.5) p.sprintLock = true; else if (p.st >= 14) p.sprintLock = false;
  p.sprinting = !!sprint;
  var spd = 118;
  if (sprint) { spd *= 1.55; p.st = Math.max(0, p.st - 22 * dt); p.stDelay = Math.max(p.stDelay, 0.55); }
  if (p.guard) spd *= 0.55;
  if (a.ph === 'windup' || a.ph === 'active') spd *= 0.55; else if (a.ph === 'recover') spd *= 0.9; else if (a.ph === 'charge') spd *= 0.6;
  var tvx = ix * spd, tvy = iy * spd;
  if (p.roll.t > 0) {
    p.roll.t -= dt;
    if (p.roll.t <= 0) { p.anim.sq = 0.9; p.anim.sqv = 0; }
    var rs = 460 * (0.25 + 0.75 * Math.max(0, p.roll.t) / DASH_T);
    p.ghostT -= dt; if (p.ghostT <= 0 && S.juice) { p.ghostT = 0.035; W.ghosts.push({ x: p.x, y: p.y, dir: heroDir(), t: p.animT, ph: p.anim.phase, life: 0.22, max: 0.22 }); }
    p.vx = p.roll.dx * rs; p.vy = p.roll.dy * rs;
  } else if (p.hurtT > 0) { p.vx *= Math.exp(-dt * 8); p.vy *= Math.exp(-dt * 8); }
  else if (S.juice) { var k = Math.min(1, dt * 15); p.vx += (tvx - p.vx) * k; p.vy += (tvy - p.vy) * k; }
  else { p.vx = tvx; p.vy = tvy; }
  var lvx = 0, lvy = 0;
  if (a.ph === 'active' && P.mode !== 'gather') { var sd2 = stepData(a), lf = clamp((gapAhead(a.dir) - 3) / 14, 0, 1); lvx = Math.cos(a.dir) * sd2.lunge * lf; lvy = Math.sin(a.dir) * sd2.lunge * lf; }
  p.kx *= Math.exp(-dt * 10); p.ky *= Math.exp(-dt * 10);
  moveCircle(p, (p.vx + lvx + p.kx) * dt, (p.vy + lvy + p.ky) * dt);
  updateAnim(dt, p.roll.t > 0);
  if (S.juice && p.moving && p.roll.t <= 0) { W.dustT -= dt; if (W.dustT <= 0) { W.dustT = p.sprinting ? 0.07 : 0.14; dust(p.x, p.y, p.sprinting ? 2 : 1); } }
}

/* ---------- enemies ---------- */
// A creature from the Creature Editor can carry its own numbers in e.cfg; plain bots use these.
var BOT_CFG = { speed: 58, windup: 0.55, lunge: 175 };
function botAI(e, dt, d, ang) {
  var cf = e.cfg || BOT_CFG, sk = cf.speed / 58;
  e.cd -= dt;
  switch (e.state) {
    case 'idle': if (d < 130 && !P.dead) { e.state = 'chase'; e.t = 0; } break;
    case 'chase':
      e.face = ang;
      if (d > 52) moveCircle(e, Math.cos(ang) * cf.speed * dt, Math.sin(ang) * cf.speed * dt);
      else if (d < 30) moveCircle(e, -Math.cos(ang) * 45 * sk * dt, -Math.sin(ang) * 45 * sk * dt);
      else { var sd = e.seed > 5 ? 1 : -1; moveCircle(e, Math.cos(ang + sd * 1.57) * 30 * sk * dt, Math.sin(ang + sd * 1.57) * 30 * sk * dt); }
      if (d < 56 && e.cd <= 0 && !P.dead) { e.state = 'windup'; e.t = 0; e.dur = cf.windup; e.dirLock = ang; sfx('tele'); }
      break;
    case 'windup': e.face = e.dirLock; if (e.t >= e.dur) { e.state = 'lunge'; e.t = 0; e.dur = 0.22; e.hitDone = false; } break;
    case 'lunge':
      moveCircle(e, Math.cos(e.dirLock) * cf.lunge * dt, Math.sin(e.dirLock) * cf.lunge * dt);
      if (!e.hitDone && Math.hypot(P.x - e.x, P.y - e.y) < e.r + P.r + 3) {
        e.hitDone = true;
        var r = hurtPlayer(12, e.x, e.y, 'melee', e);
        if (r === 'parry') daze(e, 1.5);
      }
      if (e.state === 'lunge' && e.t >= e.dur) { e.state = 'recover'; e.t = 0; e.dur = 0.8; }
      break;
    case 'recover': if (e.t >= e.dur) { e.state = 'chase'; e.t = 0; e.cd = 1.1; } break;
    case 'stagger': if (e.t >= e.dur) { e.state = 'chase'; e.t = 0; e.cd = 0.6; } break;
  }
}
function turretAI(e, dt, d, ang) {
  e.cd -= dt;
  switch (e.state) {
    case 'idle':
      e.aim = turnToward(e.aim, ang, dt * 2.2);
      if (e.cd <= 0 && d < 320 && !P.dead) { e.state = 'windup'; e.t = 0; e.dur = 0.8; e.dirLock = e.aim; sfx('tele'); }
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
function bossAI(e, dt, d, ang) {
  e.cd -= dt; e.sinceHit += dt;
  if (e.state !== 'stunned' && e.sinceHit > 1.5) e.stagMeter = Math.max(0, e.stagMeter - 8 * dt);
  switch (e.state) {
    case 'idle': if (d < 280 && !P.dead) { e.state = 'chase'; e.t = 0; } break;
    case 'chase':
      e.face = turnToward(e.face, ang, dt * 2.4);
      if (d > 48) moveCircle(e, Math.cos(e.face) * 30 * dt, Math.sin(e.face) * 30 * dt);
      if (e.cd <= 0 && d < 100 && !P.dead) {
        e.attack = (d < 60 || Math.random() < 0.45) ? 'slam' : 'sweep';
        e.state = 'windup'; e.t = 0; e.dur = e.attack === 'slam' ? 1.0 : 0.8; e.dirLock = ang; e.face = ang; e.hitDone = false; sfx('tele');
      }
      break;
    case 'windup':
      if (e.t >= e.dur) {
        e.state = 'active'; e.t = 0; e.dur = 0.14; e.hitDone = false;
        if (e.attack === 'slam') { ring(e.x, e.y, 0, 52, 0.32, '255,226,160', false, 3); sfx('slam'); spark(e.x, e.y, 16, '#ffd98a', 150); dust(e.x, e.y, 14); }
        else sfx('swing');
      }
      break;
    case 'active':
      if (!e.hitDone) {
        var dx = P.x - e.x, dy = P.y - e.y, dd = Math.hypot(dx, dy), res = false;
        if (e.attack === 'slam' && dd <= 40 + P.r) { e.hitDone = true; res = hurtPlayer(24, e.x, e.y, 'heavy', e); }
        else if (e.attack === 'sweep' && dd <= 50 + P.r && Math.abs(wrap(Math.atan2(dy, dx) - e.dirLock)) <= 1.75) { e.hitDone = true; res = hurtPlayer(16, e.x, e.y, 'melee', e); }
        if (res === 'parry' && e.state === 'active') { e.stagMeter += 50; if (e.stagMeter >= 100) { e.state = 'stunned'; e.t = 0; e.dur = 2.6; e.stagMeter = 100; num(e.x, e.y - 50, 'STAGGERED!', '#ffd34d'); } else daze(e, 1.0); }
      }
      if (e.state === 'active' && e.t >= e.dur) { e.state = 'recover'; e.t = 0; e.dur = e.attack === 'slam' ? 1.1 : 0.7; }
      break;
    case 'recover': if (e.t >= e.dur) { e.state = 'chase'; e.t = 0; e.cd = 1.2; } break;
    case 'stunned': if (e.t >= e.dur) { e.state = 'chase'; e.t = 0; e.cd = 1.0; e.stagMeter = 0; } break;
  }
}
function stunBig(e) { e.state = 'stunned'; e.t = 0; e.dur = 2.2; e.stagMeter = 100; num(e.x, e.y - e.r * 2 - 14, 'STAGGERED!', '#ffd34d'); sfx('stagger'); }
function bossbotAI(e, dt, d, ang) {
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
        e.state = 'windup'; e.t = 0; e.dur = e.attack === 'lunge' ? 0.7 : (e.attack === 'chain' ? 0.45 : 0.65); e.dirLock = ang; e.hitDone = false; sfx('tele');
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
        if (rs === 'parry') { e.stagMeter += 40; if (e.stagMeter >= 100) stunBig(e); else daze(e, 1.2); }
      }
      if (e.state === 'lunge' && e.t >= e.dur) {
        e.chain--;
        if (e.chain > 0) { e.dirLock = ang; e.state = 'windup'; e.t = 0; e.dur = 0.36; e.hitDone = false; sfx('tele'); }
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
// A calm animal with e.wander = { x0, y0, r } ambles between points near its home ground, pausing between walks.
function wanderStep(e, dt) {
  var w = e.wander;
  if (w.wait > 0) { w.wait -= dt; e.state = 'idle'; return; }
  if (w.tx == null) { var a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * w.r; w.tx = w.x0 + Math.cos(a) * r; w.ty = w.y0 + Math.sin(a) * r; w.tt = 7; }
  w.tt -= dt;
  if (w.tt <= 0 || Math.hypot(w.tx - e.x, w.ty - e.y) < 6) { w.tx = null; w.wait = 1.5 + Math.random() * 4; e.state = 'idle'; return; }
  var ang = Math.atan2(w.ty - e.y, w.tx - e.x), sp = (e.cfg ? e.cfg.speed : 58) * 0.38, ox = e.x, oy = e.y;
  e.face = turnToward(e.face, ang, dt * 3);
  moveCircle(e, Math.cos(e.face) * sp * dt, Math.sin(e.face) * sp * dt);
  if (Math.hypot(e.x - ox, e.y - oy) < sp * dt * 0.25) { w.tx = null; w.wait = 1; }   // something is in the way: try elsewhere
  e.state = 'chase';
}
function updateEnemies(dt) {
  for (var i = 0; i < W.enemies.length; i++) {
    var e = W.enemies[i];
    if (e.dead) { e.deadT += dt; continue; }
    e.flash = Math.max(0, e.flash - dt * 6); e.showBar = Math.max(0, e.showBar - dt);
    if (e.hold) { e.state = 'idle'; e.kx = e.ky = 0; continue; }
    if (e.aggro) {                       // set by the Creature Editor: calm until the hero is within e.aggro, calm again once he is far away
      var gd = Math.hypot(P.x - e.x, P.y - e.y), ga = Math.atan2(P.y - e.y, P.x - e.x);
      if (!e.awake && gd < e.aggro && !P.dead) e.awake = true;
      else if (e.awake && gd > e.aggro * 2.6 && (e.state === 'chase' || e.state === 'idle')) e.awake = false;
      if (e.flee) {                      // a grazer bolts instead of fighting
        if (e.awake && !P.dead) { var fs2 = (e.cfg ? e.cfg.speed : 58) * 1.5; e.state = 'chase'; e.t += dt; e.face = ga + Math.PI; moveCircle(e, -Math.cos(ga) * fs2 * dt, -Math.sin(ga) * fs2 * dt); }
        else e.state = 'idle';
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
    if (e.type !== 'turret' && Math.abs(e.kx) + Math.abs(e.ky) > 1) {
      moveCircle(e, e.kx * dt, e.ky * dt);
      if (S.juice && Math.abs(e.kx) + Math.abs(e.ky) > 70 && Math.random() < dt * 22) dust(e.x, e.y, 1);
    }
    if (P.dead) { if (e.state !== 'idle' && e.state !== 'recover') { e.state = 'idle'; } if (e.type !== 'boss' && e.state === 'idle') continue; }
    if (e.type === 'bot') botAI(e, adt, d, ang); else if (e.type === 'bossbot') bossbotAI(e, adt, d, ang); else if (e.type === 'turret') turretAI(e, adt, d, ang); else bossAI(e, adt, d, ang);
  }
  W.enemies = W.enemies.filter(function (e) { return !(e.dead && e.deadT > 0.5); });
  // soft separation
  for (var a = 0; a < W.enemies.length; a++) for (var b = a + 1; b < W.enemies.length; b++) {
    var A = W.enemies[a], B = W.enemies[b]; if (A.dead || B.dead || A.type === 'turret' || B.type === 'turret') continue;
    var ox = B.x - A.x, oy = B.y - A.y, dd = Math.hypot(ox, oy), mn = A.r + B.r;
    if (dd < mn && dd > 0.01) { var push = (mn - dd) * 0.5; moveCircle(A, -ox / dd * push, -oy / dd * push); moveCircle(B, ox / dd * push, oy / dd * push); }
  }
}
function updateProjs(dt) {
  for (var i = W.projs.length - 1; i >= 0; i--) {
    var pr = W.projs[i];
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
    var SB = api.scene && api.scene.bounds, hit = false;   // a page with a big world has its own edges
    var gone = pr.life <= 0 || (SB ? (pr.x < SB.x0 || pr.x > SB.x1 || pr.y < SB.y0 || pr.y > SB.y1) : (pr.x < 8 || pr.x > AW - 8 || pr.y < 30 || pr.y > AH - 6));
    if (!gone && pillarHit(pr.x, pr.y, pr.r)) { gone = true; spark(pr.x, pr.y, 4, '#ffe9a0', 60); }
    if (!gone) {
      if (pr.owner === 'enemy') {
        if (Math.hypot(pr.x - P.x, pr.y - P.y) < pr.r + P.r) {
          var res = hurtPlayer(pr.dmg, pr.x - pr.vx * 0.05, pr.y - pr.vy * 0.05, 'proj', pr);
          if (res === 'parry') { pr.owner = 'player'; pr.vx *= -1.4; pr.vy *= -1.4; pr.dmg = 3; pr.life = 3; pr.ang += Math.PI; pr.reflected = true; }
          else if (res) gone = true;
        }
      } else {
        for (var j = 0; j < W.enemies.length; j++) {
          var e = W.enemies[j];
          if (e.dead) continue;
          if (Math.hypot(pr.x - e.x, pr.y - e.y) < pr.r + e.r) { damageEnemy(e, pr.dmg, Math.atan2(pr.vy, pr.vx), 40, 8, 'proj'); gone = true; hit = true; break; }
        }
      }
    }
    if (gone) { W.projs.splice(i, 1); if (!hit && pr.owner === 'player' && !pr.reflected && api.onArrowLand) api.onArrowLand(pr.x, pr.y); }
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
  if (IN.pressed.KeyR && P.dead) { reset(); }
  if (IN.pressed.KeyH && !P.dead && W.enemies.length < 14) spawn('bot');
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

function drawGear(c, cx, cy, r, rot, fill) {
  var n = 6, first = true;
  c.beginPath();
  for (var i = 0; i < n; i++) {
    var a = rot + i * Math.PI * 2 / n;
    var pts = [[a - 0.22, r], [a - 0.14, r + 2], [a + 0.14, r + 2], [a + 0.22, r]];
    for (var j = 0; j < pts.length; j++) {
      var px = cx + Math.cos(pts[j][0]) * pts[j][1], py = cy + Math.sin(pts[j][0]) * pts[j][1];
      if (first) { c.moveTo(px, py); first = false; } else c.lineTo(px, py);
    }
  }
  c.closePath(); lib.fs(c, fill, 1.4);
  lib.ell(c, cx, cy, r * 0.35, r * 0.35, '#5a4a68', 0.9);
}
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

function drawBot(c, e) {
  var t = W.t, wob = Math.sin(t * 6 + e.seed) * 0.5, sqx = 1, sqy = 1, jx = 0;
  if (e.state === 'windup') { var k = e.t / e.dur; sqx = 1 + 0.22 * k; sqy = 1 - 0.22 * k; jx = Math.sin(e.t * 70) * 0.9; }
  else if (e.state === 'lunge') { sqx = 0.8; sqy = 1.25; }
  else if (e.state === 'stagger') { sqx = 1.2; sqy = 0.8; }
  var sz = e.size || 1;
  c.translate(jx, 0); c.scale(sqx * sz, sqy * sz);
  var col = e.state === 'windup' ? '#e8603a' : (e.state === 'recover' || e.state === 'stunned' ? '#b6a592' : (e.type === 'bossbot' ? '#a85a33' : '#c9733f'));
  lib.rr(c, -6.5, -3.5, 5, 3.8, 1.6, '#6b4a35', 1.4); lib.rr(c, 1.5, -3.5, 5, 3.8, 1.6, '#6b4a35', 1.4);
  lib.ell(c, 0, -9 + wob, 8.8, 7.6, col, 1.8);
  lib.ell(c, -3, -12.6 + wob, 4, 2, 'rgba(255,255,255,0.3)', 0);
  lib.ell(c, -6, -8 + wob, 0.9, 0.9, '#e0a93a', 0.8); lib.ell(c, 6, -8 + wob, 0.9, 0.9, '#e0a93a', 0.8);
  lib.ell(c, 0, -9.5 + wob, 4.6, 4.4, '#fff7e8', 1.4);
  if (e.state === 'recover' || e.state === 'stunned') {
    c.strokeStyle = '#3a2a36'; c.lineWidth = 1.3; c.beginPath();
    c.moveTo(-2.4, -11.6 + wob); c.lineTo(2.4, -7.4 + wob); c.moveTo(2.4, -11.6 + wob); c.lineTo(-2.4, -7.4 + wob); c.stroke();
    for (var i = 0; i < 3; i++) { var a = t * 5 + i * 2.09; lib.ell(c, Math.cos(a) * 8, -21 + Math.sin(a) * 2.5, 1.5, 1.5, '#ffd34d', 0.9); }
  } else {
    var ang = Math.atan2((P.y - e.y) * K, P.x - e.x);
    var px = Math.cos(ang) * 1.7, py = Math.sin(ang) * 1.5;
    lib.ell(c, px, -9.5 + py + wob, 2.1, 2.3, '#2a1c2a', 0);
    lib.ell(c, px - 0.7, -10.4 + py + wob, 0.7, 0.7, '#ffffff', 0);
  }
  drawGear(c, 0, -18.5 + wob, 3.2, t * 2 + e.seed, '#e0a93a');
  if (e.type === 'bossbot') {
    c.strokeStyle = '#3a2a36'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-6, -14 + wob); c.lineTo(0, -11.6 + wob); c.lineTo(6, -14 + wob); c.stroke();
    lib.ell(c, -8.5, -14.5 + wob, 1.6, 1.6, '#e0a93a', 0.9); lib.ell(c, 8.5, -14.5 + wob, 1.6, 1.6, '#e0a93a', 0.9);
    drawGear(c, -6.5, -17 + wob, 2.2, -t * 2.4, '#e8b447'); drawGear(c, 6.5, -17 + wob, 2.2, -t * 2.4 + 1, '#e8b447');
  }
  if (e.state === 'windup') {
    lib.ell(c, 0, -30, 4.4, 4.4, '#ffd34d', 1.5);
    c.fillStyle = '#3a2a36'; c.font = 'bold 7px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('!', 0, -27.4);
  }
}
function drawTurret(c, e) {
  var ca = Math.cos(e.aim), sa = Math.sin(e.aim) * K, wu = e.state === 'windup' ? e.t / e.dur : 0;
  lib.rr(c, -9, -6, 18, 7, 2.5, '#5f5b70', 1.8);
  lib.rr(c, -7, -12, 14, 8, 2, '#7a7690', 1.6);
  var behind = sa < 0;
  function barrel() {
    c.lineCap = 'round';
    c.strokeStyle = '#3a2a36'; c.lineWidth = 6.4; c.beginPath(); c.moveTo(0, -14); c.lineTo(ca * 12, -14 + sa * 12); c.stroke();
    c.strokeStyle = wu > 0 ? 'rgb(' + Math.round(150 + 100 * wu) + ',' + Math.round(130 - 40 * wu) + ',90)' : '#8a86a0'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -14); c.lineTo(ca * 12, -14 + sa * 12); c.stroke();
    if (wu > 0) lib.ell(c, ca * 13, -14 + sa * 13, 1.5 + wu * 2.5, 1.5 + wu * 2.5, '#ffb347', 0);
  }
  if (behind) barrel();
  lib.ell(c, 0, -14, 7.2, 6.2, '#e0a93a', 1.8);
  lib.ell(c, -2, -16, 3, 1.8, 'rgba(255,255,255,0.4)', 0);
  if (!behind) barrel();
  if (e.state === 'recover') for (var i = 0; i < 3; i++) lib.ell(c, ca * 14 + (i - 1) * 2, -16 - (e.t * 24) - i * 3, 2 + e.t * 3, 2 + e.t * 3, 'rgba(255,255,255,' + (0.7 - e.t) + ')', 0);
  if (e.state === 'windup') {
    lib.ell(c, 0, -26, 4.4, 4.4, '#ffd34d', 1.5);
    c.fillStyle = '#3a2a36'; c.font = 'bold 7px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('!', 0, -23.4);
  }
}
function drawBoss(c, e) {
  var t = W.t, back = Math.sin(e.face) < -0.25, sway = Math.sin(t * 2) * 0.7;
  var k = e.state === 'windup' ? e.t / e.dur : 0;
  var hot = e.state === 'windup' || e.state === 'active';
  var stun = e.state === 'stunned';
  var body = stun ? '#9a96b0' : '#7b7790';
  lib.rr(c, -15, -13, 12, 13, 3, '#55516a', 2); lib.rr(c, 3, -13, 12, 13, 3, '#55516a', 2);
  var fistL = [-24, -22], fistR = [24, -22];
  if (e.attack === 'slam' && hot) { var up = e.state === 'windup' ? k : 0; fistL = [-22, -22 - 30 * up]; fistR = [22, -22 - 30 * up]; }
  if (e.attack === 'sweep' && hot) { var sw = e.state === 'windup' ? -k * 0.8 : 1; fistR = [24 + 12 * sw, -22 - 4 * sw]; fistL = [-26 - 10 * (e.state === 'windup' ? k : 0), -24]; }
  function arms() {
    c.strokeStyle = '#3a2a36'; c.lineWidth = 8.6; c.beginPath(); c.moveTo(-17, -32); c.lineTo(fistL[0], fistL[1]); c.moveTo(17, -32); c.lineTo(fistR[0], fistR[1]); c.stroke();
    c.strokeStyle = '#6a6682'; c.lineWidth = 6; c.beginPath(); c.moveTo(-17, -32); c.lineTo(fistL[0], fistL[1]); c.moveTo(17, -32); c.lineTo(fistR[0], fistR[1]); c.stroke();
    lib.ell(c, fistL[0], fistL[1], 7, 6.5, '#e0a93a', 1.8); lib.ell(c, fistR[0], fistR[1], 7, 6.5, '#e0a93a', 1.8);
  }
  if (back) arms();
  lib.ell(c, 0, -29 + sway, 22, 19.5, body, 2.2);
  lib.ell(c, -7, -38 + sway, 10, 5, 'rgba(255,255,255,0.18)', 0);
  lib.rr(c, -20, -25 + sway, 40, 5, 2, '#e0a93a', 1.6);
  if (!back) {
    drawGear(c, 0, -31 + sway, 6.5, t * 0.8, '#e8b447');
    var glow = hot ? '#ff7a3a' : (stun ? '#6a6682' : '#ffd34d');
    lib.rr(c, -11, -44 + sway, 8, 3.4, 1.5, glow, 1.2); lib.rr(c, 3, -44 + sway, 8, 3.4, 1.5, glow, 1.2);
  } else {
    lib.rr(c, -10, -42 + sway, 20, 17, 3, '#5a5670', 1.8);
    var pulse = 0.6 + 0.4 * Math.sin(t * 6);
    lib.ell(c, 0, -33 + sway, 6, 6, 'rgb(' + Math.round(110 + 60 * pulse) + ',' + Math.round(200 + 40 * pulse) + ',255)', 1.4);
    drawGear(c, 0, -33 + sway, 3.2, -t * 2, '#e8f7ff');
  }
  if (!back) arms();
  if (stun) for (var i = 0; i < 4; i++) { var a = t * 4 + i * 1.57; lib.ell(c, Math.cos(a) * 14, -54 + Math.sin(a) * 3.5, 2, 2, '#ffd34d', 1); }
}

function drawTelegraphs(c) {
  var i, e;
  for (i = 0; i < W.enemies.length; i++) {
    e = W.enemies[i]; if (e.dead) continue;
    if (e.type === 'bossbot' && e.state === 'windup') {
      var kk = e.t / e.dur;
      if (e.attack === 'spin') {
        gEll(c, e.x, e.y, 46, 46); c.fillStyle = 'rgba(255,70,60,0.14)'; c.fill(); c.strokeStyle = 'rgba(255,70,60,0.6)'; c.lineWidth = 1.5; c.stroke();
        gEll(c, e.x, e.y, 46 * kk, 46 * kk); c.fillStyle = 'rgba(255,70,60,0.3)'; c.fill();
      } else {
        c.strokeStyle = 'rgba(255,70,60,' + (0.22 + 0.4 * kk) + ')'; c.lineWidth = 7; c.lineCap = 'round';
        c.beginPath(); c.moveTo(e.x, e.y * K); c.lineTo(e.x + Math.cos(e.dirLock) * 78, (e.y + Math.sin(e.dirLock) * 78) * K); c.stroke();
      }
    }
    if (e.type === 'bot' && e.state === 'windup') {
      c.strokeStyle = 'rgba(255,70,60,' + (0.25 + 0.35 * (e.t / e.dur)) + ')'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(e.x, e.y * K); c.lineTo(e.x + Math.cos(e.dirLock) * 52, (e.y + Math.sin(e.dirLock) * 52) * K); c.stroke();
    }
    if (e.type === 'turret' && e.state === 'windup') {
      c.strokeStyle = 'rgba(255,70,60,0.55)'; c.lineWidth = 1.6; c.setLineDash([4, 3]); c.lineDashOffset = -e.t * 30;
      c.beginPath(); c.moveTo(e.x, e.y * K); c.lineTo(e.x + Math.cos(e.dirLock) * 300, (e.y + Math.sin(e.dirLock) * 300) * K); c.stroke(); c.setLineDash([]);
    }
    if (e.type === 'boss' && e.state === 'windup') {
      var k = e.t / e.dur;
      if (e.attack === 'slam') {
        gEll(c, e.x, e.y, 40, 40); c.fillStyle = 'rgba(255,70,60,0.14)'; c.fill(); c.strokeStyle = 'rgba(255,70,60,0.6)'; c.lineWidth = 1.5; c.stroke();
        gEll(c, e.x, e.y, 40 * k, 40 * k); c.fillStyle = 'rgba(255,70,60,0.3)'; c.fill();
      } else {
        c.beginPath(); c.moveTo(e.x, e.y * K);
        for (var a = e.dirLock - 1.75; a <= e.dirLock + 1.75; a += 0.1) c.lineTo(e.x + Math.cos(a) * 50, (e.y + Math.sin(a) * 50) * K);
        c.closePath(); c.fillStyle = 'rgba(255,70,60,' + (0.1 + 0.25 * k) + ')'; c.fill(); c.strokeStyle = 'rgba(255,70,60,0.6)'; c.lineWidth = 1.5; c.stroke();
      }
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
// The settings of whichever hero look is showing, and how far long legs raise the classic hero's body.
function lookSpec() { return S.look === 'sprite' ? lib.sprite().spec : lib.hero().spec; }
function heroLift() { return S.look === 'sprite' ? 0 : lib.hero().lift; }
function guardSide() { return Math.cos(P.face) >= 0 ? 1 : -1; }
function bodyPose() {
  var p = P, a = p.atk, lx = 0, ly = 0, cr = 0;
  if (a.ph === 'charge') {
    var amt0 = -3.4 * Math.min(1, a.t / 0.3), jit = a.t >= 1 ? Math.sin(W.t * 70) * 0.5 : 0;
    lx = Math.cos(p.face) * amt0 + jit; ly = Math.sin(p.face) * K * amt0 * 0.7; cr = 1.2 * Math.min(1, a.t / 0.3);
  } else if (a.ph !== 'none') {
    var sd = stepData(a), amt, big = a.combo === 3 ? 1.7 : (a.combo === 2 ? 1.4 : 1);
    if (a.ph === 'windup') amt = -2.6 * big * Math.min(1, a.t / sd.wu);
    else if (a.ph === 'active') amt = (-2.6 + 6.2 * Math.min(1, a.t / sd.ac)) * big;
    else amt = 3.6 * big * Math.max(0, 1 - a.t / sd.rec);
    if (S.look === 'classic') amt *= lib.hero().spec.lean;
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
    var pb = 0.45;
    if (a.ph === 'windup') u = -pb * (a.t / sd.wu); else if (a.ph === 'active') u = Math.min(1, a.t / sd.ac); else u = 1;
    var ang = visAngle(a.dir - half * sign + sd.arc * sign * u, dir);
    var upv = Math.max(0, -Math.sin(ang)), sdn = Math.cos(a.dir) >= 0 ? 1 : -1, sb = Math.cos(ang) >= 0 ? 1 : -1;
    o.len = sd.blade;
    if (dir === 'up' || dir === 'down') {
    // a wide side-to-side swing: the hand sweeps across in front of the body, or over the head when facing away
    var startAng = a.dir - half * sign, armSide = Math.cos(startAng) >= 0 ? 1 : -1;
    o.hx = armSide * 2.5 + Math.cos(ang) * 8; o.hy = -14 + Math.sin(ang) * 8 * K - 4 * upv; o.armSide = armSide; o.lift = upv;
  } else {
      o.hx = Math.cos(ang) * 9 + sdn * 10 * upv * upv; o.hy = -13 + Math.sin(ang) * 9 * K - 5 * upv;
    }
    o.ca = Math.cos(ang); o.sa = Math.sin(ang) * (K + (1 - K) * (o.lift || 0));
    if (o.tilt) { var nn = Math.hypot(o.ca, o.sa); o.ca /= nn; o.sa /= nn; }
    o.front = Math.sin(ang) >= -0.05; o.side = sdn; o.atk = true;
  } else {
    var side = (p.guard && S.shield) ? -guardSide() : 1;
    if (dir === 'left') { o.hx = -1; o.hy = -14; o.ca = 0.5; o.sa = -0.85; }
    else if (dir === 'right') { o.hx = 1; o.hy = -14; o.ca = -0.5; o.sa = -0.85; }
    else { o.hx = side * 8; o.hy = -14; o.ca = side * 0.55; o.sa = -0.83; }
    o.len = 20; o.front = true; o.side = side; o.atk = false;
  }
  if (o.atk && S.look === 'classic') o.len *= lib.hero().spec.bladeLen;
  return o;
}
// Gathering: the axe and pickaxe go up over the shoulder in the windup and come down onto the target; the knife
// is a short stab forward. Returns the same shape as swordPose.
function chopPose(dir, a) {
  var p = P, sd = stepData(a), o = {}, u, sdn = Math.cos(a.dir) >= 0 ? 1 : -1, knife = TOOLS[p.tool].id === 'knife';
  if (a.ph === 'windup') u = -(a.t / sd.wu); else if (a.ph === 'active') u = Math.min(1, a.t / sd.ac); else u = 1;
  var raise = u < 0 ? -u : 1, e = u < 0 ? 0 : 1 - (1 - u) * (1 - u), dx = Math.cos(a.dir), dy = Math.sin(a.dir) * K;
  if (knife) {
    var reach = u < 0 ? -2 * raise : 9 * Math.sin(Math.min(1, u) * Math.PI);
    o.hx = dx * (6 + reach); o.hy = -13 + dy * (6 + reach) * 0.6; o.ca = dx; o.sa = dy; o.len = 10;
  } else {
    var upX = -sdn * 4, upY = -31, downX = dx * 12, downY = -8 + dy * 7;
    o.hx = u < 0 ? -sdn * 1 + (upX + sdn * 1) * raise : upX + (downX - upX) * e;
    o.hy = u < 0 ? -16 + (upY + 16) * raise : upY + (downY - upY) * e;
    var ang0 = Math.atan2(-0.95, -sdn * 0.3), ang1 = Math.atan2(dy + 0.45, dx * 0.9), ang = u < 0 ? ang0 : ang0 + wrap(ang1 - ang0) * e;
    o.ca = Math.cos(ang); o.sa = Math.sin(ang); o.len = 15;
  }
  o.front = u < 0 || u < 0.3 || Math.sin(a.dir) >= -0.05; o.side = sdn; o.armSide = sdn; o.atk = true;
  return o;
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
  pose.sheath = !drawn;
  var swordHand = [sp.hx + bp.lx, sp.hy + bp.ly];
  if (p.fireT > 0) swordHand = [Math.cos(p.fireAng) * 10 + bp.lx, -13 + Math.sin(p.fireAng) * 10 * K + bp.ly];
  if (p.guard && !S.shield) {
    if (side) { pose.near = [Math.cos(p.face) * 5 + bp.lx, -13 + bp.ly]; pose.far = [Math.cos(p.face) * 6 + bp.lx, -14 + bp.ly]; }
    else { pose.armL = [-2.5 + bp.lx, -13 + bp.ly]; pose.armR = [2.5 + bp.lx, -13 + bp.ly]; }
  } else {
    var sh = shieldPose(), shieldHand = [sh[0] + bp.lx, sh[1] + bp.ly];
    if (shieldBehind() && !side) shieldHand = [guardSide() * 9 + bp.lx, -16 + bp.ly];
    var useSword = drawn || p.fireT > 0;
    if (side) {
      if (useSword) pose.near = swordHand;
      if (p.guard) { if (useSword) pose.far = shieldHand; else pose.near = shieldHand; }
    } else {
      var ss = useSword ? (((dir === 'up' || dir === 'down') && drawn && sp.armSide) ? sp.armSide : sp.side) : -guardSide();
      if (useSword) pose[ss < 0 ? 'armL' : 'armR'] = swordHand;
      if (p.guard) pose[guardSide() < 0 ? 'armL' : 'armR'] = shieldHand;
    }
  }
  return pose;
}
/* ---------- sprite look: stepped frames, pixel sword and a big cyan slash ---------- */
function walkFrame(ph) { var q = ph / (Math.PI * 2); return Math.floor((q - Math.floor(q)) * 4) % 4; }
function spriteFrame() {
  var p = P, a = p.atk;
  if (a.ph === 'charge') return { pose: 'atk', f: 1 };
  if (a.ph !== 'none') {
    var sd = stepData(a);
    if (a.ph === 'windup') return { pose: 'atk', f: a.t < sd.wu * 0.5 ? 0 : 1 };
    if (a.ph === 'active') return { pose: 'atk', f: 2 };
    return { pose: 'atk', f: a.t < sd.rec * 0.45 ? 2 : 3 };
  }
  if (p.anim.amt > 0.35) return { pose: 'walk', f: walkFrame(p.anim.phase * lib.sprite().spec.walkRate) };
  return { pose: 'idle', f: 0 };
}
// Attack styles for the sprite look. All of it is visual: the hitbox and timing do not change.
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
  if (st.spin && S.look !== 'sprite') st = { pull: st.pull, lunge: st.lunge, sq: st.sq, hop: st.hop, spin: 0 };
  if (P.mode === 'gather') st = { pull: 1, lunge: 1.5, sq: 0.12, hop: 0, spin: 0 };   // a chop: a small lean, no lunge or spin
  var pw = sp.atkPower * (a.combo >= 2 ? 1.5 : 1), off = 0, sq = 0, hop = 0, dir = a.ph === 'charge' ? P.face : a.dir, u;
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
function spinDir(dir, prog) { var order = ['down', 'left', 'up', 'right'], i = order.indexOf(dir); return order[(i + Math.floor(prog * 4)) % 4]; }
function spriteSword() {
  var p = P, a = p.atk, ang, len, start, sp = lib.sprite().spec;
  if (a.ph === 'none' || (p.guard && !S.shield)) return null;
  if (a.ph === 'charge') { ang = p.face + 2.3; start = ang; len = 28 * sp.bladeLen; }
  else {
    var sd = stepData(a), half = sd.arc / 2, sign = (a.combo % 2 === 0) ? 1 : -1;
    start = a.dir - half * sign;
    if (a.ph === 'active') ang = start + sd.arc * sign * Math.min(1, a.t / sd.ac);
    else ang = [start - 0.25 * sign, start - 0.6 * sign, a.dir + half * sign, a.dir + half * sign * 1.15][spriteFrame().f];
    var spin = atkBody().spin;
    if (spin > 0) ang = start + sign * Math.PI * 2 * spin;
    len = sd.blade * sp.bladeLen;
  }
  return { ang: ang, len: len, front: Math.sin(ang) >= -0.05, armSide: Math.cos(start) >= 0 ? 1 : -1 };
}
function pixLine(c, x1, y1, x2, y2, w, col) {
  var dx = x2 - x1, dy = y2 - y1, n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)))), i;
  c.fillStyle = col;
  for (i = 0; i <= n; i++) c.fillRect(Math.round(x1 + dx * i / n - w / 2), Math.round(y1 + dy * i / n - w / 2), w, w);
}
function drawPixSword(c, front) {
  var sw = spriteSword(); if (!sw || sw.front !== front) return;
  var p = P, a = p.atk, dir = heroDir(), side = dir === 'left' || dir === 'right';
  var ab = atkBody(), bx = Math.round(p.x + ab.x), by = Math.round(p.y * K + ab.y - ab.hop), ca = Math.cos(sw.ang), sa = Math.sin(sw.ang) * K;
  var cur = lib.sprite(), C = cur.pal, sc = cur.spec.scale, al = cur.spec.armL * sc, w = Math.max(1, Math.round(2 * sc)), len = sw.len * sc;
  var sx = bx + (side ? 0 : sw.armSide * cur.m.shX * sc), sy = by - cur.m.shY * sc;
  var hx = sx + ca * al, hy = sy + sa * al, tx = hx + ca * len, ty = hy + sa * len;
  var hot = a.ph === 'charge' && a.t >= 0.33;
  pixLine(c, sx, sy, hx, hy, w + 2, C.line);
  pixLine(c, hx + ca * 2, hy + sa * 2, tx, ty, w + 2, C.line);
  pixLine(c, sx, sy, hx, hy, w, C.coatL);
  pixLine(c, hx + ca * 3, hy + sa * 3, tx, ty, w, hot ? '#ffd34d' : C.blade);
  pixLine(c, hx + ca * 4, hy + sa * 4, tx - ca * 2, ty - sa * 2, Math.max(1, w - 1), hot ? '#fff3c4' : C.bladeL);
  pixLine(c, hx + ca * 2 + sa * w, hy + sa * 2 - ca * w, hx + ca * 2 - sa * w, hy + sa * 2 + ca * w, w, C.belt);
  pixLine(c, hx, hy, hx, hy, w, C.skin);
}
function drawPixSlash(c) {
  var p = P, tr = p.atk.tr, fade = 1 - tr.age / 0.18;
  var cur = lib.sprite(), C = cur.pal;
  var ab = atkBody(), tcur = ab.spin > 0 ? tr.start + tr.sign * Math.PI * 2 * ab.spin : tr.cur;
  if ((ATK_STYLES[Math.round(cur.spec.atkStyle)] || {}).spin && ab.spin < 0) tcur = tr.start + tr.sign * Math.PI * 2;
  var R = tr.reach * cur.spec.slashSize, T = R * cur.spec.slashWidth, span = Math.min(Math.PI, Math.abs(tcur - tr.start) / 2);
  if (span < 0.05) return;
  var mid = (tr.start + tcur) / 2, sg = tcur >= tr.start ? 1 : -1;
  var ox = Math.round(p.x + ab.x), oy = Math.round(p.y * K + ab.y - ab.hop - cur.m.shY * cur.spec.scale), ry = Math.ceil(R * K), x, y;
  var cols = tr.hot ? ['#fff8dc', '#ffe06e', '#f0a830'] : [C.slashL, C.slash, C.slashD];
  c.globalAlpha = fade > 0.66 ? 0.95 : (fade > 0.33 ? 0.7 : 0.4);
  for (y = -ry; y <= ry; y++) for (x = -Math.ceil(R); x <= Math.ceil(R); x++) {
    var ux = x + 0.5, uy = (y + 0.5) / K, r = Math.hypot(ux, uy);
    if (r > R || r < Math.min(10, R * 0.3)) continue;
    var d = wrap(Math.atan2(uy, ux) - mid);
    if (Math.abs(d) > span) continue;
    var q = (d * sg + span) / (2 * span);
    var inner = R - T * Math.pow(Math.sin(Math.PI * Math.pow(q, 1.6)), 0.7);
    if (r < inner) continue;
    c.fillStyle = cols[r > R - 2.5 ? 0 : (r < inner + 3 ? 2 : 1)];
    c.fillRect(ox + x, oy + y, 1, 1);
  }
  c.globalAlpha = 1;
}
function heroSprFn(dashing, dir, pose, f, armSide, ab) {
  var p = P;
  return function (s) {
    var img = lib.heroP(dir, pose, f, armSide), sm = s.imageSmoothingEnabled, cur = lib.sprite();
    s.imageSmoothingEnabled = false;
    if (dashing) { var ax = Math.abs(p.roll.dx), ay = Math.abs(p.roll.dy); s.scale(1 + 0.2 * ax, 1 - 0.1 * ax + 0.08 * ay); }
    if (ab) s.scale(ab.sx, ab.sy);
    s.scale(cur.spec.scale, cur.spec.scale);
    s.drawImage(img, -cur.m.ox, -cur.m.oy);
    s.imageSmoothingEnabled = sm;
  };
}

function drawHeroWeapon(c, front) {
  var p = P, a = p.atk, dir = heroDir(), bp = bodyPose(), sp = swordPose(dir), spr = S.look === 'sprite';
  var hideSword = spr || (p.guard && !S.shield) || (a.ph === 'none' && !itemOf('held')), HH = lib.hero(), HC = HH.pal;
  if (spr) drawPixSword(c, front);
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
    if (heldIt) { Items.draw(c, heldIt, hx, hy, ca, sa, heldIt.kind === 'sword' ? len * heldIt.size : null, p.mode === 'gather' && a.ph !== 'none'); if (front) lib.ell(c, hx, hy, 2.6, 2.6, HC.skin, 1.5); }
    else if (p.mode === 'gather') { if (!api.items) drawToolShape(c, hx, hy, ca, sa, len, TOOLS[p.tool].id); if (front) lib.ell(c, hx, hy, 2.6, 2.6, HC.skin, 1.5); }
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
  if (spr && S.juice && a.tr && front === (Math.sin(a.dir) >= -0.3)) drawPixSlash(c);
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
  if (S.shield) {
    var bh = shieldBehind(), srx = bh ? 10.5 : 7.5, sry = bh ? 11 : 9;
    lib.ell(c, x, y, srx, sry, parry ? '#fff3c4' : '#8f8ba6', 1.8);
    lib.ell(c, x, y, srx * 0.53, sry * 0.55, '#e0a93a', 1.2); lib.ell(c, x, y, srx * 0.19, sry * 0.2, '#f6d878', 0);
  }
  if (parry) { c.strokeStyle = 'rgba(255,240,170,' + (0.8 - p.guardT / parryWindow() * 0.6) + ')'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(S.shield ? x : p.x + Math.cos(p.face) * 8, S.shield ? y : p.y * K - 12 + Math.sin(p.face) * 5, 12, 13, 0, 0, Math.PI * 2); c.stroke(); }
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
  var dashing = p.roll.t > 0, spr = S.look === 'sprite';
  for (var gi = 0; gi < W.ghosts.length; gi++) {
    var g = W.ghosts[gi];
    c.globalAlpha = 0.45 * g.life / g.max;
    if (spr) flashDraw(c, Math.round(g.x), Math.round(g.y * K), heroSprFn(false, g.dir, 'walk', walkFrame(g.ph), 1), 0.75, '110,200,255');
    else flashDraw(c, g.x, g.y * K, heroFn(false, g.dir, { phase: g.ph, amt: 1, t: g.t, lx: 0, ly: 0, blink: 0, sq: 0 }, null), 0.75, '110,200,255');
    c.globalAlpha = 1;
  }
  if (!spr) {
    var ab0 = atkBody(), hsc = lib.hero().spec.scale;
    var lift0 = api.scene && api.scene.heroLift ? api.scene.heroLift() : 0;   // e.g. standing on a bobbing deck
    c.save(); c.translate(p.x + ab0.x, p.y * K + ab0.y - ab0.hop - lift0); c.scale(hsc * ab0.sx, hsc * ab0.sy); c.translate(-p.x, -p.y * K);
  }
  drawHeroWeapon(c, false); drawShield(c, false);
  if (spr) {
    var fr = spriteFrame(), sw = spriteSword(), ab = atkBody(), hd = ab.spin > 0 ? spinDir(heroDir(), ab.spin) : heroDir();
    flashDraw(c, Math.round(p.x + ab.x), Math.round(p.y * K + ab.y - ab.hop), heroSprFn(dashing, hd, fr.pose, fr.f, sw ? sw.armSide : 1, ab), amt);
  }
  else { p.anim.turn = heroTurn(); flashDraw(c, p.x, p.y * K, heroFn(dashing, heroDir(), p.anim, heroPose(heroDir())), amt); }
  drawHeroWeapon(c, true); drawShield(c, true);
  if (!spr) c.restore();
}
// the heading an animal is drawn at: it follows the true facing, but turns over a few frames instead of snapping
function creatureTurn(e, a) {
  if (e.faceVis == null) e.faceVis = a;
  var d = Math.atan2(Math.sin(a - e.faceVis), Math.cos(a - e.faceVis)), stepMax = 0.22;
  e.faceVis += Math.max(-stepMax, Math.min(stepMax, d));
  return e.faceVis;
}
function drawCreature(c, e) {
  var sp = (e.skin || lib.creature()).spec, a = e.type === 'turret' ? e.aim : e.face, dx = P.x - e.x, dy = (P.y - e.y) * K, dl = Math.hypot(dx, dy) || 1;
  lib.creatureD(c, 0, 0, { t: W.t + e.seed, move: (e.state === 'chase' || e.state === 'lunge') ? 1 : 0, phase: (W.t + e.seed) * 9 * sp.stepRate,
    dir: Math.cos(a) >= 0 ? 1 : -1, ang: api.facings8 ? creatureTurn(e, a) : null, look: [dx / dl, dy / dl], state: e.state, k: e.dur ? e.t / e.dur : 0 }, e.skin);
}
function drawEnemy(c, e) {
  var fn = e.creature ? drawCreature : ((e.type === 'bot' || e.type === 'bossbot') ? drawBot : (e.type === 'turret' ? drawTurret : drawBoss));
  if (e.dead) { c.save(); c.globalAlpha = Math.max(0, 1 - e.deadT * 2); c.translate(e.x, e.y * K - e.deadT * 14); c.scale(1 + e.deadT, 1 - e.deadT * 0.6); fn(c, e); c.restore(); return; }
  var jx = e.freezeT > 0 ? Math.sin(W.t * 90 + e.seed) * 1.1 : 0;
  flashDraw(c, e.x + jx, e.y * K, function (s) {
    if (e.sq > 0.01) {
      var k = e.sq, f = 0.3 * k * Math.cos((1 - k) * 7), ax = Math.abs(Math.cos(e.sqAng)), ay = Math.abs(Math.sin(e.sqAng)) * K;
      s.scale(1 - f * ax + f * 0.5 * ay, 1 + f * ax * 0.6 - f * ay);
    }
    fn(s, e);
  }, e.flash, e.flashRgb);
}
function drawProj(c, pr) {
  var x = pr.x, y = pr.y * K - 10;
  if (pr.owner === 'enemy') {
    lib.ell(c, x, y, 4.4, 4.4, '#ffe9d0', 1.5, '#8a3a2a'); lib.ell(c, x, y, 2.2, 2.2, '#ff8a5a', 0);
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(x - pr.vx * 0.03, y - pr.vy * 0.03 * K, 2.6, 0, Math.PI * 2); c.fill();
  } else {
    // an arrow: shaft, iron head, two feathers
    var ca = Math.cos(pr.ang), sa = Math.sin(pr.ang) * K, px = -sa, py = ca, tx = x + ca * 8, ty = y + sa * 8, bx = x - ca * 8, by = y - sa * 8;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#3a2a36'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
    c.strokeStyle = pr.reflected ? '#ffd34d' : '#b98a5a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
    c.fillStyle = '#c5ccd6'; c.strokeStyle = '#3a2a36'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx + ca * 4, ty + sa * 4); c.lineTo(tx + px * 1.8, ty + py * 1.8); c.lineTo(tx - px * 1.8, ty - py * 1.8); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#eef3fb'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - ca * 3 + px * 2.4, by - sa * 3 + py * 2.4); c.moveTo(bx, by); c.lineTo(bx - ca * 3 - px * 2.4, by - sa * 3 - py * 2.4); c.moveTo(bx + ca * 2.5, by + sa * 2.5); c.lineTo(bx - ca * 0.5 + px * 2.4, by - sa * 0.5 + py * 2.4); c.moveTo(bx + ca * 2.5, by + sa * 2.5); c.lineTo(bx - ca * 0.5 - px * 2.4, by - sa * 0.5 - py * 2.4); c.stroke();
  }
}
function drawPart(c, q) {
  var a = Math.max(0, q.life / q.max), x = q.x, y = q.y * K - q.z;
  if (q.k === 'streak') { c.strokeStyle = 'rgba(' + (q.rgb || '255,246,200') + ',' + a + ')'; c.lineWidth = 1.6 * (0.4 + a * 0.6); c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - q.vx * 0.045, y - q.vy * 0.045 * K); c.stroke(); }
  else if (q.k === 'dust') { c.fillStyle = 'rgba(232,220,192,' + (0.55 * a) + ')'; c.beginPath(); c.arc(x, y, q.s * (1.6 - a * 0.6), 0, Math.PI * 2); c.fill(); }
  else if (q.k === 'bit') { c.fillStyle = q.c; c.strokeStyle = '#3a2a36'; c.lineWidth = 0.9; c.beginPath(); c.arc(x, y, q.s, 0, Math.PI * 2); c.fill(); c.stroke(); }
  else { c.fillStyle = q.c; c.globalAlpha = a; c.beginPath(); c.arc(x, y, q.s, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
}
function bar(c, x, y, w, h, v, fill, back) {
  c.fillStyle = '#3a2a36'; c.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
  c.fillStyle = back || '#5b4a58'; c.fillRect(x, y, w, h);
  c.fillStyle = fill; c.fillRect(x, y, Math.max(0, w * clamp(v, 0, 1)), h);
}
// damage numbers and pickups float up from where they happened; a page with a camera draws them inside it
function drawNums(c) {
  for (var i = 0; i < W.nums.length; i++) {
    var n = W.nums[i], a = 1 - n.t / 0.9;
    c.globalAlpha = Math.max(0, Math.min(1, a * 1.6)); c.textAlign = 'center';
    var pop = 1 + (n.big ? 0.9 : 0.5) * Math.max(0, 1 - n.t / 0.14);
    c.font = 'bold ' + (9 * pop).toFixed(1) + 'px system-ui, sans-serif';
    c.lineWidth = 2.6; c.strokeStyle = '#3a2a36'; var ny = n.y * K - n.t * 24;
    c.strokeText(n.txt, n.x, ny); c.fillStyle = n.c; c.fillText(n.txt, n.x, ny); c.globalAlpha = 1;
  }
}
function drawHud(c) {
  var i, bigRow = 0;
  bar(c, 10, 10, 84, 7, P.hp / P.maxHp, '#e8584a');
  bar(c, 10, 22, 84, 5, P.st / 100, P.st < 22 ? '#d6b54a' : '#7fd66d');
  c.font = 'bold 8px system-ui, sans-serif'; c.textAlign = 'left'; c.lineWidth = 2.4; c.strokeStyle = '#3a2a36';
  if (!(api.scene && api.scene.noKills)) { var txt = 'Kills ' + W.kills; c.strokeText(txt, 10, 40); c.fillStyle = '#fff'; c.fillText(txt, 10, 40); }
  for (i = 0; i < W.enemies.length; i++) {
    var e = W.enemies[i];
    if (e.dead) continue;
    if (e.type === 'boss' || e.type === 'bossbot') {
      var by = 10 + bigRow * 30; bigRow++;
      bar(c, 124, by, 152, 8, e.hp / e.maxHp, '#e0a93a');
      bar(c, 124, by + 12, 152, 4, e.stagMeter / 100, e.state === 'stunned' ? '#ffd34d' : '#8fe3ff');
      var nm = e.name || (e.type === 'boss' ? 'GUARDIAN' : 'BOSSBOT');
      c.textAlign = 'center'; c.strokeText(nm, 200, by + 27); c.fillStyle = '#fff'; c.fillText(nm, 200, by + 27);
    } else if (e.showBar > 0 && !api.scene) {
      bar(c, e.x - 10, e.y * K - e.r * 2.6 - 10, 20, 3, e.hp / e.maxHp, '#e8584a');
    }
  }
  if (!api.scene) drawNums(c);
  if (P.dead) {
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
function slotBox(c, x, y, on, sz) {
  c.fillStyle = 'rgba(20,16,30,0.78)'; c.fillRect(x, y, sz, sz);
  c.strokeStyle = on ? '#ffd34d' : 'rgba(255,255,255,0.28)'; c.lineWidth = on ? 1.2 : 0.8; c.strokeRect(x + 0.5, y + 0.5, sz - 1, sz - 1);
}
function roundIcon(c, id, x, y, r, on, dim) {
  c.globalAlpha = dim ? 0.45 : 1;
  c.fillStyle = 'rgba(20,16,30,0.82)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.strokeStyle = on ? '#ffd34d' : 'rgba(255,255,255,0.35)'; c.lineWidth = on ? 1.3 : 0.8; c.stroke();
  var wi = itemOf('weapon', id);
  c.save(); c.translate(x, y); if (wi) Items.icon(c, wi, r * 1.6); else { c.scale(r / 10, r / 10); slotIcon(c, id, 0, 0); } c.restore();
  c.globalAlpha = 1;
}
function drawHotbar(c) {
  var sz = 11, gap = 2, x0 = Math.round((SW - (6 * sz + 5 * gap)) / 2), y0 = SH - sz - 5, mode = P.mode, gather = mode === 'gather', build = mode === 'build', i, k = 0.55;
  var slots = build ? (api.buildSlots || []) : [];
  c.save();
  // sword above left, bow below right, like the two rings of a % sign
  roundIcon(c, 'sword', x0 - 23, y0 - 1, 6.5, mode === 'fight' && P.weapon === 'melee', mode !== 'fight');
  roundIcon(c, 'bow', x0 - 10, y0 + 9, 6.5, mode === 'fight' && P.weapon === 'ranged', mode !== 'fight');
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0 - 11, y0 - 2); c.lineTo(x0 - 22, y0 + 10); c.stroke();
  c.font = 'bold 4.5px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,0.65)'; c.fillText('F', x0 - 16.5, y0 + 14.5);
  if (api.quiver != null) { c.font = 'bold 5px system-ui, sans-serif'; c.textAlign = 'left'; c.lineWidth = 1.8; c.strokeStyle = '#3a2a36'; c.strokeText(String(api.quiver), x0 - 3, y0 + 13); c.fillStyle = api.quiver > 0 ? '#fff' : '#ff8a7a'; c.fillText(String(api.quiver), x0 - 3, y0 + 13); }
  for (i = 0; i < 6; i++) {
    var x = x0 + i * (sz + gap), tool = gather && i < TOOLS.length ? TOOLS[i] : null, cx = x + sz / 2, cy = y0 + sz / 2;
    slotBox(c, x, y0, (gather && i === P.tool) || (mode === 'fight' && i === (P.sel || 0)), sz);
    c.save(); c.translate(cx, cy); c.scale(k, k);
    if (tool) { var ti2 = itemOf('tool', i); if (ti2) Items.icon(c, ti2, 16); else { if (api.items) c.globalAlpha = 0.3; slotIcon(c, tool.id, 0, 0); c.globalAlpha = 1; } }
    else if (api.beltSlots && api.beltSlots[i] && (mode !== 'gather' || i >= TOOLS.length)) {
      var bs = api.beltSlots[i]; bs.draw(c);
      if (bs.n > 1) { c.font = 'bold 8px system-ui, sans-serif'; c.textAlign = 'right'; c.lineWidth = 2.4; c.strokeStyle = '#3a2a36'; c.strokeText(String(bs.n), 9.5, 9.5); c.fillStyle = '#fff'; c.fillText(String(bs.n), 9.5, 9.5); }
    }
    c.restore();
    c.font = 'bold 3.8px system-ui, sans-serif'; c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,0.65)'; c.fillText(String(i + 1), x + 1.3, y0 + 4.5);
  }
  c.font = 'bold 5px system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 1.8; c.strokeStyle = '#3a2a36';
  var pc = slots[P.piece], label = build ? (P.wreck ? 'WRECK  (F to build, B to leave)' : 'BUILD: ' + (pc ? pc.name + (pc.cost ? ' (' + pc.cost + ')' : '') : '') + '   (right click: pieces, F: wreck, B: leave)') : (gather ? 'GATHER  (Q to fight, B to build)' : 'FIGHT  (Q to gather, B to build)');
  var col = build ? (P.wreck ? '#ff8a7a' : '#9fd8ff') : (gather ? '#9be58b' : '#ffd34d');
  c.strokeText(label, SW / 2, y0 - 3); c.fillStyle = col; c.fillText(label, SW / 2, y0 - 3);
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
  for (i = 0; i < W.enemies.length; i++) { var en = W.enemies[i]; if (!en.dead) sh2(en.x, en.y, en.r * 1.3, en.r * 0.8); }
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
  W.enemies.forEach(function (e) { items.push({ y: e.y, f: function () { drawEnemy(c, e); } }); });
  W.projs.forEach(function (pr) { items.push({ y: pr.y + 1, f: function () { drawProj(c, pr); } }); });
  W.parts.forEach(function (q) { if (q.k === 'dust') items.push({ y: q.y, f: function () { drawPart(c, q); } }); });
  if (!P.dead) items.push({ y: P.y, f: function () { drawHero(c); } });
  if (sc) sc.items(items);
  items.sort(function (a, b) { return a.y - b.y; });
  for (i = 0; i < items.length; i++) items[i].f();
  for (i = 0; i < W.parts.length; i++) if (W.parts[i].k !== 'dust') drawPart(c, W.parts[i]);
  for (i = 0; i < W.rings.length; i++) {
    var rg = W.rings[i], u = 1 - rg.life / rg.max, rr0 = rg.r1 * (0.25 + 0.75 * Math.sin(u * Math.PI / 2));
    c.strokeStyle = 'rgba(' + rg.c + ',' + (0.85 * (1 - u)) + ')'; c.lineWidth = rg.w * (1 - u * 0.6);
    c.beginPath();
    if (rg.air) c.arc(rg.x, rg.y * K - rg.z, rr0, 0, Math.PI * 2); else c.ellipse(rg.x, rg.y * K, rr0, rr0 * K, 0, 0, Math.PI * 2);
    c.stroke();
  }
  if (sc) { drawNums(c); for (i = 0; i < W.enemies.length; i++) { var eb = W.enemies[i]; if (!eb.dead && eb.showBar > 0 && eb.type !== 'boss' && eb.type !== 'bossbot') bar(c, eb.x - 10, eb.y * K - eb.r * 2.6 - 10, 20, 3, eb.hp / eb.maxHp, '#e8584a'); } }
  if (sc && sc.end) sc.end(c, P);
  c.restore();
  if (!(sc && sc.noHud)) drawHud(c);
  if (!(sc && sc.noHotbar)) drawHotbar(c);
}

function init(l) { lib = l; reset(); buildGround(); }
return { init: init, update: update, render: render, key: key, button: button, mouse: mouse, spawn: spawn, reset: reset, S: S, api: api,
  clear: function () { W.enemies.length = 0; W.projs.length = 0; W.lock = null; },
  dbg: function () { return { P: P, W: W, IN: IN }; } };
})();
if (typeof module !== 'undefined') module.exports = Combat;
