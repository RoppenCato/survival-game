# Viking survival game: prototypes

2D top-down survival crafting game set in Viking-age Scandinavia (three-quarter camera, cartoon look). All art,
animation and sound is drawn or synthesized in code, except that since 2026-10-09 **characters and creatures are modelled in Blender and
rendered to sprite sheets** (`art/`, `assets/sprites/`; the plan and the order are in `docs/moving-to-blender.md`). This repo
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
- **Scope for now (Robin, 2026-10-09):** **the starter island and the big island only**, until they feel great: everything the
  starter island needs, getting to the big island, and all there is to do there. The lowlands, the further islands and the later
  progress stay built in the code but are not spawned (`spec.sizes` [120, 400], `biomes` [0, 0], `count` 2). None of the
  raiding, clan or calendar systems are played yet. `game.html` is the playable start (see "The game" below).
  **The big island has a small mountain since 2026-10-12** (Robin: a small version of the mountain biome there, mainly to
  introduce the player to mountains and to get the first copper): see "Mountains".
- **Decided 2026-10-12 (Robin's questionnaire before the mountain biome):** besides the troll's cave the mountains have **an old
  copper mine, a rock shelter and a sea cave** (not a bear's den); **the first copper is veins in the open cliffs, then the
  cave** (a little safely, the real amount behind the troll); the big island gets **foothills and a small plateau** (about a
  sixth of it); **ambient sound is synthesized in code** like all the sound; better lighting should do **fire and torch at
  night** and **atmosphere** first; lighting techniques are compared **in pictures, then as switches on the Admin board**.
- **Decided 2026-10-14 (Robin's answers on the four big problems in `docs/idea-bank.md`: the year turning, scale in 2D, a
  living world, handcrafted or generated towns; nothing of it is built).** **Seasons Stardew Valley style, but the player
  decides when a season moves**, at a moment at the end of every season; not abusable, and never a stress; **seasons feel
  different and give access to different things and mechanics**; the whole time and season aspect is for later. **After
  winter, "controlled randomness":** a destroyed village or town is rebuilt by survivors and stronger, or scavenged by
  bandits who make it their home, or fades and is overtaken by nature; and **every island gets events generated after
  winter** (people settling a small new village with boats by the shore and a path up to it; trolls moving into a new
  cave, the cave changed but not the layout; new creatures showing up, such as Näcken; destroyed villages rebuilt in
  various ways; places that were not raided expanding). **The camera pulls out under sail** (a faster clock at sea: not
  sure, later). **Nothing handcrafted: everything generated in a controlled way**, the hub and the great seats too.
  **Warning beacons** that light along a coast when a raider's sail is seen are a good idea, kept in the idea bank.
- **Decided 2026-10-13 (Robin's questionnaire on raids and the hird, after `docs/battle-plan.md` was built through; twelve
  answers).** **Most of this is not built yet: where the code does otherwise today is said in brackets.**
  **Walking in:** a town at peace lets you walk in **alone**; with armed men at your back the gate guards bar the way and
  shout (built: any band walks in until the first blow). **Pursuit is by what you took:** a short way for a quiet theft,
  to the shore and your ship if you carry the church's or the jarl's silver (built: nobody further than 700 units from a
  man's own post, whatever you took). **The blow from behind** on a man who has noticed nothing is **a kill**, as built.
  **A man of yours left on the shore is taken, not dead:** the town holds him as a thrall and a later raid, or silver,
  wins him back (built: he dies). **The raid party grows with your ships:** a karve's six are for farms, churches and
  small villages; a town of twenty waits for a longship's crew. **A carrier holds on until he is badly hurt** (half his
  health, or down; built: he drops the chest at the first blow). **Your men fall back with you when you carry:** any man
  not in a fight comes once you have a chest or a friend on your shoulder; a man in a fight still needs G (built: only on
  G). **The line becomes a real shield wall:** men in a line stop more on their shields and cannot be struck from the
  side by one man alone; strong in a gate or a doorway, broken when several turn its end (built: it is no advantage
  anywhere it was tried). **If the hero falls on a raid** and any of his own still stands, he is **dragged to the ship**:
  he wakes aboard, hurt and at sea, what was stowed kept, what he carried lost, whoever was down left (and so taken);
  with nobody standing he wakes at home with nothing (built: he rises at the wreck with everything). **The raid's twenty
  minutes come from more to take, deeper in:** more doors and stores in a town (the storehouse, a cellar, every house),
  each thing taken waking more of it (built: two chests, two minutes). **One more order: keep the ship** (the men named
  stay by her and fight for her). **Next to build:** the raid **into the real game** (the lowland island, its town and a
  church within reach, your own hird as the men beside you, the raid saved) and **people** (thralls to cut loose, your own
  taken men to win back, a man who yields bound and taken or let go, a priest who does not fight). Not picked for now: the
  town taking back its silver, and what the town remembers.
- **Decided 2026-10-13 (Robin's four answers on the raid options; built the same day, see "Robin's four answers" under Fighting
  men).** **The unarmed can be killed.** **Drawing the weapon is a key of its own** ("think about a good way to do it": X, and
  a blade out is a threat before it is a raid). **One man at a time may be too kind: versions are to be tried** (five are on
  the battle board; none is chosen yet). **Twenty guards leaving twenty weapons lying is weird: there is to be a system where
  you "take the weapon"** (the weapon stays with the man and is taken from him).
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
- **Scale (the canon, decided 2026-10-09; Robin: the hero should feel small to the world, villages big, the boat big, the ocean
  huge, an island an adventure):** the hero is 1.8 m and 39 units tall, so **one unit is 4.6 cm and a tile (32 units) is 1.5 m**;
  the old brief's "100 tiles are a kilometre" is dropped (it made the hero 10 m wide). Two levers, both pulled: **the camera** sits
  out at zoom 0.65 (the view 390 units tall, the hero a tenth of the screen's height; it was 16%), and **the world grew relative
  to him**: houses 3 to 5 by 3 to 4 tiles, longhouses 9 to 12 by 3 to 4, halls 13 to 16 by 4 to 5, village yards and sites about 1.4
  times (`Village.ARCH`, `BUILD`, `DEF.gap` 3; **the houses grew again on 2026-10-13, to real sizes: see "House sizes" under The
  game**), the starter island 120 tiles, the big island 400, about 100 tiles of water between
  (the raft takes a minute, the boat half that). The karve at 7 heroes long already fits a real 15 m karve. **The hero's speed stays**
  at 84 units a second (a 4 m/s jog): a bigger world with the same jog feels big; a slower hero feels tedious. Islands feel large
  through obstacles (groves, cliffs, water) more than through distance. The Sea Editor shows walking and sailing times.
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
- **Hero: the Blender model** (Robin, 2026-10-09: the new character model in every editor and the game, the old one kept as a
  backup). `src/sprites.js` draws him from the sheets in `assets/sprites/hero2-mixamo` in the game, the Art Editor, the Sea Editor
  and the Combat Arena. **The villagers, Brokk, the hird and the guards are Blender sheets too since 2026-10-13** (one body
  every person shares, with layers: see "The people" under `art/`); the drawn ink figure (`playerD`, `inkHero` in
  `src/art.js`) is only what is shown for the moment their sheets are still loading. The old Character Editor is in
  `art/backup/`. Robin rejected a pixel-sprite look long ago.

## Commands

```
npm start         # rebuild, then open dist/index.html (the start page)
npm run build     # python3 tools/build.py: stitches templates/ + src/ into dist/*.html
npm install       # once; only dependency is @napi-rs/canvas (fake canvas for headless tests)
npm test          # runs the scripts in tests/ in sequence (combat, weapons, the ring, gathering, iron, the karve, fishing, runes, the caves, the ambient sound, the blows, the battles, destruction)
```

There is no bundler, linter or type checker. `.claude/launch.json` has a `workbench` entry that serves the **repo root** on
port 8765 for the browser pane (since 2026-10-09, so the pages reach `assets/`: open `http://localhost:8765/dist/<page>.html`; the
pane has a tab limit: close old tabs if a page will not open).

## Pages

| Page (in `dist/`) | Template | What it is |
| --- | --- | --- |
| `index.html` | `index.html` | Start page. **Laid out by chapter since 2026-10-13** (Robin: work on the chapters one at a time, all connected): **Play** (the game: chapters 1 and 2), **Systems** (each a part of the game set up to be worked on by itself, on the same engine and numbers as the game, so what is fixed there is fixed everywhere: the Combat Arena, the Battle test and the Destruction Editor for chapter 3's raiding, the Big island test, the Mountain test) and **Editors** (Art, Village, Sea, Song). |
| `art-editor.html` | `art.html` | **Art Editor (2026-10-09, the cleanup; the Creatures tab removed 2026-10-13, see "The editors cleaned up" under The game):** the Object and Blender editors as one page with two tabs, **Models** (the Blender sheets: model, gear layers, Height, "Use in the game" picks which model is the hero, the starter island, arena or night forest, the Clips keys), **Creatures** (the drawn animals and trolls: templates, body plan, shape, behaviour, the library, "Update in game") and **Objects** (one world prop at a time: category, variations, size, shape, surface, colour). The hero in every tab is the Blender model (`Sprites.attach`). One canvas and one engine: each tab is an object in `TABS` with `enter` (sets `Combat.api.scene`, `roster` and resets the arena), `leave`, `tick` and `after`; a tab's elements are found by `data-id` inside its own containers (`scope(name)`), so the tabs share names; the open tab is kept in `arteditor.tab` and `?tab=` opens one. The Characters tab (the drawn hero's editor) was retired the same day to `art/backup/character-editor.html`. **Since 2026-10-13 the Models tab has a People panel** (rolled villagers from the one body every person shares: the clip, the thing in the hand, mail, helmet, shield and cloak for all; `crowdRoll`, `crowdItems`). |
| `sea-editor.html` | `sea.html` | Sea Editor: the archipelago, ships and sailing |
| `song-editor.html` | `song.html` | Song Editor: the game's music; a simple view with dice and a library, Advanced for the piano roll |
| `combat-arena.html` | `combat.html` | **Combat Arena (rebuilt 2026-10-13, Robin: more tools to work combat out to perfection: dodging, parrying, blocking, every weapon, moving, different and multiple enemies, hirdmen and fighting men):** the fight on its own, on the game's engine and numbers. **You:** the melee kind, the ranged kind, the metal, what you wear (cloth, leather, mail and helm: `Combat.api.armor`), a shield on the arm (`Combat.api.shield`, the game's rule: not with a bow or a Dane axe), Heal, Never fall. **Men:** against you a weapon, gear and wits and Add one; beside you a weapon and gear and Add a hirdman; set pieces (one, two, two with one beside you, five against five, with a bowman each, three against your line of three); **They come** (`Combat.WAYS`); Clear the field, Start over. **Beasts:** every animal, the four trolls, the four väsen, a pair of wolves. **The clock and the eye:** the clock as it runs, half, a quarter; **Show the blows** (`Combat.api.overlay`: your weapon's reach and arc, amber winding up and red as it lands; your guard, white in the parry's instant and blue after; the dash while it keeps you untouchable; on every man his reach, his blow filling as he winds up, his shield's cover); Hold them still (`e.hold`); Sound; aiming. **The last blows** (`Combat.api.onLog`): a log, newest first, of every dodge, parry, block (what got through, a guard broken), hit taken, blow landed (crit, on his shield, his guard broken) and kill, with a tally. The men are the game's soldiers drawn from the people's sheets (`Combat.api.dressMan`, `Sprites.fighter`; a look from `lib.folkSpec`, a name; yours in your red); **G** gives the two orders. Hit weight (Snappy) and crit (15%) are the decided settings and no longer switches; Juice is always on. `docs/combat-arena.jpg`. **The Tuning panel (2026-10-15, Robin: tune combat against animals, men and many; `docs/combat-tuning.md` is what to test):** sliders for the feel of a hit, the chosen weapon's `PROFILES`, the men's `MEN` and each beast's numbers (`Combat.tune`, see "Things to know"), green where moved, settings as text, **Use in the game** (`game.combat`), Take back, Defaults; the working copy in `combatarena.tune`. The arena's beasts are dressed from the same numbers as the game's (they bit for 12 whatever they were), with a **Young boar** and groups: a pair of wolves, the night's pack, two boars, three young boars, a boar and a wolf. |
| `village-editor.html` | `village.html` | Village Editor (2026-10-07): the rules that grow a village (`docs/villages.md`): an archetype, a seed, the wealth and the shore, the numbers as sliders, settings as text, "Use in the game" (`game.village`) |
| `game.html` | `game.html` | The game: the first island, gathering, boars, inventory, the arm ring |
| `game.html?scene=mountain` | `game.html` | **Mountain test (2026-10-12)**, the test scene of the mountain biome: the game on one island of its own (`World.MOUNTAIN_SPEC`: 220 tiles, the first biome in the south, the mountains in the north), started at the foot of a slope with tools, weapons and building stuff. The board on the left (it folds): to a slope, onto the foothills, the high plateau, under the peaks, north of the fells, to the waterfall, to the lookout, a boat under the sea cliffs, to the cave mouth and into the cave, **to the old mine, into it, to its fall of rock, to the rock shelter, to a copper vein, a boat at the sea cave, into it, to its beach**, the troll out or home, beasts, night or day, more to build with, to the wreck, start over. Its own save (`game.save.mountain`). `mountainScene()`, `mountainRows()`, `mountainAct` |
| `game.html?scene=battle` | `game.html` | **Battle test (2026-10-13)**, the test scene of `docs/battle-plan.md`: the game on a cleared field of the starter island, the hero in leather with one of every iron weapon on the Fight bar (the number keys change what is in hand), and the board on the left (it folds): **one hirdman, two, two and one beside you, five against five** (with none, one or two **bowmen a side**), **a town defended** (the scene's second island is a lowland one with a walled town on it: twenty men at their day, or twelve or thirty, the hero six tiles south of its gate with five of his own, one of them a bowman), **a raid on it** (the same town with its silver behind its doors, your karve on the nearest shore and you beside it with your five), **walk in unarmed, a night raid, storm it with a longship's crew (2026-10-13: see "Four ways to raid")**, to its gate, to its hall, to its church, to your ship; what he carries (it cycles: sword, axe, club, seax, spear, Dane axe, bow), what he wears (cloth and no shield, leather and a shield, mail, helm and shield), his wits (dull, steady, sharp); your own gear (leather, or mail and an iron helm); again, heal, clear the field, the clock at a quarter speed, night or day. **Nothing is saved** (`noSave`). `BT`, `fieldSite()`, `battleScene()`, `battleSet(id)`, `battleRows()`, `battleAct(id)`, `spawnMan`, `Combat.api.dressMan`, `townOf()`, `townMen(vi, n)`, `townSet()`, `raidSet()`, `raidShore(vi)`. **No wolves come at night in this scene.** |
| `game.html?scene=ruin` | `game.html` | **Destruction Editor (2026-10-13)**, the test scene of `docs/destruction.md`: the game on the battle test's world, started at a **sampler** (a small house in every wall material under every kind of roof, a locked store with a chest, a row of yard pieces with a barred gate), the Gather bar holding an iron axe, an iron pick, a knife, a flint axe and a copper pick on 1 to 5, torches and stuff to mend with in the bag. The board on the left (it folds): to the sampler, the town's gate, its church, its hall; the town's men (none, 12, 20); **this place is theirs or yours**; set fire to the nearest house; bring the nearest roof down; put the fires out; whole again; the sampler anew; the wind (east, south, west, north, none); **side walls as now or leaning**; a torch; more to mend with; heal; night or day. **Beside the game view a panel of sliders** (the only test scene with one): every number of `src/ruin.js`, the settings as text (what differs from the defaults), Defaults, **Use in the game** (`game.ruin`) and Take back. **Nothing is saved.** `RU`, `SAMPLER`, `samplerBuild()`, `ruinScene()`, `ruinRows()`, `ruinAct(id)`, `RU_GROUPS`, `ruinPanel()`; played by script with `tools/visual/ruinplay.js`. **The big trials (2026-10-13, the same day):** the board also has **the place** (the town or the village), its men **none, 12, 20, 30, 40**, **a raid on it** (your ship on the nearest shore and five of your own), and three switches that **reload the page**: **Places: great ones** (`&big=1`: three islands, a great village on the second and a great town on the third: `Village.ARCH.great`, `bigtown`), **Houses: as now / half again as big / twice as big** (`&roomy=1.5`, `2`: `Village.DEF.houseK`) and, with bigger houses, **Heard as far again, too** (on by default; `&loud=0` leaves hearing as it was). `TRIAL` = `{ big, roomy, loud }`, `townOf()`, `gateOf(v)`; played by `tools/visual/sackplay.js` |
| `game.html?scene=runes` | `game.html` | Rune Editor (2026-10-07), the test scene of the big island: the game started at a carver's bench in a hut with a workbench, fireplace, bed and chest, and outside it a **furnace, a charcoal clamp and a campfire**; a dragon ring on the arm, every rune known, ore, charcoal, bars and materials in the bag. The board on the left (it folds on a click of its title): the ring's metal, know or forget every rune, bring beasts, day or night, skip to dawn (embers), **to the mountain's foot, onto the plateau, to the lookout, the rock shelter and a copper vein (the big island has a small mountain since 2026-10-12)**, **to the cave mouth, into the cave, to the troll's lair, the troll walking out (brings night) or walking home, veins and hoard full, more ore and charcoal**, back to the bench (finds the carver's bench), start over (clears the save without saving again: `noSave`). Its own save (`game.save.runes`). `SCENE` from the URL, `runesScene()`, `runeAct` |

Robin calls these by the page names. Every page has a "Back to menu" link to `index.html`. Adding a page means a
template and one line in `PAGES` in `tools/build.py`. **Removed in the cleanup of 2026-10-09** (Robin: too much on the site; prepare for
Blender and the first island): the Light Editor, the Gathering Editor, the Hird Editor, the Item Editor and the Art Direction page
(their numbers are the defaults in `src/`; the game still honours `game.gather`, `game.hird`, `game.look`, `game.light` and
`game.give` in storage), and the Character, Creature, Object and Blender editors became the Art Editor's tabs.

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
- `src/cave.js` (`Cave`, 2026-10-12): the insides of the caves (the troll's, the old mine, the sea cave: `make(seed, { kind })`): the layout from a seed (`make`), the painting of its walls
  and floor by the mountains' technique turned inside out (`prepare`, `chunk`, `drawFloor`), the dark with the light let into it
  (`dark`), and the cave's own chart (`see`, `drawChart`). See "The cave's inside reworked" under Creatures. The game keeps what
  lives in it (the troll, the hoard, mining, the dead Viking).
- `src/ambient.js` (`Ambient`, 2026-10-12): the sound of the place, synthesized: beds of filtered noise (wind, leaves, surf,
  hull, brook, fire, a cave's tone) and single sounds (birds, crickets, crackles, drops, creaks), and footsteps by the ground.
  See "Ambient sound" under The game. Loads in Node (the test runs it on a pretend audio context).
- `src/ruin.js` (`Ruin`, 2026-10-13): **the rules of breaking in, bringing down, burning and mending** (`docs/destruction.md`),
  with no drawing and no page; loads in Node. It adds to the building data: on an edge `dmg` (damage taken), `st` (how it is
  drawn: 1 hacked, 2 nearly through), `breach` (it has given: a way through, and still the room's wall as far as the roof
  goes), `burnt`, `scorch` (stone a fire blackened), and on a door `broken`; `B.ruin["x,y"] = { k: 'fallen' | 'burnt', m:
  the roof it had, hot }` for every tile of a room whose roof is down; `B.fire["H:x,y" | "V:x,y" | "R:<room id>"]` for what
  burns. `DEF` is every number (`hp` what a piece takes, `bite` what a tool does to a material, `noise`, `collapse`,
  `frameCounts`, `warn`, `fallHurt`, `drop`, `mend`, `fire`); `cfg(over)` lays a page's numbers over it. `matOf(e)`,
  `rightTool(e)` (the axe's kind of thing or the pick's), `standing(e)` (anything to strike: a door or a gate only while
  locked), `passable(e)`, `hit(R, e, power, tool)` → `{ dealt, mat, gave, noise, none, never }`, `give(e, burnt)`,
  `edgesOf(B, room)`, `strain(R, B, room)` → `{ n, broken, share }`, `due`, `collapse(R, B, room, kind, dflt)`, `ruined`,
  `damaged(e)`, `mendShare`, `mend(e)`, `canRaise`, `raise`; fire: `burnsWall`, `burnsRoof`, `roofSpec`, `ignite(R, B, L, k,
  room, at, dflt)`, `fireTick(R, B, dt, env)` (`env` = `{ rooms, at(tx, ty), wind, rand, roofDefault }` → `{ lit, gave,
  fell, n }`), `roofFlame` (how far the flames have run over a roof's tile), `fireNoise`. `Build.rooms` leaves no solids on a
  breached edge, `Nav.edgeOf` reads a breach as a narrow opening, and **`src/build.js` draws all of it**: `wallMat(e)` (the
  material blackened or charred), `scars` (gashes in the material's own broken colour, the first a hole once it is nearly
  through), `remains` (the ragged stumps of a wall that has given; a timber frame keeps its timbers; a window is a hole in a
  wall that still stands), `rubble`, `drawDebris(c, tx, ty, ru, C)` (what a fallen or burnt roof left on a tile) and
  `drawFlame`; all in "face space", so the same drawing serves a wall that faces you and, sheared, the **leaning side face
  of a wall that runs away from you (`CFG.lean`, 0 by default: a trial, see "Destruction")**. `node tools/visual/ruin.js
  [lean]` renders every state of every piece, a house whole, broken into, fallen and burnt, and the lean before and after,
  to ruin.png.
- `src/nav.js` (`Nav`, 2026-10-13): finding a way round walls, for everything that walks in a village. `Nav.make({ x0, y0, w, h,
  T, open, edge, cost, solids })` is a stretch of the world in tiles: which tiles can be stood on, which edges between tiles
  are shut (`Nav.edgeOf(B)` reads the building data: a wall, a window and every yard piece shuts its edge, a door and a gate
  are open but narrow, a locked door is shut to all but the place's own people), and the round things that stand there. From
  it: `blocked` (does a straight step cross anything shut), `clear` (can he walk straight there: no wall, and nothing round
  in the line), `path` (A-star, eight ways, no corner cut), `next(m, x, y, t, keys)` (the corner to make for now; the way is
  kept on the mover), `narrowAhead` (a door or a gate on his way). `Nav.attach(Combat, at, clock)` answers the engine's three
  questions from the grids a page keeps (`api.nav`, `api.blocked`, `api.wall`), with two rules of its own: **a doorway or a
  gate takes two at a time** (the rest wait their turn a little way back; `e.choked`), and **a place's own man who comes to
  its locked door opens it, and it stays open behind him** (`Nav.unlock(g, B)`). See "Fighting men". Loads in Node. **What the town test found on 2026-10-13** (all in `src/nav.js`): `clear` counts a side line only if both its ends are on the mover's own side of any wall (a man pressed against a wall had a side line that began beyond it and was never "clear" of the foe in front of him); **`next` answers null when the last point of a whole way is the place itself and no wall is left between** (two men face to face beside a corner were each given the other as a corner to make for); **a gate or a doorway is filled only by a man's own side on its way through** (`chokeFull`: not a foe, not a man who is himself waiting; `e.choked` is cleared when he is let through), because the town's men inside a gate and the raiders outside it each waited for the others to clear it, for minutes; **`api.walled(x, y)`** says whether a grid knows the walls at a place; **`g.flood(x, y, keys)`** is every tile that can be walked to from a place (`{ has(x, y) }`: a way's search gives up after 6000 tiles, which in a big town is not the whole of it).
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
- `src/sprites.js` (`Sprites`, 2026-10-09): the Blender models' sheets drawn in the game and the editors: `hero(SP, storage)` loads the
  game's hero model (`game.blenderHero`, else `hero2-mixamo`), `attach(Combat, H, opts)` makes it the engine's hero through
  `Combat.api.heroSprite` (opts: `scale()`, `tool()`, `shadow()`, `shadowHue`, `layers()`), `pick` chooses the clip and frame from the
  engine's state (walk and run; the attack's phases spread over attack1 and attack2, or chop and mine by the tool; the hit; `anim.sit`;
  death from the moment of death), `play(H, name, then)` queues a one-shot clip (the bow's shot comes from `fireT` in `tick`), `cast`
  lays the frame's silhouette on the ground as the props' long shadows lie (or, given `to` = `{ kx, ky, a }`, away from a fire),
  `drawDead` draws the fallen hero where a page lists it. `draw` and `beast` take `opts.lit` (what a fire near the figure does
  to it: a cast shadow, a dark side, a warm rim; see "The lighting trials"). **Slow clips are melted from frame to frame
  (2026-10-12, Robin: the new creatures' idles looked laggy):** the animals' idles are rendered at 8 frames a second, the
  trolls' and the väsen's at 5, and more frames would be sheets of many megabytes, so `idle`, `idle_look`, `sit` and `play`
  (`BLEND`, or a clip with `blend` in its numbers) are drawn as the true in-between of the two frames the clock lies between
  (`loopAt`, `mixTo`: both frames into a small canvas, each at its share, added); a walk is not (two sets of legs). Checked in
  the pane: a standing moose's picture changes on every one of twenty-four frames. Loads in Node too. Every page gets it as `__SPRITES_JS__` and the sheets' numbers as `__SPRITES__`.
  **The people (2026-10-13)** are drawn by the same module from one sheet set, `assets/sprites/people`: `loadLazy(SP, 'people')`
  (a sheet is fetched when a look first asks for it), `lookOf(spec, x)` (a figure spec's hair, beard, hat, clothes, colours
  and build, plus `x` = `{ mail, helm, shield (its paint), cloak (a colour), hand: { kind, tint } }`, turned into a short
  list of layers and colours), `withHand(look, hand)`, `person(c, H, look, st, x, y, opts)` (`st` = `{ clip, face, k or t }`)
  and `fighter(c, H, e, K, look, opts)` (an engine enemy who is a man: the clip from his state). A frame is put together
  once (the layers in their order for that direction, the colours multiplied in) and kept in a store of 700 finished
  frames (`personFrame`, `peopleStats()`); `rectsOf` reads where each piece lies in its sheet (see `tools/people.js`).
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
  and a bench in a big yard); the houses north of the yard stand **deep**, their gables south (see "House sizes"); **job spots** by role
  (`chop` at the block, `carry` at the well, `sweep` at the door, `fish`, `hang`, `smith`; the door spot is tagged `door`).
  the midden, a grave; earth under the yard, gravel from the gate and to the shore, earth from every door, moss at the edges;
  the things inside by building (hearths, beds, chests with loot, crates, benches, a shield rack, a furnace and workbench in the
  smithy, a trough, a hidden **cellar door** in one home with the best stash); the people as households with spots and lines by
  role. It returns the game's own data (`floors`, `H`, `V`, `items`, `roofs` to lay once the rooms are found, `paints`, `props`,
  `folk`, `finds`). `draw(c, V, env)` draws it for the editor; `siteFor(arch)` says what site to find. **The game's hamlet is
  grown by it** (`hamletSite` finds a site of the archetype's size, `hamletClear` grows it and makes the folk, `hamletBuild`
  writes it into `B`, paints the ground with `w.dabGround` and one `w.repaint`, plants the props; chests get their loot as
  stacks, `lootSlots`); `game.village` holds the editor's numbers. `cellarDoor` is a flat prop in the kit (a trapdoor with an
  iron ring). `node tools/visual/villages.js [seed] [archetypes] [zoom] [wealth]` renders one village of each archetype (or of those named).
  **Big places and bigger houses (2026-10-13, for the big trials; `docs/destruction.md` section 9):** two more archetypes, **`great`** (Great village: a log hall, a full ring and a **second ring** of houses, 17 to 21 buildings inside a ring of stakes, 34 to 44 people) and **`bigtown`** (Great town: the same with a church and two stores inside a town wall, lowland materials). `A.full` leaves no ring slot empty; **`A.outer`** is the second ring (after the outbuildings: a row behind the hall with doors south, a row before the gate, a column either side with doors to the middle, a lane of `gap + 1` from the first ring, the way in from the gate and both places a back gate may lie kept open). **Nothing plans them into a world**: a page asks with **`Village.plan(env, { swap: { town: 'bigtown', seat: 'great', village: 'great' }, G })`** (the plain archetype if the island has no room). **`DEF.houseK`** (1) multiplies every building's inside (`size(id)`), the yard by half of it and the site by 0.8 of it (`siteFor(arch, G)`). **A ring of stakes has gates of a sensible width** (about three tiles for the gate, two and a half for the back one: `gapA`, `gapB` by the ring's size; they were a ninth of the ring, nine tiles in a big place), says where they are (`V.fence.gateAt`, `backAt`), and `garrison` stands two men inside each. `node tools/visual/bigplace.js [arch] [houseK] [seed] [wealth]` renders one place large and prints what is in it.
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
- `docs/the-beginning.md` (**a proposal, 2026-10-12**; Robin: make the beginning more immersive, "kid survives raid then works
  for revenge"): three ways to tell it (the place knows you; a played memory at the burnt hall; a prologue), who the hero is
  and how they came to the wreck, what revenge means in play (Ragnar Ironside as the first legendary Viking, the ones who went
  with him, the ones taken as thralls, the ring), what the memory would take to build, and six questions for Robin. **Nothing
  of it is decided or built.**
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
- `docs/boats.md` (**a study, 2026-10-13**; Robin: re-evaluate the boat and the shipyard: boats big enough for several rowers,
  more customisable yet functional, or a few good designs with parts and colours): what is built, the challenges (the grid
  is the hull's length and a seat a cell, the free-form rules fight every new part, the shape changes nothing of the
  handling, cargo has no shape, forty parts by hand), three ways (grow the free-form yard; a few designs with choices of
  look; the designs as the hull and the yard for the fitting out), the recommendation (the third, with the second's
  choices) and five questions. **Nothing of it is decided or built.**
- `docs/art-direction.md` (**decided 2026-10-07**, Robin: the flat look felt like a mobile game): **the ink of Egerkrans, the light of
  Bauer**. One colour key per scene with one hot accent; shadows cooler and bluer than the light; an earth-and-bone palette; a
  hand-made warm brown-black line, thin toward the light and heavy on the shadow side; figures whole (two-pass outline); one sun
  upper left; grain in every fill; lean figures; trolls Bauer's. `docs/reference/` holds the board (Bauer and Kittelsen, public
  domain) and notes on Egerkrans pages from Robin's own book (the photos stay local). In the kit it is **`look: 3`** (`STYLE_INK`,
  `grain`): see "World look and props".
- `docs/battle-plan.md` (**a plan, 2026-10-12**; Robin: Blender the hirdmen and other humans, then fight one, two, two with
  one beside you, five against five, a town full, the raid, fixing bugs at every rung): where the code stands (the people
  are the last drawn figures; guards fight like boars; the hird never fights; **the engine has no sides and no
  way-finding**), people as **one neutral body with cropped layers and colours laid on at draw time** so every look shares
  one set of sheets, the clips to fetch from Mixamo (a sitting with Robin signed in), a fourth enemy kind (the soldier:
  his weapon's own `PROFILES`, a shield, yielding), slots for more than one attacker, friends, groups and heart, a nav
  grid from the building data, the town's answer to noise, the raid as "how much you dare to take", a test scene
  `?scene=battle`, `tests/battle.js`, a gate for every rung, and nine questions for Robin. **Every rung is built** (its section 13,
  "How it went", says what each found); the raid, rung 6, as far as a script can judge it: Robin has not played any of it.
- `docs/ui-review.md` (2026-10-12; Robin: look through every menu, board and bar for function, looks and sense): what was
  looked at, what was found broken and fixed (`docs/ui-review.jpg`, before and after), and **what is proposed and waits for
  Robin**: C for making by hand, one rule for everything E does, one number for a weapon, tabs on the Building board, the
  map showing only what has been seen, a book typeface (`docs/ui-type.jpg`), the HUD's three corners and the map in the art
  direction. Read it before touching a board.
- `docs/lighting.md` (2026-10-12): how similar games light a 2D world, the nine techniques tried here as switches, the verdict on
  each, what was not tried and why, and the sources. Read it before touching the night or the fires.
- `docs/moving-to-blender.md` (**decided 2026-10-09, Robin: the graphics move to Blender models**): what moves (characters, creatures, later
  some props), what stays in code (ground, water, building, vessels, UI), the order of work (foundations: `src/sprites.js`, a model
  manifest and sheet budget, things in the hand as layers; then the hero finished, people, trolls, animals, props where needed), the
  decisions for Robin and a status table to keep up to date. Read it before modelling anything.
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
  **The things in the hand (2026-10-09, Robin: weapons and tools from Blender too):** `art/build/items_build.py` models the sword,
  axe, pick, knife, club, seax, spear, rod and bow as low-poly parts in the Gear collection of `hero2_mixamo.blend`, bone-parented to
  the right forearm (the bow to the left) with the fist as origin (`GRIP` 8.5 cm along the forearm); each kind is two layers,
  `<kind>Wood` (haft, grip, stave) and `<kind>Metal` (head, blade, guard, in a neutral grey the game tints by the material), so one
  render serves every material. **The grip axis is the forearm's own +Y** (the blade continues the arm, the way Mixamo's sword and
  axe clips hold a weapon; chosen from a test of all six axes, `probe_grip.py`), the pommel toward the elbow, a head set off the
  haft toward +Z (up when the axe is raised, down as the blow lands); the bow alone stands across the arm on Z. `render.py` takes
  `+axe` (the body and that gear together, not a holdout) for checking, and writes every animation's **hands** (the two wrists per
  direction and frame: render pixels and depth) into meta.json; `tools/sprites.js` carries them into the sheet's numbers and packs
  a layer only for the animations it was rendered for. `npm run art:items` builds the items, renders their layers for the clips
  they show in (idle, walk, run, hit, and the slashes, chop and mine or the bow's draw and shot), merges them into the hero's render
  (`items_merge.py`) and packs; `npm run art:icons` renders each kind alone, laid on its side from a nearly level camera, as
  `assets/sprites/items/<kind>_wood.png` and `_metal.png` (`items_icons.py`), which the build inlines as `__ICONS__` and `Items.icon`
  draws (`Items.setIcons`, the metal tinted by the material, laid diagonally in the slot; the drawn icon is the fallback).
  **In the game** the thing in the hand is the hero's layers (`handLayers`: the kind of the Fight or Gather bar's hand slot, its
  metal tinted `Items.MATS[mat].face`; nothing while carrying the chest or with the torch lit), in the Combat Arena the weapon panel's
  kinds (`arenaLayers`), in the Art Editor's Models tab the **In the hand** chooser. `Sprites.draw` takes a layer as a name or
  `{ layer, tint }` (`tinted`: the sheet recoloured once per tint) and `Sprites.hand(H, pk, face, which, scale)` gives a hand's
  offset from the feet for a drawn frame. The character panel draws the Blender hero with the thing in hand too. Items are now a
  kind and a material: the size, twist and curl of the old drawn items no longer show on the hero.
  **The hero's shield (2026-10-13, Robin: "you need to create a shield and implement it").** `art/build/shield_build.py`
  puts a Viking round shield on the left forearm of `hero2_mixamo.blend` (0.31 m across the radius, the people's size: five
  boards with seams, a rawhide rim, an iron boss on its flange) as **three layers**, each a hole under the others
  (`o['under'] = 'shield'`): **`shieldRim`** (what is never coloured: the back, the rim, the boss, the seams),
  **`shieldFace`** (near white: **the game multiplies a colour in**) and **`shieldMark`** (two opposite quarters, for a
  second colour: the device of a painted shield, as on the item's icon). And **two clips**, made by aiming the arm's bones
  at directions in the world as the people's `block` is: **`block`** (from the idle's stance the left arm brings the shield
  across; six frames) and **`block_walk`** (the walk's own frames with the arm held across: a man with his shield up walks
  at about half his pace, and in the idle's stance he slid). `node tools/shieldrender.js [jobs at once] [--norender]`
  renders the shield's layers for idle, walk, run, both slashes, the hit and the block, and the two new clips for the body
  and for what the other hand may hold (sword, club, axe, knife, bow), four Blender processes at a time, each into its own
  folder (`art/render/shield_a` to `_h`; a frame on disk is kept); copies the frames into `art/render/hero2_mixamo` and
  writes the new layers and clips into its numbers (so a full pack still holds them); and packs **only the new sheets**:
  **`node tools/sprites.js <name> <in> <out> --only shieldRim,shieldFace,block,...`** packs every sheet whose layer or clip
  is named into a set that is already packed, with the frame and anchor the set has (a pixel outside it is flagged `!!`).
  **A layer packed that way lies in a box of its own, cut to its pixels** (`anims[clip].boxes[layer]` = `[x, y, w, h]`: the
  box's corner in the clip's frame and its size, at 1x, on whole pixels; `Sprites.draw` and the Art Editor's sheet view
  place it; the body is always the whole frame): a shield is a fifth of the frame, and a sheet of a hundred full idle
  frames is 86 MB once the browser has decoded it. The forty-two new sheets are 184 MB if every one were decoded, against
  557 in full frames. (The hero's older weapon layers are still full frames: packing them again with `--only` would cut
  them the same way.)
  The full pack no longer holds every frame in memory either (twenty thousand frames did not fit: each is read to be
  measured and read again to be packed) and writes the set's crop box (`box`) into its numbers. **`npm run art:shield`**
  does the build, the renders, the merge and the pack: 5,472 frames, 42 new sheets, 8.3 MB (the hero's set is now 44 MB
  on disk). **Run it again after `art:mixamo`** (which makes the blend anew; `art:items` and `art:people` leave the shield
  alone). **In `src/sprites.js`:** `tick` eases `H.blk` (the guard up in an eighth of a second, down a little slower) and
  `pick` plays `block` by it while he stands and `block_walk` while he walks (after the attack, a one-shot clip and the
  hit; before sitting and walking); a layer `{ layer, tint, mul: true }` has its colour **multiplied in, a frame at a
  time** (`mulTo`: a whole idle sheet recoloured, as `tinted` does for a weapon's metal, is a canvas of twenty million
  pixels); **`Sprites.shieldInto(layers, M, face, { face, mark })`** puts the three layers among a hero's: over the thing
  in his right hand when his left side is toward us (he faces west, or us), under it when it is the far side
  (`attach` now hands the facing to `opts.layers(face)`); `SHIELD_WOOD`, `SHIELD_MARK`, `tintedMul` (a whole sheet, for an
  editor's sheet view). The rule and the game's side are under "Fighting men" ("The hero's shield").
  `docs/hero-shield.jpg`. **Seen on the way:** the block's weapon layers were rendered the new way (a hole cut by
  material, so nothing shows through the hand), the hero's older weapon layers the old way, so a sword's grip loses a few
  pixels as the guard comes up. **The seax, the spear and the Dane axe are in his hand since 2026-10-13** (Robin: "when I
  tried equipping some weapons it doesn't seem like it gets equipped": those three had no layers, so his hand was empty):
  `items_build.py` has `build_greataxe` (the people's Dane axe), and **`node tools/shieldrender.js 3 --hand seax,spear,greataxe`**
  renders a kind's Wood and Metal layers for the fighting clips into `art/render/hand_<kind>`, merges and packs only those
  (`--only`). A spear and a Dane axe at full reach are cut by the 160 px frame, as noted below.
  **The art studio's hero and weapons (2026-10-14; from the other session, "Survival Crafting game art design", in
  `C:\dev\SG Art\out\hero\`, its `HANDOFF.md` and `NOTES.md`; Robin approved them there and asked for them in the game).**
  Dropped in as sheets, nothing rendered here: `assets/sprites/hero2-mixamo/` (the same 20 layers and 20 clips, the frame
  164 by 164, the death's own frame: no code changed) and `assets/sprites/items/` (the bag icons re-cut to fill their
  squares, and `greataxe_*` new), with the studio's `art/build/toon.py`, `hero2_build.py`, `items_build.py` and `rack.py`
  (the weapon rack and the icon cut) so the next render reproduces it. What it is: the same body and clips with **a painted
  face that has life** (almond eyes with catchlights, slanted brows, a nose shadow, cheeks, a moustache and mouth), a fringe,
  ears, the beard at the jaw, **a lit side** (`toon.py`'s sun 3.0, was 1.15, at which no surface passed the cel's light
  step; the palette taken down a tenth to keep the mean), and **every thing in the hand rebuilt from a Viking outline** (a
  sword with a fuller and a three-lobed pommel, the hilt's bronze in the Wood layer so the metal tint colours the blade
  alone; a bearded axe; the Dane axe; a leaf-bladed spear; a broken-back seax and knife; a root club; a one-pointed pick; a
  longbow), rendered on every fighting clip. **To know:** `toon.py` is shared, so **everything rendered after this gets a lit
  side** and bright base colours want taking down about 15 percent (done by the studio for the hero and the four beasts,
  not the rest), and **the people share the hero's head**: until `npm run art:people` is run they stand beside the lit hero
  with living eyes as flat figures with the old face. Also approved and ready in `C:\dev\SG Art\out\`: `beasts/` (boar,
  deer, moose, bear, lit) and `redesign/` (the huldra, Näcken, the draugr, a new troll Trollmor), not dropped in.
  **The animals (2026-10-11, Robin: the boar, the deer, then the wolf, eight directions; no Mixamo for four legs):**
  `art/build/quad_build.py -- <boar|deer|wolf>` models, rigs and animates a four-legged animal by script and saves
  `art/source/<name>.blend`. **One rig for every species:** `body` (bob, pitch, roll), `hips` and `chest` (the spine flexes between
  them), `neck`, `head`, `tail`, and four legs of three bones (`hL_up`, `hL_lo`, `hL_ft`, `fL_...`, `...R`). The animal faces -Y. A
  species is a `SPECS` entry: a hind and a front leg's joints in the side view, the torso as rings along the spine, pivots, neck,
  head and tail lines, colours and leg radii. The torso is one lofted mesh weighted between hips and chest by where a ring lies;
  everything else is rigid parts on one bone (cones, balls, the boar's bristle ridge and tusks, the stag's antlers, the wolf's ruff
  and brush). **The clips are baked on every frame from functions of the phase**, not keyed pose by pose: a foot follows a path
  (planted and sliding back in the stance, lifted and carried forward in the swing; `step`, `WALK_OFF`, `RUN_OFF`, `GAIT`) and a
  two-bone solver in the leg's own plane finds the upper and lower leg (`solve`: a hoof given in the world, in the body's space, or
  plain turns), so feet stay planted through a crouch, a pitch or a bob; a rotation about a world axis becomes a bone's own by
  conjugating with its rest matrix (`set_rot`), so no axis is guessed. Clips: `idle`, `walk` (four-beat), `run` (a gallop with the
  spine gathering and stretching), `windup` (the boar scrapes a hoof with its head down; the wolf sinks into a crouch), `attack` (the
  boar's charge is the gallop with the head low, looped; the wolf's is a leap), `hit`, `death` (a stagger, then over onto its side);
  the deer has no windup or attack. **Bright base colours:** a flank facing the camera takes the cel's shadow tone, so the bases are
  lighter than the animal should read. Rendered at `--size 224 --ortho 2.828` (the hero's pixels a metre in a bigger frame, so a
  stag's antlers and a leap fit) in eight directions; `npm run art:boar`, `art:deer`, `art:wolf`, `art:beasts`; about 4.5 MB of sheets
  each. `tools/visual/beastsheet.js <render dir> <out.png>` is the contact sheet looked at before packing; `tools/visual/beasts.js`
  puts the packed animals on the starter island beside the hero (beasts.png). A rig may name points to export per frame
  (`rig['marks']`: the wolf's `eye.L,eye.R`), which `render.py` writes where the hero's hands go.
  **In the game:** `Sprites.beast(c, H, e, K, opts)` draws an enemy from its kind's sheets and `Combat.api.enemySprite(c, e)` is the
  engine's hook at the top of `drawEnemy` (true means drawn). The clip follows the engine: `death` by `e.deadT` (a sprite beast lies
  1.5 s, `e.deadFor`, fading at the end), `windup` and `attack` in those states (looped for the boar, spread over the state for the
  wolf: `BEAST_OPT`), `hit` while the flash is fresh or it is stunned, otherwise idle, walk or run by its **real speed** (kept on
  `e._bs`, with a little hold between gaits), the heading eased; the flash is a white-tinted copy over it, the cast shadow the
  hero's, and the wolf's eyes land on `e.eyes` for the night glow. The game and the Combat Arena load `boar`, `deer` and `wolf`
  (`BEASTS`, `ARENA_BEASTS` by `e.kind` and `e.kindA`); any of them is still drawn
  until its sheets have loaded. The Art Editor's Models tab lists the animals too (walk one about; J plays the attack, K the windup).
  **Animal counts scale with an island's area** (`animalN(k, isle)`: the table's numbers were tuned for islands of 60 and 230 tiles).
  The workbench server's port may be taken by another chat: `.claude/launch.json` has `workbench-alt` on 8766.
  **The bear, the moose and the adder (2026-10-11, Robin: those three next):** `bear` and `moose` are two more `SPECS` on the same rig.
  The bear has a hump, a pale muzzle, round ears, flat paws with claws; its windup **rears onto the hind legs** with the forepaws
  raised and its attack comes down with both. The bull moose is tall on pale legs with a hump and a mane, a drooping nose, a bell
  under the chin and palmate antlers (a flat blade with tines); its windup drops the antlers and stamps, its attack drives them
  forward and throws them up. Bigger frames at the same pixels a metre: the bear `--size 280 --ortho 3.535` (9 MB of sheets), the
  moose `--size 320 --ortho 4.04` (17 MB). **The adder has its own script, `art/build/snake_build.py`:** a chain of sixteen bones
  from the tail to the head and a tongue bone; the body one lofted tube with a flat pale belly, each ring shared by the two bones it
  lies on, a dark lozenge on every segment left and right in turn (the zigzag), a broad flat head with red eyes and a forked tongue.
  A clip gives every segment a heading, a rise and a roll; the segments are laid end to end (it never stretches), a chosen stretch
  of the body is held where it lies, and each bone gets the turn from its parent. idle (a loose S, the tongue flicking), walk and
  run (a travelling wave), windup (the front third stands up and folds back into an S), attack (the S thrown straight), hit, death
  (it writhes and rolls belly up). 1.5 m long, twice a real adder, so it reads; `--size 176 --ortho 2.222`, 2 MB. `npm run art:bear`,
  `art:moose`, `art:snake`. All six animals of the first biome are now sheets in the game and the Combat Arena.
  **The trolls (2026-10-12, Robin: the trolls after the animals, and two new ones from scratch, horrifyingly evil and scary):**
  `art/build/troll_build.py -- <boulder|forest|maw|three>` models, rigs and animates a troll by script (no Mixamo: Robin was away
  for the rigging) and saves `art/source/troll_<kind>.blend`. **One rig for all four**, facing -Y: `body` (the pelvis: place,
  pitch, roll, yaw), `spine`, `chest`, `neck`, `head`, `jaw`, `tail`, two arms and two legs of three bones (`aL_up`, `aL_lo`,
  `aL_ft`, `lL_...`), and for the three-headed one `neckL`, `headL`, `jawL`, `neckR`, `headR`, `jawR`. A kind is a `SPECS` entry
  (the leg and arm joints in the side view, the pivots, the neck, head and jaw lines, colours, the walk's numbers, `knuckle`,
  `hs` the head's scale about its base) and a `build_<kind>()` that lays rigid low-poly parts on single bones (`cone`, `ball`,
  `hang` for hair, manes, kelp and beards, `limb`, `hand`, `foot`). Posing is the animals': feet (and a knuckle-walker's hands)
  follow a planted path and the two-bone solver finds the limb; arms in the air are turned by angles (`('fk', swing, out, bend,
  round, wrist)`). Clips: `idle`, `walk`, `windup` (the right arm drawn far back while the body winds), `attack` (the sweep across
  at arm's length), `hit`, `shield` (an arm thrown up before the eyes, the head turned away), `death` (the knees go and it comes
  down on its face). The eyes are exported as marks for the glow in the dark.
  **The four:** the **mountain troll** after Bauer (`boulder`: a boulder under a hump, a mane to the ground, moss, stones and a
  birch sapling on him, the head hung low in front with one heavy brow, amber eyes, a drooping nose, tusks, a beard and beads; he
  walks on his knuckles); the **forest troll** after Kittelsen (`forest`: gaunt, bark-coloured, a branch of a nose, twig fingers,
  a crown of twigs with a fir sapling). **The two new ones** (cards in `docs/beasts.md`, suggestions until Robin decides where
  they live): **the Gape** (`maw`, Gapet: a drowned thing of the sea caves that is nearly all mouth; the whole top of it lifts
  like a lid on two rows of needle teeth and red gums, one great bloodshot eye with a slit pupil under a heavy lid, the other
  socket torn shut, kelp down its back, spines, barnacles, hooked arms, and the bones of an arm hanging between its teeth; its
  windup sits back with the lid all the way up and its attack is a lunge and a bite) and the **three-headed troll** (`three`,
  Trehodet, the many-headed troll of the folk tales, starved: a ribcage on stilts, a rope of skulls, bone claws and blood to the
  elbows, and three heads on three necks that never look the same way: a skull with red pinpoints in the sockets, a hag hung low
  with her jaw unhinged and hair to the ground, and a small shrivelled one sewn shut that screams).
  **Sheets at three quarters of the animals' pixels a metre** so four big creatures stay affordable: `--size 428 --ortho 7.2`,
  and `tools/sprites.js <name> <in> <out> 1.333` writes `scale` into the sheet's numbers, which `Sprites.draw` and `Sprites.beast`
  multiply in (a troll's line is a little heavier than an animal's, which suits it). `npm run art:troll:boulder` (`:forest`,
  `:maw`, `:three`), `npm run art:trolls`; `node tools/visual/trollsheet.js` puts all four on the island beside the hero
  (trolls3d.png). **In the game the cave troll is the boulder troll's sheets** (`BEAST_OPT.troll.sheet`): `Sprites.beast` takes
  `clip` and `clipK` (the page asks for a clip: `shield` while `e.holdT` runs), `tint` (the troll turned to stone is the shield
  pose under a grey tint) and `deadFor` (he lies three seconds). **The Combat Arena** has buttons for the moose, the deer and all
  four trolls (`trollForest`, `trollMaw`, `trollThree` in `ANIMALS` with their numbers; the Gape's attack is a lunge,
  `ATTACKS.trollMaw`), and its animals fight their own way again (`atk` was asked of a type name that no longer exists). The two
  new trolls and the forest troll are **not spawned in the game**.
  **The four people-shaped vasen (2026-10-12, Robin: make the draugr, the huldra, Nacken and the bysen in Blender first, the
  mechanics after):** four more kinds of `troll_build.py` (`-- draugr|huldra|nacken|bysen`, saved as `art/source/<kind>.blend`)
  on the same rig, from `person(col, ...)`: the hero's build (1.8 m, a big head) and `body_of` (pelvis, waist, chest, neck, head,
  mitten hands, two-part limbs). Their own clips (`p_idle`, `p_walk`, `p_hit`; a kind lists its `clips`), and **prop bones
  switched by scale** (`pbones`, `sdefault`, a clip's `scale`: a thing that is there or not). **Robin's looks:** the **draugr** is
  a man-sized drowned raider: death-blue and bloated under torn mail, a rusted helm with a nasal, kelp in a pale beard, barnacles,
  one staring eye, a rotten round shield with a bite out of it and a pitted sword; he slumps and shambles (`slump`), sweeps the
  sword, and `shield` is his block; eyes exported. The **huldra**: a red dress with gold trim, fair hair in a cap with two long
  locks falling in front and a wreath of flowers, **no tail**; from behind, bark from shoulders to hips and in it **the hollow**,
  black with rot, a ragged rim, bracket fungus, moss; clip `call` (she beckons). **Nacken**: a river-pale man with long wet dark
  hair and a water lily in it, a blue-green tunic in tatters, bark-brown trousers to the calf, barefoot, reeds in his belt, **a
  lyre** (a Viking-age instrument; the fiddle of the tales is later) slung on his back; clip `play`: seated on a mossy stone with
  the lyre in his lap, plucking and swaying. The **bysen**: half the hero's height (`size` 0.5), grey coat, a red woven cap, a big
  pale beard, a little axe; clip `chop` (slowly, at a tree), `hide` (he folds down and **the stump** grows where he stood: an old
  stump with spread roots, rings on its top, moss and one red toadstool the colour of his cap) and `stump` (one frame). `npm run
  art:draugr`, `art:huldra`, `art:nacken`, `art:bysen`, `art:vasen`; `node tools/visual/vasensheet.js` writes vasen.png. They are
  in the Art Editor's Models tab; **nothing in the game spawns them and their mechanics are not decided** (`docs/beasts.md`).
  **The models tried out (2026-10-12, Robin: try every model in the game, fight them, walk as them, fix what is wrong):** all
  fifteen (the hero, six animals, four trolls, the draugr, the huldra, Nacken, the bysen) were fought in the Combat Arena and
  walked about in the Art Editor's Models tab, by script. **Found and fixed:** the two-legged models **died with their legs
  straight up in the air** (the fall now lays the legs out behind and flings the arms past the head and to the side); the
  **Models tab put the hero in the sea** beside its island, so nothing could walk there (`startSpot`: the nearest ground to the
  wreck with dry land all round and nothing solid on it); `Sprites.pick` **threw on a sheet set with no such clip** (it now draws
  nothing); the huldra, Nacken and the bysen **attacked in the arena with no attack to show** (they stand until struck, then
  run: `e.aggro` 1, `e.flee`); the bysen had no death (`deathClip: 'hide'`: he folds into his stump); the draugr read as a
  blue man in a brown cap (grey-blue now, an iron helm with rust on it); the bysen's axe could not be seen; the Gape's kelp hung
  over its sides (down its back only now). The arena has buttons for the four new ones (`ANIMALS.draugr` with a sword sweep,
  `ATTACKS.draugr`; the other three have numbers only). **A trap in the renderer, now closed:** rendering one clip of a model
  rewrote `meta.json` with that clip alone, and the packer then packed a sheet set with nothing else in it. `render.py --keep 1`
  leaves a frame already on disk as it is and writes the numbers for every clip named: to re-render one clip, delete its frames
  and run the model's full command with `--keep 1`. **Driving a page by hand:** the browser pane stops animating when it is
  hidden, so `tools/visual/drive.js` (load it in the page, then reload the page's own HTML with `document.write`) takes over
  `requestAnimationFrame` and the clock: `H2.step(n)` runs n frames, `H2.snap` tiles crops of the canvas into a sheet and
  `H2.part` hands it back as a JPEG.
  **The people (2026-10-13, rung 0 of `docs/battle-plan.md`; Robin: Blender the hirdmen and other humans; one body, with
  layers).** `art/build/people_build.py` makes `art/source/people.blend` from the hero's own file (his parts on Mixamo's
  skeleton, his clips, his things for the hand): **one neutral body** in three collections, `Body` (the head with its face,
  the hands, boots and belt: never coloured), `PartTunic` and `PartLegs` (near white: **the game multiplies the colour in when
  it draws**), and the `Gear` layers: `hairA` (tied back), `hairB` (long, with braids), `hairC` (cropped with a knot),
  `beardA` (short: a shell round the jaw with the chin's bulk), `beardB` (long, tied), `hood`, `cap`, `helm` (a bowl, a brim,
  a nasal), `mail`, `cloak`, `dress` (the apron dress), `shieldRim` and `shieldFace` (on the left forearm; the face takes the
  paint), and the things for the hand (sword, axe, club, seax, spear, bow, and a **Dane axe**, `greataxe`). One clip is made
  there: **`block`** (the left arm brings the shield across; bones aimed at directions in the world). `render.py` knows a
  `Part...` collection as a layer of the body itself and lets gear name other gear that hides it (`under`).
  **A trap in the renderer, closed:** an object's own holdout switch hides the surface behind it but **Freestyle then leaves
  that object out of what can hide a line**, so every line behind a body showed through it (a beard's outline on the back of
  a head, the far arm through the chest, a hair cap's rim across the eyes). `render.py` now holds out by **material**
  (`hold(o, on)`: a Holdout shader swapped in), and the lines are hidden as they should be. The hero's own weapon layers
  were rendered the old way; a re-render would tidy the few lines that show through him.
  **The sheets** (`npm run art:people`: the build, `tools/peoplerender.js` (the layers rendered several Blender processes at
  a time, each with its own numbers file, `render.py --meta`; a frame on disk is kept), `tools/people.js`): 28 layers, 16
  clips (idle 32 frames, idle_look 36, walk 10, run 8, attack1, attack2, chop, mine 10 each, hit 5, death 10, block 3, sit 4,
  pickup 8, interact 6, bow_draw 5, bow_shoot 4), eight directions, 30,984 rendered frames. **Measured before going on, as
  the plan asked:** packed like the hero (a box a clip and layer) they were 62 MB of PNG and 1166 MB if every sheet were
  decoded. So a sheet is now an **atlas**: every frame of every layer trimmed to its own pixels and laid on shelves, the
  numbers four bytes a frame (`anims[clip].rects[layer]`, base64; `Sprites.rectsOf` lays them out again by the same shelf
  rule: keep the two alike), saved as **WebP at quality 88** (a third of the PNG, no difference to be seen at the game's
  size; AVIF from the canvas library lost the skin's colour). **22.8 MB on disk, 324 MB if everything were decoded, and a
  village in sight loads a fraction of it.** The idles are melted between frames like the beasts', and at 16 frames the
  idle showed a second, ghostly weapon between two frames, so it has 32 (and the look-about 36).
  **In the game** (`templates/game.html`: `PEOPLE`, `personLook`, `drawPerson`, `drawFighter`): villagers, Brokk, the hird
  and the guards. The clip comes from what they do: walk, run when they flee, sit, `chop` with an axe at the block and
  `mine` with a mallet at the smithy (`JOB_CLIP`; a hirdman at his work the same, `HIRD_CLIP`), `interact`, the look-about.
  A hirdman gets a style of hair from his name and **your colour as his cloak** (`YOURS`, the hero's red); Brokk is the
  same man made short and broad until he has a body of his own; a child is the body scaled; a bearded man is never put in
  the apron dress. Fire lights them and they throw shadows as the hero does. **Measured in the pane** (software drawing,
  so only the comparison counts): forty people in view cost 15 ms a frame from the sheets and 27 ms as drawn figures.
  **The Art Editor's Models tab** has a **People** panel: roll twelve, choose the clip, what is in the hand and what all
  wear, and walk among them. `node tools/visual/people.js crowd|clips|blows` draws them with the game's own code outside
  a browser (thirty rolled people beside the hero at Robin's size; every clip; the blows frame by frame);
  `tools/visual/peoplelooks.js` puts the raw renders together large, to judge shapes before packing.
  `docs/people-crowd.jpg`, `people-looks.jpg`, `people-village.jpg`, `people-night.jpg`.
  **The death has a frame of its own (2026-10-13, Robin: "when they die, half their body disappear").** A man falling backward ends two metres from where he stood, and the frame every clip was rendered in (160 px, the feet 25 px from its foot) cut him off: in seven of the eight directions the fallen lay with the head and chest gone. The hero's own death was cut the same way (behind the "You have fallen" board). Now: **`render.py --inplace death`** holds the figure over the spot it began on (the whole figure is moved, frame by frame, by what the hips have travelled: a body lies where the man stood, which is also where E lifts him), **`--aim 0.6`** looks lower (room below the feet) and `--size 208 --ortho 2.626` is a bigger frame at the same pixels a metre. Such a clip is rendered into **`<render dir>_own`** with numbers of its own (`tools/peoplerender.js` jobs 8 to 11, `node tools/peoplerender.js 4 8,9,10,11`; the hero: `npm run art:hero:death`), and both packers pack what lies there after the rest with **its own frame and anchor** (`anims[clip].frame`, `.anchor`; `node tools/people.js --own` and `node tools/sprites.js <name> <in> <out> --own` pack only those clips into the sheets there are; a clip whose pixels reach the edge of its own frame is flagged `!!`). `src/sprites.js` draws by the clip's own frame where it has one (`draw`, `beast`, `person`, `hand`). A body on the ground has no long shadow but **the shadow it lies on** (`opts.lying` in `person`; `fighter` sets it). `node tools/visual/people.js dead` draws the dead from all eight sides and the fall frame by frame (`docs/people-dead.jpg`). **Found on the way and not fixed: the same 160 px frame cuts the tips of long things in the hand** (a sword at full reach, a spear, a Dane axe; and a raised arm by a pixel or two) in the people's and the hero's sheets: the weapon layers need rendering in a bigger frame, which wants a frame of its own for a *layer* as well as for a clip.
  **Not done:** the Mixamo sitting
  for the clips a fight and a village still lack (a thrust, a two-handed swing, a stagger, yielding, sweeping, hammering,
  carrying, rowing): the spear is swung like a sword and a job is the nearest clip there is; a fur vest and a fur hat
  (both draw as the plain tunic and the leather cap); the priest, the merchant and the fisherman have no dress of their own.
  **In the Blender Editor (2026-10-09, Robin: fix it so I can try it out):** `npm run art:mixamo:sheets` renders all eighteen clips in
  eight directions with a frame count per clip (`render.py --frames idle=16,walk=12,run=10,...`; `tools/sprites.js` reads each
  animation's count from meta.json) and packs them into `assets/sprites/hero2-mixamo` (one 164 by 164 frame, 22 MB of sheets: the
  frame box holds the death lying down and the hit's step back). The model **"Hero 2 with the Mixamo clips"** walks and runs on the
  starter island and plays its clips on the Clips keys: a clip runs once (`clip` = { name, t0, then }: the bow's draw hands over to
  the shot) and the idle returns; X sits (`seated` keeps the sit idle) and X again stands up. Because the sheets are no longer
  inlined, `tools/build.py` writes their paths and the workbench server serves the repo root.
  **In the game (2026-10-09, first as a trial, since the evening of the same day the hero everywhere):** the game inlines every
  sheet's numbers (`__SPRITES__`) and draws its hero from the sheets through `Sprites.attach` (`src/sprites.js`); the Models tab's
  **Use in the game** picks which model (`game.blenderHero`, `hero2-mixamo` by default). **The clips follow the game's actions:** walk and
  run (Shift) by the engine's `anim.amt` and `sprinting`; the sword's two slashes by the attack's phases (the clip's frames spread
  over the windup, the blow and the recovery from `Combat.api.stepData`, alternating by the combo; fists the same), chop and mine in
  gather mode by the tool in hand (the pick mines, everything else chops), the bow's shot (`fireT` rising plays `bow_shoot` once;
  the engine has no draw phase), the hit (`hurtT`), sitting (`anim.sit`), and the fallen hero (the death clip once, then its last
  frame, pushed from `scene.items` since the engine draws no hero when dead; it lies behind the engine's "You have fallen" banner).
  Nothing else changes: building, the bag, E and the world are the engine's. **Limits of the trial:** no weapon, tool, torch, shield
  or ring is drawn on him (the clips swing empty hands), the pick-up, lid, drink and look-around clips are not wired (the game has no
  such moments), and all eighteen sheets (22 MB) load with the page. Debug: `Combat.api.debug().spr()` (hero, last, clip, deadT,
  pick, draw, img). **Robin's first look (2026-10-09): a bit tall, and the idle "hacky":** the idle was a ten-second clip sampled at
  sixteen frames (1.6 a second), so it is now rendered at **100 frames (10 a second)** (rendered alone into `art/render/mx_idle` and
  merged into the main render folder before packing; `idle=100` in `art:mixamo:sheets`); and the editor's Model panel has a
  **Height** slider (`game.blenderScale`, 0.85 by default: 137 px at 3 px a unit is 46 units, the drawn hero is 39) that the editor
  and the game both draw with (`hscale`, `sprScale`). **The second fit (2026-10-09, Robin: does he look out of place?):** he read as a
  glossy figure on a painted page, so the cel style now has the **props' line weight** (contour 2.6, the calligraphy up to 1.55 on the
  shadow side, the inner line 1.1), a **deeper shadow step** (day shadow 0.54, 0.61, 0.84), the **rim as a hard step** (greater than
  0.55, strength 0.14) instead of a gradient, **grain at 0.16**, and the **height baked into the render** (`--ortho 2.02`: 117 px at
  3 px a unit, the drawn hero's 39 units; the Height slider defaults to 1, 0.85 fits the older sheets), so he is no longer scaled
  down twice. **The cast shadow:** the game and the editor lay the frame's silhouette on the ground as the props' long shadows lie
  (`sprCast`, `sprSilOf`: a sheet tinted once in the shadow hue, drawn through the transform `[1, 0, -0.5, -0.14]` at 0.3, clipped to
  the ground). `node tools/visual/heroseat.js <before dir>` writes heroseat.png, before and after on the island. Played through in the pane: walk, sprint, both slashes, the bow, chop, mine, a hit, sit and stand on a placed
  chair, death and R, the Building board; no console errors. With the model taken back the game is exactly as before.

## Things to know before changing code

- `dist/` is committed. After editing anything in `src/` or `templates/`, rebuild so `dist/` matches.
- Source files are loaded two ways: inlined into a page by the build, and `require`d by Node scripts. Keep both
  working: no ES module syntax, no browser globals at load time. `stylelab.js` needs `global.__mk` for canvases.
- Git on this machine converts line endings (`core.autocrlf` is true), so files in the working tree have CRLF.
  Scripts that search file text for multi-line strings must normalise `\r\n` first. `build.py` writes LF.
- The tests have no assertions. They print values and exit 0 unless something throws, so a green `npm test` proves
  only "no crash". Read the printed lines against their labels and report mismatches. `btest.js` is not in `npm test`.
- **A random test can be played again from a seed.** The fights of `tests/battle.js` draw on `Math.random`, so a rare fault line (`!!`) is gone at the next run, and the handful of fights `npm test` runs show a fault of one fight in a hundred about one run in ten. `RSEED=28 TOWN_SEEDS=138,471,101 node -r ./tools/seedrand.js tests/battle.js town 3` gives `Math.random` a seed; loop over seeds until the line shows, then run that seed again with `TOWN_DBG=1` (it prints every man who stands still, what is round him and what blocks him, who is left when a fight does not end, and who stands in a gate that somebody has waited half a minute at). `MEN='{"wallGap":0}'` tries a number of the men's. **Before judging an engine change, run the same seeds on the code before and after** (a copy of the committed `src/` in a scratch folder: `git show HEAD:src/x.js`), and count fights that never ended, men who stood still and long waits. And **the scripted raids in the page are measured by the same code**: a change to the engine moves their numbers, so run them again last.
- Tests and render scripts write throwaway PNGs into the current directory; `.gitignore` covers PNGs in the root.
- **Test with the sound off (Robin, 2026-10-13: "the sound is on when you are testing stuff. I can't seem to silence the window").** Every page takes **`?mute=1`** (`game.html?scene=battle&mute=1`, `village-editor.html?mute=1`): `tools/build.py` puts a small script before a page's first one that hands out audio contexts whose `destination` is a gain of nothing, so the page runs as it does and makes no sound. `tools/visual/drive.js` does the same for a page it drives. **Open every page with it when testing in the pane**; nothing is stored, so Robin's own play keeps its sound.
- **Driving a page while the pane is shown (2026-10-13).** The page that `document.write` replaces is still alive: its next frame fires once more and hands *its* loop to `H2`, in place of the new page's, and `H2.step` then draws into a canvas that is gone (an empty screen, no error). So: load `drive.js`, wait a tenth of a second, **`H2.drop()`**, and only then write the page again. And a look's sheets are fetched when first asked for: after putting people on the screen let real time pass (`await` a second) before judging them, or they are the old drawn figures.
- **Judge it at Robin's size (2026-10-12, learnt the hard way twice in one day).** The browser pane's canvas is 800 by 500 at 2
  pixels a unit; Robin's is **1200 by 750 at 3 a unit, shown about one and a half times larger again** on Robin's screen, and the
  ground is baked at 2 pixels a unit with the mountains' rock painted at **one**. So a pixel of painted rock is about three
  of that screen's, and a picture that looks fine small (a light, a texture) can look murky or blocky there. Before judging
  anything of light or of painted ground: `resize_window` the pane to 1920 by 1080, reload the page, capture the canvas at
  full size and look at a crop of it, not at a small sheet of tiles.
- **A patch must not put a `//` comment in the middle of a line** (the template's lines are long and hold many statements:
  the comment swallows the rest, and the build is then a syntax error or, worse, silently lacks a statement). End-of-line
  only, or `/* */`. After every build, parse the built pages (`new Function(script)`); it takes a second.
- **Rooms and their solids are rebuilt in two places** since 2026-10-13: when a frame is drawn (`if (bDirty) rebuildRooms()`
  in `scene.items`) and in `ruinTick`. A script that steps the page without pictures (`H2.sim`) used to walk into walls that
  were no longer there, or through none that were.
- **Two page hooks of the engine for working on combat (2026-10-13):** `Combat.api.onLog(ev)` is told of every blow that matters
  to the hero (`ev.k`: `dodged` (a blow during a dash), `parry`, `block` (with `through`, `broke`, `guardBreak`, `stagger`), `hurt`
  (`through`, `guard`, `front`), `hit` (the hero's blow on a foe: `dmg`, `crit`, `blocked`, `broke`, `weak`, `quiet`, `killing`), `kill`),
  and `Combat.api.overlay(c, P, W)` draws over the world under the HUD. `api.parryWindow()` and `api.meleeStep()` (the current
  blow's arc and reach) are there for the same. The Combat Arena uses all four.
- **The combat numbers are one spec (2026-10-15): `Combat.tune(over)`** in `src/combat.js` lays a page's differences over
  `tuneDefaults()` (feel: `WPRE.snappy` fz, pf, kb, `PARRY` shield and bare, `MEN.parryStun`, `TOOL_DMG`; hero: each melee kind's
  `PROFILES` wu, ac, rec, reach, arc, dmg, kb, stag, lunge, st; men: `MEN` hpK, dmg, wu, wuK, slots, gapHero, onHero, joinAfter,
  toMen; beasts: `BEAST_GAME`'s bite and noticing with the art library's health, speed and windup, for boar, boarYoung, deer,
  snake, wolf, moose, bear, troll) and writes every number in place. `tuneDiff(T)` is what differs, `beastNum(kind)` a beast's
  numbers, `tuneBeast(e, kind, { aggro })` dresses one. The game calls `Combat.tune(game.combat)` after `Combat.init` and dresses
  its beasts and its young boars through `tuneBeast`; **change a default in the code by changing `BEAST_GAME`, `PROFILES`, `MEN`
  or `WPRE`**, not the game's `ANIMALS` (its `dmg` and `aggro` are no longer read).
  **Robin's first tuning is the default (2026-10-15, "this feels good"):** `WPRE.snappy.fz` 0.75; the sword wu 0.11, ac 0.4,
  rec 0.2, reach 50, lunge 123; the boar's speed 1.1 (`BEAST_GAME.boar.speed`). **The men are armed from `MAN_PF`**, a copy of
  `PROFILES` taken before any of the hero's tuning: with the sword's tuning the men's swords swung in slow motion (their blow
  is the weapon's ac times `MEN.acK`), so the hero's weapon numbers are the hero's only and the men's levers are `MEN`'s.
  **Found by Robin's test the same day:** a parried man struck again at once, because the soldier's state switch had no case
  for `stunned` and its default sent him back to the chase in one frame; it has one now (he reels with the `hit` clip swaying,
  three stars over his head from `stunStars`, for `MEN.parryStun`, measured 1.2 s with the hit pause). **And the glide:** the
  slash clip is the whole body, so walking under it slid him with still legs. Now a shuffle in the windup (0.1 of a walk),
  none in the blow itself, 0.2 in the recovery, and **moving in the second half of the recovery ends it** (where a chain's next
  blow could begin anyway, so the pace is the same; the walk clip shows at once); **the step into a blow is taken toward a foe**
  within the reach and 60 units, and at nothing it is 0.15 of the lunge (Robin's lunge slid him 35 units at the air).
  **The parry chain (2026-10-15, Robin: "parry even more when fighting... when you hit them after they are dizzy they attack
  and you can parry again; to make combos").** `CHAIN` in `src/combat.js` (`api.chain`): a parried foe **reels through your
  blows** (they no longer end the stun; a man's state stays `stunned`, a beast's heavy blow no longer staggers it out), **pushed
  only `CHAIN.kb` 0.25 as far** so he stays in reach, and **comes out of it swinging at once** (a man: `e.answerT` `CHAIN.answer`
  0.9 s in which he begins a blow at once, wider aligned, past the slots, his guard held back as long; a beast: its next attack
  0.1 s after), so you parry again. **Each parry within `CHAIN.keep` 4.5 s of the last is one more in the chain** (`P.chain`, to
  `CHAIN.max` 4; `chainUp`): the stun grows by `CHAIN.stun` 0.15 of the first each time (`parryStun()`: 1, 1.15, 1.3, 1.45 s) and
  your blows on a reeling foe do 1 + `CHAIN.dmg` 0.1 times the chain (`e.ripK`, set by `stun`). A blow that gets through ends the
  chain. Shown: "PARRY x2" to "x4" in growing gold, the charge's rising tone, stars over the reeling head; the arena's log and
  tally say the chain. **K in the second half of a recovery raises the guard** (as a step ends it). The four numbers are on the
  Tuning panel (the feel of a hit: Chain). **Set by `tests/parry.js`** (in `npm test` at four fights a line; `node tests/parry.js
  40` for more, `CHAIN='{...}'` to try numbers): a parrying bot against a man in leather needs about four parries and 14 s and
  lands four in five blows on a reeling man, six parries against one in mail; a bot that only blocks parries two or three times
  and lands two in five. Tried in the arena by script: the man reeled, came out swinging, the parry caught it, x1 to x3.
- Melee range is not just `reach`: a hit lands when distance <= `reach + enemy.r + 2`, and the player also steps
  forward during the active phase (`lunge`).
- The engine's enemy types are **`beast`** (chase and lunge, every animal), **`brute`** (a lunge, a chain of hits and a spin,
  with a stagger bar; the bear in the Combat Arena), **`shooter`** (stands and shoots) and, since 2026-10-13, **`soldier`** (a man
  with a weapon and perhaps a shield, on one of two sides: see "Fighting men"); `beastAI`, `bruteAI`, `shooterAI`, `soldierAI`
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
  all matte; the random people will be drawn from them later. The Art Editor's Characters tab lists them as Concepts, has Style
  rows (hair, beard, headwear, clothes), Builds, a Matte slider, templates saved in this browser (`herotest.templates`),
  and **"Use as the hero in the game"** (`game.hero2`, which the game sets with `lib.setHero` on load). The steampunk
  eyewear is gone (2026-10-09: from the code too). `node tools/visual/folk.js`
  renders the concepts in four views and a grid of every style to folk.png (`big` for the concepts large).

## People

- **They are Blender sheets since 2026-10-13** (see "The people" under `art/`): what follows about idles and jobs as poses
  is the drawn figure's, which the game now shows only while a person's sheets are loading. Their life (the spots, the
  jobs, the waiting, who watches you) is unchanged; the sheets take the clip from it.
- **Idles and jobs (2026-10-07, Robin: every villager stood the same way with the same bent arm):** `lib.IDLES` (rest, hips, crossed,
  scratch, look, stretch, lean) and `lib.idlePose(F, id, t, dir)` give a pose in the ink figure's pose contract (hand targets `armL`,
  `armR` for the front and back, `near`, `far` for the side, `lx`, `ly`, `turn`); `lib.JOBS` (chop, carry, sweep, hang, fish, smith)
  and `lib.jobPose(F, kind, t, dir)` the pose of a job over time with the thing in hand (`held`: an axe, a bucket, a broom, a rod, a
  hammer, drawn by `lib.figureHeld(c, x, y, dir, F, held)` after the figure); `lib.poseLerp(a, b, k)` blends two poses. `pose.turn` adds
  to `an.turn` in `inkHero`. **In the game** each villager has `idle` ({ id, t, dur, from, blend }: a new idle every three to nine
  seconds, blended over a third of a second from the last pose), `job` ({ kind, t } at a tagged spot, facing it, eight to sixteen
  seconds; one person at a job spot at a time) and `carrying` (after the well, the bucket is carried home at a slower walk; the bob
  is added to the pose); `pickIdle` weights them (a child looks about more). The Village Editor shows the same poses.

- **Villagers and walls (2026-10-13).** A villager finds his way round walls, the fire and the well (`navMove`, the
  village's grid: see "Fighting men"). Two things came of everybody taking the same way: people **keep a step apart**
  (two of a village nearer than 13 units ease apart, the one walking giving way; a spot somebody already stands on is
  reached when you are beside it), and a villager **watches you for three to eight seconds and then has seen enough for
  half a minute** (a hero who stood in the yard used to have the whole village standing round him for good).
- Other people are the hero's figure with their own spec: `lib.makeFigure(spec)` then `lib.figureD(c, x, y, dir, an,
  pose, F)`. `FOLK` in `src/art.js` holds them (`lib.folkSpec(key)`); spec key `beard` adds a beard.
- The first is Brokk, a friendly dwarf smith (dwarfs are from Norse myth). He stands at the home camp in the Sea
  Editor and by the well of the broken village in the game, turns to watch the hero, and E talks to him (a speech
  bubble cycling through a few lines). He does not walk, trade or give tasks yet.

## Fighting men (2026-10-13; `docs/battle-plan.md`, Robin: fight a hirdman, two, two with one beside you, five against five, a town, the raid, fixing the bugs of each before the next)

Everything here is tried in **`game.html?scene=battle`** and by `tests/battle.js`. The men themselves are only in that
test scene (the towns that would hold them are not spawned in the real game), **but the way-finding of rung 5 is in every
village of the real game**: villagers and beasts no longer walk through walls. **Robin has not played it: how hard a man
should be was left as "not sure, try how it feels", so the numbers below are a first setting, not a decision.**

- **Sides** (`src/combat.js`). Every fighter has `e.side`: 0 is against the hero (every beast, a town's men), 1 is with him
  (his own). The hero's blows, arrows and auto-aim pass over his friends; `eachFoe(e, fn)` gives a man everyone of the other
  side (the hero counts as side 1). **Beasts are as they were: they know only the hero** (my choice: Robin did not answer
  whether beasts and men fight). `damageEnemy(e, dmg, ang, kb, stag, kind, src)` takes the man whose blow it is (`src`;
  none is the hero): a blow between men makes no pause for the hero, no number and a quieter mark, and a kill by a man is
  not the hero's (`e.killer`). `W.heroHit` is what the hero struck last.
- **The soldier** (`Combat.soldier(o)`, `armMan(e, o)`: `o` = `{ side, wpn: { kind, mat }, shield, armor, hp, strength,
  wits, loyal, nerve, x, y, post }`; a page dresses him in `api.dressMan(e, o)`). `MEN` (`api.men`) holds every number. He
  closes to his weapon's reach and keeps it (`keep`), circles, and **shows his blow coming**: a windup of 0.3 s plus 2.4
  times his weapon's own (a sword 0.42 s, a Dane axe 0.88), a red line on the ground when it is meant for the hero and a
  wedge for a wide sweep. The blow is his weapon's `PROFILES` (arc, reach, the one thing each kind has); `strike(e)` lands
  it on every foe in it (a thrust on the nearest only, a spear on all in its line). Damage: `MEN.dmg` 12 times the kind's
  (`MEN.wdmg`: seax 0.6 to Dane axe 2), the metal and his strength; a fifth of that when it lands on a man (`MEN.toMen`:
  men's health is on the beasts' scale, the hero's is 100). Sometimes a second, harder blow follows (`chainLeft`).
- **His shield** is not a wall and not a meter. `e.guard` is the time it stays up, and it covers 1.7 radians to each side
  of where he faces. It comes up **against a blow he sees coming** if he is quick enough (`e.react`: 0.36 s for a dull man
  to 0.07 for a sharp one, counted from the blow's beginning, so a quick weapon beats a slow man), it is **kept up by a wary
  man while you stand in his reach and he is not striking** (`e.wary`, rolled by his wits each time it comes down), and a
  man who has been hit **covers up or hops back** instead of standing to be hit again. It is up for 1.7 s at most
  (`guardMax`), then rests. On the shield a light blow does 0.3 and a heavy one 0.55; **an axe breaks the guard** (the
  shield drops, he staggers), **a club's heavy blow staggers through it**, a parry by the hero opens him for 1.3 s, and
  **a blow he has stopped he answers** with a quicker one. His own blow drops his shield: the time to hit him is while he
  strikes and while he recovers (a blow on a man recovering does half again as much, as on any beast).
- **What his weapons do to the hero's shield** (`hitFlags` in `hurtPlayer`): an axe gets 0.4 through instead of 0.12 and
  costs nearly twice the stamina to hold; a club knocks the guard down for a moment; a Dane axe cannot be parried (it is a
  heavy blow) and is to be stepped out of. So each of his weapons asks something else of you.
- **The hero's shield (2026-10-13, Robin: "you need to create a shield and implement it"). My reading of it, not a ruling
  of Robin's: where the code decides something, it is marked mine.** Until now K (or the right mouse button) raised a
  guard as strong with nothing on the arm as with a shield there (the engine's `S.shield` was always on), the shield in
  the gear slot only turned a tenth of a blow aside, and the Blender hero showed neither a shield nor a guard. Now:
  **The shield you wear is the strong guard.** The engine asks `shielded()`: a page's `api.shield()` if it has one, the
  arena's Shield switch otherwise (so the tests and the editors are as they were). With a shield: the guard covers 1.9
  radians to each side, 0.12 of a light blow and 0.4 of a heavy one get through, a blocked blow costs 10 stamina, the
  parry's moment is 0.22 s, **and a bowman's arrow is stopped**. Without: K still fends with whatever he holds (1.4
  radians, 0.55 and 0.8 through, 18 stamina, 0.12 s) **and stops no arrow** (`hurtPlayer`: a `proj` from a soldier passes
  a guard with no shield). So the first wooden shield (5 wood and a leather, known from the first hide) is worth making:
  the unprepared state is the weak baseline, the shield the buff. **In the game** `shieldHeld()` says it is on the arm:
  one is worn (`equip.shield`), he is in Fight mode, nothing is on his shoulder, **and the thing in his hand leaves the
  other arm free: not a bow, not a Dane axe** (`TWO_HANDS`; mine). **A lit torch does not take it away** (mine: nothing
  in his hands is drawn while the torch burns, as before, and the troll's cave was tuned with a full guard and a torch).
  **Drawn** (`handLayers(face)`, `shieldPaint()`): on his left arm whenever his weapon is out (so not while gathering,
  building, carrying, or with the blade put away in a place at peace), across his body with the block clip while K is
  held, held across through a walk. **A wooden shield is bare boards; any other is painted: your colour (`YOURS`)
  quartered with bone.** Without a shield K brings the bare forearm up. The character panel shows it; the shield's card
  has a second line ("Raised, it stops 88% of a blow") and the Stats page a **Guard** row (what a raised guard stops,
  with and without). **Robin liked the drawn hero's shield showing only when used** (2026-10-05): the Admin board has
  **"Shield only when raised"** (`ADMIN.shieldRaised`) for that; on the arm is the default because the men beside him
  carry theirs so (mine). The Combat Arena's Shield switch puts a wooden one on his arm; the Art Editor's Models tab has
  **Shield** and **Painted shield** among the hero's gear. Debug: `Combat.api.debug().shield()` (worn, held, paint, blk,
  last, layers). **Checked:** `node tests/battle.js raid` (its last line: against 10, the hero in leather, an arrow costs
  0.7 behind a shield and 6 with none; a thing thrown at him 0.7 and 3.3); the same seeded town fights give the same
  lines on the engine before and after (a test sets no `api.shield`); in the pane at 1200 by 750: the wooden and the
  painted shield in eight directions, the guard standing and walking, the bare arm, the Dane axe (no shield), a fight
  with a hirdman (a blow of his on the shield: 3). **Not done:** a shield slung on the back when the weapon is away; a
  parry with the weapon as the shieldless guard's own clip; the shield in the hero's cast shadow; whether a torch should
  cost the shield arm (`docs/idea-bank.md`).
- **The weapons and tools pass (2026-10-13, Robin's list).** **The pace of a blow:** the hero hit "comically fast, spasmic":
  a sword blow was 0.26 s from the press to the carry (windup 0.05). Now a sword blow is about 0.55 s (`PROFILES` and `STEPS`
  in `src/combat.js`: windup 0.16, blow 0.11, recovery 0.28; the chain's last blow 0.24, 0.14, 0.44), an axe 0.68, a club
  0.78, a seax 0.36, a spear 0.62, the Dane axe 1.2; the windup grew most, so a blow is seen coming and the slash clip has
  time to play. **The men's own windup is set apart** (`MEN.wu` 0.12, `wuK` 2.0: the same seconds as before, a sword 0.44 s
  to a Dane axe 0.92) so they did not slow with him. **The numbers shown:** a blow of the hero's shows as the engine's damage
  times **`SHOW` 10**, whole (`api.SHOW`; `num` in `damageEnemy`; the page's `worldDmg`, the item cards and the Stats page
  use it): an iron sword on a man shows 10 to 16, a crit 15 to 24; the health behind it is unchanged (Robin: at least
  around 10, the decimals looked weird). A tool's number on a tree is whole too. **Tools bite beasts and men a little** in
  gather mode (`TOOL_DMG` 0.5 of what the same thing would do as a weapon, a flinch, no lunge: an iron axe shows about 6, a
  knife 3; Robin: tools should also do damage, but low). **Where the fights stand after the slower blows** (`npm test`, 12
  fights a line): one man in leather: the tapper 0% (was 36), the careful bot 100% with 45 left (75), the skilled 100% with
  49 (93); two axes: the careful bot 58% (61), the skilled 58% (100); the careful bot with four friends against five 0% (was
  83), the skilled 50% (95). **The slower hero is a weaker hero against men, and the numbers in `MEN` were tuned to the fast
  one:** which of them to move is Robin's call once he has felt the new pace (the men's damage `MEN.dmg`, their `slots`,
  `gapHero`). The one-man and five-against-five lines of the test say so in their numbers, not as faults. **(Moved the same
  night: see the next bullet, "The blow, the men and the weight".)**
- **The blow, the men and the weight (2026-10-13 into 14; Robin: "Do 1, 3 and 8 / Do extensive testing" of the combat ladder I
  proposed: the feel of one blow, the men retuned to the slower hero, hit weight and sound). Robin has not played any of it: every
  number is mine, measured, not felt.**
  **Rung 1, the feel of one blow, measured.** `tests/blows.js` (in `npm test`) swings every melee weapon of the hero (iron) at a man
  who stands still and watches the engine: press to the landing, the chain when the button is pressed on (hits in 4 s, the beats
  between, hits a minute), what a blow does to a man in leather and how many put him down, the reach with the step into it, the
  half-angle a blow still lands at, the push, the breath; then the men's blows (their windup, their blow on the hero in leather
  and in cloth, on a man). A `!!` line is a contradiction of `docs/weapons.md` (a seax reaching as far as a sword, a Dane axe quicker
  than an axe, the weapons not striking in the order seax, sword, axe, club, Dane axe when pressed on). The test's own traps, met
  on the way: the engine chains only on a press (a held button swings on in gather mode alone), the auto-aim turns the hero to
  the man whatever the angle (`D.S.aim = 'facing'`: `Combat.dbg()` hands out `S` now), a held man's knockback is zeroed and a
  live one walks (the push is measured on a man at his post who has noticed nothing, 0.2 s after the hit, before he hops back),
  and crits made the numbers wander (`S.crit` 0 in the test). **What it says now** (land: press to the first hit; a minute:
  hits a minute pressing; blows: to put down a man of 22.5 in leather; reach: with the step; arc: the half-angle):

  | weapon | land | a minute | blows | reach (data) | arc | push | a whole blow, and the chain's last |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | sword | 167 ms | 120 | 18 | 52 (34) | 72 | 9 | 0.55 s, 1.08 |
  | axe | 217 | 90 | 14 | 50 (32) | 76 | 13 | 0.68, 1.35 |
  | club | 267 | 60 | 15 | 46 (30) | 52 | 13 | 0.77, 1.54 |
  | seax | 117 | 150 | 25 | 38 (25) | 36 | 4 | 0.36, 0.70 |
  | spear | 183 | 90 | 14 | 70 (52) | 20 | 9 | 0.62, 1.22 |
  | Dane axe | 517 | 45 | 9 | 64 (44) | 100 | 15 | 1.28, 2.55 |

  **Changed for it** (`PROFILES` in `src/combat.js`): the **spear steps into its thrust** (`lunge` 70, was 40) and the **Dane axe
  does not carry its man 16 units forward** (`lunge` 60, was 90), so the spear reaches furthest and the Dane axe outreaches the
  axe; the **Dane axe's windup is 0.5 s** (was 0.4: a commitment, half a second to land, 1.3 s before he is free again); and a
  kind that is heavy already (`pf.heavy`) grows only half as much on its last blow (`hv` 0.5 in `stepData0`: its second swing is
  2.5 s, not 2.4 of windup alone). Everything else of the slower blows of 2026-10-13 stands.
  **Rung 3, the men against the slower hero.** The ladder is `node tests/battle.js ladder [n]` (ten lines: the three bots with a
  flint sword against an axe in leather, the careful one against mail, the careful and the skilled with an iron sword against
  two axes, the careful with a friend, the careful and the skilled with four friends against five, five against five with no
  hero) and **`node tools/sweepmen.js [n] '{...}' '{...}'`** runs it once a setting of `MEN` and prints a table (about ten seconds a
  setting at a hundred fights a line). **One lever, `MEN.hpK`** (new, with `MEN.hp` 30 the default a page does not override): a
  scale on the whole of the men's world, every man's health (`armMan`), their blows on each other, a bowman's arrow on a man,
  what a roof does to him (`api.hurt`), so that **only the hero's blows gain on them**: men against men is as it was (the duels
  table, five against five), and the hero puts a man down in three quarters of the blows. **It is 0.75**: a man of 30 is 22.5,
  an iron sword's 18 blows (24 before; a man's own sword puts the hero in leather down in 9). Measured at 200 fights a line:
  the tapper with a flint sword against an axe in leather **51%** (5 before: "one man about even" for a careless player), the
  careful bot 100% with 59 left (43), the skilled 100% with 66; the careful bot against mail 100%; against two axes the careful
  **91%** (52) and the skilled 93%, with a friend 99%; **the careful hero with four friends against five 35% and the skilled
  37%** (18 and 16 before), five against five with no hero 61% (a coin at 100 fights; 42 to 58 over the sweeps). The sweep
  (`MEN.hpK` 0.4 to 1, `dmg` 10, `slots` 1, `gapHero` 1, `onHero` 1, `joinAfter` 12, `onMax` 1, in combinations) found **a
  cliff in the one-man race**: the tapper wins 5% at hpK 1, 47 at 0.75, 66 at 0.7 and 99 at 0.6 (and `dmg` 10 lifts him to 80
  to 95 at any of them), and **the five-fight does not move with any crowd lever** (34 to 58% whatever `onHero`, `slots`,
  `gapHero`, `joinAfter`, `onMax` say; 66 only with the men at 0.5 to 0.7 and `dmg` 10, where the tapper wins nearly always).
  **Why it is lost:** the ladder's five-line now says: "the hero fell in 65 of 100; his friends down 0.1 of 4 a fight; they took
  3.1 of the five": two of the five are at the hero from the first second (`onHero` 2), his four friends fight the other three
  at the men's own pace (a man on a man is 15 to 20 blows) and he is down before they are free. So the five-fight hinges on
  how the hero's own men come to him, not on these numbers, and I left the crowd numbers as they were (Robin has not chosen
  a way, see "Robin's four answers", 4). **Then found and mended (2026-10-14; `FIVE_DBG=1 node tests/battle.js ladder 8`
  prints the five-fight every two seconds: who is on the hero, what each friend is at):** the hero mostly had ONE man on
  him and still lost about 45 health a man, the same as in the one-man line; his friends won their three duels but were
  busy for 30 s, so the hero had to beat two of the five himself and died at about 40 s with his share half done. Two
  friends who came to his man struck that man from behind without drawing him off: **a man kept his target whoever hit him.**
  Now **a man turns on whoever struck him last** (`e.hitBy`, `e.hitByT` set in `damageEnemy` for a man's blow; in
  `pickTarget` that man scores `MEN.turnK` 120 better for `MEN.turnT` 2.5 s within 110 units): two of yours on the man who is
  on the hero draw him off, and a town's man joining on one of yours turns him likewise. **It is the relief of a beset man,
  and it is mine.** The ladder with it (100 fights): the careful hero with four friends against five **68%** (34), the
  skilled 64% (52), "they took 4.1 of the five", no friend down; the one-man and two-man lines unmoved (a duel has no third
  man to turn to); five against five 36 to 57% (a coin still). **What it costs:** being outnumbered is harsher, because a
  man with two on him turns from one to the other and is struck from behind by each: five against seven now take 0.4 of the
  seven with them (1.2 before), spears in a line against swords 0% (5). In the seeded towns (`RSEED` 11, 28) the crowd round
  one of yours fell from 2.4 to 2.2 and nothing stood still or never ended. **The test's bots learnt two things the same day**
  (in `tests/battle.js`, not the engine): `threatOf` counts a blow meant for a friend whose sweep would take the hero too (a
  man's blow lands on every foe in its arc, and in a crowd that was much of what hit him unseen), and the bots fight the man
  who is on them before the nearest (they walked at a man dueling a friend and ate his sweep). Those two alone moved
  nothing (34%); the turning did. **Seeded towns, before and after** (`RSEED` 11, 28, 57, two towns each, the
  engine of `HEAD` against this): the crowd round one of yours 2.3 to 2.5 before, 2.1 to 2.6 after, the hero would have fallen
  at 46 to 57 s before and 36 to 58 after; one random `!!` on the old engine in one run of seed 57 (the one fight in a hundred),
  none in the other runs on either.
  **Rung 8, hit weight and sound.** Every melee kind has a **weight, `wt`** in `PROFILES` (seax 0.6, spear 0.9, sword 1, axe
  1.25, club 1.5, Dane axe 1.8); the hero's blow carries it (`hitFlags.wt`, `hitFlags.wkind`; `stepData` hands `wt` on; fists
  0.5, a tool 1) and `damageEnemy` reads it for the hero's hits alone: the **pause** on both is 0.6 + 0.4 of it, the **ring**
  0.7 + 0.3 of it and thicker over 1.3, the **slow moment** of a heavy blow half again as long, the sparks the same share, and a
  weight of 1.4 or more (the club, the Dane axe) lands with **dust** at the man's feet, a **big number** and the **heavy hit's
  sound**. **The sound carries the weapon:** `sfx(n, v, src, x)` has a fourth argument, `x` = `{ kind, wt, heavy }` of the hero's
  weapon for a hit and for a swing, and a page's hook (`Combat.api.sfx = function (n, v, src, x)`) takes **`SFX[n + '_' +
  x.kind]` if the set has it, else the plain sound**: in `templates/game.html` and `templates/combat.html` the sword keeps the
  plain ring, `hit_axe` is a chop (lower, a bite of noise), `hit_club` a dull thud with no ring (and `heavyhit_club` a bigger
  one), `hit_seax` a quick thin cut, `hit_spear` a thrust's punch, `hit_greataxe` the heavy hit deeper; the swings are whooshes
  of the weapon's weight (`swing_axe`, `_club`, `_seax`, `_spear`, `_greataxe`). The Art Editor's hook takes the argument and
  falls back. **I cannot hear them**: the voices are tones and filtered noise chosen by their numbers; whether a club thuds and
  a seax cuts is for Robin's ear, and the Combat Arena is where to listen (its Sound switch). No screen shake; Snappy stays.
  **Checked:** `tests/blows.js` with no contradictions; `npm test`; the ladder at 200; the seeded towns; in the pane at 1200 by
  750 the arena's club on a held man (the big 9, the ring, the sparks, no console error) and the battle scene, which ran the
  scripted church raid through five minutes with no error. **Found on the way: the scripted raids of `tools/visual/raidplay.js`
  no longer got in.** On the committed page too (an A/B against `HEAD`'s `dist/game.html`), the church raid logged "could
  not get behind him" at the back gate and died at the church door: the town bars its gates to an armed man with his band at
  his back (`gateWatch`, "Four ways to raid", the same day the script was written: the back gate's edge read `barred: 1`,
  `arms()` said `carries: true, band: 1`), so the quiet start the script was built on (round behind the two at the back gate
  by day) was barred by design, not a fault of the engine. **Rewritten on 2026-10-14 to the rule:** the quiet raids
  (`quiet`, `church`, `hold`) begin from the board's night raid (`RP.begin('nightraid')`), **lift the back gate's latch**
  (`RP.latch`: E, "Lift the latch", from outside) and take the two dozing men from behind; `loud` is by day and **hacks the
  front gate open** (`RP.hack('gate', 'front')`, `RP.gateKeys`: 1.3 s of axe). **Where they stand now** (the engine with the
  turning rule above; the ship 40 tiles from the back gate at night): **quiet** about 70 s, both gate men taken, nobody of
  the town up, nothing aboard; **church** 36 silver in 90 to 150 s, three to five of the five aboard, the hero at 3 to 26
  health (the second gate man is a light sleeper and wakes the town about half the time, as the day's second man did);
  **hold** 36 silver, the hero at 91, none of the five aboard; **loud** the gate in 1.3 s, the church's silver carried out,
  the hero dead in the hall. The curve the rung-6 paragraph below describes still holds; its own numbers are the day's.
- **More than one on a target (rung 2).** At most two may be striking one target at once (`MEN.slots`), and **no two blows
  land together**: a man may begin a blow only if it would land at least `MEN.gapHero` 0.75 s from any other already on its
  way to the hero (as long as the hero is untouchable after a blow, so none is wasted), 0.35 s for a man (`slotFree`, by
  each blow's own landing time, `e.hitT`; second blows and quick answers are held to it too). Those on one target take
  **places round the side of it that faces their middle** (`slotAngle`: two stand 1.6 radians apart, three 2.5), so the
  second works round to your flank instead of queueing; a man with no slot waits a step back. **While the hero cannot act
  he cannot be struck** (a broken guard and a club's stagger now make him untouchable for as long as they hold him), so
  with any number on him he can always get out. Measured over a thousand fights a line: two blows on the hero never
  closer than 0.37 s, and he was never held longer than 0.42 s.
- **Friends (rung 3).** A man of side 1 with nobody to fight **follows**: his place is beside and a little behind the hero
  (`FOLLOW`, round the way the hero is going, `W.heading`, not the way he looks), never in his way. He **fights** the
  nearest foe within his leash of the hero (`MEN.leash` 250), turns to **what the hero strikes** if he is free (a man with
  a foe on him keeps that foe; a second friend may join, the rest keep their own), leaves men on their knees alone, and
  never starts on a town's man who has not seen you (`awake === false`). **He does not die of a blow: he goes down**
  (`goDown`: he lies, nobody's target) and **gets up when it is over** (4 s with no foe within 260 units, a third of his
  health back, the death clip run backward); he dies only if the hero dies or is 700 units away for 20 s (`downTick`).
  **Two orders** (`Combat.order(kind)`; the page's **G**: tapped, *with me*: they break off and come; held, *hold here*: a
  line abreast where the hero stands, facing the way he is going, shields up while anyone is coming, fighting only what
  comes to them). The nearest answers in his own voice ("With you.", "We hold."); a man who yields says so. Your own men
  wear your colour (a red cloak, a red shield), the others blue shields; a friend's name shows when you are near and no
  fight is on; a hurt friend has a green bar.
- **Groups (rung 4).** Each man takes a foe nobody has, then the least beset (`onTarget` in `pickTarget`). **The men are
  thought of in a new order every frame** (`updateEnemies` shuffles): whoever is thought of first has an edge, and with a
  fixed order the side spawned first won 53 to 47 of equal fights (plain turn and turn about made it worse, 59 to 41).
  **The band's heart** (`bandHeart`, twice a second; never the hero's own, never a loyal man): the last of his band among
  several foes may yield or run, and so may a hurt man when more of his band are down than standing (`e.nerve` is the
  chance he does neither; `breakMan`). **A held line** (`e.inLine`: told to hold, at his place, one of his own at his
  shoulder): the shield stays up until he strikes and is back at once after, it covers 2.7 radians instead of 1.7 (his
  neighbour's side), and he does not hop out of the line. Men's sounds are thinned (the same sound from a man not twice
  within 0.07 s); the page draws the view back by a fifth while six or more are fighting round the hero (`fightK`).
  **Where it stands** (`node tests/battle.js five 1000`): equal sides are a coin (51%), a fight of ten takes 38 s (62 at
  most; the plan aimed at one to two minutes); a side in mail wins 95%; five spears lose to five swords (13%); **a line in
  the open is no advantage** (41%, and against seven it takes fewer with it than men fighting as they like: its ends are
  turned; its place is a gate, rung 5); rolled men with mixed weapons: your side 69%, because theirs may break and yours
  never do. With the hero and four friends against five: the careful bot wins 83%, the skilled 95%, the tapper 6%, and a
  hero who stands by 1% (he is cut down).
- **Man to man, not a swarm (2026-10-13, Robin after raiding: "everything just gathers up like ants around a target. We need to
  work out a good way for it to feel more like lots of individual battles where things can go either way").** Measured first
  (`crowdOf` in `tests/battle.js`, a line under every town of the town test): on the old rules about **4 to 5 of the town stood
  within 80 units of one of yours on average, 12 to 18 at worst, three or more two thirds of the time**. Four rules, all in
  `src/combat.js`, all numbers in `MEN`:
  **One on one first** (`onOne` 1; `onHero` 2 on the hero): a man takes a foe nobody of his side is AT (`inContact`: within his
  reach and 40 units; `tallyOn` counts it every frame: `F.onN`, and `F.onT`, how long somebody has been at him). `fullFor(e, F,
  d)` says whether F is taken for e: those at him already count, and those on their way who will be there first (a man already
  after F gives way only to one nearer; a newcomer takes a place only by being 40 units nearer). **Help comes after a while**:
  a man fought for `joinAfter` 6 s without an end gets a second on him (`joinYours` 3 s for the hero's own men, who help a
  fellow sooner); never more than `onMax` 2. **Never taken:** the man who is fighting you, the hero when he has struck you or
  comes at you with a weapon, and (for a man told to hold) whoever is in reach. Bowmen and men on errands take no place.
  **A man with no place hangs back** (`e.waitOn`, `hangStep`): 105 to 165 units (`hang`, by the man) from the nearest of the
  taken, apart from the others who wait, his face to the fight; `pickTarget` is asked every frame he has nobody, so he steps
  in the moment a place opens. The hero's own men with no place stand by him as before.
  **A fight makes itself room** (`apartFrom`, `apart` 72, `drift` 26): the two of a duel move, together, away from the men of
  other fights (both work it out from the middle of the pair, so the distance between them is left alone; pushed singly they
  stood a pace out of each other's reach, and against a held line the attackers went round its ends: the line won 7 in 100).
  Not from men who only stand by, never from the hero, not when either is the hero or holds a line.
  **Householders hold their own doors** (`homeR` 190 on the man: the garrison's `door` and `house` kinds, set by `townMen` and
  the test): such a man fights nobody further than that from his post, does not go to look at a noise beyond it (`alarmFor`),
  and stays up 22 s after the last one. So the gate, the market, the back gate and the hall answer a fight, and every house
  still has its man when you come to it.
  **`MEN.onOne = 0` is the old way** (`MEN='{"onOne":0}' node tests/battle.js ...`). **What it gave** (six towns, both gates,
  the same bot): round one of yours **2.4 on average** (4.1 the old way with the same householders, 5.1 before any of this),
  three or more 34% of the time (65%), the largest fight 3.2 men (5.1); the hero would have fallen after 57 s (59: no easier);
  a town fight takes longer (150 to 290 s; the town test's limit is 480 s). Five against five is still a coin (45 to 56% over
  100), about 45 s (38); the hero's bots with four friends against five: tapper 2 to 6%, careful 84 to 90%, skilled 94 to 98%
  (as before); a held line 37% (42). In the page (`docs/battle-pairs.jpg`): pairs at the gate, the rest of the town behind it.
  **Found on the way:** since the houses grew a town is wider than `MEN.pursue` 700, and the hall's men stood idle beside a
  fight at their own gate: a post may carry its town's bounds (`post.box`, from `vBox(v)`), and then a man goes for nobody
  further than `MEN.pursueOut` 450 outside them. The test's hero bot fights whoever is at him first (it walked at men who only
  stood and watched while two struck it from behind). `BP.fast({ bot, secs })` plays on with no pictures and says how crowded
  it is. **My choices, not Robin's: every number here, one on one at all, and that a town's men wait their turn.**
- **Robin's four answers (2026-10-13), as built. Where a bullet below says otherwise, this one holds.**
  **1. Taking a man's weapon** ("there needs to be some system where you 'take the weapon'"). Nothing falls out of a man as
  loot any more. **His weapon stays with him** (`e.arms` on the dead man, drawn by his hand; gone when the body is, 90 s),
  and taking it is an act: **E by him, "Take his sword"**, a moment on one knee (`armedNear`, `startTake`, `takingTick`,
  `TAKE_T`: 0.9 s from the fallen, 0.7 from a man on his knees, 0.4 for a thing that lies; the hero's `pickup` clip and a
  small bar; a step, a blow taken or the man's being gone ends it). It goes into the empty hand, else the Fight bar, else
  the bag (`armTake`). **A man who has yielded is disarmed the same way** (`e.disarmed`: he keeps his life, runs, never
  fights again, and leaves nothing if he later falls). A man taken from behind with empty hands: his weapon is in your hand
  as he falls, as before. Things that lie (what you laid down, a place's own) are taken up the same way, quicker. So twenty
  dead are twenty weapons only to one who kneels twenty times in a minute and a half with room for them. **What arms are FOR
  is still open** (they will arm the hird). `docs/take-weapon.jpg`.
  **2. The unarmed can be killed.** The engine hands the hero's blow and his arrows to people the page keeps
  (`Combat.api.struck = { list(at), hit(o, dmg, ang, kind) }`, asked in the melee loop after the enemies and for the hero's
  arrows). A grown villager has `FOLK_HP` 2 on the men's scale (two blows of an iron sword or one heavy one; five punches),
  an elder less; **one who has noticed nothing, struck from behind, falls to that blow**. One who is struck and lives runs
  and screams (a man's cry: the place is raided); one who falls lies 90 s as the fallen lie (`f.fallen`, the death clip) and
  is gone: **`seen.dead[vi]`** (his number among the place's people: he is still dead after a load, `markDead`) and
  **`seen.slain[vi]`** (names: those who live speak of them afterwards, `mournLines`). **A villager sees what is before him**
  (2 radians either side; anything, once he runs or crouches), so `witness` no longer counts a man with his back turned, and
  a killing nobody sees or hears is nobody's alarm. **Children cannot be struck, your own men do not strike the unarmed, and
  people abed at night are indoors and out of reach: my lines, not Robin's.**
  **3. X draws the weapon and puts it away** (`drawToggle`, `drawn`; in Fight mode; the keys list says so). Three things set
  it for you: a blow, a raised shield or being come at draws it; **walking into somebody else's place at peace puts it away**
  (it is in the hand again when you leave); nothing else. **A blade out in a place at peace is a threat, before any blow:**
  one of its people who sees it (`MENACE_R` 130 units before him, or 70 whichever way he looks) cries out and **the place is
  uneasy**: `raidStir(vi, x, y, 1)`, `raid.lvl` 1 (`raidLvl(vi)`: 0 at peace, 1 uneasy, 2 raided; `atPeace` is "not raided").
  Its people run, take cover or fetch what the house has exactly as in a raid, but those who arm only stand at their own
  doors (`homeR` 70 until blood), its men are not called, and nothing is remembered; it lasts while the blade is out and
  seen and `MENACE_T` 12 s after (`WARY_LINES`). **One of its men who sees it challenges you**: "Put up your blade."
  (`challenge`, `CHALLENGE_T` 4 s): put it away and he says "Keep it there."; keep it out and it is a raid. So people can be
  driven indoors and a store emptied while they crouch (taking is still theft if one of them sees). Tried in the pane: a
  blade drawn before a villager, 17 running, 3 indoors and 2 in cover four seconds later with no man of the town up, all
  calm again fifteen seconds after it was put away; a guard obeyed, and a guard defied (ten men up).
  **4. The ways they come at you** ("is one at a time too kind?": "Yeah maybe. Try different versions"). `Combat.WAYS`,
  `Combat.way(id)`: each is a set of the pairing numbers. `capOn(F, e)` now grows by one for every `joinAfter` seconds a
  man has been fought, to `onMax`; with `MEN.odds` it is the odds of the fight instead (`W.odds`: as many to a man as
  there are of the one side for each of the other). **The battle board's first town row steps through them ("They come one
  at a time"); the choice is kept (`game.way`) and the real game takes it.** Measured (`node tests/battle.js ways 40`: a
  town of twenty against the hero and five; the careful bot alone against two, three and six):

  | way | round one of yours: average, most, three or more | alone against 2 | against 3 | against 6 he lasts |
  | --- | --- | --- | --- | --- |
  | `duel` one at a time (a second after 6 s) | 2.3, 9, 32% | wins 57% | 40% | 42 s |
  | `pack` one, then more (2.5 s, then a third) | 3.2, 9, 66% | 57% | 28% | 31 s |
  | `press` two at a time (three on the hero) | 2.9, 10, 62% | 40% | 33% | 32 s |
  | `odds` by the odds | 2.9, 9, 66% | 73% | 30% | 31 s |
  | `swarm` all at once, as it was | 4.1, 11, 65% | 60% | 35% | 23 s |

  **What the numbers say:** in a town the hero would fall at about the same time under every way (56 to 63 s), because
  only two may strike one man at once and no two blows land on him within 0.75 s (`MEN.slots`, `gapHero`): the ways differ
  in how crowded it looks and in how long a man alone lasts against many, not in how fast a careful player dies in a
  town. **If one at a time is too kind, the lever is `slots` and `gapHero`, or a town's numbers, more than the way.**
  `duel` is still the default; Robin has not chosen.
- **Weapons that drop and are taken (2026-10-13, Robin: "weapons can drop and be looted, for example if you manage to kill a guard
  with your hands you could take his weapon... Or maybe that stealth kill gives you the weapon of the target").** In
  `templates/game.html`. **(A fallen man's weapon no longer lies as a thing of its own: it stays with him and is taken from
  him, see the bullet above. What follows about lying things holds for what you lay down and what a place keeps.)** **A man who falls drops what he fought with**, where he fell (`manDrops(e)` from `onDeath`, `manArms`:
  his weapon as a thing of its own metal; a bowman's bow and two to five arrows). It **lies** there (`d.lie` on the drop:
  walking over it does not pick it up, so a battlefield does not fill your bag) until **E, "Take the iron sword"**
  (`lyingNear`, `takeLying`; an `add` line in `eWhat`). **A thing taken goes into your hand if the hand is empty**, else to a
  free place on the Fight bar, else into the bag (`armTake(spec)`: so an axe taken from a man is a weapon, not a tool).
  **A man taken from behind with nothing in your hands: his weapon is in your hand as he falls** (the engine marks him
  `quietKill`; fists do it, as any blow in the back of a man who has noticed nothing does). **What you drag out of the bag
  lies too** (`dropThing(spec, x, y, lie)`), so a weapon can be left anywhere and found again. **A boat and a karve have a sea
  chest** by the stern (`seaChest()`, `raft.chest`: twelve places, the chest board as for any chest; E facing the stern,
  "Open the sea chest"; saved with the vessel; the raft has none): where weapons are left before a town that lets nobody
  in armed. Lying things are gone after fifteen minutes; they are saved (`lie`). Other loot (a crate's sword, a chest's)
  is walked over as before. **Tried in the pane:** six weapons into the sea chest; a gate guard taken from behind
  bare-handed, his sword in the hand, the town not woken; his fellow's club lying, not picked up by standing on it, taken
  with E to the Fight bar. **Not done:** the sea chest is not drawn on the vessel; your own men do not pick weapons up;
  a man's shield, helm and mail are not loot. **My choices:** that they lie instead of jumping into the bag, the sea
  chest, and that a guard's iron is real iron (twenty of them is a lot of iron: to be looked at when weapons arm the hird).
- **Four ways to raid (2026-10-13, Robin: "I also want you to have different options of raiding": by night; walking in with
  weapons not drawn; a guarded town that checks you for weapons; storming; and villagers who flee, take cover or fight).**
  All in `templates/game.html` with a little in the engine; tried on four rows of the battle board (below). **Robin has
  played none of it: every number and every line of speech is a first setting, and the choices are mine.**
  **The people (`folkReact`, on a fresh alarm: `raidStir`).** By who each one is, the same every time (`nameHash`, the
  calling): a share takes up arms (`FOLK_FIGHT`: smith 85%, farmer and fisher 50%, weaver 15%; a child, an elder, a thrall,
  a priest and a merchant never); of the rest about four in ten **run out of the place** and watch from beyond its edge
  (`refugeOf`), four in ten **run home and crouch behind what stands furthest from the door** (`coverIn`), two in ten
  **crouch behind their own house** on the side away from you (`coverBehind`; they run again when you come round it).
  Crouched is `f.cower`, drawn as a held frame of `pickup`, with a line now and then (`COWER_LINES`). **One who arms** runs
  home, is inside `ARM_T` 2.6 s, and comes out a man of the engine (`armFolk`: his own face and clothes, a wood axe, a club,
  a fish spear or a long knife by his calling (`FOLK_ARMS`), copper in the first biome and iron in the lowlands, no shield,
  14 to 20 health against a guard's 30, slow wits, `nerve` 0.25 so he yields or runs when it goes badly; a householder,
  `homeR`: he defends his own door). (Only one who had taken up arms could be hurt, until Robin's answer the same day: see "Robin's four answers".) His weapon stays by him; one who runs is
  a villager again; when it is over those who live put their arms away (`folkCalm`); one who fell is gone until the page is
  loaded again (the people are not saved). In the test town of twenty-two: six armed, ten in cover, six out of the gate.
  **Weapons away, and drawn (`armsTick`).** In somebody else's place at peace (`placeOfPeace`) the weapon is put away by
  itself: not in the hand (`handLayers`), nor in your men's (`sheathed` in `Sprites.fighter`). It is out when you strike,
  raise your shield, are struck or come at, and `ARMS_T` 2.5 s after (`armsOut`). No key: the blow is the drawing. **A blow
  that somebody of the place sees ends its peace** (`witness(vi, x, y, r)`: one of its people within 120 units with no wall
  between (170 for a theft), or one of its men within 150 who is not looking away; `cryOut`: he cries, `raidAlarm`; a raised
  shield alone alarms nobody, and a swing with nobody near is nobody's business). A man
  taken from behind where nobody looks is seen by nobody: **a quiet noise (no further than `MEN.hush` 80) now stirs a place
  only if a man or a villager heard it** (`onNoise`; it used to send every villager running at any quiet kill, and the man
  who was struck counted as one who heard: `noise(..., except)`). A beast at you in the street is no attack on the place.
  **The gate (`gateWatch`).** A walled town with men at its gates (`gated(v)`: the `townwall` archetypes) lets in one who
  comes **alone and unarmed**. With any weapon on you (`carriesArms`: a thing of a fighting kind anywhere in the bag or on
  the bars; a wood axe and a bow are, a pick and a knife are not) or men of yours following within 320 units (`bandNear`;
  men told to hold further off do not count) **its gates are barred** (their edges locked: `barred`; a barred gate can be
  hacked, loudly) and the gate's man says which it is ("No blades inside the walls. Leave them at your ship.", "You
  alone. Your men stay out there.", "Go on in."). Men of yours who come inside the walls of a town at peace by day end
  it when seen. The weapons go in the ship's sea chest. **Things to take** (`layArms`, laid when a place is built): an axe at
  every chopping block (flint in the first biome, so a village is not a free forge; iron in the lowlands), a spear by a shield rack (two at most), the smith's blade at the smithy; they lie (`d.own`, `d.keep`:
  the place's, and they do not rot away), and taking one where a witness sees is theft: "Thief!", and the alarm.
  **The night (`sleepTick`).** At night a place at peace sleeps: its people go home and in (`f.abed`), its men to the beds
  nearest their posts (`bedDown`; `e.asleep`, the engine's sleeping man: he lies, sees nothing, is drawn on his bed, `e.bed`).
  **The watch:** the front gate's men, inside it now with a lantern, and one who walks a round with a torch (two in a
  garrison over fourteen: gate, yard, the hall's door, the back gate; `roundOf`, the engine's errands); the back gate's two
  doze where they stand. **A sleeping man falls to any one blow, from any side, heard 70 units off. The risk:** one in three
  is a light sleeper (`e.light`, nothing shows it; the dozing gate men both are): a death within those 70 units has him up
  within a second or two, and so does anybody running within 60 (`WATCH.step`; walk); the watch sees you within 120 units
  before him with no wall between (260 if you carry a lit torch), your men likewise, and **a dead man within 100**
  (`watchSees`): his shout is the alarm; anything loud wakes sleepers as it wakes anybody, `MEN.getUp` 2.2 s slower; and the
  fight's own noise wakes the rest by ear. **The way in:** at night the gates are shut to everybody; the front one is
  barred, **the back one (the front where there is none) is on the latch**: E, "Lift the latch", from either side, quietly
  (`latchNear`, `liftLatch`). A place that has been woken stays up that night. In the test hall: a man killed beside a
  sound sleeper, and nobody stirred; beside a light one, and he was up, then the walking watch, then six of the people armed.
  **Storming (`stormOrder`).** A third word to your men: **G before somebody else's place with men following, "Storm
  Steinarsheim"** (`stormable`, in `gWhat`). The engine's order `'storm'`: no leash; each man runs to the place he was
  given (`e.stormAt`, `stormStep`), fights whoever he meets (one man each: the pairing), asks the page for the next
  (`api.onStormAt`) and with none left follows you again. The page deals out doors (`stormGoals`: every building's door and
  the yard; no two men begin at the same one, three each), sounds a horn (`SFX.horn`: I cannot hear it), raises the alarm
  across the place, and has a man whose way is a barred gate or a locked door hack at it (`api.onStormBlocked`,
  `stormTick`, `wallBlow`: as loud as when you do it). G again calls them back from up to 1400 units. Sixteen against the
  town of twenty: after 12 s, 9 fights going at once across 8 by 13 tiles, never more than 3 of theirs round one of yours.
  **The battle board's rows** (`walkSet`, `nightSet`, `stormSet`, `freshTown`): **Walk in unarmed** (your weapons in the
  karve's sea chest, your men told to hold by her, you before the gate with nothing on you), **A night raid** (the middle
  of the night, everybody where he would be, `nightNow`; you outside the back gate with your five and your weapons),
  **Storm it: a longship's crew** (sixteen behind you before the gate, by day). `tests/battle.js raid` checks the engine's
  part (lines 7 to 10: three against one, a householder, sleepers, the storm order). Debug: `arms()`, `witness`, `atPeace`,
  `nightV()`, `bedDown(vi)`, `menOf(vi)`, `folkReact`, `armFolk`. `docs/raid-ways.jpg`.
  **Not done, and open:** a watchman's torch and a villager's weapon rack are not drawn (the light is); a body cannot be
  carried out of the watch's way; your men do not kill sleepers, loot, or put fire to anything; villagers of a place with
  no men at all (the first biome's villages in the real game) react to a blow seen and to noise, but nobody there fights
  back unless they arm; the real game spawns no town, so the gate and the night watch are seen only in the test scene;
  a dead villager is back when the page is loaded again; nothing of this is remembered by the place afterwards.
- **Man against man** is not balanced weapon by weapon, and was not meant to be even: it makes cycles. `node
  tests/battle.js duels 200` (even men in leather with shields; the share the row wins):

  | | sword | axe | club | seax | spear | Dane axe |
  | --- | --- | --- | --- | --- | --- | --- |
  | sword | 44 | 14 | 36 | 69 | 80 | 95 |
  | axe | 90 | 52 | 72 | 100 | 71 | 4 |
  | club | 62 | 35 | 47 | 98 | 7 | 1 |
  | seax | 33 | 0 | 3 | 48 | 18 | 0 |
  | spear | 17 | 37 | 95 | 82 | 47 | 99 |
  | Dane axe | 6 | 98 | 100 | 100 | 2 | 52 |

  The same weapon is a coin (44 to 52). Why the rest falls as it does: **a blow into a shield is stopped and answered**, so
  among shield men the one who must attack loses the exchange unless his weapon **breaks the guard** (axe, club, Dane
  axe: 0.45 gets through and the shield drops); a man who **sees a guard-breaking blow in time steps out of it** and comes
  back in while the other recovers, which is how a sword or a spear beats the slow Dane axe (no shield, a long recovery);
  a **spear** keeps its man at the point (a thrust pushes him back even when stopped); the **seax** is a sidearm. A man
  with a shield does not begin a blow into one he sees coming, a quick man gets his shield back in the second half of his
  own recovery, and a blow on a recovering man does a fifth more from a man (half again from the hero).
- **No locking a man in place:** a second light blow within 0.9 s of a flinch he takes on his feet (`e.poiseT`); a blow he
  has begun he finishes unless the one that hit him was heavy.
- **Heart:** below a quarter of his health a man who is not loyal may yield (state `yield`, `e.out`: on his knees, nobody's
  target; left alone he gets up and goes) or run (`flee`; gone, `e.fled`, when 620 units from every foe); `e.nerve` is the
  chance he does neither. A man on his knees can still be struck.
- **The dead lie** where they fell for 90 s (`MEN.lie`), drawn from the death clip's last frame.
- **Drawn** by `Sprites.fighter` (the people's sheets): the windup goes quickly to the clip's drawn-back pose and holds it,
  the blow and the recovery follow the clip's own beats (`BEATS`), the shield is the `block` clip, a flinch the `hit`, a
  man on his knees a held frame of `pickup`. His fight clips are asked for the moment he is first drawn, and while one is
  still loading he stands in his idle (never the old drawn figure).
- **Walls and ways (rung 5, `src/nav.js`).** In a field a man walks straight at what he wants and slides round what is
  round; in a town that is hopeless. The game keeps a **grid for every village the hero comes near** (`navOf(vi)`, built
  by `navTick` within about 1900 units; `navs`; read again when a door is broken or anything is built: `navStale`) and
  `Nav.attach` hands it to the engine: `moveCircle` lets **no mover but the hero step across a shut edge** (the hero is
  stopped by the walls' circles as before; the others may be far from him, where there are no circles), a soldier's chase
  asks for **the way round** (`stepTo`, and in `soldierAI`), and **no blow, no arrow and no seeing passes a wall**
  (`wallBetween`). The villagers walk by it too (`navMove`). What it took to make it hold, each found by the town test:
  a **tree by a wall** left a gap the grid thought a man could pass (a tile whose middle a big round thing covers is now
  closed, a line that runs into anything round is not clear); a man **dead on against a hearth** stood there (a mover
  that makes no way against something round steps round it: `moveCircle`; a soldier that makes no way for half a second
  steps to one side, the other side next time: `e.sideT`); the hall's men stood **behind the pillars of their own locked
  door** (they open it when they reach it); a man **on his knees in a passage** stopped everybody (he is in nobody's way
  now, nor does he fill a doorway); a defender inside a house was **posted on its hearth** (`Village.garrison` settles
  every post on free ground); and `Village.make` itself now keeps **doorways and gates clear** of anything solid (the game
  did that after planting; a birch stood in a town's gate). **What the town test found on 2026-10-13, when its fights were played from seeds (over the same 246 scripted attacks the engine of that morning had 2 fights that never ended, 3 men who stood still five seconds or more and 12 waits of half a minute or more at a gate; after these, none of any):** **a foe in reach with no wall between is struck, whatever the grid makes of the way to him** (the strike rule asked for no `way`; a man being led round a corner, pressed against a wall, or waiting his turn at a gate stood face to face with his man and did nothing, and **a hero hacking at a wall was half safe from the men behind him**); **a wall's circles push nobody but the hero where a grid knows the walls** (`p.wall` on the circles `Build.rooms` makes and on a locked door's pillars, `api.walled`, `noWalls` in `moveCircle`: the circles exist only within 160 units of the hero, so a man who had walked past a chest along a wall, far from him, was caged between the chest and the wall's circles the moment the hero came near), and instead **everybody but the hero stops `MEN.wallGap` 4 units short of a wall he walks into**, near the hero and far from him alike (so nobody stands in a wall; 0 and 4 came out alike in the test); **stepping aside turns further each time it has not helped** (`sideStep(e, dt, d, far, waiting)`: 72 degrees, then 103, 135, 166, the other side each time, until he is past the place where he first stuck; it was always 72, which only pressed a man against one or the other of two log seats; **`stepTo` uses it too**, so a man on an errand, on his way to a noise, to his post or after the hero steps round what holds him); **two fighters with a wall between them do not push each other**; and **a guard pushed a step from his place steps back to it as he stands** (`postStep`: within 26 units he keeps his post's facing; he used to turn his back to walk two paces home, and with the gate rule mended the hero's own men, following him, crowd a gate and nudge its guards). **The scripted raids of the battle scene stand as written above** after all of it (church: five quiet starts in six, 36 silver, three or four of the five aboard, the hero at 29 to 63 health; hold: 36 silver, the hero unhurt, none of the five aboard). Away from any village (your own house in the wild) the walls' circles stop everybody as before. **A town's gate is two tiles wide** (`fence.gateW`): through
  one tile the fight was a duel with twenty men waiting.
- **A town's men, and noise.** `Village.garrison(V, n)` says where each of n stands at his day: four at the gate (two
  outside), two at the back gate, two by the market, a man by every house door, six of the jarl's own in the hall, a man
  inside every house, the rest about the yard; a few carry bows. Each is a soldier with a **post** (`e.post`, `e.awake`
  false, `aggro` 0.5: **a town at peace does not go for a stranger who walks in**; the first blow is the first noise).
  **`Combat.noise(x, y, r)`**: every man of the other side within r hears it; one at his post is on his way after a moment
  (`MEN.wake`, longer the further off; `e.wakeDelay`: 5 to 12 s for a man inside a house, 18 to 32 for the hall's, who must
  arm), one already up with nobody to fight **goes to look** (`e.heardAt`), stands looking about for seven seconds and
  then **walks back to his post and his day** (`postStep`). What is loud (`MEN.noise`): a blow that lands (240 units),
  a town's man who sees a foe shouts (420), a man who falls cries out (360), a door broken or a chest lifted (the game's
  `raidAlarm`, 520), and **the din of a fight carries further the more are in it** (`din()`: a blow's distance for two
  men, across a town for fourteen, 1000 at most), which is what brings the far gate and the hall. The game's `raidStir`
  (the folk run home, word spreads) hangs on `api.onNoise`. `spawnGuards` makes every town's gate guards soldiers (they
  were beasts with a figure). No bell, no waves (Robin, 2026-10-07).
- **Bowmen** (`e.bow`, `MEN.bow`; a soldier armed with `wpn.kind` 'bow', his `aim` from the rolled person). He stands off
  (`range` 300), draws (`draw`: 1.3 to 0.75 s by his aim; state `aim`, clip `bow_draw`) and looses (state `loose`,
  `bow_shoot`) at the man he means to fight if **the line to him is clear** (`laneClear`: no wall, **nobody of his own
  within a lane's width of it**: checked again along the arrow's own true line, which is off by his aim and ahead of a
  moving man), else at the nearest he has a line to; with no line to anybody he **walks round the fight** until he has
  one. He **keeps out of a press** that is not about him (`keep` 125: backward, slowly), and with a man on him (`near` 60)
  it is **the seax** (`sidearm`, `e.close`: a poor fighter, no shield); left alone a moment he takes up the bow again. A man
  after a bowman runs at him. The arrow (`owner: 'man'`, its `side`) strikes the other side only and passes his own; **a
  raised shield stops an arrow** (a man's and the hero's), a wall or a tree stops it; it does `dmg` 9 to the hero before
  armour and half of that share to a man (`toMen`). Friends can be bowmen (the fifth of the town test's five is).
- **The raid (rung 6; in the test scene: the board's "A raid on it").** Not "win the battle of rung 5" (that is lost in half
  a minute) but **how much you dare to take before the town is on you**. What it is made of:
  **The quiet way.** A town at peace lets you walk in. **A man at his post who has noticed nothing, struck by the hero from
  behind, falls to that one blow** (`quiet` in `damageEnemy`: `e.awake === false` and the blow within 1.25 radians of the way
  he faces), with no cry, heard only `MEN.quiet` 70 units off; from the front he is a fight and it is heard. His fellow
  within those 70 units wakes, and a moment later sees you and shouts: two men together must be taken within about a
  second of each other. (Walking past a man jostles him and he turns to step back to his place: wait until he stands.)
  **The loud way.** A locked door and a chest's lock give to the axe in two to six seconds, and every blow is heard 520
  units: ten men are up within five seconds of the first blow on the church door.
  **The ship.** `raidSet()` puts a karve on the nearest shore to the town (`raidShore`: broadside to the beach, as near in
  as her whole hull clears the land) and you beside her with five of your own. **E's reach of a vessel follows her hull**
  (45 units from it: `raftUsable`; it was 66 from her middle, which a karve's is never within from the shore; a raft's
  reach is what it was): this is in the real game too. You board and stow from the shallows by her side.
  **The carry order.** With a chest at hand whose lock is broken and a man of yours free, **G** is "Have it carried"
  (`gWhat`, a second prompt over the E one; otherwise G is the two plain orders as before): he goes to it, lifts it (a
  chest lifted is loud), takes it to the ship at a carrier's pace by the grid, stows it and comes back (`carryOrder`; the
  engine's **errand**: `e.errand = { x, y, near, run, slow, done, drop, fail }`, a man who goes somewhere and fights nobody
  on the way). **Struck or down he drops it where he is** (the chest lies there to be lifted again) and fights. His load
  is drawn on his shoulder (`e.load`).
  **A man of yours who is down** (`downNear`): **E lifts him** onto your own shoulders ("Lift Ulf"; a carrier's pace, no
  weapon; `carrying.man`, `liftMan`, `setDown`), E at the ship lays him aboard; **G with a man free has him carried there**
  (`carryManOrder`). Held, he neither gets up nor dies of being left (`e.held`); left on the shore when you sail, he is lost.
  **Leaving.** E at the ship: those of yours within 190 units of her step aboard (`menBoard`: they are taken out of the
  engine's list with `e.away`, never in the middle of its pass: that crashed it) and row; G first, to call them. Once she
  is 260 units out a toast says what the raid came to ("36 silver aboard, and 2 of yours left on the shore"). Stepping
  ashore again they are beside you, the ones who were carried on their feet with a third of their health (`menAshore`).
  **Heard:** a town's man who shouts is heard up to 1100 units off, fainter with distance (`SFX.shout`, `api.onShout`):
  the town waking is a sound before it is a sight. I cannot hear it; whether it reads as a shout is for Robin's ear.
  **Pursuit, and its end** (two rules of the engine that the scripted raids forced, both in the real game's soldiers):
  **a man who is making off is run down and struck on the run** (`makingOff`: the hero walking away with his back turned,
  a carrier, a man who flees; the pursuer runs through his windup and his lunge. Before this a pursuer stopped to draw
  back his arm and never landed a blow on anyone who simply kept walking; a hero who backs away with his face to the
  man, or sprints, is as before), and **a town's man goes for nobody further than `MEN.pursue` 700 units from his own
  post** (they do not leave their town to chase a raider across the country; without it nothing could be carried out of
  a woken town however far the ship lay). **My choices, not Robin's.** Together they make the raid's shape: inside the
  town and for some way outside it you are hunted, beyond that you are clear, and what happens at the gate decides it.
  **`tools/visual/raidplay.js`** plays whole raids in the page with no pictures (`H2.sim` in `drive.js` steps the page's
  own `tick` at thousands of frames a second: a two-minute raid takes about four seconds): `RP.raid('quiet' | 'church' |
  'hold' | 'loud')` and the steps they are made of (`RP.go`, `toDoor`, `hack`, `behind`, `G`, `E`, `escort`, `leave`), with a
  log line a step that says how the town and your men stand. It presses only the game's own keys. **Where it stands** (the
  ship 88 tiles from the gate, twenty in the town, **the hero doing nothing but walk, hack and carry: he never fights
  or raises his shield**, so these are a floor): **quiet** (the two at the back gate from behind, a look, and away):
  about 100 s, nothing aboard, all five with you. **The church** (its door, its lock, G; the man sent with the chest is
  struck before he is out of the church nearly every time, so the hero lifts it himself while his five hold the town
  off him): **36 silver in two minutes, four or five of the five aboard, the hero at a quarter to a half of his
  health**. **Hold** (the five told to hold a line before the church while he breaks in and carries it out, called when
  he is 500 units clear): 36 silver, the hero unhurt or nearly, **none to three of the five aboard**: the line buys his
  skin with theirs. **Both chests:** he dies in the hall. And **whenever the second man at the back gate is not taken in
  time** (about one raid in three) the town is up before the church door is touched and the hero dies in the church.
  So the curve is there: nothing and everybody, a chest and most of them, everything and nobody.
  **Debug hooks for it:** `raidInfo()`, `eDo()`, `gDo()` (what E and G would do, with their acts), `raidItems()`, `raidB()`,
  `villages()`, `folk()`, `navs()`, `cam()`. **Not built** (in `docs/idea-bank.md`, "The raid: what is left"): the town's men
  taking back what is dropped or holding your ship against you, thralls to cut loose, a man who yields bound and taken,
  what the town remembers beyond `seen.raided`, fire.
- **`tests/battle.js`** (in `npm test`: a short run of every rung; `node tests/battle.js one|two|friend|five|bows [n]` for
  more fights a line, `town [n] [secs]` for n towns, `raid` for the engine's raid rules (the blow from behind, the errand, a man making off run down, the limit of pursuit, a man hard against a wall who must still strike); `TOWN_SEEDS=286,434` picks the towns, `TOWN_DBG=1` prints every man who
  stands still and what blocks him, `BOW='{"toMen":0.7}'` tries a bowman's numbers). The hero is played by three bots, each with a person's limits (a reaction time, a share of blows not
  seen, timing that wanders): the **tapper** walks up and taps, the **careful** one raises the shield at what it sees and
  strikes when the man is open, the **skilled** one parries and steps out of heavy blows. A line marked `!!` is a fault (a
  fight that never ended, a man stood still, a number that is not one). It also checks, one line each, what a friend must
  and must not do (`friendChecks`). **Where it stands** (200 fights a line, the hero in leather; **one man:** against an
  iron axe in leather the tapper wins 36% with a flint sword, the careful bot 100% with 75 health left, the skilled 100%
  with 93; against mail, helm and shield 1%, 100% (62 left), 100% (91 left); 18 to 31 s. **Two men** (the hero with an
  iron sword): the tapper 0 to 3%, the careful bot 61% against two axes, 92% against an axe and a spear, 86% against two
  swords in mail (35 to 50 health left), the skilled 100% (61 to 79 left). **Two, with a friend beside you:** the tapper
  84% (3% alone), the careful bot 100% (57% alone), the friend left with half his health and all but never down. That is
  harder on the careless and kinder to the careful than the plan's table; a man's damage, pace and what gets through a
  shield are numbers in `MEN`.
- **`tools/visual/battleplay.js`** plays the scene by script in the page (after `drive.js`): `BP.set('one')`, `BP.run({ bot,
  secs })` (who fell, how long, a line for every change of a man's state, whether anyone slid), `BP.strip({ bot, n, every,
  when })` (a film strip at Robin's size, begun when a man winds up, the hero swings or a shield comes up). `BP.watch({ bot,
  secs })` plays a town on and says every two seconds how many of its men are up, fighting and gone and who has stood
  still (keep it to nine seconds a call: the pane's tool gives up at about forty-five real seconds and leaves the page
  mid-frame); `BP.film({ who, when, n, every })` is a strip round any one man.
- **The town test** (`node tests/battle.js town`): twelve towns grown as the game grows them (`Village.make`, the `town`
  archetype), the game's own grid, the garrison, the hero (the careful bot, kept alive so every town is played out; the
  line says when he would have fallen) and five friends in at the gate and at the back gate; then a noise at an empty
  gate, and five friends before the gate told to hold or left free. **Where it stands:** nobody stands still for five
  seconds in any of the twenty-four attacks; in at the gate **ten to thirteen of the twenty are up in five seconds** (the
  gate, the market, the men at the doors), the men inside the houses at 6 to 16 s, **the hall's at 26 to 46 s**, and the
  last of the town meets the raiders after 50 to 115 s; from the back gate it builds more slowly (three to eight in five
  seconds). **A frontal attack is lost:** the hero would have fallen after 21 to 48 s and his five are down by then. A
  noise and nobody there: eleven or twelve go to look and all are back at their posts after 31 to 40 s. An update costs
  0.07 ms (the worst 10 to 13: one long search for a way). In the page: 31 to 35 ms a frame in the pane's software
  drawing with twenty-five fighters, by day and by night (what that is on Robin's card the frame log must say).
  **Bowmen** (`bows`): a bowman alone against a man who reaches him loses (0%); **five swords with a bowman behind them
  beat five swords 85 to 90%** (a sixth swordsman: 93 to 97%), four swords and a bowman 20%; the hero's bots beat a lone
  bowman with 87 to 98 health left. **Not shown to be worth it: the line.** Five friends told to hold before a town's gate
  stood 33 s, left to fight as they like 39 s, and put next to nobody out of the fight either way.

## Destruction (2026-10-13; `docs/destruction.md`, Robin: destroy houses and villages, break in; balanced, semi-realistic, tactics, not exploitable, no glitched people, a trashed place left behind; what you hold you can build up again)

Tried in **`game.html?scene=ruin`** (the Destruction Editor) and by `tests/ruin.js`; it is **in the real game too**: the
big island's villages can be broken into and burnt today. **Robin has not played it: every number is a first setting.**
`docs/destruction.md` has the table, the exploits looked at, the rungs and six questions; read it before touching this.

- **Whose a piece is** decides everything (`placeAt(x, y)`: a village's number, 99 the editor's sampler, -1 nobody's;
  `villageHeld(vi)`: a claim stone of yours stands in it; `theirs(x, y)`). **Your tools and your fire work only on what is
  somebody else's** (a village you do not hold); nothing in the game damages what is yours. **In a village that is not yours
  you cannot build and cannot use the wreck cursor** (`buildTarget` wraps `buildTarget0`: "Not your ground to build on",
  "Not yours to take down"; before this the wreck cursor took any wall of any village, silently, and gave its wood back). A
  claim stone may be raised in a village once nobody defends it (`defended(vi)`: "Its people still hold it"). The steading
  on the starter island is nobody's: tools do nothing to it and the wreck cursor takes it apart, as before.
- **The tools on the wall you face** (`edgeFaced(P, reach, want)`, `wallsFor`, `wallBlow`): `Combat.api.harvest.list`
  offers the engine **one** piece of wall, the one faced within 44 units (one blow, one piece: a swing across a corner
  does not take two), as a thing of the axe's kind or the pick's (`Ruin.rightTool`), so the engine's "wrong tool" and half
  blow come by themselves and Ruin's table says how much bites. Locked doors go through the same rules (they were a
  special case). **A tool reaches a box only in the room you are in** (`canReach` in the harvest list: a swing at a wall
  broke the barrel behind it). Admin's one-shot takes a wall at a blow.
- **Noise:** a blow on a wall is `Combat.noise(x, y, r, soft)` with the material's reach (a wattle wall 150 units, planks
  280, a stone wall 430). The engine's `noise` now answers how many men heard it and hands `api.onNoise(x, y, r, n, soft)`
  both; **a soft noise stirs the village only if a man or a villager heard it** (`folkHear`), so a quiet wall at the back of
  a quiet house can be cut unseen. Fighting is never soft.
- **A piece gives** (`wallGave`): rooms and solids are made again (`bDirty`; **`ruinTick` rebuilds them when dirty**, since
  they were otherwise rebuilt only when a frame is drawn), the way-finding grids are read again (`navStale`), a little
  falls out (`RUIN.drop`: one wood or one stone, or nothing), and if the room has now lost too much its roof is due
  (`ruinDue[room.id]`: a groan, `RUIN.warn` 1.6 s, then `roofFalls`). **`roofDown(r, kind)`** is what a fall does: things
  inside are tipped over (`it.fallen`) or, in a fire, gone; a box spills what it held (in a fire it is lost); a heavy chest
  stays (a fire breaks its lock); stone things stand (`STONE_THINGS`); the hero inside is hurt (`RUIN.fallHurt` 24), a man
  16 (`Combat.hurt(e, dmg)`, new: a hurt that is nobody's blow); the room's people are out (`folkFlush`). A room with
  stairs (`r.up`) has no roof to lose. A ruined room is no roof over a bench or a bed.
- **Fire:** a torch burning in the hand and E (`fireAtHand`, an `add` line in `eWhat`: "Set it alight", or "Set the roof
  alight" when only the roof over the wall burns), `RUIN.fire.catchT` 1.2 s of standing there with a small bar over the
  hero (`lighting`, `lightingTick`; a roof that hardly burns may answer "It will not catch"). `fireTickAll` runs
  `Ruin.fireTick` with the game's own `wind`, and from what it answers: a wall burnt through (`wallGave(..., true)`), a
  roof down (`roofDown(r, 'burnt')`), `BURN` (`burnList`: the places that burn, for the flames, the light and the heat),
  the fire's noise every 2.5 s from open ground beside it (`outsideOf`, `Ruin.fireNoise`: 275 units for one piece, 1000 for
  twenty), heat on the hero (`RUIN.fire.heat` 9 a second under a burning roof or against a burning wall), and the men:
  one in a burning room is burnt, gets out unless he is fighting (an `errand` to open ground), and a post in a house that
  burns or is down is moved outside it. Flames and smoke are things among the world's things (`pushFlames`); a burning
  house lights the night (`blazeLights` into `nightFires()`: `blaze`, `big`; `lightInto` gives it a plain disc) and its
  windows glow; what burns counts as a fire to the wolves and to the ambient sound (`nearestFire`). Ashes glow and smoke
  for `RUIN.fire.hot` 70 s (`drawDebrisAll`).
- **The people** (`homeOf(f)`: the room by a villager's door spot; `aflame(r)`, `homeGone(f)`, `refugeOf(f)`, `folkFlush(r)`):
  the people of a house that burns, is about to fall or is down do not hide in it. They run out of the place on the side
  away from the hero, five and a half tiles beyond its edge (still on its way-finding grid), and watch from there
  (`f.refuge`); when the raid is over they come back, and those whose house is gone have `HOMELESS_LINES`. Nobody who is
  not a fighting man is hurt. `ruinCost(tx, ty)` makes a burning room dear to walk through (the grid's `cost`).
  **A villager is not ticked when the hero is more than 1200 units off** (an old rule): a test that parks the hero far
  away sees them stand still.
- **Mending** (`PIECES` has a last entry, `mend`, key `mend`: known once a claim stone of yours stands in a village, and in
  the editor): in `buildTarget0` it answers `{ kind: 'mend', ed, has, cost }` for a damaged piece of wall and `{ kind:
  'raise', room, cost }` for a fallen roof whose walls all stand ("Mend its walls first"); `mendCost(e)` (a share of the
  piece's own price by how far gone it was, at least one of its material), `roofMendCost(room)`, `mendEdge`, `raiseRoof`;
  `ruinWhole(x0, y0, x1, y1)` makes a stretch (or everything) whole at once, for the editor and for a test's fresh town.
- **Drawing:** a breached piece is drawn once and kept (`edgeSprite`, `drawEdgeKept`: its stumps and rubble are many
  strokes), so is a tile's debris (`debrisCache`); a hacked wall is drawn live with its scars. **A roof thins when you
  stand right behind its house** (`behindRoof`: you could not see yourself or the wall you hacked at), for every house.
- **Side walls with a face, a trial (Robin, 2026-10-13: could what made the mountains' north, west and east edges clear
  improve the building?).** A wall that runs north to south is a strip seen from above, five units wide. With
  `Build.CFG.lean` (the editor's switch and slider; `setLean(v)`; stored in `game.ruin` as `lean`) its foot stands that
  far out from its top and its outer face shows (`sideFace`: lit where it looks west, in shade where it looks east;
  `vSide(x, y)` says which way), as the mountains' side walls do. **Off by default; Robin has not judged it**
  (`docs/destruction-lean.jpg`). It makes side walls clear, above all from inside, and gives a house a splayed foot.
- **`RUIN`** is `Ruin.cfg(game.ruin)`; sounds `SFX.groan`, `crash`, `whoosh`. Debug: `ruinInfo()` (RUIN, RU, due, burn,
  fire, ruin, rooms), `ruinDo(id)`, `ruinB()`, `ruinBag()`, `wallFaced()`, `fireAtHand()`, `placeAt`, `theirs`, `homeOf`,
  `ruinWhole`, `ruinTarget()`.
- **`tests/ruin.js`** (in `npm test`): the table of what breaks what, a house (due after 4 of 10 pieces, a timber frame
  after 7; mended and raised), doors, the way through a breach, and fire (60 houses of each kind; 300 fires for each gap
  and wind: a thatched roof one tile off catches 85% downwind, 70% in no wind, never upwind; three tiles off 49%, 0%, 0%;
  five never). **`tools/visual/ruinplay.js`** plays the editor in the page (`RU2.at(n, side, i)`, `tool(k)`, `hack(secs)`,
  `fire(secs)`, `mend(n)`, `walk`, `wait`, `state(n)`, `table()`, `opt.god`).
- **The big trials (2026-10-13, Robin: build a big village or town and raid it, destroying houses and breaking in; then a
  new trial with bigger houses so there is more room to move; fix the bugs found each time). `docs/destruction.md` section 9
  has the tables, the twenty-one faults and four questions for Robin; `docs/destruction-trials.jpg` the pictures.** Played by
  script in the Destruction Editor (`tools/visual/sackplay.js`, after `drive.js`: `SK.setup(place, men)`, `SK.party(x, y)`,
  `SK.go`, `SK.jump`, `SK.breach`, `SK.fell(lot)`, `SK.torch`, `SK.burnWait`, `SK.hallBack()`, `SK.sack({ from, n, god })`,
  `SK.raid('hall' | 'fire', men)` (the town only), `SK.state()`, `SK.check()`, and **`SK.watch()`**: with every step it
  counts anybody who walked through a wall, a man who stood still with somebody to go for, people hidden in a house that is
  gone, people fleeing who do not move, time stood in a fire, and the milliseconds a step). **The hero never fights and is set
  down at the gate with his five** (the walk from the ship is skipped), so the raids are a floor. **A call into the page must
  stay under about 45 real seconds**: a sack is run a building or two a call.
  **Trial 1, the places as they are.** The great town (19 buildings, 302 pieces of wall, 30 men): the hall by its back wall is
  10 s of axe work, the chest lifted with 12 to 15 men up, and death at 46 to 49 s, four times of four; a house set alight
  first, then the church: three to six men at the fire, the chest lifted with all but full health, and death at 61 to 69 s,
  four of four; the sack **with nobody to stop him** 17 of 19 buildings down, 16 burnt, in 634 s (the cut-stone church and
  the timber-frame hall stand); **with the town up he is held** (three to six pieces of the hall in three minutes: the men
  strike a man who stands hacking, which they often did not before fault 15). The great village (18 buildings, a ring of
  stakes, 20 men): through the ring in 14 s unheard; the hall's log wall is 18 to 22 s of blows the whole village hears,
  and he was dead before it gave; the sack 17 of 18 in 374 s, the stone smithy stands.
  **Trial 2, `houseK` 1.5** (houses 6 by 6 to 8 by 5, the hall 26 by 6, wider than the screen): the sack 17 of 18 in 462 s
  and 20 of 21 in 786 s. **With bigger houses and hearing left as it was, the hall raid walked away untouched 3 times of 4**
  (sound is distance: the same noise reaches fewer men); with hearing scaled by the same number (`TRIAL.loud`: `raidAlarm`,
  `RUIN.noiseK`, `MEN.noise`, the fire's loudness) it is lost 4 of 4 again. **Fire as a diversion grows stronger with the
  place**: at the bigger size 13 to 15 men stand at the fire and the church's chest came out 3 times of 4. **The things
  inside do not grow with the room**: a 6 by 6 house has the furniture of a 4 by 3 one. None of this is decided: bigger
  houses, the hearing rule and the big places are in the editor only.
- **What the trials changed in the game** (all of it in the real game, not only the editor):
  **A fire is something to look at.** `Combat.gawk(x, y, r, { hold, stays(m), spot(m, x, y) })` (`src/combat.js`): the men of
  the other side within r who are at their day leave it and stand before the fire while it burns (an errand with `gawk`,
  `hold`, `fx`, `fy`; called again while it burns; the gate's and the hall's own stay, `stays`; they stand on open ground in no
  room, `gawkSpot`); they have noticed nothing else, so **a real noise wakes them as at their posts**; a man already up with
  nobody to fight goes to look. Before, a fire was a noise like any other and every man who heard it was up and after the
  hero wherever he stood. **Lighting a fire where a man or a villager sees you** (`seenAt`, 190 units, no wall between)
  raises the cry at once. **A man in a room that is alight walks out of it** unless he is fighting (an errand with `flee` to
  `outsideOf`); nine men burnt watching a fire from inside the house before this.
  **Stakes.** A village's ring of stakes is props, not wall pieces: `stakesFor(P, out)` offers the one stake you most nearly
  face, `stakeBlow` bites it as a palisade (`RUIN.hp.stake` 30; heard 320 units, softly), a fallen stake leaves a stump and
  now and then a piece of wood and is `gone` for good; **the grid closes every tile a standing stake is in** (`stakeTiles` in
  `navOf`), so nobody plans a way through the ring and everybody uses a gap you cut.
  **Speed.** `roomsOf(BB)` finds rooms **per cluster of pieces** (24-tile blocks that touch; `bounds.noSolids` for all but
  the first) instead of over the whole map: 28 ms became 4.5 (5.9 with bigger houses); a breach calls `dropSolids(L, tx,
  ty)` and rebuilds nothing; a fallen roof drops only its own room's pictures from `roofCache`.
  **People.** Everybody of the place the hero is in or within 16 tiles of lives (`liveVi`; villagers beyond about 37 tiles
  stood frozen while a big place burnt); refugees stand scattered (`refugeOf`), not in a line; a roof whose walls burnt falls
  as ash (`fellByFire`); a big roof falls only when the fire has crossed it (`f.need` in `Ruin.fireTick`); a wall that gives
  takes its window box, lantern and sign with it (`it.wall`); ash differs from tile to tile; **no grass grows through a laid
  floor** (`w.noGrass(tx, ty)`, asked by `meadowOk` in `src/world.js`; it grew in every house); "Whole again" brings burnt
  furniture back (`RU.items0`). **A villager with no way to a place stands, and after two seconds thinks of somewhere else**
  (`navMove` answers false and counts `m.noWay`; it used to walk straight at the place, **through the wall**: the watch
  caught a refugee going through a dry-stone wall, her refuge being a walled-in yard), never takes a step across a shut
  edge, and **a refuge is a place that can be walked to from the yard** (`wayTo`: the grid's `flood` from the village's
  middle, found once for each reading of the grid; `refugeOf(f, other)` looks further round when the first cannot be
  reached).
  **In the engine every fighting man uses**, found by `tests/battle.js` when its town fights were played from seeds: see
  "Walls and ways" under Fighting men (a foe in reach is struck; walls' circles and `wallGap`; `sideStep`; nobody waits for
  a foe at a gate; a guard steps back as he stands). **`RSEED=n node -r ./tools/seedrand.js tests/battle.js town`** plays the
  same random fights again (see "Things to know").
- **Not built:** a ram, a barred town gate, the town fighting a fire, smoke seen from the next village, your men breaking
  or mending, a village mending itself (and the decided rebuilding after winter), the floor above.

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
- **The deer (2026-10-13, Robin: it should behave naturally and be a reason to learn the bow; "you can just run towards the
  deer until he gets stuck on the edge of the beach, then hit him with your sword").** The engine has a **shy beast** (`e.shy`,
  set by the page from `ANIMALS.deer.shy`; `shyK`, `fleeStep` in `src/combat.js`): it notices you **by sight**, 230 units
  before it (`aggro` 230, it was 95) and less than half of that behind it, 1.6 times as far when you sprint, so a hunter walks
  up slowly from behind and shoots from where the bow carries; it **runs the open way**, not straight away from you into the
  sea (nine headings fanned round "away", the one with the longest clear run by `scene.walk`, chosen again every half
  second), at 1.7 times its speed (faster than your sprint); it runs until you are 3.2 reaches off, then **stands and
  watches you** a while before it grazes again where it stopped. An arrow that hits sets it running. **Checked by script**
  on the starter island: sprinted at from the front it was off at about 230 units and kept ahead along the shore; it was
  never still with the hero near. Not done: the bow's draw as a held pose.
  **The wounded deer and the herd (2026-10-14, the play-through's point 5: "the deer runs when you come close, and runs
  when hit by an arrow, so you chase it for ever: feels impossible to kill"). Every number is mine.** In the engine
  (`SHY` in `src/combat.js`, `api.shy`): **a hit shy beast bleeds** (`e.bleedT` 40 s, `bleedTick`: 0.14 health a second at
  first, fading as it clots, about 3.8 in all against a deer's 5, so one wood arrow (1.4) bleeds a deer out in about 37 s
  and a second arrow on the standing deer ends it in 17; a new hit opens it again), **its wounds slow it** (its run by 0.7
  of the share of health lost, `woundOf`) **and shorten its runs** (it stops and stands at 3.2 reaches less 0.6 of the
  same: 568 units after one arrow, 737 unhurt), and **bleeding it leaves blood on the ground** (`api.onBlood(x, y, k,
  pool)`: a drop every 16 units of its run, a pool every 2.5 s where it stands; the page's `onBlood` keeps them as
  decals of kind `blood`, `drawBlood`, aged by `bloodTick`, gone after 240 s, at most 160, never saved), so a hunter
  shoots once and follows the trail to where it stands or lies; bled out it dies as a beast dies (`killEnemy`, the
  drops at the body, `e.bledOut`). **The herd:** `ANIMALS.deer.herd` [2, 3] places two or three at one home (`herdOf` in
  the page: `e.herd` an id, the first `e.watch`), **the watcher keeps its head up** (`shyK`: it sees as far behind it as
  before it, 230; a grazer 103 behind), **a herd runs when any of it runs or is struck** (`herdWake`), **runs the way its
  watcher runs** (`herdLead`, its `fleeAng`), **stops when he stops and grazes round where he grazes** (their wander home
  is his), so a herd stays a herd after a fright. **Found on the way: a deer that stopped running vanished from the
  world since 2026-10-13.** Its stand-and-watch timer was kept in `e.fled`, and `e.fled` is what the enemy list drops a
  man for who has run off; it is `e.watchT` now. That, more than anything, was the chase that never ended: the deer you
  followed was gone at 736 units and another stood somewhere else. `tests/deer.js` (in `npm test`) checks the herd's
  waking, the grazer's blind side, the unhurt deer against the shot one (pace, where it stops, when it dies, the blood)
  and the second arrow. **In the pane:** a grazer stalked from 250 units behind it took the arrow where it stood, its herd
  ran together and grazed again 120 units apart, the deer stood at 6 s and bled out at 27 s with the hero walking after
  the drops, its meat and leather beside it. **Not done:** the start script's hunter (`ST.deer`) still chases instead of
  stalking; a wounded deer's head is not down (no such clip); the bow's draw as a held pose.
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
- **Houses, doorways and reach (2026-10-09, Robin's three notes: the hut was tiny beside the hero, things stood in front of doors, E
  worked through walls):** the standard for a generated house was 4 by 3 tiles inside at least (**since 2026-10-13 a house is 4 by
  6 at least: see "House sizes" below**).
  **Doorways are kept clear:** after a village's props and nature are planted, `hamletBuild` removes every solid prop within a tile
  and a half of the tile outside each door and the one beyond (`V2.lots`, the door side and `dx`/`dy`). **E never works through a
  wall:** `canReach(P, it)` asks that the hero's tile and the thing's tile lie in the same room of `roomInfo`, or both outside; the
  bed, seats, chests, racks, the charcoal clamp and every station (`stationNear`) check it. Checked in the pane: a chair inside a
  village house answers E from inside and not from outside its wall.
- **House sizes (2026-10-13, Robin: "Fix the house sizes so that they make sense. I feel like they are way too small today. It
  doesn't feel like houses").** A tile is 1.5 m, so the old house (4 or 5 by 3 or 4 tiles) was a shed of 6 by 4.5 m with a bed, a
  hearth and a chest filling it: a man with a weapon corked the room. **Houses are now narrow and long, at the sizes they were
  dug up at**, and a house runs back from the side its door is on, its gable end and its door toward the yard
  (`BUILD` in `src/village.js`, where a building's `w` is its length; `houseSize(door)`; `size(id)` has no jitter any more):
  **a house 4 across (5 for one in three of the better off) and 6 to 9 long** (6 by 9 to 13.5 m: Dublin's town houses were about
  9 by 6 m, Hedeby's up to 17 long); **a farm's longhouse 5 by 14 to 18** (a small place's 10 to 13: `ARCH.long`); **the jarl's
  hall 6 by 20 to 22** (9 by 30 m, the Trelleborg type) with **two rows of posts down it** (`V.posts`, written into `B.posts` by
  `hamletBuild`: they stand, they are solid, and there is cover behind them), two or three hearths on its middle line, tables and
  benches along the far wall, beds at both ends, the high seat and the jarl's chest at one end; **the church 4 by 8 or 9** (a nave
  as at Escomb, a tile wider than it was so two can pass the pews); store 3 by 2, byre 5 or 6 by 3, smithy 4 by 3, boathouse 6 to
  8 by 3. A home is furnished by its length (`inH(name, a, c)`: tiles in from the door end and across): the hearth off the
  middle line so the way from the door to the beds is clear, beds at the far end, table and bench along one wall. A long south or
  east wall has a window every third tile; a door in an end wall keeps off the corners. **Sites and yards grew with them**
  (`ARCH`: a village's site 54 by 38 tiles, a town's 70 by 50, a farmstead's 34 by 26), the ring's places are counted from what
  already stands (so nothing overlaps whatever its length), a long yard takes two houses a side, and an outbuilding with no room
  where it belongs tries the big building's other end and the outside of the ring (a town used to lose its storehouse to the
  church). **What it gives** (`node tools/roomsize.js`: a room's free floor and the widest circle clear of things): a house has
  2.8 to 4.3 tiles of clear floor (it was 1.4 to 2.2: under 2 a man corks the room, 3 is a fight with a dodge), the longhouse 4.1
  to 4.4, the hall 4.6 to 4.8. A house is half the screen long, a hall longer than the screen. **The starter island's steading
  grew too** (`villageSite` 22 by 16 tiles; the burnt hall 10 by 5, the hut that still stands and the plank house by the well
  6 by 4). **The layout key ends `:h2`**, so older saves start fresh. `node tools/visual/villages.js [seed] [archetypes] [zoom]
  [wealth]` draws them (a cell holds the largest site; the hero's height is marked). **My choices, not Robin's:** the numbers, and
  that the player's own first hut is not held to any size. `docs/idea-bank.md` has the study behind it ("House sizes").
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
- **The editors and modes cleaned up again (2026-10-13, Robin: look through all the editors and modes, clean and remove what we do
  not need, fix the menus, streamline, work on the chapters one at a time but connected).** **The Art Editor's Creatures tab is
  gone** (the drawn animals and trolls with their sliders: every beast is a Blender sheet in the game and the arena, and the drawn
  creatures are only what shows while a sheet loads); `lib.applyStored` no longer applies a stored `game.creatures` design (it
  removes the key, with `creature.library` and `creatureeditor2.meta`), so a design made long ago cannot change a beast's
  numbers. **The drawn figures' render scripts were removed** (`tools/visual/figures.js`, `heroes.js`, `herobig.js`, `folk.js`,
  `poses.js`, `chop.js`, `swing.js`, `swingdirs.js`, `walkcycle.js`, `facings.js`, `attackstyles.js`, `sit.js`, `creatures.js`,
  `animals.js`, `trolls.js`, `trollface.js`, `views.js`, `look.js`, and the scratch `movetest2`, `northtest`, `shots2`, `sweep3/5/6`):
  where this file names one of them it is history. **A board taller than the screen scrolls** (`panel()` in the game: its rows
  are clipped to the screen, a strip at the right shows where you are, the wheel over it moves them, `panelScroll`,
  `panelWheel`; the Admin board had outgrown the screen, which was the menu that could not scroll). **The start page is laid
  out by chapter** (see `index.html` in the table). **The Combat Arena was rebuilt** (see its row). `docs/creatures.md` is marked
  superseded; `README.md`'s tables are current again.
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
- **The start played again (2026-10-12, Robin: work on the starter island; play it through first):**
  `tools/visual/startplay.js` plays a fresh game from the wreck to the raft in the page (load `tools/visual/drive.js`, write the
  page again, load the script, then **one step a call**: `ST.land()`, `tools`, `wood`, `stoneAndFiber`, `arms`, `boar`, `deer`,
  `home`, `brokk`, `bench`, `raft`, `cross`, `night`). It walks and swings by the keys, ticks walking and waiting without a
  picture (`debug().tick`) and draws what falls or dies (**a felled tree becomes a trunk only in a drawn frame**); where it jumps
  the hero to a place or adds to the bag, its line says so. **The browser tool cuts a script off after about half a minute, and
  one cut off in mid-frame leaves the game's loop dead** (`H2.ready()` false; no error is thrown: reload and go on from the save).
  **Found and fixed:** (1) **"your home" was only a room within 500 units of the wreck**, so a home by the steading (1255 units
  off in that world) never counted and **Brokk never taught the raft**: `baseComfort()` takes the best room anywhere on the
  starter island (`homeIsle(x, y)`: the island whose shore is nearest). (2) **A boar killed a new hero**: 12 health and 14 a blow
  against a wooden club's 0.6 to 1. **The starter island's boars are young** (`ANIMALS.boar.young`: 6 health, 7 damage, drawn at
  0.84; `youngOne(e, k)` at both places a boar is put on island 0; `e.young`, `e.sizeK` in the sprite's scale): two test fights
  left the hero at 30 and at 65 health. The big island's boars are as before. (3) Brokk's raft line spoke of "a hide or two" that
  the raft never took. (4) **E did nothing at a raft bench just set down** (`yardUsable` refused in build mode, though a
  workbench and a bed answer there). **The numbers, for Robin to judge:** landing, 12 wood and 9 stone in 12 s; a pine felled in
  4 s and its 12 wood in the bag in 15, a birch by the back cut in 3 s (10 wood); a rock's 3 stone in a second, five bushes 9
  fiber; a furnished hut (Comfort 5) costs 44 wood, 3 stone, 8 fiber, 2 leather, the raft bench 12 wood and 4 fiber, the raft 6
  wood and 6 fiber; the crossing 68 s; "You have left the island" at day 1, 7:08 of a run that jumped to Brokk and to the beach.
  The first night: three wolves; forty seconds by the fire in the hut gained 24 health and the pack gave up; sleep gave day 2 and
  ten minutes rested. **Seen and left alone:** animal counts scale with area, so the starter island has 16 boars, about 20 deer
  and 12 adders; nothing points from the wreck to the steading; death costs nothing (you rise at the wreck with everything); the
  deer got away from the bot's ten arrows (the bow aims by the mouse). `docs/chapters.md` chapter 1 lists them.
- **Ready for the first play-through (2026-10-14, Robin: a manual test from the beginning to the big island; make sure it is
  all ready, rebalance the drops with a parameter to treble them when testing, check crafting and cooking, berries that drop on
  E, a list of what to test, an error log). `docs/playtest-1.md` is the list for Robin, the balance table and what the
  scripted play-through found.** **Berries drop from the bush on E** (`pickBerries`: `yieldDrop('berries', ...)`, three of
  them, picked up like anything that drops; they laid themselves in the bag before). **Fiber is 3 a bush** (`BUSH_FIBER` in `src/gather.js`, which is the one the cutting reads; the page's constant of the same name is kept alike; was 2:
  the chain to the raft wants about 22 fiber, eight bushes now instead of eleven; wood, stone, berries and the beasts' drops
  are as they were, the table is in the doc). **Admin's "Threefold drops"** (`ADMIN.triple`, kept in `game.admin`; `yieldK()`,
  `yieldDrop(kind, x, y, n)`) multiplies what gathering gives (the harvest callbacks' `drop`), the beasts' drops, the berries,
  the weir's net and the veins' copper; nothing made, bought or taken from a chest. **The error log:** every error the page
  throws (window `error` and `unhandledrejection`, `console.error`, and anything thrown inside a frame, which `frame` now
  catches round `frame1` so the game goes on instead of the loop dying silently) goes into `ERR.lines` (`logErr(kind, msg,
  stack)`: the real time, the kind, the message, the day and clock, where the hero stood and the frame log's state words, the
  stack; the last 200 kept in `game.errlog`), a toast says so once a minute at most, Admin's **"Download the error log"**
  saves `errorlog.txt` (with the last sixty lines of the frame log), the frame log carries the errors at its end, and
  `Combat.api.debug().errlog()` reads it. **Hooks for scripts:** `cook(id)`, `dishes`, `cookFires()`, `hand()`, `yieldK()`,
  `logErr`. **`tools/visual/startplay.js`** has two new steps, `ST.berries()` and `ST.cook()`, and presses a bar slot only when
  the thing is not in hand already (`take(n)`: **the number of the thing in hand puts it away since 2026-10-13**, which had
  the old script fighting the boar with its fists and chopping with nothing, and is worth knowing when reading its lines),
  counts arrows as they fly (no quiver), and asks E through `eDo()`. **Played through on 2026-10-14 with no error logged:**
  the wreck, the tools, berries dropped and picked up, two trees, a rock and five bushes (9 fiber, 9 berries), the club and the
  bow (it shoots), a young boar (the careless bot wins with 9 of 93 left; a careful one loses 7), the hut at Comfort 5 (44 wood,
  3 stone, 8 fiber, 2 leather), roast meat and roast berries cooked and waiting at the campfire, Brokk's story and the raft
  taught, the raft bench on the sand, the raft laid and launched, the crossing in 68 s with "You have left the island".
- **Robin's first play-through (2026-10-14; `docs/playtest-1.md`, "Robin's report", has every point and the order I propose).
  Robin's direction from it, not yet built unless said:** a slower beginning that introduces things one at a time, with the
  broken house finished as the first home; **no sleeping in a bed with no roof, and a village's beds are not yours** (built:
  `bedWhy`: "No roof over it", "Not your bed"); combat not smooth or snappy enough, the club awful, **a parry stuns about a
  second, mobs stagger too easily, the red attack line is to go**; chopping and mining clunky and low in impact, **trees
  about three times bigger, trunks not twice the tree, chopping a trunk made satisfying**; rocks all alike; **bushes should
  shake**; the deer impossible to kill (runs when shot); **arrows thinner and faster** (built: `RANGED.bow` speed 420, the
  drawing half as thick); crafting "feels off" and can queue more than the bag holds (to be checked against Admin's Free);
  east and west walls hard to place; **thatch, not turf, on the villages** (built: `Village.DEF.turfBelow`); the bag's two
  bar rows too complicated, Q itself in question; the night's light slow to follow its message; the toasts and the way
  recipes appear not liked; **the steading too easy to find, Brokk's lines bad, the chat bubble bad**; **crates bigger and
  without a glint** (built: `SIZE` crate 0.55, chest 0.5; the loot glint gone); the yard perhaps models to customise, with
  hirdmen rowing; "You have left the island" not seen and the islands too close; K and X confused; the cave mouth pasted on;
  **the troll bigger, scarier, not met by stumbling on him**. From the sound studio: **the ambient sound and the waterfall
  go quiet when the window loses focus, as the music does** (built: `document.hasFocus()` in both).
- **After the play-through, the first three of its order built (2026-10-14; Robin: "Do 1, 2 and 3"). Nothing of it has been
  felt by Robin; the numbers are mine.**
  **1. The feel of a blow and a chop.** In `src/combat.js`: **a light hit no longer staggers a beast** (it flashes, squashes and
  is pushed, and goes on; an idle one turns to chase; only a heavy blow staggers, 0.34 s), as Robin found they staggered too
  easily; the men keep their flinch rules (the duel table rests on them). **A parry stuns** (`stun(e, MEN.parryStun)` 1.0 s:
  the state `stunned`, open to anything, a ring, sparks and the stagger sound; the soldier's states know it) for beasts
  and men alike, where a parry gave a 1.3 to 1.5 s daze that showed nothing. **The red attack marks are gone** (the beasts'
  red line, the men's line and wedge, the arc attack's wedge, which is `if (false &&` now): the tell is the body's drawn-back
  clip and **`tell(e)`** at the start of every windup, dust under the feet and a glint before the attacker; the Combat
  Arena's "Show the blows" keeps the geometry for tuning. **Quicker windups** for the hero (sword 0.13, axe 0.17, club 0.2,
  seax 0.08, spear 0.15, Dane axe 0.42; `STEPS` 0.13 and the last 0.2), the recoveries as they were, and the Snappy preset's
  hit pause and push a touch bigger (`fz` 0.7, `pf` 0.65, `kb` 1.0): the weight is in the stop, the answer to the press is
  quick. With the hero quicker the men are at **`MEN.hpK` 0.8** (0.75 yesterday): the ladder at 100 fights gives the tapper 71%
  against one man, the careful bot 100%, against two axes 64% (the skilled 87%), the careful hero with four friends against
  five 44 to 62%, five against five a coin. In `src/gather.js`: **the swing pace 1.5** (was 2), **a shake you can see** (a tree
  rocks about its foot and sways, a bush sways 5 units, a rock 1.4; 0.5 s), **four logs a trunk** (`logsPerTrunk`, eight
  blows), chips flying from the cut end, the bush shakes when its berries are picked, and a trunk is struck anywhere along
  its length (its `r` is half its length while it is offered). `tests/blows.js` holds (the Dane axe's rule is 0.4 s to land and
  over 1.1 s to be free again).
  **2. The trees.** Every tree is **baked three times its prop** (`World.TREE_BAKE`: oak, pine, birch, beech, ash and the
  struck tree 3, the apple 2.5, the mountain birch 1.8; `bakeProp`'s `sx`/`sy`, so it is sharp), the planted scale and the
  trunk's collision radius untouched: a pine is about 107 units tall now, nearly three heroes (it was 36, less than one),
  an oak 115. Everything that reads the sprite grows with it. **The trunk was twice the tree because `treeLen` took the
  sprite's top offset for its height** (a pine's box top lies far above the tree); it is 0.8 of the drawn height now, so a
  felled birch of 105 units lies 76 long with four logs in it, and **its thickness is by tree** (`TRUNK_W` in `src/gather.js`:
  oak 1.2 to birch 0.7 of the old radius; scaled by the bake it was fatter than the hero is tall).
  **3. The beginning.** **The steading lies 1500 to 2400 units from the wreck** (`villageSite`; it was 900 to 1600; 1939 in
  the pane's world). **The plank house by the well is the first home:** its bed is inside it (the whole wattle hut has a
  table and the crate instead), five of its wall pieces are gone and so is its roof, so E at the bed says "No roof over it"
  until the plank walls are mended and the roof comes back by itself. **The Building board starts with the plank house's
  own pieces** (plank wall, door, window, plank floor, thatch, a campfire) and **the first night slept under a roof opens the
  rest** (twenty-five pieces with `key: 'slept'`; `noteSeen('slept')` on waking roofed: "Something new to build"); the keys of
  2026-10-08 (leather, honey, copper, mason, charcoal, iron, silver, snake blood) stand over it. **Brokk's lines are
  rewritten** (`brokkLines`: he speaks as a man and names what the house still lacks in the waiting state, one line a thing),
  and **what anyone says is shown on a speech board** at the foot of the screen (`drawSpeech`, in the boards under the notes: a
  parchment in a wooden frame with the speaker's name over the line, the nearest speaker at a time, fading as the line's
  time runs out) **in place of the bubble** (`bubble` draws only the name over the head when you are near, and registers
  the speaker). The notes themselves are as they were: Robin wants another way for text to appear and did not say which;
  that is still open, with the crafting that "feels off".
- **Four more of the play-through's points (2026-10-14; Robin: "Do 1-4 and then 6" of the list I gave after the deer). Mine,
  unfelt.** **The night's pacing** (14): `light()` rises over the dusk as its share to the power `DUSK_POW` 2.4 (0.19 at the
  dusk's middle, 0.68 at six sevenths), so the evening stays golden and hardly darker for its first three minutes and the dark
  then falls faster and faster; **"The light is going" is said when `light()` passes `NOTE_AT` 0.25**, about two and a half
  minutes before full night, every moment after it darker (it came at the dusk's first second, five minutes before the dark). The
  clock is unchanged. **Rocks that differ** (5): `rockMat(K, seed)` in `src/stylelab.js` gives a stone one of six tones by its
  seed (the kit's grey, a lighter grey, a warm brown-grey, a dark blue-grey, a pale sandy one, a violet-grey), `rock()` has five
  builds (round, a flat slab, peaked, split by a crack, tall and leaning) with lichen on one in four and moss on half, a
  formation is mirrored by its seed, taller or squatter, in its own tone, with or without its moss and a fifth stone, a
  boulder's two stones differ in size and side; the world plants a rock in **six variations** (`ROCKV` in `src/world.js`;
  three before, and the three were near alike). The chalk rock keeps its own white. **East and west walls** (11): the leaning side face was turned on by default for an hour and **taken back the same day**
  (Robin: a wall at an angle might look odd; `Build.CFG.lean` is 0, the trial stays on the Destruction Editor's board). Instead
  **the build cursor marks the edge** (Robin: "a wide green marking if you are close to a wall that can be built, sort of like
  flashing with a flashlight"): in `drawGhost`, the edge the cursor is near gets a wide soft band of green light along it that
  breathes, the three other edges of that tile show faintly, and every wall that already stands within two tiles of the
  cursor is marked along its foot with a dotted white line, so you see where a wall would go and whether one is there.
  **And walls near the cursor fade** (Robin, the same hour: "maybe that nearby walls fade slightly"): in build mode a wall within 110
  units of the cursor is drawn at half strength at 60 units and less faded out to 110 (`fadeOf` in the items loop), so the ground and
  the edges behind it show. The band is 18 units to each side of the edge, breathing between 0.56 and 0.62 alpha. **The island gap** (19): `spec.gap` 240 tiles (150; about 200 tiles of water now, a raft's two minutes, a boat's one;
  the Sea Editor's game layout and `tools/visual/worlds.js` the same; the layout key carries the gap, so older saves start
  fresh). **"You have left the island"** came only from stepping ashore by E, which is why Robin never saw it; it now comes
  whenever you stand on land of another island, not aboard, not in a cave or the yard (`raftTick`, once a second).
- **The cave mouth cut into the rock (2026-10-14, the play-through's point 21: "the cave mouth looks pasted onto the mountain").**
  The Blender piece (`cave_mouth`: blocks of flat-shaded rock round the opening) sat on the painted wall in another hand. **The
  troll cave's mouth is now painted by the mountain painter itself**, in `mountainPixel` (`caveHere`, set per piece from
  `mtn.cave`): the wall's own rock, slabs and lichen run round an arch (`MW` 44 half width, `MH` 64 high, straight jambs and a
  round top with an uneven edge), inside it the floor runs back from trodden earth at the threshold through violet-brown into
  the dark with the sun as one soft patch on the floor and paler stones, the walls and roof go from dim rock to black with the
  left wall a little lit and a rib on the right, and the rock round the arch is lit along its left and top, dark under its
  right, with the ink line at the edge. The page still keeps the `cave_mouth` prop for the place (E, the troll's walks) but
  marks it `painted` and draws nothing for it. **The mine's and the sea cave's mouths are still the Blender pieces** (they are
  not on the big island; `mtn.noPaintMouth` would turn the painting off). My look, not Robin's; the scree and the skull of
  the Blender piece are not painted yet. `docs/cave-mouth.png` is the older before-and-after.
- **The beginning that grows (2026-10-14; Robin: "Yes, do all this" to my five points on being overwhelmed at the start, and his own
  additions: big steps announced on a bordered board, Brokk as the gate, only the basic pieces, Brokk naming what the house still
  lacks). Built the same day, in three commits (one bar first, see "Controls and modes").** **C is gone, and Tab is one screen (the
  second pass the same evening, from Robin's Valheim picture: the bag bottom left with the character panel over it, the crafting
  panel on the right):** `CHAR` sits top left (126 by 104, `CHAR_H`; the hero at 1.35, the gear slots 15 apart; a Stats or Ring
  page makes it 238 tall and it lies over the bag), the bag under it (`INV.x` 8, the bar row at `BAR.y` 114, sliding in from the
  left), and **the recipe board on the right** (`openInfo`: 180 by 200 at x 212, y 22, the list 66 wide: **the middle of the screen stays
  clear, so the hero is seen and can keep moving with the screen open**, Robin's rule; the list and the page as before). **Tab
  opens all of it** with the board for where you stand (`craftTabHere`: the bench, the hearth or the furnace beside you, else By
  hand; `menuFrom` 'tab' gives the tabs By hand plus whichever station is near), **E at a station opens the same screen** with
  that station's board, and E or Tab closes both. **An open chest takes the right side instead** (`STORE_UI` at x 266, sliding in
  from the right). The panel's title is "You" and its tabs are `chTabs()`: Gear always, **Stats after the first kill**
  (`seen.fought`), **Ring once a ring is worn**. (A Make page on the panel lived for an hour in between; it is gone.) **Robin's second look:** the bag's bar row is always
  drawn (only the hotbar at the foot of the screen waits for the first tool), and **every gear slot shows** (the necklace, the
  two rings, the two trinkets and the arm ring were hidden until something could fill them, since the UI review): the panel is
  112 tall with slots 12.5 apart, the bag's cells 17 (`CELL`), so the column fits in 250. The hotbar's label names B only. **Robin's third look ("still covering a lot of the screen; the icons outside the panel; the 1 to
  6 as part of the bag's slots; the crafting panel smaller, no By hand, the list smaller"):** the panel is 102 wide with the slots
  well inside it and the hero at 1.1; **the bag is one board of five rows, its first row the bar** (`CELL` 15, a thin line under
  the row; `BAR` is only a name for its top now); **the crafting board is a narrow column** (118 by 198 at x 274, y 46, **lower right under the chart**, Robin: not hanging from
  the top; the list of six rows of 11 above the page, **no tabs at all**: what you can make by hand is in every list, under its own headings, after the
  station's own things (`infoList`), so a hearth's list is its dishes and then the hand recipes; `infoCan` asks for a roofed
  bench only of a bench recipe). The lists' `menuTabs` is kept for the Building board's row. **The interface grows:** the hotbar is
  not drawn until a thing has been put on the bar (`seen.bar`, set by `barPut`; the engine's `api.hideBar`; the bag's bar row
  likewise), **B does nothing until Brokk's word** (`seen.build`, set when his story's last line is heard: a test scene or the
  sandbox sets it with `seen.met`), the Building board holds the plank house's six pieces until the first night under a roof
  (as before). **The big steps are boards** (`bigStep(title, line)`, `banner`, drawn where the "left the island" banner was, which
  is one of them now): "Your bar" at the first tool, "Building" at Brokk's word, "The raft" when he has taught it (the toast is
  gone), "You have left the island". **The wreck is the first wood:** E at it, "Pry a plank from the wreck", four times three
  wood (`WRECK_PRIES`, `WRECK_WOOD`, `wreckNear`, `seen.pried`), and only four branches lie about (`CAMP_WOOD`; the nine stones stay).
  **A sign to the steading, not a hint:** `layCairns()` (every start, in `villageClear`) lays trail stones from the wreck's beach
  toward the steading every 230 units, each in sight of the last (`o.cairn`; six in the pane's world). **No more "Something new to
  make" or "to build"** (`noteSeen` only records): a thing never yet made carries a **gold dot** on the Make page, the recipe
  boards and the Building board (`isNew`, `markMade`, `seen.made`; a piece under `p:<id>:<m>`). **The key reminders** are three
  again, in order: "E at the wreck", "Walk over the things lying about", "Tab" (until the first tool), then "1 to 6". **Brokk's
  wait lines** name the first thing the house lacks (a fire, a bench, something on the floor), as rewritten the same day.
  **Played through in the pane:** pried four planks (12 wood), Tab, the axe from the Make page, the bar board, B dead before
  Brokk, his fourth line and the Building board, B alive with six pieces, a hut at comfort 5, his three raft lines and the raft
  board. **Not done:** smoke seen from afar (the chart's question mark and the cairns are the sign); the notes still stack as
  they did (under a board now, never over it); the shipyard tiers and the rest of the keys are as they were.
- **The fish weir (2026-10-12, Robin's pick of the finds for the starter island):** `weirPlace()` (every start, after
  `villageClear`) walks out from the island's middle along every bearing to the shore and takes shallow water off a beach 320 to
  1500 units from the wreck, by choice nearest the way from the wreck to the steading: a `fishWeir` (stakes and wattle) in the
  shallows and a `fishingNet` hung on the beach beside it (`weirNet`). **E "Take down the net"** (`weirNear`, `weirTake`) gives 4
  fiber and the net is gone for good (`gone`). Left by people: the first sign that somebody lived here, and the fiber for the
  first lashings. It gives no fish (fishing stays in the lowlands, Robin). `Combat.api.debug().weir()`; `docs/fish-weir.jpg`.
- **The shipwright’s bench (step 8, 2026-10-05):** a board piece (12 wood, 2 stone; prop `shipwright`: two trestles carrying
  a keel timber with its curled stem and the first ribs; `it.ship`). It only goes on **sand** (`code` 1) within 4 tiles
  of the sea (`nearWater`), and only when your home has **Comfort 4** (`baseComfort`); the cursor says which is
  missing ("Build it on the sand", "Build it at the water’s edge", "Your home needs a roof, a fire, a workbench and
  a rug first"). Standing within 70 units of it adds a **Shipwright** tab to the B board (`shipNear`); its recipes
  are `RECIPES2` entries with `at: 'ship'`. The **raft** recipe (20 wood, 10 fiber, 2 leather) has `taught: 'raft'`,
  so `known()` is false until Brokk has taught it (`seen.raft`; the cell says "Someone must teach you this"), and
  `soon: true` until step 9 builds the raft. Hints: speak to Brokk again once the home is ready, then build the
  bench at the water.
- **The hulls (2026-10-13, decided by Robin: "Do it" to the recommendation of `docs/boats.md`): a vessel is a design chosen in the
  yard and laid at once; the fitting out is the player's.** `Yard.HULLS` in `src/yard.js`: **faering** (4 keel cells, 1 to 2
  seats, no mast; 10 wood, 3 copper), **boat** (6 cells, 1 to 3 seats; 14 wood, 5 copper), **karve** (9 cells, 2 to 6 seats, a
  mast on cell 5, the steering oar on cell 1; 24 wood, 8 iron bars) and **longship** (16 cells, 4 to 13 seats, 26 oars, a mast on
  cell 8; 44 wood, 16 iron bars; about eleven heroes long, longer than the screen), each with `beam` (how many strake rows it
  carries amidships), `thwarts` [min, max], `mast` and `rudder` (the cells they must go on), `tier`, `cost`, `zoom` and a line
  of text. **The hull's shape is the design's** (`hullProfile`, `shapeK`: full amidships, drawing in to the stems), not laid
  strakes: the keel and strake parts are gone from the parts strip, and the yard draws the chosen hull on its floor
  (`hullCellsOf`: the keel on row `KJ` 3, cells 1 to n, up to two strake rows a side) with the mast's, the steering oar's and
  the stem's cells marked. **The parts** (`ALL_PARTS`): the raft's three as before; for a hull **rowing seat** (anywhere on the
  hull, not on the mast's or the oar's cell), **mast**, **sail** and **steering oar** (the rigged hulls, on their cells), a
  **dragon stem** (at the bow; copper on a boat, iron on a ship) and **shields on the rail** (rigged hulls, laid once anywhere).
  `PLANS[hull].checks` come from the design (`hullChecks`: seats between min and max, the rig on its cells, one stem, one row of
  shields) and the scene's `check()` adds the hull's price ("The hull costs 24 wood, 8 iron bars: not enough"); **the hull is
  paid when the vessel is launched** (`Yard.hullCost`; the game's `yardFinish` pays it), the parts as they are laid. **The yard is
  as long as the hull and two** (`scene.setPlan`: `Y.W` = n + 2, the camera's zoom per hull: 1.1, the karve 0.95, the longship
  0.58, shifted right of the parts strip by `SHIFT`; the game and the Sea Editor take the zoom from `cam().z` every frame), and
  the plan tabs are Raft, Faering, Boat, Karve, Longship by the bench's tier (`PLAN_TIER`: raft 1, faering and boat 2, karve
  and longship 3). **Afloat:** `fit` takes the hull's profile and the laid parts (seats, `rowers` two a seat, `mastX`, `sail`,
  `rudder`, `dragon`, `shields`); `drawBoat` draws the design's hull with the seats as laid, the shields as leaning discs along
  both rails (red, bone, blue), the dragon's neck and head at the bow in place of the curl, the steering oar only once it is
  bound, the rig only with a mast. **Handling per hull** (`HANDLING`: faering 92 and nimble, boat 100, karve 115, longship 128
  and slow to turn) with **`rowK` per hull** (what each rower adds: a faering's 0.1, a longship's 0.03, so twenty-six oars give
  78%, not 180%). `Yard.isShip(kind)`, `rigged(kind)` (a mast: the wind, the steering oar, standing at the stern) and
  `nameOf(kind)` are what the game asks instead of `kind === 'boat' || 'karve'`. **A vessel saved with its strakes** (before
  this) keeps its kind and its seats on the design's hull (`scene.enter` drops laid hull parts from a saved yard). `tests/karve.js`
  checks every hull's rules, where the yard lets a part go, the fit and the sailing; `node tools/visual/boats.js` renders them
  all (`docs/boats.jpg`). **Not done:** the rowing clip (rowers sit, the oars pull by themselves), the sail's colours, the ship's
  name, the knarr with its hold, the Sea Editor's own four old ship kinds (still there beside the yard's). **What the older
  paragraphs below say about laying a keel and strakes is history.**
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
  cost, names and looks; `Hird.roll(R)` makes a person, `figureSpec` their figure. The Hird Editor (removed 2026-10-09)
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
  index; `baseComfort()` is the best room anywhere on the starter island, `homeIsle`, since 2026-10-12; it was the best within
  500 units of the wreck, so a home built by the steading never counted and Brokk never taught the raft). The dial
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
- **The character panel** (since 2026-10-14 top left over the bag, with the crafting board on the right: see "The beginning that
  grows"; what follows is the older layout) slid in from the left on Tab while the bag slid in from the right (one key, two
  boards; Robin: fewer menus). Wood outside, leather inside; the hero drawn large and turning in the middle
  (`playerD`, like the Character Editor), five equipment slots on the left (helmet, cloak, tunic, trousers, boots)
  and four on the right (sword, shield, bow, amulet), all with faint glyphs when empty; only the sword and bow are
  "equipped" and nothing can be changed yet. **The quiver is gone since 2026-10-13** (Robin: remove the arrow slots, a better
  way to carry arrows is to be found; "for now, let ranged weapons shoot without ammo so we easily can test"): `canShoot`
  is true with any ranged thing in hand, a shot costs nothing, no arrow lies to be picked up, the arrow recipes are not
  listed (`known`), and the panel has no arrow slots; the `quiver` data stays in the save, unused. Thrown things (a javelin,
  a throwing axe) still fly away and lie. What was here before: **the quiver**: three arrow slots (one arrow type each, up to 40),
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
  finds a flat 22 by 16 tile stretch of grass (14 by 12 until 2026-10-13: see "House sizes") **900 to 1600 from camp** (Robin, 2026-10-08: a wander first; nearer only when the island
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
  56 units slide toward you if the bag has room. **C opens what you make by hand** (since 2026-10-12; it was on B's board). Guidance is
  subtle (Robin): the only hint line is three bare key reminders at the start (`HINTS`: "Walk over the things lying
  about", "Press C" (it was B until 2026-10-12), "Press Q"), each gone when its condition is met; nothing states a goal. The chart marks the camp's fire, and the
  steading once you have come within 380 of it (`seen.village`). Drops per thing (`TREE_WOOD` oak 6, pine 5,
  birch 4; `ROCK_STONE` rock 3, formation 6; bushes 2 fiber, berry bushes 3 berries and 1 fiber): a day's work
  reaches 40 wood, 20 stone and 15 fiber. Deer (2 hide) and a boar (1 hide) live within 800 to 900 of camp
  (`nearN`, `nearMax` in `ANIMALS`). **The drying rack** (`dryingRack` pieces, the village's included): E hangs
  hide on it (up to 4), 90 seconds later E collects leather (`rackUse`, `rack.hang` saved with the building;
  wrecking returns the hide); `leather` is a kind of its own in the bag.
- **Sound:** on in the game (`S.sound = true`); the Combat Arena's synthesized set copied into the page, plus
  chop, clink, fall, pick, craft and build. The engine calls `sfx('chop'|'clink')` on tool hits.
- **Ambient sound (2026-10-12, Robin: ambient sounds; his answer: synthesized in code, like all the sound).** `src/ambient.js`
  (`Ambient.make(AC, dest)`), no sound files: every layer is looped noise through filters (a *bed*, eased toward a loudness) or
  short tones and snatches of noise (single sounds). The page tells it a few times a second what is round the hero
  (`ambEnv`: `trees` how wooded within 260 units, `shore` how near the **open** sea is (`openSea`: water that goes on, so a tarn
  makes no surf), `aboard` and `sail`, `fells` the mountain's level, `night`, `dusk`, `dawn`, `fire` how near one burns
  (`nearestFire`), `torch`, `brook` how near the waterfall's water is, `wind` from the game's own wind, `cave` the kind of
  cave he is in) and calls `amb.tick(dt)` every frame.
  **The layers:** **wind** (brown noise through a band that opens with every gust; leaves rustling with it where trees are; a
  thin whistle on the plateau and under the peaks; louder up there and aboard, softer in a wood and at night), **the sea** (a
  wave every five to nine seconds, the swell and then the wash drawing back; aboard, water along the hull by the speed and a
  slap under the bow), **birds** by day, more the more trees there are and most at dawn (a tit's two notes, a warbler, a
  blackbird's phrase, a finch's falling trill, a sparrow, the cuckoo now and then, a woodpecker drumming, a crow over open
  ground, a raven on the fells, gulls by the shore; an owl at night), **crickets** from dusk on (three of them, each its own
  pitch, one voice a trill), **fire** (its low roar, crackles, a pop; a torch in the hand a little), **running water** by the
  brook, and **in a cave** nothing of the world outside: a low tone, drops heard twice (the second fainter and from the other
  side), the mine's timber creaking, the sea cave's slow boom and the lap of its water. **Footsteps** (`amb.step(ground)`): one
  every stride on foot (27 units, 34 at a sprint), by the ground under the hero (`groundUnder`: grass, sand, rock, gravel, wood,
  water; built floors and docks by their material, the peaks' scree rock, a slope gravel), ringing a second time in a cave.
  **Loudness:** the Escape menu's second bar, **Sounds of the world** (`OPTS.amb`, 0.7; kept in `game.opts`); silent in the
  menu, asleep and when the window is hidden. The waterfall's own voice (`fallsSound`) follows the same bar.
  **I cannot hear it.** What I could do: measure it (rendered on an `OfflineAudioContext` in the pane, each layer alone: at the
  bar's 70% a wood by day lies at about -37 dB, its loudest moment -20; the game's own chop peaks at -17 and a sword's blow at
  -10) and test its logic (`tests/ambient.js`, in `npm test`: twenty minutes in each of twelve places on a pretend audio
  context; a line says how many of each sound a minute, and flags birds in a cave, crickets by day, a fire where there is none,
  or sounds piling up). **Whether it sounds right is for Robin's ear:** the Admin board's **Light and sound** board has a switch
  for every layer (`LAB.snd`, kept in `game.lab`), so one can be heard alone or turned off and named. Debug:
  `Combat.api.debug().amb()`, `.ambEnv()`, `.groundUnder()`.
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
  what a fire does. **Copper is not on the starter island** (`markOre` skips island 0); it begins on the big island (since 2026-10-12 as veins in the open cliffs of its small mountain, then) with
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
- **The meadow by day and by night, recorded (2026-10-15; the sound studio's handoff, `C:\dev\SG Sound\out\music\HANDOFF-meadow-day-night.md`;
  Robin: "tell the game to use the new meadows day and night soundtrack").** `assets/music/meadow-day.mp3` (3:23) and `meadow-night.mp3`
  (2:40, dusk to dawn) play in place of the synthesized `meadowDay` and `meadowEvening` (`MUSIC_FILES`, `fileOf`), unless the Song
  Editor's "Use in the game" picked another song (it no longer does: see below). **The studio's MP3s,
  not its WAVs** (7 MB against 70): an MP3 starts with the encoder's 1105 samples of delay, measured in Chrome against the WAVs
  (the same offset at the head and the tail of both, the join as smooth as the WAV's), so each loops from 1105 to 1105 plus the
  studio's loop length at 48 kHz (`loopStart`, `loopEnd` in seconds, so a 44.1 kHz context is right too). `src/music.js` has the
  player: `loadTrack(url)` (fetch and decode, kept by url), `playTrack(url, { loopStart, loopEnd, fade, fadeIn })` (a looping
  buffer through its own gain into the music master, so the volume bar, the hush on a lost focus and a hidden page apply; it
  crossfades from the track playing and stops a synthesized song), `stopTrack(fade)`, `releaseTrack(url)`, `trackPlaying()`.
  **At dusk and at dawn the two crossfade over seven seconds**; the next one is decoded 40 s before it is wanted and the old one
  let go 12 s after; one mix each, so the danger layer is skipped while a track plays. On `file://` the fetch fails and the
  synthesized song plays. Checked in the pane: the day loop in 0.4 s after the first key, the night at dusk and the day at dawn,
  no errors.
  **Robin did not hear them (the same day), and two things stood in the way:** `npm start` opens the pages from disk, where a
  page may not fetch a file beside it, so the synthesized song played; and a song handed over from the Song Editor took their
  place. Now **each MP3 is wrapped in a script** (`assets/music/meadow-day.js`, `meadow-night.js`: `window.__MUSIC[name]` = the
  file in base64, written by `node tools/musicjs.js <file.mp3> <name>`; `Music.loadTrack` adds the script, decodes the bytes and
  lets the string go), which loads from disk as from the server, and **the recorded loops are always the day and the night**
  (`dayTheme`, `eveTheme`; the Song Editor's "Use in the game" no longer changes the game's music). The bare MP3s are not in the
  repo; the studio's folder has them.
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
- **The Light and sound board (2026-10-12):** the Admin board's row **Light and sound** opens a second board of switches for
  trying things by eye and ear (`LAB`, kept in `game.lab`; `labRows`, `drawLab`, `labAct`): one for every layer of the ambient
  sound (`LAB.snd`) and one for every lighting technique on trial (`LAB.light`, `lightRows`, `lightAct`).
- **The lighting trials (2026-10-12, Robin: research how similar games make good lighting, test a few techniques, see what works
  best; the answers: fire and torch at night first, and atmosphere; pictures, then switches). `docs/lighting.md` has the research
  (Graveyard Keeper, Factorio, Red Blob Games, Octopath, the painters' rules), every technique, its verdict and the sources;
  the pictures are `docs/lighting-fire.jpg`, `-village.jpg`, `-air.jpg`.** Nine techniques, each a switch in `LAB.light` on the
  Light and sound board, all in `templates/game.html` under "the lighting trials" (`lt(k)` asks a switch).
  **Robin's look at them in the game (2026-10-12): "not sure about the lighting... it's more like some weird filter over it";
  the shadows that things throw were liked, but with the torch they "run quickly when walking".** What that was, seen at
  the size Robin plays at (see "Judge it at Robin's size" under Things to know): the light itself was dim and grey-yellow by the middle
  of its reach, so a lit place looked like a tinted sheet with a hole in it; dark and orange films were laid over every tree
  near a light, and with the torch each tree changed film as the hero walked past it; a fire indoors threw a hard wedge of light out
  of the door across the yard. **So, as it stands:**
  **`glow`** is the light's own colour now: **bright and warm at the fire, amber, ember-red, then the night** (`FIRE_T`,
  `TORCH_T`: the colours the ground should end at, by how far out; `warmGrad` takes the night's colour off them, since lights
  are added to it), so the ground by a fire shows its daylight colours; a gentle flicker (`flick`); a hot glow on the flame
  and a little warm haze, never for a fire under a roof you are not under (it hung on the roof).
  **`shadows`**: `nightFires()` lists the lights in view, `fireFor(x, y)` the one that falls hardest on a place, **`figLit(x, y,
  fig, hU)`** what it does to a thing standing there (`fig`: a figure; `hU`: its height, so **a shadow ends where the light
  does**); `drawFireShadows` in `scene.begin` lays every prop's and built thing's shape on the ground away from the fire
  (`shadowOf`, `silCol`), the hero and the beasts through `Sprites.cast(..., to)`. **A torch is carried**: it throws only
  faint, short shadows, and none from what stands within about 22 units (the nearest things are the ones whose shadows swing).
  **`sides`** is for **figures at a fire that stands** (the hero and the beasts: dark with a warm rim when between you and the
  fire, warmed beyond it; `opts.lit` in `Sprites.draw` and `Sprites.beast`); a prop only goes a little dark on the near side of
  a fire, with no rim and no warm film; a torch gives nothing of this.
  **`walls`** (`lightInto`): a fire **indoors** lights its own room when you stand in it, and otherwise **a soft pool of light
  on the ground just outside each door and window** (`roomOpenings`); a fire **outdoors** is a disc with a quad cut out behind
  every wall that `blocksLight`, the wall faces that look at it lit again; a lantern on a wall is left out of all that and
  lights what is round it; `drawWindowGlow`: windows of a room with a fire glow, a door shows light under it. **`moths`**.
  **The other four are off until Robin has looked** (they change the mood or the daylight, and each adds full-screen passes):
  **`moon`** (the night's blue lighter and bluer, colour drained from what no fire lights with the 'saturation' blend, `satCv`;
  `drawMoonSea`), **`mist`** (`mistK`, `drawMist`, `softTile`, `tileFill`), **`shafts`** (`drawShafts`), **`clouds`**
  (`drawClouds`). **Not done:** the villagers and Brokk (the ink figures) get a soft long shadow but no dark side or rim;
  normal maps, a colour table by the hour and anything that reads pixels back are out on a 2D canvas. **Cost:** within the
  noise in the pane (software drawing); not measured on Robin's graphics card. Debug: `Combat.api.debug().lab()`,
  `.nightFires()`, `.figLit(x, y, fig, hU)`.
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
- **The menus and boards reviewed (2026-10-12, Robin: look through all the menus, the crafting UI, the toolbar, the windows;
  function, looks, sense). `docs/ui-review.md` has the whole review and the proposals; this is what changed in the code.**
  **The wheel froze the game:** `stepPiece` called itself, so in build mode on a fresh game the wheel reaching a piece not
  yet known threw on every frame after (since 2026-10-08); it steps now, and the wheel goes through the known pieces.
  **Boards are drawn over the HUD:** the engine calls **`scene.boards(c, P)`** after its bars and hotbar (`render` in
  `src/combat.js`), and the page draws there, in one order, bottom to top: the bag and the character, the hint, the notes,
  the muster, the map, the book, the ring board, a test scene's board, the Escape menu, a recipe or Building board, and in
  the yard `Yard.scene.hud`. `scene.end` keeps what belongs to the world and the corner (the night, the chart, the E
  prompt, the build cursor's label, speech). In the yard `scene.noHud` is set as well as `noHotbar`.
  **E takes the thing you face:** `stationNear(P)` now chooses among the hearths, the benches, the furnace **and the beds,
  the chests and the seats** (reach 50, 56, 56, 40, 40, 34) by `facingScore`, kept for the frame (`pickC`); `bedNear`,
  `storeNear`, `seatNear` (and `seatFirst`, now the same thing) ask it, so the E prompt and the E key cannot disagree about
  built things. Before, a workbench answered from 56 units off before a chest was asked: in a 4 by 3 house the chest you
  faced opened the workbench. People, stones, racks, berries, boats and caves are still the two long fixed orders (the
  prompt's and the key's); making them one list is proposed. Debug: `usePick()`, `reach(it)`, `roomAt(x, y)`.
  **The hotbar:** a page with its own bar (`api.barSlots`) gets no round sword-and-bow icons, no "F" and no loose arrow
  count (`paged` in `drawHotbar`; the editors keep them); in build mode it shows the label and no slots; a slot may carry
  **`ammo`** (the page's `ammoOf`: arrows for a bow, stones for a sling), written in that slot, red at nothing.
  **Recipe boards:** `menuFrom` is set to `'E'` when a hearth or a furnace opens (they wore the workbench's tabs once a
  bench had been used) and E closes a furnace's board as it does a hearth's; the tale is as many lines as the page holds
  over the numbers, ending in an ellipsis if cut (it stopped at three, in mid-sentence); what it takes lies under the page.
  **The Escape menu** is `PAUSE_X` 92 wide `PAUSE_W` 216; a row with `sure: true` (Restart, New island) wants a second click
  within five seconds (`pauseArm`, `pauseArmed`); while it is open the game's keys rest (E opened a furnace's board over it).
  **The Building board** starts at y 30 (it lay over the health bars and touched the chart), draws no empty cells, and
  names the piece you point at in its tab row. **The bag:** both bars are numbered 1 to 6; the name of what you point at is
  at the left over the bag, with what a click does ("to your bar", "wear"). **The character panel:** the arm ring is a
  slot under the boots (`ringSlot` in `chSlots`; it was drawn across the quiver); Stats and Ring keep inside the
  stitching; Attack is whatever hand weapon is held (it counted the sword alone, and fists as 5), stamina's return is a row
  of its own; "Known, not cut" runs to the foot of the page. **Notes** are drawn over the bag, start beside the E prompt
  (`promptBox`) and, when a board lies over the hero, stack above its top edge (`drawNotes(c, top)`). **The Shipyard's**
  cursor label is under the part. The chart's frame, the E prompt and the cursor's label are the boards' ink (`UI_INK`)
  instead of the old navy. **Checked in the pane at 1200 by 750:** each of the above before and after; E at the chest, the
  bed (sleeps, day 2 to 3), the workbench, the furnace and the hearth in the test hut and in the play-through's hut; forty
  notches of the wheel; the other pages still run. **`tools/visual/ui.js`** drives the mouse and the keys on the page in
  the HUD's own units (`U.click`, `U.key`, `U.wheel`), takes pictures (`U.shot`, `U.crop`, `U.sheet`) and shows every board
  in another typeface without touching the game (`U.face`).
  **The second pass, Robin's answers (the same day: C yes; the map shows all for now; the readout as I think best; no
  trials of the looks; all of the list).** **C is making by hand** (`handCraft`: the By hand recipe board, anywhere; C, E or
  Esc closes it) and **B is building only** (the Building board; the first hint is "Press C"). **`eWhat(P)` is what E does,
  by one rule,** and the prompt and the key both ask it: `{ say, act }`, first what you are in the middle of (a fish on
  the line, the yard, a chest on the shoulder, the lookout, an open recipe board or ring board, a seat, the muster, the
  boat), then of the things each within its own reach the one you most nearly face (`facingScore`): a heavy chest, a
  sign, the raft, the raft bench, a cave's mouth or way out, the dead Viking, the hoard, a find, the built thing
  `stationNear` picked, the clamp, the weir's net, a fire ring, the lookout, an unread runestone, a claim stone, a
  workplace for a follower, a hirdman, Brokk, a villager, berries. **A new thing E can do is one `add(...)` line there.**
  Debug: `eWhat()`, `board()`. **One number:** `worldDmg(it)` (the engine now shows a blow's number to one decimal) and
  `thingLines(it)` (label, value, the difference from `heldLike(it)`) feed the card (`itemCard`, which also takes a
  stack's kind: `stackTale`, `foodLines`), the recipe page (`infoStats`) and the Stats page. **The Building board** is
  `buildCats()` as tabs (`BCATS` with the new `work`, `WORK_IDS`), eight pieces a row with name and `costRow`; `tabUi` is
  the one tab for every board; recipe lists have headings (`menu.show`). **The bag:** right click `useSlot`, Shift and
  click `transfer`, Shift and drag `splitTo`, `stackIn` draws a slot's thing for the bag and the chest. **Gear:**
  `gearFor(id)` hides a slot nothing can fill. **The map** has a north mark and `labels()` that keep off each other.
  **The frame readout** is on `ADMIN.fps` (bottom left, off by default; the log is kept either way). **"You have
  fallen"** is the page's board (`scene.ownFallen`). `costText` reads in the game's words. `docs/ui-review.md` section 7.
- **The frame log (2026-10-08, Robin: it lags when I walk):** a readout (since 2026-10-12 **bottom left, on Admin's "Show frame time"**; it was on the left in the middle, always on)
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
- **Villages across the islands (2026-10-07, Robin: lots of islands, lots of places; since 2026-10-09 the game spawns only the starter
  island and the big island, see Scope):** the world had **six islands** (`spec.sizes` 60, 230, 150, 110, 170, 90 tiles; `World.make` takes `sizes`; `layoutKey` includes them, so older saves start fresh; `onOtherIsland`
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
  `Combat.api.debug().raid()`. Not built: fire, traders closing to a known raider. (Men of yours who carry: built 2026-10-13 in the
  battle test scene, see "Fighting men", the raid.)
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

## Controls and modes (decided 2026-10-04; one bar and no Q since 2026-10-14)

**One bar (2026-10-14, Robin: the two bar rows looked weird and complicated and Q itself was in question; decided with the
rest of the beginning's redesign: the thing in hand decides the act).** The bar is the bag's top row, six slots, one in hand
(`hand`, an index, -1 for empty hands; `sel` the wheel's pick). A number key takes a thing in hand or puts it away, the wheel
moves the pick, Enter takes it. The engine's two modes are still there under it, but the page sets them from what is in hand
every frame (`handSync`): an axe, a pick, a knife or a rod is gather mode (chop, mine, cut, fish; `GATHER_KINDS`), anything
else, or empty hands, is fight mode. A tool bites a beast or a man at `TOOL_DMG` 0.8 of what the same thing would do as a
weapon (it was 0.5), so the axe in hand is what you swing at a boar. `BAR_OF` says what belongs on the bar (every weapon and
tool), `barPut` puts a new one in the first free slot. Q is no key of the game's (the Combat Arena keeps the engine's). The
bag has four rows under the bar (`BAG0` 6; 30 slots as before). An old save's `hand.fight` is taken as the hand. The start
script's `mode()` is a no-op and `takeKind(kind)` presses the slot that holds a kind. **What the two bullets below say about
a Fight bar and a Gather bar is history.**

The hero had two modes, switched with **Q**, each with its own six-slot bar at the bottom middle of the screen
(**rebuilt 2026-10-05**; Robin found the fixed sword-and-bow with F awkward).
- **The bars were the top two rows of the bag:** row one the Fight bar, row two the Gather bar, each numbered 1 to 6
  and marked with a tiny sword or axe. Anything can be dragged into them. A number key takes a weapon or tool in that
  slot **in hand**, eats food, or lights a torch; an empty slot means
  empty hands (fists in fight mode, nothing to swing in gather mode). The wheel steps the hand. The engine reads the hand
  through `Combat.api.items` (`held`, `tool(i)`, `weapon(kind)`), `api.barSlots(mode)` draws the bar and
  `api.barSelect(i)` takes the number keys; `handSync()` sets `P.tool` and `P.weapon` (a bow in hand is ranged) each
  frame. **F no longer swaps weapons** (it still toggles wrecking in build mode). A crafted weapon or tool goes to the
  first free slot of the bar (`barPut`), as does right-clicking one in the bag (swapping with the hand slot when the bar
  is full); loot fills the bag rows first (`addItem`, `addThing` start at `BAG0`). Old saves (24 slots, weapons in
  `equip`) are remapped on load.
- **Taking a thing in hand (2026-10-13, Robin: "as simple as scrolling to select it, and press the key; press the key again to
  unequip, like Valheim"):** a **number key** takes that slot's thing in hand, and the key of the thing already in hand **puts
  it away** (empty hands; `hand` -1). The **wheel** moves a pick along the bar (`sel`, outlined white on the hotbar:
  `bar.sel` in the engine's `drawHotbar`) without taking anything; **Enter** takes the pick in hand or puts it away. A
  one-handed weapon taken in hand **wears a shield from the bag** if the shield slot is empty (`shieldWithIt`; Robin: equipping
  a one-handed weapon should always equip the shield if you have one on you). The shield lives in the character panel's
  shield slot (a crafted or looted one goes there when it is empty, else to the bag; right click in the bag wears it), never
  on a bar.
- **Fight mode:** whatever weapon is in hand: a sword hits, a bow shoots, fists punch. **Gather mode:** a tool in hand. The right
  tool does full damage to a tree or a rock and any other half; a tool bites a beast at `TOOL_DMG`. No auto-pick, no highlight.
- **Worn gear** (`equip`): helmet, cloak, tunic, trousers, boots on the character panel's left, shield and amulet on its
  right. (The drawn hero's shield showed only when used, and Robin liked that. Since 2026-10-13 the Blender hero carries
  his on the arm whenever his weapon is out; Admin's "Shield only when raised" is the old way: see "The hero's shield".)
- **K, or the right mouse button (Fight mode):** raise your guard. With a shield on the arm it is a shield's; without, you
  fend with what you hold. Raised in the instant a blow lands it is a parry.
- **Build mode:** **B** enters it (no hammer item). In it **F** turns the cursor into a red crossed box that
  destroys pieces. Built in the game (see "The game").
- **X (2026-10-13):** draw your weapon, or put it away (among other people it is away until you draw it; a drawn blade is a threat).
- **C (2026-10-12):** what you make by hand, anywhere. **E:** use what you face (`eWhat`). **In the bag:** drag moves, right
  click uses, Shift and click sends across to a chest, Shift and drag carries half a stack.
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
- **The cave's inside reworked (2026-10-12, Robin: way more immersive, with depth; the mountain technique; a scary adventure you do
  not get lost in too much; light coming in through holes in the mountain, yet still a dark cave; a better floor).** The inside is
  now **`src/cave.js` (`Cave`)**, loaded by the game as `__CAVE__` and by Node. What the paragraphs above say about the troll, the
  veins, the hoard, the torch and mining still holds; **the layout and the painting are new**, and `caveChunk`, the five pockets
  and "the pool in the second pocket" are gone.
  **The layout** (`Cave.make(seed, { x, y, rockHp })`, 72 by 40 tiles, far east of the map as before): you come in **northward up a
  tunnel of daylight** (`cave.entrance`; the way out is E at `cave.exitAt`, the tunnel's foot, which is the south edge) into a
  **hall**, and **one way through** winds from there past a **hollow under a hole in the roof** (`cave.fern`), a chamber with the
  **still pool** (`cave.poolC`, `cave.pool`), a **cavern split by a chasm** that the way skirts along a ledge (`cave.ledge`,
  `cave.pit`), a **gallery of copper veins** (`cave.gallery`) to the **troll's lair** (`cave.lair`) and the nook behind it with the
  dead Viking (`cave.body`); **four pockets** lead off it and end (an ore rock or two in each). In half the worlds the whole cave
  is laid the other way round (`cave.flip`, by the seed: the lair in the west). Two smooth fields, cells 8 units wide: `D` (how far
  inside the floor a point is, in tiles) and `P` (the chasm); `Cave.floor(cave, x, y)` is `D >= 0` and not in the chasm, and the
  page's `caveFloor`/`caveD` wrap it. `cave.path` is the way through (the troll walks it home), `TR` the distance from it,
  `RC` the floor reached on foot from the way in (nothing is put on floor the chasm cuts off).
  **Depth, by the mountains' technique turned inside out:** the rock is the high ground. Every edge of floor with rock north of
  it carries a **wall face 64 pixels tall** (`WALLH`: panels of rock between fissures, beds and thin strata, water running down,
  rust, a lit ledge at its foot) that **fades up into the dark of the roof**; a wall east or west of the floor **stands back as
  it rises** (`SIDE` 16, the leaning column sweep of the mountains' side walls: lit where it faces west, dark where it faces
  east); the near wall, turned away from you, is a rim of rock with black beyond. **The chasm is the same thing downward**: the
  floor is the high ground and the wall under its edge falls 120 pixels (`PITH`) into black. All of it is worked out once over
  the whole cave on sheets a pixel a unit (`Cave.prepare`, about 70 ms) and painted in pieces of 256 units at 2 pixels a unit
  (`Cave.chunk`, one new piece a frame and the one under the view's middle at once; `Cave.dirty(cave)` when a vein is spent).
  **The floor:** bare grey rock mottled and damp along the walls, patches of grit and gravel, **the troll's own path worn pale
  down the middle of the way through** with his **footprints** in it going in, stones in clusters, cracks, **puddles** (a drop
  rings on one now and then), **moss and fern under every hole in the roof**, and **bones thicker the nearer his lair**.
  **Stalagmites and columns** stand on it (`cave.props`: props `stalagmite` and `caveColumn` in the kit, in the cave's own rock
  colours, `caveRock()`; solid, and you walk behind them).
  **Light** (`Cave.dark(c, cave, { cam, P, torch, clock, sun, W, H })`, called by the page's `drawCaveDark`, which adds the troll's
  eyes): a deep blue-black over everything with holes cut in it: your own circle (96 units, 190 with a torch), **the daylight up
  the tunnel**, **six holes in the roof** (`cave.shafts`: three big ones at the hollow, the pool and the chasm's ledge, three
  small ones between), the copper's glow at ore rocks and a glimpse of green at a vein. Over each hole a **beam** slants down
  from the upper left in narrow streaks with dust turning in it, fading into its pool of light. **The holes follow the sun**
  (`sun` is `1 - 0.85 * light()`): at night they give only moonlight. The cave stays dark: between two lights there are 290 to
  540 units of black along the way through (the screen is about 616 wide), so the next light is usually just in sight as you
  leave one.
  **Not getting lost (my choices; Robin has not ruled on them, and any can go):** one way through and pockets that end at once;
  walking from light to light; the worn path and the footprints; bones toward the lair; the daylight tunnel as the way out, seen
  from across the hall; and **a chart of the cave**: the corner chart and the M map show the cave as far as your light has shown
  it while you are inside (`Cave.see` each frame, 120 units or 200 with a torch; `Cave.drawChart`; saved as `caveSeen` with
  `Cave.seenStr`/`seenLoad`). No hint lines, no labels. A drop falls somewhere now and then (a quiet tone in `caveTick`).
  **In the game:** `caveSetup` ends with `Cave.make`; `caveTick`, `drawCaveFloor`, `drawCaveDark` and `pushCaveItems` go through
  the module; entering faces you north. The test boards have **To the cave's pool**, **To the chasm** and (the mountain board
  too) **To the troll's lair**; `Combat.api.debug().cave()` returns the cave. **Checked in the pane on both test scenes (a cave
  laid west):** in by E at the mouth, the whole way through by the keys in 28 s and back, out by E, the troll's walk home 75 s
  with no frame off the floor, the chart surviving a save and a reload, no console errors. **Checking it:** `tests/cave.js` (in
  `npm test`): twelve seeds, each line says whether the lair, the dead man, the pool, the ledge, the pockets, every ore rock and
  every standing thing can be walked to from the way in, and the light-to-light distances; `node tools/visual/cave.js [seed]
  [map|lit|dark|all]` (`npm run cave`) writes cave_map.png (the whole cave, the holes ringed), cave_lit.png (six places evenly
  lit, to judge the painting) and cave_dark.png (the same as the game shows them, by torch and by night too).
  `docs/cave-lit.jpg`, `docs/cave-dark.jpg` and `docs/cave-game.jpg` are the pictures of 2026-10-12.
  **The other caves (2026-10-12, Robin: more than troll caves; an old copper mine, a sea cave).** `Cave.make(seed, { kind })`:
  `'troll'` (the cave above, the default), `'mine'`, `'sea'`. The same sheets and painter, another lay-out: `base()` makes the
  fields from a list of shapes (ellipses, and **boxes for what people dug: straight walls**, with a third of the roughness) and
  `tools()` gives what lay-outs share (the foot of the wall north of a point, a vein, an ore rock, a clear spot). A kind has a
  tint for its floor and its walls (`tintF`, `tintW`).
  **The old mine** (`makeMine`; warm brown rock): an **adit** straight in from the daylight, a **main drift** in three reaches
  with crosscuts to **two worked-out stopes** and a dead end, **timber**: sets across the adit and the crosscuts (`cave.sets`,
  drawn by `Cave.drawSet` with the things that stand, so a cap passes over whoever has walked on through it; their posts are
  solid) and posts with a cap's end along the drift's far wall (`cave.posts`, painted); **soot up the walls where they set
  fires to crack the rock**, charcoal still lying there (`cave.soot`); a ladder, a bucket of ore, a sledge; water gathered in
  the first stope; one hole in the roof over the big stope, so it is **darker than the troll's cave and a torch matters**; a
  **fall of rock across the drift** (two great stones, `block: true`, three times a rock's toughness: the pick clears it) and
  beyond it **the deep stope** with the best veins (five to six lumps each) and **the man who never came out**. Seven veins,
  about 28 lumps of copper; nobody lives there.
  **The sea cave** (`makeSea`; blue-grey rock): **the sea comes in at the mouth** and fills the south of a great hall (`cave.S`,
  the water's depth in tiles, read like `D`; `Cave.sAt`; the sheets' kind 3; you wade all of it), painted clear at its edge,
  green then dark where it deepens, a pale line where it laps, the walls that stand in it wet and dark with weed and barnacles,
  short pale lines drifting in from the mouth; at the hall's back **a beach of shingle with a wreck on it under a hole in the
  roof**, weed thrown up along the water's edge, shells, **driftwood**, and a passage up to **a dry pocket where somebody hid a
  chest**. **The daylight carries far in over the water** (`cave.glows`: holes in the dark up the channel and into the hall,
  and the water's own green-blue shimmer there).
  **What lies there to be taken** (`cave.finds`; the game's `findNear`, `findTake`, E): the miner (Search: his copper pick and
  three lumps of ore), charcoal at the four fire-settings (Take), driftwood (Take: three wood, then gone from the floor), the
  chest (Open: seven to fourteen silver and an iron weapon, by the world's seed). A glint marks what is not yet taken.
  **In the game:** `cave` and `caveMouth` are still the troll's; **`caves`** holds every cave of the world (`{ kind, cave,
  mouth }`: the mine and the sea cave where the mountains have a place for them, their insides laid 1500 and 3000 units below
  the troll's in the same far-off ground), **`cur`** the one you are in and `here()` its inside: the floor, the dark, the things,
  mining, the solids and the chart all ask `here()`, and the troll's own (his eyes, the hoard, the dead Viking, `caveHear`) ask
  that it is his. `caveAtHand()` is the cave you could step into or out of; **the sea cave takes E from the boat** (within 150
  units of its mouth: the boat lies there while you are in, and you come out aboard), or on foot where its foot can be waded
  (`mouthSpot`). The prompt names it ("Enter the mine"), the map's title is the cave's name, the other caves and the shelter
  are marked on the chart when you come within sight of them (`seen.places`) or look out from the lookout. Leaving a cave lets
  its sheets go (`Cave.release`). Saved: `caves2` (per cave: the ore rocks mined, by id, so **a mined rock stays mined**; the
  veins; what has been seen; what has been taken), `seaBoat` (saved inside the sea cave, come by boat: you wake in the boat).
  **Checked in the pane on the mountain scene:** the mine by E, the adit and the drift walked, the fall of rock stops you and
  the pick clears it, the miner searched, a vein and a fire-setting worked, out again, and all of it there after a reload; the
  sea cave by E from the boat, waded and walked to the pocket, the chest and driftwood taken, out and aboard again; the shelter
  walked into, a bed under it slept in (rested); a vein in the open cliff worked out. `tests/cave.js` lays both out for twelve
  seeds; `node tools/visual/cave.js [seed] [what] mine|sea` writes `cave_mine_*.png` and `cave_sea_*.png`.
  `docs/cave-mine.jpg`, `docs/cave-sea.jpg`.
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

## Mountains (2026-10-12, Robin: mountains in a good immersive way; plateaus with cliff faces and painted peaks, a mountain island to test it)

**Decided:** height is drawn the way the old top-down games draw it, nothing is lifted on the screen. **Two terraces and peaks**: the
low ground (level 0), the **foothills** (1), the **high plateau** (2), and the **peaks** (3), which cannot be walked. **Green fells,
snow on the peaks.** You **build on any level ground** up there, never on a cliff, its rim, a slope or the waterfall's water, and
never across a change of level. **Arrows fly over a cliff both ways** (Robin: either you can shoot and hit or you cannot, whichever
makes more sense); a blow does not reach across one. The mountain island is a **test scene** (`game.html?scene=mountain`); the real
game's islands have no mountains yet. **The look pass (2026-10-12, Robin's list, all seven built):** edges that face away, the
peaks against the ink world, variety in the cliffs, the fells' own ground, sea cliffs, a lookout, a waterfall (**not Näcken's**:
Robin wants him in a lush forest). **Since 2026-10-12 the real game's big island has a small mountain, and the mountains have more than the troll's cave** (the
three bullets after this one). **Not decided:** where the full mountain biome goes in the world (a mountain island in the north),
height in a fight beyond arrows, whether the chart should hide land you have not seen (the lookout marks places; the chart shows
all land as before).

- **The field** (`src/world.js`, in `World.make`, `o.mountain` names an island, `o.mountainOpts` the numbers): `MT` is a smooth value per
  tile read between the tiles like the coast's (`w.mAt`), from **how far north** a tile lies on the island's own land and **how far it
  is from the sea** (a two-sweep distance, so the mountains leave a shore all round), with noise, smoothed twice; its whole numbers
  are the levels. **No specks:** a patch of higher ground of under 70 tiles is taken down and a pit that small filled. A level's edge
  is a contour of the field, so every cliff is a curve.
- **Sea cliffs and the bay** (`mountainOpts.sea`, on by default; `seaSide` 1 east or -1 west; `bay`, `bayAt`, `bayLen`, `bayWide`): on
  one side of the island the mountains keep no shore. **A bay is cut into that coast** (the height field `E` is lowered inside a
  rough ellipse before the mountains are raised) so there is a wall that faces south over water. North of the bay's middle the
  ground rises **a level for every 3.25 tiles of land straight south of it** (a face is 3.5 tiles deep, so the wall's foot stands a
  little way out in the shallows) and for every 0.8 tiles from any sea (a side wall's foot), as high as the mountain is there, at
  most two levels: the plateau comes down to the bay in one wall. The top of a sea cliff is turf, not sand (the grid's beach code
  is lifted to grass on the fells and the painter lays no beach there). **`w.isWater` is false where a wall stands in the sea**, the
  boat's hull test refuses a cliff (`raftHull` in the game), and the shore's foam is not drawn over a wall.
- **Faces, side walls, rims, slopes.** South of an edge the lower ground is covered by the cliff's **face** for `HFW` 112 units a
  level (`HF` 84 pixels on the screen, a little over twice the hero). An edge that faces **east or west stands on a battered foot**:
  its **side wall** leans `SIDE` 24 units out a level and, like every wall, 112 down the screen, so a plateau has a **lit west side
  and a dark east side** and a corner turns as a solid does. Where an edge faces away (north) there is only a **rim**, a lip a cell
  wide on each side. **Slopes** are the ways up: a strip cut through a south face where the edge runs straight with level dry ground
  above and below (`faceRamp`: two to four a level), then **every sizeable piece of high ground gets a way up** (a flood from the low
  ground over the walking cells; the largest piece not reached is joined by a face slope, else by a **gap in a rim or a side wall**,
  else straight down whatever face lies south of it). A cairn stands at the foot and the head of each.
- **What the game asks** reads a grid of cells 8 units wide: `w.cellAt(x, y)` is the level in two bits with `M_FACE` 4, `M_RIM` 8,
  `M_RAMP` 16, `M_BLOCK` 32, `M_SIDE` 64 and `M_WATER` 128; `w.levelAt`, `w.cliffAt` (a face, a side wall, a rim or a peak),
  `w.rampAt`, `w.waterAt` (the waterfall's stream, pool and brook: waded, never built on), `w.flatAt(x, y, r)`, `w.nearFlat(x, y, lvl,
  room)`, `w.mt` (the cells, `ramps`, `falls`, `lookouts`, `ledges`, `cave`, `peaks`, `bay`, `seaSide`, the box). **`w.isLand` and
  `w.isWade` are false on a cliff.** A tile with any cliff, slope or water in it has **code 5** (the site finders skip it; the chart
  draws the faces and side walls grey, the fells paler by the level, the peaks white, the waterfall's water blue).
- **What stands in the mountains**, found with the world once the ways up are known (in `mountains()`): **the waterfall**
  (`waterfall`: the foot of a straight one-level south wall you can walk to with open ground before it, by choice off the plateau,
  its stream from the snow if the peaks are near; `mtn.falls[0]` = `{ x, ye (the lip), n, lvl, foot, w, pool, stream, out, bog, box }`:
  a stream that wanders over the upper ground to the lip, a pool at the foot, a brook out of it that sinks into a bog; the ground
  before it is kept clear of trees and rocks, `byFalls`); **the lookout** (`lookout`: the southernmost level stand on the highest
  ground you can walk to, a cliff under it; `mtn.lookouts[0]`); **the cave's place** (`cavePlace`: the foot of a wall, the foothills
  by choice, clear of the slopes, the waterfall and the lookout, strict first and then less so, so every island has one;
  `w.caveSite()` hands it back); **ledges** (`shelves`: a grassy shelf part-way down a one-level south wall with a mountain birch, a
  juniper or heather on it, a prop with no `kind`: it is not gathered).
- **The painting** (`bakeChunk`, `mountainPixel`). Everything is worked out on a sheet wider and taller than the piece (`MG` 96 to
  each side, three faces above, `PADB` 60 below: **an edge just outside a piece must still shade it**, or a seam shows): `lev` the
  level of every pixel, then **four sweeps down columns** (`sweepM`): `FN/FD` the edge whose south face covers a pixel and how far
  below it, `EN/ED` and `WN/WD` the same down columns that lean (the side walls), `HN/HD` along the sun's way (**the shadow a cliff
  throws east**, 42 pixels a level); and `BD/BO` (`edgeDist`, a chamfer) how far the nearest change of level is and what lies across
  it. From those: **a south face** is rock as one smooth thing (see "The rock and the peaks repainted" below: it was panels of
  blocks and strata), lit where the edge turns west and dark where it turns east (from how `FD` changes sideways), with **an
  overhang** here and there (a jutting bed and the dark under it), **water running down** in dark streaks that glint, **moss in
  big patches**, the **grassy ledges**, a lit lip under an ink line, darker toward its foot, and where it stands in the sea a
  wet band with weed and **foam at the foot**; **a side wall** is the same rock seen along the wall, 0.64 of the tone on the
  east and 1.2 on the west; **the crest of every edge** is a rim of rock with an uneven inner edge, an ink line at the drop and
  the turf paler toward it; **the low ground under an edge that faces away** takes an ink line and a dark that is deepest at the
  wall and fades over 52 pixels (this, the rim and what overlaps it are how a north edge reads as a drop: it cannot
  show a wall). **The fells:** the foothills are cropped, drier turf, ochre where thinnest; the plateau grey-green heath with
  **heather in drifts**, gravel in specks toward the peaks; the peaks' ground scree and snow fields. The fells' soft patches, the
  heather and the snow are **values a tile wide read with the weights the pixel loop already has** (`SFt`, `HTt`, `SNt`). With a pen
  after (seamless across pieces: placed from the world's own position and looked for past the border): tufts over a lip, stones
  on a crest, scree at a foot, the fells' stones in clusters, flat slabs with lichen, sedge, cushions of heather, the rocks round
  the pool, reeds in the bog. `drawMeadow` and `drawGrass` know the fells too (`fellOf`): no bare earth, few flowers on the
  foothills and none on the plateau, shorter, thinner, drier blades. **Speed:** the sheets are kept between bakes, a piece and all
  round it on one level skips the sweeps, a speck comes from a sheet of white noise (`white`, never a sine a pixel); a mountain
  piece still takes two to three times a lowland one (`w.prof` says where: `lev`, `sweep`, `paint`, `pen`; about 25 ms against 10 in
  the browser pane). **The noise sheet is smooth, not speckled**: a threshold on it draws blots.
- **The waterfall alive** (`w.drawFalls(c, cam, hw, hh, clock)`, drawn with the waves): streaks running down the still water painted
  on the face, a band of light across the stream where the water turns over the lip (**not an ellipse**: Robin, 2026-10-12, found
  the white ellipse that lay there weird, like a lid), foam and mist where it lands, rings going out over the pool, glints
  running down the stream and the brook. **The brook leaves the pool with no shore across it** (the pool's ring of wet gravel
  and its dark edge are left out where the brook runs out, `outD`: there was a gap of gravel between the two), and nothing
  grows across the fall's lip.
- **What grows** (`w.plant`): sparse pine, birch and **mountain birch** on the foothills with **juniper**, **heather** and
  **boulders**; the plateau all but bare of trees; boulders by the pool, reeds in the bog, the ledges' trees, and the **varde** on
  the lookout. Props in the kit: `dwarfBirch` (tree, 4 wood), `juniper` and `heather` (bushes), `boulder` (stone, 5), `varde` (the
  beacon cairn: a man and a half tall, three weathered poles leaned together over it; "Left by people" in the Art Editor).
- **The rock and the peaks repainted (2026-10-12, Robin, after walking the mountains: "overall look pretty good. I'm not sure
  about the wall texture and the rocky tops. It doesn't look very smooth and natural. It looks very just pasted on").** Two
  causes. **The walls** were beds of blocks, strata and joints, every one a hard step of tone, painted a pixel a unit and shown
  three times that size: masonry, in stairs. **The peaks** were pictures from Blender, fifty to two hundred faceted cones each
  in its own heavy outline with boulders at its foot, stamped on the ground. Both are now painted here, in one hand:
  **`rockTone(u, v, sd)`** (in `bakeChunk`) is rock as light on a surface: buttresses that run down the wall and lean a
  little, smaller ribs on them, a few broken ledges, each lit from the upper left and turning into its own shade by soft
  steps, a crack where a gully runs; nothing in it is a pixel wide. (The noise sheet's own shapes are 16 to 32 of its pixels
  across: `nsm(x, y, 2.2)` gives buttresses, `0.8` ribs, `0.2` flecks.) A south face, a side wall and the peaks' faces all use
  it. **Edges true to a part of a pixel:** the field is kept as it is (`mff`, a float a pixel, beside the byte `mfr`), a face's
  lip and foot lie where the field really crosses the level between two rows (`fr`; the south sweep reaches a row further,
  `ext`), and near any edge the distance to it is the field's own (`|m - level| / |grad m|`), so the lip, the foot, the rim and
  the ink at a north edge are lines and not stairs; the grain that roughened the edges is gone. **No specks:** the plateau's
  gravel, the heather's flowers, the scree, the snow's edge, the foam and the moss are soft shapes, not a pixel of white noise
  each. **Side walls are still whole pixels** (their slanted outline steps; tried by coverage, it came out dotted).
  **Then broken into slabs (the same day, Robin's next look: "a very nice 3d effect so i love that. It just its too smooth and
  looks almost like manmade cement wall").** `rockTone` alone is the big forms; over it **`slab(u, v, sd)`** cuts a wall into
  slabs of uneven size and shape (a point to a cell of 27 by 60, a pixel belonging to the nearest point; the wall bent first,
  so no joint runs straight for long and nothing lines up into courses; `ih` is a quick whole-number hash, the nine cells
  round a pixel kept until it leaves them) and **`slabTone`** gives every slab its own shade, lights the edge of a slab
  that looks up or west and darkens the one that looks down or east (so the wall steps in ledges and corners), and says how
  much of a crack lies on a pixel: a joint is an open crack, a hairline or grown shut, by its own number, and a crack comes and
  goes along its joint. Stone grain under it all, lichen in pale drifts, the lit lip broken instead of one bright kerb, a
  boulder fallen at the foot now and then. Side walls take the slabs too; the peaks' faces do not (they are planes already).
  **So the three things a wall must not be:** courses of blocks (masonry), one smooth surface (cement), a net of even cells
  (paving): slabs must differ in size, most joints must be shut, and cracks must break off.
  **Then made less perfect (the same day, Robin: "those lines are weird in the middle of the walls", and "maybe the walls are
  too perfect height. They go around perfectly").** Three things. **No overhangs:** a jutting bed with its dark under it was a
  long pale line across the middle of a wall; it is gone (`OVS`, `OVY`). **An uneven lip:** near an edge the field is read up
  to five pixels to one side, in slow waves (in the sheet: `mm += gradient . offset`, only within reach of an edge, `STILL`
  keeps it off round the waterfall, the shelter and the cave mouths), so an edge has shoulders and bites in it; the walk
  cells do not follow (they are 8 units, coarser than that). No quicker waves: at a wall's bare foot they read as stairs.
  **A wall's height varies: `footRise(wx, eyS, n, tot, list)`** (beside `nsm`, above `mountains()`) says how much of a wall's
  foot is not there at a place along it: the low ground comes that much further in under the lip. About a third of the
  walls' length loses something, up to a little under half the height, in slow waves. **Nothing is lifted: a wall is a
  picture set between two grounds, and it may be a shorter picture**, so **both the walk cells and the painter ask the same
  function**: at the end of `mountains()` the face cells of a foot that is not there become the low ground's again (you walk
  in under the wall, things grow there), and in `mountainPixel` a pixel below the foot that shows is not wall (it takes the
  wall's shade for ten pixels). The foot of a south wall that turns (a side-wall pixel that is not `proper`) follows the same
  height. **Where a wall keeps its full height:** by anything set against it by that height (`WKEEP`, and `KEEP` the ones near
  a piece: the waterfall, a vein, a cave's mouth, the shelter, a ledge, a slope) and where it stands in the sea. `PADB` is 100
  for it. `w.footRise` is exposed for checks.
  **Shelves in tall cliffs come of it, and are wanted (Robin, 2026-10-12: "These types of edges look nice tho. Hope you didnt
  remove that").** A tall cliff is two walls, one above the other, with a strip of the middle level between them that the
  upper wall covers. Where the upper wall's foot is not there, the strip shows: **a grassy shelf part-way down the cliff**,
  scree and grass along its back. I had taken the first ones for a fault and stopped them (a wall was to lose its foot only
  where it stood on open ground of its own level); that rule is gone again. The shelves are ground to the walk cells too,
  though most are cut off from everything. **A side effect that looks good is to be shown to Robin, not tidied away.**
  **The trap met on the way:** the painter had its own reason not to lower a wall (`cont`, a wall that turns below) that the cells did
  not share, and the hero stood in mid-wall on ground the cells had cleared: whatever decides the height must be asked by both.
  **The peaks: `paintPeaks`** (after the pixel loop, into the same rock layer). A peak is a summit with six or seven flat faces
  falling away from it (`peakAt(i, j)`: one to a cell of 126 by 94, from the seed; its height by how deep in the peaks' ground
  it stands and never more than that ground runs on north of it: nothing walks behind a mountain); the height anywhere is the
  highest of the peaks that reach there, measured on ground that is bent a little so no ridge is ruled, and sinks to nothing at
  the ground's edges (`dN`, `dS`, the field). The picture: down every column of the piece, from the nearest ground to the
  farthest, a point h high is drawn h up the screen, and only what rises above everything nearer is seen (the old terrain
  renderers' way). A face is one plane, so it takes one tone from where it faces (west lit, east in cool shade) with
  `rockTone` over it, **snow above a line that wanders**, **ink along a skyline** (where a mountain stands before what is
  behind it), a thinner line down every ridge and valley. Seamless: everything comes from the world's own position, and a
  piece asks every peak whose foot could reach its ground or reach up into it from the south (a peak's true reach, `R`: the
  corners where two faces meet the ground; too small a reach was the one seam found). `PKM` keeps the pen's stones off the
  mountains. **`w.peaks()` now only lists places on the peaks' ground** (`w.mt.peaks`: for the test board and the look
  scripts). **Cost** (Node, a piece is 512 by 384): the thirty-odd pieces with peaks in them take about 77 ms the first time
  they are seen, against about 55 before (the peak painter is 20 of it); the walls cost what they did. Baking a piece over
  several frames would end those hitches and is not done. `docs/mountain-rock.jpg` is before and after.
- **Set pieces from Blender** (`art/build/rocks_build.py`, `tools/props.js`, `npm run art:rocks`): `cave_mouth`, `mine_mouth`,
  `sea_mouth`, `shelter` and `shelter_in` (the peaks were set pieces too until 2026-10-12; their builder is kept and runs only
  when a peak is asked for by name). **The packer gives a piece the drawn world's finish**: the kit's grain, a cool shade
  toward the lower right, the silhouette in ink laid under it (thin all round, heavy on the shadow side). One render each from
  the game's camera at 2 pixels a unit, packed into `assets/props/<name>.png` with `props.json`; `node tools/blender.js
  art/build/rocks_build.py -- cave_mouth` renders only the pieces named. A piece of ground baked before a picture set into
  it has loaded (the shelter's inside) is baked again when it has (`imgWait`). The mouths are props (`World.setImages`,
  `w.sprite`).
  **The cave mouth has an inside (2026-10-12, Robin: more look of depth, with colour; the opening was one flat black shape):**
  from the game's camera what shows through a mouth is mostly the **floor running back** (a point further in lies higher on the
  screen) and the walls where the passage narrows, so `cave_inside` builds a real passage behind the mouth: a floor, a left wall
  that sweeps across to the right as it goes in, a rib of rock on the right, the whole turning out of sight. **Depth is told by
  colour**, painted on every point of the meshes (`painted`, a colour attribute shown as it is: no sun, no cel step): warm earth
  at the threshold, through violet-brown to deep blue and black at the back (`FLO`, `WAL`), the roof's dark coming down the
  walls, **the sun falling in through the arch as one soft-edged patch** on the floor with the warm light it throws up the wall
  beside it, and stones on the floor each paler than the dark behind it. The inside takes **no ink line** (it is in its own
  collection, `EXTRA`, left out of Freestyle and of the frame's fitting), which sets it back behind the inked rocks, and **the
  cliff is a holdout** with the mouth cut in it, so nothing of the inside shows except through the mouth. The packer keeps the
  grain's pale specks out of the dark (they sat on the picture's surface and flattened a deep shadow). **A changed picture is
  always fetched:** `tools/build.py` tags every set piece's path with a few letters of its own bytes (`?v=`), because a browser
  kept showing the old cave mouth. `docs/cave-mouth.png` is before and after.
  **The sun for these renders is 3.0**: at the characters' 1.15 no face passes the cel shader's light step (found 2026-10-12;
  **every character so far was rendered that way**; whether to re-render them with a lit side is Robin's call).
- **In the game:** `fellOk`, `fellSame`, `edgeFell`, `tileFell`, `fellWhy` keep building to level dry ground ("Not on a cliff", "Not
  on a slope", "Not in the water", "Not across a cliff, a slope or the water"); bears and moose are placed up on the fells.
  **The lookout:** E by the beacon cairn ("Look out", `lookoutNear`, `lookOut`) pulls the view back to **twice as far** and turns
  it south over the land below (`lookK` eases the zoom in `scene.begin`), and **every place within `LOOK_R` 3000 units is marked on
  the chart** (`lookReveal`: the cave, the steading, villages, the waterfall; one toast); a step or E again ("Turn back") ends it.
  **The waterfall** is marked when you come within 420 of it, as the cave is ("A waterfall: marked on your chart"), and has a voice
  (`fallsSound`: looped filtered noise, louder and brighter as you come near, silent in the menu and the cave). The map and the
  minimap show both once seen (`seen.falls`, `seen.look`). Debug: `Combat.api.debug().look()`.
- **Found by the playtest and fixed in the engine (`src/combat.js`):** a solid (a tree, a wall) could **push a mover onto ground it
  cannot walk**: `moveCircle` now puts it back. A calm creature with no aggro ring never wandered: `e.strolls`. `wanderStep` picks
  a place the creature can stand.
- **More than the troll's cave (2026-10-12, Robin: work on a "mountain biome", there needs to be more to it than troll caves,
  maybe other types of caves; his answers: an old copper mine, a rock shelter and a sea cave, not a bear's den; the first copper
  as veins in the open cliffs, then the cave).** Four kinds of place, each at the foot of a wall, found in `mountains()` like the
  cave's and kept apart from one another (`awayFrom`), strict first and then less so (the last try, `footLoose`, takes a wall
  that curves), so every mountain has them: checked on twelve seeds.
  **Copper in the cliffs** (`w.mt.veins`, `cliffVeins`; `mountainOpts.veins`, by default one for every 800 units of mountain,
  three to nine): a green streak up a south face from its foot, flecks and a stain of green in the rock round it, green-stained
  spoil below, **painted into the ground** by the mountain's pen. Each is two or three lumps: the pick on it chips green and
  gives a lump every few blows (the game's `veinHit`, as the cave's veins; `harvest.list` offers the veins near), and a vein
  worked out is **painted again grey and is gone for good** (`w.veinSpent`; saved as `cliffVeins`). They are the first copper:
  a little, got safely, and they teach what a vein looks like before the cave shows the rest.
  **The rock shelter** (a heller; `w.mt.shelters`, `shelterPlace`, by choice near the foot of a way up): an overhang with a
  **floor you walk in under**. The face's cells in a pocket 156 units wide and 62 deep become ground (`CL &= 3`), the inside
  (`shelter_in`: the floor, the back wall dark with soot where fires were lit, the sun in along the threshold) is **painted
  into the ground** with the peaks (`w.mt.inlays`), and the overhang (`shelter`: three great stones on two piers) is a prop that
  stands at the foot line, so it is drawn **in front of whoever is under it**. Nothing grows under it (`meadowOk`), an old fire
  ring lies there, and it is **a roof**: `w.shelterAt(x, y)`; the game's `benchRoofed` counts it, a bed under it gives a rested
  night, `shelterComfort` is 1 (2 with a fire within 110 units: the comfort line shows it, and you heal by the fire there).
  **The old mine** (`w.mt.mine`, `minePlace`, the low ground by choice, well away from the troll's) and **the sea cave**
  (`w.mt.seaCave`, `seaCavePlace`: a wall that stands in the sea and faces south, where its foot can be waded if there is such
  a place, else it is reached by boat alone) are two more caves: see "The other caves" under the cave's rework. Trees and rocks
  keep off the ground before all of these (`bySet`).
  **Set pieces** (`art/build/rocks_build.py`, `inside2`: the cave mouth's inside told what to be): `mine_mouth` (a square mouth
  held open by two posts and a cap with the lagging's log ends over it, more sets going back into the dark, a raking prop, the
  spoil thrown out with green ore in it), `sea_mouth` (a wide low arch with the sea running in under it, wet dark stones at its
  foot with weed and barnacles), `shelter` and `shelter_in`. The render's ground depth is not the game's (a camera 35 degrees up
  shows a metre of ground as 12.4 screen units, the game's 0.75 makes it 16.3), so the shelter's floor is modelled 3.74 m deep
  to lie over the 62-unit pocket. **Thin things take the ink as black sticks** (hanging roots did): use moss, not twigs.
  `docs/mountain-places.jpg` (the adit, the shelter, the sea cave's mouth, a vein).
- **A mountain in one part of an island, and the big island's own (2026-10-12, Robin: put a small version of the biome on the
  first big island, to introduce the player to mountains and get the first copper; his answer: foothills and a small plateau).**
  `mountainOpts.at = [x, y]` (island radii from the island's middle) with `r` puts the mountain round one place instead of across
  the island's north: its height by how far out a tile lies is `prof` (pairs of how far out and how high; by default **a wide
  ring of foothills, a plateau inside it, a peak or two in the middle**). **`World.BIG_MOUNTAIN`** is the big island's:
  `{ at: [-0.3, -0.5], r: 0.56, high: 3.5, shore: 6, rise: 9, sea: false, mine: false, seaCave: false, veins: 4 }`: in its
  **north-west** (the side you come to it from; the north is the cold side), about a sixth of the island, with no sea cliffs, no
  mine and no sea cave (those are for a real mountain island), the troll's cave in one of its walls, a rock shelter, a lookout
  and four veins. The game's `spec` has `mountain: 1, mountainOpts: World.BIG_MOUNTAIN` (the layout key ends `:m5b`, so older
  saves start fresh), the Sea Editor's game layout and `tools/visual/worlds.js` the same; the rune test scene is therefore on
  the big island with its mountain (its board: to the mountain's foot, onto the plateau, the lookout, the shelter, a vein).
  **Villages keep off it**: `w.siteCode(tx, ty)` answers 255 for the mountains and the ground before them, and `Village.plan`
  and the rune hut ask it. **A hollow the fells close round** (a tarn in its bowl: the mountains keep a shore round a lake too)
  **is given a way in**: the flood now starts from the largest piece of low ground, and any other piece, low or high, is joined
  on (a slope down a face, a gap in a rim). `docs/big-island-mountain.jpg` is four worlds' charts (ways up ringed, the cave red,
  veins green).
- **The approach (2026-10-12, Robin: find a good way to make the mountains go seamlessly with other biomes).** The field is
  smooth, so on the low ground it already says how near the first rise is: **`w.fellNear(x, y)`** runs from 0 out in the lowland
  to 1 at the foot of the first wall (the field from 0.03 to 0.6: it is already down to a half at a wall's foot, because the
  face covers the ground where it runs from 1 to there), a band about 300 units wide. Over it, whatever biome lies below:
  **the ground dries toward the foothills' turf** (the fells' tint laid on by how near, in `bakeChunk`), **stones and sedge come
  up through the grass** (the pen), **the trees thin and turn to pine, birch and mountain birch**, **juniper and heather
  appear**, and **boulders and rock lie about** (`w.plant`). The cliffs themselves stay hard edges: that is the terraces'
  nature. `docs/mountain-approach.jpg`.
- **Checking it:** `node tools/visual/mountainlook.js` has shots `mine`, `shelter`, `seacave`, `vein`, `approach`, `over`, and
  `peaks`, `peaks2`, `peaks3` (the painted range; `SEAMS=1` marks the pieces' borders in red, `PROF=1` prints what a bake cost),
  and `MSPEC=big` paints the game's own two islands (the big one with its small mountain) and `MAT=tx,ty,zoom` any place;
  `node tools/visual/worlds.js` prints the big island's mountain (the share of each level, the ways up, the cave, the shelter,
  the veins). `node tools/visual/mountain.js [seed]` (`npm run mountain`) prints the share of the land each level takes, the
  slopes, the waterfall, the lookout, the bay and the cave, and whether every level is reached on foot, and writes mountain.png
  (the chart and eight close-ups painted as the game paints them); checked on seeds 11, 3, 25, 42 and 7: every one has a way to
  every level, a waterfall, a lookout, a bay and a cave. `node tools/visual/mountainlook.js [seed] [shots] [zoom]` writes one
  picture a place, larger (east, west, north, face, fells1, fells2, sea, sea2, sea3, fall, look, peaks, cave, chart).
  `tools/visual/mountainplay.js` is the playtest run in the page with `tools/visual/drive.js`: nothing planted in rock or water,
  slopes up and down, 160 tries to get through the cliffs walking, sprinting and dashing (side walls and sea cliffs among them),
  a hut on each level, the cursor's refusals, wading the pool and the stream and building in them, the lookout's E, the cave,
  arrows over a cliff, **a boat rowed at the sea cliff and wading at its foot**, the troll outside.

## Sea and islands

**The game's world in the Sea Editor (2026-10-08, the balance pass; Robin: the lowlands a bit further out, bigger seas):** the editor's
panel **The game's world** has two layouts (`spec.layout`): **Free archipelago** (the editor's own sea, as before) and **The game's layout**
(the default): `worldSpec()` builds the options the game hands `World.make` (`isle0` the **Starter island** slider, `big` the **Big island**,
`sizes` every island's width from the sliders with the size variety, `biomes` 1 from **Lowlands from island** on, with the **Lowland island
width**, `dir` 0.1), so the editor's sea is laid out as the game's. The village rules come along (`__VILLAGE__` in `templates/sea.html`):
`planSites()` runs `Village.plan` on the sea as the game does and a **big chart** (`#bigchart`, `drawBigChart`) shows the whole sea with the
islands numbered (home, lowland), every village named and coloured by kind (a town or seat a square), the jetties, and home; under it a line
counts the villages by kind and says how many lowland islands there are and how far the nearest is from home (metres of water, seconds by
karve and by boat). **"Use in the game"** stores `game.world2` (since 2026-10-09; `game.world` is ignored: count, gap, gapVar, skerries, rough, beach, seed, isle, isle0, big, sizes,
biomes, dir, sizeVar; a free layout stores no sizes); the game merges it over its `spec` on load, so the next fresh start (Esc, New island)
builds that sea; `layoutKey` includes the sizes, so a running save of another arrangement is dropped. The game's own spec and the
editor's default game layout are the **two islands** of 2026-10-09 (starter 120, big 400, gap 150, no lowlands; the chart script
`tools/visual/worlds.js` the same).


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
