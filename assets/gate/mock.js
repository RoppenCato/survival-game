// mock.js: the gate at six angles, shut and open, between the studio's railPost and stake pieces (Colin, AD, 2026-10-28). Writes work/gate/gate_mock.png.
const GAME = 'C:/dev/SG/Game Developer';
const { createCanvas, loadImage } = require(GAME + '/node_modules/@napi-rs/canvas'); const fs = require('fs');
const BG = require('./build_gate.js'), META = require(GAME + '/assets/props/fences/fences.json'), K = 0.75, Z = 4;
(async () => {
  const img = {}; for (const n of ['railPost_1', 'railPost_2', 'stake_1', 'stake_3']) img[n] = await loadImage(GAME + '/assets/props/fences/' + n + '.png');
  const W = 330, H = 150, cv = createCanvas(W * Z, H * 2 * Z), c = cv.getContext('2d'); c.scale(Z, Z); c.fillStyle = '#86a05e'; c.fillRect(0, 0, W, H * 2);
  const post = (n, x, y) => { const m = META[n], s = m.upp; c.drawImage(img[n], x - m.ax * s, y * K - m.ay * s, m.w * s, m.h * s); };
  const rail = (a, b) => [[0.42], [0.78]].forEach(([k]) => { const h = 20; c.strokeStyle = '#2a2018'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(a[0], a[1] * K - h * k); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 * K - h * k + 3, b[0], b[1] * K - h * k); c.stroke(); c.strokeStyle = '#7d634a'; c.lineWidth = 2.2; c.stroke(); });
  const angles = [0, 25, 55, 90, -35, -70];
  for (let row = 0; row < 2; row++) for (let i = 0; i < 6; i++) {
    const kind = i < 4 ? 'rail' : 'stake', open = row, cx = 30 + i * 52, cy = (row * H + 80) / K, ang = angles[i] * Math.PI / 180, L = 34;
    const a = [cx - Math.cos(ang) * L / 2, cy - Math.sin(ang) * L / 2], b = [cx + Math.cos(ang) * L / 2, cy + Math.sin(ang) * L / 2];
    const pa = [a[0] - Math.cos(ang) * 30, a[1] - Math.sin(ang) * 30], pb = [b[0] + Math.cos(ang) * 30, b[1] + Math.sin(ang) * 30];
    const pn = kind === 'rail' ? ['railPost_1', 'railPost_2'] : ['stake_1', 'stake_3'];
    const items = [{ y: pa[1], f: () => post(pn[0], pa[0], pa[1]) }, { y: pb[1], f: () => post(pn[1], pb[0], pb[1]) }, { y: a[1], f: () => post(pn[1], a[0], a[1]) }, { y: b[1], f: () => post(pn[0], b[0], b[1]) },
      { y: Math.max(a[1], b[1]) + (open ? 6 : -0.5), f: () => BG.draw(c, a, b, open, { K, kind, seed: i }) }];
    if (kind === 'rail') { items.push({ y: Math.max(pa[1], a[1]) - 0.5, f: () => rail(pa, a) }); items.push({ y: Math.max(b[1], pb[1]) - 0.5, f: () => rail(b, pb) }); }
    items.sort((p, q) => p.y - q.y).forEach(it => it.f());
  }
  c.font = 'bold 7px sans-serif'; c.fillStyle = '#fff3d8'; c.strokeStyle = '#1a1410'; c.lineWidth = 2;
  [['shut: rail gates at 0, 25, 55, 90 degrees, hurdle gates in stake fences', 6, 12], ['open: swung about the left post, toward you', 6, H + 12]].forEach(([t, x, y]) => { c.strokeText(t, x, y); c.fillText(t, x, y); });
  fs.writeFileSync('work/gate/gate_mock.png', cv.toBuffer('image/png')); console.log('wrote');
})();
