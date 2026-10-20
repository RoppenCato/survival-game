# Before Wednesday (2026-10-21): what to do first, on Opus

**A plan (2026-10-20).** The long Fable session builds `docs/build-plan-waters.md`. These are the things that must or should be
done before it, so that Fable builds from the first minute and does not trip over them. Each says who does it, why, and when
it is done. Mine are in order; Robin's can come at any time today.

## Robin (about fifteen minutes)

| # | What | Why it matters for Wednesday |
| --- | --- | --- |
| R1 | Answer the seven decisions in `docs/build-plan-waters.md` section 1, or say "the defaults" | Fable starts without waiting. Number 1 (the karve on copper) changes a cost today (task 7). |
| R2 | Yes or no to the fire models (the Art Director's `out\fires`, waiting for your yes) | If yes, they go in today (task 6), not on Fable's day. |
| R3 | Optional: pick a hit sound in the Combat Arena's The sounds panel (I to L, or V) | It becomes the default in a minute. |
| R4 | Optional: pick the fifth ring's name from the Lore Director's list | It comes in the next lore handoff. |
| R5 | Optional: may I delete the old renders and tests in `art/render` (4.1 GB, git-ignored), the old blends and probe scripts the Art Director listed? | Disk space; nothing in the game uses them, but re-rendering would take time. |

## Mine, in order

### 1. Saves that fit the bigger sea (required)

**Measured 2026-10-20:** `game.save` is 1,561 KB, of which the painted ground (`ground`) is 1,509 KB and the building state
`B` 47 KB; `game.save.runes` is another 1,552 KB; all the game's storage together is 3.3 MB, and a browser gives a site about
5 MB. The ground field grows with the map, so the bigger sea would not fit, and today's saves are already more than half full.

**Do:** save only what the player changed on the ground (the brush strokes or the tiles that differ from what the world
generates), not the whole field; the generated dressing is rebuilt from the seed at load (check `groundDressed` and
`w.dress()`). Convert an old save with a whole field once, on load. Apply it to every scene's save (they share the same code).
If anything else large turns up in the save, the same rule: keep what changed, not what can be regrown.

**Done when:** a save after painting a path is under about 100 KB; reloading keeps the path; an old save still loads; all
the game's storage is well under 1 MB.

### 2. Sprite sheets loaded when they are used

**Measured 2026-10-20:** the hero's sheets are 178 images, about 1.5 GB decoded if all are loaded (one idle layer is 16,400 by
1,312 pixels, 82 MB), and `Sprites.hero()` creates every one at the start (`load()` in `src/sprites.js`). The beasts the game
loads at the start (`Sprites.load` for boar, deer, wolf, bear, moose, snake, troll, unge in `templates/game.html` around line
383) add about 800 MB. The people are already lazy (`Sprites.loadLazy`). Chrome copes by discarding and decoding again, which
can show as stutters; more men and creatures on a raid make it worse.

**Do:** load the hero lazily (as `loadLazy` and `imgOf()` do for people), warm the clips that are seen at once (idle, walk,
run) and warm a weapon's clips when it is taken in hand, so no clip shows a blank frame; load a beast's sheets when one comes
near and let them go when none has been near for a while. While a sheet loads, show a plain soft shadow, not the old drawn
figure (the Art Director, 2026-10-20: a flash of the old drawn people is a second style); warming ahead makes it rare.

**Done when:** at the start only the sheets in use are loaded (count the loaded images and their pixels before and after);
walking, sprinting, the first swing of each weapon, a boar charging and the troll's cave show no pop-in and no new SPIKE lines
in the frame log at Robin's size.

### 3. Leaner sheets from the Art Director (asked 2026-10-20: done)

In their art plan (`C:\dev\SG\Art Director\docsrt-plan.md`): memory budgets per set (the hero 1.5 GB to 350 MB, the idle
100 frames to 16), the approved beasts and väsen trimmed before they are dropped in. **After Wednesday, mine:** a packer that
cuts each frame to its own pixels with an offset (`tools/sprites.js` and `src/sprites.js`), then the studio repacks every set.

### 4. Baselines for Fable to compare against

- `tools/worldtime.js`: time and memory of `World.make`, `plant` and `dress` for the game's sea (run it now, keep it for
  Wednesday's step 1 budget).
- `npm test` output saved to compare after each step.
- A chart of today's sea with `tools/visual/worlds.js`.
- The frame log of a walk across the big island at Robin's size.

Write the numbers into `docs/build-plan-waters.md` section 0.

### 5. Names ahead, from the Lore Director (a message)

The jarl of home water (his name, his household, his seat's name) and names for home water and the four waters (or whether
they stay unnamed on screen), so Fable does not need `LORE?` placeholders.

### 6. The fire models (if Robin says yes)

Copy the Art Director's `out\fires` as the whole folder; draw the campfire, the hearth, the fireplace, the brazier and the
others from their sheets with the drop's numbers (`fires.json`: 10 frames at 12 fps, `upp` 0.25, each sheet's anchor; the
brazier's fire heart about 15 units above its origin for the light); check by day and by night at Robin's size.

### 7. The karve on copper (if Robin says yes to decision 1)

`HULLS.karve.cost` in `src/yard.js` to wood 24, copper 10, fiber 12; `tests/karve.js`; `docs/boats.md` and CLAUDE.md ("boats
need copper, ships iron" becomes: the karve is the copper age's sea-going ship, the longship needs iron).

### 8. Ready for Wednesday

`npm test`, commit and push; update `docs/build-plan-waters.md` with what changed here; and write the opening prompt for the
Fable session (which files to read, which step to start, the effort), so Robin pastes it and goes.
