# The Old Man, his rug and the bear cloak (Colin, AD, 2026-11-10)

For Clive, GD, chapter 1 item 7, the bear half: the bear as Robin wants him, "the Old Man", old and weakened.

Pictures:

| Picture | What |
| --- | --- |
| `oldman_compare.png` | the game's bear (top) and the Old Man (below) on the day island: the walk in eight directions at game scale with the hero, then every clip at twice that |
| `bear_rug.png` | the rug on an elm floor beside the elm bench and table and the hero |
| `cloakbear.png` | the bear cloak beside the wolf cloak, drawn from the packed set |

**Viewer:** `http://localhost:8777/`, Models, then "bearOld (the studio)". You walk as him, and J, K and the keys play his clips.

## The Old Man: `sheets/bearOld/` (a set of its own, `bearOld.json`)

The game's bear (the kraken-style one of 2026-10-21) made old:

- **His coat:** the brown faded toward grey, and the crest over the hump, the ruff and the leg skirts thinner and shorter.
- **His body:** leaner, the flanks fallen in and the belly drawn up.
- **His face:** the muzzle grey right up between the eyes, a pale scar across the brow, and his left eye clouded.
- **His scars:** three pale claw rakes over each shoulder.
- **His right ear:** torn, half of it gone in a V.

At game size you'll see the grey muzzle, the faded coat, the shoulder scars and the thin crest. The torn ear and the clouded eye are touches for close up.

It has the same body plan, clips, frames and rates as the game's bear. Its clips are idle 16, walk 12 (stride 21.29), run 8 (stride 69.67), windup 10, attack 10, hit 6 and death 12. The frame is 231×215, anchor 115.5/159.65, cut into pieces as your sets are (framepacked).

It is 46.6 MB decoded against the bear's 47.4, so it fits the art plan's 50 for a beast.

I kept him as his own set, so the bear stays for other islands. If the bear's island should have only the Old Man, draw `bearOld` there in place of `bear`.

**To rebuild:** `build/quad_build.py` is your builder with an `--old` switch. Run `quad_build.py -- bear --old`; it saves `bearOld.blend`. Then render with art:bear's arguments and pack with `tools/sprites.js bearOld <render> <out> --strides walk=21.29,run=69.67`. `build/framepack.js` is your framepack.js with `SPR_DIR` for packing outside `assets/sprites`; inside it, your sprites.js runs your own framepack as usual.

## The rug: `pieces/bearRug` and `pieces/bearrug.json`

The Old Man's skin laid flat on the floor, in the set pieces' format:

- the pelt spread head to the west, its legs splayed with pale claws, the edge in fur tufts;
- a darker stripe down the spine and lighter tufts on the flanks;
- the head kept whole and laid flat, with the grey muzzle, the dark nose and the torn ear;
- turned a little on the floor.

It's about 2.2 m nose to tail. Its anchor is its middle on the floor.

## The bear cloak: layer `cloakBear`, in the set copy `out/hero-kit_2026-11-10d/hero-kit`

Grander than the wolf's, built from the kit's own cloak pieces, so it swings as the cloak does:

- **The pelt:** the Old Man's grey-brown fur, broader than the wolf's, with a darker spine and a ragged hem. It is the wolf cloak's length: longer, its hem went through the ground when he knelt, fished or fell.
- **The mantle:** a heavy fur collar over the shoulders, frosted grey along its top.
- **The forelegs:** crossed over the chest and knotted at the breastbone, the way a pelt was worn, with the paws and their pale claws hanging below the knot.

It goes in the cloak slot. Draw it **untinted**: the brown is the bear's.

It's on all 66 clips. Sacrifice and wake are south only, as the set has them. The claim stone's three acts are north only, as those clips are.

Four frames reach a little past their clip's frame and are trimmed there: two of the death and two of the fishing reel, by 1 to 2.5 px at the bottom. It's a tuft of the hem, and you won't see it.

`build/`:

- `add_bear.py` adds it to the kit's files;
- `bear_render.js` renders it;
- `pack.js` packs it onto your set.

— Colin, AD
