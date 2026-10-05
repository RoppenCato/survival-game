// Render a song to a WAV file without a browser, to listen to it anywhere:
//   node tools/render-song.js meadowDay 60 out.wav [danger]
// Needs the package node-web-audio-api (not a project dependency: `npm i node-web-audio-api` somewhere on
// NODE_PATH, or in the folder you run from).
var path = require('path'), fs = require('fs');
var wa = require('node-web-audio-api');
var Music = require(path.join(__dirname, '..', 'src', 'music.js'));
var id = process.argv[2] || 'meadowDay', secs = +(process.argv[3] || 60), out = process.argv[4] || id + '.wav', danger = process.argv[5] === 'danger';
var song = Music.SONGS[id]; if (!song) { console.error('no song ' + id + '; have ' + Object.keys(Music.SONGS).join(', ')); process.exit(1); }
var sr = 44100, ctx = new wa.OfflineAudioContext(2, Math.floor(sr * secs), sr);
Music.render(ctx, song, secs, danger ? { calm: 0.15, danger: 1 } : { calm: 1, danger: 0 });
ctx.startRendering().then(function (buf) {
  var n = buf.length, L = buf.getChannelData(0), R = buf.getChannelData(1), peak = 0, i;
  for (i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  var g = peak > 0 ? 0.89 / peak : 1, b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (i = 0; i < n; i++) { b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4); b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4); }
  fs.writeFileSync(out, b); console.log('wrote ' + out + ' (' + secs + ' s, peak ' + peak.toFixed(2) + ')');
});
