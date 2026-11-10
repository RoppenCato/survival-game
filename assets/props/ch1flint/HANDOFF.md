# Flint gear (Colin, AD, 2026-11-10)

For Clive, GD, chapter 1 item 1. `flint_board.png` shows all of it.

## In the hand: `axeFlint`, `pickFlint`, `swordFlint`, `knifeFlint`, `arrowNockFlint`

The hero-kit set is delivered once, with the shirt and the log on the shoulder in the same copy: **`out/hero-kit_2026-11-10/hero-kit`**. Copy that whole folder over `assets/sprites/hero-kit`. Each flint layer is in the set's `layers` list.

**One change from what we agreed:** each `<kind>Flint` carries its own haft or hilt as well as the stone. Draw it **alone**, in place of both `<kind>Wood` and `<kind>Metal`. The iron kinds' hafts didn't suit stone: a wedge for an iron head, and a bronze Viking hilt on the sword. In your code that is `if (mat === 'flint') L.push({ l: kind + 'Flint', hand: 1 })`, with no tint.

- **The look:**
  - The axe: a natural haft with the knapped head wedged through its top and lashed with pale sinew above, below and across, a chalky patch of rind left at the butt.
  - The pick: one long flint point curving down, lashed the same way.
  - The sword: a long leaf blade on a bound wooden grip, seax length, as we agreed.
  - The knife: a short leaf blade on a bound handle.
- **Clips:** every clip its iron kind is on, held exactly as the iron one is in each.
  - I proved the source files against your own iron layers first (0.97 and better). The plain grip comes from the latest kit file, the standing blades from the rest file (north from the plain file, as the iron), the first slash from the tilt, and the axe at the tree and rock from the chop file. `checks/` shows each kind beside the iron, from the packed set.
  - The throw's axe is emptied from frame 6, as the iron one is, so your spinning axe takes over.
  - The sacrifice's knife is south only, as the iron one is.
- **The flint arrow on the bow clips:** `arrowNockFlint` on `bow_draw`, `bow_shoot` and `bow_draw_walk`, the wooden arrow's shaft and feathers with a grey flint head. Draw it in place of `arrowNockWood` when a flint arrow is nocked.

## Icons

- `icons/axe_flint.png`, `pick_flint.png`, `sword_flint.png`, `knife_flint.png`: one picture each, 160 px, laid along the diagonal as the weapon icons are, no tint. They go in `assets/sprites/items/`.
- `bag_icons/flint.png`: the material, a nodule broken open on its dark heart with a flake beside it. It goes in `assets/sprites/icons/`.

## The flint arrow: `arrow_flint/`

The wooden arrow's set with a knapped flint point bound on with sinew, the same sizes and notes. It goes in `assets/props/arrow_flint/`.

- `arrowFlint`: in flight
- `arrowFlintGround_0`, `arrowFlintGround_1`: in the ground; the point is buried, so the binding shows at the wound
- `arrowFlintWall`: in a wall
- `arrowFlintBroken`: broken, its point lying beside it
- `arrows_flint`: the item, five in a bundle, 160 px

## Flint on the beaches: `pieces/flint_1..3` and `pieces/flint.json`

Chalk-white knobbly nodules, one in each lying broken open on its dark glassy heart. They're small, about 0.4 m across a group, in the set pieces' format. The anchor is where they lie on the sand.

## Not checked

I haven't seen any of it in the running game. At your size the flint blades are dark and thin in some directions; I can lighten the stone if Robin finds them too black.

`build/` holds the builders, renderer, validator and packer.

— Colin, AD
