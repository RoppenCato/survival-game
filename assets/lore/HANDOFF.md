# Lore handoff 29: Robin's own words for Arnor (2026-11-13)

From Alistair, LD to Clive, GD. Earlier handoffs are `HANDOFF-1.md` to `HANDOFF-28.md`.

Robin rewrote Arnor's lines in the Sagabók's new "Rewrite Arnor's words" page. They are Robin's own words, now `canon`, each entry
with its before in the canon. The ids and the line positions are the same; every line is under 130 characters. lore.json: 210 entries.
The only edit of mine is a stray space ("Hello there ." to "Hello there.").

## For the game (Robin's notes, as written)

- **`line.arnor.wait.no-walls`** is now one line, from Robin's note on the meeting: "After this, let him say 'If you fix that house,
  we will have somewhere to stay the night.' when you talk to him over and over til house is fixed." Your `arnorLineId` already
  gives it from the meeting until the house is mended, so it should only need the new lore.json.
- **`line.arnor.wait.meat`** has three lines now, and an order, from Robin's note: "After this, let him say 'Please see if you can
  find us something to eat.' or number 2 every time you talk to him until a boar is slaughtered." So **line 1 the first time** after
  the roof is up, **then line 2 or line 3** every talk until the boar is slaughtered (like the deer's first line and its wait).
  How you do that is yours.
- **`line.arnor.graves`** is five lines now: Robin cut line 6.
- **`line.arnor.wait.no-hearth`** is two lines now: Robin cut line 3. (I don't think your `arnorLineId` uses it any more.)
- **`line.arnor.supper`** no longer says he'll see to the boat. `quest.arnor.deer`'s book_more and `quest.arnor.boat`'s book still
  say he did. I've asked Robin about it; nothing changes there until Robin answers.

## The lines as they now stand

### `line.arnor.meet` (sequence, 4 lines)

1. Hello there. Out of the sea, washed upon my beach.
2. I am Arnor. I was the smith, before our village was attacked.
3. I've salvaged what I could, but I am alone. He always leaves one alive. Someone has to tell the tale they say.
4. The house by the well still has its bones. If you help me get those planks up, there would be a place to sleep.

### `line.arnor.wait.no-walls` (variants, 1 line)

1. If you fix that house, we will have somewhere to stay the night.

### `line.arnor.wait.meat` (variants, 3 lines)

1. The roof is up again. Thank you traveler. Please see if you can find us something to eat.
2. Bring a boar to the table in the yard and we will both eat.
3. Please see if you can find us something to eat.

### `line.arnor.deer` (sequence, 2 lines)

1. Ah you found sinew from a boar. You could make a bow out of that at a workbench.
2. Catching a deer is hard, attacking from a distance makes it easier.

### `line.arnor.wait.deer` (variants, 3 lines)

1. You'll need a bow to catch those deer.
2. Downwind, and slow. They hear you before they see you.
3. Please bring me cooked meat of a deer.

### `line.arnor.supper` (variants, 1 line)

1. Thank you traveler. Once the night enters, feel free to sleep inside.

### `line.arnor.teach` (sequence, 3 lines)

1. That's a home again. This will be of great help come winter.
2. My boat's been broken down ever since the raid. I've mended her. She's yours.
3. Sail east. There you will find a village.

### `line.arnor.taught` (variants, 3 lines)

1. She pulls to the left. Lean right and she'll forgive you.
2. Tell them in the village you met Arnor. They'll know the rest.
3. I'll be here. Somebody has to keep the graves.

### `line.arnor.graves` (sequence, 5 lines)

1. Thorgunna. She wouldn't pay.
2. Her boys.
3. Grímhild kept the bees.
4. Thorkel built our boats.
5. I cut her runes myself. She'd have laughed at them.

### `line.arnor.wait.no-hearth` (variants, 2 lines)

1. A fire by the door. A roof with no fire near it is a cave.
2. We need a fire.
