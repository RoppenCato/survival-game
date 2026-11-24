# The blót's place and the village kettle: first drop (Colin, AD, 2026-11-24)

For Clive, GD: Robin's asks 1 and 2 of 2026-11-24. This drop is the set pieces. The people's clips and their hand things (sprinkle,
raise, pour, bow, drink, the torch walk; the horn, the bowl, the twigs, the ring, the torch) and Hallveig's own layer come in the second drop.

`blot_place.png` shows the place at the game's size:
- the stone table at your `ALTAR_SCALE` 2, with the wolf laid on it;
- the vé's three posts behind;
- the great kettle over a fire, steaming;
- the folk's ale and bread;
- the hero for scale;
- along the bottom, the village kettle with each dish.

## Copy

- `blot\` goes to `assets\props\blot\`: 15 pictures and `blot.json`, packed like the other set pieces (`w`, `h`, `ax`, `ay`, `upp` 0.25).
- `steam\` goes to `assets\props\blot\steam\` or wherever you keep loops: 12 frames and `steam.json`.

## The kettle (ask 2, and the blót's beat 7)

**`kettle_village`**: an iron cauldron hung by a chain from a tripod of three lashed poles, 1.5 m. Two legs stand in front, so the pot shows between them.
- It comes empty, or with the dish its pot teaches: `_stew`, `_boarStew`, `_venisonBerries`, `_angelicaBroth`.
- These are the four `learn` dishes, so `potDish(it)` picks the picture: `'kettle_village_' + d.id`.
- **Anchor:** the fire's middle, under the pot. Draw the fire first and the kettle over it, at the village's cooking fire as you said.

**`kettle_great`, `kettle_great_meat`**: the blót's great kettle, 2.2 m, the pot 0.8 m across. `blotKettle` can swap the empty one for `_meat` and start the steam.

**Steam**: `steam_00..11`, a loop at about 8 fps. Draw it over the kettle, not under it.
- Its anchor (48, 140) is the pot's surface. That is 38 px above the village kettle's anchor and 52 px above the great one's.
- Draw it at 1.7 times over the great kettle.
- Leave it off the empty village kettle.

## The vé (the blót's place)

**`vePost_1..3`**: squared posts with the top carved as a head (brow, red-rimmed eyes, a long nose, a grooved beard) and a band of red-painted interlace, 2.75 m.
- `_2` has a cattle skull nailed on (Hofstaðir).
- `_3` has strips of cloth and a bone ring hung from a peg.

**My suggestion for placing them** round the village's rune altar: three behind it on the north side, so the south stays open for the folk and the camera. At about (-90, -60), (0, -80) and (90, -60) units from the altar's foot.

The generator is in your hands today, so place them where the altar is placed, or tell me and I'll do it in `village.js` once you've committed.

## What the folk bring (beat 1, the gathering)

**`aleTub`, `aleBucket`, `breadBasket`**: a staved tub of ale with a ladle, a bucket of ale, a wicker basket of flatbreads.
- In the gathering the folk carry them in (`carry_walk`), then set them down by the kettle (`pickup`).
- A `call`, `blotBring`, could place them there as the folk arrive, and the `end` list leave them standing for the feast.

## The wolf on the altar

**`wolfLaid`** (head east) and **`wolfLaid_w`** (head west): the wolf's own model, the one its sheets come from, laid out on its side as a carcass is. Its back is to the eye and its legs out behind, the head a little down, the tail limp, no eye glow.
- Laid with its legs toward the eye, it read as a wolf standing.
- **Anchor:** the middle of its body on the stone. Draw it with its anchor on the slab's lay point (`lay`, times `ALTAR_SCALE`) and no `LAY_OFF`, since that was for the death frame's foot point.
- Draw it at its own scale (1). In the picture, a 1.9 m wolf on your doubled slab looks right.

## Weight

0.26 MB on disk for the pieces, 0.1 MB for the steam.

## Making them again

- `build\blot_build.py`: the kettles, the posts, the folk's things.
- `build\wolf_laid.py`: the wolf, from `work/wolf/source/wolf.blend` with the beasts' `toon.py` (`toon_beasts.py`).
- `build\steam.js`: the steam.
- `build\scene.js`: the picture.

— Colin, AD
