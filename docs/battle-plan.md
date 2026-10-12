# People in Blender, and the road to a raid: the plan

**Robin, 2026-10-12:** *"Make a detailed plan for this: Blender the hirdmen and other humans. Try fighting a hirdman. Fix
bugs. Try fighting 2 hirdmen. Fix bugs. Try fighting 2 hirdmen, with one hirdman on your side. Fix bugs. Try fighting 5 vs 5
hirdmen. Fix bugs. Try filling a big town with hirdmen, then attack the town. Fix bugs. Try raid. Make it interesting."*

This is the plan, not the work. Nothing in it is built. It follows Robin's ladder rung for rung: each rung says what has to
exist before it can be tried, how it is tried (by script and by eye), what is likely to break, and when it counts as done.
Where a choice is Robin's it is marked **Robin**, and they are gathered in section 11.

The scope decided on 2026-10-09 was "the starter island and the big island only; none of the raiding or clan systems are
played yet". This plan is the first step past that, so all of it happens in **a test scene of its own** until Robin says a
rung is good enough to stand in the game.

## 1. Where we stand (from the code, 2026-10-12)

| | What there is | What that means for this plan |
| --- | --- | --- |
| **People, drawn** | Villagers, Brokk, the hird and the guards are the old drawn ink figure (`lib.figureD`, `drawFolk`, `drawHuman`), with idles and jobs as poses. The hero and every animal and troll are Blender sheets. | The people are the last drawn figures in the game, and stand beside a modelled hero. |
| **People, modelled** | The hero: a body of rigid parts on **Mixamo's skeleton**, eighteen clips, eight directions, weapons as layers tinted by their metal. The **draugr**: a man with a sword and a shield on the trolls' scripted rig, with idle, walk, windup, attack, hit, shield and death. | Two working ways to make a person. The hero's gives better motion and takes any Mixamo clip; the draugr's needs no Mixamo and moves stiffer. |
| **Sheets** | The hero's body is 300 frames a direction, 2400 frames of 164 by 164: 25 MB on disk, about **258 MB once decoded**. | That cannot be paid again for every look of every person. People need one set of sheets that all of them share (section 3). |
| **Guards** | An engine enemy of type `beast` with a figure: 24 health, 9 a blow, the plain chase and lunge every animal has. No shield, no weapon of its own, no blocking. | A guard fights like a boar on two legs. A hirdman needs a way of fighting of his own. |
| **The hird** | `hird` in the page: people who follow you inside your territory, take jobs, eat, crew a boat. **They never fight.** `Hird.roll` gives each health 20 to 40, strength, aim, wits and traits (loyal, afraid of the dark...). | The numbers a fighter needs are already rolled; nothing reads them in a fight. |
| **Sides** | None. Every enemy's thinking starts from the hero's position (`updateEnemies`: distance and angle to `P`), and a blow can only land on the hero (`hurtPlayer`) or come from him (`damageEnemy`). | "A hirdman on your side" and "five against five" need **sides** in the engine: who is whose enemy, and blows between any two fighters. This is the biggest single change. |
| **Finding a way** | None. A mover walks straight at its target and slides along circles (`moveCircle`). | Fine in a field. In a town with houses, a palisade and a gate, nobody will reach anybody. A town needs **way-finding**. |
| **The raid** | Built 2026-10-07 (`docs/raid.md`): locked doors the axe breaks, the heavy chest carried on the shoulder and stowed aboard, the alarm that wakes a town's guards and sends the folk to hide. Not built: hirdmen carrying, fire, reputation. | The bones are there. What is missing is the fight worth having, the hird's part in it, and the reasons to stay or run. |
| **Testing** | The engine runs in Node (`tests/balance.js`: a bot taps at each animal). The page can be driven by script (`drive.js`, `ui.js`, `startplay.js`). | Fights can be run hundreds of times with no screen, and every rung can be played by script before Robin plays it. |

## 2. The shape of it

Three strands, and the ladder is where they meet.

- **A. The people** (section 3): one modelled body, many looks, the clips a fight and a village need.
- **B. The fight** (sections 4 to 7): sides, a hirdman's way of fighting, friends who fight beside you, groups.
- **C. The place** (sections 8 and 9): a test scene, way-finding, a town full of defenders, the raid.

| Robin's rung | Needs | Section |
| --- | --- | --- |
| Blender the hirdmen and other humans | A | 3 |
| Fight a hirdman | A (fighters), B (sides, the hirdman's fight), the test scene | 4 |
| Fight two | + rules for more than one attacker | 5 |
| Fight two with one on your side | + friends | 6 |
| Five against five | + groups, telling the sides apart, speed | 7 |
| A big town full, attacked | + way-finding, posts, the alarm at scale | 8 |
| The raid, made interesting | + the hird carrying, the loop, the stakes | 9 |

A rung is not left until its **gate** is passed: the scripted runs are clean, the numbers are inside what was aimed at, and
Robin has played it. The bugs of a rung are fixed on that rung; the next one will have enough of its own.

## 3. Rung 0: the people in Blender

### 3.1 One body, layers, colours laid on at draw time

The hero's sheets cannot be multiplied by the number of looks. So:

- **One body** on the Mixamo skeleton, built like the hero's (rigid low-poly parts, 3.75 heads, mitten hands), rendered
  once in **neutral colours**: skin, and tunic, trousers and boots each in a grey of its own.
- **Layers**, each rendered on the same clips as a holdout over the body, each **cropped to its own small box** (a helmet
  is thirty pixels, not a whole frame): three or four hair styles, two beards, a hood, a cap, the nasal helmet, mail, a
  cloak, a fur vest, an apron dress, the round shield on the left arm.
- **Colour at draw time.** Hair, tunic, trousers, cloak and the shield's paint are tinted when drawn, the way an item's
  metal already is (`Sprites.draw` with `{ layer, tint }`). A person is then a short list: body, these layers, these
  colours. Thirty different people cost thirty short lists and **the same sheets**.
- **The weapons already exist** as layers for the hero (sword, axe, club, seax, spear, bow, in wood and tinted metal). The
  people use the same ones. A Dane axe and a javelin are to be added.

`Hird.figureSpec` and `lib.folkSpec` already describe a person as hair, beard, hat, clothes and colours. They keep doing
so; a small table turns that description into layers and tints. Nothing about how people are rolled changes.

**Robin: one body, or two?** One body for everyone is cheapest. A second, slighter body for women (and scaled for the
child) doubles the body's sheets and none of the layers fit both. My suggestion: **one body, and let the layers carry it**
(the apron dress, the braids, the build keys the drawn figure already has: a little narrower, a little shorter, done by
scaling the drawn sprite). **Brokk** is a body of his own (broad, short: a dwarf does not scale from a man).

### 3.2 The clips

Mixamo, because the hero already uses it and a fight needs motion that reads. Eighteen clips are downloaded and bound;
nine of them serve a fighter as they are.

| Set | Clips | Have | To fetch from Mixamo (with Robin signed in, as on 2026-10-09) |
| --- | --- | --- | --- |
| **The fight** | idle with a weapon, walk, run, two slashes, a hit, a death | all, from the hero | **shield up and held** (the block), **struck while blocking**, a **thrust** (spear, seax), a **two-handed swing** (Dane axe), a **second death**, a **step back**, a **stagger** (guard broken, stunned), **yield** (to the knees) |
| **The bow** | draw, shoot | both | none |
| **A life** | idle, look about, sit down, sit, stand up, pick up, drink | all | **sweep, hammer, carry a load, chop at a block** (the jobs that are poses now), **cower**, **run in fear**, **carry the heavy chest**, **row** |
| **The hird** | | | **point / wave on** (the muster), **cheer** |

About sixteen new clips. Mixamo has no clip for every job (it had no chopping, pickaxe or eating motion in October); what
it lacks is keyed by hand on the same skeleton, as the hero's hand-made idle was.

**I do not sign in, accept terms or change settings there.** The fetching is a sitting with Robin signed in to Mixamo in the
browser pane, an hour or so; the list of clips with their Mixamo names will be ready before it.

### 3.3 The budget

The hero's frames are 164 by 164 because one box has to hold him lying dead. For people:

- **A box a clip.** Standing clips need about 100 by 136; only the deaths need the wide box.
- **Fewer frames.** Eight to ten frames for a walk and a blow; the idles at five a second and melted between frames
  (`Sprites` already does this for the beasts' idles).
- **A target:** the body at about 110 frames a direction over the fight set, 880 frames: roughly **45 MB decoded, 6 MB on
  disk**; every layer a tenth of that or less; the whole of "people" under 100 MB decoded and 15 MB in git. To be
  **measured on the first clip before the rest are rendered**, not assumed.
- **Loaded when needed.** The life set loads with a village in sight; the fight set with the first armed man. The game
  loads everything at the start today.

### 3.4 Into the game

`Sprites.person(c, H, who, opts)` beside `Sprites.beast`: the clip from what the person is doing (the engine's state for a
fighter, the page's for a villager at a job), the layers and tints from their look, the thing in the hand from what they
carry, the cast shadow and the fire's light as the hero has them. `drawFolk` and `drawHuman` call it; the drawn figure
stays as the fallback until the sheets have loaded, and afterwards for nothing.

### 3.5 Order, and the gate

1. The neutral body and three layers (hair, tunic tint, helmet), one clip, eight directions: **measure** size, memory and
   the cost of drawing thirty at once. Change the plan here if the numbers say so.
2. The fight set on the clips already downloaded; a guard and three rolled hirdmen in the Art Editor's Models tab.
3. The Mixamo sitting; the new clips bound; the shield and the Dane axe.
4. The life set; the villagers, the priest, the merchant, the fisherman; the child (the body scaled) and the elder (a
   stoop, grey hair).
5. Brokk.

**Gate:** a picture at Robin's size of thirty people rolled at random beside the hero on the island (no two alike, none
that looks pasted on), every clip on a contact sheet, a village walked through by day and by night with no drawn figure
left in it, and the frame time with forty people on screen.

**Likely to go wrong:** layers that poke through each other on some frame of some clip (a helmet through a hood); a tint
that turns the ink line with it (tint the fill, keep the line: the packer has to keep them apart); the shield hiding the
body from the west; hands that miss the haft on clips made for a sword; the sheets' weight.

## 4. Rung 1: fight a hirdman

### 4.1 What has to be built

- **Sides in the engine.** Every fighter has `side` (0: against you; 1: with you; the hero is on 1). `targetOf(e)` is the
  nearest foe it can reach; the AI's distance and angle come from that instead of from the hero. A blow is resolved once,
  for anyone: an arc or a thrust from the attacker, landing on every foe inside it (`strike(from, shape, dmg)`), which
  calls what `hurtPlayer` and `damageEnemy` do today. Beasts keep working unchanged: they are on side 0 and their only foe
  in reach is the hero, until there are friends.
- **A fourth kind of enemy: the `soldier`.** A man does not lunge like a boar. He:
  - closes to **his weapon's reach** and keeps it (a spearman stands off, a seax man crowds you);
  - **strikes by his weapon's own numbers**: the same `PROFILES` the hero's weapons use (arc, reach, windup, recovery,
    chain, and the one thing each kind has: the axe breaks a guard, the club staggers, the spear runs through);
  - shows the blow coming (the windup clip; the engine's ground mark for wide sweeps only);
  - **raises his shield** against a blow he sees coming, by his wits, and cannot while he is striking or staggered;
  - **steps back** when hurt and comes again; **circles** instead of standing still;
  - at low health, by his nature, **yields** (to his knees, weapon down) or **runs**; a loyal man does neither.
- **What his shield means for the hero.** Nothing in this game drains stamina as a punishment, so a shield is not a wall
  to be worn down. A blocked blow does a fraction and pushes him back; an axe **breaks the guard** (the
  shield drops for a moment); a club's blow **staggers through it**; a spear thrust at range makes him turn the shield and
  open his side; a parry (which the hero already has) opens him fully. Each weapon then has a reason to exist against a
  man that it does not have against a boar.
- **His numbers** from `Hird.roll`: health as rolled, strength into damage, wits into how often the shield comes up and
  how soon he yields, aim for a bow. His gear (helm, mail, shield) turns blows aside by the same rule as the hero's.
- **Bodies.** A dead man lies where he fell for a good while (a battlefield should look like one), with what he carried
  beside him.
- **The test scene:** `game.html?scene=battle`, like the mountain and rune scenes: a flat field by a wood, the hero armed,
  and a board on the left: *one hirdman, two, two with one beside you, five against five, a town defended, raid it;*
  his weapon, his gear, his nature; your weapon; again; slow the clock. It has its own save and touches nothing else.

### 4.2 How it is tried

- **By script, with no screen** (`tests/battle.js`, in `npm test`): the hero played by three bots (one that only taps the
  attack, one that blocks what it sees coming, one that parries and uses the weapon's strength), against a hirdman with
  each weapon, with and without a shield, in leather and in mail; two hundred fights each. The line for each: who won how
  often, how long it took, what the hero had left.
- **By script in the page** for what Node cannot see: that the clips match the blows (the hand at the haft when the blow
  lands), that the shield is where the blow was stopped, that nobody slides.
- **By eye**, at Robin's size, the same fights slowed to a quarter.

### 4.3 What to aim at (to be agreed, then tuned to)

| | The tapping bot | The careful bot | The skilled bot |
| --- | --- | --- | --- |
| A hirdman in leather with an axe, the hero in leather with a flint sword | loses more often than not | wins most, hurt | wins nearly always, lightly hurt |
| The same man in mail with a shield | loses | about even | wins most |
| Length of a fight | | 15 to 40 seconds | |

**Robin:** is a single hirdman meant to be **an even match** for a careless hero (my reading of "the hird can die, never
at random": a fight between men should be serious), or a lesser thing you cut through?

### 4.4 Likely to break

The blow lands before the picture of it does. The shield stops blows from behind. He blocks for ever and nothing gets
through (a wall), or never (a boar again). The hero's parry window, tuned on animals, is too kind or too mean against a
sword. He and the hero circle each other without end. He yields and is struck anyway (and what then?). A beast and a man
in the same fight: does the wolf go for him? (By sides, no: both are against you. **Robin:** should beasts attack men?)

**Gate:** the table above within a few points over two hundred fights; no fight in the logs longer than two minutes; Robin
has fought each weapon and says a man feels like a man.

## 5. Rung 2: fight two

**New:** only the rules for **more than one attacker**, which are a matter of fairness and of looks.

- **Not all at once.** Around any one target there are **slots**: two may strike in the same moment, the rest hold a step
  back, circle, and take a slot when one opens (the wolves' "only one of the pack bites at a time" is this rule already,
  for one species).
- **Flanking.** The second man works round to your side instead of queueing behind the first.
- **Space.** Men keep a pace apart; they do not stand in each other.

**Tried:** the same three bots against two, by weapon pairs (two axes; an axe and a spear; a spear and a bow).
**Aim:** two are clearly worse than one, and beatable by the careful bot with a shield and the skilled bot without.

**Likely to break:** the hero locked between two staggers with no way out (he must always be able to dash clear); both
men's blows landing in one frame for double; one man blocking the other's line and both standing still; the second man
walking round and round because his slot never opens; a spearman killing his friend (no hurt between friends, see 6).

**Gate:** no chain of hits on the hero longer than he could have dashed out of, in a thousand fights; nobody stuck.

## 6. Rung 3: two, with one on your side

**New: friends.** The hird's design (`docs/hird.md`) already says how: *"follow at a few steps, strike what you strike,
hold a line when you stand still."*

- **Following.** A friend keeps a place beside and a little behind you (left and right fill first), not in your path, and
  never between you and what you are striking.
- **Engaging.** He takes the foe you struck last, else the nearest; he does not chase past a leash from you; when you
  walk away he breaks off and comes.
- **No hurt between friends**, in either direction, and your swing passes through him (he must not be a wall in your arc).
- **He can be hurt and can fall.** What falling means is **Robin's** (section 11): dead for good, as decided ("they can
  die, never at random"), or **down**: out of the fight, on his feet again when it is won, dead only if left behind or
  the fight is lost. My suggestion is *down*, because a friend lost to a stray blow in a scrum is close to "at random".
- **Telling them apart.** Your people must be known at a glance, in a crowd, at night: your shield's paint and your
  cloak's colour on every one of them, and a quiet mark over a friend's head only while a fight is on. **Robin:** your
  colours: chosen once (a board at the claim stone), or given?
- **Their state**, without a board: a small bar over a hurt friend, as hurt beasts have.
- **A word to them.** Keyboard first: one key, pressed: *with me* (break off, come); held: *hold here* (a line where they
  stand). No menus in a fight. **Robin:** which key (G is free), and is two orders enough to start?

**Tried:** the hero bots with one friend against two; and **the friend alone against one**, hundreds of times, with no
hero at all. That last is the first purely scripted fight, and the tool for every balance question after it.

**Likely to break:** the friend takes every kill and the hero watches, or stands by while you die; he blocks a doorway;
he runs off after a fleeing man and is gone; he and a foe trade blocked blows for ever; two men with one target dance.

**Gate:** with a friend the same fight is clearly easier but not won for you (the careful bot's wins go up, the tapping
bot still loses some); a friend alone against his equal wins about half.

## 7. Rung 4: five against five

**New: the group.**

- **Choosing whom to fight** so that five do not chase one: each man takes a foe nobody has, then the least beset.
- **A line.** Standing still (the "hold here" order, or defenders at a gate) the men stand shoulder to shoulder with
  shields up, and fight what comes to them. The shield wall is the picture of the age; it is worth its own small
  behaviour.
- **Heart.** A side that is losing does not fight to the last man every time: when half are down and the rest are hurt,
  the unloyal run (and can be run down, or let go), and a man alone among foes yields. Routs end fights; they are also
  the pursuit the raid's retreat needs.
- **Sound and sight.** Ten men's blows at once must not be ten sounds on one beat; the dead stay; the camera pulls back
  a little while a fight of more than six is on (as the lookout does).
- **Speed.** Ten fighters with layers is some eighty draws a frame: nothing. The thinking is cheap. To be measured, not
  feared.

**Tried:** five against five with no hero, **a thousand times in Node**: how often each side wins with equal men (it should
be near half), then with one side in mail, one side with spears, one side holding a line. Then with the hero in it,
by bot and by hand.

**Aim:** equal sides, an even coin; the hero's side wins clearly more with him fighting well, and still loses if he
stands by. A fight of ten lasts one to two minutes.

**Likely to break:** everything from 5 and 6, five times over; a knot of ten men turning in a circle; two lines that will
not close; the last man of each side chasing the other round a tree; friends lost in the crowd so the hero strikes at
nothing; the frame time.

**Gate:** the coin is even; no fight in a thousand runs past five minutes or ends with a man stuck; Robin can tell at
every moment who is his.

## 8. Rung 5: a big town full of hirdmen, attacked

**New: a place with walls in it.**

- **Finding a way.** A grid of the town's tiles from the building data the game already keeps (`B`: floors, wall edges,
  doors, gates, the stake ring): which tile joins which. A mover with no straight way asks the grid for a path (A-star
  over a few hundred tiles; kept until the goal moves a tile). Doors that are shut and locked are walls to everyone until
  broken. Chokepoints (a gate, a door) take **one man at a time**, with the others waiting their turn instead of pushing.
  This is also what the folk running home to hide have lacked.
- **The town itself:** `Village.make` with the `town` archetype (the jarl's hall, the church, five to seven houses, the
  market, the wall and its gate), grown on the big island for the test, and **filled**: so many at the gate, so many on
  the wall walk if there is one, the jarl's own men in the hall, the rest asleep in the houses or about their day.
  **Robin:** how many is "full"? I would start at twenty fighters and thirty folk and go up until it stops being fun or
  fast.
- **How a town defends.** As decided for the raid: **the defenders gather to the noise from inside the town**; no bell, no
  waves from a castle. So: every defender has a post; noise (a door broken, steel, a shout) travels a distance and those
  who hear it come by the grid, and tell those they pass. The men in the hall come last and are the best. With nothing
  heard, the town goes back to its day.
- **Coming with a hird.** Your people follow by the same grid, through the gate you opened; they hold where told.
- **Bows.** A town's fight wants a few archers on both sides (the hird's `aim` is rolled for it). They are a rung of their
  own inside this one: who they shoot, never into their friends, arrows stopped by walls.

**Tried:** by script, the hero and five friends walked in at the gate from each side of the town, in a dozen towns from a
dozen seeds, by day and by night; the line says who heard what when, how long until the first defender arrived and the
last, where anyone stood still for more than five seconds, and the worst frame. Then by hand.

**Likely to break:** men walking into walls for ever (the reason for the grid); thirty men in one doorway; defenders
arriving one at a time to be cut down in turn (they should gather a moment and come together), or all at once at the
gate in the first ten seconds (then it is a wave after all); folk fleeing through the fight; fighters fighting through a
wall; a path that needs a locked door; frame time with fifty people and their shadows at night.

**Gate:** in a dozen towns nobody is ever stuck, the town's answer builds over a minute or two instead of arriving at
once, and the frame holds on Robin's machine (the frame log will say).

## 9. Rung 6: the raid, made interesting

**Decided already (2026-10-07):** about twenty minutes; loot spread out behind doors to break (the storehouse, the church
silver, the hall's chest, a hidden cellar); the heavy loot carried to the ship one piece at a time, hirdmen helping; the
walk to the shore the gamble and the retreat under pursuit; the defenders gather to the noise; fighting is **not** the
biggest part; nothing is off limits and reputation is the only brake.

So the raid is not "win the battle of rung 5". It is **how much you dare to take before the town is on you.** What makes
that interesting (suggestions, each to be tried on this rung and kept only if it earns its place):

1. **The quiet before.** Until the first noise the town is at its day. What you see from the shore tells you things: how
   many at the gate, where the hall is, a back gate, smoke from the smithy. A raid starts with a look, and a way in.
2. **Noise is the clock.** Every door broken and every blow struck wakes more of the town, further off. Quiet things
   (an unlocked store, a man taken from behind, the cellar nobody guards) buy time; loud things (the church door, the
   hall) spend it. No meter on the screen: you hear the town wake (shouts, a dog, running feet) and see it.
3. **The carry.** A chest on the shoulder means no weapon in hand and a slow walk. With the hird: **who carries and who
   guards the carrier** is the choice. One order more: *take it to the ship* (a friend lifts what you point at and goes,
   by the grid). The line of carriers back to the shore is what the defenders will try to cut.
4. **The ship.** Someone holds it. If the shore is lost, so is the way home. Leaving is a moment: the last man aboard,
   the push off, arrows in the water.
5. **Greed.** The best things are deepest in (the jarl's chest, the church silver) and each one taken makes the walk back
   longer and the town angrier. The raid has no "done": **you choose when it is enough.** That choice is the game.
6. **People.** Thralls held in the hall can be cut loose (they run for your ship, and some will join: `docs/hird.md`).
   A defender who yields can be left, bound and taken, or killed; a priest does not fight. What you do is what the
   reputation remembers.
7. **The rout, both ways.** If their heart breaks they run and the town is yours for a while. If yours does, the retreat
   under pursuit is the fight worth having, and a friend who falls on the way must be carried or left.
8. **After.** The town remembers (traders shut, a price on you, more men at the gate next spring); what you brought home
   becomes stores, silver and people. The calendar's winter rebuilds what nobody claimed.

**What it must not become:** waves, a boss, a bar that fills, a checklist of objectives, a punishment for losing (a lost
raid costs what you could not carry and maybe a friend, not your game).

**Tried:** a scripted raid end to end (land, in at the back gate, the store, the church, carry two chests with three
friends, leave) for timing, and then **only by hand**: this rung is about feel, and the script can only say that it
works, not that it is good. Robin plays it early and often here.

**Gate:** Robin wants to do it again.

## 10. Order and size

| Step | What | Size | Needs Robin |
| --- | --- | --- | --- |
| 0a | The body and three layers on one clip; **measure** | small | |
| 0b | The fight set on the clips we have; guard and hirdmen in the editor | medium | one body or two |
| 0c | Mixamo sitting; new clips; shield, Dane axe | medium | **signed in, one sitting** |
| 1a | Sides in the engine; `strike`; beasts unchanged (the old tests still pass) | medium | |
| 1b | The soldier; shields; yielding; the battle scene and its board | large | how hard is one man |
| 1c | `tests/battle.js`; tune to the table | medium | **plays it** |
| 2 | Slots, flanking, spacing | small | plays it |
| 3 | Friends: follow, engage, orders, down or dead, colours | large | down or dead; colours; the key |
| 4 | Groups: targets, the line, heart, the camera | medium | plays it |
| 0d | The life set: villagers, priest, merchant, child, elder, Brokk | large | (can run beside 2 to 4) |
| 5a | Way-finding from the building data; chokepoints | large | |
| 5b | The town filled; posts; noise; bows | large | how many is full; **plays it** |
| 6 | The raid's loop: the quiet, the carry order, the ship, greed, people, after | large, and open-ended | **plays it, often** |

The fight (1 to 4) can start on the **draugr's sheets** the day the engine has sides: he is a man with a sword and a
shield and all seven clips, and already in the game's files. So A and B do not wait on each other, and the Mixamo sitting
does not hold anything up.

## 11. What I need from Robin

1. **One body for everyone, or a second for women?** (3.1)
2. **A sitting signed in to Mixamo** for about sixteen clips. (3.2)
3. **How hard is one hirdman?** An even match for a careless hero, or less? (4.3)
4. **Do beasts and men fight each other?** A wolf pack and a village's guards in the same night. (4.4)
5. **A friend who falls: dead, or down until the fight is over?** (6)
6. **Your colours:** chosen by the player, or given? **The order key**, and are "with me" and "hold here" enough? (6)
7. **How many is a full town?** (8)
8. **The raid's list (9):** anything there that is wrong for this game, or missing?
9. **Where this lives while it is made:** a test scene only, as planned here, or the big island's own villages as soon as
   rung 1 passes?

## 12. The ladder on one page

| | Rung | Done when |
| --- | --- | --- |
| 0 | People in Blender | thirty rolled people beside the hero look of one world; a village with no drawn figure in it; forty on screen at speed |
| 1 | One hirdman | the three bots land in the agreed table; each weapon has its reason against a shield; Robin: "a man feels like a man" |
| 2 | Two | worse than one, never a lock the hero could not have left; nobody stuck in a thousand fights |
| 3 | Two, and one with you | a friend helps and does not win it for you; you always know which is yours |
| 4 | Five against five | equal sides are an even coin over a thousand fights; no knot, no endless chase; the frame holds |
| 5 | A town, attacked | nobody ever stuck in a dozen towns; the town's answer builds, it does not arrive |
| 6 | The raid | Robin wants to do it again |
