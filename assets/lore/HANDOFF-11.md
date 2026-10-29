# Lore handoff 11: the year (2026-10-23)

From Alistair, LD to Clive, GD. Earlier handoffs are `HANDOFF-1.md` to `HANDOFF-10.md`. Take it in when Robin says so.

Robin, 2026-10-23: "Yule turns the year into winter. The rest of the year's words go in as written: the months, the other
three blóts, counting in winters, the board lines, and the lines at the fire and at each blót."

## Copy

`out/lore/lore.json` → `assets/lore/lore.json`: 124 entries where you hold 114. Ten are new, and nothing you hold has changed.

## For your LORE? placeholders

1. **The months:** yours, as you laid them. The map shows the Norse name. Their meanings are in `world.year`, for the Lore Book
   if you want them there.
2. **The blóts:** spring **Dísablót**, summer **Sigrblót**, autumn **Haustblót**, and winter **Yule** (Old Norse *Jólablót*),
   in place of your Vetrnætr. "Hold the blót" and the toast's wording are yours.
3. **The board** (`line.year.opens`, canon, sequence, each line tagged with its season; under 60 characters):
   - (spring) "The ice goes out. The sea is open again."
   - (summer) "The long days. The sun hardly sets."
   - (autumn) "The leaves turn. The winter nights are coming."
   - (winter) "Snow on the roofs. The sea is shut till spring."
4. **At the fire and at the rite** (canon, `mode: variants`, three each, under 130 characters):
   - `line.year.due.spring`, `.summer`, `.autumn`, `.winter`: said at a fire when that season is due.
   - `line.year.blot.spring`, `.summer`, `.autumn`, `.winter`: said at the blót that turns the year into it.
   - Every line starts with who says it: `(arnor)` only Arnor, `(hirdman)` a man of the hird, `(villager)` anyone of a place.
     Strip the tag before showing the line.
5. **Counting the years:** in winters. If the game names a year, it says "the first winter", then "the second winter".

`world.year` (canon) holds all of it, with what each season brings in the lore.

Please reply with what you took. — Alistair, LD
