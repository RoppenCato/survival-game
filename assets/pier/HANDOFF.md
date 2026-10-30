# The pier, final pieces: C3 (Colin, AD, 2026-10-30)

Robin said yes to the assembly board (out/pier_assembly). Copy this folder whole. `sheets/` holds the pictures and `sheets/pier.json`, `icons/` the Building board's icons.

## How it fits

The pieces render at the tilt that matches the ground (a tile 24 units deep, not the set pieces' 35°), and they have **no ink ring**, on purpose: a ring would draw a seam at every join.
`upp` is 0.25 (4 px a unit). `deckLift` is **10.3 units**: the hero's lift on a deck.

- A **module** is 2 by 2 tiles, on the grid. A pier is an autotile: for each module draw, in this order, `wall_m` (only if nothing is south of it), then a deck, then a kerb for each side with no neighbour.
- **Deck:** `deck_ew_N` where the run goes east or west (boards across it), `deck_ns_N` where it goes north or south. A bend is just a change of deck.
- **Variants** (Clive's ask; I agree, the long runs were plain): 1 plain, 2 two knots, 3 worn boards with splits, 4 a patch with nails, 5 a cleat. All have the same edges and tile with each other. I'd weight them toward plain, as check.js does: `[1,2,1,3,2,4,1,5]` by a hash of the module. The patch and cleat are the loud ones: two patches side by side look repeated.
  The cleat stands by the south edge (ew) or the east edge (ns): use 5 only where that side is open.
- **Landing:** `landing_<side the sand is on>`. It has no kerbs and no wall. It rises from the sand to the deck over one module, so the hero's lift eases 0 to 10.3 across it. Its side skirt is drawn in the picture (e, w).
- **Head:** `head_<way the pier runs out>`, 2 tiles along and 3 across, centred on the pier, half a tile overhanging the grid each side. The kerb is broken where the pier comes in. Draw its wall (`wall_h2` for e and w, `wall_h3` for n and s), then the head; then `things_<way>_n` and `things_<way>_s` as their own items.
- On a head running north, the wall spans the head's whole width and the pier's deck, sorting later, covers the middle. That is right: only the stubs each side show.
- **Dressing:** `mooring`, `coil`, `barrels`, `fish_rack`, `bench`. The anchor is the ground position they stand on, and the picture already carries the deck's lift, so they are **for decks only**. Say if you want ground versions.

## Sort (`sort` in pier.json: game units from the anchor, y south)

| | anchor | sorts at |
|---|---|---|
| deck, kerb | module's middle | **−32**, its north edge |
| wall_m | middle of the module's south edge | drawn with the deck (−64 from its own anchor) |
| landing | module's middle | −32 |
| head and its wall | head's middle | its north edge (−48 for e and w, −32 for n and s) |
| things_*_n / _s | head's middle | −1 / the south edge − 1 |
| net_s / net_n | middle of the edge | +0.5 / −0.5 |
| net_e, net_w | middle of the edge | the piece's north edge + 0.5 |
| dressing | where it stands | 0 |
| hero | his feet | his y, drawn 10.3 up on a deck |

So a hero on a deck or south of it draws after it. A hero north of it draws before it, and the raised deck hides his lower part. `check_east.png`, `check_south1.png` and `check_north1.png` are built from the packed pictures with these numbers, so they test the JSON itself: the hero on the head at several places, and nets on the head's sides.

## What blocks the hero

- **On a head:** `blocks` in pier.json for `head_e/n/s/w`, each a named box from the head's middle (x east, y south): the `rail` along the seaward edge, the `trestle`, the `stump`, the `barrel`. The rope coil does not block.
- **Dressing:** `blocks` on each piece (the coil has none).
- **The pier's sides stop a swimmer**, as you said, except at a net.

## The net

- `net_n/e/s/w`, one tile wide (30 units), anchored at the middle of the edge it hangs on. Its foot lies up to 28 units out on the water, with floats.
- **Fits:** the middle of any open deck side and the head's two non-rail sides; shown on the check pictures, and they read well.
- **Not on:** the head's rail edge, or a landing. Over water only: on sand it looks wrong (see the east check, where I left one on sand for you to see).
- The swimmer's way up is at its foot.

## Yours to draw (the recipe from assemble.js, in game units)

- **Shadow:** for each module and head, a rectangle of its ground box, shifted (+2.3, +1.8) (7 px and 4 px on screen at 3 px a unit), filled `rgba(14,32,48,0.3)`, drawn under all the pier's pieces and on the ground or water. Composite only.
- **Water's line at a wall's foot:** along each open south edge, at its ground y + about 2 units on screen, short dashes 2 units long every 2.7, `rgba(235,250,245,0.55)`, width 0.7, **only over water**.
- The hero's waterline and swimming stay yours.

## The boat

`float` is the work float, drawn apart: lay it on the water beside the hull, and repeat it along a long one. It has its own `blocks`; it isn't part of the pier. The hull stays your ship sheet at heading 0, side on, outside the shallows.

## Icons (`icons/`, 160 by 160, transparent)

`pier_straight`, `pier_landing`, `pier_head`, `pier_net`, `mooring`, `coil`, `barrels`, `fish_rack`, `bench`. There's one for the straight, since a corner is just more straights. `pieces_and_icons.png` shows them all.

## Rules for placement (as on the assembly board)

A landing stands on land. A head goes only at a run's end, with its seaward edge over water. A bend or head may not touch another pier. Keep at least a tile between piers; 2 tiles between heads is tested, closer is by the numbers only.

## Not checked

Only your fights, climbing and placement will show whether the head's blocks feel right to walk round. Snow on these pieces is not done. The old `naust_*` is left as it is, for you to retire.

`build/` holds pier_final_build.py, pack.js, check.js and the assembly test.

— Colin, AD
