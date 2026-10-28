# A fence gate for any angle (Colin, AD, 2026-10-28)

Clive's playtest ask, picked by Robin, and his follow-up: the villages' farm fences get their gates back.

## The gate: `build_gate.js` (global `BuildGate`, also `module.exports`)

`BuildGate.draw(c, a, b, open, { K: 0.75, kind: 'rail' | 'stake', H: 16, seed })` draws the gate in place of `drawRunGate`.
- `a` and `b` are the two posts' feet in world units. `open` runs from 0 shut to 1 open; the leaf swings about `a` toward the viewer, up
  to about 66 degrees. Feed it your timing for a swing.
- **'rail'**: upright slats with slightly uneven tops between two rails. A brace runs from the hinge's foot to the latch's top. Two iron
  straps with nails at the hinge, and a wooden latch.
- **'stake'**: a woven withy hurdle on three uprights, hung with withy loops, for the stake fences.
- The leaf is lit, mid or shaded by its turn to the south-west sun, and casts a soft shadow on the ground.
- When the leaf runs toward the viewer (a north–south stretch, or an east–west gate swung open), it leans a little to show its face.
  Otherwise it would close to a line.
- **A double gate** is two calls meeting in the middle: `draw(c, a, mid, open)` and `draw(c, b, mid, open)`.
- Sort it as you do now: `y = max(a.y, b.y) + (open ? 6 : -0.5)`.
- `gate_mock.png` shows six angles, shut and open, between the railPost and stake pieces. `mock.js` makes it.

## The villages' farm gates (in `src/village.js`, the studio's file)

- **`F.gates`:** every fence in `V.fences` now carries `gates: [{ a, b, double }]`, but only a farm's fence (a unit's), never a ruin's.
  The gate hangs between the two real railPosts on either side of the farm's gap.
- **Posts inside the gap:** posts standing in the gap (the run wanders off the box) are taken out. The clearing pass took them out anyway.
- **The two gate posts:** marked `gatePost: 1`, so the gateway clearing keeps them. A door still wins: a gate post within 0.9 of a tile
  of a door goes, and its gate with it.
- **`double`:** true when wider than 76 units, which is almost all of them (the gaps are 160 to 225 wide). Draw it as two leaves.
- **Counts:** 67 gates across every village kind at five seeds.
- **Tests:** `tests/settlement.js` breaks the same 10 rules as before this change (6 units short, 2 ways in, 2 units-planned).
- **Random draws:** the change adds none, so every village keeps its layout.
- `gate_village.png`: two generated farmyards, one shut, one open. `village_mock.js` makes it.
- **Open and shut:** E opens and shuts them as it does the free fences' gates. They are solid when shut, as the old farmGate props were
  not, which is yours to decide.

— Colin, AD
