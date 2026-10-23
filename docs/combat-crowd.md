# Fighting two or three at once (2026-10-23)

A proposal with three things built for Robin to try, and more to choose from. Robin, 2026-10-23: "I like the parry system we
have now and it makes it interesting. I think if we could add more things that makes it feel even more snappy and exciting to
fight that would be great. For example being able to fight 2 or 3 at a time in a reasonable way. Right now its hard to parry
two targets for example, which makes sense, and it cant be too easy, but i feel like maybe theres something we could do/add."

## What the fight against several is today

The engine already keeps a crowd from being a wall of blows (`MEN`, `Combat.WAYS`, `duel` since the trial of 2026-10-21): one
man comes at you first and a second joins after six seconds, never a third (`onHero` 2, `joinAfter` 6); at most two strike one
target at once (`slots`); no two blows land on you within 0.75 s (`gapHero`); the men stand round the side of you that faces
their middle (`slotAngle`); the guard turns to the man whose blow lands soonest (`GUARD_FACE`); a parry stuns one man about a
second and starts the chain on him.

Measured by the bots (`tests/battle.js two`, `three`, 8 fights a line, an iron sword in leather against men in leather or
mail): against two, the tapping bot never wins, the careful one about four in five, the skilled one always; against three, the
careful bot wins one in two, the skilled always, in 25 to 35 s. So two or three is winnable by timing alone; what Robin feels
is that a human cannot keep the timing against two coming from two sides: the parry window is 0.22 s, the second blow comes
from another angle 0.75 s or more after the first, and the guard has to be raised again for it.

## Built, for Robin to feel (`CROWD` in `src/combat.js`, the numbers mine; every one is a slider under "feel" in the Combat
Arena's Tuning panel, 0 turns it off; Use in the game hands them to the game as the rest)

1. **The parry's shock.** A parry staggers every other man within 80 units in front of you for 0.45 s (`shockR`, `shockArc`,
   `shockT`). The man beside the one you parried flinches, so his blow comes later: one parry buys the moment for the next.
   A pale ring from your feet shows it.
2. **The finishing blow's fear.** When a man takes the finishing blow (the chain's top, or his balance broken), the men within
   130 units stand frozen 0.8 s with their guards down (`fearR`, `fearT`). The showpiece of the chain becomes the turn of the
   fight: you finish one and have the next one open.
3. **The shield bash** (Robin's decisions of 2026-10-23: "only be able to be used when the enemy is blocking, to break their block";
   "if you are using a weapon without a shield, you should be able to just bash by hitting with your shoulder"). J with the guard up
   (K held) is a bash: the man before you within 36 units **with his guard up** has his block broken (as the axe breaks it; no guard
   again for `breakCd` 1.4 s), is thrown back about a hero's length (`shoveD` 380 as a push) and staggers 0.55 s, and a man he is
   thrown into staggers with him (`shoveT`, `bump`); it costs 14 stamina and comes once in 1.1 s (`shoveSt`, `shoveCd`). With no
   blocking man before you nothing happens and nothing is spent. Without a shield the shoulder does it at 0.7 of the throw
   (`shoulderK`, mine). The clips `bash` and `bash_wpn` (the shoulder) are asked of Colin, AD; until they come the block is held
   through the move (`bashT` 0.3 s).

The bots do not use the shove and do not go for a staggered man, so their numbers barely move with these on (the careful bot
left the three-man fights with a little more health). What they change is what a player can do with his hands, which only
Robin can judge: the arena's "Two" and "Three against your line" set pieces, and the Battle test's rows.

## More to choose from (not built)

4. **The parry carries over.** For 0.25 s after a parry the guard counts as a parry against any other man's blow, so two
   blows that come close together are both turned. Cheap to build; it makes the hardest moment (two at once) the one the
   parry answers. Risk: with `gapHero` 0.75 it would rarely fire; it would want `gapHero` down to about 0.4 for pairs, which
   makes pairs feel more dangerous and the carry-over the reward.
5. **The tell shows the order.** When two men wind up, the glint over the one whose blow lands first is bigger and the other's
   smaller, so the player knows which to parry first; or a short line from the nearer glint to you. Reading, not mechanics.
6. **The sweep.** A charged blow with an axe or the Dane axe hits every man in its arc (the sword's and seax's stay one), and
   the spear's thrust goes through the first man into the one behind him in a line. The weapons' one thing each grows a crowd
   use: the axe for groups, the spear for lines, the sword for the chain.
7. **A kill is a breath.** Every man killed (not only by the finishing blow) gives the others within reach 0.4 s of hesitation,
   smaller than the fear. Historical enough (a man falls, the line wavers), and it paces the fight: each kill resets the crowd.
8. **The step back.** Holding S with the guard up walks backward at the guard's pace facing the men, and the men following you
   bunch into a line as they come through a door or between two trees; with the shove and the trees of the world this is the
   player's way to make a crowd a queue. Mostly there already (the guard walk); it wants the men to keep in file when the
   ground narrows (the nav's doorway rule, loosened to trees).
9. **The riposte to the second man.** After a parry the next blow can be turned on another man within reach with a tap of A or
   D (the blow goes to the side pressed instead of to the parried man), with the chain's bonus. It makes the chain a thing
   across the crowd instead of one man at a time; it is the one of these that changes the feel most and the dearest to tune.

## What to measure once Robin has chosen

`tests/battle.js two 8` and `three 8` with `CROWD='{"shockT":0,"fearT":0}'` against the defaults; a shoving bot (the careful bot
pressing J with the guard up when two men stand within reach) if the shove is kept; `tests/parry.js` unchanged.
