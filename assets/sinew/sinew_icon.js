// sinew_icon.js: the bag icon for sinew (Colin, AD, 2026-10-28; Clive, GD: a boar gives sinew for the bowstring). A hank of dried sinew cord,
// coiled in three loose loops with its twisted tail out to the right, pale translucent amber; laid flat across the frame as the other
// material icons are, for the game to turn across the slot. Drawn at four times and scaled down. Writes work/sinew/sinew.png (160 by 160).
const GAME = 'C:/dev/SG/Game Developer';
const { createCanvas, loadImage } = require(GAME + '/node_modules/@napi-rs/canvas'); const fs = require('fs');
const S = 4, N = 160, cv = createCanvas(N * S, N * S), c = cv.getContext('2d'); c.scale(S, S); c.translate(80, 82); c.scale(1.08, 1.08); c.translate(-90, -86);   // (filling the frame as the others do)
const INK = '#3a2614', DARK = '#a8753c', MID = '#d6a663', LIT = '#f2d9a4';
function cord(pts, w) {                       // a twisted cord along a path: ink, body, a lit edge, and the twist's slant marks
  const path = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); };
  c.lineCap = 'round'; c.lineJoin = 'round';
  path(); c.strokeStyle = INK; c.lineWidth = w + 2.4; c.stroke();
  path(); c.strokeStyle = MID; c.lineWidth = w; c.stroke();
  c.save(); c.translate(-w * 0.18, -w * 0.22); path(); c.strokeStyle = LIT; c.lineWidth = w * 0.32; c.globalAlpha = 0.85; c.stroke(); c.restore();
  for (let i = 2; i < pts.length - 1; i += 2) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i + 1], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, [x, y] = pts[i];
    c.strokeStyle = DARK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x + nx * w * 0.45 - dx / L * w * 0.25, y + ny * w * 0.45 - dy / L * w * 0.25); c.lineTo(x - nx * w * 0.45 + dx / L * w * 0.25, y - ny * w * 0.45 + dy / L * w * 0.25); c.stroke(); }
}
const loops = [];
for (let k = 0; k < 3; k++) { const pts = [], cx = 66 + k * 5, cy = 82 - k * 2, rx = 40 - k * 3, ry = 22 - k * 1.5, a0 = 0.3 * k;
  for (let t = 0; t <= 64; t++) { const a = a0 + t / 64 * Math.PI * 2; pts.push([cx + Math.cos(a) * rx + Math.sin(a * 3 + k) * 1.2, cy + Math.sin(a) * ry + Math.cos(a * 2 + k) * 1.0]); } loops.push(pts); }
c.fillStyle = 'rgba(20,12,6,0.28)'; c.beginPath(); c.ellipse(76, 104, 60, 13, 0, 0, 7); c.fill();          // a soft shadow under it
loops.forEach(p => cord(p, 6.2));
const wrap = [[100, 70], [106, 92]]; c.lineCap = 'butt'; [[INK, 11], [DARK, 8.5]].forEach(([col, w]) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(...wrap[0]); c.lineTo(...wrap[1]); c.stroke(); });   // a turn bound round the hank
c.strokeStyle = MID; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(97 + i * 0.6, 72 + i * 5); c.lineTo(108 + i * 0.6, 74 + i * 5); c.stroke(); }
const tail = []; for (let t = 0; t <= 20; t++) { const u = t / 20; tail.push([104 + u * 44, 90 + Math.sin(u * 5) * 4 + u * 8]); } cord(tail, 5.2);   // the tail, twisted
c.strokeStyle = LIT; c.lineWidth = 1.1; c.lineCap = 'round'; [[148, 98, 155, 95], [148, 98, 156, 101], [148, 98, 154, 104]].forEach(([a, b, x, y]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); });   // its frayed end
const out = createCanvas(N, N), o = out.getContext('2d'); o.imageSmoothingQuality = 'high'; o.drawImage(cv, 0, 0, N, N);
fs.writeFileSync('work/sinew/sinew.png', out.toBuffer('image/png'));
(async () => { const sh = createCanvas(800, 200), g = sh.getContext('2d'); g.fillStyle = '#2b1c13'; g.fillRect(0, 0, 800, 200); let x = 0;
  for (const n of ['antler', 'fiber', 'hide', 'leather']) { g.drawImage(await loadImage(GAME + '/assets/sprites/icons/' + n + '.png'), x, 20); x += 160; } g.drawImage(out, x, 20);
  g.save(); g.translate(720, 100); g.restore(); fs.writeFileSync('work/sinew/sinew_beside.png', sh.toBuffer('image/png')); console.log('wrote'); })();
