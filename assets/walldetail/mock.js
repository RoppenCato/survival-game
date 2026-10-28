// mock.js: long walls in logs, planks and wattle, and plank and earth floors, as the game's Build draws them, before and after BuildDetail
// (Colin, AD, 2026-10-28). Writes work/variation/variation_mock.png.
const GAME = 'C:/dev/SG/Game Developer';
const { createCanvas } = require(GAME + '/node_modules/@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const Build = require(GAME + '/src/build.js'), BD = require('./build_detail.js');
const Z = 3, W = 400, H = 360, cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d'); c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#7f945c'; c.fillRect(0, 0, W, H);
const T = Build.T, TS = Build.TS, cfg = Build.cfg({}), FC = { plank: ['#a07a52', '#5e4430'], dirt: ['#9a7c58', '#6a5440'] };
function wall(tx, ty, m, n, detail) { for (let x = tx; x < tx + n; x++) { const e = { t: 'wall', m }; Build.drawH(c, x, ty, e, false, false, cfg);
  if (detail) { const M = Build.WALLS[m], h = cfg.wallH, x0 = x * T, yb = ty * TS; c.save(); c.beginPath(); c.rect(x0 + 0.6, yb - h + 0.8, T - 1.2, h - 1.4); c.clip(); BD.face(c, M, x0, yb - h, T, h, x * 13 + ty * 37); c.restore(); } } }
function floorRun(tx, ty, tile, n, detail) { for (let y = ty; y < ty + 2; y++) for (let x = tx; x < tx + n; x++) { const f = FC[tile], x0 = x * T, y0 = y * TS; c.fillStyle = f[0]; c.fillRect(x0, y0, T, TS); c.strokeStyle = f[1]; c.lineWidth = 0.6;
  if (tile === 'plank') for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x0, y0 + k * TS / 4); c.lineTo(x0 + T, y0 + k * TS / 4); c.stroke(); }
  if (detail) BD.floor(c, tile, x0, y0, T, TS, x * 71 + y * 19); } }
c.font = '6px sans-serif';
const rows = [[0, 'logs'], [1, 'planks'], [2, 'wattle']];
rows.forEach(([m, name], r) => { wall(0.3, 3 + r * 2.4, m, 5, false); wall(6.3, 3 + r * 2.4, m, 5, true); c.fillStyle = '#1a1410'; c.fillText(name + ': before | after', 2, (3 + r * 2.4) * TS + 7); });
floorRun(0.3, 10.4, 'plank', 5, false); floorRun(6.3, 10.4, 'plank', 5, true); floorRun(0.3, 12.6, 'dirt', 5, false); floorRun(6.3, 12.6, 'dirt', 5, true);
c.fillStyle = '#1a1410'; c.fillText('plank floor, packed earth: before | after', 2, 10.2 * TS);
fs.writeFileSync('work/variation/variation_mock.png', cv.toBuffer('image/png')); console.log('wrote');
