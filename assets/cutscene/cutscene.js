/* cutscene.js: the cut-scene player (Colin, AD, 2026-10-29; Robin, through Clive, GD: "a tool for creating cut-scenes so we can have
   events", the village's blot the first trial). docs/cutscenes.md in the studio says why it is built so; the studio's skill `cutscene`
   says how a scene is written, staged, tested and handed over.

   A scene is plain data:
     { id, title, anchor: 'altar', skip: true, cast: { <who>: { role, name, look } }, steps: [ ... ], end: [ ... ] }
   Each step is { do: <kind>, ... } and runs in order. Each waits for its end unless it says "wait": false (then it runs on beside the
   steps after it). { do: 'par', steps: [...] } runs its steps together and waits for all. `end` is what the scene leaves behind
   (where people stand, flags, the view): it runs at the scene's end and on a skip, at once, so a skipped scene and a watched one
   leave the same world. After `end`, the player always gives back the view, the input and the HUD, takes the bars and the fade
   away, and lets the cast go (env.release).

   Positions are never world numbers: { at: 'altar', dx, dy } (or [dx, dy], from the scene's anchor), { at: 'hero' }, { at: <who> }.
   env.place(name) gives the game's named places, so one scene plays in any village. `to` may be a list of points: a walk along them.

   The kinds:
     wait   { s }                                  a pause
     fade   { to, s }                              the screen to black (1) or open (0)
     bars   { to, s }                              the thin bars top and bottom (0 to 1)
     camera { at, zoom, s, ease } | { follow: who, zoom, s } | { release: true, s }
     place  { who, at, face }                      set someone down (face: 'n','s','e','w', degrees, or { at } to look at)
     show / hide { who }
     walk   { who, to, speed, run }                walk (units a second; 40 a stroll, 70 a jog) along to, facing the way
     face   { who, dir | toward }
     play   { who, clip, s, hold }                 a clip for s seconds, then back to standing (hold: keep it)
     say    { who, text | lore, s }                the speech board over his head; waits s (or by the line's length)
     talk   { who, text | lore | lines }           the talk window; waits until the player has read it
     card   { title, sub }                         the place lettering
     crowd  { group, around, r, n, arc, face }     extras standing round a place, facing it
     fx     { name, ... }                          the game's effects: 'dark' { to, s }, 'flash', 'thunder', 'bolt' { at },
                                                   'stones' { at }, 'blood' { at }, 'flow' { on }, 'glow' { on }
     music  { name }   sound { name }   flag { key, value }   input { on }   hud { on }
     call   { fn, args }                           a game hook (env.call), waits for its done unless "wait": false
     par    { steps }
   Each step may carry "note" (for the editor) and "id" (for play-from).

   The env (the game's side; the scene touches nothing else):
     env.place(name) -> { x, y } | null           env.actor(who, castDef) -> a handle | null      env.release()
       handle: { x, y, face } read; set(x, y), turn(rad), moving(bool, run), clip(name | null, hold), say(text, s), show(bool)
     env.camNow() -> { x, y, z }                   env.camera({ x, y, z } | null)                 (the player eases; null gives it back)
     env.fade(k)   env.bars(k)   env.card(title, sub)   env.talk(handle, lines, done)   env.lore(id) -> lines
     env.fx(name, args, done)   env.music(name)   env.sound(name)   env.flag(k, v)   env.call(fn, args, done)
     env.input(on)   env.hud(on)
   The game calls runner.tick(dt) every frame while it plays, and runner.skip() on the skip key. */
var CutScene = (function () {
'use strict';
var D2R = Math.PI / 180, DIRS = { e: 0, se: 45, s: 90, sw: 135, w: 180, nw: 225, n: 270, ne: 315 };
function ease(k, how) { k = Math.max(0, Math.min(1, k)); if (how === 'linear') return k; if (how === 'in') return k * k; if (how === 'out') return 1 - (1 - k) * (1 - k); return k * k * (3 - 2 * k); }
function lerp(a, b, k) { return a + (b - a) * k; }
function isPath(to) { return Array.isArray(to) && to.length > 0 && typeof to[0] === 'object'; }   // a list of points (each { at, dx, dy } or [dx, dy]), not one [dx, dy]
function start(scene, env, opts) {
  opts = opts || {};
  var R = { scene: scene, env: env, i: 0, t: 0, done: false, tasks: [], bg: [], cast: {}, anchor: null, camCur: null, camTo: null, camOn: false, fadeK: 0, barsK: 0, onEnd: opts.onEnd || null, log: opts.log || null, skipping: false };
  R.anchor = (scene.anchor && env.place(scene.anchor)) || env.place('hero') || { x: 0, y: 0 };
  function who(w) { if (!w) return null; if (R.cast[w] !== undefined) return R.cast[w]; var h = env.actor(w, (scene.cast || {})[w] || null); R.cast[w] = h || null; if (!h && R.log) R.log('no one plays "' + w + '"'); return h; }
  function pos(p) {   // a position: from the anchor, a named place, or a figure
    if (!p) return { x: R.anchor.x, y: R.anchor.y };
    if (Array.isArray(p)) return { x: R.anchor.x + p[0], y: R.anchor.y + p[1] };
    var base = R.anchor;
    if (p.at && p.at !== scene.anchor) { var h = R.cast[p.at] !== undefined || (scene.cast && scene.cast[p.at]) || p.at === 'hero' ? who(p.at) : null; base = h ? { x: h.x, y: h.y } : (env.place(p.at) || R.anchor); }
    return { x: base.x + (p.dx || 0), y: base.y + (p.dy || 0) };
  }
  function faceOf(h, f) { if (f == null) return null; if (typeof f === 'number') return f * D2R; if (typeof f === 'string') { if (DIRS[f] != null) return DIRS[f] * D2R; var o = who(f); return o ? Math.atan2(o.y - h.y, o.x - h.x) : null; } var q = pos(f); return Math.atan2(q.y - h.y, q.x - h.x); }
  function lines(s) { var L = s.lore ? env.lore(s.lore) : null; if (L && L.length && L.join('').trim()) return s.line != null ? [L[s.line] || ''] : L;   // line: one line of a lore entry said a beat (a sequence entry, Alistair, LD's way)
    return s.lines || (s.text != null ? [s.text] : ['']); }   // the lore's words when it has them, else the scene's own (a stand-in until the lore is written)
  // ---- a step becomes a task: { tick(dt) -> true when done, finish() to end it at once }
  function task(s) {
    var k = s.do, T = 0, dur = s.s != null ? +s.s : 0;
    var timed = function (fn, d) { var D = Math.max(0.0001, d); return { tick: function (dt) { T += dt; fn(Math.min(1, T / D)); return T >= D; }, finish: function () { fn(1); } }; };
    var once = function (fn) { return { tick: function () { fn(); return true; }, finish: fn }; };
    if (k === 'wait') return timed(function () {}, dur);
    if (k === 'fade') { var f0 = R.fadeK, f1 = s.to != null ? +s.to : 1; return timed(function (u) { R.fadeK = lerp(f0, f1, ease(u, s.ease)); env.fade(R.fadeK); }, dur || 0.8); }
    if (k === 'bars') { var b0 = R.barsK, b1 = s.to != null ? +s.to : 1; return timed(function (u) { R.barsK = lerp(b0, b1, ease(u, s.ease)); env.bars(R.barsK); }, dur || 0.6); }
    if (k === 'camera') {
      if (s.release) { var r0 = null; return timed(function (u) { if (!r0) r0 = R.camCur || camNow(); var h0 = env.place('hero') || r0, e1 = ease(u, s.ease); if (u >= 1) { R.camOn = false; R.follow = null; R.camCur = null; env.camera(null); return; } R.camCur = { x: lerp(r0.x, h0.x, e1), y: lerp(r0.y, h0.y, e1), z: lerp(r0.z, 1, e1) }; env.camera(R.camCur); }, dur || 0.8); }   // eased back to the hero, then given back
      var c0 = null; return timed(function (u) { if (!c0) { c0 = R.camCur || camNow(); R.camOn = true; R.follow = s.follow ? who(s.follow) : null; } var q = s.follow ? (R.follow ? { x: R.follow.x, y: R.follow.y } : c0) : pos(s.at); R.camTo = { x: q.x, y: q.y, z: s.zoom != null ? +s.zoom : (c0.z || 1) }; var e2 = ease(u, s.ease); R.camCur = { x: lerp(c0.x, R.camTo.x, e2), y: lerp(c0.y, R.camTo.y, e2), z: lerp(c0.z, R.camTo.z, e2) }; env.camera(R.camCur); }, dur || 0.0001);
    }
    if (k === 'place') return once(function () { var h = who(s.who); if (!h) return; var q = pos(s.at); h.set(q.x, q.y); h.show(true); var f = faceOf(h, s.face); if (f != null) h.turn(f); h.moving(false); });
    if (k === 'show' || k === 'hide') return once(function () { var h = who(s.who); if (h) h.show(k === 'show'); });
    if (k === 'face') return once(function () { var h = who(s.who); if (!h) return; var f = faceOf(h, s.toward != null ? s.toward : s.dir); if (f != null) h.turn(f); });
    if (k === 'walk') {
      var h = null, path = null, seg = 0, spd = +(s.speed || (s.run ? 70 : 40));
      return { tick: function (dt) { if (!h) { h = who(s.who); if (!h) return true; path = isPath(s.to) ? s.to.map(pos) : [pos(s.to)]; h.show(true); }
          var q = path[seg], dx = q.x - h.x, dy = q.y - h.y, d = Math.hypot(dx, dy), st = spd * dt;
          if (d <= st) { h.set(q.x, q.y); seg++; if (seg >= path.length) { h.moving(false); if (s.face != null) { var f = faceOf(h, s.face); if (f != null) h.turn(f); } return true; } return false; }
          h.turn(Math.atan2(dy, dx)); h.set(h.x + dx / d * st, h.y + dy / d * st); h.moving(true, !!s.run); return false; },
        finish: function () { if (!h) h = who(s.who); if (!h) return; var to = isPath(s.to) ? s.to[s.to.length - 1] : s.to, q = pos(to); h.set(q.x, q.y); h.moving(false); if (s.face != null) { var f = faceOf(h, s.face); if (f != null) h.turn(f); } } };
    }
    if (k === 'play') { var hp = null; return { tick: function (dt) { if (!hp) { hp = who(s.who); if (!hp) return true; hp.clip(s.clip, !!s.hold); } T += dt; if (T >= (dur || 1)) { if (!s.hold) hp.clip(null); return true; } return false; }, finish: function () { var h2 = hp || who(s.who); if (h2 && !s.hold) h2.clip(null); } }; }
    if (k === 'say') { var L = lines(s).join(' '), sd = dur || Math.max(2.2, Math.min(7, 1.4 + L.length * 0.055)); var hs = null; return { tick: function (dt) { if (!hs) { hs = who(s.who); if (hs) hs.say(L, sd); } T += dt; return T >= sd; }, finish: function () { var h2 = hs || who(s.who); if (h2) h2.say('', 0); } }; }
    if (k === 'talk') { var st2 = 0; return { tick: function () { if (!st2) { st2 = 1; var ht = who(s.who); env.talk(ht, lines(s), function () { st2 = 2; }); } return st2 === 2; }, finish: function () {} }; }
    if (k === 'card') return once(function () { env.card(s.title, s.sub); });
    if (k === 'crowd') return once(function () {   // extras standing round a place in an arc, each facing it
      var c = pos(s.around), n = s.n || 8, r = s.r || 60, arc = (s.arc != null ? s.arc : 300) * D2R, a0 = (s.from != null ? s.from : 90) * D2R - arc / 2;
      for (var i = 0; i < n; i++) { var nm = (s.group || 'folk') + ':' + i, hc = who(nm); if (!hc) continue; var a = a0 + arc * (n > 1 ? i / (n - 1) : 0.5), rr = r * (0.9 + 0.2 * ((i * 7919) % 11) / 11); hc.set(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr * 0.8); hc.show(true); hc.moving(false); hc.turn(Math.atan2(c.y - hc.y, c.x - hc.x)); } });
    if (k === 'fx') { var st3 = 0; var args = {}; for (var key in s) if (key !== 'do' && key !== 'name' && key !== 'wait' && key !== 'note') args[key] = s[key]; if (s.at) { var pa = pos(s.at); args.x = pa.x; args.y = pa.y; }
      return { tick: function (dt) { if (!st3) { st3 = 1; env.fx(s.name, args, function () { st3 = 2; }); if (!dur) return st3 === 2 || !s.hold; } T += dt; return dur ? T >= dur : st3 === 2; }, finish: function () {} }; }
    if (k === 'music') return once(function () { env.music(s.name || null); });
    if (k === 'sound') return once(function () { env.sound(s.name); });
    if (k === 'flag') return once(function () { env.flag(s.key, s.value != null ? s.value : true); });
    if (k === 'input') return once(function () { env.input(s.on !== false); });
    if (k === 'hud') return once(function () { env.hud(s.on !== false); });
    if (k === 'call') { var st4 = 0; return { tick: function () { if (!st4) { st4 = 1; env.call(s.fn, s.args || {}, function () { st4 = 2; }); } return st4 === 2; }, finish: function () { if (!st4) { st4 = 1; env.call(s.fn, s.args || {}, function () { st4 = 2; }); } } }; }   // (a call finished at once, as the end list and a skip do, still runs its hook: Clive, GD, 2026-10-29, blotAfter never ran)
    if (k === 'par') { var sub = (s.steps || []).map(task), left = sub.map(function () { return true; }); return { tick: function (dt) { var any = false; sub.forEach(function (t, j) { if (left[j]) { if (t.tick(dt)) left[j] = false; else any = true; } }); return !any; }, finish: function () { sub.forEach(function (t, j) { if (left[j]) t.finish(); }); } }; }
    if (R.log) R.log('no such step: ' + k);
    return once(function () {});
  }
  function camNow() { var c = env.camNow(); return { x: c.x, y: c.y, z: c.z || 1 }; }
  function finishAll() { R.tasks.forEach(function (t) { t.finish(); }); R.bg.forEach(function (t) { t.finish(); }); R.tasks = []; R.bg = []; }
  function endState() {   // the scene's end: its `end` steps at once, then what the player always gives back
    (scene.end || []).forEach(function (s) { var t = task(s); t.finish(); });
    R.camOn = false; R.follow = null; env.camera(null); env.bars(0); R.barsK = 0;
    var fadeLeft = (scene.end || []).some(function (s) { return s.do === 'fade' && s.to > 0; }); if (!fadeLeft) { env.fade(0); R.fadeK = 0; }
    env.input(true); env.hud(true); env.release(); R.done = true; if (R.onEnd) R.onEnd(R.skipping ? 'skipped' : 'ended');
  }
  R.steps = scene.steps || [];
  if (opts.from) {   // play from a step (the editor): the steps before it are done at once, without waiting
    for (var j = 0; j < Math.min(opts.from, R.steps.length); j++) { var tk = task(R.steps[j]); if (R.steps[j].do !== 'talk' && R.steps[j].do !== 'call') tk.finish(); } R.i = Math.min(opts.from, R.steps.length);
  }
  env.input(false); env.hud(false);
  R.tick = function (dt) {
    if (R.done) return; R.t += dt;
    R.bg = R.bg.filter(function (t) { return !t.tick(dt); });
    if (R.follow && R.camOn && !R.tasks.length) { R.camCur = { x: lerp(R.camCur.x, R.follow.x, Math.min(1, dt * 4)), y: lerp(R.camCur.y, R.follow.y, Math.min(1, dt * 4)), z: R.camCur.z }; env.camera(R.camCur); }
    var guard = 0;
    while (guard++ < 64) {
      if (!R.tasks.length) {
        if (R.i >= R.steps.length) { if (!R.bg.length) { endState(); } return; }
        var s = R.steps[R.i++], t = task(s); if (R.log) R.log('step ' + R.i + ': ' + s.do + (s.note ? ' (' + s.note + ')' : ''));
        if (s.wait === false) { if (!t.tick(0)) R.bg.push(t); continue; }
        if (t.tick(0)) continue; R.tasks.push(t); return;
      }
      if (R.tasks[0].tick(dt)) { R.tasks.shift(); dt = 0; continue; } return;
    }
  };
  R.skip = function () { if (R.done || scene.skip === false) return; R.skipping = true; finishAll(); R.i = R.steps.length; endState(); };
  R.stop = function () { if (R.done) return; R.skipping = true; finishAll(); endState(); };
  R.stepAt = function () { return R.i; };
  return R;
}
function check(scene) {   // what the editor and the tests ask: is it well formed? Returns a list of problems in words
  var out = [], KINDS = { wait: 1, fade: 1, bars: 1, camera: 1, place: 1, show: 1, hide: 1, walk: 1, face: 1, play: 1, say: 1, talk: 1, card: 1, crowd: 1, fx: 1, music: 1, sound: 1, flag: 1, input: 1, hud: 1, call: 1, par: 1 };
  if (!scene || !Array.isArray(scene.steps)) return ['no steps'];
  function walk(list, where) { list.forEach(function (s, i) { var at = where + (i + 1); if (!s || !KINDS[s.do]) out.push(at + ': no such step "' + (s && s.do) + '"'); else { if ((s.do === 'walk' || s.do === 'place' || s.do === 'play' || s.do === 'say' || s.do === 'face') && !s.who) out.push(at + ': ' + s.do + ' names no one'); if (s.do === 'walk' && !s.to) out.push(at + ': walk has no "to"'); if (s.do === 'par') walk(s.steps || [], at + '.'); } }); }
  walk(scene.steps, 'step '); walk(scene.end || [], 'end ');
  if (!(scene.end || []).length) out.push('no end steps: a skip would leave the world as the skip found it');
  return out;
}
function length(scene) {   // a rough running time, for the editor's timeline: talks counted at 4 s a line
  function d(s) { if (!s) return 0; if (s.do === 'par') return Math.max.apply(null, [0].concat((s.steps || []).map(d))); if (s.wait === false) return 0;
    if (s.do === 'say') { var L = (s.lines || [s.text || '']).join(' '); return s.s || Math.max(2.2, Math.min(7, 1.4 + L.length * 0.055)); } if (s.do === 'talk') return 4 * ((s.lines || [1]).length);
    if (s.do === 'walk') return 2.5; return s.s != null ? +s.s : (s.do === 'fade' ? 0.8 : s.do === 'bars' ? 0.6 : 0); }
  return (scene.steps || []).reduce(function (a, s) { return a + d(s); }, 0);
}
return { start: start, check: check, length: length, DIRS: DIRS };
})();
if (typeof module !== 'undefined') module.exports = CutScene;
