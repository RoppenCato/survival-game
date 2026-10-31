// A boat never crosses land: run up a beach, turned, backed; and stuck on land (Robin, 2026-10-31). Land is x > 0, a sand band to x 40 touched by the bow only.
const Yard = require('../src/yard.js');
const H = Yard.HANDLING.karve || Object.values(Yard.HANDLING)[0];
const hw = 30, land = x => x > 0;
const free = (x, y, h) => !land(x + Math.abs(Math.cos(h)) * hw) && !land(x);
const beach = (x, y, h) => !land(x) && Math.cos(h) > 0.3 && land(x + Math.cos(h) * hw);
beach.mid = (x, y) => !land(x);
function run(v, inp, t) { for (let i = 0; i < t * 60; i++) Yard.sail(v, inp, 1 / 60, free, H, null, beach); }
let v = { x: -200, y: 0, h: 0, speed: 0, vx: 0, vy: 0 };
run(v, { ix: 0, iy: -1 }, 12);
console.log('run up the beach: x', v.x.toFixed(1), 'beached', v.beached);
run(v, { ix: 0, iy: 1 }, 2); console.log('backed off: x', v.x.toFixed(1));
v = { x: -5, y: 0, h: Math.PI, speed: -20, vx: 20, vy: 0, beached: 1 };
run(v, { ix: 0, iy: 1 }, 20);
console.log((v.x > 1 ? '!! ' : '') + 'beached, her stern to the land, backing 20 s: x', v.x.toFixed(1));
v = { x: -1, y: 0, h: 0, speed: 0, vx: 0, vy: 0 };
run(v, { ix: 0, iy: -1 }, 20);
console.log((v.x > 1 ? '!! ' : '') + 'bow first 20 s from the edge: x', v.x.toFixed(1));
