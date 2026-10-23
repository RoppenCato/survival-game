// The shield bash (Robin's decisions of 2026-10-23): J with the guard up against a man whose guard is up breaks his block and throws
// him; against a man with his guard down it is a low blow and a push (the bash comes always); without a shield the shoulder does it for less.
//   node tests/bash.js
const { createCanvas } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
global.GameArt = require('../src/art.js'); global.Items = require('../src/items.js');
const lib = GameArt.lib, Combat = require('../src/combat.js'); global.Runes2 = require('../src/runes2.js');
Combat.api.roster = []; Combat.init(lib);
const DT = 1 / 60;
function setup(shield, mouse) {
  Combat.reset(); const D = Combat.dbg(), P = D.P; P.x = 200; P.y = 250; P.mode = 'fight'; P.weapon = 'melee'; D.W.pillars = [];
  const it = Items.make('sword', 'iron'); Combat.api.items = { held: () => it, tool: () => null, weapon: () => it };
  Combat.api.shield = () => shield; D.S.shield = shield;
  const e = Combat.soldier({ side: 0, wpn: { kind: 'axe', mat: 'iron' }, shield: true, armor: 0.2, x: 234, y: 250, hp: 30, strength: 4, wits: 4, nerve: 1 });
  D.W.enemies.push(e); P.face = 0; P.inAng = 0;
  const st = Runes2.start(); Combat.api.runeState = st; Runes2.readyAll(st);   // the Bash bound and its blood ring full
  if (mouse) Combat.button(2, true); else Combat.key('KeyK', true); for (let i = 0; i < 20; i++) { e.state = 'circle'; e.sw = null; Combat.update(DT); }
  return { D, P, e, mouse, st };
}
function press(P, e, guardUp, mouse) {
  e.guard = guardUp ? 1 : 0; e.guardAge = 1; e.state = 'circle'; e.sw = null; e.x = P.x + 34; e.y = P.y;
  const st0 = P.st; if (mouse) Combat.button(0, true); else Combat.key('KeyJ', true); Combat.update(DT); if (mouse) Combat.button(0, false); else Combat.key('KeyJ', false);
  return { spent: +(st0 - P.st).toFixed(1), bashT: +(P.bashT || 0).toFixed(2), eState: e.state, guardCd: +(e.guardCd || 0).toFixed(2), thrown: +Math.hypot(e.kx || 0, e.ky || 0).toFixed(0), hurt: +(30 - e.hp).toFixed(2) };   // (hurt 6 is the men's own scale, hpK: 30 becomes 24; more is damage dealt)
}
let s = setup(true); console.log('guard up (shield): P.guard', s.P.guard);
let r = press(s.P, s.e, true); console.log('  blocking man  ', JSON.stringify(r), (r.eState === 'stagger' && r.guardCd >= 1.3 && r.spent === 14 && r.bashT === 0.3) ? 'ok' : '!! wrong');
s = setup(true); r = press(s.P, s.e, false); console.log('  guard down: a low blow', JSON.stringify(r), (r.guardCd < 1 && r.spent === 14 && r.hurt > 6 && r.hurt < 8) ? 'ok' : '!! wrong');
s = setup(false); r = press(s.P, s.e, true); console.log('  shoulder, no shield', JSON.stringify(r), (r.eState === 'stagger' && r.thrown > 0) ? 'ok' : '!! wrong');
s = setup(true, true); r = press(s.P, s.e, true, true); console.log('  mouse: right held, left (Robin, 2026-10-23: "holding mouse2 and doing mouse1")', JSON.stringify(r), (r.eState === 'stagger' && r.spent === 14) ? 'ok' : '!! wrong');
var CR = typeof Combat.api.crowd === 'function' ? Combat.api.crowd() : Combat.api.crowd; console.log('  the shield throw', CR.shoveD, 'the shoulder', CR.shoveD * CR.shoulderK);
// the blood ring: empty, the bash does nothing; three blows landed and it is ready; the Charge bound instead: a rush that knocks the man down
s = setup(true); Runes2.spend(s.st, 'guardBlow'); r = press(s.P, s.e, true); console.log('  ring empty: nothing', JSON.stringify(r), (r.spent === 0 && r.eState !== 'stagger') ? 'ok' : '!! wrong');
Runes2.drawBlood(s.st); Runes2.drawBlood(s.st); Runes2.drawBlood(s.st); r = press(s.P, s.e, true); console.log('  three blows landed: ready', JSON.stringify(r), r.eState === 'stagger' ? 'ok' : '!! wrong');
s = setup(true); Runes2.learn(s.st, 'charge', 1); Runes2.bind(s.st, 'guardBlow', 'charge'); Runes2.readyAll(s.st); s.e.guard = 0; s.e.x = s.P.x + 40; s.e.y = s.P.y; s.e.state = 'circle'; s.e.sw = null;
Combat.button(0, true); for (let i = 0; i < 30; i++) { Combat.update(DT); if (i === 0) Combat.button(0, false); }
console.log('  the Charge: the man in the way', JSON.stringify({ eState: s.e.state, dur: s.e.dur, uses: s.st.uses.charge || 0, heroMoved: Math.round(s.P.x - 200) }), (s.e.state === 'stagger' && s.e.dur >= 1.2 && (s.st.uses.charge || 0) === 1) ? 'ok' : '!! wrong');
