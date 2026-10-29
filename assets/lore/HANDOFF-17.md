# Lore handoff 17: chapter 0's quests, Arnor's boat, and Robin's new progression (2026-10-26)

From Alistair, LD to Clive, GD. Earlier handoffs are `HANDOFF-1.md` to `HANDOFF-16.md`. Take it in when Robin says so.

Robin, 2026-10-26, in my chat: Arnor's two quests and his boat lines, "Yes, as written"; and the blóts "Keep the Norse names".

## Copy

`out/lore/lore.json` → `assets/lore/lore.json`: 137 entries, as you hold, but two are new and two are gone.

## New: the first quests (a new kind, `quest`)

| Id | `book` (when given) | `book_more` (when done; `book_more_after: done`) |
| --- | --- | --- |
| `quest.arnor.house` | "Arnor has said I can sleep on the spare straw in his house by the well. It still has its bones, but it wants walls, a roof that keeps the weather out, and a fire by the door. He mends doors. The rest is mine." | "Arnor's house stands again. He walked round it twice and said nothing, which I think is thanks." |
| `quest.arnor.meat` | "Arnor hasn't eaten meat since the raid, I think. The deer come to the meadows at dusk, and a bow would reach them where my feet won't. Whatever I bring, he'll want it carried to the butcher's table behind the house." | "Arnor ate like a man who'd forgotten how. Then he went down to the shingle, to his boat." |

Each has `giver: person.arnor` and `chapter: chapter.1` (chapter 0). Key `when` to the game's own events.

## Lines the game reads: changed

- `line.arnor.teach` is now **Arnor giving his boat**, three lines in the same places: "That's a home again. First one here in two
  winters." / "My boat's been on the shingle since the raid. I've mended her. She's yours." / "East, then. After his sails." Its
  `when`: the house mended and the meat brought.
- `line.arnor.taught`, the first variant: "She pulls to the left. Lean right and she'll forgive you." The other two are unchanged.

## Gone

- `line.arnor.join`: Arnor does not join as the first hirdman.
- `thing.bronze-ring`: "We no longer have the armring."

## Changed text, no lines (Robin's 2026-10-26 decisions, recorded)

- **The chapters:** `chapter.1` is titled chapter 0, `chapter.2` chapter 1, `chapter.3` chapter 2; the ids are kept.
- **The trolls go north:** `being.bergtroll` and `being.harungen` are region north, chapter 2. `place.troll-cave` is "The wolves'
  cave (once the trolls')".
- **The ring goes:** noted in `thing.arm-ring`, `person.hogni`, `person.aslak`, `line.aslak.story`, `line.aslak.ring` and
  `rumour.troll-cave.old-man`. Aslak's lines still play until chapter 1's words come.
- **Arnor:** `person.arnor` records his house, his boat, and his later part as the first villager. `line.arnor.wait.no-zone` and
  `.no-bed` move to his building quest in chapter 1 (staged `chapter.2`).
- **The fisherman** teaches fishing. **The moose and the bear** are saved for later.
- **Blót, not rite:** the `line.year.*` entries are held at an altar, never a fire. `world.year` has the year's start, and the
  names Robin kept: **the first blót, the village's, ending summer, is the Haustblót; the second, at the hero's own altar,
  ending autumn, is Yule.** `line.year.opens` stays, but its board goes.

## Proposed, not in lore.json yet

The first two runes' cards: `line.rune.stone-biter` (ᛅ ár) and `line.rune.strong-back` (ᛘ maðr), keyed to your `stoneBiter` and
`strongBack`.

Please reply with what you took. — Alistair, LD
