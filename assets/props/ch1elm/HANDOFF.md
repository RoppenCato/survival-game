# The elm: the tree, its bow, its building pieces, a bench and a table (Colin, AD, 2026-11-10)

For Clive, GD, chapter 1 item 7, the elm half. Robin said no yew anywhere, so the elm takes its place. The Old Man bear, his rug and `cloakBear` come next, in their own drop.

Pictures:

| Picture | What |
| --- | --- |
| `elm_trees.png` | the two elms, the felled trunk and the log, beside the game's oak and the hero at Robin's size |
| `elm_bow.png` | the game's bow above, the elm bow below, drawn from the packed set |
| `elm_mock.png` | the elm wall, floor, corner posts and door drawn through your Build, beside today's 'Planks' and the big logs |
| `elm_furniture.png` | the bench and the table beside the hero |

## The tree: `trees/elm_1`, `elm_2`, `elm_trunk`, `elm_log`, and `trees/elm.json`

The wych elm (almen), Almey's tree.

**Its one thing is the vase.** A stout grey trunk parts low into a fan of limbs that rise steeply and then arch out. Over them sits a broad umbrella crown, wider than it is tall, its east and west rims hanging down. The limbs show in the V under the crown, which sets it apart from the oak's round head. The bark is grey-brown in long ridges, and the leaves a step deeper green than the oak's.

- **`elm_1` and `elm_2`:** standing, 5.9 m and 6.5 m (the oak is 4.6 m, the pine 5.6 m).
- **`elm_trunk`:** the felled tree lying, its chopped end toward −x, as your other trunks are.
- **`elm_log`:** a 1 m log.

`elm.json` is in the format of `assets/props/trees/trees.json` (`kind` `elm`, `part` tree, trunk or log, `variant`), so the four can join the trees' set or stay as their own. The anchor is the trunk's foot.

## The elm bow: layer `bowElm`, in the set copy `out/hero-kit_2026-11-10c/hero-kit`

The elm bow is about 1.6 m, 1.3 times the first bow and a little short of his height. Elm bows were long, wide-limbed self-bows, so the stave is fattened all round: at the game's size a thin stave inks to a black hair, and this one shows its pale honey wood.

It has a dark leather grip, horn nocks and a pale sinew string, and is drawn in its own colours. **Draw it untinted**, as the flint is.

It's on every clip `bowWood` is on: `idle`, `walk`, `walk_fast`, `run`, `bow_draw`, `bow_shoot`, `hit`, `jog`, `leap`, `bow_draw_walk`, `sneak` and `sneak_walk`. Draw `bowElm` where you would draw `bowWood` when the elm bow is held. It fits every frame (none reaches past). The arrow on the string is unchanged.

The bow came from the kit file that matches the game's `bowWood` at 0.99 on all twelve clips, so it sits in the hand exactly where the first bow does.

**Item picture:** `items/bow_elm.png`, for `assets/sprites/items/` beside `bow_wood.png`. 320 px like the flint ones, one picture, untinted.

## The building pieces: code, like the big logs

`code/build_elm.js` (global `BuildElm`, also `module.exports`). It needs no pictures and no memory, and it is composite only.

- **The wall:** add `BuildElm.WALL` to `WALLS`:
  `{ name: 'Elm boards', face: '#c49a66', top: '#d4ae7c', dark: '#8c6440', tex: 'elmBoards' }`.
  - In `face()`, for `m.tex === 'elmBoards'`, call `BuildElm.face(c, m, x, y, w, h, seed, vertical)` inside the face's clip, as you will `BuildLogs.face`.
  - It is a stave wall. Wide pale boards stand side by side, three to a tile (against 'Planks' at five, narrow and brown), sawn straight and fine in the grain. They stand between a sill beam at the foot and a wall plate along the top, and each is pegged to both.
  - It follows the world's x, so long walls have no seam.
  - In `cap()`, treat `'elmBoards'` as `'planks'`.
- **The corner posts:** `BuildElm.post(c, m, x, yb, h, seed)` draws a squared post centred on x from the wall's foot up its height. Call it where an elm wall ends or turns, after the walls, as `BuildLogs.ends` is called.
- **The floor:** add `BuildElm.FLOOR` to `FLOORS`: `{ name: 'Elm boards', tile: 'elm' }`.
  - For tile `'elm'`, call `BuildElm.floor(c, x, y, w, h, seed)` for the tile's rectangle.
  - It draws wide sawn boards along x, two to a tile, each nearly three tiles long, their ends staggered row by row, with two pegs at each end.
- **The door:** `BuildElm.door(c, x, y, w, h, open, seed)` has the same signature as your `door()`. Use it for a door in an elm wall. It has two pale elm boards, two dark battens, iron strap hinges ending in a curl, and an iron ring. Open, it stands edge-on at the jamb, as yours does.

`code/mock.js` drew `elm_mock.png` through your own Build, painting the elm face over Build's face, as the log mock did. `build_logs.js` is beside it only because the mock draws the log room too.

## The bench and the table: `pieces/elmBench`, `pieces/elmTable`, `pieces/elmfurniture.json`

A pair, finer and paler than the first home's pine pieces. They have wide sawn elm boards on slab legs with an arch cut from the foot, and the stretcher runs through the legs, held by wedges. Both are turned 24° on their foot so the slab legs show their faces, not their edges, as the sitting log is turned.

- **`elmBench`:** 1.6 m long, knee high, the legs' tenons showing through the seat.
- **`elmTable`:** 1.6 by 0.8 m at 0.76 m, two wide boards on cleats.

They're in the set pieces' format, with the anchor at the middle of the foot on the ground.

`build/` holds:

- `trees_build.py`: the elm, kind `elm`;
- `add_elmbow.py`, `elm_render.js` and `elm_icon.py`: the bow;
- `check_bow.js`: draws `elm_bow.png`;
- `ch1b_build.py`: the bench and the table.

— Colin, AD
