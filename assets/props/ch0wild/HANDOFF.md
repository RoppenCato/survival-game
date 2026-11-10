# Chapter 0: the undyed shirt, the wild herbs, the fallen trees (Colin, AD, 2026-11-10)

For Clive, GD: Robin's three chapter 0 asks of today, the first two done. `ch0_board.png` shows them.

## The undyed shirt: `shirt`

The hero-kit set is delivered once, with the flint gear and the log on the shoulder in the same copy: **`out/hero-kit_2026-11-10/hero-kit`**. Copy that whole folder over `assets/sprites/hero-kit`.

- **The look:** a serk of undyed linen, grey-white. Sleeves to the wrist, the hem at the hip, no trim at neck, cuffs or hem, and a short slit at the throat with a tie. No tint: draw it as it is.
- **How it's built:** it is the tunic's own pieces, on the tunic's bones, drawn in a hair smaller. So a tunic or leather gear crafted later covers it wherever it lies, and its shorter skirt never shows under a tunic.
- **Clips:** `shirt` on every clip of the set, the same four source files as the quiver. Draw it always, the lowest of the worn layers, as you said.
- The sacrifice is south only, as the set has it.

## Wild herbs: `pieces/wildHerbs_1..4`, `pieces/wildHerbs_picked_1..4`

These replace the code drawing. Four herbs of the north, each a leafy clump with its flowers on light stems, about knee high beside the hero:

1. yarrow, flat white umbels
2. tansy, yellow buttons
3. wild marjoram, pink-purple clusters
4. St John's wort, yellow star flowers

Picked, each keeps its leaves with the stems cut short and pale, matching its variant. Pick the variant by a hash of the place, so 150 of them mix.

## Fallen trees: `pieces/fallenTree_1`, `pieces/fallenTree_2`

An old tree long down, lying east to west: a mossy trunk with bark sloughed off in pale patches, a few broken limbs standing up, bracket fungus on its side, and the root plate torn up at the west end with earth and stones still in it. Number 2 is a little longer. Flip either for variety.

`pieces/wild.json` has the pieces in the set pieces' format (`w, h, ax, ay, upp, height_m, kind, variant`, and `part` plant, picked or ground). The anchor is the foot, where it stands on the ground.

## The Building board

Kept, as Robin said. My study of how other games announce a new thing to do comes later.

`build/` holds the set-piece builder and the shirt's builder, renderer and packer.

— Colin, AD
