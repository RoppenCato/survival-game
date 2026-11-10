# Eadric the copper-man's own look (Colin, AD, 2026-11-10)

For Clive, GD, who asked for it (chapter 1, the glimpses of chapter 2); after Alistair, LD's `person.eadric`: a trader from the south
with copper goods, a cross on a thong, folding scales on his belt, silver only.

## What he looks like

The pictures:
- `eadric_at_saltvik.png`: at game scale and at twice that, beside the hero, a villager, a woman and the old fisherman.
- `eadric_close.png`: a crop of the same.
- `every_clip.png`: every clip, two directions.

- **The south's long tunic**, woad blue, to below the knee, with a broad pale border at the hem, the cuffs and the neck. The islands'
  folk wear the short tunic in greys and browns; he is the one in dyed cloth.
- **His shop on his back**:
  - a roped bundle with a fur rolled on top, the straps over his shoulders;
  - copper hung on it: a pot high at each side (seen over his shoulders from the front), a cauldron slung under the pack, and a pan
    on its back.
  The pack and the copper are his one thing, and the copper is what catches the light.
- **The cross** on a thong, on his chest.
- **The folding scales** at his right hip, the beam and its two pans, and a purse for the silver at his left.
- **Linen leg wraps**, cross-gartered, under the tunic.
- **His head**: hair cropped short, no braid or knot; a short dark beard.

## The drop-in

1. Copy `out\eadric\people\*` into `assets\sprites\people\`. This adds:
   - 25 new sheets, `<clip>_eadric.webp`;
   - a new `people.json`, the same as yours but for the new layer `eadric` in every clip.

   Checked: every sheet you have is byte-identical to before, and the frames lie exactly where the set's do (64 of 64 idle body
   frames cut the same).
2. **His look** is the body, the trousers tinted dark, and his layer. He has no hair, beard or hat layer, because his head is in it:

   `{ L: [{ l: 'body' }, { l: 'legs', t: '#3e3630' }, { l: 'eadric' }], s: 1, sx: 1, sy: 1 }`, with `idOf` for its id.

   A way in: an `x.eadric` in `Sprites.lookOf` that returns this, given by `personLook` when `m.eadric`.
3. **When `eadricTick` makes a Saltvik villager into Eadric**, clear `m.look` and `m.warm` so his look is made anew and its clips
   warmed.
4. **Rank:** `RANK.eadric = 4` (with the coat). A thing in his far hand then goes under his clothes, in his near hand over them.
   Without it the layer ranks 11 and still draws right, since his head is in it.

## What it costs

- On disk: 6.8 MB.
- Decoded: 74 MB if every clip's sheet is loaded. The set is lazy, so for the clips he lives in (idle, idle_look, walk, jog, run,
  sit, pickup, interact, hit, death) it is 39 MB, and less once the unused ones are trimmed.
- The two idles are most of it. If that is too much for one man, give him the idle in place of idle_look; I can also cut his idles
  to half the frames.

## Every clip

Eadric's layer is rendered for all 25 clips of the people's set, the rowing and the death (in its own frame) too, so whatever job he
falls into he stays dressed.

## Making it again

The game's `npm run art:people` does not make this layer. It comes from the studio's build:
- `build\eadric_build.py` copies the people's tunic out and dyes it, lets the skirt down, and adds the pack, the copper, the cross, the
  scales, the wraps and the head;
- `render.js` renders the layer with the game's `render.py` and the people's frames;
- `merge.js` lays it into a copy of the set.

If the people are ever rendered again, ask me and I will render his layer against them.

— Colin, AD
