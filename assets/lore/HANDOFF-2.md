# Lore handoff 2: Skargard, the gods, Odin's ring (2026-10-16)

From the Lore Director to the Game Developer. Handoff 1 is kept as `HANDOFF-1.md`. Everything under "Canon" was decided by
Robin on 2026-10-16. The full record is `canon/CHANGELOG.md`.

## Copy

`out/lore/lore.json` → `assets/lore/lore.json` (67 entries: canon and in-game). No line ids you read have changed words. The
four `line.brokk.*` entries are now `retired` (you already speak `line.arnor.*`), so they are no longer in the file.

## Canon

1. **The realm is Skargard** (`world.realm`): Robin's name, from *skärgård*, archipelago. It is a part of Midgard, not
   Midgard itself. Use it wherever the game names the world (a title, the map, a banner). Folk say "Skargard".
2. **The gods can appear, but mostly in the background** (`world.faith`), like Odin walking among people in disguise. They
   are never named and never bosses, and they are gone by morning. Jörmungandr is seen. Robin has "ideas of sacrificing
   things or other ways to call upon the gods, for gameplay reasons". The lore's ideas for that are below, as proposals.
3. **The most powerful ring was forged by Odin himself** (`thing.odins-ring`): the dragon ring at the top of the ring ladder.
   Rings are crafted or inherited. Its name and where it is now are still proposals.

## Recorded from your handoff 1 work (thank you)

- In-game, your words, marked `LORE?` in your code: `line.arnor.riposte` and `line.arnor.join`. My proposals sit beside them
  for Robin. I recommend keeping the joining line as it is.
- "Thorgunnastead" for the first claimed place: recorded in `place.burnt-steading`. Proposed: "Thorgunnastad".
- The name board's dice: recorded in `names.game`. Halfdan and Eyvind collide with proposed fixed people. Nothing to do until
  Robin decides the name pools.
- TRUE IN PLAY: "Ormr's raiders leave one alive; Arnor is that one", recorded in `person.ormr`.

## For reading, not building: ideas Robin asked for

These are **proposed**. Read them for design talk with Robin. Do not build them until Robin says so.

- `world.offerings`: what each god takes, where, the sign it was taken, and what folk believe it brings. Ideas: an altar
  piece, the feast's cups, a yearly seeress. Reward, never punishment.
- `god.odin`, "The Wanderer": a one-eyed stranger at the hero's fire at dusk, once in a long while. A guest treated well
  leaves something behind; a guest turned away leaves nothing.
- `thing.ringsmiths` and the ring legends (`thing.draupnir`, `thing.andvaranaut`, `thing.volunds-rings`, `thing.sviagris`):
  who can make each rank of ring, and famous rings that could be found.

Please reply with what you took.
