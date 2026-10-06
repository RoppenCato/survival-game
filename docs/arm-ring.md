# The arm ring: what the runes became

Decided with Robin, 2026-10-06. This replaces the casting cloth, the pouch and the hollows (`docs/runes-ideas.md` was the
discussion). Runes are **knowledge you unlock**, never items; they take no space. What you *know* does nothing until it is
**cut into your arm ring and reddened with your blood** at the **carver's bench**. That is the whole system, and it is
historical: every Viking wore arm rings, jarls gave them to their men, oaths were sworn on them, and in Egil's saga runes
cut and reddened with blood had power. The game never explains any of it.

## The ring

- **Coils.** A ring is a twisted band of coils. A coil holds one rune. Each coil belongs to a **side** of the ring:
  the **hand** (fight: skills, attacks, weapon runes), the **foot** (movement), the **eye** (work: how you chop, mine,
  fish, hunt), the **heart** (endurance and the hird). Coils are bound to their side, so "two coils" means one fight rune
  and one movement rune, and a new side opening reads as a story.
- **The metal is the rank.** Five words anyone can order: **bronze, silver, twisted silver, gold, dragon**. The metal says
  which biome a Viking has mastered, the coils how far into it. Every figure in the world wears its ring on the arm and is
  named by it in speech ("Ragnar of the gold ring"); your own ring sits on the panel beside theirs when you meet. The rule a
  player learns in a minute: a heavier metal beats you. The **curveballs** keep it from going stale: a jarl with silver and
  one legendary rune, a thrall with gold under his sleeve, a ring only worn by whoever kills its owner, a cursed ring that
  gives a strong rune and takes a coil forever.
- **Growth** comes only from biome progression, in different ways each time, never from a count:

| Ring | Coils | Sides open | Where it comes from |
| --- | --- | --- | --- |
| Bronze | 2 | hand, foot | the dead Viking at the back of the troll's cave, first big island |
| Silver | 3 | + eye | a jarl or hoard of the second biome (the raid) |
| Twisted silver | 4 | + heart | later biomes |
| Gold | 6 | two per side | the hall in the south |
| Dragon | 8 | two per side | the thing the legends are about |

## Cutting and changing

- **The carver's bench** is a buildable piece for the big island (wood, stone, copper): a graver, a file, a bowl. E at it
  opens the ring board: left, the runes you know, in tabs by side (Hand, Foot, Eye, Heart; unknown ones are simply absent,
  as with recipes); right, the ring drawn large with its coils and the rune in each. Click a rune: a short work bar
  (file, cut, redden), **five health**, and the coil glows. No materials, no other cost.
- **Changing is filing.** Silver is soft: the old rune is filed smooth and the new one cut. Same bar, same five health.
  Knowledge is never lost. Swapping stays cheap so people experiment; the scarcity is coils, not changes. You do it at home
  by the fire, which is why nobody feels forced to swap mid-fight.
- The hotbar shows a castable hand rune with the same glow as its coil. One glance tells you what is alive.

## Where runes come from

Finding one is the event. Sources, in the order they appear: **beasts** (the wolf's night running, the bear's berserk, the
boar's charge: after enough of them), **runestones** (the odd ones that change how something works), **deeds** (the plain
ones), **Brokk** (the one person-taught rune on the first island; other people teach later), then **bosses, raids,
fishing, quests, hirdmen** on later islands. A rune's worth matches how it was found: the plain ones from deeds, the
strange ones from stones, the legendary ones from bosses and raids.

Runes must **change what you do**, never only a percentage; a plain bonus is a trinket and belongs on the neck or the hand
(trinkets, neck and rings with passive bonuses exist beside this). Examples: hand: whirlwind, bash, riposte (a parry opens a
free heavy hit), berserk (under a third of health swings are faster and free, but no blocking), weapon runes (a bleeding
axe, a spear that pins, a club that breaks a shield, arrows that can be pulled back). Foot: the dash (a base mechanic for
now, a rune later: Robin), a roll, two steps over water, a climb, no stamina cost at night. Eye: the tree falls toward you
and in one blow, every third rock bursts to your feet, fish bite only at dawn but big, copper glints through rock, beasts
within earshot on the chart. Heart: hold your breath, the cold north of home, hirdmen fight harder beside you, food lasts.

Pairs (two coils of a side combining into something unlisted) were judged too much for now.

## The hird

Rings extend to the hird: you can give your hirdmen things to wear, rings among them, as the jarls did; a hirdman's ring is
his rank and his loyalty. Not designed further yet (see `docs/hird.md`).

## Status

Nothing of this is built (2026-10-06). The old rune code (`RS`, the casting cloth, C, the pouch icon, `STONE_POOL`,
`DEEDS`) stays hidden behind `SHOW.runes` until the bench replaces it; the rune drawings in `src/runes.js` and the deed
counters are kept. The biome ladder the ring follows is in `docs/roadmap.md`.
