// Bundles a folder of the sound studio's WAVs into one script for the game (2026-10-15; src/sfx.js plays them).
// Every <name>_<n>.wav is a variation of <name>. A manifest beside them (<name>.json, or one manifest.json for the folder)
// may give a sound's level: "gain" (linear) or "gain_db"; without one it plays at 1. Each sound's "peak" (when its loudest
// 10 ms comes, in seconds, the mean of its variations) is measured here: the game starts a swing so that moment lands on contact.
// Usage: node tools/sfxjs.js <folder>[|<folder>...] <set> [only,these,names]   (writes assets/sfx/<set>.js)
// WAV, MP3 or OGG; a WAV's peak is measured here, any other's by src/sfx.js once it is decoded.
// The game's set: node tools/sfxjs.js "C:\dev\SG Sound\out\sfx\combat|assets/sfx/robin" combat
// The combat set came from the studio's out/sfx/combat (C:\dev\SG Sound).
const fs = require('fs'), path = require('path');
const [dir, set, only] = process.argv.slice(2);
if (!dir || !set) { console.log('usage: node tools/sfxjs.js <folder> <set> [only,these,names]'); process.exit(1); }
const want = only ? new Set(only.split(',')) : null;
const files = {}, gain = {}, count = {}, peakSum = {}, peakf = {}, label = {}, layers = {};
function peakOf(buf) {   // a 16-bit PCM WAV: the time of its loudest 10 ms
  let o = 12, sr = 48000, ch = 1, data = null;
  while (o + 8 <= buf.length) { const id = buf.toString('ascii', o, o + 4), n = buf.readUInt32LE(o + 4); if (id === 'fmt ') { ch = buf.readUInt16LE(o + 10); sr = buf.readUInt32LE(o + 12); } if (id === 'data') { data = buf.subarray(o + 8, o + 8 + n); break; } o += 8 + n + (n & 1); }
  if (!data) return 0; const N = Math.floor(data.length / 2 / ch), w = Math.round(sr * 0.01); let best = -1, at = 0;
  for (let s0 = 0; s0 + w <= N; s0 += Math.round(w / 2)) { let e = 0; for (let i = s0; i < s0 + w; i++) { const v = data.readInt16LE(i * 2 * ch); e += v * v; } if (e > best) { best = e; at = s0 + w / 2; } }
  return at / sr;
}
function gainOf(j) { if (j == null) return null; if (typeof j.gain === 'number') return j.gain; if (typeof j.gain_db === 'number') return Math.pow(10, j.gain_db / 20); if (typeof j.relative_gain_db === 'number') return Math.pow(10, j.relative_gain_db / 20); if (typeof j.gainDb === 'number') return Math.pow(10, j.gainDb / 20); return null; }
const dirs = dir.split('|');
const all = [].concat(...dirs.map(d => fs.readdirSync(d).map(f => path.join(d, f))));
for (const fp of all.filter(f => /\.json$/i.test(f))) {
  let j; try { j = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) { continue; }
  const one = gainOf(j); if (one != null && j.name) gain[j.name] = one;
  const list = j.sounds || j.gains || null;
  if (list && typeof list === 'object') for (const k of Object.keys(list)) { const v = typeof list[k] === 'number' ? list[k] : gainOf(list[k]); if (v != null) gain[k] = v; if (list[k] && list[k].label) label[k] = list[k].label; }
  if (j.layers && typeof j.layers === 'object') for (const k of Object.keys(j.layers)) layers[k] = j.layers[k];   // a sound made of others played together: { parts: [[name, gain, delay]], label }
}
for (const fp of all.filter(f => /_\d+\.(wav|mp3|ogg)$/i.test(f)).sort()) {
  const f = path.basename(fp), wavf = /\.wav$/i.test(f), key = f.replace(/\.(wav|mp3|ogg)$/i, ''), name = key.replace(/_\d+$/, '');
  if (want && !want.has(name)) continue;
  const raw = fs.readFileSync(fp);
  files[key] = raw.toString('base64');
  count[name] = (count[name] || 0) + 1;
  if (wavf) { const pk = peakOf(raw); peakSum[name] = (peakSum[name] || 0) + pk; peakf[key] = Math.round(pk * 1000) / 1000; }
}
for (const k of Object.keys(gain)) if (!count[k]) delete gain[k];
for (const k of Object.keys(label)) if (!count[k]) delete label[k];
for (const k of Object.keys(layers)) if (!layers[k].parts.every(pt => count[pt[0]])) delete layers[k];
const peak = {}; for (const k of Object.keys(count)) if (peakSum[k] != null) peak[k] = Math.round(peakSum[k] / count[k] * 1000) / 1000;
const out = path.join(__dirname, '..', 'assets', 'sfx', set + '.js');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, '(window.__SFX = window.__SFX || {})[' + JSON.stringify(set) + '] = ' + JSON.stringify({ gain, peak, peakf, label, layers, files }) + ';\n');
console.log('wrote ' + out + ' (' + Math.round(fs.statSync(out).size / 1024) + ' KB): ' + Object.keys(count).map(n => n + ' x' + count[n] + (gain[n] != null ? ' @' + gain[n].toFixed(2) : '') + (peak[n] != null ? ' peak ' + Math.round(peak[n] * 1000) + 'ms' : ' peak on decoding')).join(', '));
