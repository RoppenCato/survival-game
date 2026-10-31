// board2.js: the hearth in three lengths, each bare, with a pot on a trivet, with the timber and an empty hook, with the timber and the kettle; the layers drawn as the game would: hearth, flames, then what stands over it (Colin, AD, 2026-10-31).
//   node work/indoorfire/board2.js    packs out/indoor_fire_round2/sheets and writes the board
const GAME = 'C:/dev/SG/Game Developer';
const { createCanvas, loadImage, GlobalFonts } = require(GAME + '/node_modules/@napi-rs/canvas'); const fs = require('fs');
global.__mk = (w, h) => createCanvas(w, h);
const Build = require(GAME + '/src/build.js');
GlobalFonts.registerFromPath(GAME + '/assets/fonts/alegreya-latin.woff2', 'Alegreya');
const R = 'work/indoorfire/render2/', OUT = 'out/indoor_fire_round2/', SH = OUT + 'sheets/'; fs.mkdirSync(SH, { recursive: true });
const M = JSON.parse(fs.readFileSync(R + 'meta.json', 'utf8')), T = Build.T, TS = Build.TS, C = Build.cfg({}), Z = 3, RW = 7, RH = 4, PW = RW * T + 4, PH = (RH + 2) * TS;
const box = (g, w, h) => { const d = g.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 3) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; };
const half = async f => { const im = await loadImage(f), w = Math.ceil(im.width / 2), h = Math.ceil(im.height / 2), c = createCanvas(w, h), g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, w, h); return { c, g, w, h }; };
function crop(p, b) { const w = b[2] - b[0] + 1, h = b[3] - b[1] + 1, o = createCanvas(w, h); o.getContext('2d').drawImage(p.c, -b[0], -b[1]); return o; }
const J = {}, IM = {}; let bytes = 0;
const put = (n, cv) => { const b = cv.toBuffer('image/png'); fs.writeFileSync(SH + n, b); bytes += b.length; };
async function pack() {
  for (const n of Object.keys(M)) { const m = M[n], ax = m.anchor.x / 2, ay = m.anchor.y / 2;
    const p = await half(R + n + '_base.png'), b = box(p.g, p.w, p.h), cb = crop(p, b); put(n + '.png', cb);
    J[n] = { w: cb.width, h: cb.height, ax: +(ax - b[0]).toFixed(1), ay: +(ay - b[1]).toFixed(1), upp: 0.25 }; IM[n] = { base: cb };
    if (m.only_base) continue;
    const e = await half(R + n + '_embers.png'), eb = box(e.g, e.w, e.h), ec = crop(e, eb); put(n + '_embers.png', ec); IM[n].embers = ec; J[n].embers = { w: ec.width, h: ec.height, ax: +(ax - eb[0]).toFixed(1), ay: +(ay - eb[1]).toFixed(1) };
    const fr = []; let u = [1e9, 1e9, -1, -1]; for (let i = 0; i < 10; i++) { const f = await half(R + n + '_flames_' + String(i).padStart(2, '0') + '.png'), q = box(f.g, f.w, f.h); fr.push(f); u = [Math.min(u[0], q[0]), Math.min(u[1], q[1]), Math.max(u[2], q[2]), Math.max(u[3], q[3])]; }
    const fw = u[2] - u[0] + 1, fh = u[3] - u[1] + 1, sh = createCanvas(fw * 10, fh), sg = sh.getContext('2d'); IM[n].fr = fr.map((f, i) => { const o = crop(f, u); sg.drawImage(o, i * fw, 0); return o; }); put(n + '_flames.png', sh);
    J[n].flames = { file: n + '_flames.png', frames: 10, fps: 12, w: fw, h: fh, ax: +(ax - u[0]).toFixed(1), ay: +(ay - u[1]).toFixed(1) }; }
  fs.writeFileSync(SH + 'indoor_fires.json', JSON.stringify(J, null, 1));
}
function floor(g, y0) { for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) { g.fillStyle = '#a07a52'; g.fillRect(x * T, y0 + y * TS, T, TS); g.strokeStyle = '#5e4430'; g.lineWidth = 0.6; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x * T, y0 + y * TS + k * TS / 4); g.lineTo(x * T + T, y0 + y * TS + k * TS / 4); g.stroke(); } } }
function glow(g, x, y, r, a) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, 'rgba(255,170,90,' + a + ')'); gr.addColorStop(0.4, 'rgba(230,120,55,' + a * 0.48 + ')'); gr.addColorStop(1, 'rgba(120,50,20,0)'); g.fillStyle = gr; g.translate(x, y); g.scale(1, 0.72); g.translate(-x, -y); g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
function smoke(g, x, y, day) { for (let i = 0; i < 6; i++) { const u = i / 6, px = x + Math.sin(i * 1.7) * 1.8 + u * 2, py = y - 16 - u * 36, r = 1.6 + u * 4; g.fillStyle = (day ? 'rgba(226,222,214,' : 'rgba(150,150,165,') + ((1 - u) * (day ? 0.28 : 0.22)).toFixed(3) + ')'; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill(); } }
const K = 0.25, at = (g, im, j, x, y) => g.drawImage(im, x - j.ax * K, y - j.ay * K, im.width * K * 1, im.height * K * 1);
function cell(g, ox, oy, tx, over, night, frame, hero) {
  const y0 = 2 * TS; g.save(); g.translate(ox, oy); g.beginPath(); g.rect(0, 0, PW - 4, PH); g.clip(); g.fillStyle = '#2b2118'; g.fillRect(0, 0, PW, PH); floor(g, y0);
  g.save(); g.translate(0, y0); for (let x = 0; x < RW; x++) Build.drawH(g, x, 0, { t: 'wall', m: 1 }, false, false, C); g.restore();
  const cx = RW / 2 * T, cy = y0 + RH / 2 * TS, h = 'hearth' + tx, S = 0.25;
  const pic = (im, j) => g.drawImage(im, cx - j.ax * S, cy - j.ay * S, im.width * S, im.height * S);
  const all = () => { pic(IM[h].base, J[h]); pic(IM[h].fr[frame], J[h].flames); if (over) pic(IM[over + tx].base, J[over + tx]); };
  const hx = cx - (tx * T / 2 + 13), hy = cy + 20, hw = hero.width / 6, hh = hero.height / 6; all(); g.drawImage(hero, hx - hw / 2, hy - hh * 0.97, hw, hh);
  if (!night) smoke(g, cx, cy, true);
  else { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(70,84,128)'; g.fillRect(0, 0, PW, PH); g.restore(); (tx === 4 ? [-0.5, 0, 0.5] : [0]).forEach(k => glow(g, cx + k * 36, cy, tx === 4 ? 60 : 72, tx === 4 ? 0.34 : 0.75)); pic(IM[h].fr[frame], J[h].flames); if (over) { g.globalAlpha = 0.5; pic(IM[over + tx].base, J[over + tx]); g.globalAlpha = 1; } smoke(g, cx, cy, false); }
  g.restore();
}
(async () => { await pack(); const hero = await loadImage('work/hud/picker/hero.png');
  const COL = [[null, 'A: bare, no pot'], ['trivet', 'A: a pot on a trivet'], ['hook', 'C: timber, empty hook'], ['kettle', 'C: timber and kettle']], ROW = [[4, 'Great hall, 4 by 1 tiles'], [2, 'House or hall, 2 by 1 tiles'], [1, 'One-room house, 1 by 1 tile']];
  const CH = PH + 20, W = PW * 4 * Z, H = (20 + CH * 4 + 4) * Z, cv = createCanvas(W, H), g = cv.getContext('2d'); g.fillStyle = '#1a1410'; g.fillRect(0, 0, W, H); g.scale(Z, Z); g.font = 'bold 14px Alegreya'; g.fillStyle = '#f2e6c8';
  COL.forEach((c, i) => g.fillText(c[1], i * PW + 6, 15));
  ROW.forEach((r, j) => { const oy = 20 + j * CH; g.fillStyle = '#f2e6c8'; g.fillText(r[1], 6, oy + 14); COL.forEach((c, i) => cell(g, i * PW, oy + 19, r[0], c[0], false, (i * 3 + j) % 10, hero)); });
  const oy = 20 + 3 * CH; g.fillStyle = '#f2e6c8'; g.fillText('At night, 2 by 1 tiles', 6, oy + 14); COL.forEach((c, i) => cell(g, i * PW, oy + 19, 2, c[0], true, (i * 3) % 10, hero));
  fs.writeFileSync(OUT + 'indoor_fire_round2.png', cv.toBuffer('image/png')); console.log('board', W, H, 'sheets kB', Math.round(bytes / 1024)); console.log(Object.keys(J).map(n => n + ' ' + J[n].w + 'x' + J[n].h).join(', '));
})();
