# The fishing sounds (2026-10-25): candidates

**Why.** Clive, GD's fishing went into the game on 2026-10-24 (his commit f06460b); it borrowed other sounds (the swing, the pick,
the clink, the craft, the fall). His brief: seven names, two or three candidates each, levelled to the hit, Robin to pick by ear.
No reference yet; Robin has picked the plain recording every time (nine of nine runes), so each leads with a plain **a** (and **b**),
with the studio's layered **v** beside it. A Viking draws a hand line: no reel's ratchet (BigSoundBank's modern reels left out).

**Recordings**, all CC0: BigSoundBank's sliding ropes and water stirred by hand (`sfx/fishing/ref/`, Robin's yes 2026-10-24), its
small stones into a pond and the water drops (on disk), the ships' oar strokes, the sword's swish E, the recurve (your bow B),
the flesh set's splats and slaps. Made the day Robin turned the audio back on ("Audio is back on").

| Sound | When | Seconds a | Gain v | Gain a | Gain b |
| --- | --- | --- | --- | --- | --- |
| `fish_cast` | the cast | 0.29-0.31 | 0.218 | 0.225 | 0.150 |
| `fish_plop` | the cork float landing on calm water | 0.38-0.45 | 0.108 | 0.196 | 0.104 |
| `fish_bite` | a bite: the float bobbing under | 0.26-0.32 | 0.137 | 0.140 | 0.205 |
| `fish_reel` | the line drawn in by hand while E is held: a seamless 2 s loop | 2.00-2.00 | 0.077 | 0.077 | 0.093 |
| `fish_splash` | the fish breaking the surface: the hook going in, a run, a fish darting off | 0.59-0.62 | 0.391 | 0.391 | 0.300 |
| `fish_snap` | the line snapping | 0.06-0.08 | 0.481 | 0.498 | - |
| `fish_land` | a wet fish landing and flapping | 0.44-0.45 | 0.165 | 0.156 | - |

- `fish_cast`: a: the sword's swish E, quicker, as a rod's whip. b: a rope slipping, the line hissing out. v: the whip, then the line running out after it, faster and lighter.
- `fish_plop`: a: a small stone into a pond. b: a drop of water slowed into a round plop. v: the slowed drop with the pond's splash soft under it.
- `fish_bite`: a: a drop of water as recorded, sharp. b: the sharpest pond splash, quick. v: the drop with a tiny tug of the line.
- `fish_reel`: a: three hand-over-hand pulls of a rope (BigSoundBank's sliding rope) laid round a 2 s ring. b: water stirred by hand alone (two loops). v: the pulls over the stirred water. Mixed on a ring, so the end runs into the start (the step across the seam 0 to 0.4 %FS); exactly 96,000 frames.
- `fish_splash`: a: a different pond splash each time, a little lower. b: an oar dipped and pulled, from just before its splash. v: a splash, an oar's swirl for the body, drops falling back. The three variations differ on purpose (three moments).
- `fish_snap`: a: the recurve's string loosing (your bow B), very short. v: the string higher and thinner, a little whip, the slack line slipping away.
- `fish_land`: a: a wet splat. v: the splat, then the tail slapping four times, quick and weaker.

**Levels** against the hit (hearing-weighted): the splash and the snap -4, the cast and the landing -6, the plop and the
bite -10, the reel loop -14 (it plays for seconds at a time). Every file peaks at -1 dBFS; the gains are in `fishing.json`.

**For the game (Clive, GD):** copy the folder whole; `<name>_<letter>_1..3`; a the default until Robin picks. `fish_reel` is a
loop: play one file looped (all are exactly 2.000 s).

**To listen:** `preview.mp3` a catch staged with the studio's v (the cast, the float, two bites, the hook, the reel, a run,
the reel, the fish landed; a second cast that snaps); `preview_<name>.mp3` each alone, v then a then b.
