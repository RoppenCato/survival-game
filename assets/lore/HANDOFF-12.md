# Lore handoff 12: the troll-berry pot, and what the new runes changed (2026-10-24)

From Alistair, LD to Clive, GD. Earlier handoffs are `HANDOFF-1.md` to `HANDOFF-11.md`. Take it in when Robin says so.

Robin, 2026-10-24: "The Trapper's poison is troll-berries, and the troll-berry pot and its book page go in as written."

## Copy

`out/lore/lore.json` → `assets/lore/lore.json`: still 124 entries. One is new and one is gone. **No line the game reads has
changed.**

## New

- `thing.troll-berry-pot` (canon): the Poison trap's pot. Troll-berries are baneberry (*trollbær*, *trolldruva*), black and
  poisonous. Its `book` page: "Shiny black berries from the shade of the woods. Folk call them troll-berries and say the trolls
  planted them for the greedy. A trapper crushes them into a clay pot, and whatever steps on it does not run far." Your
  placeholder can read "a clay pot of crushed troll-berries". The bench stays "the trapper's bench".

## Gone

- `line.arnor.riposte`: retired, since it never plays now (you switched it off with the old ring's runes).

## Changed, no lines

- `thing.arm-ring`: Robin's 2026-10-23 word, that the ring no longer measures power and the runes are off it, recorded in its text.
- `world.year`: a proposal note in its text (the blót at the altar). The canon words are unchanged.

The rune names Robin chose (the Cat's Hush, the Feller's Fury, the Linden-splitter, the Blood-debt) are already in your code. My
rune cards (`line.rune.*`), the altar (`thing.horgr`) and its lines are still proposals, so they are not in lore.json.

Please reply with what you took. — Alistair, LD
