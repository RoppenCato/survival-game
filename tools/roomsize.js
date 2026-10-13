// node tools/roomsize.js : how much floor there is to stand and fight on, by a room's size. Villages are grown at three house sizes (Village.DEF.houseK 1, 1.25, 1.5) and every house, longhouse, hall and church measured: the floor the hero can stand on and the widest circle of clear floor (docs/idea-bank.md, "House sizes: a proposal").
const R0 = require('path').join(__dirname, '..') + '/';
const Village = require(R0 + 'src/village.js');
const RAD = {}; require('fs').readFileSync(R0 + 'templates/game.html', 'utf8').replace(/prop: '(\w+)'[^}]*?\br: ([\d.]+)/g, (m, k, r) => { RAD[k] = +r; });
const T = 32, HERO = 7, rows = {};
function measure(l, V) {
  const x0 = l.x * T, y0 = l.y * T, w = l.w * T, h = l.h * T, S = [];
  V.items.forEach(it => { const r = it.r != null ? it.r : (it.name === 'cellarDoor' || it.name === 'rug' ? 0 : RAD[it.name] != null ? RAD[it.name] : 8); if (r && it.x > x0 - 4 && it.x < x0 + w + 4 && it.y > y0 - 4 && it.y < y0 + h + 4) S.push({ x: it.x, y: it.y, r, name: it.name }); });
  let best = 0, stand = 0, n = 0;
  for (let y = y0 + 1; y < y0 + h; y += 2) for (let x = x0 + 1; x < x0 + w; x += 2) {
    let c = Math.min(x - x0, x0 + w - x, y - y0, y0 + h - y); for (const s of S) c = Math.min(c, Math.hypot(s.x - x, s.y - y) - s.r);
    n++; if (c >= HERO) stand++; if (c > best) best = c;
  }
  return { things: S.length, disc: 2 * best / T, stand: stand / n * l.w * l.h };
}
for (const K of [1, 1.25, 1.5]) for (const arch of ['village', 'town', 'seat']) for (let seed = 1; seed <= 40; seed++) {
  const G = Object.assign({}, Village.DEF, { houseK: K }), site = Village.siteFor(arch, G), low = arch === 'town';
  let V; try { V = Village.make(seed * 13 + 7, { tx: 20, ty: 20, w: site.w, h: site.h, shore: null }, { arch, wealth: 0.6, biome: low ? 1 : 0, G: { houseK: K } }); } catch (e) { continue; }
  V.lots.forEach(l => { if (['house', 'longhouse', 'hall', 'church'].indexOf(l.id) < 0) return; const a = Math.min(l.w, l.h), b = Math.max(l.w, l.h), key = l.id + ' ' + a + 'x' + b, m = measure(l, V), q = rows[key] = rows[key] || { id: l.id, a, b, n: 0, things: 0, disc: 0, stand: 0, K: {} }; q.n++; q.things += m.things; q.disc += m.disc; q.stand += m.stand; q.K[K] = 1; });
}
const out = Object.values(rows).sort((p, q) => (p.id < q.id ? -1 : p.id > q.id ? 1 : p.a * p.b - q.a * q.b));
console.log('room (short x long, tiles)   metres        m2   things  floor to stand on  widest clear circle  grown at');
out.forEach(q => { if (q.n < 4) return; const st = q.stand / q.n; console.log((q.id + ' ' + q.a + 'x' + q.b).padEnd(26), ((q.a * 1.5).toFixed(1) + ' x ' + (q.b * 1.5).toFixed(1)).padEnd(13), String(Math.round(q.a * q.b * 2.25)).padStart(4), ('  ' + (q.things / q.n).toFixed(1)).padEnd(9), (st.toFixed(1) + ' tiles (' + Math.round(st / (q.a * q.b) * 100) + '%)').padEnd(19), ((q.disc / q.n).toFixed(1) + ' tiles').padEnd(20), Object.keys(q.K).join(' ')); });
