// The runes broken on purpose (2026-10-24, Robin: "try raiding with the new runes, different combinations. Try to find bugs and
// break things"): every seed binds a random rune in every slot at a random tier, arms the hero with a random weapon (with or
// without a shield, or a bow, or the axe in gather mode), puts eight men (some with bows) and three beasts round him, and mashes
// every input for a minute of game time: the walk, the sprint, the blow held and tapped, the guard, the guard-blow, the dash, the
// bow drawn and let go, the traps aimed and thrown with the wheel, the axe thrown, the sneak, the target. What it watches for:
// a throw, a number that is not a number, a state that never ends (a dash, a throw in the hand, a trap aimed with no button, a
// man bound or frozen for good, time slowed for good), lists that grow without end. Like every test here it prints; a line
// marked !! is a fault.
//   node tests/runes_fuzz.js [seeds] [secs]      (40 seeds of 60 s by default; RSEED=n -r ./tools/seedrand.js plays one again)
const { createCanvas } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
global.GameArt = require('../src/art.js'); global.Items = require('../src/items.js');
const Combat = require('../src/combat.js'), Runes2 = global.Runes2 = require('../src/runes2.js');
Combat.api.roster = []; Combat.init(GameArt.lib);
const DT = 1 / 60, SEEDS = +process.argv[2] || 40, SECS = +process.argv[3] || 60;
let rs = 1; function rnd() { rs = (rs * 16807) % 2147483647; return (rs - 1) / 2147483646; }
function pickOf(a) { return a[Math.floor(rnd() * a.length)]; }
const SLOTS = Object.keys(Runes2.SLOT), BUILT = Runes2.LIST.filter(r => r.status === 'built' && r.slot && (Runes2.RETIRED || []).every(q => q[0] !== r.id));
const WEAPONS = ['sword', 'axe', 'club', 'seax', 'spear', 'greataxe', 'maul', 'bow', 'axeTool'];
const KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'KeyJ', 'KeyK', 'Space'];
const fin = v => typeof v === 'number' && isFinite(v);
let faults = 0; const seen = {};
function fault(seed, what, cfg) { faults++; const k = what.replace(/[\d.]+/g, '#'); if (seen[k]) { seen[k]++; return; } seen[k] = 1; console.log('  !! seed ' + seed + ': ' + what + '  [' + cfg + ']'); }
function run(seed) {
  rs = seed * 7919 + 13; Combat.reset(); const D = Combat.dbg(), P = D.P, W = D.W;
  P.x = 400; P.y = 400; P.hp = P.maxHp = 100; P.st = 100; D.W.pillars = [{ x: 470, y: 380, r: 12 }, { x: 330, y: 450, r: 10 }];
  const wk = pickOf(WEAPONS), tool = wk === 'axeTool', it = tool ? Items.make('axe', 'copper') : Items.make(wk, pickOf(['flint', 'copper', 'iron']));
  const twoH = ['greataxe', 'maul', 'bow', 'spear'].indexOf(wk) >= 0, shield = !twoH && !tool && rnd() < 0.5;
  P.mode = tool ? 'gather' : 'fight'; P.weapon = wk === 'bow' ? 'ranged' : 'melee'; P.tool = 0;
  Combat.api.items = { held: () => it, tool: () => tool ? it : null, weapon: () => tool ? null : it }; Combat.api.shield = () => shield; D.S.shield = shield;
  Combat.api.mods = null; Combat.api.scene = { bounds: { x0: 0, y0: 0, x1: 800, y1: 800 } };
  const trees = [{ x: 520, y: 470, r: 10, kind: 'tree' }, { x: 300, y: 320, r: 10, kind: 'tree' }];
  Combat.api.harvest = { list: (x, y, r) => trees.filter(o => Math.hypot(o.x - x, o.y - y) < r + 20), hit: () => ({}) };
  let bag = { tripper: 3, poison: 3 }; Combat.api.trapHave = k => bag[k]; Combat.api.trapUse = k => { bag[k] = Math.max(0, bag[k] - 1); };
  const st = Runes2.start(); Combat.api.runeState = st; const bound = [];
  SLOTS.forEach(sl => { const L = BUILT.filter(r => r.slot === sl); if (!L.length || rnd() < 0.15) return; const r = pickOf(L), tier = 1 + Math.floor(rnd() * 3); Runes2.learn(st, r.id, tier); Runes2.bind(st, sl, r.id); bound.push(r.id + tier); });
  if (rnd() < 0.5) Runes2.readyAll(st);
  const cfg = wk + (shield ? '+shield' : '') + ' ' + bound.join(',');
  const men = []; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, bow = i % 4 === 3; const e = Combat.soldier({ side: 0, x: 400 + Math.cos(a) * 160, y: 400 + Math.sin(a) * 160, wpn: { kind: bow ? 'bow' : pickOf(['axe', 'sword', 'spear', 'club', 'seax']), mat: 'iron' }, bow: bow, shield: !bow && rnd() < 0.6, armor: pickOf([0, 0.2, 0.4]), hp: 30, strength: 4, wits: 2 + Math.floor(rnd() * 5), nerve: rnd() }); e.face = a + Math.PI; men.push(e); }
  ['boar', 'wolf', 'deer'].forEach((k, i) => { try { const b = Combat.spawn('beast', 400 + (i - 1) * 120, 620); if (b) { b.kind = k; } } catch (e) {} });
  const held = {}; let throwT = 0, aimT = 0, dashT = 0, slowT = 0, roll0 = 0;
  for (let f = 0; f < SECS * 60; f++) {
    if (seed % 2 === 0 && f % 3 === 0) {   /* the fighting half: at the nearest man, the blow tapped and held, the guard at his windup, the dash now and then, the bow drawn and let go at him, traps laid under him */
      const live = W.enemies.filter(e => !e.dead && !e.down && e.side !== 1).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)), tg = live[0];
      if (tg) { const dx = tg.x - P.x, dy = tg.y - P.y, d = Math.hypot(dx, dy), near = d < (wk === 'bow' ? 120 : 38); [['KeyD', dx > 6 && !near], ['KeyA', dx < -6 && !near], ['KeyS', dy > 6 && !near], ['KeyW', dy < -6 && !near]].forEach(q => { if (q[1] !== !!held[q[0]]) { held[q[0]] = q[1]; Combat.key(q[0], q[1]); } }); Combat.mouse(tg.x, tg.y * 0.75);
        const ph = f % 90, guardUp = tg.state === 'windup' && rnd() < 0.6, drawBow = wk === 'bow' && ph < 75, j = wk === 'bow' ? ph >= 75 && ph < 78 : (near && rnd() < 0.5) || (ph > 40 && ph < 70 && near);
        if ((guardUp || drawBow) !== !!held.KeyK) { held.KeyK = guardUp || drawBow; Combat.key('KeyK', held.KeyK); } if (j !== !!held.KeyJ) { held.KeyJ = j; Combat.key('KeyJ', j); }
        if (rnd() < 0.03) { Combat.key('Space', true); Combat.key('Space', false); } if (wk === 'bow' && rnd() < 0.02 && !P.bowDraw) { Combat.button(0, true); for (let q = 0; q < 8; q++) Combat.update(DT); Combat.button(0, false); } }
    } else if (f % 6 === 0) { KEYS.forEach(k => { const want = rnd() < (k === 'Space' || k === 'ShiftLeft' ? 0.12 : k === 'KeyJ' || k === 'KeyK' ? 0.35 : 0.3); if (want !== !!held[k]) { held[k] = want; Combat.key(k, want); } });
      const lm = rnd() < 0.3, rm = rnd() < 0.25; if (lm !== !!held.lmb) { held.lmb = lm; Combat.button(0, lm); } if (rm !== !!held.rmb) { held.rmb = rm; Combat.button(2, rm); }
      if (rnd() < 0.05) { Combat.key('KeyC', true); Combat.key('KeyC', false); } if (rnd() < 0.04) { Combat.key('ControlLeft', true); Combat.key('ControlLeft', false); } if (rnd() < 0.08) Combat.wheel(rnd() < 0.5 ? 1 : -1);
      const tg = men.filter(e => !e.dead)[Math.floor(rnd() * 8)] || men[0]; Combat.mouse(tg.x + (rnd() - 0.5) * 60, (tg.y + (rnd() - 0.5) * 60) * 0.75);
      if (f % 600 === 0) { bag = { tripper: 3, poison: 3 }; P.hp = Math.max(P.hp, 40); }
    }
    try { Combat.update(DT); } catch (e) { fault(seed, 'threw: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e), cfg); return; }
    if (P.dead) { P.dead = false; P.hp = P.maxHp; P.hurtT = 0; }
    if (!fin(P.x) || !fin(P.y) || !fin(P.hp) || !fin(P.st)) { fault(seed, 'the hero went not-a-number (' + [P.x, P.y, P.hp, P.st].join(',') + ')', cfg); return; }
    if (P.x < -50 || P.y < -50 || P.x > 850 || P.y > 850) { fault(seed, 'the hero left the field at ' + Math.round(P.x) + ',' + Math.round(P.y), cfg); return; }
    for (const e of W.enemies) { if (!fin(e.x) || !fin(e.y) || !fin(e.hp)) { fault(seed, 'a ' + (e.type || '?') + ' went not-a-number (' + e.state + ')', cfg); return; } if (e.boundT > 6) fault(seed, 'a man bound for ' + e.boundT.toFixed(1) + ' s', cfg); if (e.freezeT > 5) fault(seed, 'a man frozen for ' + e.freezeT.toFixed(1) + ' s', cfg); if (e.noHarm > 6) fault(seed, 'a man unharmable for ' + e.noHarm.toFixed(1) + ' s', cfg); if (e.confusedT > 5) fault(seed, 'a man confused for ' + e.confusedT.toFixed(1), cfg); }
    throwT = P.throwQ ? throwT + DT : 0; if (throwT > 1.5) { fault(seed, 'a throw stuck in the hand', cfg); return; }
    aimT = P.trapAim && !held.lmb && !held.KeyJ ? aimT + DT : 0; if (aimT > 0.5) { fault(seed, 'a trap still aimed with no button held', cfg); return; }
    dashT = P.roll.t > 0 ? dashT + DT : 0; if (dashT > 3) { fault(seed, 'a dash, slide or leap that never ended (' + P.roll.t.toFixed(2) + ')', cfg); return; }
    slowT = W.slow && W.slow.t > 0 ? slowT + DT : 0; if (slowT > 4) { fault(seed, 'time slowed for over 4 s', cfg); return; }
    if ((W.traps || []).length > 1) { fault(seed, (W.traps || []).length + ' traps out at once', cfg); return; }
    if (W.projs.length > 150 || W.parts.length > 6000 || (W.stuck || []).length > 70 || W.nums.length > 400) { fault(seed, 'a list grew: projs ' + W.projs.length + ', parts ' + W.parts.length + ', stuck ' + (W.stuck || []).length + ', nums ' + W.nums.length, cfg); return; }
    if (P.bowDraw > 10) { fault(seed, 'the bow drawn for ' + P.bowDraw.toFixed(1), cfg); return; }
    if (P.st < -1 || P.st > P.maxSt + 50) { fault(seed, 'stamina out of bounds: ' + P.st.toFixed(1), cfg); return; }
    if (P.hp > P.maxHp + 0.01) { fault(seed, 'health above its top: ' + P.hp.toFixed(1) + ' of ' + P.maxHp, cfg); return; }
  }
  KEYS.concat(['KeyC', 'ControlLeft']).forEach(k => Combat.key(k, false)); Combat.button(0, false); Combat.button(2, false);
  for (let f = 0; f < 180; f++) Combat.update(DT);
  if (P.throwQ || P.trapAim || P.roll.t > 0 || P.bowDraw > 0) fault(seed, 'with every key let go the hero still ' + (P.throwQ ? 'holds a throw' : P.trapAim ? 'aims a trap' : P.roll.t > 0 ? 'dashes' : 'draws the bow'), cfg);
  return { kills: W.enemies.filter(e => e.dead).length, cfg };
}
let ok = 0, kills = 0;
for (let s = 1; s <= SEEDS; s++) { const r = run(s); if (r) { ok++; kills += r.kills; } }
console.log('  ' + SEEDS + ' seeds of ' + SECS + ' s, every slot a random rune at a random tier: ' + ok + ' ran to the end, ' + kills + ' foes fell in all');
console.log(faults ? '!! ' + faults + ' faults (' + Object.keys(seen).length + ' kinds)' : '  no fault found');
