  /* ---------- cut-scenes (Colin, AD, 2026-10-29; Robin: "a tool for creating cut-scenes so we can have events", the blot the first
     trial): src/cutscene.js plays a scene from its data (scenes/*.json, built in as CS_SCENES); this is its env, the one door between a
     scene and the page, and the Cut-scene Editor's start (game.html?scene=cutscene). csPlay(id, onEnd) starts a scene in the game.
     The scene's figures: 'hero'; Arnor ('arnor', or a cast role 'person.arnor'); Old Aslak ('aslak'); anything else a person made for
     the scene, dressed by its cast entry ({ role, name, look }) as the Dialogue scene dresses its speakers, drawn among the world's
     things (csItems) while it plays and let go after. The view, the bars, the fade and the dusk are the scene's while it plays
     (Combat.api.scene.begin reads CS.cam; csDraw draws the rest over the world); the input is held (still()) and the HUD hidden. ---------- */
  var CS_SCENES = __SCENES__ || {};
  var CS = { run: null, cam: null, fade: 0, bars: 0, dark: 0, lock: false, hideHud: false, figs: {}, made: [], ticks: [], overlays: [], picking: null, flags: {}, editor: null };
  function csHandle(m, isHero) {           // one figure for the player: x, y, face read live; set, turn, moving, clip, say, show
    var h = {
      get x() { return m.x; }, get y() { return m.y; }, get face() { return m.face; },
      set: function (x, y) { m.x = x; m.y = y; if (isHero) { m.vx = m.vy = 0; } },
      turn: function (r) { m.face = r; if (isHero) m.faceVis = r; },
      moving: function (on, run) { if (isHero) { if (on && sprHero) Sprites.play(sprHero, run ? 'run' : 'walk', null, 0.25); } else { m.moving = !!on; m.fleeing = !!(on && run); if (!on) m.ph = 0; else m.ph = (m.ph || 0) + 1; } },
      clip: function (name, hold) { if (isHero) { if (name && sprHero) Sprites.play(sprHero, name, null, hold ? 999 : null); } else { m.csClip = name || null; m.csT0 = clock; } },
      say: function (text, s) { m.say = text; m.sayT = text ? s : 0; m.sayDur = s; if (text) sayAt(m.x, m.y, isHero ? (heroName || 'You') : (m.name || ''), text, s); else signs = signs.filter(function (q) { return q.name !== (isHero ? (heroName || 'You') : m.name); }); },   /* the speech board over him (a figure made for the scene is not one of the folk, so the board is the game's own sign) */
      show: function (on) { m.csHidden = !on; }
    };
    return h;
  }
  function csFig(who, def) {
    if (CS.figs[who]) return CS.figs[who];
    var P = hero(), m = null, isHero = false;
    if (who === 'hero') { m = P; isHero = true; }
    else if ((who === 'arnor' || (def && def.role === 'person.arnor')) && npc) { m = npc; m.csWas = { route: m.route, job: m.job, seq: m.seq, goal: m.goal, x: m.x, y: m.y }; m.route = m.job = m.seq = m.goal = null; }
    else if ((who === 'aslak' || (def && def.role === 'person.aslak')) && typeof aslak !== 'undefined' && aslak) { m = aslak; m.csWas = { route: m.route, job: m.job, x: m.x, y: m.y }; m.route = m.job = null; }
    else { var sp = (def && def.role) || ('role.' + String(who).replace(/:.*$/, '')); m = dlgActor(sp, P.x, P.y); m.stage = true; m.csMade = true; if (def && def.name) m.name = def.name; m.x = P.x; m.y = P.y; m.csHidden = true; CS.made.push(m); }
    var h = csHandle(m, isHero); h.m = m; CS.figs[who] = h; return h;
  }
  function csItems(items) { CS.made.forEach(function (m) { if (!m.csHidden) items.push({ y: m.y, f: function () { drawPerson(ctx, m); } }); }); }
  function csRelease() {                   // the scene is over: borrowed people back to their work, made ones gone
    for (var k in CS.figs) { var m = CS.figs[k].m; if (m && m.csWas) { m.route = m.csWas.route || null; m.job = m.csWas.job || null; if (m.csWas.seq !== undefined) m.seq = m.csWas.seq; if (m.csWas.goal !== undefined) m.goal = m.csWas.goal; m.csWas = null; } if (m) { m.csClip = null; m.csHidden = false; } }
    CS.made = []; CS.figs = {};
  }
  function csPlace(name) {                 // the scene's named places; the game's own places go here as they come (the village's altar, its hall, the bed)
    var P = hero();
    if (CS.places && CS.places[name]) return CS.places[name];   /* set by the editor's stage, or by the game for a scene (csPlay's places) */
    if (name === 'hero') return { x: P.x, y: P.y };
    if (name === 'arnor' && npc) return { x: npc.x, y: npc.y };
    if (name === 'altar') { var vA = typeof villageAltar === 'function' ? villageAltar() : null; if (vA) return { x: vA.x, y: vA.y }; var al = B.items.filter(function (it) { return it.altar; })[0]; return al ? { x: al.x, y: al.y } : null; }
    return null;
  }
  var CS_FX = {                            // the scene's effects: what is wired here, and what waits for its hook (logged, not thrown)
    dark: function (a, done) { var d0 = CS.dark, d1 = a.to != null ? +a.to : 1, s = a.s || 1.5, t = 0; CS.ticks.push(function (dt) { t += dt; CS.dark = d0 + (d1 - d0) * Math.min(1, t / s); return t >= s; }); done(); },
    flash: function (a, done) { riteSky.flash = 1; done(); },
    thunder: function (a, done) { weatherThunder(); done(); },
    glow: function (a, done) { riteSky.learn = a.on === false ? 0 : 1; done(); }
  };
  var CS_CALLS = {};                       // the game's hooks for a scene's `call` steps: CS_CALLS.firstRunePick = function (args, done) { ... }
  var csEnv = {
    place: csPlace, actor: csFig, release: csRelease,
    camNow: function () { return { x: cam.x, y: (cam.y + 14) / K, z: 1 }; }, camera: function (c) { CS.cam = c; },
    fade: function (k) { CS.fade = k; }, bars: function (k) { CS.bars = k; }, card: function (t, s) { placeCard(t, s); },
    talk: function (h, lines, done) {   /* a line at the player's pace: the talk window for a speaker with a portrait, else the speech board, on E, Space, Enter or a click */
      var m = h && h.m; if (!m) { done(); return; } var i = 0;
      (function next() { if (i >= lines.length) { CS.waitTalk = null; done(); return; } var ln = lines[i++]; m.say = ln; m.sayT = 999; m.sayDur = 999; talkOpen(m, function () {});
        if (talkWin) { CS.waitTalk = function () { if (!talkWin) { CS.waitTalk = null; m.sayT = 0.3; next(); } }; return; }
        sayAt(m.x, m.y, m.name || '', ln, 999); var t0 = clock, go = false, on = function (e) { if (e.type === 'mousedown' || /^(e|E| |Enter)$/.test(e.key)) go = true; };
        window.addEventListener('keydown', on, true); window.addEventListener('mousedown', on, true);
        CS.waitTalk = function () { if (go && clock - t0 > 0.35) { window.removeEventListener('keydown', on, true); window.removeEventListener('mousedown', on, true); signs = signs.filter(function (q) { return q.say !== ln; }); m.sayT = 0; CS.waitTalk = null; next(); } };
      })();
    },
    lore: function (id) { return loreLines(id, null); },
    fx: function (name, args, done) { var f = CS_FX[name]; if (f) f(args, done); else { console.warn('cut-scene: fx "' + name + '" has no hook yet'); done(); } },
    music: function (name) { CS.music = name; }, sound: function (name) { if (typeof sfx === 'function') sfx(name); },
    flag: function (k, v) { CS.flags[k] = v; seen['cs.' + k] = v ? 1 : 0; },
    call: function (fn, args, done) { var f = CS_CALLS[fn]; if (f) f(args, done); else { console.warn('cut-scene: no hook "' + fn + '"'); done(); } },
    input: function (on) { CS.lock = !on; }, hud: function (on) { CS.hideHud = !on; try { Combat.api.scene.noHud = !on; Combat.api.scene.noHotbar = !on; } catch (e) {} }
  };
  function csPlay(id, onEnd, places) { if (places) CS.places = places; var sc = typeof id === 'string' ? CS_SCENES[id] : id; if (!sc) { console.warn('cut-scene: no scene ' + id); return null; } CS.run = CutScene.start(sc, csEnv, { onEnd: function (why) { CS.run = null; if (onEnd) onEnd(why); } }); return CS.run; }
  function csTick(dt) { if (CS.waitTalk) CS.waitTalk(); var L = CS.ticks; CS.ticks = []; var keep = L.filter(function (f) { return !f(dt); }); CS.ticks = keep.concat(CS.ticks); if (CS.run) CS.run.tick(dt); }   /* (ticks added while ticking are kept: the first trial lost the dusk so) */
  function csDraw(c) {                     // over the world, under the HUD: the dusk, the bars, the fade; in the editor, the scene's places
    if (CS.dark > 0.01) { c.fillStyle = 'rgba(14,16,34,' + (0.55 * CS.dark).toFixed(3) + ')'; c.fillRect(0, 0, 400, 250); }
    if (CS.bars > 0.01) { var bh = 15 * CS.bars; c.fillStyle = '#0c0907'; c.fillRect(0, 0, 400, bh); c.fillRect(0, 250 - bh, 400, bh); var g = c.createLinearGradient(0, bh, 0, bh + 6); g.addColorStop(0, 'rgba(12,9,7,0.6)'); g.addColorStop(1, 'rgba(12,9,7,0)'); c.fillStyle = g; c.fillRect(0, bh, 400, 6); g = c.createLinearGradient(0, 250 - bh, 0, 244 - bh); g.addColorStop(0, 'rgba(12,9,7,0.6)'); g.addColorStop(1, 'rgba(12,9,7,0)'); c.fillStyle = g; c.fillRect(0, 244 - bh, 400, 6); }
    if (CS.fade > 0.001) { c.fillStyle = 'rgba(0,0,0,' + Math.min(1, CS.fade).toFixed(3) + ')'; c.fillRect(0, 0, 400, 250); }
    if (CS.overlays.length) { var toS = function (wx, wy) { return { x: 200 + (wx - cam.x) * cam.z, y: 125 + (wy * K - cam.y) * cam.z }; }; CS.overlays.forEach(function (f) { f(c, toS); }); }
  }
  function csPickAt(sx, sy) { if (!CS.picking) return false; var f = CS.picking; CS.picking = null; f({ x: cam.x + (sx - 200) / cam.z, y: (cam.y + (sy - 125) / cam.z) / K }); return true; }
  function csScene() {                     // the Cut-scene Editor's start: a fresh world that saves nothing, by day at the wreck; a stand-in altar if the island has none
    noSave = true; seen.met = 1; seen.build = 1; seen.bar = 1; seen.pried = 1; seen.slept = 1; caveFade = 0; heroName = heroName || 'Ulf'; naming = null; day.t = 300;
    var P = hero(), ax = P.x - 20, ay = P.y - 150, tries = 0; while (tries++ < 30 && !(w.isLand(ax, ay) && !w.isWater(ax, ay))) ay += 12;   /* the stage: a stand-in altar on open ground north of the hero, the scene's 'altar' (in the game, the village's own) */
    var clr = []; w.eachProp(function (o) { if (Math.abs(o.x - ax) < 130 && Math.abs(o.y - ay) < 110 && o.r) clr.push(o); }); clr.forEach(function (o) { w.removeProp(o); });
    B.items.push({ name: 'runeAltar', x: ax, y: ay, r: 28, altar: true, csStage: true }); bDirty = true; CS.places = { altar: { x: ax, y: ay } }; window.__CS = CS;
    setTimeout(function () { CS.editor = CutSceneEditor.open(csEnv, { scenes: CS_SCENES, pick: function (cb) { CS.picking = cb; }, overlay: function (fn) { CS.overlays.push(fn); }, tick: function (fn) { CS.ticks.push(function (dt) { fn(dt); return false; }); } }); }, 400);
  }
