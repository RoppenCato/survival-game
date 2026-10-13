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
| battle.js | fights between men (docs/battle-plan.md): the hero played by three bots (a tapper, a careful one, a skilled one, each with a person's reaction time) against one hirdman and two, a friend alone against his equal, two with a friend beside you, five against five; who won how often, how long, what was left. `!!` marks a fault: a fight that never ended, a man stood still, a NaN. `node tests/battle.js one 200` for one rung at length Since rung 5 also: bowmen (alone, behind a line, behind their own man, at a wall, with a man on them) and a town (`town [n] [secs]`: n towns grown as the game grows them, the hero and five friends in at each gate against twenty; when the town was up, when the last man met them, who stood still, what an update cost; a noise with nobody there; a line held before the gate). And the raid's rules in the engine (`raid`): the blow from behind on a man who has noticed nothing, the errand. The raid itself is played in the page by `tools/visual/raidplay.js`. |
| balance.js | (not in `npm test`) a tap-swinging bot against each animal, with stick or flint sword, with and without leather: time, health lost, deaths |

Some scripts also write PNG images into the current folder. Delete them any time.
