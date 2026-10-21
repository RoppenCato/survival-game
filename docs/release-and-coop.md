# Releasing the game, and playing it with friends

**An assessment, waiting for Robin's word (2026-10-21).** Robin asked: "Let's play with the idea that I would release this game one
day, or that I would want to play it with 2-3 friends. What's the effort of that?" Nothing here is decided; the sizes are mine,
rough, from the code as it stands on this date.

## The three goals at a glance

| Goal | What it takes | Rough size |
| --- | --- | --- |
| Friends each play their own world | The built game online as a private page (an itch.io page with a password, or any static host) | A day or two |
| A release, single-player | The content finished, then the release work below | The content is most of it (months or more); the release work a few weeks |
| Playing together, 2 to 4 players | The engine rebuilt round more than one hero, and every later system kept working for several | A first playable version in a few weeks of focused sessions; months to cover everything; a cost on every feature after |

## Friends each in their own world

The pages already run from a plain folder (`dist/` beside `assets/`), and the sheets load lazily, so the build can be put on a
static host as it is. What to check: the first load over the network (the sheets are about 280 MB on disk, fetched as they are
needed, not all at once), and that each friend's save stays in their own browser (it does: `localStorage`). This is the cheapest
way to get the game in friends' hands, though not together.

## A release, single-player

**Leaving the browser is not needed for it.** Games made with browser technology have shipped on Steam inside a desktop wrapper
(Electron, NW.js or Tauri): CrossCode did, and so did the first Vampire Survivors. Wrapping the game is a few days. The release
work round it:

- **Saves to files on disk.** Today they live in the browser's `localStorage` (about 5 MB in all), and a save of another world
  layout is dropped (`layoutKey()`), which a release can never do: saves need versions and a migration from one to the next.
- **Running on weaker computers.** The sheets, the night canvas and the many drawn layers want testing on other machines, and
  probably a lower-detail setting (fewer grass tufts, no grain, a smaller canvas).
- **The usual options.** Key rebinding, a gamepad (the browser's Gamepad API), resolution and fullscreen, the volumes.
- **A licence check of every asset.** The font is SIL OFL (fine); each free sound pack in `assets/sfx/free/CREDITS.md` needs its
  terms checked for a paid game; the Mixamo clips are rendered into our own sheets, which Mixamo's terms allow in games.
- **The store side.** A Steam page, capsule art, a trailer, the fee, the review.

None of that is hard. **The big cost is the content:** chapters 1 to 4 good enough to sell (`docs/chapters.md`), which is the
work already under way.

## Playing together, 2 to 4 players

**The expensive one, because the game assumes one hero everywhere:**

- **The engine:** `src/combat.js` has one hero (`P`); the beasts know only the hero (a choice of 2026-10-12); the camera follows him.
- **The world's people:** the hird follows *you*, villagers react to *you*, Arnor talks to *you*, a town lets *you* in alone.
- **The interface:** the prompts (`eWhat`), the bag, the crafting boards, the building cursor, the map are one player's.
- **Shared rules:** sleeping skips the night, the player decides when a season turns, a raid's alarm and pursuit follow one hero.

**The usual design for a few friends:** one player hosts the world and runs the simulation; the others send their keys and draw
what the host's game shows them (positions sent ten to twenty times a second and smoothed between). A shared random seed per
step is not enough here (`Math.random` is used everywhere), so the host must be the one truth. Connecting friends across home
routers is what Steam's own networking does for games like Valheim (from a wrapped browser game too); without Steam, WebRTC with a
small server to introduce the players.

**The order it would come in:** two heroes on the starter island, moving, fighting, gathering and building together; then the
night, sleep and saving on the host; then the hird, villages, raids, ships and caves, one at a time.

**The bigger cost is ongoing:** every feature after that has to be built and tested for several players. That is why the choice is
cheaper early: every system finished single-player is one more to rework later.

## My recommendation (mine, 2026-10-21)

Decide whether playing together is **a must or a nice-to-have**.

- **If it might be a must:** the cheap way to a real number is a two-hero trial in the Combat Arena (two players, two windows, one
  machine, the same boar): a few sessions, and it shows how deep the one-hero assumption goes before anything is committed.
- **If it is a nice-to-have:** finish chapter 1 single-player, keep the private online build for friends to try it, and leave
  playing together out of the design.

## The platform question (the same day)

Robin, worried: "you keep saying two things: no, we shouldn't move away from browser; framerate is a problem." The measurements of
2026-10-21 (CLAUDE.md, "Frame time"): everything found slowing the game was our own code (the living grass, 47 to 54 fps; the
autosave's hitch, 120 ms every ten seconds; the beast sheets' memory, halved), and the game's own work is now about 4 ms of the 16 a
frame has at 60 fps. What is left is the browser drawing on the graphics card, which the pane shares with the studios' renders, so
the pane cannot give a clean answer. **The test that settles it:** Robin plays the real game in his own browser for five minutes
with nothing else rendering and puts Admin's frame log in the project folder. A steady 60 fps: the browser is fine. Well under 60
while the game's work stays near 4 ms: the browser's drawing is the limit, and the fix is to draw with WebGL (as most serious 2D
browser games do), still in the browser and keeping the game's code: a few days, not a rewrite. A move to an engine such as Godot
would rewrite everything, and nothing measured asks for it.
