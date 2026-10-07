/* Village: the rules and settings that grow a village (docs/villages.md, Robin's brief of 2026-10-07), shared by the game and
   the Village Editor. DEF holds every number; make(seed, site, opts) returns the game's own building data (floors, H, V, items,
   roofs to lay once the rooms are found, paints for the ground brush, props for the world, folk with spots and lines, finds),
   so a page writes it into B as it writes the hamlet. A village is fully described by seed, archetype, wealth and shore.
   The plan is a ring: the yard in the middle with the well, the longhouse on its north side facing south, the houses round it
   with their doors to the yard, the outbuildings behind, a fence round it all with a gate, the fields and the sacred outside. */
var Village = (function () {
'use strict';
var T = 32;
var DEF = {
  gap: 2, yardGap: 1, fenceGap: 1,                    // tiles between buildings, between a wall and the yard, between the ring and the fence
  peoplePerHouse: 2.6, outsideShare: 0.4,             // people in a household; how many of them are out walking at a time
  wealthStone: 0.85, wealthLogs: 0.55, wealthPlanks: 0.25,   // the longhouse's walls by wealth (below: wattle); the houses one step poorer
  shinglesAt: 0.8, turfInland: 1, thatchShore: 1,     // roofs: shingles for the rich, turf inland, thatch by the sea
  palisadeAt: 0.7, drystoneAt: 0.5, railAt: 0.2,      // the fence by wealth: rail (poor), wattle, dry stone; from palisadeAt a round wall of stakes with banners at the gate
  stakeStep: 11, banners: 2, firePit: 1, logSeats: 4, doorProps: 1.4,
  roadW: 10, backGate: 1,                             // the one winding road (Robin, 2026-10-07): its width in the yard; a back gate for the road to leave by
  nature: 1, clutter: 1,                              // trees, bushes and rocks kept in and round the village; things against the walls (window boxes, lanterns, awnings, signs)
  fields: 1, fieldStrips: 3, sacred: 1, midden: 1, graves: 1,
  chestLoot: 1, cellarAt: 0.3, storeLoot: 1,           // finds: a chest in every house, a cellar in one house at this wealth and above
  yardEarth: 1, pathGravel: 1, mossEdge: 1,
  emptySlots: 0.25,                                   // the share of ring slots left open, so no two rings are alike
  sizeJitter: 1                                       // buildings vary by this many tiles
};
// the archetypes: how many of what, the yard, the site a page should find for it
var ARCH = {
  farmstead: { name: 'Farmstead', houses: [0, 0], out: [2, 3], yard: [5, 4], site: [14, 12], people: [3, 5] },
  small: { name: 'Small village', houses: [1, 2], out: [3, 4], yard: [6, 5], site: [18, 15], people: [6, 9] },
  village: { name: 'Village', houses: [3, 4], out: [5, 6], yard: [8, 6], site: [24, 18], people: [10, 15] },
  seat: { name: "Chieftain's seat", houses: [5, 7], out: [7, 8], yard: [9, 7], site: [30, 24], people: [16, 24], hall: true, palisade: true },
  fishing: { name: 'Fishing hamlet', houses: [1, 2], out: [3, 4], yard: [6, 5], site: [18, 15], people: [5, 8], shore: true, racks: 2 },
  trading: { name: 'Trading post', houses: [2, 3], out: [5, 6], yard: [8, 6], site: [24, 18], people: [8, 12], shore: true, stores: 2 },
  ruin: { name: 'Abandoned', houses: [1, 3], out: [3, 4], yard: [6, 5], site: [18, 15], people: [0, 0], ruin: true }
};
// the buildings: inside size in tiles [w range, h range], what stands inside, where the door goes (toward the yard)
var BUILD = {
  longhouse: { name: 'Longhouse', w: [7, 9], h: [3, 3], roofed: true, inside: 'hall' },
  hall: { name: 'Great hall', w: [10, 12], h: [4, 4], roofed: true, inside: 'hall' },
  house: { name: 'House', w: [3, 4], h: [2, 3], roofed: true, inside: 'home' },
  store: { name: 'Storehouse', w: [2, 2], h: [2, 2], roofed: true, inside: 'store', posts: true },
  byre: { name: 'Byre', w: [3, 4], h: [2, 2], roofed: true, inside: 'byre' },
  smithy: { name: 'Smithy', w: [3, 3], h: [2, 2], roofed: true, inside: 'smithy', open: true },
  bath: { name: 'Bathhouse', w: [2, 2], h: [2, 2], roofed: true, inside: 'bath' },
  pit: { name: 'Pit-house', w: [2, 2], h: [2, 2], roofed: true, inside: 'pit', floor: 1 },
  boathouse: { name: 'Boathouse', w: [5, 7], h: [2, 2], roofed: true, inside: 'boat', open: true }
};
var NAMES = ['Arnfinn', 'Bera', 'Dagny', 'Eyvind', 'Frida', 'Gorm', 'Halla', 'Ingolf', 'Jorunn', 'Ketil', 'Liv', 'Mundi', 'Nanna', 'Orm', 'Ragna', 'Sigrun', 'Thorir', 'Ulf', 'Vigdis', 'Yngvar', 'Asa', 'Bjorn', 'Gunnhild', 'Hakon'];
var ROLES = { farmer: ['The barley came in well this year.', 'Mind the goat: she butts.'], fisher: ['The herring run at dawn, out past the skerry.', 'That boat has crossed worse water than this.'], smith: ['Copper is soft. Bring me bog iron and I will show you steel.', 'My bench is yours if you leave it as you found it.'], weaver: ['Wool from our own sheep. Feel it.', 'The loom took a winter to build.'], elder: ['Ragnar\'s men came once. They will come again.', 'My father raised the stone by the gate.'], child: ['Are you a Viking?', 'I found a bird\'s nest with four eggs!'], thrall: ['...', 'I was taken from the south. This is home now.'] };
function rngOf(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function cfg(o) { var out = {}, k; for (k in DEF) out[k] = DEF[k]; for (k in o || {}) if (o[k] != null && DEF[k] != null) out[k] = +o[k]; return out; }
function key(x, y) { return x + ',' + y; }
function pickRange(R, r, jit) { var v = r[0] + Math.floor(R() * (r[1] - r[0] + 1)); return Math.max(1, v + (jit ? Math.round((R() - 0.5) * 2 * jit) : 0)); }

// make(seed, site, opts): site { tx, ty, w, h, shore } (shore: 'n', 's', 'e', 'w' or null); opts { arch, wealth, G (DEF overrides) }
function make(seed, site, opts) {
  opts = opts || {}; var G = cfg(opts.G), R = rngOf(seed), archId = opts.arch || 'small', A = ARCH[archId] || ARCH.small, wealth = opts.wealth == null ? R() : opts.wealth, shore = site.shore || (A.shore ? 's' : null);
  var V = { seed: seed, arch: archId, wealth: wealth, shore: shore, name: opts.name || null, tx: site.tx, ty: site.ty, w: site.w, h: site.h, lots: [], floors: {}, H: {}, V: {}, roofs: [], items: [], paints: [], props: [], folk: [], finds: [], fence: null, ruin: !!A.ruin };
  var tx = site.tx, ty = site.ty, w = site.w, h = site.h;
  // materials and roofs by wealth and place
  var wallOf = function (step) { var wv = wealth - step * 0.3; return wv >= G.wealthStone ? 3 : wv >= G.wealthLogs ? 0 : wv >= G.wealthPlanks ? 1 : 2; };
  var roofOf = function (big) { if (big && wealth >= G.shinglesAt) return 2; return shore ? 1 : 0; };
  var fenceKind = A.palisade || wealth >= G.palisadeAt ? 'palisade' : wealth >= G.drystoneAt ? 'drystone' : wealth >= G.railAt ? 'fence' : 'rail';
  // the yard
  var yw = A.yard[0], yh = A.yard[1], yx = tx + Math.floor((w - yw) / 2), yy = ty + Math.floor((h - yh) / 2) + 1;
  V.yard = { x: yx, y: yy, w: yw, h: yh };
  function overlaps(a, b, gap) { return !(a.x + a.w + gap <= b.x || b.x + b.w + gap <= a.x || a.y + a.h + gap <= b.y || b.y + b.h + gap <= a.y); }
  function fits(lot) {
    if (lot.x < tx + 1 || lot.y < ty + 1 || lot.x + lot.w > tx + w - 1 || lot.y + lot.h > ty + h - 1) return false;
    if (overlaps(lot, V.yard, G.yardGap - 1)) return false;
    for (var i = 0; i < V.lots.length; i++) if (overlaps(lot, V.lots[i], G.gap)) return false;
    return true;
  }
  function tryPlace(lot, jitter) {                   // the lot where asked, or shuffled a little until it fits
    var k, best = null; for (k = 0; k < 12; k++) { var dx = k ? Math.round((R() - 0.5) * 2 * jitter) : 0, dy = k ? Math.round((R() - 0.5) * 2 * jitter) : 0, l = { x: lot.x + dx, y: lot.y + dy, w: lot.w, h: lot.h, id: lot.id, door: lot.door, slot: lot.slot }; if (fits(l)) { best = l; break; } }
    if (best) V.lots.push(best); return best;
  }
  function size(id) { var b = BUILD[id]; if (id === 'house' && R() < 0.5) return { w: pickRange(R, [2, 3], 0), h: 3 }; return { w: pickRange(R, b.w, G.sizeJitter * (b.w[1] > b.w[0] ? 1 : 0)), h: pickRange(R, b.h, 0) }; }   // half the houses stand deep: a gable end facing south
  // the ring: the longhouse north of the yard facing it; the houses east, west, south-east and south-west, shuffled; some slots left open
  var big = A.hall ? 'hall' : 'longhouse', bs = size(big);
  tryPlace({ id: big, x: yx + Math.floor((yw - bs.w) / 2) + Math.round((R() - 0.5) * 2), y: yy - G.yardGap - bs.h, w: bs.w, h: bs.h, door: 's', slot: 'n' }, 1);
  var nHouses = pickRange(R, A.houses, 0), slots = ['e', 'w', 'se', 'sw', 'ne', 'nw'], order = slots.slice().sort(function () { return R() - 0.5; }), placedHouses = 0, si;
  for (si = 0; si < order.length && placedHouses < nHouses; si++) {
    if (R() < G.emptySlots && si < order.length - 1) continue;
    var sl = order[si], hs = size('house'), lot = null;
    if (sl === 'e') lot = { x: yx + yw + G.yardGap, y: yy + Math.floor(R() * Math.max(1, yh - hs.h + 1)), door: 'w' };
    else if (sl === 'w') lot = { x: yx - G.yardGap - hs.w, y: yy + Math.floor(R() * Math.max(1, yh - hs.h + 1)), door: 'e' };
    else if (sl === 'se') lot = { x: yx + yw - hs.w + 1, y: yy + yh + G.yardGap, door: 'w' };
    else if (sl === 'sw') lot = { x: yx - 1, y: yy + yh + G.yardGap, door: 'e' };
    else if (sl === 'ne') lot = { x: yx + yw + G.yardGap + 1, y: yy - hs.h - 1, door: 's' };
    else lot = { x: yx - G.yardGap - hs.w - 1, y: yy - hs.h - 1, door: 's' };
    lot.w = hs.w; lot.h = hs.h; lot.id = 'house'; lot.slot = sl;
    if (tryPlace(lot, 1)) placedHouses++;
  }
  // the outer ring: each outbuilding near what it serves
  var outs = ['store', 'byre', 'smithy', 'pit', 'bath'], nOut = pickRange(R, A.out, 0), placedOut = 0, oi;
  if (A.stores) outs.unshift('store'); if (shore) outs.unshift('boathouse');
  var L0 = V.lots[0];
  for (oi = 0; oi < outs.length && placedOut < nOut; oi++) {
    var id = outs[oi], os = size(id), lot2;
    var rx0 = 1e9, ry0 = 1e9, rx1 = -1e9, ry1 = -1e9; V.lots.forEach(function (l) { rx0 = Math.min(rx0, l.x); ry0 = Math.min(ry0, l.y); rx1 = Math.max(rx1, l.x + l.w); ry1 = Math.max(ry1, l.y + l.h); });   // the ring so far: outbuildings hug it
    if (id === 'store') lot2 = { x: L0.x + L0.w + G.gap + Math.floor(R() * 2), y: L0.y - 1 + Math.floor(R() * 2), door: 's' };
    else if (id === 'byre') { var hh = V.lots.filter(function (l) { return l.id === 'house'; }), nb = hh.length ? hh[Math.floor(R() * hh.length)] : L0; lot2 = { x: nb.x + (nb.slot === 'w' || nb.slot === 'sw' || nb.slot === 'nw' ? -os.w - G.gap : nb.w + G.gap), y: nb.y, door: 's' }; }
    else if (id === 'smithy') lot2 = { x: R() < 0.5 ? rx0 - os.w - G.gap : rx1 + G.gap, y: ry1 - os.h, door: 's' };
    else if (id === 'pit') lot2 = { x: rx0 - os.w - G.gap, y: yy + Math.floor(R() * yh), door: 'e' };
    else if (id === 'bath') lot2 = shore === 'e' ? { x: rx1 + G.gap, y: yy + yh, door: 'w' } : { x: rx1 - os.w, y: ry0 - os.h - G.gap, door: 's' };
    else if (id === 'boathouse') lot2 = shore === 's' ? { x: yx + Math.floor(R() * 3) - 1, y: ty + h - os.h - 1, door: 's' } : shore === 'n' ? { x: yx, y: ty + 1, door: 's' } : shore === 'e' ? { x: tx + w - os.w - 1, y: yy + yh + 2, door: 's' } : { x: tx + 1, y: yy + yh + 2, door: 's' };
    lot2.w = os.w; lot2.h = os.h; lot2.id = id; lot2.slot = 'out';
    if (tryPlace(lot2, 2)) placedOut++;
  }
  // the pieces of every lot: walls in the lot's material, a door on the yard side, a window or two, the floor, the roof later
  function H(x, y, t, m) { V.H[key(x, y)] = { t: t, m: m }; } function Vw(x, y, t, m) { V.V[key(x, y)] = { t: t, m: m }; }
  function item(name, x, y, extra) { var it = { name: name, x: x, y: y }; for (var q in extra || {}) it[q] = extra[q]; V.items.push(it); return it; }
  function pieces(l) {
    var b = BUILD[l.id], m = l.id === big ? wallOf(0) : (l.id === 'house' ? wallOf(1) : (l.id === 'store' || l.id === 'bath' ? 1 : 2)), roof = roofOf(l.id === big), x, y;
    if (l.id === 'smithy') m = 3; if (l.id === 'pit') m = 4;
    var dx = l.door === 's' || l.door === 'n' ? l.x + 1 + Math.floor(R() * Math.max(1, l.w - 2)) : -1, dy = l.door === 'e' || l.door === 'w' ? l.y + Math.floor(R() * l.h) : -1;
    var gaps = V.ruin ? Math.max(1, Math.floor((l.w + l.h) * 0.35)) : 0, gapAt = {}; if (gaps) for (var g = 0; g < gaps; g++) gapAt[Math.floor(R() * (l.w * 2 + l.h * 2))] = 1;
    var n = 0; l.wins = [];
    for (x = l.x; x < l.x + l.w; x++) { if (!gapAt[n++] && !(b.open && l.door === 's' && false)) H(x, l.y, l.door === 'n' && x === dx ? 'door' : 'wall', m); }
    for (x = l.x; x < l.x + l.w; x++) { var south = l.door === 's' && x === dx ? 'door' : ((x === l.x + l.w - 1 || (l.door !== 's' && x === l.x)) && l.w > 1 && R() < 0.6 ? 'window' : 'wall'); if (b.open && l.door === 's') south = x === dx ? 'door' : (x === l.x || x === l.x + l.w - 1 ? 'wall' : 'door'); if (!gapAt[n++]) { H(x, l.y + l.h, south, m); if (south === 'window') l.wins.push(x); } }
    for (y = l.y; y < l.y + l.h; y++) { if (!gapAt[n++]) Vw(l.x, y, l.door === 'w' && y === dy ? 'door' : 'wall', m); }
    for (y = l.y; y < l.y + l.h; y++) { if (!gapAt[n++]) Vw(l.x + l.w, y, l.door === 'e' && y === dy ? 'door' : (y === l.y && l.h > 1 && R() < 0.5 && l.door !== 'e' ? 'window' : 'wall'), m); }
    for (y = l.y; y < l.y + l.h; y++) for (x = l.x; x < l.x + l.w; x++) V.floors[key(x, y)] = b.floor != null ? b.floor : (l.id === 'byre' || l.id === 'boathouse' ? 1 : 0);
    if (!V.ruin || R() < 0.5) V.roofs.push({ tx: l.x, ty: l.y, m: roof });
    l.m = m; l.roof = roof; l.dx = dx; l.dy = dy;
    furnish(l);
  }
  function tile(x, y) { return [(x + 0.5) * T, (y + 0.5) * T]; }
  function furnish(l) {                               // what stands inside, by the building's kind; chests and crates carry the finds
    var cx = l.x + l.w / 2, p, k, loot;
    var mid = tile(cx - 0.5, l.y + Math.floor(l.h / 2));
    if (BUILD[l.id].inside === 'hall') {
      item('stoneHearth', mid[0] - T * 0.5, mid[1], { hearth: true, light: 1 }); if (l.w >= 8) item('stoneHearth', mid[0] + T * 1.5, mid[1], { hearth: true, light: 1 });
      p = tile(l.x, l.y); item('bed', p[0] + 4, p[1] + 2, { bed: true }); p = tile(l.x + l.w - 1, l.y); item('bed', p[0] - 4, p[1] + 2, { bed: true });
      p = tile(l.x + 1, l.y + l.h - 1); item('bench', p[0], p[1] - 3); p = tile(l.x + l.w - 2, l.y + l.h - 1); item('bench', p[0], p[1] - 3);
      p = tile(l.x + l.w - 1, l.y + l.h - 1); item('chest', p[0] - 2, p[1] - 2, { store: true, loot: { leather: 2, berries: 3, coin: 2 + Math.floor(wealth * 6) } });
      p = tile(l.x + 2, l.y); item('table', p[0] + 10, p[1] + 4); if (wealth > 0.5) { p = tile(l.x + Math.floor(l.w / 2), l.y); item('shieldRack', p[0], p[1] + 2); }
      if (A.hall) { p = tile(l.x + l.w - 2, l.y + 1); item('chair', p[0], p[1], { seat: true, muster: true }); }
    } else if (BUILD[l.id].inside === 'home') {
      item('stoneHearth', mid[0] + (l.w > 3 ? 0 : T * 0.3), mid[1] + (l.h > 2 ? 0 : -2), { hearth: true, light: 1 });
      p = tile(l.x, l.y); item('bed', p[0] + 3, p[1] + 2, { bed: true }); if (l.w >= 4 && l.h >= 3) { p = tile(l.x + l.w - 1, l.y); item('bed', p[0] - 3, p[1] + 2, { bed: true }); }
      p = tile(l.x + l.w - 1, l.y + l.h - 1); item('chest', p[0] - 2, p[1] - 3, { store: true, loot: { fiber: 3, berries: 2, coin: Math.floor(wealth * 3) } });
      if (l.w >= 4) { p = tile(l.x + 1, l.y + l.h - 1); item('chair', p[0] + 2, p[1] - 4, { seat: true }); }
    } else if (BUILD[l.id].inside === 'store') {
      p = tile(l.x, l.y); item('crate', p[0] + 6, p[1] + 2, { loot: { berries: 5, fiber: 4 } }); p = tile(l.x + 1, l.y); item('barrel', p[0] - 4, p[1] + 2, { loot: { meat: 2, leather: 1 } });
      p = tile(l.x, l.y + 1); item('crate', p[0] + 6, p[1], { loot: { arrows: 10, wood: 4 } });
    } else if (BUILD[l.id].inside === 'byre') { p = tile(l.x, l.y); item('haystack', p[0] + 8, p[1] + 4); p = tile(l.x + l.w - 1, l.y + l.h - 1); item('trough', p[0] - 4, p[1] - 4); }
    else if (BUILD[l.id].inside === 'smithy') { p = tile(l.x, l.y); item('furnace', p[0] + 8, p[1] + 2, { furnace: true, light: 1 }); p = tile(l.x + l.w - 1, l.y); item('workbench', p[0] - 6, p[1] + 2, { bench: true }); p = tile(l.x + 1, l.y + l.h - 1); item('trough', p[0], p[1]); }
    else if (BUILD[l.id].inside === 'bath') { p = tile(l.x, l.y); item('stoneHearth', p[0] + 8, p[1] + 4, { hearth: true, light: 1 }); p = tile(l.x + 1, l.y + 1); item('bench', p[0], p[1] - 4, { seat: true }); }
    else if (BUILD[l.id].inside === 'pit') { p = tile(l.x, l.y); item('campfire', p[0] + 10, p[1] + 6, { hearth: true, light: 1 }); p = tile(l.x + 1, l.y + 1); item('dryingRack', p[0], p[1] - 4); }
    else if (BUILD[l.id].inside === 'boat') { V.finds.push({ kind: 'boat', x: tile(l.x + l.w / 2, l.y + 1)[0], y: tile(l.x, l.y + 1)[1], lot: l }); p = tile(l.x, l.y); item('barrel', p[0] + 6, p[1] + 2, { loot: { fiber: 4 } }); }
    // things by the door: a woodpile, a barrel, a bench, bee skeps, a cart
    var dp = l.door === 's' ? tile(l.dx, l.y + l.h) : l.door === 'e' ? tile(l.x + l.w, l.dy) : l.door === 'w' ? tile(l.x - 1, l.dy) : tile(l.dx, l.y - 1), pool = ['woodpile', 'barrel', 'bench', 'beeSkeps', 'cart', 'dryingRack', 'crate', 'logSeat', 'trough', 'haystack'];
    V.paints.push({ x: dp[0], y: dp[1] + (l.door === 's' ? 6 : 0), r: 7, kind: 1 });                                        // a worn step at every door
    var nd = Math.round(G.doorProps + (R() - 0.5)), di2, used = {};
    for (di2 = 0; di2 < nd; di2++) { var by = pool[Math.floor(R() * pool.length)]; if (used[by]) continue; used[by] = 1; var sideS = di2 % 2 ? 1 : -1, off = l.door === 's' ? [T * (1.2 + 0.5 * di2) * sideS, 6 + R() * 6] : l.door === 'e' ? [10 + R() * 8, T * (1.0 + 0.6 * di2) * sideS] : l.door === 'w' ? [-10 - R() * 8, T * (1.0 + 0.6 * di2) * sideS] : [T * (1.2 + 0.5 * di2) * sideS, -8]; V.props.push({ name: by, x: dp[0] + off[0], y: dp[1] + off[1], loot: by === 'barrel' || by === 'crate' ? { berries: 2, fiber: 2 } : null }); }
    if (l.id === big) { var wp = l.door === 's' ? tile(l.x + l.w, l.y + l.h) : tile(l.x - 1, l.y + l.h); V.props.push({ name: G.clutter ? 'woodshed' : 'woodpile', x: wp[0] + 8, y: wp[1] + 4, solid: 9 }); V.props.push({ name: 'choppingBlock', x: wp[0] + 36, y: wp[1] + 12, block: true }); }
    // things against the walls (Robin, 2026-10-07: lived-in like the reference): a window box under every south window, a lantern by
    // the door that is lit at night, an awning on the open-fronted buildings, a sign on the hall and the trading stores
    if (G.clutter && !V.ruin) {
      var wy = (l.y + l.h) * T;
      l.wins.forEach(function (wx) { item('windowBox', (wx + 0.5) * T, wy + 4, { r: 0, wall: true }); });
      if (l.door === 's' && (l.id === big || l.id === 'house' || l.id === 'bath')) item('lantern', l.dx * T - 6, wy + 2, { r: 0, wall: true, light: 1, lamp: true });
      if (l.door === 's' && (l.id === 'store' || l.id === 'smithy' || l.id === 'boathouse')) item('awning', (l.dx < l.x + l.w / 2 ? (l.x + l.w - 0.6) : (l.x + 0.6)) * T, wy + 9, { r: 2 });
      if (l.door === 's' && ((A.hall && l.id === big) || (A.stores && l.id === 'store'))) item('sign', l.dx * T + T + 7, wy + 2, { r: 0, wall: true });
    }
  }
  V.lots.forEach(pieces);
  // the well in the yard (a fire pit for the poor), the finds, the fence and gate, the fields, the sacred, the midden
  var wc = tile(yx + Math.floor(yw / 2), yy + Math.floor(yh / 2)), fc = [wc[0] - T * 0.2, wc[1] + T * 0.2];                                                             // the fire in the middle of the yard, the well off to the north-east
  if (wealth > 0.3) item('woodenWell', wc[0] + T * (yw >= 7 ? 1.9 : 1.4), wc[1] - T * (yh >= 5 ? 1.1 : 0.7));
  if (G.firePit) { item('firePit', fc[0], fc[1], { hearth: true, light: 1, pit: true }); var ns = Math.round(G.logSeats), si2; for (si2 = 0; si2 < ns; si2++) { var sa = -0.9 + si2 * (1.8 / Math.max(1, ns - 1)) + 1.57, sx2 = fc[0] + Math.cos(sa) * 38, sy2 = fc[1] + Math.sin(sa) * 24 + 8; if (Math.abs(Math.cos(sa)) < 0.35 && Math.sin(sa) < 0) continue; item('logSeat', sx2, sy2, { seat: true, fire: true }); } V.finds.push({ kind: 'fire', x: fc[0], y: fc[1] }); }
  else item('campfire', fc[0], fc[1], { hearth: true, light: 1 });
  if (yw >= 7 && R() < 0.6) V.props.push({ name: 'cart', x: yx * T + T * 0.9, y: (yy + yh) * T - T * 0.5 });
  if (G.clutter && !V.ruin && yw >= 7) { item('foodTable', wc[0] + T * 2.4, wc[1] + T * 1.2, { r: 7 }); item('bench', wc[0] + T * 2.4, wc[1] + T * 1.2 + 15, { seat: true }); }
  var homes = V.lots.filter(function (l) { return l.id === big || l.id === 'house'; });
  if (wealth >= G.cellarAt && homes.length) { var cl = homes[Math.floor(R() * homes.length)], cp = tile(cl.x + Math.floor(cl.w / 2), cl.y + cl.h - 1); item('cellarDoor', cp[0], cp[1] - 2, { cellar: true, store: true, loot: { coin: 6 + Math.floor(wealth * 10), leather: 3, copper: 2 }, lore: 'Someone kept this well hidden.' }); V.finds.push({ kind: 'cellar', x: cp[0], y: cp[1] }); }
  var ex0 = 1e9, ey0 = 1e9, ex1 = -1e9, ey1 = -1e9; V.lots.forEach(function (l) { ex0 = Math.min(ex0, l.x); ey0 = Math.min(ey0, l.y); ex1 = Math.max(ex1, l.x + l.w); ey1 = Math.max(ey1, l.y + l.h); });
  ex0 = Math.max(tx, ex0 - G.fenceGap); ey0 = Math.max(ty, ey0 - G.fenceGap); ex1 = Math.min(tx + w, ex1 + G.fenceGap); ey1 = Math.min(ty + h, ey1 + G.fenceGap);
  var gateX = yx + Math.floor(yw / 2), fk = fenceKind, fm = fk === 'drystone' ? 3 : 2, x, y;
  var roadSide = R() < 0.5 ? 1 : -1, backGateX = null;                                                         // the road bends past the fire on this side and leaves by a back gate beside the longhouse
  if (G.backGate && (!shore || shore === 's') && (A.houses[1] >= 3 || shore === 's')) { backGateX = roadSide > 0 ? L0.x + L0.w + 1 : L0.x - 2; if (backGateX <= ex0 || backGateX >= ex1 - 1) backGateX = roadSide > 0 ? L0.x - 2 : L0.x + L0.w + 1; if (backGateX <= ex0 || backGateX >= ex1 - 1) backGateX = null; }
  if (fk === 'palisade') {                             // a round wall of sharpened stakes round the whole ring, a gap for the gate on the path, banners either side
    var ecx = (ex0 + ex1) / 2 * T, ecy = (ey0 + ey1) / 2 * T, hw2 = Math.max(1, (ex1 - ex0) / 2 * T), hh2 = Math.max(1, (ey1 - ey0) / 2 * T), kk = 1;
    V.lots.forEach(function (l) { [[l.x, l.y], [l.x + l.w, l.y], [l.x, l.y + l.h], [l.x + l.w, l.y + l.h]].forEach(function (q) { var dx = (q[0] * T - ecx) / hw2, dy = (q[1] * T - ecy) / hh2; kk = Math.max(kk, Math.sqrt(dx * dx + dy * dy)); }); });   // the ellipse hugs the buildings: every corner inside it
    var erx = hw2 * kk + T * 0.8, ery = hh2 * kk + T * 0.8, per = 6.283 * Math.sqrt((erx * erx + ery * ery) / 2), nst = Math.max(12, Math.round(per / G.stakeStep)), gpt = tile(gateX, ey1), gateA = Math.atan2((gpt[1] + T - ecy) / ery, (gpt[0] - ecx) / erx), k2;
    var gpt2 = backGateX != null ? tile(backGateX, ey0) : null, gate2A = gpt2 ? Math.atan2((gpt2[1] - T - ecy) / ery, (gpt2[0] - ecx) / erx) : null;
    for (k2 = 0; k2 < nst; k2++) { var a2 = k2 / nst * 6.283, px = ecx + Math.cos(a2) * erx, py = ecy + Math.sin(a2) * ery, da = Math.abs(Math.atan2(Math.sin(a2 - gateA), Math.cos(a2 - gateA))); if (da < 0.16) continue; if (gate2A != null && Math.abs(Math.atan2(Math.sin(a2 - gate2A), Math.cos(a2 - gate2A))) < 0.14) continue; if (shore === 's' && Math.sin(a2) > 0.75) continue; if (V.ruin && R() < 0.35) continue; V.props.push({ name: 'stake', x: px, y: py, solid: 5 }); }
    for (k2 = 0; k2 < (shore === 's' ? 0 : Math.round(G.banners)); k2++) { var ba = gateA + (k2 % 2 ? 1 : -1) * 0.2; V.props.push({ name: 'banner', x: ecx + Math.cos(ba) * erx, y: ecy + Math.sin(ba) * ery + 2, solid: 3 }); }
    V.fence = { x0: ex0, y0: ey0, x1: ex1, y1: ey1, kind: 'palisade', round: true, gate: gateX, cx: ecx, cy: ecy, rx: erx, ry: ery };
  } else {
    for (x = ex0; x < ex1; x++) { if (x === backGateX) H(x, ey0, 'gate', 2); else if (!(V.ruin && R() < 0.4)) H(x, ey0, fk, fm); if (x === gateX && shore !== 's') H(x, ey1, 'gate', 2); else if (!(V.ruin && R() < 0.4) && !(shore === 's')) H(x, ey1, fk, fm); }
    for (y = ey0; y < ey1; y++) { if (!(V.ruin && R() < 0.4) && shore !== 'w') Vw(ex0, y, fk, fm); if (!(V.ruin && R() < 0.4) && shore !== 'e') Vw(ex1, y, fk, fm); }
    V.fence = { x0: ex0, y0: ey0, x1: ex1, y1: ey1, kind: fk, gate: gateX };
  }
  // the ground: the yard trodden to earth, gravel from the gate to the well and to the shore, earth from every door, moss at the back
  function dab(x, y, r, kind) { V.paints.push({ x: x, y: y, r: r, kind: kind }); }
  function strokeTo(a, b, r, kind, r2) { var n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / (r * 0.6))), i; for (i = 0; i <= n; i++) { var u = i / n, rr = r2 == null ? r : r + (r2 - r) * u; dab(a[0] + (b[0] - a[0]) * u + (R() - 0.5) * 4, a[1] + (b[1] - a[1]) * u + (R() - 0.5) * 4, rr * (0.85 + R() * 0.3), kind); } }
  if (G.yardEarth) { for (var yi = 0; yi < 5; yi++) dab(wc[0] + (R() - 0.5) * yw * T * 0.6, wc[1] + (R() - 0.5) * yh * T * 0.6, 12 + R() * 8, 2); }
  // the road (Robin, 2026-10-07: one winding road, not spokes to every door): in at the gate, bending through the yard past the
  // fire, on to the longhouse door, and out by the back gate or down to the shore; narrow at the gates, wide in the yard; it
  // wanders a little and its edges are ragged with small dabs; the doors keep only their worn step
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
  var gate = tile(gateX, ey1), rw = G.roadW, L0d = L0.door === 's' ? tile(L0.dx, L0.y + L0.h) : tile(L0.x + L0.w / 2, L0.y + L0.h);
  var pts = shore === 's' ? [[wc[0] - roadSide * T * 2.2, (ty + h) * T + 10, rw * 0.6], [wc[0] - roadSide * T * 1.6, (ty + h - 1.2) * T, rw * 0.7]] : [[gate[0] + roadSide * 12, gate[1] + T * 2.6, rw * 0.6], [gate[0], gate[1] + T * 0.4, rw * 0.7]];
  pts.push([fc[0] + roadSide * T * 1.6, fc[1] + T * 1.0, rw * 1.1], [fc[0] + roadSide * T * 1.4, fc[1] - T * 1.1, rw * 1.0], [L0d[0], L0d[1] + T * 0.7, rw * 0.7]);
  if (backGateX != null) { var bg = tile(backGateX, ey0); pts.push([bg[0], (L0.y + L0.h + 1) * T, rw * 0.6]); pts.push([bg[0], bg[1], rw * 0.55]); pts.push([bg[0] + roadSide * 8, bg[1] - T * 2.2, rw * 0.5]); }
  road(pts, 2);
  V.roadEnds = { front: [pts[0][0], pts[0][1]], back: backGateX != null ? [pts[pts.length - 1][0], pts[pts.length - 1][1]] : null };   // where a page can join a road on
  if (shore === 's') V.roadEnds.front = [pts[0][0], pts[0][1]];
  if (shore && shore !== 's') { var shp = shore === 's' ? [wc[0] - roadSide * T * 2.2, (ty + h) * T + 8] : shore === 'n' ? [wc[0], ty * T - 8] : shore === 'e' ? [(tx + w) * T + 8, wc[1]] : [tx * T - 8, wc[1]]; road([[fc[0] + roadSide * T * 1.6, fc[1] + T * 1.0, rw * 0.9], [fc[0] - roadSide * T * 0.6, fc[1] + T * 1.8, rw * 0.8], shp.concat([rw * 0.6])], 2); }
  if (G.pathGravel) { if (shore !== 's') dab(gate[0], gate[1] + 6, 10, 1); if (backGateX != null) dab(tile(backGateX, ey0)[0], ey0 * T, 8, 1); }
  if (G.mossEdge) { dab(ex0 * T + 10, ey0 * T + 10, 20, 3); dab(ex1 * T - 10, ey0 * T + 16, 16, 3); dab(ex0 * T + 14, ey1 * T - 12, 14, 3); }
  // trees, bushes and rocks kept in and round the village (Robin, 2026-10-07: lived-in like the reference, not a cleared green);
  // a page plants them as the world's own props (gatherable), the editor draws them
  V.nature = [];
  function freeAt(x2, y2, r, skipLots) {
    var i, l;
    for (i = 0; i < V.lots.length; i++) { l = V.lots[i]; var mg = skipLots ? 0 : T; if (x2 > l.x * T - mg - r && x2 < (l.x + l.w) * T + mg + r && y2 > l.y * T - mg - r && y2 < (l.y + l.h) * T + mg + r) return false; }
    if (x2 > (yx - 0.5) * T - r && x2 < (yx + yw + 0.5) * T + r && y2 > (yy - 0.5) * T - r && y2 < (yy + yh + 0.5) * T + r) return false;
    for (i = 0; i < V.paints.length; i++) { var pa = V.paints[i]; if (pa.r >= 5 && Math.hypot(pa.x - x2, pa.y - y2) < pa.r + r + 8) return false; }
    for (i = 0; i < V.items.length; i++) if (Math.hypot(V.items[i].x - x2, V.items[i].y - y2) < r + 20) return false;
    for (i = 0; i < V.props.length; i++) if (Math.hypot(V.props[i].x - x2, V.props[i].y - y2) < r + 14) return false;
    for (i = 0; i < V.nature.length; i++) if (Math.hypot(V.nature[i].x - x2, V.nature[i].y - y2) < r + V.nature[i].r + 12) return false;
    if (V.folk.length) for (i = 0; i < V.folk.length; i++) if (Math.hypot(V.folk[i].x - x2, V.folk[i].y - y2) < r + 16) return false;
    return true;
  }
  if (G.nature) {
    for (y = ey0 - 2; y <= ey1 + 1; y++) for (x = ex0 - 2; x <= ex1 + 1; x++) {
      var inside = x >= ex0 && x < ex1 && y >= ey0 && y < ey1, px3 = (x + 0.2 + R() * 0.6) * T, py3 = (y + 0.3 + R() * 0.5) * T, roll = R(), nm = null, ns3 = 1, nr = 0;
      if (x < tx || y < ty || x >= tx + w || y >= ty + h) continue;
      if (!inside && (x === ex0 - 1 || x === ex1 || y === ey0 - 1 || y === ey1)) continue;   // nothing on the fence line itself
      if (inside) { if (roll < 0.05) { nm = R() < 0.6 ? 'birch' : 'oak'; ns3 = 0.5 + R() * 0.08; nr = 11; } else if (roll < 0.11) { nm = R() < 0.6 ? 'bush' : 'flower'; ns3 = 0.6 + R() * 0.15; } }
      else { if (roll < 0.1) { nm = R() < 0.7 ? 'rock' : 'rockFormation'; ns3 = 0.8 + R() * 0.2; nr = 10; } else if (roll < 0.17) { nm = 'bush'; ns3 = 0.65 + R() * 0.15; } else if (roll < 0.3) { nm = R() < 0.5 ? 'birch' : 'pine'; ns3 = 0.52 + R() * 0.08; nr = 11; } }
      if (!nm || !freeAt(px3, py3, nr + 6)) continue;
      V.nature.push({ name: nm, x: px3, y: py3, s: ns3, r: nr, v: Math.floor(R() * 3) });
    }
    V.lots.forEach(function (l) {                      // a bush against a side wall now and then
      if (R() > 0.55) return; var sideB = R() < 0.5 ? -1 : 1, bx = sideB < 0 ? l.x * T - 10 : (l.x + l.w) * T + 10, by = (l.y + 0.3 + R() * (l.h - 0.6)) * T;
      if (!freeAt(bx, by, 4, true)) return; V.nature.push({ name: 'bush', x: bx, y: by, s: 0.6, r: 0, v: Math.floor(R() * 3) });
    });
  }
  // the fields outside the fence, the sacred stone at a corner, the midden behind, a grave beyond
  if (G.fields && A.houses[1] > 0 && !V.ruin) { var fx = shore === 'e' ? ex0 - 6 : ex1 + 2, fy0 = ey0 + 1, strips = G.fieldStrips; if (fx > tx && fx + 4 < tx + w) for (var s2 = 0; s2 < strips; s2++) { var sy = fy0 + s2 * 3; if (sy + 2 > ty + h) break; strokeTo([(fx + 0.5) * T, (sy + 1) * T], [(fx + 3.5) * T, (sy + 1) * T], 10, 2); if (s2 === 1) V.props.push({ name: 'scarecrow', x: (fx + 2) * T, y: (sy + 0.3) * T }); } V.props.push({ name: 'haystack', x: (fx + 2) * T, y: (fy0 + strips * 3 + 0.5) * T }); }
  if (G.sacred) { var sc = tile(ex0 - 1 >= tx ? ex0 - 1 : ex1 + 1, ey0); V.props.push({ name: 'runestone', x: sc[0], y: sc[1], lore: 'Raised by the folk of ' + (opts.name || 'this place') + ' for one who did not come home.' }); V.finds.push({ kind: 'stone', x: sc[0], y: sc[1] }); }
  if (G.midden) { var mp = tile(ex1 - 1, ey0 - 1 >= ty ? ey0 - 1 : ey0); dab(mp[0], mp[1], 14, 1); V.props.push({ name: 'crate', x: mp[0], y: mp[1], loot: { fiber: 2 } }); }
  if (G.graves && R() < 0.6) { var gp = tile(ex1 + 1 < tx + w ? ex1 + 1 : ex0 - 1, ey1 - 1); V.props.push({ name: 'cairn', x: gp[0], y: gp[1], grave: true }); V.finds.push({ kind: 'grave', x: gp[0], y: gp[1] }); }
  // the people: a household per home, with their spots (their door, the well, the yard, a workplace) and lines by role
  var nPeople = V.ruin ? 0 : pickRange(R, A.people, 0), hi = 0, roles = ['farmer', 'fisher', 'smith', 'weaver', 'elder', 'child', 'thrall'];
  for (var pi = 0; pi < nPeople && homes.length; pi++) {
    var home = homes[hi % homes.length]; hi++;
    var door = home.door === 's' ? tile(home.dx, home.y + home.h + 1) : home.door === 'e' ? tile(home.x + home.w + 1, home.dy) : home.door === 'w' ? tile(home.x - 2, home.dy) : tile(home.dx, home.y - 2);
    var role = shore && R() < 0.4 ? 'fisher' : roles[Math.floor(R() * roles.length)]; if (role === 'smith' && !V.lots.some(function (l) { return l.id === 'smithy'; })) role = 'farmer';
    var work = role === 'smith' ? V.lots.filter(function (l) { return l.id === 'smithy'; })[0] : role === 'fisher' && shore ? null : V.lots.filter(function (l) { return l.id === 'byre' || l.id === 'store'; })[0];
    var seatsV = V.items.filter(function (it) { return it.name === 'logSeat'; }), seatV = seatsV.length ? seatsV[pi % seatsV.length] : null;
    var spots = [door.concat(['door']), [wc[0] + (R() - 0.5) * 30, wc[1] + 20 + (R() - 0.5) * 20], [wc[0] + (R() - 0.5) * yw * T * 0.6, wc[1] + (R() - 0.5) * yh * T * 0.6]];
    if (seatV) spots.push([seatV.x, seatV.y + 1.5, 'sit']);
    // the jobs (Robin, 2026-10-07: people with something to do): a farmer or thrall chops at the block and carries water, a fisher fishes
    // at the shore or hangs the catch, the smith hammers by the smithy, the weaver and the elder sweep the doorstep; a child only plays
    var block = V.props.filter(function (pr) { return pr.block; })[0], wellIt = V.items.filter(function (it) { return it.name === 'woodenWell'; })[0], rackIt = V.props.filter(function (pr) { return pr.name === 'dryingRack'; })[0];
    if (role === 'smith' && work) spots.push([tile(work.dx, work.y + work.h)[0] + 18, (work.y + work.h) * T + 18, 'smith']);
    else if (role === 'fisher') { if (shore) spots.push((shore === 's' ? [wc[0] + (R() - 0.5) * 80, (ty + h - 1) * T + 6] : shore === 'n' ? [wc[0], (ty + 1) * T] : shore === 'e' ? [(tx + w - 1) * T, wc[1]] : [(tx + 1) * T, wc[1]]).concat(['fish'])); if (rackIt) spots.push([rackIt.x, rackIt.y + 12, 'hang']); }
    else if (role === 'farmer' || role === 'thrall') { if (block && R() < 0.7) spots.push([block.x, block.y - 16, 'chop']); if (wellIt) spots.push([wellIt.x, wellIt.y + 16, 'carry']); }
    else if (role === 'weaver' || role === 'elder') { spots.push([door[0] + 12, door[1] + 2, 'sweep']); if (wellIt && R() < 0.5) spots.push([wellIt.x, wellIt.y + 16, 'carry']); }
    else if (work) spots.push(tile(work.dx >= 0 ? work.dx : work.x, work.y + work.h + 1));
    V.folk.push({ name: NAMES[Math.floor(R() * NAMES.length)], role: role, home: [home.x, home.y], x: door[0], y: door[1], spots: spots, lines: ROLES[role], female: R() < 0.5, out: R() < G.outsideShare });
  }
  return V;
}
// a page's site for an archetype: the tiles it needs
function siteFor(archId) { var A = ARCH[archId] || ARCH.small; return { w: A.site[0], h: A.site[1] }; }

/* Villages across the islands (2026-10-07, Robin): where the villages of a world stand, what kind each is, its name and its jetty.
   plan(env, opts): env = { isles: [{ x, y, r }] in tiles (the first is the starter island and gets nothing: its village was raided),
   code(tx, ty) (0 sea, 1 beach, 2 and up grass, 255 off the map), shallow(tx, ty) (water a jetty may stand in), R, home: [tx, ty]
   (the wreck), avoid: [{ x, y, r }] in tiles (the cave) }. The big island gets three (a seat or a village inland, a fishing hamlet
   or a trading post on a shore, a small place), a middling island two, a small one one or none; a ruin now and then; wealth rises
   with the distance from the wreck. Every village gets a name (nameFor: a Norse first name and a place ending by its kind) and,
   when a shore is within reach, a jetty of planks out into the shallows with a boat or two moored beside it (jettyFor). */
var FIRST = ['Eirik', 'Orm', 'Hallvard', 'Sigrun', 'Asta', 'Ketil', 'Thorir', 'Gunnar', 'Ingrid', 'Ragna', 'Ulf', 'Bjorn', 'Halla', 'Yngvar', 'Vigdis', 'Hakon', 'Dagny', 'Mundi', 'Nanna', 'Torsten', 'Alvar', 'Solveig', 'Audun', 'Brynja', 'Geir', 'Tova', 'Steinar', 'Hild'];
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
    var sz = siteFor(arch), tries;
    for (tries = 0; tries < 900; tries++) {
      var a = R() * 6.283, d = (wantShore ? 0.45 + R() * 0.5 : R() * 0.6) * q.r, cx = Math.floor(q.x + Math.cos(a) * d), cy = Math.floor(q.y + Math.sin(a) * d * 0.9);
      if (!siteOk(cx, cy, sz.w, sz.h) || !farEnough(cx, cy)) continue;
      var sh = shoreOf(cx, cy, sz.h); if (wantShore && !sh) continue; if (!wantShore && sh) continue;
      return { cx: cx, cy: cy, tx: cx - Math.ceil(sz.w / 2), ty: cy - Math.ceil(sz.h / 2), w: sz.w, h: sz.h, shore: sh };
    }
    return null;
  }
  for (i = 1; i < isles.length; i++) {
    var q = isles[i], wants = [], big = i === 1 || q.r >= 100;
    if (big) wants = [[R() < 0.45 ? 'seat' : 'village', false], [R() < 0.3 ? 'trading' : 'fishing', true], [R() < 0.5 ? 'small' : 'farmstead', false]];
    else if (q.r >= 65) wants = [[R() < 0.6 ? 'fishing' : 'trading', true], [R() < 0.5 ? 'small' : (R() < 0.5 ? 'village' : 'farmstead'), false]];
    else if (q.r >= 42) wants = [R() < 0.5 ? ['fishing', true] : ['farmstead', false]];
    else if (R() < 0.5) wants = [['farmstead', false]];
    wants.forEach(function (wq) {
      var arch = wq[0], st = find(q, arch, wq[1]); if (!st) { st = find(q, wq[1] ? 'fishing' : 'small', wq[1]); arch = wq[1] ? 'fishing' : 'small'; } if (!st) return;
      if (arch !== 'seat' && arch !== 'trading' && R() < 0.14) arch = 'ruin';
      var dist = Math.hypot(st.cx - env.home[0], st.cy - env.home[1]) / maxD, wealth = Math.max(0.15, Math.min(0.95, 0.2 + dist * 0.5 + R() * 0.25)); if (arch === 'seat') wealth = Math.max(0.72, wealth); if (arch === 'trading') wealth = Math.max(0.5, wealth);
      st.arch = arch; st.wealth = wealth; st.isle = i; st.seed = Math.floor(R() * 1e9); st.name = nameFor(R, arch, st.shore, used);
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
  // the ground paints (as the game's brush paints them, approximately)
  var PC = { 1: 'rgba(150,138,118,0.85)', 2: 'rgba(126,98,62,0.85)', 3: 'rgba(92,128,70,0.85)' };
  V.paints.forEach(function (p) { c.fillStyle = PC[p.kind]; c.beginPath(); c.ellipse(p.x, p.y * K, p.r, p.r * K, 0, 0, 7); c.fill(); });
  for (k in V.floors) { q = k.split(','); x = +q[0]; y = +q[1]; if (env.tile) env.tile(c, x, y, x * T, y * TS, T + 0.4, TS + 0.4); else { c.fillStyle = V.floors[k] === 1 ? '#8a6e4c' : '#9a7c5c'; c.fillRect(x * T, y * TS, T, TS); } }
  var B = { floors: V.floors, H: V.H, V: V.V, posts: {}, stairs: {}, roofs: {}, items: [] }, ri = Build.rooms(B, 400, 400, { x0: V.tx - 2, y0: V.ty - 2, x1: V.tx + V.w + 2, y1: V.ty + V.h + 2 });
  V.roofs.forEach(function (r) { var i = ri.at(r.tx, r.ty); if (i >= 0) B.roofs[ri.rooms[i].id] = r.m; });
  var items = [];
  for (k in V.H) { q = k.split(','); (function (x, y, e) { items.push({ y: y * T, f: function () { Build.drawH(c, x, y, e, false, false, Build.cfg({})); } }); })(+q[0], +q[1], V.H[k]); }
  for (k in V.V) { q = k.split(','); (function (x, y, e) { items.push({ y: (y + 1) * T - 1, f: function () { Build.drawV(c, x, y, e, false, V.V[key(x, y + 1)] || false, Build.cfg({})); } }); })(+q[0], +q[1], V.V[k]); }
  ri.rooms.forEach(function (r) { if (B.roofs[r.id] == null) return; items.push({ y: (r.maxY + 1) * T + 1, f: function () { Build.drawRoof(c, r, 1, Build.cfg({ roof: B.roofs[r.id] }), 0); } }); });
  V.items.concat(V.props).forEach(function (it) { if (!kit.PROPS[it.name]) return; items.push({ y: it.y, f: function () { var sp = kit.bakeProp(it.name, 3), s = SIZE_OF(kit, it.name); c.drawImage(sp.cv, it.x + sp.l * s, it.y * K + sp.t * s, sp.w * s, sp.h * s); } }); });
  (V.nature || []).forEach(function (it) { if (!kit.PROPS[it.name]) return; items.push({ y: it.y, f: function () { var sp = kit.bakeProp(it.name, it.v || 0), s = it.s; c.drawImage(sp.cv, it.x + sp.l * s, it.y * K + sp.t * s, sp.w * s, sp.h * s); } }); });
  if (env.lib) V.folk.forEach(function (f, fi) {                   // the people out of doors: some at the fire, some at their jobs, the rest idling each their own way
    if (!f.out) return; var lib = env.lib, sitSpot = f.spots.filter(function (q) { return q[2] === 'sit'; })[0], jobSpot = f.spots.filter(function (q) { return q[2] && q[2] !== 'sit' && q[2] !== 'door'; })[0];
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
var SIZES = { windowBox: 1, lantern: 1, awning: 1, sign: 1, woodshed: 1, foodTable: 1, firePit: 1, logSeat: 1, stake: 1, banner: 1, choppingBlock: 1, woodenWell: 0.75, cart: 0.8, dryingRack: 0.8, shieldRack: 0.75, beeSkeps: 0.8, haystack: 0.8, table: 0.75, bed: 0.8, workbench: 0.9, chest: 0.9, crate: 0.9, barrel: 0.9, bench: 0.85, chair: 0.85, hearth: 0.9, campfire: 0.9, furnace: 0.9, trough: 0.9, scarecrow: 0.9, runestone: 0.75, cairn: 0.9, woodpile: 0.9, stoneHearth: 0.9, cellarDoor: 1, dragonPost: 0.8 };
function SIZE_OF(kit, name) { return SIZES[name] || 1; }
return { DEF: DEF, ARCH: ARCH, BUILD: BUILD, NAMES: NAMES, ROLES: ROLES, cfg: cfg, make: make, siteFor: siteFor, plan: plan, nameFor: nameFor, jettyFor: jettyFor, draw: draw, rng: rngOf, SIZES: SIZES };
})();
if (typeof module !== 'undefined') module.exports = Village;
