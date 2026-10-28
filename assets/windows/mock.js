// mock.js: the new window by day (inside, the roof cut away, sunlight pools on the floor) and by night (outside, lit from within),
// drawn through the game's Build with BuildWindow over it (Colin, AD, 2026-10-28). Writes work/windows/windows_mock.png.
const GAME = 'C:/dev/SG/Game Developer';
const { createCanvas } = require(GAME + '/node_modules/@napi-rs/canvas'); const fs = require('fs');
const Build = require(GAME + '/src/build.js'), BW = require('./build_window.js');
const T = Build.T, TS = Build.TS, C = Build.cfg({}), h = C.wallH, th = C.thick, M = 1;   // planks
const Z = 3, PW = 240, PH = 200, cv = createCanvas(PW * 2 * Z, PH * Z), c = cv.getContext('2d');
function room(ox, night) {
  c.save(); c.translate(ox * Z, 0); c.scale(Z, Z); c.fillStyle = '#7f945c'; c.fillRect(0, 0, PW, PH);
  const W = Build.WALLS[M], X0 = 1, X1 = 6, Y0 = 3, Y1 = 7;
  if (!night) for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { c.fillStyle = '#a07a52'; c.fillRect(x * T, y * TS, T, TS); c.strokeStyle = '#5e4430'; c.lineWidth = 0.6; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x * T, y * TS + k * TS / 4); c.lineTo(x * T + T, y * TS + k * TS / 4); c.stroke(); } Build.detail.floor(c, 'plank', x * T, y * TS, T, TS, x * 71 + y * 19); }
  const back = night ? Y1 : Y0;
  for (let x = X0; x < X1; x++) { Build.drawH(c, x, back, { t: 'wall', m: M }, false, false, C); if (x === 2 || x === 4) BW.h(c, x * T, back * TS, h, W, x); }
  for (let y = Y0; y < Y1; y++) { [X0, X1].forEach(xx => { Build.drawV(c, xx, y, { t: 'wall', m: M }, false, y < Y1 - 1 ? { t: 'wall' } : null, C, xx === X0 ? -1 : 1); if (xx === X1 && y === Y0 + 1) BW.v(c, xx * T - th / 2, y * TS - h, th, TS, W, y); }); }
  if (!night) { [2, 4].forEach(x => BW.pool(c, x * T + 13, Y0 * TS + 2, 16, 40, 's', 1, 'day')); BW.pool(c, X1 * T - 3, (Y0 + 1) * TS + TS / 2, 12, 34, 'w', 0.9, 'day'); }
  else {
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgb(70,84,128)'; c.fillRect(0, 0, PW, PH); c.restore();
    [2, 4].forEach(x => BW.glowH(c, x * T, Y1 * TS, h, 1)); BW.glowV(c, X1 * T - th / 2, (Y0 + 1) * TS - h, th, TS, 1);
  }
  c.restore();
}
room(0, false); room(PW, true);
c.font = 'bold 30px sans-serif'; c.fillStyle = '#fff3d8'; c.strokeStyle = '#1a1410'; c.lineWidth = 5;
[['day, inside: sun on the floor', 12], ['night, outside: lit from within', PW * Z + 12]].forEach(([t, x]) => { c.strokeText(t, x, 40); c.fillText(t, x, 40); });
fs.writeFileSync('work/windows/windows_mock.png', cv.toBuffer('image/png')); console.log('wrote');
