# The villages, step 4: Saltvik's salt works (Colin, AD, 2026-11-10)

For Clive, GD. Robin's note, via you: "Saltvik has nothing of salt". The lore says salt is boiled from the sea there. `saltvik.png` shows two things:

- **Top:** Saltvik's shore as the generator lays it (seed 20), at Robin's size, with the racks and the hero.
- **Below:** the pieces, at twice that.

## The pieces: `pieces/salt.json` (set pieces' format), 7 pictures

| Picture | What |
| --- | --- |
| `saltPan_cold` | a wide shallow iron pan (1.3 by 0.85 m, a rim 0.12 m, rust along its foot) on four stones over a hearth of rough stones, its mouth to the south. Grey brine, ash and charred ends in the hearth. |
| `saltPan_boil` | the same with the brine gone pale and bubbling, embers and low flames in the hearth's mouth |
| `saltPan_crust` | the brine boiled away to a white crust, a wooden ladle laid across it, the fire out |
| `brineTub` | a staved tub of brine, two hoops, a ladle's handle |
| `saltBaskets` | three woven baskets heaped with coarse salt, on a plank |
| `driftwood` | a crossing heap of crooked silver-grey driftwood and a stump with its roots, for the fires |
| `seaPool` | a rough oval of stones round still water at the water's edge, where the sea is let in at the flood to settle. A gap toward the sea, with the stone that closes it. |

Each anchor is the middle of its foot on the ground.

## Where the generator puts them (src/village.js, done)

`saltWorks(ry)` runs for a place named Saltvik (case aside), or one passed `opts.salt`. It needs a south shore (it sits in the fishing hamlet's shore strip). It lays the works west of the drying racks, on its own random stream, so nothing else moves:

| Prop | Where | solid |
| --- | --- | --- |
| `seaPool` | at the water's edge, `under: true` | 26 (its stones and water stop the feet, and nothing grows in it) |
| `saltPan_boil` | on the strip, `light: 1, steam: true` | 14 |
| `saltPan_crust` | on the strip, further west | 14 |
| `brineTub` | between the pool and the pans | 6 |
| `saltBaskets` | above them, `loot: { salt: 3 }` (your item; change or drop as you like) | 8 |
| `driftwood` | east of the pans, toward the racks | 9 |

`V.saltWorks` is set, and the hamlet's beached boat is drawn up 17 tiles west of the middle instead of 9, so it doesn't land in the pool. Its random draws are the same, so nothing moves. Checked on five seeds: no piece on or beside a floor, and only flowers and bushes nearby. The audit is unchanged at 12.

`saltPan_cold` isn't placed. It's there for a season, a night or a quest, if you want one.

## For you

- **Steam** over `saltPan_boil` (`steam: true`): your smoke's puffs, but steam.
  - 6 puffs on a 3 s round, rising 30 with the wind's drift.
  - Radius 2 + u * 6.
  - Body rgba(242,242,238, (1 - u) * 0.5) over a cool under-puff rgba(160,170,186, (1 - u) * 0.25).
  - From the pan's middle, about 12 units above its foot.
- **The fire's light** at night (`light: 1`), as a hearth.

`ch1b_build.py` holds the builder (`salt_pan`, `brine_tub`, `salt_baskets`, `driftwood`, `sea_pool`).

— Colin, AD
