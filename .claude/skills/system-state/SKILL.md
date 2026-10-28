---
name: system-state
description: Before changing any system of the game (the game page, combat, raids, the world, art, sound, destruction, a page or test scene), read how it stands now in docs/state/<system>.md, and after the change update that file (what is true now, Robin's decisions marked as his). Use whenever a game system is worked on.
---

# How each system stands

`CLAUDE.md` keeps the direction, Robin's decisions and the rules for working. How each system is built now lives in `docs/state/`:

| File | What it covers |
| --- | --- |
| `docs/state/game.md` | `templates/game.html`: chapter 0 as rebuilt, the start, gathering, the bag and Tab screen, crafting, building, home and comfort, the year, the weather, wading and swimming, day and night, food, the villages' animals, beasts, the troll's cave, the runes, the hird, villages, boats, the living sea, fishing, the world map, the look, the UI |
| `docs/state/pages.md` | every page in `dist/` and every test scene |
| `docs/state/combat.md` | `src/combat.js` |
| `docs/state/raids.md` | men, towns and raids |
| `docs/state/destruction.md` | `src/ruin.js` |
| `docs/state/world.md` | `src/world.js`, mountains, caves, villages |
| `docs/state/art.md` | the Blender pipeline and what is in the game |
| `docs/state/sound.md` | synthesized and recorded sound, music |

1. Read the file for the system before changing it (search it for the function or name first), and read `CLAUDE.md`'s map ("How the game fits together") for what else the change touches: the gates, the flows, the wake block, `eWhat`, the shared `src/` files and the save's migrations.
2. After the change, write what is now true there, in the same voice: what it does, its numbers, whose decision (Robin's, or "mine").
3. A change to how systems connect goes in the map in `CLAUDE.md`. A change to the direction, Robin's decisions or the rules for working still goes in `CLAUDE.md`.
