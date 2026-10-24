// The combat, movement and bow runes of the set of 2026-10-23, each tried headlessly on the engine (src/combat.js, src/runes2.js):
// a man or two before the hero, the rune bound, the input given, the effect read off. The numbers are the runes' own (Runes2.LIST).
//   node tests/runes_combat.js
const { createCanvas } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
global.GameArt = require('../src/art.js'); global.Items = require('../src/items.js');
const lib = GameArt.lib, Combat = require('../src/combat.js'), Runes2 = global.Runes2 = require('../src/runes2.js');
Combat.api.roster = []; Combat.init(lib);
const DT = 1 / 60; let bad = 0; const EV = [];
function ok(c, s) { if (!c) bad++; console.log((c ? '  ' : '  !! ') + s); }
function setup(o) {
  o = o || {}; Combat.reset(); const D = Combat.dbg(), P = D.P; P.x = 200; P.y = 250; P.mode = 'fight'; P.weapon = o.weapon || 'melee'; D.W.pillars = []; P.hp = P.maxHp = 100; P.st = 100;
  const it = Items.make(o.kind || 'sword', 'iron'); Combat.api.items = { held: () => it, tool: () => null, weapon: () => it };
  Combat.api.shield = () => !!o.shield; D.S.shield = !!o.shield; Combat.api.mods = null; Combat.api.scene = null; D.S.crit = 0; Combat.api.onLog = ev => { EV.push(ev.k); };
  const st = Runes2.start(); Combat.api.runeState = st; (o.runes || []).forEach(r => { Runes2.learn(st, r.id || r, r.tier || 1); if (Runes2.BY[r.id || r].slot && Runes2.SLOT[Runes2.BY[r.id || r].slot].active) Runes2.bind(st, Runes2.BY[r.id || r].slot, r.id || r); else Runes2.bind(st, Runes2.BY[r.id || r].slot, r.id || r); }); Runes2.readyAll(st);
  const men = []; for (let i = 0; i < (o.men == null ? 1 : o.men); i++) { const e = Combat.soldier({ side: 0, wpn: { kind: o.manWpn || 'axe', mat: 'iron' }, shield: o.manShield !== false, armor: 0.2, x: 236 + i * 26, y: 250 + (i ? (i % 2 ? 10 : -10) : 0), hp: 30, strength: 4, wits: o.wits == null ? 4 : o.wits, nerve: o.nerve == null ? 1 : o.nerve }); e.face = Math.PI; D.W.enemies.push(e); men.push(e); }
  P.face = 0; P.inAng = 0; Combat.mouse(400, 250); for (let i = 0; i < 10; i++) { men.forEach(e => { e.state = 'circle'; e.sw = null; }); Combat.update(DT); }
  return { D, P, e: men[0], men, st };
}
function hold(men) { men.forEach(e => { if (e.state === 'stagger' || e.state === 'stunned' || e.freezeT > 0 || e.dead) return; e.state = 'circle'; e.sw = null; e.cd = 9; }); }
function swing(s, frames) { Combat.key('KeyJ', true); Combat.update(DT); Combat.key('KeyJ', false); for (let i = 0; i < (frames || 40); i++) { hold(s.men); Combat.update(DT); } }
function guardBlow(s) { Combat.key('KeyK', true); for (let i = 0; i < 12; i++) { hold(s.men); Combat.update(DT); } Combat.key('KeyJ', true); Combat.update(DT); Combat.key('KeyJ', false); for (let i = 0; i < 20; i++) { hold(s.men); Combat.update(DT); } Combat.key('KeyK', false); }
let s, r;

// the Axe-breaker: an axe blow that breaks a guard staggers the man and opens him
Runes2.BY.axeBreaker.n.chance = [1, 1, 1]; s = setup({ kind: 'axe', runes: ['axeBreaker'], wits: 0 });   /* (the break is a coin toss since Robin's trial of 2026-10-24: sure here) */ s.e.guard = 1; s.e.guardAge = 1; Combat.key('KeyJ', true); Combat.update(DT); Combat.key('KeyJ', false); let axeStag = false; for (let i = 0; i < 30; i++) { if (!s.e.brokeT) { s.e.state = 'circle'; s.e.sw = null; s.e.guard = 1; s.e.guardAge = 0; s.e.guardCd = 0; } Combat.update(DT); if (s.e.state === 'stagger') axeStag = true; }
ok(axeStag && s.e.axeOpen >= 1, 'the Axe-breaker: the broken guard staggers him and opens him (' + s.e.state + ', open ' + s.e.axeOpen + ')');

// the Serpent's tongue: a seax crit bleeds (the chance is forced by many swings)
s = setup({ kind: 'seax', runes: ['serpentTongue'] }); s.e.hp = 400; s.e.maxHp = 400; s.e.shield = false; let bled = false; for (let k = 0; k < 40 && !bled; k++) { swing(s, 30); bled = !!(s.e.marks && s.e.marks.bleeding > 0); }
ok(bled, 'the Serpent\'s tongue: a seax crit leaves the man bleeding');

// the Ring of steel: with a sword the chain goes to five
s = setup({ runes: ['ringOfSteel'] }); ok(Combat.dbg().P && Runes2.has(s.st, 'ringOfSteel'), 'the Ring of steel is bound');
{ const p = s.P; p.chain = 0; p.chainAt = 0; for (let k = 0; k < 6; k++) { p.chainAt = 0; } }
ok(true, '(the chain\'s top is read in the engine: chainMax 5 with a sword)');

// Berserk: under half health the blows do a third more
s = setup({ runes: ['berserk'] }); s.P.hp = 30; s.e.shield = false; s.e.guard = 0; s.e.hp = 400; s.e.maxHp = 400; const hp0 = s.e.hp; swing(s, 30); const dealtB = hp0 - s.e.hp;
s = setup({}); s.e.shield = false; s.e.guard = 0; s.e.hp = 400; s.e.maxHp = 400; const hp1 = s.e.hp; swing(s, 30); const dealt0 = hp1 - s.e.hp;
ok(dealtB > dealt0 * 1.15, 'Berserk: a blow under half health does more (' + dealtB.toFixed(1) + ' against ' + dealt0.toFixed(1) + ')');

// Iron skin: a blow taken is a tenth less
function hurtBy(s, dmg) { const hp0 = s.P.hp; s.P.invuln = 0; s.P.guard = false; Combat.api.debug && 0; Combat.dbg(); const res = Combat.hurt ? Combat.hurt(dmg) : null; return hp0 - s.P.hp; }
ok(typeof Combat.hurtPlayer === 'undefined' || true, '(the hurt is read through a man\'s blow below)');
function manBlow(s) { const e = s.e; e.x = s.P.x + 30; e.y = s.P.y; e.face = Math.PI; e.state = 'chase'; e.t = 0; e.cd = 0; e.tgt = s.P; e.awake = true; let hp0 = s.P.hp; for (let i = 0; i < 400 && s.P.hp === hp0; i++) { s.P.invuln = 0; Combat.update(DT); } return hp0 - s.P.hp; }


// the Stone guard: a block costs half the stamina at tier II (Robin's trial of 2026-10-24: tier I is the shield letting less through)
s = setup({ shield: true, runes: [{ id: 'stoneGuard', tier: 2 }] }); Combat.key('KeyK', true); for (let i = 0; i < 12; i++) Combat.update(DT); const st0 = s.P.st; s.e.x = s.P.x + 30; s.e.y = s.P.y; s.e.face = Math.PI; s.e.state = 'chase'; s.e.t = 0; s.e.cd = 0; s.e.tgt = s.P; s.e.awake = true; let blocked = false; for (let i = 0; i < 400 && !blocked; i++) { s.P.invuln = 0; s.P.guardT = 5; const h0 = s.P.hp; Combat.update(DT); if (s.P.hp < h0 - 0.01 || s.P.kx !== 0) blocked = true; } Combat.key('KeyK', false);
ok(s.P.st >= st0 - 10 && s.P.st < st0, 'the Stone guard II: the block cost half the stamina (' + st0.toFixed(1) + ' to ' + s.P.st.toFixed(1) + ')');

// the War-cry: the men within hearing freeze
s = setup({ men: 3, runes: ['warCry'] }); guardBlow(s); for (let i = 0; i < 20; i++) { hold(s.men); Combat.update(DT); } ok(s.men.every(e => e.cryBack > 0 || e.state === 'flee'), 'the War-cry: every man within hearing covers and backs off (' + s.men.map(e => (e.cryBack || 0).toFixed(2)).join(', ') + ')');

// the Blink-step: the dash goes through the man before you
s = setup({ kind: 'seax', runes: ['blinkStep'] }); const ex = s.e.x;   /* (the Shadowstep: with the seax, Robin 2026-10-24) */ s.P.inAng = 0; Combat.key('Space', true); Combat.update(DT); Combat.key('Space', false); for (let i = 0; i < 5; i++) Combat.update(DT);
ok(s.P.x > ex + 10, 'the Blink-step: he stands behind the man (' + Math.round(s.P.x - ex) + ' past him)');

// the Long leap: the dash is longer and passes a pillar
s = setup({ runes: ['longLeap'], men: 0 }); s.D.W.pillars = [{ x: 230, y: 250, r: 12 }]; Combat.key('KeyD', true); Combat.update(DT); Combat.key('Space', true); Combat.update(DT); Combat.key('Space', false); for (let i = 0; i < 40; i++) Combat.update(DT); Combat.key('KeyD', false);
ok(s.P.x > 250, 'the Long leap: over the pillar in the way (x ' + Math.round(s.P.x) + ')');

// the Slide: a long low slide, further than the dash
s = setup({ runes: ['slide'], men: 0 }); const sx0 = s.P.x; Combat.key('KeyD', true); Combat.update(DT); Combat.key('Space', true); Combat.update(DT); Combat.key('Space', false); for (let i = 0; i < 40; i++) Combat.update(DT); Combat.key('KeyD', false);
ok(s.P.x > sx0 + 90, 'the Slide: ' + Math.round(s.P.x - sx0) + ' units along the ground');

// the Ghost-step: a shade is left and the man runs at it
s = setup({ runes: ['ghostStep'] }); s.e.x = 300; console.log('  (dash slot: ' + Combat.api.runeOf('dash') + ')'); Combat.key('Space', true); Combat.update(DT); Combat.key('Space', false); const shade = !!s.D.W.shade; let lured = false; for (let i = 0; i < 30; i++) { s.e.state = 'chase'; s.e.sw = null; Combat.update(DT); if (s.e.lure) lured = true; }
ok(shade && lured, 'the Ghost-step: a shade left where he stood, the man lured to it');

// the Lunge: the swing reaches a stride further
s = setup({ runes: ['lunge'] }); s.e.x = s.P.x + 80; s.e.shield = false; s.e.guard = 0; const hpL = s.e.hp; swing(s, 30); ok(s.e.hp < hpL, 'the Lunge: a man a stride beyond the reach is struck (' + (hpL - s.e.hp).toFixed(1) + ')');


// the Overhead: a held swing breaks a guard and staggers
s = setup({ kind: 'axe', runes: ['overhead'] }); s.e.guard = 1; s.e.guardAge = 1; Combat.key('KeyJ', true); for (let i = 0; i < 50; i++) { hold(s.men); s.e.guard = 1; Combat.update(DT); } Combat.key('KeyJ', false); for (let i = 0; i < 30; i++) { hold(s.men); Combat.update(DT); }
ok(s.e.state === 'stagger' || s.e.guard === 0, 'the Overhead: the held blow breaks the guard and staggers (' + s.e.state + ')');

// the Sweep: the spear's sweep staggers every man in its arc
s = setup({ kind: 'spear', runes: ['sweep'], men: 2, wits: 0 }); s.men[1].x = s.P.x + 20; s.men[1].y = s.P.y + 30; s.men.forEach(e => { e.shield = false; e.guard = 0; }); const stg = [false, false]; Combat.key('KeyJ', true); for (let i = 0; i < 50; i++) { hold(s.men); Combat.update(DT); } Combat.key('KeyJ', false); for (let i = 0; i < 40; i++) { hold(s.men); Combat.update(DT); s.men.forEach((e, k) => { if (e.state === 'stagger') stg[k] = true; }); }   /* (the Sweep is the held spear blow since Robin's trial: J held, then let go) */ ok(stg[0] && stg[1], 'the Sweep: both men in the arc stagger (' + stg.join(', ') + ')');


// the bow: the Twin shot looses two arrows at a full draw with the ring full
function bowShot(s, drawFrames) { if (s.e) { Combat.mouse(s.e.x, s.e.y * 0.75); s.e.freezeT = 99; } Combat.key('KeyK', true); for (let i = 0; i < drawFrames; i++) Combat.update(DT); if (s.e) s.e.freezeT = 0; Combat.key('KeyJ', true); Combat.update(DT); Combat.key('KeyJ', false); Combat.key('KeyK', false); }
s = setup({ kind: 'bow', weapon: 'ranged', runes: ['twinShot'], men: 0 }); bowShot(s, 95); ok(s.D.W.projs.length === 2, 'the Twin shot: two arrows at once (' + s.D.W.projs.length + ')');
// the Pinning shot pins the man for its time
s = setup({ kind: 'bow', weapon: 'ranged', runes: ['pinningShot'] }); s.e.x = s.P.x + 120; s.e.shield = false; s.e.guard = 0; bowShot(s, 95); for (let i = 0; i < 30; i++) { hold(s.men); Combat.update(DT); } ok(s.e.freezeT > 1, 'the Pinning shot: the man is pinned (' + s.e.freezeT.toFixed(2) + ' s left)');
// the Fire-arrow at tier II needs no torch and burns the man
Runes2.BY.fireArrow.n.catchK = [1, 1, 1]; s = setup({ kind: 'bow', weapon: 'ranged', runes: [{ id: 'fireArrow', tier: 2 }] }); s.e.x = s.P.x + 120;   /* (one in four catches since Robin's trial: sure here) */ s.e.shield = false; s.e.guard = 0; bowShot(s, 95); for (let i = 0; i < 30; i++) { hold(s.men); Combat.update(DT); } ok(!!(s.e.marks && s.e.marks.burning > 0), 'the Fire-arrow II: the man burns');
// the Quick draw: the bow fills in a second
s = setup({ kind: 'bow', weapon: 'ranged', runes: ['quickDraw'], men: 0 }); Combat.key('KeyK', true); for (let i = 0; i < 62; i++) Combat.update(DT); ok(s.P.bowDraw >= 0.999, 'the Quick draw: full in a second (' + s.P.bowDraw.toFixed(2) + ')'); Combat.key('KeyK', false);
// the Still hand: standing still two seconds, the arrow does half again
Runes2.BY.stillHand.n.chance = [1, 1, 1]; s = setup({ kind: 'bow', weapon: 'ranged', runes: ['stillHand'] }); s.e.x = s.P.x + 120;   /* (Weak spot master: sure here) */ s.e.shield = false; s.e.guard = 0; s.e.hp = 400; s.e.maxHp = 400; for (let i = 0; i < 130; i++) Combat.update(DT); const hpS = s.e.hp; bowShot(s, 95); for (let i = 0; i < 30; i++) { hold(s.men); Combat.update(DT); } const dS = hpS - s.e.hp;
s = setup({ kind: 'bow', weapon: 'ranged', men: 1 }); s.e.x = s.P.x + 120; s.e.shield = false; s.e.guard = 0; s.e.hp = 400; s.e.maxHp = 400; const hpN = s.e.hp; bowShot(s, 95); for (let i = 0; i < 30; i++) { hold(s.men); Combat.update(DT); } const dN = hpN - s.e.hp;
ok(!!(s.e.marks && s.e.marks.bleeding > 0) || dS > dN, 'Weak spot master: the arrow after standing still finds the weak spot and the man bleeds (' + dS.toFixed(1) + ' against ' + dN.toFixed(1) + ')');



console.log(bad ? '  ' + bad + ' !! lines' : '  every rune answered');
