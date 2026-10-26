# Base building: a review, and how to make it fun (2026-10-24)

**Robin's picks of 2026-10-26** (through Colin, AD's picks page): **yes** to the cutaway, painted paths, the small shuttered window and the side-door porch, wall things, floor rugs and pelts, the lean-to and porch pieces, and lakes drawn as lakes, with wall things and rugs in **a Decorations tab** in the Building board (Robin: "We shouldnt do things automatically. But we also shouldnt add too much bloat"); **no** to the "make it lived in" button, the material styles and the painted door. Free building is chapter 1's, so they wait for it. The rest below waits for Robin.

Robin's ask, 2026-10-24: try building by a lake, on the beach and in the mountains, several floors, decorating inside, a little village
with paths; note what is lacking, what does not work and what is good; fix bugs on the way; talk it over with the Art Director; then
suggest how building can become fun and interesting, inspiring for creative players and simple for the rest.

Built by script through the game's own placing rules (`tools/visual/buildplay.js`), with free building on, on the big island.
Pictures in `docs/pictures/building/`, at Robin's size (1200 by 750):

| Picture | What |
| --- | --- |
| `01-lake-cabin.jpg` | A plank cabin by the inland lake, thatched, a gravel path to its door, a three-plank jetty |
| `02-beach-hut.jpg` | A fisher's hut on the south beach: wattle, a turf roof, a rack of fish, a fire, a jetty |
| `03-mountain-house.jpg` | A stone house on the fells: stone walls, slate, flagstones, a fireplace, a cairn |
| `04-mountain-inside.jpg` | Its inside, as the game shows it now (before the weeding fix: the plants on the floor) |
| `05-village.jpg` | The village: a two-storey timber longhouse, three houses round a green, fire pit, well, paths, a fenced garden |
| `06-longhouse-ground-floor.jpg` | The longhouse from inside, ground floor: the upper storey drawn see-through over it |
| `07-longhouse-upstairs.jpg` | Its upper storey: two beds, a chest, a rug |
| `08-plank-house-inside.jpg` | A plank house dressed with what the menu offers |
| `09-art-director-sketch.png` | Colin, AD's sketch: the cutaway, a path, a window and a side door that read from above |

## What is good

- **The pieces themselves look right.** Thatch, turf, shingle and slate roofs; log, plank, wattle, timber-frame and stone walls; the
  turf-roofed wattle hut on the beach reads as a real fisher's hut. Two storeys work and the timber frame shows both rows from outside.
- **The rules are clear and kind.** A roof appears by itself over a closed room; the stairs floor the whole storey above by themselves;
  walls can be swept in a line by holding the button; F takes a piece back for what it cost; a refusal says why (now more plainly).
- **The yard pieces and the fires** sit well in the ground (the cast shadow, the foot grass); the fells round the stone house look lovely.
- **The jetty** with its posts out over the water works.

## What did not work, and is fixed (commits 3acebf8, 4f96646)

1. **Plants grew through floors and inside walls**: flowers, heather and a juniper on the flagstones of a closed house. A laid floor now
   clears the soft plants on its tile, and a room of yours clears them inside when its walls close, remembered in the save.
2. **Every refusal said "Blocked, or not on land"**, even for a tree a step away. It now names what stands there: a tree, a rock, a bush,
   the water.
3. **A chair could not be drawn up to a table**: every piece of furniture kept a flat 24 units from every other. Now the two things' own
   footprints decide, and the refusal says "Too close to the table".
4. **Docks stopped two tiles off a steep shore** (depth -4), though the villages' own jetties go to -7. The player's now go as far.
5. **After loading a save, the ground round the hero's buildings showed as sea** until its pieces baked, in reading order from the top
   left. An unbaked land piece now stands in plain meadow green, and the nearest piece bakes first. (In the pane it lasted twenty
   seconds because the pane ran at one frame a second; on Robin's machine it would be a flash.)

## What does not work well (not fixed: each wants a decision or art)

- **The inside reads murky.** The roof drops to 12% but leaves its slate lines, its outline and two crossed beams over the room, and the
  room is dimmed. With two storeys, the ground floor shows the upper floor's planks, walls and stairs see-through over it (picture 06).
- **A door on a north, east or west wall cannot be seen.** From our camera only a south door shows. The two houses facing the green from
  its south side have invisible doors (picture 05).
- **A window reads as a second door** (tall planks in a frame).
- **The path brush paints a faint grey smudge** with straight soft edges, not a path (pictures 01, 05).
- **An inland lake is drawn exactly like the sea**: surf, a sand beach, turquoise, and sea depth four tiles out.
- **A village's whole planned site counts as its ground.** A fishing hamlet's 70 by 58 tiles reach down to a beach where its houses are
  far off, and nothing can be built there ("Not your ground to build on").
- **The board still offers a scarecrow and flower beds**, which Robin took out of the steading on 2026-10-22 as no Viking farm's.
- **The old drawn props** (dwarf birch and the rest) sit oddly beside the studio's pictures.

## What is lacking

- **Things to decorate with.** The furniture tab has ten pieces: bed, hearth, fireplace, chair, bench, table, barrel, crate, rug, chest.
  Colin, AD has already drawn a loom, stool, shelf, cupboard, cradle, three wall hangings, hams, a root bin, a cask rack, a sack pile,
  hanging fish, a bucket, a ladder and a quern for the villages, and a washing line, bee skeps, spear rack, torch bracket, banner,
  woodshed, porch, awning and lantern for the yards. None of them can be built.
- **Nothing hangs on a wall**, and nothing snaps to one.
- **Every house is a box of tile edges**: no porch, lean-to, annex or roofs at different heights.
- **No reason to decorate past a point**: comfort counts a roof, a hearth, a workbench, a bed, a rug and at most two other pieces. A
  dozen more things in a room earn nothing.
- **A house stands in clean grass**, as if dropped there: no trodden earth by the door, no wear, nothing against its walls.
- **Nothing helps a player who is not creative**: every wall is laid edge by edge; there is no house to start from.

## Colin, AD's view (in full in `C:\dev\SG\Art Director\out\building_review\VIEW.md`)

- **What the generator's houses have:** long and narrow proportion (2:1 to 3:1) with the gable and door to the yard; a yard round them
  (trodden earth, a fire ring, things against the walls, a path out); wear where people walk; lean-tos, porches and outbuildings; an
  inside dressed by the owner's trade.
- **Decorating:** nearly everything already exists and can go on the menu as it is (the list above). New first: things that hang on a
  wall and snap to it (shields, pelts, antlers, herbs, tools, a horn), rugs and pelts in sizes, a lean-to, porch and awning to build,
  a redrawn window, and replacements for the old drawn props.
- **The inside as a cutaway** (sketch panel 1): the roof gone, not ghosted; the north wall at full height to hang things on; the side
  walls as their tops; the south wall a knee-high stub with the doorway; the room in its own light and the world outside dimmed a
  little; only the storey he is on.
- **Paths as a ground layer** (panel 2): worn earth with a ragged fading edge (the villages' street ground already is this), gravel with
  pebbles you can see, stepping flags laid along the stroke, optional edging stones; and the ground wearing where the hero walks often.
- **Creative and rewarding:** a style from the materials (fisher, farm, fell, hall) with the menu offering that style's pieces first and
  a small comfort bonus for a matching set; a "Make it lived in" button that dresses a house as the generator does (he owns
  `village.js` and offers to lift its dressing out as a function); smart placement; free variants by tile; one painted door as the
  house's accent; life from the game running (smoke, glowing windows, washing, hens, wear).
- **The window** small, high, wider than tall, with shutters and a sill; **a side door** shown by its threshold, a trodden patch and a
  small porch (panel 3); **the lake** its own water (peaty shallows, reeds, lily pads, a grassy or muddy bank), a recipe like the shore's.

## My suggestions, in order

**Step 1: make what is there read right** (mostly mine, a little art; no new systems)
1. **The cutaway inside**, as Colin, AD drew it, and only the storey he is on.
2. **The redrawn window and the side door's threshold and porch** (Colin, AD), so a house can face any way.
3. **Paths that look like paths**: the earth, gravel and flagstone brushes as ground layers in the villages' own look, and the ground
   wearing where the hero walks.
4. **Every piece already drawn on the menu**, in the right tabs.
5. **A village's ground is its fence or its houses' footprint**, not its whole planned rectangle.
6. **The lake's own water** (Colin, AD's recipe).

**Step 2: make it fun and easy**
1. **House plans for anyone**: pick a hut (4 by 3), a house (6 by 4) or a longhouse (10 by 5) from the board and drag it out; its walls
   stand as a ghost and fill in as you pay for them, door and windows in sensible places. A creative player ignores it and builds edge by
   edge as now. This is the biggest help to a player who is not creative.
2. **"Make it lived in"**: one press dresses a finished house as the villages are dressed (Colin, AD's function), by the work done in it.
3. **Comfort that rewards a home, not a checklist**: variety counts (each different kind of thing adds a little, up to a higher top),
   and a house whose pieces keep to one style earns a small bonus. The rested buff lasts longer for a better home.
4. **Things that snap**: wall things to walls, furniture backing against a wall, a bench offering itself by the door.
5. **Shape**: a porch, a lean-to and an awning to build, and roofs at their own heights.
6. **One painted door** for the house's colour.

**Step 3: make the place alive** (some of it exists)
- Smoke from the roof while the hearth burns, windows glowing at night, washing that moves, hens and a goat in a fenced yard (the
  villages' livestock exists), flowers that grow where planted, the hirdmen using the house (sitting at the table, sleeping in the beds).

## Questions for Robin

1. The cutaway inside: yes, as Colin, AD sketched?
2. House plans (drag out a hut, house or longhouse as a ghost to fill): yes, or keep building edge by edge only?
3. "Make it lived in" as one button: yes?
4. Comfort by variety and a style bonus, in place of today's checklist of seven: yes?
5. The scarecrow and the flower beds: take them off the board too, as at the steading?
6. A village's ground as its fence or houses only, so you can build near one: yes?
7. The lake recipe, the window, the side door and the wall things from Colin, AD: which first?
