# The rower at 32 facings, knees tucked (Colin, AD, 2026-11-13)

For Clive, GD. Robin, on the rower: "it just kinda flips in different angles".

## The pictures

- **https://claude.ai/artifact/HxnfANA9LiRC6NXJ6Yohff:** the castaway rowing the 96-heading rowboat through a turn, drawn your
  way: the boat's nearest picture turned on the ground, him at the seat facing the stern, her near side over him through the
  front mask. On the left he has 8 facings, on the right 32 with the knees tucked. The oars are left out.
- **`row_32_facings.png`:** the row clip's 32 facings at the game's size.
- **`knees_tucked.png`:** the pose as it was, and with the knees bent 15 and 25 degrees more (25 is the one delivered).

## What changed

- **The row clip has 32 facings** in every one of its 37 layers. A figure has to turn as one: a helmet at 8 facings on a head at 32
  would sit up to 22 degrees off.
- **His knees are bent 25 degrees more** (from about 86 to about 111), so his shins come back under his knees and his feet sit
  about 18 cm nearer the thwart. The arms, the body and the stroke are as they were.
- **Why his feet came through her side:** mostly the 8 facings. He could sit up to 22 degrees off her keel, which swings his feet
  toward the narrowing side. At 32 he is at most about 6 degrees off. Try it without your clip below the hip.

## The shape: the clip's own facings

`anims.row.dirs` is a list of 32 names in the set's own turning order. Row r of the rects is `dirs[r]`.

- Every fourth name is the set's own: `s`, `sw`, `w`, `nw`, `n`, `ne`, `e`, `se` at r = 0, 4, 8 ... 28.
- Between them are `s_1`, `s_2`, `s_3`, `sw_1` ...: a quarter, a half and three quarters of the way to the next.
- `anims.row.hands` is keyed by those 32 names, in the clip's frame, as before.

So `dirOf`, for a clip with its own `dirs`, is your same sum with `n = A.dirs.length`: `r = round((face - pi/2) / (2*pi/n)) mod n`,
and the name is `A.dirs[r]`. `frame`, `anchor`, `frames` and `fps` are unchanged.

**Checked:**
- The head layers at r = 0, 4, 8 ... cut as your eight did: 1149 of 1152 frames the same or within a pixel. That proves the order.
- No frame reaches past the clip's frame.
- All 3167 other sheets are byte-identical, and no other clip in the json differs.

## The drop-in

Copy `out\row32\hero-kit\*` into `assets\sprites\hero-kit\`. That is the 37 `row_<layer>.webp` sheets, replaced, and
`hero-kit.json`: yours, with the row clip's new rects, `dirs` and `hands`.

## What it costs

| | row clip now | row clip at 32 |
|---|---|---|
| on disk, all 37 layers | 2.35 MB | 8.85 MB |
| decoded, all 37 layers | 29.5 MB | 103 MB |
| decoded, the castaway's 5 layers | about 4 MB | 16.9 MB |

The clip is lazy per layer, so only the worn ones load, and only while he rows.

## Sitting in the boat

`sit` stays at 8 facings: it is the land's too, for benches and logs. In the boat, when he is not pulling, hold `row` frame 0 (his
hands low, the oars level). It is at 32 facings and costs nothing more. If you would rather have a seated idle of its own in the
boat, I'll render one at 32 as a separate clip.

## Making it again

- `build\tuck_row.py` bends the knees of the rowing file's `row` action: `-- <in> <out> 25`.
- `build\row32_render.js` renders the 37 layers at 32 facings (about 14 minutes with five at a time).
- `build\pack_row32.js <your set> <out>` lays them in.

**The renderer now takes a layer's own pieces only** (`build\render.py`: the name, or the name followed by `_` or `.`). By bare
prefix, `tunic` took `tunicWolf_*`, `shirt` took `shirtRag_*`, `cloak` took `cloakWolf_*` and `cloakBear_*`, and `arrowNock` took
`arrowNockWood_*`. I checked every kit layer: the strict match loses no piece.

— Colin, AD
