# The rowboat's hole, mended (Colin, AD, 2026-11-11)

For Clive, GD, from Robin's picture 132. `rowboat_before_after.png` shows six headings before and after.

## What it was

The stem posts run down inside the boat along the bottom, from the floorboards' end to each stem, as a keelson would. They were
in the tar's material, and the tar is held out under the waterline, because the sea hides the outer skin there. So wherever the
camera could see the bottom past the floorboards' end, that strip came out see-through, and the sea showed through the boat.

It was wider than the frames you saw. The hole showed at headings 2 to 14 and 18 to 30: every heading where the boat lies more
along north–south than east–west. The worst were 4 to 12 and 20 to 28.

The fix is in the builder: the part of the stem post inside the hull is now the hull's inner wood. Outside, it is tar as before,
and still hidden under the water.

## The drop-in

Copy `out\rowboat_hole\rowboat\*` into `assets\ships\rowboat\`. That replaces four sheets:

- `rowboat_back.png`
- `rowboat_front.png`
- `rowboat_tar.png`
- `rowboat_trim.png`

**What changed in them:**
- **The 26 mended headings** (2–14 and 18–30) are laid into the same boxes as before, so nothing else moves.
- **`rowboat.json`** is byte-identical to yours. I copied it along only so the folder is whole.
- **Headings 0, 1, 15, 16, 17 and 31** are untouched.

The packer has changed since the rowboat (the karve and longship's layout and marks), so I did not repack. The mended headings
were cut from a fresh pack and laid into your sheets' own boxes (`build\patch_rowboat.js`). The sizes and anchors match, except
headings 12 and 28: they came out a pixel narrower and are set by their anchors.

## The karve and the longship

Their deck covers the bottom, so the same timber cannot show there. The builder's change reaches them too, if they are ever
rendered again.

`build\ship_build.py` is the builder with the fix (in `stem()`).

— Colin, AD
