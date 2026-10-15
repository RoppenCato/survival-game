/* Sfx: recorded sound effects (2026-10-15, Robin: "work on the attack sounds; request the sounds you need from the Sound
   director, then try those new sounds"). The sound studio (C:\dev\SG Sound) renders each sound as a few variations of WAV;
   tools/sfxjs.js bundles a delivered folder into one script, assets/sfx/<set>.js, which sets
   window.__SFX[set] = { gain: { name: g }, files: { name_1: base64, ... } }. A script loads from disk as well as from the
   server (a page opened from file:// may not fetch a file beside it).

   Sfx.load(ctx, 'assets/sfx/combat.js')    adds the script, decodes every file once on the page's AudioContext (a promise)
   Sfx.has(name)                             are there recordings of it
   Sfx.play(ctx, dest, name, { v, pitch })   one of its variations (never the same twice running), at its own gain times v,
                                             its rate moved by up to pitch (0.03 by default) so a run of blows is not one
                                             sound; false if there is none, so the page plays its synthesized one instead
   Sfx.on                                    false plays nothing (the pages' "recorded sounds" switch: false = the old)
   Sfx.vol                                   a master gain for all of them
   Sfx.names()                               what is loaded, with the number of variations
   No browser globals at load time: it loads in Node too (the tests). */
var Sfx = (function () {
  var bufs = {}, gains = {}, last = {}, sets = {};
  function b64bytes(b64) { var bin = atob(b64), n = bin.length, u = new Uint8Array(n); for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
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
        Object.keys(S.files).forEach(function (f) {
          var n = f.replace(/_\d+$/, '');   /* hit_axe_2 is a variation of hit_axe */
          jobs.push(decode(ctx, b64bytes(S.files[f])).then(function (buf) { (bufs[n] || (bufs[n] = [])).push(buf); }, function () { /* one bad file is left out */ }));
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
  function has(n) { return !!(bufs[n] && bufs[n].length); }
  function names() { var o = {}; for (var n in bufs) o[n] = bufs[n].length; return o; }
  function play(ctx, dest, n, o) {
    if (!Sfx.on || !ctx) return false;
    var list = bufs[n]; if (!list || !list.length) return false;
    o = o || {};
    var i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && i === last[n]) i = (i + 1) % list.length;
    last[n] = i;
    var src = ctx.createBufferSource(), g = ctx.createGain(), pv = o.pitch == null ? 0.03 : o.pitch;
    src.buffer = list[i]; src.playbackRate.value = (o.rate || 1) * (1 + (Math.random() * 2 - 1) * pv);
    g.gain.value = (gains[n] == null ? 1 : gains[n]) * (o.v == null ? 1 : o.v) * Sfx.vol;
    src.connect(g); g.connect(dest || ctx.destination); src.start(ctx.currentTime + (o.delay || 0));
    return true;
  }
  return { load: load, has: has, play: play, names: names, on: true, vol: 1 };
})();
if (typeof module !== 'undefined') module.exports = Sfx;
