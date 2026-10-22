/* The yard and the vessels: the parts a hull is laid from, the plans that say when a hull is sound, and the drawing of
   the vessel that comes out of it. Shared by the game (the Shipyard behind the shipwright's bench) and the Sea Editor
   (where a vessel is laid for free and sailed). A yard is { plan, cells: [{ id, i, j }] }; a vessel is { kind, parts,
   x, y, h, hw, hh, seat } once fit() has measured it. Coordinates on the water: CW units a cell along the hull, CH across. */
var Yard = (function () {
var T = 32, TS = 24, K = 0.75;
  /* The hulls (2026-10-13, Robin: "Do it": a few real hull designs, chosen in the yard and laid at once; the fitting out is
     the player's: the thwarts, the mast, the sail, the steering oar, a dragon stem, shields along the rail). A hull is
     n keel cells long (i = 1 .. n of the yard, the keel on row KJ) and its sides are a design, not laid strakes: beam is
     how many strake rows it carries amidships, and hullProfile() draws the half-width of every column from it. thwarts
     [min, max] rowing seats; mast and rudder the cells they must go on (none: no rig); tier the bench's; cost paid when
     the vessel is launched (the parts are paid as they are laid); zoom the yard's camera, so a longship fits the screen. */
  var U = 1 / 0.046;                     // units a metre (the canon scale: a unit is 4.6 cm; docs/ships-plan.md, 2026-10-21: the hulls at the sizes they were dug up at)
  var KJ = 3, HULLS = {                    // m: the length in metres, beam in metres, n: keel cells (a cell a thwart's pitch, CW), per: rowers to a thwart, zoom: the yard's camera, sea: the game's camera when aboard
    faering: { name: 'Faering', m: 6.5, beam: 1.4, n: 5, per: 1, thwarts: [1, 2], mast: null, rudder: null, tier: 2, zoom: 1.1, sea: 0.65, cost: { wood: 10, copper: 3 }, text: 'A four-oared boat for the fjord and the sound, six and a half metres: two rowing seats at most, one man to a seat with a pair of oars, no mast. Quick to turn, light to row.' },
    boat: { name: 'Boat', m: 9, beam: 2.0, n: 8, per: 2, thwarts: [1, 3], mast: null, rudder: null, tier: 2, zoom: 0.9, sea: 0.65, cost: { wood: 14, copper: 5 }, text: 'A six-oared boat of nine metres: three rowing seats at most, two men to a seat, no mast. The first that crosses to the big island with a crew.' },
    rowboat: { name: 'Rowboat', m: 5.2, beam: 1.25, n: 4, per: 1, thwarts: [1, 1], mast: null, rudder: null, tier: 1, zoom: 1.25, sea: 0.65, cost: { wood: 14, fiber: 4 }, model: 'rowboat', size: 'for you', text: 'A small boat of five metres, a pair of oars and a seat: just you. Wood and fibre, taught by Arnor.' },
    karve4: { name: 'Karve', m: 11, beam: 3.2, n: 9, per: 2, thwarts: [2, 2], mast: 5, rudder: 1, tier: 2, zoom: 0.75, sea: 0.6, cost: { wood: 20, copper: 6, fiber: 8 }, model: 'karve', size: 'for 4', text: 'A small karve of eleven metres: a mast and a square sail, two seats for four rowers and a helmsman. The ship that leaves home.' },
    karve8: { name: 'Karve', m: 13.5, beam: 3.7, n: 11, per: 2, thwarts: [4, 4], mast: 6, rudder: 1, tier: 2, zoom: 0.68, sea: 0.58, cost: { wood: 28, copper: 10, fiber: 12 }, model: 'karve', size: 'for 8', text: 'A karve of thirteen and a half metres: four seats for eight rowers and a helmsman.' },
    karve: { name: 'Karve', m: 16, beam: 4.2, n: 14, per: 2, thwarts: [6, 6], mast: 8, rudder: 1, tier: 2, zoom: 0.6, sea: 0.55, cost: { wood: 36, copper: 14, fiber: 16 }, model: 'karve', size: 'for 12', text: 'A karve of sixteen metres: six seats for twelve rowers and a helmsman. A karve’s crew is for a farm, a church, a small village.' },
    longship16: { name: 'Longship', m: 19, beam: 4.6, n: 17, per: 2, thwarts: [8, 8], mast: 9, rudder: 1, tier: 3, zoom: 0.52, sea: 0.5, cost: { wood: 44, ironBar: 12 }, model: 'longship', size: 'for 16', text: 'A longship of nineteen metres: eight seats, sixteen oars and a helmsman.' },
    longship20: { name: 'Longship', m: 21, beam: 4.9, n: 19, per: 2, thwarts: [10, 10], mast: 10, rudder: 1, tier: 3, zoom: 0.49, sea: 0.47, cost: { wood: 52, ironBar: 16 }, model: 'longship', size: 'for 20', text: 'A longship of twenty-one metres: ten seats, twenty oars.' },
    longship: { name: 'Longship', m: 23, beam: 5.2, n: 21, per: 2, thwarts: [13, 13], mast: 11, rudder: 1, tier: 3, zoom: 0.46, sea: 0.45, cost: { wood: 64, ironBar: 22 }, model: 'longship', size: 'for 26', text: 'A warship of the kings, twenty-three metres: thirteen seats, twenty-six oars. A town waits for a longship’s crew.' }
  };
  var HULL_IDS = ['faering', 'boat', 'rowboat', 'karve4', 'karve8', 'karve', 'longship16', 'longship20', 'longship'], RIGGED = ['karve4', 'karve8', 'karve', 'longship16', 'longship20', 'longship'];
  /* The ships of the rework (docs/ships-rework.md; Robin, 2026-10-22): three models, each in sizes; a size is a hull design above.
     key: what opens the model (Arnor's teaching, copper, iron bars: by material age). The faering and the boat stay only for older
     saves (the game makes them rowboats). */
  var MODELS = [{ id: 'rowboat', name: 'Rowboat', key: 'raft', sizes: ['rowboat'] }, { id: 'karve', name: 'Karve', key: 'copper', sizes: ['karve4', 'karve8', 'karve'] }, { id: 'longship', name: 'Longship', key: 'ironBar', sizes: ['longship16', 'longship20', 'longship']}];
  function modelOf(kind) { var H = HULLS[kind]; return H && H.model ? H.model : kind === 'raft' || kind === 'faering' || kind === 'boat' ? 'rowboat' : kind; }
  function designParts(kind, o) {         // a hull of a design fully fitted: every seat its size has, the rig, the stem's head, the shields on the rail
    var H = HULLS[kind]; o = o || {}; if (!H) return []; var out = autoThwarts(H, H.thwarts[1]);
    if (H.mast) out.push({ id: 'mast', i: H.mast, j: KJ }, { id: 'sail', i: H.mast, j: KJ }, { id: 'rudder', i: 1, j: KJ });
    if (H.mast && o.head && o.head !== 'curl') out.push({ id: 'dragon', i: H.n, j: KJ });
    if (H.mast) out.push({ id: 'shields', i: 2, j: KJ });
    return out;
  }
  /* What a ship can look like (Robin's choices: the sail's colours and stripes, the shields' paint, the hull's tar and trim, the
     figurehead, a name) and the roles fitted in the shipyard (mine: Raider, Cargo, Voyager; War with the sea fights of chapter 3). */
  var LOOK = {
    sail: ['#e8dcc0', '#b23a2e', '#2f4f7a', '#d8a440', '#3e6b3a', '#5a3a26', '#1f1d22', '#7a3d6e'],
    pattern: [['plain', 'Plain'], ['stripes', 'Stripes'], ['checks', 'Checks'], ['border', 'Border']],
    shield: ['#b23a2e', '#d8a440', '#2f4f7a', '#e8dcc0', '#3e6b3a', '#1f1d22'],
    tar: ['#4a3526', '#2b211b', '#a07a4e', '#6a2a1e', '#1c1a1c'], trim: ['#8a6a44', '#b23a2e', '#d8a440', '#2f4f7a', '#e8dcc0', '#3e6b3a'],   // (the first of each: as built, the studio's planks and rail untinted)
    head: [['curl', 'A curl'], ['dragon', 'A dragon'], ['snake', 'A snake'], ['bear', 'A bear']]
  };
  function lookDefault() { return { sailA: LOOK.sail[0], sailB: LOOK.sail[1], pattern: 'stripes', shield: LOOK.shield[0], shield2: LOOK.shield[1], tar: LOOK.tar[0], trim: LOOK.trim[0], head: 'curl' }; }
  var FITTINGS = {                        // the roles: what each does (the numbers mine)
    raider: { name: 'Raider', text: 'The shields on the rail stop arrows from that side; ten in a hundred faster under oars; the men on and off quicker.', oarK: 1.1, boardK: 0.5, shieldsStop: true, cost: { wood: 6, leather: 4 } },
    cargo: { name: 'Cargo', text: 'A hold for heavy loot: twice the chests and sacks aboard, a bigger sea chest; a little slower.', oarK: 0.94, heavyK: 2, chestK: 2, cost: { wood: 8, fiber: 6 } },
    voyager: { name: 'Voyager', text: 'A better sail, half again more from the wind; provisions, so the crew stays fed on long crossings.', sailK: 1.5, fed: true, cost: { fiber: 12, leather: 2 } }
  };
  /* What a ship holds (mine): heavy things aboard (chests, sacks, the church's silver) by its size, twice with a Cargo hold; the sea
     chest's places, twice with Cargo. fitOf(v): its fitting's numbers, or none. */
  var HOLD = { rowboat: 1, karve4: 2, karve8: 3, karve: 4, longship16: 4, longship20: 5, longship: 6 }, NOFIT = {};
  function fitOf(v) { return (v && FITTINGS[v.fit]) || NOFIT; }
  function holdOf(v) { return (HOLD[v.kind] || 2) * (fitOf(v).heavyK || 1); }
  function chestK(v) { return fitOf(v).chestK || 1; }
  function heroSeat(v) {                   // where the hero is along the keel (the bow at +): alone on a rowing hull on the aft-most thwart at the oars; alone on a rigged hull at the steering oar; with any man aboard in the bow, looking ahead (Robin, 2026-10-21)
    var H = HULLS[v.kind]; if (!H) return 0;
    if ((v.crew || 0) > 0) return (v.hw || 0) * 0.72;
    if (H.rudder) return -(v.hw || 0) * 0.62;
    return v.seats && v.seats.length ? v.seats[0] : -(v.hw || 0) * 0.28;
  }
  function crewPlaces(v, n, nFloor) {              /* where n men sit, in the hull's frame (x along the keel, the bow at +; y across, the right-hand side looking forward at +): on a rigged hull the first place is the helmsman's at the steering oar, facing forward; the rowers fill the thwarts from the stern, the right-hand side first, two a thwart (one on the faering), facing aft; the rest sit on the floor in the stern and the bow. docs/ships-plan.md, 2026-10-21 */
    var H = HULLS[v.kind], out = [], pr, seats, per, i, k, fl = 0; nFloor = nFloor || 0; if (!H || !(n + nFloor > 0)) return out;
    pr = profileOf(v); seats = v.seats && v.seats.length ? v.seats : [0]; per = v.per || H.per || 2;
    if (H.rudder && v.rudder !== false) { var hx = Math.min(-pr.L * 0.72, seats[0] - 22); out.push({ x: hx, y: Math.max(6, profW(pr, hx, 1) - 15), face: 0, kind: 'helm', side: 1 }); }   // (aft of the aft-most thwart, whatever was laid)
    for (i = 0; i < seats.length && out.length < n; i++) for (k = 0; k < per && out.length < n; k++) {
      var sd = per === 1 ? 0 : (k === 0 ? 1 : -1), wv = profW(pr, seats[i], sd || 1), lat = per === 1 ? 0 : sd * Math.max(7, wv - 13);
      out.push({ x: seats[i], y: lat, face: Math.PI, kind: 'row', side: sd, seat: i });
    }
    while (out.length < n + nFloor) { var aft = fl % 2 === 0, q = Math.floor(fl / 2), x2 = aft ? -pr.L * 0.5 - q * 14 : pr.L * 0.42 + q * 14; out.push({ x: x2, y: (q % 2 ? -1 : 1) * 7, face: aft ? Math.PI / 2 : -Math.PI / 2, kind: 'floor', side: 0 }); fl++; }
    return out;
  }
  /* On and off (docs/ships-plan.md step 4, 2026-10-21). The GANGWAY is the point of the hull nearest the land: the rail is sampled
     all round and from each sample the walkable ground (the shore, or the shallows that can be waded) is looked for straight out, up to GANG.reach; the nearest wins. It gives the rail
     point (x, y), the land point to walk to (lx, ly, a step up the beach) and the distance. landingSpots spreads n men along the
     shore from a landing point: alternately either side along the shore line, a step apart and a step inland, each tested by
     free(x, y) with a small search round it. The game walks the men to the gangway and files them off onto the spots. */
  var GANG = { reach: 240, step: 6, up: 10, apart: 16, inland: 12 };   // (reach 240: a karve floats well off a gentle beach; the men walk through the shallows to it, so land() is 'can be walked on', the wade band too)
  function gangway(v, land) {
    if (!HULLS[v.kind]) return null;
    if (v._gang && v._gang.x === v.x && v._gang.y === v.y && v._gang.h === v.h) return v._gang.g;
    var pr = profileOf(v), L = pr.L, ch = Math.cos(v.h), sh = Math.sin(v.h), best = null, i, d;
    function toW(x, y) { return [v.x + x * ch - y * sh, v.y + x * sh + y * ch]; }
    var samples = []; for (i = 0; i <= 16; i++) { var x = -L * 0.92 + L * 1.84 * i / 16; [-1, 1].forEach(function (sd) { samples.push({ x: x, y: sd * profW(pr, x, sd), nx: 0, ny: sd }); }); }
    samples.push({ x: L * 0.98, y: 0, nx: 1, ny: 0 }); samples.push({ x: -L * 0.98, y: 0, nx: -1, ny: 0 });
    for (i = 0; i < samples.length; i++) { var q = samples[i], S = toW(q.x, q.y), N = [q.nx * ch - q.ny * sh, q.nx * sh + q.ny * ch];
      for (d = GANG.step; d <= GANG.reach; d += GANG.step) if (land(S[0] + N[0] * d, S[1] + N[1] * d)) { if (!best || d < best.d) best = { x: S[0], y: S[1], lx: S[0] + N[0] * (d + GANG.up), ly: S[1] + N[1] * (d + GANG.up), nx: N[0], ny: N[1], d: d }; break; } }
    v._gang = { x: v.x, y: v.y, h: v.h, g: best }; return best;
  }
  function landingSpots(sx, sy, nx, ny, n, free) {   // n spots on the land from (sx, sy), (nx, ny) pointing inland, spread along the shore
    var out = [], k, tx = -ny, ty = nx;
    for (k = 0; k < n; k++) { var side = k % 2 ? -1 : 1, q = Math.ceil(k / 2), bx = sx + nx * GANG.inland + tx * side * q * GANG.apart, by = sy + ny * GANG.inland + ty * side * q * GANG.apart, sp = null, r, a;
      function ok(px, py) { return free(px, py) && !out.some(function (o) { return Math.hypot(o.x - px, o.y - py) < 10; }); }
      if (ok(bx, by)) sp = { x: bx, y: by }; else for (r = 8; r <= 40 && !sp; r += 8) for (a = 0; a < 6.283 && !sp; a += 0.785) { var px = bx + Math.cos(a) * r, py = by + Math.sin(a) * r; if (ok(px, py)) sp = { x: px, y: py }; }
      out.push(sp || { x: bx, y: by }); }
    return out;
  }
  function addCost(a, b) { var o = {}, k; for (k in a) o[k] = (o[k] || 0) + a[k]; for (k in b) o[k] = (o[k] || 0) + b[k]; return o; }
  function autoThwarts(H, n) {             // where n rowing seats go on a hull of a design: a rigged hull fills out from the mast, aft first; a rowing boat spreads them evenly (the cells 2 to n - 1, never the mast's)
    var out = [], cells = [], i; if (n <= 0) return out;
    if (H.mast) { for (i = 1; cells.length < n && (H.mast - i >= 2 || H.mast + i <= H.n - 1); i++) { if (H.mast - i >= 2) cells.push(H.mast - i); if (cells.length < n && H.mast + i <= H.n - 1) cells.push(H.mast + i); } }
    else { var cand = []; for (i = 2; i <= H.n - 1; i++) cand.push(i); for (i = 0; i < n && cand.length; i++) cells.push(cand[Math.min(cand.length - 1, Math.floor((i + 0.5) * cand.length / n))]); }
    cells.sort(function (a, b) { return a - b; }).forEach(function (ci) { if (!out.some(function (q) { return q.i === ci; })) out.push({ id: 'thwart', i: ci, j: KJ }); });
    return out;
  }
  function isShip(kind) { return !!HULLS[kind]; }                  // a hull of a design (every vessel but the raft)
  function rigged(kind) { return !!(HULLS[kind] && HULLS[kind].mast); }   // a mast, a sail, a steering oar, the wind
  function nameOf(kind) { return HULLS[kind] ? HULLS[kind].name : 'Raft'; }
  function hullCost(kind) { return HULLS[kind] ? HULLS[kind].cost : null; }
  var ALL_PARTS = [
    { id: 'log', plan: 'raft', name: 'Log', cost: { wood: 2 }, w: 2, layer: 'hull', text: 'A log for the hull. Logs lie side by side, any shape, as long as they touch.' },
    { id: 'lash', plan: 'raft', name: 'Rope lashing', cost: { fiber: 2 }, w: 1, layer: 'bind', on: 'hull', text: 'Rope across a log. Every log needs one.' },
    { id: 'plank', plan: 'raft', name: 'Deck plank', cost: { wood: 1 }, w: 1, layer: 'deck', on: 'hull', text: 'A plank over the logs: a drier deck.' },
    { id: 'thwart', plan: HULL_IDS, name: 'Rowing seat', cost: { wood: 1 }, w: 1, layer: 'deck', on: 'hull', text: 'A seat with an oar each side, laid anywhere along the hull. The first is yours; more need hirdmen to row.' },
    { id: 'mast', plan: RIGGED, name: 'Mast', cost: { wood: 5, fiber: 4 }, w: 1, layer: 'deck', on: 'hull', text: 'A tall pine stepped on the keel amidships, on the marked cell. The sail hangs from its yard.' },
    { id: 'sail', plan: RIGGED, name: 'Sail', cost: { fiber: 18 }, w: 1, layer: 'fit', on: 'deck', text: 'A square sail of woven cloth, striped. It goes on the mast. A wind from behind is speed for nothing.' },
    { id: 'rudder', plan: RIGGED, name: 'Steering oar', cost: { wood: 3, copper: 1 }, costs: { longship: { wood: 3, ironBar: 1 } }, w: 1, layer: 'fit', on: 'hull', text: 'The side rudder, bound at the stern on the right-hand side, on the marked cell. You stand by it and steer.' },
    { id: 'dragon', plan: HULL_IDS, name: 'Dragon stem', cost: { wood: 4, copper: 1 }, costs: { longship: { wood: 4, ironBar: 1 } }, w: 1, layer: 'fit', on: 'hull', text: 'A carved head on the stem at the bow. It changes nothing but what the shore sees coming.' },
    { id: 'shields', plan: RIGGED, name: 'Shields on the rail', cost: { wood: 8, leather: 4 }, w: 1, layer: 'fit', on: 'hull', text: 'Round shields hung along both rails, as a crew hangs them when it comes in peace or in force. Laid once, anywhere on the hull.' }
  ];
  // the keel and strake cells a hull's design lays in the yard: the keel on row KJ, the strake rows by the beam (two at most on each side)
  function hullCellsOf(plan) {
    var H = HULLS[plan], out = [], k; if (!H) return out;
    for (k = 0; k < H.n; k++) { out.push({ id: 'keel', i: 1 + k, j: KJ }); var rows = Math.min(2, Math.round(H.beam / 2.2 * shapeK(k, H.n))); for (var r = 1; r <= rows; r++) { out.push({ id: 'strake', i: 1 + k, j: KJ - r }); out.push({ id: 'strake', i: 1 + k, j: KJ + r }); } }
    return out;
  }
  function shapeK(k, n) { return Math.pow(Math.max(0, Math.min(1, 1.3 * Math.sin(Math.PI * (k + 0.5) / n))), 0.7); }   // full amidships, drawing in to the stems
  function inPlan(p, plan) { return Array.isArray(p.plan) ? p.plan.indexOf(plan) >= 0 : p.plan === plan; }
  function costFor(pt, plan) { return pt.costs && pt.costs[plan] ? pt.costs[plan] : pt.cost; }       // a part shared by plans can cost differently in each (a rigged ship's nails are iron)
  function partsFor(plan) { return ALL_PARTS.filter(function (p) { return inPlan(p, plan); }).map(function (p) { var o = {}, k; for (k in p) o[k] = p[k]; o.cost = costFor(p, plan); return o; }); }
  var YARD_PLANS = [['raft', 'Raft'], ['faering', 'Faering'], ['boat', 'Boat'], ['karve', 'Karve'], ['longship', 'Longship']], PLAN_TIER = { raft: 1, faering: 2, boat: 2, karve: 3, longship: 3 };   // the bench's tier a plan needs
  var LAYERS = ['hull', 'bind', 'deck', 'fit'];
  var PLANS = {
    raft: { name: 'Raft', checks: [
      function (y) { if (yardParts(y, 'log').length < 3) return 'Lay at least three logs'; return ''; },
      function (y) { if (!yardConnected(y)) return 'Every log must touch another log'; return ''; },
      function (y) { if (yardParts(y, 'log').length > 8) return 'Eight logs is as much as rope will hold'; return ''; },
      function (y) { var lashes = yardParts(y, 'lash'), bad = yardParts(y, 'log').some(function (p) { return !lashes.some(function (l) { return l.j === p.j && l.i >= p.i && l.i < p.i + 2; }); }); if (bad) return 'A rope lashing on every log'; return ''; }
    ] }
  };
  function hullChecks(id) {
    var H = HULLS[id], WORDS = ['none', 'one', 'two', 'three', 'four', 'five', 'six'];
    return [
      function (y) { var n = yardParts(y, 'thwart').length; if (n < H.thwarts[0]) return H.thwarts[0] === 1 ? 'A rowing seat, at least one' : 'Rowing seats, ' + (WORDS[H.thwarts[0]] || H.thwarts[0]) + ' at least'; if (n > H.thwarts[1]) return 'No room for more than ' + H.thwarts[1] + ' seats'; return ''; },
      H.mast ? function (y) { var m = yardParts(y, 'mast'); if (m.length !== 1) return m.length ? 'One mast is enough' : 'Step a mast on the keel, amidships (the marked cell)'; return ''; } : null,
      H.mast ? function (y) { var sl = yardParts(y, 'sail'), m = yardParts(y, 'mast'); if (sl.length !== 1) return sl.length ? 'One sail' : 'A sail on the mast'; if (!m.length || sl[0].i !== m[0].i || sl[0].j !== m[0].j) return 'The sail goes on the mast'; return ''; } : null,
      H.rudder ? function (y) { var r = yardParts(y, 'rudder'); if (r.length !== 1) return r.length ? 'One steering oar' : 'A steering oar at the stern (the marked cell)'; return ''; } : null,
      function (y) { if (yardParts(y, 'dragon').length > 1) return 'One stem'; if (yardParts(y, 'shields').length > 1) return 'One row of shields'; return ''; }
    ].filter(function (f) { return !!f; });
  }
  HULL_IDS.forEach(function (id) { PLANS[id] = { name: HULLS[id].name, checks: hullChecks(id) }; });
  function yardConnected(y) {              // every log reaches every other through touching logs (free shapes, one hull)
    var logs = yardParts(y, 'log'); if (logs.length < 2) return true;
    function touch(a, b) { if (a.j === b.j) return Math.abs(a.i - b.i) <= 2; if (Math.abs(a.j - b.j) === 1) return a.i < b.i + 2 && b.i < a.i + 2; return false; }
    var seenL = [logs[0]], grew = true;
    while (grew) { grew = false; logs.forEach(function (l) { if (seenL.indexOf(l) >= 0) return; if (seenL.some(function (q) { return touch(l, q); })) { seenL.push(l); grew = true; } }); }
    return seenL.length === logs.length;
  }
  function yardParts(y, id) { return y.cells.filter(function (p) { return p.id === id; }); }
  function yardAt(y, i, j, layer) { for (var k = 0; k < y.cells.length; k++) { var p = y.cells[k], pt = partOf(p.id); if (pt && pt.layer === layer && j === p.j && i >= p.i && i < p.i + pt.w) return k; } if (layer === 'hull' && HULLS[y.plan]) { var hc = hullCellsOf(y.plan); for (k = 0; k < hc.length; k++) if (hc[k].i === i && hc[k].j === j) return -2; } return -1; }   // -2: a cell of the hull's own design (there, but not a laid part)
  function partOf(id) { for (var k = 0; k < ALL_PARTS.length; k++) if (ALL_PARTS[k].id === id) return ALL_PARTS[k]; return null; }
  function yardCheck(y) { var cs = PLANS[y.plan].checks; for (var k = 0; k < cs.length; k++) { var why = cs[k](y); if (why) return why; } return ''; }

  function drawYardPart(c, pt, x, y, s) {              // a part lying in its cell(s): x, y is the cell's top left on screen
    c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round'; var k;
    if (pt.id === 'log') { ink(c, [[3, 6], [2 * T - 6, 5.5], [2 * T - 6, TS - 5.5], [3, TS - 6]], '#7a5a40', { wob: 0.8, seed: 3, lw: 0.9, heavy: 1.8 }); for (k = 0; k < 3; k++) stroke(c, [[6 + k * 3, 8 + k * 3.2 + (k % 2) * 1.5], [2 * T - 12 - k * 5, 8.5 + k * 3.2 + (k % 2) * 1.5]], INK.faint, 0.6); stroke(c, [[5, 7.2], [2 * T - 9, 7]], INK.lit, 0.9); logEnd(c, 2 * T - 6, TS / 2, 2.6, (TS - 11) / 2, '#c9ab7a'); c.fillStyle = INK.faint; c.beginPath(); c.ellipse(14, TS / 2 + 2, 1.8, 1.1, 0, 0, 7); c.fill(); }
    else if (pt.id === 'lash') { for (k = 0; k < 5; k++) { var yy = 2 + k * (TS - 4) / 4.5; stroke(c, [[T / 2 - 2.2, yy], [T / 2 + 2.2, yy + 2.6]], INK.line, 2.6); stroke(c, [[T / 2 - 2.2, yy], [T / 2 + 2.2, yy + 2.6]], COL.rope, 1.6); } stroke(c, [[T / 2, 1], [T / 2, TS - 1]], INK.faint, 0.5); }
    else if (pt.id === 'plank') { ink(c, rect(3, TS / 2 - 3.5, T - 6, 7), COL.deck, { wob: 0.5, seed: 5, lw: 0.8, heavy: 1.4 }); stroke(c, [[6, TS / 2 + 0.3], [T - 6, TS / 2 - 0.2]], INK.faint, 0.5); c.fillStyle = INK.line; c.globalAlpha = 0.5; c.fillRect(5.5, TS / 2 - 0.5, 1, 1); c.fillRect(T - 6.5, TS / 2 - 0.5, 1, 1); c.globalAlpha = 1; }
    else if (pt.id === 'keel') { ink(c, [[1, TS / 2 - 4], [T - 1, TS / 2 - 4.4], [T - 1, TS / 2 + 4.4], [1, TS / 2 + 4]], mix(COL.hull, '#000000', 0.15), { wob: 0.5, seed: 7, lw: 0.9, heavy: 1.8 }); stroke(c, [[3, TS / 2 - 1.8], [T - 3, TS / 2 - 2]], INK.lit, 0.9); stroke(c, [[4, TS / 2 + 1.5], [T - 4, TS / 2 + 1.2]], INK.faint, 0.5); }
    else if (pt.id === 'strake') { ink(c, rect(1, TS / 2 - 3.6, T - 2, 7.2), COL.deck, { wob: 0.5, seed: 9, lw: 0.8, heavy: 1.5 }); stroke(c, [[3, TS / 2 - 1.6], [T - 3, TS / 2 - 1.8]], INK.lit, 0.8); [6, T - 6].forEach(function (nx) { c.fillStyle = COL.iron; c.beginPath(); c.arc(nx, TS / 2 + 0.6, 1.1, 0, 7); c.fill(); c.strokeStyle = INK.line; c.lineWidth = 0.5; c.stroke(); }); }
    else if (pt.id === 'thwart') { ink(c, rect(4, 3, T - 8, 5), COL.deck, { wob: 0.4, seed: 11, lw: 0.8, heavy: 1.3 }); stroke(c, [[6, 7], [2, TS - 3]], INK.line, 3.2); stroke(c, [[6, 7], [2, TS - 3]], mix(COL.deck, '#000000', 0.15), 1.8); stroke(c, [[T - 6, 7], [T - 2, TS - 3]], INK.line, 3.2); stroke(c, [[T - 6, 7], [T - 2, TS - 3]], mix(COL.deck, '#000000', 0.15), 1.8); }
    else if (pt.id === 'mast') { ink(c, [[2, TS / 2 - 2.6], [T - 6, TS / 2 - 2.2], [T - 6, TS / 2 + 2.2], [2, TS / 2 + 2.6]], mix(COL.hull, '#ffffff', 0.08), { wob: 0.4, seed: 13, lw: 0.8, heavy: 1.5 }); stroke(c, [[5, TS / 2 - 0.8], [T - 9, TS / 2 - 1]], INK.lit, 0.7); c.fillStyle = COL.iron; c.beginPath(); c.arc(T - 6, TS / 2, 2.6, 0, 7); c.fill(); c.strokeStyle = INK.line; c.lineWidth = 0.7; c.stroke(); }   // the mast lying ready, its iron-bound head
    else if (pt.id === 'sail') { ink(c, rect(3, 4, T - 6, TS - 8), COL.sail, { wob: 0.4, seed: 17, lw: 0.8, heavy: 1.3 }); c.fillStyle = COL.trim; c.globalAlpha = 0.85; [7, 15, 23].forEach(function (sx) { c.fillRect(sx, 5, 3.4, TS - 10); }); c.globalAlpha = 1; [10, T - 10].forEach(function (tx) { stroke(c, [[tx, 3], [tx, TS - 3]], INK.line, 2.2); stroke(c, [[tx, 3], [tx, TS - 3]], COL.rope, 1.2); }); }   // the sail folded, tied with two ropes
    else if (pt.id === 'rudder') { stroke(c, [[4, TS - 3], [T - 9, 4]], INK.line, 4); stroke(c, [[4, TS - 3], [T - 9, 4]], mix(COL.deck, '#000000', 0.1), 2.2); c.save(); c.translate(7, TS - 6); c.rotate(0.95); ink(c, [[-3.6, -8], [3.6, -8], [4.2, 7], [-4.2, 7]], mix(COL.deck, '#000000', 0.05), { wob: 0.4, seed: 19, lw: 0.8, heavy: 1.2 }); c.restore(); stroke(c, [[T - 9, 4], [T - 3, 8]], INK.line, 3); stroke(c, [[T - 9, 4], [T - 3, 8]], COL.deck, 1.6); }   // the steering oar: a broad blade and the tiller
    else if (pt.id === 'dragon') { c.save(); c.translate(T / 2, TS / 2 + 4); ink(c, [[-3, 4], [-1, -6], [4, -10], [9, -9], [11, -6], [6, -5], [3, -2], [2, 4]], mix(COL.hull, '#000000', 0.1), { wob: 0.5, seed: 27, lw: 0.8, heavy: 1.4 }); c.fillStyle = '#f1e3b8'; c.beginPath(); c.arc(6.5, -7.6, 0.9, 0, 7); c.fill(); stroke(c, [[9, -6], [12, -3.5]], '#8a3a34', 1.2); c.restore(); }   // the carved head: a neck, a jaw, an eye, a tongue
    else if (pt.id === 'shields') { [[8, 7, '#8a3a34'], [16, 11, '#d9c48a'], [24, 7, '#3f5a7a']].forEach(function (q) { c.fillStyle = q[2]; c.beginPath(); c.ellipse(q[0], q[1] + 5, 4.6, 4.6, 0, 0, 7); c.fill(); c.strokeStyle = INK.line; c.lineWidth = 0.8; c.stroke(); c.fillStyle = COL.iron; c.beginPath(); c.arc(q[0], q[1] + 5, 1.3, 0, 7); c.fill(); }); }   // three round shields
    else if (pt.id === 'oar') { stroke(c, [[5, TS - 4], [T - 8, 5]], INK.line, 4); stroke(c, [[5, TS - 4], [T - 8, 5]], mix(COL.deck, '#000000', 0.1), 2.2); c.save(); c.translate(T - 7, 6); c.rotate(0.8); ink(c, [[-3.2, -5.5], [3.2, -5.5], [3.2, 5.5], [-3.2, 5.5]], mix(COL.deck, '#000000', 0.05), { wob: 0.6, seed: 13, lw: 0.7, heavy: 1.2 }); c.restore(); }
    c.restore();
  }

  var CW = 24, CH = 7.6;                   // a yard cell on the water: how long a cell is (a thwart's pitch, a metre and a bit, 2026-10-21; a raft's log is two) and how wide a log is
  function hullCells(parts) { return (parts || []).filter(function (p) { return partOf(p.id) && partOf(p.id).layer === 'hull'; }); }
  function fitVessel(raft) {                     // from its parts: how big the hull is (for the water test) and where you sit
    if (!raft) return; var parts = raft.parts && raft.parts.length ? raft.parts : RAFT_DEFAULT, hull = hullCells(parts), minI = 1e9, maxI = -1e9, minJ = 1e9, maxJ = -1e9;
    hull.forEach(function (p) { var w = partOf(p.id).w; minI = Math.min(minI, p.i); maxI = Math.max(maxI, p.i + w); minJ = Math.min(minJ, p.j); maxJ = Math.max(maxJ, p.j + 1); });
    var H = HULLS[raft.kind];
    if (H) {
      var pr = hullProfile(H, raft.kind); raft.hw = pr.L + 2; raft.hh = pr.Wmax + 2;
      raft.seats = parts.filter(function (p) { return p.id === 'thwart'; }).map(function (p) { return Math.max(-(pr.L - 12), Math.min(pr.L - 12, (p.i + 0.5 - pr.cx) * CW)); }).sort(function (a, b) { return a - b; });   // the rowing seats along the keel (bow at +)
      var AM = ART[raft.kind] && ART[raft.kind].J.marks; if (AM && AM.seats && AM.seats.length) raft.seats = AM.seats.map(function (q) { return q[0]; }).sort(function (a, b) { return a - b; });   // (a model's own seats)
      raft._gang = null; raft.rowers = raft.seats.length * (H.per || 2); raft.per = H.per || 2;                                 // two to a seat (one on the faering)
      raft.mastX = H.mast ? (H.mast + 0.5 - pr.cx) * CW : null;
      raft.sail = !!H.mast && parts.some(function (p) { return p.id === 'sail'; }); raft.rudder = !!H.rudder && parts.some(function (p) { return p.id === 'rudder'; });
      raft.dragon = parts.some(function (p) { return p.id === 'dragon'; }); raft.shields = parts.some(function (p) { return p.id === 'shields'; });
      raft.seat = heroSeat(raft);
    }
    else { raft.hw = (maxI - minI) * CW / 2 + 4; raft.hh = (maxJ - minJ) * CH / 2 + 4; raft.seat = 0; }
  }

  var RAFT_DEFAULT = [{ id: 'log', i: 0, j: 0 }, { id: 'log', i: 0, j: 1 }, { id: 'log', i: 0, j: 2 }, { id: 'log', i: 0, j: 3 }, { id: 'log', i: 0, j: 4 }, { id: 'lash', i: 0, j: 0 }, { id: 'lash', i: 1, j: 0 }, { id: 'lash', i: 0, j: 4 }, { id: 'lash', i: 1, j: 4 }];
  function drawOar(c, x, y, ang) { c.save(); c.translate(x, y); c.rotate(ang); c.strokeStyle = '#2e1a10'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(-9, 0); c.lineTo(9, 0); c.stroke(); c.strokeStyle = '#8a5a3a'; c.lineWidth = 1.8; c.stroke(); c.fillStyle = '#c99a66'; c.strokeStyle = '#2e1a10'; c.lineWidth = 1; c.beginPath(); c.ellipse(9, 0, 4, 2.4, 0, 0, 7); c.fill(); c.stroke(); c.restore(); }
  var LINE = '#231a16', COL = { hull: '#4e3a2c', deck: '#b08a5a', trim: '#8a4a3a', rope: '#c9b48a', iron: '#6f777f', sail: '#e6dcc6', tar: '#2e2520', hullLit: '#6a5040', planedLit: '#c9a874', bone: '#e6dcc6' };   // the Art Director's palette for the hull (2026-10-21, assets/ship/palette_review.png: the strakes tarred dark, the planed wood of thwarts and oars, the ship's one red, iron, bone)
  /* the ink toolkit (as in build.js): a fill with grain and a cool shade toward the lower right, a lit edge, a thin hand-made line
     all round and the heavy line on the shadow side */
  var INK = { line: '#231a16', lit: 'rgba(255,238,200,0.4)', soft: 'rgba(35,26,22,0.55)', faint: 'rgba(35,26,22,0.32)', grain: 0.2 }, grainCv = null;
  function mkCv(w, h) { if (typeof document !== 'undefined') { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; } if (global.__mk) return global.__mk(w, h); return require('@napi-rs/canvas').createCanvas(w, h); }
  function grainPat(c) {
    if (!grainCv) { grainCv = mkCv(64, 64); var g = grainCv.getContext('2d'), i, Rn = 0.41; for (i = 0; i < 900; i++) { Rn = (Rn * 9301 + 49297) % 233280; var x = Rn / 233280 * 64; Rn = (Rn * 9301 + 49297) % 233280; var y = Rn / 233280 * 64; Rn = (Rn * 9301 + 49297) % 233280; var d = Rn / 233280; g.fillStyle = d < 0.55 ? 'rgba(20,14,10,' + (0.25 + d * 0.5).toFixed(2) + ')' : 'rgba(255,245,225,' + (0.2 + (1 - d) * 0.6).toFixed(2) + ')'; g.fillRect(x, y, 1 + (d < 0.2 ? 1 : 0), 1); } }
    if (!c.__inkPat) c.__inkPat = c.createPattern(grainCv, 'repeat'); return c.__inkPat;
  }
  function hs(i, j) { var v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); }
  function mix(a, b, t) { function hx(q) { return [parseInt(q.slice(1, 3), 16), parseInt(q.slice(3, 5), 16), parseInt(q.slice(5, 7), 16)]; } var p = hx(a), q = hx(b), o = '#', i; for (i = 0; i < 3; i++) { var v = Math.round(p[i] + (q[i] - p[i]) * t).toString(16); o += v.length < 2 ? '0' + v : v; } return o; }
  function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
  function wob(pts, amp, seed) { if (!amp) return pts; var out = [], n = pts.length, i; for (i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n], ex = q[0] - p[0], ey = q[1] - p[1], L = Math.hypot(ex, ey) || 1, k = (hs(seed, i) - 0.5) * amp; out.push(p); if (L > 6) out.push([p[0] + ex * 0.5 - ey / L * k, p[1] + ey * 0.5 + ex / L * k]); } return out; }
  function path(c, d) { var i; c.beginPath(); c.moveTo(d[0][0], d[0][1]); for (i = 1; i < d.length; i++) c.lineTo(d[i][0], d[i][1]); c.closePath(); }
  function heavy(c, d, w) {
    var n = d.length, area = 0, i; if (n < 3) return;
    for (i = 0; i < n; i++) { var p = d[i], q = d[(i + 1) % n]; area += p[0] * q[1] - q[0] * p[1]; }
    var sgn = area > 0 ? 1 : -1, lx = -0.6, ly = -0.8;
    c.save(); c.lineCap = 'round'; c.lineWidth = w; c.strokeStyle = INK.line;
    for (i = 0; i < n; i++) { var a = d[i], b = d[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey) || 1, nx = ey / L * sgn, ny = -ex / L * sgn, k = Math.max(0, Math.min(1, (-(nx * lx + ny * ly) + 0.15) / 0.9)); if (k < 0.04) continue; c.globalAlpha = k * k; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    c.restore();
  }
  function ink(c, pts, fill, o) {
    o = o || {}; var d = wob(pts, o.wob == null ? 0.8 : o.wob, o.seed || 1), i, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (i = 0; i < d.length; i++) { x0 = Math.min(x0, d[i][0]); y0 = Math.min(y0, d[i][1]); x1 = Math.max(x1, d[i][0]); y1 = Math.max(y1, d[i][1]); }
    c.save(); path(c, d); c.fillStyle = fill; c.fill(); path(c, d); c.clip();
    c.globalAlpha = INK.grain; c.fillStyle = grainPat(c); c.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (!o.flat) { c.globalAlpha = o.shade == null ? 0.16 : o.shade; var g = c.createLinearGradient(x0, y0, x0 + (x1 - x0) * 0.7, y1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'hsla(222,40%,15%,1)'); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0); }
    c.globalAlpha = 1;
    if (!o.flat && o.lit !== false) { c.translate(-0.6, -0.6); path(c, d); c.lineWidth = 1.1; c.strokeStyle = INK.lit; c.stroke(); }
    c.restore();
    if (!o.noLine) { path(c, d); c.lineJoin = 'round'; c.lineWidth = o.lw || 0.8; c.strokeStyle = INK.line; c.stroke(); heavy(c, d, o.heavy || 1.8); }
    return d;
  }
  function inkPath(c, fill, o, trace) {       // the same finish round a path drawn by trace(): the hull outlines
    o = o || {}; c.save(); c.beginPath(); trace(); c.fillStyle = fill; c.fill(); c.beginPath(); trace(); c.clip();
    var b = o.box || [-200, -200, 400, 400]; c.globalAlpha = INK.grain; c.fillStyle = grainPat(c); c.fillRect(b[0], b[1], b[2], b[3]);
    if (!o.flat) { c.globalAlpha = o.shade == null ? 0.18 : o.shade; var g = c.createLinearGradient(b[0], b[1], b[0] + b[2] * 0.7, b[1] + b[3]); g.addColorStop(0, 'rgba(255,240,200,0.5)'); g.addColorStop(0.45, 'rgba(0,0,0,0)'); g.addColorStop(1, 'hsla(222,40%,15%,1)'); c.fillStyle = g; c.fillRect(b[0], b[1], b[2], b[3]); }
    c.globalAlpha = 1; c.restore();
    if (!o.noLine) { c.beginPath(); trace(); c.lineJoin = 'round'; c.lineWidth = o.lw || 1.1; c.strokeStyle = INK.line; c.stroke(); c.save(); c.translate(0.9, 1.1); c.beginPath(); trace(); c.globalAlpha = 0.45; c.lineWidth = (o.lw || 1.1) * 1.6; c.stroke(); c.restore(); }   // the heavy side: the line laid again a little down and right
  }
  function stroke(c, pts, col, w, a) { var i; c.save(); c.globalAlpha = a == null ? 1 : a; c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); c.restore(); }
  function logEnd(c, x, y, rx, ry, col) {     // the cut end of a log: pale wood with rings
    c.fillStyle = '#c9ab7a'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); c.strokeStyle = INK.faint; c.lineWidth = 0.5; c.beginPath(); c.ellipse(x, y, rx * 0.6, ry * 0.6, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(x, y, rx * 0.25, ry * 0.25, 0, 0, 7); c.stroke(); c.strokeStyle = INK.line; c.lineWidth = 0.7; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.stroke();
  }
  function shadeHex(hex, d) { var n = parseInt(hex.substr(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + d)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + d)), b = Math.max(0, Math.min(255, (n & 255) + d)); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }
  function speedOf(v) { return Math.hypot(v.vx || 0, v.vy || 0); }
  /* The hull's surfaces (the Art Director, 2026-10-21, assets/ship/: decided with it as A with C, the hull drawn in code and the
     studio's surfaces laid on it). setSurfaces({ plank, plankLit, rail, shields: [8 faces] }) is called by the page once the
     images are loaded (and by the render checks headless). The sides are BAKED once a hull kind and lit side (hullBake, at BK
     px a unit, in the hull's own frame): the plank strip tiled along each strake row cell by cell (u along the keel, a cell a
     strip; v from the inner curve at the strip's bottom to the rail at its top), the lit strip on the side that faces the
     world's upper left (the sun), the rail strip along the gunwale, the ink outline over it; the floor, the thwarts, the stems
     and the rig stay drawn as before. The shields are the eight painted faces (shieldFace: mostly the muted six, the red
     two one in four at most). Without surfaces the hull draws as it did. */
  var SURF = null, bakes = {}, BK = 2, ROWS = [[0.62, 0.81], [0.81, 1.0]], RAIL = [0.955, 1.03];
  function setSurfaces(sf) { SURF = sf && sf.plank ? sf : null; bakes = {}; }
  /* The ship models (Colin, AD's sheets, docs/ships-rework.md step 12, 2026-10-22; assets/ships/<kind>/, copied whole from his
     out/ship_models/sheets): a hull design rendered at 32 headings, 2 px a unit, from 48.6 degrees so the ground falls where at() puts
     it and heights show at 0.819 as the figures'. back: the ship in its default look; front: a mask of what lies nearer the camera
     than the crew; tar, trim: the painted parts in grey, laid on in the vessel's colours with hard-light (grey 128 the colour itself)
     when a look is first drawn (composeOf, a few looks kept). The marks (J.marks, hull-local units: x to the bow, y to starboard, z up
     from the waterline): the seats, the tholes, the stems' heads, the rail's outline (the profile, the gangway, the hit box) and the
     waterline (the foam). The page loads the pictures and hands them over (setModel). Without them the hull is drawn as before. */
  var ART = {}, ARTC = [], ART_KEEP = 8;
  function setModel(kind, J, I) { ART[kind] = { J: J, I: I }; ARTC = ARTC.filter(function (q) { return q.kind !== kind; }); }
  function artOf(v) { var A = v && ART[v.kind]; return A && A.I && imgOk(A.I.back) && imgOk(A.I.front) ? A : null; }
  function composeShip(I, look) {          // Colin, AD's tools/ship_compose.js
    var W = I.back.width || I.back.naturalWidth, Hh = I.back.height || I.back.naturalHeight, back = mkCv(W, Hh), c = back.getContext('2d'), k, parts = ['tar', 'trim'];
    c.drawImage(I.back, 0, 0);
    for (k = 0; k < parts.length; k++) { var p = parts[k], col = look && look[p]; if (!imgOk(I[p]) || !col) continue;
      var t = mkCv(W, Hh), g = t.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, W, Hh); g.globalCompositeOperation = 'hard-light'; g.drawImage(I[p], 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(I[p], 0, 0); c.drawImage(t, 0, 0); }
    var front = mkCv(W, Hh), f = front.getContext('2d'); f.drawImage(back, 0, 0); f.globalCompositeOperation = 'destination-in'; f.drawImage(I.front, 0, 0);
    return { back: back, front: front };
  }
  function composeOf(v) {
    var A = artOf(v); if (!A) return null; var L = v.look || {}, tar = L.tar || LOOK.tar[0], trim = L.trim || LOOK.trim[0], key = v.kind + tar + trim, i;
    for (i = 0; i < ARTC.length; i++) if (ARTC[i].key === key) return ARTC[i].s;
    var s = composeShip(A.I, { tar: tar, trim: trim }); ARTC.push({ key: key, kind: v.kind, s: s }); if (ARTC.length > ART_KEEP) ARTC.shift(); return s;
  }
  function artFrame(c, sheet, J, h, x, y) { var n = J.headings, k = ((Math.round(h / (2 * Math.PI) * n) % n) + n) % n, fr = J.frames[k], s = 1 / J.px_unit; c.drawImage(sheet, fr[0], fr[1], fr[2], fr[3], x - fr[4] * s, y - fr[5] * s, fr[2] * s, fr[3] * s); }
  function markAt(J, p, h) { var ch = Math.cos(h), sh = Math.sin(h); return [p[0] * ch - p[1] * sh, (p[0] * sh + p[1] * ch) * (J.k_ground || K) - (p[2] || 0) * (J.z_screen || 0.8192)]; }
  function imgOk(im) { return !!im && (im.complete === undefined ? !!(im.width || im.naturalWidth) : (im.complete && im.naturalWidth > 0)); }
  function surfacesOn() { return !!(SURF && imgOk(SURF.plank) && imgOk(SURF.plankLit) && imgOk(SURF.rail)); }
  function litPort(h) { return 0.8 * Math.cos(h) - 0.6 * Math.sin(h) > 0; }   // the port side's outward normal faces the sun (upper left) at this heading
  function hullBake(kind, litSide, col) {
    col = col || COL; var key = kind + ':' + litSide + ':' + (col.tarA ? col.tar : '') + ':' + (col.trimA ? col.rail : ''); if (bakes[key]) return bakes[key];
    var H = HULLS[kind], pr = hullProfile(H), L = pr.L, W = pr.Wmax, bw = Math.ceil((2 * L + 24) * BK), bh = Math.ceil((2 * W + 24) * BK), cv = mkCv(bw, bh), c = cv.getContext('2d'), k, sd;
    c.setTransform(BK, 0, 0, BK, bw / 2, bh / 2); c.imageSmoothingEnabled = true;
    c.beginPath(); shapedPath(c, pr, 1, 1); c.fillStyle = col.hull; c.fill();
    var cells = []; for (k = 0; k < H.n; k++) cells.push([(k + 1 - pr.cx) * CW, (k + 2 - pr.cx) * CW]); cells[0][0] = -L; cells[cells.length - 1][1] = L;   // the end cells run out to the stems
    function band(sdn, f0, f1, x0, x1) { var m = 6, i, pts0 = [], pts1 = []; for (i = 0; i <= m; i++) { var x = x0 + (x1 - x0) * i / m, w = profW(pr, x, sdn); pts0.push([x, sdn * w * f0]); pts1.push([x, sdn * w * f1]); } c.beginPath(); c.moveTo(pts0[0][0], pts0[0][1]); for (i = 1; i <= m; i++) c.lineTo(pts0[i][0], pts0[i][1]); for (i = m; i >= 0; i--) c.lineTo(pts1[i][0], pts1[i][1]); c.closePath(); }
    [-1, 1].forEach(function (sdn) {
      var strip = sdn === litSide ? SURF.plankLit : SURF.plank;
      ROWS.forEach(function (row) { cells.forEach(function (cell) {
        var x0 = cell[0], x1 = cell[1], wm = (profW(pr, x0, sdn) + profW(pr, x1, sdn)) / 2, hgt = wm * (row[1] - row[0]); if (hgt < 0.4) return;
        c.save(); band(sdn, row[0], row[1], x0, x1); c.clip();
        c.translate(x0, sdn * wm * row[1]); c.scale((x1 - x0) / strip.width, sdn * hgt / strip.height); c.drawImage(strip, 0, 0); c.setTransform(BK, 0, 0, BK, bw / 2, bh / 2);
        if (col.tarA) { c.globalAlpha = col.tarA; c.fillStyle = col.tar; c.fillRect(x0 - 1, -W - 12, x1 - x0 + 2, 2 * W + 24); c.globalAlpha = 1; }   // the hull's tar over the studio's planks
        c.restore();   // the strip's top at the rail, its bottom toward the keel, on either side
      }); });
      cells.forEach(function (cell) {
        var x0 = cell[0], x1 = cell[1], wm = (profW(pr, x0, sdn) + profW(pr, x1, sdn)) / 2, hgt = wm * (RAIL[1] - RAIL[0]); if (hgt < 0.3) return;
        c.save(); band(sdn, RAIL[0], RAIL[1], x0, x1); c.clip(); c.translate(x0, sdn * wm * RAIL[1]); c.scale((x1 - x0) / SURF.rail.width, sdn * hgt / SURF.rail.height); c.drawImage(SURF.rail, 0, 0);
        if (col.trimA) { c.setTransform(BK, 0, 0, BK, bw / 2, bh / 2); c.globalAlpha = col.trimA; c.fillStyle = col.rail; c.fillRect(x0 - 1, -W - 12, x1 - x0 + 2, 2 * W + 24); }   // the trim painted along the rail
        c.restore();
      });
    });
    c.beginPath(); shapedPath(c, pr, 1, 1); c.lineJoin = 'round'; c.lineWidth = 1.2; c.strokeStyle = LINE; c.stroke();
    c.save(); c.translate(0.9, 1.1); c.beginPath(); shapedPath(c, pr, 1, 1); c.globalAlpha = 0.45; c.lineWidth = 1.9; c.stroke(); c.restore();   // the heavy side
    bakes[key] = { cv: cv, L: L, W: W, w: bw / BK, h: bh / BK }; return bakes[key];
  }
  var shPics = {};
  function shieldPic(col, n) {            // a painted shield, 20 units across, baked at 3 px a unit: n 0 whole, 1 halved, 2 quartered (with the other paint)
    var key = col[0] + col[1] + n; if (shPics[key]) return shPics[key]; var S = 3, R = 10, cv = mkCv(22 * S, 22 * S), c = cv.getContext('2d'), a;
    c.setTransform(S, 0, 0, S, 11 * S, 11 * S); c.lineJoin = 'round';
    c.beginPath(); c.arc(0, 0, R, 0, 7); c.fillStyle = col[0]; c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, R, 0, 7); c.clip(); c.fillStyle = col[1];
    if (n === 1) c.fillRect(0, -R, R, 2 * R); else if (n === 2) { c.fillRect(0, -R, R, R); c.fillRect(-R, 0, R, R); }
    c.strokeStyle = 'rgba(35,26,22,0.22)'; c.lineWidth = 0.5; for (a = -R; a <= R; a += 2.6) { c.beginPath(); c.moveTo(a, -R); c.lineTo(a + 0.6, R); c.stroke(); }   // the boards
    var g = c.createLinearGradient(-R, -R, R, R); g.addColorStop(0, 'rgba(255,240,205,0.28)'); g.addColorStop(0.55, 'rgba(255,240,205,0)'); g.addColorStop(1, 'rgba(30,40,80,0.3)'); c.fillStyle = g; c.fillRect(-R, -R, 2 * R, 2 * R);
    c.restore();
    c.beginPath(); c.arc(0, 0, R - 0.9, 0, 7); c.strokeStyle = shadeHex(col[0], -45); c.lineWidth = 1.3; c.stroke();   // the rim
    c.beginPath(); c.arc(0, 0, R, 0, 7); c.strokeStyle = LINE; c.lineWidth = 0.9; c.stroke();
    c.beginPath(); c.arc(0, 0, 2.6, 0, 7); c.fillStyle = COL.iron; c.fill(); c.strokeStyle = LINE; c.lineWidth = 0.7; c.stroke(); c.beginPath(); c.arc(-0.8, -0.8, 0.9, 0, 7); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fill();   // the boss
    shPics[key] = cv; return cv;
  }
  function shieldOf(v, i) { var L = v.look, A = L.shield || '#b23a2e', B = L.shield2 || A; return A === B ? shieldPic([A, A], 0) : (i % 2 ? shieldPic([B, A], 0) : shieldPic([A, B], 0)); }   // every other one in each paint, the Gokstad way
  function shieldFace(i) { var r = hs(i + 1, 3); return SURF.shields[r < 0.22 ? 6 + (hs(i + 1, 5) < 0.5 ? 0 : 1) : Math.floor(hs(i + 1, 7) * 6)]; }
  function drawShields(c, v, pr, L, which, bob) {   /* the shields hang on the hull's SIDES, upright, drawn after the hull and clipped to what lies outside its outline on screen: a shield on the side away from the camera shows its upper part above the far rail, one on the near side hangs whole below the near rail, and between (the flanks, a turn) each slides smoothly from the one to the other by how much its side faces the camera (Robin, 2026-10-21: a side jumped as the ship turned). which: 'front' draws them; 'back' is nothing now */
    if (which !== 'front') return;
    var faces = SURF && SURF.shields && SURF.shields.length >= 8 && SURF.shields.every(imgOk), SHC = ['#b08a5a', '#e6dcc6', '#8a6a44', '#8a4a3a'], sn = 0, roll = Math.sin((v.clock || 0) * 1.7 + 1) * 0.02, ch = Math.cos(v.h + roll), sh = Math.sin(v.h + roll), sx = v.x, sy0 = v.y * K + (bob || 0);
    c.save(); c.beginPath(); c.rect(sx - L * 2, sy0 - L * 2, L * 4, L * 4); c.save(); c.translate(sx, sy0); c.scale(1, K); c.rotate(v.h + roll); shapedPath(c, pr, 1, 1); c.restore(); c.clip('evenodd');   // outside the hull only
    for (var sx2 = -L * 0.74; sx2 <= L * 0.74; sx2 += 11) [-1, 1].forEach(function (sd) {
      var wy = sd * profW(pr, sx2, sd) * 1.02, i = sn++, ny = sd * ch, t = Math.max(0, Math.min(1, (ny + 0.35) / 0.7)), X = sx + sx2 * ch - wy * sh, Y = sy0 + (sx2 * sh + wy * ch) * K - 8 + 16 * t;
      if (v.look) { c.drawImage(shieldOf(v, i >> 1), X - 10, Y - 10, 20, 20); return; }   // (i >> 1: the two sides alike, shield by shield)
      if (faces) { c.drawImage(shieldFace(i), X - 10, Y - 10, 20, 20); return; }
      c.fillStyle = SHC[(i * 7) % 11 < 2 ? 3 : (i % 3)]; c.beginPath(); c.arc(X, Y, 10, 0, 7); c.fill(); c.strokeStyle = LINE; c.lineWidth = 0.9; c.stroke(); c.fillStyle = COL.iron; c.beginPath(); c.arc(X, Y, 2.2, 0, 7); c.fill(); });
    c.restore();
  }
  // How a vessel handles: the Sea Editor's handling sliders, as numbers per kind. steer 0 is Direct (hold a direction
  // and the hull turns to face it and goes), 1 is Tiller (W drives, S backs, A and D turn). top and accel in units a
  // second, turn in radians a second, glide how long it keeps moving after you let go, grip how firmly it follows its bow.
  // rowK: what each rower adds to the top speed and the acceleration (a longship's twenty-six add less each than a faering's four)
  /* (2026-10-22, docs/ships-rework.md, Robin: the rowboat crosses to the big island in about 90 s, about 7700 to 9700 units shore to
     shore on the game's map; a karve with a crew about half that: the rowboat's top 92, the karve's rowers 0.06 each) */
  var HANDLING = { raft: { steer: 1, top: 92, accel: 52, turn: 1.9, glide: 1.8, grip: 0.58 }, rowboat: { steer: 1, top: 92, accel: 52, turn: 1.9, glide: 1.8, grip: 0.58 }, faering: { steer: 1, top: 92, accel: 56, turn: 2.2, glide: 1.8, grip: 0.62, rowK: 0.1 }, boat: { steer: 1, top: 100, accel: 50, turn: 1.8, glide: 2.2, grip: 0.6, rowK: 0.08 },
    karve4: { steer: 1, top: 112, accel: 46, turn: 1.6, glide: 2.8, grip: 0.68, rowK: 0.07 }, karve8: { steer: 1, top: 114, accel: 44, turn: 1.45, glide: 3.0, grip: 0.7, rowK: 0.065 },
    karve: { steer: 1, top: 115, accel: 42, turn: 1.3, glide: 3.2, grip: 0.72, rowK: 0.06 },
    longship16: { steer: 1, top: 124, accel: 38, turn: 1.1, glide: 3.8, grip: 0.76, rowK: 0.035 }, longship20: { steer: 1, top: 126, accel: 36, turn: 1.0, glide: 4.0, grip: 0.78, rowK: 0.032 }, longship: { steer: 1, top: 128, accel: 34, turn: 0.9, glide: 4.2, grip: 0.8, rowK: 0.03 } };
  // The wind is a buff only (reward, never punishment): a sail with the wind behind it goes up to (1 + k) times the top speed, and a wind
  // ahead costs nothing. Each rower aboard (v.crew, capped by the seats) adds rowK to the top speed and the acceleration.
  var WIND = { k: 0.5, rowK: 0.07 };
  /* How full the sail is by where the wind comes from (2026-10-22, Robin: the wind a clear bonus): d is the angle between the heading and
     where the wind blows to: behind (0) full, abeam (a right angle) three quarters, close-hauled less, nothing from 150 degrees round */
  function sailFill(windA, h) { var d = Math.abs(wrapA(windA - h)); return d <= Math.PI / 2 ? 1 - 0.25 * d / (Math.PI / 2) : Math.max(0, 0.75 * (1 - (d - Math.PI / 2) / (Math.PI / 3))); }
  function wrapA(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
  // One step of sailing: v = { x, y, h, speed, vx, vy }, inp = { ix, iy } (-1..1 each), free(x, y, h) says whether the
  // hull fits there, H the handling. The same physics in the game and the Sea Editor.
  /* beach(x, y, h), when the page gives it, says the hull there touches only sand at its bow: the boat runs up the beach and stops
     there (v.beached), W pushes it no further, S backs it off into the water; rocks, cliffs and steep shores stop it and it slides
     along them, and a turn blocked by the land first edges off it (2026-10-22, docs/ships-rework.md, Robin: "run it up the beach";
     "rocks and cliffs stop you without sticking") */
  function nudged(v, free, h) { var a, k; for (k = 1; k <= 3; k++) for (a = 0; a < 6.283; a += 0.785) { var x = v.x + Math.cos(a) * 3 * k, y = v.y + Math.sin(a) * 3 * k; if (free(x, y, h)) { v.x = x; v.y = y; return true; } } return false; }
  function sail(v, inp, dt, free, H, wind, beach) {
    if (v.beached && free(v.x, v.y, v.h)) v.beached = 0;   // afloat again
    else if (!v.beached && beach && !free(v.x, v.y, v.h) && beach(v.x, v.y, v.h)) v.beached = 1;   // lying on a beach (a loaded game keeps no state: where she lies says it)
    var ix = inp.ix || 0, iy = inp.iy || 0, want = 0, stuck = !free(v.x, v.y, v.h) && !v.beached, h0 = v.h;
    if (v.speed == null) v.speed = 0;
    var FT = fitOf(v), crew = Math.min(Math.max(0, (v.crew || 0) - (v.helm ? 1 : 0)), v.rowers != null ? v.rowers : 99), rowK = (1 + (H.rowK != null ? H.rowK : (WIND.rowK || 0)) * crew) * (FT.oarK || 1), sailK = 1, fill = 0;   // (the helmsman does not row; oarK: a Raider's quicker stroke, a laden Cargo's slower)
    if (v.sail && wind && wind.k > 0) { fill = sailFill(wind.a, v.h); sailK = 1 + wind.k * (v.sailK || FT.sailK || 1) * fill; }      // the share of the wind that fills the sail (sailK: a Voyager's better sail)
    v.sailFill += ((iy < 0 || (!H.steer && (ix || iy)) ? fill : 0) - (v.sailFill || 0)) * Math.min(1, dt * 2); if (!(v.sailFill > 0)) v.sailFill = 0;   /* (the true fill: the speed's buff, and whether the oars rest) */
    v.sailSet = (v.sailSet || 0) + ((v.sail && (iy < 0 || (!H.steer && (ix || iy)) || Math.abs(v.speed) > 20) ? 1 : 0) - (v.sailSet || 0)) * Math.min(1, dt * 1.5);   /* (Robin, 2026-10-21: the sail furling whenever the wind was not behind read as random; now it is SET while she is driven and furled at rest, its belly by the wind) */   // the sail fills as it is set and the wind comes behind
    v.rud = (v.rud || 0) + (ix - (v.rud || 0)) * Math.min(1, dt * 6);                                                                          // the steering oar follows the tiller
    H = { steer: H.steer, top: H.top * rowK * sailK, accel: H.accel * rowK * (1 + (sailK - 1) * 0.5), turn: H.turn, glide: H.glide, grip: H.grip };
    if (!H.steer) {
      if (ix || iy) {
        var target = Math.atan2(iy, ix), diff = wrapA(target - v.h), stepA = H.turn * dt;
        var nh = Math.abs(diff) <= stepA ? target : v.h + (diff > 0 ? stepA : -stepA);
        if (stuck || free(v.x, v.y, nh)) v.h = nh;
        want = H.top * Math.max(0.25, Math.cos(Math.min(1.4, Math.abs(diff))));   // ease off while the bow swings round
      }
    } else {
      want = iy < 0 ? (v.beached ? 0 : H.top) : (iy > 0 ? -H.top * 0.4 : 0);
      var wayK = Math.max(0.28, Math.min(1, Math.abs(v.speed) / (H.top * 0.35))), nh2 = v.h + ix * H.turn * dt * wayK * (v.speed < -2 ? -1 : 1);   // (a little turn with no way on: the oars turn her)
      if (!v.beached) { if (stuck || free(v.x, v.y, nh2)) v.h = nh2; else if (ix && nudged(v, free, nh2)) v.h = nh2; }
      else if (ix && (free(v.x, v.y, nh2) || (beach && beach(v.x, v.y, nh2)))) v.h = nh2;   // beached, she pivots slowly on her bow where the sand lets her (never caught with sand at both ends)
    }
    if (want !== 0) { var up = H.accel * dt; v.speed += Math.max(-up, Math.min(up, want - v.speed)); }
    else v.speed *= Math.exp(-dt / H.glide);
    var tvx = Math.cos(v.h) * v.speed, tvy = Math.sin(v.h) * v.speed, g = Math.min(1, dt * (1 + H.grip * 11));
    v.vx += (tvx - v.vx) * g; v.vy += (tvy - v.vy) * g;
    var nx = v.x + v.vx * dt, ny = v.y + v.vy * dt;
    var fw = v.speed > 0.5;
    if (stuck || free(nx, ny, v.h)) { v.x = nx; v.y = ny; }
    else if (beach && (fw || v.beached) && beach(nx, ny, v.h)) { v.x = nx; v.y = ny; v.beached = 1; if (fw) { var dk = Math.exp(-dt * 6); v.speed *= dk; v.vx *= dk; v.vy *= dk; if (Math.abs(v.speed) < 4) { v.speed = 0; v.vx = v.vy = 0; } } }   // up the sand: she slows and stops (backing off, she just moves)
    else if (v.beached && fw) { v.speed = 0; v.vx = v.vy = 0; }                                                     // beached: no further
    else if (free(nx, v.y, v.h)) { v.x = nx; v.vy *= 0.5; v.speed *= 0.96; }                                       // along the shore
    else if (free(v.x, ny, v.h)) { v.y = ny; v.vx *= 0.5; v.speed *= 0.96; }
    else { var vm = Math.hypot(v.vx, v.vy), a2, done = false;                                                       // against rock: slide along it, not stop dead
      for (a2 = 0.4; a2 <= 1.2 && !done && vm > 1; a2 += 0.4) [1, -1].forEach(function (sd) { if (done) return; var va = Math.atan2(v.vy, v.vx) + sd * a2, sx = v.x + Math.cos(va) * vm * Math.cos(a2) * dt, sy = v.y + Math.sin(va) * vm * Math.cos(a2) * dt; if (free(sx, sy, v.h)) { v.x = sx; v.y = sy; done = true; } });
      v.vx *= 0.6; v.vy *= 0.6; v.speed *= done ? 0.85 : 0.6; }
    v.h = wrapA(v.h);
    v.turn = wrapA(v.h - h0) / Math.max(1e-4, dt);                                                                           // the rate of turn, for the water (radians a second)
    if (!v.trail) v.trail = []; v.trailT = (v.trailT || 0) + dt; if (v.trailT > 0.12) { v.trailT = 0; v.trail.push({ x: v.x, y: v.y, age: 0, sp: Math.abs(v.speed) }); if (v.trail.length > 18) v.trail.shift(); }
    for (var ti = 0; ti < v.trail.length; ti++) v.trail[ti].age += dt;
    v.rowing = (crew > 0 || !rigged(v.kind)) && (iy < 0 || Math.abs(v.speed) > 8) && !(v.sailFill > 0.6);   // (alone in a rowing boat the hero rows)                                           // the oars pull while there is way to make and the sail is not doing the work; else they are shipped
    if (v.rowing) v.stroke = (v.stroke || 0) + dt * (2 * Math.PI / 1.7) * (0.4 + 0.6 * Math.min(1, Math.abs(v.speed) / (H.top || 1)));   // one stroke for the whole ship: every rower in time, quicker with the way on (docs/ships-plan.md)
    return stuck;
  }
  // the water round a hull: a thin line of foam hugging it, and when it moves a wake of ripples trailing from the stern
  function drawWater(c, v, hl, hw, clock, pr) {
    var sp = speedOf(v), mv = Math.min(1, sp / 60), i;
    c.save(); c.translate(v.x, v.y * K);
    if (v.trail && v.trail.length > 1) {                    // the wake: ripples laid along the track she has sailed (it curves in a turn: Robin, 2026-10-21), spreading and fading as they age
      for (i = 0; i < v.trail.length - 1; i++) { var p = v.trail[i], q = v.trail[i + 1], age = p.age, k = Math.min(1, p.sp / 60); if (age > 2.4 || k < 0.08) continue;
        var dx = q.x - p.x, dy = q.y - p.y, ang = Math.atan2(dy, dx), t = age / 2.4, a = (1 - t) * 0.42 * k, w = hw * K * (0.5 + t * 1.8);
        c.strokeStyle = 'rgba(235,250,255,' + a.toFixed(2) + ')'; c.lineWidth = 1.2 + (1 - t); c.beginPath(); c.ellipse(p.x - v.x, (p.y - v.y) * K, 3 + t * 7, w, ang, 0, 7); c.stroke(); }
    }
    var tr = Math.abs(v.turn || 0) * mv; if (tr > 0.12) {    // turning with way on: the water piles and breaks white along the outer side, bow to quarter
      var sd = (v.turn || 0) < 0 ? 1 : -1, ta = Math.min(1, (tr - 0.12) / 0.6), ch = Math.cos(v.h), sh = Math.sin(v.h), n = 7 + Math.round(ta * 6);
      c.strokeStyle = 'rgba(240,250,255,' + (0.35 + ta * 0.4).toFixed(2) + ')'; c.lineCap = 'round';
      for (i = 0; i < n; i++) { var x = hl * (0.75 - 1.1 * i / n), wy = (pr ? profW(pr, x, sd) : hw) * 1.02 + 2 + hs(i, 5) * 3, lx = x + (hs(i, 7) - 0.5) * 6, ly = sd * wy, L = (4 + hs(i, 3) * 6) * (0.5 + ta), wob = Math.sin(clock * 9 + i) * 1.2;
        c.lineWidth = 0.9 + ta * 0.6; c.beginPath(); c.moveTo((lx - L / 2) * ch - ly * sh, ((lx - L / 2) * sh + ly * ch) * K + wob); c.quadraticCurveTo(lx * ch - (ly + sd * 3) * sh, (lx * sh + (ly + sd * 3) * ch) * K + wob, (lx + L / 2) * ch - ly * sh, ((lx + L / 2) * sh + ly * ch) * K + wob); c.stroke(); }
    }
    c.scale(1, K); c.rotate(v.h);
    c.strokeStyle = 'rgba(235,250,255,' + (0.3 + 0.25 * mv).toFixed(2) + ')'; c.lineWidth = 2.2; c.beginPath(); if (pr && pr.wl) { var wpr = { ol: pr.wl, L: pr.wl[pr.wl.length - 1][0], n: pr.wl.length * 2 }, wmx = Math.max.apply(null, pr.wl.map(function (q) { return q[1]; })); shapedPath(c, wpr, (wpr.L + 3) / wpr.L, (wmx + 2) / wmx); } else if (pr) shapedPath(c, pr, (hl + 5) / hl, (hw * 1.15 + 3) / hw); else { c.moveTo(-hl - 5, 0); c.quadraticCurveTo(0, -(hw * 1.15 + 3) * 1.9, hl + 5, 0); c.quadraticCurveTo(0, (hw * 1.15 + 3) * 1.9, -hl - 5, 0); } c.stroke();   // foam at the waterline
    c.restore();
  }
  function bobOf(v, clock) { return Math.sin(clock * 2 + v.x * 0.01) * 0.8; }
  function drawVessel(c, v, clock, o) {                     // the vessel as it was laid in the yard, on the water. o.split: the hull alone (the page draws the crew, then drawRigOf, drawVesselFront and drawOars in its own order; docs/ships-plan.md step 2, 2026-10-21)
    var bob = bobOf(v, clock), parts = v.parts && v.parts.length ? v.parts : RAFT_DEFAULT;
    if (HULLS[v.kind]) { drawBoat(c, v, parts, bob, clock, o || {}); return; }
    var logs = parts.filter(function (p) { return p.id === 'log'; }), minI = 1e9, maxI = -1e9, minJ = 1e9, maxJ = -1e9;
    logs.forEach(function (p) { minI = Math.min(minI, p.i); maxI = Math.max(maxI, p.i + 2); minJ = Math.min(minJ, p.j); maxJ = Math.max(maxJ, p.j + 1); });
    var cx = (minI + maxI) / 2, cy = (minJ + maxJ) / 2, hw = (maxI - minI) / 2 * CW + 4, hh = (maxJ - minJ) / 2 * CH + 4;
    drawWater(c, v, hw, hh * 0.55, clock);
    c.save(); c.translate(v.x, v.y * K + bob);
    c.scale(1, K); c.rotate(v.h);
    c.fillStyle = 'rgba(10,30,50,0.28)'; c.beginPath(); c.ellipse(1, 3, hw + 2, hh + 6, 0, 0, 7); c.fill();
    c.lineJoin = 'round'; c.lineCap = 'round';
    logs.slice().sort(function (p, q) { return p.j - q.j; }).forEach(function (p) {
      var x0 = (p.i - cx) * CW, oy = (p.j + 0.5 - cy) * CH, len = 2 * CW - 2, tone = ((p.i * 7 + p.j * 13) % 5) / 5 - 0.5;
      ink(c, [[x0 + 1, oy - 3.4], [x0 + len - 1, oy - 3.6], [x0 + len - 1, oy + 3.6], [x0 + 1, oy + 3.4]], mix('#7a5a40', tone > 0 ? '#ffffff' : '#000000', Math.abs(tone) * 0.2), { wob: 0.7, seed: p.i * 3 + p.j, lw: 0.8, heavy: 1.6 });
      stroke(c, [[x0 + 4, oy - 1.8], [x0 + len - 6, oy - 2]], INK.lit, 0.8); stroke(c, [[x0 + 6, oy + 1.2], [x0 + len - 8, oy + 1.5]], INK.faint, 0.5);
      logEnd(c, x0 + len, oy, 1.8, 3.2, '#c9ab7a');
    });
    parts.forEach(function (p) {
      var x0 = (p.i + 0.5 - cx) * CW, oy = (p.j + 0.5 - cy) * CH, k;
      if (p.id === 'lash') { for (k = 0; k < 3; k++) { var ly = oy - 3.6 + k * 2.6; stroke(c, [[x0 - 1.6, ly], [x0 + 1.6, ly + 1.8]], INK.line, 2.2); stroke(c, [[x0 - 1.6, ly], [x0 + 1.6, ly + 1.8]], COL.rope, 1.3); } }
      else if (p.id === 'plank') { ink(c, rect(x0 - 10, oy - 2.6, 20, 5.2), COL.deck, { wob: 0.4, seed: p.i + p.j * 5, lw: 0.7, heavy: 1.2 }); stroke(c, [[x0 - 8, oy + 0.2], [x0 + 8, oy - 0.1]], INK.faint, 0.45); }
    });
    drawOar(c, hw - 16, hh - 4, 0.5);
    c.restore();
  }
  // the hull's shape follows the strakes: at every keel column the side is as wide as the strakes laid there, each side on
  // its own, smoothed a little so one strake makes a swell rather than a step; the keel's length sets the length
  var ROW = CH * 0.85 * 0.6;
  function hullProfile(H, kind) {          // a design's profile: the half-width of every column from its beam and the shape, the same on both sides (with a model, its rail's outline: ol)
    var A = kind && ART[kind], M = A && A.J && A.J.marks;
    if (M && M.outline && M.outline.length > 2) { var ol = M.outline.map(function (q) { return [q[0], q[1]]; }), wl = (M.waterline || []).map(function (q) { return [q[0], q[1]]; }), Lm = ol[ol.length - 1][0], Wm = Math.max.apply(null, ol.map(function (q) { return q[1]; })); return { L: Lm, n: ol.length, cx: 0, top: [], bot: [], Wmax: Wm, keelJ: KJ, ol: ol, wl: wl.length > 2 ? wl : null, model: true }; }
    var top = [], k, Wh = (H.beam || 2) * U / 2; for (k = 0; k < H.n; k++) top.push(Wh * (0.22 + 0.78 * shapeK(k, H.n)));   // (the half-beam in units, full amidships, drawing in to the stems)
    var L = H.n * CW / 2 + 8, cx = H.n / 2 + 1, Wmax = Math.max.apply(null, top);
    return { L: L, n: H.n, cx: cx, top: top, bot: top.slice(), Wmax: Wmax, keelJ: KJ };
  }
  function profileOf(v) { var H = HULLS[v.kind]; return H ? hullProfile(H, v.kind) : boatProfile(v.parts && v.parts.length ? v.parts : RAFT_DEFAULT); }
  function hullCol(v) { return colOf(v).hull; }
  /* A vessel's colours from its look (docs/ships-rework.md step 7, Robin: the sail's colours and stripes, the shields' paint, the
     hull's tar and trim, the figurehead): the tar laid over the planks at TAR_A, the trim over the rail at TRIM_A, the first of each
     the hull as built. */
  var TAR_A = 0.45, TRIM_A = 0.55;
  function colOf(v) {
    var L = v && v.look; if (!L) return COL; var key = L.tar + L.trim + L.sailA + L.sailB; if (L._c && L._k === key) return L._c;
    var tarA = L.tar && L.tar !== LOOK.tar[0] ? TAR_A : 0, trimA = L.trim && L.trim !== LOOK.trim[0] ? TRIM_A : 0, o = {}, k;
    for (k in COL) o[k] = COL[k];
    o.hull = tarA ? mix(COL.hull, L.tar, tarA) : COL.hull; o.rail = trimA ? L.trim : null; o.sail = L.sailA || COL.sail; o.sail2 = L.sailB || COL.trim; o.trim = o.sail2;
    o.tar = L.tar; o.tarA = tarA; o.trimA = trimA;
    Object.defineProperty(L, '_c', { value: o, enumerable: false, writable: true, configurable: true }); Object.defineProperty(L, '_k', { value: key, enumerable: false, writable: true, configurable: true });
    return o;
  }
  function boatProfile(parts) {
    var keel = parts.filter(function (p) { return p.id === 'keel'; }), st = parts.filter(function (p) { return p.id === 'strake'; });
    if (!keel.length) { var hull = hullCells(parts), mi = 1e9, ma = -1e9; hull.forEach(function (p) { mi = Math.min(mi, p.i); ma = Math.max(ma, p.i + 1); }); keel = hull.length ? [{ i: mi, j: hull[0].j }] : [{ i: 0, j: 0 }]; }
    var j0 = keel[0].j, i0 = Math.min.apply(null, keel.map(function (p) { return p.i; })), i1 = Math.max.apply(null, keel.map(function (p) { return p.i; })), n = i1 - i0 + 1, k;
    var top = [], bot = [];
    for (k = 0; k < n; k++) { var nt = 0, nb = 0; st.forEach(function (p) { if (p.i === i0 + k) { if (p.j < j0) nt++; else if (p.j > j0) nb++; } }); top.push(3 + (1 + nt) * ROW * 0.9); bot.push(3 + (1 + nb) * ROW * 0.9); }
    function smooth(w) { var o = []; for (k = 0; k < n; k++) { var a = w[Math.max(0, k - 1)], b2 = w[k], c2 = w[Math.min(n - 1, k + 1)]; o.push((a + 2 * b2 + c2) / 4); } return o; }
    top = smooth(top); bot = smooth(bot);
    var L = n * CW / 2 + 8, cx = (i0 + i1 + 1) / 2, Wmax = Math.max.apply(null, top.concat(bot));
    return { L: L, n: n, cx: cx, top: top, bot: bot, Wmax: Wmax, keelJ: j0 };
  }
  function profW(pr, x, side) {              // the half-width at x along the hull (bow at +L), on one side, 0 at the ends
    if (pr.ol) return olW(pr.ol, x);
    var u = (x + pr.L) / (2 * pr.L) * pr.n - 0.5, k = Math.max(0, Math.min(pr.n - 1, Math.floor(u))), t = Math.max(0, Math.min(1, u - k)), arr = side < 0 ? pr.top : pr.bot;
    var w = arr[k] + (arr[Math.min(pr.n - 1, k + 1)] - arr[k]) * t, taper = 1 - Math.pow(Math.abs(x) / pr.L, 3);   // the ends draw in to the stems
    return Math.max(0, w * Math.max(0, taper));
  }
  function olW(ol, x) { if (x <= ol[0][0] || x >= ol[ol.length - 1][0]) return 0; for (var i = 1; i < ol.length; i++) if (x <= ol[i][0]) { var a = ol[i - 1], b = ol[i], t = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; } return 0; }   // a marks' outline, read along the keel
  function shapedPath(c, pr, sx, sw) {       // the hull outline through the profile, scaled along (sx) and across (sw)
    var L = pr.L * sx, pts = [], k, m = pr.n * 2 + 1;
    pts.push([-L, 0]); for (k = 1; k < m; k++) { var x = -L + 2 * L * k / m; pts.push([x, -profW(pr, x / sx, -1) * sw]); } pts.push([L, 0]);
    for (k = m - 1; k >= 1; k--) { var x2 = -L + 2 * L * k / m; pts.push([x2, profW(pr, x2 / sx, 1) * sw]); }
    c.moveTo(pts[0][0], pts[0][1]);
    for (k = 1; k < pts.length - 1; k++) { var mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2; c.quadraticCurveTo(pts[k][0], pts[k][1], mx, my); }
    c.quadraticCurveTo(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1]); c.closePath();
  }
  // a clinker boat in the look of the Sea Editor's ships: the karve without its sail (a mast and sail come later)
  function drawBoat(c, v, parts, bob, clock, o) {
    var MS = composeOf(v); if (MS) { drawModel(c, v, MS, bob, clock, o); return; }
    var pr = profileOf(v), L = pr.L, W = pr.Wmax, sz = Math.max(0.7, Math.min(1.2, L / 60)), ds = Math.max(0.8, L / 110), col = colOf(v), h = v.h, i, H = HULLS[v.kind];   // (ds: the stems, the head, the rig and the oars grow with the hull; sz the line weights)
    var sx = v.x, sy = v.y * K + bob, roll = Math.sin(clock * 1.7 + 1) * 0.02, mv = Math.min(1, speedOf(v) / 60);
    var seats = parts.filter(function (p) { return p.id === 'thwart'; }).map(function (p) { return (p.i + 0.5 - pr.cx) * CW; });
    drawWater(c, v, L, W, clock, pr);
    function inFrame(dy, fn) { c.save(); c.translate(sx, sy + dy); c.scale(1, K); c.rotate(h + roll); fn(); c.restore(); }
    function fillStroke(fill, lw) { c.fillStyle = fill; c.fill(); c.lineWidth = lw || 1.6; c.strokeStyle = LINE; c.lineJoin = 'round'; c.stroke(); }
    var box = [-L - 12, -W - 12, 2 * L + 24, 2 * W + 24];
    /* the hull's shadow on the water (Robin, 2026-10-21: the blob under a turned ship looked weird and unnatural; it was an ellipse that
       never turned with her): the hull's own outline turned with the heading, thrown a little to the lower right by the sun, the sea's
       own colour darker and bluer, soft at its edge from three fills, and still on the water while she bobs */
    c.save(); c.translate(sx + 3, v.y * K + 2 + 2.5 * ds); c.scale(1, K); c.rotate(h); c.fillStyle = 'rgb(18,42,64)';
    [[1.14, 1.75, 0.07], [1.07, 1.38, 0.1], [1.0, 1.08, 0.17]].forEach(function (q) { c.globalAlpha = q[2]; c.beginPath(); shapedPath(c, pr, q[0], q[1]); c.fill(); });
    c.restore();
    v.clock = clock;
    inFrame(3 + 2.5 * ds, function () { inkPath(c, shadeHex(col.hull, -30), { box: box, flat: true, lw: 1.2 }, function () { shapedPath(c, pr, 1, 1); }); });   // the hull's depth below the rail
    var baked = surfacesOn() && H ? hullBake(v.kind, litPort(h) ? -1 : 1, col) : null;
    inFrame(0, function () {
      if (baked) c.drawImage(baked.cv, -baked.w / 2, -baked.h / 2, baked.w, baked.h);   // the studio's planks and rail, the lit side toward the sun
      else { inkPath(c, col.hull, { box: box, lw: 1.2 }, function () { shapedPath(c, pr, 1, 1); });
      [0.95, 0.9].forEach(function (k, n) { c.beginPath(); shapedPath(c, pr, k, 0.9 - n * 0.12); c.lineWidth = 0.7; c.strokeStyle = INK.faint; c.stroke(); });   // the strakes, overlapping toward the rail
      c.beginPath(); shapedPath(c, pr, 0.92, 0.95); c.lineWidth = 0.9; c.strokeStyle = INK.lit; c.stroke(); }
      inkPath(c, col.deck, { box: box, lw: 0.9, shade: 0.1 }, function () { shapedPath(c, pr, 0.84, 0.62); });   // the bottom boards
      for (var bi = -2; bi <= 2; bi++) { c.beginPath(); c.moveTo(-L * 0.8, bi * W * 0.12); c.lineTo(L * 0.8, bi * W * 0.12 + 0.3); c.lineWidth = 0.5; c.strokeStyle = INK.faint; c.save(); c.beginPath(); shapedPath(c, pr, 0.84, 0.62); c.clip(); c.beginPath(); c.moveTo(-L * 0.8, bi * W * 0.12); c.lineTo(L * 0.8, bi * W * 0.12 + 0.3); c.stroke(); c.restore(); }
      seats.forEach(function (x, si) { var wt = profW(pr, x, -1) * 0.6, wb = profW(pr, x, 1) * 0.6; ink(c, [[x - 3, -wt], [x + 3, -wt], [x + 3, wb], [x - 3, wb]], shadeHex(col.deck, -16), { wob: 0.3, seed: si, lw: 0.7, heavy: 1.1 }); });   // the rowing seats as laid: a thwart across the hull
      if (false) { var SHC = ['#8a3a34', '#d9c48a', '#3f5a7a'], sn = 0; for (var sx2 = -L * 0.74; sx2 <= L * 0.74; sx2 += 11) [-1, 1].forEach(function (sd) { var wy = profW(pr, sx2, sd) * 0.98; c.fillStyle = SHC[sn++ % 3]; c.beginPath(); c.ellipse(sx2, sd * wy, 9.5, 7, 0, 0, 7); c.fill(); c.strokeStyle = LINE; c.lineWidth = 0.7; c.stroke(); c.fillStyle = COL.iron; c.beginPath(); c.ellipse(sx2, sd * wy, 1.1 * sz, 0.7 * sz, 0, 0, 7); c.fill(); }); }   // shields hung along both rails, seen from above as leaning discs
    });
    var fx = Math.cos(h), fy = Math.sin(h) * K;                                                          // the upright stems, curling at bow and stern
    function at(lx, ly) { var cs = Math.cos(h + roll), sn = Math.sin(h + roll); return [sx + lx * cs - ly * sn, sy + (lx * sn + ly * cs) * K]; }   // (with the roll, as the hull: the stems swayed loose of it, Robin 2026-10-21)
    function curve(p0, p1, p2, w, fill) { c.lineCap = 'round'; c.strokeStyle = LINE; c.lineWidth = w + 2; c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); c.stroke(); c.strokeStyle = fill; c.lineWidth = w; c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); c.stroke(); }
    function stem(lx, dir, hgt) {
      var p = at(lx, 0), tip = [p[0] + fx * dir * 7 * ds, p[1] + fy * dir * 7 * ds - hgt], w = 2.4 + 1.2 * ds, wood = shadeHex(col.hull, -8);
      curve(p, [p[0] - fx * dir * 1.5 * ds, p[1] - hgt * 0.6], tip, w, wood);
      curve(tip, [tip[0] + fx * dir * 3.5 * ds, tip[1] - 3 * ds], [tip[0] + fx * dir * 1.5 * ds, tip[1] + 2.4 * ds], w * 0.55, wood);
    }
    if (v.shields && !o.split) drawShields(c, v, pr, L, 'front', bob);
    stem(-L * 0.96, -1, 20 * ds);
    var head = v.dragon ? (v.look && v.look.head && v.look.head !== 'curl' ? v.look.head : 'dragon') : 'curl';
    if (head === 'snake' || head === 'bear') drawHead(c, head, at(L * 0.96, 0), fx, fy, ds, shadeHex(col.hull, -10), col, curve);
    else if (head === 'dragon') {                                                                      // the dragon stem at the bow: a neck rising forward, a head with its jaw open, an eye, a tongue
      var bp = at(L * 0.96, 0), nk = [bp[0] + fx * 9 * ds, bp[1] + fy * 9 * ds - 16 * ds], hd = [nk[0] + fx * 5 * ds, nk[1] + fy * 5 * ds - 3 * ds], wood2 = shadeHex(col.hull, -10);
      curve(bp, [bp[0] - fx * 1 * ds, bp[1] - 10 * ds], nk, 3.4 * ds, wood2);
      c.fillStyle = wood2; c.strokeStyle = LINE; c.lineWidth = 1; c.beginPath(); c.moveTo(nk[0] - fx * 2 * ds, nk[1] + 1 * ds); c.lineTo(nk[0] + fx * 1 * ds, nk[1] - 4 * ds); c.lineTo(hd[0] + fx * 3 * ds, hd[1] - 1.5 * ds); c.lineTo(hd[0] + fx * 2.5 * ds, hd[1] + 1.5 * ds); c.lineTo(hd[0] - fx * 1 * ds, hd[1] + 2.5 * ds); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#f1e3b8'; c.beginPath(); c.arc(nk[0] + fx * 1.5 * ds, nk[1] - 1.6 * ds, 0.8 * ds, 0, 7); c.fill(); c.strokeStyle = '#8a3a34'; c.lineWidth = 1.1 * ds; c.beginPath(); c.moveTo(hd[0] + fx * 2.8 * ds, hd[1]); c.lineTo(hd[0] + fx * 5.5 * ds, hd[1] + 1.5 * ds); c.stroke();
    } else stem(L * 0.96, 1, 22 * ds);
    if (o.split) return;
    var rw = [], pl = crewPlaces(v, v.crew || 0); pl.forEach(function (q) { if (q.kind === 'row') rw.push({ x: q.x, y: q.y, side: q.side }); });   // a whole drawing (the Sea Editor, the render checks): the oars at the crew's places
    if (!pl.length && v.aboard && !H.mast) rw.push({ x: heroSeat(v), y: 0, side: 0 });
    drawOars(c, v, clock, rw);
    if (H && H.mast) drawRig(c, v, pr, ds, bob, clock, at, curve);
  }
  /* The other heads on the stem (the look's figurehead; mine, 2026-10-22, until Colin, AD's models carry them): the snake, a long
     slim neck in an S rising forward to a small flat head with an eye and a forked tongue; the bear, a thick neck to a blunt head with
     two round ears, a short snout and an eye. Drawn in screen space along the bow's direction (fx, fy), as the dragon is. */
  function drawHead(c, kind, bp, fx, fy, ds, wood, col, curve) {
    c.lineJoin = 'round'; c.strokeStyle = LINE;
    if (kind === 'snake') {
      var n1 = [bp[0] + fx * 4 * ds, bp[1] + fy * 4 * ds - 11 * ds], n2 = [bp[0] + fx * 10 * ds, bp[1] + fy * 10 * ds - 19 * ds], hd = [n2[0] + fx * 4 * ds, n2[1] + fy * 4 * ds + 1 * ds];
      curve(bp, [bp[0] + fx * 3 * ds, bp[1] - 5 * ds], n1, 2.6 * ds, wood); curve(n1, [n1[0] - fx * 1.5 * ds, n1[1] - 6 * ds], n2, 2.2 * ds, wood);
      c.fillStyle = wood; c.strokeStyle = LINE; c.lineWidth = 1; c.beginPath(); c.moveTo(n2[0] - fx * 1.5 * ds, n2[1] - 1.4 * ds); c.quadraticCurveTo(hd[0], hd[1] - 2.2 * ds, hd[0] + fx * 2.4 * ds, hd[1] + 0.2 * ds); c.quadraticCurveTo(hd[0], hd[1] + 1.8 * ds, n2[0] - fx * 1 * ds, n2[1] + 1.4 * ds); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#f1e3b8'; c.beginPath(); c.arc(hd[0] - fx * 0.6 * ds, hd[1] - 0.8 * ds, 0.6 * ds, 0, 7); c.fill();
      c.strokeStyle = '#8a3a34'; c.lineWidth = 0.7 * ds; var tq = [hd[0] + fx * 2.4 * ds, hd[1] + 0.3 * ds], tt = [tq[0] + fx * 2.6 * ds, tq[1] + 0.6 * ds]; c.beginPath(); c.moveTo(tq[0], tq[1]); c.lineTo(tt[0], tt[1]); c.lineTo(tt[0] + fx * 1 * ds, tt[1] - 0.9 * ds); c.moveTo(tt[0], tt[1]); c.lineTo(tt[0] + fx * 1 * ds, tt[1] + 1 * ds); c.stroke();
      return;
    }
    var nk = [bp[0] + fx * 7 * ds, bp[1] + fy * 7 * ds - 14 * ds], hd2 = [nk[0] + fx * 3.5 * ds, nk[1] + fy * 3.5 * ds - 1 * ds];   // the bear
    curve(bp, [bp[0] - fx * 0.5 * ds, bp[1] - 8 * ds], nk, 4.2 * ds, wood);
    c.fillStyle = wood; c.strokeStyle = LINE; c.lineWidth = 1;
    [-1.6, 1.2].forEach(function (e) { c.beginPath(); c.arc(nk[0] + fx * e * ds, nk[1] - 3.6 * ds, 1.4 * ds, 0, 7); c.fill(); c.stroke(); });   // the ears
    c.beginPath(); c.ellipse(nk[0] + fx * 1 * ds, nk[1] - 0.6 * ds, 3.6 * ds, 3 * ds, 0, 0, 7); c.fill(); c.stroke();   // the head
    c.beginPath(); c.ellipse(hd2[0] + fx * 1.6 * ds, hd2[1] + 0.8 * ds, 2.2 * ds, 1.6 * ds, 0, 0, 7); c.fillStyle = shadeHex(wood, 12); c.fill(); c.stroke();   // the snout
    c.fillStyle = LINE; c.beginPath(); c.arc(hd2[0] + fx * 3.4 * ds, hd2[1] + 0.4 * ds, 0.6 * ds, 0, 7); c.fill();   // the nose
    c.fillStyle = '#f1e3b8'; c.beginPath(); c.arc(nk[0] + fx * 1.8 * ds, nk[1] - 1.4 * ds, 0.65 * ds, 0, 7); c.fill();   // the eye
  }
  function drawModel(c, v, MS, bob, clock, o) {   // a model's ship: the shadow and the water (from the marks), the composed back; whole, the front and the oars too
    var A = artOf(v), J = A.J, pr = profileOf(v), L = pr.L, W = pr.Wmax, h = v.h, H = HULLS[v.kind];
    c.save(); c.translate(v.x + 3, v.y * K + 3); c.scale(1, K); c.rotate(h); c.fillStyle = 'rgb(18,42,64)';
    [[1.14, 1.75, 0.07], [1.07, 1.38, 0.1], [1.0, 1.08, 0.17]].forEach(function (q) { c.globalAlpha = q[2]; c.beginPath(); shapedPath(c, pr, q[0], q[1]); c.fill(); });   // the shadow on the water, the rail's outline turned with her
    c.restore();
    v.clock = clock; drawWater(c, v, L, W, clock, pr);
    artFrame(c, MS.back, J, h, v.x, v.y * K + bob);
    if (o.split) return;
    artFrame(c, MS.front, J, h, v.x, v.y * K + bob);
    var rw = [], pl = crewPlaces(v, v.crew || 0); pl.forEach(function (q) { if (q.kind === 'row') rw.push({ x: q.x, y: q.y, side: q.side }); });
    if (!pl.length && v.aboard && !H.mast) rw.push({ x: heroSeat(v), y: 0, side: 0 });
    drawOars(c, v, clock, rw);
  }
  function masthead(v, clock) {           // where the masthead is on screen (null without a mast): for the pennant
    var H = HULLS[v.kind]; if (!H || !H.mast || v.mastX == null || !parts0(v, 'mast')) return null; var pr = profileOf(v), L = pr.L, bob = bobOf(v, clock), h = v.h + Math.sin(clock * 1.7 + 1) * 0.02;
    return [v.x + v.mastX * Math.cos(h), v.y * K + bob + v.mastX * Math.sin(h) * K - L * 0.84];
  }
  function stemPoint(v) { var pr = profileOf(v), L = pr.L; return [v.x + Math.cos(v.h) * L * 0.96, v.y + Math.sin(v.h) * L * 0.96]; }   // the bow's foot, in the world
  function drawRigOf(c, v, clock) {        // the mast, the yard, the sail and the steering oar, drawn apart (over the men behind the mast, under those before it)
    var H = HULLS[v.kind]; if (!H || !H.mast) return; var pr = profileOf(v), L = pr.L, ds = Math.max(0.8, L / 110), bob = bobOf(v, clock), sx = v.x, sy = v.y * K + bob, h = v.h + Math.sin(clock * 1.7 + 1) * 0.02;
    function at(lx, ly) { var cs = Math.cos(h), sn = Math.sin(h); return [sx + lx * cs - ly * sn, sy + (lx * sn + ly * cs) * K]; }
    drawRig(c, v, pr, ds, bob, clock, at, null);
  }
  /* The stroke (docs/ships-plan.md, 2026-10-21): v.stroke runs in sail() while v.rowing; the pull is the first two fifths of a cycle
     (the blade in the water, moving aft), the recovery the rest (the blade lifted and carried forward). strokeLean gives how far
     along the keel a rower's body leans (toward the bow at the finish, since he faces aft); drawOars draws each oar from the
     rower's hands over the rail to the blade, all in time; at rest the oars are held out level. rowers: [{ x, y, side }] in the
     hull's frame (side 0: a pair, the hero alone). */
  function strokePhase(v) { return (((v.stroke || 0) / (2 * Math.PI)) % 1 + 1) % 1; }
  function strokeK(v) { var ph = strokePhase(v); if (!v.rowing) return { th: 0, lean: 0, lift: 3, wet: false }; if (ph < 0.375) { var t = ph / 0.375; return { th: 0.55 - 1.1 * t, lean: -4 + 9 * t, lift: 0, wet: true }; } var t2 = (ph - 0.375) / 0.625; return { th: -0.55 + 1.1 * t2, lean: 5 - 9 * t2, lift: 5, wet: false }; }   // (the pull is the clip's frames 0 to 2 of 8)
  function strokeLean(v) { return strokeK(v).lean; }
  function tholeOf(v, x, sd) { var A = artOf(v), M = A && A.J.marks, best = null, bd = 1e9; if (!M || !M.tholes) return null; M.tholes.forEach(function (q) { if ((q[1] < 0 ? -1 : 1) !== sd) return; var d = Math.abs(q[0] - (x - 7)); if (d < bd) { bd = d; best = q; } }); return best; }   // a model's thole for a rower at x on side sd: the nearest a little aft of him
  function drawOars(c, v, clock, rowers) {
    if (!rowers || !rowers.length || !HULLS[v.kind]) return;
    var pr = profileOf(v), ch = Math.cos(v.h), sh = Math.sin(v.h), bob = bobOf(v, clock), S = strokeK(v), mv = Math.min(1, speedOf(v) / 60), i;
    function toS(bx, by, up) { return [v.x + bx * ch - by * sh, (v.y + bx * sh + by * ch) * K + bob - (up || 0)]; }
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (i = 0; i < rowers.length; i++) { var r = rowers[i]; (r.side ? [r.side] : [-1, 1]).forEach(function (sd) {
      var w = profW(pr, r.x, sd), len = w * 0.9 + 34, hx = r.x + S.lean, hy = r.side ? r.y + sd * 5 : sd * 6, T = [r.x + S.lean * 0.3 + 1, sd * (w + 1)], tz = 6, th = tholeOf(v, r.x, sd);
      if (th) { T = [th[0] + S.lean * 0.3, th[1]]; tz = th[2] * 0.8192; len = Math.abs(th[1]) * 0.9 + 34; }   // (a model: the oar pivots on its thole)
      var B = [T[0] + Math.sin(S.th) * len, T[1] + sd * Math.cos(S.th) * len];
      var Hs = r.hands && r.hands[sd] ? r.hands[sd] : toS(hx, hy, 14), Ts = toS(T[0], T[1], tz), Bs = toS(B[0], B[1], S.lift);   // (r.hands[side]: the hand's place on screen from the drawn frame, else a guess at chest height)
      c.strokeStyle = LINE; c.lineWidth = 3.4; c.beginPath(); c.moveTo(Hs[0], Hs[1]); c.lineTo(Ts[0], Ts[1]); c.lineTo(Bs[0], Bs[1]); c.stroke();
      c.strokeStyle = S.wet ? shadeHex(COL.deck, -10) : shadeHex(COL.deck, 2); c.lineWidth = 1.8; c.stroke();
      c.beginPath(); c.ellipse(Bs[0], Bs[1], 2.6, 5, Math.atan2(Bs[1] - Ts[1], Bs[0] - Ts[0]) + Math.PI / 2, 0, 7); c.fillStyle = shadeHex(COL.deck, -10); c.fill(); c.lineWidth = 1; c.strokeStyle = LINE; c.stroke();
      if (S.wet && mv > 0.05) { c.strokeStyle = 'rgba(235,250,255,0.6)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(Bs[0], Bs[1] + 2, 5 + mv * 3, 2 + mv, 0, 0, 7); c.stroke(); }
    }); }
    c.restore();
  }
  // The karve's rig (2026-10-08): the steering oar at the stern on the right-hand side, the mast amidships with its yard, and the
  // square striped sail hanging from the yard: full and bellied toward the bow when the wind is behind (v.sailFill), else furled on the yard.
  function drawRig(c, v, pr, ds, bob, clock, at, curve) {
    var h = v.h, L = pr.L, W = pr.Wmax, col = colOf(v), fx = Math.cos(h), fy = Math.sin(h) * K, k, pat = v.look ? v.look.pattern || 'stripes' : 'stripes';
    var rx = -L * 0.78, rw = profW(pr, rx, 1), rud = v.rud || 0;                                   // the steering oar: a broad blade in the water aft, the tiller inboard
    if (v.rudder !== false) { var piv = at(rx, rw * 0.95), blade = at(rx - 6 * ds - rud * 2, rw * 0.95 + 9 * ds + rud * 3), till = at(rx + 9 * ds, rw * 0.3);
    c.lineCap = 'round'; c.strokeStyle = LINE; c.lineWidth = 3.4; c.beginPath(); c.moveTo(till[0], till[1]); c.lineTo(piv[0], piv[1]); c.lineTo(blade[0], blade[1]); c.stroke();
    c.strokeStyle = shadeHex(col.deck, -12); c.lineWidth = 1.8; c.stroke();
    c.beginPath(); c.ellipse(blade[0], blade[1], 2.4 * ds, 5 * ds, Math.atan2(blade[1] - piv[1], blade[0] - piv[0]) + Math.PI / 2, 0, 7); c.fillStyle = shadeHex(col.deck, -12); c.fill(); c.lineWidth = 1; c.strokeStyle = LINE; c.stroke(); }
    if (v.mastX == null || !parts0(v, 'mast')) return;
    var mx = v.mastX, m = at(mx, 0), mh = L * 0.84, yl = W * 1.3 + 10, fill = Math.max(0.3, v.sailFill || 0), full = v.sailSet != null ? v.sailSet > 0.5 : (v.sailFill || 0) > 0.12;   // the mast's height (the karve's about seven metres), the yard's half length
    var a1 = at(mx, -yl), b1 = at(mx, yl), TA = [a1[0], a1[1] - mh], TB = [b1[0], b1[1] - mh], foot = mh * 0.28, bl = (3 + fill * 9) * ds;
    c.strokeStyle = LINE; c.lineWidth = 2.2 * ds + 1.8; c.beginPath(); c.moveTo(m[0], m[1]); c.lineTo(m[0], m[1] - mh); c.stroke();   // the mast, its foot on the keel
    c.strokeStyle = shadeHex(col.hull, -6); c.lineWidth = 2.2 * ds; c.stroke();
    if (full) {                                                                                         // the sail set: hanging from the yard to the foot, bellied toward the bow
      var TM = [m[0] + fx * bl * 0.35, m[1] - mh + fy * bl * 0.35], BA = [a1[0], a1[1] - foot], BB = [b1[0], b1[1] - foot], BM = [m[0] + fx * bl, m[1] - foot + fy * bl];
      function topAt(s) { return s < 0.5 ? [TA[0] + (TM[0] - TA[0]) * s * 2, TA[1] + (TM[1] - TA[1]) * s * 2] : [TM[0] + (TB[0] - TM[0]) * (s - 0.5) * 2, TM[1] + (TB[1] - TM[1]) * (s - 0.5) * 2]; }
      function botAt(s) { return s < 0.5 ? [BA[0] + (BM[0] - BA[0]) * s * 2, BA[1] + (BM[1] - BA[1]) * s * 2] : [BM[0] + (BB[0] - BM[0]) * (s - 0.5) * 2, BM[1] + (BB[1] - BM[1]) * (s - 0.5) * 2]; }
      function outline() { c.beginPath(); c.moveTo(TA[0], TA[1]); c.lineTo(TM[0], TM[1]); c.lineTo(TB[0], TB[1]); c.lineTo(BB[0], BB[1]); c.lineTo(BM[0], BM[1]); c.lineTo(BA[0], BA[1]); c.closePath(); }
      function at2(s, t) { var a = topAt(s), b = botAt(s); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
      function quad(s0, t0, s1, t1) { var q = at2(s0, t0); c.beginPath(); c.moveTo(q[0], q[1]); q = at2(s1, t0); c.lineTo(q[0], q[1]); q = at2(s1, t1); c.lineTo(q[0], q[1]); q = at2(s0, t1); c.lineTo(q[0], q[1]); c.closePath(); c.fill(); }
      outline(); c.fillStyle = pat === 'border' ? col.sail2 : col.sail; c.fill();
      if (pat === 'checks') { c.fillStyle = col.sail2; var si, ti; for (si = 0; si < 6; si++) for (ti = 0; ti < 4; ti++) if ((si + ti) % 2) quad(si / 6, ti / 4, (si + 1) / 6, (ti + 1) / 4); }   // (six across: a column's edge at the middle kink)
      else if (pat === 'border') { c.fillStyle = col.sail; quad(0.08, 0.1, 0.5, 0.9); quad(0.5, 0.1, 0.92, 0.9); }
      c.fillStyle = col.trim; for (k = 0; pat === 'stripes' && k < 7; k += 2) { var s0 = k / 7, s1 = (k + 1) / 7, mid = s0 < 0.5 && s1 > 0.5, q; c.beginPath(); q = topAt(s0); c.moveTo(q[0], q[1]); if (mid) c.lineTo(TM[0], TM[1]); q = topAt(s1); c.lineTo(q[0], q[1]); q = botAt(s1); c.lineTo(q[0], q[1]); if (mid) c.lineTo(BM[0], BM[1]); q = botAt(s0); c.lineTo(q[0], q[1]); c.closePath(); c.fill(); }   // the stripes
      c.save(); outline(); c.clip(); c.globalAlpha = INK.grain; c.fillStyle = grainPat(c); c.fillRect(Math.min(TA[0], TB[0]) - 20, TA[1] - 20, Math.abs(TB[0] - TA[0]) + 40, mh + 40); c.globalAlpha = 1;
      var sg = c.createLinearGradient(TA[0], 0, TB[0], 0); sg.addColorStop(0, 'rgba(255,250,230,0.18)'); sg.addColorStop(1, 'rgba(40,50,90,0.22)'); c.fillStyle = sg; c.fillRect(Math.min(TA[0], TB[0]) - 20, TA[1] - 20, Math.abs(TB[0] - TA[0]) + 40, mh + 40);   // lit from the left, cool toward the right
      c.strokeStyle = INK.faint; c.lineWidth = 0.6; for (k = 1; k < 4; k++) { var sy0 = k / 4; c.beginPath(); c.moveTo(TA[0] + (BA[0] - TA[0]) * sy0, TA[1] + (BA[1] - TA[1]) * sy0); c.quadraticCurveTo(TM[0] + (BM[0] - TM[0]) * sy0 + fx * 2, TM[1] + (BM[1] - TM[1]) * sy0 + fy * 2, TB[0] + (BB[0] - TB[0]) * sy0, TB[1] + (BB[1] - TB[1]) * sy0); c.stroke(); }   // the folds
      c.restore(); outline(); c.lineWidth = 1.1; c.strokeStyle = LINE; c.lineJoin = 'round'; c.stroke();
      c.strokeStyle = 'rgba(35,26,22,0.6)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(BA[0], BA[1]); c.lineTo(at(mx - 4 * ds, -profW(pr, mx - 4 * ds, -1))[0], at(mx - 4 * ds, -profW(pr, mx - 4 * ds, -1))[1]); c.moveTo(BB[0], BB[1]); c.lineTo(at(mx - 4 * ds, profW(pr, mx - 4 * ds, 1))[0], at(mx - 4 * ds, profW(pr, mx - 4 * ds, 1))[1]); c.stroke();   // the sheets down to the rails
      c.strokeStyle = LINE; c.lineWidth = 1.8 * ds + 1.6; c.beginPath(); c.moveTo(TA[0], TA[1]); c.lineTo(TM[0], TM[1]); c.lineTo(TB[0], TB[1]); c.stroke(); c.strokeStyle = shadeHex(col.hull, -6); c.lineWidth = 1.8 * ds; c.stroke();   // the yard
    } else {                                                                                            // furled: the cloth bundled along the yard and tied
      c.strokeStyle = LINE; c.lineWidth = 1.8 * ds + 1.6; c.beginPath(); c.moveTo(TA[0], TA[1]); c.lineTo(TB[0], TB[1]); c.stroke(); c.strokeStyle = shadeHex(col.hull, -6); c.lineWidth = 1.8 * ds; c.stroke();
      c.strokeStyle = LINE; c.lineWidth = 4.2 * ds + 1.6; c.beginPath(); c.moveTo(TA[0] + (TB[0] - TA[0]) * 0.06, TA[1] + 1.5 + (TB[1] - TA[1]) * 0.06); c.lineTo(TB[0] - (TB[0] - TA[0]) * 0.06, TB[1] + 1.5 - (TB[1] - TA[1]) * 0.06); c.stroke(); c.strokeStyle = col.sail; c.lineWidth = 4.2 * ds; c.stroke();
      c.strokeStyle = col.trim; c.lineWidth = 1.3; [0.25, 0.5, 0.75].forEach(function (t) { var px = TA[0] + (TB[0] - TA[0]) * t, py = TA[1] + 1.5 + (TB[1] - TA[1]) * t; c.beginPath(); c.moveTo(px, py - 2.6 * ds); c.lineTo(px, py + 2.6 * ds); c.stroke(); });   // the ties
    }
    c.fillStyle = col.trim; c.beginPath(); c.moveTo(m[0], m[1] - mh - 1); c.lineTo(m[0] + 6 * ds, m[1] - mh + 1.2); c.lineTo(m[0], m[1] - mh + 3.2); c.closePath(); c.fill(); c.strokeStyle = LINE; c.lineWidth = 0.7; c.stroke();   // a pennant at the masthead
  }
  // the near side of the hull, drawn again over the hero's legs so he sits in the boat instead of on it; and his paddle
  function parts0(v, id) { return !!(v.parts || []).some(function (p) { return p.id === id; }); }
  function drawVesselFront(c, v, clock, figs) {
    if (!HULLS[v.kind]) return;
    var MSf = composeOf(v); if (MSf) { artFrame(c, MSf.front, artOf(v).J, v.h, v.x, v.y * K + bobOf(v, clock)); return; }   // (a model: its front mask, whole, over everyone aboard)
    var pr = profileOf(v), L = pr.L, ds = Math.max(0.8, L / 110), bob = bobOf(v, clock), sx = v.x, sy = v.y * K + bob, roll = Math.sin(clock * 1.7 + 1) * 0.02, i;
    if (typeof figs === 'number') figs = [{ x: v.x + Math.cos(v.h) * (v.seat || 0), y: figs }];
    function sub(dy, k1, k2) { c.save(); c.translate(sx, sy + dy); c.scale(1, K); c.rotate(v.h + roll); shapedPath(c, pr, k1, k2); c.restore(); }
    c.save();
    c.beginPath(); if (figs && figs.length) { for (i = 0; i < figs.length; i++) c.rect(figs[i].x - 13, figs[i].y * K - 2, 26, 44); } else c.rect(sx - L * 2, sy + 1.5, L * 4, L * 3); c.clip();   // only over their legs, whatever the heading
    c.lineJoin = 'round'; c.strokeStyle = LINE;
    var fcol = colOf(v); c.beginPath(); sub(3 + 2.5 * ds, 1, 1); sub(0, 0.84, 0.62); c.fillStyle = shadeHex(fcol.hull, -30); c.fill('evenodd'); c.lineWidth = 1.2; c.beginPath(); sub(3 + 2.5 * ds, 1, 1); c.stroke();
    var baked2 = surfacesOn() ? hullBake(v.kind, litPort(v.h) ? -1 : 1, fcol) : null;
    if (baked2) { c.save(); c.beginPath(); sub(0, 1, 1); sub(0, 0.84, 0.62); c.clip('evenodd'); c.translate(sx, sy); c.scale(1, K); c.rotate(v.h + roll); c.drawImage(baked2.cv, -baked2.w / 2, -baked2.h / 2, baked2.w, baked2.h); c.restore(); }
    else { c.beginPath(); sub(0, 1, 1); sub(0, 0.84, 0.62); c.fillStyle = fcol.hull; c.fill('evenodd');
    c.save(); c.beginPath(); sub(0, 1, 1); sub(0, 0.84, 0.62); c.clip('evenodd'); c.globalAlpha = INK.grain; c.fillStyle = grainPat(c); c.fillRect(sx - L * 2, sy - L, L * 4, L * 3); c.globalAlpha = 1; c.beginPath(); sub(0, 0.95, 0.9); c.lineWidth = 0.7; c.strokeStyle = INK.faint; c.stroke(); c.beginPath(); sub(0, 0.92, 0.95); c.lineWidth = 0.9; c.strokeStyle = INK.lit; c.stroke(); c.restore();
    c.lineWidth = 1.2; c.beginPath(); sub(0, 1, 1); c.stroke(); }
    c.lineWidth = 0.9; c.beginPath(); sub(0, 0.84, 0.62); c.stroke();
    v.clock = clock; if (v.shields) drawShields(c, v, pr, L, 'front', bob);   // the near side's shields, hanging on the hull's side over the legs
    c.restore();
  }

/* ---------- the Shipyard scene: a clear yard of grass in a wooden frame, the parts down the left, the hero in a corner,
   and the build cursor laying parts. The host (the game, the Sea Editor) gives it a hero, costs, sounds, a grass tile,
   saving and what happens on Finish; the scene keeps the yard, the pick, the cursor and the frame. ---------- */
function wood(c, x, y, w, h) {            // a wooden board: planks across with grain, the ink frame heavy below and to the right, iron nails
    c.save();
    c.fillStyle = '#5c4535'; c.beginPath(); c.roundRect(x, y, w, h, 4); c.fill();
    c.save(); c.beginPath(); c.roundRect(x + 1, y + 1, w - 2, h - 2, 3); c.clip();
    var py, i = 0; for (py = y; py < y + h; py += 9, i++) { c.fillStyle = ((i * 37) % 7) / 7 > 0.5 ? '#66503e' : '#59433a'; c.fillRect(x, py, w, 9); c.strokeStyle = 'rgba(35,26,22,0.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, py + 8.6); c.lineTo(x + w, py + 9); c.stroke(); c.strokeStyle = 'rgba(255,238,200,0.08)'; c.beginPath(); c.moveTo(x, py + 0.8); c.lineTo(x + w, py + 0.8); c.stroke(); }
    c.globalAlpha = 0.2; c.fillStyle = grainPat(c); c.fillRect(x, y, w, h); c.globalAlpha = 1;
    var sg = c.createLinearGradient(x, y, x + w * 0.7, y + h); sg.addColorStop(0, 'rgba(255,240,200,0.06)'); sg.addColorStop(1, 'hsla(222,40%,15%,0.22)'); c.fillStyle = sg; c.fillRect(x, y, w, h);
    c.restore();
    c.strokeStyle = INK.line; c.lineWidth = 1.1; c.beginPath(); c.roundRect(x, y, w, h, 4); c.stroke(); c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 4, y + h); c.lineTo(x + w - 4, y + h); c.moveTo(x + w, y + 4); c.lineTo(x + w, y + h - 4); c.stroke();
    c.strokeStyle = INK.lit; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 5, y + 1.2); c.lineTo(x + w - 5, y + 1.2); c.moveTo(x + 1.2, y + 5); c.lineTo(x + 1.2, y + h - 5); c.stroke();
    c.fillStyle = '#3a3a40'; [[x + 5, y + 5], [x + w - 5, y + 5], [x + 5, y + h - 5], [x + w - 5, y + h - 5]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 1.8, 0, 7); c.fill(); c.strokeStyle = INK.line; c.lineWidth = 0.7; c.stroke(); });
    c.restore();
  }
var scene = {
  Y: { X: 0, Y: 400, W: 9, H: 6 }, PAL: { x: 6, y: 34, cell: 30 }, FIT: { x: 6, y: 34, w: 120, h: 25 }, ZOOM: 1.1, SHIFT: 18,
  yard: null, pick: 0, active: false, host: null, label: null, fade: 0, clock: 0,
  enter: function (host, yardState) {
    this.host = host; this.yard = yardState && yardState.cells ? yardState : { plan: 'raft', cells: [] }; if (!this.yard.plan || !PLANS[this.yard.plan]) this.yard.plan = 'raft';
    this.yard.cells = this.yard.cells.filter(function (p) { var pt = partOf(p.id); return pt && (this.yard.plan === 'raft' || pt.layer !== 'hull'); }, this);   // a hull laid strake by strake (before 2026-10-13) is the design's now
    this.pick = 0; this.active = true; this.fade = 0.5; this.label = null;
    if (!this.yard.cells.length && !this.planList().some(function (pl) { return pl[0] === this.yard.plan; }, this)) this.yard.plan = 'raft';   // a plan above the bench's tier is not kept
    this.setPlan(this.yard.plan);
    return this.yard;
  },
  setPlan: function (plan) { var H = HULLS[plan]; this.yard.plan = plan; this.Y.W = H ? H.n + 2 : 9; this.ZOOM = H ? H.zoom : 1.1; this.SHIFT = H ? 66 : 18; this.pick = 0; },   // the yard is as long as the hull; the camera pulls back for a long one (and sits right of the fittings board)
  hull: function () { return HULLS[this.yard ? this.yard.plan : 'raft'] || null; },
  planList: function () { var t = this.host && this.host.tier ? this.host.tier() : 3; return YARD_PLANS.filter(function (pl) { return (PLAN_TIER[pl[0]] || 1) <= t; }); },
  leave: function () { this.active = false; this.fade = 0.5; },
  parts: function () { return partsFor(this.yard ? this.yard.plan : 'raft'); },
  cam: function () { var Y = this.Y; return { x: Y.X + Y.W * T / 2 - 4 - this.SHIFT / this.ZOOM, y: (Y.Y + Y.H * T / 2) * K, z: this.ZOOM }; },   // shifted right of the parts strip
  heroSpot: function () { var Y = this.Y; return { x: Y.X + Y.W * T + 8, y: Y.Y + Y.H * T + 14 }; },
  walk: function (x, y) { var Y = this.Y; return x >= Y.X - 18 && x <= Y.X + Y.W * T + 18 && y >= Y.Y - 14 && y <= Y.Y + Y.H * T + 26; },
  tick: function (dt) { if (this.fade > 0) this.fade = Math.max(0, this.fade - dt); this.clock = (this.clock || 0) + dt; },
  cell: function (mw) { var Y = this.Y; if (!mw) return null; var i = Math.floor((mw.x - Y.X) / T), j = Math.floor((mw.y - Y.Y) / T); if (i < 0 || j < 0 || i >= Y.W || j >= Y.H) return null; return { i: i, j: j }; },
  top: function (i, j) {                  // what a right click takes: what lies on a log first, wherever on the log it sits; then the log
    var y = this.yard; for (var L = LAYERS.length - 1; L >= 0; L--) { var k = yardAt(y, i, j, LAYERS[L]); if (k === -2) return -1; if (k >= 0) { if (LAYERS[L] === 'hull') { var p = y.cells[k], pt = partOf(p.id); for (var L2 = LAYERS.length - 1; L2 >= 1; L2--) for (var q = 0; q < pt.w; q++) { var k2 = yardAt(y, p.i + q, p.j, LAYERS[L2]); if (k2 >= 0) return k2; } } return k; } } return -1;
  },
  target: function (mw, wreck) {          // what the cursor would lay, or take away (the raft only: a hull of a design is fitted out on the board, 2026-10-21)
    var c = this.cell(mw), h = this.host; if (!c || this.hull()) return null;
    if (wreck) { var top = this.top(c.i, c.j); return { kind: 'yard', wreck: true, i: c.i, j: c.j, idx: top, ok: top >= 0, why: '' }; }
    var PL = this.parts(), pt = PL[this.pick] || PL[0], i = c.i, j = c.j, why = '', H = this.hull();
    if (i + pt.w > this.Y.W) i = this.Y.W - pt.w;
    for (var k = 0; k < pt.w && !why; k++) {
      if (yardAt(this.yard, i + k, j, pt.layer) >= 0) why = 'Something lies there already';
      else if (pt.on && yardAt(this.yard, i + k, j, pt.on) === -1) why = pt.on === 'deck' ? 'It goes on the mast' : 'It must go on the hull';
    }
    if (!why && H) {                        // the design says where the rig goes
      if (pt.id === 'mast' && !(i === H.mast && j === KJ)) why = 'The mast steps amidships, on the marked cell';
      else if (pt.id === 'rudder' && !(i === H.rudder && j === KJ)) why = 'The steering oar is bound at the stern, on the marked cell';
      else if (pt.id === 'dragon' && !(i === H.n && j === KJ)) why = 'The stem is carved at the bow, on the marked cell';
      else if (pt.id === 'thwart' && j === KJ && (i === H.mast || i === H.rudder)) why = i === H.mast ? 'The mast stands there' : 'The steering oar is bound there';
      else if (pt.id === 'shields' && yardParts(this.yard, 'shields').length) why = 'The rails have their shields';
    }
    if (!why && !h.canAfford(pt.cost)) why = 'Need ' + h.costText(pt.cost);
    return { kind: 'yard', i: i, j: j, part: pt, ok: !why, why: why };
  },
  act: function (mw, first, wreck) {
    var t = this.target(mw, wreck), h = this.host; if (!t || !t.ok) return false;
    if (t.wreck) { var p = this.yard.cells[t.idx]; h.pay(costFor(partOf(p.id), this.yard.plan), 1); this.yard.cells.splice(t.idx, 1); h.sfx('build'); h.save(); return true; }
    if (!first) return false;
    h.pay(t.part.cost); this.yard.cells.push({ id: t.part.id, i: t.i, j: t.j }); h.sfx('build'); h.save(); return true;
  },
  check: function () { if (!this.yard) return ''; var why = yardCheck(this.yard), H = this.hull(); if (!why && H && this.host && !this.host.canAfford(H.cost)) why = 'The hull costs ' + this.host.costText(H.cost) + ': not enough'; return why; },
  floor: function (c) {                   // the yard's ground, in world space, with the laid parts: trodden earth inside a frame of timbers
    var Y = this.Y, i, j;
    for (j = -2; j < Y.H + 2; j++) for (i = -2; i < Y.W + 2; i++) this.host.tile(c, i + 40, j + 40, Y.X + i * T, (Y.Y + j * T) * K, T + 0.4, TS + 0.4);
    ink(c, rect(Y.X, Y.Y * K, Y.W * T, Y.H * TS), '#8a7250', { wob: 2.5, seed: 21, lw: 0, noLine: true, shade: 0.12 });
    ink(c, rect(Y.X - 4, Y.Y * K - 3, Y.W * T + 8, 3), '#6e5540', { wob: 0.6, seed: 22, lw: 0.8, heavy: 1.6 }); ink(c, rect(Y.X - 4, Y.Y * K + Y.H * TS, Y.W * T + 8, 3), '#6e5540', { wob: 0.6, seed: 23, lw: 0.8, heavy: 1.6 });
    ink(c, rect(Y.X - 4, Y.Y * K - 3, 3, Y.H * TS + 6), '#6e5540', { wob: 0.6, seed: 24, lw: 0.8, heavy: 1.6 }); ink(c, rect(Y.X + Y.W * T + 1, Y.Y * K - 3, 3, Y.H * TS + 6), '#6e5540', { wob: 0.6, seed: 25, lw: 0.8, heavy: 1.6 });
    c.strokeStyle = 'rgba(35,26,22,0.16)'; c.lineWidth = 0.7; c.setLineDash([2, 4]); c.beginPath();
    for (i = 0; i <= Y.W; i++) { c.moveTo(Y.X + i * T, Y.Y * K); c.lineTo(Y.X + i * T, (Y.Y + Y.H * T) * K); }
    for (j = 0; j <= Y.H; j++) { c.moveTo(Y.X, (Y.Y + j * T) * K); c.lineTo(Y.X + Y.W * T, (Y.Y + j * T) * K); }
    c.stroke(); c.setLineDash([]);
    var y = this.yard, H = this.hull();
    if (H) {                               // a hull of a design (2026-10-21, Robin: the laid cells for upright things looked weird): the frame holds water and the vessel floats in it as it will look, its fittings from the board
      c.save(); c.beginPath(); c.rect(Y.X, Y.Y * K, Y.W * T, Y.H * TS); c.clip(); c.fillStyle = '#3a6f8e'; c.fillRect(Y.X, Y.Y * K, Y.W * T, Y.H * TS); c.globalAlpha = 0.16; c.fillStyle = grainPat(c); c.fillRect(Y.X, Y.Y * K, Y.W * T, Y.H * TS); c.globalAlpha = 1;
      c.strokeStyle = 'rgba(235,250,255,0.3)'; c.lineWidth = 0.8; for (i = 0; i < 9; i++) { var qx = Y.X + 20 + ((i * 97) % (Y.W * T - 40)), qy = Y.Y * K + 10 + ((i * 53) % (Y.H * TS - 20)); c.beginPath(); c.moveTo(qx, qy); c.quadraticCurveTo(qx + 4, qy - 2.5, qx + 8, qy); c.quadraticCurveTo(qx + 12, qy + 2.5, qx + 16, qy); c.stroke(); }
      c.restore();
      var pv = { kind: y.plan, parts: y.cells, x: Y.X + Y.W * T / 2, y: Y.Y + Y.H * T / 2 + 8, h: -0.35, vx: 0, vy: 0, aboard: false, sailFill: 0.55, crew: 0 }; fitVessel(pv); drawVessel(c, pv, this.clock || 0);
      return;
    }
    if (false) {
      hullCellsOf(y.plan).forEach(function (p) { drawYardPart(c, { id: p.id, w: 1 }, Y.X + p.i * T, (Y.Y + p.j * T) * K, 1); });   /* (the keel and the strakes are no parts of the strip any more: drawn by name) */
      [[H.mast, 'mast'], [H.rudder, 'steering oar'], [H.n, 'stem']].forEach(function (q) { if (!q[0]) return; var mx = Y.X + (q[0] + 0.5) * T, my = (Y.Y + (KJ + 0.5) * T) * K; c.save(); c.setLineDash([2, 2]); c.strokeStyle = 'rgba(255,230,160,0.85)'; c.lineWidth = 1; c.beginPath(); c.ellipse(mx, my, 10, 7, 0, 0, 7); c.stroke(); c.setLineDash([]); c.font = 'bold 4.5px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,230,160,0.9)'; c.fillText(q[1], mx, my + 13); c.restore(); });
    }
    LAYERS.forEach(function (L) { y.cells.forEach(function (p) { var pt = partOf(p.id); if (pt && pt.layer === L) drawYardPart(c, pt, Y.X + p.i * T, (Y.Y + p.j * T) * K, 1); }); });
  },
  ghost: function (c, mw, wreck) {        // the cursor: the part where it would lie, green or red; sets this.label
    var t = this.target(mw, wreck), Y = this.Y, h = this.host; this.label = null; if (!t) return;
    var yx = Y.X + t.i * T, yy = (Y.Y + t.j * T) * K, col = t.ok ? '120,255,160' : '255,80,60', yw = t.wreck ? T : t.part.w * T;
    c.save();
    if (!t.wreck) { c.globalAlpha = t.ok ? 0.7 : 0.35; drawYardPart(c, t.part, yx, yy, 1); c.globalAlpha = 1; }
    if (t.wreck && t.ok) { var wp = this.yard.cells[t.idx]; yx = Y.X + wp.i * T; yw = partOf(wp.id).w * T; col = '255,80,60'; }
    if (!t.wreck || t.ok) { c.shadowColor = 'rgba(' + col + ',0.95)'; c.shadowBlur = 10; c.strokeStyle = 'rgba(' + col + ',0.95)'; c.lineWidth = 2; c.strokeRect(yx + 1, yy + 1, yw - 2, TS - 2); c.strokeRect(yx + 1, yy + 1, yw - 2, TS - 2); }
    c.restore();
    this.label = t.wreck ? (t.ok ? { text: 'Take back: +' + h.costText(partOf(this.yard.cells[t.idx].id).cost), bad: false } : null) : (t.ok ? { text: t.part.name + '  ' + h.costText(t.part.cost), bad: false } : { text: t.why, bad: true });
  },
  /* The fittings of a hull of a design (2026-10-21; Robin liked laying the raft's logs, but the cells for the mast and the other
     upright things looked weird): the rowing seats as a count, the rig (mast, sail and steering oar) as one thing a rigged hull
     needs, the dragon stem and the shields as yes or no. The board writes the yard's cells (the seats placed by autoThwarts),
     so the checks, the fit, the save and the launch read what they always read. */
  fittings: function () {
    var H = this.hull(); if (!H) return []; var y = this.yard, pl = y.plan, rows = [], th = partOf('thwart');
    rows.push({ id: 'thwart', name: 'Rowing seats', count: yardParts(y, 'thwart').length, min: H.thwarts[0], max: H.thwarts[1], cost: costFor(th, pl), text: 'An oar each side of every seat; two men to a seat' + (H.per === 1 ? ' (one on a faering)' : '') + '. The first is yours; more need hirdmen to row.' });
    if (H.mast) rows.push({ id: 'rig', name: 'Mast, sail, steering oar', on: !!(yardParts(y, 'mast').length && yardParts(y, 'sail').length && yardParts(y, 'rudder').length), cost: addCost(addCost(costFor(partOf('mast'), pl), costFor(partOf('sail'), pl)), costFor(partOf('rudder'), pl)), need: true, text: 'A tall pine stepped amidships, the square sail on its yard, and the side rudder bound at the stern. A wind from behind is speed for nothing.' });
    rows.push({ id: 'dragon', name: 'Dragon stem', on: !!yardParts(y, 'dragon').length, cost: costFor(partOf('dragon'), pl), text: partOf('dragon').text });
    if (H.mast) rows.push({ id: 'shields', name: 'Shields on the rail', on: !!yardParts(y, 'shields').length, cost: costFor(partOf('shields'), pl), text: partOf('shields').text });
    return rows;
  },
  fitSet: function (id, d) {               // + or - on the seats, yes or no on the rest; pays or gives back as laying did
    var H = this.hull(), y = this.yard, h = this.host, pl = y.plan, rows = this.fittings(), r = rows.filter(function (q) { return q.id === id; })[0]; if (!H || !r) return false;
    function drop(ids) { y.cells = y.cells.filter(function (p) { return ids.indexOf(p.id) < 0; }); }
    if (id === 'thwart') { var n = r.count + d; if (n < 0 || n > r.max) return false; if (d > 0) { if (!h.canAfford(r.cost)) { h.toast('Need ' + h.costText(r.cost)); return false; } h.pay(r.cost); } else h.pay(r.cost, 1); drop(['thwart']); y.cells = y.cells.concat(autoThwarts(H, n)); }
    else { var ids = id === 'rig' ? ['mast', 'sail', 'rudder'] : [id]; if (r.on) { h.pay(r.cost, 1); drop(ids); } else { if (!h.canAfford(r.cost)) { h.toast('Need ' + h.costText(r.cost)); return false; } h.pay(r.cost); if (id === 'rig') y.cells.push({ id: 'mast', i: H.mast, j: KJ }, { id: 'sail', i: H.mast, j: KJ }, { id: 'rudder', i: H.rudder, j: KJ }); else y.cells.push({ id: id, i: id === 'dragon' ? H.n : Math.min(4, H.n), j: KJ }); } }
    h.sfx('build'); h.save(); return true;
  },
  fitRect: function (k) { var F = this.FIT; return { x: F.x + 3, y: F.y + 10 + k * F.h, w: F.w, h: F.h - 3 }; },
  fitBtn: function (k, what) { var r = this.fitRect(k); if (what === 'minus') return { x: r.x + r.w - 42, y: r.y + 6, w: 11, h: 11 }; if (what === 'plus') return { x: r.x + r.w - 14, y: r.y + 6, w: 11, h: 11 }; return { x: r.x + r.w - 26, y: r.y + 6, w: 23, h: 11 }; },
  fitAt: function (ms) { if (!ms || !this.hull()) return null; var rows = this.fittings(), k, self = this; function inR(r) { return ms.x >= r.x && ms.x <= r.x + r.w && ms.y >= r.y && ms.y <= r.y + r.h; }
    for (k = 0; k < rows.length; k++) { var r = rows[k]; if (r.count != null) { if (inR(self.fitBtn(k, 'minus'))) return { k: k, what: 'minus', row: r }; if (inR(self.fitBtn(k, 'plus'))) return { k: k, what: 'plus', row: r }; } else if (inR(self.fitBtn(k, 'toggle'))) return { k: k, what: 'toggle', row: r }; if (inR(self.fitRect(k))) return { k: k, what: 'row', row: r }; }
    return null; },
  hudHull: function (c, ms, wreck) {       // a hull of a design: the frame, the plan tabs, the fittings board, the guidance, Finish
    var why = this.check(), h = this.host, HH = this.hull(), rows = this.fittings(), hit = this.fitAt(ms), self = this, F = this.FIT;
    wood(c, -6, -6, 412, 28); wood(c, -6, 228, 412, 28); wood(c, 388, 0, 18, 250);
    wood(c, F.x - 4, F.y - 4, F.w + 14, rows.length * F.h + 20);
    c.font = 'bold 6px system-ui, sans-serif'; c.fillStyle = '#f6e2b8'; c.textAlign = 'left'; c.fillText('Fitting out the ' + HH.name.toLowerCase(), F.x + 3, F.y + 5);
    rows.forEach(function (r, k) {
      var rr = self.fitRect(k), hv = hit && hit.k === k;
      c.fillStyle = hv ? '#4a3626' : '#33241a'; c.fillRect(rr.x, rr.y, rr.w, rr.h); c.save(); c.globalAlpha = 0.14; c.fillStyle = grainPat(c); c.fillRect(rr.x, rr.y, rr.w, rr.h); c.restore();
      c.strokeStyle = INK.line; c.lineWidth = 0.9; c.strokeRect(rr.x + 0.5, rr.y + 0.5, rr.w - 1, rr.h - 1);
      c.font = '600 6px system-ui, sans-serif'; c.fillStyle = '#f6e2b8'; c.textAlign = 'left'; c.fillText(r.name, rr.x + 4, rr.y + 8.5);
      c.font = '600 4.6px system-ui, sans-serif'; c.fillStyle = r.count != null || r.on || h.canAfford(r.cost) ? 'rgba(246,226,184,0.7)' : 'rgba(255,170,120,0.85)'; c.fillText((r.count != null ? 'each ' : '') + h.costText(r.cost) + (r.need ? '  (needed)' : ''), rr.x + 4, rr.y + 16.5);
      if (r.count != null) {
        var bm = self.fitBtn(k, 'minus'), bp = self.fitBtn(k, 'plus');
        [[bm, '−', r.count > 0, 'minus'], [bp, '+', r.count < r.max, 'plus']].forEach(function (b) { var on = b[2], hov = hv && hit.what === b[3]; c.fillStyle = on ? (hov ? '#8a5a2c' : '#5a4232') : '#3a2a20'; c.fillRect(b[0].x, b[0].y, b[0].w, b[0].h); c.strokeStyle = INK.line; c.lineWidth = 0.8; c.strokeRect(b[0].x + 0.5, b[0].y + 0.5, b[0].w - 1, b[0].h - 1); c.font = 'bold 7.5px system-ui, sans-serif'; c.fillStyle = on ? '#fff' : 'rgba(255,255,255,0.3)'; c.textAlign = 'center'; c.fillText(b[1], b[0].x + b[0].w / 2, b[0].y + 8.4); });
        c.font = 'bold 7px system-ui, sans-serif'; c.fillStyle = r.count < r.min ? '#ffb070' : '#fff'; c.textAlign = 'center'; c.fillText(String(r.count), (bm.x + bm.w + bp.x) / 2, bm.y + 8.4);
      } else {
        var bt = self.fitBtn(k, 'toggle'), hov2 = hv && hit.what === 'toggle'; c.fillStyle = r.on ? (hov2 ? '#c08a3a' : '#a8702c') : (hov2 ? '#4a3626' : '#3a2a20'); c.fillRect(bt.x, bt.y, bt.w, bt.h); c.strokeStyle = INK.line; c.lineWidth = 0.8; c.strokeRect(bt.x + 0.5, bt.y + 0.5, bt.w - 1, bt.h - 1); c.font = 'bold 5.5px system-ui, sans-serif'; c.fillStyle = r.on ? '#fff' : 'rgba(255,255,255,0.55)'; c.textAlign = 'center'; c.fillText(r.on ? 'yes' : 'no', bt.x + bt.w / 2, bt.y + 7.6);
      }
    });
    self.planList().forEach(function (pl, k) { var r = self.planRect(k), on = self.yard.plan === pl[0]; c.fillStyle = on ? '#a8702c' : '#33241a'; c.fillRect(r.x, r.y, r.w, r.h); c.strokeStyle = INK.line; c.lineWidth = 0.8; c.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); c.font = (on ? 'bold ' : '600 ') + '5px system-ui, sans-serif'; c.fillStyle = on ? '#fff' : 'rgba(246,226,184,0.8)'; c.textAlign = 'center'; c.fillText(pl[1], r.x + r.w / 2, r.y + 7.2); });
    var line = why || ('The ' + HH.name.toLowerCase() + ' is sound. Finish to launch it (the hull: ' + h.costText(HH.cost) + ').');
    c.font = '600 6.5px system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 2.6; c.strokeStyle = '#2e1a10'; c.strokeText(line, 300, 14); c.fillStyle = why ? '#ffe9a8' : '#9be58b'; c.fillText(line, 300, 14);
    if (!why) { var fr = this.finishRect(), fhv = ms && ms.x >= fr.x && ms.x <= fr.x + fr.w && ms.y >= fr.y && ms.y <= fr.y + fr.h; c.fillStyle = fhv ? '#6a4e38' : '#5a4232'; c.beginPath(); c.roundRect(fr.x, fr.y, fr.w, fr.h, 3); c.fill(); c.save(); c.globalAlpha = 0.14; c.fillStyle = grainPat(c); c.fill(); c.restore(); c.strokeStyle = INK.line; c.lineWidth = 0.9; c.stroke(); c.font = 'bold 6px system-ui, sans-serif'; c.fillStyle = '#f6e2b8'; c.textAlign = 'center'; c.fillText('Finish  (Enter)', fr.x + fr.w / 2, fr.y + 8.4); }
    if (hit) { var tt = hit.row.text, tw; c.font = '600 5.5px system-ui, sans-serif'; while (tt.length > 4 && c.measureText(tt).width > 240) tt = tt.slice(0, -1); if (tt !== hit.row.text) tt += '…'; tw = c.measureText(tt).width + 10; c.fillStyle = 'rgba(35,26,22,0.88)'; c.beginPath(); c.roundRect(F.x + F.w + 14, this.fitRect(hit.k).y + 2, tw, 12, 3); c.fill(); c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText(tt, F.x + F.w + 19, this.fitRect(hit.k).y + 10.5); }
    c.font = '600 5px system-ui, sans-serif'; c.lineWidth = 2; c.strokeStyle = '#2e1a10'; c.textAlign = 'left'; c.strokeText('Click a fitting to change it.  E leaves the yard.', 52, 242); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText('Click a fitting to change it.  E leaves the yard.', 52, 242);
    if (ms && !hit && this.planAt(ms) < 0) { c.font = '600 5px system-ui, sans-serif'; c.textAlign = 'left'; c.fillStyle = 'rgba(246,226,184,0.75)'; var ht = HH.text; while (ht.length > 4 && c.measureText(ht).width > 300) ht = ht.slice(0, -1); c.fillText(ht === HH.text ? ht : ht + '…', 52, 234); }
    if (this.fade > 0) { c.fillStyle = 'rgba(0,0,0,' + Math.min(1, this.fade / 0.5) + ')'; c.fillRect(0, 0, 400, 250); }
  },
  palRect: function (k) { var P = this.PAL; return { x: P.x + 3, y: P.y + 10 + k * (P.cell + 4), w: P.cell, h: P.cell }; },
  palAt: function (ms) { if (!ms) return -1; for (var k = 0; k < this.parts().length; k++) { var r = this.palRect(k); if (ms.x >= r.x && ms.x <= r.x + r.w && ms.y >= r.y && ms.y <= r.y + r.h) return k; } return -1; },
  planRect: function (k) { return { x: 50 + k * 32, y: 6, w: 29, h: 10 }; },
  planAt: function (ms) { if (!ms) return -1; var PLs = this.planList(); for (var k = 0; k < PLs.length; k++) { var r = this.planRect(k); if (ms.x >= r.x && ms.x <= r.x + r.w && ms.y >= r.y && ms.y <= r.y + r.h) return k; } return -1; },
  finishRect: function () { return { x: 320, y: 234, w: 62, h: 12 }; },
  hud: function (c, ms, wreck) {          // the frame, the parts, the plan tabs, the guidance, Finish, the cursor's label (the raft; a hull of a design: hudHull)
    if (this.hull()) return this.hudHull(c, ms, wreck);
    var why = this.check(), hp = this.palAt(ms), PL = this.parts(), P = this.PAL, h = this.host, k, self = this;
    wood(c, -6, -6, 412, 28); wood(c, -6, 228, 412, 28); wood(c, 388, 0, 18, 250);
    wood(c, P.x - 4, P.y - 4, P.cell + 14, PL.length * (P.cell + 4) + 20);
    c.font = 'bold 6px system-ui, sans-serif'; c.fillStyle = '#f6e2b8'; c.textAlign = 'left'; c.fillText('Parts', P.x + 3, P.y + 5);
    for (k = 0; k < PL.length; k++) {
      var r = this.palRect(k), pt = PL[k], on = k === this.pick && !wreck, can = h.canAfford(pt.cost);
      c.fillStyle = hp === k ? '#4a3626' : '#33241a'; c.fillRect(r.x, r.y, r.w, r.h); c.save(); c.globalAlpha = 0.14; c.fillStyle = grainPat(c); c.fillRect(r.x, r.y, r.w, r.h); c.restore();
      c.strokeStyle = on ? '#d9a73a' : INK.line; c.lineWidth = on ? 1.3 : 0.9; c.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); c.strokeStyle = 'rgba(255,238,200,0.14)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(r.x + 1.5, r.y + r.h - 1.2); c.lineTo(r.x + r.w - 1.5, r.y + r.h - 1.2); c.lineTo(r.x + r.w - 1.2, r.y + 1.5); c.stroke();
      c.globalAlpha = can ? 1 : 0.4; drawYardPart(c, pt, r.x + (pt.w === 2 ? 1 : 7), r.y + 4, pt.w === 2 ? 0.44 : 0.7); c.globalAlpha = 1;
      c.font = '600 4.2px system-ui, sans-serif'; c.fillStyle = 'rgba(246,226,184,0.85)'; c.textAlign = 'center'; c.fillText(pt.name, r.x + r.w / 2, r.y + r.h - 2.5);
    }
    self.planList().forEach(function (pl, k) { var r = self.planRect(k), on = self.yard.plan === pl[0]; c.fillStyle = on ? '#a8702c' : '#33241a'; c.fillRect(r.x, r.y, r.w, r.h); c.strokeStyle = INK.line; c.lineWidth = 0.8; c.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); c.font = (on ? 'bold ' : '600 ') + '6px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = on ? '#f6e2b8' : 'rgba(246,226,184,0.7)'; c.fillText(pl[1], r.x + r.w / 2, r.y + 7.5); });
    var HH = this.hull(), line = why || ('The ' + (HH ? HH.name.toLowerCase() : 'raft') + ' is sound. Finish to launch it' + (HH ? ' (the hull: ' + h.costText(HH.cost) + ')' : '') + '.');
    c.font = '600 6.5px system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 2.6; c.strokeStyle = '#2e1a10'; c.strokeText(line, 300, 14); c.fillStyle = why ? '#ffe9a8' : '#9be58b'; c.fillText(line, 300, 14);
    if (!why) { var fr = this.finishRect(), hv = ms && ms.x >= fr.x && ms.x <= fr.x + fr.w && ms.y >= fr.y && ms.y <= fr.y + fr.h; c.fillStyle = hv ? '#6a4e38' : '#5a4232'; c.beginPath(); c.roundRect(fr.x, fr.y, fr.w, fr.h, 3); c.fill(); c.save(); c.globalAlpha = 0.14; c.fillStyle = grainPat(c); c.fillRect(fr.x, fr.y, fr.w, fr.h); c.restore(); c.strokeStyle = '#c99a3a'; c.lineWidth = 1; c.beginPath(); c.roundRect(fr.x + 0.5, fr.y + 0.5, fr.w - 1, fr.h - 1, 3); c.stroke(); c.strokeStyle = INK.line; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fr.x + 3, fr.y + fr.h); c.lineTo(fr.x + fr.w - 3, fr.y + fr.h); c.moveTo(fr.x + fr.w, fr.y + 3); c.lineTo(fr.x + fr.w, fr.y + fr.h - 3); c.stroke(); c.font = 'bold 6.5px system-ui, sans-serif'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('Finish  (Enter)', fr.x + fr.w / 2, fr.y + 8.5); }
    if (hp >= 0) { var pp = PL[hp], tt = pp.name + '  ' + h.costText(pp.cost) + '.  ' + pp.text; c.font = '600 6px system-ui, sans-serif'; c.textAlign = 'left'; c.lineWidth = 2.4; c.strokeStyle = '#2e1a10'; c.strokeText(tt, P.x + P.cell + 16, this.palRect(hp).y + 8); c.fillStyle = '#fff'; c.fillText(tt, P.x + P.cell + 16, this.palRect(hp).y + 8); }
    if (this.label && ms && hp < 0) { c.font = '600 6.5px system-ui, sans-serif'; var gw = c.measureText(this.label.text).width + 10, gx = Math.max(2, Math.min(398 - gw, ms.x - gw / 2)), gy = Math.min(222, ms.y + 26); c.fillStyle = 'rgba(35,26,22,0.85)'; c.beginPath(); c.roundRect(gx, gy - 8, gw, 12, 2.5); c.fill(); /* under the part, not across it */ c.fillStyle = this.label.bad ? '#ff9a8a' : '#fff'; c.textAlign = 'left'; c.fillText(this.label.text, gx + 5, gy + 1); }
    c.font = '600 5px system-ui, sans-serif'; c.lineWidth = 2; c.strokeStyle = '#2e1a10'; c.textAlign = 'left'; c.strokeText('Right click takes a part back.  E leaves the yard.', 52, 242); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText('Right click takes a part back.  E leaves the yard.', 52, 242);
    // a preview: the vessel as it will look afloat, in a small window of water at the bottom right
    if (HH || hullCells(this.yard.cells).length) {
      var bx = 292, by = 158, bw = 92, bh = 62, pv = { kind: this.yard.plan, parts: this.yard.cells, x: 0, y: 0, h: -0.35, vx: 0, vy: 0, aboard: false, sailFill: 0.6 };
      fitVessel(pv); var sc = Math.min(1, (bw - 14) / (pv.hw * 2 + 16), (bh - 10) / (pv.hh * 2 + 24));
      wood(c, bx - 4, by - 4, bw + 8, bh + 8);
      c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip(); c.fillStyle = '#3a6f8e'; c.fillRect(bx, by, bw, bh); c.globalAlpha = 0.16; c.fillStyle = grainPat(c); c.fillRect(bx, by, bw, bh); c.globalAlpha = 1;
      c.strokeStyle = 'rgba(235,250,255,0.35)'; c.lineWidth = 0.8; [[8, 12], [60, 20], [30, 50], [78, 46]].forEach(function (q) { c.beginPath(); c.moveTo(bx + q[0], by + q[1]); c.quadraticCurveTo(bx + q[0] + 3, by + q[1] - 2, bx + q[0] + 6, by + q[1]); c.quadraticCurveTo(bx + q[0] + 9, by + q[1] + 2, bx + q[0] + 12, by + q[1]); c.stroke(); });
      c.translate(bx + bw / 2, by + bh / 2 + 2); c.scale(sc, sc); drawVessel(c, pv, 0); c.restore();
      c.font = '600 5px system-ui, sans-serif'; c.textAlign = 'left'; c.fillStyle = 'rgba(246,226,184,0.85)'; c.fillText('Afloat it will look like this', bx, by - 6);
    }
    if (HH && ms && this.planAt(ms) < 0 && hp < 0 && !this.label) { c.font = '600 5px system-ui, sans-serif'; c.textAlign = 'left'; c.fillStyle = 'rgba(246,226,184,0.75)'; var ht = HH.text; while (ht.length > 4 && c.measureText(ht).width > 300) ht = ht.slice(0, -1); c.fillText(ht === HH.text ? ht : ht.replace(/\s*$/, '') + '\u2026', 52, 24.5); }   // what this hull is for
    if (this.fade > 0) { c.fillStyle = 'rgba(0,0,0,' + Math.min(1, this.fade / 0.5) + ')'; c.fillRect(0, 0, 400, 250); }
  },
  mousedown: function (button, mw, ms) {  // the tabs, the parts, Finish, taking back, laying
    var h = this.host, ypl = this.planAt(ms);
    if (ypl >= 0) { var PLs2 = this.planList(); if (button === 0 && this.yard.plan !== PLs2[ypl][0]) { if (this.yard.cells.length && !this.hull()) h.toast('Take the parts back first'); else { this.refundAll(); this.setPlan(PLs2[ypl][0]); h.save(); } } return true; }
    if (this.hull()) { var fh = this.fitAt(ms); if (fh && button === 0) { if (fh.what === 'minus') this.fitSet(fh.row.id, -1); else if (fh.what === 'plus') this.fitSet(fh.row.id, 1); else if (fh.what === 'toggle') this.fitSet(fh.row.id, 0); } else if (fh && button === 2 && fh.row.count != null) this.fitSet(fh.row.id, -1); var fr0 = this.finishRect(); if (button === 0 && !this.check() && ms && ms.x >= fr0.x && ms.x <= fr0.x + fr0.w && ms.y >= fr0.y && ms.y <= fr0.y + fr0.h) h.finish(); return true; }
    var ypk = this.palAt(ms); if (ypk >= 0) { if (button === 0) this.pick = ypk; return true; }
    var fr = this.finishRect(); if (button === 0 && !this.check() && ms && ms.x >= fr.x && ms.x <= fr.x + fr.w && ms.y >= fr.y && ms.y <= fr.y + fr.h) { h.finish(); return true; }
    if (button === 2) { this.act(mw, true, true); return true; }
    if (button === 0) { this.act(mw, true, false); return true; }
    return false;
  },
  wheel: function (d) { if (this.hull()) return; var n = this.parts().length; this.pick = (this.pick + d + n) % n; },
  refundAll: function () { var h = this.host, y = this.yard, pl = y.plan; y.cells.forEach(function (p) { var pt = partOf(p.id); if (pt && (pl === 'raft' || pt.layer !== 'hull')) h.pay(costFor(pt, pl), 1); }); y.cells = []; },   // the fittings given back (a hull plan switched)
  key: function (code) { if (code === 'Enter') { if (!this.check()) this.host.finish(); return true; } return false; }
};

return { setModel: setModel, artOf: artOf, composeOf: composeOf, markAt: markAt, colOf: colOf, fitOf: fitOf, holdOf: holdOf, chestK: chestK, HOLD: HOLD, scene: scene, wood: wood, HANDLING: HANDLING, WIND: WIND, sail: sail, sailFill: sailFill, MODELS: MODELS, modelOf: modelOf, designParts: designParts, LOOK: LOOK, lookDefault: lookDefault, FITTINGS: FITTINGS, partsFor: partsFor, costFor: costFor, PARTS: ALL_PARTS, PLAN_LIST: YARD_PLANS, PLAN_TIER: PLAN_TIER, LAYERS: LAYERS, PLANS: PLANS, RAFT_DEFAULT: RAFT_DEFAULT, CW: CW, CH: CH,
  HULLS: HULLS, HULL_IDS: HULL_IDS, isShip: isShip, heroSeat: heroSeat, crewPlaces: crewPlaces, drawRigOf: drawRigOf, masthead: masthead, stemPoint: stemPoint, drawOars: drawOars, setSurfaces: setSurfaces, surfacesOn: surfacesOn, strokePhase: strokePhase, strokeLean: strokeLean, gangway: gangway, landingSpots: landingSpots, GANG: GANG, U: U, autoThwarts: autoThwarts, rigged: rigged, nameOf: nameOf, hullCost: hullCost, hullCells: hullCellsOf, profileOf: profileOf, profW: profW, KJ: KJ,
  partsFor: partsFor, connected: yardConnected, parts: yardParts, at: yardAt, partOf: partOf, check: yardCheck, hullParts: hullCells,
  drawPart: drawYardPart, fit: fitVessel, drawVessel: drawVessel, drawVesselFront: drawVesselFront, drawOar: drawOar };
})();
if (typeof module !== 'undefined') module.exports = Yard;
