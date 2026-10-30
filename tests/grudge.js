// A beast shot from afar comes for you (Robin, 2026-10-30: "enemies dont aggro if you shoot them from far enough. So you can
// effectively hit boars from afar until they die"): a calm boar 220 or 280 units off (past its calm-down reach, 195) is shot once with a full draw, then watched for
// eight seconds. It must come to the hero and strike. COMBAT=path tries another combat.js (the committed one, to see the fault).
//   node tests/grudge.js
const { createCanvas } = require('@napi-rs/canvas'); global.__mk = (w, h) => createCanvas(w, h);
const G = require('../src/art.js'), I = require('../src/items.js'); global.Items = I;
const C = require(process.env.COMBAT || '../src/combat.js');
C.init(G.lib); C.S.sound = false; C.S.ranged = 'mouse';
C.api.scene = { noHud: true, begin() {}, items() {}, end() {}, walk() { return true; }, bounds: { x0: -4000, y0: -4000, x1: 4000, y1: 4000 } };
const D = C.dbg(), P = D.P, W = D.W, DT = 1 / 60; W.pillars = [];
const bow = I.make('bow', 'wood'); C.api.items = { held: () => bow, tool: () => null, weapon: () => bow }; C.api.shield = () => false;
C.api.dress = function (e) { if (e.type !== 'beast') return; const sp = G.lib.animalSpec('boar'); e.creature = true; e.kindA = 'boar'; e.kind = 'boar'; e.r = 8 * sp.size; e.cfg = { speed: 58 * sp.speed, windup: sp.windup, lunge: 175 * sp.lunge, atk: G.lib.animalAttack('boar') }; e.hp = e.maxHp = sp.hp; C.tuneBeast(e, 'boar'); };
C.tune({});
let bad = 0;
for (const far of [150, 220, 280]) {
  W.enemies.length = 0; W.projs.length = 0; P.x = 0; P.y = 0; P.hp = P.maxHp = 100; P.dead = false; P.mode = 'fight'; P.weapon = 'ranged';
  const e = C.spawn('beast'); e.x = far; e.y = 0; e.aggro = 75; e.awake = false; e.state = 'idle'; e.face = Math.PI;
  C.mouse(e.x, e.y * 0.75); for (let i = 0; i < 5; i++) C.update(DT);
  C.button(2, true); for (let i = 0; i < 95; i++) { C.mouse(e.x, e.y * 0.75); C.update(DT); } C.button(0, true); C.update(DT); C.button(0, false); C.button(2, false);
  let hit = false, closest = 1e9, hurt = 0; const hp0 = e.hp;
  for (let i = 0; i < 8 * 60; i++) { C.update(DT); if (e.hp < hp0) hit = true; closest = Math.min(closest, Math.hypot(e.x - P.x, e.y - P.y)); }
  hurt = 100 - P.hp; const ok = !hit || (closest < 40 && hurt > 0);
  if (!ok) bad++;
  console.log((ok ? 'ok ' : '!! ') + ' a boar shot from ' + far + ': hit ' + hit + ', came within ' + Math.round(closest) + ', the hero lost ' + Math.round(hurt));
}
console.log('bad = ' + bad);
