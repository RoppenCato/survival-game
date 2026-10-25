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

   THE FIGHT since 2026-10-25 (Robin: "too hard to catch"; then, of a track beside the hero, "I dont want it to be the same catching
   system as Stardew valley ... I want the catching to be 'live in the game' so it doesnt become a minigame ... guiding it in the water
   somehow"): the hooked fish swims in the water before you, where the page draws it, its own way, mostly away and to the side, now and
   then bolting; holding W reels it in, fastest while its head points at you; A and D pull the rod to the left or the right of the
   screen, which turns its head that way (side strain, as anglers turn a fish); it tires as it fights; at the water's edge before you
   it is landed; let it swim off past the line's reach and it slips the hook. inp: { reel, left, right, water(dx, dy) } with the fish's
   place relative to the hero (st.fx, st.fy, world units). The numbers are STEER, mine. */
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
  var STEER = { reel: 34, pullAD: 9, turnW: 0.25, turnAD: 2.4, turnSelf: 1.3, swim: [13, 28], runK: 2.1, tireK: 0.07, tireMax: 0.55, land: 26, edge: 70, slack: 90, slip: 1.6 };   /* the fight: the reel's pull, A and D's, how fast the strain or its own will turns its head, its speed by its fight, a bolt, how it tires, where it is landed (near you, or at the water's edge before you), how far past the cast it may run and for how long before it slips the hook */
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
    return { phase: 'wait', t: 0, until: 3 + R() * 6, fish: fish, dist: 0, tension: 0, run: 0, runIn: 0, calm: 0, bob: 0, R: R, depth: depth, lowland: !!lowland, fresh: !!o.fresh, patience: o.patience || 1, reelK: o.reel || 1, reach: o.reach || 100, time: 0, snaps: 0 };
  }
  function press(st) {
    if (st.phase === 'bite') { st.phase = 'fight'; st.t = 0; if (st.fx == null) { st.fx = 0; st.fy = -st.reach; } var r0 = Math.hypot(st.fx, st.fy) || 1; st.fh = Math.atan2(st.fy, st.fx) + (st.R() - 0.5) * 2; st.fht = st.fh; st.fNext = 0.8; st.tire = 0; st.lean = 0; st.slipT = 0; st.maxR = r0 + STEER.slack; st.dist = r0; st.runIn = (1.5 + st.R() * 2.5) / Math.max(0.3, st.fish.runs || 0.3); st.run = 0; st.on = false; return 'hooked'; }   /* (a press before the bite does nothing now: it scared the fish, too hard, 2026-10-25) */
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
      var f = st.fish, ev = null, wat = (inp && inp.water) || function () { return true; }, reel = !!(inp && inp.reel), ld = (inp && inp.right ? 1 : 0) - (inp && inp.left ? 1 : 0);
      st.lean += (ld - st.lean) * Math.min(1, dt * 8);
      var r = Math.hypot(st.fx, st.fy) || 1, toH = Math.atan2(-st.fy, -st.fx), hx = -st.fx / r, hy = -st.fy / r;
      st.fNext -= dt; if (st.fNext <= 0) { st.fht = toH + Math.PI + (st.R() - 0.5) * 2.6; st.fNext = 1 + st.R() * 1.6; }   /* its own will: away from you and to the side */
      if (st.run > 0) st.run -= dt; else if (f.runs > 0) { st.runIn -= dt; if (st.runIn <= 0) { st.run = 0.6 + st.R() * 0.5; st.fht = toH + Math.PI + (st.R() - 0.5) * 1.6; st.fh = st.fh * 0.5 + st.fht * 0.5; st.runIn = (2.5 + st.R() * 3.5) / Math.max(0.3, f.runs); ev = 'run'; } }
      var strain = Math.abs(st.lean) > 0.15 || reel, px = hx + st.lean * 1.2, py = hy, pullDir = Math.atan2(py, px);   /* the rod's pull: toward you, leaned to the screen's left or right */
      var leaning = Math.abs(st.lean) > 0.15, want = leaning && st.run <= 0 ? pullDir : st.fht, rate = leaning && st.run <= 0 ? STEER.turnAD : STEER.turnSelf * (st.run > 0 ? 0.6 : 1), dh = Math.atan2(Math.sin(want - st.fh), Math.cos(want - st.fh));
      st.fh += Math.max(-rate * dt, Math.min(rate * dt, dh));   /* A or D turns its head toward the pull; left alone, or only reeled, it swims where it will */
      if (reel && !leaning) { var dw = Math.atan2(Math.sin(toH - st.fh), Math.cos(toH - st.fh)); st.fh += Math.max(-STEER.turnW * dt, Math.min(STEER.turnW * dt, dw)); }   /* (the reel alone turns it a little) */
      st.tire = Math.min(STEER.tireMax, st.tire + dt * STEER.tireK * (strain ? 1 : 0.3));
      var sp = (STEER.swim[0] + (STEER.swim[1] - STEER.swim[0]) * Math.min(1, f.fight)) * (1 - st.tire) * (st.run > 0 ? STEER.runK : 1) * (f.id === 'chest' ? 0.5 : 1);
      var fc = Math.max(0, Math.cos(st.fh - toH)), vx = Math.cos(st.fh) * sp * (1 - 0.8 * fc), vy = Math.sin(st.fh) * sp * (1 - 0.8 * fc);   /* (turned toward you it hangs back: it never swims in on its own) */
      if (reel) { var face = Math.max(0, Math.cos(st.fh - toH)), rp = STEER.reel * st.reelK * (0.15 + 0.85 * face) * (f.id === 'chest' ? 0.6 : 1) / (0.75 + 0.5 * Math.min(1, f.fight)); vx += hx * rp; vy += hy * rp; }
      if (Math.abs(st.lean) > 0.15) { vx += st.lean * STEER.pullAD; }
      var nx = st.fx + vx * dt, ny = st.fy + vy * dt;
      if (wat(nx, ny)) { st.fx = nx; st.fy = ny; } else { var tL = st.fh + 1.3, tR = st.fh - 1.3; st.fh = wat(st.fx + Math.cos(tL) * 8, st.fy + Math.sin(tL) * 8) ? tL : tR; st.fht = st.fh; if (reel && r < STEER.edge && !wat(st.fx + hx * 10, st.fy + hy * 10)) { st.phase = 'landed'; return 'landed'; } }   /* it turns along the shore; reeled against the water's edge before you, it is landed up the beach */
      r = Math.hypot(st.fx, st.fy); st.dist = r; st.on = reel; st.bob = st.run > 0 ? Math.sin(st.time * 16) * 2.5 : Math.sin(st.time * 5) * 1;
      if (r < STEER.land || (reel && r < STEER.edge && !wat(st.fx + hx * 10, st.fy + hy * 10))) { st.phase = 'landed'; return 'landed'; }
      if (r > st.maxR) { st.slipT += dt; if (st.slipT > STEER.slip) { st.phase = 'lost'; st.snaps++; return 'lost'; } } else st.slipT = Math.max(0, st.slipT - dt);
      return ev;
    }
    return null;
  }
  return { FISH: FISH, STEER: STEER, ORDER: ORDER, CHEST_CHANCE: CHEST_CHANCE, table: table, roll: roll, start: start, press: press, tick: tick };
})();
if (typeof module !== 'undefined') module.exports = Fishing;
