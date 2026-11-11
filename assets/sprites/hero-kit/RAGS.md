# The castaway's clothes: shirtRag and shortsRag (Colin, AD, 2026-11-11)

For Clive, GD. Robin, after chapter 0: "you should start with rugged shirt and rugged shorts. Naked hero only having underwear".

The pictures:
- `rags_board.png`: at the game's size and at twice it. The rows are:
  1. nothing worn;
  2. the rags;
  3. the rags with the belt;
  4. the clean shirt and trousers that come after.
- `rags_walk.png`: the walk in eight directions.
- `rags_sit_row_chop_death.png`: the clips where the knees bend and the body tips.

## What they are

- **`shirtRag`:** the undyed shirt gone sea-worn: greyed and stained. Its hem is torn into tatters with two long tongues, the right
  sleeve torn off above the elbow and the left below it. The neck is ripped open in a long tear. Every torn edge is frayed darker.
- **`shortsRag`:** the trousers torn off below the knee, the right shorter than the left, the ends frayed. They are faded brown wool
  with their own seat, so the linen drawers don't show between the legs. The bare shins and feet below are the body's.
- **No tint.** Both are built from the kit's own shirt and trouser pieces, so they move as those do. The torn shins ride the shin
  bone, so they bend at the knee when he sits, rows or kneels.

**No `underwear` layer.** The bare body already wears linen knee drawers with a cord (the top row). You have already made the bare
hero the body alone with no belt, so nothing waits on it.

## The drop-in

Copy `out\rags\hero-kit\*` into `assets\sprites\hero-kit\`. The folder holds 132 new sheets and a new `hero-kit.json`:
- 66 sheets `<clip>_shirtRag.webp` and 66 sheets `<clip>_shortsRag.webp`, one each for every clip: the rowing, the carries, the
  fishing, death (in its own frame), wake and sacrifice (south only, as the set has them), and the claim stone's three acts (north
  only).
- `hero-kit.json`: yours with the two layers added to every clip and to `layers`.

**Checked:**
- All 3071 sheets you have are byte-identical.
- The json differs from yours only by the two layers.
- No frame reaches past its clip's frame.
- The set it was packed onto is your current one (68edc086).

The ranks are yours already: `shortsRag` 1 and `shirtRag` 1.9. A tunic, coat or mail drawn over the ragged shirt covers it, the same
way it covers the clean shirt.

## What it costs

- **On disk:** 13.1 MB for both.
- **Decoded, every clip loaded:** shirtRag 95 MB, shortsRag 61 MB.
- **Decoded, the clips he lives in on chapter 0:** 35 + 23 MB. Those are idle, idle_look, walks, jog, run, chop, mine, pickup,
  interact, drink, the sitting, hit, the two attacks, wake, row, the carries and death.
- They replace the shirt and the trousers he wore before, so as you trim worn layers, the extra is only while both are loaded.

## Making them again

`build\add_rags.py` runs on the bear cloak's six kit files, in `work/bearcloak/source`. Then `build\rags_render.js` renders them
(18 batches, about 45 minutes with five at a time), and `build\pack.js` packs them onto your set.

**A trap in the renderer:** `render.py` takes a layer's pieces by name prefix. A render of `shirt` from these files would also take
the `shirtRag_*` pieces, just as `tunic` would take `tunicWolf_*` and `cloak` would take `cloakWolf_*` and `cloakBear_*`. Those
layers are done, so nothing is wrong now. Do not render them again from these files without fixing the match first.

— Colin, AD
