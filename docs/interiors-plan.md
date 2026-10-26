# Inside the buildings: what stands there, how it is placed, what breaks, and the catacombs

**Decided in part (Robin, 2026-10-22: "Yes" to sections 5, what breaks, and 7, the catacombs; both built the same day, `CLAUDE.md` under Destruction and "Room for exploration"); section 6 built; the rest a proposal.** It was a proposal (2026-10-22). Robin's brief, shortened: research how furniture should be placed so a room is
easy but interesting to explore and fight in; what furniture is there and what is destructible; what furniture these places
really had; whether churches should have catacombs as their own instance like the caves; and designs for houses of different
sizes with some randomness, that make sure the player can move about (nothing blocks the door). This follows
`docs/settlements-plan.md` (the places) and `docs/villages.md` (the farm); the destruction rules are `docs/destruction.md`;
the crypt built for raid step 8 is in `CLAUDE.md` under "Room for exploration". What is Robin's is marked; the rest is mine.
Section 6 is built in `src/village.js` (the room templates and the clearance rule); the rest is not.

## 0. The short answer

**A room is a lane, a fire and walls to stand things against.** The door's inside tile and the one beyond it are always free.
A lane one tile wide runs from the door past the hearth to the far end, and nothing solid stands in it. The furniture stands
against the walls, as it did (the benches, the beds, the chests, the loom); the fire stands off the lane on the far half; the
middle of a longhouse is open between its fires. What is worth taking stands at the far end, so a thief crosses the whole
room; what is quick to grab stands near the door and is kicked open with a noise. Every room has one clear circle big enough
for a fight (two tiles in a house, three in a longhouse or a hall), and a long house has two lanes round its fires, so a fight
can circle. The generator builds a room from a template of slots by its kind and size, rolls what fills each slot by the
household's wealth and calling, then rasterises what it placed and checks the lane, the threshold, the circle and that every
thing is reached from the door; what breaks the rule is taken out again, the optional things first.

**What breaks:** the boxes (a kick, the noise, the contents spill), the wooden furniture (the axe, four blows, a little wood,
a lane opened or a niche shown), and nothing of stone. **The catacombs:** yes. The crypt is already its own instance under a
church (raid step 8); it should grow by the church's rank into a catacomb with a loop of chambers, bones in niches, coffins that
open, a gated vault for the relics, and a second way up into the churchyard, which is the raider's way out with the silver.

## 1. What the research says

### What was inside, really

- **The longhouse** was three-aisled: two rows of posts carried the roof, and the side aisles held **raised benches along both
  long walls**, where people sat by day, worked, and slept at night, with their goods under and behind them. The **long hearth**
  lay on the middle line, one or more fires; smoke left through the roof. **The ends** were for storage and animals: one end a
  byre for the cattle in winter (with its own door), the other a workroom with the vertical loom and the stores. At Borg in
  Lofoten the chieftain's house had a hall with long tables and benches and a high seat, living quarters with their own hearth,
  a storeroom and a byre for forty cows, five rooms and five doors in all. (Lofotr; the general reconstructions; the museum
  texts on the longhouse's benches, hearth and ends.)
- **The furniture** was few things: chests (the Oseberg chest: a lockable box that was also a seat and a table), benches,
  the loom, the quern, cooking gear over the fire (the cauldron on its chain or tripod, the spit), wall hangings for the rich,
  shelves and pegs; beds were the bench, or a boxed bed in the corner for the master. Light came from the fire and the roof
  hole; lamps of soapstone with oil for the rich. (Mental Floss's list of household things; the Liverpool volume on interior
  textiles: hangings as status, the finds from graves.)
- **A town house** (the Hedeby house as rebuilt at Trelleborg's Viking village): **three rooms in a row**: an entrance room
  with a fine wooden floor for goods and trade, the middle room with the sleeping benches and the fireplace, a back room for
  stores; wattle and daub walls, one wall of overlapping planks, thatch.
- **The pit-house** (grubenhus) was the workshop: sunk half into the ground, warm, damp, where the loom stood and the beads,
  combs and cloth were made. The Søften site (82 pit houses) gave loom weights and spindle whorls by the thousand and a whole
  textile chain from fibre to cloth; the scholars warn that loom weights in a pit's fill do not always prove weaving in it, but
  the picture holds: pit-houses were for craft, not living.
- **The storehouse** stood on posts with the food off the ground: sacks, barrels, hanging fish and meat, a ladder to the loft.
  **The byre:** stalls along one wall, hay, a trough, dung. **The smithy:** the furnace against the back wall, the anvil before
  it, the bellows, a water trough, the bench with the tools, open to the yard for light. **The bathhouse:** a stone hearth
  heaped with stones, benches, a bucket. **The boathouse:** the boat drawn up, oars, nets, tar barrels.
- **A church:** the altar at the east end (the game's north), the congregation standing or on benches along the walls, a
  font by the door, the silver on the altar, relics in the altar's sepulchre or in a reliquary, a chest for the church's
  wealth, candles. **Crypts** were stone chambers beneath the floor for coffins, sarcophagi and relics, which Frankish church
  building took up in the eighth century and the north later; a Scandinavian wooden church had no crypt, a stone church in a
  lowland town might, and our south is "England in the south", so a crypt under the town church is right and under a chapel
  is a stretch the raid is allowed.

### What makes a room good to fight and explore in

- **The project's own measure** (`tools/roomsize.js`, `docs/idea-bank.md` "House sizes"): two men at a sword's distance need
  1.5 tiles of floor, the hero's dodge is 1.6 tiles, two attackers flank over about 2. A clear circle **under 2 tiles** is a room
  one man corks; **2 to 3** is toe to toe; **3 or more** is a fight with a step in it; 4 to 6 takes several a side. So a house
  wants one clear circle of two tiles, a longhouse three, a hall more; the furniture must leave it.
- **Cover and lanes** (the Level Design Book on cover; Naughty Dog's arenas; the combat-zone write-ups): cover is anything
  that blocks a line or a blow; good fight rooms have flanking routes, a chokepoint and a way out; a corridor-room-corridor
  layout "has far reduced options", an arena with something in the middle "encourages circular movement". **Lesson:** the
  long hearth on a longhouse's middle line, with a lane either side, is the arena with the thing in the middle; the house's
  single lane with the hearth off it is the corridor with one side step; the door is the chokepoint, and the raid's rule that
  two fit through a doorway stands.
- **Destructibles** (Diablo's two kinds: incidental junk broken in the course of a fight, and things you break on purpose
  for what is in them; the player who hid behind barrels that broke after one shot): breakables serve three ends: cover that
  fails, hidden loot, and a hazard. **Lesson:** our boxes are the loot kind (a kick spills them), the wooden furniture the
  cover kind (it stops a blow and a step until the axe has it), and fire is the hazard (a burning room, built).
- **Placing furniture by rule** (Merrell's interior design guidelines; Kán and Kaufmann's greedy cost; Tutenel's rule-based
  solver; the arXiv constrained layouts paper, which rasterises the furniture's footprints and tests that every free region is
  reached from the door, sampling layouts until one passes; Horswill's playability constraints): anchors first (the hearth, the
  beds), then what goes with them (the table by the hearth, the chest by the bed), then clutter; place against walls; check
  reachability and re-roll. **Lesson:** section 3's templates are the rules, section 4's check is the rasterised
  reachability test with rejection, the same way, in tens of milliseconds a room.
- **Dungeons** (Bethesda's kits and passes; the loop that drops you out near where you came in, called "expert level design in
  action" for Fallout 3; the student's crypt whose heavy looping lost playtesters until it was made a continuous way with
  backtracking and unlocked shortcuts; Valheim's sunken crypts: branching tunnels, passages blocked by scrap piles that are
  also the resource, chests behind them, one key for all). **Lesson for the catacombs:** one continuous way in with a loop
  near the end, blocked passages that pay to clear, and the way out that comes up elsewhere.

## 2. The rules

1. **The threshold.** The door's inside tile and the tile beyond it hold nothing solid. (Robin: nothing blocks the door.)
2. **The lane.** One tile wide, from the door along the room's length to the far wall. Nothing solid stands in it. In a house
   it is the door's own column; in a longhouse and a hall there are two, either side of the fires.
3. **The fire off the lane.** The hearth stands on the far half of a house, a tile from the lane; in a long house on the
   middle line with a lane each side.
4. **Walls hold the furniture.** Benches, beds, chests, the loom, shelves and barrels stand against a wall, a tile in from a
   corner so the corners stay open; the table stands by the hearth on its own side.
5. **The circle.** One clear circle of two tiles in a house, three in a longhouse or a hall, somewhere a fight can happen
   (measured as `roomsize.js` measures). A store, a byre, a smithy and a bathhouse need only their lane.
6. **The loot deepest.** The chest with the household's coin stands at the far end; the sack and the crates near the door.
   The heavy things of a hall stand behind the back room's locked door (built).
7. **Reached from the door.** Every thing placed is reached from the door over free tiles, and no free tile is cut off. What
   fails is taken out, optional things first, until the room passes; a room that cannot pass is reported by the audit.
8. **One cue per secret.** A rug over the cellar; a ladder at the loft; a shelf that stands where a wall should show (the
   niche); nothing marked.
9. **Clutter by calling.** The household's calling and wealth choose what fills the optional slots: a loom and wool for the
   weaver, a quern and sacks for the farmer, nets and a rack for the fisher, a tools chest for the smith, a spear rack and a
   shield for a warrior's house, hangings and a cupboard for the rich, a cradle for a family with a child.
10. **Breakable with a purpose.** Every wooden thing breaks; stone and iron do not. A thing that breaks either spills, opens a
    way, or shows what was behind it (section 5).

## 3. The templates

A template is a list of **slots** in the room's own frame: `a` along the length from the door end, `c` across. Each slot has a
place rule, a pool to roll from, and whether it is needed or optional. Sizes are the game's (`BUILD`; a house 4 across and 6 to
9 long, a longhouse 5 by 9 to 18, a hall 6 by 20 to 22). The game's tile is 1.5 m.

**House, 4 across (6 to 9 long).** Lane: the door's column. Far half: the other two columns.
| Zone | Slot | Needed | Pool |
| --- | --- | --- | --- |
| door end (a 0 to 1.5) | by the door, off the lane | optional | barrel, crate (loot), woodpile, a bucket |
| door end | bench against the door wall, off the lane | optional | bench, stool |
| middle (a 1.5 to LG−2.5) | the hearth, far half, a tile from the lane | needed | stoneHearth |
| middle | the table on the hearth's far side, against the wall, a chair at it | needed | table + chair, or bench |
| middle | the work thing against the long wall, lane side, past the door | optional by calling | loom (weaver), quern (farmer), dryingRack with nets (fisher), workbench (smith's home), spearRack (warrior) |
| far end (last 2.5) | beds in both far corners | needed | bed; a third bed along the wall in a long house |
| far end | the chest on the far wall between the beds | needed | chest (store, the coin); a second chest for the rich |
| far end | the rug (over the cellar when there is one) | by secret | rug |
| walls | shelves and a cupboard for the rich, hangings | optional | shelf, cupboard |
| any | a cradle, a child's things | optional by household | stool |
Variation: the door end swaps its two slots; the table changes side; the work thing is one of the pool; one of four houses
has no table (a bench and a barrel instead, the poor); one of six has the hearth nearer the door end (an old house).

**Longhouse, 5 across (9 to 18 long).** Lanes: both sides of the middle line. Zones by thirds.
| Zone | Slot | Needed | Pool |
| --- | --- | --- | --- |
| door end (first third) | the entrance room: the loom against one wall, a barrel and sacks against the other | needed | loom, barrel, crate |
| door end | the quern by the wall, a bucket | optional | quern |
| middle (second third) | the long hearths on the middle line, one each 6 tiles | needed | stoneHearth |
| middle | benches along both long walls (the sleeping platforms) | needed | bench, every 3 tiles |
| middle | a table against one wall between the benches | optional | table |
| far end (last third) | beds in the four corners of the end | needed | bed |
| far end | the chest on the end wall, the master's boxed bed beside it | needed | chest; a second chest for the rich |
| far end | the byre end instead, in one farm in three: hay, a trough, a stall rail | by roll | haystack, trough |
| walls | hangings, a shield on a peg, shelves | optional | shelf, shieldRack (rich) |

**Hall, 6 across (20 to 22 long).** As the longhouse, with the high seat in the middle of the north long wall (the chair with
the muster flag, built), two or three fires, tables and benches along the walls, the shield racks, the spear rack by the door,
and the back room behind its locked wall at the far end with the jarl's chest (built). The lanes either side of the fires are
the arena; the back room is the prize.

**Store, 3 by 2 or 2 by 3.** Crates and barrels along one wall, the sack (heavy, the food) at the back, the ladder to the
loft on the end wall, hanging fish under the eave; the lane from the door to the back. **Byre:** hay along the long wall, the
trough by the door, a stall rail; the lane along the other wall. **Smithy:** the furnace against the back wall, the forge
(anvil) before it, the bench on one side, the trough by the open front, a crate of tools; the open front is the lane.
**Bathhouse:** the stone hearth at the back, benches on both walls. **Pit-house:** the loom at the back, a bench, a drying
rack, the small fire. **Lean-to:** a crate and a barrel. **Boathouse:** the boat, a barrel, nets on the wall. **Church:** the
altar at the north end with the candles, benches along both long walls (not across: the nave is the lane), the font by the
door, the silver chest by the altar (locked), the trapdoor behind the altar (the crypt), a lamp. **The priest's house:** a
house with a shelf of books and no loom.

## 4. The check

After a room is filled, the generator rasterises what stands in it (each thing's radius: a bed 8, a table 5, a chest 5, a
barrel or crate 4, a bench 6, a hearth 8, a loom 6, a rug 0, in the game's units) and tests, in order: the threshold tiles
free; the lane free; the clear circle (the biggest circle of free floor, measured as `roomsize.js` does) at least two tiles in a
house and three in a longhouse or a hall; every placed thing within reach of a free tile that the door's tile reaches; no free
tile cut off. A failed test takes out the last optional thing nearest the failure and tests again; a room with no optional
thing left to take and a failed test is reported by the audit (`tests/settlement.js`: "rooms: n of m pass the lane and the
circle"), and never silently shipped.

## 5. What breaks, and what for

| Thing | Breaks with | Gives | What it is for |
| --- | --- | --- | --- |
| crate, barrel, sack | a kick (E) or one blow, as built | its contents, spilled | the quick grab by the door; a noise that wakes the house |
| table, bench, chair, stool, shelf, cupboard, loom, bed | the axe, four blows (a soft noise, 110) | one or two wood, fiber from a bed or a loom | cover that fails; a bench across an alcove opens it; a bed moved off the cellar; a cupboard off the niche; fuel for a fire in a room that has none |
| chest | blows on the lock (built), or carried whole if heavy | the coin, the silver | the prize, deepest in |
| hangings, the rug | the torch, in a fire | nothing | the cue over the cellar; the first thing to burn |
| stone hearth, the quern, the altar, the font, the posts | never by hand (the posts char in a fire) | nothing | the fixed points a fight goes round; the altar's silver taken costs reputation (built) |

Not built: wooden furniture does not break today (the boxes do). Mine, for the Game Developer: a class `furniture` in
`src/ruin.js`'s bite table (the axe 4 blows, the pick 8, fire 20 s), a broken thing drawn as a heap of its wood, its wood
dropped, and the nav's solids rebuilt as a wall's are.

## 6. Built (2026-10-22): the templates and the rule in the generator

`src/village.js` fills a house, a longhouse and a hall from the templates of section 3 (`roomPlan`): the lane is the door's
column (a house) or the two sides of the fires (a long house), the threshold and the lane are kept free, the hearth stands off
the lane, the beds and the chest at the far end, the boxes near the door, the work thing by the household's calling, and the
optional things by wealth. Then `roomCheck` rasterises the room and tests the threshold, the lane, the circle and the reach,
taking out optional things until it passes; `Village.audit` prints "rooms: n of m pass" and `!!` when one does not. The
stores, byres, smithies, bathhouses, pit-houses, lean-tos, boathouses and churches keep their fixed layouts, which already
leave their lane.

## 7. The catacombs

Robin's question: should churches have catacombs, like the caves an instance you can explore? **Yes**, and the bones of it
exist: raid step 8 gives a church at wealth 0.35 and up a crypt (`Cave.make` kind `crypt`: the stair down from the trapdoor
behind the altar, a passage, a vault with coffins and bones, a niche with the reliquary over the chest, E to leave), as its own
cave instance exactly as the troll's cave is. What it lacks is a plan that grows with the church, a loop, a second way out and
a reason to go further than the first chest. Proposed, mine, for the Game Developer to build in `src/cave.js` with the Art
Director's crypt set (the stairs, coffins, bones, reliquary, ladder):

| Rank | Where | Rooms | The loop | The way out |
| --- | --- | --- | --- | --- |
| chapel (the lone church, wealth 0.35 and up) | as now | the stair, the passage, one vault | none | back up the stair |
| a town's church | wealth 0.5 and up | the stair, the ossuary passage (bone niches both sides), two chambers round a pillar, the relic vault behind an iron gate | the two chambers join behind the pillar | a second stair up to a slab in the churchyard, marked by nothing but a grave with no name |
| a great town's cathedral | always | the stair, the ossuary, four chambers in two loops, a well shaft, the bishop's vault behind two gates | two loops | the churchyard slab, and the well's shaft to the market's well |

Rules: one continuous way in, a loop only near the end (the student's lesson); passages blocked by a fall of masonry that the
pick clears in a minute (Valheim's scrap piles), with a chest behind one in three; coffins that open (bones, a ring now and
then, the reputation cost of a grave, built for the cairn); the gate's key on the priest (cut loose or robbed) or the axe; the
dark and the torch as in the caves; the draugr later, as decided. The second way out is the raider's: the silver carried up
into the churchyard comes out nearer the shore than the church door and away from the men at the nave. The chart marks the
crypt once seen (built).

## 8. Questions for Robin

1. Breakable furniture: everything wooden (my proposal), or only what blocks a way?
2. The catacombs' second way out: always, or only under town churches and above?
3. A coffin opened: bones and a ring with a reputation cost (as the cairn), or never?
4. Should a house's loot ever be worth a raid on its own, or only the stores and the halls? (The templates give a house its chest with a few coins, as now.)

## Sources

[Viking longhouses and their benches, hearth and ends (Life in Norway)](https://lifeinnorway.net/viking-longhouses), [The
longhouse: structure, social life and archaeology (The Archaeologist)](https://www.thearchaeologist.org/blog/the-viking-longhouse-structure-social-life-and-archaeology),
[Borg, Lofotr: a chieftain's home (International Travel News)](https://www.intltravelnews.com/node/1929), [The Viking longhouse: a
crowded, cozy home (History on the Net)](https://www.historyonthenet.com/the-viking-longhouse-a-crowded-cozy-home), [Household
items every Viking family owned (Mental Floss)](https://www.mentalfloss.com/history/household-items-every-viking-family-owned),
[Interior textiles of the Viking age (Liverpool University Press)](https://www.torrossa.com/en/resources/an/6220802), [The Hedeby
house at Trelleborg's Viking village (National Museum of Denmark)](https://en.natmus.dk/museums-and-palaces/trelleborg/exhibitions/the-viking-village-slagloese),
[Viking textile centre excavated at Søften (Archaeology Magazine)](https://archaeology.org/news/2026/06/25/viking-textile-center-excavated-in-denmark/),
[Pit houses and textile tools at Bjørkum (tidsskrift.dk)](https://tidsskrift.dk/atr/article/download/167187/208184/372940), [Grubenhäuser
as weaving sheds, reassessed (Internet Archaeology)](https://intarch.ac.uk/journal/issue5/westhes/3-7-6.htm), [Crypts (Wikipedia
mirror)](https://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq.ipfs.4everland.io/wiki/Crypt.html), [Relics in Nordic
churches: Torsken (Nordlit)](https://septentrio.uit.no/index.php/nordlit/article/view/3691); [Cover (The Level Design
Book)](https://book.leveldesignbook.com/process/combat/cover), [Anatomy of a combat zone (Game
Developer)](https://www.gamedeveloper.com/design/anatomy-of-a-combat-zone), [Engaging level design for combat (Game
Developer)](https://www.gamedeveloper.com/design/engaging-level-design-for-combat---pt-3), [Diablo III's destructibles
(DiabloWiki)](https://di.diablowiki.net/Chandelier); [Automatic generation of constrained furniture layouts
(arXiv)](https://arxiv.org/pdf/1711.10939), [Interactive furniture layout using interior design guidelines (Merrell et
al.)](https://ww3.math.ucla.edu/camreport/cam11-49.pdf), [Fast procedural level population with playability constraints (Horswill and
Foged)](https://cdn.aaai.org/ojs/12511/12511-52-16033-1-2-20201228.pdf), [Procedural generation of interior settings
(Lampert)](https://blog.hslu.ch/games/files/2021/11/Manuel_Lampert_Procedural_generation_of_interior_settings.pdf), [Random yet
structured placement of objects in a room (Taylor and Parberry)](https://ianparberry.com/techreports/LARC-2010-01.pdf); [Level design
in a day: Skyrim's iterative level design (GDC)](https://gdcvault.com/play/1020171/Level-Design-in-a-Day), [Skyrim level design
transcript (GameBanshee)](https://gamebanshee.com/kuuu), [The crypt: a Skyrim level's philosophy (Falmouth
journal)](https://journal.falmouth.ac.uk/sc247065/?p=733), [Fallout 3's loops (PCGamesN)](https://www.pcgamesn.com/fallout-3/fallout-3-washington-dc),
[Valheim's sunken crypts (Prima Games)](https://primagames.com/gaming/valheim-sunken-crypts-farm-iron-guide).
