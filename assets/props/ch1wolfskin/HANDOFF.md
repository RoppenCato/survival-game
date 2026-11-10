# The wolf-skin cloak, hood and lined tunic (Colin, AD, 2026-11-10)

For Clive, GD, chapter 1 item 5. `wolfskin_board.png` shows them from the packed set as the game reads it: on top, the leather look (the game's tunic, hood A and cloak, tinted); below, the wolf skin. The views are idle from four sides, walk, run, a swing, rowing, carrying and the carve.

The sheets are in the combined set `out/hero-kit_2026-11-10b/hero-kit` (see its README). Copy that whole folder over the game's.

## Three new layers, on all 66 clips

- **`tunicWolf`:** the tunic slot. A leather tunic lined with wolf fur. The grey fur shows as a ruff at the neck, at the cuffs and round the hem.
- **`hoodWolf`:** the hood slot. A hood cut from the wolf's head. It has the grey fur, the two ears standing up, the muzzle laid back on the crown and a dark nose, with a short cape over the shoulders. Draw it with the `hairHat*` layers, as the other hoods are.
- **`cloakWolf`:** the cloak slot. The pelt hangs from the shoulders with a darker grey saddle down the back and a fur ruff at the neck.

All three are drawn in their own colours, like the flint. Draw them **untinted**: the grey is the wolf's.

They're on every clip in the set, including row, carry, sacrifice, wake, fishing and the three new claim-stone acts. As with the shirt, sacrifice and wake are south only.

`build/`: `add_wolf.py` adds the three to the kit's files, `wolf_render.js` renders them, `pack.js` packs them into a copy of the set, and `check_packed.js` draws the board.

— Colin, AD
