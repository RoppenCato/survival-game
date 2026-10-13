// The people drawn by the game's own code (Sprites.person) outside a browser (2026-10-12, docs/battle-plan.md rung 0).
//   node tools/visual/people.js crowd [seed]     thirty people rolled as the game rolls them, the hero among them, on the starter island
//                                               at the size Robin plays at (3 px a unit shown one and a half times larger): people_crowd.png
//   node tools/visual/people.js clips [kind]     every clip of an armed man, all its frames, from three sides: people_clips.png
//   node tools/visual/people.js blows            the four clips a blow is drawn with, frame by frame with a weapon: people_blows.png
//   node tools/visual/people.js dead             the dead as they lie, from all eight sides in different dress, and the fall frame by frame, at Robin's size: people_dead.png
// A canvas from @napi-rs/canvas stands in for the page's; the sheets are read from assets/sprites/people.
const { createCanvas, loadImage } = require('../../node_modules/@napi-rs/canvas'); const fs = require('fs'); const path = require('path');
global.__mk = (w, h) => createCanvas(w, h); global.document = { createElement: () => createCanvas(1, 1) };
const S = require('../../src/stylelab.js'), World = require('../../src/world.js'), DI = require('./dayisland.js'), Sprites = require('../../src/sprites.js'), Hird = require('../../src/hird.js');
global.GameArt = require('../../src/art.js'); const lib = GameArt.lib, kit = S.kit; kit.setup(kit.STYLE);
const DIRS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'], FACE = { s: Math.PI / 2, sw: Math.PI * 3 / 4, w: Math.PI, nw: -Math.PI * 3 / 4, n: -Math.PI / 2, ne: -Math.PI / 4, e: 0, se: Math.PI / 4 };
const dir = path.join('assets', 'sprites', 'people'), J = JSON.parse(fs.readFileSync(path.join(dir, 'people.json'), 'utf8'));
const H = Sprites.loadLazy({ people: { meta: J, images: {} } }, 'people');
async function need(look, clips) { for (const cl of clips) { const A = J.anims[cl]; if (!A) continue; for (const q of look.L) { const f = A.sheets[q.l]; if (f && !H.img[f]) { const im = await loadImage(path.join(dir, f)); H.img[f] = im; if (!im.complete) Object.defineProperty(im, 'complete', { value: true }); if (!im.naturalWidth) Object.defineProperty(im, 'naturalWidth', { value: im.width }); } } } }
const label = (c, t, x, y) => { c.fillStyle = 'rgba(20,16,12,0.62)'; c.font = 'bold 13px sans-serif'; const tw = c.measureText(t).width; c.fillRect(x - 4, y - 14, tw + 8, 19); c.fillStyle = '#f0e6cc'; c.fillText(t, x, y); };
const IRON = '#9ca3ad', RED = '#8a3a34', BLUE = '#3f5a7a';
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
async function hero(c, x, y, Z, d) {
  const hd = path.join('assets', 'sprites', 'hero2-mixamo'), HJ = JSON.parse(fs.readFileSync(path.join(hd, 'hero2-mixamo.json'), 'utf8')), A = HJ.anims.idle, im = await loadImage(path.join(hd, A.sheets.body)), k = Z / 3, fw = HJ.frame.w, fh = HJ.frame.h, row = HJ.dirs.indexOf(d || 's');
  c.drawImage(im, 0, row * fh, fw, fh, x - HJ.anchor.x * k, y - HJ.anchor.y * k, fw * k, fh * k);
}
async function put(c, look, st, x, y, Z, opts) { await need(look, [st.clip]); c.save(); c.scale(Z, Z); const ok = Sprites.person(c, H, look, st, x / Z, y / Z, Object.assign({ shadowHue: kit.STYLE.shadowHue }, opts || {})); c.restore(); return ok; }
const mode = process.argv[2] || 'crowd';
(async () => {
  if (mode === 'crowd') {
    const seed = +process.argv[3] || 7, R = rng(seed), Z = 4.5, W = 1800, HH = 1000;
    const w = DI.make(kit, World, 11), r = DI.paint(kit, World, W, HH, Z, { world: w, at: { x: w.home.x - 330, y: w.home.y - 250 } }), cv = r.cv, c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    const list = [];
    for (let i = 0; i < 30; i++) {
      const row = Math.floor(i / 10), col = i % 10, x = 110 + col * 172 + (R() - 0.5) * 40, y = 300 + row * 290 + (R() - 0.5) * 50, kind = i % 10 === 3 ? 'guard' : i % 10 === 6 ? 'hird' : i % 10 === 8 ? 'foe' : 'folk';
      let look, clip = R() < 0.2 ? 'walk' : (R() < 0.2 ? 'idle_look' : 'idle');
      if (kind === 'folk') { const sp = lib.folkSpec('villager', R); if (i === 15) { sp.scale = 0.55; sp.beard = 0; sp.hat = 0; } look = Sprites.lookOf(sp); }
      else { const p = Hird.roll(R), sp = Hird.figureSpec(p, lib.heroDef), v = lib.folkSpec('villager', R); sp.hair = v.hair; sp.beard = v.beard; sp.hat = 0; sp.clothes = 1;
        look = Sprites.lookOf(sp, kind === 'guard' ? { mail: true, helm: true, hand: { kind: 'spear', tint: IRON } } : kind === 'hird' ? { helm: R() < 0.5, shield: RED, cloak: RED, hand: { kind: ['sword', 'axe', 'spear', 'seax'][Math.floor(R() * 4)], tint: IRON } } : { mail: R() < 0.5, helm: true, shield: BLUE, hand: { kind: ['axe', 'club', 'greataxe', 'sword'][Math.floor(R() * 4)], tint: IRON } }); clip = 'idle'; }
      list.push({ x, y, look, clip, d: ['s', 's', 'sw', 'se', 'sw', 'se', 'w', 'e', 'nw', 'n'][Math.floor(R() * 10)], t: R() * 10, kind });
    }
    list.push({ x: 110 + 4.5 * 172, y: 300 + 290 + 30, hero: true });
    list.sort((a, b) => a.y - b.y);
    for (const q of list) { if (q.hero) { await hero(c, q.x, q.y, Z); label(c, 'the hero', q.x - 28, q.y + 22); } else await put(c, q.look, { clip: q.clip, face: FACE[q.d], t: q.t }, q.x, q.y, Z); }
    c.globalAlpha = 0.12; c.fillStyle = kit.grain(c); c.fillRect(0, 0, W, HH); c.globalAlpha = 1;
    label(c, 'Thirty people rolled as the game rolls them (villagers, a guard, your own in red, raiders in blue), at the size Robin plays at. Seed ' + seed + '. Frames kept: ' + Sprites.peopleStats().kept, 14, 22);
    fs.writeFileSync('people_crowd.png', cv.toBuffer('image/png')); console.log('wrote people_crowd.png');
  } else if (mode === 'clips' || mode === 'blows') {
    const kind = mode === 'clips' ? (process.argv[3] || 'sword') : null, Z = mode === 'blows' ? 4.5 : 3;
    const sp = lib.folkSpec('villager', rng(3)); sp.hair = 2; sp.beard = 2; sp.hat = 0; sp.clothes = 1;
    const rows = [];
    if (mode === 'clips') { const look = Sprites.lookOf(sp, { helm: true, shield: RED, cloak: RED, hand: { kind, tint: IRON } }); Object.keys(J.anims).forEach(cl => { ['s', 'w', 'n'].forEach(d => rows.push({ cl, d, look })); }); }
    else [['attack1', 'sword'], ['attack2', 'sword'], ['chop', 'greataxe'], ['mine', 'club'], ['attack1', 'spear'], ['block', 'sword']].forEach(([cl, k]) => { const look = Sprites.lookOf(sp, { helm: true, shield: RED, hand: { kind: k, tint: IRON } }); ['w', 's', 'e'].forEach(d => rows.push({ cl, d, look, k })); });
    const cw = 60 * Z, ch = 62 * Z, maxF = Math.max(...rows.map(q => J.anims[q.cl].frames)), W = 150 + maxF * cw, HH = rows.length * ch + 10;
    const cv = createCanvas(W, HH), c = cv.getContext('2d'); c.fillStyle = '#8fa870'; c.fillRect(0, 0, W, HH); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    for (let r = 0; r < rows.length; r++) { const q = rows[r], A = J.anims[q.cl];
      for (let f = 0; f < A.frames; f++) { await put(c, q.look, { clip: q.cl, face: FACE[q.d], k: (f + 0.5) / A.frames }, 150 + f * cw + cw / 2, r * ch + ch - 8 * Z, Z, { shadow: false }); c.fillStyle = '#1b1612'; c.font = '11px sans-serif'; c.fillText(String(f), 150 + f * cw + 4, r * ch + 12); }
      c.fillStyle = '#1b1612'; c.font = 'bold 13px sans-serif'; c.fillText(q.cl + ' ' + q.d + (q.k ? ' ' + q.k : ''), 6, r * ch + ch / 2); }
    const out = mode === 'clips' ? 'people_clips.png' : 'people_blows.png'; fs.writeFileSync(out, cv.toBuffer('image/png')); console.log('wrote', out, W + 'x' + HH);
  } else if (mode === 'dead') {              // (2026-10-13: the dead lay with half their bodies cut off by the frame; the death now has a frame of its own)
    const R = rng(5), Z = 4.5, W = 1800, HH = 760;
    const w = DI.make(kit, World, 11), r = DI.paint(kit, World, W, HH, Z, { world: w, at: { x: w.home.x - 330, y: w.home.y - 250 } }), cv = r.cv, c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    const dress = [{ mail: true, helm: true }, { helm: true, shield: RED, cloak: RED }, {}, { mail: true, helm: true, shield: BLUE }, { cloak: BLUE }, {}, { helm: true, shield: BLUE }, { cloak: RED, shield: RED }], looks = [];
    for (let i = 0; i < 8; i++) { const sp = lib.folkSpec('villager', R); if (i !== 2 && i !== 5) { sp.clothes = 1; sp.hat = 0; } looks.push(Sprites.lookOf(sp, dress[i])); }
    for (let i = 0; i < 8; i++) { const x = 130 + i * 215, y = 250; await put(c, looks[i], { clip: 'death', face: FACE[DIRS[i]], k: 0.999 }, x, y, Z, { shadow: false, lying: 1 }); c.fillStyle = '#c0392b'; c.fillRect(x - 2, y - 2, 4, 4); label(c, 'fell facing ' + DIRS[i], x - 44, y + 96); }
    for (let f = 0; f < 10; f++) { const x = 100 + f * 177, y = 590; await put(c, looks[1], { clip: 'death', face: FACE.w, k: (f + 0.5) / 10 }, x, y, Z, { shadow: false, lying: (f + 0.5) / 10 }); c.fillStyle = '#c0392b'; c.fillRect(x - 2, y - 2, 4, 4); }
    label(c, 'The dead as they lie (the red dot is where the man stood). Below: the fall, frame by frame.', 14, 22);
    fs.writeFileSync('people_dead.png', cv.toBuffer('image/png')); console.log('wrote people_dead.png');
  }
})();
