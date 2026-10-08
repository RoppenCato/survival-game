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
   Fishing.tick(st, dt, held) advances it (held: the reel button down) and returns an event string or null ('nibble', 'bite',
   'missed', 'scared', 'hooked', 'run', 'landed', 'lost'); Fishing.press(st) is a press of the button (hooks, or scares).
   tests/fishing.js plays it with bots. */
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
  var CHEST_CHANCE = 0.03;                                 // a sunken chest's share of bites in deep water
  // what bites where: depth is how deep the water is under the float (units of elevation below the waterline, 0.5 shallow, 6 deep);
  // lowland says the island is the second biome's. The weights favour the water each fish lives in.
  function table(depth, lowland) {
    var deep = Math.max(0, Math.min(1, (depth - 1.5) / 4)), shallow = 1 - deep, t = {};
    t.herring = FISH.herring.weight;
    t.perch = FISH.perch.weight * (0.25 + shallow) * (lowland ? 0.6 : 1);
    t.cod = FISH.cod.weight * (0.1 + deep);
    t.pike = lowland ? FISH.pike.weight * (0.3 + shallow) : 0.15;
    t.salmon = FISH.salmon.weight * (0.1 + deep);
    return t;
  }
  function roll(R, depth, lowland) {
    var deep = Math.max(0, Math.min(1, (depth - 1.5) / 4));
    if (deep > 0.3 && R() < CHEST_CHANCE) return make(R, 'chest');
    var t = table(depth, lowland), sum = 0, k; for (k in t) sum += t[k];
    var u = R() * sum; for (k in t) { u -= t[k]; if (u <= 0) return make(R, k); }
    return make(R, 'herring');
  }
  function make(R, id) { var f = FISH[id], u = R(), kg = f.kg[0] + (f.kg[1] - f.kg[0]) * u * u; return { id: id, name: f.name, kg: Math.round(kg * 10) / 10, size: u, fight: f.fight * (0.75 + 0.5 * u), runs: f.runs, line: f.line }; }
  function start(R, depth, lowland) {
    var fish = roll(R, depth, lowland);
    return { phase: 'wait', t: 0, until: 3 + R() * 6, fish: fish, dist: 0, tension: 0, run: 0, runIn: 0, calm: 0, bob: 0, R: R, depth: depth, lowland: !!lowland, time: 0, snaps: 0 };
  }
  function press(st) {
    if (st.phase === 'nibble') { st.phase = 'wait'; st.t = 0; st.until = 4 + st.R() * 6; st.fish = roll(st.R, st.depth, st.lowland); return 'scared'; }
    if (st.phase === 'bite') { st.phase = 'fight'; st.t = 0; st.dist = 60 + st.fish.size * 60; st.tension = 0.15; st.runIn = (0.8 + st.R() * 2) / Math.max(0.3, st.fish.runs); st.run = 0; return 'hooked'; }
    return null;
  }
  function tick(st, dt, held) {
    st.time += dt; st.t += dt;
    if (st.phase === 'wait') { st.bob = Math.sin(st.time * 2.2) * 0.5; if (st.t >= st.until) { st.phase = 'nibble'; st.t = 0; st.until = 0.6 + st.R() * 0.7; return 'nibble'; } return null; }
    if (st.phase === 'nibble') { st.bob = Math.sin(st.time * 14) * 1.6; if (st.t >= st.until) { st.phase = 'bite'; st.t = 0; st.until = 0.9 - st.fish.fight * 0.25; return 'bite'; } return null; }
    if (st.phase === 'bite') { st.bob = 4 + Math.sin(st.time * 20) * 1.5; if (st.t >= st.until) { st.phase = 'wait'; st.t = 0; st.until = 3 + st.R() * 6; st.fish = roll(st.R, st.depth, st.lowland); return 'missed'; } return null; }
    if (st.phase === 'fight') {
      var f = st.fish, ev = null;
      if (st.run > 0) { st.run -= dt; if (st.run <= 0) { st.run = 0; st.runIn = (1.2 + st.R() * 2.8) / Math.max(0.3, f.runs); } }
      else if (f.runs > 0) { st.runIn -= dt; if (st.runIn <= 0) { st.run = (0.5 + st.R() * 0.9) * (0.6 + f.runs * 0.5); ev = 'run'; } }
      var running = st.run > 0, pull = running ? f.fight * 1.6 : f.fight * 0.2;
      if (held) { st.tension += dt * (0.12 + pull) * (st.patience || 1); st.dist -= dt * 24 * (running ? 0.3 : 1) / (0.7 + f.fight * 0.45); }
      else { st.tension -= dt * (1.0 - pull * 0.3); st.dist += dt * (running ? 11 * f.fight : 2) * (f.id === 'chest' ? 0.3 : 1); }
      st.tension = Math.max(0, Math.min(1, st.tension)); st.dist = Math.max(0, Math.min(160, st.dist));
      st.bob = running ? Math.sin(st.time * 16) * 2.5 : Math.sin(st.time * 5) * 1;
      if (st.tension >= 1) { st.phase = 'lost'; st.snaps++; return 'lost'; }
      if (st.dist <= 0) { st.phase = 'landed'; return 'landed'; }
      return ev;
    }
    return null;
  }
  return { FISH: FISH, ORDER: ORDER, CHEST_CHANCE: CHEST_CHANCE, table: table, roll: roll, start: start, press: press, tick: tick };
})();
if (typeof module !== 'undefined') module.exports = Fishing;
