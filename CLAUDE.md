# Survival game prototype

2D top-down survival crafting game with a Viking theme (Zelda-style three-quarter camera, MapleStory-like
cartoon look). All art, animation and sound is drawn or synthesized in code: there
are no asset files. This repo holds browser prototypes, not a full game yet.

## Direction: Viking (since 2026-10-04)

Robin changed the game from post-apocalyptic steampunk to a Viking game. The `viking` branch holds this work;
`main` is the last steampunk state, kept so nothing is lost. The change is being made in steps, graphics first:

- Done: a Viking prop set in `src/stylelab.js` (longhouse, tent, palisade, shield rack, dragon post, runestone,
  burial mound, stone ship, drying rack, forge, brazier, woodpile, cairn), Viking biomes in the Environment Editor, 23 more nature and Viking-age props (cave, nest, den, hive, spring,
  traps, nets, weir, bridge, farmland, storage hut, boathouse, watchtower, hearth, well and more),
  Viking ships in the Sea Editor (faering, karve, longship, knarr), log and wattle walls and a turf roof in the Base
  Editor, and Norse base models in the Creature Editor (wolf, boar, draugr, troll, raven).
- Not done: the hero is unchanged (Robin said to leave it), the enemies in the Combat Arena are still robots, the
  World Prototype is still the Factory, and the linked design doc still describes the steampunk game.
- Tone: Robin wants Scandinavia in the Viking age, not a copy of Valheim. Prefer things that really existed (well
  sweeps, storehouses on posts, boathouses, fish weirs, bee skeps, charcoal pits) and real animals drawn with
  accurate proportions over fantasy monsters. Earlier creature models were rejected as "one-eyed and a bit alien".
- Environment objects are organised in three groups, from Robin's lists: found in nature, left by people in the wild,
  and built by Vikings. The Environment Editor has a layer and a count slider for each; the Object Editor has a
  category for each. Keep new props in one of the three.
- Animals (wild boar, deer, bear, snake, moose, wolf) use `animalD` in `src/art.js`: body plans 5 (four-legged,
  side-on, with neck, snout, ears, antlers, tusks, hump) and 6 (snake). They are the base models in the Creature
  Editor. Creatures there spawn between the two top pillars and stay calm until the hero is within `aggro`
  (`e.aggro`, `e.awake`, `e.flee` in `updateEnemies`); the deer is a grazer that runs away.
- New content should be Viking. Treat the steampunk props, robots and Factory as legacy unless Robin says otherwise.

See `README.md` for controls, status and the links to the design doc and published pages. The design
doc (linked there) is the source of truth for vision, world and systems.

## Commands

```
npm start         # rebuild, then open dist/index.html (the workbench: Create editors and Game pages)
npm run build     # python3 tools/build.py: stitches templates/ + src/ into dist/*.html
npm install       # once; only dependency is @napi-rs/canvas (fake canvas for headless tests)
npm test          # runs eight scripts in tests/ in sequence
```

There is no bundler, linter or type checker. To try a page, open the file in `dist/` in a browser.
`.claude/launch.json` has a `workbench` entry that serves `dist/` on port 8765 for the browser pane
(the pane has a tab limit: close old tabs if a page will not open).

## Pages and their names

| Page (in `dist/`) | Template | What it is |
| --- | --- | --- |
| `index.html` | `index.html` | Start page (workbench menu) |
| `character-editor.html` | `sprite.html` | Character Editor: tune the hero spec |
| `creature-editor.html` | `creature.html` | Creature Editor: design monsters, bosses and critters |
| `object-editor.html` | `objects.html` | Object Editor: tune one world prop |
| `environment-editor.html` | `environment.html` | Environment Editor: biome, ground, object layers, layout |
| `base-editor.html` | `base.html` | Base Editor: free building with floors, edge walls, doors, windows, furniture, automatic roofs |
| `sea-editor.html` | `sea.html` | Sea Editor: boarding a boat and sailing between islands |
| `combat-arena.html` | `combat.html` | Combat Arena |
| `world-prototype.html` | `zones.html` | World Prototype (`src/zoneworld.js`) |
| `style-lab.html`, `style-test.html`, `walk-test.html` | `stylelab.html`, `style.html`, `walk.html` | Older experiments, kept for reference |

Robin calls these by the page names. Older notes and code comments may still say Sprite test, Object test,
Combat test or Zone world. Every page has a "Back to menu" link to `index.html`.

Robin works on a 34 inch ultrawide. The six editors use a wide layout: content centred up to 2400px, a large game
view on the left (as big as the window height allows) and a settings column of 340 to 460px on the right. Each
editor calls `fitCanvas()` to size the canvas backing store to its displayed size and sets `Combat.api.pixelScale`
(canvas pixels per world unit, 2 to 5); `Combat.render` uses it. Anything a page draws in raw canvas pixels must
use that scale, not a fixed 2.

## Layout

- `src/art.js`: character, scene and style drawing, shared by every page
- `src/combat.js`: combat simulation, enemies, effects, rendering
- `src/stylelab.js`: Style lab sets, looks, ground tiles, baked props (also used as a library by walk and zone world)
- `src/walk.js`: Walk test (tiled world, chunks, props, hero movement, lighting)
- `src/zoneworld.js`: Zone world (zone-graph generator, gates, cold and heat layers)
- `templates/sprite.html`: Character Editor, a tuning tool. It reuses the combat arena and adds sliders, colour pickers and
  presets that edit the current sprite spec live
- `templates/environment.html`: Environment Editor. It generates a 40 by 40 tile patch of world from a spec (biome,
  ground tiles, object lists per layer, density, grouping, open space) and draws it through `Combat.api.scene`
  with `bounds` for the larger world. It reports open ground and base plots: see the worldbuilding note below
- `templates/objects.html`: Object Editor, the same idea for world props. It lists every entry of `StyleLab.kit.PROPS`
  by category and re-bakes the chosen prop with per-object style overrides. It draws through the combat renderer
  using the `Combat.api.scene` hook (own camera, ground and y-sorted items) and `kit.bakeProp(name, seed, { sx, sy })`.
  A new prop must be added to a category list in `CATS` there or it will not show up
- `templates/index.html`: the workbench start page linking to every tool and playable page
- `templates/*.html`: page shells with placeholders (`__ART__`, `__COMBAT__`, `__LIB__`, `__WALK__`, `__ZW__`)
- `tools/build.py`: plain string substitution of the placeholders, nothing else
- `tools/visual/`: scripts that render pose sheets to PNG
- `tests/`: headless combat checks (table in `tests/README.md`)
- `docs/style-bible-v0.json`: the chosen style (Night Forest, Painted)
- `dist/`: built single-file pages, committed to git

## Things to know before changing code

- `dist/` is committed. After editing anything in `src/` or `templates/`, rebuild so `dist/` matches.
- Source files are loaded two ways: inlined into a page by the build, and `require`d by the Node
  tests (`require('../src/art.js')`, then `C.init(G.lib)`). Keep both working: no ES module syntax,
  no browser globals at load time.
- Adding a new page means a template, a source file, and a new block in `tools/build.py`.
- The tests have no assertions. They print values and exit 0 unless something throws, so a green
  `npm test` proves only "no crash". Read the printed lines against their labels (for example
  "should be false") and report mismatches. `btest.js`, `zwcheck.js` and `zwplay.js` are not part
  of `npm test`.
- Tests write throwaway PNGs into the current directory (`k_crit.png`, `sprint.png`, `v2_*.png`,
  `v3_dash.png`). `.gitignore` covers PNGs in the project root, so run tests from there.
- Melee range is not just `reach`: a hit lands when distance <= `reach + enemy.r + 2`, and the
  player also steps forward during the active phase (`lunge`). Account for both when writing
  distance checks.
- `tools/build.py` writes `dist/` with LF line endings on every platform, so a rebuild with no
  source changes leaves `git status` clean. If `dist/` shows as modified, the content really changed.

## Sprite characters

- The hero is the smooth vector figure (`playerD`), look `'classic'`. Robin tried a pixel-sprite look and rejected
  it (it does not fit the painted world), so do not move the hero toward pixel art. The pixel look (`heroP`,
  `Combat.S.look = 'sprite'`, V key in the combat test) is still in the code only as a comparison.
- The classic hero is drawn from a spec: `HEROD_DEF` in `src/art.js`, swapped with `lib.setHero(spec)`, read with
  `lib.hero()` (`{ spec, pal, lift }`). Proportions are factors on the original figure, so all ones is the original.
  The Sprite test page edits this spec. Every page that calls `playerD` (walk test, zone world, style lab) follows it.
  `src/combat.js` compensates for longer legs (`heroLift()`) so weapons stay in the hands. `walk.js` and
  `zoneworld.js` follow `scale` and `walkRate` but not the leg lift, so changing `legL` or `bodyH` in the
  default needs the same fix there.
- `node tools/visual/walkcycle.js` renders eight moments of the walk per direction to `walk_cycle.png`.
- Pixel characters live in the `SPRITES` registry in `src/art.js`. Each entry is `{ name, def, build }`:
  `def` is a spec of plain numbers plus a `col` map of base colours, and `build(spec, palette, dir, pose, f, armSide)`
  returns one 48 x 48 `Spr` frame with the feet at (24, 46). Shades are derived from the base colours in
  `spritePalette`, so a spec only stores one colour per material.
- `lib.setSprite(id, spec)` swaps the active spec and clears the frame cache; `lib.sprite()` returns
  `{ spec, pal, m }` and is what `src/combat.js` reads for scale, shoulder position, blade and slash.
- Attack motion is in `ATK_STYLES` / `atkBody()` in `src/combat.js` (spec keys `atkStyle`, `atkPower`), for both
  looks. It moves, hops and squashes the drawn body only; hitbox and timing are untouched.
- Creatures (monsters, bosses, critters) are drawn by `creatureD` in `src/art.js` from one spec (`CREATURE_DEF`,
  `lib.setCreature`, `lib.creature()`): five body plans (blob, critter, brute, floater, crawler) plus eyes, mouth,
  horns, tail, pattern, colours, movement and an attack warning style. They are in the classic smooth style.
  In the arena an enemy with `e.creature = true` is drawn this way and still runs one of the existing AIs
  (bot, bossbot or turret); `e.cfg` overrides the bot AI speeds and `e.hold` freezes it. Only one creature
  design is active at a time. The base models are listed in `MODELS` in `templates/creature.html`.
  `node tools/visual/creatures.js` renders several designs in every pose to `creatures.png`.
- To add a pixel-sprite character (old approach, not used for new work): add a build function and default spec to `SPRITES`. The Sprite test page lists
  every registry entry as a button. Its slider tables (`BODY`, `ANIM`, `TONE`, `COLS` in `templates/sprite.html`)
  are currently written for the hero's spec keys, so a character with different keys needs its own tables.
- `node tools/visual/spritesheet.js` renders the frame sheet and attack shots to PNG for a quick visual check.

## Worldbuilding

Robin wants worlds that feel open, not cramped: trees gathered into groves with clear ground between them,
undergrowth kept near the trees, small detail (grass, flowers) scattered in the open, and room for the player
to build a base (or clear trees and stones to make room). The Environment Editor's generator follows this and is
the reference; the World Prototype generator in `src/zoneworld.js` predates it and has not been reworked yet.

## Base building

Decided with Robin: free building piece by piece (Valheim-style), walls on tile edges (not filling tiles), and a roof
that appears automatically over any space fully closed by walls, doors and windows and fades out when the hero is
inside. `templates/base.html` implements this: floors per tile, `H` and `V` edge maps, a flood fill from the map
border to find rooms, and three small collision circles per wall edge (the engine only has circle collision).
The south walls of the room the hero is in are drawn low so they do not hide the interior.

## Boats and sea travel

Robin wants big islands with big seas between them (small islands were rejected), so the map is large: a handful of
islands, each tens of tiles across, placed on a jittered grid with wide gaps. The map size follows the settings
(about 384 by 272 tiles by default), so only pieces of sea that touch land are painted, lazily, when first seen;
open water reuses one shared piece. A chart in the corner shows the whole sea.

`templates/sea.html` prototypes travel by boat: the islands above with a home island and dock, E to board and
to step ashore, and a boat with speed, acceleration, turn rate, glide and grip (two steering modes: Direct and
Tiller). The boat is a top-down outline rotated in the ground plane and squashed by the 0.75 view factor, with
upright masts and funnels added on top. It relies on three `Combat.api.scene` hooks: `walk(x, y)` (keeps walkers
off the water), `heroLift()` (the hero rides the bobbing deck) and `noHeroShadow`.

## Design conventions

- Game rules live in plain data plus a few systems (one stat pipeline, abilities bound by ID).
  Balancing should mean editing numbers, not rewriting code.
- Combat is keyboard-first. The mouse is only for aiming the ranged weapon, which also has an auto option.
- No screen shake. Hit weight comes from short local pauses, squash, impact rings and sound.
- Hit weight preset "Snappy" is the chosen setting.
- The hero and enemies keep their outlined style and stand inside the painted world.
