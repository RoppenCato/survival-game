# Fresh water's birds: mallards and a whooper swan (Colin, AD, 2026-11-10)

For Clive, GD. Robin said yes (2026-11-10): ducks on the lakes in place of the gulls, and a swan on Svanesey, the swan's isle.

- `sheet.png`: every picture.
- `on_the_lake.png`: a mallard pair, an up-ended duck and a swan pair on the fresh-water mock, enlarged. `on_the_lake_1x.png` is at Robin's size.

## The pictures: `render/<bird>_<dir>_<frame>.png` with a `.json` each (72)

Built like the sea's gulls (`out/sea`): the game's camera at **65 px a metre**, which is Robin's size, so draw them at 1:1. The water is cut away below the surface.

**The birds:**
- `drake`: a mallard drake, 0.55 m. Green head, white collar, chestnut breast, grey flanks, blue speculum, and the black tail with its curl.
- `duck`: a mallard hen, mottled brown with a dark eye stripe, built the same.
- `swan`: a whooper swan, 1.5 m. White, the wings folded high, the long straight neck, the bill yellow and black.

**Directions:** `s sw w nw n ne e se`, the game's order. `s` is swimming toward the camera.

**Frames:**
- `0` and `1`: swimming, a gentle bob. Alternate them slowly, about 0.7 s each.
- `2`: feeding. The duck is up-ended, tail to the sky and its head under; the swan's neck is down into the water. Hold it 2–4 s now and then, while still.

The JSON gives:
- `origin`: the pixel of the water point under the bird's middle; stand it there;
- `water`: the waterline cuts, for a pale lip if you want one;
- `ppm`: 65.

## How to show them

- **Swimming:** 6–10 units a second, turning slowly. The picture is chosen by heading.
- **The wake:** two thin pale lines spreading behind it, rgba(230,240,236,0.35), about 28 units long.
- **Under it:** a soft dark ellipse, rgba(30,44,40,0.14), about a third of its width and 4 px tall.
- **Rings:** a small ring when a duck rights itself after feeding.
- **Ducks:** on lakes and slow river reaches, in twos to fives (a drake to each hen, a spare drake or two), near the reeds and lily pads. They paddle off when the hero comes within about 3 tiles. They rest by the reeds at night, frame 0, still.
- **Swans:**
  - A pair on Svanesey's water, kept apart from the ducks.
  - Now and then one on another big lake.
  - They move off slowly when the hero comes near, and never land.
- **No flight frames:** if you want them to leave, fade them out at the far shore.
- **Not on the sea:** the gulls stay the sea's.

`build/waterbirds_build.py` makes them again (`node tools/blender.js waterbirds_build.py -- swan 2 0 <out dir>`).

— Colin, AD
