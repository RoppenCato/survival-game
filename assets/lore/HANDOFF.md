# Lore handoff 30: home water's villagers, after your played run (2026-11-14)

From Alistair, LD to Clive, GD. Earlier handoffs are `HANDOFF-1.md` to `HANDOFF-29.md`.

Your played run of chapter 1 (`docs/chapter-1-goals.md`, finding 15) found three pairs that no longer fit home water. They have new
words of mine, `in-game` under Robin's rule of 2026-10-31; Robin may change them. lore.json: 211 entries. Every line is under 130
characters.

## 1. `line.folk.greeting`: pairs 8 and 9 have new words, in their places

Lines 15 to 18 changed; the ids and the other positions are the same. Your `linesOf('line.folk.greeting')` pairs them as before, so
the new lore.json should be enough. (The fallback `FOLK_LINES` in `templates/game.html` still has the old pairs; that is yours.)

- Pair 8, for the raft (he came in Arnor's boat):
  - "You came in Arnor's boat. He'd not give her to just anyone."
  - "Good in the sound. Out where the water goes dark, she'd not last a morning."
- Pair 9, for the troll in the hill cave (there are none in home water; other villagers already say the trolls went north):
  - "Come summer's end, Hallveig lays the table for the gods. Half the island comes."
  - "The other half sends something, so the gods don't notice who stayed home."

Pair 9 now points to Hallveig and the blót, which only Hallveig spoke of before. It decides nothing about your question 1 (the blót
gating the ship).

The troll pair is not lost: it is saved for the north as `line.folk.troll-cave` (`proposed`, not in lore.json).

## 2. New: `line.folk.merchant-home`, for the merchants of home water

Speaker `role.merchant`, chapter 1. Two lines, for the merchants' place in `ROLES` while in home water:

1. "Ormr's men had our wool, friend. The stalls stay bare till the traders come back."
2. "Old Aslak at {place} built half the boats round here. The other half, his brother."

- `{place}` is Old Aslak's village, so a merchant points to it (your finding 10). If you cannot fill it, or the merchant stands in
  Aslak's own village, line 2 reads: "Old Aslak built half the boats round here. The other half, his brother."
- Line 1 says why the stalls are bare, so five merchants with nothing to swap make sense.
- The order is yours, and so is Robin's question 7 (a clue as the first line).
- The old pair ("Wool, salt, iron" and "Silver by weight") stays in `line.folk.roles` for later chapters, where there is trade.

## Changed ids

- `line.folk.greeting`: lines 15 to 18 (in-game).
- `line.folk.merchant-home`: new (in-game).
- `line.folk.troll-cave`: new (proposed, the north; not in lore.json).
- `line.folk.roles`, `being.bergtroll`: a note each, no change to their lines.
