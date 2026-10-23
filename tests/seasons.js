// The seasons (2026-10-23): the Art Director's grades as the game calls them, on a baked piece of the starter island and on a
// set piece, with the time each takes (a chunk is graded once a bake, a picture once a season: a hitch is what to watch for).
//   node tests/seasons.js
const { createCanvas, loadImage } = require('@napi-rs/canvas');
global.__mk = (w, h) => createCanvas(w, h);
const Seasons = require('../src/seasons.js');
const W = 1280, H = 1280;
(async () => {
  // a piece of ground: grass with a beach and sea on the right, as the painter leaves it (the colours of PAL, near enough)
  const cv = createCanvas(W, H), c = cv.getContext('2d');
  for (let y = 0; y < H; y += 8) for (let x = 0; x < W; x += 8) { const sea = x > W * 0.7, sand = !sea && x > W * 0.6; c.fillStyle = sea ? '#3a8fb0' : sand ? '#d9c08a' : (((x + y) >> 3) & 1 ? '#5f9a3c' : '#4f8a34'); c.fillRect(x, y, 8, 8); }
  const water = (x, y) => x > W * 0.7, land = (x, y) => x < W * 0.6;
  for (const sn of ['spring', 'autumn', 'winter']) {
    const id = c.getImageData(0, 0, W, H), t0 = Date.now(); Seasons.gradeGround(id.data, W, H, sn, water); const t1 = Date.now();
    const out = createCanvas(W, H), o = out.getContext('2d'); o.putImageData(id, 0, 0); Seasons.sprinkle(o, sn, W, H, land, 0, 0); const t2 = Date.now();
    const d = o.getImageData(W * 0.3 | 0, H * 0.3 | 0, 1, 1).data, s = o.getImageData(W * 0.9 | 0, H * 0.5 | 0, 1, 1).data, e = o.getImageData(W * 0.705 | 0, H * 0.5 | 0, 1, 1).data;
    console.log((t1 - t0 > 400 ? '!! ' : '   ') + sn.padEnd(7) + ' a 1280 by 1280 piece graded in ' + (t1 - t0) + ' ms, sprinkled in ' + (t2 - t1) + ' ms; grass ' + [d[0], d[1], d[2]].join(',') + ', open sea ' + [s[0], s[1], s[2]].join(',') + ', the shore ' + [e[0], e[1], e[2]].join(','));
    require('fs').writeFileSync('seasons_' + sn + '.png', out.toBuffer('image/png'));
  }
  // a set piece: the game's oak and berry bush, graded once a season
  for (const [kind, file] of [['oak', 'assets/props/trees/oak_1.png'], ['berryBush', 'assets/props/plants/berryBush_1.png'], ['pine', 'assets/props/trees/pine_1.png'], ['flower', 'assets/props/plants/flower_1.png']]) {
    let im; try { im = await loadImage(require('path').join(__dirname, '..', file)); } catch (e) { console.log('   ' + kind + ': no picture at ' + file); continue; }
    for (const sn of ['spring', 'autumn', 'winter']) {
      const pc = createCanvas(im.width, im.height), g = pc.getContext('2d'); g.drawImage(im, 0, 0); const id = g.getImageData(0, 0, im.width, im.height), t0 = Date.now();
      const ok = Seasons.gradeSprite(id.data, im.width, im.height, kind, sn, false); const dt = Date.now() - t0;
      console.log((dt > 150 ? '!! ' : '   ') + kind.padEnd(10) + sn.padEnd(7) + ' ' + im.width + 'x' + im.height + ' graded in ' + dt + ' ms' + (ok ? '' : ' (not drawn this season)'));
    }
  }
  console.log('   winter oak: ' + Seasons.bareTree('oak', 1) + ', ' + Seasons.bareTree('birch', 2) + '; pine: ' + Seasons.bareTree('pine', 0));
})();
