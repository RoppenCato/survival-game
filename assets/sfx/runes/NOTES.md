# The runes' sounds (2026-10-23): candidates

**Why.** Robin's rune rework of 2026-10-23 (Clive, GD's `docs/runes-rework.md`): the storm's offer at the stone altar, the
binding by blood, the cudgel, the active runes in a fight. Clive, GD asked for ten sounds by the names the game calls; they
are silent in the game until they come. Every one is made from recordings (the rule since 2026-10-15), all CC0:
BigSoundBank's stone, drops, bowls, thunder and body falls (`sfx/runes/ref/`, Robin's yes the same day), and the studio's
own (the whip's crack and flesh layers, Kenney's impacts, rubberduck's wood).

**The letters.** **v** is the studio's, layered; **a** is plain, as recorded. Three variations of each, picked at random.

**Robin's picks (2026-10-23, the Combat Arena):** `altar_lay` A, `lightning_small` A, `rune_ready` A. Their v's are in
`out/_archive/sfx-unpicked-2026-10-23/runes/` (after Clive, GD's commit 931a889 dropped them); their gains below are blank for v.
The other seven are not picked yet: v plays until they are.

## The sounds, in the order the game plays them

| Sound | When | Gain v | Gain a |
| --- | --- | --- | --- |
| `cudgel_thud` | The cudgel knocking a beast out (as loud as a hit). | 0.410 | 0.449 |
| `altar_lay` | A beast laid on the altar stone: a sack-like thump, hooves. | archived | 0.233 |
| `storm_rise` | The storm rising over the altar, 3.5 s, once. | 0.247 | 0.173 |
| `rune_carve` | Each stone that rises showing its carving, about 2 s. | 0.127 | 0.110 |
| `lightning_strike` | The bolt on the altar with the white flash: the loudest of the rite. | 0.374 | 0.341 |
| `stone_break` | The stones not chosen crumbling, just after the strike. | 0.322 | 0.414 |
| `blood_drip` | The hero's blood dripping into the carving as a rune is bound (`BIND_T` 1.2 s). | 0.081 | 0.090 |
| `rune_wake` | A rune bound: a low thrum and a short bright tail, about 1.5 s. | 0.128 | 0.087 |
| `rune_ready` | An active rune's blood ring full, by the toolbar, in a fight: noticed, never in the way. | archived | 0.033 |
| `lightning_small` | Thor's wrath: a bolt on a man in a fight, shorter and lighter than the altar's. | archived | 0.277 |

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

- `preview.mp3`: the rite staged with the studio's (v) and Robin's picks, 24 s: the cudgel (0:00), the beast laid (0:02), the storm rising (0:04),
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

## Added 2026-10-24: the rite's last two, and the runes' own

Clive, GD's full list of 2026-10-24 (every one called by the game already; 68 of the 72 runes work). Made the day Robin
turned the audio back on ("Its on. Do the sounds."). Recordings added: BigSoundBank's gasoline fire, two heartbeats, a
breathless man, a foley fire (`sfx/runes/ref/bsb_fire_heart/`, Robin's yes the same day); the medieval part 2 swings and
draws (`sfx/runes/ref/oga_medieval2/`, unpacked from the archive); HaelDB's yells, Independent.nu's wood cracks, USC's
arrow, Kenney's, from the studio's packs. All CC0. Every piece cut at its own sound into `ref/cut/`.

| Sound | When | Seconds v | Gain v | Gain a |
| --- | --- | --- | --- | --- |
| `sacrifice_stab` | the rite: the knife into the beast on the slab | 0.42-0.59 | 0.444 | 0.378 |
| `storm_gather` | the rite: the power gathering before the bolt, once | 2.60-2.60 | 0.194 | 0.173 |
| `war_cry` | the War-cry: the hero's shout | 0.71-0.79 | 0.215 | 0.247 |
| `berserk_roar` | Berserk waking: his roar, lower than the cry | 0.60-0.64 | 0.265 | 0.277 |
| `last_stand` | the Last stand: a heartbeat and a gasp | 0.55-0.56 | 0.259 | 0.274 |
| `riposte` | the Riposte: a flick of steel out of a parry | 0.11-0.14 | 0.337 | 0.444 |
| `guard_break` | the Axe-breaker: a shield guard splitting | 0.34-0.37 | 0.277 | 0.325 |
| `blink_step` | the Blink-step: a soft whip of air | 0.22-0.24 | 0.120 | 0.095 |
| `leap_land` | the Long leap's landing on turf | 0.21-0.21 | 0.167 | 0.154 |
| `lunge` | the Lunge: a step and a heavy swish, at the blow | 0.33-0.34 | 0.156 | 0.163 |
| `whirl` | the Whirl: a two-handed weapon swung full round | 0.55-0.55 | 0.158 | 0.154 |
| `overhead` | the Overhead: a heavy blow from above | 0.36-0.39 | 0.318 | 0.325 |
| `sweep` | the Sweep: a low spear sweep | 0.38-0.40 | 0.169 | 0.159 |
| `twin_shot` | the Twin shot: arrows loosed at once | 0.09-0.10 | 0.585 | 0.606 |
| `pin_shot` | the Pinning shot: an arrow into a man and the earth | 0.27-0.31 | 0.329 | 0.290 |
| `fire_arrow` | the Fire-arrow: the snap and the flame | 0.38-0.44 | 0.657 | 0.620 |
| `rock_split` | the Stone-biter: a rock cracking whole | 0.39-0.43 | 0.405 | 0.378 |
| `fire_burn_man` | a man burning (optional, Clive, GD's extra) | 2.00-2.00 | - | 0.290 |

- `sacrifice_stab`: v: the meat of a blow, a wet splat on the same moment, a dull knock of the stone, a smaller splat at 0.2 s as the knife works in. a: the meat and the splat.
- `storm_gather`: v: thunder played backwards to its crack, the sung bowl's hum, a drone rising a fifth, a thin tone climbing an octave, static thickening. a: the backwards thunder alone. Exactly 2.6 s (the render cut their near-silent start; padded back so the end lands on the bolt).
- `war_cry`: v: a man's yell (HaelDB), a second take of the voice a touch lower 12 ms behind, a short open air. a: the yell plain. The yells open with up to 0.6 s of room: each starts at its voice.
- `berserk_roar`: v: the deepest yells slowed (rate 0.82), a beast's growl under, a little grit; centre 280-810 Hz against the cry's 1 kHz. a: the deep yell slowed.
- `last_stand`: v: one heartbeat (BigSoundBank's), a breath drawn hard on the second beat ("Breathless man"). a: the heartbeat alone.
- `riposte`: v: a seax's and a dagger's draw from just before their ring, a dagger's swish, a light metal ting; attack 4-16 ms, centre 3.8-4.4 kHz. a: the draw alone. Shorter than the 0.25 s asked (0.08-0.14 s): the ring dies fast; for Robin's ear.
- `guard_break`: v: a board splitting (Independent.nu), a heavy knock of wood, a plank's rattle. a: the split alone.
- `blink_step`: v: the sword's swishes faster, softened under 3.5 kHz, a little drawn in backwards first. a: a spear's swish, its rumble off.
- `leap_land`: v: two feet on grass 8 ms apart (Kenney), a body's weight under. a: the two steps.
- `lunge`: v: a step on turf, the sword's swish F slowed, an axe's swing under it. a: swish F slowed.
- `whirl`: v: the sword's E then F run together, a spear's swing under the turn. a: a spear's swing slowed.
- `overhead`: v: a short heavy swish, the crack of a board splitting at 50 ms, a low punch and a knock of wood. a: the crack and the punch.
- `sweep`: v: a spear's swing slowed and low, swish E under it, a brush of grass. a: the spear's swing.
- `twin_shot`: v: three snaps of the recurve (your shot B's recordings) 12 and 26 ms apart. a: two snaps 18 ms apart.
- `pin_shot`: v: USC's arrow striking, an earth thud (Kenney), the shaft quivering (a plank's knock shaken). a: the arrow striking.
- `fire_arrow`: v: the recurve's snap, gasoline catching fire (BigSoundBank) faster, a few crackles. a: the snap and the flame.
- `rock_split`: v: a stone's crack, a deep crack under it, the pick's rock hit, pieces falling. a: two stones together as recorded.
- `fire_burn_man`: a only: BigSoundBank's "Fire, Foley" crackle, two seamless 2 s loops (seam steps 0.4 and 0.2 %FS), quiet (16 dB under a hit).

**Fixed on the way:** the stone pieces (`stone_1` to `5`) open with 45 to 240 ms before their crack, so in `stone_break_v`
the rock hit came first and the crack 50 ms later (a flam; attack 52 to 56 ms). Every stone now starts at its crack:
`stone_break_v` re-rendered (attack 2.4 to 2.7 ms, gain 0.322 to 0.345; Clive, GD: recopy it), and `rock_split` built that way.

**To listen:** `preview.mp3` the rite staged again, now with the stab (0:03) and the gathering (0:10) before the strike (0:13);
`preview_fight.mp3` the runes in a fight, the v of each in a row (the cry, lunge, riposte, guard break, whirl, overhead, sweep,
blink, leap, roar, last stand, ready, Thor's wrath, twin shot, pin shot, fire arrow and the burning, rock split), 19 s;
`preview_<name>.mp3` each alone, v's three then a's three.

**For Robin's ear:** a letter for each. Whether the cry and the roar sound like the hero (one voice, HaelDB's, for both);
whether the breath in the last stand reads as a gasp (it is a man out of breath, drawn in); the riposte's shortness.

## Added 2026-10-24, late: the Slide, and five gains corrected

- `slide` (Robin's new rune the same night, the Slide in the dash slot; the game calls it at the push-off): a body sliding low
  over turf, fast then slowing to a stop. v: the push-off (a grass step), a run of grass brushes that comes fast and spreads
  out as he slows (Kenney's), grit crunching (BigSoundBank's snow, high), a rush of body and air falling in pitch, the sword's
  swish E soft under it; 0.40-0.42 s, attack 3-6 ms. a: the grass brushes alone in the same slowing run; 0.42 s.
  Gains v 0.250, a 0.274: as loud as the dash, measured against `dash_1` at its gain (the dash, measured as the ear does,
  sits 5 dB under the hit; the combat set's own ladder calls it -12, an older measure).
- **Corrected** (the same check): the game's swings sit about 5 dB under the hit as the ear measures them, so the lunge, the
  whirl and the sweep ("a heavier swish than the sword's") were too quiet at -7: now -4 (lunge 0.220 / 0.230, whirl 0.223 /
  0.218, sweep 0.239 / 0.225); the blink-step and the leap's landing now -8, near the dash they belong to (blink 0.189 /
  0.150, leap 0.210 / 0.194). The files did not change, only the gains.

## Added 2026-10-24, the rune trial: the Hammer, the Throwing axe, the traps, the Shadowstep

Robin's rune trial of 2026-10-24 (Clive, GD's `docs/archive/rune-trial-2026-10-24.md`): nine sounds the game calls by name. Robin has
picked the plain recording every time so far (nine of nine), so each sound leads with a plain one, **a** (and **b** where a
second recording is as good), and a layered **v** beside it. New recordings: BigSoundBank's rat traps, a small chain, two steam
hisses and a glass ball breaking (`sfx/runes/ref/bsb_traps/`, Robin's yes the same day); the medieval crossbow's mechanism, on
disk since the bow. Every snap and click starts at its own sound (the crossbow's cuts opened with 30 to 60 ms of silence).

| Sound | When | Seconds a | Gain v | Gain a | Gain b |
| --- | --- | --- | --- | --- | --- |
| `shield_break` | the Hammer: a raised shield shattered under a held blunt blow, at the man struck | 0.34-0.45 | 0.329 | 0.337 | 0.345 |
| `axe_throw` | the Throwing axe leaving the hand, spinning, at the hero | 0.19-0.38 | 0.297 | 0.337 | - |
| `axe_catch` | the Throwing axe caught again, at the hero | 0.03-0.04 | 0.349 | 0.642 | 0.233 |
| `trap_throw` | a small iron trap tossed underhand, where it is | 0.39-0.42 | 0.145 | 0.088 | - |
| `trap_land` | the trap landing on sand or turf with a clink, where it lies | 0.11-0.23 | 0.152 | 0.131 | - |
| `trap_arm` | the trap setting, a soft click, three seconds after it lands | 0.11-0.12 | 0.113 | 0.114 | - |
| `trap_snap` | the Tripper's jaws closing on a foot: iron, short, mean | 0.09-0.10 | 0.528 | 0.487 | 0.781 |
| `trap_poison` | a clay pot of poison breaking with a wet hiss, where it lies | 0.68-0.76 | 0.325 | 0.283 | - |
| `shadowstep` | the Shadowstep: a dash in a puff of smoke, darker than the dash, at the hero | 0.38-0.38 | 0.218 | 0.213 | - |

- `shield_break`: v: a board splitting, the iron rim ringing, the planks rattling, a blunt thump. a: the board splitting alone. b: the split and the rim, two recordings.
- `axe_throw`: v: an axe's swing shaken fast so it flutters, a dagger's swish on top. a: the axe's swing alone (its rumble off).
- `axe_catch`: v: a hand's slap with a small wooden knock and a little weight. a: the slap alone (very short). b: a wooden knock alone.
- `trap_throw`: v: a small chain's jingle, slowed and softened, a soft swish. a: the chain's jingle as recorded (bright).
- `trap_land`: v: a soft thud on turf, the iron's clink, a last jingle. a: the clink alone (Kenney's light metal).
- `trap_arm`: v: a crossbow's catch clicking home with a tiny ring of iron. a: the click alone.
- `trap_snap`: v: a crossbow loosing (a hard iron snap), a rat trap's jaws slowed into iron, the meat of a foot. a: the crossbow's snap alone. b: a rat trap snapping shut (BigSoundBank's).
- `trap_poison`: v: a stone's crack and shards, a glass ball's break slowed and dulled under it, a wet splat, a steam hiss rising. a: the glass ball breaking and the hiss, two recordings. No free recording of a clay pot exists; the stones are the nearest.
- `shadowstep`: v: the sword's swish F slowed and darkened, a breath let out hard through it, a puff of air. a: the breath alone (BigSoundBank's breathless man).

Levels against the hit: the shield break as loud as a hit (0), the snap just under (-2), the poison -4, the throw and the
shadowstep like the dash (-5), the catch and the landing -8, the toss -10, the arming click -14. `preview_trial.mp3` stages
them (the v of each) in the order they would come; `preview_<name>.mp3` each alone, v then a then b.

