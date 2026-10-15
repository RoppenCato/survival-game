/* Music: songs as data, played by a small sequencer through synthesized General-MIDI-style voices (Web Audio).
   The style is early MapleStory: a small set of clearly defined instruments, playful melodies, light jazz colour.
   A song: { name, bpm, key, chords: ['F', 'Dm7', ...] one per bar, tracks: [...] }
   A track is either written notes ({ inst, notes: 'F4:q A4:e r:e ...', vol, tag }) or a pattern played from the
   chords ({ inst, pattern: 'arp'|'pad'|'bass'|'comp'|'pulse'|'shaker'|'rim'|'kick', vol, tag, oct }).
   tag: 'calm' plays in peace, 'danger' in a fight, none always; the game fades the layers (Music.layer).
   Notes: name+octave:length, lengths w h q e s (dotted with .), rests r:q, chords F4+A4+C5:h, velocity @70.
   Music.midi(song) returns a standard MIDI file (Uint8Array) of the same song for a DAW. */
var Music = (function () {
'use strict';
var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
var LEN = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
var GM = { piano: 0, flute: 73, clarinet: 71, celesta: 8, musicbox: 10, harp: 46, strings: 48, bass: 32, shaker: 82, rim: 37, kick: 36 };
var INSTS = ['piano', 'flute', 'clarinet', 'celesta', 'musicbox', 'harp', 'strings', 'bass'];
var PATTERNS = ['arp', 'pad', 'bass', 'comp', 'pulse', 'shaker', 'rim', 'kick'];
function midi(name) {                       // 'F#4' -> 66
  var m = /^([A-G])([#b]?)(-?\d)$/.exec(name); if (!m) return null;
  return 12 * (parseInt(m[3], 10) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
function freq(n) { return 440 * Math.pow(2, (n - 69) / 12); }
// a chord symbol to midi pitches round middle C: F, Dm7, Bb, C7, Fmaj7, Gsus, Bdim, F6, F/A
function chord(sym) {
  var m = /^([A-G][#b]?)(maj7|m7|m|7|sus|dim|6)?(?:\/([A-G][#b]?))?$/.exec(sym); if (!m) return { root: 60, notes: [60, 64, 67], bass: 48 };
  var r = midi(m[1] + '4'), q = m[2] || '', iv = [0, 4, 7];
  if (q === 'm' || q === 'm7') iv[1] = 3; if (q === 'dim') { iv[1] = 3; iv[2] = 6; } if (q === 'sus') iv[1] = 5;
  if (q === '7' || q === 'm7') iv.push(10); if (q === 'maj7') iv.push(11); if (q === '6') iv.push(9);
  var b = m[3] ? midi(m[3] + '3') : r - 12;
  return { root: r, notes: iv.map(function (i) { return r + i; }), bass: b };
}
// written notes to events [{ t (beats), d (beats), n (midi), v }]
function parse(str) {
  var t = 0, out = [], toks = str.replace(/\|/g, ' ').trim().split(/\s+/), i;
  for (i = 0; i < toks.length; i++) {
    var tk = toks[i]; if (!tk) continue;
    var m = /^([^:@]+):([whqes]\.?)(?:@(\d+))?$/.exec(tk); if (!m) continue;
    var d = LEN[m[2][0]] * (m[2].length > 1 ? 1.5 : 1), v = m[3] ? +m[3] : 80;
    if (m[1] !== 'r') m[1].split('+').forEach(function (nm) { var n = midi(nm); if (n != null) out.push({ t: t, d: d, n: n, v: v }); });
    t += d;
  }
  return out;
}
// a pattern played from the chords, one bar each
function pattern(kind, chords, oct) {
  var out = [], b, o = (oct || 0) * 12;
  function add(t, d, n, v) { out.push({ t: t, d: d, n: n + o, v: v }); }
  for (b = 0; b < chords.length; b++) {
    var c = chord(chords[b]), t0 = b * 4, ns = c.notes.slice(0, 3), i;
    if (kind === 'arp') { var seq = [ns[0], ns[1], ns[2], ns[1] + 12, ns[0] + 12, ns[1] + 12, ns[2], ns[1]]; for (i = 0; i < 8; i++) add(t0 + i * 0.5, 0.55, seq[i], i % 4 === 0 ? 68 : 54); }
    else if (kind === 'pad') ns.forEach(function (n) { add(t0, 4, n, 46); });
    else if (kind === 'bass') { add(t0, 1, c.bass, 78); add(t0 + 1.5, 0.5, c.bass, 58); add(t0 + 2, 1, c.bass + 7, 70); add(t0 + 3, 0.5, c.bass + 7, 52); add(t0 + 3.5, 0.5, c.bass, 56); }
    else if (kind === 'comp') { for (i = 0; i < 4; i++) ns.forEach(function (n) { add(t0 + i + 0.5, 0.4, n, i % 2 ? 48 : 56); }); }
    else if (kind === 'pulse') { for (i = 0; i < 8; i++) add(t0 + i * 0.5, 0.28, (i % 2 ? ns[1] : ns[0]) - 12, 66); }
    else if (kind === 'shaker') { for (i = 0; i < 8; i++) add(t0 + i * 0.5, 0.2, 82, i % 2 ? 40 : 60); }
    else if (kind === 'rim') { add(t0 + 1, 0.2, 37, 62); add(t0 + 3, 0.2, 37, 62); }
    else if (kind === 'kick') { add(t0, 0.3, 36, 84); add(t0 + 2, 0.3, 36, 70); add(t0 + 3.5, 0.3, 36, 48); }
  }
  return out;
}
function events(song, tr) {               // a track's events, transposed
  var ev = tr.notes != null ? parse(tr.notes) : pattern(tr.pattern, song.chords, tr.oct), tp = (song.transpose || 0) + (tr.transpose || 0);
  if (tp && !tr.drum && tr.pattern !== 'shaker' && tr.pattern !== 'rim' && tr.pattern !== 'kick') ev = ev.map(function (e) { return { t: e.t, d: e.d, n: e.n + tp, v: e.v }; });
  return ev;
}
function length(song) { var L = song.chords.length * 4; song.tracks.forEach(function (tr) { if (tr.notes != null) parse(tr.notes).forEach(function (e) { L = Math.max(L, e.t + e.d); }); }); return L; }

/* ---------- the voices ---------- */
var ctx = null, master = null, verb = null, wet = null, layerGain = {}, vol = 0.8;
function ac() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  var A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
  ctx = new A(); master = ctx.createGain(); master.gain.value = vol; master.connect(ctx.destination);
  // the music belongs to the page: it goes quiet when the window loses focus or is hidden, and comes back when it is looked at again
  var away = false;
  function hush(on) { if (on === away || !master) return; away = on; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(on ? 0 : vol, ctx.currentTime, 0.15); }
  window.addEventListener('blur', function () { hush(true); }); window.addEventListener('focus', function () { hush(false); });
  document.addEventListener('visibilitychange', function () { hush(document.hidden || !document.hasFocus()); });
  if (!document.hasFocus()) hush(true);
  verb = ctx.createConvolver(); var n = Math.floor(ctx.sampleRate * 1.8), buf = ctx.createBuffer(2, n, ctx.sampleRate), ch;
  for (ch = 0; ch < 2; ch++) { var d = buf.getChannelData(ch); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
  verb.buffer = buf; wet = ctx.createGain(); wet.gain.value = 0.22; verb.connect(wet); wet.connect(master);
  return ctx;
}
function layer(tag) { if (!layerGain[tag]) { layerGain[tag] = ctx.createGain(); layerGain[tag].gain.value = tag === 'danger' ? 0 : 1; layerGain[tag].connect(master); layerGain[tag].connect(verb); } return layerGain[tag]; }
function env(g, t, a, d, s, r, dur, peak) {        // an envelope on a gain node
  var p = peak == null ? 1 : peak; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(p, t + a); g.gain.linearRampToValueAtTime(p * s, t + a + d);
  var end = Math.max(t + a + d, t + dur); g.gain.setValueAtTime(p * s, end); g.gain.exponentialRampToValueAtTime(0.0001, end + r); return end + r;
}
function osc(type, f, t, end, detune) { var o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (detune) o.detune.value = detune; o.start(t); o.stop(end + 0.05); return o; }
var VOICES = {
  piano: function (dest, f, t, dur, v) {
    var g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800 + v * 30;
    var end = env(g, t, 0.004, 0.25 + 0.4 * (1 - v / 127), 0.35, 0.3, Math.min(dur, 2.5), v / 127 * 0.5);
    osc('triangle', f, t, end).connect(g); osc('sine', f * 2, t, end, 3).connect(g); var s = osc('sawtooth', f, t, end); var sg = ctx.createGain(); sg.gain.value = 0.08; s.connect(sg); sg.connect(g);
    g.connect(lp); lp.connect(dest);
  },
  flute: function (dest, f, t, dur, v) {
    var g = ctx.createGain(), end = env(g, t, 0.06, 0.1, 0.8, 0.12, dur, v / 127 * 0.42);
    var o = osc('sine', f, t, end), o2 = osc('triangle', f, t, end); var g2 = ctx.createGain(); g2.gain.value = 0.25;
    var lfo = osc('sine', 5.2, t, end), lg = ctx.createGain(); lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest);
    var n = ctx.createBufferSource(), nb = ctx.createBuffer(1, 2205, ctx.sampleRate), nd = nb.getChannelData(0); for (var i = 0; i < 2205; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / 2205);
    n.buffer = nb; var ng = ctx.createGain(); ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(v / 127 * 0.025, t + 0.015); var hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = f * 2; n.connect(hp); hp.connect(ng); ng.connect(dest); n.start(t);
  },
  clarinet: function (dest, f, t, dur, v) {
    var g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; var end = env(g, t, 0.05, 0.1, 0.85, 0.1, dur, v / 127 * 0.22);
    var o = osc('square', f, t, end), lfo = osc('sine', 4.8, t, end), lg = ctx.createGain(); lg.gain.value = f * 0.004; lfo.connect(lg); lg.connect(o.frequency);
    o.connect(g); g.connect(lp); lp.connect(dest);
  },
  celesta: function (dest, f, t, dur, v) {
    var g = ctx.createGain(), end = env(g, t, 0.003, 0.5, 0.15, 0.5, Math.min(dur, 1.2), v / 127 * 0.45);
    osc('sine', f, t, end).connect(g); var h = osc('sine', f * 4, t, end), hg = ctx.createGain(); hg.gain.value = 0.18; h.connect(hg); hg.connect(g); g.connect(dest);
  },
  musicbox: function (dest, f, t, dur, v) {
    var g = ctx.createGain(), end = env(g, t, 0.002, 0.7, 0.08, 0.6, Math.min(dur, 1.4), v / 127 * 0.4);
    osc('sine', f, t, end).connect(g); var h = osc('sine', f * 5.9, t, end), hg = ctx.createGain(); hg.gain.value = 0.07; h.connect(hg); hg.connect(g);
    var h2 = osc('sine', f * 2, t, end), hg2 = ctx.createGain(); hg2.gain.value = 0.2; h2.connect(hg2); hg2.connect(g); g.connect(dest);
  },
  harp: function (dest, f, t, dur, v) {
    var g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3000, t); lp.frequency.exponentialRampToValueAtTime(600, t + 0.6);
    var end = env(g, t, 0.003, 0.35, 0.2, 0.4, Math.min(dur, 1.5), v / 127 * 0.45);
    osc('triangle', f, t, end).connect(g); osc('sine', f * 2, t, end).connect(g); g.connect(lp); lp.connect(dest);
  },
  strings: function (dest, f, t, dur, v) {
    var g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; var end = env(g, t, 0.35, 0.3, 0.8, 0.5, dur, v / 127 * 0.14);
    [-7, 0, 7].forEach(function (dt) { var o = osc('sawtooth', f, t, end, dt); var lfo = osc('sine', 4.5 + Math.random(), t, end), lg = ctx.createGain(); lg.gain.value = f * 0.003; lfo.connect(lg); lg.connect(o.frequency); o.connect(g); });
    g.connect(lp); lp.connect(dest);
  },
  bass: function (dest, f, t, dur, v) {
    var g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; var end = env(g, t, 0.006, 0.3, 0.4, 0.15, Math.min(dur, 1.2), v / 127 * 0.7);
    osc('sine', f, t, end).connect(g); var o2 = osc('triangle', f, t, end), g2 = ctx.createGain(); g2.gain.value = 0.4; o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(dest);
  },
  drum: function (dest, n, t, v) {
    var g = ctx.createGain(); g.gain.value = v / 127;
    if (n === 36) { var o = osc('sine', 120, t, t + 0.3); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); var kg = ctx.createGain(); kg.gain.setValueAtTime(0.001, t); kg.gain.linearRampToValueAtTime(0.6, t + 0.004); kg.gain.exponentialRampToValueAtTime(0.001, t + 0.28); o.connect(kg); kg.connect(g); }
    else { var len = n === 37 ? 0.06 : 0.09, nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate), d = nb.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      var s = ctx.createBufferSource(); s.buffer = nb; var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = n === 37 ? 1400 : 6500; bp.Q.value = n === 37 ? 1.5 : 0.8; var ng = ctx.createGain(); ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(n === 37 ? 0.32 : 0.16, t + 0.004); s.connect(bp); bp.connect(ng); ng.connect(g); s.start(t); }   // a short rise so the hit does not click
    g.connect(dest);
  }
};

/* ---------- the sequencer ---------- */
var cur = null, timer = null, startT = 0, beat = 0, pos = 0, evs = [], loopLen = 0, playing = false;
function prepare(song) {
  evs = []; var L = length(song);
  song.tracks.forEach(function (tr, ti) { if (tr.mute) return; events(song, tr).forEach(function (e) { if (e.t < L) evs.push({ t: e.t, d: e.d, n: e.n, v: e.v * (tr.vol == null ? 1 : tr.vol), inst: tr.inst, tag: tr.tag || '', drum: tr.pattern === 'shaker' || tr.pattern === 'rim' || tr.pattern === 'kick', ti: ti }); }); });
  evs.sort(function (a, b) { return a.t - b.t; }); loopLen = L;
}
function schedule() {
  if (!playing || !cur) return;
  var spb = 60 / cur.bpm, now = ctx.currentTime, ahead = now + 0.25;
  while (startT + evs[pos % evs.length].t * spb + Math.floor(pos / evs.length) * loopLen * spb < ahead) {
    var e = evs[pos % evs.length], loop = Math.floor(pos / evs.length), t = startT + (e.t + loop * loopLen) * spb;
    if (t >= now - 0.05) { var dest = layer(e.tag || 'all'); if (e.drum) VOICES.drum(dest, e.n, t, Math.min(127, e.v)); else (VOICES[e.inst] || VOICES.piano)(dest, freq(e.n), t, e.d * spb, Math.min(127, e.v)); }
    pos++;
    if (!evs.length) break;
  }
}
function play(song, fromBeat) {               // start the song (from a beat, for the editor)
  if (!ac()) return false;
  stop(); cur = song; prepare(song); if (!evs.length) return false;
  var from = Math.max(0, Math.min(loopLen - 0.01, fromBeat || 0)), spb = 60 / song.bpm;
  startT = ctx.currentTime + 0.1 - from * spb; pos = 0; while (pos < evs.length && evs[pos].t < from) pos++;
  playing = true; timer = setInterval(schedule, 50); schedule(); return true;
}
function stop() { playing = false; if (timer) clearInterval(timer); timer = null; }
function restart() { if (cur) play(cur); }
function setLayer(tag, g, secs) { if (!ctx) return; var L = layer(tag); L.gain.cancelScheduledValues(ctx.currentTime); L.gain.setTargetAtTime(g, ctx.currentTime, (secs || 1) / 3); }
/* Recorded tracks (2026-10-15, the sound studio's meadow by day and by night; Robin: "tell the game to use the new meadows day and
   night soundtrack"). A track is a file decoded once (loadTrack: fetch and decodeAudioData, kept by its url) and played as a
   looping buffer through its own gain into the same master as the songs, so the volume, the hush on a lost focus and a hidden
   page all apply. playTrack(url, o) crossfades from whatever track plays (o.fade seconds, the time constant a third of it, as
   setLayer does) and stops a synthesized song if one plays; o.loopStart and o.loopEnd (seconds) say where the loop lies in the
   file (an MP3 carries the encoder's delay ahead of the music: see the game's MUSIC_FILES). stopTrack(fade); releaseTrack(url)
   lets a decoded buffer go; trackPlaying() is the url playing. A failed load answers null, and the page falls back to a song. */
var tracks = {}, cur = null;
function loadTrack(url) {
  if (tracks[url]) return tracks[url];
  var c = ac(); if (!c || typeof fetch === 'undefined') return Promise.resolve(null);
  var bytes = /\.js(\?|$)/.test(url) ? scriptBytes(url) : fetch(url).then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.arrayBuffer(); });   // a .js track is the file wrapped in a script, which loads from disk too (file:// may not fetch)
  tracks[url] = bytes.then(function (ab) { return new Promise(function (res, rej) { c.decodeAudioData(ab, res, rej); }); }).catch(function () { delete tracks[url]; return null; });
  return tracks[url];
}
function scriptBytes(url) {            // tools/musicjs.js wraps a file as window.__MUSIC[name] = base64; the script is added, read and let go
  var name = url.replace(/\?.*$/, '').replace(/^.*\//, '').replace(/\.js$/, ''), G = window.__MUSIC || (window.__MUSIC = {});
  return new Promise(function (res, rej) {
    function take() { var b64 = G[name]; delete G[name]; if (!b64) { rej(new Error('no track')); return; } var bin = atob(b64), n = bin.length, u = new Uint8Array(n); for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i); res(u.buffer); }
    if (G[name]) { take(); return; }
    var sc = document.createElement('script'); sc.src = url; sc.async = true; sc.onload = function () { sc.remove(); take(); }; sc.onerror = function () { sc.remove(); rej(new Error('cannot load ' + url)); }; document.head.appendChild(sc);
  });
}
function fadeOut(t, fade) { if (!t) return; var c = ctx, now = c.currentTime; t.g.gain.cancelScheduledValues(now); t.g.gain.setValueAtTime(t.g.gain.value, now); t.g.gain.setTargetAtTime(0, now, Math.max(0.05, fade / 3)); try { t.src.stop(now + fade * 1.5 + 0.1); } catch (e) {} }
function playTrack(url, o) {
  o = o || {}; var fade = o.fade == null ? 7 : o.fade;
  return loadTrack(url).then(function (buf) {
    if (!buf) return false; var c = ac(); if (!c) return false;
    if (cur && cur.url === url) return true;
    if (playing) stop();                                  // a synthesized song gives way at once
    var src = c.createBufferSource(), g = c.createGain(), now = c.currentTime, ls = o.loopStart || 0, le = o.loopEnd || buf.duration;
    src.buffer = buf; src.loop = true; src.loopStart = ls; src.loopEnd = Math.min(le, buf.duration);
    g.gain.value = 0; src.connect(g); g.connect(master); src.start(now, ls);
    g.gain.setTargetAtTime(1, now, Math.max(0.05, (cur ? fade : (o.fadeIn == null ? 1.5 : o.fadeIn)) / 3));
    fadeOut(cur, fade); cur = { url: url, src: src, g: g };
    return true;
  });
}
function stopTrack(fade) { fadeOut(cur, fade == null ? 0.6 : fade); cur = null; }
function releaseTrack(url) { if (!cur || cur.url !== url) delete tracks[url]; }
function trackPlaying() { return cur ? cur.url : null; }
function setVolume(v) { vol = v; if (master && (typeof document === 'undefined' || document.hasFocus())) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05); }
function at() { if (!playing || !cur) return 0; var spb = 60 / cur.bpm; return ((ctx.currentTime - startT) / spb) % loopLen; }

// Render a song into an offline context (Node with node-web-audio-api, or an OfflineAudioContext in a page):
// every event up to `seconds`, layers set by `gains` ({ calm: 1, danger: 0 }). The caller then renders.
function render(context, song, seconds, gains) {
  ctx = context; master = ctx.createGain(); master.gain.value = vol; master.connect(ctx.destination);
  verb = ctx.createConvolver(); var n = Math.floor(ctx.sampleRate * 1.8), buf = ctx.createBuffer(2, n, ctx.sampleRate), ch;
  for (ch = 0; ch < 2; ch++) { var d = buf.getChannelData(ch); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
  verb.buffer = buf; wet = ctx.createGain(); wet.gain.value = 0.22; verb.connect(wet); wet.connect(master);
  layerGain = {}; for (var k in gains || {}) layer(k).gain.value = gains[k];
  cur = song; prepare(song); var spb = 60 / song.bpm, loop = 0;
  for (;;) { var any = false; for (var p = 0; p < evs.length; p++) { var e = evs[p], t = (e.t + loop * loopLen) * spb; if (t >= seconds) continue; any = true; var dest = layer(e.tag || 'all'); if (e.drum) VOICES.drum(dest, e.n, t, Math.min(127, e.v)); else (VOICES[e.inst] || VOICES.piano)(dest, freq(e.n), t, e.d * spb, Math.min(127, e.v)); } if (!any) break; loop++; }
}

/* ---------- MIDI file ---------- */
function vlq(n) { var b = [n & 0x7f]; n >>= 7; while (n > 0) { b.unshift((n & 0x7f) | 0x80); n >>= 7; } return b; }
function midiFile(song) {
  var PPQ = 480, tracks = [], meta = [];
  function u32(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]; }
  function u16(n) { return [(n >>> 8) & 255, n & 255]; }
  var us = Math.round(60000000 / song.bpm);
  meta = [0, 0xff, 0x51, 3, (us >> 16) & 255, (us >> 8) & 255, us & 255, 0, 0xff, 0x2f, 0];
  tracks.push(meta);
  song.tracks.forEach(function (tr, ti) {
    var drum = tr.pattern === 'shaker' || tr.pattern === 'rim' || tr.pattern === 'kick', ch = drum ? 9 : (ti % 9), list = [], ev = events(song, tr);
    ev.forEach(function (e) { var v = Math.max(1, Math.min(127, Math.round(e.v * (tr.vol == null ? 1 : tr.vol)))); list.push({ t: Math.round(e.t * PPQ), b: [0x90 | ch, e.n, v] }); list.push({ t: Math.round((e.t + e.d) * PPQ) - 1, b: [0x80 | ch, e.n, 0] }); });
    list.sort(function (a, b) { return a.t - b.t; });
    var bytes = [0, 0xc0 | ch, GM[tr.inst] || 0], last = 0;
    list.forEach(function (x) { bytes = bytes.concat(vlq(x.t - last), x.b); last = x.t; });
    bytes = bytes.concat([0, 0xff, 0x2f, 0]); tracks.push(bytes);
  });
  var out = [].concat([77, 84, 104, 100], u32(6), u16(1), u16(tracks.length), u16(PPQ));
  tracks.forEach(function (tk) { out = out.concat([77, 84, 114, 107], u32(tk.length), tk); });
  return new Uint8Array(out);
}

/* ---------- the songs ---------- */
// Three more day themes to choose between, each round a short hook that repeats (the thing that stays in the head):
// four bars of intro, A, A' (the same hook with a new ending), B (a second voice takes over), A again: 36 bars.
var R4 = 'r:w | r:w | r:w | r:w | ', R8 = R4 + R4;
var BG_A = 'E5:e G5:e C6:q G5:q E5:q | D5:q. E5:e D5:h | C5:e E5:e A5:q E5:q C5:q | A4:q. C5:e A4:h | E5:e G5:e C6:q G5:q E5:q | D5:q. E5:e F5:q D5:q | ';
var OW_A = 'D5:q G5:q B5:q. A5:e | A5:q F#5:q D5:h | E5:q G5:q B5:q. A5:e | G5:q E5:q C5:h | D5:q G5:q B5:q. A5:e | A5:q F#5:q A5:q B5:q | ';
var SW_A = 'A4:e D5:e F#5:q A5:q F#5:q | E5:q. C#5:e A4:h | B4:e D5:e F#5:q B5:q A5:q | G5:q. F#5:e D5:h | A4:e D5:e F#5:q A5:q F#5:q | E5:q. C#5:e E5:q F#5:q | ';
var SONGS = {
  birchGrove: {
    name: 'Birch grove', bpm: 124, key: 'C major', transpose: 0,
    chords: ['C', 'G', 'Am', 'F',
      'C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G',
      'C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C',
      'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'G',
      'C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'],
    tracks: [
      { inst: 'clarinet', vol: 1, tag: 'calm', notes: R4 + BG_A + 'A5:q G5:q F5:q E5:q | D5:h. r:q | ' + BG_A + 'A5:q G5:q F5:q D5:q | C5:w | ' + R8 + BG_A + 'A5:q G5:q F5:q D5:q | C5:w |' },
      { inst: 'celesta', vol: 0.9, tag: 'calm', notes: 'r:w | r:w | r:w | r:h E5:e G5:e C6:q | ' + R8 + R8 + 'A5:q C6:q F6:h | G6:q. F6:e D6:h | E6:q G6:q B5:h | C6:q. B5:e A5:h | A5:e C6:e F6:q E6:q D6:q | D6:q. B5:e G5:h | E6:q G6:q C6:q E6:q | D6:w | ' + R8 },
      { inst: 'flute', vol: 0.6, tag: 'calm', transpose: 12, notes: R4 + R8 + R8 + R8 + BG_A + 'A5:q G5:q F5:q D5:q | C5:w |' },
      { inst: 'harp', pattern: 'arp', vol: 0.6, tag: 'calm', oct: 0 },
      { inst: 'piano', pattern: 'comp', vol: 0.45, tag: '', oct: 0 },
      { inst: 'strings', pattern: 'pad', vol: 0.55, tag: '', oct: 0 },
      { inst: 'bass', pattern: 'bass', vol: 0.75, tag: '', oct: 0 },
      { inst: 'shaker', pattern: 'shaker', vol: 0.45, tag: 'calm' },
      { inst: 'rim', pattern: 'rim', vol: 0.4, tag: '' },
      { inst: 'kick', pattern: 'kick', vol: 0.9, tag: 'danger' },
      { inst: 'strings', pattern: 'pulse', vol: 1.1, tag: 'danger', oct: 0 },
      { inst: 'piano', pattern: 'pulse', vol: 0.7, tag: 'danger', oct: -1 }
    ]
  },
  oakAndWell: {
    name: 'Oak and well', bpm: 108, key: 'G major', transpose: 0,
    chords: ['G', 'D', 'Em', 'C',
      'G', 'D', 'Em', 'C', 'G', 'D', 'C', 'D',
      'G', 'D', 'Em', 'C', 'G', 'D', 'C', 'G',
      'C', 'D', 'G', 'Em', 'C', 'D', 'Am', 'D',
      'G', 'D', 'Em', 'C', 'G', 'D', 'C', 'G'],
    tracks: [
      { inst: 'flute', vol: 1, tag: 'calm', notes: R4 + OW_A + 'C6:q B5:q A5:q G5:q | A5:h. r:q | ' + OW_A + 'C6:q B5:q A5:q F#5:q | G5:w | ' + R8 + OW_A + 'C6:q B5:q A5:q F#5:q | G5:w |' },
      { inst: 'piano', vol: 0.9, tag: 'calm', notes: 'r:w | r:w | r:w | r:h D5:q G5:q | ' + R8 + R8 + 'E5:e G5:e C6:q G5:q E5:q | F#5:q A5:q D6:h | B5:q G5:q D5:h | E5:q G5:q B5:h | E5:e G5:e C6:q G5:q E5:q | F#5:q A5:q D6:q C6:q | C6:q A5:q E5:h | F#5:w | ' + R8 },
      { inst: 'musicbox', vol: 0.5, tag: 'calm', transpose: 12, notes: R4 + R8 + R8 + R8 + OW_A + 'C6:q B5:q A5:q F#5:q | G5:w |' },
      { inst: 'harp', pattern: 'arp', vol: 0.6, tag: 'calm', oct: 0 },
      { inst: 'piano', pattern: 'comp', vol: 0.4, tag: '', oct: 0 },
      { inst: 'strings', pattern: 'pad', vol: 0.6, tag: '', oct: 0 },
      { inst: 'bass', pattern: 'bass', vol: 0.75, tag: '', oct: 0 },
      { inst: 'shaker', pattern: 'shaker', vol: 0.35, tag: 'calm' },
      { inst: 'rim', pattern: 'rim', vol: 0.4, tag: '' },
      { inst: 'kick', pattern: 'kick', vol: 0.9, tag: 'danger' },
      { inst: 'strings', pattern: 'pulse', vol: 1.1, tag: 'danger', oct: 0 },
      { inst: 'piano', pattern: 'pulse', vol: 0.7, tag: 'danger', oct: -1 }
    ]
  },
  seaWind: {
    name: 'Sea wind', bpm: 132, key: 'D major', transpose: 0,
    chords: ['D', 'A', 'Bm', 'G',
      'D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A',
      'D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'D',
      'G', 'A', 'F#m', 'Bm', 'G', 'A', 'D', 'A',
      'D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'D'],
    tracks: [
      { inst: 'piano', vol: 1, tag: 'calm', notes: R4 + SW_A + 'G5:q A5:q B5:q G5:q | A5:h. r:q | ' + SW_A + 'G5:q F#5:q E5:q C#5:q | D5:w | ' + R8 + SW_A + 'G5:q F#5:q E5:q C#5:q | D5:w |' },
      { inst: 'flute', vol: 0.9, tag: 'calm', notes: 'r:w | r:w | r:w | r:h A4:e D5:e F#5:q | ' + R8 + R8 + 'B5:q. A5:e G5:q F#5:q | E5:q F#5:q A5:h | A5:q. G5:e F#5:q E5:q | D5:q F#5:q B5:h | B5:q. A5:e G5:q F#5:q | E5:q F#5:q A5:q B5:q | A5:q F#5:q D5:q F#5:q | E5:w | ' + R8 },
      { inst: 'celesta', vol: 0.55, tag: 'calm', transpose: 12, notes: R4 + R8 + R8 + R8 + SW_A + 'G5:q F#5:q E5:q C#5:q | D5:w |' },
      { inst: 'harp', pattern: 'arp', vol: 0.6, tag: 'calm', oct: 0 },
      { inst: 'piano', pattern: 'comp', vol: 0.4, tag: '', oct: 0 },
      { inst: 'strings', pattern: 'pad', vol: 0.55, tag: '', oct: 0 },
      { inst: 'bass', pattern: 'bass', vol: 0.8, tag: '', oct: 0 },
      { inst: 'shaker', pattern: 'shaker', vol: 0.45, tag: 'calm' },
      { inst: 'rim', pattern: 'rim', vol: 0.4, tag: '' },
      { inst: 'kick', pattern: 'kick', vol: 0.9, tag: 'danger' },
      { inst: 'strings', pattern: 'pulse', vol: 1.1, tag: 'danger', oct: 0 },
      { inst: 'piano', pattern: 'pulse', vol: 0.7, tag: 'danger', oct: -1 }
    ]
  },
  meadowDay: {
    name: 'Meadow, day', bpm: 118, key: 'F major', transpose: 0,
    // intro 4 | A 8 | A' 8 | B 8 (up a tone) | bridge 4 | A 8 = 40 bars
    chords: ['F', 'Bb', 'F', 'C',
      'F', 'Dm7', 'Bb', 'C', 'F', 'Am7', 'Bb', 'C7',
      'F', 'Dm7', 'Gm7', 'C7', 'F/A', 'Bb', 'Gm7', 'C7',
      'G', 'Em7', 'C', 'D', 'G', 'Bm7', 'C', 'D7',
      'Gm7', 'C7', 'Gm7', 'C7',
      'F', 'Dm7', 'Bb', 'C', 'F', 'Am7', 'Bb', 'F'],
    tracks: [
      { inst: 'flute', vol: 1, tag: 'calm', notes:
        'r:w | r:w | r:w | r:h r:q C5:e D5:e |' +
        'F5:q. E5:e D5:q C5:q | D5:q. C5:e A4:h | Bb4:e C5:e D5:q F5:q D5:q | C5:h. r:e C5:e |' +
        'F5:e E5:e F5:q G5:e F5:e E5:q | E5:q C5:e A4:e C5:h | D5:q. C5:e Bb4:q A4:q | G4:h. r:q |' +
        'A4:e C5:e F5:q E5:q D5:q | D5:q. C5:e A4:h | Bb4:q A4:q G4:q Bb4:q | C5:h. r:q |' +
        'C5:e D5:e E5:q F5:q G5:q | A5:q. G5:e F5:h | D5:e E5:e F5:q E5:q D5:q | C5:h. r:q |' +
        'r:w | r:w | r:w | r:w | r:w | r:w | r:w | r:w |' +
        'r:w | r:w | r:w | r:h r:q C5:e D5:e |' +
        'F5:q. E5:e D5:q C5:q | D5:q. C5:e A4:h | Bb4:e C5:e D5:q F5:q D5:q | C5:h. r:e C5:e |' +
        'F5:e E5:e F5:q G5:e F5:e E5:q | E5:q C5:e A4:e C5:h | D5:q. C5:e Bb4:q G4:q | F4:w |' },
      { inst: 'celesta', vol: 0.9, tag: 'calm', notes:
        'r:w | r:w | r:w | r:w |' +
        'r:w | r:w | r:w | r:w | r:w | r:w | r:w | r:w |' +
        'r:w | r:w | r:w | r:w | r:w | r:w | r:w | r:w |' +
        'B5:e D6:e G6:q F#6:e E6:e D6:q | E6:q. D6:e B5:h | C6:e D6:e E6:q G6:q E6:q | D6:h. r:q |' +
        'G6:e F#6:e G6:q A6:e G6:e F#6:q | F#6:q D6:e B5:e D6:h | E6:q. D6:e C6:q B5:q | A5:h. r:q |' +
        'r:w | r:w | r:w | r:w |' +
        'r:w | r:w | r:w | r:w | r:w | r:w | r:w | r:w |' },
      { inst: 'clarinet', vol: 0.8, tag: 'calm', notes:
        'r:w | r:w | r:w | r:w |' +
        'r:w | r:w | r:w | r:w | r:w | r:w | r:w | r:w |' +
        'r:w | r:w | r:w | r:w | r:w | r:w | r:w | r:w |' +
        'r:w | r:w | r:w | r:w | r:w | r:w | r:w | r:w |' +
        'Bb4:q. A4:e G4:q Bb4:q | C5:w | Bb4:q. A4:e G4:q E4:q | G4:h. r:q |' +
        'r:w | r:w | r:w | r:w | r:w | r:w | r:w | r:w |' },
      { inst: 'harp', pattern: 'arp', vol: 0.65, tag: 'calm', oct: 0 },
      { inst: 'piano', pattern: 'comp', vol: 0.45, tag: '', oct: 0 },
      { inst: 'strings', pattern: 'pad', vol: 0.6, tag: '', oct: 0 },
      { inst: 'bass', pattern: 'bass', vol: 0.75, tag: '', oct: 0 },
      { inst: 'shaker', pattern: 'shaker', vol: 0.5, tag: 'calm' },
      { inst: 'rim', pattern: 'rim', vol: 0.5, tag: '' },
      { inst: 'kick', pattern: 'kick', vol: 0.9, tag: 'danger' },
      { inst: 'strings', pattern: 'pulse', vol: 1.1, tag: 'danger', oct: 0 },
      { inst: 'piano', pattern: 'pulse', vol: 0.7, tag: 'danger', oct: -1 }
    ]
  },
  meadowEvening: {
    name: 'Meadow, evening', bpm: 84, key: 'D minor / F major', transpose: 0,
    chords: ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A7',
      'F', 'C/E', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C',
      'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A7',
      'Dm', 'Bb', 'F', 'C7', 'Dm', 'Bb', 'Gm', 'Dm'],
    tracks: [
      { inst: 'musicbox', vol: 1, tag: 'calm', notes:
        'A5:q F5:q D5:h | D5:q F5:q Bb5:h | A5:q. G5:e F5:h | E5:q G5:q C6:h |' +
        'A5:q F5:q D5:h | D5:q F5:q Bb5:q D6:q | G5:q. A5:e Bb5:q A5:q | A5:w |' +
        'r:w | r:w | r:w | r:w | r:w | r:w | r:w | r:w |' +
        'F5:q E5:q D5:h | D5:e F5:e D5:q Bb5:h | A5:q. G5:e F5:h | G5:q E5:q C5:h |' +
        'F5:q E5:q D5:h | D5:e F5:e D5:q Bb5:h | G5:q A5:q Bb5:q G5:q | A5:w |' +
        'r:w | r:w | r:w | r:w | r:w | r:w | r:w | r:w |' },
      { inst: 'flute', vol: 0.75, tag: 'calm', notes:
        'r:w | r:w | r:w | r:w | r:w | r:w | r:w | r:w |' +
        'A4:h C5:q F5:q | E5:q. D5:e C5:h | D5:h A4:q F4:q | D5:h. r:q |' +
        'A4:h C5:q F5:q | E5:q. D5:e G5:h | F5:q D5:q Bb4:q D5:q | C5:w |' +
        'r:w | r:w | r:w | r:w | r:w | r:w | r:w | r:w |' +
        'F4:h A4:q D5:q | D5:q. C5:e Bb4:h | A4:h G4:q A4:q | F4:h. r:q |' +
        'F4:h A4:q D5:q | D5:q. C5:e Bb4:h | G4:q A4:q Bb4:q G4:q | D5:w |' },
      { inst: 'harp', pattern: 'arp', vol: 0.6, tag: 'calm', oct: 0 },
      { inst: 'strings', pattern: 'pad', vol: 0.9, tag: '', oct: 0 },
      { inst: 'bass', pattern: 'bass', vol: 0.6, tag: '', oct: 0 },
      { inst: 'kick', pattern: 'kick', vol: 0.8, tag: 'danger' },
      { inst: 'rim', pattern: 'rim', vol: 0.6, tag: 'danger' },
      { inst: 'strings', pattern: 'pulse', vol: 1, tag: 'danger', oct: 0 }
    ]
  }
};
return { loadTrack: loadTrack, playTrack: playTrack, stopTrack: stopTrack, releaseTrack: releaseTrack, trackPlaying: trackPlaying, SONGS: SONGS, INSTS: INSTS, PATTERNS: PATTERNS, GM: GM, play: play, stop: stop, restart: restart, setLayer: setLayer, setVolume: setVolume, at: at, render: render, length: length, events: events, parse: parse, chord: chord, midi: midiFile, playing: function () { return playing; }, layers: function () { var o = {}; for (var k in layerGain) o[k] = layerGain[k].gain.value; return o; }, current: function () { return cur; } };
})();
if (typeof module !== 'undefined') module.exports = Music;
