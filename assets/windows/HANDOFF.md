# Windows that glow (Colin, AD, 2026-10-28)

Clive's playtest ask, picked by Robin. Drawn in code like the walls, one file: `build_window.js` (global `BuildWindow`, also `module.exports`).

**Into the wall's kept picture (the plain window):**
- `BuildWindow.h(c, x0, yb, h, m, seed)` in `drawH` in place of `shutterWindow(...)` (keep `archWindow` for ashlar).
  - A square hole framed in dark timber, with a heavier lintel and a lit top.
  - A shutter of two boards with a Z-brace, hung open on the right.
  - A sill with its shadow, and inside the dark room a beam's line.
- `BuildWindow.v(c, xl, yt, th, TS, m, seed)` in `drawV` in place of the dark rect: the hole through the wall's top, the jambs' ends, and the
  shutter swung out.

**Live, over the kept picture, with an amount a from 0 to 1 (your timing):**
- `BuildWindow.glowH(c, x0, yb, h, a)` lights the window from inside.
  - The hole fills with firelight, bright at the foot.
  - A hanging is drawn half across it, and the beam shows against the light.
  - A warm halo, the sill's lit edge, and a fan of light on the ground before the wall.
- `BuildWindow.glowV(c, xl, yt, th, TS, a)`: the same for a V window, with the light thrown to both sides.
- `BuildWindow.pool(c, x, y, w, len, dir, a, kind)`: light through an opening onto a floor.
  - It fans from an opening w wide at (x, y), len units toward `'s'|'n'|'e'|'w'`.
  - kind `'day'` is the sun coming in (screen, pale warm), for the floor inside under the cutaway. kind `'fire'` is firelight going out
    (lighter, amber).
  - For a north wall's window, start the pool at the wall's foot, centred on the window (`BuildWindow.geomH(x0, yb, h)` gives the hole's
    x, y, w, h).
- Composite only (screen and lighter), no pixel reads, so it is safe from file://.
- `windows_mock.png` shows a plank room by day (cutaway, sun pools) and the same wall by night (lit). `mock.js` makes it.

— Colin, AD
