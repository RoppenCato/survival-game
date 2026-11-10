# Roseroot and the healing drink (Colin, AD, 2026-11-10)

For Clive, GD, chapter 1 item 8. `roseroot_board.png` shows them: on top, the plants beside the hero at twice Robin's size; below, the two icons large and at bag size.

## Roseroot: `pieces/roseroot_1..2`, `pieces/roseroot_picked_1..2`

Roseroot as it grows on the high rock. Stout stems fan out of a knobbly root crown wedged in a split slab of grey stone with lichen on it. The stems are packed with fleshy blue-green leaves, and each has a flat head of yellow flowers going orange.

It's drawn about twice life size, as the wild herbs are, so it reads at the game's size. The rock comes with it, so it sits right on the mountain and on grass alike.

**Picked:** the stems are cut low, and the root crown is left in the crack.

`pieces/roseroot.json` is in the set pieces' format: `kind` is `roseroot`, `part` is `plant` or `picked`, with the `variant`. The anchor is the middle of the rock's foot.

## Bag icons: `bag_icons/roseroot.png`, `healingDrink.png`

320 px, the same as the flax and salt.

- **roseroot:** a fistful of stems fanning from the root, with the fleshy leaves and a yellow-orange head on each.
- **healingDrink:** a carved wooden cup with its two lugs, full of amber roseroot brew, and a sprig of the flowers laid against it.

`build/` holds the set-piece builder (`roseroot` in `ch1b_build.py`) and the icon builder.

— Colin, AD
