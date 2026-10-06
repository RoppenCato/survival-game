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

## The starter runes (Robin chose, 2026-10-06)

The first big island's runes, by side, with how each is learnt. Each changes what you do; none is a plain percentage.

| Side | Rune | Learnt from | What it does |
| --- | --- | --- | --- |
| hand | **Riposte** | Brokk teaches it | a parry opens a free heavy hit for a second |
| hand | **Boar's charge** | ten boars | sprint into a beast to bowl it over: your run becomes an attack |
| foot | **Sure feet** | a minute of sprinting | sprinting costs half the stamina |
| foot | **Wolf's run** | ten wolves | at night you run faster and silently, and wolves ignore you unless you strike first |
| foot | **Roll** | a runestone | the dash becomes a roll: longer, more time untouchable, slower to get up |
| eye | **Stone sense** | a runestone | copper glints through rock from afar; every third rock bursts and the stone flies to your feet |
| eye | **Snake's eye** | ten snakes | beasts within earshot show on the chart; a hidden adder shows before it strikes |
| eye | **Heavy blow** | (Robin: a charge attack for chopping and mining; source to pick, deed: fifteen trees?) | hold the button to wind up a chop or mine that lands for three blows' worth |
| heart | **Hearty** | five meals | meals last half as long again |
| heart | **Hearth warmth** | a runestone | you heal by any fire, not only at home; sleeping rough counts as rested for a while |
| heart | **Long breath** | a runestone by the sea | twice as long under water, swimming costs no stamina (for the second biome) |

Not chosen for now: Hard swing, Bear's rage, Deer's leap, Clean cut, Moose's push, Shield wall. The heart coil opens with
twisted silver, so the heart runes are known before they can be cut.

## The build order (agreed 2026-10-06)

Each step is playable on its own. Tests where a step has rules: headless scripts in `tests/` that print and are read, as the
combat tests are.

1. **The ring as data.** `ring = { metal, coils: [{ side, rune }] }` saved with the game; each rune gets a `side` and a
   `source`; what is alive comes from the coils; the cloth, pouch, hollows and C are removed, the rune drawings and deed
   counters kept. **No rune can be discovered before the first ring is worn** (Robin): deeds and kills count, but nothing is
   learnt until the ring is on the arm. Test: coils feed `mods` and `trigger`; nothing learnt without a ring.
2. **The ring on the character panel.** Drawn on the hero's arm by metal, and a row of coils under the gear; hover for the
   rune's name and line. Looking only.
3. **The carver's bench.** A buildable piece for the big island (6 wood, 2 stone, 2 copper; it works only under a roof, like the workbench) with its own prop. E opens the ring
   board (tabs Hand, Foot, Eye, Heart of known runes; the ring large with its coils). Click a rune: the work bar, five health,
   the coil glows, the old rune fades; filing to change. The hotbar glow for a castable hand rune. Test: cut, file, re-cut,
   close mid-bar, die mid-bar, a rune of the wrong side.
4. **Runes from the beasts.** One per animal of the first biome, learnt after **ten** of them (the bear and the troll the same): the boar's charge, the deer's
   dash (later; the dash stays a base mechanic for now), the wolf's night running, the bear's berserk, the snake's venom
   edge, the moose's push. The learning moment is a rite: a dim, the rune glowing over the beast, its name. Test: the count,
   the rite once, nothing before the ring.
5. **The bronze ring in the cave.** The dead Viking lies at the very back of the troll's cave, **behind the troll's lair**, past the
   ore; E takes the ring; the troll must be dealt with or slipped past. Two coils, hand and foot. Brokk's one taught rune comes after it. Test: the ring appears once, is
   saved, and discovery opens with it.
6. **Runestones give runes again,** the odd ones, with the rite of step 4.
7. **Rings on leaders.** Only leaders wear rings: Brokk bronze, jarls and legendary Vikings by their biome, ordinary people
   none. Drawn on the arm, said in speech, compared on meeting.
8. **Growth.** The silver ring from the second biome's jarl or hoard, the eye side; the smith's rework. Waits for the second
   biome and the raid.
9. **Hirdmen wear what you give them,** rings among them. Waits for the hird's next step.

Deeds keep giving the plain runes (fifteen trees, five meals, a minute of sprinting); beasts and stones give the interesting ones.

Left out until asked for: pairs, cursed rings, rings taken from the dead, the dash as a rune.

## Status

Nothing of this is built (2026-10-06). The old rune code (`RS`, the casting cloth, C, the pouch icon, `STONE_POOL`,
`DEEDS`) stays hidden behind `SHOW.runes` until the bench replaces it; the rune drawings in `src/runes.js` and the deed
counters are kept. The biome ladder the ring follows is in `docs/roadmap.md`.
