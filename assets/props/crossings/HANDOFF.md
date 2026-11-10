# The rivers' crossings: a plank bridge and a ford's stepping stones (Colin, AD, 2026-11-10)

For Clive, GD, who asked for both. The pictures:
- `crossings_robins_size.png`: at Robin's size, on the studio's fresh-water mock. Shows a river running north to south with the
  east-west bridge and the ford, and a river running east to west with the north-south bridge, with the hero and a villager on
  them.
- `bridge_twice.png` and `ford_twice.png`: the same at twice the size.

## Which form: a set piece the world lays, not a Building board piece

- **Nobody needs to build one.** A river is waded anywhere, so a bridge is never the only way over.
- **It has to fit its river.** Its length must match the width and its direction must lie across the flow. The world knows both
  where the river is made; a player's click on the board does not.
- **It belongs to the village path.** The path and the bridge come from the same place, the world.

Lay one where a village path meets a river. If Robin later wants the player to build crossings (for carts, or over a deeper river
further on), the same pictures can go on the board then.

## The pictures (`pieces/`, `crossings.json`)

All are 0.25 units a pixel, as the other set pieces: 0.69 MB on disk, 2.6 MB decoded.

### The bridges

| picture | lies | length | for a river up to |
|---|---|---|---|
| `bridgeEW_4`, `_5`, `_6` | east to west, for a river running north to south | 4, 5, 6 tiles | 2.8, 3.8, 4.8 tiles wide |
| `bridgeNS_4`, `_5`, `_6` | north to south, for a river running east to west | 4, 5, 6 tiles | 2.8, 3.8, 4.8 tiles wide |

**How one is made:**
- Three log stringers rest on stones on each bank, each end 0.6 of a tile on land.
- Split planks lie across them.
- One trestle stands in the water (two on the longer ones). Its posts go down into the water, with a pale ring where the water
  breaks. That is what makes the water read lower than the banks.
- One pole rail runs on the far side only: north on the east-west bridge, west on the north-south one.

**Placing it:**
- The anchor (`ax`, `ay`) is the middle of the deck at ground level.
- Choose a straight reach. Take the bridge whose length lies nearest across the flow there: a flow mostly north to south takes an
  `EW`, mostly east to west an `NS`.
- Take the shortest one that is at least the river's width plus 1.2 tiles.

**Drawing it:**
- Draw it with the ground things, under the people and the beasts, as a floor. Its rail is on the far side, so whoever walks over
  it is never behind the rail.
- Nothing on it needs to block. People and the hero walk over the deck. The river stays wadeable on both sides of it.
- If you lay a cast shadow, a soft band on the water south of the deck is enough.

### The stepping stones

`steppingStone_1..4`: one stone each, a flat top worn pale, the sides wet and dark, cut at the waterline. They are 12 to 18 units
across and 10 to 13 deep, sized for your row 17 units apart.

- Put one picture at each of your stones (the variant by your hash) in place of the drawn ellipse, with its anchor on the stone's
  middle.
- Keep your pale riffle below each, and the night at half, as you have them.

## Making them again

`build\ch1b_build.py` makes them (the chapter 1 set-piece builder; the bridge is `bridge()`, the stones `stepping_stone()`):

`node tools/blender.js ch1b_build.py -- <out> --only bridgeEW_5,...`, then `tools/pieces_pack.js <out> <pieces dir> crossings`.

`build\mock.js` paints the check picture.

— Colin, AD
