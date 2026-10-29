# Lore handoff 9: Arnor's rowboat lines, and ship names (2026-10-23)

From Alistair, LD to Clive, GD. Earlier handoffs are `HANDOFF-1.md` to `HANDOFF-8.md`. **This one includes handoff 8**, which you
have not taken yet, so copy this one alone. Take it in when Robin says so.

Robin, 2026-10-23: 'Arnor says A: "Planks and rope. A little boat will carry a man across the sound, if he rows." The other
rowboat proposals and the ship names go in as written.'

## Copy

`out/lore/lore.json` → `assets/lore/lore.json`: 114 entries where you hold 109.

## Lines the game reads: changed

| Id | Was | Now |
| --- | --- | --- |
| `line.arnor.teach` (sequence) | line 2 "Logs, and rope. Three logs lashed together…"; line 3 "A bench on the sand, by the water. Then east…" | line 2 **"Planks and rope. A little boat will carry a man across the sound, if he rows."**; line 3 **"A shed on the sand, by the water, like Thorkel's. Then east, past the big island. That is where his sails went."** Line 1 unchanged. |
| `line.arnor.taught` (variants) | "The bench on the sand. Lay the logs, and mind the sea." | **"The shed by the water. Plank by plank, and mind the sea."** The other two unchanged. |
| `line.arnor.shore` (variants) | two lines; `when` the raft's first launch | the same two, plus **"Pull steady. Thorkel always said the sea respects a slow stroke."**; `when` **the rowboat first launched from the starter island** |

The titles say "rowboat" now. Line 3 of the teach is 111 characters.

## New

- `names.ships.rowboat`, `names.ships.karve`, `names.ships.longship` (canon): ten names each, in `list`, for the shipyard's dice.
  - rowboat: the Gull, the Tern, the Otter, the Seal, the Puffin, the Eider, the Shell, Little Ash, Wave-Foal, the Trough;
  - karve: the Crane, the Swan, the Raven, the Heron, the Grey Goose, the Hart, the Ash, Wave-Horse, Sea-Steed, the Mare;
  - longship: Iron-Beard, the Bison, Ellidi, the Bear, the Wolf, the Aurochs, the Eagle, the Stallion, Long Ash, Iron-Ox.
- `names.ships` (canon): the lore of ship names. It has no list. The rule: **no ship is ever called the Serpent**.
- `line.crew.land` (in-game): your "Land.", recorded.

## Changed, no lines

- `chapter.1` holds the rowboat (Robin, 2026-10-22). `person.arnor`: "the boat" in his text.

## Still waiting for Robin

The crew's variants (`line.crew.oars-more`, `line.crew.noroom-more`, `line.crew.land-more`), and the raid's. Keep your
placeholders for those.

Please reply with what you took. — Alistair, LD
