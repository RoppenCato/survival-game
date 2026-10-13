# Viking survival game: prototypes

A 2D top-down survival crafting game set in Viking-age Scandinavia: an archipelago of big islands with big seas
between them, seen through a three-quarter camera with a cartoon look. Everything (art, animation, sound) is drawn
or synthesized in code.

This folder holds the editors and playable prototypes built so far. (The game had another setting until October 2026;
commit `59f5dd6` is the last of it, and nothing of it remains in the code.)

## Run it

```
npm start
```

rebuilds and opens the start page (`dist/index.html`), which links to everything. The pages are single files with
no dependencies, so you can also open any file in `dist/` directly.

| Page | What it is for |
| --- | --- |
| The game | The starter island and the big island, played from the wreck (chapters 1 and 2) |
| Combat Arena | The fight on its own: beasts and men against you, hirdmen beside you, every weapon, the shield and the gear, the clock slowed, the blows drawn and written down |
| Battle test (`game.html?scene=battle`) | Men in the real game: one, two, five against five, a town defended, a raid on it, walking in unarmed, a night raid, storming it |
| Destruction Editor (`game.html?scene=ruin`) | Breaking in, bringing down, burning and mending, with every number as a slider |
| Big island test (`game.html?scene=runes`) | The big island at a carver's bench with every rune known: the arm ring, the mountain, the cave |
| Mountain test (`game.html?scene=mountain`) | A mountain island of its own: the terraces, the slopes, the waterfall, the lookout, the caves |
| Art Editor | The Blender models (the hero, the beasts, the people) and the world's drawn objects |
| Village Editor | The rules that grow a village, with "Use in the game" |
| Sea Editor | The islands and the sea between, the ships and their handling, the Shipyard |
| Song Editor | The game's music, played by its own instruments; export as .mid |

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
src/art.js          the drawn hero and creatures (what shows while a Blender sheet is still loading) and small drawing helpers
src/sprites.js      the Blender models' sprite sheets drawn in the game and the editors: the hero, the beasts, the people
src/stylelab.js     the world: props, ground tiles and the shared look
src/world.js        the archipelago: islands, ground, the mountains, what grows there (Sea Editor and the game)
src/cave.js         the insides of the caves
src/build.js        building pieces, rooms and roofs
src/ruin.js         breaking in, bringing down, burning and mending
src/nav.js          finding a way round walls, for everything that walks in a village
src/village.js      the rules that grow a village (Village Editor and the game)
src/items.js        weapons and tools: drawing, names and numbers
src/combat.js       the engine: movement, combat, beasts and men, rendering (the Combat Arena, the game and the tests)
src/yard.js         vessels and the Shipyard
src/music.js        the music; src/ambient.js the sound of the place
art/                the Blender models, built by script and rendered to assets/sprites (art/README.md)
templates/          the HTML shell for each page
tools/build.py      stitches templates and source into single-file pages in dist/
tools/visual/       scripts that render things to PNG, and scripts that play the pages by themselves
tests/              headless checks (see tests/README.md)
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
`docs/idea-bank.md`, the build order with its tests in `docs/roadmap.md`, and the creatures' cards in `docs/beasts.md`.

`CLAUDE.md` has the full, current design notes and the conventions for the code.

## Conventions that matter

- Game rules live in plain data and a small number of systems, so balancing means editing numbers, not rewriting code.
- Combat is keyboard-first. The mouse is only needed to aim the ranged weapon, and that has an auto option.
- No screen shake. Hit weight comes from short local pauses, squash, impact rings and sound.
