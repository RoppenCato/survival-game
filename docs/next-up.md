# Next up

The one page to open for "what's next". Kept short: what Clive, GD is doing now, what waits on Robin, what waits on a studio.
The detail lives in the chapter checklists (`docs/chapter-0-checklist.md`, `docs/chapter-1-checklist.md`), the decisions
(`docs/decisions.md`) and the idea bank (`docs/idea-bank.md`). Update this page whenever something moves.

Last updated: 2026-11-10.

## Now (Clive, GD), in order (Robin asked for the list, 2026-11-10)

1. **See today's work in the game.** Needs the browser pane showing, or Robin's play: the claim stone's three acts at a real stone, a clue's `?` on the map, the Old Man's new look, the bear rug, the log towed on the water, the rune screens with upgrading off, Eadric and the ruin's lines. Fix what is off. Until the pane shows, go on with 2.
2. **Finish step 8:** Old Aslak's two clues (old pines, sailcloth), Arnor's line about the loom, the three whispered rumours of chapter 2, and the steading's houses mended when you come back from another island (read how the steading's houses are stored first; it is chapter 0's ground).
3. **Small leftovers of steps 1 and 3:** the spring, the bay and the hill as things you see on the home islands; more deer, fish or birds where an island has more; the walls' corner ends and posts; the elm door; the log drawn behind him when he faces west to north; the picked states of herbs, flax and roseroot; Eadric's own look and Jorunn always a woman.
4. **Step 9, the scripted run:** extend `tools/visual/play0.js` from the blót to the sail out (home, Arnor, flint, the old pine and its log, Saltvik, the loom, the claim stone, the ship, the swell), a step a call.
5. **Step 9, the balance:** from that run, count what each thing costs and where it comes from, and set the numbers so the ship comes last and no island is skipped for nothing (flint, flax, timber, pelts, salt).
6. **The foundations for chapter 1:** save and load at every step, the error log after a full run, the frame rate in a village and at sea, no leaks of chapter 2.
7. **Chapter 0's loose ends:** fix whatever Robin's next run finds; the frame log from his work computer; sort the `LORE?` marks left in the code against the lore.
8. **Write up chapter 1 for Robin's play:** the checklist's states made exact, and a short list of what to try, as for chapter 0.

## Waiting on Robin

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

**To decide:** `docs/decisions.md`: D5 (the frame log from your work computer) and D8 (the hall's size, once you have built one) for chapter 0; D22 for chapter 1.

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
