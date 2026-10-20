# For Robin to look at

**Robin, 2026-10-20: "Do all the steps in your plan. Don't stop to wait to ask me stuff. If there is something I should review,
save multiple things in a list for me to look at later."** This is that list. Newest at the bottom; each says what was done,
what I chose, and what to look at. Cleared when Robin has answered (the answer goes to `CLAUDE.md`).

## Waiting from before

- **The Art Director's lighting review** (`C:\dev\SG\Art Director\out\lighting\REVIEW.md`, `night_proposed.png`): the fire's
  light a hole of daylight, the night black-teal not blue, the water too blue at night, the cave's dark. Nothing changed; your
  yes or no, then I make the numbers.
- **The Stats page** in the Art Director's picker: save your pick and it sends the change list.
- **The Lore Director's names** for home water (Fridmund at Tingvoll, the Meadow Isles, the four Ways, island pools).
- **`art/render/`**: 4.1 GB of raw frames; everything in the game is packed from them already. Delete?
- **The sword's timing switch** (`STEPS` or its profile): would change the feel you approved.

## From the raid work (2026-10-20 on)

1. **The men hit harder: `MEN.dmg` 18, was 12** (`src/combat.js`). Why: your blows start on the press since 2026-10-20 and the
   men had not been retuned; the tapping bot beat one axe-man in leather every time (was about half). I swept the levers with
   `tools/sweepmen.js` (windup, damage, health, reactions) and the one number that brings the ladder back to its targets is the
   damage of a man's blow: the tapper now wins half against one man in leather (23 health left), the careful bot three in four
   against two axe-men, the skilled bot everything with 94 left, five against five a coin. To feel: the Combat Arena, one man
   with an axe, leather; a blow on you now takes about a fifth of your health. If it is too much, 16 is the next step down.
2. **The settlements' men (raid step 1): how many a place has** is a first table of mine: a town 20, a seat 10, a trading post
   4; villages, farms and churches have no soldiers, only householders who arm when raided. Step 4 makes it by wealth and ring
   with a bots' table for you to set the targets on. They come when you are within 1200 units and go when you have been 2600
   off for 40 s. Admin has "Go to the first sea's town" to see them.
3. **Word spreads (raid step 2):** a raid makes every place within 3200 units wary: its men sharper (wits +2, up twice as fast)
   and its gate man says so ("We heard what you did at X": a placeholder line, the Lore Director's to write). Mine; the reach
   and the sharpening are first numbers.
4. **The steading in the Art Director's pieces** (its villages plan, steps 1 to 3, 2026-10-20): the graves as mounds, the
   wreckage lying in the hall's ash (charred beams, burnt heaps, the torn-off gate leaf), ash and soot painted, the new
   palisade stakes and gate, thatch in courses with a turf ridge, a smoke hole in a hearth room's ridge. Start a new game and
   walk to the steading; the Art Director has a board of every village too.
5. **The hird on a raid (raid step 3), my choices:** a hirdman ashore on a raid fights with copper (an axe, a spear, a sword by
   his number) in leather with a shield, until looted iron arms him (not built); one left ashore when the ship has sailed 700
   units off is lost (taken, to be won back in step 9); a carrier holds on until under 45% of his health (`MEN.dropAt`); if
   you fall on a raid with any of your men standing within 600 units you wake aboard the ship with them, the chest you
   carried left where you fell, your bag kept. Admin: "A karve by you", "Four hirdmen join".
