# Handoff: the runes, first drop (Colin, AD, 2026-10-23)

For Clive, GD. Robin decided the reworked runes (`docs/runes-rework.md` in your repo); you asked for the art in six parts. This drop
holds parts 1 to 4: the altar, the stones, the lightning and the HUD. The cudgel and the carried animals come next.

Everything is in the set pieces' way at 4 px a game unit (upp 0.25), in the kraken's chosen tones with the pieces' line.

## `sheets/runes/` (set `runes`, 10 pictures, 0.1 MB)

| Picture | What |
| --- | --- |
| `altar` | The blót altar: a long rough slab on three stones, 2.4 m. Old blood on its head (the west end) runs down the front edge. The blood bowl and its twigs stand at the foot, with stones round it. |
| `altar_scorched` | The same after the storm: a dark burst on the slab where the bolt struck, paler ash round it, a crack across, flakes of stone thrown off. |
| `runeStone` | A standing stone a hero's knee high (0.55 m), its flat face to the front. Blank as it stands; the glyph is its own layer (below). |
| `runeStoneBroken_1`, `_2` | A stone the lightning broke: the stump with a jagged top and a pale fresh break, the top lying fallen beside it, chips and a scorch at its foot. |
| `runeStonePlace` | An empty place in the ring: a flat bedding stone sunk in the turf, where a stone will stand. |
| `stoneChip_1..4` | The fragments the bolt throws, for flying debris. |

- **The laying place:** `runes.json` gives each altar `lay: { x, y }`, the slab's top middle in the picture's pixels. Draw the beast
  there.
- **The animal on the altar:** I'd use each beast's own `death` clip, last frame (it lies on its side), drawn at `lay` at the beast's
  own scale. The boar, the deer, the sheep and the hen all have one in the kraken style. That keeps memory down and matches them
  exactly. If one looks wrong lying on the stone, tell me and I'll render a laid picture for it.

## `sheets/glyphs/` (46 pictures)

- **The glyph layer: one stone, thirteen glyphs, two states.**
  - The files are `glyph_<name>_carved` (a grey groove, its lower-right wall catching the light) and `glyph_<name>_woken` (the groove
    filled blood red, with a wet glint).
  - Each has the **same foot point as `runeStone`**: draw it over the stone at the stone's own place, with its own `ax`, `ay` and
    `upp` (0.0625: four times the stone's pixels, for crisp cuts). Blank is the stone alone.
  - The names: bash, charge, dash, roll, thorsFell, thorsWrath, bloodlust, rushStep, catFoot, stormsEye, keenEye, hammer, thickHide.
  - Each glyph is a real rune whose meaning fits; its rune is in `glyphs.json` (`rune`), for Alistair, LD to confirm. A glyph is one
    line in `tools/glyphs.js`, so swapping or adding one is quick.
- **`mark_<name>`:** each glyph for the toolbar's marks, 48 px, in the HUD's pale gold line (as `stat_*`). Your red ring goes round it.
- **`slot_<name>`:** the seven slot icons, 48 px, in the same line: guardBlow (a shield driving forward), dash (a chevron with the
  wind behind), swing (an axe on its arc), hand, foot, eye, heart.

## `sheets/lightning/` (9 pictures)

- `lightning_0..7`: the bolt striking from the top of the screen down to its foot point, 8 frames over about half a second (16 fps):
  - frame 0: the leader reaching down
  - frame 1: it touches
  - frames 2 to 4: the strike flickering, with its forks and the splash of light and sparks at the foot
  - frames 5 to 7: fading
- `lightning_after`: the after-image of the strike's path, to hold a moment and fade.
- `lightning.json`: `ax`, `ay` is the foot point; put it on the altar's `lay`. Draw with 'screen' or plain. The sky's flash is the
  weather module's, and the thunder is Derek, SD's.

## Builders

- `build/runes_build.py`: the stones, altar and chips (Blender).
- `tools/glyphs.js`: the glyphs, marks and slot icons.
- `tools/lightning.js`: the bolt.

## Pictures

- `scene.png`: the altar with a ring of library stones (carved, woken, empty places) at the game's size, and the strike with two stones
  broken.
- `glyph_board.png`: every glyph carved and woken, the marks and the slot icons.
- `lightning_strip.png`: the frames over the altar.

— Colin, AD
