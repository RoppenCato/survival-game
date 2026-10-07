# Villages: the rules and the settings

Robin's brief (2026-10-07): a set of rules and settings that make good-looking, working villages, spawned at random on islands
as one of many places of interest. It must feel like people planned where everything stands; every village should feel a bit
different and reward exploring; and it must be easy to generate in code. What follows are the rules, the numbers, and how the
generator in `src/village.js` turns them into the game's pieces. The numbers are the first settings; the Village Editor tunes
them and hands them to the game (`game.village`).

## 1. What a Viking village looks like

A Viking-age settlement in Scandinavia was not a town with streets. It was a **farmstead** (one household) or a **cluster of
farmsteads** (a few households) that grew round an open yard, the **tun**, with the sea or a river close and the fields
outside. The shape comes from how people lived:

- **The yard is the plan.** Every door faces the yard. You walk into a village and you are in its middle, with the houses
  looking at you. There are no back streets; behind the houses are the midden, the woodpiles and the fields.
- **The longhouse** is the biggest building, the home of the leading household: people at one end, byre or storage at the
  other, a long hearth down the middle, benches along the walls. It takes the best side of the yard (the north side, facing
  south, out of the wind and into the sun).
- **Smaller houses** for the other households stand on the other sides of the yard, each with its own small outbuildings.
- **Outbuildings** stand back from the yard: a **storehouse on posts** (stabbur; the food up off the ground, away from mice),
  a **byre** with hay, a **smithy** (fire risk: away from the roofs, at the edge), a **bathhouse** by water, a **pit-house**
  sunk half into the ground for weaving and work, a **drying rack** for fish and hides, a **woodpile** under a lean-to.
- **The fire is the middle of the village** (Robin, 2026-10-07: more interesting fires, logs to sit round them). A **fire pit**
  stands in the middle of every yard: a wide ring of stones, logs laid across, a spit on two forked sticks, and **logs to sit on**
  round its south side; the villagers come and sit there, and so can you (E on a log; E stands you up; a log beats the fire's
  Cook when it is the nearer thing). The **well** stands off to the north-east of the yard in any place with some wealth.
- **Things to live with** (Robin: a village needs things around it to interact with, so it feels like a living space): a worn
  step of gravel at every door and one or two things beside it from a pool (a woodpile, a barrel or crate with a little in it,
  a bench, bee skeps, a cart, a drying rack, a log, a trough, a haystack); a **woodpile with a chopping block** (an axe left in
  the stump, chips about) at the longhouse's corner; a cart in a corner of a big yard.
- **Fences** mark the infield (tun) from the outfield (Robin, 2026-10-07: a Viking village has a round defensive wall of
  stakes unless it is a small, defenceless place): a **small or poor place** has a low rail or wattle fence, or a dry-stone
  wall where stone is near, in a rectangle with a gate on the path in; a **wealthy place, a chieftain's seat or a trading post**
  has a **round palisade** of sharpened stakes hugging its buildings in an oval (every building corner inside it), a gap for the
  gate on the path in and **two banner poles** with pennants either side of the gate; a fishing place leaves the oval open to
  the sea. The stakes are solid; an abandoned place has gaps in its ring.
- **The shore**: if the village touches water there is a **boathouse** (naust) with the boat drawn up, a **jetty**, racks of
  nets, and the path from the yard to the shore is the most worn one.
- **Fields** lie outside the fence on the flattest side: long strips of turned earth with a few rows, a scarecrow, a haystack.
- **The sacred**: a standing stone or a small shrine at the edge, a grove left standing, a grave mound beyond the fields.
- **Paths**: trodden earth from every door to the yard, narrow at the door and widening at the yard, gravel on the busiest
  (the yard to the gate, the yard to the shore).

So: a yard, a longhouse on its north side, the other houses round it with their doors to the yard, outbuildings behind,
fences round it all, the fields and the sacred outside, the boathouse at the shore. Random is **which** of these exist and
**where round the ring** they fall, never the logic.

## 2. How many people (without crowding)

| Village | Households | People | Houses | Site (tiles) |
| --- | --- | --- | --- | --- |
| Farmstead | 1 | 3 to 5 | 1 longhouse + 2 outbuildings | 14 by 12 |
| Small village | 2 to 3 | 6 to 9 | 1 longhouse + 1 to 2 houses + 3 to 4 outbuildings | 18 by 15 |
| Village | 4 to 5 | 10 to 15 | 1 longhouse + 3 to 4 houses + 5 to 6 outbuildings | 24 by 18 |
| Chieftain's seat | 6 to 8 | 16 to 24 | 1 great hall + 5 to 7 houses + 8 outbuildings, a palisade | 30 by 24 |

People per household: 2 to 4 (a couple, a child or an elder, a thrall for the richer). About one person in three is outside at
any time, walking between a door, the well, the yard and a workplace; the rest are "inside" (not drawn) so the yard never looks
like a crowd. Six to nine people on an 18 by 15 site is right for a small village: you meet two or three as you walk through.

## 3. How big the buildings are

The hero is one tile wide and walks comfortably in a two-tile corridor. Interiors are measured in whole tiles inside the walls:

| Building | Inside (tiles) | Notes |
| --- | --- | --- |
| Longhouse | 7 to 9 by 3 | the hearth down the middle leaves a tile each side; benches along the long walls; beds at the ends |
| Great hall | 10 to 12 by 4 | the chieftain's seat; a high seat at the far end |
| House | 3 to 4 by 2 to 3 | a hearth, a bed or two, a chest, a table |
| Storehouse on posts | 2 by 2 | crates and barrels; the door up a step |
| Byre | 3 to 4 by 2 | hay, a trough, no hearth |
| Smithy | 3 by 2 | open on one side; a furnace, a workbench, a trough |
| Bathhouse | 2 by 2 | a stone hearth, a bench |
| Pit-house | 2 by 2 | sunk: the floor is earth, a hearth, a drying rack |
| Boathouse | 5 to 7 by 2 | open to the water; the boat inside |

Gaps: **two tiles** between buildings (a cart passes, the eaves do not touch), **one tile** between a wall and the yard's edge,
the yard itself **6 by 5** for a small village and **8 by 6** for a village. Doors sit on the yard-facing wall, a tile in from
the corner, so the path from the door reaches the yard without turning. Windows face the yard too.

## 4. What you find

Every village has something to find; the generator picks from these by wealth and archetype, and places them where they
belong, so exploring has a logic ("the storehouse must have the food"):

- **Chests** in the houses (clothes, a few coins of the trade currency, a trinket in the chieftain's), **crates and barrels**
  in the storehouse (food, fiber, leather, arrows), a glint marks the full ones.
- **A hidden cellar**: a trapdoor under a rug or hay in one house; E opens it; inside a stash (the best loot) and sometimes
  a note or a rune (a lore line about the owner).
- **The smithy's bench**: free to use; sometimes a half-made weapon left on it.
- **The boathouse**: a boat drawn up; a raid can take it, trade can buy it.
- **A runestone** at the edge with a line of lore (who raised it and for whom); **a grave mound** beyond the fields with a
  cairn that a pick opens (bones, a ring, and a reputation cost).
- **The well**: a bucket of water (drink: a small stamina return) and, rarely, something dropped in it.
- **Animals**: a dog that follows you about the yard, hens, a goat tethered by the byre, sheep in the outfield.
- **Notices**: a carved post by the gate ("Ragnar's men took three of ours"), a shield rack with a shield to take.
- **Ruins**: an abandoned village (burnt hall, gaps in the palisade, rubble) keeps its cellar and its stones: the best finds
  with no one to ask.

## 5. Randomness that stays sensible

**Structurally** the generator is a ring plan with slots:

1. Pick the **archetype** (farmstead, small village, village, chieftain's seat, fishing hamlet, trading post, abandoned),
   the **wealth** (0 to 1) and whether a **shore** touches the site. These set the counts, the materials and the finds.
2. Lay the **yard** in the middle of the site (its size by archetype), the **fire pit** with its logs in the middle of it and
   the **well** off to its north-east.
3. Fill the **ring of slots** round the yard: north (the longhouse, always), then east, west, south-east, south-west, with
   the houses, shuffled by the seed; some slots stay empty so the ring is never the same.
4. Fill the **outer ring** with the outbuildings, each near what it serves and hugging the ring so far (the storehouse behind
   the longhouse, the byre by a house, the smithy and the pit-house at the ring's edge, the boathouse on the shore side).
5. Draw the **fence** round the whole (a low rectangle for a small place, the oval of stakes with banners for a rich one) with
   a gate on the path in, the **fields** outside on the flattest side, the **sacred**
   at a corner, the **midden** behind.
6. Paint the **ground**: an earth yard, gravel on the main paths, trodden earth from every door, moss at the edges.
7. Place the **people**, one household per house, with their spots and lines, and the **finds**.

**Visually** every knob has a palette, not a value: materials by wealth (wattle, planks, logs, stone), roofs by place (thatch
by the sea, turf inland, shingles for the rich), fences (rail, wattle, dry stone, palisade), colours of doors and shields,
the props round each door (a bench, a barrel, a woodpile, a cart, bee skeps, a log, a trough, a haystack), the size of every
building plus or minus a tile.
A village is fully described by its **seed, archetype, wealth and shore**, so it is saved as four numbers and regrown the same.

**In code** (`src/village.js`): `Village.DEF` holds every number above; `Village.make(seed, site, opts)` returns the game's own
building data (`floors`, `H`, `V`, `items` with `loot` and `store`, `roofs` to lay once the rooms are found, `paints` for the
ground brush, `props` for the world, `folk` with their spots and lines, `finds`), so the game writes it into `B` exactly as it
writes the hamlet. The Village Editor (`village-editor.html`) draws a generated village from the same data and tunes `DEF`.
