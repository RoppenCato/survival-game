/* Villages, from the farmstead to the great town (docs/villages.md for the look of a farm; docs/settlements-plan.md for the
   plan, 2026-10-22): one grammar at every size. A place is a FOCUS (the yard's fire, a village's green, a town's market), a SPINE
   (the roads, laid before anything stands), UNITS hung on the spine round the focus (buildings round one yard in a farm; farms,
   each the farm below, along a street or round a green in a village; plots in blocks between streets in a town), an EDGE drawn
   last round what grew (a fence, the ring of stakes, a town's wall; gates where the spine crosses it), and the OUTSIDE (fields,
   the sacred, the midden, the shore). Units are grown one at a time where an interest map says (near the spine, facing the
   focus, the sun side, not on top of the last), and the street grows when nothing fits. Over the plan a LAYER for exploring and
   raiding: zones (public, semi-private, private, the prize), the ways in with their price, the secrets with their cues, the
   nodes the defence stands on; and an AUDIT that prints what the rules ask. The game reads V as before (lots, floors, H, V,
   posts, roofs, items, paints, props, folk, finds, nature, fence, yard, roadEnds, tactic); units, spine, zones, ways, secrets,
   nodes and notes stand beside them. */
var Village = (function () {
'use strict';
var T = 32;
var VERSION = 2;                                       // the generator's version (2: the grammar of 2026-10-22); a save made under another should not keep its villages' walls
var DEF = {
  gap: 3, yardGap: 1, fenceGap: 1,                    // tiles between buildings, between a wall and the yard, between the ring and the fence
  unitGap: 2,                                         // tiles between two farms or two plots: the lane behind
  peoplePerHouse: 2.6, outsideShare: 0.4,             // people in a household; how many of them are out walking at a time
  wealthStone: 0.85, wealthLogs: 0.55, wealthPlanks: 0.25,   // the longhouse's walls by wealth (below: wattle); the houses one step poorer
  shinglesAt: 0.8, turfBelow: 0.22,                  // roofs: shingles for the rich, thatch for the rest, turf only for the poorest (2026-10-14)
  palisadeAt: 0.7, drystoneAt: 0.5, railAt: 0.2,      // the fence by wealth: rail (poor), wattle, dry stone; from palisadeAt a round wall of stakes with banners at the gate
  farmFenceAt: 0.3, farmWattleAt: 0.55,               // from this wealth every farm of a village has its own fence (a rail; wattle from farmWattleAt)
  stakeStep: 11, banners: 2, firePit: 1, logSeats: 4, doorProps: 1.4,
  roadW: 10, backGate: 1,                             // the one winding road (Robin, 2026-10-07): its width in the yard; a back gate for the road to leave by
  nature: 1, clutter: 1,                              // trees, bushes and rocks kept in and round the village; things against the walls (window boxes, lanterns, awnings, signs)
  fields: 1, fieldStrips: 3, sacred: 1, midden: 1, graves: 1,
  chestLoot: 1, cellarAt: 0.3, storeLoot: 1, cryptAt: 0.35,   // cryptAt: a church at this wealth and above has a crypt under it (raid step 8); a cellar in one house at cellarAt and above
  yardEarth: 1, pathGravel: 1, mossEdge: 1,
  wear: 1, wearAt: 2,                                 // the ground worn where the people walk between their spots (2026-10-22); a tile walked by this many routes is a path
  secrets: 1, ways: 1,                                // the secrets' budget and the ways-in rule by tier (0 turns the layer off)
  emptySlots: 0.25,                                   // the share of ring slots left open, so no two rings are alike
  sizeJitter: 1,                                      // buildings vary by this many tiles
  houseK: 1                                           // every building's inside, times this (2026-10-13, Robin: a trial with bigger houses, so there is more room to move around); the yard and the site grow with it
};
/* The archetypes (the ids the game, the plan and the tests use). tier: the rung of docs/settlements-plan.md. family: how the
   place is laid: single (one yard: today's ring plan), street (farms along a winding street), green (farms round a green, the
   forte), auto (street or green by the seed), row (plots along a shore street), town (plots in blocks inside a wall). farms and
   plots: how many units; green: the common's size; site: the tiles a page should find for it; people: the drawn folk. */
var ARCH = {
  farmstead: { name: 'Farmstead', tier: 0, family: 'single', houses: [0, 0], out: [2, 3], yard: [8, 6], long: [12, 16], site: [42, 34], people: [3, 5] },
  fisher: { name: 'Fisherman’s hut', tier: 0, family: 'single', houses: [0, 0], out: [1, 1], yard: [5, 4], site: [22, 30], hut: true, people: [1, 1], shore: true, racks: 2, lone: true },   // one old fisherman alone on a small island; he teaches the fish dishes (2026-10-08)
  church: { name: 'Church', tier: 0, family: 'single', houses: [1, 1], out: [0, 1], yard: [6, 5], site: [34, 34], people: [2, 3], church: true, chapel: true, lowland: true },   // a lone church with its priest's house (the lucky strike, 2026-10-07)
  small: { name: 'Small village', tier: 1, family: 'street', farms: [2, 3], green: [6, 4], site: [70, 58], people: [6, 9] },
  fishing: { name: 'Fishing hamlet', tier: 1, family: 'street', farms: [2, 3], green: [6, 4], site: [70, 58], people: [5, 8], shore: true, racks: 2 },
  ruin: { name: 'Abandoned', tier: 1, family: 'street', farms: [2, 3], green: [6, 4], site: [70, 58], people: [0, 0], ruin: true },
  village: { name: 'Village', tier: 2, family: 'auto', farms: [3, 5], green: [10, 7], site: [88, 62], people: [10, 15] },
  seat: { name: 'Chieftain’s seat', tier: 3, family: 'green', farms: [3, 5], green: [12, 8], site: [96, 72], people: [16, 24], hall: true, palisade: true },
  trading: { name: 'Trading post', tier: 3, family: 'row', plots: [6, 9], site: [84, 54], people: [8, 12], shore: true, stores: 2 },
  town: { name: 'Town', tier: 4, family: 'town', plots: [16, 24], site: [120, 88], people: [16, 26], hall: true, church: true, townwall: true, stores: 1, lowland: true },   // the lowlands (2026-10-07): a walled town round the jarl's hall with a church
  great: { name: 'Great village', tier: 4, family: 'green', farms: [6, 9], green: [14, 9], site: [134, 100], people: [34, 44], hall: true, palisade: true },
  bigtown: { name: 'Great town', tier: 5, family: 'town', plots: [30, 40], site: [148, 108], people: [36, 46], hall: true, church: true, townwall: true, stores: 2, lowland: true }
};
// the buildings: inside size in tiles [w range, h range], what stands inside, where the door goes (toward the yard)
var BUILD = {
  // Houses that are houses (Robin, 2026-10-13: "they are way too small today. It doesn't feel like houses"). What was real,
  // in tiles of a metre and a half: nearly everything people lived in was two to five tiles across, as wide as a roof could
  // span, and got its size from its length (Dublin's town houses 6 by 4, Hedeby's 12 by 5, the Trelleborg type 20 by 5; a
  // king's hall 32 by 8). So a building here is NARROW AND LONG, and a house stands with its gable, and its door, to the yard.
  longhouse: { name: 'Longhouse', w: [16, 20], h: [7, 7], roofed: true, inside: 'hall' },   /* (grown 2026-10-22: Robin's yes to bigger houses; it was 14 to 18 by 5) */     // a farm's: 21 to 27 m by 7.5 (it was 9 to 12 by 3 to 4)
  hall: { name: 'Great hall', w: [22, 24], h: [8, 8], roofed: true, inside: 'hall' },   /* (was 20 to 22 by 6) */         // a jarl's: 30 to 33 m by 9, two rows of posts down it (it was 13 to 16 by 4 to 5). 22 is what the view shows when a big fight draws it back
  house: { name: 'House', w: [8, 11], h: [6, 6], roofed: true, inside: 'home' },   /* (was 6 to 9 by 4) */               // w is its LENGTH and h its width, whichever way it stands (houseSize): 9 to 13.5 m by 6, and now and then 7.5 across. (It was 4 to 5 by 3 to 4, and the jitter made a quarter of them 3 across.)
  store: { name: 'Storehouse', w: [3, 3], h: [3, 3], roofed: true, inside: 'store', posts: true },
  byre: { name: 'Byre', w: [5, 6], h: [5, 5], roofed: true, inside: 'byre' },
  smithy: { name: 'Smithy', w: [4, 4], h: [5, 5], roofed: true, inside: 'smithy', open: true },
  bath: { name: 'Bathhouse', w: [3, 3], h: [3, 3], roofed: true, inside: 'bath' },
  pit: { name: 'Pit-house', w: [3, 3], h: [3, 3], roofed: true, inside: 'pit', floor: 1 },    // real pit-houses were about 4 m by 3
  boathouse: { name: 'Boathouse', w: [6, 8], h: [5, 5], roofed: true, inside: 'boat', open: true },
  lean: { name: 'Lean-to', w: [2, 3], h: [2, 2], roofed: true, inside: 'lean' },   // an annex against a house's side, under its own lower roof (the varied silhouettes, Robin's yes of 2026-10-22)
  church: { name: 'Church', w: [6, 6], h: [10, 12], roofed: true, inside: 'church', floor: 2 }   /* (was 4 by 8 to 9) */   // deep, so its gable faces south; cut stone, a slate roof, the bell tower at its side. Escomb's nave is 13.3 m by 4.4 inside: nine tiles by three (it was 5 to 6 deep)
};
/* The story roll (settlements-plan.md section 6, mine): the one thing that sets a place apart, rolled before its shape so the
   shape serves it; it biases the pools, the props and the finds. Its words are the Lore Director's (LORE?). */
var STORIES = {
  none: { name: 'Nothing in particular' },
  raided: { name: 'Raided before', tiers: [1, 2, 3, 4, 5] },      // stumps in the ring, fresh cairns, the elder's line; seen.raids may set it in play
  smith: { name: 'The smith’s place', tiers: [1, 2, 3, 4] },  // two smithies, charcoal pits, slag
  brewer: { name: 'The brewer’s', tiers: [1, 2, 3, 4, 5] },   // barrels at every door, the table laid most days, a bathhouse
  seal: { name: 'The seal hunters', tiers: [1, 2, 3], shore: true },   // racks of skins, a beached boat, no fields
  oldseat: { name: 'An old seat', tiers: [1, 2] },               // a longhouse too big for the place, a ship-setting, a stone with a line, poor now
  market: { name: 'Market day', tiers: [2, 3, 4, 5] }            // carts and stalls outside the gate, more people, a toll man
};
var SHAPES = ['auto', 'street', 'green'], AGES = ['auto', 'new', 'settled', 'old'];
var SECRETS_BY_TIER = [1, 1, 2, 3, 5, 8], WAYS_BY_TIER = [2, 2, 3, 3, 4, 5];   // the budget of secrets and the least ways in, by tier (settlements-plan.md section 3)
var PRICE = {                                           // what a way in costs the raider (the Ruin table of docs/destruction.md, rounded): seconds to get through, how far it is heard, who sees it
  gate: { secs: 8, noise: 560, seen: 'everybody', note: 'barred to a band; the ram, five swings' },
  fgate: { secs: 2, noise: 360, seen: 'everybody', note: 'the gate in a fence: a bar at night, the axe' },
  backgate: { secs: 2, noise: 360, seen: 'the watch', note: 'on the latch at night; the axe by day' },
  drystone: { secs: 7, noise: 300, seen: 'the field', note: 'a dry-stone wall: the pick, sixteen blows' },
  postern: { secs: 3, noise: 480, seen: 'the lane', note: 'a locked door in the wall: the axe, ten blows' },
  water: { secs: 0, noise: 0, seen: 'the shore', note: 'the side open to the sea' },
  weak: { secs: 1, noise: 320, seen: 'the lane', note: 'a run mended in new wood: one stake a blow' },
  fence: { secs: 1.4, noise: 110, seen: 'the field', note: 'a rail fence: four blows' },
  panel: { secs: 2.4, noise: 150, seen: 'the lane', note: 'a wattle panel in the wall' },
  gap: { secs: 0, noise: 0, seen: 'nobody', note: 'the villagers’ own shortcut behind a bush' },
  wall: { secs: 40, noise: 430, seen: 'everybody', note: 'the ram on cut stone' }
};
// the radius each thing takes on the floor, as the game's PIECES give them (docs/interiors-plan.md section 4; a flat thing 0)
var RAD = { bed: 8, table: 5, chair: 3, bench: 6, chest: 5, crate: 4, barrel: 4, sack: 5, stoneHearth: 8, campfire: 5, loom: 6, quern: 4, stool: 3, shelf: 4, cupboard: 5, workbench: 7, dryingRack: 6, spearRack: 4, shieldRack: 4, haystack: 6, trough: 5, furnace: 9, altar: 6, font: 4, foodTable: 7, logSeat: 5, stall: 8, rug: 0, cellarDoor: 0, trapdoor: 0, windowBox: 0, lantern: 0, torchBracket: 0, sign: 0, awning: 0, woodenWell: 8, firePit: 8, cradle: 5, wallHanging_1: 0, wallHanging_2: 0, wallHanging_3: 0 };
var NAMES = ['Arnfinn', 'Bera', 'Dagny', 'Eyvind', 'Frida', 'Gorm', 'Halla', 'Ingolf', 'Jorunn', 'Ketil', 'Liv', 'Mundi', 'Nanna', 'Ragna', 'Sigrun', 'Thorir', 'Ulf', 'Vigdis', 'Yngvar', 'Asa', 'Bjorn', 'Gunnhild', 'Hakon'];
var NAMES_M = ['Arnfinn', 'Eyvind', 'Gorm', 'Ingolf', 'Ketil', 'Mundi', 'Thorir', 'Ulf', 'Yngvar', 'Bjorn', 'Hakon'], NAMES_F = ['Bera', 'Dagny', 'Frida', 'Halla', 'Jorunn', 'Liv', 'Nanna', 'Ragna', 'Sigrun', 'Vigdis', 'Asa', 'Gunnhild'];   /* the same names by sex: a villager's name follows the female flag (2026-10-24: Ingolf the thrall wore the dress and was called her) */
var ROLES = { fisherman: ['Sit, sit. The sea has been feeding me for sixty years and it has not run dry yet.', 'Perch in the shallows, cod and salmon out where the water turns dark. Cast past the weed and wait: the float tells you everything.', 'Grill a fish on a flat stone, or boil two with berries: a soup that warms the whole night. Three on the rack over a charcoal smoke, and they keep till spring.', 'Mind the pike. Let him run when he runs, and reel when he rests, or he takes your line with him.'], priest: ['Peace be upon this house, stranger.', 'The silver on the altar is God’s, not mine. He will know who took it.'], guard: ['Keep your blade sheathed inside the walls.', 'The jarl sees everything from his hall.'], merchant: ['Wool, salt, iron. What have you got?', 'Silver by weight, friend. We take no promises.'], farmer: ['The barley came in well this year.', 'Mind the goat: she butts.'], fisher: ['The herring run at dawn, out past the skerry.', 'That boat has crossed worse water than this.'], smith: ['Copper is soft. Bring me bog iron and I will show you steel.', 'My bench is yours if you leave it as you found it.'], weaver: ['Wool from our own sheep. Feel it.', 'The loom took a winter to build.'], elder: ['Ormr\'s men came once. They will come again.', 'My father raised the stone by the gate.'], child: ['Are you a Viking?', 'I found a bird\'s nest with four eggs!'], thrall: ['...', 'I was taken from the south. This is home now.'] };
function rngOf(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function cfg(o) { var out = {}, k; for (k in DEF) out[k] = DEF[k]; for (k in o || {}) if (o[k] != null && DEF[k] != null) out[k] = +o[k]; return out; }
function key(x, y) { return x + ',' + y; }
function pickRange(R, r, jit) { var v = r[0] + Math.floor(R() * (r[1] - r[0] + 1)); return Math.max(1, v + (jit ? Math.round((R() - 0.5) * 2 * jit) : 0)); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function storyOf(archId, shore, R) {
  var A = ARCH[archId] || ARCH.small, pool = ['none', 'none'], k;
  for (k in STORIES) { var S = STORIES[k]; if (!S.tiers || S.tiers.indexOf(A.tier) < 0) continue; if (S.shore && !shore) continue; if (A.ruin && k !== 'raided') continue; pool.push(k); }
  return pool[Math.floor(R() * pool.length)];
}

// make(seed, site, opts): site { tx, ty, w, h, shore } (shore: 's', 'n', 'e', 'w' or null); opts { arch, wealth, G (DEF overrides),
// name, biome, shape ('auto' | 'street' | 'green'), story, age, rounds (how many units to grow: the editor watches it grow) }
function make(seed, site, opts) {
  opts = opts || {}; var G = cfg(opts.G), R = rngOf(seed), archId = opts.arch || 'small', A = ARCH[archId] || ARCH.small, wealth = opts.wealth == null ? R() : opts.wealth, shore = site.shore || (A.shore ? 's' : null);
  var RD = rngOf(((seed >>> 0) ^ 0x5bd1e995) >>> 0);   // the insides' dressing (the cradle, the hangings: the Art Director's, 2026-10-22) rolls on its own stream, so every other roll of a place stays as it was
  var stockK = 0.4 + R() * 1.2, hoardK = (0.7 + R() * 0.7) * (RICH[archId] || 1);   // the place's own rolls (raid step 7): how full its stores, how deep its hoard (and the archetype's wealth in coin: RICH)
  var shape = opts.shape && opts.shape !== 'auto' ? opts.shape : (A.family === 'auto' ? (R() < 0.5 ? 'street' : 'green') : A.family);
  var story = opts.story && opts.story !== 'auto' && STORIES[opts.story] ? opts.story : storyOf(archId, shore, R);
  var age = opts.age && opts.age !== 'auto' ? opts.age : (R() < 0.3 ? 'new' : R() < 0.75 ? 'settled' : 'old');
  var V = { seed: seed, arch: archId, wealth: wealth, shore: shore, stockK: stockK, hoardK: hoardK, name: opts.name || null, tx: site.tx, ty: site.ty, w: site.w, h: site.h, tier: A.tier || 0, shape: shape, story: story, age: age, lots: [], floors: {}, H: {}, V: {}, posts: [], roofs: [], items: [], paints: [], props: [], folk: [], finds: [], fence: null, ruin: !!A.ruin, units: [], yards: [], spine: [], nodes: [], zones: [], ways: [], secrets: [], notes: [], fences: [] };
  var tx = site.tx, ty = site.ty, w = site.w, h = site.h, HK = G.houseK || 1;
  var lowland = !!(opts.biome || A.lowland);
  var wallOf = function (step) { var wv = wealth - step * 0.3; if (lowland) return wv >= G.wealthStone ? 6 : wv >= G.wealthLogs - 0.15 ? 5 : wv >= G.wealthPlanks ? 1 : 2; return wv >= G.wealthStone ? 3 : wv >= G.wealthLogs ? 0 : wv >= G.wealthPlanks ? 1 : 2; };   // the lowlands: cut stone for the rich, timber framing for most
  var roofOf = function (big) { if (lowland) return (big && wealth >= 0.45) || wealth >= 0.7 ? 3 : 1; if (big && wealth >= G.shinglesAt) return 2; return wealth < G.turfBelow ? 0 : 1; };   /* (2026-10-14, Robin: thatch is the roof; turf only for the poorest) */   // the lowlands: clay tiles for the rich, thatch for the rest
  var fenceKind = A.townwall ? 'townwall' : A.palisade || wealth >= G.palisadeAt ? 'palisade' : wealth >= G.drystoneAt ? 'drystone' : 'rail'; if (A.chapel) fenceKind = 'drystone';   /* (wattle only for pens and the kitchen plot: Robin, 2026-10-22) */ if (A.hut && (fenceKind === 'palisade' || fenceKind === 'drystone')) fenceKind = 'fence';   // (the fisherman's hut keeps a wattle fence at most: a ring of stakes round two buildings shut its door, 2026-10-22)
  var farmFence = A.family === 'single' ? null : wealth >= G.farmFenceAt ? 'rail' : null;   // a farm's own fence inside a village (section 9's question 1: both, by wealth)
  // ---- what the generator writes goes into the current container C: the place itself, or a unit's box before it is stamped in ----
  var C = V;
  function newBox(bw, bh) { return { w: bw, h: bh, lots: [], floors: {}, H: {}, V: {}, posts: [], roofs: [], items: [], paints: [], props: [], finds: [], yard: null, front: null }; }
  function H(x, y, t, m, hid) { C.H[key(x, y)] = hid ? { t: t, m: m, hidden: 1 } : { t: t, m: m }; } function Vw(x, y, t, m, hid) { C.V[key(x, y)] = hid ? { t: t, m: m, hidden: 1 } : { t: t, m: m }; }   // hidden: the barrier under a fence drawn as a run of posts (V.fences), not to be drawn itself (Robin, 2026-10-22, through the Art Director: fences as angled runs following the land, not on the grid)
  function item(name, x, y, extra) { var it = { name: name, x: x, y: y }; for (var q in extra || {}) it[q] = extra[q]; C.items.push(it); return it; }
  function prop(o) { C.props.push(o); return o; } function find(o) { C.finds.push(o); return o; }
  function dab(x, y, r, kind) { C.paints.push({ x: x, y: y, r: r, kind: kind }); }
  function strokeTo(a, b, r, kind, r2) { var n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / (r * 0.6))), i; for (i = 0; i <= n; i++) { var u = i / n, rr = r2 == null ? r : r + (r2 - r) * u; dab(a[0] + (b[0] - a[0]) * u + (R() - 0.5) * 4, a[1] + (b[1] - a[1]) * u + (R() - 0.5) * 4, rr * (0.85 + R() * 0.3), kind); } }
  function tile(x, y) { return [(x + 0.5) * T, (y + 0.5) * T]; }
  var CALLINGS = ['farmer', 'farmer', 'fisher', 'smith', 'weaver', 'elder', 'thrall'];
  function rollCalling() { var c = shore && R() < 0.35 ? 'fisher' : CALLINGS[Math.floor(R() * CALLINGS.length)]; return c; }   // a household's calling, rolled on its house so its inside fits it (the work thing by the calling, docs/interiors-plan.md)
  function earthPatch(cx, cy, rx, ry, fill) {           // trodden earth as one shape: dabs on a close grid over an ellipse, solid in the middle, thinning to a ragged rim with islands of grass (the game's ground is a field of tiles: a lone dab is a lone tile, 2026-10-22). The rim thins in CLUSTERS of about a tile and a half, never one tile (Robin, 2026-10-22, through the Art Director): every cell of 48 units keeps or drops all its dabs together
    var sx, sy, cells = {}, CS = 48;
    function keepCell(x2, y2) { var ck = key(Math.floor((x2 + rx) / CS), Math.floor((y2 + ry) / CS)); if (cells[ck] == null) { var ccx = (Math.floor((x2 + rx) / CS) + 0.5) * CS - rx, ccy = (Math.floor((y2 + ry) / CS) + 0.5) * CS - ry, d = Math.hypot(ccx / rx, ccy / ry); cells[ck] = d <= 0.55 || R() <= fill * (1.15 - d); } return cells[ck]; }
    for (sy = -ry; sy <= ry; sy += 14) for (sx = -rx; sx <= rx; sx += 14) { var dd2 = Math.hypot(sx / rx, sy / ry); if (dd2 > 1) continue; if (!keepCell(sx, sy)) continue; dab(cx + sx + (R() - 0.5) * 8, cy + sy + (R() - 0.5) * 8, 11 + R() * 6, 2); }
  }
  function overlaps(a, b, gap) { return !(a.x + a.w + gap <= b.x || b.x + b.w + gap <= a.x || a.y + a.h + gap <= b.y || b.y + b.h + gap <= a.y); }
  // a building's inside by its kind; an outbuilding beside a yard with its door east or west runs back from the yard (its long side turned)
  function size(id, door, lenRange) { var b = BUILD[id], sz = { w: pickRange(R, lenRange || b.w, 0), h: pickRange(R, b.h, 0) }; if (HK !== 1) { sz.w = Math.max(sz.w, Math.round(sz.w * HK)); sz.h = Math.max(sz.h, Math.round(sz.h * HK)); } if ((door === 'e' || door === 'w') && id !== 'longhouse' && id !== 'hall' && id !== 'church') sz = { w: sz.h, h: sz.w }; return sz; }
  // a house by the side its door is on: it runs back from that side, its gable and its door toward the yard or the street
  function houseSize(door, lenRange, across) { var b = BUILD.house, lg = pickRange(R, lenRange || b.w, 0), ac = across || (b.h[0] + (wealth > 0.4 && R() < 0.35 ? 1 : 0)); if (HK !== 1) { lg = Math.round(lg * HK); ac = Math.round(ac * HK); } return door === 's' || door === 'n' ? { w: ac, h: lg } : { w: lg, h: ac }; }
  // ---- the pieces of a lot: walls in its material, a door on its front, a window or two, the floor, the roof later ----
  function pieces(l) {
    var b = BUILD[l.id], U = l.u || {}, m = l.mstep != null ? wallOf(l.mstep) : l.big ? wallOf(0) : (l.id === 'house' ? wallOf(1) : (l.id === 'store' || l.id === 'bath' ? 1 : 2)), roof = roofOf(!!l.big), x, y;
    if (l.id === 'smithy') m = 3; if (l.id === 'pit') m = 4; if (l.id === 'church') { m = 6; roof = 4; }
    var dx = l.door === 's' || l.door === 'n' ? l.x + 1 + Math.floor(R() * Math.max(1, l.w - 2)) : -1, dy = l.door === 'e' || l.door === 'w' ? (l.h > 2 ? l.y + 1 + Math.floor(R() * (l.h - 2)) : l.y + Math.floor(R() * l.h)) : -1;   // (a door in an end wall keeps off its corners: the long walls are where things stand)
    if (l.w <= 2 && (l.door === 's' || l.door === 'n')) dx = l.x + Math.floor(R() * l.w);
    var gaps = V.ruin || l.ruin ? Math.max(1, Math.floor((l.w + l.h) * 0.35)) : 0, gapAt = {}; if (gaps) for (var g = 0; g < gaps; g++) gapAt[Math.floor(R() * (l.w * 2 + l.h * 2))] = 1;
    var n = 0; l.wins = [];
    var bow = (l.id === 'longhouse' || l.id === 'hall') && l.w >= 12 && !V.ruin && !l.ruin && (l.door === 's' || l.door === 'n');   // the boat-shaped walls of the real longhouse: a tile of inset at each end (the varied silhouettes, Robin's yes of 2026-10-22)
    if (bow) { l.bow = 1; if (dx === l.x) dx = l.x + 1; if (dx === l.x + l.w - 1) dx = l.x + l.w - 2; }
    var bx0 = bow ? l.x + 1 : l.x, bx1 = bow ? l.x + l.w - 1 : l.x + l.w, by0 = bow ? l.y + 1 : l.y, by1 = bow ? l.y + l.h - 1 : l.y + l.h, sk = l.skip || '';
    for (x = bx0; x < bx1; x++) { if (!gapAt[n++] && sk !== 'n') H(x, l.y, l.door === 'n' && x === dx ? 'door' : 'wall', m); }
    for (x = bx0; x < bx1; x++) { var south = l.door === 's' && x === dx ? 'door' : ((l.w >= 6 && l.id !== 'byre' && l.id !== 'boathouse' ? (x - l.x) % 3 === 1 && x !== dx + 1 && R() < 0.8 : (x === l.x + l.w - 1 || (l.door !== 's' && x === l.x)) && l.w > 1 && R() < 0.6) ? 'window' : 'wall');   /* (a long wall has a window every third tile) */ if (b.open && l.door === 's') south = x === dx ? 'door' : (x === l.x || x === l.x + l.w - 1 ? 'wall' : 'door'); if (!gapAt[n++] && sk !== 's') { H(x, l.y + l.h, south, m); if (south === 'window') l.wins.push(x); } }
    for (y = by0; y < by1; y++) { if (!gapAt[n++] && sk !== 'w') Vw(l.x, y, l.door === 'w' && y === dy ? 'door' : (l.id === 'church' && y > l.y && y % 2 ? 'window' : 'wall'), m); }
    for (y = by0; y < by1; y++) { if (!gapAt[n++] && sk !== 'e') Vw(l.x + l.w, y, l.door === 'e' && y === dy ? 'door' : ((l.h >= 6 && l.id !== 'church' ? (y - l.y) % 3 === 1 && R() < 0.6 : y === l.y && l.h > 1 && R() < 0.5 && l.door !== 'e') ? 'window' : 'wall'), m); }
    if (bow) { H(l.x, l.y + 1, 'wall', m); H(l.x + l.w - 1, l.y + 1, 'wall', m); H(l.x, l.y + l.h - 1, 'wall', m); H(l.x + l.w - 1, l.y + l.h - 1, 'wall', m); Vw(l.x + 1, l.y, 'wall', m); Vw(l.x + 1, l.y + l.h - 1, 'wall', m); Vw(l.x + l.w - 1, l.y, 'wall', m); Vw(l.x + l.w - 1, l.y + l.h - 1, 'wall', m); }   // the notches at the four corners
    for (y = l.y; y < l.y + l.h; y++) for (x = l.x; x < l.x + l.w; x++) { if (bow && (x === l.x || x === l.x + l.w - 1) && (y === l.y || y === l.y + l.h - 1)) continue; C.floors[key(x, y)] = b.floor != null ? b.floor : (l.id === 'byre' || l.id === 'boathouse' ? 1 : 0); }
    if (!(V.ruin || l.ruin) || R() < 0.5) C.roofs.push({ tx: l.x, ty: l.y, m: roof });
    if (l.id === 'hall' && l.w >= 8) { l.back = l.x + l.w - 3; l.backDy = l.y + Math.floor(l.h / 2); for (y = l.y; y < l.y + l.h; y++) Vw(l.back, y, y === l.backDy ? 'door' : 'wall', m); }   // the hall's back room: an inner wall with a door, the jarl's chest behind it (raid step 8)
    l.m = m; l.roof = roof; l.dx = dx; l.dy = dy;
    furnish(l); roomCheck(l);
  }
  /* roomCheck(l): the room's things rasterised and tested (docs/interiors-plan.md section 4): the threshold (the door's inside tile and
     the next) free; the lane (a house: the door's column to the far wall; a long house: a tile either side of its fires) free; the
     clear circle (two tiles a house, three a long house) somewhere; every thing within reach of the floor the door reaches. A test
     that fails takes out the optional thing nearest the fault and tries again; what is left failing is written on the lot (l.roomBad)
     for the audit. The hero is 7 units wide here, the walls a tile apart. */
  function roomCheck(l) {
    if (!BUILD[l.id] || BUILD[l.id].open || l.id === 'church' || l.id === 'store' || l.id === 'pit' || l.id === 'bath' || l.id === 'lean' || l.id === 'byre' || l.id === 'boathouse') return;
    var x0 = l.x * T, y0 = l.y * T, x1 = (l.x + l.w) * T, y1 = (l.y + l.h) * T, long = BUILD[l.id].inside === 'hall', HERO = 7, want = long ? 48 : 32, tries = 0, bad = null;
    function things() { return C.items.filter(function (it) { var r = it.r != null ? it.r : (RAD[it.name] != null ? RAD[it.name] : 6); return r > 0 && it.x > x0 - 4 && it.x < x1 + 4 && it.y > y0 - 4 && it.y < y1 + 4; }); }
    function doorIn() { return l.door === 's' ? [l.dx, l.y + l.h - 1, 0, -1] : l.door === 'n' ? [l.dx, l.y, 0, 1] : l.door === 'e' ? [l.x + l.w - 1, l.dy, -1, 0] : [l.x, l.dy, 1, 0]; }
    function clearAt(px, py, S) { var c = Math.min(px - x0, x1 - px, py - y0, y1 - py), i; for (i = 0; i < S.length; i++) { var r = S[i].r != null ? S[i].r : (RAD[S[i].name] != null ? RAD[S[i].name] : 6); c = Math.min(c, Math.hypot(S[i].x - px, S[i].y - py) - r); } return c; }
    while (tries++ < 8) {
      var S = things(), d = doorIn(), fault = null, fx = -1, fy = -1;
      var t1 = [(d[0] + 0.5) * T, (d[1] + 0.5) * T], t2 = [(d[0] + d[2] + 0.5) * T, (d[1] + d[3] + 0.5) * T];
      if (clearAt(t1[0], t1[1], S) < HERO) { fault = 'threshold'; fx = t1[0]; fy = t1[1]; }
      else if (clearAt(t2[0], t2[1], S) < HERO && d[1] + d[3] >= l.y && d[1] + d[3] < l.y + l.h && d[0] + d[2] >= l.x && d[0] + d[2] < l.x + l.w) { fault = 'threshold'; fx = t2[0]; fy = t2[1]; }
      if (!fault && !long) { var k2 = 0, cx2 = d[0], cy2 = d[1]; while (cx2 >= l.x && cx2 < l.x + l.w && cy2 >= l.y && cy2 < l.y + l.h) { var cl = clearAt((cx2 + 0.5) * T, (cy2 + 0.5) * T, S); if (cl < HERO) { fault = 'lane'; fx = (cx2 + 0.5) * T; fy = (cy2 + 0.5) * T; break; } cx2 += d[2]; cy2 += d[3]; if (++k2 > 40) break; } }
      if (!fault) { var best = 0, px, py; for (py = y0 + 8; py < y1; py += 8) for (px = x0 + 8; px < x1; px += 8) { var c3 = clearAt(px, py, S); if (c3 > best) best = c3; } if (best < want) { fault = 'circle'; fx = -1; } }
      if (!fault) {                                       // the reach: the free floor from the door's tile, and every thing beside some of it
        var free = {}, q = [[d[0], d[1]]], qi = 0, seen = {}; seen[key(d[0], d[1])] = 1;
        while (qi < q.length) { var cq = q[qi++]; if (clearAt((cq[0] + 0.5) * T, (cq[1] + 0.5) * T, S) < HERO) continue; free[key(cq[0], cq[1])] = 1; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) { var nx = cq[0] + dd[0], ny = cq[1] + dd[1]; if (nx < l.x || ny < l.y || nx >= l.x + l.w || ny >= l.y + l.h || seen[key(nx, ny)]) return; seen[key(nx, ny)] = 1; q.push([nx, ny]); }); }
        var i3; for (i3 = 0; i3 < S.length && !fault; i3++) { var it = S[i3], r = it.r != null ? it.r : (RAD[it.name] != null ? RAD[it.name] : 6), near = false, kx, ky; for (ky = Math.floor((it.y - r - 20) / T); ky <= Math.floor((it.y + r + 20) / T) && !near; ky++) for (kx = Math.floor((it.x - r - 20) / T); kx <= Math.floor((it.x + r + 20) / T) && !near; kx++) if (free[key(kx, ky)] && Math.hypot((kx + 0.5) * T - it.x, (ky + 0.5) * T - it.y) < r + 40) near = true; if (!near) { fault = 'reach'; fx = it.x; fy = it.y; } }
      }
      if (!fault) { l.roomBad = null; return; }
      bad = fault;
      var cand = C.items.filter(function (it) { return it.opt && it.x > x0 && it.x < x1 && it.y > y0 && it.y < y1; }), pick = null, bd = 1e9;   // the optional thing nearest the fault goes
      cand.forEach(function (it) { var dd2 = fx < 0 ? 0 : Math.hypot(it.x - fx, it.y - fy); if (dd2 < bd) { bd = dd2; pick = it; } });
      if (!pick) break; C.items.splice(C.items.indexOf(pick), 1);
    }
    l.roomBad = bad;
  }
  function furnish(l) {                               // what stands inside, by the building's kind; chests and crates carry the finds
    var cx = l.x + l.w / 2, p, k, U = l.u || {};
    if (BUILD[l.id].inside === 'hall') {
      // A hall: fires down the middle line with open floor between them, the sleeping places at both ends, tables and benches
      // along the far wall with the high seat in its middle, stores by the door wall, and two rows of posts carrying the roof.
      var nH = l.w >= 19 ? 3 : 2, hk, ym = (l.y + l.h / 2) * T, hx = [], dxc = l.dx + 0.5, farE = dxc < l.x + l.w / 2 ? 1 : -1;   // farE: the end farther from the door (the loot deepest), +1 east
      for (hk = 0; hk < nH; hk++) { var hxx = l.x + l.w * (hk + 1) / (nH + 1); if (Math.abs(hxx - dxc) < 1.3) hxx += hxx < dxc ? -1.1 : 1.1; hx.push(hxx); item('stoneHearth', hxx * T, ym + 2, { hearth: true, light: 1 }); }   // (a fire never stands straight in from the door)
      var endIn = l.bow ? 1.5 : 0.7, endOut = l.h - (l.bow ? 1.4 : 0.9), fx = farE > 0 ? l.x + l.w - 0.62 : l.x + 0.62, nx = farE > 0 ? l.x + 0.62 : l.x + l.w - 0.62;
      for (k = endIn; k < endOut; k += 1.7) item('bed', fx * T, (l.y + k) * T, { bed: true });   // the sleeping end, away from the door
      item('bed', nx * T, (l.y + endIn) * T, { bed: true, opt: true });
      var seatX = l.x + l.w / 2, tx2;
      for (tx2 = l.x + 3; tx2 <= l.x + l.w - 3; tx2 += 3.5) { if (Math.abs(tx2 - seatX) < 2.2) continue; item('table', tx2 * T, (l.y + 0.62) * T, { opt: true }); item('bench', tx2 * T, (l.y + 1.3) * T, { seat: true, opt: true }); }
      for (tx2 = l.x + 2.5; tx2 <= l.x + l.w - 2.5; tx2 += 3.5) { if (Math.abs(tx2 - dxc) < 1.6 || Math.abs(tx2 - (farE > 0 ? l.x + 2.5 : l.x + l.w - 2.5)) < 1.2) continue; item('bench', tx2 * T, (l.y + l.h - 0.62) * T, { seat: true, opt: true }); }   // the benches along the door wall too (the sleeping platforms), the door and the stores by it left clear
      if (wealth > 0.5) { item('shieldRack', (seatX - 1.6) * T, (l.y + 0.5) * T, { opt: true }); if (l.w >= 19) item('shieldRack', (seatX + 2.7) * T, (l.y + 0.5) * T, { opt: true }); }
      item('chest', (farE > 0 ? l.x + l.w - 2.2 : l.x + 2.2) * T, (l.y + l.h - 0.6) * T, { store: true, loot: { leather: 2, berries: 3, coin: Math.round((2 + wealth * 6) * hoardK) } });
      var ex2 = farE > 0 ? l.x + 2.1 : l.x + l.w - 2.1, ex3 = farE > 0 ? l.x + 2.9 : l.x + l.w - 2.9;   // the entrance end: the stores by the door wall, the loom and the quern against the far long wall
      if (Math.abs(ex2 - dxc) > 1.4) item('barrel', ex2 * T, (l.y + l.h - 0.55) * T, { opt: true }); if (Math.abs(ex3 - dxc) > 1.4) item('crate', ex3 * T, (l.y + l.h - 0.5) * T, { loot: { meat: 2, berries: 3 }, opt: true });
      if (!l.u || !l.u.hall) { item('loom', (farE > 0 ? l.x + 1.6 : l.x + l.w - 1.6) * T, (l.y + 0.7) * T, { opt: true, work: 'weaver' }); if (R() < 0.6) item('quern', (farE > 0 ? l.x + 3.4 : l.x + l.w - 3.4) * T, (l.y + 0.6) * T, { opt: true, work: 'farmer' }); }
      if (U.hall) { item('chair', seatX * T, (l.y + 0.8) * T, { seat: true, muster: true, jarl: !!U.town }); if (U.heavy) { p = l.back != null ? [(l.back + 1.5) * T, (l.y + 0.7) * T] : [(seatX + 1.15) * T, (l.y + 0.62) * T]; item('chest', p[0], p[1], { heavy: { silver: Math.round((U.town ? 24 + wealth * 36 : 10 + wealth * 18) * hoardK / (RICH[archId] || 1)) }, locked: 1, lore: 'The jarl’s silver.' }); find({ kind: 'jarl', x: p[0], y: p[1] }); } }
      else item('chair', seatX * T, (l.y + 0.8) * T, { seat: true });
      var py0 = l.y + 2, py1 = l.y + l.h - 2, px2;                    // the posts: at tile corners, two rows, every fourth tile, none beside a fire
      for (px2 = l.x + 2; px2 <= l.x + l.w - 2; px2 += 4) { if (hx.some(function (q) { return Math.abs(q - px2) < 0.8; })) continue; C.posts.push([px2, py0]); if (py1 > py0) C.posts.push([px2, py1]); }
    } else if (BUILD[l.id].inside === 'home') {
      // A house: the door end is open floor (a bench, a barrel in the corner), the fire stands off the middle line where the
      // house's two halves meet, a table and a chair against the other long wall, and the far end is where they sleep and keep
      // what they have. The longer the house, the more of it. (It had the same five things at any size.)
      var dS = l.door, LG = dS === 's' || dS === 'n' ? l.h : l.w, AC = dS === 's' || dS === 'n' ? l.w : l.h;
      var at = function (a, c) { return dS === 'w' ? [(l.x + a) * T, (l.y + c) * T] : dS === 'e' ? [(l.x + l.w - a) * T, (l.y + c) * T] : dS === 's' ? [(l.x + c) * T, (l.y + l.h - a) * T] : [(l.x + c) * T, (l.y + a) * T]; };   // a place by how far in from the door end and how far across
      var inH = function (name, a, c, extra) { var q = at(a, c); return item(name, q[0], q[1], extra); };
      // The lane is the door's own column, from the door to the far wall; the hearth stands a column over on the far half; the table
      // against the far wall by the hearth; the beds in the far corners and the chest between them (the loot deepest); the boxes and a
      // bench by the door off the lane; the work thing by the household's calling against the near wall (docs/interiors-plan.md).
      var Lc = Math.max(0, Math.min(AC - 1, (dS === 's' || dS === 'n' ? l.dx - l.x : l.dy - l.y))), side = Lc < AC / 2 ? 1 : -1, hc = Math.max(0, Math.min(AC - 1, Lc + side)), farW = side > 0 ? AC - 1 : 0, nearW = side > 0 ? 0 : AC - 1, nearOk = nearW !== Lc;
      var cc = function (col) { return col + 0.5; }, calling = l.u && l.u.calling || null;
      var hA = LG * 0.5 + (R() < 0.17 ? -1.2 : 0); inH('stoneHearth', hA, cc(hc), { hearth: true, light: 1 });
      inH('bed', LG - 0.62, cc(0), { bed: true }); inH('bed', LG - 0.62, cc(AC - 1), { bed: true }); if (LG >= 8) inH('bed', LG - 2.3, cc(farW), { bed: true, opt: true });
      inH('chest', LG - 0.6, cc(hc), { store: true, loot: { fiber: 3, berries: 2, coin: Math.round(wealth * 3 * hoardK) } });
      if (wealth > 0.6 && R() < 0.5) inH('chest', LG - 0.6, cc(hc) + side * 0.9, { store: true, loot: { coin: Math.round(wealth * 2 * hoardK), leather: 1 }, opt: true });
      if (R() < 0.75) { inH('table', LG * 0.5 + 0.9, cc(farW) + (side > 0 ? -0.1 : 0.1), { opt: true }); inH('chair', LG * 0.5 + 0.2, cc(farW), { seat: true, opt: true }); } else inH('bench', LG * 0.5 + 0.9, cc(farW), { seat: true, opt: true });
      if (nearOk) { inH('bench', 1.7, cc(nearW), { seat: true, opt: true }); inH('barrel', 0.55, cc(nearW), { opt: true }); } else inH('barrel', 0.55, cc(farW), { opt: true });
      if (LG >= 7) inH('crate', 0.55 + (nearOk ? 0 : 1), nearOk ? (Math.abs(Lc - nearW) > 1 ? cc(nearW) + side * 0.95 : cc(farW)) : cc(farW) - 0.9 * side, { loot: { berries: 2, fiber: 2 }, opt: true });   /* (the crate beside the barrel, not on it, and inside the walls: 2026-10-22) */
      var work = calling === 'weaver' ? 'loom' : calling === 'farmer' || calling === 'thrall' ? 'quern' : calling === 'fisher' || calling === 'fisherman' ? 'dryingRack' : calling === 'smith' ? 'workbench' : calling === 'guard' ? 'spearRack' : (R() < 0.5 ? 'quern' : 'shelf');
      inH(work, LG * 0.32 + 1, cc(nearOk ? nearW : farW), { opt: true, work: calling || null, bench: work === 'workbench' ? true : undefined });
      var cupN = wealth > 0.55 ? (R() < 0.5 ? 'cupboard' : 'shelf') : null, cradle = nearOk && LG >= 6 && RD() < 0.35;   // a cradle at the foot of the parents' bed in a third of the houses, where a rich house keeps its cupboard (Robin, 2026-10-22: "Yes to both")
      if (cradle) inH('cradle', LG - 2.0, cc(nearW), { opt: true, r: 5 }); else if (cupN) inH(cupN, LG - 2.0, cc(nearOk ? nearW : farW), { opt: true });
      if (R() < 0.3) inH('stool', hA < LG * 0.5 ? hA + 1.2 : hA - 1.2, cc(hc), { seat: true, opt: true });   // a stool by the fire, on its far side when the fire stands nearer the door (it stood in the fire, 2026-10-22)
    } else if (BUILD[l.id].inside === 'store') {
      var SK = stockK * (0.6 + wealth * 0.8), fm = function (n) { return Math.max(1, Math.round(n * SK)); };   // the stocks: the place's roll and its wealth (raid step 7)
      p = tile(l.x, l.y); item('crate', p[0] + 6, p[1] + 2, { loot: { berries: fm(5), fiber: 4 } }); p = tile(l.x + 1, l.y); item('barrel', p[0] - 4, p[1] + 2, { loot: { meat: fm(3), leather: 1 } });
      p = tile(l.x, l.y + 1); item('crate', p[0] + 6, p[1], { loot: { arrows: 10, wood: 4 } });
      if (SK >= 0.9) { p = tile(l.x + l.w - 1, l.y + l.h - 1); item('sack', p[0] - 6, p[1] - 4, { heavy: { meat: fm(4), berries: fm(6), honey: SK > 1.3 ? 2 : 0 }, sack: true, lore: 'A sack of the store’s food.' }); }   // a full store has a sack to carry to the ship (the Art Director's piece)
      if (SK >= 1.1) { p = tile(l.x + l.w - 1, l.y); prop({ name: 'sackPile', x: p[0] - 4, y: p[1] + 6, solid: 6 }); if (shore && l.door === 's') prop({ name: 'hangingFish', x: (l.dx + 0.5) * T + 18, y: (l.y + l.h) * T + 2, solid: 0 }); }   // the full store shows it
    } else if (BUILD[l.id].inside === 'byre') { p = tile(l.x, l.y); item('haystack', p[0] + 8, p[1] + 4); p = tile(l.x + l.w - 1, l.y + l.h - 1); item('trough', p[0] - 4, p[1] - 4); }
    else if (BUILD[l.id].inside === 'smithy') { p = tile(l.x, l.y); item('furnace', p[0] + 8, p[1] + 2, { furnace: true, light: 1 }); prop({ name: 'forge', x: (l.x + l.w / 2) * T + 4, y: (l.y + l.h / 2) * T + 4, solid: 9 }); p = tile(l.x + l.w - 1, l.y); item('workbench', p[0] - 6, p[1] + 2, { bench: true }); p = tile(l.x + 1, l.y + l.h - 1); item('trough', p[0], p[1]); }
    else if (BUILD[l.id].inside === 'lean') { p = tile(l.x, l.y); item('crate', p[0] + 6, p[1] + 4, { loot: { wood: 3, fiber: 2 } }); p = tile(l.x + l.w - 1, l.y + l.h - 1); item('barrel', p[0] - 4, p[1] - 4); }
    else if (BUILD[l.id].inside === 'bath') { p = tile(l.x, l.y); item('stoneHearth', p[0] + 8, p[1] + 4, { hearth: true, light: 1 }); p = tile(l.x + 1, l.y + 1); item('bench', p[0], p[1] - 4, { seat: true }); }
    else if (BUILD[l.id].inside === 'pit') { p = tile(l.x, l.y); item('campfire', p[0] + 10, p[1] + 6, { hearth: true, light: 1 }); p = tile(l.x + 1, l.y + 1); item('dryingRack', p[0], p[1] - 4); }
    else if (BUILD[l.id].inside === 'church') {
      p = tile(l.x + Math.floor(l.w / 2), l.y); item('altar', p[0] + (l.w % 2 ? 0 : T / 2), p[1] + 2, { r: 6, altar: true, light: 1, lamp: true });
      if (wealth >= G.cryptAt || A.tier >= 5) { p = tile(l.x, l.y); item('trapdoor', p[0] + 14, p[1] + 10, { crypt: true, r: 0, flat: true }); V.secrets.push({ kind: 'crypt', x: p[0] + 14, y: p[1] + 10, cue: 'the trapdoor’s seam behind the altar', way: false }); }   // the trapdoor behind the altar, down to the crypt (raid step 8)
      for (k = l.y + 2; k < l.y + l.h - 1; k++) { p = tile(l.x, k); item('bench', p[0] + 4, p[1] - 4, { seat: true, r: 3 }); p = tile(l.x + l.w - 1, k); item('bench', p[0] - 4, p[1] - 4, { seat: true, r: 3 }); }
      p = tile(l.x + l.w - 1, l.y); item('chest', p[0] - 2, p[1] + 2, { heavy: { silver: Math.round((14 + wealth * 24) * hoardK) }, locked: 1, lore: 'The church’s silver, given by the faithful.' });
      find({ kind: 'silver', x: p[0], y: p[1] });
      prop({ name: 'bellTower', x: l.x * T + 9, y: (l.y + l.h) * T + 8, solid: 14, landmark: true });                            // the tower at the front corner, like a west tower
      prop({ name: 'porch', x: (l.dx + 0.5) * T, y: (l.y + l.h) * T + 9, solid: 0 });                                            // the porch over the door (solid 0: a face, kept at the door; it was cleared away as a solid thing until 2026-10-22)
      prop({ name: 'apse', x: (l.x + l.w / 2) * T, y: (l.y - 1.7) * T });                                                            // the rounded east end beyond the far gable
      prop({ name: 'gableCross', x: (l.x + l.w / 2) * T, y: (l.y + l.h) * T + 2.5 });                                            // the cross on the gable's peak
      p = tile(l.x + l.w - 1, l.y + l.h - 1); item('font', p[0] - 2, p[1] + 2, { r: 4 });                                     // the font by the door
      prop({ name: 'wayCross', x: (l.x + l.w) * T + 14, y: (l.y + l.h) * T + 20, solid: 3 });
      var gi, gn = 4 + Math.floor(R() * 5);
      for (gi = 0; gi < gn; gi++) { var gx = (l.x + l.w + 0.25 + R() * 0.7) * T, gy = (l.y + 0.6 + R() * (l.h - 0.8)) * T; prop({ name: 'graveStone', x: gx, y: gy, solid: 2 }); }   // the churchyard along the east side
      prop({ name: 'yew', x: (l.x + l.w + 1.3) * T, y: (l.y + 0.9) * T, solid: 7 });
    }
    else if (BUILD[l.id].inside === 'boat') { find({ kind: 'boat', x: tile(l.x + l.w / 2, l.y + 1)[0], y: tile(l.x, l.y + 1)[1], lot: l }); p = tile(l.x, l.y); item('barrel', p[0] + 6, p[1] + 2, { loot: { fiber: 4 } }); }
    // things by the door: a woodpile, a barrel, a bench, bee skeps, a cart (the brewer's place: barrels first)
    var dp = l.door === 's' ? tile(l.dx, l.y + l.h) : l.door === 'e' ? tile(l.x + l.w, l.dy) : l.door === 'w' ? tile(l.x - 1, l.dy) : tile(l.dx, l.y - 1), pool = ['woodpile', 'barrel', 'bench', 'beeSkeps', 'cart', 'dryingRack', 'crate', 'logSeat', 'trough', 'haystack', 'quern'];   /* (the quern: the Art Director's yard pieces, 2026-10-20) */
    if (story === 'brewer') pool = ['barrel', 'barrel', 'bench', 'barrel'].concat(pool);
    dab(dp[0], dp[1] + (l.door === 's' ? 6 : 0), 7, 1);                                                                           // a worn step at every door
    if (!V.ruin && !l.ruin && l.door === 's' && l.id !== 'church' && (l.id === 'house' ? R() < 0.25 : l.big && R() < 0.5)) prop({ name: 'porch', x: (l.dx + 0.5) * T, y: (l.y + l.h) * T + 9, solid: 0 });   // a porch over one door in four, one longhouse in two (the varied silhouettes, 2026-10-22)
    var nd = Math.round(G.doorProps + (R() - 0.5)), di2, used = {};
    for (di2 = 0; di2 < nd; di2++) { var by = pool[Math.floor(R() * pool.length)]; if (used[by]) continue; used[by] = 1; var sideS = di2 % 2 ? 1 : -1, off = l.door === 's' ? [T * (1.2 + 0.5 * di2) * sideS, 6 + R() * 6] : l.door === 'e' ? [10 + R() * 8, T * (1.0 + 0.6 * di2) * sideS] : l.door === 'w' ? [-10 - R() * 8, T * (1.0 + 0.6 * di2) * sideS] : [T * (1.2 + 0.5 * di2) * sideS, -8]; prop({ name: by, x: dp[0] + off[0], y: dp[1] + off[1], loot: by === 'barrel' || by === 'crate' ? { berries: 2, fiber: 2 } : null }); }
    if (l.big && l.door === 's') { var wp = tile(l.x + l.w, l.y + l.h); if (wp[0] / T > (C.w || 1e9) - 1.5) wp = tile(l.x - 1, l.y + l.h); prop({ name: G.clutter ? 'woodshed' : 'woodpile', x: wp[0] + 8, y: wp[1] + 4, solid: 9 }); prop({ name: 'choppingBlock', x: wp[0] + 36 * (wp[0] / T > l.x ? 1 : -1), y: wp[1] + 12, block: true }); }
    if (l.id === 'house' && l.door === 's' && R() < 0.5 && l.y >= 1) prop({ name: 'washingLine', x: (l.x + l.w / 2) * T, y: l.y * T - 14, solid: 4 });   // washing behind one house in two (the yard pieces, 2026-10-20)
    if (l.big && U.hall && l.door === 's') { prop({ name: 'spearRack', x: (l.dx + 2.2) * T, y: (l.y + l.h) * T + 6, solid: 4 }); }   // the hall's spears by its door
    // things against the walls (Robin, 2026-10-07: lived-in like the reference): a window box under every south window, a lantern by
    // the door that is lit at night, an awning on the open-fronted buildings, a sign on the hall and the trading stores
    if (G.clutter && !V.ruin) {
      var wy = (l.y + l.h) * T;
      l.wins.forEach(function (wx) { item('windowBox', (wx + 0.5) * T, wy + 4, { r: 0, wall: true }); });
      if (l.door === 's' && (l.big || l.id === 'house' || l.id === 'bath')) item(l.big && U.hall ? 'torchBracket' : 'lantern', l.dx * T - 6, wy + 2, { r: 0, wall: true, light: 1, lamp: true });   /* (a torch in a bracket at a hall's door, a lantern elsewhere: the night raid's light) */
      if (l.door === 's' && (l.id === 'store' || l.id === 'smithy' || l.id === 'boathouse')) item('awning', (l.dx < l.x + l.w / 2 ? (l.x + l.w - 0.6) : (l.x + 0.6)) * T, wy + 9, { r: 2 });
      if (l.door === 's' && ((U.hall && l.big) || (U.stores && l.id === 'store'))) item('sign', l.dx * T + T + 7, wy + 2, { r: 0, wall: true });
    }
  }
  // ---- a unit grown on its own (canonical: its front south), then stamped into the place turned to face its street ----
  /* ringUnit(U): the ring plan round a yard (docs/villages.md): the big building north of the yard with its door to it, houses
     round it, outbuildings behind, the fire in the middle; U { kind, big, long, houses, out, yard, w, h, compact (a farm inside a
     village: everything hugs its small yard and the box is tight), slots, outs, firePit, well, stores, shore, hall, heavy, town,
     market, fence, zone, yardDy, bigX }. Returns the unit's box with everything in it, and its front: the opening in its south side. */
  function ringUnit(U) {
    var L = newBox(U.w, U.h), old = C; C = L;
    var yw = U.yard[0], yh = U.yard[1], yx = Math.floor((U.w - yw) / 2), yy = Math.floor((U.h - yh) / 2) + (U.yardDy != null ? U.yardDy : 1);
    L.yard = { x: yx, y: yy, w: yw, h: yh };
    function fits(lot) {
      if (lot.x < 1 || lot.y < 1 || lot.x + lot.w > U.w - 1 || lot.y + lot.h > U.h - 1) return false;
      if (overlaps(lot, L.yard, G.yardGap - 1)) return false;
      for (var i = 0; i < L.lots.length; i++) if (overlaps(lot, L.lots[i], U.compact ? 1 : G.gap)) return false;
      return true;
    }
    function tryPlace(lot, jitter) {                   // the lot where asked, or shuffled a little until it fits
      var k, best = null; for (k = 0; k < 12; k++) { var dx = k ? Math.round((R() - 0.5) * 2 * jitter) : 0, dy = k ? Math.round((R() - 0.5) * 2 * jitter) : 0, l = { x: lot.x + dx, y: lot.y + dy, w: lot.w, h: lot.h, id: lot.id, door: lot.door, slot: lot.slot, big: !!lot.big, u: { kind: U.kind, hall: U.hall, heavy: U.heavy, town: U.town, stores: U.stores, calling: lot.id === 'house' || lot.id === 'longhouse' ? rollCalling() : null }, mstep: lot.mstep }; if (fits(l)) { best = l; break; } }
      if (best) L.lots.push(best); return best;
    }
    var bigId = U.big, bs = bigId === 'house' ? houseSize('s') : size(bigId, 's', U.long), bigLot = null, shrink;
    for (shrink = 0; shrink < 4 && !bigLot; shrink++) { bigLot = tryPlace({ id: bigId, x: yx + Math.floor((yw - bs.w) / 2) + Math.round((R() - 0.5) * 2) + (U.bigX || 0), y: yy - G.yardGap - bs.h, w: bs.w, h: bs.h, door: 's', slot: 'n', big: true }, 1); if (!bigLot && bs.w > 4) bs.w -= 2; }
    if (!bigLot) { C = old; return null; }
    var gxm = yx + Math.floor(yw / 2), hx0 = bigLot.x, hx1 = bigLot.x + bigLot.w;
    // the houses: beside the yard east and west, running back from it with their doors to it; south of it either side of the way in,
    // their doors to that way; and north, either side of the big building, deep, their gables south. A long yard takes two a side.
    var nHouses = pickRange(R, U.houses, 0), slots = U.slots || ['e', 'w', 'se', 'sw', 'ne', 'nw'].concat(yh >= 11 ? ['e2', 'w2'] : []), order = slots.slice().sort(function () { return R() - 0.5; }), placedHouses = 0, si, usedSlot = {};
    for (si = 0; si < order.length && placedHouses < nHouses; si++) {
      if (!U.full && R() < G.emptySlots && si < order.length - 1) continue;
      var sl = order[si], door = sl === 'e' || sl === 'e2' || sl === 'se' ? 'w' : (sl === 'w' || sl === 'w2' || sl === 'sw' ? 'e' : 's'), hs, lot = null, two = yh >= 11, below = U.compact ? 1 : Math.max(G.yardGap, G.gap);
      if (U.compact && (sl === 'se' || sl === 'sw')) door = 's';   // a farm's house flanks the way in, its door to the street
      hs = houseSize(door, U.houseLen);
      if (sl === 'e') lot = { x: yx + yw + G.yardGap, y: yy + 1 + (two ? 0 : Math.floor(R() * Math.max(1, yh - hs.h))) };
      else if (sl === 'e2') lot = { x: yx + yw + G.yardGap, y: yy + yh - hs.h };
      else if (sl === 'w') lot = { x: yx - G.yardGap - hs.w, y: yy + 1 + (two ? 0 : Math.floor(R() * Math.max(1, yh - hs.h))) };
      else if (sl === 'w2') lot = { x: yx - G.yardGap - hs.w, y: yy + yh - hs.h };
      else if (sl === 'se') lot = { x: gxm + 2, y: yy + yh + below };
      else if (sl === 'sw') lot = { x: gxm - 2 - hs.w, y: yy + yh + below };
      else if (sl === 'ne') lot = { x: Math.max(yx + yw + G.yardGap + 1, hx1 + (U.compact ? 1 : G.gap)), y: yy - 2 - hs.h };
      else lot = { x: Math.min(yx - G.yardGap - hs.w - 1, hx0 - (U.compact ? 1 : G.gap) - hs.w), y: yy - 2 - hs.h };
      lot.door = door; lot.w = hs.w; lot.h = hs.h; lot.id = 'house'; lot.slot = sl;
      if (tryPlace(lot, 1)) { placedHouses++; usedSlot[sl] = 1; }
    }
    L.lots.filter(function (l) { return l.id === 'house' && (l.door === 's' || l.door === 'n'); }).forEach(function (hl) {   // a lean-to against one house in three, under its own lower roof, sharing the house's wall (the varied silhouettes, 2026-10-22)
      if (R() > 0.34) return; var lw = 2 + Math.floor(R() * 2), east = R() < 0.5, ll = { id: 'lean', x: east ? hl.x + hl.w : hl.x - lw, y: hl.y + 1 + Math.floor(R() * Math.max(1, hl.h - 3)), w: lw, h: 2, door: hl.door, slot: 'lean', big: false, u: U, skip: east ? 'w' : 'e', parent: hl };
      if (ll.x < 1 || ll.y < 1 || ll.x + ll.w > U.w - 1 || ll.y + ll.h > U.h - 1) return; if (overlaps(ll, L.yard, G.yardGap - 1)) return; var i2; for (i2 = 0; i2 < L.lots.length; i2++) { if (L.lots[i2] === hl) continue; if (overlaps(ll, L.lots[i2], 1)) return; } L.lots.push(ll);
    });
    // the outbuildings: each near what it serves (a smithy at the edge for its fire; the store by the big house; the byre by a house)
    var outs = (U.outs || ['store', 'byre', 'smithy', 'pit', 'bath']).slice(), nOut = pickRange(R, U.out, 0), placedOut = 0, oi;
    if (story === 'smith' && outs.indexOf('smithy') >= 0 && U.kind === 'farm') { outs.splice(outs.indexOf('smithy'), 1); outs.unshift('smithy'); }
    if (U.stores) outs.unshift('store'); if (U.shore && !U.compact) outs.unshift('boathouse');
    var L0 = bigLot;
    for (oi = 0; oi < outs.length && placedOut < nOut; oi++) {
      var id = outs[oi], os, lot2 = null, ok2 = false, fb, fi;
      if (U.compact) {                                   // a farm's: in the slots left round its small yard, long side away from the yard
        var cs = ['e', 'w', 'se', 'sw', 'ne', 'nw'].filter(function (q) { return !usedSlot[q]; }).sort(function () { return R() - 0.5; }), ci;
        if (id === 'byre') cs.sort(function (p, q) { return (p === 'e' || p === 'w' ? 0 : 1) - (q === 'e' || q === 'w' ? 0 : 1); });
        if (id === 'smithy') cs.sort(function (p, q) { return (p === 'se' || p === 'sw' ? 0 : 1) - (q === 'se' || q === 'sw' ? 0 : 1); });
        for (ci = 0; ci < cs.length && !ok2; ci++) {
          var s3 = cs[ci], dr = s3 === 'e' ? 'w' : s3 === 'w' ? 'e' : 's'; os = size(id, dr);
          if (s3 === 'e') lot2 = { x: yx + yw + G.yardGap, y: yy + Math.floor(R() * Math.max(1, yh - os.h + 1)) };
          else if (s3 === 'w') lot2 = { x: yx - G.yardGap - os.w, y: yy + Math.floor(R() * Math.max(1, yh - os.h + 1)) };
          else if (s3 === 'se') lot2 = { x: gxm + 2, y: yy + yh + 1 };
          else if (s3 === 'sw') lot2 = { x: gxm - 2 - os.w, y: yy + yh + 1 };
          else if (s3 === 'ne') lot2 = { x: hx1 + 1, y: L0.y };
          else lot2 = { x: hx0 - 1 - os.w, y: L0.y };
          lot2.w = os.w; lot2.h = os.h; lot2.id = id; lot2.slot = 'out'; lot2.door = dr;
          if (tryPlace(lot2, 1)) { ok2 = true; usedSlot[s3] = 1; }
        }
      } else {
        os = size(id, 's');
        var rx0 = 1e9, ry0 = 1e9, rx1 = -1e9, ry1 = -1e9; L.lots.forEach(function (l) { rx0 = Math.min(rx0, l.x); ry0 = Math.min(ry0, l.y); rx1 = Math.max(rx1, l.x + l.w); ry1 = Math.max(ry1, l.y + l.h); });   // the ring so far: outbuildings hug it
        if (id === 'store') lot2 = { x: L0.x + L0.w + G.gap + Math.floor(R() * 2), y: L0.y - 1 + Math.floor(R() * 2), door: 's' };
        else if (id === 'byre') { var hh = L.lots.filter(function (l) { return l.id === 'house'; }), nb = hh.length ? hh[Math.floor(R() * hh.length)] : L0; lot2 = { x: nb.x + (nb.slot === 'w' || nb.slot === 'sw' || nb.slot === 'nw' ? -os.w - G.gap : nb.w + G.gap), y: nb.y, door: 's' }; }
        else if (id === 'smithy') lot2 = { x: R() < 0.5 ? rx0 - os.w - G.gap : rx1 + G.gap, y: ry1 - os.h, door: 's' };
        else if (id === 'pit') lot2 = { x: rx0 - os.w - G.gap, y: yy + Math.floor(R() * yh), door: 'e' };
        else if (id === 'bath') lot2 = U.shore === 'e' ? { x: rx1 + G.gap, y: yy + yh, door: 'w' } : { x: rx1 - os.w, y: ry0 - os.h - G.gap, door: 's' };
        else if (id === 'boathouse') lot2 = U.shore === 's' ? { x: yx + Math.floor(R() * 3) - 1, y: U.h - os.h - 1, door: 's' } : U.shore === 'n' ? { x: yx, y: 1, door: 's' } : U.shore === 'e' ? { x: U.w - os.w - 1, y: yy + yh + 2, door: 's' } : { x: 1, y: yy + yh + 2, door: 's' };
        if (lot2 && lot2.door === 'e') os = size(id, 'e');
        lot2.w = os.w; lot2.h = os.h; lot2.id = id; lot2.slot = 'out';
        ok2 = !!tryPlace(lot2, 2);
        if (!ok2 && id !== 'boathouse') {    // no room where it belongs: by the big building's other end or behind it, else along the outside of what stands
          fb = id === 'store' ? [[L0.x - os.w - G.gap, L0.y], [hx1 + G.gap, L0.y], [hx0 - os.w - G.gap, L0.y], [L0.x + 2, L0.y - os.h - G.gap], [L0.x + L0.w - os.w - 2, L0.y - os.h - G.gap]] : [];
          for (fi = 0; fi < 4; fi++) { fb.push([rx1 + G.gap, ry0 + 1 + fi * 5]); fb.push([rx0 - os.w - G.gap, ry0 + 1 + fi * 5]); }
          for (fi = 0; fi < fb.length && !ok2; fi++) ok2 = !!tryPlace({ x: fb[fi][0], y: fb[fi][1], w: os.w, h: os.h, id: id, slot: 'out', door: lot2.door }, 1);
        }
      }
      if (ok2) placedOut++;
    }
    L.lots.forEach(pieces);
    // the yard: the fire in its middle with logs to sit on (a campfire in a poor farm), the well off to the north-east, a cart, a laid table
    var wc = tile(yx + Math.floor(yw / 2), yy + Math.floor(yh / 2)), fc = [wc[0] - T * 0.2, wc[1] + T * 0.2];
    if (U.well && wealth > 0.3) item('woodenWell', wc[0] + T * (yw >= 7 ? 1.9 : 1.4), wc[1] - T * (yh >= 5 ? 1.1 : 0.7));
    if (U.firePit && G.firePit) { item('firePit', fc[0], fc[1], { hearth: true, light: 1, pit: true }); var ns = Math.round(G.logSeats * (U.compact ? 0.5 : 1)), si2; for (si2 = 0; si2 < ns; si2++) { var sa = -0.9 + si2 * (1.8 / Math.max(1, ns - 1)) + 1.57, sx2 = fc[0] + Math.cos(sa) * 38, sy2 = fc[1] + Math.sin(sa) * 24 + 8; if (Math.abs(Math.cos(sa)) < 0.35 && Math.sin(sa) < 0) continue; item('logSeat', sx2, sy2, { seat: true, fire: true }); } find({ kind: 'fire', x: fc[0], y: fc[1] }); }
    else if (U.fire !== false) item('campfire', fc[0], fc[1], { hearth: true, light: 1 });
    if (yw >= 7 && R() < 0.6) prop({ name: 'cart', x: yx * T + T * 0.9, y: (yy + yh) * T - T * 0.5 });
    if (G.clutter && !V.ruin && yw >= 7 && (U.table || story === 'brewer')) { item('foodTable', wc[0] + T * 2.4, wc[1] + T * 1.2, { r: 7 }); item('bench', wc[0] + T * 2.4, wc[1] + T * 1.2 + 15, { seat: true }); }
    if (U.compact && R() < 0.5 && L0.y >= 2) prop({ name: 'midden', x: (L0.x + L0.w - 1) * T, y: (L0.y - 0.8) * T, solid: 8 });   // the midden behind the longhouse
    if (G.yardEarth) earthPatch(wc[0], wc[1], yw * T * 0.42, yh * T * 0.42, U.compact ? 0.75 : 0.85);
    L.front = [gxm - 2, gxm + 2]; L.wc = wc; L.big = L0;
    if (U.h - (yy + yh) > 1.5) strokeTo([(gxm + 0.5) * T, U.h * T], [(gxm + 0.5) * T, (yy + yh) * T], 7, 2);   // the lane from the gap to the yard
    C = old; return L;
  }
  /* plotUnit(U): a town's or a trading post's plot (Ribe, Hedeby, the burgage plot): narrow, its short side to the street; the house
     at the front with its gable and door to the street, a workshop or a store behind it, the midden and the woodpile at the back.
     U { w, h, ac (the house across), len (its length range), behind ('pit' | 'store' | 'smithy' | null), mstep, fence, quarter }. */
  function plotUnit(U) {
    var L = newBox(U.w, U.h), old = C; C = L;
    var ac = Math.min(U.ac || 4, U.w - 2), len = Math.min(pickRange(R, U.len || [6, 7], 0), U.h - 3), hx = 1 + Math.floor(R() * Math.max(1, U.w - 1 - ac)), hy = U.h - 1 - len;
    var hl = { id: 'house', x: hx, y: hy, w: ac, h: len, door: 's', slot: 'plot', big: false, u: { kind: U.kind, stores: U.stores, calling: U.quarter === 'merchant' ? 'merchant' : U.quarter === 'gate' ? 'guard' : rollCalling() }, mstep: U.mstep, ruin: U.ruin }; L.lots.push(hl);
    if (U.behind && hy >= 4) { var bs = size(U.behind, 's'); if (bs.h <= hy - 2 && bs.w <= U.w - 2) L.lots.push({ id: U.behind, x: 1 + Math.floor(R() * Math.max(1, U.w - 1 - bs.w)), y: hy - 1 - bs.h, w: bs.w, h: bs.h, door: 's', slot: 'plot', u: U }); }
    L.lots.forEach(pieces);
    if (hy >= 2) { if (R() < 0.7) prop({ name: 'woodpile', x: (U.w - 1.4) * T, y: (hy - 0.7) * T, solid: 6 }); if (R() < 0.35) prop({ name: 'midden', x: 1.3 * T, y: 1.0 * T, solid: 7 }); }
    L.yard = { x: 1, y: 1, w: U.w - 2, h: Math.max(1, hy - 1) };
    L.front = [0, U.w]; L.wc = [(hl.dx + 0.5) * T, U.h * T]; L.big = hl; L.plot = true;
    C = old; return L;
  }
  // stamp(L, U): the unit's box carried into the place at U.x, U.y, turned so its front faces U.front ('s' as grown, 'n' mirrored,
  // 'e' and 'w' turned on their side); every edge, tile, point and lot goes through the one transform
  function stamp(L, U) {
    var fr = U.front || 's', ux = U.x, uy = U.y, uw = U.w, uh = U.h;
    function P(u, v) { return fr === 's' ? [ux + u, uy + v] : fr === 'n' ? [ux + u, uy + uh - v] : fr === 'e' ? [ux + v, uy + u] : [ux + uh - v, uy + u]; }
    function PT(x, y) { var q = P(x + 0.5, y + 0.5); return [Math.floor(q[0]), Math.floor(q[1])]; }
    function PU(x, y) { var q = P(x / T, y / T); return [q[0] * T, q[1] * T]; }
    function rect(r) { var a = P(r.x, r.y), b = P(r.x + r.w, r.y + r.h); return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), h: Math.abs(b[1] - a[1]) }; }
    function edge(x0, y0, x1, y1, e) { var a = P(x0, y0), b = P(x1, y1); if (a[1] === b[1]) V.H[key(Math.min(a[0], b[0]), a[1])] = e; else V.V[key(a[0], Math.min(a[1], b[1]))] = e; }
    var k, q, base = V.lots.length;
    for (k in L.H) { q = k.split(','); edge(+q[0], +q[1], +q[0] + 1, +q[1], L.H[k]); }
    for (k in L.V) { q = k.split(','); edge(+q[0], +q[1], +q[0], +q[1] + 1, L.V[k]); }
    for (k in L.floors) { q = k.split(','); var t2 = PT(+q[0], +q[1]); V.floors[key(t2[0], t2[1])] = L.floors[k]; }
    L.posts.forEach(function (p) { var a = P(p[0], p[1]); V.posts.push([a[0], a[1]]); });
    L.roofs.forEach(function (r) { var t3 = PT(r.tx, r.ty); V.roofs.push({ tx: t3[0], ty: t3[1], m: r.m }); });
    function pt(o) { var a = PU(o.x, o.y); o.x = a[0]; o.y = a[1]; return o; }
    L.items.forEach(function (o) { V.items.push(pt(o)); }); L.props.forEach(function (o) { V.props.push(pt(o)); }); L.paints.forEach(function (o) { V.paints.push(pt(o)); }); L.finds.forEach(function (o) { V.finds.push(pt(o)); });
    L.lots.forEach(function (l) {
      var r = rect(l), nl = { x: r.x, y: r.y, w: r.w, h: r.h, id: l.id, slot: l.slot, m: l.m, roof: l.roof, big: !!l.big, unit: U.index, wins: [], bow: l.bow || 0, lean: l.skip ? 1 : 0, roomBad: l.roomBad || null, calling: l.calling || (l.u && l.u.calling) || null };
      var d0, d1; if (l.door === 's') { d0 = [l.dx, l.y + l.h]; d1 = [l.dx + 1, l.y + l.h]; } else if (l.door === 'n') { d0 = [l.dx, l.y]; d1 = [l.dx + 1, l.y]; } else if (l.door === 'e') { d0 = [l.x + l.w, l.dy]; d1 = [l.x + l.w, l.dy + 1]; } else { d0 = [l.x, l.dy]; d1 = [l.x, l.dy + 1]; }
      var a = P(d0[0], d0[1]), b = P(d1[0], d1[1]);
      if (a[1] === b[1]) { nl.dx = Math.min(a[0], b[0]); nl.dy = -1; nl.door = a[1] === nl.y ? 'n' : 's'; } else { nl.dy = Math.min(a[1], b[1]); nl.dx = -1; nl.door = a[0] === nl.x ? 'w' : 'e'; }
      if (l.back != null) { nl.back = l.back + ux; nl.backDy = l.backDy + uy; }   // (a hall stands as grown, its front south, so the back room's wall carries over as it is)
      nl.u = l.u; V.lots.push(nl);
    });
    var yard = rect(L.yard); V.yards.push(yard);
    var fa = P(L.front[0], U.h), fb = P(L.front[1], U.h), bigLot = V.lots[base + L.lots.indexOf(L.big)];
    var unit = { kind: U.kind, index: U.index, x: ux, y: uy, w: fr === 's' || fr === 'n' ? uw : uh, h: fr === 's' || fr === 'n' ? uh : uw, front: fr, yard: yard, plot: !!L.plot, roomy: !!U.roomy, gap: [Math.min(fa[0], fb[0]), Math.min(fa[1], fb[1]), Math.max(fa[0], fb[0]), Math.max(fa[1], fb[1])], lots: V.lots.slice(base), big: bigLot, fence: U.fence || null, hall: !!U.hall, church: !!U.church, zone: U.zone || 'semi', quarter: U.quarter || null };
    unit.gapC = [(unit.gap[0] + unit.gap[2]) / 2 * T, (unit.gap[1] + unit.gap[3]) / 2 * T];
    var wq = PU(L.wc[0], L.wc[1]); unit.wc = wq;
    V.units.push(unit); return unit;
  }
  // the unit's own fence on its box, with the gap where its lane meets the street (a plot: only the back and the sides behind the house)
  function fencePoly(box, kind, gaps, openSide, uIndex) {   // the drawn fence (Robin, 2026-10-22, through the Art Director: angled runs following the land, never a right angle but a building's): corners pulled off the grid, a point or two more on a long side, posts a tile apart with a kink each; the raid's barrier is the hidden edge on the box, within a tile of it
    var X0 = box.x * T, Y0 = box.y * T, X1 = (box.x + box.w) * T, Y1 = (box.y + box.h) * T, pts = [], k, e, cs = [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], sides = ['n', 'e', 's', 'w'];
    function jit(a, b) { return a + R() * (b - a); }
    for (k = 0; k < 4; k++) {
      var c = cs[k], nx = c[0] === X0 ? 1 : -1, ny = c[1] === Y0 ? 1 : -1; pts.push({ p: [c[0] + nx * jit(3, 22), c[1] + ny * jit(3, 22)], side: sides[k] });
      var nxt = cs[(k + 1) % 4], len = Math.hypot(nxt[0] - c[0], nxt[1] - c[1]), extra = len > 22 * T ? 2 : len > 10 * T ? 1 : 0, inward = k === 0 ? [0, 1] : k === 1 ? [-1, 0] : k === 2 ? [0, -1] : [1, 0];
      for (e = 1; e <= extra; e++) { var u = (e + (R() - 0.5) * 0.3) / (extra + 1), mx = c[0] + (nxt[0] - c[0]) * u, my = c[1] + (nxt[1] - c[1]) * u, d = jit(-4, 20); pts.push({ p: [mx + inward[0] * d, my + inward[1] * d], side: sides[k] }); }
    }
    var fi = V.fences.length, F2 = { kind: kind, unit: uIndex == null ? null : uIndex, pts: pts.map(function (q) { return q.p; }), gaps: gaps || [], open: openSide || null }, run = 0, i = 0, j;
    function inGap(px, py) { var g2; for (g2 = 0; g2 < F2.gaps.length; g2++) { var g = F2.gaps[g2]; if (px > g[0] - 10 && px < g[2] + 10 && py > g[1] - 10 && py < g[3] + 10) return true; } return false; }
    for (j = 0; j < pts.length; j++) {
      var a = pts[j], b = pts[(j + 1) % pts.length]; if (openSide && a.side === openSide) { run++; continue; }
      var dx = b.p[0] - a.p[0], dy = b.p[1] - a.p[1], len2 = Math.hypot(dx, dy) || 1, ux = dx / len2, uy = dy / len2, s2, was = false;
      for (s2 = 0; s2 < len2 - 10; s2 += 26 + R() * 12) { var px = a.p[0] + ux * s2 + (-uy) * (R() - 0.5) * 6, py = a.p[1] + uy * s2 + ux * (R() - 0.5) * 6; if (inGap(px, py) || (V.ruin && R() < 0.3)) { if (was) run++; was = false; continue; } prop({ name: 'railPost', x: px, y: py, solid: 3, v: Math.floor(R() * 3), fence: fi, run: run, i: i++ }); was = true; }
    }
    V.fences.push(F2); return F2;
  }
  function unitFence(u, kind, m) {
    var x, y, X0 = u.x, Y0 = u.y, X1 = u.x + u.w, Y1 = u.y + u.h, g = u.gap, keep2 = function () { return !(V.ruin && R() < 0.4); }, hid = kind === 'rail' || kind === 'fence';
    function inGap(x0, y0, x1, y1) { return x0 >= g[0] && x1 <= g[2] && y0 >= g[1] && y1 <= g[3]; }
    function frontSide(x0, y0, x1, y1) { return u.plot && ((u.front === 's' && y0 === Y1) || (u.front === 'n' && y0 === Y0) || (u.front === 'e' && x0 === X1) || (u.front === 'w' && x0 === X0)); }
    function nearFront(x0, y0, x1, y1) { if (!u.plot) return false; return (u.front === 's' && y1 > Y1 - 2) || (u.front === 'n' && y0 < Y0 + 2) || (u.front === 'e' && x1 > X1 - 2) || (u.front === 'w' && x0 < X0 + 2); }
    for (x = X0; x < X1; x++) { if (!inGap(x, Y0, x + 1, Y0) && !frontSide(x, Y0, x + 1, Y0) && !nearFront(x, Y0, x + 1, Y0) && keep2() && !V.H[key(x, Y0)]) H(x, Y0, kind, m, hid); if (!inGap(x, Y1, x + 1, Y1) && !frontSide(x, Y1, x + 1, Y1) && !nearFront(x, Y1, x + 1, Y1) && keep2() && !V.H[key(x, Y1)]) H(x, Y1, kind, m, hid); }
    for (y = Y0; y < Y1; y++) { if (!inGap(X0, y, X0, y + 1) && !frontSide(X0, y, X0, y + 1) && !nearFront(X0, y, X0, y + 1) && keep2() && !V.V[key(X0, y)]) Vw(X0, y, kind, m, hid); if (!inGap(X1, y, X1, y + 1) && !frontSide(X1, y, X1, y + 1) && !nearFront(X1, y, X1, y + 1) && keep2() && !V.V[key(X1, y)]) Vw(X1, y, kind, m, hid); }
    u.fence = kind;
    if (hid && !u.plot) fencePoly({ x: u.x, y: u.y, w: u.w, h: u.h }, kind, [[g[0] * T, g[1] * T, g[2] * T, g[3] * T]], null, u.index);   // a farm's fence drawn as posts round its box; a plot's fence stays an edge (its sides are the lanes between plots)
  }
  // ---- the place: the focus, the spine and the growth ----
  var focus = null, green = null, spinePts = [], gateX = null, backGateX = null, hugRects = [], placeLots = [], approachPl = null, exitPl = null;
  function samplePts(pl) { var out = [], i; for (i = 0; i < pl.pts.length - 1; i++) { var a = pl.pts[i], b = pl.pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.5)), k; for (k = 0; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return out; }
  function resample() { spinePts = []; V.spine.forEach(function (pl) { samplePts(pl).forEach(function (p) { spinePts.push(p); }); }); }
  function boxFree(bx, by, bw, bh, margin) {           // a unit's box: inside the site, off the other units, the green and the roads
    var y1 = ty + h - 1, i;
    if (bx < tx + 1 || by < ty + 1 || bx + bw > tx + w - 1 || by + bh > y1) return false;
    for (i = 0; i < V.units.length; i++) { var u = V.units[i]; if (overlaps({ x: bx, y: by, w: bw, h: bh }, u, G.unitGap + (u.roomy ? 1 : 0) + (margin != null && margin > 1 ? margin - 1 : 0))) return false; }   // (a tile more beside a church or a hall: their tall roofs reach over a neighbour, the Art Director's review, 2026-10-22)
    for (i = 0; i < placeLots.length; i++) if (overlaps({ x: bx, y: by, w: bw, h: bh }, placeLots[i], 1)) return false;
    if (green && overlaps({ x: bx, y: by, w: bw, h: bh }, green, 1)) return false;
    var m2 = margin == null ? 1 : margin;
    for (i = 0; i < spinePts.length; i++) { var p = spinePts[i]; if (p[0] > bx - m2 && p[0] < bx + bw + m2 && p[1] > by - m2 && p[1] < by + bh + m2) return false; }
    return true;
  }
  function wander(x0, x1, y0, amp) {                    // a street from x0 to x1 that wanders a little with the land
    var pts = [], x = x0, yv = y0, dir = x1 > x0 ? 1 : -1, a2 = amp == null ? 3 : amp; if (Math.abs(x1 - x0) < 2) return [[x0, y0], [x1, y0]];
    while (true) { pts.push([x, yv]); if ((x1 - x) * dir <= 0.01) break; x += dir * Math.min(8, Math.abs(x1 - x)); yv = clamp(yv + (R() - 0.5) * 3, y0 - a2, y0 + a2); }
    pts[pts.length - 1][0] = x1; return pts;
  }
  function wanderV(y0, y1, x0, amp) { var pts = wander(y0, y1, x0, amp); return pts.map(function (p) { return [p[1], p[0]]; }); }
  function yAt(pl, x) { var pts = pl.pts, i; for (i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1]; if ((x - a[0]) * (x - b[0]) <= 0 && a[0] !== b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return pts[x < pts[0][0] ? 0 : pts.length - 1][1]; }
  function xAt(pl, y) { var pts = pl.pts, i; for (i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1]; if ((y - a[1]) * (y - b[1]) <= 0 && a[1] !== b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); } return pts[y < pts[0][1] ? 0 : pts.length - 1][0]; }
  /* the interest map (Emilien et al. 2012, made small): every place along the spine where a unit of this size could stand with its
     front to the road is scored: near the focus (the place grows out from its middle), the sun side (a yard facing south), the main
     street over a lane, and a little noise so two rolls differ; the best that fits wins. only: a test on the candidate. */
  function bestCandidate(uw, uh, only) {
    var best = null, roadHalf = 1.5;
    V.spine.forEach(function (pl) {
      if (pl.cls === 'path') return;
      var sm = samplePts(pl), i; for (i = 0; i < pl.pts.length - 1; i++) {
        var a = pl.pts[i], b = pl.pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), horiz = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]), s;
        if (len < 0.01) continue;
        for (s = 0; s <= len; s += 1) {
          var px = a[0] + (b[0] - a[0]) * s / len, py = a[1] + (b[1] - a[1]) * s / len, side;
          for (side = 0; side < 2; side++) {
            var c, ext = null, j;   // the box stands off the road's nearest point along its whole front (a wandering street), not off this one sample
            if (horiz) { var bx0 = Math.round(px - uw / 2); for (j = 0; j < sm.length; j++) { if (sm[j][0] < bx0 - 1 || sm[j][0] > bx0 + uw + 1) continue; ext = ext == null ? sm[j][1] : side === 0 ? Math.min(ext, sm[j][1]) : Math.max(ext, sm[j][1]); } if (ext == null) ext = py; c = side === 0 ? { x: bx0, y: Math.round(ext - roadHalf - 1 - uh), w: uw, h: uh, front: 's' } : { x: bx0, y: Math.round(ext + roadHalf + 1), w: uw, h: uh, front: 'n' }; }
            else { var by0 = Math.round(py - uw / 2); for (j = 0; j < sm.length; j++) { if (sm[j][1] < by0 - 1 || sm[j][1] > by0 + uw + 1) continue; ext = ext == null ? sm[j][0] : side === 0 ? Math.min(ext, sm[j][0]) : Math.max(ext, sm[j][0]); } if (ext == null) ext = px; c = side === 0 ? { x: Math.round(ext - roadHalf - 1 - uh), y: by0, w: uh, h: uw, front: 'e' } : { x: Math.round(ext + roadHalf + 1), y: by0, w: uh, h: uw, front: 'w' }; }
            if (only && !only(c)) continue;
            if (!boxFree(c.x, c.y, c.w, c.h)) continue;
            var fcx = c.front === 's' ? c.x + c.w / 2 : c.front === 'n' ? c.x + c.w / 2 : c.front === 'e' ? c.x + c.w : c.x, fcy = c.front === 's' ? c.y + c.h : c.front === 'n' ? c.y : c.y + c.h / 2;
            var sc = Math.hypot(fcx * T - focus[0], fcy * T - focus[1]) / T + R() * 4 + (c.front === 's' ? -2 : c.front === 'n' ? 1 : 6) + (pl.cls === 'lane' ? 6 : pl.cls === 'ring' ? -1 : 0);   // (the rows along the street fill first; a unit flanking the way in comes after)
            if (!best || sc < best.sc) { best = c; best.sc = sc; }
          }
        }
      }
    });
    return best;
  }
  function placeUnit(U, c) { U.x = c.x; U.y = c.y; U.front = c.front; U.index = V.units.length; var L = U.kind === 'plot' ? plotUnit(U) : ringUnit(U); if (!L) return null; var u = stamp(L, U); if (U.fence) unitFence(u, U.fence, U.fence === 'drystone' ? 3 : 2); if (U.lych) prop({ name: 'lychGate', x: u.gapC[0], y: u.gapC[1] }); else if (U.fence && !u.plot && (U.fence === 'rail' || U.fence === 'fence')) R();   /* (no loose gate in a farm's gap: it stood out of line with the drawn run, Robin 2026-10-28; the draw kept so the stream stays) */ if (u.plot && U.fence && R() < 0.35) { var bc = u.front === 's' ? [u.x, u.y + u.h] : u.front === 'n' ? [u.x, u.y] : u.front === 'e' ? [u.x + u.w, u.y] : [u.x, u.y]; prop({ name: 'boundaryStone_' + (1 + Math.floor(R() * 3)), x: bc[0] * T + 6, y: bc[1] * T + 6, solid: 2 }); } hugRects.push({ x: u.x, y: u.y, w: u.w, h: u.h }); return u; }   /* (the farm gate over the fence's gap and a boundary stone at a plot's corner: the Art Director's pieces, Robin's yes of 2026-10-22; skipped until they exist) */
  function extendStreet() {                           // the street grows at the end with the most room (the village grew, so the street grew)
    var pl = V.spine.filter(function (q) { return q.cls === 'main' && q.pts.length >= 2 && Math.abs(q.pts[q.pts.length - 1][0] - q.pts[0][0]) > Math.abs(q.pts[q.pts.length - 1][1] - q.pts[0][1]); })[0]; if (!pl) return false;
    var first = pl.pts[0], last = pl.pts[pl.pts.length - 1], roomE = tx + w - 3 - Math.max(first[0], last[0]), roomW = Math.min(first[0], last[0]) - (tx + 3);
    if (roomE < 6 && roomW < 6) return false;
    if (roomE >= roomW) { var e = last[0] > first[0] ? last : first, np = [e[0] + Math.min(9, roomE), clamp(e[1] + (R() - 0.5) * 3, ty + 4, ty + h - 4)]; if (e === last) pl.pts.push(np); else pl.pts.unshift(np); }
    else { var w2 = last[0] < first[0] ? last : first, np2 = [w2[0] - Math.min(9, roomW), clamp(w2[1] + (R() - 0.5) * 3, ty + 4, ty + h - 4)]; if (w2 === last) pl.pts.push(np2); else pl.pts.unshift(np2); }
    resample(); return true;
  }
  function backLane() {                               // the lane behind the units of one side of the street (to the middens and the washing), joined to the street at both ends: the street's loop
    var sideN = V.units.filter(function (u) { return u.front === 's'; }), sideS = V.units.filter(function (u) { return u.front === 'n'; }), row = sideN.length >= sideS.length ? sideN : sideS, st = V.spine[0];
    if (!row.length) return false;
    var lx0 = 1e9, lx1 = -1e9, ly = row === sideN ? 1e9 : -1e9; row.forEach(function (u) { lx0 = Math.min(lx0, u.x); lx1 = Math.max(lx1, u.x + u.w); ly = row === sideN ? Math.min(ly, u.y) : Math.max(ly, u.y + u.h); });
    var laneY = clamp(row === sideN ? ly - 1.5 : ly + 1.5, ty + 1.5, ty + h - 1.5), ex2 = clamp(lx0 - 1.5, tx + 1.5, tx + w - 1.5), ex3 = clamp(lx1 + 1.5, tx + 1.5, tx + w - 1.5);
    if (ex3 - ex2 < 6) return false;
    var sp0 = st.pts[0], sp1 = st.pts[st.pts.length - 1]; if (ex2 < Math.min(sp0[0], sp1[0])) (sp0[0] < sp1[0] ? st.pts.unshift([ex2, sp0[1]]) : st.pts.push([ex2, sp1[1]])); if (ex3 > Math.max(sp0[0], sp1[0])) (sp1[0] > sp0[0] ? st.pts.push([ex3, sp1[1]]) : st.pts.unshift([ex3, sp0[1]]));   // the street runs on to where the lane comes back to it
    V.spine.push({ cls: 'lane', pts: [[ex2, yAt(st, ex2)], [ex2, laneY], [(ex2 + ex3) / 2, laneY + (R() - 0.5) * 2], [ex3, laneY], [ex3, yAt(st, ex3)]] }); resample(); return true;
  }
  function makeExit(arcY, pref) {                     // the way out, to the back gate: north from the street (or from the green's north side) through the widest free strip nearest where it was meant
    if (!G.backGate) return;
    var stW = V.spine[0], stE = arcY != null && V.spine[1] ? V.spine[1] : V.spine[0], best = null, bd = 1e9, x;
    function yFromAt(x2) { if (arcY != null && green && x2 >= green.x - 1.5 && x2 <= green.x + green.w + 1.5) return arcY; return yAt(x2 < (green ? green.x + green.w / 2 : tx + w / 2) ? stW : stE, x2); }
    for (x = tx + 4; x <= tx + w - 4; x += 0.5) {
      var yF = yFromAt(x), ok = true, i;
      for (i = 0; i < V.units.length && ok; i++) { var u = V.units[i]; if (u.y < yF && u.x - 1.5 < x + 1.5 && u.x + u.w + 1.5 > x - 1.5) ok = false; }
      if (ok && green && green.y < yF - 0.1 && green.x - 1.5 < x + 1.5 && green.x + green.w + 1.5 > x - 1.5) ok = false;
      if (ok && Math.abs(x - pref) < bd) { bd = Math.abs(x - pref); best = x; }
    }
    if (best == null) best = pref;
    var y0 = yFromAt(best); exitPl = { cls: 'lane', pts: [[best, y0], [best + (R() - 0.5) * 3, (ty + y0) / 2], [best, ty - 0.3]] }; V.spine.push(exitPl); backGateX = Math.floor(best); resample();
  }
  function farmSpec(rich) {
    return rich ? { kind: 'farm', big: 'longhouse', long: [14, 16], houses: [1, 1], houseLen: [8, 9], out: [2, 3], yard: [7, 5], w: 22, h: 26, yardDy: 0, compact: true, slots: ['se', 'sw'], firePit: true, well: false, fence: farmFence, rich: true }
      : { kind: 'farm', big: 'longhouse', long: story === 'oldseat' ? [16, 16] : [11, 14], houses: [0, 0], out: [1, 2], yard: [6, 4], w: 20, h: 20, compact: true, slots: [], firePit: false, well: false, fence: farmFence };   // (grown 2026-10-22 with the houses: a plain farm was 16 by 16, a rich one 17 by 23)
  }
  function hallSpec() { return { kind: 'hall', big: 'hall', houses: [1, 1], out: [1, 2], yard: [8, 5], w: 36, h: 24, yardDy: 3, roomy: 1, compact: true, slots: ['e', 'w'], outs: ['store', 'byre'], firePit: true, well: true, hall: true, heavy: true, town: !!A.townwall, fence: A.townwall ? 'drystone' : 'palisade', zone: 'private', table: true }; }
  function churchSpec() { return { kind: 'church', big: 'church', houses: [0, 0], out: [0, 0], yard: [4, 3], w: 12, h: 22, yardDy: 9, roomy: 1, bigX: -2, compact: true, slots: [], fire: false, well: false, church: true, fence: 'drystone', lych: true, zone: 'private' }; }
  function plotSpec(quarter) {
    var q = quarter || 'craft';
    if (q === 'merchant') return { kind: 'plot', w: 9, h: 17, ac: 7, len: [9, 11], behind: 'store', mstep: 0, fence: 'rail', quarter: q };
    if (q === 'gate') return { kind: 'plot', w: 8, h: 16, ac: 6, len: [8, 9], behind: R() < 0.5 ? 'smithy' : 'store', mstep: 1, fence: 'rail', quarter: q };
    if (q === 'poor') return { kind: 'plot', w: 8, h: 13, ac: 6, len: [8, 8], behind: R() < 0.5 ? 'pit' : null, mstep: 2, fence: null, quarter: q };
    if (q === 'suburb') return { kind: 'plot', w: 8, h: 13, ac: 6, len: [8, 8], behind: R() < 0.4 ? 'pit' : null, mstep: 2, fence: null, quarter: q, zone: 'public' };
    return { kind: 'plot', w: 8, h: 15, ac: 6, len: [8, 9], behind: R() < 0.6 ? 'pit' : 'store', mstep: 1, fence: wealth > 0.4 ? 'rail' : null, quarter: q };
  }
  function tryLot(lot) {                               // a lot of the place's own (a store on the market, the boathouse on the shore): checked against the units and the roads
    var k, l; for (k = 0; k < 8; k++) { var dx = k ? Math.round((R() - 0.5) * 4) : 0, dy = k ? Math.round((R() - 0.5) * 2) : 0; l = { x: lot.x + dx, y: lot.y + dy, w: lot.w, h: lot.h, id: lot.id, door: lot.door, slot: lot.slot || 'place', big: false, u: lot.u || {} }; if (boxFree(l.x, l.y, l.w, l.h, 0.5) && !(green && overlaps(l, green, 0))) { placeLots.push(l); V.lots.push(l); pieces(l); hugRects.push({ x: l.x, y: l.y, w: l.w, h: l.h }); return l; } }
    return null;
  }
  function greenThings(gr, market) {                    // what stands on the common: the big fire with its logs, the well, the stone, a laid table; a market's stalls
    var gc = tile(gr.x + Math.floor(gr.w / 2), gr.y + Math.floor(gr.h / 2)), fc = [gc[0] - T * 0.6, gc[1] + T * 0.4];
    if (G.firePit) { item('firePit', fc[0], fc[1], { hearth: true, light: 1, pit: true }); var ns = Math.round(G.logSeats), si2; for (si2 = 0; si2 < ns; si2++) { var sa = -0.9 + si2 * (1.8 / Math.max(1, ns - 1)) + 1.57, sx2 = fc[0] + Math.cos(sa) * 38, sy2 = fc[1] + Math.sin(sa) * 24 + 8; if (Math.abs(Math.cos(sa)) < 0.35 && Math.sin(sa) < 0) continue; item('logSeat', sx2, sy2, { seat: true, fire: true }); } find({ kind: 'fire', x: fc[0], y: fc[1] }); }
    else item('campfire', fc[0], fc[1], { hearth: true, light: 1 });
    if (wealth > 0.3 || market) item('woodenWell', gc[0] + T * Math.min(2.2, gr.w * 0.22), gc[1] - T * Math.min(1.4, gr.h * 0.25));
    if (G.sacred) { var sp = [(gr.x + 0.8) * T, (gr.y + 0.8) * T]; prop({ name: lowland && A.church ? 'wayCross' : 'runestone', x: sp[0], y: sp[1], solid: 4, lore: 'Raised by the folk of ' + (opts.name || 'this place') + ' for one who did not come home.', landmark: !A.hall }); find({ kind: 'stone', x: sp[0], y: sp[1] }); if (!market && A.tier >= 2) prop({ name: 'thingRing', x: sp[0], y: sp[1] - 6, solid: 0, under: true }); }   // the Thing stone, and round it the ring of low stones where the Thing meets (the Art Director's thingRing, Robin's yes of 2026-10-22; nothing is drawn until the piece exists)
    if (G.clutter && !V.ruin && gr.w >= 8) { item('foodTable', gc[0] - T * 2.6, gc[1] - T * 1.2, { r: 7 }); item('bench', gc[0] - T * 2.6, gc[1] - T * 1.2 + 15, { seat: true }); }
    if (market && !V.ruin) { var ns2 = 2 + Math.floor(R() * 2), k2; for (k2 = 0; k2 < ns2; k2++) item('stall', (gr.x + 1.5 + k2 * Math.max(3, (gr.w - 3) / ns2)) * T, (gr.y + gr.h - 0.9) * T, { r: 8 }); prop({ name: 'signPost', x: (gr.x + gr.w - 1) * T, y: (gr.y + gr.h - 0.5) * T, solid: 3 }); }
    if (gr.w >= 8 && R() < 0.5) prop({ name: 'cart', x: (gr.x + gr.w - 1.2) * T, y: (gr.y + 1.2) * T });
    if (G.yardEarth) earthPatch(gc[0], gc[1], gr.w * T * 0.46, gr.h * T * 0.46, market ? 0.95 : 0.8);
    V.yards.push({ x: gr.x, y: gr.y, w: gr.w, h: gr.h });
  }
  // ---- the tiers ----
  var nUnitsWanted = 0, nUnitsMin = 0, cxT = tx + w / 2, cyT = ty + h / 2, maxUnits = opts.rounds != null ? Math.max(0, +opts.rounds) : 1e9;
  function growSingle() {                             // one yard: the farmstead, the fisherman's hut, the lone church (today's ring plan over the whole site)
    var U = { kind: A.hut ? 'hut' : A.chapel ? 'chapel' : 'farm', big: A.chapel ? 'church' : A.hut ? 'house' : 'longhouse', houses: A.houses, out: A.out, yard: A.yard, long: A.long, w: w, h: h, x: tx, y: ty, front: 's', index: 0, firePit: !A.chapel && !A.hut, well: !A.hut, stores: A.stores, shore: shore, church: A.chapel, chapel: A.chapel, table: true, zone: A.chapel ? 'private' : 'semi' };
    var L = ringUnit(U); if (!L) return; var u = stamp(L, U); nUnitsWanted = 1;
    focus = u.wc; V.yard = u.yard; V.lots.forEach(function (l) { hugRects.push(l); });
    var L0 = u.big, gx = V.yard.x + Math.floor(V.yard.w / 2) + 0.5, side = R() < 0.5 ? 1 : -1;
    gateX = Math.floor(gx);
    if (G.backGate && (!shore || shore === 's') && (A.houses[1] >= 3 || shore === 's')) { backGateX = side > 0 ? L0.x + L0.w + 1 : L0.x - 2; if (backGateX <= tx + 1 || backGateX >= tx + w - 2) backGateX = side > 0 ? L0.x - 2 : L0.x + L0.w + 1; if (backGateX <= tx + 1 || backGateX >= tx + w - 2) backGateX = null; }
    var fc = [focus[0] / T, focus[1] / T], L0d = L0.door === 's' ? [L0.dx + 0.5, L0.y + L0.h + 0.7] : [L0.x + L0.w / 2, L0.y + L0.h + 0.7];
    var pts = shore === 's' ? [[fc[0] - side * 2.2, ty + h + 0.3], [fc[0] - side * 1.6, ty + h - 1.2]] : [[gx + side * 0.4, ty + h + 0.3], [gx, ty + h - 0.6]];
    pts.push([fc[0] + side * 1.6, fc[1] + 1.0], [fc[0] + side * 1.4, fc[1] - 1.1], L0d);
    approachPl = { cls: 'main', pts: pts, taper: true }; V.spine.push(approachPl);
    if (backGateX != null) { exitPl = { cls: 'lane', pts: [[L0d[0], L0d[1]], [backGateX + 0.5, L0.y + L0.h + 1], [backGateX + 0.5, ty + 0.5], [backGateX + 0.5 + side * 0.3, ty - 1.5]] }; V.spine.push(exitPl); }
    if (shore && shore !== 's') { var shp = shore === 'n' ? [fc[0], ty - 0.3] : shore === 'e' ? [tx + w + 0.3, fc[1]] : [tx - 0.3, fc[1]]; V.spine.push({ cls: 'lane', pts: [[fc[0] + side * 1.6, fc[1] + 1.0], [fc[0] - side * 0.6, fc[1] + 1.8], shp] }); }
  }
  function growCluster() {                            // farms along a winding street, or round a green (the forte): a hamlet, a village, a seat
    var isGreen = shape === 'green', gw = A.green ? A.green[0] : 6, gh = A.green ? A.green[1] : 4;
    var nFarms = clamp(pickRange(R, A.farms, 0) + (age === 'old' ? 1 : age === 'new' ? -1 : 0), 1, A.farms[1] + 1); nUnitsWanted = nFarms + (A.hall ? 1 : 0); nUnitsMin = A.farms[0] + (A.hall ? 1 : 0);
    cyT = ty + h / 2 + (A.hall ? 6 : 0) + (shore === 's' ? h * 0.12 : 0);
    var sy = shore === 's' ? ty + h - 8.5 : cyT + (R() - 0.5) * 4;
    green = { x: Math.round(cxT - gw / 2 + (R() - 0.5) * 4), y: isGreen ? Math.round(sy - gh / 2) : Math.round(sy - 1.5 - gh), w: gw, h: gh };   // a street village keeps a small common north of its street for the fire, the well and the stone
    var gx = clamp(Math.round(cxT + (R() - 0.5) * 12) + 0.5, tx + 5, tx + w - 5), bx = clamp(gx + (R() < 0.5 ? -1 : 1) * (7 + Math.floor(R() * 8)), tx + 5, tx + w - 5);
    var ix0 = tx + 4, ix1 = tx + w - 4;
    if (isGreen) {
      V.spine.push({ cls: 'main', pts: wander(ix0, green.x - 1.5, sy) });
      V.spine.push({ cls: 'main', pts: wander(green.x + green.w + 1.5, ix1, sy) });
      var ry0 = green.y - 1.5, ry1 = green.y + green.h + 1.5, rx0 = green.x - 1.5, rx1 = green.x + green.w + 1.5;
      V.spine.push({ cls: 'ring', pts: [[rx0, sy], [rx0, ry0], [rx1, ry0], [rx1, sy]] });
      V.spine.push({ cls: 'ring', pts: [[rx0, sy], [rx0, ry1], [rx1, ry1], [rx1, sy]] });
    } else V.spine.push({ cls: 'main', pts: wander(ix0, ix1, sy) });
    var ay = isGreen ? green.y + green.h + 1.5 : yAt(V.spine[0], gx), byy = isGreen ? green.y - 1.5 : yAt(V.spine[0], bx);
    var HU = A.hall ? hallSpec() : null, hx = HU ? Math.round(green.x + green.w / 2 - HU.w / 2 + (R() - 0.5) * 6) : 0, hy = HU ? (isGreen ? green.y - 3 - HU.h : green.y - 2 - HU.h) : 0;
    if (HU) { bx = bx < green.x + green.w / 2 ? hx - 2.5 : hx + HU.w + 2.5; bx = clamp(bx, tx + 4, tx + w - 4); }   // the way out passes the hall's precinct on its side
    approachPl = { cls: 'main', pts: [[gx + (R() - 0.5) * 0.6, ty + h + 0.3], [gx + (R() - 0.5) * 4, (ty + h + ay) / 2], [gx, ay]] }; V.spine.push(approachPl);   // the way in, from the gate (the way out comes after the farms, where they leave room)
    gateX = shore === 's' ? null : Math.floor(gx);
    focus = [(green.x + green.w / 2) * T, (green.y + green.h / 2) * T];
    resample();
    var placed = 0;
    if (HU && maxUnits > 0) {                          // the hall's own precinct on the high side, its gate to the green, first of all
      var k2, ok = false;
      for (k2 = 0; k2 < 10 && !ok; k2++) { var hx2 = hx + Math.round((R() - 0.5) * 2 * k2); if (boxFree(hx2, hy, HU.w, HU.h, 0.5)) { ok = !!placeUnit(HU, { x: hx2, y: hy, front: 's' }); } }
      if (!ok) V.notes.push('!! the hall found no room north of the green'); else placed++;
    }
    var tries = 0, extended = 0;
    while (placed < nUnitsWanted && placed < maxUnits && tries++ < 80) {
      var FU = farmSpec(wealth > 0.5 && R() < 0.55), c = bestCandidate(FU.w, FU.h);
      if (!c && FU.rich) { FU = farmSpec(false); c = bestCandidate(FU.w, FU.h); }
      if (!c) { if (extended < 4 && extendStreet()) { extended++; continue; } break; }
      if (placeUnit(FU, c)) placed++;
    }
    if (placed < nUnitsWanted && maxUnits >= nUnitsWanted) V.notes.push((placed < nUnitsMin ? '!! ' : '') + (nUnitsWanted - placed) + ' of ' + nUnitsWanted + ' units found no room');
    makeExit(isGreen ? green.y - 1.5 : null, bx);
    if (!isGreen) backLane();
    greenThings(green, false); V.yard = green;
    if (shore === 's' && !V.ruin) {                    // the shore strip below the street: racks, a boathouse, a boat drawn up
      var ry = ty + h - 3.5, k3; for (k3 = 0; k3 < (A.racks || 1); k3++) prop({ name: 'dryingRack', x: (focus[0] / T + (k3 - 0.5) * 4 + (R() - 0.5) * 2) * T, y: ry * T, solid: 6 });
      tryLot({ id: 'boathouse', x: Math.round(focus[0] / T) + 5, y: ty + h - 6, w: 7, h: 5, door: 's', slot: 'shore' });
    }
  }
  function growRow() {                                // the shore row (Ribe, Birka): plots with their short side to a street a few tiles up from the water, the market strip between
    var sy = ty + h - 7.5, ix0 = tx + 4, ix1 = tx + w - 4, bx = clamp(Math.round(cxT + (R() - 0.5) * 12) + 0.5, tx + 6, tx + w - 6), nPlots = pickRange(R, A.plots, 0) + (age === 'old' ? 1 : age === 'new' ? -1 : 0);
    nUnitsWanted = nPlots + 1; nUnitsMin = A.plots[0];
    V.spine.push({ cls: 'main', pts: wander(ix0, ix1, sy, 1.5) }); approachPl = V.spine[0];
    gateX = null;
    green = { x: Math.round(cxT - 6 + (R() - 0.5) * 6), y: Math.round(sy + 1.5), w: 12, h: 4 }; focus = [(green.x + green.w / 2) * T, (green.y + green.h / 2) * T];
    resample();
    var placed = 0, c, FU = farmSpec(true); FU.table = true;   // the trader's own longhouse first
    c = bestCandidate(FU.w, FU.h); if (c && maxUnits > 0 && placeUnit(FU, c)) placed++;
    var tries = 0;
    while (placed < nUnitsWanted && placed < maxUnits && tries++ < 60) { var PU = plotSpec(R() < 0.3 ? 'merchant' : 'craft'); PU.behind = R() < 0.5 ? 'store' : 'pit'; c = bestCandidate(PU.w, PU.h); if (!c) break; if (placeUnit(PU, c)) placed++; }
    makeExit(null, bx); backLane();
    var k2; for (k2 = 0; k2 < (A.stores || 0); k2++) tryLot({ id: 'store', x: green.x + 1 + k2 * 6, y: green.y + 1, w: 3, h: 3, door: 'n', slot: 'market', u: { stores: true } });
    greenThings(green, true); V.yard = green;
    for (k2 = 0; k2 < (A.racks || 2); k2++) prop({ name: 'dryingRack', x: (green.x - 2 - k2 * 3) * T, y: (ty + h - 2.5) * T, solid: 6 });
    tryLot({ id: 'boathouse', x: green.x + green.w + 3, y: ty + h - 6, w: 7, h: 5, door: 's', slot: 'shore' });
  }
  function growTown() {                               // the walled town: the main street from the gate to the market to the hall, cross lanes, plots in blocks, the church's and the hall's precincts, a suburb outside the gate
    var E = { x0: tx + 3, x1: tx + w - 3, y0: ty + 2, y1: ty + h - 16 }, big = A.tier >= 5, mw = big ? 16 : 12, mh = 8;
    var nPlots = pickRange(R, A.plots, 0) + (age === 'old' ? 2 : age === 'new' ? -2 : 0); nUnitsWanted = nPlots + 2; nUnitsMin = A.plots[0];
    var HU = hallSpec(), market = { x: Math.round((E.x0 + E.x1) / 2 - mw / 2 + (R() - 0.5) * 6), y: Math.round(E.y0 + (E.y1 - E.y0) * 0.5 - mh / 2 + 3), w: mw, h: mh };
    var hy = market.y - 3 - HU.h; if (hy < E.y0 + 1) { market.y += E.y0 + 1 - hy; hy = E.y0 + 1; }
    green = market; focus = [(market.x + market.w / 2) * T, (market.y + market.h / 2) * T];
    var gx = clamp(market.x + market.w / 2 + (R() - 0.5) * 4, E.x0 + 4, E.x1 - 4), my = market.y + market.h / 2;
    var approach = { cls: 'main', pts: [[gx + (R() - 0.5) * 0.6, ty + h + 0.3], [gx + (R() - 0.5) * 5, (E.y1 + market.y + market.h) / 2], [gx, market.y + market.h + 0.5]] };
    V.spine.push(approach); approachPl = approach;
    V.spine.push({ cls: 'main', pts: [[market.x + market.w / 2 + (R() - 0.5) * 2, market.y - 0.5], [market.x + market.w / 2, hy + HU.h + 1.5]] });   // up to the hall's gate
    V.spine.push({ cls: 'main', pts: wander(E.x0 + 1, market.x - 0.5, my, 2) }); V.spine.push({ cls: 'main', pts: wander(market.x + market.w + 0.5, E.x1 - 1, my, 2) });   // the cross street, through the market
    var hxPlan = Math.round(market.x + market.w / 2 - HU.w / 2), bxl = R() < 0.5, bxW = clamp(hxPlan - 3, E.x0 + 3, E.x1 - 3), bxE = clamp(hxPlan + HU.w + 3, E.x0 + 3, E.x1 - 3), wOk = bxW < hxPlan - 1, eOk = bxE > hxPlan + HU.w + 1; if (bxl && !wOk) bxl = false; if (!bxl && !eOk) bxl = true; var bx = bxl ? bxW : bxE;   // the lane past the hall on a side where it stays clear of the hall's box (2026-10-22: clamped into the hall, it left the hall no room)
    exitPl = { cls: 'lane', pts: [[bxl ? market.x - 0.5 : market.x + market.w + 0.5, market.y + 0.5], [bx, market.y - 2], [bx + (R() - 0.5) * 3, (hy + ty) / 2], [bx, ty - 0.3]] }; V.spine.push(exitPl);   // the back lane past the hall to the back gate
    if (big) { V.spine.push({ cls: 'main', pts: wanderV(my - 1, E.y1 - 1, market.x - 15, 2) }); V.spine.push({ cls: 'main', pts: wanderV(my + 1, E.y1 - 1, market.x + market.w + 15, 2) }); V.spine.push({ cls: 'main', pts: wander(E.x0 + 1, E.x1 - 1, my + 14, 2) }); }
    backGateX = Math.floor(bx);
    resample();
    var placed = 0, c;
    if (maxUnits > 0) { var hx = Math.round(market.x + market.w / 2 - HU.w / 2 + (R() - 0.5) * 4), k2, ok = false; for (k2 = 0; k2 < 10 && !ok; k2++) { var hx2 = hx + Math.round((R() - 0.5) * 2 * k2); if (boxFree(hx2, hy, HU.w, HU.h, 0.5)) ok = !!placeUnit(HU, { x: hx2, y: hy, front: 's' }); } if (ok) placed++; else V.notes.push('!! the hall found no room'); }
    if (A.church && placed < maxUnits) { var CU = churchSpec(); c = bestCandidate(CU.w, CU.h, function (q) { return q.front === 's' && q.y + q.h <= E.y1 && q.y >= E.y0; });   /* (the church stands as grown: its gable and door south, the apse north, the churchyard east; 2026-10-22, a mirrored one laid its roof over the plot behind it) */ if (c && placeUnit(CU, c)) placed++; else V.notes.push('!! the church found no room'); }
    for (k2 = 0; k2 < (A.stores || 0); k2++) tryLot({ id: 'store', x: k2 ? market.x + market.w - 4 : market.x + 1, y: market.y - 4, w: 3, h: 3, door: 's', slot: 'market', u: { stores: true } });
    var tries = 0, gatePt = [gx, E.y1];
    while (placed < nUnitsWanted && placed < maxUnits && tries++ < 120) {
      var PU0 = plotSpec('craft'); c = bestCandidate(PU0.w, PU0.h, function (q) { return q.y + q.h <= E.y1 && q.y >= E.y0 && q.x >= E.x0 && q.x + q.w <= E.x1; });
      if (!c) break;
      var fcx = c.x + c.w / 2, fcy = c.y + c.h / 2, dM = Math.hypot(fcx - (market.x + market.w / 2), fcy - my), dG = Math.hypot(fcx - gatePt[0], fcy - gatePt[1]);
      var quarter = dM < 14 ? 'merchant' : dG < 10 ? 'gate' : dM > (big ? 40 : 30) ? 'poor' : 'craft', PU = plotSpec(quarter);   // the wards by where they stand (Watabou's rule): merchants by the market, the gate ward, craftsmen between, the poor by the wall
      if (PU.w !== PU0.w || PU.h !== PU0.h) { var c2 = bestCandidate(PU.w, PU.h, function (q) { return q.y + q.h <= E.y1 && q.y >= E.y0 && q.x >= E.x0 && q.x + q.w <= E.x1 && Math.hypot(q.x + q.w / 2 - fcx, q.y + q.h / 2 - fcy) < 4; }); if (c2) c = c2; else PU = PU0; }
      if (placeUnit(PU, c)) placed++;
    }
    if (placed < nUnitsWanted && maxUnits >= nUnitsWanted) V.notes.push((placed < nUnitsMin ? '!! ' : '') + (nUnitsWanted - placed) + ' of ' + nUnitsWanted + ' units found no room');
    greenThings(market, true); V.yard = market;
    // the wall round what grew, the gates where the streets cross it, the suburb outside the main gate
    var bb = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }; hugRects.forEach(function (r) { bb.x0 = Math.min(bb.x0, r.x); bb.y0 = Math.min(bb.y0, r.y); bb.x1 = Math.max(bb.x1, r.x + r.w); bb.y1 = Math.max(bb.y1, r.y + r.h); });
    bb.x0 = Math.min(bb.x0, market.x); bb.y0 = Math.min(bb.y0, market.y); bb.x1 = Math.max(bb.x1, market.x + market.w); bb.y1 = Math.max(bb.y1, market.y + market.h);
    V.wallBox = { x0: clamp(bb.x0 - 2, tx + 1, E.x0), y0: clamp(bb.y0 - 2, ty + 1, E.y0), x1: clamp(bb.x1 + 2, E.x1, tx + w - 1), y1: clamp(bb.y1 + 2, bb.y1 + 2, E.y1 + 2) };
    var WB = V.wallBox; V.spine.forEach(function (pl) { if (pl === approach || pl === exitPl) return; pl.pts = pl.pts.map(function (p) { return [clamp(p[0], WB.x0 + 1.5, WB.x1 - 1.5), clamp(p[1], WB.y0 + 1.5, WB.y1 - 1.5)]; }); });   // the streets end at the wall lane, inside the wall
    V.spine.push({ cls: 'lane', pts: [[WB.x0 + 1.5, WB.y1 - 1.5], [WB.x0 + 1.5, WB.y0 + 1.5], [WB.x1 - 1.5, WB.y0 + 1.5], [WB.x1 - 1.5, WB.y1 - 1.5], [WB.x0 + 1.5, WB.y1 - 1.5]] });   // the lane inside the wall all round (the burh's wall street): every street joins it
    resample();
    gateX = Math.floor(xAt(approach, V.wallBox.y1)); backGateX = Math.floor(xAt(exitPl, V.wallBox.y0));
    var ns = 2 + Math.floor(R() * 3), k3; for (k3 = 0; k3 < ns && placed < maxUnits; k3++) { var SU = plotSpec('suburb'); c = bestCandidate(SU.w, SU.h, function (q) { return q.y > V.wallBox.y1 + 1 && q.y + q.h < ty + h - 1; }); if (!c) break; placeUnit(SU, c); }
    if (story === 'market') { for (k3 = 0; k3 < 3; k3++) prop({ name: k3 ? 'cart' : 'stall', x: (gx + (k3 - 1) * 3.2) * T, y: (V.wallBox.y1 + 3 + (k3 % 2)) * T, solid: 8 }); }
  }
  if (A.family === 'single') growSingle(); else if (A.family === 'row') growRow(); else if (A.family === 'town') growTown(); else growCluster();
  if (!focus) { focus = [(tx + w / 2) * T, (ty + h / 2) * T]; V.yard = V.yard || { x: tx + Math.floor(w / 2) - 3, y: ty + Math.floor(h / 2) - 2, w: 6, h: 4 }; }
  V.focus = focus; V.green = green;
  var homes = V.lots.filter(function (l) { return l.id === 'longhouse' || l.id === 'hall' || l.id === 'house'; });
  V.lots.forEach(function (l) { if (!(A.townwall || A.chapel) || !(l.id === 'church' || l.id === 'hall' || l.id === 'store')) return; var dk = l.door === 's' ? key(l.dx, l.y + l.h) : l.door === 'n' ? key(l.dx, l.y) : l.door === 'w' ? key(l.x, l.dy) : key(l.x + l.w, l.dy), ed = (l.door === 's' || l.door === 'n') ? V.H[dk] : V.V[dk]; if (ed && ed.t === 'door') ed.locked = 1; });
  V.lots.forEach(function (l) { if (l.id === 'hall' && l.back != null && V.V[key(l.back, l.backDy)]) V.V[key(l.back, l.backDy)].locked = 1; });   /* the hall's back room locked wherever a hall has one, a seat's too, the chieftain's chest behind it (raid step 8; it was locked only in a walled town or a church place, found by the live raid check of 2026-10-24) */   // the raid (2026-10-07): the church, the hall and the store are locked; the axe opens them; the hall's back room too (step 8)
  // ---- the edge: drawn last round what grew; gates where the spine crosses it ----
  var ex0 = 1e9, ey0 = 1e9, ex1 = -1e9, ey1 = -1e9; hugRects.forEach(function (l) { ex0 = Math.min(ex0, l.x); ey0 = Math.min(ey0, l.y); ex1 = Math.max(ex1, l.x + l.w); ey1 = Math.max(ey1, l.y + l.h); });
  if (green) { ex0 = Math.min(ex0, green.x - 1); ey0 = Math.min(ey0, green.y - 1); ex1 = Math.max(ex1, green.x + green.w + 1); ey1 = Math.max(ey1, green.y + green.h + 1); }
  if (V.wallBox) { ex0 = V.wallBox.x0; ey0 = V.wallBox.y0; ex1 = V.wallBox.x1; ey1 = V.wallBox.y1; }
  else { ex0 = Math.max(tx, ex0 - G.fenceGap); ey0 = Math.max(ty, ey0 - G.fenceGap); ex1 = Math.min(tx + w, ex1 + G.fenceGap); ey1 = Math.min(ty + h, ey1 + G.fenceGap); }
  if (gateX == null && shore !== 's') gateX = Math.floor(focus[0] / T);
  // the gates where the roads cross the edge: a road that came in beside the fence bends to its gate
  function shiftRoad(pl, end, nx) { if (!pl || !end) return; var p = pl.pts[end === 'first' ? 0 : pl.pts.length - 1], dxs = nx - p[0], i4; for (i4 = 0; i4 < pl.pts.length; i4++) { var kk2 = end === 'first' ? 1 - i4 / Math.max(1, pl.pts.length - 1) : i4 / Math.max(1, pl.pts.length - 1); pl.pts[i4][0] += dxs * kk2 * kk2; } }   // the end moves to the gate, the other end stays, the road bends between
  if (gateX != null) { var gX2 = clamp(gateX, ex0 + 1, ex1 - 2 - (A.townwall ? 1 : 0)); if (gX2 !== gateX) { shiftRoad(approachPl, A.family === 'row' ? null : 'first', gX2 + 0.5); gateX = gX2; } }
  if (backGateX != null) { var bX2 = clamp(backGateX, ex0 + 1, ex1 - 2); if (bX2 !== backGateX) { shiftRoad(exitPl, 'last', bX2 + 0.5); backGateX = bX2; } }
  if (A.family !== 'single' && exitPl && backGateX != null) exitPl.pts[exitPl.pts.length - 1][0] = backGateX + 0.5;
  if (A.family !== 'single' && approachPl && gateX != null && shore !== 's') approachPl.pts[0][0] = gateX + 0.5 + (A.townwall ? 0.5 : 0);
  resample();
  var fk = fenceKind, fm = fk === 'drystone' ? 3 : (fk === 'townwall' ? 6 : 2), x, y;
  if (A.chapel && gateX != null) prop({ name: 'lychGate', x: (gateX + 0.5) * T, y: (ey1 + 0.02) * T });   // the churchyard's roofed gate
  if (shore && !V.ruin && R() < 0.7) { var bx2 = shore === 'e' ? tx + w - 1.2 : shore === 'w' ? tx + 1.2 : focus[0] / T - 9 + (R() - 0.5) * 4, by2 = shore === 's' ? ty + h - 1.1 : shore === 'n' ? ty + 1.1 : focus[1] / T; prop({ name: 'beachedBoat', x: bx2 * T, y: by2 * T, solid: 10 }); }   // a boat drawn up on the sand at the site's shore edge (the game keeps it only on land)
  if (fk === 'palisade' && !A.townwall) {              // a ring of sharpened stakes round the whole place. Since 2026-10-21 (the Art Director's step 2 notes, mine to build): a POLYGON of eight to twelve straight runs hugging the buildings (V.fence.poly), each corner a little off its even angle and a little outside the hugging ellipse (every unit's corner inside), the gate two tiles wide at the start of the run on the road, the back gate a tile and a bit, a run stopping a stake short of a kept rock or tree, now and then one run mended in pale new wood (stake.mended: stake_new; the raid's weak run), banners either side of the gate; the stakes a tile apart (G.stakeStep)
    var ecx = (ex0 + ex1) / 2 * T, ecy = (ey0 + ey1) / 2 * T, hw2 = Math.max(1, (ex1 - ex0) / 2 * T), hh2 = Math.max(1, (ey1 - ey0) / 2 * T), kk = 1;
    hugRects.forEach(function (l) { [[l.x, l.y], [l.x + l.w, l.y], [l.x, l.y + l.h], [l.x + l.w, l.y + l.h]].forEach(function (q) { var dx = (q[0] * T - ecx) / hw2, dy = (q[1] * T - ecy) / hh2; kk = Math.max(kk, Math.sqrt(dx * dx + dy * dy)); }); });   // the ellipse hugs the buildings: every corner inside it
    var erx = hw2 * kk + T * 0.8, ery = hh2 * kk + T * 0.8, gpt = tile(gateX != null ? gateX : Math.floor(focus[0] / T), ey1), gateA = Math.atan2((gpt[1] + T - ecy) / ery, (gpt[0] - ecx) / erx);
    var gpt2 = backGateX != null ? tile(backGateX, ey0) : null, gate2A = gpt2 ? Math.atan2((gpt2[1] - T - ecy) / ery, (gpt2[0] - ecx) / erx) : null;
    function wrapA(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
    var N = 8 + Math.floor(R() * 5) + (A.tier >= 4 ? 4 : 0), step = 6.283 / N, ang = [], i2, j2;
    for (i2 = 0; i2 < N; i2++) ang.push(wrapA(R() * step * 0.2 + i2 * step + (R() - 0.5) * step * 0.5));
    function nearestTo(a) { var bi = 0, bd = 9; for (j2 = 0; j2 < ang.length; j2++) { var dd = Math.abs(wrapA(ang[j2] - a)); if (dd < bd) { bd = dd; bi = j2; } } return bi; }
    ang[nearestTo(gateA)] = gateA; if (gate2A != null && nearestTo(gate2A) !== ang.indexOf(gateA)) ang[nearestTo(gate2A)] = gate2A; else if (gate2A != null) { gate2A = null; backGateX = null; }
    ang.sort(function (p, q) { return p - q; });
    var poly = [], tries, kcorner = 1 / Math.cos(step / 2), corners = [], rad = [];
    hugRects.forEach(function (l) { var pts = [], sx, sy; for (sx = l.x; sx <= l.x + l.w; sx += 0.5) { pts.push([sx, l.y]); pts.push([sx, l.y + l.h]); } for (sy = l.y; sy <= l.y + l.h; sy += 0.5) { pts.push([l.x, sy]); pts.push([l.x + l.w, sy]); } pts.forEach(function (q) { var dx = (q[0] * T - ecx) / erx, dy = (q[1] * T - ecy) / ery; corners.push({ x: q[0] * T, y: q[1] * T, a: Math.atan2(dy, dx), r: Math.hypot(dx, dy) }); }); });   // every unit's whole outline (a dent between two corners cut through a house, 2026-10-21)
    ang.forEach(function (a) { var need = 0.5; corners.forEach(function (q) { var dd = Math.abs(wrapA(q.a - a)); if (dd < step * 0.95) need = Math.max(need, q.r / Math.max(0.35, Math.cos(dd))); }); rad.push(Math.min(1.12, need * kcorner * 1.04 * (0.98 + R() * 0.06)) + T * 0.4 / Math.min(erx, ery)); });
    function inside(px, py) { var n = poly.length, j, c = false, i; for (i = 0, j = n - 1; i < n; j = i++) { var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c; } return c; }
    var bx0 = (tx - (shore === 'w' ? 0 : 2)) * T, bx1 = (tx + w + (shore === 'e' ? 0 : 2)) * T, by0 = (ty - (shore === 'n' ? 0 : 2)) * T, by1 = (ty + h + (shore === 's' ? 0 : 2)) * T;   // the ring may go two tiles beyond the site (the ellipse did), not toward the water
    function lay() { poly = ang.map(function (a, i3) { return [Math.max(bx0, Math.min(bx1, ecx + Math.cos(a) * erx * rad[i3])), Math.max(by0, Math.min(by1, ecy + Math.sin(a) * ery * rad[i3]))]; }); }
    for (tries = 0; tries < 30; tries++) {
      lay(); var bad = corners.filter(function (q) { return !inside(q.x, q.y); }); if (!bad.length) break;
      bad.forEach(function (q) { var lo = -1, hi = -1; for (i2 = 0; i2 < N; i2++) { if (wrapA(q.a - ang[i2]) >= 0 && (lo < 0 || wrapA(q.a - ang[i2]) < wrapA(q.a - ang[lo]))) lo = i2; } hi = (lo + 1) % N; if (lo < 0) lo = N - 1; rad[lo] *= 1.06; rad[hi] *= 1.06; });
    }
    var gIx = ang.indexOf(gateA), bIx = gate2A != null ? ang.indexOf(gate2A) : -1, mendIx = -1, GAP = 2 * T + 6, GAPB = 1.3 * T;
    for (i2 = 0; i2 < N && mendIx < 0; i2++) { var cand = Math.floor(R() * N); if (cand !== gIx && cand !== bIx && (R() < 0.5 || i2 > N - 3)) mendIx = cand; }   // one run mended in pale new wood: the raid's weak run (every ring has one since 2026-10-22; it was two in five)
    function runOf(k) { var p0 = poly[k], p1 = poly[(k + 1) % N], dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy) || 1; return { p0: p0, p1: p1, ux: dx / len, uy: dy / len, len: len }; }
    [[gIx, GAP], [bIx, GAPB]].forEach(function (g3) { if (g3[0] < 0) return; var r3 = runOf(g3[0]); poly[g3[0]] = [r3.p0[0] - r3.ux * g3[1] / 2, r3.p0[1] - r3.uy * g3[1] / 2]; });   // the gate corner slides back along its run so the gap's middle sits where the road comes
    var gateAt = null, backAt = null, mendAt = null, stumpRun = story === 'raided' ? (mendIx + 1 + Math.floor(R() * (N - 2))) % N : -1;
    var edgeMids = []; (function () { var k9, p9; for (k9 in V.H) { p9 = k9.split(','); edgeMids.push([(+p9[0] + 0.5) * T, +p9[1] * T]); } for (k9 in V.V) { p9 = k9.split(','); edgeMids.push([+p9[0] * T, (+p9[1] + 0.5) * T]); } })();
    function stakeAt(px, py, mended, stump) { for (var ni = 0; ni < edgeMids.length; ni++) if (Math.abs(edgeMids[ni][0] - px) < 18 && Math.abs(edgeMids[ni][1] - py) < 18) return; if (shore === 's' && py > ecy + ery * 0.75) return; if (V.ruin && R() < 0.35) return; var st = { name: 'stake', x: px, y: py, solid: 5 }; if (mended) { st.mended = true; st.weak = true; } if (stump) { st.cut = true; st.solid = 3; } prop(st); }
    for (i2 = 0; i2 < N; i2++) {
      var r2 = runOf(i2), skip0 = i2 === gIx ? GAP : i2 === bIx ? GAPB : 0, s2;
      if (i2 === gIx) gateAt = [r2.p0[0] + r2.ux * GAP / 2, r2.p0[1] + r2.uy * GAP / 2]; if (i2 === bIx) backAt = [r2.p0[0] + r2.ux * GAPB / 2, r2.p0[1] + r2.uy * GAPB / 2];
      if (i2 === mendIx) mendAt = [r2.p0[0] + r2.ux * r2.len / 2, r2.p0[1] + r2.uy * r2.len / 2];
      for (s2 = skip0; s2 <= r2.len - G.stakeStep * 0.45; s2 += G.stakeStep) stakeAt(r2.p0[0] + r2.ux * s2, r2.p0[1] + r2.uy * s2, i2 === mendIx, i2 === stumpRun && R() < 0.5);
    }
    if (shore !== 's' && gateAt) { var rg = runOf(gIx); for (i2 = 0; i2 < Math.round(G.banners); i2++) { var bs2 = i2 % 2 ? GAP + 7 : -7; prop({ name: 'banner', x: rg.p0[0] + rg.ux * bs2, y: rg.p0[1] + rg.uy * bs2 + 2, solid: 3, landmark: true }); } }
    V.fence = { x0: ex0, y0: ey0, x1: ex1, y1: ey1, kind: 'palisade', round: true, gate: gateX, cx: ecx, cy: ecy, rx: erx, ry: ery, poly: poly, gateAt: shore === 's' ? null : gateAt, backAt: backAt, mendAt: mendAt };   // gateAt, backAt: the gaps in the ring of stakes; poly: its corners in the world's units; mendAt: the weak run's middle
  } else {
    var wideGate = A.townwall ? 1 : 0, weakSide = R() < 0.5 ? 'e' : 'w', weakY = Math.floor((ey0 + ey1) / 2 + (R() - 0.5) * (ey1 - ey0) * 0.4), weakAt = null;   // a town's gate is two tiles wide (2026-10-13: through one tile a fight was a duel with everyone else waiting); a wooden panel in a stone wall is the raider's weak piece
    for (x = ex0; x < ex1; x++) { if (x === backGateX) H(x, ey0, 'gate', 2); else if (!(V.ruin && R() < 0.4)) H(x, ey0, fk, fm); if (gateX != null && (x === gateX || (wideGate && x === gateX + 1)) && shore !== 's') H(x, ey1, 'gate', 2); else if (!(V.ruin && R() < 0.4) && !(shore === 's')) H(x, ey1, fk, fm); }
    for (y = ey0; y < ey1; y++) { var wk = A.townwall && wealth < 0.85 && y === weakY; if (!(V.ruin && R() < 0.4) && shore !== 'w') { if (wk && weakSide === 'w') { Vw(ex0, y, 'fence', 2); weakAt = [ex0 * T, (y + 0.5) * T]; } else Vw(ex0, y, fk, fm); } if (!(V.ruin && R() < 0.4) && shore !== 'e') { if (wk && weakSide === 'e') { Vw(ex1, y, 'fence', 2); weakAt = [ex1 * T, (y + 0.5) * T]; } else Vw(ex1, y, fk, fm); } }
    var posterns = [];                                     // a town's postern: a locked door in the side wall on a lane, the axe's way in (two in a great town)
    if (A.townwall) { var pSides = A.tier >= 5 ? ['e', 'w'] : [weakSide === 'e' ? 'w' : 'e'], pk; for (pk = 0; pk < pSides.length; pk++) { var py5 = clamp(Math.floor(ey0 + 3 + R() * Math.max(1, ey1 - ey0 - 6)), ey0 + 1, ey1 - 2); if (py5 === weakY) py5 += 1; var pxx = pSides[pk] === 'e' ? ex1 : ex0, pky = key(pxx, py5); if (V.V[pky] && V.V[pky].t === fk) { V.V[pky] = { t: 'door', m: 6, locked: 1 }; posterns.push([pxx * T, (py5 + 0.5) * T]); } } }
    V.fence = { x0: ex0, y0: ey0, x1: ex1, y1: ey1, kind: fk, gate: gateX, gateW: 1 + wideGate, weakAt: weakAt, posterns: posterns };
    if (fk === 'rail') { var k7; for (k7 in V.H) { if (V.H[k7].t === 'rail') V.H[k7].hidden = 1; } for (k7 in V.V) { if (V.V[k7].t === 'rail') V.V[k7].hidden = 1; } var gps = []; if (gateX != null && shore !== 's') gps.push([gateX * T, ey1 * T, (gateX + 1 + wideGate) * T, ey1 * T]); if (backGateX != null) gps.push([backGateX * T, ey0 * T, (backGateX + 1) * T, ey0 * T]); fencePoly({ x: ex0, y: ey0, w: ex1 - ex0, h: ey1 - ey0 }, 'rail', gps, shore === 's' ? 's' : shore === 'n' ? 'n' : shore === 'e' ? 'e' : shore === 'w' ? 'w' : null, null); }   // the village's rail fence drawn as posts round the whole, the edges under it hidden
    if (A.townwall && wealth >= 0.5 && gateX != null) { prop({ name: 'watchtower', x: (gateX - 1.2) * T, y: ey1 * T - 18, solid: 12, tower: true, landmark: true }); V.items.push({ name: 'torchBracket', x: (gateX + 1 + wideGate + 0.35) * T, y: ey1 * T + 2, r: 0, wall: true, light: 1, lamp: true }); }   // a walled town's gate: a watchtower inside the wall beside it (a bowman's post, step 6 of the raid plan) and a torch at the post, lit at night (the Art Director's pieces, 2026-10-20)
    if (A.townwall && gateX != null) { prop({ name: 'banner', x: (gateX - 0.4) * T, y: ey1 * T + 8, solid: 3 }); prop({ name: 'banner', x: (gateX + 1 + wideGate + 0.4) * T, y: ey1 * T + 8, solid: 3 }); prop({ name: 'tollPost', x: (gateX + 1 + wideGate + 1.6) * T, y: (ey1 + 2.5) * T, solid: 3 }); }   // the toll post outside the gate beside the road (the Art Director's piece, Robin's yes of 2026-10-22; skipped until it exists)
  }
  // ---- the roads: the spine painted (narrow at the gates, wide at the focus, ragged at the edges), each unit's lane to it ----
  function road(pts, kind) {                        // a smooth curve through [x, y, r] points (Catmull-Rom), laid as dabs
    var i, sAlong = 0, ph0 = R() * 6.28;
    function P(i) { return pts[Math.max(0, Math.min(pts.length - 1, i))]; }
    for (i = 0; i < pts.length - 1; i++) {
      var p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.round(len / 4)), k;
      for (k = 0; k < n; k++) {
        var u = k / n, u2 = u * u, u3 = u2 * u;
        var x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3);
        var y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3);
        var r = p1[2] + (p2[2] - p1[2]) * u, dx = p2[0] - p1[0], dy = p2[1] - p1[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl, wnd = Math.sin(sAlong * 0.04 + ph0) * 4;
        sAlong += len / n;
        dab(x + nx * wnd + (R() - 0.5) * 2, y + ny * wnd + (R() - 0.5) * 2, r * (0.8 + R() * 0.35), kind);
        if (R() < 0.3) { var sd = R() < 0.5 ? 1 : -1; dab(x + nx * (wnd + sd * (r + 2)), y + ny * (wnd + sd * (r + 2)), r * 0.35 + R() * 2, kind); }
      }
    }
  }
  var rw = G.roadW;
  V.spine.forEach(function (pl) {
    var n = pl.pts.length, k = pl.cls === 'main' ? 1 : pl.cls === 'ring' ? 0.85 : pl.cls === 'lane' ? 0.65 : 0.45;
    var pts = pl.pts.map(function (p, i) { var end = i === 0 || i === n - 1, mid = Math.min(i, n - 1 - i) / Math.max(1, (n - 1) / 2), r = pl.taper ? rw * (0.6 + 0.5 * mid) : rw * k * (end ? 0.7 : 1); return [p[0] * T, p[1] * T, r]; });
    road(pts, 2);
  });
  V.units.forEach(function (u) {                       // each unit's lane from its gap to the nearest point of the spine
    if (u.plot) return; var best = null, bd = 1e9; spinePts.forEach(function (p) { var d = Math.hypot(p[0] * T - u.gapC[0], p[1] * T - u.gapC[1]); if (d < bd) { bd = d; best = p; } });
    if (best && bd > 8) strokeTo(u.gapC, [best[0] * T, best[1] * T], rw * 0.5, 2);
  });
  var mainPl = V.spine.filter(function (q) { return q.cls === 'main'; });
  var inPl = A.family === 'single' ? V.spine[0] : (A.family === 'row' ? V.spine[0] : V.spine.filter(function (q) { return q.cls === 'main' && q.pts[0][1] > ty + h; })[0] || mainPl[0]), outPl = V.spine.filter(function (q) { return q.cls === 'lane' && q.pts[q.pts.length - 1][1] < ty; })[0];
  V.roadEnds = { front: inPl ? [inPl.pts[0][0] * T, inPl.pts[0][1] * T] : [focus[0], (ty + h) * T], back: outPl ? [outPl.pts[outPl.pts.length - 1][0] * T, outPl.pts[outPl.pts.length - 1][1] * T] : null };   // where a page can join a road on
  if (shore === 's') V.roadEnds.front = [V.roadEnds.front[0], (ty + h + 0.3) * T];
  if (G.pathGravel) { if (gateX != null && shore !== 's') dab((gateX + 0.5) * T, ey1 * T + 6, 10, 1); if (backGateX != null) dab((backGateX + 0.5) * T, ey0 * T, 8, 1); }
  if (G.mossEdge) { dab(ex0 * T + 10, ey0 * T + 10, 20, 3); dab(ex1 * T - 10, ey0 * T + 16, 16, 3); dab(ex0 * T + 14, ey1 * T - 12, 14, 3); }
  // ---- nature kept in and round the place (Robin, 2026-10-07: lived-in like the reference, not a cleared green) ----
  V.nature = [];
  function freeAt(x2, y2, r, skipLots) {
    var i, l;
    for (i = 0; i < V.lots.length; i++) { l = V.lots[i]; var mg = skipLots ? 0 : T; if (x2 > l.x * T - mg - r && x2 < (l.x + l.w) * T + mg + r && y2 > l.y * T - mg - r && y2 < (l.y + l.h) * T + mg + r) return false; }
    for (i = 0; i < V.yards.length; i++) { var yd = V.yards[i]; if (x2 > (yd.x - 0.5) * T - r && x2 < (yd.x + yd.w + 0.5) * T + r && y2 > (yd.y - 0.5) * T - r && y2 < (yd.y + yd.h + 0.5) * T + r) return false; }
    for (i = 0; i < spinePts.length; i++) if (Math.abs(spinePts[i][0] * T - x2) < r + 40 && Math.abs(spinePts[i][1] * T - y2) < r + 40) return false;
    for (i = 0; i < V.paints.length; i++) { var pa = V.paints[i]; if (pa.r >= 5 && Math.hypot(pa.x - x2, pa.y - y2) < pa.r + r + 8) return false; }
    for (i = 0; i < V.items.length; i++) if (Math.hypot(V.items[i].x - x2, V.items[i].y - y2) < r + 20) return false;
    for (i = 0; i < V.props.length; i++) if (Math.hypot(V.props[i].x - x2, V.props[i].y - y2) < r + 14) return false;
    for (i = 0; i < V.nature.length; i++) if (Math.hypot(V.nature[i].x - x2, V.nature[i].y - y2) < r + V.nature[i].r + 12) return false;
    if (V.folk.length) for (i = 0; i < V.folk.length; i++) if (Math.hypot(V.folk[i].x - x2, V.folk[i].y - y2) < r + 16) return false;
    return true;
  }
  function onUnitEdge(x2, y2) { var i; for (i = 0; i < V.units.length; i++) { var u = V.units[i]; if (!u.fence) continue; var fx = x2 / T, fy = y2 / T; if (fx > u.x - 0.6 && fx < u.x + u.w + 0.6 && fy > u.y - 0.6 && fy < u.y + u.h + 0.6 && !(fx > u.x + 0.6 && fx < u.x + u.w - 0.6 && fy > u.y + 0.6 && fy < u.y + u.h - 0.6)) return true; } return false; }
  if (G.nature) {
    for (y = ey0 - 2; y <= ey1 + 1; y++) for (x = ex0 - 2; x <= ex1 + 1; x++) {
      var inside2 = x >= ex0 && x < ex1 && y >= ey0 && y < ey1, px3 = (x + 0.2 + R() * 0.6) * T, py3 = (y + 0.3 + R() * 0.5) * T, roll = R(), nm = null, ns3 = 1, nr = 0;
      if (x < tx || y < ty || x >= tx + w || y >= ty + h) continue;
      if (!inside2 && (x === ex0 - 1 || x === ex1 || y === ey0 - 1 || y === ey1)) continue;   // nothing on the fence line itself
      if (inside2) { if (roll < (A.tier >= 4 ? 0.02 : 0.05)) { nm = R() < 0.6 ? 'birch' : 'oak'; ns3 = 0.92 + R() * 0.12; nr = 11; } else if (roll < 0.11) { nm = R() < 0.6 ? 'bush' : 'flower'; ns3 = 0.8 + R() * 0.2; } }   /* (the scales were for the drawn props; the Art Director's pictures are at their true size, and a village's trees were half trees: Robin, 2026-10-21) */
      else { if (roll < 0.1) { nm = R() < 0.7 ? 'rock' : 'rockFormation'; ns3 = 0.85 + R() * 0.15; nr = 10; } else if (roll < 0.17) { nm = 'bush'; ns3 = 0.8 + R() * 0.2; } else if (roll < 0.3) { nm = R() < 0.5 ? 'birch' : 'pine'; ns3 = 0.92 + R() * 0.12; nr = 11; } }
      if (!nm || onUnitEdge(px3, py3) || !freeAt(px3, py3, nr + 6)) continue;
      V.nature.push({ name: nm, x: px3, y: py3, s: ns3, r: nr, v: Math.floor(R() * 3) });
    }
    V.lots.forEach(function (l) {                      // a bush against a side wall now and then
      if (R() > 0.55) return; var sideB = R() < 0.5 ? -1 : 1, bx = sideB < 0 ? l.x * T - 10 : (l.x + l.w) * T + 10, by = (l.y + 0.3 + R() * (l.h - 0.6)) * T;
      if (!freeAt(bx, by, 4, true) || onUnitEdge(bx, by)) return; V.nature.push({ name: 'bush', x: bx, y: by, s: 0.85, r: 0, v: Math.floor(R() * 3) });
    });
  }
  // ---- the outside: the fields on the side with the room, the sacred at a corner, the midden behind, a grave beyond; the story's marks ----
  var roomE = tx + w - ex1, roomW = ex0 - tx, fieldSide = roomE >= roomW ? 1 : -1;
  if (G.fields && A.tier !== 0 && !V.ruin && story !== 'seal' || (G.fields && archId === 'farmstead')) {
    var strips = G.fieldStrips + Math.floor(V.units.length / 3), fx = fieldSide > 0 ? ex1 + 2 : ex0 - 6, fy0 = ey0 + 1, s2;
    if (fx > tx && fx + 4 < tx + w) for (s2 = 0; s2 < strips; s2++) { var sy3 = fy0 + s2 * 3; if (sy3 + 2 > ty + h) break; strokeTo([(fx + 0.5) * T, (sy3 + 1) * T], [(fx + 3.5) * T, (sy3 + 1) * T], 10, 2); if (s2 === 1) prop({ name: 'scarecrow', x: (fx + 2) * T, y: (sy3 + 0.3) * T }); }
    if (fx > tx && fx + 4 < tx + w) prop({ name: 'haystack', x: (fx + 2) * T, y: Math.min(ty + h - 1, fy0 + Math.min(strips, Math.floor((ty + h - fy0) / 3)) * 3 + 0.5) * T });
  }
  if (G.sacred && !green) { var sc = tile(ex0 - 1 >= tx ? ex0 - 1 : ex1 + 1, ey0); prop({ name: 'runestone', x: sc[0], y: sc[1], lore: 'Raised by the folk of ' + (opts.name || 'this place') + ' for one who did not come home.' }); find({ kind: 'stone', x: sc[0], y: sc[1] }); }
  if (story === 'oldseat') { var shp2 = tile(fieldSide > 0 ? ex0 - 4 : ex1 + 3, ey1 - 2); if (shp2[0] > tx * T && shp2[0] < (tx + w) * T) { prop({ name: 'stoneShip', x: shp2[0], y: shp2[1], solid: 14, lore: 'A ship of stones for a chieftain nobody remembers.' }); find({ kind: 'stone', x: shp2[0], y: shp2[1] }); } }
  if (story === 'smith') { var cp = tile(fieldSide > 0 ? ex0 - 2 : ex1 + 1, ey1 - 1); prop({ name: 'charcoalPit', x: cp[0], y: cp[1], solid: 10 }); prop({ name: 'charcoalPit', x: cp[0] + (fieldSide > 0 ? -1 : 1) * 48, y: cp[1] - 20, solid: 10 }); }
  if (story === 'seal' && shore === 's') { var k4; for (k4 = 0; k4 < 3; k4++) prop({ name: 'dryingRack', x: (ex0 + 2 + k4 * 3.5) * T, y: (ty + h - 1.6) * T, solid: 6 }); }
  if (G.midden && A.family === 'single') { var mp = tile(ex1 - 1, ey0 - 1 >= ty ? ey0 - 1 : ey0); dab(mp[0], mp[1], 16, 2); prop({ name: 'midden', x: mp[0], y: mp[1], solid: 10 }); prop({ name: 'crate', x: mp[0] - 22, y: mp[1] + 6, loot: { fiber: 2 } }); }   /* (the midden heap on trodden earth, the Art Director's piece, 2026-10-20) */
  var graveN = (G.graves ? (R() < 0.6 ? 1 : 0) : 0) + (story === 'raided' ? 2 : 0) + (age === 'old' ? 1 : 0), gk2;
  for (gk2 = 0; gk2 < graveN; gk2++) { var gp = tile((ex1 + 1 < tx + w ? ex1 + 1 : ex0 - 1) + (gk2 % 2) * (ex1 + 2 < tx + w ? 1 : -1), ey1 - 1 - Math.floor(gk2 / 2) * 2); if (gp[0] < tx * T || gp[0] > (tx + w) * T) continue; prop({ name: 'cairn', x: gp[0], y: gp[1], grave: true }); find({ kind: 'grave', x: gp[0], y: gp[1] }); }
  // ---- the people: a household per home, with their spots (their door, their own yard, the common, a workplace) and lines by role ----
  var nPeople = V.ruin ? 0 : pickRange(R, A.people, 0) + (story === 'market' ? 2 : 0), hi = 0, roles = ['farmer', 'fisher', 'smith', 'weaver', 'elder', 'child', 'thrall'];
  var wc = focus, wellIt = V.items.filter(function (it) { return it.name === 'woodenWell'; })[0], blocks = V.props.filter(function (pr) { return pr.block; }), racks = V.props.filter(function (pr) { return pr.name === 'dryingRack'; });
  function nearestOf(list, x2, y2) { var b = null, bd = 1e9; list.forEach(function (o) { var d = Math.hypot(o.x - x2, o.y - y2); if (d < bd) { bd = d; b = o; } }); return b; }
  function unitOf(l) { return l.unit != null ? V.units[l.unit] : null; }
  var gateNode = gateX != null ? tile(gateX, ey1) : (V.fence && V.fence.gateAt ? V.fence.gateAt : null);
  for (var pi = 0; pi < nPeople && homes.length; pi++) {
    var home = homes[hi % homes.length]; hi++;
    var door = home.door === 's' ? tile(home.dx, home.y + home.h + 1) : home.door === 'e' ? tile(home.x + home.w + 1, home.dy) : home.door === 'w' ? tile(home.x - 2, home.dy) : tile(home.dx, home.y - 2);
    var role = home.calling || (A.lone ? 'fisherman' : shore && R() < 0.4 ? 'fisher' : roles[Math.floor(R() * roles.length)]); if (role === 'smith' && !V.lots.some(function (l) { return l.id === 'smithy'; })) role = 'farmer'; if (!home.calling) home.calling = role;
    if (A.chapel) role = 'priest'; else if (A.church && pi === 0) role = 'priest'; else if (A.townwall && (pi === 1 || pi === 2 || (wealth > 0.7 && (pi === 4 || pi === 5)))) role = 'guard'; else if ((A.townwall || A.family === 'row') && pi === 3) role = 'merchant';
    var work = role === 'smith' ? nearestOf(V.lots.filter(function (l) { return l.id === 'smithy'; }).map(function (l) { return { x: l.x * T, y: l.y * T, l: l }; }), door[0], door[1]) : role === 'fisher' && shore ? null : nearestOf(V.lots.filter(function (l) { return l.id === 'byre' || l.id === 'store'; }).map(function (l) { return { x: l.x * T, y: l.y * T, l: l }; }), door[0], door[1]); work = work && work.l;
    var seatsV = V.items.filter(function (it) { return it.name === 'logSeat'; }), seatV = seatsV.length ? seatsV[pi % seatsV.length] : null, hu = unitOf(home);
    var spots = [door.concat(['door']), [wc[0] + (R() - 0.5) * 30, wc[1] + 20 + (R() - 0.5) * 20], [wc[0] + (R() - 0.5) * (V.yard.w * T * 0.6), wc[1] + (R() - 0.5) * (V.yard.h * T * 0.6)]];
    if (hu && hu.yard && !hu.plot) spots.push([(hu.yard.x + hu.yard.w / 2) * T + (R() - 0.5) * 24, (hu.yard.y + hu.yard.h / 2) * T + (R() - 0.5) * 20]);
    if (seatV) spots.push([seatV.x, seatV.y + 1.5, 'sit']);
    // the jobs (Robin, 2026-10-07: people with something to do): a farmer or thrall chops at the block and carries water, a fisher fishes
    // at the shore or hangs the catch, the smith hammers by the smithy, the weaver and the elder sweep the doorstep; a child only plays
    var block = nearestOf(blocks, door[0], door[1]), rackIt = nearestOf(racks, door[0], door[1]);
    if (role === 'smith' && work) spots.push([tile(work.dx >= 0 ? work.dx : work.x, work.y + work.h)[0] + 18, (work.y + work.h) * T + 18, 'smith']);
    else if (role === 'fisher' || role === 'fisherman') { if (shore) spots.push((shore === 's' ? [wc[0] + (R() - 0.5) * 80, (ty + h - 1) * T + 6] : shore === 'n' ? [wc[0], (ty + 1) * T] : shore === 'e' ? [(tx + w - 1) * T, wc[1]] : [(tx + 1) * T, wc[1]]).concat(['fish'])); if (rackIt) spots.push([rackIt.x, rackIt.y + 12, 'hang']); }
    else if (role === 'farmer' || role === 'thrall') { if (block && R() < 0.7) spots.push([block.x, block.y - 16, 'chop']); if (wellIt) spots.push([wellIt.x, wellIt.y + 16, 'carry']); }
    else if (role === 'weaver' || role === 'elder') { spots.push([door[0] + 12, door[1] + 2, 'sweep']); if (wellIt && R() < 0.5) spots.push([wellIt.x, wellIt.y + 16, 'carry']); }
    else if (role === 'priest') { var chl = V.lots.filter(function (l) { return l.id === 'church'; })[0]; if (chl) { spots.push([(chl.dx + 0.5) * T, (chl.y + chl.h + 1.2) * T, 'door']); var alt = V.items.filter(function (it) { return it.altar; })[0]; if (alt) spots.push([alt.x, alt.y + 18, 'pray']); } }   // (pray: he kneels before the altar, the kneel clip of step 5B, 2026-10-21)
    else if (role === 'guard') { if (gateNode) spots.push([gateNode[0] + (pi === 1 ? -14 : 14), gateNode[1] - 18, 'guard']); }
    else if (role === 'merchant') { var stl = V.items.filter(function (it) { return it.name === 'stall'; })[0]; if (stl) spots.push([stl.x, stl.y + 14, 'guard']); }
    else if (work) spots.push(tile(work.dx >= 0 ? work.dx : work.x, work.y + work.h + 1));
    var nu = R(), fem = R() < 0.5, NL = fem ? NAMES_F : NAMES_M;   /* (the same two draws in the same order as before, so no place moves) */
    V.folk.push({ name: NL[Math.floor(nu * NL.length)], role: role, home: [home.x, home.y], unit: home.unit, x: door[0], y: door[1], spots: spots, lines: ROLES[role], female: fem, out: R() < G.outsideShare });
  }
  // ---- the ground worn where the people walk (2026-10-22, settlements-plan.md step 9): every household's ways between its spots, counted a tile at a time; the busy tiles are earth, the busiest gravel ----
  function passable(x2, y2) { return x2 >= tx - 1 && y2 >= ty - 1 && x2 < tx + w + 1 && y2 < ty + h + 1 && !V.floors[key(x2, y2)]; }
  function wallBetween(x2, y2, nx, ny) { var e; if (ny < y2) e = V.H[key(x2, y2)]; else if (ny > y2) e = V.H[key(x2, ny)]; else if (nx < x2) e = V.V[key(x2, y2)]; else e = V.V[key(nx, y2)]; return e && e.t !== 'door' && e.t !== 'gate'; }
  var stakeTiles = {}; V.props.forEach(function (p) { if (p.name === 'stake' && !p.cut) stakeTiles[key(Math.floor(p.x / T), Math.floor(p.y / T))] = 1; });
  function routes(from, targets, each) {              // a breadth-first search from one tile to many on the tile grid, walls and stakes in the way; each(path) for every target reached
    var start = key(from[0], from[1]), prev = {}, q = [from], qi = 0, left = targets.length, k2; prev[start] = null;
    var want = {}; targets.forEach(function (t) { want[key(t[0], t[1])] = (want[key(t[0], t[1])] || 0) + 1; });
    while (qi < q.length && left > 0 && qi < 20000) {
      var c = q[qi++], ck = key(c[0], c[1]); if (want[ck]) { left -= want[ck]; var path = [], at = ck; while (at) { var pq = at.split(','); path.push([+pq[0], +pq[1]]); at = prev[at]; } each(path, want[ck]); want[ck] = 0; }
      for (k2 = 0; k2 < 4; k2++) { var nx = c[0] + [1, -1, 0, 0][k2], ny = c[1] + [0, 0, 1, -1][k2], nk = key(nx, ny); if (prev[nk] !== undefined || !passable(nx, ny) || stakeTiles[nk] || wallBetween(c[0], c[1], nx, ny)) continue; prev[nk] = ck; q.push([nx, ny]); }
    }
  }
  if (G.wear && !V.ruin) {
    var traffic = {}, gateT = gateX != null ? [gateX, ey1] : (shore === 's' ? [Math.floor(focus[0] / T), ty + h - 1] : null);
    V.folk.forEach(function (f, fi) {
      var from = [Math.floor(f.x / T), Math.floor(f.y / T)], tg = [];
      f.spots.forEach(function (s) { if (s[2] === 'door') return; tg.push([Math.floor(s[0] / T), Math.floor(s[1] / T)]); });
      if (gateT && fi % 3 === 0) tg.push(gateT);
      routes(from, tg, function (path, wgt) { path.forEach(function (p) { var pk = key(p[0], p[1]); traffic[pk] = (traffic[pk] || 0) + wgt; }); });
    });
    var k6b, fill2 = {}; for (k6b in traffic) { if (traffic[k6b] < G.wearAt) continue; var pq3 = k6b.split(','), tx3 = +pq3[0], ty3 = +pq3[1]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) { var nk2 = key(tx3 + dd[0], ty3 + dd[1]); if ((traffic[nk2] || 0) >= G.wearAt) return; var nb = 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d2) { if ((traffic[key(tx3 + dd[0] + d2[0], ty3 + dd[1] + d2[1])] || 0) >= G.wearAt) nb++; }); if (nb >= 2) fill2[nk2] = G.wearAt; }); }
    for (k6b in fill2) traffic[k6b] = Math.max(traffic[k6b] || 0, fill2[k6b]);   // (no lone tile of grass inside a worn way: the game's ground is a field of tiles, and a checkerboard read as tiles, the Art Director's review of 2026-10-22)
    var k5; for (k5 in traffic) {                      // a worn tile, and the ground along the way to the next worn tile, as one ragged stroke off the tile grid (the Art Director's review, 2026-10-22: the earth left grass in square patches)
      var tcnt = traffic[k5]; if (tcnt < G.wearAt) continue; var pq2 = k5.split(','), wtx = +pq2[0], wty = +pq2[1], wx = (wtx + 0.5) * T + (R() - 0.5) * 10, wy = (wty + 0.5) * T + (R() - 0.5) * 10, wr = 6 + Math.min(7, tcnt * 0.9); if (V.floors[k5]) continue;
      dab(wx, wy, wr * (0.8 + R() * 0.5), 2);
      if ((traffic[key(wtx + 1, wty)] || 0) >= G.wearAt && !V.floors[key(wtx + 1, wty)]) strokeTo([wx, wy], [(wtx + 1.5) * T + (R() - 0.5) * 10, wy + (R() - 0.5) * 12], wr * 0.9, 2);
      if ((traffic[key(wtx, wty + 1)] || 0) >= G.wearAt && !V.floors[key(wtx, wty + 1)]) strokeTo([wx, wy], [wx + (R() - 0.5) * 12, (wty + 1.5) * T + (R() - 0.5) * 10], wr * 0.9, 2);
      if (tcnt >= 10 && G.pathGravel) dab(wx, wy, 5, 1);
    }
  }
  // ---- doorways, gates and the units' gaps kept clear: nothing solid within a tile and a half of them ----
  var keep = [];
  V.lots.forEach(function (l) { if (l.dx == null && l.dy == null) return; (l.door === 's' ? [[l.dx, l.y + l.h], [l.dx, l.y + l.h + 1]] : l.door === 'n' ? [[l.dx, l.y - 1], [l.dx, l.y - 2]] : l.door === 'e' ? [[l.x + l.w, l.dy], [l.x + l.w + 1, l.dy]] : [[l.x - 1, l.dy], [l.x - 2, l.dy]]).forEach(function (q) { keep.push(q); }); });
  if (V.fence && !V.fence.round) { var Fk = V.fence, gk; if (Fk.gate != null) for (gk = 0; gk < (Fk.gateW || 1); gk++) keep.push([Fk.gate + gk, Fk.y1 - 1], [Fk.gate + gk, Fk.y1]); for (gk = Fk.x0; gk < Fk.x1; gk++) if (V.H[key(gk, Fk.y0)] && V.H[key(gk, Fk.y0)].t === 'gate') keep.push([gk, Fk.y0 - 1], [gk, Fk.y0]); }
  V.units.forEach(function (u) { if (u.plot) return; var gx2 = Math.floor(u.gapC[0] / T), gy2 = Math.floor(u.gapC[1] / T); keep.push([gx2, gy2], [gx2, gy2 + (u.front === 's' ? 1 : u.front === 'n' ? -1 : 0)], [gx2 + (u.front === 'e' ? 1 : u.front === 'w' ? -1 : 0), gy2]); });
  function inWay(o, r) { if (!(r > 0)) return false; for (var i = 0; i < keep.length; i++) if (Math.hypot(o.x - (keep[i][0] + 0.5) * T, o.y - (keep[i][1] + 0.5) * T) < T * 1.5) return true; return false; }
  V.props = V.props.filter(function (o) { return !inWay(o, o.solid != null ? o.solid : (o.name === 'scarecrow' ? 4 : 8)); });
  V.nature = V.nature.filter(function (o) { return !inWay(o, o.r); });
  if (V.fence && V.fence.poly) V.props = V.props.filter(function (pr) { if (pr.name !== 'stake') return true; for (var ni = 0; ni < V.nature.length; ni++) { var nq = V.nature[ni]; if (nq.r >= 6 && Math.hypot(nq.x - pr.x, nq.y - pr.y) < nq.r + 9) return false; } return true; });   // the ring stops a stake short of a kept rock or tree (the polygon rings, 2026-10-21)
  // ---- the layer for exploring and raiding (settlements-plan.md section 5): nodes, zones, the ways in, the secrets ----
  var F = V.fence, gateP = F && F.round ? F.gateAt : (gateX != null && shore !== 's' ? [(gateX + (F && F.gateW ? F.gateW / 2 : 0.5)) * T, ey1 * T] : null), backP = F && F.round ? F.backAt : (backGateX != null ? [(backGateX + 0.5) * T, ey0 * T] : null);
  if (gateP) V.nodes.push({ kind: 'gate', x: gateP[0], y: gateP[1] }); if (backP) V.nodes.push({ kind: 'backgate', x: backP[0], y: backP[1] });
  V.nodes.push({ kind: 'focus', x: focus[0], y: focus[1] });
  V.finds.forEach(function (f) { if (f.kind === 'jarl' || f.kind === 'silver') V.nodes.push({ kind: 'prize', x: f.x, y: f.y }); });
  V.units.forEach(function (u) { if (u.zone === 'private') V.nodes.push({ kind: 'precinct', x: u.gapC[0], y: u.gapC[1], unit: u.index }); });
  var hallL = V.lots.filter(function (l) { return l.id === 'hall'; })[0], churchL = V.lots.filter(function (l) { return l.id === 'church'; })[0];
  var lm = V.props.filter(function (p) { return p.tower; })[0] || V.props.filter(function (p) { return p.name === 'bellTower'; })[0] || (hallL ? null : V.props.filter(function (p) { return p.landmark; })[0]);
  if (lm) V.nodes.push({ kind: 'landmark', x: lm.x, y: lm.y, what: lm.name }); else if (churchL) V.nodes.push({ kind: 'landmark', x: (churchL.x + churchL.w / 2) * T, y: (churchL.y + churchL.h) * T, what: 'the church' }); else if (hallL) V.nodes.push({ kind: 'landmark', x: (hallL.x + hallL.w / 2) * T, y: (hallL.y + hallL.h) * T, what: 'the hall' }); else { var fire = V.items.filter(function (it) { return it.pit; })[0] || V.items.filter(function (it) { return it.hearth; })[0]; if (fire) V.nodes.push({ kind: 'landmark', x: fire.x, y: fire.y, what: fire.pit ? 'the fire' : 'the smoke' }); }
  if (shore === 's') V.nodes.push({ kind: 'shore', x: focus[0], y: (ty + h) * T });
  V.zones = [{ kind: 'public', rects: (green ? [green] : []).concat(V.units.filter(function (u) { return u.zone === 'public'; }).map(function (u) { return { x: u.x, y: u.y, w: u.w, h: u.h }; })) }, { kind: 'semi', rects: [{ x: ex0, y: ey0, w: ex1 - ex0, h: ey1 - ey0 }] }, { kind: 'private', rects: V.units.filter(function (u) { return u.zone === 'private'; }).map(function (u) { return { x: u.x, y: u.y, w: u.w, h: u.h }; }).concat(V.lots.filter(function (l) { return l.id === 'store'; }).map(function (l) { return { x: l.x, y: l.y, w: l.w, h: l.h }; })) }, { kind: 'prize', pts: V.finds.filter(function (f) { return f.kind === 'jarl' || f.kind === 'silver' || f.kind === 'cellar'; }).map(function (f) { return [f.x, f.y]; }) }];
  function way(kind, x2, y2, note, priceKey) { var pr = PRICE[priceKey || kind]; V.ways.push({ kind: kind, x: x2, y: y2, secs: pr.secs, noise: pr.noise, seen: pr.seen, note: note || pr.note }); }
  if (G.ways) {
    if (gateP) way('gate', gateP[0], gateP[1], A.townwall ? PRICE.gate.note : F && F.round ? 'the gate in the ring: the bar, the axe' : PRICE.fgate.note, A.townwall || (F && F.round) ? 'gate' : 'fgate');
    if (backP) way('backgate', backP[0], backP[1]);
    if (shore === 's') way('water', focus[0], (ty + h - 0.5) * T);
    if (F && F.mendAt) way('weak', F.mendAt[0], F.mendAt[1]);
    if (F && F.weakAt) way('panel', F.weakAt[0], F.weakAt[1]);
    (F && F.posterns || []).forEach(function (pp) { way('postern', pp[0], pp[1]); });
    if (F && !F.round && (F.kind === 'rail' || F.kind === 'fence' || F.kind === 'drystone')) { var fs = fieldSide > 0 ? ex0 : ex1, fy = Math.floor((ey0 + ey1) / 2); way(F.kind === 'drystone' ? 'wall' : 'fence', fs * T, (fy + 0.5) * T, F.kind === 'rail' ? PRICE.fence.note : F.kind === 'fence' ? 'a wattle fence: seven blows' : PRICE.drystone.note, F.kind === 'drystone' ? 'drystone' : 'fence'); }
  }
  // the secrets: a budget by tier from the pool, each where it belongs and with its cue; one of them a way in when the ways are short
  var budget = G.secrets ? SECRETS_BY_TIER[Math.min(5, A.tier)] : 0, pool2 = [];
  if (wealth >= G.cellarAt && homes.length && !V.ruin) pool2.push('cellar');
  if (V.lots.some(function (l) { return l.id === 'store'; })) pool2.push('loft');
  if (V.props.some(function (p) { return p.name === 'midden'; })) pool2.push('midden');
  if (V.props.some(function (p) { return p.grave; })) pool2.push('mound');
  if (F) pool2.push('shortcut');
  if (A.family === 'town' && V.units.some(function (u) { return u.plot && u.quarter === 'poor'; })) pool2.push('oldcellar');
  if (V.lots.some(function (l) { return l.id === 'smithy'; }) && wealth > 0.4) pool2.push('blade');
  var built = V.secrets.length + (hallL && hallL.back != null ? 1 : 0);
  if (hallL && hallL.back != null) V.secrets.push({ kind: 'backroom', x: (hallL.back + 1.5) * T, y: (hallL.y + hallL.h / 2) * T, cue: 'the locked door; the men stand nearer it than the fire', way: false });
  pool2.sort(function () { return R() - 0.5; });
  var needWay = G.ways && V.ways.length < WAYS_BY_TIER[Math.min(5, A.tier)] && pool2.indexOf('shortcut') >= 0, allow = Math.max(budget, wealth >= G.cellarAt ? 1 : 0) + (needWay ? 1 : 0);   // the shortcut comes on top of the budget when the ways in are short
  if (needWay) { pool2.splice(pool2.indexOf('shortcut'), 1); pool2.unshift('shortcut'); }
  if (pool2.indexOf('cellar') > 0 && wealth >= G.cellarAt) { pool2.splice(pool2.indexOf('cellar'), 1); pool2.unshift('cellar'); }   // the cellar first: the game's raid counts on it from cellarAt
  var si3; for (si3 = 0; si3 < pool2.length && V.secrets.length < allow; si3++) {
    var sk = pool2[si3], cx4, cy4;
    if (sk === 'cellar') { var cl = homes[Math.floor(R() * homes.length)], cp2 = cl.id === 'house' ? (cl.door === 'w' ? tile(cl.x + 2, cl.y + 2) : cl.door === 'e' ? tile(cl.x + cl.w - 3, cl.y + 2) : cl.door === 's' ? tile(cl.x + 2, cl.y + cl.h - 3) : tile(cl.x + 2, cl.y + 2)) : tile(cl.x + Math.floor(cl.w / 2) - 2, cl.y + cl.h - 2); item('cellarDoor', cp2[0], cp2[1] - 2, { cellar: true, store: true, old: V.age === 'old', big: cl.id !== 'house' || cl.w * cl.h >= 56, loot: { coin: 6 + Math.floor(wealth * 10), leather: 3, copper: 2 }, lore: 'Someone kept this well hidden.' }); item('rug', cp2[0], cp2[1] - 1, { r: 0, flat: true }); find({ kind: 'cellar', x: cp2[0], y: cp2[1] }); V.secrets.push({ kind: 'cellar', x: cp2[0], y: cp2[1], cue: 'a rug in a house that should have none', way: false }); }
    else if (sk === 'loft') { var st2 = V.lots.filter(function (l) { return l.id === 'store'; })[0], lp = tile(st2.x + st2.w - 1, st2.y); item('crate', lp[0] - 4, lp[1] + 4, { loot: { coin: 4 + Math.floor(wealth * 6), leather: 3, arrows: 10 }, loft: true, lore: 'Up under the roof, where the mice cannot reach.' }); prop({ name: 'ladder', x: (st2.x + st2.w) * T + 6, y: (st2.y + st2.h) * T - 6, solid: 2 }); V.secrets.push({ kind: 'loft', x: lp[0], y: lp[1], cue: 'a ladder against the storehouse', way: false }); }
    else if (sk === 'midden') { var md = V.props.filter(function (p) { return p.name === 'midden'; })[0]; prop({ name: 'crate', x: md.x - 20, y: md.y + 8, loot: { coin: 2 + Math.floor(wealth * 4), copper: 1 }, lore: 'Buried where nobody digs.' }); V.secrets.push({ kind: 'midden', x: md.x, y: md.y, cue: 'a spade left in the heap', way: false }); }
    else if (sk === 'mound') { var gv = V.props.filter(function (p) { return p.grave; })[0]; gv.hollow = true; V.secrets.push({ kind: 'mound', x: gv.x, y: gv.y, cue: 'a cairn with a fallen stone', way: false }); }
    else if (sk === 'blade') { var sm = V.lots.filter(function (l) { return l.id === 'smithy'; })[0], bp = V.items.filter(function (it) { return it.bench && it.x > sm.x * T && it.x < (sm.x + sm.w) * T; })[0]; if (bp) { bp.halfMade = true; V.secrets.push({ kind: 'blade', x: bp.x, y: bp.y, cue: 'the smith’s bench', way: false }); } }
    else if (sk === 'oldcellar') { var ep = V.units.filter(function (u) { return u.plot && u.quarter === 'poor'; })[0]; cx4 = (ep.x + ep.w / 2) * T; cy4 = (ep.y + ep.h / 2) * T; item('cellarDoor', cx4, cy4, { cellar: true, store: true, old: true, big: false, loot: { coin: 3 + Math.floor(wealth * 8), copper: 2 }, lore: 'A cellar of a house that burnt before anyone here was born.' }); V.nature.push({ name: 'bush', x: cx4 - 28, y: cy4 + 10, s: 0.8, r: 0, v: 1 }); V.secrets.push({ kind: 'oldcellar', x: cx4, y: cy4, cue: 'nettles in a square, a sunk floor', way: false }); }
    else if (sk === 'shortcut') {                       // the villagers' own way through the fence behind a bush, with the worn path that runs to it and stops
      var sx5, sy5, done = false, k6;
      if (F.round && F.poly) { var stakes = V.props.filter(function (p) { return p.name === 'stake' && !p.cut && !p.mended; }); for (k6 = 0; k6 < 20 && !done && stakes.length > 6; k6++) { var sti = stakes[Math.floor(R() * stakes.length)]; if (gateP && Math.hypot(sti.x - gateP[0], sti.y - gateP[1]) < 160) continue; if (backP && Math.hypot(sti.x - backP[0], sti.y - backP[1]) < 120) continue; if (shore === 's' && sti.y > focus[1]) continue; sx5 = sti.x; sy5 = sti.y; V.props.splice(V.props.indexOf(sti), 1); done = true; } }
      else { var side5 = fieldSide > 0 ? ex0 : ex1, sy6 = Math.floor(ey0 + 2 + R() * Math.max(1, ey1 - ey0 - 4)); for (k6 = 0; k6 < 10 && !done; k6++) { var ky = key(side5, sy6 + k6), e5 = V.V[ky]; if (e5 && e5.t !== 'gate' && e5.t !== 'townwall') { delete V.V[ky]; sx5 = side5 * T; sy5 = (sy6 + k6 + 0.5) * T; done = true; } } }
      if (done) { var dirx = sx5 < focus[0] ? 1 : -1; V.nature.push({ name: 'bush', x: sx5 - dirx * 14, y: sy5 + 8, s: 0.9, r: 0, v: 2 }); strokeTo([sx5 + dirx * 10, sy5], [sx5 + dirx * 70, sy5 + (R() - 0.5) * 30], 5, 2); V.secrets.push({ kind: 'shortcut', x: sx5, y: sy5, cue: 'a worn path that runs to the fence and stops', way: true }); if (G.ways) way('gap', sx5, sy5); }
    }
  }
  // ---- things on the walls inside (Robin, 2026-10-22: hangings and a cradle, "Yes to both"; the Art Director's interior pieces): on the
  // north wall of a house or a hall, the wall seen from inside with the roof off. Herbs and onions or pelts on a peg rail in most
  // houses, a woven hanging in a rich one; in a hall the woven hanging behind the high seat and pelts or herbs along the wall. Never on
  // a door, a window or the back room's wall, nor behind a tall thing standing against that wall. Each picture's foot is the wall's
  // foot, so it sorts just in front of the wall. The names carry the variant (the game draws an item's first picture only).
  var HANG_W = { wallHanging_1: 47, wallHanging_2: 34, wallHanging_3: 36 }, TALL = { shieldRack: 1, spearRack: 1, loom: 1, cupboard: 1, shelf: 1, dryingRack: 1, workbench: 1 };
  if (!V.ruin) V.lots.forEach(function (l) {
    var ins = BUILD[l.id] && BUILD[l.id].inside; if ((ins !== 'home' && ins !== 'hall') || l.ruin) return;
    var y0 = l.y * T, put = [];
    function inRoom(cx, wd) { return Math.max(l.x * T + 4 + wd / 2, Math.min((l.x + l.w) * T - 4 - wd / 2, cx)); }   // a corner column's hanging moved in off the side wall
    function fits(cx, wd) {                     // the stretch of wall behind it is whole wall, clear of tall things and of another hanging
      var a = cx - wd / 2, b = cx + wd / 2, x;
      if (a < l.x * T + 3 || b > (l.x + l.w) * T - 3) return false;
      for (x = Math.floor(a / T); x <= Math.floor((b - 0.01) / T); x++) { var e = V.H[key(x, l.y)]; if (!e || e.t !== 'wall') return false; if (l.back != null && (x === l.back || x === l.back - 1)) return false; }
      if (V.items.some(function (it) { return TALL[it.name] && it.y > y0 && it.y < y0 + T * 1.3 && Math.abs(it.x - cx) < wd / 2 + T * 0.6; })) return false;
      return !put.some(function (q) { return Math.abs(q - cx) < wd / 2 + T * 1.6; });
    }
    function hang(name, cx) { V.items.push({ name: name, x: cx, y: y0 + 2, r: 0, wall: true }); put.push(cx); }
    function homely() { return RD() < 0.55 ? 'wallHanging_3' : 'wallHanging_2'; }   // herbs and onions a little more often than pelts
    var spots = [], x2; for (x2 = l.x; x2 < l.x + l.w; x2++) spots.push((x2 + 0.5) * T);
    spots.sort(function () { return RD() - 0.5; });
    if (ins === 'hall') {
      var seat = V.items.filter(function (it) { return it.name === 'chair' && it.seat && it.x > l.x * T && it.x < (l.x + l.w) * T && it.y > y0 && it.y < y0 + T * 1.3; })[0];   // the high seat, when it stands against this wall
      if (seat && fits(seat.x, HANG_W.wallHanging_1)) hang('wallHanging_1', seat.x);
      var nH = 1 + (l.w >= 14 ? 1 : 0) + (l.w >= 19 ? 1 : 0), i2;
      for (i2 = 0; i2 < spots.length && nH > 0; i2++) { var nm2 = wealth > 0.6 && RD() < 0.25 ? 'wallHanging_1' : homely(), c2 = inRoom(spots[i2], HANG_W[nm2]); if (fits(c2, HANG_W[nm2])) { hang(nm2, c2); nH--; } }
    } else if (RD() < 0.85) {
      var nm = wealth > 0.5 && RD() < 0.35 ? 'wallHanging_1' : homely(), i3;
      for (i3 = 0; i3 < spots.length; i3++) { var c3 = inRoom(spots[i3], HANG_W[nm]); if (fits(c3, HANG_W[nm])) { hang(nm, c3); break; } }
    }
  });
  V.tactic = tacticOf(V, R);               // the place's plan of defence (raid step 6)
  V.wanted = nUnitsWanted;
  if (opts.debug) V.dbg = { bestCandidate: bestCandidate, boxFree: boxFree, spinePts: spinePts, hugRects: hugRects };   // (a test's way in to the growth's own checks)
  return V;
}
/* The audit (settlements-plan.md section 7): what the rules ask of a finished place, as lines; a line that begins with !! is a
   rule broken. Walkable (every door reached from the way in), the loops of the spine, the ways in and their price bands, a landmark,
   the denial on the way to the prize, the secrets against the budget, the loot spots and the carry, the men within noise of each
   heavy thing (with a defence given), the fire chain, the units against the plan, the doorways clear. audit(V, D) with D from
   defence(); returns { lines, bad, stats }. */
function audit(V, D) {
  var lines = [], bad = 0, A = ARCH[V.arch] || ARCH.small, st = {}, k, i;
  function say(s) { lines.push(s); if (s.indexOf('!!') === 0) bad++; }
  (V.notes || []).forEach(say);
  st.units = V.units.length; st.buildings = V.lots.length; st.people = V.folk.length;
  say((A.name) + ', ' + (V.shape || A.family) + ', ' + (STORIES[V.story] ? STORIES[V.story].name.toLowerCase() : V.story) + ', ' + V.age + ': ' + V.units.length + ' units, ' + V.lots.length + ' buildings, ' + V.folk.length + ' people, wealth ' + (+V.wealth).toFixed(2));
  if (V.wanted && V.units.length < V.wanted && A.family !== 'single') say((V.units.length < (A.farms ? A.farms[0] : A.plots ? A.plots[0] : 0) ? '!! ' : '') + V.units.length + ' units of ' + V.wanted + ' planned');
  // walkable: a breadth-first search from the way in over the tile grid, walls and stakes in the way, to the tile outside every door
  var floors = V.floors, stakeT = {}; V.props.forEach(function (p) { if (p.name === 'stake' && !p.cut) stakeT[key(Math.floor(p.x / T), Math.floor(p.y / T))] = 1; });
  function pass(x, y) { return x >= V.tx - 4 && y >= V.ty - 4 && x < V.tx + V.w + 4 && y < V.ty + V.h + 4 && !floors[key(x, y)]; }
  function wallB(x, y, nx, ny) { var e; if (ny < y) e = V.H[key(x, y)]; else if (ny > y) e = V.H[key(x, ny)]; else if (nx < x) e = V.V[key(x, y)]; else e = V.V[key(nx, y)]; return e && e.t !== 'door' && e.t !== 'gate'; }
  var gate = V.nodes.filter(function (n) { return n.kind === 'gate'; })[0] || V.nodes.filter(function (n) { return n.kind === 'shore'; })[0] || V.nodes.filter(function (n) { return n.kind === 'backgate'; })[0], dist = {};
  if (gate) {
    var sx = Math.floor(gate.x / T), sy = Math.floor(gate.y / T) + (gate.kind === 'shore' ? -1 : 0), q = [[sx, sy]], qi = 0; dist[key(sx, sy)] = 0;   // the gap's own tile (a gate's outside tile, a ring's gap), the shore's last tile of land
    while (qi < q.length && qi < 40000) { var c = q[qi++]; for (k = 0; k < 4; k++) { var nx = c[0] + [1, -1, 0, 0][k], ny = c[1] + [0, 0, 1, -1][k], nk = key(nx, ny); if (dist[nk] != null || !pass(nx, ny) || stakeT[nk] || wallB(c[0], c[1], nx, ny)) continue; dist[nk] = dist[key(c[0], c[1])] + 1; q.push([nx, ny]); } }
    var unreached = 0; V.lots.forEach(function (l) { if (l.dx == null && l.dy == null) return; var o = l.door === 's' ? [l.dx, l.y + l.h] : l.door === 'n' ? [l.dx, l.y - 1] : l.door === 'e' ? [l.x + l.w, l.dy] : [l.x - 1, l.dy]; if (dist[key(o[0], o[1])] == null) unreached++; });
    st.unreached = unreached; say((unreached ? '!! ' : '') + 'walkable: ' + (V.lots.length - unreached) + ' of ' + V.lots.length + ' doors reached from the way in');
  } else say('!! no way in to walk from');
  // the loops: the spine's polylines as a graph (junctions where two come within a tile); cycles = edges - nodes + 1
  var pls = V.spine || [], junctions = [], ends = 0, E = 0;
  function samples(pl) { var out = [], i2; for (i2 = 0; i2 < pl.pts.length - 1; i2++) { var a = pl.pts[i2], b = pl.pts[i2 + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.5)), k2; for (k2 = 0; k2 <= n; k2++) out.push([a[0] + (b[0] - a[0]) * k2 / n, a[1] + (b[1] - a[1]) * k2 / n]); } return out; }
  function jAt(x, y) { for (i = 0; i < junctions.length; i++) if (Math.hypot(junctions[i][0] - x, junctions[i][1] - y) < 3) return i; junctions.push([x, y]); return junctions.length - 1; }
  var touch = pls.map(function () { return []; }), smp = pls.map(samples), gr = V.green, gJ = -1;
  function atGreen(p) { return gr && p[0] > gr.x - 2 && p[0] < gr.x + gr.w + 2 && p[1] > gr.y - 2 && p[1] < gr.y + gr.h + 2; }
  if (gr) { gJ = junctions.length; junctions.push([gr.x + gr.w / 2, gr.y + gr.h / 2]); pls.forEach(function (p, pi) { if (smp[pi].some(atGreen)) touch[pi].push(gJ); }); }   // the green or the market is a junction: every road that ends on it or passes it meets the others there
  pls.forEach(function (p, pi) { pls.forEach(function (q2, qi2) { if (qi2 <= pi) return; smp[pi].forEach(function (a) { smp[qi2].forEach(function (b) { if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1.2 && !atGreen(a)) { var j = jAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); if (touch[pi].indexOf(j) < 0) touch[pi].push(j); if (touch[qi2].indexOf(j) < 0) touch[qi2].push(j); } }); }); }); });
  // each road is a path through its junctions and its free ends: (junctions + free ends - 1) edges; nodes are the junctions and the free ends
  pls.forEach(function (p, pi) { var e = 0; [p.pts[0], p.pts[p.pts.length - 1]].forEach(function (pe) { if (!atGreen(pe) && !junctions.some(function (j, ji) { return ji !== gJ && Math.hypot(j[0] - pe[0], j[1] - pe[1]) < 3; })) e++; }); ends += e; E += Math.max(0, touch[pi].length + e - 1); });
  var N = junctions.length + ends, cycles = Math.max(0, E - N + 1); st.loops = cycles;
  var loopsWanted = A.tier <= 0 ? 0 : A.family === 'town' ? 2 : 1;
  say((cycles < loopsWanted ? '!! ' : '') + 'loops: ' + cycles + ' (wanted ' + loopsWanted + '), ' + pls.length + ' roads');
  // the ways in: the count, the classes, the price bands
  var ways = V.ways || [], bands = {}, kinds = {}; ways.forEach(function (wv) { bands[wv.secs < 1 ? 'quiet' : wv.secs < 4 ? 'soft' : 'loud'] = 1; kinds[wv.kind] = 1; });
  var wantW = WAYS_BY_TIER[Math.min(5, A.tier)]; st.ways = ways.length;
  say((ways.length < wantW || Object.keys(kinds).length < Math.min(3, wantW) ? '!! ' : '') + 'ways in: ' + ways.length + ' (wanted ' + wantW + '): ' + ways.map(function (wv) { return wv.kind + ' ' + wv.secs + 's/' + wv.noise; }).join(', ') + '; bands ' + Object.keys(bands).join('+'));
  // the landmark, the denial
  var lm = V.nodes.filter(function (n) { return n.kind === 'landmark'; })[0], prize = V.nodes.filter(function (n) { return n.kind === 'prize'; })[0];
  say((lm ? '' : '!! ') + 'landmark: ' + (lm ? lm.what : 'none'));
  if (prize && gate) {
    var crosses = 0, steps = Math.ceil(Math.hypot(prize.x - gate.x, prize.y - gate.y) / 8), s, lastT = null; for (s = 1; s < steps; s++) { var px = gate.x + (prize.x - gate.x) * s / steps, py = gate.y + (prize.y - gate.y) * s / steps; var tx2 = Math.floor(px / T), ty2 = Math.floor(py / T); if (floors[key(tx2, ty2)]) { crosses++; break; } if (lastT && (lastT[0] !== tx2 || lastT[1] !== ty2) && Math.abs(lastT[0] - tx2) + Math.abs(lastT[1] - ty2) === 1 && wallB(lastT[0], lastT[1], tx2, ty2)) { crosses++; break; } lastT = [tx2, ty2]; }   // a building or any wall, fence or ring of a precinct in the way counts (a locked door does not)
    var dP = dist[key(Math.floor(prize.x / T), Math.floor(prize.y / T))];
    say((crosses ? '' : '!! ') + 'denial: the line from the gate to the prize ' + (crosses ? 'is blocked' : 'is open') + (dP != null ? '; the prize ' + Math.round(dP * 1.5) + ' m in by foot' : ''));
  } else say('denial: no prize' + (prize ? '' : ' (no jarl’s or church’s chest)'));
  // the secrets, the loot, the carry
  var budget = SECRETS_BY_TIER[Math.min(5, A.tier)]; st.secrets = V.secrets.length;
  say((V.secrets.length < Math.min(budget, 1) ? '!! ' : '') + 'secrets: ' + V.secrets.length + ' of ' + budget + ': ' + V.secrets.map(function (s2) { return s2.kind; }).join(', '));
  var spots = V.items.filter(function (it) { return it.loot || it.heavy || it.store; }), heavy = V.items.filter(function (it) { return it.heavy; }), L = lootOf(V); st.loot = L;
  var shoreN = V.nodes.filter(function (n) { return n.kind === 'shore'; })[0], carry = null;
  if (heavy.length && gate) { carry = 0; heavy.forEach(function (hv) { var d = Math.hypot(hv.x - (shoreN ? shoreN.x : gate.x), hv.y - (shoreN ? shoreN.y : gate.y)) / 78; carry = Math.max(carry, d); }); }
  say('loot: ' + spots.length + ' spots, ' + heavy.length + ' heavy, value ' + Math.round(L.value) + ' (silver ' + Math.round(L.silver) + ', food ' + Math.round(L.food) + ', goods ' + Math.round(L.goods) + ')' + (carry != null ? '; the heaviest about ' + Math.round(carry * 1.6) + ' s to the ' + (shoreN ? 'shore' : 'gate') + ' as the crow flies, carrying' : ''));
  // the men within noise of each heavy thing
  if (D && D.n) { var men = garrison(V, D.n, rngOf(V.seed * 37 + 5), D), near = heavy.map(function (hv) { return men.filter(function (m) { return Math.hypot(m.x - hv.x, m.y - hv.y) < 360; }).length; }); st.men = D.n; say('men: ' + D.n + ' (' + men.filter(function (m) { return m.wpn === 'bow'; }).length + ' bows, tactic ' + V.tactic + '); within hearing of each heavy thing: ' + (near.join(', ') || 'none')); }
  // the fire chain: thatched roofs within two tiles of one another, the longest run
  var thatch = V.roofs.filter(function (r) { return r.m === 1; }), seen = {}, longest = 0;
  thatch.forEach(function (r, ri) { if (seen[ri]) return; var stack = [ri], n = 0; seen[ri] = 1; while (stack.length) { var a = thatch[stack.pop()]; n++; thatch.forEach(function (b, bi) { if (!seen[bi] && Math.abs(a.tx - b.tx) + Math.abs(a.ty - b.ty) < 14) { seen[bi] = 1; stack.push(bi); } }); } longest = Math.max(longest, n); });
  st.fireChain = longest; say('fire: ' + thatch.length + ' thatched roofs, the longest chain ' + longest);
  // the rooms: the threshold, the lane, the circle and the reach (docs/interiors-plan.md section 4)
  var rooms = V.lots.filter(function (l) { return l.id === 'house' || l.id === 'longhouse' || l.id === 'hall'; }), roomsBad = rooms.filter(function (l) { return l.roomBad; });
  st.roomsBad = roomsBad.length; say((roomsBad.length ? '!! ' : '') + 'rooms: ' + (rooms.length - roomsBad.length) + ' of ' + rooms.length + ' pass the threshold, the lane, the circle and the reach' + (roomsBad.length ? ' (' + roomsBad.map(function (l) { return l.id + ' ' + l.roomBad; }).join(', ') + ')' : ''));
  // doorways clear
  var blocked = 0; V.lots.forEach(function (l) { if (l.dx == null && l.dy == null) return; var o = l.door === 's' ? [l.dx, l.y + l.h] : l.door === 'n' ? [l.dx, l.y - 1] : l.door === 'e' ? [l.x + l.w, l.dy] : [l.x - 1, l.dy], ox = (o[0] + 0.5) * T, oy = (o[1] + 0.5) * T; V.props.forEach(function (p) { var r = p.solid != null ? p.solid : (p.name === 'stake' ? 5 : 8); if (r > 0 && Math.hypot(p.x - ox, p.y - oy) < T) blocked++; }); });
  say((blocked ? '!! ' : '') + 'doorways: ' + blocked + ' blocked by a solid thing');
  return { lines: lines, bad: bad, stats: st };
}
// a page's site for an archetype: the tiles it needs
function siteFor(archId, G) { var A = ARCH[archId] || ARCH.small, k = 1 + (((G && +G.houseK) || 1) - 1) * 0.8; return { w: Math.round(A.site[0] * k), h: Math.round(A.site[1] * k) }; }   // (G.houseK: bigger houses need a bigger site)

/* Villages across the islands (2026-10-07, Robin): where the villages of a world stand, what kind each is, its name and its jetty.
   plan(env, opts): env = { isles: [{ x, y, r }] in tiles (the first is the starter island and gets nothing: its village was raided),
   code(tx, ty) (0 sea, 1 beach, 2 and up grass, 255 off the map), shallow(tx, ty) (water a jetty may stand in), R, home: [tx, ty]
   (the wreck), avoid: [{ x, y, r }] in tiles (the cave) }. The big island gets three (a seat or a village inland, a fishing hamlet
   or a trading post on a shore, a small place), a middling island two, a small one one or none; a ruin now and then; wealth rises
   with the distance from the wreck. Every village gets a name (nameFor: a Norse first name and a place ending by its kind) and,
   when a shore is within reach, a jetty of planks out into the shallows with a boat or two moored beside it (jettyFor). */
/* (no Orm: too near Ormr Midgardbane; Arnor, Ormr, Thorgunna, Aslak and Hogni are the lore's fixed people and never come out of a pool, 2026-10-16) */
var FIRST = ['Eirik', 'Hallvard', 'Sigrun', 'Asta', 'Ketil', 'Thorir', 'Gunnar', 'Ingrid', 'Ragna', 'Ulf', 'Bjorn', 'Halla', 'Yngvar', 'Vigdis', 'Hakon', 'Dagny', 'Mundi', 'Nanna', 'Torsten', 'Alvar', 'Solveig', 'Audun', 'Brynja', 'Geir', 'Tova', 'Steinar', 'Hild'];
var END_SHORE = ['vik', 'nes', 'sund', 'havn', 'ey', 'strand'], END_IN = ['by', 'stad', 'heim', 'dal', 'tun', 'lund', 'berg', 'mark'];
function nameFor(R, arch, shore, used) {
  var t, f, e, n; used = used || {};
  for (t = 0; t < 60; t++) {
    f = FIRST[Math.floor(R() * FIRST.length)]; if (used['first:' + f] && t < 40) continue;
    e = arch === 'seat' ? 'borg' : arch === 'farmstead' ? 'gard' : (shore ? END_SHORE[Math.floor(R() * END_SHORE.length)] : END_IN[Math.floor(R() * END_IN.length)]);
    n = (f.charAt(f.length - 1) === 's' ? f : f + 's') + e;
    if (!used[n]) { used[n] = 1; used['first:' + f] = 1; return n; }
  }
  return 'Ingenstad';
}
function jettyFor(site, env, R) {
  var cx = site.tx + Math.floor(site.w / 2), cy = site.ty + Math.floor(site.h / 2), dirs = [[0, 1], [1, 0], [-1, 0], [0, -1]], best = null, di, k;
  for (di = 0; di < 4; di++) {
    var dx = dirs[di][0], dy = dirs[di][1];
    for (k = 2; k < 48; k++) {
      var tx = cx + dx * k, ty = cy + dy * k, cd = env.code(tx, ty); if (cd === 255) break;
      if (cd === 0) { var len = 0; while (len < 6 && env.code(tx + dx * len, ty + dy * len) === 0 && (len < 2 || env.shallow(tx + dx * len, ty + dy * len))) len++; if (len >= 3 && (!best || k < best.k)) best = { k: k, root: [tx - dx, ty - dy], dir: [dx, dy], len: len }; break; }   // the first two planks go out over any water, the rest only over the shallows
    }
  }
  if (!best) return null;
  var tiles = [], boats = [], side = [best.dir[1], -best.dir[0]], nb = 1 + (R() < 0.5 ? 1 : 0), T2 = 32;
  for (k = 0; k < best.len; k++) tiles.push([best.root[0] + best.dir[0] * (k + 1), best.root[1] + best.dir[1] * (k + 1)]);
  for (k = 0; k < nb; k++) {
    var sgn = k ? -1 : 1, t2 = tiles[Math.max(0, tiles.length - 2 - k)], bx = t2[0] + side[0] * sgn * 1.4, by = t2[1] + side[1] * sgn * 1.4;
    if (env.code(Math.floor(bx), Math.floor(by)) !== 0) continue;
    boats.push({ x: (bx + 0.5) * T2, y: (by + 0.5) * T2, h: Math.atan2(best.dir[1], best.dir[0]) + (R() - 0.5) * 0.3, size: R() < 0.6 ? 'small' : 'big' });
  }
  return { root: best.root, dir: best.dir, tiles: tiles, boats: boats };
}
function plan(env, opts) {
  opts = opts || {}; var R = env.R, isles = env.isles, sites = [], used = {}, maxD = 1, i;
  isles.forEach(function (q) { maxD = Math.max(maxD, Math.hypot(q.x - env.home[0], q.y - env.home[1])); });
  function grassAt(tx, ty) { var cd = env.code(tx, ty); return cd >= 2 && cd !== 255; }
  function siteOk(cx, cy, sw, sh) { var hw = Math.ceil(sw / 2), hh = Math.ceil(sh / 2), x, y; for (y = cy - hh - 1; y <= cy + hh + 1; y++) for (x = cx - hw - 1; x <= cx + hw + 1; x++) if (!grassAt(x, y)) return false; return true; }
  function shoreOf(cx, cy, sh) { var x, sy, n; for (sy = cy + Math.ceil(sh / 2) + 2; sy <= cy + Math.ceil(sh / 2) + 10; sy++) { n = 0; for (x = cx - 4; x <= cx + 4; x++) if (env.code(x, sy) === 0) n++; if (n >= 5) return 's'; } return null; }   // the sea within a few tiles past the beach below the site
  function farEnough(cx, cy) { var k; for (k = 0; k < sites.length; k++) if (Math.hypot(sites[k].cx - cx, sites[k].cy - cy) < 38) return false; for (k = 0; k < (env.avoid || []).length; k++) if (Math.hypot(env.avoid[k].x - cx, env.avoid[k].y - cy) < env.avoid[k].r + 18) return false; return true; }
  function find(q, arch, wantShore) {                         // a site of the archetype's size on island q, on a shore or not, or null
    var sz = siteFor(arch, opts.G), tries;
    for (tries = 0; tries < 900; tries++) {
      var a = R() * 6.283, d = (wantShore ? 0.45 + R() * 0.5 : R() * 0.6) * q.r, cx = Math.floor(q.x + Math.cos(a) * d), cy = Math.floor(q.y + Math.sin(a) * d * 0.9);
      if (!siteOk(cx, cy, sz.w, sz.h) || !farEnough(cx, cy)) continue;
      var sh = shoreOf(cx, cy, sz.h); if (wantShore && !sh) continue; if (!wantShore && sh) continue;
      return { cx: cx, cy: cy, tx: cx - Math.ceil(sz.w / 2), ty: cy - Math.ceil(sz.h / 2), w: sz.w, h: sz.h, shore: sh };
    }
    return null;
  }
  var maxLow = 0; isles.forEach(function (q) { if (q.biome) maxLow = Math.max(maxLow, q.r); });
  var fisherIsle = -1; (function () { var best = -1; for (var fi = 1; fi < isles.length; fi++) if (isles[fi].r <= 60 && (best < 0 || isles[fi].r < isles[best].r)) best = fi; fisherIsle = best; })();   // the fisherman lives alone on the smallest island
  /* The sea as waters (2026-10-20, docs/build-plan-waters.md step 3): home water (ring 0) gets only peaceful places and exactly one
     seat, the jarl's, on a medium island (never the big island, whose first village is Old Aslak's); a ring-1 water gets its own
     mix (the south the town and church, by its biome). Without waters nothing changes. */
  var seatIsle = -1; if (isles.some(function (q) { return q.ring != null; })) { var meds = []; for (var mi = 2; mi < isles.length; mi++) if (isles[mi].ring === 0 && mi !== fisherIsle && isles[mi].r >= 60 && isles[mi].r <= 140) meds.push(mi); meds.sort(function (p, q) { return isles[q].r - isles[p].r; }); if (meds.length) seatIsle = meds[Math.floor(R() * Math.min(2, meds.length))];   /* (the seat wants room: one of the two biggest medium islands, 2026-10-22) */ }
  for (i = 1; i < isles.length; i++) {
    var q = isles[i], wants = [], big = i === 1 || q.r >= 100 || (q.biome && q.r === maxLow);   // the biggest lowland island always has the town
    if (i === fisherIsle) wants = [['fisher', true]];
    else if (q.ring === 0 && i === seatIsle) wants = [['seat', false], [R() < 0.5 ? 'trading' : 'fishing', true], ['small', false]];   // the jarl's seat (its name and his are the Lore Director's: LORE? proposed Tingvoll, Jarl Fridmund)
    else if (q.ring === 0 && big) wants = [['village', false], [R() < 0.3 ? 'trading' : 'fishing', true], [R() < 0.5 ? 'small' : 'farmstead', false]];   // home's other big islands: a village, never a seat
    else if (q.biome && big) wants = [['town', false], [R() < 0.4 ? 'trading' : 'fishing', true], [R() < 0.6 ? 'church' : 'farmstead', false]];
    else if (q.biome && q.r >= 42) wants = [[R() < 0.5 ? 'church' : 'village', false], [R() < 0.6 ? 'fishing' : 'trading', true]];
    else if (big) wants = [[R() < 0.45 ? 'seat' : 'village', false], [R() < 0.3 ? 'trading' : 'fishing', true], [R() < 0.5 ? 'small' : 'farmstead', false]];
    else if (q.r >= 65) wants = [[R() < 0.6 ? 'fishing' : 'trading', true], [R() < 0.5 ? 'small' : (R() < 0.5 ? 'village' : 'farmstead'), false]];
    else if (q.r >= 42) wants = [R() < 0.5 ? ['fishing', true] : ['farmstead', false]];
    else if (R() < 0.5) wants = [['farmstead', false]];
    wants.forEach(function (wq) {
      var arch = (opts.swap && opts.swap[wq[0]]) || wq[0], st = find(q, arch, wq[1]); if (!st && arch !== wq[0]) { arch = wq[0]; st = find(q, arch, wq[1]); }   // (opts.swap: a page asks for a big place where a town or a seat would stand; if the island has no room for it, the plain one)
      if (!st) { st = find(q, wq[1] ? 'fishing' : 'small', wq[1]); arch = wq[1] ? 'fishing' : 'small'; } if (!st) return;
      var ruinRoll = R() < 0.14;   /* (rolled whether or not it can apply, so a seed's layout does not move) */
      if (arch !== 'seat' && arch !== 'trading' && arch !== 'town' && arch !== 'church' && arch !== 'fisher' && arch !== 'great' && arch !== 'bigtown' && sites.length > 0 && ruinRoll) arch = 'ruin';   /* (never the first place, the big island's village: Old Aslak lives there, and a fresh start of 2026-10-23 had it a ruin with nobody in it) */
      var dist = Math.hypot(st.cx - env.home[0], st.cy - env.home[1]) / maxD, wealth = Math.max(0.15, Math.min(0.95, 0.2 + dist * 0.5 + R() * 0.25)); if (arch === 'seat' || arch === 'great') wealth = Math.max(0.72, wealth); if (arch === 'trading') wealth = Math.max(0.5, wealth); if (q.biome) wealth = Math.min(0.95, wealth + 0.15);   // the settled south is richer
      st.arch = arch; st.wealth = wealth; st.isle = i; st.biome = q.biome ? 1 : 0; st.water = q.water != null ? q.water : null; st.ring = q.ring != null ? q.ring : null; st.seed = Math.floor(R() * 1e9); st.name = nameFor(R, arch, st.shore, used);
      st.jetty = jettyFor(st, env, R);
      sites.push(st);
    });
  }
  return sites;
}
// draw a generated village on a canvas in world units (the editor): the ground paints, floors, pieces, props and people.
// env: { kit, Build, lib, tile(c, tx, ty, x, y) (a floor tile), roomsOf(V) }
function draw(c, V, env, clock) {
  var kit = env.kit, Build = env.Build, K = 0.75, TS = 24, x, y, k, q;
  var vw = env.view || null; function inView(px, py, m) { return !vw || (px > vw.x0 - m && px < vw.x1 + m && py > vw.y0 - m && py < vw.y1 + m); }   // env.view { x0, y0, x1, y1 } in the world's units: only what is in view is drawn (the editor zoomed in, 2026-10-22)
  // the ground paints (as the game's brush paints them, approximately)
  var PC = { 1: 'rgba(150,138,118,0.85)', 2: 'rgba(126,98,62,0.85)', 3: 'rgba(92,128,70,0.85)' };
  V.paints.forEach(function (p) { if (!inView(p.x, p.y, 40)) return; c.fillStyle = PC[p.kind]; c.beginPath(); c.ellipse(p.x, p.y * K, p.r, p.r * K, 0, 0, 7); c.fill(); });
  for (k in V.floors) { q = k.split(','); x = +q[0]; y = +q[1]; if (!inView(x * T, y * T, 40)) continue; if (env.tile) env.tile(c, x, y, x * T, y * TS, T + 0.4, TS + 0.4); else { c.fillStyle = V.floors[k] === 1 ? '#8a6e4c' : '#9a7c5c'; c.fillRect(x * T, y * TS, T, TS); } }
  var B = { floors: V.floors, H: V.H, V: V.V, posts: {}, stairs: {}, roofs: {}, items: [] }, ri = Build.rooms(B, 400, 400, { x0: V.tx - 2, y0: V.ty - 2, x1: V.tx + V.w + 2, y1: V.ty + V.h + 2 });
  V.roofs.forEach(function (r) { var i = ri.at(r.tx, r.ty); if (i >= 0) B.roofs[ri.rooms[i].id] = r.m; });
  var items = [];
  for (k in V.H) { q = k.split(','); (function (x, y, e) { if (!inView(x * T, y * T, 80)) return; items.push({ y: y * T, f: function () { Build.drawH(c, x, y, e, false, false, Build.cfg({})); } }); })(+q[0], +q[1], V.H[k]); }
  for (k in V.V) { q = k.split(','); (function (x, y, e) { if (!inView(x * T, y * T, 80)) return; items.push({ y: (y + 1) * T - 1, f: function () { Build.drawV(c, x, y, e, false, V.V[key(x, y + 1)] || false, Build.cfg({})); } }); })(+q[0], +q[1], V.V[k]); }
  ri.rooms.forEach(function (r) { if (B.roofs[r.id] == null) return; items.push({ y: (r.maxY + 1) * T + 1, f: function () { Build.drawRoof(c, r, 1, Build.cfg({ roof: B.roofs[r.id], wallM: Build.roomWallM(B, r) }), 0); } }); });
  // a thing is drawn as the game draws it when the page has the game's set pieces (env.images: name -> { img, w, h, ax, ay, upp },
  // name_1..name_N for a piece with variants, as World.setImages takes them; the editor since 2026-10-22), else as the kit's drawn prop
  var IM = env.images || null;
  function imageOf(name, v) { if (!IM) return null; var nv = 0; while (IM[name + '_' + (nv + 1)]) nv++; var im = nv ? IM[name + '_' + (((v | 0) % nv) + 1)] : IM[name]; return im && im.img && (im.img.complete === undefined ? im.img.width > 0 : (im.img.complete && im.img.naturalWidth > 0)) ? im : null; }
  function pieceName(it) { return it.name === 'stake' && it.cut ? 'stake_stump' : it.name === 'stake' && it.mended ? 'stake_new' : it.name === 'trapdoor' ? (it.open ? 'trapdoor_open' : 'trapdoor_shut') : it.name; }   /* (the trapdoor by its state, as the game draws it) */
  V.items.concat(V.props).forEach(function (it) {
    if (!inView(it.x, it.y, 160)) return; var nm = pieceName(it), im = imageOf(nm, it.v || Math.floor(Math.abs(it.x * 7 + it.y * 13)) % 97);
    if (im) items.push({ y: it.y - (it.under ? 2 : 0), f: function () { c.drawImage(im.img, it.x - im.ax * im.upp, it.y * K - im.ay * im.upp, im.w * im.upp, im.h * im.upp); } });
    else if (kit.PROPS[it.name]) items.push({ y: it.y, f: function () { var sp = kit.bakeProp(it.name, 3), s = SIZE_OF(kit, it.name); c.drawImage(sp.cv, it.x + sp.l * s, it.y * K + sp.t * s, sp.w * s, sp.h * s); } });
  });
  (V.nature || []).forEach(function (it) {
    if (!inView(it.x, it.y, 200)) return; var im = imageOf(it.name, it.v || 0);
    if (im) items.push({ y: it.y, f: function () { c.drawImage(im.img, it.x - im.ax * im.upp, it.y * K - im.ay * im.upp, im.w * im.upp, im.h * im.upp); } });
    else if (kit.PROPS[it.name]) items.push({ y: it.y, f: function () { var sp = kit.bakeProp(it.name, it.v || 0), s = it.s; c.drawImage(sp.cv, it.x + sp.l * s, it.y * K + sp.t * s, sp.w * s, sp.h * s); } });
  });
  if (env.lib) V.folk.forEach(function (f, fi) {                   // the people out of doors: some at the fire, some at their jobs, the rest idling each their own way
    if (!f.out || !inView(f.x, f.y, 120)) return; var lib = env.lib, sitSpot = f.spots.filter(function (q) { return q[2] === 'sit'; })[0], jobSpot = f.spots.filter(function (q) { return q[2] && q[2] !== 'sit' && q[2] !== 'door'; })[0];
    var mode = sitSpot && fi % 3 === 0 ? 'sit' : (jobSpot && fi % 3 === 1 ? 'job' : 'idle'), px = mode === 'sit' ? sitSpot[0] : (mode === 'job' ? jobSpot[0] : f.x), py = mode === 'sit' ? sitSpot[1] : (mode === 'job' ? jobSpot[1] : f.y);
    var dir = mode === 'job' && (jobSpot[2] === 'hang') ? 'up' : (mode === 'idle' && fi % 4 === 2 ? 'left' : 'down');
    items.push({ y: py, f: function () {
      var F = lib.makeFigure(lib.folkSpec('villager', rngOf(f.name.length * 7 + f.x))), t = (clock || 0) + fi * 1.7, pose = null;
      if (mode === 'job') pose = lib.jobPose(F, jobSpot[2], t, dir); else if (mode === 'idle') pose = lib.idlePose(F, lib.IDLES[fi % (lib.IDLES.length - 1)], t, dir);
      lib.figureD(c, px, py * K, dir, { phase: 0, amt: 0, t: t, lx: 0, ly: 0, blink: 0, sq: 0, sit: mode === 'sit' ? 1 : 0 }, pose, F);
      if (pose && pose.held) lib.figureHeld(c, px, py * K, dir, F, pose.held);
    } });
  });
  items.sort(function (a, b) { return a.y - b.y; }).forEach(function (it) { it.f(); });
}
var SIZES = { porch: 1, apse: 1, gableCross: 1, font: 1, lychGate: 1, bellTower: 1, altar: 1, graveStone: 1, wayCross: 1, stall: 1, yew: 1, windowBox: 1, lantern: 1, awning: 1, sign: 1, woodshed: 1, foodTable: 1, firePit: 1, logSeat: 1, stake: 1, banner: 1, choppingBlock: 1, woodenWell: 0.75, cart: 0.8, dryingRack: 0.8, shieldRack: 0.75, beeSkeps: 0.8, haystack: 0.8, table: 0.75, bed: 0.8, workbench: 0.9, chest: 0.9, crate: 0.9, barrel: 0.9, bench: 0.85, chair: 0.85, hearth: 0.9, campfire: 0.9, furnace: 0.9, trough: 0.9, scarecrow: 0.9, runestone: 0.75, cairn: 0.9, woodpile: 0.9, stoneHearth: 0.9, cellarDoor: 1, dragonPost: 0.8 };
function SIZE_OF(kit, name) { return SIZES[name] || 1; }
/* A town's men (2026-10-13, rung 5 of docs/archive/battle-plan.md): where each of n stands at his day, in the world's units. Four at
   the gate (two outside, two inside), two at the back gate, two by the market, a man by every house door, the jarl's own in
   the hall (the best; they must arm, so they come last: delay, seconds before a man who has heard something is on his way:
   18 to 32), a man inside every house (asleep or at table: 5 to 12), the rest about the yard. Each is { x, y, face, kind:
   'gate' | 'yard' | 'door' | 'house' | 'hall', wpn ('bow' for a few of them), delay }. The game (townMen) and tests/battle.js make soldiers of them. */
/* The fighting men of a place (raid step 4, 2026-10-20; a first table of mine, by archetype: Robin's "different sizes of villages,
   different levels of defence"): n at wealth 0 and at wealth 1 (between, in proportion), the gear of the hall's and the gate's men
   and of the rest (0 cloth, 1 leather and a shield, 2 mail, a helm and a shield), the share with a bow, a bonus to wits; a place
   in a further water gets a sixth more men a ring. Villagers who are not fighting men still arm when raided (the game's
   FOLK_FIGHT). A church has none: its priests do not fight (Robin). Tried by tests/battle.js arches. */
var DEFENCE = {
  farmstead: { n: [0, 1], gear: [1, 0], bows: 0, wits: 0 },
  small: { n: [0, 2], gear: [1, 0], bows: 0, wits: 0 },
  fishing: { n: [0, 2], gear: [1, 0], bows: 0, wits: 0 },
  village: { n: [2, 6], gear: [1, 1], bows: 0.15, wits: 0 },
  trading: { n: [3, 6], gear: [2, 1], bows: 0.2, wits: 1 },
  seat: { n: [6, 12], gear: [2, 1], bows: 0.2, wits: 1 },
  town: { n: [14, 24], gear: [2, 1], bows: 0.2, wits: 1 },
  great: { n: [24, 34], gear: [2, 1], bows: 0.2, wits: 1 },
  bigtown: { n: [30, 40], gear: [2, 2], bows: 0.25, wits: 2 }
};
function defence(arch, wealth, ring) {
  var d = DEFENCE[arch]; if (!d) return { n: 0, gear: [1, 1], bows: 0, wits: 0 };
  var k = Math.max(0, Math.min(1, wealth == null ? 0.5 : wealth)), n = Math.round(d.n[0] + (d.n[1] - d.n[0]) * k);
  n = Math.round(n * (1 + 0.16 * Math.max(0, (ring || 0) - 1)));
  return { n: n, gear: d.gear, bows: d.bows, wits: d.wits };
}
/* The defence's tactics (raid step 6, 2026-10-20; Robin: "the defence need to be interesting and vary in tactics and how spread
   out they are"): a place draws one plan with its seed (tacticOf), from what it has: gate (on an alarm every man goes to the
   gate and holds it: the yard empties), hall (the hall's men keep by the hall and its chest, the householders by their doors),
   hunters (they go for the noise and pursue further than others), watch (more men walk rounds by day, all a little sharper),
   muster (on an alarm they gather at the fire pit, hold ten seconds, then come on together), bows (a bowman stands on the
   watchtower and sees over the wall; the rest as usual). tactics(V, kind) gives the points; applyTactic(e, q, tac) sets a
   man's flags, the same for the game and for tests/battle.js plans. */
/* The rewards (raid step 7, 2026-10-21; Robin: good rewards, balanced, with variation: food stocks, a place at its meal). A
   place rolls with its seed how full its stores are (stockK, 0.4 to 1.6) and how deep its hoard is (hoardK, 0.7 to 1.4), so two
   places of one size never give the same; LOOT says, by archetype, what a wealth of 0 and of 1 gives in all, as a value (silver
   1, a bar 3, leather or hide 1, food 0.3, arrows 0.2): the test tests/loot.js prints it against the defence's men. */
var LOOT = {
  farmstead: { food: [6, 16], goods: [1, 4], silver: [0, 2] },
  small: { food: [8, 22], goods: [2, 6], silver: [0, 4] },
  fishing: { food: [10, 26], goods: [2, 5], silver: [0, 3] },
  village: { food: [12, 34], goods: [4, 10], silver: [2, 10] },
  trading: { food: [10, 30], goods: [8, 24], silver: [8, 30] },
  seat: { food: [20, 50], goods: [6, 16], silver: [24, 60] },
  town: { food: [24, 60], goods: [10, 30], silver: [38, 100] },
  church: { food: [2, 6], goods: [1, 3], silver: [14, 38] },
  great: { food: [30, 70], goods: [12, 36], silver: [50, 120] },
  bigtown: { food: [36, 90], goods: [16, 48], silver: [80, 180] }
};
var RICH = { farmstead: 0.6, small: 0.8, fishing: 0.8, village: 1.0, trading: 1.4, seat: 1.8, town: 2.2, great: 2.5, bigtown: 3 };   // the coin a place's chests hold, by archetype: a seat's and a town's are richer than a farm's (the curve rises with the men: tests/loot.js)
var VALUE = { silver: 1, coin: 1, ironBar: 3, copperBar: 2, copper: 1, leather: 1, hide: 1, arrows: 0.2, wood: 0.1, stone: 0.1, fiber: 0.1, meat: 0.3, berries: 0.3, honey: 0.5, eggs: 0.3, fish: 0.3 };
function lootOf(V) {                       // what a place holds for the taking, summed from its chests, crates, barrels, sacks and heavy chests: { silver, food, goods, value }
  var out = { silver: 0, food: 0, goods: 0, value: 0 }, k;
  function add(l) { for (k in l) { var n = l[k], val = (VALUE[k] || 0) * n; if (k === 'silver' || k === 'coin') out.silver += n; else if (k === 'meat' || k === 'berries' || k === 'honey' || k === 'eggs' || k === 'fish') out.food += n; else if (VALUE[k] >= 1) out.goods += n; out.value += val; } }
  V.items.forEach(function (it) { if (it.loot) add(it.loot); if (it.heavy) add(it.heavy); });
  V.props.forEach(function (p) { if (p.loot) add(p.loot); });
  return out;
}
var TACTICS = ['gate', 'hall', 'hunters', 'watch', 'muster', 'bows'];
function tacticOf(V, R) {
  R = R || rngOf(V.seed * 13 + 9); var F = V.fence, can = TACTICS.filter(function (k) {
    if (k === 'gate') return !!F && !F.round && F.gate != null;
    if (k === 'hall') return V.lots.some(function (l) { return l.id === 'hall' || l.id === 'longhouse'; });
    if (k === 'bows') return V.props.some(function (p) { return p.tower; });
    if (k === 'muster') return V.items.some(function (it) { return it.pit; });
    return true; });
  return can[Math.floor(R() * can.length) % can.length];
}
function tactics(V, kind) {
  kind = kind || V.tactic || tacticOf(V); var F = V.fence, T2 = T, out = { kind: kind }, hall = V.lots.filter(function (l) { return l.id === 'hall' || l.id === 'longhouse'; })[0], pit = V.items.filter(function (it) { return it.pit; })[0];
  if (kind === 'gate' && F && !F.round) out.rally = { x: (F.gate + (F.gateW || 1) / 2) * T2, y: F.y1 * T2 - 44, face: Math.PI / 2 };
  if (kind === 'muster') out.rally = pit ? { x: pit.x, y: pit.y + 26 } : { x: (V.yard.x + V.yard.w / 2) * T2, y: (V.yard.y + V.yard.h / 2) * T2 };
  if (kind === 'hall' && hall) out.hallR = 150;
  if (kind === 'bows') out.tower = V.props.filter(function (p) { return p.tower; })[0] || null;
  return out;
}
function applyTactic(e, q, tac) {
  if (!tac) return; var k = tac.kind;
  if (k === 'gate' && tac.rally) { e.rally = tac.rally; e.rallyHold = 1e9; e.homeR = 0; }   // (a man sent to the gate fights there: his own door no longer bounds him, 2026-10-21)
  else if (k === 'muster' && tac.rally) { e.rally = tac.rally; e.rallyHold = 10; e.rallyThen = 'alarm'; e.homeR = 0; }
  else if (k === 'hall') { if (q && q.kind === 'hall') e.homeR = tac.hallR || 150; }
  else if (k === 'hunters') { e.pursueK = 1.6; e.sight = (e.sight || 320) * 1.3; }
  else if (k === 'watch') { e.wits = Math.min(7, (e.wits || 3) + 1); }
  else if (k === 'bows') { if (q && q.kind === 'tower') e.fixed = true; }
  e.tactic = k;
}
function garrison(V, n, R, D) {
  var F = V.fence, out = [], WP = ['sword', 'axe', 'spear', 'axe', 'sword', 'club', 'spear'], HW = ['sword', 'axe', 'greataxe', 'sword', 'spear', 'axe'], k = 0, i, S = Math.PI / 2, N = -Math.PI / 2; R = R || Math.random;
  if (D && D.n != null && n == null) n = D.n;
  var things = V.items.map(function (it) { return [it.x, it.y, it.r != null ? it.r : (it.name === 'rug' || it.name === 'cellarDoor' ? -99 : 8)]; }).concat(V.props.map(function (o) { return [o.x, o.y, o.solid != null ? o.solid : 8]; }), V.nature.map(function (o) { return [o.x, o.y, o.r || -99]; }));
  function lotAt(x, y) { for (var i2 = 0; i2 < V.lots.length; i2++) { var l = V.lots[i2]; if (x > l.x * T && x < (l.x + l.w) * T && y > l.y * T && y < (l.y + l.h) * T) return l; } return null; }
  function roomy(x, y, l0) {     // nothing he would stand in, and the same side of every wall as the place meant
    var i2, l = lotAt(x, y); if (l !== l0) return false;
    if (l && (x < l.x * T + 11 || x > (l.x + l.w) * T - 11 || y < l.y * T + 11 || y > (l.y + l.h) * T - 11)) return false;
    if (!l) for (i2 = 0; i2 < V.lots.length; i2++) { var q = V.lots[i2]; if (x > q.x * T - 12 && x < (q.x + q.w) * T + 12 && y > q.y * T - 12 && y < (q.y + q.h) * T + 12) return false; }
    for (i2 = 0; i2 < things.length; i2++) if (Math.hypot(things[i2][0] - x, things[i2][1] - y) < things[i2][2] + 11) return false;
    return true;
  }
  function settle(x, y) {        // the nearest roomy place to the one meant (a man inside a house was put on its hearth)
    var l0 = lotAt(x, y), r, a2; if (roomy(x, y, l0)) return [x, y];
    for (r = 8; r <= 56; r += 8) for (a2 = 0; a2 < 12; a2++) { var px = x + Math.cos(a2 * 0.5236) * r, py = y + Math.sin(a2 * 0.5236) * r; if (F && !F.round && ((py > F.y1 * T) !== (y > F.y1 * T) || (py > F.y0 * T) !== (y > F.y0 * T))) continue; if (roomy(px, py, l0)) return [px, py]; }
    return [x, y];
  }
  var bows = { 3: 1, 7: 1 };              // which of them carry a bow: one inside the gate, one by the market, and (below) one of the hall's and every fourth about the yard
  function put(x, y, face, kind) { if (out.length >= n) return; var sp = settle(x, y); x = sp[0]; y = sp[1]; var bow = D && D.bows != null ? (kind !== 'door' && kind !== 'house' && out.length > 1 && R() < D.bows) : !!bows[out.length]; out.push({ x: x, y: y, face: face, kind: kind, wpn: bow ? 'bow' : kind === 'hall' ? HW[k % 6] : WP[k % WP.length], delay: kind === 'hall' ? 18 + R() * 14 : kind === 'house' ? 5 + R() * 7 : null }); k++; }   /* (the table's share with a bow, when a table is given; the old fixed posts else) */
  var hall = V.lots.filter(function (l) { return l.id === 'hall'; })[0], houses = V.lots.filter(function (l) { return l.id === 'house'; }), yc = [(V.yard.x + V.yard.w / 2) * T, (V.yard.y + V.yard.h / 2) * T];
  if (F && !F.round) {
    var gx = (F.gate + (F.gateW || 1) / 2) * T, gy = F.y1 * T;
    put(gx - 34, gy + 22, S, 'gate'); put(gx + 34, gy + 22, S, 'gate'); put(gx - 40, gy - 24, S, 'gate'); put(gx + 40, gy - 24, S, 'gate');     // the gate: two outside, two inside
    for (i = F.x0; i < F.x1; i++) if (V.H[key(i, F.y0)] && V.H[key(i, F.y0)].t === 'gate') { put((i + 0.5) * T - 16, F.y0 * T + 26, N, 'gate'); put((i + 0.5) * T + 16, F.y0 * T + 26, N, 'gate'); break; }   // the back gate
  }
  if (F && F.round && F.gateAt) {            // a ring of stakes: two inside each gap
    var ga = Math.atan2(F.cy - F.gateAt[1], F.cx - F.gateAt[0]), gnx = Math.cos(ga), gny = Math.sin(ga);
    put(F.gateAt[0] + gnx * 30 - gny * 22, F.gateAt[1] + gny * 30 + gnx * 22, S, 'gate'); put(F.gateAt[0] + gnx * 30 + gny * 22, F.gateAt[1] + gny * 30 - gnx * 22, S, 'gate');
    if (F.backAt) { var gb = Math.atan2(F.cy - F.backAt[1], F.cx - F.backAt[0]); put(F.backAt[0] + Math.cos(gb) * 30 - Math.sin(gb) * 20, F.backAt[1] + Math.sin(gb) * 30 + Math.cos(gb) * 20, N, 'gate'); put(F.backAt[0] + Math.cos(gb) * 30 + Math.sin(gb) * 20, F.backAt[1] + Math.sin(gb) * 30 - Math.cos(gb) * 20, N, 'gate'); }
  }
  put(yc[0] - 60, yc[1] + 30, S, 'yard'); put(yc[0] + 70, yc[1] - 10, Math.PI, 'yard');                                                        // by the market
  (V.nodes || []).forEach(function (nd) { if (nd.kind !== 'precinct') return; put(nd.x - 16, nd.y + 22, S, 'yard'); put(nd.x + 16, nd.y + 22, S, 'yard'); });   // two at the gate of every precinct (the hall's ring, the churchyard): the private zone's door (2026-10-22)
  houses.forEach(function (l, hi) { var dx2 = l.door === 'e' ? l.x + l.w + 0.6 : l.door === 'w' ? l.x - 0.6 : l.dx + 0.5, dy2 = l.door === 's' ? l.y + l.h + 0.7 : l.door === 'n' ? l.y - 0.7 : l.dy + 0.5; put(dx2 * T + (l.door === 's' || l.door === 'n' ? (hi % 2 ? 14 : -14) : 0), dy2 * T + (l.door === 'e' || l.door === 'w' ? (hi % 2 ? 14 : -14) : 0), S, 'door'); });   // a man by every house door
  bows[out.length + 4] = 1;
  if (hall) for (i = 0; i < 6; i++) put((hall.x + 1.5 + i * (hall.w - 3) / 5) * T, (hall.y + 1.2 + (i % 2) * 1.4) * T, S, 'hall');           // the jarl's own, in the hall
  houses.forEach(function (l) { put((l.x + l.w / 2) * T, (l.y + l.h / 2) * T, S, 'house'); });                                               // and a man inside every house
  i = 0; while (out.length < n && i < 40) { var a = i * 2.4, r = 70 + (i % 5) * 34; if (i % 4 === 1) bows[out.length] = 1; put(yc[0] + Math.cos(a) * r, yc[1] + Math.sin(a) * r * 0.7, a, 'yard'); i++; }   // the rest about the yard
  if (D && D.tactic === 'bows') { var tw = V.props.filter(function (p) { return p.tower; })[0], bm = tw ? out.filter(function (q) { return q.wpn === 'bow'; })[0] : null; if (bm) { bm.x = tw.x; bm.y = tw.y - 4; bm.kind = 'tower'; bm.face = S; } }   // the bowman on the tower (his tactic)
  return out;
}
return { VERSION: VERSION, DEF: DEF, ARCH: ARCH, BUILD: BUILD, STORIES: STORIES, SHAPES: SHAPES, AGES: AGES, PRICE: PRICE, SECRETS_BY_TIER: SECRETS_BY_TIER, WAYS_BY_TIER: WAYS_BY_TIER, NAMES: NAMES, ROLES: ROLES, cfg: cfg, make: make, audit: audit, siteFor: siteFor, plan: plan, nameFor: nameFor, jettyFor: jettyFor, garrison: garrison, DEFENCE: DEFENCE, defence: defence, LOOT: LOOT, VALUE: VALUE, lootOf: lootOf, TACTICS: TACTICS, tacticOf: tacticOf, tactics: tactics, applyTactic: applyTactic, draw: draw, rng: rngOf, SIZES: SIZES };
})();
if (typeof module !== 'undefined') module.exports = Village;
