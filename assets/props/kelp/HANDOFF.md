# The villages, step 5: Gamli's hut and his shore (Colin, AD, 2026-11-10)

For Clive, GD. Robin's note, via you: Gamli's "hut" was a large house with flower boxes and a second big building. The lore says one hut, kelp and drying racks, and Tangholm is the kelp islet. `gamli_shore.png` shows the place as the generator now lays it, on a test shore. The hut is drawn there as a block; your Build draws its walls and thatch.

## src/village.js (done): the `fisher` arch, a lone fisherman's place

**Village.VERSION is now 5:** the fisher's layout moved.

The hut, alone:
- **No second house.** `pickRange` never gives less than one, so `houses: [0, 0]` had given a house anyway; for a hut it's now none.
- **No outbuilding.**
- **The hut is small:** 4 tiles across (6 m) and 6 or 7 long, its gable and door to the yard. It's still enterable, and its room passes the audit's threshold, lane, circle and reach.

Inside, a lone fisherman's things, not a family's:
- his calling is always the fisher's: a drying rack, not a loom;
- no cradle;
- no flower boxes on his walls.

Now and then a lean-to stands against the hut (the varied silhouettes). The wall hangings stay, as do herbs and pelts. The yard fence stays too: the place's ways in are reckoned from it.

**The boat:** always drawn up on his shore. The draw is kept, so nothing moves.

**His shore kit** is `fisherKit`, on its own random stream:

| Prop | Where |
| --- | --- |
| `dryingRack` × 2 | below his yard: split fish |
| `fishingNet` | the nets on their poles, beside the yard |
| `netTangle` | at the poles' foot |
| `hangingFish` | fish hung under a rail, the yard's other side |
| `kelpRock` | kelp spread to dry on a flat rock at the water's edge (new) |
| `kelpHeap` | a heap above the tide line (new) |
| `kelpHeap_2` | a heap carried up toward the hut (new) |

Checked on five seeds: nothing on a floor, nothing crowded. The audit is unchanged at 12.

## The water's real edge: `opts.land` (for this and for Saltvik)

The generator knows no terrain inside a site, so on your world Saltvik's works lay inland. Pass `land: function (tx, ty) { return <the tile is land>; }` in `Village.make`'s opts (your plan's `code(tx, ty) !== 0`). Then:

- **The water line:** `waterRow` finds the first row of water south of the shore strip, under the works' columns (the median).
- **The salt works:** the pool goes on the last row of land, the pans three and a half tiles up, the rest round them.
- **The kelp:** the rock and the shore heap go at that edge.
- **No piece in water:** `onLand` steps any piece north (up to four tiles) until it's on land.

Without `land`, it all falls back to the site's rows, as before.

**Clear your world's things there:** the works can now reach past the site's southern edge, where your own trees and bushes aren't cleared. `V.saltArea` (in tiles) is the works' ground. The generator keeps its own nature off it; please clear your world's props there too, as you clear the site.

## Saltvik's pans, redrawn (`out/villages_salt/pieces`, copy again)

At the game's size the boiling and crusted pans read alike. Now:
- **Boiling:** six taller flames out of the hearth's mouth, a bigger bed of embers, and the fire's light on the ground before it.
- **Crusted:** thick white crust to the rim, ridged, with a heap scraped up at one end.

`out/villages_salt/pans.png` shows the three at game size and at twice that.

## New pictures: `pieces/kelp.json`

`kelpHeap`, `kelpHeap_2` and `kelpRock`, in the set pieces' format. Each anchor is the middle of its foot. `ch1b_build.py` holds `kelp_heap` and `kelp_rock`.

— Colin, AD
