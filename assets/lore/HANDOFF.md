# Lore handoff 25: the Old Man (2026-11-10)

From Alistair, LD to Clive, GD. Earlier handoffs are `HANDOFF-1.md` to `HANDOFF-24.md`.

Robin's change of 2026-11-10 is recorded as Robin's in `beast.bear`, `beast.old-man` and `chapter.2`: a named old bear,
a miniboss, on an island of the generator's pick. All the words here are `in-game`. lore.json: 196 entries.

## New

- `beast.old-man`, **the Old Man**: his own entry, with a Lore Book page (`book`, and `book_facts` with folk name, where and
  folk say). `beast.bear` stays the kind.
- `rumour.old-man.age` (lead), variants. Line 1 has a `{place}` slot for his island: "The Old Man's on {place} now. Grey to the
  ears, and slower than he was." If you can't fill the slot, the entry gives a version that names no island.
- `line.folk.old-man-dead`, variants, for villagers after he is killed. The third line hints that the bears further out are worse.

## Changed

- `rumour.barlindey.old-man`: the id keeps its name, the lines are unchanged and name no island; `about` is now `beast.old-man`.
- `rumour.barlindey.yew`: line 2 changed in its place: "There's yew out on Barlindey, old trees. Older than the village."
- `place.barlindey`: the yew isle only; the bear is gone from it.
