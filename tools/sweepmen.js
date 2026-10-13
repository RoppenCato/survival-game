// Tries settings of the men's numbers against the hero's bots, one after another, and prints a table (2026-10-13, combat rung 3:
// the men retuned to the slower hero). Each setting runs `tests/battle.js ladder n` with MEN set and pulls the won share, the health
// left and the time out of every line. The ladder's lines: the tapper, the careful and the skilled bot with a flint sword against
// an axe in leather; the careful bot against an axe in mail; the careful and the skilled bot with an iron sword against two axes;
// the careful bot against two with a friend; the careful and the skilled bot with four friends against five; five against five.
//   node tools/sweepmen.js [fights a line] [settings as JSON, one object a setting]
//   node tools/sweepmen.js 40 '{"hpK":0.5}' '{"hpK":0.5,"dmg":10}'
// With no settings given, SETTINGS below is tried.
const { spawnSync } = require('child_process');
const N = +process.argv[2] || 40;
const given = process.argv.slice(3).map(s => JSON.parse(s));
const SETTINGS = given.length ? given : [{}, { hpK: 0.7 }, { hpK: 0.5 }, { hpK: 0.4 }, { dmg: 10 }, { hpK: 0.5, dmg: 10 }, { hpK: 0.6, dmg: 11 }];
const COLS = ['tapper with a flint sword', 'careful with a flint sword against an axe in leather', 'skilled with a flint sword', 'careful with a flint sword against an axe in mail', 'careful, iron sword, against two', 'skilled, iron sword, against two', 'careful against two axes, with a friend', 'careful with four friends', 'skilled with four friends', 'five against five'];
const SHORT = ['tap v1', 'care v1', 'skill v1', 'care v mail', 'care v2', 'skill v2', 'care+1 v2', 'care+4 v5', 'skill+4 v5', '5 v 5'];
function cell(out, label) {
  const l = out.split('\n').find(l => l.indexOf(label) >= 0); if (!l) return '?';
  const w = /won\s+(\d+)%/.exec(l), hp = /left\s+(\S+)/.exec(l), t = /in\s+(\S+)s/.exec(l);
  return (w ? w[1] + '%' : '?') + (hp && hp[1] !== '-' ? ' ' + hp[1] + 'hp' : '') + (t && t[1] !== '-' ? ' ' + t[1] + 's' : '') + (/!!/.test(l) ? ' !!' : '');
}
console.log('fights a line: ' + N + ' (' + Math.round(N / 2) + ' for the fives). Each cell: won, the hero\'s health left when he won, the time a won fight took.');
console.log('setting'.padEnd(26) + ' | ' + SHORT.map(s => s.padEnd(13)).join(' | '));
for (const men of SETTINGS) {
  const env = Object.assign({}, process.env, { MEN: JSON.stringify(men) });
  const t0 = Date.now(), r = spawnSync(process.execPath, ['tests/battle.js', 'ladder', String(N)], { env, encoding: 'utf8', maxBuffer: 1 << 26 });
  const out = r.stdout || '';
  const name = Object.keys(men).length ? Object.keys(men).map(k => k + ' ' + men[k]).join(', ') : 'as it is';
  console.log(name.padEnd(26) + ' | ' + COLS.map(c => cell(out, c).padEnd(13)).join(' | ') + '   (' + Math.round((Date.now() - t0) / 1000) + ' s)');
}
