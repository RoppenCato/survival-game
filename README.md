# Viking survival game: prototypes

A 2D top-down survival crafting game set in Viking-age Scandinavia: an archipelago of big islands with big seas
between them, seen through a three-quarter camera with a cartoon look. Everything (art, animation, sound) is drawn
or synthesized in code.

This folder holds the editors and playable prototypes built so far. The game was a post-apocalyptic steampunk
game until October 2026; `main` is now the Viking game, and commit `59f5dd6` is the last steampunk state.

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
| Item Editor | Weapons and tools: material, size, sharpness, glow, twist and curl, name and tale; give them to the game |
| Song Editor | The game's music, played by its own instruments: tempo, key, tracks and notes; export as .mid |
| Combat Arena | Fight wolves, boars, snakes and the bear |
| The game | The first island: chop trees, mine stone, hunt boar, keep what you find |

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
src/world.js        the archipelago: islands, ground, what grows there (Sea Editor and the game)
src/build.js        building pieces, rooms and roofs (Base Editor and the game)
src/items.js        weapons and tools: drawing, names and numbers (Item Editor and the game)
src/music.js        the music: songs as note data, synthesized instruments, a sequencer, MIDI export (Song Editor and the game)
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
| Q | Switch between fight mode and gather mode |
| F | Fight mode: swap sword and bow (with the bow out, the attack button shoots) |
| Ctrl | Target the nearest enemy; again for the next nearest, then let go |
| 1 to 3 | Gather mode: axe, pickaxe, knife (the wrong tool does half damage) |
| B | Build mode (the game): right click opens the board of pieces, click to place, F toggles the wreck cursor |
| E | Cook at the camp hearth (the game); click food in the inventory to eat it |
| Tab | The bag (the game): a 6 by 4 grid, stacks of 25; the top row is the belt, numbered like the hotbar |
| C | The casting cloth (the game): lay learnt runes in hollows to use them |
| L | The Book of Beasts (the game) |
| R | Rise again after falling (the game) |
| E | Board a ship, or step ashore (Sea Editor) |

## Design in brief

The world is water with islands everywhere. Islands are large, can hold several biomes, and there are no gates
or keys: areas are open, and harder ones are a struggle until you have progressed in earlier ones. The first
work covers only the starter island and the nearby islands, all of the first biome. The look is bright, lush
and green. The tone is real Viking-age Scandinavia.

What sets the game apart is raiding, exploring and expanding: you raid villages, castles and churches for loot
and recruits, build a clan that crews your ships and works your village, and claim places. A yearly calendar of
four seasons repopulates unclaimed places after each winter. The compass always means the same
thing (cold north, rich south, trade to the east, open ocean to the west) but every world is generated anew.
Ideas that are not decided yet are in
`docs/idea-bank.md`, and the build order with its tests in `docs/roadmap.md`.

`CLAUDE.md` has the full, current design notes and the conventions for the code. An older design document for
the steampunk version exists (https://claude.ai/code/artifact/3b87f164-5988-46e9-9044-d0914e1a2131); it is out of
date and has not been rewritten for the Viking game.

## Conventions that matter

- Game rules live in plain data and a small number of systems, so balancing means editing numbers, not rewriting code.
- Combat is keyboard-first. The mouse is only needed to aim the ranged weapon, and that has an auto option.
- No screen shake. Hit weight comes from short local pauses, squash, impact rings and sound.
