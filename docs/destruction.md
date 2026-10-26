# Destruction: breaking in, bringing down, burning, mending

**Built 2026-10-13, tried in the Destruction Editor (`game.html?scene=ruin`). Robin has not played it: every number here
is a first setting.** The pictures are `docs/pictures/destruction.jpg` and `docs/pictures/destruction-lean.jpg`.

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
14) in its panel. `docs/pictures/destruction-lean.jpg` is before and after at 9. My reading: the side walls are much clearer,
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

## 9. The big trials (2026-10-13)

Robin: *"Now do a big trial where you build a big village/town and raid it. Destroying houses, breaking in etc. Then a
new trial where you make the houses bigger so there is more room to move around. Every time work on fixing bugs you
find."* `docs/pictures/destruction-trials.jpg` is the pictures.

### What was built for it

- **Two big places** (`src/village.js`): the **great village** (`ARCH.great`: a log hall, a full ring of houses and a
  **second ring** behind it, 17 to 21 buildings inside a ring of stakes, 34 to 44 people) and the **great town**
  (`ARCH.bigtown`: the same with a church and two stores inside a town wall, in the lowlands' materials). Nothing plans
  them into a world: a page asks for them (`Village.plan(env, { swap })`), as the Destruction Editor does.
- **Bigger houses as one number** (`Village.DEF.houseK`): every building's inside times that, the yard and the site
  growing with it.
- **Three switches in the Destruction Editor** (they reload the page): **Places: great ones** (`&big=1`: a great village
  on the second island, a great town on the third), **Houses: as now, half again as big, twice as big**
  (`&roomy=1.5`), and, with bigger houses, **Heard as far again, too** (`&loud=0` turns it off). And on the board: the
  place (town or village), its men (none, 12, 20, 30, 40), a raid on it (your ship and five of your own).
- **`tools/visual/sackplay.js`** plays it in the page with no pictures (`SK.setup`, `SK.raid('hall' | 'fire')`,
  `SK.sack`, `SK.watch()`); **`tools/visual/bigplace.js`** renders one place large from the generator.

**How it was played.** By script, with the game's own keys. The hero **never fights and never raises his shield**, so
the raids are a floor, as in `docs/archive/battle-plan.md`. He and his five are **set down at the gate**: the walk from the
ship (73 to 143 tiles in these worlds) was skipped. A **watch** runs with every step and counts what must never happen:
anybody walking through a wall, a man standing still with somebody to go for, people hidden in a house that is gone,
people fleeing who do not move, time spent standing in a fire. **Every number below is from the code as committed**
(the raids were run again after the last fix: several numbers moved on the way).

### Trial 1: the places as they are

**The great town** (Alvarsberg: 19 buildings; the hall 14 by 4 in timber frame under tiles, a cut-stone church under
slate, thirteen plank houses under thatch; 302 pieces of wall; a town wall; 35 people and 30 men).

| What | How it went |
| --- | --- |
| The hall by its back wall, four times | through the wall in 10 s, the chest on his shoulder at 30 s with 12 to 15 men up; never out of the gate; **dead at 46 to 49 s** |
| A house set alight first, then the church, four times | lit unseen; three to six men stand at the fire; nobody up at the church door; the chest lifted at 40 to 51 s with all but full health, 12 to 19 men up by then; out of the gate once; **dead at 61 to 69 s** |
| The sack with nobody to stop him (the men taken out) | **17 of 19 buildings down**, 16 of them burnt, 253 of 302 pieces, in 634 s. The church stands, and the hall (23 pieces hacked out of it in two and a half minutes: a timber frame stands until most of it is gone) |
| The sack with the town up (30 men, the hero made unkillable) | he is **held**: three to six pieces of the hall in two and a half to three minutes, and it does not come down |
| Afterwards | 32 of its 35 people stand outside the place with no home; three are indoors (the hall stands) |

**The great village** (Tovasstad: 18 buildings; the hall 17 by 4 of logs, plank houses under turf; a ring of stakes;
40 people and 20 men).

| What | How it went |
| --- | --- |
| Through the ring | a way cut in **14 s of axe work, unheard**; his men follow him through it |
| The hall's log wall, three times | 18 to 22 s of blows that the whole village hears: 19 or 20 of the 20 up; in two he was **dead before it gave**, in the third he stood in the hole with 7 health and no chest |
| The sack with nobody to stop him | **17 of 18 down** (16 burnt), 276 of 288 pieces, in 374 s. The stone smithy stands |

### Trial 2: every house half again as big

**The great town** (Torstenstun: 18 buildings; houses 6 by 6 to 8 by 5, **the hall 26 by 6**; 432 pieces; 40 people,
30 men). The sack with nobody to stop him: **17 of 18 down** (15 burnt), 386 of 432 pieces, in 462 s; the church
stands; all 40 people outside the place. **The great village** (21 buildings, 510 pieces, the hall 26 by 6, 41
people): **20 of 21 down** (19 burnt), 436 of 510 pieces, in 786 s; the log hall stands.

| Four raids each | Houses as now | Half again as big, heard as before | Half again as big, heard half again as far |
| --- | --- | --- | --- |
| The hall by its back wall | 0 of 4 away (12 to 15 men up at the lift) | **3 of 4 away, untouched** (three men up at the lift, four to seven in all) | 0 of 4 (five up at the lift, 25 to 27 by the end, dead at 46 to 54 s) |
| Fire first, then the church | 0 of 4 away (the chest lifted in all) | not run | **3 of 4 away with the chest**, untouched, all five with him, 87 s (13 to 15 men at the fire, two up at the lift); once run down outside the gate |

**What that says.**

- **Room.** A hall of 26 by 6 is wider than the screen and a house of 6 by 6 is a room you can fight in. But **the
  things inside do not grow with the room**: the same two beds, a hearth, a chair and a chest stand in more than twice
  the floor, and the hall is a plank floor with two braziers. Bigger houses need a furnishing pass before they look
  lived in.
- **Sound is distance.** Make the houses bigger and the same noise reaches fewer men: the hall raid went from never
  getting out to walking away untouched three times of four. With what is heard scaled by the same number it is lost
  again, as before. So **house size and hearing must move together**; the trial does that by default.
- **Fire as a diversion grows stronger with the place.** In the bigger town the fire stands further from the church,
  more men go to stand at it (13 to 15 against three to six), and the church's chest comes out three times of four. At
  today's size it never did. Whether that is "a good plan pays" or "too easy" needs Robin's eye, and a hero who is
  chased by somebody who plays.
- **A town that is up cannot be pulled down round its own ears.** Once the men strike a man who stands hacking at a
  wall (they often did not: fault 15 below), an unkillable hero is held at the first wall. Sacking is what happens
  after the fight is won, or with fire.
- **Cost.** Finding the rooms again after a house falls takes 5.9 ms at the bigger size (4.5 at today's); a step of the
  whole town with the watch on is about 1 ms, 20 to 33 at worst. The pane draws in software, so only the comparison
  counts.

### What the trials found, and what was done

**In the place and its people** (the first passes):

1. **The editor's board ran off the screen** with the new rows: it packs its rows tighter when there are many.
2. **A fire drew nobody.** It was a noise like any other, so every man who heard it was simply up and after the hero
   wherever he stood. Now a fire is something to look at (`Combat.gawk`): the men at their day **leave it and go to
   stand before the fire while it burns**; the gate's and the hall's own stay; a real noise still wakes them; and
   **lighting a fire where a man or a villager can see you raises the cry**.
3. **A roof whose walls burnt away fell as straw, not as ash.**
4. **A hitch of 28 ms every time a piece gave way**: the rooms were found again over the whole map (164,000 tiles) and
   every roof picture thrown away. Rooms are now found per **cluster of buildings**, a breach rebuilds nothing, and a
   fallen roof drops only its own pictures.
5. **Villagers froze** beyond about 37 tiles from the hero: in a big place half the village stood still while it burnt.
   Everybody of the place you are in now lives.
6. **A village's ring of stakes was unknown to the axe and to the way-finding**: a swing took four stakes at once, men
   planned ways straight through it, and its gate was nine tiles wide. Stakes fall **one a blow** (the palisade's
   toughness), leave a stump, the grid closes every tile a stake stands in, and the gate is about three tiles.
7. **"Whole again" left burnt furniture gone.**
8. **People who fled stood in a ruled line** outside the place.
9. **Ash lay the same on every tile.**
10. **Window boxes, lanterns and signs hung in the air** where their wall had gone.
11. **With bigger houses the men who came to look stood inside the burning house**, and nine of them burnt. They stand
    on open ground now, and a man in a room that is alight walks out of it unless he is fighting.
12. **Grass grew through laid floors** in every house (seen once the rooms were big enough to look into).
13. **A big roof fell before the flames had crossed it**: it now waits until the fire has reached its far end.
14. **With bigger houses nothing was heard** (above): hearing scales with the house size in the trial.

**In the engine every fighting man uses** (found when the whole test suite was run before committing: the town test
of `tests/battle.js` showed one man standing still, which it had not shown in the handful of fights it runs. Its fights
are random, so `tools/seedrand.js` now gives `Math.random` a seed and a fault can be played again. Over the same 246
scripted attacks on three towns, the engine as it was committed that morning had **2 fights that never ended, 3 men
who stood still for five seconds or more, and 12 waits of half a minute or more at a gate; now: none, none, and no wait longer than 28 s**):

15. **A man hard against a wall never struck**, and neither did two men face to face beside a corner: the way-finding
    told each to walk round something to reach the man in front of him, and a man who is being led round something
    did not strike. A fight between the last two could go on for ever, and **a hero hacking at a wall was half safe
    from the men behind him**. A foe in reach with no wall between is now struck, whatever the way-finding says.
16. **A man caged in the corner of a house** behind a chest, the moment the hero came near: the walls' own circles exist
    only near the hero, and they pushed a man who had walked along the wall far from him. They push nobody but the
    hero now; instead everybody else stops four units short of a wall he walks into, near the hero and far from him
    alike (so nobody stands in a wall).
17. **A man in the notch between two round things** (two log seats by the fire; a table and its bench) stood 5 to 21 s:
    his step to one side was always 72 degrees, which pressed him against one or the other. He now turns further each
    time it has not helped, until he is all but backing out.
18. **Both sides waiting their turn at a gate**: the town's men inside and the raiders outside, in reach of one another,
    each waiting for the gate to clear, for up to three minutes. A gate is filled only by a man's own side on its way
    through; a foe in a gate is somebody to fight there.
19. **Two men either side of a wall pushed each other** through it.
20. **A fleeing villager walked through a dry-stone wall.** Her refuge was a walled-in yard, and a villager with no way
    to a place simply walked straight at it. With no way he stands, then thinks of somewhere else; and a refuge is a
    place that can be walked to from the yard.
21. **A guard nudged a step from his place turned his back to walk the step home**, so nobody could come up behind
    him once the hero's own men had crowded his gate. (The old fault 18 had been keeping them out of it: the scripted
    church raid of `docs/archive/battle-plan.md` went from six quiet starts in six to two in twelve, and is back at five in
    six.) He steps back as he stands.

Nobody walked through a wall, nobody stood still with somewhere to go, and nobody hid in a house that was gone, in
any of the runs on the code as committed.

### Not done, and what I cannot judge

- **The hero does not fight**, and the walk from the ship was skipped: these are raids on paper.
- **Four raids a line** is few: read the lines as "never", "sometimes", "always", not as percentages.
- **Furnishing** of big rooms; the second ring's houses are plain houses (no workshops, no second well).
- **The big places are only in the editor.** The real game's villages are as they were. The engine fixes (15 to 21)
  are in the real game.
- **Your own men follow you through a gate and stand among its guards.** A town at peace lets a band walk in today
  (decided otherwise on 2026-10-13, not built); until then they crowd a gate you stand outside of.
- I cannot hear it, and I judged the pictures in the pane at Robin's size, not on Robin's screen.

### Questions for Robin

7. **Bigger houses: yes, and how much?** Half again as big gives real room and an emptier look; a quarter more may be
   the better trade. If yes: for every village in the game, or only the big places?
8. **Should hearing grow with the houses**, as the trial has it? It keeps the hall raid as hard as it was.
9. **Fire as a diversion.** At the bigger size it makes the church nearly a sure thing. Leave it, or should some of
   the men who go to look come back sooner, or the priest raise the cry?
10. **The great village and the great town**: are these the size a "big place" should be (17 to 21 buildings, 35 to
    45 people, 20 to 30 men)? Where do they go in the world?

