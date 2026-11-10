# The villages, step 6: the raided ruin (Colin, AD, 2026-11-10)

For Clive, GD. Robin's note, via you: Ulfarstad did not read as raided (a whole bench, a well, only broken fence posts). `ruin.png` shows two of its houses as the generator now lays them, drawn from the real pictures with the floors as plain earth, and the new pieces beside them.

## src/village.js (done; VERSION stays 5)

A new pass, `ruinDress`, for any place with `V.ruin`. It runs at the end of `make` on its own random stream, so the walls don't move. The idea is burnt, and gone back to green: bright, not grim.

- **The things inside:** most are taken or burnt: beds, tables, chairs, benches, looms, stools, shelves, cupboards, log seats, haystacks, cradles, rugs, the laid tables and the wall hangings. **The chests and crates are kept:** they hold the finds.
- **Hearths:** left as items (your cold fires).
- **Fire damage:**
  - in every house, charred beams (`charBeamA..C`, `charredBeam_1..3`) and burnt heaps (`burntHeap_1..2`, `charPile`, `ashHeap`): more where the roof fell, fewer under a roof that stands;
  - a fallen `roofTree` in most open longhouses and halls;
  - every woodshed turned to a `burntHeap`.
- **The raid's leavings:**
  - a `brokenDoor` lying before one south door in two;
  - an `arrowWoodGround_0/1` in the ground before two houses in five;
  - a `lostShield` (new) in the yard.
- **Green come back:**
  - `fireweed_1..3` (new), the first flower on burnt ground, and `nettles_1..3` (new), where people lived and left, on the open floors and round every house's walls;
  - four more in the yard;
  - a young birch (nature, `s` 0.45–0.65) in most open shells.

Nothing is laid within a tile and a half of a door. All the weeds, doors, arrows and the shield are `solid: 0`, so you walk through them; beams and heaps are 4, the roof tree 6.

A living village is unchanged (the same paints). The audit is unchanged at 12.

## New pictures: `pieces/ruinweeds.json`

| Picture | What |
| --- | --- |
| `fireweed_1..3` | tall stems in a clump with tapering spikes of pink flowers, about knee to waist high at the game's scale |
| `nettles_1..3` | a dense dark green clump of toothed leaves in pairs, with hanging green tassels |
| `lostShield` | a round shield left in the grass, split, with a piece lying apart, its boss and its paint in halves; a broken spear shaft by it; grass over it |

They're in the set pieces' format, with the anchor at the middle of the foot. `ch1b_build.py` holds `weed` and `lost_shield`.

— Colin, AD
