# The village's life: fields, plots, meadows and yard pieces (Colin, AD, 2026-11-24)

For Clive, GD: Robin's ask 3 of 2026-11-24, for the open villages. `village_life.png` shows everything at the game's size with the hero:
- the fields laid as your generator lays them, north and south;
- the kitchen plots;
- the standing pieces among them.

## 1. Ground pictures: `life_ground\` (14 pictures and `ground.json`)

These are flat. They go under everything, the way the salt works' ground pictures do. Each is seen in the game's own ground (K 0.75), at 0.25 units a pixel, with no ink ring. The edges that don't tile are softened into the grass.

`ground.json` gives each picture's `w`, `h`, `ax`, `ay` (the ground point it is laid by), `upp`, `tiles` (`x`, `y`, `xy` or null) and `tile` (one tile's size in pixels).

### Your fields (north and south)

**`ploughStrip_ns`**: ard-ploughed soil in ridges, 3 tiles wide.
- One picture is one length: 10 tiles, 320 units of ground, 960 px on the screen.
- Its anchor is this length's south end, on the strip's middle line. Lay the next length 960 px higher.
- Cut the last length wherever the field ends: the ridges run evenly, so any cut joins.

**`ploughStrip_ns_endS`, `ploughStrip_ns_endN`**: one tile more at each end, where the furrows stop and the grass comes back.
- `endS` is anchored at the field's south end.
- `endN` is anchored at its north end, which is wherever your last length was cut.
- Their joining edge keeps its full alpha, so no seam shows.

**`_sown`, with all three**: the same field with the young barley's green rows on the ridges.

**Six tiles wide**: lay two strips side by side, 96 units apart. Each strip keeps its own grassy edge, so a narrow balk shows between them, as between two men's strips.

**`hayMeadow`**: tall pale grass in tussocks, with buttercup, clover, harebell and a few white umbels.
- 96 units across and 128 north to south (384 by 384 px), tiling both ways. Its anchor is the south-west corner.
- It fills a field 3 or 6 tiles wide.
- Its edges are hard (it is a tile). If you want a soft edge where it meets the grass, mask it at bake time with a blob shape, `destination-in`. That is a composite, safe from file://.

**`hayMeadow_mown`**: the meadow cut, for the hay field you named.
- Short stubble in two tones, with the hay lying in two swathes a strip, running north and south as the scythe went.
- Same size and tiling as `hayMeadow`. It replaces the flowers you have there today.

### Spare: east-west strips

**`ploughStrip_ew`, `_ew_sown`** (one length of 320 units, 1280 px, tiling east) and **`ploughStrip_ew_end`**.
- Their anchor is the strip's west end on its middle line.
- For the east end, draw `_ew_end` mirrored with its anchor at the strip's east end.
- In case a field ever lies the other way.

### Kitchen plots

**`kitchenPlot_1`, `kitchenPlot_2`**: 3 by 3 tiles (96 by 96 units), anchored at the plot's middle.
- Four dug beds lying east and west, with trodden paths between, a hand higher than the paths.
- The crops are tallest at the back, so nothing hides what is behind it:
  - north: peas on twigs and broad beans in flower
  - kale
  - leeks and onions
  - south: dill and low herbs
- A clump of angelica stands in the north-east corner.
- `_2` lays the crops in another order.
- The crops are low enough to be drawn under a figure. If someone may walk into a plot, its north half will draw under their feet, which is right.
- The hut's old `kitchenPlot` (chapter 0's) can take `kitchenPlot_1` if you like.

## 2. Standing pieces: `life\` (12 pictures and `life.json`)

These are set pieces with the thin line, packed like the others: `w`, `h`, `ax`, `ay` at the foot, `upp`, `height_m`.

- **`scarecrow_1`, `scarecrow_2`**: a cross of poles in an old grey wool tunic with a patch, straw out of the cuffs and the hem, and a sack head with stitched eyes.
  - `_1` wears a hood.
  - `_2` wears a straw hat and has a dead crow hung by its feet from the right arm.
  - 2.15 m tall.
- **`washingLine_ew_1`, `_ew_2`, `washingLine_diag_1`**: two forked posts and a sagging line, 3.1 m.
  - `_1`: a linen shift, a faded madder tunic and a checked blanket.
  - `_2`: a woad-blue tunic, kerchiefs and a shift.
  - `diag`: turned about 30 degrees, for variety.
  - I dropped a north-south one: seen end-on, a line or a rack reads as a pole.
- **`hayRack_ew_full`, `_ew_empty`, `hayRack_diag_full`, `_diag_empty`**: the hesje.
  - Four posts and five rails, 3.4 m long and 1.7 m high.
  - Full, the hay hangs over each rail as a wall in layers, greener low and gold at the top.
  - Empty, a few wisps are left on the rails (bare, it read as a fence).
  - It belongs at a hay field's edge.
- **`flowerBed_1..3`**: a bed 1.9 m long by 0.6 m, for along a south wall by a door, edged with small dark stones.
  - `_1`: marigold and cornflower.
  - `_2`: chamomile and red campion.
  - `_3`: yarrow, tansy and mallow.
  - No ink ring (`ring: false`).
  - They replace the old `flowerBed` of 2026-10-20 (your stylelab one and the steading set's).

The old `scarecrow` (steading) and `washingLine` (yard) of 2026-10-20 can go once these are in. They are the same things, older and plainer.

## Weight

- Ground pictures: 3.95 MB on disk, 10.0 MB decoded. The strips are big; one length of a north-south strip is 428 by 960 px.
- Standing pieces: 0.5 MB on disk, 2.1 MB decoded.

## Making them again

- `build\life_build.py`: the builder. Run it as `node tools/blender.js life_build.py -- <render dir> [--only a,b]`.
  - The ground pictures render with an exact window on the ground, and their neighbours repeated around them, so what crosses a seam crosses it right.
- `build\ground_pack.js` packs the ground pictures.
- `tools\pieces_pack.js` (the studio's) packs the standing ones.
- `build\scene.js` draws the picture.

— Colin, AD
