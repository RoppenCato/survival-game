# Viking survival game: prototypes

2D top-down survival crafting game set in Viking-age Scandinavia (three-quarter camera, cartoon look). All art,
animation and sound is drawn or synthesized in code: there are no asset files. This repo holds browser
prototypes and editors, not a full game yet.

The game was post-apocalyptic steampunk until 2026-10-04. Robin changed it to a Viking game, and `main`
is now the Viking game (merged from the `viking` branch on 2026-10-04). The last steampunk state is commit
`59f5dd6`. All steampunk content has been removed. The old
linked design doc (see `README.md`) still describes the steampunk game and is out of date: this file is the
source of truth for the new direction.

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
- **Scope for now:** only the starter island and travel to nearby islands, all of the first biome. None of the
  raiding, clan or calendar systems are built yet. `game.html` is the playable start (see "The game" below).
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
- **Hero:** the smooth vector figure. Robin rejected a pixel-sprite look ("doesn't fit with the other graphics").

## Commands

```
npm start         # rebuild, then open dist/index.html (the start page)
npm run build     # python3 tools/build.py: stitches templates/ + src/ into dist/*.html
npm install       # once; only dependency is @napi-rs/canvas (fake canvas for headless tests)
npm test          # runs eight combat scripts in tests/ in sequence
```

There is no bundler, linter or type checker. `.claude/launch.json` has a `workbench` entry that serves `dist/` on
port 8765 for the browser pane (the pane has a tab limit: close old tabs if a page will not open).

## Pages

| Page (in `dist/`) | Template | What it is |
| --- | --- | --- |
| `index.html` | `index.html` | Start page |
| `character-editor.html` | `sprite.html` | Character Editor: the people of this world; concepts, styles, templates, the matte look |
| `creature-editor.html` | `creature.html` | Creature Editor: the six animals and their behaviour |
| `object-editor.html` | `objects.html` | Object Editor: tune one world prop |
| `sea-editor.html` | `sea.html` | Sea Editor: the archipelago, ships and sailing |
| `hird-editor.html` | `hird.html` | Hird Editor: roll a hirdman, tune stats, traits, jobs, food and the claim stone |
| `item-editor.html` | `items.html` | Item Editor: make a weapon or tool and give it to the game |
| `song-editor.html` | `song.html` | Song Editor: the game's music; a simple view with dice and a library, Advanced for the piano roll |
| `combat-arena.html` | `combat.html` | Combat Arena: fight wolves, boars, snakes and the bear with every weapon kind |
| `gathering-editor.html` | `gather.html` | Gathering Editor (2026-10-07): a field of trees, rocks and bushes; the gathering ideas as switches and sliders, presets, settings as text, "Use in the game" (`game.gather`) |
| `game.html` | `game.html` | The game: the first island, gathering, boars, inventory, the arm ring |
| `game.html?scene=runes` | `game.html` | Rune Editor (2026-10-07): the game started on the big island at a carver's bench, a dragon ring on the arm, every rune known; a board on the left to change the ring's metal, know or forget every rune, bring beasts, make it night, go back to the bench, start over. Its own save (`game.save.runes`). `SCENE` from the URL, `runesScene()` |

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
  `bakeTile`, `blendTile`, and `STYLE`, the one shared look of the world. Every editor starts from `kit.STYLE`.
- `src/world.js` (`World`): the archipelago, shared by the Sea Editor and the game. `World.make(kit, opts)` returns a
  world: height field `E`, tile `grid`, `isLand`/`isWater`/`elevAt`, props in `buckets` (`plant`, `camp`, `addProp`,
  `removeProp`, `around`, `nearSolids`), lazy ground painting (`drawGround`), shore waves (`drawWaves`), `chart`.
  `World.KIND` and `World.HP` say what can be gathered. Island changes go here, once.
- `src/build.js` (`Build`): building pieces, used by the game (the Base Editor is gone): `WALLS`, `FLOORS`, `ROOFS`,
  `rooms(B, GW, GH, bounds)` (closed rooms by flood fill, and collision circles for walls and posts), `drawH`, `drawV`,
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
- `src/runes.js` (`Runes`): the skills as runes ({ id, name, norse, kind, text, active, cd, glyph }), kinds attack,
  guard, mobility, utility, hird; tiers by uses (common, carved at 50, legendary at 200); `glyph`, `stone` and
  `hollow` drawings for the casting cloth. Thirteen runes so far.
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
  render things to PNG for checking (`props.js`, `creatures.js`, `walkcycle.js`, `swingdirs.js`, `attackstyles.js`).
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
- `docs/roadmap.md`: **Goal 1, "leave the island"** (Robin, 2026-10-05) is at the top: the chain from landing
  with nothing to a raft (tools, gathering, food with stamina, leather, a comfortable house with a rug, Brokk
  the survivor who teaches the raft, the shipwright's bench on the shore, the second island), nine steps each
  with Have / Build / Test, and the order of work. Below it the older build order (steps 1 to 10) and open
  questions. Update it when a step is done.
- `dist/`: built single-file pages, committed to git.

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
- The engine's enemy types are still called `bot`, `bossbot`, `turret` and `boss` internally, and the tests use
  them. They are AI behaviours now, not robots: pages dress them as animals with `api.dress`. The plain robot
  drawings (`drawBot` and friends) remain only as the undressed fallback the tests render.

## Hero

- Drawn from a spec: `HEROD_DEF`, swapped with `lib.setHero(spec)`, read with `lib.hero()` (`{ spec, pal, lift }`).
  Proportions are factors on the original figure. The Character Editor edits it.
- `src/combat.js` compensates for longer legs (`heroLift()`) so weapons stay in the hands.
- North and south walking: arms swing opposite the legs; `sway` and `stance` control the side-to-side rock.
- Sword swings are drawn at their true angle in every direction (`visAngle` is the identity).
- Attack motion is in `ATK_STYLES` / `atkBody()` (spec keys `atkStyle`, `atkPower`). Visual only.
- A pixel-sprite hero (`heroP`, `SPRITES`, `Combat.S.look = 'sprite'`, V in the Combat Arena) is still in the code
  as a comparison only. Do not build on it.
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
  and **"Use as the hero in the game"** (`game.hero`, which the game sets with `lib.setHero` on load). The steampunk
  eyewear and bot palettes are gone from the editor (the eyewear drawing is still in the code). `node tools/visual/folk.js`
  renders the concepts in four views and a grid of every style to folk.png (`big` for the concepts large).

## People

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
- **The arm ring (2026-10-06, built; design in `docs/arm-ring.md`):** runes (`src/runes.js`: eleven, each with a `side` hand,
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
  finds a flat 14 by 12 tile stretch of grass 350 to 800 from camp from the island seed; `villageClear` (every
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
  Roast berries (3 berries: small), roast meat, berry stew (the best: +25 health, +30 stamina, 35% faster).
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
- **R** after falling: the engine makes a new hero, the page notices (`P` changed) and puts him back at camp.
- Not built: ships beyond the raft, hazards at sea, night-only beasts, trading, the torch, a village on the second island.


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
- **Facings (decided 2026-10-04):** things turn smoothly, "like the ship". Animals (plans 5 and 6) are drawn by
  `animal3D` at any heading (`s.ang`): the body is laid out in its own space (forward, sideways, up) and turned
  before drawing, with parts ordered far to near. Without `s.ang` they face straight left or right (`s.dir`).
  The arena passes a heading that eases toward the true facing (`creatureTurn`). The hero uses the side view only
  when facing nearly straight left or right; otherwise the front or back view turned by `an.turn` (-1..1).
  `Combat.api.facings8` (on by default) switches both. `node tools/visual/facings.js` renders them all.
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

The archipelago code is `src/world.js` (`World`), used by `templates/sea.html` and `templates/game.html`. Islands are placed one after another, each beside an
earlier one at a random gap, so they cluster and chain. Each is a rough blob from noise, with skerries round it.
The map grows to fit (capped at nine million tiles; islands that do not fit are left out and the readout says so).
Each island writes a height into a field (`E`, hundredths of a tile; above zero is land). The ground is painted
per pixel from that field read smoothly between tiles: deep sea, turquoise shallows, a white lip at the waterline,
wet then dry sand (the "Beach width" slider), then grass. `isLand`/`isWater` read the same field, and shore waves
are contour lines of it. The tile grid only records sea, beach, grass or jetty for the game.
Only pieces of sea that touch land are painted, lazily, with the oldest forgotten; open water reuses one piece.
Props and solids are kept in buckets per map piece. A chart in the corner shows the whole sea.

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
