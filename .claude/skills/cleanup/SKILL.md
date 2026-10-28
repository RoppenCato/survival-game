---
name: cleanup
description: The project cleanup Robin asks for ("do a cleanup", "time to declutter"). Archive what is no longer used, bring the documentation up to date with the game as it is, and go through every editor and test scene one by one to cut what is not needed and make sure each is in line and synced with the game. Use when Robin says cleanup, clean up, declutter or tidy the project.
---

# The cleanup

Robin's three parts (2026-10-26): **archive** what we don't use, **read the docs and update them**, **go through the editors one by
one** to remove what is not needed and keep them in line with the game. Work through all three without asking (Robin: keep going,
one report at the end), commit each part on its own and push. Deleting for good waits for Robin's word: the cleanup *moves* things to
an archive; git keeps the rest.

## 0. Before starting

- `git status`: commit or leave alone anything half done that is not yours; start from a clean tree.
- Read `CLAUDE.md` and `docs/state/*.md` whole, `docs/chapters.md` and the last cleanup's commit (`git log --grep="clean"`) so the cut follows the same lines.
- Note the date: every archived thing and every changed paragraph says when.

## 1. Archive what we no longer use

The places:
- **`docs/archive/`**: finished docs (a plan whose steps are all built and played, a trial whose verdicts are taken in, a proposal
  Robin turned down or replaced). A doc still waiting for Robin stays in `docs/`. Move it with `git mv`, and rewrite every reference to
  it (`grep -rn "<name>.md"` over `CLAUDE.md`, `docs/` (with `docs/state/`), `templates/`, `src/`, `tools/`, `tests/`).
- **`archive/`** at the repo's root (not served by the pages, never inlined by the build): code, tools, tests and assets no page or
  script uses any more, kept by path (`archive/tools/visual/x.js`, `archive/assets/sprites/x/`). A short `archive/README.md` lists
  each with the date and why.
- **`docs/pictures/`**: a picture no doc names goes to `docs/archive/pictures/`.

How to tell what is unused:
- A **tool or test script**: `grep -rn "<file name>"` over `package.json`, `CLAUDE.md`, `docs/`, `tests/README.md`, `tools/`,
  `templates/`. Run it once; one that throws on code that no longer exists, or checks a system that is gone, is archived.
- An **asset folder**: is it read by `tools/build.py` (`prop_images`, the HUD folders, the sprite sets, `sfx/keep.txt`), named in a
  template, or loaded by a script? A sprite set not in `Sprites.CAST`'s game or waiting groups, a prop folder whose pictures no code
  names, a HUD piece nothing draws: archive (big sets only on Robin's word, as `hero2-mixamo` was deleted on 2026-10-26; list them in the report).
- **Code in the pages** (`templates/*.html`, `src/*.js`): `node tools/unusedcheck.js` lists every function a page defines that nothing
  calls (run it again after removing: one removal can leave another unused); also a function nothing calls, a branch for a thing removed, a switch for a trial
  that is decided, a stub left after a rework. Remove it (git keeps it); never comment it out. After each removal, `npm run build`,
  `node tools/parsecheck.js`, `node tools/dupcheck.js`, and grep the name again across all pages (a page's script is one scope).
- **Saved settings**: a storage key no page reads any more is cleared once at start (as `game.look` was) or left; note which.
- **The root**: throwaway PNGs, logs Robin dropped (`errorlog.txt`, `framelog.txt`) once read.

## 2. Bring the documentation up to date

- **`CLAUDE.md` and `docs/state/` are the source of truth for how things stand now** (each system's detail in its `docs/state` file since 2026-10-27). Read it section by section against the code: every function,
  variable, file, number and key it names must exist and mean that (grep each one you doubt). Where the game changed, rewrite the
  paragraph to say how it is now (no dated paragraph appended below an old one; the story goes in commit messages and
  `docs/notes-archive.md`). Robin's decisions keep their "Robin, date" marks; mine keep "mine". Remove what describes something gone.
  Keep it to what is true now: long write-ups belong in `docs/`.
- **`docs/chapters.md`**: the status tables and the lists match what is built; what moved to another chapter is listed there.
- **Every doc in `docs/`**: its top says whether it is decided, a proposal waiting for Robin, or finished (then archive it). Update the
  parts the game has overtaken.
- **`tests/README.md`** lists every test that exists, what it prints and whether it is in `npm test`; `package.json`'s scripts match.
- **`docs/for-robin.md`**: questions answered are taken out; open ones stay.
- **The start page** (`templates/index.html`) and **`docs/state/pages.md`'s Pages table** list exactly the pages and scenes that exist.

## 3. The editors and test scenes, one by one

The list (from `docs/state/pages.md`'s Pages table; check it has not grown): the start page; the game's scenes (`?scene=battle`, `ruin`,
`mountain`, `models`, `dialogue`, `runes`); `combat-arena.html`; `art-editor.html` (Set pieces); `village-editor.html`;
`sea-editor.html`; `rune-browser.html`; `world-monsters.html`.

For each, open it in the pane with `?mute=1` at 1920 by 1080 and:
- **Errors:** none in the console or the page's error log after load and after pressing every row or button once
  (`Combat.api.debug().sceneRows()` and `.act(id)` press a scene's rows; a row that reloads the page, like the Destruction Editor's
  great places, is skipped). **A function a board calls that no longer exists throws only when pressed** (2026-10-26: the Mountain test's
  start and board had been lost for three days with the rune rework), so press them all, and start each scene fresh once (clear its own
  save, `game.save.<scene>`).
- **Its world:** a scene that needs a thing (a town, a church, a mountain) has it in the world it makes; a change to the world's
  making can take it away (2026-10-26: the sea as waters left the Battle and Destruction scenes with no town).
- **Stale controls:** a row, button, slider or switch for something the game no longer has or that Robin has decided (a trial whose
  pick is locked in, a mechanic reworked: the runes' blood rings, deeds, the old quiver) is removed or rewritten to the game's present
  rules. Its words name things as the game names them now.
- **In line with the game:** it draws with the game's code and numbers (the shared `src/` modules, the same sheets and pictures, the
  same look); a value it hands over with "Use in the game" is a key the game still reads (`grep` the key in `templates/game.html`),
  and a key the game reads has its editor. The editor's settings key changes if its meaning changed.
- **Lean (Robin):** every section folds, a row of choices is a drop-down, nothing is offered twice, no switch for a decided thing.
- **Layout:** the wide layout, nothing cut off at 1920 by 1080 or at the pane's size.
- Fix what is wrong in the template or `src/`, rebuild, check again. Take a picture only where the look changed.

## 4. Finish

- `npm run build`, `node tools/parsecheck.js`, `node tools/dupcheck.js`, `node tools/unusedcheck.js`, `npm test` (read the lines; `!!` and `BAD` are faults; the settlement
  test's known `!!` lines are noted, not new; a test that no longer plays as the game does is brought up to date, as `weapons.js`'s
  ranged shots were on 2026-10-26).
- The game itself: load it in the pane, walk a little, open Tab, the book (L and O), the map (M): no error.
- Commit each part separately (archive, docs, each editor or a group of small ones), every message saying what went and why; push.
- One report to Robin: what was archived (and where), what changed in the docs, what each editor lost or gained, what waits for his
  word (big deletions, decisions found open), in plain sentences.
