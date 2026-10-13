/* Ruin: breaking in, bringing down, burning and mending what is built (2026-10-13; Robin: you should be able to destroy
   houses and villages and to break in; balanced, so that a stone wall is not felled by an axe; semi-realistic; usable as
   tactics; not exploitable; it must not glitch the people; it leaves a trashed, broken place; and what you have claimed you
   can build up again). The rules only: no drawing (src/build.js draws a damaged wall, a breach, a fallen or burnt roof) and
   no page (the game offers the edges to the tools, makes the noise, moves the people). Loads in the page and in Node.

   A building is the game's B: edges B.H and B.V keyed "x,y", each { t, m } (src/build.js). What this module adds to it:
     on an edge   dmg     the damage it has taken so far
                  breach  1: it has given. A breach is a way through, and still the room's wall as far as the roof goes
                  burnt   1: it was fire that took it (it is drawn charred)
                  scorch  1: stone that a fire has blackened
     B.ruin       { "x,y": { k: 'fallen' | 'burnt', m: the roof it had, hot: seconds it still glows } } for every tile of a
                  room whose roof has come down
     B.fire       { "H:x,y" | "V:x,y": { t }, "R:<room id>": { t, at: [tx, ty] } }: what burns now

   WHAT BREAKS WHAT (DEF.hp, DEF.bite). A piece takes its hp in the damage of blows; a tool's blow is its own power (an iron
   axe or pick 2.6, about two blows a second) times what that tool does to that material:
     the axe   wood: wattle, a window's shutter, a door, planks, the panels of a timber frame, logs, a palisade, fences;
               a little to turf; nothing to stone (it rings off)
     the pick  loose stone (a rubble wall, a dry-stone wall) and turf; poorly on wood
     nothing in the hand breaks dressed stone in mortar: a cut-stone wall or a town's wall is gone round, or its door is the
     way in. (A ram for gates is not built.)
   THE ROOF. A room keeps its roof while its walls stand. When the share of its wall edges that have given passes
   DEF.collapse it comes down on whatever is inside (a timber frame's panels count half: the frame still carries).
   FIRE (DEF.fire). Thatch catches at once and goes in half a minute; shingles slower; turf hardly; tiles and slate not at
   all. Wood walls burn through to a breach, stone stands and is blackened. A burning roof lights the walls under it and
   throws sparks downwind onto other roofs that can burn.
   MENDING (DEF.mend) costs a share of the piece's own price; the game allows it only in a place you hold. */
var Ruin = (function () {
'use strict';
var TEX = ['logs', 'planks', 'wattle', 'blocks', 'turf', 'frame', 'ashlar'];          // Build.WALLS, in its order
var ROOFN = ['turf', 'thatch', 'shingles', 'tiles', 'slate', 'none'];                 // Build.ROOFS, in its order
var YARDS = { fence: 1, gate: 1, palisade: 1, rail: 1, drystone: 1, townwall: 1 };
var DEF = {
  on: 1,
  // how much a piece takes before it gives (0: no hand tool breaks it)
  hp: { fence: 8, rail: 7, wattle: 18, window: 10, door: 14, archDoor: 26, gate: 28, planks: 48, frame: 36, logs: 110, palisade: 90, stake: 30, turf: 56, drystone: 40, blocks: 130, ashlar: 0, townwall: 0 },   // (stake: one sharpened log of a village's round wall; three stand to a tile)
  // what a tool's blow does to a material, as a share of its power
  bite: {
    axe: { fence: 1, rail: 1, wattle: 1, window: 1, door: 1, archDoor: 1, gate: 1, planks: 1, frame: 1, logs: 1, palisade: 1, turf: 0.3, drystone: 0.1, blocks: 0, ashlar: 0, townwall: 0 },
    pick: { fence: 0.5, rail: 0.5, wattle: 0.5, window: 0.5, door: 0.35, archDoor: 0.35, gate: 0.35, planks: 0.35, frame: 0.5, logs: 0.25, palisade: 0.25, turf: 1, drystone: 1, blocks: 1, ashlar: 0, townwall: 0 },
    knife: { fence: 0.3, wattle: 0.3 }
  },
  // how far a blow on it is heard, in the world's units (a town's men within that distance hear it)
  noise: { fence: 110, rail: 110, wattle: 150, window: 170, turf: 130, frame: 260, planks: 280, door: 360, gate: 320, logs: 320, palisade: 320, drystone: 300, archDoor: 480, blocks: 430, ashlar: 430, townwall: 430 },
  noiseK: 1,                     // every noise above, times this
  collapse: 0.34,                // the share of a room's wall edges that must have given before its roof comes down
  frameCounts: 0.5,              // a timber frame's broken panel counts this much toward it (the frame still carries)
  fallHurt: 24, fallHurtMen: 16, // what the roof does to the hero and to a man who is under it
  warn: 1.6,                     // seconds between the groan and the fall
  // what falls out of a piece that gives: far less than it cost to build (it is no way to gather)
  drop: { fence: {}, rail: {}, wattle: {}, window: {}, door: { wood: 1 }, archDoor: { wood: 1 }, gate: { wood: 1 }, planks: { wood: 1 }, frame: { wood: 1 }, logs: { wood: 1 }, palisade: { wood: 1 }, turf: {}, drystone: { stone: 1 }, blocks: { stone: 1 } },
  mend: 0.5,                     // mending costs this share of the piece's own price (a roof: of its price a tile)
  fire: {
    on: 1,
    catchT: 1.2,                 // seconds a torch must be held to it
    // seconds a burning wall edge lasts before it has burnt through (0: it does not burn)
    wall: { fence: 8, rail: 9, wattle: 12, window: 14, door: 18, archDoor: 26, gate: 16, planks: 25, frame: 30, logs: 60, palisade: 50, turf: 0, drystone: 0, blocks: 0, ashlar: 0, townwall: 0 },
    // a roof: catch (how readily, 0..1: 0 never), spread (seconds a tile), burn (seconds from catching to the fall)
    roof: { thatch: { catch: 1, spread: 1.5, burn: 26 }, shingles: { catch: 0.5, spread: 4, burn: 40 }, turf: { catch: 0.12, spread: 9, burn: 70 }, tiles: { catch: 0, spread: 0, burn: 0 }, slate: { catch: 0, spread: 0, burn: 0 }, none: { catch: 0, spread: 0, burn: 0 } },
    wallK: 1,                    // every wall's time above, times this
    step: 2.5,                   // every so many seconds a burning piece tries its neighbours
    along: 0.55,                 // the chance, each try, that a burning wall lights the wall beside it
    toRoof: 6, toWalls: 9,       // seconds until a burning wall has lit the roof over it, and a burning roof its first wall
    jump: 90, wind: 1.7,         // how far sparks carry to another roof, and how many times further downwind (upwind 0.4 of it)
    spark: 0.1,                  // the chance a second that a burning roof lights a roof right beside it (times that roof's catch; less with distance, nothing at the reach's edge)
    heat: 9,                     // health a second lost by whoever stands in a burning room
    hot: 70,                     // seconds the ashes glow and smoke after
    loud: 220, louder: 55, loudMax: 1000   // how far a fire is noticed: this, and this much more for every piece alight
  }
};
function cfg(over) {             // DEF with a page's stored numbers laid over it (one level deep, two for hp, bite, fire)
  var o = JSON.parse(JSON.stringify(DEF)), k, j, i;
  for (k in over || {}) {
    if (over[k] && typeof over[k] === 'object' && o[k] && typeof o[k] === 'object') { for (j in over[k]) { if (over[k][j] && typeof over[k][j] === 'object' && o[k][j] && typeof o[k][j] === 'object') { for (i in over[k][j]) o[k][j][i] = over[k][j][i]; } else o[k][j] = over[k][j]; } }
    else o[k] = over[k];
  }
  return o;
}
function isYard(e) { return !!YARDS[e.t]; }
// what an edge is made of, as far as breaking and burning go
function matOf(e) {
  if (YARDS[e.t]) return e.t;
  var tex = TEX[e.m] || 'planks';
  if (e.t === 'door') return tex === 'ashlar' ? 'archDoor' : 'door';
  if (e.t === 'window') return tex === 'ashlar' || tex === 'blocks' ? tex : 'window';   // in stone a window is a small hole in the stone; in wood, wattle or turf it is the shutter and its frame
  return tex;
}
function hpOf(R, e) { return R.hp[matOf(e)] || 0; }
function rightTool(e) { var m = matOf(e); return m === 'blocks' || m === 'ashlar' || m === 'townwall' || m === 'drystone' || m === 'turf' ? 'stone' : 'tree'; }   // the engine's two kinds: the pick's and the axe's
// can anything be done to it by blows: a wall, a window and a yard piece always; a door or a gate only while it is locked and whole (an open one is walked through)
function standing(e) { return !!e && !e.breach && ((e.t !== 'door' && e.t !== 'gate') || (!!e.locked && !e.broken)); }
function passable(e) { return !e || !!e.breach || ((e.t === 'door' || e.t === 'gate') && (!e.locked || !!e.broken)); }
function stageOf(R, e) { var hp = hpOf(R, e); return e.breach ? 3 : !hp || !e.dmg ? 0 : e.dmg >= hp * 0.6 ? 2 : e.dmg >= hp * 0.25 ? 1 : 0; }   // 0 whole, 1 hacked, 2 nearly through, 3 given
/* A blow. power is the tool's own (Items.stats(tool).power, times whatever the engine multiplies a heavy blow by); tool is
   'axe' | 'pick' | 'knife'. Answers { dealt, mat, k (how far gone it now is, 0..1), gave, noise, none (this tool does nothing
   to it), never (no hand tool does) }, or null when there is nothing there to strike. */
function hit(R, e, power, tool) {
  if (!R.on || !standing(e)) return null;
  var mat = matOf(e), hp = R.hp[mat] || 0, bite = (R.bite[tool] && R.bite[tool][mat]) || 0, out = { mat: mat, dealt: 0, k: 0, gave: false, noise: (R.noise[mat] || 200) * (R.noiseK == null ? 1 : R.noiseK), none: false, never: !hp };
  if (!hp || !bite) { out.none = true; out.k = hp ? Math.min(1, (e.dmg || 0) / hp) : 0; out.noise *= 0.6; return out; }
  out.dealt = power * bite; e.dmg = (e.dmg || 0) + out.dealt; out.k = Math.min(1, e.dmg / hp);
  if (e.dmg >= hp) { give(e); out.gave = true; }
  e.st = e.dmg >= hp * 0.6 ? 2 : e.dmg >= hp * 0.25 ? 1 : 0;                       // how it is drawn: hacked, nearly through
  return out;
}
function give(e, burnt) {          // it gives: a door stands open for good, anything else is a breach
  if (e.t === 'door' || e.t === 'gate') { e.locked = 0; e.broken = 1; if (burnt) { e.breach = 1; e.burnt = 1; } }
  else { e.breach = 1; if (burnt) e.burnt = 1; }
}
// the wall edges round a room (each once): [{ L, k, e }]. An edge with no piece on it is left out.
function edgesOf(B, room) {
  var has = {}, out = [], seen = {}, i, t;
  for (i = 0; i < room.tiles.length; i++) has[room.tiles[i][0] + ',' + room.tiles[i][1]] = 1;
  function add(L, x, y) { var k = x + ',' + y, id = L + k, e = (L === 'H' ? B.H : B.V)[k]; if (e && !seen[id]) { seen[id] = 1; out.push({ L: L, k: k, e: e, x: x, y: y }); } }
  for (i = 0; i < room.tiles.length; i++) {
    t = room.tiles[i];
    if (!has[t[0] + ',' + (t[1] - 1)]) add('H', t[0], t[1]); if (!has[t[0] + ',' + (t[1] + 1)]) add('H', t[0], t[1] + 1);
    if (!has[(t[0] - 1) + ',' + t[1]]) add('V', t[0], t[1]); if (!has[(t[0] + 1) + ',' + t[1]]) add('V', t[0] + 1, t[1]);
  }
  return out;
}
// how far gone a room's walls are: { n (its wall edges), broken (those that have given, a frame's panel counting less), share }
function strain(R, B, room) {
  var E = edgesOf(B, room), n = 0, br = 0, i, e;
  for (i = 0; i < E.length; i++) { e = E[i].e; if (isYard(e)) continue; n++; if (e.breach && e.t !== 'door') br += matOf(e) === 'frame' && !e.burnt ? R.frameCounts : 1; }
  return { n: n, broken: br, share: n ? br / n : 0 };
}
function ruined(B, room) { var t = room.tiles[0]; return !!(B.ruin && B.ruin[t[0] + ',' + t[1]]); }
function roofOf(B, room, dflt) { return B.roofs && B.roofs[room.id] != null ? B.roofs[room.id] : (dflt == null ? 1 : dflt); }
// the roof comes down: every tile of the room is marked, and the room has no roof until it is raised again
function collapse(R, B, room, kind, dflt) {
  if (ruined(B, room)) return false; var m = roofOf(B, room, dflt), i, t;
  if (!B.ruin) B.ruin = {}; if (!B.roofs) B.roofs = {};
  for (i = 0; i < room.tiles.length; i++) { t = room.tiles[i]; B.ruin[t[0] + ',' + t[1]] = { k: kind || 'fallen', m: m, hot: kind === 'burnt' ? R.fire.hot : 0 }; }
  B.roofs[room.id] = 5; if (B.fire) delete B.fire['R:' + room.id];
  return true;
}
// should it come down now (its walls too far gone, and it still has a roof to lose)
function due(R, B, room, dflt) { return !room.up && !ruined(B, room) && roofOf(B, room, dflt) !== 5 && strain(R, B, room).share >= R.collapse; }   // (room.up: a room with stairs has a floor above and no roof)
// mending: an edge whole again; a room's roof raised again (its walls must stand first)
function damaged(e) { return !!e && (!!e.breach || !!e.broken || !!e.burnt || !!e.scorch || (e.dmg || 0) > 0); }
function mendShare(R, e) { var hp = hpOf(R, e); return e.breach || e.broken ? 1 : hp ? Math.min(1, (e.dmg || 0) / hp) : e.scorch ? 0.2 : 0; }   // how much of its price the mending is: all of it for a breach, less for a hacked wall
function mend(e) { delete e.dmg; delete e.st; delete e.breach; delete e.burnt; delete e.scorch; delete e.broken; }
function canRaise(R, B, room) { return ruined(B, room) && strain(R, B, room).broken === 0; }
function raise(B, room) {
  var t0 = room.tiles[0], ru = B.ruin && B.ruin[t0[0] + ',' + t0[1]], i, t; if (!ru) return false;
  B.roofs[room.id] = ru.m; for (i = 0; i < room.tiles.length; i++) { t = room.tiles[i]; delete B.ruin[t[0] + ',' + t[1]]; }
  return true;
}
// how much of a set of rooms and edges is gone, for a place's state: { edges, broken, rooms, down }
function tally(R, B, rooms) {
  var o = { edges: 0, broken: 0, rooms: rooms.length, down: 0 }, i;
  for (i = 0; i < rooms.length; i++) { var s = strain(R, B, rooms[i]); o.edges += s.n; o.broken += s.broken; if (ruined(B, rooms[i])) o.down++; }
  return o;
}

/* ---------- fire ---------- */
function burnsWall(R, e) { return !!e && !e.breach && !e.burnt && (R.fire.wall[matOf(e)] || 0) > 0; }
function roofSpec(R, B, room, dflt) { return R.fire.roof[ROOFN[roofOf(B, room, dflt)] || 'none'] || R.fire.roof.none; }
function burnsRoof(R, B, room, dflt) { return !room.up && !ruined(B, room) && roofSpec(R, B, room, dflt).burn > 0; }
function alight(B) { var n = 0, k; for (k in B.fire || {}) n++; return n; }
function onFire(B, L, k) { return !!(B.fire && B.fire[L + ':' + k]); }
// put fire to an edge ('H' | 'V', its key) or to a room's roof ('R', the room): true if it took
function ignite(R, B, L, k, room, at, dflt) {
  if (!R.on || !R.fire.on) return false; if (!B.fire) B.fire = {};
  if (L === 'R') { if (!room || !burnsRoof(R, B, room, dflt) || B.fire['R:' + room.id]) return false; B.fire['R:' + room.id] = { t: 0, at: at || room.tiles[0], s: 0 }; return true; }
  var e = (L === 'H' ? B.H : B.V)[k]; if (!burnsWall(R, e) || B.fire[L + ':' + k]) return false;
  B.fire[L + ':' + k] = { t: 0, s: 0 }; return true;
}
function cornerMates(L, x, y) {      // the edges that meet this one at its two ends
  return L === 'H' ? [['H', x - 1, y], ['H', x + 1, y], ['V', x, y - 1], ['V', x, y], ['V', x + 1, y - 1], ['V', x + 1, y]]
    : [['V', x, y - 1], ['V', x, y + 1], ['H', x - 1, y], ['H', x, y], ['H', x - 1, y + 1], ['H', x, y + 1]];
}
/* The fire's own step. env = { rooms: [{ id, tiles }], at(tx, ty): the room's index or -1, wind: { a, k } or null,
   rand(), roofDefault }. Answers what happened: { lit: [[L, k] or ['R', room]], gave: [{ L, k, e }], fell: [room], n }. */
function fireTick(R, B, dt, env) {
  var ev = { lit: [], gave: [], fell: [], n: 0 }, F = B.fire, key, f, p, L, x, y, e, i, rnd = env.rand || Math.random, FR = R.fire, dflt = env.roofDefault;
  if (!F) return ev;
  function roomsBy(L2, x2, y2) { var a = env.at(L2 === 'H' ? x2 : x2 - 1, L2 === 'H' ? y2 - 1 : y2), b = env.at(x2, y2), o = []; if (a >= 0) o.push(env.rooms[a]); if (b >= 0 && b !== a) o.push(env.rooms[b]); return o; }
  for (key in F) {
    f = F[key]; f.t += dt; f.s += dt; ev.n++;
    if (key.charAt(0) === 'R') {
      var room = null; for (i = 0; i < env.rooms.length; i++) if (env.rooms[i].id === key.slice(2)) { room = env.rooms[i]; break; }
      if (!room || ruined(B, room)) { delete F[key]; continue; }
      var rs = roofSpec(R, B, room, dflt);
      edgesOf(B, room).forEach(function (q) { if (!burnsWall(R, q.e) && !q.e.breach && !isYard(q.e)) q.e.scorch = 1; });      // the stone under a burning roof is blackened
      if (f.need == null) { var far = 0; room.tiles.forEach(function (tl) { var dd = Math.abs(tl[0] - f.at[0]) + Math.abs(tl[1] - f.at[1]); if (dd > far) far = dd; }); f.need = Math.max(rs.burn, far * rs.spread + 6); }   // a big roof does not fall before the flames have crossed it (2026-10-13: a hall's roof was down with its far end not yet alight)
      if (f.t >= f.need) { collapse(R, B, room, 'burnt', dflt); ev.fell.push(room); continue; }
      if (f.s >= FR.step) {
        f.s = 0;
        if (f.t >= FR.toWalls) { var W = edgesOf(B, room).filter(function (q) { return burnsWall(R, q.e) && !F[q.L + ':' + q.k]; }); if (W.length) { var q0 = W[Math.floor(rnd() * W.length)]; F[q0.L + ':' + q0.k] = { t: 0, s: 0 }; ev.lit.push([q0.L, q0.k]); } }
        // sparks: onto another roof within reach, further downwind
        var c0 = centre(room);
        for (i = 0; i < env.rooms.length; i++) {
          var o = env.rooms[i]; if (o === room || F['R:' + o.id] || !burnsRoof(R, B, o, dflt)) continue;
          var c1 = centre(o), dx = c1[0] - c0[0], dy = c1[1] - c0[1], d = Math.hypot(dx, dy), reach = FR.jump;
          if (env.wind && env.wind.k > 0) { var al = Math.cos(Math.atan2(dy, dx) - env.wind.a); reach *= al > 0 ? 1 + (FR.wind - 1) * al * Math.min(1, env.wind.k * 2) : 1 + 0.6 * al; }
          d -= (Math.sqrt(room.tiles.length) + Math.sqrt(o.tiles.length)) * 16;                                           // from eaves to eaves, near enough
          if (d < reach && rnd() < FR.spark * FR.step * roofSpec(R, B, o, dflt).catch * (1 - Math.max(0, d) / reach)) { /* the nearer, the likelier: a roof at the very edge of the sparks' reach all but never catches */ F['R:' + o.id] = { t: 0, s: 0, at: nearestTile(o, c0) }; ev.lit.push(['R', o]); }
        }
      }
      continue;
    }
    L = key.charAt(0); p = key.slice(2).split(','); x = +p[0]; y = +p[1]; e = (L === 'H' ? B.H : B.V)[key.slice(2)];
    if (!e || e.breach) { delete F[key]; continue; }
    if (f.t >= (FR.wall[matOf(e)] || 1) * (FR.wallK == null ? 1 : FR.wallK)) { give(e, true); delete F[key]; ev.gave.push({ L: L, k: key.slice(2), e: e }); continue; }
    if (f.s >= FR.step) {
      f.s = 0;
      cornerMates(L, x, y).forEach(function (m) { var mk = m[1] + ',' + m[2], me = (m[0] === 'H' ? B.H : B.V)[mk]; if (burnsWall(R, me) && !F[m[0] + ':' + mk] && rnd() < FR.along) { F[m[0] + ':' + mk] = { t: 0, s: 0 }; ev.lit.push([m[0], mk]); } });
      if (f.t >= FR.toRoof) roomsBy(L, x, y).forEach(function (rm) { if (burnsRoof(R, B, rm, dflt) && !F['R:' + rm.id] && rnd() < 0.6 * roofSpec(R, B, rm, dflt).catch) { F['R:' + rm.id] = { t: 0, s: 0, at: L === 'H' ? [x, env.at(x, y) >= 0 && env.rooms[env.at(x, y)] === rm ? y : y - 1] : [env.at(x, y) >= 0 && env.rooms[env.at(x, y)] === rm ? x : x - 1, y] }; ev.lit.push(['R', rm]); } });
    }
  }
  for (key in B.ruin || {}) if (B.ruin[key].hot > 0) B.ruin[key].hot = Math.max(0, B.ruin[key].hot - dt);
  return ev;
}
function centre(room) { var sx = 0, sy = 0, i; for (i = 0; i < room.tiles.length; i++) { sx += room.tiles[i][0] + 0.5; sy += room.tiles[i][1] + 0.5; } return [sx / room.tiles.length * 32, sy / room.tiles.length * 32]; }
function nearestTile(room, c) { var b = room.tiles[0], bd = 1e9, i; for (i = 0; i < room.tiles.length; i++) { var d = Math.hypot((room.tiles[i][0] + 0.5) * 32 - c[0], (room.tiles[i][1] + 0.5) * 32 - c[1]); if (d < bd) { bd = d; b = room.tiles[i]; } } return b; }
// how far the flames have run over a burning roof, 0..1 (for the drawing), and whether a given tile of it is alight
function roofFlame(R, B, room, tx, ty, dflt) {
  var f = B.fire && B.fire['R:' + room.id]; if (!f) return 0; var rs = roofSpec(R, B, room, dflt), d = Math.abs(tx - f.at[0]) + Math.abs(ty - f.at[1]), t0 = d * rs.spread;
  return f.t <= t0 ? 0 : Math.min(1, (f.t - t0) / 3);
}
function fireNoise(R, B) { var n = alight(B); return n ? Math.min(R.fire.loudMax, R.fire.loud + R.fire.louder * n) : 0; }
return { DEF: DEF, TEX: TEX, ROOFN: ROOFN, cfg: cfg, matOf: matOf, hpOf: hpOf, rightTool: rightTool, standing: standing, passable: passable, stageOf: stageOf, hit: hit, give: give, edgesOf: edgesOf, strain: strain, ruined: ruined, roofOf: roofOf, collapse: collapse, due: due, damaged: damaged, mendShare: mendShare, mend: mend, canRaise: canRaise, raise: raise, tally: tally,
  burnsWall: burnsWall, burnsRoof: burnsRoof, roofSpec: roofSpec, alight: alight, onFire: onFire, ignite: ignite, fireTick: fireTick, roofFlame: roofFlame, fireNoise: fireNoise, centre: centre, isYard: isYard };
})();
if (typeof module !== 'undefined') module.exports = Ruin;
