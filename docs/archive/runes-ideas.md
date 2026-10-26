# The runes: ideas for the overhaul

Robin, 2026-10-06: "revisit the perk system (runes) ... overhaul the interface and declutter ... maybe the runes in
categories on different tabs, and selecting one makes it glow. There must be some indication." These are ideas to run
through Robin, not decisions. What exists today: thirteen runes in five kinds (attack, guard, mobility, utility, hird),
learnt from deeds and runestones, a casting cloth (C) with a pouch of learnt runes on the left and a board of hollows on
the right, stones dragged into hollows, tiers by use (common, carved at 50 uses, legendary at 200). It is hidden
(`SHOW.runes`) because the cloth is cluttered and nothing tells you what is chosen.

## What the good ones do

- **Valheim (skills):** no choices at all; a skill grows by doing. Clean, but there is nothing to decide. Our deeds are
  this already (fifteen trees, five meals). Keep deeds as the way a rune is *found*, not as the whole system.
- **Hades (boons):** a few offers at a time, each a card with one line and a rarity colour; the chosen one glows and is
  listed in one place. The lesson: show few things, say one line each, and make the chosen one unmistakable.
- **Dead Cells (mutations):** three slots, chosen at a quiet place, the slots always visible on the HUD, and the choice
  can be remade at the next quiet place. The lesson: few slots, a calm place to choose, no choosing in a fight.
- **Diablo 2 / Grim Dawn (trees):** depth through investment; too much for us, and it needs a wall of text.
- **Stardew Valley (professions):** one choice at a few levels, two options, a picture each. Simple and memorable.
- **Breath of the Wild (shrines, Divine Beast powers):** powers earned from places in the world, each a short rite with a
  glow and a sound. Our runestones are this: reading a stone should feel like a small rite.

## The proposal

**One board, three tabs, one glow.** The casting cloth becomes a plain leather board with three tabs along the top:
**Fight** (attack and guard), **Body** (mobility and utility), **Hird** (the band). Each tab is a single row of stone
cards: the runes of that kind, learnt ones carved and lit, unlearnt ones faint with how they are found in one line
("Fell fifteen trees", "Read the stone on the north cape"). No pouch, no hollows, no dragging.

**Slots are on the board's bottom edge:** three hollows (attack, guard, body) and later a fourth for the hird. Click a
carved rune to set it in the hollow of its kind; it **glows** (a warm pulse round the stone, the hollow lit, a short
chime) and the one it replaced goes dark. The same glow sits on the hotbar for an attack rune, so you always see what
is set without opening anything.

**One line each.** A rune card says its name, its Norse name small, one line of what it does, and its tier as a border
(plain, carved, gilt). Hovering says the numbers. Nothing else.

**Tiers stay as use**, but shown as the border, never as text in the way. A rune that just rose in tier glows gold for a
moment and the toast says so.

**A quiet place to choose.** Runes are set at a fire or a runestone, not in a fight (as now). Opening the board in the
open just shows it; the hollows are grey and say "Sit by a fire".

**Fewer, clearer runes at first.** Hide the ones that are not finished; six or eight good ones beat thirteen. Each
kind should have one obvious first rune so the first choice is easy: Fight: Hard swing. Body: Sure feet. Hird: Muster.

**Finding a rune is the event, not the board.** A runestone read for the first time: the screen dims, the stone's rune
glows red in its grooves, a low sound, the name appears, then the board opens on that rune. A deed completed: the same
but over the hero. That is the "indication" Robin asks for, and it makes the board itself quiet.

## Questions for Robin

1. Three tabs (Fight, Body, Hird) or the five kinds as they are?
2. Should attack runes stay castable (whirlwind, bash, pin on the number keys), or should every rune be passive and the
   board only about what you carry? Castable ones are more work to balance but more fun to find.
3. One hollow per kind, or a free row of three where any rune can sit?
4. Keep the tiers by use, or drop tiers and keep runes single-strength to stay clean?
5. Where does the board live: C as now, a tab on the Tab panel, or only at a fire?

Nothing here is built. When Robin has answered, the board (`drawCloth`, `clothDown`) and `SHOW.runes` are the places.
