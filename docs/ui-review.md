# The menus, boards and bars: a review (2026-10-12)

**Robin:** *"Look through all the menus and crafting UI, toolbar, windows. Anything that toggles and is used. Think of what
improvements you could make. Function: does it function properly and does it need updating? Looks: does it feel fitting with
the art direction, is it pleasing? Does it make sense, does it feel intuitive?"*

Every board was opened in the browser pane at Robin's size (a 1200 by 750 canvas), on a fresh game, in the sandbox and in the
test hut (`?scene=runes`), with the keys and the mouse driven by script, and the code behind each was read. What was plainly
broken is **fixed** (section 2, `docs/pictures/ui-review.jpg` is before and after). What is a matter of taste or of how the game
should work is **proposed** (sections 3 to 5) and waits for Robin.

## 1. What was looked at

The health and stamina bars, the chart in the corner, the meal and torch marks, the comfort line, the hint line, the E
prompt, the notes that float by the hero, the hotbar in its three modes, the build cursor and its label, the wreck cursor;
the bag and the two bars' board, the character panel (Gear, Stats, Ring), the item card, the quiver; the Building board; the
recipe boards (by hand, workbench, hearth, furnace); the carver's bench; a chest; the map; the Escape menu, Admin, Light and
sound; the Shipyard. **Not looked at closely:** the muster board, the Book of Beasts (hidden), the fishing bars, the two test
boards.

## 2. Found broken, and fixed

| What was wrong | Now |
| --- | --- |
| **The mouse wheel froze the game.** In build mode on a fresh game, three notches of the wheel reached a piece not yet known; the function that steps to the next known piece called itself for ever, and every frame after that threw. Since 2026-10-08. | `stepPiece` steps; the wheel goes through the pieces you know. |
| **E opened the wrong thing.** A workbench answered E from 56 units off before a chest, a bed or a seat was asked, so in a small house the chest you stood at and faced opened the workbench's board. | Hearths, benches, the furnace, beds, chests and seats are one choice: the one within reach that you most nearly face. The prompt and the key ask the same function. |
| **The furnace's and the hearth's boards wore the workbench's tabs** ("Workbench, By hand", neither lit) once a workbench had been used. E closed a hearth's board but not a furnace's. | Each has its own tab; E closes both. |
| **The bars and the hotbar were drawn over every board:** the health bars lay on the Building board's tabs and the map's title, the hotbar's label on the Escape menu's last line; villagers' speech was drawn over the map. | Boards are drawn after the HUD (`scene.boards`). |
| **Leftovers by the hotbar:** in build mode two round ghost icons, an "F" (F has not swapped weapons since 2026-10-05) and an arrow count hung at its left; in fight mode the arrow count hung loose at the bar's corner whatever slot the bow was in; in build mode six empty numbered slots. | Gone. What a bow or a sling has left is written in its own slot. Build mode shows the piece's name and no slots. |
| **The arm ring was drawn across the quiver** (and "No arm ring" across its empty slots), hiding the arrow count. | The ring has a place of its own under the boots. |
| **A recipe's tale was cut in mid-sentence** after three lines ("the way the"), with half the page empty; what it takes lay across the page's lower edge. | The page shows as many lines as it holds; the cost boxes lie under it. |
| **The Escape menu's lines ran out past the board;** "Sounds of the world" lay under its own bar. **Restart** and **New island** threw the game away on one click. | A wider board, shorter lines; a second click within five seconds ("Click again to do it: what you have built and gathered here is lost"). |
| **Keys worked under the Escape menu:** E opened a furnace's board on top of it. | The game's keys rest while it is open. |
| **The Building board** lay over the health bars and touched the chart, padded every row with empty cells that looked like something missing, and wrote the name of the piece you point at across the bottom row's icons. | Lower and clear of both; a row is as long as what is in it; the name stands in the tab row. |
| **The bag's second bar was numbered 7 to 12** (its keys are 1 to 6); the name of what you point at lay over the Sort button and said "right click: equip" of a thing already on the bar. | 1 to 6; the name stands at the left and says what a click does ("to your bar", "wear"), or nothing. |
| **Notes** ("Made a flint axe") were drawn under the bag and under any recipe board, and across the E prompt. | Over the bag; beside the prompt; above a board that lies over the hero. |
| **The Stats and Ring pages** ran over the leather's stitching; "Known, not cut" stopped after two lines in mid-list; **Attack counted only a sword** (a club in hand read as a fist, and a fist as 5). | Inside the stitching; the whole list; whatever is in the hand. |
| **The Shipyard's** cursor label lay across the part you were placing; the stamina bar showed under its top board. | Under the part; no bars in the yard. |
| The last of the old navy (the chart's frame, the E prompt, the cursor's label) | The boards' own brown-black ink. |

## 3. Function: what I would change next

Ranked by what it would do for a player.

1. **B means two things.** B is build mode, and its board also holds what you make by hand. So to knap a flint axe you
   enter build mode with a wall on your cursor, and must press B again to get your hands back. **Proposal:** making by hand
   gets its own key, **C** (free since the casting cloth went), and the first hint becomes "Press C". B is building only.
   The smaller change: B opens the board without entering build mode until a piece is picked. *Half a day.*
2. **E for everything, by one rule.** Built things are fixed (section 2), but people, stones, racks, berries, boats and caves
   are still a fixed order kept twice, once for the prompt and once for the key (two lines of forty conditions each, which
   must agree). One list of "what E would do here", sorted by what you face, would end the class of fault for good (Brokk's
   campfire had to be moved a step from him so E would not muddle them). *A day, with care.*
3. **One number for a weapon.** The same iron sword is "Damage 1.3" on its card, "Attack 6.5" on the Stats page and a 6 over
   a boar's head; a recipe says "Damage: 1.02". **Proposal:** the number you see in the world, everywhere, to one decimal,
   and on a recipe or a card the difference from what is in your hand. *An hour or two.*
4. **The workbench's list is one long scroll** (twenty-five things, seven and a half showing). The recipes already carry a
   category (Tools, Weapons, Armour, Supplies): small headings in the list, or tabs. *An hour.*
5. **The Building board** is sixty small pictures that say nothing until pointed at; three green floors look alike.
   **Proposal:** the categories as tabs (one screen each, no scrolling), the name under each piece as in the Shipyard's
   parts, the cost in the cell and faint when you cannot pay. *Half a day.*
6. **Clicks in the bag.** A left click eats food at once and sends a weapon to its bar; there is no way to split a stack, to
   drop one of a stack, or to move half into a chest. **Proposal:** left click and drag to move, right click to use (eat,
   wear, to the bar), Shift and click to send across to an open chest, Shift and drag to split. *Half a day.* Robin's taste.
7. **The map shows the whole sea from the first minute**, with a question mark where the steading and the cave are. Robin
   decided on 2026-10-07 that a place shows only once seen; the land itself and the two question marks are older than that.
   **Proposal:** the chart draws only what you have seen, as the cave's chart already does. Exploring is a pillar of the
   game and the west is "the unknown". *A day.* (CLAUDE.md lists this as not decided.)
8. **The frame readout** is always on and lies across the character panel; Admin has a second, different one behind a
   switch. **Proposal:** one readout, behind Admin's switch, in a corner. Robin asked for "always on" on 2026-10-08 to hunt
   the lag, so this waits for a yes.
9. **Materials have no card.** A thing has a leather card with its tale; wood, fiber, charcoal have only a name by the
   Sort button. Their tales exist for some (`STACK_TALE`). A small card would let a material say, in the world's voice,
   what it is good for. *An hour or two.*
10. **Empty promises on the Gear page.** The necklace, two rings and two trinkets have had nothing to fill them since
    2026-10-07; half the page is outlines. Show a slot when the first thing for it exists, as the Building board does.
11. Small: the Sort button has no name on hover; "Cancel" gives back the last one queued, which the button does not say;
    the map has no north (and here the compass means something) and its labels collide on a small island; "You have fallen"
    is the engine's plain text on a blue veil.

## 4. Looks: what fits the art direction and what does not

**Fits:** the boards themselves. Wood with grain, an ink line heavy on the shadow side and iron nails; leather with
stitching; the parchment page; the carved buttons. **The carver's bench is the best board in the game** (the ring on its iron
slab, the leather window, "Five blood for it"): it looks like a thing in that world, not a window over it. The E prompt and
the meal's round mark are right too.

**Does not fit:**

1. **The type.** Every word is the system's sans face (Segoe UI), bold, white with a dark outline: the face of a phone
   app, set on boards drawn after Bauer and Egerkrans. The one place that uses a book face, the item card (Georgia), is the
   one that looks at home. **Proposal:** one book face for names and titles everywhere (Palatino or Georgia from the
   system, or a face carried with the game), the sans kept for small numbers only.
   **`docs/pictures/ui-type.jpg`** is the same board as it is, in Palatino and in Georgia: a throwaway preview (`U.face` in
   `tools/visual/ui.js` swaps the face on its way into the canvas); nothing of it is in the game.
2. **The three corners of the HUD are from the look before the ink.** The health and stamina bars are glossy and bright
   with rounded ends; the hotbar is six flat boxes floating on the grass with a line of key reminders over them that never
   goes away (the rule is three bare reminders at the start and no more); the chart is a flat green and blue picture in a
   dark frame that glows at night like a screen. **Proposal:** the bars as two inked strips in the palette's madder and
   moss; the hotbar as a plank with the bag's own slots and the mode shown by a small sword, axe or hammer instead of
   words; the chart as a piece of vellum in a wooden frame that darkens with the night.
3. **Four kinds of tab** (the recipe boards' carved amber, the character panel's pale boxes, the ring board's pale boxes,
   the Shipyard's) and three kinds of slot. One of each.
4. **The map** is a great wooden frame round a flat picture. A sea chart on vellum, coasts in ink, a wind rose, would be
   the board most worth making beautiful: it is the one a player opens to dream over.
5. **Small icons vanish.** A bow, a rod or a pick in a slot is a thin dark line on a dark ground. A paler ground inside a
   filled slot, or a light edge on the icon, would let them read.
6. **Space.** The character panel is a small figure in a wide empty hide; the hearth's board is sized for ten dishes and
   holds three; the recipe page is half empty for most things. Boards sized to what is in them would look more made.

## 5. Sense: is it clear what to do?

Mostly yes, and where it is not, the cause is in section 3: B meaning two things, E's order, the numbers. Three more:

- **The modes are told in words.** "FIGHT (Q to gather, B to build)" is how you know what your hands will do. The bar
  could say it by what it shows (the proposal under Looks, 2), and the bag's two rows already carry a tiny sword and axe
  that nobody will notice at their size.
- **Wearing, holding and carrying are three ideas with one word.** A weapon is "equipped" by being on a bar, held by being
  in the bar's gold slot, worn if it is clothing. The fixed labels now say "to your bar" and "wear".
- **Nothing tells the hour** since the dial went (2026-10-06, on purpose). The light does, once you know the day's length.
  Left alone unless Robin misses it.

## 6. Questions for Robin

1. **C for making by hand**, B for building only?
2. **The map: only what you have seen?**
3. **The frame readout behind a switch?**
4. **The looks:** shall I make the type, the HUD's corners and the map as trials to switch on and off (the way the lighting
   was tried), so they can be judged in the game and not from my description?
5. Anything in section 3 that should **not** be done, or done first?

## 7. Robin's answers, and what was done (2026-10-12, the same day)

*"1. Yes. 2. For now show all. 3. What you think is best. 4. Nah. 5. All."*

`docs/pictures/ui-review2.jpg`: the Building board, what you make by hand, the bag with a material's card, the map.

| Section 3 | Done |
| --- | --- |
| 1. B means two things | **C** opens what you make by hand, anywhere (C again or E or Esc closes it). **B** is build mode and the Building board, nothing else. The first hint reads "Press C". |
| 2. E by one rule | `eWhat(P)` is the one answer to "what would E do here": what you are in the middle of first, then the thing you most nearly face of those within their own reach. The prompt shows what it says and the key does what it does; the two long chains are gone. It mended one disagreement on the way (by a claim stone with a man following, the prompt said Muster and the key made him its keeper) and a stone already read no longer swallows E. |
| 3. One number for a weapon | The number over a struck beast is the number on the card, the recipe and the Stats page (an iron sword: 6.5 everywhere; the world's number shows one decimal, as a tool's blow always did). Beside it on a card or a recipe, in green or red, the difference from what you hold of the same use. |
| 4. The workbench's list | Small headings in every recipe list with more than one kind: Tools, Weapons, Armour, Supplies. |
| 5. The Building board | A tab a category (Walls, Floors and roofs, Ground, Yard, Furniture, **Work**, Outdoors), a screen each, no scrolling; every piece with its name and its cost (small pictures and numbers, red where you have too few), faint where you cannot pay. The wheel over the board steps through the tabs. Work is new: the benches, the furnace, the clamp and the rack, which lay scattered through Furniture and Outdoors. |
| 6. Clicks in the bag | Drag moves; **right click uses** (eats, lights, sends to its bar, puts on); **Shift and click** sends across to an open chest or out of one; **Shift and drag** carries half a stack. A plain click no longer eats. The line over the bag says what a click would do; the card says what the thing is. |
| 7. The map | **Left as it is: it shows all** (Robin). It has a north mark now, and names move aside where they would lie on each other. |
| 8. The frame readout | One readout, bottom left, on Admin's **Show frame time** (off by default). The frame log is written whether it shows or not, so "Download the frame log" is as before. |
| 9. Materials have a card | Every stack: its name, a line of what it is good for in the world's voice, and for a food what the meal gives. |
| 10. The Gear page | The necklace, the rings and the trinkets show when there is something in the game to put in them (nothing yet). The arm ring sits under the shield. |
| 11. Small | Sort says "Sort the bag" when pointed at; Cancel reads "Cancel 1"; the chest's slots are the bag's own; every board has the one make of tab; "You have fallen" is a board of the game's own. |

**Section 4, the looks, is left as it was.** Robin's "Nah" was to making them as trials. Whether that means *leave the looks
alone* or *do them without trials* is the one thing still to ask.

Checked in the pane at 1200 by 750: C, B and the wheel on a fresh game; every prompt in the test hut by where the hero
faces; the cave in and out; Brokk and his fire by which is faced; berries, the weir's net, a raft boarded and left; a split
stack, a meal eaten on a right click, a stack sent into a chest and taken out; and the whole scripted start from the wreck
to the raft and the first night (`tools/visual/startplay.js`).

