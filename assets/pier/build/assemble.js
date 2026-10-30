// assemble.js: the pier assembly test (Colin, AD, 2026-10-30; Robin: "try variations of building piers, so it doesnt clip and looks weird"). Real piers from the separate pieces
// (work/pier3/render), drawn in depth order as the game would draw them, on the game's own painted shores at 3 px a unit, the hero on the deck and in the water before and behind.
// The rule for the order: a deck, its kerbs and wall sort at the module's NORTH edge (so the hero on it, or in front, draws after; the hero behind it draws before and its raised deck
// covers his lower part); a head's things sort at the middle and at its south edge; the hero at his feet. On the deck he is lifted by LIFT.
//   node work/pier3/assemble.js          (paints and caches the shores in work/pier3/bg the first time)
const GAME = 'C:/dev/SG/Game Developer';
const { createCanvas, loadImage, GlobalFonts } = require(GAME + '/node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h);
GlobalFonts.registerFromPath(GAME + '/assets/fonts/alegreya-latin.woff2', 'Alegreya');
const R = 'work/pier3/render/', BG = 'work/pier3/bg/', M = JSON.parse(fs.readFileSync(R + 'meta.json', 'utf8')), T = 32, K = 0.75, Z3 = 3, S = 0.375;
const LIFT = 0.72 * Math.cos(Math.asin(0.75)) * (39 / 1.8) * 3;   // the deck's height on screen, px
fs.mkdirSync(BG, { recursive: true });
const DIR = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };   // in the world: y runs south
// the scenes: the way the water lies, and the piers along that shore. perp: tiles along the shore from the scene's middle; inland: pieces on the sand (1 or 2); path: moves after the first piece, in modules
const SCENES = [
  { id: 'south1', water: 'S', w: 2800, h: 1150, title: 'SHORE TO THE NORTH, piers running south: short, straight with nets, two side by side', piers: [
    { perp: -12, inland: 1, path: 'SS' }, { perp: -2, inland: 1, path: 'SSS', nets: [[2, 'e'], [3, 'w']], heroes: [['deck', 2], ['water_e', 3]] }, { perp: 6, inland: 1, path: 'SSS' }, { perp: 11, inland: 2, path: 'SS', heroes: [['water_w', 3]] }] },
  { id: 'south2', water: 'S', w: 2800, h: 1250, title: 'SHORE TO THE NORTH: L to the west, a T, each with the head on the bend', piers: [
    { perp: -12, inland: 1, path: 'SSS', branch: { at: 2, path: 'EE' } }, { perp: 6, inland: 1, path: 'SSSWW', heroes: [['water_n', 5]] }] },
  { id: 'north1', water: 'N', w: 2800, h: 1300, title: 'SHORE TO THE SOUTH, piers running north: short, long, two side by side', piers: [
    { perp: -12, inland: 1, path: 'N' }, { perp: -2, inland: 1, path: 'NNN', nets: [[2, 'e'], [2, 'w']], heroes: [['deck', 2], ['water_e', 1]] }, { perp: 6, inland: 2, path: 'NN' }, { perp: 11, inland: 1, path: 'NN', heroes: [['water_w', 2]] }] },
  { id: 'north2', water: 'N', w: 2800, h: 1300, title: 'SHORE TO THE SOUTH: L to the west, a T', piers: [
    { perp: 2, inland: 1, path: 'NNNWW', heroes: [['water_s', 4]], nets: [[4, 's']] }, { perp: 7, inland: 1, path: 'NNN', branch: { at: 2, path: 'EE' } }] },
  { id: 'east', water: 'E', w: 1900, h: 1650, title: 'SHORE TO THE WEST, piers running east: short, long with a net on the south and on the north, L north, L south', piers: [
    { perp: -10, inland: 1, path: 'E' }, { perp: -2, inland: 1, path: 'EEE', nets: [[2, 's'], [3, 'n']], heroes: [['deck', 1], ['water_n', 2], ['water_s', 3]] }, { perp: 10, inland: 2, path: 'EN' }] },
  { id: 'west', water: 'W', w: 1900, h: 1650, title: 'SHORE TO THE EAST, piers running west: straight, L south, a T', piers: [
    { perp: -10, inland: 1, path: 'WW', heroes: [['deck', 1]] }, { perp: -3, inland: 2, path: 'WS', heroes: [['water_s', 2]] }, { perp: 8, inland: 1, path: 'WW', branch: { at: 1, path: 'SS' } }] },
  { id: 'south3', water: 'S', w: 2800, h: 1250, title: 'SHORE TO THE NORTH: L to the east, a net on its south, the hero in front', piers: [ { perp: -2, inland: 1, path: 'SSSEE', heroes: [['water_s', 5]], nets: [[5, 's']] } ] },
  { id: 'north3', water: 'N', w: 2800, h: 1300, title: 'SHORE TO THE SOUTH: L to the east, the hero behind it', piers: [ { perp: 0, inland: 1, path: 'NNNEE', heroes: [['water_n', 5]] } ] },
  { id: 'diag', water: 'E', diag: true, w: 1900, h: 1100, title: 'A DIAGONAL SHORE: one piece on the sand, the shore cutting across the pieces', piers: [
    { perp: -5, inland: 1, path: 'EE' }, { perp: 3, inland: 1, path: 'E', heroes: [['deck', 0]] }] },
];
async function cacheShores() {
  const need = SCENES.filter(s => !fs.existsSync(BG + s.id + '.json')); if (!need.length) return;
  const St = require(GAME + '/src/stylelab.js'), World = require(GAME + '/src/world.js'), DI = require(GAME + '/tools/visual/dayisland.js'), kit = St.kit; kit.setup(kit.STYLE); if (DI.load) await DI.load(World); const w = DI.make(kit, World, 11);
  const land = (x, y) => w.isLand(x, y);
  for (const sc of need) {
    const d = DIR[sc.water], p = [-d[1], d[0]], c = []; const hw = (sc.w / 3 / 2) * 0.9;
    for (let y = w.home.y - 1500; y < w.home.y + 1500; y += 30) for (let x = w.home.x - 1800; x < w.home.x + 1800; x += 30) {
      if (!land(x, y) || land(x + d[0] * 30, y + d[1] * 30)) continue; let ok = true;
      for (let q = 30; q < 300 && ok; q += 30) for (const o of sc.diag ? [0] : [-1, -0.5, 0, 0.5, 1]) if (land(x + d[0] * q + p[0] * o * (d[0] ? 110 : hw) * 0.8 + (sc.diag ? 0 : 0), y + d[1] * q + p[1] * o * (d[0] ? 110 : hw) * 0.8)) { ok = false; break; }
      for (let q = 6; q < 90 && ok; q += 20) if (!land(x - d[0] * q, y - d[1] * q)) ok = false;
      if (sc.diag && ok) { const a = land(x + 60, y - 70), b = land(x + 60, y + 70); if (a === b) ok = false; }
      if (ok) c.push([x, y]);
    }
    const q = c[c.length >> 1] || [w.home.x, w.home.y]; const ov = { E: [0.27, 0], W: [-0.27, 0], N: [0, -0.36], S: [0, 0.12] }[sc.water], at = { x: q[0] + ov[0] * sc.w / 3, y: q[1] + ov[1] * sc.h / 3 / K };
    const r = DI.paint(kit, World, sc.w, sc.h, Z3, { world: w, at }); fs.writeFileSync(BG + sc.id + '.png', r.cv.toBuffer('image/png'));
    const shores = sc.piers.map(pi => { let x = q[0] + p[0] * pi.perp * T, y = q[1] + p[1] * pi.perp * T, g = 0; while (!land(x, y) && g++ < 40) { x -= d[0] * 16; y -= d[1] * 16; } g = 0; while (land(x + d[0] * 16, y + d[1] * 16) && g++ < 60) { x += d[0] * 16; y += d[1] * 16; } return [x, y]; });
    fs.writeFileSync(BG + sc.id + '.json', JSON.stringify({ at, shores, q, found: c.length })); console.log('painted', sc.id, c.length);
  }
}
const IM = {}; async function pic(n) { return IM[n] || (IM[n] = await loadImage(R + n + '.png')); }
async function drawPiece(c, name, sx, sy) { const m = M[name], im = await pic(name); c.drawImage(im, sx - m.ax * S, sy - m.ay * S, m.size * S, m.size * S); }
(async () => {
  await cacheShores();
  const hero = await loadImage('work/hud/picker/hero.png'); const panels = [];
  for (const sc of SCENES) {
    const info = JSON.parse(fs.readFileSync(BG + sc.id + '.json', 'utf8')), bg = await loadImage(BG + sc.id + '.png'), cv = createCanvas(sc.w, sc.h), c = cv.getContext('2d'); c.drawImage(bg, 0, 0);
    const smp = createCanvas(sc.w, sc.h), sg = smp.getContext('2d'); sg.drawImage(bg, 0, 0); const px = sg.getImageData(0, 0, sc.w, sc.h).data, isWater = (sx, sy) => { const i = ((Math.max(0, Math.min(sc.h - 1, sy | 0))) * sc.w + Math.max(0, Math.min(sc.w - 1, sx | 0))) * 4; return px[i + 2] > px[i] + 15; };
    const SX = x => (x - info.at.x) * Z3 + sc.w / 2, SY = y => (y - info.at.y) * K * Z3 + sc.h / 2, items = [], shadows = [], foam = [];
    sc.piers.forEach((pi, n) => {
      const s0 = info.shores[n], d0 = pi.path[0]; const dv = DIR[d0]; let tx = Math.floor(s0[0] / T), ty = Math.floor(s0[1] / T); tx -= dv[0] * (pi.inland * 2 + 1); ty -= dv[1] * (pi.inland * 2 + 1);
      const cells = new Map(), key = (a, b) => a + ',' + b, list = []; const add = (a, b, run) => { const cl = { tx: a, ty: b, run }; cells.set(key(a, b), cl); list.push(cl); return cl; };
      const land = add(tx, ty, d0); land.landing = { E: 'w', W: 'e', N: 's', S: 'n' }[d0];
      for (let i = 1; i < pi.inland; i++) { tx += dv[0] * 2; ty += dv[1] * 2; add(tx, ty, d0); }
      const heads = []; const walk = (path, a, b) => { let prev = null; for (const ch of path) { const v = DIR[ch]; a += v[0] * 2; b += v[1] * 2; add(a, b, ch); prev = ch; } heads.push({ a, b, dir: prev }); };
      tx += 0; walk(pi.path, tx, ty); if (pi.branch) { const cl = list[pi.inland + pi.branch.at - 1]; walk(pi.branch.path, cl.tx, cl.ty); }
      const headRects = heads.map(h => { const v = DIR[h.dir], ew = v[0] !== 0, cx = (h.a + 1) * T + v[0] * 2 * T, cy = (h.b + 1) * T + v[1] * 2 * T, w2 = (ew ? 2 : 3) * T / 2, d2 = (ew ? 3 : 2) * T / 2; return { h, cx, cy, x0: cx - w2, x1: cx + w2, y0: cy - d2, y1: cy + d2, ew, name: h.dir.toLowerCase() }; });
      const occ = (a, b, dx, dy) => { if (cells.has(key(a + dx * 2, b + dy * 2))) return true; const px_ = (a + 1) * T + dx * (T + 2), py_ = (b + 1) * T + dy * (T + 2); return headRects.some(r => px_ > r.x0 && px_ < r.x1 && py_ > r.y0 && py_ < r.y1); };
      list.forEach((cl, i) => { const wx = (cl.tx + 1) * T, wy = (cl.ty + 1) * T, sx = SX(wx), sy = SY(wy), hw = T * Z3, hd = T * K * Z3; if (!cl.landing) shadows.push([sx - hw, sy - hd, hw * 2, hd * 2]);
        items.push({ y: wy - T, f: async () => {
          if (cl.landing) { await drawPiece(c, 'landing_' + cl.landing, sx, sy); return; }
          if (!occ(cl.tx, cl.ty, 0, 1)) await drawPiece(c, 'wall_m', sx, sy + hd);
          await drawPiece(c, 'deck_' + (cl.run === 'E' || cl.run === 'W' ? 'ew' : 'ns') + '_' + (1 + (cl.tx + cl.ty >> 1 & 1)), sx, sy);
          for (const [nm, dx, dy] of [['n', 0, -1], ['s', 0, 1], ['e', 1, 0], ['w', -1, 0]]) if (!occ(cl.tx, cl.ty, dx, dy)) await drawPiece(c, 'kerb_' + nm, sx, sy);
        } }); });
      headRects.forEach(r => { const sx = SX(r.cx), sy = SY(r.cy), sb = SY(r.y1); shadows.push([SX(r.x0), SY(r.y0), (r.x1 - r.x0) * Z3, (r.y1 - r.y0) * K * Z3]);
        items.push({ y: r.y0, f: async () => { await drawPiece(c, r.ew ? 'wall_h2' : 'wall_h3', sx, sb); if (false) return; await drawPiece(c, 'head_' + r.name, sx, sy); } });
        items.push({ y: r.cy - 1, f: () => drawPiece(c, 'things_' + r.name + '_n', sx, sy) }); items.push({ y: r.y1 - 1, f: () => drawPiece(c, 'things_' + r.name + '_s', sx, sy) }); });
      (pi.nets || []).forEach(([i, side]) => { const cl = list[Math.min(list.length - 1, i)], wx = (cl.tx + 1) * T, wy = (cl.ty + 1) * T, sx = SX(wx), sy = SY(wy), hw = T * Z3, hd = T * K * Z3, ox = side === 'e' ? hw : side === 'w' ? -hw : 0, oy = side === 's' ? hd : side === 'n' ? -hd : 0; items.push({ y: side === 's' ? wy + T + 0.5 : side === 'n' ? wy - T - 0.5 : wy - T + 0.5, f: () => drawPiece(c, 'net_' + side, sx + ox, sy + oy) }); });
      (pi.heroes || []).forEach(([where, i]) => { const cl = list[Math.min(list.length - 1, i)], wx = (cl.tx + 1) * T, wy = (cl.ty + 1) * T; let x = wx, y = wy, lift = 0;
        if (where === 'deck') { lift = LIFT; y = wy + 4; } else if (where === 'water_n') y = wy - T - 12; else if (where === 'water_s') y = wy + T + 30; else if (where === 'water_e') x = wx + T + 40; else if (where === 'water_w') x = wx - T - 40;
        items.push({ y, f: async () => { const hs = 0.5, sx = SX(x), sy = SY(y) - lift, w_ = hero.width * hs, h_ = hero.height * hs, swim = !lift && isWater(sx, sy); c.fillStyle = 'rgba(20,24,30,0.28)'; if (!swim) { c.beginPath(); c.ellipse(sx, sy, 22, 7, 0, 0, 7); c.fill(); }
          c.save(); if (swim) { c.beginPath(); c.rect(sx - w_, sy - h_ * 1.1, w_ * 2, h_ * 1.1); c.clip(); c.translate(0, h_ * 0.36); } c.drawImage(hero, sx - w_ / 2, sy - h_ * 0.97, w_, h_); c.restore(); if (swim) { c.strokeStyle = 'rgba(235,250,245,0.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(sx, sy - 2, 26, 8, 0, 0, 7); c.stroke(); } } }); });
    });
    shadows.forEach(([x, y, w_, h_]) => { c.fillStyle = 'rgba(14,32,48,0.3)'; c.fillRect(x + 7, y + 4, w_, h_); });
    shadows.forEach(([x, y, w_, h_]) => { c.strokeStyle = 'rgba(235,250,245,0.55)'; c.lineWidth = 2; for (let q = x; q < x + w_; q += 8) if (isWater(q, y + h_ + 5)) { c.beginPath(); c.moveTo(q, y + h_ + 6); c.lineTo(q + 6, y + h_ + 6); c.stroke(); } });   /* the water's line at a wall's foot: the game's to draw, on water only */
    items.sort((a, b) => a.y - b.y); for (const it of items) await it.f();
    c.font = 'bold 26px Alegreya'; c.lineWidth = 5; c.strokeStyle = '#1a1410'; c.strokeText(sc.title, 16, 34); c.fillStyle = '#f2e6c8'; c.fillText(sc.title, 16, 34);
    fs.writeFileSync('work/pier3/scene_' + sc.id + '.png', cv.toBuffer('image/png')); console.log('scene', sc.id, info.found); panels.push(cv);
  }
  const W = 2800 + 1900 + 40, rows = [[0, 4], [1, 5], [2, 8], [3, null], [6, null], [7, null]]; let hts = rows.map(r => Math.max(panels[r[0]].height, r[1] != null ? panels[r[1]].height : 0)), H = hts.reduce((a, b) => a + b + 16, 0), b = createCanvas(W, H), g = b.getContext('2d'); g.fillStyle = '#1a1410'; g.fillRect(0, 0, W, H); let y = 0; rows.forEach((r, i) => { g.drawImage(panels[r[0]], 0, y); if (r[1] != null) g.drawImage(panels[r[1]], 2820, y); y += hts[i] + 16; });
  fs.writeFileSync('work/pier3/board.png', b.toBuffer('image/png')); console.log('board', W, H);
})();
