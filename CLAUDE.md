# Viking survival game: prototypes

2D top-down survival crafting game set in Viking-age Scandinavia (three-quarter camera, cartoon look). All art,
animation and sound is drawn or synthesized in code, with one exception since 2026-10-09: **characters may be modelled in
Blender and rendered to sprite sheets** (`art/`, `assets/sprites/`; a trial Robin wants to judge before it spreads). This repo
holds browser prototypes and editors, not a full game yet.

The game had another setting until 2026-10-04 (commit `59f5dd6` is the last of it; `main` has been the Viking game since the
`viking` branch was merged that day). **Nothing of it remains (Robin, 2026-10-09: remove every idea and concept of it):** the
pixel-sprite hero, its eyewear, the first prototype's scene, the blob body plans, the robot enemies and the Guardian boss are
gone from the code, and no new work may bring any of it back. This file is the source of truth for the direction.

## The game design, as decided so far

- **What makes it different:** raiding, exploring and expanding. You do not progress by killing bosses, as in
  Valheim; there are several ways to progress.
- **Raiding:** villages, castles and churches stand on the islands and can be raided for loot and for people to
  recruit into your clan. Churches have only friendly priests who cannot really defend themselves, so they are
  "lucky strikes", though an army may turn up. Some villages are for trading. There is one big central trading
  hub, heavily guarded, which it is unwise to attack.
- **The hird (clan members):** they crew your ships (the more aboard, the faster the ship goes, rowing and sailing), they can
  die in battle, they can work at home in your own village, and they defend places you have claimed.
- **The year:** a calendar of spring, summer, autumn and winter. After winter, villages, castles and other places
  that nobody has claimed are repopulated and rebuilt in generated ways. This keeps the map interesting and
  rewards claiming places.
- **Map layout (decided 2026-10-04):** the compass means something, the details are generated. North is always
  colder, south is richer and more settled ("England in the south"), east is rivers and trade, west is open ocean
  and the unknown. Which islands, coasts and places exist is new in every world, so it feels fresh each time.
  Distance from home sets how hard a place is; direction sets what kind of place it is.
- **Not decided yet:** how places regenerate naturally and how the year ends, how members are recruited,
  legendary Vikings and how their names spread, and attacks on your territory (Robin dislikes random raids that
  break your base). These, with suggestions, are in `docs/idea-bank.md`. Undecided ideas go there, not here.
- **World:** an archipelago. The world is water with islands everywhere, as in Valheim. Islands are big and so
  is the sea between them. One island can hold several biomes.
- **Difficulty:** each biome is harder than the one before it (confirmed 2026-10-04). That sits alongside the
  several ways to progress; it is not replaced by them.
- **Progression:** no gates, keys or locked doors between areas. Biomes are open, and you struggle in a biome
  until you have done certain things in earlier ones. Biome rarity changes with distance from the spawn point.
- **Decided 2026-10-05 (answers to the roadmap questions):** the hero walks too fast and will be slowed, and
  islands are made smaller for now (sizes can grow again later). Arrows are ammunition with different arrow
  types, but not stacks of arrows in the bag: a way to carry them outside the bag (a quiver) is to be found.
  Sleeping skips the night and you wake fully rested. The home island has an abandoned, broken village: it shows
  how a village is built and set up and that the world is dangerous, and it is where the first friendly person is
  met and the first legendary Viking is heard of. Raiding has a reputation system (risk and reward). Dying at sea
  is forgiving: the boat drifts to the shore of the island where you last slept and needs half its materials to
  repair. Currencies: more than one but not one per biome, a new one about every third biome; the first island
  trades in the basics (food, materials). Members are found and recruited in different ways, fight beside you on
  land as well as crewing and working, and have randomised stats and traits so each is good at different things,
  with training to change that. The band is the **hird** (Old Norse hirð, the sworn household band); a member is a
  **hirdman**, and they call each other fellows (decided 2026-10-05). A game day is 20 minutes of real time:
  day and dusk 20 minutes, then a night of 10 minutes (decided 2026-10-05).
- **Scope for now:** the starter island and travel to the islands round it, all of the first biome. None of the
  raiding, clan or calendar systems are built yet. `game.html` is the playable start (see "The game" below).
- **Decided 2026-10-07 (Robin's questionnaire, the night of the villages):** **villages across the islands** with generated names
  ("controlled generation"), the starter island empty of thriving villages (its village was raided; the story comes later), a
  **jetty by the sea** with a road up to the village and boats moored that cannot be boarded, roads between villages uncommon; the
  world is meant to grow to **lots of islands, many kinds of places** so each playthrough is new yet familiar, and later raiding and
  a kingdom across the world. **The map shows nothing until seen**: a place appears with its name once you have come within sight.
  **The raid** (twenty minutes or so) is built from **loot spread out with doors to break** (the storehouse, the church silver, the
  hall's chest, a hidden cellar) and **carrying the heavy loot to the ship** one piece at a time with hirdmen helping, the walk to
  the shore the gamble and the retreat under pursuit; **the defenders gather to the noise** of broken doors and fighting from inside
  the town (no bell, no castle sending waves, fighting not the biggest part). **The second biome is the south, settled lowlands**
  (oak, beech and ash, hedgerows, hay meadows and ploughed strips, orchards, chalk; walled towns, churches with priests, a manor),
  its islands mixing at the edges with the first biome's and starting a bit further from the starter island; it brings **iron**
  (bog iron, a bloomery, iron tools and weapons, mail, gambeson, an iron helmet, a painted shield), **the karve built in the yard**
  (mast, sail, more thwarts, iron nails and cloth), **new ground kinds** (ploughed field, chalk, marsh), **raiding** with silver as
  the second currency, and **a human jarl who holds the silver ring**, won by a raid on his hall; **nothing is off limits** in a raid
  (reputation is the only brake). The draugr is a side threat for later. The order after this: the biome, then a pass on island and
  map generation for balance.
- **Scale:** one tile (32 world units, about the hero's width) is one "unit" of Robin's scale brief, and 100 tiles
  are a kilometre. A normal island is 200 to 400 tiles across, large ones 500 to 700, small ones around 50, and
  tiny skerries (5 to 30 tiles) are common round the coasts. Most gaps between islands are 20 to 80 tiles, some
  only 5 to 15, some 80 to 150, and rarely 200 to 400. Islands cluster and form chains; coasts are irregular.
  The brief also says a normal island should take 20 to 60 minutes to walk across, which contradicts its own
  numbers (300 tiles takes about 80 seconds at the hero's speed). Robin has not resolved that; the Sea Editor
  shows walking and sailing times so it can be tuned.
- **Look:** happy, lush, green Scandinavia in daylight. No dark, shady scenes and no glowing "weird lights".
- **Ground:** never looks square. Outdoor ground must not show tile edges, stair-stepped borders or per-tile
  gradients: kinds of ground meet along smooth, ragged curves, and coasts curve. Sand is warm (no green or grey
  marks) and beaches are wide. Square tiles are fine only for built floors indoors.
- **Tone:** real Viking-age Scandinavia, not a copy of Valheim. Prefer things that existed (well sweeps,
  storehouses on posts, boathouses, fish weirs, bee skeps, charcoal pits) and real animals drawn with accurate
  proportions over fantasy monsters.
- **Base building:** free building piece by piece, walls on tile edges, and a roof that appears by itself over
  any space closed by walls, doors and windows and fades when the hero is inside.
- **Worldbuilding:** open, not cramped. Trees gather in groves with clear ground between them, undergrowth stays
  near the trees, small detail is scattered in the open, and there is room to build a base.
- **Environment objects** come in three groups, from Robin's lists: found in nature, left by people in the wild,
  and built by Vikings. Keep new props in one of the three.
- **Hero:** the smooth vector figure. Robin rejected a pixel-sprite look ("doesn't fit with the other graphics"). Since
  2026-10-09 a Blender-rendered hero exists beside it as a trial (`art/`); Robin has not chosen between them.

## Commands

```
npm start         # rebuild, then open dist/index.html (the start page)
npm run build     # python3 tools/build.py: stitches templates/ + src/ into dist/*.html
npm install       # once; only dependency is @napi-rs/canvas (fake canvas for headless tests)
npm test          # runs eight combat scripts in tests/ in sequence
```

There is no bundler, linter or type checker. `.claude/launch.json` has a `workbench` entry that serves the **repo root** on
port 8765 for the browser pane (since 2026-10-09, so the pages reach `assets/`: open `http://localhost:8765/dist/<page>.html`; the
pane has a tab limit: close old tabs if a page will not open).

## Pages

| Page (in `dist/`) | Template | What it is |
| --- | --- | --- |
| `index.html` | `index.html` | Start page |
| `character-editor.html` | `sprite.html` | Character Editor: the heroes (Eirik, Ásta, Hallvard on the ink figure), the Figure switch, concepts, styles, builds, templates |
| `blender-editor.html` | `blender.html` | Blender Editor (2026-10-09): the characters modelled in Blender and rendered to sheets (every `assets/sprites/<name>/` the build found, its JSON inlined through `__SPRITES__` in `tools/build.py` and the sheets loaded by path, `../assets/sprites/<name>/<file>`, since the Mixamo sheets grew to 22 MB): a Model picker (the first hero, the second in cel, painted and folk), its gear layers as toggles, Arena or **Night forest** (the kit's props in the Night Forest key with a campfire, painted once as the arena ground through `api.scene`), Add beast, Zoom (the drawing only), the sheet panel (a row per direction, a column per frame, idle or walk) and the sheet's numbers; walk with WASD, run with Shift, and the **Clips** keys (J sword, K bow, E lid, G pick up, C chop, M mine, V drink, X sit and stand, T hit, B die, L look) play the Mixamo hero's one-shot clips (`play`, `clip`, `seated`, `CLIPKEYS`). Draws the hero through `Combat.api.heroSprite`; the chosen model is kept in `blendereditor.model` |
| `creature-editor.html` | `creature.html` | Creature Editor: the six animals and their behaviour |
| `object-editor.html` | `objects.html` | Object Editor: tune one world prop |
| `sea-editor.html` | `sea.html` | Sea Editor: the archipelago, ships and sailing |
| `hird-editor.html` | `hird.html` | Hird Editor: roll a hirdman, tune stats, traits, jobs, food and the claim stone |
| `item-editor.html` | `items.html` | Item Editor: make a weapon or tool and give it to the game |
| `song-editor.html` | `song.html` | Song Editor: the game's music; a simple view with dice and a library, Advanced for the piano roll |
| `combat-arena.html` | `combat.html` | Combat Arena: fight wolves, boars, snakes and the bear with every weapon kind |
| `gathering-editor.html` | `gather.html` | Gathering Editor (2026-10-07): a field of trees, rocks and bushes; the gathering ideas as switches and sliders, presets, settings as text, "Use in the game" (`game.gather`) |
| `look-editor.html` | `look.html` | Art Direction (2026-10-07): the same scene twice, the flat look above and the ink look below (`docs/art-direction.md`), the rules as sliders, settings as text, "Use in the game" (`game.look`, merged into `kit.STYLE` on load) |
| `light-editor.html` | `light.html` | Light Editor (2026-10-08): lighting for a flat world, each technique a switch: cast shadows that stretch with the hour, the colour of the hour, sun rays, rim light, the fire's light at night, head form on the trolls; "Use in the game" (`game.light`) |
| `village-editor.html` | `village.html` | Village Editor (2026-10-07): the rules that grow a village (`docs/villages.md`): an archetype, a seed, the wealth and the shore, the numbers as sliders, settings as text, "Use in the game" (`game.village`) |
| `game.html` | `game.html` | The game: the first island, gathering, boars, inventory, the arm ring |
| `game.html?scene=runes` | `game.html` | Rune Editor (2026-10-07), the test scene of the big island: the game started at a carver's bench in a hut with a workbench, fireplace, bed and chest, and outside it a **furnace, a charcoal clamp and a campfire**; a dragon ring on the arm, every rune known, ore, charcoal, bars and materials in the bag. The board on the left (it folds on a click of its title): the ring's metal, know or forget every rune, bring beasts, day or night, skip to dawn (embers), **to the cave mouth, into the cave, to the troll's lair, the troll walking out (brings night) or walking home, veins and hoard full, more ore and charcoal**, back to the bench (finds the carver's bench), start over (clears the save without saving again: `noSave`). Its own save (`game.save.runes`). `SCENE` from the URL, `runesScene()`, `runeAct` |

Robin calls these by the page names. Every page has a "Back to menu" link to `index.html`. Adding a page means a
template and one line in `PAGES` in `tools/build.py`.

Robin works on a 34 inch ultrawide. The editors use a wide layout: content centred up to 2400px, a large game view
on the left (as big as the window height allows) and a settings column on the right. Each editor calls
`fitCanvas()` to size the canvas to its displayed size and sets `Combat.api.pixelScale` (canvas pixels per world
unit, 2 to 5). Anything a page draws in raw canvas pixels must use that scale, not a fixed 2.

Every editor follows the same pattern: a spec of plain numbers and colours, sliders and buttons that edit it live,
presets, "Settings as text" for copy and paste, and browser storage. Tuned values reach the code when Robin pastes
the text and it is made the default. When a spec's meaning changes, change the storage key so old saves are ignored.

## Source layout

- `src/art.js` (`GameArt.lib`): the hero (`playerD`, spec `HEROD_DEF`, `setHero`, `hero`), creatures (`creatureD`,
  `CREATURE_DEF`, `makeCreature`, `setCreature`), animals (`animal3D`, `ANIMALS`, `animalSpec`), and small drawing helpers.
- `src/stylelab.js` (`StyleLab.kit`): the world prop kit. `PROPS` (about 80 props), ground `TILES`, `bakeProp`,
  `bakeTile`, `blendTile`, and `STYLE`, the one shared look of the world. Every editor starts from `kit.STYLE`. **Since 2026-10-07
  `STYLE` is the ink look** (`STYLE_FLAT` merged with `STYLE_INK`, `look: 3`); `STYLE_FLAT` is the flat pastel look before it, kept
  for the Art Direction page's "before" canvas.
- `src/world.js` (`World`): the archipelago, shared by the Sea Editor and the game. `World.make(kit, opts)` returns a
  world: height field `E`, tile `grid`, `isLand`/`isWater`/`elevAt`, props in `buckets` (`plant`, `camp`, `addProp`,
  `removeProp`, `around`, `nearSolids`), lazy ground painting (`drawGround`), shore waves (`drawWaves`), `chart`.
  `World.KIND` and `World.HP` say what can be gathered. Island changes go here, once.
- `src/build.js` (`Build`): building pieces, used by the game (the Base Editor is gone). **Redrawn for the art direction (Robin,
  2026-10-07):** build.js has its own small ink toolkit (`INK`, `ink(c, pts, fill, o)`: the fill, grain and a cool shade toward the
  lower right inside it, a warm lit edge up and left, a thin hand-made line all round, `wob`, and the heavy line on the shadow side
  per edge, `heavy`; `stroke`, `knot`, `face` for the material inside a face, `cap` for a wall's top seen from above; exported as
  `Build.ink`, `Build.INK`, `Build.face`, `Build.stroke`). Every piece is a real material in the earth palette: **logs** (stacked
  rounded logs with a lit top and a dark seam, knots), **planks** (upright boards of varied tone with nail dots and a batten),
  **wattle** (withies woven over and under upright stakes), **stone** (irregular blocks of varied tone in mortar, never a grid),
  **turf** (sod strips with a ragged grassy top and tufts); a **door** of planks with two battens and an iron ring (edge-on when
  open); a **window** is a dark hole with a wooden shutter swung open beside it and a sill (no glass in this age); posts are timbers
  with a cap and grain lines; stairs, beams and the **chimney** (irregular stones) likewise. **Roofs are hipped, with real form** (Robin, 2026-10-07: more depth and volume, an
  overhang): `roofRects` splits a room into rectangles (far to near) and each gets a roof whose ridge is raised above the eaves
  (`rise`), four facets (the far slope lit, the near slope in shadow, the left hip lit a little, the right hip dark; `facet`), the
  eaves hanging past the walls (`overhang` + 1.5) with their thickness showing (the sod's soil edge, the shingle ends, the straw
  fringe down the sides too) and a shadow cast on the wall below and down the right side, hip lines in ink, the thin line all
  round and the heavy line along the eaves and the right side, a ridge pole and crossed ridge boards at the ridge's ends. Turf is
  sod with grass blades in two greens and flowers; thatch is rows of straw (level on the slopes, down the hips) with lit loose
  straws; shingles are scalloped rows that turn down the hips, each a shade of its own; all get grain. **Yard:** wattle fence, split rails with knots
  and a slight bend, a palisade of pointed logs with bark lines, a gate with a brace, and a dry-stone wall of irregular stones with
  capstones set on edge. The board icons follow the palettes. `node tools/visual/house.js` renders a house in every material under
  every roof with the yard pieces and the icons to house.png. The old `texture` and `box` helpers are gone. `WALLS`, `FLOORS`, `ROOFS`,
  `rooms(B, GW, GH, bounds)` (closed rooms by flood fill, and collision circles for walls and posts), `drawH`, `drawV`,
  **Gable roofs and taller walls (2026-10-07, Robin: pitched roofs with a gable end like his references):** `CFG.wallH` is 32 (a storey
  and a half; `UP` 36.75 follows it). `drawRoof` lays the ridge along a rectangle's long side: a room **as deep as it is wide** gets a
  **gable roof** with the ridge north to south, the west slope lit and the east in shadow, and the **south gable end facing you**: the
  end wall in the room's own material (`C.wallM`, from `Build.roomWallM(B, room)`; the game's `roofCfg` and the editor pass it) with a
  tie beam, a king post and two struts, the dark underside of the eaves above it, the bargeboards with the roof's thickness along
  them (`eaveEdge`: straw ends, sod or shingle ends along any line), the ridge pole and crossed boards at both ends; a **wide room**
  keeps the hipped roof, its ridge raised higher (`rise` up to 26). `C.gable` forces `'ns'` or `'ew'`. `tools/visual/house.js` draws
  deep houses too.
  `drawRoof` (turf, thatch, shingles), `drawPost`, `drawBeam`, `drawStairs`, `drawChimney`, `postsOk`, `postUsed`,
  `ensurePosts`, `edgeAt`, `icon`, `UP` (a storey). A building is `B = { floors, H, V, posts, stairs, roofs, items, up }`
  keyed `"x,y"`; `up` is the floor above with its own floors, walls, posts and roofs.
- `src/items.js` (`Items`): weapons and tools as specs ({ kind, mat, name, desc, size, width, sharp, glow, twist,
  curl, hue }), with `make`, `name`, `desc` (plain names like "Silver Axe" and a generic tale), `stats` (damage,
  gathering power), `draw` (in the hand, along a direction) and `icon` (in a slot). Kinds: sword, axe, pick,
  knife, bow. Materials: wood, flint, copper, bronze, iron, silver, gold. Shared by the engine, the game and the
  Item Editor. `Combat.api.items = { held(), tool(i), weapon(kind) }` tells the engine what is in hand; it then
  draws the item instead of its built-in shapes and uses its damage or power.
- `src/yard.js` (`Yard`): the parts a hull is laid from (`PARTS`: log, lashing, plank for the raft; keel, strake, rowing
  seat for the boat), the plans and their checks (`PLANS`, `check(yard)`), `connected`, `at`, `partOf`, `hullCells`,
  `fit(vessel)` (its size on the water and where you sit) and the drawings: `drawPart` (in a yard cell) and `drawVessel`
  (the raft or the boat on the water, from its parts), and **`Yard.scene`**: the Shipyard scene itself (the yard's ground and
  frame, the parts strip, plan tabs, the cursor, Finish; `enter(host, yard)`, `floor`, `ghost`, `hud`, `mousedown`, `wheel`,
  `key`, `walk`, `cam`, `heroSpot`) driven by a small host object (hero, costs, sounds, a grass tile, save, finish). The game
  and the Sea Editor both run it; the game pays costs, the editor's host makes everything free.
- `src/gather.js` (`Gather`): chopping, mining and cutting as a small game (Robin, 2026-10-07). `DEF` is the spec (`cfg`
  merges `game.gather` over it): the **sweet spot** (a glint on one side of a tree, one facet of a rock, wandering every seven
  seconds; a blow from that side bites `spotBonus` deeper), **rhythm** (a blow `rhythmAfter`..`+rhythmWindow` seconds after
  the last is clean, `rhythmBonus`; holding the button misses it), the **fall** (a felled tree fells the trees in its line,
  `fallFells`/`fallReach`, and hurts the hero standing there, `fallHurts`/`fallDamage`), **trunks** (a felled tree lies as a
  trunk, `kind: 'trunk'`, drawn by `drawTrunk`; every `chopsPerLog` blows a log of wood rolls out, `logsPerTrunk` logs), **nests**
  (`nestChance`: eggs, or honey with bees that chase you until a fire), **regrow** (stumps keep `day`; `regrowTick` turns them
  into saplings after `regrowDays` that grow up, `o.grow`), **cracks** (a crack on one facet of a rock, `crackBonus`), and
  toughness. `hit(G, o, ctx)` and `tick(G, o, dt, ctx)` take the hero, the clock, the sprite bounds and callbacks (chip, drop,
  sfx, decal, spawn, fell, hurt, bees, note); `drawProp` draws the lean, the cracks, the glint and the bar. The game's
  `Combat.api.harvest.hit`, its dying tick and `drawProp` go through it (`GT`, `gatherEv`, `trunks` saved, `bees`,
  `growTick`, `regrowTick` on each new day; eggs and honey are food). `tests/gather.js` checks the rules.
  **Robin's first settings (2026-10-07) are the defaults** (two logs a trunk). **No tag texts:** a sweet-spot or crack blow is a
  critical hit, its number gold and large, a clean (rhythm) hit a large white number; the page's `harvest.hit` answers
  `{ dealt, crit, clean }` and the engine draws it. **The swing pace** (`pace`, 2: about two swings a second; the engine's
  `api.gatherPace()` stretches the windup and recovery in gather mode) because the hero chopped too frantically. **The cue is a
  choice** (Robin: visual cue and simple positioning, never hitting about to find it): a tree's `spotLook` is a glint, a scar on
  the bark, the tree leaning toward its sweet side, or the sunny side (always the left, the side the light falls on, fixed), or
  nothing; a rock's `crackLook` is the crack itself, a pale vein, a patch of moss or the sunny side (the left, fixed), or
  nothing; all drawn on the body, not beside it (the trunk cues sit a couple of units off the trunk's middle, because the
  sprite's width is the crown's). With cracks on, a rock's sweet spot is its crack (no second glint). **The notch is the default for trees** (Robin, 2026-10-07:
  the sunny side's glow did not blend in; `spotLook` 5): a tree has no sweet spot until the first blow, which cuts a **notch**
  into the trunk on the side it came from (`o.notch`, drawn as a wedge with pale wood inside, part of the trunk); from then
  on blows from the **other side** are the back cut, bite `spotBonus` deep and fell the tree toward the notch, as a woodcutter
  does. Nothing to find: only where you stand. The sunny side stays the rocks' default. A trunk is the axe's right target (no "wrong tool").
- `src/fishing.js` (`Fishing`): **fishing (2026-10-08, Robin: a rod of iron in the lowlands, a fisherman who teaches the dishes, a fun
  minigame, a few fishes, a sunken chest now and then).** The round with no drawing: `start(R, depth, lowland)` rolls what bites
  (`roll`, `table`: herring everywhere in the sea, perch in the shallows, cod and salmon deep, pike in the lowland shallows, a
  **sunken chest** 3% of deep bites, `CHEST_CHANCE`) and begins the WAIT (3 to 9 s), then a NIBBLE (about a second of small dips: a
  press scares it, `'scared'`), the BITE (a window of about 0.9 s less the fish's fight: `press` hooks, else `'missed'`), then the
  FIGHT: `tick(st, dt, held)` with the reel button held lowers the fish's distance (60 to 120) and raises the line's tension, faster
  during a RUN (`st.run`, bursts every few seconds, rarer for lazy fish: `runs`); released, the tension falls and the fish takes line;
  tension 1 is `'lost'` (the line snaps), distance 0 `'landed'`. `FISH` holds each fish's name, weight range (`kg`, the roll squared
  so most are small), `fight`, `runs`, water and line; the chest never runs but is heavy. **Tuned by bots (`tests/fishing.js`, in
  `npm test`):** a careful bot (reel when calm and under 0.72 tension) lands everything, a greedy bot that never lets go lands most
  herring, a few perch and cod, and no pike or salmon; the lazy bot lands nothing. **In the game:** the **fishing rod** is an item
  kind (`Items.KINDS.rod`, a hazel taper with a line and a forged hook; a workbench recipe of 1 iron bar, 4 wood, 6 fiber, key
  `ironBar`; it goes to the Gather bar); with it in hand in gather mode, **E at the water casts** (`castSpot`: the first open water
  40 to 130 units along the way you face, deeper than wading), a cork float lands and the line hangs from the rod's tip
  (`drawFishing`); the prompt reads Waiting, Wait, **Hook it**, Hold to reel, Let it run; `fishTick` runs the round with `eHeld`
  (E down, tracked on keydown and keyup), the float comes in with the fish, its shadow shows under the surface, splashes ring, and
  a tension bar and a distance bar sit over the hero; walking off or putting the rod away ends the round. A landed fish goes into
  the bag as its own kind (`FISH_KINDS`: herring, perch, cod, pike, salmon, each with an icon and a tale; `inv.fish` counts them all
  and `takeItem('fish', n)` takes any) with "Perch, 1.2 kg"; the chest gives 4 to 12 silver and sometimes a weapon. `fishLog` (count
  and best weight per fish) is saved. **Dishes at the hearth:** grilled fish (1 fish, known once a fish is held), **fish soup** (2 fish,
  2 berries) and **smoked fish** (3 fish, 1 charcoal; lasts 20 minutes), the last two `taught: 'fishTaught'` by the fisherman. **The
  fisherman's hut** (`ARCH.fisher`, `lone: true`): `Village.plan` puts it on the smallest island (60 tiles or less, never a ruin), one
  old fisherman (role `fisherman`, four lines: where the fish are, the dishes, let the pike run) who teaches the dishes after his
  lines (`folkTalk`). The sandbox has a rod and the teaching. Debug: `Combat.api.debug().fishing()` (st, fl, log, cast, press, spot, hold).
- `src/village.js` (`Village`): **the rules that grow a village (2026-10-07, Robin's brief; `docs/villages.md`)**. `DEF` holds every
  number (gaps, the share of ring slots left open, people per house, the wealth that brings stone, logs, planks, shingles, a
  palisade, a dry-stone wall, a cellar; fields, the sacred stone, the midden, the grave, the ground paints); `ARCH` the
  archetypes (farmstead, small village, village, chieftain's seat, fishing hamlet, trading post, abandoned) with their counts,
  yard and site sizes; `BUILD` the buildings' inside sizes and what stands in them. `make(seed, site, opts)` grows the ring plan:
  the yard with the **fire pit** in its middle (prop `firePit`: a stone ring, a spit, big flames, a hearth and a light) and **log seats**
  round it (prop `logSeat`, `seat: true`; the villagers sit there, `spots` with `'sit'`, one to a log, and the hero sits with E:
  `seatFirst` lets a nearer log beat the fire's Cook), the well off to the north-east, the longhouse (or great hall) north of it facing south, the houses round it
  with their doors to the yard (shuffled, some slots open), the outbuildings behind near what they serve (storehouse, byre,
  smithy, pit-house, bathhouse, a boathouse on the shore; hugging the ring so far), **the fence** (Robin, 2026-10-07: a round
  defensive wall unless the place is small): a low rectangle of rail, wattle or dry stone with a gate for a poor or small place, and
  from `palisadeAt` (or a seat or trading post) an **oval of sharpened stakes** (prop `stake`, solid, `stakeStep` apart, every
  building corner inside it, a gap on the path in, open to the sea for a fishing place) with **banner poles** either side of the
  gate (prop `banner`); a worn gravel step and one or two things (`doorProps`) from a pool at every door, a woodpile with a
  **chopping block** (prop `choppingBlock`) at the longhouse; paths narrow at the door and wide at the yard (`pathDoor`,
  `pathYard`); the fields, the runestone,
  **the second pass (2026-10-07, Robin's two references: a winding road, gables, villagers who live):** **one winding road** (`road`,
  a Catmull-Rom curve laid as dabs, wandering, ragged; `roadW`) in at the gate or up from the water, through the yard past the fire,
  to the longhouse door and out by a **back gate** (`backGate`, the fence and the stake ring open there) instead of spokes to every
  door; **nature kept** (`V.nature`: birches, oaks, small bushes and flowers inside, rocks, bushes and trees in the ring outside, a
  bush against a side wall; `freeAt`; the game plants them as gatherable props); **things against the walls** (`clutter`: `windowBox`
  under every south window, `lantern` by the door with `lamp: true` (a small night light, no embers, no wolf fear: `drawNight`
  radius 0.4), `awning` on open-fronted buildings, `sign` on the hall and trading stores, `woodshed` at the longhouse, `foodTable`
  and a bench in a big yard); half the houses **deep** (`size('house')`: 2 to 3 wide, 3 deep) for a gable; **job spots** by role
  (`chop` at the block, `carry` at the well, `sweep` at the door, `fish`, `hang`, `smith`; the door spot is tagged `door`).
  the midden, a grave; earth under the yard, gravel from the gate and to the shore, earth from every door, moss at the edges;
  the things inside by building (hearths, beds, chests with loot, crates, benches, a shield rack, a furnace and workbench in the
  smithy, a trough, a hidden **cellar door** in one home with the best stash); the people as households with spots and lines by
  role. It returns the game's own data (`floors`, `H`, `V`, `items`, `roofs` to lay once the rooms are found, `paints`, `props`,
  `folk`, `finds`). `draw(c, V, env)` draws it for the editor; `siteFor(arch)` says what site to find. **The game's hamlet is
  grown by it** (`hamletSite` finds a site of the archetype's size, `hamletClear` grows it and makes the folk, `hamletBuild`
  writes it into `B`, paints the ground with `w.dabGround` and one `w.repaint`, plants the props; chests get their loot as
  stacks, `lootSlots`); `game.village` holds the editor's numbers. `cellarDoor` is a flat prop in the kit (a trapdoor with an
  iron ring). `node tools/visual/villages.js [seed]` renders one village of each archetype.
- `src/runes.js` (`Runes`): the skills as runes ({ id, name, norse, kind, text, active, cd, glyph }), kinds attack,
  guard, mobility, utility, hird; tiers by uses (common, carved at 50, legendary at 200); `glyph`, `stone` and
  `hollow` drawings for the casting cloth. **Thirty runes since 2026-10-08** (see "The thirty runes" under the arm ring).
- `src/music.js` (`Music`): the music, with no sound files. Songs are data (`Music.SONGS`: `birchGrove`,
  `oakAndWell`, `seaWind`, `meadowDay`, `meadowEvening`; the first four are day-theme candidates for Robin to
  choose between, each built round a short repeating hook): `bpm`, `chords` one per bar, `tracks` that are either written notes (`'F5:q. E5:e r:e'`:
  name+octave:length w h q e s, dotted with `.`, `r` rests, `+` chords, `@70` velocity) or a `pattern` played
  from the chords (`arp`, `pad`, `bass`, `comp`, `pulse`; drums `shaker`, `rim`, `kick`). A track's `tag` is
  `calm` (peace only), `danger` (fights only) or none (always); the game crossfades the two with
  `Music.setLayer`. Eight synthesized General-MIDI-like voices (piano, flute, clarinet, celesta, musicbox, harp,
  strings, bass) plus drums, a generated-impulse reverb, lookahead scheduling (`play(song, fromBeat)`, `stop`,
  `setVolume`, `at`), and `Music.midi(song)` writes a standard MIDI file. **The Song Editor (reworked 2026-10-06):** a simple
  view first (play, song picker with Built in / Library / Unsaved groups, peace or danger, tempo, key, volume, the tracks)
  and an **Advanced** button for the piano roll, the chords and notes as text and the song as text. **Dice:** New song
  (chords from good progressions, a melody, harp, bass, shaker, and the danger layer), New tune (another melody over the
  same chords: a two-bar motif repeated with small changes, chord tones on strong beats, scale steps near the last note),
  New chords, Shuffle instruments. **The library** (`song.library`) holds saved songs by name; working copies live in
  `songeditor2` and **the game never reads them**: it plays only what "Use in the game (day)" / "(evening)" hand over
  (`game.theme`, `game.theme.eve`, ids looked up in the library then the built-ins), which fixed songs changing in the
  game while being edited. Composing rules (early
  MapleStory style) are in `docs/idea-bank.md` under Music.
- `src/combat.js` (`Combat`): the arena engine: hero movement and combat, enemy AI, effects, rendering. The editors
  reuse it through hooks on `Combat.api`:
  - `scene`: `begin(c, P)` (camera and ground), `items(list)` (extra y-sorted things), `end(c, P)`, `bounds`,
    `walk(x, y)` (ground that can be walked on), `heroLift()`, `noHud`, `noHeroShadow`
  - `pixelScale`, `roster` (who starts in the arena), `dress(e)` (give an enemy its own look and numbers)
  - Collision is circles only: `W.pillars` holds `{ x, y, r, hide }`. Big maps pass only the solids near the hero.
- `templates/`: one HTML shell per page with `__ART__`, `__LIB__`, `__WORLD__`, `__BUILD__`, `__COMBAT__` placeholders.
- `tools/build.py`: plain string substitution. `tools/open.js`: opens the start page. `tools/visual/`: scripts that
  render things to PNG for checking (`props.js`, `creatures.js`, `walkcycle.js`, `swingdirs.js`, `attackstyles.js`: the attack styles).
- `tools/visual/figures.js` renders the ink figures (the hero in four directions standing and walking, the troll, a boar) to
  figures.png; `folk.js` the concepts.
- `tests/`: headless combat checks (table in `tests/README.md`).
- `docs/idea-bank.md`: ideas and open design questions that are not decided yet.
- `docs/beasts.md`: the cards and rules for Robin's creatures from Norse myth and folklore (troll, bysen,
  shapeshifter, huldra, tomtar, näcken, draugr, mara, jötunn, valkyrie), and the ore-at-night mining idea. Robin's
  lore and mechanics are marked; the rest are suggestions, not decided.
- `docs/start-loop.md`: the first hour against Valheim, Grounded and Enshrouded, our path from the wreck to the raft, what
  is missing, and the proposed start (smoke and cairn, the steading as the beginner base, finds, the first night, sitting
  and fishing, Brokk at the shore). A proposal, not decided.
- `docs/arm-ring.md`: **decided 2026-10-06:** the runes become the **arm ring**. Runes are knowledge (never items) cut into the
  coils of the ring and reddened with blood at the **carver's bench** (five health, a work bar, swap freely); coils are bound
  to a side (hand, foot, eye, heart); the metal is the rank anyone can read (bronze, silver, twisted silver, gold, dragon)
  and grows only with biome events (the bronze ring from the dead Viking at the back of the troll's cave); runes come from
  beasts, stones, deeds, Brokk, later bosses and raids, and must change what you do. The casting cloth is to be scrapped;
  nothing of the ring is built yet. `docs/roadmap.md` has the ladder of islands and their big events.
- `docs/runes-ideas.md`: the discussion that led there.
- `docs/weapons.md`: the weapon concept (2026-10-06, Robin: weapons that fight differently): six melee kinds (sword, axe, club,
  seax, spear, Dane axe) with a motion each (swing, thrust, smash), reach, arc, pace, chain length and one thing of their own
  (parry, guard break, stagger, crit, pierce, heavy), four ranged (bow, sling with stones from the bag, javelin and throwing
  axe that are thrown and lie where they fall), and ranged ideas not built (harpoon, fire arrows, bola). `PROFILES` and
  `RANGED` in `src/combat.js` hold the numbers; `Items.MELEE`/`RANGED` the kinds; the engine asks `api.items.weapon('sword')`
  for the melee thing in hand and `('bow')` for the ranged one, calls `api.onShoot(thing)` for a thrown thing and
  `api.onThrowLand(x, y, thing)` when it lands. The Combat Arena has a Weapons panel (kind and material; F swaps melee and
  ranged); the game's Admin menu gives one copper weapon of each kind; the first hand weapon is the **wooden club** (`woodClub`),
  not a stick sword. `node tools/visual/weapons.js` renders every swing in four directions; `tests/weapons.js` checks hits,
  pierce, chains and throws (in `npm test`).
- `docs/hird.md`: the concept for recruiting people and founding a town (claim stone, joining, jobs, muster); step 1 is built.
- `docs/art-direction.md` (**decided 2026-10-07**, Robin: the flat look felt like a mobile game): **the ink of Egerkrans, the light of
  Bauer**. One colour key per scene with one hot accent; shadows cooler and bluer than the light; an earth-and-bone palette; a
  hand-made warm brown-black line, thin toward the light and heavy on the shadow side; figures whole (two-pass outline); one sun
  upper left; grain in every fill; lean figures; trolls Bauer's. `docs/reference/` holds the board (Bauer and Kittelsen, public
  domain) and notes on Egerkrans pages from Robin's own book (the photos stay local). In the kit it is **`look: 3`** (`STYLE_INK`,
  `grain`): see "World look and props".
- `docs/chapters.md` (**read first when planning**, 2026-10-07): the world as **chapters** (Robin): 1 the starter island, 2 the
  first big island, 3 the second biome and the first raid, 4 and beyond by the compass. It holds the rules every chapter keeps,
  **the template** (ten headings in six groups: the place, the events, the living world, what you make and gain, travel, making
  and checking it), each chapter's status table (Built, Partly, Not started, Idea, Open) with its gap list, and the checklist
  to copy for a new chapter. Update its tables when a feature is built.
- `docs/roadmap.md`: **Goal 1, "leave the island"** (Robin, 2026-10-05) is at the top: the chain from landing
  with nothing to a raft (tools, gathering, food with stamina, leather, a comfortable house with a rug, Brokk
  the survivor who teaches the raft, the shipwright's bench on the shore, the second island), nine steps each
  with Have / Build / Test, and the order of work. Below it the older build order (steps 1 to 10) and open
  questions. Update it when a step is done.
- `dist/`: built single-file pages, committed to git.
- `art/` (**2026-10-09, the Blender trial**; `art/README.md`): characters modelled, rigged and animated by script in Blender 5.2 (on
  Robin's machine under Program Files; `tools/blender.js` finds it or takes `BLENDER`) and rendered headless to sprite sheets.
  `art/build/toon.py` is the shared look in the art direction (a toon node group: base tone, a cool shadow side under 0.66 of the
  light, a small warm light over 0.9, grain; one sun upper left; an orthographic camera 35 degrees above the ground looking north;
  Freestyle: a whole-silhouette contour in warm brown-black heavy toward the lower right by a calligraphy thickness, a thinner line
  at silhouettes inside and creases). `art/build/hero_build.py` builds **the new hero from scratch**: the ink figure's proportions
  (`INK_BASE` in metres, 1.8 m tall), rigid low-poly parts (tapered tubes, balls, wedges, a cut sphere for the hair) each bound to
  one bone of a basic rig (root, hips, spine, chest, neck, head, two-bone arms and legs with hands and feet), a belted bone-coloured
  tunic, trousers, boots, hair tied back in a tail, a short beard, dot eyes and brows, and the one hot colour, **the red cloak
  pinned at the left shoulder**; two actions, `idle` (48 frames: a breath, the right hand on the belt) and `walk` (24 frames, the
  legs and arms in opposite phase, a knee bend, a bob); gear as separate meshes in the Gear collection (`helm`: a cut-sphere bowl,
  a brim, a nasal, a spike; `mail`: a shirt, skirt and sleeves a little outside the tunic). The animations speak in (forward,
  twist, outward) degrees and `key()` converts to Blender's axes as `art/build/probe.py` measured them (on the hanging limbs +X
  swings backward, on the spine forward, +Z moves every tail toward world -X). `art/build/render.py` renders any character: every
  animation, eight directions clockwise from facing the camera (`s sw w nw n ne e se`, the rig turned about Z), eight frames, and
  the layers: `body` alone, each gear piece over the body as a **holdout** (so what the body hides stays hidden and the game can
  stack the layers), or `all` for checking; at double size (160 px frames at 1x, the figure about 135 px, the game's 3 px a unit),
  with `meta.json` (the foot anchor: where the origin lands). `tools/sprites.js` finds one crop box over every frame of every layer,
  keeps the anchor at a fixed pixel, **halves the frames with a smooth filter** (no nearest-neighbour: the line stays soft like the
  drawn figure) and packs a sheet per animation and layer (a row per direction, a column per frame) into `assets/sprites/hero/` with
  `hero.json`. `npm run art:hero` does all three; `npm run art:compare` writes herocompare.png (`tools/visual/herocompare.js`), the
  drawn Eirik beside the rendered hero. The raw frames in `art/render/` are not committed. **Nothing in the game reads the sheets
  yet**; the first batch of renders took about 0.4 s a frame. **In the Character Editor** (same day): a **Figure** group at the top
  of the right column, Drawn figure | Blender hero (trial), with Helmet and Mail toggles; the build inlines the sheets into that page
  (`__HERO_SPRITES__` in `tools/build.py`; data URIs at first, since 2026-10-09 the sheets' paths, which work from disk and from the
  server alike) and the page draws him
  through **`Combat.api.heroSprite(c, x, y, face, anim, dashing)`**, a hook in `drawHero` that replaces the drawn figure (no weapon
  or shield drawn with it): the direction from the facing angle (clockwise from south in eighths), idle or walk by `anim.amt`, the
  frame by the clock at the sheet's fps, the layers stacked body, mail, helmet; the Frames panel shows his sheet too.
  **The style test (2026-10-09, Robin: the Blender hero works but looks bland; redesign at 3.5 to 4 heads, three styles side by side
  over the Night Forest, do not change the game):** `art/build/hero2_build.py` is **the second hero**: about 3.75 heads, a big readable
  face (eye whites and pupils, brows, a nose, a mouth, a short beard), mitten hands and heavy boots, a strong silhouette (the red
  hood worn down as a cowl round the shoulders, a thick braid over the left shoulder, two belt pouches, trim bands at the hem, the
  cuffs and the neck), built in a **T-pose** for Mixamo (`art/source/hero2_tpose.fbx`, the joined body mesh); its own rig is rigid
  parts, **calibrated at build time** (`measure`: which local axis and sign swings each bone down, forward or outward, the forearms
  measured with the arm hanging), so `key()` takes `{down, fwd, out}` degrees; a basic 6-frame walk and a 4-frame idle (Mixamo is
  to replace them). `art/build/toon.py` has **three styles** (`restyle(style)` rebuilds every material from its stored `hex` and
  `pattern`): **cel** (two or three tones, the cool shadow, a warm rim where the surface turns from the camera on the sun's side,
  grain, the calligraphy line), **painted** (Bauer: smooth-stepped shading with no hard cut, colours pulled toward olive-brown, a
  mottled noise, pigment pooling at the edges, a thin brown line with a Perlin wobble) and **folk** (flat emission, a bold even
  line, **knotwork and woven patterns** on the trim from the mesh's Generated coordinates: the angle round the band and the position
  across it, `_pattern`). `render.py` takes `--style`, `--walkframes` and four directions (`s w n e`). `tools/visual/herostyles.js`
  paints a **Night Forest** from the game's props (the kit at hue 152 with blue-violet shadows, pines, birches, dead trees, hummocks,
  ferns, one campfire, a deep blue-green multiply with the fire's amber cut into it) and puts the three heroes over it at game scale:
  a 1.7x idle, the four idle directions at 1x, the walk at 1x; `npm run art:styles` does the whole thing (herostyles.png).
  **Robin picked the cel style (2026-10-09) and had the hero fitted to the world:** the face is a **painted decal** (`toon._paint_face`
  draws a 256 px RGBA image in Python, three eye styles by four expressions, packed into the .blend with a fake user before the
  materials refer to them; `_decal` projects it onto the front half of the head from the Generated coordinates; `render.py --eyes
  dot|oval|highlight --face neutral|blink|angry|hurt`); the modelled eyes, brows and mouth are gone, the nose bump and the beard
  stay. The **palette, ambient, light, line, grain and contact shadow values are in `docs/art-direction.md` section 7** and in
  `toon.py` (`SCENES`: `day` and `night`, `set_scene`; `AMBIENT_TINT`, `SHADOW_TINT_FIT`, `RIM_K`, `GRAIN_K`). **The night fit came out
  far too dark (Robin, 2026-10-09, with a screenshot of the game): the reference is the starter island by day**, so the palette is
  now the game's own hero's (Eirik's colours) and `--scene day` is the default; `tools/visual/dayisland.js` paints the starter island
  from `World` as the game draws it (`make`, `paint`, `contactShadow`, `sample`), `tools/visual/nightforest.js` the Night Forest;
  `tools/visual/herofit.js` writes herofit.png on the island (the drawn Eirik beside the first cel render and the fitted hero at game
  scale, the eye styles and expressions at 2x, 4x zooms of both). `assets/sprites/hero2-fit` is the fitted hero's eight-direction
  sheet. **The Blender Editor's default scene is the starter island** (`World.make` with one island of 60 tiles and the wreck,
  `__WORLD__` in the page; the Sea Editor's ground, waves, grass and bucket drawing; `nearSolids` for collision), with Arena and Night
  forest as the other two. **Nothing in the game changed.**
  **Mixamo (2026-10-09, Robin: get animations from Mixamo for the hero, in the built-in browser):** Robin signed in to mixamo.com in
  the browser pane and dragged the files into Mixamo's upload dialog (the pane has no upload tool). **Mixamo's auto-rigger fails on
  the hero's own mesh** ("Unknown error while generating motion": many separate shells with n-gon caps), so `art/build/hero2_proxy.py`
  makes a **rigging proxy** (`art/source/hero2_rigproxy.fbx`: the body joined, voxel-remeshed at 0.012 m into one watertight
  surface, decimated to 12,000 triangles, in the T-pose) that Mixamo rigs instead, markers at chin, wrists, elbows, knees and groin,
  skeleton **No Fingers (25)** for the mitten hands. Eighteen clips were downloaded (FBX Binary, 30 fps, no keyframe reduction, the
  idle With Skin, the rest Without Skin, walk and run In Place) into `art/source/mixamo/` with a README naming each file's Mixamo
  animation (Breathing Idle, Looking Around, Male Standard Walk, Running Forward Quickly, the two Stable Sword slashes, Standing
  Draw Arrow and Standing Aim Recoil for the bow, Standing React Large From Front, Death From Standing Idle, the axe's horizontal
  and downward strikes for chopping and mining, Picking Up, Opening A Lid, Male Drinking, the sit-down, Sitting Idle and
  Standing Up; Mixamo has no chopping, pickaxe or eating motion). The pane saves downloads to Downloads under temporary names
  (`mvfbx.sh` in the session moved each one). `art/build/mixamo_bind.py` binds the real parts to the Mixamo skeleton (the parts'
  vertex groups renamed to the mixamorig bones, hands on the forearms, `matrix_parent_inverse` so the FBX rotation and 0.01 scale
  do not move them), gathers every clip's action (the hand-made idle and walk removed first) and saves `art/source/hero2_mixamo.blend`
  with the armature under a 'Turn' empty that `render.py` rotates; it prints a check per clip (length, hips travel, lowest foot).
  `tools/visual/mixamocompare.js` (`npm run art:mixamo`) puts the hand-keyed idle and walk over the Mixamo idle, walk and run.
  **In the Blender Editor (2026-10-09, Robin: fix it so I can try it out):** `npm run art:mixamo:sheets` renders all eighteen clips in
  eight directions with a frame count per clip (`render.py --frames idle=16,walk=12,run=10,...`; `tools/sprites.js` reads each
  animation's count from meta.json) and packs them into `assets/sprites/hero2-mixamo` (one 164 by 164 frame, 22 MB of sheets: the
  frame box holds the death lying down and the hit's step back). The model **"Hero 2 with the Mixamo clips"** walks and runs on the
  starter island and plays its clips on the Clips keys: a clip runs once (`clip` = { name, t0, then }: the bow's draw hands over to
  the shot) and the idle returns; X sits (`seated` keeps the sit idle) and X again stands up. Because the sheets are no longer
  inlined, `tools/build.py` writes their paths and the workbench server serves the repo root.
  **In the game, as a trial (2026-10-09, Robin: test it in the game, walking, building, the sword and the bow):** the Blender Editor's
  **Use in the game** (and **Take back**) under the Model list stores the model's name in `game.blenderHero`; the game inlines every
  sheet's numbers (`__SPRITES__` in `templates/game.html`) and, when a stored model exists, draws its hero from the sheets through
  `Combat.api.heroSprite` (`sprDraw`, `sprPick`, `sprTick` near the top of the page). **The clips follow the game's actions:** walk and
  run (Shift) by the engine's `anim.amt` and `sprinting`; the sword's two slashes by the attack's phases (the clip's frames spread
  over the windup, the blow and the recovery from `Combat.api.stepData`, alternating by the combo; fists the same), chop and mine in
  gather mode by the tool in hand (the pick mines, everything else chops), the bow's shot (`fireT` rising plays `bow_shoot` once;
  the engine has no draw phase), the hit (`hurtT`), sitting (`anim.sit`), and the fallen hero (the death clip once, then its last
  frame, pushed from `scene.items` since the engine draws no hero when dead; it lies behind the engine's "You have fallen" banner).
  Nothing else changes: building, the bag, E and the world are the engine's. **Limits of the trial:** no weapon, tool, torch, shield
  or ring is drawn on him (the clips swing empty hands), the pick-up, lid, drink and look-around clips are not wired (the game has no
  such moments), and all eighteen sheets (22 MB) load with the page. Debug: `Combat.api.debug().spr()` (hero, last, clip, deadT,
  pick, draw, img). Played through in the pane: walk, sprint, both slashes, the bow, chop, mine, a hit, sit and stand on a placed
  chair, death and R, the Building board; no console errors. With the model taken back the game is exactly as before.

## Things to know before changing code

- `dist/` is committed. After editing anything in `src/` or `templates/`, rebuild so `dist/` matches.
- Source files are loaded two ways: inlined into a page by the build, and `require`d by Node scripts. Keep both
  working: no ES module syntax, no browser globals at load time. `stylelab.js` needs `global.__mk` for canvases.
- Git on this machine converts line endings (`core.autocrlf` is true), so files in the working tree have CRLF.
  Scripts that search file text for multi-line strings must normalise `\r\n` first. `build.py` writes LF.
- The tests have no assertions. They print values and exit 0 unless something throws, so a green `npm test` proves
  only "no crash". Read the printed lines against their labels and report mismatches. `btest.js` is not in `npm test`.
- Tests and render scripts write throwaway PNGs into the current directory; `.gitignore` covers PNGs in the root.
- Melee range is not just `reach`: a hit lands when distance <= `reach + enemy.r + 2`, and the player also steps
  forward during the active phase (`lunge`).
- The engine's enemy types are **`beast`** (chase and lunge, every animal), **`brute`** (a lunge, a chain of hits and a spin,
  with a stagger bar; the bear in the Combat Arena) and **`shooter`** (stands and shoots); `beastAI`, `bruteAI`, `shooterAI`
  (renamed 2026-10-09 from the old names). Pages dress them as animals with `api.dress`; undressed (the tests, the Character
  Editor's arena) they draw as a plain ink beast (`drawPlain`). There is no boss type.

## Hero

- **The ink figure (2026-10-07, Robin: a visual overhaul in the art direction, the body fully connected):** `playerD` and
  `trollD` draw in **depth layers** (far limbs, the body with its legs and head, near limbs; `lay(i)` in `playerD`, the troll's
  parts by their `dep`). Each layer goes to its own canvas (`inkLayerBegin`, `inkSwitch`, `inkLayerEnd` in `src/art.js`), gets
  the finish over its silhouette (the grain and a cool shadow side) and **one outline round the whole silhouette by dilation**
  (a tinted copy at a ring of offsets, thin all round, more and farther toward the lower right so the line is heavy on the
  shadow side), then is laid on the page. So an arm flows into the shoulder and a leg into the hip with no seam; only a real
  overlap (the near arm over the coat) keeps an edge. The parts' own lines (`LN`, the troll's `line`) are soft inner details
  in this mode; the per-part capsule and arm outlines are skipped. `lib.INK_FIG` = { on, w (the line, 0.62), line (the ink
  colour), grain, shade, soft }: the Art Direction page's "Grain on figures" and "Shadow side" set `grain` and `shade`
  (saved in `game.look` as `figGrain`, `figShade`); `on: false` gives the old per-part drawing (the page's before canvas). Needs
  `getTransform` (every browser; `@napi-rs/canvas` too). About 0.13 ms a hero, 0.4 ms a troll.
- **The hero drawn from scratch (2026-10-07, Robin: the leaned old figure "looks weird", make a new good-looking hero, keep the old
  for comparison):** `inkHero` in `src/art.js` is a new figure, chosen by spec key **`figure: 1`** (`playerD` hands over to it; 0 is
  the old rounded figure). About five and a half heads tall (Robin's pick: Hollow Knight and Egerkrans lean): `INK_BASE` and
  `inkMetrics(sp)` give the joints (the build keys headW, bodyW, legL and so on are factors on it; `lift` is what puts the
  shoulders where the engine expects them, `liftOf`); two-bone legs and arms with `ik2` (knees forward, elbows back, outward in
  the front view), `limbD` tapered segments, `blobD` rounded or sharp shapes, `jagged` edges for hair, beards and fur, `inkLine`
  detail strokes in soft ink and a warm lit edge (`LIT`) on the left. A belted tunic with a buckle and a pouch, leg wraps, boots,
  a neck, an egg of a head with brows, dot eyes (blink), a nose stroke and a mouth. All the style keys work on it: hair (crop,
  cropped, long, braids, knot, bald, shaved with a tail, wavy, mane), beard (full, short stubble, long braided, moustache), hat
  (hood framing the face, leather cap, nasal helmet, fur hat, headband), clothes (coat and vest, tunic, tunic and cloak with a
  brooch, apron dress with straps and brooches, fur vest). Side view (facing left, flipped for right) and front and back views
  turned by `an.turn`; the walk has a real knee bend, the body is highest when the legs pass, at rest one hand sits on the belt;
  the pose contract is playerD's (hand targets in figure space with the lift, `pose.lx/ly` the lean), so carried things, chops
  and swings land in the hands (`tools/visual/poses.js`). **Three heroes to pick from** (`HEROES`, `lib.heroes`,
  `lib.heroSpec(name)`; the Character Editor's **Heroes** group): **Eirik** (red hair tied back, a short beard, grey tunic, red
  cloak), **Ásta** (a fair braid, blue-grey tunic, green cloak, leather cap), **Hallvard** (dark knot, long braided beard, fur vest,
  headband). **Eirik is `HEROD_DEF`** until Robin picks; `HEROD_OLD` is the old figure's build, the **"Old figure"** concept and
  the editor's **Figure** switch (Ink figure | Old figure). Brokk, the Child concept and the villagers are rebased on it. **Storage
  keys changed** so old looks are ignored: the Character Editor keeps its work in `herotest2.*` and hands the hero over as
  `game.hero2` (every page reads that key); its Builds are factors round 1 and its sheet is paper with grain. Renders:
  `tools/visual/heroes.js` (the three, four directions, standing and walking), `herobig.js [name]` (one, large), `folk.js`.
- Drawn from a spec: `HEROD_DEF`, swapped with `lib.setHero(spec)`, read with `lib.hero()` (`{ spec, pal, lift }`).
  Proportions are factors on the original figure. The Character Editor edits it.
- `src/combat.js` compensates for longer legs (`heroLift()`) so weapons stay in the hands.
- North and south walking: arms swing opposite the legs; `sway` and `stance` control the side-to-side rock.
- Sword swings are drawn at their true angle in every direction (`visAngle` is the identity).
- Attack motion is in `ATK_STYLES` / `atkBody()` (spec keys `atkStyle`, `atkPower`). Visual only.
- **Styles and the matte look (2026-10-06, Robin: find a style for the humans of this world, matte like the trees):** the
  spec has `hair` (bowl, cropped, long, braids, knot, bald, shaved sides with a tail), `beard` (none, full, short, long
  and braided, moustache), `hat` (none, hood, leather cap, nasal helmet, fur hat, headband), `clothes` (the coat and vest,
  belted tunic, tunic and cloak, apron dress with brooches, fur vest) and `matte` (0..1: smaller highlights, softer
  colours, the outline browned toward the world's), with colours `cloak`, `dress`, `fur`, `iron`. `playerD` draws them in
  every view (`longHair`, `knot`, `tail`, `hood`, `hat`, `beard`, `torsoSide`, `torsoFront` inside it). The hero's own
  default is unchanged (coat and vest, no matte) until Robin picks. **`CONCEPTS`** in `src/art.js` (`lib.concepts`,
  `lib.conceptSpec(name)`) are nine whole looks: Karl, Shieldmaiden, Jarl, Thrall, Völva, Hunter, Húsfreyja, Child, Elder,
  all matte; the random people will be drawn from them later. The **Character Editor** lists them as Concepts, has Style
  rows (hair, beard, headwear, clothes), Builds, a Matte slider, templates saved in this browser (`herotest.templates`),
  and **"Use as the hero in the game"** (`game.hero2`, which the game sets with `lib.setHero` on load). The steampunk
  eyewear is gone (2026-10-09: from the code too). `node tools/visual/folk.js`
  renders the concepts in four views and a grid of every style to folk.png (`big` for the concepts large).

## People

- **Idles and jobs (2026-10-07, Robin: every villager stood the same way with the same bent arm):** `lib.IDLES` (rest, hips, crossed,
  scratch, look, stretch, lean) and `lib.idlePose(F, id, t, dir)` give a pose in the ink figure's pose contract (hand targets `armL`,
  `armR` for the front and back, `near`, `far` for the side, `lx`, `ly`, `turn`); `lib.JOBS` (chop, carry, sweep, hang, fish, smith)
  and `lib.jobPose(F, kind, t, dir)` the pose of a job over time with the thing in hand (`held`: an axe, a bucket, a broom, a rod, a
  hammer, drawn by `lib.figureHeld(c, x, y, dir, F, held)` after the figure); `lib.poseLerp(a, b, k)` blends two poses. `pose.turn` adds
  to `an.turn` in `inkHero`. **In the game** each villager has `idle` ({ id, t, dur, from, blend }: a new idle every three to nine
  seconds, blended over a third of a second from the last pose), `job` ({ kind, t } at a tagged spot, facing it, eight to sixteen
  seconds; one person at a job spot at a time) and `carrying` (after the well, the bucket is carried home at a slower walk; the bob
  is added to the pose); `pickIdle` weights them (a child looks about more). The Village Editor shows the same poses.

- Other people are the hero's figure with their own spec: `lib.makeFigure(spec)` then `lib.figureD(c, x, y, dir, an,
  pose, F)`. `FOLK` in `src/art.js` holds them (`lib.folkSpec(key)`); spec key `beard` adds a beard.
- The first is Brokk, a friendly dwarf smith (dwarfs are from Norse myth). He stands at the home camp in the Sea
  Editor and by the well of the broken village in the game, turns to watch the hero, and E talks to him (a speech
  bubble cycling through a few lines). He does not walk, trade or give tasks yet.

## The game (templates/game.html)

The first playable build, started 2026-10-04. One generated island from `World` (count 1), a camp with a jetty, and:
- **Gathering** through `Combat.api.harvest`. Trees, rocks and bushes have `kind`, `hp`, `max`. A tree leans
  more with each chop and shows a small bar, then falls away from the hero (rotation about its base), scatters
  wood along the trunk and leaves a stump decal. A rock cracks and shrinks as it is mined, then bursts into
  shards and drops stone. Bushes fade and drop fiber. Props are removed from their bucket when gone.
- **Drops** lie on the ground with a bounce, and are picked up by walking over them (+1 toast). **The bag** (Tab)
  is a wooden board that slides in from the right, under the chart, so it never covers the hero: 6 slots wide, 4
  high, stacks of 25, no weight (Robin: "no weight system, just slots"). The top row is the belt, numbered like the
  hotbar; a belt item shows in any hotbar slot the mode leaves free (`Combat.api.beltSlots`) and its number key
  uses it (food). Drag moves stacks, click eats food, **Sort** tidies the rows below the belt. `slots` is the
  truth; `inv` is a count per kind derived from it (`recount`), used by costs. A full bag leaves drops lying.
- **Animals** (step 1, 2026-10-05): all six, from the `ANIMALS` table in the page: count, ground ('grass' open,
  'dark' the denser ground, 'shore' grass by sand, 'far' dark ground over 700 from camp), collision radius,
  damage (`e.cfg.dmg`), aggro distance, home range, drops (meat, hide, antler; fractional = chance), and
  `flee` for the deer. Wolves come in pairs. Each ambles round a home range (`wanderStep`) and charges when
  the hero comes close. A missing animal of each kind wanders back in after a few seconds, far from the hero.
  They all still fight with the engine's chase-and-lunge; only the numbers differ (real per-animal attacks are
  still to do).
- **Scale (2026-10-05):** the hero walks at 84 units a second (was 118); islands default to 160 tiles (1.6 km)
  in `World.DEF`, the Sea Editor and the game.
- **Building** on **B** through `Build`: `PIECES` in the page, at low cost, placed with the mouse (drag lays
  floors, walls and fences), only on land, away from trees and rocks, within reach. **F** toggles the red crossed
  wreck cursor, which gives the material back in full. Closed rooms get a roof that fades when the hero is
  inside; walls are collision circles near the hero. `P.piece` and `P.wreck` hold the state.
  **The pieces (2026-10-05):** walls in five materials (logs, planks, wattle, stone, turf), door, window; floors
  in three (planks, packed earth, stone flags: `B.floors[key]` is the material index); yard pieces **fence**,
  **gate** and **palisade** (`Build.YARD`: they stop you, the gate opens as you come near, but they never close a
  room, so a yard stays open to the sky); **roofs** (turf, thatch, shingles: point at a closed room or its drawn
  roof; `B.roofs[roomId]`); and things from the prop kit: workbench, hearth, bed, chair, bench seat, table, barrel,
  crate, woodpile, drying rack, brazier (a light at night: `it.light`), well, haystack, shield rack, bee skeps,
  cart, dragon post. Prop pieces take their board icon from the baked sprite (`propIcon`, `ICON_SCALE`). The
  wreck cursor gives back what the piece cost (`pieceFor`, `costOf`, `costOfFloor`, `costOfItem`); laying a
  floor over another gives the old one back.
- **Houses with a frame, a floor above, thatch and chimneys (2026-10-06, Robin):** the Building board is laid out in rows
  by category (`BCATS`: Frame and walls, Floors and roofs, Yard, Furniture, Outdoors; 11 columns, from the top of the screen;
  a piece's `cat`). **The frame:** a **post** (1 wood) stands at a tile corner (`B.posts` keyed by corner; drag lays a row);
  beams are drawn between neighbouring posts with no wall between (`drawBeam`), so a frame reads as a frame; **posts are an
  option, not a rule** (Robin, 2026-10-06: walls go up without them; `Build.postsOk` is kept but unused); a post carrying
  walls cannot be wrecked. Old saves, the steading and the hamlet get their posts from
  `Build.ensurePosts`. **Stairs** (6 wood; `B.stairs` by tile, climbing north, `drawStairs`) go on a tile inside a closed
  room; a room with stairs gets **no roof but a floor above**: its tiles become the upper floor (`B.up.floors`, marked
  `B.up.auto`, laid again by `rebuildRooms`), seen from outside as a plank slab a storey up (`UP` = `Build.UP`, 30.75) that
  fades like a roof when you stand under it. Walking onto the stairs' lower half from the south puts you **upstairs**
  (`P.lvl` 1, `levelTick`; stepping back onto the lower half brings you down): the hero is drawn a storey up (`heroLift`),
  walks only on upper-floor tiles (`scene.walk` takes the mover, so animals are untouched), and his own shadow is drawn on
  the floor. Upstairs the build cursor edits `B.up` (walls, posts, roofs; more floor tiles only over a closed room below;
  the auto floor cannot be wrecked), things go into `B.items` with `it.lvl` 1, and a closed room up there (`roomInfo1`,
  only where every tile has floor) gets a roof. Wrecking the stairs needs the upper floor emptied first. `Bl()`, `RI()`,
  `sameLvl(it)` pick the floor you are on (beds, benches, chests, hearths and comfort are per floor; `comfortOf(ri, L)`).
  Upstairs the mouse points a storey lower (`my = mouseW.y + UP / K` in `buildTarget`), so the debug `place` hook needs
  `wy - 41` there. **The fireplace** (10 stone, 2 wood; prop `fireplace`, `hearth`, `chimney`) is a hearth built into a
  stone back; its **chimney** (`Build.drawChimney`: a stone stack with smoke) is drawn after the roof and rises a storey
  higher when the room has stairs; the **campfire** is a buildable hearth too (`isHearth(it)`: the stone hearth or any
  `it.hearth`). **Roofs** are drawn as turf (tufts, flowers, a log ridge), **thatch** (rows of straw, a ragged fringe hanging
  over the eaves, crossed ridge boards) or shingles (`drawRoof`; `dy` lifts it a storey; it fades with the alpha it is drawn
  under). **Yard:** a split-**rail fence** and a low **dry-stone wall** (`Build.YARD` `rail`, `drystone`); and **outdoors**
  the campfire, trough (new prop), scarecrow, flower bed, cairn and charcoal pit from the kit. The dragon post's id is `dragon`.
  **Ground and docks (2026-10-06):** floors double as paths and yards: gravel trail, grass, dark grass, moss and bare rock
  (`Build.FLOORS` with `bare`, no tile frame drawn) beside planks, earth and flags. The **dock** (2 wood; `water: true`) also
  goes on water beside land or another dock while the sea is shallow (`dockOk`: elevation above -4), draws planks with beams
  and posts at its open sides, and is walked on (`dockAt` in `scene.walk`); the boat is kept off it (`raftHull`). Upstairs the
  stairwell shows as an opening with the top treads and a rail (`slab`), and the floor above fades with its bundle (the bug
  was an alpha set instead of multiplied). The edge ghost marks the edge on the ground with a bright band and its two ends,
  so east and west walls are easy to aim; F closes the board when it turns on the wreck cursor. A board taller than the screen **scrolls** with the wheel over it (`menuScroll`, a strip at its right edge; `openMenu` caps `menu.h` and keeps `menu.full`).
- **The big-house test (2026-10-07, Robin: build a house four times larger, fill it, try to clip, stairs everywhere, several floors):**
  a 6 by 4 house with a hearth, workbench, bed, chest, table, chair and bench seat was built and walked by script (`tick(dt)` on
  `Combat.api.debug()` runs one step of the page and the engine without rendering: the solids near the hero, every page tick,
  then `Combat.update`; the key codes are `KeyW` and so on). Found and fixed: **the clip at the west wall**: upstairs the hero
  could stand on the very edge of the floor above (x on the wall line), and coming down the stairs there put him inside the
  wall's collision circle, which pushed him out of the house; now the upstairs walk test keeps him 7 units inside the floor's
  edge (`UM` in `scene.walk`), so he lands inside. **Stairs climb north**, so the tile south of them must be free floor of the
  same room ("Stairs climb north: leave a free tile south of them"); stairs in a south row were unreachable. **Nothing stands in
  a doorway** ("Keep the doorway clear"; a rug may). Several stairs in one house all work (three were tried: west wall, east wall,
  north row). **Floors: a house has one floor above and that is the limit** (stairs upstairs say "A house has one floor above"):
  Viking-age houses were single-storey with a loft at most, and more storeys would mean generalising `B.up` into a list of
  levels with the roof, fade and camera logic for each; not worth it.
- **Sitting (2026-10-07, Robin: do the chairs behave as they should?):** they did nothing. Now **E at a chair or a bench seat sits
  you on it** facing the room ("E Sit"; `sitting`, `seatNear`, `sitDown`, `standUp`, `sitTick`): you rest there, health 0.4 and
  stamina 12 a second coming back, the seat's own solid skipped while you sit; E again or any movement key stands you up a step
  in front of it ("E Stand up"). The ink figure has a seated pose (`an.sit`: the body drops onto the seat, thighs forward, shins
  down; `node tools/visual/sit.js`); the engine's `P.anim.sit` carries it.
- **Lighting (2026-10-08, Robin: the troll's face was flat like a painting; try lighting techniques in an editor):** the **Light Editor**
  (`templates/light.html`) draws a scene (trees, rocks, a woodpile, a campfire, the hero, the troll end on, a boar) through a lighting
  pipeline, each step a switch with sliders and an hour-of-day slider (or the day running): **cast shadows** (`castShadow`: a sprite's
  silhouette, cached in one colour by `silh`, laid on the ground with the transform `[1, 0, -sx, -sy]` so a point h above the base lands
  at base + (sx h, sy h); the sun's lean and the length from the hour (`sun(h)`: morning west, noon short and to the lower right, evening
  east), cool blue-black, soft by three offset passes), **the colour of the hour** (`GRADE` keyframes: a multiply tint and an overlay
  warmth by hour, blue at night; and the vignette), **rim light** (the pale silhouette offset toward the light under the thing),
  **sun rays** (soft wedges and a glow from the upper left, 'lighter'), **the fire's light** (a breathing warm circle over the night's
  tint, a lit rim and shadows cast away from the fire for what stands within 150 units) and **head form**. Figures are drawn into their
  own canvas each frame (`figure`) so they take shadows and rims like props. "Use in the game" stores `game.light`; the game takes only
  `faceShade` so far (`lib.applyStored`); the shadows and the colour of the hour are the next thing to wire into the game.
  **Head form** (`formShade` in `src/art.js`, `lib.FACE_SHADE.k`, 0.6): inside a head's or body's clip, a light from the upper left
  (a warm highlight), the far side turning cool and dark, and for a head the brow's shadow over the eyes, a shadow beside the nose on
  the shadow side, a lit cheekbone and the jaw turning under; `trollViewD` lays it on the head in every view and on the boulder's body
  (`blobPath` builds the same rounded path `blobD` fills).
- **The bed and the workbench redrawn (2026-10-08, Robin: weird and boring):** `bedObj` is a **Viking box bed**: a plank box with its
  foot end receding, four knobbed corner posts (the head's taller), a straw mattress with straw hanging over the rim, a **red wool
  blanket** with a cream folded hem and two woven stripes, a fleece at the head. `workbenchObj` is a **joiner's bench**: a thick planed
  slab (its end grain showing) on two splayed trestles with a stretcher, an adze, a mallet head up and two chisels on it, a plank
  leaning against a leg, shavings on the floor. Both through `shape` (ink line, grain, the cool shade).
- **The editors cleaned up (2026-10-08, Robin: a lot of bloat; remove what we do not need):** the **Creature Editor** lost the Rig switch
  (the game draws the view rig and so does the editor, always), the steampunk body plans (Blob, Critter, Brute, Floater, Crawler) and
  the first troll (plan 7, "Troll (old)", the `trollOld` template) from the board (`PLAN_SHOWN`: Animal, Snake, Boulder troll, Forest
  troll; a restored working design of another plan starts over), the Mouth and On top chips, the eye count, leg count and arm length
  sliders and the Movement panel (bounce, wobble, hover: the blobs' moves). The drawing code for those plans stays in `src/art.js`
  (the Combat Arena's undressed fallbacks and the tests use plans 0 to 4) but no page offers them. The **Combat Arena** lost the
  Classic | Sprite hero switch and the V key (`S.look` is classic). The **Character Editor** lost the Figure switch and the "Old
  figure" concept (`spec.figure` is 1). `lib.useAnimal` ignores a stored design of another body plan.
- **Furniture is sized to the hero (2026-10-05):** a hero is about 39 units tall, so the table, bed, cart, well,
  drying rack, shield rack, bee skeps and haystack are scaled down in `PROPS` (0.62 to 0.85), and the workbench is
  its own small trestle prop (`workbench`: planks, a hammer, a saw, a split log), no longer the table. Collision
  radii of the matching pieces were cut to match. Old saved benches still draw as a table.
- **The raft and the second island (step 9, 2026-10-05; Goal 1):** the game world now has **two islands**
  (`spec.count` 2, `dir` 0.1 so the neighbour lies east of the camp, `gap` 26 tiles, `gapVar` 0: `World.make` takes
  `dir`, the angle of the second island). Saves are keyed to the arrangement (`layoutKey()`, saved as `layout`): a
  save from another layout is dropped. The **raft** (`raft = { x, y, h, vx, vy, aboard }`, saved) is crafted at the
  shipwright’s bench from `RECIPES2` `raft` (20 wood, 10 fiber, 2 leather, taught by Brokk; one raft only) and
  placed in clear water near the bench (`raftSpot`, `raftHull`: eight probes round it must all be water). **E** by it
  boards (`raftUse`), **WASD** paddles it (54 units a second, Shift 1.35, smoothed, it slides along coasts, heading
  eases to the motion; the hero rides it, `raftAfter` pins him to it each frame and `scene.walk` allows water while
  aboard), **E** again steps ashore on the nearest land, looking ahead first. Stepping ashore on the second island
  (`onOtherIsland`: within 1.4 radii of `w.isles[1]`) sets `seen.left` and shows the banner **"You have left the
  island"** with the day. If the hero dies aboard, the raft drifts back to the camp shore. Hints: craft the raft,
  then board and find the other island. Animals are placed over the whole map, so the second island has beasts too.
  From camp the second island is about ten seconds of paddling.
- **The play-through (2026-10-05):** a fresh start was played to the bench (gather by walking over drops, craft in
  hand, fell, mine, cut, make a bow and arrows, hunt a deer, cure leather on the rack, cook and eat, build a hut with
  `place`, furnish it to Comfort 5, Brokk, the bench) and then the raft. Two bugs: the board reopened every frame in
  build mode (a comment swallowed the reset line) and a stick bow could not kill even a deer (0.7 an arrow; bows now
  do 2 x the material: 1.4). Console hooks used for this are on `Combat.api.debug()` (`place`, `pieceIndex`, `raftObj`,
  `raftUse`, `comfort`, `brokk`, `isles`, `dirty`).
- **The shipwright’s bench (step 8, 2026-10-05):** a board piece (12 wood, 2 stone; prop `shipwright`: two trestles carrying
  a keel timber with its curled stem and the first ribs; `it.ship`). It only goes on **sand** (`code` 1) within 4 tiles
  of the sea (`nearWater`), and only when your home has **Comfort 4** (`baseComfort`); the cursor says which is
  missing ("Build it on the sand", "Build it at the water’s edge", "Your home needs a roof, a fire, a workbench and
  a rug first"). Standing within 70 units of it adds a **Shipwright** tab to the B board (`shipNear`); its recipes
  are `RECIPES2` entries with `at: 'ship'`. The **raft** recipe (20 wood, 10 fiber, 2 leather) has `taught: 'raft'`,
  so `known()` is false until Brokk has taught it (`seen.raft`; the cell says "Someone must teach you this"), and
  `soon: true` until step 9 builds the raft. Hints: speak to Brokk again once the home is ready, then build the
  bench at the water.
- **The Shipyard (2026-10-05, Robin's design):** E at the shipwright's bench steps into its own small place (like the cave,
  east of the map at `YARD.X`): a stretch of plain grass in a wooden frame, the parts to pick down the left side, the hero
  in the bottom-right corner, and the build cursor laying parts in a 6 by 4 cell grid. **Parts are data** (`YPARTS`: id,
  name, cost, width in cells, the layer they lie on: hull, bind, deck, fit, and `on` for what they must sit on) and so is
  **what makes a boat** (`PLANS.raft.checks`: functions that return the line of guidance while unmet: three logs side by
  side, ends even, at most five, a rope on every log in two places, an oar). The guidance shows along the top; when every
  check passes a **Finish** button (or Enter) launches: `placeRaft(bench)` puts the raft in clear water, `raft.parts` keeps
  the parts for later drawing, the bench is `launched` and the yard cleared. One raft per bench while it floats. Right
  click takes a part back for its full cost; the wheel or the strip picks a part. The half-built yard is saved on the bench
  (`it.yard`), saving in the yard saves you at the bench, death leaves it. Until Brokk has taught the raft (`seen.raft`)
  the bench says "You do not know how to lay a hull". A ship with a sail later is more parts (`mast`, `sail`) and a second
  plan with a bigger grid. The old raft recipe is gone.
- **Raft or boat (2026-10-06):** the Shipyard's top bar has **Raft | Boat** tabs (`YARD_PLANS`; a plan can be changed only
  while the yard is empty). Parts carry a `plan` (`ALL_PARTS`, `yparts()` is the current plan's set). **The raft's oar is
  no longer placed**: it is drawn by itself. **The boat** (needs copper for nails, so it comes with the big island): a
  `keel` (wood and copper; three to nine in one straight unbroken row: its length, with the bow and stern shaped on its
  ends by the drawing), `strake`s (wood and copper; beside the keel, at most two rows each side, each against the keel or
  a strake nearer it: its width), and `thwart`s (rowing seats, one at least, oars drawn each side; the first is yours,
  more are for hirdmen to row later). `drawBoat` draws a clinker hull from the keel's length and the strakes' width,
  with strakes, bottom boards, stem and stern posts, seats and oars; you stand in the bow (`raft.seat`, `raftAfter`).
  **The boat looks like the Sea Editor's karve without its sail** (2026-10-06, Robin): the same clinker hull shape with
  planking, deck, curled stems at bow and stern, the steering oar, the rowing seats where they were laid with an oar each
  side that pulls when under way (`Yard.drawVessel`, `boatProfile`), and the near side of the hull drawn over the hero's feet
  so he stands in it (`Yard.drawVesselFront`). The halo is gone: a thin line of foam hugs the hull and a **wake** of
  ripples trails from the stern when moving (`drawWater`, from the vessel's `vx`, `vy`). A mast and sail come later.
  **The hull's shape follows the strakes (2026-10-06, Robin: "more room for creativity"):** at every keel column each side
  is as wide as the strakes laid there (`boatProfile`: a bare keel is a narrow canoe, each strake row adds about a cell's
  width on that side, smoothed with its neighbours so one strake makes a swell and not a step, and the ends draw in to
  the stems), so strakes at one end make a wide bow or a wide stern, a lone pair amidships a belly, and the two sides can
  differ. `shapedPath` draws the outline, planking, deck and foam through that profile; seats, oars and the paddle take
  the width at their own column (`profW`); `fit` takes the longest and widest for the collision ellipse. The rules
  (strakes within the keel's ends, at most two rows a side, each against the keel or a strake nearer it) are unchanged.
  **Where you sit (Robin):** alone, the hero sits aft (`seat` at -0.45 of the half length), **seated** behind the gunwale
  (the near hull covers him from the hips down) with a **paddle** in his hands going down the near side into the water,
  stroking when the boat moves (drawn in `drawVesselFront`); there is no steering oar; the oars are drawn only when there are rowers (`v.crew`, none yet), and then
  he stands halfway from the middle to the bow. The near hull is drawn only below his feet (`drawVesselFront` takes
  the hero's y) and `heroLift` sinks him 3 units into the hull, so he no longer clips.
  **Sailing is the Sea Editor's physics (2026-10-06, Robin: test in the editor, then take it into the game):** `Yard.sail(v, inp,
  dt, free, H)` in `src/yard.js` is the one sailing step for both pages (Direct or Tiller steering, top speed, acceleration,
  turn, glide, grip), with `Yard.HANDLING` the numbers per kind (the boat: Tiller, 100; the raft: Direct, 54). **"Use in the
  game"** under the editor's handling sliders stores `game.boat`, which the game's `handling(kind)` merges over them (the raft
  gets a slower share). Shift pulls harder. `Combat.api.debug().giveBoat('boat')` puts a test vessel by the hero.
  **The karve (2026-10-08, built; the first ship, Robin: built in the yard):** a third plan in the Shipyard (`YARD_PLANS` `karve`;
  `Yard.partsFor(plan)` gives a plan's parts with their costs for that plan, `Yard.costFor`: the keel, strake and rowing seat are shared
  with the boat but cost **iron bars** for nails instead of copper) and three parts of its own: the **mast** (5 wood, 4 fiber; layer deck,
  on the keel), the **sail** (18 fiber; layer fit, on the mast) and the **steering oar** (3 wood, 1 iron bar; layer fit). `PLANS.karve`:
  a keel of **five to nine** in one row, the strake rules of the boat, **two seats at least**, one mast on the keel amidships (within one
  cell of the middle), one sail on the mast's cell, one steering oar at the keel's **stern (its left end)**. `fit` gives a boat or karve
  `seats` (the thwarts' x along the keel), `rowers` (two a seat), `mastX` and `sail`; on the karve you stand **at the stern by the steering
  oar** (`seat` -0.62 of the half length) and there is no paddle. `drawRig` draws the steering oar on the right-hand side aft (it turns
  with the tiller, `v.rud`), the mast with a pennant, and the **square striped sail**: full and bellied toward the bow when `v.sailFill`
  is up (the Sea Editor karve's trapezoid, stripes, grain, a lit side and folds, sheets down to the rails), else **furled** along the yard
  with ties. **Wind and rowers in `Yard.sail(v, inp, dt, free, H, wind)`:** `wind = { a, k }` (the way it blows and its strength);
  a vessel with `v.sail` gets `top * (1 + k * max(0, cos(a - h)))` while driving forward, so a wind behind is up to 1.5 times the speed
  and a wind ahead costs **nothing** (a buff only, the reward rule); each rower (`v.crew`, capped by `v.rowers`) adds `Yard.WIND.rowK`
  (7%) to top speed and acceleration. `Yard.HANDLING.karve` (Tiller, 115, accel 42, turn 1.3, glide 3.2, grip 0.72). **In the game:**
  `wind` wanders slowly through the day (`windTick`: a new target every 70 to 150 seconds), a small **arrow on the chart** shows its way
  while a karve is afloat, `handling(kind)` takes `game.boat` only for the kind it was stored for (`kind` in the stored object; the raft
  still takes a slower share of the boat's) and its `windK`. **The crew:** hirdmen following you within 150 units step aboard when you
  board a boat or karve, as many as the seats take (`crewBoard`; `m.aboard`, saved), sit two to a seat facing aft (`raftAfter` seats
  them; `an.sit` through `drawFolk`), and row (`raft.crew`); **stepping ashore inside your territory they step off with you**
  (`crewAshore`), on any other shore they **keep the boat and wait** (the hird never walks the open world; the territory rule rests
  while aboard, and E does not offer them). The finish toast and the chart label name the karve; `giveBoat('karve')` gives an
  eight-keel karve with three seats. **The Sea Editor:** the Karve tab in its yard, a launched vessel brings its own handling to the
  sliders, three more sliders (Wind strength, Wind blows toward, Rowers aboard), and "Use in the game" stores the kind afloat and the
  wind strength. `tests/karve.js` (in `npm test`) checks the rules, the fit and the speeds; `node tools/visual/boats.js` renders the
  karve furled and under sail with rowers. `drawFolk` skips the idle pose for a figure without an idle (a hirdman has none yet).
   **The water test follows the hull** (`raftFit` sets `hw`, `hh` from the parts;
  `raftHull` probes an ellipse of that size, turned with the heading, at 0.8 so there is a little room). The vessel is
  saved with its `kind` and `parts`. One vessel afloat at a time.
- **The map (M, 2026-10-06):** a board with the whole sea (`drawMap` from the chart), the wreck, your stones with their
  reach, the vessel, and the places of interest: known ones named (the steading, the hamlet, the cave), unknown ones a
  **question mark** at their spot. M or Esc closes. Animals: boar 4 and deer 5 on the starter island (8 and 7 on the big).
- **One bounds box (2026-10-05):** the engine clamps every mover to `scene.bounds`, so swapping bounds for the cave or the
  yard dragged all the animals in. `worldBounds()` now covers the map, the cave and the yard at once and never changes;
  the `walk` test keeps the hero on the floor he is on.
- **Crafting on E (2026-10-05, fixed 2026-10-06):** E at a workbench opens its board (Workbench and "By hand" tabs; the tab
  set follows `menuFrom`, where the board was opened from, so switching tabs keeps it); B keeps Building and Crafting (the
  hand recipes: first tools, torch, stick weapons, arrows). **Recipe boards are laid out by category** (`CATS2`: Tools,
  Weapons, Armour, Supplies; `cat` on each `RECIPES2` entry): one row per category that has something known, a small
  label over the row, and the board shrinks to the rows it uses. The bars sit on their own board (`BAR`) above the bag.
  Leaving the yard (or saving in it) lands you on free ground by the bench (`landNear`), never in the water. The E prompt
  over the hero is a small dark pill with a key cap.
- **The hamlet (step 5, 2026-10-05):** a living village on the big island (`hamletSite` from the seed, 12 by 10 tiles, away
  from the cave): four wattle huts with thatch round a green, a well, woodpile, haystack, drying rack, a barrel and a
  crate with a little in them, and a fence (`hamletBuild`, a fresh start only, saved in `B`; the roofs via `roofLaters`).
  Seven to nine **folk** (`folk`, remade every start from the seed, not saved) are the hero's figure with hair, coat,
  trousers, build and beard from a small palette (`lib.folkSpec('villager', R)`), named from `FOLK_NAMES`. Each walks
  between a few spots (their hut door, the well, the woodpile, the green; `folkTick`, 38 units a second), waits, turns
  to watch you within 110 units, and E gives one of two lines in their own voice (`FOLK_LINES`: Ragnar's men, the
  east, the troll, the hall in the south). They do not trade or fight. Coming within 420 marks the hamlet on the chart
  (`seen.hamlet`). `bubble(c, who)` and `drawFolk` draw them; Brokk uses the same bubble.
- **The hird (2026-10-06, step 1 built; concept in `docs/hird.md`):** **Robin decided:** a claim stone costs stone and
  berries (the red for its runes); several stones, to expand and take places, but it must be a decision, so every stone
  after the first needs a hirdman with you who stays as its **keeper**; no food means slow and sad, never leaving; they
  can die but never at random (illness and the like later); Brokk is the first hirdman; muster at the stone now and from
  the Jarl's high seat later (anything with `muster`); **the hird follows and works only inside your territory and on
  raids, never in the open world** (hard to balance). `src/hird.js` (`Hird.DEF`) holds every number: stat ranges, traits,
  jobs (`place`, `rate`, `takes`, `gives`), meals a day, the hungry pace, the stone's reach and growth, speeds, the claim
  cost, names and looks; `Hird.roll(R)` makes a person, `figureSpec` their figure. The **Hird Editor** (`hird-editor.html`)
  rolls people and tunes it all; "Use in the game" stores `game.hird`, merged over the defaults on load.
  In the game: the **claim stone** piece (`claimStone` prop, the runestone at 0.68; `it.claim`) and the **toppled stone**
  by the broken steading's well (`fallen`, drawn lying; E and 6 stone raise it: `raiseStone`). A raised stone has a
  **reach** (`reachOf`: 25 tiles plus one per roofed room inside) drawn as a dotted ring on the chart, a name, and shows
  "room for N, food for D days" when you stand near (`roomFor`: beds, and a roofed hearth per four; `foodDays` from
  meals in chests inside the reach). Raising Hildir's stone makes **Brokk join** (`brokkJoin`: `npc` becomes `hird[0]`
  with rolled stats). **E at a hirdman** toggles follow (only inside the territory; stepping out stops them), **E at a
  workplace with a follower** gives the job (`assignTo`: workbench crafter, woodpile woodcutter, hearth cook, a stone its
  keeper), **E at a stone** opens the **muster** board (click a name: comes or stays). Jobs yield into the chests inside the
  reach every `rate` seconds, taking what they need (`hirdTick`); at dawn each hirdman eats a meal from the chests or is
  `hungry` (half pace). A second stone needs a follower, who becomes its keeper. `hird` is saved (Brokk by flag).
- **Comfort (step 6, 2026-10-05):** a closed room is worth 1 for its roof and 1 each for a hearth, a workbench, a
  bed and a rug in it, and up to 2 for furniture (chair, bench seat, table, chest): at most 7 (`comfortOf`, per room
  index; `baseComfort()` is the best room within 500 units of the camp, so the steading does not count). The dial
  by the chart shows "Comfort N" while you stand in a room (green from 4); sleeping there leaves you **Rested for
  N x 2 minutes** (`restedMax`); 4 is what the shipwright's bench will ask of your home. The **rug** is a flat
  piece (leather 2, fiber 4; `PIECES` `flat`, prop `rug`, drawn under everything, only rugs block rugs). The hints
  walk the house: walls and a door, a hearth inside, a workbench, a rug (Comfort 4), a bed.
- **Storage (2026-10-05):** a **chest** is a buildable piece (8 wood, prop `chest` in the kit) with twelve slots
  (`it.store`, saved with `B`, things remade on load). **E** at a chest opens it with the bag: the chest's board
  takes the character panel's place on the left; a click on a stack moves it across (`transfer`), drag and drop
  works between the two boards (chest slots are numbered from 100 so `slotGet`/`slotSet`, `slotAt` and `dropOn`
  reach both), and dragging off the boards still drops on the ground. It closes when you walk away. A chest
  with things in it cannot be wrecked ("Empty it first"). **Crates, barrels and chests break** under a tool in
  gather mode (`BREAK`: the axe is the right tool; `harvest.list` offers them as boxes, `breakBox`): what was
  inside falls out (village loot `it.loot`/`it.thing`, a chest's contents) plus a little wood. The village's
  crates are opened this way, not with E; a glint marks those still holding something.
  **The build cursor:** a faint dotted tile grid round the cursor, the piece drawn where it would stand (green
  glow when it can go there, red when not), and a label by the cursor with the name and cost, or the reason it
  cannot go there ("Too far", "Not on land", "Something stands here already", "Need 2 wood", "Point at a closed
  room"); the wreck cursor says what it gives back (`ghostLabel`, drawn on the HUD).
- **Build menu:** right click in build mode opens a big centred wooden board (8 by 4 cells, most empty for later
  pieces, a "Building [n]" tab); click a piece to pick it. Wrecking is only on F (no cell for it). Pieces are not
  in the hotbar: in build mode the bar shows the belt, and the chosen piece is named in the bar's label. The mouse
  wheel steps through tools, pieces or the belt slot (`P.sel`). A hearth is a buildable item (`B.items`, drawn
  as a prop, solid, cookable); the camp hearth stays.
- **Robin's panel notes (2026-10-07):** the character panel has a third tab, **Ring** (`drawRingTab`): the metal and its hollows,
  the ring drawn, then every hollow with the rune cut in it and its line, or "Empty hand hollow", and below what is known but not
  cut. **Things stay inside their slots:** every slot draws a thing's icon through `itemIcon` (clipped to the slot: the bag, the
  bars, the gear slots, the station strip). **A station's "Ready" strip is an inventory row**: eight boxed slots like the chest's,
  click to take. **Cancel:** when something is on the way, a Cancel box beside Craft takes the last queued one off (the hearth's,
  the furnace's or the hero's queue) and gives its materials back into the bag, or onto the ground when it is full (`infoCancel`,
  `refund`). Queues were already capped by what you can pay (`pay` on every press).
- **The boards in the art direction (2026-10-07, Robin: the bars, the toolbars, the bag, the windows and the cooking panel):**
  `wood` is planks across with grain, a thin ink line all round and a heavy one below and to the right (`uiLines`), a warm lit
  edge and iron nails; `leather` an even hide with grain and a vignette, no smudges, a stitched edge and brass rivets;
  `parchment` cream with grain and a worn edge; `slotUi` a recessed grained slot with an ink line, gold when chosen; `buttonUi` a
  carved button with a brass edge that fills with progress. The bag, the bars' board, the character panel's slots, the recipe
  boards (the list on a dark strip, the chosen thing on a parchment page with dark ink text, carved Craft, Cook and Cancel
  buttons, carved tabs) and the Ready strip use them. The engine's `bar` is a dark recess with an ink line and a lit top edge in
  muted red and green; `slotBox` and `roundIcon` (the hotbar) are dark wooden recesses with ink, gold in hand. **The gear
  slots:** helmet, cloak, tunic, trousers, boots on the left; shield, **necklace, two rings, two trinkets** on the right
  (`EQUIP`, `equip` keys `neck`, `ring1`, `ring2`, `trinket`, `trinket2`, each with its glyph); hovering a slot names it
  ("Ring: empty"). Nothing fills the new slots yet.
- **HUD bars and the stats board (2026-10-05):** the health and stamina bars are small (60 units wide, the stamina bar
  longer with a meal) with the numbers beside them ("72 / 100"), drawn in `drawHud` in `src/combat.js`. The character
  panel has two tabs, **Gear | Stats**: the stats page (`statRows`) lists health, stamina (and how fast it comes
  back), attack (the damage number you see in the world, and the heavy swing), arrow damage, crit chance (15%) and
  crit damage (x1.5), defense (the share of a blow turned aside, at most 60%), walk and run speed, and the chop, mine
  and cut power of the tools in hand. It reads the live numbers, so food, gear and tools change it.
- **The character panel** slides in from the left on Tab while the bag slides in from the right (one key, two
  boards; Robin: fewer menus). Wood outside, leather inside; the hero drawn large and turning in the middle
  (`playerD`, like the Character Editor), five equipment slots on the left (helmet, cloak, tunic, trousers, boots)
  and four on the right (sword, shield, bow, amulet), all with faint glyphs when empty; only the sword and bow are
  "equipped" and nothing can be changed yet. Below, **the quiver**: three arrow slots (one arrow type each, up to 40),
  outside the bag; the gold one is in use and a click chooses another. The bow shoots from it
  (`Combat.api.canShoot`/`onShoot`), the count shows by the bow icon on the hotbar, 70% of arrows that hit
  nothing land as pickups that go back into the quiver (`onArrowLand`), and a new game starts with 20 wood
  arrows. Arrow types and making arrows come with the workbench (roadmap step 3). Saved with the game.
- **Crafting (2026-10-05):** you start with nothing in your hands; branches and stones lie round the camp
  (`campScatter`). Recipes (`RECIPES2`) are made by hand anywhere or at a **workbench**, a buildable piece that
  only works with a roof over it (`benchRoofed`: the room flood fill). **Recipes are learnt from their key
  ingredient** (Robin, 2026-10-05; `key` on each `RECIPES2` entry: stone for the flint tools, fiber for the bow, arrows
  and torches, leather for armour and the shield, wood for the stick sword; the raft is `taught` by Brokk): a recipe is
  listed once you have first picked up its key (`seen`, saved) and not before. **There are no question marks**: an
  unknown recipe is simply absent (`known`, `dishKnown` for the hearth), and a quiet "Something new to make" toast
  marks a discovery.
  Hand: flint axe, knife, pick, **wooden club** (2 wood; the stick sword is gone), **stick bow** (3 wood, 2 fiber), 5 arrows. Bench: flint
  sword, 15 arrows, wooden shield, leather helmet, tunic, trousers, boots, cloak, all made of **leather** (nine
  for the set). A tool made into an empty slot goes straight into your hand. Gear is worn in the
  clothing slots and turns a share of blows aside (`Items.stats().armor`, `Combat.api.armor`), up to 60%.
  The **B board** has tabs: Building, Crafting, Workbench (when near one) and Hearth (when near a fire; E opens
  it there). It opens with build mode and closes when build mode is left; picking a building piece enters build
  mode. The old hearth panel is gone: one board for everything made. **Esc** opens a menu: Continue, Sandbox (full kit, materials, every recipe known), Restart with
  nothing, New island. The quiver starts empty; drops on the ground are saved.
- **Things** (weapons and tools) live in bag slots as `{ kind: 'item', n: 1, item: spec }`, never stacked, and in
  `equip` (weapon, shield, bow, trinket, axe, pick, knife, and the clothing slots, empty for now). Right click in
  the bag equips (swapping what was there back), right click on the panel takes off, dragging off the boards drops
  the thing on the ground, walking over it loots it. A new game starts with an iron sword, a wooden bow and flint
  axe, pick and knife. The hotbar's tool and weapon icons are the equipped things; an empty tool slot means no
  gathering with that tool. Hovering a thing shows a leather card with its numbers and tale. The Item Editor's
  "Give to the game" puts a thing in `localStorage` (`game.give`) that the game picks up on load.
- **The arm ring (2026-10-06, built; design in `docs/arm-ring.md`):** runes (`src/runes.js`: eleven at first, thirty since 2026-10-08, each with a `side` hand,
  foot, eye or heart, a `source` and one line) are knowledge, never items. `RS` = { learnt, earned, deeds, kills, stones }.
  **Nothing is learnt before a ring is worn:** deeds (`DEEDS`: fifteen trees, five meals, a minute of sprinting), kills
  (`BEAST_RUNES`: ten boars, wolves or adders) and stones (`STONE_POOL`) *earn* a rune (`earnRune`), and the ring brings
  what was earned (`learnEarned`, one rite each). **The bronze ring** lies on the dead Viking (`cave.body`, prop `deadViking`)
  behind the troll's lair; E takes it (`takeRing`) with its rite. Brokk shows the riposte once you wear a ring and have heard
  his story. **The carver's bench** (piece `carver`, prop `carverBench`, 6 wood, 2 stone, 2 copper, under a roof): E opens
  the ring board (`drawRingBoard`: tabs by side of known runes, the ring with its coils, `Runes.ringD`); click a rune and a
  four-second bar (`cutting`, `cutTick`) cuts it into its side's coil for five health (`Runes.cut`; filing away what was
  there); the coil glows. A rune is alive only in a coil (`inUse`); the character panel shows the ring under the gear and the
  hero wears it on his arm (spec `ring` by metal rank, `armBand` in `playerD`; Brokk bronze). **What the runes do** goes
  through `Combat.api.mods` (sprintCost, riposte, charge, roll, heavyblow; `modZ` in the engine defaults to off) and the
  page: riposte (a parry opens a heavy blow, `P.riposteT`), boar's charge (sprinting into a beast, `chargeT`), sure feet,
  wolf's run (night speed 1.25; wolves calm unless `e.struck`), roll (longer dash, longer invulnerable, slower rise), stone
  sense (ore glints by day, every third rock to your feet), snake's eye (beasts within 300 on the chart), heavy blow (hold
  the tool, let go: three blows), hearty, hearth warmth (heal by any fire, a rough night rests 2 minutes), long breath (no
  swimming yet). No tiers. The casting cloth, the pouch icon and the C key are gone; `SHOW.runes` is true. Debug:
  `ring()`, `RS()`, `takeRing`, `earnRune`, `cut(id)`, `openRing()`. `tests/ring.js` checks the rules and the hooks.
  **The thirty runes (2026-10-08, Robin: expand the rune system, thirty runes):** nineteen more in `src/runes.js`, each
  with a source and one effect, all earned the way the first eleven are (`DEEDS`, `BEAST_RUNES`, `STONE_POOL` or a meeting) and alive
  only in a coil (`inUse`; `runeMul(id)` is 1 or 0). **Hand:** keen edge (twenty-five beasts slain: crit chance +10%, `mods().crit`,
  `modZ('crit')` in the engine), wolf's hunger (ten deer: a kill heals 8), bowman's eye (twenty-five arrows loosed: arrows bite a third
  harder, `mods().arrow` on the projectile, and every batch fletched is half again as many). **Foot:** light step (a stone: beasts
  notice you at 0.7 of their aggro ring, `mods().stealth`, and the troll's sneak rule at 0.6), long stride (three hundred seconds
  walked: speed 1.1), sea legs (leaving the island: the vessel's handling 1.2), night eyes (ten days lived: you see 42 units in the
  dark instead of 14). **Eye:** woodsman (fifty trees: `powerMul('tree')` 1.25), quarryman (thirty rocks: 1.25 and an extra stone a
  rock), quick hands (thirty things made: crafting in half the time, cooking twice as fast), deep pockets (the bag full once: stacks of
  40, `STACK`), fisher's patience (ten fish: the line's tension rises 0.7 as fast, `st.patience`), ember keeper (twenty charcoal: a
  torch burns twice as long, four embers a fire at dawn), bee friend (five honey: bees never chase you), builder's hand (fifty pieces
  built: every piece costs 0.75, `buildCost`). **Heart:** thick skin (a stone: 10% more turned aside), deep sleep (ten nights slept:
  rested twice as long), iron stomach (twenty raw things eaten: raw food heals double), fellowship (Brokk joins: the hird works 1.3
  as fast, `jobT`). Long breath now does something: you wade where others must swim (`scene.walk` allows elevation above -2.6 with it).
  `tests/runes30.js` (in `npm test`) checks the list, that every rune the game names exists, that every rune is used and can be earned,
  and the engine's new mods; the Rune Editor knows all thirty.
  **The bench reworked (2026-10-07, Robin's seven points):** the ring is a **flat cuff** (`Runes.ringD`: a wide band seen a little
  from above, open at the right, knotwork cut along it, the cut ends showing its thickness) with small **round hollows** for the
  runes (`Runes.hollowAngle`); a cut rune fills its hollow red with the glyph in the metal, an empty one is a dark recess with
  its side's letter. The board: tabs and the list on the left (a click **chooses** a rune, nothing is cut by accident), the ring
  on an **iron slab** with a blood bowl at each side and veins cut from them to the ring's mouth, and under it a **leather window**
  with the chosen (or hovered) rune's name, Norse name, side and line, the reason it cannot be cut, and a **"Carve it in"**
  button (Enter too; `ringSel`, `ringBtn`, `cutWhy`). **The rite** (`startCut`, `cutTick`, `ritePh`): the five blood are paid at
  once with a slash and drops over the slab, the blood runs down both veins to the mouth, round the band
  (`Runes.ringBloodPath`) to the hollow, fills it, and the rune glows. The carver's bench is a station in `stationNear`
  (`kind: 'carver'`), so E takes the bench you look at when it stands by a workbench or a fire.
- **The Book of Beasts** (L, or the small book by the chart): a leather-bound book over a dimmed screen, two
  parchment pages. Left: the beast drawn live by `creatureD`, turning slowly, its name and folk name, a tab row
  of all beasts. Right: lore, strengths, weaknesses, warning sign, drops, where found. A page is earned the first
  time you slay that creature (`learn(key)` from `onDeath`; `e.kind` names it); unknown beasts are dark
  silhouettes with "?". `BESTIARY` holds the cards (all six animals written, only boars exist in the game yet);
  `book` (slain counts) is saved. Creature ideas (Norse myth and nordiska väsen) are in `docs/idea-bank.md`.
- **The broken village (step 6, 2026-10-05):** Hildir's steading, abandoned, on the home island. `villageSite`
  finds a flat 14 by 12 tile stretch of grass **900 to 1600 from camp** (Robin, 2026-10-08: a wander first; nearer only when the island
  has no room) from the island seed; Brokk's campfire stands a step away from him so E does not muddle the two; `villageClear` (every
  start) clears its trees and bushes, scatters rubble and places Brokk; `villageBuild` (a fresh start only)
  writes the pieces into `B`, so they are saved and can be wrecked for their wood and stone: a burnt log hall
  with five gaps knocked out and a hearth inside, a small wattle hut still whole with a thatch roof, a bed and a
  crate (a house to learn from), a stone house half gone with a barrel and the well beside it, a palisade with
  gaps and a gate on the north side, a fence, and a woodpile, cart, drying rack, haystack, shield rack, brazier
  and dragon post. **Crates and barrels with `it.loot`** (counts per kind, `arrows` to the quiver, `thing` a
  made item) show a glint; break one with the axe and it spills out (`breakBox`). **Brokk** (`npc`, the dwarf figure from
  `FOLK`) stands by the well, turns to watch the hero, and E talks to him. **Simple on purpose (2026-10-05):** three
  states (`brokkState`, lines in `brokkLines`): *meet* (four lines: he is the last of Hildir's steading, Ragnar
  Ironside's crew burnt it, some were taken as thralls, some went with them, the rest are dead; build a home), *wait*
  (one line naming what your home still lacks: walls and a roof, a hearth, a workbench, a rug) and *teach* (once
  your home has Comfort 4: three lines, then `seen.raft` is set and a toast says he taught you the raft; step 8's
  bench will read it), then *taught*. The story always comes first (`seen.met` after all four lines). He does not
  Old saves get the cleared site and Brokk but no pieces.
- **The first minute (tested fresh 2026-10-05):** you land on nothing; 12 branches and 9 stones lie on land
  round the camp, never within 82 units of where you land (`campScatter`), and three lone trees (oak, birch,
  pine) stand 170 to 300 from camp (`campTrees`) so the first axe has something to fell. Things lying within
  56 units slide toward you if the bag has room. **B opens on Crafting until you hold a tool.** Guidance is
  subtle (Robin): the only hint line is three bare key reminders at the start (`HINTS`: "Walk over the things lying
  about", "Press B", "Press Q"), each gone when its condition is met; nothing states a goal. The chart marks the camp's fire, and the
  steading once you have come within 380 of it (`seen.village`). Drops per thing (`TREE_WOOD` oak 6, pine 5,
  birch 4; `ROCK_STONE` rock 3, formation 6; bushes 2 fiber, berry bushes 3 berries and 1 fiber): a day's work
  reaches 40 wood, 20 stone and 15 fiber. Deer (2 hide) and a boar (1 hide) live within 800 to 900 of camp
  (`nearN`, `nearMax` in `ANIMALS`). **The drying rack** (`dryingRack` pieces, the village's included): E hangs
  hide on it (up to 4), 90 seconds later E collects leather (`rackUse`, `rack.hang` saved with the building;
  wrecking returns the hide); `leather` is a kind of its own in the bag.
- **Sound:** on in the game (`S.sound = true`); the Combat Arena's synthesized set copied into the page, plus
  chop, clink, fall, pick, craft and build. The engine calls `sfx('chop'|'clink')` on tool hits.
- **Day and night (step 2, 2026-10-05):** `day = { t, n }`, `t` in seconds over a 30 minute cycle (`DAY_LEN`
  1800): day until `DUSK_AT` 840 (14 min), dusk to `NIGHT_AT` 1200 (20 min), night to `DAWN_AT` 1740, then dawn.
  `light()` is 0 by day and 1 at night, `dusk()` the warm glow between. `drawNight` multiplies a small
  screen-space canvas over the world (warm at dusk, blue at night, never black: the HUD and hotbar are drawn
  after it and stay clear) with the camp hearth, built hearths and the hero cut out as light. A **bed** is a
  buildable piece (6 wood, 4 fiber; `it.bed`). E at a bed from dusk on sleeps: the screen fades, the clock jumps
  to morning (`day.n` + 1), health and stamina are full, and if the bed was under a roof (`benchRoofed`) you are
  **rested** for 10 minutes (`rested`: +0.3 health a second, stamina returns 30% faster through `mods().stam`).
  Sleeping rough just skips the night. A dial by the chart shows the sun or moon going round, with the day
  number and time of day on mouseover and the rested ring. `day` and `rested` are saved. No night-only
  beasts yet.
- **The night (Robin, 2026-10-06): dark, and the wolves.** Night should feel dangerous so that home with a fire feels safe.
  The night overlay is far darker (deep blue, with an amber dusk), you barely see yourself without a torch (14 units), the
  torch is a warm flickering circle, fires have a bright core and a long soft reach that breathes, and **embers** drift
  up from every fire and the torch (`drawEmbers`). No stray lights: ore no longer glows outside (the cave keeps its glow).
  **Wolves** exist only at night (`nightTick`): when the light passes 0.6 a pack of three comes in 380 units off on the
  island you stand on (`nightWolves`, `e.night`), with a howl; at dawn what is left slinks away (removed, not killed). One
  pack a night. They are far stronger than the day beasts (`art.js` wolf hp 22, speed 1.75, lunge 1.4, windup 0.35; the
  attack cd 0.8, speed 320; the game's `dmg` 22, `aggro` 220) so the answer is a roof and a fire, not a fight; their
  **eyes glow red** in the dark (`drawWolfEyes`). **Fire keeps them off** (Robin): a wolf never comes within 140 units of a hearth, brazier or
  campfire (`nearestFire`; it shies back out of the light), and while you stand in that light the pack prowls the ring
  outside it (`e.prowl`, `e.ringT`) and after about sixteen seconds gives up and runs off into the dark (`e.gone`, removed
  twenty seconds later). So running to a fire is safety. The clock's sun-and-moon icon is gone; a note says "The light is going"
  at dusk. **Brokk's campfire** (a `stoneHearth` with `light`) burns by the well at the steading, so the first night shows
  what a fire does. **Copper is not on the starter island** (`markOre` skips island 0); it begins on the big island with
  the cave.
- **Fixes of 2026-10-06 (Robin's second night list):** the turquoise shallows can be waded (`w.isWade`: elevation above
  -1.1; the walk test allows it). **The Shipyard is free-form:** a 9 by 6 yard at zoom 1.2, parts go anywhere, and the
  raft's rules leave room for shapes: at least three logs, every log touching another (`yardConnected`), at most eight,
  a rope lashing on every log, an oar. The launched raft is **drawn from its parts** (`drawRaft` lays each log, lashing,
  plank and oar in its cell round the hull's centre; old rafts use `RAFT_DEFAULT`). **The claim stone is built** from
  the Building board (stone, berries and **snake blood**, a new drop from adders: `Hird.DEF.claimCost`); the toppled
  stone at the steading is gone, and Brokk joins when your first stone stands anywhere, once you have heard his story.
  **Stamina:** a tool swing costs 4 stamina (never blocks a swing). **Cooking takes time:** a dish is paid at the hearth
  and cooks 4 seconds a piece in a queue on that fire (`cookTick`, `h.cooking`), with a bar and a count over the fire
  (`drawWorkBars`); the finished food goes into the bag or drops by the fire. **Crafting takes time:** hand 2 seconds,
  bench 3 (`CRAFT_T`), queued (`crafting`), a bar with the thing's icon over the hero, then the chime and "Made ...".
  **Healing by the fire:** inside a room with Comfort 1 or more and within 140 of a fire you heal 0.6 a second. The
  **comfort and rest line** is back under the chart ("Comfort 4   Rested 3:20"). Death resets the night, so a new pack
  comes. **Lights reach three times as far** (fires 145, the torch 170; the wolves' fire-fear ring is 230).
- **Hidden for now (Robin, 2026-10-05):** the runes (casting cloth, C, the pouch icon, runestone reading,
  skills on the hotbar, rune toasts) and the Book of Beasts (L, the book icon, page toasts) are built but not
  finished, so `SHOW = { runes: false, book: false }` in the page hides them until the basics are right. The
  data still runs underneath (`book` counts kills, deeds count) so nothing is lost when they come back.
- **Music (2026-10-05):** off by default (`OPTS.music` 0; Robin): the bar in the Escape menu turns it on; it
  then starts at the next key or click (browsers require it). A day theme
  by day (`dayTheme()`: the Song Editor's "Use in the game" choice in `localStorage['game.theme']`, else
  `meadowDay`; the candidates are `birchGrove`, `oakAndWell`, `seaWind` and `meadowDay`); the evening theme
  from dusk to dawn (`musicTick` switches when `isEvening()` changes). Volume is a bar in the Escape menu only,
  saved in `localStorage['game.opts']`; **there is no mute key: M is reserved for the map.** `Music` hushes
  itself when the window loses focus or is hidden and comes back on focus, so the game never plays into another
  window. The Escape menu holds the world still (`Combat.update` is skipped, `dt` is 0). A beast's sounds
  (`sfx(name, v, e)` from the engine) are only played within 260 units of the hero. When a beast within earshot is chasing or attacking, the `danger`
  layer (kick, pulsing strings and piano) fades in over a second and the `calm` layer (melody, harp, shaker) fades
  mostly out; four seconds after the last beast calms down it fades back (`musicTick`). Breath of the Wild was the
  model: the same song gets tenser, it does not switch.
- **HUD:** only health and stamina top left, the chart and the meal icon top right; no kills or carry line (Robin:
  "we can just open the inventory"). Damage numbers and pickup toasts are drawn in world space inside the camera
  (`drawNums`), so they appear over the tree, rock or hero in the big world.
- **Hotbar:** half size (11 px slots), with the sword and bow as two round icons set like the rings of a % sign to
  its left. Tools use a chop (`chopPose`: up over the shoulder, down onto the target; the knife stabs) with no
  lunge, and every tool hit shows a damage number. The bow shoots drawn arrows (visual only; no arrow item yet).
  The meal buff is a round icon by the chart with a timer ring and a mouseover tooltip, not a text line.
- **The recipe boards (2026-10-06, after Robin's reference):** the hearth, hand, workbench and shipwright boards are one
  layout (`openInfo`, `drawInfo`): the list of what can be made on the left (scrolls with the wheel; a count of what is on the
  way), the chosen thing on the right with its icon, tale (`infoText`), numbers (`infoStats`: health, top health, stamina,
  lasts, healing; damage, chop, reach; what a worn thing turns aside), what it takes with have/need boxes, and a **Craft**
  (Cook) button that fills as the first one is made (`infoProgress`); Enter crafts too. Leaving keeps the bars over the fire
  and the hero. Building keeps its grid.
- **Stations keep what they make (2026-10-06, Robin):** a dish cooked at a fire and a thing made at a workbench or the
  shipwright's bench wait at that station (`it.out`, up to eight stacks; `stationPut`) until taken from its board (the
  "Ready: take" strip under the list; `stationTake`), a glint over the station shows there is something; hand crafting still
  goes to the bag. A crafting job remembers its station (`crafting[].at`). **E picks the station you look at** when a fire
  and a bench stand together (`stationNear`, `facingScore`: things in front count as nearer), and an open board keeps its
  station while you turn (`menuStation`). **Thatch** is the roof you get unless you pick another (`CFG.roof` 1) and is
  straw yellow. **The steading** has gravel and earth paths, a rail fence, a bit of dry-stone wall, a trough, flowers and a
  scarecrow. The Sea Editor starts you on the jetty's last plank (the jetty can be walked: tile code 4) and every editor
  draws the hero as the Character Editor set it (`game.hero`). `docs/runes-ideas.md` holds the rune overhaul proposal
  (tabs, one glow, one line each, quiet places to choose) with questions for Robin; nothing of it is built.
- **Critters (2026-10-06):** butterflies, small birds and beetles live round the hero by day on open land (`critters`,
  `critterTick`, `drawCritter`): they flutter, hop and crawl, keep away when you come close (a bird flies off for good) and
  cannot be touched or hurt. Nothing of this is in the engine.
- **The wreck cursor** frames what would go in yellow (red when it cannot). **Wolf eyes** at night glow where the animal's eyes
  were drawn (`animal3D` records `H.eyes`; the engine copies them to `e.eyes`). **In the wild** only things of nature lie about
  (fallen trees, nests, mushrooms, herbs): no runestones, cairns or dragon posts. **Villagers** (`folkSpec('villager')`) start
  from the game's own hero look (matte, build, outline) with their own hair, beard, hat, clothes and colours.
- **Food** (the reward-not-punish rule; stamina added 2026-10-05): `FOOD` gives each dish `heal` at once and, for
  `time` seconds, `bonus` on top health, `regen` health a second, `stam` on top stamina and `stamRegen` on how fast
  it returns (through `Combat.api.mods().stMax` and `.stam`; the engine's `maxSt()` and the longer stamina bar).
  Roast berries (3 berries: small), roast meat, berry stew (the best: +25 health, +30 stamina, 35% faster). **A meal lasts
  ten minutes at least** (Robin, 2026-10-08: roast berries and honey 600 s, meat 720, stew 900).
  A number key uses a belt food in any mode (`Combat.api.beltUse`). Berry bushes drop berries, boars drop meat. **E** at the camp hearth opens
  a cooking panel: roast boar (1 meat), boar and berry stew (1 meat, 2 berries). Click food in the inventory to
  eat it: berries heal 10; a meal heals and, for minutes, raises top health and gives health a second (`FOOD`,
  `fed` in the page). No hunger meter. The meal is saved with the game.
- **Saving** in `localStorage` (`game.save`): island seed, inventory, buildings, felled props (keyed by rounded
  position), stumps, hero position. Saved on every change, every 10 s and on leaving; loaded on start. "New
  island" deletes it. Boars and dropped items are not saved.
- **Admin (2026-10-06):** an Admin row in the Escape menu opens a cheat board for testing (`ADMIN`, kept in `game.admin`):
  toggles Immortal, One-shot hits (`mods().dmg` and `powerMul` 1000), Free building and crafting (`canAfford`/`pay`), Fly
  (`walk` true everywhere, `mods().speed` 2.6); and one-offs: plenty of everything, reveal the chart, skip to dusk or dawn,
  go to the steading, hamlet or cave, Brokk joins. The engine took `mods().dmg` and `mods().speed` for it.
- **The Building board starts small (2026-10-08, Robin: overwhelming at the start; finds should open things up):** every piece can carry a
  `key` (`pieceKnown`: the key is a kind picked up and noted in `seen`, a thing built, or Brokk's teaching), and the board lists only the
  known pieces (`stepPiece` skips the rest on the wheel; a piece in hand that is unknown after a reload steps on). **At the start:** log,
  plank, wattle and turf walls, door, window, post, stairs, plank and earth floors, turf and thatch, the gravel, earth, moss and grass
  brushes, wattle fence, gate and rail fence, workbench, bed, chair, bench seat, table, barrel, crate, chest, woodpile, drying rack,
  campfire, log seat. **Keys:** `leather` the rug, haystack, trough, scarecrow, shield rack; `honey` bee skeps and the flower bed;
  `copper` the **mason's bench**, the carver's bench, the boat bench, palisade, shingles, brazier, cart; **`mason`** (built: the mason's
  bench, `gives: 'mason'`; prop `masonBench`, 6 wood 3 copper 4 stone) opens **everything of stone**: stone wall, flags, hearth, fireplace,
  furnace, well, fire pit, cairn, dry-stone wall and the grass, dark grass, moss and bare-rock floors; `charcoal` the charcoal clamp and
  the **wooden sign** (prop `signPost`, 3 wood 1 charcoal; E "Write" opens a prompt, `it.text` up to 28 letters, drawn on the board in
  charcoal by `drawSignText`, saved with the building); `ironBar` the lowland set (timber frame, cut stone, tiles, slate, town wall,
  altar, grave marker, stone cross, stall, bell tower); `bogIron` the field, chalk and marsh brushes; `silver` the dragon post;
  `snakeBlood` the claim stone. A new key toasts "Something new to build" (`noteSeen`, and `gives` on placing). The sandbox knows them
  all. **The shipwright's three tiers** (`ship: 1|2|3` on the piece and the item; `tierOf(it)`, an old save's `ship: true` is tier 2):
  the **raft bench** (prop `shipwright1`: two low trestles with the first log, a rope coil, an adze; 12 wood 4 fiber; key `raft`, Brokk's
  teaching; `gives: 'ship1'`, which opens the **dock**), the **boat bench** (the old shipwright's bench; 16 wood 4 copper 4 stone; key
  `copper`), the **shipwright's yard** (prop `shipwright3`: the bench under a plank shelter on posts with a rack of strakes; 20 wood
  6 iron bars 8 stone; key `ironBar`). The Shipyard shows only the plans the bench's tier allows (`Yard.PLAN_TIER` raft 1, boat 2, karve 3;
  `scene.planList()` from `host.tier()`; the Sea Editor's host has no tier and shows all). **The steading's half-gone house by the
  well is of planks** now, so wood mends it (Robin: the player should want to fix it with wooden pieces).
- **The frame log (2026-10-08, Robin: it lags when I walk):** a readout on the **left of the screen, in the middle**, always on
  (`drawPerf`: frames a second in green, amber or red, the milliseconds, the things drawn, and the frame's parts: t tick, u update,
  g ground, d draw, e end). `PERF` times every frame in parts (the page's tick, the engine's update, the render split into the
  ground (`scene.begin`), the list of things (`scene.items`), the engine's own y-sorted drawing, and the end overlays), and each
  second writes a line to the log (`perfLine`): fps, average and worst frame, the parts, the ground pieces baked and their time
  (`w.bakes`, `w.bakeMs` in `src/world.js`), things, figures and beasts, the hero's position and island, the zoom, what he was
  doing (walk, sprint, aboard, cave, yard, build, menu, bag, map, paused, night, torch) and the canvas size; a frame over 50 ms
  writes a **SPIKE** line at once, and every toast is an **event** line. The log is kept in `game.perflog` (the last 1200 lines),
  the Admin board's **"Download the frame log"** saves it as `framelog.txt` (Robin puts it in the project folder for me to read),
  and `Combat.api.debug().perflog()` returns it.
  **Robin's first log (2026-10-08):** standing still at 1800 by 1125 the frame's CPU work was 3.5 ms but the game ran at 47 fps, so the
  cost is on the **GPU** (the drawing queued by canvas 2D); the log line now carries `gpu Nms` (once a second the canvas is read back
  with `getImageData`, which waits for the GPU to finish the frame; the readout shows it too) and the Admin board has **Lower
  resolution** (then `ADMIN.lowres`, now the default: see the third log below) to try against it.
  `PERF.skip` (ground, waves, grass, grain, night, things) turns layers off for measuring (`Combat.api.debug().perf.skip`). The
  browser pane renders in software, so its numbers only compare layers; they say nothing about Robin's GPU.
  **Robin's second log (2026-10-08):** at 1800 by 1125 the GPU wait was 25 to 60 ms and the game sat at the edge of 60 fps (47 to 60,
  the vsync flipping); at 1200 by 750 (Lower resolution) 21 to 30 ms and a steady 60; painting paths stuttered only at full size. Done
  for it: **the meadow is baked into the ground pieces** (`w.meadowLook`, set by the game to its grass look: `bakeChunk` draws
  `drawMeadow` over the piece and `drawGrass` skips it; the Sea Editor still draws it live) instead of its gradients and flower
  drifts every frame; **a repainted piece stays on screen until its new bake is ready** (`w.repaint` marks it `stale`, `drawGround`
  bakes one piece a call and a stale one no sooner than 60 ms after the last, so a brush stroke no longer bakes every touched piece
  at once); and the Admin board's **"Run the layer test"** (`PERF_TESTS`, `perfTestTick`: twelve seconds, each layer off in turn
  with the GPU read back every frame, `layertest` lines in the log) says what each layer costs on Robin's card.
  **Robin's third log (2026-10-08): never read the canvas back.** The test's per-frame `getImageData` made Chrome drop the game's
  canvas to software rendering for good (3 fps until reload; Chrome does this after a few readbacks), so there are **no readbacks
  anywhere now** (the `gpu` number is gone): the layer test draws the frame four times over instead (`PERF_K`), so the fps falls
  under 60 and the drawing's cost shows (a `layertest` line gives the ms a render and the share on the card). What the readable part
  said: at the steading (168 things drawn) the card was at about 28 ms a frame and the grass about 6 of them. Done for it:
  **3 pixels a unit is the default** (`fitCanvas` caps the pixel scale at 3; Admin **Full resolution** (`ADMIN.fullres`) allows 5;
  the props are baked at 2 a unit anyway) and **baked sprites are trimmed to their drawn pixels** (`trimSprite` in `src/stylelab.js`
  at the end of `bakeProp`, `opts.noTrim` to keep the box; l, t, w, h move with the cut) so the card paints no transparent margins.
- **R** after falling: the engine makes a new hero, the page notices (`P` changed) and puts him back at camp.
- **Villages across the islands (2026-10-07, Robin: lots of islands, lots of places):** the world has **six islands** (`spec.sizes`
  60, 230, 150, 110, 170, 90 tiles; `World.make` takes `sizes`; `layoutKey` includes them, so older saves start fresh; `onOtherIsland`
  is any island but the first). **`Village.plan(env)`** (in `src/village.js`) lays the villages out: none on the starter island, the
  big island three (a seat or a village inland, a fishing hamlet or a trading post on a shore, a small place or a farmstead), a middling
  island two, a small one one or none, a ruin about one in seven, wealth rising with the distance from the wreck, every site on flat
  grass at least 38 tiles from the next and clear of the cave; each gets a **name** (`Village.nameFor`: a Norse first name, no first
  name twice in a world, and an ending by kind: shore `vik nes sund havn ey strand`, inland `by stad heim dal tun lund berg mark`, a
  seat `borg`, a farmstead `gard`) and a **jetty** when a shore is within reach (`Village.jettyFor`: dock planks from the nearest shore
  in a cardinal direction out into the water, three to six tiles, one or two **moored boats** beside its end). In the game `villages`
  holds the sites (`hamlet` stays the first), `hamletClear` grows them all and makes their folk (each with `vi`), `hamletBuild` writes
  them into `B`, plants their props and nature, lays the jetty floors (`8`, the dock) with a barrel and a rack at the root, the road
  from the village's road end (`V.roadEnds.front`) down to the jetty, and now and then a road between two villages on the same island
  (`layRoad`: a wandering Catmull-Rom curve laid with the ground brush, never over water, trees and bushes cleared from its line, a
  trail stone at its start). `moored` boats are drawn by `Yard.drawVessel` near the camera and are solid near the hero; they are never
  boarded. **Nothing shows on the chart or the map until seen** (`seen.vill[i]`, within 460 units: "<Name>: marked on your chart"),
  then the name. Folk tick only within 1500 units of the hero. Admin: "Reveal the chart" knows every village, "Go to the next village"
  cycles through them. `node tools/visual/worlds.js [seeds]` renders the chart of fresh worlds with every village named.
- **The southern lowlands, the foundations (2026-10-07, the second biome; the decisions are above under 2026-10-07):** `World.make`
  takes `biomes` (one per island; the game's spec: `[0, 0, 0, 0, 1, 1]`, in `layoutKey`): a lowland island is placed **south** of the
  southernmost islands and further off (its gap 1.7 times plus 18 tiles); `q.biome` on every island. **The biome field** `w.BM` (a
  byte per tile: the nearest island's biome mixed with noise so a lowland island keeps pine groves and the first biome gets a warm
  patch or two; `w.biomeAt(tx, ty)`, `w.biome(wx, wy)`) tints the baked ground a **warmer, yellower green** where it is high (and the
  chart), makes `w.plant` choose **oak, beech, ash and the apple tree** (`beech`, `ash`, `apple` props: the oak and birch drawings in
  the lowlands' materials, `lowK`; `KIND` tree, `HP` 20, 17, 10; `TREE_WOOD` 13, 11, 6) and the **chalk rock** (`chalkRock`, pale)
  instead of pines, birches and grey rock, and makes `w.dress` paint **three new ground kinds**: **marsh** (6, dark olive with glints
  of standing water, on the low ground by the water), **ploughed field** (4, dark furrows east to west, strips in the open) and
  **chalk** (5, almost white, at the lowland outcrops); the Building board's Ground row has Field, Chalk and Marsh brushes. A
  `hedge` prop (bushes in a row) is in the kit for the lowland villages to come. `Village.plan` makes lowland villages richer. **Not
  built yet** (next): the lowland towns and churches with their pieces (timber framing, cut stone, tiles, arches, a bell tower), iron
  (bog iron in the marsh, the bloomery, iron tools and arms, mail), ~~the karve (mast, sail, rowers, wind)~~ (built 2026-10-08), raiding (loot behind doors,
  carrying to the ship, guards gathering to the noise), silver, the jarl with the silver ring, reputation, and the balance pass on
  island and map generation (Robin: the lowlands a bit further out; bigger seas).
- **Iron (2026-10-07, the lowlands' metal; decided in the questionnaire):** **bog iron** lies in the marsh (`bogIron` prop, a rusty lump
  with an ochre crust half sunk in dark water, reeds round it; `w.plantBog` plants a few on the marsh cells after the dressing; kind
  stone, 8 hp; mined with the pick it drops 2 or 3 bog iron and a little stone, `o.bog`). **The bloomery** is the furnace: an **iron
  bar** from 3 bog iron and 3 charcoal, 12 seconds (`ironBar` recipe, revealed by bog iron). **Iron tools and arms** at the workbench
  from bars, revealed by the first bar: axe, pick, knife, sword, seax, spear, Dane axe (iron's power 1.3 against copper's 1), and the
  **painted shield** (a bar, wood, leather). **Armour:** the **gambeson** (a tunic of `wool`, fiber and leather, revealed by leather),
  the **mail shirt** (a tunic of iron, 6 bars and leather) and the **iron helm** (2 bars, leather); `Items` names them (Mail Shirt,
  Gambeson, Iron Helm, Painted Shield) with their own tales, and a material's `armor` factor (leather 1, wool 1.35, iron 2.2) sets how
  much a worn piece turns aside (mail 0.31, helm 0.18, shield 0.22; a full iron set passes the 0.6 cap, the leather set stays at
  0.47). **The hero wears it** (`heroGearSync`, every frame): an iron helm shows as the nasal helmet, mail greys the tunic, the
  gambeson makes it pale, and the hero's own look comes back when they are taken off. `tests/iron.js` checks it (in `npm test`).
- **The lowland town and the church (2026-10-07, Robin: a really nice church and assets that fit the biome):** **two wall
  materials** in `Build.WALLS`: **timber frame** (5: plaster panels between dark timbers with braces, `tex: 'frame'`) and **cut
  stone** (6: dressed blocks in courses, `tex: 'ashlar'`), and **two roofs** in `ROOFS`: **clay tiles** (3) and **slate** (4), drawn in
  offset rows with a lip on every tile ('No roof' is 5 now). A cut-stone wall gets a **round-arched door** with iron bands and a
  **round-arched window** with a lattice (`archDoor`, `archWindow`); a stone gable has no timbers but a small arched window high up.
  The **town wall** (`YARD` `townwall`, `TOWNWALL_H` 34: cut stone a storey high with a coping) is a yard piece. On the Building board:
  Timber frame, Cut stone, Tile roof, Slate roof, Town wall, and the Altar, Grave marker, Stone cross, Market stall and Bell tower
  pieces. **Props:** `bellTower` (a square tower of cut stone, a round-arched belfry with the bell, a slate pyramid, a small cross),
  `altar` (a block of cut stone under a white cloth, two candles that are a small night light, a cup), `graveStone` (an upright slab
  or a wooden cross), `wayCross` (a tall stone cross on steps), `stall` (a trestle under a striped awning with baskets of apples and
  fish), `yew` (the cypress drawing in the yew's dark green). **Villages:** `ARCH.town` (a walled town round the jarl's hall with a
  church, five to seven houses, market stalls in the yard, guards at the gate and a merchant at a stall, the jarl's chest in the hall
  (`find` `jarl`), `townwall`) and `ARCH.church` (a lone church with the priest's house inside a dry-stone wall: the lucky strike);
  `BUILD.church` (three or four wide, five or six deep, so its gable faces south; cut stone under slate, arched windows along its
  sides, a flagged floor, the **altar** at the north end, **pews** along the walls, the church's silver in a chest by the altar
  (`find` `silver`), the **bell tower at the front corner** like a west tower, the churchyard along the east side with grave markers,
  a yew and a wayside cross by the door). **The lowland materials** (`opts.biome` or an archetype's `lowland`): cut stone for the
  rich, timber frame for most, clay tiles for the rich, thatch for the rest. Roles `priest`, `guard`, `merchant` with lines.
  `Village.plan` gives the biggest lowland island a town, the others a church or a village and a shore place; a site carries
  `biome`. The Village Editor has a **Lowlands** button. `tools/visual/house.js` draws the new materials and a church-shaped room.
- **The church, drawn from the references (2026-10-07, Robin: a really nice church that fits the art direction; Anglo-Saxon churches
  such as Escomb and Earls Barton):** a tall narrow nave with its gable south, **tiny round-arched windows set high** (the cut-stone
  wall's window is 8 by 12 now), the **west tower** at the front corner (`bellTower`: long-and-short quoins, a string course, pilaster
  strips on the lower stage, two Saxon belfry openings, round or triangular-headed with a baluster shaft, the bell between them, a
  slit window, a slate pyramid and a cross), a **porch** of cut stone over the door (`porch`: an open round arch, quoins, a slate
  gable with a cross), the **apse** (`apse`: a half-drum under a half-cone of slate, set 1.7 tiles north so its roof shows beyond the
  far gable), the **cross on the gable's peak** (`gableCross`, drawn 66 units up to the ridge's end), a **font** by the door, and the
  churchyard's **lychgate** (`lychGate`, a roofed gate on four posts) on the chapel's wall. `quoins`, `saxonOpening`, `ashlarFill`
  are the shared bits. The first biome's gables keep their timbers; a stone gable gets a small arched window instead.
- **The raid (2026-10-07, built; `docs/raid.md`):** **guards** are the engine's enemies with a figure (`e.fig`, `e.human`, `drawHuman` in
  `src/combat.js`: the villagers' figure in an iron helm and mail with a sword that hangs, rises behind the shoulder and comes round;
  `lib.heldD` draws a `sword`), dressed by the game (`guardSpec`, `wantKind` `'guard'`: 24 health, 9 damage, the plain lunge,
  `aggro` 0.5 so only the alarm or a blow wakes them, and awake they give up only 900 units off, then walk back to `e.post`);
  `spawnGuards` puts one at each guard spot of every town (the gate, a stall). **The alarm** (`raidAlarm(vi, x, y)`, `raid` = { vi, t,
  x, y }, `raidTick`): a blow on a locked door or a locked chest, any village box broken, a guard struck or a heavy chest lifted
  wakes every guard of that village (`e.heard` 30) and sends the folk running home to hide (`f.fleeing`, `f.hidden`); it fades
  thirty seconds after the last noise, the guards walk back, the folk come out with `RAIDED_LINES`, and `seen.raided[vi]` holds the
  day ("Word of this will spread" the first time). **Locked doors** (`locked` on the church's, the hall's and the store's door edges,
  copied into `B`): shut and solid (three circles in the solids) until the axe breaks them (`harvest.list` offers `doorHvOf`, 14 hit
  points; then `broken`, drawn open for good). **The heavy silver**: the church's and the jarl's chests are `heavy: { silver }` and
  `locked`; the axe breaks the lock (the box's hit points, then restored), E lifts it (`liftHeavy`, `carrying`: speed 0.7, the chest
  drawn on the shoulder), E puts it down (`putDown`), E at the vessel stows it (`stowHeavy`, `raft.cargo`), and E at the vessel at
  home (`atHome`: inside a territory or within 700 of the wreck) unloads it (`unloadCargo`) as **silver** in the bag (a new kind,
  hack-silver; village coins are silver now; a slain guard drops a coin or two). `carrying` and the cargo are saved. Debug:
  `Combat.api.debug().raid()`. Not built: fire, hirdmen carrying, traders closing to a known raider.
- Not built: ships beyond the raft, hazards at sea, night-only beasts, trading, the torch.


### The 26-fix batch (2026-10-05, after Robin's play-test)

- **World:** the starter island is small (`isle0: 60` tiles); the second is the big one (`big: 230`), with the cave,
  bear, troll, wolves and moose. A few boar, deer and snakes live on the starter island (`start` in `ANIMALS`, tagged
  `e.isle`). The hero wakes in a wrecked boat on the beach (`wreckedBoat` prop, no jetty: `noDock`), and the screen
  opens slowly from black. The camp props (drying rack, tent, dragon post) are gone. The village is on the starter
  island, at least a walk from the boat. `layoutKey()` includes the island sizes, so old saves are dropped.
- **Loot notes** are small, fade, sit to the side and stack counts. Trees are 3 to 4 times the hero, give far more
  wood each and take more blows (`TREE_WOOD`, `World.HP`). Chopping and mining are slower, and holding the button
  keeps going. Berries are picked with E (cutting still gives berries and grass).
- **In hand:** the chosen tool or weapon is held when idle; with no sword you punch (fists, 0.4 damage). Neutral
  icons show when nothing is equipped. HP and stamina numbers sit inside the bars.
- **Minimap:** a sharp window of about 110 tiles round the hero (`VIEW` in the minimap block), distinct markers.
- **Building:** items stand free of walls (`fitItem`, `wallHit`); the wheel in build mode turns an item (mirror plus
  footprint swap only, because sprites are three-quarter view, not a true 90 degree turn). Furniture sizes come from
  the `SIZE` table in `src/stylelab.js`, set against the hero's 27 units.
- **Panels:** the character panel hero always faces south; the bag is aligned right with the same margin (8) as the
  character panel; Sort is a small button on top of the bag (three small rectangles); tooltips draw above boards;
  Brokk's bubble draws on top of roofs.
- **The swing and the chop reworked (2026-10-07, Robin: clipping and unnatural; put effort in):** `arcSwing` in `src/combat.js`:
  the hand rides a circle round the shoulder (radius 10.5 at -17), from the carry at the hip up behind the head in the windup
  (eased), over the top and fast down in front to the target in the stroke, then eased back to the carry; the haft continues the
  arm and lags back in the windup so the axe head hangs behind the shoulder. The chop (`chopPose`, axe and pick, and smashes) is
  **two-handed**: `hand2` lies further up the haft and `heroPose` sends the other arm to it (`pose.far`, or the other of
  `armL`/`armR`). The sword seen from the side uses the same overhead arc (`swordPose`), facing the camera or away it keeps the
  wide sweep across the body (pivot raised to the chest, radius 10.5). The knife still stabs. **The carry** at rest is at the
  side with the arm hanging and the thing pointing forward and down. `node tools/visual/swing.js` renders the chop and the swing
  as eight-frame sequences in the side, front and back views.
- **Carrying things (2026-10-05):** at rest a tool or sword is carried up at the shoulder (hand at the hip, the thing pointing up and outward past the chin, behind the body when facing away), **held**: `heroPose` sends the
  figure's arm on that side to the grip (`carried`), and the thing is drawn there at 0.85 (`swordPose` rest branch in
  `src/combat.js`; axes and picks 11 units long, swords 15), in every direction. The sheath is not drawn when a page holds
  items. `node tools/visual/poses.js` renders the hero carrying each thing, standing and walking, in four
  directions, and `chop.js` the tool strokes. The **wrong tool** note shows once, then not again for five minutes
  (`wrongToolAt`); every weak blow's number is dim with a crack through it (`num(..., weak)`).
- **Leather (2026-10-05):** animals drop leather directly (`drops` in `ANIMALS`); curing is gone (`rackUsable` returns
  null) and the drying rack is only a thing to build. The chart is half size (48 by 32).
- **The meadow (2026-10-05, Grass Editor):** under the blades `w.drawMeadow` paints soft lighter and darker patches
  (`patches`, `patchSize`, `patchLight`, `patchDark`), bare earth with a grassy edge (`earth`, `earthCol`, `earthLight`,
  `earthEdge`) and drifts of tiny flowers in one colour each (`drifts`, `bloom`), all hashed from position so they never
  move. Robin's reference is a painterly meadow: blotchy greens flecked with flower drifts and earth.
- **Grass Editor** (`grass-editor.html`, `templates/grass.html`): `World.GRASS` is the living-grass spec (blade
  palette, density, height, sway, wind speed, soft bands of light, flowers) drawn by `w.drawGrass` after the waves,
  plus the ground hue, brightness and saturation. "Use in the game" stores `game.grass`, which the game merges over
  the defaults on load.

## Controls and modes (decided 2026-10-04)

The hero has two modes, switched with **Q**, each with its own six-slot bar at the bottom middle of the screen
(**rebuilt 2026-10-05**; Robin found the fixed sword-and-bow with F awkward).
- **The bars are the top two rows of the bag:** row one is the Fight bar, row two the Gather bar, each numbered 1 to 6
  and marked with a tiny sword or axe. Anything can be dragged into them. A number key takes a weapon or tool in that
  slot **in hand** (`hand = { fight, gather }`, the gold slot; saved), eats food, or lights a torch; an empty slot means
  empty hands (fists in fight mode, nothing to swing in gather mode). The wheel steps the hand. The engine reads the hand
  through `Combat.api.items` (`held`, `tool(i)`, `weapon(kind)`), `api.barSlots(mode)` draws the bar and
  `api.barSelect(i)` takes the number keys; `handSync()` sets `P.tool` and `P.weapon` (a bow in hand is ranged) each
  frame. **F no longer swaps weapons** (it still toggles wrecking in build mode). A crafted weapon or tool goes to the
  first free slot of its bar (`barPut`), as does right-clicking one in the bag (swapping with the hand slot when the bar
  is full); loot fills the bag rows first (`addItem`, `addThing` start at `BAG0`). Old saves (24 slots, weapons in
  `equip`) are remapped on load.
- **Fight mode:** whatever is in hand from the Fight bar: a sword hits, a bow shoots from the quiver, fists punch.
- **Gather mode:** tools from the Gather bar. The right tool does full damage and any other half. Tools do not hurt
  enemies. No auto-pick, no highlight.
- **Worn gear** (`equip`): helmet, cloak, tunic, trousers, boots on the character panel's left, shield and amulet on its
  right. The shield shows only when used (blocking); Robin likes that as it is.
- **Build mode:** **B** enters it (no hammer item). In it **F** turns the cursor into a red crossed box that
  destroys pieces. Built in the game (see "The game").
- **Tab:** inventory. **Ctrl:** target the nearest enemy, then the next nearest on each press, then let go.
- Food and consumables should work in both modes (their own keys). Dragging things from the inventory onto the
  hotbar, so you can choose the layout, is wanted ("maybe"). Neither is built yet.
- Built so far: modes, Q, F, Ctrl, the hotbar, the sword, the bow, and axe, pickaxe and knife, shown in the Combat
  Arena and the Creature Editor; gathering works in the Environment Editor (trees give wood, rocks stone, bushes
  fiber, counted under the view; there is no inventory yet). `Combat.api.harvest` is how a page offers things to
  gather. `P.mode`, `P.weapon` and `P.tool` hold the state, and `Combat.api.tools` the tools.
- Ctrl is a browser modifier: Ctrl+W closes the tab, so avoid Ctrl together with a movement key.

## Creatures

- `creatureD(c, x, y, s, H)` draws creature `H` (from `makeCreature(spec)`), or the one set by `setCreature` if
  `H` is left out. `s` carries time, movement and the enemy state, so one drawing covers standing, moving, the
  warning before an attack, attacking and stunned.
- Body plans 5 (four-legged animal) and 6 (snake) go to `animal3D`, with neck, snout, ears, antlers,
  tusks, hump and so on as spec keys. Plans 0 to 4 are the older cartoon bodies.
- `ANIMALS` in `src/art.js` holds the six animals of the first biome: wild boar, deer, bear, snake, moose, wolf.
- In the arena an enemy with `e.creature = true` is drawn this way (`e.skin` for its own creature). `e.cfg`
  overrides the bot AI speeds, `e.hold` freezes it, `e.aggro` keeps it calm until the hero is near, `e.flee` makes
  it run away instead of fighting (the deer).
- **The view rig (2026-10-07, Robin: the turntable clipped everywhere, "a new car"; `docs/creatures.md`):** animals (plan 5,
  `quadD`) and the trolls (plans 8 and 9, `trollViewD`) are drawn like the hero, in three designed views (the side facing left and
  flipped for right, the front, the back; the front and back turned by `tq` on the diagonals), each a 2D construction with its
  own layering (far limbs, the body with the head and hair, near limbs) through the ink layers, so nothing cuts through anything
  and every band is one silhouette with one ink line. Legs and arms are two-bone limbs placed by `ik2`; the nose is part of the
  head's own shape; attack poses by state. The same specs drive them. `lib.RIG` (`animals`, `trolls`: `'views'` or
  `'turntable'`) keeps the old rigs for comparison (the Creature Editor's **Rig** switch, kept in `creature.rig`); the snake is
  still `animal3D`. `node tools/visual/animals.js` renders the five animals at five headings with the walk and the attack;
  `trolls.js` the trolls. **End on (2026-10-08, Robin: the limbs overlapped and clipped facing north and south):** in `quadD`'s
  front and back views the **near pair of legs stands at the body's edges** (`legX` 0.34 of the end-on width) and the **far pair inside
  them** (`legXf` 0.17, a little higher and thinner), never at the same x, so a step never crosses a leg; end on a leg is a **slim
  column** (0.85 of `lw` at the hip, 0.55 at the hoof), not the side view's thigh. In `trollViewD` the end-on body is wider (`W` 1.5 of
  the boulder's `BW`, 1.3 of the forest troll's), the **shoulders sit at its edges below the head** (they sat inside the head's width,
  so both arms crossed the face), the hanging arm is nearly straight (`seg` from the reach, no elbow bowing out), the hands rest a
  little outside the shoulders, the legs stand apart. **One body in every view (Robin: he looked like four different creatures as he
  turned, the boar keeps its shape):** the boulder's front and back are built on the side view's proportions: the head hangs **low in
  front of the hump** (`hy2` = `topY2 + HEAD * 0.8 + 4`, as the side view's), the mane rises over the hump behind it, the shoulders
  sit high on the hump's sides and the arms come down to **hands on the ground in front** (nearer the viewer, `hyH` 3), and from
  behind the head is hidden by the hump with only the ears showing. `node tools/visual/views.js [trolls]` renders every animal (or the trolls) end on,
  standing and through a walk, large.
- **Facings (decided 2026-10-04):** things turn smoothly, "like the ship". Animals (plans 5 and 6) are drawn by
  `animal3D` at any heading (`s.ang`): the body is laid out in its own space (forward, sideways, up) and turned
  before drawing, with parts ordered far to near. Without `s.ang` they face straight left or right (`s.dir`).
  The arena passes a heading that eases toward the true facing (`creatureTurn`). The hero uses the side view only
  when facing nearly straight left or right; otherwise the front or back view turned by `an.turn` (-1..1).
  `Combat.api.facings8` (on by default) switches both. `node tools/visual/facings.js` renders them all.
- **The troll redrawn after John Bauer (2026-10-07, Robin: scarier, hairier, old and ancient):** `trollD` in `src/art.js` (plan 7)
  is a boulder of a body hunched under its own hump, a **mane** in rows of shaggy strokes down the back with long strands at
  the hem and from the head, gone grey with age, **lichen** grown on the hump, arms so long the **knuckles rest on the ground**
  with four long fingers laid flat, great flat feet with toes, a tufted tail, a small low head with a heavy brow and tufted
  eyebrows, tiny eyes that light when he means harm, a long drooping nose with a wart, big pointed ears, a beard, and the
  trinkets trolls hoard: a string of beads and a bronze ring in the ear. Spec keys `trollHair`, `trollAge`, `trollHunch`,
  `trollArms`, `trollNose`, `trollEars`, `trollBelly`, `trollMoss`, and flags `trollBeads`, `trollSack`, `trollTail`; a new
  colour `moss`. The **Creature Editor** has the Troll body plan, the Mountain troll and Stone troll models, a Troll panel with
  those sliders and details, and the moss swatch under Colours. The stone troll is the same drawing in grey (glow equal to
  body: no lichen, no beads, no eye light). **He turns like the animals (Robin, second pass):** every part is laid out in his
  own space (forward, sideways, up) and projected with the heading `s.ang` the way `animal3D` does (`pt`, `depth`, `KD` 0.62),
  the parts sorted far to near (`items`, `at(dep, fn)`): the body is the turned ellipsoid's outline with the hump at the back,
  the mane hangs from rings round the body (longer on the back half and at the hem), the face shows as the head turns toward
  you and the hair over the head falls behind, the ears sort against the head, the tail sorts behind. No squash, no crossfade.
  `H.eyes` records the eyes for the night glow. **His blow is a great
  slow sweep** (Robin: very slow, very hard, a lot of health): `ATTACKS.troll` windup 1.6, a 62-unit reach over a 3.8-radian
  arc, recover 2.2, cd 2.6, heavy; 80 health, speed 0.6; the game's troll does 40. The arm swings through the sweep in the
  drawing (`sweep` from the lunge's `k`) with a pale trail, **and the engine marks an arc attack on the ground** (`drawEnemy`
  in `src/combat.js`): a red wedge of the reach and arc fills through the windup, and a bright edge sweeps across it through the
  blow until it lands. The Creature Editor's arena gives a creature the attack of the beast its slot names (`lib.animalAttack`)
  when the behaviour is the plain one, so the troll sweeps there too. **The Creature Editor (Robin, 2026-10-07):** a **Creature** panel on
  top with a name, Save (into `creature.library` in this browser), New creature (a variation of what is on screen), Delete, the
  saved creatures as buttons, and **In the game**: pick which beast of the game the design replaces (`game.creatures`, applied
  on load by `lib.useAnimal(key, spec)`: the look and the spec's numbers; the game keeps its own counts, damage and drops) with
  Update in game and Take back; the base models are **Templates** and set the slot; the **Animal and Troll panels show only
  for their body plan**.
- **The trolls drawn from scratch (2026-10-07, Robin: both kinds, keep the old for comparison):** two turntable models on the ink
  layers in `src/art.js`, sharing `trollParts` (heading, clock, colours, the `pt`/`depth` projection, the `at(dep, fn)` list),
  `trollFinish` (sort far to near, draw into the layers by depth band, lay them down), `trollHand` (a palm, knuckles and four
  fingers, knobbed or twig), `trollStrand`, `trollCape` (a jagged cape of hair hanging from a ring of points, in overlapping
  segments each sorted by its own depth, a hem of strands) and `trollGrowth` (lichen patches and birch saplings). **The boulder
  troll** (`boulderTrollD`, plan 8, Bauer): a boulder of a body (the turned ellipsoid, a flat foot, embedded stones, a lit side),
  a tent of hair from the crown down the whole back and a jagged cap on top, moss and saplings growing on it, the face sunk into
  the front (a darker hollow, sockets, small bright eyes that glow when he means harm, a heavy tufted brow, a long drooping nose
  with a bulb, nostrils and a wart, a grim mouth with a tooth, a beard to the ground, beads), big round ears with a ring, arms from
  high on the sides to enormous hands flat on the ground, great flat feet. **The forest troll** (`forestTrollD`, plan 9, Kittelsen):
  tall and gaunt, a trunk of a body leaning forward from the hips (`trollHunch`), bark lines, a shorter mane, long thin legs with
  knee knobs and long-toed feet, arms past the knees with twig fingers trailing on the ground, a long skull on a neck with a branch
  of a nose, pointed ears, a crown of tangled hair with twigs standing up and a fir sapling. Both keep the sweep attack and
  `H.eyes`. `ANIMALS`: **`troll` is now the boulder troll** (the game's cave troll), `trollStone` its stone, `trollForest` the
  forest troll (not in the game yet), `trollOld` the first troll (plan 7, `trollD`) for comparison; `animalAttack` gives any
  `troll*` key the troll's sweep. The Creature Editor lists them as Templates and its Troll panel shows for plans 7, 8 and 9.
  `node tools/visual/trolls.js` renders the three at four headings with the windup and the blow; `trollface.js` the faces large.
  **The evil face (Robin, 2026-10-07: they looked too happy; evil and careless, the hero is nothing to them):** `trollEvilFace` and
  `trollSneer` are shared by both: brows as two heavy black wedges slanting down to the root of the nose, eyes small and deep in
  dark sockets under a heavy lid, one squinting, a pinpoint pupil, furrows between the brows and folds on the forehead, a **snarl,
  never a grin** (Robin: they looked goofy, they should not smile): the corners of the mouth dragged down, the upper lip lifted in an
  arch with fangs hanging from it, the longest at the corners, two tusks up from the lower jaw, the lip curled under the nose; the boulder's face is big on its front and its beard starts under the mouth. References: Egerkrans's Fenrir and
  the classic troll and goblin masks Robin sent.
- **The cave and the mountain troll (2026-10-05, from `docs/beasts.md`):**
  *The mouth:* `caveSetup` picks a clear spot on grass 700 to 1600 units from camp (not near the steading), clears
  the props round it and plants a `cave` prop (`caveMouth`); E beside it enters (a short black fade), E near the
  west end inside leaves. The chart marks the hero at the mouth while inside. Saving inside saves you at the mouth.
  *The inside:* a generated tunnel with chambers and side pockets, 72 by 40 tiles, laid out in its own coordinates
  far east of the map (`CAVE_X`), so nothing outside can see you in it; `scene.walk` and `scene.bounds` switch to it
  (`caveFloor`, `drawCaveFloor`). Everything is **dark** (`drawCaveDark`): you see a circle of about 96 units round
  you, a warm glow round each ore rock, and daylight spilling in at the entrance; building is off inside. **Ore rocks**
  (`cave.ores`, up to 18, thick near the opening and thinner deeper) each give 2 copper and 3 stone, sure, and glow
  faintly (they are drawn through the same prop path as outside rocks: `o.cave`).
  *The troll* (creature plan 7, `trollD`; 40 health, a slow heavy `arc` swing of 28 damage, windup 1.1 s) lives at
  the back (`cave.lair`), wandering within 150 of it, and is awake when you come within 100. **Mining is loud**
  (`caveHear`): each hit on a cave ore sets `troll.heard` for 14 s, and the engine (`e.heard` in `updateEnemies` and
  the `botAI` idle case) makes him come however far, slowly (about 45 units a second against your 84). Far off he
  is only two amber **eyes** (drawn after the darkness, from up to 640 units), and he appears in full as he enters
  your light. *Outside:* on some nights (light above 0.7, one night each, only if you are not inside) he walks out
  to the mouth and strolls within 340 of it (`troll.place` 'in' or 'out'); a hearth or brazier within 105 makes him
  shield his eyes (held 4 s, then he ignores light for 14 s). **Unprovoked he goes back in before morning** (from
  t 1620, or at once after dawn begins); **provoked** (awake) and caught outside by the light he turns to stone
  ("TROLL STONE") and 6 s later cracks into a rock formation worth 6 stone and 4 copper. A killed or stoned troll is
  replaced three days later (`trollDeadDay`). Killed, he drops 3 copper and 3 stone. He has a card in the Book (hidden).
  *Ore outside:* about a third of the rocks hold copper (`markOre`): a sure 2 at night, one in six by day; they glow
  copper at night. Copper ore is the first metal in the bag; smelting and copper tools are not built. With the tapping
  bot a troll costs 44 to 57 health in leather and kills an unarmoured hero 3 times in 12.
- **The cave rebuilt (2026-10-07, Robin: it looked square and blocky):** the inside is a **smooth field** (`cave.D`, a quarter-tile
  grid of how far into the rock the floor reaches, read between cells by `caveD`; `caveFloor` is `caveD >= 0`), carved as circles
  along a winding passage with a chamber at each end and five pockets, then roughened with noise, so every wall is a curve. It is
  painted in cached pieces (`caveChunk`, 256 units at 2 px a unit): a mottled floor, damp and dark along the walls, the **face of
  every wall that looks toward you** shaded by its height with strata and a lit ledge, a dark rim where a wall turns away, deep
  rock beyond, **stalactites** hanging from the faces, **rubble** at their feet, and a **still pool** in the second pocket with
  drips rippling on it (`cave.pool`; walkable). **Copper veins** (`cave.veins`, up to nine green malachite streaks on the deeper
  walls, `left` lumps each, 5 to 7): the pick on one chips green and gives a lump of copper every few blows (`veinHit`); a spent
  vein greys out and is **gone for good** (the island's copper is a hoard you spend; `veins` saved as what is left). A few loose
  ore rocks remain near the mouth. **The troll's hoard** (`cave.hoard`, drawn by `drawHoard`: bones, a skull, copper glinting)
  lies by his lair; E takes it (`hoardTake`) only while he is out, dead, stone or far (`hoardFree`), and he brings two more
  copper a day (ten at most). **Outside at night he is seen**: amber eyes through the dark like the wolves', and he notices you
  by a **sneak rule** (`trollSees`: within 70 behind him, 170 in front, sprinting x1.6, a lit torch x1.5) instead of the plain
  aggro ring. **He walks home**: at morning he comes in at the mouth and walks the passage's middle to the lair (`trollHome(e,
  true)`, `trollWalk`, `cave.path`), about fifty seconds, and anyone inside hears "Heavy steps echo from the mouth of the cave";
  if he passes near you he wakes. Debug: `trollOut()`, `trollHome(walk)`, `trollTick`, `trollSees`, `hoardTake`, `hoardFree`,
  `veinHit`. **Tried to break it (2026-10-07), fixed:** a fire ring taken came back on reload (`gone` now also removes it); a
  furnace's or hearth's queue stood still after a reload (`cookFires` rebuilt on load); a struck tree's stump regrew as a struck tree
  (now a birch); embers piled up at fires over days (at most four lumps lying); a station with a queue, things ready or a burning
  clamp cannot be wrecked ("Empty it first"); the troll sent out by day walked straight back in (the test row brings night).
- **Charcoal, the furnace and copper tools (2026-10-07, Robin decided):** charcoal is never made in the furnace. **Morning embers:**
  at every dawn each fire that burned through the night (the camp hearth, campfires, hearths, braziers) drops two lumps of
  charcoal beside it (`morningEmbers`, from `dayTick` and waking). **The charcoal clamp** (the `charcoal` piece, prop `charcoalPit`,
  `it.clamp`): E with eight wood lights it (`clampUse`, `it.burn`), it smokes for `CLAMP_T` 300 seconds (`drawSmoke` over it, thin in
  the last third), then ten charcoal lie round it; when the smoke thins E can **"Seal the vent"** for five more (`clampPrompt`:
  "Light the clamp (8 wood)" / "Seal the vent"). **In the wild** (`src/world.js`): one tree in fifty is a **lightning-struck tree**
  (prop `struckTree`, kind tree, 9 hp; felled it gives 4 charcoal and no trunk: `Gather.CHAR_TREE`) and an **old fire ring** (prop
  `fireRing`) lies among the things left about; E takes its two lumps and the ring is gone (`ringNear`, `ringTake`). **The furnace**
  (piece `furnace`, prop `furnace`, 12 stone 2 wood, `it.furnace`; a clay dome on a stone foot) is a station like the hearth
  (`stationNear` kind `furnace`, `furnaceAt`): E opens its board (tab Furnace) with the **copper bar** (2 copper ore, 2 charcoal,
  `at: 'furnace'`, `dur` 8 seconds, revealed by charcoal); Craft or Enter pays and queues it on the furnace like a dish on a fire
  (`smelt`; `cookTick` and the work bar take a per-job `dur` and `kind`), smoke rises while it works, and the bar waits in "Ready:
  take". Robin chose the plain furnace (load, wait, take): no bellows, no moulds. **Copper tools and weapons** are workbench
  recipes from bars, revealed by the first bar: axe and pick (3 bars, 2 wood), knife (1, 1), sword (4 bars, wood, leather), seax
  (2), spear (2 bars, 3 wood), Dane axe (5 bars, 2 wood). `STACK_TALE` holds the tales of stackable things. The sandbox gives ore,
  charcoal and bars; "Plenty of everything" too. The copper on loose rocks stays as it was: the cave's veins are the real source.
- **The torch (2026-10-05):** two torches from 1 wood and 2 fiber at the Crafting tab (a stackable kind in the bag).
  **T** lights one (taking it from the bag, 6 minutes: `TORCH_TIME`) and puts it out again, keeping what is left; a click
  on the stack in the bag does the same. Lit, the hero carries a flickering torch (`drawTorchHeld`), a round icon by
  the chart shows the time left, the light round you grows from 96 to about 190 units in the cave (a warm glow over it)
  and from a faint circle to a wide warm one at night outside. It burns out, is put out when you sleep, and is saved.
  **It does not frighten the troll** (Robin): only a hearth or brazier does (`fireNear`); a torch is not one. A hint
  after you find the cave (`seen.cave`, which also marks it on the chart) says to make torches.
- **Fight balance (2026-10-05, `tests/balance.js`):** armour turns a share of *every* blow aside (it used to count only
  while blocking). An animal that has begun its attack (windup or lunge) finishes it unless hit by a heavy blow (third
  combo hit, charged, or a parry); a light hit is a 0.14 s flinch and does not reset its attack cooldown, so
  tapping the sword cannot lock an animal in place. Health: boar 12, wolf 8, deer 5, snake 3, moose 26, bear 30. With a
  naive tapping bot: boar and snake lose nothing, a wolf pair 4 to 12 (leather), moose 33 to 48, bear 54 to 88 and
  sometimes death. A skilled player does better; the numbers are the floor.
- **Attacks (2026-10-05):** each animal fights its own way through `e.cfg.atk`, from `ATTACKS` in `src/art.js`
  (`lib.animalAttack(key)`), read by `botAI` in `src/combat.js`. Kinds: `lunge` (a short jump), `charge` (a long
  committed run straight ahead that bowls you along and goes past; the boar, which also turns slowly: `turn`),
  `arc` (a swipe or gore in a cone in front with no run: the bear's heavy rearing swipe, the moose's gore with a
  step). Extras: `ring` (the wolf circles at a distance and only one of the pack bites at a time: `pack`),
  `venom` (the adder's bite does a little damage a second for a few seconds, drawn as green numbers),
  `heavy` (bigger knockback, blocks cost more). The Combat Arena uses the same table. The deer flees. The
  Creature Editor's behaviours are the older generic ones.

## World look and props

- `kit.STYLE` is the look of every prop and tile at once. Since 2026-10-05 it is the **flat, clean look** Robin
  chose from a reference (soft pastel cartoon: two or three flat tones per shape, thin olive outlines, round forms,
  no texture strokes): `look: 0` (the flat renderer), `texture: 0`, `sparkle: 0`, `outlineW: 0.6`, `shadowHue:
  100` (olive shades and outlines), a yellower, lighter green (`outsideHue: 100`, `bright: 14`, `sat: 0.92`).
  The beaches and water (painted in `World`) are kept as they were; Robin likes them. Canopies are fuller and
  lower with a dark underside and a lit top; the grass tile is a calm mottled green with a few tufts. The hero is
  to be redrawn later; the troll and other väsen should look like the classic old illustrations (hairy, heavy,
  long-armed), not cute. Editors add per-page overrides on top (hue, saturation and so on).
- **The ink look (2026-10-07, `look: 3`, `kit.STYLE_INK`):** `shape()` fills the base, lays a cool shadow crescent (`shadowHue` 222
  mixes into every shade through `M()`), a warm highlight crescent, a **grain** pattern (`grain(c)`, a tiled canvas of dark and
  light specks) and a cool gradient toward the shadow side inside the clip, a warm lit edge, then **two lines**: a thin one all
  round in warm brown-black ink (`OLC` for look 3) and a heavy one whose stroke is a gradient fading in toward the lower right.
  `ow()` scales the line for look 3. The game merges `game.look` into `kit.STYLE` on load, so the whole world bakes in it;
  figures (hero, folk, animals, troll) keep their own drawing until the two-pass outline is built. With the look on, the game uses
  **`World.GRASS_INK`** for the living grass (moss and ochre, muted blooms) unless a Grass Editor look is stored, and lays **grain and
  a vignette over the world** each frame before the night overlay. **Robin's numbers (2026-10-07: line 1.6, grain 1.1, wobble 0.08,
  figure grain 0.22, figure shadow 0.41) are the ink defaults**; he said the palette "is going more towards old drawings in books".
  `node tools/visual/look.js` renders the Art Direction scene both ways to look.png. **Fixes after Robin's first look (2026-10-07):**
  the heavy line is drawn per edge segment, as dark as the segment's outward normal faces away from the light (`inkEdge`), so it
  lies on the shadow side of any shape instead of a position gradient that left a pale oval inside tree trunks; the game's grain
  overlay is drawn inside the camera transform so it is locked to the world, not to the screen.
- **The ground brush (2026-10-07, Robin: the tile paths were too mechanical and perfect):** the tile paths are gone from the
  Building board (their floor entries stay in `Build.FLOORS` for old saves). The board's **Ground** row has three brushes, Gravel,
  Earth and Grass back, all free: drag to paint a stroke 15 units wide anywhere on land within reach. The world keeps the paint in
  `w.ground` (cells a quarter tile wide, `w.paintGround(x, y, r, kind)`, `w.groundKind`, saved as `ground`) and bakes it into the
  ground pieces (`paintGroundInto`: the cells read as a smooth field with noise on top, so edges are ragged, a darker shoulder at
  the edge, pebbles on gravel), forgetting the pieces a stroke touches (`w.repaint`). The steading's paths are painted strokes
  that wander a little (`stroke` in `villageBuild`). A stroke saves a moment after the mouse stops (`groundDirtyT`). **The world
  dresses itself with the same brush (2026-10-07, Robin):** `w.dress()` after planting paints bare earth in the heart of the
  thickest groves, **moss** (a third ground, kind 3, a deeper bluer green; a Moss brush on the board too) at a grove's edge
  and round pines, and gravel at the feet of rock outcrops, from the seed; the save marks `groundDressed` so an older save's
  strokes are laid over the dressing. The brush shows no grid, and a repainted piece is baked again at once (no blue flash).
  **One source for what the pages share:** every page calls `lib.applyStored(localStorage)` (the hero `game.hero2`, the
  creatures `game.creatures`, the rig `creature.rig`) and, where it has the kit, `kit.applyStored(localStorage)` (the look
  `game.look`) instead of its own lines, so an editor always shows what the game shows.
- **The reference set** (Object Editor, first category, starred): oak, pine, bush, rock, cliff, longhouse, woodpile,
  tallGrass, flower, runestone. Each settles one family's drawing rules (canopy, tiers, stone, wood and roofs,
  blades, small bright things, carved stone), and the rest of the props are then restyled to match. The notes
  under the object buttons say what each one settles. **Redrawn 2026-10-05 from Robin's notes:** foliage is
  layered lobed silhouettes (`foliage`: a dark mass, a lit mass, a small highlight, leaf notches), never circles
  on circles; the oak (`oakTree`) is a thick forking trunk under a broad crown with two lower side masses; the
  pine is kept at Robin's 1.4 (h 180); the bush is one foliage mass over a few stems; rocks sit flat on the
  ground with a lit top facet, a dark foot and grass at the base (three builds by seed); the cliff is a stepped
  rock outcrop with grass on its ledges; the longhouse is seen from the three-quarter camera (long plank wall
  with the door, a receding gable end, a bowed turf roof with a hipped end, crossed ridge boards, a stone foot);
  the woodpile shows the logs' lengths running back with the cut ends toward you; tall grass is outlined blades,
  darker and yellower than the ground, with lit tips and seed heads; the flower bends, has two leaves and a bud,
  and its head is a lobed disc seen from a little above; the runestone's grooves are cut (a lit edge below each
  dark stroke) with a trace of red in them. Robin judges these next.
- Props are functions that draw with `shape`, `line`, `gshadow` and materials from `mats()`, registered in `PROPS`
  with a bounding box. `node tools/visual/props.js name name ...` renders them next to the hero.
- Built things use `K.wood`; `K.trunk` is living bark.
- A new prop must also be added to a category in `CATS` in `templates/objects.html`, or it will not show up there.
- **Removed 2026-10-06:** the Environment Editor and the Base Editor (superseded by the game's own world and build mode;
  last in commit `3f526e7`), and the Grass Editor (last in `9d8f68e`; `World.GRASS` and `w.drawGrass`/`drawMeadow` stay in the
  game, and a `game.grass` look in storage is still honoured).

## Sea and islands

**The game's world in the Sea Editor (2026-10-08, the balance pass; Robin: the lowlands a bit further out, bigger seas):** the editor's
panel **The game's world** has two layouts (`spec.layout`): **Free archipelago** (the editor's own sea, as before) and **The game's layout**
(the default): `worldSpec()` builds the options the game hands `World.make` (`isle0` the **Starter island** slider, `big` the **Big island**,
`sizes` every island's width from the sliders with the size variety, `biomes` 1 from **Lowlands from island** on, with the **Lowland island
width**, `dir` 0.1), so the editor's sea is laid out as the game's. The village rules come along (`__VILLAGE__` in `templates/sea.html`):
`planSites()` runs `Village.plan` on the sea as the game does and a **big chart** (`#bigchart`, `drawBigChart`) shows the whole sea with the
islands numbered (home, lowland), every village named and coloured by kind (a town or seat a square), the jetties, and home; under it a line
counts the villages by kind and says how many lowland islands there are and how far the nearest is from home (metres of water, seconds by
karve and by boat). **"Use in the game"** stores `game.world` (count, gap, gapVar, skerries, rough, beach, seed, isle, isle0, big, sizes,
biomes, dir, sizeVar; a free layout stores no sizes); the game merges it over its `spec` on load, so the next fresh start (Esc, New island)
builds that sea; `layoutKey` includes the sizes, so a running save of another arrangement is dropped. The game's own spec stays the
six-island one until Robin picks.


The archipelago code is `src/world.js` (`World`), used by `templates/sea.html` and `templates/game.html`. Islands are placed one after another, each beside an
earlier one at a random gap, so they cluster and chain. Each is a rough blob from noise, with skerries round it.
The map grows to fit (capped at nine million tiles; islands that do not fit are left out and the readout says so).
Each island writes a height into a field (`E`, hundredths of a tile; above zero is land). The ground is painted
per pixel from that field read smoothly between tiles: deep sea, turquoise shallows, a white lip at the waterline,
wet then dry sand (the "Beach width" slider), then grass. `isLand`/`isWater` read the same field, and shore waves
are contour lines of it. The tile grid only records sea, beach, grass or jetty for the game.
Only pieces of sea that touch land are painted, lazily, with the oldest forgotten; open water reuses one piece.
Props and solids are kept in buckets per map piece. A chart in the corner shows the whole sea.

**The vessels and the yard in the art direction (2026-10-07, Robin: an overhaul of the boat building):** `src/yard.js` has its
own ink toolkit (as build.js: `ink`, `inkPath` for the hull outlines, `heavy`, `stroke`, `logEnd`, the grain) and the earth
palette (`COL`: hull, deck, rope, iron). The parts in the yard are real things: a log with bark grain and a cut end with rings,
a rope lashing in twists, a grained plank, a dark keel timber with a lit edge, a strake with iron nails, a thwart, an oar. The
raft afloat is those logs and ropes; the boat's hull gets grain, a cool shade, the strakes as soft lines overlapping toward
the rail, a lit rail, bottom boards, the seats as laid, and the ink line heavy on the shadow side; the near hull over the hero
the same. The yard itself is trodden earth inside a frame of timbers with a faint grid, the boards are the game's planks, the
parts strip has grained slots, the plan tabs and Finish are carved, the preview sits in grained water. Checked in the Sea
Editor by script: a seven-keel boat with strakes and seats laid, launched, boarded, sailed and left, no errors.
`node tools/visual/boats.js` renders the raft and two boats at four headings with the parts.

**The Shipyard in the Sea Editor (2026-10-06):** the game's yard scene itself, an editor inside the editor. **Open the
Shipyard** steps the hero into the same grass yard in a wooden frame (`Yard.scene`, shared with the game: the parts down
the left, Raft and Boat tabs, the build cursor, right click takes back, Enter or Finish launches), with nothing costing
anything. The launched vessel is moored off the end of the jetty in place of the ship and sailed with the handling sliders
(`built`, drawn by `Yard.drawVessel`, `dims()` reads its size, you sit at its seat). **Clear the yard**, **Sail a ship
instead**, and E leaves the yard; the panel sits right under the game view, and you start at the jetty's end next to the
vessel. The yard and the vessel are kept in `seayard2`; `window.seaDbg` exposes them for checks. **The yard shows a
preview** at the bottom right: the vessel as it will look afloat, drawn from the parts laid so far.

Ships (faering, karve, longship, knarr) are a top-down hull turned to the heading and squashed by the 0.75 view
factor, with upright stems, mast and sail. E boards and steps ashore. Handling: top speed, acceleration, turn
speed, glide, grip, and two steering modes (Direct and Tiller).

## Design conventions

- Game rules live in plain data plus a few systems. Balancing should mean editing numbers, not rewriting code.
- Combat is keyboard-first. The mouse is only for aiming the ranged weapon, which also has an auto option.
- **Guidance is subtle (Robin, 2026-10-05).** The game does not state goals or explain itself: no journal, no checklists,
  no "your goal is". Exploring and trying things is the game. Only three bare key reminders appear at the very start;
  everything else is found: prompts over the hero ("E Cook"), people (Brokk speaks in his own voice, never as a
  checklist), how things look, a tooltip ("Torch (T)"). New features must not add hint lines or explaining labels.
  Recipes appear when you first hold their key ingredient, never as question marks.
- Reward doing right instead of punishing doing wrong (Robin, 2026-10-04). The model is Valheim's food: you do
  not starve, but eating gives the health you need, so going without leaves you weak and likely to die from
  something else. No meters that drain and hurt you; the unprepared state is the weak baseline and preparation
  gives buffs. This applies to food, weather, biomes and attacks on the base (no repair chores as punishment).
  Nothing cuts your stamina: Robin finds that not fun, and hates Valheim's wetness mechanic, so there is no
  "wet" state and no weather or biome effect that lowers stamina or slows its return. A rested or comfort buff
  (for example from a warm, well-furnished home) is wanted.
- No screen shake. Hit weight comes from short local pauses, squash, impact rings and sound.
- Hit weight preset "Snappy" is the chosen setting.
