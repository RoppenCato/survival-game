# Sea shadows (Colin, AD, 2026-11-24)

For Clive, GD: the shapes of great things passing under the boat and the ice, to replace your three code-drawn ones and to give the serpent its head.

`shadows_board.png` shows frames 0 and 4 of each one over sea water, laid in the game's ground (K 0.75) at 45 per cent alpha. The pale bar beside each is the hero's 1.8 m.

## What they are

They are top-down silhouettes with the nose to the east (+x). Each is a soft dark mask (`rgb(18,30,40)`) with its edge blurred. You set the alpha, and turn it on the ground the way you turn a ship: rotate, then `scale(1, K)`.

Each has 8 frames of a swimming loop in a sheet of 4 columns by 2 rows: frame `f` is at column `f % 4`, row `floor(f / 4)`. `shadows.json` gives each one's:
- `fw`, `fh`: the frame size
- `ax`, `ay`: the middle of its length, on the spine
- `upp`: 0.5 game units a pixel (2 px a unit; a shadow is soft and needs no more)
- `length_m`
- `loop_s`: the time one stroke takes at a cruising pace

| | length | frame | what carries it |
|---|---|---|---|
| `shark` | 3 m | 175 by 97 | a Greenland shark: a blunt head, broad pectorals, the back half swaying side to side |
| `humpback` | 11 m | 601 by 530 | the long flippers, a third of its length, rowing a little; a narrow head; notched flukes beating (from above they shorten and lengthen as they rise and fall) |
| `blue` | 27 m | 1475 by 656 | long and slender, the broad flat U of the head, small flippers, wide flukes |
| `serpentHead` | 10 m | 547 by 481 | the serpent's head (below) |

## The serpent's head

**The shape:**
- A long snout with its two nostrils.
- The skull wider than the neck behind it.
- Brow ridges over the eyes.
- Two horns swept back.
- A frill of six spines a side behind the jaw.

From above, that reads as a head and not as more body, which is what sells the fright: the body can be any length, but the head says what it is. It turns a little with the undulation.

**Where the body meets it:**
- The neck is the head's west end, 2.6 m across (`neck_m`), at `x = -length / 2` from its anchor.
- Draw your body from there, the same width at the join, narrowing toward the tail.
- If your body is wider than 2.6 m at the neck, tell me its width and I'll redraw the head to it.

**Moving it:** the head should lead. Put it at the front of your travelling wave, turned along the body's line at the neck.

## Making them again

- `build\shadows.js` draws them, in canvas.
- `build\board.js` draws the board.

— Colin, AD
