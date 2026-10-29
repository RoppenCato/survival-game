# Cave mushrooms and angelica, picked and not, and the roast boar icon (Colin, AD, 2026-10-29)

Clive's chapter 1 asks 3 and 4, and the `roastBoar` icon he asked for. Set pieces with the pieces' thin line (`toon.piece_line`),
packed as the plants are: copy `sheets/*` to a set folder (for example `assets/props/ch1plants/`). `ch1plants.json` holds w, h, ax, ay,
upp and height_m.

**Cave mushrooms** (`caveMushroom_1..3`, `caveMushroom_picked_1..3`):
- **The look:** a cluster of slender pale bell caps on thin stalks, standing on a crumb of rotten wood. The caps are a cool pale cream
  that reads as faintly lit on the cave's dark floor.
- **The glow:** the pictures carry none. If you want the "little glow", lay a soft additive ellipse under them (about 14 units wide,
  pale green-white, alpha 0.12), composite only.
- **Size:** about twice real size (0.6 to 0.7 m on the sheet). At a hand high, a cluster was a few pixels in the game.
- **Picked:** built from the same seed as its variant, so the snapped stalks stand where the caps stood, with a torn cap lying on its
  side.

**Angelica** (`angelica_1..3`, `angelica_picked_1..3`):
- **The look:** one to three tall hollow stalks, green turning purple at the foot, with swollen sheaths. Each carries a great round
  umbel of green-white umbellets on thin rays, over a rosette of toothed leaves.
- **Size:** 1.7 to 1.85 m, about the hero's height.
- **Picked:** the stalks cut at knee height with pale cut ends, the leaves left. Each picked picture matches its variant.

**The roast boar icon:** `icons/roastBoar.png` (160 px): a round joint browned dark with a crackled gold rind, on a spit of green wood.

`look.png` shows them at the game's size: the mushrooms on the cave floor, angelica on grass. `build/` holds plants_build.py and
item_icons.py.

— Colin, AD
