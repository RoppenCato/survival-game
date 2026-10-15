# Tuning combat: what to test and which numbers move it (2026-10-15)

Robin asked to work through and tune the fights against animals, men and several at once. Everything below happens in the
**Combat Arena** (`combat-arena.html`), on the game's own engine and numbers. What you tune there goes to the game with one
button.

**Robin's first tuning (2026-10-15) is now the code's default:** the hit pause 0.75, the sword's windup 0.11, blow 0.4,
recovery 0.2, reach 50 and step 123, the boar's speed 1.1. The men no longer take the hero's weapon numbers (they swung in slow
motion with the new sword).

**The parry chain (2026-10-15):** a parried foe reels through your blows and comes out of it swinging, so you can parry again.
Each parry in a row adds to the stun and to your blows on him, up to x4. Its four numbers are under The feel of a hit (Chain).

## The Tuning panel

It sits on the right, under Beasts. Four groups of sliders:

| Group | What it holds |
| --- | --- |
| The feel of a hit | the hit pause on you and on what you strike, the push, the parry's moment with and without a shield, the parry stun, a tool's bite |
| Your weapon | the weapon chosen under You: windup, the blow, recovery, damage, reach, arc, the step into the blow, push, stagger, stamina |
| Men | their health, their blow, their windup, how many strike you at once, the least gap between two blows on you, help after how long |
| Beasts | pick a beast: its health, bite (out of your 100), speed, windup, how far it notices you |

- A number you have moved turns **green**. Hover its name for the code's own value.
- The beasts on the field take a beast's new numbers at once. A weapon or a man's number acts on the next blow.
- **Use in the game** hands every moved number to the game. The game reads it when it loads.
- **Take back** brings back what the game has now. **Defaults** puts every number back to the code's own.
- **Settings as text** shows only what you moved. Paste it to me and I make it the code's default.

Your working copy is kept in the browser, so the arena opens where you left it.

## What to try

Turn on **Show the blows** while tuning a weapon or a man: it draws reaches, arcs, windups and the parry moment. **Half speed**
and **A quarter** slow the clock to see a blow land. **The last blows** log lists every hit, block, parry and dodge with the
numbers.

**Animals, one at a time**
1. **Young boar.** The first fight of the game, with the wooden club and in cloth. It should be winnable carelessly but cost
   something. Levers: the young boar's health and bite, the club's windup and recovery.
2. **Boar.** The big island's. Its charge should be readable and dodgeable. Levers: windup, speed, bite.
3. **Wolf.** Night only, meant to be fled from rather than fought. Levers: bite, speed.
4. **Moose and bear.** The far, heavy ones. Each should feel like a decision. Levers: health, bite, windup.

**Several animals**
5. **Two boars**, **a boar and a wolf**, **three young boars**, **the night's pack**. Watch whether you can get out with a dash,
   and whether two bites ever land together.

**Men**
6. **One against you**, with each weapon on him in turn (the Men row). A man should show his blow coming and be beatable by
   reading it. Levers: his windup (base and times the weapon), his blow, his health.
7. **Two**, then **Two, one beside you**. Two should be clearly harder than one. Levers: striking at once, the least gap
   between blows on you.
8. **Five against five** and **with a bowman each**. You and four of yours. Levers: help comes after, men on you before others
   wait, and the **They come** row (one at a time, the pack, two at a time, by the odds, all at once).

**Your side**
9. Your weapon against a man who stands still (**Hold them still**): the windup and recovery decide how a blow feels in the
   hand. The parry: raise the guard (K or the right button) as a blow lands; the moment and the stun are under The feel of a hit.

## Where the numbers live

`Combat.tune` in `src/combat.js` holds the spec (`tuneDefaults`, `tuneDiff`, `beastNum`, `tuneBeast`). The game lays
`game.combat` over it on load and dresses its beasts from it, the young boar included (`boarYoung`). The arena's beasts use the
same numbers now: until today they bit for 12 whatever they were.
