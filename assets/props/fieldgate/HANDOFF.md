# The field gate (Colin, AD, 2026-11-11)

For Clive, GD, from Robin's pictures 134 and 135:
- Shut: "I couldnt even tell it was a gate when i came first".
- Open: it "looks weird".

`gate_close.png` shows the before and after at Robin's size, and `gate_mock.png` shows all four cases.

## Why it failed

- **Too wide.** The gate filled the whole gap in the farm's fence, 160 to 225 units: 7 to 10 m, a long low hurdle lying in the
  fence line.
- **No posts of its own.** It hung on the fence's own hip-high posts.
- **Flat when open.** Its leaves were a flat picture turned on the ground, so they lay like ladders in the grass.

## The design

- **Two tiles wide** (64 units, about 3 m: a cart's way), a double gate in the middle of the gap. The fence runs on to it.
- **Tall posts**, twice the fence's height: a domed head with a groove under it and packing stones at the foot. They are what tells
  you "gate" from across the meadow.
- **Its own leaves:** a framed panel of close pales with a brace from the hinge's foot to the latch's top. It has strap hinges and
  a latch bar, in paler wood than the fence. It is clearly not the fence: the fence is two dark rails, the gate a pale braced panel.
- **Open, the leaves swing in 3D**, rendered at each step:
  - a gate in an **east–west** fence swings **south**, toward the eye;
  - a gate in a **north–south** fence swings **east**.
- **A north–south gate shut is seen edge-on**, as any north–south fence is from this camera, so only its two tall posts show it. In
  my count that is 1 gate in 54. Your farm gates stand open by day, and open it reads plainly.

## The pictures: `gate\` (gate.json, set pieces' format, 0.25 units a pixel)

There are 20 pictures, one half of the double gate each: a post and its leaf.

`fieldGate_<dir>_<side>_<step>`
- `dir`: `ew` or `ns`
- `side`: `W` and `E` for `ew`; `N` and `S` for `ns`
- `step`: 0 shut, then 1, 2, 3, and 4 open (70 degrees)

**The anchor (`ax`, `ay`) is the foot of that half's post.**

- **Drawing a gate** (your `VGATES`): draw `fieldGate_<dir>_<W|N>_<step>` at `g.a`, and `fieldGate_<dir>_<E|S>_<step>` at `g.b`,
  with `step = Math.round(k * 4)` from your `gateEase`.
- **Sorting:** sort each half at its own post's `y + 0.5`. A rail post stands under each gate post to carry the rails, so the half
  must draw after it to cover it. The north–south halves sort apart, so a man walking through the gateway is between them.
- **Height:** the pictures are stretched north–south to the world's ground (K 0.75), so the two halves meet at `a` and `b` 64 units
  apart, whichever way the fence runs.
- **Cost:** 0.54 MB on disk, 2.2 MB decoded for all 20.

## The generator (`src/village.js`, mine; changed in your folder, not committed)

In `fencePoly`, where a farm's gap gets its gate:
- **Placement:** the gate is placed two tiles wide in the middle of the gap, square to the box's side. `F.gates` entries are now
  `{ a, b, double: true, dir: 'ew'|'ns', w: 64 }`: `a` is the west or north post, `b` the east or south.
- **The fence is carried on:** from the gap's own last posts to the two gate posts, a rail post every 30 or so in the same runs and
  in order. Your `railsOf` draws the rails right up to the gate. Those posts are marked `gatePost`, so the gateway clearing keeps
  them.
- **A gap too narrow** for a 64 gate (none in the 28 villages I made) keeps the old entry with no `dir`. Draw that one with `BuildGate` as now.
- **No random draws** were added, so every village keeps its layout.

**Checked:**
- `tests/settlement.js`: the same 12 rules broken before and after.
- **Gates:** 54 in the new form over 28 villages of four kinds (53 east–west, 1 north–south), none in the old form.
- **Rails:** reach both posts of every gate (108 of 108).
- **The pictures:** `build\village_mock.js` draws generated yards with the pictures.

**Your side:**
- the drawing above;
- `vgatePillars` is unchanged: it fills `a` to `b`, now 64 wide.

The free fences' gate (`runGate`, the player's own, at any angle) stays `BuildGate`.

`build\ch1b_build.py` makes the pictures (`field_gate()`): `--only fieldGate_ew_W_0,...`, then `tools/pieces_pack.js <render> <out>
gate`.

— Colin, AD
