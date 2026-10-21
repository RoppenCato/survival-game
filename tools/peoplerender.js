// Renders every layer of the people (art/source/people.blend, from art/build/people_build.py) into art/render/people,
// several Blender processes at a time (2026-10-12, docs/battle-plan.md rung 0).   node tools/peoplerender.js [jobs at once]
// A layer is rendered for the clips it shows in: the body, its tunic and trousers, the hair, beards, hats, mail, the cloak,
// the dress and the shield for every clip; a thing for the hand for the clips a hand holds it in. A frame already on disk
// is left as it is (render.py --keep 1), so a stopped run goes on where it stopped, and a clip is rendered again by
// deleting its frames. Each process writes its own numbers (--meta) and they are joined into meta.json at the end, so no
// run overwrites what another said about a clip. Then: node tools/people.js
const { spawn } = require('child_process'); const fs = require('fs'); const path = require('path');
const OUT = path.join('art', 'render', 'people'), BLEND = path.join('art', 'source', 'people.blend');
const FR = { idle: 16, idle_look: 18,      // 2026-10-20 (the studio, the memory budget): the idles halved from 32 and 36
  walk: 10, run: 8, attack1: 10, attack2: 10, chop: 10, mine: 10, hit: 5, death: 10, block: 3, sit: 4, pickup: 8, interact: 6, bow_draw: 5, bow_shoot: 4,
  hammer: 12, saw: 12, carry: 2, carry_walk: 10, kneel: 8, sit_work: 4,
  row: 8, helm: 8 };   // the ships' clips (the Art Director, 2026-10-21: art/build/rowing_build.py on people.blend after the folk build; no hand things)   // the work clips (the Art Director's step 5B, 2026-10-20: art/build/folk_build.py keys them on people.blend)
// The death is rendered in a frame of its own (2026-10-13): a man falling backward ends two metres from where he stood and
// out of the frame every other clip fits in, so the dead lay with half their bodies cut off. Jobs 8 to 11 render it larger
// (--size 208), looking lower (--aim 0.6) and held over its spot (--inplace death) into art/render/people_own, with numbers
// of its own; tools/people.js packs what lies there with its own frame.   node tools/peoplerender.js 4 8,9,10,11
const OWN = ['death'], OWN_OUT = path.join('art', 'render', 'people_own'), OWN_ARGS = ['--size', '208', '--ortho', '2.626', '--aim', '0.6', '--inplace', OWN.join(',')];
const ALL = Object.keys(FR).filter(c => OWN.indexOf(c) < 0), ARMED = ['idle', 'walk', 'run', 'attack1', 'attack2', 'chop', 'mine', 'hit', 'block'], BOW = ['idle', 'walk', 'run', 'bow_draw', 'bow_shoot'];
const JOBS = [
  [ALL, ['body', 'tunic', 'legs', 'hairA']], [ALL, ['hairB', 'hairC', 'beardA', 'beardB']], [ALL, ['hood', 'cap', 'helm', 'mail']], [ALL, ['cloak', 'dress', 'shieldRim', 'shieldFace']],
  [ARMED, ['swordWood', 'swordMetal', 'axeWood', 'axeMetal']], [ARMED, ['clubWood', 'seaxWood', 'seaxMetal', 'spearWood']], [ARMED, ['spearMetal', 'greataxeWood', 'greataxeMetal']], [BOW, ['bowWood']],
  [ALL, ['apron', 'kerchief', 'strawHat']], [['hammer'], ['hammerWood', 'hammerMetal']], [['saw'], ['sawWood', 'sawMetal']], [['carry', 'carry_walk'], ['bucketWood']],   // step 5B: the clothes by role and the things of the work
  [OWN, ['body', 'tunic', 'legs', 'hairA'], 1], [OWN, ['hairB', 'hairC', 'beardA', 'beardB'], 1], [OWN, ['hood', 'cap', 'helm', 'mail'], 1], [OWN, ['cloak', 'dress', 'shieldRim', 'shieldFace'], 1]
];
const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null;       // a third argument picks jobs by number: 4,5,6,7 for the things in the hand
const AT_ONCE = +process.argv[2] || 4; fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(OWN_OUT, { recursive: true });
let next = 0, running = 0, failed = 0; const t0 = Date.now();
function start() {
  while (running < AT_ONCE && next < JOBS.length) {
    const n = next++; if (only && only.indexOf(n) < 0) continue;
    const [clips, layers, own] = JOBS[n], frames = clips.map(c => c + '=' + FR[c]).join(',');
    const args = ['tools/blender.js', 'art/build/render.py', '--', BLEND, own ? OWN_OUT : OUT, '--anims', clips.join(','), '--dirs', '8', '--frames', frames, '--layers', layers.join(','), '--px', '2', '--style', 'cel', '--scene', 'day', '--keep', '1', '--meta', 'meta_' + n + '.json'].concat(own ? OWN_ARGS : ['--size', '160', '--ortho', '2.02']);
    const log = fs.openSync(path.join('art', 'render', 'people_' + n + '.log'), 'w'), p = spawn(process.execPath, args, { stdio: ['ignore', log, log] }); running++;
    console.log('job', n, layers.join(' '), '(' + clips.length + ' clips)');
    p.on('exit', code => { running--; if (code) { failed++; console.log('job', n, 'FAILED with', code, '(see art/render/people_' + n + '.log)'); } else console.log('job', n, 'done after', Math.round((Date.now() - t0) / 1000), 's'); start(); if (!running && next >= JOBS.length) finish(); });
  }
}
function finish() {
  // the numbers: every clip from whichever run named it (a clip's numbers are the same in every run: the same rig, the same frames); the clips with a frame of their own have a folder and numbers of their own
  [[OUT, 0, ALL], [OWN_OUT, 1, OWN]].forEach(([dir, own, order]) => {
    let meta = null; const layers = [];
    for (let n = 0; n < JOBS.length; n++) { if (!!JOBS[n][2] !== !!own) continue; const f = path.join(dir, 'meta_' + n + '.json'); if (!fs.existsSync(f)) continue; const m = JSON.parse(fs.readFileSync(f, 'utf8')); if (!meta) meta = m; else for (const a in m.anims) if (!meta.anims[a]) meta.anims[a] = m.anims[a]; m.layers.forEach(l => { if (layers.indexOf(l) < 0) layers.push(l); }); }
    if (meta) { const ordered = {}; order.forEach(a => { if (meta.anims[a]) ordered[a] = meta.anims[a]; }); meta.anims = ordered; meta.layers = layers; fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 1)); }
  });
  console.log(failed ? failed + ' job(s) failed' : 'all rendered', 'in', Math.round((Date.now() - t0) / 1000), 's;', fs.readdirSync(OUT).filter(f => /\.png$/.test(f)).length, 'frames in', OUT + ',', fs.readdirSync(OWN_OUT).filter(f => /\.png$/.test(f)).length, 'in', OWN_OUT); process.exit(failed ? 1 : 0);
}
start(); if (!running) finish();
