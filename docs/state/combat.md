# Combat (`src/combat.js`)

How this part of the game stands now, moved out of `CLAUDE.md` on 2026-10-27 (the doctor: it was read at every start). Keep it current, as `CLAUDE.md` was: what is true now, Robin's decisions marked as his.


- **Enemy types:** `beast` (every animal), `brute` (the arena's bear: chains and a spin, a stagger bar), `shooter`,
  `soldier` (a man). Pages dress them (`api.dress`, `api.dressMan`); undressed they draw as a plain ink beast. No boss type.
  Collision is circles only (`W.pillars`; big maps pass only the solids near the hero).
- **The hooks a page uses:** `api.scene` (`begin`, `items`, `end`, `boards`, `bounds`, `walk`, `heroLift`, `noHud`,
  `ownFallen`), `pixelScale`, `roster`, `dress`, `items` (`held`, `tool`, `weapon`), `harvest`, `mods()`, `armor`, `shield`,
  `sfx(n, v, src, x)`, `onLog`, `overlay`, `parryWindow`, `meleeStep`, `struck` (people the hero's blows can hit), `nav`,
  `onNoise`, `onBlood`, `enemySprite`, `heroSprite`, `hudBars` (a page draws the health and stamina bars itself when it returns true).
- **One spec of numbers: `Combat.tune(over)`** lays a page's differences over `tuneDefaults()` and writes them in place: the
  feel (`WPRE.snappy`: fz 0.75, pf, kb), `PARRY`, `MEN.parryStun`, `TOOL_DMG`, each melee kind's `PROFILES`, `MEN`, and each
  beast's `BEAST_GAME` numbers with the art library's health, speed and windup (`beastNum`, `tuneBeast`). The game applies
  `game.combat` from the arena. **The arena plays from its own working copy (`combatarena.tune`); the game gets those numbers
  only by Use in the game** (the line under the Tuning panel says whether the game has them). **Change a default by changing
  `PROFILES`, `MEN`, `BEAST_GAME` or `WPRE`.** The men are
  armed from `MAN_PF`, a copy of `PROFILES` taken before the hero's tuning, so the hero's weapon numbers are his alone.
  Robin's first tuning (2026-10-15, "this feels good") is the default: the sword wu 0.11, ac 0.4, rec 0.2, reach 50, lunge
  123; the boar's speed 1.1. **The sword's blows (and the fists') take their pace from `STEPS`, the chain of three, not `PROFILES.sword`** (found 2026-10-20); **since 2026-10-26 the arena's sword sliders move that chain** (Robin: "Wire the sliders to the chain's pace"): the tune group `sword` (`SWORD`, `swordStep`: the blow, recovery, damage, reach, arc, step, push and stagger, each scaling all three blows by its share of the first's), its defaults the chain's first blow, so every saved tuning plays exactly as before; the windup stays the press-start. **The player's blows start on the
  press** (Robin, 2026-10-20): every kind's wu 0.03 (the Dane axe 0.15, its weight), `STEPS` 0.03 (0.06 on the chain's last);
  a charged blow keeps its hold; the men keep theirs. **The men retuned to it (mine, 2026-10-20): `MEN.dmg` 18, was 12**, the one
  number that brings `tests/battle.js ladder` back to its targets (the tapping bot wins half against one axe-man in leather,
  the careful bot three in four against two, five against five a coin; `tools/sweepmen.js` has the sweep); `docs/for-robin.md`.
- **Weapons** (`docs/weapons.md`): six melee kinds, each with a motion, reach, arc, pace, chain and one thing of its own: the
  sword parries, the axe breaks a guard, the club staggers, the seax crits, the spear pierces (and stabs: the `thrust` clip),
  the Dane axe is heavy (two-handed, not to be parried); a weight each (`wt`: seax 0.6, spear 0.9, sword 1, axe 1.25, club
  1.5, Dane axe 1.8) sets the pause, the ring and the sound of a hit. `tests/blows.js` prints each weapon's numbers and flags
  a contradiction of the doc. Ranged: the bow (no arrows needed for now), sling, javelin, throwing axe. A hit lands within
  reach plus the foe's radius plus 2, and the hero steps into a blow toward a foe (a little at the air).
- **The guard is made of what you hold** (`GUARD`, `guardKind`, Robin 2026-10-16): **a parry stops all of a blow** whatever it
  is made with, but stuns for less with a weapon (half) or a tool; a block lets through a fifth with a shield (Robin: it stops
  80%, more with a better shield: the page's `api.shieldThrough`, wood 0.2 to iron 0.12), half with a weapon, most with a tool or
  the bare arm; only a shield stops arrows; a tool can block (gather mode raises a guard too). Arcs 1.9 (shield) to 1.2. No shield with a bow or a Dane axe (`TWO_HANDS`,
  mine). **The guard turns you to the threat** (Robin, 2026-10-15: the foe whose blow lands soonest, else the nearest;
  `GUARD_FACE`, `S.guardFace`) and walking does not turn you while it is up. K late in a recovery raises it.
- **Fighting two or three at once** (`CROWD`, 2026-10-23, Robin: "being able to fight 2 or 3 at a time in a reasonable way"; the numbers mine, first settings, sliders under "feel" in the arena's Tuning panel, 0 turns one off; `docs/combat-crowd.md`): **the parry's shock** (a parry staggers every other man within `shockR` 80 in front of you for `shockT` 0.45 s, `crowdShock`), **the finishing blow's fear** (the men within `fearR` 130 of a man who takes it stand frozen `fearT` 0.8 s with their guards down, `crowdFear`) and **the shield bash** (Robin, 2026-10-23: "only be able to be used when the enemy is blocking, to break their block", then "bash all the time" with low damage off a block; the blow key with the guard held, so J or the left button while K or the right button is down, "holding mouse2 and doing mouse1": the man before you within `shoveReach` 36 **with his guard up** has his block broken (no guard again for `breakCd` 1.4 s), is thrown back `shoveD` 380 as a push, about a hero's length, and staggers `shoveT` 0.55 s, and a man he is thrown into staggers with him; `shoveSt` 14 stamina, once in `shoveCd` 1.1 s; **the bash comes always** (Robin, later the same day: "you should be able to bash all the time, but if it doesnt hit a block, it just does low damage"): a man with his guard down takes `bashDmg` 0.35 of the held weapon's blow and a push of `bashKb` 90, nobody in front is a bash at the air, the stamina spent either way; without a shield the shoulder does it at `shoulderK` 0.7 (Robin: "just bash by hitting with your shoulder"); the clips `bash` and `bash_wpn` are Colin, AD's (his `hero_bash` of 2026-10-23, 8 frames at 26.67 fps, contact 3, in `KEEP_HERO`), played through `bashT` 0.3 s on the shove and on a bash started as a blow by its phases; `crowdShove`). The bots neither shove nor go for a staggered man, so `tests/battle.js two` and the new `three` (against three) barely move with them; Robin judges by hand.
- **The parry and what follows** (Robin's picks, 2026-10-15; the numbers are mine): a parry stuns (`MEN.parryStun` 1.0 s);
  the foe reels through your blows and comes out swinging, so you parry again: **the chain** (`CHAIN`: up to x4 within 4.5 s,
  each a longer stun and harder blows on him). **Balance** (`POSTURE`): an amber bar that a parry, a perfect dodge, a blocked
  blow and a landed blow fill; full, or at a chain of four, he is open: **the finishing blow** kills a foe of 40 health or
  less and takes a third of a bigger one. **The win-back** (`RALLY`): half of a blow that gets through shows as a stretch on
  your bar that your next blows win back. **The tell:** every windup shows a glint over the attacker, white for a blow you
  can parry, red for one you cannot (a Dane axe, a heavy beast blow). **The perfect dodge** (`PERFECT`): a dash in the last
  0.18 s before a blow slows time, gives stamina back, fills his balance and leaves him exposed. Measured by `tests/parry.js`.
- **Beasts:** a light hit does not stagger a beast; a heavy one (the chain's last, a charged blow, any blow of stagger 20 or
  more, so every club blow) staggers it 0.34 s, and then **no blow staggers it again for `BEAST_POISE` 1.1 s** (mine,
  2026-10-15: the club stun-locked a bear). The hero's blows are paced (a sword blow about 0.55 s whole).
- **Sound:** the engine calls `sfx(name, v, src, x)` (`x` = the weapon's kind, weight, heaviness and, for a swing, the lead
  until it lands); a swing is heard from the windup's start so its loudest moment comes on the hit.

**A struck beast holds a grudge** (Robin, 2026-10-30: "enemies dont aggro if you shoot them from far enough. So you can effectively hit boars from afar until they die"): a beast the hero strikes (not a shy one, not a tame one) keeps coming for `BEAST_GRUDGE.t` 12 s after the blow, however far it was shot from, unless he is farther than `BEAST_GRUDGE.far` 900 (`e.grudgeT`, set in `damageEnemy`, run where a calm beast wakes and calms). Before, it woke and calmed again on the next frame when the hero stood past its calm-down reach (aggro times 2.6: 195 for a boar), which the bow reaches. `tests/grudge.js` (in `npm test`): a boar shot from 150, 220 and 280 comes and strikes; on the old engine it stood still past 195.

**A fleeing beast and the shore** (Robin, 2026-10-30: deer chased to the water got stuck and were easily killed): `fleeStep` tries fifteen headings round the whole circle, for every fleer, not only the shy; a probe counts dry ground 10 and walkable shallows 6 a step (it used to stop at the first wet step, so in the shallows every heading scored nothing and the deer took straight away, out to sea, and stood there); headings past a hunter within 110 cost more; it keeps its heading a little; running up against something it chooses again at once; a herd's follower takes its watcher's heading only if its own way is open. `tests/fleeshore.js` (in `npm test`): a deer in wide shallows, driven by a hunter, on a straight shore and in a corner: on the old engine it stood 7 and 11 s of 12; now it never stands.

**No weapons in deep water** (Robin, 2026-10-30: only shallow water): the page's `api.noArms` (`swim.on`) clears the attack and guard buttons at the top of `updatePlayer` and stops a swing, guard, draw, throw or trap under way; the buttons must be pressed again once out. Wading fights as on land. `tests/bow.js` checks it.

**Aboard, hunters leave** (Robin, 2026-10-30: "if you enter a boat they should just leave"; this replaces the older "pursuit to your ship"): with `api.afloat` (the page: `raft.aboard`) a beast that is not a fleer stops hunting, loses its grudge and wanders where it stands, and does not wake until he is ashore; for the men of side 0 he is no target (`eachFoe`, `heroAfloat`), and one with nobody else to fight walks back to his post. His own men on the shore are still fought. Bowmen stop shooting at him too, so a Raider's shields only stop what is already in the air. `tests/afloat.js` (in `npm test`).

**Armor is points** (Robin, 2026-10-31, with his two pictures of X / (X + K) and effective health; `Items.ARMOR_K` 10, `Items.armorShare`, `Items.effectiveHealth`, mine: K): worn pieces add up (leather: helmet 1, tunic 3, trousers 1, boots 1, cloak 1, a whole set 7, 41%; iron 15, 60%; a shield 1 and up), the share is X / (X + 10) with no cap, and every point is worth +10% of his health: effective health = health x (1 + X / 10). Against the game's blows (health 100): a boar's 14 is 8 at leather, a wolf's 22 is 13, a bear's 30 is 12 at iron, a troll's 40 is 16 at iron. The Tab screen shows Armor and Effective health. **Men's armor is still a share** (`e.armor`, 0 to 0.4), to convert when they get worn gear. **A first arrow at a calm beast** that has not been struck is a critical, and an arrow's critical doubles (a blow's 1.5): the deer has 4.4 health (`BEAST_GAME`), three arrows, two with a critical. **The deer:** it notices at 140 before it (230 until 2026-10-31; 63 behind it, half that sneaking), runs to 448 and at `SHY.run0` 1.45 of its walk (143 a second; he sprints at 130; 1.7 before). A tool's swing turns to what it would gather, as a punch does.
