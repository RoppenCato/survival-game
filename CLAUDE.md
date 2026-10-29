# Viking survival game: prototypes

A 2D top-down survival crafting game set in Viking-age Scandinavia (three-quarter camera, a painted ink look). Ground, water,
buildings, props, the UI and the synthesized sounds are drawn or made in code; **characters and creatures are modelled in
Blender and rendered to sprite sheets** (since 2026-10-09: `art/`, `assets/sprites/`, `docs/moving-to-blender.md`); recorded
sounds and music come from the sound studio. This repo holds browser prototypes and editors, not a full game yet.

The game had another setting until 2026-10-04 (commit `59f5dd6` is its last). **Nothing of it remains, and no new work may
bring any of it back** (Robin, 2026-10-09): no pixel-sprite hero, no eyewear, no blob body plans, robot enemies or Guardian boss.

**This file is the source of truth for the direction and says how things stand now.** `docs/notes-archive.md` was this file
until 2026-10-16: the full record of every change, finding, number and reason in the order it happened, with Robin's words.
Search it for a function, a file, a name or a date before reworking something, to learn why it is the way it is. Keep this
file to what is true now, Robin's decisions and the rules for working: the story of a change goes in its commit message,
long write-ups in `docs/`, and when something here changes, change it here (do not append a dated paragraph below it).

## Working with Robin

- **Robin's decisions are marked as Robin's; choices I made are marked "mine"** so Robin can judge them. Robin has played
  little of the systems below: their numbers are first settings, measured by bots, not felt.
- Undecided ideas and open questions go to `docs/idea-bank.md`, not here. Proposals waiting for Robin live in `docs/` and say
  so at their top (`world-shape.md`: waters, the lifecycle of a raided place, named
  islands, claims and the year; `build-plan-waters.md`: the steps to build it; **`raid-build-plan.md`: the raid in the real game in ten
  steps with a test for each, Robin's order of 2026-10-20**; **`settlements-plan.md`: one grammar for villages and towns from the farmstead to the great town, grown in rounds, with the research behind it, 2026-10-22**; `ui-review.md` has a list waiting; **`big-island-run.md`: the big island played through on 2026-10-23, what was fixed and what needs work there, for the move to the big island**; **`combat-crowd.md`: fighting two or three at once, three things built to feel (the parry's shock, the finishing blow's fear, the shield shove) and six more to choose from, 2026-10-23**; **`glimpses-chapter0.md`: chapter 0's glimpses, eight options with four recommended, 2026-10-27**; **`playtest-2026-10-27.md`: the game played from the wreck to the blót, what was fixed and ten questions, with pictures in `docs/pictures/playtest/`**; **`release-and-coop.md`: what releasing the game and playing it with two or three friends would take, and the browser question with its frame-log test, 2026-10-21**; **`pet.md`: a pet system widened from Robin's seed, the animals, the orders, what it is for, with questions, 2026-10-23**; **`building-review.md`: base building played in six places with pictures, what works, what was fixed, what is lacking, Colin, AD's view and the steps to make it fun, with questions, 2026-10-24**; **`runes-rework.md`: the rune system reworked, slots by input, blood that wakes a rune, the blót as the well, the ring as one legendary slot, with what other games do and questions, 2026-10-23**). **Finished
  business lives in `docs/archive/`** (the two playtests, `before-wednesday.md`, `boats.md`, `lighting.md`, `raid.md`, `creatures.md`, `arm-ring.md`, and since the cleanup of 2026-10-26 `roadmap.md`, `runes-ideas.md`, `rune-trial-2026-10-24.md`, `ships-plan.md`, `start-loop.md`, `the-beginning.md`, `battle-plan.md`, `talk-and-lore-book.md`), code, tools and assets no longer used in **`archive/`** at the root (its `README.md` says what and why), and the
  pictures in `docs/pictures/`. **A cleanup follows the project skill `.claude/skills/cleanup`** (Robin, 2026-10-26: archive what is unused, update the docs, go through the editors one by one).
- **Our names** (Robin, 2026-10-22): I am **Clive, GD** (the Game Developer); the Art Director is **Colin, AD**, the Lore
  Director **Alistair, LD**, the Sound Director **Derek, SD**. Robin may say "Clive" or "Game Developer"; we always write the
  full form, name and tag, when we name ourselves or each other.
- **One project roof, `C:\dev\SG`** (Robin, 2026-10-16): `Art Director`, `Sound Director` (Robin also says music or
  sound director), `Lore Director` and `Game Developer` (this repo; it was `C:\dev\survival-game`).
- **The lore is the Lore Director's** (`C:\dev\SG\Lore Director`; the agreement Robin approved on 2026-10-16 is its
  `docs/integration.md`): names, people, families, what creatures are and what folk believe, and the words people say (lines,
  cards, tales, name pools). **The lore says what people believe; the game decides what is true.** Interface words (prompts,
  toasts, the big-step boards, plain item names) stay mine. Only canon reaches the game, delivered as `out/lore/` with a
  HANDOFF.md, copied into `assets/lore/` and inlined at build time; lines come keyed by situation with slots (`{name}`,
  `{place}`, `{lack}`, `{dead}`), under 130 characters. Words in the game that Robin never reviewed are "in-game" in its
  canon. **A name or line needed before the lore has one is a placeholder marked `LORE?` in a comment, and a message to the
  Lore Director; Robin's lore decisions made here are messaged to it.** `docs/beasts.md` keeps only the mechanics. **The lore
is story, people and beliefs; play is mine** (Robin, 2026-10-17). **Rumours** (handoff 3) are in `__LORE__` like lines, with
`tier` (whisper, lead, truth: never a truth before the thing is seen), `heard`, `when` and `about`; how they surface is mine
and not built (`docs/idea-bank.md`).
- **The other Claude sessions are studios**, reached with SendMessage (the Lore Director above): the **Art Director** (`C:\dev\SG\Art Director`; models,
  renders and sheets, dropped in `C:\dev\SG\Art Director\out\`) and the **Sound Director** (`C:\dev\SG\Sound Director`; sound effects and music
  in `out/sfx/` and `out/music/`). **Copy a drop as the whole folder** (its numbers move boxes that a list of files leaves
  out). Neither studio nor I can hear: a new sound starts from a reference Robin likes, measured, and Robin chooses by ear in
  the Combat Arena's The sounds panel.
- Robin works on a 34 inch ultrawide and sees the game at 1200 by 750 at 3 pixels a unit (see "Judge it at Robin's size").
- Mixamo and other sites: Robin signs in in the browser pane; never sign in, accept terms or change account settings.

## The game design, as decided

- **What makes it different:** raiding, exploring and expanding; several ways to progress, not boss kills as in Valheim.
- **Raiding:** villages, castles and churches on the islands are raided for loot and for people to recruit. Churches have
  only friendly priests who cannot defend themselves: lucky strikes, though an army may turn up. Some villages are for
  trading; one big central trading hub, heavily guarded, is unwise to attack. Nothing is off limits; reputation (risk and
  reward) is the only brake.
- **A pet system is one of the big new systems a later chapter opens with** (Robin, 2026-10-23; the chapter not yet said): it comes through a family close with animals who keep many pets (Robin will think more on them), different kinds of pets with different uses, and a pet is its own person, named and cared for; **runes augment the pets with passive abilities and bonuses, and the rune system is reworked when that chapter is worked on, not before** (Robin, the same day); **the rework's shape so far (Robin, 2026-10-23, `docs/runes-rework.md`): actives augment specific attacks and keys; a stone altar you build, where at a season's end an animal is sacrificed to choose a rune, the animal setting the tier; two kinds of rune, the sacrifice pools' and the world's; a library of your own; a rune woken at the altar by your blood dripped into its carving until it is red; no cards: stones laid by the animal, a storm, the stones turned to runes, lightning breaking the rest and carving the chosen; passives a fixed set; and Robin's yes to the proposal's shape, 2026-10-23, "This rune system sounds great!": four fixed passives, hand, foot, eye, heart; the library as stones round the altar, bound there by blood and nowhere else, the altar board showing only the runes that fit the slot picked; actives that charge on blood drawn; no plain-number runes; marks for the combinations; a man may be sacrificed; a rune gains power with time and use;** the proposal is `docs/pet.md`, the rest of it waits.
- **The hird** (Old Norse hirð; a member is a hirdman, and they call each other fellows): they crew your ships (the more
  aboard, the faster, rowing and sailing), fight beside you on land, can die in battle (never at random), work at home and
  defend what you claim; found and recruited in different ways, with randomised stats and traits and training to change
  them. **They follow and work only inside your territory and on raids, never in the open world** (and, mine 2026-10-21: with no
  stone raised yet there is no territory to keep to, so Admin's men follow anywhere, board and land as at home). Claim stones cost stone
  and berries (and snake blood, as built); every stone after the first needs a hirdman as its keeper; without food they are
  slow and sad, never leaving. **Arnor is not the first hirdman** (Robin, 2026-10-26; he was until then: who is, is open); **he becomes the first villager of the player's own home** (Robin, the same day: he comes over to the village late in chapter 1, wants to start again, comes over to the home the player has built, stays and works about the place as its smith, and brings in the blacksmith once copper ore or a bar is found; he no longer teaches building, Robin 2026-10-28; not built). **The hird gets a building of its own** (Robin, 2026-10-25), not beds in
  the sleeping place (not built).
- **The year:** spring, summer, autumn, winter, Stardew Valley style but **the player decides when a season moves**, at a
  moment at the end of each season; not abusable, never a stress; seasons feel different and open different things. After
  winter, "controlled randomness": an unclaimed destroyed place is rebuilt stronger by survivors, taken by bandits or
  overgrown, and every island gets generated events (a new settlement with boats and a path, trolls in a new cave, new
  creatures such as Näcken, unraided places growing). **The year's look and clock are in since 2026-10-23** (below, "The year"); the events after winter are for later.
- **The realm is Skargard** (Robin, 2026-10-16, through the Lore Director: from *skärgård*, archipelago; a part of Midgard), the
  map's title. The gods are background figures (Robin, 2026-10-16): **a god who appears in the world comes in disguise, is never named as that god (the Wanderer is never called Odin), is never a boss and is gone by morning; folk may name the gods in what they say and in the Lore Book** (Robin, 2026-10-23: "Keep 'Somebody thank Njörd'"); Odin forged the last ring, the one the legends are about; **it is not called the dragon ring** (Robin, 2026-10-19: "dragon"
  is not Viking; the name is the Lore Director's to give, "Odin's ring" until then, `LORE?`; the id `dragon` stays in code). The dragon-head ship stems and the carved dragon post stay (Robin, 2026-10-19: they are
  historical, the *dreki*).
- **The map:** the compass means something, the details are generated: north colder, south richer and settled ("England in
  the south"), east rivers and trade, west open ocean and the unknown. Distance from home sets how hard a place is,
  direction what kind. An archipelago of big islands and big seas; one island can hold several biomes; each biome is harder
  than the one before; no gates or keys: you struggle in a biome until you have done things in earlier ones. **Nothing
  handcrafted: everything generated in a controlled way**, the hub and the great seats too. The map shows nothing until seen.
- **The shape of the sea (Robin, 2026-10-19; `docs/world-shape.md`):** one continuous sea of **waters** (clusters of islands
  with crossings between). **Home water is a lot bigger, with more islands, villages only and a simpler jarl; the player is
  tied to it at first. Raiding is introduced in the next seas.** The four seas round it are **about the same level, each
  giving different things** (the ring's tools on every side, separate things not required to go further). **Seasons
  everywhere, eventually.** **Home water cannot be raided until raiding is opened in the second circle; then raiding it
  lets you overthrow the jarl and claim home's islands, one by one if you want. A new ore every circle; each circle's
  material is got in different ways** (Robin, 2026-10-19). The rest of that doc (circles that do not look like circles,
  generation, climates) is mine, waiting.
- **Scope for now (2026-10-09): the starter island and the big island only**, until they feel great (`spec.sizes` [120,
  400], `biomes` [0, 0], `count` 2); the lowlands and further islands stay in the code, not spawned. **The big island has a
  small mountain** (foothills and a small plateau, about a sixth of it, its north-west; the first copper).
- **Chapters are stages of progression** (Robin, 2026-10-26; `docs/chapters.md`, read it first when choosing what to do, and keep it up
  to date): a word for us only, **never announced in the game**, which is one open world ("fishing is learnt in chapter 1"); and a band
  of islands round the starter island: **chapter 0 the starter island, chapter 1 the islands round it with the big island and the first
  village, chapter 2 the next band** (its south: a big island with roads, towns and a Jarl's high seat, the smaller guarded towns round
  it the first raids; its north: cold, caves, trolls, the Trollvinir town; east and west saved). Under each chapter: what the player
  sees, makes and holds, the systems he starts, what it teaches, anything special, and **glimpses** of what is coming; a system no
  chapter has yet is on the doc's list **Systems that need a chapter**. **Robin's decisions of 2026-10-26:** **built** ("Chapter 0 as rebuilt" under "The game as it stands"): the big turns in
  the map's lettering in place of the boards ("Building" keeps its board until a way for new things to do is found); **quests**, kept in
  the book as what was said and what needs doing, in words, never a count; big animals give nothing until butchered at a table (the first
  at Arnor's); wooden arrows made and used up, in a quiver; chapter 0 with the wooden sword (was the strong stick), leather shoes, no wolves, no altar, berries raw with a 2-minute wait, the straw bed in Arnor's house, his boat mended overnight and given for helping; the flint sword
  gone from the steading; the moose and the bear saved for later; Arnor no longer the first hirdman. **Robin's decisions of 2026-10-28, built:** roast meat at any fire from the start (the starter island cooks only that; the better dishes are the village's), and **the workbench opens building** everywhere, as in Valheim (`seen.freeBuild`; before it the comfort pieces, the workbench, the campfire and, for Arnor's house, the plank wall in its gaps; the old first-night key `slept` on the house's pieces is gone); Arnor later comes to your home as its smith and no longer teaches building. **Robin's playtest of 2026-10-28, built** (`docs/state/game.md`, "Robin's playtest of 2026-10-28"): the chain is the shore quest at the wreck, Arnor's house (walls and roof, no fire of its own), his meat, then **a deer with the bow** (the boar gives sinew for the bowstring, the deer an antler), the deer's supper running the day down to night, the boat mended by morning, and the quest **East** to the big island; a quest given or done shows the oak plaque; Arnor sits by the steading's fire of an evening; a beast is laid on the butcher's table with E and butchered with a second E; no thrall cut loose for now; **X while building snaps to the grid**; an odd-shaped room gets one hipped roof. **Chapter 1, round one, built (Robin's notes of 2026-10-29):** wolf packs of three or four at night and a held torch keeps them off; the torch in the shield's hand, the bash with it sets fire; the cave the wolves' (one or two at a time), mushrooms in it, Hogni and his adze; Old Aslak's quest and his shop of lessons (the shipwright's craft, the sail, the ship's looks); a meat for each beast, dishes learnt at a village's pot, angelica; the spear. **Round two, built** (the game's side): the village's blót (Hallveig, a wolf on the village's altar, the rite at dusk with the scripted first pick, ár), the fisherman Gamli's lesson, Arnor coming over to your home; **the blót's cut-scene is the first trial of Colin, AD's cut-scene tool** (Robin, 2026-10-29: he researches how cut-scenes are made, writes a skill, builds the tool; not in yet). **Not built:** the basic outfit's
  undyed shirt (a choice for Robin), chapter 1 with no trolls (an abandoned cave the wolves hold, troll traces in it), no copper, the
  Spear, the knock-out cudgel only on a wolf with low health, cooking learnt in the village, fishing from a fisherman, the first rite at
  the village with a wolf as the goal and its scripted first pick, the rune buckets, Arnor resettling at your home, Old Aslak's brother
  found in the cave's depths (the arm ring's story gone), the shipwright's sail boat the way out.
  **One chapter at a time** (Robin, 2026-10-20): a chapter is finished when Robin is happy with its content and six areas, each
  perfected for that chapter: models and art, combat and gathering, menus and crafting, the interface, music and sound and effects,
  the day and night. **What belongs to another chapter is moved there** and not worked on now. **The current chapter is 0.** One
  engine and one set of numbers throughout.
- **The start:** you land with nothing at a wreck on the starter island; an abandoned, broken steading there shows how a
  village is set up and that the world is dangerous; there you meet Arnor, the first friendly person, and hear of the first
  legendary Viking. **Robin's start (2026-10-16, through the Lore Director; canon):** the hero's past is never explained and
  the player picks his name (no line ever says it); the raider is **Ormr Midgardbane** (folk say the World Serpent fears him;
  he always leaves one alive to tell it); the survivor is **Arnor, the village smith**, an ordinary man scavenging and mending
  in the ruin (he keeps the place Brokk the dwarf had in earlier builds: the story, the raft, the first hirdman); the steading was **Thorgunna's**; the
  dead Viking in the troll's cave is **Hogni** (the first claim stone at the steading names the place **Thorgunnastad**: Robin, 2026-10-25, the lore's canon; the later stones' names `LORE?`), whose brother **Old Aslak** lives in the big island's first village (village 0, which the generator never makes a ruin: on a seed of 2026-10-23 it was one, with nobody in it and no Aslak). A slower beginning that introduces things one at a time (Robin,
  2026-10-14). Sleeping skips the night. Dying at sea is forgiving: the boat drifts to the shore where you last slept and
  needs half its materials (not built). Currencies: more than one, a new one about every third biome; the first island trades
  basics, silver comes with raiding. Arrows are ammunition carried outside the bag, in the quiver (wooden arrows made and used up since 2026-10-26; more
  types later).
- **The second biome (decided 2026-10-07; built, not spawned):** the settled southern lowlands (oak, beech, ash, hedgerows,
  hay meadows, ploughed strips, orchards, chalk; walled towns, churches with priests, a manor), a bit further out; iron (bog
  iron, the bloomery, iron tools and weapons, mail, gambeson, helm, painted shield), the karve, new grounds (field, chalk,
  marsh), raiding with silver as the second currency, and a human jarl who holds the silver ring, won by raiding his hall.
  The draugr is a side threat for later.
- **Villages:** across the islands with generated names; a jetty with a road up and moored boats that cannot be boarded;
  roads between villages uncommon; none thriving on the starter island. Lots of islands and many kinds of places, so every
  playthrough is new yet familiar.
- **The raid (decided 2026-10-07 and 2026-10-13):** about twenty minutes, made of loot spread out behind doors to break (the
  storehouse, the church's silver, the hall's chest, a hidden cellar, every house), each thing taken waking more of the
  place; heavy loot carried to the ship a piece at a time with hirdmen helping, the walk to the shore the gamble; the
  defenders gather to the noise (no bell, no waves; fighting is not the biggest part). **It runs in the real game since
  2026-10-20** (`docs/raid-build-plan.md`, steps 1 to 9 built, step 10 is Robin's play; the live checks are
  `tools/visual/raidgame.js`). **Decided, not built** (what is built today in brackets): pursuit by what you took: short for a
  quiet theft, to your ship for the church's or the jarl's silver (built: nobody past 700 units from his post, further
  under a hunters' plan); a man of yours left behind won back by silver (built: won back by a raid, below); the party grows
  with your ships (a karve's six for farms, churches and small villages; a town of twenty waits for a longship's crew;
  built: Admin gives men); men not fighting fall back with you when you carry (built: only on G); a priest who does not
  fight and can be spared (built: a church has no men and its priest is a villager who runs); traders shut to you and a
  price on your head; one more order, keep the ship. **Built as decided:** a town at peace lets you walk in alone, and with
  armed men at your back its gates are barred; a carrier holds on until badly hurt (`MEN.dropAt`); a held line is a real
  shield wall (`MEN.wallK`); if the hero falls with any of his own standing he wakes at sea aboard his ship, what he carried
  lost; a blow from behind on a man who has noticed nothing kills; the unarmed can be killed; X draws the weapon and a
  drawn blade in a place at peace is a threat; a fallen man's weapon stays with him and is taken from him with E. **The
  people of a raid (step 9, 2026-10-21; the lines are `LORE?`):** a thrall of a place (the generator's role) is cut loose
  with E and joins the hird where he stands (`cutLoose`; he follows anywhere until he is home or aboard, `m.freed`; the
  place remembers him gone, `seen.freed`, an index among its folk as the dead are); a man of yours left behind (`m.lost`)
  stands bound by the hall of the place that took him while its men are up (`boundHere`) and E cuts his bonds; a man who
  yields is let go with E (`letGo`: he runs, out of the fight); a heavy thing dropped in the open goes home on the back of a
  free man of the place when nobody of yours is within 240 units of it (`takeBackTick`; a heavy thing remembers where it
  stood, `it.home`); a place raided before keeps two men more a raid, up to six (`defenceOf`). How many come at you at once
  has five versions on the battle board; `duel` (one on one first) stays after the trial of 2026-10-21 (`tests/battle.js ways`: the least crowding round a man of yours and the hero standing longest; Robin may pick another). **Step 5's second half (2026-10-21):** **the ram** (`RAM`, `ramTick`; G before a barred gate, a locked or stone door or a stone wall of a place not yours with four of your men free: a felled trunk within 260 units becomes it, else 8 wood from the bag; the four carry the studio's ram to 54 units before the piece and swing every 1.6 s at power 3.2 through Ruin's `bite.ram`: a gate in about five swings, a church's door in six, a cut-stone wall in forty, the town wall in ninety; dressed stone and the town wall now have hit points but no hand tool bites them; the loudest thing a raid does, 560 units, and the alarm; a man badly hurt lets go and under four the ram is set down, G at it takes it up again); **the town fights a fire** (the brigade, under Destruction); **the men behind a full gate go round** (`Nav.ROUND`: a man who has waited 3 s at a doorway his own side fills asks the grid for a way round the whole doorway and takes it, the other gate; `MEN.flankAfter`: a man hanging back from a fight with a doorway between him and it does the same after 3 s and comes at you from the far side; measured rare in the bots' trials, 0 to 0.5 of twenty: a town's line is over too soon for it; for Robin to see); men sent to a rally point (the gate and muster plans) fight there, their own door no longer bounds them (a fix). **Next:** step 10 (Robin plays).
- **Scale (the canon, 2026-10-09):** the hero is 1.8 m and 39 units tall: a unit is 4.6 cm, a tile (32 units) 1.5 m. The
  camera sits at zoom 0.65 (the view 390 units tall); houses are at the sizes they were dug up at; the starter island is 120
  tiles, the big island 400, about 200 tiles of water between (`gap` 240); the hero jogs at 78 units a second and sprints at 130 (Robin, 2026-10-22: "the normal pace needs to be around 75-80"; he walked at 60 on 2026-10-21 and jogged at 84 before that: `Combat.HERO_GAIT`). Islands feel
  large through obstacles (groves, cliffs, water) more than through distance.
- **Look:** **the art direction is kept; no makeover** (Robin, 2026-10-20, after the studio's options page). Happy, lush, green Scandinavia in daylight; no dark shady scenes, no glowing weird lights. **Art direction
  (decided 2026-10-07, `docs/art-direction.md`): the ink of Egerkrans, the light of Bauer**: one colour key a scene with one
  hot accent, shadows cooler and bluer than the light, an earth-and-bone palette, a warm brown-black hand-made line heavy on
  the shadow side, one sun upper left, grain in every fill. Characters in the cel style Robin picked (2026-10-09). Trolls as
  in the old illustrations: hairy, heavy, long-armed, evil and careless, never goofy or smiling.
- **The sticker cure** (Robin, 2026-10-21, through the Art Director: "the ground looks lovely but the trees etc look pasted on
  like stickers"; the studio's board `out/sticker`): three things make the rule for every set piece. **The studio's:** every
  set piece re-rendered with the outer contour at 0.55 of its weight in dark green-brown and the inner line at 0.8
  (`toon.piece_line`, in `art/build/toon.py`, called after `toon.freestyle` in every set-piece builder; the people, the
  beasts and the hero keep the heavy black line; the fires and the Building board's icons are not re-rendered); the drop
  `out/thinline` copied whole, 2026-10-21 (every box 2 to 4 px smaller, the JSON with the pictures). **Mine at runtime:** a
  **cast shadow** under every set piece (`drawCastShadows`, before the fire shadows: a soft blue ellipse to the lower right,
  `w.castShadow`: the studio's numbers, its reach about half the piece's height, its centre 0.4 of the height right and 0.15
  down; full by day, half again longer and bluer through the dusk and the dawn (`sunK`), gone at night when the fires'
  shadows take over), and **ground contact on grass only** (`w.onGrass`: the meadow's grass, the fells' drier grass, or
  none on sand, rock, painted ground, a laid floor or the ash of a burnt room): a dark halo under the foot (`w.footHalo`)
  before the piece and the meadow's own blades over the lowest bit of its base after it (`w.footGrass`, seven to twelve
  tufts of three in the living grass's three greens, baked once a picture). One soft disc a colour drawn through a
  transform, so a shadow or a halo is one drawImage; what a thing stands in is remembered until the ground is painted again
  (`w.groundRev`). `STICK` switches both. **The buildings in depth** (the village look plan, 2026-10-22, Robin: "All of them. Go"; the Art Director's depth board and fence recipe, `out/village_depth/RECIPE.md`): walls 40 tall and roofs 10 over them (`Build.CFG` `wallH`, `overhang`); every wall, fence and roofed room throws its shadow to the lower right, swept by 0.5 and 0.14 of its height (a room's from its ridge), `rgb(26,34,62)` at 0.5 blurred 4, cut from its own floor, gone at night (`bldShadows`, baked a 640-unit chunk at a time into `BSH.cache`, laid again when the rooms are, one chunk a frame); on a wall's face (`Build.wallFoot`) a dark band at its foot, sill stones under timber, wattle and logs, and the room's south face turning from the light west to east (`SOUTHF`, its extent passed to `drawH`); the corner posts stand proud with a lit west strip; the eave's shadow band 9 tall under the roof's edge (9.5 under thatch's cut ends); the gable's east half in shade with a band under its bargeboards; **a church's tower** (`Build.drawTower` over its south door, 44 wide, 70 over the apex, a pyramid roof and a belfry, fading with the roof; the old `bellTower` piece is not placed at a church). **The fences as angled runs** (the village session's `V.fences`: polygons of the studio's `railPost` pieces, a kink each; their Build edges kept beneath, `hidden`, for the raid and the way-finding: the hero stops within a tile of the drawn rail, Robin accepted): the rails drawn between consecutive posts of one run (`RAILS`, `drawRail`: two at 0.42 and 0.78 of the post, sagging, one in ten missing, one in twenty-five hanging).
- **The ground never looks square:** kinds of ground meet along smooth ragged curves, coasts curve, sand is warm, beaches
  wide; square tiles only for built floors indoors. **Worldbuilding is open:** groves with clear ground between, undergrowth
  near the trees, room to build. Moving things turn smoothly to any heading, like the ship.
- **Tone:** real Viking-age Scandinavia, not a copy of Valheim: things that existed (well sweeps, storehouses on posts,
  boathouses, fish weirs, bee skeps, charcoal pits) and real animals in true proportions. Environment objects come in three
  groups: found in nature, left by people, built by Vikings.
- **Base building:** piece by piece, walls on tile edges, and a roof that appears by itself over any space closed by walls,
  doors and windows and fades when the hero is inside.

## Design conventions (Robin's rules)

- Game rules live in plain data plus a few systems: balancing is editing numbers, not rewriting code.
- Combat is keyboard-first; the mouse only aims the ranged weapon (which has an auto aim too).
- **Guidance is subtle:** the game states no goals and explains nothing: no journal, no checklists, no explaining labels or
  hint lines. Only bare key reminders at the very start; everything else is found (prompts over the hero, people speaking
  in their own voice, how things look, a tooltip). Recipes appear when you first hold their key ingredient, never as
  question marks.
- **Reward, don't punish:** Valheim's food is the model: the unprepared state is the weak baseline, preparation gives buffs.
  No meters that drain and hurt, no repair chores as punishment, nothing that cuts stamina, no wetness. A rested or comfort
  buff from a warm, furnished home is wanted.
- No screen shake: hit weight comes from short pauses, squash, rings and sound. The hit weight preset is "Snappy".
- **Editors first, then the game:** try a thing in an editor or test scene and hand it over with "Use in the game"; shared
  logic lives in `src/`. Every editor: a spec of plain numbers, sliders, presets, settings as text, browser storage; tuned
  values reach the code when Robin pastes the text and it is made the default; change a storage key when its meaning changes.

## Commands

```
npm start         # rebuild, then open dist/index.html (the start page)
npm run build     # python3 tools/build.py: stitches templates/ + src/ into dist/*.html
npm install       # once; the only dependency is @napi-rs/canvas (a canvas for headless tests and renders)
npm test          # the scripts in tests/ in a row (combat, weapons, gathering, the deer, iron, the karve, fishing,
                  # the runes (runes2), the bash, the bow, the seasons, caves, ambient sound, the blows, the parry chain, the battles, destruction)
npm run art:...   # the Blender pipeline (see "Art"); npm run mountain, npm run cave: render checks
```

**The test build for friends** (Robin, 2026-10-27): `npm run build` also writes `release/` (the game alone, no Admin, sandbox, new island, back-to-camp, sky board or test scenes, the game's `RELEASE`; **its world home water alone**, the starter island, the big island and the islands round them, `spec.waters = { rings: 0 }`, **no troll's cave**, music and the world's sounds starting at 20%, its own save `skargard.save`: Robin, 2026-10-27; its start page `templates/release.html`) with the version from `RELEASE.json`. **A new version** ("alpha 0.2"): raise `RELEASE.json`, build, commit, push, then `git push origin HEAD:stable`; the workflow `.github/workflows/pages.yml` publishes `release/` and `assets/` to https://roppencato.github.io/survival-game/ (GitHub Pages, its source set to GitHub Actions in the repository's settings). Saves travel as files (Escape: Save to a file, Load from a file).

No bundler, linter or type checker. `.claude/launch.json`: `workbench` serves the **repo root** on port 8765 (open
`http://localhost:8765/dist/<page>.html`, so pages reach `assets/`), `workbench-alt` on 8766 when another chat holds 8765.

## Things to know before changing code

- `dist/` is committed: after editing `src/` or `templates/`, `npm run build`, then **parse the built pages** (`node
  tools/parsecheck.js`: `new Function(script)` over each page's scripts; it takes a second) **and check for a name defined twice**
  (`node tools/dupcheck.js`: a page's script is one long scope, and a second `function x` in it silently wins over the first
  wherever it is called. 2026-10-21: it found `bodyNear` (the raid's fallen man had hidden the cave's body: the arm ring could
  not be taken for a day) and `storeAdd` (the chest board's had hidden the hird's: a job gave nothing into the chests since
  the storage commit); `menOf` had done the same in raid step 1. A new function gets a name nothing else in the page has. **It also reports a statement swallowed by a `//` comment on the same line**: found 2026-10-21 in `enemySprite`, where `var o = {...}`, every beast's drawing options, had sat after a comment since 2026-10-20, so the beasts drew without their fire light, loops, young size and lying time.)
- **Never write a placeholder's name (`__SPRITES__`, `__WORLD__`, ...) in a comment:** the build fills every mention, comments too (2026-10-22: two comments pasted the 1.6 MB sprite table into the game three times and into three editors twice, 7.9 MB of the pages); `tools/build.py` prints a `!!` line when a big one is named twice in a page.
- Source files load two ways, inlined into a page and `require`d by Node scripts: no ES module syntax, no browser globals at
  load time. `stylelab.js` needs `global.__mk` for canvases.
- **A patch must not put a `//` comment in the middle of a line**: the templates' lines are long and hold many statements,
  and the comment swallows the rest. End-of-line only, or `/* */`.
- Git converts line endings (`core.autocrlf`): files in the working tree may have CRLF; scripts that search for multi-line
  text normalise `\r\n` first. `build.py` writes LF.
- **The tests have no assertions**: they print values and exit 0 unless something throws. Read the lines against their
  labels; a line marked `!!` is a fault. `tests/btest.js` and `tests/balance.js` are not in `npm test`.
- **A random test can be played again from a seed:** `RSEED=28 TOWN_SEEDS=138,471,101 node -r ./tools/seedrand.js
  tests/battle.js town 3`; `TOWN_DBG=1` prints who stood still and why. Before judging an engine change, run the same seeds
  on the committed code (`git show HEAD:src/x.js` into a scratch folder) and on the change. The scripted raids in the page are
  measured by the same engine: run them again last.
- Tests and render scripts write throwaway PNGs into the current folder; `.gitignore` covers PNGs in the root.
- **The reference scene** (`tools/visual/dayisland.js`, the starter island as the game draws it, used by the sheet checks and the studio's boards): `await DI.load(World)` before `make` and `paint` loads every studio picture (node decodes a picture only once its event loop has run), so the scene shows the set pieces at their own size with the game's shadow and foot grass; a script that skips it gets the old drawn props (2026-10-21: the round teal bushes the studio saw were only ever this scene's).
- **Test with the sound off:** open every page with **`?mute=1`** in the pane (Robin hears it and cannot silence the pane).
- **Judge it at Robin's size:** the pane's canvas is 800 by 500 at 2 pixels a unit; Robin's is 1200 by 750 at 3, shown about
  half again larger. Before judging light or painted ground: `resize_window` to 1920 by 1080, reload, capture the canvas and
  look at a crop at full size. Reset the viewport afterwards.
- **Driving a page in the pane:** a hidden pane stops animating; `tools/visual/drive.js` takes over `requestAnimationFrame`
  (`H2.step(n)`, `H2.sim`, `H2.snap`, `H2.part`). The page that `document.write` replaces is still alive: load `drive.js`,
  wait a tenth of a second, `H2.drop()`, then write the page again. A tool call into the page must stay under about 45 real
  seconds. Sheets load lazily: let real time pass before judging people on screen. Results too big for the tool land in a
  file: decode them from there.
- **Never read the canvas back** (`getImageData`) in the game's loop: Chrome drops the canvas to software drawing for good.
- **Robin plays from `file://`** (`npm start` opens `dist/index.html` from disk, and his save lives under that origin), **and there a canvas that has drawn a picture from disk cannot be read back at all** (Chrome taints it: `getImageData` throws a SecurityError; the pane's `http://localhost` never shows it). 2026-10-23: the autumn grading of every tree threw, the frame stopped before the hero was drawn, and Robin saw only the ground. the pictures' looks are composites since the same day, Colin, AD's (`gradeCanvas`, `rimCanvas`, `wetCanvas`); `pixOf` in `src/world.js` guards the one read left, the ground's grade, which falls back to the ungraded piece where the piece holds a picture. Anything new that reads pixels goes through it, or is tried on a `file://` page before it is called done.
- **Never fill with a pattern made from a picture** (`createPattern` of an image or bitmap) on the game's canvas: each such fill makes the browser finish everything drawn so far on the spot (measured 2026-10-22: about 6 ms a fill, 30 to 45 for a frame's first board; Robin's frames fell to 25 a second with the bag open beside the workbench). Make the pattern from a canvas copy of the picture (`hpat`); a canvas's pattern costs nothing. The frame log times the boards apart (`boards`) and writes the script heap and the decoded sheets each second (`perfMem`).
- **Never set `filter` (a blur or any other) on the game's canvas in a frame's drawing:** it costs the graphics card a pass of the whole canvas each fill (2026-10-28: the windows' light pools, blurred every frame, took Robin to 40 fps inside a house). Blur once into a kept picture (an offscreen canvas made once) and draw that.
- Rooms and their solids are rebuilt when a frame is drawn (`if (bDirty) rebuildRooms()`) and in `ruinTick`.
- **`Combat.api.debug()`** in the game is the console's way in (`eWhat()`, `errlog()`, `perflog()`, `world()`, `villages()`,
  `sceneRows()`, `act(id)`, `tick(dt)`, `place(...)`, `raid()`, `arms()`, `shield()`, `cave()`, and many more); `Combat.dbg()`
  hands out the engine's `P`, `W`, `S`.
- **Frame time (measured 2026-10-21 in the pane at 1200 by 750):** the game's own work is about 4 ms a frame; what is left of a
  frame is the browser drawing on the graphics card, which the pane shares with whatever else the computer is doing (with
  nearly nothing drawn it ran 56 to 60 fps at one moment and 44 at another). Fixed that day: the living grass is baked tufts
  drawn as pictures (`tuftPic`, fifteen sway steps, six shapes a count: 47 to 54 fps), and the save's ground diff is kept until
  the ground is painted again (`GDIFF`, `w.groundRev`: the autosave cost 120 ms every ten seconds, a hitch). Before judging a
  change by its fps, measure it in alternation with a near-empty frame (`PERF.skip`), as outside load moves both.
- **Admin's Download my settings** (2026-10-26, `settingsDownload`): `settings.txt` with every key the browser keeps for the game and the editors but the saves and the logs, so a tuning that lives only in Robin's browser (the old Gathering, Grass, Hird, Item and Creature editors' `game.gather`, `game.grass`, `game.hird`, `game.give`, `game.creatures`, which the game still reads) can be made the game's own. **The error log and the frame log:** every error a page throws (or a frame throws: the loop catches it and goes on) goes to
  `ERR.lines` and `game.errlog`; Admin downloads `errorlog.txt`. Every second of play writes a line to the frame log
  (`game.perflog`; Admin downloads `framelog.txt`; a frame over 50 ms is a SPIKE line). Robin puts both in the project folder.

## How each system stands

**The detailed state of each system lives in `docs/state/`, read when that system is worked on** (moved out of this file on 2026-10-27, Robin's yes: it was 253k characters read at every start): `game.md` (the game page: chapter 0, the start, gathering, the bag, crafting, building, home, the year, the weather, wading, day and night, food, the animals, beasts, the cave, the runes, the hird, villages, boats, the sea, fishing, the map, the look, the UI), `pages.md` (every page and test scene), `combat.md`, `raids.md` (men, towns and raids), `destruction.md`, `world.md`, `art.md`, `sound.md`. **Before changing a system, read its file; after changing it, update it there** (the project skill `system-state` says the same). The file tour that was here (Source layout) is what the folders and each file's header show.

## How the game fits together (the map)

**Read this before changing anything: it says what else a change touches.** The detail of each part is in `docs/state/`; this is
the web between them (2026-10-27, Robin: "so that when you change something at one place, it doesnt break on another place").

**The player's path, and what gates each step** (chapter 0, then 1):
- Wreck → planks, litter → wood, stone, fibre → the first recipes (`known`: a recipe shows once its key ingredient was held).
- Steading → Arnor (`arnorState`: meet → wait → mending → teach → taught; `arnorLineId` picks his lore entry for each state).
- His story's end → quest house (`seen.quests`, `questTick` in `zonesTick`) → `houseGaps`, `mendGap`, a fire by his door → `arnorHouseMended` → quest meat.
- Meat = a beast butchered at his table → `seen.meatForArnor` → state `mending` → a night slept → boat `ready` (the wake block) → state `teach` → `arnorBoatGive` (state `taught`, `seen.raft`).
- Off the starter island (chapter 1, mostly not built): free building waits for `seen.freeBuild`; the altar waits for `seen.villageBlot` (the village's first blót).

**Gates live in a few places; change one, check all of them:**
- `onStarter()` with `STARTER_PIECES` and `STARTER_HIDE`.
- `pieceKnown` (the Building board, by the keys in `PIECES`).
- `known` (the recipes, by `RECIPES2` keys and `taught`).
- `seen.*` flags: `build`, `slept`, `raft`, `freeBuild`, `villageBlot`, `fishTaught`.
- The prompts in `eWhat`.
- The sandbox (`sandbox()` sets the keys for testing).
- `docs/chapters.md`, which says what each chapter allows.

**What flows into what:**
- **Trees, rocks, grass** → wood, stone, fibre (`Gather`, `Combat.api.harvest`; Admin's `yieldK`).
- **A beast killed** → a body that lies `BODY_LIE`, or `DEAD_LIE` for one that is not butchered, or one knocked out by the cudgel (`knockOut`, `KO_T`) → `takeUpBeast` → `carrying`, saved as `carryBeast`.
  - At a **butcher's table** (Arnor's, `butcherTableEnsure`; one in every village, `villageButchers`) → meat and leather, a boar's sinew (the bowstring), a deer's antler (`BUTCHER`); laid with E, butchered with a second E.
  - Or on the **altar** → the rite → a rune.
- **Leather** → the quiver (`equip.quiver`) → wooden arrows (`quiverAdd`; the bow needs both, `canShoot`) → `stickArrow`, picked up again (`arrowPickTick`). Leather also makes the rug and the leather gear.
- **Meat and fish** → dishes at a fire (`RECIPES`, `workStart`; not on the starter island) → `FOOD` buffs. Raw meat and fish carry the Cooking tag (`cookOnly`).
- **The rite** (`riteStart` … `ritePick`) → `Runes2.learn`.
  - → binding at the altar (`bind`, a health cost) → the engine's slots (`runeReady`, `runeSpend`, stamina) → combat.
  - → the season: `seasonDusk`, `year.pending`, the next waking, `seasonTurn`.
- **The season** → `Weather.day`, the season's grade on the ground and the pictures (`Seasons`, rebaked), `SEASON_GIVES` (berries and grass in winter), the day's music (`dayTheme`), the season dial and the lettering (`placeCard`).

**The day, sleep and waking (one chain, many effects):**
- `day.t` → `isEvening` → a bed (`goSleep`, `bedWhy`: yours, roofed, inside a sleeping place) → `seen.bedAt`.
- The wake block (search "the season called by the rite comes with the morning") does all of these: `day.n++`, `regrowTick`, `morningEmbers`, `yearNewDay`, the pending season, and Arnor's boat mended.
- A new morning thing goes in that block.
- **Where the hero wakes after a fall:** `toSpawn` tries `seen.bedAt`'s bed, then Arnor's straw bed once his house is mended, then the wreck (`toCamp`).
- A fall comes from the engine's death, or from drowning (`swimTick` → `Combat.api.die`). On a raid shore he wakes at sea instead (`wakeAtSea`).

**E is one rule, `eWhat(P)`, read in order:** the first match wins.
- Carrying a beast: altar, table, or "Set it down".
- Then the butcher's table, the altar, people, things.
- A new E action is one `add(...)` line. Put it where it does not shadow another; "Set it down" beside a table is the trap.

**The engine and the pages:**
- `src/combat.js` (`Combat`) runs the hero, the enemies and the blows for every page that fights. The game, the Combat Arena, the Battle and Destruction scenes all share it, and the art and sea editors load it too.
- Pages talk to it only through `Combat.api` hooks: `scene` (`walk`, `still`, `boards`, `heroLift`), `items`, `mods`, `sfx`, `barSelect`, `harvest`, `die`, `knockOut`, `drawArrow` and the like.
- A number belongs in `Combat.tune` (`PROFILES`, `MEN`, `BEAST_GAME`, `SWORD`); the arena's Use in the game writes `game.combat`.
- **An engine change: run the arena and `tests/` (blows, parry, bash, bow, runes_combat), not only the game.**

**Which pages share which `src/` file** (a change reaches all of them):

| File | Used by |
| --- | --- |
| combat, art, sprites | game, Combat Arena, Art Editor, Sea Editor |
| world | game, Art Editor, Sea Editor, World monsters |
| stylelab | game, Art Editor, Sea Editor, World monsters, Village Editor |
| build | game, Village Editor |
| village | game, Village Editor, Sea Editor |
| yard, sea | game, Sea Editor, World monsters |
| items, runes2 | game, Combat Arena (runes2 also the Rune Browser) |
| cave, ruin, nav, gather, hird, fishing, ambient, music, sfx, seasons, weather, sun, roofs_winter, worldmap | the game |

**The save:**
- `save()` writes the bag (`slots`), `equip`, `quiver`, `seen`, `B` (every placed piece and item, the zones, the villages' pieces), `year`, `day`, `runes2`, `fleet`, the hird, `wmap`, the ground's diff, the caves, `carrying` and `carryBeast`.
- `layoutKey()` drops a save made under another world layout.
- **A change to what stands in `B`, or to what a `seen` flag means, needs a once-migration for older saves:**
  - a flag in `B` (`B.steadV`, `B.butcherV`, `B.vButchV`, `B.zArnorV`, `B.arnorBoatV`, `B.zonesV`)
  - or in `seen` (`seen.quiverV`, `seen.woodSwordV`, `seen.newV`)
  - run from `butcherTableEnsure` or `zonesTick`.
- A save made in the pane is not Robin's: he plays from `file://`.

**Drawing:**
- Things are drawn in one list sorted by y; built items go through `spriteName(it)`, so a state picture swaps there (the straw bed asleep, the boat's states).
- A name with no picture stands in through `STAND_IN`.
- The hero is drawn from a composed look (`heroLook`, `handLayers`). A new combination of clip and layers must be warmed before it is shown (`sheetTick`; see `butchWarmed`), or he vanishes while it loads.
- Boards are drawn in `scene.boards` order at Robin's pixels (`hPx`).
- The crafting board is one list (`openInfo`, `craftGroupsHere`).
- The new marks (`lookedAt`) cover the recipes, the dishes and the pieces.

**Words:**
- People's lines come from the lore (`loreLines`, `lineN`) by entry id. A line needed before the lore has one is a `LORE?` placeholder: added to `LORE` only if the lore lacks the entry, so the handoff's version wins. Then message Alistair, LD.
- Interface words are mine, in the code.

**What to run after a change:**
- `npm run build`, `node tools/parsecheck.js`, `node tools/dupcheck.js` (always).
- The engine or the weapons: the tests named above.
- A player's path: `tools/visual/play0.js` in the pane (the whole of chapter 0 to the blót, a step a call; `docs/playtest-2026-10-27.md` has the run).
- Villages: `tests/settlement.js`.
- Ships: `tests/ships.js`.
- Caves: `tests/cave.js`.

## Controls (the game)

- **WASD** walk, **Shift** sprint, **Space** dash. **J** or left click: swing what is in hand (hold for a charged swing).
  **K** or right click: raise the guard (with a shield on the arm a shield's; in the instant a blow lands, a parry). **With the
  bow out, K or the right button draws it** (Robin, 2026-10-23: "mouse2 should ready and charge the bow, doing more damage the
  more its charged (up to 1,5 sec). Then you release with mouse1. You cant block or bash with bow"): held, the draw fills over
  `BOW.full` 1.5 s, he faces where he aims, and **J or the left button lets the arrow go** at `dmgMin` 0.22 of the damage and
  `speedMin` 0.7 of the speed for a snap shot, rising to the whole at the full draw (mine; the full draw 3.6 times the snap
  shot since 2026-10-28, Robin: spamming paid better); nothing is shot without a draw, the draw let down when the button is let go; **the draw's cue** (Robin, 2026-10-24): a thin arc over his head fills with the draw, gold with a flash at the full draw, **and the true aim shows as a short dotted line** a few metres out of the bow along the arrow's angle, nothing at the target (`drawBowDraw`, `AIM_L` 55; Robin, later the same day: the aim looked like "a set amount of points", the body turns in the sheets' eight facings while the angle is the mouse's; a line to the target with a ring was "too guiding"); **the arrows are half as thick** (Robin, the same day); **an arrow stays where it struck** (Robin: "stick to anything it hits ... unless its stone", then "the arrows can stay a lot longer"): in a man or a beast it rides with him as long as he is there and goes as his body goes, in wood or earth it stands `STUCK.life` 60 s where it stopped, at most `STUCK.max` 60 at once with the oldest fading first (nothing saved), on stone (a rock, a stone wall, the altar, a cave's wall: the page's `api.arrowSurface`) it drops and lies; the men's arrows and the thrown things do not (`stickArrow`, `drawStuck`, `W.stuck`); **aiming he walks at the guard walk's pace with Colin, AD's `bow_draw_walk`** (the same evening: 12 frames, stride 35.73, the guard walk's legs under the full draw held steady, the arrow layers on it; picked by stride when he moves with the draw, `bow_draw` standing), and **a shot on the move lets the loose clip go as soon as he walks** (the body had held a pose); no guard and no bash with the bow; the
  kit's `bow_draw` clip to the frame the draw has reached (`tests/bow.js`). **Ctrl**: target the nearest foe, then the next, then let go. **Q** sort, **Z** stack into an open chest, **V** fill up from it, **N** quick stack at home ("The bag and the Tab screen"). **C: the sneak, on and off** (Robin, 2026-10-24: in the Cat's Hush's verdict "when we introduce sneaking (on ctrl i think) we probably put standard on 50%", then, asked, "Sneak toggles on C"; `SNEAK`): half the pace, seen and heard from half as far by men and beasts (`stealthK`, in place of the page's `mods().stealth`), ended by a sprint, a dash or a blow taken, **Colin, AD's `sneak` and `sneak_walk`** (2026-10-24, `out/hero_sneak` copied whole: the crouch 8 frames at 4 fps, the creep 12 at 12.63 with stride 37.1 for 39 a second, their own frame 360 by 320; picked from a tenth of the walk's measure, warmed when he first sneaks; the drawn crouch, `dashing` 3, only where a set has no sneak clip); the Cat's Hush makes it four fifths of the pace and a third of the distance.
- **The bar** is the bag's top row, six slots, one in hand (`hand`, -1 empty). **1 to 6** take a slot's thing in hand or use
  it (food, a torch); its number again puts it away. **Shift and drag on the toolbar** swaps two of its slots or puts a thing into the bag (Robin, 2026-10-20). The wheel picks a slot, **Enter** takes it. An axe, a pick or a rod in
  hand gathers (the engine's gather mode, `GATHER_KINDS`); anything else, or empty hands, fights (the knife is a weapon, Robin). A one-handed weapon
  taken in hand wears a shield from the bag. Q is no key of the game's.
- **X**: draw your weapon or put it away (among other people it is away until drawn; a drawn blade is a threat).
- **E**: use what you face (one rule, `eWhat`; a crate or barrel with something in it, or somebody else's, is kicked open). **G**: your men: tap "with me", hold "hold here"; "storm" before a place,
  "have it carried" by a broken chest.
- **Tab**: the one screen: your panel top left, the bag under it, what you can make where you stand on the right. **B**:
  build (after Arnor's word); right click opens the Building board; **F** the wreck cursor. **T**: the torch. **M**: the
  map. **R**: rise after falling. **Esc**: closes a board, else the menu (continue, sandbox, restart, new island, the music and
  world-sound bars, Admin). **L**: the Lore Book, once it has a page. **O**: the rune screen (Robin, 2026-10-25).

