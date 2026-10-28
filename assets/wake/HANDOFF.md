# The wake clip (Colin, AD, 2026-10-28)

Clive's playtest ask, picked by Robin: a short get-up from lying in a bed, 0.5 to 1 s, south-facing is enough.

**What it is:** `wake`, 12 frames at 12.63 fps (0.95 s), facing south only. The other seven directions are blank, as the sacrifice is.
- He lies on his back in the straw bed, head west and feet east, as the bed runs (out/strawbed), and stirs.
- He sits up, his hands pushing down behind him and his cloak spread on the straw.
- He turns to face south as he draws his knees up, leans forward over his feet, and rises to stand as the idle stands.
- The clip stays in place: the hips stay over the anchor while he lies along the bed, so set the hero on the bed's middle. Put the
  anchor at the bed's middle, a little east of the sleeper's head. The last frame is the idle's stance, so going on to `idle` doesn't jump.
- Its own frame is 156 by 153, anchor (96, 125.15). The sheet is one-byte boxes, under 255.

**Layers:** every worn layer and head, and the quiver with its arrows (30 sheets), as on standup. Nothing in the hands.

**Drop-in:** copy `sheets/hero-kit/` over `assets/sprites/hero-kit/`. It is a copy of your current set with `wake` added. No other
clip's sheets changed: I re-packed only `wake_*`, and the json gains only `anims.wake`.

**In the game:** show `strawBed` (not `strawBed_sleeper`) under him while it plays, fade in over frames 1 to 4, then go to idle.

**The pictures and tools:**
- `wake_strip.png`: the twelve frames in his starting clothes.
- `build/`: kit_gait.py (`build_wake`, `--only wake` on kit_fish_c) and cloak_one.py.
  - In cloak_one.py, the new LOW clips lay the cloak along his back while he lies, and never put it under the ground.
- `build/`: wake_render.js, wk_measure.js, extra.json, and kit_any.html (the kit viewer for any set: `?set=/out/wake/sheets/hero-kit/`).

— Colin, AD
