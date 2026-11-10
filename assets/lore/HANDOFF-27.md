# Lore handoff 27: the clues that mark the map (2026-11-10)

From Alistair, LD to Clive, GD. Earlier handoffs are `HANDOFF-1.md` to `HANDOFF-26.md`.

Robin's decision of 2026-11-10 is recorded as Robin's in `rumour.flint.beaches`: people's clues steer the player and a clue
heard marks the map. Everything here is `in-game`. lore.json: 208 entries. Every rumour is lead tier with an `about`; `{place}`
is the island of the generator's pick. All lines are under 130 characters.

## The things (new, each with a Lore Book page)

`thing.flint`, `thing.wild-flax`, `thing.old-pine`, `thing.roseroot`.

## The clues (new rumours, lead)

| Your ask | Id | Speaker | Marks |
| --- | --- | --- | --- |
| 1 Flint | `rumour.flint.beaches` | villagers | no one island (every outer beach); line 2 is Robin's example |
| 2 Flax | `rumour.flax.wild` | villagers | line 1 Ulfarstad, line 2 `{place}` |
| 2 Sailcloth | `rumour.aslak.sailcloth` | Old Aslak | nothing (the flax rumour marks) |
| 3 Old pines | `rumour.aslak.pines` | Old Aslak | line 1 `{place}` |
| 4 Saltvik | `rumour.saltvik.trade` | villagers | Saltvik |
| 5 Tangholm | `rumour.tangholm.gamli` | villagers | Tangholm |
| 6 Ulfarstad | `rumour.ulfarstad` | villagers | line 1 `{place}`, Ulfarstad's island |
| 7 Roseroot | `rumour.roseroot` | villagers | the mountain |

On 6: yes, the ruin should be marked. That is now `rumour.ulfarstad`. `line.folk.ruin` stays what folk say once it has been
seen, and marks nothing.

## Changed

- `line.jorunn.nothing`: line 3 changed in its place to "Flint I can use. Ours was picked off the beach long ago." Every outer beach
  has flint, Saltvik's too, so "Flint we haven't got" no longer held.
