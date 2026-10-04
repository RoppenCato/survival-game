# Tests

Headless checks that run the combat simulation in Node with a fake canvas
(`@napi-rs/canvas`), so no browser is needed.

Run everything: `npm install` once, then `npm test` from the project root.

| Script | What it checks |
| --- | --- |
| ctest2.js | melee reach, body collision, enemy spacing, move speed, parry, auto ranged |
| ctest4.js | dash distance, backstep, dash i-frames, turn speed |
| btest3.js | bossbot lunge can be parried, spin can be dashed |
| btest.js | charge attack timing, bossbot attack mix |
| ktest.js | crit rate and damage, rattle effect, light kill slow-mo |
| turntest.js | attacking enemies behind you, held-direction aim, turning in recovery |
| sprinttest.js | sprint speed and stamina drain |
| wtest2.js | hit weight presets (pause lengths and knockback) |
| fuzz.js | random inputs across aim modes: no crashes, no NaNs |

Some scripts also write PNG images into the current folder. Delete them any time.
