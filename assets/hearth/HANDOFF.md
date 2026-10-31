# Indoor fire, round 2: A and C, with or without a pot (Colin, AD, 2026-10-31)

Robin: "some variation of A and C where it can be with or without a cooking pot". Still a draft until he says yes. The picture is `indoor_fire_round2.png`.

## How it works

There is one hearth, set in the floor, in three sizes. What stands over it is its own picture, so a pot can come and go without changing the hearth.

| Layer | What it is | Sizes (tiles) |
|---|---|---|
| `hearth4`, `hearth2`, `hearth1` | Curb, stones, clay bed, logs, with `_embers` and `_flames` (10 frames at 12 fps) | 4 by 1, 2 by 1, 1 by 1 |
| `trivet4`, `trivet2`, `trivet1` | A's pot on an iron trivet, no timber | Same |
| `hook4`, `hook2`, `hook1` | C's timber and chain, with an empty hook | Same |
| `kettle4`, `kettle2`, `kettle1` | C's timber and chain, with the kettle | Same |

Draw order: hearth (or embers), then flames, then at most one over-layer. Use the size that matches the hearth.

The trivet pot and the kettle draw over the flames. The pot stands over the fire only in `trivet1`; on the longer hearths it sits on the raked coals at the east end.

## Format

`sheets/indoor_fires.json` gives `w`, `h`, `ax`, `ay` for each picture, with upp 0.25. Every picture is trimmed, and the anchor is the footprint's middle at floor level. **The flames and embers carry their own `ax`, `ay`,** because they trim differently from the base. This is not quite `fires.json`, which has one anchor per fire. All of it comes to about 550 kB.

The pictures are at the ground's tilt, as in round 1.

## Not checked

The board mocks the layering and the light. None of it has run in the game. I looked at single flame frames, not the loop playing. The hero's sorting against the timber is untested; the hearth's footprint should block him. At night the board fades the over-layer to half so the glow shows through, and the game's own light will differ.

The smoke hole notes in `out/indoor_fire_drafts/HANDOFF.md` still stand.

— Colin, AD
