/* Fishing (2026-10-08, Robin: a fishing rod of iron in the lowlands, a fisherman who teaches the dishes, a fun minigame, a few
   fishes, a sunken chest now and then). The game of it, with no drawing: the page casts a float, and from then on this file
   says what the float does and what the player must do.

   The round: cast, then WAIT (the float sits, 3 to 9 seconds), a NIBBLE (small dips for about a second: press now and the fish is
   scared off), the BITE (the float plunges: press within the window to hook it, or it is gone), then the FIGHT: hold to reel the
   fish in (its distance falls), but the line's tension rises as you reel, faster when the fish RUNS; let go and the tension
   falls while the fish takes line back. Tension at 1 snaps the line and the fish is lost; distance at 0 lands it. A sunken chest
   bites now and then in deep water: it never runs, but it is heavy, so it is slow and the line must rest. The fish by water:
   herring everywhere in the sea, perch in the shallows, cod in deep water, pike in the lowland shallows, salmon deep and rare.

   Fishing.FISH is the table; Fishing.roll(R, depth, lowland) picks what bites; Fishing.start(R, depth, lowland) begins a round;
   Fishing.tick(st, dt, inp) advances it (inp: { up, down }, the keys that guide the band in the fight) and returns an event string
   or null ('nibble', 'tap', 'bite', 'missed', 'hooked', 'run', 'landed', 'lost'); Fishing.press(st) is a press of the button (hooks at
   the bite; anything sooner does nothing). tests/fishing.js plays it with bots.

   THE FIGHT since 2026-10-25 (Robin: "too hard to catch"; "more interesting when catching. But it should be quite easy. It should
   feel relaxing ... guide the fish somehow when reeling it in, with W and S"): the fish swims up and down a short track, drifting to
   a new depth now and then and, if it is a runner, darting; W and S move a band along the track, gently, with a little glide; while
   the fish is in the band the catch fills and it comes in, and out of it the catch ebbs slowly; full, it is landed, empty, it gets
   away. No line to snap. The numbers are GUIDE, mine: a herring in about three seconds of keeping up, a salmon in about six. */
var Fishing = (function () {
  'use strict';
  var FISH = {
    herring: { name: 'Herring', kg: [0.1, 0.4], fight: 0.25, runs: 0.3, water: 'sea', weight: 5, line: 'A silver herring. The sea is full of them, and they are good smoked.' },
    perch: { name: 'Perch', kg: [0.2, 1.4], fight: 0.45, runs: 0.6, water: 'shallow', weight: 4, line: 'A perch, striped and spiny. Grills well.' },
    cod: { name: 'Cod', kg: [1, 8], fight: 0.7, runs: 0.5, water: 'deep', weight: 3, line: 'A cod from the deep water, heavy and slow. Dried, it keeps all winter.' },
    pike: { name: 'Pike', kg: [1, 10], fight: 0.9, runs: 1.1, water: 'lowland', weight: 2, line: 'A pike from the reeds: all teeth and sudden runs.' },
    salmon: { name: 'Salmon', kg: [2, 12], fight: 1, runs: 1, water: 'deep', weight: 1, line: 'A salmon, the king of the water. It ran like a horse.' },
    chest: { name: 'Sunken chest', kg: [15, 30], fight: 0.6, runs: 0, water: 'deep', weight: 0, line: 'Something heavy and square: a chest off a wreck, weed hanging from its iron bands.' }
  };
  var ORDER = ['herring', 'perch', 'cod', 'pike', 'salmon'];
  var GUIDE = { zone: 0.34, accel: 5, maxV: 1.2, drag: 4, fill: 0.2, drain: 0.2, start: 0.25, grace: 1.2, margin: 0.02 };   /* the fight's band (a share of the track; an iron-hooked rod's is wider, start's o.zone), its glide, how fast the catch fills and ebbs */
  var CHEST_CHANCE = 0.03;                                 // a sunken chest's share of bites in deep water
  // what bites where: depth is how deep the water is under the float (units of elevation below the waterline, 0.5 shallow, 6 deep);
  // lowland says the island is the second biome's. The weights favour the water each fish lives in.
  function table(depth, lowland, fresh) {
    var deep = Math.max(0, Math.min(1, (depth - 1.5) / 4)), shallow = 1 - deep, t = {};
    if (fresh) return { herring: 0, perch: FISH.perch.weight * 1.6, cod: 0, pike: FISH.pike.weight * (0.6 + deep), salmon: FISH.salmon.weight * 0.6 };   /* a lake (2026-10-24): perch in its shallows, pike lurking deeper, a salmon now and then; no herring or cod */
    t.herring = FISH.herring.weight;
    t.perch = FISH.perch.weight * (0.25 + shallow) * (lowland ? 0.6 : 1);
    t.cod = FISH.cod.weight * (0.1 + deep);
    t.pike = lowland ? FISH.pike.weight * (0.3 + shallow) : 0.15;
    t.salmon = FISH.salmon.weight * (0.1 + deep);
    return t;
  }
  function roll(R, depth, lowland, fresh) {
    var deep = Math.max(0, Math.min(1, (depth - 1.5) / 4));
    if (!fresh && deep > 0.3 && R() < CHEST_CHANCE) return make(R, 'chest');
    var t = table(depth, lowland, fresh), sum = 0, k; for (k in t) sum += t[k];
    var u = R() * sum; for (k in t) { u -= t[k]; if (u <= 0) return make(R, k); }
    return make(R, 'herring');
  }
  function make(R, id) { var f = FISH[id], u = R(), kg = f.kg[0] + (f.kg[1] - f.kg[0]) * u * u; return { id: id, name: f.name, kg: Math.round(kg * 10) / 10, size: u, fight: f.fight * (0.75 + 0.5 * u), runs: f.runs, line: f.line }; }
  function start(R, depth, lowland, o) {   /* o: { fresh: a lake, patience: how fast the line's tension rises (a wooden rod 1.15, an iron one 0.8) } */
    o = o || {}; var fish = roll(R, depth, lowland, o.fresh);
    return { phase: 'wait', t: 0, until: 3 + R() * 6, fish: fish, dist: 0, tension: 0, run: 0, runIn: 0, calm: 0, bob: 0, R: R, depth: depth, lowland: !!lowland, fresh: !!o.fresh, patience: o.patience || 1, zoneH: o.zone || GUIDE.zone, time: 0, snaps: 0 };
  }
  function press(st) {
    if (st.phase === 'bite') { st.phase = 'fight'; st.t = 0; st.prog = GUIDE.start; st.fy = 0.5; st.fty = st.R() < 0.5 ? 0.08 + st.R() * 0.2 : 0.72 + st.R() * 0.2; st.fNext = 1.2; st.zy = 0.5; st.zv = 0; st.on = true; st.dist = (1 - st.prog) * (60 + st.fish.size * 60); st.runIn = (1.5 + st.R() * 2.5) / Math.max(0.3, st.fish.runs || 0.3); st.run = 0; return 'hooked'; }   /* (a press before the bite does nothing now: it scared the fish, too hard, 2026-10-25) */
    return null;
  }
  function tick(st, dt, inp) {
    st.time += dt; st.t += dt;
    if (st.phase === 'wait') { st.bob = Math.sin(st.time * 2.2) * 0.5; if (st.t >= st.until) { st.phase = 'nibble'; st.t = 0; st.until = 1.3 + st.R() * 1.2; st.tap = 0; st.tapIn = 0.05; return 'nibble'; } return null; }
    if (st.phase === 'nibble') {          /* a fish at the bait (Robin, 2026-10-25: "a little blub blub when there's a fish to catch"): the float tapped down now and then, a quick dip that bobs back */
      st.tap = Math.max(0, (st.tap || 0) - dt * 5.5); st.tapIn -= dt; var tapped = false; if (st.tapIn <= 0) { st.tap = 1; st.tapIn = 0.35 + st.R() * 0.45; tapped = true; }
      st.bob = Math.sin(st.time * 3) * 0.4 + 2.6 * Math.sin(Math.min(1, 1 - st.tap) * Math.PI) * (st.tap > 0 ? 1 : 0);
      if (st.t >= st.until) { st.phase = 'bite'; st.t = 0; st.until = 1.5 - st.fish.fight * 0.2; return 'bite'; } return tapped ? 'tap' : null;   /* the bite's window 1.3 to 1.5 s (was 0.65 to 0.85) */
    }
    if (st.phase === 'bite') { var sn = Math.min(1, st.t / 0.07); st.bob = 4.6 * (1 - (1 - sn) * (1 - sn)) + Math.sin(st.time * 22) * 0.6;   /* the bite snaps it down, under to its red cap (Robin: "make it snap down a little") */ if (st.t >= st.until) { st.phase = 'wait'; st.t = 0; st.until = 2 + st.R() * 3; return 'missed'; } return null; }   /* a missed bite: the same fish comes back soon */
    if (st.phase === 'fight') {
      var f = st.fish, ev = null, up = inp && inp.up, dn = inp && inp.down, zh = st.zoneH, spd = f.id === 'chest' ? 0.17 : 0.24 + f.fight * 0.28;
      st.fNext -= dt; if (st.fNext <= 0) { st.fty = st.R() < 0.5 ? 0.05 + st.R() * 0.33 : 0.62 + st.R() * 0.33;   /* (a new depth toward either end: it crosses the middle, it does not linger there, so a band left alone catches little) */ st.fNext = (0.7 + st.R() * 1.1) / (0.8 + f.fight * 0.5); }   /* the fish drifts to a new depth now and then */
      if (st.run > 0) st.run -= dt; else if (f.runs > 0) { st.runIn -= dt; if (st.runIn <= 0) { st.run = 0.5 + st.R() * 0.4; st.fty = st.fy > 0.5 ? 0.04 + st.R() * 0.2 : 0.76 + st.R() * 0.2; st.runIn = (2.2 + st.R() * 3) / Math.max(0.3, f.runs); ev = 'run'; } }   /* a runner darts to the far end */
      var gap = st.fty - st.fy, sp = spd * (st.run > 0 ? 2.4 : 1); st.fy += Math.max(-sp * dt, Math.min(sp * dt, gap * Math.min(1, dt * 3) + Math.sign(gap) * sp * dt * 0.4)); st.fy = Math.max(0, Math.min(1, st.fy));
      st.zv += ((up ? 1 : 0) - (dn ? 1 : 0)) * GUIDE.accel * dt; if (!up && !dn) st.zv *= Math.max(0, 1 - GUIDE.drag * dt); st.zv = Math.max(-GUIDE.maxV, Math.min(GUIDE.maxV, st.zv));
      st.zy += st.zv * dt; if (st.zy < zh / 2) { st.zy = zh / 2; st.zv = 0; } if (st.zy > 1 - zh / 2) { st.zy = 1 - zh / 2; st.zv = 0; }
      st.on = Math.abs(st.fy - st.zy) <= zh / 2 + GUIDE.margin;
      if (st.on) st.prog += dt * GUIDE.fill / (0.55 + f.fight * 0.9) * (f.id === 'chest' ? 0.6 : 1);   /* (a herring comes in about twice as fast as a salmon) */ else if (st.t > GUIDE.grace) st.prog -= dt * GUIDE.drain;
      st.prog = Math.max(0, Math.min(1, st.prog)); st.dist = (1 - st.prog) * (60 + f.size * 60); st.tension = st.on ? 0 : 0.5;
      st.bob = st.run > 0 ? Math.sin(st.time * 16) * 2.5 : Math.sin(st.time * 5) * 1;
      if (st.prog >= 1) { st.phase = 'landed'; return 'landed'; }
      if (st.prog <= 0) { st.phase = 'lost'; st.snaps++; return 'lost'; }
      return ev;
    }
    return null;
  }
  return { FISH: FISH, GUIDE: GUIDE, ORDER: ORDER, CHEST_CHANCE: CHEST_CHANCE, table: table, roll: roll, start: start, press: press, tick: tick };
})();
if (typeof module !== 'undefined') module.exports = Fishing;
