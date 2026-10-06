/* The hird: the people who join you, as data. Shared by the game and the Hird Editor.
   DEF holds every number: the ranges each stat is rolled from, the traits and how likely one is, what each job
   yields and how often, how much they eat, how far a claim stone reaches, and the looks and names people are made
   from. roll(R) makes one person from it (stats, traits, a figure spec for lib.makeFigure). Nothing here moves or
   draws; the game does that. Robin's decisions (2026-10-06): a claim stone costs stone and berries (the red for its
   runes); several stones, but every stone after the first needs a hirdman to keep it, so each claim costs a person;
   the hird stays without food but goes slow and sad; they can die, never at random; Brokk is the first; muster at
   the stone now, from the high seat later (anything with `muster` on it); they follow and work only inside your
   territory and on raids, never in the open world. */
var Hird = (function () {
var DEF = {
  stats: { health: [20, 40], strength: [2, 6], aim: [2, 6], wits: [2, 6], oar: [2, 6] },   // [low, high], whole numbers
  traitChance: 0.7, twoTraits: 0.25,
  traits: [
    { id: 'hardy', name: 'Hardy', text: 'Shrugs off the cold and the wet.', health: 8 },
    { id: 'keen', name: 'Keen eyed', text: 'Sees far. Better with a bow.', aim: 2 },
    { id: 'strong', name: 'Strong', text: 'A back for oars and axes.', strength: 2, oar: 1 },
    { id: 'slow', name: 'Slow', text: 'Thinks before doing, and then some.', wits: -1 },
    { id: 'greedy', name: 'Greedy', text: 'Wants a bigger share of every raid.' },
    { id: 'loyal', name: 'Loyal', text: 'Will not run, whatever comes.' },
    { id: 'nightfear', name: 'Fears the dark', text: 'Will not work or fight at night.' },
    { id: 'sworn', name: 'Sworn to another', text: 'Owes an oath elsewhere. Watch them.' }
  ],
  jobs: {                                       // what a workplace makes of a person; `rate` is seconds between yields
    crafter: { name: 'Crafter', place: 'workbench', rate: 120, takes: { wood: 1, fiber: 2 }, gives: { torch: 2 }, text: 'Makes torches from the stores at the bench.' },
    woodcutter: { name: 'Woodcutter', place: 'woodpile', rate: 60, takes: {}, gives: { wood: 1 }, text: 'Brings wood to the stores, a log at a time.' },
    cook: { name: 'Cook', place: 'stoneHearth', rate: 90, takes: { meat: 1, berries: 2 }, gives: { stew: 1 }, text: 'Turns meat and berries in the stores into stew.' },
    keeper: { name: 'Keeper', place: 'claimStone', rate: 0, takes: {}, gives: {}, text: 'Holds a claim stone. Without a keeper a second stone cannot be raised.' }
  },
  mealsPerDay: 1,                               // what each hirdman eats from the stores at dawn
  hungryPace: 0.5,                              // how fast they work with no food in the stores
  territory: 25, perRoom: 1,                    // a claim stone's reach in tiles, and what each roofed room inside adds
  followSpeed: 70, walkSpeed: 40, followGap: 34,
  claimCost: { stone: 6, berries: 4, snakeBlood: 2 },   // snake blood for the red of the runes: a reason to hunt adders
  names: ['Ulf', 'Sigrid', 'Hakon', 'Astrid', 'Leif', 'Thora', 'Gunnar', 'Ingrid', 'Eirik', 'Helga', 'Bjorn', 'Runa', 'Torstein', 'Gudrun', 'Olaf', 'Ragnhild'],
  hair: ['#b4602d', '#e8c070', '#5a3a28', '#c8743a', '#3a2a22', '#d9a35a'],
  coat: ['#6b7d8a', '#7d4a3a', '#5b6b4a', '#8a6a4a', '#4f5f7a', '#9a7a5a'],
  pants: ['#4a4038', '#5a4a3a', '#3f4a5a', '#6a5a48'],
  beardChance: 0.4, scale: [0.92, 1.06], bodyW: [0.9, 1.2]
};
var STAT_NAMES = { health: 'Health', strength: 'Strength', aim: 'Aim', wits: 'Wits', oar: 'At the oar' };
function pick(R, list) { return list[Math.floor(R() * list.length) % list.length]; }
function between(R, lo, hi) { return lo + Math.floor(R() * (hi - lo + 1)); }
// one person: stats from the ranges, up to two traits (with their bonuses applied), and a figure spec (looks)
function roll(R, D) {
  D = D || DEF; R = R || Math.random;
  var p = { name: pick(R, D.names), stats: {}, traits: [], look: {} }, k;
  for (k in D.stats) p.stats[k] = between(R, D.stats[k][0], D.stats[k][1]);
  if (R() < D.traitChance) {
    var pool = D.traits.slice(), t1 = pool.splice(Math.floor(R() * pool.length), 1)[0]; p.traits.push(t1.id);
    if (R() < D.twoTraits && pool.length) p.traits.push(pool.splice(Math.floor(R() * pool.length), 1)[0].id);
  }
  p.traits.forEach(function (id) { var t = traitOf(id, D); for (k in D.stats) if (t && t[k]) p.stats[k] = Math.max(1, p.stats[k] + t[k]); });
  p.look = { hair: pick(R, D.hair), coat: pick(R, D.coat), vest: pick(R, D.coat), pants: pick(R, D.pants), skin: R() < 0.5 ? '#ffd8b0' : '#f0c49c', beard: R() < D.beardChance ? 1 : 0, scale: D.scale[0] + R() * (D.scale[1] - D.scale[0]), bodyW: D.bodyW[0] + R() * (D.bodyW[1] - D.bodyW[0]) };
  return p;
}
function traitOf(id, D) { var ts = (D || DEF).traits; for (var i = 0; i < ts.length; i++) if (ts[i].id === id) return ts[i]; return null; }
// the figure spec for lib.makeFigure, from a person's look (the hero's figure with these colours and build)
function figureSpec(p, heroDef) {
  var sp = { col: {} }, k, L = p.look || {};
  for (k in heroDef) if (k !== 'col') sp[k] = heroDef[k];
  for (k in heroDef.col) sp.col[k] = heroDef.col[k];
  sp.scale = L.scale || 1; sp.bodyW = L.bodyW || 1; sp.beard = L.beard || 0; sp.walkRate = 1.3;
  if (L.hair) sp.col.hair = L.hair; if (L.coat) sp.col.coat = L.coat; if (L.vest) sp.col.vest = L.vest; if (L.pants) sp.col.pants = L.pants; if (L.skin) sp.col.skin = L.skin;
  return sp;
}
function describe(p, D) { D = D || DEF; var parts = []; for (var k in D.stats) parts.push(STAT_NAMES[k] + ' ' + p.stats[k]); return parts.join(', '); }
function merge(D, over) { var out = JSON.parse(JSON.stringify(D)); for (var k in over || {}) out[k] = over[k]; return out; }
return { DEF: DEF, STAT_NAMES: STAT_NAMES, roll: roll, traitOf: traitOf, figureSpec: figureSpec, describe: describe, merge: merge };
})();
if (typeof module !== 'undefined') module.exports = Hird;
