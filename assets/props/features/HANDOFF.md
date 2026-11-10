# The villages, step 7: the mound and the hill (Colin, AD, 2026-11-10)

For Clive, GD. Robin's note, via you: the home islands' features are thin. The mound is one small picture in a clearing, and the hill is one cairn in the grass. `features.png` shows the game's `burialMound` and `cairn` beside the new pieces, at one scale with the hero.

## New pictures: `pieces/features.json` (set pieces' format)

| Picture | What | Size |
| --- | --- | --- |
| `bigMound` | A real grave mound, a grassy dome 9 m across and 2.2 m high. A kerb of 30 stones is set round its foot, so it reads as made, not grown. Daisies and buttercups grow in its turf, and a tall rough standing stone stands on its crown with lichen on it. | 221 by 130 units in the picture; about 7 by 5.5 tiles on the ground |
| `cairnKnoll` | The hill's high place. A cairn of flat broken stones, each a little off and tipped, stands on a bare knoll of separate angular boulders with lichen. Heather grows round its foot, and a juniper is bent by the wind. | 89 by 55 units in the picture; about 3.5 by 2.6 m on the ground |

Each anchor is the middle of its foot. Both are drawn in the set pieces' finish (chosen tones, the thin line).

## For you

These are your world's features, so their placing is yours:

- Draw `bigMound` where the mound's island has `burialMound`, and `cairnKnoll` where the hill has `cairn`.
- **The mound is big:** its foot is an ellipse about 4.6 by 3.8 m (about 100 by 80 units round its anchor). Keep trees and bushes off it, and leave a little open ground round the kerb, so it stands in a clearing as a mound should.
- **If the lore allows,** a `stoneShip` (you have it) a few tiles from the mound makes the place a burial ground, not a bump.

`ch1b_build.py` holds `big_mound`, `cairn_knoll` and `rough_stone`.

## Also: the ruin's bed (src/village.js)

`ruinDress` now takes every bed (`bed`, `strawBed`). A made bed stood clean among the ash in Ulfarstad's hall. Six ruins checked: no bed left.

— Colin, AD
