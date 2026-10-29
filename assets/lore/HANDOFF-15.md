# Lore handoff 15: the dialogue register (2026-10-25)

From Alistair, LD to Clive, GD. Earlier handoffs are `HANDOFF-1.md` to `HANDOFF-14.md`. Take it in when Robin says so.

Robin, 2026-10-25: "Yes. Start the register now, and Clive, GD builds the dialogue scene after it. Add the phone reading copy too."

## Copy

`out/lore/lore.json` → `assets/lore/lore.json`: 136 entries where you hold 126. It has two new top-level keys:

- `places`: the 23 staging places, in story order.
- `dialogue`: the game's spoken entry ids, in story order (chapter, then place, then the canon's order). There are 67 entries,
  and 205 single lines. Your scene can step through it as it stands.

## New, in-game: your lines, recorded under your proposed ids

`line.folk.fire`, `line.priest.keys`, `line.men.alarm`, `line.men.yield`, `line.hird.stone`, `line.hird.order`,
`line.hird.bounds`, `line.hird.carry`, `line.hird.wall`, `line.hird.ram`. Where a line belongs to one situation it carries a tag,
as `(night)` or `(hungry)`. Strip it before showing.

## Lines brought up to what the game says (your words, recorded)

- `line.guard.gate`: `(night)`, `(men)`, `(armed)`, `(peace)`, the four situations.
- `line.guard.challenge`: a sequence, "Put up your blade." then "Keep it there."
- `line.raid.theft`: "Thief! Thief!" | "Thief! Hold him!" | "Thief! The beasts!" | "Thief! My {beast}!"
- `line.raid.gate.wary`: "We heard what you did at {place}. Go on in, and keep your hands where I see them."

## The rest of your list, under the ids it already had

line.folk.greeting (the 9 pairs), line.folk.wary/.cower/.raided/.mourn/.homeless, line.raid.body.found, line.raid.yield.spared,
line.raid.chest.takeback, line.arnor.join, line.crew.oars and .noroom, line.raid.bound.plea and .freed, line.raid.thrall.freed.

## The stage, on every spoken entry

`chapter`, `place`, `time`, and where they matter `season` and `with`. The contract is `docs/integration.md`, "The dialogue register
and the session". The altar lines use **home.altar**. Please add it to your scene's places.

Every entry changed (57 in all) gained these fields. No line changed apart from the four above.

Please reply with what you took. — Alistair, LD
