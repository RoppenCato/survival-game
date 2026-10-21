# Viking survival game: prototypes

A 2D top-down survival crafting game set in Viking-age Scandinavia (three-quarter camera, a painted ink look). Ground, water,
buildings, props, the UI and the synthesized sounds are drawn or made in code; **characters and creatures are modelled in
Blender and rendered to sprite sheets** (since 2026-10-09: `art/`, `assets/sprites/`, `docs/moving-to-blender.md`); recorded
sounds and music come from the sound studio. This repo holds browser prototypes and editors, not a full game yet.

The game had another setting until 2026-10-04 (commit `59f5dd6` is its last). **Nothing of it remains, and no new work may
bring any of it back** (Robin, 2026-10-09): no pixel-sprite hero, no eyewear, no blob body plans, robot enemies or Guardian boss.

**This file is the source of truth for the direction and says how things stand now.** `docs/notes-archive.md` was this file
until 2026-10-16: the full record of every change, finding, number and reason in the order it happened, with Robin's words.
Search it for a function, a file, a name or a date before reworking something, to learn why it is the way it is. Keep this
file to what is true now, Robin's decisions and the rules for working: the story of a change goes in its commit message,
long write-ups in `docs/`, and when something here changes, change it here (do not append a dated paragraph below it).

## Working with Robin

- **Robin's decisions are marked as Robin's; choices I made are marked "mine"** so Robin can judge them. Robin has played
  little of the systems below: their numbers are first settings, measured by bots, not felt.
- Undecided ideas and open questions go to `docs/idea-bank.md`, not here. Proposals waiting for Robin live in `docs/` and say
  so at their top (`start-loop.md`, `the-beginning.md`, `world-shape.md`: waters, the lifecycle of a raided place, named
  islands, claims and the year; `build-plan-waters.md`: the steps to build it, for a long Fable session; **`raid-build-plan.md`: the raid in the real game in ten
  steps with a test for each, Robin's order of 2026-10-20, waiting for his yes**; `before-wednesday.md`: what comes first; `ui-review.md` has a list waiting).
- **One project roof, `C:\dev\SG`** (Robin, 2026-10-16): `Art Director`, `Sound Director` (Robin also says music or
  sound director), `Lore Director` and `Game Developer` (this repo; it was `C:\dev\survival-game`).
- **The lore is the Lore Director's** (`C:\dev\SG\Lore Director`; the agreement Robin approved on 2026-10-16 is its
  `docs/integration.md`): names, people, families, what creatures are and what folk believe, and the words people say (lines,
  cards, tales, name pools). **The lore says what people believe; the game decides what is true.** Interface words (prompts,
  toasts, the big-step boards, plain item names) stay mine. Only canon reaches the game, delivered as `out/lore/` with a
  HANDOFF.md, copied into `assets/lore/` and inlined at build time; lines come keyed by situation with slots (`{name}`,
  `{place}`, `{lack}`, `{dead}`), under 130 characters. Words in the game that Robin never reviewed are "in-game" in its
  canon. **A name or line needed before the lore has one is a placeholder marked `LORE?` in a comment, and a message to the
  Lore Director; Robin's lore decisions made here are messaged to it.** `docs/beasts.md` keeps only the mechanics. **The lore
is story, people and beliefs; play is mine** (Robin, 2026-10-17). **Rumours** (handoff 3) are in `__LORE__` like lines, with
`tier` (whisper, lead, truth: never a truth before the thing is seen), `heard`, `when` and `about`; how they surface is mine
and not built (`docs/idea-bank.md`).
- **The other Claude sessions are studios**, reached with SendMessage (the Lore Director above): the **Art Director** (`C:\dev\SG\Art Director`; models,
  renders and sheets, dropped in `C:\dev\SG\Art Director\out\`) and the **Sound Director** (`C:\dev\SG\Sound Director`; sound effects and music
  in `out/sfx/` and `out/music/`). **Copy a drop as the whole folder** (its numbers move boxes that a list of files leaves
  out). Neither studio nor I can hear: a new sound starts from a reference Robin likes, measured, and Robin chooses by ear in
  the Combat Arena's The sounds panel.
- Robin works on a 34 inch ultrawide and sees the game at 1200 by 750 at 3 pixels a unit (see "Judge it at Robin's size").
- Mixamo and other sites: Robin signs in in the browser pane; never sign in, accept terms or change account settings.

## The game design, as decided

- **What makes it different:** raiding, exploring and expanding; several ways to progress, not boss kills as in Valheim.
- **Raiding:** villages, castles and churches on the islands are raided for loot and for people to recruit. Churches have
  only friendly priests who cannot defend themselves: lucky strikes, though an army may turn up. Some villages are for
  trading; one big central trading hub, heavily guarded, is unwise to attack. Nothing is off limits; reputation (risk and
  reward) is the only brake.
- **The hird** (Old Norse hirð; a member is a hirdman, and they call each other fellows): they crew your ships (the more
  aboard, the faster, rowing and sailing), fight beside you on land, can die in battle (never at random), work at home and
  defend what you claim; found and recruited in different ways, with randomised stats and traits and training to change
  them. **They follow and work only inside your territory and on raids, never in the open world.** Claim stones cost stone
  and berries (and snake blood, as built); every stone after the first needs a hirdman as its keeper; without food they are
  slow and sad, never leaving. Arnor is the first hirdman.
- **The year:** spring, summer, autumn, winter, Stardew Valley style but **the player decides when a season moves**, at a
  moment at the end of each season; not abusable, never a stress; seasons feel different and open different things. After
  winter, "controlled randomness": an unclaimed destroyed place is rebuilt stronger by survivors, taken by bandits or
  overgrown, and every island gets generated events (a new settlement with boats and a path, trolls in a new cave, new
  creatures such as Näcken, unraided places growing). **All of the year is for later.**
- **The realm is Skargard** (Robin, 2026-10-16, through the Lore Director: from *skärgård*, archipelago; a part of Midgard), the
  map's title. The gods may appear only in the background, never named, never bosses (Robin); Odin forged the last ring, the one the legends are about; **it is not called the dragon ring** (Robin, 2026-10-19: "dragon"
  is not Viking; the name is the Lore Director's to give, "Odin's ring" until then, `LORE?`; the id `dragon` stays in code). The dragon-head ship stems and the carved dragon post stay (Robin, 2026-10-19: they are
  historical, the *dreki*).
- **The map:** the compass means something, the details are generated: north colder, south richer and settled ("England in
  the south"), east rivers and trade, west open ocean and the unknown. Distance from home sets how hard a place is,
  direction what kind. An archipelago of big islands and big seas; one island can hold several biomes; each biome is harder
  than the one before; no gates or keys: you struggle in a biome until you have done things in earlier ones. **Nothing
  handcrafted: everything generated in a controlled way**, the hub and the great seats too. The map shows nothing until seen.
- **The shape of the sea (Robin, 2026-10-19; `docs/world-shape.md`):** one continuous sea of **waters** (clusters of islands
  with crossings between). **Home water is a lot bigger, with more islands, villages only and a simpler jarl; the player is
  tied to it at first. Raiding is introduced in the next seas.** The four seas round it are **about the same level, each
  giving different things** (the ring's tools on every side, separate things not required to go further). **Seasons
  everywhere, eventually.** **Home water cannot be raided until raiding is opened in the second circle; then raiding it
  lets you overthrow the jarl and claim home's islands, one by one if you want. A new ore every circle; each circle's
  material is got in different ways** (Robin, 2026-10-19). The rest of that doc (circles that do not look like circles,
  generation, climates) is mine, waiting.
- **Scope for now (2026-10-09): the starter island and the big island only**, until they feel great (`spec.sizes` [120,
  400], `biomes` [0, 0], `count` 2); the lowlands and further islands stay in the code, not spawned. **The big island has a
  small mountain** (foothills and a small plateau, about a sixth of it, its north-west; the first copper).
- **Chapters** (`docs/chapters.md`, read it first when choosing what to do; keep its status tables up to date): 1 the starter
  island, 2 home water (the big island and its neighbours), 3 the first sea and the first raid, 4 the other seas, 5 and
  beyond (the cut is mine, 2026-10-20). **One chapter at a time** (Robin, 2026-10-20): a chapter is finished when Robin is
  happy with its content and six areas, each perfected for that chapter: models and art, combat and gathering, menus and
  crafting, the interface, music and sound and effects, the day and night. **What belongs to another chapter is moved there**
  and not worked on now. A system is perfected where the player first meets it (the basics all in chapter 1). Foundations
  (saves, memory, the generator) are done when a chapter needs them. **The current chapter is 1.** One engine and one set of
  numbers throughout.
- **The start:** you land with nothing at a wreck on the starter island; an abandoned, broken steading there shows how a
  village is set up and that the world is dangerous; there you meet Arnor, the first friendly person, and hear of the first
  legendary Viking. **Robin's start (2026-10-16, through the Lore Director; canon):** the hero's past is never explained and
  the player picks his name (no line ever says it); the raider is **Ormr Midgardbane** (folk say the World Serpent fears him;
  he always leaves one alive to tell it); the survivor is **Arnor, the village smith**, an ordinary man scavenging and mending
  in the ruin (he keeps the place Brokk the dwarf had in earlier builds: the story, the raft, the first hirdman); the steading was **Thorgunna's**; the
  dead Viking in the troll's cave is **Hogni**, whose brother **Old Aslak** lives in the big island's first village. A slower beginning that introduces things one at a time (Robin,
  2026-10-14). Sleeping skips the night. Dying at sea is forgiving: the boat drifts to the shore where you last slept and
  needs half its materials (not built). Currencies: more than one, a new one about every third biome; the first island trades
  basics, silver comes with raiding. Arrows are ammunition of several types carried outside the bag (a way is still to be
  found; until then the bow needs none).
- **The second biome (decided 2026-10-07; built, not spawned):** the settled southern lowlands (oak, beech, ash, hedgerows,
  hay meadows, ploughed strips, orchards, chalk; walled towns, churches with priests, a manor), a bit further out; iron (bog
  iron, the bloomery, iron tools and weapons, mail, gambeson, helm, painted shield), the karve, new grounds (field, chalk,
  marsh), raiding with silver as the second currency, and a human jarl who holds the silver ring, won by raiding his hall.
  The draugr is a side threat for later.
- **Villages:** across the islands with generated names; a jetty with a road up and moored boats that cannot be boarded;
  roads between villages uncommon; none thriving on the starter island. Lots of islands and many kinds of places, so every
  playthrough is new yet familiar.
- **The raid (decided 2026-10-07 and 2026-10-13):** about twenty minutes, made of loot spread out behind doors to break (the
  storehouse, the church's silver, the hall's chest, a hidden cellar, every house), each thing taken waking more of the
  place; heavy loot carried to the ship a piece at a time with hirdmen helping, the walk to the shore the gamble; the
  defenders gather to the noise (no bell, no waves; fighting is not the biggest part). **It runs in the real game since
  2026-10-20** (`docs/raid-build-plan.md`, steps 1 to 9 built, step 10 is Robin's play; the live checks are
  `tools/visual/raidgame.js`). **Decided, not built** (what is built today in brackets): pursuit by what you took: short for a
  quiet theft, to your ship for the church's or the jarl's silver (built: nobody past 700 units from his post, further
  under a hunters' plan); a man of yours left behind won back by silver (built: won back by a raid, below); the party grows
  with your ships (a karve's six for farms, churches and small villages; a town of twenty waits for a longship's crew;
  built: Admin gives men); men not fighting fall back with you when you carry (built: only on G); a priest who does not
  fight and can be spared (built: a church has no men and its priest is a villager who runs); traders shut to you and a
  price on your head; one more order, keep the ship. **Built as decided:** a town at peace lets you walk in alone, and with
  armed men at your back its gates are barred; a carrier holds on until badly hurt (`MEN.dropAt`); a held line is a real
  shield wall (`MEN.wallK`); if the hero falls with any of his own standing he wakes at sea aboard his ship, what he carried
  lost; a blow from behind on a man who has noticed nothing kills; the unarmed can be killed; X draws the weapon and a
  drawn blade in a place at peace is a threat; a fallen man's weapon stays with him and is taken from him with E. **The
  people of a raid (step 9, 2026-10-21; the lines are `LORE?`):** a thrall of a place (the generator's role) is cut loose
  with E and joins the hird where he stands (`cutLoose`; he follows anywhere until he is home or aboard, `m.freed`; the
  place remembers him gone, `seen.freed`, an index among its folk as the dead are); a man of yours left behind (`m.lost`)
  stands bound by the hall of the place that took him while its men are up (`boundHere`) and E cuts his bonds; a man who
  yields is let go with E (`letGo`: he runs, out of the fight); a heavy thing dropped in the open goes home on the back of a
  free man of the place when nobody of yours is within 240 units of it (`takeBackTick`; a heavy thing remembers where it
  stood, `it.home`); a place raided before keeps two men more a raid, up to six (`defenceOf`). How many come at you at once
  has five versions on the battle board; `duel` (one on one first) stays after the trial of 2026-10-21 (`tests/battle.js ways`: the least crowding round a man of yours and the hero standing longest; Robin may pick another). **Step 5's second half (2026-10-21):** **the ram** (`RAM`, `ramTick`; G before a barred gate, a locked or stone door or a stone wall of a place not yours with four of your men free: a felled trunk within 260 units becomes it, else 8 wood from the bag; the four carry the studio's ram to 54 units before the piece and swing every 1.6 s at power 3.2 through Ruin's `bite.ram`: a gate in about five swings, a church's door in six, a cut-stone wall in forty, the town wall in ninety; dressed stone and the town wall now have hit points but no hand tool bites them; the loudest thing a raid does, 560 units, and the alarm; a man badly hurt lets go and under four the ram is set down, G at it takes it up again); **the town fights a fire** (the brigade, under Destruction); **the men behind a full gate go round** (`Nav.ROUND`: a man who has waited 3 s at a doorway his own side fills asks the grid for a way round the whole doorway and takes it, the other gate; `MEN.flankAfter`: a man hanging back from a fight with a doorway between him and it does the same after 3 s and comes at you from the far side; measured rare in the bots' trials, 0 to 0.5 of twenty: a town's line is over too soon for it; for Robin to see); men sent to a rally point (the gate and muster plans) fight there, their own door no longer bounds them (a fix). **Next:** step 10 (Robin plays).
- **Scale (the canon, 2026-10-09):** the hero is 1.8 m and 39 units tall: a unit is 4.6 cm, a tile (32 units) 1.5 m. The
  camera sits at zoom 0.65 (the view 390 units tall); houses are at the sizes they were dug up at; the starter island is 120
  tiles, the big island 400, about 200 tiles of water between (`gap` 240); the hero jogs at 84 units a second. Islands feel
  large through obstacles (groves, cliffs, water) more than through distance.
- **Look:** **the art direction is kept; no makeover** (Robin, 2026-10-20, after the studio's options page). Happy, lush, green Scandinavia in daylight; no dark shady scenes, no glowing weird lights. **Art direction
  (decided 2026-10-07, `docs/art-direction.md`): the ink of Egerkrans, the light of Bauer**: one colour key a scene with one
  hot accent, shadows cooler and bluer than the light, an earth-and-bone palette, a warm brown-black hand-made line heavy on
  the shadow side, one sun upper left, grain in every fill. Characters in the cel style Robin picked (2026-10-09). Trolls as
  in the old illustrations: hairy, heavy, long-armed, evil and careless, never goofy or smiling.
- **The ground never looks square:** kinds of ground meet along smooth ragged curves, coasts curve, sand is warm, beaches
  wide; square tiles only for built floors indoors. **Worldbuilding is open:** groves with clear ground between, undergrowth
  near the trees, room to build. Moving things turn smoothly to any heading, like the ship.
- **Tone:** real Viking-age Scandinavia, not a copy of Valheim: things that existed (well sweeps, storehouses on posts,
  boathouses, fish weirs, bee skeps, charcoal pits) and real animals in true proportions. Environment objects come in three
  groups: found in nature, left by people, built by Vikings.
- **Base building:** piece by piece, walls on tile edges, and a roof that appears by itself over any space closed by walls,
  doors and windows and fades when the hero is inside.

## Design conventions (Robin's rules)

- Game rules live in plain data plus a few systems: balancing is editing numbers, not rewriting code.
- Combat is keyboard-first; the mouse only aims the ranged weapon (which has an auto aim too).
- **Guidance is subtle:** the game states no goals and explains nothing: no journal, no checklists, no explaining labels or
  hint lines. Only bare key reminders at the very start; everything else is found (prompts over the hero, people speaking
  in their own voice, how things look, a tooltip). Recipes appear when you first hold their key ingredient, never as
  question marks.
- **Reward, don't punish:** Valheim's food is the model: the unprepared state is the weak baseline, preparation gives buffs.
  No meters that drain and hurt, no repair chores as punishment, nothing that cuts stamina, no wetness. A rested or comfort
  buff from a warm, furnished home is wanted.
- No screen shake: hit weight comes from short pauses, squash, rings and sound. The hit weight preset is "Snappy".
- **Editors first, then the game:** try a thing in an editor or test scene and hand it over with "Use in the game"; shared
  logic lives in `src/`. Every editor: a spec of plain numbers, sliders, presets, settings as text, browser storage; tuned
  values reach the code when Robin pastes the text and it is made the default; change a storage key when its meaning changes.

## Commands

```
npm start         # rebuild, then open dist/index.html (the start page)
npm run build     # python3 tools/build.py: stitches templates/ + src/ into dist/*.html
npm install       # once; the only dependency is @napi-rs/canvas (a canvas for headless tests and renders)
npm test          # the scripts in tests/ in a row (combat, weapons, the ring, gathering, the deer, iron, the karve, fishing,
                  # runes, caves, ambient sound, the blows, the parry chain, the battles, destruction)
npm run art:...   # the Blender pipeline (see "Art"); npm run mountain, npm run cave: render checks
```

No bundler, linter or type checker. `.claude/launch.json`: `workbench` serves the **repo root** on port 8765 (open
`http://localhost:8765/dist/<page>.html`, so pages reach `assets/`), `workbench-alt` on 8766 when another chat holds 8765.

## Pages (in `dist/`)

| Page | What it is |
| --- | --- |
| `index.html` | The start page, by chapter: **Play** (the game), **Systems** (parts of the game set up to work on alone, on the game's engine and numbers: the Combat Arena, the Battle test, the Destruction Editor, the Big island test, the Mountain test) and **Editors** (Art, Village, Sea). |
| `game.html` | The game: chapters 1 and 2. Its save is `game.save`. |
| `game.html?scene=mountain` | **Mountain test**: a mountain island of its own (`World.MOUNTAIN_SPEC`, 220 tiles) with a board to every place in it (slopes, plateau, peaks, waterfall, lookout, sea cliffs, the three caves, the shelter, veins), the troll, beasts, day or night. Own save `game.save.mountain`. |
| `game.html?scene=battle` | **Battle test** (`docs/battle-plan.md`): men one to five a side with bowmen, a town of twenty defended, a raid on it, walk in unarmed, a night raid, storm it with a longship's crew, the ways they come at you; what they carry and wear, how sharp they are. Saves nothing. |
| `game.html?scene=ruin` | **Destruction Editor** (`docs/destruction.md`): a sampler of every wall and roof, the town or village with 0 to 40 men, theirs or yours, fire and wind, mending; a panel of every number of `src/ruin.js` with Use in the game (`game.ruin`); big trials by URL (`&big=1`, `&roomy=1.5`, `&loud=0`). Saves nothing. |
| `game.html?scene=runes` | **Big island test**: at a carver's bench in a hut with a furnace, a clamp and a fire, every rune known, a ring of any metal; to the mountain, the cave, the lair, the troll out or home. Own save `game.save.runes`. |
| `combat-arena.html` | **Combat Arena**: the fight on its own on the game's engine and numbers: your weapon, metal, armour and shield; men against you and hirdmen beside you, set pieces, every beast; the clock slowed; **Show the blows** (reach, arcs, guard, windups); a log of every blow with a tally; **the Tuning panel** (every combat number; Use in the game: `game.combat`; what to test: `docs/combat-tuning.md`); **The sounds** panel (every sound, and the picks: `game.sfxpick2`). **Kept lean (Robin):** every section folds (`<details>`, open or shut kept in `combatarena.open`), a row of choices is a drop-down (`asSelect`: the buttons stay, hidden, and do the work), and switches for things already decided are not offered. |
| `art-editor.html` | **Art Editor**: **Models** (every sheet set, its gear and what is in the hand, the People panel, walk and fight with it; Use in the game picks the hero, `game.blenderHero`) and **Objects** (one world prop at a time: variations, size, shape, surface, colour; a new prop goes in `CATS` in `templates/art.html`). `?tab=` opens a tab. |
| `village-editor.html` | **Village Editor** (`docs/villages.md`): the rules that grow a village; an archetype, a seed, wealth, shore; Use in the game (`game.village`). |
| `sea-editor.html` | **Sea Editor**: the archipelago in the game's layout with its villages planned on it, distances and sailing times, the ships and their handling, the Shipyard; Use in the game (`game.world2`, `game.boat`). |

A test scene's board is on the left and folds; `Combat.api.debug().sceneRows()` and `.act(id)` press its rows. Every page
links back to the menu. Adding a page is a template and a line in `PAGES` in `tools/build.py`. The editors use a wide layout
(a big view, settings on the right): `fitCanvas()` sizes the canvas and sets `Combat.api.pixelScale` (2 to 5); anything a page
draws in raw canvas pixels uses that scale. **Removed** (the archive has their story): the Environment, Base and Grass
editors (2026-10-06); the Light, Gathering, Hird and Item editors and the Art Direction page (2026-10-09; the game still
honours `game.gather`, `game.hird`, `game.look`, `game.light`, `game.give`); the Art Editor's Characters and Creatures tabs
(the drawn figures; the old Character Editor is in `art/backup/`); the Song Editor (2026-10-16: the music comes from the studio).

## Source layout

- `src/combat.js` (`Combat`): the engine: hero movement and combat, the enemies' minds (`beastAI`, `bruteAI`, `shooterAI`,
  `soldierAI`), sides, effects, drawing, and the hooks on `Combat.api` every page uses (see "Combat").
- `src/art.js` (`GameArt.lib`): the drawn ink figures (`playerD`, `inkHero`, creatures, `animal3D`), now only shown while a
  sheet loads; `ANIMALS` (each beast's health, speed, windup), `ATTACKS` (how each fights), `folkSpec`, `applyStored`.
- `src/stylelab.js` (`StyleLab.kit`): the world's props (`PROPS`), ground tiles, `bakeProp` (baked at 2 pixels a unit and
  trimmed to its pixels by `trimSprite`), `SIZE`, and `STYLE`, the one look of the world (the ink look, `look: 3`).
- `src/world.js` (`World`): the archipelago, shared by the game and the Sea Editor: `World.make(kit, opts)`, the height field,
  `isLand`, `isWater`, `isWade`, props in buckets (`around`, `nearSolids`, `addProp`, `removeProp`), the ground baked in pieces
  (`drawGround`, the meadow baked in), the ground brush (`w.paintGround`), waves, the chart, biomes, and the mountains.
- `src/cave.js` (`Cave`): the insides of the troll's cave, the old mine and the sea cave: layout, painting, the dark, a chart.
- `src/village.js` (`Village`): the rules that grow a village (`make`, `plan`, `ARCH`, `BUILD`, `garrison`, names, jetties).
- `src/build.js` (`Build`): building pieces and their drawing in the ink style (walls, doors, windows, roofs, yard pieces,
  posts, stairs, the floor above, ruin states), `rooms()` (closed rooms by flood fill, and the solids).
- `src/ruin.js` (`Ruin`): the rules of breaking in, bringing down, burning and mending, with no drawing (see "Destruction").
- `src/nav.js` (`Nav`): way-finding round walls for everything that walks in a village (see "Men, towns and raids").
- `src/gather.js` (`Gather`): chopping, mining and cutting as a small game; trunks, regrowth, the felling, the shake.
- `src/sprites.js` (`Sprites`): drawing the Blender sheets: the hero (`hero`, `attach`, `pick`), beasts (`beast`), people
  (`person`, `fighter`, `lookOf`), layers and tints, cast shadows, melted slow clips, clips with frames of their own.
- `src/items.js` (`Items`): weapons, tools and gear as specs (kind, material), their names, tales, stats and icons.
- `src/yard.js` (`Yard`): the Shipyard scene (shared by the game and the Sea Editor), hull designs, parts, drawing vessels,
  sailing (`Yard.sail`).
- `src/runes.js` (`Runes`): the thirty runes and the arm ring's drawing. `src/hird.js` (`Hird`): hirdmen's numbers and rolls.
- `src/fishing.js` (`Fishing`): the fishing round, no drawing. `src/ambient.js` (`Ambient`): the synthesized sound of the
  place. `src/sfx.js` (`Sfx`): playing recorded sounds. `src/music.js` (`Music`): the recorded loops' player and the
  synthesized songs (the fallback).
- `templates/`: one HTML shell per page with placeholders (`__ART__`, `__WORLD__`, `__COMBAT__`, `__SPRITES__`, ...) that
  `tools/build.py` fills with `src/` and the sheets' numbers (sheet paths carry `?v=` and a hash of their bytes, so a changed
  sheet is always fetched).
- `tools/`: `build.py`, `open.js`, the art pipeline (`blender.js`, `sprites.js`, `people.js`, `peoplerender.js`,
  `shieldrender.js`, `props.js`), `sfxjs.js` and `musicjs.js` (sound into scripts that load from disk), `seedrand.js`,
  `sweepmen.js`, `roomsize.js`. `tools/visual/`: scripts that render to PNG for checking (`props.js`, `house.js`,
  `villages.js`, `bigplace.js`, `boats.js`, `beasts.js`, `trollsheet.js`, `vasensheet.js`, `people.js`, `mountain.js`,
  `mountainlook.js`, `cave.js`, `worlds.js`, `ruin.js`, `weapons.js`, ...) and scripts loaded into a page in the pane to play
  or check it (`drive.js`, `startplay.js`, `battleplay.js`, `raidplay.js`, `ruinplay.js`, `sackplay.js`, `mountainplay.js`,
  `ui.js`, `smoke.js`, `scenesmoke.js`).
- `tests/`: headless checks (table in `tests/README.md`). `docs/`: the decided and proposed designs (each says which).
- `art/` (`art/README.md`): the Blender build scripts and sources; `art/render/` (raw frames) is not committed.
- `assets/`: `sprites/` (the packed sheets, and `items/` icons), `props/` (Blender set pieces), `sfx/` (the sound bundle and
  its sources), `music/` (the recorded loops as scripts). `dist/`: the built pages, committed.

## Things to know before changing code

- `dist/` is committed: after editing `src/` or `templates/`, `npm run build`, then **parse the built pages** (`node
  tools/parsecheck.js`: `new Function(script)` over each page's scripts; it takes a second) **and check for a name defined twice**
  (`node tools/dupcheck.js`: a page's script is one long scope, and a second `function x` in it silently wins over the first
  wherever it is called. 2026-10-21: it found `bodyNear` (the raid's fallen man had hidden the cave's body: the arm ring could
  not be taken for a day) and `storeAdd` (the chest board's had hidden the hird's: a job gave nothing into the chests since
  the storage commit); `menOf` had done the same in raid step 1. A new function gets a name nothing else in the page has. **It also reports a statement swallowed by a `//` comment on the same line**: found 2026-10-21 in `enemySprite`, where `var o = {...}`, every beast's drawing options, had sat after a comment since 2026-10-20, so the beasts drew without their fire light, loops, young size and lying time.)
- Source files load two ways, inlined into a page and `require`d by Node scripts: no ES module syntax, no browser globals at
  load time. `stylelab.js` needs `global.__mk` for canvases.
- **A patch must not put a `//` comment in the middle of a line**: the templates' lines are long and hold many statements,
  and the comment swallows the rest. End-of-line only, or `/* */`.
- Git converts line endings (`core.autocrlf`): files in the working tree may have CRLF; scripts that search for multi-line
  text normalise `\r\n` first. `build.py` writes LF.
- **The tests have no assertions**: they print values and exit 0 unless something throws. Read the lines against their
  labels; a line marked `!!` is a fault. `tests/btest.js` and `tests/balance.js` are not in `npm test`.
- **A random test can be played again from a seed:** `RSEED=28 TOWN_SEEDS=138,471,101 node -r ./tools/seedrand.js
  tests/battle.js town 3`; `TOWN_DBG=1` prints who stood still and why. Before judging an engine change, run the same seeds
  on the committed code (`git show HEAD:src/x.js` into a scratch folder) and on the change. The scripted raids in the page are
  measured by the same engine: run them again last.
- Tests and render scripts write throwaway PNGs into the current folder; `.gitignore` covers PNGs in the root.
- **Test with the sound off:** open every page with **`?mute=1`** in the pane (Robin hears it and cannot silence the pane).
- **Judge it at Robin's size:** the pane's canvas is 800 by 500 at 2 pixels a unit; Robin's is 1200 by 750 at 3, shown about
  half again larger. Before judging light or painted ground: `resize_window` to 1920 by 1080, reload, capture the canvas and
  look at a crop at full size. Reset the viewport afterwards.
- **Driving a page in the pane:** a hidden pane stops animating; `tools/visual/drive.js` takes over `requestAnimationFrame`
  (`H2.step(n)`, `H2.sim`, `H2.snap`, `H2.part`). The page that `document.write` replaces is still alive: load `drive.js`,
  wait a tenth of a second, `H2.drop()`, then write the page again. A tool call into the page must stay under about 45 real
  seconds. Sheets load lazily: let real time pass before judging people on screen. Results too big for the tool land in a
  file: decode them from there.
- **Never read the canvas back** (`getImageData`) in the game's loop: Chrome drops the canvas to software drawing for good.
- Rooms and their solids are rebuilt when a frame is drawn (`if (bDirty) rebuildRooms()`) and in `ruinTick`.
- **`Combat.api.debug()`** in the game is the console's way in (`eWhat()`, `errlog()`, `perflog()`, `world()`, `villages()`,
  `sceneRows()`, `act(id)`, `tick(dt)`, `place(...)`, `raid()`, `arms()`, `shield()`, `cave()`, and many more); `Combat.dbg()`
  hands out the engine's `P`, `W`, `S`.
- **The error log and the frame log:** every error a page throws (or a frame throws: the loop catches it and goes on) goes to
  `ERR.lines` and `game.errlog`; Admin downloads `errorlog.txt`. Every second of play writes a line to the frame log
  (`game.perflog`; Admin downloads `framelog.txt`; a frame over 50 ms is a SPIKE line). Robin puts both in the project folder.

## Controls (the game)

- **WASD** walk, **Shift** sprint, **Space** dash. **J** or left click: swing what is in hand or shoot the bow (hold for a
  charged swing). **K** or right click: raise the guard (with a shield on the arm a shield's; in the instant a blow lands, a
  parry). **Ctrl**: target the nearest foe, then the next, then let go.
- **The bar** is the bag's top row, six slots, one in hand (`hand`, -1 empty). **1 to 6** take a slot's thing in hand or use
  it (food, a torch); its number again puts it away. **Shift and drag on the toolbar** swaps two of its slots or puts a thing into the bag (Robin, 2026-10-20). The wheel picks a slot, **Enter** takes it. An axe, a pick or a rod in
  hand gathers (the engine's gather mode, `GATHER_KINDS`); anything else, or empty hands, fights (the knife is a weapon, Robin). A one-handed weapon
  taken in hand wears a shield from the bag. Q is no key of the game's.
- **X**: draw your weapon or put it away (among other people it is away until drawn; a drawn blade is a threat).
- **E**: use what you face (one rule, `eWhat`; a crate or barrel with something in it, or somebody else's, is kicked open). **G**: your men: tap "with me", hold "hold here"; "storm" before a place,
  "have it carried" by a broken chest.
- **Tab**: the one screen: your panel top left, the bag under it, what you can make where you stand on the right. **B**:
  build (after Arnor's word); right click opens the Building board; **F** the wreck cursor. **T**: the torch. **M**: the
  map. **R**: rise after falling. **Esc**: closes a board, else the menu (continue, sandbox, restart, new island, the music and
  world-sound bars, Admin). L (the Book of Beasts) is hidden (`SHOW.book` false).

## The game as it stands (`templates/game.html`)

**The start.** A fresh start (or an older save) first asks the hero's name, over the dark before the first light (`naming`,
`heroName`, shown on the panel; the dice offer names until the lore's pools come). You wake in a wrecked boat on the starter
island's beach. E pries four planks from the wreck (12 wood); four
branches and nine stones lie about; three lone trees stand near. Key reminders, in order: "E at the wreck", "Walk over the
things lying about", "Tab", then "1 to 6". Trail stones lead toward the steading 1500 to 2400 units off (`layCairns`); a fish
weir's net on a beach gives 4 fiber. **The burnt steading** (Thorgunna's), burnt by Ormr Midgardbane's crew, drawn with the
destruction states (made over 2026-10-16, Robin: "you can make it look much better"; the choices are mine): the hall burnt
out (most of its walls charred stumps, the rest charred or scorched, its door gone, its roof down as ash and charred beams
(`B.ruin`), its floor earth where no grass grows, its posts charred and snapped short where no wall holds them), a whole
wattle hut scorched on the side toward the hall, a plank house by the well missing five walls and its roof, axe-marked and
sooty (mend it and it is your first home: its bed answers only with a roof over it), a palisade whose gaps are charred stumps
and a gate broken open, the ground round the hall burnt to earth, a cart, rack and post tipped over, crates and barrels that
**E kicks open** (`kickable`, `kickBox`: it breaks at once as to the axe, with no clip; Robin), the graves behind the hall (E reads Thorgunna's stone),
and a campfire by the well. **Arnor** (`npc`; `arnorState`: meet, wait, teach, taught) goes about the ruin
scavenging and hammering at what can be mended (`arnorWork`, his spots `npc.work`, every walk by the yard), and stops to
watch you when you come near; his story's last line opens building; while you build he names what your home lacks; at
comfort 4 he teaches the raft. Once, when you stand at the graves, he comes and tells who lies there; when your first raft is
launched he is at the shore to see you off. **Every line he says is the Lore Director's** (`loreLines('line.arnor.*')`, from
`assets/lore/lore.json`, inlined as `__LORE__`), as are Old Aslak's (the first village of the big island: his brother Hogni's
story a line a talk, other lines once you wear the bronze ring) and the villagers' pairs about Ormr. Words that are not a
person's (the scratch by Hogni, the carving on Thorgunna's stone) go on the speech board too (`sayAt`). What anyone says
shows on the speech board at the foot of the screen. The big steps
are bordered boards (`bigStep`: "Building", "The raft", "You have left the island", the last whenever you stand
on another island's land). **The bar is there from the start** (Robin, 2026-10-17: not something you gain); B, and the bar's "(B to build)" (`api.canBuild`), wait for Arnor; the Building
board holds the plank house's pieces and the workbench until the first night slept under a roof opens twenty-four more
(key `slept`).

**Gathering** (`src/gather.js`, through `Combat.api.harvest`): a tree's first blow cuts a notch, blows from the other side are
the back cut and fell it toward the notch; it falls as a trunk (four logs, eight blows, struck anywhere along it) and
chips (never fells) up to three trees in its line (`fallBite`, Robin); a rock cracks; **berries and grass are picked by hand
with E** and pop out (no tool takes a bush; Robin): a berry bush grows its berries again in six minutes and gives no grass;
grass comes only from tufts of tall grass (`GRASS_KINDS`), and a pulled tuft is gone (Robin), growing back where it stood
after `GT.regrowDays` 3 (mine; a saved decal of kind `grass`; the regrowth runs on every new day); and now and then a tree's wood
comes with a strip of fiber; everything shakes when struck; the swing's pace is 1.5; a tool bites a beast at `TOOL_DMG` 0.8 of a weapon. Stumps regrow. Drops lie with a bounce
and are picked up by walking over them. Admin's "Threefold drops" (`yieldK`) multiplies what is gathered and dropped. **The pine,
oak and birch are the Art Director's pictures** (2026-10-20, Robin's pick: concept A, the large size, a pine of about 5.3 m, three
heroes; `assets/props/trees`, set pieces through `World.setImages` in three variants a kind by the prop's seed, drawn at their
own size, `fixed`); the felling states stay the game's, and **a felled tree lies as its own trunk picture** along the fall,
its chopped end at the stump, shortened at the far end as the logs come off (never thinner: Robin), **and each log rolls
out at the far end as the studio's log picture** (a drop of kind `log` that gives its wood when walked over; a tree without a
log picture drops wood as before). **The workbench and the raft bench are the studio's pictures too** (2026-10-20,
`assets/props/pieces`, the same way; their footprints widened to the pictures, `r` 8 and 12), **and the plants** (`assets/props/plants`:
bush, berry bush, juniper, heather, fern, tall grass, reeds and mushrooms, three variants each; a picked berry bush is a
bush until it regrows), **and the rocks** (`assets/props/rocks`: rock, boulder and rock formation in six variants each, by
the prop's seed; the cracks and the sweet spot's cue are drawn over them), **and the camp things** (`assets/props/camp`:
the drying rack, woodpile, chopping block, log seat, cart, well, trough and the two tents in undyed wool, their mouths
south), **and the furniture** (`assets/props/furniture`: bed, chest (and `chest_open` while its board is open), chair, table,
bench, crate, barrel; the rug, loom, stool, shelf and cupboard come with the steading), **and the villages plan's drops**
(the Art Director's `out/villages`, 2026-10-20): **the steading's things** (`assets/props/steading`: the graves as turf mounds
with Thorgunna's standing stone, `spriteName` maps `graveStone` to them; the trail stones; the scarecrow, shield rack, dragon
post, flower bed, haystack, net, weir and well; and the raid's wreckage laid at a fresh start as **ground litter**: decals of
kind `litter` drawn under everything, `charredBeam` in the hall's ash and across its door, `burntHeap` in the hall and by the
hut, `brokenDoor` by the gate), **the fences** (`assets/props/fences`: a ring's stakes `stake_1..6`, `stake_new` for a mended
run, `stake_stump` for one hacked down (`spriteName`), `railPost` and the wattle `hurdle` pieces for rail and wattle rings on a polygon (not built: those fences stay Build edges); the palisade, rail, wattle and gate drawing of the Build edges is the studio's in `src/build.js`), **and the faces**
(`assets/props/faces`: porch, bell tower, apse, gable cross, lantern, sign, awning, woodshed, the laid `foodTable`; thatch in
courses with a turf ridge and the turf roof's bark board in `drawRoof`; **a room with a hearth or a fire pit indoors has a
smoke hole in its ridge** (`Build.drawSmokeHole` at `Build.ridgeMid`), the fireplace keeps its chimney), **and the yard's
things and the sacred** (`assets/props/yard`, `assets/props/sacred`: the storage hut, boathouse, bee skeps, stall, banner,
sign post, fire ring, runestone, burial mound, cairn, stone ship, lych gate, way cross, font, altar, furnace, charcoal pit,
the carver's and mason's benches by their names; and new in the generator (mine, 2026-10-20): a `quern` in the door pool, a
`washingLine` behind one house in two, the hall's `spearRack` and a `torchBracket` at its door in place of the lantern, the
`forge` in the smithy, the `midden` heap on earth behind the longhouse, a `watchtower` and a torch inside a walled town's gate
at wealth 0.5 and up (a bowman's post, raid step 6), a `beachedBoat` on a shore place's sand; a set piece with no drawn prop
of its name passes the village's prop check), **and the raid's set** (`assets/props/raid`, the studio's step 6: the ram, sack
pile and hanging fish, the heavy chest whole and broken, the sack, trapdoor, crypt stairs, coffins, reliquary, bones, ladder,
bucket, the beached karve; wired as the raid plan's steps 7 and 8 reach them). **The Building board's cells show the studio's
icons for the buildable set pieces** (`assets/hud/pieces/<picture name>.png`, the villages plan's step 7, inlined as
`pieces/<name>` in `__HUD__`; the kit's walls, floors and roofs keep the drawn ones). **A house's lantern goes out at midnight**
(`nightFires`, day.t 1470 to 1740); the hall's torch, the gate's and the watch's burn on (the dark a raid wants). **Two more ground
kinds, ash (7) and soot (8)** (the studio's paints): the steading's `villagePaint` lays ash over the hall's floor thinning out
of its south side and soot at the foot of the hut's wall and under the plank house's north wall. The build folds any
`assets/props/<folder>/<folder>.json` into the set pieces (`prop_images`); `w.sprite` looks for `name_1` to `name_N` for
however many variants a piece has (`variantsOf`), then `name`, then the drawn prop. The other kinds (beech, ash, apple, dwarf birch, the struck tree) are still drawn
props at their old size (Admin's **Trees** cycles their bake; `World.TREE_SHAPES`); rocks come in six variations of tone and build.

**The bag and the Tab screen:** stacks of 25, no weight; the top row is the bar, four rows under it (`BAG0` 6). Drag moves,
right click uses, Shift and click sends across to a chest, Shift and drag carries half a stack; Sort tidies. The panel
("You") has Gear (helmet, cloak, tunic, trousers, boots; shield, necklace, two rings, two trinkets, the arm ring), Stats after
the first kill, Ring once a ring is worn. **What is worn shows as the art studio's rendered icons** (`assets/sprites/worn/`, 2026-10-20; `Items.setWorn`, the game's `wornPick` choosing them as the hero is dressed, the cloth tinted by its material) in the slots, the bag and the crafting board; an empty slot shows its icon faint. The panel's redesign waits for Robin's pick of the studio's three directions. The crafting board sits lower right under the chart, **the list on the left and
the chosen thing beside it** (Robin). **Each board lists only its own**: Tab opens what you make by hand, with a tab for a
workbench, a fire or a furnace you stand at; E at a fire shows its dishes, at a furnace its bars, at a workbench its things
(with a By hand tab). A chest takes the right side instead. The middle of the screen stays clear (Robin).

**Crafting** (`RECIPES2`): a recipe is listed once you have picked up its key ingredient; a thing never made carries a gold
dot. Made by hand anywhere, or at a roofed workbench, a hearth, a furnace or a shipwright's bench; each press pays, so a
queue is what you can afford; jobs take seconds; a station keeps what it made in its Ready strip; Cancel gives the materials
back. **The board's three picks (Robin, 2026-10-20, from the Art Director's `out/hud/CRAFTING.md`; the fourth, where a
material comes from, waits for a lore book):** **a count** (− and + in sockets beside the button, which reads "Craft 3"
or "Cook 3"; remembered per recipe, `craftN`; red when that many cannot be paid; a press pays as many as it can and
queues them; holding the button keeps making one every half second; the button fills once per piece); **a pin** at the
card's plate corner (`pins`, up to three, the oldest let go; saved): a pinned recipe shows as a **vellum slip** bottom left
(`drawSlips`, 200 by 64 from x 24, y 560, 74 apart) while no board is open and no fight is on (`fightT`: a beast or man
awake within 420 units, the music's test), with its picture, name and each material as have/need (green when enough, red
when short) and "ready to make"; a click on the slip's pin lets it go; **the hand board teaches the stations**: under its
own groups, faint, "At the hearth", "At the workbench", "At the furnace" for each station kind the hero has stood at
(`seen.stations`, set in `stationNear`) with what it makes that he knows; a dim row can be chosen and its card says "Made
at the hearth" in place of the button. The pin is the studio's `pin_on` and `pin_off` (drawn in code while they load).
Hand: flint axe, knife, pick, wooden club, stick bow, torch. Bench: the flint sword, the wooden shield, the leather set,
copper and iron tools and weapons from bars. Charcoal (none on the starter island, where nothing uses it: no old fire rings or struck trees there, no embers: Robin, 2026-10-20): embers at dawn by every fire that burned all night, the charcoal
clamp, lightning-struck trees, old fire rings. The furnace makes copper bars (and iron bars from bog iron).

**Building** (B, `PIECES`, `src/build.js`): the board is tabs by kind (frame and walls, floors and roofs, ground brushes,
yard, furniture, work, outdoors), eight pieces a row with name and cost; pieces open by keys (things picked up or built,
Arnor's teaching: `slept`, `leather`, `honey`, `copper`, `mason` (the mason's bench opens stone), `charcoal`, `ironBar`,
`bogIron`, `silver`, `snakeBlood`). Walls in logs, planks, wattle, stone, turf (timber frame and cut stone from iron); doors,
windows, posts, stairs to one floor above, floors, docks over shallow water, the ground brushes (gravel, earth, moss, grass;
field, chalk, marsh). A closed room gets a roof by itself (thatch unless you pick turf, shingles, tiles or slate; `BCFG` is thatch, Robin) that fades
when you are inside. The cursor lights a wide green band on the edge it is near and marks standing walls; walls near it fade.
**On the starter island the board holds only what the house and the raft need** (`STARTER_PIECES`: walls in logs, planks and wattle, the door, window, post, two floors, thatch, the workbench, bed, raft bench, chair, bench, table, rug, chest, campfire; Robin, 2026-10-20). The placement ghost is drawn over the world's things (`api.overlay`). F takes pieces back for what they cost. Nothing can be built in somebody else's village. E never works through a wall
(`canReach`).

**Home, sleep and comfort:** a closed room is worth its roof, a hearth, a workbench, a bed, a rug and up to two pieces of
furniture (at most 7). **A fire burns outdoors** (a campfire or a hearth cannot be built inside) and counts as the house's
hearth within `FIRE_YARD` 100 units of it; a fireplace goes inside, but not on the starter island (Robin). **The fires are the
Art Director's set pieces** (Robin, 2026-10-20: "use the fire models"; `assets/fires`, copied whole from its `out/fires/sheets`,
inlined as `__FIRES__`): the campfire, the hearth (with its tripod and pot), the fireplace, the brazier and the fire pit, each a
base, a loop of flames (10 frames at 12 fps, each fire at its own point of the loop) and embers, drawn by `drawFire` at 4 px a
unit; the light, the smoke, the sparks (from the fire's heart, `fireUp`) and the shadows stay the game's. A hearth nobody keeps
(`it.cold`: the burnt hall's) shows no flames and is no hearth; `it.burnt` would show the embers. The comfort line shows it. A bed answers only under a roof and only if it is yours; sleeping skips the
night, and under a roof leaves you rested for comfort × 2 minutes. Inside a room with comfort and near a fire you heal. Chairs
and benches seat you (E). The shipwright's raft bench needs comfort 4 at home and goes on the sand by the sea.

**Day and night:** a 30-minute cycle (`DAY_LEN` 1800: day to 840, dusk to 1200, night to 1740, then dawn). The dusk stays
golden and darkens faster toward its end (`DUSK_POW` 2.4); "The light is going" at a quarter dark. The night is dark (you see
14 units without a torch); a torch burns 6 minutes. **A pack of three wolves comes each night**, eyes red; a fire keeps them
140 units off, and in its light they give up after about sixteen seconds.

**Food:** dishes heal at once and give top health, health a second and stamina for ten minutes or more (`FOOD`); no hunger.
Cooked at a fire in a queue, waiting there. Roast berries, roast meat, berry stew, eggs and honey; fish dishes in the lowlands.

**The villages' animals** (the Art Director's step 5A, wired 2026-10-21; the numbers mine): hens, goats, sheep and cows on the beasts' sheets (`assets/sprites/hen|goat|sheep|cow`, `npm run art:stock`). A place gets its stock by its kind (`LIVESTOCK`: a farmstead four hens, a goat, three sheep and a cow; a town eight hens, two goats, two cows; a church two hens) when the hero comes within 1200 units and loses them when he has been 2600 off for 40 s, as its men (`stockTick`); hens and goats keep to the yard, sheep and cows to the byre's side; they amble, graze or peck, lie down now and then (`stockMind`, the sheets' graze, peck, lie and sit clips through `idleClip` and `clip` in `Sprites.beast`); every one of them scatters from the hero (the engine's flee) and comes back; **a goat goes for nobody** (Robin, 2026-10-21: one that attacked at random was weird and set the place against him) and butts the air now and then (the sheet's butt clip); a village's animals are no fight: the FIGHT mode ignores them. They can be killed for meat and hide; a villager or a man who sees it cries thief and the place is stirred (never in home water), and the dead stay dead for the day (`seen.stock[vi]`). Checked in the live game (`raidgame.js` R.stock). Not built: eggs, the dog.

**Beasts** (Blender sheets, dressed from the combat numbers: `Combat.tuneBeast`): on the starter island **young boars** (6
health, 7 a bite), **deer in herds** and adders; on the big island boars, moose and a bear, and the troll in his cave; wolves
at night. Counts scale with an island's area. A beast ambles round its home and charges when you come near, each its own
way (the boar charges, the bear and moose swipe, the wolves circle and bite in turn, the adder poisons). **The deer** sees you
230 units ahead and less behind (the herd's watcher sees all round), runs the open way, stands and watches; shot, it bleeds,
slows, runs shorter and leaves a blood trail to follow (`SHY`, `api.onBlood`); one wood arrow bleeds it out in about 37 s.

**The troll's cave** (on the big island's mountain; its mouth painted into the cliff): a way through from a daylight tunnel
past holes in the roof that follow the sun, a pool, a chasm, a gallery of copper veins, to the troll's lair and the dead
Viking with the bronze ring; a chart of what your light has shown. The troll (the boulder troll's sheets) walks out on some
nights (a fire makes him shield his eyes; caught provoked by daylight he turns to stone), walks home at morning, keeps a
hoard. **His young, Hårungen** (Robin, 2026-10-16; the art studio's sheets `troll_unge`, half the hero's height): five live
in the cave, waddle to the ore rocks and veins and bonk at them with their bones (it gives nothing), idle about, and shuffle
off if you come close; friendly unless attacked: one struck turns on you, and so does every other that can see it
(`ungeAlarm`, `caveSight`). **The troll comes for you** (`trollSeek`) when the young are struck again and again, wherever he
is (4 blows, one forgotten every 12 s), when three have been killed, when he sees you in his cave (`trollSeesIn`), and as you
mine: past 3 ores each ore is a chance, 4% more each time (`ungeOre`; he no longer comes at every blow). Hunting, he follows
the passage toward you, goes straight at you once he can see you, and walks home a while after you leave. A lost young
comes back each dawn while the troll lives. The numbers are mine (`UNGE`); the boards have "To the troll's young". The first copper is the veins in the mountain's open cliffs; there is none on the starter island. The old mine
and the sea cave exist on the Mountain test's island only.

**The arm ring and the runes** (`docs/arm-ring.md`, `src/runes.js`): thirty runes, knowledge not items, earned by deeds,
kills, stones and meetings, learnt once a ring is worn (the bronze ring from the dead Viking), cut into the ring at the
carver's bench for five health (a coil per side: hand, foot, eye, heart); a rune works only while cut (`inUse`, `api.mods`).

**The hird** (`docs/hird.md`, `src/hird.js`): claim stones (stone, berries, snake blood) with a reach; Arnor joins at your
first; hirdmen follow (inside your territory), take jobs at workplaces and eat at dawn from chests; muster at a stone.

**Villages** (the big island): grown by `Village.make`, placed by `Village.plan`, named, with jetties; what stands in the
world (their ground, props and own trees, the roads and the jetty's barrel; the steading's ground too, `villagePaint`) is
made at every start by `hamletDress` and their pieces in `B` at a fresh one by `hamletBuild` (2026-10-20: a loaded game had
lost the props and roads); their people live
routines (spots, jobs, sitting at the fire, watching you a while), find their way round walls, run, hide or arm when you draw
a blade or raid, and can be killed (the dead are remembered by name). **Their clothes and their work are the Art Director's step 5B** (wired 2026-10-21): the people's atlas carries the apron, the kerchief and the straw hat, the hammer, the saw and the bucket for the hand, and the clips hammer, saw, carry, carry_walk, kneel and sit_work (`tools/peoplerender.js` renders them, `art/build/folk_build.py` keys them on `people.blend`); a villager's calling dresses him (`ROLE_X`, `roleLook`: the smith's leather apron, the weaver's linen one, a straw hat on one farmer or fisher in two, grey hair on an elder; a woman in the dress wears the kerchief, under no hat) and gives him his clip (`JOB_CLIP`: the smith hammers at the forge with the hammer in hand, the well is the bucket held and carried, `carry_walk` whenever a villager carries (the brigade too), a priest kneels before the altar (the spot `pray`, held), the weaver and the net mender sit at their work; the hird's crafter saws at the bench). They can be broken into and burnt ("Destruction").
Houses are narrow and long at real sizes (a house 4 by 6 to 9 tiles, a longhouse 5 by 14 to 18, a hall 6 by 20 to 22).

**Boats** (`src/yard.js`, `docs/boats.md`; **`docs/ships-plan.md`: how the ships should work, Robin's six thoughts answered,
2026-10-21, its questions waiting for him**): E at a shipwright's bench steps into the Shipyard; a vessel is a hull design chosen
there (raft, faering, boat, karve, longship by the bench's tier), **fitted out on a board** (2026-10-21, Robin: the yard's laid
cells for upright things looked weird; the raft keeps its laid logs: he liked that): the rowing seats as a count with − and +
(placed along the hull by `Yard.autoThwarts`: a rigged hull fills out from the mast, aft first; a boat spreads them), the mast,
sail and steering oar as one needed thing, the dragon stem and the shields as yes or no, the vessel drawn live on the water in
the frame as it will look (`scene.fittings`, `fitSet`, `hudHull`; the board writes the yard's cells, so the checks, the fit, the
save and the launch read what they always read), and launched (the hull is paid then). Sailing is `Yard.sail`: every vessel, the raft too, goes forward on W and
steers with A and D (Robin), with the wind for rigged hulls and rowers for the crew (hirdmen board and row). A boat or karve has a sea chest. The raft is taught by Arnor; boats need copper; **the karve is the copper age's sea-going ship** (wood 24, copper 10, fiber 12; decision 1 of the waters plan at its default, 2026-10-20: the ship that leaves home must be buildable from home's materials), the longship needs iron.
**The hulls are at the sizes they were dug up at** (2026-10-21, `Yard.HULLS` in metres: the faering 6.5 m, the boat 9, the karve
16 by 4.2, the longship 23; a yard cell is a thwart's pitch, `CW` 24; the sizes measured by `tests/ships.js`), **the camera pulls
back at sea by the hull** (`H.sea`: a karve 0.55, a longship 0.45; Robin, 2026-10-21: "it feels more epic and big, and you feel
small") **and a + and a − by the chart zoom in and out** (Robin; `ZOOM_STEPS` 0.6 to 1.3 on the standard, `zoomK`, kept in
`game.zoomK`; the sea's pull-back multiplies it; `zoomTarget`). **The hull's look (Robin's question 1, settled with the Art
Director, 2026-10-21): drawn in code, the studio's surfaces laid on it** (its palette, a plank strip and a rail strip mapped
along the strake rows, painted shield faces; the outlines for it in `docs/baselines/hulls-2026-10-21.svg`, `tools/visual/hullpaths.js`). **The crew sits by `Yard.crewPlaces`:** on a rigged hull
the hirdman with the most wits is the helmsman at the steering oar facing forward (he does not row: `v.helm`), the rowers fill
the thwarts from the stern, the right-hand side first, two a thwart (one on the faering), **facing aft**, the rest on the floor;
**the hero rows only alone** (seated on the aft thwart, his pair of oars, `P.anim.sit`; alone on a karve at the steering oar) **and
with any man aboard stands in the bow looking ahead** (`Yard.heroSeat`; Robin, and the helmsman rule his yes of 2026-10-21), turning only to strike or shoot. **One stroke for
the whole ship** (`v.stroke`, `v.rowing` in `Yard.sail`: a pull then a recovery; the oars are shipped when the sail is full and
doing the work): `Yard.drawOars` draws every oar from the rower's hands over the rail to the blade. **The rowers row and the helmsman
steers with the Art Director's clips** (its ships drop, wired 2026-10-21): the people's atlas carries `row` (8 frames, the pull
frames 0 to 2, the recovery 3 to 7; `frame = floor(phase * 8)` from `Yard.strokePhase`) and `helm` (a seated idle, the hand on
the tiller), and the oar's inboard end is the drawn frame's hand (`Sprites.hand`: the right hand on the port side's rower,
the left on the starboard's; `rowers[i].hands`); **the hero rows alone with the kit's own `row`** (packed with its own frame
by `kitpack.js --own`, no hand things, no blending; `P.anim.row` is the phase, picked in `Sprites.pick`); the `sit` clip and
`Yard.strokeLean` stand in only where a sheet is missing. `art/build/rowing_build.py` (the studio's) keys both on
`people.blend` after the folk build (in `npm run art:people`) and `row` on `hero_kit.blend` after the kit's; `peoplerender.js`
has `row` and `helm`. **The hull wears the studio's surfaces** (`assets/ship/`, the same drop: `plank_strip.png` and the lit
one, `rail_strip.png`, `shield_01..08.png`, the palette in `palette_review.png`): `Yard.setSurfaces` takes the loaded images
(the pages load them from `../assets/ship/`, `tools/visual/boats.js` headless), `hullBake` bakes each hull's sides once a kind
and lit side at 2 px a unit (the plank strip along every strake row cell by cell, u along the keel, v from the inner curve
to the rail; the lit strip on the side facing the world's upper left, `litPort`; the rail strip along the gunwale; the ink
outline over it) and `drawBoat` and `drawVesselFront` draw the bake; `drawShields` lays the painted faces 11 units apart
(`shieldFace`: the muted six, the red two one in four); `COL` is the studio's palette; the shadow under the hull is the sea's
own colour, soft at the edge. Without the images the hull draws as before. **The vessel is one drawing** (`drawShip`:
the hull, everyone aboard by depth, the rig between those behind the mast and those before it, the near rail with its shields
over their legs (`Yard.drawVesselFront` takes the figures), then the oars); the engine's own hero draw stands down aboard
(`shipHero`). **On and off (`BOARD`, mine):** the gangway is the hull's point nearest the land (`Yard.gangway`); E within reach
boards the hero and **calls every follower within 420 units** (`m.boarding`: he walks to the gangway's land point and climbs
aboard within 28 of it; the engine's men on a raid shore the same by an errand, `e.toShip`); **the ship waits for them up to 8 s**
(W does nothing; the toast "The men are coming aboard"), then those within 420 have waded the last bit and the rest are left
("X is left ashore", he walks back to the stone); the seats fill in boarding order (`m.seatNo`); no room (`BOARD.cap`: the rowers
and a helmsman) and a man says so. **Landing files them off** one every 0.35 s (`raft.landing`, `landingTick`) onto spots spread
along the shore (`Yard.landingSpots`), each walking to his spot (`m.landTo`); on a raid's ground each becomes a man of the engine
as he steps off; on another shore of home water they keep the boat. Admin's karve lays three thwarts aft of the mast and three
before it. The lines are `LORE?` (asked). **Not built:** shooting from the deck (chapter 2), enemy ships, grappling and the fight on the
decks (chapter 3: Robin's yes), the fleet, the studio's surfaces on the hull (the plan's steps 5 to 8); your colours on the sail
and the shields and a ship's name come later (Robin).

**Also:** fishing with an iron rod (the lowlands' fish and a fisherman's dishes; not on the two islands); the map (M) and the
chart show what has been seen; saving in `localStorage` (keyed by the world's layout, so a save of another arrangement is
dropped; **the painted ground is saved as what differs from the ground the world paints at every start** (`groundBase`,
`groundDiff`; 2026-10-20: the whole field was 1.5 MB of a 1.6 MB save, now about 55 KB; an older save's whole field loads and
is saved as a diff from then on); **Admin** in the Escape menu (immortal, one-shot, free building and crafting, fly, threefold drops, shield only
when raised, the old fight sounds, the frame readout, full resolution, the Light and sound board, go-tos, the two logs);
critters (butterflies, birds, beetles) that keep away.

**The lighting trials** (`docs/lighting.md`; switches on Admin's Light and sound board, `LAB.light`): on are `glow` (warm light
fading to the night's colour), `shadows` (things throw shadows away from a fire; a torch's are faint), `sides` (figures lit
from a fire), `walls` (a fire indoors lights its room and pools at doors and windows) and `moths`; off until Robin has
looked: `moon`, `mist`, `shafts`, `clouds`. Robin found the first version "a weird filter"; the shadows were liked.

**The UI** (`docs/ui-review.md`): boards are drawn over the HUD in one order (`scene.boards`). **The panels' look is the Art
Director's** (2026-10-20, Robin's mix of its three directions; its `out/hud/SPEC.md` and `hud_mix.png`, the art copied whole
into `assets/hud`, inlined as `__HUD__`), **with Robin's own picks from the studio's panel picker** (2026-10-20, the end of
that SPEC): every board (`wood()`) is the dark oak with a dark outline and two gilt lines (`hBoard`, 9-slice
`board_frame_gilt`); every board's heading is its name on a plaque (`hTitle`, `plaque`; Robin's second round, 2026-10-20);
what is chosen is pale gold `#ead08a`; the Gear board (330 by 360 canvas pixels) has the hero in an
arched vellum window and six square dark slots with a bronze rim a side (the arm ring where the spec has "armour", mine; an
empty slot shows a pale sepia sketch; nothing under the window, no runes: Robin), and rounded flaps hanging under it (Gear and
Stats: what was the status line under the window; no Rings page, Robin: runes get a window of their own later; **the Stats page** (Robin's picks of 2026-10-20 in the studio's SPEC, built 2026-10-21: `drawStats`) as big as the Gear page so the bag shows, his face in a ring top right (`portrait_ring`, the kit as he is dressed clipped to it), the thirteen rows of `statRows` in four groups, Life, Fighting, Moving, Work, each with a small picture (the studio's `stat_*` pieces; the sword, bow, axe, pick and knife icons for the weapon and tool rows), health and stamina as bars at the right edge; `hFlap`, Robin: "rounded flaps on the
bottom so it's not so square"); the bag (330 by 306) under the flaps is dark sockets; crafting (453 by 500, bottom right,
narrower so more of the game shows: Robin) has its list in a dark well, a vellum card with the
thing's picture large, a sub-title (`infoSub`, mine), the tale, its numbers and **the cost as each material in a socket with
the number needed in its corner, red when you have too few, and "Short of fibre" beside them** (Robin: "it should just be 3",
no "Needs"), and the Craft button; **the station tabs are flaps off its left edge** (the studio's follow-up, 2026-10-20: `hTab`, `flap_left_on` in red
leather 30 wide when chosen, `flap_left_off` in oak 24 wide, each as tall as its word plus 24, drawn before the board so their
right edges go under it); a thing's hover card is vellum, over every board. **The Building board** (924 by its rows) is in the
same clothes (2026-10-20): its category tabs are **flaps across its top** (`hTopFlap`, `flap_top_on` 38 tall, `flap_top_off`
30, as wide as the word plus 28, 6 apart, their feet under the board), the Building plaque, and **a dark cell a piece**
(`build_cell`, 105 by 126 at the board's pitch of 111 by 132: the piece as the game draws it in the upper 70, the name in
regular 13, the cost as each material's small picture and a bold 12 number, red when short; a cell that cannot be paid at
45%; the chosen or hovered one ringed in pale gold, `build_cell_chosen`); the never-built mark is the crafting list's ochre dot.
A board is drawn in Robin's canvas pixels (`hPx`, three to a unit) so the spec's numbers stand as they are; the mouse is
tested in units. **The type is Alegreya** (Robin's pick; `UI_FACE`): its Latin files from Google Fonts in `assets/fonts`
(SIL OFL, `OFL.txt`), inlined into the page by the build (`__FONTS__`), so it works offline. On the Tab screen a click on
the panel or the bag reaches them and the crafting board stays open. E does one thing by one rule, `eWhat(P)` (a new thing E can do is one `add(...)` line there); the HUD
is health and stamina top left, the chart and the meal top right; damage numbers are the engine's damage × 10 (`SHOW`), whole.

## Combat (`src/combat.js`)

- **Enemy types:** `beast` (every animal), `brute` (the arena's bear: chains and a spin, a stagger bar), `shooter`,
  `soldier` (a man). Pages dress them (`api.dress`, `api.dressMan`); undressed they draw as a plain ink beast. No boss type.
  Collision is circles only (`W.pillars`; big maps pass only the solids near the hero).
- **The hooks a page uses:** `api.scene` (`begin`, `items`, `end`, `boards`, `bounds`, `walk`, `heroLift`, `noHud`,
  `ownFallen`), `pixelScale`, `roster`, `dress`, `items` (`held`, `tool`, `weapon`), `harvest`, `mods()`, `armor`, `shield`,
  `sfx(n, v, src, x)`, `onLog`, `overlay`, `parryWindow`, `meleeStep`, `struck` (people the hero's blows can hit), `nav`,
  `onNoise`, `onBlood`, `enemySprite`, `heroSprite`.
- **One spec of numbers: `Combat.tune(over)`** lays a page's differences over `tuneDefaults()` and writes them in place: the
  feel (`WPRE.snappy`: fz 0.75, pf, kb), `PARRY`, `MEN.parryStun`, `TOOL_DMG`, each melee kind's `PROFILES`, `MEN`, and each
  beast's `BEAST_GAME` numbers with the art library's health, speed and windup (`beastNum`, `tuneBeast`). The game applies
  `game.combat` from the arena. **The arena plays from its own working copy (`combatarena.tune`); the game gets those numbers
  only by Use in the game** (the line under the Tuning panel says whether the game has them). **Change a default by changing
  `PROFILES`, `MEN`, `BEAST_GAME` or `WPRE`.** The men are
  armed from `MAN_PF`, a copy of `PROFILES` taken before the hero's tuning, so the hero's weapon numbers are his alone.
  Robin's first tuning (2026-10-15, "this feels good") is the default: the sword wu 0.11, ac 0.4, rec 0.2, reach 50, lunge
  123; the boar's speed 1.1. **But the sword's blows (and the fists') take their pace from `STEPS`, not `PROFILES.sword`**
  (found 2026-10-20): the arena's sword sliders for wu, ac and rec do not move a sword blow (its reach and lunge do); whether
  to switch the sword to its profile is Robin's (it would change the feel he approved). **The player's blows start on the
  press** (Robin, 2026-10-20): every kind's wu 0.03 (the Dane axe 0.15, its weight), `STEPS` 0.03 (0.06 on the chain's last);
  a charged blow keeps its hold; the men keep theirs. **The men retuned to it (mine, 2026-10-20): `MEN.dmg` 18, was 12**, the one
  number that brings `tests/battle.js ladder` back to its targets (the tapping bot wins half against one axe-man in leather,
  the careful bot three in four against two, five against five a coin; `tools/sweepmen.js` has the sweep); `docs/for-robin.md`.
- **Weapons** (`docs/weapons.md`): six melee kinds, each with a motion, reach, arc, pace, chain and one thing of its own: the
  sword parries, the axe breaks a guard, the club staggers, the seax crits, the spear pierces (and stabs: the `thrust` clip),
  the Dane axe is heavy (two-handed, not to be parried); a weight each (`wt`: seax 0.6, spear 0.9, sword 1, axe 1.25, club
  1.5, Dane axe 1.8) sets the pause, the ring and the sound of a hit. `tests/blows.js` prints each weapon's numbers and flags
  a contradiction of the doc. Ranged: the bow (no arrows needed for now), sling, javelin, throwing axe. A hit lands within
  reach plus the foe's radius plus 2, and the hero steps into a blow toward a foe (a little at the air).
- **The guard is made of what you hold** (`GUARD`, `guardKind`, Robin 2026-10-16): **a parry stops all of a blow** whatever it
  is made with, but stuns for less with a weapon (half) or a tool; a block lets through a fifth with a shield (Robin: it stops
  80%, more with a better shield: the page's `api.shieldThrough`, wood 0.2 to iron 0.12), half with a weapon, most with a tool or
  the bare arm; only a shield stops arrows; a tool can block (gather mode raises a guard too). Arcs 1.9 (shield) to 1.2. No shield with a bow or a Dane axe (`TWO_HANDS`,
  mine). **The guard turns you to the threat** (Robin, 2026-10-15: the foe whose blow lands soonest, else the nearest;
  `GUARD_FACE`, `S.guardFace`) and walking does not turn you while it is up. K late in a recovery raises it.
- **The parry and what follows** (Robin's picks, 2026-10-15; the numbers are mine): a parry stuns (`MEN.parryStun` 1.0 s);
  the foe reels through your blows and comes out swinging, so you parry again: **the chain** (`CHAIN`: up to x4 within 4.5 s,
  each a longer stun and harder blows on him). **Balance** (`POSTURE`): an amber bar that a parry, a perfect dodge, a blocked
  blow and a landed blow fill; full, or at a chain of four, he is open: **the finishing blow** kills a foe of 40 health or
  less and takes a third of a bigger one. **The win-back** (`RALLY`): half of a blow that gets through shows as a stretch on
  your bar that your next blows win back. **The tell:** every windup shows a glint over the attacker, white for a blow you
  can parry, red for one you cannot (a Dane axe, a heavy beast blow). **The perfect dodge** (`PERFECT`): a dash in the last
  0.18 s before a blow slows time, gives stamina back, fills his balance and leaves him exposed. Measured by `tests/parry.js`.
- **Beasts:** a light hit does not stagger a beast; a heavy one (the chain's last, a charged blow, any blow of stagger 20 or
  more, so every club blow) staggers it 0.34 s, and then **no blow staggers it again for `BEAST_POISE` 1.1 s** (mine,
  2026-10-15: the club stun-locked a bear). The hero's blows are paced (a sword blow about 0.55 s whole).
- **Sound:** the engine calls `sfx(name, v, src, x)` (`x` = the weapon's kind, weight, heaviness and, for a swing, the lead
  until it lands); a swing is heard from the windup's start so its loudest moment comes on the hit.

## Men, towns and raids

Tried in **`game.html?scene=battle`** and by `tests/battle.js` (`one|two|friend|five|bows|duels|ladder|town|raid|ways [n]`;
three bots: tapper, careful, skilled); `tools/visual/battleplay.js` and `raidplay.js` play it in the page. **In the real game
(raid step 1, 2026-10-20, `docs/raid-build-plan.md`): a place outside home water gets its men** (`garrisonTick`: `Village.garrison`
through `townMen`; **how many and how armed is `Village.defence(arch, wealth, ring)` from the table `Village.DEFENCE`** (step 4,
mine: a farmstead 0 to 1, a small village or fishing hamlet 0 to 2, a village 2 to 6, a trading post 3 to 6, a seat 6 to 12, a
town 14 to 24, a great town 30 to 40, by wealth; a sixth more a ring further out; the hall's and the gate's men in mail, the
rest in leather, a share with bows, a bonus to wits; a church none; `tests/battle.js arches` prints the ladder, kept in
`docs/baselines/arches-2026-10-20.txt`: a farmstead falls to the hero alone, a village about even alone, a trading post or a
seat wants men at his back, a town is lost with five) **when the hero comes within 1200 units of its bounds**, and loses them when he has been 2600 off for 40 s and no raid is on there; their names are
seeded, a man killed stays dead by his number (`seen.menDead[vi]`, saved). Home water's places have none (at peace); the Battle
and Destruction scenes make their own. **The settlement remembers (step 2):** its pieces are in `B` and saved (a broken door,
a taken chest, a burnt wall survive a reload); `seen.raids[vi]` counts its raids and `seen.lastRaid[vi]` the day; its folk speak
of it after a load too (`raidedLines`); **word spreads** (`wordSpreads`, mine): every place within `WORD_REACH` 3200 units is
wary from then (`seen.wary[vj]`): its men come with wits +2 and rise twice as fast, and its gate man says so (`LORE?`). **The ship, the hird and the loot home (step 3):** a raid is a shore outside home water (`onRaidGround`: the island's ring 1 or
more); stepping ashore there, every hirdman aboard becomes a man of the engine (side 1, `hirdToMan`: copper arms by his number,
leather and a shield, following, fighting, carrying, going down) and E at the ship makes him a hirdman again (`hirdBack`); on
home ground they step off as hirdmen as before; on another shore of home water they keep the boat. A hirdman follows on a
raid's ground too. One ashore when the ship has sailed 700 units off is **lost** (`hirdLost`: `m.lost` with the place and the
day, to be won back in step 9); one the engine kills is dead (`seen.hirdDead`). **A carrier holds on until badly hurt**
(`MEN.dropAt` 0.45; the carry errand's `hold`). **The hero who falls on a raid with a man of his standing within 600 units
wakes aboard the ship with his men** (`wakeAtSea`, `raidMenAboard`; the chest he carried stays where he fell). Admin: "A
karve by you", "Four hirdmen join" (`hirdGive`); `debug().giveMen`, `clearMen`, `claimAt`, `hirdList`, `raidShore`, `raftUse`.
  **Ways in (step 5, the first half, 2026-10-20):** by day one yard man in two **walks the round** the night watch walks
  (`dayWatch`, in `sleepTick`); **a dead man of the place seen by one of its people or its men is found** (`bodiesFound`, every
  half second while the hero is near: the cry and the alarm; the night watch too), so **a body can be dragged** (E on a fallen
  foe: "Drag his body", `dragBody`, it follows you and E lays it down, lying 90 s more); **taking from a chest of theirs before a
  villager's or a man's eyes is seen** (`theftSeen` on the chest board's take: "Thief!"); **a held line is a shield wall**
  (the engine: `MEN.wallK` 0.5 of a blow gets through a shield in a line, and only a heavy blow breaks it; measured: five
  held before the gate put three of twenty out, was one). The lines are `LORE?`. **Still to build of step 5:** the hird's
  ram, the town fighting a fire near its well, men at a full gate going round by the other, and one of the five ways chosen
  (`duel` stands). **The defence's tactics (step 6):** every place draws one plan with its seed (`Village.tacticOf`, `V.tactic`;
  `Village.tactics` gives its points, `Village.applyTactic` sets a man's flags, the same in the game and in `tests/battle.js
  plans`): **gate** (on an alarm every man goes to the gate and holds it: the engine's rally point, `e.rally`, `heardTo`),
  **hall** (the hall's men keep by the hall, `homeR`), **hunters** (they pursue further, `pursueK`, and see further), **watch**
  (three walk rounds by day, all sharper), **muster** (they gather at the fire pit, hold ten seconds, then come on together),
  **bows** (a bowman stands fixed on the watchtower and sees and shoots over the wall: `g.towers` in the nav). Measured on one
  town (`docs/baselines/plans-2026-10-20.txt`): the plans read apart in spread (302 to 463 units from the yard's middle) and
  in when the hero would fall (21 to 60 s). **Rewards (step 7, 2026-10-21):** a place rolls with its seed how full its stores
  are (`V.stockK` 0.4 to 1.6) and how deep its hoard (`V.hoardK`, times `RICH` by archetype: a seat's and a town's chests are
  richer than a farm's), so two places of one size never give the same; a seat has the chieftain's heavy chest as a town
  the jarl's; a full store (stockK high) holds **a sack of food** (a heavy thing carried, stowed and unloaded at home into the
  bag like the silver: `unloadCargo` takes whatever a heavy thing holds) and shows it (`sackPile`, `hangingFish`); **the feast**:
  at dusk (`FEAST` 840 to 1200) E at a laid `foodTable` eats their feast once a day (`FOOD.feast`: above any home dish, for the
  raid; a villager who sees it cries thief). `Village.lootOf(V)` sums what a place holds; `tests/loot.js` prints it against
  the men (`docs/baselines/loot-2026-10-21.txt`: a farm 29 to 37, a village 36 to 53, a seat 61 to 103, a town 149 to 233, a
  church 46 to 66 with no men; about 8 to 12 of value a man in the defended places). **Room for exploration (step 8,
  2026-10-21):** a church at wealth 0.35 and up has **a trapdoor behind its altar down to a crypt** (`Cave.make` kind `crypt`,
  `makeCrypt`: the stair, a passage, the vault with its coffins and bones, a niche with the reliquary over the chest; one cave a
  church, made with the villages by `cryptSetup`, the trapdoor its mouth; E "Enter the crypt", E at the chest "Take the silver"
  (`relicsTake`: 10 to 32 by the place's wealth and hoard, into the bag; the chest then draws broken; kept in the save by the
  church), E at the stair out; the trapdoor stands open from then); **the hall has a back room** (an inner wall three tiles from
  its end with a locked door, `l.back`; the jarl's or the chieftain's chest stands behind it). The hidden cellar and the
  watchtower were there before; the storehouse loft is not built. `tools/visual/raidgame.js` checks each step in the live game; `debug().garrison()`. The
way-finding is in every real village. Robin has played none of it.

- **Sides:** every fighter has `e.side` (0 against the hero, 1 with him); the hero's blows pass his friends; beasts know only
  the hero (mine). **The soldier** (`Combat.soldier(o)`): closes to his weapon's reach, circles, shows his blow coming (a
  windup of 0.12 plus twice his weapon's), strikes with his weapon's own profile; his shield comes up against blows he sees
  in time and stays up for a wary man; an axe breaks it, a club staggers through it; a blow he has stopped he answers. Every
  number is in `MEN` (`hpK` 0.8 scales the whole of the men's world so only the hero's blows gain on them; `dmg` 12;
  `toMen`). A hurt man who is not loyal may yield or run; the dead lie 90 s. Weapons make cycles, not a balance (the duels
  table is in the archive).
- **Many on one:** at most two strike one target, and no two blows land within 0.75 s on the hero (`slots`, `gapHero`); **one
  on one first** (`onOne`, `onHero` 2, help after `joinAfter` 6 s, at most `onMax`), the rest hang back; a fight makes itself
  room; a man turns on whoever struck him last; householders hold their own doors (`homeR`). Five ways they come
  (`Combat.WAYS`; `duel` kept after the trial, 2026-10-21).
- **Friends** follow beside and behind, fight within a leash, go down instead of dying and get up when it is over; **G** gives
  the orders (with me, hold, storm, carry a chest or a downed man to the ship). A held line keeps its shields up.
- **Walls and ways** (`src/nav.js`): a grid for every village near the hero; nobody but the hero steps across a shut edge; no
  blow, arrow or seeing passes a wall; a doorway takes two at a time; a place's own man opens its locked door; a foe in reach
  with no wall between is struck. A town's gate is two tiles wide.
- **A town's men and noise** (`Village.garrison`): each man has a post and his day; a town at peace does not go for a
  stranger; `Combat.noise(x, y, r)` wakes those within reach (blows, shouts, a broken door, the din of a fight that carries
  further the more are in it); a man goes to look and walks back; nobody pursues past 700 units from his post (450 outside
  his town). Bowmen stand off, loose only on a clear lane, and take the seax up close.
- **The raid:** the quiet way (a man who has noticed nothing falls to one blow from behind; his fellow within 70 units
  wakes), the loud way (doors and locks give to the axe, heard far); your karve on the nearest shore, its sea chest for the
  weapons you leave (a gated town lets in only the unarmed and alone); the carry order; lifting a downed man; leaving with
  those within reach of the ship. By night a place sleeps (a man abed falls to one blow; one in three is a light sleeper; the
  watch walks a round; the back gate is on the latch). **Storming** (G before a place with men following) deals out its
  doors. **Villagers** flee, take cover or arm by their calling; the unarmed can be killed; a drawn blade makes a place uneasy
  and its men challenge you; a raised guard draws nothing in a place at peace. A fallen man's weapon is taken with E
  (`TAKE_T`; the hero's pick-up clip plays in the take's own time, `Sprites.play(..., dur)`: Robin, 2026-10-21, it bent for five seconds). What the scripted raids came to is in the archive (a quiet raid nothing; the church's silver with most of your
  men; both chests and you die).

## Destruction (`src/ruin.js`, `docs/destruction.md`)

In the real game too (the big island's villages) and in the Destruction Editor; `tests/ruin.js`, `tools/visual/ruinplay.js`
and `sackplay.js`. Robin has not played it. **Your tools and fire work only on what is somebody else's** (a village you do
not hold; `placeAt`, `theirs`); in such a village you cannot build or wreck. A tool takes the one piece of wall you face, by
its material (`Ruin.rightTool`, `Ruin.hit`), heard by its material's reach (a soft noise stirs a place only if someone heard);
a room that loses too much loses its roof (a groan, then the fall: things inside tipped, people out, the hero hurt).
**Fire:** a lit torch and E at a wall or roof; it spreads with the wind (`Ruin.fireTick`), burns through walls and roofs,
lights the night, heats, is heard; men come to watch a fire (`Combat.gawk`) and walk out of a burning room; people run to a
refuge and come back homeless. **A fire in a place at peace is no raid in itself** (2026-10-21): the house's own run out, the men come to look, and **the bucket brigade** fights it: a place with a well sends up to four free villagers to it with buckets for any fire within 320 units of the well (`BRIGADE`, `brigadeTick`, `bucketStep`; the roof that has just caught first, then the wall nearest to burning through; `Ruin.douse`: a wall goes out and stays wet 40 s, a roof loses 14 s of its burning a bucket, `R.fire.bucket`, `wet`); a fire beyond the well's reach, or in a place with no well, burns; a fire in a place already uneasy or raided is part of the raid and stirs it. Measured (`tests/ruin.js`): a thatched wattle house with three on it stands, with one on it mostly burns; in the live town four villagers put out a timber-frame house fire in about 130 s after it had taken a block's worth of walls. The stakes of a village's ring can be hacked down. **Mending** (the piece `mend`, once a claim
stone of yours stands there) mends walls and raises a fallen roof. Side walls leaning with a face (`Build.CFG.lean`) is a
trial on the editor's board, off (Robin doubted it).
A post can be charred too (`p.burnt`, snapped to `p.snap` of its height; no beam is left between burnt posts), a standing
fence or palisade shows soot, and no grass grows in the ash of a burnt room (`w.noGrass`); the burnt steading uses all of it.

## The world (`src/world.js`)

- **The game's world is the sea as waters** (`spec.waters`, 2026-10-20; `docs/build-plan-waters.md` steps 1 to 3 built,
  Robin's "start working on 1-3"): home water (ring 0, radius 600 tiles) holds the starter island and the big island as they
  were (sizes [120, 400], gap 240, the big island east, `World.BIG_MOUNTAIN` on it) and nine more islands round them; four
  waters (ring 1, north, south, east, west; `World.WATERS`, mine) lie a crossing of about 350 tiles off, each four to six
  islands with a medium one as the **slot** for a special island later; one grid of about 3000 by 3200 tiles (`maxTiles`
  2e7), made in 2 s. `w.waters`, `w.homeWater`, `w.waterAt`; every island and water has its own seed. **The edge of home
  water** (`w.swellAt`): past radius plus 60 tiles the swell turns a raft or a rowing boat back toward home, with no word and
  nothing lost; a rigged hull sails on; the waves heave out there. **The climate** `w.climate(wx, wy)` gives warm and wet
  from the angle and distance from home (`World.ANCHORS`: north cold and dryish, south warm and dry (the lowlands), east
  warm and wet, west cool and wet); home is the middle and looks exactly as before; the biome field is read from it.
  **The climate's look** (`World.CLIMATE`, data, mine): as what changes from home, so home stays exact: the cold tints the
  grass cooler and greyer, thins the trees toward pine, birch and dwarf birch, puts boulders and heather about; the wet
  deepens the green, brings birch and willow, tall grass and reeds, marsh by the water and (cold and wet) moss; the dry
  south is the lowlands. The tint is laid over a chunk's grass as it bakes. **Seasons are slots** (`World.SEASONS`,
  `w.season`, `w.setSeason`: the ground bakes again); only summer is drawn. The
  chart is 1400 pixels wide (`CHART_PX`). **Beasts on every island** (`isleBeastTick`, mine): the first two are peopled at
  the start as before; any other island gets its animals when the hero comes within 1100 units of its coast (boar, deer
  and adder by its area, `animalN`; moose and bear only on islands of 80 tiles' radius or more outside home water) and
  they are taken away (`e.away`) when he has been more than 2600 units off for 40 s, so the engine carries only the islands
  round him. The
  Sea Editor lays out the same sea (`game.world3`; an old `game.world2` is ignored); `layoutKey()` names the arrangement
  (the waters' numbers in it, so a save of the old sea is dropped with the toast). `tools/visual/waters.js` draws it. Islands are blobs from noise on a
  height field (`E`); the ground is painted per pixel from it (deep sea, shallows that can be waded, a white lip, wet then dry
  sand, grass), baked in pieces at 2 pixels a unit with the meadow; `w.dress()` paints earth, moss and gravel; the ground
  brush paints the same into `w.ground`. The lowland biome (warmer ground, oak, beech, ash, apple, chalk, marsh, field, bog
  iron) is in the code, not spawned.
- **Mountains** (Robin's decisions; the archive's "Mountains" has the painting): height drawn as the old top-down games do,
  nothing lifted: the low ground, the foothills, the plateau and the peaks (not walked); cliffs are curves; south faces show
  their rock (painted as slabs, lit and shaded, a foot whose height varies, the grassy shelves Robin liked), side walls lean
  and are lit west, dark east, north edges are a rim; slopes are the ways up and every piece of high ground has one; the
  peaks are painted faces with snow. In them: the waterfall, the lookout (E pulls the view back and marks places on the
  chart), cliff veins of copper, the rock shelter (a roof), the troll's cave (and on a mountain island the old mine, the sea
  cave, sea cliffs and a bay). Build only on level dry ground. Checks: `npm run mountain`, `tools/visual/mountainlook.js`,
  `mountainplay.js`.
- **Caves** (`src/cave.js`): `Cave.make(seed, { kind })`, `'troll' | 'mine' | 'sea'`, laid far off the map; `caves`, `cur`,
  `here()` in the game; mined rocks, veins, what was seen and what was taken are saved. `tests/cave.js`, `tools/visual/cave.js`.
- **Villages** (`src/village.js`, `docs/villages.md`): `Village.make(seed, site, opts)` grows a ring plan round a yard with a
  fire pit (a longhouse or hall, houses with doors to the yard, outbuildings, a fence or a ring of stakes with gates, a
  winding road, nature kept, things against the walls, job spots, the people as households). **The ring of stakes is a polygon** (`V.fence.poly`, 2026-10-21, after the Art Director's step 2 notes; mine): eight to twelve straight runs, each corner a little off its even angle and hugging the buildings in its own sector (every lot's corner inside, the ring kept inside the site), the gate two tiles wide at the start of the run on the road with a banner either side, the back gate a tile and a bit, a run stopping a stake short of a kept rock or tree, now and then one run mended in pale new wood (`stake.mended`, `stake_new`); `F.round` stays true and `F.gateAt`, `F.backAt`, `F.cx`, `F.cy` serve every reader as before. `tools/visual/villages.js 20 village,seat 2 0.9` renders it. **A set piece is drawn at its own size everywhere** (2026-10-21: the world plants its trees at about 0.5 for the drawn props it bakes twice as big, and the game's prop drawing had applied that scale to the studio's pictures, so every tree stood at half: Robin saw hero-sized birches; `sS = s.fixed ? 1 : o.s` in the world's draw, as the cave's had); archetypes in `ARCH`
  (farmstead to chieftain's seat, fishing hamlet, trading post, abandoned, the lowland town and church, and `great` and
  `bigtown` for the trials); `Village.plan(env)` places them (none on the starter island). **By water (2026-10-20):** home
  water gets only peaceful places and exactly one seat, the jarl's, on a medium island (never the big island: Old Aslak's
  village stays; the jarl and his seat are the Lore Director's, proposed Fridmund at Tingvoll, `LORE?`); the south water
  the town and church; sites keep `water` and `ring`. **Home water cannot be raided** until `seen.raidOpen` (nothing sets
  it yet: the jarl's call comes later): `homeAtPeace(vi)`: tools and fire do nothing to a ring-0 place and no raid alarm
  sounds there; a drawn blade still makes it uneasy. `tools/visual/villages.js`,
  `bigplace.js`.

## Art (`art/`, `assets/sprites/`; `art/README.md`, `docs/moving-to-blender.md`)

- **The pipeline:** Blender 5.2 by script (`tools/blender.js` finds it). `art/build/*_build.py` model, rig and animate
  (`hero2_build.py` and `mixamo_bind.py` the hero on Mixamo's clips; `items_build.py` the things in the hand as Wood and Metal
  layers the game tints; `shield_build.py`, `thrust_build.py`; `quad_build.py` the four-legged animals; `snake_build.py`;
  `troll_build.py` the trolls and the four väsen; `people_build.py` the people; `rocks_build.py` the set pieces);
  `art/build/toon.py` is the shared cel look (its sun is 3.0, so everything rendered now has a lit side; bright base colours
  want taking down about 15%); `art/build/render.py` renders every clip, direction and layer; `tools/sprites.js` and
  `tools/people.js` pack the sheets. `npm run art:mixamo`, `art:items`, `art:shield`, `art:icons`, `art:people`,
  `art:beasts` (and `art:boar` to `art:snake`), `art:trolls`, `art:vasen`, `art:rocks`, `art:hero:death`; the ships' clips
  (`row`, `helm`) are `art/build/rowing_build.py` on `people.blend` and `hero_kit.blend` (in `art:people`; the kit's `row`
  is packed as a clip with its own frame: `node tools/kitpack.js art/render/hero_kit assets/sprites/hero-kit hero-kit --own`
  with the frames in `art/render/hero_kit_own`).
- **What is in the game:** **the hero on the kit** (`hero-kit`, 2026-10-20, Robin's decisions: a base body, every garment a
  layer; drawn on the people's path by `Sprites.drawKit`, the clip and frame from `pick()` as before, an attack's frame put on
  the clip's `contact`; his look built by the game's `heroLook` from what he wears: the starter tunic and trousers, shoes or
  boots, the belt, a coat or mail over the tunic by the chest's material, the cloak, the headwear by the helmet's material (`HERO_HEADS`, the studio's nine heads, Robin liked them all, the tiers mine:
  leather the wool cap with ear flaps, wool the Phrygian cap, fur the fur cap, copper and bronze the plain iron cap, iron the
  conical helm, silver and gold the Gjermundbu; the hoods wait for an item) with the hair under a hat,
  the bronze ring on the arm, what is in the hand and the shield (the guard: with a shield the shield arm across, `block`; without, the weapon raised across, `block_wpn`, both held through a walk); starter colours `Sprites.KIT_START`; blades light steel;
  the old `hero2-mixamo` can still be chosen in the Art Editor, `game.heroSet`), the people (one body with coloured
  layers, packed as WebP atlases, loaded lazily), the six animals (**their sheets loaded when a beast of the kind comes within
  900 units and let go after 60 s with none near** (`sheetTick`, `Sprites.warm`, `unload`; 2026-10-20: all eight kinds were
  made at the start, about 550 MB decoded, the troll's 234); a sheet is decoded off the frame as it arrives (`imgOf`); while
  it is on its way the beast stands as a soft shadow; the hero's kit warms the clips of what he holds as his look changes;
  `debug().sheets()` counts what is loaded) (the boar, deer, moose and bear the studio's lit ones, trimmed to the memory budget, dropped in
  2026-10-20), the boulder troll as the cave troll, Hårungen as his young. The forest troll, the Gape, the three-headed troll,
  the draugr, the huldra, Näcken (the last three the redesigned ones, 2026-10-20), Trollmor (new) and the bysen are in the Art
  Editor only (`docs/beasts.md`). **The art plan** is the studio's (`C:\dev\SG\Art Director\docs\art-plan.md`, 2026-10-20):
  who draws what, memory budgets per set, the drops first. **A clip may carry its own frame and anchor** (`anims[clip].frame`,
  `.anchor`; the set's top level is the idle's): the game, the Art Editor and the `tools/visual` sheet tools read it.
- **Traps already met:** hold out by material, not by the object's switch (Freestyle lines showed through bodies); render one
  clip again with `--keep 1` (else the numbers hold that clip alone); a clip that travels gets a frame of its own
  (`--inplace`, `anims[clip].frame`); a layer packed with `--only` lies in a box cut to its pixels; a changed sheet needs its
  `?v=` tag (the build adds it). **Open:** the 160 px frame cuts the tips of long weapons; the wrist (the hands bound to
  Mixamo's hand bones) waits; the people have the lit side and their own face since 2026-10-20 (`toon.py`'s "folk" face: the hero's without his
  moustache; `people_build.py` strips his fringe and beard tufts; the idles halved); the four old
  trolls and the bysen still lack the lit side (the wolf and the adder have it since 2026-10-20).

## Sound and music

- **Synthesized:** each page has its own set in code (the engine's sounds, chop, clink, build); `src/ambient.js` is the
  place's sound (wind, leaves, sea, birds by day, crickets from dusk, fire, water, caves, footsteps by the ground), its
  loudness the Escape menu's second bar, each layer a switch on Admin's Light and sound board (`LAB.snd`). Everything hushes
  when the window loses focus.
- **Recorded sounds: Robin's picks, locked in (2026-10-20,** pasted from the arena; `DEFAULT_PICK` in both pages). `src/sfx.js`
  plays `assets/sfx/combat.js`, built from **only what the game plays** (`assets/sfx/keep.txt`, 40 sounds, 6.3 MB): `node
  tools/sfxjs.js "C:/dev/SG/Sound Director/out/sfx/combat|C:/dev/SG/Sound Director/out/sfx/chapter1|C:/dev/SG/Sound
  Director/out/sfx/flesh|assets/sfx/free" combat @assets/sfx/keep.txt`; `Sfx.vol` 0.5; where no recording exists the
  synthesized sound plays. Sources and licences in `assets/sfx/free/CREDITS.md`. What plays:
  - the sword's swing (and fists, and the men's) the free swish E, F on a heavy blow (`SWING_SETS`); the other weapons' the
    studio's `swish_<kind>`;
  - the hit **W** (the slap: hand slaps on skin over a punch) and the heavy hit **X** (the punch with a whip-crack snap), the
    studio's flesh set, every weapon's, pitched by the weapon (`HIT_RATE`), **the club's too since 2026-10-21** (Robin: the dry
    wooden knock **V** was bad; it stays a candidate in the arena);
  - the shield going up **H** (the straps and the boards together), the block **A** (wood knocks);
  - the hit on a tree **A** and on a rock **A** (free packs), a tree falling **A** (played from the felling blow, trimmed so
    its crash lands with the trunk, which then plays nothing more), a log coming off the trunk **V**, a box breaking **V**;
  - **the struck beasts' cries W** (boar, deer, adder, wolf): the engine calls `sfx('pain')` after a hit on a beast that does
    not kill it (`e.bkind`, set by `tuneBeast`); the page plays the cry 50 ms later, always on a heavy blow, every other light
    one, never two within 0.35 s (mine), a grown boar's slower (0.88: the cry was made for the young). Real boar, wolf and
    deer recordings would need Robin's Freesound account or a Sonniss bundle;
  - the studio's own for the rest (parry, crit, the tell, the chain, finish, broken, perfect, stagger, dash, hurt, shoot,
    slam, die);
  - **the wave on the shore V** (`amb.wave`, through the place's volume, ashore only): each wave ±2 dB and ±4%, gaps 4.6 to
    11 s with now and then a close pair, and between them the old wash low and unswept (0.01: measured 11 to 17 dB under the
    waves; 0.012 for a more continuous shore, under 0.007 it no longer fills the gaps).
  The arena's The sounds panel lists what plays, offers a Choose row only where there is still more than one candidate (new
  ones from the studio land there), and shows the picks as text to paste back (`game.sfxpick2`). A pick of something no
  longer in the bundle falls back to Robin's. The candidates he did not pick were removed; the hunt for the hit (the
  studio's "bump", the free layers I to L, V, then W to Y from a brief on how other games do it) is in git and the archive.
- **The sound bundle and the music scripts carry `?v=` and a hash of their bytes** (`file_tag` in `tools/build.py`): a browser
  kept the old bundle.
- **Music:** the studio's recorded meadow by day and by night (`assets/music/*.js`, wrapped by `tools/musicjs.js` so they load
  from disk), crossfading at dusk and dawn; the synthesized songs in `src/music.js` are the fallback. Music is off until the
  Escape menu's bar is turned up; there is no mute key (M is the map).
