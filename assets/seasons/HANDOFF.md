# The seasons of home's meadow (Colin, AD, 2026-10-23)

Robin asked for four seasons for the first climate, home's meadow ("Build four seasons for this first biome"). The plan is in the
studio's `docs/seasons.md`; it follows what we agreed on 2026-10-20 (the look is climate × season, mostly colour graded when a thing
is baked, new pictures only where the shape changes). He picked from three versions each in a picker page:

- **Spring: A, fresh green.**
- **Summer:** the game as it is.
- **Autumn: B, fiery.** Without the green flecks his note asked out.
- **Winter: A, deep snow.**

`seasons_woods.png` and `seasons_camp.png` are those picks painted at Robin's size by your own painter through the module below,
the way the game would do it. They match the board he picked from.

## What is here

- **`seasons_grade.js`**: the grades as one module (browser or Node, about 150 lines), nothing per frame:
  - `gradeGround(d, w, h, season, water)`: a baked ground chunk's pixels, once a season. `water(x, y)` true over sea and shallows: your heights, `elevAt < 0`. Winter's ice at the shore needs it, and so does keeping the water from being taken for grass.
  - `sprinkle(ctx, season, w, h, land, ox, oy)`: spring's anemones, autumn's fallen leaves, drawn into the chunk. `land(x, y)` true on grass, not the beach; `ox, oy` is the chunk's world origin, so the marks stay put across bakes.
  - `grassInk(GRASS_INK, season)`: the living grass's colours for the season, a copy of your own settings with its colours graded. Winter thins it to a few dry tufts through the snow. Pass it to `drawGrass` instead of `GRASS_INK`, cached per season.
  - `gradeSprite(d, w, h, kind, season)`: a standing thing's picture, graded once a season (`kind` is its name: `pine`, `oak`, `birch`, `bush`, `berryBush`, `tallGrass`, `wildHerbs`, `rock`, `flower` and so on). It returns false where the thing is not drawn that season: winter's flowers.
    - Spring and autumn recolour the greens by kind: the birches gold and the oaks red in autumn, the berry bushes in blossom in spring.
    - Winter browns the leaves and lays snow under each thing's upper edges. The depth per kind is in `SNOW_DEPTH`: deep on the pines and rocks, a dusting on the bare trees.
  - `bareTree(kind, v)`: winter's picture for an oak or a birch.
  - `light(ctx, w, h, season)`: the season's light over the frame, two cheap composite fills.
- **`sheets/trees_bare/`**: winter's bare trees, `oak_bare_1..3` and `birch_bare_1..3`. They are the same trees as the game's `oak_1..3` and `birch_1..3`, with branches grown and fine twigs in place of the leaves (0.5 MB). The felled trunks and logs have no leaves already, so they serve every season.
- **`tools/board_final.js`**: the reference: your `dayisland.js` steps with the module called where the game would call it. `tools/board.js` made the three versions per season Robin picked from. `build/trees_build.py --bare` makes the bare trees.

## Wiring it

1. **The ground.** `w.setSeason(name)` already drops the baked chunks. When a chunk is baked:
   1. Paint it as today.
   2. If the season is not summer, run `gradeGround` on its pixels.
   3. Then run `sprinkle`.
   - The water test per pixel is `elevAt < 0` at that pixel's world point. The land test is your ground's grass kind.
2. **The grass.** `drawGrass(..., Seasons.grassInk(GRASS_INK, season))`.
3. **The pictures.** On a season change, grade each set piece's picture with `gradeSprite` and keep only the current season's copies, so memory does not double. Grade lazily, on a picture's first draw in the season; a picture is a few hundred thousand pixels, a few milliseconds each.
   - Not graded: the people, the beasts, the hero (no season copies of creatures, as agreed), the buildings you draw in code (their snow on roofs and walls is yours), the HUD.
4. **Winter's trees.** An oak or a birch draws `bareTree(name, v)` from the `trees_bare` set at the summer tree's scale. Keep its own `ax`, `ay`, `upp`, times the object's size `o.s`. In winter the board scales the bare tree by the summer picture's drawn width; the bare pictures are drawn to the same scale as `trees.json`'s, so `o.s` alone gives the same size.
5. **The light.** `Seasons.light(ctx, W, H, season)` after the world and before the HUD. With the night, it goes under your night palette.
6. **The cast shadows.** In winter the board draws them at 0.8; in autumn a quarter longer (the low sun). Those are numbers for your `castShadow`, if you want them.

## Second drop (2026-10-23): snow caps and the season's own pieces

### Snow caps (`sheets/snowcaps/`, 26 pictures, 2.9 MB on disk)

For the set pieces whose snow the module's outline snow does not suit: flat tops, roofs, tents, the stations. Each cap is its own
picture, `<name>_snow`, drawn **over** the piece in winter, the way the hero's gear is a layer.

- Same frame and same foot point as the piece: draw it at the piece's own `x, y` with its own `ax, ay, upp` and the object's size.
  `snowcaps.json` gives each cap `over` (the piece it lies on) and `set` (that piece's set).
- The caps by set:
  - camp: dryingRack, woodpile, choppingBlock, logSeat, cart, well, trough, vikingTent, tent
  - pieces: workbench
  - steading: graveMound_1, graveMound_2, graveThorgunna, trailStone_1, trailStone_2, shieldRack, dragonPost, haystack_1, haystack_2
  - yard: storageHut, boathouse, beachedBoat
  - shipyard: naust_s, naust_e, naust_n, naust_w
- A capped piece is graded with `gradeSprite(d, w, h, kind, 'winter', true)`. The `true` leaves the module's outline snow off, so the
  snow is not laid twice.
- haystack_1 and haystack_2 are not in your steading set as far as I can see. The caps are there for when they are.
- The snow lies only where a face looks up and nothing stands over it (`build/snowcap.py`). Each builder takes `--snow` to render its
  caps beside its pieces (`tools/caps_all.sh` runs them all).
- Not covered: your buildings drawn in code. Their snow on roofs is yours, as agreed.

### The season's own pieces (`sheets/seasonal/`, 21 pictures, 0.16 MB)

Set pieces that stand in one season only. Each has `season` in `seasonal.json`. Place them like the plants, only in that season:

- **Autumn:**
  - `chanterelles_1..3`: a clump of golden funnels
  - `boletes_1..3`: fat brown buns on pale stalks
  - `flyAgaric_1..3`: the red one with white warts, autumn's one hot note; keep them few
  - Each stands on a few fallen leaves.
- **Winter:**
  - `snowDrift_1..3`: low drifts the wind has shaped, 1.5 to 2.6 m long
  - `deadGrass_1..3`: dry straw grass through the snow
  - `deadUmbels_1..3`: cow parsley gone to seed, each head with its cap of snow
  - `deadBracken_1..3`: last year's rust-brown bracken
- **No ink ring and no foot line.** The snow fades out over its lowest few centimetres, so a drift or the snow at a stalk's foot melts
  into whatever shade your snow has there. Draw them with no foot grass and no grass halo. A cast shadow is fine on the stalks; the
  drifts need none.
- **Not graded.** They are drawn in their season's colours already, so skip `gradeSprite` for this set.
- **Density** is yours. `seasons_small_things.png` scatters about 22 to 26 in a screen of the woods; I would go a little thinner than
  that in the game.
- **The summer toadstools** (`mushrooms_1..3`) now return false from `gradeSprite` in winter, as the flowers do.

### Changed in `seasons_grade.js`

- **Winter grass:** each living grass tuft's shadow is now faint. It was drawn in the tuft's dark colour and greyed the snow into a
  puddle under every tuft.
- **Winter ground:** no bare earth patches and no flower drifts.
- **The summer toadstools:** hidden in winter (above).

### Pictures

- `snowcaps_check.png`, `snowcaps_naust.png`: the caps over your own pictures.
- `seasons_small_things.png`: the woods in autumn and winter with the new pieces, painted by `tools/board_final.js`
  (`SEASONAL=sheets/seasonal`).
- `seasonal_pieces_autumn.png`, `seasonal_pieces_winter.png`: each piece at the game's size and enlarged.
- `build/seasonal_build.py` makes the pieces; `tools/pieces_pack.js` packs them (it now reads `ring` and `grain` from each picture's
  meta).

## Still to come from the studio

- **A proposal for the weather:** spring showers; autumn rain, storms and morning mist; winter snowfall. The effects are yours; the
  look and the numbers will be mine.

— Colin, AD
