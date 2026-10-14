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

## Robin's report (2026-10-14), point by point, and what was done

Robin played from the wreck to the big island's copper the same day and answered the 25 points. **Fixed at once** is marked;
the rest is direction for the work to come, and most of it is big.

1. **The beginning** works but is strange: waking, looting at once, then C (which you never use again), and B's board already
   full. **Direction: a slower, more elaborate beginning, introducing things one at a time; finishing the broken house to sleep
   in it; no sleeping in a bed that has no roof.** (The roof rule is fixed at once: a bed with no roof says "No roof over it".)
2. **Combat** works but needs a lot: the club feels awful, the fight not smooth or snappy enough; **a parry should stun the man
   for about a second; mobs stagger too easily from plain hits; the red line that marks an attack is to go, for something natural
   and immersive.**
3. **Chopping** is clunky: hitting slowly with low impact, "I ended up just hitting till it dropped". **Trees are far too small:
   about three times the size. Trunks are now twice the tree's size, and chopping them is not satisfying.**
4. The trunk is clear (see 3).
5. Mining has the same feel problem; the crack reads. **The stones all look the same everywhere, especially the big ones: it
   breaks immersion.**
6. Berries work. **The bush should shake or something: static and stiff now.**
7. See 2. **K showed nothing on the hero**, and the villagers armed and attacked (a raised guard counts as a drawn weapon, which
   is a threat in a place at peace). Robin had no shield: without one K raises only the bare forearm.
8. **The deer** runs when you come close, and runs when hit by an arrow, so you chase it for ever: feels impossible to kill.
   **A good system is wanted.**
9. The bow aims well. **Arrows should be a lot thinner and fly faster** ("transporting itself"). **Fixed at once:** speed 240 to
   420, the shaft and head half as thick.
10. Food works. **Crafting feels off against other survival games**: you can queue more than you have materials for (the
    furnace board showed 33 on the way with 19 ore; to be checked whether Admin's Free was on, since the queue is capped by
    `canAfford`, which Free bypasses), and something about making things feels wrong.
11. **East and west walls are very hard to place**: hard to see where they go and whether a wall is there at all. **Most roofs
    are green, though thatch should be yellow.** (Fixed at once for the villages: thatch is the roof, turf only for the poorest,
    `Village.DEF.turfBelow` 0.22; the player's own default was thatch already.)
12. E works. **Village beds should not be usable** (fixed at once: "Not your bed" in a village you do not hold).
13. Crafting works. **The bag with its two bar rows looks weird and complicated; maybe the whole Q switch is a bad idea.**
14. **Night progresses strangely**: the message comes and then it is five minutes before it is dark; the light changes little
    after the message.
15. Sleep works. **The way text appears is not liked: the toasts, the crafting and the new-recipe notes. A better way is wanted.**
16. **The steading was too easy to find: it should be further, so you explore and learn the controls first. Brokk's lines are
    bad and non-immersive, and the chat bubble is bad: another way to show speech is wanted.**
17. Crates work. **Bigger boxes, and no glint over them.** (Fixed at once: the crate and the chest half again as big in the
    kit's `SIZE`, the loot glint gone; stations keep their glint for what is ready.)
18. The raft works, but **the shipyard wants rethinking: perhaps a few really nice models that the player customises, since
    the hirdmen must board and row.**
19. **"You have left the island" did not show, and the next island was too close to be a trip.**
20. Villages react. **K and X are confused**: K equipped nothing visible but the villagers ran; with X Robin could kill them.
21. The vein works. **The cave mouth looks pasted onto the mountain** (the first picture).
22. The cave looks nice. **The troll must be bigger and scarier: he was almost the hero's size and slow, met by stumbling on
    him.**
23. Copper works; crafting feels off (see 10).
24. (not tried)
25. The logs were sent. And from the sound studio: **the ambient sound and the waterfall went on when the window lost focus**
    while the music hushed (fixed at once: both check `document.hasFocus()` as the music does).

### The order I propose (Claude; nothing decided)

1. **The feel of a blow and a chop, together** (2, 3, 5, 6): one impact system for weapons and tools (the pause, the push,
   the sound, the thing struck moving: a tree that shudders, a bush that shakes, a rock that chips), the parry's stun, stagger
   only from heavy blows, and the attack mark redrawn as something of the world (a man's stance, a drawn-back arm, a shadow)
   instead of a red line. The Combat Arena is where to try it.
2. **Scale of trees and trunks** (3): trees three times the size, the trunk the tree's own length, the chopping of a trunk
   made worth doing.
3. **The beginning** (1, 16, 15): the wreck further from the steading, things introduced one at a time, the broken house as
   the first home, Brokk's lines rewritten and speech shown another way, the notes and recipe reveals redesigned.
4. **The bars and the bag** (13, 20): one bar, perhaps, and the drawn weapon made plain; K and X told apart on the hero.
5. **The deer and the bow** (8): a wounded deer that slows and bleeds, a hit that does not send it to the horizon.
6. **Night pacing** (14), **rocks that differ** (5), **the cave mouth set into the rock** (21), **the troll's size** (22),
   **the island gap** (19), **the yard as models to customise** (18): each its own smaller piece.

### Built the same day (Robin: "Do 1, 2 and 3")

1, 2 and 3 of the order above are built and pushed; the details are in CLAUDE.md under "After the play-through". In short:
a light hit no longer staggers a beast, a parry stuns for a second, the red attack marks are gone (dust and a glint at the
start of a windup instead), the hero's windups are quicker, hits stop harder, trees and bushes sway when struck, the swing
pace is quicker, a trunk holds four logs and is as long as the tree was tall (it was twice: a bug in its length); trees are
three times the size; the steading is further off, the broken plank house holds the bed and must be mended before its roof
comes back, the Building board starts with six pieces and opens after the first night under a roof, Brokk speaks differently,
and speech is a board at the foot of the screen. Not done from the list: the bars and Q, K against X, the deer, the night's
pacing, rocks that differ, the cave mouth, the troll, the island gap, the yard.

**5, the deer (the same day, Robin: "Do the deer"):** a deer hit once bleeds, slows and stops sooner, and leaves a trail of blood to follow; one wood arrow bleeds it out in about 37 s, a second on the standing deer in 17; deer go in herds of two or three with one on watch that sees all round, and a herd runs and grazes together. The real fault behind "impossible to kill": a deer that stopped running was removed from the world (a flag shared with men who run off), so the one you chased was never there to be caught. Details in CLAUDE.md under "The wounded deer and the herd".

**Then 14, 5, 11 and 19 (Robin: "Do 1-4 and then 6"):** the dark falls faster and faster after "The light is going", which now comes two and a half minutes before full night instead of five; rocks come in six variations with their own tones and builds; walls that run north to south have a leaning face you can see (the Destruction Editor's trial, on by default); the islands lie about 200 tiles apart (a raft's two minutes) and the banner comes whenever you stand on the other island. Details in CLAUDE.md under "Four more of the play-through's points".

### Questions for Robin

- The crafting that "feels off" (10, 23): is it the board (a list and a page), the queue and the Ready strip, the time a
  thing takes, or that things appear in the bag rather than in the hand? One sentence on what Valheim or Grounded do that
  this does not would set the direction.
- Was Admin's Free building and crafting on when the furnace showed 33 on the way?
- The bars (13): one bar of six with weapons and tools side by side, Q gone? Or keep Q and only draw it differently?
- The steading (16): how far should it be, in minutes of walking?
