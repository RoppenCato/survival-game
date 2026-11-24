# The blót's people: clips, hand things, Hallveig, and the scene (Colin, AD, 2026-11-24)

For Clive, GD: Robin's ask 1, second drop. The first was the set pieces (`out\blot_pieces`).

`blot_moments.png` shows three moments of the rite at the game's size, put together from these sheets:
- Hallveig carrying the torch sunwise;
- the folk bowing as she sprinkles them;
- the horns raised for a full.

`clips.png` shows each new clip on Hallveig and on a villager, in four facings.

## 1. The people's set: `people\`

Copy `out\blot_people\people\*` over `assets\sprites\people\`. That is the game's set with additions only: no sheet it had is changed, and `people.json` is yours with new keys.

### Six new clips, every worn layer

Each clip has the 18 worn layers, like kneel: body, legs, tunic, apron, the beards, cap, cloak, dress, the hairs, helm, hood, kerchief, mail, strawHat, eadric. It also has `hallveig` and its hand things.

| clip | frames | what it is | used in the blót |
|---|---|---|---|
| `raise` | 12 | the right hand lifted up beside the head, held, lowered: a toast, the ring shown, a hail | the ring (with `oathRing`), the horn hallowed, the two fulls (with `horn`) |
| `bow` | 10 | head and shoulders bowed, the hands falling in front, held, up again | the folk as she reddens them |
| `pour` | 10 | the right arm out in front, the forearm turned so the horn tips to the ground, held, back | the memory (with `horn`) |
| `sprinkle` | 12 | the bowl at the belly in the left hand, the right dips and flicks out, twice; a loop | the altar, the posts, the people (with `twigs` and `hlautBowl`) |
| `drink` | 16 | the horn lifted to the mouth in the left hand, the head tipped back, lowered | folk at the feast, if you want them to drink (with `horn`) |
| `walk_torch` | 12 | the walk with the right hand holding a torch up high | the hallowing walk (with `torch`) |

- `walk_torch` has the walk's `stride` and `fps`. Draw it as you draw the walk, picking the frame by distance.
- Each clip has its `hands` marks, like the others.
- The weapons and tools are not rendered on these six. Hide them during the rite.

### Five hand things, each its own layer

| layer | on | where |
|---|---|---|
| `torch` | `walk_torch` | a pine torch with its flame, right hand |
| `horn` | `raise`, `pour` (right hand), `drink` (left hand) | a drinking horn with a silver rim; the same layer name in either hand |
| `oathRing` | `raise` | the gold arm ring, right hand |
| `twigs` | `sprinkle` | a birch bundle with its leaves, right hand |
| `hlautBowl` | `sprinkle` | the blood bowl, level in the left hand, the blood showing |

Draw a hand thing over everything else, as the last layer, and only during its clip.

### Hallveig: layer `hallveig`, on every clip of the set

The village's gyðja, old, short with words, certain. It is one layer, baked over the body and the legs, as Eadric's is:
- the apron dress in deep blue with an ochre tablet band at the hem, and the underdress's linen sleeves;
- a cloak of dark undyed wool with a fur collar, hung from the shoulders and going with the hips, so it falls when she bows;
- a linen head cloth over a long grey braid, with grey at her temples;
- two oval brooches with a string of amber, blue and red glass beads between;
- the keys of the house at her left hip.

**Her look:** `body`, `legs` and `hallveig`. Tint the legs dark, or not at all: the dress hides them nearly all.

## 2. The player: `src\cutscene.js`

Copy it over yours. The only change is that `play` takes `with`: a hand layer, or a list of them, shown while the clip plays.

On your side, `handle.clip(name, hold, with)` is called with that third argument:
- keep it on the actor (`m.csWith`);
- draw those layers over the figure while `m.csClip` runs;
- clear it with `clip(null)`.

The player's tests still pass, and a play step's `with` reaches the handle as given (checked).

## 3. The scene: `scenes\blot.json`

This is your `assets\cutscene\scenes\blot.json`, with Alistair's words and your timings as they were. Only the stand-ins are swapped:
- **The hallowing:** Hallveig walks the torch sunwise: `walk_torch` held, with `torch`, during her walk, as the folk's `carry_walk` is.
- **The ring:** `raise` with `oathRing`.
- **The altar sprinkled, and the four reddenings:** `sprinkle` with `twigs` and `hlautBowl`. The folk `bow` as she passes; the stand-in was kneel.
- **The hero reddened last:** she sprinkles him. He keeps his own clip, because the kit has no bow.
- **The horn hallowed:** `raise` with `horn`.
- **The fulls:** the folk on their feet with `raise` and `horn`, then a new step sits them on their benches again.
- **The memory:** `pour` with `horn`.
- **The kettle and the folk's things:**
  - `blotKettle` now has its pieces: swap `kettle_great` for `kettle_great_meat` and turn on the steam.
  - A new call, `blotBring` (no wait), after the folk set their things down: the ale tub, bucket and basket by the kettle. Your end list leaves them there.

It is 63 steps, and `CutScene.check` finds nothing.

**Not swapped:**
- The beastman's kneel to catch the blood: kneel has no bowl.
- The thunder's kneel.
- The hero's drink.

## What it costs

The new sheets come to 15.5 MB on disk and about 210 MB decoded if every layer of every new clip were loaded. Your clips load lazily per layer, so only what is worn and played counts:
- **A villager at the rite:** about 5 layers on 3 or 4 of the clips, roughly 25 MB while the rite plays.
- **Hallveig:** her layer is 102 MB decoded over all 31 clips. On the clips she uses (the idles, walk, interact, kneel and the six rite clips) it is about 50 MB. Eadric's comparable figure is 39.
- **The hand things:** under 2 MB together.

**Checked:**
- All 583 of the set's own sheets keep their rects byte for byte.
- No frame reaches past the set's frame.
- Eadric isn't on the six new clips. His pieces are in his own file and he isn't at the blót. Give him no rite clip.

## Making it again

- `build\blot_people.py` builds the clips, the hand things and Hallveig into the people file: `people_row.blend` in, `people_blot.blend` and `people_blot_drink.blend` out.
- `build\render.py` is the people renderer, taking a layer's pieces by strict name.
- `render_blot.js` renders everything (six processes).
- `merge_blot.js` lays it into a copy of the game's set.
- `make_blot_v2.js` makes the scene from yours.

— Colin, AD
