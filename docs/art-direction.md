# Art direction: the ink of Egerkrans, the light of Bauer

Decided with Robin on 2026-10-07, after he found the flat pastel look "a bit of a mobile game, it lacks character and art
direction". The references are in `docs/reference/` (Bauer and Kittelsen, public domain, with a contact sheet) and in the
notes on six pages of Egerkrans's *Nordiska gudar* from Robin's own copy (`docs/reference/egerkrans/README.md`). Everything
below is a rule to check new art against. The **Art Direction page** (`look-editor.html`) shows the same scene in the old look
and the new, with the rules as sliders, and hands the chosen look to the game (`game.look`).

## The sentence

**A Viking-age Scandinavia drawn in ink and painted in watercolour: Egerkrans's line and silhouettes, Bauer's light and
colour, by day lush and green, at night and underground old and deep.**

Everything is still drawn in code. The look is a renderer and a palette, not a set of pictures.

## 1. Colour

- **One key per scene, one hot accent.** A scene (a place at a time of day) has one colour key: by day a warm green-gold key
  with cool blue-grey shadows; at dusk ochre; at night deep blue-green; in the cave grey-brown. In that key, **one colour is
  allowed to burn**: the hero's red cloak, a fire, copper in the rock, the wolves' eyes, the troll's beads. Nothing else is
  saturated. (Hel: all cold green with one gold brooch. Fenrir: black and bone with two orange eyes.)
- **Shadows are cooler and bluer than the lit side, never the same hue darkened.** The kit's shade colour mixes toward a cool
  shadow hue (`shadowHue` about 220) instead of the olive it had. Highlights are warm.
- **The palette is earth and bone:** ochre, umber, moss, grey-blue, bone white, iron grey. Saturation sits under the old
  pastels (`sat` about 0.8). Pure white and pure black do not appear; the darkest line is warm brown-black.
- **Daylight stays lush.** Robin's rule from 2026-10-04 holds: happy, green Scandinavia by day, nothing dark or shady, no
  stray glowing lights. Bauer's daylight pictures are green and bright; the gloom is kept for the cave, the troll and the night.

## 2. The line

- **A hand-made ink line, dark warm brown-black** (`#231a16`-ish), **thicker on the shadow side of a shape and thinner toward
  the light.** The kit draws it as a thin line all round and a heavier line that fades in toward the lower right.
- **Varying, not uniform.** Ends taper; the line wobbles a little (`rough`); corners are rounded.
- **Figures are whole.** Limbs flow into bodies: the outline belongs to the silhouette, not to each part. Drawn in two passes
  per depth layer (all outlines, then all fills) so seams between parts vanish and only real overlaps keep an edge.
- **Silhouette first, detail second.** Every thing must read at thumbnail size as one shape. Fur and hair are a jagged
  silhouette, not strands; detail is spent on gear, brooches, carving and the face.

## 3. Light and surface

- **One sun, upper left, for everything**: props, creatures, the hero, the ground. A soft dark foot where a thing meets the
  ground. The lit side gets a thin warm edge.
- **Grain in every fill.** Paper and pencil show through: a fine grain pattern clipped to each shape at low strength
  (`texture`), stronger in shadows than in lights. No fill is a clean flat colour.
- **Two tones per shape plus the grain**: base and a cool shadow crescent, a small warm highlight. Not gradients, not
  rendering.
- **Air.** Far things slightly paler and bluer; mist low in the ground at dawn; a faint vignette at the edges of the view.

## 4. Figures and proportion

- **People are lean and long**, small against the trees and smaller against the trolls. Character lives in the face and the
  gear: brooches, belt plates, rings, carved spears, runes on a strap. A step away from the big-headed hero, not toward realism.
- **Beasts are real animals** drawn with accurate proportion in the same line. **Väsen come from Norse myth and folklore** and
  look like the old illustrations: hairy, heavy, old; never cute.
- **Trolls are Bauer's**: boulders with hair, moss and lichen on them, knobbed hands on the ground, long noses, beads and rings.

## 5. The world

- **Open and uncramped**, groves and clearings, wide warm beaches; the ground never square.
- **Backgrounds are tone**: the forest behind the open ground is deep and old, drawn darker and bluer, with faint pattern,
  never clutter.
- **Built things are Viking**: real materials (logs, wattle, turf, thatch, dry stone), drawn with the same ink and grain.
- **Boards and the HUD** are wood and leather in the same palette and line, so the interface belongs to the world.

## 6. How it is built

1. **The renderer** (`src/stylelab.js`, `look: 3`, the "ink" look): the cool shadow crescent, the grain pattern in every fill,
   the lit edge, the thin line all round plus the heavy line fading in on the shadow side, the warm brown-black ink. `STYLE_INK`
   is the preset of the rules above. Props and tiles are baked with it like any other style, so the whole world changes with one
   setting.
2. **Figures** (the hero, the folk, the animals, the troll) get the same treatment in two steps: first a finish pass on the
   drawn figure (grain and a cool shadow side over the silhouette), then the structural two-pass outline so they are whole.
   **Built 2026-10-07:** the depth layers and the dilation outline (`INK_FIG` in `src/art.js`); then, because the leaned old
   figure still looked like the old figure, **a hero drawn from scratch** (`inkHero`: about five and a half heads, a skeleton with
   knee and elbow IK, a tunic, a small head with a few ink marks, jagged hair and beards; three designs, Eirik, Ásta and Hallvard,
   for Robin to pick from) and **two trolls drawn from scratch** (the boulder troll after Bauer, the forest troll after Kittelsen).
   The animals (`animal3D`) still draw their old per-part lines; they are the next family.
3. **The page**: `look-editor.html` draws one scene twice, old and new, with the rules as sliders and "Use in the game".
4. **Then the palette pass** over the game: the night overlay, the cave, the boards, the water and beaches (kept as Robin
   likes them, retuned only for the shadow hue).

## 7. The check

A new thing is right when: it reads as one silhouette at thumbnail size; its line is heavier on the shadow side; its shadow
is cooler than its light; its fill has grain; it sits in the scene's key with no colour burning but the one allowed; and it
would not look out of place on a page of *Nordiska gudar* lit by Bauer.
