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
  islands, claims and the year; `build-plan-waters.md`: the steps to build it; **`raid-build-plan.md`: the raid in the real game in ten
  steps with a test for each, Robin's order of 2026-10-20**; `ships-plan.md`; **`settlements-plan.md`: one grammar for villages and towns from the farmstead to the great town, grown in rounds, with the research behind it, 2026-10-22**; `ui-review.md` has a list waiting; **`big-island-run.md`: the big island played through on 2026-10-23, what was fixed and what needs work there, for the move to the big island**; **`combat-crowd.md`: fighting two or three at once, three things built to feel (the parry's shock, the finishing blow's fear, the shield shove) and six more to choose from, 2026-10-23**; **`release-and-coop.md`: what releasing the game and playing it with two or three friends would take, and the browser question with its frame-log test, 2026-10-21**; **`pet.md`: a pet system widened from Robin's seed, the animals, the orders, what it is for, with questions, 2026-10-23**; **`runes-rework.md`: the rune system reworked, slots by input, blood that wakes a rune, the blót as the well, the ring as one legendary slot, with what other games do and questions, 2026-10-23**). **Finished
  business lives in `docs/archive/`** (`archive/before-wednesday.md`, `archive/boats.md`, `archive/lighting.md`, `archive/raid.md`, `archive/creatures.md`, the two playtests) and the
  pictures in `docs/pictures/`.
- **Our names** (Robin, 2026-10-22): I am **Clive, GD** (the Game Developer); the Art Director is **Colin, AD**, the Lore
  Director **Alistair, LD**, the Sound Director **Derek, SD**. Robin may say "Clive" or "Game Developer"; we always write the
  full form, name and tag, when we name ourselves or each other.
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
- **A pet system is one of the big new systems a later chapter opens with** (Robin, 2026-10-23; the chapter not yet said): it comes through a family close with animals who keep many pets (Robin will think more on them), different kinds of pets with different uses, and a pet is its own person, named and cared for; **runes augment the pets with passive abilities and bonuses, and the rune system is reworked when that chapter is worked on, not before** (Robin, the same day); **the rework's shape so far (Robin, 2026-10-23, `docs/runes-rework.md`): actives augment specific attacks and keys; a stone altar you build, where at a season's end an animal is sacrificed to choose a rune, the animal setting the tier; two kinds of rune, the sacrifice pools' and the world's; a library of your own; a rune woken at the altar by your blood dripped into its carving until it is red; no cards: stones laid by the animal, a storm, the stones turned to runes, lightning breaking the rest and carving the chosen; passives a fixed set;** the proposal is `docs/pet.md`, the rest of it waits.
- **The hird** (Old Norse hirð; a member is a hirdman, and they call each other fellows): they crew your ships (the more
  aboard, the faster, rowing and sailing), fight beside you on land, can die in battle (never at random), work at home and
  defend what you claim; found and recruited in different ways, with randomised stats and traits and training to change
  them. **They follow and work only inside your territory and on raids, never in the open world** (and, mine 2026-10-21: with no
  stone raised yet there is no territory to keep to, so Admin's men follow anywhere, board and land as at home). Claim stones cost stone
  and berries (and snake blood, as built); every stone after the first needs a hirdman as its keeper; without food they are
  slow and sad, never leaving. Arnor is the first hirdman.
- **The year:** spring, summer, autumn, winter, Stardew Valley style but **the player decides when a season moves**, at a
  moment at the end of each season; not abusable, never a stress; seasons feel different and open different things. After
  winter, "controlled randomness": an unclaimed destroyed place is rebuilt stronger by survivors, taken by bandits or
  overgrown, and every island gets generated events (a new settlement with boats and a path, trolls in a new cave, new
  creatures such as Näcken, unraided places growing). **The year's look and clock are in since 2026-10-23** (below, "The year"); the events after winter are for later.
- **The realm is Skargard** (Robin, 2026-10-16, through the Lore Director: from *skärgård*, archipelago; a part of Midgard), the
  map's title. The gods are background figures (Robin, 2026-10-16): **a god who appears in the world comes in disguise, is never named as that god (the Wanderer is never called Odin), is never a boss and is gone by morning; folk may name the gods in what they say and in the Lore Book** (Robin, 2026-10-23: "Keep 'Somebody thank Njörd'"); Odin forged the last ring, the one the legends are about; **it is not called the dragon ring** (Robin, 2026-10-19: "dragon"
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
  dead Viking in the troll's cave is **Hogni**, whose brother **Old Aslak** lives in the big island's first village (village 0, which the generator never makes a ruin: on a seed of 2026-10-23 it was one, with nobody in it and no Aslak). A slower beginning that introduces things one at a time (Robin,
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
  tiles, the big island 400, about 200 tiles of water between (`gap` 240); the hero jogs at 78 units a second and sprints at 130 (Robin, 2026-10-22: "the normal pace needs to be around 75-80"; he walked at 60 on 2026-10-21 and jogged at 84 before that: `Combat.HERO_GAIT`). Islands feel
  large through obstacles (groves, cliffs, water) more than through distance.
- **Look:** **the art direction is kept; no makeover** (Robin, 2026-10-20, after the studio's options page). Happy, lush, green Scandinavia in daylight; no dark shady scenes, no glowing weird lights. **Art direction
  (decided 2026-10-07, `docs/art-direction.md`): the ink of Egerkrans, the light of Bauer**: one colour key a scene with one
  hot accent, shadows cooler and bluer than the light, an earth-and-bone palette, a warm brown-black hand-made line heavy on
  the shadow side, one sun upper left, grain in every fill. Characters in the cel style Robin picked (2026-10-09). Trolls as
  in the old illustrations: hairy, heavy, long-armed, evil and careless, never goofy or smiling.
- **The sticker cure** (Robin, 2026-10-21, through the Art Director: "the ground looks lovely but the trees etc look pasted on
  like stickers"; the studio's board `out/sticker`): three things make the rule for every set piece. **The studio's:** every
  set piece re-rendered with the outer contour at 0.55 of its weight in dark green-brown and the inner line at 0.8
  (`toon.piece_line`, in `art/build/toon.py`, called after `toon.freestyle` in every set-piece builder; the people, the
  beasts and the hero keep the heavy black line; the fires and the Building board's icons are not re-rendered); the drop
  `out/thinline` copied whole, 2026-10-21 (every box 2 to 4 px smaller, the JSON with the pictures). **Mine at runtime:** a
  **cast shadow** under every set piece (`drawCastShadows`, before the fire shadows: a soft blue ellipse to the lower right,
  `w.castShadow`: the studio's numbers, its reach about half the piece's height, its centre 0.4 of the height right and 0.15
  down; full by day, half again longer and bluer through the dusk and the dawn (`sunK`), gone at night when the fires'
  shadows take over), and **ground contact on grass only** (`w.onGrass`: the meadow's grass, the fells' drier grass, or
  none on sand, rock, painted ground, a laid floor or the ash of a burnt room): a dark halo under the foot (`w.footHalo`)
  before the piece and the meadow's own blades over the lowest bit of its base after it (`w.footGrass`, seven to twelve
  tufts of three in the living grass's three greens, baked once a picture). One soft disc a colour drawn through a
  transform, so a shadow or a halo is one drawImage; what a thing stands in is remembered until the ground is painted again
  (`w.groundRev`). `STICK` switches both. **The buildings in depth** (the village look plan, 2026-10-22, Robin: "All of them. Go"; the Art Director's depth board and fence recipe, `out/village_depth/RECIPE.md`): walls 40 tall and roofs 10 over them (`Build.CFG` `wallH`, `overhang`); every wall, fence and roofed room throws its shadow to the lower right, swept by 0.5 and 0.14 of its height (a room's from its ridge), `rgb(26,34,62)` at 0.5 blurred 4, cut from its own floor, gone at night (`bldShadows`, baked a 640-unit chunk at a time into `BSH.cache`, laid again when the rooms are, one chunk a frame); on a wall's face (`Build.wallFoot`) a dark band at its foot, sill stones under timber, wattle and logs, and the room's south face turning from the light west to east (`SOUTHF`, its extent passed to `drawH`); the corner posts stand proud with a lit west strip; the eave's shadow band 9 tall under the roof's edge (9.5 under thatch's cut ends); the gable's east half in shade with a band under its bargeboards; **a church's tower** (`Build.drawTower` over its south door, 44 wide, 70 over the apex, a pyramid roof and a belfry, fading with the roof; the old `bellTower` piece is not placed at a church). **The fences as angled runs** (the village session's `V.fences`: polygons of the studio's `railPost` pieces, a kink each; their Build edges kept beneath, `hidden`, for the raid and the way-finding: the hero stops within a tile of the drawn rail, Robin accepted): the rails drawn between consecutive posts of one run (`RAILS`, `drawRail`: two at 0.42 and 0.78 of the post, sagging, one in ten missing, one in twenty-five hanging).
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
| `index.html` | The start page, by chapter: **Play** (the game), **Systems** (parts of the game set up to work on alone, on the game's engine and numbers: the Combat Arena, the Battle test, the Destruction Editor, the Big island test, the Mountain test) and **Editors** (the Art Editor's two halves, Models and Set pieces; Village, Sea). |
| `game.html` | The game: chapters 1 and 2. Its save is `game.save`. |
| `game.html?scene=mountain` | **Mountain test**: a mountain island of its own (`World.MOUNTAIN_SPEC`, 220 tiles) with a board to every place in it (slopes, plateau, peaks, waterfall, lookout, sea cliffs, the three caves, the shelter, veins), the troll, beasts, day or night. Own save `game.save.mountain`. |
| `game.html?scene=battle` | **Battle test** (`docs/battle-plan.md`): men one to five a side with bowmen, a town of twenty defended, a raid on it, walk in unarmed, a night raid, storm it with a longship's crew, the ways they come at you; what they carry and wear, how sharp they are. Saves nothing. |
| `game.html?scene=ruin` | **Destruction Editor** (`docs/destruction.md`): a sampler of every wall and roof, the town or village with 0 to 40 men, theirs or yours, fire and wind, mending; a panel of every number of `src/ruin.js` with Use in the game (`game.ruin`); big trials by URL (`&big=1`, `&roomy=1.5`, `&loud=0`). Saves nothing. |
| `game.html?scene=models` | **Models** (the Art Editor's figures since 2026-10-21, Robin's yes to the clean-up with the Art Director): every figure set on the game's own starter island, drawn by the game's own code (set pieces, shadows, foot grass, sea, day and night). A panel beside the view in the editors' wide layout: the cast by group from `Sprites.CAST` (the hero, people, beasts, farm animals, trolls, väsen, backup, and the studio's compare sets), each marked in the game with its chapter or waiting; the figure you walk as (the kit hero is the game's own, dressed through real things in his slots and hand: head, body, legs, feet, cloak, the hand and its metal, the shield, the arm ring); its clips (each plays once on you) and the sheet of the chosen one in every frame and direction; Height (`game.blenderScale`); Make it the game's hero (`game.heroSet`, the hero sets only); a crowd of rolled villagers with their clip, hand and gear; day or night, the wreck, the steading, a village, the cave, a karve (each on open ground beside its thing, `msClear`: the figure starts on the meadow a few tiles inland from the wreck), a beast put down beside you, no damage, **Clean view** (on by default: none of the game's bars, chart, hotbar or prompts, the figure alone; the Art Director's ask), Closer and Further; the numbers. **The studio's viewer** lays its sheets over the game's with `window.__SPRITES_OVERRIDE__` (merged at load by `Sprites.withOverride`; an entry may carry `label` and `group`, `compare` its own row). Saves nothing (`game.save.models` is cleared). `debug().models()`, `msPick(id)`. |
| `game.html?scene=runes` | **Big island test**: at a carver's bench in a hut with a furnace, a clamp and a fire, every rune known, a ring of any metal; to the mountain, the cave, the lair, the troll out or home. Own save `game.save.runes`. |
| `combat-arena.html` | **Combat Arena**: the fight on its own on the game's engine and numbers; **its base is one man across the ring** (Robin, 2026-10-22: he walks over, about three seconds, rather than attacking at once: `baseField` at load, after Start over, after rising and for "One against you"; the engine calls a page's `api.afterReset`): your weapon, metal, armour (the hero dressed in it as the game dresses him: the leather set's coat, trousers, boots and cap, or mail and the conical helm, `arenaLook`, 2026-10-22) and shield; men against you and hirdmen beside you, set pieces, every beast; the clock slowed; **Show the blows** (reach, arcs, guard, windups); a log of every blow with a tally; **the Tuning panel** (every combat number; Use in the game: `game.combat`; what to test: `docs/combat-tuning.md`); **The sounds** panel (every sound, and the picks: `game.sfxpick2`). **Kept lean (Robin):** every section folds (`<details>`, open or shut kept in `combatarena.open`), a row of choices is a drop-down (`asSelect`: the buttons stay, hidden, and do the work), and switches for things already decided are not offered. |
| `art-editor.html` | **Set pieces** (the Art Editor's other half, 2026-10-21): every picture of `assets/props` by its folder (the build tags each with its `set`), the fires (base, flames looping, embers) and the sea's life, a piece with all its variants and states side by side on the game's own ground (a small `World.make` island, the meadow or the sand), at the game's size beside the hero, with the game's cast shadow, halo and foot grass, its footprint (a table of the game's placing radii) and anchor, and its numbers; `?set=` opens a set. The last set, **Drawn in code**, is what the game still draws itself (beech, ash, apple, dwarf birch, the struck and fallen trees, the flower, wild herbs, the bird's nest, the varde, hedge, chalk rock, bog iron, the mushroom ring: `DRAWN` in `templates/art.html`) with the old tuner, the ink look only (`objecteditor3.*`). A new set piece shows by itself from its folder. |
| `village-editor.html` | **Village Editor** (`docs/settlements-plan.md`, `docs/villages.md`; made over 2026-10-22): a place of any tier grown by the one grammar, seen from above and zoomed into (the wheel zooms, the left button drags, a double click fits); a tier, a seed, the wealth, the shore, the shape (street or green), the story, the age, how much of it has grown so far; the defence by the water's ring with the men's posts drawn; overlays for the roads, the units, the zones, the ways in, the secrets and the nodes; the audit's lines under the view (`!!` in red); the numbers; Use in the game (`game.village`). |
| `sea-editor.html` | **Sea Editor**: the archipelago in the game's layout with its villages planned on it, distances; **the game's ships** (2026-10-22, the ships rework's step 16: the rowboat, the karve for 4, 8 and 12, the longship for 16, 20 and 26, the fittings, sailed by the game's `Yard.sail` with each size's own handling under the sliders, `handNow`) with **the crossing to the big island** worked out by the same sailing, in a calm, with the wind behind and abeam (it matches `tests/ships.js`); Use in the game (`game.world3`, `game.boat` for that size). Its own drawn boats and the old yard scene are gone. Its settings are `seaeditor5`. |

A test scene's board is on the left and folds; `Combat.api.debug().sceneRows()` and `.act(id)` press its rows. Every page
links back to the menu. Adding a page is a template and a line in `PAGES` in `tools/build.py`. The editors use a wide layout
(a big view, settings on the right): `fitCanvas()` sizes the canvas and sets `Combat.api.pixelScale` (2 to 5); anything a page
draws in raw canvas pixels uses that scale. **Removed** (the archive has their story): the Environment, Base and Grass
editors (2026-10-06); the Light, Gathering, Hird and Item editors and the Art Direction page (2026-10-09; the game still
honours `game.gather`, `game.hird`, `game.look`, `game.light`, `game.give`); the Art Editor's Characters and Creatures tabs
(the drawn figures; and its Models tab's own island, arena and night forest and the Objects tuner for the set pieces, 2026-10-21: the figures are the Models scene, the pieces the Set pieces page; the old Character Editor was in `art/backup/` until 2026-10-21, now in git's history); the Song Editor (2026-10-16: the music comes from the studio); the clean-up of 2026-10-21 (Robin: "declutter and cleanup"): Admin's old fight sounds, shield-only-when-raised and layer test, the Light board's mist, sun shafts and cloud shadows, the Destruction Editor's leaning walls, four one-off scripts, the stale pictures and docs.

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
- `src/village.js` (`Village`): the settlements from the farmstead to the great town by one grammar (`make`, `audit`, `plan`, `ARCH`, `BUILD`, `STORIES`, `garrison`, names, jetties; `docs/settlements-plan.md`).
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
- `src/sea.js` (`Sea`): the living sea (the Art Director's recipe, 2026-10-21): the water's wind effects and the creatures, no browser globals.
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
  `ui.js`, `smoke.js`, `scenesmoke.js`, `shipsplay.js`: a ship run onto the starter island's shore at five places and backed off each; `bigplay.js`: the big island step by step, the village, Old Aslak, the slope, a vein, the cave to the ring and out, an adder, the furnace, a stone and the bench, 2026-10-23).
- `tests/`: headless checks (table in `tests/README.md`). `docs/`: the decided and proposed designs (each says which).
- `art/` (`art/README.md`): the Blender build scripts and sources; `art/render/` (raw frames) is not committed and is
  remade by a render (emptied on Robin's word, 2026-10-21: 4.7 GB; a sheet is repacked only after its clip is rendered again).
- `assets/`: `sprites/` (the packed sheets, and `items/` icons), `props/` (Blender set pieces), `sfx/` (the sound bundle and
  its sources), `music/` (the recorded loops as scripts). `dist/`: the built pages, committed.

## Things to know before changing code

- `dist/` is committed: after editing `src/` or `templates/`, `npm run build`, then **parse the built pages** (`node
  tools/parsecheck.js`: `new Function(script)` over each page's scripts; it takes a second) **and check for a name defined twice**
  (`node tools/dupcheck.js`: a page's script is one long scope, and a second `function x` in it silently wins over the first
  wherever it is called. 2026-10-21: it found `bodyNear` (the raid's fallen man had hidden the cave's body: the arm ring could
  not be taken for a day) and `storeAdd` (the chest board's had hidden the hird's: a job gave nothing into the chests since
  the storage commit); `menOf` had done the same in raid step 1. A new function gets a name nothing else in the page has. **It also reports a statement swallowed by a `//` comment on the same line**: found 2026-10-21 in `enemySprite`, where `var o = {...}`, every beast's drawing options, had sat after a comment since 2026-10-20, so the beasts drew without their fire light, loops, young size and lying time.)
- **Never write a placeholder's name (`__SPRITES__`, `__WORLD__`, ...) in a comment:** the build fills every mention, comments too (2026-10-22: two comments pasted the 1.6 MB sprite table into the game three times and into three editors twice, 7.9 MB of the pages); `tools/build.py` prints a `!!` line when a big one is named twice in a page.
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
- **The reference scene** (`tools/visual/dayisland.js`, the starter island as the game draws it, used by the sheet checks and the studio's boards): `await DI.load(World)` before `make` and `paint` loads every studio picture (node decodes a picture only once its event loop has run), so the scene shows the set pieces at their own size with the game's shadow and foot grass; a script that skips it gets the old drawn props (2026-10-21: the round teal bushes the studio saw were only ever this scene's).
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
- **Robin plays from `file://`** (`npm start` opens `dist/index.html` from disk, and his save lives under that origin), **and there a canvas that has drawn a picture from disk cannot be read back at all** (Chrome taints it: `getImageData` throws a SecurityError; the pane's `http://localhost` never shows it). 2026-10-23: the autumn grading of every tree threw, the frame stopped before the hero was drawn, and Robin saw only the ground. the pictures' looks are composites since the same day, Colin, AD's (`gradeCanvas`, `rimCanvas`, `wetCanvas`); `pixOf` in `src/world.js` guards the one read left, the ground's grade, which falls back to the ungraded piece where the piece holds a picture. Anything new that reads pixels goes through it, or is tried on a `file://` page before it is called done.
- **Never fill with a pattern made from a picture** (`createPattern` of an image or bitmap) on the game's canvas: each such fill makes the browser finish everything drawn so far on the spot (measured 2026-10-22: about 6 ms a fill, 30 to 45 for a frame's first board; Robin's frames fell to 25 a second with the bag open beside the workbench). Make the pattern from a canvas copy of the picture (`hpat`); a canvas's pattern costs nothing. The frame log times the boards apart (`boards`) and writes the script heap and the decoded sheets each second (`perfMem`).
- Rooms and their solids are rebuilt when a frame is drawn (`if (bDirty) rebuildRooms()`) and in `ruinTick`.
- **`Combat.api.debug()`** in the game is the console's way in (`eWhat()`, `errlog()`, `perflog()`, `world()`, `villages()`,
  `sceneRows()`, `act(id)`, `tick(dt)`, `place(...)`, `raid()`, `arms()`, `shield()`, `cave()`, and many more); `Combat.dbg()`
  hands out the engine's `P`, `W`, `S`.
- **Frame time (measured 2026-10-21 in the pane at 1200 by 750):** the game's own work is about 4 ms a frame; what is left of a
  frame is the browser drawing on the graphics card, which the pane shares with whatever else the computer is doing (with
  nearly nothing drawn it ran 56 to 60 fps at one moment and 44 at another). Fixed that day: the living grass is baked tufts
  drawn as pictures (`tuftPic`, fifteen sway steps, six shapes a count: 47 to 54 fps), and the save's ground diff is kept until
  the ground is painted again (`GDIFF`, `w.groundRev`: the autosave cost 120 ms every ten seconds, a hitch). Before judging a
  change by its fps, measure it in alternation with a near-empty frame (`PERF.skip`), as outside load moves both.
- **The error log and the frame log:** every error a page throws (or a frame throws: the loop catches it and goes on) goes to
  `ERR.lines` and `game.errlog`; Admin downloads `errorlog.txt`. Every second of play writes a line to the frame log
  (`game.perflog`; Admin downloads `framelog.txt`; a frame over 50 ms is a SPIKE line). Robin puts both in the project folder.

## Controls (the game)

- **WASD** walk, **Shift** sprint, **Space** dash. **J** or left click: swing what is in hand (hold for a charged swing).
  **K** or right click: raise the guard (with a shield on the arm a shield's; in the instant a blow lands, a parry). **With the
  bow out, K or the right button draws it** (Robin, 2026-10-23: "mouse2 should ready and charge the bow, doing more damage the
  more its charged (up to 1,5 sec). Then you release with mouse1. You cant block or bash with bow"): held, the draw fills over
  `BOW.full` 1.5 s, he faces where he aims, and **J or the left button lets the arrow go** at `dmgMin` 0.4 of the damage and
  `speedMin` 0.8 of the speed for a snap shot, rising to the whole at the full draw (mine; the full draw 2.2 times the snap
  shot); nothing is shot without a draw, the draw let down when the button is let go; no guard and no bash with the bow; the
  kit's `bow_draw` clip to the frame the draw has reached (`tests/bow.js`). **Ctrl**: target the nearest foe, then the next, then let go.
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
  world-sound bars, Admin). **L**: the Lore Book, once it has a page.

## The game as it stands (`templates/game.html`)

**The start.** A fresh start (or an older save) first asks the hero's name, over the dark before the first light (`naming`,
`heroName`, shown on the panel; the dice offer names until the lore's pools come). You wake in a wrecked boat on the starter
island's beach (the studio's picture since 2026-10-21, `assets/props/wreck`: a faering stove in on the sand, its high ends curled, the mast snapped and the sail over the side, at 4 px a unit; the drawn `wreckedBoat` only while it loads; the sea cave's wreck the same). E pries four planks from the wreck (12 wood); four
branches and nine stones lie about; three lone trees stand near. Key reminders, in order: "E at the wreck", "Walk over the
things lying about", "Tab", then "1 to 6". Trail stones lead toward the steading 1500 to 2400 units off (`layCairns`); a fish
weir's net, an old one washed up on the beach with its floats (`netTangle`, the Art Director's `ch1fix`, 2026-10-22; Robin: the net hung between posts looked "out of place"), gives 4 fiber (E "Take the net"). **The burnt steading** (Thorgunna's; its houses half as deep again since 2026-10-22, Robin's yes to houses that make sense to enter: the hall 10 by 7 tiles, the hut and the plank house 6 by 6), burnt by Ormr Midgardbane's crew, drawn with the
destruction states (made over 2026-10-16, Robin: "you can make it look much better"; the choices are mine): the hall burnt
out (most of its walls charred stumps, the rest charred or scorched, its door gone, its roof down as ash and charred beams
(`B.ruin`), its floor earth where no grass grows, its posts charred and snapped short where no wall holds them), a whole
wattle hut scorched on the side toward the hall, a plank house by the well missing five walls and its roof, axe-marked and
sooty (mend it and it is your first home: its bed answers only with a roof over it), a palisade whose gaps are charred stumps
and a gate broken open, the ground round the hall burnt to earth, a cart, rack and post tipped over, barrels that
**E kicks open** (`kickable`, `kickBox`: it breaks at once as to the axe, with no clip; Robin), a chest by the cart holding six stone and the flint sword (E to open; the steading's crates became barrels and this chest, Robin 2026-10-22 through the Art Director), a hand quern by the hut's west end, a midden behind the hut and a chopping block by the woodpile (the same day: no scarecrow, no flower bed and no iron fire basket, none of them a Viking farm's; the hut's kitchen plot of herbs and leeks, the studio's `kitchenPlot`, lies where the flower bed stood, as ground litter), the graves behind the hall (E reads Thorgunna's stone),
and a campfire by the well. **Arnor** (`npc`; `arnorState`: meet, wait, teach, taught) goes about the ruin
scavenging and hammering at what can be mended (`arnorWork`, his spots `npc.work`, every walk by the yard), and stops to
watch you when you come near; his story's last line opens building; while you build he names what your home lacks; at
comfort 4 he teaches the raft. Once, when you stand at the graves, he comes and tells who lies there; when your first raft is
launched he is at the shore to see you off. **Every line he says is the Lore Director's** (`loreLines('line.arnor.*')`, from
`assets/lore/lore.json`, inlined as `__LORE__`), as are Old Aslak's (the first village of the big island: his brother Hogni's
story a line a talk, other lines once you wear the bronze ring) and the villagers' pairs about Ormr. Words that are not a
person's (the scratch by Hogni, the carving on Thorgunna's stone) go on the speech board too (`sayAt`). What anyone says
shows on the speech board at the foot of the screen, **only within hearing** (`HEAR` 130 units). **Talk follows the lore's modes** (Robin, 2026-10-22: Arnor circled his lines, and a line stayed after you walked off): a story (mode `sequence`) is told a line a press and not again, its Talk staying over the speaker while lines are left (`arnorMore`, `aslakMore`; Robin, later the same day: the prompt went while he spoke, the story seemed over after one line and building never opened); remarks (mode `variants`) are one a talk, and then the speaker is quiet, with no Talk, for `TALK_QUIET` 20 s (a villager `FOLK_QUIET` 12), or until you have walked off and come back, or until he has something new to say; out of hearing his line ends, and a story (the graves) waits and says the cut line again when you are back. **The talk window** (`docs/talk-and-lore-book.md`; Robin, 2026-10-22: "yes for your decisions 1-9"): Talk with a person who has a portrait (Colin, AD's, `assets/portraits/<lore id>.png`, the build's `PORTRAITS`; in chapter 1 Arnor alone, his final portrait in the bold style Robin approved with Colin, AD on 2026-10-22, "This is great. That works.", now the template's finish for every portrait; the talk panel's look is Robin's pick of the same day) opens a board low on the screen (900 by 142 from x 150, y 592 at Robin's size) **in the look Robin picked in Colin, AD's Talk Panel Picker** (2026-10-22; `assets/hud/talk`): dark oak with iron rivets on a soft drop shadow, the portrait in an arched window rising 102 px over the board's top edge at its left (`talk_arch_back`, the portrait clipped to the arch, `talk_arch_frame`), the name in the game's spelling on a plaque straddling the top edge (`talk_plaque_frame`, gilt Alegreya) with the byname beside it ("the smith"; the Norse form is the book page's) (`LOREBOOK`, the build's: the lore's names and book fields, never its bodies), the line in cream in a dark inset, a pulsing gilt arrow while a story has more; E gives the next line and closes after the last; anything else closes it and does what it does (a step, a swing; Esc only closes), as do a blow, being out of hearing, sleep or a cave; the hotbar hides (`api.hideBar`); the world does not pause; what he says on his own stays on the speech board (`talkOpen`, `talkNext`, `talkTick`, `drawTalkWin`). **The Lore Book** (the same plan; it replaced the Book of Beasts, whose words and practical lines are gone): L opens one book of what the hero has met, in Colin, AD's mock's layout (an oak board 960 by 640 from x 120, y 58, two vellum pages, the world dimmed behind; the tabs People, Creatures and Places down its left edge, each once it has a page). A page is Alistair, LD's words in Robin's (`LOREBOOK`'s `book`, then `book_more` once `book_more_after` has happened: `line.arnor.graves` is `seen.graves`, `killed` a beast of the kind killed; `book_facts` as italic lines under a rule); an entry with no approved words has no page. It opens when its thing is first met (`lbMeet`, `seen.lb`: a person at the first Talk, Thorgunna when her stone is read, a creature seen within `LB_SEE` 170 units, `BEAST_LORE` mapping the game's kinds to the lore's ids), and a short note says "Lore added about" its name (the first one with "(L)" after it), and "More lore about" it when its later paragraph opens (`lbPop`; Robin, 2026-10-23: the book's icon by the chart, there all the time, is gone), and a small red mark sits on its medallion and its tab until it is looked at. The left page holds the medallions (a round crop of the portrait, the stone, or the beast); the right page the picture in a plate frame (the portrait; the stone for the dead met by it, `LB_PIC`; a creature's own sheet, its idle facing right, kept loaded while shown), the name with its red capital, the Norse form and the byname, the text and the facts. A blow closes it; the world does not pause (`lbOpen`, `drawBook`, `bookClick`, `lbTick`). Pages today: Arnor, Thorgunna, the boar, the deer, the wolf. **Their sounds** (`uiSfx`, `uiSfxTick`: the window opening, its next line, the book opening and shutting, a page turned) are Robin's picks from Derek, SD's Kenney candidates (CC0): the window opening F, its next line E, the book opening B, shutting C, a page B (`DEFAULT_PICK`), trimmed, varied and levelled by Derek, SD (`out/sfx/ui`, four variations each at his gains, the next line cut to about 95 ms); Robin chose no voice (decision A). The big steps
are bordered boards (`bigStep`: "Building", "The raft", "You have left the island", the last whenever you stand
on another island's land). **The bar is there from the start** (Robin, 2026-10-17: not something you gain); B waits for Arnor; no word stands over the bar but in build mode (Robin, 2026-10-22: "remove the FIGHT and GATHER text"; the engine's label, `paged`); the Building
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
heroes; **in the kraken's style since 2026-10-21**, the first of Robin's kraken round: the chosen tones of `art/build/toon.py`, `TONES` 'chosen' in `trees_build.py`, every other builder still 'shared'; `assets/props/trees`, set pieces through `World.setImages` in three variants a kind by the prop's seed, drawn at their
own size, `fixed`); the felling states stay the game's, and **a felled tree lies as its own trunk picture** along the fall,
its chopped end at the stump, shortened at the far end as the logs come off (never thinner: Robin), **and each log rolls
out at the far end as the studio's log picture** (a drop of kind `log` that gives its wood when walked over; a tree without a
log picture drops wood as before). **The workbench and the raft bench are the studio's pictures too** (2026-10-20,
`assets/props/pieces`, the same way; their footprints widened to the pictures, `r` 8 and 12; with the camp things and the furniture below, in the kraken's style since 2026-10-21, the round's tenth item: `benches_build.py`, `camp_build.py`, `furniture_build.py`, the chosen tones), **and the plants** (`assets/props/plants`:
bush, berry bush, juniper, heather, fern, tall grass, reeds and mushrooms, three variants each, and the flower as low clumps of oxeye daisies, harebells and buttercups (`flower_1..3`, `ch1fix`, 2026-10-22, in place of the drawn heads on stems); a picked berry bush is a
bush until it regrows; **all of them in the kraken's style since 2026-10-21** (the round's fourth item: `plants_build.py`, the chosen tones, `shared=True` keeping the old tone where a builder wants it); **the tall grass redone 2026-10-21** (Robin: the first "looks like a plant"; now a loose tuft of flat blades
leaning one way in the grass's greens, the silhouette line only; the studio's `out/plants/grass2`, its `plants_build.py` the game's copy)), **and the rocks** (`assets/props/rocks`: rock, boulder and rock formation in six variants each, by
the prop's seed; the cracks and the sweet spot's cue are drawn over them), **and the camp things** (`assets/props/camp`:
the drying rack, woodpile, chopping block, log seat, cart, well, trough and the two tents in undyed wool, their mouths
south), **and the furniture** (`assets/props/furniture`: bed, chest (and `chest_open` while its board is open), chair, table,
bench, crate, barrel; the loom, stool, shelf and cupboard are in `assets/props/interior` with the cradle and the hangings, Colin, AD's, 2026-10-22; the rug is still to come), **and the villages plan's drops**
(the Art Director's `out/villages`, 2026-10-20; the fences, faces, yard, sacred and raid sets in the kraken's style since 2026-10-21, a quiet change of tones: `fences_build.py`, `faces_build.py`, `yard_build.py`, `sacred_build.py`, `raid_build.py`): **the steading's things** (`assets/props/steading`, in the kraken's style since 2026-10-21, `steading_build.py`: the graves as turf mounds
with Thorgunna's standing stone, `spriteName` maps `graveStone` to them; the trail stones; the scarecrow, shield rack, dragon
post, flower bed, net, weir and well; the haystack stacked round its pole (`ch1fix`, 2026-10-22, in place of the two domes); and the raid's wreckage laid at a fresh start as **ground litter**: decals of
kind `litter` drawn under everything: **the burnt hall's inside** (the studio's `ch1fix`, 2026-10-22, Robin: "Yes, do all 4") is about ten of its pieces laid once on the ash, the fallen `roofTree` beside the hearth, `charBeamA`, `charBeamB`, two `charBeamC`, a `charPile`, two `ashHeap` and three `charStump` (an older save keeps its `charredBeam`s), with a `burntHeap` by the
hut and the `brokenDoor` by the gate; a burnt tile is grey ash with paler and darker patches, no black ovals and no rafters (`drawDebris`)), **the fences** (`assets/props/fences`: a ring's stakes `stake_1..6`, `stake_new` for a mended
run, `stake_stump` for one hacked down (`spriteName`), `railPost` and the wattle `hurdle` pieces for rail and wattle rings on a polygon (not built: those fences stay Build edges); the palisade, rail, wattle and gate drawing of the Build edges is the studio's in `src/build.js`), **and the faces**
(`assets/props/faces`: porch, bell tower, apse, gable cross, lantern, sign, awning, woodshed, the laid `foodTable`; **the thatch made toward the studio's target** (`ch1fix/roof_target`, 2026-10-22): the eaves proud of the wall with a ragged band of cut straw ends, thinner and nearer the thatch's own colour since 2026-10-23 (Robin: the straight band "doesn't look natural"; `eaveEdge`), and a deeper shadow under them, courses `THATCH_COURSE` 11 units apart each stepping over the next with a notched edge and its own shadow line, a steeper pitch, soft hips with no ruled line and rounded corners (`roundCorners`), a straw ridge cap sewn with crossed hazel spars (`STRAW_RIDGE`, `strawSpars`; Robin, 2026-10-23: no green turf on the ridge, "just some imperfections and variation": the turf cap and the moss of 2026-10-22 are gone) and no crossed boards, the lowest course greyer and a ragged patch or two of weathered grey straw with a few straws slipped, or one mended in new straw (`thatchWeather`); the turf roof's bark board in `drawRoof`; **a room with a hearth or a fire pit indoors has a
smoke hole in its ridge** (`Build.drawSmokeHole` at `Build.ridgeMid`), the fireplace keeps its chimney), **and the yard's
things and the sacred** (`assets/props/yard`, `assets/props/sacred`: the storage hut, boathouse, bee skeps, stall, banner,
sign post, fire ring, runestone, burial mound, cairn, stone ship, lych gate, way cross, font, altar, furnace, charcoal pit,
the carver's and mason's benches by their names; **the settlements' pieces** (`assets/props/settle`, the Art Director's, 2026-10-22, Robin's yes: the thing ring, the farm gates shut and open, the toll post, the boundary stones, the foot bridge, placed by the generator under its own names, and the stall redrawn under its old one; a walled town's front gate wears `townGate_whole`, `_open`, `_barred` or `_broken` by its state, drawn over the Build gate in the edge pass); and new in the generator (mine, 2026-10-20): a `quern` in the door pool, a
`washingLine` behind one house in two, the hall's `spearRack` and a `torchBracket` at its door in place of the lantern, the
`forge` in the smithy, the `midden` heap on earth behind the longhouse, a `watchtower` and a torch inside a walled town's gate
at wealth 0.5 and up (a bowman's post, raid step 6), a `beachedBoat` on a shore place's sand; a set piece with no drawn prop
of its name passes the village's prop check; **a thing with no picture and no drawn prop stands in** as the nearest that has one,
`STAND_IN` in the game's `sprite` (2026-10-22: the insides' looms, stools, shelves and cupboards had none and every frame with
one in view threw; Colin, AD's pictures came the same day, and the stand-in stays as the guard); **Colin, AD's insides** (`assets/props/interior`: a cradle at the foot of the bed in a
third of the houses, a hanging on most houses' north wall, herbs and onions, pelts or a woven one, the woven one behind a hall's
high seat; Colin, AD's own edit of `src/village.js` as the settlements' owner, on its own random stream; a thing with `wall`
throws no shadow on the floor; the cradle breaks as a stool, `WOODF`)), **and the raid's set** (`assets/props/raid`, the studio's step 6: the ram, sack
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
**a double click uses** (eats, lights the torch, wears, or takes a weapon or tool in hand: `useSlot`, `handTake`), **a right click
opens a little board** (`openSlotMenu`: Wear or Take in hand, Eat, Light, Drop, Destroy; Robin, 2026-10-22), Shift and click sends
across to a chest (E closes a chest's board again: Robin, 2026-10-22), Shift and drag carries half a stack; Sort tidies. A thing dropped from the bag lies as one pile (`d.n`, saved)
and is not picked up again until he has walked 70 units off it (`d.mine`). **A thing's card** (vellum, over every board) has its
numbers and tale; **with Shift held, the card of what you have now of its use stands beside it, marked Now** (`heldLike`: the
worn piece, the tool in hand or the best other of its kind, the hand weapon; the crafting card too), in place of the green and red
differences (Robin: "instead of having a green +3"). **The materials' and the food's icons are the Art Director's**
(`assets/sprites/icons`, 30 of them, 2026-10-22, `art/build/item_icons.py`; inlined as `__STACKICONS__`, `STACK_IMG`, drawn by
`drawDropIcon` in the bag, the bar, the cards and on the ground; a kind without one keeps its drawn icon; **wood and stone remade** the same day, Robin: "they look out of place": firewood in the trees' bark and an oval fieldstone, rendered from the world's camera to lie on the ground). **A drop lies unturned with a soft blue shadow to its lower right** (`drawDrop`, the studio's ask: the picture carries its own light). The panel
("You") has Gear (helmet, cloak, tunic, trousers, boots; shield, necklace, two rings, two trinkets, the arm ring), Stats after
the first kill, Ring once a ring is worn. **What is worn shows as the art studio's rendered icons** (`assets/sprites/worn/`, 2026-10-20; `Items.setWorn`, the game's `wornPick` choosing them as the hero is dressed, the cloth tinted by its material) in the slots, the bag and the crafting board; an empty slot shows its icon faint. The panel's redesign waits for Robin's pick of the studio's three directions. The crafting board sits lower right under the chart, **the list on the left and
the chosen thing beside it** (Robin). **Each board lists only its own**: Tab opens what you make by hand, with a tab for a
workbench, a fire or a furnace you stand at; E at a fire shows its dishes, at a furnace its bars, at a workbench its things
(with a By hand tab). A chest takes the right side instead. The middle of the screen stays clear (Robin).

**Crafting** (`RECIPES2`): a recipe is listed once you have picked up its key ingredient; a thing never made carries a gold
dot. **Crafting is as in Valheim** (Robin, 2026-10-21): made by hand anywhere or at a roofed workbench or a shipwright's bench,
**one thing at a time, no queue**; a press pays and **the Craft button turns into Cancel, filling as the thing is made**; **the
board cannot be left** until it is made or cancelled (every key but Shift is held, the hero stands, a click anywhere but Cancel does
nothing; a blow taken breaks the work off and gives the materials back); **Shift held makes it Craft x5** (the cost sockets show
five times, made in half the time five would take: `CRAFT_BATCH` 0.5; the raft stays single); what is made goes into the bag (a
workbench no longer keeps it); no bar over the hero (`craft`, `craftJob`, `craftTick`, `craftStop`). **Cooking at a fire and
smelting at a furnace are made the same way** (2026-10-22, Robin: "Cooking menu still has the old cancel button. Check this in all
crafting menus": `workStart`, the job's `kind` cook or smelt; Cook or Smelt turns into the filling Cancel, x5 with Shift, into the
bag; the Ready strip shows only what an older save left at a station). **The times halved** (Robin: "reduced by at least half"):
`CRAFT_T` 1 s by hand, 1.5 at a bench or the shipwright's; `COOK_T` 2; a bar half its `dur` (copper 4, iron 6). The board's picks of
2026-10-20 (Robin, from the Art Director's `out/hud/CRAFTING.md`; the count with its sockets and hold-to-repeat gave way to the
above): **a pin** at the
card's plate corner (`pins`, up to three, the oldest let go; saved): a pinned recipe shows as a **vellum slip** bottom left
(`drawSlips`, 200 by 64 from x 24, y 560, 74 apart) while no board is open and no fight is on (`fightT`: a beast or man
awake within 420 units, the music's test), with its picture, name and each material as have/need (green when enough, red
when short) and "ready to make"; a click on the slip's pin lets it go; **the hand board teaches the stations**: under its
own groups, faint, "At the hearth", "At the workbench", "At the furnace" for each station kind the hero has stood at
(`seen.stations`, set in `stationNear`) with what it makes that he knows; a dim row can be chosen and its card says "Made
at the hearth" in place of the button. The pin is the studio's `pin_on` and `pin_off` (drawn in code while they load).
Hand: flint axe, knife, pick, wooden club, stick bow, torch; **the flint knife is not offered on the starter island** (Robin, 2026-10-21: "not really useful anyway", for now; `STARTER_HIDE`). Bench: the flint sword, the wooden shield, the leather set,
copper and iron tools and weapons from bars. Charcoal (none on the starter island, where nothing uses it: no old fire rings or struck trees there, no embers: Robin, 2026-10-20; and none at a village's fires and lanterns, only at fires outside any place or in one you hold, 2026-10-23): embers at dawn by every fire of yours, the charcoal
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
base, a loop of flames (10 frames at 12 fps, each fire at its own point of the loop) and embers (the bases with the set pieces' line in a warm dark brown since 2026-10-21, `art/build/fires_build.py`: they had kept the figures' heavy black one; the flames unchanged), drawn by `drawFire` at 4 px a
unit; the light, the smoke, the sparks (from the fire's heart, `fireUp`) and the shadows stay the game's. A hearth nobody keeps
(`it.cold`: the burnt hall's) shows no flames and is no hearth; `it.burnt` would show the embers. The comfort line shows it. A bed answers only under a roof and only if it is yours; sleeping skips the
night, and under a roof leaves you rested for comfort × 2 minutes. **Health comes back slowly when no fight is on** (Robin,
2026-10-22; `HEAL`, mine): 0.6 a second within 140 units of a burning fire, 0.15 a point of comfort in a room of yours, 0.2 under
a shelter, at most 1.5 (50 to full by a fire in about 83 s). Chairs
and benches seat you (E). The shipwright's raft bench needs comfort 4 at home and goes on the sand by the sea.

**The year** (Robin, 2026-10-23: "We should add the seasons", with the clock and a Viking calendar; the thinking agreed the same day: the calendar never takes, it only gives, and the turning is a pull, not a push): **time is counted in days; a season lasts `YEAR.days` 6 of them at the least** (mine, to tweak), **then it is due and the player turns it when he will with a blót at a burning fire of his** (E "Hold the blót": a dish or meat given if he has one, never required; `blot`, `seasonTurn`): days keep passing while he waits and nothing is lost by waiting (nothing in a season is a last chance; everything seasonal comes back every year; the next season is where the new things are). **No number of days is shown anywhere** (Robin): the chart's rim has a small year wheel at its lower left (`drawYearMark`: the four seasons' quarters, the season's filling as it ripens, rimmed bright once the blót can be held), the map (M) names the season, its Norse month and the winters lived (`year.winters`, counted as the Norse counted) and says which blót can be held, and the fire offers the rite. The game starts late in summer (`year` `{ season: 'summer', day: 4 }`, saved). The months are the Norse ones laid over the four seasons (Einmánuður, Harpa, Skerpla; Sólmánuður, Heyannir, Tvímánuður; Haustmánuður, Gormánuður, Ýlir; Mörsugur, Þorri, Gói) and the blóts the historical ones (Sigrblót into summer, Haustblót into autumn, **Jólablót, Yule, into winter**, Dísablót into spring): `YEAR`; **the words are Alistair, LD's handoff 11** (Robin's yes, 2026-10-23): the board's line as a season opens (`line.year.opens`), and at the fire once the season is due and at the rite whoever stands within hearing, Arnor, a hirdman or a villager, says his line (`line.year.due.<season>`, `line.year.blot.<season>`, each tagged with who may say it; `yearSpeaker`, `yearSay`, once a due). Admin's **Season** row turns the year at once without the rite, to see each one, **and H opens the sky board** (Robin, 2026-10-23: "a separate menu on H"; `skyOpen`, `SKY_ROWS`, `drawSky`, `skyAct`; `debug().sky(id)`): the season turned at once, the weather forced or the day's own, the hour (dawn to the moon high) and the wind, a row a choice, the one in force marked. **The look is Colin, AD's seasons module** (`assets/seasons/seasons_grade.js`, Robin's picks of 2026-10-23: spring A fresh green, autumn B fiery, winter A deep snow, summer the game as it is; `src/seasons.js` is the game's copy with the ice's distance on a coarse grid, inlined as `__SEASONS__`): nothing per frame: a ground piece is graded once as it bakes (`gradeGround` then `sprinkle`, spring's anemones and autumn's leaves, in `bakeChunk`; about 110 ms a piece in Node), the living grass's colours by `grassInk` (`seasonGrass`), every tree, plant and rock of `SEASON_KINDS` as a copy graded on its first draw in the season and kept until it turns (`seasonSprite` in `w.sprite`, `im.gs`; the flower and the mushrooms not drawn in winter), in winter an oak or a birch as its bare picture (`assets/props/trees_bare`) with the dusting, and a piece with a snow cap (`assets/props/snowcaps`, `<picture>_snow`, the second drop) composed with the cap over it at its foot point; the season's light over the world under the night (`Seasons.light`); **Colin, AD's grade is composites only since 2026-10-23** (`Seasons.gradeCanvas`, with `Sun.rimCanvas` and `Weather.wetCanvas`: hue, saturation, multiply, soft-light and screen fills clipped back to the picture, the edge bands the picture minus itself shifted; no pixel read, so the looks come on a page opened from `file://` too; only plants take the season's colours, an autumn oak a brighter scarlet, spring's blossom on the berry bush lost); `pixOf` guards the one read left, the ground's grade. **The season's own pieces** (`assets/props/seasonal`: autumn's chanterelles, boletes and fly agarics, winter's drifts, dead grass, umbels and bracken) planted on a piece's grass as it bakes in their season by a hash of the place (`seasonDress`, `SEASONAL`: so many a piece), with no halo, no foot grass and no shadow under a drift (`o.bare`, `o.noShadow`), taken away when the season turns. Not graded: the people, the beasts, the hero, the buildings drawn in code (snow on their roofs is still mine to do), the HUD. `tests/seasons.js` times the grades. **What a season gives is a table, `SEASON_GIVES`** (Robin, 2026-10-23: "berries shouldnt be available then ... Grass shouldnt be able to be picked then either, but gotten from the trees as per normal"): a thing's seasons, 0 for none; winter takes the berries (E offers none, and a berry bush is drawn as a bare bush under its snow, `seasonSprite`) and the tufts' grass (a tree's fibre as before); the rest of the table is mine to fill as Robin decides. **Winter's plants are Colin, AD's snowed pictures** (`assets/props/plants_winter`, 2026-10-23, Robin: "snowed over and sprigs. Not lush brown bushes": the bush (and the berry bush as a bush), heather, fern, tall grass, reeds and juniper in three variants, `Seasons.winterPlant`, drawn as they are in place of the piece, no grade and no cap, as the bare trees), **and an autumn bush takes a tint from where it stands** (Robin: "strange that the bushes are just complete red"; `Seasons.autumnTint(x, y)`: olive 32%, yellow-brown 28%, still green 18%, rust 14%, red 8%, the same bush always the same; the sixth argument of `gradeCanvas`, up to five copies a picture, `im.gsm`; `w.sprite(name, v, o)` takes the thing for it; the berry bush keeps its green with the red in the berries). **Not built:** the rest of what a season changes in play (the ice shutting the sea, the wolves bolder, winter's own things), the events after winter.

**The weather** (Colin, AD's proposal, `assets/weather/WEATHER.md`; Robin's yes of 2026-10-23, "Looks great. Yes", to all of it as written: the eight weathers and the year's shares, a storm at 89 per cent of daylight, the blizzard's white-out, summer mostly clear, the ground effects and the footprint rule): `src/weather.js` is his `weather.js` as delivered, inlined as `__WEATHER__`. **The sky is in:** the day's spells are rolled at dawn from the season and the day (`Weather.day`: showers in spring, rain, storms and morning mist in autumn, snow, heavy snow and a rare blizzard in winter, overcast before and after rain), each fading in and out at its hour, drawn over the world and the season's light, under the night, in his order (`WTH`, `weatherTick`, `weatherDraw`); nothing in the world changes; the strongest spell asks the wind for its strength (`Weather.wind`), so the sea follows by itself; at night the streaks and flakes show at half. Admin's **Weather** row forces one to look at; `debug().weather()`, `weatherSet(kind)`. Pictures in `docs/pictures/weather/`. **The ground is in too** (`WG`, `wgTick`, `wgDraw`; his `Weather.ground` with the game's own kinds): the ground darkens as the rain soaks it (a multiply over the ground pass, under everything that stands) and dries after; fresh snow whitens it while it falls; frost lies on spring and autumn mornings (the first 150 s of the day, no rain); puddles stand on the painted paths and the low ground by the water (four a piece by a hash of the place, `wgPuddlesNear`), take the rain's rings and are ice in winter; snow streams along the ground and autumn's leaves skitter in a wind; his breath shows in winter and in frost; his feet leave prints only where the ground holds them, in snow, on the wet sand at the water's edge and on a path gone to mud, and on the beach's sand anywhere (mine, 2026-10-23: Robin saw none walking the beach, so the shore test is off; a footfall every 24 units, the feet by turns, at most 36 that fade: Robin, "It should make sense but not be too much bloat"); prints and puddles are world points mapped to the screen for his drawing. **Not built:** beasts' tracks in snow, his wet-things addition (`Weather.wetPicture`, drips from the crowns, `Seasons.deepen`), Derek, SD's sounds for it (rain in strengths, thunder after the flash, the wind). **Snow lies on the roofs drawn in code in winter by Colin, AD's recipe** (`assets/roofs/RECIPE.md`, his `roofs_winter.js`, the game's copy `src/roofs_winter.js` inlined as `__ROOFS__`, 2026-10-23, after Robin's "a white translucent roof" and my own blanket that read as a blank sheet: `RoofWinter.draw` on the roof's picture in `roofSprite`, composites only: the slope toward the light lit and the other in a blue-grey shade lifting toward the eaves, the courses faint through an opaque blanket, wind streaks, the ridge's crest with a cold ink line and a wind cornice, straw showing in scoured and slid patches, the lip with its shadow on the wall and icicles, a cold ink edge, and the gable face kept clear (the triangles as `drawRoof` lays them, `Build.roofRects`); the game passes `ns`, the ridge from `Build.ridgeMid`, the front eave line and the gables; my `roofSnow` stays as the fallback. **Driving the page in the pane:** `fetch(location.href, { cache: 'reload' })` when writing the page again, or a cached old build runs (2026-10-23: a fixed build seemed broken for a quarter of an hour).

**Swimming** (Robin, 2026-10-23: "I also want the character to be able to wade in shallow waters around the island, and swim in the water. But his stamina shouldnt last til next island or very far"; `SWIM`, the numbers mine): the shallows are waded as before; past them he swims at half his walk, his stamina draining 7 a second and never coming back in the water, so a full bar is about fourteen seconds and a few hundred units, nowhere near the next island; spent, he can only go shoreward (toward shallower water) at 0.3 of his walk, with one word ("You can swim no further: back to the shore"); not with a heavy thing on his back; the guard drops; drawn sunk to the chest with ripples round him (`swimAt`, `canSwimTo`, `swimTick`; the walk rule in `api.scene.walk`; `debug().swim()`). The beasts and the people keep to the shallows as before.

**Day and night:** a 30-minute cycle (`DAY_LEN` 1800: day to 840, dusk to 1200, night to 1620, then a dawn of three minutes: Colin, AD's day, Robin's yes of 2026-10-23, "Looks amazing"; it was 1740). **The sun and the moon** (`assets/sun/DAY.md`, `sun.js`, the game's copy `src/sun.js` inlined as `__SUN__`): from above the sky is never seen, so the sun is shown by what it does all day. `Sun.state(day.t)` gives every number (`SUN`, `sunTick`); the game draws **the light across the frame from the sun's side** (a multiply gradient near to far, a soft-light gradient, the warm wash, the low sun's glow: `drawSun`, after the season's light and before the weather; in place of the old flat amber dusk, which is gone), **the sky's colours in the water** (a mask of the water in view, `sunWaterMask`: 200 by 125 from the world, made again only every 14 screen units of camera or half a second and drawn at the camera's offset between, blurred once a frame into a screen-size layer the other passes take (Robin, 2026-10-23: the frames fell by the beach: it had been remade every frame he walked, 25,000 looks at the world); laid on as 'color' at `skyK` × the key's `hue` (0.65 at sunset and at night, 0.3 at the golden hour, 0.22 to 0.5 through the dawn, 0 at noon), 'screen' at × 0.15 by day and 'soft-light' at × 0.85: his rounds three and four, 2026-10-23, a peach sky at full hue had turned the deep sea grey-tan) **with the sun's path glittering on it** (`sunGlitter`, longer and brighter dashes toward the sun), **and what stands in the water keeps its colours** (`sunCutOut`: every layer of light on the water, the sky, the sun's path, the moon's path and the stars, has the pictures of what stands in it cut out, destination-out, before it is laid on: a set piece whose picture reaches the water, the ships, the hero swimming; about 8 ms a frame in all at Robin's size, driven), **the shafts** at the golden hour and the sunrise, **the shadows swinging and stretching with the sun** (`drawSunShadows`, his second round: by day every set piece, the hero, the beasts and the people cast their own picture, drawn again into a layer half the screen's size and laid flat from the foot away from the sun by one transform (a long low thing keeps its length along the screen, `m`), the layer tinted once with the state's colour and laid on at its strength, so crossings do not darken twice; it replaces the day's disc shadow; the night's fire shadows stay; `w.silSprite` is kept, unused), **the lit edges** of the standing things on the sun's side while it is low (`w.rimSprite`, `Sun.rimPicture`: a copy per picture per side, at most two made a frame, dropped half a minute after the sun is high or down, `rimTick`), **the moon** rising in the east at 21:00, high at 23:30, setting at 26:00 (`state.moon`, `moonX`: the night a little lighter and bluer under it, its silver path on the water, `drawSunNight`) **and the stars in the water** when it is down. The night palette and the fires' light stay as they were, laid on after. Pictures in `docs/pictures/day/`. The people, the beasts and the hero take no lit edge. The dusk stays
golden and darkens faster toward its end (`DUSK_POW` 2.4); "The light is going" at a quarter dark. The night is dark (you see
14 units without a torch); a torch burns 6 minutes. **A pack of three wolves comes each night**, eyes red; a fire keeps them
140 units off, and in its light they give up after about sixteen seconds.

**Food:** dishes heal at once and give top health, health a second and stamina for ten minutes or more (`FOOD`); no hunger.
Cooked at a fire in a queue, waiting there. Roast berries, roast meat, berry stew, eggs and honey; fish dishes in the lowlands.

**The villages' animals** (the Art Director's step 5A, wired 2026-10-21; the numbers mine): hens, goats, sheep and cows on the beasts' sheets (`assets/sprites/hen|goat|sheep|cow`, `npm run art:stock`; in the kraken's style since 2026-10-21: the goat, sheep and cow remade, the head one shape to the nose, the sheep's fleece a lumpy coat, the goat's beard a ragged strip; every idle 16 frames at 8 fps, was 8 at 4; strides on the goat's, sheep's and cow's walk and run, the hen's legs still by the clock; 26.4, 10.9, 24.2 and 2.3 MB decoded). A place gets its stock by its kind (`LIVESTOCK`: a farmstead four hens, a goat, three sheep and a cow; a town eight hens, two goats, two cows; a church two hens) when the hero comes within 1200 units and loses them when he has been 2600 off for 40 s, as its men (`stockTick`); hens and goats keep to the yard, sheep and cows to the byre's side; they amble, graze or peck, lie down now and then (`stockMind`, the sheets' graze, peck, lie and sit clips through `idleClip` and `clip` in `Sprites.beast`); every one of them scatters from the hero (the engine's flee) and comes back; **a goat goes for nobody** (Robin, 2026-10-21: one that attacked at random was weird and set the place against him) and butts the air now and then (the sheet's butt clip); a village's animals are no fight: the FIGHT mode ignores them. They can be killed for meat and hide; a villager or a man who sees it cries thief and the place is stirred (never in home water), and the dead stay dead for the day (`seen.stock[vi]`). Checked in the live game (`raidgame.js` R.stock). Not built: eggs, the dog.

**Beasts** (Blender sheets, dressed from the combat numbers: `Combat.tuneBeast`): on the starter island **young boars** (6
health, 7 a bite) and **deer in herds**, **no adders** (Robin, 2026-10-22: "you have no use for the blood yet"; `ANIMALS.snake.start` 0); on the big island boars, adders, moose and a bear, and the troll in his cave; wolves
at night. Counts scale with an island's area. A beast ambles round its home and charges when you come near, each its own
way (the boar charges, the bear and moose swipe, the wolves circle and bite in turn, the adder poisons). **The deer** sees you
230 units ahead and less behind (the herd's watcher sees all round), runs the open way, stands and watches; shot, it bleeds,
slows, runs shorter and leaves a blood trail to follow (`SHY`, `api.onBlood`); one wood arrow bleeds it out in about 37 s.

**The troll's cave** (on the big island's mountain; **its mouth the Art Director's rendered piece since 2026-10-22**, Robin: "Shouldnt it be like a 3D feeling and that you go inside a bit": `assets/props/cavemouth`, the whole mouth drawn with the ground as part of the cliff and its front (the face and the lip) sorted at the wall's foot, so it goes over whoever has walked in; the world's painted arch off, `w.mt.noPaintMouth`; you walk in up to `MOUTH.walkIn` 56 units, darkening with depth, and near the end you are in the cave, as E at the mouth still does; the troll does not walk in; `MOUTH`, `mouthWalk`, `mouthTick`; `art/build/cave_mouth_build.py` and `tools/pack_cave.js` make it; the painted arch remains in `src/world.js` for a world without the picture): a way through from a daylight tunnel
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
routines (spots, jobs, sitting at the fire, watching you a while; a taken spot sends one to another free spot, and a plain standing spot is stood beside by each in his own place, so no two stand on one point: 2026-10-23, three thralls had stood in a knot at their door), find their way round walls, run, hide or arm when you draw
a blade or raid, and can be killed (the dead are remembered by name). **Their clothes and their work are the Art Director's step 5B** (wired 2026-10-21): the people's atlas carries the apron, the kerchief and the straw hat, the hammer, the saw and the bucket for the hand, and the clips hammer, saw, carry, carry_walk, kneel and sit_work (`tools/peoplerender.js` renders them, `art/build/folk_build.py` keys them on `people.blend`); a villager's calling dresses him (`ROLE_X`, `roleLook`: the smith's leather apron, the weaver's linen one, a straw hat on one farmer or fisher in two, grey hair on an elder; a woman in the dress wears the kerchief, under no hat) and gives him his clip (`JOB_CLIP`: the smith hammers at the forge with the hammer in hand, the well is the bucket held and carried, `carry_walk` whenever a villager carries (the brigade too), a priest kneels before the altar (the spot `pray`, held), the weaver and the net mender sit at their work; the hird's crafter saws at the bench). They can be broken into and burnt ("Destruction").
Houses are narrow and long (a house 6 by 8 to 11 tiles, a longhouse 7 by 16 to 20, a hall 8 by 22 to 24, the outbuildings half as deep again where they are entered: grown 2026-10-22 on Robin's yes through the Art Director, "houses need to be bigger in general to make sense to enter"; the hero is 39 units tall against a tile's 24 of depth, so a 4-tile house was two and a half heroes deep; doors, furniture and the hero as they were).

**Boats** (`src/yard.js`; **`docs/ships-rework.md`: Robin's ship decisions of 2026-10-22 and the work in sixteen steps, in
progress**; `docs/ships-plan.md` and `docs/archive/boats.md` before it): **three ships, each in sizes** (`Yard.MODELS`, a size a
hull design in `Yard.HULLS`): the **rowboat** (5.2 m, just you, wood and fibre: Arnor's teaching, key `raft`), the **karve** for
4, 8 and 12 rowers (`karve4`, `karve8`, `karve`; copper: the ship that leaves home) and the **longship** for 16, 20 and 26
(`longship16`, `longship20`, `longship`; iron bars); a longer size more seats, faster with its crew, slower to turn, dearer.
The raft, the faering and the boat are gone (an older save's become a rowboat, `shipOf`). **The fleet** (`fleet`; `raft` is the
one in use: aboard, or ashore the one of yours you stand nearest, `fleetTick`): every ship you build is yours, kept in the save
with its name, look and fitting, staying where you left it, drawn and solid there (`idleShips`); never lost. **The shipyard**
(the piece `ship1` anywhere on your land by the water, as many as you like: **Colin, AD's naust** since 2026-10-23, `assets/props/shipyard`, a boat shed with a half-built boat on its stocks and a slipway, in four facings: placed by the cursor turned to the water, its slipway's end `NAUST.wet` 50 units into it and its shed on dry ground clear of other things, trees and rocks too, `naustFit`; what bumps is the shed's box, `naustPillars`; E opens the panel at its open end, `it.door`; a ship is launched off the slipway's end, `it.slip`; a built thing with a box is culled by its picture's reach, not its middle, 440 units: the naust had popped out of sight as you sailed off; on the starter island's list in place of the raft bench): **Arnor teaches it** at comfort 4 as he taught the raft (key `raft`, the board "A boat"), and when your first boat lies at the starter island's shore he comes down to see you off and says his farewell as you board (`arnorToShore`, from `fleetTick` after a reload too; his teaching, his word after it and his farewell are the rowboat's since Alistair, LD's handoff 9, Robin's yes of 2026-10-23). E opens **its panel** on the right (`drawShipPanel`, `SPB`; `spOpen`, `spBuild`, `spSummon`, `spRefitStart`,
`spRefitApply`): the ship being made floats beside the slipway on the side toward you (south of one that runs east or west, east of one that runs north or south), parallel to it with her bow to the sea, never on it (`slipSpot`, `onSlip`; Robin, 2026-10-23: "just south of the bridge"), and Build makes her there and turns the panel to Your ships, so no second is shown beside her; she changes as you choose (`spPrev`, drawn in the world's items, the
camera between you and her); **New ship**: the model (those you know: `spModelKnown`), the size, the name (rolled at the panel's opening from the lore's pool for the model, `names.ships.<model>` of handoff 9, one no ship of yours has, `shipNameRoll`; Roll gives another and a new model a new one, until you type your own), the
sail's two colours and its pattern, the shields' two paints, the stem's head, the hull's tar and trim (`Yard.LOOK`,
`lookDefault`), the fitting (`Yard.FITTINGS`: Raider, Cargo, Voyager, the numbers mine), the cost in sockets, Build; **Your
ships**: each with where it lies, Summon (to this yard's water) and Refit (look, name and fitting; a new fitting is paid). E or
Esc closes it, and walking 140 off; **in Colin, AD's clothes** (`assets/hud/ship`, step 13: every choice a 9-slice, off, under the pointer or chosen in gilt, a colour in its socket under a glaze, a sketch by each row's label, a divider above the fittings); while it is open the camera pulls back until the whole ship fits left of it (`zoomTarget`). **The models** (Colin, AD's, step 12; `assets/ships/<kind>/`, copied whole from his `out/ship_models/sheets`, inlined by the build with every part's tagged address; the rowboat since 2026-10-22, **the karve for 4, 8 and 12 and the longship for 16, 20 and 26 since 2026-10-23**, each kind's pictures loaded only when a ship of it is yours or previewed, `shipArtWant`: a karve's are 70 to 100 MB decoded, a longship's to 150; four composed looks kept): 32 headings at 2 px a unit, rendered from 48.6 degrees so the ground falls where the code's ships put it; `back` the ship, `front` a mask of what is nearer the camera than the crew, `tar` and `trim` greys laid on in the look's colours with hard-light when a look is first drawn (`Yard.setModel`, `composeOf`, eight looks kept); drawn by `drawModel` (the shadow and the foam from the marks, the back, the crew, the front over them in `drawVesselFront`, the oars on the marks' tholes or oar ports, `tholeOf`); **a karve or a longship is made of parts** (`composeBig`: the hull's back with the tar, trim and two shields' greys; its front in up to four boxes a heading, `frontOf`; the mast; the sail set with a mask a pattern, crossfaded by `sailSet` with the sail furled on its crutches; a head a kind) drawn in Colin, AD's order (the game's `drawShip` with `Yard.bigModel`: the far side's oars, the back, the head if the bow is far, the crew behind the mast, the near oars behind it, the mast with its ropes and the sail, `drawBigRig`, the crew before, the other oars, the front, the head if the bow is near; `oarGroup`), the crew on its marks (a rower a seat, the helmsman at `helm`, the hero in the bow at `bowseat` or at the helm alone), the pennant from its masthead; the marks give the profile (`hullProfile` from the rail's outline, `olW`), the seats, the gangway and the hit box (`shipsRefit` when a model arrives); `tools/visual/boats.js` loads them too. **The default tar is `#4a3526`** (Colin, AD's suggestion: the near black lost the planks at sea) **and every other shield cream** (his suggestion too, mine to take: the red stays the one hot colour beside the red-and-cream sail). **Without a model the look is drawn on the code's hull**: `Yard.colOf` (the tar laid over the studio's planks at 0.45 and the trim over its rail at 0.55, the first of each the hull as built), the sail plain, striped, checked or bordered in its two colours, the shields every other one in each paint (`shieldPic`), the stem's head a curl, the dragon, a snake or a bear (`drawHead`); `tools/visual/boats.js` renders every size and four looks. **The fittings** (`Yard.FITTINGS`, `fitOf`; only on a ship with a mast): a **Raider** 0.1 faster under oars, its men on and off in half the time (`BOARD`), its shields on the rail stopping an arrow from either side while you are aboard (the engine's `api.arrowStop`); a **Cargo** hold 0.06 slower, twice the heavy things aboard (`Yard.HOLD` by size, 1 to 6, `holdOf`, `holdFull`: "There is no room aboard", a carrier sets it down by her) and a sea chest of 24 places (`chestK`; the chest board as tall as its places, `openStoreN`); a **Voyager** half again more from the wind (`sailK`) and its crew aboard fed at dawn from its provisions. **Sailing** is `Yard.sail` (shared with the Sea Editor): W forward, A and D turn (a little
from a standstill, more with way on), the rowboat about 90 s to the big island, a karve with eight rowers about 53
(`tests/ships.js`); **the wind a clear bonus** (`Yard.sailFill`: behind full, abeam three quarters, nothing from 150 degrees;
the wind vane on the chart's rim, `drawWindVane`); **run it up the beach** (the page's `raftBeach`: only sand under the bow, the
middle afloat; `v.beached`, S backs off) and rocks slide her along, never stuck; stepping ashore puts you clear of her hull (`offHull`), and E at your ship comes before the shipyard she lies by unless you face the yard. **The sea's sounds** are called by name (`seaSounds`: `oar` or `oars` at each stroke's catch, `sail_fill`, `creak` now and then, `keel_sand` and `keel_off`) and play nothing until Derek, SD's recordings are in the bundle (step 15, briefed 2026-10-22). Every ship has a sea chest. The old yard scene where a hull was laid part by part is gone (from the game, the Sea Editor and `src/yard.js`); `tests/karve.js` checks the ship line in its place.
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
outline over it) and `drawBoat` and `drawVesselFront` draw the bake; `drawShields` hangs the painted faces **upright on the hull's sides** (Robin,
2026-10-21: laid flat on the rail they looked wrong): 11 units apart along the rail, every one drawn after the hull and
clipped to what lies outside its outline on screen, and each **slides smoothly** from showing its upper part above the far
rail to hanging whole below the near rail by how much its side faces the camera (Robin: a side jumped as the ship turned;
`shieldFace`: the muted six, the red two one in four); the stems and the rig follow the hull's roll (they swayed loose of
it); **the wake is laid along the track she has sailed** (`v.trail`, so it curves in a turn) and **a turn with way on breaks
white along the outer side** (`v.turn`; Robin: the turning was stiff); **the sail is set while she is driven and furled at
rest** (`v.sailSet`; its belly by the wind, never flat: Robin: it furling whenever the wind was not behind read as random;
the wind still sets the speed's buff and whether the oars rest, `v.sailFill`); `COL` is the studio's palette; **the shadow under the hull is the hull's own
outline turned with her** (Robin, 2026-10-21: the blob that never turned looked unnatural), thrown a little to the lower right, the
sea's own colour darker and bluer, soft at the edge from three fills, still on the water while she bobs. Without the images the hull draws as before. **The vessel is one drawing** (`drawShip`:
the hull, everyone aboard by depth, the rig between those behind the mast and those before it, the near rail with its shields
over their legs (`Yard.drawVesselFront` takes the figures), then the oars); the engine's own hero draw stands down aboard
(`shipHero`); aboard, the keys sail the ship and the hero stands (`api.scene.still`: the engine takes no walking input; he
ran in place, Robin 2026-10-21). **On and off (`BOARD`, mine):** the gangway is the hull's point nearest the land (`Yard.gangway`); E within reach
boards the hero and **calls every man of yours not at work within 420 units** (`m.boarding`: he walks to the gangway's land point and climbs
aboard within 28 of it; the engine's men on a raid shore the same by an errand, `e.toShip`); **the ship waits for them up to 8 s**
(W does nothing; the toast "The men are coming aboard"), then those within 420 have waded the last bit and the rest are left
("X is left ashore", he walks back to the stone); the seats fill in boarding order (`m.seatNo`); no room (`BOARD.cap`: the rowers
and a helmsman) and a man says so. **Landing files them off** one every 0.35 s (`raft.landing`, `landingTick`) onto spots spread
along the shore (`Yard.landingSpots`), each walking to his spot (`m.landTo`); on a raid's ground each becomes a man of the engine
as he steps off; on another shore of home water they keep the boat. Admin's karve lays three thwarts aft of the mast and three
before it. **A man of the crew speaks as she runs up a beach** (`crewLand`: the lore's `line.crew.land`, three lines, Alistair, LD's handoff 10 on Robin's yes of 2026-10-23; the man nearest you, once in 20 s, never the line just said; aboard the whole ship is within hearing); the other crew lines are `LORE?` (asked). **Not built:** shooting from the deck (chapter 2), enemy ships, grappling and the fight on the
decks (chapter 3: Robin's yes), the fleet, the studio's surfaces on the hull (the plan's steps 5 to 8); your colours on the sail
and the shields and a ship's name come later (Robin).

**The living sea** (`src/sea.js`, the Art Director's `out/sea` drop, 2026-10-21, on Robin's word: "ambiance creatures, whales
swimming by, gulls circling, some fish, not too much; wind effects and motion in the water; the water more beautiful and
living"): **the water** over the painted sea (`Sea.drawWater`, before the waves' marks): soft swell bands at an angle to the
wind, cloud shadows, cat's-paws (dark patches long with the wind, ruffled across it) and whitecaps (a bright curl with a foam
trail) by the wind's strength, the sun's glitter in a band on the upper-left side by day, a shoal's shimmer now and then;
every patch a world point that drifts downwind and dies and is never laid over land (`clear`); **the life** (the studio's
pieces in `assets/sea/`, inlined as `__SEA__` by `sea_art()`, 65 px a metre): gulls on a loose ring round the ship at sea or
round a point out over the water from the nearest shore (`shorePt`, pushed out `gullOut` 230; Robin, 2026-10-22: "a bit too
attached"; ashore two or three on a ring of 110 to 230, `gullR`), flapping and gliding in the eight directions with shadows on the water, two to five, none
far out at night; a minke far out that surfaces three or four times twenty seconds apart (the blow is `Sea.spout`), shows its
fluke and is gone for minutes; a fish leaping from the shoal; a seal's head by the shore; **the ship's pennant** from the masthead
(`Yard.masthead`) and **bow spray** when the way and the wind are up. **The wind blows at `wind.s`** (0 to 1, wandering every
minute or two between 0.15 and 0.75; mine, Robin's default waits), and everything scales with it: a calm day shows the swell
and the glitter only. `seaTick` runs when the sea is in sight (`sea.on`); `tests/sea.js`; `debug().sea()`, `seaEnv()`,
`windObj()`. **The depth tint** is in the ground painter (`world.js`: the sea green-blue by the shore, gone a few levels out, on
both pages). **The Sea Editor has the living sea too** (the same module, its wind from the sliders: **Wind strength** is a
slider there, and Use in the game makes it the game's default round which `wind.s` wanders, `game.boat.windS`). On the
studio's word: puffins, a sea eagle, a humpback, jellyfish, the night sea.

**Also:** fishing with an iron rod (the lowlands' fish and a fisherman's dishes; not on the two islands); the map (M) and the
chart show what has been seen (the map zooms with the wheel, 1 to 10 times toward the mouse, and is dragged with the left button when zoomed in: `mapWheel`, `mapDrag`, Robin 2026-10-22; a press off the map closes it); saving in `localStorage` (keyed by the world's layout, so a save of another arrangement is
dropped; **the painted ground is saved as what differs from the ground the world paints at every start** (`groundBase`,
`groundDiff`; 2026-10-20: the whole field was 1.5 MB of a 1.6 MB save, now about 55 KB; an older save's whole field loads and
is saved as a diff from then on); **Admin** in the Escape menu (immortal, one-shot, free building and crafting, fly, threefold drops, shield only
the frame readout, full resolution, the Light and sound board, go-tos, the two logs; the old fight sounds, shield only when
raised and the layer test were cut in the clean-up of 2026-10-21);
critters (butterflies, birds, beetles) that keep away.

**The look is the code's** (Robin, 2026-10-21, through the Art Director: "I wanted the vibrant from the sea editor", and no menu
to open for it): `STYLE_INK` `sat` 0.86 (was 0.66: the land measured an olive) and `texture` 0.25 (the grain a whisper, alpha
about 0.02; was 1.1); the old Art Direction page's hand-over `game.look` is retired (cleared at start, no page reads it). The
studio's fallback if the land turns loud beside the people after a day's play: 0.80 with 0.4. **The night palette** (the Art
Director's `out/lighting/NIGHT_PALETTE.md`, Robin's yes, 2026-10-21; the table is in `docs/art-direction.md`): the veil's
multiply kept, then the darks lifted with blue (screen `rgba(40,60,120,0.22)`) and a third of the colour taken out (the
'saturation' blend, the fires cut out of it); the fire's light ochre, never white (`FIRE_T`, `TORCH_T`: `rgb(225,165,85)` at the
core through `rgb(120,80,40)` at 0.4 to the night's blue, the reach 102, a third shorter: it was a disc of daylight); the water
at night darker and greyer than the land (half its light, a third less colour, laid into the night canvas a pixel of it at a
time where the world has water and no painted ground, `nightWater`, kept until the camera moves: Robin's picture of 2026-10-22
showed the old blocks of six screen pixels as dark squares along the coast); the hero's own circle cool; a faint cool light from the top when there is a
moon. **The cave's dark** (`Cave.dark`): deep blue-black the wall's grain shows through (`rgba(8,10,22,0.93)`), the hero's circle
without a torch cool and small (radius 60, `rgb(40,48,70)`), with one warm (`rgb(210,150,70)` to the blue at 170), the glowing
stones cold foxfire (`rgb(120,200,170)`). **The lighting switches** on Admin's Light and sound board (`LAB.light`): `glow`,
`shadows`, `sides`, `walls`, `moths` on; `moon` off (a moon is for later; the mist, sun shaft and cloud trials were cut in the
clean-up of 2026-10-21, the research is `docs/archive/lighting.md`). **The Tone rows** there (`LAB.tone`: colour, contrast,
warmth as a CSS filter, the grain full, half or none) are my own dials, nothing Robin opens.

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
is health and stamina top left, the chart and the meal top right, **in oak and iron** (the Art Director's direction A, 2026-10-22; Robin: they looked like "a cheap game", "Go with A"; `assets/hud` `bars_plaque*` and `map_*`, the places from its `bars_map.json`): the bars on an oak plaque with an iron boss and two sunk tracks (`hudBarsA` through the engine's `api.hudBars`; the fills in code, a vertical gradient each, the stamina low in ochre, the number in bold Alegreya; a bigger stamina stretches the plaque's middle), the chart round (`MAPR`, radius 21.3 round (370, 27.3)), drawn soft (`miniSoft`: its window enlarged with a light blur each frame, no square pixels), shaded at its edge, in an oak rim with a carved N, the hero an arrow turned to his facing, the zoom two iron studs on the rim; the comfort line under the rim; damage numbers are the engine's damage × 10 (`SHOW`), whole.

## Combat (`src/combat.js`)

- **Enemy types:** `beast` (every animal), `brute` (the arena's bear: chains and a spin, a stagger bar), `shooter`,
  `soldier` (a man). Pages dress them (`api.dress`, `api.dressMan`); undressed they draw as a plain ink beast. No boss type.
  Collision is circles only (`W.pillars`; big maps pass only the solids near the hero).
- **The hooks a page uses:** `api.scene` (`begin`, `items`, `end`, `boards`, `bounds`, `walk`, `heroLift`, `noHud`,
  `ownFallen`), `pixelScale`, `roster`, `dress`, `items` (`held`, `tool`, `weapon`), `harvest`, `mods()`, `armor`, `shield`,
  `sfx(n, v, src, x)`, `onLog`, `overlay`, `parryWindow`, `meleeStep`, `struck` (people the hero's blows can hit), `nav`,
  `onNoise`, `onBlood`, `enemySprite`, `heroSprite`, `hudBars` (a page draws the health and stamina bars itself when it returns true).
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
- **Fighting two or three at once** (`CROWD`, 2026-10-23, Robin: "being able to fight 2 or 3 at a time in a reasonable way"; the numbers mine, first settings, sliders under "feel" in the arena's Tuning panel, 0 turns one off; `docs/combat-crowd.md`): **the parry's shock** (a parry staggers every other man within `shockR` 80 in front of you for `shockT` 0.45 s, `crowdShock`), **the finishing blow's fear** (the men within `fearR` 130 of a man who takes it stand frozen `fearT` 0.8 s with their guards down, `crowdFear`) and **the shield bash** (Robin, 2026-10-23: "only be able to be used when the enemy is blocking, to break their block", then "bash all the time" with low damage off a block; the blow key with the guard held, so J or the left button while K or the right button is down, "holding mouse2 and doing mouse1": the man before you within `shoveReach` 36 **with his guard up** has his block broken (no guard again for `breakCd` 1.4 s), is thrown back `shoveD` 380 as a push, about a hero's length, and staggers `shoveT` 0.55 s, and a man he is thrown into staggers with him; `shoveSt` 14 stamina, once in `shoveCd` 1.1 s; **the bash comes always** (Robin, later the same day: "you should be able to bash all the time, but if it doesnt hit a block, it just does low damage"): a man with his guard down takes `bashDmg` 0.35 of the held weapon's blow and a push of `bashKb` 90, nobody in front is a bash at the air, the stamina spent either way; without a shield the shoulder does it at `shoulderK` 0.7 (Robin: "just bash by hitting with your shoulder"); the clips `bash` and `bash_wpn` are asked of Colin, AD, the block held through `bashT` 0.3 s until then; `crowdShove`). The bots neither shove nor go for a staggered man, so `tests/battle.js two` and the new `three` (against three) barely move with them; Robin judges by hand.
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
karve by you", "Four hirdmen join" (`hirdGive`); `debug().giveMen`, `clearMen`, `claimAt`, `hirdList`, `raidShore`, `raftUse`, `work(id, n)` (a bar or a dish started as the board's button does), `year()`, `seasonTurn(name)`, `blot()`.
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
  church), E at the stair out; the trapdoor stands open from then); **the catacombs** (the village session's interiors plan,
  section 7; Robin, 2026-10-22: "Yes"): a crypt grows with its church (`cryptRank`: a lone church's stays as it was; a town's
  church at `CRYPT_TOWN` 0.5 wealth and up is rank 1; a great town's cathedral rank 2, always, its trapdoor placed at any wealth;
  `Cave.make` kind `crypt` with `rank`, `makeCatacomb`; the numbers mine). Rank 1: the stair, **the ossuary** (a long passage
  with the bones of the old dead in arched niches painted on its north wall, `cave.niches`, `penNiches`), three side passages
  north and south by turns, each **blocked by a fall of masonry** (two of Colin, AD's `masonryFall` heaps, `assets/props/crypt`,
  ores with `block` that the pick clears as the mine's fall of rock) with **a chest behind one in three** (at least one) or a
  coffin, **two chambers round a pillar** (the loop; a shape can be cut away now, `L.holes`, the pillar's face niched too), **the
  relic vault** north of them **behind an iron gate** (`cave.gates`, `Cave.drawGate`: shut it is a wall; E "Unlock the gate"
  with **the priest's keys**, taken with E from the priest of that place fallen or cowering, `priestKeys`, `seen.keys[vi]`;
  without them "Locked: break it open" and the axe breaks it, `GATE_BITE`, 14 hit points), and **a second way out**: a ladder up
  (`cave.exits`, E "Climb up") to a slab before the churchyard's grave farthest from the church's door, nothing marking it until
  you have come up through it, then the slab lies pushed aside and E "Go down" is a way in (`cv.outs`, `cv.opened`, saved).
  Rank 2: two loops joined, five side passages, the vault behind **two gates** with an antechamber, and **the well's shaft** up
  into the market's well ("Climb the well"). The vault's silver is half again more a rank. **Every crypt's coffins open** (E "Open
  the coffin": "Only bones", or now and then a silver ring of 3 to 6; Colin, AD's `coffinStone_open` and `coffinWood_open`;
  `seen.coffins` counts them for the reputation to come, not built; `seen.graves` is Arnor's graves story told). `tests/cave.js` floods each rank (both ways round every
  pillar, the alcoves and the vault shut off by the falls and the gates, the ways out open); `tools/visual/cave.js 11 map crypt1`
  (`crypt2` the cathedral, `OPEN=1` the coffins opened); `debug().crypts()`, `cryptRemake(vi, rank)`, `cryptGo(vi)`. **The hall has a back room** (an inner wall three tiles from
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
refuge and come back homeless. **A fire in a place at peace is no raid in itself** (2026-10-21): the house's own run out, the men come to look, and **the bucket brigade** fights it: a place with a well sends up to four free villagers to it with buckets for any fire within 320 units of the well (`BRIGADE`, `brigadeTick`, `bucketStep`; the roof that has just caught first, then the wall nearest to burning through; `Ruin.douse`: a wall goes out and stays wet 40 s, a roof loses 14 s of its burning a bucket, `R.fire.bucket`, `wet`); a fire beyond the well's reach, or in a place with no well, burns; a fire in a place already uneasy or raided is part of the raid and stirs it. Measured (`tests/ruin.js`): a thatched wattle house with three on it stands, with one on it mostly burns; in the live town four villagers put out a timber-frame house fire in about 130 s after it had taken a block's worth of walls. The stakes of a village's ring can be hacked down. **Wooden furniture breaks too** (the village session's interiors plan, section 5; Robin, 2026-10-22: "Yes"): in a place not yours (`theirs`), a table, bench, chair, stool, shelf, cupboard, loom, bed or laid table takes about four axe blows (`WOODF`, its hit points; the pick bites at half), heard softly (`FURN_NOISE` 110), and falls to a heap (the studio's `furnitureHeap` when it comes, the broken door's planks until then) with one or two wood (a bed or a loom some fibre too); in a burning room, or on its glowing ashes, it burns after `FURN_FIRE` 20 s to a charred heap (`furnFire`). Stone (the hearth, the quern, the altar, the font) never breaks by hand. **Mending** (the piece `mend`, once a claim
stone of yours stands there) mends walls and raises a fallen roof. The leaning side face (`Build.CFG.lean`, 0) stays in `src/build.js` for the
mountains' walls; its trial on the editor's board was cut in the clean-up of 2026-10-21 (Robin doubted it).
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
- **Caves** (`src/cave.js`): `Cave.make(seed, { kind })`, `'troll' | 'mine' | 'sea' | 'crypt' | 'cellar'`, laid far off the map; **larger and scarier since 2026-10-22** (Colin, AD's prototype taken whole, Robin: "make the caves feel larger and scarier ... looking down an abyss"): the troll's cave on a grid of its own, 104 by 60 tiles (each cave its own `GW` and `GH`, set at every way in from the page, `use`; the others 72 by 40, a cathedral's catacombs 80), laid as beats dealt from a deck between the hall and the lair (a great cavern, the abyss crossed by a rope bridge, `cave.bridges`, walked on, `onBridge`; the pool, a fungus grotto, a hall of columns, a pit of bones), the dressing from `assets/props/cavekit` (`cave.dress`: columns, dripstone, fungus, bones, the troll's bed, the bridge; drawn among the figures and solid by its `r`, the bridges under everyone; the stand() cones gone), the troll's fire by his bed (`cave.fires`, the fire pit's sheets), and in `Cave.dark` the abyss's light from below, each fungus a light, shafts of daylight, eyes in the dark; the catacombs with a bone hall, a burial pit with planks across it and a chapel, candles and grates (`assets/props/cryptkit`); **the cellars** (`makeCellar`, `assets/props/cellarkit`): a village's cellar hatch leads down (E "Enter the cellar"; `cellarSetup` registers one a hatch with the crypts, `cellarMake` makes it when first entered and it is let go when left) to the stair, the stores room with its shelves, casks, hams, root bin and candles (a second room in a big house) and, in an old place (the generator's `old` on the hatch: the place's age, a burnt house's old cellar always; `big` a longhouse or a hall, or a house of 56 tiles; Colin, AD's, 2026-10-23), the old tunnel to a ladder that comes up beyond the houses (`outs.tunnel`, the open hatch drawn there once climbed) or the crack in the floor with eyes in it; the stores' chest is the hatch's own store (`cellarDoor`, `cellarChestNear`), so its loot is kept as before, and the hatch no longer opens as a chest from above; a cellar is never marked on the chart. My fixes to the prototype: the hall and the pit kept beyond the alcoves' reach (they went round the falls of masonry), the dead man in his nook wherever it lies, no pocket into the abyss's trench and the way through cut clear of it off the bridge, the veins and the ores topped up; `tests/cave.js` reads each cave's own grid, sixty-three seeds clean; `caves`, `cur`,
  `here()` in the game; mined rocks, veins, what was seen and what was taken are saved. `tests/cave.js`, `tools/visual/cave.js`.
- **Villages** (`src/village.js`, `docs/villages.md`): **Since 2026-10-22 every place is grown by one grammar (`docs/settlements-plan.md`; Robin's brief of that day, the structure mine): a focus (a farm's yard; a village's green with the big fire, the well and the stone; a town's market), a spine (the roads, laid first: a winding street, the ring road round a green, a town's main street gate to market to hall with cross streets and the lane inside the wall), units grown one at a time where an interest map says (near the spine, facing the focus, the sun side, not on the last; the street grows when nothing fits), the edge drawn last round what grew (a farm's own rail or wattle fence with a gap on its lane from `farmFenceAt`; the ring of stakes or the fence round all; a town's wall two tiles out with the gates where the streets cross it, a wooden panel and a locked postern as the raider's weak pieces), the outside (fields on the side with room, the sacred, the midden, the graves, the shore strip), the ground worn where the people walk (every household's routes between its spots, counted a tile at a time: `wear`), and over it the layer for exploring and raiding: `V.zones` (public, semi-private, private, the prize), `V.ways` (every way in with its seconds and its noise from `PRICE`: the gate, the back gate, the water, the mended run of stakes `stake.weak`, a fence, a panel, a postern, the villagers' shortcut), `V.secrets` (a budget by tier from a pool, each with its cue: the cellar under a rug, the storehouse loft with its ladder, the midden cache, the hollow mound, the shortcut gap, a town's old cellar, the smith's half-made blade, the crypt, the hall's back room), `V.nodes` (the gates, the focus, the prize, the precincts, the landmark, the shore; `garrison` puts two men at every precinct's gate), and `Village.audit(V, D)` (`tests/settlement.js`: walkable from the way in, loops, ways in, landmark, denial, secrets, loot and the carry, men within hearing, the fire chain, doorways). The unit of a tier is the whole of the tier below: a farmstead is buildings round one yard (the ring plan, `ringUnit`); a hamlet, a village and a seat are farms (16 by 16 or 17 by 23 tiles, each the ring plan made compact) along a street or round a green, a seat with the hall's own precinct on the high side; a trading post is plots along a shore street (`plotUnit`: the house at the front, its gable to the street); a town is plots in blocks between its streets, typed by where they stand (merchants by the market, the gate ward, craftsmen, the poor by the wall), with the hall's and the church's precincts and a suburb outside the gate. Every unit is grown canonical (front south) and stamped in turned to face its street (`stamp`). `ARCH` has `tier`, `family` (single, street, green, auto, row, town), `farms` or `plots`, `green`; the sites grew (a village 88 by 62, a seat 96 by 72, a town 120 by 88 since the bigger houses of 2026-10-22; the seat takes one of the two biggest medium islands). A place has a shape, a story (`STORIES`: raided before, the smith's place, the brewer's, the seal hunters, an old seat, market day) and an age; `opts.rounds` grows only so many units (the editor's slider). `Village.VERSION` is 2: a save made under the old generator keeps old walls in `B` under new props (the layout key should carry it: the Game Developer's). What the game reads of `V` is as before.** The farm itself: `Village.make(seed, site, opts)` grows a ring plan round a yard with a
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
  `troll_build.py` the trolls and the four väsen; `people_build.py` the people; `caves_build.py` the cave mouths and the rock shelter in the kraken's style (the studio's, 2026-10-21; the peaks only when named, they are painted with the ground), rendered to `art/render/caves` and packed by `tools/props.js` (`art:caves`; it was `rocks_build.py` until the studio's rocks took that name on 2026-10-20); the studio's set-piece builders `trees_build.py`, `plants_build.py`, `rocks_build.py` and the rest, packed in the studio);
  `art/build/toon.py` is the shared cel look (its sun is 3.0, so everything rendered now has a lit side; bright base colours
  want taking down about 15%); `art/build/render.py` renders every clip, direction and layer; `tools/sprites.js` and
  `tools/people.js` pack the sheets. `npm run art:mixamo`, `art:items`, `art:shield`, `art:icons` (`tools/icons.js`, 2026-10-22: the weapon and tool icons rendered by `art/build/weapon_icons.py` from the hero kit's own weapons, halved into `assets/sprites/items`; it takes the kit's .blend, which is the studio's; the icons carry a tag from their bytes), `art:people`,
  `art:beasts` (and `art:boar` to `art:snake`), `art:trolls`, `art:vasen`, `art:caves`, `art:hero:death`; the ships' clips
  (`row`, `helm`) are `art/build/rowing_build.py` on `people.blend` and `hero_kit.blend` (in `art:people`; the kit's `row`
  is packed as a clip with its own frame: `node tools/kitpack.js art/render/hero_kit assets/sprites/hero-kit hero-kit --own`
  with the frames in `art/render/hero_kit_own`).
- **What is in the game:** **the hero on the kit** (`hero-kit`, 2026-10-20, Robin's decisions: a base body, every garment a
  layer; in the kraken's style since 2026-10-21, the round's fifth item: chosen tones on every layer and the inner line only where colours meet, the heavy outer line kept, every file and clip number as before, the row clip carried over; the starter look 275 MB decoded, was 264; the studio rebuilds it with its `tools/kitrender_k.js` and `hero_finish.py`; drawn on the people's path by `Sprites.drawKit`, the clip and frame from `pick()` as before, an attack's frame put on
  the clip's `contact`; his look built by the game's `heroLook` from what he wears: the starter tunic and trousers, shoes or
  boots, the belt, a coat or mail over the tunic by the chest's material, the cloak, the headwear by the helmet's material (`HERO_HEADS`, the studio's nine heads, Robin liked them all, the tiers mine:
  leather the wool cap with ear flaps, wool the Phrygian cap, fur the fur cap, copper and bronze the plain iron cap, iron the
  conical helm, silver and gold the Gjermundbu; the hoods wait for an item) with the hair under a hat,
  the bronze ring on the arm, what is in the hand and the shield (the guard: with a shield the shield arm across, `block`; without, the weapon raised across, `block_wpn`, both held through a walk); starter colours `Sprites.KIT_START`; blades light steel;
  the old `hero2-mixamo` can still be chosen in Models, under Backup, `game.heroSet`), the people (one body with coloured
  layers, packed as WebP atlases, loaded lazily; in the kraken's style since 2026-10-22, the round's seventh item, as the hero: chosen tones, the inner line only where colours meet, every file and clip number as before, row and helm carried over; the whole set 501 MB decoded, was 523, one look 151.5), the six animals (**their sheets loaded when a beast of the kind comes within
  900 units and let go after 60 s with none near** (`sheetTick`, `Sprites.warm`, `unload`; 2026-10-20: all eight kinds were
  made at the start, about 550 MB decoded, the troll's 234); a sheet is decoded off the frame as it arrives (`imgOf`); while
  it is on its way the beast stands as a soft shadow; the hero's kit warms the clips of what he holds as his look changes;
  `debug().sheets()` counts what is loaded, `sheetBytes()` what they take decoded; **the hero's kit and the people let go of the
  sheets of clips not drawn for two minutes** (`Sprites.trim`, `trimTick` every 5 s, the core clips kept: `KEEP_HERO`,
  `KEEP_PEOPLE`; a warmed clip counts as used when warmed; 2026-10-21: the kit held every clip ever used; measured in the pane: the
  kit 127 MB decoded with 105 sheets at the start, 60 MB with 56 once the unused ones expire, the people 52 to 38; `trimNow()`
  forces it)) (the moose the studio's lit one, trimmed to the memory budget, dropped in
  2026-10-20; **the boar in the kraken's style** since 2026-10-21, Robin: "that new boar looks so much better": chosen three-tone colours
  instead of the shared shading, the light from one smooth body, fewer bigger pieces, hair as a ragged outline; `quad_build.py`'s
  style switch, `BOAR_STYLE=A` the old one, `render.py --inner mat`; every clip in its own tight frame, the idle 16 frames at 8 fps
  (kept on purpose: the studio traces the laggy idles Robin sees to the 2026-10-20 slimming), 41 MB decoded against its budget of 30; its walk and run carry strides since 2026-10-21 (walk 12.78, run 41.07, from its builder's gait: its feet slid; `art:boar` packs with them, and the young boars are covered as the stride grows with the drawn size); **the wolf too since 2026-10-21** (the kraken round: frame 180 by 183, idle 16, walk 12 with stride 20.24, run 8 with stride 78.38, the eye marks in every clip, 29 MB decoded; `art:wolf` renders with `--inner mat` and packs with `tools/sprites.js --strides`), **and the deer** (the same day: a red deer stag in his summer red, frame 228 by 228 for the antlers, idle 16, walk 12 with stride 17.03, run 8 with stride 80.97, 37 MB decoded), **and the adder** (the same day: the chosen colours and one continuous zigzag band where it had lozenges, frame 161 by 91, idle 16, walk 12, run 8, the body's wave travelling a sheet metre a loop in both, stride 26.4; 13 MB decoded; `art:snake` renders with `--inner mat` and packs with `--strides`), **and the bear** (the same day, chapter 2's but on Robin's list: remade with the head one shape from the chest, the dished face and a pale muzzle, each leg one thick limb on a broad paw with short pale claws, a shaggy crest over the shoulder hump, a ruff, a belly fringe and skirts on the legs, chosen browns; frame 231 by 213, idle 16, walk 12 with stride 21.29, run 8 with stride 69.67; 47.4 MB decoded, under the art plan's 50); **and the moose** (2026-10-22, Robin through the Art Director: "Go with the moose", accepting its 88 MB decoded against the plan's 50, the old one 65: remade with the head one long shape to the drooping nose, each leg one long limb pale below the knee, the palms flat blades with tines cut in their outer edge, a shaggy mane over the hump and the bell as a ragged strip; a larger frame, 332 by 333, at the same pixels a metre, for the palms; idle 12 at 6 fps, walk 10 with stride 31.94, run 8 with stride 76.27; `art:moose` at `--size 380 --ortho 4.798` with `--inner mat` and `--strides`)), the boulder troll as the cave troll, Hårungen as his young (**the trolls are kept and brought into the kraken's style**, Robin, 2026-10-22, through the Art Director: "go with the old (updated)", not the studio's three new concepts; in since the same day, all six: the cave troll, the forest troll, the Gape, the three-headed troll, Trollmor and Hårungen, the same files and clip numbers, the idles 16 frames at 8 fps, a stride on every walk and Hårungen's run (in game units with the set's `scale` 1.333 in them; the drawing applies the scale to the picture, not the stride), Trollmor's frame 311 by 385; `art/build/troll_build.py`, `unge_build.py`, `vasen_build.py` (Trollmor's) and `toon.py`'s face decal over all three tones). The forest troll, the Gape, the three-headed troll,
  the draugr, the huldra, Näcken (the last three the redesigned ones, 2026-10-20), Trollmor (new) and the bysen are in Models only, waiting (`docs/beasts.md`). **The art plan** is the studio's (`C:\dev\SG\Art Director\docs\art-plan.md`, 2026-10-20):
  who draws what, memory budgets per set, the drops first. **A clip may carry its own frame and anchor** (`anims[clip].frame`,
  `.anchor`; the set's top level is the idle's): the game, the Models scene and the `tools/visual` sheet tools read it. **The cast** (`Sprites.CAST`, `castList`, `castStatus`): every figure set by group with its name and its chapter, the one list Models and the studio's viewer show.
- **Every frame cut to its own pixels** (`tools/framepack.js`, 2026-10-21, Robin: "do the laggy idles and frame rate"; the art
  plan's foundation): a set of whole-frame sheets is repacked into the people's format (each frame's piece on shelves 1024 px
  wide, `anims[clip].rects[layer]`, `rectBytes` 2 past 255 px, `meta.shelf`, `meta.framepacked`), drawn through
  `Sprites.pieceOf` by `beast`, `draw` and the models scene's sheet view (the shadow, the rim light, the flash and the tints
  follow, their whole-sheet copies shrinking with the sheets); `tools/sprites.js` runs it after every pack (`--grid` keeps the
  grid). Every set is packed but `hero2-mixamo` (one of its sheets crashes the image library; a backup): the beasts the game
  spawns 639 MB decoded to 324, the waiting trolls and väsen 1391 MB in all to 537. `tools/visual/beasts.js`, `trollsheet.js`,
  `vasensheet.js` read the pieces. **The idles get their frames back** when the studio renders them again at full counts into
  the room this frees (the 2026-10-20 slimming cut them to 8 frames at 4 fps, and the crossfade is off on Robin's word).
- **The feet locked to the ground** (Robin, 2026-10-21: "the moon walk"; his choice: keep the speeds, fix the stride): a walk or
  run whose clip carries `anims.<clip>.stride` (the ground its figure covers in one loop, in game units; the studio's new clips
  will carry it, the hero first, then the people, then the beasts) is picked by the distance walked, not the clock
  (`Sprites.odo`, a running ground distance from a thing's world position, a jump of 60 units in a frame not walked;
  `strideFrame`, the stride grown with the figure's drawn size): the hero (`pick`, the guard walk too), the game's people (`st.d`
  from `drawPerson`), the engine's men (`fighter`) and the beasts (`beast`). A clip without one keeps the clock as before. **Strides in sheet metres** (the studio's correction, 2026-10-21: a metre is 26.4 units, not 23.9, so every stride of that day grew by 1.105: the hero's walk 55.68, run 71.82, guard walks 35.73, walk_fast 35.24, made for about 61; the people's walk 30.23, jog 41.10, run 51.26, carry_walk 26.52), and **north and south counted as the sheets see them** (`Sprites.nsOf`: a figure rendered from 35 degrees up shows a ground step north or south at sin 35 of its length while the game draws the world's north-south at `GROUND_K` 0.75, so the odometer counts that part 1.31 times; the speed stays the world's). **The hero's walk and run have it** (the studio's `out/hero_gait`, 2026-10-21: the walk 12 frames, stride 50.4 units at 84 a second, a light jog; the run 10 frames, stride 65.0 at 130; the planted foot measured 3.50 against 3.52 m/s and 5.38 against 5.44; checked in the models scene: every frame on its distance), and in the studio's second drop the same day the foot's roll, the hips and the line of the feet fixed, **the guard walks** (`block_walk`, `block_wpn_walk`: 12 frames, stride 32.34 for the 46.2 units a second the guard allows) **and the idles at full frames** (`idle` 32 at 8.5 fps, `idle_look` 48 at 7.54, the loops as long as before): the hero's resident sheets 158 MB in play with a sword and shield, under the art plan's 350. **The people's idles** the same day (the studio's `out/idles`): the hero's idle, one breath in 3.8 s, on the people's rig (`art/build/people_idle.py` after the folk build, in `art:people`; the old ten-second loop kept as `idle_long`), `idle` 32 frames at 8.5 fps and `idle_look` 48 at 7.54, in a frame of their own (160 by 156, the foot within half a pixel of the hero's idle, measured; since the kraken re-render of 2026-10-22 in the set's own 164 by 164, the foot where it was to half a pixel); one look 151 MB decoded, was 130. **The adder's idle** 16 frames at 8 fps (`art:snake` renders 16; the adder itself in the kraken's style since 2026-10-21, above). **The people's gaits by speed** (the studio's four clips, in on Robin's yes of 2026-10-21: a stroll of 12 frames made for 38, stride 27.36; a jog of 10 for 60, stride 37.2; a run of 10 for 80, stride 46.4; the bucket walk of 12 for 30, stride 24; `art/build/kit_gait.py --table people` in `art:people`; Robin: "im still not sure about 'the jog' of hero and villagers. But we'll do it like this for now"; walking instead would mean the speeds coming down, the stroll plants its feet only to about 45): a people's set with a `jog` clip picks walk, jog or run by how fast the figure really moves (`Sprites.gaitClip`, `GAIT` jogAt 50, runAt 62, a hold of 4 at each edge; the speed from `Sprites.odo`, smoothed: villagers 38 to 44 walk, the men at 60 jog, fleeing at 70 and the men at 94 run), in `drawPerson` and `fighter`; without one the old choice stands. The deer and the wolf wait: Robin is asked whether they are remade in the boar's style first (the wolf's idle is packed and ready if not). **The third walk and run** (Robin: the second was "a little robotic"): the hips turn and dip with each step, the chest turns against them, the head sways, the arms trail; **Robin keeps the speed and the jog** ("we go with 1", 2026-10-21). **The hero jogs at 78** (Robin, 2026-10-22: "Im using a speed up walking atm, but id prefer a better jogging. I think the normal
pace needs to be around 75-80 as now its actually too slow"; on 2026-10-21 he walked at 60 on `walk_fast`): the studio's `jog`
(its `out/hero_jog_cloak`: 12 frames, stride 48.4, made for 78, on every layer the walks have) is his moving clip by default in
`Sprites.pick`, and the engine's `HERO_GAIT` has walk 78, sprint 130, the guard walk 46.2, `stroll` 60, `jog` 84 (the first jog's
number); Admin's **The hero walks at 60 (yesterday's pace)** brings back `walk_fast` at 60 while it is on (`strolling`, `gaitSync`;
the older 84 jog's switch is gone, its `walk` clip stays in the set with `walk_fast`). The Stats page reads the speeds from
`HERO_GAIT`. **The sprint costs 18 stamina a second, was 22** (Robin, 2026-10-21; 18 mine: `HERO_GAIT.sprintSt`). Your men
walking beside you follow at `max(MEN.speed, HERO_GAIT.walk)`. **The cloak swings** (the same drop: it hangs on three joints,
trails with the pace, bounces and lags behind turns, on every clip but `row`; `art/build/cloak_swing.py` after `kit_gait.py`).
Measured: 77 to 78 on the jog, 59 to 60 with the switch; `tests/battle.js ladder` within its noise.
- **Traps already met:** hold out by material, not by the object's switch (Freestyle lines showed through bodies); render one
  clip again with `--keep 1` (else the numbers hold that clip alone); a clip that travels gets a frame of its own
  (`--inplace`, `anims[clip].frame`); a layer packed with `--only` lies in a box cut to its pixels; a changed sheet needs its
  `?v=` tag (the build adds it). **Open:** the 160 px frame cuts the tips of long weapons; the wrist (the hands bound to
  Mixamo's hand bones) waits; the people have the lit side and their own face since 2026-10-20 (`toon.py`'s "folk" face: the hero's without his
  moustache; `people_build.py` strips his fringe and beard tufts; the idles halved); the bysen still lacks
  the lit side (the trolls have it since 2026-10-22) (the wolf and the adder have it since 2026-10-20).

## Sound and music

- **Synthesized:** each page has its own set in code (the engine's sounds, chop, clink, build); `src/ambient.js` is the
  place's sound (wind, leaves, sea, birds by day, crickets from dusk, fire, water, caves, footsteps by the ground), its
  loudness the Escape menu's second bar, each layer a switch on Admin's Light and sound board (`LAB.snd`). Everything hushes
  when the window loses focus.
- **Recorded sounds: Robin's picks, locked in (2026-10-20,** pasted from the arena; `DEFAULT_PICK` in both pages). `src/sfx.js`
  plays `assets/sfx/combat.js`, built from **only what the game plays** (`assets/sfx/keep.txt`, 40 sounds, 6.3 MB): `node
  tools/sfxjs.js "C:/dev/SG/Sound Director/out/sfx/combat|C:/dev/SG/Sound Director/out/sfx/chapter1|C:/dev/SG/Sound
  Director/out/sfx/flesh|C:/dev/SG/Sound Director/out/sfx/ui|assets/sfx/free" combat @assets/sfx/keep.txt` (the `ui` folder since 2026-10-22: the talk window's and the book's); `Sfx.vol` 0.5; where no recording exists the
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
  - the studio's own for the rest (parry, crit, the tell, the chain, finish, broken, perfect, stagger, dash, hurt,
    slam, die);
  - **the bow shot B** (Derek, SD's `assets/sfx/bow`, Robin's pick of 2026-10-23: a recurve's snap; the studio's old `shoot` and the other candidates are out);
  - **the weather's sounds** (Derek, SD's candidates of 2026-10-23, `assets/sfx/weather`, copied whole; **their own bundle
    `assets/sfx/weather.js`**, 21 MB, built by `node tools/sfxjs.js assets/sfx/weather weather`, `__TAG_WSFX__`, **loaded when
    the first wet spell comes**, `WSFX`, `weatherSfx`; Robin picks in the arena, where its rows are the world's): the rain as
    beds, seamless 16 s loops (`Sfx.loop`, `Sfx.setLoop`, `Sfx.cut`) crossfaded by each spell's own strength (the shower
    `rain_light`, rain `rain`, the storm `rain_heavy`; `rain_water` beside them while the sea is in sight), through the place's
    own volume; **the thunder** 1.5 to 5 s after each of the storm's flashes, quieter and lower the longer the delay
    (`weatherThunder`); **a step** where a print shows (`step_snow`, `step_wetsand`, `step_mud`) and **a splash** through a
    puddle on wet ground (`weatherStep`, `weatherSplash`, from `wgTick`'s footfall); the gust is not played (the game's own
    wind). The numbers are mine. `debug().weather().sfx` counts what played;
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
