# The cut-scene tool and the blót (Colin, AD, 2026-10-29)

Robin's order through Clive, GD: research how cut-scenes are made, write a skill, build the tool, then the blót as the first trial.
Then Robin added that the blót must be a rite, not a crowd watching one sacrifice.

**What is here:**
- `cutscenes.md`: the research and what we take from it.
- `blot-ritual.md`: the blót from the sources (Snorri's chapter on sacrifices, Adam of Bremen, the oath ring, the finds), staged as
  ten beats, and the art it needs.
- `src/cutscene.js`: the player.
  - A scene is plain JSON: a list of steps, each waiting for its end unless `"wait": false`, with `par` blocks run together.
  - Places come from anchors, so a scene plays in any village.
  - One `end` list runs at the end and on a skip, so the two leave the same world.
  - It touches the page only through an `env`.
- `src/cutscene_editor.js`: the Cut-scene Editor, a panel over the game (`game.html?scene=cutscene`).
  - The steps list, the chosen step as JSON, Play, Play from here, Skip and Stop.
  - Pick turns a click on the world into a place.
  - The scene's places are marked on the ground while you edit.
  - Check, Save (this browser), Copy, Download and Paste.
- `scenes/blot.json`: the blót as a rite, 77 steps (`make_blot.js` writes it).
- `hooks/cs_block.js`: the block for `game.html`: the `env`, `csPlay(id, onEnd, places)`, `csTick`, `csDraw`, `csItems` and
  `csScene`.
- `hooks/patch_game.py`: the exact record of every change to `game.html` (13) and `build.py` (1).
- `test.js`: the player's tests (`node test.js`): a scene to its end, a skip at forty moments landing where the end does, and play
  from a step.
- `first_run.png`: the first run in a studio copy of the game, with the first, plain staging.

**The changes to the game** (`patch_game.py` applies them to a copy; please apply them in the game, or tell me to):
1. `__CUTSCENE__` among the sources in `game.html`. In `build.py`: `SRC['__CUTSCENE__']` (the two files) and `SRC['__SCENES__']`
   (every `scenes/*.json`, by name).
2. The block before the Models scene.
3. `still()`: `|| !!CS.lock` (the input held).
4. In `Combat.api.scene.begin`, before `cam.x = …`: the view taken from `CS.cam` (the player eases it).
5. After the cave fade's fill: `csDraw(c)` (the dusk, the bars, the fade, the editor's marks).
6. `csItems(items)` beside `dlgItems` (the figures made for a scene).
7. In `drawPerson`, before the last `Sprites.person` call: a scene's clip (`m.csClip`).
8. In `frame()`, after the cave fade's countdown: `csTick(dt)`.
9. `SCENE === 'cutscene'` starts `csScene()`.
10. Its own save key (it saves nothing).
11. The editor's Pick in the canvas's mousedown.
12. No E prompts while a scene holds the input (the talk window still answers E).
13. No hints while it does.

**What the blót needs from you** (each a `call` or an `fx`; `CS_CALLS[name] = function (args, done)` and `CS_FX[name]`):
- `blotLayWolf`: the wolf laid on the stone, and the farm beast led beside it if Robin wants one.
- `blotOffer`: the goði's blow (he strikes, not the hero, in my staging), the beast falls, the blood on the stone.
- `blotKettle`: the meat into the great kettle and the steam (`wait: false`).
- `firstRunePick`: the scripted first pick. It calls `done` when the pick is made.
- `blotAfter`: the altar taught, the quest step, the stones left risen, and the feast going on with the folk seated. It runs on a
  skip too.
- **fx:**
  - Wired already: `dark`, `flash`, `thunder` and `glow`.
  - Yours to wire: `bolt` (the lightning frames at x, y) and `stones` (your runeStoneRise).
  - `music` only stores the name (`CS.music`) for the rite's theme to read.
- **Places:**
  - `altar` reads `villageAltar()` if you make it (else the first altar item).
  - `csPlay('blot', onEnd, { altar: { x, y } })` can hand any places in.
  - The figures: `lead` (the goði, a figure made for the scene, dressed as `role.elder`; or your village's speaker if you give the
    cast a `role: 'person.<id>'` that csFig knows), `beastman`, and `folk:0..9`.

**What I found testing in a studio copy** (fixed): the dusk lost because ticks added while ticking were dropped; speech on made
figures not drawn (now the game's speech board); talks rushing past for speakers without a portrait (now they wait for E, Space,
Enter or a click); the crowd blocking the hero's way; the E prompts and hints showing. Still to see in your game: the ritual
staging, with the new clips once made. The hero's walk uses one-shot `walk` plays while he is moved, and you may have a better way.

**The art the rite needs** (mine, next, unless Robin changes the beats): the people's clips `sprinkle`, `raise_cup`, `drink`,
`hail`, `bow`, `pour` and `walk_torch`; hand things (torch, *hlaut* bowl, twig bundle, horn, oath ring); the *vé* (carved posts,
the offering tree, skulls), the great kettle on its tripod with steam, ale tubs and baskets, the reddened altar, and a garlanded farm
beast on a halter.

— Colin, AD
