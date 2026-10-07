# Chapters: how the game is laid out, and how to build a new one

Written 2026-10-07 from `CLAUDE.md`, `docs/roadmap.md` (the ladder of islands), `docs/arm-ring.md`, `docs/hird.md`,
`docs/beasts.md` and `docs/idea-bank.md`. Robin's words are marked **(Robin)**; the rest is a suggestion until he says yes.

A **chapter** is one stretch of the world with its own place, its own big events, its own beasts, people and materials,
and its own measure of power (the ring's metal). There are no gates between chapters: the world stays open, and you
struggle in a chapter until you have done the things in the one before (**Robin, 2026-10-04**). A chapter ends when its
big events are done and something in it points at the next one.

This file does two jobs. It is the **map of the chapters** (what each one holds, what is built, what is missing), and it
is the **template for a new chapter** (the categories a chapter must answer before it is built). `docs/roadmap.md` keeps
the older build order; this file is the one to read first when planning a chapter.

---

## 1. The rules every chapter keeps

These are decided and apply to every chapter. A new chapter is checked against them.

- **Big events, not a boss ladder** (Robin). A chapter is remembered for three to five **big events**, set pieces that
  change what you can do. You do not progress by killing bosses; there are several ways to progress.
- **Each chapter is harder than the one before** (Robin). Harder means heavier beasts, a heavier metal on the ring-holder,
  and more to prepare. It does not mean punishment: preparation gives buffs, the unprepared state is the weak baseline.
- **No gates, keys or locked doors.** You can go anywhere; you struggle until prepared. Biome rarity changes with distance.
- **One easy formula, plenty of curveballs** (Robin). A player understands a chapter's rule in a minute (heavier metal
  beats you; each chapter has its ring-holder), and the details inside break the rule in interesting ways.
- **The compass means something, the details are generated** (Robin). North colder and harder, south richer and more
  settled, east rivers and trade, west open ocean and the unknown. Distance from home sets how hard; direction sets what kind.
- **Guidance is subtle** (Robin). No goals, checklists, explaining labels or question marks. A chapter is found: through
  how things look, what people say in their own voice, a landmark on the horizon, a tooltip.
- **Reward, never punish.** No draining meters, no stamina cuts, no wetness, no repair chores. Weather and biomes give
  buffs for preparation.
- **Real Viking-age things first, real animals, flat pastel look, open uncramped ground.** Fantasy beasts come from Norse
  myth and nordic folklore with a card whose weakness is a real rule in the fight (`docs/beasts.md`).
- **Editor first, then the game** (Robin). A new thing is tried in an editor or the test scene with sliders, then handed
  over with "Use in the game". Numbers live in plain data.
- **Everything is drawn and synthesized in code**: no asset files.

---

## 2. The template: what a chapter must answer

Every chapter is described under the same ten headings. A heading with nothing under it is a **gap**, and the gap list at
the end of the chapter is the work. The headings are grouped by what they are about.

### A. The place

**A1. The world.** Which islands, how big, which biome, where on the compass and how far from home (which sets hardness).
The map regions and the look: ground, trees, rocks, water, weather, season. What is generated and what is fixed.

**A2. Places of interest.** The set pieces on the map that are not big events: villages, camps, ruins, shrines, caves,
landmarks, small finds (a cairn, a dead hunter, a fish weir). What can be found, what can be raided, what can be traded.

### B. The events

**B1. The big events.** Three to five, each with a name, what the player does, what it unlocks, and how it is told
without text. Each is written as **Have / Build / Test**, the way `docs/roadmap.md` writes its steps. This is the heart of
the chapter: if the events are weak, the chapter is.

**B2. The way in and the way on.** How you arrive (what you carry, what you can already do), what makes you struggle
(without a gate), and what points to the next chapter (a landmark on the horizon, a name heard, an item that needs
something not found here).

### C. The living world

**C1. Beasts and threats.** The animals of the chapter (real ones, with counts, ground, drops), the väsen (a card each,
with its weakness), the night and what it brings, and what is dangerous because of the chapter's rule.

**C2. People.** The friendly person you meet, the folk of the villages, the leader who holds the chapter's ring, the
legend whose name is heard. Who can join the hird and how; what each says (in their own voice, never a checklist).

### D. What you make and gain

**D1. Materials and crafting.** New materials and where they come from (gathering, caves, trade, raids), new stations,
new recipes and what reveals them (a recipe appears from its key ingredient), the tier of tools and weapons, armour, food.

**D2. Building and home.** New building pieces, what a comfortable home needs here, what claiming and the territory
look like, what the hird does at home.

**D3. Power and reward.** The arm ring: which metal is this chapter's, which runes are found here and from what (beast,
stone, deed, person, event). Weapons and armour that arrive. Currency, if this chapter adds one (a new one about every
third chapter, **Robin**). Reputation, if raiding is in play.

### E. Travel

**E1. The sea.** What you cross in, what changes at sea, which hazards exist (none yet), what the ship is (raft, boat,
Viking ship, with a sail, with a crew) and how crewing and speed work.

### F. Making and checking it

**F1. Editors and the test scene.** Which editor or scene lets Robin try it alone (a page, a row on the Rune Editor's
board, an Admin row). Which parts need a new editor, which only need rows.

**F2. Tests and definition of done.** The headless tests that check the rules, the play-through in the browser, the
things tried to break, and the docs updated. A chapter is done when its checklist (section 4) is ticked.

---

## 3. Status words

Used in every table below.

| Word | Meaning |
| --- | --- |
| **Built** | In the game, played, in `CLAUDE.md` |
| **Partly** | Some of it is in; the note says what is missing |
| **Not started** | Decided or described, nothing built |
| **Idea** | Only in the idea bank; not decided |
| **Open** | A question for Robin before it can be built |

---

# Chapter 1: The starter island

**Summary.** You wake in a wrecked boat on a small island with nothing. You gather, make tools, feed yourself, build a
home, meet the last survivor of a raided steading, and build the raft that leaves the island. The first chapter teaches
every basic verb without a word of tutorial. It is the first stretch of the first biome (the second island is the rest of it).

**The measure of power:** none yet; the island holds no ring. **The chapter's rule:** the unprepared are weak, the prepared
are fine; night is dangerous and home with a fire is safe.

### A. The place

| Part | What it is | Status |
| --- | --- | --- |
| A1 The world | A 60-tile island (`isle0`), grass, groves of oak, pine and birch, beaches, a neighbour island 26 tiles east. Day and night over a 30-minute cycle | Built |
| A1 Look | Flat clean look, painterly meadow, wide warm beaches, critters (butterflies, birds, beetles) by day | Built |
| A2 Places | The wreck on the beach, the broken steading (Hildir's, a burnt hall, a hut, a half stone house, a well, a palisade), loose finds (nests, fallen trees, herbs, mushrooms) | Built |
| A2 Small finds with a story | A hunter's camp, a cairn, a fish weir, a dead man by a cold fire | Not started (`docs/start-loop.md` proposal) |

### B. The events

| Event | What it is | Status |
| --- | --- | --- |
| **Landing with nothing** | Branches and stones round the camp, the first tools by hand, three bare key reminders | Built |
| **The first night** | Wolves come at night; a fire keeps them off; Brokk's campfire shows it | Built (the night is dangerous; it is not yet a *moment*) |
| **The steading and its survivor** | Brokk tells his story, reminds what the home lacks, teaches the raft at Comfort 4 | Built |
| **The home** | Walls, roof, hearth, bench, bed, rug: Comfort 4 | Built |
| **The shipwright's bench and the raft** | The Shipyard, the raft from logs and lashings, the crossing and the banner "You have left the island" | Built |

**The way in:** the wreck. **The way on:** the neighbouring island, ten seconds off by raft. Nothing on the horizon says go
there yet (see the gap list).

### C. The living world

| Part | What it is | Status |
| --- | --- | --- |
| C1 Day beasts | A few boar, deer and adders (`start`), all six animals exist on the map with their own attacks | Built |
| C1 Night | One wolf pack a night, fire-shy, glowing red eyes | Built |
| C2 People | Brokk (the dwarf smith), the first hirdman | Built |
| C2 The first legendary Viking heard of | Decided to be heard on the home island; Brokk's tale names Ragnar Ironside; the legend system itself is not built | Partly |

### D. What you make and gain

| Part | What it is | Status |
| --- | --- | --- |
| D1 Materials | Wood, stone, fiber, hide, leather, berries, meat, eggs and honey from nests; trunks, sweet spot and rhythm in gathering | Built |
| D1 Crafting | Hand and workbench recipes revealed by key ingredient; flint, stick and wood tools, the wooden club and bow; leather armour; the hearth and the dishes; boards for crafting, cooking and the shipwright | Built |
| D1 Fishing | A slow verb with a reward | Not started (`docs/start-loop.md`) |
| D2 Building | Walls in five materials, floors, paths, roofs (thatch, turf, shingles), stairs and an upper floor, fences, docks, furniture, comfort | Built |
| D3 Power | No ring on this island. Deeds count underneath (trees, meals, sprinting) | Built (hidden until a ring) |

### E. Travel

| Part | What it is | Status |
| --- | --- | --- |
| E1 The raft | Paddled at 54 units a second, drawn from its parts | Built |
| E1 Leaving | The raft slides out and a banner says you have left; nobody sees you go | Partly (`docs/start-loop.md`: Brokk at the shore) |

### F. Making and checking it

| Part | What it is | Status |
| --- | --- | --- |
| F1 Editors | Gathering Editor, Character Editor, Object Editor, Item Editor, Combat Arena, the game's Admin and Sandbox | Built |
| F2 Tests | `npm test` covers combat, weapons, gather and ring; fresh-start play-through done 2026-10-05; the day-of-gathering test (40 wood, 20 stone, 15 fiber, 6 hide in a day) | Partly: the hand-played day test is still to do |

### Gap list for Chapter 1 (the work)

1. **A landmark on the horizon**: smoke over the trees and a cairn on a rise, so the steading and the far island are
   *seen* (`docs/start-loop.md`, 1 and 2 of its order).
2. **The steading as the beginner base**: move the camp, patch the hall's gaps, the hut's furniture (`start-loop.md`, 2).
3. **A few small finds with a story** between the wreck and the steading (`start-loop.md`, 3).
4. **The first night as a moment**: sound and sight that make home feel better than the field (`start-loop.md`, 4).
5. **Slow verbs**: sitting by the fire, fishing (`start-loop.md`, 5).
6. **Leaving as a scene**: Brokk at the shore (`start-loop.md`, 6).
7. **The legend**: how a name is heard (Open, idea bank 3).
8. **Play the day-of-gathering test by hand** with the new gathering settings.

---

# Chapter 2: The first big island

**Summary.** The second island is the first biome in full: a big island with a cave, a troll, copper, a living hamlet, bear
and moose. Its big events are the ones that make you a leader instead of a survivor: **copper, the troll and the cave,
building an actual village, the arm ring** (Robin, 2026-10-06). It ends with a boat that can sail somewhere else.

**The measure of power:** the **bronze ring** (two coils: hand and foot), taken from the dead Viking behind the troll's
lair. Brokk wears bronze. **The chapter's rule:** heavier metal beats you; the troll is heavier than you until you have
copper and the ring.

### A. The place

| Part | What it is | Status |
| --- | --- | --- |
| A1 The world | A 230-tile island east of the first; the cave is 700 to 1600 units from the start, the hamlet is away from it | Built |
| A1 Islands around it | Same biome, mixing toward the next, later filled with different places | Not started |
| A2 The cave | A smooth-field cave: winding passage, pockets, stalactites, rubble, a still pool, copper veins, the troll's hoard | Built |
| A2 The hamlet | A living village: four huts, a well, folk who walk and talk (seven to nine), a fence | Built |
| A2 Other places | A hunter's shelter, a ruined fort, a shrine, a standing-stone ring, a fish weir, a charcoal burner's clamp | Idea |

### B. The events

| Event | What it is | Status |
| --- | --- | --- |
| **Copper** | Veins on the cave walls mined out for good, a little on loose rocks, charcoal from embers, the clamp and finds in the wild, the furnace, copper bars, copper tools and weapons at the workbench | Built |
| **The troll and the cave** | Mining is loud; he walks out some nights within sight and you can sneak past; his hoard is open while he is out; his walk home at morning; stone at dawn if provoked | Built |
| **The village** | The claim stone (stone, berries, snake blood), territory on the chart, room for N and food for D days, Brokk joins, muster, jobs yielding into chests | Partly (see gaps) |
| **The arm ring** | The bronze ring from the dead Viking, the carver's bench (blood rite), eleven runes from deeds, ten beasts, stones and Brokk, the Ring tab | Built |
| **The first real boat** | The Shipyard's boat plan (keel, strakes, thwarts), copper nails, sailing like the Sea Editor | Partly (no mast or sail) |

**The way in:** the raft from Chapter 1, copper tools being the key preparation. **The way on:** a sail. The boat can
only paddle; the sea beyond the island is where the next chapter begins. A name heard (Ragnar Ironside) and a bigger ship's
sail on the horizon are the pointers, neither built.

### C. The living world

| Part | What it is | Status |
| --- | --- | --- |
| C1 Day beasts | Boar, deer, bear, moose, wolves, adders, each with its own attack; more of the larger ones here | Built |
| C1 The troll | Cave troll with the card in the Book | Built |
| C1 More väsen | Bysen, huldra, tomtar, näcken, draugr, mara, shapeshifter (`docs/beasts.md`); at least one more for this chapter | Not started, Open: which one next |
| C1 Night | Wolves and the walking troll | Built |
| C2 People | The hamlet's folk (two lines each, no trading), Brokk, the ring-holder (the dead Viking) | Built |
| C2 The hamlet's leader, a trader, a charcoal burner, people who can be helped and join | Idea |

### D. What you make and gain

| Part | What it is | Status |
| --- | --- | --- |
| D1 Materials | Copper ore, charcoal, copper bars, snake blood, antler | Built |
| D1 Metals beyond copper | Bronze (tin), iron: decided later by chapter | Not started |
| D1 Crafting | Furnace board, copper tools and seven copper weapons, the carver's bench | Built |
| D1 Trading | The hamlet trades the basics (food, materials) | Not started |
| D2 Building | Claim stone, the carver's bench, furnace, clamp, chests, stairs and upper floor | Built |
| D2 The hird at home | Jobs: crafter, woodcutter, cook, keeper; they eat at dawn; Brokk walking to the bench | Partly (Brokk does not yet walk to the bench; idle day, chatter, fighting beside you not built) |
| D3 Power | Bronze ring, eleven runes; copper weapons | Built |
| D3 Currency | The first island trades in the basics | Not started |

### E. Travel

| Part | What it is | Status |
| --- | --- | --- |
| E1 The boat | Clinker hull shaped by its strakes, paddled by one; the Sea Editor's physics | Built |
| E1 Crew and sail | Hirdmen at the oars; a mast and sail | Not started |
| E1 Hazards at sea | Reefs, storms that give buffs for preparing, never a punishment | Idea |

### F. Making and checking it

| Part | What it is | Status |
| --- | --- | --- |
| F1 The test scene | The Rune Editor (the game's second island with the hut, bench, furnace, clamp, ring and a board that goes to the cave, lair, troll and veins) | Built |
| F1 Editors | Hird Editor, Sea Editor with the Shipyard, Item Editor | Built |
| F2 Tests | `tests/ring.js`, `tests/weapons.js`, `tests/gather.js` in `npm test`; a play-through from the big island 2026-10-06; the cave and furnace tried to break 2026-10-07 | Built |

### Gap list for Chapter 2 (the work)

1. **The hird's next steps** (`docs/hird.md`, 2 to 4): Brokk walks to the bench and works, the idle day, chatter,
   following on land and fighting beside you.
2. **Trading at the hamlet**: the basics for goods; a trader; the first currency question (Open: is it silver?).
3. **A mast and a sail** so the boat leaves the island, and hirdmen at the oars.
4. **A second väsen** for this chapter (Open: Robin chooses from the cards), so the cave is not the only one.
5. **Places of interest** on the island and the islands around it: ruins, a shrine, small finds. (Villages across all six islands with names and jetties: built 2026-10-07, `docs/villages.md` 6.)
6. **A pointer to Chapter 3**: a name heard, a sail on the horizon, an item that needs something from elsewhere.
7. **Bronze and the metal ladder**: what tin is and where (idea bank).
8. **Hazards at sea** as buffs-for-preparation, not punishment.

---

# Chapter 3: The second biome and the first raid

**Summary (decided in the ladder of islands, Robin 2026-10-06).** New things again. The big events are **the first
Viking ship** and **the first raid on a nearby island, which everything in this chapter revolves round**. The ring grows:
the **silver ring** (the eye side) from the second biome's ring-holder or hoard.

Nothing here is built. What is written below is only what is already decided or implied by other documents; the rest is
the template's headings with questions.

| Heading | What is decided or implied | What is open |
| --- | --- | --- |
| A1 The world | **Decided 2026-10-07: the south, settled lowlands** (oak, beech, ash, hedgerows, hay meadows, ploughed strips, orchards, chalk; walled towns, churches with priests, a manor); its islands lie further south and mix at the edges with the first biome's. **Built:** biome-marked islands placed south, the biome field, the warm ground, the lowland trees and chalk, marsh, field and chalk ground kinds | How many islands and how far (the balance pass) |
| A2 Places | Villages, castles and churches stand here and can be raided; some villages trade | Which and how many; the church as the "lucky strike" with only friendly priests and a bell that may call an army |
| B1 Big events | **The first Viking ship; the first raid**; the silver ring. **Decided 2026-10-07:** the raid is loot spread out behind doors that take blows, carried to the ship piece by piece, the defenders gathering to the noise (no bell, no waves from a castle, fighting not the biggest part); **a human jarl holds the silver ring**, won by a raid on his hall; nothing off limits, reputation the brake | The third and fourth events |
| B2 Way on | Heavier metal beats you, each chapter has its ring-holder | What points beyond |
| C1 Beasts | Harder than Chapter 2 | Which animals and väsen (`docs/beasts.md` cards) |
| C2 People | Villagers with guards, captives who may join, the ring-holder | The legend; reputation (decided: risk and reward, a village remembers) |
| D1 Materials | Silver and goods as loot; **iron (decided 2026-10-07):** bog iron from the marsh, a bloomery, iron tools and weapons, mail, gambeson, an iron helmet, a painted shield; silver by weight as the second currency. **Built 2026-10-07:** bog iron in the marsh, the bar at the furnace, iron tools and arms, the gambeson, the mail shirt, the iron helm, the painted shield | Silver sources |
| D3 Power | Silver ring, the eye side; the smith's rework | The runes for this chapter (bosses, raids, fishing, quests, hirdmen) |
| D3 Currency | A second currency is allowed "about every third biome" | Whether Chapter 3 adds one |
| E1 Travel | The first Viking ship: **the karve, built in the yard (decided 2026-10-07)**: a longer keel, more strakes, a mast, a sail, a steering oar, iron nails and cloth; the more aboard, the faster | Wind as a buff only; the crewing rules |

**Chapter 3 needs the mast and sail, hird crewing, trading and a raid system before it can start** (Chapter 2 gaps 1 to 3).
Raiding, reputation, recruiting from raids, and the year (spring to winter, repopulation of unclaimed places) are the
systems this chapter introduces (`docs/roadmap.md`, steps 7 to 9; `docs/idea-bank.md`, 1 to 4).

---

# Chapters 4 and beyond

Only the shape is known. Each is a new part of the compass, a new ring metal and its own events (**Robin, 2026-10-06**):

| Chapter | Where | Known |
| --- | --- | --- |
| 4 and 5 | By the compass: north the cold, east the rivers and trade, west the unknown | The twisted silver ring (heart side), the central **trading hub** (heavily guarded, unwise to attack; Hedeby, Birka and Kaupang are the candidates), legendary Vikings with big ships |
| later | The south, "England in the south": richer, more settled | **Gold in the hall of the south**, the gold ring |
| last known | Beyond | The **dragon ring** |

---

## 4. The checklist for a new chapter

Copy this when a chapter is started. It is the template in one list; an unticked box is a gap.

**Brief (before any code)**
- [ ] Place: islands, biome, compass position, distance from home, the look (A1)
- [ ] Places of interest listed, each with what you can do there (A2)
- [ ] Three to five big events named, each with Have / Build / Test (B1)
- [ ] The way in and the way on written, with the pointer to the next chapter (B2)
- [ ] The beasts (real ones, then väsen with a card whose weakness is a rule) and the night (C1)
- [ ] The people: the friend, the folk, the ring-holder, the legend (C2)
- [ ] Materials, stations, recipes and what reveals each; tool and armour tier; food (D1)
- [ ] Building pieces and what a comfortable home needs here (D2)
- [ ] The ring: the metal, the runes and their sources; currency; reputation (D3)
- [ ] The vessel and the sea (E1)
- [ ] Questions for Robin written down (Open)

**Rules check (section 1)**
- [ ] No gate, no hint line, no checklist in the game, no question marks
- [ ] Nothing punishes: no draining meter, no stamina cut, no repair chore
- [ ] Harder than the chapter before, with one easy formula and curveballs
- [ ] Real Viking-age things and real animals first; fantasy only from Norse myth with a card
- [ ] Every number in plain data; nothing hard-coded that an editor could tune

**Build (in this order)**
1. [ ] **Editor or test scene first**: a row or board that puts the player at the chapter's key place with what it needs
   (the Rune Editor is the model; add rows, not a new page, where you can)
2. [ ] The world: islands, ground, props, places of interest
3. [ ] The big events, one at a time, each playable alone
4. [ ] Beasts and people
5. [ ] Materials, stations, recipes
6. [ ] The ring and its runes
7. [ ] Travel
8. [ ] Look and sound (the music's day and evening theme, the palette)

**Check**
- [ ] A headless test in `tests/` for every rule that can be checked without a screen (`npm test`)
- [ ] Played through in the browser from the chapter's start, once as a new player
- [ ] Tried to break it (die in the middle of things, reload mid-job, wreck a working station, full bag, night by day)
- [ ] Bugs found are fixed and written into `CLAUDE.md` under the feature
- [ ] `CLAUDE.md` updated; this file's chapter table updated; `docs/roadmap.md` marked
- [ ] `dist/` rebuilt and committed

---

## 5. How to work with this file

- **Planning a chapter:** copy section 4's checklist under the chapter's heading, fill the template (section 2) with what is
  decided, and write what is not as Open questions for Robin. Ask them with the questionnaire tool, a few at a time.
- **Working a chapter:** take the first unticked build step; build it behind its test scene row; test; tick it. When a
  row in a status table changes, change the word and move the detail into `CLAUDE.md`.
- **Choosing what to do next:** read the gap lists. Chapter 1's gaps are the cheapest and change what every new player
  sees first; Chapter 2's gaps 1 to 3 (the hird, trading, the sail) unlock Chapter 3.
- **Keeping it honest:** a thing is **Built** only if it is in the game and has been played. Ideas stay in
  `docs/idea-bank.md`; decided things go here and in `CLAUDE.md`.
