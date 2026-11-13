# Next up

The one page to open for "what's next". Kept short: what Clive, GD is doing now, what waits on Robin, what waits on a studio.
The detail lives in the chapter checklists (`docs/chapter-0-checklist.md`, `docs/chapter-1-checklist.md`), the decisions
(`docs/decisions.md`) and the idea bank (`docs/idea-bank.md`). Update this page whenever something moves.

Last updated: 2026-11-13.

## Now (Clive, GD), in order

1. **The villages' look, with Colin, AD** (Robin, 2026-11-10): his list is closed and in the game (paths, roof ages, the green, Saltvik's salt works, Gamli's hut, the ruin, the mound and the hill). Mine still: grass tufts over the path edges, damp earth by the well.
2. **What is left of chapter 1** (Robin, 2026-11-10: "Do all of them"; built the same day: Old Aslak's two clues, Arnor's loom line, the whispers of chapter 2, the steading mended on your return, the ford, the spring, river fish, ducks on rivers): Eadric's own look, a plank bridge on every river and the ford's stones as pictures (Colin, AD's `out/eadric` and `out/crossings`, in the game the same day); the sounds below; the crafting board's names cut short by the `new` mark (a look for Robin: it touches chapter 0's board).
3. **Seen in the game, 2026-11-10, in the small pane:** a clue's `?` on the map, the turf roofs, the foothills, the rune screens with no tiers, the mended hall, the ford. By script only: the claim stone's acts, the log shouldered and split. Not seen: the towed log on the water, night on fresh water, a spring, a whisper said aloud.
4. **Chapter 0's loose ends:** whatever Robin's next run finds; the frame log from his work computer; the `LORE?` marks.

## Waiting on Robin

**Chapter 0 after Robin's run of 2026-11-13:** everything Checked but the boat's turn (1.13). It waits on Colin, AD's 64 headings of the rowboat, then on Robin's look. After that the alpha is made (3.7 tested then). **Robin wants to rewrite Arnor's lines himself:** asked of Alistair, LD the same day where; the Sagabók has a dialogue register and session (`site/index.html#dialogue`).

**The winter ice, first rung (2026-11-11):** in the dev version; `docs/ice.md` says how to try it and asks three questions. Next on it, when you say: ice fishing, wolves on the ice, its sounds.

**Chapter 1 after the looking pass of 2026-11-11** (`docs/chapter-1-checklist.md`, the top line of What changed): nothing of the chapter is Not built now. The crafting list's `new` is a red mark alone: it is on chapter 0's board too, yours to look at. Still not seen by me: Hallveig's and Gamli's marks, a spring, the claim stone after a save and load in the pane.

**Chapter 0 after Robin's run of 2026-11-11:** left to check are 1.10 (the boar quest's `!`), 1.13 (the boat: oars, the turn), 2a.5 (no window light in a ruin), 2c.7 (Take apart), 2d.3 (the map's mark), 3.5 (the controls), 3.7 (the alpha's cap), 4.2 (the ragged outfit, once Colin, AD's pictures are in). **Colin, AD the same day:** the rowboat's hole mended, the salt works set into the ground and the new field gate are in the game; `shirtRag` and `shortsRag` are in the kit (`out/rags`, `assets/sprites/hero-kit/RAGS.md`); the bare hero is the body in its own drawers.

**The ice's sounds are stand-ins** (the creak, the long crack, the break and the splash): references wanted. **Sounds of chapter 1 with no sound yet** (each wants a reference Robin likes before Derek, SD makes it): the loom's beat, an old pine falling and its log split, the claim stone carved and raised, the salt pans' boil, a river's run and a lake's lap, ducks and a swan, the Old Man's roar.

**The Old Man's blow is 40 since 2026-11-11 (your yes).** Before: **The Old Man, measured 2026-11-10:** a blow of his takes 55 of the hero's 100, so two blows kill; with a flint spear the fight is about 40 seconds and 50 thrusts with none of his blows landing twice. Mine to suggest: 40 a blow, so wolf-skin gear lets you take three. Yours to say.

**To play (chapter 0, thirteen items; `/dev/` or `npm start`):**

1. Arnor's workbench: in his broken house no recipe can be made; once the house is mended, the bow and the quiver can.
2. The bow and the quiver are made at the workbench; arrows by hand or there, once a quiver is worn (2b.3).
3. A sword hit: a short red slash and drops. An arrow hit: drops only. No orange dots, also not when a boar is about to charge (2b.1, 2e.4).
4. Shift and click moves things from every row of the bag into a chest and back (2c.5).
5. Building pieces at night: an east or west window lights only the outside; the smoke hole is bigger; the door's light does not cross the hero (2a.5).
6. Arnor gives the boat: a `?` over him and the boat, the boat turns smoothly, the far oar goes under the hero (1.13).
7. The map and the minimap: the arrow follows the boat; `!` and `?` in place of the red cross (2d.3).
8. Every control in `CLAUDE.md`'s Controls list once: nothing doubled or dead (3.5).
9. Save and load at several steps, once from a file (3.1).
10. The error log empty after the run: Escape, Admin, download `errorlog.txt` (needs `npm start`) (3.2).
11. The hero in the undyed shirt from the wreck on, and wild herbs and fallen trees as pictures (4.2, 4.4).
12. The first tools are called Stone Axe, Stone Pickaxe and Stone Knife (4.5).
13. The alpha's cap: I test it when the alpha is made (3.7); nothing for you yet.

**To decide:** `docs/decisions.md`: D5 (the frame log from your work computer) and D8 (the hall's size, once you have built one) for chapter 0; D22 for chapter 1. **Inland water is decided** (Robin, 2026-11-10: lakes and rivers both, on the big island and some islands round, varying sizes, a river also from lake to lake; a first version is in the game, the fresh-water look and the rest in `docs/inland-water.md`; a boat up a river is a maybe). **Turf roofs on byres and boathouses: yes** (Robin, the same day; Colin, AD's to lay in the generator).

## Waiting on a studio

| Who | What | Since |
| --- | --- | --- |
| Colin, AD | How other games announce a new thing to do, for the "Building" board (D1) | 2026-10-26 |
| Colin, AD | The blót's ritual clips and props (the cut-scene uses stand-ins) | 2026-10-29 |
| Colin, AD | Pictures for the cave mushrooms and angelica (stand-ins today) | 2026-10-29 |
| Alistair, LD | 44 `LORE?` marks in the game's code: most have words since handoff 23 and only need the mark taken off; I sort which are left | 2026-10-31 |
| Colin, AD | Nothing waits: every chapter 1 item asked on 2026-11-10 is delivered and copied in. Still open from before: the blót's ritual clips and props, pictures for the cave mushrooms and angelica, the study for the Building board | |
| Alistair, LD | Nothing: handoffs 24 to 28 (2026-11-10) have chapter 1's people, places and lines, copied into `assets/lore/` | |
| Derek, SD | Nothing asked yet (step 5's chisel and step 6's bear when they are built) | |

## After that

- Chapter 0 all Checked: the alpha is made from it (`docs/chapter-checks.md`), and chapter 1 becomes current.
- Chapter 1: its list is built from what exists (two rounds, 2026-10-29) plus what we decide is missing.
