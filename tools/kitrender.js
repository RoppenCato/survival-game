// Renders the hero's kit (art/source/hero_kit*.blend, from art/build/kit_build.py), several Blender processes at a time, each job
// into a folder of its own, then joins them into art/render/hero_kit and art/render/hero_kit_own for tools/kitpack.js
// (2026-10-20, Robin: the hero as a naked body with every garment a layer; the people's way of drawing).
//   node tools/kitrender.js [jobs at once] [job numbers,...] [--join]
// A frame already on disk is kept (render.py --keep 1), so a stopped run goes on where it stopped.
// The things in the hand come from the grip files as in the 2026-10-15 drop (work/hero/finish_grips.sh): the blades, club,
// Dane axe and spear at rest from _rest (but the sword, seax, knife and club facing north from the plain file: Robin liked
// the old grip that way), the first slash from _tilt (the spear's from the plain file), the axe and pick at the tree and the
// rock from _chop180, and the rest from the plain file.
const { spawn } = require('child_process'); const fs = require('fs'); const path = require('path');
const R = path.join('art', 'render'), SRC = path.join('art', 'source'), MAIN = path.join(R, 'hero_kit'), OWNDIR = path.join(R, 'hero_kit_own');
const FR = { idle: 16, idle_look: 16, walk: 12, run: 10, attack1: 10, attack2: 10, bow_draw: 8, bow_shoot: 6, hit: 8, chop: 12, mine: 12, pickup: 16, interact: 16, drink: 16, sitdown: 12, sit: 8, standup: 12, block: 6, block_walk: 12, death: 12, thrust: 9 };
const ALL = ['idle', 'idle_look', 'walk', 'run', 'attack1', 'attack2', 'bow_draw', 'bow_shoot', 'hit', 'chop', 'mine', 'pickup', 'interact', 'drink', 'sitdown', 'sit', 'standup', 'block', 'block_walk'];
const OWN = ['death', 'thrust'], FIGHT = ['idle', 'walk', 'run', 'attack1', 'attack2', 'hit', 'block', 'block_walk'], STAND = ['idle', 'walk', 'run'];
const WEAR = [['body', 'tunic', 'legs', 'shoes'], ['boots', 'belt', 'coat', 'mail'], ['cloak', 'brooch', 'armring', 'cap'], ['helm', 'hood', 'hairA', 'hairHatA'], ['hairB', 'hairHatB', 'hairC', 'hairHatC'], ['beardA', 'beardB']];
const WK = k => [k + 'Wood', k + 'Metal'];
const J = [];   // [folder, blend, clips, layers, own]
WEAR.forEach((ls, i) => J.push(['k_wear' + i, '', ALL, ls, 0]));
J.push(['k_shield', '', FIGHT, ['shieldRim', 'shieldFace', 'shieldMark'], 0]);
J.push(['k_hand_a', '', ['attack2', 'hit', 'block', 'block_walk'], [...WK('sword'), 'clubWood', ...WK('seax'), ...WK('knife')], 0]);
J.push(['k_hand_b', '', ['attack2', 'hit', 'block', 'block_walk'], WK('greataxe'), 0]);
J.push(['k_hand_spear', '', ['attack1', 'attack2', 'hit', 'block', 'block_walk'], WK('spear'), 0]);
J.push(['k_hand_axe', '', ['idle', 'walk', 'run', 'attack2', 'hit', 'block', 'block_walk'], WK('axe'), 0]);
J.push(['k_hand_pick', '', ['idle', 'walk', 'run', 'hit'], WK('pick'), 0]);
J.push(['k_hand_bow', '', ['idle', 'walk', 'run', 'bow_draw', 'bow_shoot', 'hit'], ['bowWood'], 0]);
J.push(['k_hand_knifework', '', ['chop', 'mine', 'attack1'], WK('knife'), 0]);
J.push(['k_north', '', STAND, [...WK('sword'), ...WK('seax'), ...WK('knife'), 'clubWood'], 0]);
J.push(['k_rest', '_rest', STAND, [...WK('sword'), ...WK('seax'), 'clubWood', ...WK('knife'), ...WK('greataxe'), ...WK('spear')], 0]);
J.push(['k_tilt', '_tilt', ['attack1'], [...WK('sword'), ...WK('seax'), 'clubWood', ...WK('greataxe'), ...WK('axe')], 0]);
J.push(['k_chop', '_chop180', ['chop', 'mine'], [...WK('axe'), ...WK('pick')], 0]);
WEAR.forEach((ls, i) => J.push(['k_own' + i, '', OWN, ls, 1]));
J.push(['k_own_thrust', '', ['thrust'], ['shieldRim', 'shieldFace', 'shieldMark', ...WK('spear')], 1]);
// 2026-10-20 (Robin: the caps looked weird; then "I like all the new headwear"): nine head layers (art/build/kit_heads.py) replace the first cap, helm and hood
const HEADS = [['capA', 'capB', 'capC'], ['helmA', 'helmB', 'helmC'], ['hoodA', 'hoodB', 'hoodC']], OBSOLETE = new Set(['cap', 'helm', 'hood']);
HEADS.forEach((ls, i) => J.push(['k_heads' + i, '', ALL, ls, 0])); HEADS.forEach((ls, i) => J.push(['k_ownheads' + i, '', OWN, ls, 1]));
const OWN_ARGS = ['--size', '320', '--ortho', '4.04', '--inplace', 'death'];
const args = process.argv.slice(2), JOIN = args.includes('--join'), rest = args.filter(a => a !== '--join');
const AT_ONCE = +rest[0] || 6, only = rest[1] ? rest[1].split(',').map(Number) : null;
let next = 0, running = 0, failed = 0; const t0 = Date.now();
function start() {
  while (running < AT_ONCE && next < J.length) {
    const n = next++; if (only && only.indexOf(n) < 0) continue;
    const [dir, blend, clips, layers, own] = J[n], out = path.join(R, dir); fs.mkdirSync(out, { recursive: true });
    const a = ['tools/blender.js', 'art/build/render.py', '--', path.join(SRC, 'hero_kit' + blend + '.blend'), out, '--anims', clips.join(','), '--dirs', '8', '--frames', clips.map(c => c + '=' + FR[c]).join(','), '--layers', layers.join(','),
      '--px', '2', '--style', 'cel', '--scene', 'day', '--keep', '1'].concat(own ? OWN_ARGS : ['--size', '160', '--ortho', '2.02']);
    const log = fs.openSync(path.join(R, dir + '.log'), 'w'), p = spawn(process.execPath, a, { stdio: ['ignore', log, log] }); running++;
    console.log('job', n, dir, layers.join(' '), '(' + clips.length + ' clips)');
    p.on('exit', code => { running--; if (code) { failed++; console.log('job', n, dir, 'FAILED with', code); } else console.log('job', n, dir, 'done after', Math.round((Date.now() - t0) / 1000), 's'); start(); if (!running) join(); });
  }
}
function join() {
  // the frames into the two folders, in the order that lets the grip files win where they should
  for (const d of [MAIN, OWNDIR]) { fs.mkdirSync(d, { recursive: true }); for (const f of fs.readdirSync(d)) fs.unlinkSync(path.join(d, f)); }
  const metas = { main: null, own: null }, layers = { main: new Set(), own: new Set() };
  for (const [dir, , , , own] of J) {
    const src = path.join(R, dir); if (!fs.existsSync(src)) continue;
    const dst = own ? OWNDIR : MAIN, key = own ? 'own' : 'main', north = dir === 'k_rest' ? new Set(['swordWood', 'swordMetal', 'seaxWood', 'seaxMetal', 'knifeWood', 'knifeMetal', 'clubWood']) : null;
    for (const f of fs.readdirSync(src)) {
      if (!/\.png$/.test(f)) continue; const m = /^(.+)_([A-Za-z0-9]+)_(s|sw|w|nw|n|ne|e|se)_\d\d\.png$/.exec(f); if (!m) continue;
      if (north && m[3] === 'n' && north.has(m[2])) continue;               // the old grip facing north (k_north) stays
      if (OBSOLETE.has(m[2])) continue;                                    // the first cap, helm and hood: replaced
      fs.copyFileSync(path.join(src, f), path.join(dst, f)); layers[key].add(m[2]);
    }
    const mf = path.join(src, 'meta.json'); if (!fs.existsSync(mf)) continue; const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
    if (!metas[key]) metas[key] = m; else for (const a in m.anims) if (!metas[key].anims[a]) metas[key].anims[a] = m.anims[a];
  }
  for (const [key, dst, order] of [['main', MAIN, ALL], ['own', OWNDIR, OWN]]) { const m = metas[key]; if (!m) continue; const o = {}; order.forEach(a => { if (m.anims[a]) o[a] = m.anims[a]; }); m.anims = o; m.layers = [...layers[key]]; fs.writeFileSync(path.join(dst, 'meta.json'), JSON.stringify(m, null, 1)); }
  console.log(failed ? failed + ' job(s) failed;' : 'all rendered;', 'joined:', fs.readdirSync(MAIN).length, 'files in', MAIN + ',', fs.readdirSync(OWNDIR).length, 'in', OWNDIR, 'after', Math.round((Date.now() - t0) / 1000), 's');
}
if (JOIN) join(); else { let total = 0; for (const [, , clips, layers] of J) total += clips.reduce((s, c) => s + FR[c], 0) * 8 * layers.length; console.log(J.length, 'jobs,', total, 'frames'); start(); }
