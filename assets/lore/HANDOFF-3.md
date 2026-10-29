# Lore handoff 3: rumours, Kvennaey, Njörd (2026-10-17)

From the Lore Director to the Game Developer. Earlier handoffs are `HANDOFF-1.md` and `HANDOFF-2.md`. Everything listed here is
**canon** (Robin, 2026-10-17). The full record is in `canon/CHANGELOG.md`.

## Copy

`out/lore/lore.json` → `assets/lore/lore.json` (91 entries, canon and in-game). No line you already read has changed.

## The rumours: approved, and in lore.json

The first fourteen rumours are canon. They work like lines: an id, `lines` as variants, and `mode: variants`. They also carry:
- `tier`: whisper, lead or truth. Never show a truth before the player has seen the thing.
- `heard`: where, and from whom, in plain words.
- `when`: a condition, if there is one.
- `about`: the ids a rumour is about, so a quest can find "a lead about `place.kvennaey`".

`docs/integration.md`, "Rumours", has the format. How villagers or quests surface them is yours. The ids:

| Id | Tier | About |
| --- | --- | --- |
| `rumour.kvennaey.lonely-brother` | whisper | Kvennaey (Robin's own example) |
| `rumour.kvennaey.wrecks` | whisper | Kvennaey's beach of wrecks |
| `rumour.kvennaey.standing-water` | whisper | the drowned |
| `rumour.kvennaey.braid` | lead | Geirhild and the braided ship |
| `rumour.kvennaey.summer` | lead | the invited season |
| `rumour.kvennaey.thrall-ship` | truth | the island's beginning |
| `rumour.kvennaey.no-boys` | truth | the island's secret |
| `rumour.ormr.storm` | whisper | Ormr and the Serpent |
| `rumour.ormr.the-one-left` | lead | Ormr and Arnor |
| `rumour.troll-cave.old-man` | lead | Old Aslak and the troll's cave |
| `rumour.golden-boar` | whisper | the golden boar |
| `rumour.wanderer` | whisper | Odin the Wanderer |
| `rumour.odins-ring` | whisper | Odin's ring |
| `rumour.the-swell` | whisper | the Serpent's swell |

The Ormr, Aslak and boar rumours fit what the game has now. The Kvennaey ones are for later.

## Kvennaey: canon, for later (chapter 4)

**Robin's decisions:**
- **The island.** Skuld's Daughters (`family.skulds-daughters`): an island of women in the far west. Its bargain was made with
  Njörd. Every son is given to the sea, and the guests of a season are walked into the sea when it ends. The drowned
  (`being.noatun-drowned`) stand in the shallows among the wrecks, and rise against men, never against women.
- **First sight.** Only draugr and abandoned ships. Behind the beach is a lush island of wide fields and plenty.
- **The way in.** Men may land only in the invited season, generally summer, though it depends on how you handle seasons. The
  way is opened by a quest: a daughter, Geirhild Skuldardottir, is met on another island and marks Kvennaey on the chart.
- **Names.** Queen Skuld calls every woman daughter, and their surname is Skuldardottir.
- **The season's end** must be warned through lore. Robin will come back to how.
- **Ari**, a hidden son of sixteen, can be hired as a hirdman.
- **The rune Brimgr.** Draugr leave the one who carries it alone unless he strikes first, like your Wolf's run. Robin will come
  back to how it is learnt.

**Njörd is the god of the seas** (`god.njord`).

Robin asked the lore to focus on lore and leave the mechanics to you, so `place.kvennaey` holds only one short note on play.

Please reply with what you took.
