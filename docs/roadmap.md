# Roadmap: what to build, in what order, and how to test it

Written 2026-10-05 from `CLAUDE.md` (the decided design) and `docs/idea-bank.md` (the undecided ideas). This is the
build order. When a step is done, mark it here and move anything it decided into `CLAUDE.md`. Questions for
Robin are at the end; where a step depends on an answer, it says so.

---

# Goal 1: leave the island (Robin, 2026-10-05)

The first big goal. The player lands with nothing, and leaves the island on a raft. Everything below is what it
takes to get there, in the order it has to be played, with what already exists, what is still to build, and how
to test each step. The runes and the Book of Beasts stay hidden until this is done.

**The chain, backwards from the raft:** to leave you need a **raft**. To build a raft you need the raft recipe
(taught by Brokk, the only survivor of the raided village) and a **shipwright's bench** on the shore. To build the
shipwright's bench your base must be **comfortable** enough: a house with a roof, a workbench, a fireplace and a
rug inside it. To build those you need to **gather** wood, stone, fiber and hide on the island, which needs
**tools** of stone and wood, **leather armour** so the beasts do not stop you, and **food** that raises health
and stamina.

**The name:** Robin asked what to call the boat-building table. A Viking-age boat was built on the shore at a
*naust* (a boathouse) by a shipwright. For a raft, a boathouse is too much; the suggestion is **shipwright's
bench** (a trestle with a shaped keel-piece on it, built on sand), and the **naust** comes later as the bigger
building for real boats. Alternatives: *boatyard*, *slipway*. Not decided.

## The workflow, step by step

Each step says **Have** (what exists today), **Build** (what is missing), **Test** (how to know it is done). The
order is the order a new player meets them; build them in the same order so the game is playable after each.

### 1. Land with nothing, and gather by hand (built 2026-10-05, tested from a fresh start)
- **Have:** the island, the camp with its hearth and jetty, branches and stones lying round the camp, pickup by
  walking over, the bag with the belt row, the hint line, saving.
- **Build:** nothing new. Play the first minute as a new player and fix snags: a hint that points at the
  branches, the bag opening the first time something is picked up (once), the chart marking the camp.
- **Test:** a fresh start reaches 9 wood and 5 stone in under a minute without reading anything but the hints.

### 2. First tools of stone and wood (built 2026-10-05; the stick sword at 2 wood is the first weapon, so there is no separate club)
- **Have:** hand recipes on the B board's Crafting tab: flint axe, flint knife, flint pick, wooden sword, wooden
  bow, 5 arrows; recipes show as "?" until every kind they need has been picked up; right click in the bag equips;
  tools on the gather hotbar, weapons on the fight hotbar.
- **Build:** rename to what they are (a **stick sword**: a sharpened branch; a **stick bow**), and a **wooden
  club** as the very first weapon (2 wood, by hand) so the first boar can be met before flint. Make the Crafting
  tab the one that opens when B is first pressed with nothing built. One hint per tool, in order: axe, knife,
  pick, then club or bow.
- **Test:** from step 1's materials the axe and knife are made and in hand within two minutes; a tree and a bush
  go down with them; the pick cracks a rock.

### 3. Gathering: wood, stone, fiber, hide, berries, meat (built 2026-10-05: drop counts raised, deer and a boar near camp, drying rack and leather; the 40/20/15/6 day-of-gathering test is still to be played by hand)
- **Have:** trees lean and fall, rocks crack and burst, bushes fade; wood, stone, fiber, berries drop; boars and
  the other animals drop meat and hide; chests, crates and barrels break.
- **Build:** balance the numbers so the chain below is reachable in one game day: hits per tree and rock, drop
  counts, the pickup radius, how far wood scatters. The deer as the safe source of hide (it runs, it does not
  fight): more deer near camp. Hide from boars already. A **drying rack** that turns hide into **leather**
  (put hide on it, come back after a while), so leather is a thing you make, not a thing you find.
- **Test:** a player with axe, knife and pick gathers 40 wood, 20 stone, 15 fiber and 6 hide in one game day
  without dying, and has leather by the next morning.

### 4. Food that raises health and stamina (built 2026-10-05: every meal sets top stamina and stamina return as well as health; roast berries added; the belt's number keys eat in any mode; the fish comes with the raft)
- **Have:** berries heal; roast meat and stew are cooked at any hearth on the Hearth tab; a meal raises top
  health and gives health a second for minutes; the meal icon with its timer by the chart; no hunger.
- **Build:** stamina on food (Robin): every meal sets a **top stamina** and a **stamina return** as it sets top
  health, so better food means longer sprints and more swings, never less (`FOOD` gets `stam` and `stamRegen`;
  the engine reads them through `mods`). Two or three more dishes so food has a ladder: **roast berries**
  (fire, berries only: small), **roast meat** (health), **stew** (health and stamina), **fish** later with the
  raft. Eating from the belt with its number key in any mode. Food shows its numbers on the board.
- **Test:** eat each dish and read the health and stamina bars grow; sprint longer on stew than on nothing.

### 5. Leather armour, and the beasts kept at bay
- **Have:** leather helmet, tunic, trousers, boots and cloak at the workbench (hide and fiber); gear turns a share
  of blows aside, up to 60%; the character panel's five clothing slots; the wooden shield.
- **Build:** recipes take **leather** (from the rack, step 3) instead of raw hide; the panel shows the armour
  total; the first set is cheap enough to wear by day two. Balance the animals against a player in leather with
  a stick sword: the boar is a fair fight, the wolf pair is hard, the bear and the moose are to be avoided (the
  book's "far from camp" placement already does this).
- **Test:** in full leather with a stick sword a boar dies with the player above half health; a wolf pair is
  survivable with the shield; the bear kills a careless player.

### 6. The house: a roof, a workbench, a fireplace, a rug
- **Have:** walls in five materials, floors, door, window, fences and gates, roofs per room, the workbench (needs
  a roof), the hearth as a piece, the bed, sleep and the Rested buff, the build cursor with its reasons.
- **Build:** the **rug** piece (leather and fiber; a woven mat on the floor, drawn as a prop), and **comfort**: a
  number for a roofed room, counted from what stands in it: roof 1, hearth 1, workbench 1, bed 1, rug 1, chairs
  and tables and a chest 1 each up to a cap. Shown on the dial by the chart when you are inside ("Comfort 4") and
  as the Rested buff's length (comfort × 2 minutes). Comfort is what the shipwright's bench asks for (step 8).
  A hint sequence: wall, door, roof, hearth inside, workbench, rug.
- **Test:** a 3 by 3 hut with door, roof, hearth, workbench, bed and rug reads Comfort 6; sleeping in it gives
  Rested for 12 minutes; the same hut without a roof reads nothing.

### 7. The village and the survivor
- **Have:** Hildir's steading, broken, inland: the burnt hall, the whole hut, the stone house, the palisade,
  loot crates that break, Brokk by the well with five lines.
- **Build:** Brokk's story told straight: the village was raided, some were taken as slaves or went with the
  Vikings, some died, he is the only one left. His lines gate on what the player has done: first meeting (the
  tale), after the player has a roofed house ("you build well; come back when your hall is warm"), after comfort
  reaches the bar ("I will teach you the raft"), after the raft ("they sailed east"). A chart marker for the
  village once found. A small reason to go there before the raft: the crates (there), and the well as the only
  water (not yet a system; skip for now).
- **Test:** a new player finds the village by walking inland within the first day (the hint "smoke to the
  north" or a chart marker), and Brokk's first line tells the whole story in one read.

### 8. The shipwright's bench
- **Have:** the workbench's "needs a roof" rule (`benchRoofed`) as the pattern for a placing rule; the jetty.
- **Build:** the **shipwright's bench** piece: a trestle with a keel-piece, buildable only on sand within a few
  tiles of the water, costing wood and stone, and only when the player's base has **comfort 4 or more** (the
  cursor says "Your home needs a roof, a fire, a workbench and a rug first" until it does). It opens a
  **Shipwright** tab on the B board when near, like the workbench's. Brokk's raft recipe appears there once he
  has taught it (step 7); until then the tab says "Someone must teach you".
- **Test:** the bench cannot be placed inland or with comfort 3; with comfort 4 it can; its tab shows the raft
  recipe only after talking to Brokk with comfort 4.

### 9. The raft, and leaving
- **Have:** the ships and sailing in the Sea Editor (hull, heading, speed, boarding with E); nothing in the game.
- **Build:** the **raft**: logs lashed with rope (20 wood, 10 fiber, 2 leather), crafted at the shipwright's
  bench and placed in the water by the bench; E boards, WASD paddles it slowly, E steps ashore on any land;
  the Sea Editor's hull code reused with a raft hull. The world gets a **second island** within raft range
  (count 2, a short gap). Dying at sea drifts the raft to the shore of the island you last slept on (decided).
  The moment you step onto the second island is the goal reached: a line on screen ("You have left the
  island"), the day counted, and the Book and the runes can come back after this.
- **Test:** a full play-through from nothing to the second island in about two game days (an hour of play),
  with each hint arriving when it is needed.

## The order of work

1. Step 4's stamina on food and step 3's drying rack and leather (small, and everything after wears leather).
2. Step 2's club, stick names and the first-press Crafting tab, with the step 1 snags, played as a new player.
3. Step 6's rug and comfort, with the hint sequence.
4. Step 7's Brokk lines and the village marker.
5. Step 8's shipwright's bench.
6. Step 9's raft, the second island and the goal line.
7. Step 5's balance pass last, once the whole chain can be played, because every earlier step changes it.

---

The rule behind the order: every step should make the game more like the game it is meant to be (raiding,
exploring, expanding, in a world where the compass means something), and each step should be playable and
tested before the next starts. Big systems (boats, villages, the clan, the year) come after the island is alive,
because they all stand on it.

## Done (step 0)

The first island: generated from `World`, trees and rocks that wear down and fall, drops, the bag, building with
roofs, saving, the hearth and food, the hotbar and modes, boars that roam and charge, the Book of Beasts.

## Step 1: a living island (2026-10-05: scale set, all six animals placed by ground with their numbers and drops, and each with its own attack: the boar's charge, the wolves' circling bites in turns, the adder's lingering bite, the bear's rearing swipe, the moose's gore; still to do: the book's extra drops like pelts and feathers)

Everything the island needs before anyone leaves it.
- First, scale (decided): slow the hero to a walk that fits the world, and make the islands smaller for now so
  testing is quick; island sizes can grow again later. Set the numbers in the Sea Editor and make them the
  defaults.
- All six animals placed by ground: boar in groves, deer in meadows, adders on sunny rocks by the beach, wolves
  in deep forest (in pairs), moose by the wet lowland, one bear on the rocky hill. Spawn tables by ground kind,
  with the home ranges already in the engine.
- Per-animal behaviour on top of chase-and-lunge: the deer flees (exists), wolves circle and take turns, the bear
  rears and slams, the moose charges in a straight line, the adder strikes short. This is the first "harder as you
  go" within one island: the bear and the moose are the island's hard corners.
- Animal drops beyond meat: hide, antler, bear pelt, feathers (for arrows later). New bag kinds.
- Book pages fill as each is slain (already written).
- The hero takes real damage from animals and can die in the open; R returns to camp. Keep it: it is the only
  pressure the island has until villages exist.

Tests: see "Testing" below, the animals row.

## Step 2: day, night and the first buffs (built 2026-10-05: the 30 minute cycle with dusk and dawn, hearth light at night, the bed, sleep that skips the night, the Rested buff under a roof, the evening theme from dusk; still to do: the torch, wolves by night, furs and fire lengthening Rested)

- A day of 20 minutes and a night of 10 (decided), with a dusk and dawn, drawn with the Environment Editor's lighting (already written
  there). Night is darker, not black; a torch (buildable, carried) lights the way.
- Wolves come out at night and go back to the forest at dawn. Nothing else changes with night yet.
- The "Rested" buff from sleeping in a bed inside a roofed room (the first comfort buff: longer the more there
  is in the room: fire, bed, furs). Sleeping skips the night and you wake fully rested (decided).
- No hunger, no cold, no wetness, nothing that cuts stamina (decided).


## Step 3: crafting at the workbench (built 2026-10-05: hand and bench recipes, unlock by picking things up, leather gear, the tabbed B board, the Escape menu; still to do: better tools by tier, the torch, the cloak's warmth)

- A buildable workbench piece. E opens a crafting panel like the hearth's.
- Recipes: a better axe and pick (gather faster; oak needs the better axe), arrows (see below), a torch, a wooden
  shield, a fur cloak (for the cold island in step 4).
- Arrows (decided: ammunition, with different arrow types, but no stacks of arrows in the bag). Suggestion
  (Claude): a **quiver** that is not a bag slot. It hangs by the bow icon on the hotbar with its count, holds one
  arrow type at a time (up to 40), and is filled at the workbench in batches of ten; changing the type means
  emptying it back into the workbench. Better quivers hold more. Arrows picked up from the ground refill it.
- Tool tiers are what gates gathering: "harder each biome" starts here, because the next island's trees and
  rocks want the better tools.

The quiver is built (the character panel); step 3 adds making arrows and new arrow types.

## Step 4: the boat and the second island

- Board the faering at the jetty (the Sea Editor's boarding and sailing, moved into the game through `World`).
- A second island a short sail to the north: colder, pine and rock, a "Pine highlands" biome with wolves, moose
  and the bear as the usual beasts. The compass rule starts to show: north is colder and harder.
- The chart shows both islands; the boat's position is saved.
- The cloak from step 3 gives the "Warm" buff there (extra health in the cold); without it you are at the
  baseline, never hurt by the cold itself.

- Dying at sea (decided): forgiving. The boat drifts to the shore of the island where you last slept, damaged, and
  needs half its materials to repair. You wake in your bed.

## Step 5: the first väsen

- A troll that lives under a hill on the second island, comes out at night, and turns to stone at dawn. Its card
  says so, and that is the way to beat it: lure it into the open and fight until the sun rises, or run.
- Trolls are the first creature that is not an animal: a new body plan or a figure built like Brokk, big.
- This proves the pattern for every väsen after it: a card whose weakness is a real rule in the fight.

Depends on: Q1 (which väsen first).

## Step 6: the broken village, the first friend, and trading (2026-10-05: the broken steading is built from the building pieces with loot crates, and Brokk stands there with the tale of Ragnar Ironside; chests for storage and breakable crates and barrels added the same day; still to do: the living village, trading)

- On the home island (decided): an abandoned, broken village. Fallen walls, a burnt longhouse, a palisade with
  gaps, things left behind. It shows the player how a village is built and set up, and that the world has
  dangers. Built from the Base Editor's pieces by a generator that then breaks them.
- The first friendly person is met there (Brokk, or another), and tells of the first legendary Viking: who burnt
  the village, where they were last seen. That is the hook for exploring.
- A living village to trade with is on the second island or further: five or six huts with people (figures, like
  Brokk) going about their work, a palisade, a trader at a table.
- Trading (decided): the first island and its neighbours trade in the basics, food and materials, by barter. A
  currency comes later, and a new one about every third biome, not one per biome, so new places need new things
  farmed.
- People talk: a few lines each, like Brokk.
- This is the first place where "raid or trade" is a choice.

## Step 7: raiding

- Guards in villages; the fight is for the storehouse. Loot is silver and goods; a village raided goes quiet
  (regeneration comes in step 9).
- A church as a "lucky strike": priests who cannot fight, a bell that may call an army from the nearest castle.
- Recruits: the first clan member joins after a raid (a captive who chooses to) or from the village for silver.
  A member follows you and fights beside you (the engine's bot AI, dressed as a figure, on your side).

- Reputation (decided): raiding has a price and a reward. A village remembers; traders close to a known raider;
  a name as a raider brings recruits and fear. The exact rules are open.

## Step 8: the hird and the homestead

- Members (decided): found and recruited in different ways; they fight beside you on land (an ally AI) as well
  as crewing the boat and working at home; each has randomised stats and traits (a strong rower, a good shot, a
  coward, a cook), and can be trained toward what you need.
- The name (decided): the band is your **hird** (Old Norse *hirð*, the sworn household band of a chieftain), the
  people in it **hirdmen**, and they call each other fellows.
- Members at home: assign one to chop, one to fish, one to guard. The camp becomes a village as you build.
- Members crew the boat: more rowers, faster ship. Members can die.
- Claims: a banner on a place you hold. Defended by members left there.

## Step 9: the year

- Spring, summer, autumn, winter, each with a look (leaves, snow). Winter ends the year: the sea freezes,
  everyone is home, a feast (the morale buff), a summary of the year.
- After winter, unclaimed villages and castles are rebuilt by the generator, poorer or stronger depending on what
  happened to them. Spring news from the trader tells you what changed.

Depends on: idea bank questions 1 and 4.

## Step 10 and after

Legendary Vikings and how their names spread (idea bank 3); attacks on your claims that are answers, never random,
with warning (idea bank 4); skills on the fight bar; the central trading hub; more biomes and the full compass
world (named lands, fixed landmarks); more väsen; the deer, wolf and bear skins as armour; sound.

## Cross-cutting rules

- **Performance:** 60 fps at pixel scale 3 on Robin's machine with the camera over the busiest place. Every step
  that adds things in the world (animals, people, pieces) must keep to the bucket pattern (`World.around`) and
  never loop over everything per frame.
- **Saves:** every step that adds saved state bumps the save version and reads old saves (missing fields get
  defaults; a save from a step before is never thrown away).
- **Shared code:** islands in `World`, pieces in `Build`, people in `FOLK`, creatures in `ANIMALS`. Editors and the
  game read the same data. A new creature gets an editor preset, a book card and a spawn rule, or it is not done.
- **The rule:** reward doing right, never punish; nothing cuts stamina; no square ground; bright and lush.

## Testing

Three layers, used after every big system. `npm test` is the floor, not the proof: it only shows nothing threw.

**1. Headless scripts (Node, `tests/` and `tools/visual/`).** Fast, repeatable, no browser. Used for rules and
drawing. The existing ones: the combat scripts, `island.js` (the world), `facings.js` and `chop.js` (the hero and
animals), `creatures.js`, `props.js`. Each new system gets one. They print values with labels; read the values,
do not just look for green.

**2. Scripted play in the browser (`Combat.api.debug` on the game page).** A script that drives the game through a
whole loop and checks the state afterwards: it is how building, saving, cooking and the bag were checked. Every
step gets a scripted loop, kept in `tools/play/` so it can be run again.

**3. Play tests by Robin.** A short checklist per step of things only a person can judge: feel, readability, fun.

What to test after each step:

| Step | Headless | Scripted play | Robin plays and judges |
| --- | --- | --- | --- |
| 1 Animals | Spawn tables: counts per ground kind over 10 seeds (no animal on sand or in water; never inside a building; never within 200 of camp). Each animal's attack: windup time, reach, damage, stagger, printed per animal. Render all six in all states (`creatures.js`). | Kill one of each with the debug hooks; check drops, book pages, respawn after 3 s, no animal stuck in a tree for 60 s of wandering. | Does the island feel alive and safe near camp, dangerous at the edges? Is the bear scary and fair? Can you read each warning sign? |
| 2 Night | The day clock: 20 min, dusk and dawn times; wolves out between those times only (count over a simulated day). Frame time at night with 20 lights. | Sleep in a bed: night skipped, Rested buff set, saved and restored. A torch lights a radius. | Is night too dark? Is the torch worth carrying? Does Rested feel like a reward? |
| 3 Crafting | Every recipe: cost taken, item added, bag full refused and refunded. Gather speed by tool tier (hits to fell each tree kind, printed). | Craft the better axe, fell an oak that the first axe could not; shoot until out of arrows, bow refuses. | Does the first hour give you the workbench and the better axe without a guide? |
| 4 Boat | World with two islands: both land, gap of water between, jetty on each. Boarding and landing from every side of the boat. Save and load with the boat at sea. | Sail to the second island, fell a pine, come back, reload, boat where left. Die at sea (Q5). | Is the crossing exciting or dull? Does the north feel colder and harder? |
| 5 Troll | Stone at dawn: a troll in the open at sunrise becomes a rock prop, drops its loot, card marks it. Its hits and health printed. | Lure it out at night, survive until dawn, collect. Its card unlocks. | Is the card's weakness discoverable without being told? |
| 6 Village | Generator: 20 villages on 20 seeds, every hut closed (roof), door on each, paths connect, no overlap with trees. People stay on paths and in huts. Trader prices. | Sell hides, buy arrows, talk to everyone, leave; nothing changes. | Does it look lived in? Is the trader worth the walk? |
| 7 Raiding | Guard AI: windup and damage; bell timing; army arrival time by distance. Loot tables. | Raid the church with no deaths: no grim. Raid the village: storehouse opens, silver taken, recruit offered. Member follows and fights. | Is raiding a choice and not the only way? Does a recruit feel earned? |
| 8 Clan | Work rates (wood per day per member), boat speed by rowers (printed), claim defence outcome tables. | Leave a member at a claim, sail away, return: claim held. Member dies in a raid and is gone from the roster and the boat. | Do members feel like people or like numbers? |
| 9 The year | Season clock; regeneration over 5 winters on 5 seeds: raided villages come back poorer, untouched ones richer, claimed ones untouched. | Play a year: feast, summary, spring news names what changed. | Does the year's end feel like an end? Is the world fresh in spring? |

After every step, also: `npm test`, `island.js`, `facings.js`, `chop.js`, and a scripted load of a save from the
step before.

## Questions for Robin

Answered 2026-10-05 and moved into the steps above and into `CLAUDE.md`: island size and walking time (slow the
hero, smaller islands for now), arrows (ammunition, not in the bag), sleeping (skips the night, fully rested),
villages at home (an abandoned broken one, with the first friend and a legend), the cost of raiding (reputation),
dying at sea (forgiving: drift home, half the materials), currencies (basics first, a new one every third biome),
members in combat (both, with random stats and traits, and training), the day (20 minutes, night 10), the name
(hird, hirdmen). Still open:

1. **The first väsen.** The troll (night, stone at dawn), or another? The troll is the clearest rule.
2. ~~The quiver~~: decided and built (the character panel, Tab): three arrow slots outside the bag.
