# The weather's sounds: candidates (2026-10-23)

**Why.** Colin, AD's weather for home's meadow (his `out/weather/WEATHER.md`; Robin: "Looks great. Yes", 2026-10-23): rain in
two or three strengths, rain on water near the shore, far thunder after each flash, quiet for mist and snow; and the ground
effects: footsteps where prints show (snow, wet sand, mud) and a splash through a puddle. Robin picks by ear in the arena.

**Listen:** `preview.mp3` (75 s): light rain, two takes (0:00, 0:07); rain on the ground (0:13); the storm's heavy rain
(0:20); rain on water (0:26); thunder a (0:33) and b (0:41); footsteps in snow a (0:48), b (0:52), c (0:55); on mud (0:59);
in wet sand (1:03); splashes (1:06); a gust (1:09). The rain is cut at 6 s here; in the game it loops.

| Name | Letter | Made from (all CC0, BigSoundBank, Joseph Sardin) | Measured | Gain |
| --- | --- | --- | --- | --- |
| `rain_light` | a | "Summer rain on terrace" (s1019): two **seamless 16 s loops**, a quiet stretch and a fuller one | steady within 2 to 4 dB a second | 0.147 |
| `rain` | a | "Rain on concrete" (s1289): a seamless 16 s loop, its steadiest stretch | within 3 dB | 0.405 |
| `rain_heavy` | v | the studio's: the other loops laid together, each shifted in time so nothing repeats in step (the "storm" recording's own rain was the quietest of the four, its thunder the point) | within 3 dB | 0.476 |
| `rain_water` | a | "Rain on puddle" (s1290): a seamless 16 s loop | within 1.5 dB | 0.318 |
| `thunder` | a | four broad rolls (s2718, s3115, s3116, s3179) | 7 to 11 s, centred 170 to 320 Hz | 0.236 |
| `thunder` | b | three shorter rolls (s3114, s3180, s3113) | 4 to 8 s | 0.29 |
| `step_snow` | a | footsteps in the snow (s0208): soft, low crunches | 0.34 to 0.39 s, 290 to 480 Hz | 0.158 |
| `step_snow` | b | steps in the snow #3 (s3363): a longer crunch | 0.23 to 0.38 s, 410 to 475 Hz | 0.15 |
| `step_snow` | c | footstep in the snow #2 (s2890): the bright squeak of cold dry snow, shortened | 0.49 to 0.55 s, about 5 kHz | 0.067 |
| `step_mud` | a | steps in the mud (s0495): a wet squelch | 0.35 to 0.39 s | 0.117 |
| `step_wetsand` | v | the studio's: a mud step softened under 3 kHz and cut short, a soft low snow step under 1 kHz for the weight | 0.17 to 0.21 s | 0.139 |
| `splash` | a | small splashes (s1530 to s1533) | 0.16 to 0.54 s | 0.208 |
| `gust` | a | strong wind #1 (s0146), its gusts, faded in and out | about 5 s | 0.124 |

The loops are exactly 16 s, mono: the end was blended into the start over 1 s (`work/decode/weather/loop.js`), so they loop
with no seam; start each at any point, and crossfade the strengths by the weather's own strength over its 12 to 90 s fades.
Gains are levelled by the weighted measure against the old hit (0.417): the beds 8 to 16 dB under a blow, the thunder 4 dB
under (the game lowers it with the delay after the flash), the steps 14 dB under, a splash 10 dB under. The game's ambient
volume and the weather's strength go on top. Gusts only if the game's own wind sounds thin at full strength.

**For Robin's ear:** which rain sounds like rain on a meadow and not on a terrace or a road (the recordings were made on
stone and a puddle; a meadow's rain is softer), whether the snow should crunch low or squeak, the wet sand (made, not
recorded).
