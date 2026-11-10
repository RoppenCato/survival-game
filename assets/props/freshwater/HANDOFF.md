# Fresh water: the look of lakes and rivers (Colin, AD, 2026-11-10)

For Clive, GD. Robin said yes to lakes and rivers (via you, 2026-11-10). Today they are the sea's water inland: turquoise, sand rims, surf lace, gulls.

- `fresh_vs_now.png`: today's look beside the proposed one.
- `fresh_mock.png`: the proposal alone at Robin's size. `mock.js` paints it with exactly the numbers below on the game's grass, with real pieces.

## Painted by the ground painter (my numbers, your code)

**Everywhere fresh water is:**
- no sand rim, no surf lace, no gulls;
- grass right to the edge, with your path tufts leaning over the water's edge (4 a tile, `#5e8a3e` and `#7aa04e`, 6–10 px tall at Robin's size);
- under the tufts, a thin dark wet line on the shore: rgba(58,52,34,0.75), 1.5–2 units wide;
- sand only at a ford or watering place (below).

**A lake: calm, darker toward a peaty middle.**
- **The colour by depth.** Take d = the distance from the shore over 0.8 of the lake's radius (0 to 1). Ramp smoothly, with no bands:

  | d | Colour | What it is |
  | --- | --- | --- |
  | 0 | `#8c8c5e` | the shallow bottom seen through: olive-amber |
  | 0.1 | `#7c9468` | |
  | 0.32 | `#5f8678` | |
  | 0.58 | `#4b716c` | |
  | 1 | `#3f6462` | the peaty middle |

- **The banks' reflection:** a band about 7 units wide just inside the shore, rgba(38,58,46,0.2), its inner edge soft.
- **The sky lying in it:** level streaks (thin flat ellipses) 13–37 units long and about 1.5 px tall, rgba(200,222,226), alpha 0.3 near the north shore falling to 0.12 toward the south. They drift slowly east, about 2 units a second. About one to 400 square units.
- **Glints:** dashes 2–4 px long, rgba(236,242,238,0.42), each fading in and out over 1–2 s. Sparse: about one to 900 square units.
- **A fish rising** every 3–6 s somewhere on a lake: a ring growing from 2 to 8 units across 1.5 s, line 1.2 px, rgba(230,240,236,0.38) falling to 0.
- **Birds:** ducks, or a swan on Svanesey, would sit well (your beasts), in place of the gulls.

**A river: a current.** Across its width, from the banks in, using the same wet line and tufts as the lake:

| Part | Colour |
| --- | --- |
| the shallows at the banks | `#80906a` |
| the inner 68% | `#62857a` |
| the inner 38% (the channel) | `#527670` |
| the inner 16% | `#47696a` at 70% |
| the banks' reflection | rgba(38,58,46,0.1) |

- **The current:** short pale streaks along the flow, 5–12 units long, 1.3 px, rgba(222,236,232,0.42), about two to every 4 units of river.
  - They drift downstream at 14–22 units a second, faster where the river narrows (speed about 1/width).
  - Each lives about a second, fading in and out.
- **Riffles:** white V's, rgba(240,244,238,0.6), 6–10 units, flickering, just downstream of any stone in the water and over a ford.
- **Optional:** a cut bank on the outside of bends: earth `#6a5640`, 2–3 units along the edge.

**A ford or watering place** (where a path or road crosses, or a farm's animals drink):
- a gravel bar across the river under shallow water: rgba(168,152,118,0.55), as long as the river is wide × 1.15, about 9 units deep;
- sand on both banks, `#cdb88e`, there only;
- `bankStones` as stepping stones.

**Where a river meets the sea:** blend the fresh ramp into the sea's over about 4 tiles. The sea's sand may begin there.

**Night:** the sky streaks at half, the glints the moon's.

## Set pieces (new: `pieces/freshwater.json`)

- **`lilyPads_1..3`:** a raft of round notched pads in three greens, one or two white water lilies with gold hearts, and a yellow one. They lie flat, with the water drawn by you. Put them on still water only: a lake's shallows, a slow bend, never in a river's channel. In clusters of one to three.
- **`bankStones_1..3`:** two to four mossy rounded stones, wet and dark below the line, a tuft of sedge between them. Put them at river banks and bends, and a row across a ford as stepping stones.
- **From the game:** `reeds_1..3` in a lake's shallow bays and at river mouths; `tallGrass` and `fern` on the banks.

They're in the set pieces' format, with the anchor at the middle of the foot. `ch1b_build.py` holds `lily_pads` and `bank_stones`.

## Turf roofs on byres and boathouses (src/village.js, done)

Robin's yes. In the north (not the lowlands, which keep their tiles), byres and boathouses now take turf (`roof = 0`). Every layout is the same (the same paints), so VERSION stays 5. Please build and commit.

## Later

The plank bridge for the Building board, once the water is in.

— Colin, AD
