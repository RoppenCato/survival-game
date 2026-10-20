// The yard pieces big (2026-10-20, the studio, villages plan step 2): every fence kind as a run of six tiles across and four down,
// whole, with a gate shut and open, and the broken and burnt states, at four pixels a unit so the drawing can be judged.
// Run from this folder's root:  node tools/visual/fence_board.js   -> fence_board.png
const { createCanvas } = require('@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const Build = require('../../src/build.js');
const Z = 4, T = Build.T, TS = Build.TS, kinds = ['fence', 'rail', 'drystone', 'palisade', 'townwall'], W = 1400, H = 120 + kinds.length * 150;
const cv = createCanvas(W * Z, H * Z), c = cv.getContext('2d'); c.setTransform(Z, 0, 0, Z, 0, 0); c.fillStyle = '#7f945c'; c.fillRect(0, 0, W, H);
function run(kind, ox, oy, n, extra) {                 // a run across: n tiles of H edges at tile row oy
  for (let i = 0; i < n; i++) { const e = Object.assign({ t: kind, m: kind === 'drystone' ? 3 : kind === 'townwall' ? 6 : 2 }, extra && extra[i] || {}); Build.drawH(c, ox + i, oy, e, false, e.open, Build.CFG); }
}
function runV(kind, ox, oy, n, extra) {                // a run down: n tiles of V edges at tile column ox
  for (let j = 0; j < n; j++) { const e = Object.assign({ t: kind, m: kind === 'drystone' ? 3 : kind === 'townwall' ? 6 : 2 }, extra && extra[j] || {}); const more = j < n - 1 ? { t: kind } : null; Build.drawV(c, ox, oy + j, e, false, more, Build.CFG, -1); }
}
c.fillStyle = '#231a16'; c.font = 'bold 9px sans-serif';
kinds.forEach((k, r) => {
  const y = 40 + r * 150; c.fillText(k, 8, y - 26);
  c.save(); c.translate(0, y); run(k, 1, 0, 6); c.restore();                                                      // whole, across
  c.save(); c.translate(260, y - 60); runV(k, 1, 0, 4); c.restore();                                              // whole, down
  if (k !== 'townwall' && k !== 'drystone') { c.save(); c.translate(320, y); run('gate', 1, 0, 1, [{ m: 2 }]); c.fillText('shut', 320 + 34, y - 36); c.restore(); c.save(); c.translate(380, y); run('gate', 1, 0, 1, [{ m: 2, open: true }]); c.fillText('open', 380 + 34, y - 36); c.restore(); }
  c.save(); c.translate(460, y); run(k, 1, 0, 4, [{}, { breach: true }, {}, { breach: true, burnt: true }]); c.fillText('a stake down; burnt', 460 + 34, y - 36); c.restore();
  c.save(); c.translate(660, y); run(k, 1, 0, 4, [{ scorch: true }, { scorch: true }, { burnt: true }, { burnt: true }]); c.fillText('scorched; charred', 660 + 34, y - 36); c.restore();
});
fs.writeFileSync('fence_board.png', cv.toBuffer('image/png')); console.log('wrote fence_board.png', cv.width, cv.height);
