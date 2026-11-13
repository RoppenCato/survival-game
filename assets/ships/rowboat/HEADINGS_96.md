# The rowboat at 96 headings (Colin, AD, 2026-11-13)

For Clive, GD. Robin still sees the rowboat shake in a turn (2026-11-13).

## The pictures

- **`switch_32_vs_96.png`:** one switch, drawn as your `artFrame` draws it. It shows the same moment from the picture before the
  switch and the picture after, and what moves between them (red before only, green after only).
  - With 32 headings, the stems sit side by side.
  - With 96, they nearly overlap.
- **The page, for Robin to watch it turn:** https://claude.ai/artifact/XLcYoCM9eQrb9fz2YVgL8H. It shows both sets turning your way,
  at 3 px a unit, gentle or hard.

## The cause, and why more pictures

Turning a picture on the ground is right for the hull's waterline. Anything with height leans by about height × angle / K, and at a
switch the lean flips. No single turn of a flat picture keeps both the ground and the uprights right. The only other true cure
would be the stems as their own little pictures, moved with the hull and never turned, which is more of your work for the same
gain.

So, more pictures. Measured with your `PIC_HOLD` of 0.62:

| headings | what moves at a switch | in memory, composed | on disk |
|---|---|---|---|
| 32 (today) | about 990 px | about 6 MB | 1.1 MB |
| 48 | about 710 px | about 9 MB | 1.5 MB |
| 96 | about 370 px | about 17 MB | 2.9 MB |

48 helps little. 96 is the cure. It goes past the 10 MB we gave a rowboat, but she is the only boat of chapters 0 and 1.

## The drop-in

Copy `out\rowboat_96\rowboat\*` into `assets\ships\rowboat\`: `rowboat.json` with `headings: 96`, and the same four sheets (back,
front, tar, trim).

**What changed in the json:**
- The marks are the same values as yours. Only the order of their keys moved.
- The packer has changed since the first rowboat. It now lays the frames out by height and adds `groups: {}` and `bowNear` (96
  entries), which you read only for big ships.
- `compose` now holds the newer wording. Nothing reads it.

**Checked:**
- Every third heading of the 96 is pixel-identical to today's mended 32, so nothing else about her changed.
- The hole fix is in all 96.

**If 96 is too dear,** `out\rowboat_96\rowboat_48\` is the same thing at 48, every second heading of the same render.

**Your side:** with three times the pictures a switch is a third of the jump, so `PIC_HOLD` can come down toward 0.55. Your call.

## Making it again

`node tools/blender.js build\ship_build.py -- rowboat <render dir> --headings 96` (about 25 minutes), then
`build\ship_pack.js <render dir> <sheets dir>`.

`build\switch_pop.js <sheets dir>` measures a set's switches, and `build\turn_page.js` makes the page.

— Colin, AD
