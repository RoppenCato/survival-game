# The raid

Decided by Robin 2026-10-07 (the night of the villages): a raid should take about twenty minutes and is built from **loot spread out
behind doors that take blows**, **the heavy loot carried to the ship a piece at a time**, and **defenders who gather to the noise**.
No bell, no castle sending waves, fighting not the biggest part. Villagers run and hide; a place remembers you. Nothing is off
limits; reputation is the only brake. This is the list it was built from, and what each step is in the code.

## The list

1. **Guards are people in the engine.** A guard is one of the engine's enemies with a figure instead of a beast (`e.fig`, `e.human`,
   drawn by `drawHuman` in `src/combat.js`: the villagers' ink figure in an iron helm and mail with a sword that hangs at rest,
   rises behind the shoulder in the windup and comes round in the blow). The game dresses it (`guardSpec`, `wantKind` `'guard'`):
   24 health, 9 damage, the chase-and-lunge. It sleeps at its post (`e.post`, the gate or a stall) and wakes only to the alarm or a
   blow; awake, it gives up only when you are far gone (900 units), then walks back to its post.
2. **The alarm** (`raidAlarm(vi, x, y)`): raised by a blow on a locked door, a blow on a locked chest, any village box broken, a
   guard struck, or a heavy chest lifted. Every guard of that village hears it and comes to you (`e.heard`); the folk run home at a
   sprint and hide indoors; it fades thirty seconds after the last noise, the guards walk back, the folk come out with new lines
   ("You again. Take what you want and go.") and the village is marked raided (`seen.raided[vi]`, the day). The first time: "Word
   of this will spread."
3. **Doors that take blows.** The church, the hall and the store of a town, and a lone church, have **locked doors**
   (`locked` on the edge, set by `Village.make`). A locked door does not open as you come near and is solid (three circles in the
   engine's solids); the axe in gather mode is offered it (`harvest.list`, `doorHvOf`: 14 hit points); at zero it is **broken** and
   stands open for good.
4. **Loot spread out.** The storehouse's crates and barrels, the houses' chests (silver coins and goods in their slots, opened with
   E or broken with the axe), the hidden cellar, and the two **heavy chests**: the church's silver by the altar and the jarl's silver
   in the hall. A heavy chest is locked: the axe breaks the lock (6 blows), then it can be lifted.
5. **Carrying.** E at an unlocked heavy chest lifts it onto your shoulder (`carrying`): you walk at 0.7, the chest is drawn on your
   shoulder, E puts it down where you stand. E at your vessel stows it (`raft.cargo`). At home (inside your territory or within 700
   of the wreck) E at the vessel unloads the cargo as **silver** into the bag (`silver`, a new kind: hack-silver). Hirdmen carrying
   beside you are not built yet.
6. **Silver.** Village chests' coins are silver now; a slain guard drops a coin or two. Trading in silver comes with the trader.
7. **What is not built:** fire in thatch, hirdmen helping to carry, guards in the first biome's seats, a reputation that closes
   traders, the retreat under pursuit as its own moment (the guards simply chase until you are far).

## How it plays

Sail to a lowland island, moor at the town's jetty, walk in by the gate past the sleeping guards. Nothing happens until you make
noise. The storehouse's crates are the quiet loot. The church door takes a dozen blows and every guard in the town comes running
at the first; the church's silver is a locked chest by the altar, six more blows, then it is on your shoulder and you walk slowly
back to the ship with guards behind you. Stow it, go back for the jarl's chest if you dare. Sail home and unload.

## Checking it

`Combat.api.debug().raid()` gives the raid state, the guards, what is carried, and the functions to raise the alarm, lift, stow and
unload, for scripts. The game test done 2026-10-07: a fresh start, the hero at the town's church door, the door broken by blows,
the alarm raised, the guards awake and coming, the folk hidden, the lock broken, the chest lifted, carried, stowed and unloaded at
home as silver.
