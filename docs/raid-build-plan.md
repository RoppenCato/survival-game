# The raid in the real game: the build order

**Approved by Robin (2026-10-20: "do all the steps, don't stop to ask; keep a list for me": `docs/for-robin.md`). Status: steps 1 to 4 built and checked 2026-10-20 (`tools/visual/raidgame.js` step1, step2, step2b, step3; `tests/battle.js arches` for step 4); step 5's first half built (the day watch, bodies found, dragging, theft seen, the shield wall: step5); its second half (the ram, the town fighting fire, men going round by the other gate, the way chosen) waits; step 6 built (the six tactics, `tests/battle.js plans`); step 7 built (the loot rolls, the sack, the feast, `tests/loot.js`); step 8 built (crypts under churches, the hall's back room; `tests/cave.js`); step 9 built 2026-10-21 (thralls cut loose, the lost man won back, the yielded man let go, the chest carried home, more men after a raid; `raidgame.js` step9); step 10's bot measures done 2026-10-21 (`tests/battle.js carry`, the ways trial keeps `duel`); the rest of step 10 is Robin's play. Step 5's second half, 2026-10-21: the town fights a fire (the bucket brigade, `tests/ruin.js`, `raidgame.js` step5b), the men behind a full gate go round by the other gate (`Nav.ROUND`, `MEN.flankAfter`; `tests/battle.js town`), the way chosen (`duel`); the ram (`raidgame.js` step5c, the ruin table's ram column). Every step is built; what waits is Robin's play.**

**The plan as written (2026-10-20).** Robin's order, in his words: *implement the raid in the real game; different
sizes of villages, different levels of defence; test each step; different ways of entering villages and buildings (sneaking in,
breaking in, fighting in); the defence interesting and varied in tactics and spread; good rewards, balanced, with variation
(food stocks; they are eating, so you get buffed with extra good food); room for exploration (churches with cellars, crypts);
the Art Director makes villages and towns prettier, I do mechanics and gameplay.* The steps, the order and the tests are mine.
This is chapter 3's centre (`docs/chapters.md`), started now on Robin's word; chapter 1 stays as it is throughout.

**What stands today** (`CLAUDE.md`, "Men, towns and raids"; `docs/archive/raid.md`; `docs/battle-plan.md` rungs 0 to 6): the whole raid
works in the Battle test (`game.html?scene=battle`) on the game's engine: a town of twenty with men at posts, noise and the alarm,
locked doors to the axe, the quiet kill from behind, night with sleepers and a walking watch, the karve on the shore, the carry
order, G's orders, storming, villagers who flee or arm, destruction and fire. **None of it runs in the real game**: no settlement
there has men, nothing a raid changes is saved, and the hird has never gone ashore in a foreign place. The sea is waters now:
home water is at peace and cannot be raided; the south water (ring 1) holds the town and the church (`Village.plan`), which is
where the raid is built. Twelve archetypes exist (`Village.ARCH`: farmstead, small village, village, seat, fishing hamlet, the
fisherman's hut, trading post, abandoned, town, church, and `great` and `bigtown` for the trials); `Village.garrison` places a
town's men by one pattern (the gate, the yard, the house doors, the hall, a man in every house, the rest about the yard); loot is
one table (house chests with a few coins, the storehouse's crates, a cellar at wealth 0.3, the church's heavy silver, the hall's).

## How every step is worked

1. **A headless test first** (`tests/`): values printed, `!!` for a fault, played again from a seed; the committed code and the
   change run on the same seeds before an engine number moves.
2. **Then the page by script** (`tools/visual/raidgame.js`, new: the real game driven in the pane, like `raidplay.js` drives the
   Battle test): the scenario played by a bot, the error log and the frame log read, a capture at Robin's size.
3. **Then by hand in the pane**, the whole run from the shore to the shore.
4. **A bug list per step**, at the foot of this file, fixed before the next step starts; the Battle test stays the tuning bench
   (what changes in the raid changes in both), and `npm test` must print what it printed before.
5. **Robin's checkpoint** at the end of each step: he plays it. The three things that feel worst lead the next step's fixes.

## The steps, in order

### Step 1. Settlements alive in the real game (the foundation)

**What:** every settlement outside home water gets its men (`townMen` through `Village.garrison`) and its villagers' fighting
state when the hero comes within about 1200 units, as the islands get their beasts (`isleBeastTick`), and loses them when he is
far, their state kept; its nav grid made then. A town's gate barred to an armed band; a man alone and unarmed walks in. Home
water stays at peace (`homeAtPeace`). Admin rows: "Go to the south water's town", "Give a karve and four hirdmen".
**Tests:** headless: the hero moved near and far from each ring-1 settlement in a generated sea; counts of men, where they
stand (on land, inside the walls, not in a wall), the grid's size and time; the pane: sail south, men at the gate, a blade drawn
makes them challenge, a band is barred.
**Done when:** the south water's town and church stand defended in the real game with nothing of the Battle test's left out.
**Likely to break:** men placed on water or inside walls far from a tested layout; nav grids for several villages at once
(the frame log); the alarm's reach across a village the hero is only half near.

### Step 2. The settlement remembers (saved)

**What:** per settlement, saved: `{ raids, lastRaid: day, dead: [names], doors: [broken], chests: [taken], burnt: [...], men:
[posts of the dead] }`; the village regrown from its seed at every start (as now) and the state laid over it; the folk's lines
afterwards ("You again"); word of the raid reaching the next place (its men more awake) as a first reputation.
**Tests:** headless: raid a town in a script (break a door, kill two men, take the silver), save, load, compare; the pane:
the same by hand, reload, the door still broken, the men still dead, the silver gone.
**Done when:** nothing a raid did is forgotten by a reload, and a second visit finds the place as it was left.
**Likely to break:** identifying a chest or a door across a regrowth (stable ids from lot and slot, not positions); heavy
chests moved or stowed.

### Step 3. The ship, the hird and the loot home

**What:** the karve moored at `raidShore`; hirdmen board, row, and **come ashore on a raid** (the rule: they follow only in your
territory and on raids; a raid is the shore of a foreign place, a leash from the ship); G's orders as in the Battle test (with
me, hold, storm, carry); heavy loot stowed and unloaded at home as silver (built); the sea chest for weapons left behind; the
people rules that are decided and not built: the hero who falls with men standing is dragged aboard and wakes at sea, what he
carried lost; a man left behind is taken as a thrall and won back by a raid or silver (v1: he is marked taken; the winning back
is step 9); a carrier holds on until badly hurt; men not fighting fall back with a carrier.
**Tests:** `tests/battle.js raid` on the same seeds as the committed code (the engine is shared); the pane script: Admin gives the
karve and four men at home, sail south, land, raid the church quietly, carry the silver to the ship, sail home, unload, save,
reload.
**Done when:** that whole run works by hand in the real game, and the Battle test's bots give what they gave before.
**Likely to break:** hirdmen at sea (aboard, rowing, the leash), their way-finding on sand and through a strange village, the
carry path to a ship that is not where the test put it.

### Step 4. Sizes of villages and levels of defence

**What:** a **defence table** (data, `Village.DEFENCE`, by archetype and wealth): how many fighting men, which are soldiers and
which householders with a spear behind the door, their gear tier (`BT_GEAR`: leather, mail, the hall's men), their wits, the
bowmen's share, a palisade, a wall, a watch; the farmstead (one man, a dog later), the small village (householders only), the
village (four to six and a watch), the seat (the hall's six, the gate), the town (twenty), the great town (a longship's crew, as
decided); the level from the water's ring and the place's wealth. `Village.garrison` takes the table instead of its one pattern.
**Tests:** `tests/battle.js town` extended to **every archetype**: the three bots with one, three and six men of theirs against
each place; printed as one table (win rate, time, the crowd measure); the targets agreed with Robin first (for instance: a
farmstead alone is easy; a town with six of yours is hard; a great town without a longship's crew is lost).
**Done when:** the table reads as a ladder, and Robin has played one of each size.
**Likely to break:** the garrison's placement in places without a fence or a hall; the one-on-one rules with two men; a
householder who leaves his door.

### Step 5. Ways in: sneaking, breaking, fighting (and walking in)

**What:** each way made a whole, measured and distinct:
- **Walking in:** by day, alone and unarmed, through the gate (built); trading posts and the lone church let anyone in; the
  storehouse's quiet loot and an unlocked chest taken in plain sight **is noticed** (people care what you take in front of them).
- **Sneaking in:** by night the back gate on the latch, sleepers (one in three light), the watch's round (built); new: **guards
  who walk a round by day** too (the quiet part becomes watching and waiting), **a body found raises the cry** (so where you leave
  him matters; dragging a body out of sight, E on a fallen man), the quiet kill as built.
- **Breaking in:** doors and locks to the axe (built); **a ram** for the hird at a barred gate, a stone church door or a cut-stone
  wall (four men and a felled trunk; G at the gate); fire with the wind (built); the town fights a fire near its well (buckets).
- **Fighting in:** storming (built); **the shield wall**, decided and not built: a held line in a gate stops what comes, a real
  advantage; the men at a full gate who go round by the other gate and take you in the back; **which of the five ways** the
  town's men come at you (`Combat.WAYS`, none chosen): the trial picks one, Robin confirms.
**Tests:** four scripted scenarios in the Battle test (`raidplay.js`: quiet, night, loud, storm) and in the real game
(`raidgame.js`), each printing what it took (time, noise, deaths, loot); `tests/battle.js raid` grows the four.
**Done when:** each way is a different play that a bot can finish, and the measures differ (a quiet raid should take longest and
cost least).
**Likely to break:** nav through a gate two are fighting in; the door's noise reach by material; sleepers and the watch at the
day's edge; the ram's path.

### Step 6. The defence's tactics and spread

**What:** a settlement draws a **defence plan** from a few (data, rolled with the place, shown by how its men stand so the player
can read it): *gate first* (all to the gate, the yard empty); *the hall holds* (the jarl's men stay by the hall and its chest,
householders at their doors); *hunters* (spread, each sweeps a quarter, they meet at noise); *the watch* (a round walks, the rest
at work or asleep); *muster* (they gather at the fire, then come as a line); *bowmen up* (on the wall or the tower, the rest
below). Reactions: fall back to the hall when losing, a sortie when you carry, a man who yields, a place that gives up when its
men are down. The decided rule that nobody pursues past 700 units stays.
**Tests:** the bots against each plan on the same town (`tests/battle.js ways`, extended): time to first contact, how spread
the men are (mean distance from the yard), time to the loot, deaths; the plans must differ measurably; `TOWN_DBG` for men who
stand still.
**Done when:** Robin can tell two plans apart by walking in, and none is a swarm.
**Likely to break:** the two-at-a-doorway rule with a muster; the leash of hall men; bowmen's lanes on a wall.

### Step 7. Rewards: balanced, varied

**What:** a **loot table** (data, by archetype, wealth and the place's kind): silver (the church's, the hall's), goods (hide,
leather, iron bars, cloth later, arrows), **food stocks** (a full storehouse of meat, fish, berries, honey, eggs: carried in the
bag or as a heavy sack to the ship), **the feast**: a place at its meal (the hall's table laid at dusk, the longhouse's at
midday) holds the *feast* dish, eaten at their table while the raid is on for a buff above any home dish (health, stamina, the
rested buff) that lasts the raid: *they are eating, so you eat well*. Weapons from fallen men (built), looted iron for the hird
(nothing spends it yet: it arms them). **Balance by a budget:** value against risk (men × gear × walls) on one curve, printed by a
test; variation by the place's roll (a rich farm with a full store, a poor village with little, a church with more silver than
its size).
**Tests:** `tests/loot.js` (new): the expected silver, food and goods of every archetype at three wealths against the defence
table's risk; the curve printed; the pane: the feast eaten at the hall's table, the buff seen on the meal line.
**Done when:** Robin agrees the curve, and two raids on two places of one size do not give the same.
**Likely to break:** stacks over 25 in the bag; carrying food and a chest; the feast's table seat and the men at it.

### Step 8. Room for exploration

**What:** **crypts under churches** (a trapdoor behind the altar into a small cave of the cave's kind, `Cave.make('crypt')`: a
bishop's silver, relics, bones, a draugr later), **the hidden cellar** (built: found by looking, a rug over a trapdoor), the hall's
back room with the jarl's chest (the chest is built; the room is not), the storehouse's loft, a watchtower, the priest's hidden
chest; each a thing found by looking, never marked. The chart marks a crypt once seen.
**Tests:** generation counts (every church of wealth x and up has a crypt, every town a back room); the way in and out with men
chasing (they wait at the trapdoor, or follow: decided in the trial); the pane: a crypt walked at Robin's size.
**Done when:** a church is worth exploring beyond its silver, and a crypt plays without a stuck man or a lost hero.
**Likely to break:** the cave swap with men and hirdmen near; the chart; saving what was taken below.

### Step 9. The people of a raid

**What:** the decided, unbuilt people rules: thralls to cut loose (a recruit), your taken men to win back by a raid or silver, a
man who yields bound or let go, a priest who does not fight and can be spared, the town that takes back a dropped chest; and
reputation: traders shut to you, a price on your head, more men at the gate next time.
**Tests:** scripted; the pane by hand.
**Done when:** a raid can end with a man gained and a man lost, and the place remembers both.

### Step 10. The whole, played and tuned

Robin plays a raid at every size, each way in. The frame log, the error log; the men retuned to the hero's blows on the press
(2026-10-20: not retuned yet); the twenty-minute measure (loot to ship per size, by the bots); the small fixes list below.

## What is asked of others

- **The Art Director** (Robin tells it): prettier villages and towns; later, from this plan: a watchtower and a wall-walk, a
  ram, the feast's laid table, the crypt's set pieces (altar steps, a trapdoor, coffins, relics), a sack for food loot, the
  thrall's bonds.
- **The Lore Director:** names and lines for the south water's places, the priest's lines (he does not fight), the jarl's call
  after the first raid, what folk say of a raider (reputation), the feast's words, a crypt's inscriptions; the thrall's lines.

## Decisions Robin can make along the way (defaults if he is not there)

1. The feast: eaten at their table during the raid (default), or carried home as a dish.
2. Which of the five ways the men come (default `duel`; the trial of 2026-10-21, `tests/battle.js ways 24`, keeps it: the least crowding round one of yours, 2.3 on average and three or more 30% of the time, the hero standing longest at 52 s, the most friends up at the end).
3. The crypt's contents: silver and relics (default), or a new currency.
4. A man of yours left behind: taken (default, step 9), or dies as built.
5. Dogs at farms (default no, until the Art Director has one).
6. Whether the plan's step order holds, or steps 4 and 7 (sizes and rewards) come before 3 (the ship and the hird).

## Bugs and small fixes found along the way

(kept here as they are found; each with the step, the seed and the fix)

- Step 9: a thrall cut loose was spliced out of `folk`, so the counts that remember the dead and the freed by their place (an
  index among the place's folk, `markDead`, `markFreed`) slipped for the next one; he stays in `folk`, hidden and `gone`.
- Step 9: `hisHer` gives his or her (the possessive), so "Let his go": the let-go prompt chooses him or her itself.
- Step 9: an errand with `gawk` is dropped when a noise wakes the man; the one that carries a chest home must not have it.
- Found by `tools/dupcheck.js` (2026-10-21, after step 10's measures): step 5's `bodyNear` (a fallen man) had shadowed the cave's
  `bodyNear` (Hogni's body), so E offered no arm ring since 2026-10-20: renamed `fallenNear`. The chest board's `storeAdd(s)`
  had shadowed the hird's `storeAdd(st, kind, n)` since the storage commit, so a hirdman's job gave nothing into the chests:
  renamed `stoneStoreAdd`. A second `isleAt` (the null-safe one) stood beside the first: the first is gone.
- Step 9: a thrall cut loose, marked gone, could still be talked to (E found him): `folkNear` skips the gone.
