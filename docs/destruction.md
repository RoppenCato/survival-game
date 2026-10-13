# Destruction: breaking in, bringing down, burning, mending

**Built 2026-10-13, tried in the Destruction Editor (`game.html?scene=ruin`). Robin has not played it: every number here
is a first setting.** The pictures are `docs/destruction.jpg` and `docs/destruction-lean.jpg`.

Robin's brief (2026-10-13): you should be able to destroy houses and villages, and to break in. It must be balanced (a
stone wall is not felled by an axe: another tool), immersive, semi-realistic, usable as tactics to break in or go through
places in a town, not exploitable, it must not glitch the people, and it leaves a trashed, broken place: raids should
feel more alive, and you make an impact. What you have claimed you can build up again. And an editor to try it in.

## 1. The rules, in one page

The rules are `src/ruin.js` (no drawing, no page; it loads in Node), the drawings `src/build.js`, the game's side
`templates/game.html` under "breaking in, bringing down, burning and mending".

**A piece of wall takes damage and gives.** A blow of a tool is the tool's own power (an iron axe or pick 2.6) times
what that tool does to that material. When the damage reaches what the piece takes, it **gives**: a breach, which is a
way through (for you and for everybody else) and still the room's wall as far as its roof goes. A locked door that
gives stands open for good. On the way there it is drawn hacked, then nearly through.

| Piece | Takes | Iron axe | Iron pick | Heard |
| --- | --- | --- | --- | --- |
| Wattle fence, rail fence | 8, 7 | 4, 3 blows | 7, 6 | 110 units |
| Window (in wood, wattle or turf) | 10 | 4 (1.4 s) | 8 | 170 |
| Wattle wall | 18 | 7 (2.4 s) | 14 (5 s) | 150 |
| Locked door | 14 | 6 (1.9 s) | 16 | 360 |
| Church door (in cut stone) | 26 | 10 | 29 | 480 |
| Barred gate | 28 | 11 | 31 | 320 |
| Timber frame (its panel) | 36 | 14 (4.9 s) | 28 (10 s) | 260 |
| Plank wall | 48 | 19 (6.7 s) | 53 (20 s) | 280 |
| Turf wall | 56 | 72 (27 s) | 22 (8.1 s) | 130 |
| Dry-stone wall | 40 | 154 | 16 | 300 |
| Palisade | 90 | 35 (13 s) | 139 | 320 |
| Log wall | 110 | 43 (15.9 s) | 170 | 320 |
| Stone wall (rubble in clay) | 130 | nothing | 51 (18.9 s) | 430 |
| Cut stone, a town's wall | never | never | never | 430 |

The seconds are as played by script in the editor (the button held: about 2.3 blows a second, every third a heavy
one; the blows in the table are plain ones). A flint axe takes the log wall in 24 seconds and a wattle wall in 4; a
knife cuts through wattle in 9. **Nothing in the hand breaks dressed stone in mortar:** a cut-stone church or a town's wall is gone round, or its
door is the way in. The engine's own "wrong tool" and half blow come by themselves: a wall is the axe's kind of thing
or the pick's by what it is made of.

**The roof comes down** when a third of the pieces round a room have given (34%: four of a small house's ten). A
timber frame's broken panel counts half: the frame still carries. First a groan, then 1.6 seconds, then the fall: what
stood inside is wrecked (a box spills what it held; a heavy chest lies under it all with its silver whole; stone
things stand), whoever is inside is hurt (24 for you, 16 for a man), and the room is open to the sky with the roof's
remains on its floor: straw, sods, shingles or tiles, and broken rafters.

**Fire.** A torch burning in the hand (T) and E at a wall that is somebody else's: "Set it alight" if the wall burns,
"Set the roof alight" if only the roof over it does. It takes 1.2 seconds of standing there. Then it runs by itself:
along the walls (each try, 55% to the wall beside it), up into the roof after six seconds, down from a roof into its
walls after nine, and as **sparks downwind** onto other roofs that burn. Wood walls burn through to a breach (wattle
12 s, planks 25, a timber frame 30, logs 60); stone and turf stand, and stone is left blackened. Roofs: **thatch**
catches at once and is gone in 26 s, **shingles** 40 s, **turf** hardly catches (70 s if it does), **tiles and slate
never**. A burnt roof leaves ash and charred timber that glow and smoke for a minute; what stood under it is gone,
except stone and silver. Whoever stands under a burning roof or against a burning wall loses 9 health a second.

How a fire jumps (300 fires each, `tests/ruin.js`): to a thatched roof one tile off 85% downwind, 70% with no wind, 0%
upwind; two tiles off 71%, 20%, 0%; three tiles off 49%, 0%, 0%; five tiles off never. So the wind decides whether one
torch is one house or a street. **The rich lowland town does not burn by its roofs** (tiles): its timber-frame houses
burn by their walls, one at a time, and its church not at all.

**Whose it is.** Your tools and your fire work only on a place that is **somebody else's**: a village you do not hold
(and the editor's sampler). Never your own house: nothing in the game damages what you built (Robin dislikes raids on
your base), and the wreck cursor is for that. And the other way round: **in a village that is not yours you cannot
build and cannot use the wreck cursor** ("Not your ground to build on", "Not yours to take down"). A place is yours
when a claim stone of yours stands in it; a stone may be raised in a village only once nobody defends it ("Its people
still hold it").

**Mending**, in a place you hold: the **Mend** piece of the Building board. Point at a damaged piece of wall: it is
whole again for half its price by how far gone it was (a breach: half the price; a hacked wall: less; at least one of
its material). Point at a fallen roof once every wall under it stands: "Raise the roof again" (its own material by the
room's size, and a rafter's wood for every three tiles). A burnt wattle house of ten pieces came to 12 wood and 12
fiber against 12 and 20 to build it new.

## 2. What it does to the people (the "no glitches" part)

- **The way through is everybody's.** A breach is read into the village's way-finding grid as a narrow opening (one
  at a time, like a door). Checked in the town: with the hero set down inside a house he had broken into, the town's
  men came in by the breach and by the door, two each.
- **Noise.** Every blow on a wall is a noise of the material's own reach (above), and a soft one: it wakes the men who
  hear it, and the village is "raided" (its people run home, word spreads) only if a man or a villager was within
  hearing. A wattle wall at the back of a quiet house can be cut with nobody the wiser; a stone wall cannot.
  Twelve men of the town killed a hero who stood hacking at a house in the yard in eighteen seconds.
- **A fire is seen from far off:** 275 units for one piece alight, 1000 for twenty. The men come to look, to open
  ground beside it, never into it. A man who stands in a burning room and is not fighting gets out; a man whose post
  is in a house that burns or is down gets a post outside it.
- **The people of a house that burns or is about to fall come out of it** and run out of the place, on the side away
  from you, five tiles beyond its edge, and watch from there. When it is over they come back; those whose house is
  gone say so ("It is gone. All of it."). **Nobody dies of a fire or a falling roof** who is not a fighting man
  (question 3 below).
- A tile under a burning roof is dear to walk over, so ways lead round it.

## 3. Not exploitable: what was looked at

| A way to cheat | What stops it |
| --- | --- |
| The wreck cursor took any wall anywhere, silently, and gave its wood back | No building and no wreck cursor in a village that is not yours |
| Walling the town's men in, or building a way over its wall | The same |
| Breaking a village for its materials | A piece that gives drops one wood or one stone, or nothing; a fire leaves nothing |
| Mending and breaking again | Mending costs; breaking gives next to nothing |
| A swing at a wall broke the barrel behind it (found in play) | A tool reaches a box only in the room you are in |
| A swing across a corner took two walls at once | One blow, one piece: the wall you face |
| Burning the church open | Cut stone and slate do not burn; only its door does |
| Burning a hall to get at its chest | It works, and takes a minute, and the whole town comes; what else was in the hall is ash |
| Your own base wrecked by somebody | Nothing damages what is yours |
| Claiming a town to take it apart for stone | A stone goes up only when nobody defends it. After that its pieces are yours, and the wreck cursor gives them back in full (question 4) |

## 4. The Destruction Editor

`game.html?scene=ruin` (the start page has a card). The game on the battle test's world, started at a **sampler**: a
small house in every wall material under every kind of roof, a locked store with a chest in it, and a row of yard
pieces with a barred gate. Q for the tools; the Gather bar has an iron axe, an iron pick, a knife, a flint axe and a
copper pick on 1 to 5. T lights a torch; E sets alight; B and the Mend piece mend.

- **The board on the left** (it folds): to the sampler, the town's gate, its church, its hall; the town's men (none,
  twelve, twenty); this place is theirs or yours; set fire to the nearest house; bring the nearest roof down; put the
  fires out; whole again; the sampler anew; the wind (east, south, west, north, none); side walls as now or leaning;
  a torch; more to mend with; heal; night or day.
- **The panel on the right:** every number of the rules as a slider (what each piece takes, what the wrong tool
  does, when the roof falls, the noise, the fire, mending, the lean), the settings as text (only what differs from
  the defaults), Defaults, and **Use in the game** (`game.ruin`, which the game lays over the defaults at its next
  start) and Take back.
- Nothing is saved.

## 5. The rungs, and how each was tried

| Rung | What | Tried by | Where it stands |
| --- | --- | --- | --- |
| 1 | Breaking in: the wall you face, the table, the breach, the way through | `tests/ruin.js` (the table, the solids, the way); `RU2.table()` and `RU2.hack` in the editor; in the real game on the big island's chieftain's seat | Every material gives or refuses as the table says; the hero walks through a breach in 0.6 s; the village's twenty people ran home |
| 2 | Bringing down: the share, the groan, the fall, what is left | `tests/ruin.js` (due after 4 of 10; a timber frame after 7); in the editor four pieces of the plank house | Down 1.6 s after the fourth piece; six tiles of debris; the bed tipped over; mended and raised again |
| 3 | Fire: what catches, how it runs, the wind | `tests/ruin.js` (60 houses of each kind, 300 fires for each gap and wind); `RU2.fire` in the editor by day and by night; a timber-frame house in the town | Wattle under thatch is down in 35 s; the wind east took two shingle roofs downwind and none upwind; the town's tile roofs never caught |
| 4 | Mending in a place you hold | `RU2.mend` in the editor: refused while theirs, then ten pieces and the roof | Works; the cost above |
| 5 | The people | The town with twelve men: a break-in, the hero inside, a house set alight with four people hidden in it | Above (section 2). **Not tried:** a whole raid played through with breaking and fire as part of it |

`node tests/ruin.js` is in `npm test`. `tools/visual/ruinplay.js` plays the editor by script (`RU2.at`, `tool`, `hack`,
`fire`, `mend`, `walk`, `state`, `table`); `node tools/visual/ruin.js` renders every state of every piece to ruin.png.

## 6. Side walls with a face (Robin's question about the mountains' edges)

Robin asked whether what made the mountains' north, west and east edges clear could improve building. One thing
carries over directly: a wall that runs north to south is drawn as a strip seen from above, five units wide, which is
the weakest part of how a house reads. The mountains give such an edge a **leaning face**, lit where it looks west
and in shade where it looks east. `Build.CFG.lean` does that for houses (the foot of a side wall stands so many units
out from its top, and its outer face shows): **off by default**, a switch on the editor's board and a slider (0 to
14) in its panel. `docs/destruction-lean.jpg` is before and after at 9. My reading: the side walls are much clearer,
above all from inside, and a damaged or burnt side wall can then show its scars; but the house gets a splayed foot,
which suits turf and stone and looks odd on planks. A smaller lean (4 to 6) may be the better trade. Robin's call.

Also changed for everybody, because breaking in needed it: **a roof thins when you stand right behind its house**
(you could not see yourself or the wall you were hacking at).

## 7. Not built

- A **ram** for gates and for cut stone; a town's gate that is **barred** to a band (decided 2026-10-13, not built).
- The town **fighting a fire** (buckets from the well), and guards who put you down for carrying a torch in the yard.
- **Smoke** that the next village sees; what a burnt village does to what is said of you.
- Your **hirdmen** breaking, burning or mending on your word; mending as a job.
- A village **mending itself**; and the decided rule that unclaimed places are rebuilt after winter.
- The floor above (a house with stairs has no roof to lose, and its upper floor is not touched).
- Sounds: a groan, a crash and a fire catching are synthesized like the rest. I cannot hear them.

## 8. Questions for Robin

1. **The times.** A plank wall in 7 seconds, logs in 16, a stone wall with a pick in 18, a window in 2. Too quick to
   feel like work, about right, or too slow for a raid?
2. **Fire.** One torch takes a thatched house in half a minute, and with the wind behind it the next one too. Should
   fire be that free, or should it ask for more (longer to catch, tinder, only at night, a price in what is said of you)?
3. **Do people die in it?** Now nobody who is not a fighting man is hurt by a fire or a falling roof: they run out.
4. **Claiming.** A stone raised in a village once nobody defends it makes it yours: then you may mend it, build in it,
   and the wreck cursor gives its pieces back in full. Is that the way a place is taken, and should a taken town be a
   quarry?
5. **The lean** of side walls: on, off, how much.
6. **Dressed stone is never broken by hand.** A cut-stone church is entered by its door. Right, or should a great
   deal of work with a pick do it?
