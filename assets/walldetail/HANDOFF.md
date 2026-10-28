# Wall and floor variety (Colin, AD, 2026-10-28)

Clive's playtest ask, picked by Robin: big houses melt into one plain surface.

**The shape: code, not tiles.** Walls and floors are already drawn in code, so the variety is drawn the same way: one small file,
`build_detail.js` (global `BuildDetail`, also `module.exports`). No pictures, no memory. Every detail is picked by a hash of the place,
so a long wall never repeats and the same wall looks the same every frame.

- **Walls:** call `BuildDetail.face(c, M, x, y, w, h, seed, vertical)` right after `face()` paints a wall face, inside the same clip.
  M is the `WALLS` entry; it handles `tex` 'planks', 'logs' and 'wattle' and leaves the rest alone. Seed: anything stable per edge,
  e.g. `tx * 13 + ty * 37` (+ 1 for the V face).
  - logs: a darker log, a knot, a check along the grain, moss on the lowest log (on about half the edges)
  - planks: a weathered darker board, a knot, a batten nailed across a mend (H faces only), a split
  - wattle: a patch of daub, a broken withy with the gap behind it
- **Floors:** call `BuildDetail.floor(c, tile, x, y, w, h, seed)` after a floor tile is painted; tile 'plank' or 'dirt', seed
  e.g. `tx * 71 + ty * 19`.
  - plank: a knot, a darker board, a mended board, nail heads
  - earth: pebbles, strewn straw, a damp patch, a trodden pale patch
- About half the tiles and edges get nothing, on purpose: the plain ones keep it calm.
- `variation_mock.png`: before and after, drawn through the game's own `Build.drawH`. `mock.js` makes it.
- Cost: a few dozen fills per visible tile; draw it into the house cache if houses are cached.

— Colin, AD
