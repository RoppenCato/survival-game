/* Sprites: the Blender models' sheets drawn in the game and the editors (2026-10-09, the first foundation of docs/moving-to-blender.md;
   Robin: the new character model in every editor and the game). A sheet set is what tools/sprites.js packs into assets/sprites/<name>/
   and tools/build.py inlines as __SPRITES__ ({ name: { meta, images: { file: path } } }). `hero(SP)` loads the game's hero model
   (game.blenderHero in storage, else hero2-mixamo, else the first sheet); `attach(Combat, H, opts)` makes it the engine's hero
   through Combat.api.heroSprite, with the clips chosen from the engine's own state (walk and run, the attack's phases for the
   slashes, chop and mine by the tool in hand, the hit, sitting, the bow's shot, death) and the cast shadow laid as the props throw
   theirs; `play(H, name, then)` queues a one-shot clip; `drawDead(c, H, ...)` draws the fallen hero where a page lists it (the engine
   draws no hero when dead). Loads in the browser and in Node (nothing touches the document until a sheet is drawn). */
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.Sprites = factory(); })(typeof self !== 'undefined' ? self : this, function () {
  var PX = 3;                                                     // the sheets are rendered at the game's 3 px a unit
  var DIRS8 = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'], DIRS4 = ['s', 'w', 'n', 'e'];
  function load(SP, name) {
    var set = SP && SP[name]; if (!set) return null;
    var H = { name: name, meta: set.meta, img: {}, sil: {}, clip: null, fireT: 0, deadT: 0, last: null };
    for (var f in set.images) { var im = new Image(); im.src = set.images[f]; H.img[f] = im; }
    return H;
  }
  function heroName(SP, storage) {
    var want = null; try { want = storage && storage.getItem('game.blenderHero'); } catch (e) {}
    if (want && SP && SP[want]) return want;
    if (SP && SP['hero2-mixamo']) return 'hero2-mixamo';
    var names = SP ? Object.keys(SP) : []; return names.length ? names[0] : null;
  }
  function hero(SP, storage) { var nm = heroName(SP, storage); return nm ? load(SP, nm) : null; }
  function scaleOf(storage) { var s = 1; try { var v = parseFloat(storage && storage.getItem('game.blenderScale')); if (v > 0) s = v; } catch (e) {} return s; }
  function dirOf(M, face) {
    var n = M.dirs.length, i = Math.round((face - Math.PI / 2) / (2 * Math.PI / n)); i = ((i % n) + n) % n;
    var want = (n === 8 ? DIRS8 : DIRS4)[i], k = M.dirs.indexOf(want); return k < 0 ? 0 : k;
  }
  function play(H, name, then) { if (!H || !H.meta.anims[name]) return false; H.clip = { name: name, t0: now(), then: then || null }; return true; }
  function now() { return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000; }
  function frameAt(A, k) { return Math.max(0, Math.min(A.frames - 1, Math.floor(k * A.frames))); }
  function loopFrame(A, t) { return Math.floor(t * A.fps) % A.frames; }
  // which clip and frame the hero's state asks for. opts: stepData() (the engine's attack step), tool() ('pick', 'axe', ... or null)
  function pick(H, P, an, opts) {
    var A = H.meta.anims, t = now(), a = P.atk;
    if (P.dead) { if (!A.death) return null; return { a: 'death', f: Math.min(A.death.frames - 1, Math.floor((t - H.deadT) * A.death.fps)) }; }
    if (a && a.ph !== 'none' && opts.stepData) {                     // the attack's phases drive the clip: windup, the blow, the recovery
      var sd = opts.stepData(), tot = sd.wu + sd.ac + sd.rec, el = a.ph === 'windup' ? a.t : a.ph === 'active' ? sd.wu + a.t : sd.wu + sd.ac + a.t, k = Math.max(0, Math.min(0.999, el / tot)), nm;
      if (P.mode === 'gather') { var tl = opts.tool ? opts.tool() : null; nm = tl === 'pick' ? 'mine' : 'chop'; }
      else nm = (a.combo % 2) ? 'attack2' : 'attack1';
      if (A[nm]) return { a: nm, f: frameAt(A[nm], k) };
    }
    if (H.clip) { var C = A[H.clip.name], cf = Math.floor((t - H.clip.t0) * C.fps); if (cf >= C.frames) { var nx = H.clip.then; H.clip = null; if (nx) play(H, nx.name, nx.then); } else return { a: H.clip.name, f: cf }; }
    if (P.hurtT > 0 && A.hit) { var hk = 1 - P.hurtT / 0.35; return { a: 'hit', f: frameAt(A.hit, Math.max(0, Math.min(0.999, hk * 0.6))) }; }
    if (an && an.sit && A.sit) return { a: 'sit', f: loopFrame(A.sit, t) };
    var moving = an && an.amt > 0.35, nm2 = moving ? (P.sprinting && A.run ? 'run' : (A.walk ? 'walk' : 'idle')) : 'idle';
    return { a: nm2, f: loopFrame(A[nm2], t) };
  }
  // a sheet recoloured once per tint (the metal of a thing in the hand, by its material): the colour laid over the pixels at 0.6
  function tinted(H, im, file, tint) {
    var key = file + '|' + tint, cv2 = H.sil[key]; if (cv2) return cv2;
    cv2 = document.createElement('canvas'); cv2.width = im.naturalWidth; cv2.height = im.naturalHeight; var g = cv2.getContext('2d');
    g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.6; g.fillStyle = tint; g.fillRect(0, 0, cv2.width, cv2.height);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.35; g.drawImage(im, 0, 0); H.sil[key] = cv2; return cv2;
  }
  // where a hand is for a drawn frame: [dx, dy, depth] from the feet in world units (null when the sheet has no hands); which is 0 right, 1 left
  function hand(H, pk, face, which, scale) {
    var M = H.meta, A = M.anims[pk.a]; if (!A.hands) return null; var d = M.dirs[dirOf(M, face)], rows = A.hands[d]; if (!rows || !rows[pk.f]) return null;
    var h = rows[pk.f][which || 0], s = (scale || 1) / PX; return h ? [(h[0] - M.anchor.x) * s, (h[1] - M.anchor.y) * s, h[2]] : null;
  }
  function silOf(H, im, file, hue) {
    var cv2 = H.sil[file]; if (cv2) return cv2;
    cv2 = document.createElement('canvas'); cv2.width = im.naturalWidth; cv2.height = im.naturalHeight; var g = cv2.getContext('2d');
    g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'hsl(' + (hue || 222) + ',40%,8%)'; g.fillRect(0, 0, cv2.width, cv2.height); H.sil[file] = cv2; return cv2;
  }
  // the frame's silhouette laid on the ground as the props' long shadows lie: to the lower right, a point h up lands at (0.5 h, 0.14 h)
  function cast(c, H, im, file, hue, sx0, sy0, sw, sh, dx, dy, dw, dh) {
    var sil = silOf(H, im, file, hue); c.save(); c.globalAlpha = 0.3; c.beginPath(); c.rect(-200, -400, 400, 400); c.clip(); c.transform(1, 0, -0.5, -0.14, 0, 0); c.drawImage(sil, sx0, sy0, sw, sh, dx, dy, dw, dh); c.restore();
  }
  // draws the hero at (x, y) (the feet, in the camera's space). opts: scale (1 is the render's size), shadow (true), shadowHue, layers (['body'] plus gear)
  function draw(c, H, x, y, face, an, dashing, P, opts) {
    opts = opts || {}; var M = H.meta, pk = pick(H, P, an, opts); H.last = pk; if (!pk) return;
    var A = M.anims[pk.a], d = dirOf(M, face), fw = M.frame.w, fh = M.frame.h, s = (opts.scale || 1) / PX, layers = opts.layers || ['body'];
    var im = H.img[A.sheets.body]; if (!im || !im.complete || !im.naturalWidth) return;
    c.save(); c.translate(x, y); if (dashing) c.scale(1.1, 0.92);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    if (opts.shadow !== false && !P.dead) cast(c, H, im, A.sheets.body, opts.shadowHue, pk.f * fw, d * fh, fw, fh, -M.anchor.x * s, -M.anchor.y * s, fw * s, fh * s);
    for (var i = 0; i < layers.length; i++) {                     // a layer is a name, or { layer, tint } for a recoloured one
      var L = layers[i], ln = typeof L === 'string' ? L : L.layer, file = A.sheets[ln]; if (!file) continue;
      var li = H.img[file]; if (!li || !li.complete || !li.naturalWidth) continue;
      var src = typeof L === 'string' || !L.tint ? li : tinted(H, li, file, L.tint);
      c.drawImage(src, pk.f * fw, d * fh, fw, fh, -M.anchor.x * s, -M.anchor.y * s, fw * s, fh * s);
    }
    c.restore();
  }
  // once a frame: the one-shot clips the engine's state does not carry (the bow's shot) and the moment of death
  function tick(H, P) {
    if (!H) return;
    if (P.fireT > H.fireT) play(H, 'bow_shoot'); H.fireT = P.fireT;
    if (P.dead && !H.deadT) H.deadT = now(); if (!P.dead) H.deadT = 0;
  }
  // the engine's hero: Combat.api.heroSprite draws from the sheet; opts may give scale(), tool(), shadow(), shadowHue, layers()
  function attach(Combat, H, opts) {
    opts = opts || {};
    if (!H) { Combat.api.heroSprite = null; return null; }
    Combat.api.heroSprite = function (c, x, y, face, an, dashing) {
      var P = Combat.dbg().P; tick(H, P);
      draw(c, H, x, y, face, an, dashing, P, { scale: opts.scale ? opts.scale() : 1, shadow: opts.shadow ? opts.shadow() : true, shadowHue: opts.shadowHue, layers: opts.layers ? opts.layers() : null, stepData: Combat.api.stepData, tool: opts.tool });
    };
    return H;
  }
  function drawDead(c, H, x, y, face, an, P, opts) { if (H) { tick(H, P); draw(c, H, x, y, face, an, false, P, opts || {}); } }
  return { PX: PX, load: load, hero: hero, heroName: heroName, scaleOf: scaleOf, dirOf: dirOf, play: play, pick: pick, draw: draw, tick: tick, attach: attach, drawDead: drawDead, cast: cast, hand: hand, tinted: tinted };
});
