# The rune trial of 2026-10-24: Robin's verdicts, and what became of them

Robin went through every rune in the Combat Arena's Rune trial on 2026-10-24 and exported his notes. His words are kept here as he
wrote them; the column after each says what the Game Developer did with it (Clive, GD). The ids stay the code's; the names Robin gave
are the game's, placeholders for Alistair, LD where they are new.

## Keep (9)

keenEye, slide (at tier II), lunge, overhead, twinShot, keenNose, strongBack, woodwright, sharedBlood (the pet chapter's, data only).

## Retire (28)

lastStand, ironSkin, windFoot, sureFoot, whirl ("We have the newly added Whirlwind. The Dane axe needs a big rework on animation tho.
It should be held with two hands and swing appropriately."), feint, hawkEye, longOar, farSight, sealSkin, starRoad, wreckersEye,
quietBlade, lockBreaker, ravenCall, heavyBack, torchHand, shieldWall, hearthsGift, secondPortion, smokeAndSalt, warmBelly, packBond,
trackersNose, loyalHeart, fenrirsJaw, allfathersEye, midgardsWall.

**Done:** out of the library, the storm's offer, the arena's panel and the Rune Browser (`Runes2.RETIRED` keeps their ids and names
for the record; a save that knew one simply forgets it). The engine's code for them is removed where it stood alone and left dormant
where it shares a path (it answers to a rune nobody can hold).

## Change (36): Robin's words, and the state

| Rune | Robin | State |
| --- | --- | --- |
| bash | When bashing an enemy that isnt blocking, there should be a little pushback. When the enemy is blocking there shouldnt be a pushback, so that you can attack him right away. It should stun him for less time than a parry. | done: a bash on a raised shield breaks it and staggers him `CROWD.bashStun` 0.6 s (a parry's stun is 1.0) with no throw; off a block the low blow and the push as before |
| charge | I think it should be more like a crowd control. So that it knocks a man down, that slowly gets up over 3 seconds. During that time he doesnt take damage. The idea is that you would charge into an enemy and handle the other, if there are two for example. Maybe this should be another ability tho. Charge sounds more like in world of warcraft, where you charge in and stun the target. | done: the first man in the way goes down for 3 s and takes no damage while down (`e.downT`, `e.noHarm`); the rush stops at him |
| dash | I like the idea, but i think what it should do instead is that it only works when the target is attacking (like a parry) and then you dash through and hit from behind. The target doesnt get stunned but is facing the wrong direction for 1 second. | done: the Dash passes through a man in his windup and he keeps facing the way he was for 1 s (`e.wrongWay`); a dash at a man not attacking is a plain dash |
| roll | This is not a roll, its the same dash as the normal dash. Lets change it to "Sidestep", where you dash 90 degrees around your target, avoiding their hit. | done: the Sidestep, a dash a quarter turn round the man before you (`sidestep`) |
| thorsFell | Doesnt seem to work. Change it to "Throwing Axe". Your axe is now a throwable tool/weapon (bad weapon). Have it swing around when thrown. Im thinking it gets a slight cooldown, like 0,5-1 sec. But does more damage to trees to compensate. YOu need to try it. It should be slightly better than chopping normally and fun to use. | done: the Throwing axe (swing slot, gathering): J with the axe in hand throws it spinning, it bites a tree for 1.5 blows and comes back to the hand after 0.7 s (`axeThrow`); a man it hits takes a bad weapon's blow |
| thorsWrath | Im thinking maybe 10% chance, stunning for 1s. There needs to be a small lightning effect on the target when it happens. | done: 10 %, a stun of 1 s, the bolt drawn on him (`lightning_small` sound) |
| bloodlust | 5% health | done: 5 % of top health a kill |
| rushStep | I like the idea, but it seems inconsistent. I tried attacking and hitting space and it seemed to work 1/10 times. Also if the target attacks at the same time it ends up as a dodge instead. I think it should be more consistent. If you hit the target then space, it should do the knock down which would override dodge if it happens to be the same time as the target attacking. | done: a man struck within 1.2 s is the rush's mark; the dash at him knocks him down whatever he is doing, before the dodge (`rushMark`) |
| catFoot | I think this should change to "You move at 80% speed when sneaking and are less likely to be detected". When we introduce sneaking (on ctrl i think) we probably put standard on 50%. Rename it to something more fitting (but cat something) | done: **sneaking** is in (Ctrl held: half pace, a man hears you from half as far); the rune, Cat's tread: 80 % pace and a third of the hearing |
| stormsEye | Can only be used with a blunt weapon. Change that on thors wrath too. | done: both only with a club or a maul (`BLUNT`) |
| hammer | Too overpowered. Instead lets do "A charged blow with a blunt weapon destroys the targets shield". Needs their shield shattering animation, and the target stunned for 0,5 second. | done: a charged blunt blow on a raised shield shatters it (gone for the fight, splinters drawn, `shield_break` sound asked) and stuns 0.5 s; the shattering clip asked of Colin, AD |
| thickHide | Instead, double the amount you can heal up, and 1,5 the time you have to hit the health back. You know the effect when you get hit and can hit mobs to get the health back. Temporal health or whatever they call it. | done: the win-back (`RALLY`) doubled and its time 1.5 times |
| axeBreaker | Too overpowered. Maybe axe has a 50% chance to break and stagger a shield up. | done: an axe breaks a raised shield half the time and staggers then |
| serpentTongue | Needs balancing, the whole weapon needs balancing. But its interesting. The bleed needs to visible, the target dripping blood, and it should show somehow on their health how much will bleed. | done: the bleed drips (drops under the man) and his bar shows the bleed to come as a darker band; the seax's own balance waits for Robin's play |
| spearWall | Doesnt work well in practice. Enemies rarely gather up in a line. Instead, change this to "Reckless thrust". It makes the charge attack (holding Mouse1) into a multiple fast stabbing attacks for 1,5sec. We should change the spear in general to go past shields 25% of the times (as spears are easier to go through) and with this attack it passes through 50% of the attack. | done: the Reckless thrust, a held spear blow released as 1.5 s of fast stabs; the spear passes a raised shield a quarter of the time, half during the thrusts (`SPEAR_PASS`) |
| ringOfSteel | Change it to 5 original, and 10 with sword. So that sword feels a lot easier and better with parry. Rename it to "Counter King". | done: Counter King: the chain 5 long, 10 with a sword |
| berserk | Doesnt seem to do anything. But change it to "When under 50% health, damage is increased by 50%-current health and a blow that would kill you sets you to 1 health, unless you are already at 1 health". You'll need to write it better so it makes sense tho. And the bonus should only be for melee damage. | done: under half health every melee blow does more by the share of health you lack below half (at a quarter health a quarter more, at the last point half more), and a blow that would kill you leaves you one health unless you are at one already |
| oakArm | Rename to "The oak". Change to "Blocking with a two-handed blunt weapon reduces damage taken to at most 6% of total health, increasing by 2% for every hit taken when blocking. Getting hit while not blocking reset this." But write the text better so it makes sense. | done: The oak, with the maul (the new two-handed blunt weapon): a blocked blow takes at most 6 % of your health, 2 % more each blow blocked in a row, reset by a blow taken unguarded |
| twinBlow | Dont really understand this skill. Also you need to rework the Dane axe so that it is two-handed and not used with a shield. We also need two-handed blunt weapons. Lets change this skill to "Whirlwind". Charging an attack causes a spinning attack, hitting everything around the hero. | done: the Whirlwind (hand slot): a held blow with a two-handed weapon spins, every man round you hit, on Colin, AD's whirl clip; **the maul** is the two-handed blunt weapon (`Items` kind `maul`, iron, no shield, its clips asked of Colin, AD); the Dane axe was two-handed already (`TWO_HANDS`), its swing clips asked |
| lastStand, ironSkin | retire | out |
| stoneGuard | Change it so that it blocks more damage and blocks all damage from normal arrows. That way you can build some sort of defensive character rushing in when raiding. | done: a shield lets a tenth through, not a fifth, and stops an arrow whole |
| riposte | Change it so that if you hit a target from the back, that is stunned, it knocks him away some meters and down on the ground for 2 seconds. That way you can parry and then run around and hit in the back. | done: a blow from behind on a stunned man throws him some metres and down for 2 s |
| warCry | Every enemy within range puts up their guard/block and moves backward slowly for 1,5 sec. Any men of yours (or pet) gains 25% increased damage for 4 seconds. | done: every man within hearing covers and backs off 1.5 s; your men a quarter harder for 4 s |
| blinkStep | Call it shadowstep, only usable with seax. Show up behind the target (poof of quick smoke by the feet of the hero), the target is confused until hit, or up to 1,5sec. | done: the Shadowstep, with the seax only, a puff of smoke at his feet, the man confused (no blow, no turn) until struck or 1.5 s |
| longLeap | Call it The leap. | done |
| ghostStep | Call it "The shade". I also dont see any shade, it should be some light blue translucent shadow where you left from, it should survive 2 hits | done: The shade, drawn as a pale blue translucent hero where you left, the men strike at it, gone after two hits |
| windFoot, sureFoot | retire | out |
| hunterStride | Makes the normal animals friendly unless attacked. This then makes it easier to tame, capture etc. | done: with it the boar, the deer and the rest go for nobody unless struck |
| whirl, feint | retire | out (the whirl clip serves the Whirlwind) |
| sweep | Charging the attack with spear for a swing around the ground, breaking blocks and staggering every enemy around. | done: a held spear blow sweeps the ground round you, every man's guard broken and staggered |
| pinningShot | Change this to traps. We need another name for it. What I want is for when bow is equipped and you hold mouse1, you load like the bow, but you get a target by your mouse and open a small menu by the mouse. You can scroll the menu while holding mouse1 to choose different traps. Releasing mouse1 on a chosen trap then makes the hero throw the trap at the location. The trap then activates after 3 seconds (shown with a small timer above the trap). The traps could be: Tripper, binds the target to the spot for 4 seconds. Poison, poisons the target for X damage (dependant on your bow attack) | done: **the Trapper** (shot slot): with the bow in hand, the left button held opens a small ring by the mouse with the traps, the wheel picks one, letting go throws it where the mouse is; it arms after 3 s with a small timer over it; the Tripper binds the first man or beast on it for 4 s, the Poison poisons him for the bow's damage over 6 s; the pictures drawn in code until Colin, AD's |
| fireArrow | Deals half normal damage and half fire damage, 25% chance for target to catch on fire, burning for additional 25% damage and slowing their movement while burning. No torch ever. | done: no torch; half the blow at once and half as fire; one in four catches, burning a quarter more and slowed; a full draw as before |
| hawkEye | retire | out |
| bleedingPoint | Shooting a bleeding target does 25% extra damage and increases chance for more bleeding. | done: an arrow in a bleeding man or beast does a quarter more and bleeds him further |
| quickDraw | Change to "Aimed shot". The draw can be filled twice as long for more than twice the damage. So for example, if original full draw did 10 damage, a full draw with this does 25. It should show as two bars on top next to each other so you can still charge to the "normal full" if you want. | done: the Aimed shot: the draw goes on past full for as long again, to two and a half times the damage; the cue over his head shows the two arcs side by side |
| stillHand | Standing still while shooting gives a 15% chance to hit a targets sensitive points, causing the target to bleed for 25% of the damage over 5 seconds. (You need to try this over and over to see how balanced it is). Rename to Weak spot master. | done: Weak spot master: shot standing still, 15 % to find the weak spot, a bleed of a quarter of the blow over 5 s |
| stoneBiter | Charging a mining attack creates a weak spot on the rock after the hit. | done: a held pick blow leaves the rock's sweet spot where it struck |
| greenThumb | Change to "Sugar rush". Picking berries gives you a Sugar rush buff that gives you 10% extra movement speed. Lasting 2 min or until taking damage, swimming or losing control of your character. | done: Sugar rush: berries picked give a tenth more pace for 2 min, lost to a blow, the water or a fall |
| keenNose, strongBack, woodwright | keep | kept |
| quickHands | Chopping wood gets you worked up, getting a stacking buff lasting 20 seconds. Stacking for every hit up to 50, increasing damage dealt to trees by 2% for each stack. Change to a better name. | done: the Woodcutter's fever (`LORE?`): every blow on a tree a stack to 50, each 2 % more on trees, gone 20 s after the last |
| followingWind | Sailing with the wind gives an extra 20% speed bonus. | done |
| longOar, farSight, sealSkin, starRoad, wreckersEye, quietBlade, lockBreaker, ravenCall, heavyBack, torchHand, shieldWall, hearthsGift, secondPortion, smokeAndSalt, warmBelly, packBond, trackersNose, loyalHeart, fenrirsJaw, allfathersEye, midgardsWall | retire | out |

## Asked of the studios

- Colin, AD: the shield shattering (the splinters), the maul (a two-handed hammer in the hand and its swings), the Dane axe held in
  two hands with its swings, the throwing axe's spin, the smoke puff of the Shadowstep, the trap pieces (the Tripper's snare, the
  Poison's pot) and the Trapper's ring.
- Derek, SD: `shield_break`, `axe_throw` and `axe_catch`, `trap_arm`, `trap_snap`, `shadowstep`.
- Alistair, LD: the new names (Cat's tread, Counter King, The oak, the Whirlwind, the Reckless thrust, the Shadowstep, The shade, the
  Trapper, the Aimed shot, Weak spot master, Sugar rush, the Woodcutter's fever) and the words of every changed rune.
