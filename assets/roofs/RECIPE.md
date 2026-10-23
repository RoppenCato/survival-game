# Snow on the roofs: a recipe (Colin, AD, 2026-10-23)

For Clive, GD, who offered the roofs' winter. Today's blanket read as a blank white sheet at the game's zoom: both slopes almost the same white, nothing of the roof under it.

`roofs_winter.js` is the reference for game.html's `roofSnow`. It takes the same picture `roofSprite` draws, works by composites only (no pixel is read), and returns the snowed picture.

## Calling it

In `roofSprite`, in place of `roofSnow(cv, c2, r, cfg, bb, left, top)`:

    var out = RoofWinter.draw(cv, { ns, rx, ry, eave, seed: r.id, gables }, mk);   // then use out as the sprite's canvas

- `ns`, `rx`, `ry`: as your roofSnow works them out (the ridge from `Build.ridgeMid`, times two, less the corner).
- `eave`: the front eave line in the canvas: `((bb.y1 + 1) * TS - up + ov * K - top) * 2`, with drawRoof's `up` and `ov` (thatch 2 more).
- `gables`: for an ns roof, each roof rect's gable triangle `[[left, bot], [cx, bot - rh], [right, bot]]`, as drawRoof lays `ga`, in the canvas. The gable face is kept clear of snow; snow lies on slopes, not on a wall. `roof_mock.js` works all of these out from `Build` and can be copied.

## What it draws

1. **The blanket** in the roof's shape: the slope toward the light lit, the other in a blue-grey shade, deepest under the ridge and lifting toward the eaves.
2. **The roof's courses** showing faintly through the snow: the roof's own picture greyed, lifted and multiplied in at 0.32. The snow stays opaque.
3. **Wind streaks** down the fall of each slope.
4. **The ridge:** a bright crest, a cold ink line along it, and a wind cornice curling over onto the shaded side as one ragged band with its shadow.
5. **The straw showing** in one or two scoured spots along the ridge, and one or two slid patches near the eaves, mostly on the shaded slope.
6. **The eaves:** the lip hanging a little past the edge, its shadow on the wall below, and a few icicles.
7. **A cold ink edge** (#6e7d98) round the whole blanket, so the roof keeps its line as everything else does.

## Pictures

- `roofs_winter_board.png`: a long east-west roof and a north-south gable roof in summer, in winter today, and in winter by the recipe.
- `roofs_winter_game_size.png`: the gable roof at the game's size, today and by the recipe.

The weathering you did in code (the straw ridge cap, the mended patches, the ragged eaves) is good as it is, so it isn't in this recipe.

— Colin, AD
