// Fights between men, with no screen (docs/battle-plan.md: every rung of the ladder is tried here before it is played).
//   node tests/battle.js            the short run that npm test makes: a few fights of every rung, and what must not happen
//   node tests/battle.js one [n]    rung 1: the hero, played by three bots, against one hirdman; n fights a line (200)
//   node tests/battle.js two [n]    rung 2: against two
//   node tests/battle.js friend [n] rung 3: two against the hero and one friend; and a friend alone against his equal
//   node tests/battle.js five [n]   rung 4: five against five with no hero, then with him
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
const FPS = 60, DT = 1 / FPS, LIMIT = 120;
const LEATHER = ['helmet', 'tunic', 'trousers', 'boots', 'cloak'].reduce((s, k) => s + Items.stats(Items.make(k, 'leather')).armor, 0);
const GEAR = { cloth: { armor: 0, shield: false }, leather: { armor: 0.2, shield: true }, mail: { armor: 0.4, shield: true } };
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
function person(o) { return Object.assign({ hp: 30, strength: 4, wits: 4, nerve: 1 }, o || {}); }      // an even man who does not yield (so a fight is fought out) unless the test says otherwise
function rolled() { const p = Hird.roll(Math.random); return { hp: p.stats.health, strength: p.stats.strength, wits: p.stats.wits, loyal: p.traits.indexOf('loyal') >= 0, nerve: 0.5 }; }
function man(side, wpn, gear, x, y, o) { const g = GEAR[gear || 'leather']; return Combat.soldier(Object.assign({ side, wpn: { kind: wpn, mat: 'iron' }, shield: g.shield, armor: g.armor, x, y }, person(o))); }
function keys(ang, go) { Combat.key('KeyD', go && Math.cos(ang) > 0.38); Combat.key('KeyA', go && Math.cos(ang) < -0.38); Combat.key('KeyS', go && Math.sin(ang) > 0.38); Combat.key('KeyW', go && Math.sin(ang) < -0.38); }
function threatOf(D) {                          // the blow that will reach the hero soonest, and in how long
  const P = D.P; let best = null;
  for (const e of D.W.enemies) { if (e.dead || e.side === 1 || e.type !== 'soldier' || !e.sw || e.tgt !== P) continue; if (e.state !== 'windup' && !(e.state === 'lunge' && !e.hitDone)) continue;
    const d = Math.hypot(e.x - P.x, e.y - P.y); if (d > e.sw.reach + 34) continue; const hit = e.sw.ac * Combat.api.men.hitAt, tti = e.state === 'windup' ? e.dur - e.t + hit : hit - e.t;
    if (!best || tti < best.tti) best = { e, tti, d, heavy: e.sw.heavy }; }
  return best;
}
// A bot is a person: it sees a blow a moment after it begins (its reaction), its timing wanders (jitter), and now and then it
// does not see the blow at all (missed). what() says how this blow is met.
const HUMAN = { careful: { react: 0.2, miss: 0.12, jitter: 0 }, skilled: { react: 0.12, miss: 0.06, jitter: 0.18 } };
function meets(st, th, who) {
  const H = HUMAN[who]; if (st.thr !== th.e || st.thrN !== th.e.swingN) { st.thr = th.e; st.thrN = th.e.swingN; st.seen = 0; st.blind = Math.random() < H.miss; st.jit = (Math.random() - 0.5) * H.jitter; }
  st.seen += DT; return !st.blind && st.seen >= H.react;
}
const BOTS = {
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
  const foes = S.foes.map((f, i) => man(0, f[0], f[1], 330 + (i % 2) * 26, 250 + (i - (S.foes.length - 1) / 2) * 34, f[2])), friends = (S.friends || []).map((f, i) => { const m = man(1, f[0], f[1], 170 - (i % 2) * 26, 250 + (i - ((S.friends.length - 1) / 2)) * 34 + (S.hero ? 30 : 0), f[2]); m.leash = 1e9; return m; });
  let t = 0, hp0 = P.hp, worstChain = 0, chain = 0, lastHp = P.hp, lastHurtT = -9, stuck = 0, stuckMax = 0, nan = false; const pos = foes.concat(friends).map(e => [e.x, e.y]);
  const alive = L => L.filter(e => !e.dead && !e.down && !e.fled && !e.out);
  while (t < LIMIT) {
    const F = alive(foes), A = alive(friends);
    if (!F.length) break; if (S.hero ? P.dead : !A.length) break;
    if (S.hero && !P.dead) { F.sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)); BOTS[S.hero.bot](D, st, F); }
    Combat.update(DT); t += DT; st.frame++;
    if (P.hp < lastHp - 0.01) { chain = t - lastHurtT < 1.0 ? chain + 1 : 1; worstChain = Math.max(worstChain, chain); lastHurtT = t; } lastHp = P.hp;
    if (st.frame % 60 === 0) { let moved = false; foes.concat(friends).forEach((e, i) => { if (Math.hypot(e.x - pos[i][0], e.y - pos[i][1]) > 2 || e.dead || e.down || e.out) moved = true; pos[i] = [e.x, e.y]; if (e.x !== e.x || e.hp !== e.hp) nan = true; }); const busy = foes.concat(friends).some(e => e.state === 'windup' || e.state === 'lunge' || e.state === 'recover' || e.state === 'stagger'); stuck = moved || busy || (S.hero && Math.hypot(P.vx, P.vy) > 5) ? 0 : stuck + 1; stuckMax = Math.max(stuckMax, stuck); }
  }
  ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyK', 'Space'].forEach(k => Combat.key(k, false)); Combat.button(0, false);
  const F2 = alive(foes), A2 = alive(friends), won = !F2.length && (S.hero ? !P.dead : true);
  return { won, lost: S.hero ? P.dead : (!A2.length && F2.length > 0), time: t, left: P.hp, lostHp: hp0 - P.hp, timeout: t >= LIMIT, worstChain, stuck: stuckMax, nan, yielded: foes.filter(e => e.out && !e.dead).length, friendsUp: A2.length, friendsDown: friends.filter(e => e.down || e.dead).length };
}
function run(S, n) {
  const R = { won: 0, lost: 0, timeout: 0, time: 0, left: 0, chain: 0, stuck: 0, nan: 0, longest: 0, yielded: 0, friendsDown: 0 };
  for (let i = 0; i < n; i++) { const r = fight(typeof S === 'function' ? S() : S); if (r.won) { R.won++; R.time += r.time; R.left += r.left; } if (r.lost) R.lost++; if (r.timeout) R.timeout++; R.chain = Math.max(R.chain, r.worstChain); R.stuck = Math.max(R.stuck, r.stuck); if (r.nan) R.nan++; R.longest = Math.max(R.longest, r.time); R.yielded += r.yielded; R.friendsDown += r.friendsDown; }
  R.n = n; R.pct = Math.round(R.won / n * 100); R.secs = R.won ? (R.time / R.won).toFixed(0) : '-'; R.hp = R.won ? Math.round(R.left / R.won) : '-'; return R;
}
const pad = (s, n) => String(s).padEnd(n), lpad = (s, n) => String(s).padStart(n);
function line(label, R, extra) {
  const bad = R.timeout || R.nan || R.stuck >= 6;
  console.log((bad ? '!! ' : '   ') + pad(label, 58), 'won', lpad(R.pct, 3) + '%', ' in', lpad(R.secs, 3) + 's', ' left', lpad(R.hp, 3), ' longest', lpad(R.longest.toFixed(0), 3) + 's', R.timeout ? ' NEVER ENDED x' + R.timeout : '', R.stuck >= 6 ? ' STOOD STILL ' + R.stuck + 's' : '', R.nan ? ' NaN' : '', extra || '');
}
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
  console.log('--- two (rung 2). ' + n + ' fights a line. Aimed at: clearly worse than one; the careful bot can win; never more than three blows on the hero inside a second');
  [[['axe', 'leather'], ['axe', 'leather']], [['axe', 'leather'], ['spear', 'leather']], [['sword', 'mail'], ['sword', 'mail']]].forEach(pair => HEROES.forEach(([bot]) => { const R = run({ hero: { bot, weapon: ['sword', 'iron'], armour: LEATHER }, foes: pair }, n); line(bot + ', iron sword, against ' + pair.map(p => p[0] + ' in ' + p[1]).join(' and '), R, ' most blows in a second ' + R.chain); }));
}
function friend(n) {
  console.log('--- a friend (rung 3). ' + n + ' fights a line. Aimed at: a friend alone against his equal wins about half; with a friend the same fight is easier and not won for you');
  ['sword', 'axe', 'spear', 'club', 'seax', 'greataxe'].forEach(w => line('a friend with a ' + w + ' alone against a man with a sword', run({ foes: [['sword', 'leather']], friends: [[w, 'leather']] }, n)));
  line('rolled men, one against one', run(() => ({ foes: [['sword', 'leather', rolled()]], friends: [['sword', 'leather', rolled()]] }), n));
  HEROES.forEach(([bot]) => { const a = run({ hero: { bot, weapon: ['sword', 'iron'], armour: LEATHER }, foes: [['axe', 'leather'], ['axe', 'leather']] }, n), b = run({ hero: { bot, weapon: ['sword', 'iron'], armour: LEATHER }, foes: [['axe', 'leather'], ['axe', 'leather']], friends: [['sword', 'leather']] }, n); line(bot + ' against two, alone', a); line(bot + ' against two, with a friend', b, ' the friend went down in ' + b.friendsDown + ' of ' + n); });
}
function five(n) {
  console.log('--- five against five (rung 4). ' + n + ' fights a line. Aimed at: equal sides an even coin; one to two minutes; nobody stuck');
  const side = (w, g) => [0, 1, 2, 3, 4].map(() => [w, g]);
  line('equal sides (swords, leather), no hero: your side', run({ foes: side('sword', 'leather'), friends: side('sword', 'leather') }, n));
  line('rolled men on both sides, mixed weapons', run(() => { const W = ['sword', 'axe', 'spear', 'club', 'seax']; return { foes: W.map(w => [w, 'leather', rolled()]), friends: W.map(w => [w, 'leather', rolled()]) }; }, n));
  line('your side in mail', run({ foes: side('sword', 'leather'), friends: side('sword', 'mail') }, n));
  line('your side with spears', run({ foes: side('sword', 'leather'), friends: side('spear', 'leather') }, n));
  HEROES.forEach(([bot]) => line('with the hero (' + bot + ', iron sword) and four friends against five', run({ hero: { bot, weapon: ['sword', 'iron'], armour: LEATHER }, foes: side('sword', 'leather'), friends: side('sword', 'leather').slice(0, 4) }, Math.max(4, Math.round(n / 2)))));
}
const t0 = Date.now();
if (mode === 'one' || mode === 'short') one(N);
if (mode === 'two' || mode === 'short') two(N);
if (mode === 'friend' || mode === 'short') friend(N);
if (mode === 'five' || mode === 'short') five(mode === 'short' ? 6 : N);
console.log('(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
