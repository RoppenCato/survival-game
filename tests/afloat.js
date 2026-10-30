// Aboard, they leave (Robin, 2026-10-30: "if you enter a boat they should just leave"): a boar and a town's man are hunting the hero, he boards.
// The boar must stop hunting, not wake while he lies off the shore; the man must walk back to his post. COMBAT=path tries another combat.js.
//   node tests/afloat.js
const { createCanvas } = require('@napi-rs/canvas'); global.__mk = (w, h) => createCanvas(w, h);
const G = require('../src/art.js'), I = require('../src/items.js'); global.Items = I;
const C = require(process.env.COMBAT || '../src/combat.js');
C.init(G.lib); C.S.sound = false;
C.api.scene = { noHud: true, begin() {}, items() {}, end() {}, walk() { return true; }, bounds: { x0: -4000, y0: -4000, x1: 4000, y1: 4000 } };
const D = C.dbg(), P = D.P, W = D.W, DT = 1 / 60; W.pillars = [];
C.api.dress = function (e) { if (e.type !== 'beast') return; const sp = G.lib.animalSpec('boar'); e.creature = true; e.kindA = 'boar'; e.kind = 'boar'; e.r = 8; e.cfg = { speed: 64, windup: sp.windup, lunge: 175, atk: G.lib.animalAttack('boar') }; e.hp = e.maxHp = sp.hp; C.tuneBeast(e, 'boar'); };
C.tune({});
let afloat = false; C.api.afloat = () => afloat;
P.x = 0; P.y = 0; P.hp = P.maxHp = 100; P.dead = false;
const b = C.spawn('beast'); b.x = 100; b.y = 0; b.aggro = 75; b.awake = true; b.state = 'chase'; b.grudgeT = 12; b.wander = { x0: 100, y0: 0, r: 80, wait: 0 };
const m = C.soldier({ side: 0, wpn: { kind: 'sword', mat: 'iron' }, shield: true, armor: 0.3, x: -150, y: 0, post: { x: -300, y: 0, face: 0 }, aggro: 80, hp: 30, strength: 4, wits: 4, nerve: 1 }); m.awake = true;
for (let i = 0; i < 60; i++) { P.hp = 100; C.update(DT); }
const before = { boar: Math.round(Math.hypot(b.x, b.y)), man: Math.round(Math.hypot(m.x, m.y)), manAwake: m.awake };
afloat = true; P.hp = 100; const hp0 = P.hp; let minB = 1e9;
for (let i = 0; i < 25 * 60; i++) { C.update(DT); minB = Math.min(minB, Math.hypot(b.x, b.y)); }
const boarOk = !b.awake, hurt = hp0 - P.hp, manOk = Math.hypot(m.x + 300, m.y) < 30;
console.log((boarOk ? 'ok ' : '!! ') + ' the boar: awake ' + !!b.awake + ', state ' + b.state);
console.log((manOk ? 'ok ' : '!! ') + ' the man: ' + Math.round(Math.hypot(m.x + 300, m.y)) + ' from his post, awake ' + m.awake);
console.log((hurt < 15 ? 'ok ' : '!! ') + ' the hero lost ' + Math.round(hurt) + ' after boarding (a blow begun may land)');
afloat = false; b.x = 30; b.y = 0; for (let i = 0; i < 60; i++) { P.hp = 100; C.update(DT); }
console.log((b.awake ? 'ok ' : '!! ') + ' ashore again, a boar beside him wakes: ' + !!b.awake);
