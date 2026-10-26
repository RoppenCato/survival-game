# Build plan: the sea as waters (for a long Fable session)

> **Which chapter (2026-10-20):** steps 1 to 3 are chapter 2's work (home water) and steps 4 and 5 chapter 3's (the first sea
> and the first raid). Under Robin's rule of one chapter at a time (`docs/chapters.md`) this waits until chapter 2 is the current
> chapter, unless Robin chooses to build the generator early as a foundation.

**A plan, written 2026-10-19 (Opus) for a long session on Fable; waiting for Robin's yes on the decisions in section 1.**
The design is `docs/world-shape.md` (read its "Robin's answers" and "round two" first): what is Robin's there is decided, the
rest is mine. This file says what to build, in what order, where in the code, with what first numbers, how to check it and
when a step is done. Each step is a rung (Robin's way: try the smallest case, fix, scale up), each ends committed and playable.

**Status (2026-10-20, Robin: "start working on 1-3"):** steps 1, 2 and 3 are built (commits 6154370, 255952a and the
climate's look; CLAUDE.md "The world" and "Villages" say how they stand). Left of them: beasts on the new islands, the
raw small fixes below. Steps 4 and 5 are not started.

## 0. Before you start

**Read:** `CLAUDE.md` (all of it: the working rules, "Things to know before changing code", the controls), `docs/world-shape.md`,
`docs/chapters.md` (keep its status tables up to date as steps land), `docs/villages.md`, `docs/archive/battle-plan.md`, `docs/archive/raid.md`,
`docs/archive/boats.md`.

**The rules that bite in this work** (from CLAUDE.md, repeated because they are easy to break in a big change):
- After editing `src/` or `templates/`: `npm run build`, then `node tools/parsecheck.js` (parses every built page's scripts).
- No `//` comment in the middle of a template line (the lines are long; the comment swallows the rest). End of line, or `/* */`.
- Source files load both inlined and by `require`: no ES modules, no browser globals at load time.
- Files may have CRLF in the working tree; normalise `\r\n` before matching multi-line text. Patch with a script whose
  replace asserts exactly one match, and write LF.
- Open pages with `?mute=1`. Judge looks at Robin's size (resize the pane to 1920 by 1080, the canvas is then 1200 by 750),
  and reset the viewport after.
- Commit and push at the end of each step, the story in the commit message; update CLAUDE.md in place (no dated paragraphs).
- Robin's decisions are marked Robin's, mine are marked mine. Names of people and places are the Lore Director's: a name
  needed before the lore has one is a placeholder marked `LORE?` in a comment, plus a message to the Lore Director.
- `npm test` has no assertions: read the lines; a line with `!!` is a fault.

**Driving the game in the pane** (traps met on 2026-10-16): a hidden pane does not animate. `tools/visual/drive.js` takes
over `requestAnimationFrame`, but the replaced page's loop can win the race and the clock then stands still (day.t does not
move, captures come out black). What works every time: skip the frame loop and step the game yourself,
`var D = Combat.api.debug(); D.tick(1/60)` as many times as needed, then `Combat.render(document.querySelector('canvas').getContext('2d'))`,
then `canvas.toDataURL('image/jpeg', .92)`. A big result lands in a file: decode it (base64 after the comma) and crop it with
`@napi-rs/canvas`. Sheets load lazily: let real time pass (await a few hundred ms between batches) before judging people.

**Effort:** high for the session; extra high for step 1 only. Small fixes noticed along the way go on a list at the end of
this file for a later Opus session, not into the day.

**Baselines (2026-10-20, before any of this; `docs/baselines/`):** the game's sea (seed 11, 912 by 640 tiles, 2 islands)
takes `World.make` 936 ms, `plant` 42 ms (4929 trees, 1196 rocks), `dress` 62 ms (5868 dabs, 109,662 ground cells), the
chart 13 ms, about 20 MB of heap (`node --expose-gc tools/worldtime.js 11`); `npm test` prints 463 lines with no fault
(`npm-test-2026-10-20.txt`); the chart of today's sea with its villages is `sea-2026-10-20.png`. A save is about 55 KB
(the ground as a diff), every save together 124 KB. The beasts' sheets load when a beast is near (about 550 MB decoded if
every kind were loaded; none at the start).

## 1. Decisions to confirm with Robin first (defaults if he is not there)

| # | Question | Default (mine) |
| --- | --- | --- |
| 1 | The sea-going ship that leaves home must be buildable from home's materials. The karve costs `ironBar: 8` today (`src/yard.js` `HULLS.karve`), and iron is the outer circle's. | The karve takes copper (wood 24, copper 10, fiber 12 for the sail; tier 3 bench as now); the longship stays on iron. |
| 2 | How many islands in home water? | 12: the starter island, the big island, 3 medium, 6 small, plus skerries. |
| 3 | The outer circle | 4 seas (north, south, east, west), 4 to 6 islands each, one slot each for a special island. |
| 4 | Is iron the outer circle's metal? | Yes (it fits the lowlands as decided). |
| 5 | Where can a season be ended? | For now a row in the Escape menu ("End the season"); where it lives in play is Robin's to choose later. |
| 6 | Old saves | Dropped: the layout changes, and `layoutKey` already drops a save of another layout with a toast. |
| 7 | The jarl of home water | A `seat` village on a medium island, peaceful; his name `LORE?` (ask the Lore Director). His part in opening the raids and his fall are later. |

## 2. What is not for this session

Special islands' contents (slots stay generic), each sea's special goods, rumours on the chart, the jarl's call after the
first raid and his fall, claiming home's islands, drawing winter and the other seasons (only the data slot is made), more
than one mountain island (world.js supports one: `o.mountain`), a second circle. All of these are in `docs/world-shape.md`.

---

## Step 1. The sea as waters (the generator) — the foundation, do it first

**Goal:** the game rolls a big home water (the starter island and the big island as now, plus about ten more islands) and
four waters round it, each a cluster of islands, with long crossings between; one continuous map. Small boats cannot leave
home water; a sea-going ship can. The Sea Editor shows the same sea.

**How it works today** (`src/world.js`, `make`):
- Section 1 places islands one by one beside a random earlier one (`pickR`, `pickGap`, `o.count`, `o.sizes`, `o.dir`,
  `o.biomes`); section 2 sizes one grid of `GW` by `GH` tiles to fit them and drops islands past `o.maxTiles` (9e6);
  section 3 builds the height field `E` (Int16 per tile) with `blob()` per island and skerries; 3b computes `BM` (a lowland
  value per tile) by looping over **every island for every tile**; 3c the mountain on one island (`o.mountain`,
  `World.BIG_MOUNTAIN`).
- The game's sea is `spec` in `templates/game.html` (around line 333: `sizes [120, 400]`, `gap 240`, `dir 0.1`, `count 2`,
  `mountain: 1`), overridden by the Sea Editor's `game.world2`. `buildWorld()` calls `World.make(kit, spec)` and then
  `w.plant()`, `w.peaks()`, `w.camp()`, `w.dress()`, `w.chart(700)`. `layoutKey()` (around line 5317) names the layout for
  the save. `worldBounds()` puts the cave and the yard at `WX + 12000`, east of the map.
- Much code assumes **island 0 is the starter island and island 1 the big island** (`isleAt(...) === 0`, `isles[1]`,
  `villageSite`, `Village.plan` starts at 1, Old Aslak lives in the big island's first village). Grep for `isleAt(` and
  `isles[` before changing the order.

**What to build:**
1. A new layout mode in `World.make`, chosen by `o.waters` (an array of water specs). Without `o.waters` the old path runs
   unchanged (the Mountain test, the Battle and Destruction scenes and the editors pass their own specs).
2. A water: `{ id, ring, dir, cx, cy, r, islands: [...], slot }`. Home water is ring 0 at the centre; the four ring-1 waters
   sit at north, south, east and west with the angle jittered (±20°) and their distance varied (the crossing is
   `crossing * (0.75 to 1.3)`), so the map is lumpy, not a cross. Seeds: every water and every island gets its own seed from
   `o.seed`, the water's index and the island's index, so any island can be regrown alone later.
3. Islands inside a water by rejection sampling inside the water's disc, keeping a minimum gap between coasts (`inGap`),
   biggest first. Home water: island 0 is the starter island, island 1 the big island with the mountain, **in that order**,
   at about today's distance apart (`gap 240`), then the others round them. Every island record carries
   `{ x, y, r, water, ring, slot, seed, role }` (`role`: `'starter'`, `'big'`, or null) and keeps `biome` for the old code
   until step 2 replaces it.
4. One **slot** per water: an island flagged `slot: true` (a generic island now; a special island's recipe drops in later).
   Home water has none.
5. `w.waters` and `w.waterAt(wx, wy)` (the water a point is in, or the crossing between: `null`), and `w.homeWater`.
6. **The edge of home water:** in the game, a vessel that is not sea-going (the raft, the faering, the boat:
   `!Yard.rigged(kind)`) is pushed back gently past `homeWater.r + edge` (a soft force toward the centre and a speed cap, no
   damage, no text: the swell turns it). Make the waves visibly bigger out there (the wave and foam numbers the ground uses).
   A rigged hull passes. Reward, not punishment: nothing is lost.
7. **Performance (the main risk):** the map is far bigger. Fix the per-tile loops that visit every island (3b `BM`: use each
   island's bounding box, or a coarse cell index of which islands touch which 64-tile cell); keep the open sea cheap. Budget:
   `World.make` plus `plant` plus `dress` under about 4 s in Node for the full sea, the game's first frame within about 6 s,
   and no frame spikes while sailing (the frame log shows SPIKE lines over 50 ms). Measure before and after with a small
   script (time and `process.memoryUsage()`). If one grid cannot meet it, two ways out, in this order: (a) shorten the
   crossings and pack the waters tighter; (b) islands as patches: each island keeps its own arrays in its box and everything
   outside every box is deep sea (`E` = -1000). (b) is the long-term answer (a second circle will need it) but touches every
   per-tile accessor; take it only if (a) fails.
8. **The game:** a new `spec` with `waters` in `templates/game.html`; change the Sea Editor's storage key to `game.world3`
   (its meaning changed) and ignore an old `game.world2`; put the waters into `layoutKey()` so old saves are dropped with the
   existing toast. Check `worldBounds()` still puts the cave and the yard clear of the bigger map.
9. **The chart and the map (M):** `w.chart(700)` draws the whole map in 700 pixels; at the new size small islands vanish.
   Give the chart more pixels or draw it per water, and let M zoom and pan if needed. What has not been seen stays hidden.
10. **The Sea Editor** (`templates/sea.html`): draw the same sea (same `World.make` call and spec), with distances and
    sailing times between islands and across crossings. Sliders for the new numbers can come later.

**First numbers (mine; the karve's top speed is 115 units a second, about 3.6 tiles a second, more with wind and rowers):**

| | Number | What it gives |
| --- | --- | --- |
| Home water | radius about 600 tiles | room for 12 islands with open water between |
| Starter, big | 120 and 400 tiles wide, 240 apart (as now) | chapters 1 and 2 unchanged |
| Home's others | 3 of 150 to 250, 6 of 30 to 80 | |
| Gaps inside a water (`inGap`) | 40 to 150 tiles of open water between coasts | half a minute to two minutes by karve |
| Crossing (`crossing`) | about 350 tiles, ×0.75 to ×1.3 | one and a half to two minutes by karve with the wind |
| A ring-1 water | radius 250 to 320 tiles, 4 to 6 islands (one or two of 200 to 350, the rest smaller) | |
| The edge (`edge`) | 60 tiles past home water's radius | where the swell turns small boats |

**Check:**
- Update `tools/visual/worlds.js` (it renders charts of several seeds with their villages) to take the new spec, render four
  seeds, look at the PNG: islands spread, nothing overlapping, crossings clear, slots marked.
- `npm test` (karve, fishing, cave, ruin and battle use the world or the boats), `tools/visual/scenesmoke.js` in the pane
  (every scene still starts).
- The game in the pane: a fresh start at the wreck works as before (the steading, Arnor, the cairns); teleport to the big
  island's village (Old Aslak is there); take a raft out to home's edge and see it turned back; give yourself a karve (Admin)
  and sail across a crossing; the frame log has no SPIKE lines.

**Done when:** a fresh game has the new sea, chapters 1 and 2 play as before, a raft cannot leave home water and a karve can,
the Sea Editor shows the same sea, the budget holds. **Robin's checkpoint:** a chart of the sea and a short sail.

**Pitfalls:** the island order (0 starter, 1 big); `villageSite()` looks for the steading on island 0; `layCairns()` runs
from the wreck; `Village.plan` gives `fisherIsle` to the smallest island under 60 tiles; the cave mouth is on the big
island's mountain; anything that loops over the whole map (`w.eachProp`, `w.plant`) is now far bigger.

---

## Step 2. Climates as data, by position

**Goal:** what an island looks like comes from where it lies: one smooth field over the whole sea, a little colder to the
north, warmer to the south, wetter east and west, so a two-minute sail changes little and a crossing changes a lot. Robin,
2026-10-19: "it needs to make sense with distance". Each climate has four season slots, only summer drawn.

**How it works today:** `BM` (one value per tile, 0 home to 1 lowland) feeds `w.plant()` (around line 1395: `TREES` vs
`LOW`, `chalkRock` when `bmp > 0.5`) and the ground painter (`BMv` in the chunk baker, around line 667). The lowlands'
ground, trees and rocks already exist.

**What to build:**
1. Replace `BM` with a climate read at any point: `w.climate(wx, wy)` returns `{ warm, wet }` (each 0 to 1). Computed, not
   stored: from the angle and distance from home water's centre (home is the middle: warm 0.5, wet 0.5), blending toward an
   anchor per compass direction as the distance grows past home water's radius (smoothstep over the crossing), plus
   low-frequency noise (an island's south a touch warmer than its north). Anchors (mine): north `warm 0.15 wet 0.35`,
   south `warm 0.85 wet 0.3`, east `warm 0.65 wet 0.85`, west `warm 0.3 wet 0.8`. Directions between blend, so a north-east
   water is cold and wet.
2. A table `CLIMATE` (data, in `src/world.js` or its own `src/climate.js`): for the corners of the warm and wet square, the
   ground palette, tree weights, rock kinds, bush and flower weights, the grass colour, and **four season slots** (`spring`,
   `summer`, `autumn`, `winter`; summer filled, the others copies of summer for now). The look at a point is the blend of the
   corners by `warm` and `wet`. Home's look must come out **exactly as today** at the centre (compare a crop before and after).
3. Trees and plants from what exists (`kit.PROPS`): cold and dry: birch, pine, dwarf birch, juniper, boulders, rock; warm and
   dry: oak, beech, ash, apple, chalk rock (today's lowlands); warm and wet: birch, tall grass, reeds where the ground brush
   has marsh, bog iron; cold and wet: heather, juniper, sparse pine, moss ground. New props (alder, reeds as a prop, snow) are
   later work in the Art Editor's Objects.
4. `w.season` (default `'summer'`) and `w.setSeason(name)`, which drops the baked ground chunks so they bake again. Nothing
   but summer is drawn yet; the path is there so seasons are filling in, not a rebuild.
5. `Village.make` and `Village.plan` take the climate where they took `biome` (the town and church archetypes go where it is
   warm and settled, i.e. the south).

**Check:** `node tools/visual/worlds.js` (now coloured by climate) and crops of the game at Robin's size: home looks exactly as
before; the north water's islands birch and rock, the south's oak and chalk, east wetter, west heath; a big island shows a
gentle change from end to end. `npm test`.

**Done when:** every island's look follows its place smoothly, home unchanged, four season slots in the data.
**Robin's checkpoint:** four crops, one per water, at his size.

---

## Step 3. Home water's people

**Goal:** villages on home's new islands, peaceful; the simple jarl's hall; no raiding in home water (Robin, 2026-10-19:
"you cant raid the starter islands until you've opened up raiding in the second circle").

**How it works today:** `Village.plan` (`src/village.js`, line 430) gives each island archetypes by size and biome
(`seat`, `village`, `small`, `farmstead`, `fishing`, `trading`, `fisher`, `town`, `church`, and `ruin` at random). The game's
`villagePlan()` and `hamletClear()` (around line 2332) grow every village each start (`Village.make`). Breaking in and fire
work on "what is somebody else's" (`placeAt`, `theirs`); the raid systems (`raidAlarm`, `spawnGuards`, doors and locks)
are in the game.

**What to build:**
1. `Village.plan` reads each island's water and ring: ring 0 gives only peaceful archetypes (`village`, `small`,
   `farmstead`, `fishing`, `trading`, `fisher`, and `ruin` now and then), and **exactly one `seat`, the jarl's**, on a medium
   island (not the big island, so Old Aslak's village stays as it is). Ring 1 gives its own mix by climate: the south the
   town and church (as the lowland islands do now), the others villages, a seat, fishing places.
2. A flag `seen.raidOpen` (false at start; nothing sets it yet: the jarl's call comes later). While it is false, home
   water's villages are not raid places: no stores behind doors, tools and fire do not work on them (`theirs()` false for
   ring 0), no raid alarm. A drawn blade still makes a place uneasy (that is built and stays).
3. The jarl: a seat village's folk, his name `LORE?` (message the Lore Director for a name; until then a placeholder in a
   comment). Nothing more for now.
4. Each village keeps `water` and `ring` on its site record, for step 4 and 5.

**Check:** `node tools/visual/villages.js` and `worlds.js`; in the game, teleport through home's villages: folk at their
routines, the seat's hall, an axe at a door does nothing, a torch at a wall does nothing. `npm test` (the ruin and battle
tests use their own scenes and must not change).

**Done when:** home water is full of peaceful places and one jarl's seat, and none of it can be raided.

---

## Step 4. The first real raid: the south water

**Goal:** chapter 3's centre: the south water's town and church, defended, raided in the real game with your own karve and
hird, the loot carried home, all of it saved. Everything needed works in the Battle test (`?scene=battle`); it has never run in
the real game (CLAUDE.md: "the men exist only in that scene").

**How it works today** (all in `templates/game.html`): `townMen(vi, n)` and `Village.garrison` place a town's men by post;
`spawnGuards()`; `raidShore(vi)` finds where a raider's ship lies off a town; `raidSet()` and `townSet()` set the Battle
test's town up; `carryOrder`, `menBoard`, `menAshore`, `raidMenTick`, `liftMan`, `layAboard` carry loot and men; `raidTick`,
`raidAlarm`, `raidStir` run the noise and the alarm; night sleeping, the watch, the back gate on the latch; G gives orders
(storm, carry); the sea chest (`seaChest()`). `src/nav.js` gives the way-finding in every real village already.

**What to build:**
1. Spawn a ring-1 settlement's garrison (`Village.garrison`) and its villagers' fighting state when the hero comes within a
   radius (about 1200 units) and remove them when he is far (keep their state); the same `MEN` numbers, the same minds.
2. The hird crews the karve and comes ashore on a raid (built: hirdmen board and row; check they follow on a raid in ring 1,
   as decided: "they follow and work only inside your territory and on raids").
3. Per-settlement state, saved: `{ state, raids, dead: [names], doors: [broken], taken: [loot ids], fire: [...] }` (find out
   first whether a village's broken walls and dead survive a reload today; the save keeps `B`, `seen`, `gone`; villages are
   regrown from their seed each start, so most likely not). Regrow from the seed, then lay the saved state over it.
4. Loot: the church's silver and the hall's chest carried to the ship (built) and unloaded at home as silver (built).
5. Keep the Battle test as the place where all of it is tuned: what changes in the raid changes in both.

**Check:** `npm test` (battle and ruin print the same as before: run `tests/battle.js raid` on the committed code and on the
change with the same seeds: `RSEED=28 TOWN_SEEDS=138,471,101 node -r ./tools/seedrand.js tests/battle.js raid 3`); then
`tools/visual/raidplay.js` in the Battle test; then in the real game: Admin gives a karve and four hirdmen, sail from home to
the south water, raid the church quietly, carry the silver to the ship, sail home, unload, save, reload: the church remembers.

**Done when:** that whole run works in the real game, and the Battle test's bots give what they gave before.
**Robin's checkpoint:** he plays the raid.

---

## Step 5 (if time remains). The season turn and the raided place's life

**Goal:** a raided place in ring 1 changes at each season turn, as in `docs/world-shape.md` ("A raided place lives by the
seasons"): raided, then rebuilt (poorer, a palisade and a watch), taken (bandits) or overgrown (a ruin); rebuilt comes back
thriving and stronger; one left alone grows richer each year; a claimed place never changes; new settlers come to a ruin only
after winter. Raiding the same place again and again turns it hostile or kills it.

**What to build:**
1. `season` in the save (`spring`, `summer`, `autumn`, `winter`) and an Escape-menu row "End the season" (decision 5).
2. At a turn, every unclaimed ring-1 settlement steps once by the table in `docs/world-shape.md`, rolled by how badly it was hit
   (`raids`, `dead`) and who survived. Rebuilt and taken regrow the village from its seed with new options (a palisade:
   `Village.make` fence options; taken: no folk, an armed garrison of bandits with their own loot). Overgrown: the village's
   pieces left as a ruin (`ruin` archetype) with nature back.
3. Nothing in home water steps while `seen.raidOpen` is false.

**Check:** a script that runs a settlement through ten turns and prints its states (like the tests: values, `!!` for a fault);
in the game: raid the south village, end the season, see it rebuilt with a palisade; reload, it stays.

**Done when:** the loop raid, end the season, see it changed, works and is saved.

---

## At the end of the session

- CLAUDE.md: "The world" section (waters, climates), "The game as it stands" (home water, the south water, the raid in the
  real game), the Pages table (the Sea Editor), and anything that is no longer true.
- `docs/chapters.md` status tables; `docs/world-shape.md` says which parts are built.
- A message to the Lore Director for every `LORE?` added (the jarl's name, the waters' names if any are shown).
- The list of small fixes found along the way, below, for the next Opus session.

## Small fixes found along the way

(none yet)
