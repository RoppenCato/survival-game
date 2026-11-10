# Inland water: lakes, rivers, waterfalls (Robin's yes of 2026-11-10; the first version is in the game)

Robin, 2026-11-10: "consider if we can have waterfalls/rivers/lakes in land. Create some mockups and show me what it would
look like." **The short answer: yes.** The pictures in `docs/pictures/inland-water/` are not paintings: they are the game's own
ground, water, waves and props, drawn by the reference scene from a world made with a trial switch (`o.inland` in
`src/world.js`; `node tools/visual/inland.js [seed]` makes them again). The game itself does not set the switch.

## The pictures

- `lake.png`, `lake2.png`: a lake on the big island, turquoise shallows round a deep middle, a thin rim of sand, reeds and
  boulders on its shore.
- `river.png`: a river wandering through a meadow, a ford of stepping stones across it, reeds on the bank.
- `river_source.png`: where the river leaves the lake.
- `river_mouth.png`: where it meets the sea, with a sandbar.
- `chart.png`: the big island small, to see where they lie.

## How it is done

The world is a height field, and water is wherever the land is under sea level. A lake is a steep-sided hollow pressed into
the land; a river is a chain of such hollows from a lake to the nearest coast. Because the hollow is a smooth field of
distance, its shore is one smooth line between the tiles, as the coast is.

## What comes for nothing

Everything that knows the sea knows a lake or a river, with no new rule written:

- it is drawn with the shore's blended colours, the swash film and the little waves;
- the hero wades at its edge and swims in its middle; beasts and men stop at it;
- a fishing rod works in it;
- nothing is planted or built in it, and villages are not laid across it;
- the map draws it.

## What it would need to be good

1. **Fresh-water look.** Today it is the sea's water: surf lace on a lake's shore, sea swell marks, the same turquoise. A lake
   wants calm water, a darker peaty middle, lily pads; a river wants a current (streaks drifting downstream) and stones.
   Colin, AD's to say.
2. **Banks, not beaches.** The rim is sand. Grass and reeds to the water's edge would read as fresh water; a ford and a
   watering place can keep the sand.
3. **Crossing.** A river cuts an island in two. It needs fords (shallow enough to wade), stepping stones and a plank
   bridge on the Building board. The steep-sided hollow can be made shallow at chosen places.
4. **Waterfalls.** The big island's mountain already has one (a fall, a pool, a brook that sinks into a bog). A river could
   begin at that pool instead of sinking away: the mountain's brook becomes the island's river. A fall on lower ground needs
   the cliff system, which only the mountain has.
5. **Fresh-water things.** Other fish (the fishing system has pike, perch and salmon already), reeds for thatch or
   baskets, drinking and watering animals, the villagers' washing place, a mill later.
6. **Winter.** Robin's winter (the sea freezes and carries you) applies to a lake first and most safely: a lake is where
   ice fishing and fish shadows under the ice can be tried before the sea.
7. **Boats.** A boat is water-borne anywhere, so a rowboat could be rowed up a river mouth. Either a feature (a river
   harbour) or to be stopped by shallows at the mouth.
8. **Spring.** The home islands' spring (left out for lack of inland water) becomes a small pool with a brook to the sea.

## The cost, honestly

The trial is forty lines. Making it part of the game: where they lie on each island (the generator), the fresh-water look
(art and the ground painter), crossings (the wade depth at fords, a bridge piece), the mountain's brook joined to a river,
the villages and roads taught to bridge or avoid it, and the tests run again on ten seeds. A week's work for a first good
version, most of it look and crossings. A new world layout drops older saves once.

## Robin's answers (2026-11-10) and what is built

- **Lakes and rivers both.**
- **On the big island and the islands round, "but not all the islands, they can be varying sizes too".**
- **A river may also run "from one lake to another".**
- **A boat up a river: "maybe"** ("Then you have to spawn the boat somehow tho"). Not built; undecided.

**Built the same day (mine, first settings):** the game's world sets `inland: { auto: 1 }`. The big island gets up to three lakes
of 3 to 10 tiles' radius, a river from the first lake to the sea and one between the other two; an island round of radius 55 or
more gets one lake a little over half the time (not the fisher's, nor one with a bay, a hill or a mound), and under half of those
a river. None on the starter island and nothing on the mountain. A river is shallow all the way, waded anywhere; a lake is deep
in its middle. `tests/isles.js` checks ten seeds. The save's layout key moved (`h3`), so an older save is dropped once.

**The fresh-water look, first pass (Colin, AD's `out/freshwater`, copied to `assets/props/freshwater`, 2026-11-10):** painted by the ground painter from a tile mask (`w.fresh`: 1 a lake, 2 a river): no sand rim, no surf, no gulls or sea life; grass to a thin dark wet line; a lake from olive at its edge to a peaty middle with the banks lying in it; a river's shallows, channel and core; lily pads in a lake's shallows, reeds, mossy bank stones. **Second pass the same day:** the river's current as pale streaks drifting along its flow (the flow's angle kept by the tile), level sky streaks drifting east on a lake, sparse glints, a fish rising every three to six seconds, the grass by fresh water lusher and not darker, no sea wave marks on fresh water (`w.drawWaves`). **Not yet from his list:** riffles, tufts leaning over the edge, a ford with its gravel bar and stepping stones, the night's version, ducks or a swan (Robin's call).

**Still to do:** the fresh-water look (it is the sea's water, with a sand rim and gulls), banks and reeds, a river from the
mountain's waterfall, a plank bridge, the spring on a home island, lake ice in winter, boats.

## Built on 2026-11-10, after Robin's "Do all of them"

- **A ford** on every river about halfway down: a row of flat stepping stones drawn in code, the water breaking pale below each (Colin, AD may give pictures).
- **A spring** on a home island that has more of one thing and no feature: a pool of 1.5 tiles and a brook to the sea; no ducks on it.
- **Tall grass** at a lake's edge, leaning in. **By night** the fresh-water marks at half.
- **A drake and a hen** on a river's lower reach. **Fish:** a river is the salmon's water, a lake has perch and pike.
- **No lake on the hamlet's or the ruin's island** (a lake had pushed Saltvik off its island).

**Still not built:** a river from the mountain's waterfall (the big island's mountain has no waterfall on any seed tried, so there is nothing for it to come from), streaks faster where a river narrows, gulls kept off the swans' shore, lake ice in winter, boats up a river (Robin: maybe).

**The crossings, 2026-11-10** (Colin, AD's `out/crossings`, in `assets/props/crossings`): a plank bridge on every river, laid by the world on its straightest reach clear of the ford (`w.crossings`, `w.bridges`, `w.bridgeAt`; east to west or north to south, 4, 5 or 6 tiles by the river's width), drawn with the ground, and nobody wades on its deck. It is not a Building board piece (his reasons: nobody needs one, it must fit its river, it belongs to the path). The ford's stones are his pictures. Seen in the pane: the hero on a bridge, the stones. Not done: a village path led to a bridge; beasts and villagers still show as wading on a deck.
