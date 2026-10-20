/* Ambient: the sound of the place you stand in (2026-10-12, Robin: ambient sounds; synthesized in code, like all the sound).
   No sound files: every layer is noise through filters, or a short tone, made on the page's own AudioContext.

   var amb = Ambient.make(AC, AC.destination);
   amb.set({ ... })      what is round the hero, as often as the page likes (a few times a second is plenty):
       trees 0..1        how wooded it is here
       shore 0..1        how near the sea is (1 at the water's edge)
       aboard, sail 0..1 in a vessel, and how fast it goes
       fells 0..3        the mountain's level (the wind is louder up there, and whistles under the peaks)
       night 0..1, dusk 0..1
       fire 0..1         how near a fire is; torch: one is lit in the hand
       brook 0..1        how near running water is
       wind 0..1         how hard it blows
       cave              null, 'troll', 'mine' or 'sea': inside, the world outside is not heard
   amb.tick(dt)          every frame: eases the beds toward what `set` asked for and lets the single sounds happen
   amb.step(ground, v)   a footstep: 'grass', 'sand', 'rock', 'gravel', 'wood', 'water' (in a cave it rings a little)
   amb.wave              the page's recorded wave (2026-10-20): a function (v) that plays one through amb.master and says
                         whether it did; if it did, the synthesized surf is not played. Ashore only (aboard the hull's sounds stay)
   amb.setVolume(v)      0 is silence (the page turns it down in the menu and when the window is hidden)
   amb.layers            { wind, sea, birds, insects, fire, steps, cave, water }: set one to 0 to switch it off (the page's
                         Light and sound board does: I cannot hear what I have made, so Robin tells me by ear which is wrong)

   THE LAYERS. Wind: brown noise through a band that opens with every gust; leaves rustling with it where trees are; a thin
   whistle on the high plateau. The sea: a wave every five to nine seconds (the swell, then the wash drawing back over
   shingle); aboard, water along the hull and a slap under the bow. Birds by day, more of them the more trees there are and
   most at dawn: a tit's two notes, a warbler, a blackbird's phrase, a finch's falling trill, the cuckoo now and then, a
   woodpecker drumming, a crow over open ground, a raven up on the fells, gulls by the shore; an owl at night. Insects:
   crickets from dusk on. Fire: its low roar and the crackle and pop of the wood. Running water by the brook. In a cave, a low
   tone, drops that fall and are heard twice, the mine's timber creaking, the sea booming slowly in the sea cave. */
var Ambient = (function () {
'use strict';
var LAYERS = ['wind', 'sea', 'birds', 'insects', 'fire', 'steps', 'cave', 'water'];
function make(AC, dest) {
  var R = Math.random, sr = AC.sampleRate, master = AC.createGain(); master.gain.value = 0; master.connect(dest);
  var layers = {}, stats = { shots: 0, kinds: {} }; LAYERS.forEach(function (k) { layers[k] = 1; });
  function now() { return AC.currentTime; }
  function noiseBuf(sec, kind) {
    var n = Math.floor(sr * sec), b = AC.createBuffer(1, n, sr), ch = b.getChannelData(0), i, last = 0, l2 = 0, f = Math.floor(sr * 0.06);
    for (i = 0; i < n; i++) { var w = R() * 2 - 1; if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; ch[i] = last * 3.5; } else if (kind === 'pink') { last = 0.97 * last + 0.03 * w; l2 = 0.7 * l2 + 0.3 * w; ch[i] = last * 2.2 + l2 * 0.35; } else ch[i] = w; }
    for (i = 0; i < f; i++) { var k = i / f; ch[n - f + i] = ch[n - f + i] * (1 - k) + ch[i] * k; }      // the end runs into the beginning: no click where it loops
    return b;
  }
  var white = noiseBuf(2, 'white'), brown = noiseBuf(4, 'brown'), pink = noiseBuf(3, 'pink');
  function bed(buf, chain) {                              // a bed: noise that never stops, through filters, its loudness eased
    var src = AC.createBufferSource(), node = src, fs = [], g = AC.createGain(); src.buffer = buf; src.loop = true;
    chain.forEach(function (c) { var f = AC.createBiquadFilter(); f.type = c[0]; f.frequency.value = c[1]; if (c[2] != null) f.Q.value = c[2]; node.connect(f); node = f; fs.push(f); });
    g.gain.value = 0; node.connect(g); g.connect(master); src.start(0, R() * buf.duration * 0.9); return { g: g, f: fs, v: 0 };
  }
  function ease(b, v, tc) { if (Math.abs(v - b.v) < 0.0004) return; b.v = v; b.g.gain.setTargetAtTime(v, now(), tc || 0.4); }
  var B = {
    wind: bed(brown, [['bandpass', 380, 0.5]]), whistle: bed(pink, [['bandpass', 1700, 7]]), leaves: bed(white, [['highpass', 3200, 0.5], ['lowpass', 9000, 0.5]]),
    surf: bed(pink, [['lowpass', 520, 0.4]]), hull: bed(pink, [['bandpass', 760, 0.7]]), brook: bed(white, [['bandpass', 1500, 0.9]]),
    fire: bed(brown, [['lowpass', 420, 0.5]]), drone: bed(brown, [['lowpass', 150, 0.6]]), boom: bed(brown, [['lowpass', 260, 0.5]])
  };
  function note(kind) { stats.shots++; stats.kinds[kind] = (stats.kinds[kind] || 0) + 1; }
  function out(node, pan) { if (pan != null && AC.createStereoPanner) { var p = AC.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node.connect(p); p.connect(master); } else node.connect(master); }
  function shape(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function chirp(t, f0, f1, dur, vol, type, pan) {        // a tone that slides: a bird's note, a drop, a creak
    var o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    shape(g, t, Math.min(0.014, dur * 0.3), vol, dur); o.connect(g); out(g, pan); o.start(t); o.stop(t + dur + 0.06);
  }
  function burst(t, dur, vol, type, fc, q, pan, attack) { // a snatch of noise through a filter: a step, a crackle, a wash of water
    var src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); src.buffer = white; f.type = type; f.frequency.value = fc; if (q != null) f.Q.value = q;
    shape(g, t, attack || Math.min(0.01, dur * 0.3), vol, dur); src.connect(f); f.connect(g); out(g, pan); src.start(t, R() * 1.4, dur + (attack || 0) + 0.1);
  }
  var E = { trees: 0, shore: 0, aboard: false, sail: 0, fells: 0, night: 0, dusk: 0, dawn: 0, fire: 0, torch: false, brook: 0, wind: 0.5, cave: null };
  var nx = { gust: 2, wave: 1.5, bird: 2, far: 6, owl: 14, cricket: 1, crackle: 0.3, drip: 2, creak: 12, boom: 3, lap: 1, slap: 1, cuckoo: 40 }, gustV = 0, gustT = 0, crk = [], vol = 0;
  function set(e) { for (var k in e) E[k] = e[k]; }
  var GAIN = 1.9;                                         // the whole of it against the page's other sounds (measured 2026-10-12: the beds lay 30 dB under a sword's blow; this brings them to about 24)
  function setVolume(v) { if (v === vol) return; vol = v; master.gain.setTargetAtTime(v * GAIN, now(), 0.25); }

  // ---- the birds ----
  function bird(t, near) {
    var day = 1 - E.night, pan = (R() - 0.5) * 1.6, far = near ? 1 : 0.45 + R() * 0.3, v = (0.03 + R() * 0.033) * far, k = R(), i, n;
    if (E.shore > 0.55 && k < 0.5 * E.shore) {             // a gull: a few cries, each rising and falling away
      n = 2 + Math.floor(R() * 4); for (i = 0; i < n; i++) { var tg = t + i * (0.32 + R() * 0.08); chirp(tg, 980 + R() * 120, 1460 + R() * 160, 0.12, v * 0.8, 'sawtooth', pan); chirp(tg + 0.11, 1460, 820, 0.2, v * 0.7, 'sawtooth', pan); } note('gull'); return 0.4 * n + 0.6;
    }
    if (E.fells >= 2 && k < 0.6) { n = 1 + Math.floor(R() * 3); for (i = 0; i < n; i++) { chirp(t + i * 0.42, 300 + R() * 30, 250, 0.26, v * 0.9, 'sawtooth', pan); burst(t + i * 0.42, 0.24, v * 0.5, 'bandpass', 1300, 1.5, pan, 0.03); } note('raven'); return 1.6; }   // a raven's croak on the high ground
    if (E.trees < 0.25 && k < 0.3) { n = 2 + Math.floor(R() * 2); for (i = 0; i < n; i++) { chirp(t + i * 0.36, 470 + R() * 40, 400, 0.24, v * 0.85, 'sawtooth', pan); burst(t + i * 0.36, 0.22, v * 0.55, 'bandpass', 1800, 1.2, pan, 0.02); } note('crow'); return 1.4; }   // a crow over open ground
    if (E.trees > 0.5 && k > 0.93) { n = 9 + Math.floor(R() * 7); for (i = 0; i < n; i++) burst(t + i * 0.047, 0.03, v * 1.3 * (1 - i / n * 0.5), 'bandpass', 1150, 4, pan); note('woodpecker'); return 2; }   // a woodpecker drums
    if (k < 0.24) { n = 2 + Math.floor(R() * 3); var hi = 4000 + R() * 600; for (i = 0; i < n * 2; i++) chirp(t + i * 0.16, i % 2 ? hi * 0.8 : hi, null, 0.09, v, 'sine', pan); note('tit'); return n * 0.32 + 0.3; }   // a tit: two notes, over and over
    if (k < 0.48) { n = 5 + Math.floor(R() * 6); for (i = 0; i < n; i++) { var f = 2600 + R() * 2600; chirp(t + i * (0.07 + R() * 0.03), f, f * (0.8 + R() * 0.5), 0.06, v * 0.8, 'sine', pan); } note('warbler'); return n * 0.09 + 0.3; }   // a warbler's hurried phrase
    if (k < 0.7) { n = 3 + Math.floor(R() * 3); var tb = t; for (i = 0; i < n; i++) { var fb = 1700 + R() * 1200, db = 0.16 + R() * 0.16; chirp(tb, fb, fb * (0.86 + R() * 0.34), db, v * 1.1, 'sine', pan); chirp(tb, fb * 2.01, fb * 2.01 * (0.86 + R() * 0.3), db, v * 0.18, 'sine', pan); tb += db + 0.05 + R() * 0.1; } note('blackbird'); return tb - t + 0.4; }   // a blackbird: a few round notes
    if (k < 0.86) { n = 7 + Math.floor(R() * 4); for (i = 0; i < n; i++) chirp(t + i * 0.085, 5000 - i * 190, 4700 - i * 200, 0.06, v * 0.8, 'sine', pan); chirp(t + n * 0.085, 3300, 4300, 0.1, v, 'sine', pan); note('finch'); return n * 0.085 + 0.5; }   // a finch: a falling trill and a flourish
    n = 2 + Math.floor(R() * 2); for (i = 0; i < n; i++) chirp(t + i * 0.2, 3300 + R() * 300, 2900, 0.12, v, 'triangle', pan); note('sparrow'); return n * 0.2 + 0.3;
  }
  function cuckoo(t) { var n = 2 + Math.floor(R() * 3), pan = (R() - 0.5) * 1.4, i; for (i = 0; i < n; i++) { chirp(t + i * 1.05, 664, 660, 0.2, 0.02, 'sine', pan); chirp(t + i * 1.05 + 0.3, 524, 520, 0.3, 0.022, 'sine', pan); } note('cuckoo'); }
  function owl(t) { var pan = (R() - 0.5) * 1.4, f = 360 + R() * 50; chirp(t, f, f * 0.95, 0.42, 0.03, 'sine', pan); chirp(t + 0.75, f, f, 0.14, 0.022, 'sine', pan); chirp(t + 0.95, f, f * 0.93, 0.5, 0.03, 'sine', pan); note('owl'); }
  function cricket(t) {                                   // one of a few crickets: a trill of quick pulses at its own pitch
    if (crk.length < 3) crk.push({ f: 4300 + R() * 900, pan: (R() - 0.5) * 1.6 }); var c = crk[Math.floor(R() * crk.length)], n = 10 + Math.floor(R() * 26), i, v = 0.016 + R() * 0.012;
    var o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(c.f, t); g.gain.setValueAtTime(0.0001, t);      // one voice for the whole trill, its loudness pulsed
    for (i = 0; i < n; i++) { var tp = t + i * 0.036; g.gain.setValueAtTime(0.0001, tp); g.gain.linearRampToValueAtTime(v, tp + 0.006); g.gain.linearRampToValueAtTime(0.0001, tp + 0.024); }
    o.connect(g); out(g, c.pan); o.start(t); o.stop(t + n * 0.036 + 0.05); note('cricket'); return n * 0.036 + 0.25 + R() * 0.9;
  }

  // ---- the frame ----
  function tick(dt) {
    var t = now(), L = layers, cave = E.cave, outD = cave ? 0 : 1, day = 1 - E.night, k;
    if (dt > 0.25) dt = 0.25;
    for (k in nx) nx[k] -= dt;
    // the wind: gusts come and go
    if (nx.gust <= 0) { gustT = R() < 0.6 ? 0.5 + R() * 0.5 : R() * 0.25; nx.gust = 2.5 + R() * 6; }
    gustV += (gustT - gustV) * Math.min(1, dt * 0.55);
    var wk = (0.014 + 0.05 * E.wind) * (1 + 1.3 * gustV) * (1 + 0.45 * E.fells) * (E.aboard ? 1.35 : 1) * (1 - 0.3 * E.trees) * (1 - 0.25 * E.night);
    ease(B.wind, wk * outD * L.wind, 0.5); B.wind.f[0].frequency.setTargetAtTime(330 + 300 * gustV + 60 * E.fells, t, 0.6);
    ease(B.whistle, (E.fells >= 2 ? 0.006 + 0.014 * gustV : 0) * (E.fells >= 3 ? 1.5 : 1) * outD * L.wind, 0.7); B.whistle.f[0].frequency.setTargetAtTime(1500 + 700 * gustV, t, 0.9);
    ease(B.leaves, 0.03 * E.trees * (0.2 + gustV) * outD * L.wind, 0.5);
    // the sea: a wave, then its wash
    var sh = E.aboard ? 0.5 : E.shore;
    if (nx.wave <= 0) { nx.wave = 4.6 + R() * 4.4; if (sh > 0.03 && outD && L.sea && !E.aboard && self.wave && self.wave(sh * (0.7 + R() * 0.6) * L.sea)) note('wave'); else if (sh > 0.03 && outD && L.sea) { var pk = 0.085 * sh * (0.7 + R() * 0.6), g = B.surf.g.gain, fq = B.surf.f[0].frequency; g.setTargetAtTime(pk, t, 0.45); g.setTargetAtTime(0.012 * sh, t + 1.3, 1.1); fq.setTargetAtTime(1500, t, 0.5); fq.setTargetAtTime(480, t + 1.3, 1.2); B.surf.v = -1; if (!E.aboard) burst(t + 1.2, 2.0, 0.022 * sh, 'highpass', 2600, 0.5, (R() - 0.5) * 0.8, 0.8); note('wave'); } }
    if (!(sh > 0.03 && outD && L.sea)) ease(B.surf, 0, 0.6);
    ease(B.hull, E.aboard ? (0.012 + 0.06 * E.sail) * L.sea : 0, 0.5);
    if (E.aboard && nx.slap <= 0) { nx.slap = 1.5 - 0.9 * E.sail + R() * 0.7; if (L.sea) { burst(t, 0.13, 0.02 + 0.03 * E.sail, 'lowpass', 380, 0.7, (R() - 0.5) * 0.5); note('slap'); } }
    // birds by day (most at dawn), an owl by night, crickets from dusk
    if (nx.bird <= 0) { var dens = outD * L.birds * day * day * (0.12 + E.trees) * (1 + 1.2 * E.dawn) * (1 - 0.35 * Math.min(1, E.fells)); if (E.shore > 0.6) dens = Math.max(dens, 0.2 * day * outD * L.birds); if (dens > 0.02 && R() < Math.min(1, dens * 1.3)) nx.bird = bird(t, R() < 0.35) + (0.5 + R() * 3.4) / Math.max(0.15, dens); else nx.bird = 1 + R() * 2; }
    if (nx.cuckoo <= 0) { nx.cuckoo = 50 + R() * 90; if (outD && L.birds && day > 0.8 && E.trees > 0.25 && !E.fells) cuckoo(t); }
    if (nx.owl <= 0) { nx.owl = 16 + R() * 34; if (outD && L.birds && E.night > 0.7 && E.trees > 0.2) owl(t); }
    if (nx.cricket <= 0) { var ev = Math.max(E.dusk, E.night * 0.8) * (E.fells ? 0.3 : 1) * (1 - 0.6 * E.shore); nx.cricket = (ev > 0.15 && outD && L.insects && !E.aboard) ? cricket(t) / Math.min(1, ev + 0.2) : 1.5; }
    // fire: the roar, the crackle, a pop
    var fr = Math.max(E.fire, E.torch ? 0.3 : 0) * L.fire; ease(B.fire, 0.035 * fr, 0.4);
    if (nx.crackle <= 0) { nx.crackle = 0.04 + R() * R() * 0.5; if (fr > 0.03) { var pop = R() < 0.07; burst(t, pop ? 0.03 : 0.008 + R() * 0.014, (pop ? 0.13 : 0.04 + R() * 0.06) * fr, 'bandpass', pop ? 900 + R() * 600 : 1800 + R() * 3600, 2 + R() * 4, (R() - 0.5) * 0.5); note('crackle'); } }
    // running water
    ease(B.brook, 0.055 * E.brook * (0.7 + 0.6 * R()) * outD * L.water, 0.09);
    // in a cave: its low tone, drops, the mine's timber, the sea's slow boom
    ease(B.drone, cave ? (cave === 'sea' ? 0.03 : 0.045) * L.cave : 0, 0.8);
    if (nx.drip <= 0) { nx.drip = (cave === 'sea' ? 1.6 : cave === 'mine' ? 5 : 2.6) * (0.4 + R() * 1.6); if (cave && L.cave) { var fd = 1000 + R() * 1500, pd = (R() - 0.5) * 1.6, vd = 0.012 + R() * 0.02; chirp(t, fd, fd * 0.55, 0.07, vd, 'sine', pd); chirp(t + 0.16 + R() * 0.06, fd * 0.98, fd * 0.5, 0.09, vd * 0.3, 'sine', -pd * 0.6); note('drip'); } }
    if (nx.creak <= 0) { nx.creak = 12 + R() * 26; if (cave === 'mine' && L.cave) { var fc = 70 + R() * 50; chirp(t, fc, fc * (1.25 + R() * 0.3), 0.5 + R() * 0.4, 0.035, 'sawtooth', (R() - 0.5) * 1.2); burst(t, 0.6, 0.012, 'bandpass', 700, 3, 0, 0.2); note('creak'); } }
    if (nx.boom <= 0) { nx.boom = 5.5 + R() * 5; if (cave === 'sea' && L.cave) { var gb = B.boom.g.gain; gb.setTargetAtTime(0.11, t, 0.9); gb.setTargetAtTime(0.02, t + 2.2, 1.6); B.boom.v = -1; note('boom'); } }
    if (cave !== 'sea') ease(B.boom, 0, 0.8);
    if (nx.lap <= 0) { nx.lap = 0.7 + R() * 1.3; if (cave === 'sea' && L.cave) { burst(t, 0.2, 0.015 + R() * 0.012, 'bandpass', 900 + R() * 500, 0.8, (R() - 0.5) * 1.4, 0.07); note('lap'); } }
  }
  // ---- a footstep ----
  function step(ground, v) {
    if (!layers.steps) return; var t = now(), k = (v == null ? 1 : v) * (0.7 + R() * 0.25) * (ground === 'sand' || ground === 'gravel' ? 1.5 : 1), ring = !!E.cave, pan = (R() - 0.5) * 0.16;
    function one(tt, kk) {
      if (ground === 'sand') burst(tt, 0.11, 0.03 * kk, 'bandpass', 1700 + R() * 400, 0.5, pan, 0.02);
      else if (ground === 'rock') { burst(tt, 0.035, 0.045 * kk, 'bandpass', 2300 + R() * 600, 1.5, pan); chirp(tt, 170, 110, 0.05, 0.03 * kk, 'sine', pan); }
      else if (ground === 'gravel') { burst(tt, 0.05, 0.035 * kk, 'bandpass', 3000 + R() * 800, 1.2, pan); burst(tt + 0.045, 0.05, 0.025 * kk, 'bandpass', 3600 + R() * 800, 1.2, pan); }
      else if (ground === 'wood') { chirp(tt, 150 + R() * 30, 92, 0.07, 0.05 * kk, 'triangle', pan); burst(tt, 0.025, 0.03 * kk, 'bandpass', 1100, 1.2, pan); }
      else if (ground === 'water') { burst(tt, 0.17, 0.05 * kk, 'bandpass', 1200 + R() * 500, 0.7, pan, 0.035); chirp(tt + 0.05, 500 + R() * 300, 900, 0.05, 0.012 * kk, 'sine', pan); }
      else { burst(tt, 0.06, 0.03 * kk, 'lowpass', 850 + R() * 200, 0.5, pan); chirp(tt, 95, 60, 0.05, 0.035 * kk, 'sine', pan); }
    }
    one(t, k); if (ring) one(t + 0.11, k * 0.3); note('step');
  }
  var self = { set: set, tick: tick, step: step, setVolume: setVolume, layers: layers, stats: stats, env: E, beds: B, master: master, wave: null };
  return self;
}
return { make: make, LAYERS: LAYERS };
})();
if (typeof module !== 'undefined') module.exports = Ambient;
