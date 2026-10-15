// Bundles a folder of the sound studio's WAVs into one script for the game (2026-10-15; src/sfx.js plays them).
// Every <name>_<n>.wav is a variation of <name>. A manifest beside them (<name>.json, or one manifest.json for the folder)
// may give a sound's level: "gain" (linear) or "gain_db"; without one it plays at 1.
// Usage: node tools/sfxjs.js <folder> <set> [only,these,names]   (writes assets/sfx/<set>.js)
// The combat set came from the studio's out/sfx/combat (C:\dev\SG Sound).
const fs = require('fs'), path = require('path');
const [dir, set, only] = process.argv.slice(2);
if (!dir || !set) { console.log('usage: node tools/sfxjs.js <folder> <set> [only,these,names]'); process.exit(1); }
const want = only ? new Set(only.split(',')) : null;
const files = {}, gain = {}, count = {};
function gainOf(j) { if (j == null) return null; if (typeof j.gain === 'number') return j.gain; if (typeof j.gain_db === 'number') return Math.pow(10, j.gain_db / 20); if (typeof j.relative_gain_db === 'number') return Math.pow(10, j.relative_gain_db / 20); if (typeof j.gainDb === 'number') return Math.pow(10, j.gainDb / 20); return null; }
const all = fs.readdirSync(dir);
for (const f of all.filter(f => /\.json$/i.test(f))) {
  let j; try { j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { continue; }
  const one = gainOf(j); if (one != null && j.name) gain[j.name] = one;
  const list = j.sounds || j.gains || null;
  if (list && typeof list === 'object') for (const k of Object.keys(list)) { const v = typeof list[k] === 'number' ? list[k] : gainOf(list[k]); if (v != null) gain[k] = v; }
}
for (const f of all.filter(f => /_\d+\.wav$/i.test(f)).sort()) {
  const key = f.replace(/\.wav$/i, ''), name = key.replace(/_\d+$/, '');
  if (want && !want.has(name)) continue;
  files[key] = fs.readFileSync(path.join(dir, f)).toString('base64');
  count[name] = (count[name] || 0) + 1;
}
for (const k of Object.keys(gain)) if (!count[k]) delete gain[k];
const out = path.join(__dirname, '..', 'assets', 'sfx', set + '.js');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, '(window.__SFX = window.__SFX || {})[' + JSON.stringify(set) + '] = ' + JSON.stringify({ gain, files }) + ';\n');
console.log('wrote ' + out + ' (' + Math.round(fs.statSync(out).size / 1024) + ' KB): ' + Object.keys(count).map(n => n + ' x' + count[n] + (gain[n] != null ? ' @' + gain[n].toFixed(2) : '')).join(', '));
