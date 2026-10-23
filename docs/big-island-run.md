# The big island, played through (2026-10-23)

Clive, GD's run of chapter 1 from the wreck to the boat and on to the big island, on Robin's order of 2026-10-23 ("Do the full
run, but also go to the bigger island and progress as much as you can there. Fix bugs as you go and test things. Write up
anything that you think needs improvement."). Played by script in the pane (`tools/visual/startplay.js` for chapter 1,
`tools/visual/bigplay.js` for the big island), with a look at Robin's size at each place. **Fixed** means fixed in this run;
**Needs** is for the work on the big island that comes next; **Chapter 1** is for the first island.

## Chapter 1, the wreck to the boat

The whole run works: the wreck's planks, the tools, two trees, a rock, grass and berries, a club and a bow, a boar and a deer,
Arnor's story, a hut with a fire, a dish cooked, Arnor teaching the boat, the naust on the wreck's beach, the rowboat built
beside its slipway, Arnor at the shore, a night by the fire (three wolves came, none got through), a sleep, and the crossing
to the big island in 104 s of rowing.

- **Chapter 1, text:** when several things happen close together the toasts stack six high in the middle of the screen
  ("A broken steading: marked on your chart", "Lore added about Arnor", "+1 roast meat", "+1 roast berries", "Something new
  to build", "Little Ash is afloat") and the big-step board "A boat" draws over them and over Arnor's name. This is the
  "how text appears" item of `docs/chapters.md`: one rule for toasts, notes and boards is wanted. "Something new to build" is
  still a toast (the chapters doc thought it gone).
- **Chapter 1:** the shipyard needs 16 wood, 6 fibre and 4 stone, and the rowboat 20 wood and 6 fibre on top: about three
  trees' worth after the house. Fine, but the player gets no word of it until he stands at the water with the piece; the
  Building board's cell shows the cost, which is enough if he looks.

## The big island

### Fixed in this run

- **Old Aslak did not exist.** The first village of the big island is village 0, and the generator could make it a ruin (one
  place in seven outside the seats, towns and churches rolled "ruin"), so on this seed Ketilstun was a ruin with nobody in it
  and Old Aslak, who is made in village 0, was never made. `src/village.js` `plan`: the first place is never a ruin (the roll
  is still made, so no seed's layout moves).

- **Charcoal lay at every village's fire and lantern each dawn** (`morningEmbers` took every fire off the starter island: on
  day 2, 560 lumps lay about the world's twenty-two villages, free for the taking). Now only fires outside any village, or in
  a village you hold, give embers.

- **Villagers stood in a knot.** Three of Ketilstun's folk stood in a tight group at the green's edge, and at Hakonsgard the
  longhouse's three thralls stood on one point at its door with their names drawn over each other: when a chosen spot was
  taken they all fell back to the house door (`folkTick`). Now a taken spot sends a villager to another free spot, and a plain
  standing spot is stood beside by each in his own place (a small offset by his name), so no two stand on one point.

### Needs

- **Three of the four fishing hamlets have no jetty** (Torstensey, Vigdissund, Gunnarssund; only Thorirshavn has one with two
  boats): `jettyFor` found no water close enough below their sites. A fishing hamlet without a jetty and boats is a farm by the
  sea. The settlements' shore strip should carry the jetty for every shore place, or the site move until it can.
- **"Comfort 6" shows in a stranger's longhouse** (the comfort line counts the room you stand in, theirs or yours). It should
  read only in a home of yours, or say whose house this is.

- **The carver's bench needs a roof over it**, so cutting the first rune on the big island means a house there (walls, a door,
  thatch) or the trip home; the ring board says so only once the bench stands. The first copper tool wants the same roof over
  a workbench. Suggest the big island's first village lends its roofs: the smith's forge works a bar, and a rune is cut at the
  village's own carver's bench or at a runestone (E "Cut runes" at the standing stone on the green), until you have a house.
- **The ring board is not in the panels' clothes** (a plain brown board, no plaque, no gilt; the Gear board beside it is oak
  and gilt). The crafting card's look would suit it.
- **The first claim stone is named "Eikstead"**: `raiseStone` names stones from a list by their count and the first lands on
  "Eik" (index 1) because the steading's stone counts. Fine as a placeholder; the names are the Lore Director's (`LORE?`).
- **Arnor joins at your first stone only if you heard his story** (`seen.met`); a player who skipped him gets no first hirdman
  and nothing says why. Suggest the stone's toast say "Arnor would stand here if he knew you" or that Arnor's story be needed
  for the boat (it is: he teaches it), so this cannot happen.

- **The village's wall is a straight stone rectangle.** Ketilstun (a `village`, wealth 0.53) has the `drystone` edge: a
  straight dry-stone wall round the whole site rectangle, 57 by 60 tiles (1824 by 1920 units), one gate a tile wide in the
  south wall and a back gate in the north. Walking at the village from the west you meet 1900 units of ruler-straight wall and
  have to walk along it to find the gate. Against "the ground never looks square" and the look of a Viking farm village (stone
  field walls are British and Irish; Scandinavia fenced in wood, the *skigard*). Suggest: the drystone edge becomes a wooden
  fence polygon like the farm's (`V.fences` runs with kinks and gaps), low enough to read as a boundary, with the gate where
  the road meets it; or no edge at all for a village at peace, only the farms' own fences.
- **Old Aslak has no portrait and no book page**, so his story (four lines, the troll's hill, the little ones, the ring on
  Hogni's arm) goes to the speech board with no talk window and leaves nothing in the Lore Book. He is the big island's one
  named person: a portrait from Colin, AD and a page from Alistair, LD.
- **E at the fire offers "Sit" before "Talk"** when a villager sits on the log beside you: the seat is nearer than the man.
  A person within reach should come first.
- **The whole big island (400 tiles) has three places** on this seed: Ketilstun (village), Torstensey (fishing), Hakonsgard
  (farmstead), all in its south-east. Robin's home water "a lot bigger, with more islands, villages only": the big island
  itself feels empty for its size. Suggest two or three more small places and farms spread round it, and a road or path from
  the village to the mountain's slope.
- **Seven bears and nine moose** roam the big island (counts scale with area). CLAUDE.md says "a bear". Seven is a lot for
  home water; suggest one or two bears with a den, and the moose in two or three small groups.
- **The village lays 91 weapons about the islands at the start** (`layArm`: copper and flint axes, spears and swords for the
  villagers to arm from, `own` by village). They lie in the open and E picks them up: free copper weapons in a village at
  peace, before any copper is smelted. Suggest they lie in the houses, or on the spear rack, or are not real drops until a
  villager runs for one.
- **The troll's cave gives up the ring unseen.** With the troll wandering by his bed, the hero walked the whole way through
  (the hall, the cavern, the columns, the pool, the abyss's bridge) and round the lair to Hogni's body 382 units past the bed,
  took the arm ring and walked out again, never seen (`trollSeesIn` false the whole way in: he sees 230 ahead, 90 behind, and
  he had his back turned). Sneaking past should be possible, but not this sure: the body could lie where he sits, or he could
  sleep on the bed by day and wake to a step within 60 units, or the young could cry out at a stranger by the lair.
- **Copper to a copper tool is a long chain on the big island:** ore from a cliff vein (a pick), the furnace (12 stone), then
  **two charcoal a bar**, and charcoal comes only from embers at dawn by a fire that burned all night, a clamp, a struck tree
  or an old fire ring; then a bar is worked at a **roofed workbench**, so a house on the big island or a trip home. Nobody
  tells the player that the furnace wants charcoal until the board shows it short. Suggest Nanna's second line say it, and
  the first copper tools be made at the furnace itself or at the smith's forge in the village.
- **The adders live far from the mountain:** the nearest of the twelve was 4900 units from the cave, on the island's far side,
  so the first claim stone (6 stone, 4 berries, 2 snake blood) means a long hunt with nothing saying where. Fine as
  exploration if the deer-and-boar country tells you with a sign (a shed skin, a villager's warning line about the heath).
- **The torch's "no torch" toast said "(C)"**, an old craft key. Fixed: "(Tab)".
- **The toasts never time out while the clock runs fast** (script only; a real frame clears them). Not a player bug.

- **The worn ground reads as a grid of blobs** (the fishing hamlet's and the seat's greens: `wear` counts a tile at a time and
  paints each worn tile as a rounded square, so the street is a chain of 32-unit dots). The brush that paints it should blur
  across tile edges, as the other ground kinds do.
- **The seat's green is a birch wood**: Steinarsborg's fire pit, well and stone stand among a dozen birches and oaks kept
  inside the green. Fewer kept trees on the focus, more round the edge.

### Seen and fine

- The jarl's seat's green (Steinarsborg): the fire pit with its log seats, the well, the standing stone, a goat and hens; the
  fishing hamlet's drying racks with fish on them and its big fire.
- The cellar under Hakonsgard's longhouse: the stair, the earth passage, barrels and a crate at the top, lit by the torch.
- The torch: T lights one from the bag (the toast said the old key); it burns by day too, which reads fine.

- The village green at Robin's size: the big fire with its log seats, the well, the standing stone and boulders, the laid
  food table, a goat and hens, villagers at their work and the smith's line "Copper is soft. Bring me bog iron and I will
  show you steel." The worn street. The angled rail fences with sagging rails.
- The slope up the foothills: the stairs cut in the cliff, the slabs lit and shaded, grass on the lip.
- The plateau: the drier fell ground with heather and birch, the rock shelter, the lookout's cairn, the copper vein as green
  streaks in the south face, mined from the ground below it (3 copper from the first vein, `seen.copper` opens the furnace).
