# Weapons

Robin, 2026-10-06: "a weapon system that makes weapons different and interesting ... different types of swings and attack
... weaknesses and strengths ... unique to play different weapons." This is the concept, what is built, and what is still
only an idea. The numbers live in `PROFILES` and `RANGED` in `src/combat.js`, the kinds in `src/items.js`.

## The idea

Every weapon answers three questions differently: **how it moves** (a swing in an arc, a thrust straight out, a smash
down from over the shoulder), **what one hit is worth** (damage, how far it throws the beast, how long it staggers it,
how far it reaches, how wide), and **what it costs** (the pace of windup, hit and recover; stamina). A chain of hits ends
in a heavy one. Beyond that each kind has one thing that is its own, so picking a weapon is picking a way to fight, not
a damage number. The first version of every kind is copper (the first metal, on the second island); wood and flint come
before it for the club, the sword and the bow, as now.

## Melee

| Kind | Motion | Reach | Arc | Pace | Hit | Its own thing | Weak |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sword | swing | 34 | wide | quick | 1 | chains of three, the best parry window | nothing stands out; costly in metal |
| Axe | swing | 32 | wide | slower recover | 1.2 | breaks through a guard; also fells trees | slow to recover, so a miss is punished |
| Club | smash | 30 | narrow | slow windup | 0.85 | huge stagger and knockback: it throws beasts back and stuns | low damage, short, slow |
| Seax | thrust | 25 | a line | very fast | 0.6 | crit chance +20%, costs little stamina, finishes the staggered | no reach, stopped by the first thing it hits |
| Spear | thrust | 52 | a line | medium | 1.1 | the longest reach; runs through one beast into the next (pierce) | narrow: a beast at your side is missed; weak in a crowd |
| Dane axe | swing | 44 | huge | very slow | 2 | every hit is heavy; the whole pack goes flying | windup 0.24 s, stamina 13 a swing, no shield in that hand |

The smash lands with dust and a thud; a thrust leaves a straight streak instead of the arc. Chains: sword, axe and seax
three hits, club, spear and Dane axe two. The last hit of a chain is the heavy one (double damage and knockback, more
stagger, longer recover). Holding the button still charges a heavier swing with any of them.

## Ranged

| Kind | What flies | Ammunition | Its own thing | Weak |
| --- | --- | --- | --- | --- |
| Bow | arrow, 240 fast | arrows from the quiver | range and rate; arrow types later | arrows must be made |
| Sling | a stone, 210 | stones from the bag | never runs out while you carry stone; the stone staggers (stuns) | low damage, short life |
| Javelin | the javelin itself, 250 | none: the thing in your hand is thrown | the hardest single ranged hit | one throw, then you fetch it (it lies where it fell, or at the beast's feet); lost in water |
| Throwing axe | the axe, spinning, 200 | none | a heavy, staggering hit | short range, one throw, fetched |

Other Viking-age ranged ideas, not built: a **harpoon** on a line for things in the sea; **fire arrows** lit from a torch
(set thatch and haystacks alight, scare the troll); a **bola** or weighted net to pin a deer; **throwing spears in a
bundle** (the bar slot holds three). A crossbow is out: it is not of this time and place.

## Where it shows

- `Items.KINDS` marks each kind `melee` or `ranged` (`thrown` for the javelin and axe, `ammo: 'stone'` for the sling).
  `Items.MELEE` and `Items.RANGED` list them; `Items.draw` has a drawing for each and `Items.icon` fits them to a slot.
- The engine reads the thing in hand through `api.items.weapon('sword')` (the melee thing) and `('bow')` (the ranged thing),
  builds the hit from the kind's profile (`stepData0`), moves the arm by `motion` (`thrustPose`, `chopPose` for the
  smash), and shoots by `RANGED` (`rangedOf`); thrown things call `api.onShoot(thing)` so the page takes it from the hand,
  and `api.onThrowLand(x, y, thing)` so it lies where it fell.
- The Combat Arena has a Weapons panel (one melee, one ranged, the material; F swaps). The game's Admin menu gives one
  copper weapon of each kind and stones for the sling; the starting hand weapon is now the **wooden club**, not a stick sword.
- Not built: training the hird in a weapon, weapon skill runes per kind, arrow types, the ranged ideas above, and any of
  this in the game's own crafting (copper smelting comes with the second island).
