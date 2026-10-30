# Finishing chapters: checks, the dev version and the alpha

Robin's rules (2026-10-29 and 2026-10-30). The rest of this file is mine, and Robin accepted it on 2026-10-30 ("Set it up").

> "I think we need to be better at finishing a chapter. [...] I think its best the basics are done right first."
>
> "If there are changes to a chapter before its complete, thats ok, its just that it needs additional checks. Also, if a chapter
> that is "done" gets additions or changes, it needs to be moved to "not done". Only checked features gets put in the alpha."

## The basics of a chapter

A chapter is finished when all three of these hold:

1. **Its path plays from start to end.** For chapter 0 that is the wreck to the boat leaving.
2. **Robin's six areas are done for what the chapter shows** (Robin, 2026-10-20): models and art; combat and gathering; menus and
   crafting; the interface; music, sound and effects; the day and night.
3. **The foundations hold at every step:**
   - save and load work;
   - no errors in the error log;
   - a steady frame rate;
   - the controls work;
   - nothing of a later chapter leaks in.

## The checklist

Each chapter has one list: `docs/chapter-0-checklist.md`, and later `chapter-1-checklist.md` and so on. Every item names what to try
and has one of four states:

| State | Meaning |
| --- | --- |
| **To fix** | Something is wrong or missing. What is wrong is written beside it. |
| **Built** | I (Clive, GD) built it and tested it by script, bot or the pane. Robin has not yet said yes. |
| **Checked** | Robin played it and said yes. Write down the date. |
| **Open** | A choice that waits on Robin. |

The rules (Robin's):

- **A change to an item moves it back to Built.** This includes a fix, a tuning and new words, before or after the chapter is
  complete. Robin checks it again, and the item notes what changed. Changes before a chapter is complete are fine; they only need
  the extra check.
- **A chapter is Done when every item is Checked.** Its list says Done with the date, and `docs/chapters.md` says so too.
- **A Done chapter that gets an addition or a change goes back to Not done.** The changed or new items go to Built, and the chapter
  waits for Robin's checks again. The alpha keeps the version it had until then (see below).
- New ideas for a chapter go to `docs/idea-bank.md` or to a later chapter. They do not go into the list unless Robin says so.

## Two versions online

The workflow is `.github/workflows/pages.yml`. The site is https://roppencato.github.io/survival-game/: a start page with both
versions.

**`/dev/`, the dev version.**
- What it is: main's `release/` build (the game alone, no Admin), with main's assets.
- What it holds: everything as it is being made, unchecked chapters too.
- When it changes: it is published on every push to main.
- `RELEASE.json` on main says `"version": "dev 0.x"` and `"chapter": null`, so there is no cap.

**`/alpha/`, the alpha.**
- What it is: the `alpha` branch, with its own copy of the assets it was made with. Its save is its own (`skargard.alpha.save`).
- What it holds: only checked chapters. Robin: "Only checked features gets put in the alpha".
- When it changes: only when a chapter, or a recheck of one, is Checked through. It is published when that branch is pushed.
- Its `RELEASE.json` names the alpha and its last chapter, for example `"version": "alpha 0.6"` and `"chapter": 0`.
- **The chapter cap:** with `"chapter": 0` the sea a little off the starter island turns the boat back (`capTick`), and the
  map's lettering says "The end of the alpha".
- **Until chapter 0 is Done there is no alpha branch**, and `/alpha/` says the alpha comes when chapter 0 is checked.

**To make an alpha**, once every item of a chapter is Checked:

1. On main, set `RELEASE.json` to the alpha's version, its notes and `"chapter"` (the last Done chapter).
2. Build, then commit.
3. Run `git push origin HEAD:alpha`.
4. Set `RELEASE.json` back to `"dev 0.x"` and `"chapter": null`, then commit and push main.

For a later alpha the same steps apply, from a main whose later chapter is Done.

- **Fixes to a Done chapter** reach the alpha only after Robin checks them; then the same steps make a new alpha.
- **Work on the next chapter** must not leak into the chapter in the alpha. The cap stops the boat. Anything new that shows on the
  starter island moves the chapter back to Not done (Robin's rule above).

**The size:** GitHub Pages takes about 1 GB, and two copies of the assets are about 1.1 GB. When the first alpha is made, check the
size the workflow prints (`du -sh`). If it is too big, trim the alpha's copy to the files its pages load.

The old `stable` branch is no longer published. The old link `release/index.html` is gone, and the start page has taken its place.
