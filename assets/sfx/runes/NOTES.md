# The runes' sounds (2026-10-23): candidates

**Why.** Robin's rune rework of 2026-10-23 (Clive, GD's `docs/runes-rework.md`): the storm's offer at the stone altar, the
binding by blood, the cudgel, the active runes in a fight. Clive, GD asked for ten sounds by the names the game calls; they
are silent in the game until they come. Every one is made from recordings (the rule since 2026-10-15), all CC0:
BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, Robin's yes the same day), and the studio's
own (the whip's crack and flesh layers, Kenney's impacts, rubberduck's wood).

**The letters.** **v** is the studio's, layered; **a** is plain, as recorded. Three variations of each, picked at random.

## The sounds, in the order the game plays them

| Sound | When | Gain v | Gain a |
| --- | --- | --- | --- |
| `cudgel_thud` | The cudgel knocking a beast out (as loud as a hit). | 0.410 | 0.449 |
| `altar_lay` | A beast laid on the altar stone: a sack-like thump, hooves. | 0.233 | 0.233 |
| `storm_rise` | The storm rising over the altar, 3.5 s, once. | 0.247 | 0.173 |
| `rune_carve` | Each stone that rises showing its carving, about 2 s. | 0.127 | 0.110 |
| `lightning_strike` | The bolt on the altar with the white flash: the loudest of the rite. | 0.374 | 0.341 |
| `stone_break` | The stones not chosen crumbling, just after the strike. | 0.322 | 0.414 |
| `blood_drip` | The hero's blood dripping into the carving as a rune is bound (`BIND_T` 1.2 s). | 0.081 | 0.090 |
| `rune_wake` | A rune bound: a low thrum and a short bright tail, about 1.5 s. | 0.128 | 0.087 |
| `rune_ready` | An active rune's blood ring full, by the toolbar, in a fight: noticed, never in the way. | 0.068 | 0.033 |
| `lightning_small` | Thor's wrath: a bolt on a man in a fight, shorter and lighter than the altar's. | 0.223 | 0.277 |

The gains are in `runes.json` (levelled by hearing-weighted loudness against the sword's hit, `sfx/runes/_levels.json`):
the strike the loudest (as a hit), the cudgel as a hit, the break and Thor's wrath just under, the storm, the beast laid
and the bound rune in the middle, the carving and the blood quiet, the ready cue 16 dB under a hit. Every file peaks at -1 dBFS.

## How each is made, and measured

- `cudgel_thud`: **v** a dry wooden knock (rubberduck), the meat of a blow and a low punch (qubodup's, from the flesh set), a soft heavy impact under them (Kenney's); 0.18 s, attack 6 to 9 ms. **a** Kenney's heavy punch, a little slower: rounder and lower (117 to 137 Hz), 0.3 s.
- `altar_lay`: **v** BigSoundBank's body fall, started 30 ms before its thump (two of the falls' thumps came 0.19 and 0.28 s into the file), and two small knocks of hooves on the stone after it (0.18 and 0.33 s). **a** the body fall alone. 0.44 to 0.8 s, attack 4 to 44 ms.
- `storm_rise`: **v** stone grinding on stone (a tombstone sliding open) slowed, a low drone rising a fifth through a filter that opens, and a breath of noise rising (the wind coming up); it swells for 1.1 to 1.5 s and ends on the turn. **a** the stone grinding alone, faded in and out (a_3 is 2.5 s, the shorter recording).
- `rune_carve`: **v** three blade strokes on stone (BigSoundBank's knife and sickle on a stone) under 6.6 kHz, 0.6 s apart, over the hum of a sung bowl, low and quiet; 1.9 s, centre 1.7 to 2.1 kHz. **a** the three strokes alone, 0.45 s apart, brighter (4.7 to 5 kHz), 1.2 to 1.3 s.
- `lightning_strike`: **v** a sharp crack in front (the whip's crack and a hiss of noise), a deep boom (Kenney's soft heavy impact, slowed), and BigSoundBank's thunder rolling off behind; the crack is the loudest moment (attack 2 ms on two of the three, 22 ms on the first), 2.2 to 2.3 s. **a** the thunder as recorded: deep and rolling, no crack in front (attack 44 to 300 ms).
- `stone_break`: **v** two shatters a quarter of a second apart (three stone clicks in 50 ms, a rock hit, a light thump each), then a little debris; 1.1 s, centre about 950 Hz. **a** BigSoundBank's fall of stone as recorded, two pieces each: sharper and drier (attack under 1 ms, centre 1.3 to 1.5 kHz).
- `blood_drip`: **v** three drops of water played slower so they are thicker and darker (centre about 800 to 950 Hz), each further apart and quieter: blood, not water; 1.05 s. **a** the drops at their own pitch (1.1 to 1.3 kHz), 0.4 s apart.
- `rune_wake`: **v** the sung bowl's thrum, low, swelling, with a hum pulsing under it (the carving filling), then a struck bowl ringing out bright from 0.3 s (the rune awake); 1.4 s. **a** a struck bowl alone, cut to 1.5 s: bright from the first moment.
- `rune_ready`: **v** a heartbeat, low and short (lub-dub), with a tiny bowl chime on the second beat; 0.6 s. **a** the chime alone, higher (1.8 to 3.2 kHz), 0.6 s. Both are the quietest of the set on purpose (16 dB under a hit).
- `lightning_small`: **v** the whip's crack and a hiss in front, a short thunder crack under it with its lows taken off; 0.6 s, attack 1 to 8 ms, centre 1.7 to 2.6 kHz. **a** the short thunder crack as recorded: deeper (141 to 252 Hz), no crack in front.

## To listen

- `preview.mp3`: the rite staged with the studio's (v), 24 s: the cudgel (0:00), the beast laid (0:02), the storm rising (0:04),
  three stones showing their carvings (0:05), the strike (0:11) and two stones crumbling, the binding: the blood (0:16) and the
  rune waking (0:17), then a fight: a rune ready (0:20), Thor's wrath twice (0:22).
- `preview_<name>.mp3`: each sound alone, v's three then a's three, at the game's level (so `rune_ready` and `blood_drip` are quiet
  on purpose). Where a starts: cudgel_thud 0:03, altar_lay 0:05, storm_rise 0:14, rune_carve 0:09, lightning_strike 0:10, stone_break 0:06, blood_drip 0:06, rune_wake 0:07, rune_ready 0:05, lightning_small 0:05.

## For the game (Clive, GD)

Copy the folder whole. Each sound's files are `<name>_<letter>_1.wav` to `_3.wav`, its gain in `runes.json`; until Robin picks,
v is the default. `storm_rise` is one 3.5 s piece played once at the start of the rite; `rune_carve` once per stone as it shows
its carving (a little apart if several rise together); `stone_break` once at the strike + 0.3 s however many stones crumble;
`blood_drip` at Bind (its 1.2 s), `rune_wake` when the binding ends.

## For Robin's ear

- The letter for each. I cannot hear: the measures say the v's lead with what the brief asks (the strike's crack, the thrum
  then the bright tail, the heartbeat); whether they feel right at the altar is yours.
- **A suggestion:** the game says the stones not chosen "crumble and sink back into the blood". `stone_break` breaks them;
  if you would rather hear them sink, a crumble with a wet sound under it can be made.
