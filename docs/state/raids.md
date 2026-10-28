# Men, towns and raids

How this part of the game stands now, moved out of `CLAUDE.md` on 2026-10-27 (the doctor: it was read at every start). Keep it current, as `CLAUDE.md` was: what is true now, Robin's decisions marked as his.


Tried in **`game.html?scene=battle`** and by `tests/battle.js` (`one|two|friend|five|bows|duels|ladder|town|raid|ways [n]`;
three bots: tapper, careful, skilled); `tools/visual/battleplay.js` and `raidplay.js` play it in the page. **In the real game
(raid step 1, 2026-10-20, `docs/raid-build-plan.md`): a place outside home water gets its men** (`garrisonTick`: `Village.garrison`
through `townMen`; **how many and how armed is `Village.defence(arch, wealth, ring)` from the table `Village.DEFENCE`** (step 4,
mine: a farmstead 0 to 1, a small village or fishing hamlet 0 to 2, a village 2 to 6, a trading post 3 to 6, a seat 6 to 12, a
town 14 to 24, a great town 30 to 40, by wealth; a sixth more a ring further out; the hall's and the gate's men in mail, the
rest in leather, a share with bows, a bonus to wits; a church none; `tests/battle.js arches` prints the ladder, kept in
`docs/baselines/arches-2026-10-20.txt`: a farmstead falls to the hero alone, a village about even alone, a trading post or a
seat wants men at his back, a town is lost with five) **when the hero comes within 1200 units of its bounds**, and loses them when he has been 2600 off for 40 s and no raid is on there; their names are
seeded, a man killed stays dead by his number (`seen.menDead[vi]`, saved). Home water's places have none (at peace); the Battle
and Destruction scenes make their own. **The settlement remembers (step 2):** its pieces are in `B` and saved (a broken door,
a taken chest, a burnt wall survive a reload); `seen.raids[vi]` counts its raids and `seen.lastRaid[vi]` the day; its folk speak
of it after a load too (`raidedLines`); **word spreads** (`wordSpreads`, mine): every place within `WORD_REACH` 3200 units is
wary from then (`seen.wary[vj]`): its men come with wits +2 and rise twice as fast, and its gate man says so (`LORE?`). **The ship, the hird and the loot home (step 3):** a raid is a shore outside home water (`onRaidGround`: the island's ring 1 or
more); stepping ashore there, every hirdman aboard becomes a man of the engine (side 1, `hirdToMan`: copper arms by his number,
leather and a shield, following, fighting, carrying, going down) and E at the ship makes him a hirdman again (`hirdBack`); on
home ground they step off as hirdmen as before; on another shore of home water they keep the boat. A hirdman follows on a
raid's ground too. One ashore when the ship has sailed 700 units off is **lost** (`hirdLost`: `m.lost` with the place and the
day, to be won back in step 9); one the engine kills is dead (`seen.hirdDead`). **A carrier holds on until badly hurt**
(`MEN.dropAt` 0.45; the carry errand's `hold`). **The hero who falls on a raid with a man of his standing within 600 units
wakes aboard the ship with his men** (`wakeAtSea`, `raidMenAboard`; the chest he carried stays where he fell). Admin: "A
karve by you", "Four hirdmen join" (`hirdGive`); `debug().giveMen`, `clearMen`, `claimAt`, `hirdList`, `raidShore`, `raftUse`, `work(id, n)` (a bar or a dish started as the board's button does), `year()`, `seasonTurn(name)`, `blot()`.
  **Ways in (step 5, the first half, 2026-10-20):** by day one yard man in two **walks the round** the night watch walks
  (`dayWatch`, in `sleepTick`); **a dead man of the place seen by one of its people or its men is found** (`bodiesFound`, every
  half second while the hero is near: the cry and the alarm; the night watch too), so **a body can be dragged** (E on a fallen
  foe: "Drag his body", `dragBody`, it follows you and E lays it down, lying 90 s more); **taking from a chest of theirs before a
  villager's or a man's eyes is seen** (`theftSeen` on the chest board's take: "Thief!"); **a held line is a shield wall**
  (the engine: `MEN.wallK` 0.5 of a blow gets through a shield in a line, and only a heavy blow breaks it; measured: five
  held before the gate put three of twenty out, was one). The lines are `LORE?`. **Still to build of step 5:** the hird's
  ram, the town fighting a fire near its well, men at a full gate going round by the other, and one of the five ways chosen
  (`duel` stands). **The defence's tactics (step 6):** every place draws one plan with its seed (`Village.tacticOf`, `V.tactic`;
  `Village.tactics` gives its points, `Village.applyTactic` sets a man's flags, the same in the game and in `tests/battle.js
  plans`): **gate** (on an alarm every man goes to the gate and holds it: the engine's rally point, `e.rally`, `heardTo`),
  **hall** (the hall's men keep by the hall, `homeR`), **hunters** (they pursue further, `pursueK`, and see further), **watch**
  (three walk rounds by day, all sharper), **muster** (they gather at the fire pit, hold ten seconds, then come on together),
  **bows** (a bowman stands fixed on the watchtower and sees and shoots over the wall: `g.towers` in the nav). Measured on one
  town (`docs/baselines/plans-2026-10-20.txt`): the plans read apart in spread (302 to 463 units from the yard's middle) and
  in when the hero would fall (21 to 60 s). **Rewards (step 7, 2026-10-21):** a place rolls with its seed how full its stores
  are (`V.stockK` 0.4 to 1.6) and how deep its hoard (`V.hoardK`, times `RICH` by archetype: a seat's and a town's chests are
  richer than a farm's), so two places of one size never give the same; a seat has the chieftain's heavy chest as a town
  the jarl's; a full store (stockK high) holds **a sack of food** (a heavy thing carried, stowed and unloaded at home into the
  bag like the silver: `unloadCargo` takes whatever a heavy thing holds) and shows it (`sackPile`, `hangingFish`); **the feast**:
  at dusk (`FEAST` 840 to 1200) E at a laid `foodTable` eats their feast once a day (`FOOD.feast`: above any home dish, for the
  raid; a villager who sees it cries thief). `Village.lootOf(V)` sums what a place holds; `tests/loot.js` prints it against
  the men (`docs/baselines/loot-2026-10-21.txt`: a farm 29 to 37, a village 36 to 53, a seat 61 to 103, a town 149 to 233, a
  church 46 to 66 with no men; about 8 to 12 of value a man in the defended places). **Room for exploration (step 8,
  2026-10-21):** a church at wealth 0.35 and up has **a trapdoor behind its altar down to a crypt** (`Cave.make` kind `crypt`,
  `makeCrypt`: the stair, a passage, the vault with its coffins and bones, a niche with the reliquary over the chest; one cave a
  church, made with the villages by `cryptSetup`, the trapdoor its mouth; E "Enter the crypt", E at the chest "Take the silver"
  (`relicsTake`: 10 to 32 by the place's wealth and hoard, into the bag; the chest then draws broken; kept in the save by the
  church), E at the stair out; the trapdoor stands open from then); **the catacombs** (the village session's interiors plan,
  section 7; Robin, 2026-10-22: "Yes"): a crypt grows with its church (`cryptRank`: a lone church's stays as it was; a town's
  church at `CRYPT_TOWN` 0.5 wealth and up is rank 1; a great town's cathedral rank 2, always, its trapdoor placed at any wealth;
  `Cave.make` kind `crypt` with `rank`, `makeCatacomb`; the numbers mine). Rank 1: the stair, **the ossuary** (a long passage
  with the bones of the old dead in arched niches painted on its north wall, `cave.niches`, `penNiches`), three side passages
  north and south by turns, each **blocked by a fall of masonry** (two of Colin, AD's `masonryFall` heaps, `assets/props/crypt`,
  ores with `block` that the pick clears as the mine's fall of rock) with **a chest behind one in three** (at least one) or a
  coffin, **two chambers round a pillar** (the loop; a shape can be cut away now, `L.holes`, the pillar's face niched too), **the
  relic vault** north of them **behind an iron gate** (`cave.gates`, `Cave.drawGate`: shut it is a wall; E "Unlock the gate"
  with **the priest's keys**, taken with E from the priest of that place fallen or cowering, `priestKeys`, `seen.keys[vi]`;
  without them "Locked: break it open" and the axe breaks it, `GATE_BITE`, 14 hit points), and **a second way out**: a ladder up
  (`cave.exits`, E "Climb up") to a slab before the churchyard's grave farthest from the church's door, nothing marking it until
  you have come up through it, then the slab lies pushed aside and E "Go down" is a way in (`cv.outs`, `cv.opened`, saved).
  Rank 2: two loops joined, five side passages, the vault behind **two gates** with an antechamber, and **the well's shaft** up
  into the market's well ("Climb the well"). The vault's silver is half again more a rank. **Every crypt's coffins open** (E "Open
  the coffin": "Only bones", or now and then a silver ring of 3 to 6; Colin, AD's `coffinStone_open` and `coffinWood_open`;
  `seen.coffins` counts them for the reputation to come, not built; `seen.graves` is Arnor's graves story told). `tests/cave.js` floods each rank (both ways round every
  pillar, the alcoves and the vault shut off by the falls and the gates, the ways out open); `tools/visual/cave.js 11 map crypt1`
  (`crypt2` the cathedral, `OPEN=1` the coffins opened); `debug().crypts()`, `cryptRemake(vi, rank)`, `cryptGo(vi)`. **The hall has a back room** (an inner wall three tiles from
  its end with a locked door, `l.back`; the jarl's or the chieftain's chest stands behind it). The hidden cellar and the
  watchtower were there before; the storehouse loft is not built. `tools/visual/raidgame.js` checks each step in the live game; `debug().garrison()`. The
way-finding is in every real village. Robin has played none of it.

- **Sides:** every fighter has `e.side` (0 against the hero, 1 with him); the hero's blows pass his friends; beasts know only
  the hero (mine). **The soldier** (`Combat.soldier(o)`): closes to his weapon's reach, circles, shows his blow coming (a
  windup of 0.12 plus twice his weapon's), strikes with his weapon's own profile; his shield comes up against blows he sees
  in time and stays up for a wary man; an axe breaks it, a club staggers through it; a blow he has stopped he answers. Every
  number is in `MEN` (`hpK` 0.8 scales the whole of the men's world so only the hero's blows gain on them; `dmg` 12;
  `toMen`). A hurt man who is not loyal may yield or run; the dead lie 90 s. Weapons make cycles, not a balance (the duels
  table is in the archive).
- **Many on one:** at most two strike one target, and no two blows land within 0.75 s on the hero (`slots`, `gapHero`); **one
  on one first** (`onOne`, `onHero` 2, help after `joinAfter` 6 s, at most `onMax`), the rest hang back; a fight makes itself
  room; a man turns on whoever struck him last; householders hold their own doors (`homeR`). Five ways they come
  (`Combat.WAYS`; `duel` kept after the trial, 2026-10-21).
- **Friends** follow beside and behind, fight within a leash, go down instead of dying and get up when it is over; **G** gives
  the orders (with me, hold, storm, carry a chest or a downed man to the ship). A held line keeps its shields up.
- **Walls and ways** (`src/nav.js`): a grid for every village near the hero; nobody but the hero steps across a shut edge; no
  blow, arrow or seeing passes a wall; a doorway takes two at a time; a place's own man opens its locked door; a foe in reach
  with no wall between is struck. A town's gate is two tiles wide.
- **A town's men and noise** (`Village.garrison`): each man has a post and his day; a town at peace does not go for a
  stranger; `Combat.noise(x, y, r)` wakes those within reach (blows, shouts, a broken door, the din of a fight that carries
  further the more are in it); a man goes to look and walks back; nobody pursues past 700 units from his post (450 outside
  his town). Bowmen stand off, loose only on a clear lane, and take the seax up close.
- **The raid:** the quiet way (a man who has noticed nothing falls to one blow from behind; his fellow within 70 units
  wakes), the loud way (doors and locks give to the axe, heard far); your karve on the nearest shore, its sea chest for the
  weapons you leave (a gated town lets in only the unarmed and alone); the carry order; lifting a downed man; leaving with
  those within reach of the ship. By night a place sleeps (a man abed falls to one blow; one in three is a light sleeper; the
  watch walks a round; the back gate is on the latch). **Storming** (G before a place with men following) deals out its
  doors. **Villagers** flee, take cover or arm by their calling; the unarmed can be killed; a drawn blade makes a place uneasy
  and its men challenge you; a raised guard draws nothing in a place at peace. A fallen man's weapon is taken with E
  (`TAKE_T`; the hero's pick-up clip plays in the take's own time, `Sprites.play(..., dur)`: Robin, 2026-10-21, it bent for five seconds). What the scripted raids came to is in the archive (a quiet raid nothing; the church's silver with most of your
  men; both chests and you die).
