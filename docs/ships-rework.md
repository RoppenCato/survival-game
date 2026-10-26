# Ships, the rework (2026-10-22)

**Robin's decisions, from six rounds of questions on 2026-10-22** ("Lets do a massive fix of the whole shipyard, boat building and
boats system"). What bothered him: building ships, sailing them and how they look (the crew's seating and rowing, built
2026-10-21, were not on his list). It replaces `docs/archive/ships-plan.md` where the two differ; what that plan built (the crew seated
and rowing, the hero at the bow, the gangway, the file ashore, the camera pulled back at sea) stays. "All at once": every part
below goes ahead together, each landing as it is ready.

## Robin's decisions

1. **Three ships, each in sizes**:
   - the **rowboat** (wood, just you);
   - the **karve** (copper, in sizes for about 4 to 12 hirdmen, the first ship to leave home);
   - the **longship** (iron, in sizes for about 16 to 26).

   The raft, the faering and the six-oared boat go. A longer size has more seats, more speed with a full crew, a slower turn and
   a higher cost.
2. **Colin, AD's models, really well made**, rendered at many headings (32 or more) as the beasts are, the sail, the shields and
   the colours as separate tinted layers. The hull is no longer drawn in code.
3. **Customised in the shipyard:** the sail's colours and stripes, the shields' paint along the rail, the hull's tar and trim and
   the figurehead, and a name.
4. **Roles by fittings in the shipyard**, kept lean: Raider, Cargo and Voyager now, War with the sea fights of chapter 3 (the
   roles are mine, Robin's "you decide").
5. **A shipyard is a building piece on any shore of your land**, several allowed. E opens **a panel by the water**: the ship
   floats beside it and changes live as you choose. No separate yard scene.
6. **Several ships.** Every ship you have built is yours: it can be summoned at any of your shipyards, and it stays where you
   left it, beached or moored, until you come back or summon it elsewhere.
7. **Ships are never lost.** A wrecked or abandoned ship goes back to your shipyards' roster.
8. **New models open by material age**: wood, copper, iron, and the fittings the same way.
9. **The first boat: Arnor teaches it** as he taught the raft, made from wood and fibre by the water.
10. **Sailing:**
    - **Steering as today:** W forward, A and D turn.
    - **The wind a clear bonus:** rowing always works; the sail adds speed with the wind behind or abeam and little against it,
      shown plainly by a wind arrow and the sail's shape.
    - **About 90 seconds** from the starter island to the big island in the rowboat; a karve with a crew about half that.
    - **Landing: run it up the beach.** Sail into sand and the boat beaches itself; E steps off; board and back out to push
      off. Rocks and cliffs stop you without sticking.

## The work

| # | What | Who | The test |
| --- | --- | --- | --- |
| 1 | **Speeds** retuned to the 90-second crossing (measured shore to shore on the real map), the karve with a crew about half, the longship faster; acceleration, glide and backing that feel like a boat | Clive, GD | `tests/ships.js` times the crossing for each ship, alone and crewed |
| 2 | **Handling:** the turn grows with the way on and shrinks with the size, a little drift in a turn, no snap stops; turning slowly from a standstill | Clive, GD | the same test prints turning circles; Robin sails it |
| 3 | **The wind:** the clear bonus (behind and abeam, little against), a wind arrow on the chart's rim, the sail's belly and the pennant showing it; the sail set or furled readably | Clive, GD | measured speeds at four headings to the wind |
| 4 | **The sea:** beaching on sand (it runs up, stops, E steps off; backing off the sand); rocks and cliffs stop the ship and it slides along them, never stuck; the shallows | Clive, GD | a bot sails round the starter island, beaches at five places and leaves each; never stuck |
| 5 | **The roster:** every ship built kept in the save (model, size, name, colours, fittings, where it lies); several afloat; summoned at a shipyard; never lost; an older save's raft or boat becomes a rowboat | Clive, GD | save and load with three ships in three places |
| 6 | **The shipyard piece** (a building on the shore of your land, several), replacing the raft bench, the boat bench and the shipwright's yard | Clive, GD, and Colin, AD for its picture | placed on three shores; refused inland and in another's village |
| 7 | **The shipyard panel by the water:** the model and its size, the colours, the figurehead, the name, the fittings, the cost; Build, Summon, Refit; the ship floating beside it, changing live | Clive, GD, the panel's look with Colin, AD | in the pane at Robin's size: build, customise, summon |
| 8 | **The fittings**, Raider, Cargo and Voyager, with their numbers. **Raider:** the shields on the rail stop arrows from that side, two more oars, quicker on and off. **Cargo:** a hold for heavy loot (more heavy things aboard), a bigger sea chest, a little slower. **Voyager:** a better sail (more from the wind), provisions (the crew fed on long crossings), the swell at home's edge no matter | Clive, GD (numbers mine) | each fitting's effect printed by the test |
| 9 | **Unlocking by material age:** the rowboat after Arnor's teaching, the karve with copper, the longship with iron | Clive, GD | a fresh start, copper and iron given: the panel's list grows. (The karve today needs the iron bench, which breaks "the ship that leaves home is built from home's materials".) |
| 10 | **Arnor teaches the rowboat** in place of the raft: his lines, the big-step board, the shore farewell | Clive, GD; the lines Alistair, LD's | a fresh start played to the first launch |
| 11 | **The crew on the new models:** the seats, oar ports, mast and steering oar of each model and size from the studio's data; the rowers, helmsman and hero placed by them as today | Clive, GD, with Colin, AD's data | `tools/visual/boats.js` with each model and a full crew at eight headings |
| 12 | **The models:** the rowboat, the karve and the longship, each in two or three sizes, as layers at 32 or more headings: the hull (masks for tar and trim), the sail set and furled (two colours, the stripe patterns), the shields (paint masks), the figureheads (dragon, snake, bear's head, a plain curl), the mast and rig, the oars or their ports; the seats and ports as data; memory within the art plan's budget | Colin, AD | his sheets in the Models scene and in the game at sea |
| 13 | **The shipyard's picture** (a slipway and a shed on the shore) and the panel's clothes | Colin, AD | at Robin's size by the water |
| 14 | **Names for ships** (pools by model), **Arnor's rowboat lines**, the crew's lines ("To the oars", "Land", one left ashore) | Alistair, LD | in `lore.json`, keyed as lines |
| 15 | **The sea's sounds:** the oars' stroke, the sail filling and flapping, the hull's creak, the keel on sand when beaching; references Robin picks in the arena | Derek, SD | a row in the arena's The sounds panel |
| 16 | **The Sea Editor** on the same ships and handling | Clive, GD | its ships and their times match the game's |

## Where it stands (2026-10-23)

| # | Status |
| --- | --- |
| 1 to 4 | **Built.** `tests/ships.js`: the rowboat 96 s to the big island, a karve with eight 53 s, a longship with 26 40 s; the turn from a standstill; the wind 173 / 158 / 130 / 115 behind, abeam, close-hauled, ahead; the beach and the rock wall. `tools/visual/shipsplay.js` in the real game: the rowboat and a karve beach and come off at five places round the starter island. Played: the rowboat from the far side of the starter island to the big island's beach in about 104 s. |
| 5 | **Built.** The fleet in the save (name, look, fitting, where each lies); a raft, faering or boat of an older save becomes a rowboat. |
| 6, 7, 9 | **Built.** The shipyard piece on any sand at the water (on the starter island's list too), its panel with New ship and Your ships, the preview beside the slipway with the camera pulled back to fit her, built where she was shown; the models opened by Arnor's teaching, copper and iron. |
| 8 | **Built.** Raider, Cargo, Voyager with their numbers (`tests/ships.js` prints each). |
| 10 | **Built:** Arnor teaches a boat, the board "A boat", his farewell at the shore, in the rowboat's words since handoff 9 (row 14). |
| 11, 12 | **Built.** Colin, AD's models of every size: the rowboat (2026-10-22), the karve for 4, 8 and 12 and the longship for 16, 20 and 26 (2026-10-23), the look laid on their parts, the crew, the helmsman, the hero and the oars on their marks, drawn in his order. Played in the pane: a karve with twelve aboard under sail at two headings; a longship in the Sea Editor. |
| 13 | **Built** (2026-10-23): Colin, AD's naust in four facings, placed turned to the water with its slipway into it, the ship launched off the slipway's end; the panel in his clothes. |
| 14 | **Built** (2026-10-23, Alistair, LD's handoff 9 on Robin's yes): Arnor teaches the rowboat, says his word after and sees you off in its words; the shipyard's names roll from the pools by model (`names.ships.<model>`) with a Roll button; the crew's "Land" recorded as in-game. The crew's other lines and the raid's are still `LORE?` placeholders. |
| 15 | Derek, SD has the brief; the game calls the sounds by name already. |
| 16 | **Built.** The Sea Editor sails the game's ships with their handling, and its crossing times match the game's. |

The old yard scene where a hull was laid part by part is gone; `tests/karve.js` checks the ship line in its place.

Not in this rework: fighting from the deck and on the decks (`docs/archive/ships-plan.md` stage A in chapter 2, stage B in chapter 3,
both as decided), the War fitting with them, and ships of other people that sail.
