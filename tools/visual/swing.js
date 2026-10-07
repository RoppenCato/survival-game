// Renders swing.png: the chop with the axe and the sword swing as sequences of eight frames in the side and front views,
// large, through the arena engine. Run from the project root:  node tools/visual/swing.js
const { createCanvas } = require('@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const G = require('../../src/art.js'), C = require('../../src/combat.js');
C.init(G.lib); C.S.sound = false; C.S.juice = true; C.api.scene = { noHud: true, noHotbar: true, begin: function (c) { c.fillStyle = '#8fa266'; c.fillRect(0, 0, 400, 250); }, items: function () {}, end: function () {} };
const D = C.dbg(), P = D.P, W = D.W; W.enemies.length = 0; W.pillars = [];
const cw = 70, ch = 80, PS = 5, N = 8, rows = [['axe', 'gather', 0, Math.PI, 'axe left'], ['axe', 'gather', 0, Math.PI / 2, 'axe down'], ['axe', 'gather', 0, -Math.PI / 2, 'axe up'], ['sword', 'fight', 0, Math.PI, 'sword left'], ['sword', 'fight', 0, Math.PI / 2, 'sword down']];
const cv = createCanvas(cw * N * 3 + 20, ch * rows.length * 3 + 20), c = cv.getContext('2d');
c.fillStyle = '#8fa266'; c.fillRect(0, 0, cv.width, cv.height);
function setMode(mode) { let g = 0; while (P.mode !== mode && g++ < 4) { C.key('KeyQ', true); C.update(0.016); C.key('KeyQ', false); C.update(0.016); } }
function snap(x, y) { const f = createCanvas(400 * PS, 250 * PS), fc = f.getContext('2d'); C.api.pixelScale = PS; C.render(fc); const sx = (P.x - cw / 2) * PS, sy = (P.y * 0.75 - ch * 0.72) * PS; c.drawImage(f, sx, sy, cw * PS, ch * PS, x, y, cw * 3, ch * 3); }
rows.forEach((row, ri) => {
  setMode(row[1]); if (row[1] === 'gather') P.tool = row[2];
  P.atk.ph = 'none'; P.atk.since = 9; P.atkBuf = 0; P.x = 200; P.y = 170; P.face = row[3]; P.faceVis = row[3]; P.inAng = null; P.st = 100; P.vx = P.vy = 0;
  C.key('KeyJ', true); C.update(0.016); C.key('KeyJ', false);
  let total = 0; const sd = []; let guard = 0;
  // the attack's full length: windup + active + recover
  const ph0 = P.atk; while (P.atk.ph === 'none' && guard++ < 50) C.update(0.01);
  const frames = []; let tt = 0; while (P.atk.ph !== 'none' && tt < 3) { frames.push(JSON.stringify([P.atk.ph, P.atk.t])); C.update(0.005); tt += 0.005; }
  // replay: eight evenly spaced moments of the attack
  const len = tt;
  for (let i = 0; i < N; i++) {
    P.atk.ph = 'none'; P.atk.since = 9; P.atkBuf = 0; P.x = 200; P.y = 170; P.face = row[3]; P.faceVis = row[3]; P.st = 100; P.vx = P.vy = 0;
    C.key('KeyJ', true); C.update(0.016); C.key('KeyJ', false); guard = 0; while (P.atk.ph === 'none' && guard++ < 50) C.update(0.01);
    const target = len * (i + 0.5) / N; let t2 = 0; while (t2 < target) { C.update(0.005); t2 += 0.005; }
    snap(10 + i * cw * 3, 10 + ri * ch * 3);
  }
  c.fillStyle = '#231a16'; c.font = '14px sans-serif'; c.fillText(row[4], 14, 10 + ri * ch * 3 + 16);
});
fs.writeFileSync('swing.png', cv.toBuffer('image/png')); console.log('wrote swing.png');
