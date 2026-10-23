// The bow drawn and held (Robin, 2026-10-23): the right button draws it, up to 1.5 s, the left lets the arrow go; more draw, more
// damage and speed; no shot without a draw; no guard with the bow.   node tests/bow.js
const { createCanvas } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
global.GameArt = require('../src/art.js'); global.Items = require('../src/items.js');
const lib = GameArt.lib, Combat = require('../src/combat.js');
Combat.api.roster = []; Combat.init(lib);
const DT = 1 / 60;
function setup() {
  Combat.reset(); const D = Combat.dbg(), P = D.P; P.x = 200; P.y = 250; P.mode = 'fight'; P.weapon = 'ranged'; D.W.pillars = [];
  const bow = Items.make('bow', 'wood'); Combat.api.items = { held: () => bow, tool: () => null, weapon: k => bow }; Combat.api.shield = () => true;
  Combat.mouse(400, 250); for (let i = 0; i < 5; i++) Combat.update(DT); return { D, P };
}
function shot(drawSecs) {
  const { D, P } = setup(); Combat.button(2, true); for (let i = 0; i < Math.round(drawSecs * 60); i++) Combat.update(DT);
  const guard = P.guard, draw = +(P.bowDraw || 0).toFixed(2); Combat.button(0, true); Combat.update(DT); Combat.button(0, false); Combat.button(2, false);
  const pr = D.W.projs[0]; return { draw, guard, shot: !!pr, dmg: pr ? +pr.dmg.toFixed(2) : 0, speed: pr ? +Math.hypot(pr.vx, pr.vy).toFixed(0) : 0 };
}
const a = shot(0.1), b = shot(0.8), c = shot(1.5), d = shot(3);
console.log('draw 0.1 s', JSON.stringify(a), a.shot && !a.guard ? 'ok' : '!! wrong');
console.log('draw 0.8 s', JSON.stringify(b), b.shot && b.dmg > a.dmg ? 'ok' : '!! wrong');
console.log('draw 1.5 s', JSON.stringify(c), c.shot && c.dmg > b.dmg ? 'ok' : '!! wrong');
console.log('draw 3 s (full at 1.5)', JSON.stringify(d), d.shot && d.dmg === c.dmg && d.draw === 1.5 ? 'ok' : '!! wrong');
const { D, P } = setup(); Combat.button(0, true); Combat.update(DT); Combat.button(0, false);
console.log('left alone, no draw', JSON.stringify({ shot: D.W.projs.length, guard: P.guard }), D.W.projs.length === 0 ? 'ok' : '!! wrong');
console.log('the full draw does', (c.dmg / a.dmg).toFixed(2), 'times the snap shot; BOW', JSON.stringify(Combat.api.bowSpec || {}));
