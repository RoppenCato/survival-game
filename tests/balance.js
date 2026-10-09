// Fight balance: a simple hero (walks at the beast, swings its sword the whole time, no dodging, no blocking) against
// each animal, with and without armour, on a stick sword and a flint sword. Prints how long the fight took, how much
// health was lost and how often the hero died. A real player does better than this bot, so read the numbers as a
// floor: "careless". Not in npm test (it prints, it does not assert). Run: node tests/balance.js
const { createCanvas } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
global.GameArt = require('../src/art.js'); global.Items = require('../src/items.js');
const lib = GameArt.lib, Combat = require('../src/combat.js');
const ARMOUR = { none: 0, leather: Items.stats(Items.make('helmet', 'leather')).armor + Items.stats(Items.make('tunic', 'leather')).armor + Items.stats(Items.make('trousers', 'leather')).armor + Items.stats(Items.make('boots', 'leather')).armor + Items.stats(Items.make('cloak', 'leather')).armor };
const DMG = { aggro: { boar: 14, wolf: 10, snake: 6, bear: 30, moose: 22, troll: 28 }, n: { boar: 1, wolf: 2, snake: 1, bear: 1, moose: 1, troll: 1 }, r: { boar: 9, wolf: 8, snake: 5, bear: 12, moose: 13, troll: 9 } };
function fight(kind, weapon, armour, trials) {
  let kills = 0, deaths = 0, tSum = 0, lossSum = 0;
  for (let t = 0; t < trials; t++) {
    const sword = Items.make('sword', weapon);
    Combat.api.roster = []; Combat.api.armor = () => ARMOUR[armour]; Combat.api.items = { held: () => sword, tool: () => null, weapon: (k) => (k === 'bow' ? null : sword) };
    Combat.api.dress = function (e) { const sp = lib.animalSpec(kind); e.creature = true; e.kind = kind; e.r = DMG.r[kind] * sp.size; e.cfg = { speed: 58 * sp.speed, windup: sp.windup, lunge: 175 * sp.lunge, dmg: DMG.aggro[kind], atk: lib.animalAttack(kind) }; e.hp = e.maxHp = sp.hp; };
    Combat.init(lib); Combat.clear();
    const D = Combat.dbg(), P = D.P; P.x = 200; P.y = 250; P.mode = 'fight'; P.weapon = 'melee';
    const es = []; for (let i = 0; i < DMG.n[kind]; i++) { const e = Combat.spawn('beast'); e.x = 200 + 90 + i * 22; e.y = 250 + i * 14; es.push(e); }
    let time = 0; const hp0 = P.hp;
    while (time < 40 && !P.dead && es.some((e) => !e.dead)) {
      const tgt = es.filter((e) => !e.dead).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0];
      Combat.mouse(tgt.x, tgt.y * 0.75);
      const d = Math.hypot(tgt.x - P.x, tgt.y - P.y), ang = Math.atan2(tgt.y - P.y, tgt.x - P.x);
      Combat.key('KeyD', Math.cos(ang) > 0.3 && d > 34); Combat.key('KeyA', Math.cos(ang) < -0.3 && d > 34); Combat.key('KeyS', Math.sin(ang) > 0.3 && d > 34); Combat.key('KeyW', Math.sin(ang) < -0.3 && d > 34);
      Combat.button(0, d < 60 && Math.floor(time * 60) % 14 < 3);   // taps, not a held button (holding charges a heavy swing)
      Combat.update(1 / 60); time += 1 / 60;
    }
    if (P.dead) deaths++; else if (es.every((e) => e.dead)) { kills++; tSum += time; lossSum += hp0 - P.hp; }
  }
  return { kills, deaths, trials, secs: kills ? (tSum / kills).toFixed(1) : '-', lost: kills ? Math.round(lossSum / kills) : '-' };
}
console.log('leather set armour =', ARMOUR.leather.toFixed(2), '(share of a blow turned aside)');
['boar', 'wolf', 'snake', 'moose', 'bear', 'troll'].forEach((k) => {
  [['wood', 'none'], ['wood', 'leather'], ['flint', 'leather']].forEach(([wp, ar]) => {
    const r = fight(k, wp, ar, 12);
    console.log((k + ' (' + DMG.n[k] + ')').padEnd(10), (wp === 'wood' ? 'stick sword' : 'flint sword').padEnd(12), ar.padEnd(8), 'won', String(r.kills).padStart(2) + '/' + r.trials, ' died', String(r.deaths).padStart(2), ' took', String(r.secs).padStart(5), 's, lost', String(r.lost).padStart(3), 'hp');
  });
});
