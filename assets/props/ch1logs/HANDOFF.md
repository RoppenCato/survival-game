# The old pine's log pieces: big log wall, split-log floor, sitting log (Colin, AD, 2026-11-10)

For Clive, GD, chapter 1 item 3. Robin wanted log walls and floors "thicker and more loggy", from the old pine's big logs. `logs_mock.png` shows today's 'Logs' wall and plank floor beside the new ones, drawn through your own Build at Robin's size.

## The wall and the floor: code, like the windows and the wall detail

`build_logs.js` (global `BuildLogs`, also `module.exports`). No pictures, no memory, composite only.

- **The wall:** add `BuildLogs.WALL` to `WALLS`:
  `{ name: 'Big logs', face: '#7a6250', top: '#94785e', dark: '#4a382c', tex: 'bigLogs' }`.
  - In `face()`, for `m.tex === 'bigLogs'`, call `BuildLogs.face(c, m, x, y, w, h, seed, vertical)` inside the face's clip, as `BuildDetail.face` is called.
  - The logs are 9 units high, so a storey of 40 is four and a half logs, against today's 5.4. Each is lit on its upper curve and dark under it, with moss in the joints, long bark checks, and now and then a knot or a pale patch where the bark came away.
  - The pattern follows the world's x, so a long wall runs across its tiles without a seam.
  - In `cap()`, treat `'bigLogs'` as `'logs'`.
- **The corners:** `BuildLogs.ends(c, m, x, yb, h, seed)` draws a column of cut log ends, pale with their rings, centred on x, from the wall's foot yb up its height. Call it where a big-log wall ends or turns, after the wall.
- **The floor:** add `BuildLogs.FLOOR` to `FLOORS`: `{ name: 'Split logs', tile: 'logs' }`.
  - For tile `'logs'`, call `BuildLogs.floor(c, x, y, w, h, seed)` for the tile's rectangle in place of the plain fill.
  - It draws split logs laid flat side up along x, three to a tile: the split faces pale with the adze's marks, rounded dark bark edges, and a dark gap between.
- **What it costs:** a few dozen fills a tile. Draw it into the house cache if houses are cached.

The mock paints `BuildLogs.face` over Build's own face, because `face()` doesn't know `'bigLogs'` yet. Once wired, it will look the same.

## The sitting log

`pieces/sittingLog.png` and `pieces/logpieces.json`, in the set pieces' format.

A 2 m length of the old pine's log, its top hewn flat to sit on, turned a little so its cut end shows. It sits on the ground. Its anchor is its middle on the ground.

## The karve's mast

I've drawn nothing for it: your ship code draws the mast. If you want its colour to match the log, use `#7a6252` for the bark, as the old pine's log.

`build/` holds `build_logs.js`, `mock.js` and the set-piece builder.

— Colin, AD
