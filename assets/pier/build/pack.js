// pack.js: the final pier pieces packed for the game (Colin, AD, 2026-10-30). From the renders at 8 px a unit: halved to 4, trimmed to their pixels, with no ink ring (tools/pieces_pack.js adds one, and on a tiled
// deck it would draw a seam at every join). Writes out/pier_final/sheets/*.png, pier.json (each piece's picture numbers, box and sort) and icons/*.png, 160 by 160.
//   node work/pierfinal/pack.js
const GAME = 'C:/dev/SG/Game Developer';
const { createCanvas, loadImage } = require(GAME + '/node_modules/@napi-rs/canvas'); const fs = require('fs'), path = require('path');
const R = 'work/pierfinal/render/', OUT = 'out/pier_final/', M = JSON.parse(fs.readFileSync(R + 'meta.json', 'utf8')), BL = JSON.parse(fs.readFileSync(R + 'blocks.json', 'utf8'));
fs.mkdirSync(OUT + 'sheets', { recursive: true }); fs.mkdirSync(OUT + 'icons', { recursive: true });
const T = 32, MOD = 64;
// the sort rule of each kind: where it sorts against the hero (y in game units from its anchor), where its anchor goes, what it is
function info(n) {
  if (/^deck_/.test(n)) return { kind: 'deck', box: [-32, -32, 32, 32], anchor: 'the module\'s middle', sort: -32, variant: +n.slice(-1), note: n.endsWith('5') ? 'the cleat: only where the module\'s south (ew) or east (ns) side is open' : undefined };
  if (/^kerb_/.test(n)) return { kind: 'kerb', anchor: 'the module\'s middle', sort: -32, when: 'that side has no neighbour' };
  if (/^wall_/.test(n)) return { kind: 'wall', anchor: 'the middle of the south edge', sort: n === 'wall_m' ? -64 : null, when: 'the south side is open; drawn before the deck, sorts with it' };
  if (/^landing_/.test(n)) return { kind: 'landing', box: [-32, -32, 32, 32], anchor: 'the module\'s middle', sort: -32, sand: n.slice(-1), walkLift: 'rises 0 to 10.3 units from the sand side to the deck' };
  if (/^head_/.test(n)) { const ew = 'ew'.includes(n.slice(-1)); return { kind: 'head', box: ew ? [-32, -48, 32, 48] : [-48, -32, 48, 32], anchor: 'the head\'s middle', sort: ew ? -48 : -32, wall: ew ? 'wall_h2' : 'wall_h3', out: n.slice(-1), blocks: BL[n.slice(-1)] }; }
  if (/^things_/.test(n)) { const ew = 'ew'.includes(n[7]); return { kind: 'things', anchor: 'the head\'s middle', sort: n.endsWith('_n') ? -1 : (ew ? 47 : 31) }; }
  if (/^net_/.test(n)) return { kind: 'net', anchor: 'the middle of the edge it hangs on', sort: { s: 0.5, n: -0.5, e: -63.5, w: -63.5 }[n.slice(-1)], side: n.slice(-1), wide: 30, reach: 28, sortNote: 'from the anchor: for e and w, that is the module\'s north edge + 0.5 (on a head: its own north edge + 0.5)' };
  const d = { mooring: [[-3, -3, 3, 3]], coil: [], barrels: [[-11, -8, 12, 8]], fish_rack: [[-15, -8, 15, 8]], bench: [[-16, -4, 16, 4]], float: [[-27, -16, 27, 16]] }[n];
  return n === 'float' ? { kind: 'float', anchor: 'its middle on the water', sort: 0, note: 'not part of the pier: lay it beside the hull, repeat along a long one', blocks: d } : { kind: 'dressing', anchor: 'where it stands on the deck (ground position; the picture carries the lift)', sort: 0, blocks: d, onDeckOnly: true };
}
(async () => {
  const J = { upp: 0.25, tile: T, module: MOD, deckLift: 10.3, ground_K: 0.75, note: 'rendered at the tilt that matches the ground (sin = 0.75), so they lie on the grid; a head is 2 tiles along and 3 across, centred on the pier', pieces: {} };
  for (const n of Object.keys(M)) { if (!fs.existsSync(R + n + '.png')) continue; const m = M[n], im = await loadImage(R + n + '.png'), S2 = Math.ceil(m.size / 2), cv = createCanvas(S2, S2), c = cv.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(im, 0, 0, m.size / 2, m.size / 2);
    const d = c.getImageData(0, 0, S2, S2).data; let x0 = S2, y0 = S2, x1 = -1, y1 = -1; for (let y = 0; y < S2; y++) for (let x = 0; x < S2; x++) if (d[(y * S2 + x) * 4 + 3] > 4) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const w = x1 - x0 + 1, h = y1 - y0 + 1, o = createCanvas(w, h); o.getContext('2d').drawImage(cv, -x0, -y0); fs.writeFileSync(OUT + 'sheets/' + n + '.png', o.toBuffer('image/png'));
    J.pieces[n] = Object.assign({ w, h, ax: Math.round((m.ax / 2 - x0) * 10) / 10, ay: Math.round((m.ay / 2 - y0) * 10) / 10 }, info(n)); }
  fs.writeFileSync(OUT + 'sheets/pier.json', JSON.stringify(J, null, 1));
  // the Building board's icons: a piece or a small group, fitted to 160
  const P = n => loadImage(OUT + 'sheets/' + n + '.png'), D = J.pieces;
  const group = async (name, list) => { const b = createCanvas(900, 900), g = b.getContext('2d'); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [n, x, y] of list) { const q = D[n], im = await P(n), l = 450 + x - q.ax, t = 450 + y - q.ay; g.drawImage(im, l, t); x0 = Math.min(x0, l); y0 = Math.min(y0, t); x1 = Math.max(x1, l + q.w); y1 = Math.max(y1, t + q.h); }
    const s = Math.min(1.6, 148 / Math.max(x1 - x0, y1 - y0)), o = createCanvas(160, 160), oc = o.getContext('2d'); oc.imageSmoothingQuality = 'high'; oc.drawImage(b, x0, y0, x1 - x0, y1 - y0, 80 - (x1 - x0) * s / 2, 80 - (y1 - y0) * s / 2, (x1 - x0) * s, (y1 - y0) * s); fs.writeFileSync(OUT + 'icons/' + name + '.png', o.toBuffer('image/png')); };
  const mod = (extra = []) => [['wall_m', 0, 96], ['deck_ew_3', 0, 0], ['kerb_n', 0, 0], ['kerb_s', 0, 0]].concat(extra);
  await group('pier_straight', mod());
  await group('pier_landing', [['landing_w', 0, 0]]);
  await group('pier_head', [['wall_h2', 0, 144], ['head_e', 0, 0], ['things_e_n', 0, 0], ['things_e_s', 0, 0]]);
  await group('pier_net', [['wall_m', 0, 96], ['deck_ew_1', 0, 0], ['kerb_n', 0, 0], ['kerb_s', 0, 0], ['net_s', 0, 96]]);
  for (const n of ['mooring', 'coil', 'barrels', 'fish_rack', 'bench']) await group(n, [[n, 0, 0]]);
  console.log('packed', Object.keys(J.pieces).length, 'pieces');
})();
