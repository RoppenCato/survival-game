# Tests

Headless checks that run the combat simulation in Node with a fake canvas
(`@napi-rs/canvas`), so no browser is needed.

Run everything: `npm install` once, then `npm test` from the project root.

| Script | What it checks |
| --- | --- |
| ctest2.js | melee reach, body collision, enemy spacing, move speed, parry, auto ranged |
| ctest4.js | dash distance, backstep, dash i-frames, turn speed |
| btest3.js | brute lunge can be parried, spin can be dashed |
| btest.js | charge attack timing, brute attack mix |
| ktest.js | crit rate and damage, rattle effect, light kill slow-mo |
| turntest.js | attacking enemies behind you, held-direction aim, turning in recovery |
| sprinttest.js | sprint speed and stamina drain |
| wtest2.js | hit weight presets (pause lengths and knockback) |
| fuzz.js | random inputs across aim modes: no crashes, no NaNs |
| cave.js | the troll's cave, the old mine and the sea cave laid out for twelve seeds: every part and every find walked to from the way in (a NO is a fault), what stands in them, the distance from light to light, the mine's timber and its fall of rock, how much of the sea cave is under water |
| ambient.js | the ambient sound's logic on a pretend audio context: twenty minutes in each of twelve places; how many of each sound a minute, the beds' loudness, and a flag for a sound that does not belong (birds in a cave, crickets by day) or sounds piling up |
| deer.js | the wounded deer and the herd (2026-10-14): three deer and the hero come at from behind (the watcher sees him at 230, the grazers run with him); a grazer alone noticed at about 103; an unhurt deer against one shot once (its pace a second, where it stops, when it bleeds out, the drops and pools of blood), and a second arrow on the standing deer. `!!` marks a fault. |
| parry.js | the parry chain (2026-10-15): a parrying bot and a bot that only blocks, each against a man with a sword and a shield, an axeman, a spearman in mail, a boar and a wolf: won, how long, health left, parries, the longest chain, and the share of blows landed on a reeling foe. `CHAIN='{...}'` tries the chain's numbers. |
| blows.js | the feel of one blow (combat rung 1, 2026-10-13): every melee weapon of the hero swung at a man who stands still: press to the landing, the chain when the button is pressed on (hits in 4 s, the beats between, hits a minute), what a blow does to a man in leather and how many put him down, the reach with the step into it, the half-angle a blow still lands at, the push, the breath; then the men's blows (their windup, their blow on the hero in leather and in cloth, on a man). A `!!` line is a contradiction of the weapons' characters (a seax reaching as far as a sword, a Dane axe quicker than an axe). `MEN='{...}'` tries the men's numbers |
| battle.js | fights between men (docs/battle-plan.md; `ladder [n]` the ten fights that place the men against the hero, `FIVE_DBG=1` prints the five-fight every two seconds): the hero played by three bots (a tapper, a careful one, a skilled one, each with a person's reaction time) against one hirdman and two, a friend alone against his equal, two with a friend beside you, five against five; who won how often, how long, what was left. `!!` marks a fault: a fight that never ended, a man stood still, a NaN. `node tests/battle.js one 200` for one rung at length Since rung 5 also: bowmen (alone, behind a line, behind their own man, at a wall, with a man on them) and a town (`town [n] [secs]`: n towns grown as the game grows them, the hero and five friends in at each gate against twenty; when the town was up, when the last man met them, who stood still, what an update cost; a noise with nobody there; a line held before the gate). And the raid's rules in the engine (`raid`): the blow from behind on a man who has noticed nothing, the errand. The raid itself is played in the page by `tools/visual/raidplay.js`. |
| ruin.js | breaking in, bringing down, burning and mending (src/ruin.js, docs/destruction.md): the table of what breaks what under an iron axe and an iron pick (blows until it gives, and how far it is heard); a house (how many walls before the roof falls, what is left, mending and raising it); doors; the way through a breach on the way-finding grid; fire (what catches, 60 houses of each kind burnt, sparks over one, two, three and five tiles downwind, in no wind, across and upwind, 300 fires each). A line that begins `!!` is a fault |
| balance.js | (not in `npm test`) a tap-swinging bot against each animal, with stick or flint sword, with and without leather: time, health lost, deaths |

The town test also prints, under every town, **the crowd** (how many of the town stand within 80 units of one of yours, and how many separate fights there are: the measure of "like ants round a target"), and `node tests/battle.js raid` checks the engine's rules for raids one line each (the blow from behind, the errand, pursuit, three against one, a householder, sleepers, the storm order). `MEN='{"onOne":0}'` plays the old way (everybody on the nearest). The raid checks end with **the shield** (2026-10-13): against 10, with K held, what an arrow and a thrown thing cost the hero behind a shield and with none (`Combat.api.shield`). `node tests/battle.js ways [n]` puts the five ways they may come at a man (`Combat.WAYS`) side by side: the same town fights and the same lone fights under each.

The fights are random. To play one again, give `Math.random` a seed: `RSEED=28 node -r ./tools/seedrand.js tests/battle.js town 2` (with `TOWN_DBG=1` the town test prints every man who stands still and what blocks him).

Some scripts also write PNG images into the current folder. Delete them any time.
