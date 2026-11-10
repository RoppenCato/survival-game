# The claim stone and the hero's three acts at it (Colin, AD, 2026-11-10)

For Clive, GD, chapter 1 item 6.

- `states.png`: the four states beside the hero at twice Robin's size.
- `acts.png`: every frame of the three acts, drawn from the packed set with the stone pictures behind him where the clips expect them.
- `acts_zoom.png`: a few of those frames, larger.

## The stone: `pieces/claimstone.json`, 24 pictures

A grey slab 2.9 m long, 1.15 m wide and 0.42 m thick, with soft lichen.

**Anchor.** Every picture has the same anchor (`ax`, `ay`): **the centre of the lying stone's footprint**. Lying, it is 1×2 tiles, east to west. Standing, it is 1 tile wide and under half a tile deep, centred on that same spot, about 1.6× the hero's height. Each entry gives `kind`, `part` (`state`, `fill` or `raise`) and `frame`.

| Pictures | What |
| --- | --- |
| `claimStone_flat` | as found, blank |
| `claimStone_carved` | carved: a serpent band in a ring round the face, rune strokes in it, a head-down hammer in the middle |
| `claimStone_blood` | the carving run red with blood |
| `claimStone_standing` | raised, its carved face to the south, wedge stones round its foot in the pit |
| `claimStone_fill_00..07` | the pour: the red running round the ring, from carved (00) to blood (07) |
| `claimStone_raise_00..11` | the raise: lying (00); the stone tips up from its west end while its foot slides to the centre; then it turns a quarter in its pit to face south. The last frame is the standing picture. |

## The hero: three new clips in the set

All three are in `out/hero-kit_2026-11-10b/hero-kit`. He works from the south, facing north, so **each clip has only the north view**. The other seven views are empty, so face him north for them.

| Clip | Frames | Rate | What |
| --- | --- | --- | --- |
| `stone_carve` | 8, a loop | 10 fps | kneeling at the edge, the chisel in his left hand on the face, the mallet in his right up and down. `contact: 5` is the strike, for a chip or a sound. Loop it while E is held (about 4 s, five strikes). |
| `stone_pour` | 12 | 8 fps | bending over the stone with the bowl, tipping it along the ring: about 1.5 s |
| `stone_heave` | 12 | 6 fps | down low with both hands under the edge, the strain, the stone coming up, the arms pushing it upright: 2 s |

**Keep the strips in step with the clips:**

- Heave frame *n* goes with `claimStone_raise_n`.
- For the pour, `claimStone_fill_` round(*n*/11×7) goes with pour frame *n*.

**Where he stands.** His feet are 0.925 m south of the stone's centre, the same x. On screen that is 11.5 units up from his feet to the stone's anchor. In world units it is **15.3 south** with the ground factor 0.75 (`GROUND_K` in `src/sprites.js`).

**Frame.** The three clips have their own frame: 81×165, anchor (45, 138.2).

**Tools.** Three new layers, drawn untinted:

- `toolChisel` and `toolMallet` on `stone_carve`;
- `toolBowl` on `stone_pour`.

Every worn layer is on all three clips, the wolf skin too.

**Left to you, if you want them:** stone chips at the strike, and the thin stream of blood from the bowl to the stone. Both are small enough to draw in code.

`build/`:

- `ch1b_build.py` builds the stone and its strips (`claim_stone`).
- `claim_clips.py` builds the three clips into the kit's files.
- `cs_render.js` renders them in the one view.
- `pack.js` names the frames north, empties the other views and packs.
- `check.js` draws `acts.png`.

— Colin, AD
