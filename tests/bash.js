// The shield bash (Robin's decisions of 2026-10-23): J with the guard up against a man whose guard is up breaks his block and throws
// him; against a man with his guard down nothing happens and nothing is spent; without a shield the shoulder does it for less.
//   node tests/bash.js
const { createCanvas } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
global.GameArt = require('../src/art.js'); global.Items = require('../src/items.js');
const lib = GameArt.lib, Combat = require('../src/combat.js');
Combat.api.roster = []; Combat.init(lib);
const DT = 1 / 60;
function setup(shield) {
  Combat.reset(); const D = Combat.dbg(), P = D.P; P.x = 200; P.y = 250; P.mode = 'fight'; P.weapon = 'melee'; D.W.pillars = [];
  Combat.api.items = { held: () => ({ kind: 'sword', mat: 'iron' }), tool: () => null, weapon: () => ({ kind: 'sword', mat: 'iron' }) };
  Combat.api.shield = () => shield; D.S.shield = shield;
  const e = Combat.soldier({ side: 0, wpn: { kind: 'axe', mat: 'iron' }, shield: true, armor: 0.2, x: 234, y: 250, hp: 30, strength: 4, wits: 4, nerve: 1 });
  D.W.enemies.push(e); P.face = 0; P.inAng = 0;
  Combat.key('KeyK', true); for (let i = 0; i < 20; i++) { e.state = 'circle'; e.sw = null; Combat.update(DT); }
  return { D, P, e };
}
function press(P, e, guardUp) {
  e.guard = guardUp ? 1 : 0; e.guardAge = 1; e.state = 'circle'; e.sw = null; e.x = P.x + 34; e.y = P.y;
  const st0 = P.st; Combat.key('KeyJ', true); Combat.update(DT); Combat.key('KeyJ', false);
  return { spent: +(st0 - P.st).toFixed(1), bashT: +(P.bashT || 0).toFixed(2), eState: e.state, guardCd: +(e.guardCd || 0).toFixed(2), thrown: +Math.hypot(e.kx || 0, e.ky || 0).toFixed(0) };
}
let s = setup(true); console.log('guard up (shield): P.guard', s.P.guard);
let r = press(s.P, s.e, true); console.log('  blocking man  ', JSON.stringify(r), (r.eState === 'stagger' && r.guardCd >= 1.3 && r.spent === 14 && r.bashT === 0.3) ? 'ok' : '!! wrong');
s = setup(true); r = press(s.P, s.e, false); console.log('  guard down    ', JSON.stringify(r), (r.eState !== 'stagger' && r.spent === 0 && r.bashT === 0) ? 'ok' : '!! wrong');
s = setup(false); r = press(s.P, s.e, true); console.log('  shoulder, no shield', JSON.stringify(r), (r.eState === 'stagger' && r.thrown > 0) ? 'ok' : '!! wrong');
var CR = typeof Combat.api.crowd === 'function' ? Combat.api.crowd() : Combat.api.crowd; console.log('  the shield throw', CR.shoveD, 'the shoulder', CR.shoveD * CR.shoulderK);
