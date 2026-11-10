# The old pine and its big log (Colin, AD, 2026-11-10)

For Clive, GD, chapter 1 item 2. `oldpine_board.png` shows all of it.

## The tree: `trees/oldPine_1`, `oldPine_2`, `oldPine_trunk`, `oldPine_log` and `trees/trees.json`

The same format as the other trees: merge the four entries into `assets/props/trees/trees.json` and copy the pictures beside them.

- **The tree:** an old Scots pine as they grow alone, about 10 m, nearly twice the pine.
  - A long bare trunk twice the pine's girth, flared at the foot. The bark is grey and plated low down and fox-red high up.
  - Dead stubs where the lower limbs broke away.
  - A few heavy crooked limbs high up, each carrying a broad flat pad of needles, so the crown is a wide umbrella in the top third rather than a cone. It stands clearly apart from the pines round it.
- **`oldPine_trunk`:** the felled trunk, drawn by `Gather.drawTrunk` as the others are, chopped end toward -x.
- **`oldPine_log`:** the one big log lying, 3.4 m. It is the same log as on the shoulder and on the water.

## On the shoulder: `carryLog`

This is a new layer on `carry` and `carry_walk`, in **`out/hero-kit_2026-11-10/hero-kit`**, the one set copy with the flint gear and the shirt. Draw it as you draw `carryDeer`.

- **How he carries it:** lengthwise on his right shoulder, balanced at its middle, the front end a little up, as one man carries a heavy log. Across both shoulders it stood up like a pillar walking east or west. Walking north or south you see it end-on, which still reads.
- **The carry clips' frame grew** from 220×184 to **288×234**, anchor (110, 154) to **(144, 204)**, so the log isn't cut. Every layer already in those two clips (the deer, the boar, the hen, the worn layers) keeps its sheet; only its rects moved by the padding, and both clips now have `rectBytes` 2. `checks/check_carry.png` draws the game's set and the new one side by side: the deer sits exactly where it did. If your code reads the carry frame from anywhere but the JSON, change it there too.
- **Draw order:** the log lies on his right shoulder. Facing west, north-west or north, that shoulder is the far one, so the log wants drawing before the body, as your `rankOf` does for things in the hand. Facing east and south it goes over him.

## Towed behind the rowboat: `float/oldPineFloat_00..15` and `float/float.json`

- **Headings:** the log is the same end to end, so 16 pictures serve the rowboat's 32 headings. Heading k (2πk/32, as the boat's frames) takes `oldPineFloat_<k mod 16>`.
- **Size:** the rowboat's own, 2 px a game unit, frame 170×130. The anchor is the log's middle at the waterline.
- **The water:** what lies under it is already cut away and has no line, as the ships are. Draw it over your sea and lay your wake and foam along its waterline.
- **The tow point:** add `"tow": [-49, 0, 16]` to `marks` in `assets/ships/rowboat/rowboat.json`, in hull units like the other marks: low on the stern post, where a rope would tie. The rope and the log's place behind are yours.

## The karve's mast

From the same log; nothing to draw. Your ship code draws the mast.

`build/` holds the tree builder (`--kinds oldPine`), `float_log.py`, `add_carrylog.py`, `widen_carry.js` and the packer that keeps the wider frame.

— Colin, AD
