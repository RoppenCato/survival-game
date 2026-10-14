# Playtest 1: from the wreck to the big island (2026-10-14)

Robin plays the game from the beginning to the big island and reports back. This is what is ready, what to switch on, what
to try at each stage, and how to send me what the game logged. Report in your own words; the questions under each stage are
only there so nothing is forgotten. **The three things that felt worst matter more than the whole list.**

## Before you start

- Open `dist/game.html` (or `npm start`). **Esc, New island** for a fresh world. The hero wakes in the wreck with nothing.
- **Esc, Admin, Threefold drops** trebles what trees, rocks, bushes, berries, beasts, the weir and the copper veins give,
  so the gathering goes three times as fast. It is for testing the chain, not the balance: play the first stage once with it
  off if you want to feel the real pace (the numbers are under "The balance" below), then switch it on.
- When anything goes wrong, or at the end of the session: **Esc, Admin, Download the error log** (`errorlog.txt`: every error
  the page caught, with the time, the day and what you were doing) and **Download the frame log** (`framelog.txt`, if it
  lagged). Put both in the project folder and I will read them. The game now keeps running after an error inside a frame
  (it used to die silently); a toast says "An error was logged" when one happens.
- The sound is on. The music is off unless you turn it on in the Escape menu.

## The stages, and what to try

**1. The wreck and the first tools.** Walk over the branches and stones round the wreck. **C** opens what you make by hand:
knap a flint axe, a flint pick and a flint knife (3 wood 2 stone, 3 wood 3 stone, 1 wood 1 stone). A tool made into an
empty slot goes straight into your hand.
- Does the bag fill as you walk over things? Do the first recipes appear once you hold stone and wood?
- **Q** switches to the Gather bar; a number key takes a tool in hand, **the same number again puts it away** (Valheim's way,
  since yesterday). Did that feel right, or did you lose track of what was in hand?

**2. Wood, stone, fiber, berries.** Fell a tree (the first blow cuts a notch; blows from the other side fell it toward the
notch; then chop the trunk into logs), mine a rock, cut bushes with the knife, and **E at a berry bush: the berries now drop
out of it and you walk over them**, as with everything else.
- Did a tree, a trunk, a rock and a bush give what felt like enough? (Numbers below.)
- Did the sweet spots and the rhythm read: the notch, the crack on a rock, the gold number on a good blow?
- Did the berries drop and get picked up every time?

**3. The first weapons and a boar.** By hand: the wooden club (2 wood) and the stick bow (3 wood, 2 fiber). Bows shoot without
arrows for now. Find a boar: the starter island's boars are young (6 health, 7 a blow).
- Fight one with the club: the blow lands where the swing says? The slower swing of yesterday: too slow, or right?
- Shoot a deer with the bow: it should notice you from far in front and less from behind, and run the open way, never into
  the sea. Could you get close enough from behind?
- **K** or the right mouse button is the guard; without a shield it fends with what you hold.

**4. Food.** Meat from the boar, berries from the bushes. **E at a fire** (the steading's, or your own campfire) opens the
hearth board: roast meat (1 meat), roast berries (3 berries), stew (1 meat, 2 berries). A dish cooks on the fire and waits
there in the "Ready: take" strip; click it to take it. Click food in the bag to eat it.
- Did the dish cook and wait at the fire? Did eating show its buff (the icon by the chart, the longer stamina bar)?

**5. Home.** **B** is building. A hut of walls with a door, a campfire or hearth inside, a workbench, a bed and a rug
(2 leather, 4 fiber, from the **Furniture** row) is Comfort 5. The dial by the chart shows the comfort while you stand inside.
The workbench board (E at it) makes the flint sword, the wooden shield (5 wood, 1 leather) and the leather set.
- Could you lay walls by dragging, aim east and west walls, place the door, see the roof appear and fade when inside?
- Did the workbench answer E, and could you craft at it? Did a crafted weapon go to the Fight bar?
- Did the wooden shield go to the shield slot of the character panel (Tab), and did taking a one-handed weapon in hand
  put it on your arm?
- Sleep in the bed after dusk: did you wake rested?

**6. The first night.** Three wolves come when it gets dark. A fire keeps them off (they prowl the edge of its light and give
up after a while).
- Did the night read as dark and dangerous, the fire as safe? Did the wolves give up?

**7. The steading and Brokk.** Hildir's burnt steading lies 900 to 1600 units from the wreck. Brokk stands by its well.
Talk to him (E) until he has told his story; once your home has Comfort 4, talk again and he teaches the raft.
- Did you find the steading without being told? Did his lines read in his own voice?
- The steading's crates break under the axe in gather mode and spill their loot.

**8. The raft and the crossing.** Build the **raft bench** (12 wood, 4 fiber; the Furniture row) on the sand within four tiles
of the sea. E at it opens the Shipyard: lay three logs side by side and a rope lashing on each; Finish launches the raft.
E at the raft boards it; WASD paddles; E again steps ashore. The big island lies east, about a minute away.
- Did the yard make sense without being told? Did "You have left the island" show when you stepped ashore?

**9. The big island.** Villages with people (the map shows nothing until seen), the small mountain in its north-west with
copper veins in its cliffs, a rock shelter, a lookout, and the troll's cave. Mine a vein with the pick (a few lumps),
build a furnace (12 stone, 2 wood) and a charcoal clamp or take the morning embers, smelt copper bars (2 ore, 2 charcoal),
and make copper tools and weapons at the workbench. The boat bench (16 wood, 4 copper, 4 stone) and the yard's faering or
boat come with copper. Villages can be broken into and burnt; their people run; a weapon drawn among them is a threat.
- Did the villages feel alive? Did anyone speak? Did the chart mark them when you came near?
- Did the mountain read as height? Could you find a vein and get copper from it? Was the cave frightening without being
  a maze?
- Did the furnace and the copper recipes appear in the right order (charcoal reveals the bar, the bar the tools)?

## What to report

- The three things that felt worst, in order.
- Anything you did that the game did not answer (an E that did nothing, a recipe that did not appear, a thing that could
  not be placed) and where you stood.
- Any error toast, and the error log.
- Anything that looked wrong at your size (the pane I test in is smaller than your screen).

## The balance (as it stands; Threefold drops multiplies the left column)

| Source | Gives | Cost of the chain it feeds |
| --- | --- | --- |
| A tree (oak 14, pine 11, birch 9 wood) in about 15 s | 9 to 14 wood | the three flint tools 7 wood; club and bow 5; the hut 44; the raft bench 12; the raft 6: about 75 wood, seven trees |
| A rock | 3 stone (a formation 6) | the flint tools 6, the hut 3, the raft bench 2: four rocks |
| A bush | 3 fiber (was 2 until today) | the bow 2, a torch 2, the bed 4, the rug 4, the bench 4, the raft 6: about 22 fiber, eight bushes, or five and the weir's net |
| A berry bush | 3 berries, then grows back in six minutes | a roast 3, a stew 2 |
| A boar | 1 meat, 1 leather | the rug 2 leather, the shield 1, the leather set 9 |
| A deer | 1 meat, 2 leather | |
| The fish weir's net (E) | 4 fiber | |

## What the scripted play-through found today

`tools/visual/startplay.js` played the chain in the browser pane before this doc was written: the wreck, the tools, berries,
two trees, a rock and five bushes, the club and the bow, a boar (the careless bot wins with 9 health left; a careful one
loses 7), the bow shoots, the hut at Comfort 5, roast meat and roast berries cooked and waiting at the fire, Brokk's story
and his teaching, the raft bench, the raft, the crossing. No error was logged.
