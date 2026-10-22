# Settlements: one grammar from the farmstead to the great town

**A proposal (2026-10-22), waiting for Robin.** Robin's brief, shortened: villages and towns that feel natural, are fun to
explore (different paths, secrets), fun to raid (destructible things, several ways in, an interesting layout), and come from
one strict process that scales, so the generator rolls a farmstead, a village, a bigger village, a town or a great town at
random and each is good. He asked for research online first; what it gave is in section 1, the sources are at the foot.

This builds on what stands: `docs/villages.md` (the ring plan round the yard), `docs/raid-build-plan.md` (the ten steps, all
built), `docs/destruction.md` (what gives to what), `docs/world-shape.md` (the waters, the lifecycle of a raided place) and
`src/village.js` as it is. **Nothing here is built.** Where it touches a decided thing it keeps it and says how. Robin's
decisions are marked as his; the rest is mine. The current chapter is 1; this is chapter 2 and 3 work, written down now so the
structure is settled before the villages are made over.

## 0. The short answer

**A settlement at every size is the same five things, nested.** A *focus* (what the place is centred on), a *spine* (the way
you move through it), the *units* hung on the spine round the focus, an *edge* (the fence or wall, drawn last so it hugs what
grew), and the *outside* (fields, graves, the shore, the midden). What changes with size is **what the unit is**: in a
farmstead the units are buildings round one yard; in a village the units are farms, each the farmstead of the step below, along
a street or round a green; in a town the units are plots in blocks between streets, grouped into quarters; in a great town the
quarters themselves are the units round a walled hall. So the generator is one routine that calls itself one level down, and
the scale ladder is a table of numbers, not new code for each size.

**The place is grown, not laid out.** The oldest unit is set first on the best ground; each next unit goes where an interest
map says (near the road, near water for fishers, on flat ground, not too close to the last), and the road is extended to it;
the fence comes last round whatever stands. This is what the research says makes a settlement read as natural: you can see how
it grew. It also kills the "mathematical" look Robin named on 2026-10-07 (equal spokes, a perfect oval): the shape comes from
causes (a kept oak, a rock, the slope, the shore), never from an angle step.

**Exploring and raiding are a layer laid over the plan, with a budget and an audit.** Every place above a farmstead has at
least one loop, a landmark seen from the gate, a number of secrets by its size, loot in several places with the prize deepest
in, and at least three ways in of different noise and time. A headless test prints these per place and marks `!!` where a rule
is broken; the generator fixes the place up (adds a lane, a gap, a secret) and tests again. Nothing is left to luck.

## 1. What the research says, and the lesson for us

### How the real places were built

- **The farm (gård) was the unit of everything.** At Vorbasse in Jutland, the best-dug Viking village, the eighth-century
  village was seven fenced farms of about equal size either side of one road, each farm with a main hall, workshops round it,
  some with a well, one with a smithy; the fences ran on into long strips in the fields. Danish villages averaged about ten
  farms (three to over forty) and were of three forms: the **winding street village** (farms strung irregularly along a road
  that follows the land), the **green village** (farms round an open common, the *forte*, with the pond and later the church),
  and a few planned geometric ones. Villages wandered a little every hundred years or two until the late Viking age, then
  stood still round the church. **Lesson:** our ring plan is the farm. A village is several farms, each with its own small yard
  and fence, along a street or round a green, with the shared things (the well, the big fire, the smithy, the stone) on the
  common. Today's "village" archetype is one farm with too many houses.
- **The trading towns were plots on a street or a shore.** Ribe was one main street with 40 to 50 plots on both sides, each
  about 6 to 8 m wide and 20 to 30 m deep (4 to 5 by 13 to 20 tiles), the short side to the street, workshops and pit-houses
  behind. Birka's plots were about 6 to 8 by 10 to 15 m facing the harbour. Hedeby, the biggest (24 hectares, about 1,500
  people around 900), had a brook through the middle later planked into a canal, streets at right angles parallel to it, the
  east-west streets running down to jetties, small houses tight in a grid, a semicircular earth rampart on the three land sides
  and the water on the fourth, a small fortress and a hill fort above the town, cemeteries both inside and outside the wall, and
  it grew from a small shore settlement to fill the whole rampart over a century. In the medieval towns that followed, the
  **burgage plot** is the same thing: a narrow strip with its short front on the main street, running back to a lane, with the
  house at the front and the well, midden, animals and workshop behind; a lord laid out a wedge-shaped market at one end and the
  plots along the street in one go, and later lords added plots along a new street. **Lesson:** a town's unit is the plot in a
  block between streets, gable to the street, the private things behind. One main street from the gate to the market, cross
  lanes to the water, and the wall round whatever has been built. A town is bigger than one screen and should be.
- **The forts were geometry on purpose.** Trelleborg is an exact circle 136 m across with four gates at the compass points,
  two axial streets crossing in the middle, a ring street inside the rampart, and sixteen 30 m longhouses in four squares of
  four. The Anglo-Saxon **burhs** (Wareham, Wallingford, Cricklade) are rectangular ramparts with a street grid, a street
  running inside the wall all round, and the market inside a gate. **Lesson:** the one place that may be regular is the king's
  or jarl's fort, and its regularity is the point (it reads as power). Everything else grew.

### How the good generators do it

- **Watabou's Medieval Fantasy City Generator** (its source is public) builds a town in this order: Voronoi patches from
  points on a spiral (6 patches a small town, 10 a large town, 15 a small city, 24 a large city, 40 a metropolis), the central
  patch the plaza, the inner patches the walled city, a curtain wall round them with gates, streets as shortest paths from each
  gate to the plaza, then **wards typed by rules** (the market at the plaza; gate wards at the gates; craftsmen most common;
  slums as far from the centre as possible; the patriciate beside a park and never beside a slum; farms outside), then lots by
  **recursive bisection** of each ward with alleys cut between the halves (streets three widths: main 2.0, regular 1.0, alley
  0.6; one lot in twenty-five left empty; outside the wall buildings thin out with distance from a road). **Lesson:** a town is
  wards with characters placed by rules, streets gate-to-market first, lots cut inside the blocks. This is the town layer we
  lack, and it is a hundred lines, not a system.
- **Villages on terrain** (Emilien and others, 2012; the paper itself was behind a block, the summary is from its citations):
  settlements are grown by **interest maps**, one per criterion (near a road, near but not on top of other houses, flat, near
  water, on a height for the fortified kind), weighted by village type; the next house goes at the best score, a road is grown
  to it as the cheapest path over the land (slope and water cost), and the two steps alternate: a new road attracts houses, a
  new house extends the road. **Lesson:** growth in rounds with an interest map is the step that makes a place look like it
  happened. It replaces our fixed slots.
- **Minecraft's villages** grow from a centre along streets: a street piece asks a pool for a house piece to attach to its
  open side, pieces have connectors, growth stops at a depth (nine by default) and open ends get a terminator piece. **Lesson:**
  on a tile grid, "the street asks for a house" is the cleanest way to hang units on a spine.
- **The GDMC settlement competition** (algorithms that must build a settlement on an unknown map) judges on four things:
  adaptation to the terrain, functionality (every part reachable, doors, paths, protection, food), **a believable story**
  (could you say what sets this place apart, can you see how it developed), and looks (consistent, with enough variation). Its
  list of common failures is our checklist of what not to do: repeated identical buildings; roads laid without regard to the
  ground; large areas flattened; **settlements built only in their final state with no sense of how they developed**;
  independently rolled elements that never interact; buildings without usable doors or paths. Its advice: simulate a building
  history in stages. **Lesson:** the audit (section 7) is built from these.
- **Caves of Qud** rolls each village a history and a culture first and lets those drive its architecture, people and
  stories; its history is generated as events and rationalised afterwards. **Lesson:** roll a place's *story* before its shape
  (section 6) and let it bias the pools; that is what makes two villages of one size read differently.

### What makes a place good to explore

- **Legibility** (Kevin Lynch, *The Image of the City*): people read a place as *paths*, *edges*, *districts*, *nodes* and
  *landmarks*. A place with all five is one you can hold in your head. **Lesson:** give every settlement one landmark seen from
  the way in (the hall's roof and smoke, the bell tower, the watchtower, a great tree, the banners), nodes where paths meet (the
  fire, the well, the gate, the market), a clear edge, and, at town size, quarters that look different.
- **Loops and hubs** (the Level Design Book; GRAVEN's design blog; Dark Souls as the usual example): a loop lets you go on
  without going back; a hub with spokes gives structure and a resting beat; an arena with several entrances gives tactical
  choice; a loop that closes too neatly feels contrived. **Lesson:** every place above a farmstead has at least one loop (the
  street and the lane behind the farms), a town a figure of eight, and the loops close on a cause (the lane exists because
  people walk behind their houses to the midden), not for the player.
- **Denial and reward** (a 2026 SMU thesis built in Skyrim's Creation Kit): a hierarchy of landmarks (global, regional,
  local), an obstacle between the player and what he sees, and a reward on arrival in proportion to the obstacle, paced.
  **Lesson:** you see the hall's roof from the gate, but the way to it bends past the market, the well and the smithy, and its
  precinct has its own fence.
- **Secrets** are fair when **cued**: a secret with no cue feels like luck; a secret in plain sight is no secret. Rewards need
  not be big but must feel worth the finding. **Lesson:** every secret in the pool carries its cue (section 5).
- **Stardew-style top-down maps** (Tael's modding guide, the only design write-up of Pelican Town found): build round a focal
  point; **put the roads where people actually walk** and pave only the busy ones, let the quiet ones stay dirt; light the main
  road only; clutter the yards; asymmetry holds the eye; too much detail is noise; hide alternative paths behind weeds so the
  player remembers "clearing" them. **Lesson:** the roads' wear comes from the villagers' own routes (section 2, step 9).
- **The Witcher 3's villages** read as real because of local materials, marks that imply history ("scratches and scars"), and
  people with routines. **Lesson:** age marks by rule (a mended run of fence, a burnt stump, a newer house in paler wood).

### What makes a place good to raid

- **Hitman and Dishonored** (IO's "levels as social spaces" talk is behind GDC's wall; the framing below is mine from how
  the levels play): a sandbox level is **layers of permission**: a public layer anyone may walk, a semi-private layer where you
  are watched, a private layer where you are a trespasser, and the prize at the centre. Several routes, all viable, each a
  different cost; exits that become entrances; landmarks so you know where you are. Deus Ex's warehouse is the textbook: the
  street, the back door, the basement, the roof. **Lesson:** the zones already half exist in play (a town at peace lets the
  unarmed in; a drawn blade is a threat). Make them part of the plan: the gate, market and shore are public; the yards and lanes
  semi-private; the hall's precinct and the storehouses private; the back room, cellar and crypt the prize.
- **Rust's base design** is the raider's economics: the raider takes the cheapest route in, so a good base prices every route
  about the same and above the loot; a door behind a door at every entrance. **Lesson:** turn it round for us: every place has
  at least three ways in that are **priced differently** (time to get through, noise reach, who sees it), so the raid is a
  choice, and the audit prints the prices.
- **Bannerlord's siege scenes**: bigger fortresses have more entrances, gates and positions, giving both sides options;
  chokepoints are placed on purpose; the designer walks the map to check scale and travel times. **Lesson:** ways in and the
  defence's posts come from the same plan graph (gates, nodes, the landmark), and the carry time from the prize to the shore is
  a number the generator knows.

## 2. The process, in order

What the generator does for every settlement, in this order and no other. Each step takes the result of the one before. Steps
1 to 4 and 10 to 12 are new; 5 to 9 are the ring plan generalised. The whole is still `Village.make(seed, site, opts)` in and
the same `V` out.

**1. Read the site.** From the island: the flat ground, the shore line and its direction, the stream if any, the slope, the
kept trees and rocks over a size, the sun side (south), the road that may already pass (`Village.plan` knows the other sites).
Make three maps over the site: *flat* (buildable), *wet* (shore, stream, marsh), *high* (the best spot for the hall or the
lookout). Nothing is flattened: a unit that does not fit moves (the GDMC rule).

**2. Roll the identity.** Tier (section 3), wealth, shore, water and ring (as now), and three new rolls: the **shape family**
(street or green; a shore row for a shore place; a fort for a seat of the highest tier), the **story** (section 6: the one
thing that sets this place apart), and the **age** (new, settled, old: how many growth rounds show their layers). A place is
still saved as its numbers and regrown.

**3. Place the focus.** The thing the place is about, on the spot the maps say: a farm's yard with its fire on the flattest
patch; a village's green with the well, the big fire, the stone, and a pond where the ground is wet; a town's market square
where the way in from the land meets the way in from the water; a seat's hall on the *high* spot facing south. The focus is
never at the geometric centre of the site. It is where it is for a reason the player can see.

**4. Lay the spine.** The road graph: from the way in (the gate side, or the water) through the focus to the way out (the
back gate, the fields), as the cheapest path over the maps (flat cheap, slope dear, wet dearer, a kept tree impassable). A
street village's spine bends with the land; a green village's splits round the green and joins again (the first loop); a shore
row's runs along the shore a few tiles up with short runs down to the jetties; a town's is gate to market to hall, plus cross
lanes from the market to the water, plus the lane inside the wall. The spine is a list of polylines with a class (main, lane,
path) and the class sets the width and the wear later.

**5. Grow the units in rounds.** The unit of this tier (a building, a farm, a plot, a quarter) is placed one at a time:

- The **first** unit is the leading one (the longhouse; the chieftain's farm; the hall's plot) on the best spot by the focus.
- Each **next** unit scores every candidate position on an interest map: near the spine (+), facing the focus (+), on flat
  ground (+), near water if the unit wants it (a fisher's farm, the boathouse) (+), too near another unit (−), behind another
  unit's back (−), on the sun side for a home (+). The best scoring spot wins with a little noise so two rolls differ. If no
  spot scores, the spine is extended by a lane toward free ground and the round is tried again (the street grows because the
  village grew: Emilien's alternation, Minecraft's "the street asks for a house").
- Units are **oriented to the spine or the focus**: a house's gable and door to the street or the yard (as now); a plot's short
  side to the street.
- The round count is the tier's unit count, times the age (an old place has had more rounds and shows a second wall line or an
  abandoned plot; a new one is sparse with raw wood).

**6. Fill the units with the step below.** A farm unit calls the farm plan (today's ring: longhouse north, houses round the
yard, outbuildings behind, the small fence) in its own lot. A plot unit calls the plot plan: the house at the street front,
gable to the street, the yard things and a pit-house or workshop behind, the midden at the back lane. A quarter unit is cut into
blocks by its lanes and the blocks into plots by **recursive bisection on the tile grid** (Watabou's cut, square-cornered because
our walls are axis-aligned): cut the longest side at 40 to 60 per cent, leave an alley between the halves while the half is big,
stop at the plot size for the quarter's kind, leave one plot in twenty-five empty (a garden, a ruin, a paddock).

**7. Draw the edges last.** The fence or wall goes round what grew, hugging it as the stake polygon already does (2026-10-21):
the rail or wattle fence round a poor farm, the stake ring round a rich one, the earth rampart with a palisade or the cut-stone
wall round a town on its land sides only, open to the water where the shore is the edge (Hedeby). Gates go **where the spine
crosses the edge** and nowhere else: the main gate on the way in, the back gate on the way out, a water gate or none on the
shore. Inner edges the same way: the hall's precinct ring inside a seat or a town, the churchyard's wall, a farm's own fence
inside a village. An old place may show the **old edge** as a line of stumps or a bank inside the new one.

**8. The outside.** Fields in strips on the flattest side outside the edge, running on from the farms' fences (Vorbasse);
the hay meadow; the grove left standing; the grave field or mound beyond the fields (a town's cemeteries both inside and
outside the wall); the midden behind; the shore things (boathouse, jetty, racks, the beached boat); at a town the **suburb**
outside the main gate (three to six houses and an inn or a smithy, thinning with distance) and the toll post.

**9. Wear the ground from the people's routes.** Place the people and their spots as now (door, well, fire, work, field,
shore, gate). Then **walk them**: find the way between every pair of a household's spots on the nav grid and add one to every
tile passed. The ground is painted from the count: the busiest tiles the road's earth and gravel, the middling a worn path, the
rare ones grass with a dab. The one winding road Robin asked for on 2026-10-07 comes out of this by itself, wide in the yard
and narrow at the gates, because that is where everybody walks, and the lane behind the houses comes out as a faint path to the
midden. Pave (gravel, planks over the wet) only the main class.

**10. Dress.** Materials by wealth and tier (the table in the Art Director's `out/villages/03_faces/NOTES.md`), the age
marks by the age roll (a mended pale run, a charred stump from the story, a newer house in paler wood, moss on the old wall),
nature kept wherever a unit did not take it, the things against walls and at doors from the pools, the story's props (section
6), and the landmark made to stand out (the hall's smoke, the tower, the banners).

**11. The raid and exploring layer** (section 5): zones from the edges (public, semi-private, private, prize); the ways in
counted and priced; the loot placed by zone with the prize deepest; the secrets drawn from the pool to the tier's budget, each
with its cue, at least one of them a way in; the defence's posts from the nodes (gate, focus, prize door, landmark) and the
rounds along the spine's loop; the tactic rolled as now.

**12. Audit and fix up** (section 7). The checks run on the finished place. A broken rule is fixed by the cheapest change
(a lane added, a weak run of fence, a secret, a prop moved out of a door) and the audit runs again, at most three times; then
the place is saved as its numbers.

## 3. The scale ladder

One table of numbers, read by the one routine. The unit of a tier is the whole of the tier below. Sizes in tiles (1.5 m);
buildings as `BUILD` has them (a house 4 by 6 to 9, a longhouse 5 by 14 to 18, a hall 6 by 20 to 22). The people are the drawn
count as now (a third outside), not the real population. The ring-1 and ring-2 tiers are for later chapters.

| Tier | What it is | Unit and count | Focus | Spine | Edge | Site |
| --- | --- | --- | --- | --- | --- | --- |
| **Farmstead** | one household (today's) | buildings: the longhouse and 2 to 3 outbuildings round the yard | the yard's fire | one road in, through the yard, out the back | a rail or wattle fence, a gate; a stake ring if rich | 34 by 26 |
| **Hamlet** (small village) | two or three farms that share a fire | farms 2 to 3, each the farmstead above with a small yard and its own low fence or none | the shared fire and well between them | one short street | none round the whole, or a low fence | 44 by 32 |
| **Village** | a street village or a green village | farms 4 to 8, each fenced; one has the smithy, one the bathhouse | the green (*forte*): well, big fire, the stone, a pond where wet; or the widest bend of the street | the street (bends with the land) and the lane behind the farms: a loop | the farms' fences; a fence round all at wealth 0.5; the stake ring at 0.7 | 60 by 45 |
| **Chieftain's seat** | a village with the hall's precinct | the village above plus the hall unit (hall, storehouse, the chieftain's house) on the high spot | the hall's door and the green below it | the street from the gate to the green to the hall's gate; the lane round | the stake ring round all with banners; the hall's own ring inside; Tingvoll's kind has no wall at all | 70 by 50 |
| **Trading post / fishing town** | a shore row | plots 6 to 12, 4 to 5 wide by 8 to 12 deep, short side to the shore street, racks and workshops behind | the market strip between the street and the water, the stalls | the shore street a few tiles up from the water, short runs down to 2 to 3 jetties, a road inland | open to the sea; a fence or ring on the land side | 60 by 40 |
| **Town** (ring 1, the south) | a walled town round the jarl's hall and a church | quarters 4 to 6, each 3 to 8 plots: the gate quarter, the craftsmen's street, the hall's precinct, the church's precinct, the harbour, the poor quarter by the wall | the market square: stalls, a well, a cross, the laid tables at the feast | the main street gate to market to hall; cross lanes market to water; the lane inside the wall; a figure of eight | the cut-stone or rampart wall on the land sides, 2 to 3 gates, a watchtower; the hall's and the church's own walls inside; a suburb outside the main gate | 90 by 70 |
| **Great town** (ring 2; the Kaupang, the Gold Hall) | a harbour town with a king's hall | quarters 8 to 12 round a citadel; several jetties; two churches or a temple; the Thing place | the hall's precinct (a Trelleborg-like fort or a stone ring) and the market below it | gates at three compass points, axial streets, the ring street inside the wall, lanes to the jetties | an outer rampart with a palisade, the inner fort; a mound field and cemeteries outside | 130 by 100 and up |

| Tier | People (drawn) | Landmark | Ways in (at least) | Secrets | Loot spots | Men (as `DEFENCE`) |
| --- | --- | --- | --- | --- | --- | --- |
| Farmstead | 3 to 5 | the longhouse's smoke | 2: the gate, a gap or the back | 0 to 1 | 2 | 0 to 1 |
| Hamlet | 6 to 9 | the fire's smoke, a tree | 2 to 3 | 1 | 2 to 3 | 0 to 2 |
| Village | 12 to 24 | the stone and the big fire; the smithy's hammer heard | 3: two gates, a weak run, the shore | 2 | 3 to 4 | 2 to 6 |
| Seat | 20 to 30 | the hall's roof and banners on the height | 3 to 4: and the hall's own back gate | 3 | 4 to 5, the chieftain's chest deepest | 6 to 12 |
| Trading post | 10 to 16 | the stall awnings, the masts at the jetties | 3: the road, the water, a run | 2 to 3 | 3 to 4, the stores | 3 to 6 |
| Town | 40 to 60 | the bell tower; the hall's gable over the roofs; the gate towers | 4: gates, the water, the culvert, a wooden piece in the stone wall | 4 to 6 | 5 to 7: house chests, the stores, the hall's back room, the church's silver, the crypt | 14 to 24 |
| Great town | 60 to 100 | the fort on its height; the temple; the ship-setting | 5 or more | 8 to 10 | 8 to 10, two prizes | 30 to 40 |

What the lore names fits as **templates** on these tiers (fixed families, generated seats): **Tingvoll** a seat without a
wall and a Thing place on its green; **the Kaupang** a great town of the harbour kind under the market peace; **Tyrsholm** a
town of stone on its own island with the arena as its second focus; **Skuggaby** a town whose lanes are roofed (a roofed lane
is a street class with a roof piece over it); **the Silver Hall** Jarl Önund's town; **the Gold Hall** a great town with the
fort. A template fixes a few features and lets the rest roll. The names and what folk say of them are the Lore Director's.

## 4. Natural: the rules

- **The land first.** No unit on a slope or in the wet; the spine takes the cheap way; a kept oak bends the street; a rock
  ends a fence run a stake short (as now). Nothing is flattened. The shore is an edge, never fenced.
- **One cause per bend.** Every irregularity has a reason the player could name: the street bends round the pond; the fence
  kinks round the smithy; the hall stands apart because it stands on the height. Jitter from noise alone is banned; jitter
  comes from the maps and the growth order.
- **Growth shows.** The oldest unit is the biggest and best placed; the newest is at the edge in paler wood with a raw fence;
  an old place has an inner line where the first fence stood, an abandoned plot, a grave field grown large. The GDMC judges'
  question, "can you see how it developed", is answered yes.
- **Roads are wear.** The ground is painted from where the people walk (step 9), never drawn as a shape. Busy earth, worn
  paths, faint tracks; gravel and planks only on the main class.
- **Hierarchy of streets.** Three classes as Watabou's: the main street about three tiles of worn ground, a lane one and a
  half, a path a dab wide. A town's blocks are cut by lanes, not streets.
- **Materials from the place.** Wattle and turf for the poor, planks and thatch, logs and shingles, stone and slate for the
  hall and the church (the Art Director's table); stone where stone is near (the dry-stone wall by the rocks); red tile only in
  the south if Robin keeps it. The same roof everywhere is the first failure on the GDMC list.
- **Fronts and backs.** Every unit has a front (the door, the step, the bench, the window box) to the spine or the focus and
  a back (the midden, the woodpile, the washing, the pit-house) to the lane or the fence. The back is where the raider goes.
- **Asymmetry on purpose.** The focus is off the site's centre; the gate is off the fence's middle; the hall is not on the
  axis of the gate. A thing is centred only in the fort, where it means power.
- **One place, one odd thing** (section 6). Two villages of one tier never read the same.
- **Not too much.** Robin's "lived-in like the reference, not a cleared green" stands, and so does the Art Director's
  "nothing cute": clutter in the yards, quiet in the fields; detail where the eye rests (doors, the fire, the gate), none where
  it does not.

## 5. Exploring and raiding: the layer

### Zones

The edges drawn in step 7 make the zones, outermost first:

1. **Public:** outside the edge, the gate, the market or the green, the shore and the jetties, the main street. A stranger
   walks here unarmed; the men watch (built: a town at peace lets you in alone).
2. **Semi-private:** the yards, the lanes behind the houses, the fields. A stranger is looked at; a villager may ask what you
   want (a line, `LORE?`); taking anything here in sight is theft (built).
3. **Private:** inside an inner edge: the hall's precinct, the storehouse, the church's chancel, a locked house. Here you are a
   trespasser: the men challenge an unarmed man too, and a drawn blade is a fight.
4. **The prize:** the hall's back room, the cellar, the crypt, the chieftain's heavy chest, the reliquary. Always the deepest
   by walking time from the main gate and from the shore, and always with a second way to it (a back door, a trapdoor, a
   window) that the raid plan's "sneaking in" uses.

The zones are data on the plan (a polygon per zone) and the people's minds read them: a man's post is in a zone, his pursuit
leash the zone's edge plus a margin, a villager's "Thief!" fires in zones 2 and up.

### Ways in: at least three, priced

Every entrance is a **place on the edge** with a **class** and a **price** the generator can compute from `Ruin`'s table
(seconds to get through for the tool a raider of that ring would have, the noise reach, and who sees it by day and by night):

| Way | Where it comes from | Price |
| --- | --- | --- |
| The main gate | where the spine crosses the edge | barred to a band: the ram, five swings, loud; open to the unarmed by day |
| The back gate | the spine's way out | on the latch at night (built); a man's round passes it |
| The weak run | one run of the ring **mended in pale new wood** (built as a look, 2026-10-21: make it the weak spot in the data), or a stake behind a bush, or a wattle panel in a town's stone wall where a house backs onto it | one stake a few blows, little noise; seen only from the lane |
| The water | a shore place's open side; the boathouse's water door; a town's harbour lanes | quiet; the karve lies off it |
| The culvert | a town with a stream: the planked channel under the wall (Hedeby's brook) | quiet, slow, wet; found by the cue |
| Through a house | a wattle back wall against the fence; burn or chop into the house, out its door into the yard | fire is loud later, not now |
| Over nothing | there is no climbing in 2D, so none |

The audit demands the count by tier and **at least three distinct classes**, and that no two share the same price band. If
the roll gave only gates, the fix-up adds a weak run on the side away from the gate. Rust's lesson turned round: the raider has
real choices because the routes are priced apart, and the quiet one is always there to be found.

### Loot spread and the carry

Loot spots by tier (the table above), placed by zone: a chest in every house (zone 2), the stores (zone 3), the prize (zone 4).
The generator knows, for every spot, the walking seconds to the nearest shore the karve can lie off and the number of men whose
noise reach covers it. That is the raid's difficulty in two numbers a spot, printed by the audit, and `tests/loot.js` reads them
against `Village.lootOf`. Robin's rule stands: the walk to the shore is the gamble, so the prize is far from the water, but a
back door or the water lane makes the carry a route choice.

### Destructible with a purpose

Everything that gives (the `Ruin` table) is placed so that breaking it changes the plan, not just the picture:

- **Thatch clusters downwind of the prize.** A fire set at the right roof runs along a row toward the hall; the wind decides
  (built). The generator places one such chain a village and prints it. The well's reach (320 units, the brigade) is a circle on
  the plan: what lies outside it burns.
- **A broken wall is a new lane.** A wattle house against the fence is a way in once its back wall is down, so the plan has
  one such house per edge side.
- **A broken door opens a zone.** The hall's gate, the storehouse's door, the back room's lock: each is an edge between zones,
  so the men's leashes and posts change when it gives (the men behind a full gate go round, built).
- **The ring's stakes come down one at a time** (built) and the gap is a way in for the men too; the audit checks that a gap
  anywhere lets a man reach the yard without a wall in his way, so breaking in never leaves the defenders stuck.

### The defence from the plan

`Village.DEFENCE` and `tacticOf` stay. Posts are no longer the one pattern but **the nodes**: a man at each gate, men at the
focus, the hall's men at the prize's door, a bowman on the landmark (the watchtower or the hall's gable), the day watch's round
along the spine's loop, householders at their own doors (built). A town's quarters each have a man, so the alarm travels as the
raider moves. Because the posts come from the nodes, a seat and a town that grew differently are defended differently, and the
player can read the defence by reading the place.

### Loops, landmarks, denial

- **Loops:** the walkable graph of the spine must have at least one cycle above the farmstead (the street and the lane behind)
  and two in a town (the figure of eight). The lane exists because of the midden and the washing, so it is a cause.
- **Landmark from the gate:** a line from the main gate to the landmark crosses no roof taller than the landmark's drawn
  height; the hall's smoke and the bell tower are drawn above the roofs; a banner pole stands where the hall itself is hidden.
- **Denial:** the direct line from the gate to the prize is always blocked by an inner edge or a building, so the way there
  bends past at least two nodes. The hall is seen from the gate and reached in two turns.

### Secrets: a budget with cues

Drawn from this pool to the tier's count, at least one of them a way in. Each is placed where it belongs and **cued** so a
careful player finds it and a hurried one does not. Nothing is marked on the chart until seen (Robin's rule).

| Secret | Where | Cue |
| --- | --- | --- |
| The cellar under the rug (built) | one house, the richest below the hall | a rug in a house that should have none; a villager who stands on it |
| The storehouse loft (not built) | the stabbur | a ladder against its wall; hanging fish out of reach |
| The crypt (built) | a church at wealth 0.35 and up | the trapdoor's seam behind the altar; a candle set on the floor |
| The hall's back room (built) | the hall's end | the locked door; the men who stand nearer it than the fire |
| The cache in the midden, the woodpile or the haystack | behind the longhouse | a spade left in it; a crow; a child's line ("father hides things") |
| The well's bottom | the well | a second rope tied off; "rarely, something dropped in it" (`villages.md`) made a roll |
| The hollow mound | the grave field | a cairn with a fallen stone; the reputation cost stands (built) |
| The villagers' shortcut | a gap in the ring behind a bush, a plank over the ditch | a worn path (step 9's wear) that runs to the fence and stops; trampled grass |
| The culvert | a town's stream under the wall | the planked channel; the sound of water at the wall's foot |
| The boathouse's water door | a shore place | the boat drawn half out; wet planks |
| A bound thrall (built) | by the hall | his line |
| The runestone's line, a note in a chest (built, `LORE?`) | the edge, a chest | the stone itself |
| A half-made weapon on the smith's bench (built) | the smithy | the bench |
| The empty plot's old cellar | a town's one-in-twenty-five empty plot | nettles in a square; a sunk floor |

### The twenty-minute measure

Robin's raid is about twenty minutes (2026-10-07). The plan gives the generator the walking seconds gate to prize and prize to
shore, the number of doors on the way and the men in reach; `tests/battle.js carry` already measures the carry on the Battle
test's town. The audit prints the same for every generated place so a seat and a town are tuned by numbers, not by eye.

## 6. Variation without chaos: the story roll

Rolled in step 2 before any shape, so the shape serves it (Caves of Qud's lesson, the GDMC's "could you say what sets it
apart"). One per place; it biases the unit pool, the props, the loot, the people's callings and the lines (`LORE?`, the Lore
Director's to fill: a story has its words). First pool, mine:

| Story | What it changes |
| --- | --- |
| **Raided before** | charred stumps in the ring, a mended run, graves fresh, a new palisade, more men, the elder's line; ties to `seen.raids` and the lifecycle in `world-shape.md` |
| **The smith's place** | two smithies or a bloomery, charcoal pits, slag heaps, iron in the stores, a smith who talks |
| **The ferry or ford** | the street ends at the water and starts again on the far bank; a boat on a rope; travellers at the fire |
| **The seal hunters** | racks of skins, a beached boat, oil in barrels, no fields |
| **The horse farm** | a paddock fenced large, a byre over-size, a trough at the gate |
| **The brewer's** | barrels everywhere, a bathhouse, a laid table most days, the feast dish |
| **The shipwright's** | a hull on stocks by the shore, timber stacked, a saw pit; a boat to take |
| **The widow's farm** | one house kept, the others falling, many graves, one woman, a hidden cellar full |
| **The pilgrim church** | a way cross at the road, a hostel plot, beggars, a reliquary richer than its size |
| **The outlaw's hamlet** | no fence but a ditch, men who are not householders, stolen things in the stores, no priest, no trader |
| **The old seat** | a hall too big for the place, a grown-over ship-setting, a stone with a line, poor now |
| **The market day** | a trading post with tents and carts outside its edge today, twice the people, a toll man |

An **age** roll (new, settled, old) sits beside the story and sets how many growth rounds show.

## 7. The audit (a test, then a fix-up)

`tests/settlement.js` (new) rolls many places of every tier and prints one line a place, `!!` where a rule is broken, in
the project's way (values, no assertions). The fix-up in step 12 is driven by the same checks.

| Check | Rule |
| --- | --- |
| Walkable | every door reachable from the main gate without crossing a shut edge; every unit touches the spine |
| Loops | cycles in the spine graph at least 1 above the farmstead, 2 in a town |
| Ways in | at least the tier's count, at least three classes, no two in one price band |
| Landmark | seen from the main gate (the line crosses nothing taller) |
| Denial | the direct line gate to prize is blocked; the way there passes at least two nodes |
| Secrets | the tier's count from the pool, each with its cue in place, at least one a way in |
| Loot | spots by tier; the prize deepest by seconds from the gate and from the shore; the carry time printed |
| Noise | for every loot spot, the men within noise reach; printed beside `lootOf` |
| Fire chain | at least one row of thatch downwind-capable toward the prize; the well's circle drawn |
| Terrain | no unit on slope or wet; the spine's cost under a bound |
| Variety | two rolls of one tier differ in story, shape family and at least a third of the unit positions |
| Doors | no prop in a door's step; no door into a wall or the water |
| Size | the site used, the place wider than one screen above the hamlet |

## 8. How it maps onto the code we have

What stays, what changes, in an order where each step is playable and tested, and nothing of chapter 1 moves.

1. **The farm as the unit.** `Village.make`'s ring plan becomes `farmPlan(lot, ...)`: the same code, called for a lot instead of
   the whole site, returning the same pieces into `V`. The farmstead archetype is unchanged in play. (A day.)
2. **The site maps and the spine.** `siteMaps(env, site)` (flat, wet, high) from `World`; `spine(maps, from, to)` as a
   cheapest path on the tile grid; `V.spine` as polylines with a class. `road()`'s Catmull-Rom dabs stay as the painter for a
   polyline. The one road in the farmstead comes from the spine now and looks the same. (Two days.)
3. **Growth in rounds with the interest map.** `grow(V, unitKind, n)` replaces the slot shuffle for the hamlet and the
   village: farms placed one by one, the spine extended when none fits. The Village Editor shows the rounds as a slider so
   Robin watches a village grow. (Three days.)
4. **Wear from routes.** The people's spots exist; `wear(V, nav)` walks the pairs and paints `V.paints` from the counts.
   `pathGravel` and `yardEarth` in `DEF` become the thresholds. (Two days; the nav grid is built already.)
5. **The edge last.** The stake polygon's rule generalised to the rail and wattle fences and to inner edges; gates where the
   spine crosses. The town wall stays axis-aligned (a breakable wall), notched to the quarters. (Two days.)
6. **The town layer.** `quarters(V)`: blocks from the spine's lanes, `bisect()` on the tile grid, plots filled by `plotPlan`,
   wards typed by rules (the market at the plaza, gate quarters, craftsmen on the main street, the hall's and the church's
   precincts with their own walls, the poor by the wall, the suburb outside). `town` and `bigtown` in `ARCH` take the new
   numbers; `great` and `bigtown` as trial sizes retire. (A week.)
7. **The layer.** `zones(V)`, `waysIn(V)` priced from `Ruin`, `secrets(V)` from the pool with cues, posts from nodes into
   `Village.garrison`, the fire chain. The men's minds read the zone of their post. (Four days.)
8. **The audit and the fix-up.** `tests/settlement.js`; `fixup(V, report)`. `tools/visual/villages.js` renders each tier with
   the zones and the ways in drawn over it for Robin. (Two days.)
9. **The story roll** and its props; the lines asked of the Lore Director. (Two days, then the studios' work.)

Robin's checkpoints: after 3 (a village grown, in the editor), after 6 (a town walked), after 8 (a raid on each tier by the
bots, the audit's numbers beside `docs/baselines/`).

## 9. Questions for Robin

1. **Farms in a village keep their own fences** (the real way; it makes yards within the yard and more ways in) **or one
   fence round all** (today's way, simpler to read)? Mine: both, by wealth and shape family: farms fenced in a street village, one
   ring round a green village at wealth 0.5 and up.
2. **Growth shown or hidden:** should the player ever see a place grow (the lifecycle at a season turn adds a unit by the same
   rounds) or only find it grown? Mine: the same routine runs one more round at the turn, so a place that is let alone visibly
   grows.
3. **The town's stream:** a stream through a town (and the culvert under its wall) wants a stream on the island first. Worth
   it for the south's towns?
4. **How many secrets are too many?** The budget above is mine; a town with six may feel like a dungeon.
5. **Which stories first?** Twelve are listed; four or five would do for chapter 2's villages.
6. **Tingvoll without a wall and the Kaupang unraidable** are the lore's; the generator needs to know which features a template
   fixes. Is a template's list the Lore Director's to write with me?

## Sources

The real places: [Hedeby (Wikipedia)](https://en.wikipedia.org/wiki/Hedeby), [Hedeby (World History
Encyclopedia)](https://www.worldhistory.org/Hedeby/), [Hedeby and the Danevirke (UNESCO)](https://whc.unesco.org/document/168709),
[Vorbasse, Hvass's report (Journal of Danish Archaeology)](https://tidsskrift.dk/jda/article/download/125876/10/265218),
[Vorbasse summary (The Vikings: a very short introduction)](https://erenow.org/postclassical/the-vikings-a-very-short-introduction/4.php),
[Ribe's plots (Feveile)](https://arca.unive.it/retrieve/e4239ddb-413b-7180-e053-3705fe0a3322/07_feveile.pdf), [Viking-age early
towns (Fjorn the Skald)](https://fjorntheskald.com/2016/09/09/viking-age-settlements-early-towns/), [Town plots in Norwegian
medieval towns (Medievalists.net)](https://www.medievalists.net/2010/04/occupying-town-plots-on-the-early-development-of-habitation-in-norwegian-medieval-towns/),
[Danish village forms, landsby (lex.dk)](https://lex.dk/landsby), [Trelleborg (Wikipedia)](https://en.wikipedia.org/wiki/Trelleborg_(Slagelse)),
[Viking ring fortresses (Wikipedia)](https://en.wikipedia.org/wiki/Viking_ring_fortress), [Viking-age ring fortresses
(UNESCO)](https://whc.unesco.org/en/list/1660), [Burh (Wikipedia)](https://en.wikipedia.org/wiki/Burh), [Wareham's burh (Historic
England)](https://www.historicengland.org.uk/listing/the-list/list-entry/1003574), [Wareham historic towns survey
(Dorset)](https://www.dorsetcouncil.gov.uk/w/wareham-historic-towns-survey), [The origin of towns (Herefordshire Through
Time)](https://htt.herefordshire.gov.uk/herefordshires-past/the-medieval-period/towns/the-origin-of-towns), [Burgage plots in Scottish
burghs (NLS)](https://maps.nls.uk/pont/subjects/burgh.html), [Burton-upon-Trent's growth (British History
Online)](https://www.british-history.ac.uk/node/5854).

The generators: [Watabou's Medieval Fantasy City Generator, source](https://github.com/watabou/TownGeneratorOS) and its
[devlog](https://watabou.itch.io/medieval-fantasy-city-generator/devlog/1579/some-answers-and-comments), [Parish and Müller,
Procedural Modeling of Cities (SIGGRAPH 2001)](https://history.siggraph.org/?p=116923), [Emilien et al., Procedural Generation of
Villages on Arbitrary Terrains (2012)](https://perso.liris.cnrs.fr/egalin/Articles/2012-villages.pdf), [Lechner et al., agent-based
land use](https://ccl.northwestern.edu/testsite/rp/cities/papers/cities.tr.pdf), [dos Santos et al., road-first growth
(2022)](https://arxiv.org/abs/2211.01959v1), [GDMC settlement generation competition (paper)](https://ar5iv.labs.arxiv.org/html/1803.09853)
and [wiki](https://github.com/mcgreentn/GDMC/wiki/Settlement-Generation), [Minecraft jigsaw structures (Fabric
wiki)](https://wiki.fabricmc.net/tutorial:jigsaw_old) and [Iris docs](https://www.mintlify.com/VolmitSoftware/Iris/advanced/jigsaw-structures),
[Caves of Qud village generation (GDC 2019)](https://www.gdcvault.com/play/1025914) and [history generation (GDC
2018)](https://gdcvault.com/play/1025379/Procedurally-Generating-History-in-Caves), [Townscaper's irregular grid (Boris the
Brave)](https://boristhebrave.com/docs/sylves/1/articles/tutorials/townscaper.html).

Level design: [Level design typologies (The Level Design Book)](https://book.leveldesignbook.com/process/layout/typology), [Landmark
hierarchy and denial-reward (SMU Guildhall thesis)](https://scholar.smu.edu/guildhall_leveldesign_etds/44), [GRAVEN dev blog 7, level
design philosophies](https://apollo.3drealms.com/devblog/graven-dev-blog-7-level-design-documentation-grave), [Lynch's five elements
(studio skills)](https://ecampusontario.pressbooks.pub/studioskills/?p=172), [Natural movement (Koohsari et al.
2019)](https://acuresearchbank.acu.edu.au/item/85vzq/natural-movement-a-space-syntax-theory-linking-urban-form-and-function-with-walking-for-transport),
[How to design secrets and hidden areas (bugnet)](https://bugnet.io/blog/how-to-design-secrets-and-hidden-areas), [Tael's guide to good
map making (Stardew modding wiki)](https://stardewmodding.wiki.gg/wiki/Tael%27s_Guide_to_good_map_making), [The Witcher 3 environment
design interview (GameBanshee)](https://gamebanshee.com/kwaax), [Deus Ex: Human Revolution design analysis
(GameBanshee)](https://gamebanshee.com/kr3), [Dishonored review (GameBanshee)](https://www.gamebanshee.com/x886), [Dishonored 2's
Clockwork Mansion (Kotaku)](https://kotaku.com/a-closer-look-at-dishonored-2-s-clockwork-mansion-1789429571), [Hitman levels as social
spaces (GDC 2019)](https://gdcvault.com/play/1025879/Level-Design-Workshop-Hitman-Levels), [Bannerlord siege scene design (TaleWorlds
dev blog)](https://taleworlds.com/en/Games/Bannerlord/Blog/64), [Rust base design, raid cost
(GameServerKings)](https://www.gameserverkings.com/knowledge-base/rust/rust-base-design.md).
