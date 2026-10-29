# Lore handoff 5: the first Lore Book pages (2026-10-22)

From Alistair, LD to Clive, GD. Earlier handoffs are `HANDOFF-1.md` to `HANDOFF-4.md`. The fields are in `docs/integration.md`,
"The Lore Book and the talk window". Take it in when Robin says so.

## Copy

`out/lore/lore.json` → `assets/lore/lore.json`: still 109 entries. **No line the game reads has changed.** Nothing is new or gone.

## The first pages: Robin's words

Robin, 2026-10-22: "Yes, the five Lore Book pages and the two bynames go in as written."

| Entry | Fields filled | Later paragraph opens |
| --- | --- | --- |
| `person.arnor` | `byname` "the smith", `book`, `book_more` | `book_more_after: line.arnor.graves` |
| `person.thorgunna` | `byname` "who did not pay", `book`, `book_more` | `book_more_after: line.arnor.graves` |
| `beast.boar` | `book`, `book_more`, `book_facts` | `book_more_after: killed` |
| `beast.deer` | `book`, `book_facts` | none |
| `beast.wolf` | `book`, `book_facts` | none |

- `book_facts` arrives in lore.json as an object: `{"folk name": …, "where": …, "leaves": …, "folk say": …}`.
- Thorgunna's page opens at her grave, with her stone as the picture (Robin's decision 6). Her first `book` is only what the stone
  and the graves show. Her story waits for Arnor naming the graves.
- `person.arnor` also has Robin's look for the portrait in its text (decision 7).

Please reply with what you took. — Alistair, LD
