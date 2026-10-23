/* Sfx: recorded sound effects (2026-10-15, Robin: "work on the attack sounds; request the sounds you need from the Sound
   director, then try those new sounds"). The sound studio (C:\dev\SG\Sound Director) renders each sound as a few variations of WAV;
   tools/sfxjs.js bundles a delivered folder into one script, assets/sfx/<set>.js, which sets
   window.__SFX[set] = { gain: { name: g }, files: { name_1: base64, ... } }. A script loads from disk as well as from the
   server (a page opened from file:// may not fetch a file beside it).

   Sfx.load(ctx, 'assets/sfx/combat.js')    adds the script, decodes every file once on the page's AudioContext (a promise)
   Sfx.has(name)                             are there recordings of it
   Sfx.play(ctx, dest, name, { v, pitch, delay, rate })   one of its variations (never the same twice running), at its own
                                             gain times v, its rate moved by up to pitch (0.03 by default) so a run of blows is
                                             not one sound, after delay seconds; a handle (truthy) or false if there is none, so
                                             the page plays its synthesized one instead
   ... { peakAt }                            in place of delay: start it so that this variation's own loudest moment comes peakAt from now
   Sfx.cut(ctx, h, fade)                     fades a playing handle out over about fade seconds (0.03), or stops it before it starts
   Sfx.peak(name)                            when its loudest moment comes, in seconds from its start (tools/sfxjs.js measures it)
   Sfx.on                                    false plays nothing (the pages' "recorded sounds" switch: false = the old)
   Sfx.vol                                   a master gain for all of them (0.5)
   Sfx.names()                               what is loaded, with the number of variations
   No browser globals at load time: it loads in Node too (the tests). */
var Sfx = (function () {
  var bufs = {}, gains = {}, peaks = {}, last = {}, sets = {}, layers = {}, labels = {};
  function b64bytes(b64) { var bin = atob(b64), n = bin.length, u = new Uint8Array(n); for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
  function loudest(buf) { var d = buf.getChannelData(0), w = Math.max(1, Math.round(buf.sampleRate * 0.01)), best = -1, at = 0; for (var s0 = 0; s0 + w <= d.length; s0 += w >> 1) { var e = 0; for (var i = s0; i < s0 + w; i++) e += d[i] * d[i]; if (e > best) { best = e; at = s0 + w / 2; } } return at / buf.sampleRate; }   /* an MP3's peak, found once it is decoded (the bundler measures a WAV's) */
  function decode(ctx, ab) { return new Promise(function (res, rej) { var p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }); }
  function load(ctx, url) {
    var set = url.replace(/\?.*$/, '').replace(/^.*\//, '').replace(/\.js$/, '');
    if (sets[set]) return sets[set];
    var G = window.__SFX || (window.__SFX = {});
    sets[set] = new Promise(function (res, rej) {
      function take() {
        var S = G[set]; delete G[set]; if (!S) { rej(new Error('no sound set ' + set)); return; }
        var jobs = [];
        Object.keys(S.gain || {}).forEach(function (n) { gains[n] = S.gain[n]; });
        Object.keys(S.peak || {}).forEach(function (n) { peaks[n] = S.peak[n]; });
        Object.keys(S.label || {}).forEach(function (n) { labels[n] = S.label[n]; });
        Object.keys(S.layers || {}).forEach(function (n) { layers[n] = S.layers[n]; });
        Object.keys(S.files).forEach(function (f) {
          var n = f.replace(/_\d+$/, '');   /* hit_axe_2 is a variation of hit_axe */
          var pk = S.peakf && S.peakf[f], tr = (S.trim && S.trim[f]) || 0;
          jobs.push(decode(ctx, b64bytes(S.files[f])).then(function (buf) { if (pk == null) pk = loudest(buf); pk = Math.max(0, pk - tr); (bufs[n] || (bufs[n] = [])).push({ buf: buf, peak: pk, trim: tr }); if (peaks[n] == null) peaks[n] = pk; }, function () { /* one bad file is left out */ }));
        });
        Promise.all(jobs).then(function () { res(names()); });
      }
      if (G[set]) { take(); return; }
      var sc = document.createElement('script'); sc.src = url; sc.async = true;
      sc.onload = function () { sc.remove(); take(); };
      sc.onerror = function () { sc.remove(); delete sets[set]; rej(new Error('cannot load ' + url)); };
      document.head.appendChild(sc);
    });
    return sets[set];
  }
  function has(n) { if (bufs[n] && bufs[n].length) return true; var L = layers[n]; return !!(L && L.parts.every(function (pt) { return bufs[pt[0]] && bufs[pt[0]].length; })); }
  function names() { var o = {}, n; for (n in bufs) o[n] = bufs[n].length; for (n in layers) if (has(n)) o[n] = bufs[layers[n].parts[0][0]].length; return o; }
  function label(n) { return labels[n] || (layers[n] && layers[n].label) || ''; }
  function play(ctx, dest, n, o) {
    if (!Sfx.on || !ctx) return false;
    if (layers[n] && !(bufs[n] && bufs[n].length)) {   /* a layered sound: every part at once, each at its own gain times the part's */
      var first = false; o = o || {};
      layers[n].parts.forEach(function (pt) { var o2 = {}; for (var k in o) o2[k] = o[k]; o2.v = (o.v == null ? 1 : o.v) * (pt[1] == null ? 1 : pt[1]); if (pt[2]) o2.delay = (o2.delay || 0) + pt[2]; var h = play(ctx, dest, pt[0], o2); if (!first) first = h; });
      return first;
    }
    var list = bufs[n]; if (!list || !list.length) return false;
    o = o || {};
    var i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && i === last[n]) i = (i + 1) % list.length;
    last[n] = i;
    var src = ctx.createBufferSource(), g = ctx.createGain(), pv = o.pitch == null ? 0.03 : o.pitch;
    var rate = (o.rate || 1) * (1 + (Math.random() * 2 - 1) * pv);
    src.buffer = list[i].buf; src.playbackRate.value = rate;
    if (o.peakAt != null) o.delay = Math.max(0, o.peakAt - (list[i].peak != null ? list[i].peak : (peaks[n] || 0)) / rate);   /* this variation's own loudest moment lands peakAt seconds from now */
    g.gain.value = (gains[n] == null ? 1 : gains[n]) * (o.v == null ? 1 : o.v) * Sfx.vol;
    var at = ctx.currentTime + (o.delay || 0);
    src.connect(g); g.connect(dest || ctx.destination); src.start(at, list[i].trim || 0);   /* past the file's leading silence, if it has one (trim) */
    return { src: src, g: g, at: at };
  }
  function cut(ctx, h, fade) {
    if (!h || !ctx) return; var now = ctx.currentTime, f = fade == null ? 0.03 : fade;
    try { if (h.at > now + 0.005) { h.src.stop(); return; } h.g.gain.cancelScheduledValues(now); h.g.gain.setValueAtTime(h.g.gain.value, now); h.g.gain.setTargetAtTime(0, now, f / 3); h.src.stop(now + f * 2 + 0.02); } catch (e) {}
  }
  function peak(n) { return peaks[n] || 0; }
  function loop(ctx, dest, n, o) {   /* a bed (the weather's rain, 2026-10-23): one variation looping from a random point, faded in to v; setLoop moves its level, cut ends it */
    if (!Sfx.on || !ctx) return false; var list = bufs[n]; if (!list || !list.length) return false; o = o || {};
    var i = Math.floor(Math.random() * list.length), b = list[i].buf, src = ctx.createBufferSource(), g = ctx.createGain(), now = ctx.currentTime;
    src.buffer = b; src.loop = true; src.playbackRate.value = o.rate || 1; g.gain.setValueAtTime(0.0001, now); src.connect(g); g.connect(dest || ctx.destination); src.start(now, Math.random() * Math.max(0, b.duration - 0.5));
    var h = { src: src, g: g, at: now, n: n, base: (gains[n] == null ? 1 : gains[n]) * Sfx.vol }; setLoop(ctx, h, o.v == null ? 1 : o.v, o.ramp == null ? 2 : o.ramp); return h;
  }
  function setLoop(ctx, h, v, ramp) { if (!h || !ctx) return; var now = ctx.currentTime; try { h.g.gain.cancelScheduledValues(now); h.g.gain.setValueAtTime(Math.max(0.0001, h.g.gain.value), now); h.g.gain.setTargetAtTime(Math.max(0.0001, h.base * v), now, Math.max(0.05, (ramp == null ? 2 : ramp) / 3)); } catch (e) {} }
  return { load: load, has: has, play: play, cut: cut, loop: loop, setLoop: setLoop, peak: peak, names: names, label: label, on: true, vol: 0.5 };   // vol 0.5: the studio levels every file to a peak of -1 dBFS; at half, the sword's hit lies where the synthesized one did (measured: -22.6 dB against -23.7 over its loudest 50 ms)
})();
if (typeof module !== 'undefined') module.exports = Sfx;
