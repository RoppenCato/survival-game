// The hero's shield rendered, joined to his other renders and packed into his sheets (2026-10-13, Robin: "you need to create
// a shield and implement it").   node tools/shieldrender.js [jobs at once] [--norender]
// art/build/shield_build.py has put the shield (three layers: shieldRim, shieldFace, shieldMark) and two clips (block,
// block_walk) into art/source/hero2_mixamo.blend. Here: the shield's layers for every clip a man fights in, and the two new
// clips for the body and for the things the other hand may hold, several Blender processes at a time, each into a folder of
// its own (a frame already on disk is kept: render.py --keep 1). Then the frames are copied into art/render/hero2_mixamo
// and its meta.json learns the new layers and clips (so a full pack still holds them), and tools/sprites.js --only packs
// just the new sheets into assets/sprites/hero2-mixamo with the frame the set already has.
const { spawn, spawnSync } = require('child_process'); const fs = require('fs'); const path = require('path');
const R = path.join('art', 'render'), DST = path.join(R, 'hero2_mixamo'), BLEND = path.join('art', 'source', 'hero2_mixamo.blend');
const FR = { idle: 100, walk: 12, run: 10, attack1: 12, attack2: 12, hit: 8, block: 6, block_walk: 12 };
const FIGHT = ['idle', 'walk', 'run', 'attack1', 'attack2', 'hit', 'block'], HAND = ['swordWood', 'swordMetal', 'clubWood', 'axeWood', 'axeMetal', 'knifeWood', 'knifeMetal', 'bowWood'];
const JOBS = [
  ['shield_a', FIGHT, ['shieldRim']], ['shield_b', FIGHT, ['shieldFace']], ['shield_c', FIGHT, ['shieldMark']],
  ['shield_d', ['block'], ['body'].concat(HAND)],
  ['shield_e', ['block_walk'], ['body', 'shieldRim', 'shieldFace']], ['shield_f', ['block_walk'], ['shieldMark', 'swordWood', 'swordMetal']],
  ['shield_g', ['block_walk'], ['clubWood', 'axeWood', 'axeMetal']], ['shield_h', ['block_walk'], ['knifeWood', 'knifeMetal', 'bowWood']]
];
const NEW_LAYERS = ['shieldRim', 'shieldFace', 'shieldMark'], NEW_CLIPS = ['block', 'block_walk'];
const AT_ONCE = +process.argv[2] || 4, NORENDER = process.argv.includes('--norender');
let next = 0, running = 0, failed = 0; const t0 = Date.now();
function start() {
  while (running < AT_ONCE && next < JOBS.length) {
    const n = next++, [dir, clips, layers] = JOBS[n], out = path.join(R, dir); fs.mkdirSync(out, { recursive: true });
    const args = ['tools/blender.js', 'art/build/render.py', '--', BLEND, out, '--anims', clips.join(','), '--dirs', '8', '--frames', clips.map(c => c + '=' + FR[c]).join(','), '--layers', layers.join(','), '--ortho', '2.02', '--style', 'cel', '--scene', 'day', '--keep', '1'];
    const log = fs.openSync(path.join(R, dir + '.log'), 'w'), p = spawn(process.execPath, args, { stdio: ['ignore', log, log] }); running++;
    console.log('job', dir, layers.join(' '), '(' + clips.join(' ') + ')');
    p.on('exit', code => { running--; if (code) { failed++; console.log('job', dir, 'FAILED with', code, '(see', path.join(R, dir + '.log') + ')'); } else console.log('job', dir, 'done after', Math.round((Date.now() - t0) / 1000), 's'); start(); if (!running && next >= JOBS.length) finish(); });
  }
}
function finish() {
  if (failed) { console.log(failed + ' job(s) failed'); process.exit(1); }
  // joined to the hero's other renders: the frames copied in, the new layers and clips written into his numbers
  const mf = path.join(DST, 'meta.json'), m0 = JSON.parse(fs.readFileSync(mf, 'utf8')); let n = 0;
  fs.readdirSync(R).filter(d => /^shield_[a-z]$/.test(d) && fs.existsSync(path.join(R, d, 'meta.json'))).sort().forEach(d => {
    const m1 = JSON.parse(fs.readFileSync(path.join(R, d, 'meta.json'), 'utf8'));
    if (JSON.stringify(m1.anchor) !== JSON.stringify(m0.anchor) || m1.size !== m0.size || m1.px !== m0.px) throw new Error(d + ': not the frame of the hero\'s other renders');
    m1.layers.forEach(l => { if (m0.layers.indexOf(l) < 0) m0.layers.push(l); });
    for (const a in m1.anims) { if (!m0.anims[a]) m0.anims[a] = m1.anims[a]; else if (m0.anims[a].frames !== m1.anims[a].frames) throw new Error(d + ': ' + a + ' has ' + m1.anims[a].frames + ' frames, the hero\'s ' + m0.anims[a].frames); }
    fs.readdirSync(path.join(R, d)).filter(f => /\.png$/.test(f)).forEach(f => { fs.copyFileSync(path.join(R, d, f), path.join(DST, f)); n++; });
  });
  fs.writeFileSync(mf, JSON.stringify(m0, null, 1));
  console.log('copied', n, 'frames into', DST + '; layers', m0.layers.join(' ') + '; clips', Object.keys(m0.anims).join(' '));
  const r = spawnSync(process.execPath, ['tools/sprites.js', 'hero2-mixamo', DST, path.join('assets', 'sprites', 'hero2-mixamo'), '--only', NEW_LAYERS.concat(NEW_CLIPS).join(',')], { stdio: 'inherit' });
  process.exit(r.status == null ? 1 : r.status);
}
if (NORENDER) finish(); else { start(); if (!running) finish(); }
