# Chapter 0, the starter island: the checklist

**The chapter: Not done.** No item has been Checked yet. Started on 2026-10-30.

How this list works is in `docs/chapter-checks.md`:

- **To fix**: something is wrong or missing.
- **Built**: built and tested by Clive, GD. Robin has not yet said yes.
- **Checked**: Robin played it and said yes, with the date.
- **Open**: a choice that waits on Robin.

A change to an item moves it back to Built. The states below are my honest view on 2026-10-30. **"Built" means it ran in the
scripted playthrough (`tools/visual/play0.js`, `docs/playtest-2026-10-27.md`), in a test or in the pane. It does not mean it feels
right.**

To check an item, play it in the dev version (`/dev/`, or `npm start` at home) and tell me which numbers are good and what is
wrong with the rest.

## 1. The path, from the wreck to the boat

| # | Item: what to try | State |
| --- | --- | --- |
| 1.1 | **The start.** A new game wakes at the wreck. The first key reminders show, then go. | Built |
| 1.2 | **The first quest**, The shore: the book's words (handoff 20, 2026-10-29); the quest is done when you reach the steading. | Built (new words 2026-10-29) |
| 1.3 | **Gathering by hand**: planks and litter at the wreck; wood, stone and fibre; a punch reaches the tree or rock you stand by. | Built |
| 1.4 | **The first recipes** show once their key ingredient is held, never as question marks. | Built |
| 1.5 | **Arnor at the steading**: the meeting, his story, and his lines for each state (meet, wait, deer, mending, teach, taught). **His quests are given and ended only when you talk to him**, and no two lines show at once (not during his graves story either). | Built (changed 2026-10-30) |
| 1.6 | **Arnor's house quest**: the gaps are marked, a plank wall goes only in them, the house is mended; talk to him: "That's a home again", and the straw bed is yours. | Built (changed 2026-10-30) |
| 1.7 | **The workbench opens building** everywhere (Valheim-like): before it, only the comfort pieces, the workbench and the campfire. | Built |
| 1.8 | **Hunting a boar** with the wooden sword or the bow, then carrying it (the slower walk, E to set it down). **A body lies five minutes even when the beast died off screen.** | Built (fixed 2026-10-30) |
| 1.9 | **Butchering at Arnor's table**: meat, leather and the boar's sinew. | Built |
| 1.10 | **The boar quest** (A boar for Arnor, Alistair, LD's title): a boar butchered at the table gives the sinew for the bow; talk to him to end it. | Built (changed 2026-10-30) |
| 1.11 | **The meal quest** (A roast for Arnor, Alistair, LD's title): a deer shot with the bow and butchered, its venison roasted at a fire, the roast handed to him in a talk; the day then runs down to night. Its words are canon (lore handoff 21). | Built (changed 2026-10-30) |
| 1.12 | **Sleeping** on the straw bed in the evening: the night is skipped, the boat is mended in the morning, **and the next day runs at its normal pace**. | Built (fixed 2026-10-30) |
| 1.13 | **Arnor gives the boat.** You launch it and sail; the quest East is in the book. | Built |
| 1.14 | **Falling**: you wake at the bed, or at the wreck before the bed. Nothing is lost that should not be. | Built |

## 2. Robin's six areas, for what chapter 0 shows

| # | Item: what to try | State |
| --- | --- | --- |
| **2a** | **Models and art** | |
| 2a.1 | The hero: walking, sprinting, the dash, the sneak, the bow's draw, carrying, butchering, sleeping, waking. | Built |
| 2a.2 | The boar and the deer: walking, running, falling, lying, carried. | Built |
| 2a.3 | Arnor, his house, the steading, the wreck, the butcher's table, the straw bed, the boat in each of its states. | Built |
| 2a.4 | The island's look: ground, coasts, trees, rocks, grass; set pieces with their cast shadow and foot grass, no sticker look. | Built |
| 2a.5 | Building pieces: walls with their detail, windows, doors, roofs, fences and the campfire. | Built |
| **2b** | **Combat and gathering** | |
| 2b.1 | The wooden sword: a swing, a held swing, the guard, the parry. | Built |
| 2b.2 | The bow: the draw on K, the release on J, the snap shot against the full draw, the aim line, arrows that stick and are picked up. | Built |
| 2b.3 | The quiver and wooden arrows: made, carried, used up. | Built |
| 2b.4 | The axe, the pick and the bare hands: what they give and how fast. **A felled trunk is struck anywhere along what is left of it, and each shortened piece ends in a cut log end.** **A tree falls with a creak, a bending crown and a bounce.** **A rock cracks from where it is struck, breaks into pieces and leaves rubble.** | Built (changed 2026-10-30) |
| 2b.5 | Boars and deer: how they flee, how a boar fights back, how hard each is. **A boar shot from afar charges you** (it calmed again at once past 195 units). | Built (fixed 2026-10-30) |
| **2c** | **Menus and crafting** | |
| 2c.1 | Tab: the panel, the bag, and what you can make where you stand. | Built |
| 2c.2 | The bar: 1 to 6, the wheel, Shift and drag; the knife counts as a weapon. | Built |
| 2c.3 | E at a station shows that station's work alone (Cooking at a fire). | Built |
| 2c.4 | The Building board on a right click: the pieces you know, their icons, the costs. | Built |
| 2c.5 | Chests: Q sort, Z stack, V fill up, N quick stack. | Built |
| 2c.6 | The basic outfit: chest, trousers, leather shoes. | Built |
| **2d** | **The interface** | |
| 2d.1 | The prompts over the hero, and E's rule: the right thing at each place. | Built |
| 2d.2 | The book (O, the Quests tab; L, the Lore Book): the quests page and its plaque, which now waits until a talk window is closed. | Built (changed 2026-10-30) |
| 2d.3 | The map (M): what has been seen, the lettering's big turns. | Built |
| 2d.4 | Health, stamina, the food buffs, the comfort buff by the fire. | Built |
| 2d.5 | Esc: the menu, the music and world-sound bars, Save to a file, Load from a file. | Built |
| 2d.6 | **The "Building" board** still announces building. By the rule there should be no announcing boards. | Open (Colin, AD is looking at how other games do it) |
| **2e** | **Music, sound and effects** | |
| 2e.1 | The day's music and the night's; music in danger. | Built |
| 2e.2 | The world's sounds: the sea, wind, birds, the fire. | Built |
| 2e.3 | Blows, the bow, gathering, footsteps, butchering, eating, and the boat. | Built |
| 2e.4 | Effects: blood, hits, chips from trees and rocks, embers. | Built |
| **2f** | **The day and night** | |
| 2f.1 | The light through the day, dusk, the night and the dawn; the fires' light and shadows at night. | Built |
| 2f.2 | The weather and the season on the starter island (summer). | Built |
| 2f.3 | Roast meat at any fire; raw berries with their 2-minute wait. | Built |
| 2f.4 | Comfort by the fire, and health back over time near it. | Built |

## 3. The foundations

| # | Item: what to try | State |
| --- | --- | --- |
| 3.1 | **Save and load at every step** of part 1: quit, load, and everything is where it was (also from a file). | Built (by script; each step not tried one by one) |
| 3.2 | **No errors**: the error log (Admin, at home) is empty after a full play. | Built |
| 3.3 | **A steady frame rate** at Robin's size, at home. | Built |
| 3.4 | **The frame rate on a weaker computer**: Robin's work computer found the online game laggy (2026-10-29). | To fix (Robin: leave it for now) |
| 3.5 | **The controls** as listed under Controls in `CLAUDE.md`, all of them, with nothing doubled or dead. | Built |
| 3.6 | **No leaks of a later chapter** on the starter island: no wolves, altar, village dishes, fishing, runes or hird. | Built |
| 3.7 | **The alpha's cap**: at sea a little off the starter island the boat turns back with "The end of the alpha". | Built (tested by script 2026-10-30) |

## 4. Choices that wait on Robin

| # | Item | State |
| --- | --- | --- |
| 4.1 | **The glimpses** of chapter 0: eight options, four recommended (`docs/glimpses-chapter0.md`). | Open |
| 4.2 | **The basic outfit's undyed shirt**: in or not. | Open |
| 4.3 | **The steading's other houses**: do they stay as ruin? | Open |

## What changed (newest first)

- 2026-10-30: a beast shot from afar keeps coming for 12 s (2b.5).
- 2026-10-30: felled trunks easier to hit and their cut ends drawn as end grain (2b.4); the roast quest's words canon.
- 2026-10-30: Arnor's quests moved into his talk, the deer made a meal, the day's haste cleared in the morning (Robin's three points); two scripted playthroughs fixed a body gone when the beast died off screen, the plaques under the talk window, and a talk during the graves story. Items 1.5, 1.6, 1.8, 1.10, 1.11, 1.12 and 2d.2 changed.
- 2026-10-30: the list written. Nothing Checked yet.
