# Destruction (`src/ruin.js`, `docs/destruction.md`)

How this part of the game stands now, moved out of `CLAUDE.md` on 2026-10-27 (the doctor: it was read at every start). Keep it current, as `CLAUDE.md` was: what is true now, Robin's decisions marked as his.


In the real game too (the big island's villages) and in the Destruction Editor; `tests/ruin.js`, `tools/visual/ruinplay.js`
and `sackplay.js`. Robin has not played it. **Your tools and fire work only on what is somebody else's** (a village you do
not hold; `placeAt`, `theirs`); in such a village you cannot build or wreck. A tool takes the one piece of wall you face, by
its material (`Ruin.rightTool`, `Ruin.hit`), heard by its material's reach (a soft noise stirs a place only if someone heard);
a room that loses too much loses its roof (a groan, then the fall: things inside tipped, people out, the hero hurt).
**Fire:** a lit torch and E at a wall or roof; it spreads with the wind (`Ruin.fireTick`), burns through walls and roofs,
lights the night, heats, is heard; men come to watch a fire (`Combat.gawk`) and walk out of a burning room; people run to a
refuge and come back homeless. **A fire in a place at peace is no raid in itself** (2026-10-21): the house's own run out, the men come to look, and **the bucket brigade** fights it: a place with a well sends up to four free villagers to it with buckets for any fire within 320 units of the well (`BRIGADE`, `brigadeTick`, `bucketStep`; the roof that has just caught first, then the wall nearest to burning through; `Ruin.douse`: a wall goes out and stays wet 40 s, a roof loses 14 s of its burning a bucket, `R.fire.bucket`, `wet`); a fire beyond the well's reach, or in a place with no well, burns; a fire in a place already uneasy or raided is part of the raid and stirs it. Measured (`tests/ruin.js`): a thatched wattle house with three on it stands, with one on it mostly burns; in the live town four villagers put out a timber-frame house fire in about 130 s after it had taken a block's worth of walls. The stakes of a village's ring can be hacked down. **Wooden furniture breaks too** (the village session's interiors plan, section 5; Robin, 2026-10-22: "Yes"): in a place not yours (`theirs`), a table, bench, chair, stool, shelf, cupboard, loom, bed or laid table takes about four axe blows (`WOODF`, its hit points; the pick bites at half), heard softly (`FURN_NOISE` 110), and falls to a heap (the studio's `furnitureHeap` when it comes, the broken door's planks until then) with one or two wood (a bed or a loom some fibre too); in a burning room, or on its glowing ashes, it burns after `FURN_FIRE` 20 s to a charred heap (`furnFire`). Stone (the hearth, the quern, the altar, the font) never breaks by hand. **Mending** (the piece `mend`, once a claim
stone of yours stands there) mends walls and raises a fallen roof. The leaning side face (`Build.CFG.lean`, 0) stays in `src/build.js` for the
mountains' walls; its trial on the editor's board was cut in the clean-up of 2026-10-21 (Robin doubted it).
A post can be charred too (`p.burnt`, snapped to `p.snap` of its height; no beam is left between burnt posts), a standing
fence or palisade shows soot, and no grass grows in the ash of a burnt room (`w.noGrass`); the burnt steading uses all of it.
