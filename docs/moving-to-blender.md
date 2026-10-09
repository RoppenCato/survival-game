# Moving to Blender

Robin decided on 2026-10-09 to move the game's graphics to Blender models rendered to sprite sheets, after the trial with the
second hero (`art/`, `assets/sprites/`, the Blender Editor (since the cleanup of 2026-10-09 the Art Editor's Models tab), the Mixamo clips, the in-game trial). This is the plan: what to model,
in what order, what stays in code, and what has to be decided. It replaces "all art is drawn in code" as the rule for characters
and creatures; the rest is decided below. **Status is kept in the tables; update them as models land.**

## What the trial settled

- The pipeline works end to end: a model built or imported in Blender, the toon look (`art/build/toon.py`: the cel style fitted to the
  starter island by day, the painted face decal, the world's ink line, grain, the cool shadow step), `render.py` to frames in eight
  directions with a frame count per clip, `tools/sprites.js` to sheets with one anchor, the pages loading sheets by path, and the
  game drawing a sheet hero through `Combat.api.heroSprite` with the clips following the game's own actions.
- Mixamo gives the humanoid clips (walk, run, idles, slashes, bow, hit, death, chop, mine, sit) once a model has its skeleton; the
  auto-rigger wants a watertight proxy mesh (`hero2_proxy.py`). Every humanoid on the same skeleton shares every clip.
- The cost that matters is **sheet weight**, not render time: the hero's eighteen clips in eight directions are 22 MB of PNG. A
  render is about 0.3 s a frame, so a full character is ten to fifteen minutes.
- What makes a model sit in the world is the finish, not the design: the props' line weight (heavy on the shadow side), a hard
  shadow step toward the scene's blue, the grain, and a cast shadow the way the props throw theirs.

## What moves and what stays

| Moves to Blender | Stays in code | Why |
| --- | --- | --- |
| The hero, the villagers, Brokk, the hird, guards, priests, merchants | | Figures animate and turn; the drawn figure is the weakest-looking thing in the game and the hardest to keep consistent |
| The animals and the trolls, every later beast (`docs/beasts.md`) | | Same reason; the drawn view rigs took days each and still clip |
| Big props one at a time, **after** the characters, only where a drawn prop looks wrong beside the models (trees first, rocks, boats as props) | Small props, clutter, flowers, grass, drops | The 126 props *are* the art direction; most already fit. Static renders are cheap (one direction, no rig), so this can be done piecemeal |
| | The ground, water, waves, the meadow and grass, the ground brush | Painted fields, never square; nothing to gain |
| | Building pieces, walls, roofs, the yard pieces | Walls sit on tile edges and roofs are found by flood fill; a mesh kit would redo `build.js` for no visible gain yet |
| | The vessels | The hull's shape follows the parts laid (`Yard.boatProfile`); a procedural drawing |
| | UI, boards, icons, effects (numbers, rings, embers, smoke), the night, the chart | Screen-space and data-driven |

The gathering effects a tree or rock shows (the lean, the notch, the cracks, the glint, the fall) are drawn by `Gather.drawProp`
over the prop's sprite; a Blender tree keeps those as transforms and overlays on its sheet, so moving trees does not touch `gather.js`.

## The order of work

Ordered by what unblocks the rest, then by how much of the game each is on screen. Each step ends with a render check in the
Blender Editor and in the game, a before/after image, and a note in the status table.

### 0. The foundations (first, small, everything rests on it)

- **`src/sprites.js`**: one module shared by the game and the editors for loading a sheet, picking a clip and frame from a state
  (the game's `sprPick`, generalised: moving, sprinting, attack phases, tool, hurt, sit, dead, plus a one-shot queue), drawing the
  layers, and the **cast shadow** (the silhouette sheet, the props' lean). The game's and the Blender Editor's copies of this code
  fold into it. Hooks beside `heroSprite`: `api.enemySprite(e)` for beasts and `drawFolk` for people.
- **The sheet budget**: a clip list per model in a manifest (`art/models.json`: the .blend, the clips with frame counts and
  directions, the layers, the height), rendered by one script (`npm run art:model <name>`). Rules: eight directions for things that
  turn freely (people, beasts), four for small things; the idle at 10 frames a second and the rest at the game's pace; sheets
  trimmed to the figure; a target of about 10 MB a character, 1 MB a beast.
- **Things in the hand**: the sword, axe, pick, knife, bow, torch, rod and the carried chest drawn as **separate layers** rendered on
  the same clips (a child of the hand bone, rendered as a holdout layer like the helmet), so the game stacks "body + sword" from the
  Fight bar. This is the one piece of the trial Robin saw missing ("swings empty hands").
- **The lighting hooks**: the cast shadow's lean and length from the hour (the Light Editor's `sun(h)`) once the game takes the
  Light Editor's shadows; until then the props' fixed lean.

### 1. The hero, finished

Layers on the second hero: helmet (leather, iron), mail, gambeson, cloak, the tunic recoloured by the material; the hair and beard
as layers so Eirik, Ásta and Hallvard are one body with different layers (Ásta's braid and cap, Hallvard's knot and fur vest); the
clips the game still lacks (bow draw as a held pose, block with the shield, carrying the heavy chest, fishing cast and reel, the
raft paddle and the karve's tiller, sleep). The old drawn hero stays until Robin switches the default.

### 2. People

The villagers are the hero's body with the concepts' hair, beards, hats and clothes as layers and a small palette of colours
(`FOLK`, `CONCEPTS`), so one render set covers the hamlet, the towns and the hird. Then the ones with their own build: **Brokk**
(the dwarf: a shorter, broader body on the same skeleton), the **child** and the **elder**, the **guard** (helm, mail, the sword
layer, the alarm's run). Idles and jobs from Mixamo (looking around, hands on hips, sweeping, carrying, chopping; the smith's
hammering) replace `lib.IDLES` and `lib.JOBS`.

### 3. The trolls

Bipedal, so the Mixamo skeleton rigs them (the boulder troll's hands on the ground is a pose, not a rig). The boulder troll first
(the cave, the first big event), its stone, then the forest troll. Clips: idle, walk, the slow sweep (windup, blow, recover: the
engine's arc attack), hit, death, shielding the eyes. Rendered larger (their own frame size in the manifest).

### 4. The animals

The biggest modelling and rigging job: Mixamo has no quadrupeds, so each gets a Rigify animal rig and hand-keyed clips (walk, run,
idle, the attack kind it has: lunge, charge, arc; hit; death; the deer's flight). Order by time on screen: **boar and deer** (the
starter island), **wolf** (every night), **snake** (small: four directions), **bear**, **moose**. One rig and one set of clips per body
plan, re-used across similar bodies (deer and moose share; wolf and bear differ).

### 5. Props where they are needed

After the characters stand in the world, judge the props beside them. Likely first: the trees (oak, pine, birch; the lowland
oak, beech, ash, apple), because they are big and everywhere, then rocks and the wreck. Static renders, one direction (the
three-quarter camera), the gather overlays unchanged. Stop where the drawn props look right.

### 6. Later beasts and everything new

New creatures from `docs/beasts.md` (draugr, huldra, näcken, the jötunn) are modelled from the start; nothing new is drawn in code.

## Decisions for Robin

- **The bodies.** One shared humanoid body with layers (cheapest, consistent) or a mesh per hero and concept (more character, more
  renders)? The plan assumes one body for the hero and villagers, and separate builds only for Brokk, the child, the elder and the
  trolls.
- **Direction count** for beasts: eight (smooth turning as decided for the ship) or four with mirroring to save sheets.
- **The props**: judge after step 2 whether any move at all.
- **Where the sheets live**: `assets/sprites/` is committed now (22 MB for one hero). At ten characters and six beasts that is
  150 MB in git. Either a budget per model (above) or a release step that packs sheets outside git.
- **The old drawings**: kept as fallbacks until each model is in, then removed (`playerD`, `quadD`, `trollViewD`, the view rigs,
  about a third of `src/art.js`).

## Status

| Model | Blend | Rig | Clips | Sheets | In the editor | In the game | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hero 2 (cel, fitted) | `hero2.blend`, `hero2_mixamo.blend` | Mixamo | 18 | `hero2-mixamo` | yes | trial (Use in the game) | no gear or weapon layers yet |
| Hero 1 (first trial) | `hero.blend` | own | idle, walk | `hero` | yes | Character Editor only | superseded |
| Villagers, Brokk, child, elder, guard | | | | | | | step 2 |
| Boulder troll, stone, forest troll | | | | | | | step 3 |
| Boar, deer, wolf, snake, bear, moose | | | | | | | step 4 |
| Trees, rocks, the wreck | | | | | | | step 5, if judged needed |
