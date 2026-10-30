// A deer chased to the water (Robin, 2026-10-30: "when chased to the water they shouldnt get stuck there"): a hunter at a run drives a
// deer that stands in wide shallows, on a straight shore and in a corner of shore. It must get out past him and not stand there. COMBAT=path tries another combat.js.
//   node tests/fleeshore.js
const { createCanvas } = require('@napi-rs/canvas'); global.__mk = (w, h) => createCanvas(w, h);
const G = require('../src/art.js'), I = require('../src/items.js'); global.Items = I;
const C = require(process.env.COMBAT || '../src/combat.js');
C.init(G.lib); C.S.sound = false;
const ground = (x, y) => x < 1000 && y < 1000;
C.api.scene = { noHud: true, begin() {}, items() {}, end() {}, walk: (x, y, e) => !e || e === C.dbg().P || ground(x, y), dry: (x, y) => x < 800 && y < 800,   /* dry land ends 200 short of the deep: wide shallows, as at the beaches */ bounds: { x0: -4000, y0: -4000, x1: 4000, y1: 4000 } };
const D = C.dbg(), P = D.P, W = D.W, DT = 1 / 60; W.pillars = [];
C.api.dress = function (e) { if (e.type !== 'beast') return; const sp = G.lib.animalSpec('deer'); e.creature = true; e.kindA = 'deer'; e.kind = 'deer'; e.r = 7; e.cfg = { speed: 58 * sp.speed, windup: 0.4, lunge: 100, atk: null }; e.hp = e.maxHp = 5; };
C.tune({});
let bad = 0;
for (const [sx, sy, name] of [[950, 950, 'the corner'], [950, 500, 'a straight shore']]) {
  W.enemies.length = 0; P.x = sx - 120; P.y = sy - 40; P.hp = P.maxHp = 100; P.dead = false; P.mode = 'fight';
  const e = C.spawn('beast'); e.x = sx; e.y = sy; e.aggro = 230; e.flee = true; e.shy = true; e.awake = true; e.state = 'idle'; e.face = 0;
  let inReach = 0, still = 0, far = 0;
  for (let i = 0; i < 12 * 60; i++) { const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1; P.x += dx / d * 78 * DT; P.y += dy / d * 78 * DT; const ox = e.x, oy = e.y; e.awake = true; C.update(DT); if (d < 45) inReach += DT; if (d < 230 && Math.hypot(e.x - ox, e.y - oy) < 0.2) still += DT; far = Math.max(far, d); }
  const ok = inReach < 1.5 && still < 1.5; if (!ok) bad++;
  console.log((ok ? 'ok ' : '!! ') + ' ' + name + ': within a sword\'s reach ' + inReach.toFixed(1) + ' s of 12, standing still ' + still.toFixed(1) + ' s, got ' + Math.round(far) + ' from him at its farthest');
}
console.log('bad = ' + bad);
