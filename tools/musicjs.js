// Wraps a music file in a script, so the game can load it from disk as well as from the server (2026-10-15).
// A page opened from file:// (npm start) may not fetch a file beside it, but it may load a <script>: the file's bytes go into
// window.__MUSIC[name] as base64, and Music.loadTrack decodes them (src/music.js).
// Usage: node tools/musicjs.js <file.mp3> <name>   (writes assets/music/<name>.js)
// The meadow by day and by night came from the sound studio: C:\dev\SG Sound\out\music\meadow-day-v3\full.mp3 (name meadow-day)
// and meadow-night-v3\full.mp3 (name meadow-night).
const fs = require('fs'), path = require('path');
const [src, name] = process.argv.slice(2);
if (!src || !name) { console.log('usage: node tools/musicjs.js <file.mp3> <name>'); process.exit(1); }
const b64 = fs.readFileSync(src).toString('base64');
const out = path.join(__dirname, '..', 'assets', 'music', name + '.js');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, '(window.__MUSIC = window.__MUSIC || {})[' + JSON.stringify(name) + '] = "' + b64 + '";\n');
console.log('wrote ' + out + ' (' + Math.round(fs.statSync(out).size / 1024) + ' KB)');
