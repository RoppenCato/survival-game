# Conversation windows with portraits, and the Lore Book

**Decided by Robin, 2026-10-22: yes to decisions 1 to 7 and 9 below; the portraits' style (8) and whether hands come into the crop he settles with Colin, AD.** It was a proposal (2026-10-22). Robin's brief, the same day, with a picture of the idea (a bust on the left, the
name and the words on a board beside it):

- Conversation windows with a character's picture, for **important characters only** (quests, the people who matter), never
  for random villagers. **The first to try it on is Arnor.**
- The pictures are **separate 2D art, plain and "more good looking"**: still the art direction, but more detailed and prettier.
- **The same picture is in a Lore Book** the player carries, which opens pages on the characters, creatures and so on he has
  met: more about them, but simple and easy to read.
- Divide the work well. The Art Director does the art, **with templates and a workplan for every new portrait** so they stay
  coherent. The Lore Director writes what the book says? How does the game fetch it from the lore? **Even a character with a
  long backstory shows only a little in the book**, so it never gets cluttered.

This page is the Game Developer's (Clive, GD) first proposal, to be discussed with Colin, AD and Alistair, LD before Robin
decides. What each of them adds is at the end.

## What exists today

- **The speech board** (`drawSpeech`): a small parchment strip at the foot of the screen with the speaker's name and his line,
  shown while you are within hearing (`HEAR` 130 units). Everyone uses it: Arnor, Old Aslak, the villagers, carved words.
- **Talk** follows the lore's modes (a story told a line a press, remarks one a talk). Arnor's and Aslak's lines are the Lore
  Director's (`loreLines`), keyed `line.arnor.*` and so on.
- **The Book of Beasts** (`BESTIARY`, L, hidden: `SHOW.book` false): a page a beast once you have killed one, with my own
  in-game words (folk name, where, lore, strengths, weaknesses, its tell, drops) and a drawn figure. Never shown to Robin.
- **The lore** (`lore.json`): every person, being, beast, place and thing has an `id` (`person.arnor`), a `title`, a
  `summary` (a sentence) and a `body` (the full story, long). Today the build takes only `lines` from it.

## The proposal (mine)

### 1. One id ties the three together

The lore id is the key everywhere: `person.arnor` is the lore entry, the portrait `assets/portraits/person.arnor.png` (and its
moods, `person.arnor_grim.png`), and the book's page. Nobody keeps a second list.

### 2. The conversation window

- **Who gets one:** a lore entry with a portrait. Its having a portrait is what makes it "important": no flag to keep in step.
  Everyone else keeps the speech board, as today.
- **When:** when you **Talk** to that person (E). What he says on his own while you pass (Arnor naming what your home lacks
  while you build, a remark called out) stays on the small board, so the window never pops up uninvited.
- **What it is:** the portrait at the left, standing a little over the board's top edge as in Robin's picture; the name on the
  HUD's plaque; the line in Alegreya on vellum, in the HUD's oak and gilt (the panels' look, not the picture's outlining); a
  small cue when there is more to say. Low on the screen, so the world and the speaker stay in view.
- **How it plays:** the hero stands while it is open (as at a crafting board); E (or a click) gives the next line of a story,
  and closes it after the last; walking off, Esc or a blow taken closes it. **The world does not pause** (it never does).
  A remark shows once and closes on E or after its time.
- **Moods (later):** one portrait a person first. A line may name a mood (`grim`, `glad`) when the art for it exists; until
  then the plain one shows.

### 3. The Lore Book

- **One book for everything the hero has met**, replacing the hidden Book of Beasts: tabs for **People**, **Creatures** (beasts,
  trolls, väsen) and later **Places**. L opens it, as now.
- **A page appears when you first meet the thing**: a person when you first talk to him, a creature when you first see it up
  close (or fight it), a place when you first stand in it. The game decides when; nothing tells you a page is coming (Robin's
  rule: guidance is subtle). A new page shows a small mark on the book's tab, nothing more.
- **A page:** the portrait (people) or the creature's picture, the name (and its Norse form), then **the book text: three to
  five short sentences**, plain words, the hero's or folk's knowledge, never a quest log. Perhaps a line or two of facts under
  it (where met; for a creature where it lives and what it leaves).
- **More can open later on the same page** as you learn more (a second paragraph after Arnor tells his story; a creature's
  page after you have killed one): the book grows with the deeds, and stays short.

### 4. How the game fetches it from the lore (the build, as today)

The Lore Director adds to an entry, in `canon/`, the fields the game shows; the build inlines only those, never `body`:

| Field | What | Who |
| --- | --- | --- |
| `book` | the page's text, three to five short sentences, at most about 60 words | Alistair, LD |
| `book_more` | what opens later, one paragraph each, with the condition it opens on (`after: line.arnor.story`, `after: killed`) | Alistair, LD |
| `book_facts` | for a creature: where, what it leaves (short phrases) | Alistair, LD (the numbers stay mine) |
| `portrait` | `true` when the art exists (or the mood list) | set when Colin, AD delivers |

The book's order, its tabs and when a page opens are mine (play). What a page says is the lore's (story, beliefs). The Book of
Beasts' practical lines today (strengths, weaknesses, the tell) are mine and go, unless Robin wants them (below).

### 5. The pictures (Colin, AD)

A template so every portrait matches: the same crop (head and shoulders, a little of the hands as in Robin's picture), the same
angle (three-quarter, facing right, toward the words), the same size and pixels a unit for the HUD at Robin's size, the light
from the upper left, the palette and line of the art direction made finer, and the plain background the window fills. A
workplan for a new character: what the studio needs from the lore (look, age, clothes, colours, one telling detail), the steps,
the checks (beside the others in a row; at Robin's size in the window). Arnor first, then Old Aslak.

## What I ask of the others

- **Colin, AD:** your view of the window's look (a mock at Robin's size with Arnor would let Robin judge it), the portrait
  template and workplan, a page of the book in the HUD's clothes, and what you need from the lore and from me.
- **Alistair, LD:** your view of the fields above (`book`, `book_more`, `book_facts`), the length, who the first important
  people are (Arnor, Old Aslak, who else in chapter 1?), and what a portrait needs from the lore (a short look: face, age,
  clothes).
- **Derek, SD (small):** a sound for the window opening and the book's page turning, from a reference Robin likes.

## What the others said

**Derek, SD** (2026-10-22): small, quiet sounds, 12 to 18 dB under a hit, short, in three or four variations where they repeat.
- **Opening the window:** soft vellum or leather, under 300 ms. Or nothing, letting the first line be the event.
- **The next line:** the one that matters, heard twenty times in a story. Under 80 ms, very soft, varied, a page's tick rather
  than a click.
- **Closing the window:** silent.
- **The book:** opening and shutting as a leather cover and heavy vellum, and a page turning in three or four variations.
- **A new page:** no sound (subtle guidance).
- **References** Robin can pick in an arena row, with no download: Kenney's RPG Audio (CC0, already downloaded) has the book's
  open, close, flips and places, and cloth and leather handles for the window. Derek, SD would then trim, vary and level the picks.
- **A voice:**
  - A: none (his choice for chapter 1, as MapleStory's talk).
  - B: later, one short wordless sound a line ("hm", "ja", a sigh), from real voices, ideally Robin's or a friend's.
  - C: per-letter blips (Animal Crossing). He advises against them: they tire and pull away from the meadow's warmth. He can
    render a ten-second sample on Arnor's line for Robin to judge.
- **Robin's decision (2026-10-22, through Derek, SD): A.** No voice murmur and no blips: the talk window is silent but for the
  window's and the pages' sounds. Next on that side: a row of the Kenney candidates in the arena's The sounds panel, for Robin to
  pick by ear.

**Alistair, LD** (2026-10-22; his full view is `C:\dev\SG\Lore Director\docs\lore-book.md`): the fields, yes, with four
refinements.
- **Only Robin's words go in the book fields.** A page is first a proposed paragraph in the entry's body, moved into `book` on
  Robin's yes, as the lines are.
- **The condition has its own field:** `book_more_after`, in plain words, keyed by the Game Developer as he keys a line's `when`.
- **One `book_more` a page at most.** More belongs in a line or a rumour.
- **The voice** is what the hero has seen and what folk say: never "you must", a goal or a game word. A secret waits behind
  `book_more`'s condition. Names in the game's spelling, the Norse under them.
- **Length:** `book` three sentences, about 40 words, never over 60; `book_more` at most 40.
- **Creatures:** `book_facts` holds the folk name, where it lives, what it leaves (things, not numbers), and one "Folk say": the
  tell told as belief. He would drop the strengths and weaknesses, which read as a manual.
- **The dead:** someone met only through a grave gets a page with the stone as its picture. Someone only heard of, such as Ormr,
  gets no page until met.
- **Chapter 1:** Arnor is its only living person, so **only Arnor gets a portrait and the window in chapter 1**. Two pages need no
  window: Thorgunna, opened at her grave with her stone as the picture, and the golden boar, if glimpsed, one line. Then the first
  night's beasts. Old Aslak is chapter 2's first, then Kolbein and the jarl of home water.
- **What a portrait needs from the lore:** who he is in a line; age and build; two features of the face; hair and beard; clothes
  by rank, real to the age (a thrall in undyed wool and cropped hair, a free man with one dyed colour, a jarl in silk and rings);
  two or three colours; one telling detail; the mood in a word and what the face must never show; references from the boards.
- **Arnor's look, drafted** (proposed: Robin has not approved it): about forty, short and broad, a singed beard going grey, a
  scorched leather apron, burn-scarred forearms, a hammer with a mended haft; tired and dry, watching you, never heroic. The
  reference is Kittelsen's *Charcoal Burner* and the game's own sheet of him.

**Colin, AD** (2026-10-22; the window's and the book's mocks and Arnor's portrait follow): agrees with the proposal.
- **The window at 1200 by 750:**
  - **The board:** low and centred, 960 by 150 (x 120 to 1080, y 585 to 735), in the HUD's oak and frame, solid.
  - **The bust:** 240 by 288 at its left, the head rising about 140 over the board's top edge. The board's bottom rail is drawn
    again over the bust's straight bottom cut.
  - **The name:** on a plaque, its first letter rubric red, the Norse form after it in small sepia italic.
  - **The line:** on a vellum card in Alegreya 17, at most three lines, a small gilt "E" when there is more.
  - **The rest:** the hotbar hidden while it is open, and the world not dimmed.
- **The portrait template:**
  - **Crop:** head and shoulders to mid-chest, the head 43% of the height and the eyes a third down, the same for everyone.
  - **Angle:** three-quarter, facing right toward the words.
  - **Size:** drawn in code from one kit at 1000 by 1200, delivered at 480 by 576, shown at 240 by 288 in the window and about
    200 by 240 in the book, with a round face crop for the book's list.
  - **Light:** from the upper left, the shade cooler and bluer.
  - **Line:** ink `#2a1f1a`, the figures' rule made finer: a contour about 2 px, heavier to the lower right; inner lines only
    where they tell.
  - **Colour:** the person's own colours from his sprite (Arnor: hair `#4a3428`, coat `#5d4a3a`) and one warm accent.
  - **Finish:** watercolour, with more detail in the face than a sprite but silhouette first.
  - **Background:** none.
  - **Moods:** one plain first; later the same drawing with the brows, eyes and mouth changed.
- **The workplan for a new character:**
  1. A five- or six-line "look" from Alistair, LD, and the lore id and the sprite's look spec from Clive, GD.
  2. The one thing of his silhouette.
  3. Drawn on the template with the kit.
  4. The checks: in the window over a real frame at Robin's size, in a row with the others, in grey, at the book's size, and
     against the art direction.
  5. `assets/portraits/person.<name>.png` delivered with its master script, thumbnail and HANDOFF.
  6. Logged.
- **The book:** a spread over most of the screen, oak with two vellum pages and the tabs down its left edge.
  - **The left page:** medallions with names of what you have met in that tab; a new one marked; nothing unmet shown.
  - **The right page:** the chosen entry, its picture in a plate frame, the name with its red capital and the Norse form,
    Alistair, LD's sentences, the facts under a rule in small sepia italic, and the later paragraph below.
- **Two questions to the Game Developer:**
  - May the hotbar hide while the window is open? (Mine: yes; the hero stands anyway.)
  - May the book cover the middle of the screen? (Robin's: the crafting board's rule kept the middle clear.)

## Decisions for Robin

**Robin, 2026-10-22: "yes for your decisions 1-9. Regarding the art, i will discuss that with AD".** Each was my recommendation; the studios' views are above.

1. **The plan as a whole:**
   - a window on Talk for important people only;
   - one Lore Book (L) with People, Creatures and later Places, replacing the hidden Book of Beasts;
   - the lore id as the key for the entry, the picture and the page.
   *Yes.*
2. **Who is important:** whoever has a portrait. In chapter 1 that is Arnor alone; in chapter 2 Old Aslak, Kolbein, then the
   jarl. *Yes.*
3. **How the window plays:** the hero stands; E for the next line; walking off, Esc or a blow closes it; the world does not pause;
   the hotbar hides while it is open. *Yes.*
4. **The creatures' pages:** the folk name, where it lives, what it leaves, and one "folk say" (the tell as belief). The
   strengths and weaknesses go, as they read like a manual. *Drop them.*
5. **The book may cover the middle of the screen** (opened on purpose with L; it closes if you are struck). *Yes.*
6. **The dead and the unmet:** someone met only at a grave (Thorgunna) gets a page with the stone as its picture; someone only
   heard of (Ormr) has no page and no empty place until met. *Yes, no empty places.*
7. **Arnor's look** as Alistair, LD drafted it, for Colin, AD to draw from: about forty, short and broad, a singed beard going
   grey, a scorched leather apron, burn-scarred forearms, a hammer with a mended haft; tired, dry, watching you, never heroic.
   *Yes.*
8. **The portrait template** (watercolour, three-quarter facing right, no background, one plain portrait first, moods later):
   judge it on Colin, AD's mock, on its way.
9. **The order of work:**
   - Colin, AD: Arnor's portrait and the template;
   - Alistair, LD: the book texts for Arnor, Thorgunna and the first beasts, for Robin's yes;
   - Clive, GD: the window in the game on Arnor, then the book;
   - Derek, SD: a row of sound candidates in the arena for Robin to pick by ear.
   *Yes.*
