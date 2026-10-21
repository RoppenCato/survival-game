// The four hulls' outlines as SVG paths for the Art Director (2026-10-21: the hull drawn in code, the studio's surfaces laid on
// it). Writes hulls.svg (1 unit = 1 px, the hull's own frame: x along the keel with the bow at +, y across; the bow points
// right): for each hull the outline, the strake rows on each side (the regions a plank strip is mapped into: the half-width
// split by the rows the design lays, two amidships tapering to one and none toward the stems), the floor, the thwarts, the
// mast and the steering oar cells, and the shields along the rail as circles. node tools/visual/hullpaths.js [out.svg]
const { createCanvas } = require('@napi-rs/canvas'); global.__mk = (w, h) => createCanvas(w, h);
const Yard = require('../../src/yard.js'); const fs = require('fs');
const KJ = Yard.KJ, out = process.argv[2] || 'hulls.svg';
function outline(pr, sx, sw) {              // the same points shapedPath draws through
  const L = pr.L * sx, m = pr.n * 2 + 1, pts = [[-L, 0]];
  for (let k = 1; k < m; k++) { const x = -L + 2 * L * k / m; pts.push([x, -Yard.profW(pr, x / sx, -1) * sw]); } pts.push([L, 0]);
  for (let k = m - 1; k >= 1; k--) { const x = -L + 2 * L * k / m; pts.push([x, Yard.profW(pr, x / sx, 1) * sw]); }
  let d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
  for (let k = 1; k < pts.length - 1; k++) { const mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2; d += ' Q' + pts[k][0].toFixed(1) + ',' + pts[k][1].toFixed(1) + ' ' + mx.toFixed(1) + ',' + my.toFixed(1); }
  d += ' Q' + pts[pts.length - 1][0].toFixed(1) + ',' + pts[pts.length - 1][1].toFixed(1) + ' ' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1) + ' Z';
  return d;
}
function curve(pr, side, k) {               // one side's edge at k of the half-width, bow to stern
  const L = pr.L, m = pr.n * 2 + 1, pts = [];
  for (let i = 0; i <= m; i++) { const x = -L + 2 * L * i / m; pts.push([x, side * Yard.profW(pr, x, side) * k]); }
  return 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
}
let y0 = 40, svg = [];
const groups = [];
Yard.HULL_IDS.forEach(id => {
  const H = Yard.HULLS[id], pr = Yard.profileOf({ kind: id, parts: [] }), L = pr.L, W = pr.Wmax;
  const parts = []; for (let i = 2; i <= H.n - 1 && parts.length < H.thwarts[1]; i++) if (i !== H.mast) parts.push({ id: 'thwart', i, j: KJ });
  const v = { kind: id, parts, x: 0, y: 0, h: 0, vx: 0, vy: 0 }; Yard.fit(v);
  const rows = Yard.hullCells(id).filter(p => p.id === 'strake' && p.j < KJ).map(p => ({ i: p.i, r: KJ - p.j }));   // the strake rows a cell carries (per side): r 1 is next to the keel
  let g = `<g id="${id}" transform="translate(${(L + 30).toFixed(0)},${(y0 + W + 30).toFixed(0)})">\n`;
  g += `  <title>${H.name}: ${(2 * L / Yard.U).toFixed(1)} m by ${(2 * W / Yard.U).toFixed(1)} m; ${H.n} keel cells of ${Yard.CW} units; the bow at +x</title>\n`;
  g += `  <path id="${id}-outline" d="${outline(pr, 1, 1)}" fill="#5e4430" stroke="#231a16" stroke-width="1.2"/>\n`;
  g += `  <path id="${id}-floor" d="${outline(pr, 0.84, 0.62)}" fill="#9a7c5c" stroke="#231a16" stroke-width="0.9"/>\n`;
  [[0.95, 'strake-1'], [0.9, 'strake-2']].forEach(q => { [-1, 1].forEach(sd => { g += `  <path id="${id}-${q[1]}-${sd < 0 ? 'port' : 'starboard'}" d="${curve(pr, sd, q[0])}" fill="none" stroke="#231a16" stroke-width="0.6" opacity="0.5"/>\n`; }); });
  for (let k = 0; k < H.n; k++) { const x0 = (k + 1 - pr.cx) * Yard.CW, x1 = x0 + Yard.CW, n = rows.filter(r => r.i === k + 1).length; g += `  <line id="${id}-cell-${k + 1}" x1="${x0.toFixed(1)}" y1="${(-W - 6).toFixed(1)}" x2="${x0.toFixed(1)}" y2="${(-W - 2).toFixed(1)}" stroke="#231a16" stroke-width="0.5"/><text x="${((x0 + x1) / 2).toFixed(1)}" y="${(-W - 8).toFixed(1)}" font-size="5" text-anchor="middle" fill="#231a16">${n} row${n === 1 ? '' : 's'}</text>\n`; }
  v.seats.forEach(x => { g += `  <rect class="thwart" x="${(x - 3).toFixed(1)}" y="${(-Yard.profW(pr, x, -1) * 0.6).toFixed(1)}" width="6" height="${(Yard.profW(pr, x, 1) * 1.2).toFixed(1)}" fill="#8a6c4c" stroke="#231a16" stroke-width="0.6"/>\n`; });
  if (H.mast) { const mx = (H.mast + 0.5 - pr.cx) * Yard.CW; g += `  <circle class="mast" cx="${mx.toFixed(1)}" cy="0" r="3" fill="#3a2a20"/>\n`; }
  if (H.rudder) { const rx = -L * 0.78; g += `  <circle class="steering-oar" cx="${rx.toFixed(1)}" cy="${(Yard.profW(pr, rx, 1) * 0.95).toFixed(1)}" r="2.5" fill="#3a2a20"/>\n`; }
  if (H.mast) for (let sx2 = -L * 0.74; sx2 <= L * 0.74; sx2 += 11) [-1, 1].forEach(sd => { g += `  <ellipse class="shield" cx="${sx2.toFixed(1)}" cy="${(sd * Yard.profW(pr, sx2, sd) * 0.98).toFixed(1)}" rx="9.5" ry="7" fill="none" stroke="#8a3a34" stroke-width="0.6"/>\n`; });
  g += `  <text x="${(-L).toFixed(0)}" y="${(W + 22).toFixed(0)}" font-size="9" fill="#231a16">${H.name}: ${(2 * L).toFixed(0)} by ${(2 * W).toFixed(0)} units (${(2 * L / Yard.U).toFixed(1)} m by ${(2 * W / Yard.U).toFixed(1)} m); ${v.seats.length} thwarts at ${Yard.CW} units' pitch; shields 20 units across, 11 apart</text>\n</g>`;
  groups.push(g); y0 += 2 * W + 80;
});
const maxL = Math.max(...Yard.HULL_IDS.map(id => Yard.profileOf({ kind: id, parts: [] }).L));
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${(2 * maxL + 80).toFixed(0)}" height="${(y0 + 20).toFixed(0)}" viewBox="0 0 ${(2 * maxL + 80).toFixed(0)} ${(y0 + 20).toFixed(0)}" font-family="sans-serif">`);
svg.push(`<desc>The game's four hulls (src/yard.js, Yard.hullProfile), 1 unit = 1 px, 1 unit = 4.6 cm. In the game the hull's frame is rotated to its heading and then squashed to 0.75 in y (the three-quarter camera); a texture mapped in this frame turns with the planks. The outline is drawn at scale (1, 1), the floor at (0.84, 0.62) of it; the strake lines at 0.95 and 0.9 of the half-width; the cells are ${Yard.CW} units along the keel and the rows a cell carries per side are marked above it.</desc>`);
svg.push(groups.join('\n')); svg.push('</svg>');
fs.writeFileSync(out, svg.join('\n')); console.log('wrote ' + out);
