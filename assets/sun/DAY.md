# The sun and the moon (Colin, AD, 2026-10-23)

**Robin said yes on 2026-10-23 ("Looks amazing"), to the day as shown on the page, the three-minute dawn included. It is for Clive, GD to build.**

Robin: "Is there any good way we could have a beautiful sunrise/sunset? Its so magical in Valheim but im not sure how it would work
in a 2D game." And: "It feels like its saying 'oh now its night' and then nothing happens for a long time ... you dont really feel the
sun going down or up."

**Watch it:** https://claude.ai/artifact/NxCJJ4S9SnTfkV3r5DTNKE. Drag through the day or press play (a day in 30 s), and switch to
"The game today" to compare. Stills: `pictures/day_board.png` (ten moments) and `pictures/today_vs_proposal.png`.

## Why today's day falls flat

- **The shadows never move.** One short shadow to the lower right, all day.
- **Dusk is one flat amber tint over everything.** At its middle, with the dark coming in, it turns the beach orange-brown.
- **The night does not change.** Nothing moves from the message until the dawn.
- **The dawn is one minute** (29:00 to 30:00), so the sunrise is never seen.

## What the proposal does

From above you never see the sky, so the sun is shown by what it does, and it does something all day.

1. **The shadows swing and stretch with the sun.** Long to the west at sunrise, short and down at noon, long to the east through
   the afternoon, longest at sunset. The time of day can be read from them. At night, faint ones lie away from the moon.
2. **The light runs across the screen from the sun's side.** Fresh in the morning, plain at noon, warm in the afternoon, gold at
   the golden hour, orange to rose at sunset, violet in the blue hour. The far side is always a little cooler.
3. **Lit edges.** While the sun is low, every tree, stone and figure takes a warm edge on its sun side.
4. **The sky in the water.** The sea and the ponds take the sky's colours: gold, pink, violet, deep blue. A glittering path of sun
   lies on the water, of moon at night, with stars in the water when the moon is down.
5. **Shafts of light** slant through at the golden hour and at sunrise.
6. **The night moves.** The moon rises in the east around 21:00, is high at 23:30 and sets in the west around 26:00. Its silver path
   walks over the water, and the night is a little lighter and bluer under it.

## The clock

The only change proposed: **dawn three minutes instead of one** (DAWN_AT 1620 instead of 1740), so the sunrise can be seen. Night
becomes 20:00 to 27:00.

| Minutes into the day | What you see |
| --- | --- |
| 0 to 4 | Morning: the sun climbing from the east, shadows shortening |
| 4 to 10 | Day: short shadows swinging from left to right, plain light warming after noon |
| 12 to 14 | Golden hour: the meadow gilded, long shadows, lit edges, shafts of light |
| 14 to 17 | Sunset: orange to rose, the water pink, the longest shadows ("The light is going" could be said here) |
| 17 to 20 | Blue hour: violet into the night palette; the fires begin to matter |
| 20 to 27 | Night: the moon rising, high at 23:30, setting; stars in the water when it is down |
| 27 to 30 | Dawn and sunrise: pink to gold, the shadows long to the west |

## For Clive, GD: how the game would do it

`sun.js` is the reference.
- `Sun.state(t)` gives every number for a time of day, blended between keyframes (`Sun.KEYS`):
  - where the sun is across the screen
  - the light's colours on the near and far side, and its glow
  - the shadow's colour, strength, length and angle
  - the lit edge's strength
  - the water's three sky colours
  - the sun's path
  - the shafts
  - the dark, and the moon
- `Sun.draw` shows the passes in order on the page's layers. In the game:
  - **Shadows (changed 2026-10-23, Robin: "The shadows all look the same"):** each thing casts its own silhouette, not a disc.
    - Keep a black copy of each picture at a quarter of its size (`Sun.silhouette`). Drawn up again it is soft at the edge.
    - Lay it flat from the thing's foot with one transform: its height runs along the shadow and its width across it. With
      k = 0.5 · len, ang = `Sun.shadowAngle(sx)`, px = sin ang, py = −0.75 cos ang:
      setTransform(px, py, −k cos ang, −k sin ang, fx − px·fx + k cos ang·fy, fy − py·fx + k sin ang·fy), then
      drawImage(sil, x, y, w, h) at the picture's drawn place.
    - Draw all of them into one shadow layer, tint it once with the state's colour (source-in), and lay it on at the state's
      strength, after the ground and before the standing things. Where two shadows cross they do not darken twice.
    - This replaces castShadow's disc in the day; the night's fire shadows stay yours.
  - **Lit edges:** `Sun.rimPicture(d, w, h, side, col, 1)` makes two copies of a picture, lit from the left and from the right. They
    are made once and laid over the picture at `state.rimK` on the sun's side. Make them lazily for what is on screen in the evening
    and morning, and drop them at midday and night.
  - **Light across the screen:** two gradient fills, one warm soft-light and one radial glow, in place of today's flat dusk tint.
    Your night palette and the fires' light stay, laid on after.
  - **The sky in the water:** a gradient kept to the water ('color', then 'soft-light'), and the glitter path as screen dashes on
    the water. Your night's water pass already knows where the water is.
  - **Shafts:** five soft gradient bands, 'screen'.
  - **The moon:** its place `state.moonX` and strength `state.moon`. Its path is the same glitter in silver. (The game's moon switch
    is off today.)
- **Cost:** about ten full-screen fills a frame, the glitter, and the lit copies of what is on screen. Make the lit copies when the
  evening begins.
- Robin said yes to all of it, the dawn's length included (2026-10-23).

## What else could come

- Mist at dawn lit pink (the weather's morning mist, coloured by the sunrise).
- Birds going over at dusk.
- The dawn chorus and the evening's quiet, for Derek, SD.
- Smoke from the fires catching the last light.
- Windows lighting up one by one in the blue hour.

— Colin, AD

## After the game's first pictures (2026-10-23)

Clive, GD put the day in the game. From his pictures, in sun.js (copy `Sun.KEYS` and the shadow pass):

- **Shadows at half size, straight from the pictures.**
  - The shadow layer is half the screen's size. Each picture is drawn into it with the same transform, scaled by a half, and the
    tint makes it a shadow. That is crisper than the quarter copies (the oak's shadow was a blob), and it needs no copies.
  - The hero's, the people's and the beasts' current frames can be drawn into the same layer for their sun shadows: one more draw each,
    and no creature copies.
- **Long, low things keep their length.** A thing's width runs across the shadow if it is round, and along the screen if it is long
  and low (a boat, a cart, a log). Between the two it goes by how much wider than tall its picture is: m = clamp((w / h − 1.1) / 0.7).
- **A calmer sky in the water.** The middle colours are gentler and the strength lower; a whole sea across the middle of the screen
  went hot pink.
- **Gold, not lime, at the golden hour.** The warm wash is more orange and lighter.
- **The water's mask needs a soft edge.** A blocky mask showed as a hard pink rectangle by the boat. Feather the mask a few pixels at
  the shore.

Pictures: `pictures/after_game_round.png` (golden hour and sunset on a sea view and the woods).

