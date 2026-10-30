// check.js: the final pieces assembled from the packed pictures and pier.json's own numbers (Colin, AD, 2026-10-30): the deck's variants on a long run, the hero on the head at several places, nets on the head's sides.
// Uses the assembly test's cached shores (work/pier3/bg). node work/pierfinal/check.js
const GAME = 'C:/dev/SG/Game Developer';
const { createCanvas, loadImage, GlobalFonts } = require(GAME + '/node_modules/@napi-rs/canvas'); const fs = require('fs');
GlobalFonts.registerFromPath(GAME + '/assets/fonts/alegreya-latin.woff2', 'Alegreya');
const D = 'out/pier_final/sheets/', J = JSON.parse(fs.readFileSync(D + 'pier.json', 'utf8')), BG = 'work/pier3/bg/', T = 32, K = 0.75, Z = 3, LIFT = J.deckLift * Z, s = 0.75;
const DIR = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
const SC = [
  { id: 'east', title: 'East: a long run with the variants; hero on the head by the barrel and by the rail; nets on the head\'s north and south sides', piers: [
    null, { i: 1, path: 'EEE', headNets: ['n', 's'], heroes: [['head', 0.1, -0.3], ['head', 0.72, 0.28]], nets: [[1, 's']] }, { i: 2, path: 'EN', headNets: ['e', 'w'], heroes: [['head', 0, 0.2]] }] },
  { id: 'south1', title: 'South: hero on the head behind the rail and north of the trestle; nets on the head\'s east and west sides', piers: [
    { i: 0, path: 'SS', headNets: ['e'], heroes: [['head', 0, 0.62]] }, { i: 1, path: 'SSS', headNets: ['e', 'w'], heroes: [['head', 0.3, -0.5], ['head', -0.45, 0.2]] }, null, { i: 3, path: 'SS' }] },
  { id: 'north1', title: 'North: the head from behind its rail, hero by the barrel, a net on its west side', piers: [
    null, { i: 1, path: 'NNN', headNets: ['w'], heroes: [['head', -0.5, 0.2], ['head', 0.2, -0.55]] }, null, null] },
];
const IM = {}; const pic = async n => IM[n] || (IM[n] = await loadImage(D + n + '.png'));
const VAR = [1, 2, 1, 3, 2, 4, 1, 5];
(async () => { const hero = await loadImage('work/hud/picker/hero.png'), panels = [];
  for (const sc of SC) { const info = JSON.parse(fs.readFileSync(BG + sc.id + '.json', 'utf8')), bg = await loadImage(BG + sc.id + '.png'), W = bg.width, H = bg.height, cv = createCanvas(W, H), c = cv.getContext('2d'); c.drawImage(bg, 0, 0);
    const SX = x => (x - info.at.x) * Z + W / 2, SY = y => (y - info.at.y) * K * Z + H / 2, items = [], shadows = [];
    const put = async (n, x, y) => { const m = J.pieces[n], im = await pic(n); c.drawImage(im, SX(x) - m.ax * s, SY(y) - m.ay * s, m.w * s, m.h * s); };
    sc.piers.forEach(pi => { if (!pi) return; const s0 = info.shores[pi.i], d0 = pi.path[0], dv = DIR[d0]; let tx = Math.floor(s0[0] / T) - dv[0] * 3, ty = Math.floor(s0[1] / T) - dv[1] * 3;
      const cells = new Map(), key = (a, b) => a + ',' + b, list = [], add = (a, b, run) => { const cl = { tx: a, ty: b, run }; cells.set(key(a, b), cl); list.push(cl); }; add(tx, ty, d0); list[0].landing = { E: 'w', W: 'e', N: 's', S: 'n' }[d0]; let prev = d0; for (const ch of pi.path) { tx += DIR[ch][0] * 2; ty += DIR[ch][1] * 2; add(tx, ty, ch); prev = ch; }
      const v = DIR[prev], ew = v[0] !== 0, cx = (tx + 1) * T + v[0] * 2 * T, cy = (ty + 1) * T + v[1] * 2 * T, name = prev.toLowerCase(), hp = J.pieces['head_' + name], rect = { x0: cx + hp.box[0], x1: cx + hp.box[2], y0: cy + hp.box[1], y1: cy + hp.box[3] };
      const occ = (a, b, dx, dy) => { if (cells.has(key(a + dx * 2, b + dy * 2))) return true; const px = (a + 1) * T + dx * (T + 2), py = (b + 1) * T + dy * (T + 2); return px > rect.x0 && px < rect.x1 && py > rect.y0 && py < rect.y1; };
      list.forEach((cl, ci) => { const wx = (cl.tx + 1) * T, wy = (cl.ty + 1) * T, run = cl.run === 'E' || cl.run === 'W' ? 'ew' : 'ns'; shadows.push([wx - T, wy - T, 2 * T, 2 * T]); items.push({ y: wy - T, f: async () => { if (cl.landing) return put('landing_' + cl.landing, wx, wy); if (!occ(cl.tx, cl.ty, 0, 1)) await put('wall_m', wx, wy + T); await put('deck_' + run + '_' + VAR[(ci * 3 + (cl.tx >> 1) + (cl.ty >> 1)) & 7], wx, wy); for (const [n, dx, dy] of [['n', 0, -1], ['s', 0, 1], ['e', 1, 0], ['w', -1, 0]]) if (!occ(cl.tx, cl.ty, dx, dy)) await put('kerb_' + n, wx, wy); } }); });
      shadows.push([rect.x0, rect.y0, rect.x1 - rect.x0, rect.y1 - rect.y0]); items.push({ y: rect.y0, f: async () => { await put(hp.wall, cx, rect.y1); await put('head_' + name, cx, cy); } }); items.push({ y: cy - 1, f: () => put('things_' + name + '_n', cx, cy) }); items.push({ y: rect.y1 - 1, f: () => put('things_' + name + '_s', cx, cy) });
      (pi.nets || []).forEach(([i, side]) => { const cl = list[i + 1], wx = (cl.tx + 1) * T, wy = (cl.ty + 1) * T, ex = side === 'e' ? T : side === 'w' ? -T : 0, ey = side === 's' ? T : side === 'n' ? -T : 0; items.push({ y: side === 's' ? wy + T + 0.5 : side === 'n' ? wy - T - 0.5 : wy - T + 0.5, f: () => put('net_' + side, wx + ex, wy + ey) }); });
      (pi.headNets || []).forEach(side => { const ex = side === 'e' ? rect.x1 : side === 'w' ? rect.x0 : cx, ey = side === 's' ? rect.y1 : side === 'n' ? rect.y0 : cy; items.push({ y: side === 's' ? rect.y1 + 0.5 : side === 'n' ? rect.y0 - 0.5 : rect.y0 + 0.5, f: () => put('net_' + side, ex, ey) }); });
      (pi.heroes || []).forEach(([wh, a, b]) => { const x = cx + a * (rect.x1 - rect.x0) / 2, y = cy + b * (rect.y1 - rect.y0) / 2; items.push({ y, f: async () => { const hs = 0.5, sx = SX(x), sy = SY(y) - LIFT, w_ = hero.width * hs, h_ = hero.height * hs; c.fillStyle = 'rgba(20,24,30,0.28)'; c.beginPath(); c.ellipse(sx, sy, 22, 7, 0, 0, 7); c.fill(); c.drawImage(hero, sx - w_ / 2, sy - h_ * 0.97, w_, h_); } }); });
    });
    shadows.forEach(([x, y, w, h]) => { c.fillStyle = 'rgba(14,32,48,0.3)'; c.fillRect(SX(x) + 7, SY(y) + 4, w * Z, h * K * Z); });
    items.sort((a, b) => a.y - b.y); for (const it of items) await it.f();
    c.font = 'bold 26px Alegreya'; c.lineWidth = 5; c.strokeStyle = '#1a1410'; c.strokeText(sc.title, 16, 34); c.fillStyle = '#f2e6c8'; c.fillText(sc.title, 16, 34); fs.writeFileSync('out/pier_final/check_' + sc.id + '.png', cv.toBuffer('image/png')); panels.push(cv); }
  // the pieces and icons on one sheet
  const names = Object.keys(J.pieces).filter(n => /^deck_ew|^deck_ns_3|landing_|^net_|mooring|coil|barrels|fish_rack|bench|float/.test(n)), b = createCanvas(1500, 760), g = b.getContext('2d'); g.fillStyle = '#7ab0b0'; g.fillRect(0, 0, 1500, 760); let x = 10, y = 10, rh = 0; for (const n of names) { const m = J.pieces[n], im = await pic(n), w = m.w * s, h = m.h * s; if (x + w > 1490) { x = 10; y += rh + 34; rh = 0; } g.drawImage(im, x, y, w, h); g.font = 'bold 14px Alegreya'; g.fillStyle = '#1a1410'; g.fillText(n, x, y + h + 16); x += Math.max(w, 90) + 16; rh = Math.max(rh, h); }
  y += rh + 44; x = 10; for (const f of fs.readdirSync('out/pier_final/icons')) { const im = await loadImage('out/pier_final/icons/' + f); g.fillStyle = '#2b1c13'; g.fillRect(x, y, 100, 100); g.drawImage(im, x, y, 100, 100); g.fillStyle = '#1a1410'; g.fillText(f.replace('.png', ''), x, y + 116); x += 116; }
  fs.writeFileSync('out/pier_final/pieces_and_icons.png', b.toBuffer('image/png')); console.log('checks', panels.length);
})();
