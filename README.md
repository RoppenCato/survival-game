# Survival game prototype

A 2D top-down survival crafting game: post-apocalyptic steampunk world, Valheim-style progression
seen through a Zelda-style three-quarter camera, with a MapleStory-like cartoon look.
Everything (art, animation, sound) is drawn or synthesized in code.

This folder holds the playable prototypes built so far: the art style test and the combat test.

## Where things live

| What | Where |
| --- | --- |
| Design doc (source of truth for the vision, world, systems) | https://claude.ai/code/artifact/3b87f164-5988-46e9-9044-d0914e1a2131 |
| Combat test, published | https://claude.ai/artifact/ELQPV4VD7fAXrrQsyd1kuP |
| Art style test, published | https://claude.ai/artifact/ULP4xf7rUrDGHpj4AoGjzz |
| Style lab, published | https://claude.ai/artifact/Xxso3ikYbq9wbEi48Yh7Bn |
| Walk test, published | https://claude.ai/artifact/3MGyLz1btnd7J9cTu7rwAQ |
| Zone world, published | https://claude.ai/artifact/BA52fqr7xJ4fMEYMHr8EbS |
| This folder | code, build script, tests |

The design doc can be exported to Markdown, Word or PDF from the doc itself. Keep an exported copy in a
`docs/` folder when you put this under version control.

## Folder layout

```
src/art.js          character, scene and style drawing (shared by both pages)
src/combat.js       combat simulation, enemies, effects and rendering
src/stylelab.js     the Style lab: Factory and outside sets, looks, colour directions, ground tiles, baked props
src/walk.js         the Walk test: tiled world, chunks, props, hero movement, lighting
src/zoneworld.js    the Zone world: random zone-graph generator, sealed Factory, gates and mechanisms, cold and heat layers
docs/               style-bible-v0.json holds the chosen style (Night Forest, Painted)
templates/          the HTML shells for each page
tools/build.py      stitches templates and source into single-file pages in dist/
tools/visual/       scripts that render pose sheets (swings, walking, guarding) to PNG
tests/              headless checks for combat behaviour (see tests/README.md)
dist/               built pages: index, the three editors, combat-arena, world-prototype and three older experiments (.html)
```

## Run it

`npm start` rebuilds and opens the workbench (`dist/index.html`), a start page that links to every editor
(Create) and every playable page (Game).

The pages are single files with no dependencies. The editors are `character-editor.html`, `object-editor.html`
and `environment-editor.html`; the playable pages are `combat-arena.html` and `world-prototype.html`.

Open `dist/character-editor.html` to tune a character: the same arena, plus sliders for body proportions and
animation, colour pickers, tone controls and preset variations. Settings can be copied out as text.

Open `dist/creature-editor.html` to design monsters, bosses and critters: body plan, features, colours,
movement and how they warn before attacking, with a live arena to fight them in.

Open `dist/object-editor.html` to tune world objects (trees, rocks, furniture, machines and more, by category):
size, shape, surface and colour, with the hero walking next to them for scale.

Open `dist/environment-editor.html` to lay out a patch of world: biome, ground, which objects grow there,
how dense, how grouped and how open, with a readout of open ground and room for base plots.

Open `dist/base-editor.html` to build a base piece by piece: floors, walls on tile edges, doors, windows and
furniture. Closed rooms get a roof automatically, and it fades when you walk in.

Open `dist/sea-editor.html` to try travel by boat: board at the dock, sail between islands, step ashore.

Rebuild after changing anything in `src/` or `templates/`:

```
python3 tools/build.py
```

Run the checks (needs Node):

```
npm install
npm test
```

## Combat test controls

| Key | Action |
| --- | --- |
| W A S D | Move |
| Hold Shift | Sprint (drains stamina) |
| J or left click | Attack, three-hit combo. Hold to charge a heavy swing |
| K or right click | Block. Press just before a hit to parry |
| Space | Dash (sidestep, brief invulnerability) |
| F | Ranged shot (mouse or auto aim) |
| Q | Target lock |
| H | Spawn a bot |
| R | Restart after you are scrapped |

The page also lets you switch melee aim (Facing, Soft aim, Target lock), ranged aim, shield, juice,
sound, hit weight (Snappy is the chosen setting) and crit chance.

## Chosen art style

Night Forest, Painted look ("dark MapleStory"). The exact numbers are in `docs/style-bible-v0.json`
and in the design doc. Open `dist/style-lab.html` to see it and compare the other looks.
The hero and enemies keep their current outlined style and stand inside the painted world; the
Style lab shows the real hero in every scene.

## Status

Design is well along: setting, world zones and gates, base building, travel (cable cars, no teleports),
food and abilities, character panel and gear slots.
Built and tuned so far: movement, sprint, combat feel (hit weight, crits, parry, charge), enemies
(bot, turret, bossbot, Guardian) and the character animation.

Next up, per the doc's milestones: M1 (walk and gather in a small dark factory map), then M2 (craft and build).

## Conventions that matter

- Game rules live in plain data and a small number of systems (one stat pipeline, abilities bound by ID),
  so balancing means editing numbers, not rewriting code.
- Combat is keyboard-first. The mouse is only needed to aim the ranged weapon, and that has an auto option.
- No screen shake. Hit weight comes from short local pauses, squash, impact rings and sound.
