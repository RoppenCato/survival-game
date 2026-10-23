# The bow being shot: candidates (2026-10-23)

**Why.** Robin, 2026-10-23: "We need to have another sound for the bow being shot." The game's `shoot` is the studio's first
(2026-10-15): a synthesized string twang, a slap on the bracer and a whoosh, 180 ms at 1.5 to 1.8 kHz. These are made from
real recordings (all CC0, credits in `sfx/bow/ref/README.md`).

**Listen:** `preview.mp3` (20 s): the game's current shot three times; then `shoot_a` (0:04), `shoot_b` (0:08), `shoot_c`
(0:12), `shoot_v` (0:16), four variations each, all as loud as the current one.

| Name (game: `shoot`) | Made from | Measured | Gain |
| --- | --- | --- | --- |
| `shoot_a` | an English longbow's shot (Still North Media), its four takes | the string's snap: 50 to 380 ms, full in 13 to 18 ms, centred 2.5 to 3.1 kHz | 0.874 |
| `shoot_b` | a Scythian recurve's shot (Still North Media), its four takes | 60 to 80 ms, crisper and brighter (1.8 to 5.4 kHz) | 0.864 |
| `shoot_c` | real shots indoors (USC, the Internet Archive) | 0.45 to 0.64 s, deeper (340 Hz to 1.9 kHz): the bow's body and the string ringing | 0.404 |
| `shoot_v` | the studio's: the longbow's snap, a real string's thrum under it (high-passed at 150 Hz, quiet), the tail of an arrow passing, 40 ms later | 0.24 to 0.31 s, full in 12 to 19 ms, 1.4 to 2.3 kHz | 0.815 |

Every file 48 kHz 16-bit mono, peak -1 dBFS; gains in `bow.json`, levelled by the weighted measure to the current `shoot`
at its game gain (0.473), so a pick changes the sound, not the loudness.

**For Robin's ear:** whether the bare snaps (a, b) are too thin for a game, or exactly the clean "thwip" wanted; whether c's
ring is too long when shooting often.
