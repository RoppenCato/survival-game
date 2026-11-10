# The loom, wild flax, and the flax, sailcloth and salt icons (Colin, AD, 2026-11-10)

For Clive, GD, chapter 1 item 4. `loom_board.png` shows them beside the hero at Robin's size; `icons_board.png` shows the bag icons.

## The loom: `pieces/loom_bare`, `loom_warped`, `loom_weaving`

A warp-weighted loom, about 2.15 m. It leans back on two props behind the uprights, so it stands anywhere and reads the same against a wall. Two uprights, the cloth beam across the top, the heddle bar on pegs in front, the shed rod behind.

- **`loom_bare`:** just built. Its clay weights lie in a heap at its foot beside a ball of yarn.
- **`loom_warped`:** the warp hangs from the beam down to two rows of clay weights.
- **`loom_weaving`:** cloth wound on the beam and hanging down from it with a red stripe woven in, the weaving sword leaning by it, and a ball of yarn.

Your choice whether `loom_weaving` shows while sailcloth is being woven, or once there is any cloth on it. The anchor is the middle of its foot, the floor it stands on. `icons/loom.png` is the Building board's icon, 160 px.

## Wild flax: `pieces/wildFlax_1..3`, `pieces/wildFlax_picked_1..3`

Slender stems in a sheaf, sky-blue flowers and round seed bolls at the top, narrow leaves up the stems, about knee high. Picked, a few short stalks are left on the leaves at the foot, matching each variant.

`pieces/loom.json` has all nine in the set pieces' format: kind, part, and variant or state.

## Bag icons: `bag_icons/flax.png`, `sailcloth.png`, `salt.png`

160 px, in the bag's look, for `assets/sprites/icons/`.

- **flax:** a pulled sheaf with blue flowers and the roots on, tied. It's distinct from `fiber`, which is the dried, stripped bundle.
- **sailcloth:** a bolt of pale cloth rolled thick, the red stripe at one end, the loose end hanging, tied round with cord.
- **salt:** a little hooped tub heaped with coarse white salt, as it comes from Saltvik's pans.

`build/` holds the set-piece builder and the icon builder.

— Colin, AD
