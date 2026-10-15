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
  /* Slow clips are melted from one frame into the next (2026-10-12, Robin: the new creatures' idles looked laggy; they are
     rendered at five to eight frames a second, and more frames would be sheets of many megabytes). loopAt says which two
     frames the clock lies between and how far; mixTo draws the two into a small canvas, each at its share and added, which
     is the true in-between of the two pictures, edges and all. Only clips that move little: a walk would show two sets of legs. */
  var BLEND = { idle: 1, idle_look: 1, sit: 1, play: 1 };
  function blends(nm, A) { return !!A && A.frames > 1 && (BLEND[nm] || A.blend) && typeof document !== 'undefined'; }
  function loopAt(A, t) { var p = (t * A.fps) % A.frames; if (p < 0) p += A.frames; var f = Math.floor(p) % A.frames; return { f: f, f2: (f + 1) % A.frames, w: p - Math.floor(p) }; }
  function mixTo(H, im, fw, fh, d, f, f2, w) {
    var MB = H.mixBy || (H.mixBy = {}), mk = fw + 'x' + fh, cv2 = MB[mk]; if (!cv2) { cv2 = MB[mk] = document.createElement('canvas'); cv2.width = fw; cv2.height = fh; }   /* (a canvas a size: a layer in a box of its own is another size than the body, every frame) */
    var g = cv2.getContext('2d'); g.globalCompositeOperation = 'copy'; g.globalAlpha = 1 - w; g.drawImage(im, f * fw, d * fh, fw, fh, 0, 0, fw, fh);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = w; g.drawImage(im, f2 * fw, d * fh, fw, fh, 0, 0, fw, fh); return cv2;
  }
  function shows(A, layers) { var sh = A.sheets || {}, i, n; for (i = 0; i < layers.length; i++) { n = typeof layers[i] === 'string' ? layers[i] : layers[i] && layers[i].layer; if (!n || n === 'body' || /^shield/.test(n)) continue; if (!sh[n]) return false; } return true; }   /* does the clip hold every layer of what is in the hand */
  // which clip and frame the hero's state asks for. opts: stepData() (the engine's attack step), tool() ('pick', 'axe', ... or null)
  function pick(H, P, an, opts) {
    var A = H.meta.anims, t = now(), a = P.atk;
    if (P.dead) { if (!A.death) return null; return { a: 'death', f: Math.min(A.death.frames - 1, Math.floor((t - H.deadT) * A.death.fps)) }; }
    if (a && a.ph !== 'none' && opts.stepData) {                     // the attack's phases drive the clip: windup, the blow, the recovery
      var sd = opts.stepData(), tot = sd.wu + sd.ac + sd.rec, el = a.ph === 'windup' ? a.t : a.ph === 'active' ? sd.wu + a.t : sd.wu + sd.ac + a.t, k = Math.max(0, Math.min(0.999, el / tot)), nm;
      if (P.mode === 'gather') { var tl = opts.tool ? opts.tool() : null; nm = tl === 'pick' ? 'mine' : 'chop'; }
      else nm = (a.combo % 2) ? 'attack2' : 'attack1';
      if (A[nm] && A.chop && opts.layers && !shows(A[nm], opts.layers) && shows(A.chop, opts.layers)) nm = 'chop';   /* a clip that cannot show what is in the hand (the hero's slashes have no axe: Robin, 2026-10-15, "the axe seems invisible when hitting") gives way to one that can: the chop, an overhead axe blow */
      if (A[nm]) return { a: nm, f: frameAt(A[nm], k) };
    }
    if (H.clip && !A[H.clip.name]) H.clip = null;
    if (H.clip) { var C = A[H.clip.name], cf = Math.floor((t - H.clip.t0) * C.fps); if (cf >= C.frames) { var nx = H.clip.then; H.clip = null; if (nx) play(H, nx.name, nx.then); } else return { a: H.clip.name, f: cf }; }
    if (P.hurtT > 0 && A.hit) { var hk = 1 - P.hurtT / 0.35; return { a: 'hit', f: frameAt(A.hit, Math.max(0, Math.min(0.999, hk * 0.6))) }; }
    if ((H.blk || 0) > 0.02 && A.block && !(an && an.sit)) {          // the guard is up (H.blk, eased in tick): the left arm brought across as he stands, held across through the walk
      if (!(an && an.amt > 0.3)) return { a: 'block', f: frameAt(A.block, Math.min(0.999, H.blk)) };
      if (H.blk > 0.5 && A.block_walk) return { a: 'block_walk', f: loopFrame(A.block_walk, t * 0.62) };   /* (he walks at about half his pace with it up) */
    }
    if (an && an.sit && A.sit) { var ls = loopAt(A.sit, t); return { a: 'sit', f: ls.f, f2: ls.f2, w: ls.w }; }
    var moving = an && an.amt > 0.35, nm2 = moving ? (P.sprinting && A.run ? 'run' : (A.walk ? 'walk' : 'idle')) : 'idle';
    if (!A[nm2]) return null;                                          // a sheet set with no such clip draws nothing (it threw)
    if (nm2 === 'idle') { var li = loopAt(A.idle, t); return { a: 'idle', f: li.f, f2: li.f2, w: li.w }; }
    return { a: nm2, f: loopFrame(A[nm2], t) };
  }
  // a sheet recoloured once per tint (the metal of a thing in the hand, by its material): the colour laid over the pixels at 0.6
  function tinted(H, im, file, tint) {
    var key = file + '|' + tint, cv2 = H.sil[key]; if (cv2) return cv2;
    cv2 = document.createElement('canvas'); cv2.width = im.naturalWidth; cv2.height = im.naturalHeight; var g = cv2.getContext('2d');
    g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.6; g.fillStyle = tint; g.fillRect(0, 0, cv2.width, cv2.height);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.35; g.drawImage(im, 0, 0); H.sil[key] = cv2; return cv2;
  }
  // a colour multiplied into one frame (2026-10-13, the shield's face: rendered near white, so the colour comes out shaded as the
  // render shaded it). Done a frame at a time into a small canvas: a whole sheet recoloured, as tinted() does, is a canvas of
  // twenty million pixels for the idle alone. src is a sheet (sx, sy: the frame's corner) or a frame already mixed (0, 0).
  function mulTo(H, src, sx, sy, fw, fh, tint) {
    if (typeof document === 'undefined') return null;
    var UB = H.mulBy || (H.mulBy = {}), uk = fw + 'x' + fh, cv2 = UB[uk]; if (!cv2) { cv2 = UB[uk] = document.createElement('canvas'); cv2.width = fw; cv2.height = fh; }
    var g = cv2.getContext('2d'); g.globalAlpha = 1; g.globalCompositeOperation = 'copy'; g.drawImage(src, sx, sy, fw, fh, 0, 0, fw, fh);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(0, 0, fw, fh);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(src, sx, sy, fw, fh, 0, 0, fw, fh); g.globalCompositeOperation = 'source-over'; return cv2;
  }
  // the same for a whole sheet, kept (an editor's sheet view)
  function tintedMul(H, im, file, tint) {
    var key = file + '|m|' + tint, cv2 = H.sil[key]; if (cv2) return cv2;
    cv2 = document.createElement('canvas'); cv2.width = im.naturalWidth; cv2.height = im.naturalHeight; var g = cv2.getContext('2d');
    g.drawImage(im, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(0, 0, cv2.width, cv2.height);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0); H.sil[key] = cv2; return cv2;
  }
  /* The hero's shield (2026-10-13, Robin: "create a shield and implement it"; art/build/shield_build.py): three layers on his
     left forearm. shieldRim is what is never coloured (the boards' back, the rawhide rim, the iron boss, the seams);
     shieldFace takes a colour multiplied in (bare limewood, or paint); shieldMark is two opposite quarters for a second
     colour (the device of a painted shield). shieldInto puts them among a hero's layers: over the thing in his right hand
     when his left side is toward us (he faces west or toward us), under it when it is the far side. paint: { face, mark }. */
  var SHIELD_WOOD = '#b98a5a', SHIELD_MARK = '#e4dac2';
  function shieldInto(out, M, face, paint) {
    if (!M || M.layers.indexOf('shieldRim') < 0) return out; paint = paint || {};
    var Sh = ['shieldRim', { layer: 'shieldFace', tint: paint.face || SHIELD_WOOD, mul: true }]; if (paint.mark) Sh.push({ layer: 'shieldMark', tint: paint.mark, mul: true });
    var d = M.dirs[dirOf(M, face == null ? Math.PI / 2 : face)], near = d === 'w' || d === 'sw' || d === 'nw' || d === 's';
    return near ? out.concat(Sh) : [out[0]].concat(Sh, out.slice(1));
  }
  // where a hand is for a drawn frame: [dx, dy, depth] from the feet in world units (null when the sheet has no hands); which is 0 right, 1 left
  function hand(H, pk, face, which, scale) {
    var M = H.meta, A = M.anims[pk.a]; if (!A.hands) return null; var d = M.dirs[dirOf(M, face)], rows = A.hands[d]; if (!rows || !rows[pk.f]) return null;
    var h = rows[pk.f][which || 0], s = (scale || 1) / PX, AN = A.anchor || M.anchor; return h ? [(h[0] - AN.x) * s, (h[1] - AN.y) * s, h[2]] : null;
  }
  function silOf(H, im, file, hue) {
    var cv2 = H.sil[file]; if (cv2) return cv2;
    cv2 = document.createElement('canvas'); cv2.width = im.naturalWidth; cv2.height = im.naturalHeight; var g = cv2.getContext('2d');
    g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'hsl(' + (hue || 222) + ',40%,8%)'; g.fillRect(0, 0, cv2.width, cv2.height); H.sil[file] = cv2; return cv2;
  }
  // the frame's silhouette laid on the ground as the props' long shadows lie: to the lower right, a point h up lands at (0.5 h, 0.14 h)
  function cast(c, H, im, file, hue, sx0, sy0, sw, sh, dx, dy, dw, dh, to) {
    var sil = silOf(H, im, file, hue); c.save();
    if (to) { c.globalAlpha *= to.a; c.transform(1, 0, -to.kx, -to.ky, 0, 0); }                    // thrown by a fire: away from it, the page says how far (a point h up lands at (kx h, ky h))
    else { c.globalAlpha = 0.3; c.beginPath(); c.rect(-200, -400, 400, 400); c.clip(); c.transform(1, 0, -0.5, -0.14, 0, 0); }
    c.drawImage(sil, sx0, sy0, sw, sh, dx, dy, dw, dh); c.restore();
  }
  // the frame's shape in one colour (made once a sheet and colour): for the side of a figure a fire lights, and the side it does not
  function silC(H, im, file, col) {
    var key = file + '|c|' + col, cv2 = H.sil[key]; if (cv2) return cv2;
    cv2 = document.createElement('canvas'); cv2.width = im.naturalWidth; cv2.height = im.naturalHeight; var g = cv2.getContext('2d');
    g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, cv2.width, cv2.height); H.sil[key] = cv2; return cv2;
  }
  // lit: what a fire near the figure does to it (the page works it out): { cast: { kx, ky, a }, rim: { a, ox, oy }, dark, warm }
  function litUnder(c, H, im, file, lit, sx0, sy0, sw, sh, dx, dy, dw, dh) { if (lit && lit.rim) { var ga = c.globalAlpha; c.globalAlpha = ga * lit.rim.a; c.drawImage(silC(H, im, file, '#ffb45e'), sx0, sy0, sw, sh, dx + lit.rim.ox, dy + lit.rim.oy, dw, dh); c.globalAlpha = ga; } }
  function litOver(c, H, im, file, lit, sx0, sy0, sw, sh, dx, dy, dw, dh) {
    if (!lit) return; var ga = c.globalAlpha;
    if (lit.dark) { c.globalAlpha = ga * lit.dark; c.drawImage(silC(H, im, file, '#060a1c'), sx0, sy0, sw, sh, dx, dy, dw, dh); }
    else if (lit.warm) { var op = c.globalCompositeOperation; c.globalCompositeOperation = 'lighter'; c.globalAlpha = ga * lit.warm; c.drawImage(silC(H, im, file, '#ff8a2a'), sx0, sy0, sw, sh, dx, dy, dw, dh); c.globalCompositeOperation = op; }
    c.globalAlpha = ga;
  }
  // draws the hero at (x, y) (the feet, in the camera's space). opts: scale (1 is the render's size), shadow (true), shadowHue, layers (['body'] plus gear)
  function draw(c, H, x, y, face, an, dashing, P, opts) {
    opts = opts || {}; var M = H.meta, pk = pick(H, P, an, opts); H.last = pk; if (!pk) return;
    var A = M.anims[pk.a], d = dirOf(M, face), F0 = A.frame || M.frame, AN = A.anchor || M.anchor, fw = F0.w, fh = F0.h,   /* (a clip may have a frame and an anchor of its own: the death, which no other clip's frame holds) */
        s = (opts.scale || 1) * (M.scale || 1) / PX, layers = opts.layers || ['body'];
    var im = H.img[A.sheets.body]; if (!im || !im.complete || !im.naturalWidth) return;
    c.save(); c.translate(x, y); if (dashing) c.scale(1.1, 0.92);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    var lit = opts.lit || null, mixW = pk.w > 0.03 && pk.w < 0.97 && opts.blend !== false && blends(pk.a, A);
    if (pk.w >= 0.97) pk = { a: pk.a, f: pk.f2 };                                                   // all but the next frame already
    if (opts.shadow !== false && !P.dead) cast(c, H, im, A.sheets.body, opts.shadowHue, pk.f * fw, d * fh, fw, fh, -AN.x * s, -AN.y * s, fw * s, fh * s, lit && lit.cast);
    litUnder(c, H, im, A.sheets.body, lit, pk.f * fw, d * fh, fw, fh, -AN.x * s, -AN.y * s, fw * s, fh * s);
    for (var i = 0; i < layers.length; i++) {                     // a layer is a name, or { layer, tint } for a recoloured one
      var L = layers[i], ln = typeof L === 'string' ? L : L.layer, file = A.sheets[ln]; if (!file) continue;
      var li = H.img[file]; if (!li || !li.complete || !li.naturalWidth) continue;
      var mulL = typeof L !== 'string' && L.tint && L.mul, src = typeof L === 'string' || !L.tint || mulL ? li : tinted(H, li, file, L.tint);
      var LB = A.boxes && A.boxes[ln], lw = LB ? LB[2] : fw, lh = LB ? LB[3] : fh, dx = (-AN.x + (LB ? LB[0] : 0)) * s, dy = (-AN.y + (LB ? LB[1] : 0)) * s;   /* (a layer may be packed in a box of its own, cut to its pixels: its corner in the frame, its size) */
      if (mulL) { var mx = mixW ? mixTo(H, li, lw, lh, d, pk.f, pk.f2, pk.w) : null, mc = mulTo(H, mx || li, mx ? 0 : pk.f * lw, mx ? 0 : d * lh, lw, lh, L.tint); c.drawImage(mc || mx || li, mc || mx ? 0 : pk.f * lw, mc || mx ? 0 : d * lh, lw, lh, dx, dy, lw * s, lh * s); }   /* (a colour multiplied in, a frame at a time: the shield's face) */
      else if (mixW) c.drawImage(mixTo(H, src, lw, lh, d, pk.f, pk.f2, pk.w), 0, 0, lw, lh, dx, dy, lw * s, lh * s);
      else c.drawImage(src, pk.f * lw, d * lh, lw, lh, dx, dy, lw * s, lh * s);
    }
    litOver(c, H, im, A.sheets.body, lit, pk.f * fw, d * fh, fw, fh, -AN.x * s, -AN.y * s, fw * s, fh * s);
    c.restore();
  }
  // once a frame: the one-shot clips the engine's state does not carry (the bow's shot) and the moment of death
  function tick(H, P) {
    if (!H) return;
    if (P.fireT > H.fireT) play(H, 'bow_shoot'); H.fireT = P.fireT;
    if (P.dead && !H.deadT) H.deadT = now(); if (!P.dead) H.deadT = 0;
    var tb = now(), db = Math.min(0.1, Math.max(0, tb - (H.blkAt || tb))); H.blkAt = tb;          // the guard: up in an eighth of a second, down a little slower (pick plays the block clip by it)
    H.blk = Math.max(0, Math.min(1, (H.blk || 0) + (P.guard && !P.dead ? db / 0.12 : -db / 0.16)));
  }
  // the engine's hero: Combat.api.heroSprite draws from the sheet; opts may give scale(), tool(), shadow(), shadowHue, layers()
  function attach(Combat, H, opts) {
    opts = opts || {};
    if (!H) { Combat.api.heroSprite = null; return null; }
    Combat.api.heroSprite = function (c, x, y, face, an, dashing) {
      var P = Combat.dbg().P; tick(H, P);
      draw(c, H, x, y, face, an, dashing, P, { scale: opts.scale ? opts.scale() : 1, shadow: opts.shadow ? opts.shadow() : true, shadowHue: opts.shadowHue, lit: opts.lit ? opts.lit(P) : null, layers: opts.layers ? opts.layers(face) : null, stepData: Combat.api.stepData, tool: opts.tool });
    };
    return H;
  }
  /* The beasts (2026-10-11, the animals as Blender models: boar, deer, wolf). One sheet set per kind, shared by every animal of it;
     what one animal is doing is kept on the enemy itself (e._bs). The clip comes from the engine's state: death by the time since
     it fell, the windup and the lunge (looped for a charge, or spread over the state's length for a leap), the hit while the flash
     is fresh, and otherwise idle, walk or run by how fast it is really moving. The heading eases round as the drawn creatures' did.
     opts: scale, shadow, shadowHue, windupLoop, attackLoop; clip and clipK (a clip the page asks for and how far through it: the
     troll shielding its eyes), tint { color, a } (laid over the frame: the troll turned to stone), deadFor (how long it lies). Returns false while the sheets are still loading (the page then draws
     the old creature). A sheet's marked points (a wolf's eyes) are left on e.eyes, about (e.x, e.y * K), for the night glow. */
  function ready(H) { var A = H && H.meta.anims.idle, im = A && H.img[A.sheets.body]; return !!(im && im.complete && im.naturalWidth); }
  function beast(c, H, e, K, opts) {
    if (!ready(H)) return false; opts = opts || {};
    var M = H.meta, A = M.anims, t = now(), st = e._bs || (e._bs = { x: e.x, y: e.y, t: t, spd: 0, face: null }), dt = t - st.t;
    if (dt > 0.004) { var sp = Math.hypot(e.x - st.x, e.y - st.y) / dt; st.spd += (sp - st.spd) * Math.min(1, dt * 8); st.x = e.x; st.y = e.y; st.t = t; }
    var a = e.face || 0; if (st.face == null) st.face = a; var dA = Math.atan2(Math.sin(a - st.face), Math.cos(a - st.face)); st.face += Math.max(-0.22, Math.min(0.22, dA));
    var nm, f, k = e.dur ? Math.max(0, Math.min(0.999, e.t / e.dur)) : 0, ph = t + (e.seed || 0), loopN = null, mixB = null;
    var lie = opts.deadFor || 1.5;
    if (e.dead && !A.death && opts.deathClip && A[opts.deathClip]) { e.deadFor = lie; nm = opts.deathClip; f = Math.min(A[nm].frames - 1, Math.floor(e.deadT / (lie * 0.6) * A[nm].frames)); }   // a creature with no death of its own (the bysen folds into his stump)
    else if (e.dead && A.death) { e.deadFor = lie; nm = 'death'; f = opts.deadFor ? Math.min(A.death.frames - 1, Math.floor(e.deadT / (lie * 0.6) * A.death.frames)) : Math.min(A.death.frames - 1, Math.floor(e.deadT * A.death.fps)); }
    else if (opts.clip && A[opts.clip]) { nm = opts.clip; f = opts.clipK != null ? frameAt(A[nm], Math.max(0, Math.min(0.999, opts.clipK))) : loopFrame(A[nm], ph); }
    else if (e.state === 'windup' && A.windup) { nm = 'windup'; f = opts.windupLoop ? loopFrame(A.windup, ph) : frameAt(A.windup, k); }
    else if (e.state === 'lunge' && A.attack) { nm = 'attack'; f = opts.attackLoop ? loopFrame(A.attack, ph) : frameAt(A.attack, k); }
    else if ((e.state === 'stunned' || e.flash > 0.3) && A.hit) { nm = 'hit'; f = e.state === 'stunned' ? loopFrame(A.hit, ph * 0.5) : frameAt(A.hit, 1 - e.flash); }
    else {                                                           // the gait by the real speed, with a little hold so it does not flicker at the edge
      st.run = st.run ? st.spd > 28 : st.spd > 40; st.walk = st.walk ? st.spd > 3 : st.spd > 7;
      nm = st.run && A.run ? 'run' : st.walk && A.walk ? 'walk' : 'idle'; f = loopFrame(A[nm], ph); loopN = nm;
    }
    if (opts.clip && A[opts.clip] && opts.clipK == null) loopN = nm;
    if (loopN && opts.blend !== false && blends(nm, A[nm])) { var lp = loopAt(A[nm], ph); f = lp.f; if (lp.w >= 0.97) f = lp.f2; else if (lp.w > 0.03) mixB = lp; }   // a slow loop: between two frames
    var An = A[nm], d = dirOf(M, st.face), F0 = An.frame || M.frame, AN = An.anchor || M.anchor, fw = F0.w, fh = F0.h, s = (opts.scale || 1) * (M.scale || 1) / PX, file = An.sheets.body, im = H.img[file];
    if (!im || !im.complete || !im.naturalWidth) return false;
    c.save(); c.translate(e.x, e.y * K); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    if (e.dead) c.globalAlpha = Math.max(0, Math.min(1, (lie - e.deadT) / 0.4));
    if (opts.shadow !== false && !e.dead) cast(c, H, im, file, opts.shadowHue, f * fw, d * fh, fw, fh, -AN.x * s, -AN.y * s, fw * s, fh * s, opts.lit && opts.lit.cast);
    litUnder(c, H, im, file, opts.lit, f * fw, d * fh, fw, fh, -AN.x * s, -AN.y * s, fw * s, fh * s);
    if (mixB) c.drawImage(mixTo(H, im, fw, fh, d, mixB.f, mixB.f2, mixB.w), 0, 0, fw, fh, -AN.x * s, -AN.y * s, fw * s, fh * s);
    else c.drawImage(im, f * fw, d * fh, fw, fh, -AN.x * s, -AN.y * s, fw * s, fh * s);
    litOver(c, H, im, file, opts.lit, f * fw, d * fh, fw, fh, -AN.x * s, -AN.y * s, fw * s, fh * s);
    if (opts.tint) { var ga = c.globalAlpha; c.globalAlpha = ga * opts.tint.a; c.drawImage(tinted(H, im, file, opts.tint.color), f * fw, d * fh, fw, fh, -AN.x * s, -AN.y * s, fw * s, fh * s); c.globalAlpha = ga; }
    if (e.flash > 0.02 && !e.dead) { c.globalAlpha = Math.min(1, e.flash) * 0.75; c.drawImage(tinted(H, im, file, '#ffffff'), f * fw, d * fh, fw, fh, -AN.x * s, -AN.y * s, fw * s, fh * s); }
    c.restore();
    if (An.hands) { var rows = An.hands[M.dirs[d]], row = rows && rows[f]; if (row && row.length) e.eyes = row.map(function (h) { return [(h[0] - AN.x) * s, (h[1] - AN.y) * s]; }); }
    return true;
  }
  function drawDead(c, H, x, y, face, an, P, opts) { if (H) { tick(H, P); draw(c, H, x, y, face, an, false, P, opts || {}); } }
  /* The people (2026-10-12, docs/battle-plan.md rung 0; Robin: Blender the hirdmen and other humans; one body, with layers).
     Everybody is the one sheet set (assets/sprites/people, packed by tools/people.js: a sheet is an atlas, every frame of
     every layer trimmed to its own pixels; rectsOf lays the pieces out again by the packer's own shelf rule): a body, a tunic and trousers in near white that are coloured here, and hair, beards, a hood, a cap, a helmet,
     mail, a cloak, a dress, a shield and the things for the hand as layers. A LOOK is a short list of layers and colours
     (lookOf turns the figure specs the game already rolls into one), so thirty different people cost thirty short lists and
     the same sheets. A person's frame is put together once (the layers in the order they lie for that direction, the
     colours multiplied in) and kept in a small store of finished frames, so a crowd standing about is one picture a head
     a frame; the oldest are forgotten. The sheets are fetched when a look first asks for them (loadLazy).
       person(c, H, look, st, x, y, opts): st = { clip, face, and k (0..1 through the clip) or t (a clock for a loop) };
         opts: scale, sx, sy, alpha, shadow, shadowHue, lit, flash, tint, blend. False while the sheets it needs are
         still loading (the page draws the old figure meanwhile). */
  function loadLazy(SP, name) { var set = SP && SP[name]; if (!set) return null; return { name: name, meta: set.meta, img: {}, src: set.images, sil: {}, lazy: true, ubox: {}, rc: {} }; }
  function b64(s) { var i, a; if (typeof atob === 'function') { var bin = atob(s); a = new Uint8Array(bin.length); for (i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; } return new Uint8Array(Buffer.from(s, 'base64')); }
  // where every frame's piece lies: six numbers a frame (its place in the sheet, its size, its place in the frame), a row of directions after another
  function rectsOf(H, A, clip, layer) {
    var key = clip + '|' + layer, R = H.rc[key]; if (R) return R;
    var s = A.rects && A.rects[layer]; if (!s) return null;
    var u = b64(s), n = u.length >> 2, out = new Int16Array(n * 6), x = 0, y = 0, sh = 0, MAXW = H.meta.shelf || 1024, i, w, h;
    for (i = 0; i < n; i++) { w = u[i * 4]; h = u[i * 4 + 1]; if (w && x + w > MAXW && x > 0) { x = 0; y += sh; sh = 0; } out[i * 6] = x; out[i * 6 + 1] = y; out[i * 6 + 2] = w; out[i * 6 + 3] = h; out[i * 6 + 4] = u[i * 4 + 2]; out[i * 6 + 5] = u[i * 4 + 3]; if (w) { x += w; if (h > sh) sh = h; } }
    return (H.rc[key] = out);
  }
  function imgOf(H, file) { var im = H.img[file]; if (!im && H.src && H.src[file] && typeof Image !== 'undefined') { im = new Image(); im.src = H.src[file]; H.img[file] = im; } return im && im.complete && im.naturalWidth ? im : null; }
  var HAIRS = { 0: 'hairA', 1: 'hairA', 2: 'hairB', 3: 'hairB', 4: 'hairC', 5: null, 6: 'hairC', 7: 'hairB', 8: 'hairB' }, BEARDS = { 0: null, 1: 'beardA', 2: 'beardA', 3: 'beardB', 4: null }, HATS = { 0: null, 1: 'hood', 2: 'cap', 3: 'helm', 4: 'cap', 5: null };
  function idOf(look) { look.id = look.L.map(function (q) { return q.l + (q.t || ''); }).join(','); return look; }
  // spec: a figure spec (hair, beard, hat, clothes, scale, bodyW, legL and col, as lib.folkSpec and Hird.figureSpec give them);
  // x: { mail, helm, shield (its paint), cloak (a colour: everybody of one band wears it), hand: { kind, tint } }
  function lookOf(spec, x) {
    x = x || {}; spec = spec || {}; var col = spec.col || {}, L = [{ l: 'body' }, { l: 'legs', t: col.pants || '#4a4038' }, { l: 'tunic', t: col.coat || '#6b7d8a' }];
    var hat = x.helm ? 'helm' : HATS[spec.hat || 0], hair = HAIRS[spec.hair == null ? 0 : spec.hair], beard = BEARDS[spec.beard || 0];
    if (hat === 'hood') hair = null;                                 // a hood is over everything
    if (spec.clothes === 3 && !x.mail && !beard) L.push({ l: 'dress', t: col.dress || '#8a4a4a' });   // the apron dress (the looks are rolled apart: never on a bearded man)
    if (x.mail) L.push({ l: 'mail' });
    if (x.cloak || spec.clothes === 2) L.push({ l: 'cloak', t: x.cloak || col.cloak || '#7a3b3b' });
    if (beard) L.push({ l: beard, t: col.hair || '#5a3a28' });
    if (hair) L.push({ l: hair, t: col.hair || '#5a3a28' });
    if (hat) L.push(hat === 'hood' ? { l: 'hood', t: x.cloak || col.cloak || '#6b4a2e' } : { l: hat });
    if (x.shield) { L.push({ l: 'shieldRim' }); L.push({ l: 'shieldFace', t: x.shield }); }
    var dwarf = spec.legL != null && spec.legL < 0.8;              // Brokk: the same man made short and broad (a body of his own is for later)
    var look = { L: L, s: Math.max(0.62, Math.min(1.12, (spec.scale || 0.8) / 0.8)) * (dwarf ? 0.8 : 1), sx: dwarf ? 1.24 : Math.max(0.9, Math.min(1.2, spec.bodyW || 1)), sy: 1 };
    idOf(look); return x.hand ? withHand(look, x.hand) : look;
  }
  function withHand(look, hand) {            // the same person with another thing in the hand (or none); kept, so asking every frame costs nothing
    var key = hand && hand.kind ? hand.kind + (hand.tint || '') : '', hit = look._h && look._h[key]; if (hit) return hit;
    var L = look.L.filter(function (q) { return !q.hand; });
    if (hand && hand.kind) { L.push({ l: hand.kind + 'Wood', hand: 1 }); L.push({ l: hand.kind + 'Metal', t: hand.tint || null, metal: 1, hand: 1 }); }
    var o = idOf({ L: L, s: look.s, sx: look.sx, sy: look.sy }); (look._h || (look._h = {}))[key] = o; o._h = look._h; return o;
  }
  var RANK = { body: 0, legs: 1, tunic: 2, dress: 3, mail: 4, cloak: 5, beardA: 6, beardB: 6, hairA: 7, hairB: 7, hairC: 7, hood: 8, cap: 8, helm: 8, shieldRim: 9, shieldFace: 9.1 };
  // Where a layer lies in the pile. The body hides what is behind it already (every layer was rendered with the body held
  // out); this is only about a layer against another: an arm on the far side carries its shield or weapon under the
  // cloak and the mail, an arm on the near side over them. dirs: s sw w nw n ne e se.
  function rankOf(q, d) {
    var r = RANK[q.l];
    if (q.hand) { var left = q.l.charAt(0) === 'b' && q.l.charAt(1) === 'o'; return (left ? d <= 3 : d === 0 || d >= 5) ? 11 : 4.5; }      // the bow is in the left hand
    if (r == null) return 11;
    if (r >= 9) return d <= 3 ? r : 4.3 + (r - 9);
    return r;
  }
  var PC = { map: new Map(), max: 700, pool: {}, made: 0 };
  function cvOf(w, h) { var k = w + 'x' + h, a = PC.pool[k], cv2 = a && a.length ? a.pop() : null; if (!cv2) { cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h; } else cv2.getContext('2d').clearRect(0, 0, w, h); return cv2; }
  function scratch(name, w, h) { var cv2 = PC[name]; if (!cv2) { cv2 = PC[name] = document.createElement('canvas'); cv2.width = 8; cv2.height = 8; } if (cv2.width < w || cv2.height < h) { cv2.width = Math.max(cv2.width, w); cv2.height = Math.max(cv2.height, h); } return cv2; }
  function personFrame(H, look, clip, d, f) {
    var key = look.id + '|' + clip + '|' + d + '|' + f, e = PC.map.get(key);
    if (e) { PC.map.delete(key); PC.map.set(key, e); return e; }
    var A = H.meta.anims[clip]; if (!A || !A.rects) return null;
    var uk = look.id + '|' + clip + '|' + d, U = H.ubox[uk], i, j, q, R, im, n = A.frames, o;
    if (!U) {                                                        // the box this look needs for this clip seen from this side: every layer's pieces over every frame
      var x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (i = 0; i < look.L.length; i++) { R = rectsOf(H, A, clip, look.L[i].l); if (!R) continue; for (j = 0; j < n; j++) { o = (d * n + j) * 6; if (!R[o + 2]) continue; x0 = Math.min(x0, R[o + 4]); y0 = Math.min(y0, R[o + 5]); x1 = Math.max(x1, R[o + 4] + R[o + 2]); y1 = Math.max(y1, R[o + 5] + R[o + 3]); } }
      if (x1 < 0) return null; U = H.ubox[uk] = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    var ord = [], ok = true;
    for (i = 0; i < look.L.length; i++) { q = look.L[i]; if (!A.sheets[q.l]) continue; if (!imgOf(H, A.sheets[q.l])) ok = false; ord.push({ z: q, r: rankOf(q, d) + i * 0.001 }); }
    if (!ok) return null;                                            // still loading (every sheet has been asked for now): nothing is kept
    ord.sort(function (m, k) { return m.r - k.r; });
    var cv2 = cvOf(U.w, U.h), g = cv2.getContext('2d');
    for (i = 0; i < ord.length; i++) {
      q = ord[i].z; R = rectsOf(H, A, clip, q.l); o = (d * n + f) * 6; var w = R[o + 2], h = R[o + 3]; if (!w) continue;
      im = H.img[A.sheets[q.l]]; var sx = R[o], sy = R[o + 1], dx = R[o + 4] - U.x, dy = R[o + 5] - U.y;
      if (!q.t) { g.drawImage(im, sx, sy, w, h, dx, dy, w, h); continue; }
      var sc = scratch('scratch', w, h), tg = sc.getContext('2d');                                             // the colour: multiplied into cloth, hair and paint; laid over metal as on the things the hero holds
      tg.globalCompositeOperation = 'source-over'; tg.globalAlpha = 1; tg.clearRect(0, 0, w, h); tg.drawImage(im, sx, sy, w, h, 0, 0, w, h);
      if (q.metal) { tg.globalCompositeOperation = 'source-atop'; tg.globalAlpha = 0.6; tg.fillStyle = q.t; tg.fillRect(0, 0, w, h); tg.globalCompositeOperation = 'multiply'; tg.globalAlpha = 0.35; tg.drawImage(im, sx, sy, w, h, 0, 0, w, h); }
      else { tg.globalCompositeOperation = 'multiply'; tg.fillStyle = q.t; tg.fillRect(0, 0, w, h); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(im, sx, sy, w, h, 0, 0, w, h); }
      tg.globalCompositeOperation = 'source-over'; tg.globalAlpha = 1;
      g.drawImage(sc, 0, 0, w, h, dx, dy, w, h);
    }
    e = { cv: cv2, x: U.x, y: U.y, w: U.w, h: U.h, sil: null }; PC.map.set(key, e); PC.made++;
    if (PC.map.size > PC.max) { var old = PC.map.keys().next().value, oe = PC.map.get(old); PC.map.delete(old); var pk = oe.w + 'x' + oe.h; (PC.pool[pk] || (PC.pool[pk] = [])).push(oe.cv); }
    return e;
  }
  function silP(e, hue) {                    // the frame's shape, dark, at half size: for the shadow it throws
    if (e.sil) return e.sil; var w = Math.ceil(e.w / 2), h = Math.ceil(e.h / 2), cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h; var g = cv2.getContext('2d');
    g.drawImage(e.cv, 0, 0, e.w, e.h, 0, 0, w, h); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'hsl(' + (hue || 222) + ',40%,8%)'; g.fillRect(0, 0, w, h); e.sil = cv2; return cv2;
  }
  function silCol(e, col) {                  // the same shape in a colour (the side a fire lights or does not, a flash, a tint): made when asked for, in one shared sheet
    var s0 = silP(e), sc = scratch('mix2', s0.width, s0.height), g = sc.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, sc.width, sc.height); g.drawImage(s0, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, s0.width, s0.height); g.globalCompositeOperation = 'source-over'; return sc;
  }
  function person(c, H, look, st, x, y, opts) {
    opts = opts || {}; var M = H.meta, clip = M.anims[st.clip] ? st.clip : 'idle', A = M.anims[clip]; if (!A) return false;
    var d = dirOf(M, st.face || 0), f, f2 = -1, w = 0;
    if (st.k != null) f = frameAt(A, Math.max(0, Math.min(0.999, st.k)));
    else { var lp = loopAt(A, st.t || 0); f = lp.f; if (opts.blend !== false && blends(clip, A)) { if (lp.w >= 0.97) f = lp.f2; else if (lp.w > 0.03) { f2 = lp.f2; w = lp.w; } } }
    var e = personFrame(H, look, clip, d, f);
    if (!e && clip !== 'idle' && M.anims.idle) { clip = 'idle'; A = M.anims.idle; f = loopAt(A, st.t || 0).f; f2 = -1; e = personFrame(H, look, clip, d, f); }   // the sheets of this clip are still on their way: he stands as he stood
    if (!e) return false;
    var AN = A.anchor || M.anchor, s = (opts.scale || 1) * (look.s || 1) / PX, dx = (e.x - AN.x) * s, dy = (e.y - AN.y) * s, dw = e.w * s, dh = e.h * s, lit = opts.lit || null, src = e.cv, hw, hh;
    if (f2 >= 0) { var e2 = personFrame(H, look, clip, d, f2); if (e2) { var mx = scratch('mix', e.w, e.h), mg = mx.getContext('2d'); mg.globalCompositeOperation = 'source-over'; mg.globalAlpha = 1; mg.clearRect(0, 0, mx.width, mx.height); mg.globalAlpha = 1 - w; mg.drawImage(e.cv, 0, 0); mg.globalCompositeOperation = 'lighter'; mg.globalAlpha = w; mg.drawImage(e2.cv, 0, 0); mg.globalCompositeOperation = 'source-over'; mg.globalAlpha = 1; src = mx; } }
    c.save(); c.translate(x, y); c.scale((look.sx || 1) * (opts.sx || 1), (look.sy || 1) * (opts.sy || 1)); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    if (opts.alpha != null) c.globalAlpha *= opts.alpha;
    var ga = c.globalAlpha;
    if (opts.shadow !== false) {              // the shadow: laid as the props' long shadows lie, or thrown away from a fire
      var sl = silP(e, opts.shadowHue); c.save();
      if (lit && lit.cast) { c.globalAlpha = ga * lit.cast.a; c.transform(1, 0, -lit.cast.kx, -lit.cast.ky, 0, 0); }
      else { c.globalAlpha = ga * 0.3; c.beginPath(); c.rect(-200, -400, 400, 400); c.clip(); c.transform(1, 0, -0.5, -0.14, 0, 0); }
      c.drawImage(sl, 0, 0, sl.width, sl.height, dx, dy, dw, dh); c.restore();
    }
    if (opts.lying > 0) { var sl2 = silP(e, opts.shadowHue); c.globalAlpha = ga * 0.24 * opts.lying; c.drawImage(sl2, 0, 0, sl2.width, sl2.height, dx + 1.4, dy + 1.8, dw, dh); c.globalAlpha = ga; }   /* (a man on the ground: the shadow he lies on, a little down and right of him, where the sun puts it) */
    hw = Math.ceil(e.w / 2); hh = Math.ceil(e.h / 2);
    if (lit && lit.rim) { c.globalAlpha = ga * lit.rim.a; c.drawImage(silCol(e, '#ffb45e'), 0, 0, hw, hh, dx + lit.rim.ox, dy + lit.rim.oy, dw, dh); c.globalAlpha = ga; }
    c.drawImage(src, 0, 0, e.w, e.h, dx, dy, dw, dh);
    if (lit && lit.dark) { c.globalAlpha = ga * lit.dark; c.drawImage(silCol(e, '#060a1c'), 0, 0, hw, hh, dx, dy, dw, dh); c.globalAlpha = ga; }
    else if (lit && lit.warm) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = ga * lit.warm; c.drawImage(silCol(e, '#ff8a2a'), 0, 0, hw, hh, dx, dy, dw, dh); c.globalCompositeOperation = 'source-over'; c.globalAlpha = ga; }
    if (opts.tint) { c.globalAlpha = ga * opts.tint.a; c.drawImage(silCol(e, opts.tint.color), 0, 0, hw, hh, dx, dy, dw, dh); c.globalAlpha = ga; }
    if (opts.flash > 0.02) { c.globalAlpha = ga * Math.min(1, opts.flash) * 0.7; c.drawImage(silCol(e, '#ffffff'), 0, 0, hw, hh, dx, dy, dw, dh); c.globalAlpha = ga; }
    c.restore(); return true;
  }
  /* A fighting man from the people's sheets: the engine's human enemies and the hero's own men (docs/battle-plan.md).
     The clip follows the engine's state as a beast's does: the death by the time since he fell (he lies as long as
     e.deadFor says), getting up again (e.riseT), on his knees (state 'yield'), the blow spread over its windup, strike
     and recovery (e.sw = { wu, ac, rec, clip }, set by the engine when a soldier begins a blow; a plain guard's lunge
     without it), the shield up (e.guard), a flinch, and otherwise idle, walk or run by how fast he is really moving.
     The thing in his hand is e.wpn = { kind, tint }. */
  var BEATS = { attack1: [0.39, 0.6], attack2: [0.3, 0.55], chop: [0.3, 0.62], mine: [0.39, 0.55] };   // where in each clip the weapon is drawn back, and where the blow is over (tools/visual/people.js blows)
  var FIGHT = ['idle', 'walk', 'run', 'attack1', 'attack2', 'chop', 'mine', 'hit', 'block'];
  function fighter(c, H, e, K, look, opts) {
    if (!peopleReady(H)) return false; opts = opts || {};
    var A = H.meta.anims, t = now(), st = e._bs || (e._bs = { x: e.x, y: e.y, t: t, spd: 0, face: null, ph: Math.random() * 10, wp: 0 }), dt = t - st.t;
    if (dt > 0.004) { var sp = Math.hypot(e.x - st.x, e.y - st.y) / dt; st.spd += (sp - st.spd) * Math.min(1, dt * 8); st.x = e.x; st.y = e.y; st.t = t; } else dt = 0;
    var a = e.face || 0; if (st.face == null) st.face = a; var dA = Math.atan2(Math.sin(a - st.face), Math.cos(a - st.face)); st.face += Math.max(-0.3, Math.min(0.3, dA));
    if (!st.warm) { st.warm = 1; peopleWarm(H, withHand(look, e.wpn || opts.hand || null), e.bow ? ['idle', 'walk', 'run', 'bow_draw', 'bow_shoot', 'hit'] : FIGHT); peopleWarm(H, withHand(look, null), ['death', 'pickup']); }   // everything a fight will ask of him, asked for now
    var s = { face: st.face, clip: 'idle', t: t + st.ph }, hand = opts.sheathed ? null : (e.wpn || opts.hand || null), sw = e.sw,   /* (sheathed: his weapon is away: a man of yours walking into a place at peace) */
       k = e.dur ? Math.max(0, Math.min(0.999, e.t / e.dur)) : 0, alpha = 1, flash = e.flash || 0;
    if (e.dead || e.down) { var lie = e.deadFor || 1.5; s.clip = 'death'; s.k = Math.min(0.999, (e.deadT || 0) / 0.9); hand = null; if (e.dead) alpha = Math.max(0, Math.min(1, (lie - e.deadT) / 1.2)); flash = 0; }
    else if (e.asleep) { s.clip = 'death'; s.k = 0.999; hand = null; flash = 0; }                    // asleep: he lies as the fallen lie
    else if (e.riseT > 0) { s.clip = 'death'; s.k = Math.max(0, Math.min(0.999, e.riseT / 0.8)); hand = null; }
    else if (e.state === 'yield') { s.clip = 'pickup'; s.k = Math.min(0.42, e.t / 0.6 * 0.42); hand = null; }
    else if (e.state === 'aim') { s.clip = 'bow_draw'; s.k = Math.min(0.999, e.t / Math.max(0.01, e.dur)); }
    else if (e.state === 'loose') { s.clip = 'bow_shoot'; s.k = k; }
    else if (sw && (e.state === 'windup' || e.state === 'lunge' || (e.state === 'recover' && e.swung))) {      // the clip's own beats: the blow lands a little before its middle
      var B = BEATS[sw.clip] || BEATS.attack1, u = Math.min(1, e.t / (e.state === 'windup' ? sw.wu : e.state === 'lunge' ? sw.ac : sw.rec));
      s.clip = sw.clip; s.k = e.state === 'windup' ? B[0] * (1 - (1 - u) * (1 - u)) : e.state === 'lunge' ? B[0] + (B[1] - B[0]) * u : B[1] + (0.995 - B[1]) * u;   // the windup goes quickly to the drawn-back pose and holds it: that is what is read
    }
    else if (!sw && e.state === 'windup') { s.clip = 'attack1'; s.k = 0.39 * (1 - (1 - k) * (1 - k)); }
    else if (!sw && e.state === 'lunge') { s.clip = 'attack1'; s.k = 0.39 + 0.3 * k; }
    else if (e.guard > 0) { s.clip = 'block'; s.k = Math.min(0.999, (e.guardAge || 0) / 0.16); }
    else if (e.state === 'stunned') { s.clip = 'hit'; s.k = 0.42 + 0.14 * Math.sin((e.t || 0) * 6.5); }   // parried: reeling, a sway in the recoil (2026-10-15)
    else if (e.state === 'stagger' || flash > 0.35) { s.clip = 'hit'; s.k = e.state === 'stagger' ? 0.15 + 0.6 * k : Math.min(0.999, (1 - flash) * 0.8); }
    else {
      st.run = st.run ? st.spd > 50 : st.spd > 62; st.walk = st.walk ? st.spd > 3 : st.spd > 7;
      if (st.run) { st.wp += dt * Math.max(0.8, Math.min(1.4, st.spd / 100)); s.clip = 'run'; s.t = st.wp; }
      else if (st.walk) { st.wp += dt * Math.max(0.7, Math.min(1.9, st.spd / 36)); s.clip = 'walk'; s.t = st.wp; }
    }
    if (!A[s.clip]) s.clip = 'idle';
    return person(c, H, withHand(look, hand), s, e.x, e.y * K, { scale: opts.scale, shadow: opts.shadow !== false && !(e.dead || e.down || e.asleep), lying: opts.shadow !== false && (e.dead || e.down || e.asleep) ? s.k : 0, shadowHue: opts.shadowHue, lit: opts.lit, flash: flash, alpha: alpha, tint: opts.tint });
  }
  function peopleReady(H) { if (!H) return false; var A = H.meta.anims.idle; return !!(A && imgOf(H, A.sheets.body)); }
  function peopleStats() { return { kept: PC.map.size, made: PC.made }; }
  function peopleWarm(H, look, clips) { var A = H.meta.anims, n = 0; (clips || Object.keys(A)).forEach(function (cl) { if (!A[cl]) return; look.L.forEach(function (q) { var f = A[cl].sheets[q.l]; if (f) { imgOf(H, f); n++; } }); }); return n; }   // ask for a look's sheets ahead of the moment they are needed
  return { loadLazy: loadLazy, lookOf: lookOf, withHand: withHand, person: person, fighter: fighter, personFrame: personFrame, peopleReady: peopleReady, peopleStats: peopleStats, peopleWarm: peopleWarm, loopAt: loopAt, mixTo: mixTo, blends: blends, PX: PX, load: load, hero: hero, heroName: heroName, scaleOf: scaleOf, dirOf: dirOf, play: play, pick: pick, draw: draw, tick: tick, attach: attach, drawDead: drawDead, cast: cast, hand: hand, tinted: tinted, tintedMul: tintedMul, shieldInto: shieldInto, SHIELD_WOOD: SHIELD_WOOD, SHIELD_MARK: SHIELD_MARK, beast: beast, ready: ready };
});
