# Chapters: the work, one chapter at a time

**Rewritten 2026-10-20** for Robin's way of working (below), and for the new shape of the world (`docs/world-shape.md`, Robin
2026-10-19). Robin's words are marked **(Robin)**; the cut of the chapters and the lists under them are mine until he says yes.
This is the file to read first when choosing what to do next. `CLAUDE.md` says how things stand; this file says what is left,
and where each piece of work belongs. The older version of this file and `docs/roadmap.md` are in the git history.

## How we work (Robin, 2026-10-20)

- **One chapter at a time.** **Current chapter: 1, the starter island.**
- **A chapter is finished when Robin is happy with it**, in its own content and in six areas, each perfected for what the
  chapter shows:
  1. **Models and art** for the chapter, until we are happy.
  2. **Combat and gathering**: the basic fight and the gathering feel good.
  3. **Menus and crafting** feel good.
  4. **The interface**: the HUD, the boards, prompts, speech, the map.
  5. **Music, sounds and effects.**
  6. **The day and night cycle.**
- **Things that belong to another chapter are moved there** and not worked on now, so we can focus.
- A system is perfected in the chapter where the player first meets it (the basic fight, gathering, crafting, the menus,
  the day and the night are all met in chapter 1); a later chapter perfects only what it adds (the raid's fighting in
  chapter 3, the ship in chapter 2).
- **Foundations** (the end of this file) are the technical work every chapter stands on (saves, memory, the world
  generator). One is done when the current chapter needs it, or the next one would be blocked without it.
- The studios work to the same chapter: the Art Director's plan (`C:\dev\SG\Art Director\docs\art-plan.md`) by its phases, the
  Sound Director on the chapter's sounds, the Lore Director on the chapter's people and words.

## The chapter map (mine, from the new world shape)

| # | The chapter | Where | Its big things | Material | Ring |
| --- | --- | --- | --- | --- | --- |
| 1 | **The starter island** | the starter island | the wreck, the burnt steading and Arnor, the first home, the first night, the raft | wood, stone, flint | none |
| 2 | **Home water** | the big island and the islands round it (all of home water) | the mountain and the troll's cave, copper, the bronze ring and the runes, the villages and Old Aslak, the jarl's seat, claim stones and the first hirdmen, boats, and the sea-going ship that leaves home | copper | bronze |
| 3 | **The first sea and the first raid** | the south water (the lowlands) | raiding opened, the first raid in the real game, the jarl's call at home, iron, the raided place's life | iron | silver |
| 4 | **The other seas** | the north, east and west waters | each sea's own things, the jarl's fall and home's islands claimed, the trading hub, rumours that lead | iron, each its own way | twisted silver |
| 5+ | **Beyond** | the second circle and further | Kvennaey, legendary Vikings, the gold ring, Odin's ring, the serpent, the full year | the next metals | gold, Odin's ring |

No gates between them: you may sail anywhere you can; you struggle until prepared (Robin, 2026-10-04). Distance from home
sets how hard, direction what kind (Robin).

## Status words

| Word | Meaning |
| --- | --- |
| **Done** | In the game, played by Robin, and he is happy with it |
| **Built** | In the game and checked by script or bots; Robin has not judged it |
| **Partly** | Some of it is in; the note says what is missing |
| **Not started** | Decided or described, nothing built |
| **Open** | A question for Robin before it can be built |

---

# Chapter 1: The starter island (the current chapter)

**Summary.** You wake in a wrecked boat with nothing. You gather, make tools, feed yourself, find the burnt steading and Arnor,
mend the plank house into a first home, live through the first night, and build the raft that leaves the island. Every basic
verb is taught here without a word of tutorial, so **the basic fight, gathering, crafting, the menus, the interface, the
sound and the day and night are perfected in this chapter**.

## The content

| Part | What it is | Status |
| --- | --- | --- |
| The island | 120 tiles, groves, wide warm beaches, critters by day; the trees at their old size (Robin, 2026-10-16) | Built |
| The wreck and the start | The name asked over the dark, E pries planks, branches and stones, the key reminders, trail stones to the steading | Built |
| The burnt steading | Thorgunna's, made over with the destruction states (2026-10-16: a burnt-out hall, charred posts, a cold hearth), the plank house to mend, the hut, the graves | Built (Robin has seen a picture, not played it) |
| Arnor | His lines from the lore, building opened by his word, the home's lacks, the raft at comfort 4, the graves, the shore at the first raft | Built |
| The first home | Mend the plank house, a roof, comfort, the bed under a roof, the first night slept opens building | Built |
| The first night | Wolves each night, a fire keeps them off, the firelight, the night's sounds | Partly (the means are built; as a *moment* it is Robin's to judge) |
| The raft and leaving | The shipwright's bench, the raft, Arnor at the shore, "You have left the island" | Built |
| Beasts | Young boars, deer in herds (the blood trail), adders; the wolves at night | Built |
| Finds | The fish weir, nests, fallen trees, herbs, mushrooms, crates and barrels kicked open with E | Built |
| Numbers | How fast wood comes, what a first home costs, how many animals, that death costs nothing | Open (bot-measured, never felt by Robin) |
| Words waiting for Robin (the Lore Director's `docs/questions.md`, at its top) | Arnor's hearth line for fires outside, his riposte line, his joining line, "Thorgunnastead" or "Thorgunnastad", the name dice (the home men's 24 names proposed) | Open: Robin picks, the words come in a handoff |

## The six areas

### 1. Models and art (with the Art Director, its plan's phases 0 and 1)

| Thing | Status |
| --- | --- |
| The hero | Done (Robin's pick), and **reworked first** (Robin, 2026-10-20: the art direction kept, no makeover; the hero before more villagers): a base body in linen breeches with every garment an equippable layer that fits him (tunic, trousers, cloak, brooches, the arm ring, armour), starting in a plain tunic and trousers; a plain wooden first shield (the painted one later); blades light steel, not black; real hands (the studio adds hand bones); a lighter idle; the proportions kept; a character creator later (hair, beard, face). The studio moves the hero onto the people's kit; I draw him on the people's path, the look built from what he wears (today the Blender hero shows none of his gear). Agreed with the studio: an `armour` slot over `chest` (mail its own layer), a brooch layer drawn only with a cloak, no layers for rings and trinkets, the kit gets thrust, block_walk, drink, sitdown and standup, the slow clips blended (I port `mixTo` to the people's path), a clip whose own frame is over 255 px packs its rects as 16-bit (`anims.<clip>.rectBytes` 2, `rectsOf` reads it), a far-side hand item ranked 3.5 and a far-side shield 3.6 to 3.7 (under armour and the cloak, over the tunic and the dress), `anims.<clip>.contact` on every attack clip, and each hair style a `<hair>_hat` version to swap in while the head slot is filled (the kit names them hairHatA to C). Robin's picks: the undyed cream tunic, tied-back hair and the short beard as the default. **Built 2026-10-20** (the kit in the game, his gear shown; the nine new heads in, mapped by the helmet's material, the tiers mine for Robin to set; the starter look 217 MB decoded, the old hero 1,549; hands with wrists come next from the studio) |
| The lit boar and deer | Built (dropped in 2026-10-20, approved art) |
| The fires (campfire, hearth, fireplace, brazier, fire pit) | Built (2026-10-20; Robin's yes) |
| The people (Arnor first): the lit side and the new face | Built (2026-10-20; 263 MB decoded, was 313) |
| The wolf and the adder with the lit side | Built (2026-10-20; the wolf 32 MB, was 65; the adder 19, was 30) |
| **The trees**: three concepts for Robin, then pine, birch and broadleaf as set pieces with the felling drawn over | Open (the most screen time of anything; the studio, phase 1) |
| Crafting stations (workbench, shipwright's bench first) | Not started (the studio, phase 1) |
| Furniture (bed, chest, chair, table, bench, crate, barrel) | Not started (the studio) |
| Camp things (drying rack, woodpile, cart, well, trough, tent without stripes) | Not started (the studio) |
| Bushes and plants (bush, berry bush, tall grass, toadstools smaller) | Not started (the studio) |
| Rocks: three variants each, the crack drawn over | Not started (the studio) |
| The steading's look (the made-over ruin) | Built (Robin to judge in play) |
| Yellow thatch on every roof | Built (Robin's rule) |

### 2. Combat and gathering

| Thing | Status |
| --- | --- |
| **The player's blows start on the press** (Robin, 2026-10-20: no anticipation for the player; a charged blow keeps its windup; the enemies keep theirs, it is the player's warning): the windups to a frame or two, the hit on the art's contact frame, the follow-through cancelled by the next blow, the guard or the dash; the men's reaction measured again with the duels and the parry test (the Dane axe keeps a short windup, about 0.15: Robin, 2026-10-20) | Built 2026-10-20 (a careless player now beats an axe-man in mail 89%, was 49%; the men are not retuned; open: the sword's blows come from `STEPS`, not Robin's tuned `PROFILES.sword`) |
| The basic fight: blows, the weight of each weapon, the guard by what is in hand (shield, weapon, tool, bare arm), the parry, the chain, balance, the perfect dodge, the finishing blow | Built (Robin's tuning of 2026-10-15 is the default; the guard rules of 2026-10-16 not yet played) |
| The club, the flint sword, the knife as a weapon, the bow | Built (Robin found the club "awful" on 2026-10-14, before the impact work: to be felt again) |
| Young boars, wolves, adders, the deer and its blood trail | Built |
| Chopping: the notch and the back cut, the fall, trunks of four logs, nearby trees chipped | Built (felt clunky on 2026-10-14, reworked since: to be felt again) |
| Mining: the crack, six rock variations | Built |
| Picking by hand: berries, grass (a pulled tuft is gone, grows back in three days), fiber from wood now and then | Built |
| Kicking a box open with E | Built |
| **A play by Robin of the whole fight and the gathering** | Open: the next step for this area |

### 3. Menus and crafting

| Thing | Status |
| --- | --- |
| The Tab screen: the panel, the bag with the bar as its top row, the crafting list on the left and the chosen thing beside it | Built |
| E at a station shows only its own things; the queue, the Ready strip, Cancel | Built |
| Recipes appear from their key ingredient; a gold dot on a thing never made | Built |
| The Building board (B): tabs, opened by Arnor's word and the first night | Built |
| **"Crafting feels off against other survival games"** (Robin, 2026-10-14) | Open: what feels off (the board, the queue, the time a thing takes, things landing in the bag?) is unanswered |

### 4. The interface

| Thing | Status |
| --- | --- |
| The HUD: health and stamina, the chart, the meal; the bar from the start (Robin, 2026-10-17) | Built |
| The speech board, the big-step boards, the name board, prompts over the hero, damage numbers | Built |
| The map (M) | Built |
| The look: one book face for names and titles, the bars, the board frames (`docs/ui-review.md` section 4) | Open: the Art Director writes a one-page spec (its plan, item 15), then I build it |
| **How text appears** (toasts, notes; Robin, 2026-10-14: "a better way is wanted") | Partly (the "something new" toasts are gone; the rest is open) |

### 5. Music, sounds and effects

| Thing | Status |
| --- | --- |
| The place's sound: wind, leaves, sea, birds, crickets, fire, water, footsteps by the ground | Built |
| The swings (Robin's picks) and the guard's sound | Done |
| **The hit sound** (the studio's thump replaced; candidates I to L and V in the arena) | Open: Robin picks |
| Gathering sounds (chop, crack, pull, kick), footsteps by ground, the fire's crackle, the night (crickets, owl, wolves) | Built (synthesized). Open: a reference Robin likes for each, then the studio matches it (the Sound Director's list: `C:\dev\SG\Sound Director\docs\chapter-1.md`); quickest is a row of free candidates in the arena's The sounds panel to pick from, as the swings were (mine to build) |
| Music: the meadow by day and by night | Built (off until the Escape menu's bar is turned up). Open: the Sound Director's view is on at about a third of the bar (a new player never looks in the Escape menu); Robin decides |
| Effects: sparks from the fires, smoke, chips, splinters, the shake | Built |

### 6. The day and night cycle

| Thing | Status |
| --- | --- |
| The 30-minute day, the golden dusk that darkens faster at its end, the dark night, the torch | Built (the night's pacing redone after the play-test of 2026-10-14; to be felt again) |
| Sleep skips the night; rested under a roof | Built |
| The lighting trials on: the glow, shadows, lit sides, light in rooms and at windows, moths | Built (the first version read as "a weird filter") |
| The lighting trials off until Robin looks: the moon, mist, light shafts, clouds | Open |
| The first night as a moment (the staging) | Open |

## What finishes chapter 1 (in this order, mine)

1. **Robin plays chapter 1 from the wreck to the raft** (a second play-test, like `docs/playtest-1.md`), with the six areas as the
   questions. The three things that feel worst lead the work.
2. The studio's phase 0 lands (the people, the wolf and the adder lit), then the trees' concepts for Robin.
3. The open answers above: crafting that feels off, the hit sound, the lighting trials, the music's default.
4. The fixes and the polish the play-test asks for, area by area, until Robin is happy.
5. A last play-through by Robin. Then chapter 2.

**Moved out of chapter 1:** the shipyard as models to customise (Robin, 2026-10-14) and the troll's size go to chapter 2;
fishing (the lowlands) to chapter 3. **Closed:** "who you are" (`docs/the-beginning.md`) is answered by the lore's canon (the
hero's past is never explained, the player picks his name); the landmark is the trail stones; the steading is the beginner
base; Arnor sees you off at the shore.

---

# Chapter 2: Home water (next)

**Summary.** The big island and the islands round it: the first chapter in full. You go from survivor to leader: copper, the
troll and his cave, the arm ring, the villages, the jarl of home water, your first hirdmen and claim stones, and the
sea-going ship that leaves home. Home water is bigger, with more islands and villages only (Robin, 2026-10-19); nothing here can
be raided until raiding is opened in chapter 3 (Robin).

| Part | Status |
| --- | --- |
| The big island: the mountain (slopes, plateau, peaks, waterfall, lookout, rock shelter, cliff veins of copper) | Built |
| The troll's cave, the troll and his young (Hårungen) | Built |
| Copper: veins, furnace, bars, copper tools and weapons | Built |
| The arm ring and the thirty runes, the carver's bench | Built |
| The villages, Old Aslak and Hogni's story | Built |
| The claim stone, Arnor joins, hirdmen and their jobs | Partly (the hird's next steps, `docs/hird.md`) |
| **Home water bigger: more islands, villages only, the jarl's seat** (`docs/build-plan-waters.md`, steps 1 to 3) | Built (2026-10-20: the sea as waters, the climate field, home's peaceful places and one seat, home cannot be raided; not yet: beasts on the new islands, the climate's look beyond the lowlands, the seasons' slots) |
| **The sea-going ship and the swell that turns small boats at home's edge** (the karve on copper: decision 1 of that plan) | Built (2026-10-20: the karve on copper; a raft is held at home's edge, a karve sails on) |
| Boats: the faering and the boat; **the shipyard as a few fine models to customise** (Robin, 2026-10-14; moved here) | Partly |
| **The troll bigger and scarier** (Robin, 2026-10-14; moved here) | Not started (the studio, its plan item 17) |
| Rumours told by home's villagers (the canon's Ormr, Aslak, golden boar and Wanderer rumours fit here) | Not started |
| Trading at home's villages (the basics), the first currency question | Not started |
| Climates by position (home's look stays as it is) | Not started (`docs/build-plan-waters.md`, step 2) |

**Its six areas** (perfected when chapter 2 is the current one): the troll, the moose and the bear, the villages and buildings,
cave props and the ring's art (the studio's phase 2); fighting the troll and the bear; the furnace, the carver's bench and the
shipyard's boards; the ring page and the chart of home water; the cave's and the mountain's sound, the village's sound; the
night with the troll walking out.

---

# Chapter 3: The first sea and the first raid

**Summary.** Across the first crossing to the south water, the settled lowlands: churches, towns, a manor, silver. Raiding is
introduced here (Robin, 2026-10-19). Your first raid there opens raiding at home too: the jarl calls you to his hall.

| Part | Status |
| --- | --- |
| The south water and its islands (the lowland look: oak, beech, ash, orchards, chalk, fields, marsh) | Built in code, not spawned |
| The town, the church, the manor (Village archetypes) | Built in code |
| **The raid in the real game**: the garrison, your ship and hird, carrying, leaving, saved (`docs/build-plan-waters.md`, step 4) | Not started (all of it works in the Battle test) |
| Men, towns and raids: one on one, bowmen, noise, night raids, storming, villagers who flee or arm (`CLAUDE.md`) | Built in the Battle test |
| Destruction: breaking in, roofs that fall, fire, mending (`docs/destruction.md`) | Built (real villages and the Destruction Editor) |
| Iron: bog iron, the bloomery, iron tools and arms, mail, gambeson, helm, painted shield | Built in code |
| The longship (iron) | Built in the Shipyard |
| The raided place's life and the season turn (`docs/world-shape.md`; the build plan's step 5) | Not started |
| The jarl's call after the first raid | Not started |
| Thralls to cut loose, your taken men to win back, a man who yields, a priest who does not fight | Decided, not built |
| Fishing (the lowlands' fish, the rod, the fisherman; Robin: not before the lowlands; moved here) | Built in code |
| The silver ring, silver as the second currency | Not started |

---

# Chapter 4: The other seas

The north, east and west waters, at about the same level as the south, each giving different things so all are worth a visit
(Robin, 2026-10-19): the north's furs, ivory and ore; the east's amber, bog iron and the trading hub; the west's seal skin, the
sunstone and the way further west (`docs/world-shape.md`, my table). **The jarl's fall and home's islands claimed one by one**
(Robin, 2026-10-19). Rumours as leads that mark the chart. Each sea's named slot (special islands, added as we have ideas:
Robin). The twisted silver ring.

# Chapters 5 and beyond

The second circle and further: harder, the next metals (Robin: a new ore every circle). **Kvennaey** (the far west; Robin's
family, canon 2026-10-17: Skuld's Daughters, the invited season, the drowned, Ari, the rune Brimgr; Njord as god of the seas).
Legendary Vikings with big ships. Gold in the hall of the south, the gold ring; **Odin's ring** (its name the Lore Director's:
not "dragon", Robin 2026-10-19). The serpent (the studio's `out/serpent`). The väsen waiting in the Art Editor (the huldra,
Näcken, the draugr, Trollmor, the bysen, the forest troll, the Gape, the three-headed troll): which goes to which chapter is
Open. **The full year**: every season drawn everywhere, the turn after winter that renews the world (Robin: for later).

---

# Foundations (no chapter: what every chapter stands on)

| Work | When | Status |
| --- | --- | --- |
| **Saves that fit**: save what changed on the ground, not the whole field (today 1.5 MB of 1.56; the browser gives about 5 MB in all) | before the bigger sea (chapter 2) | Not started (`docs/before-wednesday.md`, 1) |
| **Sheets loaded when used**, a soft shadow while one loads (the hero's sheets are about 1.5 GB decoded and all load at the start) | now: it touches chapter 1's smoothness | Not started (`docs/before-wednesday.md`, 2) |
| **The per-frame packer** (each frame cut to its own pixels), then the studio repacks every set | after the lazy loading | Not started (the art plan, item 8; the people's atlas already does it: `tools/people.js` packs per frame and `rectsOf` in `src/sprites.js` draws it, the base for the general one) |
| **The world as waters** (the generator) | chapter 2's start | Planned (`docs/build-plan-waters.md`, step 1) |
| Performance: the frame log's SPIKE lines, the first frame's time | always | Watched |
| Tools: `tools/parsecheck.js` (built), `tools/worldtime.js` (to write with the generator) | | |

---

## The template: what a chapter must answer (kept)

Every chapter is written under these headings before it is built; a heading with nothing under it is a gap.

- **A. The place:** the islands, the water they are in, the climate and look, what is generated and what is fixed; the places
  of interest (villages, camps, ruins, caves, landmarks, small finds).
- **B. The events:** three to five big events (Have / Build / Test each); the way in and the way on (no gate; what points on).
- **C. The living world:** beasts (real ones first; väsen with a card whose weakness is a rule, `docs/beasts.md`), the night;
  people (the friend, the folk, the ring-holder, the legend).
- **D. What you make and gain:** materials, stations, recipes and what reveals each; building and home; the ring's metal and
  runes; currency; reputation.
- **E. Travel:** the vessel and the sea.
- **F. Making and checking:** the editor or test scene to try it alone, the tests, the play-through.
- **G. The six areas** (Robin, 2026-10-20): art, combat and gathering, menus and crafting, the interface, music and sound and
  effects, the day and night, each judged by Robin for what the chapter adds.

## The rules every chapter keeps

- Big events, not a boss ladder; several ways to progress (Robin).
- Each chapter harder than the one before; harder never means punishment (Robin).
- No gates, keys or locked doors (Robin).
- One easy formula, plenty of curveballs (Robin).
- The compass means something, the details are generated (Robin).
- Guidance is subtle: no goals, checklists, explaining labels or question marks (Robin).
- Reward, never punish (Robin).
- Real Viking-age things and real animals first; fantasy from Norse myth and nordic folklore (Robin).
- Editor first, then the game; numbers in plain data (Robin).
- The look is the art direction's (`docs/art-direction.md`): characters and set pieces from the studio's Blender models, the
  generated world drawn in code; sounds and music from the sound studio; words from the Lore Director.

## The checklist for finishing a chapter

- [ ] The template answered; questions for Robin asked
- [ ] Built in its test scene first, then in the game, one big event at a time
- [ ] A headless test for every rule that can be checked without a screen (`npm test`)
- [ ] Played through by script, then by Robin
- [ ] **The six areas judged by Robin**: art, combat and gathering, menus and crafting, the interface, sound, day and night
- [ ] What Robin found is fixed; `CLAUDE.md` and this file updated; `dist/` rebuilt and committed
- [ ] Robin is happy: the chapter is **Done**, the next one becomes current
