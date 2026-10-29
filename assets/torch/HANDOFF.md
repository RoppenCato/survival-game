# The torch in the off hand (Colin, AD, 2026-10-29)

Clive's chapter 1 ask 1, Robin's rule: a torch is held in the shield slot (the left hand), beside a one-handed weapon.

**Two layers on every clip the shield is on (23 clips, eight directions):**
- `torchHeld`: a split pine stick with a cord band at the grip, its head wrapped in tarred cloth, charred, with embers glowing in the
  wrap.
- `torchFlame`: the flame in three warm tones, the fires' palette a step lighter. The flame **always stands upright**: it turns about
  its root, so fire rises however the hand holds the torch (raised in block, thrust forward in bash).
- **`anims.<clip>.flame`**: the flame's root, for each direction and frame, in the frame's units, as `hands` and the rod's `tip` are
  ([x, y, depth]). Hang the light there.
- **The flicker:** draw torchFlame scaled about that point by a little noise (0.9 to 1.1 tall, ±3 % wide) with a soft additive glow
  under it, or draw your own flame at the point and leave torchFlame out. I made no flame loop: the clips are 6 to 32 frames, and a loop
  baked into every one would cost about six times the memory. Flickering in code costs nothing.
- **Draw order:** as the shield's (it is in the left hand). Seen from the north-east it is mostly hidden by the body, as the shield is.
- **Set fire:** the bash with the torch layer on thrusts the torch forward at chest height. No new clip is needed.
- **Validated:** the left hand's pose in the kit file matches your shield sheets at 0.987 to 0.993 on all 23 clips.
- **Cost:** 46 sheets, about 1.6 MB.

**Drop-in:** copy `sheets/hero-kit/` over `assets/sprites/hero-kit/`. It is your current set (with the wake) plus the torch layers and
`flame`. No other layer changed.

`torch_colour.png` shows idle, walk, block and bash, in eight directions, with a club in the right hand.
`build/`: add_torch.py, torch_render.js, render.py and pack_sac.js (both now write `flame`), and kit_any.html (the viewer has a torch
choice).

— Colin, AD
