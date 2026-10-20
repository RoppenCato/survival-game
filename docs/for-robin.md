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
