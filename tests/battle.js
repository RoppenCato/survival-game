// Fights between men, with no screen (docs/battle-plan.md: every rung of the ladder is tried here before it is played).
//   node tests/battle.js            the short run that npm test makes: a few fights of every rung, and what must not happen
//   node tests/battle.js one [n]    rung 1: the hero, played by three bots, against one hirdman; n fights a line (200)
//   node tests/battle.js two [n]    rung 2: against two
//   node tests/battle.js friend [n] rung 3: two against the hero and one friend; and a friend alone against his equal
//   node tests/battle.js five [n]   rung 4: five against five with no hero, then with him
//   node tests/battle.js duels [n]  every weapon against every weapon, man against man
//   node tests/battle.js bows [n]   rung 5: men with bows, alone, in a fight, behind their own, at a wall
//   node tests/battle.js raid       rung 6: the blow from behind, the errand (the raid itself is played in the page: tools/visual/raidplay.js)
//   node tests/battle.js town [n] [secs]  rung 5: n towns (12) from n seeds, the hero and five friends in at the gate and at the back gate
// The hero's bots: the TAPPER walks up and taps the attack, nothing else (a careless player); the CAREFUL one raises the
// shield at a blow it sees coming and strikes when the man is open; the SKILLED one parries, steps out of a heavy blow, and
// uses what its weapon is good at. A real player is somewhere between the last two.
// Like every test here it prints and does not assert: read the lines. A line marked !! is a fault (a fight that never ended,
// a man stuck, a number that is not a number).
const { createCanvas } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
global.GameArt = require('../src/art.js'); global.Items = require('../src/items.js');
const lib = GameArt.lib, Combat = require(process.env.ENGINE || '../src/combat.js'), Hird = require('../src/hird.js');
Combat.api.roster = []; Combat.init(lib);
const Village = require('../src/village.js'), Nav = require('../src/nav.js'), Build = require('../src/build.js');
const FPS = 60, DT = 1 / FPS, LIMIT = 180;
const LEATHER = ['helmet', 'tunic', 'trousers', 'boots', 'cloak'].reduce((s, k) => s + Items.stats(Items.make(k, 'leather')).armor, 0);
const GEAR = { cloth: { armor: 0, shield: false }, leather: { armor: 0.2, shield: true }, mail: { armor: 0.4, shield: true } };
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
function person(o) { return Object.assign({ hp: 30, strength: 4, wits: 4, nerve: 1 }, o || {}); }      // an even man who does not yield (so a fight is fought out) unless the test says otherwise
function rolled() { const p = Hird.roll(Math.random); return { hp: p.stats.health, strength: p.stats.strength, wits: p.stats.wits, aim: p.stats.aim, loyal: p.traits.indexOf('loyal') >= 0, nerve: 0.5 }; }
function man(side, wpn, gear, x, y, o) { const g = GEAR[gear || 'leather']; return Combat.soldier(Object.assign({ side, wpn: { kind: wpn, mat: 'iron' }, shield: g.shield, armor: g.armor, x, y }, person(o))); }
function keys(ang, go) { Combat.key('KeyD', go && Math.cos(ang) > 0.38); Combat.key('KeyA', go && Math.cos(ang) < -0.38); Combat.key('KeyS', go && Math.sin(ang) > 0.38); Combat.key('KeyW', go && Math.sin(ang) < -0.38); }
function threatOf(D) {                          // the blow that will reach the hero soonest, and in how long
  const P = D.P; let best = null;
  for (const e of D.W.enemies) { if (e.dead || e.side === 1 || e.type !== 'soldier' || !e.sw || e.tgt !== P) continue; if (e.state !== 'windup' && !(e.state === 'lunge' && !e.hitDone)) continue;
    const d = Math.hypot(e.x - P.x, e.y - P.y); if (d > e.sw.reach + 34) continue; const hit = e.sw.ac * Combat.api.men.hitAt, tti = e.state === 'windup' ? e.dur - e.t + hit : hit - e.t;
    if (!best || tti < best.tti) best = { e, tti, d, heavy: e.sw.heavy }; }
  for (const pr of D.W.projs) { if (pr.owner !== 'man' || pr.side !== 0) continue; const rx = P.x - pr.x, ry = P.y - pr.y, sp = Math.hypot(pr.vx, pr.vy), along = (rx * pr.vx + ry * pr.vy) / sp, off = Math.abs(rx * pr.vy - ry * pr.vx) / sp;   // an arrow on its way to him
    if (along > 0 && off < 14 && along / sp < 0.5 && (!best || along / sp < best.tti)) best = { e: pr.src, tti: along / sp, d: along, heavy: false, arrow: pr }; }
  return best;
}
// A bot is a person: it sees a blow a moment after it begins (its reaction), its timing wanders (jitter), and now and then it
// does not see the blow at all (missed). what() says how this blow is met.
const HUMAN = { careful: { react: 0.2, miss: 0.12, jitter: 0 }, skilled: { react: 0.12, miss: 0.06, jitter: 0.18 } };
function meets(st, th, who) {
  const H = HUMAN[who], tn = th.arrow || th.e.swingN; if (st.thr !== th.e || st.thrN !== tn) { st.thr = th.e; st.thrN = tn; st.seen = 0; st.blind = Math.random() < H.miss; st.jit = (Math.random() - 0.5) * H.jitter; }
  st.seen += DT; return !st.blind && st.seen >= H.react;
}
const BOTS = {
  idle() { keys(0, false); Combat.key('KeyK', false); Combat.button(0, false); },           // he stands by
  tapper(D, st, foes) {
    const P = D.P, t = foes[0], d = Math.hypot(t.x - P.x, t.y - P.y), ang = Math.atan2(t.y - P.y, t.x - P.x);
    keys(ang, d > 34); Combat.key('KeyK', false); Combat.button(0, d < 60 && st.frame % 14 < 3);
  },
  careful(D, st, foes) {
    const P = D.P, t = foes[0], d = Math.hypot(t.x - P.x, t.y - P.y), ang = Math.atan2(t.y - P.y, t.x - P.x), th = threatOf(D), reach = st.reach + t.r;
    D.W.lock = t;
    if (th && th.tti < 0.6 && meets(st, th, 'careful')) { keys(ang, false); Combat.button(0, false); Combat.key('KeyK', true); return; }       // a blow coming: the shield, and nothing else
    Combat.key('KeyK', false);
    const open = t.state === 'recover' || t.state === 'stagger' || t.state === 'yield' || !(t.guard > 0) || st.breaks;
    keys(ang, d > reach - 2); Combat.button(0, open && d < reach + 8 && P.st > 20 && st.frame % 12 < 3);
  },
  skilled(D, st, foes) {
    const P = D.P, t = foes[0], d = Math.hypot(t.x - P.x, t.y - P.y), ang = Math.atan2(t.y - P.y, t.x - P.x), th = threatOf(D), reach = st.reach + t.r;
    D.W.lock = t; Combat.key('Space', false);
    if (th && meets(st, th, 'skilled')) {
      if (th.heavy) { if (th.tti < 0.22 && P.roll.cd <= 0 && P.st >= 18) { keys(ang + Math.PI, true); Combat.key('Space', true); } else keys(ang + Math.PI, th.tti < 0.5); Combat.key('KeyK', false); Combat.button(0, false); return; }   // a heavy blow is stepped out of, not met
      keys(ang, false); Combat.button(0, false); Combat.key('KeyK', th.tti <= 0.15 + st.jit); return;                                   // the shield up at the last moment: a parry
    }
    Combat.key('KeyK', false);
    const dazed = t.state === 'recover' || t.state === 'stagger', open = dazed || !(t.guard > 0) || st.breaks;
    keys(ang, d > reach - 2); Combat.button(0, open && d < reach + 8 && P.st > 12 && st.frame % 10 < 3);
  }
};
function hero(weapon, armour) {                  // weapon: [kind, material]
  const it = Items.make(weapon[0], weapon[1]); Combat.api.armor = () => armour; Combat.api.items = { held: () => it, tool: () => null, weapon: k => (k === 'bow' ? null : it) };
  const pf = Combat.api.profiles()[it.kind] || Combat.api.profiles().sword; return { reach: pf.reach, breaks: !!pf.guardBreak || pf.stag >= 30 };
}
// One fight. S: { hero: { bot, weapon, armour } or null, foes: [[wpn, gear, opts]...], friends: [[wpn, gear, opts]...] }.
function fight(S) {
  Combat.reset(); const D = Combat.dbg(), P = D.P; P.x = 200; P.y = 250; P.mode = 'fight'; P.weapon = 'melee'; D.W.pillars = [];
  let st = { frame: 0 };
  if (S.hero) Object.assign(st, hero(S.hero.weapon, S.hero.armour)); else { P.hidden = true; P.x = -4000; Combat.api.items = null; }
  Combat.api.scene = { begin() {}, items() {}, bounds: { x0: -5000, y0: -5000, x1: 5000, y1: 5000 } };
  const line = S.line;
  const foes = S.foes.map((f, i) => { const m = man(0, f[0], f[1], 330 + (i % 2) * 26, 250 + (i - (S.foes.length - 1) / 2) * 34, f[2]); if (!S.hero) m.sight = 3000; return m; }), friends = (S.friends || []).map((f, i) => { const m = man(1, f[0], f[1], 170 - (i % 2) * 26, 250 + (i - ((S.friends.length - 1) / 2)) * 34 + (S.hero ? 30 : 0), f[2]); m.leash = 1e9; if (!S.hero) m.sight = 3000; if (line) { m.x = 170; m.y = 250 + (i - (S.friends.length - 1) / 2) * 17; m.order = 'hold'; m.holdAt = { x: m.x, y: m.y, face: 0 }; } return m; });
  let t = 0, hp0 = P.hp, worstChain = 0, chain = 0, lastHp = P.hp, lastHurtT = -9, stuck = 0, stuckMax = 0, nan = false, held = 0, heldMax = 0, closest = 9; const pos = foes.concat(friends).map(e => [e.x, e.y]);
  const alive = L => L.filter(e => !e.dead && !e.down && !e.fled && !e.out);
  while (t < LIMIT) {
    const F = alive(foes), A = alive(friends);
    if (!F.length) break; if (S.hero ? P.dead : !A.length) break;
    if (S.hero && !P.dead) { F.sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)); BOTS[S.hero.bot](D, st, F); }
    Combat.update(DT); t += DT; st.frame++;
    if (P.hp < lastHp - 0.01) { closest = Math.min(closest, t - lastHurtT); chain = t - lastHurtT < 1.0 ? chain + 1 : 1; worstChain = Math.max(worstChain, chain); lastHurtT = t; } lastHp = P.hp;
    held = !P.dead && P.hurtT > 0 ? held + DT : 0; heldMax = Math.max(heldMax, held);
    if (st.frame % 60 === 0) { let moved = false; foes.concat(friends).forEach((e, i) => { if (Math.hypot(e.x - pos[i][0], e.y - pos[i][1]) > 2 || e.dead || e.down || e.out) moved = true; pos[i] = [e.x, e.y]; if (e.x !== e.x || e.hp !== e.hp) nan = true; }); const busy = foes.concat(friends).some(e => e.state === 'windup' || e.state === 'lunge' || e.state === 'recover' || e.state === 'stagger'); stuck = moved || busy || (S.hero && Math.hypot(P.vx, P.vy) > 5) ? 0 : stuck + 1; stuckMax = Math.max(stuckMax, stuck); }
  }
  ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyK', 'Space'].forEach(k => Combat.key(k, false)); Combat.button(0, false);
  const F2 = alive(foes), A2 = alive(friends), won = !F2.length && (S.hero ? !P.dead : true);
  return { won, lost: S.hero ? P.dead : (!A2.length && F2.length > 0), time: t, left: P.hp, lostHp: hp0 - P.hp, timeout: t >= LIMIT, worstChain, heldMax, closest, stuck: stuckMax, nan, yielded: foes.filter(e => e.out && !e.dead).length, friendsUp: A2.length, friendsDown: friends.filter(e => e.down || e.dead).length, friendsLeft: friends.reduce((q, e) => q + Math.max(0, e.hp) / e.maxHp, 0) / Math.max(1, friends.length), foesOnHero: foes.filter(e => e.tgt === P).length, foesDead: foes.filter(e => e.dead || e.out).length };
}
function run(S, n) {
  const R = { won: 0, lost: 0, timeout: 0, time: 0, left: 0, chain: 0, held: 0, closest: 9, stuck: 0, nan: 0, longest: 0, yielded: 0, friendsDown: 0, friendsLeft: 0, foesDead: 0 };
  for (let i = 0; i < n; i++) { const r = fight(typeof S === 'function' ? S() : S); if (r.won) { R.won++; R.time += r.time; R.left += r.left; } if (r.lost) R.lost++; if (r.timeout) R.timeout++; R.chain = Math.max(R.chain, r.worstChain); R.held = Math.max(R.held, r.heldMax); R.closest = Math.min(R.closest, r.closest); R.stuck = Math.max(R.stuck, r.stuck); if (r.nan) R.nan++; R.longest = Math.max(R.longest, r.time); R.yielded += r.yielded; R.friendsDown += r.friendsDown; R.friendsLeft += r.friendsLeft / n; R.foesDead += r.foesDead / n; }
  R.n = n; R.pct = Math.round(R.won / n * 100); R.secs = R.won ? (R.time / R.won).toFixed(0) : '-'; R.hp = R.won ? Math.round(R.left / R.won) : '-'; return R;
}
const pad = (s, n) => String(s).padEnd(n), lpad = (s, n) => String(s).padStart(n);
function line(label, R, extra) {
  const bad = R.timeout || R.nan || R.stuck >= 6;
  console.log((bad ? '!! ' : '   ') + pad(label, 58), 'won', lpad(R.pct, 3) + '%', ' in', lpad(R.secs, 3) + 's', ' left', lpad(R.hp, 3), ' longest', lpad(R.longest.toFixed(0), 3) + 's', R.timeout ? ' NEVER ENDED x' + R.timeout : '', R.stuck >= 6 ? ' STOOD STILL ' + R.stuck + 's' : '', R.nan ? ' NaN' : '', extra || '');
}
if (process.env.BOW) Object.assign(Combat.api.men.bow, JSON.parse(process.env.BOW));     // (for trying a bowman's numbers: BOW='{"toMen":0.7}')
const mode = process.argv[2] || 'short', N = +process.argv[3] || (mode === 'short' ? 12 : 200);
const HEROES = [['tapper', ['sword', 'flint'], LEATHER], ['careful', ['sword', 'flint'], LEATHER], ['skilled', ['sword', 'flint'], LEATHER]];
function one(n) {
  console.log('--- one hirdman (rung 1). The hero in leather (' + LEATHER.toFixed(2) + ' of a blow turned aside). ' + n + ' fights a line');
  console.log('    aimed at: an axe in leather: the tapper loses more often than not, the careful bot wins most, the skilled nearly always; in mail with a shield: loses, about even, wins most; 15 to 40 s');
  [['axe', 'leather'], ['axe', 'mail']].forEach(([w, g]) => HEROES.forEach(([bot, wp, ar]) => line(bot + ' with a flint sword against an ' + w + ' in ' + g, run({ hero: { bot, weapon: wp, armour: ar }, foes: [[w, g]] }, n))));
  console.log('    his weapons, against the careful bot with an iron sword:');
  ['sword', 'axe', 'club', 'seax', 'spear', 'greataxe'].forEach(w => line('careful, iron sword, against a ' + w + ' in leather', run({ hero: { bot: 'careful', weapon: ['sword', 'iron'], armour: LEATHER }, foes: [[w, 'leather']] }, n)));
  console.log('    the hero\'s weapons (iron), the skilled bot, against a sword and shield in mail:');
  ['sword', 'axe', 'club', 'seax', 'spear', 'greataxe'].forEach(w => line('skilled with an iron ' + w, run({ hero: { bot: 'skilled', weapon: [w, 'iron'], armour: LEATHER }, foes: [['sword', 'mail']] }, n)));
  console.log('    his wits (the shield comes up sooner, he waits less), against the careful bot with an iron sword:');
  [1, 4, 7].forEach(wits => line('wits ' + wits, run({ hero: { bot: 'careful', weapon: ['sword', 'iron'], armour: LEATHER }, foes: [['sword', 'leather', { wits }]] }, n)));
  const y = run({ hero: { bot: 'careful', weapon: ['axe', 'iron'], armour: LEATHER }, foes: [['sword', 'leather', { nerve: 0.3 }]] }, n); line('a man of little nerve (he may yield or run)', y, ' gave up ' + y.yielded + ' of ' + n);
}
function two(n) {
  console.log('--- two (rung 2). ' + n + ' fights a line. Aimed at: clearly worse than one; the careful bot can win; no two blows landing together, and the hero never held (unable to act) for longer than he could dash out of');
  [[['axe', 'leather'], ['axe', 'leather']], [['axe', 'leather'], ['spear', 'leather']], [['sword', 'mail'], ['sword', 'mail']]].forEach(pair => HEROES.forEach(([bot]) => { const R = run({ hero: { bot, weapon: ['sword', 'iron'], armour: LEATHER }, foes: pair }, n); line(bot + ', iron sword, against ' + pair.map(p => p[0] + ' in ' + p[1]).join(' and '), R, ' | two blows never closer than ' + R.closest.toFixed(2) + 's, never held longer than ' + R.held.toFixed(2) + 's' + (R.held > 0.6 ? ' !!' : '')); }));
}
function friend(n) {
  console.log('--- a friend (rung 3). ' + n + ' fights a line. Aimed at: a friend alone against his equal wins about half; with a friend the same fight is easier and not won for you');
  ['sword', 'axe', 'spear', 'club', 'seax', 'greataxe'].forEach(w => line('a friend with a ' + w + ' alone against a man with a sword', run({ foes: [['sword', 'leather']], friends: [[w, 'leather']] }, n)));
  line('rolled men, one against one', run(() => ({ foes: [['sword', 'leather', rolled()]], friends: [['sword', 'leather', rolled()]] }), n));
  friendChecks();
  HEROES.forEach(([bot]) => { const a = run({ hero: { bot, weapon: ['sword', 'iron'], armour: LEATHER }, foes: [['axe', 'leather'], ['axe', 'leather']] }, n), b = run({ hero: { bot, weapon: ['sword', 'iron'], armour: LEATHER }, foes: [['axe', 'leather'], ['axe', 'leather']], friends: [['sword', 'leather']] }, n); line(bot + ' against two, alone', a); line(bot + ' against two, with a friend', b, ' the friend went down in ' + b.friendsDown + ' of ' + n + ' and had ' + Math.round(b.friendsLeft * 100) + '% of his health left'); });
}
// What a friend must do and must not (rung 3): each line says what was seen; !! is a fault.
function friendChecks() {
  console.log('    a friend, by himself:');
  const say = (ok, text) => console.log((ok ? '   ' : '!! ') + text);
  const fresh = (heroAt) => { Combat.reset(); const D = Combat.dbg(), P = D.P; P.x = heroAt ? heroAt[0] : 200; P.y = heroAt ? heroAt[1] : 250; P.mode = 'fight'; P.weapon = 'melee'; D.W.pillars = []; hero(['sword', 'iron'], LEATHER); Combat.api.scene = { begin() {}, items() {}, bounds: { x0: -5000, y0: -5000, x1: 5000, y1: 5000 } }; return D; };
  const run = (secs, each) => { for (let i = 0, n = Math.round(secs * FPS); i < n; i++) { if (each) each(i * DT); Combat.update(DT); } };
  const off = () => { ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyK', 'Space', 'ShiftLeft'].forEach(k => Combat.key(k, false)); Combat.button(0, false); };
  // 1. he follows: the hero walks a square, then runs; where is the friend
  let D = fresh(), P = D.P, f = man(1, 'sword', 'leather', 180, 280), sum = 0, n = 0, far = 0, close = 0;
  run(24, t => { const leg = Math.floor(t / 3) % 4; Combat.key('KeyD', leg === 0); Combat.key('KeyS', leg === 1); Combat.key('KeyA', leg === 2); Combat.key('KeyW', leg === 3); Combat.key('ShiftLeft', t > 12); const d = Math.hypot(f.x - P.x, f.y - P.y); if (t > 2) { sum += d; n++; far = Math.max(far, d); if (d < 10) close++; } });
  off(); say(far < 130 && close / n < 0.05, 'following a walking and a running hero for 24 s: ' + Math.round(sum / n) + ' units from him on average, never more than ' + Math.round(far) + '; in his way ' + Math.round(close / n * 100) + '% of the time');
  // 2. the leash: a man far off is left alone
  D = fresh(); P = D.P; f = man(1, 'sword', 'leather', 180, 280); let foe = man(0, 'sword', 'leather', 200 + 560, 250); foe.hold = true; far = 0;
  run(8, () => { far = Math.max(far, Math.hypot(f.x - P.x, f.y - P.y)); }); say(far < 100 && !f.tgt, 'a man 560 units off (the leash is ' + Combat.api.men.leash + '): the friend stays (' + Math.round(far) + ' from the hero at most)');
  // 3. he takes what the hero strikes
  D = fresh(); P = D.P; f = man(1, 'sword', 'leather', 180, 280); const a = man(0, 'sword', 'leather', 300, 200), b = man(0, 'sword', 'leather', 300, 320); a.hold = b.hold = true; a.hp = b.hp = 999;
  run(1.5); const first = f.tgt; const other = first === a ? b : a; D.W.heroHit = other; D.W.heroHitT = D.W.t; run(1.5);
  say(first && f.tgt === other, 'two men standing: he went for ' + (first === a ? 'the first' : first === b ? 'the second' : 'nobody') + ', and when the hero struck the other he ' + (f.tgt === other ? 'turned to that one' : 'did not turn'));
  // 4. the hero's blade passes through him
  D = fresh(); P = D.P; f = man(1, 'sword', 'leather', 226, 250); f.order = 'hold'; f.holdAt = { x: 226, y: 250 }; const hp0 = f.hp; P.face = 0;
  run(3, t => { Combat.button(0, Math.floor(t * 60) % 14 < 3); }); off(); say(f.hp === hp0 && !f.down, 'the hero swings at a friend in front of him for 3 s: ' + (f.hp === hp0 ? 'no hurt' : 'HURT ' + (hp0 - f.hp).toFixed(1)));
  // 5. down, and up again when it is over; left behind, he dies
  D = fresh(); P = D.P; f = man(1, 'sword', 'cloth', 180, 250, { hp: 2 }); foe = man(0, 'sword', 'leather', 215, 250, { hp: 200 }); let wentDown = -1;
  run(45, t => { P.hp = P.maxHp; if (f.down && wentDown < 0) wentDown = t; }); const wasDown = f.down && !f.dead; foe.dead = true; foe.deadT = 0; let upAt = -1; run(8, t => { if (!f.down && upAt < 0) upAt = t; });
  say(wasDown && upAt > 0 && f.hp > 0 && !f.dead, 'a friend with little health against a strong man: ' + (wasDown ? 'down after ' + wentDown.toFixed(1) + ' s, not dead' : 'NOT down (' + (f.dead ? 'dead' : 'standing') + ')') + '; the man gone, he is ' + (upAt > 0 ? 'up again after ' + upAt.toFixed(1) + ' s with ' + f.hp.toFixed(0) + ' health' : 'STILL down'));
  D = fresh(); P = D.P; f = man(1, 'sword', 'cloth', 180, 250, { hp: 2 }); foe = man(0, 'sword', 'leather', 215, 250, { hp: 200 }); run(45, () => { P.hp = P.maxHp; }); const d2 = f.down; P.x = 2000; P.hidden = true; let deadAt = -1; run(30, t => { if (f.dead && deadAt < 0) deadAt = t; });
  say(d2 && deadAt > 0, 'down, and the hero gone 1800 units away: ' + (deadAt > 0 ? 'dead after ' + deadAt.toFixed(0) + ' s' : 'never dies'));
  // 6. the two orders
  D = fresh(); P = D.P; f = man(1, 'sword', 'leather', 180, 280); run(1); Combat.order('hold'); const at = f.holdAt; far = 0;
  run(6, t => { Combat.key('KeyD', t < 3); if (t > 1.5 && at) far = Math.max(far, Math.hypot(f.x - at.x, f.y - at.y)); }); off(); const away = Math.hypot(f.x - P.x, f.y - P.y); Combat.order('follow'); run(4); const back = Math.hypot(f.x - P.x, f.y - P.y);
  say(at && far < 8 && away > 150 && back < 60, 'told to hold, he stood (' + far.toFixed(0) + ' units from his place at most) while the hero walked ' + Math.round(away) + ' off; called, he was ' + Math.round(back) + ' from the hero 4 s later');
  // 7. a man on his knees is left alone; a man called breaks off
  D = fresh(); P = D.P; f = man(1, 'sword', 'leather', 180, 250); foe = man(0, 'sword', 'leather', 240, 250, { hp: 200 }); foe.state = 'yield'; foe.out = true; const yhp = foe.hp; run(4);
  say(foe.hp === yhp && f.tgt !== foe, 'a man on his knees beside him: ' + (foe.hp === yhp ? 'left alone' : 'STRUCK'));
  D = fresh(); P = D.P; f = man(1, 'sword', 'leather', 180, 250); foe = man(0, 'sword', 'leather', 320, 250, { hp: 200 }); foe.hold = true; run(3); const fighting = f.tgt === foe; Combat.order('follow'); run(1.2); const dropped = !f.tgt;
  say(fighting && dropped, 'in a fight and called: ' + (fighting ? '' : '(he was not fighting) ') + (dropped ? 'he breaks off' : 'he fights on'));
}
// Every weapon against every weapon, man against man with no hero: the share the row's man wins (the tool for any question of balance).
function duels(n) {
  const W = ['sword', 'axe', 'club', 'seax', 'spear', 'greataxe']; let never = 0;
  console.log('--- duels: your man (the row) against his foe (the column), both in leather with shields, even men; ' + n + ' a cell; the share yours wins and the mean length');
  console.log(''.padEnd(13) + W.map(w => w.padStart(12)).join(''));
  W.forEach(a => { let ln = '   ' + a.padEnd(10); W.forEach(b => { const R = run({ foes: [[b, 'leather']], friends: [[a, 'leather']] }, n); never += R.timeout; ln += (R.pct + '% ' + R.secs + 's').padStart(12); }); console.log(ln); });
  console.log(never ? '!! ' + never + ' duels never ended' : '   every duel ended');
}
function five(n) {
  console.log('--- five against five (rung 4). ' + n + ' fights a line. Aimed at: equal sides an even coin; one to two minutes; nobody stuck');
  const side = (w, g) => [0, 1, 2, 3, 4].map(() => [w, g]);
  line('equal sides (swords, leather), no hero: your side', run({ foes: side('sword', 'leather'), friends: side('sword', 'leather') }, n));
  line('rolled men on both sides, mixed weapons', run(() => { const W = ['sword', 'axe', 'spear', 'club', 'seax']; return { foes: W.map(w => [w, 'leather', rolled()]), friends: W.map(w => [w, 'leather', rolled()]) }; }, n));
  line('your side in mail', run({ foes: side('sword', 'leather'), friends: side('sword', 'mail') }, n));
  line('your side with spears', run({ foes: side('sword', 'leather'), friends: side('spear', 'leather') }, n));
  line('equal sides, yours told to hold a line (shoulder to shoulder, shields up)', run({ foes: side('sword', 'leather'), friends: side('sword', 'leather'), line: true }, n));
  const seven = [0, 1, 2, 3, 4, 5, 6].map(() => ['sword', 'leather']);
  const free7 = run({ foes: seven, friends: side('sword', 'leather') }, n), line7 = run({ foes: seven, friends: side('sword', 'leather'), line: true }, n);
  line('five against seven, yours fighting as they like', free7, ' they took ' + free7.foesDead.toFixed(1) + ' of the seven with them, and lasted ' + (free7.longest).toFixed(0) + ' s at most');
  line('five against seven, yours in a line', line7, ' they took ' + line7.foesDead.toFixed(1) + ' of the seven with them');
  line('spears in a line against swords', run({ foes: side('sword', 'leather'), friends: side('spear', 'leather'), line: true }, n));
  line('the hero standing by (he does nothing) with four friends against five', run({ hero: { bot: 'idle', weapon: ['sword', 'iron'], armour: LEATHER }, foes: side('sword', 'leather'), friends: side('sword', 'leather').slice(0, 4) }, Math.max(4, Math.round(n / 2))));
  HEROES.forEach(([bot]) => line('with the hero (' + bot + ', iron sword) and four friends against five', run({ hero: { bot, weapon: ['sword', 'iron'], armour: LEATHER }, foes: side('sword', 'leather'), friends: side('sword', 'leather').slice(0, 4) }, Math.max(4, Math.round(n / 2)))));
}
// ---- A town full of men, attacked (rung 5). The town is grown as the game grows it (Village.make, the 'town' archetype), its
// men stand where the game puts them (Village.garrison), the walls are the game's grid (src/nav.js) and the engine is asked the
// same three questions (Nav.attach). The hero is kept alive so that every town is played to its end (the line says when he
// would have fallen). What a line says: when the town's men were up (how the answer builds), when the first and the last of
// them reached the fight, who stood still for five seconds with somewhere to go, the longest wait at a gate or a door, and
// what an update cost. ----
const RAD = {}; require('fs').readFileSync(require('path').join(__dirname, '../templates/game.html'), 'utf8').replace(/prop: '(\w+)'[^}]*?\br: ([\d.]+)/g, (m, k, r) => { RAD[k] = +r; });   // how big each placed thing is to a walker: the game's own table (PIECES)
function townMake(seed) {
  const T = 32, site = Village.siteFor('town'), V = Village.make(seed, { tx: 20, ty: 20, w: site.w, h: site.h, shore: null }, { arch: 'town', wealth: 0.7, biome: 1 });
  const B = { H: {}, V: {}, items: [], posts: {} }; for (const k in V.H) B.H[k] = Object.assign({}, V.H[k]); for (const k in V.V) B.V[k] = Object.assign({}, V.V[k]);
  const solids = [];
  V.items.forEach(it => { const r = it.r != null ? it.r : (it.name === 'cellarDoor' ? 0 : RAD[it.name] != null ? RAD[it.name] : 8); if (r) { solids.push({ x: it.x, y: it.y, r, hide: true }); } });
  V.props.forEach(p => { const r = p.solid != null ? p.solid : 8; if (r) { solids.push({ x: p.x, y: p.y, r, hide: true }); } });
  V.nature.forEach(n => { if (n.r) { solids.push({ x: n.x, y: n.y, r: n.r, hide: true }); } });
  const walls = Build.rooms(B, 140, 140, { x0: 0, y0: 0, x1: 139, y1: 139 }).solids;
  const g = Nav.make({ x0: 11, y0: 11, w: site.w + 18, h: site.h + 18, T, open: () => true, edge: Nav.edgeOf(B), solids: () => solids }); g.vi = 0;
  return { T, V, B, g, solids, walls };
}
// The hero at a town: he makes for the nearest man who is up (or, when none is, the nearest at all: the first blow is the
// first noise), by the grid, and fights as the careful bot does.
function raider(D, st, foes, g, t) {
  const P = D.P, th = threatOf(D), up = foes.filter(e => e.awake !== false), L = up.length ? up : foes, tg = L[0];
  if (th && th.tti < 0.6 && meets(st, th, 'careful')) { keys(0, false); Combat.button(0, false); Combat.key('KeyK', true); return; }
  Combat.key('KeyK', false); if (!tg) { keys(0, false); Combat.button(0, false); return; }
  const d = Math.hypot(tg.x - P.x, tg.y - P.y), wp = g.next(P, tg.x, tg.y, t, false), reach = st.reach + tg.r;
  // (a player walks round a bench; the bot, pressing straight at it, would stand there: making no way, it steps to one side for a moment)
  st.pt = (st.pt || 0) + DT; if (st.sideT > 0) st.sideT -= DT; if (st.pt >= 0.5) { const made = Math.hypot(P.x - (st.px || 0), P.y - (st.py || 0)); st.pt = 0; st.px = P.x; st.py = P.y; if (made < 3 && d > reach + 30 && !(wp && wp.wait) && !(st.sideT > 0)) { st.sideT = 0.5; st.sideS = -(st.sideS || 1); } }
  const turn = st.sideT > 0 ? st.sideS * 1.4 : 0;
  if (wp) { if (wp.wait) { keys(0, false); st.waited = (st.waited || 0) + DT; } else keys(Math.atan2(wp.y - P.y, wp.x - P.x) + turn, true); Combat.button(0, false); return; }
  if (turn) { keys(Math.atan2(tg.y - P.y, tg.x - P.x) + turn, true); Combat.button(0, false); return; }
  const ang = Math.atan2(tg.y - P.y, tg.x - P.x), open = tg.state === 'recover' || tg.state === 'stagger' || !(tg.guard > 0) || st.breaks; D.W.lock = tg;
  keys(ang, d > reach - 2); Combat.button(0, open && d < reach + 8 && P.st > 20 && st.frame % 12 < 3);
}
// One town. o: { from: 'gate' | 'back', n, secs, quiet }. quiet: nobody comes; a noise at the gate, and the town is watched going back to its day.
function townFight(seed, o) {
  const TW = townMake(seed), { T, V, B, g, solids, walls } = TW, F = V.fence, R = Village.rng(seed * 7 + 5);
  Combat.reset(); const D = Combat.dbg(), P = D.P; P.mode = 'fight'; P.weapon = 'melee'; let t = 0;
  Combat.api.scene = { begin() {}, items() {}, bounds: { x0: 0, y0: 0, x1: 140 * T, y1: 140 * T } };
  Nav.attach(Combat, (x, y) => g.inside(x, y) ? g : null, () => t);
  const st = Object.assign({ frame: 0 }, hero(['sword', 'iron'], LEATHER));
  let back = null; for (let i = F.x0; i < F.x1; i++) if (V.H[i + ',' + F.y0] && V.H[i + ',' + F.y0].t === 'gate') back = i;
  const fromBack = o.from === 'back' && back != null, gx = fromBack ? (back + 0.5) * T : (F.gate + (F.gateW || 1) / 2) * T, gy = fromBack ? F.y0 * T : F.y1 * T, out = fromBack ? -1 : 1;
  const men = Village.garrison(V, o.n || 20, R).map(q => { const p = Hird.roll(R), G = q.kind === 'hall' || q.kind === 'gate' ? GEAR.mail : GEAR.leather, hall = q.kind === 'hall';
    const e = Combat.soldier({ side: 0, x: q.x, y: q.y, post: { x: q.x, y: q.y, face: q.face }, aggro: 0.5, vi: 0, wakeDelay: q.delay, wpn: { kind: q.wpn, mat: 'iron' }, shield: G.shield, armor: G.armor, hp: p.stats.health + (hall ? 8 : 0), strength: p.stats.strength + (hall ? 1 : 0), wits: hall ? Math.max(5, p.stats.wits) : p.stats.wits, aim: p.stats.aim, loyal: hall || p.traits.indexOf('loyal') >= 0, nerve: hall ? 0.9 : 0.5 });
    e.face = q.face; e.kindOf = q.kind; e.upAt = -1; e.metAt = -1; return e; });
  let friends = [];
  if (o.quiet) { P.hidden = true; P.x = -4000; P.y = -4000; }
  else { P.x = gx; P.y = gy + out * 6.5 * T; P.face = -out * Math.PI / 2; friends = ['sword', 'axe', 'spear', 'sword', 'bow'].map((w, i) => man(1, w, 'leather', gx + (i - 2) * 30, gy + out * (7.6 * T + (i % 2) * 16), rolled())); }
  const all = men.concat(friends), last = all.map(e => ({ x: e.x, y: e.y, still: 0 })), R2 = { stuck: 0, who: '', choke: 0, ms: 0, worst: 0, n: 0, fell: -1, hurt: 0, backAt: -1, went: 0, nan: false };
  const gone = e => e.dead || e.fled || e.out, limit = o.secs || 300; let lastHp = P.hp, chokeRun = new Map();
  while (t < limit) {
    const F2 = men.filter(e => !gone(e));
    if (o.gate) { if (st.frame === 20) { P.x = gx; P.y = gy + 96; P.face = -Math.PI / 2; friends.forEach((f, i) => { f.x = gx + (i - 2) * 17; f.y = gy + 72; }); if (o.gate === 'hold') Combat.order('hold'); } if (st.frame === 60) Combat.noise(gx, gy, 520); if (st.frame > 60 && (!F2.length || !friends.some(f => !f.down && !f.dead))) { R2.heldFor = t; break; } }
    else if (!o.quiet) { if (!F2.length) break; F2.sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)); raider(D, st, F2, g, t); }
    else if (st.frame === 60) Combat.noise(gx, gy, 520);
    D.W.pillars = o.quiet ? [] : solids.filter(s => Math.abs(s.x - P.x) < 330 && Math.abs(s.y - P.y) < 330).concat(walls.filter(s => Math.abs(s.x - P.x) < 160 && Math.abs(s.y - P.y) < 160));
    if (!o.quiet) for (const k in B.H) { const e = B.H[k]; if (e.t === 'door' && e.locked) { const p = k.split(','), dx = (+p[0] + 0.5) * T, dy = p[1] * T; if (Math.abs(dx - P.x) < 160 && Math.abs(dy - P.y) < 160) D.W.pillars.push({ x: dx, y: dy, r: 11, hide: true }, { x: dx - 10, y: dy, r: 7, hide: true }, { x: dx + 10, y: dy, r: 7, hide: true }); } }
    if (!o.quiet) for (const k in B.V) { const e = B.V[k]; if (e.t === 'door' && e.locked) { const p = k.split(','), dx = p[0] * T, dy = (+p[1] + 0.5) * T; if (Math.abs(dx - P.x) < 160 && Math.abs(dy - P.y) < 160) D.W.pillars.push({ x: dx, y: dy, r: 11, hide: true }, { x: dx, y: dy - 8, r: 7, hide: true }, { x: dx, y: dy + 8, r: 7, hide: true }); } }
    const m0 = process.hrtime.bigint(); Combat.update(DT); const ms = Number(process.hrtime.bigint() - m0) / 1e6; R2.ms += ms; R2.n++; R2.worst = Math.max(R2.worst, ms);
    if (Nav.unlock(g, B)) g.read();
    t += DT; st.frame++;
    if (!o.quiet) { if (P.hp < lastHp) R2.hurt += lastHp - P.hp; if (R2.fell < 0 && R2.hurt >= P.maxHp) R2.fell = t; P.hp = P.maxHp; lastHp = P.hp; if (P.dead) break; }
    for (const e of men) { if (e.upAt < 0 && e.awake !== false) e.upAt = t; if (e.metAt < 0 && e.awake !== false && !gone(e)) { if (e.shots) e.metAt = t; else for (const f of friends.concat(o.quiet ? [] : [P])) if (!f.dead && !f.down && Math.hypot(f.x - e.x, f.y - e.y) < 46) { e.metAt = t; break; } } }
    if (st.frame % 30 === 0) all.forEach((e, i) => {
      const q = last[i], moved = Math.hypot(e.x - q.x, e.y - q.y); q.x = e.x; q.y = e.y; if (e.x !== e.x || e.hp !== e.hp) R2.nan = true;
      const choked = e.choked != null && t - e.choked < 0.6; chokeRun.set(e, choked ? (chokeRun.get(e) || 0) + 0.5 : 0); R2.choke = Math.max(R2.choke, chokeRun.get(e));
      const goal = e.tgt || (e.side === 1 ? (e.order === 'hold' ? null : P) : e.heardAt), far = goal && Math.hypot(goal.x - e.x, goal.y - e.y) > (e.bow && !e.close && e.tgt ? Combat.api.men.bow.range : e.side === 1 && !e.tgt ? 120 : 90);   // (a bowman within a shot of his man is where he means to be)
      const shot = e.bow && (e.state === 'aim' || e.state === 'loose' || (e.shots || 0) !== (q.shots || 0)); q.shots = e.shots || 0;
      const idle = moved < 1.5 && far && !choked && !shot && !gone(e) && !e.down && e.awake !== false && !(e.lookT > 0) && e.state !== 'windup' && e.state !== 'lunge' && e.state !== 'recover' && e.state !== 'stagger';
      q.still = idle ? q.still + 0.5 : 0;
      if (process.env.TOWN_DBG && q.still >= 5 && q.still % 5 === 0) { const wp = g.next(e, goal.x, goal.y, t, e.side !== 1); console.log('      dbg t', t.toFixed(1), e.side === 1 ? 'friend' : e.kindOf, 'at', (e.x / T).toFixed(2), (e.y / T).toFixed(2), e.state, 'goal', (goal.x / T).toFixed(2), (goal.y / T).toFixed(2), goal === P ? 'hero' : goal.type || 'noise', 'wp', wp ? (wp.wait ? 'WAIT' : (wp.x / T).toFixed(1) + ',' + (wp.y / T).toFixed(1)) : 'clear', 'nav', e.nav ? e.nav.pts.length + ' pts, i ' + e.nav.i + (e.nav.short ? ' SHORT' : '') : '-', 'cd', (e.cd || 0).toFixed(1), 'order', e.order, 'calledT', e.calledT, 'out', !!goal.out, 'down', !!goal.down, 'back', e.backT, 'tgt', e.tgt ? e.tgt.state : '-');
        const ax = wp && !wp.wait ? wp.x : goal.x, ay = wp && !wp.wait ? wp.y : goal.y, al = Math.hypot(ax - e.x, ay - e.y) || 1, sx = (ax - e.x) / al * 1.5, sy = (ay - e.y) / al * 1.5;
        console.log('          step', sx.toFixed(2), sy.toFixed(2), 'blocked', Combat.api.blocked(e.x, e.y, e.x + sx, e.y + sy, e), 'pillars', D.W.pillars.filter(q2 => Math.hypot(q2.x - e.x, q2.y - e.y) < q2.r + e.r + 3).map(q2 => ((q2.x - e.x)).toFixed(1) + ',' + ((q2.y - e.y)).toFixed(1) + ' r' + q2.r).join(' | '), 'men', all.filter(o2 => o2 !== e && !o2.dead && Math.hypot(o2.x - e.x, o2.y - e.y) < 16).length, 'guard', (e.guard || 0).toFixed(1), 'choked', e.choked != null ? (t - e.choked).toFixed(1) : '-'); }
      if (q.still > R2.stuck) { R2.stuck = q.still; R2.who = (e.side === 1 ? 'a friend' : 'a man of the ' + e.kindOf) + ' at ' + Math.round(e.x / T) + ',' + Math.round(e.y / T) + ' (' + e.state + ', after ' + (e.tgt ? (e.tgt === P ? 'the hero' : 'a man') : e.side === 1 ? 'the hero' : 'the noise') + ' at ' + Math.round(goal.x / T) + ',' + Math.round(goal.y / T) + ')'; }
    });
    if (o.quiet && t > 3) { const up = men.filter(e => e.awake !== false).length; R2.went = Math.max(R2.went, men.filter(e => e.upAt >= 0).length); if (!up && R2.backAt < 0 && R2.went) { R2.backAt = t; break; } }
  }
  if (process.env.TOWN_DBG && t >= limit && !o.quiet) { console.log('      left at the end: hero at', (P.x / T).toFixed(2), (P.y / T).toFixed(2), 'waited', (st.waited || 0).toFixed(0)); men.filter(e => !gone(e)).forEach(e => { const wp = g.next(P, e.x, e.y, t, false); console.log('        ', e.kindOf, 'at', (e.x / T).toFixed(2), (e.y / T).toFixed(2), e.state, 'awake', e.awake, 'tgt', e.tgt ? (e.tgt === P ? 'hero' : 'man') : '-', 'heardAt', !!e.heardAt, 'choked', e.choked != null ? (t - e.choked).toFixed(1) : '-', 'hp', e.hp.toFixed(0), 'hero wp', wp ? (wp.wait ? 'WAIT' : (wp.x / T).toFixed(1) + ',' + (wp.y / T).toFixed(1)) : 'clear', 'wall between', Combat.api.wall(P.x, P.y, e.x, e.y)); }); }
  ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyK', 'Space'].forEach(k => Combat.key(k, false)); Combat.button(0, false);
  Combat.api.nav = Combat.api.blocked = Combat.api.wall = null;
  const ups = men.map(e => e.upAt).filter(v => v >= 0).sort((a, b) => a - b), mets = men.map(e => e.metAt).filter(v => v >= 0).sort((a, b) => a - b), at = s => ups.filter(v => v <= ups[0] + s).length;
  const byKind = k => { const L = men.filter(e => e.kindOf === k && e.upAt >= 0).map(e => e.upAt - ups[0]); return L.length ? Math.min(...L).toFixed(0) + '-' + Math.max(...L).toFixed(0) : '-'; };
  return Object.assign(R2, { t, n20: men.length, out: men.filter(gone).length, dead: men.filter(e => e.dead).length, never: men.length - ups.length, first: ups[0], at5: at(5), at15: at(15), at30: at(30), at60: at(60), lastUp: ups.length ? ups[ups.length - 1] - ups[0] : 0, met0: mets.length ? mets[0] - ups[0] : -1, metLast: mets.length ? mets[mets.length - 1] - ups[0] : -1, met: mets.length, kinds: 'gate ' + byKind('gate') + ', yard ' + byKind('yard') + ', doors ' + byKind('door') + ', in the houses ' + byKind('house') + ', hall ' + byKind('hall'),
    friendsUp: friends.filter(e => !e.dead && !e.down).length, waited: st.waited || 0, timeout: t >= limit && !o.quiet, mean: R2.ms / Math.max(1, R2.n), backGate: back != null, lots: V.lots.filter(l => l.id === 'house').length });
}
function town(n, secs) {
  console.log('--- a town full of men, attacked (rung 5): the hero (kept alive: the line says when he would have fallen) and five friends against twenty, in ' + n + ' towns, at the gate and at the back gate');
  console.log('    aimed at: nobody ever stuck; the town up over a minute or so, not all at once; every man of it reaches the fight or is still asleep for a reason');
  const seeds = process.env.TOWN_SEEDS ? process.env.TOWN_SEEDS.split(',').map(Number) : []; if (!seeds.length) for (let i = 0; i < n; i++) seeds.push(101 + i * 37);
  let worst = 0, mean = 0, runs = 0;
  seeds.forEach(seed => ['gate', 'back'].forEach(from => {
    const r = townFight(seed, { from, secs }); if (from === 'back' && !r.backGate) return; runs++; worst = Math.max(worst, r.worst); mean += r.mean;
    const bad = r.stuck >= 5 || r.nan || r.timeout;
    console.log((bad ? '!! ' : '   ') + ('town ' + seed + ' (' + r.lots + ' houses), in at the ' + (from === 'back' ? 'back gate' : 'gate')).padEnd(46) + 'up: ' + r.at5 + ' in 5 s, ' + r.at15 + ' in 15, ' + r.at30 + ' in 30, ' + r.at60 + ' in 60' + (r.never ? ', ' + r.never + ' never' : '') + ' (' + r.kinds + '); the first met them after ' + r.met0.toFixed(0) + ' s, the last after ' + r.metLast.toFixed(0) + ' (' + r.met + ' did); '
      + (r.timeout ? 'NOT OVER at ' + r.t.toFixed(0) + ' s with ' + (r.n20 - r.out) + ' left' : 'over in ' + r.t.toFixed(0) + ' s') + ', ' + r.dead + ' dead, ' + (r.out - r.dead) + ' gave up or ran; friends standing ' + r.friendsUp + '/5; the hero would have fallen at ' + (r.fell < 0 ? 'no time' : r.fell.toFixed(0) + ' s') + '; longest wait at a gate or door ' + r.choke.toFixed(0) + ' s'
      + (r.stuck >= 5 ? '; STOOD STILL ' + r.stuck.toFixed(0) + ' s: ' + r.who : '') + (r.nan ? ' NaN' : ''));
  }));
  console.log('    an update: ' + (mean / Math.max(1, runs)).toFixed(2) + ' ms on average, ' + worst.toFixed(1) + ' at worst (the logic alone: nothing is drawn here)');
  { let h = { t: 0, out: 0, n: 0 }, f = { t: 0, out: 0, n: 0 };     // five of yours before the gate (the town must come out through it), the hero behind them doing nothing: told to hold a line there, or left to fight as they like
    seeds.slice(0, Math.max(2, Math.round(n / 2))).forEach(seed => { for (let k = 0; k < 2; k++) { const a = townFight(seed, { gate: 'hold', secs: 240 }), b = townFight(seed, { gate: 'free', secs: 240 }); h.t += a.heldFor || a.t; h.out += a.out; h.n++; f.t += b.heldFor || b.t; f.out += b.out; f.n++; } });
    console.log('    five of yours two tiles outside the gate against the town, the hero standing behind them: told to hold a line there they stood ' + (h.t / h.n).toFixed(0) + ' s and put ' + (h.out / h.n).toFixed(1) + ' of the twenty out of the fight; left to fight as they like, ' + (f.t / f.n).toFixed(0) + ' s and ' + (f.out / f.n).toFixed(1)); }
  seeds.slice(0, Math.max(2, Math.round(n / 3))).forEach(seed => { const r = townFight(seed, { quiet: true, secs: 120 }); console.log((r.backAt < 0 || r.stuck >= 5 ? '!! ' : '   ') + ('town ' + seed + ', a noise at the gate and nobody there').padEnd(46) + r.went + ' of ' + r.n20 + ' went to look; ' + (r.backAt < 0 ? 'NOT all back at their posts after ' + r.t.toFixed(0) + ' s' : 'all back at their posts and at their day after ' + r.backAt.toFixed(0) + ' s') + (r.stuck >= 5 ? '; STOOD STILL ' + r.stuck.toFixed(0) + ' s: ' + r.who : '')); });
}
// ---- Bowmen (rung 5): what a man with a bow does, by himself and in a fight. Each line says what was seen; !! is a fault. ----
function bows(n) {
  console.log('--- bowmen (rung 5). ' + n + ' fights a line. Aimed at: a bowman behind a line that holds is worth nearly a swordsman, in the place of a swordsman much less, and alone against a man who reaches him he is lost; no arrow is loosed with one of his own in its way, or through a wall');
  line('a friend with a bow alone against a man with a sword and a shield', run({ foes: [['sword', 'leather']], friends: [['bow', 'leather']] }, n));
  line('a friend with a bow alone against a man with a great axe (no shield)', run({ foes: [['greataxe', 'leather']], friends: [['bow', 'leather']] }, n));
  const mixed = b => [0, 1, 2, 3, 4].map(i => [i >= 5 - b ? 'bow' : 'sword', 'leather']);
  line('five against five, one bowman a side', run({ foes: mixed(1), friends: mixed(1) }, n));
  const sw = k => Array.from({ length: k }, () => ['sword', 'leather']), bw = k => Array.from({ length: k }, () => ['bow', 'leather']);   // what a bowman adds: the same fight with one more swordsman, with a bowman behind, with a bowman in a swordsman's place
  line('five swords and a sixth against five swords', run({ foes: sw(5), friends: sw(6) }, n));
  line('five swords and a bowman behind them against five swords', run({ foes: sw(5), friends: sw(5).concat(bw(1)) }, n));
  line('four swords and a bowman against five swords', run({ foes: sw(5), friends: sw(4).concat(bw(1)) }, n));
  line('five bowmen against five swords', run({ foes: sw(5), friends: bw(5) }, n));
  HEROES.forEach(([bot]) => line(bot + ', iron sword, against one bowman', run({ hero: { bot, weapon: ['sword', 'iron'], armour: LEATHER }, foes: [['bow', 'leather']] }, n)));
  HEROES.slice(1).forEach(([bot]) => line(bot + ', iron sword, against a man with an axe and a bowman behind him', run({ hero: { bot, weapon: ['sword', 'iron'], armour: LEATHER }, foes: [['axe', 'leather'], ['bow', 'leather']] }, n)));
  const say = (ok, text) => console.log((ok ? '   ' : '!! ') + text);
  const fresh = () => { Combat.reset(); const D = Combat.dbg(), P = D.P; P.x = 200; P.y = 250; P.mode = 'fight'; P.weapon = 'melee'; P.hidden = true; P.x = -4000; D.W.pillars = []; Combat.api.items = null; Combat.api.scene = { begin() {}, items() {}, bounds: { x0: -5000, y0: -5000, x1: 5000, y1: 5000 } }; return D; };
  // 1. never into his own: a friend duelling a strong man, the bowman straight behind his friend. Every arrow is looked at as it is loosed
  let fouled = 0, shots = 0, hits = 0, friendHurtByArrow = 0;
  for (let k = 0; k < Math.max(4, n / 4); k++) {
    const D = fresh(), f = man(1, 'sword', 'leather', 300, 250, { hp: 400 }), foe = man(0, 'sword', 'leather', 340, 250, { hp: 400 }), b = man(1, 'bow', 'cloth', 160, 250, { aim: 4 }); f.sight = b.sight = foe.sight = 3000; f.leash = b.leash = 1e9;
    const seen = new Set();
    for (let i = 0; i < 40 * FPS; i++) { Combat.update(DT); for (const pr of D.W.projs) if (pr.owner === 'man' && !seen.has(pr)) { seen.add(pr); shots++; const dx = pr.vx, dy = pr.vy, L = Math.hypot(dx, dy), ax = f.x - pr.x, ay = f.y - pr.y, along = (ax * dx + ay * dy) / L, off = Math.abs(ax * dy - ay * dx) / L, toFoe = Math.hypot(foe.x - pr.x, foe.y - pr.y); if (along > 0 && along < toFoe && off < f.r + 4) fouled++; } }
    hits += Math.round((400 - foe.hp) * 10) / 10 > 0 ? 1 : 0;
  }
  say(shots > 0 && fouled === 0, 'a bowman behind his own man who is in a fight: ' + shots + ' arrows loosed (he walks round until he has a line), ' + fouled + ' of them with his friend in the way');
  // 2. not through a wall: a wall between the bowman and his man, a gap at its end
  {
    const D = fresh(), T = 32, B = { H: {}, V: {} }; for (let y = 2; y < 14; y++) B.V['10,' + y] = { t: 'wall' };
    const g = Nav.make({ x0: 0, y0: 0, w: 20, h: 20, T, open: () => true, edge: Nav.edgeOf(B) }); let t = 0; Nav.attach(Combat, (x, y) => g.inside(x, y) ? g : null, () => t);
    const b = man(1, 'bow', 'cloth', 7 * T, 6 * T, { aim: 6 }), foe = man(0, 'sword', 'leather', 13 * T, 6 * T, { hp: 400 }); foe.hold = true; b.sight = 3000; b.leash = 1e9; let through = 0, shots2 = 0, firstAt = -1; const seen = new Set();
    for (let i = 0; i < 30 * FPS; i++) { Combat.update(DT); t += DT; for (const pr of D.W.projs) if (pr.owner === 'man' && !seen.has(pr)) { seen.add(pr); shots2++; if (firstAt < 0) firstAt = t; if (g.blocked(b.x, b.y, foe.x, foe.y, false)) through++; } }
    Combat.api.nav = Combat.api.blocked = Combat.api.wall = null;
    say(shots2 > 0 && through === 0, 'a wall between a bowman and a man who stands still: he walked round its end and loosed his first arrow after ' + (firstAt < 0 ? 'NEVER' : firstAt.toFixed(0) + ' s') + '; ' + through + ' of ' + shots2 + ' arrows loosed with the wall between them');
  }
  // 3. someone on him: he gives ground and does not shoot
  {
    const D = fresh(), b = man(1, 'bow', 'cloth', 200, 250, { aim: 4 }), foe = man(0, 'sword', 'leather', 250, 250, { hp: 400 }); b.sight = foe.sight = 3000; b.leash = 1e9; let close = 0, shotsClose = 0; const seen = new Set();
    for (let i = 0; i < 12 * FPS; i++) { Combat.update(DT); const d = Math.hypot(b.x - foe.x, b.y - foe.y); if (d < 60) close++; for (const pr of D.W.projs) if (pr.owner === 'man' && !seen.has(pr)) { seen.add(pr); if (d < 60) shotsClose++; } }
    say(shotsClose === 0 && (b.close || b.down), 'a man with a sword on a bowman for 12 s: the bowman ' + (b.close || b.down ? 'took his seax' : 'KEPT his bow') + ', loosed ' + shotsClose + ' arrows with the man on him' + (b.down ? ', and went down' : ', and has ' + b.hp.toFixed(0) + ' of ' + b.maxHp + ' health left'));
  }
}
// ---- The raid's own rules in the engine (rung 6): the blow from behind on a man who has noticed nothing, and the errand (a man
// sent somewhere with something to do there). The raid itself is the page's (loot, the ship): tools/visual/raidplay.js plays it. ----
function raidChecks() {
  console.log('--- the raid (rung 6): what the engine does for it');
  const say = (ok, text) => console.log((ok ? '   ' : '!! ') + text);
  const fresh = () => { Combat.reset(); const D = Combat.dbg(), P = D.P; P.x = 200; P.y = 250; P.mode = 'fight'; P.weapon = 'melee'; D.W.pillars = []; hero(['sword', 'iron'], LEATHER); Combat.api.scene = { begin() {}, items() {}, bounds: { x0: -5000, y0: -5000, x1: 5000, y1: 5000 } }; return D; };
  const run = (secs, each) => { for (let i = 0, n = Math.round(secs * FPS); i < n; i++) { if (each && each(i * DT) === false) break; Combat.update(DT); } };
  const off = () => { ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyK', 'Space'].forEach(k => Combat.key(k, false)); Combat.button(0, false); };
  const post = (x, y, face, o) => { const m = Combat.soldier(Object.assign({ side: 0, wpn: { kind: 'sword', mat: 'iron' }, shield: true, armor: 0.4, x, y, post: { x, y, face }, aggro: 0.5, hp: 34, strength: 4, wits: 4, nerve: 1 }, o || {})); m.face = face; return m; };
  // 1. from behind, a man at his post who has noticed nothing: one blow; a man 140 units off hears nothing. With a fellow 50 units off it is
  // another matter: he is within earshot of even a quiet blow, wakes, sees you and shouts, and that is heard
  const behind = withNear => {
    const D = fresh(), P = D.P, a = post(240, 250, 0), far = post(240 + 140, 250, 0), near = withNear ? post(240, 250 + 50, 0) : null; P.x = 216; P.y = 250; P.face = 0; D.W.lock = a;
    let blows = 0, was = false; run(2, t => { const down = Math.floor(t * 60) % 20 < 3; if (down && !was) blows++; was = down; Combat.button(0, down); if (a.dead) return false; }); off(); run(3);
    return { dead: a.dead, blows, far: far.awake !== false, near: near ? near.awake !== false : null };
  };
  let b1 = behind(false), b2 = behind(true);
  say(b1.dead && b1.blows === 1 && !b1.far, 'a man at his post struck from behind: ' + (b1.dead ? 'down after ' + b1.blows + ' blow' + (b1.blows === 1 ? '' : 's') : 'NOT down') + '; a man 140 units off ' + (b1.far ? 'WOKE' : 'noticed nothing') + ' (a quiet blow is heard ' + Combat.api.men.quiet + ' units)');
  say(b2.dead && b2.near, 'the same with his fellow 50 units off: the fellow ' + (b2.near ? 'woke' : 'NOTICED NOTHING') + (b2.far ? ', saw you and shouted, and the man 140 off heard that' : ', and the man 140 off still noticed nothing'));
  let D, P, a, far, blows, was;
  // 2. from the front the same man is a fight, and it is heard
  D = fresh(); P = D.P; a = post(240, 250, Math.PI); far = post(240 + 140, 250, 0); P.x = 216; P.y = 250; P.face = 0; D.W.lock = a; blows = 0; was = false;
  run(2, t => { const down = Math.floor(t * 60) % 20 < 3; if (down && !was) blows++; was = down; Combat.button(0, down); }); off(); run(2);
  say(!a.dead && far.awake !== false, 'the same man struck from the front: ' + (a.dead ? 'DOWN at once' : 'still up after ' + blows + ' blows, with ' + a.hp.toFixed(0) + ' of ' + a.maxHp + ' health') + '; the man 140 units off ' + (far.awake === false ? 'NOTICED NOTHING' : 'heard it'));
  // 3. an errand: he goes there by himself past a foe he does not fight, and does what he was sent to do
  D = fresh(); P = D.P; P.hidden = true; P.x = -4000; let f = man(1, 'sword', 'leather', 200, 250), foe = man(0, 'sword', 'leather', 330, 330, { hp: 400 }); foe.hold = true; f.sight = 3000; f.leash = 1e9; let done = -1, t3 = 0;
  f.errand = { x: 460, y: 250, near: 14, run: true, done: () => { done = t3; } }; run(12, t => { t3 = t; if (done >= 0) return false; });
  say(done > 0 && !f.tgt, 'a man sent 260 units past a foe who stands by: ' + (done > 0 ? 'there after ' + done.toFixed(1) + ' s' : 'NEVER there') + ', and he ' + (f.hp === f.maxHp ? 'fought nobody on the way' : 'was hurt'));
  // 4. struck on an errand he drops it (what he carries falls where he is) and fights
  D = fresh(); P = D.P; P.hidden = true; P.x = -4000; f = man(1, 'sword', 'leather', 200, 250, { hp: 300 }); foe = man(0, 'sword', 'leather', 440, 250, { hp: 400 }); const foe2 = man(0, 'axe', 'leather', 470, 290, { hp: 400 }); f.sight = foe.sight = foe2.sight = 3000; f.leash = 1e9; let dropped = -1, arrived = false; t3 = 0;   // (two men in his way: one alone often cannot catch a man who keeps walking)
  f.errand = { x: 1400, y: 250, near: 14, run: true, slow: 0.62, done: () => { arrived = true; }, drop: () => { dropped = t3; } }; run(24, t => { t3 = t; if (dropped >= 0 && f.tgt) return false; });
  say(dropped > 0 && !arrived && !!f.tgt, 'a carrier who walks into two men: ' + (dropped > 0 ? 'he dropped what he carried at the first blow, after ' + dropped.toFixed(1) + ' s' : arrived ? 'he walked through them and was NEVER struck' : 'NEVER dropped it') + (f.tgt ? ' and turned on them' : ' and did NOT turn on them'));
  // 4b. making off: a man who turns his back and walks is run down and struck on the run; one who sprints gets away; a carrier is caught
  const walkOff = shift => { const D2 = fresh(), P2 = D2.P; const m = man(0, 'sword', 'leather', 130, 250, { hp: 400 }); m.sight = 3000; let first = -1, hp0 = P2.hp; run(12, t => { Combat.key('KeyD', true); Combat.key('ShiftLeft', !!shift); if (first < 0 && P2.hp < hp0) first = t; }); off(); Combat.key('ShiftLeft', false); return { first, lost: hp0 - P2.hp, gap: Math.hypot(m.x - P2.x, m.y - P2.y) }; };
  const w1 = walkOff(false), w2 = walkOff(true);
  say(w1.first > 0, 'the hero walks away from a man 70 units behind him, his back turned, for 12 s: ' + (w1.first > 0 ? 'struck first after ' + w1.first.toFixed(1) + ' s, ' + w1.lost.toFixed(0) + ' health lost' : 'NEVER struck (the man ' + Math.round(w1.gap) + ' units behind at the end)'));
  say(w2.lost < w1.lost || w2.first < 0, 'the same at a sprint: ' + (w2.first > 0 ? 'struck after ' + w2.first.toFixed(1) + ' s, ' + w2.lost.toFixed(0) + ' health lost' : 'never struck') + '; the man ' + Math.round(w2.gap) + ' units behind at the end');
  D = fresh(); P = D.P; P.hidden = true; P.x = -4000; { const c = man(1, 'sword', 'leather', 260, 250, { hp: 300 }), m = man(0, 'sword', 'leather', 200, 250, { hp: 400 }); c.sight = m.sight = 3000; c.leash = 1e9; let dr = -1, tt = 0, there = false; c.errand = { x: 1400, y: 250, near: 14, run: true, slow: 0.62, done: () => { there = true; }, drop: () => { dr = tt; } }; run(20, t => { tt = t; if (dr >= 0 || there) return false; });
    say(dr > 0, 'a carrier with one man 60 units behind him: ' + (dr > 0 ? 'caught and struck after ' + dr.toFixed(1) + ' s' : 'NEVER caught' + (there ? ' (he got where he was going)' : ''))); }
  // 4c. a town's man does not leave his town to run a raider down: nobody further from his post than MEN.pursue
  D = fresh(); P = D.P; P.x = 1000 + Combat.api.men.pursue + 60; P.y = 250; { const m = post(1000, 250, 0); m.awake = true; m.x = 1000 + Combat.api.men.pursue - 100; m.y = 250; let went = 0; run(6, () => { went = Math.max(went, m.x - 1000); }); const back = Math.hypot(m.x - 1000, m.y - 250);
    run(20); say(went < Combat.api.men.pursue + 30 && !m.tgt, 'a man of a town ' + (Combat.api.men.pursue - 100) + ' units from his post, the hero 160 further on (beyond the ' + Combat.api.men.pursue + ' he pursues): he ' + (m.tgt ? 'WENT FOR HIM' : 'let him go') + ', and 26 s later is ' + Math.round(Math.hypot(m.x - 1000, m.y - 250)) + ' units from his post'); }
  // 5. taken out of the world in the middle of a pass (laid aboard a ship): nothing breaks
  D = fresh(); P = D.P; f = man(1, 'sword', 'leather', 220, 250); const g2 = man(1, 'sword', 'leather', 240, 270); f.errand = { x: 222, y: 250, near: 14, done: () => { g2.away = true; f.away = true; } }; let threw = null; try { run(2); } catch (e) { threw = e.message; }
  say(!threw && D.W.enemies.indexOf(f) < 0 && D.W.enemies.indexOf(g2) < 0, 'two men taken out of the world from inside the engine\'s own pass: ' + (threw ? 'IT THREW: ' + threw : 'gone from its list, and nothing broke'));
}
const t0 = Date.now();
if (mode === 'one' || mode === 'short') one(N);
if (mode === 'two' || mode === 'short') two(N);
if (mode === 'friend' || mode === 'short') friend(N);
if (mode === 'duels') duels(N);
if (mode === 'five' || mode === 'short') five(mode === 'short' ? 6 : N);
if (mode === 'bows' || mode === 'short') bows(mode === 'short' ? 8 : N);
if (mode === 'raid' || mode === 'short') raidChecks();
if (mode === 'town' || mode === 'short') town(mode === 'short' ? 2 : (+process.argv[3] || 12), +process.argv[4] || 300);
console.log('(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
