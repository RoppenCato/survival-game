# How creatures are drawn: the view rig

Decided 2026-10-07 after Robin found the troll "clipping in various ways", with "so many different moving pieces", and asked
for "a new car": a new way to make creatures that works for every creature to come, with some research first.

## What was wrong with the turntable

`animal3D` and `trollD` were turntables: every part laid out in a 3D body space (forward, sideways, up), projected with the
heading and sorted far to near by one depth value each. That gives smooth turning for free, but it fails in exactly the places a
creature is interesting: an arm reaches from the back of the body to the ground in front, so no single depth is right for it;
a nose sticks out in front of the face where the hands are; ears sort against the head one frame and not the next. Each part
also carried its own outline, so limbs met the body with seams. Patching the outline (the ink layers) did not fix the
geometry: the parts still cut through each other because they were placed in 3D and flattened.

## What 2D games with many facings do

- Most hand-drawn 2D games keep **three or four designed views** per creature and flip one of them: a side view (flipped for the
  other side), a front view and a back view, with the diagonals served by the front or back view turned a little. Don't Starve,
  Cult of the Lamb and Spiritfarer draw their creatures this way (2D skeletons with view-specific art); Hades keeps a single
  three-quarter view and flips it; Stardew and the classic RPGs draw four sprites.
- Nobody projects a 3D model of parts into 2D for a hand-drawn look: the result reads as a puppet, and every view has the
  same compromises.
- What makes those creatures read is that **each view is composed**: the artist decides which leg is in front, where the
  tail shows, how the head overlaps the chest. Layering is part of the drawing, not a sort.

## The view rig

The hero already works this way (`inkHero`: side, front and back views, the front and back turned by `an.turn`), and Robin
accepted it. The creatures now follow it:

- **`quadD`** (plan 5, every four-legged animal): a side view facing left (flipped for right), a front view and a back view.
  The side view is the designed one: the body a drawn shape (chest, hump, back, rump, belly), four two-bone legs placed by
  `ik2` (the front knee bends forward, the hock back), the neck raised by `neckUp`, the head with its snout, eye, ear, antlers,
  tusks or fangs, the tail of its kind, the mane along the back. The front and back views are the body end-on with the legs in
  two pairs, the head over the chest (or beyond the rump) and, when the heading is diagonal, the figure turned by `tq`: the head
  slides to the side it looks toward and the flank widens.
- **`trollViewD`** (plans 8 and 9): the same three views for the boulder troll and the forest troll. The nose is part of the
  head's own shape and the beard hangs from the jaw in the same layer, so nothing can cut through them; the hands rest on the
  ground in front; the sweep raises the near arm in the windup and swings it across in the blow.
- **Layering by view**: far limbs, then the body with the neck and head and hair, then the near limbs, each band through the
  ink layers (`INK_FIG`) so it gets one silhouette and one ink line, heavy on the shadow side.
- **The heading**: the side view within 25 degrees of straight left or right, otherwise the front or back view turned by
  `tq = cos(heading) / 0.7`. Turning is continuous inside the front and back views and flips between them and the side view,
  as the hero does.
- **The old rigs stay** (`animal3D`, `boulderTrollD`, `forestTrollD`, `trollD`) behind `lib.RIG` (`animals`, `trolls`:
  `'views'` or `'turntable'`), and the Creature Editor has a Rig switch to compare. The snake (plan 6) is still `animal3D`.
- **The spec is unchanged**: the same animal keys (bodyW, bodyH, head, legLen, legW, neck, neckUp, snout, snoutW, ears, antlers,
  antlerSize, tusks, hump, mane, hoof, tail, tailPale, paleMuzzle, snoutFlat, fangs, brow, pattern, eyeSize, size, colours) and
  troll keys drive both rigs, so the Creature Editor's sliders and the saved creatures carry over.

## Making a new creature

1. Decide its silhouette in the side view first: body shape, leg length, neck, head and the one thing that is its own (a hump,
   antlers, a mane, a tail). Everything must read at thumbnail size.
2. Fill in the front and back views: what shows end-on (ears, antlers, the chest or the rump, the tail).
3. Give it an attack pose per state (`windup`, `lunge`, `recover`): a crouch, a rear, a stretch.
4. Render it with `node tools/visual/animals.js` (five headings, the walk, the windup and the blow) before it goes in the game.
