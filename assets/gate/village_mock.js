// village_mock.js: generated farmyards' fences with the new gates in their gaps, posts and rails as the game draws them (Colin, AD, 2026-10-28).
const GAME = 'C:/dev/SG/Game Developer';
const { createCanvas, loadImage } = require(GAME + '/node_modules/@napi-rs/canvas'); const fs = require('fs');
const Vg = require(GAME + '/src/village.js'), BG = require('./build_gate.js'), META = require(GAME + '/assets/props/fences/fences.json'), K = 0.75, Z = 2.5;
(async () => {
  const img = {}; for (const n of ['railPost_1', 'railPost_2', 'railPost_3']) img[n] = await loadImage(GAME + '/assets/props/fences/' + n + '.png');
  const picks = []; for (const arch of ['farmstead', 'small', 'village']) for (let s = 1; s < 6 && picks.length < 2; s++) { const site = Vg.siteFor(arch), V = Vg.make(s * 97, { tx: 20, ty: 20, w: site.w, h: site.h, shore: null }, { arch, wealth: 0.6, biome: 0 }); V.fences.forEach((F, fi) => { if (F.gates.length && picks.length < 2 && !picks.some(p => p.V === V)) picks.push({ V, F, fi, open: picks.length }); }); }
  const outs = [];
  for (const P of picks) {
    const posts = P.V.props.filter(p => p.name === 'railPost' && p.fence === P.fi); const xs = posts.map(p => p.x), ys = posts.map(p => p.y * K);
    const x0 = Math.min(...xs) - 30, x1 = Math.max(...xs) + 30, y0 = Math.min(...ys) - 40, y1 = Math.max(...ys) + 90, W = x1 - x0, H = y1 - y0;
    const cv = createCanvas(Math.round(W * Z), Math.round(H * Z)), c = cv.getContext('2d'); c.scale(Z, Z); c.translate(-x0, -y0); c.fillStyle = '#86a05e'; c.fillRect(x0, y0, W, H);
    const items = []; posts.forEach(p => items.push({ y: p.y, f: () => { const n = 'railPost_' + (1 + (p.v || 0)), m = META[n], s = m.upp; c.drawImage(img[n], p.x - m.ax * s, p.y * K - m.ay * s, m.w * s, m.h * s); } }));
    const by = {}; posts.forEach(p => (by[p.run] = by[p.run] || []).push(p)); Object.values(by).forEach(L => { L.sort((a, b) => a.i - b.i); for (let j = 0; j + 1 < L.length; j++) { const a = L[j], b = L[j + 1]; if (b.i !== a.i + 1 || Math.hypot(b.x - a.x, b.y - a.y) > 60) continue; items.push({ y: Math.max(a.y, b.y) - 0.5, f: () => [0.42, 0.78].forEach(k => { const h = 20; c.strokeStyle = '#2a2018'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(a.x, a.y * K - h * k); c.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 * K - h * k + 3, b.x, b.y * K - h * k); c.stroke(); c.strokeStyle = '#7d634a'; c.lineWidth = 2.2; c.stroke(); }) }); } });
    P.F.gates.forEach((g, gi) => { const op = P.open ? 1 : 0; if (g.double) { const m = [(g.a[0] + g.b[0]) / 2, (g.a[1] + g.b[1]) / 2]; items.push({ y: Math.max(g.a[1], m[1]) + (op ? 6 : -0.5), f: () => BG.draw(c, g.a, m, op, { K, seed: gi }) }); items.push({ y: Math.max(g.b[1], m[1]) + (op ? 6 : -0.5), f: () => BG.draw(c, g.b, m, op, { K, seed: gi + 7 }) }); } else items.push({ y: Math.max(g.a[1], g.b[1]) + (op ? 6 : -0.5), f: () => BG.draw(c, g.a, g.b, op, { K, seed: gi }) }); });
    items.sort((p, q) => p.y - q.y).forEach(it => it.f()); outs.push(cv);
  }
  const W = outs.reduce((s, o) => s + o.width + 20, 0), H = Math.max(...outs.map(o => o.height)) + 50, cv = createCanvas(W, H), c = cv.getContext('2d'); c.fillStyle = '#86a05e'; c.fillRect(0, 0, W, H);
  let x = 0; outs.forEach((o, i) => { c.drawImage(o, x, 50); c.font = 'bold 22px sans-serif'; c.fillStyle = '#fff3d8'; c.strokeStyle = '#1a1410'; c.lineWidth = 4; const t = i ? 'a farmyard, its gate open' : 'a farmyard, its gate shut'; c.strokeText(t, x + 10, 32); c.fillText(t, x + 10, 32); x += o.width + 20; });
  fs.writeFileSync('work/gate/gate_village.png', cv.toBuffer('image/png')); console.log('wrote', picks.length);
})();
