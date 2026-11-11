# The winter ice

Robin, 2026-11-10: "the sea freezes and carries you, with danger". Robin, 2026-11-11: "work on the ice mechanic, with cracks etc."
This page says what is built, what every number is, and what waits. **The first rung is built and is in the dev version; Robin has
not walked on it.** Every number is mine, a first setting, in `Ice.DEF` (`src/ice.js`).

## To try it

Escape, Admin, the sky board, Winter. Then walk out onto the sea or a lake. Spring takes it away again.

## What is built

- **The sea, the lakes and the rivers freeze in winter and carry the hero.** Nobody else goes on the ice yet.
- **How thick it is depends on how far the land is.** Thick and white for the first 5 tiles from any shore, thinning to a fifth by
  38 tiles out. Past home water's edge the sea stays open.
- **White veins wind across the thin ice** (pressure ridges, about two tiles wide). They are thick enough to walk on without strain,
  so a strait is crossed by following them. On three seeds the ice joins every island for a calm walker; thick ice alone joins
  one to six of the eleven.
- **Open leads** lie across the far ice: long patches of open water to go round.
- **A lake** is thick at its rim; the middle of a big one is thinner (it creaks under a man standing, holds a man walking). A
  **river** is thin all over.
- **Strain.** Thin ice strains under him and eases off by itself. How fast: standing still (after 1.2 seconds) 1.3, creeping on C
  0.5, walking 1, sprinting 3, with a beast or a log on the shoulder twice that, and a dash's landing a lump at once. Ice cracked
  before is weaker.
- **It creaks three times** as the strain grows, and each time cracks are drawn round him, forked and kinked. Then it gives way.
- **Through the ice:** a hole, shards afloat, the cold takes 8 health once, and he swims (the swim's own stamina rule). What he
  carried is left on the ice by the hole. One word the first time: "The ice gives way".
- **Out again:** swimming onto ice of 0.3 or more he climbs out, and stands on strained ice. Thinner ice breaks before him, a
  moment and 3 stamina a piece, so far out he must break his way back toward thicker ice.
- **Holes and cracks last until morning.** Nothing of the ice is saved.
- **A boat in the ice is frozen in:** no prompt, no boarding. No cast of the rod onto ice.
- **Fish shadows** drift under the clear ice and are hidden by the white.
- **The look:** the sheet is baked in pieces from the same thickness the rules use, so what you see is what holds: white is
  safe, grey-blue is thin, dark is thinner. No lily pads, no ducks or swans, no moon glints on ice; the night's dark water is the
  open water only.

## How long thin ice holds (`node tests/ice.js`)

| Thickness | Standing | Creeping | Walking | Sprinting | Walking with a load |
| --- | --- | --- | --- | --- | --- |
| 0.55 and up | holds | holds | holds | holds | holds |
| 0.45 | 13.6 s | holds | holds | 2.4 s | 4.4 s |
| 0.35 | 3.7 s | holds | 3.9 s | 1.0 s | 1.5 s |
| 0.25 | 2.3 s | 5.3 s | 1.9 s | 0.6 s | 0.8 s |
| 0.15 | 1.7 s | 2.8 s | 1.2 s | 0.4 s | 0.6 s |

## Sounds

Stand-ins from what the game has: `creak` for the first two creaks, `rock_split` for the third, `boxbreak` and `fall` for going
through. Real ones need a reference Robin likes first (the ice's creak, its long crack, the break and the splash).

## Not built, in the order I would take it

1. **Ice fishing** (Robin's): a hole cut with the axe on thick ice, a line through it.
2. **Wolves on the ice**: a pack that follows him out, and breaks through where he would.
3. **The ice's own sounds**, from references.
4. **Tracks**: his footprints on snowed ice, as on the snow.
5. **The thaw**: a day or two in spring when the ice is rotten everywhere.
6. **Bone skates** (the idea bank): fast travel on thick ice.
7. A slide in the step on bare ice, if it reads well. Not started: it must not feel like a punishment.

## Questions for Robin

1. Is the whole of home water one walk in winter right, or should some islands stay out of reach until a later winter?
2. Should a fall through the ice cost more than 8 health and a swim? It is meant as a fright, not a death, unless you are far out.
3. Standing still breaks thin ice faster than walking (your rule). Does that feel right in the hand?
