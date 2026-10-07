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
  palisadeAt: 0.7, drystoneAt: 0.5, railAt: 0.2,      // the fence by wealth: rail (poor), wattle, dry stone, palisade
  fields: 1, fieldStrips: 3, sacred: 1, midden: 1, graves: 1,
  chestLoot: 1, cellarAt: 0.3, storeLoot: 1,           // finds: a chest in every house, a cellar in one house at this wealth and above
  yardEarth: 1, pathGravel: 1, pathEarth: 1, mossEdge: 1,
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
  var V = { seed: seed, arch: archId, wealth: wealth, shore: shore, tx: site.tx, ty: site.ty, w: site.w, h: site.h, lots: [], floors: {}, H: {}, V: {}, roofs: [], items: [], paints: [], props: [], folk: [], finds: [], fence: null, ruin: !!A.ruin };
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
  function size(id) { var b = BUILD[id]; return { w: pickRange(R, b.w, G.sizeJitter * (b.w[1] > b.w[0] ? 1 : 0)), h: pickRange(R, b.h, 0) }; }
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
    if (id === 'store') lot2 = { x: L0.x + L0.w + G.gap + Math.floor(R() * 2), y: L0.y - 1 + Math.floor(R() * 2), door: 's' };
    else if (id === 'byre') { var hh = V.lots.filter(function (l) { return l.id === 'house'; }), nb = hh.length ? hh[Math.floor(R() * hh.length)] : L0; lot2 = { x: nb.x + (nb.slot === 'w' || nb.slot === 'sw' || nb.slot === 'nw' ? -os.w - G.gap : nb.w + G.gap), y: nb.y, door: 's' }; }
    else if (id === 'smithy') lot2 = { x: R() < 0.5 ? tx + 1 : tx + w - os.w - 1, y: ty + h - os.h - 2, door: 's' };
    else if (id === 'pit') lot2 = { x: tx + 1 + Math.floor(R() * 2), y: yy + Math.floor(R() * yh), door: 'e' };
    else if (id === 'bath') lot2 = shore === 'e' ? { x: tx + w - os.w - 1, y: yy + yh + 1, door: 'w' } : { x: tx + w - os.w - 2, y: ty + 1, door: 's' };
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
    var n = 0;
    for (x = l.x; x < l.x + l.w; x++) { if (!gapAt[n++] && !(b.open && l.door === 's' && false)) H(x, l.y, l.door === 'n' && x === dx ? 'door' : 'wall', m); }
    for (x = l.x; x < l.x + l.w; x++) { var south = l.door === 's' && x === dx ? 'door' : (x === l.x + l.w - 1 && l.w > 2 && R() < 0.6 ? 'window' : 'wall'); if (b.open && l.door === 's') south = x === dx ? 'door' : (x === l.x || x === l.x + l.w - 1 ? 'wall' : 'door'); if (!gapAt[n++]) H(x, l.y + l.h, south, m); }
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
    var dp = l.door === 's' ? tile(l.dx, l.y + l.h) : l.door === 'e' ? tile(l.x + l.w, l.dy) : l.door === 'w' ? tile(l.x - 1, l.dy) : tile(l.dx, l.y - 1), pool = ['woodpile', 'barrel', 'bench', 'beeSkeps', 'cart', 'dryingRack', 'crate'];
    if (R() < 0.75) { var by = pool[Math.floor(R() * pool.length)], off = l.door === 's' ? [T * 1.3 * (R() < 0.5 ? 1 : -1), 8] : l.door === 'e' ? [10, T * 1.1] : l.door === 'w' ? [-10, T * 1.1] : [T * 1.3, -8]; V.props.push({ name: by, x: dp[0] + off[0], y: dp[1] + off[1], loot: by === 'barrel' || by === 'crate' ? { berries: 2, fiber: 2 } : null }); }
  }
  V.lots.forEach(pieces);
  // the well in the yard (a fire pit for the poor), the finds, the fence and gate, the fields, the sacred, the midden
  var wc = tile(yx + Math.floor(yw / 2), yy + Math.floor(yh / 2));
  if (wealth > 0.3) item('woodenWell', wc[0], wc[1] + 4); else item('campfire', wc[0], wc[1] + 4, { hearth: true, light: 1 });
  var homes = V.lots.filter(function (l) { return l.id === big || l.id === 'house'; });
  if (wealth >= G.cellarAt && homes.length) { var cl = homes[Math.floor(R() * homes.length)], cp = tile(cl.x + Math.floor(cl.w / 2), cl.y + cl.h - 1); item('cellarDoor', cp[0], cp[1] - 2, { cellar: true, store: true, loot: { coin: 6 + Math.floor(wealth * 10), leather: 3, copper: 2 }, lore: 'Someone kept this well hidden.' }); V.finds.push({ kind: 'cellar', x: cp[0], y: cp[1] }); }
  var ex0 = 1e9, ey0 = 1e9, ex1 = -1e9, ey1 = -1e9; V.lots.forEach(function (l) { ex0 = Math.min(ex0, l.x); ey0 = Math.min(ey0, l.y); ex1 = Math.max(ex1, l.x + l.w); ey1 = Math.max(ey1, l.y + l.h); });
  ex0 = Math.max(tx, ex0 - G.fenceGap); ey0 = Math.max(ty, ey0 - G.fenceGap); ex1 = Math.min(tx + w, ex1 + G.fenceGap); ey1 = Math.min(ty + h, ey1 + G.fenceGap);
  var gateX = yx + Math.floor(yw / 2), fk = fenceKind, fm = fk === 'drystone' ? 3 : (fk === 'palisade' ? 0 : 2), x, y;
  for (x = ex0; x < ex1; x++) { if (!(V.ruin && R() < 0.4)) H(x, ey0, fk, fm); if (x === gateX) H(x, ey1, 'gate', 2); else if (!(V.ruin && R() < 0.4) && !(shore === 's')) H(x, ey1, fk, fm); }
  for (y = ey0; y < ey1; y++) { if (!(V.ruin && R() < 0.4) && shore !== 'w') Vw(ex0, y, fk, fm); if (!(V.ruin && R() < 0.4) && shore !== 'e') Vw(ex1, y, fk, fm); }
  V.fence = { x0: ex0, y0: ey0, x1: ex1, y1: ey1, kind: fk, gate: gateX };
  // the ground: the yard trodden to earth, gravel from the gate to the well and to the shore, earth from every door, moss at the back
  function dab(x, y, r, kind) { V.paints.push({ x: x, y: y, r: r, kind: kind }); }
  function strokeTo(a, b, r, kind) { var n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / (r * 0.6))), i; for (i = 0; i <= n; i++) { var u = i / n; dab(a[0] + (b[0] - a[0]) * u + (R() - 0.5) * 6, a[1] + (b[1] - a[1]) * u + (R() - 0.5) * 6, r * (0.85 + R() * 0.3), kind); } }
  if (G.yardEarth) { for (var yi = 0; yi < 7; yi++) dab(wc[0] + (R() - 0.5) * yw * T * 0.7, wc[1] + (R() - 0.5) * yh * T * 0.7, 18 + R() * 14, 2); }
  var gate = tile(gateX, ey1); if (G.pathGravel) strokeTo([gate[0], gate[1] + 24], wc, 12, 1);
  if (shore && G.pathGravel) { var sh = shore === 's' ? [wc[0], (ty + h) * T] : shore === 'n' ? [wc[0], ty * T] : shore === 'e' ? [(tx + w) * T, wc[1]] : [tx * T, wc[1]]; strokeTo(wc, sh, 11, 1); }
  if (G.pathEarth) V.lots.forEach(function (l) { var d = l.door === 's' ? tile(l.dx, l.y + l.h) : l.door === 'e' ? tile(l.x + l.w, l.dy) : l.door === 'w' ? tile(l.x - 1, l.dy) : tile(l.dx, l.y - 1); strokeTo(d, wc, 9, 2); });
  if (G.mossEdge) { dab(ex0 * T + 10, ey0 * T + 10, 20, 3); dab(ex1 * T - 10, ey0 * T + 16, 16, 3); dab(ex0 * T + 14, ey1 * T - 12, 14, 3); }
  // the fields outside the fence, the sacred stone at a corner, the midden behind, a grave beyond
  if (G.fields && A.houses[1] > 0 && !V.ruin) { var fx = shore === 'e' ? ex0 - 6 : ex1 + 2, fy0 = ey0 + 1, strips = G.fieldStrips; if (fx > tx && fx + 4 < tx + w) for (var s2 = 0; s2 < strips; s2++) { var sy = fy0 + s2 * 3; if (sy + 2 > ty + h) break; strokeTo([(fx + 0.5) * T, (sy + 1) * T], [(fx + 3.5) * T, (sy + 1) * T], 10, 2); if (s2 === 1) V.props.push({ name: 'scarecrow', x: (fx + 2) * T, y: (sy + 0.3) * T }); } V.props.push({ name: 'haystack', x: (fx + 2) * T, y: (fy0 + strips * 3 + 0.5) * T }); }
  if (G.sacred) { var sc = tile(ex0 - 1 >= tx ? ex0 - 1 : ex1 + 1, ey0); V.props.push({ name: 'runestone', x: sc[0], y: sc[1], lore: 'Raised by the folk of this place for one who did not come home.' }); V.finds.push({ kind: 'stone', x: sc[0], y: sc[1] }); }
  if (G.midden) { var mp = tile(ex1 - 1, ey0 - 1 >= ty ? ey0 - 1 : ey0); dab(mp[0], mp[1], 14, 1); V.props.push({ name: 'crate', x: mp[0], y: mp[1], loot: { fiber: 2 } }); }
  if (G.graves && R() < 0.6) { var gp = tile(ex1 + 1 < tx + w ? ex1 + 1 : ex0 - 1, ey1 - 1); V.props.push({ name: 'cairn', x: gp[0], y: gp[1], grave: true }); V.finds.push({ kind: 'grave', x: gp[0], y: gp[1] }); }
  // the people: a household per home, with their spots (their door, the well, the yard, a workplace) and lines by role
  var nPeople = V.ruin ? 0 : pickRange(R, A.people, 0), hi = 0, roles = ['farmer', 'fisher', 'smith', 'weaver', 'elder', 'child', 'thrall'];
  for (var pi = 0; pi < nPeople && homes.length; pi++) {
    var home = homes[hi % homes.length]; hi++;
    var door = home.door === 's' ? tile(home.dx, home.y + home.h + 1) : home.door === 'e' ? tile(home.x + home.w + 1, home.dy) : home.door === 'w' ? tile(home.x - 2, home.dy) : tile(home.dx, home.y - 2);
    var role = shore && R() < 0.4 ? 'fisher' : roles[Math.floor(R() * roles.length)]; if (role === 'smith' && !V.lots.some(function (l) { return l.id === 'smithy'; })) role = 'farmer';
    var work = role === 'smith' ? V.lots.filter(function (l) { return l.id === 'smithy'; })[0] : role === 'fisher' && shore ? null : V.lots.filter(function (l) { return l.id === 'byre' || l.id === 'store'; })[0];
    var spots = [door, [wc[0] + (R() - 0.5) * 30, wc[1] + 20 + (R() - 0.5) * 20], [wc[0] + (R() - 0.5) * yw * T * 0.6, wc[1] + (R() - 0.5) * yh * T * 0.6]];
    if (work) spots.push(tile(work.dx >= 0 ? work.dx : work.x, work.y + work.h + 1)); else if (role === 'fisher') spots.push(shore === 's' ? [wc[0], (ty + h - 1) * T] : shore === 'n' ? [wc[0], (ty + 1) * T] : shore === 'e' ? [(tx + w - 1) * T, wc[1]] : [(tx + 1) * T, wc[1]]);
    V.folk.push({ name: NAMES[Math.floor(R() * NAMES.length)], role: role, home: [home.x, home.y], x: door[0], y: door[1], spots: spots, lines: ROLES[role], female: R() < 0.5, out: R() < G.outsideShare });
  }
  return V;
}
// a page's site for an archetype: the tiles it needs
function siteFor(archId) { var A = ARCH[archId] || ARCH.small; return { w: A.site[0], h: A.site[1] }; }
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
  if (env.lib) V.folk.forEach(function (f) { if (!f.out) return; items.push({ y: f.y, f: function () { var F = env.lib.makeFigure(env.lib.folkSpec('villager', rngOf(f.name.length * 7 + f.x))); env.lib.figureD(c, f.x, f.y * K, 'down', { phase: 0, amt: 0, t: clock || 0, lx: 0, ly: 0, blink: 0, sq: 0 }, null, F); } }); });
  items.sort(function (a, b) { return a.y - b.y; }).forEach(function (it) { it.f(); });
}
var SIZES = { woodenWell: 0.75, cart: 0.8, dryingRack: 0.8, shieldRack: 0.75, beeSkeps: 0.8, haystack: 0.8, table: 0.75, bed: 0.8, workbench: 0.9, chest: 0.9, crate: 0.9, barrel: 0.9, bench: 0.85, chair: 0.85, hearth: 0.9, campfire: 0.9, furnace: 0.9, trough: 0.9, scarecrow: 0.9, runestone: 0.75, cairn: 0.9, woodpile: 0.9, stoneHearth: 0.9, cellarDoor: 1, dragonPost: 0.8 };
function SIZE_OF(kit, name) { return SIZES[name] || 1; }
return { DEF: DEF, ARCH: ARCH, BUILD: BUILD, NAMES: NAMES, ROLES: ROLES, cfg: cfg, make: make, siteFor: siteFor, draw: draw, rng: rngOf, SIZES: SIZES };
})();
if (typeof module !== 'undefined') module.exports = Village;
