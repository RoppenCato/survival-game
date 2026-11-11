# Saltvik's works set into the ground (Colin, AD, 2026-11-11)

For Clive, GD, from Robin's picture 133 ("It doesnt look natural") and your question: what else do they need from my side.

`saltvik_before_after.png` shows the game at the works, by day, at the hero's size, before and after. Both have your trodden earth.
The after is your build with my pictures swapped in, in the browser only. No file of yours was touched.

## What was wrong on my side

1. **Stones laid on the ground, not set in it.** The pool and the hearths were rings of round grey stones of one size, sitting on
   top of the ground, like beads.
2. **An ink ring at every foot.** The packer draws the silhouette in ink a hair out all round, heavier to the lower right. Round a
   thing that lies on the ground, that ring is the cut-out edge of a sticker.
3. **Nothing round them.** A hearth that has burned all season has ash round it. A pool the sea is let into has wet sand round it.

## What changed

- **The sea pool is dug into the shore:**
  - its water lies a hand and more below the ground;
  - its far bank shows as a band of wet sand above the water;
  - a dozen broken, sea-worn stones are set into the rim, with bank between them, not a ring;
  - the gap to the sea is on the south now (it was on the north side, inland), with its closing stone rolled aside;
  - kelp is left on a few stones by the flood.
- **The hearths under the pans** are fewer, flatter, broken stones of every size, half sunk, with two big cheeks at the fire's
  mouth and soot on their inner faces. The ash bed is set into the ground.
- **No ink ring** on any of the seven works. Their own thin line is kept: the set pieces' dark green-brown at half weight.
- **Ground pictures**, one for each work: soft painted ash, wet sand, damp and spilt salt, in the ground's own grain.

## The drop-in

**1. The pieces.** Copy `out\salt_ground\salt\*` into `assets\props\salt\`. The same seven names:

| piece | change |
|---|---|
| `saltPan_cold`, `_boil`, `_crust` | 3 px narrower, 5 px taller |
| `seaPool` | 278 x 130, foot at 133.3, 64.4 (was 290 x 148 at 144.3, 86.4) |
| `brineTub`, `saltBaskets`, `driftwood` | the same size, only the ring gone |

Anchors are still each work's foot, so nothing moves in `saltWorks`.

**2. The ground pictures.** Copy `out\salt_ground\ground\*` in as well, for example into `assets\props\salt\`. There are seven, each named
`<work>_ground` (`seaPool_ground`, `saltPan_boil_ground` and so on), and `ground.json` gives each one's `w`, `h`, `ax`, `ay` and
`upp` (0.25).

- Lay each one at its work's own foot point, under everything: under your trodden earth's top, under the figures and under the
  works.
- Best of all, stamp them into the ground when the village is planted, as your `V2.paints` are with `dabGround`. Then they cost
  nothing a frame, and a figure on the ash is never under it.
- They are **not** baked into the pieces. A piece is sorted by its foot, so a man standing on the ash north of a pan would have
  had the ash painted over his feet.

**3. Your trodden earth stays.** It is the wide base, and mine is the near ground on top of it.

**4. The sticker cure's drawings.** Leave the cast shadow and the foot grass off `seaPool`. It is a hole: a shadow to its lower
right and grass tufts over its rim both lift it back out of the ground. The pans can keep their shadow, but no foot grass, because
they stand in ash.

## Making them again

- `build\ch1b_build.py` (`sea_pool`, `hearth_ring`, and the new `sink` and `ground_hold`):
  `--only saltPan_cold,saltPan_boil,saltPan_crust,brineTub,saltBaskets,driftwood,seaPool`. Then `tools/pieces_pack.js`. It leaves
  the ring off a piece whose dict says `ring=False`.
- `build\ground_skirts.js` paints the ground pictures (its recipes are at the top).

— Colin, AD
