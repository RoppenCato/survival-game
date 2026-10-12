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
| balance.js | (not in `npm test`) a tap-swinging bot against each animal, with stick or flint sword, with and without leather: time, health lost, deaths |

Some scripts also write PNG images into the current folder. Delete them any time.
