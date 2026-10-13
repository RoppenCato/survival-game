// The feel of one blow, measured (2026-10-13, combat rung 1: "the sword quick, the axe heavy, the Dane axe a commitment").
// Every melee weapon of the hero (iron) is swung at a man who stands still (e.hold) and the engine is watched: when the blow
// lands after the press, how the chain runs when the button is held, how far it reaches (with the step into it), how wide
// it is, what it does to a man in leather, what it pushes, what it costs in breath. The numbers are the weapon's character;
// a line marked !! is a contradiction (a seax that reaches as far as a sword, a Dane axe quicker than an axe).
//   node tests/blows.js          the table, and the men's blows under it (what a man's blow takes against the hero)
// Prints and does not assert, like every test here: read the lines.
const { createCanvas } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
global.GameArt = require('../src/art.js'); global.Items = require('../src/items.js');
const lib = GameArt.lib, Combat = require(process.env.ENGINE || '../src/combat.js');
Combat.api.roster = []; Combat.init(lib);
if (process.env.MEN) Object.assign(Combat.api.men, JSON.parse(process.env.MEN));
const FPS = 60, DT = 1 / FPS, KINDS = ['sword', 'axe', 'club', 'seax', 'spear', 'greataxe'];
const PF = Combat.api.profiles();
let hits = [];
Combat.api.onLog = ev => { if (ev.k === 'hit') hits.push(Object.assign({ t: T }, ev)); };
let T = 0;
function setup(kind, dx, dy, o) {                  // the hero at (200, 250) facing east with an iron thing of the kind; a man at dx, dy from him
  Combat.reset(); const D = Combat.dbg(), P = D.P; P.x = 200; P.y = 250; P.mode = 'fight'; P.weapon = 'melee'; P.face = 0; P.inAng = null; D.W.pillars = []; D.S.aim = 'facing'; D.S.crit = 0;   // (facing: the blow goes where he looks, so the arc can be measured; no crits: the same numbers every run)
  Combat.api.scene = { begin() {}, items() {}, bounds: { x0: -5000, y0: -5000, x1: 5000, y1: 5000 } };
  const it = Items.make(kind, 'iron'); Combat.api.armor = () => 0; Combat.api.items = { held: () => it, tool: () => null, weapon: k => (k === 'bow' ? null : it) };
  o = o || {}; const e = Combat.soldier(Object.assign({ side: 0, wpn: { kind: 'sword', mat: 'iron' }, shield: false, armor: 0.2, x: 200 + dx, y: 250 + dy, hp: 1e6, strength: 4, wits: 4 }, o));
  e.face = Math.PI; if (!o.live) e.hold = true;     // (hold: he stands and takes it; live: he fights back, for the push)
  hits = []; T = 0; return { D, P, e, it };
}
function step(n, fn) { for (let i = 0; i < n; i++) { if (fn) fn(i); Combat.update(DT); T += DT; } }
const press = (on) => Combat.button(0, on);
const r2 = v => Math.round(v * 100) / 100, ms = v => Math.round(v * 1000);
const rows = [], faults = [];
for (const kind of KINDS) {
  const pf = PF[kind], row = { kind };
  // 1. the press and the landing: the dummy well inside the reach, one press, the first hit
  let S = setup(kind, pf.reach - 6, 0); press(true); step(1); press(false); step(90);
  row.land = hits.length ? hits[0].t : null; if (row.land == null) faults.push(kind + ': a press at ' + (pf.reach - 6) + ' units never landed');
  // 2. the chain: the button held four seconds; the hits, the beats between them, the heavy ones, the breath
  S = setup(kind, pf.reach - 6, 0); const st0 = S.P.st; let stMin = st0; step(FPS * 4, i => { press(i % 6 < 2); stMin = Math.min(stMin, S.P.st); }); press(false);   // (pressed again every tenth of a second: the chain runs as fast as the engine lets it)
  const ts = hits.map(h => h.t), gaps = ts.slice(1).map((t, i) => t - ts[i]);
  row.hits4 = hits.length; row.gapMin = gaps.length ? Math.min.apply(null, gaps) : null; row.gapMax = gaps.length ? Math.max.apply(null, gaps) : null;
  row.chain = pf.chain; row.heavyEvery = hits.filter(h => h.kind === 'heavy').length; row.perMin = hits.length / 4 * 60;
  row.dealt = hits.length ? hits.reduce((q, h) => q + h.dmg, 0) / hits.length : 0; row.dealtLight = hits.filter(h => h.kind !== 'heavy').map(h => h.dmg); row.dealtHeavy = hits.filter(h => h.kind === 'heavy').map(h => h.dmg);
  row.stUsed = st0 - stMin; row.blows30 = row.dealt ? Math.ceil(Combat.api.men.hp * Combat.api.men.hpK / row.dealt) : null;   // blows to put down a man in leather, with no shield
  // 3. the reach: the farthest the man can stand for the first blow to land (the step into it counts); and the arc at 0.8 of it
  let far = 0; for (let d = 16; d <= 110; d += 2) { S = setup(kind, d, 0); press(true); step(1); press(false); step(70); if (hits.length) far = d; else if (far) break; }
  row.reach = far; row.reachData = pf.reach; row.lunge = pf.lunge;
  let wide = 0; const rd = Math.round(pf.reach * 0.8); for (let a = 0; a <= 100; a += 4) { const q = a * Math.PI / 180; S = setup(kind, Math.cos(q) * rd, Math.sin(q) * rd); press(true); step(1); press(false); step(70); if (hits.length) wide = a; else if (wide) break; }
  row.halfArc = wide; row.arcData = Math.round(pf.arc / 2 * 180 / Math.PI);
  // 4. the push: a man at his post who has noticed nothing (a held man's knockback is zeroed; a live one walks), struck once in the face; the farthest he is moved in the half second after
  S = setup(kind, pf.reach - 6, 0, { live: true, hp: 1e6, post: { x: 200 + pf.reach - 6, y: 250, face: Math.PI }, aggro: 0.5 }); const x0 = S.e.x; let pushed = null; press(true); step(1); press(false);
  step(120, () => { S.P.hp = 100; S.P.st = 100; if (hits.length && pushed == null && T - hits[0].t >= 0.2) pushed = S.e.x - x0; });   // (0.2 s: the knockback has mostly run; later he hops back or staggers, which is his own doing)
  row.push = pushed == null ? 0 : pushed; row.kbData = pf.kb;
  rows.push(row);
}
console.log('--- one blow of each weapon (iron, the hero in fight mode) against a man in leather who stands still. land: press to the first hit;');
console.log('    pressed 4 s: hits, the beats between, how many were the heavy last blow of a chain, hits a minute pressing; dealt: the blow on him (a man has ' + (Combat.api.men.hp * Combat.api.men.hpK) + ');');
console.log('    reach: where he must stand for the first blow to land (the step into it counts) against the number; arc: the half-angle a blow still lands at; push: how far a man was moved in the 0.2 s after; breath: the stamina the 4 s took net of what came back, and what one blow costs');
console.log(['weapon'.padEnd(9), 'land', '4 s: hits', 'beat min..max', 'heavy', 'a min', 'dealt (light / heavy)', 'blows to a man', 'reach (data, step)', 'arc (data)', 'push (kb)', 'breath (a blow)'].join(' | '));
for (const r of rows) {
  console.log([r.kind.padEnd(9), (ms(r.land) + ' ms').padStart(6), String(r.hits4).padStart(4), r.gapMin == null ? '-' : (ms(r.gapMin) + '..' + ms(r.gapMax) + ' ms').padStart(12), String(r.heavyEvery).padStart(3), String(Math.round(r.perMin)).padStart(4),
    (r2(r.dealt) + ' (' + r2(r.dealtLight[0] || 0) + ' / ' + r2(r.dealtHeavy[0] || 0) + ')').padStart(20), String(r.blows30).padStart(4), (r.reach + ' (' + r.reachData + ', ' + r.lunge + ')').padStart(14), (r.halfArc + ' (' + r.arcData + ')').padStart(9), (Math.round(r.push) + ' (' + r.kbData + ')').padStart(9), (Math.round(r.stUsed) + ' (' + PF[r.kind].st + ')').padStart(7)].join(' | '));
}
// What must hold for the weapons to differ as docs/weapons.md says (the character of each)
const by = {}; rows.forEach(r => by[r.kind] = r);
const must = (ok, what) => { if (!ok) faults.push(what); };
must(by.seax.land < by.sword.land, 'the seax should land quicker than the sword (' + ms(by.seax.land) + ' against ' + ms(by.sword.land) + ' ms)');
must(by.sword.land < by.axe.land, 'the sword should land quicker than the axe (' + ms(by.sword.land) + ' against ' + ms(by.axe.land) + ' ms)');
must(by.axe.land < by.greataxe.land, 'the axe should land quicker than the Dane axe (' + ms(by.axe.land) + ' against ' + ms(by.greataxe.land) + ' ms)');
must(by.club.land > by.sword.land, 'the club should be slower than the sword to land (' + ms(by.club.land) + ' against ' + ms(by.sword.land) + ' ms)');
must(by.greataxe.land >= 0.5, 'the Dane axe should be a commitment: half a second at least to land (' + ms(by.greataxe.land) + ' ms)');
must(by.sword.land <= 0.3, 'the sword should be quick: within 0.3 s of the press (' + ms(by.sword.land) + ' ms)');
must(by.seax.perMin > by.sword.perMin && by.sword.perMin > by.axe.perMin && by.axe.perMin > by.club.perMin && by.club.perMin > by.greataxe.perMin, 'held, the weapons should strike in the order seax, sword, axe, club, Dane axe: ' + rows.map(r => r.kind + ' ' + Math.round(r.perMin)).join(', '));
must(by.spear.reach > by.sword.reach && by.spear.reach > by.greataxe.reach, 'the spear should reach furthest (' + by.spear.reach + ' against the sword ' + by.sword.reach + ', the Dane axe ' + by.greataxe.reach + ')');
must(by.seax.reach < by.sword.reach, 'the seax should reach less than the sword (' + by.seax.reach + ' against ' + by.sword.reach + ')');
must(by.greataxe.reach > by.axe.reach, 'the Dane axe should outreach the axe (' + by.greataxe.reach + ' against ' + by.axe.reach + ')');
must(by.greataxe.halfArc > by.sword.halfArc && by.sword.halfArc > by.spear.halfArc, 'the arcs should go Dane axe, sword, spear (' + by.greataxe.halfArc + ', ' + by.sword.halfArc + ', ' + by.spear.halfArc + ')');
must(by.spear.halfArc <= 30 && by.seax.halfArc <= 45, 'a thrust should be narrow (spear ' + by.spear.halfArc + ', seax ' + by.seax.halfArc + ' degrees)');
must(by.greataxe.push > by.sword.push && by.club.push > by.sword.push, 'the Dane axe and the club should push a man further than the sword (' + Math.round(by.greataxe.push) + ', ' + Math.round(by.club.push) + ' against ' + Math.round(by.sword.push) + ')');
must(by.greataxe.dealt > by.axe.dealt && by.axe.dealt >= by.sword.dealt && by.sword.dealt > by.seax.dealt, 'a blow should hurt in the order Dane axe, axe, sword, seax (' + [by.greataxe, by.axe, by.sword, by.seax].map(r => r2(r.dealt)).join(', ') + ')');
must(rows.every(r => r.hits4 >= r.chain), 'held four seconds, every weapon should run its whole chain at least once');
must(rows.every(r => r.heavyEvery >= 1), 'every weapon should land its heavy last blow within four seconds');
must(PF.greataxe.st > PF.sword.st && PF.sword.st > PF.seax.st, 'the breath one blow takes should go Dane axe, sword, seax (' + [PF.greataxe, PF.sword, PF.seax].map(p => p.st).join(', ') + ')');
// the swing's time against the clip's: how long the blow takes from the press to the end of the recovery (the hero is busy)
console.log('    a whole blow (press to free again, the first of the chain): ' + KINDS.map(k => { const pf = PF[k]; return k + ' ' + ms(pf.wu + pf.ac + pf.rec) + ' ms'; }).join(', ') + '; the heavy last: ' + KINDS.map(k => { const pf = PF[k]; return k + ' ' + ms(pf.wu * 2 + pf.ac * 1.3 + pf.rec * 2.2) + ' ms'; }).join(', '));
// ---- the men's blows, under it: what the hero faces (their windup, their blow on him in leather and in nothing, their blow on a man)
console.log('--- the men (iron, strength 4): their windup (what the hero sees coming), their blow on the hero (in leather, 0.2 turned aside; and in cloth), on a man in leather');
{
  const M = Combat.api.men, LE = 0.2 * 1;   // (the test's leather: 0.2 of a blow turned aside)
  for (const k of KINDS) {
    const pf = PF[k], wu = M.wu + pf.wu * M.wuK, dmg = M.dmg * (M.wdmg[k] || 1) * (0.7 + 4 * 0.075) * 1.3;
    console.log('   ' + k.padEnd(9) + ' windup ' + ms(wu) + ' ms   on the hero: ' + r2(dmg * (1 - LE)) + ' (leather), ' + r2(dmg) + ' (cloth): ' + Math.ceil(100 / (dmg * (1 - LE))) + ' blows to 100   on a man: ' + r2(dmg * M.toMen * (1 - LE)) + ': ' + Math.ceil(M.hp * M.hpK / (dmg * M.toMen * (1 - LE))) + ' blows to ' + (M.hp * M.hpK));
  }
  const sw = by.sword, bl = sw.dealt ? Math.ceil(M.hp * M.hpK / sw.dealt) : '-';
  console.log('   the hero with an iron sword puts a man of ' + (M.hp * M.hpK) + ' in leather down in ' + bl + ' blows (' + Math.round(bl * 60 / sw.perMin * 10) / 10 + ' s held); a man with a sword puts the hero in leather down in ' + Math.ceil(100 / (M.dmg * 1 * (0.7 + 0.3) * 1.3 * (1 - LE))) + ' (one every ' + r2(M.cd[0] + M.wu + PF.sword.wu * M.wuK) + ' to ' + r2(M.cd[1] + M.wu + PF.sword.wu * M.wuK) + ' s by his wits)');
}
if (faults.length) { console.log('!! ' + faults.length + ' contradiction' + (faults.length > 1 ? 's' : '') + ':'); faults.forEach(f => console.log('!!   ' + f)); } else console.log('   no contradictions: every weapon has the character docs/weapons.md gives it');
