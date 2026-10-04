# Viking survival game: prototypes

A 2D top-down survival crafting game set in Viking-age Scandinavia: an archipelago of big islands with big seas
between them, seen through a three-quarter camera with a cartoon look. Everything (art, animation, sound) is drawn
or synthesized in code.

This folder holds the editors and playable prototypes built so far. The game was a post-apocalyptic steampunk
game until October 2026; the `main` branch keeps that last state and the `viking` branch holds the new direction.

## Run it

```
npm start
```

rebuilds and opens the start page (`dist/index.html`), which links to everything. The pages are single files with
no dependencies, so you can also open any file in `dist/` directly.

| Page | What it is for |
| --- | --- |
| Character Editor | Tune the hero: proportions, colours, walk and attack |
| Creature Editor | The animals (wild boar, deer, bear, snake, moose, wolf): looks, movement, behaviour |
| Object Editor | One world object at a time: size, shape, surface, colour |
| Environment Editor | A patch of land: biome, ground, which objects appear, how dense and how open |
| Base Editor | Build a homestead piece by piece; closed rooms get a roof |
| Sea Editor | The archipelago and the ships: island sizes, sea distances, handling |
| Combat Arena | Fight wolves, boars, snakes and the bear |

Each editor can copy its settings out as text, and paste them back in.

Rebuild after changing anything in `src/` or `templates/`:

```
npm run build
```

Run the checks (needs Node):

```
npm install
npm test
```

## Folder layout

```
src/art.js          the hero, the animals and other creatures
src/stylelab.js     the world: props, ground tiles and the shared look
src/combat.js       the arena engine: movement, combat, enemy behaviour, rendering
templates/          the HTML shell for each page
tools/build.py      stitches templates and source into single-file pages in dist/
tools/visual/       scripts that render things to PNG for checking
tests/              headless checks for combat behaviour (see tests/README.md)
dist/               the built pages
```

## Controls

| Key | Action |
| --- | --- |
| W A S D | Move (steer, when aboard a ship) |
| Hold Shift | Sprint (drains stamina) |
| J or left click | Attack, three-hit combo. Hold to charge a heavy swing |
| K or right click | Block. Press just before a hit to parry |
| Space | Dash (sidestep, brief invulnerability) |
| F | Ranged shot (mouse or auto aim) |
| Q | Target lock |
| E | Board a ship, or step ashore (Sea Editor) |

## Design in brief

The world is water with islands everywhere. Islands are large, can hold several biomes, and there are no gates
or keys: areas are open, and harder ones are a struggle until you have progressed in earlier ones. The first
work covers only the starter island and the nearby islands, all of the first biome. The look is bright, lush
and green. The tone is real Viking-age Scandinavia.

`CLAUDE.md` has the full, current design notes and the conventions for the code. An older design document for
the steampunk version exists (https://claude.ai/code/artifact/3b87f164-5988-46e9-9044-d0914e1a2131); it is out of
date and has not been rewritten for the Viking game.

## Conventions that matter

- Game rules live in plain data and a small number of systems, so balancing means editing numbers, not rewriting code.
- Combat is keyboard-first. The mouse is only needed to aim the ranged weapon, and that has an auto option.
- No screen shake. Hit weight comes from short local pauses, squash, impact rings and sound.
