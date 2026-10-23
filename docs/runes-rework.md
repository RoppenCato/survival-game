# The rune system, reworked (decided and built in its first form, 2026-10-23)

**Built the same day** (Robin: "build this rune system so we have something to tweak and upgrade"): `src/runes2.js`, the altar and its board, the ceremony, the cudgel and the carried beast, the Rune Editor (`game.html?scene=runes`); what is in and what waits is in CLAUDE.md under "The runes". **Robin's second round the same day, after seeing it:** the ring of library stones took too much room; the library is carved on the altar itself, the offered stones rise from the beast's blood at its foot and sink back, and the player builds the place round the stone himself (the one need a fire within reach). **The ranks of blood** (Robin: deer and boar were too easy for three): thin blood one stone, red blood (deer, boar, the farm's beasts) two, a man three, strong blood (bear, moose, wolf, troll) four, a jarl's or a boss's five, with a legendary pool for those. The sections below are the design as agreed before that round.

**Decided so far (Robin, 2026-10-23, after the first round):** the actives augment specific attacks and keys (slots by input: yes).
**The altar:** a stone sacrifice altar you build; at a season's end you sacrifice an animal there to choose a rune, and different
animals give different tiers from the pool. **Two kinds of rune:** those in the sacrifice pools and those from other sources. **A
library:** you build up your own library of runes to choose from. **Blood wakes a rune at the altar:** you drip your own blood into
the carved symbol until it fills, from empty to blood red. **No cards:** a gift from the gods: you lay stones by the animal on the
altar, a storm rises and the stones become runes with their powers, you choose one, lightning strikes and breaks the other stones
and carves the one you chose. **Passives are a fixed set, no slots opening over the game.** The sections below are updated to it;
the answers to Robin's four questions are in section 5.
**Third round (Robin, 2026-10-23): "This rune system sounds great!"** The shape of sections 2 and 5 stands as the design: slots by
input, four fixed passives (hand, foot, eye, heart), the library as stones round the altar, binding by blood at the altar only,
actives that charge on blood drawn, no plain-number runes, marks for the combinations; **a man may be sacrificed** (the dark road,
with its price). At the altar you pick the slot you want to change (say the hand) and see only the runes of your library that fit
it. **A rune gains power with time and use** (Robin's yes, the same day): a bound rune grows through its tiers by being used, beside the deeper tier an animal's blood can give at once. The animals' tiers and the first marks are still mine to settle with him. The chapter that builds it is not yet said (the rune
system is reworked when the pet chapter is worked on, Robin's earlier word).

Robin's brief: the system today is convoluted and confusing, the learning paces oddly, the arm ring is too complicated to make
work and too hard to see on the hero or on a jarl, and there are too many runes wanted for "choose a few". Kept: blood to wake a
rune. Wanted: runes that augment, active and passive; the shield bash a rune among others for the guard-blow (right button held,
left pressed); actives of one kind sharing a slot (dashes, charges); runes for gathering (a felled tree that flies into two
more); runes for pets (passives and one or two actives: the cat that helps gathering, the wolf's stun on a cooldown); runes
from all kinds of sources without bloat; the blót, sacrifice, as a way in. Everything below is mine until Robin picks.

## 1. What other games do (the short version, with where it is written up)

- **Hades: one boon per move.** Attack, Special, Cast, Dash and Call are five slots tied to five inputs; a god's boon for a slot
  replaces what was there, and you can only ever carry one per slot, while passives stack. The choice is always "what does my
  dash do", never "which of 80 things do I take". A new offer is three boons; you take one.
- **Hollow Knight: charms and notches.** 3 notches at the start, 11 at the end; each charm costs 1 to 5 notches; swapped only at
  a bench. The cost is the whole design: a strong charm is dear, so the band of passives is a budget, not a list.
- **Elden Ring: Ashes of War.** The skill lives on the weapon, one per weapon, swapped freely at a whetstone; some fit only some
  weapons (a thrust for a spear, a kick for anything). The weapon's identity and the skill are one thing.
- **Valheim: forsaken powers.** One active power at a time, taken at an altar from a boss's trophy, five minutes on, twenty off;
  skills rise by use. The power is a big, rare, visible choice; the rest is quiet growth.
- **Diablo III: skill runes.** Runes were loot at first; it was going to be thousands of items, so they became five variants of
  each skill, unlocked by level, one chosen. A rune changes what the skill does (a knockback becomes a stun), not just a number.
- **Hades: Chaos.** A curse now (lose health on every blow for five rooms) for a blessing after: sacrifice as a trade with a
  wait. **Cult of the Lamb:** a follower sacrificed at the altar for a gift, with a cost to the flock's faith.

The lesson across them: **few slots, many choices per slot, a visible cost to choose, swapped at a place not anywhere, and a
change in what a thing does rather than a number.**

## 2. The shape I propose

### Slots by verb, not a ring

The hero has a handful of **slots, each an input or a thing he does**, opened by chapter:

| Slot | The input | Chapter 1 holds | Later alternatives (examples) |
| --- | --- | --- | --- |
| **The guard-blow** | right held, left pressed | the Bash (as built: breaks a block, throws) | the Charge (a rush that knocks the first man down), the Hook (an axe pulls a shield down), the Feint (opens a guard without touching), the Shield-cast (a throw, as in the sagas) |
| **The dash** | Space | the Dash (as built) | the Roll (longer, through a blow), the Leap (over a fence or a low wall), the Rush (a dash that strikes), the Step (short, no cooldown, stamina) |
| **The draw** | right held with the bow | the charged shot (as built) | the Pin (as the rune today), the Pair (two arrows), the Rain (three at once, short), the Brand (a fire arrow with a torch lit) |
| **The swing** | the tool | the plain swing | Thor's fell (one tree in four flies into two more), the Splitter (a rock gives double once in three), the Deep bite (a log in one blow less) |
| **The call** | a key held (G long, or the pet's) | nothing | the War cry (fear in a ring), the Horn (the hird musters to you), the pet's own active |
| **The body** | four passives, fixed: the hand, the foot, the eye, the heart (one of each kind, always) | — | hand: Thor's wrath, Bloodlust; foot: the Roll's step, Fleet foot; eye: Keen eye, the Nose; heart: Thick hide, Long wind |
| **The collar** | the pet's: 1 active, 2 passives | — | the wolf's Stun, the hound's Grip, the cat's Purr (gathering quicker with it near), the raven's Eye |

One rune per slot; the choice is always "what does my dash do". **Passives are four and fixed**: the hand (what you strike with), the foot (how you move), the eye (what you see and find), the heart (what you endure); a hand rune competes only with hand runes, so there is never "take the best eight". A
weapon-bound rune (the Hook needs an axe, the Rain a bow) says so and stays grey otherwise, as an Ash of War does.

### The library, and blood that wakes a rune (Robin's)

- **The stones lie round the altar.** Every rune you own is a carved stone standing in the ring round the altar: your library,
  seen in the world. You carry nothing; what you have bound is in your blood. The library is yours, not the altar's: a second
  altar you build shows the same stones (the gods know them), so moving house loses nothing. (Robin's question 1: by the altar,
  not in a pouch; the pouch would let you swap anywhere, and swapping anywhere is what question 3 does not want.)
- **Binding at the altar.** E at the altar opens the altar board: your slots on the left, the stones that fit the chosen slot in
  the middle, the stone's carving and tale on the right, as the mock has it. Choose a stone and **drip your blood into it**: the
  carved symbol fills from empty to blood red over a second (the cut: health that comes back), and the rune is in the slot. The
  stone that was there empties again and stands back in the ring. Away from the altar, Tab's Runes page shows only what is bound,
  the filled symbols, nothing to change.
- **Actives feed on blood** (mine, kept): a bound active charges from the blood you draw: ready after so many landed blows, a red
  ring filling on its mark by the toolbar. Passives need nothing.
- **Blood runes**: a few cost health to use. Risk you choose.

### The altar (Robin's)

A **stone altar** is a piece you build (stone, and a thing of the sacred: a cairn's worth of stones on a flat place by your fire).
At a season's end, with the season due, you bring an animal to it (a dead beast carried as the heavy things are, laid on the
stone; a hen or a sheep led) and **lay stones by it** from your bag (three plain stones). Then the gift: the weather turns (the
storm spell over the altar, the sky dark, the wind up: the weather module has the storm, Colin, AD's flashes and Derek, SD's
thunder), the three stones turn and show carvings (three runes from the pool for your slots), you choose one with E, lightning
strikes the altar, the two other stones break, and the chosen stone lies carved on the altar: a rune in your library. Then the
season turns, as the blót does today (the altar is where the blót is held from now; the hearth's rite goes).

**The animal sets the tier** of what the storm offers: a hen, a hare, a fish: tier I; a sheep, a goat, a deer, a boar: tier II;
a bear, a moose, a wolf of the pack: tier III; a man (a captive, a thrall: the sagas' dark road, with a price in reputation and
in what Arnor and the hird say, if Robin wants it in): the runes no beast can give.

**Two pools.** The sacrifice pool is what the storm draws from (the runes of powers: the Charge, the Roll, Thor's wrath). The
other runes come **from the world, each where it is met** (the next section) and go into the library without a storm.

### Found runes, few and placed

Beside the blót, runes come **from the world, each where it is met**, so the meaning is plain: the boar's rune after the first
boar (the Charge), the wolf's after a night's pack (Bloodlust), the deer's (Fleet foot), the bear's and the moose's (Thick hide,
the Shove), the adder's (Venom), the troll's (Stone skin, a moment no blow staggers); a runestone read gives its rune; a cairn
built, the first ship launched, the first raid, Hogni's scratch, the jarl's hoard; Arnor teaches one (the Deep bite); a völva
sells one for silver; a priest's relic holds one; the pet family's runes come with the pets. **About eight to ten a chapter**, so
the known pool reaches thirty or so by the fourth sea, with one per slot in use at a time.

### No bloat

1. One per slot, a band with a size: what is in use is never more than eight things.
2. The runes page shows **by slot**: pick a slot, see what fits it, with a name and Alistair, LD's two lines, no numbers on the
   face (the card has them, as a weapon's does).
3. Tiers instead of near-twins.
4. Three offered at the blót, one taken; the rest of the pool stays unseen until met in the world.
5. A chapter opens one or two slots and about ten runes, never the whole table at once.

### The arm ring and the sign of rank

The arm ring cannot carry this and does not read as rank. Two moves:

- **The ring becomes one legendary slot** and the story's thing: the bronze ring from Hogni, the silver from the jarl's hall,
  the gold, Odin's ring; each **bears one great rune of its own** that cannot be moved (the bronze: the dead's warning, you
  see a man's blow from behind; the silver: the jarl's word, villagers trade; Odin's: the legend). One ring on the arm, one
  power. Simple to say, simple to see on the card.
- **Rank is shown by what the age showed it with:** the cloak's colour (undyed, blue, madder red, the purple of the hub), the
  painted shield's pattern (Colin, AD's faces exist), and for a jarl his hall, his banner and the men in mail at his door. A
  man with runes cut shows **the cuts as marks** (a blue line on the shield's rim or the haft, one a rune) if Robin wants the
  runes themselves seen; the ring's number of coils is not the sign.

## 2b. How it looks (the mock: `pictures/runes-mock.png`, `tools/visual/runesmock.js`)

Three screens and nothing more. **The Runes tab** (Tab at a fire of yours): the slots down the left, one row each with its input
and what is in it (grey where a later chapter opens it); the band as a row of small places; click a slot and the middle shows
only what fits that slot, known runes with a name and a line, unmet ones as "a rune not met" with where it waits; click a rune
and its card stands on the right with the tale, the tiers and the Bind button. **In play**: the toolbar gets one small mark per
active slot, a red ring that fills with the blows you land; nothing else on the screen. **The blót**: three cards over the fire,
Take on each. Managing many runes is managing one slot at a time: the page never lists everything.

## 3. What this asks of the work

- The engine: a slot table (`SLOTS`) with the input each slot owns, `runeOf(slot)` where the inputs are read (the guard-blow,
  the dash, the draw, the swing), the blood counter on actives, the band's size by chapter. The runes as data (`RUNES`: slot,
  tier, cost, what it changes), as the game's rules are.
- The page: the Runes tab in place of Ring: the slots left, what fits right, bind at a fire; the blót's offer as a board of
  three cards; the slot's red mark on the bar.
- Lore: thirty names and two lines each (Alistair, LD); the blót's lines he has already.
- Art: the slot icons and the rune marks (Colin, AD); the ring's icon stays.
- The order: 1 the slot table and the guard-blow with two runes (the Bash, the Charge); 2 the dash's; 3 the Runes tab and
  binding by blood; 4 the blót's offer; 5 the band; 6 the draw and the swing; 7 the ring as the legendary slot; 8 the collar
  with the pet chapter. Each a test and Robin's play.

## 5. Robin's four questions, answered (mine)

1. **Where the runes are kept, and the menu.** By the altar, as carved stones in its ring (the library you can walk round), not in
   a pouch: binding only there is the one brake the system needs. The menu is the altar board above: slots, what fits the chosen
   slot, the stone's tale, the blood. Nothing lists every rune at once; the ring round the altar is the only place they all stand,
   and there they are scenery.
2. **How many passives.** Four, fixed, and of four kinds: hand, foot, eye, heart, one each. No slots open later; a chapter adds
   runes to choose from, never places.
3. **No mandatory passives.** A rule for the pool: **no rune is a plain number.** "Sail faster", "gather more", "hit harder" are
   not runes; they are the ship's fittings, the tools and the gear. A rune has a trigger, a change in what happens, and usually a
   trade: the Gleaner is "a bush gives twice, and is bare for the season"; Thor's fell is "one tree in four flies into two more"
   (and one in four flies at you). Then there is nothing to min-max: every choice is a way to play, not a bigger number. Two
   brakes besides: binding is at the altar only, and a rune **grows with use** (tier II after fifty uses of tier I), so the
   player who keeps a rune is rewarded over the one who swaps.
4. **Runes that work together: marks.** A small vocabulary of **marks a foe can carry**: *struck* (by lightning), *bleeding*,
   *afraid*, *chilled*, *burning*. Some runes **lay** a mark, others **read** it. Thor's wrath (hand): every blow has one chance in
   four to call lightning down on the man, who is *struck* for ten seconds; the Hammer (a club's rune): a club blow on a *struck*
   man does double and staggers; the Storm's eye (eye): lightning leaps to a second man within reach; the Rush (dash): dashing
   through a *struck* man knocks him down; the wolf's Howl (collar): the pack's fear, men within sight *afraid*; the Feint
   (guard-blow): an *afraid* man's guard opens wider. Five marks, each with two or three layers and three or four readers, make
   the combinations without a table of a hundred: the player finds that lightning and the club go together, as Robin wants.

## 6. Questions for Robin

1. The four passive kinds, hand, foot, eye, heart: yes?
2. Which animals in which tier (hen I; sheep, goat, deer, boar II; bear, moose, wolf III), and is a human sacrifice in?
3. The library at the altar and the same stones at every altar of yours: yes?
4. The marks (struck, bleeding, afraid, chilled, burning) as the way runes combine: yes, and which first?
