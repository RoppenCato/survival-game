// The weapon and tool icons (2026-10-22, the Art Director's out/icons_weapons): art/build/weapon_icons.py renders each kind's wood
// and metal layers from the hero kit's own weapons at 320 px, and this halves them with a smooth filter into assets/sprites/items
// (160 px, the size Items.iconImage lays across a slot's diagonal, tinting the metal by its material).
//   node tools/icons.js [hero kit .blend] [kinds, comma separated]
// The kit's file is the studio's (its default here: the one it renders from); any kit file with the weapons works.
const { execFileSync } = require('child_process'); const fs = require('fs'); const path = require('path');
const { createCanvas, loadImage } = require('../node_modules/@napi-rs/canvas');
const BLEND = process.argv[2] || 'C:/dev/SG/Art Director/work/gait/source/hero_kit_gait.blend', KINDS = process.argv[3] || '';
const RAW = path.join('art', 'render', 'icons_weapons'), OUT = path.join('assets', 'sprites', 'items');
if (!fs.existsSync(BLEND)) { console.error('no hero kit file at ' + BLEND + ': pass its path'); process.exit(1); }
execFileSync(process.execPath, [path.join('tools', 'blender.js'), path.join('art', 'build', 'weapon_icons.py'), '--', BLEND, RAW].concat(KINDS ? [KINDS] : []), { stdio: 'inherit' });
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(RAW).filter(f => f.endsWith('.png'))) {
    const im = await loadImage(fs.readFileSync(path.join(RAW, f))), w = Math.round(im.width / 2), h = Math.round(im.height / 2);
    const cv = createCanvas(w, h), c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(im, 0, 0, w, h);
    fs.writeFileSync(path.join(OUT, f), cv.toBuffer('image/png')); console.log('icon', f, w + 'x' + h);
  }
})();
