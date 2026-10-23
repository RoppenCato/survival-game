# The weather of home's meadow: a proposal (Colin, AD, 2026-10-23)

Robin said yes to the last step of the seasons plan (`docs/seasons.md`, step 5): spring showers; autumn rain, storms and morning
mist; winter snowfall. This is the look and the numbers. Drawing it in the game is Clive, GD's code, and the sounds are
Derek, SD's.

**Robin said yes on 2026-10-23 ("Looks great. Yes"), to all of it as written here:**
- the eight weathers and the year's shares
- the storm kept at 89 per cent of daylight
- the blizzard's white-out
- summer clear, with a rare shower and morning mist
- the ground effects
- the footprint rule

- **Watch it move:** the preview page, https://claude.ai/artifact/XQibyUHzshgdNJKHqQ8UTv. It runs the weather live over the four
  season boards you picked. Pick a season and a weather, move the wind, or press "Play a day" to roll a day and run its daylight in
  half a minute.
- **Stills:** `pictures/weather_board.png`, all eight together, and each one at full size in `pictures/`.

## The rules it keeps

1. **The weather changes nothing in the world.** It is paint over the frame, after the world and the season's light, before the
   HUD and under the night palette. There is no wet state and no cold damage, as the game's design rules say.
2. **By day stays lush and bright.** Rain is pale silver streaks, never dark ones. The darkest storm keeps the day at about
   89 per cent of its light; plain rain keeps about 94.
3. **The wind ties it together.** Each weather asks the game's wind for a strength. The sea already follows that wind, so a storm
   whitens the sea with no new code.
4. **Mist is Bauer's.** It lies low: on the water, on the shore and in hollows, thinning to nothing up the slopes. It comes at
   dawn and burns off by mid-morning.

## The weathers

Counts are for a 1920 by 1080 screen; scale them by area. "Comes and goes" is how long it takes to fade in and to fade out.

| Weather | Season | What you see | Wind asked | Comes and goes | Daylight kept |
| --- | --- | --- | --- | --- | --- |
| Shower | spring (summer, rarely) | 280 thin streaks, 16 to 28 px, pale at 36 to 56 %; 18 splashes a second on land, 6 rings a second on water | 0.2 to 0.45 | 12 s, 18 s | 98 % |
| Morning mist | autumn, spring | 12 banks 320 to 720 px wide on the world, by how low and wet the ground is; a light haze up the screen | 0.03 to 0.12 | 40 s, 90 s | brighter, not darker |
| Rain | autumn (spring) | 520 streaks 20 to 32 px at a slant; 55 splashes and 20 rings a second; 10 leaves blowing; colours a little greyer | 0.45 to 0.7 | 20 s, 30 s | 94 % |
| Storm | autumn | 900 streaks 30 to 50 px, driven hard; 110 splashes and 40 rings a second; 36 leaves torn across; two far flashes every 18 to 45 s | 0.85 to 1.0 | 25 s, 35 s | 89 % |
| Overcast | autumn, winter | no rain: a cooler, softer light; before and after rain and storms | 0.3 to 0.6 | 40 s, 60 s | 97 % |
| Snowfall | winter | 520 flakes in three depths, drifting and swaying; a faint haze far off | 0.1 to 0.35 | 20 s, 30 s | 100 % |
| Heavy snow | winter | 1150 flakes; a white haze, 20 % at the top of the screen | 0.25 to 0.5 | 25 s, 30 s | 98 % |
| Blizzard | winter, rare | 1700 flakes driven into streaks; a white-out of 44 % over the far half | 0.85 to 1.0 | 20 s, 30 s | 97 % |

The details are in `weather.js`: one table, `KINDS`, and the drawing.

## The year

The day's weather is rolled at dawn. The game's day is 30 minutes, so these spells are minutes long.

| Season | Days |
| --- | --- |
| Spring | clear 50 %, showers 38 % (one to three, each about a minute), morning mist 12 % |
| Summer | clear 85 %, a shower 10 %, morning mist 5 % |
| Autumn | clear 22 %, overcast 13 %, rain 30 % (one spell of 2½ to 5 minutes), storm 10 % (2 to 4 minutes, with rain before and after), morning mist 25 % |
| Winter | clear frost 45 %, snowfall 35 % (3 to 7 minutes), heavy snow 15 %, blizzard 5 % (1 to 2 minutes, heavy snow either side) |

After a day of rain or storm, mist lies at dawn on half the mornings. `Weather.day(season, n, seed)` gives a day's spells.

## How the game would draw it (for Clive, GD)

- Read `weather.js` top to bottom. Each spell is a small state:
  - `Weather.make(kind, seed)` creates it.
  - `Weather.tick(S, dt, env)` moves it.
  - `Weather.draw(ctx, S, env)` paints it.
  - `S.target` set to 1 or 0 fades it in or out.
  - Several spells can run at once (overcast under rain), drawn in the order overcast, mist, shower, rain, storm, snow, heavy
    snow, blizzard.
- **The rain and the snow live on the screen.** They shift with the camera by depth, so walking does not drag the rain along.
  They are drawn as three strokes a frame, not one path per drop.
- **The mist banks are world points.** They stay put as you walk and drift with the wind. `env.low(x, y)` is 1 on water and the
  shore and falls up the slopes; the mock uses `1 - elevAt / 2.5`.
- **Rings and splashes** take `env.water(sx, sy)` on screen points. The sea's own patches already know where the water is.
- **The storm's flash** is a 'screen' fill: 0.4 for 70 ms, dark for 60 ms, then 0.25 for 90 ms. No bolt is drawn, since we look
  down.
- **At night** the streaks and flakes show at half strength, under the night palette.
- **Cost.** The mock draws a full storm in a few milliseconds in Node. The mist is 24 soft images a frame.

## The ground (added 2026-10-23, after Robin asked: "Are there any effects that can be done on the ground with the weather? And also like footsteps in snow etc.")

The preview page now has the hero walking a loop, and the ground answers the weather and his feet. Stills are in `ground/`
(`ground_board.png`).

| Effect | When | How it looks | Numbers |
| --- | --- | --- | --- |
| Footprints | only where the ground holds them: snow, wet sand at the water, a path gone to mud | snow: blue-grey dents with a lit wall; wet sand: heel and toe; mud: dark prints | a short trail, at most 36 a walker; snow 45 s (fills four times faster in snowfall), wet sand 20 s, mud 40 s; none on grass or dry sand |
| Wet ground | rain, storm, shower | the ground darkens as it soaks | wets through in about half a minute, dries over two to three minutes; multiply 24 % |
| Puddles | wet ground | water standing in the path, with a pale streak of sky; rain rings in them; he splashes through | grow from a quarter wet; 14 to 32 px |
| Frozen puddles | winter | pale ice with a glint where the puddles were | always there in winter |
| Fresh snow | snowfall | the ground whitens and old prints fill | builds over a minute, fades over four |
| Snow streaming | winter, wind over 0.4 | low wisps of snow sliding along the ground downwind | up to 28 a screen, 60 to 170 px long |
| Leaves skittering | autumn, wind over 0.35 | fallen leaves hopping along the ground in gusts | up to 14 a screen |
| Frost at dawn | spring and autumn mornings | a pale rime over the ground that melts | could come with the morning mist; melts in a few minutes |
| Breath | winter, frost | a small pale puff from his mouth every 2.2 s, drifting downwind | |
| Kicked snow | each step in snow | a few white specks | |

**Added the same day, after Robin asked "Did you do any effects of the rain or snow on the ground? Like droplets hitting the ground,
things getting wet":**

| Effect | When | How it looks | How the game would do it |
| --- | --- | --- | --- |
| Crowns where drops land | rain, storm, shower | a small bright cup and two drops thrown up, for a seventh of a second | in the spell's draw (`splash` in `KINDS`) |
| Things getting wet | as the ground soaks | stones, logs, tents, roofs and trees darker and a little richer, the sky caught along their upper edges, a glint here and there | `Weather.wetPicture(d, w, h)` grades a picture once when the rain begins; draw the wet copy over the dry one at the ground's wetness, and drop the wet copies when it is dry |
| Drips after rain | while the trees are wet, most in the minute after the rain stops | drops falling from the crowns, a ring where each lands | `G.drips`: each tree's crown on the screen (`{ x0, x1, top, foot }`), from your trees |
| Snow building on things | while it snows | more snow on the pines' tiers, the twigs and the stones, the ground whiter; it settles back after | `Seasons.deepen(d, w, h, kind)` on the winter copy, drawn over it at the fresh snow's strength (at most 80 %) |

Pictures: `ground/wet_board.png` (the rain, after the rain, heavy snow). `env.wetBoards` tells `Weather.ground.draw` that you lay your
own wet and snowed pictures, so it skips its own flat fills.

**In the game (for Clive, GD):**
- `Weather.ground` is the reference:
  - `make` creates the state.
  - `tick` takes the weather's strength and the season.
  - `step` is called at each footfall, with the foot's ground point and heading.
  - `breath` makes a puff.
  - `draw` takes 'under' (before the figures) or 'over' (after them).
- **Footprints without bloat (Robin, 2026-10-23: "It should make sense but not be too much bloat"):**
  - Only where real ground holds a print: snow, wet sand along the water, and a path gone to mud after rain. Grass springs back,
    dry sand runs in, and a floor or stone takes nothing.
  - Only a short trail: at most 36 prints a walker, fading in 20 to 45 s. It is never a record of everywhere he has been.
  - Who: the hero always. Beasts in snow only, because a wolf's or a deer's line of tracks tells you something passed, and could
    lead a hunter. People never; their ground is the trodden paths already.
- The game knows its ground's kind (snow, sand, grass, paths), so `env.kind` is yours. The page guesses it from a mask.
- In the page the wet and the frost darken and pale everything on land, trees too, because the board is one flat picture. In the game
  they belong on the ground pass, under the standing things.
- Frost would look best as the living grass's colours paled (as `grassInk` does for the seasons), with the pale rime under it.
- Puddles belong in the game's own low places and paths. The page puts them along the hero's loop.
- Cost: prints are a few hundred small ellipses at most; the rest is a handful of fills.

## Sounds (for Derek, SD)

Rain on leaves and on the ground, a lighter patter for a shower, rain on water near the shore. Thunder far off, 1.5 to 5 s after
each flash. The wind rising with the storm and the blizzard, and the hush of snow. The game's idea bank already lists rain on
leaves, rain on thatch from inside, and far thunder.

Derek, SD's plan, for when you say yes:
- **Rain:** seamless beds in two or three strengths (patter, steady, driven), crossfaded by the weather's own strength. Rain on
  water is a separate bed near the shore, as the sea is now.
- **Thunder:** three or four far rolls as single events. The longer the delay after the flash, the quieter, lower and longer.
- **Wind:** the game already synthesizes it from wind.s, so the storm and the blizzard ride on it.
- **Mist, snow and overcast:** mostly the birds and insects falling quiet, with a faint hush in the snow.
- **Sources:** CC0 recordings. He lists them for your yes before downloading anything.

## Decided (Robin, 2026-10-23: "Looks great. Yes")

1. Weather is wanted, as often as the year table says.
2. A storm keeps the day at 89 per cent of its light.
3. The blizzard's white-out stays.
4. Summer is mostly clear, with a rare shower and morning mist.
5. The ground effects, with the footprint rule.

## What is here

- `weather.js`: the reference, the numbers and the drawing, for the browser or Node.
- `pictures/`: each weather frozen over its season board, and `weather_board.png`.
- `page/`: the preview page (`template.html` plus `weather.js` makes `index.html`).
- `tools/mock.js` paints the stills from the season boards in `work/seasons/final_seasonal`. `tools/page_assets.js` makes the
  page's pictures and its mask.

— Colin, AD
