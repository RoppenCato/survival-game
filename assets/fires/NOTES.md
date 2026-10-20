# The fires (2026-10-16)

Robin, through the game's session: *"We need to rework the fires. They are static and look ugly. We need new models."*

## What was wrong

The game's five fires (campfire, stone hearth, fireplace, brazier, fire pit) are drawn in code as still props, the flames
painted into the picture. The flames never move, and the drawing does not match the Blender things round it (the hero, the
beasts, the cave mouth). The game already adds rising embers, smoke, a warm light at night and shadows thrown away from the
fire; what it lacked was a fire that burns.

## What they are now

Five Blender set pieces (`build/fires_build.py`), each in three parts from one camera, so they line up drawn at one spot:

- **the base**: the stones, the logs, the iron, one picture that never moves;
- **the flames**: a loop of 10 frames at 12 fps on a layer of their own, so the game lights a fire or puts it out by drawing
  the flames or not. Tongues of flame in three nested flat colours (red outside, orange, a yellow heart) lick, lean and pulse
  on whole cycles of the loop, so it closes; every other tongue throws a small flame off its top that rises and goes out.
  Whatever of the base stands in front of the fire cuts the flames (a log across the front, the pot, the band over the
  fireplace's mouth). No glow is painted in: the game lays the light. Their line is a thin ember brown, not the ink;
- **the embers**: the base burned down, the logs charred and sagging into grey-white ash, a bed of ember red under them and
  red and amber flecks on the coals.

| Fire | Real size | What it is |
| --- | --- | --- |
| campfire | a ring about 1 m across | field stones round an ash bed, four split logs crossed in it, charcoal lumps |
| hearth | about 1.3 m | flat stones laid edge to edge in a rounded square, three logs, and an iron tripod with a pot hanging over the fire (the game's drawn hearth has one; it is where food is cooked) |
| fireplace | 1.3 m wide, the stub 2 m high | a stone back built of its own stones: courses of dressed blocks running back into a dark mortar core, capstones on top, a long lintel stone over the mouth, a sooty firebox with the fire burning inside, three hearth slabs in front, a chimney stub going up (the game draws the chimney's top and its smoke over the roof); built against a north wall |
| brazier | about 1 m tall | a forged fire basket: three legs rise from curled feet, pinch in at a waist and go on up as the ribs of an open cage that flares to a wide rim, three more ribs between, every rib curled outward at the top, two hoops; split wood standing up in it, the fire showing through the bars |
| firepit | a ring about 1.8 m, 2.6 m with the posts | heavy stones in a wide ring with a few laid on top at the back, five logs heaped, two forked posts outside the ring and an iron spit across them with a crank |

The camera is the set pieces' (35 degrees above the ground, looking north). **They are packed at 4 px a game unit**, twice the
drawn props' 2: at 2 px the ink came out twice as heavy as the hero's and swamped the stones; at 4 the line weighs what the
hero's does, and the pictures stay sharp when the camera comes in. The base and the embers have the set pieces' finish (the
kit's grain, the cool shade, the ink ring, as `tools/props.js` gives the cave mouth); the flames do not.

## The check

1. One silhouette: each fire reads at the game's size, the hearth by its tripod, the fire pit by its spit, the fireplace by
   its chimney, the brazier by its legs.
2. Line: the ink as the hero's; the flames' own ember-brown line.
3. Lit side: yes, the sun's; the fire's own light on the stones is the game's at night.
4. Grain: on the bases.
5. One accent: the flames, and nothing else warm but the pale split faces of the logs.
6. Character: split firewood, a sooty firebox, curled iron straps, a crank on the spit.
7. Beside the hero: the campfire is about his height across lying down, the fireplace a head taller than him.
8. The direction: real fires of the period, nothing cute.

## For the game (when Robin says yes)

The sheets are in `sheets/`: per fire `<fire>_base.png`, `<fire>_embers.png`, `<fire>_flames.png` (the 10 frames side by side,
each the size of the base) and `fires.json`:

```
{ "campfire": { "w": 122, "h": 105, "ax": 61.3, "ay": 68, "upp": 0.25,
                "base": "campfire_base.png", "embers": "campfire_embers.png",
                "flames": { "file": "campfire_flames.png", "frames": 10, "fps": 12, "w": 122, "h": 105 } }, ... }
```

`ax, ay` is the fire's middle on the ground in the picture (the spot it stands on, as the props' origin); `upp` is game units a
pixel (0.25: 4 px a unit, where the props are 0.5). Draw the base (or the embers for a dead fire), then the flame frame over it
at the same place and size. The light, the smoke, the rising sparks and the shadows stay the game's; the light's heart can sit
on the flames (about 9 units above the origin for the ground fires; the brazier's fire is about 18 units up, the fireplace's
about 3 units behind the origin). Five fires is 460 KB.

To re-render: `node tools/blender.js fires_build.py -- all <render dir>` then `tools/fires_pack.js <render dir> <sheets dir>` in
the studio (the pack needs the game's kit for the grain).

## For Robin to decide

- The sizes are the game's session's real sizes: the new campfire is about the old one's size, the fireplace and the fire pit
  bigger than the drawn ones. One number each if a fire should be bigger.
- The hearth's tripod and pot: kept from the old hearth; easy to leave off.
- Burned down at night the embers hardly show unless the game gives them a faint light of their own.
- Only one view each, as the set pieces have: a fireplace against an east or west wall would need its own render.

## Robin's second look (2026-10-17)

*"The fireplace looks a bit odd. The stones look like they kinda hover, glued to it. The brazier looks like a BBQ grill. That
needs changing."* Both rebuilt (`before_after_fb.png`):

- **The fireplace**: the first had round stones stuck on the face of a plain grey box, its top and sides showing bare. Now the
  back is built of its stones (`masonry()` in the build): courses of dressed blocks, each its own width, height and tone, running
  the wall's depth into a dark mortar core, so the joints read as mortar and nothing sits on anything; capstones on top, one long
  lintel stone over the mouth, flat hearth slabs in front.
- **The brazier**: the first was a bowl of close hoops on three thin legs, a kettle grill. Now a forged fire basket, an open cage
  you see the fire through, its legs and ribs one bar each, curled at both ends, with split wood standing up in it. A ring
  between the legs read as a wheel and was taken off.
