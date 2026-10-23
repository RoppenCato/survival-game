# The ships' sounds: candidates (2026-10-23)

**Why.** Clive, GD's ships rework (his `docs/ships-rework.md`, step 15; Robin's decisions of 2026-10-22): the oars' stroke,
the sail filling and flapping, the hull's creak, the keel on sand. Robin picks by ear in the arena, as before.

**Listen:** `preview.mp3` (60 s), all at their gains: one man's oar, slow `oar_a` (0:00) and quick `oar_b` (0:07); a crew,
`oars_v` (0:13); the sail filling, raw `sail_fill_a` (0:19) and the studio's `sail_fill_v` (0:23); the sail flapping,
`sail_flap_a` (0:28) and `sail_flap_b` (0:33); the creak, `creak_a` (0:38), `creak_b` (0:44), `creak_v` (0:48); the keel
on sand, `keel_sand_v` (0:52), and pushing off, `keel_off_v` (0:58).

| Name (game) | Letter | Made from (all CC0) | Measured | Gain |
| --- | --- | --- | --- | --- |
| `oar` | a | single strokes from BigSoundBank's "Rowing slowly" (s1514), cut at the stroke | 1.0 to 1.2 s, the pull swelling over 0.15 to 0.4 s, centred 1.2 to 1.5 kHz | 0.192 |
| `oar` | b | single strokes from "Rowing quickly" (s1513), fuller | 1.1 s, centred 1.0 to 1.1 kHz | 0.196 |
| `oars` | v | five recorded strokes a few ms apart, each a little slower, with the water pushed low under them | 1.1 s, centred 770 to 865 Hz: a deeper massed whump | 0.228 |
| `sail_fill` | a | BigSoundBank's flag snaps (s1787, s1790, s1794, s1788), a little slower | 0.4 to 1.0 s, 470 to 635 Hz | 0.606 |
| `sail_fill` | v | a flag snap slowed to 70 %, the same at 45 % under 400 Hz for the sail's belly, a creak of the yard | 1.4 to 1.6 s, 350 to 445 Hz | 0.46 |
| `sail_flap` | a | luffs from "Flag in the wind #2" (s1633), the longer ones | 0.5 to 0.55 s, 520 to 640 Hz, no hiss: soft enough to repeat every second or two | 0.149 |
| `sail_flap` | b | the shortest luffs | 0.3 to 0.4 s, 320 to 440 Hz | 0.181 |
| `creak` | a | Kenney's creaks (RPG Audio), at half speed: a door's creak made a hull's groan | 0.4 to 1.2 s, 560 Hz to 1.2 kHz | 0.075 |
| `creak` | b | AntumDeluge's tree creak and rubberduck's wood squeak, slowed | 0.4 to 1.2 s, 1.2 to 2.1 kHz | 0.223 |
| `creak` | v | a hull's groan and a rope's strain together, a soft knock | 0.9 to 1.3 s, 800 Hz to 1.1 kHz | 0.075 |
| `keel_sand` | v | built from the studio's own material: the beach waves' break running over sand (lower, its low-pass closing as it slows), a low rumble, a creak, a soft thud as it stops | 0.9 to 1.16 s | 0.283 |
| `keel_off` | v | the same, reversed and shorter: a short grind, a creak, the water taking her | 0.78 s | 0.194 |

**Not used:** BigSoundBank's three "boat" recordings were made on a car ferry (engine and water, no wooden creaks); the
studio chose them from their titles, wrongly. Robin did not take the keel downloads, so `keel_sand` and `keel_off` are the
weakest: nothing in them was recorded as a keel.

Every file 48 kHz 16-bit mono, peak -1 dBFS; gains in `ships.json`, levelled by the weighted measure against the old hit
(0.417): the strokes 8 dB under a blow (they come every stroke), a crew 5 dB under, the sail filling 4 dB under, the
flapping and the creaks 10 to 12 dB under, the keel 3 to 5 dB under. The game's own `v` (size of ship, nearness) comes on top.

**For Robin's ear:** whether one stroke every 1.2 to 1.6 s gets tiring; whether the flap can repeat; whether a door's creak
at half speed reads as a hull; the keel.
