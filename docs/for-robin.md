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
6. **Sizes of villages and levels of defence (raid step 4): the table `Village.DEFENCE`**, mine, for you to set the targets
   on. Fighting men by archetype at wealth 0 and 1: farmstead 0 to 1, small village and fishing hamlet 0 to 2, village 2 to 6,
   trading post 3 to 6, chieftain's seat 6 to 12, town 14 to 24, great town 30 to 40; a sixth more a ring further out; the
   hall's and gate's men in mail, the rest in leather (a great town's all in mail), a fifth with bows, wits +1 in the bigger
   places. The bots' ladder (`tests/battle.js arches 3`, `docs/baselines/arches-2026-10-20.txt`), the careful bot with an
   iron sword in leather, alone / with 2 / with 5 of his own: a farmstead taken every time; a small village every time
   (hurt 30 to 60); a village alone 67 to 100%, with men every time; a trading post alone never, with 2 every time; a seat
   alone never, with 2 sometimes, with 5 mostly; a town never, even with 5 (a longship's crew, as you decided). Say which
   rungs feel wrong and I move the numbers.
7. **Ways in (raid step 5), my choices:** by day one yard man in two walks a round; a dead man of the place seen by anyone of
   it within about 100 units (a villager within 44 whichever way he faces) raises the cry and the alarm, so you drag a body
   out of sight (E on him); taking from their chest with a villager or a man looking raises "Thief!" and the alarm; a held
   line of shields lets through half of what a lone shield would and only a heavy blow breaks it (`MEN.wallK` 0.5). The
   bots: five of yours told to hold before a town's gate now put three of twenty out of the fight (was one). The ram, the
   town fighting a fire and the men who go round by the other gate are not built yet. The five ways they come at you:
   `duel` (one on one first) stands as the default; the trial of step 6 will say if another is better.
8. **The defence's tactics (raid step 6), mine:** every place draws one plan with its seed: gate (all to the gate on an
   alarm, holding it), hall (the hall's men stay by the hall and its chest), hunters (they chase further and see further),
   watch (three walk rounds by day, all sharper), muster (they gather at the fire, hold ten seconds, then come together),
   bows (a bowman on the watchtower sees and shoots over the wall). The bots on one town with five of yours
   (`tests/battle.js plans`): the men stand 300 to 460 units from the yard's middle by plan and you would fall at 21 (bows,
   muster) to 60 s (hall). You can read a plan by how its men stand when you walk in. Reactions (falling back to the hall
   when losing, a sortie when you carry) are not built.
9. **Rewards (raid step 7), mine:** every place rolls how full its stores are and how deep its hoard is, and a seat's and a
   town's chests hold more coin than a farm's (`RICH`), so the value rises with the men: a farm 29 to 37, a village 36 to
   53, a trading post 43 to 60, a seat 61 to 103, a town 149 to 233; a church 46 to 66 with no men at all (the lucky strike,
   as you decided); about 8 to 12 of value a man in the defended places (`tests/loot.js`, `docs/baselines/loot-2026-10-21.txt`).
   A full store holds a **sack of food** to carry to the ship like the silver, unloaded at home into the bag. **The feast**:
   at dusk the hall's table is laid; E at it eats their feast (heal 60, +30 top health, stamina, for twelve minutes: above the
   stew), once a day a table; a villager who sees it cries thief. The food kinds are the game's own (meat, berries, honey): a
   store of fish and grain waits for those kinds.
10. **Room for exploration (raid step 8), mine:** a church at wealth 0.35 and up has a trapdoor behind the altar down to a
    crypt: a cave of its own with a stair, a passage, a vault of stone and wooden coffins and bones, and a niche where the
    reliquary stands over a chest of silver (10 to 32 by the place's wealth and hoard; E takes it; the chest then shows
    broken, and stays taken in the save). The hall has a back room behind a locked inner door with the jarl's (or the
    chieftain's) chest in it. Not built: the storehouse loft, a relic as a thing of its own (the crypt gives silver), a
    draugr in a crypt (chapter 3's side threat), the men following you down.
11. **The people of a raid (raid step 9), mine:** a **thrall** of a place (the generator rolls them among its folk) is cut
    loose with E ("Cut his rope") and joins the hird on the spot: he follows you anywhere until he is home or aboard (the
    one case a hirdman follows outside your territory), and the place remembers him gone. **A man of yours left behind**
    (your default 4: taken, not killed) stands bound by the hall of the place that took him whenever its men are up; E
    cuts his bonds and he is yours again. The way to buy him back with silver is not built (no trader talks yet). **A man
    who yields** is let go with E ("Let him go"): he runs and is out of the fight. **A heavy chest dropped** in the open is
    carried back to where it stood by a free man of the place when nobody of yours is within 240 units ("Ours, that."), so
    a dropped chest is not kept for you. **A place raided before keeps two men more a raid, up to six.** Not built: the
    priest (churches have no men; he is a villager and runs), traders shut to you, a price on your head. The lines are
    placeholders for the Lore Director. Checked in the live game: the lost man (Gudrun) bound by the hall and won back,
    a thrall (Arnfinn) joined, a yielded man ran, a chest 450 units from its place went home in 30 seconds, 23 men became 25.
12. **The bots' measures of step 10 (yours is the play):** `tests/battle.js carry` (`docs/baselines/carry-2026-10-21.txt`): the
    loud way with the breaking done, five of yours carrying the heavy things to the ship 450 units beyond the gate while you
    fight. A seat's chest (23 of silver) reaches the ship in about 42 s, dropped and lifted again about six times on the way,
    one or two carriers down, you would fall once in three; a town of twenty gives nothing to six: all five carriers down
    inside a minute and you fall at 51 s (a longship's crew, as you decided); a farm, a village and a trading post hold
    nothing heavy (their loot goes in the bag). **The five ways they come at you** (`tests/battle.js ways 24`): I keep `duel`
    (one on one first): the least crowding round one of yours (2.3 men on average, three or more 30% of the time), you stand
    longest (52 s against a town with five) and most of yours are up at the end; "two at a time" and "all at once" crowd more
    and you fall sooner. Say if you want another. **The Lore Director** has recorded my raid lines with three variants each
    beside them for your pick, and proposes `leysingi` for a freed thrall (lowest on the bench, called so until he earns a
    byname, cropped hair): yours to decide; held as LORE? until then.
13. **Step 5's second half, mine:** **the bucket brigade**: a place with a well sends up to four free villagers with buckets to
    any fire within 320 units of it (the roof that has just caught first, then the wall nearest to burning through; a doused
    wall stays wet 40 s). A fire in a place at peace is no raid in itself any more: the house's own run out, the men come to
    look, the brigade fights it; a fire in a place already raided stirs it as before. The bots: a thatched house with three
    on it stands, with one on it mostly burns; in the live town four villagers beat a timber-frame house fire in about 130 s
    after it had taken a block's worth of walls, and a fire out of the well's reach burned on. **The ram**: G before a barred
    gate, a stone door or a stone wall with four men free, a felled trunk near (or eight wood): the four carry it up and
    swing; a gate goes in about five swings, a church's door in six, a cut-stone wall in forty, the town wall in ninety;
    it is the loudest thing a raid does. Cut stone and the town wall now give to the ram and to nothing else. **Men go
    round by the other gate**: a man who has waited three seconds at a doorway his own side fills, or hangs back from a
    fight with a doorway between, asks for a way round and takes it. In the bots' trials it fires rarely (a town's line
    against twenty is over in half a minute); you will see it or not in play, and I can make it keener. Also fixed: men a
    plan sends to the gate or the muster fight there (their own door no longer bounds them).
