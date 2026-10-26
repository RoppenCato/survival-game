// Lists the functions a template defines that its built page names only once (nothing calls them): the cleanup's dead-code check
// (.claude/skills/cleanup, 2026-10-26).   node tools/unusedcheck.js            (every page)
//   node tools/unusedcheck.js templates/game.html dist/game.html   (one page)
const fs = require('fs');
const PAIRS = [['game', 'game'], ['combat', 'combat-arena'], ['art', 'art-editor'], ['village', 'village-editor'], ['sea', 'sea-editor'], ['runes', 'rune-browser'], ['monsters', 'world-monsters'], ['index', 'index']];
const args = process.argv.slice(2), jobs = args.length ? [args] : PAIRS.map(p => ['templates/' + p[0] + '.html', 'dist/' + p[1] + '.html']);
for (const [tpl, page] of jobs) {
const t = fs.readFileSync(tpl, 'utf8'), s = fs.readFileSync(page, 'utf8');
const re = /function ([A-Za-z_$][\w$]*)\s*\(/g; let m; const names = new Set();
while ((m = re.exec(t))) names.add(m[1]);
const out = [];
for (const n of names) {
  const esc = n.replace(/\$/g, '\\$');
  const c = (s.match(new RegExp('(^|[^\\w$.])' + esc + '(?![\\w$])', 'g')) || []).length;
  const dotted = (s.match(new RegExp('\\.' + esc + '(?![\\w$])', 'g')) || []).length;
  if (c + dotted <= 1) out.push(n);
}
console.log(page + ': ' + out.length + ' unused' + (out.length ? ': ' + out.join(' ') : ''));
}
