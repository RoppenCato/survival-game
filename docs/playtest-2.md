# Playtest 2: chapter 1, from the wreck to the raft (2026-10-20)

Robin plays chapter 1 from a new game to leaving on the raft, about 45 to 60 minutes, and reports **the three things that feel
worst in each of the six areas** (`docs/chapters.md`). Everything below is only so nothing is forgotten; your own words matter
more than the list.

## Where

- **The game:** http://localhost:8765/dist/game.html (the workbench server must be running). Start a **new game** (Escape, then
  Restart): the steading's new look, the new hero and the bar from the start only show in a new game.
- **The Combat Arena:** http://localhost:8765/dist/combat-arena.html, for the fight on its own and the sound picks.
- Sound on (no `?mute=1`); the music bar is in the Escape menu, off until you turn it up.

## In the game, in the order you meet it

1. **The start:** the name board, the wreck, the bar visible from the first second, the key reminders.
2. **The new hero:** how he looks in the cream tunic; later, in the leather set and a helmet (his face should show under it).
3. **Gathering:** fell a tree (the notch, then the back cut, the trunk into logs), crack a rock, pull grass (the tuft goes),
   pick berries, kick a crate open with E.
4. **The steading:** the burnt-out hall, Arnor, the graves; mend the plank house; the first night with the wolves and the fire;
   sleep under the roof.
5. **Fighting:** young boars with the club, then the flint sword; the guard on K (a parry right as a blow lands); wolves at
   night; a deer with the bow. **Your blows now start the moment you press**: does it feel snappy, or too fast?
6. **Menus and crafting:** Tab (the list on the left, the thing beside it), E at the fire and the workbench, the Building board
   (B). Whatever felt "off" about crafting last time: is it still?
7. **The interface:** the notices, the speech at the foot of the screen, the map (M).
8. **Day and night:** how the dusk falls and how dark the night is. In the Escape menu, Admin, the Light and sound board: try
   the four you have not seen (moon, mist, light shafts, clouds).
9. **The raft:** the shipwright's bench, the raft, Arnor at the shore, leaving.

## In the Combat Arena

- **The hit sound:** The sounds panel, the hit row: try I, J, K, L and V and pick one (the reference was Valheim's sharp
  fleshy slap).
- **The sword:** fight a man or two with the sword and judge the swing. (The sword takes its pace from an old table, not from
  your tuning of 10-15; tell me whether to switch it to your numbers.)

## Questions to answer while you play

1. The swoosh: should every swing draw a quick arc over the blow, to make it hit harder?
2. The helmets by material (leather, wool, fur, bronze, iron, gold): is that order of tiers right?
3. The music: on at about a third of the bar by default, or off as now?
4. Wednesday's Fable session: work through what you find here, or the new-seas plan?

## Sending the logs

Escape, Admin: download the error log and the frame log, and put both in the project folder.

## Robin's report (2026-10-20), sorted

**Mine, now** (bugs and small changes, in the order I take them; **done 2026-10-20** unless marked):
1. The character panel's Gear page draws the hero as a row of broken pieces (the new kit drawn by the old path).
2. Text runs out of its box on the Stats page (the guard line).
3. The panel's tabs overlap the name: move them to the left side.
4. Shift and drag on the toolbar to move or remove things.
5. The placement ghost in build mode hides behind things: draw it in front.
6. The Building board on the starter island holds only what the house and the raft need (no shield rack and the like).
7. No beasts in the first village (the steading): they keep a distance from it.
8. No charcoal on the starter island (nothing there uses it): the old fire rings and the morning embers there give none.
9. The idle of the hero and Arnor fades in and out "like a drunken thing": the blend between frames made smooth.
10. Blocking without a shield raises the other arm: now the weapon comes up across the face (the studio's `block_wpn`, and `block_wpn_walk` while walking).
11. "Step ashore" shows far from the shore.
12. Leaving the island seems to give every recipe and the arm ring: **not reproduced** (a clean crossing only marks the island left and owes one rune, kept until a ring is worn); a question for Robin.

Also done: beasts start at least 500 units from the steading's middle and 300 from any village (measured 679); "Step ashore" only with land in reach; the blend between frames draws the first whole and lays the next over it (it added two half-see-through pictures); the shield-arm block only with a shield (the studio's weapon block, `block_wpn`, is on its way).

**Bigger, mine, later** (each its own piece of work):
- The roof built by hand, not by itself, with a message and a red mark where a wall is missing.
- The sea looks boring and static when sailing.
- The shipyard and shipbuilding reworked (chapter 2).
- The tree's fall and the logs that shrink as they break: with the studio's new trees.

**The Sound Director** (each from a reference Robin likes): the hit on a tree, a tree falling, the club's hit ("awful"), the
block, a box opening ("something wooden breaking, a nice snappy comforting sound"), the ambient sea ("more like a noise").
**First candidates in the arena (2026-10-20),** from the free packs Robin chose: The sounds panel, the Choose rows for the hit on
a tree, the rock, a tree falling, a log coming off, a box breaking, the block, the club's hit and heavy hit, and a wave: the free
packs' A to C and the studio's layered V in each. The wave on the shore plays the studio's recorded V by default (mine).

**The Art Director:** the character panel, the bag and the crafting board in the art direction (the panel's gear icons too
cramped, plain and ugly; **the rendered icons for what is worn are in, 2026-10-20**; three directions for the panels shown to Robin); a block with the weapon raised for when no shield is worn; the trees (already in its plan).
