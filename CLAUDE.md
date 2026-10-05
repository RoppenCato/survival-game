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
| `character-editor.html` | `sprite.html` | Character Editor: tune the hero |
| `creature-editor.html` | `creature.html` | Creature Editor: the six animals and their behaviour |
| `object-editor.html` | `objects.html` | Object Editor: tune one world prop |
| `environment-editor.html` | `environment.html` | Environment Editor: a patch of land with biomes and object layers |
| `base-editor.html` | `base.html` | Base Editor: free building |
| `sea-editor.html` | `sea.html` | Sea Editor: the archipelago, ships and sailing |
| `combat-arena.html` | `combat.html` | Combat Arena: fight wolves, boars, snakes and the bear |
| `game.html` | `game.html` | The game: the first island, gathering, boars, inventory |

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
- `src/build.js` (`Build`): building pieces, shared by the Base Editor and the game: `WALLS`, `FLOORS`, `ROOFS`,
  `rooms(B, GW, GH, bounds)` (closed rooms by flood fill, and collision circles), `drawH`, `drawV`, `drawRoof`,
  `edgeAt`, `icon`. A building is `B = { floors, H, V }` keyed `"x,y"`.
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
- `docs/roadmap.md`: the build order (steps 1 to 10), what to test after each, and open questions for Robin.
  Update it when a step is done.
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

## People

- Other people are the hero's figure with their own spec: `lib.makeFigure(spec)` then `lib.figureD(c, x, y, dir, an,
  pose, F)`. `FOLK` in `src/art.js` holds them (`lib.folkSpec(key)`); spec key `beard` adds a beard.
- The first is Brokk, a friendly dwarf smith (dwarfs are from Norse myth). He stands at the home camp in the Sea
  Editor, turns to watch the hero, and E talks to him (a speech bubble cycling through a few lines). He does not
  walk, trade or give tasks yet.

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
- **Boars**: six at a time, placed on grass away from camp, each with `e.wander = { x0, y0, r }` so it ambles
  round a home range (`wanderStep` in the engine) and `e.aggro` so it charges when the hero comes close.
  `Combat.api.onDeath(e)` drops meat; a new boar wanders in a few seconds after one dies.
- **Building** on **B** through `Build`: five pieces (log wall, plank floor, door, window, stone wall) at low cost
  (2 wood, 1 wood, 2 wood, 2 wood, 2 stone), chosen with 1 to 5, placed with the mouse (drag lays floors and walls),
  only on land, away from trees and rocks, within reach. **F** toggles the red crossed wreck cursor, which gives
  the material back in full. Closed rooms get a turf roof that fades when the hero is inside; walls are collision
  circles near the hero. `Combat.api.buildSlots` feeds the build hotbar; `P.piece` and `P.wreck` hold the state.
- **Build menu:** right click in build mode opens a big centred wooden board (8 by 4 cells, most empty for later
  pieces, a "Building [n]" tab); click a piece to pick it. Wrecking is only on F (no cell for it). Pieces are not
  in the hotbar: in build mode the bar shows the belt, and the chosen piece is named in the bar's label. The mouse
  wheel steps through tools, pieces or the belt slot (`P.sel`). A hearth is a buildable item (`B.items`, drawn
  as a prop, solid, cookable); the camp hearth stays.
- **The Book of Beasts** (L, or the small book by the chart): a leather-bound book over a dimmed screen, two
  parchment pages. Left: the beast drawn live by `creatureD`, turning slowly, its name and folk name, a tab row
  of all beasts. Right: lore, strengths, weaknesses, warning sign, drops, where found. A page is earned the first
  time you slay that creature (`learn(key)` from `onDeath`; `e.kind` names it); unknown beasts are dark
  silhouettes with "?". `BESTIARY` holds the cards (all six animals written, only boars exist in the game yet);
  `book` (slain counts) is saved. Creature ideas (Norse myth and nordiska väsen) are in `docs/idea-bank.md`.
- **HUD:** only health and stamina top left, the chart and the meal icon top right; no kills or carry line (Robin:
  "we can just open the inventory"). Damage numbers and pickup toasts are drawn in world space inside the camera
  (`drawNums`), so they appear over the tree, rock or hero in the big world.
- **Hotbar:** half size (11 px slots), with the sword and bow as two round icons set like the rings of a % sign to
  its left. Tools use a chop (`chopPose`: up over the shoulder, down onto the target; the knife stabs) with no
  lunge, and every tool hit shows a damage number. The bow shoots drawn arrows (visual only; no arrow item yet).
  The meal buff is a round icon by the chart with a timer ring and a mouseover tooltip, not a text line.
- **Food** (the reward-not-punish rule): berry bushes drop berries, boars drop meat. **E** at the camp hearth opens
  a cooking panel: roast boar (1 meat), boar and berry stew (1 meat, 2 berries). Click food in the inventory to
  eat it: berries heal 10; a meal heals and, for minutes, raises top health and gives health a second (`FOOD`,
  `fed` in the page). No hunger meter. The meal is saved with the game.
- **Saving** in `localStorage` (`game.save`): island seed, inventory, buildings, felled props (keyed by rounded
  position), stumps, hero position. Saved on every change, every 10 s and on leaving; loaded on start. "New
  island" deletes it. Boars and dropped items are not saved.
- **R** after falling: the engine makes a new hero, the page notices (`P` changed) and puts him back at camp.
- Not built: Brokk, boats, crafting, food, skills, sound, night.

## Controls and modes (decided 2026-10-04)

The hero has two modes, switched with **Q**, each with its own six-slot hotbar at the bottom middle of the screen.
- **Fight mode:** two weapons, a sword (melee) and a bow (ranged), swapped with **F**; the attack button uses
  whichever is out. Slots 1 to 6 are for skills and spells, which fill in later. The two weapons show as icons left
  of the slots.
- **Gather mode:** tools on 1 to 6: axe, pickaxe, knife so far (trees, stone, bushes). The right tool does full
  damage and any other does half. Tools do not hurt enemies. Tools are chosen by hand: no auto-pick, no highlight.
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
- All animals still attack with the same "chase and lunge" underneath. Real per-animal attacks are not built.

## World look and props

- `kit.STYLE` is bright daylight: fresh green, brown bark, blue water, no glowing fruit (`fruit: 0`).
  Change the look of the whole world there. Editors add per-page overrides on top (hue, saturation and so on).
- Props are functions that draw with `shape`, `line`, `gshadow` and materials from `mats()`, registered in `PROPS`
  with a bounding box. `node tools/visual/props.js name name ...` renders them next to the hero.
- Built things use `K.wood`; `K.trunk` is living bark.
- A new prop must also be added to a category in `CATS` in `templates/objects.html` and to a pool in
  `templates/environment.html`, or it will not show up there.

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

Ships (faering, karve, longship, knarr) are a top-down hull turned to the heading and squashed by the 0.75 view
factor, with upright stems, mast and sail. E boards and steps ashore. Handling: top speed, acceleration, turn
speed, glide, grip, and two steering modes (Direct and Tiller).

## Design conventions

- Game rules live in plain data plus a few systems. Balancing should mean editing numbers, not rewriting code.
- Combat is keyboard-first. The mouse is only for aiming the ranged weapon, which also has an auto option.
- Reward doing right instead of punishing doing wrong (Robin, 2026-10-04). The model is Valheim's food: you do
  not starve, but eating gives the health you need, so going without leaves you weak and likely to die from
  something else. No meters that drain and hurt you; the unprepared state is the weak baseline and preparation
  gives buffs. This applies to food, weather, biomes and attacks on the base (no repair chores as punishment).
  Nothing cuts your stamina: Robin finds that not fun, and hates Valheim's wetness mechanic, so there is no
  "wet" state and no weather or biome effect that lowers stamina or slows its return. A rested or comfort buff
  (for example from a warm, well-furnished home) is wanted.
- No screen shake. Hit weight comes from short local pauses, squash, impact rings and sound.
- Hit weight preset "Snappy" is the chosen setting.
