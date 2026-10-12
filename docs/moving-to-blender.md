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

- **`src/sprites.js`** (done 2026-10-09): one module shared by the game and the editors for loading a sheet, picking a clip and frame from a state
  (the game's `sprPick`, generalised: moving, sprinting, attack phases, tool, hurt, sit, dead, plus a one-shot queue), drawing the
  layers, and the **cast shadow** (the silhouette sheet, the props' lean). The game's and the Blender Editor's copies of this code
  fold into it. Hooks beside `heroSprite`: `api.enemySprite(e)` for beasts and `drawFolk` for people.
- **The sheet budget**: a clip list per model in a manifest (`art/models.json`: the .blend, the clips with frame counts and
  directions, the layers, the height), rendered by one script (`npm run art:model <name>`). Rules: eight directions for things that
  turn freely (people, beasts), four for small things; the idle at 10 frames a second and the rest at the game's pace; sheets
  trimmed to the figure; a target of about 10 MB a character, 1 MB a beast.
- **Things in the hand** (done 2026-10-09 for the sword, axe, pick, knife, club and bow; the seax, spear and rod are modelled but not rendered; the torch and the chest are still drawn): the sword, axe, pick, knife, bow, torch, rod and the carried chest drawn as **separate layers** rendered on
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
| Hero 2 (cel, fitted) | `hero2.blend`, `hero2_mixamo.blend` | Mixamo | 18 | `hero2-mixamo` | yes | **the hero** everywhere (since 2026-10-09 evening, `src/sprites.js`) | the sword, axe, pick, knife, club and bow as layers in the hand (2026-10-09); no gear layers yet; the drawn hero retired to `art/backup/` |
| Hero 1 (first trial) | `hero.blend` | own | idle, walk | `hero` | yes | Character Editor only | superseded |
| Villagers, Brokk, child, elder, guard | | | | | | | step 2 |
| Mountain troll (boulder) | `troll_boulder.blend` | own (`troll_build.py`), no Mixamo | 7 | `troll_boulder` | Models tab | **yes**, the cave troll (2026-10-12) | stone is the shield pose under a grey tint |
| Forest troll | `troll_forest.blend` | the same rig | 7 | `troll_forest` | Models tab | arena only | not spawned in the game |
| The Gape (new) | `troll_maw.blend` | the same rig | 7 | `troll_maw` | Models tab | arena only | Robin to decide where it lives |
| Mine mouth, sea cave mouth, rock shelter (2026-10-12) | `rocks.blend` | none: set pieces (`rocks_build.py`: `mine_mouth`, `sea_mouth`, `rock_shelter`, their insides by `inside2`) | none | `assets/props/` | no | **yes**, the mountain test scene (the shelter on the big island too) | the shelter is two pieces: `shelter_in` painted into the ground, `shelter` a prop in front of whoever is under it; thin hanging roots took the ink as black sticks (moss instead) |
| Peaks (a, b, c, d), cave mouth | `rocks.blend` | none: set pieces, one render each (`rocks_build.py`) | none | `assets/props/` | no | **yes** (2026-10-12), the mountain test scene | the peaks rebuilt the same day (ribs and gullies, a rough outline, smooth with sharp ribs) and finished by the packer (grain, a cool shade, the ink line heavy on the shadow side, a shadow at the foot); painted into the ground, the cave mouth a prop; the sun at 3.0 |
| Draugr | `draugr.blend` | the trolls' rig as a person (`troll_build.py`) | 7 | `draugr` | Models tab | no | mechanics to discuss |
| Huldra | `huldra.blend` | the same | 5 (`call`) | `huldra` | Models tab | no | mechanics to discuss |
| Nacken | `nacken.blend` | the same | 5 (`play`) | `nacken` | Models tab | no | mechanics to discuss; the lyre opens instruments |
| Bysen | `bysen.blend` | the same, half size | 5 (`chop`, `hide`, `stump`) | `bysen` | Models tab | no | mechanics to discuss |
| Three-headed troll (new) | `troll_three.blend` | the same rig, two more necks and heads | 7 | `troll_three` | Models tab | arena only | Robin to decide where it lives |
| Boar | `boar.blend` | own (`quad_build.py`) | 7 | `boar` | Models tab | **yes** (2026-10-11) | |
| Deer | `deer.blend` | the same rig | 5 (no attack) | `deer` | Models tab | **yes** (2026-10-11) | a stag; the death lies stiff-legged |
| Wolf | `wolf.blend` | the same rig | 7 | `wolf` | Models tab | **yes** (2026-10-11) | eyes exported for the night glow |
| Bear | `bear.blend` | the same rig | 7 | `bear` | Models tab | **yes** (2026-10-11) | rears to strike; 9 MB |
| Moose | `moose.blend` | the same rig | 7 | `moose` | Models tab | **yes** (2026-10-11) | a 324 px frame, 17 MB: the heaviest sheet set |
| Adder | `snake.blend` | own chain (`snake_build.py`) | 7 | `snake` | Models tab | **yes** (2026-10-11) | twice life size so it reads |
| Trees, rocks, the wreck | | | | | | | step 5, if judged needed |

## The sun is too weak for the cel look (found 2026-10-12)

`toon.sun` sets the sun's strength to 1.15. At that strength no surface passes the cel shader's light step (the diffuse value
never reaches 0.66), so **every character so far has been rendered wholly in the shadow tone**, with no lit side: the hero, the six
animals, the trolls, the draugr, the huldra, Nacken and the bysen. That is why base colours kept needing to be made brighter. A
sphere rendered at 1.15, 2.2 and 3.6 shows it plainly: nothing lit, a small lit patch, a proper three-tone split. The mountain set
pieces are rendered at 3.0 and have lit and shadowed faces. **For Robin to decide:** re-render the characters with a lit side
(several hours of rendering, and every base colour would need taking back down), or keep them as they are.

## A set piece needs the drawn world's finish (found 2026-10-12)

The first peaks were flat-shaded cones of a few big triangles and read as crystals beside the drawn trees and the painted cliffs.
What made them sit in the world: **form that light can read** (ribs and gullies, a smooth surface with only the ribs' edges sharp,
so the cel shader gives two or three big shapes and not a mosaic), **a rough outline** (soft waves in the radius, a little grit),
**the ink line the props have** (Freestyle's contour, then in `tools/props.js` the silhouette in ink laid under the piece: thin
all round, heavy toward the lower right), **the kit's own grain** over it, **a cool shade** toward the shadow side, and **a shadow
at its foot** so it stands on the ground. The same finish is there for any later set piece (`tools/props.js` does it to
everything it packs). A thing nobody can walk behind is best **painted into the ground** and not drawn every frame.

## Looking into a hole (2026-10-12, the cave mouth)

A dark opening painted as one flat shape reads as a sticker on the wall. From the game's camera (35 degrees above the ground) what
shows through an opening is mostly the floor running back, so the cave has a real passage behind its mouth and the depth is told by
colour: warm and lit at the threshold, cooler and darker further in, black at the back, with one patch of sun on the floor and
things standing on the floor that are paler than what lies behind them. Three things made it work: the inside is **painted, not
lit** (a colour on every point of the mesh, worked out from how far in the point lies and whether the sun reaches it through the
arch), it takes **no ink line** (soft against the inked rocks, so it sits behind them), and **the cliff is a holdout** with the
opening cut in it (the inside can be as deep as it likes and shows only through the mouth). The same would serve a doorway, a
well or a cellar hatch.
